importScripts('./ready-release-v01.js');
const RELEASE=globalThis.ReadySetReleaseDescriptor;
const CACHE='ready-set:'+RELEASE.release_id;
const CORE=[
'./','./index.html','./styles.css',
'./vendor/taky/release-contract.js','./vendor/taky/pwa-update-state.js',
'./ready-release-v01.js','./ready-pwa-update-v01.js',
'./ready-sync-adapter-v01.js','./ready-local-first-v01.js','./ready-assignment-domain-v2.js','./ready-subject-master-v01.js','./ready-official-standard-registry-v01.js','./ready-official-unit-map-v01.js','./ready-learning-standard-matcher-v01.js','./ready-learning-reference-v01.js','./ready-learning-master-v01.js','./ready-planner-v01.js','./ready-integration-v1.js','./app.js','./ready-runtime-v07.js','./manifest.webmanifest','./VERSION.json',
'./assets/icon-192.png','./assets/icon-512.png',
'./assets/guide-lumi.png','./assets/guide-pico.png','./assets/guide-mori.png',
'./assets/bgm-piano.wav','./assets/bgm-nature.wav','./assets/bgm-water.wav','./assets/bgm-lofi.wav'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE'){
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>(key.startsWith('ready-set-')||key.startsWith('ready-set:'))&&key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
