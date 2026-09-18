import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = fs.readFileSync(new URL('../ready-base-runtime-v1.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../ready-runtime-v07.js', import.meta.url), 'utf8');
const stageC = fs.readFileSync(new URL('../ready-stage-c.js', import.meta.url), 'utf8');

const checks = [
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
  ['BGM sources are wired', base.includes("./assets/bgm-piano.wav") && base.includes("./assets/bgm-lofi.wav") && base.includes("./assets/bgm-nature.wav") && base.includes("./assets/bgm-water.wav") && base.includes("./assets/focus-bgm.wav")],
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
