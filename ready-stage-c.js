(() => {
  'use strict';
  const VERSION = '2026.09.08-stage-g1-intake-planner';
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const join = src.includes('?') ? '&' : '?';
    script.src = `${src}${join}v=${encodeURIComponent(VERSION)}&cb=${Date.now()}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`));
    document.head.appendChild(script);
  });
  (async () => {
    await load('./ready-stage-c-base.js');
    await load('./ready-stage-d.js');
    await load('./ready-stage-e.js');
    await load('./ready-stage-f.js');
    if (!window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel) throw new Error('STAGE_G1_BOOT_MISSING');
    window.ReadyStageF.render?.();
    const f=window.ReadyStageF.validate?.(),e=window.ReadyStageE.validate?.();
    if(!f?.roleMarker||!f?.homePrimary||!f?.assignmentFactModel)throw new Error('STAGE_G1_ROLE_OR_FACT_MODEL_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('STAGE_G1_PLANNER_SEMANTICS_MISSING');
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => {
    console.error('[Ready Stage Loader]', error);
    document.documentElement.dataset.readyStageLoader = 'ERROR';
    const t = document.getElementById('toast');
    if (t) { t.textContent = `Preview 업데이트 오류 · ${error.message}`; t.hidden = false; }
  });
})();