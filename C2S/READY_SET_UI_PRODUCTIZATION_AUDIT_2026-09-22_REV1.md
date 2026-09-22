# READY & SET UI PRODUCTIZATION AUDIT — 2026-09-22 REV1

Status: STRUCTURE_AUDIT_COMPLETE / HIGH_FIDELITY_PENDING
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Live-refreshed HEAD: `1d505a698addc77ee3b81ae5bcc8b27cb45c8b51`
Validated product runtime ancestor: `6287c0e4c64fbadcdaf3d7d27a291b414ccba751`

## 0. Live refresh / diff
Current HEAD is 4 commits ahead of validated product HEAD. The delta contains only:
- UI productization C2S atoms
- UI productization closure
- updated rebuild handoff
- UI productization start prompt

No runtime file changed in this 4-commit delta. Existing validated runtime evidence therefore remains attributable to the validated product ancestor, not automatically to the current documentation HEAD.

## 1. Product structure restored
Current canonical role:
`ASSIGNMENT FACT → LEARNING MASTER → LEARNING UNIT → PLANNER → DATED TODO → TODAY → CHILD SELECT → SESSION → PER-TASK RESULT → PROGRESS/CARRY-OVER → LEARN/REPLAN`

Ready & Set is the execution BASE CAMP/session orchestrator, not a timer product.
Authority:
- Parent = capture/input/confirm/support
- Learning Master = interpret/decompose/load metadata
- Planner = sole dated allocation authority
- Child = view/allowed fact input/TODAY selection/execution/outcome report

Runtime screen shell currently exposes:
- home
- mission
- focus
- recording
- result
- history
- calendar
- planner
- planner-admin
- profile
- settings

Key runtime modules already separated:
- navigation / app bootstrap / persistence
- mission / focus / session completion / session recovery
- planner policy / projection / query / planner screen / planner admin
- capture / assignment / parent intake
- recording
- result/history
- profile/settings/auth/sync
- accessibility/audio/share
- specialist routing/handoff

## 2. Screen Inventory

| screen_id | role | primary user | status |
|---|---|---|---|
| RS-TODAY | TODAY / Base Camp projection | Child | RESTRUCTURE_EXISTING home |
| RS-MISSION | selected TODO execution setup | Child | EXISTING |
| RS-FOCUS | active session + one active task/lap | Child | EXISTING |
| RS-WRAP | unresolved task clarification / wrap-up | Child | MISSING_AS_EXPLICIT_SURFACE |
| RS-RESULT | just-ended session result | Child | EXISTING |
| RS-PLANNER-WEEK | weekly allocation/commitment projection | Child/Parent read | EXISTING_INSIDE_PLANNER |
| RS-PLANNER-DAY | dated TODO + free-window detail | Child/Parent read | EXISTING_INSIDE_PLANNER |
| RS-INTAKE | assignment/task intake | Child/Parent | EXISTING_INSIDE_PLANNER_ADMIN |
| RS-CAPTURE | camera/gallery batch capture | Parent | EXISTING_INSIDE_PLANNER_ADMIN |
| RS-REVIEW | OCR/Vision review draft → FACT confirm | Parent | EXISTING_INSIDE_PLANNER_ADMIN |
| RS-LEARNING-EVIDENCE | interpretation/hold/unknown evidence surface | Parent/Admin | PARTIAL |
| RS-HISTORY | historical session/result records | Child/Parent | EXISTING |
| RS-CALENDAR | historical/planned calendar projection | Child/Parent | EXISTING |
| RS-PROFILE | member identity/profile | Child/Parent | EXISTING |
| RS-SETTINGS | preferences/auth/sync/data | Child/Parent | EXISTING |
| RS-PARENT-CONTROL | approval/reflow/confirmation queue | Parent | MISSING_AS_CLEAR_DESTINATION |

Required cross-screen states:
LOADING / EMPTY / ERROR / OFFLINE / PERMISSION_DENIED / SYNC_CONFLICT / PARENT_APPROVAL_PENDING / NO_SCHEDULE / NO_MISSION / CARRY_OVER_REQUIRED / HOLD_UNKNOWN_REFERENCE.

## 3. Feature → Screen Matrix

