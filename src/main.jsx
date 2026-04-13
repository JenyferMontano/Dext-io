import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[App] Service Workers no disponibles en este navegador');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/serviceworker.js', { scope: '/' })
      .then((registration) => {
        console.log('[App] Service Worker registrado:', registration.scope);

        if (registration.waiting) {
          console.log('[App] Hay un nuevo Service Worker en espera');
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            console.log('[App] Estado del SW:', installing.state);
          });
        });
      })
      .catch((err) => console.error('[App] Error al registrar el Service Worker:', err));
  });
}

/* El SW en localhost cacheaba /src/*.css (cache-first) → estilos viejos y layout en una columna. */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
} else if (import.meta.env.PROD) {
  registerServiceWorker();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
