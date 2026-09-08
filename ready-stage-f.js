(() => {
  'use strict';
  const VERSION='2026.09.08-stage-f4-rolehome';
  const STORE_KEY='readyset_planner_v1';
  const ROLE=new URLSearchParams(location.search).get('role')==='parent'?'PARENT':'CHILD';
  const TALENT=['연산','한자','국어','사회','수학','생각하는 피자'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const id=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null')||{version:1,days:{},talentWeek:{}}}catch{return{version:1,days:{},talentWeek:{}}}};
  const save=p=>localStorage.setItem(STORE_KEY,JSON.stringify(p));
  const ensureDay=(p,date)=>p.days[date]||(p.days[date]={localDate:date,createdAt:new Date().toISOString(),scheduleNote:'',tasks:[]});
  const toast=msg=>window.toast?window.toast(msg):alert(msg);

  function styles(){
    if(document.getElementById('readyStageFStyle'))return;
    const s=document.createElement('style');s.id='readyStageFStyle';s.textContent=`
      .rsf-hide{display:none!important}.rsf-role-home{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#1f1f1d;color:#fff;font-size:10px;font-weight:900;letter-spacing:.02em;margin-left:auto;margin-right:8px}.rsf-role-home.parent{background:#385ea8}.rsf-card{border:1px solid rgba(0,0,0,.10);border-radius:22px;background:#fffdf8;padding:14px;margin:0 0 12px;box-shadow:0 8px 24px rgba(52,39,10,.06)}.rsf-card h2{margin:0 0 5px;font-size:20px}.rsf-card p{margin:0;color:#756c5e;font-size:12px;line-height:1.45}.rsf-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#fff1aa;color:#665100;font-size:10px;font-weight:900;margin:0 6px 6px 0}.rsf-list{display:grid;gap:8px;margin-top:12px}.rsf-task{display:grid;grid-template-columns:auto 1fr;gap:10px;padding:12px;border:1px solid #e4dccf;border-radius:16px;background:#fff}.rsf-task input[type=checkbox]{width:21px;height:21px;margin-top:3px}.rsf-task b{display:block}.rsf-task small{display:block;margin-top:4px;color:#7a7164}.rsf-row{display:grid;grid-template-columns:1.2fr .85fr .7fr;gap:7px;margin-top:8px}.rsf-row input,.rsf-row select{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d9d0c1;border-radius:10px;background:#fff}.rsf-event{display:flex;gap:7px;margin-top:10px}.rsf-event input{flex:1;min-width:0;padding:11px;border:1px solid #d9d0c1;border-radius:12px}.rsf-btn{border:0;border-radius:12px;padding:11px 13px;font-weight:900;background:#1f1f1d;color:#fff}.rsf-btn.alt{background:#ffe275;color:#30280f}.rsf-talent{margin-top:14px;padding-top:12px;border-top:1px dashed #d9cfae}.rsf-talent-grid{display:grid;gap:7px;margin-top:8px}.rsf-talent-row{display:grid;grid-template-columns:1fr 1.2fr .65fr;gap:7px;align-items:center;padding:8px;background:#fff8df;border-radius:12px}.rsf-talent-row input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d9cda8;border-radius:9px}.rsf-sticky{position:sticky;bottom:0;padding-top:10px;background:linear-gradient(180deg,rgba(255,253,248,0),#fffdf8 35%)}
      html[data-ready-role='CHILD'] #todayPlannerCard,html[data-ready-role='PARENT'] #todayPlannerCard{display:none!important}html[data-ready-role='CHILD'] #missionView .progressSteps{display:none!important}html[data-ready-role='PARENT'] #missionView .progressSteps,html[data-ready-role='PARENT'] #missionView .glassCard,html[data-ready-role='PARENT'] #missionView .missionPreview,html[data-ready-role='PARENT'] #missionView .stackActions{display:none!important}
    `;document.head.appendChild(s);
  }

  function ensureRoleMarker(){
    const top=document.querySelector('#homeView .topbar');if(!top)return;
    let m=document.getElementById('rsfRoleMarker');if(!m){m=document.createElement('span');m.id='rsfRoleMarker';top.insertBefore(m,top.lastElementChild||null)}
    m.className=`rsf-role-home ${ROLE==='PARENT'?'parent':''}`;m.textContent=ROLE==='PARENT'?'부모 모드':'아이 모드';
  }

  function explorerTerms(){
    if(ROLE!=='CHILD')return;
    const map=new Map([['타임어택 작전 설정','오늘의 탐험 준비'],['오늘 목표 정하기','오늘 탐험 정하기'],['작전 기록실','탐험 기록'],['작전 일지','탐험 일지'],['오늘의 작전 미리보기','오늘의 탐험 미리보기'],['작전 공유하기','가족에게 응원 요청'],['타임어택 START','탐험 시작'],['오늘의 작전 보고서','오늘의 탐험 기록'],['오늘의 작전','오늘의 탐험'],['오늘 작전, 내가 옆에서 같이 봐줄게.','오늘 탐험, 내가 옆에서 같이 봐줄게.']]);
    document.querySelectorAll('body *').forEach(el=>{if(el.children.length)return;const t=(el.textContent||'').trim();if(map.has(t))el.textContent=map.get(t)});
    const share=document.getElementById('missionShareBtn');if(share)share.textContent='가족에게 응원 요청 (선택)';
  }

  function hideLegacyChildSetup(){
    if(ROLE!=='CHILD')return;
    document.querySelectorAll('#missionView .glassCard').forEach(card=>{const h=card.querySelector('h2')?.textContent||'';if(h.includes('과제 분류')||h.includes('오늘 할 과제를 입력'))card.classList.add('rsf-hide')});
  }

  function normalizeHomeEntrypoints(){
    const share=document.getElementById('preShareBtn');if(share)share.style.display='none';
    const buttons=[...document.querySelectorAll('#homeView .commandCard > button')];
    const candidates=buttons.filter(btn=>/오늘 숙제 배포|오늘 목표 정하기|오늘 탐험 정하기|숙제 입력 · 확인/.test(btn.querySelector('b')?.textContent||''));
    if(candidates.length){
      const primary=candidates[0];
      const b=primary.querySelector('b'),s=primary.querySelector('small');
      if(ROLE==='PARENT'){
        if(b)b.textContent='숙제 입력 · 확인';if(s)s.textContent='숙제 원본 · 분량 · 마감 입력';
      }else{
        if(b)b.textContent='오늘 탐험 정하기';if(s)s.textContent='Planner가 준비한 오늘 할 일에서 선택';
      }
      candidates.slice(1).forEach(x=>x.style.display='none');
      if(!primary.dataset.nav)primary.dataset.nav='mission';
    }
    document.querySelectorAll('#homeView [data-nav="mission"]').forEach((btn,i)=>{
      if(candidates.includes(btn)&&btn!==candidates[0])return;
      if(!candidates.length||btn===candidates[0])return;
      if(i>0)btn.style.display='none';
    });
    if(ROLE==='PARENT'){
      const history=[...buttons].find(btn=>(btn.querySelector('b')?.textContent||'').includes('기록실'));
      if(history){const b=history.querySelector('b'),s=history.querySelector('small');if(b)b.textContent='학습 기록';if(s)s.textContent='아이의 진행과 완료 기록 보기'}
    }
  }

  function syncPlannerSelection(){
    window.ReadyStageD?.renderPlanner?.();
    setTimeout(()=>document.querySelector('#todayPlannerCard [data-plan-action="apply"]')?.click(),0);
  }

  function renderChild(){
    const main=document.querySelector('#missionView main');if(!main)return;
    document.getElementById('rsfParent')?.remove();
    let root=document.getElementById('rsfChild');if(!root){root=document.createElement('section');root.id='rsfChild';root.className='rsf-card';main.prepend(root)}
    const p=load(),day=ensureDay(p,today()),tasks=(day.tasks||[]).filter(t=>t.status!=='COMPLETED');
    root.innerHTML=`<span class="rsf-badge">아이 화면 · 오늘의 탐험</span><h2>오늘 뭐부터 할까?</h2><p>Planner가 오늘 할 일을 준비했어요. 지금 할 것을 고르고 목표 시간을 정해요.</p><div class="rsf-list">${tasks.length?tasks.map(t=>`<label class="rsf-task"><input type="checkbox" data-rsf-select="${esc(t.id)}" ${t.selected?'checked':''}><span><b>${esc(t.title||t.subject||'할 일')}</b><small>${esc(t.volume||'분량 미입력')}${t.estimatedMin?` · 예상 ${esc(t.estimatedMin)}분`:''}</small>${t.origin==='CHILD_ADDED'?'<span class="rsf-badge">학교에서 추가 · 부모 확인 예정</span>':''}</span></label>`).join(''):'<div class="rsf-task"><span></span><span><b>오늘 배정된 할 일이 아직 없어요.</b><small>학교에서 새 숙제가 생겼다면 아래에서 추가할 수 있어요.</small></span></div>'}</div><div class="rsf-event"><input id="rsfEventInput" placeholder="학교에서 새 숙제가 생겼어요"><button id="rsfEventAdd" class="rsf-btn">추가</button></div>`;
    root.querySelectorAll('[data-rsf-select]').forEach(ch=>ch.onchange=()=>{const q=load(),d=ensureDay(q,today()),t=d.tasks.find(x=>x.id===ch.dataset.rsfSelect);if(t)t.selected=ch.checked;save(q);syncPlannerSelection()});
    root.querySelector('#rsfEventAdd').onclick=()=>{const input=root.querySelector('#rsfEventInput'),title=input.value.trim();if(!title)return;const q=load(),d=ensureDay(q,today());d.tasks.push({id:id('todo'),localDate:today(),subject:'학교',sourceDay:'오늘',title,volume:'',difficulty:'미확정',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:'미확정',selected:false,status:'PLANNED',origin:'CHILD_ADDED',reviewState:'PARENT_REVIEW_PENDING',note:'아이 이벤트 숙제 추가 · 실행 가능 · 부모 확인 시 세부정보 보완'});save(q);renderChild();toast('새 숙제를 오늘 할 일에 추가했어요.')};
  }

  function transferTalentToStageD(root){
    window.ReadyStageD?.renderPlanner?.();
    setTimeout(()=>{
      let count=0;
      TALENT.forEach(subject=>{const src=root.querySelector(`[data-rsf-talent="${subject}"]`),dst=document.querySelector(`#todayPlannerCard [data-talent="${subject}"]`);if(!src||!dst)return;const volume=src.querySelector('[data-volume]').value.trim(),mins=src.querySelector('[data-min]').value;if(volume){dst.querySelector('.talent-volume').value=volume;dst.querySelector('.talent-min').value=mins;count++}});
      if(count){document.querySelector('#todayPlannerCard [data-plan-action="talent-create"]')?.click();toast('재능 숙제 입력을 저장했고 Planner가 주간 배정을 계산했어요.')}else toast('재능 분량을 먼저 입력해 주세요.');
    },0);
  }

  function renderParent(){
    const main=document.querySelector('#missionView main');if(!main)return;document.getElementById('rsfChild')?.remove();const h=document.querySelector('#missionView .pageHeader h1');if(h)h.textContent='숙제 입력 · 확인';
    let root=document.getElementById('rsfParent');if(!root){root=document.createElement('section');root.id='rsfParent';root.className='rsf-card';main.prepend(root)}
    const p=load(),day=ensureDay(p,today()),tasks=day.tasks||[];
    root.innerHTML=`<span class="rsf-badge">부모 화면 · 입력/확인</span><h2>숙제 내용만 입력해 주세요</h2><p>부모는 숙제를 입력·확인합니다. 날짜별 배정은 Planner가 담당합니다.</p><div class="rsf-list">${tasks.map(t=>`<div class="rsf-task" data-rsf-parent="${esc(t.id)}"><span></span><span><b>${esc(t.title||'숙제')}</b>${t.origin==='CHILD_ADDED'?'<span class="rsf-badge">아이 추가 · 확인 필요</span>':''}<div class="rsf-row"><input data-field="volume" placeholder="분량 예: p.12~18" value="${esc(t.volume||'')}"><select data-field="difficulty"><option ${t.difficulty==='미확정'?'selected':''}>미확정</option><option ${String(t.difficulty).includes('낮')?'selected':''}>낮음</option><option ${String(t.difficulty).includes('보통')?'selected':''}>보통</option><option ${String(t.difficulty).includes('높')?'selected':''}>높음</option></select><input data-field="estimatedMin" type="number" min="1" max="240" placeholder="예상 분" value="${Number.isFinite(Number(t.estimatedMin))?esc(t.estimatedMin):''}"></div><div class="rsf-row"><input data-field="deadline" placeholder="마감" value="${esc(t.deadline||'')}"><input data-field="subject" placeholder="과목" value="${esc(t.subject||'')}"><input data-field="title" placeholder="숙제명" value="${esc(t.title||'')}"></div></span></div>`).join('')}</div><div class="rsf-event"><input id="rsfParentNew" placeholder="새 숙제명"><button id="rsfParentAdd" class="rsf-btn alt">숙제 추가</button></div><div class="rsf-talent"><b>재능 이번 주 숙제 입력</b><p>선생님이 준 실제 분량만 입력하세요. 배정은 Planner가 계산합니다.</p><div class="rsf-talent-grid">${TALENT.map(s=>`<div class="rsf-talent-row" data-rsf-talent="${s}"><b>${s}</b><input data-volume placeholder="분량"><input data-min type="number" min="1" max="120" placeholder="분"></div>`).join('')}</div><button id="rsfTalentSave" class="rsf-btn alt" style="width:100%;margin-top:8px">재능 숙제 입력 저장</button></div><div class="rsf-sticky"><button id="rsfParentSave" class="rsf-btn" style="width:100%">숙제 입력 내용 저장</button></div>`;
    root.querySelector('#rsfParentAdd').onclick=()=>{const input=root.querySelector('#rsfParentNew'),title=input.value.trim();if(!title)return;const q=load(),d=ensureDay(q,today());d.tasks.push({id:id('todo'),localDate:today(),subject:'기타',sourceDay:'오늘',title,volume:'',difficulty:'미확정',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:'미확정',selected:false,status:'INBOX',origin:'PARENT_INPUT',note:'부모 입력 원본 · Planner 자동배정 대기'});save(q);renderParent()};
    root.querySelector('#rsfParentSave').onclick=()=>{const q=load(),d=ensureDay(q,today());root.querySelectorAll('[data-rsf-parent]').forEach(card=>{const t=d.tasks.find(x=>x.id===card.dataset.rsfParent);if(!t)return;card.querySelectorAll('[data-field]').forEach(el=>{let v=el.value;if(el.dataset.field==='estimatedMin')v=v?Number(v):null;t[el.dataset.field]=v});if(t.origin==='CHILD_ADDED')t.reviewState='PARENT_REVIEWED'});save(q);toast('숙제 입력 내용을 저장했어요. Planner 판단의 입력값으로 사용합니다.');renderParent()};
    root.querySelector('#rsfTalentSave').onclick=()=>transferTalentToStageD(root);
  }

  function patch(){ensureRoleMarker();normalizeHomeEntrypoints();explorerTerms();hideLegacyChildSetup();if(ROLE==='PARENT')renderParent();else renderChild()}
  function validate(){
    const marker=document.getElementById('rsfRoleMarker')?.textContent||'';
    const primary=[...document.querySelectorAll('#homeView .commandCard > button')].find(b=>b.style.display!=='none'&&/오늘 탐험 정하기|숙제 입력 · 확인/.test(b.querySelector('b')?.textContent||''));
    return{version:VERSION,role:ROLE,roleMarker:marker,homePrimary:primary?.querySelector('b')?.textContent||null,childSurface:!!document.getElementById('rsfChild'),parentSurface:!!document.getElementById('rsfParent')};
  }
  function boot(){
    document.documentElement.dataset.readyStageF=VERSION;document.documentElement.dataset.readyRole=ROLE;styles();patch();
    let scheduled=false;const mo=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensureRoleMarker();normalizeHomeEntrypoints();explorerTerms();hideLegacyChildSetup()})});
    mo.observe(document.getElementById('homeView')||document.body,{childList:true,subtree:true});
    window.ReadyStageF=Object.freeze({version:VERSION,role:ROLE,render:patch,validate});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();