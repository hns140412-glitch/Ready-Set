(() => {
  'use strict';

  const RUNTIME_VERSION = '2026.09.07-rev07-b';
  const specialistTargets = globalThis.ReadySetSpecialistTargets;
  if(!specialistTargets?.resolve||!specialistTargets?.trustedOrigins) throw new Error('READY_SPECIALIST_TARGETS_UNAVAILABLE');
  const VALID_TASK_STATES = new Set(['PENDING','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']);
  const TRUSTED_APP_ORIGINS = new Set(specialistTargets.trustedOrigins());

  const id = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const iso = ms => new Date(ms ?? Date.now()).toISOString();
  const uniq = arr => [...new Set(arr.filter(Boolean))];
  const nextLocalDateKey = () => {
    const d=new Date();
    d.setDate(d.getDate()+1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  function taskLabels(session) {
    return uniq([...(session?.selected || []), ...(session?.tasks || [])]);
  }

  function routeTask(link = {}) {
    const stored=link.execution_plan;
    if(stored&&['READY_EXECUTION_ROUTING','READY_LEARNING_ENGINE_ROUTING'].includes(stored.authority)&&Array.isArray(stored.allowed_specialists)&&Array.isArray(stored.handoff_queue)){
      return Object.freeze({
        router_version:stored.router_version||'PLANNER_STORED_EXECUTION_PLAN',
        authority:stored.authority,
        reported_authority:stored.reported_authority||null,
        mode:stored.mode||'READY_ORCHESTRATED',
        primary_app:stored.primary_app||link.execution_app||'ready-set',
        ready_owned:(stored.primary_app||link.execution_app||'ready-set')==='ready-set',
        handoffs:Array.isArray(stored.handoffs)?stored.handoffs:[],
        allowed_specialists:[...stored.allowed_specialists],
        handoff_queue:[...stored.handoff_queue],
        denied_by_default:true,
        reason:{stored_execution_plan:true}
      });
    }
    const router=window.ReadySpecialistRouter;
    if(router?.classify){
      return router.classify({
        subject:link.subject||null,
        matched_domain:link.matched_domain||link.domain||null,
        activity_types:Array.isArray(link.activity_types)?link.activity_types:[],
        activity_sequence:Array.isArray(link.activity_sequence)?link.activity_sequence:[],
        method_sequence:Array.isArray(link.method_sequence)?link.method_sequence:[]
      });
    }
    return Object.freeze({
      router_version:'LEGACY_FAIL_CLOSED',
      authority:'READY_EXECUTION_ROUTING',
      reported_authority:router?.authority||null,
      mode:'READY_ORCHESTRATED',
      primary_app:'ready-set',
      ready_owned:true,
      handoffs:[],
      allowed_specialists:[],
      denied_by_default:true,
      reason:{fallback:'ROUTER_UNAVAILABLE_NO_LABEL_GUESS'}
    });
  }

  function emit(type, payload = {}) {
    const c = state.activeSession?.rev07;
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
      const linked=(session.plannerLinks||[]);
      const tasks = linked.map((link, index) => ({
        task_id: `task_${session.id || Date.now()}_${index + 1}`,
        label:link.label,
        state: 'PENDING',
        planner_todo_id: link.todo_id,
        assignment_id:link.assignment_id||null,
        analysis_id:link.analysis_id||null,
        learning_unit_id:link.learning_unit_id||null,
        source_range:link.source_range||null,
        workbook_ref_id:link.workbook_ref_id||null,
        template_id:link.template_id||null,
        allocation_run_id:link.allocation_run_id||null,
        subject:link.subject||null,
        matched_domain:link.matched_domain||link.domain||null,
        activity_types:Array.isArray(link.activity_types)?[...link.activity_types]:[],
        activity_sequence:Array.isArray(link.activity_sequence)?[...link.activity_sequence]:[],
        method_sequence:Array.isArray(link.method_sequence)?[...link.method_sequence]:[],
        concept_skill_target:link.concept_skill_target||null,
        cognitive_load_profile:Array.isArray(link.cognitive_load_profile)?[...link.cognitive_load_profile]:[],
        divisible_boundary:link.divisible_boundary||null,
        confidence:Number.isFinite(link.confidence)?link.confidence:null,
        unresolved_flags:Array.isArray(link.unresolved_flags)?[...link.unresolved_flags]:[],
        review_lexical_ids:Array.isArray(link.review_lexical_ids)?[...link.review_lexical_ids]:[],
        specialist_material_binding:link.specialist_material_binding?structuredClone(link.specialist_material_binding):null,
        scheduled_date:link.date||null,
        execution_app:link.execution_app||link.execution_plan?.primary_app||'ready-set',
        execution_plan:link.execution_plan||null,
        route_plan:routeTask(link),
        completed_specialists:[],
        active_specialist:null,
        learning_evidence:[],
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
      if (window.ReadySetPlanner) {
        const plannerState = window.ReadySetPlanner.snapshot?.();
        const plannerTodos = plannerState?.dated_todos || [];
        tasks.forEach((task, index) => {
          if (!task.planner_todo_id) return;
          const todo = plannerTodos.find(x => x.todo_id === task.planner_todo_id);
          if (index === 0 && todo?.state === 'PLANNED') {
            window.ReadySetPlanner.recordTaskState({
              todo_id: task.planner_todo_id,
              ready_state: 'IN_PROGRESS',
              session_id: session.rev07.session_id,
              task_id: task.task_id,
              at: iso()
            });
          } else if (index > 0 && todo?.state === 'IN_PROGRESS' && todo?.active_session_id === session.rev07.session_id) {
            window.ReadySetPlanner.recordTaskState({
              todo_id: task.planner_todo_id,
              ready_state: 'PLANNED',
              session_id: session.rev07.session_id,
              task_id: task.task_id,
              at: iso()
            });
          }
        });
      }
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
    const c = session?.rev07;
    if (!task || !session || !c) return null;
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
    lap.result_state = resultState || task?.state || 'PENDING';
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
    // Session-internal specialist / wrap-up states stay inside REV_07.
    // Planner owns the dated TODO and receives the terminal result once, in finalizeSession().
    // Start/switch ownership is handled separately through IN_PROGRESS transitions.
    save();
    renderContractUI();
    return true;
  }

  function switchTask(taskId) {
    const c = ensureContract();
    const next = c?.tasks?.find(t => t.task_id === taskId);
    const previous = currentTask(c);
    if (!next || next.task_id === c.active_task_id || next.state !== 'PENDING') return;

    if (next.planner_todo_id && window.ReadySetPlanner) {
      const activated = window.ReadySetPlanner.recordTaskState({
        todo_id: next.planner_todo_id,
        ready_state: 'IN_PROGRESS',
        session_id: c.session_id,
        task_id: next.task_id,
        at: iso()
      });
      if (activated?.state !== 'IN_PROGRESS') return;
    }

    endActiveLap('TASK_CHANGE', previous?.state || 'PENDING');

    if (previous?.state === 'PENDING' && previous.planner_todo_id && window.ReadySetPlanner) {
      window.ReadySetPlanner.recordTaskState({
        todo_id: previous.planner_todo_id,
        ready_state: 'PLANNED',
        session_id: c.session_id,
        task_id: previous.task_id,
        at: iso()
      });
    }

    c.active_task_id = next.task_id;
    startLap(next, 'NEXT_TASK', state.activeSession);
    save();
    renderContractUI();
  }

  function appUrl(app) {
    return specialistTargets.resolve(app)?.url || location.href;
  }

  function prepareSpecialistLaunch(app) {
    const session = state.activeSession;
    const c = ensureContract(session);
    const task = currentTask(c);
    const lap = currentLap(c) || (task ? startLap(task, 'SPECIALIST_ROUTE', session) : null);
    if (!session || !c || !task || !lap || !['hide-seek','snap-pop'].includes(app)) {
      return {ok:false,reason:'SPECIALIST_LAUNCH_CONTEXT_INVALID'};
    }
    const plan=task.route_plan||routeTask(task);
    if(!window.ReadySpecialistRouter?.canLaunch?.(plan,app,task.completed_specialists||[])){
      emit('SPECIALIST_ROUTE_DENIED',{requested_app:app,route_plan:plan});
      return {ok:false,reason:'SPECIALIST_ROUTE_DENIED',requested_app:app};
    }

    c.active_app = app;
    task.active_specialist=app;
    emit('APP_SWITCH', { from: 'ready-set', to: app, lap_ended: false, route_plan:plan });
    save();

    const url = new URL(appUrl(app));
    url.searchParams.set('session_id', c.session_id);
    url.searchParams.set('goal_id', c.goal_id);
    url.searchParams.set('task_id', task.task_id);
    url.searchParams.set('lap_id', lap.lap_id);
    url.searchParams.set('return_target', `${location.origin}${location.pathname}`);
    const snapTarget=specialistTargets.resolve('snap-pop')?.url||null;
    if(snapTarget)url.searchParams.set('snap_target',snapTarget);
    url.searchParams.set('from_app', 'ready-set');
    url.searchParams.set('handoff_scope', app==='hide-seek'?'MEMORY_RETRIEVAL':'LEARNER_PRODUCTION');
    url.searchParams.set('route_authority',plan?.authority||'READY_EXECUTION_ROUTING');
    const targetDescriptor=specialistTargets.resolve(app);
    if(targetDescriptor?.target_kind)url.searchParams.set('target_kind',targetDescriptor.target_kind);
    if(window.ReadySpecialistHandoffContract?.encodeLearningContext){
      url.searchParams.set('learning_context',window.ReadySpecialistHandoffContract.encodeLearningContext(task));
    }
    if(task.specialist_material_binding?.confirmation_state==='HUMAN_CONFIRMED'){
      url.searchParams.set('material_binding',JSON.stringify(task.specialist_material_binding));
    }
    if(app==='hide-seek'&&Array.isArray(task.review_lexical_ids)&&task.review_lexical_ids.length){
      url.searchParams.set('review_directive',JSON.stringify({
        authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
        reviewPolicyOwner:'READY_LEARNING_ENGINE',
        scheduleOwner:'READY_SET_PLANNER',
        lexicalIds:[...new Set(task.review_lexical_ids.map(x=>String(x||'').trim()).filter(Boolean))].slice(0,24),
        directiveId:task.analysis_id||task.learning_unit_id||task.task_id,
        taskId:task.task_id,
        scheduledDate:task.scheduled_date||null
      }));
    }
    return {ok:true,app,url:url.href,task_id:task.task_id,lap_id:lap.lap_id};
  }

  function launchSpecialist(app) {
    const prepared=prepareSpecialistLaunch(app);
    if(!prepared?.ok)return false;
    location.assign(prepared.url);
    return true;
  }

  function acceptMaterialBinding(task,sourceApp,payload,eventId=null){
    const raw=payload?.materialBinding;
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    if(raw.contract_version!=='READY_SPECIALIST_MATERIAL_BINDING_V1')return null;
    if(raw.confirmation_state!=='HUMAN_CONFIRMED')return null;
    if(String(raw.specialist_app||'').trim()!==sourceApp)return null;
    if(!String(raw.specialist_material_id||'').trim())return null;
    const same=(a,b)=>String(a||'').trim()===String(b||'').trim();
    if(!same(raw.assignment_id,task.assignment_id))return null;
    if(raw.analysis_id&&!same(raw.analysis_id,task.analysis_id))return null;
    if(raw.learning_unit_id&&!same(raw.learning_unit_id,task.learning_unit_id))return null;
    if(!same(raw.source_range,task.source_range))return null;
    if(!same(raw.workbook_ref_id,task.workbook_ref_id))return null;
    if(!same(raw.concept_skill_target,task.concept_skill_target))return null;
    const actor=String(window.ReadyFamilySession?.current?.()?.role||'').toUpperCase();
    if(!['PARENT','CHILD'].includes(actor))return null;
    try{
      const binding=window.ReadyAssignments?.confirmSpecialistBinding?.({
        actor,
        assignment_id:task.assignment_id,
        analysis_id:task.analysis_id,
        learning_unit_id:task.learning_unit_id,
        source_range:task.source_range,
        workbook_ref_id:task.workbook_ref_id,
        concept_skill_target:task.concept_skill_target,
        specialist_app:sourceApp,
        specialist_material_id:raw.specialist_material_id,
        specialist_material_kind:raw.specialist_material_kind||null,
        confirmation_source:raw.confirmation_source||'SPECIALIST_USER_ACTION',
        source_event_id:eventId||raw.source_event_id||null
      })||null;
      if(binding){
        task.specialist_material_binding=structuredClone(binding);
        window.ReadySetPlanner?.applySpecialistMaterialBinding?.(binding);
      }
      return binding;
    }catch{
      return null;
    }
  }

  function normalizeInboundState(raw) {
    if (!raw) return null;
    if (VALID_TASK_STATES.has(raw)) return raw;
    if (raw === 'HELP_NEEDED') return 'BLOCKED';
    return null;
  }

  function applyInboundResult({ session_id, task_id, lap_id, task_state, from_app, event_id = null, payload = null }) {
    const c = ensureContract();
    if (!c || !session_id || session_id !== c.session_id) return false;
    if (event_id && c.applied_event_ids?.includes(event_id)) return false;
    const task = c.tasks.find(t => t.task_id === task_id);
    if (!task) return false;
    const sourceApp=window.ReadySpecialistHandoffContract?.sourceApp?.(from_app)||null;
    if(!sourceApp){
      emit('SPECIALIST_RETURN_DENIED',{from_app:null,event_id:event_id||null,reason:'SOURCE_APP_REQUIRED',route_plan:task.route_plan||null});
      return false;
    }
    if(!window.ReadySpecialistHandoffContract?.authorized?.(task,sourceApp)||
       task.active_specialist!==sourceApp){
      emit('SPECIALIST_RETURN_DENIED',{from_app:sourceApp,event_id:event_id||null,reason:'ROUTE_OR_SEQUENCE_MISMATCH',route_plan:task.route_plan||null,active_specialist:task.active_specialist||null});
      return false;
    }

    const normalized = normalizeInboundState(task_state);
    const acceptedBinding=acceptMaterialBinding(task,sourceApp,payload,event_id||null);
    const evidence=window.ReadyEvidenceOntology?.specialistEvidence?.({
      task,from_app:sourceApp,task_state:normalized||task_state||null,payload,event_id:event_id||null
    })||null;
    if(evidence)task.learning_evidence=window.ReadyEvidenceOntology?.append?.(task.learning_evidence||[],evidence)||[...(task.learning_evidence||[]),evidence].slice(-120);
    c.active_app = 'ready-set';
    c.active_task_id = task.task_id;
    if (lap_id) c.active_lap_id = lap_id;
    if(normalized==='COMPLETED'){
      task.completed_specialists=[...new Set([...(task.completed_specialists||[]),sourceApp])];
      task.active_specialist=null;
      const next=window.ReadySpecialistRouter?.nextSpecialist?.(task.route_plan,task.completed_specialists||[])||null;
      if(next){
        setTaskState(task.task_id,'PARTIAL',sourceApp);
      }else{
        setTaskState(task.task_id,'COMPLETED',sourceApp);
        endActiveLap('SPECIALIST_RESULT','COMPLETED');
      }
    }else if(normalized){
      setTaskState(task.task_id,normalized,sourceApp);
      if(normalized==='BLOCKED')endActiveLap('SPECIALIST_RESULT','BLOCKED');
    }
    if (event_id) c.applied_event_ids = [...(c.applied_event_ids || []), event_id].slice(-200);
    emit('APP_RETURN', { from: sourceApp || from_app || 'specialist', task_state: normalized || task_state || null, specialist_payload:payload||null, evidence_record:evidence||null, material_binding:acceptedBinding||null });
    save();
    renderContractUI();
    return true;
  }

  function consumeReturnQuery() {
    const p = new URLSearchParams(location.search);
    let eventArgs=null;
    const rawEvent=p.get('learning_event');
    if(rawEvent&&window.ReadySpecialistHandoffContract?.normalizeReturnEvent){
      try{
        eventArgs=window.ReadySpecialistHandoffContract.normalizeReturnEvent(JSON.parse(rawEvent));
      }catch{}
    }
    const args = eventArgs || {
      session_id: p.get('session_id'),
      task_id: p.get('task_id'),
      lap_id: p.get('lap_id'),
      task_state: p.get('task_state'),
      from_app: p.get('from_app'),
      event_id: p.get('event_id'),
      payload:null
    };
    if (!args?.session_id || !args?.task_id || !applyInboundResult(args)) return;
    ['session_id','goal_id','task_id','lap_id','task_state','from_app','event_id','learning_event','memory_summary','specialist_report'].forEach(k => p.delete(k));
    const clean = `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`;
    history.replaceState(null, '', clean);
  }

  function handleLearningEvent(messageEvent) {
    if (!TRUSTED_APP_ORIGINS.has(messageEvent.origin)) return;
    const e = messageEvent.data?.type === 'TAKY_LEARNING_EVENT' ? messageEvent.data.event : null;
    if (!e) return;
    const normalized=window.ReadySpecialistHandoffContract?.normalizeReturnEvent?.(e);
    if(!normalized)return;
    applyInboundResult(normalized);
  }

  function labelState(value) {
    return ({
      PENDING:'미확정', COMPLETED:'완료', PARTIAL:'일부 남음', DEFERRED:'다음에',
      WAITING_FOR_PARENT:'부모 도움', BLOCKED:'막힘'
    })[value] || value;
  }

  function injectStyles() {
    if (document.getElementById('readyRev07Style')) return;
    const style = document.createElement('style');
    style.id = 'readyRev07Style';
    style.textContent = `
      .rev07-panel{margin:12px 0 4px;padding:14px;border-radius:22px;background:rgba(255,255,255,.72);border:1px solid rgba(40,30,25,.10);backdrop-filter:blur(12px)}
      .rev07-panel small{display:block;opacity:.62;font-weight:800;letter-spacing:.08em}.rev07-panel h3{margin:4px 0 10px;font-size:17px}.rev07-row{display:flex;gap:8px;flex-wrap:wrap}.rev07-row button{border:0;border-radius:999px;padding:9px 12px;font-weight:800;background:#fff}.rev07-row button.primary{background:#2a231f;color:#fff}.rev07-tasks{margin-top:10px;display:grid;gap:6px}.rev07-task{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:0;border-radius:14px;background:rgba(255,255,255,.62);font-size:13px;text-align:left}.rev07-task.active{outline:2px solid rgba(42,35,31,.3)}
      .rev07-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,16,14,.45)}.rev07-modal[hidden]{display:none}.rev07-sheet{width:min(680px,100%);max-height:82vh;overflow:auto;background:#fffaf5;border-radius:30px 30px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.2)}.rev07-sheet h2{margin:0 0 5px}.rev07-wrap-task{padding:12px 0;border-top:1px solid rgba(0,0,0,.08)}.rev07-wrap-task b{display:block;margin-bottom:8px}.rev07-state-grid{display:flex;gap:6px;flex-wrap:wrap}.rev07-state-grid button{border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:999px;padding:8px 10px}.rev07-state-grid button.on{background:#2a231f;color:#fff}.rev07-wrap-actions{display:flex;gap:8px;position:sticky;bottom:0;padding-top:14px;background:#fffaf5}.rev07-wrap-actions button{flex:1;border:0;border-radius:16px;padding:13px;font-weight:900}.rev07-wrap-actions .end{background:#2a231f;color:#fff}.rev07-wrap-actions .end:disabled{opacity:.35}.rev07-guide{padding:10px 12px;border-radius:16px;background:#f3eadf;margin-bottom:12px}.rev07-voice{margin:8px 0;border:0;border-radius:14px;padding:10px 12px;font-weight:800;background:#f1d59b}`;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    const control = document.querySelector('#focusView .controlPanel');
    if (!control) return null;
    let panel = document.getElementById('readyRev07Panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'readyRev07Panel';
      panel.className = 'rev07-panel';
      control.before(panel);
      panel.addEventListener('click', event => {
        const app = event.target.closest('[data-rev07-app]')?.dataset.rev07App;
        if (app) return launchSpecialist(app);
        const taskId = event.target.closest('[data-rev07-task]')?.dataset.rev07Task;
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
        ${(()=>{const app=task?window.ReadySpecialistRouter?.nextSpecialist?.(task.route_plan,task.completed_specialists||[]):null;return app?`<button class="primary" data-rev07-app="${app}">${app==='hide-seek'?'Hide & Seek':'Snap & Pop'}</button>`:''})()}
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
    modal.addEventListener('click', event => {
      const btn = event.target.closest('[data-wrap-state]');
      if (!btn) return;
      setTaskState(btn.dataset.taskId, btn.dataset.wrapState, 'WRAP_UP');
      renderWrapUp();
    });
    document.getElementById('rev07CancelEnd').onclick = () => { modal.hidden = true; };
    document.getElementById('rev07ConfirmEnd').onclick = finalizeSession;
    document.getElementById('rev07VoiceBtn').onclick = voiceClarify;
    return modal;
  }

  function renderWrapUp() {
    const c = ensureContract();
    const modal = ensureWrapUp();
    if (!c) return;
    const unresolved = c.tasks.filter(t => t.state === 'PENDING');
    document.getElementById('rev07GuideLine').textContent = unresolved.length
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
    const task = c?.tasks?.find(t => t.state === 'PENDING');
    if (!task) return toast('미확정 과제가 없어요.');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast('이 브라우저에서는 음성 입력을 지원하지 않아요.');
    try { speakGuide(`${task.label}, 어떻게 됐는지만 말해줘.`); } catch {}
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    document.getElementById('rev07VoiceText').textContent = `${task.label} 듣는 중…`;
    rec.onresult = event => {
      const text = event.results?.[0]?.[0]?.transcript?.trim() || '';
      const parsed = parseVoiceState(text);
      if (parsed) setTaskState(task.task_id, parsed, 'VOICE_WRAP_UP');
      renderWrapUp();
      document.getElementById('rev07VoiceText').textContent = parsed
        ? `“${text}” → ${labelState(parsed)}`
        : `“${text}” · 상태가 명확하지 않아 버튼으로 확인해 주세요.`;
    };
    rec.onerror = () => { document.getElementById('rev07VoiceText').textContent = '음성 입력을 확인하지 못했어요.'; };
    rec.start();
  }

  function finalizeSession() {
    const c = ensureContract();
    if (!c) return;
    if (c.tasks.some(t => t.state === 'PENDING')) {
      toast('미확정 과제 상태를 먼저 정리해 주세요.');
      return renderWrapUp();
    }
    endActiveLap('SESSION_END', currentTask(c)?.state || 'PENDING');
    const taskOutcomes = [];
    for (const task of c.tasks) {
      const actualMs = (task.laps || []).reduce((sum, lap) => sum + (Number.isFinite(lap.elapsed_ms) ? lap.elapsed_ms : 0), 0);
      const plannerOutcome = task.planner_todo_id && window.ReadySetPlanner
        ? window.ReadySetPlanner.recordSessionOutcome({
            todo_id: task.planner_todo_id,
            ready_state: task.state,
            actual_ms: actualMs,
            session_id: c.session_id,
            task_id: task.task_id,
            learning_evidence:Array.isArray(task.learning_evidence)?[...task.learning_evidence]:[],
            completed_specialists:Array.isArray(task.completed_specialists)?[...task.completed_specialists]:[],
            at: iso()
          })
        : null;
      taskOutcomes.push({
        task_id: task.task_id,
        planner_todo_id: task.planner_todo_id || null,
        label: task.label,
        state: task.state,
        actual_ms: actualMs,
        plannerOutcome
      });
    }
    const evidenceAssignments=[...new Set(c.tasks
      .filter(t=>t.assignment_id&&Array.isArray(t.learning_evidence)&&t.learning_evidence.length)
      .map(t=>t.assignment_id))];
    const adaptiveReviews=[];
    for(const assignmentId of evidenceAssignments){
      const review=window.ReadyIntegrationV1?.reviewLearningEvidence?.(assignmentId,{start_date:nextLocalDateKey()})||null;
      adaptiveReviews.push({assignment_id:assignmentId,review});
    }

    c.session_state = 'ENDED';
    c.ended_at = iso();
    c.active_app = 'ready-set';
    emit('SESSION_ENDED', {
      task_states: c.tasks.map(t => ({ task_id:t.task_id, state:t.state })),
      adaptive_reviews:adaptiveReviews.map(x=>({
        assignment_id:x.assignment_id,
        ok:!!x.review?.ok,
        reason:x.review?.reason||null,
        review_analysis_id:x.review?.review_analysis_id||null
      }))
    });
    save();
    document.getElementById('readyRev07Wrap').hidden = true;
    if (typeof completeSessionFromTaskOutcomes === 'function') {
      completeSessionFromTaskOutcomes(taskOutcomes);
    } else {
      toast('세션 결과 기록기를 찾지 못했어요.');
    }
  }

  function validateContract() {
    const c = state.activeSession?.rev07;
    if (!c) return { ok:false, reason:'NO_ACTIVE_REV07_SESSION' };
    const activeLaps = c.tasks.flatMap(t => t.laps || []).filter(l => !l.ended_at);
    const taskIds = new Set(c.tasks.map(t => t.task_id));
    const plannerRuntime = window.ReadySetPlanner?.sessionRuntimeStatus?.(c.session_id) || {in_progress:[]};
    const activePlannerTodos = Array.isArray(plannerRuntime.in_progress) ? plannerRuntime.in_progress : [];
    const activeTask = currentTask(c);
    const checks = {
      oneSessionId: !!c.session_id,
      oneGoalId: !!c.goal_id,
      oneActiveTask: !c.active_task_id || taskIds.has(c.active_task_id),
      atMostOnePlannerTaskInProgress: activePlannerTodos.length <= 1,
      plannerActiveMatchesRuntimeTask: activePlannerTodos.length === 0 || !!activeTask?.planner_todo_id && activePlannerTodos[0].todo_id === activeTask.planner_todo_id,
      atMostOneActiveLap: activeLaps.length <= 1,
      activeLapPointerValid: !c.active_lap_id || activeLaps.some(l => l.lap_id === c.active_lap_id),
      validTaskStates: c.tasks.every(t => VALID_TASK_STATES.has(t.state)),
      singleActiveApp: ['ready-set','hide-seek','snap-pop'].includes(c.active_app)
    };
    return { ok:Object.values(checks).every(Boolean), checks };
  }

  const originalNav = nav;

  function patchHandlers() {
    window.addEventListener('readyset-session-started',()=>{
      if (state.activeSession) {
        ensureContract();
        renderContractUI();
      }
    });
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
        el.textContent = 'APP_VERSION 0.9.3-rc1 · MASTER REV_07 · SCHEMA 5 + REV_07 SESSION CONTRACT';
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
      validate: validateContract,
      launchSpecialist,
      prepareSpecialistLaunch,
      setTaskState,
      switchTask,
      openWrapUp
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
