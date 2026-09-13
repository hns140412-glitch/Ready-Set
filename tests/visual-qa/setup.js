/* Injected by the QA server before Ready preboot; never included by production. */
(() => {
  'use strict';
  if (location.hostname !== '127.0.0.1' || location.port !== '4177' || location.pathname !== '/__visual/') return;
  const fixture = new URLSearchParams(location.search).get('state');
  const steps = {'onboarding-mode':'MODE', 'onboarding-profile':'PROFILE', 'onboarding-photo':'PHOTO'};
  if (!Object.hasOwn(steps, fixture)) return;
  // Dedicated disposable QA origin only. Seed the existing identity owner, no session store.
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('readyset_identity_v1', JSON.stringify({
    schemaVersion:5, status:'UNSET', onboardingStep:steps[fixture],
    setupMode:'GUARDIAN_FOR_CHILD', operator:{role:'GUARDIAN',name:''},
    legalName:'김테스트', nickname:'별이', familyRole:'CHILD', birthDate:'2016-03-14',
    schoolStage:'E4', shareNameMode:'NAME_NICKNAME', sourcePhoto:''
  }));
  const NativeDate = Date;
  window.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : ['2026-09-11T03:00:00.000Z'])); }
    static now() { return NativeDate.parse('2026-09-11T03:00:00.000Z'); }
  };
  let seed = 42;
  Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
  document.head.appendChild(style);
  window.addEventListener('load', async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, img => img.decode().catch(() => {})));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!document.querySelector('#readyFirstRun .firstRunSky')) return;
      window.scrollTo(0, 0);
      document.documentElement.dataset.visualQaReady = fixture;
    }));
  }, {once:true});
})();
