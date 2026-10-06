import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// READY-VS-003: Stage-C boot ownership. Identity owns the screen until READY; core boots once afterwards.
const loader=fs.readFileSync('ready-stage-c.js','utf8');
const FIRST_RUN=['./ready-role-context-v1.js','./ready-onboarding-flow-completion-v1.js'];
const IDENTITY='./ready-onboarding-identity-v2.js?v=20260913-deferred';

function harness({ready=false,owner=true}={}){
  const listeners={window:{},document:{}};
  const on=bucket=>(type,fn)=>{(listeners[bucket][type]||=[]).push(fn)};
  const classes=new Set(['identityFirstPaint','worldFirstPaint','readyFirstRun']);
  const loaded=[];let firstRunRemoved=0,recovered=0,completionSyncs=0;
  const firstRun={id:'readyFirstRun',remove(){firstRunRemoved++;nodes.delete('readyFirstRun')}};
  const nodes=new Map([['readyFirstRun',firstRun]]);
  const state={ready};
  const window={addEventListener:on('window')};
  const identityOwner=()=>({isReady:()=>state.ready,recover(){recovered++;nodes.set('readyFirstRun',firstRun)},render(){}});
  if(owner)window.ReadyIdentityV1=identityOwner();
  const html={dataset:{},classList:{add:c=>classes.add(c),remove:(...c)=>c.forEach(x=>classes.delete(x)),contains:c=>classes.has(c)}};
  const document={documentElement:html,visibilityState:'visible',addEventListener:on('document'),
    getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],
    createElement:()=>({}),
    head:{appendChild(s){loaded.push(s.src);queueMicrotask(()=>{
      if(s.src===IDENTITY)window.ReadyIdentityV1=identityOwner();
      if(s.src.includes('flow-completion'))window.ReadyOnboardingFlowCompletionV1={sync(){completionSyncs++}};
      s.onload()})}}};
  const ctx=vm.createContext({window,document,console,setTimeout,clearTimeout,Promise,Map,Error});
  const fire=(bucket,type)=>(listeners[bucket][type]||[]).forEach(fn=>fn({type}));
  const settle=async()=>{for(let n=0;n<200;n++)await Promise.resolve()};
  return {run:()=>vm.runInContext(loader,ctx),settle,fire,state,html,classes,loaded,nodes,
    get firstRunRemoved(){return firstRunRemoved},get recovered(){return recovered},get completionSyncs(){return completionSyncs}};
}

// 1. Blank first run: first-run owner preserved, core not loaded, recovery keeps ownership.
let h=harness();h.run();await h.settle();
assert.deepEqual(h.loaded,FIRST_RUN,'identity incomplete: only first-run phase loads (no core, no second identity owner)');
assert.equal(h.firstRunRemoved,0,'Stage-C must not remove #readyFirstRun while identity is incomplete');
assert.ok(h.nodes.has('readyFirstRun'));assert.ok(h.classes.has('readyFirstRun'),'readyFirstRun class held');
assert.equal(h.html.dataset.readyBootState,'FIRST_RUN');
assert.ok(h.completionSyncs>=1,'onboarding completion is driven during first run');
for(const [b,t] of [['window','pageshow'],['window','focus'],['document','visibilitychange']])h.fire(b,t);
await h.settle();
assert.equal(h.firstRunRemoved,0,'recovery must respect the same ownership condition');
assert.deepEqual(h.loaded,FIRST_RUN,'recovery during first run must not load core');
assert.ok(h.recovered>=4,'recovery re-asserts the identity owner');

// 2. Identity becomes READY: core loads once, held layers released.
h.state.ready=true;h.fire('window','focus');h.fire('window','pageshow');await h.settle();
assert.equal(h.firstRunRemoved,1,'first-run layer released once identity is READY');
assert.ok(!h.classes.has('readyFirstRun')&&!h.classes.has('identityFirstPaint'));
assert.equal(h.html.dataset.readyBootState,'READY');
const core=h.loaded.slice(FIRST_RUN.length);
assert.equal(core[0],'./ready-foundation-v1.js');assert.ok(core.includes('./ready-parent-setup-hub-v1.js'));
assert.equal(new Set(h.loaded).size,h.loaded.length,'no duplicate script loads');
h.fire('window','focus');h.fire('document','visibilitychange');await h.settle();
assert.equal(new Set(h.loaded).size,h.loaded.length,'recovery after READY is idempotent');

// 3. Reload with READY identity: full boot directly into core.
h=harness({ready:true});h.run();await h.settle();
assert.deepEqual(h.loaded.slice(0,2),FIRST_RUN);assert.equal(h.loaded[2],'./ready-foundation-v1.js');
assert.equal(h.html.dataset.readyBootState,'READY');assert.equal(h.firstRunRemoved,1);

// 4. Owner missing from HTML: Stage-C loads the canonical identity v2 exactly once.
h=harness({owner:false});h.run();await h.settle();
assert.equal(h.loaded[0],IDENTITY);assert.equal(h.loaded.filter(s=>s.includes('onboarding-identity')).length,1);
assert.equal(h.firstRunRemoved,0);

console.log('PASS: READY-VS-003 Stage-C preserves first-run owner until identity READY, then boots core once');
