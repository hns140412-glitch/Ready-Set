(() => {
  'use strict';

  const RUNTIME_VERSION = '2026.09.07-rev07-a';
  const HIDE_URL = 'https://dainty-froyo-a6e427.netlify.app';
  const SNAP_URL = 'https://cheerful-pothos-d1c3ee.netlify.app';
  const VALID_TASK_STATES = new Set(['PENDING','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']);
  const TRUSTED_APP_ORIGINS = new Set([new URL(HIDE_URL).origin, new URL(SNAP_URL).origin]);

  const id = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const iso = ms => new Date(ms ?? Date.now()).toISOString();
  const uniq = arr => [...new Set(arr.filter(Boolean))];

  function taskLabels(session) {
    return uniq([...(session?.selected || []), ...(session?.tasks || [])]);
  }

  function suggestedApp(label = '') {
    const x = String(label).toLowerCase();
    if (/단어|vocab|word|철자|뜻/.test(x)) return 'hide-seek';
    if (/라이팅|글쓰기|문장|말하기|녹음|표현|writing|speaking|sentence/.test(x)) return 'snap-pop';
    return 'ready-set';
  }

  function emit(type, payload = {}) {
    const s = state.activeSession;
    const c = s?.rev07;
    if (!c) return null;
    const event = {
      event_id: id('ready_event'),
      type,
      app: 'ready-set',
      at: iso(),
      session_id: c.session_id,
      goal_id: c.goal_id,
      task_id: c.active_task_id || null,
      lap_id: c.active_lap_id || null,
      payload
    };
    c.events = [...(c.events || []), event].slice(-200);
    save();
    return event;
  }

  function ensureContract(session = state.activeSession) {
    if (!session) return null;
    if (!session.rev07) {
      const labels = taskLabels(session);
      const tasks = labels.map((label, index) => ({
        task_id: `task_${session.id || Date.now()}_${index + 1}`,
        label,
        state: 'PENDING',
        suggested_app: suggestedApp(label),
        laps: []
      }));
      session.rev07 = {
        contract_version: 'REV_07',
        session_id: session.id || id('session'),
        goal_id: id('goal'),
        session_state: 'ACTIVE',
        active_task_id: tasks[0]?.task_id || null,
        active_lap_id: null,
        active_app: 'ready-set',
        tasks,
        events: [],
        created_at: iso(session.startAt || Date.now())
      };
      if (tasks[0]) startLap(tasks[0], 'SESSION_START', session);
      save();
    }
    return session.rev07;
  }

  function currentTask(contract = ensureContract()) {
    return contract?.tasks?.find(t => t.task_id === contract.active_task_id) || null;
  }

  function currentLap(contract = ensureContract()) {
    const task = currentTask(contract);
    return task?.laps?.find(l => l.lap_id === contract.active_lap_id) || null;
  }

  function startLap(task, reason = 'TASK_START', session = state.activeSession) {
    if (!task || !session) return null;
    const c = session.rev07 || ensureContract(session);
    const now = Date.now();
    const lap = {
      lap_id: id('lap'),
      task_id: task.task_id,
      started_at: iso(now),
      started_ms: now,
      ended_at: null,
      elapsed_ms: null,
      end_reason: null,
      result_state: null
    };
    task.laps = [...(task.laps || []), lap];
    c.active_task_id = task.task_id;
    c.active_lap_id = lap.lap_id;
    c.active_app = 'ready-set';
    emit('LAP_STARTED', { reason, label: task.label });
    return lap;
  }

  function endActiveLap(reason = 'TASK_CHANGE', resultState = null) {
    const c = ensureContract();
    const lap = currentLap(c);
    const task = currentTask(c);
    if (!lap || lap.ended_at) return lap;
    const now = Date.now();
    lap.ended_at = iso(now);
    lap.elapsed_ms = Math.max(0, now - Number(lap.started_ms || now));
    lap.end_reason = reason;
    lap.result_state = resultState || task?.state || 'PARTIAL';
    c.active_lap_id = null;
    emit('LAP_ENDED', { reason, result_state: lap.result_state, elapsed_ms: lap.elapsed_ms });
    return lap;
  }

  function setTaskState(taskId, nextState, source = 'READY_UI') {
    const c = ensureContract();
    const task = c?.tasks?.find(t => t.task_id === taskId);
    if (!task || !VALID_TASK_STATES.has(nextState)) return false;
    const previous = task.state;
    task.state = nextState;
    task.updated_at = iso();
    emit('TASK_STATE_CHANGED', { task_id: taskId, previous, next: nextState, source });
    save();
    renderContractUI();
    return true;
  }

  function switchTask(taskId) {
    const c = ensureContract();
    const next = c?.tasks?.find(t => t.task_id === taskId);
    if (!next || next.task_id === c.active_task_id) return;
    endActiveLap('TASK_CHANGE', currentTask(c)?.state || 'PARTIAL');
    c.active_task_id = next.task_id;
    startLap(next, 'NEXT_TASK');
    save();
    renderContractUI();
  }

  function appUrl(app) {
    return app === 'hide-seek' ? HIDE_URL : app === 'snap-pop' ? SNAP_URL : location.href;
  }

  function launchSpecialist(app) {
    const s = state.activeSession;
    const c = ensureContract(s);
    const task = currentTask(c);
    const lap = currentLap(c) || (task ? startLap(task, 'SPECIALIST_ROUTE', s) : null);
    if (!s || !c || !task || !lap || !['hide-seek','snap-pop'].includes(app)) return;

    c.active_app = app;
    emit('APP_SWITCH', { from: 'ready-set', to: app, lap_ended: false });
    save();

    const url = new URL(appUrl(app));
    url.searchParams.set('session_id', c.session_id);
    url.searchParams.set('goal_id', c.goal_id);
    url.searchParams.set('task_id', task.task_id);
    url.searchParams.set('lap_id', lap.lap_id);
    url.searchParams.set('return_target', `${location.origin}${location.pathname}`);
    url.searchParams.set('snap_target', SNAP_URL);
    url.searchParams.set('from_app', 'ready-set');
    location.assign(url.href);
  }

  function normalizeInboundState(raw) {
    if (!raw) return null;
    if (VALID_TASK_STATES.has(raw)) return raw;
    if (raw === 'HELP_NEEDED') return 'BLOCKED';
    return null;
  }

  function applyInboundResult({ session_id, task_id, lap_id, task_state, from_app, event_id = null }) {
    const s = state.activeSession;
    const c = ensureContract(s);
    if (!s || !c || !session_id || session_id !== c.session_id) return false;
    if (event_id && c.applied_event_ids?.includes(event_id)) return false;
    const task = c.tasks.find(t => t.task_id === task_id);
    if (!task) return false;

    const normalized = normalizeInboundState(task_state);
    c.active_app = 'ready-set';
    c.active_task_id = task.task_id;
    if (lap_id) c.active_lap_id = lap_id;
    if (normalized) setTaskState(task.task_id, normalized, from_app || 'SPECIALIST');

    if (['COMPLETED','BLOCKED'].includes(normalized)) {
      endActiveLap('SPECIALIST_RESULT', normalized);
    }
    if (event_id) c.applied_event_ids = [...(c.applied_event_ids || []), event_id].slice(-200);
    emit('APP_RETURN', { from: from_app || 'specialist', task_state: normalized || task_state || null });
    save();
    renderContractUI();
    return true;
  }

  function consumeReturnQuery() {
    const p = new URLSearchParams(location.search);
    const session_id = p.get('session_id');
    const task_id = p.get('task_id');
    if (!session_id || !task_id) return;
    applyInboundResult({
      session_id,
      task_id,
      lap_id: p.get('lap_id'),
      task_state: p.get('task_state'),
      from_app: p.get('from_app')
    });
    ['session_id','goal_id','task_id','lap_id','task_state','from_app'].forEach(k => p.delete(k));
    const clean = `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`;
    history.replaceState(null, '', clean);
  }

  function handleLearningEvent(messageEvent) {
    if (!TRUSTED_APP_ORIGINS.has(messageEvent.origin)) return;
    const data = messageEvent.data;
    if (data?.type !== 'TAKY_LEARNING_EVENT' || !data.event) return;
    const e = data.event;
    const taskState = e.type === 'TASK_COMPLETED' ? 'COMPLETED'
      : e.type === 'TASK_BLOCKED' ? 'BLOCKED'
      : e.type === 'HELP_NEEDED' ? 'BLOCKED'
      : e.type === 'TASK_PARTIAL' ? 'PARTIAL'
      : null;
    applyInboundResult({
      session_id: e.session_id,
      task_id: e.task_id,
      lap_id: e.lap_id,
      task_state: taskState,
      from_app: e.app,
      event_id: e.event_id
    });
  }

  function labelState(stateName) {
    return ({
      PENDING:'미확정', COMPLETED:'완료', PARTIAL:'일부 남음', DEFERRED:'다음에',
      WAITING_FOR_PARENT:'부모 도움', BLOCKED:'막힘'
    })[stateName] || stateName;
  }

  function injectStyles() {
    if (document.getElementById('readyRev07Style')) return;
    const style = document.createElement('style');
    style.id = 'readyRev07Style';
    style.textContent = `
      .rev07-panel{margin:12px 0 4px;padding:14px;border-radius:22px;background:rgba(255,255,255,.72);border:1px solid rgba(40,30,25,.10);backdrop-filter:blur(12px)}
      .rev07-panel small{display:block;opacity:.62;font-weight:800;letter-spacing:.08em}.rev07-panel h3{margin:4px 0 10px;font-size:17px}.rev07-row{display:flex;gap:8px;flex-wrap:wrap}.rev07-row button{border:0;border-radius:999px;padding:9px 12px;font-weight:800;background:#fff}.rev07-row button.primary{background:#2a231f;color:#fff}.rev07-tasks{margin-top:10px;display:grid;gap:6px}.rev07-task{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.62);font-size:13px}.rev07-task.active{outline:2px solid rgba(42,35,31,.3)}
      .rev07-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,16,14,.45)}.rev07-modal[hidden]{display:none}.rev07-sheet{width:min(680px,100%);max-height:82vh;overflow:auto;background:#fffaf5;border-radius:30px 30px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.2)}.rev07-sheet h2{margin:0 0 5px}.rev07-sheet p{margin:0 0 14px;opacity:.68}.rev07-wrap-task{padding:12px 0;border-top:1px solid rgba(0,0,0,.08)}.rev07-wrap-task b{display:block;margin-bottom:8px}.rev07-state-grid{display:flex;gap:6px;flex-wrap:wrap}.rev07-state-grid button{border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:999px;padding:8px 10px}.rev07-state-grid button.on{background:#2a231f;color:#fff}.rev07-wrap-actions{display:flex;gap:8px;position:sticky;bottom:0;padding-top:14px;background:#fffaf5}.rev07-wrap-actions button{flex:1;border:0;border-radius:16px;padding:13px;font-weight:900}.rev07-wrap-actions .end{background:#2a231f;color:#fff}.rev07-guide{padding:10px 12px;border-radius:16px;background:#f3eadf;margin-bottom:12px}.rev07-voice{margin:8px 0;border:0;border-radius:14px;padding:10px 12px;font-weight:800;background:#f1d59b}`;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    const focusMain = document.querySelector('#focusView .focusMain');
    const control = document.querySelector('#focusView .controlPanel');
    if (!focusMain || !control) return null;
    let panel = document.getElementById('readyRev07Panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'readyRev07Panel';
      panel.className = 'rev07-panel';
      control.before(panel);
      panel.addEventListener('click', e => {
        const app = e.target.closest('[data-rev07-app]')?.dataset.rev07App;
        if (app) return launchSpecialist(app);
        const taskId = e.target.closest('[data-rev07-task]')?.dataset.rev07Task;
        if (taskId) return switchTask(taskId);
      });
    }
    return panel;
  }

  function renderContractUI() {
    const c = ensureContract();
    const panel = ensurePanel();
    if (!c || !panel) return;
    const task = currentTask(c);
    panel.innerHTML = `
      <small>ONE SESSION · CONTINUOUS TIMER</small>
      <h3>${task ? escapeHtml(task.label) : '현재 과제 없음'} · ${task ? labelState(task.state) : ''}</h3>
      <div class="rev07-row">
        <button class="primary" data-rev07-app="hide-seek">Hide & Seek</button>
        <button class="primary" data-rev07-app="snap-pop">Snap & Pop</button>
      </div>
      <div class="rev07-tasks">${c.tasks.map(t => `<button class="rev07-task ${t.task_id===c.active_task_id?'active':''}" data-rev07-task="${t.task_id}"><span>${escapeHtml(t.label)}</span><strong>${labelState(t.state)}</strong></button>`).join('')}</div>`;
    const mission = document.getElementById('focusMission');
    if (mission && task) mission.textContent = task.label;
  }

  function ensureWrapUp() {
    let modal = document.getElementById('readyRev07Wrap');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'readyRev07Wrap';
    modal.className = 'rev07-modal';
    modal.hidden = true;
    modal.innerHTML = `<div class="rev07-sheet"><h2>오늘은 여기까지?</h2><div class="rev07-guide" id="rev07GuideLine"></div><div id="rev07WrapTasks"></div><button class="rev07-voice" id="rev07VoiceBtn" type="button">미확정 과제 음성으로 말하기</button><div id="rev07VoiceText"></div><div class="rev07-wrap-actions"><button id="rev07CancelEnd">계속하기</button><button class="end" id="rev07ConfirmEnd">세션 종료</button></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      const btn = e.target.closest('[data-wrap-state]');
      if (btn) setTaskState(btn.dataset.taskId, btn.dataset.wrapState, 'WRAP_UP');
    });
    document.getElementById('rev07CancelEnd').onclick = () => { modal.hidden = true; };
    document.getElementById('rev07ConfirmEnd').onclick = finalizeSession;
    document.getElementById('rev07VoiceBtn').onclick = voiceClarify;
    return modal;
  }

  function renderWrapUp() {
    const c = ensureContract();
    const modal = ensureWrapUp();
    const unresolved = c.tasks.filter(t => t.state === 'PENDING');
    const line = document.getElementById('rev07GuideLine');
    line.textContent = unresolved.length
      ? `${state.guide?.name || '길잡이'}: ${unresolved.map(t => t.label).join(', ')} 상태만 짧게 알려줘.`
      : `${state.guide?.name || '길잡이'}: 좋아. 빠진 상태 없이 정리됐어.`;
    document.getElementById('rev07WrapTasks').innerHTML = c.tasks.map(t => `
      <div class="rev07-wrap-task"><b>${escapeHtml(t.label)} · ${labelState(t.state)}</b><div class="rev07-state-grid">
      ${['COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED'].map(s => `<button class="${t.state===s?'on':''}" data-wrap-state="${s}" data-task-id="${t.task_id}">${labelState(s)}</button>`).join('')}
      </div></div>`).join('');
    document.getElementById('rev07ConfirmEnd').disabled = unresolved.length > 0;
    modal.hidden = false;
  }

  function openWrapUp() {
    ensureContract();
    renderWrapUp();
  }

  function parseVoiceState(text) {
    if (/다\s*했|끝났|완료/.test(text)) return 'COMPLETED';
    if (/아빠|엄마|부모|도움/.test(text)) return 'WAITING_FOR_PARENT';
    if (/내일|나중|다음에/.test(text)) return 'DEFERRED';
    if (/막혔|못하겠|모르겠/.test(text)) return 'BLOCKED';
    if (/남았|덜 했|조금/.test(text)) return 'PARTIAL';
    return null;
  }

  function voiceClarify() {
    const c = ensureContract();
    const task = c.tasks.find(t => t.state === 'PENDING');
    if (!task) { toast('미확정 과제가 없어요.'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('이 브라우저에서는 음성 입력을 지원하지 않아요.'); return; }
    try { speakGuide?.(`${task.label}, 어떻게 됐는지만 말해줘.`); } catch {}
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    document.getElementById('rev07VoiceText').textContent = `${task.label} 듣는 중…`;
    rec.onresult = e => {
      const text = e.results?.[0]?.[0]?.transcript?.trim() || '';
      const parsed = parseVoiceState(text);
      document.getElementById('rev07VoiceText').textContent = parsed ? `“${text}” → ${labelState(parsed)}` : `“${text}” · 상태가 명확하지 않아 버튼으로 확인해 주세요.`;
      if (parsed) setTaskState(task.task_id, parsed, 'VOICE_WRAP_UP');
      renderWrapUp();
    };
    rec.onerror = () => { document.getElementById('rev07VoiceText').textContent = '음성 입력을 확인하지 못했어요.'; };
    rec.start();
  }

  function finalizeSession() {
    const s = state.activeSession;
    const c = ensureContract(s);
    if (!s || !c) return;
    if (c.tasks.some(t => t.state === 'PENDING')) {
      toast('미확정 과제 상태를 먼저 정리해 주세요.');
      renderWrapUp();
      return;
    }
    endActiveLap('SESSION_END', currentTask(c)?.state || 'PARTIAL');
    c.session_state = 'ENDED';
    c.ended_at = iso();
    c.active_app = 'ready-set';
    emit('SESSION_ENDED', { task_states: c.tasks.map(t => ({ task_id:t.task_id, state:t.state })) });
    save();
    document.getElementById('readyRev07Wrap').hidden = true;
    originalCompleteSession();
  }

  const originalCompleteSession = completeSession;
  const originalStart = document.getElementById('startBtn')?.onclick;
  const originalNav = nav;

  function patchHandlers() {
    const start = document.getElementById('startBtn');
    if (start && originalStart) {
      start.onclick = async function patchedStart(event) {
        await originalStart.call(this, event);
        if (state.activeSession) {
          ensureContract();
          renderContractUI();
        }
      };
    }
    const end = document.getElementById('completeBtn');
    if (end) {
      end.textContent = '세션 종료';
      end.onclick = openWrapUp;
    }
    nav = function patchedNav(name) {
      originalNav(name);
      if (name === 'focus' && state.activeSession) setTimeout(renderContractUI, 0);
    };
  }

  function normalizeVersionText() {
    document.querySelectorAll('#settingsView .muted').forEach(el => {
      if (/APP_VERSION\s+0\.9\.2/.test(el.textContent || '')) {
        el.textContent = 'APP_VERSION 0.9.2 + REV_07 Runtime Bridge · MASTER REV_07 · SCHEMA 5 + session contract';
      }
    });
  }

  function boot() {
    document.documentElement.dataset.readyRuntime = RUNTIME_VERSION;
    injectStyles();
    patchHandlers();
    ensureWrapUp();
    normalizeVersionText();
    if (state.activeSession) {
      ensureContract();
      consumeReturnQuery();
      renderContractUI();
    }
    window.addEventListener('message', handleLearningEvent);
    window.ReadySetRev07 = Object.freeze({
      version: RUNTIME_VERSION,
      contract: () => state.activeSession?.rev07 ? structuredClone(state.activeSession.rev07) : null,
      launchSpecialist,
      setTaskState,
      switchTask,
      openWrapUp
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
