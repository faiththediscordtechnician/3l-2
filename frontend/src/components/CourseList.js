import React, { useEffect } from 'react';
import { useStore } from '../store';

function CourseList({ onSelectCourse }) {
  const { courses, loading, fetchCourses } = useStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div> Loading courses...
      </div>
    );
  }

  return (
    <div>
      <h2>Your Courses (Fall 2026)</h2>
      <div className="grid">
        {courses.map((course) => (
          <div
            key={course.id}
            className="grid-item"
            onClick={() => onSelectCourse(course.id)}
          >
            <h4>{course.name}</h4>
            <p>{course.professor ? `Prof. ${course.professor}` : 'No professor assigned'}</p>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
              Click to manage
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseList;
