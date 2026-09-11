import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Small DOM/event model for running the unmodified owners without dependencies.
// Browser hit testing and Safari event synthesis remain in the companion tap test.
let mutations=0;
class Element {
 constructor(tag='div'){this.tagName=tag;this.nodeType=1;this.children=[];this.dataset={};this.listeners={};this.attrs={};const set=new Set();this.classList={add:(...a)=>a.forEach(x=>set.add(x)),remove:(...a)=>a.forEach(x=>set.delete(x)),contains:x=>set.has(x)};}
 appendChild(el){el.parent=this;this.children.push(el);mutations++;return el;}
 set textContent(value){this.text=value;mutations++;}
 get textContent(){return this.text||'';}
 set innerHTML(html){this.html=html;this.children=[];const stack=[this];for(const m of html.matchAll(/<\/?([\w-]+)([^>]*?)>/g)){if(m[0][1]==='/'){if(stack.length>1)stack.pop();continue;}const el=new Element(m[1]);for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)){const k=a[1],v=a[2]??a[3]??'';el.attrs[k]=v;if(k==='id')el.id=v;if(k==='class')el.classList.add(...v.split(' '));if(k==='disabled')el.disabled=true;if(k.startsWith('data-'))el.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}stack.at(-1).appendChild(el);if(!['input','br','img','hr'].includes(m[1]))stack.push(el);}}
 get innerHTML(){return this.html||'';}
 matches(s){if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('[')){const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&m[1] in this.attrs&&(m[2]===undefined||this.attrs[m[1]]===m[2]);}return this.tagName===s;}
 querySelectorAll(selector){const all=[];const visit=e=>{for(const c of e.children){all.push(c);visit(c)}};visit(this);return all.filter(e=>selector.split(',').some(s=>e.matches(s.trim())));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);}
 click(){if(this.disabled)return;const e={type:'click',target:this,preventDefault(){}};this.onclick?.(e);this.dispatchEvent(e);}
 removeAttribute(name){delete this.attrs[name];if(name.startsWith('data-'))delete this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())];}
}
const sources=['ready-onboarding-identity-v1.js','ready-character-candidate-v1.js','ready-stage-c.js'].map(file=>fs.readFileSync(file,'utf8'));
if(process.argv[2])sources[1]=fs.readFileSync(process.argv[2],'utf8');
async function run({quota=false,candidate=true}={}){
 const document=new Element('document');document.documentElement=document.appendChild(new Element('html'));document.head=document.documentElement.appendChild(new Element('head'));document.body=document.documentElement.appendChild(new Element('body'));document.createElement=t=>new Element(t);document.getElementById=id=>document.querySelector('#'+id);document.readyState='complete';document.visibilityState='visible';
 const fixture={schemaVersion:5,status:'PHOTO_CAPTURED',onboardingStep:'PHOTO',setupMode:'SELF',userId:'fixture-user',legalName:'Test',nickname:'Star',familyRole:'SELF',birthDate:'2016-01-01',schoolStage:'E4',sourcePhoto:'data:image/jpeg;base64,fixture'};
 const store=new Map([['readyset_identity_v1',JSON.stringify(fixture)]]);let failWrites=false,writes=0,apiCalls=0,observers=0;
 const timers=new Map();let timerId=0;const window=new Element('window');const callbacks=[];
 const context=vm.createContext({window,document,console,Date,Math,JSON,Event:class {constructor(type){this.type=type}},MutationObserver:class {constructor(fn){observers++;callbacks.push(fn)}observe(){}},localStorage:{getItem:k=>store.get(k),setItem(k,v){if(failWrites)throw Error('QuotaExceededError');writes++;store.set(k,v)}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),alert(){throw Error('Unexpected alert')},confirm:()=>false,fetch(){apiCalls++;throw Error('PAID_API_FORBIDDEN')}});
 const settleObservers=()=>{for(let n=0;n<10;n++){const before=mutations;callbacks.forEach(fn=>fn());if(mutations===before)return;}assert.fail('Candidate MutationObserver never settles: textContent writes prevent CHARACTER paint');};
 const execute=n=>vm.runInContext(sources[n],context);
 execute(0);if(candidate)execute(1);execute(2);
 await Promise.resolve();await Promise.resolve();
  const api=window.ReadyIdentityV1,root=document.querySelector('#readyFirstRun');
 const photo=api.get().sourcePhoto;api.patch({sourcePhoto:''});api.render();
 assert.equal(root.querySelector('#next').disabled,true);assert.equal(api.transitionToCharacter(),false);
 api.patch({sourcePhoto:photo});api.render();
 const button=root.querySelector('#next');assert.ok(button.onclick);assert.equal(button.disabled,undefined);
 assert.ok(root.innerHTML.includes(fixture.sourcePhoto));
 window.dispatchEvent({type:'focus'});window.dispatchEvent({type:'pageshow',persisted:true});document.dispatchEvent({type:'visibilitychange'});
 assert.equal(root.querySelector('#next'),button,'restore must preserve pending tap target');
 assert.equal(document.listeners.click?.length||0,0,'loader must not intercept the owned button');
 failWrites=quota;const before=writes;button.click();
 if(!candidate){for(const fn of [...timers.values()])fn();await Promise.resolve();await Promise.resolve();await Promise.resolve();}
  assert.equal(api.get().onboardingStep,'CHARACTER');assert.equal(api.get().sourcePhoto,fixture.sourcePhoto);assert.equal(api.get().userId,fixture.userId);
 settleObservers();
 assert.ok(root.querySelector('#readyCharacterCandidateMount').querySelector('.ccConsult'),'real consultation markup must mount');
 assert.equal(writes-before,quota?0:1,'one transition writer');
 button.click();assert.equal(writes-before,quota?0:1,'stale duplicate activation is a no-op');
 const mount=root.querySelector('#readyCharacterCandidateMount');
 const pageListeners=window.listeners.pageshow.length;
 execute(0);if(candidate)execute(1);execute(2);
 assert.equal(window.listeners.pageshow.length,pageListeners);assert.equal(observers,candidate?1:0);
 window.dispatchEvent({type:'pageshow',persisted:true});window.dispatchEvent({type:'focus'});
 assert.equal(root.querySelector('#readyCharacterCandidateMount'),mount);
 for(let step=0;step<3;step++){mount.querySelector(candidate?'[data-style-tile]':'[data-fallback-key]').click();settleObservers();const tile=mount.querySelector(candidate?'[data-style-tile]':'[data-fallback-key]');window.dispatchEvent({type:'focus'});assert.equal(mount.querySelector(candidate?'[data-style-tile]':'[data-fallback-key]'),tile);}
 assert.equal(Object.keys(api.get().characterStyleConsultation.picks).length,3);
 if(candidate)mount.querySelector('[data-candidate-action="generate"]').click();
 assert.equal(apiCalls,0,'generation remains behind approval');
 failWrites=false;window.dispatchEvent({type:'pageshow',persisted:true});
 assert.equal(JSON.parse(store.get('readyset_identity_v1')).onboardingStep,'CHARACTER');
 root.querySelector('#back').click();assert.equal(api.get().onboardingStep,'PHOTO');assert.ok(root.innerHTML.includes(fixture.sourcePhoto));
  root.querySelector('#next').click();assert.equal(api.get().onboardingStep,'CHARACTER');
 // A late file decode may update the reference but must never roll the step back.
 root.querySelector('#back').click();
 let reader;
 context.FileReader=class {constructor(){reader=this}readAsDataURL(){}};
 context.Image=class {constructor(){this.width=1;this.height=1}set src(value){this.onload()}};
 const create=document.createElement;
 document.createElement=tag=>tag==='canvas'?{getContext:()=>({drawImage(){}}),toDataURL:()=>photo}:create(tag);
 const upload=root.querySelector('#gal').onchange({target:{files:[{}]}});
 api.transitionToCharacter();reader.result=photo;reader.onload();await upload;settleObservers();
 assert.equal(api.get().onboardingStep,'CHARACTER');assert.equal(api.get().sourcePhoto,photo);
 assert.equal(apiCalls,0);
 console.log(`PASS actual owner semantics: ${candidate?'candidate':'bounded fallback'} / ${quota?'storage failure':'persisted'}`);
}
await run();await run({quota:true});await run({candidate:false});
