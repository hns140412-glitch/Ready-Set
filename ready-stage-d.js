(() => {
  'use strict';

  const VERSION = '2026.09.11-stage-d-homework-loader-v1';
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

  (async () => {
    document.documentElement.dataset.readyStageDLoader = 'LOADING';
    for (const src of CHAIN) await load(src);
    document.documentElement.dataset.readyStageDLoader = VERSION;
    window.ReadyHomeHomeworkUIV1?.render?.();
  })().catch(error => {
    console.error('[Ready Stage D Homework Loader]', error);
    document.documentElement.dataset.readyStageDLoader = `ERROR:${error.message || 'UNKNOWN'}`;
  });
})();
