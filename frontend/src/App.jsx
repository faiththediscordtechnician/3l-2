import React, { useState, useEffect, useCallback } from 'react'
import NoteEditor from './components/NoteEditor'
import NoteList from './components/NoteList'
import './App.css'

const API_URL = '/api'

export default function App() {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch notes from backend
  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notes/`)
      const data = await response.json()
      setNotes(data)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  }, [])

  // Load notes on mount
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Create new note
  const createNote = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Note',
          content: '',
          pinned: false
        })
      })
      const newNote = await response.json()
      setNotes(prev => [newNote, ...prev])
      setSelectedNote(newNote)
    } catch (err) {
      console.error('Failed to create note:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update note
  const updateNote = useCallback(async (noteId, updates) => {
    try {
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const updated = await response.json()
      setNotes(prev => prev.map(n => n.id === noteId ? updated : n))
      if (selectedNote?.id === noteId) {
        setSelectedNote(updated)
      }
    } catch (err) {
      console.error('Failed to update note:', err)
    }
  }, [selectedNote])

  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    try {
      await fetch(`${API_URL}/notes/${noteId}`, { method: 'DELETE' })
      setNotes(prev => prev.filter(n => n.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }, [selectedNote])

  // Filter notes based on search
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort: pinned first, then by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Quick Notes</h1>
        <button onClick={createNote} disabled={loading}>
          {loading ? 'Creating...' : '✨ New Note'}
        </button>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <NoteList
            notes={sortedNotes}
            selectedId={selectedNote?.id}
            onSelect={setSelectedNote}
            onDelete={deleteNote}
            onPin={(id, pinned) => updateNote(id, { pinned })}
          />
        </aside>

        <main className="editor-area">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onUpdate={updateNote}
            />
          ) : (
            <div className="no-note">
              <p>📌 Select a note to edit or create a new one</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
