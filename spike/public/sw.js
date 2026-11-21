// SPIKE-001 service worker: network-first, cache fallback. Cached responses keep their original headers;
// the question (A2) is whether crossOriginIsolated stays true when the page is served from this cache offline.
const CACHE = 'spike001-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch {
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached ?? new Response('offline and not cached', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
