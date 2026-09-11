# Mood direction candidate flow v2 — verification

Task: `2026-09-11-ready-mood-direction-candidate-flow-v2`.
Inspected HEAD: `d9f24c7` (previous visual-quality-gate work).
Branch retained: `runtime-session-bridge-2026-09-10`.

## Root cause and implementation boundary

The actual client, loader fallback and endpoint used a fixed MOOD / STYLE / GEAR consultation. The endpoint combined all choices into one profile and applied fixed FAITHFUL / PLAYFUL / ADVENTURE interpretation lenses. These assumptions are superseded; no LIVELY / WARM / CALM candidate model or personality classification is accepted.

PHOTO remains the sole identity authority. Six initial mood tiles each own approved optional keywords and six expression/staging prompt dimensions. Three distinct selected tiles produce three ordered requests, each carrying the same original photo and only its own direction. Duplicate directions are structurally rejected. Prompts cannot prove perceptual distance or same-child resemblance: candidate admission and final confirmation require image-review attestations; the offline Visual Fidelity Gate additionally requires MOOD_DIRECTION_DISTANCE evidence. Legacy candidates cannot resume this contract. Selected direction refinement returns to the original photo before master confirmation and the existing EXPLORER/completion continuation.

Client generation/refinement are hard locked before fetch. Server enablement and cost confirmation remain independent locks. No real provider call, credit use, secret read, commit, push, branch switch, main/production change, deployment or release was performed. No location or Snap features were added.

## Exact changed files

- `ready-mood-direction-v2.js` — new shared extensible tile/keyword/direction validation.
- `ready-character-candidate-v1.js` — three-tile selection, optional keywords, sequence preview, locked generation, candidate/master evidence admission and original-photo refinement.
- `ready-onboarding-identity-v1.js` — PHOTO/CHARACTER copy corrected; transition mechanics unchanged.
- `ready-stage-c.js` — shared contract loading and photo-preserving retry fallback; old consultation fallback removed.
- `index.html` — shared contract ordering and changed entry-script cache query.
- `netlify/functions/character-candidates.mjs` — one selected direction per sequential provider request; original-photo master refinement; unreviewed outputs.
- `tests/ready-mood-direction.mjs` — new offline contract and actual adapter-loop tests with a simulated provider.
- `tests/ready-first-journey-semantics.mjs` — new selection/keyword/legacy/evidence assertions plus existing transition regressions.
- `tests/ready-first-journey-transition.mjs` — new mood selectors, fallback assertion, 320/390/430px overflow and touch checks; optional installed browser path.
- `tests/visual-qa/fidelity-gate.mjs` — eighth gate, same original-photo evidence and three-candidate direction evidence.
- `tests/visual-qa/fidelity-gate.test.mjs` — eight-gate reporting; existing parameterized negative tests cover the new gate.
- `docs/VISUAL_FIDELITY_GATE.md` — evidence schema and implementation boundary updated.
- `docs/MOOD_DIRECTION_V2_VERIFICATION.md` — this report.

## Bounded checks

- PASS: Node syntax checks for all ten changed/new JavaScript test and implementation files.
- PASS: `node tests/ready-mood-direction.mjs` — tile/keyword validation, independent prompts, original-photo refinement, duplicate rejection, server lock, sequential actual adapter loop with an in-memory provider, outputs remain UNREVIEWED. No real environment/provider credentials used.
- PASS: `node tests/ready-first-journey-semantics.mjs` — persisted and storage-failure paths, unavailable candidate fallback, observer settling, duplicate activation, recovery target preservation, late photo decode, zero API calls, three-selection limit, keyword limit, legacy state rejection, missing/static review rejection. The simulated loader timeout is expected.
- PASS: `node tests/visual-qa/fidelity-gate.test.mjs` — eight fail-closed gates, missing/forged evidence rejection, explicit FAIL handling, unsafe paths and coverage.
- PASS: `git diff --check`.

## Remaining blockers

Playwright's default installed browser revision was unavailable. Explicitly selecting the existing Chromium binary failed with `spawn EPERM`. Browser tap/layout measurements therefore did not execute; iPhone Safari and 320/390/430px visual QA remain unverified. Four original reference boards and actual generated outputs are unavailable. Premium reference fidelity, visible pairwise mood distance, same-child/age/quality, resemblance refinement and final master reuse remain **BLOCKED**, never generated-output PASS. The locked branch provides no reviewer evidence import UI; approved evidence and a separately authorized generation integration are required before actual generation can proceed.
