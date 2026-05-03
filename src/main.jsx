import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

window.addEventListener('error', (e) => {
  const d = document.createElement('div');
  d.id = 'error-overlay';
  d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;z-index:99999;padding:2rem;overflow:auto;word-wrap:break-word;font-size:14px;font-family:monospace;';
  
  const msg = e.message || 'Unknown Error';
  const file = e.filename || 'unknown';
  const line = e.lineno || '0';
  const stack = (e.error && e.error.stack) ? e.error.stack : 'No stack trace';
  
  d.innerHTML = `
    <h1 style="color:white;text-align:left;font-size:24px;margin-bottom:1rem;">APPLICATION ERROR</h1>
    <p><strong>Message:</strong> ${msg}</p>
    <p><strong>Location:</strong> ${file}:${line}</p>
    <pre style="background:rgba(0,0,0,0.3);padding:1rem;margin-top:1rem;white-space:pre-wrap;font-size:12px;">${stack}</pre>
    <button onclick="location.reload()" style="margin-top:2rem;padding:1rem 2rem;background:white;color:red;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">RELOAD APP</button>
  `;
  document.body.appendChild(d);
});

window.addEventListener('unhandledrejection', (e) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:darkred;color:white;z-index:99999;padding:1rem;word-wrap:break-word;font-size:12px;overflow:auto;max-height:50%;';
  const stack = (e.reason && e.reason.stack) ? e.reason.stack : (e.reason || 'No reason');
  d.innerHTML = `
    <strong>PROMISE REJECTION:</strong> ${stack}
    <button onclick="location.reload()" style="margin-left:1rem;padding:0.5rem;background:white;color:darkred;border:none;border-radius:4px;cursor:pointer;">Reload</button>
  `;
  document.body.appendChild(d);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
