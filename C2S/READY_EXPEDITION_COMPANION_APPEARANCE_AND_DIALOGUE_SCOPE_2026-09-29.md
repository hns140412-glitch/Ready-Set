# Ready & Set — 탐험대원 등장·대사 규칙 적용 범위
Status: USER_CORRECTION_RECORDED / RUNTIME_BINDING_OPEN / VISUAL_GATE_HOLD
Date: 2026-09-29
Owner: shared expedition/character rules and active Snap & Pop world registry; Ready & Set is a consumer, not a new character or dialogue owner.

## Exact direct user correction
"모든 문구는 탐험대 기준에 따라 기입하는 거야" refers specifically to **which expedition companion appears and what that companion says**. User explicitly clarified "타이머 문구는 상관 없어" and "탐험대원 등장 및 문구 말하는 거야." Never reinterpret this as permission or instruction to rewrite every Timer static title, controls, or already approved clock layout.

## Entry/render contract (hard review rule)
- Child remains protagonist. Draw child using resolved current profile Visual ID; draw exactly the companion actually chosen for that user's continuing expedition when the scene calls for a companion. Do not invent or permanently embed a random companion, default animal, named character or unrelated NPC for a concept mockup.
- Companion appearance is resolved by canonical `character_id` plus verified approved Visual ID/asset reference; current name and permitted individual expression derive from the same identity. If source/ID unresolved, keep a clearly unresolved slot and mark OPEN; a convenient stock portrait is not approval.
- Dialogue is attributed to the **actual appearing speaker** and derives from documented character personality/role plus real current context: today task, chosen goal, active session, actual result and any existing Guide reaction rules. Short, specific, child-respecting. No blanket fixed generic cheer, invented catchphrase or duplicated dialogue across mismatched characters.
- Before-start and after-result optional share-button placement is unchanged. If a companion reaction is included in a share card, inherit its real speaker/character context, profile privacy and existing shared expedition rule; sharing does not trigger extra companion selection.
- The selected companion's common role follows the child through Home / weekly/day / goal / session / result where approved. Location specialists/guests can appear only under their existing source-proven role and trigger, and may not silently replace the chosen companion.
- Visual and functional QA must verify **on-screen identity ↔ character_id ↔ speaker label ↔ actual displayed line ↔ task/result state** per scene. Catch fallback/default character injection, voice/text mismatch, unapproved special guest, and false attribution.

## Scope exclusion
This correction is **not** a request to edit `그냥! 지금 하면 돼!`, the approved yellow analogue-clock layout, functional labels like `잠깐 멈춤` / `완료했어요`, number labels or static timer copy. Timer's functional UI and responsive phone/tablet Golden remain separately protected.

## Exact current source gap
At observed PR #118 source, `app.js` still defines legacy hardcoded `GUIDE_TYPES` (`lumi/pico/mori`) and `applyGuide` falls back to `GUIDE_TYPES.lumi` while `initial.guide.type='lumi'`. These are actual inherited runtime behavior; **they have not been validated as canonical selected-companion `character_id` mappings**. Treat them as migration/ownership gap, not as source evidence that any of these must appear or speak in the newly designed expedition basecamp. Do not erase historical state or substitute Core 6 arbitrarily.
- Action before visual approval: resolve CURRENT exact owner registry, current chosen companion identity and visual binding; map or preserve legacy profiles with a non-destructive migration; then bind dialogue attribution and test each relevant scene.
- No unsourced runtime companion binding, no fabricated output, and no changing Timer static wording to mask this OPEN.

## Gate
SCOPING=RECORDED
CANONICAL_CHARACTER_ID_BINDING=OPEN
SPEAKER_AND_CONTEXT_COPY_BINDING=OPEN
VISUAL_QA=HOLD
HUMAN_VISUAL_APPROVAL=OPEN
MAIN_MERGE=HOLD
NETLIFY=HOLD
