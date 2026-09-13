import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('ready-stage-c.js','utf8');
const identity=fs.readFileSync('ready-onboarding-identity-v2.js','utf8');
const completion=fs.readFileSync('ready-onboarding-flow-completion-v1.js','utf8');
const role=fs.readFileSync('ready-role-context-v1.js','utf8');
const hub=fs.readFileSync('ready-parent-setup-hub-v1.js','utf8');
const capture=fs.readFileSync('ready-parent-capture-intake-v1.js','utf8');
const analysis=fs.readFileSync('ready-homework-analysis-bridge-v1.js','utf8');
const planner=fs.readFileSync('ready-stage-g14-planner-authority.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const version=JSON.parse(fs.readFileSync('VERSION.json','utf8'));

assert.match(loader,/const IDENTITY='\.\/ready-onboarding-identity-v2\.js\?v=20260913-deferred'/,'Stage-C must load identity v2');
assert.doesNotMatch(loader,/const IDENTITY='\.\/ready-onboarding-identity-v1\.js/,'runtime must not keep v1 as active identity owner');
assert.match(sw,/ready-onboarding-identity-v2\.js/,'PWA cache must contain active identity v2');
assert.doesNotMatch(sw,/ready-onboarding-identity-v1\.js/,'PWA core must not pin obsolete identity v1');
assert.equal(version.appVersion,'0.9.4-rc19');
assert.match(version.cacheVersion,/first-journey-parent-setup-v2/);

assert.match(identity,/characterSetupState:'NOT_STARTED'/,'identity must have explicit character setup state');
assert.match(identity,/return !!i\.characterVisualId\|\|i\.characterSetupState==='DEFERRED_NO_COST'/,'defer may satisfy bounded onboarding readiness');
assert.match(identity,/characterVisualId:null/,'blank identity must not fabricate a visual id');
assert.match(identity,/if\(p\.characterVisualId&&p\.characterVisualId!==a\.characterVisualId\)/,'character timeline promotion requires a real visual id');

assert.match(completion,/characterSetupState:'DEFERRED_NO_COST'/,'first run must expose an explicit no-cost defer path');
assert.doesNotMatch(completion,/characterVisualId\s*:\s*['"`]DEFER/,'defer must never use a fake characterVisualId');
assert.match(completion,/onboardingStep:'EXPLORER'/,'defer must continue to Explorer');
assert.match(completion,/onboardingStep:'THEME'/,'Explorer must continue to first world/theme');
assert.match(completion,/activateIdentityRole\?\.\(\{reload:true\}\)/,'completion must activate the persisted identity role');

assert.match(role,/setupMode==='GUARDIAN_FOR_CHILD'\?'parent':'child'/,'guardian setup must resolve to parent runtime');
assert.match(role,/readyset_active_role_v1/,'active parent/child role must persist');
assert.match(hub,/시간표 확인 · 수정/,'parent setup hub must expose timetable first-class action');
assert.match(hub,/숙제 촬영 · 입력/,'parent setup hub must expose homework first-class action');
assert.match(hub,/표시되지 않은 시간은 자유시간으로 추론하지 않아요/,'schedule editor must preserve no-free-time-inference');
assert.match(hub,/ReadyStageG14\?\.reconcile/,'schedule changes must reconcile Planner authority');

assert.match(capture,/PENDING_ANALYSIS/,'captured homework must remain pending until analysis/confirmation');
assert.match(analysis,/ANALYZED_PENDING_PARENT_CONFIRMATION/,'AI extraction must remain candidate-only');
assert.doesNotMatch(analysis,/FACT_CONFIRMED/,'AI analysis bridge must not self-confirm facts');
assert.match(planner,/FACT_CONFIRMED/,'Planner authority must require confirmed assignment facts somewhere in the allocation path');

console.log(JSON.stringify({pass:true,contract:'ready-first-run-parent-activation-v2',checks:25}));
