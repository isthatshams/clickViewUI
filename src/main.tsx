import React from 'react';
import ReactDOM from 'react-dom/client';
import { startTokenRefreshCheck } from './utils/auth';
import App from './App';
import './index.css';

// Function to clear invalid tokens on startup
const clearInvalidTokensOnStartup = () => {
  const currentPath = window.location.pathname;
  const publicRoutes = ['/', '/about', '/signin', '/signup', '/forgot-password', '/reset-password', '/check-email'];
  
  // If we're on a public route and there are tokens, clear them to prevent redirects
  if (publicRoutes.includes(currentPath)) {
    const hasTokens = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
    if (hasTokens) {
      console.log('Clearing tokens on public route startup');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('tempPassword');
    }
  }
};

// Clear invalid tokens on startup
clearInvalidTokensOnStartup();

// Start token refresh check
startTokenRefreshCheck();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
