import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommunities } from '../services/postsService.js';
import { routes } from '../router/routes.js';

export function PopularSectionsColumn() {
  const [list, setList] = useState([]);

  useEffect(() => {
    getCommunities().then((rows) => {
      setList([...rows].sort((a, b) => b.members - a.members));
    });
  }, []);

  return (
    <aside className="portada-col-sections" aria-label="Secciones populares">
      <h2 className="rail-block-title">Secciones populares</h2>
      <ul className="rail-section-list">
        {list.map((c) => (
          <li key={c.id} className="rail-section-item">
            <Link to={routes.community(c.slug)} className="rail-section-link">
              <span className="rail-section-slug">/c/{c.slug}</span>
              <span className="rail-section-name">{c.name}</span>
              <span className="rail-section-meta">
                {c.members.toLocaleString('es')} lectores
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to={routes.communities} className="rail-section-more">
        Ver índice completo
      </Link>
    </aside>
  );
}
