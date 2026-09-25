(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyEvidenceOntology=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_EVIDENCE_ONTOLOGY_V03';
  const clean=(v,max=160)=>String(v??'').trim().slice(0,max);

  function specialistEvidence({task={},from_app=null,task_state=null,payload=null,event_id=null,at=null}={}){
    const observedAt=at||new Date().toISOString();
    const activeMember=globalThis.ReadyFamilySession?.current?.()?.member_id||null;
    const assistedRaw=payload?.assisted??payload?.memorySummary?.assisted??payload?.trailSummary?.memorySummary?.assisted;
    const assistance=assistedRaw===true?'ASSISTED':assistedRaw===false?'UNASSISTED':'UNKNOWN';
    const base={
      evidence_contract:VERSION,
      event_id:clean(event_id)||null,
      at:observedAt,
      observed_at:observedAt,
      learning_unit_id:clean(task.learning_unit_id)||null,
      assignment_id:clean(task.assignment_id)||null,
      analysis_id:clean(task.analysis_id)||null,
      member_id:clean(task.member_id||payload?.member_id||activeMember)||null,
      subject:clean(task.subject,80)||null,
      concept_skill_target:clean(task.concept_skill_target,120)||null,
      learning_target_id:clean(task.learning_target_id||task.item_id||payload?.learning_target_id||payload?.item_id||payload?.word_id,160)||null,
      domain:clean(task.matched_domain,80)||null,
      task_state:clean(task_state,40)||null,
      source_app:clean(from_app,40)||null,
      instrument_version:clean(payload?.instrumentVersion||payload?.instrument_version||payload?.sourceVersion,80)||'UNSPECIFIED',
      interaction_mode:clean(payload?.interactionMode||payload?.interaction_mode||payload?.memorySummary?.interactionMode,80)||'UNKNOWN',
      assistance,
      assisted:assistedRaw===true?true:assistedRaw===false?false:null,
      attempt_count:Number.isFinite(payload?.attemptCount)?Math.max(0,Math.floor(payload.attemptCount)):null,
      response_latency_ms:Number.isFinite(payload?.responseLatencyMs)?Math.max(0,payload.responseLatencyMs):null,
      authority:'READY_EVIDENCE_RECORD',
      interpretation_owner:'TAKY_LEARNING_ENGINE_CORE'
    };

    if(from_app==='hide-seek'){
      const memory=payload?.memorySummary||payload?.trailSummary?.memorySummary||null;
      return Object.freeze({
        ...base,
        evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
        specialist_authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
        memory:{
          average_strength:Number.isFinite(memory?.averageMemoryStrength)?memory.averageMemoryStrength:null,
          review_advisories:Array.isArray(memory?.reviewAdvisories)?memory.reviewAdvisories.slice(0,24):[],
          next_review_semantics:memory?.prioritySemantics||'ADVISORY_SIGNAL_NOT_DATE',
          review_policy_owner:'TAKY_LEARNING_ENGINE_CORE',
          reported_review_policy_owner:clean(memory?.reviewPolicyOwner,80)||null,
          schedule_owner:memory?.scheduleOwner||'READY_SET_PLANNER'
        },
        cannot_claim:['CONCEPT_MASTERY','FINAL_SUBJECT_MASTERY','SCHEDULE_DATE']
      });
    }

    if(from_app==='snap-pop'){
      return Object.freeze({
        ...base,
        evidence_type:'LEARNER_PRODUCTION_EVIDENCE',
        specialist_authority:'CHILD_AUTHORSHIP_REQUIRED',
        production:{
          child_authored:payload?.child_authored===true,
          landmark:clean(payload?.landmark,80)||null,
          step:Number.isFinite(payload?.step)?payload.step:null,
          vocabulary_material:payload?.vocabulary_material||null
        },
        cannot_claim:['OBJECTIVE_RECALL_MASTERY','AUTOMATIC_CONCEPT_MASTERY']
      });
    }

    return Object.freeze({
      ...base,
      evidence_type:'SPECIALIST_OUTCOME_UNKNOWN',
      raw_payload_present:!!payload,
      cannot_claim:['SUBJECT_MASTERY']
    });
  }

  function structuredPracticeEvidence({
    task={},
    response=null,
    answer_key=null,
    answer_key_ref=null,
    event_id=null,
    at=null,
    instrument_version='READY_ANSWER_KEY_V1',
    interaction_mode='STRUCTURED_PRACTICE'
  }={}){
    const verifier=globalThis.ReadyAnswerKeyVerifier;
    if(!verifier?.exactMatch)return {ok:false,reason:'READY_ANSWER_KEY_VERIFIER_UNAVAILABLE'};
    const observedAt=at||new Date().toISOString();
    const activeMember=globalThis.ReadyFamilySession?.current?.()?.member_id||null;
    const memberId=clean(task.member_id||activeMember);
    const subject=clean(task.subject,80);
    const target=clean(task.concept_skill_target,120);
    const match=verifier.exactMatch({
      event_id,
      member_id:memberId,
      subject,
      concept_skill_target:target,
      response,
      answer_key,
      answer_key_ref,
      verifier_version:instrument_version
    });
    if(!match.ok)return match;
    return {
      ok:true,
      evidence:Object.freeze({
        evidence_contract:VERSION,
        event_id:clean(event_id)||null,
        at:observedAt,
        observed_at:observedAt,
        learning_unit_id:clean(task.learning_unit_id)||null,
        assignment_id:clean(task.assignment_id)||null,
        analysis_id:clean(task.analysis_id)||null,
        member_id:memberId||null,
        subject:subject||null,
        concept_skill_target:target||null,
        learning_target_id:clean(task.learning_target_id||task.item_id,160)||null,
        evidence_type:'STRUCTURED_PRACTICE_EVIDENCE',
        source_app:'ready-set',
        instrument_version,
        interaction_mode,
        verification_candidate:match.verification_candidate,
        authority:'READY_EVIDENCE_RECORD',
        interpretation_owner:'TAKY_LEARNING_ENGINE_CORE',
        cannot_claim:['GLOBAL_MASTERY','SCHEDULE_DATE','TEACHER_JUDGMENT']
      })
    };
  }

  function append(rows=[],evidence){
    const list=Array.isArray(rows)?rows:[];
    if(!evidence)return list.slice(-120);
    if(evidence.event_id&&list.some(x=>x?.event_id===evidence.event_id))return list.slice(-120);
    return [...list,evidence].slice(-120);
  }

  return Object.freeze({version:VERSION,specialistEvidence,structuredPracticeEvidence,append});
});
