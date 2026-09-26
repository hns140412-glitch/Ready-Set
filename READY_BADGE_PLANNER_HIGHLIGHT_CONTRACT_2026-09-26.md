# CHILD BADGE HIGHLIGHTS IN READY DAILY / WEEKLY PLANNER — 2026-09-26

## User direction
Show verified earned badges inside the daily and weekly exploration plan to help a child savor and remember progress. It is celebratory **AFTER** real acquisition, never a required reward quota or a prerequisite to completing the Planner. A week with zero new badges is still a successful week when the user chooses to explore.

## UI contract
- Base camp Week view: compact "이번 주 탐험의 흔적" with up to 3 acquired-badge text chips, a remaining-count summary, and per-date "훈장 N" markers. Do not show as task badges without a verified task correlation; these are date-level traces only.
- Day view: compact "이날 발견한 훈장" with earned-only first acquisition / re-award / tier promotion labels. A tier promotion is ONE underlying reaward event, not another award.
- Do not render unapproved badge images, claim that 60 content slots or 20 discovery proposals are earned, or create a personal locked badge atlas for parents.
- No badges today: quiet neutral copy, no "missed target", streak penalty, points race or escalating productivity prompt. The visual is a text-only original expedition pin pending actual approved assets. Reduced-motion and text labels work without color cues.
- Only the signed `awarded_at` month projection grouped in Asia/Seoul qualifies. Do not infer from task-completed telemetry, planned dates, achievement Decision approved_at or family gem gifts.

## Actual bounded code
`ready-badge-planner-v01.js` implements read-only UI consumption of an explicitly attached `TAKY_AUTHENTICATED_BADGE_READ_ADAPTER_V1`. It expects the already verified central `TAKY_CHILD_BADGE_CALENDAR_V1` contract and checks current authenticated server-hydrated CHILD session (source starts NETLIFY_IDENTITY), exact child/family matching, complete date/month event shapes and freshness across account changes. The future adapter's server must derive identity from its secure session, not accept browser-scoped child IDs. The UI's checks are display hygiene, not independent signature verification or authorization. **No real badge endpoint/adapter is connected here**; the default surface truthfully says it is unconnected, not falsely zero earned.

Ready `app.js` calls the overlay after the existing Planner draw, without altering planner-owned allocation, tasks, carry-over, timers, gem balance or local state. The overlay makes no network call, IndexedDB or localStorage write itself. Tests use test-only in-page fake API results to examine presentation and fail-closed behavior. Those mocks are not real user achievements. Existing actual Ready member-role identity and planner behavior remain unchanged.

## Deployment / OPEN
The Ready main may couple to Netlify auto deployment; this branch and draft PR must NOT merge or deploy without an exact-head gate for that linkage. Production still needs a credentialed no-store Badge GET endpoint that calls TAKY `getMonth` and is child-scoped server-side, verified approved catalogue/art, actual Ready/Snap detail navigation and data refresh on authoritative grant events. Keep actual Family Praise Gem gifts in a separate labelled lane in the future, never counted as achievement reawards. Parent personal unearned-badge atlas forbidden.
