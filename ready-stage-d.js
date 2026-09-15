(() => {
  'use strict';

  const VERSION = '2026.09.15-stage-d-homework-loader-v2-world-hold';
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
    home.classList.remove('worldShell');
    home.querySelector('#worldStage')?.remove();
    home.querySelectorAll('.worldLegacySection').forEach(el=>el.classList.remove('worldLegacySection'));
    document.documentElement.dataset.readyWorldImplementation='HOLD';
  }

  const worldHoldObserver=new MutationObserver(()=>enforceImplementationHold());
  const startWorldHold=()=>{
    const home=document.getElementById('homeView');
    if(!home)return;
    enforceImplementationHold();
    worldHoldObserver.observe(home,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
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
