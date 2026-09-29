'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/views/share-card-runtime.js','utf8');
let pre={tasks:[],targetMs:1500000},result=null,drawn=[],shares=[],messages=[];
const ctx={
  createLinearGradient(){return {addColorStop(){}}},beginPath(){},ellipse(){},fill(){},fillRect(){},
  stroke(){},moveTo(){},lineTo(){},closePath(){},arc(){},rect(){},
  fillText(text){drawn.push(String(text));}
};
const canvas={width:0,height:0,getContext(){return ctx},toBlob(done){done({kind:'png'});}};
const root={};
const navigator={canShare:()=>true,share:async payload=>shares.push(payload)};
const document={createElement:tag=>{assert.equal(tag,'canvas');return canvas;}};
const File=function(parts,name,attrs){this.parts=parts;this.name=name;this.type=attrs.type};
vm.runInNewContext(source,{globalThis:root,document,navigator,File,Date,Promise,Math,console});
const card=root.ReadyRebuildShareCard.create({
  getPreShareContext:()=>pre,
  resultSource:()=>result,
  resultOutcomeProfile:r=>({label:r.outcomeState==='PARTIAL'?'일부 남음':'완료',done:r.outcomeState!=='PARTIAL',
    shareTitle:'탐험 기록',historyLabel:'기록',shareText:'실제 결과 기록'}),
  shareTheme:()=> 'drop',
  formatTime:ms=>[String(Math.floor(ms/60000)).padStart(2,'0'),String(Math.floor(ms/1000)%60).padStart(2,'0')].join(':'),
  roundRect(c){c.beginPath();c.rect(0,0,10,10)},
  drawAvatar:async()=>{},
  toast:message=>messages.push(message)
});
(async()=>{
  const missing=await card.share('pre');
  assert.equal(missing.reason,'PRE_SHARE_GOAL_NOT_READY');
  assert.equal(shares.length,0,'empty goal must not invoke native share');
  pre={tasks:['실제로 선택한 과학 탐험'],targetMs:1500000};
  drawn=[];
  await card.render('pre');
  assert.ok(drawn.includes('25:00'),'real goal target shown');
  assert.ok(drawn.some(x=>x.includes('실제로 선택한 과학 탐험')));
  assert.ok(!drawn.some(x=>/획득 별|\+0|학습하지 않은 숙제/.test(x)),'no derived/fake reward or unselected tasks');
  await card.share('pre');
  assert.equal(shares.length,1);
  assert.match(shares[0].text,/실제로 선택한 과학 탐험.*25:00/);
  assert.equal(shares[0].files.length,1);
  const missingResult=await card.share('result');
  assert.equal(missingResult.reason,'RESULT_NOT_RECORDED');
  assert.equal(shares.length,1,'no result must not share fake success');
  result={selected:['과학 탐험'],tasks:[],targetMs:1500000,focusMs:1200000,outcomeState:'PARTIAL'};
  drawn=[];
  await card.render('result');
  assert.ok(drawn.includes('25:00')&&drawn.includes('20:00'));
  assert.ok(drawn.includes('일부 남음'),'actual outcome shown');
  assert.ok(!drawn.some(x=>/획득 별|\+5|\+0/.test(x)));
  await card.share('result');
  assert.equal(shares.length,2);
  assert.equal(shares[1].text,'실제 결과 기록');
  assert.ok(messages.some(x=>x.includes('목표')));
  console.log('PASS selected-only PRE, exact goal time, optional native sheet, recorded-only POST, no invented star/outcome values');
})().catch(error=>{console.error(error);process.exitCode=1;});
