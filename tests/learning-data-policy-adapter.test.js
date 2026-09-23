'use strict';
const assert=require('node:assert/strict');
const Adapter=require('../src/learning/learning-data-policy-adapter.js');

const allowed=Adapter.apply({
  decision:{policy_version:'2026-09-23.1',policy_id:'P-F01-READY',function_id:'LE-F01',consumer_app:'READY_SET',authorization_class:'READY_WITH_GUARDS',decision:'ALLOW',cannot_claim:['MASTERY_FROM_STANDARD_MEMBERSHIP']},
  analysisProvenance:{source:'official'},
  evidence:{cannot_claim:['SUBJECT_MASTERY']}
});
assert.equal(allowed.policy.decision,'ALLOW');
assert.ok(allowed.analysis_provenance.learning_data_policy);
assert.deepEqual([...allowed.evidence.cannot_claim].sort(),['MASTERY_FROM_STANDARD_MEMBERSHIP','SUBJECT_MASTERY'].sort());

assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-H01',consumer_app:'READY_SET',decision:'DENY',reason:'DENY_HOLD'}}),/DENY_HOLD/);
assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-F01',consumer_app:'HIDE_SEEK',decision:'ALLOW'}}),/POLICY_CONSUMER_MISMATCH/);
assert.throws(()=>Adapter.apply({decision:{policy_version:'2026-09-23.1',function_id:'LE-F01',consumer_app:'READY_SET',decision:'ALLOW'},requestedBehavior:'SCHEDULE_DATE_MUTATION'}),/READY_POLICY_CANNOT_MUTATE_PLANNER_DATE/);

console.log('READY_LEARNING_DATA_POLICY_ADAPTER_PASS');
