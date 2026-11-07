/* Ready & Set — explorer crew projection (read-only consumer of TAKY shared crew board).
   Names/keywords/signature lines copied from explorer-crew-voice/personality-source-board-v1.js.
   Images: rs/crew/NN.webp (figure) / NN-face.webp — display-only resizes of characters/ui_cutouts.
   Voice: rs/voice/NN.mp3 — SIGNATURE clip (ElevenLabs, best of 3–12 takes, ASR-checked). Scene/recording lines: rs/voice/<id>/<key>.mp3 (script.json). */
(function () {
  const C = [
    ['dubi', '두비', ['호기심', '활력', '막내'], '와! 해보자!'],
    ['lori', '로리', ['다정함', '공감', '따뜻함'], '괜찮아, 천천히 해도 돼!'],
    ['ink', '잉크', ['관찰', '아이디어', '신중함'], '음... 다른 방법도 있지.'],
    ['nova', '노바', ['에너지', '도전', '활동적'], '가보자! 하면 되지!'],
    ['take', '테이크', ['든든함', '정리', '차분함'], '차근차근 같이 해보자.'],
    ['zero', '제로', ['음악', '여유', '챙김'], '언제나, 네 이야기를 응원해!'],
    ['guide-07', '솔라', ['탐색', '발견', '생명', '공감'], '작은 빛도 길이 될 수 있어.'],
    ['guide-08', '벨로', ['도전', '호기심', '지도', '탐험'], '궁금한 건 직접 가보는 거야!'],
    ['guide-09', '모카', ['관찰', '기록', '연구', '성장'], '자세히 보면 더 멋진 세상이 있어.'],
    ['guide-10', '니아', ['소통', '연결', '안내', '하늘'], '함께라면 더 멀리 날 수 있어!'],
    ['guide-11', '키로', ['제작', '협력', '문제해결', '든든함'], '천천히, 그리고 더 단단하게.'],
    ['guide-12', '피치', ['치유', '조화', '행복', '응원'], '마음이 모이면 더 큰 힘이 되니까!'],
    ['guide-13', '민트', ['차분함', '배려', '길찾기', '안정감'], '천천히 가도 괜찮아, 좋은 길을 함께 찾으면 되니까!'],
    ['guide-14', '토토', ['실행', '호기심', '도전', '장난기'], '궁금한 게 있으면? 일단 해보자!'],
    ['guide-15', '루네', ['변화', '적응', '유연함', '긍정'], '변화는 또 다른 기회야! 어디든 맞춰갈 수 있어.'],
    ['guide-16', '포포', ['협력', '동행', '활기', '낙천'], '함께라면, 더 멀리 갈 수 있어!'],
    ['guide-17', '마루', ['탐색', '집중', '끈기', '발견'], '보이지 않는 것도, 찾아낼 수 있어!'],
    ['guide-18', '보리', ['기억', '기록', '여유', '다정함'], '오늘도 좋은 기억을 하나 더 담아보자!'],
    ['guide-19', '린', ['탐험', '리더십', '지도', '도전'], '먼저 가볼게, 길을 찾아보자!'],
    ['guide-20', '루아', ['관찰', '기록', '분석', '감성'], '조금 더 보면, 또 다른 게 보여.'],
    ['guide-21', '테스', ['행동', '에너지', '놀이', '팀워크'], '해보자! 뭐든 할 수 있어!'],
    ['guide-22', '셀', ['치유', '공감', '소통', '생명'], '함께 있으면, 더 멀리 갈 수 있어.'],
    ['guide-23', '제이크', ['문제해결', '기획', '도구', '전략'], '방법은 항상 있어. 찾아보면 돼.'],
    ['guide-24', '비비', ['유대', '즐거움', '창의', '특별함'], '함께라면 더 재미있어!']
  ].map(([id, name, keywords, signature], i) => {
    const n = String(i + 1).padStart(2, '0');
    return { id, n, name, keywords, signature, core: i < 6, img: `rs/crew/${n}.webp`, face: `rs/crew/${n}-face.webp`, voice: `rs/voice/${n}.mp3?v=20261107g` };
  });
  const byId = Object.fromEntries(C.map(c => [c.id, c]));
  window.RSCrew = { all: C, core: C.slice(0, 6), get: id => byId[id] || C[0] };
})();
