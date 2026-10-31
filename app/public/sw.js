const CACHE_NAME = 'ods6-pwa-v2';
const APP_SHELL = [
  '/offline.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/bottom-navigation.css',
  '/css/noticias.css',
  '/js/main.js',
  '/images/logo.png',
  '/images/logo.webp',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/apple-touch-icon.png',
  '/pwa/screenshots/home-desktop.png',
  '/pwa/screenshots/home-mobile.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('ods6-pwa-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return (await caches.match(request)) || Response.error();
  }
}

async function networkFirst(request) {
  try {
    // HTML contém dados da sessão e tokens CSRF. Nunca deve ficar no cache offline.
    return await fetch(request, { cache: 'no-store' });
  } catch (error) {
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  if (['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
