import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPosts, getCommunities } from '../services/postsService.js';
import { PostCard } from '../components/PostCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

const RAIL_COUNT = 4;

export function Home() {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionById, setSectionById] = useState({});
  const [sortType, setSortType] = useState('hot');

  const sentinelRef = useRef(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  useEffect(() => {
    getCommunities().then((rows) => {
      const m = {};
      rows.forEach((c) => {
        m[c.id] = c.name;
      });
      setSectionById(m);
    });
  }, []);

  const load = useCallback(async (nextPage) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getPosts({ page: nextPage });
      setPosts((prev) => (nextPage === 1 ? res.posts : [...prev, ...res.posts]));
      setHasMore(res.hasMore);
      pageRef.current = nextPage;
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las publicaciones');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    load(1);
  }, [load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadingRef.current || !hasMore) return;
        load(pageRef.current + 1);
      },
      { rootMargin: '160px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load, hasMore]);

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sortType === 'new') {
      arr.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).reverse();
    } else if (sortType === 'top') {
      arr.sort((a, b) => (b.recommendations || 0) - (a.recommendations || 0));
    } else {
      // hot: mezcla votos y tiempo (score simple mockeado)
      arr.sort((a, b) => {
        const scoreA = (a.recommendations || 0) / Math.max(1, (Date.now() - new Date(a.publishedAt).getTime()) / 3600000);
        const scoreB = (b.recommendations || 0) / Math.max(1, (Date.now() - new Date(b.publishedAt).getTime()) / 3600000);
        return scoreB - scoreA;
      });
    }
    return arr;
  }, [posts, sortType]);

  const { lead, rail, archive, primaryArchive, secondaryArchive } = useMemo(() => {
    if (!sortedPosts.length) {
      return {
        lead: null,
        rail: [],
        archive: [],
        primaryArchive: [],
        secondaryArchive: [],
      };
    }
    const r = sortedPosts.slice(1, 1 + RAIL_COUNT);
    const a = sortedPosts.slice(1 + RAIL_COUNT);
    return {
      lead: sortedPosts[0],
      rail: r,
      archive: a,
      primaryArchive: a.filter((_, i) => i % 2 === 0),
      secondaryArchive: a.filter((_, i) => i % 2 === 1),
    };
  }, [sortedPosts]);

  if (error && posts.length === 0) {
    return (
      <EmptyState
        title="No se pudo cargar la portada"
        message="Vuelve a intentarlo con conexión, o abre la edición en línea al menos una vez para conservar el archivo en caché."
      />
    );
  }

  if (!loading && posts.length === 0) {
    return <EmptyState title="Sin publicaciones" message="No hay piezas disponibles en este momento." />;
  }

  return (
    <section className="page home-page" aria-label="Portada">
      <div className="feed-filters-container">
        <div className="feed-filters">
          <button 
            className={`filter-btn ${sortType === 'hot' ? 'is-active' : ''}`}
            onClick={() => setSortType('hot')}
          >
            Tendencias
          </button>
          <button 
            className={`filter-btn ${sortType === 'new' ? 'is-active' : ''}`}
            onClick={() => setSortType('new')}
          >
            Recientes
          </button>
          <button 
            className={`filter-btn ${sortType === 'top' ? 'is-active' : ''}`}
            onClick={() => setSortType('top')}
          >
            Mejor Valorados
          </button>
        </div>
      </div>

      {lead ? (
        <div className="portada-center-split">
          <div className="portada-col-primary">
            <span className="col-label-articulos">Publicaciones</span>
            <PostCard
              post={lead}
              variant="lead"
              sectionName={sectionById[lead.communityId]}
            />
            {primaryArchive.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant="grid"
                sectionName={sectionById[post.communityId]}
              />
            ))}
          </div>
          <div className="portada-col-secondary">
            {rail.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant="rail"
                sectionName={sectionById[post.communityId]}
              />
            ))}
            {secondaryArchive.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant="rail"
                sectionName={sectionById[post.communityId]}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden />
      {loading ? <p className="load-hint">Cargando archivo…</p> : null}
    </section>
  );
}
