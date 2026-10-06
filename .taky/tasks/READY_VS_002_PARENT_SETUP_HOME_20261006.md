# READY-VS-002 — Parent Setup Home → Schedule / Homework input

Status: ASSIGNED_TO_CLAUDE_CODE
Date: 2026-10-06
Repository: D:\Git PWA\READY-WEBAPP-20261006
Branch: taky/ready-webapp-vertical-slice-20261006
Starting HEAD: 37c298cb68aa7224a1deb957db76836622a85543
Deploy / Push / Merge / Netlify Publish: FORBIDDEN

## Objective

Make parent mode a real parent preparation surface rather than the child execution screen with a parent badge.

At ?role=parent the user must see:
1. a parent-oriented home title/lead;
2. first-class actions for schedule setup and homework FACT input/confirmation;
3. today Planner assignments as read-only status, not child execution buttons;
4. no dominant "숙제 시작" / resume CTA and no parent quick-start execution path;
5. schedule add/change entry that opens the existing editor;
6. homework input entry that reaches the existing parent homework/capture area.

Child mode must keep READY-VS-001 unchanged.

## Authority / semantics

Use existing Ready/Alpha rules already read for VS-001:
- PARENT = CAPTURE / INPUT / CONFIRM / SUPPORT
- PLANNER / MAIN = ALLOCATE
- CHILD = SELECT TODAY / EXECUTE
- Ready = BASE CAMP / session execution
- parent mode must not become a second Planner owner
- missing timetable row != free time
- AI extraction != confirmed assignment FACT
- no fabricated OCR/AI result
- USER != DEBUGGER

Do not reopen MASTER/Beta/Alpha.

## Known concrete root causes to inspect

Current browser evidence shows parent mode still displays child "숙제 시작".
Likely causes:
- ready-home-homework-ui-v1.js renders the child execution CTA after ready-base-native-v2.js has rendered parent actions.
- ready-parent-setup-hub-v1.js mounts only under #worldStage .worldSky, while the current implementation-hold path removes worldStage, so the setup hub can disappear.

Confirm these in code before editing.

## Allowed scope

Prefer smallest changes in:
- ready-home-homework-ui-v1.js
- ready-parent-setup-hub-v1.js
- ready-base-native-v2.js only if actually required
- targeted tests
- artifacts/ready-vs-002/

Do not refactor unrelated runtime/session code.

## Acceptance

Parent mode:
- title/lead are parent-oriented
- visible parent setup hub or equivalent first-class setup card
- visible schedule action
- visible homework input/confirm action
- Planner assignments display status only
- no child start/resume CTA
- no [data-quick-start] execution buttons
- schedule action opens existing schedule surface/editor path
- homework action reaches mission/input surface
- browser console errors []

Child regression:
- READY-VS-001 targeted contract still PASS
- child Home still has "숙제 시작" / resume
- child Focus/result flow remains unchanged

Evidence:
- add one targeted automated contract test
- run relevant existing targeted tests
- run actual Chrome/CDP mobile 390x844 parent home + schedule/homework navigation capture if available
- screenshots/logs under artifacts/ready-vs-002/
- git diff --check

At end report:
STARTING STATE
IMPLEMENTED USER FLOW
CHANGED FILES
TEST RESULTS
BROWSER EVIDENCE
OPEN RISKS
Do not commit.
