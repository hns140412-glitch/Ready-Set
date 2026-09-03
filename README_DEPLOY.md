# Ready & Set PWA — Deployable UI Build

- MASTER: REV_06
- App: 0.9.0
- Schema: 3
- Cache: ready-set-v090
- Status: PRE-RC (실기기/실배포 URL 검증 전)

## 배포
GitHub Pages / Netlify 같은 HTTPS 정적 호스팅 루트에 이 폴더 내용을 그대로 배포합니다.
GitHub Pages repository subpath에서도 동작하도록 상대경로를 사용합니다.

## 구현된 Core
- Peach/Cream HOME, Mission, Result/Settings
- Yellow Focus + Full Analog Clock + Dark Control Panel
- Multi Mission bottom sheet
- conditional REC (영어 · 문장 녹음)
- timestamp 기반 Timer / Pause(issue) / Resume
- session localStorage 복구
- MediaRecorder 실제 녹음 + MIME 감지
- M4A 가능 시 .m4a, 아니면 원본 WebM 유지 (확장자 위장 금지)
- audio blob IndexedDB 저장
- Dynamic share card canvas renderer + Native Share / image fallback
- Avatar photo local preview + 4 style selections
- History / local calendar record
- PWA manifest / service worker / offline shell

## Online Enhancement / UNKNOWN
- 생성형 2.5D photo→avatar backend
- AI Reading Coach 실제 음성 분석/TTS
- Voice Cleanup 서버 처리
- WebM→M4A 변환 backend
- Google Calendar OAuth
- 실제 KakaoTalk 파일 공유 호환성

위 항목은 실제 서비스/실기기 검증 전 PASS로 표기하지 않습니다.
