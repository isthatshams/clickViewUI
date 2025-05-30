import React from 'react';
import ReactDOM from 'react-dom/client';
import { startTokenRefreshCheck } from './utils/auth';
import App from './App';
import './index.css';

// Start token refresh check
startTokenRefreshCheck();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
