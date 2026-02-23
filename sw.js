const CACHE_NAME = 'health-card-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Кеш открыт');
      return cache.addAll(urlsToCache).catch(() => {
        console.log('⚠️ Некоторые файлы не закешированы');
      });
    })
  );
  self.skipWaiting();
});

// Активирование Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Старый кеш удален:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Обработка запросов (сначала кеш, потом сеть)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Если есть в кеше - вернуть из кеша
      if (response) {
        return response;
      }

      // Если нет в кеше - попытаться загрузить из сети
      return fetch(event.request).then(response => {
        // Не кешировать неудачные ответы
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Клонировать ответ
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Если нет интернета и нет в кеше - вернуть кеш
        return caches.match(event.request);
      });
    })
  );
});
