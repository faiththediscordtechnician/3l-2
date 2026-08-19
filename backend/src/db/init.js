require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

async function initDb() {
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    console.log('Database URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');

    const client = await pool.connect();
    console.log('✅ Connected!');

    console.log('📋 Creating schema...');
    await client.query(schema);
    console.log('✅ Schema created/verified!');

    client.release();
    await pool.end();
    console.log('✨ Database initialization complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

initDb();
