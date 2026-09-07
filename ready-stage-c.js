(() => {
  'use strict';
  const VERSION = '2026.09.08-stage-e1';
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${src}?v=${encodeURIComponent(VERSION)}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`));
    document.head.appendChild(script);
  });
  (async () => {
    await load('./ready-stage-c-base.js');
    await load('./ready-stage-d.js');
    await load('./ready-stage-e.js');
  })().catch(error => {
    console.error('[Ready Stage Loader]', error);
    const t = document.getElementById('toast');
    if (t) { t.textContent = 'Preview 업데이트를 불러오지 못했어요. 새로고침해 주세요.'; t.hidden = false; }
  });
})();