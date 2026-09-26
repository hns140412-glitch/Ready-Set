최신 TAKY 기준으로 Ready & Set의 최종 시안/UI productization 작업을 시작해.

## 0. 작업 목적

이번 작업은 단순한 비주얼 리디자인이나 CSS 스킨 작업이 아니다.

목표는 현재 구현되어 있는 Ready & Set의 기능/도메인/런타임을 보존하면서,
최종 사용자 경험을 기준으로 화면 구조를 다시 설계하고,
모든 주요 기능을 실제 UI에 연결할 수 있는 product UI architecture를 만드는 것이다.

시안이 예쁘게 보이는 것보다 아래가 우선이다.

- 핵심 사용자 흐름이 명확할 것
- 기존 구현 기능이 UI에서 고아가 되지 않을 것
- UI가 기존 도메인 로직을 임의로 재창조하지 않을 것
- 각 화면/컨트롤의 owner/state/event/source-of-truth가 명확할 것
- 모바일 390×844에서 실제로 사용할 수 있을 것
- 향후 코드 적용과 E2E 검증이 가능한 구조일 것

## 1. 먼저 현재 상태 복원

Repository:
- `hns140412-glitch/Ready-Set`

Branch:
- `taky/ready-rebuild-v01-2026-09-21`

반드시 live refresh부터 하고 HEAD 이동 여부를 확인해.

그 다음 아래 문서를 우선 읽어.

1. `C2S/READY_SET_UI_PRODUCTIZATION_C2S_CLOSURE_2026-09-22.md`
2. `C2S/READY_SET_UI_PRODUCTIZATION_ATOMS_2026-09-22.json`
3. `HANDOFF/READY_SET_REBUILD_HANDOFF_2026-09-22_LATEST.md`
4. `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV5.md`
5. `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV4.md`
6. `Ready_Set_Ui_Master_Logic_REV_07.md`
7. 현재 실제 런타임의 `index.html`, `styles.css`, `app.js`, Planner/Learning/Capture 관련 모듈

기존 문서만 믿지 말고 현재 코드와 대조해.
문서와 코드가 다르면 현재 코드/최신 correction을 우선하되 차이를 기록해.

## 2. 구현율 판단 기준 수정

기존 ~74–76%를 전체 제품 완성도로 사용하지 마.

앞으로 반드시 아래 네 축을 분리해.

1. FUNCTION_IMPLEMENTATION
2. UI_STRUCTURE_DEFINITION
3. UI_FUNCTION_INTEGRATION
4. USER_FACING_PRODUCT_MATURITY

최종 UI 구조가 아직 확정되지 않은 현재 시점의 USER_FACING_PRODUCT_MATURITY는
임시로 약 45–55% 수준에서 시작해서 다시 감사해.

기능이 이미 코딩되어 있다는 이유만으로 UI 완성도를 높게 평가하지 마.

## 3. UI 작업 순서

아래 순서를 지켜.

PRODUCT PURPOSE / USER JOB
→ INFORMATION ARCHITECTURE
→ SCREEN CONTRACT
→ COMPONENT CONTRACT
→ FEATURE OWNER MAPPING
→ STATE / EVENT MAPPING
→ NAVIGATION / TRANSITION CONTRACT
→ RESPONSIVE / ACCESSIBILITY CONTRACT
→ VISUAL SYSTEM
→ HIGH-FIDELITY MOCKUP
→ IMPLEMENTATION MAPPING
→ UI-FUNCTION INTEGRATION
→ E2E / REGRESSION
→ USER-FACING MATURITY RE-AUDIT

시안부터 그리고 나중에 기능을 끼워 맞추는 방식 금지.
시안을 CSS로 바로 덮는 방식 금지.

## 4. 핵심 제품 흐름

Ready & Set의 핵심 사용자 흐름은 최소한 아래가 끊김 없이 보여야 한다.

TODAY
→ Mission
→ Focus
→ Wrap-up
→ Result
→ carry-over / replan

Planner:
- Week
- Day
- fixed schedule
- availability / free window
- dated todo
- reflow proposal
- Parent approval

Learning:
- Assignment/Task intake
- Child proposal
- Parent confirmation
- Learning Master interpretation
- planner allocation
- result evidence feedback

Capture:
- camera/gallery
- multiple capture
- temporary save
- 저장하고 분석
- OCR/Vision draft
- Parent review
- confirmed FACT
- planner/learning route

그리고 아래 영역도 UI 목적지가 있어야 한다.

- History / progress
- Profile
- Settings
- Offline / sync state
- Conflict state
- loading / empty / error / permission denied
- Parent/Admin controls

## 5. 화면 설계 규칙

각 화면마다 아래를 정의해.

- screen_id
- 목적
- primary user
- entry condition
- primary action
- secondary action
- source of truth
- owner module
- required state
- events emitted
- transition target
- error/empty/loading states
- data visibility
- parent/child permission
- responsive notes
- accessibility notes

각 버튼/컨트롤도 아래가 없는 상태로 만들지 마.

- owner
- state
- event
- transition
- validation
- failure state

## 6. 반드시 먼저 만들어야 하는 산출물

시안 제작 전에 먼저 아래 5개를 만들어.

### A. Screen Inventory
현재 필요한 전체 화면/상태 목록.

### B. Feature → Screen Matrix
현재 구현된 주요 기능이 어느 화면에 나타나는지 매핑.
기능이 화면 목적지를 갖지 못하면 ORPHANED_FUNCTION으로 표시.

### C. Screen → Runtime Contract
각 화면의 owner/state/event/source-of-truth 계약.

