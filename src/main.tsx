import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Idle-time route preloading ────────────────────────────────────────────
// Vite splits each lazy route into its own JS chunk. Prefetching on idle
// ensures Cmd+K palette navigation resolves in <100ms (no network wait).
function scheduleIdlePreloads() {
  const preloads = [
    () => import('./pages/Dashboard'),
    () => import('./pages/Practice'),
    () => import('./pages/Tips'),
    () => import('./pages/Progress'),
    () => import('./pages/Subscription'),
    () => import('./pages/SessionDetail'),
    () => import('./components/KeyboardShortcutsModal'),
  ];

  if ('requestIdleCallback' in window) {
    preloads.forEach((load, i) => {
      (window as Window & typeof globalThis).requestIdleCallback(
        () => load().catch(() => { /* non-critical */ }),
        { timeout: 2000 + i * 300 },
      );
    });
  } else {
    // Safari / older browsers: stagger with setTimeout
    preloads.forEach((load, i) => setTimeout(() => load().catch(() => {}), 1500 + i * 250));
  }
}

// Fire after the first paint so startup performance is unaffected
requestAnimationFrame(scheduleIdlePreloads);
