import React from 'react'
import './NoteList.css'

export default function NoteList({ notes, selectedId, onSelect, onDelete, onPin }) {
  return (
    <div className="note-list">
      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No notes yet!</p>
          <p className="small">Create one to get started</p>
        </div>
      ) : (
        notes.map(note => (
          <div
            key={note.id}
            className={`note-item ${selectedId === note.id ? 'active' : ''}`}
            onClick={() => onSelect(note)}
          >
            <div className="note-item-header">
              <div className="note-item-title">
                {note.pinned && <span className="pin-badge">📌</span>}
                <h3>{note.title}</h3>
              </div>
              <div className="note-item-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin(note.id, !note.pinned)
                  }}
                  className="action-btn"
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  {note.pinned ? '📌' : '📍'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this note?')) {
                      onDelete(note.id)
                    }
                  }}
                  className="action-btn delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="note-item-preview">
              {note.content.replace(/<[^>]*>/g, '').substring(0, 60)}...
            </p>
            <span className="note-item-date">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
