import fs from 'node:fs';

function loadSource(path){
  return fs.readFileSync(path,'utf8');
}
async function importSource(path){
  const source=loadSource(path);
  const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
  return import(url);
}
function assert(name,cond){
  if(!cond) throw new Error('FAIL '+name);
  console.log('PASS '+name);
}

const storeMod=await importSource('src/core/state-store.js');
const shellMod=await importSource('src/shell/app-shell.js');
const gateMod=await importSource('src/integrations/contract-gate.js');

const store=storeMod.createStateStore({count:0},{app:'ready-set'});
let observed=null;
const off=store.subscribe((next,event,prev)=>{observed={next,event,prev};});
store.update(draft=>{draft.count+=1;},{reason:'REBUILD_TEST'});
assert('store-update',store.snapshot().count===1);
assert('store-revision',store.revision()===1);
assert('store-observer',observed?.event?.type==='STATE_REPLACED'&&observed.prev.count===0&&observed.next.count===1);
off();

const shell=shellMod.createAppShell({app:'ready-set'});
const trace=[];
shell.registerView('home',{render:()=>trace.push('render-home'),enter:()=>trace.push('enter-home'),leave:()=>trace.push('leave-home')});
shell.registerView('work',{render:()=>trace.push('render-work'),enter:()=>trace.push('enter-work')});
await shell.show('home');
await shell.show('work');
assert('shell-active-view',shell.activeView()==='work');
assert('shell-lifecycle',trace.join('|')==='render-home|enter-home|leave-home|render-work|enter-work');

const gate=gateMod.createIntegrationGate({app:'ready-set',allowedContractVersions:['READY_LEARNING_CONTEXT_V1']});
assert('contract-allow',gate.validateContract({contract_version:'READY_LEARNING_CONTEXT_V1'}).ok===true);
assert('contract-fail-closed',gate.validateContract({contract_version:'UNKNOWN'}).ok===false);
assert('contract-no-object',gate.validateContract(null).ok===false);


const legacyPlanner=loadSource('ready-planner-v01.js');
const plannerMod=await importSource('src/planner/planner-domain.js');
assert('planner-map-help',plannerMod.mapReadyState('WAITING_FOR_PARENT')==='WAITING_FOR_PARENT');
assert('planner-map-blocked',plannerMod.mapReadyState('BLOCKED')==='BLOCKED');
assert('planner-invalid-state',plannerMod.mapReadyState('NOPE')===null);
assert('planner-session-conflict',plannerMod.validateSessionOwnership({active_session_id:'A'},'B').reason==='SESSION_OWNERSHIP_CONFLICT');
assert('planner-finishability',plannerMod.canFinishTodo({state:'IN_PROGRESS'})===true&&plannerMod.canFinishTodo({state:'PLANNED'})===false);
assert('planner-parity-ready-map',legacyPlanner.includes("WAITING_FOR_PARENT:'WAITING_FOR_PARENT'")&&legacyPlanner.includes("BLOCKED:'BLOCKED'"));
assert('planner-parity-ownership',legacyPlanner.includes("'SESSION_OWNERSHIP_CONFLICT'"));


const outcomeMod=await importSource('src/planner/outcome-policy.js');
assert('carry-partial',outcomeMod.carryPolicyForState('PARTIAL').carryEligible===true);
assert('carry-help-resolution',outcomeMod.carryPolicyForState('WAITING_FOR_PARENT').resolutionRequired===true);
assert('carry-completed-resolves',outcomeMod.carryPolicyForState('COMPLETED').resolvesOpenCarry===true);
assert('carry-escalate-deadline',outcomeMod.carryEscalation({nextDepth:1,deadline:'2026-09-20',targetDate:'2026-09-21'}).reason==='DEADLINE_EXCEEDED');
assert('carry-parity-policy',legacyPlanner.includes("const carryEligible=['PARTIAL','DEFERRED'].includes(mapped)")&&legacyPlanner.includes("const carryNeedsResolution=['BLOCKED','WAITING_FOR_PARENT'].includes(mapped)"));

console.log('REBUILD_DOMAIN_PARITY_PASS');

console.log('REBUILD_V01_FOUNDATION_PASS ready-set');
