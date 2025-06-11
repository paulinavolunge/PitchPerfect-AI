import React from 'react';

export const VoiceTrainingPage = () => {
  console.log('VoiceTrainingPage component rendered');
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎤 Voice Training Section Works!</h1>
      <p>This is the Voice Training placeholder page.</p>
      <p>Route: /voice-training</p>
      <button 
        onClick={() => {
          console.log('Back to Home clicked from Voice Training');
          window.location.href = '/';
        }} 
        style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}
      >
        Back to Home
      </button>
    </div>
  );
};

export const AnalyticsPage = () => {
  console.log('AnalyticsPage component rendered');
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Analytics Section Works!</h1>
      <p>This is the Analytics placeholder page.</p>
      <p>Route: /analytics</p>
      <button 
        onClick={() => {
          console.log('Back to Home clicked from Analytics');
          window.location.href = '/';
        }} 
        style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}
      >
        Back to Home
      </button>
    </div>
  );
};

export const RoleplayPage = () => {
  console.log('RoleplayPage component rendered');
  
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 AI Roleplay Section Works!</h1>
      <p>This is the AI Roleplay placeholder page.</p>
      <p>Route: /ai-roleplay</p>
      <button 
        onClick={() => {
          console.log('Back to Home clicked from AI Roleplay');
          window.location.href = '/';
        }} 
        style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}
      >
        Back to Home
      </button>
    </div>
  );
};

export const NotFoundPage = () => (
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
);
