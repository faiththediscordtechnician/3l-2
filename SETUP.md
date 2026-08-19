# 3L Study App - Setup & Testing Guide

## Prerequisites

- Node.js 16+ installed
- Railway account with PostgreSQL database
- Cloudflare R2 S3 credentials
- Anthropic API key

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces: backend, frontend, CLI.

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Your `.env` file should have:
- `DATABASE_URL` (Railway PostgreSQL)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Cloudflare R2)
- `S3_BUCKET`, `S3_ENDPOINT` (Cloudflare R2)
- `ANTHROPIC_API_KEY` (Claude Haiku)
- `FRONTEND_URL=http://localhost:3000`
- `PORT=3001`

### 3. Start Backend & Frontend

Open two terminal windows:

**Terminal 1 - Backend API (port 3001):**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend (port 3000):**
```bash
npm run frontend:dev
```

Wait for both to start. Frontend should auto-open at `http://localhost:3000`.

## First-Time Setup: Initialize Database

### Local Testing

If you're running on Railway's network, initialize the database:

```bash
curl -X POST http://localhost:3001/api/admin/init-db
```

Response:
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

This creates:
- `courses` table (pre-populated with 5 courses)
- `documents` table (PDF metadata)
- `document_summaries` table (Claude-generated summaries)
- `flashcards` table (study cards)
- `study_sessions` table
- `networking_contacts` table

## Testing the Full Pipeline

### Step 1: View Courses

Navigate to `http://localhost:3000` and see your 5 courses:
- Labour Law I (Prof. Malhotra)
- Public Law
- International Law
- Globalization and Law
- Mediation

### Step 2: Upload a PDF

1. Click "Labour Law I" to select the course
2. Click "📄 Documents" tab
3. Click "📤 Upload PDF" tab
4. Upload a PDF file (or use dummy text)
5. Click "Upload"

### Step 3: Process Document with Claude

1. In the Documents list, click "Process & Generate Flashcards"
2. **Important:** Copy text content from your PDF and paste it in the textarea
   - In production, PDFs are automatically extracted from S3
   - For MVP testing, you manually paste the text
3. Click "🤖 Process with Claude"
4. Wait for Claude Haiku to analyze the document
5. Click "✨ Generate Flashcards"

### Step 4: Review Flashcards

1. Click "🎯 Review" tab
2. You'll see the first flashcard with a question
3. Click the card to flip and see the answer
4. Rate difficulty: Easy (1) → Medium (3) → Hard (5)
5. Cards progress to the next one
6. Track your progress at the top

### Step 5: Manage Contacts

1. Click "👥 Contacts" tab
2. Add networking contacts from Prof. Malhotra
3. Track their status: Initial → Engaged → Articling Offer → Closed
4. Edit contacts to update follow-up dates

## API Endpoints (for manual testing)

### Database
```
POST /api/admin/init-db
```

### Courses
```
GET    /api/courses
GET    /api/courses/:id
GET    /api/courses/:id/documents
GET    /api/courses/:id/flashcards
```

### Documents
```
POST   /api/documents/upload              (multipart/form-data)
POST   /api/documents/:id/process         (body: { pdfText })
POST   /api/documents/:id/generate-flashcards
```

### Flashcards
```
GET    /api/flashcards/review             (spaced rep query)
PUT    /api/flashcards/:id                (update card)
POST   /api/flashcards/:id/review         (mark reviewed, body: { difficulty })
DELETE /api/flashcards/:id
```

### Contacts
```
GET    /api/contacts
POST   /api/contacts
PUT    /api/contacts/:id
```

## Troubleshooting

### "Application not found" on Railway

Your backend isn't deployed yet. Deploy it first:

```bash
# From project root
railway up
```

Or manually push to Railway via dashboard.

### "Cannot connect to backend"

Make sure:
1. Backend is running: `npm run backend:dev`
2. Database URL is correct in `.env`
3. Frontend `REACT_APP_API_URL` matches backend URL

### "Database connection refused"

The `postgres.railway.internal` hostname only works from Railway's network.

**Options:**
1. Deploy backend to Railway and call init-db from there
2. Use Railway CLI tunnel: `railway tunnel`
3. Get Railway's public PostgreSQL URL

### "AWS S3 upload fails"

Check:
1. `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
2. `S3_BUCKET` and `S3_ENDPOINT` match Cloudflare R2 settings
3. R2 bucket is public or credentials have full access

## N64 Pastel Theme

The frontend features a retro N64 aesthetic with:
- Pastel pink (#FFB3D9)
- Pastel blue (#B4D7FF)
- Pastel nude (#E8D4D9)
- Pastel gray (#F0E6DC)
- Pixelated font (VT323)
- Blocky buttons with shadow effects
- Retro color blocks

## Next Steps

After MVP testing:
1. ✅ CLI tool for terminal access
2. ✅ CanLII search integration
3. ✅ Spaced repetition algorithm refinement
4. ✅ Tauri desktop app wrapper
5. ✅ Offline sync support
