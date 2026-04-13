import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPosts, getUser, getCommunities } from '../services/postsService.js';
import { PostCard } from '../components/PostCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

function formatoFechaAlta(fecha) {
  if (!fecha || fecha === '—') return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Profile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionById, setSectionById] = useState({});

  useEffect(() => {
    getCommunities().then((rows) => {
      const m = {};
      rows.forEach((c) => {
        m[c.id] = c.name;
      });
      setSectionById(m);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getUser(userId), getPosts({ page: 1, userId })])
      .then(([u, res]) => {
        setUser(u);
        setPosts(res.posts);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <p className="load-hint">Cargando ficha…</p>;
  }

  if (!user) {
    return (
      <EmptyState title="Firma no encontrada" message="Archivo de demostración: la firma no consta en la redacción." />
    );
  }

  return (
    <div className="page profile-page">
      <header className="profile-header card-like">
        <div className="avatar" aria-hidden>
          {user.displayName?.slice(0, 1) || '?'}
        </div>
        <div>
          <span className="nav-kicker">Nombre</span>
          <h1>{user.displayName || user.username}</h1>
          <p className="display-name">@{user.username}</p>
          <p className="bio">{user.bio}</p>
          <p className="meta-line">
            <span>{user.karma?.toLocaleString?.('es') ?? user.karma} reconocimientos</span>
            <span>
              {user.joined && user.joined !== '—'
                ? `En la redacción desde el ${formatoFechaAlta(user.joined)}`
                : '—'}
            </span>
          </p>
          <div className="profile-trophies" aria-label="Vitrina de Trofeos">
            <span className="trophy-pill verified">Sello de Verificación</span>
            <span className="trophy-pill">
               {user.karma > 1000 ? 'Columnista Destacado' : 'Colaborador Ocasional'}
            </span>
            <span className="trophy-pill">Socio Fundador</span>
          </div>
        </div>
      </header>
      <h2 className="section-title">Publicaciones</h2>
      {posts.length === 0 ? (
        <EmptyState title="Sin publicaciones" message="Esta firma no tiene piezas en el archivo (demostración)." />
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} sectionName={sectionById[post.communityId]} />
          ))}
        </div>
      )}
    </div>
  );
}
