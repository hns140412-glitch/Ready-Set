(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyHideMemoryReviewV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0';
  const clean=v=>String(v??'').trim();
  const uniq=a=>[...new Set((a||[]).map(clean).filter(Boolean))];

  function interpretHideMemorySummary(packet={}){
    if(packet?.authority!=='SPECIALIST_MEMORY_ADVISORY_ONLY')return {ok:false,reason:'HIDE_ADVISORY_AUTHORITY_REQUIRED'};
    if(packet?.reviewPolicyOwner!=='READY_LEARNING_ENGINE')return {ok:false,reason:'READY_REVIEW_POLICY_OWNER_REQUIRED'};
    if(packet?.scheduleOwner!=='READY_SET_PLANNER')return {ok:false,reason:'PLANNER_SCHEDULE_OWNER_REQUIRED'};
    if(packet?.prioritySemantics!=='ADVISORY_SIGNAL_NOT_DATE')return {ok:false,reason:'ADVISORY_PRIORITY_SEMANTICS_REQUIRED'};
    const rows=(Array.isArray(packet.reviewAdvisories)?packet.reviewAdvisories:[])
      .filter(x=>x?.advisoryOnly===true&&x?.evidenceBasis==='HIDE_MEMORY_EVIDENCE')
      .map(x=>({
        lexicalId:clean(x.lexicalId),
        nextReviewPriority:Number.isFinite(Number(x.nextReviewPriority))?Number(x.nextReviewPriority):0,
        reason:clean(x.reason)||'stable',
        recoveryStatus:clean(x.recoveryStatus)||'UNPROVEN',
        needsUnassistedRecall:x.needsUnassistedRecall===true,
        memoryStrength:Number.isFinite(Number(x.memoryStrength))?Number(x.memoryStrength):null,
        learningContextRef:x.learningContextRef&&typeof x.learningContextRef==='object'?{...x.learningContextRef}:null
      }))
      .filter(x=>x.lexicalId)
      .map(x=>({...x,reviewNeed:x.needsUnassistedRecall||['NEEDS_UNASSISTED_RECALL','IMMEDIATE_ONLY'].includes(x.recoveryStatus)?'REQUIRED':(x.reason!=='stable'&&x.nextReviewPriority>0?'RECOMMENDED':'NONE')}))
      .filter(x=>x.reviewNeed!=='NONE')
      .sort((a,b)=>(a.reviewNeed==='REQUIRED'?0:1)-(b.reviewNeed==='REQUIRED'?0:1)||b.nextReviewPriority-a.nextReviewPriority)
      .slice(0,12);
    if(!rows.length)return {ok:true,decision:null,reason:'NO_REVIEW_NEEDED'};
    const lexicalIds=uniq(rows.map(x=>x.lexicalId));
    return {ok:true,decision:{
      authority:'READY_LEARNING_ENGINE_REVIEW_POLICY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      policyState:rows.some(x=>x.reviewNeed==='REQUIRED')?'REVIEW_REQUIRED':'REVIEW_RECOMMENDED',
      lexicalIds,
      evidence:rows,
      date:null,
      todoId:null
    }};
  }

  function directiveForPlannerTodo(todo={},taskId=null){
    const p=todo?.provenance||{};
    const lexicalIds=uniq(p.lexical_ids);
    if(todo?.source!=='PLANNER_SPECIALIST_MEMORY_REVIEW')return null;
    if(p.kind!=='HIDE_MEMORY_REVIEW')return null;
    if(p.review_policy_authority!=='READY_LEARNING_ENGINE')return null;
    if(p.schedule_authority!=='READY_SET_PLANNER')return null;
    if(!lexicalIds.length)return null;
    return Object.freeze({
      authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      lexicalIds,
      directiveId:'hide-review:'+clean(todo.todo_id),
      taskId:clean(taskId)||clean(todo.todo_id)||null,
      scheduledDate:clean(todo.date)||null
    });
  }

  function normalizeHideSpecialistResult(payload={}){
    const memory=payload?.memorySummary;
    if(!memory||memory.authority!=='SPECIALIST_MEMORY_ADVISORY_ONLY')return null;
    if(memory.reviewPolicyOwner!=='READY_LEARNING_ENGINE'||memory.scheduleOwner!=='READY_SET_PLANNER')return null;
    const contract=clean(payload.resultContract)||'HIDE_SPECIALIST_RESULT_V1';
    if(!['HIDE_SPECIALIST_RESULT_V1','HIDE_SPECIALIST_RESULT_V2'].includes(contract))return null;
    const isV2=contract==='HIDE_SPECIALIST_RESULT_V2'||clean(payload.runtime)==='V2';
    return Object.freeze({
      sourceApp:'hide-seek',
      resultContract:isV2?'HIDE_SPECIALIST_RESULT_V2':'HIDE_SPECIALIST_RESULT_V1',
      runtime:clean(payload.runtime)||null,
      evidenceAuthority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      activeMissionId:isV2?(clean(payload.activeMissionId)||null):null,
      missionStatus:isV2?(clean(payload.missionStatus)||null):null,
      activeSheetId:!isV2?(clean(payload.activeSheetId)||null):null,
      sheetStatus:!isV2?(clean(payload.sheetStatus)||null):null,
      taskState:clean(payload.taskState)||null,
      learningPhase:clean(payload.learningPhase)||null,
      trailMastery:Number.isFinite(Number(payload.trailMastery))?Number(payload.trailMastery):null,
      memorySummary:JSON.parse(JSON.stringify(memory))
    });
  }

  function normalizeHideV2ReturnEvent(event={}){
    const eventType=clean(event.event_type||event.type);
    if(event?.source!=='hide-seek'||eventType!=='TASK_COMPLETED')return null;
    const payload=event?.payload;
    if(!payload||payload.resultContract!=='HIDE_SPECIALIST_RESULT_V2'||clean(payload.runtime)!=='V2')return null;
    if(!normalizeHideSpecialistResult(payload))return null;
    const ctx=payload.taskContext||{};
    const sessionId=clean(ctx.session_id),taskId=clean(ctx.task_id);
    if(!sessionId||!taskId)return null;
    return Object.freeze({
      session_id:sessionId,
      task_id:taskId,
      lap_id:clean(ctx.lap_id)||null,
      task_state:clean(payload.taskState)||'COMPLETED',
      from_app:'hide-seek',
      event_id:clean(event.event_id)||null,
      result_payload:payload
    });
  }

  function planReview(decision,planner,options={}){
    if(decision?.authority!=='READY_LEARNING_ENGINE_REVIEW_POLICY')return {ok:false,reason:'READY_REVIEW_DECISION_REQUIRED'};
    if(decision?.scheduleOwner!=='READY_SET_PLANNER')return {ok:false,reason:'PLANNER_SCHEDULE_OWNER_REQUIRED'};
    if(!planner?.candidateWindowsByDate||!planner?.upsertDatedTodo)return {ok:false,reason:'PLANNER_RUNTIME_REQUIRED'};
    const dates=uniq(options.candidate_dates);
    if(!dates.length)return {ok:false,reason:'CANDIDATE_DATES_REQUIRED'};
    const windows=planner.candidateWindowsByDate(dates)||{};
    const date=dates.find(d=>Array.isArray(windows[d])&&windows[d].length>0);
    if(!date)return {ok:false,reason:'NO_CONFIRMED_REVIEW_WINDOW'};
    const todo=planner.upsertDatedTodo({
      date,
      label:clean(options.label)||'Language Memory 복습',
      source:'PLANNER_SPECIALIST_MEMORY_REVIEW',
      source_actor:'READY_SET_PLANNER',
      learning_unit_id:clean(options.learning_unit_id)||null,
      provenance:{
        kind:'HIDE_MEMORY_REVIEW',
        review_policy_authority:'READY_LEARNING_ENGINE',
        schedule_authority:'READY_SET_PLANNER',
        lexical_ids:[...decision.lexicalIds],
        policy_state:decision.policyState
      },
      state:'PLANNED'
    });
    const directive={
      authority:'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      lexicalIds:[...decision.lexicalIds],
      directiveId:'hide-review:'+todo.todo_id,
      taskId:todo.todo_id,
      scheduledDate:todo.date
    };
    return {ok:true,todo,directive};
  }

  return Object.freeze({version:VERSION,interpretHideMemorySummary,planReview,directiveForPlannerTodo,normalizeHideSpecialistResult,normalizeHideV2ReturnEvent});
});