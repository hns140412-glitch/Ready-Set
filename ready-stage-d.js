(() => {
  'use strict';

  const VERSION = '2026.10.08-stage-d-homework-world-active-v3';
  const WORLD_IMPLEMENTATION_HOLD = false;
  const CHAIN = [
    './ready-stage-d-base-v1.js',
    './ready-home-homework-mvp-v1.js',
    './ready-home-homework-ui-v1.js',
    './ready-world-base-v1.js',
    './ready-world-shell-v1.js'
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
    if(!WORLD_IMPLEMENTATION_HOLD)return;
    const home=document.getElementById('homeView');
    if(!home)return;
    // Only write when needed: classList.remove always rewrites the class attribute,
    // which re-triggers the class observer below and locks the main thread.
    if(home.classList.contains('worldShell'))home.classList.remove('worldShell');
    home.querySelector('#worldStage')?.remove();
    home.querySelectorAll('.worldLegacySection').forEach(el=>el.classList.remove('worldLegacySection'));
    document.documentElement.dataset.readyWorldImplementation='HOLD';
  }

  const worldHoldObserver=new MutationObserver(()=>enforceImplementationHold());
  const startWorldHold=()=>{
    if(!WORLD_IMPLEMENTATION_HOLD)return;
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
    if(window.ReadyRoleContextV1?.current?.()==='child'){
      document.documentElement.dataset.readyWorldImplementation='ACTIVE';
      window.ReadyWorldShellV1?.render?.();
    }else{
      document.documentElement.dataset.readyWorldImplementation='PARENT_NOT_APPLICABLE';
    }
    enforceImplementationHold();
  })().catch(error => {
    console.error('[Ready Stage D Homework Loader]', error);
    document.documentElement.dataset.readyStageDLoader = `ERROR:${error.message || 'UNKNOWN'}`;
  });
})();
