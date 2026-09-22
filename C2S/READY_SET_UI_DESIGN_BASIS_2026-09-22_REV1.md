# READY & SET UI DESIGN BASIS — 2026-09-22 REV1

Status: LOGIC_REVIEWED / DESIGN_CRITERIA_LOCKED / VISUAL_MOCKUP_READY
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Reviewed HEAD: `fd7f4de26693ddde0178ffdf82bae359866aa8bc`

## 1. Logic review — design-impact corrections

### 1.1 Product identity
Ready & Set is the child's learning execution BASE CAMP and session orchestrator.
Time Attack / Focus Mode are execution mechanics, not the product identity.

Design consequence:
- Home hero must be TODAY/Base Camp first.
- Timer may be prominent only inside active execution.
- Exploration tone must support orientation, not decorate over core actions.

### 1.2 Authority preservation
- Parent = capture/input/confirm/support.
- Learning Master = interpret/decompose/load metadata.
- Planner = sole dated allocation authority.
- Child = view/allowed fact input/TODAY selection/execution/outcome report.

Design consequence:
- Parent UI cannot directly allocate required study dates/times.
- Learning Master evidence never edits Planner dates directly.
- Mission does not create DATED TODO.
- Reflow is a proposal path, not a silent mutation.

### 1.3 Session state preservation
Canonical:
TODAY → Mission → Focus → Wrap → Result → carry/replan.

Session invariants:
- ONE SESSION / MULTIPLE TASKS / ONE ACTIVE TASK / AT MOST ONE ACTIVE LAP.
- SESSION_END != TASK_COMPLETE.
- APP_SWITCH != PAUSE.
- Result is transient for the just-ended session.

Design consequence:
- Focus must show active task and session context separately.
- Wrap must resolve unresolved task states before finalize.
- Result must be per-task truthful.
- Back/navigation cannot imply session cancellation.

### 1.4 Planner semantics
SCHEDULE COMMITMENT ≠ ASSIGNMENT FACT ≠ DATED TODO ≠ PROGRESS EVENT.
FREE WINDOW ≠ REQUIRED STUDY TIME.

Design consequence:
- Week/Day views visually distinguish commitments, available windows, allocated TODOs.
- Free time uses neutral availability styling, not “study block” styling.
- Parent/Child views share information but not authority.

### 1.5 Capture / evidence
Capture originals → temp save → 저장하고 분석 → review draft → Parent confirm → FACT → Learning Master → Planner.

Design consequence:
- Camera flow prioritizes shutter, not metadata.
- Analysis state is draft, never FACT.
- HOLD / UNKNOWN / low-confidence states need explicit UI.
- Targeted retake must preserve valid images.

### 1.6 Specialist apps
Ready owns session continuity.
Hide & Seek / Snap & Pop own their specialist activity logic.

Design consequence:
- Specialist actions appear as route cards/launch points.
- Do not embed specialist logic inside Ready.
- Return surface must preserve exact task/lap/session context.

### 1.7 Character / expedition crew
Character is runtime-selected by character_id/runtime state.

Design consequence:
- Use optional character/crew slot.
- Layout remains complete when slot is absent.
- No fixed character art controls the composition.

## 2. IA correction to apply before visual styling

Primary child-facing navigation:
1. TODAY
2. PLANNER
3. RECORDS
4. SETTINGS

Contextual destinations:
- Mission
- Focus
- Wrap
- Result
- Planner Day
- Capture
- Parent Review
- Parent Approval
- Profile

Calendar is absorbed as a Planner/Records projection rather than competing with Planner as a primary authority destination.

Planner Admin must be decomposed conceptually into:
- Schedule / Planner management
- Assignment Intake
- Capture / Review
- Parent approval queue
- Learning evidence
These may share implementation modules initially, but final UI must not present them as one undifferentiated page.

## 3. Visual design criteria

### 3.1 Emotional model
The child should feel:
준비 → 출발 → 집중 → 확인 → 다음 경로

The app should feel like a calm expedition base camp, not a school admin dashboard and not a game lobby.

### 3.2 Hierarchy
Every child-facing screen answers in this order:
1. 지금 무엇을 해야 하는가?
2. 왜 이것을 하는가?
3. 얼마나 걸리는가?
4. 지금 시작 가능한가?
5. 다음에는 어디로 가는가?

### 3.3 Density
Primary viewport: 390×844.
- One dominant action per viewport.
- 16px side gutter.
- 24px major section rhythm.
- Minimum 44px touch target.
- Avoid more than 2 competing primary card groups above the fold.
- Long task titles wrap to maximum 2 lines before detail expansion.

