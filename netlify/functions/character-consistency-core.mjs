const VERSION='CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01';

function structural(job={}){
  const directions=Array.isArray(job.directions)?job.directions:[];
  const assets=job.candidate_assets||{};
  const slots=directions.map(x=>String(x?.slot||'')).join('|');
  const sources=directions.map(x=>String(x?.source||'')).join('|');
  const ids=directions.map(x=>String(x?.direction_id||'')).filter(Boolean);
  const checks={
    source_hash_present:!!job.source_hash,
    identity_contract_valid:job.identity_contract?.contract_version==='CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01',
    source_photo_authority:job.identity_contract?.identity_authority==='SOURCE_PHOTO',
    slots_abc:slots==='A|B|C',
    provenance_valid:sources==='USER_SELECTION_1|USER_SELECTION_2|SYSTEM_AUTO_CONTRAST',
    directions_distinct:ids.length===3&&new Set(ids).size===3,
    assets_complete:!!(assets.A?.asset_key&&assets.B?.asset_key&&assets.C?.asset_key)
  };
  const pass=Object.values(checks).every(Boolean);
  return {state:pass?'PASS':'FAIL',checks,reason:pass?null:'STRUCTURAL_CONSISTENCY_FAILED'};
}

function ensure(job={}){
  const s=structural(job);
  const previous=job.consistency_gate||{};
  const visual=previous.visual||{
    state:'NOT_RUN',
    evaluator:null,
    source_identity_match:null,
    candidate_identity_consistent:null,
    direction_distinctness:null,
    face_unobstructed:null,
    sensitive_trait_change_detected:null,
    notes:null
  };
  const human=previous.human_confirmation||{
    state:'NOT_RUN',
    actor_scope:null,
    accepted_same_identity:null,
    selected_slot:null,
    notes:null
  };
  const visualPass=visual.state==='PASS';
  const humanPass=human.state==='PASS';
  return {
    contract_version:VERSION,
    structural:s,
    visual,
    human_confirmation:human,
    final_state:s.state==='FAIL'?'FAIL':s.state==='PASS'&&visualPass&&humanPass?'PASS':'PENDING',
    lock_allowed:s.state==='PASS'&&visualPass&&humanPass
  };
}

function applyHuman(job,{actor_scope,accepted_same_identity,selected_slot,notes=null}={}){
  const gate=ensure(job);
  const slot=String(selected_slot||'').toUpperCase();
  const pass=accepted_same_identity===true&&['A','B','C'].includes(slot)&&slot===String(job.selected_slot||'').toUpperCase();
  gate.human_confirmation={
    state:pass?'PASS':'FAIL',
    actor_scope:String(actor_scope||'UNKNOWN'),
    accepted_same_identity:accepted_same_identity===true,
    selected_slot:slot||null,
    notes:notes?String(notes):null
  };
  gate.final_state=gate.structural.state==='PASS'&&gate.visual.state==='PASS'&&pass?'PASS':'PENDING';
  gate.lock_allowed=gate.final_state==='PASS';
  return gate;
}

function applyVisual(job,evidence={}){
  const gate=ensure(job);
  const pass=
    evidence.source_identity_match===true &&
    evidence.candidate_identity_consistent===true &&
    evidence.direction_distinctness===true &&
    evidence.face_unobstructed===true &&
    evidence.sensitive_trait_change_detected===false;
  gate.visual={
    state:pass?'PASS':'FAIL',
    evaluator:String(evidence.evaluator||'UNSPECIFIED'),
    source_identity_match:evidence.source_identity_match===true,
    candidate_identity_consistent:evidence.candidate_identity_consistent===true,
    direction_distinctness:evidence.direction_distinctness===true,
    face_unobstructed:evidence.face_unobstructed===true,
    sensitive_trait_change_detected:evidence.sensitive_trait_change_detected===true,
    notes:evidence.notes?String(evidence.notes):null
  };
  gate.final_state=gate.structural.state==='PASS'&&pass&&gate.human_confirmation.state==='PASS'?'PASS':'PENDING';
  gate.lock_allowed=gate.final_state==='PASS';
  return gate;
}

export { VERSION, structural, ensure, applyHuman, applyVisual };
