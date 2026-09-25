'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
assert(html.includes('badge-source-evidence.js'),'badge source evidence contract must be loaded');
const contract=fs.readFileSync('vendor/taky/badge-source-evidence.js','utf8');
assert(contract.includes('TAKY_CHILD_SELF_CORRECTION_V1'));
assert(contract.includes('TAKY_CHILD_REFLECTION_ARTIFACT_V1'));
assert(contract.includes('TAKY_DECLARED_SPECIAL_ACTION_V1'));

for(const file of ["app.js","ready-runtime-v07.js"]){
  const src=fs.readFileSync(file,'utf8');
  assert(!src.includes('.selfCorrection('), file+' must not auto-produce self-correction badge evidence');
  assert(!src.includes('.reflectionArtifact('), file+' must not auto-produce reflection badge evidence');
  assert(!src.includes('.declaredSpecialAction('), file+' must not auto-produce special badge evidence');
}
console.log('BADGE_SOURCE_EVIDENCE_BOUNDARY_PASS');
