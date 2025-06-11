
import React, { useEffect, useState } from 'react';

const LoadingWithTimeout = () => {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    console.log('LoadingWithTimeout: useEffect started');
    
    // Update seconds counter
    const secondsInterval = setInterval(() => {
      setSecondsElapsed(prev => {
        const newSeconds = prev + 1;
        console.log(`LoadingWithTimeout: ${newSeconds} seconds elapsed`);
        return newSeconds;
      });
    }, 1000);

    // Set timeout to show error after 5 seconds
    const timeout = setTimeout(() => {
      console.log('LoadingWithTimeout: Timeout reached - showing error message');
      setTimeoutReached(true);
    }, 5000);

    return () => {
      clearInterval(secondsInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (timeoutReached) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
          Loading Failed
        </h1>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          The app took too long to load. Please check the console for errors.
        </p>
        <p style={{ marginBottom: '2rem', fontSize: '14px', color: '#888' }}>
          Waited {secondsElapsed} seconds
        </p>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              console.log('User clicked Try Again');
              window.location.reload();
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => {
              console.log('User clicked Open Console');
              // Check if Chrome DevTools API is available
              const isChrome = 'chrome' in window && (window as any).chrome?.runtime;
              if (isChrome) {
                console.log('Chrome detected - please open DevTools manually (F12)');
              }
              alert('Please open your browser\'s developer console (F12) to see error details');
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Check Console
          </button>
          <a 
            href="/test.html"
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            Test Basic HTML
          </a>
        </div>
        <details style={{ maxWidth: '600px' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Debugging Info</summary>
          <div style={{ textAlign: 'left', fontSize: '12px', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
            <p><strong>React:</strong> {React.version}</p>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <h2 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 8px 0' }}>
          PitchPerfect AI
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
          Loading... ({secondsElapsed}s)
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingWithTimeout;
