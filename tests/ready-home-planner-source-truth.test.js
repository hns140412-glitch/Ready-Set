'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cp=require('node:child_process');

const elements=new Map();
const element=selector=>{
  if(!elements.has(selector)){
    elements.set(selector,{
      textContent:'',innerHTML:'',hidden:false,dataset:{},attributes:{},children:[],
      classList:{toggle(){},add(){},remove(){}},
      setAttribute(k,v){this.attributes[k]=v;},
      appendChild(child){this.children.push(child);},
      replaceChildren(){this.children=[];}
    });
  }
  return elements.get(selector);
};
const document={querySelector:element,querySelectorAll:()=>[],createElement:()=>({textContent:'',dataset:{},className:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;}})};
function moduleAt(file){
  const context={document,console};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  return context;
}
const home=moduleAt('src/views/home-view-runtime.js').ReadyRebuildHomeView.create({
  query:element,applyAvatar(){},applyGuide(){},guideData:()=>({home:'기준 데이터 확인'})
});
const tomorrow=[
 {todo_id:'t1',label:'영어 단어 복습',state:'PLANNED',estimated_minutes:15},
 {todo_id:'t2',label:'과학 탐험',state:'COMPLETED',estimated_minutes:10}
];
let result=home.render({state:{guide:{name:'탐험대원'},targetMin:25},todayTodos:tomorrow});
assert.equal(result.remaining,1);
assert.equal(element('#homeNextTitle').textContent,'영어 단어 복습');
assert.equal(element('#homeNextTaskBtn').dataset.nav,'mission');
assert.equal(element('#homeChips').children.length,1);
assert.equal(element('#homeTodayEmpty').hidden,true);
home.render({state:{guide:{name:'탐험대원'},activeSession:{session_id:'s1'}},todayTodos:tomorrow});
assert.equal(element('#homeNextTaskBtn').dataset.nav,'focus','active session must be continued, not restarted');
home.render({state:{guide:{name:'탐험대원'}},todayTodos:[]});
assert.equal(element('#homeNextTaskBtn').dataset.nav,'planner','empty TODAY must not create a fake mission');
assert.equal(element('#homeTodayEmpty').hidden,false);
assert.equal(element('#homeChips').children.length,0);
home.render({state:{guide:{name:'탐험대원'}},todayTodos:[{todo_id:'help1',label:'부모 확인 대기',state:'WAITING_FOR_PARENT'}]});
assert.equal(element('#homeNextTaskBtn').dataset.nav,'planner','waiting task is not executable');
assert.match(element('#homeNextMeta').textContent,/대기/);

