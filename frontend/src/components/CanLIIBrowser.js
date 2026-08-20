import React, { useState, useRef, useEffect } from 'react';

export default function CanLIIBrowser({ onAddReference }) {
  const [query, setQuery] = useState('');
  const [iframeUrl, setIframeUrl] = useState('https://canlii.ca/en/');
  const iframeRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchUrl = `https://canlii.ca/en/search?q=${encodeURIComponent(query)}`;
    setIframeUrl(searchUrl);
  };

  const handleQuickSearch = (topic) => {
    const searchUrl = `https://canlii.ca/en/search?q=${encodeURIComponent(topic)}`;
    setIframeUrl(searchUrl);
    setQuery(topic);
  };

  const handleAddCase = () => {
    const caseName = prompt('Enter case name (e.g., R v Oakes):');
    if (!caseName) return;

    const caseYear = prompt('Enter year (optional):');
    const court = prompt('Enter court (optional):');
    const caseUrl = prompt('Enter CanLII URL (optional):');

    onAddReference({
      case_name: caseName,
      case_year: caseYear ? parseInt(caseYear) : null,
      court: court || null,
      canlii_url: caseUrl || null,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        border: '3px solid #4A4A4A',
        backgroundColor: '#FFF9F0',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          padding: '12px',
          borderBottom: '2px solid #4A4A4A',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Search CanLII..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '2px solid #4A4A4A',
            fontSize: '13px',
            fontFamily: 'VT323, monospace',
            backgroundColor: '#FFFBF8',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 12px',
            backgroundColor: '#FFB3D9',
            border: '2px solid #4A4A4A',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🔍
        </button>
      </form>

      {/* Quick Topics */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '2px solid #4A4A4A',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: '600', width: '100%' }}>Quick:</span>
        {['Charter', 'Labour', 'Contract', 'Tort', 'Criminal'].map((topic) => (
          <button
            key={topic}
            onMouseDown={(e) => {
              e.preventDefault();
              handleQuickSearch(topic);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#E8D4D9',
              border: '1px solid #4A4A4A',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '2px solid #4A4A4A',
          display: 'flex',
          gap: '6px',
        }}
      >
        <button
          onClick={handleAddCase}
          style={{
            padding: '6px 10px',
            fontSize: '11px',
            backgroundColor: '#B4D7FF',
            border: '2px solid #4A4A4A',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          ➕ Add Case
        </button>
      </div>

      {/* Embedded Browser */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          height: '100%',
        }}
        title="CanLII Browser"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
