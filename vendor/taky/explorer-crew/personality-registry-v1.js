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

  const profiles={};
  for(const [id,src] of Object.entries(board?.profiles||{})){
    const coreScenes=CORE_SCENES[id]||null;
    const status=coreScenes
      ? 'SOURCED_BOARD_PLUS_SCENE_LINES'
      : Array.isArray(src.keywords)
        ? 'SOURCED_BOARD_PROFILE'
        : 'SOURCED_BOARD_SIGNATURE_ONLY';
    profiles[id]=Object.freeze({
      character_id:id,
      display_name:src.code||src.name_ko||id,
      name_ko:src.name_ko||null,
      status,
      keywords:Array.isArray(src.keywords)?Object.freeze([...src.keywords]):null,
      signature:src.signature||null,
      description:src.description||null,
      signature_item:src.signature_item||null,
      scenes:coreScenes,
      source:src.source||null,
      legacy_board_label:src.legacy_board_label||null
    });
  }
  const frozen=Object.freeze(profiles);
  const get=id=>frozen[id]||null;
  const hasBoardProfile=id=>!!frozen[id];
  const hasSceneLines=id=>!!frozen[id]?.scenes;
  return Object.freeze({VERSION,profiles:frozen,get,hasBoardProfile,hasSceneLines});
});
