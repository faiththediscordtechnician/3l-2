import React from 'react';

export default function NotesList({ notes, onSelect, onDelete, onExport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {notes.map((note) => (
        <div
          key={note.id}
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => onSelect(note)}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '8px', color: '#4A4A4A', fontSize: '16px', fontWeight: '600' }}>
              {note.title}
            </h4>
            <p style={{
              color: '#666',
              fontSize: '13px',
              lineHeight: '1.4',
              marginBottom: '8px',
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {note.content.substring(0, 150)}...
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Last updated: {new Date(note.updated_at).toLocaleDateString()}
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginLeft: '15px',
            flexShrink: 0,
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(note.id);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: '#FFE8B6',
              }}
            >
              📥
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: '#FFB3D9',
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
