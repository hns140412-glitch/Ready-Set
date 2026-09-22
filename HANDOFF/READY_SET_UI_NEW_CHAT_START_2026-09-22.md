최신 TAKY 기준으로 Ready & Set Base Camp UI 작업을 새 대화에서 재개해.

먼저 GitHub `hns140412-glitch/Ready-Set`의 `taky/ready-rebuild-v01-2026-09-21` 브랜치를 live refresh하고 아래 문서를 순서대로 읽어 현재 상태를 복원해.

1. `HANDOFF/TAKY_UI_DECISION_REGISTRY_POINTER_2026-09-22.md`
2. `C2S/READY_SET_BASE_CAMP_UI_C2S_CLOSURE_2026-09-22.md`
3. `C2S/READY_SET_3_SCREEN_UI_DESIGN_STANDARD_2026-09-22_REV1.md`
4. `C2S/READY_SET_UI_MOCKUP_REVIEW_REJECT_01_2026-09-22.md`
5. `HANDOFF/READY_SET_BASE_CAMP_UI_HANDOFF_2026-09-22_LATEST.md`

TAKY 중앙 Registry가 접근 가능하면 반드시 같이 확인해.
- `C2S/LEARNING_APP_FAMILY_UI_DECISION_REGISTRY_2026-09-22.md`
- `C2S/LEARNING_APP_FAMILY_SHARED_ISLAND_WORLD_TOPOLOGY_2026-09-22.md`

이번 작업 범위는 Ready & Set의 Base Camp UI다.

핵심 화면은 정확히 3개:
- 이번 주 여정
- 오늘의 탐험길
- 타이머 “그냥! 지금 하면 돼!”

타이머는 이미 시안 확정 + 에셋 작성 완료 상태이므로 절대 재디자인하지 말고 연결성/회귀만 검토해.

신규 시안 작업 대상은 “이번 주 여정”과 “오늘의 탐험길” 두 화면뿐이다.

캐릭터/탐험대 구축은 다른 대화창에서 별도로 진행 중이므로 Ready에서 새 캐릭터나 탐험대 시스템을 만들지 말고, character_id / Explorer_ID / current crew state를 받아 표시하는 슬롯만 고려해.

시각 방향:
- PLANNER FIRST → BASE CAMP SECOND → CHARACTER OPTIONAL
- 고정된 섬/Base Camp 풍경은 충분히 살아 있어야 함
- SOULS 메인화면처럼 세계가 먼저 느껴지는 구도는 참고하되 미술풍 복제 금지
- Planner는 세계 위에 떠 있는 반투명/frosted/glass 정보 레이어
- 불투명 파스텔 타일이 화면을 가득 덮는 구조 금지
- 시간표 가독성 최우선
- 주간은 간결, 일간은 세로형
- 등교 전 할 일도 Planner demo/runtime 데이터에 있으면 반드시 표현
- 고정 일정 / 오늘 할 일 / 자유 시간은 의미가 다르게 보여야 함

효과/모션은 GitHub / 공개 Netlify 배포 / 상용 앱 사례를 먼저 조사해서 원리를 추출해.
- View Transition 계열
- Framer Motion 계열
- glass/frosted mobile UI
- commercial Planner/Calendar
- travel itinerary timeline
- child-friendly schedule
- world-first exploration UI

그냥 예쁜 이미지를 모으지 말고 각 사례마다:
왜 좋은가 / 왜 나쁜가 / Ready에 가져올 것 / 가져오면 안 될 것
을 정리해.

Planner는 시안 검토를 위해 synthetic demo data를 임의 생성해도 된다.
단, 반드시 MOCKUP_ONLY / SYNTHETIC으로 취급하고 실제 사용자 일정 사실처럼 다루지 마.

작업 순서는 반드시:
live refresh → 문서 복원 → 사례 조사 → PRESERVE/ADJUST/REJECT → 주간 low-fi → 검토 → 일간 low-fi → 검토 → Base Camp + translucent planner composition 통합 → Timer 연결성 검토 → 390×844 시인성/모션/접근성 검토 → 그 다음 high-fi 시안.

시안부터 바로 만들지 마.
