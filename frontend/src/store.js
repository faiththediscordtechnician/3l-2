import create from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useStore = create((set, get) => ({
  // State
  courses: [],
  documents: [],
  flashcards: [],
  contacts: [],
  currentCourseId: null,
  loading: false,
  error: null,
  success: null,

  // Actions
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  clearMessages: () => set({ error: null, success: null }),

  // Courses
  fetchCourses: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      set({ courses: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch courses', loading: false });
    }
  },

  setCurrentCourse: (courseId) => set({ currentCourseId: courseId }),

  // Documents
  fetchDocuments: async (courseId) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/api/courses/${courseId}/documents`);
      set({ documents: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch documents', loading: false });
    }
  },

  uploadDocument: async (courseId, file, title) => {
    set({ loading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      formData.append('title', title || file.name);

      const response = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ success: 'Document uploaded successfully', loading: false });
      get().fetchDocuments(courseId);
      return response.data.document;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to upload document', loading: false });
    }
  },

  processDocument: async (documentId, courseId, pdfText) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_URL}/api/documents/${documentId}/process`,
        { pdfText }
      );
      set({ success: 'Document processed successfully', loading: false });
      get().fetchDocuments(courseId);
      return response.data.summary;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to process document', loading: false });
    }
  },

  generateFlashcards: async (documentId, courseId) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${API_URL}/api/documents/${documentId}/generate-flashcards`
      );
      set({
        success: `Generated ${response.data.flashcards_created} flashcards`,
        loading: false,
      });
      get().fetchFlashcards(courseId);
      return response.data.flashcards;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to generate flashcards', loading: false });
    }
  },

  // Flashcards
  fetchFlashcards: async (courseId) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/api/courses/${courseId}/flashcards`);
      set({ flashcards: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch flashcards', loading: false });
    }
  },

  updateFlashcard: async (cardId, data) => {
    try {
      const response = await axios.put(`${API_URL}/api/flashcards/${cardId}`, data);
      set((state) => ({
        flashcards: state.flashcards.map((c) => (c.id === cardId ? response.data : c)),
        success: 'Flashcard updated',
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to update flashcard' });
    }
  },

  reviewFlashcard: async (cardId, difficulty) => {
    try {
      const response = await axios.post(`${API_URL}/api/flashcards/${cardId}/review`, {
        difficulty,
      });
      set((state) => ({
        flashcards: state.flashcards.map((c) => (c.id === cardId ? response.data : c)),
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to review flashcard' });
    }
  },

  deleteFlashcard: async (cardId, courseId) => {
    try {
      await axios.delete(`${API_URL}/api/flashcards/${cardId}`);
      set((state) => ({
        flashcards: state.flashcards.filter((c) => c.id !== cardId),
        success: 'Flashcard deleted',
      }));
      get().fetchFlashcards(courseId);
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to delete flashcard' });
    }
  },

  // Contacts
  fetchContacts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/api/contacts`);
      set({ contacts: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch contacts', loading: false });
    }
  },

  addContact: async (contact) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_URL}/api/contacts`, contact);
      set((state) => ({
        contacts: [response.data, ...state.contacts],
        success: 'Contact added',
        loading: false,
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to add contact', loading: false });
    }
  },

  updateContact: async (contactId, data) => {
    try {
      const response = await axios.put(`${API_URL}/api/contacts/${contactId}`, data);
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === contactId ? response.data : c)),
        success: 'Contact updated',
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to update contact' });
    }
  },
}));
