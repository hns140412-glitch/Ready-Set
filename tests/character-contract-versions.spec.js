const assert=require('node:assert/strict');
const d=require('../character-contract-versions.json');
assert.equal(d.schema,'TAKY_CONTRACT_VERSION_HANDSHAKE_V1');
assert.equal(d.app_id,'READY_SET');
assert.equal(d.incompatibility_policy,'FAIL_CLOSED');
assert.equal(d.silent_downgrade_allowed,false);
const expected={
  TAKY_APP_SCENE_POLICY_ADAPTER_V1:1,
  TAKY_UI_BINDING_CONTRACT_V1:1,
  TAKY_CHARACTER_RUNTIME_COORDINATOR_V1:1,
  TAKY_DESIGN_GATE_RECEIPT_V1:1,
  TAKY_EXPLORER_CREW_RELEASE_GATE_V1:1,
  TAKY_CREW_EVIDENCE_EVENT_V1:1,
  TAKY_EXPLORER_CREW_BROWSER_BEHAVIOR_V1:1,
  TAKY_EXPLORER_CREW_BROWSER_RELATION_V1:1,
  TAKY_CREW_EVIDENCE_HANDOFF_V1:1,
  TAKY_CREW_IDENTITY_CHANGE_V1:1,
  TAKY_CENTRAL_CREW_EVIDENCE_HTTP_V1:1,
  TAKY_CREW_EVIDENCE_BROWSER_PROVIDER_V1:1
};
assert.deepEqual(d.requires,expected);
console.log(JSON.stringify({gate:'CHARACTER_CONTRACT_VERSION_DECLARATION',app:d.app_id,pass:true},null,2));
