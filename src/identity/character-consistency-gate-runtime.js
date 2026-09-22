(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01';
  const STATES=Object.freeze(['NOT_RUN','PENDING','PASS','FAIL','BLOCKED']);

  function structural(job={}){
    const directions=Array.isArray(job.directions)?job.directions:[];
    const assets=job.candidate_assets||{};
    const slots=directions.map(x=>String(x?.slot||'')).join('|');
    const sources=directions.map(x=>String(x?.source||'')).join('|');
    const directionIds=directions.map(x=>String(x?.direction_id||'')).filter(Boolean);
    const checks=Object.freeze({
      source_hash_present:!!job.source_hash,
      identity_contract_valid:job.identity_contract?.contract_version==='CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01',
      source_photo_authority:job.identity_contract?.identity_authority==='SOURCE_PHOTO',
      slots_abc:slots==='A|B|C',
      provenance_valid:sources==='USER_SELECTION_1|USER_SELECTION_2|SYSTEM_AUTO_CONTRAST',
      directions_distinct:directionIds.length===3&&new Set(directionIds).size===3,
      assets_complete:!!(assets.A?.asset_key&&assets.B?.asset_key&&assets.C?.asset_key)
    });
    const pass=Object.values(checks).every(Boolean);
    return Object.freeze({
      state:pass?'PASS':'FAIL',
      checks,
      reason:pass?null:'STRUCTURAL_CONSISTENCY_FAILED'
    });
  }

  function create(job={}){
    const structure=structural(job);
    return {
      contract_version:VERSION,
      structural:structure,
      visual:Object.freeze({
        state:'NOT_RUN',
        evaluator:null,
        source_identity_match:null,
        candidate_identity_consistent:null,
        direction_distinctness:null,
        face_unobstructed:null,
        sensitive_trait_change_detected:null,
        notes:null
      }),
      human_confirmation:Object.freeze({
        state:'NOT_RUN',
        actor_scope:null,
        accepted_same_identity:null,
        selected_slot:null,
        notes:null
      }),
      final_state:structure.state==='FAIL'?'FAIL':'PENDING',
      lock_allowed:false
    };
  }

  function applyVisual(gate,evidence={}){
    if(!gate||gate.contract_version!==VERSION)throw new Error('CHARACTER_CONSISTENCY_GATE_REQUIRED');
    const selectedPass=evidence.selected_candidate_state==='PASS'||
      (evidence.source_identity_match===true&&evidence.face_unobstructed===true&&evidence.sensitive_trait_change_detected===false);
    const visual=Object.freeze({
      state:selectedPass?'PASS':'FAIL',
      evaluator:String(evidence.evaluator||'UNSPECIFIED'),
      candidate_set_state:String(evidence.candidate_set_state||'NOT_RUN'),
      selected_slot:evidence.selected_slot?String(evidence.selected_slot):null,
      selected_candidate_state:selectedPass?'PASS':'FAIL',
      source_identity_match:evidence.source_identity_match===true,
      candidate_identity_consistent:evidence.candidate_identity_consistent===true,
      direction_distinctness:evidence.direction_distinctness===true,
      face_unobstructed:evidence.face_unobstructed===true,
      sensitive_trait_change_detected:evidence.sensitive_trait_change_detected===true,
      candidates:Array.isArray(evidence.candidates)?evidence.candidates:[],
      notes:evidence.notes?String(evidence.notes):null
    });
    const structuralPass=gate.structural?.state==='PASS';
    const humanPass=gate.human_confirmation?.state==='PASS';
    return {
      ...gate,
      visual,
      final_state:structuralPass&&selectedPass&&humanPass?'PASS':'PENDING',
      lock_allowed:structuralPass&&selectedPass&&humanPass
    };
  }

  function confirmHuman(gate,{actor_scope,accepted_same_identity,selected_slot,notes=null}={}){
    if(!gate||gate.contract_version!==VERSION)throw new Error('CHARACTER_CONSISTENCY_GATE_REQUIRED');
    const pass=accepted_same_identity===true&&['A','B','C'].includes(String(selected_slot||'').toUpperCase());
    const human=Object.freeze({
      state:pass?'PASS':'FAIL',
      actor_scope:String(actor_scope||'UNKNOWN'),
      accepted_same_identity:accepted_same_identity===true,
      selected_slot:String(selected_slot||'').toUpperCase()||null,
      notes:notes?String(notes):null
    });
    const structuralPass=gate.structural?.state==='PASS';
    const visualPass=gate.visual?.state==='PASS';
    return {
      ...gate,
      human_confirmation:human,
      final_state:structuralPass&&visualPass&&pass?'PASS':'PENDING',
      lock_allowed:structuralPass&&visualPass&&pass
    };
  }

  function assertLockable(gate){
    if(!gate)return {ok:false,reason:'CHARACTER_CONSISTENCY_GATE_MISSING'};
    if(gate.structural?.state!=='PASS')return {ok:false,reason:'CHARACTER_STRUCTURAL_GATE_NOT_PASS'};
    if(gate.visual?.state!=='PASS')return {ok:false,reason:'CHARACTER_VISUAL_GATE_NOT_PASS'};
    if(gate.human_confirmation?.state==='FAIL')return {ok:false,reason:'CHARACTER_HUMAN_CONFIRMATION_FAILED'};
    if(!gate.lock_allowed)return {ok:false,reason:'CHARACTER_CONSISTENCY_LOCK_NOT_ALLOWED'};
    return {ok:true};
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    STATES,
    structural,
    create,
    applyVisual,
    confirmHuman,
    assertLockable
  });
  root.CharacterVisualIdConsistencyGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
