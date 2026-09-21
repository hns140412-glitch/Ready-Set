const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('ready-runtime-v07.js', 'utf8');

assert(
  source.includes("if (raw === 'HELP_NEEDED') return 'WAITING_FOR_PARENT';"),
  'HELP_NEEDED must normalize to WAITING_FOR_PARENT'
);
assert(
  source.includes("e.type === 'TASK_BLOCKED' ? 'BLOCKED'") &&
  source.includes("e.type === 'BLOCKED' ? 'BLOCKED'"),
  'explicit specialist BLOCKED events must remain BLOCKED'
);
assert(
  source.includes("e.type === 'HELP_NEEDED' ? 'WAITING_FOR_PARENT'"),
  'message-event HELP_NEEDED must map to WAITING_FOR_PARENT'
);
assert(
  source.includes("last_specialist_result = {") &&
  source.includes("source_app: specialistSource") &&
  source.includes("event_id: event_id || null") &&
  source.includes("raw_task_state: task_state || null") &&
  source.includes("normalized_task_state: normalized"),
  'specialist provenance and event id must be preserved on the task'
);
assert(
  source.includes("event_id: p.get('event_id')") &&
  source.includes("'event_id'].forEach(k => p.delete(k))"),
  'query-return event_id must be consumed and cleaned'
);
assert(
  source.includes("['COMPLETED','WAITING_FOR_PARENT','BLOCKED'].includes(normalized)"),
  'terminal specialist lap states must close the lap without ending the Ready session'
);
assert(
  !source.includes("e.type === 'HELP_NEEDED' ? 'BLOCKED'"),
  'legacy HELP_NEEDED -> BLOCKED collapse must be absent'
);

console.log('PASS learning-app-family return-state contract');
