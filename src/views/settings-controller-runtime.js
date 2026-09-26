(function(root){
  'use strict';

  const VOICE_CONFIG=Object.freeze({
    warm:{rate:.92,pitch:1.02},
    bright:{rate:1.04,pitch:1.12},
    calm:{rate:.86,pitch:.94},
    playful:{rate:1.08,pitch:1.18}
  });

  function create(options={}){
    const view=options.view;
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>null);
    const toast=options.toast||(()=>{});
    const renderHome=options.renderHome||(()=>{});
    const renderMission=options.renderMission||(()=>{});
    const guideData=options.guideData||(()=>({defaultName:'루미'}));
    const guideNamePool=options.guideNamePool||[];
    const query=options.query||((s)=>root.document?.querySelector?.(s));
    const playBgm=options.playBgm||(()=>Promise.resolve());
    const pauseBgm=options.pauseBgm||(()=>Promise.resolve());
    const speech=options.speechSynthesis||root.speechSynthesis||null;
    const Utterance=options.SpeechSynthesisUtteranceCtor||root.SpeechSynthesisUtterance||null;
    let previewTimer=null;
    if(!view)throw new Error('SETTINGS_CONTROLLER_DEPENDENCY_MISSING');

    function renderSettings(){
      return Promise.resolve(view.renderSettings(getState())).catch(()=>{});
    }

    function setGuideName(value){
      const state=getState();
      state.guide.name=String(value||'').trim()||guideData().defaultName;
      save();renderSettings();renderHome();
      return state.guide.name;
    }

    function setGuideType(type){
      const state=getState();
      const prevDefault=guideData().defaultName;
      state.guide.type=type;
      if(!state.guide.name||state.guide.name===prevDefault)state.guide.name=guideData(type).defaultName;
      save();renderSettings();renderHome();
      toast(`${state.guide.name}와 함께할게요.`);
      return state.guide;
    }

    function renderNameSuggestions(reroll=true){
      const target=query('#nameSuggestions');if(!target)return [];
      if(!reroll&&target.children.length)return [...target.children].map(x=>x.textContent);
      const state=getState();
      const defaultName=guideData().defaultName;
      const candidates=[defaultName,...guideNamePool.filter(n=>n!==defaultName)]
        .map((name,index)=>({name,rank:(index*37+String(state.guide.type||'').length*11)%97}))
        .sort((a,b)=>a.rank-b.rank)
        .slice(0,5)
        .map(x=>x.name);
      target.innerHTML='';
      for(const name of candidates){
        const button=root.document.createElement('button');
        button.textContent=name;
        button.onclick=()=>setGuideName(name);
        target.appendChild(button);
      }
      return candidates;
    }

    function setGuideVoice(voice){
      const state=getState();
      state.guide.voice=voice;
      save();renderSettings();
      toast('길잡이 목소리를 바꿨어요.');
      return voice;
    }

    function speakGuide(text){
      if(!speech||!Utterance){
        toast('이 브라우저에서는 음성 안내를 지원하지 않아요.');
        return false;
      }
      speech.cancel();
      const utterance=new Utterance(text);
      utterance.lang='ko-KR';
      const cfg=VOICE_CONFIG[getState().guide.voice]||{rate:.95,pitch:1};
      utterance.rate=cfg.rate;utterance.pitch=cfg.pitch;utterance.volume=.92;
      speech.speak(utterance);
      return true;
    }

    async function setSound(sound){
      const state=getState();
      state.sound=sound;
      if(state.activeSession)state.activeSession.sound=sound;
      save();renderSettings();renderMission();
      if(sound==='OFF'){
        clearTimeout(previewTimer);
        await pauseBgm();
        return sound;
      }
      clearTimeout(previewTimer);
      await playBgm(sound,{preview:!state.activeSession});
      if(!state.activeSession)previewTimer=setTimeout(()=>pauseBgm(),4000);
      return sound;
    }

    return Object.freeze({
      renderSettings,
      setGuideName,
      setGuideType,
      renderNameSuggestions,
      setGuideVoice,
      speakGuide,
      setSound
    });
  }

  root.ReadyRebuildSettingsController=Object.freeze({
    version:'READY_REBUILD_SETTINGS_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
