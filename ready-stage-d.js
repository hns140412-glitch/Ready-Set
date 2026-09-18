(() => {
  'use strict';

  const VERSION = '2026.09.18-stage-d-homework-loader-v3-world-hold';
  const CHAIN = [
    './ready-stage-d-base-v1.js',
    './ready-home-homework-mvp-v1.js',
    './ready-home-homework-ui-v1.js'
  ];

  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`));
    document.head.appendChild(script);
  });

  function enforceImplementationHold(){
    const home=document.getElementById('homeView');
    if(!home)return;
    if(home.classList.contains('worldShell'))home.classList.remove('worldShell');
    home.querySelector('#worldStage')?.remove();
    home.querySelectorAll('.worldLegacySection').forEach(el=>el.classList.remove('worldLegacySection'));
    if(document.documentElement.dataset.readyWorldImplementation!=='HOLD')document.documentElement.dataset.readyWorldImplementation='HOLD';
  }

  let worldHoldQueued=false;
  const worldHoldObserver=new MutationObserver(()=>{
    if(worldHoldQueued)return;
    worldHoldQueued=true;
    requestAnimationFrame(()=>{worldHoldQueued=false;enforceImplementationHold()});
  });
  const startWorldHold=()=>{
    const home=document.getElementById('homeView');
    if(!home)return;
    enforceImplementationHold();
    worldHoldObserver.observe(home,{childList:true,subtree:true});
  };

  (async () => {
    document.documentElement.dataset.readyStageDLoader = 'LOADING';
    startWorldHold();
    for (const src of CHAIN) await load(src);
    document.documentElement.dataset.readyStageDLoader = VERSION;
    window.ReadyHomeHomeworkUIV1?.render?.();
    enforceImplementationHold();
  })().catch(error => {
    console.error('[Ready Stage D Homework Loader]', error);
    document.documentElement.dataset.readyStageDLoader = `ERROR:${error.message || 'UNKNOWN'}`;
  });
})();
