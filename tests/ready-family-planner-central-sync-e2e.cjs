'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const Endpoint=require('../../TAKY/LEARNING/transport/family-user-data-http-endpoint.js');
const {LocalJsonStrongStore}=require('../../TAKY/LEARNING/transport/local-json-strong-store.js');
const appCode=fs.readFileSync(path.join(__dirname,'../ready-family-planner-sync-v1.js'),'utf8');
function device(endpoint,member='A',initialPlanner=null){
 const map=new Map(initialPlanner?[['readyset_planner_v1',JSON.stringify(initialPlanner)]]:[]);
 const localStorage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const listeners=new Map();
 const addEventListener=(name,fn)=>{const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a)};
 const dispatchEvent=e=>{for(const f of listeners.get(e.type)||[])f(e);return true};
 const nodes=new Map();
 const makeNode=()=>({style:{},hidden:false,children:[],setAttribute(){},appendChild(x){this.children.push(x)},remove(){},textContent:''});
 const document={readyState:'loading',visibilityState:'visible',documentElement:{dataset:{}},body:{appendChild(n){nodes.set(n.id,n)}},
   addEventListener,createElement:()=>makeNode(),getElementById:id=>nodes.get(id)||null};
 let currentMember=member;
 const network={offline:false,dropNextWriteReply:false};
 const fetchImpl=async(url,opt={})=>{
  if(network.offline)throw Error('NETWORK_OFFLINE');
  const u=new URL(url);
  const o=await endpoint.handle({path:u.pathname,method:opt.method,headers:opt.headers||{},
     query:Object.fromEntries(u.searchParams.entries()),body:opt.body});
  if(opt.method==='POST'&&network.dropNextWriteReply){
    network.dropNextWriteReply=false;
    throw Error('NETWORK_RESPONSE_DROPPED_AFTER_COMMIT');
  }
  return {ok:o.status>=200&&o.status<300,status:o.status,json:async()=>JSON.parse(o.body)};
 };
 const session={family_id:'F1',self_member_id:'PARENT',authorized_member_ids:['A','B']};
 const runtime={apiBaseUrl:'https://central.test',getToken:async()=> 'validated-bearer-token-001',currentSession:async()=>session,fetchImpl};
 const window={addEventListener,dispatchEvent,TAKY_FAMILY_RUNTIME:runtime,
   ReadyIdentityV1:{get:()=>({memberId:currentMember})},
   ReadyFamilyRuntimeBootstrapV1:{resolveMemberBinding:(identity,sess)=>sess.authorized_member_ids.includes(identity.memberId)?{ok:true,member_id:identity.memberId}:{ok:false}},
   ReadyStageD:{renderPlanner(){}},ReadyStageF:{render(){}},ReadyHomeHomeworkUIV1:{render(){}}};
 const sandbox={window,document,localStorage,URL,URLSearchParams,location:{href:'https://ready.test'},console,
   crypto:webcrypto,TextEncoder,Date,Math,JSON,Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
   setTimeout:()=>0,clearTimeout:()=>{},fetch:fetchImpl};
 sandbox.globalThis=sandbox; vm.createContext(sandbox);vm.runInContext(appCode,sandbox);
 return {api:window.ReadyFamilyPlannerSyncV1,storage:localStorage,map,window,network,setMember:x=>{currentMember=x},snapshot:()=>JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}')};
}
(async()=>{
 const tmp=await fs.promises.mkdtemp(path.join(os.tmpdir(),'taky-ready-cross-device-'));
 try{
  const store=await new LocalJsonStrongStore(tmp).init();
  const principal={authenticated:true,principal_id:'PARENT',identity_provider:'TEST',
   families:[{family_id:'F1',self_member_id:'PARENT',authorized_member_ids:['A','B']}]};
  const endpoint=Endpoint.create({store,verifyBearerToken:async()=>principal});
  const a=device(endpoint,'A');
  assert.equal((await a.api.sync()).state,'SYNC_READY');
  a.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'과학 실험 숙제',confirmationState:'FACT_CONFIRMED'}},days:{'2026-10-14':{tasks:[{id:'T1',status:'PLANNED'}]}}}));
  a.storage.setItem('ready_foundation_v1',JSON.stringify({profiles:[{id:'family-calendar',revision:1}]}));
  assert.equal((await a.api.sync()).state,'SERVER_ACKNOWLEDGED');
  const b=device(endpoint,'A');
  assert.equal((await b.api.sync()).state,'SERVER_RESTORED');
  assert.equal(b.snapshot().assignmentFacts['HW-1'].title,'과학 실험 숙제');
  assert.equal(JSON.parse(b.storage.getItem('ready_foundation_v1')).profiles[0].revision,1);
  const seeded=device(endpoint,'A',{version:1,days:{'2026-10-14':{tasks:[]}},talentWeek:{}});
  assert.equal((await seeded.api.sync()).state,'SERVER_RESTORED','empty boot scaffolding cannot block central restore');
  assert.equal(seeded.snapshot().assignmentFacts['HW-1'].title,'과학 실험 숙제');
  // A is still on its original etag; B writes first, A must NOT overwrite.
  b.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'기기 B 숙제 수정'}},days:{}}));
  assert.equal((await b.api.sync()).state,'SERVER_ACKNOWLEDGED');
  a.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'기기 A 분기 수정'}},days:{}}));
  assert.equal((await a.api.sync()).state,'CONFLICT_REVIEW_REQUIRED');
  assert.equal(a.snapshot().assignmentFacts['HW-1'].title,'기기 A 분기 수정');
  assert.equal((await a.api.resolveConflict('USE_SERVER')).state,'SERVER_RESTORED');
  assert.equal(a.snapshot().assignmentFacts['HW-1'].title,'기기 B 숙제 수정');
  assert.equal(JSON.parse(a.storage.getItem('ready_planner_local_preservation_v1')).length,1);
  const latest=device(endpoint,'A');assert.equal((await latest.api.sync()).state,'SERVER_RESTORED');
  assert.equal(latest.snapshot().assignmentFacts['HW-1'].title,'기기 B 숙제 수정');
  const legacy=device(endpoint,'B',{assignmentFacts:{'HW-B':{title:'기기 전용 기록'}},days:{}});
  assert.equal((await legacy.api.sync()).state,'LOCAL_OWNERSHIP_REVIEW_REQUIRED');
  assert.equal((await legacy.api.approveLocalImport()).state,'SERVER_ACKNOWLEDGED');
  const verifiedB=device(endpoint,'B');assert.equal((await verifiedB.api.sync()).state,'SERVER_RESTORED');
  assert.equal(verifiedB.snapshot().assignmentFacts['HW-B'].title,'기기 전용 기록');
  latest.setMember('B');
  assert.equal((await latest.api.sync()).state,'SERVER_RESTORED');
  assert.equal(latest.snapshot().assignmentFacts['HW-B'].title,'기기 전용 기록');
  latest.setMember('A');
  assert.equal((await latest.api.sync()).state,'SYNCED');
  assert.equal(latest.snapshot().assignmentFacts['HW-1'].title,'기기 B 숙제 수정');
  // Genuine two-device divergence: explicit choice of local copy uses ETag
  // and retains an archived local snapshot, without implicit last-writer-wins.
  b.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'B의 두 번째 수정'}},days:{}}));
  assert.equal((await b.api.sync()).state,'SERVER_ACKNOWLEDGED');
  a.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'A가 선택한 수정'}},days:{}}));
  assert.equal((await a.api.sync()).state,'CONFLICT_REVIEW_REQUIRED');
  assert.equal((await a.api.resolveConflict('KEEP_LOCAL')).state,'SERVER_ACKNOWLEDGED');
  assert.equal((await latest.api.sync()).state,'SERVER_RESTORED');
  assert.equal(latest.snapshot().assignmentFacts['HW-1'].title,'A가 선택한 수정');
  // Previously acknowledged member A can resume without inheriting member B's data.
  latest.network.offline=true;
  latest.storage.setItem('readyset_planner_v1',JSON.stringify({assignmentFacts:{'HW-1':{title:'오프라인 임시 기록'}},days:{}}));
  assert.equal((await latest.api.sync()).state,'SYNC_RETRY_REQUIRED');
  assert.equal(latest.snapshot().assignmentFacts['HW-1'].title,'오프라인 임시 기록');
  latest.network.offline=false;
  latest.network.dropNextWriteReply=true;
  assert.equal((await latest.api.sync()).state,'SYNC_RETRY_REQUIRED');
  assert.equal((await latest.api.sync()).state,'SERVER_ACK_RECOVERED');
  const newLocal={assignmentFacts:{'HW-1':{title:'오프라인 작업 보존'}},days:{}};
  latest.storage.setItem('readyset_planner_v1',JSON.stringify(newLocal));
  const serverAck=await latest.api.sync();
  assert.equal(serverAck.state,'SERVER_ACKNOWLEDGED'); // server available and etag up to date
  const record=await store.getWithMetadata('families/F1/members/A/user-data/planner_snapshot/ready-planner-current-v1',{type:'json'});
  assert.equal(record.data.payload.planner.assignmentFacts['HW-1'].title,'오프라인 작업 보존');
  assert.equal(record.data.learning_review_status,'NOT_APPLICABLE');
  console.log('READY_FAMILY_PLANNER_CENTRAL_SYNC_E2E_PASS',JSON.stringify({
    authenticated_central_record:true,member_scoped:true,two_device_restore:true,concurrent_etag_conflict_blocked:true,
    legacy_import_explicit:true,scope_switch_safe_block:true,planner_foundation_roundtrip:true,learning_engine_not_polluted:true
  }));
 }finally{await fs.promises.rm(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
