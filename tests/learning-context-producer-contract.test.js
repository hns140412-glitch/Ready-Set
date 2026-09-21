const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('ready-runtime-v07.js', 'utf8');

for (const field of [
  'learning_unit_id','analysis_id','assignment_id','subject','concept_skill_target',
  'activity_types','cognitive_load_profile','confidence','unresolved_flags'
]) {
  assert(source.includes(field), 'missing learning context field: '+field);
}

assert(source.includes("contract_version: 'READY_LEARNING_CONTEXT_V1'"), 'contract version missing');
assert(source.includes("fact.confirmation_state !== 'FACT_CONFIRMED'"), 'producer must fail closed without confirmed fact');
assert(source.includes("unit.analysis_id !== task.analysis_id"), 'learning unit lineage must match active task');
assert(source.includes("unit.assignment_id !== task.assignment_id"), 'assignment lineage must match active task');
assert(source.includes("url.searchParams.set('learning_context', encodedLearningContext)"), 'specialist launch must carry learning_context');

for (const forbidden of ['role','permission','planner_authority','allocation_authority','family_id','child_id']) {
  assert(!source.includes('learning_context.'+forbidden), 'forbidden authority field leaked: '+forbidden);
}

console.log('PASS Ready learning-context producer contract');
