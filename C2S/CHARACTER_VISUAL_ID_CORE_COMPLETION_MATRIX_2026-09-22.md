# CHARACTER VISUAL ID CORE — COMPLETION MATRIX
Date: 2026-09-22

| Area | CODED | CI_VERIFIED | PROVIDER_RUNTIME | DEVICE |
|---|---|---|---|---|
| Source photo normalize/hash | PASS | PASS | N/A | NOT_RUN |
| Direction round 1/2 | PASS | PASS | N/A | NOT_RUN |
| System auto contrast | PASS | PASS | N/A | NOT_RUN |
| A/B/C provenance contract | PASS | PASS | N/A | NOT_RUN |
| Independent identity contract | PASS | PASS | N/A | NOT_RUN |
| Candidate generation server boundary | PASS | PASS | NOT_RUN | NOT_RUN |
| Candidate comparison/select | PASS | PASS | NOT_RUN | NOT_RUN |
| Consistency structural gate | PASS | PASS | N/A | NOT_RUN |
| Visual consistency review boundary | PASS | PASS | NOT_RUN | NOT_RUN |
| Human same-identity confirmation | PASS | PASS | NOT_RUN | NOT_RUN |
| Likeness correction boundary | PASS | PASS | NOT_RUN | NOT_RUN |
| Visual ID hard lock gate | PASS | PASS | NOT_RUN | NOT_RUN |
| Real derivative asset pipeline | PASS | PASS | NOT_RUN | NOT_RUN |
| Character Master Sheet boundary | PASS | PASS | NOT_RUN | NOT_RUN |
| Projection V01 | PASS | PASS | N/A | NOT_RUN |
| Independent core execution fixture | PASS | PASS | N/A | N/A |
| Ready integration | DEFERRED | DEFERRED | DEFERRED | DEFERRED |

Validated code checkpoint:
`e3786e16e68703c927d1704487a5399116775809`

CI run:
`35679010098` SUCCESS

Interpretation:
- pre-provider Character Core code is substantially closed;
- real image quality and likeness are intentionally NOT claimed;
- provider execution and device validation remain separate evidence gates.


## 2026-09-22 pre-provider frozen core update

Latest exact HEAD:
`0fe155604869df9d550daa6328f3579ee5c6c96c`

Workflow:
- run `35679773522`
- conclusion: SUCCESS
- full Worker Self-Test: PASS
- Character Visual ID contracts: PASS
- independent Character core: PASS
- server consistency gate: PASS
- projection freeze validator: PASS
- privacy / ownership-boundary validator: PASS

### Projection freeze
`CHARACTER_VISUAL_ID_PROJECTION_V01` is now:
`FROZEN_PRE_PROVIDER`

Consumer privacy boundary:
- original source photo: NOT EXPOSED
- source photo hash/fingerprint: NOT EXPOSED
- provider internals: NOT EXPOSED
- correction internals: NOT EXPOSED
- raw visual-review evidence: NOT EXPOSED

Consumers receive only approved identity assets, status, minimal provenance, assurance, and capabilities.

### Source-photo lifecycle
Original source photo is required only before Visual ID lock for:
- candidate generation
- visual consistency review
- likeness correction

After successful `VISUAL_ID_LOCKED`:
- source image blob is deleted
- source metadata is deleted
- purge event is recorded
- internal source hash may remain as provenance evidence
- downstream projection never exposes the hash

Policy:
`PURGED_AFTER_VISUAL_ID_LOCK`

### Master Sheet correction
Character Master Sheet no longer depends on the original source photo.
After lock, the verified locked final character becomes the visual authority for derivative consistency/master-sheet generation.

### Independence boundary
Character server storage namespace:
`character-visual-id-assets-v1`

Character functions no longer import Ready family auth directly.
They consume the current family identity implementation only through:
`character-family-session-adapter.mjs`

This adapter is an implementation boundary only.
Character does not own family identity semantics.

### Frozen state
`CORE_CODED = TRUE`
`EXACT_HEAD_CI = PASS`
`PROJECTION_FROZEN_PRE_PROVIDER = TRUE`
`SOURCE_PRIVACY_BOUNDARY = PASS`
`INDEPENDENT_CORE_EXECUTION = PASS`

Still NOT_RUN:
- paid image generation
- paid visual review
- deployed server runtime
- real child source-photo flow
- device validation
- Ready / Hide / Snap integration
