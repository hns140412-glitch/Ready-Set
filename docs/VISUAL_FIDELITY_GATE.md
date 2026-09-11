# Ready character Visual Fidelity Gate v1

The four supplied First Journey / Judy boards are a strict contract. No material layout/style drift is acceptable. This repository task has no attached board image files or generated child outputs available for review: visual status is **BLOCKED**, not PASS. Existing boot, semantic and transition tests certify only their named behaviors.

Run offline with Node 18+:

```sh
node tests/visual-qa/fidelity-gate.test.mjs
node tests/visual-qa/fidelity-gate.mjs --template
node tests/visual-qa/fidelity-gate.mjs artifacts/visual-qa/review.json
```

Save the template in the ignored local evidence directory; keep approved review evidence private. Never check child photos into the repository. The gate makes no network requests, imports no provider code and spends no credits. Existing server enablement and per-request cost confirmation remain mandatory. Gate PASS does not authorize generation, release or deployment.

Exit codes: 0 = complete human-reviewed evidence PASS; 1 = explicit visual FAIL; 2 = missing/unverified evidence BLOCKED. Invalid JSON/schema is a nonzero error. A provider `high`/`master` label, CSS marker, prompt, image URL or successful render cannot grant visual PASS. Human observations remain attestations; this is not a face recognition or automated aesthetic scoring system.

## Evidence schema

Every entry in `references`, `screenshots`, `outputs`, `comparisons` needs a unique `id`, relative local PNG `file`, SHA-256 `sha256`, native `width`, and `height`. Use PNG exports of existing authorized outputs; no resizing to meet resolution requirements. Paths are confined to the evidence directory, symlink escapes rejected, PNG header/dimensions and hashes checked. Full image decoding, effective sharpness and authenticity require image review; a valid PNG header alone is not proof.

- `revision`: exact tested implementation revision (include workspace patch identifier before gateway commit).
- `references`: exactly four distinct originals, each with `origin: "USER_SUPPLIED"`, `boardName`, and `regions` listing all relevant panels. Do not replace unavailable boards with invented baselines.
- `screenshots`: all PHOTO, CHARACTER, CANDIDATES, CONFIRM, COMPLETE, VISUAL_ID states at CSS widths 320, 390, 430. Add `state`, `revision`, `viewport: {width,height}`, `dpr: 1`, `browser`, `fixtureKind: "ACTUAL_RENDER"`, and `metrics: {horizontalOverflow:false, clippedContent:false, overlap:false, minTouchTarget:44, brokenImages:0}`. Measure target size and overflow in the browser; clipping/overlap also need visual inspection. CONFIRM/COMPLETE/VISUAL_ID additionally name `selectedOutputId` and `identityId`. Labels refer to visible flow states, not new application state enum values.
- `outputs`: roles candidate-1, candidate-2, candidate-3, selected, front, side, back, expression, action. Each needs `kind: "GENERATED_OUTPUT"`, `identityId`, `generationId`; native shorter edge at least 1024px. Set `selectedCandidateId` to the chosen candidate record ID. All outputs use one identity ID. Candidate hashes must differ, but meaningful variation and resemblance require review.
- `comparisons`: actual side-by-side PNGs with `referenceId`, named `region`, `screenshotId`, and explicit `alignment` describing equal viewport/DPR/crop/scroll/font/locale/safe-area assumptions. Cover every region of all four boards and every screenshot. Do not stretch references to hide drift.
- `reviews`: all seven gates need named `reviewer`, ISO `reviewedAt`, and every criterion from the template with `verdict`, specific `observation`, and existing `evidenceIds`. Inspect the actual linked images. Record defects as FAIL; missing evidence stays UNREVIEWED. No waiver for a material reference delta.

## Separate gates and rejection rules

| Gate | Automated enforcement | Runtime/image review required |
| --- | --- | --- |
| REFERENCE_COVERAGE | Four distinct boards, hashes, region mapping, revision | Board authenticity and complete mapping; no material drift |
| UI_LAYOUT | Criterion evidence and reviewer completeness | Premium child-friendly pale sky-blue world, navy/blue hierarchy, rounded white cards, spacing, mascot/speech support |
| CHARACTER_IDENTITY | Three distinct candidate hashes, common identity ID | Permitted photo resemblance, same recognizable child, stable face/hair/age, coherent outfit/gear, meaningful variants |
| CHARACTER_RENDER_QUALITY | Required output roles, PNG dimensions >=1024px | Polished 3D animated-film quality; reject placeholder, emoji/icon substitutes, flat low-detail cartoon, generic child, weak resemblance, distorted anatomy/hands/eyes, blur, cropping |
| CROSS_VIEW_CONSISTENCY | Selected lineage and master ID across views | Face/hair/outfit continuity across candidates, confirm, complete, visual ID; reusable turnarounds, expressions/actions |
| MOBILE_RESPONSIVE | 18 view/state entries and measurement thresholds | Actual readable, unclipped layouts, deliberate spacing, accessible scrolling/safe areas and >=44px touch targets |
| SIDE_BY_SIDE_REVIEW | Comparison coverage and criterion-level signed observations | Inspect every comparison, resolve every material delta; never rubber-stamp metadata |

The existing capture adapter covers only early onboarding and cannot supply the full evidence matrix. Capture later states manually in an isolated session with existing authorized images, or extend the offline fixture adapter when those assets are available. Synthetic transition-test pixels and style consultation silhouettes are scaffolding, not qualifying character art. No paid calls should be made to fill this gap without separate approval.

## Implementation boundary

PHOTO -> CHARACTER -> three candidates -> CONFIRM -> COMPLETE stays intact. Candidate art now uses contain sizing to avoid presentation cropping; controls have a 44px minimum height. The generation brief now explicitly requests premium 3D and identity/outfit continuity. Prompts cannot guarantee those properties: independent generation/refinement can still drift, and front/side/back reuse is not implemented by the current endpoint. These remain image-output blockers until actual evidence passes all seven gates. No location tracking or Snap & Pop growth, badges or Wish Shop work belongs here.
