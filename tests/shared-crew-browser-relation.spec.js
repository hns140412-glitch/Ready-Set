const assert=require('node:assert/strict');
const r=require('../vendor/taky/explorer-crew-browser-relation-v1.js');
const events=[
 {event_id:'f',type:'FIRST_MEETING',verified:true,evidence_ref:'E0'},
 {event_id:'1',type:'SHARED_EPISODE',verified:true,evidence_ref:'E1'}
];
assert.equal(r.evaluate({character_id:'C',committed_state:'NOT_MET',events}).reason,'RELATION_POLICY_REQUIRED');
let x=r.evaluate({character_id:'C',committed_state:'NOT_MET',events,policy:{familiar_min_verified_episodes:1,trusted_min_verified_episodes:3}});
assert.equal(x.ok,true);assert.equal(x.candidate_state,'FAMILIAR');assert.equal(x.promotion_auto_commit,false);assert.equal(x.owner_commit_required,true);
assert.equal(x.reward_delta,0);assert.equal(x.power_delta,0);assert.equal(x.ability_delta,0);
console.log(JSON.stringify({gate:'SHARED_CREW_BROWSER_RELATION',app:'READY_SET',pass:true},null,2));
