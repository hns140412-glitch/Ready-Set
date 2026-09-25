'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('ready-runtime-v07.js','utf8');
for(const key of ['family_id','member_id','actor_member_id','profile_id','assignment_id','analysis_id','learning_unit_id','todo_id','session_id','task_id','lap_id']){
  assert(src.includes(key), 'missing execution context key: '+key);
}
assert(src.includes('planner_todo_id: link.todo_id'));
assert(src.includes('learning_unit_id:link.learning_unit_id||null'));
assert(src.includes('const executionContext = currentExecutionIdentity(task, c)'));
assert(src.includes("url.searchParams.set(key, value)"));
assert(src.includes("if (value && expected[key] && value !== expected[key]) return false"));
assert(src.includes("member_id: e.member_id || e.child_id"));
console.log('READY_APP_EXECUTION_CONTEXT_BRIDGE_PASS');

assert(src.includes("ReadyFamilyRegistry?.activeChild?.()"));
assert(src.includes('actor_member_id: family.member_id || null'));
assert(src.includes('member_display_name'));

assert(src.includes('TakyExplorationEvent'));
assert(src.includes("taky-exploration-event"));
