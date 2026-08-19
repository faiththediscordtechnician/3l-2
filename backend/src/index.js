require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { uploadPDF } = require('./services/s3');
const { processPDF, generateFlashcards } = require('./services/claude');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Serve React frontend from build directory (if it exists)
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
const fs = require('fs');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  console.log('✅ Serving React frontend from build directory');
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
        name VARCHAR(255) NOT NULL,
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

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
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
        documents: '/api/courses/:id/documents',
        flashcards: '/api/courses/:id/flashcards'
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
const PORT = process.env.PORT || 3001;
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
