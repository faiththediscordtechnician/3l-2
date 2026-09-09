import React, { useEffect, useState } from 'react';

export default function Cat() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let animationFrame;
    let x = 0;
    let dir = 1;
    let stepCount = 0;

    const animate = () => {
      if (!isPaused) {
        x += dir * 2;
        stepCount = (stepCount + 1) % 8;

        if (x > window.innerWidth - 60) {
          dir = -1;
        } else if (x < 0) {
          dir = 1;
        }

        setPosition({ x, y: window.innerHeight - 60 });
        setDirection(dir);
        setStep(Math.floor(stepCount / 4));
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  // Pixelated black cat with green eyes
  const catArt = (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '1',
        color: '#000',
        textShadow: '0 0 2px rgba(0,0,0,0.5)',
        transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
        whiteSpace: 'pre',
        imageRendering: 'pixelated',
      }}
    >
      {direction === 1
        ? `  /\\_/\\\n🟢👁️🟢\n  |_|\n   o o`
        : `  /\\_/\\\n🟢👁️🟢\n   |_|\n  o o`}
    </div>
  );

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          bottom: '20px',
          zIndex: 999,
          pointerEvents: 'none',
          animation: `walk ${step === 0 ? '0.2s' : '0.1s'} infinite`,
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            transform: direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          🐈‍⬛
        </div>
      </div>
      <button
        onClick={() => setIsPaused(!isPaused)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 12px',
          background: isPaused ? '#FFB3D9' : '#B4D7FF',
          border: '2px solid #333',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: '#333',
        }}
      >
        {isPaused ? '▶️ Play' : '⏸️ Pause'}
      </button>
    </>
  );
}
