import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

window.addEventListener('error', (e) => {
  const msg = e.message || 'Unknown Error';
  const file = e.filename || 'unknown';
  const line = e.lineno || '0';
  const stack = (e.error && e.error.stack) ? e.error.stack : 'No stack trace';

  // Ignore generic cross-origin or injected script errors that TVs often throw
  if (msg === 'Script error.' && (line === 0 || line === '0' || file === 'unknown' || file === '')) {
    console.warn('Ignored generic script error:', e);
    return;
  }

  const d = document.createElement('div');
  d.id = 'error-overlay';
  d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;z-index:99999;padding:2rem;overflow:auto;word-wrap:break-word;font-size:14px;font-family:monospace;';
  
  d.innerHTML = `
    <h1 style="color:white;text-align:left;font-size:24px;margin-bottom:1rem;">WINDOW ERROR</h1>
    <p><strong>URL:</strong> ${window.location.href}</p>
    <p><strong>Message:</strong> ${msg}</p>
    <p><strong>Location:</strong> ${file}:${line}</p>
    <pre style="background:rgba(0,0,0,0.3);padding:1rem;margin-top:1rem;white-space:pre-wrap;font-size:12px;">${stack}</pre>
    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
      <button onclick="window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now()" style="padding:1rem 2rem;background:white;color:red;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">HARD RELOAD APP</button>
      <button onclick="document.getElementById('error-overlay').remove()" style="padding:1rem 2rem;background:#550000;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">ZAMKNIJ BŁĄD (IGNORUJ)</button>
    </div>
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#330000', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>REACT ERROR BOUNDARY</h2>
          <p><strong>Message:</strong> {this.state.error && this.state.error.toString()}</p>
          <pre style={{ background: '#000', padding: '1rem', whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '1rem' }}>
            {this.state.error && this.state.error.stack}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now()} style={{ padding: '1rem 2rem', marginTop: '2rem', background: 'white', color: 'black', fontWeight: 'bold' }}>HARD RELOAD</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
