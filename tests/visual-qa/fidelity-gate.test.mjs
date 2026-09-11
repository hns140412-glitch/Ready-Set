import assert from 'node:assert/strict';
import {evaluate,template,criteria,states,widths,outputRoles} from './fidelity-gate.mjs';
const empty=evaluate(template());
assert.equal(empty.status,'BLOCKED');
assert.deepEqual(Object.keys(empty.gates),Object.keys(criteria));
assert.ok(Object.values(empty.gates).every(g=>g.status==='BLOCKED'));
// Boot markers, an asset URL, and provider quality labels are not visual evidence.
const markers={...template(),visualQaReady:true,quality:'high',assetRef:'image.webp',status:'PASS'};
assert.equal(evaluate(markers).status,'BLOCKED');
const forged=template();
for(const review of Object.values(forged.reviews)) {
  review.reviewer='test'; review.reviewedAt='2026-09-11T00:00:00Z';
  for(const item of Object.values(review.criteria)) Object.assign(item,{verdict:'PASS',observation:'Looks good',evidenceIds:['missing']});
}
assert.ok(Object.values(evaluate(forged).gates).every(g=>g.status==='BLOCKED'));
for(const [gate,keys] of Object.entries(criteria)) {
  const e=template(); e.reviews[gate].criteria[keys[0]].verdict='FAIL';
  assert.equal(evaluate(e).gates[gate].status,'FAIL');
  assert.equal(evaluate(e).status,'FAIL');
}
for(const file of ['../photo.png','.env','https://example.com/a.png','C:/photo.png']) {
  const e=template();e.references=[{id:'bad',file}];
  assert.ok(evaluate(e).gates.REFERENCE_COVERAGE.reasons.some(x=>x.includes('Invalid')));
}
assert.equal(states.length*widths.length,18);
assert.equal(outputRoles.length,9);
console.log('PASS: seven fail-closed gates, marker/forged-evidence rejection, explicit failures, unsafe paths, required coverage');
