# 3L Law School Study App

A comprehensive study application for Marie's 3L courses at University of Ottawa, featuring PDF document processing, flashcard generation, and spaced repetition learning.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React (web UI)
- **CLI:** Node.js CLI tool
- **Database:** PostgreSQL (Railway)
- **Storage:** Cloudflare S3 (R2)
- **LLM:** Anthropic Claude Haiku API

## Project Structure

```
├── backend/          # Express API server
├── frontend/         # React web UI
├── cli/              # Terminal CLI tool
├── .env.example      # Environment template
└── README.md
```

## Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/faiththediscordtechnician/3l-2.git
cd 3l-2
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required credentials:
- **Railway PostgreSQL** (`DATABASE_URL`)
- **Cloudflare S3/R2** (AWS keys, bucket, endpoint)
- **Anthropic API Key** (`ANTHROPIC_API_KEY`)

### 3. Initialize Database

```bash
npm run backend:migrate
```

This creates the PostgreSQL schema with:
- `courses` — 3L course definitions
- `documents` — Uploaded PDFs with metadata
- `document_summaries` — Claude-generated case summaries
- `flashcards` — Generated study cards
- `study_sessions` — Study progress tracking
- `networking_contacts` — Professional networking tracker

### 4. Start Development

**Backend API (runs on port 3001):**
```bash
npm run backend:dev
```

**Frontend (runs on port 3000):**
```bash
npm run frontend:dev
```

**CLI Tool:**
```bash
npm run cli:dev
```

Or run all at once:
```bash
npm run dev
```

## Core Features (MVP)

- [x] Database schema
- [ ] PDF upload to S3
- [ ] Claude Haiku document processing
- [ ] Flashcard generation (case briefs, doctrine, statutes)
- [ ] Basic flashcard review engine
- [ ] CanLII search integration
- [ ] Networking contact tracker

## Courses (Fall 2026)

- Labour Law I (union-side, under Malhotra)
- Public Law
- International Law
- Globalization and Law
- Mediation

## API Endpoints (TBD)

```
POST   /api/courses              - Create course
GET    /api/courses              - List courses
POST   /api/documents            - Upload PDF
POST   /api/flashcards           - Generate flashcards
PUT    /api/flashcards/:id       - Update flashcard
DELETE /api/flashcards/:id       - Delete flashcard
GET    /api/flashcards/review    - Get cards for review
POST   /api/study-sessions       - Start study session
GET    /api/contacts             - List networking contacts
```

## Next Steps

1. Add credentials to `.env`
2. Run `npm run backend:migrate` to initialize database
3. Start backend: `npm run backend:dev`
4. Build PDF upload API
5. Implement Claude document processing
6. Create flashcard generation logic
