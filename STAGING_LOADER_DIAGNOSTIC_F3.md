# Ready Stage F3 loader diagnostic

Status: STAGING ONLY
Date: 2026-09-08

Observed on iPhone: child and `?role=parent` Preview both rendered the same pre-Stage-F home. This means source implementation existed but the runtime Stage F patch was not active on-device.

Correction:
- force cache-busted staging module loads
- require `window.ReadyStageF` after load
- use Service Worker network requests with `cache: no-store` before cache fallback
- keep Production unchanged

Expected visible gate:
- CHILD: home mission label becomes `오늘 탐험 정하기`; standalone pre-share home button hidden
- PARENT: mission labels become `숙제 입력 · 확인`; no child exploration setup

`SOURCE IMPLEMENTED != DEVICE RUNTIME VERIFIED`
