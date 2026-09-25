'use strict';
const assert=require('node:assert/strict');
const V=require('../src/learning/answer-key-verifier-runtime.js');

const pass=V.exactMatch({
  event_id:'r1',
  member_id:'A',
  subject:'영어',
  concept_skill_target:'spelling',
  response:' Essential ',
  answer_key:'essential',
  answer_key_ref:'assignment:a1:item:w1'
});
assert.equal(pass.ok,true);
assert.equal(pass.verification_candidate.outcome,1);
assert.equal(pass.verification_candidate.verifier_type,'ANSWER_KEY_EXACT');
assert.equal(pass.verification_candidate.basis,'DETERMINISTIC_LOCAL_MATCH');

const fail=V.exactMatch({
  event_id:'r2',
  member_id:'A',
  subject:'영어',
  concept_skill_target:'spelling',
  response:'essentail',
  answer_key:'essential',
  answer_key_ref:'assignment:a1:item:w1'
});
assert.equal(fail.ok,true);
assert.equal(fail.verification_candidate.outcome,0);

const invalid=V.exactMatch({
  event_id:'r3',
  member_id:'A',
  subject:'영어',
  concept_skill_target:'spelling',
  response:'x',
  answer_key:'',
  answer_key_ref:''
});
assert.equal(invalid.ok,false);
assert.equal(invalid.issues.includes('ANSWER_KEY_EMPTY'),true);

console.log('READY_ANSWER_KEY_VERIFIER_PASS');
