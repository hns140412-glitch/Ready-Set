// Independent read-only contract of the *actual* app boot script graph.
// This does not rename or modify source code to satisfy the obsolete v2 assertion.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/g)].map(x=>x[1].split('?')[0].replace(/^\.\//,''));
assert.ok(scripts.length>20,'real entrypoint must enumerate runtime scripts');
for(const source of scripts){
 assert.ok(fs.existsSync(path.join(root,source)),'loaded script must exist: '+source);
}
const identityNames=scripts.filter(s=>/^ready-onboarding-identity-v\d+\.js$/.test(s));
assert.equal(identityNames.length,1,'boot must bind one identity authority, never both');
const identity=fs.readFileSync(path.join(root,identityNames[0]),'utf8');
const scenes=scripts.find(x=>x==='ready-first-journey-scenes-v1.js');
assert.ok(scenes,'first-journey scene must be loaded in actual boot');
const scene=fs.readFileSync(path.join(root,scenes),'utf8');
const explorer=scripts.find(x=>x.endsWith('/ready-explorer-intro-canonical-v1.js'));
assert.ok(explorer,'Core6 encounter must be loaded in actual boot');
const crew=fs.readFileSync(path.join(root,explorer),'utf8');
const assertRoute=(id,s)=>assert.match(s,/onboardingStep:'TEAM_NAME'/,'mode must enter name scene first');
const assertNext=(s)=>assert.ok(s.includes("teamName:input.value.trim(),onboardingStep:'EXPLORER'"),'TEAM_NAME must lead to Core6 encounter');
assertRoute(identityNames[0],identity);
assertNext(scene);
assert.match(crew,/introSeenCrewIds/,'Core6 must track actual introductions');
assert.match(crew,/onboardingStep:root\.ReadyFirstJourneyScenesV1\?'MAIN_INTRO_CHOICE'/,'Core6 must enter companion preference');
assert.match(scene,/selectedId=null/,'companion preference starts unselected');
assert.match(scene,/!record\.legalName\|\|!record\.birthDate\|\|!record\.schoolStage/,'profile must follow companion preference when missing');
assert.match(scene,/if\(!final\.packedItems\?\.length/,'departure requires actual chosen gear');
assert.match(scene,/ReadyIdentityV1\.complete\(/,'world arrival completion requires identity owner');
const corrupted=identity.replaceAll("onboardingStep:'TEAM_NAME'","onboardingStep:'PROFILE'");
assert.throws(()=>assertRoute('negative',corrupted),/mode must enter name scene first/,'negative control must detect reordered journey');
const removed=scene.replace("teamName:input.value.trim(),onboardingStep:'EXPLORER'","teamName:input.value.trim(),onboardingStep:'PROFILE'");
assert.throws(()=>assertNext(removed),/TEAM_NAME must lead/,'negative control must detect skipped meeting');
console.log(JSON.stringify({state:'PASS',contract:'READY_ACTIVE_ENTRYPOINT_FIRST_JOURNEY_V1',static_scoped:true,boot_identity_file:identityNames[0],script_count:scripts.length,negative_controls_caught:2,obsolete_v2_contract_superseded_not_deleted:true}));
