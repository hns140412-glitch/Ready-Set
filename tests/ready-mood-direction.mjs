import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('ready-mood-direction-v2.js','utf8');
const c=vm.createContext({console:{log(){}},Response,crypto:{randomUUID:()=> 'fixture'},process:{env:{READY_CHARACTER_PAID_GENERATION:'true'}},fetch(){throw Error('PAID_CALL_FORBIDDEN')}});
vm.runInContext(source,c);
const m=c.ReadyMoodDirectionV2;
let paths=0;
function walk(picks=[]){
 const p=m.progress(picks);
 assert.equal(p.completed,picks.length);assert.equal(p.round,Math.min(3,picks.length+1));assert.equal(p.locked,picks.length===3);
 if(p.locked){assert.equal(m.plan({version:3,selections:picks}).length,3);paths++;return}
 const options=m.choices(picks);assert.equal(options.length,3);
 assert.deepEqual(m.choices(picks),options);
 for(const t of options){for(const old of picks)assert.ok(m.distance(old.tileKey,t.key)>1);const next=m.append(picks,t.key);assert.equal(next.at(-1).keywords.length,0,'skip has no inferred keywords');walk(next)}
}
walk();assert.equal(paths,27);
assert.throws(()=>m.append([{tileKey:'BRIGHT',keywords:[]}],'EXCITED'),/NEAR_DUPLICATE/);
assert.throws(()=>m.append([{tileKey:'BRIGHT',keywords:[]}],'BRIGHT'),/NEAR_DUPLICATE/);
assert.throws(()=>m.direction({tileKey:'BRIGHT',keywords:['폴짝','햇살','extra']}),/INVALID/);
assert.equal(m.direction({tileKey:'BRIGHT',keywords:['폴짝','햇살']}).keywords.length,2);
assert.equal(m.selections({version:2,selections:[{tileKey:'FEEL_BRIGHT'}]}).length,0,'legacy storage is not reinterpreted as three child choices');
let picks=[];for(let i=0;i<3;i++)picks=m.append(picks,m.choices(picks)[0].key);
const provider=fs.readFileSync('netlify/functions/character-candidates.mjs','utf8').replace(/^import .*;\r?\n/,'').replace('export default async(req)=>','globalThis.handler=async(req)=>').replaceAll('export function ','function ').replace('export const config=','const config=');
vm.runInContext(provider,c);
const body={sourcePhoto:'SYNTHETIC_ORIGINAL',moodDirections:{version:3,selections:picks}};
const requests=c.buildRequests(body);
requests.forEach((r,i)=>{assert.equal(r.sourcePhoto,body.sourcePhoto);assert.equal(r.sequence,i+1);assert.equal(r.direction.tileKey,picks[i].tileKey);assert.match(c.promptFor(r.direction),/sole identity authority/);assert.match(c.promptFor(r.direction),/never a personality classification/)});
const master=c.buildRequests({...body,mode:'MASTER_REFINEMENT',directionKey:picks[1].tileKey});assert.equal(master[0].sourcePhoto,body.sourcePhoto);assert.match(c.promptFor(master[0].direction,'MASTER'),/ORIGINAL PHOTO/);
assert.equal((await c.handler({method:'POST',headers:{get:()=>null},json(){throw Error('MUST_LOCK_BEFORE_BODY')}})).status,423);
// Run candidate integration without a DOM or provider. Existing identity fields survive.
let identity={sourcePhoto:body.sourcePhoto,characterMoodDirections:body.moodDirections,onboardingStep:'OTHER',foundationSentinel:'preserve'};
const doc={querySelector:()=>null,getElementById:()=>true,createElement:()=>({}),head:{appendChild(){}},documentElement:{}};
Object.assign(c,{window:c,document:doc,MutationObserver:class{observe(){}},ReadyIdentityV1:{get:()=>identity,patch:p=>identity={...identity,...p}}});
vm.runInContext(fs.readFileSync('ready-character-candidate-v1.js','utf8'),c);
assert.equal(c.ReadyCharacterCandidateV1.generationPlan().length,3);
await c.ReadyCharacterCandidateV1.generate();assert.equal(identity.characterCandidateError,'PAID_GENERATION_DISABLED');assert.equal(identity.sourcePhoto,body.sourcePhoto);assert.equal(identity.foundationSentinel,'preserve');assert.equal(identity.characterVisualId,undefined);
assert.match(source,/max-width:620px/);assert.match(source,/repeat\(3,minmax\(0,1fr\)\)/);assert.match(source,/min-height:44px/);assert.match(source,/safe-area-inset-bottom/);assert.match(source,/PLACEHOLDER_ASSET_GAP/);assert.match(source,/data-taky-skip/);assert.match(source,/aria-pressed/);
// Exercise actual consultation markup/wiring, including the explicit keyword skip.
let uiIdentity={sourcePhoto:'SYNTHETIC_PHOTO',onboardingStep:'CHARACTER'};
let buttons=[];
const mount={html:'',set innerHTML(value){this.html=value;buttons=[...value.matchAll(/<button([^>]*)>/g)].map(([,attrs])=>({dataset:Object.fromEntries([...attrs.matchAll(/data-([a-z-]+)(?:="([^" ]*)")?/g)].map(([,k,v])=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),addEventListener(event,fn){this.onclick=fn}}))},get innerHTML(){return this.html},querySelectorAll(selector){const key=selector.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return buttons.filter(b=>key in b.dataset)},querySelector(selector){if(selector==='.takyConsult')return this.html.includes('takyConsult')?{}:null;return this.querySelectorAll(selector)[0]}};
const ui=vm.createContext({queueMicrotask:fn=>fn(),MutationObserver:class{observe(){}},document:{documentElement:{},head:{appendChild(){}},createElement:()=>({}),querySelector:()=>mount},ReadyIdentityV1:{get:()=>uiIdentity,patch:p=>uiIdentity={...uiIdentity,...p}},ReadyCharacterCandidateV1:{get:()=>({candidateState:'NOT_REQUESTED'})},addEventListener(){}});ui.window=ui;
vm.runInContext(source,ui);
for(let round=1;round<=3;round++){
 assert.match(mount.html,new RegExp(`Round ${round}`));
 const cards=mount.querySelectorAll('[data-taky-choice]');assert.equal(cards.length,3);cards[0].onclick();
 assert.match(mount.html,/picked/);
 mount.querySelectorAll('[data-word]')[0].onclick();
 mount.querySelector('[data-taky-skip]').onclick();
 assert.equal(uiIdentity.characterMoodDirections.selections.at(-1).keywords.length,0);
 assert.equal(uiIdentity.characterMoodDirections.selections.length,round);
}
assert.match(mount.html,/data-paid-lock="true"/);assert.equal(mount.querySelectorAll('[data-taky-choice]').length,0);assert.equal(uiIdentity.sourcePhoto,'SYNTHETIC_PHOTO');
console.log('FUNCTIONAL PASS: 27 three-round paths, distance, progress, keyword skip, PHOTO lineage, candidate integration, unconditional provider lock');
console.log('STATIC RESPONSIVE PASS: max-width, three columns, 44px targets, safe area, selected state and explicit art gap');
