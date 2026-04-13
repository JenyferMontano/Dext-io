/**
 * Datos de publicaciones y secciones: carga /mock-data.json (en caché vía Service Worker).
 * Usa datos embebidos si no hay red ni caché.
 */
import { FALLBACK_PAYLOAD } from './fallbackData.js';

const PAGE_SIZE = 6;

let memoryCache = null;

function normalizePost(row) {
  return {
    ...row,
    recommendations: row.recommendations ?? row.votes ?? 0,
    publishedAt: row.publishedAt ?? null,
  };
}

async function loadPayload() {
  if (memoryCache) return memoryCache;
  try {
    const res = await fetch('/mock-data.json');
    if (!res.ok) throw new Error(String(res.status));
    memoryCache = await res.json();
    return memoryCache;
  } catch {
    console.warn('[postsService] Usando datos de respaldo embebidos');
    memoryCache = FALLBACK_PAYLOAD;
    return memoryCache;
  }
}

/**
 * Opcional: JSONPlaceholder para unas pocas publicaciones extra (solo con red).
 */
async function tryRemotePosts() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3');
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r, i) => ({
      id: `jp-${r.id}`,
      title: `Publicación de demostración ${i + 1} (API pública)`,
      content:
        'Texto de ejemplo obtenido de internet para simular contenido extra cuando hay conexión. Los datos reales de la API están en inglés; aquí se muestra un resumen en español.',
      author: 'api_demo',
      userId: 'ext',
      communityId: 'tech',
      recommendations: 10 + i,
      publishedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      imageUrl: null,
    }));
  } catch {
    return [];
  }
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
 * @param {{ page?: number, communitySlug?: string, userId?: string, includeRemote?: boolean }} opts
 */
export async function getPosts(opts = {}) {
  const page = Math.max(1, opts.page || 1);
  const data = await loadPayload();
  let list = data.posts.map(normalizePost);
  const pageSize = opts.userId ? 50 : PAGE_SIZE;

  if (opts.includeRemote && navigator.onLine) {
    const remote = await tryRemotePosts();
    const ids = new Set(list.map((p) => p.id));
    remote.forEach((p) => {
      if (!ids.has(p.id)) list.push(p);
    });
  }

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
