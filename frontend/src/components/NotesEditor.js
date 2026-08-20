import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CanLIISearch from './CanLIISearch';

export default function NotesEditor({ note, courseId, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [references, setReferences] = useState(note?.references || []);
  const [showCanLII, setShowCanLII] = useState(false);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }
    onSave(title, content);
  };

  const handleAddReference = async (refData) => {
    try {
      const response = await axios.post(`/api/notes/${note.id}/references`, refData);
      setReferences([...references, response.data]);
      setShowCanLII(false);
    } catch (err) {
      alert('Failed to add reference: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveReference = async (refId) => {
    // Note: would need a DELETE endpoint for references
    setReferences(references.filter((r) => r.id !== refId));
  };

  return (
    <div>
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="title-input">Title</label>
          <input
            id="title-input"
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginTop: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="content-textarea">Content</label>
          <textarea
            id="content-textarea"
            placeholder="Your notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ marginTop: '8px', minHeight: '300px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Note'}
          </button>
          <button onClick={onCancel} className="secondary" disabled={loading}>
            Cancel
          </button>
          {note && (
            <button
              onClick={() => setShowCanLII(true)}
              style={{ backgroundColor: '#FFE8B6', marginLeft: 'auto' }}
            >
              📚 Add CanLII Case
            </button>
          )}
        </div>
      </div>

      {note && references.length > 0 && (
        <div className="card">
          <h3>📚 CanLII References</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {references.map((ref) => (
              <div key={ref.id} style={{
                padding: '12px',
                backgroundColor: '#F5F5F5',
                border: '1px solid #DDD',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <strong>{ref.case_name}</strong>
                  {ref.case_year && <span> ({ref.case_year})</span>}
                  {ref.court && <div style={{ fontSize: '12px', color: '#666' }}>Court: {ref.court}</div>}
                  {ref.canlii_url && (
                    <a href={ref.canlii_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: '12px',
                      display: 'block',
                      marginTop: '4px',
                      wordBreak: 'break-all',
                    }}>
                      {ref.canlii_url}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveReference(ref.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#FFB3D9',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCanLII && note && (
        <CanLIISearch onAddReference={handleAddReference} onClose={() => setShowCanLII(false)} />
      )}
    </div>
  );
}
