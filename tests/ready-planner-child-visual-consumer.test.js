'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root={};
vm.runInNewContext(fs.readFileSync('src/identity/ready-planner-child-visual-consumer.js','utf8'),{globalThis:root,console});
const slots=new Map();
function elt(k){if(!slots.has(k)){const attrs={};slots.set(k,{hidden:true,src:'',dataset:{},
  removeAttribute(k){delete attrs[k];if(k==='src')this.src='';if(k==='data-visual-id')delete this.dataset.visualId;}});}return slots.get(k);}
let projection=null,accepted={ok:false,reason:'CHARACTER_VISUAL_ID_PROJECTION_MISSING'},rawSrc=false,broken=false;
const contract={
  fromMaster:()=>projection,
  assertConsumable:()=>accepted
};
const c=root.ReadyPlannerChildVisualConsumer.create({
  query:elt,getState:()=>({profile:{}}),contract,
  imageFactory:()=>({set src(x){if(broken)this.onerror?.();else this.onload?.();}})
});
(async()=>{
  let value=await c.render();
  assert.equal(value.reason,'CHARACTER_VISUAL_ID_PROJECTION_MISSING');
  assert.equal(elt('#plannerChildVisualSlot').hidden,true);
  assert.equal(elt('#plannerChildVisual').hidden,true);
  projection={visual_id:'visual_user_locked',assets:{full_character:'/api/character/asset/locked_full'},
    source_provenance:{raw_source_exposed:false},member_scope:'member_a'};
  accepted={ok:true};
  value=await c.render();
  assert.equal(value.ok,true);
  assert.equal(value.visual_id,'visual_user_locked');
  assert.equal(elt('#plannerChildVisual').src,'/api/character/asset/locked_full');
  assert.equal(elt('#plannerChildVisualSlot').hidden,false);
  projection.assets.full_character='javascript:alert(1)';
  value=await c.render();
  assert.equal(value.reason,'CHILD_FULL_CHARACTER_ASSET_REFERENCE_INVALID');
  assert.equal(elt('#plannerChildVisualSlot').hidden,true);
  projection.assets.full_character='/api/character/asset/locked_full';
  projection.source_provenance.raw_source_exposed=true;
  value=await c.render();
  assert.equal(value.reason,'RAW_CHILD_SOURCE_PRIVACY_INVALID');
  projection.source_provenance.raw_source_exposed=false;
  accepted={ok:false,reason:'CHARACTER_VISUAL_ID_ASSURANCE_NOT_PASS'};
  value=await c.render();
  assert.equal(value.reason,'CHARACTER_VISUAL_ID_ASSURANCE_NOT_PASS');
  accepted={ok:true};broken=true;
  value=await c.render();
  assert.equal(value.reason,'CHILD_VISUAL_ASSET_LOAD_FAILED');
  assert.equal(elt('#plannerChildVisualSlot').hidden,true);
  console.log('PASS: missing child not faked; only verified locked full-character projection loads; unsafe URL/raw child photo/rejected assurance/broken asset all fail closed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
