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
const wrong=a.consume({...good,target_app:'HIDE_SEEK'});
assert.equal(wrong.ok,false);
assert.equal(wrong.reason,'TARGET_APP_MISMATCH');
console.log(JSON.stringify({gate:'CHARACTER_RUNTIME_ADAPTER',app:a.APP,pass:true},null,2));

const semantic=a.consume({
 pass:true,target_app:a.APP,generation_allowed:false,asset_selection_allowed:false,semantic_only:true,scene_id:'semantic',
 characters:[{character_id:'LEGACY:X',visual_id:'LEGACY:X',presence_role:'MAIN',relationship_state:'KNOWN',action:'IDLE',dialogue_level:'SHORT',runtime_eligible:false,utterance:'안녕'}],
 speaking_order:['LEGACY:X'],visible_order:['LEGACY:X'],foreground_character_id:'LEGACY:X'
});
assert.equal(semantic.ok,true);
assert.equal(semantic.semantic_only,true);
assert.equal(semantic.visual_binding_allowed,false);
assert.equal(semantic.characters[0].utterance,'안녕');
