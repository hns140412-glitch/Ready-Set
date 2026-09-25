'use strict';

const assert=require('node:assert/strict');
globalThis.ReadyAnswerKeyVerifier=require('../src/learning/answer-key-verifier-runtime.js');
const Evidence=require('../src/learning/evidence-ontology-runtime.js');

const baseTask={
  learning_unit_id:'u1',
  assignment_id:'a1',
  analysis_id:'an1',
  subject:'영어',
  matched_domain:'이해',
  concept_skill_target:'VOCABULARY'
};

const hide=Evidence.specialistEvidence({
  task:baseTask,
  from_app:'hide-seek',
  task_state:'PARTIAL',
  event_id:'e-hide',
  payload:{
    instrumentVersion:'hide-v2',
    interactionMode:'RECALL',
    assisted:false,
    attemptCount:2,
    responseLatencyMs:1800,
    memorySummary:{
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      averageMemoryStrength:62,
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      reviewAdvisories:[{lexicalId:'word_1',nextReviewPriority:88}]
    }
  }
});
assert.equal(hide.evidence_type,'MEMORY_RETRIEVAL_EVIDENCE');
assert.equal(hide.concept_skill_target,'VOCABULARY');
assert.equal(hide.instrument_version,'hide-v2');
assert.equal(hide.interaction_mode,'RECALL');
assert.equal(hide.assistance,'UNASSISTED');
assert.equal(hide.attempt_count,2);
assert.equal(hide.response_latency_ms,1800);
assert.equal(hide.memory.average_strength,62);
assert.equal(hide.memory.schedule_owner,'READY_SET_PLANNER');
assert.equal(hide.interpretation_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(hide.memory.review_policy_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(hide.memory.reported_review_policy_owner,'READY_LEARNING_ENGINE');
assert.ok(hide.cannot_claim.includes('CONCEPT_MASTERY'));

const readyStructured=Evidence.structuredPracticeEvidence({
  task:{...baseTask,member_id:'A',learning_target_id:'word:essential'},
  event_id:'e-ready',
  response:'Essential',
  answer_key:'essential',
  answer_key_ref:'assignment:a1:item:essential'
});
assert.equal(readyStructured.ok,true);
assert.equal(readyStructured.evidence.evidence_type,'STRUCTURED_PRACTICE_EVIDENCE');
assert.equal(readyStructured.evidence.learning_target_id,'word:essential');
assert.equal(readyStructured.evidence.verification_candidate.verifier_type,'ANSWER_KEY_EXACT');
assert.equal(readyStructured.evidence.verification_candidate.outcome,1);
assert.equal(readyStructured.evidence.interpretation_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.ok(readyStructured.evidence.cannot_claim.includes('GLOBAL_MASTERY'));

const snap=Evidence.specialistEvidence({
  task:baseTask,
  from_app:'snap-pop',
  task_state:'COMPLETED',
  event_id:'e-snap',
  payload:{child_authored:true,landmark:'forest',step:3}
});
assert.equal(snap.evidence_type,'LEARNER_PRODUCTION_EVIDENCE');
assert.equal(snap.production.child_authored,true);
assert.ok(snap.cannot_claim.includes('OBJECTIVE_RECALL_MASTERY'));

let rows=[];
rows=Evidence.append(rows,hide);
rows=Evidence.append(rows,hide);
rows=Evidence.append(rows,snap);
assert.equal(rows.length,2,'event_id dedupe must hold');

console.log('EVIDENCE_ONTOLOGY_PASS');
