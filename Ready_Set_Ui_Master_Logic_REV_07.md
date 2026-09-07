# Ready & Set Ui Master Logic — REV_07

> Status: FORMAL BASELINE / SOURCE OF TRUTH
> Date: 2026-09-06
> Previous Baseline: `Ready_Set_Ui_Master_Logic_REV_06.md`
> Shared Contract: `TAKY/MASTER/LEARNING_APP_FAMILY_MASTER_REV_01.md`
> Brand: Ready & Set
> Tagline: **그냥! 지금 하면 돼!**

REV_07 inherits REV_06 unless explicitly overridden below.

## 1. PRODUCT ROLE OVERRIDE — HARD LOCK

Ready & Set is not only a time-attack app.

It is the child's **BASE CAMP and learning-session orchestrator**:

`GOAL → SELECT MULTIPLE TASKS → SET ONE TARGET TIME → START SESSION → RUN TASK/LAP → ROUTE TO SPECIALIST APP WHEN NEEDED → RETURN → WRAP-UP → END SESSION → REPORT/NEXT`

The existing Time Attack experience remains a core execution experience, but not the entire product definition.

## 2. BASE CAMP WORLD ROLE

Shared island onboarding is inherited from Learning App Family Master.

Ready & Set owns BASE CAMP operation after setup.

- Island name is child-defined.
- BASE CAMP display name is child-defined.
- BASE CAMP is the common start/return point for a connected session.
- Guide connection is expressed through the existing radio concept without redefining Guide persona.

## 3. MULTI-TASK / LAP SESSION — HARD LOCK

A child may choose multiple tasks and bind them to one target time.

Required invariants:
`ONE SESSION / ONE TARGET TIME / MULTIPLE TASKS / ONE ACTIVE TASK / ONE ACTIVE LAP`

Each current task accumulates its own Lap time.

- `TASK_CHANGE = LAP_END + NEXT_LAP_START`
- `APP_SWITCH != LAP_END`
- completing a specialist-app activity may complete the current task/lap but never automatically the whole session.

Minimum recorded Lap data:
`session_id / task_id / lap_id / started_at / ended_at / elapsed / end_reason / result_state`

## 4. SHARED TIMER — HARD LOCK

Ready & Set is the single session-state owner.

Timer state must survive:
- navigation inside Ready & Set,
- transition to Hide & Seek,
- transition to Snap & Pop,
- return to BASE CAMP,
- temporary background/lock conditions where platform permits state restoration.

Use timestamp-derived timing. Foreground interval ticks are display helpers only.

`APP_SWITCH != PAUSE`

Only an explicit pause/reason may stop learning-time accumulation according to session rules.

## 5. SPECIALIST APP ROUTING

Default routing:
- vocabulary discovery/retrieval task → Hide & Seek
- idea/thought/writing/speaking/expression task → Snap & Pop
- general execution/problem work → Ready & Set

Routing does not create a new session unless the child explicitly starts a new session.

Specialist-app return must preserve:
`session_id / goal_id / task_id / lap_id / target_time / timing state / return_target`

## 6. END VS COMPLETE — HARD LOCK

`SESSION_END != TASK_COMPLETE`

Valid example:
- English = COMPLETED
- Math = PARTIAL
- Hanja = WAITING_FOR_PARENT
- Session = ENDED

Minimum task states:
`COMPLETED / PARTIAL / DEFERRED / BLOCKED / WAITING_FOR_PARENT`

Do not bulk-mark all selected tasks complete when a session ends.

## 7. VOICE WRAP-UP — HARD LOCK

At end request:
`KNOWN STATE SUMMARY → DETECT MISSING/AMBIGUOUS STATE → GUIDE ASKS ONLY NECESSARY FOLLOW-UP → CHILD VOICE RESPONSE → STRUCTURE RESULT → END SESSION`

Guide must not repetitively interview the child.

Primary input = child voice/text/explicit task action.
Guide voice = missing-state clarification, transition, support.

## 8. HELP / RETRY INTEGRATION

Preserve existing Guide/Family Help contracts.

Support task state and Lap handoff for:
`CHECK → RETRY_WRONG → LIGHT GUIDE HINT IF NEEDED → WAITING_FOR_PARENT IF UNRESOLVED → RETURN LATER`

A blocked/help-waiting task may close its current Lap and allow the child to move to the next selected task without closing the full session.

## 9. IMAGINATION CLOUD CALL

Ready & Set may invoke shared Imagination Cloud only when a child's question/confusion would benefit from short visual/concept support.

It must preserve session/task/lap and return to the exact execution context.

It is not a general decorative mode and does not replace specialist expression work owned by Snap & Pop.

## 10. PWA SAFE AUTO-UPDATE — HARD LOCK

Recommended production behavior:

`GITHUB PUSH → HOST AUTO DEPLOY → NEW VERSION DETECTED → DOWNLOAD/PREPARE → SAFE APPLY`

Rules:
- detect updates automatically,
- never force reload during an active session,
- if update is ready while active, store `UPDATE_READY`,
- persist active session state before activation,
- apply after session end or safe idle/base-camp state,
- after update, restore expected idle/base-camp state and preserve historical/session records,
- cache/version identifiers must be traceable and stale-cache regression tested.

## 11. ICON / BRAND RELEASE GATE

Current production icon/name remain until UI/visual direction is approved.

After UI freeze:
- create an original ultra-high-density illustration master icon,
- derive PWA icon sizes and Apple touch icon,
- update manifest name/short_name/icons/theme metadata,
- validate installed iPhone/Safari home-screen appearance,
- verify that release/cache behavior does not strand an obsolete icon or app shell.

## 12. REGRESSION FAIL CONDITIONS

FAIL if:
- app routing resets timer,
- app routing creates duplicate sessions,
- app switch closes a Lap,
- session end completes unfinished tasks,
- update reload interrupts active learning,
- return from specialist app loses current task/lap,
- child-defined island/base-camp names are lost,
- REV_06 existing validated features are silently removed.

## 13. SHARED ASSIGNMENT CAPTURE SURFACE — GUIDE CONTRACT

Ready & Set may render or route the shared GUIDE / MAIN Assignment Camera/OCR intake, but does not own OCR interpretation.

This is not a direct import of a specialist-project OCR feature. It is a shared assignment-intake capability governed by `TAKY/OS/GUIDE_FAMILY_LEARNING_OS.md`.

Required project behavior:
- normal capture view = live camera + bottom shutter priority;
- no persistent photo-count emphasis during rapid capture;
- shutter → local temporary save → immediate next shot;
- analysis action = `분석 맡기기`; it marks a batch boundary, not capture completion;
- analysis may be followed by `이어서 촬영하기`;
- failed quality result identifies `N번째 장` with thumbnail and retakes only that image;
- valid photos and analysis results survive a targeted retake;
- Review-before-Commit precedes confirmed assignment and Google Drive save;
- system copy stays literal; Guide carries short warmth/wit without interrupting capture.

Inherited Guide lines:
- `좋아, 이제 내 차례네.`
- `사진 속 단서부터 꺼내는 중.`
- `비슷한 건 모으고, 수상한 건 따로.`
- `놓친 게 있나 한 바퀴만 더.`
- `정리 끝. 다음 사진도 가져와.`
- quality repair examples use `N번째 장` and joke about light/focus/page, never the child or parent.

`촬영 완료`, per-shot forced classification, always-visible count emphasis and full-batch restart for one failed image are superseded for this flow.

Actual PWA implementation, deployment, OCR provider/thresholds and real-device validation remain outside this document delta and UNVERIFIED.

END — READY & SET UI MASTER LOGIC REV_07
