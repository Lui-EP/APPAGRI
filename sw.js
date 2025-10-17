const CACHE_NAME = 'agricola-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/estilos.css',
  '/logica.js',
  '/manifest.json',
  '/icon-192-v2.png',
  '/icon-512-v2.png'
];

// ===== FETCH único y con fallback =====
self.addEventListener('fetch', event => {
  // ✅ solo manejar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/index.html')) // <-- fallback si no hay conexión
  );
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});
