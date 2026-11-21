// Service worker template. vite.config.ts writes dist/sw.js from this file with VERSION and SHELL filled in,
// so every build produces a byte-different worker and browsers detect updates.
// Rules: same-origin GET only; never Range requests; cached responses are returned unchanged so their
// COOP/COEP/CSP headers survive offline (SPIKE-001 A2); user files are never fetched or cached here.
/* eslint-disable no-restricted-globals */
const VERSION = '__VERSION__';
const SHELL = __SHELL__;
const SHELL_CACHE = `shell-${VERSION}`;
const EMULATOR_PREFIX = 'emulator-';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload', credentials: 'same-origin' })));
    })(),
  );
  // No skipWaiting here: the page shows "Update available" and the user chooses when to switch.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('shell-') && key !== SHELL_CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.origin !== self.location.origin) return;
  if (event.data === 'skip-waiting') self.skipWaiting();
});

async function fromEmulatorCache(request) {
  for (const key of await caches.keys()) {
    if (!key.startsWith(EMULATOR_PREFIX)) continue;
    const hit = await (await caches.open(key)).match(request, { ignoreSearch: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || req.headers.has('range')) return;

  if (url.pathname.startsWith('/emulator/')) {
    // Installed emulator package first (explicit "Make available offline"), then network.
    event.respondWith((async () => (await fromEmulatorCache(req)) ?? fetch(req))());
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match('/')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      return (await cache.match(req, { ignoreSearch: true })) ?? fetch(req);
    })(),
  );
});
