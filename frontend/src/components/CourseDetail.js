import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DocumentMerge from './DocumentMerge';

function CourseDetail({ courseId }) {
  const [tab, setTab] = useState('upload');
  const { courses, documents, fetchDocuments } = useStore();

  useEffect(() => {
    fetchDocuments(courseId);
  }, [courseId, fetchDocuments]);

  const course = courses.find((c) => c.id === parseInt(courseId));

  return (
    <div>
      <h2>{course?.name || 'Course'}</h2>

      <div className="tabs">
        <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>
          📤 Upload PDF
        </button>
        <button
          className={tab === 'documents' ? 'active' : ''}
          onClick={() => setTab('documents')}
        >
          📚 Documents ({documents.length})
        </button>
        {documents.length > 1 && (
          <button
            className={tab === 'merge' ? 'active' : ''}
            onClick={() => setTab('merge')}
          >
            🔗 Merge PDFs
          </button>
        )}
      </div>

      {tab === 'upload' && <DocumentUpload courseId={courseId} />}
      {tab === 'documents' && <DocumentList courseId={courseId} documents={documents} />}
      {tab === 'merge' && <DocumentMerge courseId={courseId} documents={documents} />}
    </div>
  );
}

export default CourseDetail;
