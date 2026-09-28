/* Ready & Set evening-use slice — explicit local-only provisional entry.
   Does not confirm assignment facts, grant parent role, or invoke allocation. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const localDate = (date = new Date()) =>
    [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value + 'T12:00:00').valueOf()) &&
    localDate(new Date(value + 'T12:00:00')) === value;
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const makeId = () => 'evening_' + Date.now() + '_' + Math.random().toString(36).slice(2,9);
  const notify = message => {
    const el = $('#eveningQuickStatus');
    if (el) { el.textContent = message; el.setAttribute('role','status'); }
  };
  function planner() {
    const p = window.ReadySetPlanner;
    if (!p?.upsertDatedTodo || !p?.upsertScheduleCommitment || !p?.snapshot) {
      notify('Planner가 아직 준비되지 않았어요. 화면을 다시 열어 주세요.');
      return null;
    }
    return p;
  }
  function showPlannerDate(date) {
    document.querySelector('.commandCard [data-nav="planner"]')?.click();
    const day = [...document.querySelectorAll('[data-planner-date]')].find(el=>el.dataset.plannerDate===date);
    day?.click();
  }
  function enterMission(todoId) {
    const route = document.querySelector('.commandCard [data-nav="mission"]') ||
      document.querySelector('[data-nav="mission"]');
    if (!route) { notify('임시 할 일은 저장됐어요. 실행 화면을 다시 열어 주세요.'); return; }
    route.click();
    const choice = [...document.querySelectorAll('#plannerTodayList [data-todo-id]')]
      .find(node => node.dataset.todoId === todoId);
    if (choice && !choice.disabled) choice.click();
    else notify('오늘 목록에서 직접 할 일을 선택해 주세요.');
  }
  function saveTask(andStart) {
    const p = planner(); if (!p) return;
    const title = ($('#eveningTaskTitle')?.value || '').trim();
    const date = $('#eveningTaskDate')?.value || '';
    if (!title || title.length > 160 || !validDate(date)) {
      notify('과제명(160자 이내)과 날짜를 확인해 주세요.'); return;
    }
    const todo = p.upsertDatedTodo({
      todo_id: makeId(), date, label:title, state:'PLANNED',
      source:'LOCAL_QUICK_START_PROVISIONAL',
      source_actor:'EXPLICIT_USER_INPUT',
      provenance: {kind:'MANUAL_PROVISIONAL_ENTRY', fact_confirmed:false,
        central_learning_applied:false, user_selected_date:true}
    });
    $('#eveningTaskTitle').value='';
    if (andStart && date===localDate()) enterMission(todo.todo_id);
    else showPlannerDate(date);
    notify('임시 할 일이 이 기기에 저장됐어요. 정식 숙제 FACT 확인은 별도예요.');
  }
  function saveSchedule() {
    const p = planner(); if (!p) return;
    const title=($('#eveningScheduleTitle')?.value||'').trim();
    const date=$('#eveningScheduleDate')?.value||'';
    const start=$('#eveningScheduleStart')?.value||'';
    const end=$('#eveningScheduleEnd')?.value||'';
    if (!title || title.length>160 || !validDate(date) || !validTime(start) ||
        !validTime(end) || start>=end) {
      notify('일정명·날짜·시작·종료 시간을 확인해 주세요.');return;
    }
    p.upsertScheduleCommitment({
      commitment_id:makeId(),title,category:'LOCAL_PROVISIONAL',
      start_at:date+'T'+start+':00',end_at:date+'T'+end+':00',
      confirmed:false,planner_movable:false,parent_editable:true,
      source:'LOCAL_QUICK_START_PROVISIONAL'
    });
    $('#eveningScheduleTitle').value='';
    showPlannerDate(date);
    notify('임시 시간으로 표시했어요. 부모 확정 일정·학습 가용시간으로 사용되지 않아요.');
  }
  function initialize() {
    const hero=$('#plannerView .plannerHero');
    if (!hero || $('#eveningQuickStart')) return;
    const section=document.createElement('section');
    section.id='eveningQuickStart';section.className='eveningQuickStart';
    section.innerHTML =
      '<div class="eveningQuickTitle"><div><small>LOCAL FIRST · QUICK START</small><h2>오늘부터 사용하기</h2></div><span>임시 입력</span></div>'+
      '<p class="eveningQuickHelp">직접 입력해 주간·일간 화면과 타이머를 먼저 사용해요. 이 기기 임시 기록이며 정식 숙제 FACT·Learning Engine 분석·부모 확인·클라우드 동기화를 대신하지 않아요.</p>'+
      '<div class="eveningQuickRow"><label>할 일 이름<input id="eveningTaskTitle" maxlength="160" placeholder="예) 영어 단어 복습" autocomplete="off"></label><label>날짜<input id="eveningTaskDate" type="date" required></label></div>'+
      '<div class="eveningQuickActions"><button type="button" id="eveningAddTask">일정에 담기</button><button type="button" id="eveningStartTask">오늘 타이머로 시작</button></div>'+
      '<details class="eveningQuickSchedule"><summary>고정 시간 임시 입력</summary>'+
      '<div class="eveningQuickRow"><label>일정 이름<input id="eveningScheduleTitle" maxlength="160" placeholder="예) 영어학원"></label><label>날짜<input id="eveningScheduleDate" type="date" required></label></div>'+
      '<div class="eveningQuickRow"><label>시작<input id="eveningScheduleStart" type="time"></label><label>종료<input id="eveningScheduleEnd" type="time"></label></div>'+
      '<button type="button" id="eveningAddSchedule">임시 일정에 담기</button></details>'+
      '<p id="eveningQuickStatus" class="eveningQuickStatus" role="status" aria-live="polite">기존 학습 데이터는 덮어쓰지 않습니다.</p>';
    hero.insertAdjacentElement('afterend',section);
    $('#eveningTaskDate').value=localDate();$('#eveningScheduleDate').value=localDate();
    $('#eveningAddTask').addEventListener('click',()=>saveTask(false));
    $('#eveningStartTask').addEventListener('click',()=>{
      if ($('#eveningTaskDate').value!==localDate()){notify('타이머 시작은 오늘 날짜만 가능해요.');return;}
      saveTask(true);
    });
    $('#eveningAddSchedule').addEventListener('click',saveSchedule);
    $('#eveningTaskTitle').addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();saveTask(false);}
    });
    window.ReadyEveningQuickStart=Object.freeze({localDate,validDate,validTime,version:'QUICKSTART_LOCAL_PROVISIONAL_V1'});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);
  else initialize();
})();
