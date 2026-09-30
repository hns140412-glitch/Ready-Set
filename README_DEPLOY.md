# Ready & Set PWA — 1.0.0-alpha.1 r3 Deployment Candidate

- Product authority: `READY_SET_CANONICAL_PRODUCT_CONTRACT.md`
- Runtime: `ready-runtime-v07`
- App: 1.0.0-alpha.1
- Schema: 5
- Release / Cache: `ready-set-1.0.0-alpha.1-r3`
- Central Learning basis: `TAKY@6efa6067be33ca2a04261d5abe3cd7501e90098e`
- Historical UI references: `Ready_Set_Ui_Master_Logic_REV_06.md`, `REV_07.md`
- Status: MAIN MERGED / CENTRAL HOST CONFIG REQUIRED / LIVE DEPLOYMENT VALIDATION BLOCKED

## 이번 수정에서 복원/보완한 항목
- 기존 Peach / Cream HOME, Mission, Result 계열 유지
- Yellow Focus + Full White/Ivory Analog Clock 유지
- 실제 번들 BGM 4종 + OFF 선택, Mission/Focus/Settings에서 변경 가능
- Focus 시작 시 선택 BGM 재생, Pause/Recording 시 Fade-out, Resume/Return 시 Fade-in
- Main Guide가 Home / Focus / Recording Intro / Recording Review / Result에 실제 이미지로 노출
- Main Guide 3종 선택 + 이름 추천/직접 입력 + 4종 음성 성격 선택
- Recording 종료 후 최근 Guest를 피하는 Smart Random Guest Duo
- 영어 · 문장 녹음 Mission에서만 `남은 시간 | REC | 목표 시간`
- Pause reason 선택: 화장실 / 물·간식 / 도움 필요 / 준비물 찾기 / 컨디션 조절 / 기타
- Task 텍스트 입력 + 브라우저 지원 시 음성 입력
- timestamp 기반 Focus/Issue timer + active session restore
- 실제 MediaRecorder + MIME 검사 + IndexedDB blob 저장
- WebM을 .m4a로 이름만 변경하지 않음
- Dynamic Share Card + 실제 Recording Duo가 있던 결과에만 Guest 반영
- PWA manifest / service worker / relative paths / offline core

## 배포
GitHub Pages 또는 Netlify 같은 HTTPS 정적 호스팅 루트에 ZIP 내부 파일을 그대로 배포합니다.
Repository subpath에서도 동작하도록 모든 core path는 상대경로입니다.

## Release PASS 전 남은 실제 환경 검증
- iPhone Safari + 설치형 PWA
- Android Chrome + 설치형 PWA
- 실제 마이크 권한/중단/잠금 복귀
- 실제 Native Share / KakaoTalk file share
- production HTTPS URL에서 Install / Offline / Cache Update
- 실제 M4A가 필요한 기기의 codec/container 결과

위 항목은 실제 기기/실배포 URL 검증 전 PASS로 표시하지 않습니다.

## Central Learning production bootstrap

The browser now loads `config.js` and `ready-central-browser-bootstrap-v01.js`.
Central Learning stays **fail-closed** until all of the following are present:

1. `TIMEATTACK_CONFIG.CENTRAL_EVIDENCE_ENDPOINT`
   - explicit HTTPS URL
   - path must be the audited central evidence endpoint
2. `TIMEATTACK_CONFIG.CENTRAL_DECISION_ENDPOINT`
   - explicit HTTPS URL
   - path must be `/api/learning/decision`
3. `window.ReadyCentralAuthHost`
   - `currentSession()`: returns an independently verified central session
   - `idToken()`: returns the Google OIDC ID token used as the explicit Bearer credential for TAKY central verification; an OAuth access token is not accepted
   - optional `selectedMemberId()`: required when the active member cannot safely default to the authenticated child
4. The central session must satisfy `ReadyCentralEvidenceSessionV01`:
   - `issuer === "GOOGLE_OIDC_VERIFIED_SERVER"`
   - family id matches the Ready family
   - selected child is in `authorized_member_ids`
   - session has a non-expired `expires_at`

Netlify Identity session/cookie authentication is intentionally **not** treated as the central bearer credential.
If config/auth is missing, Ready continues local operation and exposes
`window.ReadyCentralBootstrapStatus` with a `DISABLED_*` reason instead of silently pretending the central roundtrip is active.

Current deployment status: central endpoints/auth host are not yet configured in source; live HTTPS validation remains required.
