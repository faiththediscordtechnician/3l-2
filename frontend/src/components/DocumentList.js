import React, { useState } from 'react';
import { useStore } from '../store';
import DocumentProcessing from './DocumentProcessing';

function DocumentList({ courseId, documents }) {
  const [processingId, setProcessingId] = useState(null);

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
            {!processingId && (
              <button
                className="secondary"
                onClick={() => setProcessingId(doc.id)}
              >
                Process & Generate Flashcards
              </button>
            )}
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
