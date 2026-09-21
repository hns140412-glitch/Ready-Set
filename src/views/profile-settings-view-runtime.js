(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const qa=options.queryAll||((s)=>[...document.querySelectorAll(s)]);
    const initials=options.initials||(()=> 'RS');
    const styleFilter=options.styleFilter||(()=> 'none');
    const guideData=options.guideData||(()=>({defaultName:'루미',personality:''}));
    const applyGuide=options.applyGuide||(()=>{});
    const renderNameSuggestions=options.renderNameSuggestions||(()=>{});
    const renderAuthStatus=options.renderAuthStatus||(()=>{});
    const renderSyncStatus=options.renderSyncStatus||(()=>Promise.resolve());

    function renderProfile(state){
      const img=q('#profileImage'),ph=q('#profilePlaceholder');
      const name=q('#profileName'); if(name)name.value=state.profile.name;
      const share=q('#shareAvatarOptIn'); if(share)share.checked=!!state.profile.shareAvatar;
      if(state.profile.photo){
        if(img){img.src=state.profile.photo;img.hidden=false;img.style.filter=styleFilter(state.profile.style)}
        if(ph)ph.hidden=true;
      }else{
        if(img)img.hidden=true;
        if(ph){ph.hidden=false;ph.textContent=initials()}
      }
      qa('[data-style]').forEach(b=>b.classList.toggle('on',b.dataset.style===state.profile.style));
      document.documentElement.style.setProperty('--avatar-bg',state.profile.photo?`url(${state.profile.photo})`:'linear-gradient(145deg,#ffe7d6,#eaa789)');
    }

    async function renderSettings(state){
      const nameInput=q('#guideNameInput');if(nameInput)nameInput.value=state.guide.name;
      const label=q('#guideNameLabel');if(label)label.textContent=state.guide.name;
      const personality=q('#guidePersonalityLabel');if(personality)personality.textContent=guideData().personality;
      applyGuide(q('#settingsGuidePortrait'));
      qa('[data-guide-type]').forEach(b=>b.classList.toggle('on',b.dataset.guideType===state.guide.type));
      qa('[data-guide-voice]').forEach(b=>b.classList.toggle('on',b.dataset.guideVoice===state.guide.voice));
      renderNameSuggestions(false);
      qa('[data-sound]').forEach(b=>b.classList.toggle('on',b.dataset.sound===state.sound));
      renderAuthStatus();
      await renderSyncStatus().catch(()=>{});
    }

    return Object.freeze({renderProfile,renderSettings});
  }

  root.ReadyRebuildProfileSettingsView=Object.freeze({
    version:'READY_REBUILD_PROFILE_SETTINGS_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
