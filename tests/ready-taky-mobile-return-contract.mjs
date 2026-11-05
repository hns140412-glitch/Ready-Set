import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync(new URL('../ready-runtime-v07.js',import.meta.url),'utf8');
for(const marker of [
  "MOBILE_RETURN_KEYS=['taky_mobile_return_target','taky_mobile_work_id','taky_mobile_nonce']",
  'function mobileReturnContext()',
  'function buildMobileReturnUrl(c)',
  "url.searchParams.set('from_app','ready-set')",
  "url.searchParams.set('task_state',aggregateMobileSessionState(c))",
  "btn.id='readyTakyMobileReturn'",
  "btn.textContent='TAKY Mobile로 돌아가기'",
  'const mobileReturnUrl=buildMobileReturnUrl(c)',
  'if(mobileReturnUrl)setTimeout(()=>mountMobileReturnButton(mobileReturnUrl),0)',
]){
  assert.ok(runtime.includes(marker),'missing '+marker);
}
assert.ok(runtime.includes("MOBILE_RETURN_KEYS.forEach(k=>{const v=params.get(k);if(v)url.searchParams.set(k,v)})"),'mobile correlation is not preserved through specialist return');
console.log(JSON.stringify({pass:true,contract:'READY_TAKY_MOBILE_RETURN_V1',preservesSpecialistRoundtrip:true,explicitReturnButton:true},null,2));
