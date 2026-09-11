(() => {
  'use strict';

  const STAGE_D_VERSION = '2026.09.08-stage-d1';
  const STORE_KEY = 'readyset_planner_v1';
  const TODAY_SEED_DATE = '2026-09-08';
  const TALENT_BASELINES = {
    '연산': {min:8,max:12,load:'낮음~보통'},
    '한자': {min:8,max:12,load:'낮음~보통'},
    '국어': {min:10,max:15,load:'보통'},
    '사회': {min:10,max:15,load:'보통'},
    '수학': {min:15,max:20,load:'보통~높음'},
    '생각하는 피자': {min:15,max:20,load:'보통~높음'}
  };

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const id = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

  function loadPlanner(){
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : {version:1,days:{},talentWeek:{}};
    } catch {
      return {version:1,days:{},talentWeek:{}};
    }
  }
  function savePlanner(){ localStorage.setItem(STORE_KEY, JSON.stringify(planner)); }
  let planner = loadPlanner();

  function seedToday(){
    const date = todayKey();
    if (planner.days[date]) return planner.days[date];
    const isSeedDay = date === TODAY_SEED_DATE;
    planner.days[date] = {
      localDate: date,
      createdAt: new Date().toISOString(),
      scheduleNote: isSeedDay ? '화요일 · 재능 선생님 19:00 방문 · 종료시각 확인 필요' : '',
      tasks: isSeedDay ? [
        {
          id:id('todo'), subject:'영어', sourceDay:'월요일',
          title:'월요일 영어 숙제 · 새 문제집', volume:'',
          difficulty:'보통~높음 후보', estimatedMin:25, estimateKind:'BASELINE',
          deadline:'수요일 영어 전', selected:true, status:'PLANNED',
          note:'새 문제집 실제 분량을 입력하면 예상시간을 조정하세요.'
        },
        {
          id:id('todo'), subject:'과학', sourceDay:'월요일',
          title:'월요일 과학 숙제', volume:'',
          difficulty:'미확정', estimatedMin:null, estimateKind:'UNVERIFIED',
          deadline:'마감 미확정', selected:false, status:'PLANNED',
          note:'분량·마감·난이도 확인 후 입력하세요. 임의 추정하지 않습니다.'
        }
      ] : []
    };
    savePlanner();
    return planner.days[date];
  }

  function dayPlan(){ return planner.days[todayKey()] || seedToday(); }

  function estimateLabel(task){
    if (!Number.isFinite(Number(task.estimatedMin)) || Number(task.estimatedMin) <= 0) return '예상시간 미확정';
    return `${task.estimatedMin}분 ${task.estimateKind==='BASELINE'?'기준값':''}`.trim();
  }

  function injectStyles(){
    if (document.getElementById('readyStageDStyle')) return;
    const style = document.createElement('style');
    style.id = 'readyStageDStyle';
    style.textContent = `
      :root{--rs-yellow:#ffd51f;--rs-ink:#1e1e1c;--rs-soft:#fff8ed}
      #focusView{min-height:100dvh;overflow:hidden;background:linear-gradient(180deg,#ffd920 0%,#ffc515 100%)}
      #focusView .focusHeader{padding-top:max(14px,env(safe-area-inset-top));min-height:54px;display:flex;justify-content:flex-end;align-items:center}
      #focusView .focusBadge{display:none!important}
      #focusView .focusHeaderTools{width:100%;display:flex;justify-content:flex-end;align-items:center}
      #focusView .focusGuideMini{opacity:.20;transform:scale(.78);transform-origin:right center}
      #focusView .iconButton{width:52px;height:52px;border-radius:50%;background:#1f1f1f;color:#ffd51f;font-size:25px;box-shadow:0 8px 18px rgba(0,0,0,.18)}
      #focusView .focusMain{padding-top:0;padding-bottom:max(12px,env(safe-area-inset-bottom));display:flex;flex-direction:column;min-height:calc(100dvh - max(68px,env(safe-area-inset-top)))}
      #focusView .focusTitle{margin:0 auto 6px;text-align:center;flex:0 0 auto}
      #focusView .focusTitle>span{display:none}
      #focusView .focusTitle h1{margin:0;font-size:clamp(42px,12vw,66px);line-height:.95;letter-spacing:-.075em;font-weight:950;color:#171717}
      #focusView .missionPill{display:inline-flex;margin-top:9px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.83);color:#1f1f1f;font-weight:900;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.08);cursor:pointer}
      #focusView .clockHero{width:min(68vw,350px);height:min(68vw,350px);margin:6px auto 10px;flex:0 1 auto;box-shadow:0 18px 34px rgba(80,48,0,.20);border-width:10px}
      #focusView .clockHero::after{content:'Ready & Set';position:absolute;left:50%;top:30%;transform:translateX(-50%);font-weight:900;font-size:clamp(12px,3.4vw,16px);white-space:nowrap;color:#252525;z-index:2}
      #focusView #readyRev07Panel{display:none!important}
      #focusView .controlPanel{margin-top:auto;background:rgba(24,24,23,.96);box-shadow:0 10px 24px rgba(0,0,0,.16);padding:16px;border-radius:28px}
      #focusView .timeStrip b#remainingTime{font-size:clamp(44px,13vw,64px);color:#ffe022;letter-spacing:-.04em}
      #focusView .timeStrip>div:last-child{text-align:right;opacity:.88}
      #focusView .focusMeta{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;align-items:center;padding:11px 12px;background:#2b2b29;border-radius:16px;color:#fff;font-size:13px}
      #focusView .focusMeta #focusTaskMeta{display:flex;align-items:center;gap:7px;padding-right:10px;border-right:1px solid rgba(255,255,255,.14);min-width:0;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #focusView .focusMeta #focusTaskMeta::before{content:'▣';color:#ffe022}
      #focusView .focusMeta #bgmStatus{padding-left:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d9d9d6}
      #focusView .focusMeta #bgmStatus::before{content:'♪ ';color:#fff}
      #focusView #changeBgm{display:none!important}
      #focusView .focusActions{margin-top:10px;gap:10px}
      #focusView .focusActions button{min-height:58px;font-size:17px}
      #focusView .miniStats{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12);font-size:11px;color:#aaa}
      #focusView .miniStats b{color:#f2f2ef;font-size:17px}
      #focusView .miniStats span:last-child{color:#d0d0cc}
      #focusView .miniStats span:last-child b{color:#fff}
      .planner-card{margin:0 0 14px;padding:16px;border-radius:24px;background:linear-gradient(150deg,#fffdf8,#fff3ce);border:1px solid rgba(75,56,15,.12);box-shadow:0 10px 30px rgba(88,57,5,.08)}
      .planner-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.planner-head small{display:block;font-weight:900;letter-spacing:.06em;opacity:.55}.planner-head h2{margin:3px 0 0;font-size:23px}.planner-date{font-size:12px;font-weight:900;padding:7px 9px;border-radius:999px;background:#222;color:#fff;white-space:nowrap}
      .planner-schedule{margin:10px 0;padding:10px 12px;border-radius:14px;background:#fff8df;font-size:13px;font-weight:800;color:#6e5612}
      .planner-list{display:grid;gap:9px}.planner-task{border:1px solid rgba(0,0,0,.10);border-radius:18px;padding:12px;background:#fff}.planner-task.on{outline:2px solid #e7bf19}.planner-task-top{display:flex;align-items:flex-start;gap:9px}.planner-task-top input[type=checkbox]{width:20px;height:20px;margin-top:3px}.planner-task-main{flex:1;min-width:0}.planner-task-title{font-weight:900}.planner-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}.planner-tags span{padding:4px 7px;border-radius:999px;background:#f4f0e7;font-size:11px;font-weight:800;color:#615a50}.planner-grid{display:grid;grid-template-columns:1.25fr .9fr .75fr;gap:7px;margin-top:9px}.planner-grid label{font-size:10px;font-weight:800;color:#777}.planner-grid input,.planner-grid select{width:100%;box-sizing:border-box;margin-top:3px;border:1px solid #ddd1bd;border-radius:10px;background:#fff;padding:9px 8px;font-size:12px}.planner-note{font-size:11px;color:#866f42;margin-top:7px;line-height:1.35}.planner-actions{display:flex;gap:8px;margin-top:12px;position:sticky;bottom:0}.planner-actions button{flex:1;border:0;border-radius:14px;padding:12px 10px;font-weight:900}.planner-actions .primary{background:#1f1f1d;color:#fff}.planner-actions .secondary{background:#ffe278;color:#28220f}
      .talent-panel{margin-top:12px;border-top:1px dashed rgba(0,0,0,.15);padding-top:12px}.talent-toggle{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:#fff1ad;border-radius:14px;padding:11px 12px;font-weight:900}.talent-grid{display:grid;gap:7px;margin-top:8px}.talent-row{display:grid;grid-template-columns:1fr 1.1fr .75fr;gap:7px;align-items:center;background:rgba(255,255,255,.72);padding:8px;border-radius:12px}.talent-row b{font-size:12px}.talent-row small{display:block;font-size:10px;color:#71644c}.talent-row input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #decfae;border-radius:9px}.talent-row input[type=number]{text-align:center}
      .focus-tools{position:fixed;inset:0;z-index:10010;background:rgba(10,10,10,.42);display:flex;align-items:flex-end}.focus-tools[hidden]{display:none}.focus-tools-sheet{width:100%;max-height:65vh;overflow:auto;border-radius:28px 28px 0 0;background:#fffaf1;padding:18px 16px calc(18px + env(safe-area-inset-bottom))}.focus-tools-sheet h3{margin:0 0 10px}.focus-tool-apps{display:flex;gap:8px;margin-bottom:10px}.focus-tool-apps button,.focus-tool-task{border:0;border-radius:14px;padding:11px;font-weight:900}.focus-tool-apps button{flex:1;background:#222;color:#fff}.focus-tool-task{width:100%;display:flex;justify-content:space-between;background:#f1ecdf;margin-top:6px;text-align:left}.focus-tools-close{width:100%;margin-top:12px;border:0;border-radius:14px;padding:12px;background:#e6ded0;font-weight:900}
      @media(max-height:760px){#focusView .focusTitle h1{font-size:42px}#focusView .clockHero{width:min(54vh,300px);height:min(54vh,300px)}#focusView .controlPanel{padding:12px}.focusActions button{min-height:50px!important}}
    `;
    document.head.appendChild(style);
  }

  function activeTaskLabel(){
    const c = window.ReadySetRev07?.contract?.();
    const task = c?.tasks?.find(t => t.task_id === c.active_task_id);
    if (task?.label) return task.label;
    return [...(state.activeSession?.selected || []), ...(state.activeSession?.tasks || [])][0] || '오늘의 과제';
  }

  function applyFocusUI(){
    const focus = document.getElementById('focusView');
    if (!focus) return;
    const h1 = focus.querySelector('.focusTitle h1');
    if (h1) h1.textContent = '그냥! 지금 하면 돼!';
    const task = activeTaskLabel();
    const mission = document.getElementById('focusMission');
    if (mission) { mission.textContent = task; mission.title = '과제 전환 · 학습 도구'; }
    let taskMeta = document.getElementById('focusTaskMeta');
    const meta = focus.querySelector('.focusMeta');
    if (meta && !taskMeta) {
      taskMeta = document.createElement('span');
      taskMeta.id = 'focusTaskMeta';
      meta.prepend(taskMeta);
    }
    if (taskMeta) taskMeta.textContent = task;
    const stats = focus.querySelectorAll('.miniStats span');
    if (stats[2] && stats[2].childNodes[0]) stats[2].childNodes[0].nodeValue = 'ISSUE ';
  }

  function ensureFocusTools(){
    let modal = document.getElementById('stageDFocusTools');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id='stageDFocusTools';
    modal.className='focus-tools';
    modal.hidden=true;
    modal.innerHTML='<div class="focus-tools-sheet"><h3>현재 과제 · 학습 도구</h3><div class="focus-tool-apps"><button data-tool-app="hide-seek">Hide & Seek</button><button data-tool-app="snap-pop">Snap & Pop</button></div><div id="stageDFocusTaskList"></div><button class="focus-tools-close">닫기</button></div>';
    document.body.appendChild(modal);
    modal.querySelector('.focus-tools-close').onclick=()=>modal.hidden=true;
    modal.addEventListener('click', e=>{
      if(e.target===modal) modal.hidden=true;
      const app=e.target.closest('[data-tool-app]')?.dataset.toolApp;
      if(app){ modal.hidden=true; window.ReadySetRev07?.launchSpecialist?.(app); return; }
      const taskId=e.target.closest('[data-tool-task]')?.dataset.toolTask;
      if(taskId){ window.ReadySetRev07?.switchTask?.(taskId); modal.hidden=true; setTimeout(applyFocusUI,0); }
    });
    return modal;
  }
  function openFocusTools(){
    const modal=ensureFocusTools();
    const c=window.ReadySetRev07?.contract?.();
    const root=document.getElementById('stageDFocusTaskList');
    root.innerHTML=c?.tasks?.length ? c.tasks.map(t=>`<button class="focus-tool-task" data-tool-task="${escape(t.task_id)}"><span>${escape(t.label)}</span><strong>${escape(t.state==='PENDING'?'미확정':t.state)}</strong></button>`).join('') : '<p>활성 과제가 없어요.</p>';
    modal.hidden=false;
  }

  function planTaskHTML(task){
    const mins = task.estimatedMin ?? '';
    return `<article class="planner-task ${task.selected?'on':''}" data-plan-id="${escape(task.id)}">
      <div class="planner-task-top"><input class="plan-select" type="checkbox" ${task.selected?'checked':''} aria-label="오늘 세션에 포함"><div class="planner-task-main"><div class="planner-task-title">${escape(task.title)}</div><div class="planner-tags"><span>${escape(task.subject)}</span><span>${escape(task.sourceDay||'')}</span><span>${escape(task.difficulty||'미확정')}</span><span>${escape(estimateLabel(task))}</span></div></div></div>
      <div class="planner-grid">
        <label>분량<input class="plan-volume" value="${escape(task.volume||'')}" placeholder="예: p.12~18"></label>
        <label>난이도<select class="plan-difficulty"><option ${task.difficulty==='미확정'?'selected':''}>미확정</option><option ${task.difficulty==='낮음'?'selected':''}>낮음</option><option ${task.difficulty==='보통'?'selected':''}>보통</option><option ${/높음/.test(task.difficulty||'')?'selected':''}>높음</option></select></label>
        <label>예상 분<input class="plan-min" type="number" min="1" max="120" value="${escape(mins)}" placeholder="?"></label>
      </div><div class="planner-note">마감: ${escape(task.deadline||'미확정')} · ${escape(task.note||'')}</div></article>`;
  }

  function ensurePlannerCard(){
    const missionMain=document.querySelector('#missionView main');
    if(!missionMain) return null;
    let card=document.getElementById('todayPlannerCard');
    if(!card){
      card=document.createElement('section'); card.id='todayPlannerCard'; card.className='planner-card';
      missionMain.prepend(card);
      card.addEventListener('input', capturePlannerEdits);
      card.addEventListener('change', capturePlannerEdits);
      card.addEventListener('click', handlePlannerClick);
    }
    return card;
  }

  function renderPlanner(){
    const plan=dayPlan();
    const card=ensurePlannerCard();
    if(!card) return;
    const date=new Date(`${plan.localDate}T12:00:00`);
    const koDate=new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',weekday:'short'}).format(date);
    card.innerHTML=`<div class="planner-head"><div><small>TODAY PLAN · 실제 숙제 배포</small><h2>오늘 할 일</h2></div><span class="planner-date">${escape(koDate)}</span></div>
      ${plan.scheduleNote?`<div class="planner-schedule">${escape(plan.scheduleNote)}</div>`:''}
      <div class="planner-list">${plan.tasks.map(planTaskHTML).join('') || '<p>오늘 등록된 숙제가 없어요.</p>'}</div>
      <div class="planner-actions"><button class="secondary" data-plan-action="add">+ 숙제 추가</button><button class="primary" data-plan-action="apply">선택 과제 배포</button></div>
      <div class="talent-panel"><button class="talent-toggle" data-plan-action="talent-toggle"><span>재능 6과목 · 오늘 선생님 배포 입력</span><span>⌄</span></button><div id="talentRows" class="talent-grid" hidden>${Object.entries(TALENT_BASELINES).map(([name,b])=>`<div class="talent-row" data-talent="${escape(name)}"><div><b>${escape(name)}</b><small>${b.load} · ${b.min}~${b.max}분/기준단위</small></div><input class="talent-volume" placeholder="분량 입력"><input class="talent-min" type="number" min="1" max="120" placeholder="분"></div>`).join('')}<button class="primary" data-plan-action="talent-create">입력한 재능 숙제 생성</button></div></div>`;
  }

  function taskFromElement(el){ return dayPlan().tasks.find(t=>t.id===el.dataset.planId); }
  function capturePlannerEdits(e){
    if(window.ReadyFoundationV1?.enabled)return;
    const el=e.target.closest('.planner-task'); if(!el) return;
    const task=taskFromElement(el); if(!task) return;
    if(e.target.classList.contains('plan-select')) task.selected=e.target.checked;
    if(e.target.classList.contains('plan-volume')) task.volume=e.target.value.trim();
    if(e.target.classList.contains('plan-difficulty')) {task.difficulty=e.target.value; task.estimateKind='MANUAL';}
    if(e.target.classList.contains('plan-min')) {const n=Number(e.target.value);task.estimatedMin=n>0?n:null;task.estimateKind=n>0?'MANUAL':'UNVERIFIED';}
    savePlanner();
    el.classList.toggle('on',!!task.selected);
  }

  function handlePlannerClick(e){
    if(window.ReadyFoundationV1?.enabled)return;
    const action=e.target.closest('[data-plan-action]')?.dataset.planAction; if(!action) return;
    if(action==='add'){
      const plan=dayPlan();
      plan.tasks.push({id:id('todo'),subject:'기타',sourceDay:'오늘',title:'새 숙제',volume:'',difficulty:'미확정',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:'미확정',selected:false,status:'PLANNED',note:''});
      savePlanner(); renderPlanner(); return;
    }
    if(action==='apply'){ applyPlanToMission(); return; }
    if(action==='talent-toggle'){
      const rows=document.getElementById('talentRows'); rows.hidden=!rows.hidden; return;
    }
    if(action==='talent-create'){ createTalentTasks(); return; }
  }

  function createTalentTasks(){
    if(window.ReadyFoundationV1?.enabled)return;
    const rows=[...document.querySelectorAll('[data-talent]')];
    const plan=dayPlan(); let added=0;
    rows.forEach(row=>{
      const subject=row.dataset.talent;
      const volume=row.querySelector('.talent-volume').value.trim();
      const min=Number(row.querySelector('.talent-min').value);
      if(!volume) return;
      const base=TALENT_BASELINES[subject];
      const existing=plan.tasks.find(t=>t.subject==='재능' && t.talentSubject===subject && t.localDate===plan.localDate);
      const payload={id:existing?.id||id('todo'),localDate:plan.localDate,subject:'재능',talentSubject:subject,sourceDay:'화요일 배포',title:`재능 · ${subject}`,volume,difficulty:base.load,estimatedMin:min>0?min:Math.round((base.min+base.max)/2),estimateKind:min>0?'MANUAL':'BASELINE',deadline:'다음 화요일 방문 전',selected:true,status:'PLANNED',required:true,note:'선생님 지정 필수량은 삭제하지 않고 시간·순서·분할만 조정'};
      if(existing) Object.assign(existing,payload); else plan.tasks.push(payload); added++;
    });
    savePlanner(); renderPlanner(); toast(added?`재능 ${added}과목을 오늘 계획에 넣었어요.`:'먼저 재능 분량을 입력해 주세요.');
  }

  function applyPlanToMission(){
    if(window.ReadyFoundationV1?.enabled)return;
    captureOpenInputs();
    const selected=dayPlan().tasks.filter(t=>t.selected);
    if(!selected.length){toast('오늘 세션에 넣을 과제를 선택해 주세요.');return;}
    state.selected=[];
    state.tasks=selected.map(t=>`${t.title}${t.volume?` · ${t.volume}`:''}`);
    const known=selected.map(t=>Number(t.estimatedMin)||0).filter(Boolean);
    if(known.length===selected.length){ state.targetMin=Math.max(5,Math.min(180,known.reduce((a,b)=>a+b,0))); }
    save();
    renderMission();
    renderPlanner();
    const unknown=selected.filter(t=>!Number(t.estimatedMin)).length;
    toast(unknown?`배포 완료 · 예상시간 미확정 ${unknown}개는 목표시간에 자동 합산하지 않았어요.`:`${selected.length}개 과제 · 목표 ${state.targetMin}분으로 배포했어요.`);
  }

  function captureOpenInputs(){
    if(window.ReadyFoundationV1?.enabled)return;
    document.querySelectorAll('.planner-task').forEach(el=>{
      const task=taskFromElement(el); if(!task) return;
      task.selected=!!el.querySelector('.plan-select')?.checked;
      task.volume=el.querySelector('.plan-volume')?.value.trim()||'';
      task.difficulty=el.querySelector('.plan-difficulty')?.value||task.difficulty;
      const n=Number(el.querySelector('.plan-min')?.value); task.estimatedMin=n>0?n:null;
    });
    savePlanner();
  }

  function addHomePlannerEntry(){
    const card=document.querySelector('#homeView .commandCard');
    if(!card || document.getElementById('todayPlanEntry')) return;
    const btn=document.createElement('button');btn.id='todayPlanEntry';btn.innerHTML='<span><b>오늘 숙제 배포</b><small>시간표 · 난이도 · 예상시간으로 오늘 계획 만들기</small></span><strong>→</strong>';
    btn.onclick=()=>{nav('mission');setTimeout(renderPlanner,0);};
    card.prepend(btn);
  }

  function patchRenderers(){
    const baseMission=renderMission;
    renderMission=function patchedMission(){ baseMission(); setTimeout(renderPlanner,0); };
    const baseFocus=renderFocus;
    renderFocus=function patchedFocus(){ baseFocus(); setTimeout(applyFocusUI,0); };
  }

  function bindFocusTools(){
    const mission=document.getElementById('focusMission');
    if(mission && !mission.dataset.stageDBound){mission.dataset.stageDBound='1';mission.addEventListener('click',openFocusTools);}
  }

  function validate(){
    return {
      version:STAGE_D_VERSION,
      plannerStore:!!localStorage.getItem(STORE_KEY),
      plannerCard:!!document.getElementById('todayPlannerCard'),
      focusHeadline:document.querySelector('#focusView .focusTitle h1')?.textContent==='그냥! 지금 하면 돼!',
      bgmSingleControl:!!document.getElementById('focusSoundBtn') && getComputedStyle(document.getElementById('changeBgm')).display==='none',
      rev07:window.ReadySetRev07?.validate?.()||null,
      safeAreaRule:'CSS_ENV_SAFE_AREA',
      previewOnly:true
    };
  }

  function boot(){
    document.documentElement.dataset.readyStageD=STAGE_D_VERSION;
    try{VERSION.app='0.9.4-rc1';VERSION.cache='ready-set-v094-rev07-staging3';}catch{}
    injectStyles();
    seedToday();
    patchRenderers();
    addHomePlannerEntry();
    renderPlanner();
    applyFocusUI();
    bindFocusTools();
    setTimeout(()=>{applyFocusUI();bindFocusTools();},200);
    window.ReadyStageD=Object.freeze({version:STAGE_D_VERSION,planner:()=>structuredClone(planner),renderPlanner,applyPlanToMission,validate});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
