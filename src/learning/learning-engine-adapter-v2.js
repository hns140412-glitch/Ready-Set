(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ReadyLearningEngineAdapterV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_LEARNING_ENGINE_ADAPTER_V2_0_1';
  const clean=v=>String(v??'').trim();

  const INTENT_TO_EXECUTION=Object.freeze({
    DISAMBIGUATE_CONFUSION:{activity_hint:'COMPARE',checkpoint_hint:'CONFUSION_CHECK'},
    SHORT_DELAY_RETRIEVAL:{activity_hint:'RETRIEVE',checkpoint_hint:'SHORT_RETRIEVAL'},
    REDUCE_ASSISTANCE_GRADUALLY:{activity_hint:'PRACTICE',assistance_hint:'FADE'},
    RETRIEVAL_CHECKPOINT:{activity_hint:'RETRIEVE',checkpoint_hint:'RETRIEVAL_CHECKPOINT'},
    TARGETED_RECOVERY_PRACTICE:{activity_hint:'PRACTICE',recovery_hint:'TARGETED'},
    MAINTAIN_CHALLENGE:{activity_hint:'APPLY',difficulty_hint:'MAINTAIN'},
    CONTINUE_OBSERVATION:{activity_hint:'OBSERVE'}
  });

  function validateDecision(decision={}){
    const issues=[];
    if(decision?.ok!==true)issues.push('DECISION_NOT_OK');
    if(clean(decision.authority)!=='LEARNING_DECISION_INTENT_ONLY')issues.push('DECISION_AUTHORITY_INVALID');
    if(clean(decision?.consumer_contract?.planner)!=='OWNS_DATED_ALLOCATION')issues.push('PLANNER_BOUNDARY_INVALID');
    if(!decision.scope?.member_id||!decision.scope?.subject||!decision.scope?.concept_skill_target)issues.push('DECISION_SCOPE_REQUIRED');

    const forbidden=['schedule_date','planner_date','due_at','due_date','deadline'];
    const walk=v=>{
      if(!v||typeof v!=='object')return false;
      for(const [k,n] of Object.entries(v)){
        if(forbidden.includes(k))return true;
        if(walk(n))return true;
      }
      return false;
    };
    if(walk(decision))issues.push('SCHEDULE_AUTHORITY_LEAK');
    return {ok:issues.length===0,issues};
  }

  function translate(decision={},context={}){
    const checked=validateDecision(decision);
    if(!checked.ok)return {ok:false,reason:'LEARNING_DECISION_INVALID',issues:checked.issues};

    if(decision.execution_status==='HOLD_FOR_MORE_RELIABLE_INTERPRETATION'){
      return {
        ok:true,
        adapter_version:VERSION,
        authority:'READY_EXECUTION_ADAPTER_ONLY',
        execution_status:'HOLD',
        hold_reason:(decision.blockers||[]).map(x=>x.code).filter(Boolean),
        source_decision_contract:decision.decision_contract||null,
        scope:decision.scope,
        execution_hints:[],
        planner_request:null,
        cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT','LEARNER_MODEL']
      };
    }

    const hints=[];
    for(const action of decision.pedagogical_actions||[]){
      const map=INTENT_TO_EXECUTION[clean(action.intent)];
      if(!map)continue;
      hints.push({
        intent:clean(action.intent),
        priority:clean(action.priority)||'LOW',
        bases:Array.isArray(action.basis)?action.basis:(Array.isArray(action.bases)?action.bases:[]),
        targets:Array.isArray(action.targets)?action.targets:[],
        ...map
      });
    }

    return {
      ok:true,
      adapter_version:VERSION,
      authority:'READY_EXECUTION_ADAPTER_ONLY',
      execution_status:'READY_FOR_PLANNER_ALLOCATION',
      source_decision_contract:decision.decision_contract||null,
      scope:decision.scope,
      assignment_id:clean(context.assignment_id)||null,
      analysis_id:clean(context.analysis_id)||null,
      execution_hints:hints,
      specialist_routing_intent:hints.some(x=>x.intent==='TARGETED_RECOVERY_PRACTICE'||x.intent==='RETRIEVAL_CHECKPOINT')
        ? 'MEMORY_SPECIALIST_PREFERRED'
        : null,
      planner_request:{
        authority:'READY_TO_PLANNER_ALLOCATION_REQUEST',
        assignment_id:clean(context.assignment_id)||null,
        learning_decision_ref:clean(context.learning_decision_ref)||null,
        execution_hints:hints,
        scheduling_constraints:context.scheduling_constraints||null,
        planner_owns_dates:true
      },
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT','LEARNER_MODEL']
    };
  }

  function selfValidate(result={}){
    const issues=[];
    if(result?.ok!==true)issues.push('RESULT_NOT_OK');
    if(result.authority!=='READY_EXECUTION_ADAPTER_ONLY')issues.push('ADAPTER_AUTHORITY_INVALID');
    if(result.planner_request&&result.planner_request.planner_owns_dates!==true)issues.push('PLANNER_DATE_OWNERSHIP_INVALID');
    if((result.cannot_influence||[]).includes('LEARNER_MODEL')!==true)issues.push('LEARNER_MODEL_BOUNDARY_MISSING');
    const forbidden=['schedule_date','planner_date','due_at','due_date','deadline'];
    const walk=v=>{
      if(!v||typeof v!=='object')return false;
      for(const [k,n] of Object.entries(v)){
        if(forbidden.includes(k))return true;
        if(walk(n))return true;
      }
      return false;
    };
    if(walk(result))issues.push('SCHEDULE_AUTHORITY_LEAK');
    return {ok:issues.length===0,issues};
  }

  return Object.freeze({VERSION,INTENT_TO_EXECUTION,validateDecision,translate,selfValidate});
});
