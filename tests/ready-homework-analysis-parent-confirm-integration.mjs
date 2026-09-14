import fs from 'node:fs';
import assert from 'node:assert/strict';

const bridge=fs.readFileSync('ready-homework-analysis-bridge-v1.js','utf8');
const parent=fs.readFileSync('ready-stage-f.js','utf8');
const assignment=fs.readFileSync('ready-stage-e.js','utf8');
const foundation=fs.readFileSync('ready-foundation-control-v1.js','utf8');

// AI extraction may populate only reviewable candidate fields.
for(const marker of [
  "row.querySelector('[data-range]')",
  "row.querySelector('[data-instruction]')",
  "row.querySelector('[data-answer]')",
  "row.dataset.analysisCandidate='1'",
  "ANALYZED_PENDING_PARENT_CONFIRMATION",
  "부모 확인 후 FACT로 확정"
]) assert.ok(bridge.includes(marker),`analysis bridge missing candidate marker: ${marker}`);

assert.ok(!bridge.includes("upsertTalentPackage({actor:'PARENT'"),'analysis bridge must not impersonate parent confirmation');
assert.ok(!bridge.includes("confirmationState='FACT_CONFIRMED'"),'analysis bridge must not self-confirm FACT');

// Parent review surface reads the same fields and is the only UI action that promotes them.
for(const marker of [
  'id="rsfTalentFactSave"',
  "row.querySelector('[data-range]').value.trim()",
  "row.querySelector('[data-instruction]').value.trim()",
  "row.querySelector('[data-answer]').value.trim()",
  "model().upsertTalentPackage({actor:'PARENT',books})"
]) assert.ok(parent.includes(marker),`parent confirmation surface missing: ${marker}`);

// Model authority: only parent actor confirms the fact.
assert.ok(assignment.includes("appendClaim(fact,actor"),'assignment model must append provenance claims');
assert.ok(assignment.includes("{confirm:actor==='PARENT'}"),'assignment model must reserve confirmation for parent actor');
assert.ok(assignment.includes("if(confirm)fact.confirmationState='FACT_CONFIRMED'"),'confirmed claim must explicitly promote FACT');

// Confirmed facts are the only facts admitted to Foundation Planner.
assert.ok(foundation.includes("confirmationState==='FACT_CONFIRMED'"),'Foundation bridge must filter to confirmed facts');
assert.ok(foundation.includes("service.prepareConfirmedFacts"),'Foundation bridge must prepare Planner only from confirmed facts');

console.log(JSON.stringify({pass:true,contract:'ready-homework-analysis-parent-confirm-integration-v1',analysisCandidateOnly:true,parentAuthorityLocked:true,confirmedFactsOnlyToPlanner:true}));
