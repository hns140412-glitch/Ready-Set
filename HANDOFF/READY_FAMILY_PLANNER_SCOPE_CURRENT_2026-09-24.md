# READY FAMILY PLANNER SCOPE CURRENT — 2026-09-24

STATE: CLOSED_CURRENT
BRANCH: taky/ready-character-intro-integration-2026-09-24
EXACT_HEAD: 200d19458051f823c3d742e2881d428f76058bd7
RUNTIME_E2E_RUN: 36001240063
RUNTIME_E2E: SUCCESS

## CLOSED
- Google-first account identity remains separate from FamilyMembership.
- Family planner shared data is scoped by family_id.
- Child planner personal data is scoped by member_id.
- Parent Planner Admin supports FAMILY_ALL or specific CHILD target.
- Family-wide fixed schedules are visible to all children in the family.
- MEMBER-targeted schedules are visible only to the selected child.
- Child TODO / learning allocation / execution state remains member-isolated.
- Schedule exceptions and availability exceptions remain parent-managed.
- Family planner snapshots sync through family: scope.
- Existing member: sync isolation and legacy error contract preserved.
- Family member target list refreshes on bind, Planner Admin render, and family-session changes.

## AUTHORITY
Family shared:
- schedule_commitments
- schedule_exceptions
- daily_availability_windows
- availability_exceptions
- schedule-triggered reflow_review

Child member:
- dated_todos
- homework_templates / learning allocation outputs
- progress_events
- execution observations
- carry-over
- adaptive / personal execution state

## NEXT OPEN
- Final Weekly / Daily Planner product UI projection against the shared-family + child-personal model.
- Real Netlify Google provider activation / deployed callback verification remains external/deploy-gated.
- Physical-device verification remains external/device-gated.

Do not reopen CLOSED items without regression evidence.
