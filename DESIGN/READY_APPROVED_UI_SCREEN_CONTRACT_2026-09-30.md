# READY & SET — APPROVED UI SCREEN CONTRACT — 2026-09-30

Status: IMPLEMENTATION BRANCH / DESIGN GATE ACTIVE / NO DEPLOYMENT
Branch: `taky/ready-approved-ui-gate-2026-09-30`
Base main SHA: `1d672d862cc8329a5f19ca91c9ed6a338752f5ae`

## 1. SOURCE LOCK
Approved visual references are the user-approved Ready & Set mockups from 2026-09-30:
- WEEK planner screen: Base Camp desk / explorer pair / parchment weekly timetable.
- DAY planner screen: same Base Camp scene / parchment daily timetable.
- GOAL screen: same Base Camp scene / goal card layout.
- TIMER: preserve the previously approved timer UI; do not redesign.
- GOAL screen correction: replace the former “함께할 약속” function with “공유하기”.
- Character + selected expedition companion prepare at the Base Camp desk.
- No new card-dashboard style, no generic white dashboard, no emoji-led UI.

Visual implementation rule:
`APPROVED MOCKUP -> SCREEN CONTRACT -> SEPARATE ASSETS/LAYERS -> LIVE DOM/CSS -> MATCHED-VIEWPORT RENDER -> OVERLAY/REGRESSION CHECK`.
A flattened screenshot with hotspots is prohibited.

## 2. CHILD PLANNER CONTRACT
### WEEK
- Keep the approved weekly composition and visual hierarchy.
- Weekly events/todos remain live DOM.
- Existing Planner data remains authority.
- Clicking/tapping a day opens DAY without changing the visual language.

### DAY
- Keep approved daily timeline composition.
- Add one low-noise quick-add interaction without redesigning the screen.
- Input priority: walkie-talkie voice -> confirmation -> optional typing fallback.
- Typical child requests:
  - “내일 리코더 연습 20분”
  - “금요일까지 단원평가 준비 30분”
  - “오늘 책 읽기 20분”
  - “토요일 친구 생일 2시”
- Voice result is always a draft; never auto-commit without confirmation.
- Draft fields: type, title, date/deadline, optional time, estimated minutes.
- Supported child types: SCHOOL_HOMEWORK, TEST_PREP, PRACTICE, READING, MATERIAL, EVENT, PERSONAL.
- Event collision response is contextual only; do not expose a complex planning form by default.

### WALKIE-TALKIE
- Primary affordance is an actual illustrated walkie-talkie located on/near the character or Base Camp desk.
- The device is the voice-add trigger.
- Short feedback only: listening / interpreted / confirm / retry.
- Same world-language as Hide & Seek radio, different responsibility: Ready = schedule/homework input.

## 3. GOAL / SHARE / TIMER CONTRACT
Flow:
`Planner DAY -> Goal -> Share -> Start Exploration -> Approved Timer -> Result -> Carry-over`

- Goal screen composition remains the approved mockup.
- Sharing is optional and must not block Timer start.
- Start must enter the existing approved timer implementation, not a newly generated timer screen.
- Existing timestamp-based timer and pause/system-wait separation are preserved.

## 4. PARENT MANAGEMENT CONTRACT
Parent management is not a dense form-first admin screen.

Primary interaction:
- Natural-language voice request.
- Planner interprets requested changes.
- Show a short change proposal.
- Parent explicitly applies or cancels.
- Forms/selects remain as secondary correction tools only.

Examples:
- “이번 주 토요일 가족 일정 있어서 영어 숙제 금요일로 당겨줘.”
- “다음 주 수요일 과학 단원평가 준비 30분씩 이틀 넣어줘.”
- “피아노 이번 주만 목요일 말고 금요일로 옮겨줘.”
- “오늘 책 읽기 20분 추가하고 태권도 있는 날은 빼줘.”

Parent change proposals may include:
- event add
- fixed schedule add/update
- move/defer one task
- split test preparation over dates
- temporary skip
- weekend exception
- reduced duration
- carry-over resolution

No parent voice request is directly committed without a visible proposal and explicit apply action.

## 5. CURRENT IMPLEMENTATION AUDIT
Existing main already has:
- Planner WEEK/DAY structure.
- Parent role gate.
- schedule commitments.
- availability windows.
- carry-over queue and DEFERRED/PARTIAL states.
- child SpeechRecognition input.
- timestamp-based timer start flow.
- BGM assets/runtime.
- existing planner/assignment/learning integration.

Current gaps versus approved contract:
1. Current visual UI does not match the approved Base Camp mockups.
2. Child voice input is a generic microphone/text field, not the walkie-talkie interaction.
3. Child voice transcript is not parsed into structured date/deadline/duration/type draft.
4. Parent admin is form-first; natural-language voice request/proposal/apply flow is absent.
5. Event/homework collision UI does not provide the simple contextual move/defer/skip/reduce choices.
6. Goal screen is the older mission briefing layout, not the approved Goal mockup.
7. Exact approved environment/foreground/character assets are not yet bound as separated production layers.
8. No matched-viewport screenshot overlay gate exists for these three approved screens.

## 6. FUNCTIONAL OWNERSHIP
- Planner owns placement, conflict and carry-over.
- Learning Engine owns review strength / learning load guidance.
- Ready owns execution UI, voice capture, proposal confirmation, Timer and result.
- Child/parent voice input creates proposals/facts; it does not bypass Planner authority.

## 7. DESIGN GATE PASS CONDITIONS
A screen is not PASS until:
- exact source identity is recorded,
- separate production assets are bound,
- UI text/controls are live DOM,
- representative mobile viewports render without clipping,
- matched-viewport screenshots are compared with the approved mockup,
- visual mismatch is corrected,
- interaction states are tested,
- Planner/Timer regression tests remain green,
- no deployment is performed before the gate passes.
