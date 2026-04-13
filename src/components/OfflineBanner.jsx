import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner" role="status">
      <span className="offline-banner-kicker">Aviso de red</span>
      <span className="offline-banner-body">
        Sin conexión — se muestra el archivo disponible en caché en esta sesión.
      </span>
    </div>
  );
}
