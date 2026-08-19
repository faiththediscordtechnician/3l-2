import React, { useEffect } from 'react';
import { useStore } from '../store';

function Alert() {
  const { error, success, clearMessages } = useStore();

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  return (
    <>
      {error && (
        <div className="alert error" onClick={clearMessages}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="alert success" onClick={clearMessages}>
          ✅ {success}
        </div>
      )}
    </>
  );
}

export default Alert;
