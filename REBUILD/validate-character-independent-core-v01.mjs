import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.createContext(context);

function load(path){
  const source=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
  vm.runInContext(source,context,{filename:path});
}
function assert(cond,msg){if(!cond)throw new Error(msg);}

[
  'src/identity/character-direction-runtime.js',
  'src/identity/character-identity-consistency-runtime.js',
  'src/identity/character-consistency-gate-runtime.js',
  'src/identity/character-generation-job-runtime.js',
  'src/identity/character-asset-keys-runtime.js',
  'src/identity/character-core-orchestrator-runtime.js',
  'src/identity/character-master-runtime.js',
  'src/identity/character-visual-id-projection-runtime.js'
].forEach(load);

const g=context.globalThis;
const required=[
  'CharacterVisualIdDirection',
  'CharacterVisualIdentityConsistency',
  'CharacterVisualIdConsistencyGate',
  'CharacterVisualIdGenerationJob',
  'CharacterVisualIdAssetKeys',
  'CharacterVisualIdCoreOrchestrator',
  'CharacterVisualIdMaster',
  'CharacterVisualIdProjection'
];
for(const key of required)assert(g[key],key+'_MISSING');

const profile={
  sourcePhoto:{source_hash:'0123456789abcdef0123456789abcdef'},
  visualId:'visual_fixture'
};

const core=g.CharacterVisualIdCoreOrchestrator.create();
let out=core.begin(profile);
assert(out.status==='ROUND_1','INDEPENDENT_ROUND_1_FAILED');
const first=out.options[0].id;
out=core.choose(profile,first,{memberScope:'member_fixture',visualId:'visual_fixture'});
assert(out.status==='ROUND_2','INDEPENDENT_ROUND_2_FAILED');
const second=out.options[0].id;
out=core.choose(profile,second,{memberScope:'member_fixture',visualId:'visual_fixture'});
assert(out.status==='READY_FOR_CANDIDATE_GENERATION','INDEPENDENT_CANDIDATE_CONTRACT_FAILED');
assert(out.identityContract?.candidate_rule==='SAME_CHILD_DIFFERENT_DIRECTION','INDEPENDENT_IDENTITY_CONTRACT_FAILED');

const payload=core.generationPayload(profile);
assert(payload.identity_contract?.identity_authority==='SOURCE_PHOTO','INDEPENDENT_PAYLOAD_IDENTITY_AUTHORITY_FAILED');
assert(payload.directions.length===3,'INDEPENDENT_PAYLOAD_CANDIDATES_FAILED');

const job={
  ...profile.characterGenerationJob,
  directions:profile.characterGenerationJob.directions,
  candidate_assets:{
    A:{asset_key:'member_fixture/visual_fixture/candidates/A.webp'},
    B:{asset_key:'member_fixture/visual_fixture/candidates/B.webp'},
    C:{asset_key:'member_fixture/visual_fixture/candidates/C.webp'}
  },
  identity_contract:profile.characterIdentityContract,
  selected_slot:'B'
};
const gateApi=g.CharacterVisualIdConsistencyGate;
let gate=gateApi.create(job);
assert(gate.structural.state==='PASS','INDEPENDENT_STRUCTURAL_GATE_FAILED');

gate=gateApi.applyVisual(gate,{
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
    {slot:'A',same_child_identity:true,face_unobstructed:true},
    {slot:'B',same_child_identity:true,face_unobstructed:true},
    {slot:'C',same_child_identity:true,face_unobstructed:true}
  ]
});
gate=gateApi.confirmHuman(gate,{actor_scope:'CHILD',accepted_same_identity:true,selected_slot:'B'});
assert(gateApi.assertLockable(gate).ok===true,'INDEPENDENT_LOCK_GATE_FAILED');

const masterApi=g.CharacterVisualIdMaster;
let master=masterApi.create({
  visual_id:'visual_fixture',
  source_hash:profile.sourcePhoto.source_hash,
  candidates:[
    {slot:'A',direction_id:payload.directions[0].direction_id,source:payload.directions[0].source,asset_key:'A.webp'},
    {slot:'B',direction_id:payload.directions[1].direction_id,source:payload.directions[1].source,asset_key:'B.webp'},
    {slot:'C',direction_id:payload.directions[2].direction_id,source:payload.directions[2].source,asset_key:'C.webp'}
  ]
});
master=masterApi.select(master,'B');
master=masterApi.lockIdentity(master,{
  consistency_gate:{
    structural_state:'PASS',
    visual_state:'PASS',
    human_state:'PASS',
    final_state:'PASS'
  },
  locked_at:'2026-09-22T00:00:00.000Z'
});
assert(master.state==='VISUAL_ID_LOCKED','INDEPENDENT_VISUAL_ID_LOCK_FAILED');

master=masterApi.attachDerivedAssets(master,{
  avatar_square:'avatar.webp',
  portrait_card:'portrait.webp',
  full_character:'full.webp',
  updated_at:'2026-09-22T00:01:00.000Z'
});
assert(master.state==='MASTER_ASSETS_READY','INDEPENDENT_MASTER_ASSETS_FAILED');

const projection=g.CharacterVisualIdProjection.fromMaster({
  localMaster:master,
  member_scope:'member_fixture',
  source_hash:profile.sourcePhoto.source_hash
});
assert(projection.status==='MASTER_ASSETS_READY','INDEPENDENT_PROJECTION_STATE_FAILED');
assert(projection.assurance?.final_state==='PASS','INDEPENDENT_PROJECTION_ASSURANCE_FAILED');
assert(g.CharacterVisualIdProjection.assertConsumable(projection,{requireDerivatives:true}).ok===true,'INDEPENDENT_PROJECTION_CONSUMER_GATE_FAILED');

console.log('CHARACTER_VISUAL_ID_INDEPENDENT_CORE_V01 PASS');
