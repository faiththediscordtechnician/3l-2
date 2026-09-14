# 📝 Quick Notes MVP

A fast, cute note-taking app with N64 aesthetic. Features auto-save, rich text editing, pinning, and PDF export.

## Features

✨ **Create, edit, delete notes**
📌 **Pin important notes** - Pinned notes appear at the top
💾 **Auto-save** - Debounced saves every 1 second locally, sync to backend every 30 seconds
🔄 **Backend sync** - All changes sync to the server
📝 **Rich text editor**:
   - **Bold**, *italic*, <u>underline</u> formatting
   - 🎨 Highlight text with custom colors
   - 📄 PDF export with title & date
⏰ **Timestamps** - See when notes were created
🎯 **N64 aesthetic** - Pastel colors + Press Start 2P fonts
⚡ **No animations** - Instant feedback only
🎨 **Cute design** - Playful UI with retro vibes

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: FastAPI + SQLAlchemy
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deployment**: Docker container with Nginx + Supervisor + Uvicorn

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8000`
API docs at `http://localhost:8000/docs`

## Docker Deployment

```bash
docker build -t quick-notes .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  quick-notes
```

App runs on `http://localhost:8080`

## Environment Variables

```
DATABASE_URL=sqlite:///./notes.db  # SQLite for dev, PostgreSQL for prod
```

## API Endpoints

- `GET /api/notes/` - List all notes
- `POST /api/notes/` - Create a new note
- `GET /api/notes/{id}` - Get a specific note
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note
- `GET /api/health` - Health check

## Colors

- `--pastel-pink: #FFF5F7`
- `--pink-accent: #FFE4E8`
- `--cherry-blossom: #D46B8B`
- `--baby-blue: #A8D5E2`
- `--light-blue: #E8F4F8`

## Fonts

- Headers: Press Start 2P
- Body: VT323

## Offline App

Desktop app with persistent local storage coming soon! 🚀
