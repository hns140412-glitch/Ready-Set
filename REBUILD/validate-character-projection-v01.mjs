import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/identity/character-visual-id-projection-runtime.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(source,context);
const api=context.globalThis.CharacterVisualIdProjection;
if(!api)throw new Error('CHARACTER_PROJECTION_RUNTIME_MISSING');

const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const localMaster={
  state:'MASTER_ASSETS_READY',
  master:{
    visual_id:'visual_fixture',
    source_hash:'TOP_SECRET_HASH',
    locked_at:'2026-09-22T00:00:00.000Z',
    consistency_gate:{
      structural_state:'PASS',
      visual_state:'PASS',
      human_state:'PASS',
      final_state:'PASS'
    },
    assets:{
      full_character:'full.webp',
      portrait_card:'portrait.webp',
      avatar_square:'avatar.webp'
    }
  }
};

const projection=api.fromMaster({
  localMaster,
  member_scope:'member_fixture',
  identity_version:1
});

assert(projection.contract_version==='CHARACTER_VISUAL_ID_PROJECTION_V01','PROJECTION_VERSION_INVALID');
assert(projection.status==='MASTER_ASSETS_READY','PROJECTION_STATUS_INVALID');
assert(projection.source_provenance.authority==='SOURCE_PHOTO','PROJECTION_SOURCE_AUTHORITY_INVALID');
assert(projection.source_provenance.source_bound===true,'PROJECTION_SOURCE_BOUND_MISSING');
assert(projection.source_provenance.raw_source_exposed===false,'PROJECTION_RAW_SOURCE_MUST_NOT_BE_EXPOSED');
assert(projection.source_provenance.source_fingerprint_exposed===false,'PROJECTION_SOURCE_FINGERPRINT_MUST_NOT_BE_EXPOSED');
assert(!('source_hash' in projection.source_provenance),'PROJECTION_MUST_NOT_EXPOSE_SOURCE_HASH');
assert(JSON.stringify(projection).includes('TOP_SECRET_HASH')===false,'PROJECTION_LEAKED_SOURCE_HASH');
assert(projection.assurance.final_state==='PASS','PROJECTION_ASSURANCE_MISSING');
assert(api.invariant(projection).ok===true,'PROJECTION_INVARIANT_SHOULD_PASS');
assert(api.assertConsumable(projection,{requireDerivatives:true}).ok===true,'PROJECTION_SHOULD_BE_CONSUMABLE');

const unassured={
  ...projection,
  assurance:{...projection.assurance,final_state:'PENDING'}
};
assert(api.assertConsumable(unassured).reason==='CHARACTER_VISUAL_ID_ASSURANCE_NOT_PASS','UNASSURED_PROJECTION_MUST_BE_REJECTED');

const contradictory={
  ...projection,
  status:'MASTER_ASSETS_READY',
  capabilities:{...projection.capabilities,derivatives_ready:false}
};
assert(api.invariant(contradictory).reason==='CHARACTER_PROJECTION_STATUS_CONTRADICTION','CONTRADICTORY_PROJECTION_MUST_FAIL');

console.log('CHARACTER_VISUAL_ID_PROJECTION_V01 PASS');
