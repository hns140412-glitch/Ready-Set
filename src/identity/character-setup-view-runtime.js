(function(root){
  'use strict';

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const escapeHtml=options.escapeHtml||(s=>String(s));
    const applyAvatar=options.applyAvatar||(()=>{});

    function card(option){
      const keywords=(option.keywords||[]).join(' · ');
      return '<button class="characterDirectionCard" data-character-direction="'+escapeHtml(option.id)+'">'+
        '<span class="characterDirectionArt '+escapeHtml(String(option.id||'').toLowerCase())+'" aria-hidden="true"></span>'+
        '<strong>'+escapeHtml(option.label||option.id)+'</strong>'+
        '<small>'+escapeHtml(keywords)+'</small>'+
      '</button>';
    }

    function candidateCard(item){
      const label=item?.direction?.label||item?.direction_label||item?.direction_id||item?.slot;
      const source=item?.source==='SYSTEM_AUTO_CONTRAST'
        ? '시스템이 만든 대비 방향'
        : item?.source==='USER_SELECTION_1'?'내 첫 번째 선택':'내 두 번째 선택';
      return '<article class="characterCandidatePlaceholder">'+
        '<div class="candidateVisual">'+escapeHtml(item.slot||'')+'</div>'+
        '<div><small>'+escapeHtml(source)+'</small><b>'+escapeHtml(label)+'</b></div>'+
      '</article>';
    }

    function consistencyBadge(job){
      const gate=job?.consistency_gate;
      if(!gate)return '<span class="characterGateBadge pending">일관성 검사 전</span>';
      const structural=gate.structural?.state||'NOT_RUN';
      const visual=gate.visual?.state||'NOT_RUN';
      const human=gate.human_confirmation?.state||'NOT_RUN';
      const finalState=gate.final_state||'PENDING';
      const cls=finalState==='PASS'?'pass':visual==='FAIL'||human==='FAIL'||structural==='FAIL'?'fail':'pending';
      const label=finalState==='PASS'
        ? 'LOCK 가능'
        : visual==='FAIL'?'시각 일관성 재검토 필요'
        : human==='PASS'?'확인 완료 · 시각검사 대기'
        : visual==='PASS'?'시각검사 통과 · 내 확인 필요'
        : structural==='PASS'?'구조검사 통과 · 시각검사 필요'
        :'일관성 검사 대기';
      return '<span class="characterGateBadge '+cls+'">'+escapeHtml(label)+'</span>';
    }

    function remoteCandidateCard(profile,job,item){
      const slot=item?.slot||'';
      const direction=(job?.directions||[]).find(x=>x.slot===slot)||item;
      const label=direction?.direction_label||direction?.direction_id||slot;
      const source=direction?.source==='SYSTEM_AUTO_CONTRAST'
        ? '시스템이 만든 대비 방향'
        : direction?.source==='USER_SELECTION_1'?'내 첫 번째 선택':'내 두 번째 선택';
      const asset=job?.candidate_assets?.[slot];
      const visualId=encodeURIComponent(String(profile?.visualId||''));
      const url='/api/character/asset?visual_id='+visualId+'&slot='+encodeURIComponent(slot);
      const visual=asset
        ? '<img class="candidateGeneratedImage" src="'+url+'" alt="캐릭터 후보 '+escapeHtml(slot)+'">'
        : '<div class="candidateVisual">'+escapeHtml(slot)+'</div>';
      const select=job?.status==='READY_FOR_SELECTION'
        ? '<button class="miniAction" data-select-character-candidate="'+escapeHtml(slot)+'">이 방향 선택</button>'
        : '';
      const review=(job?.consistency_gate?.visual?.candidates||[]).find(x=>String(x?.slot||'')===String(slot));
      const reviewLine=review
        ? '<span class="candidateReview '+(review.same_child_identity?'pass':'fail')+'">'+
          (review.same_child_identity?'같은 나':'Identity drift')+
          ' · '+escapeHtml(review.identity_drift_risk||'')+
          '</span>'
        : '';
      const selected=String(job?.selected_slot||'')===String(slot);
      return '<article class="characterCandidatePlaceholder" data-selected="'+(selected?'true':'false')+'">'+visual+
        '<div><small>'+escapeHtml(source)+'</small><b>'+escapeHtml(label)+'</b>'+reviewLine+select+'</div>'+
      '</article>';
    }

    function render({profile,status,options=[],candidates=[],remoteJob=null,master=null}={}){
      applyAvatar(q('#characterSourceAvatar'));
      const step=q('#characterSetupStep');
      const title=q('#characterSetupTitle');
      const copy=q('#characterSetupCopy');
      const grid=q('#characterDirectionGrid');
      const candidateWrap=q('#characterCandidateContract');
      const sourceMeta=q('#characterSourceMeta');
      const begin=q('#beginCharacterSetupBtn');

      if(sourceMeta){
        const p=profile?.sourcePhoto;
        sourceMeta.textContent=p?.source_hash?
          '원본 사진 기준 · '+String(p.source_hash).slice(0,10)+' · '+(p.width||'?')+'×'+(p.height||'?'):
          '먼저 프로필에서 사진을 등록해 주세요.';
      }

      if(status==='ROUND_1'){
        if(begin)begin.hidden=true;
        if(step)step.textContent='1 / 2';
        if(title)title.textContent='첫 번째 분위기를 골라줘';
        if(copy)copy.textContent='사진 속 나는 그대로예요. 여기서는 얼굴이 아니라 캐릭터가 주는 분위기만 골라요.';
        if(grid){grid.hidden=false;grid.innerHTML=options.map(card).join('');}
        if(candidateWrap)candidateWrap.hidden=true;
        return;
      }

      if(status==='ROUND_2'){
        if(begin)begin.hidden=true;
        if(step)step.textContent='2 / 2';
        if(title)title.textContent='이번엔 다른 느낌을 하나 더 골라줘';
        if(copy)copy.textContent='같은 나를 유지한 채 다른 분위기 세 가지를 보여줘요. 두 번만 직접 고르면 끝이에요.';
        if(grid){grid.hidden=false;grid.innerHTML=options.map(card).join('');}
        if(candidateWrap)candidateWrap.hidden=true;
        return;
      }

      if(status==='READY_FOR_CANDIDATE_GENERATION'){
        if(begin)begin.hidden=true;
        if(step)step.textContent='READY';
        if(title)title.textContent='세 가지 방향이 준비됐어';
        if(copy)copy.textContent='세 후보 모두 같은 나예요. 달라지는 건 분위기와 표현 방향뿐이에요.';
        if(grid)grid.hidden=true;
        if(candidateWrap){
          candidateWrap.hidden=false;
          const job=remoteJob;
          let controls='';
          let note='원본 사진과 A/B/C 계약을 서버에 안전하게 등록할 수 있어요.';
          if(!job){
            controls='<button class="btn outline" id="prepareCharacterJobBtn">서버 생성 준비</button>';
            note+=' 유료 이미지 생성은 아직 잠겨 있습니다.';
          }else if(job.status==='QUEUED_PROVIDER_LOCKED'){
            note='서버 등록 완료 · 이미지 생성은 외부 리소스 게이트로 잠겨 있습니다.';
          }else if(job.status==='QUEUED'||String(job.status||'').startsWith('CANDIDATE_')){
            controls='<button class="btn dark" id="generateCharacterCandidatesBtn">A/B/C 후보 생성</button>';
            note='서버 계약이 준비됐습니다. 생성 게이트가 열린 환경에서만 이미지 API를 호출합니다.';
          }else if(job.status==='READY_FOR_SELECTION'){
            note='세 후보가 준비됐습니다. 먼저 마음에 드는 방향을 고르세요. 선택은 분위기 선택일 뿐, 닮기 승인은 아직 아니에요.';
          }else if(job.status==='SELECTED'||job.status==='CORRECTED'){
            const gate=job.consistency_gate||{};
            const visualState=gate.visual?.state||'NOT_RUN';
            const humanState=gate.human_confirmation?.state||'NOT_RUN';
            const canLock=gate.lock_allowed===true&&gate.final_state==='PASS';
            if(visualState==='NOT_RUN'||visualState==='BLOCKED'){
              note='선택한 캐릭터가 원본 사진의 같은 아이인지 시각 일관성 검사가 필요해요.';
              controls='<button class="btn outline" id="reviewCharacterConsistencyBtn">같은 나인지 검사</button>'+
                '<button class="btn outline" id="correctCharacterLikenessBtn">원본 사진에 더 닮게</button>';
            }else if(visualState==='FAIL'){
              note='선택한 캐릭터의 동일 인물성이 충분하지 않아요. 닮기 보정 후 다시 검사해야 해요.';
              controls='<button class="btn outline" id="correctCharacterLikenessBtn">원본 사진에 더 닮게</button>'+
                '<button class="btn outline" id="reviewCharacterConsistencyBtn">다시 검사</button>';
            }else if(visualState==='PASS'&&humanState!=='PASS'){
              note='시각 검사는 통과했어요. 마지막으로 네가 봐도 같은 나인지 확인해 주세요.';
              controls='<button class="btn dark" id="confirmSameIdentityBtn">응, 나랑 닮았어</button>'+
                '<button class="btn outline" id="correctCharacterLikenessBtn">조금 더 닮게</button>';
            }else if(canLock){
              note='시각 검사와 같은 나 확인이 모두 끝났습니다. 이제 Visual ID를 잠글 수 있어요.';
              controls='<button class="btn dark" id="lockCharacterMasterBtn">Visual ID 확정</button>';
            }else{
              note='일관성 Gate를 확인하는 중이에요.';
              controls='<button class="btn outline" id="reviewCharacterConsistencyBtn">일관성 다시 확인</button>';
            }
          }
          }else if(job.status==='VISUAL_ID_LOCKED'){
            note='Visual ID가 확정됐습니다. 이제 같은 캐릭터에서 프로필용 정사각형과 카드용 세로 이미지를 준비해요.';
            controls='<button class="btn dark" id="buildCharacterDerivativesBtn">활용 이미지 준비</button>';
          }else if(job.status==='MASTER_ASSETS_READY'){
            if(job.master_sheet?.asset_key){
              note='Visual ID, 활용 이미지, Character Master Sheet까지 준비됐습니다.';
            }else{
              note='프로필/카드용 활용 이미지가 준비됐습니다. 필요하면 일관성 확인용 Character Master Sheet를 만들 수 있어요.';
              controls=job.provider_generation_enabled
                ? '<button class="btn dark" id="generateCharacterMasterSheetBtn">Character Master 만들기</button>'
                : '';
            }
          }
          const displayCandidates=(job?.directions||candidates).map(x=>({slot:x.slot||'',...x}));
          candidateWrap.innerHTML=
            '<div class="characterCandidateHead"><small>SAME ME · THREE DIRECTIONS</small><h3>'+
              (job?.status==='READY_FOR_SELECTION'?'후보를 골라줘':
               job?.status==='SELECTED'?'후보 선택 완료':
               job?.status==='CORRECTED'?'닮기 보정 완료':
               job?.status==='VISUAL_ID_LOCKED'?'Visual ID 확정':
               job?.status==='MASTER_ASSETS_READY'?(job?.master_sheet?.asset_key?'Character Master 완료':'활용 이미지 준비 완료'):'후보 생성 준비')+
            '</h3></div>'+
            '<div class="characterCandidateGrid">'+
              (job?displayCandidates.map(x=>remoteCandidateCard(profile,job,x)).join(''):candidates.map(candidateCard).join(''))+
            '</div>'+
            ((job?.status==='SELECTED'||job?.status==='CORRECTED'||job?.status==='VISUAL_ID_LOCKED'||job?.status==='MASTER_ASSETS_READY')
              ? '<div class="selectedCharacterPreview"><img src="/api/character/asset?visual_id='+encodeURIComponent(String(profile?.visualId||''))+'&slot='+
                (job?.status==='CORRECTED'||(job?.status==='VISUAL_ID_LOCKED'||job?.status==='MASTER_ASSETS_READY')&&job?.corrected_asset?'CORRECTED':'SELECTED')+
                '" alt="선택한 캐릭터"></div>'
              : '')+
            (job?.status==='MASTER_ASSETS_READY'&&job?.master_sheet?.asset_key
              ? '<div class="characterMasterSheetPreview"><img src="/api/character/asset?visual_id='+encodeURIComponent(String(profile?.visualId||''))+'&slot=MASTER_SHEET" alt="Character Master Sheet"></div>'
              : '')+
            '<div class="characterIdentityRule"><b>같은 나, 다른 분위기</b><span>얼굴·나이 인상·기본 체형은 유지하고 표정·포즈·탐험 분위기만 달라져요.</span></div>'+
            (job?'<div class="characterGateRow">'+consistencyBadge(job)+'</div>':'')+
            '<p class="muted">'+escapeHtml(note)+'</p>'+controls+
            '<p class="muted" id="characterRemoteStatus">'+escapeHtml(job?.status||'아직 서버 등록 전')+'</p>';
        }
        return;
      }

      if(begin)begin.hidden=false;
      if(step)step.textContent='START';
      if(title)title.textContent='내 캐릭터 만들기';
      if(copy)copy.textContent='원본 사진을 기준으로 두 번의 선택만 받아요.';
      if(grid){grid.hidden=true;grid.innerHTML='';}
      if(candidateWrap)candidateWrap.hidden=true;
    }

    return Object.freeze({render});
  }

  const api=Object.freeze({
    version:'CHARACTER_VISUAL_ID_SETUP_VIEW_V01',
    owner:'CHARACTER_VISUAL_ID',
    create
  });
  root.CharacterVisualIdSetupView=api;
  root.ReadyCharacterSetupView=api;
})(typeof globalThis!=='undefined'?globalThis:this);
