import React, { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import DocumentProcessing from './DocumentProcessing';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DocumentList({ courseId, documents }) {
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(null);

  const handleRead = async (docId, title) => {
    try {
      setLoading(docId);
      const response = await axios.get(`${API_URL}/api/documents/${docId}/read-url`);
      window.open(response.data.url, '_blank');
    } catch (err) {
      alert('Failed to open document');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#999' }}>
          No documents yet. Upload a PDF to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      {documents.map((doc) => (
        <div key={doc.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3>{doc.title}</h3>
              <p style={{ fontSize: '12px', color: '#666' }}>
                {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                {doc.processed ? '✅ Processed' : '⏳ Waiting to process'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleRead(doc.id, doc.title)}
                disabled={loading === doc.id}
                style={{
                  background: '#B4D7FF',
                  border: '2px solid #333',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: loading === doc.id ? 'not-allowed' : 'pointer',
                  opacity: loading === doc.id ? 0.6 : 1,
                }}
              >
                {loading === doc.id ? '📖 Opening...' : '📖 Read'}
              </button>
              {!processingId && (
                <button
                  className="secondary"
                  onClick={() => setProcessingId(doc.id)}
                >
                  Process & Generate Flashcards
                </button>
              )}
            </div>
          </div>

          {processingId === doc.id && (
            <DocumentProcessing
              documentId={doc.id}
              courseId={courseId}
              onComplete={() => setProcessingId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default DocumentList;
