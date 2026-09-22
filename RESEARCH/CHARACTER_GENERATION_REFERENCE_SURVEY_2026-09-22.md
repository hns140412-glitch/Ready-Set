# CHARACTER GENERATION REFERENCE SURVEY — 2026-09-22

Status: REFERENCE_ACQUIRED / NO_DEPLOYMENT
Scope: Ready & Set character core only
Branch: `taky/ready-rebuild-v01-2026-09-21`

## Current product target
Core flow:
1. source photo capture/upload
2. direction consultation round 1 (3 options -> 1)
3. direction consultation round 2 (3 options -> 1)
4. system-derived automatic contrast direction
5. A/B/C candidate generation
6. compare/select
7. likeness correction
8. Character Master / Visual ID lock

Deferred expansion:
- intro
- drop mode
- voyage mode
- world-arrival narrative

## Reference 01 — OpenAI Imagegen Photobooth demo
Repository: https://github.com/openai/openai-imagegen-demo

Why relevant:
- camera capture or image upload
- multiple style selections
- image edit endpoint
- multi-result generation
- result preview
- restart/create-another-set flow

Adoptable pattern:
- separate capture -> style/direction selection -> generation -> result comparison
- keep source image as an explicit input to the image-edit request
- style definitions separated from rendering code

Do not copy:
- style selection cardinality; Ready uses exactly two direct selections + one automatic contrast
- generic style presets; Ready directions are child-specific consultation inputs

## Reference 02 — OpenAI Images API / SDK
Docs: https://developers.openai.com/api/docs/guides/image-generation
SDK source: https://github.com/openai/openai-node/blob/main/src/resources/images.ts

Why relevant:
- source-image edit is a first-class supported flow
- multipart upload path
- one or more reference images can be used
- supports iterative image editing after candidate selection

Adoptable pattern:
- use image edit for photo-identity anchored candidate creation
- use a separate likeness-correction/edit pass after candidate selection
- keep API key/server call off the client

## Reference 03 — Netlify Functions
Docs:
- https://docs.netlify.com/build/functions/get-started/
- https://docs.netlify.com/build/functions/configuration/

Why relevant:
- server-side API endpoint without exposing provider key
- deploy/version together with application
- deploy-preview compatible
- 60-second synchronous function limit
- buffered request/response limit is 6 MB; binary upload effective limit is lower because of Base64 overhead

Adoptable pattern:
- `/.netlify/functions/character-candidates`
- validate image type/size before provider request
- return generation job/candidate metadata, not prompt authority from client
- keep server-owned prompt whitelist/contract

Important:
- large camera photos should be resized/compressed client-side before upload
- do not put long-running 3-image sequential generation blindly into one synchronous function if it risks timeouts

## Reference 04 — Netlify Background Functions
Reference: https://github.com/netlify/context-and-tools/blob/main/skills/netlify-functions/SKILL.md

Why relevant:
- long-running image generation can return 202 immediately
- background execution can continue significantly longer than synchronous functions

Adoptable pattern:
- request -> create generation job -> 202
- generate candidates asynchronously
- persist result/job state
- client polls or refreshes job status

Constraint:
- background payload limit is small, therefore source image bytes should not be sent directly as background payload
- persist source image first, then pass only a blob key/job id to the background function

## Reference 05 — Netlify Blobs
Docs: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
Netlify reference rule: https://github.com/netlify/context-and-tools/blob/main/cursor/rules/netlify-blobs.mdc

Why relevant:
- image/file uploads
- unstructured generation output
- server-side function integration
- simple key/value storage
- metadata support

Adoptable stores:
- `character-source-photo`
- `character-candidates`
- `character-master-assets`
- `character-generation-jobs`

Suggested keys:
- `{member_scope}/{visual_id}/source.webp`
- `{member_scope}/{visual_id}/candidate/A.webp`
- `{member_scope}/{visual_id}/candidate/B.webp`
- `{member_scope}/{visual_id}/candidate/C.webp`
- `{member_scope}/{visual_id}/master/front.webp`
- `{member_scope}/{visual_id}/master/meta.json`

Warning:
- Netlify Blobs is appropriate for files and simple job state, not complex relational profile/permission data
- branch/deploy previews can access site-wide stores; protect keys and write permissions carefully

## Reference 06 — GPT Image playgrounds
Examples:
- https://github.com/luffy-xu/gpt-image-1
- https://github.com/element824/gpt-image-1-playground

Why relevant:
- batch/grid result comparison
- image edit flow
- parameter/history tracking
- cost/usage visibility

Adoptable pattern:
- generation request history with:
  - visual_id
  - source_hash
  - direction ids
  - model
  - quality
  - candidate slot
  - generation timestamp
  - correction lineage
- candidate grid is a comparison UI, not a mood-selection UI

## Reference 07 — Consistent asset post-processing pattern
Example: https://github.com/thebenlamm/image-gen-mcp

Why relevant:
- asset-type presets
- crop/resize/output consistency
- fallback when post-processing fails

Adoptable pattern:
- Character Master assets should be derived from a locked candidate through deterministic presets
- define output presets:
  - avatar_square
  - avatar_circle
  - portrait_card
  - full_character
  - master_turnaround
- store raw generated asset separately from normalized runtime asset

## Recommended architecture for Ready
```
Photo Capture
  -> local resize/compress
  -> source photo upload
  -> Visual ID draft created

Direction Engine
  -> round 1
  -> round 2
  -> system auto contrast
  -> candidate contract A/B/C

Generation API
  -> server-owned prompt contract
  -> source photo + direction contract
  -> async generation job

Blob Storage
  -> source
  -> A/B/C candidates
  -> job status
  -> selected candidate
  -> corrected/master assets

Candidate Compare
  -> select one

Likeness Correction
  -> edit selected image only
  -> compare before/after
  -> approve

Character Master
  -> lock identity
  -> normalize assets
  -> expose stable Visual ID
```

## Strong recommendations
1. Preserve source photo separately; never overwrite it with generated assets.
2. Keep generation prompts server-owned and direction-id based, not arbitrary client text.
3. Generate A/B/C with explicit provenance.
4. Prefer asynchronous job architecture for multi-image generation.
5. Resize/compress camera photos before upload.
6. Keep generated raw files and normalized runtime assets separate.
7. Treat likeness correction as a distinct edit pass, not repeated blind regeneration.
8. Persist a generation trace so C2S can prove which decision produced which asset.
9. Do not couple Intro/Drop/Voyage to the character generation pipeline.
10. Netlify deployment should remain gated; this survey does not authorize a deploy.

## Implementation mapping
NOW:
- character direction runtime: implemented
- state wiring: implemented
- reference architecture: acquired

NEXT:
- source-photo intake adapter
- generation job contract
- Netlify Function boundary
- Blob key schema
- candidate generation adapter
- candidate comparison view
- likeness correction endpoint
- Character Master normalization

DEFERRED:
- intro
- drop/voyage
- world entry


## 2026-09-22 provider refresh
Official current OpenAI references reviewed:
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/docs/guides/image-prompting
- https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst

Updated implementation decision:
- default precise-edit model: `gpt-image-2.5-sunburst`
- candidate generation uses Images Edit with source photo as the identity anchor
- likeness correction uses multiple `image[]` inputs: source photo + selected character
- Character Master sheet also uses source photo + locked character as references
- output format: WebP
- candidate generation is one slot per server request (A -> B -> C) to reduce synchronous-function timeout risk
- all provider execution remains protected by `READY_CHARACTER_PAID_GENERATION`
- older GPT Image 1 references are historical reference only and are not the current default implementation target
