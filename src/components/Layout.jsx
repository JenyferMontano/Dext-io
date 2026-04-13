import { useState, useEffect } from 'react';
import { Navbar } from './Navbar.jsx';
import { PopularSectionsColumn } from './PopularSectionsColumn.jsx';
import { UserProfileRail } from './UserProfileRail.jsx';
import { SyncFooterActions } from './SyncFooterActions.jsx';

export function Layout({ children }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="editorial-app">
      {isOffline && (
        <div className="offline-pill">
          Estás navegando sin conexión
        </div>
      )}
      <Navbar />
      <div className="portada-four">
        <PopularSectionsColumn />
        <div className="portada-slot-main">{children}</div>
        <UserProfileRail />
      </div>
      <footer className="site-footer" id="footer-app">
        <p className="site-footer-tagline">Dext.io · edición digital · aplicación sin recarga</p>
        <SyncFooterActions />
      </footer>
    </div>
  );
}