### D. Navigation Map
사용자가 화면 사이를 어떻게 이동하는지.
back/close/cancel/retry/offline recovery도 포함.

### E. UI Risk Register
시안 적용으로 기존 기능/테스트가 깨질 가능성:
- HIGH
- MEDIUM
- LOW
로 구분하고 근거 제시.

이 5개가 나온 다음에만 high-fidelity 시안을 시작해.

## 7. 디자인 방향

Ready & Set은 학습 앱이지만 “관리 도구처럼 딱딱한 화면”으로 만들지 마.

핵심 톤:
- 준비하고
- 출발하고
- 오늘의 임무를 수행하고
- 마무리하고
- 다음 경로를 정하는
가벼운 탐험 구조

다만 탐험 컨셉이 기능을 가리면 안 된다.

게임처럼 보이기 위한 장식보다
사용자가 지금 무엇을 해야 하는지 바로 알 수 있어야 한다.

### 시각 우선순위
1. 지금 해야 할 일
2. 왜 이 일을 하는지
3. 얼마나 걸리는지
4. 지금 시작 가능한지
5. 다음 단계
6. 진행/성취감

## 8. 캐릭터 / 탐험대 처리

캐릭터를 화면에 고정 삽입하지 마.

UI에는:
- character slot
- exploration crew slot
- guide response slot
- contextual illustration slot

정도만 설계해.

실제 캐릭터는 character ID / runtime state에 따라 런타임에서 결정되도록 한다.

캐릭터가 없어도 UI가 정상 작동해야 한다.

## 9. Snap & Pop / Hide & Seek 경계

Ready & Set은:
- planning
- scheduling
- mission execution
- parent confirmation
- result
을 소유한다.

Snap & Pop / Hide & Seek는 연결 가능한 기능으로 표현할 수 있지만,
해당 앱의 도메인 로직을 Ready 안에서 다시 구현하지 마.

연결 위치만 정의해.

예:
- Mission 시작 전 추천 활동
- 학습 중 보조 활동
- Result 이후 보강 활동
- Planner에서 specialist activity로 연결

## 10. 모바일 기준

Primary viewport:
- 390 × 844

반드시 검토:
- thumb reach
- touch target
- keyboard overlap
- safe area
- scroll depth
- sticky/fixed collision
- bottom navigation interference
- text expansion
- long task titles
- empty/error states
- offline state
- permission denied
- modal stacking

## 11. 현재 구현 보호

현재 branch에는 병행 캐릭터 작업이 있을 수 있다.

반드시:
- live refresh
- HEAD 이동 시 diff 확인
- unrelated 변경 보존
- fresh file SHA 기반 순차 업데이트
- force push 금지

시안 단계에서는 기존 런타임 코드를 불필요하게 수정하지 마.

먼저 구조계약과 시안을 닫고,
실제 구현 단계가 되면 screen/component contract 기준으로 변경해.

## 12. 검증 규칙

스크린샷이 예쁘다고 PASS 처리하지 마.

각 시안에 대해 검증해.

- 제품 목적과 맞는가
- 기능 누락이 없는가
- 기능이 고아가 되지 않는가
- 버튼이 실제 event/state에 연결 가능한가
- Parent/Child 권한이 충돌하지 않는가
- Planner authority를 침범하지 않는가
- Learning Master가 날짜를 직접 결정하지 않는가
- 데이터 없는 부분을 추정하지 않는가
- 모바일에서 실제 조작 가능한가
- 기존 E2E를 어떻게 바꿔야 하는가

## 13. 첫 번째 결과물

바로 예쁜 화면 한 장만 던지지 마.

첫 응답에서는 아래 순서로 보여줘.

1. 현재 제품 구조 복원 요약
2. Screen Inventory
3. Feature → Screen Matrix
4. 주요 ORPHANED / CONFLICT / MISSING UI
5. Navigation Map
6. UI Risk Register
7. 최종 시안을 만들기 위한 Design System Skeleton
8. 그 다음 첫 번째 핵심 화면군 시안

첫 번째 시안군은 우선:
- TODAY/Home
- Mission
- Focus
- Result
- Planner Week
- Planner Day

을 하나의 연결된 제품 흐름으로 설계해.

각 화면을 독립적인 예쁜 카드처럼 만들지 말고,
같은 앱에서 자연스럽게 전환되는 하나의 시스템으로 보여줘.

## 14. 보고 형식

항상 마지막에 아래를 보고해.

- FUNCTION_IMPLEMENTATION %
- UI_STRUCTURE_DEFINITION %
- UI_FUNCTION_INTEGRATION %
- USER_FACING_PRODUCT_MATURITY %

그리고:
- CODED
- CI_VERIFIED
- RUNTIME_VERIFIED
- DEVICE_VERIFIED

를 분리해.

UI 작업 때문에 기존 기능 구현율이 떨어지는 것처럼 표현하지 말고,
기존 기능율과 새로 드러난 UI/통합 denominator를 분리해서 설명해.

## 15. 외부 실행 제한

현재 단계에서는:
- Netlify 호출 금지
- Production 배포 금지
- main merge 금지
- 사용자를 테스터/디버거로 사용 금지

시안과 UI 구조가 충분히 검토되고,
UI-function integration이 닫힌 뒤
TAKY external-resource gate를 통과했을 때만 배포 단계로 넘어간다.

핵심:
**Ready & Set의 UI는 기존 기능 위에 덧씌우는 껍데기가 아니라, 기능과 상태를 사용자 경험으로 조직하는 제품 아키텍처다.**
