import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

function ReviewMode({ courseId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { flashcards, fetchFlashcards, reviewFlashcard, deleteFlashcard, loading } = useStore();

  useEffect(() => {
    fetchFlashcards(courseId);
  }, [courseId, fetchFlashcards]);

  if (loading && flashcards.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading flashcards...
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#999' }}>
          No flashcards yet. Upload and process documents to generate flashcards!
        </p>
      </div>
    );
  }

  const card = flashcards[currentIndex];
  const progress = `${currentIndex + 1} / ${flashcards.length}`;

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  };

  const handleReview = async (difficulty) => {
    await reviewFlashcard(card.id, difficulty);
    handleNext();
  };

  const handleDelete = async () => {
    await deleteFlashcard(card.id, courseId);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#999' }}>Card {progress}</p>
      </div>

      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flashcard-label">{flipped ? 'ANSWER' : 'QUESTION'}</div>
        <div className="flashcard-side">
          {flipped ? card.answer : card.question}
        </div>
        <div style={{ fontSize: '12px', marginTop: '20px', opacity: 0.6 }}>
          Type: {card.card_type} | Difficulty: {card.difficulty}/5
        </div>
      </div>

      <div className="review-controls">
        <button onClick={handlePrevious} className="secondary">
          ← Previous
        </button>
        <button onClick={() => handleReview(1)}>Easy</button>
        <button onClick={() => handleReview(3)}>Medium</button>
        <button onClick={() => handleReview(5)}>Hard</button>
        <button onClick={handleNext} className="secondary">
          Next →
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={handleDelete} className="secondary" style={{ background: '#ffdddd' }}>
          🗑️ Delete Card
        </button>
      </div>
    </div>
  );
}

export default ReviewMode;
