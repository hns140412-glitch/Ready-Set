const assert=require('node:assert/strict');
const api=require('../src/share/share-golden-truth-runtime.js');
const input={kind:'pre',profile:{theme:'sail',shareAvatar:false},legacyShare:{theme:'drop'},
  guide:{name:'루미',type:'lumi'},currentTasks:['영어 단어','연산'],
  targetMs:1500000,now:new Date('2026-09-28T10:00:00Z')};
let r=api.project(input);
assert(r.ok&&r.theme==='sail'&&r.total===2);
assert.equal(r.stars,null);assert.equal(r.focusMs,null);
assert.equal(r.avatar.shared,false);assert.equal(r.avatar.asset,null);
assert.equal(api.project({...input,currentTasks:[]}).reason,'PRE_SHARE_TASK_CONTEXT_MISSING');
assert.equal(api.project({...input,targetMs:undefined}).reason,'PRE_SHARE_TARGET_MISSING');
const result={
  endAt:Date.parse('2026-09-28T11:00:00Z'),
  taskOutcomes:[{task_id:'a',label:'영어 단어',state:'COMPLETED'},{task_id:'b',label:'연산',state:'PARTIAL'}],
  outcomeState:'MIXED',focusMs:600000,targetMs:900000,deltaMs:-300000,
  selected:['영어 단어','연산'],recordingDone:false
};
r=api.project({...input,kind:'result',record:result});
assert(r.ok&&r.doneCount===1&&r.total===2&&r.status==='MIXED');
assert.equal(r.stars,null,'never fabricate stars from task count');
assert(!r.copy.title.includes('완료했어요'),'partial outcome cannot be a total completion title');
assert.equal(api.project({...input,kind:'result',record:{...result,outcomeState:'COMPLETED'}}).reason,'RESULT_STATE_CONFLICT');
assert.equal(api.project({...input,kind:'result',record:{...result,taskOutcomes:[]}}).reason,'VERIFIED_PER_TASK_OUTCOMES_MISSING');
assert.equal(api.project({...input,kind:'result',record:{...result,taskOutcomes:[result.taskOutcomes[0],result.taskOutcomes[0]]}}).reason,'SHARE_TASK_IDENTITY_CONFLICT');
r=api.project({...input,kind:'result',record:{...result,awardReceipt:{verified:true,awarded_stars:12}}});
assert.equal(r.stars,12);
r=api.project({...input,kind:'result',record:{...result,awardReceipt:{verified:false,awarded_stars:20}}});
assert.equal(r.stars,null);
const avatar={contract_version:'CHARACTER_VISUAL_ID_PROJECTION_V02',visual_id:'example',member_scope:'other',
  assets:{avatar_square:'https://example.test/approved.png'}};
r=api.project({...input,profile:{...input.profile,shareAvatar:true,photo:'raw child photo',member_scope:'mine',
  characterVisualIdProjection:avatar},projectionApi:{assertConsumable:()=>({ok:true})}});
assert.equal(r.avatar.shared,false);
assert.equal(r.avatar.reason,'MEMBER_SCOPE_MISMATCH');
r=api.project({...input,profile:{...input.profile,shareAvatar:true,member_scope:'mine',
  characterVisualIdProjection:{...avatar,member_scope:'mine'}},projectionApi:{assertConsumable:()=>({ok:true})}});
assert.equal(r.avatar.shared,true);assert.equal(r.avatar.asset,'https://example.test/approved.png');
assert(!JSON.stringify(r).includes('raw child photo'));
console.log('SHARE_GOLDEN_TRUTH PASS: pre/result, per-task, award provenance, theme/profile, avatar scope');
