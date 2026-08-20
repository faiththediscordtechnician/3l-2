import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NotesEditor from './NotesEditor';
import NotesList from './NotesList';
import Alert from './Alert';

export default function NotesPage({ courseId }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'edit'

  useEffect(() => {
    fetchCourse();
    fetchNotes();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourseName(response.data.name);
    } catch (err) {
      setError('Failed to load course');
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/courses/${courseId}/notes`);
      setNotes(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch notes');
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
    setView('edit');
  };

  const handleSelectNote = async (note) => {
    try {
      const response = await axios.get(`/api/notes/${note.id}`);
      setSelectedNote(response.data);
      setView('edit');
    } catch (err) {
      setError('Failed to load note');
    }
  };

  const handleSave = async (title, content) => {
    setLoading(true);
    try {
      if (selectedNote) {
        // Update existing
        await axios.put(`/api/notes/${selectedNote.id}`, { title, content });
        setSuccess('Note updated');
      } else {
        // Create new
        await axios.post(`/api/courses/${courseId}/notes`, { title, content });
        setSuccess('Note created');
      }
      fetchNotes();
      setView('list');
      setSelectedNote(null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/notes/${noteId}`);
      setSuccess('Note deleted');
      fetchNotes();
      setLoading(false);
    } catch (err) {
      setError('Failed to delete note');
      setLoading(false);
    }
  };

  const handleExportPDF = async (noteId) => {
    try {
      const response = await axios.get(`/api/notes/${noteId}/export-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `note-${noteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  return (
    <div className="container">
      <div className="nav-tabs">
        <button
          className={view === 'list' ? 'active' : ''}
          onClick={() => setView('list')}
        >
          📝 Notes
        </button>
        <span style={{ marginTop: '10px', color: '#666', fontWeight: '500' }}>
          {courseName}
        </span>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {view === 'list' ? (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleCreateNew} style={{ marginRight: '10px' }}>
              ✏️ New Note
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="card">
              <p>No notes yet. Create one to get started!</p>
            </div>
          ) : (
            <NotesList
              notes={notes}
              onSelect={handleSelectNote}
              onDelete={handleDelete}
              onExport={handleExportPDF}
            />
          )}
        </>
      ) : (
        <NotesEditor
          note={selectedNote}
          courseId={courseId}
          onSave={handleSave}
          onCancel={() => {
            setView('list');
            setSelectedNote(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}
