import React, { useEffect, useState } from 'react';

export default function Cat() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Animation disabled - keeping cat static
    setPosition({ x: 20, y: window.innerHeight - 60 });
  }, []);

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
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        bottom: '20px',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        🐈‍⬛
      </div>
    </div>
  );
}
