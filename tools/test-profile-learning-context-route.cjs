'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const srcPath=path.resolve(__dirname,'..','ready-runtime-v07.js');
let src=fs.readFileSync(srcPath,'utf8');
const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();";
assert.ok(src.includes(marker),'BOOT_MARKER_MISSING');
src=src.replace(marker,"window.__ReadyRuntimeTest={gradeFromStage,ageFromBirthDate,launchSpecialist};\n"+marker);

let assigned='';
const identity={userId:'child-1',birthDate:'2015-01-01',schoolStage:'E5'};
const state={activeSession:{
  id:'S1',selected:['과학 단어'],tasks:[],startAt:1000,targetMs:1800000,targetAt:null,pausedAt:null,pausedMs:0,issueMs:0,
  continuity:{intervals:[]},issueState:null,systemWaitState:null,
  rev07:{
    contract_version:'REV_07',session_id:'sess-1',goal_id:'goal-1',session_state:'ACTIVE',
    active_task_id:'task-1',active_lap_id:'lap-1',active_app:'ready-set',events:[],
    tasks:[{task_id:'task-1',label:'과학 단어',state:'PENDING',suggested_app:'hide-seek',laps:[
      {lap_id:'lap-1',task_id:'task-1',started_at:'2026-10-07T00:00:00.000Z',started_ms:1000,ended_at:null,focus_start_ms:0}
    ]}]
  }
}};

const document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null},
  createElement(){return {style:{},classList:{},appendChild(){},addEventListener(){}}},
  head:{appendChild(){}},
  body:{appendChild(){}}
};
const location={
  search:'',origin:'https://ready.example.test',pathname:'/index.html',hash:'',
  href:'https://ready.example.test/index.html',
  assign(v){assigned=String(v)}
};
const window={
  ReadyIdentityV1:{get:()=>({...identity})},
  ReadyBaseRuntimeV1:{
    selectedPlannerTask:()=>({subject:'과학',concept_skill_target:'물질의 성질'}),
    times:()=>({focus:0}),
    publishPlannerResult(){}
  },
  addEventListener(){},
  dispatchEvent(){},
  location
};
const sandbox={
  console,URL,URLSearchParams,Date,Math,setTimeout,clearTimeout,structuredClone,
  document,location,window,state,
  save(){},completeSession(){},nav(){},escapeHtml:v=>String(v),toast(){},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
};
window.window=window;
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'ready-runtime-v07.js'});
const T=window.__ReadyRuntimeTest;
assert.ok(T);

assert.equal(T.gradeFromStage('E5'),5);
assert.equal(T.gradeFromStage('M1'),7);
assert.equal(T.gradeFromStage('PRESCHOOL'),null);
assert.equal(T.ageFromBirthDate('2015-01-01'),11);

T.launchSpecialist('hide-seek');
assert.ok(assigned);
const u=new URL(assigned);
assert.equal(u.searchParams.get('child_id'),'child-1');
assert.equal(u.searchParams.get('school_stage'),'E5');
assert.equal(u.searchParams.get('school_grade'),'5');
assert.equal(u.searchParams.get('age'),'11');
assert.equal(u.searchParams.get('subject'),'과학');
assert.equal(u.searchParams.get('concept_skill_target'),'물질의 성질');

identity.birthDate='2013-01-01';
identity.schoolStage='M1';
assigned='';
state.activeSession.rev07.active_app='ready-set';
T.launchSpecialist('hide-seek');
const m=new URL(assigned);
assert.equal(m.searchParams.get('school_stage'),'M1');
assert.equal(m.searchParams.get('school_grade'),'7');
assert.equal(m.searchParams.get('age'),'13');

console.log('READY_PROFILE_LEARNING_CONTEXT_ROUTE_TEST: PASS');
