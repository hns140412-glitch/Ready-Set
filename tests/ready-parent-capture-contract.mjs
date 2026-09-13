import fs from 'node:fs';
import assert from 'node:assert/strict';

const capture=fs.readFileSync('ready-parent-capture-intake-v1.js','utf8');
const loader=fs.readFileSync('ready-stage-c.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const version=JSON.parse(fs.readFileSync('VERSION.json','utf8'));

assert.match(loader,/ready-parent-capture-intake-v1\.js/,'capture module must load from Ready staging loader');
assert.match(sw,/ready-parent-capture-intake-v1\.js/,'capture module must be in PWA core cache');
assert.match(version.appVersion,/^0\.9\.4-rc\d+$/,'staging version must remain in Ready 0.9.4 RC line');
assert.match(version.schemaVersion,/capture-intake-v1/);

assert.match(capture,/indexedDB\.open\(DB_NAME,1\)/,'source photos must use IndexedDB rather than localStorage');
assert.match(capture,/navigator\.mediaDevices\.getUserMedia/,'camera flow must use getUserMedia when available');
assert.match(capture,/facingMode:\{ideal:'environment'\}/,'camera should prefer rear camera');
assert.match(capture,/capture=\"environment\"/,'file input fallback must request environment capture');

for(const subject of ['연산','한자','국어','사회','수학','생각하는 피자']) assert.ok(capture.includes(subject),`missing Talent book subject: ${subject}`);
for(const kind of ['COVER','RANGE','INSTRUCTION','ANSWER_REFERENCE']) assert.ok(capture.includes(kind),`missing capture kind: ${kind}`);

assert.match(capture,/visibility:state\.kind==='ANSWER_REFERENCE'\?'PARENT_ONLY':'PARENT_SOURCE'/,'answer/reference source must be parent-only');
assert.match(capture,/analysisState:'PENDING'/,'new captures must not pretend analysis completed');
assert.match(capture,/updateAnalysisState\('PENDING_ANALYSIS'\)/,'save-and-analyze must queue pending analysis');
assert.match(capture,/부모가 확인하기 전에는 숙제 FACT로 확정되지 않습니다/,'UI must disclose parent-confirmation boundary');
assert.doesNotMatch(capture,/document\.getElementById\('rsfTalentFactSave'\)\?\.click\(\)/,'capture queue must not auto-confirm FACT before analysis and parent review');

assert.match(capture,/packageType:'TALENT_WEEKLY_ASSIGNMENT'/,'capture records must preserve weekly package semantics');
assert.match(capture,/ReadyRoleContextV1/,'capture role must honor identity-aware role context');

console.log(JSON.stringify({pass:true,contract:'ready-parent-capture-v1.1',checks:19}));
