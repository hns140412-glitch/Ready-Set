import fs from 'node:fs';
import assert from 'node:assert/strict';

const fn=fs.readFileSync('netlify/functions/homework-analysis.mjs','utf8');
const bridge=fs.readFileSync('ready-homework-analysis-bridge-v1.js','utf8');
const loader=fs.readFileSync('ready-stage-c.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const version=JSON.parse(fs.readFileSync('VERSION.json','utf8'));

assert.match(loader,/ready-homework-analysis-bridge-v1\.js/);
assert.match(sw,/ready-homework-analysis-bridge-v1\.js/);
assert.equal(version.appVersion,'0.9.4-rc17');
assert.match(version.releaseStatus,/HOMEWORK_ANALYSIS_V1/);

assert.match(fn,/READY_HOMEWORK_ANALYSIS_ENABLED/,'analysis must be admin-gated');
assert.match(fn,/process\.env\.OPENAI_API_KEY/,'provider key must remain server-side');
assert.match(fn,/https:\/\/api\.openai\.com\/v1\/responses/,'analysis must use the Responses API');
assert.match(fn,/store:false/,'homework response storage must be disabled');
assert.match(fn,/type:'json_schema'/,'analysis output must be structured');
assert.match(fn,/COST_CONFIRMATION_REQUIRED/,'analysis request requires explicit action confirmation');
assert.match(fn,/The result is an extraction candidate awaiting parent confirmation/,'AI extraction must not self-confirm assignment facts');
assert.match(fn,/If unknown, use null/,'analysis must preserve unknowns');

assert.match(bridge,/fetch\('\/api\/homework-analysis'/,'client must call the homework analysis endpoint');
assert.match(bridge,/confirmCost:true/,'Save-and-analyze is the explicit analysis trigger');
assert.match(bridge,/ANALYZED_PENDING_PARENT_CONFIRMATION/,'analysis must remain pending parent confirmation');
assert.match(bridge,/needsRecapture/,'bridge must surface recapture requirements');
assert.match(bridge,/부모 확인 후 FACT로 확정/,'parent confirmation must be visible');
assert.doesNotMatch(bridge,/upsertTalentPackage|FACT_CONFIRMED/,'bridge must not directly promote AI extraction to confirmed FACT');

console.log(JSON.stringify({pass:true,contract:'ready-homework-analysis-v1',checks:18}));
