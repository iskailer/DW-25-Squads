const CACHE_NAME = 'meu-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/gestao.html',
  '/lancamento.html',
  '/css/style.css',
  '/css/login.css',
  '/js/service-worker.js',
  '/js/app.js',
  '/js/auth.js',
  '/manifest.json',
  '/img/task.jpg',
  '/img/taskimg.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Arquivos em cache');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((resp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
      );
    })
  );
});