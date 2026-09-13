const CACHE='ready-set-v094-rev07-staging24-foundation-planner-bridge-v1';
const CORE=[
'./','./index.html','./styles.css','./ready-base-home-v1.css','./manifest.webmanifest','./VERSION.json',
'./ready-base-runtime-v1.js','./ready-runtime-v07.js','./ready-onboarding-identity-v1.js','./ready-onboarding-identity-v1.js?v=20260911-mood2','./ready-onboarding-identity-v2.js','./ready-onboarding-identity-v2.js?v=20260913-deferred','./ready-mood-direction-v2.js','./ready-mood-direction-v2.js?v=20260911-mood2','./ready-character-candidate-v1.js','./ready-character-candidate-v1.js?v=20260911-mood2','./ready-stage-c.js','./ready-stage-c.js?v=20260911-mood2',
'./ready-role-context-v1.js','./ready-onboarding-flow-completion-v1.js','./ready-foundation-v1.js','./ready-foundation-control-v1.js','./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-parent-capture-intake-v1.js','./ready-homework-analysis-bridge-v1.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-world-base-v1.js','./ready-world-shell-v1.js','./ready-parent-setup-hub-v1.js','./ready-base-selftest-v1.js',
'./Ready_Set_Ui_Master_Logic_REV_06.md','./Ready_Set_Ui_Master_Logic_REV_07.md',
'./assets/icon-192.png','./assets/icon-512.png','./assets/guide-lumi.png','./assets/guide-pico.png','./assets/guide-mori.png','./assets/bgm-piano.wav','./assets/bgm-nature.wav','./assets/bgm-water.wav','./assets/bgm-lofi.wav'
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
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r}).catch(async()=>{
   const exact=await caches.match(e.request);if(exact)return exact;
   const path='.'+u.pathname;return caches.match(path);
 }));
});