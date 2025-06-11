
console.log('App.tsx: File loaded');

import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import LoadingWithTimeout from './components/LoadingWithTimeout';
import { VoiceTrainingPage, AnalyticsPage, RoleplayPage, NotFoundPage } from './components/PlaceholderPages';

console.log('App.tsx: All imports loaded successfully');

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
      <Route path="/" element={<Index />} />
      <Route path="/voice" element={<VoiceTrainingPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/roleplay" element={<RoleplayPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

console.log('App: Component defined, exporting');
export default App;
