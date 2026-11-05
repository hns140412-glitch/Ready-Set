const assert=require('node:assert/strict');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const H=require('../vendor/taky/explorer-crew/handoff-v1.js');

const token=H.pack({
  event_id:'ready-visible-e2e-1',
  relation_event:{type:'MAIN_SELECTED',character_id:'dubi',event_id:'ready-rel-e2e-1',at:'2026-10-09T00:00:00.000Z'}
});
const base='http://127.0.0.1:4215/';

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  await context.addInitScript(({token})=>{
    localStorage.setItem('readyset_identity_v1',JSON.stringify({
      status:'READY',legalName:'Mock',userName:'Mock',nickname:'Mock',
      familyRole:'CHILD',birthDate:'2015-01-01',schoolStage:'E5',
      characterVisualId:'VID-MOCK',explorerId:'explorer-mock',journeyTheme:'DEFAULT'
    }));
    localStorage.setItem('readyset_state',JSON.stringify({
      schemaVersion:5,
      profile:{name:'Mock',photo:'',style:'editorial',shareAvatar:false},
      guide:{type:'lumi',name:'루미',voice:'warm'},
      guestHistory:[],selected:[],tasks:[],targetMin:25,sound:'OFF',
      records:[],activeSession:null
    }));
    sessionStorage.setItem('ready_mock_expected_crew_event',token);
  },{token});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));

  const u=new URL(base);
  u.searchParams.set('role','child');
  u.searchParams.set('crew_event',token);
  await page.goto(u.href,{waitUntil:'load'});

  await page.waitForFunction(()=>{
    try{
      const p=JSON.parse(localStorage.getItem('ready_explorer_crew_authority_projection_v1')||'null');
      const name=document.getElementById('baseExplorerName')?.textContent||'';
      const portrait=document.getElementById('baseExplorerPortrait');
      return p?.status==='BOUND'&&p?.character_id==='dubi'&&
        name==='두비'&&
        portrait?.style?.backgroundImage?.includes('characters/ui_cutouts/dubi.png')&&
        portrait?.dataset?.crewRenderStatus==='STATIC';
    }catch{return false}
  },{timeout:15000});

  const state=await page.evaluate(()=>({
    url:location.href,
    projection:JSON.parse(localStorage.getItem('ready_explorer_crew_authority_projection_v1')||'null'),
    name:document.getElementById('baseExplorerName')?.textContent||'',
    bg:document.getElementById('baseExplorerPortrait')?.style?.backgroundImage||'',
    renderStatus:document.getElementById('baseExplorerPortrait')?.dataset?.crewRenderStatus||'',
    rootVisual:document.documentElement.dataset.readyExplorerCrewVisual||'',
    visibleCount:document.documentElement.dataset.readyExplorerCrewVisibleCount||'',
    inbound:window.ReadyExplorerCrewInboundCrewEvent||''
  }));

  assert.equal(state.projection.character_id,'dubi');
  assert.equal(state.projection.relation_state,'MAIN_COMPANION');
  assert.equal(state.projection.source,'CANONICAL_HANDOFF_EVENT');
  assert.equal(state.name,'두비');
  assert.match(state.bg,/characters\/ui_cutouts\/dubi\.png/);
  assert.equal(state.renderStatus,'STATIC');
  assert.equal(state.rootVisual,'RENDERED');
  assert.ok(Number(state.visibleCount)>=1);
  assert.equal(new URL(state.url).searchParams.has('crew_event'),false);
  assert.equal(state.inbound,token);
  assert.deepEqual(errors,[]);

  console.log(JSON.stringify({
    pass:true,target:'ACTUAL_READY_WEBAPP_REPO',
    visible:{name:state.name,background:state.bg,render:state.renderStatus,count:Number(state.visibleCount)},
    relation:{character_id:state.projection.character_id,state:state.projection.relation_state,source:state.projection.source},
    inbound_preserved:true,url_cleaned:true,page_errors:errors
  },null,2));
  await context.close();
  await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
