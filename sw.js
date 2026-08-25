/**
 * Torah Gematria Deciphering Tool
 * Service Worker - Modo Offline y PWA
 */

const CACHE_NAME = 'torah-gematria-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icons/icon.svg',
  './database.js',
  './torah_text.js',
  './gematria.js',
  './elsWorker.js',
  './app.js',
  './js/modules/dailySync.js',
  './js/modules/calculatorView.js',
  './js/modules/galaxyCanvas.js',
  './js/modules/comparatorView.js',
  './js/modules/timelineView.js',
  './js/modules/bibleCodeView.js',
  './js/modules/shareCard.js',
  './js/modules/tourModal.js',
  './js/modules/reportGenerator.js',
  './js/modules/pwaManager.js'
];

// Instalación: Precaching de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets for offline use');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estrategia Cache First con fallback a red
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o esquemas ajenos
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // En caso de fallo total de red, si es documento HTML retornar index
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
