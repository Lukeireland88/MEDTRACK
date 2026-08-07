import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

const baseUrl = import.meta.env.BASE_URL;
const routerBasename =
  baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <PreferencesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
