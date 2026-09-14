from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./notes.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class NoteModel(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    content = Column(String(50000), default="")
    pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Schemas
class NoteSchema(BaseModel):
    id: int
    title: str
    content: str
    pinned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteCreateUpdate(BaseModel):
    title: str
    content: str = ""
    pinned: bool = False

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Quick Notes API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.get("/api/notes/", response_model=list[NoteSchema])
def list_notes(db: Session = Depends(get_db)):
    """Get all notes, sorted by pinned status and date"""
    notes = db.query(NoteModel).order_by(
        NoteModel.pinned.desc(),
        NoteModel.updated_at.desc()
    ).all()
    return notes

@app.post("/api/notes/", response_model=NoteSchema)
def create_note(note: NoteCreateUpdate, db: Session = Depends(get_db)):
    """Create a new note"""
    db_note = NoteModel(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.get("/api/notes/{note_id}", response_model=NoteSchema)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note"""
    note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.put("/api/notes/{note_id}", response_model=NoteSchema)
def update_note(note_id: int, note: NoteCreateUpdate, db: Session = Depends(get_db)):
    """Update a note"""
    db_note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    db_note.title = note.title
    db_note.content = note.content
    db_note.pinned = note.pinned
    db_note.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_note)
    return db_note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note"""
    db_note = db.query(NoteModel).filter(NoteModel.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted"}

@app.get("/api/health")
def health():
    """Health check"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
