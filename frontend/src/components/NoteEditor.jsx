import React, { useState, useEffect, useRef, useCallback } from 'react'
import './NoteEditor.css'

export default function NoteEditor({ note, onUpdate }) {
  const [title, setTitle] = useState(note.title)
  const [isSaving, setIsSaving] = useState(false)
  const contentRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  // Update title when a different note is selected
  useEffect(() => {
    setTitle(note.title)
  }, [note.id, note.title])

  // Auto-save handler (debounced)
  const handleAutoSave = useCallback((newTitle, newContent) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setIsSaving(true)
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(note.id, {
        title: newTitle,
        content: newContent
      })
      setIsSaving(false)
    }, 1000)
  }, [note.id, onUpdate])

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    handleAutoSave(newTitle, contentRef.current?.innerHTML ?? '')
  }

  const handleContentChange = () => {
    handleAutoSave(title, contentRef.current?.innerHTML ?? '')
  }

  // Rich text formatting
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value)
    contentRef.current?.focus()
    handleContentChange()
  }

  const exportPDF = () => {
    const element = document.createElement('div')
    element.innerHTML = `
      <h1>${title}</h1>
      <p>${new Date(note.created_at).toLocaleString()}</p>
      <div>${contentRef.current?.innerHTML ?? ''}</div>
    `
    // Simple PDF export using print
    const printWindow = window.open('', '', 'height=400,width=800')
    printWindow.document.write(element.innerHTML)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="note-editor">
      <div className="editor-toolbar">
        <button onClick={() => applyFormat('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button onClick={() => applyFormat('italic')} title="Italic">
          <em>I</em>
        </button>
        <button onClick={() => applyFormat('underline')} title="Underline">
          <u>U</u>
        </button>
        <div className="toolbar-divider"></div>
        <button onClick={() => applyFormat('createUnorderedList')} title="Bullet List">
          • List
        </button>
        <div className="toolbar-divider"></div>
        <input
          type="color"
          onChange={(e) => applyFormat('backColor', e.target.value)}
          title="Highlight color"
          className="color-picker"
        />
        <button onClick={exportPDF} title="Export as PDF">
          📄 PDF
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        className="note-title"
        placeholder="Note title..."
      />

      <div className="editor-meta">
        <span>{new Date(note.created_at).toLocaleString()}</span>
        {isSaving && <span className="saving">💾 Saving...</span>}
      </div>

      <div
        key={note.id}
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        className="note-content"
        placeholder="Start typing..."
        dangerouslySetInnerHTML={{ __html: note.content }}
      />
    </div>
  )
}
