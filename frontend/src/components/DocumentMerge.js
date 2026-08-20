import React, { useState } from 'react';
import axios from 'axios';

export default function DocumentMerge({ courseId, documents }) {
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const toggleSelect = (docId) => {
    setSelected((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === documents.length) {
      setSelected([]);
    } else {
      setSelected(documents.map((d) => d.id));
    }
  };

  const handleMerge = async () => {
    if (selected.length < 2) {
      setError('Select at least 2 documents to merge');
      return;
    }

    if (!title.trim()) {
      setError('Enter a title for the merged PDF');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/documents/merge', {
        documentIds: selected,
        title: title.trim(),
      });

      setSuccess(`✅ Merged ${selected.length} documents! File: ${response.data.document.title}`);
      setSelected([]);
      setTitle('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to merge documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>🔗 Merge PDF Documents</h3>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
        Combine multiple PDFs into one. Select chapters or related documents to merge.
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FFD6D6',
            border: '2px solid #4A4A4A',
            marginBottom: '15px',
            color: '#721C24',
            fontWeight: '600',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#D4EDDA',
            border: '2px solid #4A4A4A',
            marginBottom: '15px',
            color: '#155724',
            fontWeight: '600',
          }}
        >
          {success}
        </div>
      )}

      {/* Document Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontWeight: '600' }}>
          <input
            type="checkbox"
            checked={selected.length === documents.length && documents.length > 0}
            onChange={handleSelectAll}
            style={{ cursor: 'pointer' }}
          />
          Select All ({selected.length}/{documents.length})
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documents.length === 0 ? (
            <p style={{ color: '#666', fontSize: '13px' }}>No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <label
                key={doc.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: selected.includes(doc.id) ? '#FFB3D9' : '#EDE5E0',
                  border: '2px solid #4A4A4A',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(doc.id)}
                  onChange={() => toggleSelect(doc.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ flex: 1 }}>{doc.title}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Merged File Title */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="merged-title" style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
          Merged File Title
        </label>
        <input
          id="merged-title"
          type="text"
          placeholder="e.g., Labour Law I - All Chapters"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '2px solid #4A4A4A',
            backgroundColor: '#FFF9F0',
            fontFamily: 'VT323, monospace',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Merge Button */}
      <button
        onClick={handleMerge}
        disabled={loading || selected.length < 2}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: selected.length < 2 ? '#CCC' : '#FFB3D9',
          border: '2px solid #4A4A4A',
          fontWeight: '600',
          cursor: selected.length < 2 ? 'not-allowed' : 'pointer',
          opacity: selected.length < 2 ? 0.6 : 1,
        }}
      >
        {loading ? '⏳ Merging...' : `🔗 Merge ${selected.length} PDFs`}
      </button>

      <p style={{ fontSize: '11px', color: '#999', marginTop: '12px' }}>
        Tip: Arrange documents in order before merging. The merged PDF will preserve the order you see here.
      </p>
    </div>
  );
}
