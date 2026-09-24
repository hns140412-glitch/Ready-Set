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
    assets_complete:!!(assets.A?.asset_key&&assets.B?.asset_key&&assets.C?.asset_key),
    signature_item_present:!!job.signature_item?.id,
    signature_item_same_metadata:['A','B','C'].every(slot=>assets?.[slot]?.signature_item_id===job.signature_item?.id)
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
    candidate_set_state:'NOT_RUN',
    selected_slot:null,
    selected_candidate_state:'NOT_RUN',
    source_identity_match:null,
    candidate_identity_consistent:null,
    direction_distinctness:null,
    face_unobstructed:null,
    sensitive_trait_change_detected:null,
    candidates:[],
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
  const candidates=Array.isArray(evidence.candidates)?evidence.candidates:[];
  const selectedSlot=String(job.selected_slot||'').toUpperCase();
  const selected=candidates.find(x=>String(x?.slot||'').toUpperCase()===selectedSlot)||null;
  const candidateEvidenceComplete=
    candidates.length===3 &&
    ['A','B','C'].every(slot=>candidates.some(x=>String(x?.slot||'').toUpperCase()===slot));
  const allSameIdentity=candidateEvidenceComplete&&candidates.every(x=>x?.same_child_identity===true);
  const allFacesUnobstructed=candidateEvidenceComplete&&candidates.every(x=>x?.face_unobstructed===true);
  const allDirectionsReadable=candidateEvidenceComplete&&candidates.every(x=>x?.direction_readable!==false);
  const candidateSetPass=
    allSameIdentity &&
    allFacesUnobstructed &&
    allDirectionsReadable &&
    evidence.direction_distinctness===true &&
    evidence.sensitive_trait_change_detected===false &&
    evidence.signature_item_consistent===true &&
    evidence.signature_item_not_obstructing_face===true;
  const selectedPass=!!selected &&
    selected.same_child_identity===true &&
    selected.face_unobstructed===true &&
    evidence.sensitive_trait_change_detected===false;
  gate.visual={
    state:selectedPass?'PASS':'FAIL',
    evaluator:String(evidence.evaluator||'UNSPECIFIED'),
    candidate_set_state:candidateSetPass?'PASS':'FAIL',
    selected_slot:selectedSlot||null,
    selected_candidate_state:selectedPass?'PASS':'FAIL',
    source_identity_match:selected?.same_child_identity===true,
    candidate_identity_consistent:allSameIdentity,
    direction_distinctness:evidence.direction_distinctness===true&&allDirectionsReadable,
    face_unobstructed:selected?.face_unobstructed===true,
    sensitive_trait_change_detected:evidence.sensitive_trait_change_detected===true,
    signature_item_consistent:evidence.signature_item_consistent===true,
    signature_item_not_obstructing_face:evidence.signature_item_not_obstructing_face===true,
    candidates,
    notes:evidence.notes?String(evidence.notes):null
  };
  gate.final_state=gate.structural.state==='PASS'&&selectedPass&&gate.human_confirmation.state==='PASS'?'PASS':'PENDING';
  gate.lock_allowed=gate.final_state==='PASS';
  return gate;
}

export { VERSION, structural, ensure, applyHuman, applyVisual };
