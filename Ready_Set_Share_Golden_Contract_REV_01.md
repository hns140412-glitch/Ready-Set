# Ready & Set Share Golden Contract — REV_01

> Status: CANONICAL PROJECT SHARE REFERENCE / HARD LOCK
> Date: 2026-09-14
> Applies to: Ready & Set 탐험 시작 공유 / 탐험 완료 공유 / Kakao·iOS share surfaces
> Parent authority: Ready_Set_Ui_Master_Logic_REV_06.md and later validated project rules

## 0. RECOVERY CONTRACT
This document exists so a new ChatGPT conversation, Codex session, agent, handoff, or implementation task can recover the current Ready & Set share rules without inventing a new share concept.

Before designing or coding share UI, inspect this contract and the parent MASTER. Do not create a new purpose, theme picker, fixed copy system, or decorative image-first card merely because the old conversation is not visible.

Historical MASTER wording is evidence. Current user corrections in this contract supersede conflicting user-facing terminology.

## 1. PRESERVED SHARE STRUCTURE
The existing Ready & Set share system has two canonical states:
- Pre-Mission Share Card → current user-facing term: `탐험 시작 공유`
- Post-Mission Share Card → current user-facing term: `탐험 완료 공유` / `탐험 기록`

The existing share engine structure is PRESERVED. It is not replaced by a newly invented share purpose.

Primary share content remains compact `image + short text` / platform feed-style presentation as appropriate. The card is an information-and-reaction surface, not an illustration poster.

## 2. USER-FACING VOCABULARY NORMALIZATION — HARD LOCK
Current Ready & Set user-facing world vocabulary is normalized around `탐험`.

Legacy words such as `작전`, `타임어택`, `출동`, `귀환`, `작전 보고서`, and generic `미션` may remain in historical source records or internal technical identifiers, but SHALL NOT drive new user-facing copy.

Preferred current vocabulary family:
- 탐험
- 오늘의 탐험
- 오늘의 섬
- 탐험 시작
- 탐험 진행
- 탐험 완료
- 탐험 기록
- 탐험대 / 길잡이

This is vocabulary normalization, NOT a fixed-copy mandate.

## 3. COPY IS DYNAMIC — GUIDE/탐험대 RULES APPLY
Share copy is NOT a fixed string table such as always showing `오늘의 탐험 완료!`.

The existing Guide / 탐험대 behavior and Dynamic Share Card logic SHALL generate/select short context-appropriate reactions from actual state.

Inputs may include, where available and appropriate:
- selected/current task context
- completion/progress state
- target time
- actual focus time
- target-vs-result / TIME SAVE nuance
- continuity or achievement context
- applicable recording/event result
- profile theme
- user avatar/profile state
- Main Guide state and allowed Guest Guide appearance

Guide/탐험대 tone remains a companion/guide, not a grader. Do not shame, scold, exaggerate failure, or turn a slower result into a red failure state. Copy should naturally support the next action or recognize the completed exploration.

Legacy example copy is reference evidence for tone only unless separately marked as a literal lock.

## 4. PROFILE THEME IS THE SINGLE THEME AUTHORITY — HARD LOCK
`낙하 / 항해` is chosen in PROFILE, not during sharing.

Canonical flow:
`PROFILE.theme → 탐험 UI → Focus/Result context → Share renderer`

At share time:
- NO theme picker
- NO re-selection of 낙하/항해
- renderer reads the current profile theme automatically

Theme affects world expression, wording nuance, symbols and supporting illustration. It does NOT create a different data hierarchy or a different product purpose.

World lock:
- both themes share the Ready & Set `오늘의 섬` world
- `낙하` means approaching/descending toward the real island; it does NOT mean a floating sky island
- `항해` means approaching/traveling toward the same world by sea

## 5. PROFILE AVATAR INHERITANCE — HARD LOCK
The user avatar/profile representation is inherited from the profile automatically.

At share time:
- NO avatar picker
- NO arbitrary replacement character
- NO newly generated unrelated hero character

