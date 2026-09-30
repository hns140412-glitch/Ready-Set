'use strict';
module.exports=Object.freeze({
  version:'2026-09-30.1',
  contract:'TAKY_APPROVED_BADGE_GATE_CATALOG_V1',
  source:{
    repo:'hns140412-glitch/TAKY',
    path:'BADGE/badge-60-story-20-history-working.json',
    source_blob_sha:'cc26fd99e1c24b35649c95190dd4ffbbe12fd5ab'
  },
  // Current 60-badge source is WORKING_DRAFT_NOT_ACTIVE. These entries are
  // semantic gate candidates only; none is approved/runtime-active yet.
  entries:Object.freeze([
    Object.freeze({badge_id:'BDG-DRAFT-047',stable_name:'밀린짐 정리',
      source_meaning:'밀린 짐에도 작은 칸부터 자리가 생겼다.',
      motif:'정돈된 배낭 속 체크리스트',
      approved:false,runtime_active:false}),
    Object.freeze({badge_id:'BDG-DRAFT-009',stable_name:'몰래 시작',
      source_meaning:'누가 시키기도 전에 슬쩍 출발했다.',
      motif:'발자국 뒤에 숨은 작은 깃발',
      approved:false,runtime_active:false}),
    Object.freeze({badge_id:'BDG-DRAFT-010',stable_name:'말하기 전에 GO',
      source_meaning:'말하기 전에 손이 먼저 움직인 날.',
      motif:'출발선 위의 가벼운 운동화',
      approved:false,runtime_active:false}),
    Object.freeze({badge_id:'BDG-DRAFT-005',stable_name:'출발 준비 끝',
      source_meaning:'신발끈부터 마음까지 출발 준비 완료.',
      motif:'묶인 신발끈과 작은 나침반',
      approved:false,runtime_active:false})
  ])
});