import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import Header from './components/Header';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import ReviewMode from './components/ReviewMode';
import ContactsPage from './components/ContactsPage';
import NotesPage from './components/NotesPage';
import Alert from './components/Alert';
import './App.css';

function App() {
  const [page, setPage] = useState('courses');
  const { courses, currentCourseId, fetchCourses, clearMessages } = useStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseSelect = (courseId) => {
    useStore.setState({ currentCourseId: courseId });
    setPage('course-detail');
  };

  return (
    <div className="app">
      <Header />
      <div className="container">
        <Alert />

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={page === 'courses' ? 'active' : ''}
            onClick={() => setPage('courses')}
          >
            📚 Courses
          </button>
          {currentCourseId && (
            <>
              <button
                className={page === 'course-detail' ? 'active' : ''}
                onClick={() => setPage('course-detail')}
              >
                📄 Documents
              </button>
              <button
                className={page === 'review' ? 'active' : ''}
                onClick={() => setPage('review')}
              >
                🎯 Review
              </button>
              <button
                className={page === 'notes' ? 'active' : ''}
                onClick={() => setPage('notes')}
              >
                📝 Notes
              </button>
            </>
          )}
          <button
            className={page === 'contacts' ? 'active' : ''}
            onClick={() => setPage('contacts')}
          >
            👥 Contacts
          </button>
        </nav>

        {/* Pages */}
        {page === 'courses' && <CourseList onSelectCourse={handleCourseSelect} />}

        {page === 'course-detail' && currentCourseId && (
          <CourseDetail courseId={currentCourseId} />
        )}

        {page === 'review' && currentCourseId && <ReviewMode courseId={currentCourseId} />}

        {page === 'notes' && currentCourseId && (
          <NotesPage courseId={currentCourseId} />
        )}

        {page === 'contacts' && <ContactsPage />}
      </div>
    </div>
  );
}

export default App;
