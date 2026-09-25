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

const worldRequired=[
  "schema:'TAKY_READY_WORLD_STATE_CONSUMER_V1'",
  "world_review_status!=='REVIEWED_RUNTIME_CANDIDATE'",
  "crew_visual!=='STATIC_REFERENCE_LINEAGE_ONLY'",
  'consumer_only:true',
  'ready_does_not_own_world_state:true',
  'ready_does_not_mutate_crew_identity:true',
  'reference_board_direct_binding:false',
  'auto_asset_promotion:false',
  'auto_badge_activation:false',
  'auto_award:false',
  "data.type==='TAKY_WORLD_STATE'",
  "new CustomEvent('taky-ready-world-state'"
];
for(const token of worldRequired){if(!s.includes(token))throw new Error('WORLD_STATE_MISSING:'+token);}
if(s.includes('auto_asset_promotion:true'))throw new Error('WORLD_STATE_AUTO_PROMOTION_FORBIDDEN');
if(s.includes('auto_badge_activation:true'))throw new Error('WORLD_STATE_AUTO_BADGE_ACTIVATION_FORBIDDEN');
console.log('READY_WORLD_STATE_CONSUMER_PASS');