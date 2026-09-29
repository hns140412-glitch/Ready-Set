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

## Implemented review evidence — exact branch 2026-09-29
- The existing Ready Character Formation selection (`state.expedition.primaryCompanionId`) is now consumed through `src/identity/expedition-companion-presentation-runtime.js`. User-given `primaryCompanionAlias` is the display name and does not mutate the roster key. No implicit Dubi or old Lumi/Pico/Mori is inserted in the new Home/Goal/Result speaker slots.
- Direct canonical roster: `CharacterFormationJourneyRuntime.CREW`; all six actual Ready Core6 derivative images and SHA-256 come from `assets/character-formation/asset-manifest.json`, guarded by `HARD_LOCK`. The presentation explicitly distinguishes a **local roster character_id** from a globally mapped Visual ID; no invented cross-app Visual ID is claimed.
- Home/intro text uses the chosen character's original, source-owned `CREW.line`. Goal preparation uses the matching original `CharacterFormationSceneRuntime.preparationLineFor(character_id)` with the same ID. Result displays actual chosen avatar + alias, while Result owner supplies the outcome summary separately without fabricated companion speech.
- Existing formation preview now leaves an unselected companion slot empty rather than silently defaulting to Dubi. Legacy Guide settings data and histories were neither deleted nor mapped by guess.
- `tests/ready-expedition-companion-presentation.test.js`: missing/invalid selection fail-closed; selection/name switch, display/source line and all SIX local binary SHA-256 values match locked manifest. Actual Chromium browser integration test at 390x844 (`tests/ready-companion-live-binding-review.spec.js`) validates loaded Ink image and its original Home/Goal lines and Result alias. This uses a clearly synthetic selection, not the real child's choice.
- Browser screenshots `ready-chosen-crew-home-source-bound.png`, `ready-chosen-crew-goal-source-bound.png`, `ready-chosen-crew-result-source-bound.png` are proof of **the ID/speaker connection only**. Current backdrop remains the old CSS abstract scene; true accepted Base Camp and Week/Day final 1:1 visual composition still requires separate art binding and review.
- Snap-Pop PR #10 `onboarding/crew-scope-contract.json` states its distinct selected 5–6 crew array, an unmerged primary-companion selection OPEN, and cross-system identity mapping requiring explicit approval. Ready local presentation integration does NOT assert cross-app Snap authority nor auto-activate its candidate originals.

## Revised status
READY_LOCAL_COMPANION_ID_AND_ALIAS=CODED_CI_BROWSER_PASS
READY_LOCKED_CORE6_DERIVATIVE_HASHES=CI_PASS_6_OF_6
INTRO_AND_PREPARATION_SOURCE_OWNED_LINES=CODED_CI_BROWSER_PASS
RESULT_COMPANION_SPEECH=NOT_INVENTED__RESULT_SUMMARY_SYSTEM_OWNED
CROSS_APP_PRIMARY_IDENTITY_MAPPING=OPEN_OWNER_RECONCILIATION_HOLD
HOME_WEEK_DAY_ORIGINAL_SCENE_1_TO_1=OPEN
REAL_USER_SELECTION_DEVICE_PROOF=OPEN
VISUAL_AUTHORITY_GATE=FAIL_HOLD
MAIN_MERGE=HOLD
NETLIFY=HOLD
