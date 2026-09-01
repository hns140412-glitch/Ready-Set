const CACHE='timeattack-github-final-v1';
const CORE=[
  './','./index.html','./manifest.json','./config.js',
  './assets/icon-192.png','./assets/icon-512.png',
  './assets/stopwatch-master.png','./assets/clock-master.png','./assets/home-hero-master.png','./assets/focus-hero-master.png',
  './assets/bgm-piano.wav','./assets/bgm-water.wav','./assets/bgm-nature.wav','./assets/bgm-lofi.wav'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.pathname.includes('/.netlify/functions/time')) return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
    if(url.origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return res;
  }).catch(()=>caches.match('./index.html'))));
});
