(() => {
  'use strict';

  const VERSION='2026.09.09-stage-g1.4-planner-authority';
  const STORE_KEY='readyset_planner_v1';
  const WD=['일','월','화','수','목','금','토'];
  const ISO=()=>new Date().toISOString();
  const LOCAL=()=>new Date().toLocaleDateString('sv-SE');
  const datePlus=(base,n)=>{const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
  const dateFromIso=v=>{try{return new Date(v).toLocaleDateString('sv-SE')}catch{return LOCAL()}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  // Snapshot from the current Notion Ready & Set timetable rows whose
  // 확인 상태=확정 and Ready & Set 연동=true. Missing rows are NOT free-time evidence.
  const SCHEDULE_AUTHORITY={
    authorityId:'notion_ready_set_confirmed_2026-09-09',
    source:'NOTION_READY_SET_TIMETABLE_CONFIRMED_ROWS',
    sourceDataSource:'collection://8864a66f-9375-4fc0-86f8-0046a5abee5a',
    capturedAt:'2026-09-09T10:00:00+09:00',
    semantics:'BASE_TIMETABLE_CONFIRMED_ROWS_ONLY',
    noFreeTimeInference:true,
    rows:[
      {weekday:'월',activity:'영어학원',kind:'학원',start:'16:00',end:'18:00'},
      {weekday:'월',activity:'과학학원',kind:'학원',start:'19:00',end:'20:00'},
      {weekday:'화',activity:'피아노',kind:'학원',start:'14:00',end:'16:00'},
      {weekday:'수',activity:'영어학원',kind:'학원',start:'16:00',end:'18:00'},
      {weekday:'목',activity:'태권도',kind:'학원',start:'16:30',end:'18:00'},
      {weekday:'금',activity:'영어학원',kind:'학원',start:'16:00',end:'18:00'}
    ]
  };

  const LIFESTYLE_POLICY={
    wakeTarget:'07:00',
    sleepPlanningBoundary:'22:00',
    sleepBoundaryKind:'SAFETY_UPPER_BOUND_NOT_ROUTINE_TARGET',
    morning:{
      kind:'BREAKFAST_ANCHORED_SHORT_FOCUS',
      preBreakfastStudy:{durationRangeMin:[10,15],required:false},
      familyBreakfast:{timeRange:['07:40','08:00'],kind:'FIXED_FAMILY_ANCHOR',timer:false},
      postBreakfastStudy:{durationRangeMin:[10,15],required:false},
      finalPrepAround:'08:20',
      totalLearningRangeMin:[20,30],
      semantics:'CAPACITY_CANDIDATE_NOT_REQUIRED_STUDY_AMOUNT'
    },
    afternoonFocus:{candidatePattern:'25+5+25',mechanical:false,breakTimerCandidate:true},
    saturdaySplit:{status:'CANDIDATE_PREFERENCE',hardLock:false},
    freeTimeRule:'FREE_TIME_EXISTS_NE_MUST_STUDY',
    minuteRule:'MINUTES_NE_PRIMARY_SPLIT_UNIT'
  };

  function load(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null')||{}}catch{return {}}}
  function save(p){localStorage.setItem(STORE_KEY,JSON.stringify(p));return p}
  function ensureShape(p){
    p.days=p.days&&typeof p.days==='object'?p.days:{};
    p.assignmentFacts=p.assignmentFacts&&typeof p.assignmentFacts==='object'?p.assignmentFacts:{};
    p.assignmentPackages=p.assignmentPackages&&typeof p.assignmentPackages==='object'?p.assignmentPackages:{};
    p.progressEvents=Array.isArray(p.progressEvents)?p.progressEvents:[];
    return p;
  }
  function weekday(date){return WD[new Date(`${date}T12:00:00`).getDay()]}
  function rowsForDate(date){if(window.ReadyFoundationControlV1)return window.ReadyFoundationV1.effective(window.ReadyFoundationControlV1.load(),date).events.map(e=>({...e,activity:e.title}));const w=weekday(date);return SCHEDULE_AUTHORITY.rows.filter(r=>r.weekday===w)}
  function rowsForActivity(activity){return SCHEDULE_AUTHORITY.rows.filter(r=>r.activity===activity)}
  function nextConfirmedClassDate(activity,afterDate,{includeSame=false}={}){
    const rows=rowsForActivity(activity);if(!window.ReadyFoundationV1?.enabled&&!rows.length)return null;
    for(let i=includeSame?0:1;i<=21;i++){
      const date=datePlus(afterDate,i),w=weekday(date);
      if(window.ReadyFoundationV1?.enabled?rowsForDate(date).some(r=>r.activity===activity):rows.some(r=>r.weekday===w))return date;
    }
    return null;
  }
  function taskLocations(p,predicate){
    const out=[];for(const [date,day] of Object.entries(p.days||{}))for(const task of (day.tasks||[]))if(predicate(task))out.push({date,day,task});return out;
  }
  function ensureDay(p,date){return p.days[date]||(p.days[date]={localDate:date,createdAt:ISO(),scheduleNote:'',tasks:[]})}
  function stableStatus(t){return ['COMPLETED','IN_PROGRESS','WAITING_FOR_PARENT'].includes(t?.status)}
  function moveTask(p,loc,targetDate){
    if(!loc||loc.date===targetDate||stableStatus(loc.task))return loc?.task||null;
    loc.day.tasks=(loc.day.tasks||[]).filter(x=>x!==loc.task);ensureDay(p,targetDate).tasks.push(loc.task);loc.task.localDate=targetDate;return loc.task;
  }
  function datesBetween(startExclusive,endExclusive){
    const out=[];for(let d=datePlus(startExclusive,1);d<endExclusive;d=datePlus(d,1))out.push(d);return out;
  }
  function chooseDateByExistingLoad(p,dates){
    if(!dates.length)return null;
    return [...dates].map(date=>({date,count:(p.days?.[date]?.tasks||[]).filter(t=>t.status!=='COMPLETED').length}))
      .sort((a,b)=>a.count-b.count||a.date.localeCompare(b.date))[0]?.date||null;
  }

  function reconcileEnglish(p){
    const facts=Object.values(p.assignmentFacts).filter(f=>f.sourceType==='ENGLISH_ACADEMY_PACKAGE'&&f.lifecycle!=='ARCHIVED');
    const changes=[];
    facts.forEach(f=>{
      const sourceDate=f.sourceClassDate||f.sourceDate||dateFromIso(f.capturedAt||f.updatedAt||ISO());
      const timetableNext=nextConfirmedClassDate('영어학원',sourceDate);
      if(!timetableNext)return;
      const explicit=f.nextAcademy&&/^\d{4}-\d{2}-\d{2}$/.test(f.nextAcademy)?f.nextAcademy:null;
      // Explicit confirmed exception remains possible, but recurring base timetable is the default authority.
      const boundary=explicit||timetableNext;
      f.sourceClassDate=f.sourceClassDate||sourceDate;
      f.deadlineBoundary=boundary;
      f.deadlineState=explicit?'EXPLICIT_NEXT_ACADEMY_CONFIRMED':'BASE_TIMETABLE_DERIVED';
      f.scheduleAuthorityId=SCHEDULE_AUTHORITY.authorityId;
      f.cycleType='ACADEMY_TO_NEXT_ACTUAL_CONFIRMED_CLASS';
      const locs=taskLocations(p,t=>t.sourceAssignmentId===f.assignmentId);
      const candidates=datesBetween(sourceDate,boundary);
      locs.forEach(loc=>{
        loc.task.deadline=boundary;
        loc.task.cycleBoundary=boundary;
        loc.task.scheduleAuthorityId=SCHEDULE_AUTHORITY.authorityId;
        loc.task.allocationState='BASE_TIMETABLE_AUTHORITY_APPLIED';
        if(loc.date>=boundary&&!stableStatus(loc.task)){
          const target=chooseDateByExistingLoad(p,candidates);if(target){moveTask(p,loc,target);changes.push({taskId:loc.task.id,from:loc.date,to:target,reason:'ENGLISH_NEXT_CLASS_BOUNDARY'});}
        }
      });
    });
    return changes;
  }

  function reconcileTalent(p){
    const changes=[];
    for(const pkg of Object.values(p.assignmentPackages||{})){
      if(pkg.sourceType!=='TALENT_WEEKLY_ASSIGNMENT'||pkg.lifecycle==='ARCHIVED')continue;
      pkg.scheduleAuthorityId=SCHEDULE_AUTHORITY.authorityId;
      pkg.talentVisitAuthority='NOTION_ROW_NOT_CONFIRMED';
      pkg.plannerGuard='DO_NOT_INFER_WEEKDAY_FROM_MISSING_TIMETABLE_ROW';
      const start=pkg.sourceDate,end=pkg.deadlineBoundary;if(!start||!end)continue;
      const candidates=datesBetween(start,end);
      (pkg.factIds||[]).forEach(fid=>{
        const f=p.assignmentFacts[fid];if(!f)return;
        f.scheduleAuthorityId=SCHEDULE_AUTHORITY.authorityId;
        f.boundaryAuthority='PACKAGE_FACT_PENDING_TIMETABLE_CONFIRMATION';
        const loc=taskLocations(p,t=>t.sourceAssignmentId===fid)[0];if(!loc)return;
        loc.task.scheduleAuthorityId=SCHEDULE_AUTHORITY.authorityId;
        loc.task.allocationState='SCHEDULE_AUTHORITY_PARTIAL_TALENT_VISIT_UNVERIFIED';
        if((loc.date<=start||loc.date>=end)&&!stableStatus(loc.task)){
          const target=chooseDateByExistingLoad(p,candidates);if(target){moveTask(p,loc,target);changes.push({taskId:loc.task.id,from:loc.date,to:target,reason:'TALENT_SOURCE_OR_BOUNDARY_GUARD'});}
        }
      });
    }
    return changes;
  }

  function recoverGrading(p){
    let count=0;
    for(const day of Object.values(p.days||{}))for(const t of (day.tasks||[])){
      if(t.subject!=='재능'&&t.sourceType!=='TALENT_WEEKLY_ASSIGNMENT')continue;
      t.gradingDependency={
        solve:'CHILD_SOLVE',
        grading:'DAYTIME_PARENT_GRADING',
        correction:'NEXT_STUDY_FIRST_CORRECTION',
        parentGradingIsChildStudy:false,
        correctionCanCarryOver:true
      };
      count++;
    }
    return count;
  }

  function addScienceHomework({actor='PARENT',title='과학학원 숙제',volume='',sourceClassDate=LOCAL()}={}){
    const p=ensureShape(load());
    const isClassDay=rowsForDate(sourceClassDate).some(r=>r.activity==='과학학원');
    const nextClass=nextConfirmedClassDate('과학학원',sourceClassDate);
    const id=`science_academy_${sourceClassDate}_${Date.now()}`;
    const fact={
      assignmentId:id,sourceType:'SCIENCE_ACADEMY_HOMEWORK',subject:'과학학원',title:String(title||'과학학원 숙제').trim(),range:String(volume||'').trim(),
      sourceActor:actor,provenance:actor==='PARENT'?'PARENT_INPUT':'CHILD_INPUT',capturedAt:ISO(),sourceClassDate,
      sourceClassAuthority:isClassDay?'BASE_TIMETABLE_CONFIRMED':'SOURCE_CLASS_DATE_UNVERIFIED',
      assignmentCycle:'CONDITIONAL_ACADEMY_TO_NEXT_ACADEMY',homeworkOccurred:true,
      deadlineBoundary:nextClass,deadlineState:nextClass?'BASE_TIMETABLE_DERIVED':'NEXT_ACADEMY_UNVERIFIED',
      confirmationState:actor==='PARENT'?'FACT_CONFIRMED':'CONFIRMATION_REQUIRED',plannerState:nextClass?'READY_FOR_ALLOCATION':'WAITING_NEXT_ACADEMY',lifecycle:'ACTIVE',scheduleAuthorityId:SCHEDULE_AUTHORITY.authorityId
    };
    p.assignmentFacts[id]=fact;
    if(nextClass&&!window.ReadyFoundationV1?.enabled){
      const candidates=datesBetween(sourceClassDate,nextClass);const target=chooseDateByExistingLoad(p,candidates);
      if(target){ensureDay(p,target).tasks.push({id:`todo_${id}`,localDate:target,subject:'과학학원',sourceType:'SCIENCE_ACADEMY_HOMEWORK',sourceAssignmentId:id,title:fact.title,volume:fact.range||'분량/단위 확인 필요',status:'PLANNED',selected:false,deadline:nextClass,cycleBoundary:nextClass,required:true,estimatedMin:null,allocationState:'LIGHT_LOAD_DEFAULT_SINGLE_UNIT',scheduleAuthorityId:SCHEDULE_AUTHORITY.authorityId,note:'과학학원 숙제가 실제 발생한 경우만 생성 · 기본은 불필요한 분할 없음'});fact.plannerState='PLANNER_ALLOCATED';fact.allocatedDate=target;}
    }
    save(p);window.ReadyStageG12?.render?.();window.ReadyStageF?.render?.();return structuredClone(fact);
  }

  function installScienceParentUI(){
    if(new URLSearchParams(location.search).get('role')!=='parent')return;
    const root=document.getElementById('rsfParent');if(!root||document.getElementById('g14Science'))return;
    const sec=document.createElement('div');sec.id='g14Science';sec.className='rsf-section';
    sec.innerHTML=`<h3>과학학원 · 숙제가 실제 나온 날만</h3><p>과학학원 일정 자체가 아니라, 이번 수업에서 숙제가 실제 발생했을 때만 FACT를 만들어요. 다음 실제 과학학원 수업은 Cycle Boundary예요.</p><div class="rsf-grid"><input id="g14ScienceTitle" placeholder="예: 과학 실험 정리"><input id="g14ScienceVolume" placeholder="범위/단위"></div><div class="rsf-event"><input id="g14ScienceDate" type="date" value="${esc(LOCAL())}"><button class="rsf-btn alt" id="g14ScienceAdd">숙제 발생 기록</button></div>`;
    root.appendChild(sec);
    sec.querySelector('#g14ScienceAdd').onclick=()=>{
      const fact=addScienceHomework({actor:'PARENT',title:sec.querySelector('#g14ScienceTitle').value||'과학학원 숙제',volume:sec.querySelector('#g14ScienceVolume').value,sourceClassDate:sec.querySelector('#g14ScienceDate').value||LOCAL()});
      const msg=fact.sourceClassAuthority==='BASE_TIMETABLE_CONFIRMED'?'과학학원 숙제 FACT를 기록했어요.':'입력 날짜가 확정 과학학원 수업일과 달라 확인 필요 상태로 기록했어요.';
      (window.toast||alert)(msg);
    };
  }

  function reconcile(){
    if(window.ReadyFoundationV1?.enabled)return {superseded:true,reason:'FOUNDATION_PRESERVES_LEGACY_HISTORY'};
    const p=ensureShape(load());
    p.scheduleAuthority=structuredClone(SCHEDULE_AUTHORITY);
    p.schedulePolicy=structuredClone(LIFESTYLE_POLICY);
    p.plannerAuthority={
      schedule:'CURRENT_CONFIRMED_TIMETABLE',assignment:'CONFIRMED_ASSIGNMENT_FACT',allocation:'PLANNER',home:'PRESENTATION_ONLY',
      noFreeTimeInference:true,minutesPrimarySplitUnit:false,updatedAt:ISO()
    };
    const english=reconcileEnglish(p),talent=reconcileTalent(p),gradingCount=recoverGrading(p);
    save(p);
    return {englishChanges:english,talentChanges:talent,gradingCount};
  }

  function render(){installScienceParentUI()}
  window.ReadyFoundationControlV1?.importBaseline(SCHEDULE_AUTHORITY);
  const audit=reconcile();
  render();
  const observer=new MutationObserver(()=>render());observer.observe(document.body,{subtree:true,childList:true});
  window.ReadyStageG14={
    version:VERSION,SCHEDULE_AUTHORITY,LIFESTYLE_POLICY,rowsForDate,nextConfirmedClassDate,addScienceHomework,reconcile,render,
    validate:()=>({version:VERSION,scheduleAuthority:true,noFreeTimeInference:true,morningBreakfastAnchor:true,scienceConditionalCycle:true,gradingDependency:true,talentWeekdayHardcodeAuthority:false,englishNextClassFromTimetable:true,audit})
  };
  document.documentElement.dataset.readyStageG14=VERSION;
})();