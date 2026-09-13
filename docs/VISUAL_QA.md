# Ready visual QA (non-production)

Character/reference acceptance additionally requires the seven fail-closed gates in [VISUAL_FIDELITY_GATE.md](VISUAL_FIDELITY_GATE.md). This boot harness alone cannot grant visual PASS. The capture adapter also supports `small` (320 × 740) and `wide` (430 × 932), and records overflow, touch-target and image-load measurements; clipping and overlap remain explicitly unreviewed.

Run from this repository with Node 18+:

```sh
node tests/visual-qa/contract.mjs
node tests/visual-qa/server.mjs
```

Open `http://127.0.0.1:4177/__visual/?state=onboarding-mode` in a **fresh disposable browser profile**. This dedicated origin clears local/session storage on every fixture load. Never use it for personal data. Stop the server with Ctrl+C. It reads only public allowlisted assets, does not load environment files or API handlers, and does not serve the normal root page. Do not deploy this server.

Available states: `onboarding-mode`, `onboarding-profile`, `onboarding-photo`. These seed synthetic facts in the existing `readyset_identity_v1` store before preboot. The photo state deliberately has no personal photo or generated asset. No new session owner, session state, or production route is introduced. Extend fixtures using existing owners only; active focus/session flows are outside this first harness's boundary.

The server injects setup only into its QA response; production HTML, navigation and service worker stay unchanged. The setup additionally checks host, port, path and fixture. CSP blocks connections, workers and form submission; paid image API handlers are never imported. This is a capture environment, not a functional/API test server. Animations/transitions/caret are suppressed, clock and random seed are fixed. Real timers remain for normal boot. Never interpret a frozen capture as a timer correctness test.

## Capture

No browser automation dependency is required. If Playwright and its Chromium are already available in the test environment, stop the manual server first and run:

```sh
node tests/visual-qa/capture.mjs onboarding-profile mobile
node tests/visual-qa/capture.mjs onboarding-mode desktop
```

The optional runner starts/stops its own server, uses a clean context, blocks service workers/external requests, waits for fonts/images and the fixture readiness marker, fails on page errors, and writes PNG plus capture metadata under ignored `artifacts/visual-qa/`. It never installs packages or browsers. Supported CSS viewports: mobile **390 × 844**, desktop **1440 × 900**, DPR **1**, locale **ko-KR**, timezone **Asia/Seoul**, light scheme, reduced motion. Captures overwrite the same fixture/viewport filename: archive or rename evidence before the next run.

If unavailable, use browser DevTools responsive mode with the same dimensions, DPR 1, zoom 100%, light scheme, Korean locale and Seoul timezone. Reload the fixture; wait until `document.documentElement.dataset.visualQaReady` equals the state name, check the console for runtime errors and Network for missing assets, then capture the **viewport**, not the full page. Save its browser/OS/font details with evidence. Native inputs, Korean fonts and emoji vary across platforms; use the reference environment where possible. The marker is a boot gate, not proof of visual fidelity.

## Visual Contract

Before implementing reference-led UI work, record the reference ID/path and target state. Compare the reference and implementation side by side at identical CSS viewport, DPR, crop/scroll position, browser zoom, locale, font environment and device safe-area assumptions. If reference dimensions differ, add the explicit viewport to the runner rather than scaling one screenshot to conceal layout differences. Overlay images at 50% opacity in a local image viewer when useful; no paid image tools are needed.

- [ ] Same state, content, viewport, DPR and crop; no loading screens or overlays hiding the target.
- [ ] Major composition: section order, proportions, alignment, spacing, density and whitespace.
- [ ] Typography: font, weight, size, line height and wrapping; Korean text is readable.
- [ ] Colors, backgrounds, borders, radii, shadows and contrast match the reference.
- [ ] Asset identity, silhouette, scale, position and crop match; no placeholders replacing required art.
- [ ] Controls, selected/disabled states, navigation and visible copy match.
- [ ] No clipping, overlap, horizontal overflow or missing assets at each required viewport.
- [ ] Every major delta is listed and reviewed before marking the task complete.

Use `evidence-template.json` for one record per reference/state/viewport. `MATCHED` means no material visual differences; `ACCEPTABLE_DELTA` requires a specific rationale and reviewer acceptance for every delta; `FAILED_DELTA` means unresolved mismatch. Automated capture metadata is explicitly UNREVIEWED and must never be treated as MATCHED. Missing capture/reference is a blocker, not a passing verdict. Keep completed records and both images together in task evidence; no reference image is supplied by this harness.

## Checks and limits

The contract test executes host/path/port/fixture guards, verifies only the existing identity key is seeded, checks production entry points for harness wiring, and exercises loopback routes, method restrictions, secret-path denial and CSP API/worker blocking. It does not claim pixel fidelity. The bounded optional runner validates browser boot and captures one viewport. Without a locally available Playwright/browser runtime, screenshot automation remains a runtime-only blocker; manual capture and reference review are still required before a visual verdict.
