import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = fs.readFileSync(new URL('../ready-base-runtime-v1.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../ready-runtime-v07.js', import.meta.url), 'utf8');
const stageC = fs.readFileSync(new URL('../ready-stage-c.js', import.meta.url), 'utf8');
const stageD = fs.readFileSync(new URL('../ready-stage-d-base-v1.js', import.meta.url), 'utf8');
const recording = fs.readFileSync(new URL('../ready-recording-v1.js', import.meta.url), 'utf8');
const finishRecording = recording.slice(recording.indexOf('async function finishRecording()'), recording.indexOf('async function startRecording()'));
const native = fs.readFileSync(new URL('../ready-base-native-v2.js', import.meta.url), 'utf8');
const homeUI = fs.readFileSync(new URL('../ready-home-homework-ui-v1.js', import.meta.url), 'utf8');
const stageDLoader = fs.readFileSync(new URL('../ready-stage-d.js', import.meta.url), 'utf8');
const schedule = fs.readFileSync(new URL('../ready-schedule-base-v1.js', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const version = JSON.parse(fs.readFileSync(new URL('../VERSION.json', import.meta.url), 'utf8'));

const checks = [
  ['PWA service worker is registered by active runtime', base.includes("navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})")],
  ['PWA cache includes active timer and recording dependencies', sw.includes("'./ready-stage-d-base-v1.js'") && sw.includes("'./ready-recording-v1.js'") && sw.includes("'./ready-stage-g13-authority-recovery.js'")],
  ['PWA cache version matches VERSION metadata', sw.includes(`const CACHE='${version.cacheVersion}';`)],
  ['history preserves outcome labels', base.includes('readyOutcomeLabel(r.status)') && !base.includes('<em>완료</em></article>')],
  ['home task selection uses canonical planner mission bridge', homeUI.includes('ReadyBaseNativeV2?.chooseTask') && !homeUI.includes('core.createSession(task)')],
  ['Stage C chooses one deterministic homework home presenter', stageC.includes('ReadyBaseNativeV2?.render?.();') && stageC.includes('ReadyHomeHomeworkUIV1?.render?.();')],
  ['dynamic runtime loaders are bounded', stageC.includes('timeout = 12000') && stageC.includes('LOAD_TIMEOUT:') && stageDLoader.includes('timeout=12000') && stageDLoader.includes('LOAD_TIMEOUT:')],
  ['timetable task selection resumes at mission', native.includes('sessionStorage.getItem(PENDING_KEY)') && native.includes("nav?.('mission')") && native.includes('if(core.activeSession)')],
  ['schedule refresh does not rewrite active session selection', base.includes("if(state.activeSession){const activeId=state.activeSession.plannerTaskId")],
  ['confirmed timetable exposes now/next context', schedule.includes('function scheduleContext(rows)') && schedule.includes('지금 일정') && schedule.includes('다음 일정')],
  ['authoritative session timing exported', base.includes('sessionTimes:readySessionTimes')],
  ['active session restores after reload', base.includes('function readyRestoreActiveSession()') && base.includes("readyNav('focus');clearInterval(readyTicker)")],
  ['start and result share handlers exported', base.includes('shareMission:readyShareMission') && base.includes('shareResult:readyShareResult')],
  ['start and result share buttons bound', base.includes("$('#missionShareBtn').onclick=readyShareMission") && base.includes("$('#shareResultBtn').onclick=readyShareResult")],
  ['share is image-first when file sharing is supported', base.includes('function readyShareCardBlob') && base.includes("new File([blob],fileName,{type:'image/png'})") && base.includes('navigator.canShare({files:[file]})')],
  ['share card uses truthful result fields', base.includes('status||readyOutcomeLabel(record?.status)') && base.includes('focusMs??record?.focusMs') && base.includes('targetMs??record?.targetMs')],
  ['share omits fake target', base.includes('if(r.targetMs!=null)lines.push')],
  ['share includes paused only when evidenced', base.includes('if(Number(r.pausedMs)>0)lines.push')],
  ['non-complete report has distinct headline', base.includes("done?'오늘의 탐험 완료':'오늘의 탐험 기록'")],
  ['result status remains explicit', base.includes("PARTIAL:'일부 남음'") && base.includes("DEFERRED:'다음에 이어서'") && base.includes("BLOCKED:'막힘'") && base.includes("WAITING_FOR_PARENT:'부모 도움 필요'")],
  ['no fallback false completion', !base.includes("canonical?.state||report?.resultState||'COMPLETED'") && base.includes("tasks.every(t=>t.state==='COMPLETED')")],
  ['per-task wrap-up truth is persisted', base.includes('taskStates:tasks.map') && base.includes('r.taskStates')],
  ['REV07 contract is activated from active focus rendering', base.includes('window.ReadySetRev07?.render?.()') && runtime.includes("render:()=>{if(state.activeSession){ensureContract();renderContractUI()}}")],
  ['runtime uses authoritative timing', runtime.includes('ReadyBaseRuntimeV1?.sessionTimes?.()')],
  ['paused time not hardcoded during publication', !runtime.includes('pausedMs:0,source,sessionId')],
  ['rejected focus module removed from active loader', !stageC.includes("'./ready-focus-tools-v1.js'")],
  ['rejected focus renderer removed from core render', !stageC.includes('ReadyFocusToolsV1?.render?.()')],
  ['canonical identity v2 contract restored', stageC.includes("const IDENTITY='./ready-onboarding-identity-v2.js?v=20260913-deferred';")],
  ['standalone recording module is loaded', stageC.includes("'./ready-recording-v1.js'") && stageC.includes('ReadyRecordingV1?.render?.()')],
  ['session end does not force completed state', runtime.includes("currentTask(c)?.state||'PENDING'")],
  ['Essential YouTube BGM is wired', base.includes("name:'Essential'") && base.includes("videoId:'h2sHEe_xnmU'") && base.includes('PLKRZTF1Q1uwYFbRwQzrySyGXYJVXqcUVu')],
  ['no noisy lofi option remains', !base.includes("name:'로파이'") && !base.includes("videoId:'d9EdCgS1X_c'")],
  ['YouTube BGM uses embedded playback', base.includes('readyYoutubeFrame') && base.includes('youtube.com/embed/') && base.includes('autoplay=1')],
  ['quiet metronome option exists', base.includes("name:'메트로놈'") && base.includes('readyStartMetronome') && base.includes('osc.frequency.value=720')],
  ['nature and water local sounds remain', base.includes('./assets/bgm-nature.wav') && base.includes('./assets/bgm-water.wav')],
  ['sound button is bound', base.includes("$('#focusSoundBtn').onclick=readyCycleSound")],
  ['BGM play is no longer a no-op', base.includes('globalThis.playBgm=()=>readyApplySound({play:true})')],
  ['session start requests BGM playback', base.includes("readyNav('focus');readyApplySound({play:true})")],
  ['session completion stops BGM', base.includes("readyStopSound();readyNav('result')")],
  ['clock hands are live without legacy app.js', base.includes('function readyUpdateClock()') && base.includes('second.style.transform')],
  ['confirmed timer headline preserved', stageD.includes("h1.innerHTML = '그냥!<br>지금 하면 돼!'")],
  ['confirmed timer has full 1-12 clock', stageD.includes('for(let n=1;n<=12;n++)') && stageD.includes("brand.textContent='Ready & Set'")],
  ['confirmed target label preserved', stageD.includes("targetLabel.textContent='목표 시간'")],
  ['confirmed completion label preserved', runtime.includes("end.textContent='완료했어요'")],
  ['confirmed timer keeps dark lower panel', stageD.includes('#focusView .controlPanel{margin-top:auto;background:rgba(24,24,23,.96)')],
  ['recording does not pause or end timer', recording.includes('timerContinuesDuringRecording:true') && !recording.includes('readyPause(') && !recording.includes('completeSession(')],
  ['recording review keeps timer context live', recording.includes('function startContextTicker()') && recording.includes("#recordingView')?.classList.contains('active')")],
  ['recording stops BGM while microphone is active', recording.includes('stopBgm();') && recording.includes('async function startRecording()')],
  ['recording stores original separately', recording.includes("kind:'ORIGINAL'") && recording.includes("DB_NAME='readyset_audio'")],
  ['browser capture DSP enabled', recording.includes('echoCancellation:true') && recording.includes('noiseSuppression:true') && recording.includes('autoGainControl:true')],
  ['zero-cost realtime clean pipeline exists', recording.includes("pipeline:'REALTIME_LOCAL_FILTER_V1'") && recording.includes("cloud:false") && recording.includes("paidApi:false") && recording.includes('createBiquadFilter') && recording.includes('createDynamicsCompressor') && recording.includes('createMediaStreamDestination')],
  ['clean copy stored separately from original', recording.includes("kind:'CLEAN'") && recording.includes('sourceOriginalId') && recording.includes("originalMeaning:'FIRST_ENCODED_BROWSER_CAPTURE'" )],
  ['recording transfer uses realtime-clean recording without clean suffix', recording.includes('const file=transferFile()||currentFile') && recording.includes('transferHasNoCleanSuffix:true')],
  ['recording filename follows dated grammar contract', recording.includes("Judy's grammar recording") && recording.includes('function recordingDate') && recording.includes("padStart(2,'0')")],
  ['M4A is the first-choice capture and transfer format', recording.indexOf("'audio/mp4;codecs=mp4a.40.2'") < recording.indexOf("'audio/webm;codecs=opus'") && recording.includes("info.ext==='m4a'?'M4A/AAC'" )],
  ['original and clean use same selected recording container', recording.includes('originalAndTransferSameContainer:true') && recording.includes("kind:'CLEAN'") && recording.includes("kind:'ORIGINAL'")],
  ['original archive receives original suffix only', recording.includes("original?' original':''")],
  ['transfer filename is editable with fixed real extension', recording.includes('recordFilenameInput') && recording.includes('sanitizeFileBase') && recording.includes('editableTransferFilename:true')],
  ['persistent filename prefix setting exists', recording.includes('recordingFilenameSettings') && recording.includes("localStorage.setItem('ready_recording_prefix'") && recording.includes('persistentFilenamePrefix:true')],
  ['dual-recorder failure falls back without blocking transfer', recording.includes("originalCaptureMode='FALLBACK_TRANSFER'") && recording.includes('originalCaptureFallback:true')],
  ['realtime filter can fall back to browser DSP', recording.includes("realtimeFilterMode='BROWSER_DSP_ONLY'") && recording.includes('function makeRecorder') && recording.includes('realtimeFilterFallback:true')],
  ['recording module has no cloud processing dependency', !recording.includes('fetch(') && !recording.includes('XMLHttpRequest')],
  ['recording auto-preserves original before review action', finishRecording.includes('await storeOriginal(currentOriginalFile);currentStored=true') && finishRecording.indexOf('await storeOriginal(currentOriginalFile);currentStored=true') < finishRecording.indexOf("if($('#reviewPanel'))$('#reviewPanel').hidden=false")],
  ['recording preserves actual file format', recording.includes("if(t.includes('mp4')||t.includes('m4a'))") && recording.includes("if(t.includes('webm'))")],
  ['recording file transfer uses native file share', recording.includes('navigator.canShare?.({files:[file]})') && recording.includes('files:[file]')],
  ['recording file transfer has download fallback', recording.includes('a.download=file.name')],
  ['realtime clean transfer truth is exported', recording.includes('realtimeClean:true') && recording.includes("cleanPipeline:'REALTIME_LOCAL_FILTER_V1'") && recording.includes('transferM4aFirst:true')]
];

for (const [name, ok] of checks) {
  assert.equal(ok, true, name);
  console.log('PASS', name);
}
console.log(`PASS ${checks.length} exploration journey contract checks`);
