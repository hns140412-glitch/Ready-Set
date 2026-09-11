(() => {
  'use strict';

  const VERSION='2026.09.08-stage-g1-planner-semantics';
  const STORE_KEY='readyset_planner_v1';
  const TALENT_SUBJECTS=['연산','한자','국어','사회','수학','생각하는 피자'];
  const TALENT_ACTIVITY={
    '연산':{score:1,tags:['REPETITION','CALCULATION']},
    '한자':{score:1,tags:['MEMORY_RECALL']},
    '국어':{score:2,tags:['READING','COMPREHENSION','WRITING']},
    '사회':{score:2,tags:['READING','CONCEPT_LINK']},
    '수학':{score:3,tags:['CONCEPT','APPLICATION','REASONING','ERROR_CORRECTION']},
    '생각하는 피자':{score:3,tags:['REASONING','EXPLORATION','SUSTAINED_THINKING']}
  };
  const ENGLISH_ACTIVITY={
    WORKBOOK_RANGE:{score:2,tags:['READING','APPLICATION']},
    PRINT:{score:2,tags:['READING','APPLICATION']},
    vocabulary:{score:1,tags:['MEMORY_RECALL']},
    listening:{score:1,tags:['LISTENING']},
    recording:{score:2,tags:['SPEAKING','RECORDING']},
    writing:{score:3,tags:['WRITING','EXPRESSION']},
    other:{score:2,tags:['OTHER']}
  };
  const id=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const localDate=()=>new Date().toLocaleDateString('sv-SE');
  const isoNow=()=>new Date().toISOString();
  const datePlus=(base,days)=>{const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()+days);return d.toLocaleDateString('sv-SE')};
  const weekday=date=>new Date(`${date}T12:00:00`).getDay();
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function normalize(p){
    p=p&&typeof p==='object'?p:{};
    p.version=Math.max(Number(p.version)||1,2);
    p.days=p.days&&typeof p.days==='object'?p.days:{};
    p.talentWeek=p.talentWeek&&typeof p.talentWeek==='object'?p.talentWeek:{};
    p.assignmentFacts=p.assignmentFacts&&typeof p.assignmentFacts==='object'?p.assignmentFacts:{};
    p.assignmentPackages=p.assignmentPackages&&typeof p.assignmentPackages==='object'?p.assignmentPackages:{};
    p.workbookRefs=p.workbookRefs&&typeof p.workbookRefs==='object'?p.workbookRefs:{};
    p.progressEvents=Array.isArray(p.progressEvents)?p.progressEvents:[];
    return p;
  }
  function load(){try{return normalize(JSON.parse(localStorage.getItem(STORE_KEY)||'null'))}catch{return normalize({})}}
  function save(p){localStorage.setItem(STORE_KEY,JSON.stringify(normalize(p)));return p}
  function ensureDay(p,date){return p.days[date]||(p.days[date]={localDate:date,createdAt:isoNow(),scheduleNote:'',tasks:[]})}
  function nextTuesdayAfter(base){
    const d=new Date(`${base}T12:00:00`);let add=(2-d.getDay()+7)%7;if(add===0)add=7;d.setDate(d.getDate()+add);return d.toLocaleDateString('sv-SE');
  }
  function appendClaim(fact,actor,fields,{confirm=false}={}){
    fact.claims=Array.isArray(fact.claims)?fact.claims:[];
    const clean=Object.fromEntries(Object.entries(fields||{}).filter(([,v])=>v!==undefined));
    let conflict=false;
    for(const [key,value] of Object.entries(clean)){
      if(value===''||value===null)continue;
      const prev=fact[key];
      if(prev!==undefined&&prev!==null&&prev!==''&&JSON.stringify(prev)!==JSON.stringify(value)&&fact.lastSourceActor&&fact.lastSourceActor!==actor)conflict=true;
    }
    fact.claims.push({actor,at:isoNow(),fields:clean});
    if(confirm||!conflict)Object.assign(fact,clean);
    fact.lastSourceActor=actor;
    fact.updatedAt=isoNow();
    if(confirm)fact.confirmationState='FACT_CONFIRMED';
    else if(conflict)fact.confirmationState='CONFIRMATION_REQUIRED';
    else if(fact.confirmationState!=='FACT_CONFIRMED')fact.confirmationState='INPUT_CAPTURED';
    return {fact,conflict};
  }
  function ensureFact(p,factId,base={}){
    return p.assignmentFacts[factId]||(p.assignmentFacts[factId]={assignmentId:factId,capturedAt:isoNow(),claims:[],analysisState:'UNVERIFIED',plannerState:'PENDING_ALLOCATION',lifecycle:'ACTIVE',confirmationState:'HOMEWORK_CONFIRMATION_PENDING',...base});
  }
  function activeFacts(p=load()){
    return Object.values(p.assignmentFacts).filter(f=>f.lifecycle!=='ARCHIVED');
  }
  function confirmFact(factId,actor='PARENT'){
    const p=load(),fact=p.assignmentFacts[factId];if(!fact)return null;
    fact.confirmationState='FACT_CONFIRMED';fact.confirmedAt=isoNow();fact.confirmedBy=actor;fact.updatedAt=isoNow();save(p);return structuredClone(fact);
  }

  function talentPackageId(base=localDate()){return `talent_week_due_${nextTuesdayAfter(base)}`}
  function upsertTalentPackage({actor='PARENT',books=[]}={}){
    const p=load(),sourceDate=localDate(),deadline=nextTuesdayAfter(sourceDate),packageId=talentPackageId(sourceDate);
    const pkg=p.assignmentPackages[packageId]||(p.assignmentPackages[packageId]={packageId,sourceType:'TALENT_WEEKLY_ASSIGNMENT',subject:'재능',sourceDate,deadlineBoundary:deadline,cycleType:'WEEKLY',factIds:[],createdAt:isoNow(),lifecycle:'ACTIVE'});
    const bySubject=new Map((books||[]).map(b=>[b.subject,b]));
    pkg.factIds=[];
    TALENT_SUBJECTS.forEach(subject=>{
      const factId=`talent_book_due_${deadline}_${subject}`;
      const fact=ensureFact(p,factId,{sourceType:'TALENT_BOOK_ASSIGNMENT',subject:'재능',talentSubject:subject,assignmentCycle:packageId,bookRef:{subject,label:subject},deadlineBoundary:deadline});
      const b=bySubject.get(subject)||{};
      appendClaim(fact,actor,{range:String(b.range||'').trim(),teacherInstruction:String(b.teacherInstruction||'').trim(),answerReferenceNote:String(b.answerReferenceNote||'').trim(),deadlineBoundary:deadline},{confirm:actor==='PARENT'});
      if(!fact.range)fact.confirmationState='HOMEWORK_CONFIRMATION_PENDING';
      fact.sourceActor=actor;fact.provenance=actor==='PARENT'?'PARENT_INPUT':'CHILD_INPUT';fact.plannerState=fact.range?'READY_FOR_ALLOCATION':'WAITING_SOURCE_FACT';
      pkg.factIds.push(factId);
    });
    pkg.confirmationState=pkg.factIds.every(fid=>p.assignmentFacts[fid]?.range)?'FACT_CONFIRMED':'HOMEWORK_CONFIRMATION_PENDING';
    pkg.updatedAt=isoNow();save(p);
    const allocation=allocateTalentPackage(packageId);
    return {packageId,deadline,allocation,package:structuredClone(load().assignmentPackages[packageId])};
  }

  function talentWindow(sourceDate,deadline){
    const out=[];for(let d=sourceDate;d<deadline;d=datePlus(d,1)){
      const wd=weekday(d);if(wd===0||wd===1)continue;out.push(d);
    }return out;
  }
  function taskLocations(p,predicate){
    const out=[];for(const [date,day] of Object.entries(p.days))for(const task of (day.tasks||[]))if(predicate(task))out.push({date,day,task});return out;
  }
  function removeTask(day,task){day.tasks=(day.tasks||[]).filter(t=>t!==task)}
  function retireLegacyTalent(p,subjects){
    for(const day of Object.values(p.days)){
      day.tasks=(day.tasks||[]).filter(t=>{
        if(!t.talentBatchId||!subjects.includes(t.talentSubject))return true;
        if(['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(t.status)){t.legacyAllocationState='PRESERVED_HISTORY';return true}
        return false;
      });
    }
  }
  function chooseActivityDay(p,dates,profile,planned){
    const candidates=dates.map(date=>{
      const existing=(p.days[date]?.tasks||[]).reduce((sum,t)=>sum+Number(t.activityLoadScore||0),0);
      const newScore=(planned[date]||[]).reduce((sum,x)=>sum+x.score,0);
      const sameHeavy=(profile.score>=3&&(planned[date]||[]).some(x=>x.score>=3&&x.tags.some(tag=>profile.tags.includes(tag))))?4:0;
      return {date,score:existing+newScore+sameHeavy};
    });
    candidates.sort((a,b)=>a.score-b.score||a.date.localeCompare(b.date));return candidates[0]?.date||null;
  }
  function allocateTalentPackage(packageId){
    if(window.ReadyFoundationV1?.enabled)return {ok:false,reason:'FOUNDATION_INTERPRETATION_REQUIRED'};
    const p=load(),pkg=p.assignmentPackages[packageId];if(!pkg)return{ok:false,reason:'PACKAGE_NOT_FOUND'};
    const facts=(pkg.factIds||[]).map(id=>p.assignmentFacts[id]).filter(f=>f&&f.range&&f.confirmationState==='FACT_CONFIRMED');
    if(!facts.length)return{ok:false,reason:'NO_CONFIRMED_BOOK_FACTS'};
    const dates=talentWindow(pkg.sourceDate||localDate(),pkg.deadlineBoundary||nextTuesdayAfter(localDate()));
    if(!dates.length)return{ok:false,reason:'NO_PLANNER_WINDOW'};
    retireLegacyTalent(p,facts.map(f=>f.talentSubject));
    const planned={};dates.forEach(d=>planned[d]=[]);
    const allocations=[];
    const ordered=[...facts].sort((a,b)=>(TALENT_ACTIVITY[b.talentSubject]?.score||2)-(TALENT_ACTIVITY[a.talentSubject]?.score||2));
    ordered.forEach(fact=>{
      const profile=TALENT_ACTIVITY[fact.talentSubject]||{score:2,tags:['GENERAL']};
      const existing=taskLocations(p,t=>t.sourceAssignmentId===fact.assignmentId)[0];
      let targetDate=existing&&['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(existing.task.status)?existing.date:chooseActivityDay(p,dates,profile,planned);
      if(!targetDate)return;
      const task=existing?.task||{id:id('todo'),selected:false,status:'PLANNED'};
      if(existing&&existing.date!==targetDate&&!['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(task.status)){removeTask(existing.day,task);ensureDay(p,targetDate).tasks.push(task)}
      if(!existing)ensureDay(p,targetDate).tasks.push(task);
      Object.assign(task,{localDate:targetDate,subject:'재능',talentSubject:fact.talentSubject,sourceAssignmentId:fact.assignmentId,sourcePackageId:packageId,sourceType:'TALENT_WEEKLY_ASSIGNMENT',title:`재능 · ${fact.talentSubject}`,volume:fact.range,difficulty:'SUBJECT_INTERPRETATION_PENDING',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:pkg.deadlineBoundary,required:true,activityLoadScore:profile.score,activityLoadTags:profile.tags,interpretationKind:'BASELINE_ACTIVITY_PROFILE',unitKind:'BOOK_RANGE_WHOLE_UNIT_PENDING_DECOMPOSITION',allocationState:'PROVISIONAL_SCHEDULE_AWARENESS_PENDING',gradingFlow:'CHILD_SOLVE → DAYTIME_PARENT_GRADING → NEXT_STUDY_FIRST_CORRECTION',note:'주간 원본 FACT 기반 · 분/페이지 수 우선 분할 금지 · 실제 시간은 후속 안전/피드백 값'});
      fact.plannerState='PLANNER_ALLOCATED';
      planned[targetDate].push(profile);allocations.push({assignmentId:fact.assignmentId,date:targetDate,subject:fact.talentSubject,activityLoad:profile.tags});
    });
    pkg.plannerState='PLANNER_ALLOCATED';pkg.allocation=allocations;pkg.updatedAt=isoNow();
    p.talentWeek[packageId]={packageId,sourceDate:pkg.sourceDate,deadlineBoundary:pkg.deadlineBoundary,allocation:allocations,semantics:'ACTIVITY_LOAD_FIRST_TIME_SECONDARY'};
    save(p);return{ok:true,packageId,allocations};
  }

  function activeEnglishFact(p){
    return Object.values(p.assignmentFacts).filter(f=>f.sourceType==='ENGLISH_ACADEMY_PACKAGE'&&f.lifecycle==='ACTIVE'&&f.plannerState!=='SUBMITTED').sort((a,b)=>String(b.updatedAt||b.capturedAt).localeCompare(String(a.updatedAt||a.capturedAt)))[0]||null;
  }
  function upsertEnglishPackage({actor='PARENT',workbookName,range,nextAcademy,prints,components,teacherInstruction}={}){
    const p=load();
    let fact=activeEnglishFact(p);
    if(!fact){const factId=id('english_assignment');fact=ensureFact(p,factId,{sourceType:'ENGLISH_ACADEMY_PACKAGE',subject:'영어',sourceActor:actor,provenance:actor==='PARENT'?'PARENT_INPUT':'CHILD_INPUT',assignmentCycle:'ACADEMY_TO_NEXT_ACADEMY',lifecycle:'ACTIVE'});}
    const workbookId='english_workbook_primary';
    if(workbookName!==undefined&&String(workbookName||'').trim())p.workbookRefs[workbookId]={workbookRefId:workbookId,subject:'영어',name:String(workbookName).trim(),updatedAt:isoNow(),sourceActor:actor};
    const fields={};
    if(workbookName!==undefined)fields.workbookRefId=workbookId;
    if(range!==undefined)fields.range=String(range||'').trim();
    if(nextAcademy!==undefined)fields.nextAcademy=String(nextAcademy||'').trim();
    if(prints!==undefined)fields.printUnits=prints||{};
    if(components!==undefined)fields.components=components||{};
    if(teacherInstruction!==undefined)fields.teacherInstruction=String(teacherInstruction||'').trim();
    const {conflict}=appendClaim(fact,actor,fields,{confirm:actor==='PARENT'});
    fact.deadlineBoundary=validDate(fact.nextAcademy)?fact.nextAcademy:null;
    fact.deadlineState=fact.deadlineBoundary?'CONFIRMED':'NEXT_ACADEMY_UNVERIFIED';
    if(actor!=='PARENT'&&!fact.range)fact.confirmationState='HOMEWORK_CONFIRMATION_PENDING';
    if(conflict)fact.confirmationState='CONFIRMATION_REQUIRED';
    fact.plannerState=fact.confirmationState==='FACT_CONFIRMED'?(fact.deadlineBoundary?'READY_FOR_ALLOCATION':'WAITING_NEXT_ACADEMY'):'WAITING_CONFIRMATION';
    save(p);
    const allocation=allocateEnglishPackage(fact.assignmentId);
    return {assignmentId:fact.assignmentId,conflict,allocation,fact:structuredClone(load().assignmentFacts[fact.assignmentId])};
  }
  function englishUnits(fact,p){
    const units=[];const workbook=p.workbookRefs[fact.workbookRefId];
    if(fact.range)units.push({key:'workbook',kind:'WORKBOOK_RANGE',title:`영어 · ${workbook?.name||'문제집'} ${fact.range}`,volume:fact.range,profile:ENGLISH_ACTIVITY.WORKBOOK_RANGE});
    const dayMap={MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6,SUN:0};
    for(const [key,value] of Object.entries(fact.printUnits||{}))if(String(value||'').trim())units.push({key:`print_${key}`,kind:'PRINT',weekday:dayMap[key],title:`영어 · ${key} 프린트`,volume:String(value).trim(),profile:ENGLISH_ACTIVITY.PRINT});
    for(const [key,value] of Object.entries(fact.components||{}))if(String(value||'').trim())units.push({key:`component_${key}`,kind:key,title:`영어 · ${key}`,volume:String(value).trim(),profile:ENGLISH_ACTIVITY[key]||ENGLISH_ACTIVITY.other});
    return units;
  }
  function englishWindow(base,deadline){const out=[];for(let d=base;d<deadline;d=datePlus(d,1))out.push(d);return out}
  function chooseEnglishDay(p,dates,unit,planned){
    if(Number.isInteger(unit.weekday)){const exact=dates.find(d=>weekday(d)===unit.weekday);if(exact)return exact}
    return chooseActivityDay(p,dates,unit.profile||ENGLISH_ACTIVITY.other,planned);
  }
  function allocateEnglishPackage(factId){
    if(window.ReadyFoundationV1?.enabled)return {ok:false,reason:'FOUNDATION_INTERPRETATION_REQUIRED'};
    const p=load(),fact=p.assignmentFacts[factId];if(!fact)return{ok:false,reason:'FACT_NOT_FOUND'};
    if(fact.confirmationState!=='FACT_CONFIRMED')return{ok:false,reason:'FACT_NOT_CONFIRMED'};
    if(!validDate(fact.deadlineBoundary)||fact.deadlineBoundary<=localDate()){fact.plannerState='WAITING_NEXT_ACADEMY';save(p);return{ok:false,reason:'NEXT_ACADEMY_UNVERIFIED'};}
    const units=englishUnits(fact,p);if(!units.length)return{ok:false,reason:'NO_HOMEWORK_FACTS'};
    const dates=englishWindow(localDate(),fact.deadlineBoundary);if(!dates.length)return{ok:false,reason:'NO_PLANNER_WINDOW'};
    const planned={};dates.forEach(d=>planned[d]=[]);const allocations=[];
    units.forEach(unit=>{
      const sourceUnitId=`${fact.assignmentId}:${unit.key}`;
      const existing=taskLocations(p,t=>t.sourceUnitId===sourceUnitId)[0];
      let targetDate=existing&&['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(existing.task.status)?existing.date:chooseEnglishDay(p,dates,unit,planned);
      if(!targetDate)return;
      const task=existing?.task||{id:id('todo'),selected:false,status:'PLANNED'};
      if(existing&&existing.date!==targetDate&&!['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(task.status)){removeTask(existing.day,task);ensureDay(p,targetDate).tasks.push(task)}
      if(!existing)ensureDay(p,targetDate).tasks.push(task);
      const profile=unit.profile||ENGLISH_ACTIVITY.other;
      Object.assign(task,{localDate:targetDate,subject:'영어',sourceAssignmentId:fact.assignmentId,sourceUnitId,sourceType:'ENGLISH_ACADEMY_PACKAGE',title:unit.title,volume:unit.volume,difficulty:'SUBJECT_INTERPRETATION_PENDING',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:fact.deadlineBoundary,required:true,activityLoadScore:profile.score,activityLoadTags:profile.tags,unitKind:unit.kind,allocationState:'PROVISIONAL_SCHEDULE_AWARENESS_PENDING',note:'영어 전체 숙제 FACT와 오늘 실행 단위를 분리 · 프린트는 독립 단위 · 실제 시간은 후속 피드백 값'});
      planned[targetDate].push(profile);allocations.push({sourceUnitId,date:targetDate,kind:unit.kind});
    });
    fact.plannerState='PLANNER_ALLOCATED';fact.allocation=allocations;fact.updatedAt=isoNow();save(p);return{ok:true,assignmentId:fact.assignmentId,allocations};
  }

  function addSchoolEvent({actor='CHILD',title,subject='학교',range='',deadline=''}={}){
    title=String(title||'').trim();if(!title)return null;
    const p=load(),date=localDate(),factId=id('school_event');
    const fact=ensureFact(p,factId,{sourceType:'SCHOOL_EVENT',subject:String(subject||'학교').trim()||'학교',sourceActor:actor,provenance:actor==='PARENT'?'PARENT_INPUT':'CHILD_INPUT',assignmentCycle:'AD_HOC',localDate:date,lifecycle:'ACTIVE'});
    appendClaim(fact,actor,{title,range:String(range||'').trim(),deadlineBoundary:String(deadline||'').trim()},{confirm:actor==='PARENT'});
    if(actor==='CHILD')fact.confirmationState='INPUT_CAPTURED';
    fact.plannerState='PLANNER_REEVALUATED_TODAY';
    if(window.ReadyFoundationV1?.enabled){fact.plannerState='WAITING_LEARNING_INTERPRETATION';save(p);return {fact:structuredClone(fact),task:null};}
    const day=ensureDay(p,date),task={id:id('todo'),localDate:date,subject:fact.subject,sourceAssignmentId:factId,sourceType:'SCHOOL_EVENT',title,volume:fact.range,difficulty:'UNVERIFIED',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:fact.deadlineBoundary||'미확정',selected:false,status:'PLANNED',origin:actor==='CHILD'?'CHILD_ADDED':'PARENT_INPUT',reviewState:actor==='CHILD'?'PARENT_REVIEW_PENDING':'PARENT_REVIEWED',allocationState:'PLANNER_REEVALUATED_TODAY',note:'갑작스런 학교/이벤트 FACT · 출처 보존 · 주간 배정 권한과 분리'};
    day.tasks.push(task);save(p);return{fact:structuredClone(fact),task:structuredClone(task)};
  }

  function assignmentView(){
    const p=load();return activeFacts(p).map(f=>({assignmentId:f.assignmentId,sourceType:f.sourceType,subject:f.subject,talentSubject:f.talentSubject||null,title:f.title||null,range:f.range||'',deadlineBoundary:f.deadlineBoundary||null,confirmationState:f.confirmationState,plannerState:f.plannerState,workbook:p.workbookRefs[f.workbookRefId]?.name||null,printUnits:f.printUnits||{},components:f.components||{},provenance:f.provenance||f.sourceActor||null}));
  }

  function validate(){
    const p=load();const facts=activeFacts(p);
    const legacyNormalNextTue=Object.values(p.talentWeek||{}).some(x=>x?.allocation?.some?.(a=>a.slot==='NEXT_TUE'));
    return{version:VERSION,modelVersion:p.version,assignmentFactModel:true,assignmentFactCount:facts.length,parentMinutesAuthority:false,nextTuesdayNormalSlot:false,minuteCapacityAuthority:false,legacyNormalNextTueDetected:legacyNormalNextTue,plannerOwnsDatedTasks:true};
  }
  function boot(){
    document.documentElement.dataset.readyStageE=VERSION;save(load());
    window.ReadyAssignmentModel=Object.freeze({version:VERSION,load,save,activeFacts,assignmentView,confirmFact,upsertTalentPackage,allocateTalentPackage,upsertEnglishPackage,allocateEnglishPackage,addSchoolEvent,TALENT_SUBJECTS});
    window.ReadyStageE=Object.freeze({version:VERSION,validate,allocateTalentPackage,allocateEnglishPackage});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();