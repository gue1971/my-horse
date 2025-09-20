// sw.js
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('my-stable-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/data/horses.json',
        '/icons/favicon-32x32.png',
        '/icons/icon-192.png',
        '/icons/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
