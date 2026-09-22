import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/identity/character-consistency-gate-runtime.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(source,context);
const api=context.globalThis.CharacterVisualIdConsistencyGate;
if(!api)throw new Error('CHARACTER_CONSISTENCY_GATE_RUNTIME_MISSING');

const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const job={
  source_hash:'source-hash',
  directions:[
    {slot:'A',source:'USER_SELECTION_1',direction_id:'LIVELY'},
    {slot:'B',source:'USER_SELECTION_2',direction_id:'WARM'},
    {slot:'C',source:'SYSTEM_AUTO_CONTRAST',direction_id:'FOCUSED'}
  ],
  candidate_assets:{
    A:{asset_key:'a.webp',signature_item_id:'MAGNIFIER'},
    B:{asset_key:'b.webp',signature_item_id:'MAGNIFIER'},
    C:{asset_key:'c.webp',signature_item_id:'MAGNIFIER'}
  },
  signature_item:{id:'MAGNIFIER'},
  identity_contract:{
    contract_version:'CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01',
    identity_authority:'SOURCE_PHOTO'
  }
};

let gate=api.create(job);
assert(gate.structural.state==='PASS','STRUCTURAL_GATE_MUST_PASS_VALID_JOB');
assert(gate.visual.state==='NOT_RUN','VISUAL_GATE_MUST_BEGIN_NOT_RUN');
assert(gate.human_confirmation.state==='NOT_RUN','HUMAN_GATE_MUST_BEGIN_NOT_RUN');
assert(gate.lock_allowed===false,'LOCK_MUST_BE_BLOCKED_BEFORE_VISUAL_REVIEW');

gate=api.applyVisual(gate,{
  evaluator:'fixture',
  candidate_set_state:'PASS',
  selected_slot:'B',
  selected_candidate_state:'PASS',
  source_identity_match:true,
  candidate_identity_consistent:true,
  direction_distinctness:true,
  face_unobstructed:true,
  sensitive_trait_change_detected:false,
  candidates:[
    {slot:'A',same_child_identity:true,face_unobstructed:true,direction_readable:true},
    {slot:'B',same_child_identity:true,face_unobstructed:true,direction_readable:true},
    {slot:'C',same_child_identity:true,face_unobstructed:true,direction_readable:true}
  ],
  signature_item_consistent:true,
  signature_item_not_obstructing_face:true
});
assert(gate.visual.state==='PASS','SELECTED_VISUAL_GATE_MUST_PASS');
assert(gate.lock_allowed===false,'HUMAN_CONFIRMATION_MUST_STILL_BE_REQUIRED');

gate=api.confirmHuman(gate,{
  actor_scope:'CHILD',
  accepted_same_identity:true,
  selected_slot:'B'
});
assert(gate.final_state==='PASS','FINAL_GATE_MUST_PASS_AFTER_HUMAN_CONFIRMATION');
assert(gate.lock_allowed===true,'LOCK_MUST_BE_ALLOWED_AFTER_ALL_REQUIRED_EVIDENCE');
assert(api.assertLockable(gate).ok===true,'ASSERT_LOCKABLE_MUST_PASS');

let fail=api.create(job);
fail=api.applyVisual(fail,{
  evaluator:'fixture',
  selected_slot:'B',
  selected_candidate_state:'FAIL',
  source_identity_match:false,
  candidate_identity_consistent:false,
  direction_distinctness:true,
  face_unobstructed:true,
  sensitive_trait_change_detected:false,
  signature_item_consistent:true,
  signature_item_not_obstructing_face:true
});
assert(fail.visual.state==='FAIL','IDENTITY_DRIFT_MUST_FAIL_VISUAL_GATE');
assert(fail.lock_allowed===false,'IDENTITY_DRIFT_MUST_BLOCK_LOCK');

const badJob={...job,candidate_assets:{A:{asset_key:'a.webp'},B:{asset_key:'b.webp'}}};
assert(api.create(badJob).structural.state==='FAIL','MISSING_CANDIDATE_MUST_FAIL_STRUCTURAL_GATE');

console.log('CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01 PASS');
