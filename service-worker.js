// Service worker for offline caching
const CACHE_NAME = 'maladum-crafting-cache-v3'; // Updated cache name
const PRECACHE_ASSETS = [
  './', // Alias for index.html
  'index.html',
  'manifest.webmanifest',
  'styles.css',
  'theme.css', // Added
  'materials.json',
  'items.json',
  // JS files - ensure this list is exhaustive
  'js/app.js',
  'js/crafting.js',
  'js/favourites.js',
  'js/inventory.js',
  'js/items.js',
  'js/materials.js',
  'js/pwa.js',
  'js/storage.js',
  'js/localStorageUtil.js', // Added
  'js/ui/components.js',
  'js/ui/theme.js',
  'js/ui/effects.js', // Added
  // PWA Icons
  'images/icon-192.png',
  'images/icon-512.png',
  // Other essential images
  'images/parchment-texture.png' // Will be added in next step
  // Item icons (e.g., images/tokens/*) are cached on demand by the fetch handler
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching assets:', PRECACHE_ASSETS);
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
        // Optionally, you might want to prevent the SW from installing if critical assets fail
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  if (url.endsWith('materials.json') || url.endsWith('items.json')) {
    // Network-first strategy for JSON data to ensure latest updates
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for other GET requests
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          console.error('[Service Worker] Fetch failed; returning offline fallback or error for:', event.request.url, error);
        });
      });
    })
  );
});
