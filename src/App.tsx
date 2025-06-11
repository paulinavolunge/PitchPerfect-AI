
import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

console.log('App: Component file loaded');

// Simple loading component
const SimpleLoading = () => {
  console.log('App: SimpleLoading rendered');
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui'
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
        <p>Loading...</p>
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

// Simple home page component
const HomePage = () => {
  console.log('App: HomePage rendered');
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '1rem' }}>PitchPerfect AI</h1>
      <p style={{ marginBottom: '1rem' }}>Welcome to PitchPerfect AI - Your Sales Training Platform</p>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>App Status</h2>
        <p style={{ margin: 0, color: '#075985' }}>✅ Core app is loading successfully</p>
      </div>
    </div>
  );
};

// App loading states
type LoadingState = 'initial' | 'basic' | 'complete' | 'error';

function App() {
  console.log('App: Main component rendering');
  const [loadingState, setLoadingState] = useState<LoadingState>('initial');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App: useEffect running');
    
    const loadApp = async () => {
      try {
        console.log('App: Setting basic state');
        setLoadingState('basic');
        
        // Simulate a brief loading period
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('App: Setting complete state');
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
    console.log('App: Showing initial loading');
    return <SimpleLoading />;
  }

  if (loadingState === 'error') {
    console.log('App: Showing error state');
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
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

  console.log('App: Rendering main app');
  
  return (
    <HelmetProvider>
      <Helmet>
        <title>PitchPerfect AI</title>
      </Helmet>
      
      <Suspense fallback={<SimpleLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={
            <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
              <h1>Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" style={{ color: '#2563eb' }}>Go Home</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </HelmetProvider>
  );
}

console.log('App: Component defined, exporting');
export default App;
