(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewPersonalitySourceBoard);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./personality-source-board-v1.js'));
  }else if(root)root.TakyExplorerCrewPersonalityRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(board){
  'use strict';
  const VERSION='EXPLORER_CREW_PERSONALITY_REGISTRY_V2';

  const CORE_SCENES=Object.freeze({
    dubi:Object.freeze({
      idea:'어? 이거 더 파보면 뭐 하나 나올 것 같은데?',
      emotion:'마음도 궁금한 게 많네. 하나만 먼저 볼까?',
      description:'잠깐, 저건 뭐지? 하나 더 자세히 보자.',
      viewpoint:'그렇게 볼 수도 있네. 다른 쪽은 어떨까?',
      final:'좋아, 마지막에 뭐 하나 놓친 건 없는지 같이 보자.'
    }),
    lori:Object.freeze({
      idea:'그 생각, 조금 더 들여다봐도 괜찮을 것 같아.',
      emotion:'그 마음이 있었구나. 이유가 하나 떠오를까?',
      description:'네가 느낀 걸 그대로 말해도 좋아.',
      viewpoint:'다른 사람 마음에서는 어떻게 보일까?',
      final:'네 느낌이 남는 쪽으로 끝내면 좋겠어.'
    }),
    ink:Object.freeze({
      idea:'여기 작은 단서 하나 보이는데. 네 생각엔 뭘 뜻할까?',
      emotion:'말보다 먼저 보이는 표정 같은 게 있을지도.',
      description:'빛, 소리, 모양 중 하나만 더 잡아보자.',
      viewpoint:'같은 장면도 위치가 바뀌면 다르게 보여.',
      final:'핵심 단서만 남기고 정리해보자.'
    }),
    nova:Object.freeze({
      idea:'좋아, 그거 한 단계만 더 가보자.',
      emotion:'그 마음을 말로 붙잡는 것도 꽤 멋진 도전이야.',
      description:'한 장면만 더 선명하게 만들어볼까?',
      viewpoint:'반대편으로 한 걸음만 옮겨보자.',
      final:'마지막 한 번. 네 방식대로 딱 끝내자.'
    }),
    take:Object.freeze({
      idea:'생각이 몇 개 있네. 먼저 하나만 잡자.',
      emotion:'마음과 이유를 따로 놓고 보면 좀 편해질 수도 있어.',
      description:'보이는 것부터 순서대로 챙겨보자.',
      viewpoint:'두 생각을 나란히 놓으면 차이가 보여.',
      final:'핵심은 남기고 순서만 한번 정리해보자.'
    }),
    zero:Object.freeze({
      idea:'생각 하나가 들어왔네. 다음 박자는 뭐지?',
      emotion:'그 마음에도 리듬이 있나 봐. 조금 더 들어볼까?',
      description:'소리나 느낌 하나 넣으면 장면이 살아날지도.',
      viewpoint:'박자를 바꾸듯 시선도 한번 바꿔볼까?',
      final:'좋아. 마지막 박자는 네가 정해.'
    })
  });

  const ACTION_BY_KEYWORD=Object.freeze({
    탐색:Object.freeze(['READ_MAP','USE_MAGNIFIER']),
    발견:Object.freeze(['USE_MAGNIFIER','READ_MAP']),
    호기심:Object.freeze(['USE_MAGNIFIER','READ_MAP']),
    관찰:Object.freeze(['USE_MAGNIFIER','WRITE_NOTE']),
    기록:Object.freeze(['WRITE_NOTE','READ_MAP']),
    연구:Object.freeze(['WRITE_NOTE','USE_MAGNIFIER']),
    분석:Object.freeze(['WRITE_NOTE','CHECK_COMPASS']),
    지도:Object.freeze(['READ_MAP','CHECK_COMPASS']),
    탐험:Object.freeze(['READ_MAP','CHECK_COMPASS']),
    리더십:Object.freeze(['READ_MAP','USE_RADIO']),
    소통:Object.freeze(['USE_RADIO','REST']),
    연결:Object.freeze(['USE_RADIO','REST']),
    공감:Object.freeze(['REST','WRITE_NOTE']),
    치유:Object.freeze(['REST','WRITE_NOTE']),
    응원:Object.freeze(['USE_RADIO','REST']),
    제작:Object.freeze(['ORGANIZE_BAG','CHECK_COMPASS']),
    문제해결:Object.freeze(['CHECK_COMPASS','ORGANIZE_BAG']),
    기계:Object.freeze(['CHECK_COMPASS','ORGANIZE_BAG']),
    도구:Object.freeze(['CHECK_COMPASS','ORGANIZE_BAG']),
    전략:Object.freeze(['READ_MAP','CHECK_COMPASS']),
    행동:Object.freeze(['ORGANIZE_BAG','USE_RADIO']),
    에너지:Object.freeze(['ORGANIZE_BAG','USE_RADIO']),
    '게임/놀이':Object.freeze(['USE_RADIO','ORGANIZE_BAG']),
    팀워크:Object.freeze(['USE_RADIO','ORGANIZE_BAG']),
    유대:Object.freeze(['USE_RADIO','REST']),
    즐거움:Object.freeze(['USE_RADIO','REST']),
    창의:Object.freeze(['WRITE_NOTE','USE_MAGNIFIER']),
    특별함:Object.freeze(['WRITE_NOTE','REST']),
    생명:Object.freeze(['USE_MAGNIFIER','REST']),
    조화:Object.freeze(['REST','WRITE_NOTE']),
    행복:Object.freeze(['REST','USE_RADIO']),
    안내:Object.freeze(['READ_MAP','USE_RADIO']),
    하늘:Object.freeze(['CHECK_COMPASS','READ_MAP']),
    성장:Object.freeze(['WRITE_NOTE','REST']),
    협력:Object.freeze(['USE_RADIO','ORGANIZE_BAG']),
    든든함:Object.freeze(['ORGANIZE_BAG','REST']),
    차분함:Object.freeze(['REST','READ_MAP']),
    배려:Object.freeze(['REST','USE_RADIO']),
    길찾기:Object.freeze(['READ_MAP','CHECK_COMPASS']),
    안정감:Object.freeze(['REST','ORGANIZE_BAG']),
    실행:Object.freeze(['ORGANIZE_BAG','USE_RADIO']),
    장난기:Object.freeze(['USE_RADIO','IDLE']),
    변화:Object.freeze(['READ_MAP','IDLE']),
    적응:Object.freeze(['READ_MAP','CHECK_COMPASS']),
    유연함:Object.freeze(['READ_MAP','IDLE']),
    긍정:Object.freeze(['REST','USE_RADIO']),
    동행:Object.freeze(['USE_RADIO','REST']),
    활기:Object.freeze(['USE_RADIO','ORGANIZE_BAG']),
    낙천:Object.freeze(['REST','USE_RADIO']),
    집중:Object.freeze(['USE_MAGNIFIER','WRITE_NOTE']),
    끈기:Object.freeze(['USE_MAGNIFIER','READ_MAP']),
    기억:Object.freeze(['WRITE_NOTE','REST']),
    여유:Object.freeze(['REST','WRITE_NOTE']),
    다정함:Object.freeze(['REST','USE_RADIO']),
    기획:Object.freeze(['READ_MAP','WRITE_NOTE'])
  });

  function deriveBehaviorBias(src){
    const out=[];
    for(const keyword of src?.keywords||[]){
      for(const action of ACTION_BY_KEYWORD[keyword]||[]){
        if(!out.includes(action))out.push(action);
      }
    }
    return Object.freeze({
      provenance:src?.keywords_provenance==='DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED'?'DERIVED_FROM_USER_AUTHORIZED_PERSONALITY':'DERIVED_FROM_EXPLICIT_APPROVED_KEYWORDS',
      preferred_ambient_actions:Object.freeze(out.slice(0,4))
    });
  }

  const profiles={};
  for(const [id,src] of Object.entries(board?.profiles||{})){
    const scenes=CORE_SCENES[id]||null;
    profiles[id]=Object.freeze({
      character_id:id,
      name_ko:src.name_ko||null,
      display_name:src.code||src.name_ko||id,
      code:src.code||null,
      status:scenes?'SOURCED_BOARD_PLUS_SCENE_LINES':src.keywords_provenance==='DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED'?'DERIVED_PROFILE_FROM_APPROVED_BOARD_AND_SPECIES':Array.isArray(src.keywords)?'SOURCED_BOARD_PROFILE':'SOURCED_BOARD_SIGNATURE_ONLY',
      species:src.species||null,
      keywords:Array.isArray(src.keywords)?Object.freeze([...src.keywords]):null,
      keywords_provenance:Array.isArray(src.keywords)?(src.keywords_provenance||'APPROVED_BOARD'):null,
      signature:src.signature||null,
      description:src.description||null,
      signature_item:src.signature_item||null,
      legacy_board_label:src.legacy_board_label||null,
      scenes,
      source:src.source||null,
      behavior_bias:deriveBehaviorBias(src)
    });
  }

  const frozen=Object.freeze(profiles);
  function get(id){return frozen[id]||null}
  function all(){return frozen}
  return Object.freeze({VERSION,profiles:frozen,get,all,deriveBehaviorBias});
});
