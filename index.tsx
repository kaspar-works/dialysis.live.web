
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentry } from './config/sentry';

// Initialize error tracking before app renders
initSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
