const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('ready-runtime-v07.js', 'utf8');

for (const token of [
  "contract_version: 'READY_LEARNING_CONTEXT_V1'",
  'learning_unit_id: learningUnitId',
  'analysis_id: analysisId',
  'assignment_id: assignmentId',
  'subject: unit.subject',
  'concept_skill_target: unit.concept_skill_target',
  'activity_types:',
  'cognitive_load_profile:',
  'confidence:',
  'unresolved_flags:',
  "fact.confirmation_state !== 'FACT_CONFIRMED'",
  'fact.current_analysis_id !== analysisId',
  "unit.state !== 'INTERPRETED'",
  "url.searchParams.set('learning_context', encodedLearningContext)"
]) {
  assert(source.includes(token), `missing READY_LEARNING_CONTEXT_V1 producer contract token: ${token}`);
}

const contextBlock = source.match(/function buildReadyLearningContext[\s\S]*?\n  function encodeLearningContext/);
assert(contextBlock, 'buildReadyLearningContext block missing');
for (const forbidden of [
  'actor_role:',
  'permission:',
  'planner_authority:',
  'allocation_authority:',
  'family_id:',
  'child_id:'
]) {
  assert(!contextBlock[0].includes(forbidden), `forbidden authority/identity field leaked: ${forbidden}`);
}

console.log('PASS READY_LEARNING_CONTEXT_V1 producer contract');
