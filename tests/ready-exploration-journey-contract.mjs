import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = fs.readFileSync(new URL('../ready-base-runtime-v1.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../ready-runtime-v07.js', import.meta.url), 'utf8');
const stageC = fs.readFileSync(new URL('../ready-stage-c.js', import.meta.url), 'utf8');

const checks = [
  ['history preserves outcome labels', base.includes('readyOutcomeLabel(r.status)') && !base.includes('<em>완료</em></article>')],
  ['timetable task selection resumes at mission', native.includes("sessionStorage.getItem(PENDING_KEY)") && native.includes("nav?.('mission')") && native.includes('if(core.activeSession)')),
  ['confirmed timetable exposes now/next context', schedule.includes('function scheduleContext(rows)') && schedule.includes('지금 일정') && schedule.includes('다음 일정')],
  ['authoritative session timing exported', base.includes('sessionTimes:readySessionTimes')],
  ['share handler exported', base.includes('shareResult:readyShareResult')],
  ['share button bound', base.includes("$('#shareResultBtn').onclick=readyShareResult")],
  ['share omits fake target', base.includes("if(r.targetMs!=null)lines.push")],
  ['share includes paused only when evidenced', base.includes("if(Number(r.pausedMs)>0)lines.push")],
  ['non-complete report has distinct headline', base.includes("done?'오늘의 탐험 완료':'오늘의 탐험 기록'")],
  ['result status remains explicit', base.includes("PARTIAL:'일부 남음'") && base.includes("DEFERRED:'다음에 이어서'")],
  ['runtime uses authoritative timing', runtime.includes("ReadyBaseRuntimeV1?.sessionTimes?.()")],
  ['paused time not hardcoded during publication', !runtime.includes("pausedMs:0,source,sessionId")],
  ['rejected focus module removed from active loader', !stageC.includes("'./ready-focus-tools-v1.js'")],
  ['rejected focus renderer removed from core render', !stageC.includes('ReadyFocusToolsV1?.render?.()')],
  ['session end does not force completed state', runtime.includes("currentTask(c)?.state||'PENDING'")],
  ['Essential YouTube BGM is wired', base.includes("videoId:'h2sHEe_xnmU'") && base.includes("PLKRZTF1Q1uwYFbRwQzrySyGXYJVXqcUVu")],
  ['lofi YouTube BGM is wired', base.includes("videoId:'d9EdCgS1X_c'")],
  ['YouTube BGM uses embedded playback', base.includes('readyYoutubeFrame') && base.includes('youtube.com/embed/') && base.includes('autoplay=1')],
  ['quiet metronome option exists', base.includes("name:'메트로놈'") && base.includes('readyStartMetronome') && base.includes('osc.frequency.value=720')],
  ['nature and water local sounds remain', base.includes("./assets/bgm-nature.wav") && base.includes("./assets/bgm-water.wav")],
  ['sound button is bound', base.includes("$('#focusSoundBtn').onclick=readyCycleSound")],
  ['BGM play is no longer a no-op', base.includes("globalThis.playBgm=()=>readyApplySound({play:true})")],
  ['session start requests BGM playback', base.includes("readyNav('focus');readyApplySound({play:true})")],
  ['session completion stops BGM', base.includes("bgm.pause();bgm.currentTime=0")]
];

for (const [name, ok] of checks) {
  assert.equal(ok, true, name);
  console.log('PASS', name);
}
console.log(`PASS ${checks.length} exploration journey contract checks`);
