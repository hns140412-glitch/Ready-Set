(() => {
  'use strict';
  const VERSION='2026.09.22-evidence-aware-review-v2';
  function processAssignment(assignmentId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    let learningDecisionProjection=null;
    if(input.learning_decision){
      const adapter=window.ReadyLearningEngineAdapterV2;
      if(!adapter?.translate)return {ok:false,reason:'LEARNING_ENGINE_ADAPTER_V2_MISSING'};
      const translated=adapter.translate(input.learning_decision,{
        assignment_id:assignmentId,
        analysis_id:input.analysis_id||null,
        learning_decision_ref:input.learning_decision_ref||null,
        scheduling_constraints:input.scheduling_constraints||null
      });
      if(!translated.ok)return translated;
      if(translated.execution_status==='HOLD'){
        return {
          ok:false,
          reason:'LEARNING_DECISION_HOLD',
          assignment_id:assignmentId,
          authority:'READY_EXECUTION_ADAPTER_ONLY',
          translated
        };
      }
      learningDecisionProjection={
        authority:'READY_EXECUTION_ADAPTER_ONLY',
        source_decision_contract:translated.source_decision_contract||null,
        learning_decision_ref:input.learning_decision_ref||null,
        scope:translated.scope,
        execution_hints:translated.execution_hints||[],
        adaptive_plan:translated.adaptive_plan?JSON.parse(JSON.stringify(translated.adaptive_plan)):null,
        specialist_routing_intent:translated.specialist_routing_intent||null,
        cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT','LEARNER_MODEL']
      };
    }
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
    if(input.force_core_reanalysis===true&&learningDecisionProjection?.adaptive_plan){
      const learnerContext=input.learner_context||window.ReadySetLearnerContext?.current?.()||null;
      window.ReadyLearningMasterV01.interpretConfirmed(assignmentId,{
        actor:'LEARNING_ENGINE_CORE_ADAPTIVE_PLAN',
        force_review:true,
        review_reason:'CORE_ADAPTIVE_PLAN',
        core_adaptive_plan:learningDecisionProjection.adaptive_plan,
        learner_context:learnerContext
      });
      state=window.ReadyAssignments.load();
      fact=state.assignmentFacts[assignmentId];
    }else if(fact.analysis_state!=='INTERPRETED'){
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
    const allocation=window.ReadySetPlanner.allocateLearningUnits({
      assignment_id:assignmentId,
      domain_state:state,
      start_date:input.start_date,
      candidate_dates:input.candidate_dates,
      candidate_windows_by_date:input.candidate_windows_by_date,
      learning_decision_projection:learningDecisionProjection
    });
    if(!allocation.ok)return {...allocation,revision_impact:revisionImpact};
    const committed=window.ReadySetPlanner.commitLearningAllocation(allocation.allocation_run_id);
    if(committed.ok&&fact.planner_revision_pending){
      window.ReadyAssignments.markRevisionPropagationComplete(assignmentId,{
        analysis_id:fact.current_analysis_id,
        allocation_run_id:allocation.allocation_run_id
      });
    }
    return {
      ok:committed.ok,
      assignment_id:assignmentId,
      analysis_id:fact.current_analysis_id,
      allocation_run_id:allocation.allocation_run_id,
      todos:committed.created||[],
      revision_impact:revisionImpact,
      learning_decision_projection:learningDecisionProjection
    };
  }
  function legacyCompat(){
    return window.ReadyLegacyLearningCompat||null;
  }

  function specialistEvidenceSignal(rows=[]){
    const compat=legacyCompat();
    return compat?.specialistEvidenceSignal
      ? compat.specialistEvidenceSignal(rows)
      : {
          authority:'READY_LEGACY_COMPAT_UNAVAILABLE',
          memory_evidence_count:0,
          production_evidence_count:0,
          max_memory_review_priority:null,
          review_advisories:[],
          min_memory_strength:null,
          child_authored_production_count:0,
          runtime_default_authority:false
        };
  }

  function reviewEscalatedCarryOver(carryOverId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    if(input.learning_decision){
      const carry=window.ReadySetPlanner.carryOverCandidates?.().find(x=>x.carry_over_id===carryOverId);
      if(!carry)return {ok:false,reason:'CARRY_OVER_NOT_FOUND'};
      if(carry.escalation_level!=='PARENT_LEARNING_MASTER_REVIEW')return {ok:false,reason:'ESCALATION_REVIEW_NOT_REQUIRED'};
      const assignmentId=carry.assignment_id;
      const processed=applyLearningEngineDecision(input.learning_decision,{
        assignment_id:assignmentId,
        learning_decision_ref:input.learning_decision_ref||null,
        start_date:input.start_date,
        scheduling_constraints:input.scheduling_constraints||null,
        force_core_reanalysis:true
      });
      if(processed?.ok){
        window.ReadySetPlanner.resolveCarryOver?.(carryOverId,{resolution:'CANCEL',actor:'CORE_DECISION_ADAPTER_REVIEW'});
      }
      return {
        ...processed,
        carry_over_id:carryOverId,
        legacy_learning_logic_used:false
      };
    }
    if(input.allow_legacy_learning_logic!==true){
      return {
        ok:false,
        reason:'LEARNING_DECISION_REQUIRED',
        legacy_learning_logic_used:false,
        compatibility_path_available:true
      };
    }
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
    const compat=legacyCompat();
    return compat?.learnerAdaptiveProfile
      ? compat.learnerAdaptiveProfile(rows,options)
      : {
          authority:'READY_LEGACY_COMPAT_UNAVAILABLE',
          observation_count:0,
          unique_evidence_count:0,
          memory_sample_count:0,
          trend:'INSUFFICIENT_EVIDENCE',
          runtime_default_authority:false
        };
  }

  function reviewLearningEvidence(assignmentId,input={}){
    if(!window.ReadyAssignments||!window.ReadyLearningMasterV01||!window.ReadySetPlanner)return {ok:false,reason:'RUNTIME_MODULE_MISSING'};
    if(input.learning_decision){
      const state=window.ReadyAssignments.load();
      const fact=state.assignmentFacts?.[assignmentId];
      if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
      const coreReviewKey='CORE_DECISION:'+String(input.learning_decision_ref||JSON.stringify({
        decision_contract:input.learning_decision?.decision_contract||null,
        scope:input.learning_decision?.scope||null,
        adaptive_plan:input.learning_decision?.adaptive_plan||null
      }));
      if(fact.learning_evidence_review?.review_key===coreReviewKey){
        return {
          ok:false,
          reason:'LEARNING_EVIDENCE_ALREADY_REVIEWED',
          review_key:coreReviewKey,
          legacy_learning_logic_used:false
        };
      }
      const invalidated=window.ReadySetPlanner.invalidateAssignmentOutputs?.(assignmentId,{
        reason:'LEARNING_ENGINE_CORE_DECISION_REVIEW',
        fact_revision:Number(fact.fact_revision)||1
      })||null;
      if(invalidated?.in_progress_count>0){
        return {
          ok:false,
          reason:'LEARNING_DECISION_REVIEW_IN_PROGRESS_HOLD',
          assignment_id:assignmentId,
          authority:'READY_EXECUTION_ADAPTER_ONLY',
          invalidation:invalidated,
          legacy_learning_logic_used:false
        };
      }
      const processed=applyLearningEngineDecision(input.learning_decision,{
        assignment_id:assignmentId,
        learning_decision_ref:input.learning_decision_ref||null,
        start_date:input.start_date,
        candidate_dates:input.candidate_dates,
        candidate_windows_by_date:input.candidate_windows_by_date,
        scheduling_constraints:input.scheduling_constraints||null,
        force_core_reanalysis:true
      });
      if(processed?.ok){
        window.ReadyAssignments.markEvidenceReview?.(assignmentId,{
          review_key:coreReviewKey,
          analysis_id:processed.analysis_id||null,
          evidence_count:0,
          member_id:input.learning_decision?.scope?.member_id||null,
          subject:input.learning_decision?.scope?.subject||null,
          source:'LEARNING_ENGINE_CORE_DECISION'
        });
      }
      return {
        ...processed,
        assignment_id:assignmentId,
        review_key:coreReviewKey,
        invalidation:invalidated,
        legacy_learning_logic_used:false
      };
    }
    if(input.allow_legacy_learning_logic!==true){
      return {
        ok:false,
        reason:'LEARNING_DECISION_REQUIRED',
        assignment_id:assignmentId,
        legacy_learning_logic_used:false,
        compatibility_path_available:true
      };
    }
    const state=window.ReadyAssignments.load();
    const fact=state.assignmentFacts?.[assignmentId];
    if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
    if(fact.confirmation_state!=='FACT_CONFIRMED')return {ok:false,reason:'FACT_NOT_CONFIRMED'};
    const history=window.ReadySetPlanner.learningHistory?.(assignmentId,{current_revision:Number(fact.fact_revision)||1})||[];
    const recent=history.slice(-12);
    const activeMember=window.ReadyFamilySession?.current?.()?.member_id||input.member_id||null;
    const factSubject=fact.book_subject||fact.subject||null;
    const compatAssessment=legacyCompat()?.assessMemoryConcern?.(recent,{
      as_of:input.as_of,
      member_id:activeMember,
      subject:factSubject
    })||null;
    const specialist=compatAssessment?.specialist_evidence||specialistEvidenceSignal(recent);
    const adaptiveProfile=compatAssessment?.learner_adaptive_profile||learnerAdaptiveProfile(recent,{
      as_of:input.as_of,
      member_id:activeMember,
      subject:factSubject
    });
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
    const memoryConcern=compatAssessment?.memory_concern===true;
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
      legacy_learning_logic_used:true,
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
    const assignmentId=String(input.assignment_id||'').trim();
    if(!assignmentId)return {ok:false,reason:'ASSIGNMENT_ID_REQUIRED'};
    const processed=processAssignment(assignmentId,{
      ...input,
      learning_decision:decision
    });
    return {
      ...processed,
      authority:'READY_EXECUTION_ADAPTER_ONLY',
      planner_called:processed?.reason!=='LEARNING_DECISION_HOLD'&&processed?.reason!=='LEARNING_ENGINE_ADAPTER_V2_MISSING'
    };
  }

  function processConfirmed(input={}){
    const state=window.ReadyAssignments?.load?.();if(!state)return [];
    return Object.values(state.assignmentFacts).filter(f=>f.confirmation_state==='FACT_CONFIRMED').map(f=>processAssignment(f.assignment_id,input));
  }
  window.ReadyIntegrationV1={version:VERSION,legacy_learning_logic:'LEGACY_COMPATIBILITY',processAssignment,processConfirmed,reviewEscalatedCarryOver,reviewLearningEvidence,specialistEvidenceSignal,learnerAdaptiveProfile,applyLearningEngineDecision};
  document.documentElement.dataset.readyIntegration=VERSION;
})();
