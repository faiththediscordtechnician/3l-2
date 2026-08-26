# 🚂 Railway Deployment Guide

This app uses **Prisma ORM** with automatic migrations and seeding for the database. Railway can handle everything automatically!

## Environment Setup

### Required Environment Variables on Railway

Add these to your Railway project's Variables section:

```env
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# AWS S3 (Cloudflare R2)
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
S3_BUCKET=your_bucket_name
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_REGION=auto

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_key_here

# Server Config
PORT=3001
NODE_ENV=production
FRONTEND_URL=your_production_url
```

## Automatic Setup on Deploy

Railway will automatically:

1. **Install Dependencies** - Runs `npm install` which includes Prisma
2. **Run Migrations** - Prisma migration files in `backend/prisma/migrations/` automatically create all tables
3. **Generate Prisma Client** - `@prisma/client` is auto-generated

### No Manual Steps Needed! ✨

The migration system is declarative, so just push to GitHub and Railway handles the rest.

## Database Schema

The migration creates:
- `courses` - Law courses with professor info
- `documents` - Uploaded PDFs
- `document_summaries` - Claude-generated case summaries
- `flashcards` - Study cards
- `study_sessions` - Study progress
- `class_notes` - Class notes
- `canlii_references` - Legal case references
- `course_schedules` ⭐ NEW - Class times and locations
- `networking_contacts` - Professional contacts

## Seeding Schedule Data (Optional)

To populate Marie's Fall 2026 schedule, you have two options:

### Option 1: Call Seed Endpoint (Recommended)

After deployment, make a POST request to seed the schedule:

```bash
curl -X POST https://your-app.railway.app/api/admin/seed-schedule
```

This will:
- Create 5 law courses with professors
- Add all class times, rooms, and locations
- Populate the `course_schedules` table

### Option 2: Run Seed Script Locally (Before Deploy)

```bash
cd backend
npm run prisma:seed
```

Then commit the changes. But the endpoint above is cleaner for Railway!

## API Endpoints

### Schedule Endpoints (NEW)

- `POST /api/admin/seed-schedule` - Initialize course schedules
- `GET /api/schedule/today` - Get today's classes (auto-detects weekday)
- `GET /api/schedule/:day` - Get classes for specific day (0=Mon, 6=Sun)
- `GET /api/courses-with-schedules` - All courses with their schedules

### Example Response

```json
{
  "day": "Monday",
  "date": "2026-08-26",
  "classes": [
    {
      "courseName": "Labour Law I",
      "courseCode": "CML 3233",
      "professor": "Ravi A. Malhotra",
      "startTime": "14:30",
      "endTime": "15:50",
      "room": "57 Louis Pasteur (FTX) 137",
      "section": "A00"
    }
  ],
  "count": 1
}
```

## Frontend

The React component `frontend/src/components/TodaySchedule.js`:
- Automatically fetches today's schedule
- Shows class times with "Live" indicator when class is happening
- Calculates countdown to next class
- Updates every minute
- Responsive design (works on mobile)

## Troubleshooting

### "Database not connected" Error

- Verify `DATABASE_URL` is set in Railway Variables
- Check that the PostgreSQL service is running
- Run `prisma migrate deploy` to create tables

### Schedule Endpoints Return Empty

- Call `/api/admin/seed-schedule` to populate data first
- Verify `course_schedules` table exists: `SELECT COUNT(*) FROM course_schedules;`

### Prisma Client Generation Failed

- Delete `backend/node_modules/.prisma/` and `backend/node_modules/@prisma/`
- Run `npm install` again
- Railway does this automatically on deploy

## Scripts Available

```bash
# Backend only
cd backend

# Migrate database to latest schema
npm run prisma:migrate

# Seed courses and schedules
npm run prisma:seed

# Open Prisma Studio GUI (local dev only)
npm run prisma:studio

# Run development server
npm run dev

# Run production server
npm start
```

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (models)
│   ├── migrations/            # SQL migration files
│   │   └── 0_init/
│   │       └── migration.sql  # Creates all tables
│   └── seed.js                # Populates initial data
├── src/
│   ├── index.js               # Express API
│   ├── lib/prisma.js          # Prisma client
│   └── ...
└── package.json               # Includes prisma seed config
```

## Next Steps

1. ✅ Push code to GitHub (done!)
2. ✅ Add Railway project to GitHub repo
3. ✅ Add environment variables to Railway
4. ✅ Deploy (Railway runs migrations automatically)
5. Call `/api/admin/seed-schedule` to populate schedule data
6. Visit `https://your-app.railway.app` and click "📅 Today's Schedule"

Enjoy your date-aware schedule on Railway! 🎓
