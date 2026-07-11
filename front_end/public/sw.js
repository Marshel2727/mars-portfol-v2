const CACHE_NAME = 'marshel-portfolio-cache-v2';
const urlsToCache = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

const isCacheableResponse = (response) => (
  response && response.status === 200 && response.type === 'basic'
);

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
};

const staleWhileRevalidate = async (event) => {
  const cachedResponse = await caches.match(event.request);
  const networkResponse = fetch(event.request).then(async (response) => {
    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  });

  if (cachedResponse) {
    event.waitUntil(networkResponse.catch(() => undefined));
    return cachedResponse;
  }

  return networkResponse;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isPrivateRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/login');
  const isStaticAsset = (
    url.pathname.startsWith('/_next/static/') ||
    ['font', 'image', 'script', 'style'].includes(event.request.destination)
  );

  if (isPrivateRoute) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(event));
  }
});

// PWA Push Notification Listeners
self.addEventListener('push', (event) => {
  let data = { title: 'Pesan Baru', body: 'Ada pesan baru masuk ke portofolio Anda.' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/admin/messages'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/admin/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and redirect
      for (const client of clientList) {
        const clientUrl = new URL(client.url).pathname;
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
