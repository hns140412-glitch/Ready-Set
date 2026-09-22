import { structural, ensure, applyHuman, applyVisual } from '../netlify/functions/character-consistency-core.mjs';

const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};
const job={
  source_hash:'fixture-source',
  directions:[
    {slot:'A',source:'USER_SELECTION_1',direction_id:'LIVELY'},
    {slot:'B',source:'USER_SELECTION_2',direction_id:'WARM'},
    {slot:'C',source:'SYSTEM_AUTO_CONTRAST',direction_id:'FOCUSED'}
  ],
  candidate_assets:{
    A:{asset_key:'A.webp'},
    B:{asset_key:'B.webp'},
    C:{asset_key:'C.webp'}
  },
  identity_contract:{
    contract_version:'CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01',
    identity_authority:'SOURCE_PHOTO'
  },
  selected_slot:'B'
};

assert(structural(job).state==='PASS','SERVER_STRUCTURAL_GATE_FAILED');
let gate=ensure(job);
assert(gate.final_state==='PENDING'&&!gate.lock_allowed,'SERVER_GATE_MUST_START_PENDING');

job.consistency_gate=gate;
gate=applyVisual(job,{
  evaluator:'fixture',
  candidate_identity_consistent:true,
  direction_distinctness:true,
  face_unobstructed:true,
  sensitive_trait_change_detected:false,
  candidates:[
    {slot:'A',same_child_identity:false,face_unobstructed:true},
    {slot:'B',same_child_identity:true,face_unobstructed:true},
    {slot:'C',same_child_identity:true,face_unobstructed:true}
  ],
  notes:'fixture'
});
assert(gate.visual.candidate_set_state==='FAIL','CANDIDATE_SET_DRIFT_MUST_BE_RECORDED');
assert(gate.visual.selected_candidate_state==='PASS','GOOD_SELECTED_CANDIDATE_SHOULD_REMAIN_LOCK_ELIGIBLE_AFTER_HUMAN_CONFIRM');
job.consistency_gate=gate;
gate=applyHuman(job,{actor_scope:'CHILD',accepted_same_identity:true,selected_slot:'B'});
assert(gate.final_state==='PASS'&&gate.lock_allowed===true,'SERVER_SELECTED_GATE_SHOULD_PASS');

console.log('CHARACTER_VISUAL_ID_SERVER_CONSISTENCY_V01 PASS');