| Capability | Destination | Disposition |
|---|---|---|
| Planner-created DATED TODO → TODAY | RS-TODAY | CONNECTED but current Home framing is Time-Attack-heavy |
| Child selection | RS-TODAY → RS-MISSION | CONNECTED |
| One session / multi-task / one active task | RS-MISSION / RS-FOCUS | CONNECTED |
| Per-task outcome | RS-WRAP / RS-RESULT | PARTIAL; wrap surface implicit |
| Carry-over / replan | RS-RESULT → RS-PLANNER-DAY | PARTIAL |
| Fixed commitments / free windows | RS-PLANNER-WEEK/DAY | CONNECTED |
| Reflow proposal | RS-PLANNER-DAY / RS-PARENT-CONTROL | UI_DESTINATION_WEAK |
| Parent approval | RS-PARENT-CONTROL | UI_DESTINATION_WEAK |
| Capture batch | RS-CAPTURE | CONNECTED |
| OCR/Vision draft | RS-REVIEW | CONNECTED |
| Parent FACT confirm | RS-REVIEW / RS-INTAKE | CONNECTED |
| Learning Master interpretation | RS-LEARNING-EVIDENCE | PARTIAL |
| Recording | RS-FOCUS → recording | CONNECTED |
| History/progress | RS-HISTORY / RS-CALENDAR | CONNECTED |
| Offline/outbox/conflict | RS-SETTINGS + global state surface | PARTIAL |
| Specialist app handoff | RS-MISSION / RS-FOCUS / RS-RESULT | RUNTIME_OWNER_EXISTS; UI entry/return contract needs explicit product surface |
| Character/exploration crew | slot-based cross-screen | RUNTIME_SLOT_REQUIRED; no hardcoded identity |

## 4. ORPHANED / CONFLICT / MISSING UI

### CONFLICT
1. Current Home hero still presents `FOCUS CHALLENGE / 타임어택 이벤트`, while canonical says Time Attack is not product identity.
2. Legacy REV_07 is archived and cannot override canonical authority.
3. Current bottom nav uses Home / 기록 / 캘린더 / 설정 while Planner is a major product authority but is not first-class bottom navigation.
4. Planner Admin aggregates Capture, Intake, Learning Master, schedule admin and approval-like operations into one heavy surface.

### MISSING / WEAK
1. Explicit Wrap-up screen/surface.
2. Parent approval queue / pending state destination.
3. Clear carry-over decision surface.
4. Global offline/conflict recovery presentation outside Settings.
5. Explicit specialist handoff/return presentation.
6. HOLD/UNKNOWN learning-reference state presentation.
7. Planner Week vs Day information architecture is present but insufficiently separated as product-level destinations.

### ORPHAN RISK
No confirmed hard runtime orphan is declared yet because most capability owners exist, but the following are at risk of being functionally orphaned in final UI if not mapped:
- reflow proposal
- conflict resolution
- specialist return
- capture review re-entry
- Parent approval return path
- carry-over escalation

## 5. Screen → Runtime Contract skeleton

| Screen | owner/runtime | source of truth | key event | transition |
|---|---|---|---|---|
| TODAY | home-view + planner query/projection | Planner DATED TODO projection | SELECT_TODO / OPEN_PLANNER | Mission / Planner |
| Mission | mission controller/view | selected Planner items + session draft | START_SESSION | Focus |
| Focus | mission-focus + session service/domain | activeSession + active task/lap | PAUSE / SWITCH_TASK / END_REQUEST | Focus / Wrap |
| Wrap | session completion controller | unresolved task states | RESOLVE_TASK_OUTCOME / FINALIZE_SESSION | Result |
| Result | result-history controller/view | transient just-ended result | REPLAN / HISTORY / DONE | Planner Day / History / Today |
| Planner Week | planner screen controller/view | planner snapshot | SELECT_DATE / OPEN_TODO | Planner Day |
| Planner Day | planner screen controller/view | dated TODO + windows | REPLAN / APPROVAL_REQUEST | Parent Control / Today |
| Capture | capture intake/orchestrator/view | temp capture batch | SAVE_AND_ANALYZE | Review |
| Review | capture draft + assignment intake | analysis review draft | PARENT_CONFIRM_FACT | Learning Evidence / Planner |
| Settings Sync | auth-sync controller/view | local-first + sync adapter | RETRY_SYNC / RESOLVE_CONFLICT | previous context |

## 6. Navigation Map

`TODAY → Mission → Focus → Wrap → Result → TODAY`

Branches:
- TODAY ↔ Planner Week ↔ Planner Day
- Planner Day → Parent approval pending → Parent review → Planner Day/TODAY
- TODAY/Planner → Intake → Capture → Review → FACT confirmed → Learning Master → Planner
- Focus → Recording → Focus
- Mission/Focus → Specialist handoff → exact session/task/lap return → Focus/Wrap
- Result → carry-over/replan → Planner Day → TODAY
- Any screen → offline/conflict banner → recovery sheet → resume previous screen
- Any screen → Profile/Settings → back to exact origin when possible

