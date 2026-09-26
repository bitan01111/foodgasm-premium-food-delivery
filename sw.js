/*
  Foodgasm PWA Service Worker (v2.0.0)
  - Cache-first for local static assets
  - Network-first with offline fallback for /api/ calls
*/

const CACHE_VERSION = 'foodgasm-v2.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/css/style.css',
  '/js/data.js',
  '/js/app.js',
  '/js/i18n.js',
  '/js/geo.js',
  '/assets/icons/fg-icon-192.png',
  '/assets/icons/fg-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k === CACHE_VERSION ? null : caches.delete(k)))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Network-first for REST API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((cached) => cached || new Response(
        JSON.stringify({ error: 'Offline mode active. Reconnecting to Foodgasm server...' }),
        { headers: { 'Content-Type': 'application/json' }, status: 503 }
      )))
    );
    return;
  }

  // Cache-first with network fallback for static resources
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (!res || !res.ok) return res;
      const clone = res.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
      return res;
    }).catch(() => {
      if (req.mode === 'navigate') return caches.match('/index.html');
      return new Response('', { status: 504 });
    }))
  );
});

self.addEventListener('push', (event) => {
  const d = event.data?.json?.() || { title: 'Foodgasm 🍔', body: 'Your order update is here!' };
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/assets/icons/fg-icon-192.png',
      badge: '/assets/icons/fg-icon-192.png',
      tag: 'foodgasm-order',
      renotify: true,
      data: { url: d.url || '/' }
    })
  );
});
