'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../src/learning/legacy-ready-learning-compat.js');

const rows=[
  {
    at:'2026-09-20T07:00:00.000Z',
    member_id:'A',
    subject:'영어',
    ready_state:'COMPLETED',
    learning_evidence:[{
      event_id:'e1',
      evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
      memory:{average_strength:80,review_advisories:[{lexicalId:'word_1',nextReviewPriority:20}]}
    }]
  },
  {
    at:'2026-09-21T07:00:00.000Z',
    member_id:'A',
    subject:'영어',
    ready_state:'PARTIAL',
    learning_evidence:[{
      event_id:'e2',
      evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
      memory:{average_strength:70,review_advisories:[{lexicalId:'word_1',nextReviewPriority:40}]}
    }]
  },
  {
    at:'2026-09-22T07:00:00.000Z',
    member_id:'A',
    subject:'영어',
    ready_state:'PARTIAL',
    learning_evidence:[{
      event_id:'e3',
      evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
      memory:{average_strength:45,review_advisories:[{lexicalId:'word_1',nextReviewPriority:91}]}
    }]
  }
];

const assessed=C.assessMemoryConcern(rows,{as_of:'2026-09-25T00:00:00.000Z',member_id:'A',subject:'영어'});
assert.equal(assessed.authority,'READY_LEGACY_COMPATIBILITY_ONLY');
assert.equal(assessed.memory_concern,true);
assert.equal(assessed.runtime_default_authority,false);
assert.equal(assessed.specialist_evidence.authority,'READY_LEGACY_COMPAT_EVIDENCE_INTERPRETATION_ONLY');
assert.equal(assessed.learner_adaptive_profile.authority,'READY_LEGACY_COMPAT_ADAPTIVE_PROFILE_ONLY');

const policy=C.adaptiveReviewPolicy({
  evidence_review_signal:{
    authority:'LEARNING_EVIDENCE_ADVISORY_ONLY',
    states:['PARTIAL','PARTIAL'],
    specialist_evidence:assessed.specialist_evidence,
    learner_adaptive_profile:assessed.learner_adaptive_profile
  }
},{split_policy:{max_span:6}});
assert.equal(policy.authority,'READY_LEGACY_COMPAT_ADAPTIVE_REVIEW_ONLY');
assert.equal(policy.reduce_unit_span,true);
assert.equal(policy.add_retrieval_checkpoint,true);
assert.equal(policy.recovery_floor,'HIGH');
assert.deepEqual(policy.target_lexical_ids,['word_1']);
assert.equal(policy.runtime_default_authority,false);

const integration=fs.readFileSync(path.join(__dirname,'..','ready-integration-v1.js'),'utf8');
const master=fs.readFileSync(path.join(__dirname,'..','ready-learning-master-v01.js'),'utf8');
const compat=fs.readFileSync(path.join(__dirname,'..','src','learning','legacy-ready-learning-compat.js'),'utf8');

assert.equal(integration.includes('priority>=70'),false,'legacy threshold must not live in Ready integration');
assert.equal(integration.includes('strength<60'),false,'legacy memory threshold must not live in Ready integration');
assert.equal(master.includes('memoryPriority>=70'),false,'legacy memory threshold must not live in Ready Learning Master');
assert.equal(master.includes('memoryStrength<60'),false,'legacy strength threshold must not live in Ready Learning Master');
assert.equal(compat.includes('priority>=70'),true,'legacy threshold should remain retained in compatibility module');
assert.equal(compat.includes('strength<60'),true,'legacy threshold should remain retained in compatibility module');

console.log('READY_LEGACY_LEARNING_COMPAT_ISOLATION_PASS');
