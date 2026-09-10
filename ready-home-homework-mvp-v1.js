(() => {
  'use strict';

  const VERSION = '2026.09.11-ready-home-homework-mvp-v1.1';
  const PLANNER_KEY = 'readyset_planner_v1';
  const IDENTITY_KEY = 'readyset_identity_v1';
  const SESSION_KEY = 'readyset_homework_session_v1';

  const clone = value => {
    try { return structuredClone(value); } catch { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  };
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const readJSON = (key, fallback = null) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function identity() { return readJSON(IDENTITY_KEY, {}) || {}; }
  function planner() { return readJSON(PLANNER_KEY, {version:1, days:{}}) || {version:1, days:{}}; }
  function dayPlan() { return planner().days?.[todayKey()] || {localDate:todayKey(), tasks:[]}; }
  function tasks() {
    return (dayPlan().tasks || []).filter(task => task && task.status !== 'COMPLETED').map((task, index) => ({
      task_id: task.task_id || task.id || `task_${todayKey()}_${index + 1}`,
      subject: task.subject || '기타',
      title: task.title || '숙제',
      volume: task.volume || '',
      deadline: task.deadline || '미확정',
      required: task.required !== false,
      source: task.source || 'PLANNER',
      status: task.status || 'PLANNED',
      estimate_min: Number(task.estimatedMin) > 0 ? Number(task.estimatedMin) : null,
      estimate_kind: task.estimateKind || 'UNVERIFIED',
      selected: !!task.selected
    }));
  }

  function confirmedCharacter() {
    const value = identity();
    const confirmed = value.status === 'READY' || value.characterStatus === 'CONFIRMED' || !!value.characterVisualId;
    return confirmed ? {
      confirmed: true,
      name: value.nickname || value.userName || value.legalName || '',
      characterVisualId: value.characterVisualId || null,
      explorerId: value.explorerId || null
    } : {confirmed:false, name:'', characterVisualId:null, explorerId:null};
  }

  function chooseStartMode(list = tasks()) {
    const ready = list.filter(task => task.status === 'PLANNED' || task.status === 'PARTIAL' || task.status === 'DEFERRED');
    if (!ready.length) return {mode:'EMPTY', tasks:[]};
    if (ready.length === 1) return {mode:'DIRECT', tasks:ready};
    const selected = ready.filter(task => task.selected);
    return {mode:'PICK', tasks:selected.length ? selected : ready};
  }

  function createSession(task) {
    if (!task?.task_id) throw new Error('TASK_REQUIRED');
    const now = new Date().toISOString();
    const session = {
      version: 1,
      session_id: uid('session'),
      state: 'ACTIVE',
      started_at: now,
      ended_at: null,
      active_task_id: task.task_id,
      active_lap_id: uid('lap'),
      task_order: tasks().map(item => item.task_id),
      target_min: null,
      laps: [],
      results: {}
    };
    session.laps.push({
      lap_id: session.active_lap_id,
      task_id: task.task_id,
      started_at: now,
      ended_at: null,
      end_reason: null
    });
    writeJSON(SESSION_KEY, session);
    return clone(session);
  }

  function activeSession() { return readJSON(SESSION_KEY, null); }

  function closeLap(session, reason) {
    if (!session?.active_lap_id) return;
    const lap = session.laps?.find(item => item.lap_id === session.active_lap_id);
    if (lap && !lap.ended_at) {
      lap.ended_at = new Date().toISOString();
      lap.end_reason = reason;
    }
  }

  function switchTask(taskId) {
    const list = tasks();
    const nextTask = list.find(task => task.task_id === taskId);
    if (!nextTask) throw new Error('TASK_NOT_FOUND');
    const session = activeSession();
    if (!session || session.state !== 'ACTIVE') return createSession(nextTask);
    if (session.active_task_id === taskId) return clone(session);
    closeLap(session, 'TASK_SWITCH');
    const now = new Date().toISOString();
    const lap = {lap_id:uid('lap'), task_id:taskId, started_at:now, ended_at:null, end_reason:null};
    session.active_task_id = taskId;
    session.active_lap_id = lap.lap_id;
    session.laps = [...(session.laps || []), lap];
    writeJSON(SESSION_KEY, session);
    return clone(session);
  }

  const RESULT_STATES = new Set(['COMPLETED','PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT']);
  const LAP_REASON_BY_RESULT = Object.freeze({
    COMPLETED: 'TASK_COMPLETED',
    PARTIAL: 'TASK_PARTIAL',
    DEFERRED: 'TASK_DEFERRED',
    BLOCKED: 'TASK_BLOCKED',
    WAITING_FOR_PARENT: 'WAITING_FOR_PARENT'
  });
  function finishTask(result) {
    if (!RESULT_STATES.has(result)) throw new Error('INVALID_TASK_RESULT');
    const session = activeSession();
    if (!session || session.state !== 'ACTIVE') throw new Error('NO_ACTIVE_SESSION');
    closeLap(session, LAP_REASON_BY_RESULT[result]);
    session.results = {...(session.results || {}), [session.active_task_id]: {state:result, at:new Date().toISOString()}};
    session.active_lap_id = null;
    writeJSON(SESSION_KEY, session);
    return clone(session);
  }

  function endSession() {
    const session = activeSession();
    if (!session) return null;
    if (session.state === 'ACTIVE' && session.active_lap_id) closeLap(session, 'SESSION_END');
    session.state = 'ENDED';
    session.ended_at = new Date().toISOString();
    session.active_lap_id = null;
    writeJSON(SESSION_KEY, session);
    return clone(session);
  }

  function renderHomeModel() {
    const character = confirmedCharacter();
    const list = tasks();
    const start = chooseStartMode(list);
    return {
      version: VERSION,
      gate: character.confirmed ? 'READY_HOME' : 'CHARACTER_REQUIRED',
      character,
      title: '오늘 뭐부터 탐험할까?',
      primary_action: start.mode === 'EMPTY' ? '숙제 추가' : '숙제 시작',
      start_mode: start.mode,
      task_count: list.length,
      tasks: start.tasks
    };
  }

  function validate() {
    const model = renderHomeModel();
    return {
      version: VERSION,
      characterGate: ['READY_HOME','CHARACTER_REQUIRED'].includes(model.gate),
      oneDominantCTA: ['숙제 시작','숙제 추가'].includes(model.primary_action),
      timerOptional: true,
      startMode: model.start_mode,
      sessionPresent: !!activeSession(),
      resultStates: [...RESULT_STATES],
      lapReasons: Object.values(LAP_REASON_BY_RESULT)
    };
  }

  window.ReadyHomeHomeworkMVPV1 = Object.freeze({
    version: VERSION,
    model: renderHomeModel,
    tasks,
    chooseStartMode,
    createSession,
    activeSession: () => clone(activeSession()),
    switchTask,
    finishTask,
    endSession,
    validate
  });

  document.documentElement.dataset.readyHomeHomeworkMvp = VERSION;
})();
