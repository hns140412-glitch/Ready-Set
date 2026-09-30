'use strict';
const assert=require('node:assert/strict');
const Runtime=require('../vendor/taky/explorer-crew-browser-provider-v1.js');
const Install=require('../ready-crew-browser-provider-v1.js');
(async()=>{
 const listeners={}; function CE(type,opt){this.type=type;this.detail=opt?.detail}
 let request=null;
 const root={TakyCrewEvidenceBrowserProviderV1:Runtime,TAKY_CREW_CONFIG:{CENTRAL_CREW_EVIDENCE_ENDPOINT:'https://central.example/api/crew/evidence'},TakyCentralCrewAuthHost:{currentSession:async()=>({authenticated:true,family_id:'F1',authorized_member_ids:['M1']}),selectedMemberId:async()=>'M1',accessToken:async()=>'1234567890abcdef'},fetch:async(url,opt)=>{request={url,opt};return {status:200,json:async()=>({ok:true,endpoint_version:'TAKY_CENTRAL_CREW_EVIDENCE_HTTP_V1',acknowledgement_kind:'CREW_EVIDENCE_RECEIPT',receipt_id:'R1',receipt_scope:{family_id:'F1',member_id:'M1'},source_app:'READY_SET',storage_confirmed:true,relationship_auto_commit:false,learning_engine_state_mutated:false,imported_event_ids:['E1'],duplicate_event_ids:[]})}},CustomEvent:CE,addEventListener:(n,h)=>listeners[n]=h,dispatchEvent:()=>{}};
 const installed=await Install.installFromRoot(root);assert.equal(installed.ok,true);assert.equal(root.ReadyCrewBrowserProviderStatus.state,'INSTALLED_FAIL_CLOSED');
 const packet={schema:'TAKY_CREW_EVIDENCE_HANDOFF_V1',source_app:'READY_SET',events:[{event_id:'E1',type:'SHARED_EPISODE',verified:true,evidence_ref:'EV1',character_id:'C1'}]};
 const sent=await root.ReadyCrewBrowserProvider.send(packet);assert.equal(sent.ok,true);assert.equal(JSON.parse(request.opt.body).context.member_id,'M1');
 const blocked=await Install.installFromRoot({TakyCrewEvidenceBrowserProviderV1:Runtime,TAKY_CREW_CONFIG:{CENTRAL_CREW_EVIDENCE_ENDPOINT:'https://central.example/api/crew/evidence'}});
 assert.equal(blocked.status.state,'DISABLED_AUTH_HOST_REQUIRED');
 console.log('READY_CREW_BROWSER_PROVIDER_PASS');
})().catch(e=>{console.error(e);process.exit(1)});
