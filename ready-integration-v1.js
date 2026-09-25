(() => {
  'use strict';
  const VERSION='2026.09.22-evidence-aware-review-v2';
  function processAssignment(assignmentId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    let state=window.ReadyAssignments.load(),fact=state.assignmentFacts[assignmentId];
    if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
    if(fact.confirmation_state!=='FACT_CONFIRMED')return {ok:false,reason:'FACT_NOT_CONFIRMED'};
    if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED')return {ok:false,reason:'NEXT_ACADEMY_UNVERIFIED'};
    let revisionImpact=null;
    if(fact.planner_revision_pending){
      revisionImpact=window.ReadySetPlanner.invalidateAssignmentOutputs(assignmentId,{
        reason:'FACT_REVISION',
        fact_revision:fact.fact_revision
      });
      if(revisionImpact?.in_progress_count>0){
        return {
          ok:false,
          reason:'FACT_REVISION_IN_PROGRESS_HOLD',
          assignment_id:assignmentId,
          fact_revision:fact.fact_revision,
          revision_impact:revisionImpact
        };
      }
    }
    if(fact.analysis_state!=='INTERPRETED'){
      const subject=fact.book_subject||fact.subject||null;
      const profile=window.ReadyLearningMasterV01.PROFILE?.[subject]||null;
      const learningSignal=window.ReadySetPlanner.crossRevisionLearningSignal?.({
        assignment_id:assignmentId,
        subject,
        current_revision:Number(fact.fact_revision)||1,
        activity_types:profile?.activity_types||[],
        allow_subject_generalization:true
      })||null;
      const learnerContext=input.learner_context||window.ReadySetLearnerContext?.current?.()||null;
      window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
        actor:'LEARNING_MASTER_RUNTIME',
        learning_signal:learningSignal,
        learner_context:learnerContext
      });
      state=window.ReadyAssignments.load();fact=state.assignmentFacts[assignmentId];
    }
    const allocation=window.ReadySetPlanner.allocateLearningUnits({assignment_id:assignmentId,domain_state:state,start_date:input.start_date,candidate_dates:input.candidate_dates,candidate_windows_by_date:input.candidate_windows_by_date});
    if(!allocation.ok)return {...allocation,revision_impact:revisionImpact};
    const committed=window.ReadySetPlanner.commitLearningAllocation(allocation.allocation_run_id);
    if(committed.ok&&fact.planner_revision_pending){
      window.ReadyAssignments.markRevisionPropagationComplete(assignmentId,{
        analysis_id:fact.current_analysis_id,
        allocation_run_id:allocation.allocation_run_id
      });
    }
    return {ok:committed.ok,assignment_id:assignmentId,analysis_id:fact.current_analysis_id,allocation_run_id:allocation.allocation_run_id,todos:committed.created||[],revision_impact:revisionImpact};
  }
  function specialistEvidenceSignal(rows=[]){
    const evidence=(rows||[]).flatMap(x=>Array.isArray(x.learning_evidence)?x.learning_evidence:[]);
    const memory=evidence.filter(x=>x?.evidence_type==='MEMORY_RETRIEVAL_EVIDENCE');
    const production=evidence.filter(x=>x?.evidence_type==='LEARNER_PRODUCTION_EVIDENCE');
    const advisoryMap=new Map();
    for(const row of memory.flatMap(x=>Array.isArray(x?.memory?.review_advisories)?x.memory.review_advisories:[])){
      const lexicalId=String(row?.lexicalId||row?.lexical_id||'').trim();
      const priority=Number(row?.nextReviewPriority??row?.priority);
      if(!lexicalId)continue;
      const existing=advisoryMap.get(lexicalId);
      if(!existing||(!Number.isFinite(existing.nextReviewPriority)&&Number.isFinite(priority))||(Number.isFinite(priority)&&priority>existing.nextReviewPriority)){
        advisoryMap.set(lexicalId,{lexicalId,nextReviewPriority:Number.isFinite(priority)?priority:null});
      }
    }
    const reviewAdvisories=[...advisoryMap.values()].sort((a,b)=>(Number(b.nextReviewPriority)||0)-(Number(a.nextReviewPriority)||0)).slice(0,24);
    const priorities=reviewAdvisories.map(x=>Number(x.nextReviewPriority)).filter(Number.isFinite);
    const weakStrength=memory.map(x=>Number(x?.memory?.average_strength)).filter(Number.isFinite);
    const childAuthored=production.filter(x=>x?.production?.child_authored===true).length;
    return {
      authority:'READY_EVIDENCE_INTERPRETATION_ONLY',
      memory_evidence_count:memory.length,
      production_evidence_count:production.length,
      max_memory_review_priority:priorities.length?Math.max(...priorities):null,
      review_advisories:reviewAdvisories,
      min_memory_strength:weakStrength.length?Math.min(...weakStrength):null,
      child_authored_production_count:childAuthored,
      can_influence:['RECOVERY_INTENSITY','CHECKPOINT_SELECTION','UNIT_SPAN'],
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION']
    };
  }

  function reviewEscalatedCarryOver(carryOverId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    const carry=window.ReadySetPlanner.carryOverCandidates?.().find(x=>x.carry_over_id===carryOverId);
    if(!carry)return {ok:false,reason:'CARRY_OVER_NOT_FOUND'};
    if(carry.escalation_level!=='PARENT_LEARNING_MASTER_REVIEW')return {ok:false,reason:'ESCALATION_REVIEW_NOT_REQUIRED'};
    const assignmentId=carry.assignment_id;
    if(!assignmentId)return {ok:false,reason:'ASSIGNMENT_ID_REQUIRED'};
    const state=window.ReadyAssignments.load(),fact=state.assignmentFacts?.[assignmentId];
    if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
    const history=window.ReadySetPlanner.learningHistory?.(assignmentId,{current_revision:Number(fact.fact_revision)||1})||[];
    const recent=history.slice(-12);
    const escalationSignal={
      authority:'ESCALATION_ADVISORY_ONLY',
      escalation_reason:carry.escalation_reason||null,
      carry_over_id:carry.carry_over_id,
      carry_over_state:carry.state,
      carry_over_depth:Number(carry.next_carry_over_depth)||Number(carry.carry_over_depth)||null,
      deadline_date:carry.deadline_date||null,
      observation_count:recent.length,
      states:recent.map(x=>x.ready_state||x.state).filter(Boolean),
      actual_minutes:recent.map(x=>x.actual_minutes).filter(Number.isFinite),
      specialist_evidence:specialistEvidenceSignal(recent),
      cannot_influence:['ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION','SCHEDULE_DATE','PLANNER_DATE']
    };
    const learnerContext=input.learner_context||window.ReadySetLearnerContext?.current?.()||null;
    const reviewed=window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
      actor:'LEARNING_MASTER_ESCALATION_REVIEW',
      force_review:true,
      review_reason:carry.escalation_reason||'CARRY_OVER_ESCALATION',
      escalation_review_signal:escalationSignal,
      learner_context:learnerContext
    });
    const resolved=window.ReadySetPlanner.resolveCarryOver?.(carryOverId,{resolution:'CANCEL',actor:'PARENT_LEARNING_MASTER_REVIEW'});
    const processed=processAssignment(assignmentId,{start_date:input.start_date});
    return {
      ok:!!processed?.ok,
      assignment_id:assignmentId,
      carry_over_id:carryOverId,
      review_analysis_id:reviewed?.analysis?.analysis_id||null,
      processed,
      resolved
    };
  }

  function learnerAdaptiveProfile(rows=[],options={}){
    const asOf=Date.parse(options.as_of||'');
    const anchor=Number.isFinite(asOf)?asOf:Date.now();
    const cutoff=anchor-1000*60*60*24*90;
    const seen=new Set();
    const cleanKey=value=>String(value??'').trim();
    const memberId=cleanKey(options.member_id||'');
    const subject=cleanKey(options.subject||'').toLowerCase();
    const recent=(rows||[]).filter(row=>{
      if(memberId&&cleanKey(row?.member_id||row?.learner_id||'')&&cleanKey(row?.member_id||row?.learner_id||'')!==memberId)return false;
      if(subject&&cleanKey(row?.subject||row?.book_subject||'')&&cleanKey(row?.subject||row?.book_subject||'').toLowerCase()!==subject)return false;
      const stamp=Date.parse(row?.at||row?.created_at||row?.updated_at||'');
      return !Number.isFinite(stamp)||stamp>=cutoff;
    }).slice(-12);
    const evidence=recent.flatMap((row,rowIndex)=>(Array.isArray(row.learning_evidence)?row.learning_evidence:[]).map((e,eIndex)=>({e,row,rowIndex,eIndex})))
      .filter(({e,row,rowIndex,eIndex})=>{
        const key=cleanKey(e?.evidence_id||e?.event_id||e?.session_id||row?.session_id||row?.execution_observation_id||'')||
          JSON.stringify([row?.at||row?.created_at||rowIndex,e?.evidence_type,e?.memory?.average_strength,eIndex]);
        if(seen.has(key))return false;
        seen.add(key); return true;
      });
    const memory=evidence.map(x=>x.e).filter(x=>x?.evidence_type==='MEMORY_RETRIEVAL_EVIDENCE');
    const strengths=memory.map(x=>Number(x?.memory?.average_strength)).filter(Number.isFinite);
    const priorities=memory.flatMap(x=>Array.isArray(x?.memory?.review_advisories)?x.memory.review_advisories:[])
      .map(x=>Number(x?.nextReviewPriority??x?.priority)).filter(Number.isFinite);
    const frictionStates=recent.map(x=>x.ready_state||x.state).filter(x=>['PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT'].includes(x));
    const enough=strengths.length>=3;
    const baseline=enough?strengths.slice(0,-1).reduce((a,b)=>a+b,0)/Math.max(1,strengths.length-1):null;
    const latest=strengths.length?strengths[strengths.length-1]:null;
    const delta=Number.isFinite(baseline)&&Number.isFinite(latest)?latest-baseline:null;
    const trend=!Number.isFinite(delta)?'INSUFFICIENT_EVIDENCE':delta<=-10?'DECLINING':delta>=10?'IMPROVING':'STABLE';
    return {
      authority:'LEARNER_ADAPTIVE_PROFILE_ADVISORY_ONLY',
      observation_count:recent.length,
      unique_evidence_count:evidence.length,
      freshness_window_days:90,
      member_scope:memberId||null,
      subject_scope:subject||null,
      memory_sample_count:strengths.length,
      baseline_memory_strength:Number.isFinite(baseline)?Math.round(baseline*10)/10:null,
      latest_memory_strength:latest,
      memory_delta:Number.isFinite(delta)?Math.round(delta*10)/10:null,
      trend,
      friction_count:frictionStates.length,
      max_memory_review_priority:priorities.length?Math.max(...priorities):null,
      can_influence:['RECOVERY_INTENSITY','CHECKPOINT_SELECTION','UNIT_SPAN','ACTIVITY_SEQUENCE'],
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION']
    };
  }

  function reviewLearningEvidence(assignmentId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    const state=window.ReadyAssignments.load();
    const fact=state.assignmentFacts?.[assignmentId];
    if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
    if(fact.confirmation_state!=='FACT_CONFIRMED')return {ok:false,reason:'FACT_NOT_CONFIRMED'};
    const history=window.ReadySetPlanner.learningHistory?.(assignmentId,{current_revision:Number(fact.fact_revision)||1})||[];
    const recent=history.slice(-12);
    const specialist=specialistEvidenceSignal(recent);
    const activeMember=window.ReadyFamilySession?.current?.()?.member_id||input.member_id||null;
    const factSubject=fact.book_subject||fact.subject||null;
    const evidenceKeys=[...new Set(recent.flatMap((row,rowIndex)=>(Array.isArray(row.learning_evidence)?row.learning_evidence:[]).map((e,eIndex)=>
      String(e?.evidence_id||e?.event_id||e?.session_id||row?.session_id||row?.execution_observation_id||[row?.at||row?.created_at||rowIndex,e?.evidence_type,e?.memory?.average_strength,eIndex].join(':')).trim()
    )).filter(Boolean))].sort();
    const reviewKey=JSON.stringify({
      assignment_id:assignmentId,
      fact_revision:Number(fact.fact_revision)||1,
      member_id:activeMember||null,
      subject:factSubject||null,
      evidence_keys:evidenceKeys
    });
    if(fact.learning_evidence_review?.review_key===reviewKey){
      return {ok:false,reason:'LEARNING_EVIDENCE_ALREADY_REVIEWED',review_key:reviewKey};
    }
    const adaptiveProfile=learnerAdaptiveProfile(recent,{
      as_of:input.as_of,
      member_id:activeMember,
      subject:factSubject
    });
    const priority=Number(specialist.max_memory_review_priority);
    const strength=Number(specialist.min_memory_strength);
    const personalDecline=adaptiveProfile.trend==='DECLINING';
    const memoryConcern=(Number.isFinite(priority)&&priority>=70)||(Number.isFinite(strength)&&strength<60)||personalDecline;
    if(!memoryConcern)return {ok:false,reason:'EVIDENCE_REVIEW_NOT_REQUIRED',specialist_evidence:specialist};

    const invalidated=window.ReadySetPlanner.invalidateAssignmentOutputs?.(assignmentId,{
      reason:'LEARNING_EVIDENCE_REVIEW',
      fact_revision:Number(fact.fact_revision)||1
    })||null;
    if(invalidated?.in_progress_count>0){
      return {ok:false,reason:'LEARNING_EVIDENCE_REVIEW_IN_PROGRESS_HOLD',specialist_evidence:specialist,invalidation:invalidated};
    }

    const evidenceSignal={
      authority:'LEARNING_EVIDENCE_ADVISORY_ONLY',
      review_reason:'SPECIALIST_MEMORY_CONCERN',
      observation_count:recent.length,
      states:recent.map(x=>x.ready_state||x.state).filter(Boolean),
      actual_minutes:recent.map(x=>x.actual_minutes).filter(Number.isFinite),
      specialist_evidence:specialist,
      learner_adaptive_profile:adaptiveProfile,
      scheduling_constraints:{
        recurring_days:Array.isArray(fact.recurring_days)?[...fact.recurring_days]:[],
        weekday_prints:fact.weekday_prints?JSON.parse(JSON.stringify(fact.weekday_prints)):{}
      },
      cannot_influence:['ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION','SCHEDULE_DATE','PLANNER_DATE']
    };
    const learnerContext=input.learner_context||window.ReadySetLearnerContext?.current?.()||null;
    const reviewed=window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
      actor:'LEARNING_MASTER_EVIDENCE_REVIEW',
      force_review:true,
      review_reason:'SPECIALIST_MEMORY_CONCERN',
      evidence_review_signal:evidenceSignal,
      learner_context:learnerContext
    });
    const processed=processAssignment(assignmentId,{
      start_date:input.start_date,
      candidate_dates:input.candidate_dates,
      candidate_windows_by_date:input.candidate_windows_by_date,
      learner_context:learnerContext
    });
    if(processed?.ok){
      window.ReadyAssignments.markEvidenceReview?.(assignmentId,{
        review_key:reviewKey,
        analysis_id:reviewed?.analysis?.analysis_id||null,
        evidence_count:evidenceKeys.length,
        member_id:activeMember,
        subject:factSubject
      });
    }
    return {
      ok:!!processed?.ok,
      assignment_id:assignmentId,
      review_analysis_id:reviewed?.analysis?.analysis_id||null,
      adaptive_review_policy:reviewed?.analysis?.adaptive_review_policy||null,
      specialist_evidence:specialist,
      learner_adaptive_profile:adaptiveProfile,
      scheduling_constraints:evidenceSignal.scheduling_constraints,
      processed,
      invalidation:invalidated
    };
  }

  function applyLearningEngineDecision(decision={},input={}){
    const adapter=window.ReadyLearningEngineAdapterV2;
    if(!adapter?.translate)return {ok:false,reason:'LEARNING_ENGINE_ADAPTER_V2_MISSING'};
    const translated=adapter.translate(decision,{
      assignment_id:input.assignment_id,
      analysis_id:input.analysis_id,
      learning_decision_ref:input.learning_decision_ref,
      scheduling_constraints:input.scheduling_constraints||null
    });
    if(!translated.ok)return translated;
    if(translated.execution_status==='HOLD'){
      return {
        ok:true,
        authority:'READY_EXECUTION_ADAPTER_ONLY',
        execution_status:'HOLD',
        translated,
        planner_called:false
      };
    }
    return {
      ok:true,
      authority:'READY_EXECUTION_ADAPTER_ONLY',
      execution_status:'READY_FOR_PLANNER_ALLOCATION',
      translated,
      planner_called:false,
      note:'Adapter V2 preserves Core intent. Planner allocation remains a separate Ready/Planner operation.'
    };
  }

  function processConfirmed(input={}){
    const state=window.ReadyAssignments?.load?.();if(!state)return [];
    return Object.values(state.assignmentFacts).filter(f=>f.confirmation_state==='FACT_CONFIRMED').map(f=>processAssignment(f.assignment_id,input));
  }
  window.ReadyIntegrationV1={version:VERSION,legacy_learning_logic:'LEGACY_COMPATIBILITY',processAssignment,processConfirmed,reviewEscalatedCarryOver,reviewLearningEvidence,specialistEvidenceSignal,learnerAdaptiveProfile,applyLearningEngineDecision};
  document.documentElement.dataset.readyIntegration=VERSION;
})();
