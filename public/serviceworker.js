/**
 * Dext.io — Service Worker manual
 *
 * Ciclo de vida: install → activate → fetch (+ sincronización en segundo plano)
 * También: sync (Background Sync), push (Push API — registro de demostración)
 *
 * Cachés:
 * - static-v1   — shell y estáticos (Cache First)
 * - dynamic-v1  — JSON de API y navegaciones HTML (Network First / carrera)
 * - immutable-v1 — CDN de larga vida (Cache First, opcional)
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMMUTABLE_CACHE = `immutable-${CACHE_VERSION}`;

/** Máximo de entradas por caché (se eliminan las más antiguas). */
const MAX_ITEMS = 50;

const IMMUTABLE_HOST_HINTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'cdn.jsdelivr.net'];

/** URLs precacheadas para el shell sin conexión (válidas tras `vite build`). */
const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/serviceworker.js',
  '/icons/icon.svg',
  '/no-image.png',
  '/mock-data.json',
];

// --- install ---
self.addEventListener('install', (event) => {
  console.log('[SW] install — versión', CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] install — precarga del shell');
        return cache.addAll(STATIC_PRECACHE.map((url) => new Request(url, { cache: 'reload' }))).catch((err) => {
          console.warn('[SW] install — fallo parcial al precargar', err);
          return cache.add('/index.html').catch(() => {});
        });
      })
      .then(() => self.skipWaiting())
  );
});

async function deleteOldCaches() {
  const keys = await caches.keys();
  const keep = new Set([STATIC_CACHE, DYNAMIC_CACHE, IMMUTABLE_CACHE]);
  await Promise.all(
    keys.map((key) => {
      if (!keep.has(key)) {
        console.log('[SW] activate — eliminando caché antigua', key);
        return caches.delete(key);
      }
      return Promise.resolve();
    })
  );
}

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= MAX_ITEMS) return;
  const removeCount = keys.length - MAX_ITEMS;
  console.log('[SW] trimCache —', cacheName, 'eliminando', removeCount, 'entradas');
  for (let i = 0; i < removeCount; i++) {
    await cache.delete(keys[i]);
  }
}

// --- activate ---
self.addEventListener('activate', (event) => {
  console.log('[SW] activate');
  event.waitUntil(
    deleteOldCaches()
      .then(() => caches.open(DYNAMIC_CACHE))
      .then((cache) => trimCache(DYNAMIC_CACHE))
      .then(() => self.clients.claim())
      .then(() => console.log('[SW] activate — clientes reclamados'))
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  const p = url.pathname;
  return (
    p.includes('/assets/') ||
    p.endsWith('.js') ||
    p.endsWith('.css') ||
    p.endsWith('.woff2') ||
    p.endsWith('.svg')
  );
}

function isApiRequest(url) {
  return (
    url.hostname.includes('jsonplaceholder.typicode.com') ||
    url.pathname.includes('/api/') ||
    url.pathname.endsWith('.json')
  );
}

function isImmutableCDN(url) {
  return IMMUTABLE_HOST_HINTS.some((h) => url.hostname.includes(h));
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await trimCache(cacheName);
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      await trimCache(cacheName);
    }
    return response;
  } catch (e) {
    console.log('[SW] fetch — red falló, probando caché', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ sinConexion: true }), {
      status: 503,
      statusText: 'Sin conexión',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkCacheRace(request, cacheName) {
  const cache = await caches.open(cacheName);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).then(() => trimCache(cacheName));
      }
      return response;
    })
    .catch(() => null);

  const cachePromise = caches.match(request);

  const raced = await Promise.race([
    networkPromise,
    cachePromise.then((r) => {
      if (r) return r;
      return Promise.reject(new Error('sin-caché'));
    }),
  ]).catch(() => null);

  if (raced && raced.ok) return raced;

  const net = await networkPromise;
  if (net && net.ok) return net;

  const fromCache = await caches.match(request);
  if (fromCache) return fromCache;

  if (request.mode === 'navigate') {
    const shell = await caches.match('/index.html');
    if (shell) return shell;
  }

  return new Response('Sin conexión', { status: 503, statusText: 'Servicio no disponible' });
}

/** Vite dev: no cachear módulos ni CSS en vivo (evita UI desactualizada / grid roto). */
function isViteDevBypass(url) {
  const h = url.hostname;
  const p = url.pathname;
  if (h !== 'localhost' && h !== '127.0.0.1') return false;
  return (
    p.startsWith('/src/') ||
    p.startsWith('/@vite') ||
    p.startsWith('/@fs') ||
    p.startsWith('/@id') ||
    p.startsWith('/node_modules/')
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isViteDevBypass(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.destination === 'image' && !isSameOrigin(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) return res;
          return caches.match('/no-image.png');
        })
        .catch(() => caches.match('/no-image.png'))
    );
    return;
  }

  if (!isSameOrigin(url)) {
    if (isImmutableCDN(url)) {
      event.respondWith(cacheFirst(request, IMMUTABLE_CACHE));
      return;
    }
    if (isApiRequest(url)) {
      event.respondWith(
        networkFirst(request, DYNAMIC_CACHE).catch(() => caches.match(request))
      );
      return;
    }
    return;
  }

  if (isApiRequest(url) || url.pathname.endsWith('mock-data.json')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  if (isStaticAsset(url) || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkCacheRace(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(networkCacheRace(request, DYNAMIC_CACHE));
});

self.addEventListener('sync', (event) => {
  console.log('[SW] evento sync — etiqueta:', event.tag);
  if (event.tag === 'dext-sync-posts') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[SW] Background Sync — demo: aquí se enviarían votos/publicaciones en cola al servidor');
      })
    );
  }
});

self.addEventListener('push', (event) => {
  console.log('[SW] evento push recibido');
  let payload = '';
  try {
    payload = event.data ? event.data.text() : '';
  } catch (e) {
    payload = '(binario)';
  }
  console.log('[SW] carga push (demo):', payload || 'vacía — en producción usar PushManager');

  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] push — demo: aquí se mostraría una notificación al usuario');
    })
  );
});