Respect the existing privacy/share opt-in behavior where applicable. If profile sharing is disabled, use the approved non-identifying fallback rather than silently exposing the profile image.

## 6. INFORMATION BEFORE BACKGROUND — HARD LOCK
Share cards SHALL prioritize the actual exploration state and result over decorative scenery.

Background/island/theme illustration is supporting context only. It must not dominate the card or force a large poster-like share image.

For `탐험 시작 공유`, preserve the existing pre-share information concept: the current exploration/task context and target-time/context needed for the recipient to understand the upcoming exploration, plus Guide/탐험대 reaction.

For `탐험 완료 공유`, preserve the existing post-share result concept. Existing MASTER result fields include the task/exploration identity, target time, actual focus time, target-vs-result/TIME SAVE nuance and date/context where applicable, plus Guide/탐험대 reaction. ISSUE time remains important internally but is not automatically promoted to share-card hero information.

Do not fabricate runtime values for a production share card.

## 7. THEME EXPRESSION DOES NOT CHANGE CARD SCHEMA
`낙하` and `항해` use the same underlying share data contract and hierarchy.

Theme may change:
- supporting motif/iconography
- small illustration/background accents
- movement/world phrasing
- Guide/탐험대 contextual expression

Theme must NOT change:
- whether a share is pre/post
- core runtime result truth
- profile identity source
- data hierarchy merely for visual novelty
- share interaction into a theme-selection workflow

## 8. PLATFORM DELIVERY IS SEPARATE FROM GOLDEN CONTENT
Kakao Feed, iOS native share sheet, downloadable image, or another supported channel is a delivery implementation decision.

Do not redesign the Golden content model just to satisfy a transport API.

If Kakao Feed is used, its title/description/image/button payload must be generated from this same share state. If an image asset URL is required by Kakao, the upload/HTTPS image layer is infrastructure and must not become a second independent share-data source.

## 9. FOCUS GOLDEN SEPARATION
Share work SHALL NOT redesign the approved Focus timer UI.

Focus visual authority is the separate mobile+tablet Golden reference:
`Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`
plus `Ready_Set_Focus_Golden_Reference_REV_01.md`.

A share card does not gain authority to alter Focus simply because it references Focus/session data.

## 10. REGRESSION FAIL CONDITIONS
FAIL if any occur:
- share asks the user to choose 낙하/항해 again
- share asks the user to choose an avatar again
- fixed copy replaces the contextual Guide/탐험대 behavior
- legacy `작전/타임어택/출동/귀환` terminology is newly exposed as the primary user-facing world language
- 낙하 is represented as a floating sky-island world
- decorative background becomes more important than exploration information
- fabricated numbers replace runtime values
- a newly invented share purpose replaces the existing pre/post share structure
- share implementation changes the approved Focus Golden UI
- historical example copy is mistaken for a universal fixed string

## 11. RECOVERY ORDER FOR NEW CONVERSATIONS
When another conversation is asked to work on Ready & Set sharing, recover in this order:
1. `Ready_Set_Share_Golden_Contract_REV_01.md` (this file)
2. `Ready_Set_Ui_Master_Logic_REV_06.md` and validated later MASTER additions
3. existing Pre-Mission / Post-Mission Share Card definitions
4. existing Guide/Main Guide/Guest Guide and Dynamic Share Card rules
5. current runtime/profile implementation
6. only then create/modify UI or code

If old screenshots are unavailable, do NOT invent a new concept. Mark only the missing visual evidence as unverified while preserving the canonical rules above.

`SEARCH MISS ≠ RULE ABSENCE`
`OLD CHAT NOT VISIBLE ≠ PERMISSION TO REDESIGN`
`PROFILE THEME → SHARE THEME`
`PROFILE AVATAR → SHARE AVATAR`
`ACTUAL STATE → GUIDE/탐험대 REACTION`

END — READY & SET SHARE GOLDEN CONTRACT REV_01
