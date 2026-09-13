import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Sandbox provider module without importing it or reading environment/secrets.
const context=vm.createContext({console,Response,Uint8Array,atob,crypto:{randomUUID:()=> 'fixture-id'},process:{env:{}},fetch(){throw Error('PAID_CALL_FORBIDDEN')}});
vm.runInContext(fs.readFileSync('ready-mood-direction-v2.js','utf8'),context);
const provider=fs.readFileSync('netlify/functions/character-candidates.mjs','utf8').replace(/^import .*;\n/,'').replace('export default async(req)=>','globalThis.handler=async(req)=>').replaceAll('export function ','function ').replace('export const config=','const config=');
vm.runInContext(provider,context);
const mood=context.ReadyMoodDirectionV2;

assert.equal(mood.stageChoices(1).length,3);
assert.equal(mood.stageChoices(2).length,3);
assert.equal(mood.stageChoices(3).length,3);
assert.deepEqual(Array.from(mood.stageChoices(1),t=>t.key),['FEEL_BRIGHT','FEEL_WARM','FEEL_CALM']);
assert.deepEqual(Array.from(mood.stageChoices(2),t=>t.key),['LOOK_ACTIVE','LOOK_NATURAL','LOOK_BOLD']);
assert.ok(mood.stageChoices(3).every(t=>t.key.startsWith('AUTO_')));

const first={tileKey:'FEEL_BRIGHT',keywords:['활발','밝음']};
const second={tileKey:'LOOK_NATURAL',keywords:['자연스러움','편안']};
const third=mood.deriveThird(first,second);
assert.equal(third.derived,true);
assert.ok(third.tileKey.startsWith('AUTO_'));
assert.deepEqual(mood.deriveThird(first,second),third,'derived contrast must be deterministic');
const selections=[first,second,third];
const planned=mood.plan({version:2,selections});
assert.deepEqual(Array.from(planned,d=>d.stage),[1,2,3]);
assert.equal(new Set(Array.from(planned,d=>d.tileKey)).size,3);

assert.throws(()=>mood.plan({version:2,selections:[first,first,third]}),/STAGE_ORDER|NEAR_DUPLICATE/);
assert.throws(()=>mood.plan({version:2,selections:selections.slice(0,2)}),/THREE_MOOD/);
assert.throws(()=>mood.plan({version:2,selections:[second,first,third]}),/STAGE_ORDER/);
assert.throws(()=>mood.direction({tileKey:'FEEL_BRIGHT',keywords:['활발','밝음','호기심']}),/INVALID/);
assert.throws(()=>mood.direction({tileKey:'FEEL_BRIGHT',keywords:['unknown']}),/INVALID/);
assert.throws(()=>mood.deriveThird(second,first),/STAGE_ORDER/);

const body={sourcePhoto:'SYNTHETIC_TEST_ONLY',moodDirections:{version:2,selections}};
const requests=context.buildRequests(body);
assert.equal(requests.length,3);
requests.forEach((r,k)=>{
 assert.equal(r.sourcePhoto,body.sourcePhoto);
 assert.equal(r.sequence,k+1);
 assert.equal(r.direction.tileKey,selections[k].tileKey);
 const prompt=context.promptFor(r.direction);
 assert.match(prompt,/sole identity authority/);
 assert.match(prompt,/Same child, same age/);
 assert.match(prompt,/never a personality classification/);
 for(const other of requests.filter(x=>x!==r))assert.ok(!prompt.includes(other.direction.promptDirection.expression));
});
assert.throws(()=>context.buildRequests({sourcePhoto:'fixture',styleConsultation:{}}),/THREE_MOOD/);

const master=context.buildRequests({...body,mode:'MASTER_REFINEMENT',directionKey:'LOOK_NATURAL'});
assert.equal(master.length,1);
assert.equal(master[0].direction.tileKey,'LOOK_NATURAL');
assert.match(context.promptFor(master[0].direction,'MASTER'),/ORIGINAL PHOTO/);
assert.throws(()=>context.buildRequests({...body,mode:'MASTER_REFINEMENT',directionKey:'LOOK_BOLD'}),/INVALID_SELECTED/);

const locked=await context.handler({method:'POST',headers:{get:()=>null},json(){throw Error('LOCK_MUST_PRECEDE_BODY')}});
assert.equal(locked.status,423);

// Execute the actual adapter loop with an in-memory provider; no network or real environment.
let active=0,maxActive=0;
const calls=[];
const simulated=vm.createContext({console:{log(){}},Response,Uint8Array,atob,FormData,Blob,crypto:{randomUUID:()=> 'fixture-id'},process:{env:{READY_CHARACTER_PAID_GENERATION:'true',OPENAI_API_KEY:'SYNTHETIC_TEST_ONLY'}},async fetch(url,options){
 active++;maxActive=Math.max(maxActive,active);
 calls.push({prompt:options.body.get('prompt'),photo:await options.body.get('image').text()});
 await Promise.resolve();active--;
 return new Response(JSON.stringify({data:[{b64_json:'synthetic-'+calls.length}]}));
}});
vm.runInContext(fs.readFileSync('ready-mood-direction-v2.js','utf8'),simulated);
vm.runInContext(provider,simulated);
const result=await simulated.handler({method:'POST',headers:{get:()=>null},json:async()=>({...body,sourcePhoto:'data:image/png;base64,dGVzdA==',confirmCost:true})});
assert.equal(result.status,200);
assert.equal(calls.length,3);
assert.equal(maxActive,1);
assert.ok(calls.every(c=>c.photo==='test'));
calls.forEach((c,k)=>assert.ok(c.prompt.includes(requests[k].direction.promptDirection.expression)));
assert.equal((await result.json()).visualReviewStatus,'UNREVIEWED');
console.log('PASS two child choices, deterministic derived contrast, identity lineage, sequential provider adapter and paid lock; generated-output status BLOCKED');
