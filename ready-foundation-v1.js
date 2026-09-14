/* Ready foundation: pure contracts; no session, reward or assignment-history writes. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const check=(ok,message)=>{if(!ok)throw Error(message)};
const date=x=>{check(typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x,'INVALID_DATE');return x};
const time=x=>{check(/^([01]\d|2[0-3]):[0-5]\d$/.test(x),'INVALID_TIME');return x};
const active=(x,d)=>x.state==='ACTIVE'&&x.effective_from<=d&&(!x.effective_to||d<x.effective_to);
function normalize(source,row){
 check(['NOTION','LOCAL','SYSTEM/EVENT'].includes(source),'INVALID_SOURCE');
 check(row.id&&row.key&&row.title,'EVENT_IDENTITY_REQUIRED');
 check(typeof row.parent_editable==='boolean'&&typeof row.planner_movable==='boolean','EXPLICIT_PERMISSIONS_REQUIRED');
 check(row.date||Number.isInteger(row.weekday)&&row.weekday>=0&&row.weekday<=6,'EVENT_DATE_REQUIRED');
 const start=time(row.start),end=time(row.end);check(start<end,'INVALID_INTERVAL');
 return {id:String(row.id),key:String(row.key),title:String(row.title),subject:row.subject||null,date:row.date?date(row.date):null,weekday:row.date?null:row.weekday,start,end,kind:row.kind||'FIXED',parent_editable:row.parent_editable,planner_movable:row.planner_movable,source,provenance:{source,source_id:String(row.id)},state:row.state||'ACTIVE'};
}
// Connector adapters map provider payloads here; no provider network calls.
const adapters={LOCAL:rows=>rows.map(r=>normalize('LOCAL',r)),NOTION:rows=>rows.map(r=>normalize('NOTION',{id:r.id,...r.properties})), 'SYSTEM/EVENT':rows=>rows.map(r=>normalize('SYSTEM/EVENT',r))};
function profile(p){
 check(p.id&&Number.isInteger(p.revision)&&p.revision>0&&p.provenance,'PROFILE_METADATA_REQUIRED');
 date(p.effective_from);if(p.effective_to){date(p.effective_to);check(p.effective_to>p.effective_from,'INVALID_EFFECTIVE_RANGE')}
 check(['ACTIVE','DRAFT','RETIRED'].includes(p.state),'INVALID_STATE');
 return {...clone(p),effective_to:p.effective_to||null,events:p.events.map(e=>normalize(e.source,e))};
}
function revise(profiles,id,from,changes){
 date(from);const old=profiles.filter(p=>p.id===id&&active(p,from)).sort((a,b)=>b.revision-a.revision)[0];
 check(old&&from>old.effective_from,'REVISION_REQUIRES_LATER_EFFECTIVE_DATE');
 check(!profiles.some(p=>p.id===id&&p.effective_from>from),'FUTURE_REVISION_CONFLICT');
 check(old.events.every(e=>e.parent_editable),'PARENT_SCHEDULE_LOCKED');
 const next=profile({...old,...changes,id,revision:old.revision+1,effective_from:from,effective_to:old.effective_to});
 return profiles.map(p=>p===old?{...clone(p),effective_to:from}:clone(p)).concat(next);
}
function effective(state,d){
 date(d);check(['STANDALONE','NOTION_CONNECTED','HYBRID'].includes(state.mode),'INVALID_MODE');
 const profiles=state.profiles.filter(p=>active(p,d));const map=new Map();
 const rank={'NOTION':0,'LOCAL':1,'SYSTEM/EVENT':2};
 const events=profiles.flatMap(p=>p.events.map(e=>({...e,profile_id:p.id,revision:p.revision}))).filter(e=>e.state==='ACTIVE'&&(e.date?e.date===d:e.weekday===new Date(d+'T12:00:00Z').getUTCDay())&&(state.mode!=='STANDALONE'||e.source!=='NOTION'));
 events.sort((a,b)=>rank[a.source]-rank[b.source]||a.revision-b.revision).forEach(e=>map.set(e.key,clone(e)));
 for(const o of state.overrides.filter(o=>o.date===d)){const baseline=map.get(o.key);check(!baseline||baseline.parent_editable,'PARENT_SCHEDULE_LOCKED');if(o.cancel)map.delete(o.key);else map.set(o.key,{...normalize('LOCAL',{...o.event,key:o.key,date:d}),override_id:o.id})}
 return {date:d,events:[...map.values()],revisions:profiles.map(p=>({id:p.id,revision:p.revision})),noFreeTimeInference:true,sourceStatus:clone(state.sourceStatus||{})};
}
function override(state,o){date(o.date);check(o.id&&o.key,'OVERRIDE_ID_REQUIRED');if(!o.cancel)normalize('LOCAL',{...o.event,key:o.key,date:o.date});const next={...clone(state),overrides:state.overrides.filter(x=>x.id!==o.id).concat(clone(o))};effective(next,o.date);return next}
function ingest(state,source,rows,status='AVAILABLE'){
 check(adapters[source],'INVALID_SOURCE');const next=clone(state);next.sourceStatus={...next.sourceStatus,[source]:status};
 // Loss is evidence, never deletion. Explicit replacement requires a profile revision.
 if(status==='AVAILABLE')next.pendingSourceEvents=adapters[source](rows);
 return next;
}
const FACT_FIELDS=['id','title','subject','volume','deadline','required','teacherInstruction','source'];
function parentFact(input){check(Object.keys(input).every(k=>FACT_FIELDS.includes(k)),'PARENT_FACT_AUTHORITY_ONLY');check(input.id&&input.title,'FACT_ID_TITLE_REQUIRED');if(input.deadline)date(input.deadline);return {...clone(input),difficulty:null,estimatedMin:null,authority:'CAPTURE_INPUT_CONFIRM',state:'REVIEWED'}}
function condition(evidence={},config={}){
 const weights={tired:1,requestedRest:2,...config};check(Object.values(weights).every(n=>Number.isFinite(n)&&n>=0&&n<=3),'INVALID_WEIGHTS');
 return {penalty:(evidence.selfReportedTired===true?weights.tired:0)+(evidence.requestedRest===true?weights.requestedRest:0),noDiagnosis:true,noSurveillance:true,weightsFinalized:false,automaticInflation:false};
}
function plan({state,from,dates,assignments,units,carryOver=[],actualHistory=[],pace=null,conditionEvidence={},weights={}}){
 date(from);check(dates.length<=62,'BOUNDED_HORIZON_REQUIRED');const days=[...new Set(dates)].map(date).filter(d=>d>=from).sort();
 const outputs=[],unresolved=[];const completed=new Set(actualHistory.filter(h=>h.status==='COMPLETED').map(h=>h.unit_id));
 const seen=new Set();
 for(const u of [...units].sort((a,b)=>String(assignments.find(x=>x.id===a.assignment_id)?.deadline||'9999').localeCompare(String(assignments.find(x=>x.id===b.assignment_id)?.deadline||'9999'))||Number(carryOver.includes(b.id))-Number(carryOver.includes(a.id))||String(a.id).localeCompare(String(b.id)))){
 check(u.id&&!seen.has(u.id),'DUPLICATE_UNIT');seen.add(u.id);if(completed.has(u.id))continue;
 const a=assignments.find(a=>a.id===u.assignment_id);check(a,'ASSIGNMENT_REQUIRED');
 if(u.authority!=='LEARNING/SUBJECT'||!Number.isFinite(u.cognitiveLoad)||!Number.isFinite(u.activityLoad)||u.cognitiveLoad<0||u.activityLoad<0||!a.deadline){unresolved.push({unit_id:u.id,reason:'INTERPRETATION_OR_DEADLINE_REQUIRED'});continue}
 date(a.deadline);
 const options=days.filter(d=>d<=a.deadline).map(d=>{
 const schedule=effective(state,d),hook=condition(conditionEvidence[d],weights);
 // Only explicit study opportunities; absence of events never implies capacity.
 const opportunities=schedule.events.filter(e=>e.kind==='STUDY_OPPORTUNITY'&&!schedule.events.some(b=>b.kind!=='STUDY_OPPORTUNITY'&&b.start<e.end&&e.start<b.end));
 const used=outputs.filter(t=>t.localDate===d).length;
 return {d,schedule,opportunities,used,score:used+hook.penalty+schedule.events.filter(e=>e.kind!=='STUDY_OPPORTUNITY').length*(u.cognitiveLoad+u.activityLoad)};
 }).filter(x=>x.opportunities.length>x.used && !(pace?.supportRequested===true && x.used>0)).sort((a,b)=>a.score-b.score||a.d.localeCompare(b.d));
 if(!options.length){unresolved.push({unit_id:u.id,reason:'NO_CONFIRMED_OPPORTUNITY'});continue}
 const x=options[0];outputs.push({id:'foundation:'+u.id,sourceUnitId:u.id,sourceAssignmentId:a.id,localDate:x.d,title:a.title,subject:a.subject,volume:u.label,deadline:a.deadline,status:'PLANNED',selected:false,authority:'PLANNER/MAIN',projection:'TODAY_TASK',scheduleRevisions:x.schedule.revisions,condition:condition(conditionEvidence[x.d],weights),evidence:{carryOver:carryOver.includes(u.id),pace:clone(pace),actualHistory:actualHistory.filter(h=>h.unit_id===u.id)},sessionWriter:'READY'});
 }
 return {candidates:outputs,unresolved,authority:'PLANNER/MAIN',candidateOnly:true};
}
function capture(batch,action,payload={}){
 const b=clone(batch);check(b.state!=='COMMITTED','BATCH_ALREADY_COMMITTED');
 if(action==='ADD'){check(b.state==='CAPTURING'&&['CAMERA','MANUAL'].includes(payload.path),'CAPTURE_PATH_REQUIRED');b.items.push({...clone(payload),state:'LOCAL_TEMP'});b.next='IMMEDIATE_NEXT'}
 else if(action==='ANALYZE'){check(b.state==='CAPTURING'&&b.items.length,'EMPTY_BATCH');b.state='ANALYZING'}
 else if(action==='RESULT'){check(b.state==='ANALYZING','ANALYSIS_NOT_REQUESTED');b.state='REVIEW';b.retakeIds=payload.retakeIds||[]}
 else if(action==='RETAKE'){check(b.state==='REVIEW'&&b.retakeIds.includes(payload.id),'TARGETED_RETAKE_ONLY');b.items=b.items.map(i=>i.id===payload.id?{...i,...clone(payload),state:'LOCAL_TEMP'}:i);b.state='CAPTURING'}
 else if(action==='COMMIT'){check(b.state==='REVIEW'&&!b.retakeIds.length&&payload.reviewed===true,'REVIEW_BEFORE_COMMIT');b.facts=payload.facts.map(parentFact);b.state='COMMITTED'}
 else throw Error('UNKNOWN_CAPTURE_ACTION');return b;
}
const api={version:1,enabled:true,normalize,adapters,profile,revise,effective,override,ingest,parentFact,condition,plan,capture};
root.ReadyFoundationV1=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);
