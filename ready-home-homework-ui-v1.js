(() => {
  'use strict';

  const VERSION = '2026.09.11-ready-home-homework-ui-v1.1';

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
    return [task.subject, task.volume, task.learningProgress ? `${task.learningProgress.remainingQuantity}% 남음` : '', task.deadline && task.deadline !== '미확정' ? `마감 ${task.deadline}` : ''].filter(Boolean).join(' · ');
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

  function reportDialog(task) {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', '한 일 기록');
    dialog.innerHTML = `<form><h3>이미 한 숙제 기록</h3><p>${escape(task.title)} · ${escape(task.volume)}</p>
      <p>이 숙제 전체에서 지금까지 한 만큼 알려 줘. 절반은 50%, 전부는 100%야.</p>
      <label>지금까지 한 양 (%) <input name="quantity" type="number" min="1" max="100" step="1" required value="${task.learningProgress?.completedQuantity || 100}"></label>
      <button type="button" data-whole>전부 했어 (100%)</button>
      <p><label>실제로 한 날짜 (몰라도 괜찮아) <input name="workDate" type="date" max="${new Date().toLocaleDateString('sv-SE')}"></label></p>
      <p role="alert"></p><button type="submit">기록하기</button> <button type="button" data-cancel>취소</button></form>`;
    document.body.appendChild(dialog);
    const form = dialog.querySelector('form');
    dialog.querySelector('[data-whole]').onclick = () => { form.elements.quantity.value = 100; };
    dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => dialog.remove());
    form.onsubmit = event => {
      event.preventDefault();
      try {
        api().recordLearning(task.task_id, {completedQuantity:Number(form.elements.quantity.value), actualWorkDate:form.elements.workDate.value || null});
        dialog.close();
        window.dispatchEvent(new Event('ready-homework-refresh'));
      } catch {
        dialog.querySelector('[role="alert"]').textContent = '이전보다 큰 전체 완료 비율(1~100%)과 오늘까지의 날짜를 넣어 줘. 저장이 안 되면 다시 열어 줘.';
      }
    };
    dialog.showModal();
  }

  function renderReports() {
    const core = api();
    if (!core) return;
    const parent = core.reportRole() === 'PARENT_REPORTED';
    const host = (parent && document.getElementById('rsfParent')?.parentElement) || document.getElementById('homeTodayTodoList')?.parentElement;
    if (!host) return;
    let section = document.getElementById('readyLearningReports');
    if (!section) { section = document.createElement('section'); section.id = 'readyLearningReports'; }
    if (section.parentElement !== host) host.appendChild(section);
    const tasks = core.tasks(true);
    section.innerHTML = '<h3>이미 한 숙제 · 한 일 기록</h3>' + tasks.map(task => {
      const progress = task.learningProgress;
      const reports = task.learningReports || [];
      return `<div class="readyHomeworkTask"><div><b>${escape(task.title)}</b><small>${escape(task.volume)}${progress ? ` · ${progress.completedQuantity}% 완료 · ${progress.remainingQuantity}% 남음` : ''}</small>
        ${reports.map(report => `<small>${report.source === 'CHILD_REPORTED' ? '내가 기록' : '보호자 기록'} · ${report.completedQuantity}% · 기록 ${escape(report.reportedAt.slice(0,10))} · 한 날짜 ${escape(report.actualWorkDate || '모름')}${report.confirmedAt ? ' · 보호자 확인됨' : ''}</small>
          ${parent && report.source === 'CHILD_REPORTED' && !report.confirmedAt ? `<button data-confirm-task="${escape(task.task_id)}" data-report="${escape(report.reportId)}">보호자 확인</button>` : ''}`).join('')}</div>
        ${task.status !== 'COMPLETED' ? `<button data-record-task="${escape(task.task_id)}">이미 했어 · 기록</button>` : '<span>완료</span>'}</div>`;
    }).join('');
    section.querySelectorAll('[data-record-task]').forEach(button => button.onclick = () => reportDialog(tasks.find(task => task.task_id === button.dataset.recordTask)));
    section.querySelectorAll('[data-confirm-task]').forEach(button => button.onclick = () => {
      try { core.confirmLearning(button.dataset.confirmTask, button.dataset.report); renderReports(); }
      catch { (window.toast || window.alert)('확인할 기록을 다시 선택해 주세요.'); }
    });
  }

  function render() {
    const core = api();
    renderReports();
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
      version:VERSION,
      corePresent:!!core,
      readyGate:model?.gate || null,
      title:document.getElementById('baseTodayTitle')?.textContent || null,
      primaryCTA:document.getElementById('readyHomeworkPrimary')?.textContent?.includes(model?.primary_action || '') || false,
      timerRequiredBeforeStart:false,
      uiMounted:document.documentElement.dataset.readyHomeworkUI === VERSION
    };
  }

  function boot() {
    style();
    render();
    window.addEventListener('pageshow', render);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
    window.addEventListener('ready-homework-refresh', render);
    window.ReadyHomeHomeworkUIV1 = Object.freeze({version:VERSION, render, validate});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
