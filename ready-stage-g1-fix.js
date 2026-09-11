(() => {
  'use strict';

  const VERSION='2026.09.08-stage-g1.1-regression-fix';
  const BASE=window.ReadyAssignmentModel;
  if(!BASE) throw new Error('STAGE_G11_BASE_MODEL_MISSING');

  const original={
    upsertTalentPackage:BASE.upsertTalentPackage.bind(BASE),
    upsertEnglishPackage:BASE.upsertEnglishPackage.bind(BASE),
    addSchoolEvent:BASE.addSchoolEvent.bind(BASE),
    confirmFact:BASE.confirmFact.bind(BASE)
  };
  const clone=v=>v==null?v:structuredClone(v);
  const datePlus=(base,days)=>{const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()+days);return d.toLocaleDateString('sv-SE')};
  const weekday=date=>new Date(`${date}T12:00:00`).getDay();
  const nonempty=v=>String(v??'').trim().length>0;
  const hasValues=obj=>Object.values(obj||{}).some(nonempty);

  function latestEnglishFact(p){
    return Object.values(p.assignmentFacts||{}).filter(f=>f.sourceType==='ENGLISH_ACADEMY_PACKAGE'&&f.lifecycle==='ACTIVE')
      .sort((a,b)=>String(b.updatedAt||b.capturedAt).localeCompare(String(a.updatedAt||a.capturedAt)))[0]||null;
  }
  function talentFactBySubject(p,subject){
    return Object.values(p.assignmentFacts||{}).filter(f=>f.sourceType==='TALENT_BOOK_ASSIGNMENT'&&f.talentSubject===subject&&f.lifecycle!=='ARCHIVED')
      .sort((a,b)=>String(b.updatedAt||b.capturedAt).localeCompare(String(a.updatedAt||a.capturedAt)))[0]||null;
  }
  function reconcileProvenance(p,fact){
    if(!fact)return;
    const actors=[...new Set((fact.claims||[]).map(c=>c.actor).filter(Boolean))];
    fact.sourceActors=actors;
    fact.provenance=actors.length>1?'MULTI_SOURCE':actors[0]?`${actors[0]}_INPUT`:fact.provenance||null;
  }
  function preserveTalentNotes(args){
    const p=BASE.load();
    return {...args,books:(args.books||[]).map(book=>{
      const fact=talentFactBySubject(p,book.subject);if(!fact)return book;
      return {...book,
        teacherInstruction:nonempty(book.teacherInstruction)?book.teacherInstruction:(fact.teacherInstruction||''),
        answerReferenceNote:nonempty(book.answerReferenceNote)?book.answerReferenceNote:(fact.answerReferenceNote||'')
      };
    })};
  }
  function preserveEnglishHiddenFields(args){
    const p=BASE.load(),fact=latestEnglishFact(p);if(!fact)return args;
    const next={...args};
    if(next.prints&& !hasValues(next.prints) && hasValues(fact.printUnits)) next.prints=clone(fact.printUnits);
    if(next.components&& !hasValues(next.components) && hasValues(fact.components)) next.components=clone(fact.components);
    if(next.teacherInstruction!==undefined && !nonempty(next.teacherInstruction) && nonempty(fact.teacherInstruction)) next.teacherInstruction=fact.teacherInstruction;
    return next;
  }
  function candidateTalentDates(sourceDate,deadline){
    const dates=[];
    for(let d=datePlus(sourceDate,1);d<deadline;d=datePlus(d,1)){
      const wd=weekday(d);
      if(wd>=3&&wd<=6)dates.push(d);
    }
    return dates;
  }
  function moveTask(p,fromDate,toDate,task){
    const from=p.days?.[fromDate];if(!from)return;
    from.tasks=(from.tasks||[]).filter(t=>t!==task);
    const to=p.days[toDate]||(p.days[toDate]={localDate:toDate,createdAt:new Date().toISOString(),scheduleNote:'',tasks:[]});
    task.localDate=toDate;to.tasks.push(task);
  }
  function repairTalentTuesday(packageId){
    if(window.ReadyFoundationV1?.enabled)return {superseded:true};
    const p=BASE.load(),pkg=p.assignmentPackages?.[packageId];if(!pkg)return{moved:0};
    const candidates=candidateTalentDates(pkg.sourceDate,pkg.deadlineBoundary);if(!candidates.length)return{moved:0};
    const movable=[];
    Object.entries(p.days||{}).forEach(([date,day])=>(day.tasks||[]).forEach(task=>{
      if(task.sourcePackageId===packageId&&weekday(date)===2&&!['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(task.status))movable.push({date,task});
    }));
    let moved=0;
    movable.forEach(({date,task})=>{
      const target=[...candidates].sort((a,b)=>{
        const loadA=(p.days[a]?.tasks||[]).reduce((s,t)=>s+Number(t.activityLoadScore||0),0);
        const loadB=(p.days[b]?.tasks||[]).reduce((s,t)=>s+Number(t.activityLoadScore||0),0);
        return loadA-loadB||a.localeCompare(b);
      })[0];
      if(!target)return;
      moveTask(p,date,target,task);moved++;
      (pkg.allocation||[]).forEach(a=>{if(a.assignmentId===task.sourceAssignmentId)a.date=target});
      const tw=p.talentWeek?.[packageId];(tw?.allocation||[]).forEach(a=>{if(a.assignmentId===task.sourceAssignmentId)a.date=target});
    });
    if(moved)BASE.save(p);
    return{moved,candidates};
  }
  function correctEnglishState(assignmentId){
    const p=BASE.load(),fact=p.assignmentFacts?.[assignmentId];if(!fact)return null;
    reconcileProvenance(p,fact);
    const substantive=nonempty(fact.range)||hasValues(fact.printUnits)||hasValues(fact.components)||nonempty(fact.teacherInstruction);
    if(!substantive){fact.confirmationState='HOMEWORK_CONFIRMATION_PENDING';fact.plannerState='WAITING_CONFIRMATION';}
    BASE.save(p);return clone(fact);
  }

  const WRAPPED=Object.freeze({...BASE,
    upsertTalentPackage(args={}){
      const result=original.upsertTalentPackage(preserveTalentNotes(args));
      const repair=repairTalentTuesday(result?.packageId);
      return {...result,sourceDayCorrection:repair};
    },
    upsertEnglishPackage(args={}){
      const result=original.upsertEnglishPackage(preserveEnglishHiddenFields(args));
      const fact=correctEnglishState(result?.assignmentId);
      return {...result,fact,confirmationState:fact?.confirmationState};
    },
    addSchoolEvent(args={}){
      const result=original.addSchoolEvent(args);if(!result?.fact?.assignmentId)return result;
      const p=BASE.load(),fact=p.assignmentFacts?.[result.fact.assignmentId];reconcileProvenance(p,fact);BASE.save(p);
      return {...result,fact:clone(fact)};
    },
    confirmFact(factId,actor='PARENT'){
      const result=original.confirmFact(factId,actor);const p=BASE.load(),fact=p.assignmentFacts?.[factId];reconcileProvenance(p,fact);BASE.save(p);return clone(fact||result);
    }
  });
  window.ReadyAssignmentModel=WRAPPED;

  function hydrateParentInputs(){
    if(document.documentElement.dataset.readyRole!=='PARENT')return;
    const root=document.getElementById('rsfParent');if(!root)return;
    const p=WRAPPED.load(),english=latestEnglishFact(p);
    root.querySelectorAll('[data-rsf-talent]').forEach(row=>{
      const fact=talentFactBySubject(p,row.dataset.rsfTalent);if(!fact)return;
      const ins=row.querySelector('[data-instruction]'),ans=row.querySelector('[data-answer]');
      if(ins&&!ins.dataset.g11Hydrated){ins.value=fact.teacherInstruction||'';ins.dataset.g11Hydrated='1'}
      if(ans&&!ans.dataset.g11Hydrated){ans.value=fact.answerReferenceNote||'';ans.dataset.g11Hydrated='1'}
    });
    if(!english)return;
    const instruction=root.querySelector('#rsfEnglishInstruction');
    if(instruction&&!instruction.dataset.g11Hydrated){instruction.value=english.teacherInstruction||'';instruction.dataset.g11Hydrated='1'}
    root.querySelectorAll('[data-print]').forEach(el=>{if(!el.dataset.g11Hydrated){el.value=english.printUnits?.[el.dataset.print]||'';el.dataset.g11Hydrated='1'}});
    root.querySelectorAll('[data-component]').forEach(el=>{if(!el.dataset.g11Hydrated){el.value=english.components?.[el.dataset.component]||'';el.dataset.g11Hydrated='1'}});
  }
  function migrateExistingTuesdayTasks(){
    const p=WRAPPED.load();
    Object.values(p.assignmentPackages||{}).filter(pkg=>pkg.sourceType==='TALENT_WEEKLY_ASSIGNMENT').forEach(pkg=>repairTalentTuesday(pkg.packageId));
  }
  function validate(){
    const p=WRAPPED.load();let activeTuesday=0;
    Object.entries(p.days||{}).forEach(([date,day])=>{if(weekday(date)!==2)return;(day.tasks||[]).forEach(t=>{if(t.sourceType==='TALENT_WEEKLY_ASSIGNMENT'&&!['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(t.status))activeTuesday++})});
    return{version:VERSION,wrappedModel:window.ReadyAssignmentModel===WRAPPED,talentSourceTuesdayActiveTasks:activeTuesday,hiddenFieldHydration:true,multiSourceProvenance:true};
  }
  function boot(){
    document.documentElement.dataset.readyStageG11=VERSION;
    migrateExistingTuesdayTasks();hydrateParentInputs();
    let scheduled=false;const target=document.getElementById('missionView')||document.body;
    const mo=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;hydrateParentInputs()})});
    mo.observe(target,{childList:true,subtree:true});
    window.ReadyStageG11=Object.freeze({version:VERSION,hydrateParentInputs,validate});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();