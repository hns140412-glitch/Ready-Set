const CACHE='ready-set-v094-rev07-staging8-role-home';
const CORE=[
'./','./index.html','./styles.css','./app.js','./ready-runtime-v07.js','./ready-stage-c.js','./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./manifest.webmanifest','./VERSION.json',
'./Ready_Set_Ui_Master_Logic_REV_06.md','./Ready_Set_Ui_Master_Logic_REV_07.md',
'./assets/icon-192.png','./assets/icon-512.png',
'./assets/guide-lumi.png','./assets/guide-pico.png','./assets/guide-mori.png',
'./assets/bgm-piano.wav','./assets/bgm-nature.wav','./assets/bgm-water.wav','./assets/bgm-lofi.wav'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r}).catch(()=>caches.match(e.request)));
});