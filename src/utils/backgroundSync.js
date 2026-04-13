/** Registra la etiqueta `dext-sync-posts` definida en `public/serviceworker.js`. */
export function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('[App] Background Sync no disponible');
    return Promise.resolve(false);
  }
  return navigator.serviceWorker.ready.then((reg) =>
    reg.sync
      .register('dext-sync-posts')
      .then(() => {
        console.log('[App] Background Sync registrado: dext-sync-posts');
        return true;
      })
      .catch((e) => {
        console.warn('[App] Error al registrar Background Sync:', e);
        return false;
      })
  );
}
