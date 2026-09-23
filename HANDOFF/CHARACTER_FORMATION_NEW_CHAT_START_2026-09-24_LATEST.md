최신 TAKY 기준으로 Learning App Family UI/Visual — Character Formation 작업을 재개해.

가장 먼저 아래 CURRENT를 읽어.

1. `C2S/CHARACTER_FORMATION_RUNTIME_INTEGRATION_C2S_CLOSURE_2026-09-24.md`
2. `HANDOFF/CHARACTER_FORMATION_RUNTIME_INTEGRATION_HANDOFF_2026-09-24_LATEST.md`
3. `HANDOFF/TAKY_UI_DECISION_REGISTRY_POINTER_2026-09-23.md`
4. `C2S/CHARACTER_FORMATION_VISUAL_TO_RUNTIME_BINDING_2026-09-23.md`
5. `assets/character-formation/asset-manifest.json`
6. `src/identity/character-formation-journey-runtime.js`

Repo:
`hns140412-glitch/Ready-Set`

Branch:
`taky/character-visual-id-core-2026-09-22`

재개 직후 CURRENT branch exact HEAD와 CI를 live refresh해.
마지막 검증 HEAD는:
`47b6592f617cf6363edc069006a95a2e6d095cd7`

그 HEAD에서:
- Character Formation UI Binding = SUCCESS / run 35871585432
- TAKY Codex Worker Self-Test = SUCCESS / run 35871585939

중요 정정:
이전 대화 중간에 “Core 6 만나기/동행선택/이름과 Voyage/섬/Base Camp가 아직 runtime OPEN”이라고 했던 상태는 이미 지났다.
현재는 `src/identity/character-formation-journey-runtime.js`에 전체 journey가 CODED되어 있다.

현재 full flow:
Core 6 만나기
→ 동행 탐험대원 선택
→ 동행 탐험대원 이름/호칭
→ 사용자 사진
→ Signature Item
→ 탐험 방향 1
→ 탐험 방향 2
→ 시스템 자동 대비 방향
→ A/B/C 동일 아이 후보
→ 선택
→ 닮기 보정
→ Visual ID 확정
→ Shared Expedition Accent
→ Voyage / Drop
→ 섬 발견
→ 섬 이름
→ Base Camp 이동
→ Base Camp 이름
→ Ready

최상위 슬로건은 자의적으로 해석하지 마.

Think Again, Keep Your Key.
= 핵심을 놓치지 말고 다시 생각하라.
= 답을 풀 열쇠는 이미 가지고 있다.

Think Again, You’re The Key.
= 방법을 찾고 해결하라.
= 결국 답을 만들어내는 핵심 주체는 인간이다.

공격적 검증/방어적 대응/rollback/validation은 슬로건 뜻이 아니라 하위 방법이다.

현재 OPEN만 처리해.

OPEN-01
Core 6 canonical derivative binary 6개를 실제 repo에 연결.
정본:
`가이드☆ 여섯 친구의 찬란한 여정.png`
file_id:
`file_0000000022f0823090aec9a5d4c42aa3`

Core 6를 새 프롬프트로 다시 그리지 마.
정본에서 직접 파생해.

OPEN-02
현재 interim SVG scene/item/tool assets 중 승인 Anchor 수준의 고밀도 visual parity가 부족한 부분만 개선.
기능계약/flow는 바꾸지 마.

OPEN-03
390×844 runtime capture
→ CF-A01/A02/A03/A05 anchor regression
→ 불일치만 수정.

OPEN-04
가족 공통 확정사항 상속 회귀검증.
local runtime projection이
섬 연속성 / 탐험대 / badge / gem / wish / blessing / Explorer_ID / Snap & Pop tool rule 등을 재정의하지 않았는지만 확인.

CLOSED를 다시 열지 마.
새 Registry 만들지 마.
Netlify 호출하지 마.
사용자를 디버거로 만들지 마.

검토만 반복하지 말고 실제 구현해.
