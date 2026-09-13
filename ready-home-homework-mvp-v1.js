(() => {
  'use strict';

  const VERSION = '2026.09.11-ready-home-homework-mvp-v1.3';
  const PLANNER_KEY = 'readyset_planner_v1';
  const IDENTITY_KEY = 'readyset_identity_v1';

  const clone = value => {
    try { return structuredClone(value); } catch { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  };
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const readJSON = (key, fallback = null) => {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const taskLabel = task => [String(task?.title || task?.subject || '숙제').trim(), String(task?.volume || '').trim(), task?.learningProgress ? `${task.learningProgress.remainingQuantity}% 남음` : ''].filter(Boolean).join(' · ');

  function identity() { return readJSON(IDENTITY_KEY, {}) || {}; }
  function planner() { return readJSON(PLANNER_KEY, {version:1, days:{}}) || {version:1, days:{}}; }
  function dayPlan() { return planner().days?.[todayKey()] || {localDate:todayKey(), tasks:[]}; }
  function tasks(includeCompleted = false) {
    return (dayPlan().tasks || []).filter(task => task && (includeCompleted || task.status !== 'COMPLETED')).map((task, index) => ({
      task_id: String(task.task_id || task.id || `task_${todayKey()}_${index + 1}`),
      planner_id: task.id == null ? null : String(task.id),
      subject: task.subject || '기타',
      title: task.title || '숙제',
      volume: task.volume || '',
      deadline: task.deadline || '미확정',
      required: task.required !== false,
      source: task.source || 'PLANNER',
      status: task.status || 'PLANNED',
      estimate_min: Number(task.estimatedMin) > 0 ? Number(task.estimatedMin) : null,
      estimate_kind: task.estimateKind || 'UNVERIFIED',
      selected: !!task.selected,
      learningProgress: clone(task.learningProgress || null),
      learningReports: clone(task.learningReports || [])
    }));
  }

  // A cumulative share of the original plan, never minutes or inferred page counts.
  const reportRole = () => new URLSearchParams(location.search).get('role') === 'parent' ? 'PARENT_REPORTED' : 'CHILD_REPORTED';
  function reportTask(data, taskId) {
    const task = data.days?.[todayKey()]?.tasks?.find(item => String(item.task_id || item.id) === String(taskId));
    if (!task) throw new Error('TODAY_TASK_REQUIRED');
    return task;
  }
  function recordLearning(taskId, {completedQuantity, actualWorkDate = null} = {}) {
    if (!Number.isFinite(completedQuantity) || completedQuantity <= 0 || completedQuantity > 100) throw new Error('QUANTITY_1_TO_100_REQUIRED');
    if (actualWorkDate !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(actualWorkDate) ||
        !Number.isFinite(Date.parse(actualWorkDate)) || new Date(actualWorkDate).toISOString().slice(0,10) !== actualWorkDate || actualWorkDate > todayKey())) throw new Error('INVALID_WORK_DATE');
    const data = planner();
    const task = reportTask(data, taskId);
    const previous = task.learningProgress?.completedQuantity ?? null;
    if (task.status === 'COMPLETED' || (previous !== null && completedQuantity <= previous)) throw new Error('REPORT_MUST_INCREASE_TOTAL');
    const reports = task.learningReports || [];
    if (reports.length >= 100) throw new Error('REPORT_LIMIT_REACHED');
    const report = {
      reportId: `report_${Date.now()}_${Math.random().toString(36).slice(2,10)}`,
      source: reportRole(), reportedAt: new Date().toISOString(), actualWorkDate,
      plannedQuantity: 100, completedQuantity, unit: 'PERCENT_OF_PLAN',
      plannedVolume: task.volume || null, previousStatus: task.status || 'PLANNED',
      confirmedBy: null, confirmedAt: null
    };
    task.learningReports = [...reports, report];
    task.learningProgress = {plannedQuantity:100, completedQuantity, remainingQuantity:100-completedQuantity, unit:'PERCENT_OF_PLAN'};
    task.status = completedQuantity === 100 ? 'COMPLETED' : 'PARTIAL';
    writeJSON(PLANNER_KEY, data);
    return clone(report);
  }
  function confirmLearning(taskId, reportId) {
    if (reportRole() !== 'PARENT_REPORTED') throw new Error('PARENT_ROLE_REQUIRED');
    const data = planner();
    const report = reportTask(data, taskId).learningReports?.find(item => item.reportId === reportId);
    if (!report || report.source !== 'CHILD_REPORTED') throw new Error('CHILD_REPORT_REQUIRED');
    if (!report.confirmedAt) {
      report.confirmedBy = 'PARENT_REPORTED';
      report.confirmedAt = new Date().toISOString();
      writeJSON(PLANNER_KEY, data);
    }
    return clone(report);
  }

  function confirmedCharacter() {
    const value = identity();
    const confirmed = value.status === 'READY' || value.characterStatus === 'CONFIRMED' || !!value.characterVisualId;
    return confirmed ? {
      confirmed:true,
      name:value.nickname || value.userName || value.legalName || '',
      characterVisualId:value.characterVisualId || null,
      explorerId:value.explorerId || null
    } : {confirmed:false, name:'', characterVisualId:null, explorerId:null};
  }

  function chooseStartMode(list = tasks()) {
    const ready = list.filter(task => ['PLANNED','PARTIAL','DEFERRED'].includes(task.status));
    if (!ready.length) return {mode:'EMPTY', tasks:[]};
    if (ready.length === 1) return {mode:'DIRECT', tasks:ready};
    const selected = ready.filter(task => task.selected);
    return {mode:'PICK', tasks:selected.length ? selected : ready};
  }

  function canonical() { return window.ReadySetRev07 || null; }
  function canonicalSession() { return canonical()?.contract?.() || null; }
  function hostSession() { return window.state?.activeSession || null; }
  function persistHost() { if (typeof window.save === 'function') window.save(); }

  function selectPlannerTask(task) {
    const data = planner();
    const day = data.days?.[todayKey()];
    if (!day) throw new Error('TODAY_PLAN_REQUIRED');
    const wanted = String(task?.planner_id || task?.task_id || '');
    let found = false;
    day.tasks = (day.tasks || []).map(item => {
      const id = String(item.id ?? item.task_id ?? '');
      const selected = id === wanted;
      if (selected) found = true;
      return {...item, selected};
    });
    if (!found) throw new Error('PLANNER_TASK_NOT_FOUND');
    writeJSON(PLANNER_KEY, data);
  }

  function readyTasks(chosen) {
    const available = tasks().filter(task => ['PLANNED','PARTIAL','DEFERRED'].includes(task.status));
    const hit = available.find(task => task.task_id === chosen.task_id);
    if (!hit) throw new Error('TASK_NOT_READY');
    return [hit, ...available.filter(task => task.task_id !== hit.task_id)];
  }

  function seedCanonicalTaskList(chosen) {
    const host = hostSession();
    if (!host) throw new Error('READY_HOST_SESSION_REQUIRED');
    const ordered = readyTasks(chosen);
    host.tasks = ordered.map(taskLabel);
    host.selected = [];
    host.taskLabel = taskLabel(ordered[0]);
    host.homeworkTaskMap = ordered.map((task, position) => ({
      homework_task_id:task.task_id,
      planner_id:task.planner_id,
      label:taskLabel(task),
      position,
      canonical_task_id:null
    }));
    persistHost();
    return ordered;
  }

  function bindCanonicalTaskIds() {
    const host = hostSession();
    const contract = canonicalSession();
    if (!host?.homeworkTaskMap || !contract?.tasks) return false;
    host.homeworkTaskMap = host.homeworkTaskMap.map(entry => ({
      ...entry,
      canonical_task_id:contract.tasks[entry.position]?.task_id || null
    }));
    persistHost();
    return host.homeworkTaskMap.every(entry => !!entry.canonical_task_id);
  }

  function resolveCanonicalTaskId(homeworkTaskId) {
    const host = hostSession();
    const entry = host?.homeworkTaskMap?.find(item => item.homework_task_id === String(homeworkTaskId));
    return entry?.canonical_task_id || null;
  }

  function createSession(task) {
    if (!task?.task_id) throw new Error('TASK_REQUIRED');
    if (!window.ReadyBaseRuntimeV1?.start) throw new Error('CANONICAL_READY_RUNTIME_REQUIRED');
    if (!canonical()?.switchTask) throw new Error('REV07_RUNTIME_REQUIRED');
    selectPlannerTask(task);
    window.ReadyBaseRuntimeV1.start();
    const ordered = seedCanonicalTaskList(task);
    canonical().switchTask('__READY_HOME_ENSURE_CONTRACT__');
    const session = canonicalSession();
    if (!session?.session_id) throw new Error('CANONICAL_SESSION_NOT_CREATED');
    if (session.tasks?.length !== ordered.length) throw new Error('CANONICAL_TASK_SEED_MISMATCH');
    if (!bindCanonicalTaskIds()) throw new Error('CANONICAL_TASK_BIND_FAILED');
    return clone(canonicalSession());
  }

  function activeSession() { return canonicalSession(); }

  function switchTask(homeworkTaskId) {
    const runtime = canonical();
    const session = canonicalSession();
    if (!runtime || !session) throw new Error('NO_ACTIVE_CANONICAL_SESSION');
    const canonicalTaskId = resolveCanonicalTaskId(homeworkTaskId);
    if (!canonicalTaskId) throw new Error('TASK_NOT_IN_CANONICAL_SESSION');
    runtime.switchTask(canonicalTaskId);
    return clone(canonicalSession());
  }

  const RESULT_STATES = new Set(['COMPLETED','PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT']);
  const LAP_REASON_BY_RESULT = Object.freeze({
    COMPLETED:'TASK_COMPLETED', PARTIAL:'TASK_PARTIAL', DEFERRED:'TASK_DEFERRED',
    BLOCKED:'TASK_BLOCKED', WAITING_FOR_PARENT:'WAITING_FOR_PARENT'
  });

  function finishTask(result) {
    if (!RESULT_STATES.has(result)) throw new Error('INVALID_TASK_RESULT');
    const runtime = canonical();
    const session = canonicalSession();
    if (!runtime || !session?.active_task_id) throw new Error('NO_ACTIVE_CANONICAL_SESSION');
    if (!runtime.setTaskState(session.active_task_id, result)) throw new Error('CANONICAL_TASK_UPDATE_FAILED');
    return clone(canonicalSession());
  }

  function endSession() {
    const runtime = canonical();
    if (!runtime || !canonicalSession()) return null;
    runtime.openWrapUp();
    return clone(canonicalSession());
  }

  function renderHomeModel() {
    const character = confirmedCharacter();
    const list = tasks();
    const start = chooseStartMode(list);
    return {
      version:VERSION,
      gate:character.confirmed ? 'READY_HOME' : 'CHARACTER_REQUIRED',
      character,
      title:'오늘 뭐부터 탐험할까?',
      primary_action:start.mode === 'EMPTY' ? '숙제 추가' : '숙제 시작',
      start_mode:start.mode,
      task_count:list.length,
      tasks:start.tasks
    };
  }

  function validate() {
    const model = renderHomeModel();
    const session = canonicalSession();
    const map = hostSession()?.homeworkTaskMap || [];
    return {
      version:VERSION,
      characterGate:['READY_HOME','CHARACTER_REQUIRED'].includes(model.gate),
      oneDominantCTA:['숙제 시작','숙제 추가'].includes(model.primary_action),
      timerOptional:true,
      target_min:null,
      startMode:model.start_mode,
      sessionPresent:!!session,
      sessionOwner:'ReadySetRev07',
      duplicateSessionStore:false,
      multiTaskCanonical:session ? session.tasks?.length === map.length && map.every(entry => !!entry.canonical_task_id) : true,
      canonicalValid:session ? !!canonical()?.validate?.().ok : true,
      resultStates:[...RESULT_STATES],
      lapReasons:Object.values(LAP_REASON_BY_RESULT)
    };
  }

  window.ReadyHomeHomeworkMVPV1 = Object.freeze({
    version:VERSION, model:renderHomeModel, tasks, chooseStartMode, createSession,
    activeSession:() => clone(activeSession()), switchTask, finishTask, endSession,
    resolveCanonicalTaskId, recordLearning, confirmLearning, reportRole, validate
  });

  document.documentElement.dataset.readyHomeHomeworkMvp = VERSION;
})();
