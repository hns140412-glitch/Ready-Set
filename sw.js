/* Ready & Set service worker — approved-design rebuild (2026-11-05).
   Network-first for pages so updates land; cache-first for versioned static assets.
   Removes caches from earlier builds. */
const CACHE = 'ready-set:rebuild-20261111c';
const CORE = ['./', './index.html', './rs/rs.css?v=20261111c', './rs/crew.js?v=20261111c', './rs/rs-taky-character-sync.js?v=20261111c', './rs/rs-app.js?v=20261111c', './rs/rs-taky-family.mjs?v=20261111c', './rs/taky-family-signin.mjs?v=20261111c', './rs/home-hero.webp', './manifest.webmanifest', './assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return res; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok && /\/(rs|assets)\//.test(u.pathname)) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});
