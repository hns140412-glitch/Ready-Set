const assert=require('node:assert/strict');
const b=require('../ready-character-dom-binder-v1.js');
const plan={ok:true,dom_mutation_allowed:false,assignments:[
 {slot_id:'s1',selector:'#slot',character_id:'A',visual_id:'VID-A'}
]};
const asset={s1:{approval_status:'APPROVED',visual_id:'VID-A',sha256:'a'.repeat(64),url:'assets/a.png',asset_pointer:'TAKY-ASSETS:A'}};
const gate={pass:true,receipt_sha256:'b'.repeat(64)};
assert.equal(b.prepare(plan,asset,{}).ok,false);
assert.equal(b.prepare(plan,{},gate).ok,false);
const prepared=b.prepare(plan,asset,gate);
assert.equal(prepared.ok,true);
let queryCount=0;
const element={tagName:'IMG',src:'old.png',dataset:{},style:{}};
const fakeDoc={querySelector(sel){queryCount++;return sel==='#slot'?element:null;}};
const out=b.apply(fakeDoc,prepared);
assert.equal(out.ok,true);assert.equal(out.mutated,1);
assert.equal(element.src,'assets/a.png');
assert.equal(element.dataset.characterId,'A');
assert.equal(b.automaticActivation,false);
assert.equal(b.generatesArt,false);
assert.equal(b.acceptsUnapprovedAsset,false);
console.log(JSON.stringify({gate:'CHARACTER_DOM_BINDER',pass:true},null,2));
