const CACHE_NAME = 'cyberphone-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // O Service Worker irá cachear outros assets dinamicamente durante a navegação.
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Limpa caches antigos para garantir que a versão mais recente seja usada.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      // Estratégia "Stale-while-revalidate" para o shell da aplicação.
      // Retorna o cache imediatamente para velocidade, depois atualiza o cache em segundo plano.
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // Se a rede falhar, o cache já foi servido (se existia).
        console.error('Service Worker: Fetch failed.', err);
        // Retorna a resposta do cache se a rede falhar.
        return cachedResponse;
      });

      // Retorna a resposta do cache se disponível, senão aguarda a rede.
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  const data = event.data ? event.data.json() : { title: 'CyBerPhone', body: 'Você tem uma nova notificação!' };
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  event.notification.close();
  const targetUrl = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
