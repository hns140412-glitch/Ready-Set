# READY & SET — CURRENT TASK FOR MULTI-AI REVIEW

## Purpose
Implement and validate the confirmed Ready & Set flow:

TIMER → EXPLORATION WRAP-UP → EXPLORATION REPORT → COMPLETION SHARE

## Authority
Apply:
1. latest explicit user correction
2. RAW/original source
3. current canonical/repository/runtime
4. verified Master
5. Handoff/Summary

Do not trust FINAL / GOLDEN / PASS labels by themselves.

## UI authority lock
- Use the user's confirmed Ready & Set UI as visual authority.
- Do NOT revive rejected/unconfirmed Focus Mode / Time Attack / old Focus Golden visual family.
- Functional wiring first; no redesign.

## Functional scope
### Timer
- 10 / 15 / 25 min / custom target where applicable
- free-focus/no-target mode where current rules allow
- start / remaining / focused elapsed / pause / resume / end
- timestamp-based truth, not tick-counter truth
- reload/background/screen-lock must not falsely end session
- pause is explicit
- timer duration must not determine homework quantity

### Exploration wrap-up
- use existing session wrap-up path
- preserve COMPLETED / PARTIAL / DEFERRED / BLOCKED / WAITING_FOR_PARENT where applicable
- SESSION_END != TASK_COMPLETE
- incomplete work must remain visible and carry over/reschedule according to current rules

### Exploration report
Show actual evidence only:
- task/exploration title
- outcome/status
- target time if one existed
- actual focused time
- pause/issue time if currently exposed
- start/end evidence when available
- carry-over/deferred truth when applicable
- no fabricated XP/streak/score

### Completion share
- share output reflects only verified report data
- no fake target when none existed
- PARTIAL/DEFERRED/BLOCKED/WAITING_FOR_PARENT must not be labeled complete
- sharing must not mutate task/session state
- do not expose internal IDs/debug/hidden parent data

## Integration locks
- ONE SESSION / ONE ACTIVE TASK / ONE ACTIVE LAP / ONE SESSION STATE OWNER
- reuse current Ready session owner/persistence
- no second competing timer/session store
- preserve Planner/task truth
- specialist/recording round-trip returns to same active session/timer truth
- network/app switch/screen lock != session end

## Acceptance tests
A. 10-min target start → countdown decreases
B. pause → freeze appropriate values; resume continues
C. background/reload → authoritative timestamps restore state
D. no-target session → no fake countdown
E. COMPLETED → truthful completed report
F. PARTIAL → remains PARTIAL
G. DEFERRED → carry-over remains intact
H. BLOCKED / WAITING_FOR_PARENT preserved where supported
I. share uses same truthful status/timing and does not mutate state
J. reload after report restores persisted truth
K. rejected Focus/Time Attack visuals not used as authority
L. mobile-width full path smoke test

## Current GitHub context
Repository: hns140412-glitch/Ready-Set
Implementation review PR: https://github.com/hns140412-glitch/Ready-Set/pull/2

## Review rule
Each AI must review independently. Do not rely on another AI's conclusion.
