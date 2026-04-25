import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

window.addEventListener('error', (e) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;z-index:9999;padding:2rem;overflow:auto;word-wrap:break-word;font-size:12px;';
  d.innerText = `GLOBAL ERROR:\n${e.message}\n${e.filename}:${e.lineno}:${e.colno}\n${e.error && e.error.stack}`;
  document.body.appendChild(d);
});

window.addEventListener('unhandledrejection', (e) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:darkred;color:white;z-index:9999;padding:1rem;word-wrap:break-word;font-size:12px;bottom:0;overflow:auto;';
  d.innerText = `PROMISE REJECTION:\n${e.reason && e.reason.stack ? e.reason.stack : e.reason}`;
  document.body.appendChild(d);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
