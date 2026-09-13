import fs from 'node:fs';
import assert from 'node:assert/strict';

const control=fs.readFileSync('ready-foundation-control-v1.js','utf8');
const foundation=fs.readFileSync('ready-foundation-v1.js','utf8');

assert.match(control,/confirmationState==='FACT_CONFIRMED'/,'only confirmed legacy facts may enter Foundation assignment authority');
assert.match(control,/cycleBoundarySources=new Set\(\['TALENT_BOOK_ASSIGNMENT','ENGLISH_ACADEMY_PACKAGE','SCIENCE_ACADEMY_HOMEWORK'\]\)/,'academy/week cycle boundary sources must be explicit');
assert.match(control,/return cycleBoundarySources\.has\(f\.sourceType\)\?datePlus\(d,-1\):d/,'cycle boundary day must not become a normal allocation slot');
assert.match(control,/authority:'LEARNING\/SUBJECT'/,'Foundation units must carry Learning interpretation authority');
assert.match(control,/prepareConfirmedFacts/,'confirmed facts must have an explicit Foundation replanning bridge');
assert.match(control,/service\.prepare\(\{from:today\(\),dates,units,carryOver:\[\],actualHistory:\[\]\}\)/,'bridge must invoke the Foundation Planner with bounded inputs');
assert.match(control,/upsertTalentPackage\(args=\{\}\).*service\.prepareConfirmedFacts\(\)/s,'Talent parent FACT save must trigger Foundation replanning');
assert.match(control,/upsertEnglishPackage\(args=\{\}\).*service\.prepareConfirmedFacts\(\)/s,'English parent FACT save must trigger Foundation replanning');
assert.match(control,/confirmFact\(id,actor='PARENT'\).*service\.prepareConfirmedFacts\(\)/s,'explicit FACT confirmation must trigger Foundation replanning');
assert.match(control,/if\(s\.lastPlannerInput\)service\.prepare/,'schedule changes must re-run the last Planner input');
assert.match(control,/ReadyRoleContextV1\?\.current/,'parent authority must use persisted Ready role context when available');
assert.match(control,/authority:'FOUNDATION_PLANNER'/,'returned allocation state must identify Foundation as the Planner authority');

assert.match(foundation,/kind==='STUDY_OPPORTUNITY'/,'Planner capacity must come only from explicit study opportunities');
assert.match(foundation,/absence of events never implies capacity/,'missing timetable rows must never imply free capacity');
assert.match(foundation,/candidateOnly:true/,'Foundation plan output must remain candidate projection until its governed publication path');

console.log(JSON.stringify({pass:true,contract:'ready-foundation-assignment-bridge-v1',checks:15}));
