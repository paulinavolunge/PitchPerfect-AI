
console.log('App.tsx: File loaded');

import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

console.log('App.tsx: All imports loaded successfully');

// Loading component with timeout
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

// Simple home page with working navigation
const HomePage = () => {
  console.log('HomePage: Component rendered');
  
  useEffect(() => {
    console.log('HomePage: useEffect called');
  }, []);

  const handleGetStarted = () => {
    console.log('Button Clicked: Get Started');
    window.location.href = '/voice';
  };

  const handleVoiceTraining = () => {
    console.log('Button Clicked: Voice Training');
    window.location.href = '/voice';
  };

  const handleAnalytics = () => {
    console.log('Button Clicked: Analytics');
    window.location.href = '/analytics';
  };

  const handleRoleplay = () => {
    console.log('Button Clicked: AI Roleplay');
    window.location.href = '/roleplay';
  };

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🎯 PitchPerfect AI
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          Welcome to your Sales Training Platform
        </p>
        <div style={{ 
          padding: '2rem', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#fff' }}>✅ App Status</h2>
          <p style={{ margin: '0', fontSize: '1.1rem' }}>
            Core app is loading successfully! React is working.
          </p>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <div 
            style={{ 
              padding: '1.5rem', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={handleVoiceTraining}
          >
            <h3>🎤 Voice Training</h3>
            <p>Practice your sales pitches with AI feedback</p>
          </div>
          <div 
            style={{ 
              padding: '1.5rem', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={handleAnalytics}
          >
            <h3>📊 Analytics</h3>
            <p>Track your progress and improvements</p>
          </div>
          <div 
            style={{ 
              padding: '1.5rem', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={handleRoleplay}
          >
            <h3>🤖 AI Roleplay</h3>
            <p>Practice with realistic customer scenarios</p>
          </div>
        </div>
        <button
          onClick={handleGetStarted}
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: '#fff',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

// Placeholder components for testing
const VoiceTrainingPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1>🎤 Voice Training Section Works!</h1>
    <p>This is the Voice Training placeholder page.</p>
    <button onClick={() => window.location.href = '/'} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
      Back to Home
    </button>
  </div>
);

const AnalyticsPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1>📊 Analytics Section Works!</h1>
    <p>This is the Analytics placeholder page.</p>
    <button onClick={() => window.location.href = '/'} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
      Back to Home
    </button>
  </div>
);

const RoleplayPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1>🤖 AI Roleplay Section Works!</h1>
    <p>This is the AI Roleplay placeholder page.</p>
    <button onClick={() => window.location.href = '/'} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
      Back to Home
    </button>
  </div>
);

function App() {
  console.log('App: Component function called');
  
  const [loadingState, setLoadingState] = useState('initial');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App: useEffect started');
    
    const loadApp = async () => {
      try {
        console.log('App: Starting app loading simulation');
        
        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('App: Loading complete, setting state to complete');
        setLoadingState('complete');
        
      } catch (err) {
        console.error('App: Error during loading:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoadingState('error');
      }
    };

    loadApp();
  }, []);

  console.log('App: Current loading state:', loadingState);

  if (loadingState === 'initial') {
    console.log('App: Rendering loading component');
    return <LoadingWithTimeout />;
  }

  if (loadingState === 'error') {
    console.log('App: Rendering error state');
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Loading Error</h1>
          <p style={{ marginBottom: '1rem' }}>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  console.log('App: Rendering main app with routes');
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/voice" element={<VoiceTrainingPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/roleplay" element={<RoleplayPage />} />
      <Route path="*" element={
        <div style={{ 
          padding: '2rem', 
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" style={{ 
            color: '#2563eb',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid #2563eb',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            Go Home
          </a>
        </div>
      } />
    </Routes>
  );
}

console.log('App: Component defined, exporting');
export default App;
