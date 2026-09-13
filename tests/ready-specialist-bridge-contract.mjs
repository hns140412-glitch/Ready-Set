import assert from 'node:assert/strict';
import fs from 'node:fs';

const ready = fs.readFileSync('ready-runtime-v07.js','utf8');
const hide = fs.readFileSync(process.env.HIDE_BRIDGE_FILE || '/tmp/hide-bridge.js','utf8');
const snap = fs.readFileSync(process.env.SNAP_BRIDGE_FILE || '/tmp/snap-bridge.js','utf8');
const hideIndex = fs.readFileSync(process.env.HIDE_INDEX_FILE || '/tmp/hide-index.html','utf8');
const snapIndex = fs.readFileSync(process.env.SNAP_INDEX_FILE || '/tmp/snap-index.html','utf8');

const mustInclude = (source, markers, label) => {
  for (const marker of markers) assert.ok(source.includes(marker), `${label} missing: ${marker}`);
};

mustInclude(ready, [
  "url.searchParams.set('session_id', c.session_id)",
  "url.searchParams.set('goal_id', c.goal_id)",
  "url.searchParams.set('task_id', task.task_id)",
  "url.searchParams.set('lap_id', lap.lap_id)",
  "url.searchParams.set('return_target', readyReturnUrl())",
  "url.searchParams.set('snap_target', SNAP_URL)",
  "url.searchParams.set('target_time_ms', String(session.targetMs || 0))",
  "url.searchParams.set('session_start_at', String(session.startAt || 0))",
  "url.searchParams.set('issue_ms', String(session.issueMs || 0))",
  "emit('APP_SWITCH', { from: 'ready-set', to: app, lap_ended: false })",
  "event_id: p.get('event_id')",
  "if (event_id && c.applied_event_ids?.includes(event_id)) return false"
], 'Ready');

mustInclude(hide, [
  "'session_id', 'goal_id', 'task_id', 'lap_id', 'return_target', 'snap_target'",
  "session_id: context.session_id || null",
  "goal_id: context.goal_id || null",
  "task_id: context.task_id || null",
  "lap_id: context.lap_id || null",
  "url.searchParams.set('event_id', eventIdValue)",
  "url.searchParams.set('from_app', 'hide-seek')",
  "['session_id','goal_id','task_id','lap_id','return_target','child_id','target_time_ms','session_start_at','paused_at','issue_ms']",
  "url.searchParams.set('from_app', 'hide-seek')"
], 'Hide & Seek');

mustInclude(snap, [
  "'session_id','goal_id','task_id','lap_id','return_target'",
  "session_id: context.session_id || null",
  "goal_id: context.goal_id || null",
  "task_id: context.task_id || null",
  "lap_id: context.lap_id || null",
  "url.searchParams.set('event_id', eventIdValue)",
  "url.searchParams.set('from_app', 'snap-pop')",
  "context.task_completed = true",
  "emit('TASK_COMPLETED'"
], 'Snap & Pop');

assert.ok(hideIndex.includes('<script src="./hide-bridge.js"></script>'), 'Hide bridge not mounted by index');
assert.ok(snapIndex.includes('<script src="app.js"></script><script src="snap-bridge.js"></script>'), 'Snap bridge not mounted after app runtime');

// Specialist apps transport Ready-owned timer timestamps; they do not create a second canonical timer contract.
for (const [label, source] of [['Hide & Seek', hide], ['Snap & Pop', snap]]) {
  mustInclude(source, ['target_time_ms','session_start_at','issue_ms'], `${label} timer transport`);
}

console.log('PASS: Ready ↔ Hide & Seek ↔ Snap & Pop bridge identifiers, event_id, return routing and timer transport are statically aligned.');
