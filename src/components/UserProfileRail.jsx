import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../router/routes.js';
import { getUser, getPosts } from '../services/postsService.js';

const DEMO_USER_ID = 'u1';

function formatKarma(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k`;
  return String(n);
}

export function UserProfileRail() {
  const [user, setUser] = useState(null);
  const [postTotal, setPostTotal] = useState(null);
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    getUser(DEMO_USER_ID).then(setUser);
  }, []);

  useEffect(() => {
    getPosts({ page: 1, userId: DEMO_USER_ID }).then((res) => setPostTotal(res.total));
  }, []);

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

  return (
    <aside className="portada-col-profile" aria-label="Perfil">
      <h2 className="rail-block-title">Perfil</h2>
      {user ? (
        <div className="profile-rail-card">
          <Link to={routes.user(user.id)} className="profile-rail-handle">
            @{user.username}
          </Link>
          <p className="profile-rail-display">{user.displayName}</p>
          <dl className="profile-rail-stats">
            <div>
              <dt>Reconocimientos</dt>
              <dd>{formatKarma(user.karma ?? 0)}</dd>
            </div>
            <div>
              <dt>Publicaciones totales</dt>
              <dd>{postTotal != null ? postTotal : '—'}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="profile-rail-muted">Cargando…</p>
      )}

      <div className="profile-rail-block">
        <h3 className="rail-block-subtitle">
          Notificaciones
          <span className="notif-dot" aria-hidden />
        </h3>
        <p className="profile-rail-muted">Sin alertas nuevas en esta demostración.</p>
      </div>

      
    </aside>
  );
}
