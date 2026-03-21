const CACHE_NAME = 'snack-attack-cache-v1';

// Install event: takes over immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: cleans up old caches and takes control of the pages
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: Cache-First strategy
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 1. Return the cached version if we have it (Instant load/Offline support)
      if (response) {
        return response;
      }
      
      // 2. Otherwise, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        // Optional: Cache the new response for next time
        // if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        //   var responseToCache = networkResponse.clone();
        //   caches.open(CACHE_NAME).then((cache) => {
        //     cache.put(event.request, responseToCache);
        //   });
        // }
        return networkResponse;
      }).catch((error) => {
        // Network failed and not in cache (e.g., offline)
        console.warn('Fetch failed; returning offline page instead.', error);
      });
    })
  );
});
