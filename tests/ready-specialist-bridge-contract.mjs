import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sibling = name => path.resolve('..', name);
const ready = fs.readFileSync('ready-runtime-v07.js','utf8');
const hide = fs.readFileSync(process.env.HIDE_BRIDGE_FILE || sibling(path.join('Hide & Seek','hide-bridge.js')),'utf8');
const snap = fs.readFileSync(process.env.SNAP_BRIDGE_FILE || sibling(path.join('Snap & Pop','snap-bridge.js')),'utf8');
const playCamp = fs.readFileSync(process.env.PLAY_CAMP_BRIDGE_FILE || sibling(path.join('Play Camp','src','lib','readyBridge.ts')),'utf8');
const hideIndex = fs.readFileSync(process.env.HIDE_INDEX_FILE || sibling(path.join('Hide & Seek','index.html')),'utf8');
const snapIndex = fs.readFileSync(process.env.SNAP_INDEX_FILE || sibling(path.join('Snap & Pop','index.html')),'utf8');

const compact = value => value.replace(/\s+/g,'');
const mustInclude = (source, markers, label) => {
  const normalized = compact(source);
  for (const marker of markers) assert.ok(source.includes(marker) || normalized.includes(compact(marker)), `${label} missing: ${marker}`);
};

mustInclude(ready, [
  "url.searchParams.set('session_id', c.session_id)",
  "url.searchParams.set('goal_id', c.goal_id)",
  "url.searchParams.set('task_id', task.task_id)",
  "url.searchParams.set('lap_id', lap.lap_id)",
  "url.searchParams.set('return_target', session.return_target)",
  "url.searchParams.set('snap_target', SNAP_URL)",
  "url.searchParams.set('target_time_ms', String(session.targetMs || 0))",
  "url.searchParams.set('session_start_at', String(session.startAt || 0))",
  "url.searchParams.set('issue_ms', String(session.issueMs || 0))",
  "emit('APP_SWITCH', { from: 'ready-set', to: app, lap_ended: false })",
  "event_id: p.get('event_id')",
  "if (event_id && c.applied_event_ids?.includes(event_id)) return false",
  "function applyInboundResult({ session_id, goal_id, task_id, lap_id, task_state, from_app, event_id = null })",
  "if (!goal_id || goal_id !== c.goal_id) return false",
  "const lap = lap_id ? (task.laps || []).find(l => l.lap_id === lap_id) : null",
  "if (!lap || lap.ended_at || c.active_task_id !== task.task_id || c.active_lap_id !== lap.lap_id) return false",
  "const normalized = normalizeInboundState(task_state)",
  "if (task_state != null && task_state !== '') return false",
  "goal_id: p.get('goal_id')",
  "if (!taskState) return;",
  "goal_id: e.goal_id",
  "BOOT_PARAMS.get('play_camp_target')",
  "SPECIALIST_APPS",
  "app==='play-camp'&&PLAY_CAMP_URL?PLAY_CAMP_URL:location.href",
  "if(PLAY_CAMP_URL)url.searchParams.set('play_camp_target',PLAY_CAMP_URL)",
  "data-rev07-app=\"play-camp\""
], 'Ready');

mustInclude(hide, [
  "const SHARED_PARAM_NAMES = [",
  "session_id: context.session_id || null",
  "goal_id: context.goal_id || null",
  "task_id: context.task_id || null",
  "lap_id: context.lap_id || null",
  "url.searchParams.set('event_id', eventIdValue)",
  "url.searchParams.set('from_app', 'hide-seek')",
  "['session_id','goal_id','task_id','lap_id','return_target','crew_event','child_id'",
  "if (context.crew_event) url.searchParams.set('crew_event', context.crew_event)",
  "url.searchParams.set('from_app', 'hide-seek')"
], 'Hide & Seek');

mustInclude(snap, [
  "'session_id','goal_id','task_id','lap_id','return_target','crew_event'",
  "if (context.crew_event) url.searchParams.set('crew_event', context.crew_event)",
  "session_id: context.session_id || null",
  "goal_id: context.goal_id || null",
  "task_id: context.task_id || null",
  "lap_id: context.lap_id || null",
  "url.searchParams.set('event_id', eventIdValue)",
  "url.searchParams.set('from_app', 'snap-pop')",
  "context.task_completed = true",
  "emit('TASK_COMPLETED'"
], 'Snap & Pop');

mustInclude(playCamp, [
  "'session_id','goal_id','task_id','lap_id','return_target'",
  "url.searchParams.set('task_state', state)",
  "url.searchParams.set('from_app', 'play-camp')",
  "notifyPlayCampReadyBridgeObservation",
  "task_completed:true",
  "id = 'playCampReadyReturn'",
  "buildPlayCampReadyReturnUrl"
], 'Play Camp');

assert.ok(hideIndex.includes('<script src="./hide-bridge.js"></script>'), 'Hide bridge not mounted by index');
const snapAppPos=snapIndex.indexOf('src="app.js"');
const snapBridgePos=snapIndex.indexOf('src="snap-bridge.js"');
assert.ok(snapAppPos>=0 && snapBridgePos>snapAppPos, 'Snap bridge not mounted after app runtime');

for (const [label, source] of [['Hide & Seek', hide], ['Snap & Pop', snap]]) {
  mustInclude(source, ['target_time_ms','session_start_at','issue_ms'], `${label} timer transport`);
}

console.log('PASS: Ready ↔ Hide & Seek / Snap & Pop / optional Play Camp bridge transport and inbound goal/task/lap ownership are statically aligned.');
