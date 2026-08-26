-- CreateTable courses
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "professor" VARCHAR(255),
    "courseCode" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable documents
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "courseId" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "s3Key" VARCHAR(255) NOT NULL,
    "s3Url" VARCHAR(255),
    "fileSize" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "documents_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable document_summaries
CREATE TABLE "document_summaries" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "documentId" INTEGER NOT NULL,
    "holding" TEXT,
    "reasoning" TEXT,
    "keyPoints" TEXT[],
    "statuteReferences" TEXT[],
    "relatedDoctrine" VARCHAR(255),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_summaries_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable flashcards
CREATE TABLE "flashcards" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "documentId" INTEGER,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "cardType" VARCHAR(50),
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "flashcards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "flashcards_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable study_sessions
CREATE TABLE "study_sessions" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "cardsReviewed" INTEGER NOT NULL DEFAULT 0,
    "cardsMastered" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "study_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable networking_contacts
CREATE TABLE "networking_contacts" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255),
    "firm" VARCHAR(255),
    "connectedBy" VARCHAR(255),
    "contactDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" VARCHAR(50),
    "followUpDate" TIMESTAMP(3)
);

-- CreateTable class_notes
CREATE TABLE "class_notes" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_notes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable canlii_references
CREATE TABLE "canlii_references" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "noteId" INTEGER NOT NULL,
    "caseName" VARCHAR(255) NOT NULL,
    "caseYear" INTEGER,
    "court" VARCHAR(255),
    "canliUrl" VARCHAR(512),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "canlii_references_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "class_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable course_schedules
CREATE TABLE "course_schedules" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "courseCode" VARCHAR(50),
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(50) NOT NULL,
    "endTime" VARCHAR(50) NOT NULL,
    "room" VARCHAR(100),
    "locationCode" VARCHAR(50),
    "section" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");
