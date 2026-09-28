/* Ready evening three-screen navigation binding.
 * REUSES existing Ready nav/Planner/session owners. No new store or allocation.
 * VISUAL_GATE: original weekly/day island art binding remains OPEN.
 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const screenNames = Object.freeze({ week:'이번 주 여정', day:'오늘의 탐험길', timer:'그냥! 지금 하면 돼!' });
  const targetView = () => $('.view.active')?.dataset.view || 'unknown';
  const tab = mode => {
    if (typeof window.nav !== 'function') throw new Error('READY_NAV_NOT_AVAILABLE');
    window.nav('planner');
    const button = document.querySelector('[data-planner-tab="'+mode+'"]');
    if (!button) throw new Error('PLANNER_TAB_NOT_AVAILABLE:'+mode);
    button.click();
  };
  const route = mode => {
    if (mode === 'week' || mode === 'day') return tab(mode);
    if (mode === 'timer') {
      // renderFocus checks for a real owned session; without one it routes to mission.
      // Do not create a timer/session by tapping navigation.
      if (typeof window.nav !== 'function') throw new Error('READY_NAV_NOT_AVAILABLE');
      window.nav('focus');
    }
  };
  const mount = () => {
    if (!window.ReadySetPlanner || typeof window.nav !== 'function' ||
        !$('#plannerView') || !$('#focusView')) throw new Error('CANONICAL_SCREEN_OWNER_MISSING');
    if ($('#readyThreeScreenNav')) return;
    const title = $('#plannerView .pageHeader h1');
    if (title) title.textContent = '이번 주 여정';
    const hero = $('#plannerHeroTitle');
    if (hero) hero.textContent = '이번 주 여정';
    const dayTitle = $('#plannerDayTitle');
    if (dayTitle) dayTitle.textContent = '오늘의 탐험길';
    const badge = $('#focusView .focusBadge');
    if (badge) badge.textContent = 'READY & SET';
    const focusTitle = $('#focusView .focusTitle h1');
    if (focusTitle) focusTitle.textContent = '그냥! 지금 하면 돼!';
    const missionHeading = $('#missionView .pageHeader h1');
    if (missionHeading) missionHeading.textContent = '오늘의 탐험 준비';
    const start = $('#startBtn');
    if (start) start.textContent = '탐험 시작';
    const nav = document.createElement('nav');
    nav.id = 'readyThreeScreenNav';
    nav.className = 'readyThreeScreenNav';
    nav.setAttribute('aria-label','Ready & Set 주요 화면');
    nav.innerHTML = Object.entries(screenNames).map(([key,name]) =>
      '<button type="button" data-ready-screen="'+key+'">'+name+'</button>').join('');
    nav.addEventListener('click', event => {
      const key = event.target.closest('[data-ready-screen]')?.dataset.readyScreen;
      if (!key) return;
      route(key);
      refresh();
    });
    document.body.appendChild(nav);
    const refresh = () => {
      const view = targetView();
      nav.hidden = view === 'focus' || view === 'recording' || view === 'result';
      const current = view === 'planner' ?
        ($('#plannerDayPanel')?.hidden ? 'week' : 'day') :
        view === 'focus' ? 'timer' : '';
      nav.querySelectorAll('button').forEach(button => {
        const selected = button.dataset.readyScreen === current;
        button.classList.toggle('on',selected);
        button.setAttribute('aria-current',selected?'page':'false');
      });
      if (view === 'planner') {
        const label = $('#plannerView .pageHeader h1');
        if (label) label.textContent = screenNames[current] || screenNames.week;
        const h = $('#plannerHeroTitle');
        if (h) h.textContent = screenNames[current] || screenNames.week;
      }
    };
    const observer = new MutationObserver(refresh);
    ['plannerView','focusView','recordingView','resultView','missionView','homeView'].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el,{attributes:true,attributeFilter:['class']});
    });
    document.querySelectorAll('[data-planner-tab]').forEach(b=>b.addEventListener('click',refresh));
    // When an active Focus screen has already been restored, never reset it.
    if (targetView() !== 'focus') tab('week');
    refresh();
    window.ReadyEveningCanonical = Object.freeze({screenNames, route, status:'FUNCTIONAL_BINDING_VISUAL_ASSET_OPEN'});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();