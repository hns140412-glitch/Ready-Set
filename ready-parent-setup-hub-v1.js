(() => {
  'use strict';
  if(window.ReadyParentSetupHubV1)return;
  const VERSION='2026.09.13-parent-setup-hub-v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const role=()=>window.ReadyRoleContextV1?.current?.()||new URLSearchParams(location.search).get('role')||'child';
  const identity=()=>window.ReadyIdentityV1?.get?.()||{};
  const control=()=>window.ReadyFoundationControlV1;
  const foundation=()=>window.ReadyFoundationV1;
  const toast=msg=>window.toast?window.toast(msg):alert(msg);

  function nav(name){
    if(window.ReadyBaseRuntimeV1?.nav){window.ReadyBaseRuntimeV1.nav(name);return}
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));window.scrollTo(0,0);
  }
  function installStyle(){
    if($('#readyParentSetupHubStyle'))return;
    const s=document.createElement('style');s.id='readyParentSetupHubStyle';s.textContent=`
      .rps-hub{position:relative;z-index:12;margin:12px 20px 0;padding:14px;border-radius:22px;background:rgba(255,255,255,.91);box-shadow:0 14px 34px rgba(21,85,118,.14);color:#164968}.rps-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.rps-head span{font-size:10px;font-weight:950;letter-spacing:.1em;color:#52748a}.rps-head b{display:block;font-size:17px;margin-top:4px}.rps-head small{display:block;font-size:10px;line-height:1.4;opacity:.65;margin-top:3px}.rps-steps{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.rps-step{border:0;border-radius:17px;background:#eef8ff;color:#154e72;padding:13px;text-align:left}.rps-step.homework{background:#fff5bf;color:#5d4a0c}.rps-step i{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:#0d8ee9;color:#fff;font-style:normal;font-size:10px;font-weight:950}.rps-step.homework i{background:#e5b900;color:#332800}.rps-step b,.rps-step small{display:block}.rps-step b{font-size:13px;margin-top:8px}.rps-step small{font-size:9px;line-height:1.35;margin-top:3px;opacity:.7}.rps-status{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.rps-chip{font-size:9px;font-weight:850;padding:5px 7px;border-radius:999px;background:#f0eee7;color:#665f56}.rps-role{position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));z-index:2100;border:0;border-radius:999px;padding:8px 10px;background:rgba(14,58,84,.86);color:#fff;font-size:10px;font-weight:900;backdrop-filter:blur(10px)}.rps-schedule-actions{display:flex;gap:8px;margin:0 0 12px}.rps-schedule-actions button{flex:1;border:0;border-radius:13px;padding:11px;font-weight:900;background:#1f1f1d;color:#fff}.rps-schedule-actions button.alt{background:#ffe275;color:#30280f}.rps-dialog{border:0;border-radius:24px;padding:0;width:min(92vw,520px);box-shadow:0 24px 70px rgba(0,0,0,.25)}.rps-dialog::backdrop{background:rgba(12,25,33,.48)}.rps-dialog form{padding:20px}.rps-dialog h2{margin:0 0 5px}.rps-dialog p{font-size:11px;line-height:1.45;color:#6f675b}.rps-dialog label{display:block;font-size:11px;font-weight:900;margin:10px 0}.rps-dialog input,.rps-dialog select{display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:5px;border:1px solid #d8d0c2;border-radius:11px;background:#fff;font:inherit}.rps-dialog .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rps-dialog .actions{display:flex;gap:8px;margin-top:16px}.rps-dialog .actions button{flex:1;border:0;border-radius:13px;padding:11px;font-weight:900}.rps-dialog .save{background:#0d8ee9;color:#fff}.rps-dialog .close{background:#eee9df;color:#544c42}.rps-existing{margin:10px 0;padding:10px;border-radius:14px;background:#f6f3ec}.rps-existing button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.06);font-size:11px}.rps-existing button:last-child{border-bottom:0}@media(max-width:390px){.rps-steps{grid-template-columns:1fr}.rps-dialog .row{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  function scheduleSummary(){
    try{const s=control()?.load?.();const active=(s?.profiles||[]).filter(p=>p.state==='ACTIVE');const events=active.flatMap(p=>p.events||[]);return{profiles:active.length,events:events.length,baseline:!!s?.baselineImported}}catch{return{profiles:0,events:0,baseline:false}}
  }
  function homeworkSummary(){
    try{const facts=window.ReadyAssignmentModel?.assignmentView?.()||[];return{facts:facts.filter(x=>x.lifecycle!=='ARCHIVED').length,confirmed:facts.filter(x=>x.confirmationState==='FACT_CONFIRMED'&&x.lifecycle!=='ARCHIVED').length}}catch{return{facts:0,confirmed:0}}
  }
  function goHomework(){nav('mission');setTimeout(()=>{const target=$('#rscCaptureRoot')||$('#rsfParent')||$('#assignmentIntakeRoot');target?.scrollIntoView({behavior:'smooth',block:'start'})},120)}
  function existingEvents(){
    const s=control()?.load?.()||{};const now=today();return (s.profiles||[]).filter(p=>p.state==='ACTIVE'&&(!p.effective_to||p.effective_to>now)).flatMap(profile=>(profile.events||[]).map(event=>({profile,event})));
  }
  function openScheduleEditor(){
    if(role()!=='parent'){toast('시간표 수정은 보호자 화면에서 할 수 있어요.');return}
    const C=control(),F=foundation();if(!C||!F){toast('시간표 기능을 연결하고 있어요.');return}
    const old=$('#rpsScheduleDialog');old?.remove();
    const d=document.createElement('dialog');d.id='rpsScheduleDialog';d.className='rps-dialog';
    const choices=existingEvents();
    d.innerHTML=`<form method="dialog"><h2>시간표 추가 · 변경</h2><p>확정된 일정만 입력합니다. 표시되지 않은 시간은 자유시간으로 추론하지 않아요. 반복 일정 변경은 적용 날짜부터 새 Revision으로 보존됩니다.</p>${choices.length?`<div class="rps-existing"><b>기존 일정 불러오기</b>${choices.map((x,i)=>`<button type="button" data-existing="${i}">${esc(x.event.title)} · ${esc(x.event.start)}–${esc(x.event.end)}</button>`).join('')}</div>`:''}<input type="hidden" name="profileId"><input type="hidden" name="eventId"><input type="hidden" name="eventKey"><div class="row"><label>일정 이름<input name="title" required placeholder="예: 영어학원"></label><label>과목<input name="subject" placeholder="예: 영어"></label></div><div class="row"><label>적용 날짜<input name="date" type="date" required value="${today()}"></label><label>요일<select name="weekday"><option value="1">월</option><option value="2">화</option><option value="3">수</option><option value="4">목</option><option value="5">금</option><option value="6">토</option><option value="0">일</option></select></label></div><div class="row"><label>시작<input name="start" type="time" required></label><label>끝<input name="end" type="time" required></label></div><label>종류<select name="kind"><option value="FIXED">확정 일정</option><option value="STUDY_OPPORTUNITY">확인된 학습 가능 구간</option></select></label><label><input name="once" type="checkbox" style="display:inline;width:auto;margin:0 6px 0 0">이 날짜 하루만 변경</label><p role="alert" style="color:#a23a23;font-weight:800"></p><div class="actions"><button type="button" class="close">닫기</button><button type="submit" class="save">저장</button></div></form>`;
    document.body.appendChild(d);const form=d.querySelector('form'),fields=form.elements;
    d.querySelectorAll('[data-existing]').forEach(b=>b.onclick=()=>{const x=choices[Number(b.dataset.existing)];fields.profileId.value=x.profile.id;fields.eventId.value=x.event.id;fields.eventKey.value=x.event.key;fields.title.value=x.event.title||'';fields.subject.value=x.event.subject||'';fields.weekday.value=String(x.event.weekday??1);fields.start.value=x.event.start||'';fields.end.value=x.event.end||'';fields.kind.value=x.event.kind||'FIXED';fields.date.value=today()});
    d.querySelector('.close').onclick=()=>d.close();d.onclose=()=>d.remove();
    form.onsubmit=e=>{e.preventDefault();try{
      const fd=new FormData(form),title=String(fd.get('title')||'').trim(),profileId=String(fd.get('profileId')||''),eventId=String(fd.get('eventId')||'')||`event_${Date.now()}`,eventKey=String(fd.get('eventKey')||'')||`${title}:${fd.get('weekday')}`;
      const event={id:eventId,key:eventKey,title,subject:String(fd.get('subject')||'').trim()||null,weekday:Number(fd.get('weekday')),start:String(fd.get('start')),end:String(fd.get('end')),kind:String(fd.get('kind')||'FIXED'),parent_editable:true,planner_movable:false,source:'LOCAL'};
      if(fd.has('once'))C.saveOverride({id:`override_${eventId}_${fd.get('date')}`,key:eventKey,date:String(fd.get('date')),event});
      else if(profileId){const source=choices.find(x=>x.profile.id===profileId)?.profile;C.saveProfile({id:profileId,revision:source?.revision||1,state:'ACTIVE',effective_from:String(fd.get('date')),effective_to:source?.effective_to||null,provenance:{source:'PARENT_INPUT'},events:(source?.events||[]).map(x=>x.id===eventId?event:x)})}
      else C.saveProfile({id:`local_${Date.now()}`,revision:1,state:'ACTIVE',effective_from:String(fd.get('date')),effective_to:null,provenance:{source:'PARENT_INPUT'},events:[event]});
      d.close();window.ReadyScheduleBaseV1?.render?.();window.ReadyStageG14?.reconcile?.();toast('시간표 기준을 저장했고 Planner가 새 기준을 사용합니다.');
    }catch(err){form.querySelector('[role="alert"]').textContent=err.message}}
    d.showModal();
  }
  function mountRoleSwitch(){
    const i=identity();if(i.setupMode!=='GUARDIAN_FOR_CHILD')return;
    let b=$('#rpsRoleSwitch');if(!b){b=document.createElement('button');b.id='rpsRoleSwitch';b.className='rps-role';document.body.appendChild(b)}
    b.textContent=role()==='parent'?'아이 화면으로':'보호자 준비로';b.onclick=()=>window.ReadyRoleContextV1?.switchRole?.(role()==='parent'?'child':'parent',{reload:true});
  }
  function mountParentHub(){
    if(role()!=='parent')return;
    const world=$('#worldStage .worldSky');if(!world)return;
    let hub=$('#readyParentSetupHub');if(hub&&hub.parentElement!==world)hub.remove();if(!hub){hub=document.createElement('section');hub.id='readyParentSetupHub';hub.className='rps-hub';const top=world.querySelector('.worldTop');top?.insertAdjacentElement('afterend',hub)}
    const ss=scheduleSummary(),hs=homeworkSummary();
    hub.innerHTML=`<div class="rps-head"><div><span>PARENT SETUP · 먼저 준비할 것</span><b>시간표와 숙제를 먼저 잡아요</b><small>확정 시간표 → 숙제 원본 FACT → Planner 날짜 배정 순서로 연결됩니다.</small></div></div><div class="rps-steps"><button type="button" class="rps-step" data-rps-schedule><i>1</i><b>시간표 확인 · 수정</b><small>학원·고정 일정과 확인된 학습 가능 구간</small></button><button type="button" class="rps-step homework" data-rps-homework><i>2</i><b>숙제 촬영 · 입력</b><small>재능 6권·영어·과학 숙제 원본 FACT</small></button></div><div class="rps-status"><span class="rps-chip">시간표 ${ss.events}개 기준</span><span class="rps-chip">숙제 FACT ${hs.facts}개</span><span class="rps-chip">확정 ${hs.confirmed}개</span></div>`;
    hub.querySelector('[data-rps-schedule]').onclick=()=>{nav('schedule');setTimeout(()=>$('#scheduleView')?.scrollIntoView({block:'start'}),60)};
    hub.querySelector('[data-rps-homework]').onclick=goHomework;
    const h1=world.querySelector('.worldTop h1'),p=world.querySelector('.worldTop p');if(h1)h1.innerHTML='먼저 준비하고<br>오늘을 배정할까?';if(p)p.textContent='시간표 → 숙제 원본 → Planner';
  }
  function mountScheduleActions(){
    if(role()!=='parent')return;const main=$('#scheduleView main');if(!main)return;
    let a=$('#rpsScheduleActions');if(!a){a=document.createElement('div');a.id='rpsScheduleActions';a.className='rps-schedule-actions';main.prepend(a)}
    a.innerHTML='<button type="button" data-edit-schedule>시간표 추가 · 변경</button><button type="button" class="alt" data-go-homework>숙제 입력으로</button>';
    a.querySelector('[data-edit-schedule]').onclick=openScheduleEditor;a.querySelector('[data-go-homework]').onclick=goHomework;
  }
  function patchLegacyParentControls(){
    if(role()!=='parent')return;const root=$('#readyParentFoundation');if(!root)return;
    const sb=root.querySelector('[data-schedule]'),hb=root.querySelector('[data-homework]');if(sb)sb.onclick=openScheduleEditor;if(hb){hb.textContent='숙제 촬영 · 입력';hb.onclick=goHomework}
  }
  function render(){installStyle();mountRoleSwitch();mountParentHub();mountScheduleActions();patchLegacyParentControls();document.documentElement.dataset.readyParentSetupHub=VERSION}
  const observer=new MutationObserver(()=>requestAnimationFrame(render));observer.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('ready-foundation-change',render);window.addEventListener('pageshow',render);
  window.ReadyParentSetupHubV1={version:VERSION,render,openScheduleEditor,goHomework,scheduleSummary,homeworkSummary};
  render();
})();
