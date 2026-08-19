import React, { useState } from 'react';
import { useStore } from '../store';

function DocumentProcessing({ documentId, courseId, onComplete }) {
  const [pdfText, setPdfText] = useState('');
  const [step, setStep] = useState('extract');
  const { processDocument, generateFlashcards, loading } = useStore();

  const handleExtract = async () => {
    if (!pdfText.trim()) {
      useStore.setState({ error: 'Please paste PDF text content' });
      return;
    }
    setStep('processing');
    await processDocument(documentId, courseId, pdfText);
    setStep('generate');
  };

  const handleGenerate = async () => {
    setStep('generating');
    await generateFlashcards(documentId, courseId);
    setStep('complete');
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '6px' }}>
      {step === 'extract' && (
        <>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
            Paste PDF text content:
          </label>
          <textarea
            value={pdfText}
            onChange={(e) => setPdfText(e.target.value)}
            placeholder="Copy all text from the PDF and paste here..."
            style={{ width: '100%', minHeight: '150px', marginBottom: '10px' }}
          />
          <button onClick={handleExtract} disabled={loading || !pdfText.trim()}>
            {loading ? 'Processing...' : '🤖 Process with Claude'}
          </button>
        </>
      )}

      {step === 'processing' && (
        <div className="loading">
          <div className="spinner"></div>
          Processing document with Claude...
        </div>
      )}

      {step === 'generate' && (
        <>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            ✅ Document processed! Ready to generate flashcards.
          </p>
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : '✨ Generate Flashcards'}
          </button>
        </>
      )}

      {step === 'generating' && (
        <div className="loading">
          <div className="spinner"></div>
          Generating flashcards...
        </div>
      )}

      {step === 'complete' && (
        <>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            ✅ Flashcards generated! Check the Review tab to start studying.
          </p>
          <button onClick={onComplete} className="secondary">
            Done
          </button>
        </>
      )}
    </div>
  );
}

export default DocumentProcessing;
