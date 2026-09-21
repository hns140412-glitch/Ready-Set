(() => {
  'use strict';
  const VERSION='2026.09.20-cross-revision-signal-v1';
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
      window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
        actor:'LEARNING_MASTER_RUNTIME',
        learning_signal:learningSignal
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
      cannot_influence:['ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION']
    };
    const reviewed=window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
      actor:'LEARNING_MASTER_ESCALATION_REVIEW',
      force_review:true,
      review_reason:carry.escalation_reason||'CARRY_OVER_ESCALATION',
      escalation_review_signal:escalationSignal
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

  function processConfirmed(input={}){
    const state=window.ReadyAssignments?.load?.();if(!state)return [];
    return Object.values(state.assignmentFacts).filter(f=>f.confirmation_state==='FACT_CONFIRMED').map(f=>processAssignment(f.assignment_id,input));
  }
  window.ReadyIntegrationV1={version:VERSION,processAssignment,processConfirmed,reviewEscalatedCarryOver};
  document.documentElement.dataset.readyIntegration=VERSION;
})();