const day='2026-09-28';
const dayItems=[
 {kind:'SCHEDULE',label:'태권도',state:'FIXED',time:'18:00',schedule_scope:'CHILD',meta:'내 일정'},
 {kind:'TODO',todo_id:'t1',label:'등교 전 영어 단어',state:'PLANNED',daypart:'MORNING',order:1,meta:'플래너',minutes:15},
 {kind:'SCHEDULE',label:'학교',state:'FIXED',time:'08:30',schedule_scope:'CHILD',meta:'내 일정'},
 {kind:'TODO',todo_id:'t2',label:'과학 숙제',state:'PARTIAL',daypart:'AFTER_SCHOOL',order:2,meta:'플래너',minutes:20}
];
const localDateKey=(d=new Date(day+'T12:00:00'))=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const addDays=(d,n)=>{const result=new Date(d);result.setDate(result.getDate()+n);return result;};
const escapeHtml=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const view=moduleAt('src/views/planner-screen-view-runtime.js').ReadyRebuildPlannerScreenView.create({
  query:element,queryAll:()=>[element('tab-week'),element('tab-day')],
  escapeHtml,localDateKey,addDays,
  weekStart:d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;},
  itemsForDate:key=>key===day?dayItems:[],
  freeWindowsForDate:key=>key===day?[{start:'16:00',end:'17:00',minutes:60}]:[],
  stateLabel:state=>state==='PLANNED'?'예정':state==='PARTIAL'?'일부 남음':'고정'
});
assert.equal(view.render({selectedDate:day,tab:'week',snapshot:{},isParent:false}).ok,true);
assert.equal(element('#plannerWeekStrip').children.length,7);
assert.match(element('#plannerWeekStrip').children[0].attributes['aria-label'],/오늘 할 일 2개, 고정 일정 2개/);
assert.equal(element('#plannerHeroTitle').textContent,'이번 주 여정');
const overview=element('#plannerWeekOverview').innerHTML;
assert.equal((overview.match(/class="plannerWeekOverviewRow/g)||[]).length,7,'seven readable timetable rows, not an island map');
assert.match(overview,/학교/);
assert.match(overview,/등교 전 영어 단어/);
assert.match(overview,/여유 60분/,'free window only from verified availability projection');
assert.match(indexHtml(),/id="plannerWeekOverview"/);
assert.match(indexHtml(),/class="plannerGlassSheet"/);
assert.equal(view.render({selectedDate:day,tab:'day',snapshot:{},isParent:false}).ok,true);
const route=element('#plannerDayTimeline').innerHTML;
assert.ok(route.indexOf('등교 전 할 일')<route.indexOf('고정 일정 · 시간순'));
assert.ok(route.indexOf('고정 일정 · 시간순')<route.indexOf('Planner 배정 할 일 · 시각 미확정'));
assert.ok(route.indexOf('학교')<route.indexOf('태권도'),'fixed commitments must be chronologically sorted');
assert.match(route,/가능한 자유 시간/);
assert.match(element('#plannerDayCount').textContent,/할 일 2 · 고정 일정 2/);
assert.equal(element('#plannerHeroTitle').textContent,'오늘의 탐험길');
assert.equal(element('#plannerDayMissionJump').hidden,false,'same-day actionable TODO may enter Mission setup');
const tomorrowKey=localDateKey(addDays(new Date(day+'T12:00:00'),1));
view.render({selectedDate:tomorrowKey,tab:'day',snapshot:{},isParent:false});
assert.equal(element('#plannerDayMissionJump').hidden,true,'do not offer Today Mission for an unrelated day');
assert.doesNotMatch(element('#plannerDayTimeline').innerHTML,/08:00/,'unknown TODO time must never be guessed');

const bootstrap=moduleAt('src/shell/app-bootstrap-controller-runtime.js').ReadyRebuildAppBootstrapController;
let selected=null,tab=null,renders=0;
const c=bootstrap.create({localDateKey,getActiveSession:()=>null,
  setPlannerSelectedDate:d=>{selected=d;},setPlannerTab:t=>{tab=t;},renderPlanner:()=>{renders++;}
});
c.onDocumentClick({target:{closest:selector=>selector==='[data-planner-date]'?{dataset:{plannerDate:'2026-09-30'}}:null}});
assert.equal(selected,'2026-09-30');
assert.equal(tab,'day');
assert.equal(renders,1);

function indexHtml(){return fs.readFileSync('index.html','utf8');}
const index=indexHtml();
assert.match(index,/id="homeNextTaskBtn"/);
assert.doesNotMatch(index,/<div class="categoryGrid"><button data-nav="mission">/);
const ref='a675b93d0dbe7c1297ba0ad1889907ceffc1fbf1';
const original=cp.execFileSync('git',['show',ref+':index.html'],{encoding:'utf8'});
const focusSection=s=>s.split('<section class="view yellow" id="focusView" data-view="focus">')[1]?.split('<section class="view recordingView"')[0];
assert.ok(focusSection(original));
const expectedFocus=focusSection(original)
 .replace('<span class="focusBadge">FOCUS MODE</span>','<span class="focusBadge" aria-hidden="true"></span>')
 .replace('<span>누가 와도 몰라요, 지금은 집중 중</span><h1>타임어택</h1>','<span hidden aria-hidden="true"></span><h1>그냥! 지금 하면 돼!</h1>');
assert.equal(focusSection(index),expectedFocus,'locked timer structure unchanged except explicit approved copy correction');
assert.doesNotMatch(index,/타임어택|FOCUS MODE/,'obsolete product names must never appear child-facing');
assert.match(index,/그냥! 지금 하면 돼!/,'approved Timer headline must be present');
assert.match(index,/ready-basecamp-planner-glass.css/);
const glassCss=fs.readFileSync('ready-basecamp-planner-glass.css','utf8');
assert.match(glassCss,/prefers-reduced-motion/);
assert.match(glassCss,/plannerGlassSheet/);
assert.doesNotMatch(glassCss,/#focusView|#focusMain|#focusHeader/,'visual overlay must not restyle locked timer');
const changed=cp.execFileSync('git',['diff','--name-only',ref,'HEAD'],{encoding:'utf8'}).trim().split('\n');
assert.ok(!changed.some(s=>/^src\/views\/focus-|^assets\/|^ready-runtime-v07\.js$|^ready-family-session-v01\.js$/.test(s)),'timer/assets/session source changed');
console.log('PASS Home source-backed TODAY, empty, active-session; Week counts; Day grouping; day handoff; timer source lock');
