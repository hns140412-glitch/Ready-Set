# Ready whole foundation A v1

Task: 2026-09-11-ready-whole-foundation-a-v1. Isolated HEAD inspected: 5bc45db,
branch runtime-session-bridge-2026-09-10. No branch switch, commit, push or deployment.

## Boundary and implementation

Ready remains BASE CAMP and the sole execution/session writer. Parent captures,
confirms and supports. Learning/Subject supplies interpreted, indivisible planner
units plus cognitive/activity load. Planner/MAIN prepares dated TODAY TASK
projections; child selects and executes through the existing homework/session path.
Parent routes cannot author difficulty, estimates or allocation in the new contract.
The local role query is a UI convention, not authenticated authorization.

- ready-foundation-v1.js: pure ScheduleProfile/ScheduleEvent/Override, adapters,
  capture state machine, parent fact allowlist, deterministic Planner and condition hook.
- ready-foundation-control-v1.js: separate ready_foundation_v1 storage, Parent
  schedule/homework/support entrypoints, snapshot import and Planner publication.
- ready-stage-c.js loads the foundation before legacy stages, after identity.
- Stage D legacy edit/distribution handlers, Stage E automatic allocation, G1
  Tuesday relocation and G14 automatic reconciliation are superseded when enabled.
  Original facts, sessions, reports and historical rows are not migrated/deleted.
- ready-schedule-base-v1.js reads effective normalized schedules without visual changes.

Effective ranges are [effective_from, effective_to). A revision closes the previous
range and appends a new immutable version. Retrospective insertion before a queued
future revision is rejected. A one-day override never edits the recurring baseline.
parent_editable and planner_movable are independent mandatory booleans; fixed academy
appointments can be edited by Parent but Planner never relocates them. Profile
revision rejects a parent-locked baseline. The existing confirmed snapshot is imported
once with its captured date and NOTION provenance; it is not a live connection.

All adapters emit the same fields. NOTION-like {id, properties}, LOCAL rows and
SYSTEM/EVENT rows are fixtures/contracts only. HYBRID matching event keys use
NOTION < LOCAL < SYSTEM/EVENT, then explicit one-day overrides. Different keys coexist.
STANDALONE excludes remote rows; NOTION_CONNECTED retains local fallback/overrides.
Source loss records status and retains cached profiles. Ingest stages normalized
source events; applying them requires an explicit effective-date profile revision.

Planner requires real deadlines and Learning/Subject units. It never splits free-text
facts or invents missing units. Missing interpretation/deadline or a confirmed study
opportunity produces an unresolved reason. Explicit opportunities overlapping fixed
events are blocked. Each opportunity takes at most one unit in this conservative
initial policy. Earliest deadlines, carry-over, existing candidate load, activity/
cognitive load, voluntarily supplied condition evidence and actual completed units
participate. Pace support requests can reduce a day's candidate count; fast completion
never increases assigned units. No minute-capacity truth is used.

Condition weights default to tired=1, requestedRest=2, configurable within 0..3.
These are conservative placeholders, NOT finalized empirical weights. No diagnosis,
surveillance, GPS or passive data collection. All candidate runs are archived. Future
unstarted foundation projections may be replaced on a new run; past, selected,
reported and non-PLANNED tasks are protected. Existing non-foundation tasks and facts
are untouched. Schedule edits rerun the last explicit Planner request if one exists.
No Learning interpreter is invented: integrations call prepare with interpreted units,
dates, actualHistory, carryOver and optional pace. Until then FACT remains pending.

Manual input explicitly requires review before commit. Camera exposes a route event
ready-capture-route with the shared rapid capture -> LOCAL_TEMP -> immediate next ->
batch analyze -> targeted retake -> Review-before-Commit contract. No OCR or image
bytes are fabricated. Capture reducers are testable independently of a provider.

## Status / GAP / ADR

PASS (bounded Node): effective term/vacation switch, recurring academy revision,
one-day override, independent permissions, equivalent adapter shapes, hybrid precedence,
source loss retention, Parent authority rejection, schedule-sensitive Planner output,
immutable earlier plans/history, execution projection publication, capture ordering,
legacy guards and loader ordering. Existing manual-learning, First Journey semantics,
mood/refinement/paid-lock checks pass. Changed JavaScript passes node --check.

GAP: real Notion connector, sync conflict UI, calendar import/export, native camera
and durable photo blob adapter, OCR provider, Learning interpreter integration and
browser/mobile dialog QA. These are not PASS. Calendar/native scheduling and authenticated
multi-device roles require separate ADRs. Revision editor is intentionally functional
and minimal; WEEK/DAY/Expedition visuals, Focus, character, rewards and ownership are
outside this change. Existing legacy facts are retained for review, not reinterpreted.

BLOCKED check: tests/ready-first-journey-transition.mjs cannot start because this
workspace has no playwright package. No dependency installation or visual claims made.

Checks: node tests/ready-foundation-contract.mjs; node tests/ready-manual-learning-contract.mjs;
node tests/ready-first-journey-semantics.mjs; node tests/ready-mood-direction.mjs;
node --check on all changed JS; git diff --check.

Existing Stage E/F Parent-confirmed FACTs are also exposed through a read-only
assignmentFacts adapter to Planner input. Their stored fields/history are not rewritten.
Schedule and support edits invalidate/recompute the last explicit Planner request;
source loss alone does not delete data or manufacture replacement assignments.
