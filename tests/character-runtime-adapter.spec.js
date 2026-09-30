const assert=require('node:assert/strict');
const a=require('../ready-character-runtime-adapter-v1.js');
const good={
  pass:true,scene_id:'s',generation_allowed:false,asset_selection_allowed:false,
  foreground_character_id:'A',speaking_order:['A'],visible_order:['A'],
  characters:[{character_id:'A',visual_id:'VID-A',presence_role:'MAIN',relationship_state:'KNOWN',
    action:'IDLE',dialogue_level:'SHORT',required_roles:['BODY','FACE'],runtime_eligible:true}]
};
const out=a.consume(good);
assert.equal(out.ok,true);
assert.equal(out.app_id,'READY_SET');
assert.equal(out.asset_generation_allowed,false);
assert.equal(out.approved_asset_resolution_required,true);
assert.equal(a.mutatesProductionState,false);
assert.equal(a.selectsAssetPath,false);
assert.equal(a.generatesArt,false);
assert.equal(a.consume({...good,generation_allowed:true}).ok,false);
assert.equal(a.consume({...good,characters:[{...good.characters[0],runtime_eligible:false}]}).ok,false);
console.log(JSON.stringify({gate:'CHARACTER_RUNTIME_ADAPTER',app:a.APP,pass:true},null,2));
