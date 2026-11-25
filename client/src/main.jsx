import './styles/tokens.css';
import './styles/ui.css';
import './index.css';
import './lib/theme.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from './lib/queryClient';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { initSentry } from './lib/sentry';
import App from './App';

// Initialize privacy-preserving error reporting
initSentry();

// Request persistent browser storage for offline data
if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}

// Register service worker for offline app shell caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration skipped/failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                fontSize: '13px',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: 'var(--primary)',
                  secondary: 'var(--on-primary)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--danger)',
                  secondary: 'var(--on-primary)',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>
);

