import React, { useState } from 'react';
import axios from 'axios';

export default function CanLIISearch({ onAddReference, onClose }) {
  const [query, setQuery] = useState('');
  const [caseName, setCaseName] = useState('');
  const [caseYear, setCaseYear] = useState('');
  const [court, setCourt] = useState('');
  const [canliiUrl, setCanliiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get('/api/canlii/search', { params: { query } });
      // Open CanLII search in new tab
      window.open(response.data.searchUrl, '_blank');
      setManualEntry(true);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = () => {
    if (!caseName.trim()) {
      alert('Case name is required');
      return;
    }

    onAddReference({
      case_name: caseName,
      case_year: caseYear ? parseInt(caseYear) : null,
      court,
      canlii_url: canliiUrl,
    });

    // Reset form
    setCaseName('');
    setCaseYear('');
    setCourt('');
    setCanliiUrl('');
    setManualEntry(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#FFF9F0',
        border: '2px solid #4A4A4A',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '4px 4px 12px rgba(0,0,0,0.2)',
      }}>
        <h3>📚 Add CanLII Case Reference</h3>

        {!manualEntry ? (
          <>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
              Search CanLII to find a case, then enter the details below:
            </p>

            <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search CanLII (e.g., Oakes test, Labour Law)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #4A4A4A',
                    fontSize: '14px',
                    fontFamily: 'VT323, monospace',
                  }}
                />
                <button type="submit" disabled={loading}>
                  {loading ? '...' : '🔍'}
                </button>
              </div>
            </form>

            <button
              onClick={() => setManualEntry(true)}
              className="secondary"
              style={{ width: '100%' }}
            >
              Or Enter Manually
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Case Name *</label>
              <input
                type="text"
                placeholder="e.g., R v Oakes"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Year (optional)</label>
              <input
                type="number"
                placeholder="e.g., 1986"
                value={caseYear}
                onChange={(e) => setCaseYear(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Court (optional)</label>
              <input
                type="text"
                placeholder="e.g., Supreme Court of Canada"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>CanLII URL (optional)</label>
              <input
                type="url"
                placeholder="https://canlii.ca/..."
                value={canliiUrl}
                onChange={(e) => setCanliiUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAddManual} style={{ flex: 1 }}>
                ✓ Add Reference
              </button>
              <button
                onClick={() => setManualEntry(false)}
                className="secondary"
                style={{ flex: 1 }}
              >
                Search Again
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '15px',
            backgroundColor: '#E8D4D9',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
