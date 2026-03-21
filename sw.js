const CACHE_NAME = 'snack-attack-cache-v2';

// Install event: takes over immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: cleans up old caches and takes control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-First Strategy with API Bypass
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // 1. CRITICAL FIX: Always bypass the cache for Google Apps Script (Live Cloud Data)
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. NETWORK-FIRST STRATEGY: Try the internet first for the freshest UI, fallback to cache if offline
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // If we got a valid response, clone it and update the cache so the offline version is always recent
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // 3. Network failed (iPad is offline). Serve the app from the cache!
      console.warn('Network fetch failed; returning cached offline version.', url);
      return caches.match(event.request);
    })
  );
});
