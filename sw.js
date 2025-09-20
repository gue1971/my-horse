// sw.js
const STATIC_CACHE = 'mystable-static-v2';
const RUNTIME_CACHE = 'mystable-runtime-v1';

const STATIC_ASSETS = [
  './', './index.html',
  './data/horses.json',        // 初回キャッシュに入れておく（オフライン初回対策）
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32x32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ✅ JSON は network-first
  if (url.pathname.endsWith('/data/horses.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // それ以外は cache-first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});


// const CACHE = 'mystable-v1';
// const ASSETS = [
//   './',
//   './index.html',
//   './data/horses.json',
//   './icons/icon-192.png',
//   './icons/icon-512.png',
//   './icons/apple-touch-icon.png',
//   './icons/favicon-32x32.png',
//   // 画像など増やすならここに相対で追加
// ];
// self.addEventListener('install', e => {
//   e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
//   self.skipWaiting();
// });
// self.addEventListener('activate', e => {
//   e.waitUntil(
//     caches.keys().then(keys =>
//       Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
//     )
//   );
//   self.clients.claim();
// });
// self.addEventListener('fetch', e => {
//   e.respondWith(
//     caches.match(e.request).then(r => r || fetch(e.request))
//   );
// });
