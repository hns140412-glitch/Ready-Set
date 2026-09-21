const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('ready-runtime-v07.js', 'utf8');
const match = source.match(/function normalizeInboundState\(raw\) \{([\s\S]*?)\n  \}/);
assert(match, 'normalizeInboundState() not found');

const normalizeInboundState = new Function(
  'VALID_TASK_STATES',
  `return function(raw) {${match[1]}\n  }`
)(new Set(['PENDING','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']));

assert.strictEqual(normalizeInboundState('HELP_NEEDED'), 'WAITING_FOR_PARENT');
assert.strictEqual(normalizeInboundState('BLOCKED'), 'BLOCKED');
assert.strictEqual(normalizeInboundState('COMPLETED'), 'COMPLETED');
assert.strictEqual(normalizeInboundState('UNKNOWN'), null);

assert(
  source.includes(": e.type === 'TASK_BLOCKED' ? 'BLOCKED'"),
  'TASK_BLOCKED must remain BLOCKED'
);
assert(
  source.includes(": e.type === 'HELP_NEEDED' ? 'WAITING_FOR_PARENT'"),
  'HELP_NEEDED learning event must map to WAITING_FOR_PARENT'
);
assert(
  source.includes("event_id: p.get('event_id')"),
  'query return must preserve specialist event_id'
);
for (const token of [
  'task.specialist_provenance',
  'source_app: from_app',
  'event_id: event_id',
  'raw_state: task_state',
  'normalized_state: normalized',
  'source_event_type: source_event_type',
  'source_event_type: e.type',
  'specialist_event_id: event_id'
]) {
  assert(source.includes(token), `missing specialist provenance token: ${token}`);
}

assert(
  !source.includes("if (raw === 'HELP_NEEDED') return 'BLOCKED';"),
  'legacy HELP_NEEDED -> BLOCKED mapping must not remain'
);

console.log('PASS learning-app-family return-state regression');
