import React, { useState } from 'react';
import { useStore } from '../store';

function DocumentUpload({ courseId }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const { uploadDocument, loading } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    await uploadDocument(courseId, file, title);
    setFile(null);
    setTitle('');
  };

  return (
    <div className="card">
      <h3>Upload PDF Document</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Document Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., R v Askov"
          />
        </div>

        <div className="form-group">
          <label>PDF File *</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          {file && <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
            Selected: {file.name}
          </p>}
        </div>

        <button type="submit" disabled={!file || loading}>
          {loading ? 'Uploading...' : '📤 Upload'}
        </button>
      </form>
    </div>
  );
}

export default DocumentUpload;
