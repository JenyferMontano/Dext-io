import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommunities } from '../services/postsService.js';
import { routes } from '../router/routes.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function Communities() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCommunities()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <EmptyState
        title="No se pudieron cargar las secciones"
        message="Comprueba tu conexión o abre la edición en línea al menos una vez para conservar en caché."
      />
    );
  }

  return (
    <div className="page communities-page">
      <header className="page-header">
        <span className="nav-kicker">índice</span>
        <h1>Secciones</h1>
        <p className="page-sub">Cada sección se agrupa por categorias</p>
      </header>
      {loading ? <p className="load-hint">Cargando…</p> : null}
      <ul className="community-list">
        {list.map((c) => (
          <li key={c.id} className="community-card">
            <Link to={routes.community(c.slug)} className="community-link">
              <span className="community-name">{c.name}</span>
              <span className="community-desc">{c.description}</span>
              <span className="community-meta">{c.members.toLocaleString('es')} lectores</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
