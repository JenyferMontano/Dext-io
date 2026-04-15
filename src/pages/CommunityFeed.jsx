import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPosts, getCommunities } from '../services/postsService.js';
import { PostCard } from '../components/PostCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { routes } from '../router/routes.js';

export function CommunityFeed() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(slug);
  const [sectionById, setSectionById] = useState({});
  const [sortType, setSortType] = useState('hot');

  const sentinelRef = useRef(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  useEffect(() => {
    getCommunities().then((all) => {
      const m = {};
      all.forEach((x) => {
        m[x.id] = x.name;
      });
      setSectionById(m);
      const c = all.find((x) => x.slug === slug);
      if (c) setTitle(c.name);
    });
  }, [slug]);

  const load = useCallback(
    async (nextPage) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await getPosts({ page: nextPage, communitySlug: slug });
        setPosts((prev) => (nextPage === 1 ? res.posts : [...prev, ...res.posts]));
        setHasMore(res.hasMore);
        pageRef.current = nextPage;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    pageRef.current = 1;
    setPosts([]);
    load(1);
  }, [slug, load]);

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
  }, [load, hasMore, slug]);

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sortType === 'new') {
      arr.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).reverse();
    } else if (sortType === 'top') {
      arr.sort((a, b) => (b.recommendations || 0) - (a.recommendations || 0));
    } else {
      arr.sort((a, b) => {
        const scoreA = (a.recommendations || 0) / Math.max(1, (Date.now() - new Date(a.publishedAt).getTime()) / 3600000);
        const scoreB = (b.recommendations || 0) / Math.max(1, (Date.now() - new Date(b.publishedAt).getTime()) / 3600000);
        return scoreB - scoreA;
      });
    }
    return arr;
  }, [posts, sortType]);

  return (
    <div className="page community-feed-page">
      <header className="page-header">
        <p className="breadcrumb">
          <Link to={routes.communities}>Secciones</Link>
          <span aria-hidden> / </span>
          <span>{title}</span>
        </p>
        <h1>{title}</h1>
        <p className="page-sub">Publicaciones de esta categoría</p>
      </header>
      
      <div className="feed-filters-container feed-filters-container--border">
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

      {!loading && posts.length === 0 ? (
        <EmptyState
          title="No hay publicaciones"
          message="Prueba otra sección o vuelve más tarde al archivo."
        />
      ) : (
        <>
          <div className="post-list">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communitySlug={slug}
                sectionName={sectionById[post.communityId]}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="scroll-sentinel" aria-hidden />
          {loading ? <p className="load-hint">Cargando…</p> : null}
        </>
      )}
    </div>
  );
}
