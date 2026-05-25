/*
  Foodgasm PWA service worker
  - Cache-first for static assets
  - Network-first for Supabase API calls
*/

const CACHE_VERSION = 'fg-static-v1';
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
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

  const isGet = req.method === 'GET';
  if (!isGet) return;

  const isApi = url.href.includes('supabase.co') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/');

  if (isApi) {
    // Network-first for API
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((cached) => cached || new Response('[]', {
        headers: { 'Content-Type': 'application/json' }
      })))
    );
    return;
  }

  // Cache-first for static files
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (!res || !res.ok) return res;
      const clone = res.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
      return res;
    }).catch(() => {
      // Offline fallback
      if (req.mode === 'navigate') return caches.match(OFFLINE_URL);
      return new Response('', { status: 504 });
    }))
  );
});

self.addEventListener('push', (event) => {
  const d = event.data?.json?.() || { title: 'Foodgasm', body: 'Order update!' };
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      tag: d.tag || 'fg',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: d.url || '/' }
    })
  );
});

