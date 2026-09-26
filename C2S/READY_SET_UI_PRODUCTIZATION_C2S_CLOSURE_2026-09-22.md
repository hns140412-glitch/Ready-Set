# READY & SET UI PRODUCTIZATION C2S CLOSURE — 2026-09-22

Status: C2S_COMPILE_CLOSED / UI_PRODUCTIZATION_OPEN
Scope: Ready & Set UI/UX productization
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Source product validation HEAD: `6287c0e4c64fbadcdaf3d7d27a291b414ccba751`

## Core correction

The previously reported ~74–76% must NOT be treated as final product completion.

It describes a browser/runtime-heavy implementation state before final UI structure, final visual system, and UI-function integration are closed.

From this point onward, Ready & Set completion must be reported on four separate axes:

1. FUNCTION_IMPLEMENTATION
2. UI_STRUCTURE_DEFINITION
3. UI_FUNCTION_INTEGRATION
4. USER_FACING_PRODUCT_MATURITY

A high function implementation score must not raise final product maturity by itself.

## Why UI is product architecture, not decoration

Final UI work may alter:
- page hierarchy
- navigation
- component boundaries
- information priority
- interaction sequence
- state exposure
- feature entry points
- parent/admin controls
- planner visualization
- capture/OCR entry
- history/result flow
- mobile density
- keyboard/safe-area behavior
- character/exploration crew slots
- Snap & Pop / Hide & Seek connection points
- automated test selectors and interaction contracts

Therefore a visual mockup cannot be applied as a CSS skin over the existing application without contract mapping.

## Required execution order

The UI work MUST follow this order:

```
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
```

Skipping directly from mockup to CSS is prohibited.

## Screen families that must be accounted for

At minimum:
- Home / TODAY
- Mission
- Focus
- Wrap-up
- Result
- Planner — week
- Planner — day
- Assignment / task intake
- Parent/Admin review and confirmation
- Capture / OCR / recording entry
- Learning evidence / interpretation surface
- History / progress
- Profile / settings
- Sync / offline / conflict states
- Empty / loading / error / permission-denied states

## Integration rules

Every visible control must map to:
- owner module
- source of truth
- state
- event
- transition
- validation
- failure state

Every existing important capability must map to at least one visible or intentionally hidden UI destination.

No "implemented but orphaned" functionality may be counted as product-complete.

## Mobile-first reference

Primary design reference: 390×844 mobile viewport.

Must validate:
- readable hierarchy
- thumb reach
- minimum touch targets
- no critical action hidden by keyboard
- safe-area awareness
- scroll depth
- fixed/sticky element conflicts
- text expansion
- loading/error/retry states

## Character / exploration crew rule

Character visuals are not hard-coded into the core layout.

UI provides slots/components/runtime hooks.
Actual character choice is driven by character ID / runtime state.

Exploration concept may influence:
- visual metaphors
- progress framing
- maps/routes/cards
- discovery moments
- badges/items

But it must not obscure the core learning/planning job.

## Cross-app boundary

Ready & Set owns planning, execution, scheduling, confirmation and result flow.

Snap & Pop / Hide & Seek integration points may be represented in UI, but their domain logic must not be silently reimplemented inside Ready & Set.

## Completion scoring rule

Until final UI and integration are closed, report:

- FUNCTION_IMPLEMENTATION: separate
- UI_STRUCTURE_DEFINITION: separate
- UI_FUNCTION_INTEGRATION: separate
- USER_FACING_PRODUCT_MATURITY: conservative

Current corrected user-facing maturity should be treated as approximately 45–55% provisional before final mockup/UI integration audit.

This is not a regression in code quality; it is a correction of the denominator used for product completion.

## Validation rule

Final UI work is not PASS because screenshots look good.

Required evidence:
- structure matches product purpose
- all critical capabilities have destinations
- no orphaned functions
- state/event transitions are mapped
- runtime interactions pass
- responsive behavior passes browser audit
- accessibility basics pass
- previous business/domain contracts remain intact

## Prohibitions

Do not:
- decorate before mapping
- recreate already-implemented logic inside UI
- invent missing product behavior
- infer unsupported timetable/reference data
- hard-code one family's private data
- hard-code character identity into reusable layout
- weaken tests to fit a mockup
- claim final completion from static screenshots
- call Netlify / Production during UI design stage

## Closure

UI_PRODUCTIZATION_STANDARD = LOCKED
STATIC_MOCKUP_ONLY = INSUFFICIENT
UI_AS_PRODUCT_ARCHITECTURE = REQUIRED
FINAL_PRODUCT_MATURITY_REAUDIT = REQUIRED_AFTER_INTEGRATION
