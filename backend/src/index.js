require('dotenv').config();

// Global error handlers (catch any startup errors)
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { uploadPDF } = require('./services/s3');
const { processPDF, generateFlashcards } = require('./services/claude');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Setup frontend build path (will be served AFTER API routes)
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
const fs = require('fs');
const hasFrontend = fs.existsSync(frontendBuildPath);
if (hasFrontend) {
  console.log('✅ Frontend build directory found - will serve after API routes');
} else {
  console.log('⚠️ Frontend build directory not found - API only mode');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Database
let pool;
try {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set - database features will not work');
  } else {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('⚠️ Database error:', err.message);
    });

    // Test connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('⚠️ Database connection test failed:', err.message);
      } else {
        console.log('✅ Database connected');
      }
    });
  }
} catch (err) {
  console.error('❌ Database pool error:', err.message);
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'api working' });
});

// Initialize database schema
app.post('/api/admin/init-db', async (req, res) => {
  try {
    const client = await pool.connect();

    const schema = `
      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        professor VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Documents (PDFs) table
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        title VARCHAR(255) NOT NULL,
        s3_key VARCHAR(255) NOT NULL,
        s3_url VARCHAR(255),
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        processed BOOLEAN DEFAULT FALSE
      );

      -- Document summaries (Claude-generated)
      CREATE TABLE IF NOT EXISTS document_summaries (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id),
        holding TEXT,
        reasoning TEXT,
        key_points TEXT[],
        statute_references TEXT[],
        related_doctrine VARCHAR(255),
        generated_at TIMESTAMP DEFAULT NOW()
      );

      -- Flashcards table
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        document_id INTEGER REFERENCES documents(id),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        card_type VARCHAR(50),
        difficulty INTEGER DEFAULT 1,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        last_reviewed TIMESTAMP,
        review_count INTEGER DEFAULT 0
      );

      -- Study sessions table
      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        cards_reviewed INTEGER DEFAULT 0,
        cards_mastered INTEGER DEFAULT 0
      );

      -- Networking contacts table
      CREATE TABLE IF NOT EXISTS networking_contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        firm VARCHAR(255),
        connected_by VARCHAR(255),
        contact_date TIMESTAMP,
        notes TEXT,
        status VARCHAR(50),
        follow_up_date TIMESTAMP
      );

      -- Class notes table
      CREATE TABLE IF NOT EXISTS class_notes (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- CanLII case references
      CREATE TABLE IF NOT EXISTS canlii_references (
        id SERIAL PRIMARY KEY,
        note_id INTEGER NOT NULL REFERENCES class_notes(id) ON DELETE CASCADE,
        case_name VARCHAR(255) NOT NULL,
        case_year INTEGER,
        court VARCHAR(255),
        canlii_url VARCHAR(512),
        added_at TIMESTAMP DEFAULT NOW()
      );

      -- Insert 3L courses
      INSERT INTO courses (name, professor) VALUES
        ('Labour Law I', 'Malhotra'),
        ('Public Law', NULL),
        ('International Law', NULL),
        ('Globalization and Law', NULL),
        ('Mediation', NULL)
      ON CONFLICT DO NOTHING;
    `;

    await client.query(schema);
    client.release();

    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (err) {
    console.error('Init DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const result = await pool.query('SELECT * FROM courses ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get documents by course
app.get('/api/courses/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM documents WHERE course_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload PDF document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { courseId, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'courseId required' });
    }

    console.log(`📄 Uploading ${req.file.originalname} to course ${courseId}`);

    // Upload to S3
    const s3Result = await uploadPDF(req.file.buffer, req.file.originalname, courseId);

    // Save metadata to database
    const docResult = await pool.query(
      `INSERT INTO documents (course_id, title, s3_key, s3_url, file_size, processed)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [courseId, title || req.file.originalname, s3Result.s3_key, s3Result.s3_url, s3Result.file_size]
    );

    res.status(201).json({
      success: true,
      document: docResult.rows[0],
      message: 'File uploaded successfully. Process with /api/documents/:id/process',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process document with Claude
app.post('/api/documents/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    // Get document from DB
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // In production, would download PDF from S3 and extract text
    // For now, accept text content in request body
    const { pdfText } = req.body;

    if (!pdfText) {
      return res.status(400).json({ error: 'pdfText required in request body' });
    }

    console.log(`🤖 Processing document ${id} with Claude...`);

    // Process with Claude
    const summary = await processPDF(pdfText, document.title);

    // Save summary to database
    const summaryResult = await pool.query(
      `INSERT INTO document_summaries (document_id, holding, reasoning, key_points, statute_references, related_doctrine)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        summary.holding,
        summary.reasoning,
        summary.key_points || [],
        summary.statute_references || [],
        summary.related_doctrine,
      ]
    );

    // Mark document as processed
    await pool.query('UPDATE documents SET processed = TRUE WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      summary: summaryResult.rows[0],
      message: 'Document processed successfully. Generate flashcards with /api/documents/:id/generate-flashcards',
    });
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate flashcards from document
app.post('/api/documents/:id/generate-flashcards', async (req, res) => {
  try {
    const { id } = req.params;

    // Get document and summary
    const docResult = await pool.query(
      `SELECT d.*, s.* FROM documents d
       LEFT JOIN document_summaries s ON d.id = s.document_id
       WHERE d.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];

    if (!doc.holding) {
      return res.status(400).json({ error: 'Document not processed yet. Run /process first.' });
    }

    console.log(`✨ Generating flashcards for ${doc.title}...`);

    // Generate flashcards with Claude
    const cards = await generateFlashcards(
      {
        holding: doc.holding,
        reasoning: doc.reasoning,
        statute_references: doc.statute_references || [],
        related_doctrine: doc.related_doctrine,
      },
      doc.title,
      doc.course_id
    );

    // Save flashcards to database
    const insertedCards = [];
    for (const card of cards) {
      const result = await pool.query(
        `INSERT INTO flashcards (course_id, document_id, question, answer, card_type, difficulty, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [doc.course_id, id, card.question, card.answer, card.card_type, card.difficulty, card.tags || []]
      );
      insertedCards.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      flashcards_created: insertedCards.length,
      flashcards: insertedCards,
    });
  } catch (err) {
    console.error('Flashcard generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Merge multiple PDFs
app.post('/api/documents/merge', async (req, res) => {
  try {
    const { documentIds, title } = req.body;

    if (!documentIds || documentIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 documents required to merge' });
    }

    if (!title) {
      return res.status(400).json({ error: 'title required' });
    }

    console.log(`📦 Merging ${documentIds.length} PDFs...`);

    const { PDFDocument } = require('pdf-lib');
    const fetch = require('node-fetch');

    // Create new PDF document
    const mergedPdf = await PDFDocument.create();

    // Download and merge each PDF
    for (const docId of documentIds) {
      const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [docId]);
      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: `Document ${docId} not found` });
      }

      const doc = docResult.rows[0];
      console.log(`  📄 Adding ${doc.title}...`);

      try {
        // Download PDF from S3
        const response = await fetch(doc.s3_url);
        const buffer = await response.buffer();
        const pdf = await PDFDocument.load(buffer);

        // Copy all pages
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      } catch (err) {
        console.error(`Error processing ${doc.title}:`, err.message);
        return res.status(400).json({ error: `Failed to process ${doc.title}: ${err.message}` });
      }
    }

    // Save merged PDF to buffer
    const pdfBytes = await mergedPdf.save();

    // Upload merged PDF to S3
    const s3Key = `merged/${Date.now()}-${title}.pdf`;
    const s3Result = await uploadPDF(Buffer.from(pdfBytes), `${title}.pdf`, 'merged');

    // Save to database as a document (without course_id since it's merged)
    const result = await pool.query(
      `INSERT INTO documents (title, s3_key, s3_url, file_size, processed)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING *`,
      [title, s3Result.s3_key, s3Result.s3_url, pdfBytes.length]
    );

    res.status(201).json({
      success: true,
      message: `Merged ${documentIds.length} PDFs successfully`,
      document: result.rows[0],
    });
  } catch (err) {
    console.error('PDF merge error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get flashcards by course
app.get('/api/courses/:id/flashcards', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM flashcards WHERE course_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching flashcards:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get flashcards for review (not recently reviewed, higher difficulty first)
app.get('/api/flashcards/review', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM flashcards
      WHERE last_reviewed IS NULL OR last_reviewed < NOW() - INTERVAL '7 days'
      ORDER BY difficulty DESC, review_count ASC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching review cards:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update flashcard
app.put('/api/flashcards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, difficulty, tags } = req.body;

    const result = await pool.query(
      `UPDATE flashcards
       SET question = COALESCE($1, question),
           answer = COALESCE($2, answer),
           difficulty = COALESCE($3, difficulty),
           tags = COALESCE($4, tags)
       WHERE id = $5
       RETURNING *`,
      [question, answer, difficulty, tags, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating flashcard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark flashcard as reviewed
app.post('/api/flashcards/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { difficulty } = req.body;

    const result = await pool.query(
      `UPDATE flashcards
       SET last_reviewed = NOW(),
           review_count = review_count + 1,
           difficulty = COALESCE($1, difficulty)
       WHERE id = $2
       RETURNING *`,
      [difficulty, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking card as reviewed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete flashcard
app.delete('/api/flashcards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM flashcards WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting flashcard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get networking contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM networking_contacts ORDER BY contact_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, role, firm, connected_by, notes, status, follow_up_date } = req.body;

    const result = await pool.query(
      `INSERT INTO networking_contacts (name, role, firm, connected_by, notes, status, follow_up_date, contact_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [name, role, firm, connected_by, notes, status, follow_up_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, firm, notes, status, follow_up_date } = req.body;

    const result = await pool.query(
      `UPDATE networking_contacts
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           firm = COALESCE($3, firm),
           notes = COALESCE($4, notes),
           status = COALESCE($5, status),
           follow_up_date = COALESCE($6, follow_up_date)
       WHERE id = $7
       RETURNING *`,
      [name, role, firm, notes, status, follow_up_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get notes for a course
app.get('/api/courses/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM class_notes WHERE course_id = $1 ORDER BY updated_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single note with references
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const noteResult = await pool.query('SELECT * FROM class_notes WHERE id = $1', [id]);
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const refsResult = await pool.query(
      'SELECT * FROM canlii_references WHERE note_id = $1 ORDER BY added_at DESC',
      [id]
    );

    res.json({
      ...noteResult.rows[0],
      references: refsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new note
app.post('/api/courses/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    const result = await pool.query(
      'INSERT INTO class_notes (course_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [id, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const result = await pool.query(
      `UPDATE class_notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, content, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM class_notes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search CanLII
app.get('/api/canlii/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    // Use DuckDuckGo or similar to search with site:canlii.ca
    // For now, return search URLs and basic structure
    const canliiSearchUrl = `https://canlii.ca/en/search?q=${encodeURIComponent(query)}`;

    // Simple approach: return a URL for now
    // In production, could use an API or web scraping
    res.json({
      query,
      searchUrl: canliiSearchUrl,
      message: 'Search CanLII at the provided URL',
    });
  } catch (err) {
    console.error('Error searching CanLII:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add CanLII reference to note
app.post('/api/notes/:id/references', async (req, res) => {
  try {
    const { id } = req.params;
    const { case_name, case_year, court, canlii_url } = req.body;

    if (!case_name) {
      return res.status(400).json({ error: 'case_name required' });
    }

    const result = await pool.query(
      `INSERT INTO canlii_references (note_id, case_name, case_year, court, canlii_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, case_name, case_year, court, canlii_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding reference:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export note as PDF
app.get('/api/notes/:id/export-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const noteResult = await pool.query('SELECT * FROM class_notes WHERE id = $1', [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];
    const refsResult = await pool.query(
      'SELECT * FROM canlii_references WHERE note_id = $1 ORDER BY added_at DESC',
      [id]
    );

    // Generate simple PDF using text (can be upgraded to use a library like pdfkit)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="note-${id}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(note.title, { underline: true });
    doc.moveDown();

    // Content
    doc.fontSize(11).font('Helvetica');
    doc.text(note.content);
    doc.moveDown();

    // References
    if (refsResult.rows.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('CanLII References');
      doc.moveDown();
      refsResult.rows.forEach((ref) => {
        doc.fontSize(11).font('Helvetica');
        doc.text(`${ref.case_name} (${ref.case_year || 'N/A'})`);
        if (ref.court) doc.text(`Court: ${ref.court}`);
        if (ref.canlii_url) doc.text(`URL: ${ref.canlii_url}`);
        doc.moveDown(0.5);
      });
    }

    // Date
    doc.moveDown();
    doc.fontSize(9).text(`Generated: ${new Date().toISOString()}`);

    doc.end();
  } catch (err) {
    console.error('Error exporting PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets for /static path
if (hasFrontend) {
  const staticPath = path.join(frontendBuildPath, 'static');
  if (fs.existsSync(staticPath)) {
    app.use('/static', express.static(staticPath));
  }
}

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Block API routes - should have been caught by route handlers above
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({ error: 'API route not found: ' + req.path });
  }

  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      message: '3L Study App API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        courses: '/api/courses',
        admin: '/api/admin/init-db'
      }
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║    ✨ 3L Study App Backend Started     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${pool ? '✅ Connected' : '⚠️  Offline'}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log('');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, gracefully shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    if (pool) {
      pool.end(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, gracefully shutting down...');
  process.exit(0);
});
