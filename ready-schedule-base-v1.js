(() => {
'use strict';
const VERSION='2026.09.10-schedule-base-v1';
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WD=['일','월','화','수','목','금','토'];
function auth(){return window.ReadyStageG14?.SCHEDULE_AUTHORITY||{rows:[],noFreeTimeInference:true}}
function today(){return new Date().toLocaleDateString('sv-SE')}
function weekday(date=today()){return WD[new Date(date+'T12:00:00').getDay()]}
function planner(){try{return JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}')}catch{return {}}}
function todayTasks(){return planner().days?.[today()]?.tasks||[]}
function scheduleRows(w){return auth().rows.filter(r=>r.weekday===w)}
function ensureViews(){
 const home=$('#homeView .homeMain'); if(home&&!$('#baseSchedulePeek')){const s=document.createElement('section');s.id='baseSchedulePeek';s.className='baseToday baseSchedulePeek';s.innerHTML='<div class="sectionTitle"><div><span>오늘의 시간표</span><h2 id="baseSchedulePeekTitle">확정 일정</h2></div><button class="linkBtn" data-nav="schedule">주간 보기</button></div><div id="baseSchedulePeekList"></div>';const todo=$('#homeView .baseToday');home.insertBefore(s,todo||null)}
 if(!$('#scheduleView')){const sec=document.createElement('section');sec.className='view cream';sec.id='scheduleView';sec.dataset.view='schedule';sec.innerHTML='<header class="safe pageHeader"><button data-nav="home">←</button><div><span class="kicker">SCHEDULE</span><h1>시간표</h1></div><span></span></header><main class="safe scroll"><section class="glassCard"><div class="sectionTitle"><div><span>오늘</span><h2 id="dailyScheduleTitle"></h2></div></div><div id="dailyScheduleList"></div><p class="scheduleGuard">표시되지 않은 시간은 빈 시간으로 판단하지 않아요.</p></section><section class="glassCard"><div class="sectionTitle"><div><span>이번 주</span><h2>주간 시간표</h2></div></div><div id="weeklyScheduleGrid" class="weeklyScheduleGrid"></div></section></main>';$('#app').appendChild(sec)}
}
function item(r){return `<div class="scheduleItem"><b>${esc(r.start)}–${esc(r.end)}</b><span>${esc(r.activity)}</span></div>`}
function render(){ensureViews();const w=weekday(),rows=scheduleRows(w);const peek=$('#baseSchedulePeekList');if(peek)peek.innerHTML=rows.length?rows.map(item).join(''):'<div class="baseEmpty">확정된 일정이 없어요. 빈 시간이라는 뜻은 아니에요.</div>';const pt=$('#baseSchedulePeekTitle');if(pt)pt.textContent=`${w}요일 · 확정 일정`;const dt=$('#dailyScheduleTitle');if(dt)dt.textContent=`${w}요일 · ${today()}`;const dl=$('#dailyScheduleList');if(dl){const tasks=todayTasks().filter(t=>t.status!=='COMPLETED');dl.innerHTML=(rows.length?rows.map(item).join(''):'<div class="baseEmpty">확정 일정 없음 · 미확인 구간은 자유시간으로 추론하지 않음</div>')+(tasks.length?`<div class="dailyPlannerDivider">오늘 Planner 할 일</div>${tasks.map(t=>`<div class="scheduleItem planner"><b>${esc(t.status==='IN_PROGRESS'?'진행 중':'할 일')}</b><span>${esc(t.title||t.subject||'오늘의 할 일')}</span></div>`).join('')}`:'')}
 const grid=$('#weeklyScheduleGrid');if(grid)grid.innerHTML=['월','화','수','목','금','토','일'].map(day=>{const rs=scheduleRows(day);return `<section class="weekDay"><h3>${day}</h3>${rs.length?rs.map(item).join(''):'<small>확정 일정 없음</small>'}</section>`}).join('');
 document.documentElement.dataset.readyScheduleBase=VERSION;
}
function navPatch(){document.addEventListener('click',e=>{const b=e.target.closest('[data-nav="schedule"]');if(!b)return;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('#scheduleView')?.classList.add('active');window.scrollTo(0,0)},true)}
const style=document.createElement('style');style.textContent='.baseSchedulePeek{margin-top:14px}.scheduleItem{display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.08)}.scheduleItem b{min-width:88px;font-size:13px}.scheduleItem span{font-weight:800}.scheduleItem.planner b{min-width:62px}.scheduleGuard{font-size:12px;opacity:.62;margin-top:12px}.dailyPlannerDivider{margin-top:18px;padding-top:14px;border-top:1px solid rgba(0,0,0,.12);font-size:12px;font-weight:900;opacity:.65}.weeklyScheduleGrid{display:grid;gap:10px}.weekDay{padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.55)}.weekDay h3{margin:0 0 4px}.weekDay small{opacity:.55}';document.head.appendChild(style);
navPatch();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.ReadyScheduleBaseV1={version:VERSION,render,validate:()=>({weekly:true,daily:true,plannerLinked:true,noFreeTimeInference:auth().noFreeTimeInference===true})};
})();