import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AppThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { PeriodProvider } from './context/PeriodContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SandboxBanner } from './components/SandboxBanner';
import { registerServiceWorker } from './utils/pushNotifications';
import { isAdminHostname } from './utils/adminHost';

const isAdminSubdomain = isAdminHostname(window.location.hostname);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

if (!isAdminSubdomain) {
  registerServiceWorker();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {isAdminSubdomain ? (
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          ) : (
            <UserProvider>
              <PeriodProvider>
                <ToastProvider>
                  <SandboxBanner />
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </ToastProvider>
              </PeriodProvider>
            </UserProvider>
          )}
        </BrowserRouter>
      </QueryClientProvider>
    </AppThemeProvider>
  </React.StrictMode>
);
