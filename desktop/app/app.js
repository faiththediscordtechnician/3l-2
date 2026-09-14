const { openDB } = window.idb || {};

let db;
let currentNoteId = null;
let autoSaveTimeout;
let syncTimeout;
let allNotes = [];

const API_URL = 'http://localhost:8000/api/notes';
const DB_NAME = 'QuickNotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

// Initialize IndexedDB
async function initDB() {
  if (!window.idb) {
    console.error('idb library not loaded');
    return;
  }

  db = await window.idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    }
  });

  await loadNotesFromDB();
  attachEventListeners();
  checkOnlineStatus();
  syncWithBackend();
}

// Load notes from IndexedDB
async function loadNotesFromDB() {
  const tx = db.transaction(STORE_NAME, 'readonly');
  allNotes = await tx.store.getAll();
  renderNotesList();
}

// Save note to IndexedDB
async function saveNoteToDB(note) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(note);
  allNotes = allNotes.filter(n => n.id !== note.id);
  allNotes.push(note);
  renderNotesList();
}

// Delete note from IndexedDB
async function deleteNoteFromDB(id) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.delete(id);
  allNotes = allNotes.filter(n => n.id !== id);
}

// Render notes list
function renderNotesList() {
  const container = document.getElementById('notesList');
  container.innerHTML = '';

  const sortedNotes = [...allNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (sortedNotes.length === 0) {
    container.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: #999;">No notes yet</div>';
    return;
  }

  sortedNotes.forEach(note => {
    const noteEl = document.createElement('div');
    noteEl.className = 'note-item' + (currentNoteId === note.id ? ' active' : '');

    const preview = note.content.substring(0, 100).replace(/<[^>]*>/g, '') || '(empty note)';
    const date = new Date(note.created_at).toLocaleDateString();

    noteEl.innerHTML = `
      <div class="note-item-title">${note.title || 'Untitled'} ${note.pinned ? '📌' : ''}</div>
      <div class="note-item-preview">${preview}</div>
      <div class="note-item-date">${date}</div>
      <div class="note-item-actions">
        <button class="btn-small" onclick="togglePin('${note.id}')">Pin</button>
        <button class="btn-small" onclick="deleteNote('${note.id}')">Delete</button>
      </div>
    `;

    noteEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('btn-small')) {
        loadNote(note.id);
      }
    });

    container.appendChild(noteEl);
  });
}

// Load a note for editing
async function loadNote(id) {
  const note = allNotes.find(n => n.id === id);
  if (!note) return;

  currentNoteId = id;
  document.getElementById('noSelection').hidden = true;
  document.getElementById('editorContainer').hidden = false;

  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').innerHTML = note.content;
  document.getElementById('noteDate').textContent = new Date(note.created_at).toLocaleString();

  document.getElementById('pinBtn').classList.toggle('active', note.pinned);

  renderNotesList();
}

// Create new note
function createNewNote() {
  const id = Date.now().toString();
  const note = {
    id,
    title: 'Untitled Note',
    content: '',
    pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced: false
  };

  allNotes.push(note);
  saveNoteToDB(note);
  loadNote(id);
}

// Toggle pin status
async function togglePin(id) {
  const note = allNotes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    note.updated_at = new Date().toISOString();
    note.synced = false;
    await saveNoteToDB(note);
    if (currentNoteId === id) {
      document.getElementById('pinBtn').classList.toggle('active', note.pinned);
    }
    syncWithBackend();
  }
}

// Delete note
async function deleteNote(id) {
  if (confirm('Delete this note?')) {
    await deleteNoteFromDB(id);
    if (currentNoteId === id) {
      currentNoteId = null;
      document.getElementById('noSelection').hidden = false;
      document.getElementById('editorContainer').hidden = true;
    }
    renderNotesList();
    syncWithBackend();
  }
}

// Auto-save current note
function autoSaveNote() {
  if (!currentNoteId) return;

  const note = allNotes.find(n => n.id === currentNoteId);
  if (!note) return;

  note.title = document.getElementById('noteTitle').value || 'Untitled Note';
  note.content = document.getElementById('noteContent').innerHTML;
  note.updated_at = new Date().toISOString();
  note.synced = false;

  saveNoteToDB(note);
  updateAutoSaveIndicator();

  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncWithBackend(), 3000);
}

// Update auto-save indicator
function updateAutoSaveIndicator() {
  const indicator = document.getElementById('autoSaveIndicator');
  indicator.textContent = 'Auto-saving...';
  indicator.classList.remove('saved');
}

// Check online status
function checkOnlineStatus() {
  const isOnline = navigator.onLine;
  const indicator = document.querySelector('.sync-status');

  if (isOnline) {
    indicator.textContent = 'Online';
    indicator.classList.add('online');
    syncWithBackend();
  } else {
    indicator.textContent = 'Offline';
    indicator.classList.remove('online');
  }
}

