const assert=require('node:assert/strict');
const a=require('../ready-recording-analysis-v1.js');
(async()=>{
 const blob={size:1,type:'audio/mp4'};
 assert.equal((await a.analyze({blob})).status,'PROVIDER_UNAVAILABLE');
 const provider={analyze:async()=>({verified:true,evidence_ref:'EV:1',provider:'TEST',strengths:['끝까지 읽음'],next_hint:'한 문장만 천천히',confidence:.9})};
 const x=await a.analyze({blob,provider});
 assert.equal(x.ok,true);assert.equal(x.analysis.strengths[0],'끝까지 읽음');
 const bad={analyze:async()=>({verified:false,evidence_ref:'EV',provider:'TEST',strengths:[]})};
 assert.equal((await a.analyze({blob,provider:bad})).status,'UNVERIFIED_RESULT');
 assert.equal(a.guessingAllowed,false);
 console.log(JSON.stringify({gate:'READY_RECORDING_ANALYSIS',pass:true},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
