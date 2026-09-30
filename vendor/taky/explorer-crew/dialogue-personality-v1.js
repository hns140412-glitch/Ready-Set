(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewPersonalityRegistry);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./personality-registry-v2.js'));
  }else if(root)root.TakyExplorerCrewDialoguePersonality=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(registry){
  'use strict';
  const VERSION='EXPLORER_CREW_DIALOGUE_PERSONALITY_V2';

  const CORE_SCENE=Object.freeze({
    IDEA:'idea',EMOTION:'emotion',DESCRIPTION:'description',VIEWPOINT:'viewpoint',FINAL:'final'
  });

  const KEYWORD_STYLE=Object.freeze({
    차분함:'CALM',안정감:'CALM',여유:'CALM',탐색:'EXPLORE',발견:'EXPLORE',탐험:'EXPLORE',지도:'EXPLORE',호기심:'EXPLORE',길찾기:'SOLVE',
    관찰:'OBSERVE',기록:'OBSERVE',연구:'OBSERVE',분석:'OBSERVE',신중함:'OBSERVE',집중:'OBSERVE',끈기:'OBSERVE',
    문제해결:'SOLVE',전략:'SOLVE',제작:'SOLVE',정리:'SOLVE',기획:'SOLVE',
    행동:'ACTION',에너지:'ACTION',도전:'ACTION',활력:'ACTION',활동적:'ACTION',실행:'ACTION',장난기:'ACTION',활기:'ACTION',낙천:'ACTION',
    공감:'EMPATHY',치유:'EMPATHY',응원:'EMPATHY',다정함:'EMPATHY',따뜻함:'EMPATHY',배려:'EMPATHY',안정감:'EMPATHY',
    소통:'CONNECT',연결:'CONNECT',리더십:'CONNECT',팀워크:'CONNECT',동행:'CONNECT',협력:'CONNECT',
    변화:'ADAPT',적응:'ADAPT',유연함:'ADAPT',긍정:'ADAPT',
    기억:'MEMORY',추억:'MEMORY',창의:'CREATE',아이디어:'CREATE'
  });
  function styleGroup(p){
    for(const keyword of p?.keywords||[]){
      if(KEYWORD_STYLE[keyword])return KEYWORD_STYLE[keyword];
    }
    return 'NEUTRAL';
  }

  const DERIVED=Object.freeze({
    EXPLORE:Object.freeze({ASK:'어디부터 살펴볼까?',HINT:'눈에 띄는 단서 하나만 찾아볼까?',ACKNOWLEDGE:'좋아, 다음 단서를 보자.'}),
    OBSERVE:Object.freeze({ASK:'지금 가장 눈에 들어오는 건 뭐야?',HINT:'작은 차이 하나만 더 찾아볼까?',ACKNOWLEDGE:'좋아, 그걸 기록해 두자.'}),
    EMPATHY:Object.freeze({ASK:'지금 마음에서 가장 먼저 떠오르는 건 뭐야?',HINT:'천천히 하나만 말해도 괜찮아.',ACKNOWLEDGE:'응, 그 마음을 기억해 둘게.'}),
    SOLVE:Object.freeze({ASK:'먼저 하나만 골라서 풀어볼까?',HINT:'순서를 하나씩 나눠보자.',ACKNOWLEDGE:'좋아, 한 단계 해결했네.'}),
    ACTION:Object.freeze({ASK:'어떤 것부터 해볼까?',HINT:'한 가지만 먼저 해보자.',ACKNOWLEDGE:'좋아, 바로 다음으로 가보자.'}),
    CREATE:Object.freeze({ASK:'어떤 생각을 하나 더 붙여볼까?',HINT:'기억나는 장면 하나만 떠올려보자.',ACKNOWLEDGE:'좋아, 그 생각을 남겨두자.'}),
    CONNECT:Object.freeze({ASK:'누구와 무엇을 이어보면 좋을까?',HINT:'하나만 연결해보자.',ACKNOWLEDGE:'좋아, 연결이 하나 생겼네.'}),
    ADAPT:Object.freeze({ASK:'지금 상황에 맞춰 어떤 방법으로 바꿔볼까?',HINT:'한 가지만 조금 바꿔서 다시 해보자.',ACKNOWLEDGE:'좋아, 상황에 맞게 잘 바꿨네.'}),
    MEMORY:Object.freeze({ASK:'오늘 기억해 두고 싶은 건 뭐야?',HINT:'좋았던 장면 하나만 떠올려보자.',ACKNOWLEDGE:'좋아, 그 기억을 남겨두자.'}),
    CALM:Object.freeze({ASK:'서두르지 말고, 지금 어디부터 보면 좋을까?',HINT:'천천히 한 가지만 확인해보자.',ACKNOWLEDGE:'좋아, 우리 속도로 잘 찾고 있어.'}),
    NEUTRAL:Object.freeze({ASK:'지금 무엇부터 해볼까?',HINT:'한 가지만 먼저 보자.',ACKNOWLEDGE:'좋아, 이어가자.'})
  });

  function resolve({character_id,intent,scene_id,interaction_mode}={}){
    const p=registry?.get?.(character_id);
    if(!p)return Object.freeze({text:null,reason:'PERSONALITY_PROFILE_MISSING'});
    if(interaction_mode==='SILENT')return Object.freeze({text:null,reason:'SILENT_MODE'});
    if(intent==='GREET'||intent==='RECONNECT'){
      return Object.freeze({text:p.signature||null,source:'APPROVED_BOARD_SIGNATURE',profile_status:p.status});
    }
    const coreKey=CORE_SCENE[String(scene_id||'').toUpperCase()]||null;
    if(coreKey&&p.scenes?.[coreKey]){
      return Object.freeze({text:p.scenes[coreKey],source:'SOURCED_CORE6_SCENE_LINE',profile_status:p.status});
    }
    const group=styleGroup(p);
    const key=['ASK','HINT','ACKNOWLEDGE'].includes(intent)?intent:null;
    const text=key?DERIVED[group][key]:null;
    return Object.freeze({
      text,
      source:text?'DERIVED_FROM_APPROVED_PERSONALITY':null,
      style_group:group,
      reason:text?'DERIVED_SAFE_LINE':'NO_LINE_FOR_INTENT',
      profile_status:p.status
    });
  }

  return Object.freeze({VERSION,resolve,styleGroup});
});
