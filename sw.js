const CACHE_NAME = 'raj-stadium-v2-offline-shell';

// Assets required for instant offline booting
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/dayjs@1.11.9/dayjs.min.js',
    'https://unpkg.com/dayjs@1.11.9/plugin/utc.js',
    'https://unpkg.com/dayjs@1.11.9/plugin/timezone.js',
    'https://unpkg.com/dayjs@1.11.9/plugin/customParseFormat.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://ik.imagekit.io/silentgamers/tr:w-192,h-192/retouch_2026062122443488.png',
    'https://ik.imagekit.io/silentgamers/tr:w-512,h-512/retouch_2026062122443488.png'
];

self.addEventListener('install', (event) => {
    // Immediately take control
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    // Clear out old versions of the cache
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
    // Ignore external API calls (Google Script) in the SW cache, they are handled via localStorage in the app
    if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Keep cache up to date silently
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                }
                return networkResponse;
            }).catch(() => {
                // If offline and request fails, just return what's in cache
            });

            // Return cached response immediately if exists, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