Back/close rules:
- Focus back does not destroy active session.
- App switch does not pause or end lap.
- Result is transient and consumed after leaving.
- Retry restores the failed operation, not the whole flow.
- Parent approval returns to the originating TODO/allocation context.

## 7. UI Risk Register

| Risk | Level | Reason / protection |
|---|---|---|
| Replacing shell/navigation | HIGH | can break selectors, session continuity, back semantics |
| Splitting Planner Admin | HIGH | many existing owners/events currently aggregate there |
| Mission/Focus markup rewrite | HIGH | Runtime E2E selectors and active-session behavior |
| Wrap-up extraction | HIGH | exactly-once finalization and per-task outcomes must remain intact |
| Bottom nav change | MEDIUM | nav runtime mapping + history/calendar expectations |
| Home product-language rewrite | MEDIUM | low domain risk, moderate selector/layout risk |
| Character slot introduction | MEDIUM | must be optional and runtime-driven |
| Design tokens/card/button visual refresh | LOW-MEDIUM | safe only after semantic contracts freeze |
| Capture visual redesign | MEDIUM-HIGH | file inputs, batch preservation, permission/error states |
| Sync/conflict global banner | MEDIUM | must not create competing state authority |

## 8. Design System Skeleton

Principles:
- Base-camp / route / mission tone without game decoration obscuring actions.
- One dominant action per screen.
- Current task first; reason/duration/readiness/next state follow.
- 390×844 primary viewport.

Foundations:
- Typography: 4 levels (Display / Screen Title / Body / Meta), Korean-first line-height.
- Spacing: 4/8 base rhythm; 16 page gutter; 24 primary section gap.
- Cards: Action / Status / Evidence / Warning / Context variants.
- Buttons: Primary / Secondary / Quiet / Destructive; >=44px touch target.
- Chips: State / subject / time / source / HOLD.
- Progress: session progress separate from task completion.
- Navigation: Base Camp(Today), Planner, Record/History, Settings; contextual back preserves state.
- Modal: blocking confirmation only.
- Bottom sheet: reversible choice, pause reason, sound, contextual detail.
- State surfaces: loading/empty/error/offline/conflict/pending/hold.
- Illustration slot: optional contextual art, never required for function.
- Character/crew slot: runtime ID driven, collapses cleanly when absent.

## 9. First connected screen family — structural mockup contract

### TODAY / Base Camp
Primary: next actionable Planner-created TODO and Start.
Secondary: today route, remaining missions, Planner.
Remove Time-Attack-as-product hero framing.
Character slot is contextual and collapsible.

### Mission
Purpose: execution setup only.
Shows selected TODOs, expected effort advisory, target session time, specialist recommendation if applicable.
Does not create DATED TODO.

### Focus
Single active task emphasized.
Persistent session timer + lap/task context.
Pause/help/switch are secondary.
Specialist action is a routed activity, not a nested Ready implementation.

### Wrap
Only unresolved task states are asked.
Minimal clarification.
Every task resolves exactly once before finalize.

### Result
Per-task outcome summary first.
Then actual focus time/evidence.
Then one next-step CTA: Done / Replan / Parent help according to state.

### Planner Week
Commitments + free windows + allocated TODOs.
No implication that all free time is study time.
Tap date → Day.

### Planner Day
Chronological commitments + available windows + dated TODO cards.
Reflow and carry-over are proposals with explicit Parent/Planner authority path.

## 10. Maturity re-audit — REV1 provisional
- FUNCTION_IMPLEMENTATION: 86–88%
- UI_STRUCTURE_DEFINITION: 58%
- UI_FUNCTION_INTEGRATION: 49–52%
- USER_FACING_PRODUCT_MATURITY: 50–54%

Validation status:
- CODED: PASS for existing runtime baseline; UI productization changes not yet coded.
- CI_VERIFIED: PASS at validated product ancestor, not re-claimed for current doc-only HEAD.
- RUNTIME_VERIFIED: PASS 82/82 at validated product ancestor.
- DEVICE_VERIFIED: NOT RUN.

## 11. Next implementation gate
Before high-fidelity:
1. freeze screen IDs and navigation destinations,
2. split Planner Admin responsibilities without moving authority,
3. define explicit Wrap / Parent Approval / Offline-Conflict contracts,
4. define stable test selectors independent of visual markup,
5. only then generate high-fidelity six-screen visual direction.
