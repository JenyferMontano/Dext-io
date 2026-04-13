import { useState } from 'react';
import { registerBackgroundSync } from '../utils/backgroundSync.js';

function mockPushSubscribe() {
  if (!('serviceWorker' in navigator)) {
    console.log('[App] Demo push: no hay Service Worker');
    return;
  }
  console.log('[App] Demo push: en producción usarías registration.pushManager.subscribe()');
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage?.({ type: 'MOCK_PUSH' });
    console.log(
      '[App] Para probar el handler push del SW, usa Herramientas → Aplicación → Service Workers → Push (si existe)'
    );
  });
}

export function SyncFooterActions() {
  const [msg, setMsg] = useState('');

  return (
    <div className="footer-actions">
      <span className="footer-actions-kicker">Laboratorio</span>
      <button
        type="button"
        className="btn-ghost"
        onClick={() =>
          registerBackgroundSync().then((ok) =>
            setMsg(
              ok
                ? 'Cola de sincronización registrada (consola del navegador).'
                : 'Función no disponible en este navegador.'
            )
          )
        }
      >
        Sincronización en segundo plano
      </button>
      <button type="button" className="btn-ghost" onClick={mockPushSubscribe}>
        Prueba de notificación (consola)
      </button>
      {msg ? <span className="footer-msg">{msg}</span> : null}
    </div>
  );
}
