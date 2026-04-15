const CACHE_VERSION = 'v9';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMMUTABLE_CACHE = `immutable-${CACHE_VERSION}`;

const MAX_ITEMS = 50;

const IMMUTABLE_HOST_HINTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'cdn.jsdelivr.net'];

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/serviceworker.js',
  '/icons/dext.png',
  '/no-image.png',
  '/mock-data.json',
];

async function precacheViteBundles(staticCache) {
  const indexRes = await staticCache.match('/index.html');
  const html = indexRes ? await indexRes.text() : '';
  if (!html) return;
  const paths = new Set();
  const re = /\/assets\/[a-zA-Z0-9._-]+\.(?:js|css)/g;
  let m;
  while ((m = re.exec(html))) {
    paths.add(m[0]);
  }
  if (!paths.size) return;
  console.log('[SW] install — precarga de bundles Vite', [...paths]);
  await Promise.all(
    [...paths].map((path) =>
      staticCache.add(new Request(path, { cache: 'reload' })).catch((err) => {
        console.warn('[SW] install — no se pudo cachear', path, err);
      })
    )
  );
}

self.addEventListener('install', (event) => {
  console.log('[SW] install — versión', CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[SW] install — precarga del shell');
        try {
          await cache.addAll(STATIC_PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
        } catch (err) {
          console.warn('[SW] install — fallo parcial al precargar', err);
          await cache.add('/index.html').catch(() => {});
        }
        await precacheViteBundles(cache);
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
  return url.pathname.includes('/api/') || url.pathname.endsWith('.json');
}

function isImmutableCDN(url) {
  return IMMUTABLE_HOST_HINTS.some((h) => url.hostname.includes(h));
}

async function matchInCacheFlexible(cache, request) {
  let hit = await cache.match(request);
  if (hit) return hit;
  let pathname;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return null;
  }
  const keys = await cache.keys();
  for (const key of keys) {
    try {
      if (new URL(key.url).pathname === pathname) {
        hit = await cache.match(key);
        if (hit) return hit;
      }
    } catch {}
  }
  return null;
}

// Estrategia: cache first (caché → red → guardar si ok).
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  let cached =
    cacheName === STATIC_CACHE
      ? await matchInCacheFlexible(cache, request)
      : await cache.match(request);
  if (!cached) {
    cached = await caches.match(request);
  }
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cacheName);
    }
    return response;
  } catch (e) {
    console.log('[SW] cacheFirst — sin red y sin caché para', request.url);
    return new Response('', { status: 503, statusText: 'Sin conexion' });
  }
}

// Estrategia: network first (red → caché si falla u offline).
async function networkFirst(request, cacheName) {
  if (self.navigator && self.navigator.onLine === false) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ sinConexion: true }), {
      status: 503,
      statusText: 'Sin conexión',
      headers: { 'Content-Type': 'application/json' },
    });
  }
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

// Estrategia: navegación / HTML (caché → red → index.html en caché).
async function networkCacheRace(request, cacheName) {
  const cache = await caches.open(cacheName);
  const isHtml =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  let fromCache = await caches.match(request);
  if (fromCache) return fromCache;

  if (isHtml) {
    fromCache = await caches.match('/index.html');
    if (fromCache) return fromCache;
  }

  if (self.navigator && self.navigator.onLine === false) {
    return new Response('Sin conexión', { status: 503, statusText: 'Servicio no disponible' });
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cacheName);
    }
    if (response && response.ok) return response;
  } catch {}

  if (isHtml) {
    const shell = await caches.match('/index.html');
    if (shell) return shell;
  }
  const again = await caches.match(request);
  if (again) return again;

  return new Response('Sin conexión', { status: 503, statusText: 'Servicio no disponible' });
}

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
          if (res && (res.ok || res.type === 'opaque')) return res;
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

  if (
    url.pathname === '/mock-data.json' ||
    url.pathname.endsWith('/mock-data.json') ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('/manifest.json')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isApiRequest(url)) {
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
