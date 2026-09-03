# Ready & Set REV_06 PWA Validation Report — App 0.9.2

## Release State
- **PRE-RC / DEPLOYABLE LIVE-VALIDATION BUILD**
- MASTER: `Ready_Set_Ui_Master_Logic_REV_06.md`
- APP_VERSION: `0.9.2`
- SCHEMA_VERSION: `5`
- CACHE_VERSION: `ready-set-v092`
- Static/structural validation: **98 / 98 PASS**
- Actual Chromium browser run in this execution environment: **UNKNOWN — browser navigation is blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`)**
- Real iPhone/Android and production HTTPS URL: **UNKNOWN / PENDING LIVE TEST**

## Regression Fixes from uploaded update
- **PASS — BGM restored:** original bundled WAV assets `piano / nature / water / lofi` are present, valid and non-silent. Mission, Focus, Settings all expose selection; OFF is available.
- **PASS — BGM routing restored:** selected BGM is bound to the active session; Pause and Recording fade it out; Resume and return from Recording fade it back in.
- **PASS — Guide visibility restored:** guide PNG assets are mapped into Home, Focus, Settings, Recording Intro, Recording Duo and Result.
- **PASS — Guide function expanded:** 3 guide choices, name recommendation/direct name, 4 voice styles, preview speech synthesis, smart-random guest history.
- **PASS — Recording Duo traceability:** guest is saved to the actual recording session and only appears in Result/Share when a Duo session actually occurred.
- **PASS — Conditional REC:** visible only when `영어 · 문장 녹음` is selected.
- **PASS — Pause reason flow:** reason selection and Issue time remain separate from focus time.
- **PASS — Mission voice input:** browser SpeechRecognition/WebKit fallback restored without making it mandatory.
- **PASS — original M4A rule:** browser output is MIME-inspected; WebM is never renamed to `.m4a`.
- **PASS — MASTER filename rule:** no spaces, `%`, or `%20`; package master is `Ready_Set_Ui_Master_Logic_REV_06.md`.

## MASTER-aligned UI / Function Gates
### UI
- PASS: Core element #homeGuidePortrait
- PASS: Core element #settingsGuidePortrait
- PASS: Core element #focusGuideMini
- PASS: Core element #recIntroGuide
- PASS: Core element #duoMainGuide
- PASS: Core element #duoGuestGuide
- PASS: Core element #resultGuidePortrait
- PASS: Core element #resultGuestPortrait
- PASS: Core element #soundSheet
- PASS: Core element #bgmPlayer
- PASS: Core element #recBtn
- PASS: Core element #pauseSheet
- PASS: Core element #voiceTaskBtn
- PASS: CSS rule env(safe-area-inset-top
- PASS: CSS rule env(safe-area-inset-bottom
- PASS: CSS rule @media(max-width:360px)
- PASS: CSS rule @media(prefers-reduced-motion:reduce)

### Guide
- PASS: lumi guide asset non-blank — (0, 255)
- PASS: pico guide asset non-blank — (0, 255)
- PASS: mori guide asset non-blank — (0, 255)
- PASS: CSS maps lumi guide PNG
- PASS: CSS maps pico guide PNG
- PASS: CSS maps mori guide PNG

### BGM
- PASS: piano WAV valid/non-silent — 18.0s RMS=3597.6
- PASS: nature WAV valid/non-silent — 18.0s RMS=8884.9
- PASS: water WAV valid/non-silent — 18.0s RMS=2770.6
- PASS: lofi WAV valid/non-silent — 18.0s RMS=6260.7

### Logic
- PASS: Conditional REC — s.selected.includes('영어 · 문장 녹음')
- PASS: BGM source map — '집중 피아노':'./assets/bgm-piano.wav'
- PASS: BGM fade out — fadeAudio(0,220)
- PASS: BGM resume fade — resumeBgm
- PASS: Pause reason — data-pause-reason
- PASS: MediaRecorder — new MediaRecorder
- PASS: MIME m4a honesty — ext=/audio\/(mp4|m4a)/.test(type)?'m4a':'webm'
- PASS: IndexedDB audio — indexedDB.open('readyset_audio'
- PASS: Guide smart guest — guestHistory
- PASS: Guide voice — SpeechSynthesisUtterance
- PASS: Dynamic share Canvas — document.createElement('canvas')
- PASS: Guest share condition — r?.recordingDone&&r?.guestType
- PASS: Timestamp timer — now-s.startAt
- PASS: Issue separation — elapsed-issue
- PASS: Session persistence — localStorage.setItem('readyset_state'

### Data
- PASS: Schema migration to 5
- PASS: Old sound name migration

### PWA
- PASS: Manifest standalone
- PASS: Manifest relative start/scope
- PASS: Manifest name consistent
- PASS: Icon 192x192 — (192, 192)
- PASS: Icon 512x512 — (512, 512)
- PASS: SW core index.html
- PASS: SW core styles.css
- PASS: SW core app.js
- PASS: SW core manifest.webmanifest
- PASS: SW core VERSION.json
- PASS: SW core Ready_Set_Ui_Master_Logic_REV_06.md
- PASS: SW core assets/icon-192.png
- PASS: SW core assets/icon-512.png
- PASS: SW core assets/guide-lumi.png
- PASS: SW core assets/guide-pico.png
- PASS: SW core assets/guide-mori.png
- PASS: SW core assets/bgm-piano.wav
- PASS: SW core assets/bgm-nature.wav
- PASS: SW core assets/bgm-water.wav
- PASS: SW core assets/bgm-lofi.wav
- PASS: SW core index.html
- PASS: SW core index.html
- PASS: SW cache version
- PASS: SW old cache cleanup
- PASS: SW navigation fallback

### Version
- PASS: MASTER revision trace — {'product': 'Ready & Set', 'masterRevision': 'REV_06', 'masterFile': 'Ready_Set_Ui_Master_Logic_REV_06.md', 'appVersion': '0.9.2', 'schemaVersion': '5', 'cacheVersion': 'ready-set-v092', 'releaseStatus': 'PRE_RC_LIVE_VALIDATION_PENDING', 'notes': ['BGM restored with original bundled audio assets; static audio integrity validated', 'Visible Main Guide assets integrated across Home/Focus/Recording/Result', 'Guide name recommendations and voice styles added', 'Pause reason sheet restored', 'Mission voice input fallback restored', 'Guest guide linked to actual recording session and result/share card']}
- PASS: App/schema/cache trace

### Artifact
- PASS: No spaces or percent signs in package filenames
- PASS: MASTER filename exact
- PASS: Required file index.html
- PASS: Required file styles.css
- PASS: Required file app.js
- PASS: Required file manifest.webmanifest
- PASS: Required file sw.js
- PASS: Required file VERSION.json
- PASS: Required file README_DEPLOY.md
- PASS: Required file VALIDATION_REPORT.md
- PASS: Required file .nojekyll
- PASS: Required file Ready_Set_Ui_Master_Logic_REV_06.md
- PASS: Required file assets/icon-192.png
- PASS: Required file assets/icon-512.png
- PASS: Required file assets/bgm-piano.wav
- PASS: Required file assets/bgm-nature.wav
- PASS: Required file assets/bgm-water.wav
- PASS: Required file assets/bgm-lofi.wav
- PASS: Required file assets/guide-lumi.png
- PASS: Required file assets/guide-pico.png
- PASS: Required file assets/guide-mori.png
- PASS: Local ref ./manifest.webmanifest
- PASS: Local ref ./assets/icon-192.png
- PASS: Local ref ./assets/icon-192.png
- PASS: Local ref ./styles.css
- PASS: Local ref ./app.js

### Code
- PASS: JavaScript syntax

## Runtime / Device Validation Still Required Before Release PASS
- PENDING LIVE TEST: iPhone Safari browser
- PENDING LIVE TEST: iPhone installed PWA
- PENDING LIVE TEST: Android Chrome browser
- PENDING LIVE TEST: Android installed PWA
- PENDING LIVE TEST: real microphone permission / interruption / lock-screen return
- PENDING LIVE TEST: actual Native File Share and KakaoTalk share
- PENDING LIVE TEST: production HTTPS URL offline launch
- PENDING LIVE TEST: service worker update from previous cache version with existing local data preserved
- PENDING LIVE TEST: actual browser M4A/AAC availability matrix
- PENDING ONLINE ENHANCEMENT: generative photo→2.5D avatar backend, AI Reading Coach, Voice Cleanup backend, Google Calendar OAuth.

## Gate Decision
`Deploy Success ≠ Release PASS` and `Local/Static PASS ≠ Production PASS` remain enforced. This ZIP is appropriate for HTTPS deployment and live validation, but must not be labeled Release PASS until the pending live-device and production-URL checks are completed.
