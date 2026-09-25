import fs from 'node:fs';
const s=fs.readFileSync('ready-integration-v1.js','utf8');
const required=[
  'LEARNING_EVIDENCE_POLICY_DENIED',
  'LEARNING_DECISION_HOLD',
  "schema:'TAKY_READY_LEARNING_ACTION_V2'",
  'source_refs_are_context_only:true',
  'learning_engine_does_not_write_schedule:true',
  'preferred_date:null',
  'planner_date:null',
  "data.type!=='TAKY_LEARNING_ACTION'"
];
for(const token of required){if(!s.includes(token))throw new Error('MISSING:'+token);}
if(!s.includes('accepted_for_planner:!!action.planner_allocation_allowed'))throw new Error('PLANNER_ACCEPTANCE_GATE_MISSING');
console.log('READY_LEARNING_RUNTIME_BRIDGE_PASS');