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
      const source=item?.source==='SYSTEM_AUTO_CONTRAST'?'시스템 대비 방향':'내 선택';
      return '<article class="characterCandidatePlaceholder">'+
        '<div class="candidateVisual">'+escapeHtml(item.slot||'')+'</div>'+
        '<div><small>'+escapeHtml(source)+'</small><b>'+escapeHtml(label)+'</b></div>'+
      '</article>';
    }

    function render({profile,status,options=[],candidates=[]}={}){
      applyAvatar(q('#characterSourceAvatar'));
      const step=q('#characterSetupStep');
      const title=q('#characterSetupTitle');
      const copy=q('#characterSetupCopy');
      const grid=q('#characterDirectionGrid');
      const candidateWrap=q('#characterCandidateContract');
      const sourceMeta=q('#characterSourceMeta');

      if(sourceMeta){
        const p=profile?.sourcePhoto;
        sourceMeta.textContent=p?.source_hash?
          '원본 사진 기준 · '+String(p.source_hash).slice(0,10)+' · '+(p.width||'?')+'×'+(p.height||'?'):
          '먼저 프로필에서 사진을 등록해 주세요.';
      }

      if(status==='ROUND_1'){
        if(step)step.textContent='1 / 2';
        if(title)title.textContent='첫 번째 분위기를 골라줘';
        if(copy)copy.textContent='얼굴은 그대로 유지하고, 캐릭터가 주는 첫인상만 골라요.';
        if(grid){grid.hidden=false;grid.innerHTML=options.map(card).join('');}
        if(candidateWrap)candidateWrap.hidden=true;
        return;
      }

      if(status==='ROUND_2'){
        if(step)step.textContent='2 / 2';
        if(title)title.textContent='이번엔 다른 느낌을 하나 더 골라줘';
        if(copy)copy.textContent='첫 선택과 겹치지 않는 세 방향을 보여줘요. 두 번만 직접 고르면 끝이에요.';
        if(grid){grid.hidden=false;grid.innerHTML=options.map(card).join('');}
        if(candidateWrap)candidateWrap.hidden=true;
        return;
      }

      if(status==='READY_FOR_CANDIDATE_GENERATION'){
        if(step)step.textContent='READY';
        if(title)title.textContent='세 가지 방향이 준비됐어';
        if(copy)copy.textContent='두 개는 네 선택, 하나는 시스템이 대비되도록 만든 방향이에요.';
        if(grid)grid.hidden=true;
        if(candidateWrap){
          candidateWrap.hidden=false;
          candidateWrap.innerHTML=
            '<div class="characterCandidateHead"><small>A / B / C DIRECTION CONTRACT</small><h3>후보 생성 준비 완료</h3></div>'+
            '<div class="characterCandidateGrid">'+candidates.map(candidateCard).join('')+'</div>'+
            '<p class="muted">다음 단계에서 실제 이미지 생성 어댑터를 연결합니다. 현재는 유료 이미지 호출을 하지 않습니다.</p>';
        }
        return;
      }

      if(step)step.textContent='START';
      if(title)title.textContent='내 캐릭터 만들기';
      if(copy)copy.textContent='원본 사진을 기준으로 두 번의 선택만 받아요.';
      if(grid){grid.hidden=true;grid.innerHTML='';}
      if(candidateWrap)candidateWrap.hidden=true;
    }

    return Object.freeze({render});
  }

  root.ReadyCharacterSetupView=Object.freeze({
    version:'READY_CHARACTER_SETUP_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