### 3.4 Visual language
- Warm cream / parchment base.
- Soft coral / apricot for active/action.
- Deep forest/charcoal for authority and primary text.
- Muted sage/sky for route/availability/support.
- Avoid neon, arcade gradients, excessive badges, emoji-heavy decoration.
- Use high-density illustration only in contextual slots; UI remains functional without it.

### 3.5 Shape system
- Main cards: 18–24px radius.
- Compact status cards: 14–16px radius.
- Buttons: 14–16px radius, visually solid.
- Chips: capsule only for metadata/status, not for every control.
- Bottom nav: low-noise, icon+label, not floating game dock.

### 3.6 Typography
- Korean-first.
- Strong title contrast but not oversized to the point of hiding task state.
- Numeric time may use tabular figures.
- Metadata must remain legible at 12–13px minimum practical size.

## 4. Screen-specific mockup contract

### TODAY / Base Camp
Above fold:
- greeting/date/context
- optional crew slot
- primary “지금 할 일” mission card
- duration/readiness/reason
- single CTA: 시작하기
Below:
- remaining route for today
- next fixed commitment
- open Planner

Forbidden:
- Time Attack as hero/product identity
- category grid as dominant home content
- fixed character portrait controlling layout

### Mission
Show:
- selected TODO list
- advisory expected effort
- target session time
- optional specialist route suggestion
- start session CTA

Do not show:
- assignment creation as primary action
- parent allocation controls

### Focus
Show:
- active task title
- task progress position (e.g. 1/3)
- session timer and task/lap context distinctly
- pause/help/switch secondary actions
- contextual specialist route when relevant

### Wrap
Show only unresolved tasks.
One card at a time if needed.
Outcome choices:
COMPLETED / PARTIAL / DEFERRED / WAITING_FOR_PARENT / BLOCKED.
Finalize only after all unresolved states are resolved.

### Result
Order:
1. per-task outcomes
2. actual focus/session evidence
3. carry/replan/parent-help state
4. one next CTA

No confetti-first result page.

### Planner Week
Show:
- day columns/cards
- fixed commitments
- available windows
- allocated TODO indicators
- overload/hold markers
Tap a day → Planner Day.

### Planner Day
Chronological timeline:
- commitments
- neutral free windows
- allocated TODOs
- carry/reflow proposals
Parent approval is visibly pending when required.

## 5. Cross-screen component contracts

Required components:
- AppTopBar
- GlobalStateBanner
- CharacterCrewSlot
- PrimaryMissionCard
- TodayRouteList
- TaskCard
- SessionStatusBar
- OutcomeCard
- PlannerDayStrip
- PlannerTimeline
- AvailabilityBlock
- CommitmentBlock
- DatedTodoBlock
- EvidenceStatusCard
- ParentApprovalCard
- SpecialistRouteCard
- BottomNav
- RecoverySheet

Every interactive component must define:
owner / source-of-truth / state / event / transition / validation / failure state.

## 6. State UI rules

OFFLINE:
- global passive banner
- local actions continue when safe
- queued state visible
- retry only when meaningful

SYNC_CONFLICT:
- no silent overwrite
- show item/context, local/remote timestamps, safe action

PARENT_APPROVAL_PENDING:
- child sees pending state, not blocked mystery
- parent sees actionable queue

HOLD/UNKNOWN:
- neutral, non-error visual
- explain what is missing
- never invent content

EMPTY:
- explain next valid action
- avoid decorative empty-state only

ERROR:
- show recovery action and preserved context

## 7. Acceptance checklist for mockups

A visual mockup FAILS if:
- timer/product identity dominates TODAY
- Planner authority is hidden
- Parent can directly allocate dates/times
- Mission creates new DATED TODO
- free time is shown as mandatory study
- Wrap is skipped
- session end implies all tasks complete
- specialist app logic appears reimplemented in Ready
- character art is required for layout
- offline/conflict/pending states have no recovery
- 390×844 requires critical horizontal scrolling
- main CTA conflicts with bottom navigation
- visual hierarchy hides current action

## 8. Mockup review scorecard

Review each target screen on:
- Information hierarchy
- Action clarity
- Cognitive load
- State visibility
- Continuity
- Error recovery
- Authority correctness
- Runtime feasibility
- 390×844 usability
- Exploration tone

A screen is not design-approved unless all authority/runtime criteria PASS even if the visual quality is strong.