// Sync with backend
async function syncWithBackend() {
  if (!navigator.onLine) return;

  const unsyncedNotes = allNotes.filter(n => !n.synced);

  for (const note of unsyncedNotes) {
    try {
      const existingNote = allNotes.find(n => n.id === note.id);

      const response = await fetch(`${API_URL}/${note.id}`, {
        method: 'GET'
      });

      if (response.ok) {
        // Note exists on server, update it
        await fetch(`${API_URL}/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            pinned: note.pinned
          })
        });
      } else if (response.status === 404) {
        // Note doesn't exist on server, create it
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            pinned: note.pinned
          })
        });
      }

      note.synced = true;
      await saveNoteToDB(note);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Fetch notes from server to merge
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      const serverNotes = await response.json();

      for (const serverNote of serverNotes) {
        const localNote = allNotes.find(n => n.id === serverNote.id);

        if (!localNote) {
          // Add new note from server
          const newNote = {
            ...serverNote,
            synced: true
          };
          allNotes.push(newNote);
          await saveNoteToDB(newNote);
        } else if (new Date(serverNote.updated_at) > new Date(localNote.updated_at)) {
          // Update local note with server version
          localNote.title = serverNote.title;
          localNote.content = serverNote.content;
          localNote.pinned = serverNote.pinned;
          localNote.updated_at = serverNote.updated_at;
          localNote.synced = true;
          await saveNoteToDB(localNote);
        }
      }

      renderNotesList();
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Rich text editor commands
function applyFormat(command, value = null) {
  document.execCommand(command, false, value);
  document.getElementById('noteContent').focus();
}

// PDF Export
async function exportPDF() {
  if (!currentNoteId) return;

  const note = allNotes.find(n => n.id === currentNoteId);
  if (!note) return;

  // For Electron, we'd use a PDF library like pdfkit or use the print-to-PDF feature
  // For now, we'll use the browser's print functionality
  const printWindow = window.open('', '', 'height=400,width=800');
  printWindow.document.write(`
    <html>
      <head>
        <title>${note.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #D46B8B; }
          .content { line-height: 1.6; }
          .date { color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${note.title}</h1>
        <p class="date">${new Date(note.created_at).toLocaleString()}</p>
        <div class="content">${note.content}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Attach event listeners
function attachEventListeners() {
  document.getElementById('newNoteBtn').addEventListener('click', createNewNote);

  document.getElementById('noteTitle').addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(autoSaveNote, 1000);
  });

  document.getElementById('noteContent').addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(autoSaveNote, 1000);
  });

  document.getElementById('boldBtn').addEventListener('click', () => applyFormat('bold'));
  document.getElementById('italicBtn').addEventListener('click', () => applyFormat('italic'));
  document.getElementById('underlineBtn').addEventListener('click', () => applyFormat('underline'));
  document.getElementById('listBtn').addEventListener('click', () => applyFormat('insertUnorderedList'));
  document.getElementById('highlightBtn').addEventListener('click', () => {
    const color = document.getElementById('highlightColor').value;
    applyFormat('backColor', color);
  });

  document.getElementById('pinBtn').addEventListener('click', () => {
    if (currentNoteId) togglePin(currentNoteId);
  });

  document.getElementById('deleteBtn').addEventListener('click', () => {
    if (currentNoteId) deleteNote(currentNoteId);
  });

  document.getElementById('exportBtn').addEventListener('click', exportPDF);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allNotes.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    );

    const container = document.getElementById('notesList');
    container.innerHTML = '';

    const sortedNotes = [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    sortedNotes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = 'note-item' + (currentNoteId === note.id ? ' active' : '');

      const preview = note.content.substring(0, 100).replace(/<[^>]*>/g, '') || '(empty note)';
      const date = new Date(note.created_at).toLocaleDateString();

      noteEl.innerHTML = `
        <div class="note-item-title">${note.title || 'Untitled'} ${note.pinned ? '📌' : ''}</div>
        <div class="note-item-preview">${preview}</div>
        <div class="note-item-date">${date}</div>
        <div class="note-item-actions">
          <button class="btn-small" onclick="togglePin('${note.id}')">Pin</button>
          <button class="btn-small" onclick="deleteNote('${note.id}')">Delete</button>
        </div>
      `;

      noteEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-small')) {
          loadNote(note.id);
        }
      });

      container.appendChild(noteEl);
    });
  });

  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);
}

// Load idb library dynamically
async function loadIDBLibrary() {
  if (window.idb) {
    initDB();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js';
    script.onload = initDB;
    document.head.appendChild(script);
  }
}

// Start app
document.addEventListener('DOMContentLoaded', loadIDBLibrary);
