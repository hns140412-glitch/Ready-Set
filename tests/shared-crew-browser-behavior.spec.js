const assert=require('node:assert/strict');
const behavior=require('../vendor/taky/explorer-crew-browser-behavior-v1.js');
const ambient=behavior.normalizeCharacter({character_id:'A',visual_id:'A',presence_role:'AMBIENT',relationship_state:'KNOWN',action:'CHECK_COMPASS',dialogue_level:'SHORT'},{});
assert.equal(ambient.dialogue_level,'SILENT');
assert.equal(ambient.action,'CHECK_COMPASS');
assert.deepEqual(ambient.required_roles,['BODY','FACE','HAND','EQUIPMENT']);
const trusted=behavior.normalizeCharacter({character_id:'T',visual_id:'T',presence_role:'MAIN',relationship_state:'TRUSTED',action:'POINT',dialogue_level:'SHORT'},{needs_hint:true});
assert.equal(trusted.dialogue_level,'COACH');
const plan=behavior.normalizePlan({characters:[
 {character_id:'1',visual_id:'1',presence_role:'MAIN',relationship_state:'KNOWN',action:'IDLE',dialogue_level:'SHORT'},
 {character_id:'2',visual_id:'2',presence_role:'GUEST',relationship_state:'KNOWN',action:'IDLE',dialogue_level:'SHORT'}
],max_speaking:1,behavior_state:{}});
assert.equal(plan.characters[0].dialogue_level,'SHORT');
assert.equal(plan.characters[1].dialogue_level,'SILENT');
assert.equal(plan.generation_allowed,false);assert.equal(plan.asset_selection_allowed,false);
console.log(JSON.stringify({gate:'SHARED_CREW_BROWSER_BEHAVIOR',pass:true},null,2));
