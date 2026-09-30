# READY SHARE GOLDEN / NATIVE MOBILE SHARE — 2026-09-28

Status: DRAFT IMPLEMENTED / CI and visual-gate evidence separate / NO DEPLOY.
Source of truth: \`Ready_Set_Share_Golden_Contract_REV_01.md\`, current Ready product/session/decision contracts, approved Library source images:
- \`카카오톡 속 레디앤셋 탐험 공유 카드.png\`
- \`레디앤셋 탐험 공유 UI 콘셉트 보드.png\`
- \`Ready & Set 공유 카드 가이드.png\`
- Focus Phone/Tablet Golden stays untouched. A historical REV_06 is provenance, not whole-app current authority.

## User intent
Share a compact **image + short text** through **the mobile OS native share menu**, select KakaoTalk there. Do **not** install/use the Kakao JS SDK, access token, channel API, upload endpoint, fake public URL, external sharing provider, or Netlify build hook.

## Implementation and ownership
- Ready owns a read-only share projection; Share never schedules work, writes rewards, confirms homework FACT, or grades child speech.
- PROFILE owns \`theme: 'drop'|'sail'\`. Historical \`state.share.theme\` is read only as a compatibility fallback; no theme picker at share time.
- Existing profile consent \`shareAvatar\` defaults OFF. Use only an approved, member-scoped consumable \`CHARACTER_VISUAL_ID_PROJECTION_V02\` derivative when resolvable; otherwise show a non-identifying RS emblem. Never expose original child/source photo in the card by silently falling back.
- Existing original Ready Guide images \`assets/guide-lumi.png\`, \`guide-pico.png\`, \`guide-mori.png\` may accompany context-based encouragement. No newly invented crew member.
- Start share reads Planner-owned selected TODAY labels and Mission target. Empty task or absent target -> HOLD, not fake data.
- Completion share requires verified per-task \`taskOutcomes\` with unique task IDs and known states. Mixed/partial != full completion. Focus and target values use the result receipt. Awards require a verified \`awardReceipt\`; absent receipt -> \`기록 대기\`, never fabricate +0/+N.
- Dynamic headline/reaction varies by start/result, drop/sail, completion state, focus/target nuance, recording presence, and selected guide. Sample labels and sample numbers are not production literals.
- Image generator produces a real 900x600 PNG using layered sky/ocean/shared-island/movement illustrations and a compact factual stats band. These are NEW *programmatic fallback scenic layers*, not a falsely claimed 1:1 re-render or cropped image of the approved source board. Locked child character/Visual ID is never redrawn. Detailed original share artwork asset binding and side-by-side pixel/design approval are still OPEN.
- Show image and caption preview first. On a SECOND real tap, synchronously invoke \`navigator.share({files:[pngFile],text:caption,title:'Ready & Set'})\`. The two-tap path preserves transient user activation after asynchronous Canvas creation.
- Also provide explicit \`문구 복사\`, \`이미지만 공유\`, \`이미지 저장\`, \`닫기\` controls. Do not claim Kakao message delivery on native share Promise resolution; app simply passes data to OS.
- iOS Safari/WebKit has historically omitted either files or text on combined shares even when canShare passes; user-copy + image-only is a practical fallback. This still needs real-device Kakao share verification, not a claim of guarantee.
- HTTPS (or localhost) required for real native share. Localhost Chromium fake-native-share test is not an iPhone+Kakao validation.

## Traced code and tests
- \`src/share/share-golden-truth-runtime.js\`: only the read-only data/consent/state contract.
- \`src/views/share-card-runtime.js\`: actual illustrated PNG, preview, synchronous native share entry, manual fallback.
- \`app.js\`, profile controller/view and \`index.html\`: actual UI wiring; no new share theme authority.
- \`tests/share-golden-truth.test.js\`: truthful state and privacy checks.
- \`tests/share-golden-native.spec.js\`: DOM, 900x600 image, actual File+caption payload, real button transient activation, incomplete result, no forged stars, missing receipt HOLD, four synthetic PNGs.
- \`.github/workflows/share-golden-native.yml\`: bounded CI plus synthetic screenshot artifact. Do not treat synthetic data as a real child record.

## OPEN / no silent release
- Exact owner-approved individual share image/layer and Character Visual ID bindings are not presently in the Ready assets repo. Programmatic fallback scenic layers are a bounded implementation, not a new global design authority. Compare the four CI PNGs with approved examples before finalizing visual parity.
- Live approved Character Visual ID derivative URL/CORS/consent/member scope; live award receipt schema integration.
- Real iPhone Safari \`navigator.share(files+text)\` -> user chooses KakaoTalk, verify both image and caption actually appear; test text-first fallback.
- Actual app PWA install/offline, camera and microphone, local-vs-remote storage, private family context.
- Full Ready cross-app integration and Hide evidence/Planner authority regression gate remain separate.
- Keep PR stacked on #117 and Draft. No existing source/master overwritten; no main merge or Netlify deploy without explicit approval.
