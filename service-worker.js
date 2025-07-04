// Service worker for offline caching
const CACHE_NAME = 'maladum-cache-v1';
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'styles.css',
  'materials.json',
  'items.json',
  'js/app.js',
  'js/crafting.js',
  'js/favourites.js',
  'js/inventory.js',
  'js/items.js',
  'js/materials.js',
  'js/pwa.js',
  'js/storage.js',
  'js/ui/components.js',
  'js/ui/theme.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
    )
  );
});
