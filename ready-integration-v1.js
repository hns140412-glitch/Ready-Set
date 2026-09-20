(() => {
  'use strict';
  const VERSION='2026.09.20-fact-revision-v1';
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
      window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{actor:'LEARNING_MASTER_RUNTIME'});
      state=window.ReadyAssignments.load();fact=state.assignmentFacts[assignmentId];
    }
    const allocation=window.ReadySetPlanner.allocateLearningUnits({assignment_id:assignmentId,domain_state:state,start_date:input.start_date,candidate_dates:input.candidate_dates});
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
  function processConfirmed(input={}){
    const state=window.ReadyAssignments?.load?.();if(!state)return [];
    return Object.values(state.assignmentFacts).filter(f=>f.confirmation_state==='FACT_CONFIRMED').map(f=>processAssignment(f.assignment_id,input));
  }
  window.ReadyIntegrationV1={version:VERSION,processAssignment,processConfirmed};
  document.documentElement.dataset.readyIntegration=VERSION;
})();
