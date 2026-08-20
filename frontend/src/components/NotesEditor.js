import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import CanLIISearch from './CanLIISearch';

export default function NotesEditor({ note, courseId, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(note?.title || '');
  const [contentHTML, setContentHTML] = useState(note?.content || '');
  const [references, setReferences] = useState(note?.references || []);
  const [showCanLII, setShowCanLII] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && note?.content) {
      editorRef.current.innerHTML = note.content;
    }
  }, [note]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (!title.trim() || !editorRef.current?.innerText.trim()) {
      alert('Title and content are required');
      return;
    }
    const htmlContent = editorRef.current.innerHTML;
    onSave(title, htmlContent);
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

  const handleRemoveReference = (refId) => {
    setReferences(references.filter((r) => r.id !== refId));
  };

  const FormatButton = ({ icon, command, value = null, tooltip }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command, value);
      }}
      title={tooltip}
      style={{
        padding: '8px 12px',
        backgroundColor: '#FFB3D9',
        border: '2px solid #4A4A4A',
        fontSize: '14px',
        cursor: 'pointer',
        fontWeight: '600',
      }}
    >
      {icon}
    </button>
  );

  const HighlightButton = ({ color, label }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand('backColor', color);
      }}
      title={`Highlight ${label}`}
      style={{
        width: '28px',
        height: '28px',
        backgroundColor: color,
        border: '2px solid #4A4A4A',
        cursor: 'pointer',
        padding: '0',
      }}
    />
  );

  return (
    <div>
      {/* Title Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <label htmlFor="title-input" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Note Title
        </label>
        <input
          id="title-input"
          type="text"
          placeholder="Give your note a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            fontSize: '18px',
            fontWeight: '600',
            padding: '12px',
            border: '2px solid #4A4A4A',
            backgroundColor: '#FFF9F0',
            fontFamily: 'VT323, monospace',
            width: '100%',
          }}
        />
      </div>

      {/* Formatting Toolbar */}
      <div
        style={{
          backgroundColor: '#E8D4D9',
          padding: '12px',
          border: '2px solid #4A4A4A',
          marginBottom: '20px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <FormatButton icon="B" command="bold" tooltip="Bold (Ctrl+B)" />
        <FormatButton icon="I" command="italic" tooltip="Italic (Ctrl+I)" />
        <FormatButton icon="U" command="underline" tooltip="Underline (Ctrl+U)" />
        <FormatButton icon="S" command="strikethrough" tooltip="Strikethrough" />

        <div style={{ width: '1px', height: '28px', backgroundColor: '#4A4A4A', margin: '0 4px' }} />

        <span style={{ fontSize: '12px', fontWeight: '600', marginRight: '4px' }}>Highlight:</span>
        <HighlightButton color="#FFFF00" label="Yellow" />
        <HighlightButton color="#FFD700" label="Gold" />
        <HighlightButton color="#FFB6C1" label="Pink" />
        <HighlightButton color="#B6E5FF" label="Blue" />
        <HighlightButton color="#C0FFC0" label="Green" />
      </div>

      {/* Ruled Paper Editor */}
      <div
        style={{
          backgroundColor: '#FFFEF5',
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              #E8E0D0 20px,
              #E8E0D0 21px
            ),
            repeating-linear-gradient(
              0deg,
              #F5F0E8 0px,
              #F5F0E8 27px,
              #D4C5B0 27px,
              #D4C5B0 28px
            )
          `,
          padding: '24px 28px',
          minHeight: '450px',
          border: '3px solid #4A4A4A',
          marginBottom: '20px',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => setContentHTML(editorRef.current?.innerHTML || '')}
          style={{
            outline: 'none',
            fontFamily: 'VT323, monospace',
            fontSize: '16px',
            lineHeight: '28px',
            color: '#4A4A4A',
            minHeight: '400px',
            wordWrap: 'break-word',
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
        >
          {!note && 'Start typing your notes here...'}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : '💾 Save Note'}
        </button>
        <button onClick={onCancel} className="secondary" disabled={loading}>
          Cancel
        </button>
        {note && (
          <button
            onClick={() => setShowCanLII(true)}
            style={{ backgroundColor: '#FFE8B6', marginLeft: 'auto', fontWeight: '600' }}
          >
            📚 Add CanLII Case
          </button>
        )}
      </div>

      {/* CanLII References */}
      {note && references.length > 0 && (
        <div className="card">
          <h3>📚 CanLII References</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {references.map((ref) => (
              <div
                key={ref.id}
                style={{
                  padding: '14px',
                  backgroundColor: '#F5EFE8',
                  border: '2px solid #4A4A4A',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px' }}>{ref.case_name}</strong>
                  {ref.case_year && <span> ({ref.case_year})</span>}
                  {ref.court && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Court: {ref.court}
                    </div>
                  )}
                  {ref.canlii_url && (
                    <a
                      href={ref.canlii_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '11px',
                        display: 'block',
                        marginTop: '6px',
                        wordBreak: 'break-all',
                        color: '#0066CC',
                        textDecoration: 'underline',
                      }}
                    >
                      {ref.canlii_url}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveReference(ref.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    backgroundColor: '#FFB3D9',
                    flexShrink: 0,
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
