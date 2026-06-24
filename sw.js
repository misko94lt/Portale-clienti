/* Portale Cliente — service worker network-first (niente cache stantia) */
const CACHE = 'portale-cache-v3';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));   // pulisce tutte le cache vecchie
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request);              // prova SEMPRE la rete (ultima versione)
      const cache = await caches.open(CACHE);
      try { cache.put(e.request, fresh.clone()); } catch (x) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(e.request);       // offline: ripiego sulla cache
      return cached || Response.error();
    }
  })());
});
