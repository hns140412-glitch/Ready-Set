(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_JOURNEY_V01';
  const CREW=Object.freeze([
    {id:'dubi',name:'두비',keywords:['친구','용기','함께'],line:'언제나 너와 함께!'},
    {id:'lori',name:'로리',keywords:['호기심','발견','관찰'],line:'호기심이 나를 움직여!'},
    {id:'ink',name:'잉크',keywords:['기록','지식','분석'],line:'기록하면 발견이 보여!'},
    {id:'nova',name:'노바',keywords:['상상','창의','빛'],line:'상상하면 길이 보여!'},
    {id:'take',name:'테이크',keywords:['도전','성장','리더십'],line:'도전하는 내가 멋져!'},
    {id:'zero',name:'제로',keywords:['집중','신뢰','꾸준함'],line:'차분하게, 끝까지!'}
  ]);
  const ACCENTS=Object.freeze([
    {id:'BLUE',label:'파랑'},
    {id:'GREEN',label:'초록'},
    {id:'PURPLE',label:'보라'},
    {id:'PINK',label:'분홍'},
    {id:'ORANGE',label:'주황'},
    {id:'YELLOW',label:'노랑'}
  ]);

  const crewById=id=>CREW.find(x=>x.id===String(id||'').toLowerCase())||null;
  const lockedVisualId=p=>Boolean(
    ['VISUAL_ID_LOCKED','MASTER_ASSETS_READY'].includes(p?.characterRemoteJob?.status) ||
    ['VISUAL_ID_LOCKED','MASTER_ASSETS_READY'].includes(p?.characterMaster?.status) ||
    ['LOCKED','VISUAL_ID_LOCKED','MASTER_ASSETS_READY'].includes(p?.characterMaster?.state)
  );

  function ensure(state){
    state.expedition=state.expedition||{};
    state.expedition.formation=state.expedition.formation||{};
    const f=state.expedition.formation;
    if(!f.version)f.version=VERSION;
    if(typeof f.crewMet!=='boolean')f.crewMet=false;
    if(typeof f.pendingAccent!=='string')f.pendingAccent='';
    f.worldEntry=f.worldEntry||{mode:'FIRST_JOURNEY_INTRO',variant:null,permanentBranch:false,complete:false,skipped:false};
    f.island=f.island||{discovered:false,name:''};
    f.baseCamp=f.baseCamp||{arrived:false,name:''};
    return f;
  }

  function stage(state){
    const f=ensure(state);
    const p=state.profile||{};
    if(!f.crewMet)return 'CREW_MEET';
    if(!state.expedition.primaryCompanionId)return 'COMPANION_SELECT';
    if(!String(state.expedition.primaryCompanionAlias||'').trim())return 'COMPANION_NAME';
    if(!p.sourcePhoto?.source_hash)return 'PHOTO_REQUIRED';
    if(!lockedVisualId(p))return 'CHARACTER_FORMATION';
    if(!state.expedition.sharedAccent)return 'SHARED_ACCENT';
    if(!f.worldEntry.complete)return 'WORLD_ENTRY';
    if(!f.island.discovered)return 'ISLAND_DISCOVERY';
    if(!String(f.island.name||'').trim())return 'ISLAND_NAME';
    if(!f.baseCamp.arrived)return 'BASE_CAMP_MOVE';
    if(!String(f.baseCamp.name||'').trim())return 'BASE_CAMP_NAME';
    return 'READY';
  }

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const nav=options.nav||(()=>{});
    const toast=options.toast||(()=>{});
    const assetRegistry=options.assetRegistry||null;
    const rootEl=q('#formationJourneyView');
    const body=q('#formationJourneyBody');
    const step=q('#formationJourneyStep');
    if(!rootEl||!body)return Object.freeze({render(){},stage(){return 'UNAVAILABLE';},syncAfterCharacterLock(){}});

    let bound=false;
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    function crewCard(c,selectable=false){
      return '<button class="formationCrewCard" '+(selectable?'data-formation-crew="'+c.id+'"':'disabled')+'>'+
        '<img data-cf-asset-group="crew" data-cf-asset-key="'+c.id+'" alt="">'+
        '<b>'+esc(c.name)+'</b><small>'+esc(c.line)+'</small>'+
        '<span>'+esc(c.keywords.join(' · '))+'</span>'+
      '</button>';
    }

    function crewMeetFigure(c,index){
      return '<figure class="formationCrewMeetFigure figure-'+index+'">'+
        '<img data-cf-asset-group="crew" data-cf-asset-key="'+c.id+'" alt="">'+
        '<figcaption><b>'+esc(c.name)+'</b><small>'+esc(c.keywords.slice(0,2).join(' · '))+'</small></figcaption>'+
      '</figure>';
    }

    function render(){
      const state=getState();
      const f=ensure(state);
      const s=stage(state);
      rootEl.dataset.formationStage=s;
      if(step)step.textContent=s.replaceAll('_',' · ');

      if(s==='CREW_MEET'){
        body.innerHTML='<div class="formationIntro"><small>CORE 6 · MEET THE CREW</small><h2>먼저 여섯 친구를 모두 만나볼까?</h2><p>아직 한 명을 고르는 단계가 아니야. 같은 탐험대의 여섯 친구를 먼저 함께 만나보자.</p></div>'+
          '<div class="formationCrewMeetStage"><div class="formationCrewMeetBanner"><span>SAME ISLAND · ONE CREW</span><b>서로 다른 여섯 친구, 하나의 탐험대</b></div>'+
          '<div class="formationCrewMeetConstellation">'+CREW.map((c,i)=>crewMeetFigure(c,i)).join('')+'</div></div>'+
          '<button class="btn dark" data-formation-action="MEET_DONE">여섯 친구 모두 만났어 →</button>';
      }else if(s==='COMPANION_SELECT'){
        body.innerHTML='<div class="formationIntro"><small>PRIMARY COMPANION</small><h2>누가 너와 가장 함께하고 싶어?</h2><p>이제 한 명을 가장 가까운 동행으로 골라. 나머지 다섯 친구도 같은 탐험대원으로 계속 함께해.</p></div>'+
          '<div class="formationCrewGrid selectable">'+CREW.map(c=>crewCard(c,true)).join('')+'</div>';
      }else if(s==='COMPANION_NAME'){
        const c=crewById(state.expedition.primaryCompanionId);
        const value=state.expedition.primaryCompanionAlias||c?.name||'';
        body.innerHTML='<div class="formationNameStage">'+
          '<img class="formationNameCrew" data-cf-asset-group="crew" data-cf-asset-key="'+esc(c?.id||'dubi')+'" alt="">'+
          '<div class="formationNameCopy"><small>COMPANION NAME</small><h2>'+esc(c?.name||'동행 탐험대원')+'를 뭐라고 부를까?</h2><p>'+esc(c?.line||'같이 떠나자!')+'</p><span>Visual ID는 그대로 · 이름/호칭만 정하기</span></div>'+
          '</div>'+
          '<label class="formationInput formationNameInput">이름 / 호칭<input id="formationCompanionAlias" maxlength="20" value="'+esc(value)+'"></label>'+
          '<button class="btn dark" data-formation-action="SAVE_ALIAS">이 이름으로 함께할래 →</button>';
      }else if(s==='PHOTO_REQUIRED'){
        body.innerHTML='<div class="formationIntro"><small>YOUR PHOTO</small><h2>이제 너의 모습을 준비할 차례야</h2><p>사진 속 너의 정체성을 기준으로 캐릭터를 만들고, Core 6의 모습은 바꾸지 않아.</p></div>'+
          '<button class="btn dark" data-formation-action="OPEN_PROFILE">사진 준비하기 →</button>';
      }else if(s==='CHARACTER_FORMATION'){
        body.innerHTML='<div class="formationIntro"><small>YOUR CHARACTER</small><h2>사진 속 나는 그대로, 표현만 찾아가자</h2><p>시그니처 아이템 → 탐험 방향 1 → 탐험 방향 2 → 자동 대비 방향 → A/B/C 동일 아이 → 선택 → 닮기 보정 → Visual ID 확정 순서로 진행해.</p></div>'+
          '<button class="btn dark" data-formation-action="OPEN_CHARACTER">내 캐릭터 만들기 계속 →</button>';
      }else if(s==='SHARED_ACCENT'){
        const selected=f.pendingAccent||state.expedition.sharedAccent||'';
        body.innerHTML='<div class="formationIntro"><small>SHARED EXPEDITION ACCENT</small><h2>탐험대 색을 골라줘</h2><p>아이와 탐험대의 허용된 후드·재킷·장비 포인트에만 함께 적용돼. 각 친구의 고유한 색과 Visual ID는 그대로야.</p></div>'+
          '<div class="formationAccentGrid">'+ACCENTS.map(a=>'<button class="formationAccent '+a.id.toLowerCase()+(selected===a.id?' selected':'')+'" data-formation-accent="'+a.id+'"><i></i><b>'+a.label+'</b></button>').join('')+'</div>'+
          '<button class="btn dark" data-formation-action="SAVE_ACCENT" '+(selected?'':'disabled')+'>이 색으로 할게! →</button>';
      }else if(s==='WORLD_ENTRY'){
        body.innerHTML='<div class="formationIntro"><small>FIRST JOURNEY · VOYAGE / DROP</small><h2>어떤 방식으로 섬에 들어갈까?</h2><p>항해와 낙하는 같은 섬으로 향하는 첫 여정 연출 선택이야. 섬·기록·학습 구조를 갈라놓는 영구 분기는 아니야.</p></div>'+
          '<div class="formationWorldEntry selectable">'+
            '<button class="formationEntryChoice voyage" data-formation-entry="VOYAGE"><small>VOYAGE</small><b>항해모드</b><span>바다를 건너 섬으로</span></button>'+
            '<button class="formationEntryChoice drop" data-formation-entry="DROP"><small>DROP</small><b>낙하모드</b><span>하늘을 지나 섬으로</span></button>'+
          '</div>'+
          '<button class="linkBtn" data-formation-action="WORLD_ENTRY_SKIP">SKIP</button>';
      }else if(s==='ISLAND_DISCOVERY'){
        body.innerHTML='<div class="formationIntro"><small>ISLAND DISCOVERY</small><h2>섬을 발견했어!</h2><p>이제부터 Ready & Set, Hide & Seek, Snap & Pop은 서로 다른 섬이 아니라 이 하나의 섬 안에서 이어져.</p></div>'+
          '<button class="btn dark" data-formation-action="DISCOVER_ISLAND">섬을 가까이서 볼래 →</button>';
      }else if(s==='ISLAND_NAME'){
        body.innerHTML='<div class="formationIntro"><small>NAME YOUR ISLAND</small><h2>이 섬의 이름을 지어볼까?</h2><p>섬의 모습과 기록은 이어지고, 이름은 나중에도 바꿀 수 있어.</p></div>'+
          '<label class="formationInput">섬 이름<input id="formationIslandName" maxlength="24" placeholder="섬 이름을 입력해줘"></label>'+
          '<button class="btn dark" data-formation-action="SAVE_ISLAND_NAME">이 섬으로 정하기 →</button>';
      }else if(s==='BASE_CAMP_MOVE'){
        body.innerHTML='<div class="formationIntro"><small>MOVE TO BASE CAMP</small><h2>이제 우리의 베이스캠프로 가자</h2><p>Ready & Set은 이 섬의 허브가 되고, 다른 탐험 구역과 학습 기록도 여기에서 이어져.</p></div>'+
          '<button class="btn dark" data-formation-action="ARRIVE_BASE_CAMP">Base Camp로 이동 →</button>';
      }else if(s==='BASE_CAMP_NAME'){
        body.innerHTML='<div class="formationIntro"><small>NAME YOUR BASE CAMP</small><h2>베이스캠프 이름도 정해보자</h2><p>이름은 바꿀 수 있지만, 탐험 기록·뱃지·관계·섬의 연속성은 그대로 보존돼.</p></div>'+
          '<label class="formationInput">Base Camp 이름<input id="formationBaseCampName" maxlength="24" placeholder="베이스캠프 이름을 입력해줘"></label>'+
          '<button class="btn dark" data-formation-action="SAVE_BASE_CAMP_NAME">이 이름으로 시작할래 →</button>';
      }else{
        const c=crewById(state.expedition.primaryCompanionId);
        body.innerHTML='<div class="formationIntro ready"><small>READY</small><h2>'+esc(f.baseCamp.name)+'에서 첫 탐험을 시작할 준비가 됐어</h2><p>'+esc(f.island.name)+' · '+esc(state.expedition.primaryCompanionAlias||c?.name||'탐험대원')+' · '+esc(ACCENTS.find(a=>a.id===state.expedition.sharedAccent)?.label||'')+' 포인트</p></div>'+
          '<button class="btn dark" data-formation-action="GO_READY">Ready & Set 시작 →</button>';
      }
      assetRegistry?.bind?.(body);
      save();
      return s;
    }

    function selectAccent(id){
      if(!ACCENTS.some(x=>x.id===id))return false;
      const state=getState(),f=ensure(state);
      f.pendingAccent=id;
      save();
      render();
      return true;
    }

    function bind(){
      if(bound)return;bound=true;
      rootEl.addEventListener('click',e=>{
        const crew=e.target.closest?.('[data-formation-crew]');
        if(crew){
          const id=crew.dataset.formationCrew;
          if(!crewById(id))return;
          const state=getState();ensure(state);
          state.expedition.primaryCompanionId=id;
          state.expedition.primaryCompanionAlias='';
          save();render();return;
        }
        const accent=e.target.closest?.('[data-formation-accent]');
        if(accent){selectAccent(accent.dataset.formationAccent);return;}
        const entry=e.target.closest?.('[data-formation-entry]');
        if(entry){
          const mode=String(entry.dataset.formationEntry||'').toUpperCase();
          if(!['VOYAGE','DROP'].includes(mode))return;
          const state=getState(),f=ensure(state);
          f.worldEntry.variant=mode;
          f.worldEntry.complete=true;
          f.worldEntry.skipped=false;
          save();render();return;
        }
        const action=e.target.closest?.('[data-formation-action]')?.dataset.formationAction;
        if(!action)return;
        const state=getState(),f=ensure(state);
        if(action==='MEET_DONE'){f.crewMet=true;save();render();}
        else if(action==='SAVE_ALIAS'){
          const c=crewById(state.expedition.primaryCompanionId);
          const value=String(q('#formationCompanionAlias')?.value||c?.name||'').trim();
          if(!value){toast('이름이나 호칭을 입력해 주세요.');return;}
          state.expedition.primaryCompanionAlias=value;save();render();
        }else if(action==='OPEN_PROFILE')nav('profile');
        else if(action==='OPEN_CHARACTER')nav('character-setup');
        else if(action==='SAVE_ACCENT'){
          const chosen=f.pendingAccent||state.expedition.sharedAccent||'';
          if(!chosen){toast('탐험대 색을 하나 골라 주세요.');return;}
          state.expedition.sharedAccent=chosen;
          f.pendingAccent='';
          save();render();
        }else if(action==='WORLD_ENTRY_SKIP'){
          f.worldEntry.variant='SKIP';
          f.worldEntry.complete=true;
          f.worldEntry.skipped=true;
          save();render();
        }else if(action==='DISCOVER_ISLAND'){f.island.discovered=true;save();render();}
        else if(action==='SAVE_ISLAND_NAME'){
          const value=String(q('#formationIslandName')?.value||'').trim();
          if(!value){toast('섬 이름을 입력해 주세요.');return;}
          f.island.name=value;save();render();
        }else if(action==='ARRIVE_BASE_CAMP'){f.baseCamp.arrived=true;save();render();}
        else if(action==='SAVE_BASE_CAMP_NAME'){
          const value=String(q('#formationBaseCampName')?.value||'').trim();
          if(!value){toast('Base Camp 이름을 입력해 주세요.');return;}
          f.baseCamp.name=value;save();render();
        }else if(action==='GO_READY')nav('home');
      });
    }

    function syncAfterCharacterLock(){
      const state=getState();ensure(state);save();return render();
    }

    bind();
    return Object.freeze({version:VERSION,render,stage:()=>stage(getState()),syncAfterCharacterLock,crew:CREW,accents:ACCENTS});
  }

  root.CharacterFormationJourneyRuntime=Object.freeze({version:VERSION,create,CREW,ACCENTS});
})(typeof globalThis!=='undefined'?globalThis:this);
