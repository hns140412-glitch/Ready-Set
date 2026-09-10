(() => {
  'use strict';

  const VERSION = '2026.09.11-ready-home-homework-ui-v1';

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const api = () => window.ReadyHomeHomeworkMVPV1 || null;
  const go = view => {
    try {
      if (typeof window.nav === 'function') return window.nav(view);
    } catch {}
    const button = document.querySelector(`[data-nav="${view}"]`);
    if (button) button.click();
  };

  function style() {
    if (document.getElementById('readyHomeHomeworkUIStyle')) return;
    const node = document.createElement('style');
    node.id = 'readyHomeHomeworkUIStyle';
    node.textContent = `
      #readyHomeworkPrimary{width:100%;border:0;border-radius:22px;padding:18px 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left;background:#191919;color:#fff;box-shadow:0 12px 28px rgba(21,45,58,.18)}
      #readyHomeworkPrimary span{display:grid;gap:3px}#readyHomeworkPrimary small{font-size:11px;font-weight:850;letter-spacing:.08em;color:#ffd51f}#readyHomeworkPrimary b{font-size:21px;line-height:1.15}#readyHomeworkPrimary strong{font-size:24px;color:#ffd51f}
      #readyHomeworkPrimary.ready-empty{background:rgba(255,255,255,.92);color:#173f5b;border:1px solid rgba(19,77,109,.12)}#readyHomeworkPrimary.ready-empty small{color:#68879a}#readyHomeworkPrimary.ready-empty strong{color:#173f5b}
      .readyHomeworkTask{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:14px 15px;border-radius:18px;background:rgba(255,255,255,.86);border:1px solid rgba(19,77,109,.10);margin-top:9px}
      .readyHomeworkTask b{display:block;color:#173f5b}.readyHomeworkTask small{display:block;margin-top:4px;color:#6b8494;font-weight:700}.readyHomeworkTask button{border:0;border-radius:13px;background:#173f5b;color:#fff;padding:10px 12px;font-weight:900}
      #readyHomeworkPicker{position:fixed;inset:0;z-index:12000;background:rgba(7,27,39,.38);display:flex;align-items:flex-end}#readyHomeworkPicker[hidden]{display:none}#readyHomeworkPicker .sheet{width:100%;max-height:68dvh;overflow:auto;background:#f7fcff;border-radius:28px 28px 0 0;padding:22px 17px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -14px 40px rgba(0,0,0,.18)}
      #readyHomeworkPicker h3{margin:0 0 5px;font-size:24px;color:#173f5b}#readyHomeworkPicker p{margin:0 0 14px;color:#678294;font-weight:700}#readyHomeworkPicker .pick{width:100%;border:1px solid rgba(19,77,109,.12);background:#fff;border-radius:17px;padding:14px;margin-top:8px;text-align:left}#readyHomeworkPicker .pick b{display:block;font-size:16px;color:#173f5b}#readyHomeworkPicker .pick small{display:block;margin-top:4px;color:#718999}#readyHomeworkPicker .close{width:100%;border:0;border-radius:15px;padding:12px;margin-top:12px;background:#e6f0f5;color:#31566d;font-weight:900}
    `;
    document.head.appendChild(node);
  }

  function taskMeta(task) {
    return [task.subject, task.volume, task.deadline && task.deadline !== '미확정' ? `마감 ${task.deadline}` : ''].filter(Boolean).join(' · ');
  }

  function startTask(task) {
    const core = api();
    if (!core || !task) return;
    try {
      core.createSession(task);
      document.documentElement.dataset.readyHomeworkStart = 'ACTIVE';
      go('focus');
    } catch (error) {
      console.error('[Ready Homework Start]', error);
      document.documentElement.dataset.readyHomeworkStart = `ERROR:${error.message || 'UNKNOWN'}`;
    }
  }

  function picker(tasks) {
    let modal = document.getElementById('readyHomeworkPicker');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'readyHomeworkPicker';
      modal.hidden = true;
      modal.innerHTML = '<div class="sheet"><h3>어떤 숙제부터 갈까?</h3><p>지금 하나만 고르면 돼.</p><div class="list"></div><button class="close">닫기</button></div>';
      document.body.appendChild(modal);
      modal.querySelector('.close').onclick = () => { modal.hidden = true; };
      modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
    }
    const list = modal.querySelector('.list');
    list.innerHTML = tasks.map(task => `<button class="pick" data-homework-task="${escape(task.task_id)}"><b>${escape(task.title)}</b><small>${escape(taskMeta(task) || '분량 확인 필요')}</small></button>`).join('');
    list.querySelectorAll('[data-homework-task]').forEach(button => button.onclick = () => {
      const task = tasks.find(item => item.task_id === button.dataset.homeworkTask);
      modal.hidden = true;
      startTask(task);
    });
    modal.hidden = false;
  }

  function onPrimary(model) {
    if (model.gate !== 'READY_HOME') return;
    if (model.start_mode === 'EMPTY') {
      go('mission');
      return;
    }
    if (model.start_mode === 'DIRECT') {
      startTask(model.tasks[0]);
      return;
    }
    picker(model.tasks);
  }

  function render() {
    const core = api();
    const actions = document.getElementById('baseActions');
    const todo = document.getElementById('homeTodayTodoList');
    if (!core || !actions || !todo) return false;
    const model = core.model();

    if (model.gate !== 'READY_HOME') {
      document.documentElement.dataset.readyHomeworkUI = 'CHARACTER_REQUIRED';
      return false;
    }

    const childName = model.character?.name ? `${model.character.name}, ` : '';
    const title = document.getElementById('baseHomeTitle');
    const lead = document.getElementById('baseHomeLead');
    const todayTitle = document.getElementById('baseTodayTitle');
    if (title) title.textContent = `${childName}오늘 뭐부터 탐험할까?`;
    if (lead) lead.textContent = model.task_count ? `오늘 숙제 ${model.task_count}개. 지금은 하나만 시작하면 돼.` : '오늘 숙제를 먼저 불러오자.';
    if (todayTitle) todayTitle.textContent = '오늘 뭐부터 탐험할까?';

    actions.innerHTML = `<button id="readyHomeworkPrimary" class="${model.start_mode === 'EMPTY' ? 'ready-empty' : ''}"><span><small>${model.start_mode === 'EMPTY' ? 'TODAY HOMEWORK' : 'READY TO START'}</small><b>${escape(model.primary_action)}</b></span><strong>→</strong></button>`;
    actions.querySelector('#readyHomeworkPrimary').onclick = () => onPrimary(model);

    const shown = core.tasks().slice(0, 3);
    todo.innerHTML = shown.length ? shown.map(task => `<div class="readyHomeworkTask"><div><b>${escape(task.title)}</b><small>${escape(taskMeta(task) || '분량 확인 필요')}</small></div><button data-quick-start="${escape(task.task_id)}">시작</button></div>`).join('') : '<div class="baseEmpty">오늘 등록된 숙제가 없어요. 부모/관리자에서 숙제를 추가해 주세요.</div>';
    todo.querySelectorAll('[data-quick-start]').forEach(button => button.onclick = () => {
      const task = core.tasks().find(item => item.task_id === button.dataset.quickStart);
      startTask(task);
    });

    document.documentElement.dataset.readyHomeworkUI = VERSION;
    return true;
  }

  function validate() {
    const core = api();
    const model = core?.model?.();
    return {
      version: VERSION,
      corePresent: !!core,
      readyGate: model?.gate || null,
      title: document.getElementById('baseTodayTitle')?.textContent || null,
      primaryCTA: document.getElementById('readyHomeworkPrimary')?.textContent?.includes(model?.primary_action || '') || false,
      timerRequiredBeforeStart: false,
      uiMounted: document.documentElement.dataset.readyHomeworkUI === VERSION
    };
  }

  function boot() {
    style();
    let attempts = 0;
    const tryRender = () => {
      attempts += 1;
      if (render() || attempts >= 20) return;
      setTimeout(tryRender, 100);
    };
    tryRender();
    window.addEventListener('pageshow', render);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
    window.ReadyHomeHomeworkUIV1 = Object.freeze({version:VERSION, render, validate});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
