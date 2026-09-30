'use strict';
const assert=require('node:assert/strict');
const Bootstrap=require('../ready-central-browser-bootstrap-v01.js');

(async()=>{
  assert.equal(Bootstrap.candidateDates(3,new Date(2026,8,30,12,0,0)).join(','),'2026-09-30,2026-10-01,2026-10-02');

  const missingConfig={TIMEATTACK_CONFIG:{}};
  assert.equal((await Bootstrap.installFromWindow(missingConfig)).reason,'CENTRAL_ENDPOINT_CONFIG_REQUIRED');
  assert.equal(missingConfig.ReadyCentralBootstrapStatus.state,'DISABLED_CONFIG_REQUIRED');

  const missingAuth={
    TIMEATTACK_CONFIG:{
      CENTRAL_EVIDENCE_ENDPOINT:'https://central.example.test/api/learning/evidence',
      CENTRAL_DECISION_ENDPOINT:'https://central.example.test/api/learning/decision'
    }
  };
  assert.equal((await Bootstrap.installFromWindow(missingAuth)).reason,'CENTRAL_AUTH_HOST_REQUIRED');
  assert.equal(missingAuth.ReadyCentralBootstrapStatus.state,'DISABLED_AUTH_HOST_REQUIRED');

  const accessTokenOnly={...missingAuth,
    ReadyCentralAuthHost:{currentSession:async()=>({}),accessToken:async()=> 'oauth-access-token'}};
  assert.equal((await Bootstrap.installFromWindow(accessTokenOnly)).reason,'CENTRAL_AUTH_HOST_REQUIRED');
  assert.equal(accessTokenOnly.ReadyCentralBootstrapStatus.state,'DISABLED_AUTH_HOST_REQUIRED');

  const listeners=new Map();
  let createArgs=null,installArgs=null,optionsArgs=null;
  const ready={authenticated:true,family_id:'F1',member_id:'CHILD_A',role:'CHILD'};
  const central={authenticated:true,issuer:'GOOGLE_OIDC_VERIFIED_SERVER',
    family_id:'F1',subject:'google-sub',authorized_member_ids:['CHILD_A'],
    expires_at:'2099-01-01T00:00:00Z'};
  const w={
    TIMEATTACK_CONFIG:{
      CENTRAL_EVIDENCE_ENDPOINT:'https://central.example.test/api/learning/evidence',
      CENTRAL_DECISION_ENDPOINT:'https://central.example.test/api/learning/decision'
    },
    ReadyCentralAuthHost:{
      currentSession:async()=>central,
      idToken:async()=> 'verified-google-id-token'
    },
    ReadyFamilySession:{current:()=>ready},
    ReadyCentralEvidenceSessionV01:{resolve:({readySession,centralSession,selectedMemberId})=>{
      assert.equal(readySession,ready);
      assert.equal(centralSession,central);
      assert.equal(selectedMemberId,'CHILD_A');
      return {ok:true,session:{authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'}};
    }},
    ReadySetPlanner:{kind:'planner'},
    fetch:async()=>({}),
    indexedDB:{},
    crypto:{},
    addEventListener:(type,cb)=>listeners.set(type,cb),
    dispatchEvent:()=>true
  };
  w.ReadyCentralLearningRoundtripV01={
    create:args=>{createArgs=args;return {run:async()=>({ok:true})};},
    optionsFromPersistedRecord:(record,args)=>{
      optionsArgs={record,args};
      return {ok:true,options:{subject:args.subject,concept_skill_target:args.concept_skill_target,
        planner:args.planner,candidate_dates:args.candidate_dates}};
    },
    installBrowserHost:args=>{
      installArgs=args;
      const host={activeScope:args.activeScopeProvider,detach(){}};
      w.ReadyCentralLearningHost=host;
      return host;
    }
  };

  const installed=await Bootstrap.installFromWindow(w);
  assert.equal(installed.ok,true);
  assert.equal(w.ReadyCentralBootstrapStatus.state,'INSTALLED');
  assert.deepEqual(installed.host.activeScope(),{
    authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'
  });
  assert.equal(createArgs.evidenceEndpointUrl,'https://central.example.test/api/learning/evidence');
  assert.equal(createArgs.decisionEndpointUrl,'https://central.example.test/api/learning/decision');
  assert.equal(await createArgs.tokenProvider(),'verified-google-id-token');
  assert.equal(typeof listeners.get('readyset-family-session'),'function');

  const record={session_id:'S1',completed_at:'2026-09-30T08:00:00Z',task_outcomes:[{
    task_id:'T1',family_id:'F1',member_id:'CHILD_A',
    centralCheckpoint:{provenance:{subject:'MATH',
      concept_skill_target:'G5-MATH-EQUIVALENT-FRACTION-REASONING'}}
  }]};
  const resolved=installArgs.resolveRecordOptions(record);
  assert.equal(resolved.subject,'math');
  assert.equal(resolved.concept_skill_target,'g5-math-equivalent-fraction-reasoning');
  assert.equal(optionsArgs.args.planner,w.ReadySetPlanner);
  assert.equal(optionsArgs.args.candidate_dates.length,14);

  const mixed={...record,task_outcomes:[...record.task_outcomes,{
    task_id:'T2',family_id:'F1',member_id:'CHILD_A',
    centralCheckpoint:{provenance:{subject:'english',concept_skill_target:'vocabulary'}}
  }]};
  assert.throws(()=>installArgs.resolveRecordOptions(mixed),/CENTRAL_MIXED_SCOPE_SESSION_UNSUPPORTED/);
  assert.throws(()=>Bootstrap.activityScope({task_outcomes:[]}),/CENTRAL_ACTIVITY_SCOPE_REQUIRED/);

  console.log('READY_CENTRAL_BROWSER_BOOTSTRAP_PASS: fail-closed config/auth, trusted install, child scope and mixed-scope rejection');
})().catch(e=>{console.error(e);process.exitCode=1});