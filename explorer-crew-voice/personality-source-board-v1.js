(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewPersonalitySourceBoard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_PERSONALITY_SOURCE_BOARD_V1';
  const profiles=Object.freeze({
    dubi:Object.freeze({name_ko:'두비',keywords:Object.freeze(['호기심','활력','막내']),signature:'와! 해보자!',source:'APPROVED_CORE6_BOARD'}),
    lori:Object.freeze({name_ko:'로리',keywords:Object.freeze(['다정함','공감','따뜻함']),signature:'괜찮아, 천천히 해도 돼!',source:'APPROVED_CORE6_BOARD'}),
    ink:Object.freeze({name_ko:'잉크',keywords:Object.freeze(['관찰','아이디어','신중함']),signature:'음... 다른 방법도 있지.',source:'APPROVED_CORE6_BOARD'}),
    nova:Object.freeze({name_ko:'노바',keywords:Object.freeze(['에너지','도전','활동적']),signature:'가보자! 하면 되지!',source:'APPROVED_CORE6_BOARD'}),
    take:Object.freeze({name_ko:'테이크',keywords:Object.freeze(['든든함','정리','차분함']),signature:'차근차근 같이 해보자.',source:'APPROVED_CORE6_BOARD'}),
    zero:Object.freeze({name_ko:'제로',keywords:Object.freeze(['음악','여유','챙김']),signature:'언제나, 네 이야기를 응원해!',source:'APPROVED_CORE6_BOARD'}),

    'guide-07':Object.freeze({name_ko:'솔라',code:'SOLA',keywords:Object.freeze(['탐색','발견','생명','공감']),signature:'작은 빛도 길이 될 수 있어.',description:'자연의 작은 신호도 놓치지 않는 따뜻한 관찰가. 숲과 바람의 이야기를 가장 먼저 찾아내는 친구.',signature_item:'빛의 랜턴',source:'APPROVED_07_12_BOARD'}),
    'guide-08':Object.freeze({name_ko:'벨로',code:'BELO',keywords:Object.freeze(['도전','호기심','지도','탐험']),signature:'궁금한 건 직접 가보는 거야!',description:'궁금한 것을 보면 참지 못하는 행동파 탐험가. 새로운 장소와 이야기를 찾아 가장 먼저 나서는 친구.',signature_item:'탐험 망원경',source:'APPROVED_07_12_BOARD'}),
    'guide-09':Object.freeze({name_ko:'모카',code:'MOCA',keywords:Object.freeze(['관찰','기록','연구','성장']),signature:'자세히 보면 더 멋진 세상이 있어.',description:'작은 것도 자세히 관찰하고 기록하는 탐험대의 연구가. 자연과 생물의 이야기를 수집한다.',signature_item:'관찰 노트',source:'APPROVED_07_12_BOARD'}),
    'guide-10':Object.freeze({name_ko:'니아',code:'NIA',keywords:Object.freeze(['소통','연결','안내','하늘']),signature:'함께라면 더 멀리 날 수 있어!',description:'넓은 시야로 모두를 이어주는 탐험대의 소통 담당. 새로운 친구들과 더 큰 세상을 바라보게 해주는 친구.',signature_item:'바람 깃털',source:'APPROVED_07_12_BOARD'}),
    'guide-11':Object.freeze({name_ko:'키로',code:'KIRO',keywords:Object.freeze(['제작','협력','문제해결','든든함']),signature:'천천히, 그리고 더 단단하게.',description:'탐험대의 든든한 엔지니어. 어려운 상황도 차분하게 해결하고 친구들을 지켜주는 믿음직한 친구.',signature_item:'다기능 도구함',source:'APPROVED_07_12_BOARD'}),
    'guide-12':Object.freeze({name_ko:'피치',code:'PEACH',keywords:Object.freeze(['치유','조화','행복','응원']),signature:'마음이 모이면 더 큰 힘이 되니까!',description:'친구들의 지친 마음을 살피고 따뜻하게 달래주는 탐험대의 힐러. 언제나 웃음과 긍정의 에너지를 전한다.',signature_item:'마음의 꽃병',source:'APPROVED_07_12_BOARD'}),

    'guide-13':Object.freeze({name_ko:'민트',code:'MINT',species:'카피바라',keywords:Object.freeze(['차분함','배려','길찾기','안정감']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'천천히 가도 괜찮아, 좋은 길을 함께 찾으면 되니까!',description:'서두르지 않고 주변을 살피며 좋은 길을 찾는 차분한 동행자. 친구가 조급해질 때 속도를 맞춰 주는 안정적인 성격.',source:'APPROVED_13_18_BOARD'}),
    'guide-14':Object.freeze({name_ko:'토토',code:'TOTO',species:'원숭이',keywords:Object.freeze(['실행','호기심','도전','장난기']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'궁금한 게 있으면? 일단 해보자!',description:'궁금한 것은 직접 해보며 답을 찾는 행동형 탐험가. 빠르게 시도하고 실패도 놀이처럼 받아들이는 활기찬 친구.',source:'APPROVED_13_18_BOARD'}),
    'guide-15':Object.freeze({name_ko:'루네',code:'RUNE',species:'카멜레온',keywords:Object.freeze(['변화','적응','유연함','긍정']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'변화는 또 다른 기회야! 어디든 맞춰갈 수 있어.',description:'상황이 바뀌어도 금세 적응하고 다른 방법을 찾는 유연한 탐험가. 변화 자체를 새로운 기회로 받아들이는 친구.',source:'APPROVED_13_18_BOARD'}),
    'guide-16':Object.freeze({name_ko:'포포',code:'POPO',species:'오리',keywords:Object.freeze(['협력','동행','활기','낙천']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'함께라면, 더 멀리 갈 수 있어!',description:'혼자보다 함께 움직이는 것을 좋아하는 밝은 협력형 탐험가. 친구들을 자연스럽게 모아 같이 앞으로 나아가게 한다.',source:'APPROVED_13_18_BOARD'}),
    'guide-17':Object.freeze({name_ko:'마루',code:'MARU',species:'두더지',keywords:Object.freeze(['탐색','집중','끈기','발견']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'보이지 않는 것도, 찾아낼 수 있어!',description:'겉으로 바로 보이지 않는 단서를 끝까지 찾아내는 집중형 탐험가. 조용하지만 쉽게 포기하지 않고 숨은 길을 발견한다.',source:'APPROVED_13_18_BOARD'}),
    'guide-18':Object.freeze({name_ko:'보리',code:'BORI',species:'코알라',keywords:Object.freeze(['기억','기록','여유','다정함']),keywords_provenance:'DERIVED_FROM_APPROVED_TAGLINE_AND_SPECIES_USER_AUTHORIZED',signature:'오늘도 좋은 기억을 하나 더 담아보자!',description:'서두르지 않고 좋은 순간을 차분히 기억하고 남기는 기록형 친구. 함께한 경험을 따뜻한 추억으로 이어주는 성격.',source:'APPROVED_13_18_BOARD'}),

    'guide-19':Object.freeze({name_ko:'린',code:'RIN',keywords:Object.freeze(['탐험','리더십','지도','도전']),signature:'먼저 가볼게, 길을 찾아보자!',description:'새로운 길을 먼저 찾는 탐험대의 길잡이. 모험을 계획하고 친구들을 이끄는 든든한 친구.',signature_item:'탐험 나침반',source:'APPROVED_19_24_BOARD'}),
    'guide-20':Object.freeze({name_ko:'루미',code:'LUMI',keywords:Object.freeze(['관찰','기록','분석','감성']),signature:'조금 더 보면, 또 다른 게 보여.',description:'조용히 관찰하고 기록하는 탐험대의 기록가. 작은 것도 놓치지 않는 섬세한 눈을 가진 친구.',signature_item:'별빛 노트',source:'APPROVED_19_24_BOARD'}),
    'guide-21':Object.freeze({name_ko:'테스',code:'TESS',keywords:Object.freeze(['행동','에너지','게임/놀이','팀워크']),signature:'해보자! 뭐든 할 수 있어!',signature_item:'탐험 고글',source:'APPROVED_19_24_BOARD'}),
    'guide-22':Object.freeze({name_ko:'셀',code:'SEL',keywords:Object.freeze(['치유','공감','소통','생명']),signature:'함께 있으면, 더 멀리 갈 수 있어.',description:'친구들의 마음을 살피고 지친 마음을 다독이는 탐험대의 힐러. 언제나 따뜻한 미소로 함께하는 친구.',signature_item:'초록 랜턴',source:'APPROVED_19_24_BOARD'}),
    'guide-23':Object.freeze({name_ko:'제이크',code:'ZEKE',keywords:Object.freeze(['문제해결','기획','도구','전략']),signature:'방법은 항상 있어. 찾아보면 돼.',description:'어려운 상황도 차분하게 해결하는 탐험대의 브레인. 새로운 도구와 방법을 찾아내는 똑똑한 친구.',signature_item:'다기능 탐험 기기',source:'APPROVED_19_24_BOARD'}),
    'guide-24':Object.freeze({name_ko:'비비',code:'VIVI',legacy_board_label:'NOVA',keywords:Object.freeze(['유대','즐거움','창의','특별함']),signature:'함께라면 더 재미있어!',description:'언제나 새로운 아이디어와 재미난 놀이를 제안하는 탐험대의 크리에이터. 친구들과 특별한 추억을 만드는 친구.',signature_item:'추억 카메라',source:'APPROVED_19_24_BOARD'})
  });
  return Object.freeze({VERSION,profiles,get:id=>profiles[id]||null});
});
