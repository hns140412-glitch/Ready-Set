import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Sandbox provider module without importing it or reading environment/secrets.
const context=vm.createContext({console,Response,Uint8Array,atob,crypto:{randomUUID:()=> 'fixture-id'},process:{env:{}},fetch(){throw Error('PAID_CALL_FORBIDDEN')}});
vm.runInContext(fs.readFileSync('ready-mood-direction-v2.js','utf8'),context);
const provider=fs.readFileSync('netlify/functions/character-candidates.mjs','utf8').replace(/^import .*;\n/,'').replace('export default async(req)=>','globalThis.handler=async(req)=>').replaceAll('export function ','function ').replace('export const config=','const config=');
vm.runInContext(provider,context);
const mood=context.ReadyMoodDirectionV2;
assert.deepEqual(Array.from(mood.tiles,t=>t.label),['신나!','두근두근','포근해','멋져!','집중!','상상중']);
const selections=['EXCITED','COZY','IMAGINING'].map(tileKey=>({tileKey,keywords:[]}));
const body={sourcePhoto:'SYNTHETIC_TEST_ONLY',moodDirections:{version:2,selections}};
const requests=context.buildRequests(body);
assert.equal(requests.length,3);
requests.forEach((r,k)=>{assert.equal(r.sourcePhoto,body.sourcePhoto);assert.equal(r.sequence,k+1);assert.equal(r.direction.tileKey,selections[k].tileKey);const prompt=context.promptFor(r.direction);assert.match(prompt,/sole identity authority/);assert.match(prompt,/Same child, same age/);assert.match(prompt,/never a personality classification/);for(const other of requests.filter(x=>x!==r))assert.ok(!prompt.includes(other.direction.promptDirection.expression));});
assert.throws(()=>mood.plan({version:2,selections:[selections[0],selections[0],selections[2]]}),/NEAR_DUPLICATE/);
assert.throws(()=>mood.plan({version:2,selections:selections.slice(0,2)}),/THREE_MOOD/);
assert.throws(()=>mood.direction({tileKey:'EXCITED',keywords:['활발','씩씩','장난꾸러기']}),/INVALID/);
assert.throws(()=>mood.direction({tileKey:'EXCITED',keywords:['unknown']}),/INVALID/);
assert.throws(()=>context.buildRequests({sourcePhoto:'fixture',styleConsultation:{}}),/THREE_MOOD/);
const master=context.buildRequests({...body,mode:'MASTER_REFINEMENT',directionKey:'COZY'});
assert.equal(master.length,1);assert.equal(master[0].direction.tileKey,'COZY');assert.match(context.promptFor(master[0].direction,'MASTER'),/ORIGINAL PHOTO/);
assert.throws(()=>context.buildRequests({...body,mode:'MASTER_REFINEMENT',directionKey:'CALM'}),/INVALID_SELECTED/);
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
assert.equal(result.status,200);assert.equal(calls.length,3);assert.equal(maxActive,1);
assert.ok(calls.every(c=>c.photo==='test'));
calls.forEach((c,k)=>assert.ok(c.prompt.includes(requests[k].direction.promptDirection.expression)));
assert.equal((await result.json()).visualReviewStatus,'UNREVIEWED');
// Only structural safety PASS; no generated-output/identity/distance certification.
console.log('PASS mood contract, independent directions, refinement lineage and paid lock; generated-output status BLOCKED');
