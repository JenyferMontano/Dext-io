/**
 * Datos de publicaciones y secciones: carga /mock-data.json (en caché vía Service Worker).
 * Usa datos embebidos si no hay red ni caché.
 */
import { FALLBACK_PAYLOAD } from './fallbackData.js';

const PAGE_SIZE = 6;

let memoryCache = null;
/** Una sola petición en vuelo hasta resolver `memoryCache` (evita varios fetch a mock-data.json al montar la portada). */
let loadPayloadInflight = null;

function normalizePost(row) {
  return {
    ...row,
    recommendations: row.recommendations ?? row.votes ?? 0,
    publishedAt: row.publishedAt ?? null,
  };
}

async function loadPayload() {
  if (memoryCache) return memoryCache;
  if (loadPayloadInflight) return loadPayloadInflight;
  loadPayloadInflight = (async () => {
    try {
      const res = await fetch('/mock-data.json');
      if (!res.ok) throw new Error(String(res.status));
      memoryCache = await res.json();
      return memoryCache;
    } catch {
      console.warn('[postsService] Usando datos de respaldo embebidos');
      memoryCache = FALLBACK_PAYLOAD;
      return memoryCache;
    } finally {
      loadPayloadInflight = null;
    }
  })();
  return loadPayloadInflight;
}

export async function getCommunities() {
  const data = await loadPayload();
  return data.communities;
}

export async function getUser(userId) {
  const data = await loadPayload();
  if (data.user.id === userId) return data.user;
  return {
    id: userId,
    username: userId,
    displayName: userId,
    bio: 'Perfil de demostración — sin autenticación.',
    karma: 0,
    joined: '—',
  };
}

/**
 * Publicaciones paginadas con filtros opcionales.
 * @param {{ page?: number, communitySlug?: string, userId?: string }} opts
 */
export async function getPosts(opts = {}) {
  const page = Math.max(1, opts.page || 1);
  const data = await loadPayload();
  let list = data.posts.map(normalizePost);
  const pageSize = opts.userId ? 50 : PAGE_SIZE;

  if (opts.communitySlug) {
    const slug = opts.communitySlug;
    list = list.filter((p) => {
      const c = data.communities.find((x) => x.slug === slug);
      return c && p.communityId === c.id;
    });
  }

  if (opts.userId) {
    list = list.filter((p) => p.userId === opts.userId);
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  const slice = list.slice(start, start + pageSize);
  return {
    posts: slice,
    page,
    hasMore: start + pageSize < total,
    total,
    pageSize,
  };
}
