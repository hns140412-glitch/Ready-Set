# Ready & Set Ui Master Logic — REV_06

# MASTER FILE NAMING RULE — HARD LOCK

MASTER 및 배포 산출물의 실제 파일명에는 공백(space)과 퍼센트 기호(`%`)를 사용하지 않는다.

공식 MASTER 파일명 형식:

`Ready_Set_Ui_Master_Logic_REV_숫자.md`

예:
`Ready_Set_Ui_Master_Logic_REV_06.md`

규칙:
- 공백 금지
- `%` 금지
- URL 인코딩된 `%20` 형태를 공식 파일명으로 사용 금지
- 단어 구분은 `_` 사용
- Revision은 `REV_01`, `REV_02` 형식으로 2자리 유지
- 이후 생성하는 MASTER, 배포 ZIP, 검증 보고서 등에도 동일한 No-Space / No-Percent 원칙 적용
- 사용자에게 제공하는 다운로드 파일 역시 이 규칙을 지켜야 한다.


> **Document Status:** FORMAL BASELINE / SOURCE OF TRUTH / PRODUCT·UI·GUIDE·RECORDING·SHARE INTEGRATED MASTER  
> **Official File Name:** `## Ready & Set Ui Master Logic REV_06 ##.md`  
> **Revision:** REV_06  
> **Date:** 2026-09-02  
> **Product / Brand:** **Ready & Set**  
> **Core Focus Experience:** **타임어택**  
> **Platform:** Mobile Web App / Installable PWA  
> **Primary User:** 초등학교 5학년 중심, 가족과 함께 사용하는 개인용 과제·집중 앱  
> **Previous Baseline:** `## Time Attack Ui Master Logic REV_02 ##.md`  
> **Comparison Masters:** `Snap & Pop Ui Master Logic REV_06`, `ZPD Word Ui Master Logic REV_05`  
> **Purpose:** 지금까지 확정된 Ready & Set의 과제 설정·타임어택·기록·공유 골조를 보존하면서, 복수 과제 선택, 감각적인 Full Clock, 작전 전/후 공유, 영어 문장 녹음, Voice Preservation, Main Guide + Random Guest Guide, Confidence-first Reading Coach, 제출 파일 공유를 하나의 폐쇄형 MASTER 시스템으로 통합한다.

---

# 0. MASTER DECLARATION

Ready & Set은 단순한 카운트다운 앱이 아니다.

> **아이 스스로 해야 할 일을 고르고, 시작할 준비를 하고, 집중해서 실행하고, 중간에 흔들려도 다시 돌아오고, 끝낸 경험을 기록하며 “나는 내가 정한 일을 해낼 수 있다”는 확신을 쌓는 앱이다.**

REV_03의 핵심은 기능 수를 늘리는 것이 아니라 다음 경험을 하나로 연결하는 것이다.

```text
READY
오늘 할 일을 고른다.

→ SET
목표와 시간을 정한다.

→ SUPPORT
가족에게 센스 있게 응원을 요청한다.

→ GO
타임어택으로 집중한다.

→ SPECIAL MISSION
필요하면 영어 문장 녹음 작전으로 진입한다.

→ GUIDE
길잡이가 아이의 실제 작은 성장을 발견한다.

→ RETURN
같은 타임어택으로 정확히 돌아온다.

→ COMPLETE
작전을 끝낸다.

→ REPORT
결과를 따뜻하고 위트 있게 기록·공유한다.

→ NEXT
다음 작전을 다시 시작할 자신감을 남긴다.
```

---

# 1. SOURCE OF TRUTH PRIORITY — HARD LOCK

우선순위:

1. **검증 통과한 최신 Ready & Set MASTER Revision**
2. MASTER 절차를 통해 승인된 사용자 변경사항
3. 기능적으로 정상인 기존 구현
4. 승인된 UI / Visual Reference
5. 신규 시안
6. 개별 아이디어

원칙:

- 구현물이 MASTER와 다르다는 이유로 구현물이 자동 정답이 되지 않는다.
- 새 아이디어가 좋다는 이유로 기존 MASTER를 즉시 대체하지 않는다.
- 새 UI가 더 화려하다는 이유로 정상 기능을 삭제하지 않는다.
- 기존 구현이 동작한다는 이유만으로 기존 시각 표현까지 승인된 것으로 간주하지 않는다.
- MASTER 자체에 문제가 발견되면 구현에 맞춰 몰래 바꾸지 않고 정식 Revision으로 수정한다.

---

# 2. OFFICIAL FILE / VERSION RULE — HARD LOCK

앱 공식명이 Ready & Set으로 확정되었으므로 이후 MASTER 파일은 다음 형식을 사용한다.

```text
## Ready & Set Ui Master Logic REV_03 ##.md
## Ready & Set Ui Master Logic REV_04 ##.md
## Ready & Set Ui Master Logic REV_05 ##.md
...
```

규칙:

- 이전 Revision은 보존한다.
- Revision은 기능·상태·데이터·핵심 UI·브랜드 철학 변경 시 증가한다.
- 파일명을 임의로 `Final`, `Final2`, `최종최종` 등으로 만들지 않는다.
- `MASTER_LOGIC_REV ↔ APP_VERSION ↔ SCHEMA_VERSION ↔ CACHE_VERSION` 관계를 추적 가능하게 한다.

---

# 3. MASTER CONTROL LOOP — HARD LOCK

```text
현재 MASTER 확인
→ 신규 요구사항 / 아이디어 / 오류 / 실사용 피드백 수집
→ 기존 PWA / UI / 데이터 / 상태 / 공유 / 음성 구조와 전체 대조
→ 충돌 / 중복 / 후퇴 / 누락 / Design Drift 검사
→ 필요 시 사례 MASTER / 상용 UX / 기술 패턴 검토
→ ADOPT / ADJUST / HOLD / REJECT
→ 채택 항목 MASTER 후보 통합
→ 전체 사용자 흐름 재최적화
→ 논리 / 상태 / 데이터 / UX / 기술 오류 검증
→ MASTER SELF-VALIDATION
→ FAIL이면 MASTER 수정 단계로 복귀
→ MASTER PASS
→ UI 시안 / 구현
→ 실제 생성·렌더링·동작 결과를 MASTER와 대조
→ RESULT SELF-VALIDATION
→ REGRESSION GATE
→ FAIL이면 수정 / 재구현 / 재검증
→ DEPLOYMENT GATE
→ PASS본만 사용자에게 제시
→ 신규 피드백
→ 다음 Revision
```

### 되돌림 규칙

- MASTER 내부 오류 발견 → 구현 금지, MASTER 수정.
- 구현이 MASTER와 불일치 → 원칙적으로 구현 수정.
- 실사용 결과로 MASTER 자체 문제 발견 → 신규 문제 등록 후 다음 Revision.
- 기능이 동작한다고 MASTER 준수로 간주하지 않는다.
- MASTER가 논리적으로 맞다고 실제 구현도 맞다고 간주하지 않는다.

---

# 4. NO USER-AS-QA — HARD LOCK

사용자는 다음을 반복적으로 찾아주는 QA 담당자가 아니다.

- 홈 디자인 후퇴
- 타이머 계산 오류
- 시계 디자인 회귀
- Safe Area 침범
- REC 버튼 누락
- 녹음 중 BGM 혼입
- 마이크/녹음 실패 처리 누락
- 제출 파일명 오류
- 가짜 M4A 생성
- 공유 이미지 누락
- 공유 실패가 기록 손실로 이어짐
- Recording Event 후 기존 타이머 초기화
- AI 대기시간이 Focus/ISSUE로 잘못 누적
- 캐릭터 대사가 아이를 평가하거나 놀림
- 서비스워커 stale cache
- migration 실패
- 기존 정상 기능 삭제

가능한 범위에서 내부 Self-Validation으로 먼저 발견·수정한 뒤 통과 결과만 제시한다.

---

# 5. PROMPT COMPLIANCE ≠ RESULT COMPLIANCE — HARD LOCK

문서나 프롬프트에 적혀 있다는 이유만으로 PASS하지 않는다.

예:

- `Full Clock`이라고 적었지만 실제 시계가 하단에서 크게 잘림 → FAIL
- `이미지+텍스트 공유`라고 적었지만 실제로 텍스트만 전달 → FAIL
- `REC 버튼 중앙`이라고 적었지만 터치 영역이 지나치게 작음 → FAIL
- `BGM OFF`라고 적었지만 실제 녹음 파일에 BGM이 들어감 → FAIL
- `같은 타이머로 복귀`라고 적었지만 startAt이 초기화 → FAIL
- `.m4a` 파일명이나 실제 MIME/container가 다른 포맷 → FAIL
- `길잡이가 응원형`이라고 적었지만 실제 대사가 점수·평가 중심 → FAIL
- `Safe Area`라고 적었지만 iPhone notch/Dynamic Island 영역 침범 → FAIL

**Ambiguous = FAIL.**

---

# 6. CHANGE GOVERNANCE

## 6.1 LOCKED CORE

임의 변경 금지:

- Ready & Set 브랜드
- 타임어택 핵심 집중 루프
- HOME 승인 시각 언어
- Focus Yellow identity
- 감각적인 Full Analog Clock
- timestamp 기반 시간 계산
- Pause / ISSUE / System Wait 분리
- 복수 Mission 선택
- Pre-Mission / Post-Mission 공유 분리
- 이미지 + 짧은 텍스트 공유
- 영어 문장 녹음 Special Event
- 녹음 중 BGM OFF
- Original Recording 보존
- Confidence-first Reading Guide
- Main Guide + Random Guest Guide
- 아이를 장난의 대상으로 만들지 않는 Duo 규칙
- 실제 파일 포맷 검증
- Interrupt / Resume
- PWA / Offline / Migration
- MASTER / RESULT / REGRESSION / DEPLOYMENT Gate

## 6.2 CONTROLLED FLEX

실사용 검증으로 조정 가능:

- 세부 과제 리스트
- Popup / Bottom Sheet 세부 디자인
- Focus Clock 크기·재질·shadow
- Guide 캐릭터 종/외형
- Guide 이름 후보
- Personality 강조 비율
- Guest Smart Random weight
- BGM Fade duration
- AI 코칭 길이
- Share Card 세부 레이아웃
- Result Reaction threshold
- Recording waveform 스타일
- Voice Cleanup 강도
- 목표시간 프리셋

## 6.3 EXPANSION / HOLD

핵심 안정화 이후 검토:

- 리더보드
- 타 사용자와 경쟁
- 고급 보상 경제
- 캐릭터 가챠
- 공개 SNS
- 복잡한 성장 점수
- 자동 학교 제출 플랫폼 연동
- 복잡한 통계 대시보드
- 과도한 미니게임

---

# 7. REV_03 ADOPT / ADJUST / HOLD / REJECT

## ADOPT

- 앱 공식명 `Ready & Set`
- 타임어택을 Core Focus Experience로 재정의
- HOME 보존
- 세부 과제 Popup / Bottom Sheet
- 단일 + 복수 선택
- 영어 `문장 녹음` Special Mission
- 남은 시간과 목표 시간 중앙의 Red REC
- 녹음 Intro Popup
- 전용 Recording Event 화면
- BGM 자동 Fade-out
- Recording 후 같은 Timer Session 복귀
- Pre/Post Share 분리
- Share Card Image + Short Caption
- Main Guide 캐릭터 / 이름 추천 / 직접 이름 / 음성 선택
- Random Guest Guide
- `친구 좀 잡아올게!` 코믹 Intro
- Duo Coaching
- Confidence > Pronunciation
- Voice Preservation Cleanup
- Original / Clean Analysis Copy 분리
- 날짜 기반 파일명
- Guide Voice + typed dialogue
- System Wait 분리

## ADJUST

- `작전 목표` / `작전 완료 보고서`는 내부 기능명으로 유지하되 화면 제목은 더 위트 있게 사용.
- `AI Reading Coach`는 내부 기술 명칭으로 두고 화면에서는 `내 영어 길잡이` 계열 사용.
- `ISSUE!!!`는 `잠깐 멈춤 / 방해 시간 / 멈춘 시간`으로 완화.
- 결과 판정은 단순 속도보다 완료·집중·목표대비·중단 정도를 함께 반영.
- Guest Random은 완전 랜덤이 아니라 반복 방지 Smart Random.

## HOLD

- 캐릭터 레벨/성장 경제
- 고급 음성 성장 그래프
- 복잡한 부모 대시보드
- 소셜 경쟁

## REJECT

- 특정 상업 캐릭터 외형/고유 대사 복제
- Focus Clock 강제 하단 Crop
- `타임어택`을 앱 공식 이름으로 사용
- 녹음 중 BGM 유지
- 녹음 시간을 ISSUE로 처리
- AI 대기시간을 아이의 실패/방해로 계산
- 아이의 부족함을 캐릭터 코미디 소재로 사용
- 발음 점수 중심 AI
- 확장자만 `.m4a`로 바꾸는 가짜 변환
- 공유를 다시 텍스트 전용으로 퇴행

---

# 8. PRODUCT PRIORITY — HARD LOCK

Ready & Set의 우선순위:

```text
스스로 시작하기
→ 실제 집중 유지
→ 끝까지 완료하기
→ 중간에 흔들려도 다시 돌아오기
→ 시간 감각 얻기
→ 자기 성장 발견
→ 가족과 긍정적으로 공유
→ 반복 사용의 재미
→ 부가 통계 / 장식 / 보상
```

모든 기능은 다음 질문을 통과해야 한다.

> **이 기능이 아이가 스스로 시작하고, 더 편안하게 집중하고, 다시 돌아오고, 끝낸 경험에 자신감을 갖게 하는가?**

아니라면 Core에 넣지 않는다.

---

# 9. BRAND / COPY SYSTEM

## 9.1 Official Naming

- Brand: **Ready & Set**
- Focus Experience: **타임어택**
- Mission Setup: 내부 `Mission Setup`
- Pre Share: 내부 `Pre-Mission Share`
- Result: 내부 `Mission Report`
- Recording: 내부 `Recording Event`
- Reading AI: 내부 `AI Reading Guide`

## 9.2 User-facing Titles

| 상황 | 권장 제목 |
|---|---|
| 과제 선택 | **어떤 과제에 도전할까요?** |
| 설정 시작 | **오늘, 뭐부터 해볼까?** |
| 설정 완료 | **오늘의 작전, 접수!** |
| 시작 전 공유 | **작전 개시 전, 응원 요청!** |
| Focus | **타임어택** |
| Pause | **잠깐! 작전 정지** |
| Resume | **다시, 작전 속으로** |
| Complete | **무사 귀환!** |
| Result | **오늘의 작전 보고서** |
| History | **작전 기록실** |
| Calendar | **작전 일지** |
| Recording | **영어 녹음 작전** |
| Record Ready | **목소리 준비됐나요?** |
| AI Wait | **길잡이들이 듣는 중…** |
| Coaching | **오늘 목소리, 어땠냐면…** |
| Retry | **한 번 더 가볼까?** |
| Finalize | **좋아, 이걸로 제출!** |
| File Ready | **영어 작전, 제출 준비 완료!** |

### Copy Rule

> **시스템은 정확하게, 캐릭터는 재미있게.**

기능 버튼은 명확해야 한다.

캐릭터가 위트·감정·응원을 담당한다.

---

# 10. HOME — PRESERVE LOCK

현재 승인된 HOME은 재디자인 대상이 아니다.

보존:

- Peach / Coral / Cream
- Warm Premium tone
- 밝은 가족용 앱 인상
- Hero Stopwatch
- 주요 메뉴 흐름
- 재능 / 학교 / 영어
- Bottom Navigation
- Safe Area
- 과도하지 않은 card rounding
- 고급스러운 typography

금지:

- HOME 전체를 Yellow Focus 스타일로 통일
- generic white dashboard
- emoji 중심 icon
- 유아용 장난감 UI
- iOS status bar 직접 그리기

---

# 11. HOME MULTI-MISSION SELECTOR — HARD LOCK

HOME의 `어떤 과제에 도전할까요?` 영역:

```text
재능 / 학교 / 영어
```

1차 카테고리 Tap 시 Popup 또는 Bottom Sheet.

## 11.1 재능

초기 후보:

- 국어
- 한자
- 피자
- 수학
- 연산
- 기타

## 11.2 학교

초기 후보:

- 독서
- 글쓰기
- 숙제
- 준비물
- 기타

## 11.3 영어

초기 후보:

- 라이팅
- **문장 녹음**
- 단어 외우기
- 기타

세부 항목은 CONTROLLED FLEX이며 추후 사용자 설정 가능.

## 11.4 Selection Rule

- 단일 선택 가능
- 복수 선택 가능
- 서로 다른 카테고리 교차 선택 가능
- 동일 항목 중복 금지
- 선택된 항목은 Mission Chip으로 표시
- Chip에서 삭제 가능
- 순서 재배치 기능은 optional
- 복수 선택했다고 Timer를 여러 개 만들지 않는다

예:

```text
[재능 · 국어 ×]
[학교 · 독서 ×]
[영어 · 문장 녹음 ×]
```

---

# 12. SETUP / MISSION BRIEFING

기본 흐름:

```text
과제 선택
→ 세부 과제 내용
→ 목표시간
→ BGM
→ 오늘의 작전 확인
→ 작전 개시 전 공유(optional)
→ START
```

기존 지원:

- 10분
- 15분
- 25분
- 직접 입력
- 자유 과제 텍스트
- 음성 과제 입력 fallback
- BGM 선택

복수 Mission의 목표시간은 기본적으로 전체 Session 기준.

---

# 13. PRE-MISSION SHARE — HARD LOCK

시작 전 공유는 결과 공유와 다른 감정이다.

목적:

```text
출동
→ 가족에게 알림
→ 응원 요청
→ 시작 에너지
```

Primary Title:

> **작전 개시 전, 응원 요청!**

Card Example:

```text
READY & SET

작전 개시 전, 응원 요청!

오늘의 작전
수학 · 연산 20문제
목표 25분

Guide:
"준비는 끝났는데 말이죠…"
"응원 보급이 조금 필요합니다~~~~!"
```

Short Caption:

> `25분 타임어택 출동합니다. 응원 한 스푼 부탁해요!`

Visual:

- Warm Peach / Cream
- Guide Character
- 작전 브리핑 motif
- 카카오톡 메시지 썸네일에서도 readable
- 과도한 상세 정보 금지
- TIME SAVE / 결과 평가 금지

---

# 14. FOCUS / TIME ATTACK VISUAL MASTER

Focus는 HOME과 감정적으로 구별된다.

```text
HOME = Warm / Planning
FOCUS = Bold / Yellow / Concentrated
RESULT = Warm / Relief / Achievement
```

우선순위:

```text
1. 타임어택 Identity
2. Full Analog Clock Hero
3. Current Mission
4. Remaining Time
5. REC Special Action
6. Target Time
7. Pause / Complete
8. BGM / secondary stats
```

Dark Panel이 Clock보다 먼저 보이면 FAIL.

---

# 15. FULL CLOCK HERO — HARD LOCK

REV_02의 Crop 규칙은 폐기한다.

## 15.1 New Master

> **Full Clock / Hero Object / Editorial Quality**

필수:

- 시계 전체 형태가 화면 안에서 완결.
- 강제 하단 Crop 금지.
- White / Ivory body.
- thin / refined rim.
- black readable numerals.
- precise hands.
- subtle depth.
- natural shadow.
- clean material.
- generic wall-clock product image 금지.
- thick black frame 금지.
- excessive chrome / gloss 금지.
- 앱을 위해 디자인된 감각적인 object.
- 실제 움직이는 analog object.

짧은 화면에서는:

1. secondary decoration 감소
2. spacing 감소
3. panel padding 감소
4. typography 미세 조정
5. clock scale 조정

순으로 해결한다.

**Crop을 기본 해법으로 사용하지 않는다.**

---

# 16. FOCUS TIME PANEL + REC BUTTON

기본:

```text
남은 시간                  목표 시간
24:52                       25:00
```

영어 `문장 녹음` 포함:

```text
남은 시간        ● REC        목표 시간
24:52                         25:00
```

## REC Rule

- Remaining / Target 사이 중앙.
- Red Dot motif.
- 약 44×44 CSS px 이상 터치 영역 권장.
- `문장 녹음` Mission이 있을 때만 표시.
- accessibility label `문장 녹음`.
- 녹음 완료 후 `REC ✓` 또는 완료 상태.
- 색상만으로 상태 전달 금지.
- Focus 화면의 주요 시각 균형을 깨지 않는다.

---

# 17. TIMER CORE — PRESERVE / HARD LOCK

```text
totalChallenge = now/endAt - startAt
issueTime = accumulatedPausedIssueTime
systemWait = accumulatedSystemWaitTime
focusTime = totalChallenge - issueTime - systemWait
remaining = targetTime - focusTime
delta = focusTime - targetTime
```

표시:

```text
remaining >= 0 → 남은 시간
remaining < 0 → 목표시간 돌파 / 초과 시간
```

규칙:

- setInterval count로 실제 시간을 계산하지 않는다.
- timestamp delta 사용.
- background / visibility 복귀 시 재계산.
- activeSession snapshot.
- server time 가능 시 사용, 실패 시 local fallback.
- Recording Event 진입 전후에도 동일 sessionId 유지.

---

# 18. MAIN STATE MACHINE — HARD LOCK

```text
IDLE
→ READY
→ RUNNING

RUNNING
├─ PAUSE_REQUEST
│  → PAUSED
│  → RESUME
│  → RUNNING
│
├─ RECORDING_INTRO
│  → RECORD_READY
│  → RECORDING
│  → RECORD_REVIEW
│  → CLEANUP_OPTIONAL
│  → AI_SYSTEM_WAIT
│  → GUIDE_DUO_COACHING
│  → RETRY | FILE_FINALIZE
│  → FILE_SHARE
│  → RETURN_TO_FOCUS
│  → RUNNING
│
└─ COMPLETE
   → RESULT
```

Dead-end state 금지.

---

# 19. PAUSE / ISSUE / SYSTEM WAIT SEPARATION

## PAUSE / ISSUE

실제 과제 중단:

- 화장실
- 물 / 간식
- 준비물
- 도움 필요
- 컨디션
- 기타

사용자-facing:

- 잠깐 멈춤
- 멈춘 시간
- 방해 시간

`ISSUE!!!` 같은 공격적 표현 금지.

## RECORDING

영어 녹음은 과제 수행 자체.

> **Recording ≠ Pause ≠ Issue**

실제 녹음과 재녹음은 Focus Time에 포함.

## SYSTEM WAIT

아이의 책임이 아닌 기술 대기:

- AI 분석
- 서버 cleanup
- 파일 변환
- 네트워크 대기

Focus Time에서 제외.

---

# 20. RECORDING EVENT — HYBRID DEFAULT

작은 Clock Popup에서 모든 기능을 처리하지 않는다.

권장 구조:

```text
REC Tap
→ BGM Fade-out
→ Clock 위 Intro Popup
→ Main Guide 등장
→ Recording Event 전용 화면
→ 녹음
→ 확인
→ Guide Coaching
→ 파일
→ 공유
→ Focus 복귀
```

Intro 예:

> “오? 녹음할 시간이군.”  
> “잠깐만… 같이 들어줄 친구 좀 잡아올게!”

CTA:

> **녹음하러 가기**

---

# 21. RECORDING EVENT SCREEN

전용 화면에서도 타임어택의 존재는 유지한다.

Persistent Mini Timer 예:

```text
Ready & Set · 타임어택 진행 중
남은 시간 18:42
```

녹음 UI:

```text
목소리 준비됐나요?

● 녹음 시작

REC 00:18
Waveform

[녹음 끝내기]
```

완료:

```text
녹음 완료

[들어보기]
[한 번 더 가볼까?]
[좋아, 이걸로 제출!]
```

---

# 22. AUDIO ROUTING — HARD LOCK

Recording Event 진입:

```text
REC Tap
→ BGM gentle Fade-out
→ BGM OFF
→ microphone activate
```

BGM OFF 유지:

- 녹음
- 녹음 재생
- Clean 비교
- Guide 음성
- 제출 파일 최종 확인

Focus 복귀:

- 기존 BGM ON이었으면 gentle Fade-in.
- 원래 OFF면 OFF 유지.

Guide Voice와 BGM이 경쟁하면 FAIL.

---

# 23. RECORDING FILE CONTRACT — HARD LOCK

기본 파일명:

```text
Judy's grammar recording YYYY MM DD.m4a
```

예:

```text
Judy's grammar recording 2026 09 01.m4a
```

규칙:

- 날짜 zero-padding.
- 기본 날짜는 녹음일.
- 제출일이 다르면 최종 확정 전 날짜 수정 가능.
- `Judy's grammar recording` prefix는 Profile/Setting으로 분리 가능.
- 파일명 preview 필수.

## TRUE FORMAT RULE

확장자만 `.m4a`로 바꾸지 않는다.

검사:

- MIME
- container
- codec
- 실제 playback
- 실제 file extension consistency

환경이 M4A/AAC 직접 녹음을 지원하지 않으면:

```text
supported temp format
→ safe conversion
→ verified M4A
→ filename apply
```

변환 실패 시 원본을 보존하고 오류를 명확히 표시한다.

---

# 24. VOICE PRESERVATION CLEANUP — HARD LOCK

목표:

> **아이 목소리는 그대로 두고, 갑작스러운 큰 소리와 생활 소음을 가능한 범위에서 보수적으로 줄인다.**

우선순위:

```text
1. 아이 목소리 정체성
2. 자연스러운 뉘앙스
3. 리듬 / 강세
4. 작은 자음 보존
5. Noise Reduction
```

허용:

- echoCancellation 요청
- noiseSuppression 요청
- autoGainControl 요청
- hum reduction
- transient peak reduction
- gentle leveling
- conservative denoise

금지:

- AI Voice Replacement
- Voice Clone / Voice Conversion
- pitch 재설계
- 음색 변조
- 과한 cleanup으로 `s/t/k/ed` 제거
- 불확실한 구간을 AI가 지어내어 복원

겹치는 다른 사람 음성을 완벽히 제거하기 어려운 경우:

> `이 부분은 다른 소리가 같이 들어와 정확히 듣기 어려웠어.`

라고 처리한다.

---

# 25. ORIGINAL / CLEAN / SUBMISSION COPY

## Original Recording

- 실제 아이 목소리 원본.
- 자동 overwrite 금지.
- 과거 성장 비교의 기준.
- 제출 후보.

## Clean Analysis Copy

- AI Listening용.
- noise reduced.
- 원본과 별도 저장.

## Clean Submission Copy — CONTROLLED FLEX

사용자가 직접 들어보고 원본/정리본을 선택할 수 있음.

어떤 파일이 최종 제출되는지 명확해야 한다.

---

# 26. AI READING GUIDE — CONFIDENCE-FIRST HARD LOCK

목표:

> **정확한 발음보다 자신 있게 말하고, 문장의 의미와 느낌을 자연스럽게 전달하도록 돕는다.**

공식 문장:

> **The goal is not perfect pronunciation. The goal is confident communication.**

우선순위:

```text
1. Confidence
2. Voice Presence
3. Completion
4. Flow
5. Rhythm
6. Expression / Nuance
7. Intelligibility
8. Pronunciation only when needed
```

금지:

- 발음 점수 메인 노출
- 87점 / B+ / 73% 등의 평가
- 작은 accent 차이를 오류 취급
- 미국식/영국식 하나만 정답화
- 빨간 오답 표시 중심
- 아이를 다른 사람과 비교

---

# 27. COACHING FORMAT

항상 짧게:

```text
GOOD
실제로 잘한 한 가지

NEXT
다음에 더 좋아질 한 가지

TRY
바로 해볼 아주 작은 행동
```

예:

```text
GOOD
오늘은 문장을 훨씬 자연스럽게 이어 읽었어.

NEXT
첫 문장 시작만 조금 더 자신 있게 해보자.

TRY
첫 문장을 천천히 한 번, 자연스럽게 한 번!
```

한 번에 보완점 1개 우선.

---

# 28. GROWTH MEMORY — HARD LOCK

과거 녹음과 비교할 때 실제 데이터가 있어야 한다.

가능한 내부 신호:

- voice presence
- pause density
- completion
- flow
- rhythm
- expression
- retry improvement
- accepted take

실제 개선이 확인될 때만:

> “지난번보다 첫 문장 목소리가 훨씬 또렷해졌는데?”

같은 대사를 사용한다.

허위 칭찬 금지.

---

# 29. GUIDE CHARACTER CORE — HARD LOCK

길잡이는:

- 선생님이 아니다.
- 심판이 아니다.
- 부모의 대리인이 아니다.
- AI 기술 설명 캐릭터가 아니다.

정의:

> **아이와 같은 편에서 작전을 함께 보고, 아이가 미처 알아채지 못한 작은 성장을 먼저 발견해주는 친구.**

기본 Personality:

```text
상냥함 35
친절함 25
위트 20
장난기 15
엉뚱함 5
```

성격 variant는 강조점만 다르게 한다.

---

# 30. MAIN GUIDE SETUP — HARD LOCK

영어 녹음 최초 사용 시:

```text
내 영어 길잡이
→ 캐릭터 후보
→ 성격 강조 선택
→ 이름 추천 받기
→ 직접 이름 짓기
→ 나중에 정하기
→ 목소리 샘플
→ 완료
```

규칙:

- 추천 이름 여러 후보.
- 다시 추천 가능.
- 직접 입력 가능.
- 추후 변경 가능.
- Skip 가능.
- 캐릭터에 따른 기능/AI 품질 차등 금지.
- 설정 때문에 Recording이 오래 지연되면 FAIL.

Voice label:

- 포근한
- 밝고 씩씩한
- 차분한
- 장난기 있는

---

# 31. GUIDE DUO COACHING ENGINE — HARD LOCK

Reading Coach는 고정 2인이 아니다.

```text
내 Main Guide 1명
+
오늘 잠깐 잡혀온 Random Guest Guide 1명
```

## Signature Intro

Main:

> “잠깐…”  
> “오늘은 나 혼자 듣기 좀 아까운데?”  
> **“같이 들어줄 친구 좀 잡아올게!”**

후다닥 퇴장.

잠시 후:

Main:

> **“잡아왔다!”**

Guest:

> “나는 그냥 지나가고 있었는데?”

Main:

> “됐고, 이것 좀 같이 들어봐.”

이 구조는 Ready & Set 고유의 코믹 리듬으로 사용할 수 있다.

특정 상업 작품의 외형·대사·연출을 직접 복제하지 않는다.

---

# 32. SMART RANDOM GUEST

완전 `Math.random()`만 사용하지 않는다.

권장:

```text
Guest Pool
→ 최근 1~2회 등장 제외
→ 빈도 보정
→ 오늘 mood와 극단적으로 충돌하는 캐릭터 제외
→ weighted random
```

목표:

- 연속 중복 감소
- 매번 다른 티키타카
- `오늘은 누가 올까?` 기대감
- 가챠/수집 앱으로 변질 금지

---

# 33. DUO DIALOGUE RULE — HARD LOCK

가장 중요한 규칙:

> **아이가 부족했던 부분을 코미디 소재로 사용하지 않는다.**

장난:

```text
Main ↔ Guest
```

응원:

```text
Main + Guest → Child
```

### 좋은 날

> Main: “오늘 목소리 좀 달라졌지?”  
> Guest: “응. 마지막 문장 꽤 자연스러웠는데?”  
> Main: “그치? 내가 잘 듣고 있었다니까.”  
> Guest: “네가 한 건 없잖아.”  
> Main: “…그건 굳이 말하지 않아도 돼.”

### 조금 자신 없었던 날

> Main: “오늘은 목소리가 살짝 숨어 있었어.”  
> Guest: “그래도 끝까지 읽었잖아.”  
> Main: “맞아. 다음엔 첫 문장만 조금 크게 시작해보자.”  
> Guest: “그럼 딱 하나네.”  
> Main: “좋아. 다음 작전 발견!”

---

# 34. GUIDE PERFORMANCE UI

캐릭터 등장 시:

- character appears
- expression
- small gesture
- bubble
- text typing
- same-meaning voice playback
- optional reaction overlay

규칙:

- CTA를 가리지 않는다.
- waveform을 가리지 않는다.
- 녹음 버튼을 가리지 않는다.
- 글자 타이핑이 너무 느리면 skip.
- Voice OFF에서도 text 유지.
- Reduced Motion 지원.
- 캐릭터가 녹음보다 더 주인공이 되면 FAIL.

---

# 35. GUIDE VOICE

목표:

- 듣기 좋은 자연스러운 목소리
- 명료
- 상냥
- 과도한 성우 연기 금지
- 유아틱한 톤 금지

권장 코칭 길이:

- 15~25초 내외
- 중요한 내용은 화면 텍스트로도 동일 의미 제공
- Voice ON/OFF
- volume control

---

# 36. RECORDING REVIEW / RETRY

Duo Coaching 후:

```text
오늘 발견한 좋은 변화
문장을 자연스럽게 이어 읽었어요.

다음 작전은 딱 하나
첫 문장부터 조금 더 자신 있게.

[한 번 더 가볼까?]
[좋아, 이걸로 제출!]
```

재녹음:

- 이전 take 보존 가능.
- 최종 take는 사용자가 선택.
- AI가 임의로 제출본 결정 금지.

---

# 37. FILE FINALIZE & AUDIO SHARE

화면:

```text
영어 작전, 제출 준비 완료!

Judy's grammar recording 2026 09 02.m4a

[들어보기]
[파일 공유]
[타임어택으로 돌아가기]
```

Guide:

> “목소리까지 잘 챙겨 넣었습니다.”  
> “이제 보내기만 하면 끝!”

공유:

- Web Share API File Share 우선.
- `navigator.canShare({files})` 등 지원 여부 확인.
- 지원 안 되면 save/download fallback.
- 공유 취소는 Recording 실패가 아니다.
- `recordingFinalized`와 `shared` 상태는 분리.

---

# 38. RETURN TO FOCUS — HARD LOCK

Recording Event 종료:

```text
same sessionId restore
→ same mission restore
→ same startAt restore
→ same target restore
→ pause / issue data restore
→ systemWait exclude
→ REC completed state
→ optional BGM fade-in
→ RUNNING
```

다음은 FAIL:

- 새 타이머 생성
- startAt 초기화
- target 변경
- ISSUE 초기화
- Recording completed state 소실
- Focus 결과 중복 저장

---

# 39. COMPLETE / RESULT

`완료했어요`는 Session Final Action.

- Pause와 명확히 구분.
- 충분한 터치 크기.
- 필요 시 lightweight confirmation.
- 완료 후 Result로 이동.
- 복수 Mission은 각 Item의 완료 상태를 함께 보여준다.

---

# 40. RESULT REACTION ENGINE

단순 `빠름/느림`이 아니다.

입력:

```text
completed
missionItemsCompleted
targetTime
focusTime
delta
issueTime
pauseCount
recordingCompleted
```

상태 예:

```text
EXCELLENT_FLOW
ON_TARGET
OVERTIME_COMPLETE
INTERRUPTED_BUT_COMPLETE
PARTIAL_COMPLETE
STOPPED
```

### EXCELLENT_FLOW

Headline:

> **엣헴~! 오늘 좀 했습니다.**

### ON_TARGET

Headline:

> **오? 계산대로인데?**

### OVERTIME_COMPLETE

Headline:

> **헤헤… 조금 늦었습니다.**

Sub:

> **그래도 작전 완료!**

### INTERRUPTED_BUT_COMPLETE

Headline:

> **오늘은 사건이 좀 많았습니다.**

Guide:

> “이런저런 일이 있었지만… 결국 다시 돌아와서 끝냈습니다.”

### PARTIAL / STOPPED

비난 금지:

> “오늘 작전은 여기까지.”  
> “기록은 남겨둘게. 다음에는 조금 더 가볍게 시작해보자.”

---

# 41. POST-MISSION SHARE — HARD LOCK

시작 전과 완전히 다른 컨셉.

Internal:

`Post-Mission Share`

User-facing:

> **오늘의 작전 보고서**

목적:

> **완료 경험을 가족에게 센스 있는 작은 귀환 보고서로 전달한다.**

Primary:

```text
Image Card + Short Caption
```

Text-only는 fallback.

---

# 42. POST-MISSION SHARE CONTENT

예:

```text
READY & SET

엣헴~! 오늘 좀 했습니다.
오늘의 작전 보고서

수학 · 연산 20문제

목표       25:00
집중       21:43
TIME SAVE  03:17

Guide:
"시계보다 먼저 돌아왔군요."

2026.09.02
```

ISSUE 시간은 내부 Result에서는 중요하지만 Share Card의 Primary Hero로 만들지 않는다.

TIME SAVE가 없는 경우에도 빨간 실패표시 금지.

---

# 43. SHARE VISUAL SYSTEM

## A. Warm Report Card — Default

- Peach / Cream / Coral
- 귀환 / 안도 / 성취
- modern report / stamp motif
- Guide Character
- premium family app

## B. Time Attack Poster — Optional

- Yellow / Black / White
- Full Clock motif
- strong `타임어택`
- dynamic
- 과도한 game HUD 금지

둘 다 Ready & Set Brand를 유지한다.

---

# 44. SHARE PIPELINE — HARD LOCK

Pre/Post 공통 기술 흐름:

```text
Data
→ Dedicated Share Card Renderer
→ Image Blob/File
→ Short Caption
→ Native Share Sheet
```

Fallback:

```text
Image + Text
→ Image only
→ Text
→ Save file
```

규칙:

- 카카오톡 전용 API 필수 의존 금지.
- 대부분 KakaoTalk 공유를 예상하되 Native Share를 사용.
- 공유 실패가 기록 저장 실패로 이어지면 FAIL.
- 결과는 공유보다 먼저 local save.
- 공유 카드 생성 실패 시 Result 자체는 유지.

---

# 45. GOOGLE CALENDAR

Calendar는 Optional Integration.

```text
Result local save
→ Calendar request
→ success / retry / skip
```

- OAuth 실패가 local Result 삭제로 이어지면 FAIL.
- Calendar 미연결 상태에서도 Core 정상.
- 인증 실패 / API 실패 / user cancel 분리.
- Calendar가 제품 중심이 되지 않는다.

---

# 46. DATA MODEL DIRECTION — REV_03

```text
schemaVersion
appVersion
profile
settings
guideProfile
missions[]
activeSession?
recordings[]
guideCoaching[]
records[]
calendarMeta?
```

## profile

```text
id
displayName
recordingFilePrefix
createdAt
```

## guideProfile

```text
mainGuideId
guideName
personalityVariant
voiceId
voiceEnabled
```

## mission

```text
missionId
date
items[]
detailText
targetSeconds
selectedBgm
includesRecordingMission
status
```

## activeSession

```text
sessionId
missionId
state
startAt
pausedAt
accumulatedIssueMs
accumulatedSystemWaitMs
recordingEventState
lastPersistedAt
```

## recording

```text
recordingId
sessionId
takeNo
assignmentDate
originalBlobRef
cleanBlobRef?
mimeType
codec?
duration
finalized
shared
filename
```

## guideCoaching

```text
recordingId
mainGuideId
guestGuideId
goodPoint
nextPoint
tryPoint
dialogue
createdAt
```

## record

```text
missionId
startAt
endAt
targetMs
totalMs
issueMs
systemWaitMs
focusMs
deltaMs
reactionState
recordingStatus
shareStatus
calendarStatus
```

---

# 47. STORAGE SAFETY — HARD LOCK

- schemaVersion.
- migration.
- malformed data recovery.
- atomic/transactional write where appropriate.
- existing record silent loss 금지.
- active session recovery.
- heavy audio Blob을 localStorage Base64로 무제한 저장 금지.
- audio는 IndexedDB 등 적절한 binary storage 우선 검토.
- metadata와 heavy media 분리.
- final recording 임의 삭제 금지.
- 삭제는 명시적 사용자 행동.
- 데이터 갱신 중 실패해도 기존 record 보호.

---

# 48. INTERRUPT / RESUME — HARD LOCK

앱 중단 상황:

- 화면 잠금
- PWA background
- tab switch
- incoming call
- microphone interruption
- refresh
- browser termination
- sharing app 이동

반드시 가능한 범위에서:

- sessionId
- mission
- startAt
- target
- accumulatedIssue
- accumulatedSystemWait
- recording stage
- completed items

을 보존한다.

녹음 중 interruption:

> “녹음이 중간에 멈췄어. 괜찮아.”

선택:

- 다시 녹음
- 원본 임시본 듣기(가능 시)
- 타임어택으로 돌아가기

중단 자체를 실패로 처리하지 않는다.

---

# 49. PWA / OFFLINE — HARD LOCK

## Offline Core

- HOME
- Mission Selector
- Setup
- Timer
- Pause / Resume
- local Recording
- local Playback
- Result
- History
- local BGM
- cached Guide assets

## Online Required / Optional

- AI Reading Guide
- server-side cleanup
- cloud TTS
- Google Calendar
- external audio
- server time
- file conversion server가 필요한 환경

**Network failure가 Core Timer를 중단시키면 FAIL.**

AI가 실패해도 녹음 파일을 보존하고 제출/복귀 가능한 구조를 우선한다.

---

# 50. SERVICE WORKER / VERSION TRACEABILITY

```text
MASTER_LOGIC_REV
↔ APP_VERSION
↔ SCHEMA_VERSION
↔ CACHE_VERSION
```

새 Focus asset이나 Recording UI를 배포했는데 stale cache로 이전 UI가 보이면 FAIL.

배포 시:

- cache version update
- old cache cleanup
- migration 검증
- asset path 검증
- offline fallback 검증

---

# 51. ERROR TAXONOMY — HARD LOCK

모든 오류를 `오류가 발생했어요` 하나로 숨기지 않는다.

분류:

- microphone permission
- microphone unavailable
- recording start
- recording interrupted
- audio decode
- audio playback
- cleanup
- AI network
- AI analysis
- TTS
- file conversion
- file share
- Calendar auth
- Calendar API
- local save
- session restore
- migration
- service worker

에러 문구는 사용자를 탓하지 않는다.

예:

> “마이크 권한이 꺼져 있어. 켜주면 바로 녹음할 수 있어.”

> “녹음은 잘 저장됐어. 길잡이 코칭만 연결이 잠깐 끊겼네.”

> “M4A 변환은 아직 못 했지만 원본 녹음은 안전하게 남아 있어.”

---

# 52. NETWORK / AI SAFETY

- timeout
- bounded retry
- backoff
- auth error 분리
- model/API 변경 시 regression
- API key client 노출 최소화
- 공개 배포 시 proxy/server-side 우선
- AI 실패는 Core failure가 아님

> **AI는 Enhancement Layer이며, 녹음 제출의 Single Point of Failure가 아니다.**

---

# 53. MOBILE UI / SAFE AREA — HARD LOCK

- `viewport-fit=cover`
- top safe-area
- bottom safe-area
- iPhone status icons 직접 그리지 않음
- notch / Dynamic Island 장식 금지
- background full bleed 허용
- interactive UI는 safe area 내부
- Bottom CTA와 Home Indicator 충돌 금지
- REC touch target 충분
- keyboard 열림 시 CTA 충돌 금지
- 작은 화면에서도 핵심 Focus action 유지

Focus 1-screen 최소:

- 타임어택 title
- mission
- Full Clock
- remaining
- target
- REC if applicable
- pause
- complete

---

# 54. ACCESSIBILITY & PRESSURE CONTROL

- Reduced Motion.
- BGM ON/OFF.
- Guide Voice ON/OFF.
- text always visible.
- 색상만으로 상태 전달 금지.
- 충분한 contrast.
- 44px 수준 touch target.
- screen reader labels.
- 반복 음성 최소화.
- 긴 대사 Skip.
- 시간 초과를 실패 빨간 경고로 과도하게 표현 금지.
- 녹음 재시도 횟수로 아이를 압박하지 않음.

---

# 55. VISUAL QUALITY FLOOR

## HOME / RESULT

- Warm Premium
- Peach / Coral / Cream
- 밝고 세련됨
- 유아적 card toy UI 금지

## FOCUS

- Yellow / Golden Yellow
- strong typography
- Full White/Ivory Clock
- subtle paper/grain
- refined shadow
- Dark Control Panel secondary

## GUIDE

- 독자적 original character
- 상업 IP 직접 모방 금지
- 표정/제스처가 명확
- 캐릭터가 UI 위에 sticker처럼 뜨지 않고 장면과 통합
- 핵심 기능을 가리지 않음

## SHARE

- screenshot 느낌 금지
- dedicated graphic composition
- KakaoTalk thumbnail readability
- typo / 숫자 오류 금지

---

# 56. DESIGN DRIFT PROTECTION — HARD LOCK

Regression:

- 앱명이 다시 Time Attack으로 변경
- HOME이 전체 Yellow
- Focus가 HOME과 같은 Peach card dashboard
- Clock이 thick black wall-clock
- Clock 강제 Crop
- Clock 너무 작음
- Dark Panel 과도하게 큼
- REC 항상 노출
- REC가 장식처럼 작아 실제로 누르기 어려움
- Recording 중 BGM
- AI가 발음 점수 앱처럼 변함
- Guide가 아이를 조롱
- Guide가 기능보다 주인공
- 공유가 text-only로 후퇴
- 카카오톡 전용 종속
- Recording 후 Timer reset
- AI wait가 ISSUE에 누적
- generic game HUD
- neon / metal 과다
- emoji core icons
- stale cache로 이전 화면 노출

---

# 57. EXPERIENCE RHYTHM — HARD LOCK

```text
HOME
따뜻하게 오늘 할 일을 고른다.

→ MISSION SELECT
한 가지 또는 여러 과제를 조합한다.

→ BRIEFING
오늘의 작전을 정리한다.

→ PRE-SHARE
가족에게 응원을 요청한다.

→ TIME ATTACK
노란 화면과 감각적인 시계로 집중한다.

→ RECORDING EVENT
필요한 순간 영어 녹음으로 들어간다.

→ GUIDE DUO
내 길잡이와 오늘 잠깐 잡혀온 친구가 작은 성장을 발견한다.

→ RETURN
같은 타이머로 복귀한다.

→ COMPLETE
작전을 끝낸다.

→ REPORT
따뜻한 결과 화면으로 귀환한다.

→ POST-SHARE
센스 있는 이미지 보고서를 가족에게 보낸다.
```

---

# 58. REFERENCE MASTER COMPARISON — REV_03 TRANSFER

## 58.1 Snap & Pop에서 ADOPT

- Source of Truth
- 실제 결과물 사후 검증
- No User-as-QA
- `MASTER보다 좋아졌는가, 단순히 달라졌는가` Gate
- LOCKED / CONTROLLED / EXPANSION
- Golden Reference regression
- Tool-specific result validation
- Guide를 AI/교사가 아닌 동행자로 표현
- Guide Name 추천 / 직접 입력 / 변경
- Guide Performance가 핵심 행동을 가리지 않음
- Motion Accessibility
- 기존 정상 기능 목적 보존

## 58.2 ZPD Word에서 ADOPT

- 폐쇄형 MASTER Control Loop
- ADOPT / ADJUST / HOLD / REJECT
- 명시적 State Machine
- Interrupt / Resume
- Error Taxonomy
- Network/API failure separation
- PWA / Offline / Cache / Migration
- Data silent loss 금지
- One Personality Core
- 과잉 칭찬 / 실패 조롱 금지
- Guide가 사용자 상태를 관찰하고 다음 행동을 돕는 구조
- 기능별 실제 Validation Checklist
- Deployment Gate
- UI부터 무작정 먼저 만들지 않는 구현 순서

## 58.3 Ready & Set에 맞게 ADJUST

- Writing-first / Word-learning-first → **Self-Start / Focus / Completion / Confidence-first**
- 고정 Partner → **Main Guide + Smart Random Guest**
- 음성 Accessibility → **Recording + Voice Preservation + Coaching + File Share**
- 사건/탐험 세계관 → **작전 / 출동 / 귀환**
- 오답 학습 → **영어 말하기 자신감 성장**
- Result 공유 → **Pre-Mission / Post-Mission 두 개의 서로 다른 공유 경험**

## 58.4 REJECT

다른 프로젝트 전용 기능은 직접 이식하지 않는다.

- OCR
- CODE RED
- RETRACE
- 경찰 세계관
- 판타지 탐험 지도
- 보석 경제
- 글쓰기 랜드마크
- ZPD 전용 학습 데이터
- Snap & Pop 가족 확장 기능

---

# 59. GOLDEN REFERENCES — HARD LOCK

향후 실제 UI 생성 시 MASTER 텍스트만 보지 않는다.

Golden Reference Set:

```text
A. 승인 HOME
B. 승인 Setup
C. Focus Yellow visual reference
D. Full White/Ivory Clock 방향
E. Dark Control Panel 기능 구조
F. Result / Settings Warm UI
G. Ready & Set Guide Character Master
H. Pre-Mission Share Card
I. Post-Mission Share Card
J. Recording Event UI
```

각 실제 결과는:

```text
PRESERVED
IMPROVED
CHANGED
REGRESSED
UNKNOWN
```

으로 비교한다.

`CHANGED`는 자동 PASS가 아니다.

`REGRESSED` = FAIL.

`UNKNOWN` = 승인 보류.

---

# 60. SCENARIO TEST A — NORMAL MISSION

```text
HOME
→ 재능
→ 수학 + 연산
→ 목표 25분
→ 작전 개시 전 응원 카드 공유
→ START
→ 타임어택
→ 22분 집중
→ 완료
→ Result local save
→ 오늘의 작전 보고서 이미지 공유
→ Calendar optional
```

PASS 조건:

- timer 정확
- 기록 유지
- share image 생성
- Native Share
- HOME/Focus/Result tone 구분
- 데이터 손실 없음

---

# 61. SCENARIO TEST B — MULTI MISSION + RECORDING

```text
HOME
→ 재능/국어
→ 학교/독서
→ 영어/문장 녹음
→ 복수 선택 확인
→ 목표 45분
→ START
→ RUNNING
→ REC 중앙 버튼
→ BGM Fade-out
→ Intro Popup
→ Recording Event
→ 녹음
→ 들어보기
→ AI System Wait
→ Main Guide가 Guest를 데려옴
→ Duo Coaching
→ 재녹음
→ 최종 Take 선택
→ Judy's grammar recording YYYY MM DD.m4a
→ 파일 공유
→ 동일 Session으로 Focus 복귀
→ REC 완료 상태
→ BGM Fade-in
→ 나머지 과제
→ Complete
→ Result
```

FAIL:

- session 새로 생성
- target 변경
- startAt reset
- BGM이 녹음에 들어감
- AI wait가 ISSUE
- 파일명/포맷 불일치
- 공유 후 녹음 상태 사라짐

---

# 62. SCENARIO TEST C — 집중이 흐트러진 날

```text
RUNNING
→ 여러 Pause
→ 목표시간 초과
→ 그래도 완료
→ Result
```

PASS:

- `실패`라고 비난하지 않음
- Issue는 별도 기록
- Result Headline은 `헤헤… 조금 늦었습니다. 그래도 작전 완료!`
- 다음 행동은 하나만 제안
- 공유 카드도 부정적 빨간 점수표가 아님

---

# 63. SCENARIO TEST D — AI FAILURE

```text
Recording success
→ AI network failure
```

반드시:

- Original Recording 보존
- Playback 가능
- File Finalize 가능
- Share 가능
- Focus 복귀 가능
- AI 코칭 재시도 또는 나중에 가능

AI 실패가 제출 실패가 되면 FAIL.

---

# 64. SCENARIO TEST E — RECORDING INTERRUPTION

```text
RECORDING
→ 전화 / 화면잠금 / 마이크 interruption
```

반드시:

- crash 금지
- 가능한 임시본 보존
- user에게 명확한 상태
- 다시 녹음
- Focus 복귀
- 기존 타이머 상태 보존

---

# 65. MASTER SELF-VALIDATION GATE — HARD LOCK

## PRODUCT

- [ ] 앱 공식명이 Ready & Set인가?
- [ ] 타임어택이 기능명인가?
- [ ] 압박보다 자기 주도·자신감이 우선인가?

## HOME

- [ ] 승인 Warm UI가 보존되는가?
- [ ] 복수 Mission이 기존 HOME을 과밀하게 만들지 않는가?

## FOCUS

- [ ] Yellow identity 유지?
- [ ] Full Clock?
- [ ] 강제 Crop 없음?
- [ ] 남은 시간/목표 시간 명확?
- [ ] REC 조건부 중앙 배치?
- [ ] Pause/Complete 명확?

## TIMER

- [ ] timestamp 기반?
- [ ] Pause / Recording / System Wait 분리?
- [ ] background resume?
- [ ] same session restore?

## RECORDING

- [ ] BGM OFF?
- [ ] microphone fallback?
- [ ] interruption recovery?
- [ ] Original 보존?
- [ ] 실제 파일 포맷 검증?

## READING GUIDE

- [ ] Confidence-first?
- [ ] 발음 점수 중심이 아닌가?
- [ ] 실제 관찰 기반 GOOD?
- [ ] NEXT 1개?
- [ ] Main + Guest?
- [ ] 아이가 장난 대상이 아닌가?

## SHARE

- [ ] Pre/Post 서로 다른가?
- [ ] Image + short text primary?
- [ ] Native Share?
- [ ] fallback?
- [ ] 공유 실패가 record를 파괴하지 않는가?

## DATA / PWA

- [ ] schemaVersion?
- [ ] migration?
- [ ] offline?
- [ ] cache version?
- [ ] silent loss 방지?

하나라도 모호하면 FAIL.

---

# 66. RESULT SELF-VALIDATION GATE — HARD LOCK

실제 구현 후 반드시 확인:

- actual HOME
- Popup / Bottom Sheet multi-select
- Mission Chip
- Focus actual Full Clock
- Clock numeral / hand artifact
- REC actual position
- REC touch size
- BGM actual Fade-out
- microphone permission
- actual recording
- background noise sample
- transient noise sample
- overlapping voice limitation
- actual playback
- interruption
- AI timeout
- Main/Guest dialogue
- Guide Voice ON/OFF
- Reduced Motion
- Retry recording
- actual M4A
- filename
- MIME/container
- file share
- KakaoTalk route via share sheet
- share cancel
- Focus return
- timer accuracy
- Result Card render
- Result Card image share
- Calendar fallback
- reload/resume
- offline
- PWA standalone
- iPhone safe-area
- Android Chrome
- short viewport
- stale cache update

Prompt에 적혀 있다는 이유로 PASS하지 않는다.

---

# 67. REGRESSION GATE

변경마다 기록:

```text
PRESERVED
IMPROVED
CHANGED
REGRESSED
UNKNOWN
```

특히 비교:

- HOME
- Setup
- Timer
- Pause
- Focus Clock
- BGM
- Record
- Result
- Share
- Calendar
- Settings
- History
- PWA install
- Offline
- Migration
- Safe Area

Core에 `REGRESSED` 또는 중요한 `UNKNOWN`이 남으면 배포하지 않는다.

---

# 68. TOOL-SPECIFIC VALIDATION

## Image Generation

- Clock Full shape?
- thick black wall-clock 회귀?
- 숫자/hand artifact?
- Guide species/identity consistent?
- 특정 상업 IP 모방?
- typography typo?

## UI Mockup

- Safe Area?
- real touch layout?
- REC 위치?
- Popup/Bottom Sheet?
- CTA 가림?
- mobile density?

## Code / PWA

- timer
- session resume
- audio routing
- binary storage
- file conversion
- share API
- offline/cache
- migration

각 도구별 PASS 후 최종 MASTER Gate를 다시 통과한다.

---

# 69. DEPLOYMENT GATE — HARD LOCK

배포 전:

1. MASTER SELF-VALIDATION PASS
2. UI Result Validation PASS
3. HOME preservation PASS
4. Multi Mission PASS
5. Focus Full Clock PASS
6. Timer accuracy PASS
7. Pause / Issue PASS
8. Conditional REC PASS
9. Recording PASS
10. BGM routing PASS
11. Recording interruption recovery PASS
12. Voice Preservation PASS
13. Actual file format/name PASS
14. AI failure fallback PASS
15. Guide Duo PASS
16. Pre-Mission Share PASS
17. Post-Mission Share PASS
18. File Share PASS
19. Focus Return PASS
20. Result/Persistence PASS
21. Calendar fallback PASS
22. Migration PASS
23. Safe Area PASS
24. PWA Offline PASS
25. Cache update PASS
26. Regression PASS
27. No User-as-QA final check PASS

통과본만 배포 후보가 된다.

---

# 70. IMPLEMENTATION ORDER

MASTER 확정 후 권장 순서:

```text
1. Ready & Set brand / naming refactor
2. Schema / migration plan
3. Existing Timer regression tests
4. Multi Mission Selector
5. Focus Full Clock UI
6. Conditional REC action
7. Recording Event state machine
8. Audio/BGM routing
9. Original Recording storage
10. Clean Analysis Copy
11. Actual M4A pipeline / validation
12. Return-to-Focus
13. Main Guide setup
14. Guest Smart Random
15. Duo Dialogue Engine
16. Confidence-first Reading Guide
17. Guide Voice
18. Pre-Mission Share Card
19. Post-Mission Share Card
20. Native image/file share
21. Calendar regression
22. PWA/offline/cache
23. Full Result Self-Validation
24. Mobile real-device test
25. Deployment Gate
```

**UI만 먼저 화려하게 바꾸지 않는다.**

State / Data / Recording / Resume 안전성을 먼저 만든다.

---

# 71. REV_03 DOCUMENT SELF-VALIDATION RESULT

본 REV_03 문서 자체를 다음 기준으로 재검토했다.

### SOURCE / GOVERNANCE
- PASS — Source of Truth 우선순위 존재.
- PASS — Closed MASTER Control Loop 존재.
- PASS — ADOPT / ADJUST / HOLD / REJECT 존재.
- PASS — No User-as-QA 존재.
- PASS — Prompt Compliance ≠ Result Compliance 존재.
- PASS — LOCKED / CONTROLLED / EXPANSION 구분 존재.

### BRAND / NAMING
- PASS — 앱명 Ready & Set으로 통일.
- PASS — 타임어택을 기능명으로 분리.
- PASS — 파일명 Revision 규칙 변경.

### USER FLOW
- PASS — HOME → Mission → Briefing → Share → Focus → Result 흐름.
- PASS — Recording Event가 Focus Session 안에 연결.
- PASS — Recording 후 동일 Session 복귀.
- PASS — Pause / Recording / System Wait 의미 분리.

### VISUAL
- PASS — REV_02의 강제 Clock Crop 규칙 제거.
- PASS — Full Clock Hero로 수정.
- PASS — HOME / FOCUS / RESULT 감정 리듬 보존.
- PASS — REC 위치를 Remaining / Target 사이 중앙으로 명시.

### SHARE
- PASS — 시작 전/완료 후 서로 다른 공유 목적.
- PASS — Image + Short Caption을 Primary로 설정.
- PASS — Native Share + fallback.
- PASS — 공유 실패와 Record 저장 분리.

### RECORDING
- PASS — BGM OFF.
- PASS — Original / Clean Copy 분리.
- PASS — 실제 M4A integrity 명시.
- PASS — interruption / recovery.
- PASS — AI failure가 제출을 막지 않음.

### GUIDE / AI
- PASS — Main Guide + Smart Random Guest.
- PASS — 이름 추천 / 직접 입력 / 변경 가능.
- PASS — One Personality Core + variants.
- PASS — 아이를 장난 대상으로 사용하지 않음.
- PASS — Confidence > Pronunciation.
- PASS — GOOD / NEXT / TRY 구조.

### PWA / DATA
- PASS — schema / migration.
- PASS — active session resume.
- PASS — binary storage 방향.
- PASS — offline/network 분리.
- PASS — cache/version traceability.

### IMPORTANT LIMIT

**MASTER DOCUMENT SELF-VALIDATION: PASS**

단, 다음은 문서 단계에서 PASS로 간주하지 않는다.

```text
실제 UI Render
실제 Mobile Touch
실제 Microphone
실제 Noise Cleanup
실제 M4A Conversion
실제 KakaoTalk Share Sheet
실제 AI Voice
실제 Offline / Resume
```

이 항목은 구현 후 **RESULT SELF-VALIDATION**에서 실제 결과를 보고 검증한다.

---

# 72. REV_03 FINAL HARD LOCK

> **앱의 공식 이름은 Ready & Set이다.**

> **타임어택은 Ready & Set 안의 핵심 Focus Experience다.**

> **HOME은 현재 승인된 Warm Premium 구조를 보존한다.**

> **과제는 재능 / 학교 / 영어 Popup에서 단일 또는 복수 선택할 수 있다.**

> **Focus Clock은 감각적인 Full White/Ivory Analog Clock이며 강제 Crop하지 않는다.**

> **영어 문장 녹음이 포함된 경우 남은 시간과 목표 시간 사이에 REC Special Action이 나타난다.**

> **녹음은 타이머를 파괴하지 않는 Special Recording Event다.**

> **녹음 중 BGM은 꺼지고, 녹음·코칭·공유 후 같은 타이머 세션으로 돌아온다.**

> **AI Reading Guide는 정확한 발음보다 자신감·전달력·자연스러운 뉘앙스를 우선한다.**

> **Main Guide는 아이가 캐릭터·이름·성격 강조·목소리를 선택할 수 있다.**

> **코칭 시 Main Guide가 매번 달라질 수 있는 Guest Guide를 데려와 티키타카한다.**

> **아이의 부족한 부분은 코미디 소재로 쓰지 않는다.**

> **아이 음성 보존이 Noise Removal보다 우선한다.**

> **Original Recording과 Clean Analysis Copy를 분리한다.**

> **제출 파일은 지정 파일명뿐 아니라 실제 파일 포맷까지 일치해야 한다.**

> **작전 시작 전 공유와 작전 완료 후 공유는 서로 다른 컨셉이며 이미지 + 짧은 텍스트가 Primary다.**

> **시안은 MASTER 확정 후에만 제작한다.**

> **시안/구현 후 실제 결과를 MASTER와 대조하고 PASS본만 제시한다.**

---

# 73. OFFICIAL NEXT STEP

```text
REV_03 MASTER 확정
→ Ready & Set Information Architecture Wire
→ HOME Multi-Mission Popup
→ Focus Full Clock + REC Layout
→ Recording Event UI Flow
→ Main / Guest Guide Character Master
→ Pre-Mission Share Card
→ Post-Mission Report Card
→ Visual Result Self-Validation
→ PWA Code Integration
→ Recording / M4A / Share Real-Device Test
→ Regression Gate
→ Deployment Gate
```

---

# 74. FINAL PRODUCT PRINCIPLE

Ready & Set의 성공 기준은 기능 수가 아니다.

아이가 반복 사용하면서 이런 경험을 느끼는지가 기준이다.

```text
내가 고른다.
→ 내가 시작한다.
→ 집중한다.
→ 잠깐 흔들려도 다시 돌아온다.
→ 결국 끝낸다.
→ 영어도 조금씩 더 자신 있게 말한다.
→ 내 길잡이가 그 변화를 먼저 알아봐 준다.
→ 가족에게 멋지고 재미있게 보여준다.
→ 다음에도 다시 할 수 있을 것 같다.
```

> **Ready & Set은 시간을 재는 앱이 아니라,  
> 아이가 스스로 시작하고 끝낼 수 있다는 확신을 쌓는 앱이다.**

**END OF READY & SET UI MASTER LOGIC REV_03**


# 75. REV_04 ADDENDUM — USER IDENTITY & GUIDE ONBOARDING

REV_04는 REV_03의 모든 HARD LOCK을 보존하면서 사용자 프로필과 길잡이 선택을 Ready & Set의 공식 경험으로 추가한다.

## 75.1 ADOPT

- 사용자 이름 입력
- 카메라 촬영 / 사진 보관함 선택
- 사용자 사진을 Ready & Set 고밀도 일러스트 아바타로 변환
- 원본 사진과 생성 아바타의 저장 정책 분리
- Main Guide 캐릭터 선택
- Guide 이름 추천 3~5개
- 다시 추천
- 직접 이름 입력
- 나중에 정하기
- Guide Voice 선택
- Settings에서 언제든 수정
- 사용자 Avatar와 Guide를 명확히 분리
- Profile/Guide onboarding이 핵심 Mission 시작을 막지 않도록 Skip 허용

## 75.2 USER PROFILE ONBOARDING — HARD LOCK

```text
Ready & Set 첫 시작
→ 이름 입력
→ 사진 찍기 | 사진 선택 | 나중에
→ 사진 확인
→ Ready & Set 일러스트 만들기
→ 일러스트 미리보기
→ 다시 만들기 | 이 모습으로 시작
→ Main Guide 선택
→ 이름 추천받기 | 직접 이름 | 나중에
→ Guide Voice 선택
→ HOME
```

각 단계는 짧게 유지한다.

`나중에 하기`를 제공한다.

온보딩이 길어져 오늘의 과제 시작보다 앞서는 느낌이면 FAIL.

## 75.3 USER AVATAR ROLE — HARD LOCK

USER = 앱의 주인공.

GUIDE = 동행자.

둘을 같은 프로필 카드 안에서 동일한 위계로 합쳐 사용자가 누구인지 모호하게 만들면 FAIL.

HOME에서는:
- 사용자 이름
- 사용자 Illustration Avatar
- 현재 Main Guide의 작은 동행 표현

을 사용할 수 있다.

Focus에서는 핵심 타이머보다 프로필이 우선하면 FAIL.

## 75.4 PHOTO CAPTURE

지원:
- `capture="user"` 기반 전면 카메라 촬영
- 사진 보관함
- 재촬영
- 사진 삭제
- 사진 없이 진행

촬영 Guide:
- 얼굴이 너무 작지 않게
- 정면 또는 자연스러운 3/4
- 밝은 곳
- 얼굴을 과도하게 가리지 않음
- 배경은 중요하지 않음

## 75.5 READY & SET AVATAR VISUAL MASTER

사용자 사진 기반 아바타는 단순 필터나 프로필 스티커가 아니다.

목표:

> **원래 사용자의 얼굴 정체성은 유지하면서 Ready & Set의 따뜻하고 밝은 세계에 자연스럽게 들어온 고밀도 2.5D Editorial Character Illustration.**

Quality:
- 얼굴 identity 우선
- natural proportions
- 섬세한 헤어 / 천 / 봉제 / 작은 소재 디테일
- 따뜻한 자연광
- clean skin tone
- premium mobile illustration
- 과도한 glossy 3D 금지
- low-density cartoon 금지
- generic AI face 금지
- 과도한 fantasy costume 금지
- 특정 상업 캐릭터 스타일 직접 복제 금지

기본 outfit direction:
- Ready & Set에 맞는 현대적이고 활동적인 캐주얼
- 작은 mission badge / watch / notebook 같은 제한적 motif
- 아이를 군인/전투 캐릭터처럼 만들지 않음

## 75.6 PHOTO / AVATAR DATA SAFETY

최소 데이터 구분:

```text
profilePhotoOriginal?
profileAvatarRendered?
avatarVersion
avatarStyleVersion
```

- 원본 사진의 저장 여부를 명확히 정의한다.
- 원본을 불필요하게 장기 저장하지 않는 구현을 우선 검토한다.
- 생성 아바타 삭제 시 원본이 자동 삭제되는지 여부를 명확하게 표시한다.
- 사진 upload/AI generation 실패가 Ready & Set 사용 자체를 막지 않는다.
- 사용자 요청 없이 사진을 공유 카드에 자동 포함하지 않는다.

## 75.7 MAIN GUIDE SELECTOR — HARD LOCK

```text
나와 같이 갈 길잡이를 골라볼까?

→ Character candidates
→ Preview expression / short sample line
→ 선택
→ 이름 추천받기
→ 3~5개 후보
→ 다시 추천
→ 직접 입력
→ 이 이름으로 결정
→ Voice sample
→ 완료
```

Guide 선택은 애착과 취향을 위한 것이다.

캐릭터에 따른:
- AI 품질
- 타이머 성능
- 보상
- 분석 정확도
- 기능

차등 금지.

## 75.8 GUIDE NAME RECOMMENDATION

추천 기준:
- 캐릭터의 종/형태
- 성격 강조점
- 짧고 부르기 쉬움
- 약간의 위트
- 너무 유아적이지 않음
- 특정 상업 캐릭터의 고유 이름과 직접 유사하지 않음

UI:

```text
이름 추천받기
→ 3~5개
→ 다른 이름 보여줘
→ 직접 지을래
→ 결정
```

## 75.9 GUIDE ART QUALITY

Guide는 Ready & Set 고밀도 일러스트 세계에서 사용자 Avatar와 같은 Quality Floor를 공유한다.

다만 User가 주인공이므로:
- Guide가 User보다 시각적으로 압도적이면 FAIL.
- 홈에서 Guide가 Hero Profile을 밀어내면 FAIL.
- Focus에서 Guide가 Clock/Timer를 밀어내면 FAIL.
- Recording Event에서는 짧은 Character Performance를 위해 확대 가능.

## 75.10 SETTINGS

Settings에서 언제든:
- 사용자 이름 변경
- 사진 다시 찍기
- Avatar 다시 만들기
- Main Guide 변경
- Guide 이름 변경
- Guide Voice 변경

가능.

이 변경은:
- Mission history
- recordings
- timer records
- share records
- calendar
- confidence history

를 초기화하지 않는다.

---

# 76. REV_04 VISUAL PRODUCTION TARGET

MASTER 확정 후 첫 Golden Mockup Set:

```text
01 PROFILE — 이름 + 사진 + Illustration Avatar
02 GUIDE — 캐릭터 선택 + 이름 추천
03 HOME — 승인 HOME + Profile/Guide 통합
04 MISSION SELECT — Multi Mission Bottom Sheet
05 FOCUS — Full Clock + center REC
06 RECORDING — Main/Guest Duo Event
07 RESULT — 오늘의 작전 보고서
08 SHARE — Pre / Post share card pair
```

모든 화면은:
- 모바일 실제 비율
- 상단 Safe Area
- 고밀도 일러스트
- 밝은 premium tone
- 실제 버튼 의미가 읽힘
- 특정 IP 직접 모방 없음

을 검증한다.

---

# 77. REV_04 SELF-VALIDATION ADDENDUM

### USER PROFILE
- [ ] 이름 입력?
- [ ] 사진 촬영 / 앨범?
- [ ] 나중에 가능?
- [ ] Illustration Avatar?
- [ ] User identity 유지?
- [ ] 원본/생성물 저장 정책 분리?
- [ ] 실패 시 앱 사용 가능?

### GUIDE
- [ ] Character 선택?
- [ ] Name 추천?
- [ ] 다시 추천?
- [ ] 직접 입력?
- [ ] Voice 선택?
- [ ] Settings 변경?
- [ ] 기능 차등 없음?

### HIERARCHY
- [ ] User = 주인공?
- [ ] Guide = 동행자?
- [ ] Focus에서 Clock 우선?
- [ ] Recording에서만 Guide Performance 확대?

하나라도 모호하면 FAIL.

---

# 78. REV_04 FINAL HARD LOCK

> **Ready & Set의 사용자는 이름과 사진을 기반으로 자신의 Illustration Avatar를 만들 수 있다.**

> **사진은 선택 사항이며, 실패하거나 건너뛰어도 Core Mission을 사용할 수 있다.**

> **User Avatar는 Ready & Set 고밀도 2.5D Editorial Illustration Quality를 따른다.**

> **사용자가 주인공이고 Guide는 동행자다.**

> **Main Guide는 캐릭터·이름·목소리를 선택할 수 있으며 이름 추천/직접 입력/변경을 지원한다.**

> **Profile/Guide 변경은 기존 Mission·Recording·Result 데이터를 초기화하지 않는다.**

> **이 Revision은 REV_03의 Timer·Share·Recording·Confidence-first AI HARD LOCK을 모두 보존한다.**

**END OF READY & SET UI MASTER LOGIC REV_04**


---

# 79. REV_05 ADDENDUM — DEPLOYABLE UI / PWA / DYNAMIC CHARACTER SHARE GOVERNANCE

REV_05는 REV_04의 전체 HARD LOCK을 보존하면서, 이후 시안이 실제 배포 가능한 PWA로 자연스럽게 이어지도록 **배포용 UI 규칙**, **배포용 PWA 규칙**, **Avatar Style System**, **Focus Clock Preservation/Upgrade Lock**, **Dynamic Share Card Character Direction Engine**을 공식화한다.

이 Addendum의 목적은 “시안은 멋지지만 실제 앱에서는 구현할 수 없는 상태” 또는 “배포본은 동작하지만 MASTER 디자인과 달라지는 상태”를 방지하는 것이다.

---

# 80. DEPLOYABLE UI RULES — HARD LOCK

모든 시안은 단순 이미지가 아니라 **실제 모바일 PWA로 구현 가능한 UI**를 전제로 한다.

## 80.1 Mobile Canvas

기본 설계 기준:
- Mobile portrait first
- 대표 기준 폭: 390px 전후
- 320~430px 범위에서 핵심 기능 유지
- `viewport-fit=cover`
- iOS / Android safe area 고려
- 상단 OS 상태 아이콘 직접 그리지 않음
- notch / Dynamic Island를 장식 요소로 사용하지 않음
- background는 full bleed 가능
- interactive controls는 safe area 안에 배치

## 80.2 Touch Rule

Primary / Secondary interactive control:
- 최소 약 44×44 CSS px 수준 터치영역 권장
- 작은 아이콘은 시각 크기보다 큰 invisible hit area 확보 가능
- `REC`, Pause, Complete, Share, Record Start/Stop은 특히 축소 금지
- 카드 전체가 버튼인지 내부 CTA가 버튼인지 모호하면 FAIL
- hover 전용 의미 금지

## 80.3 One-Screen Priority

FOCUS 핵심 화면에서 가능한 한 한 화면 안에 유지:
- 타임어택 title
- mission
- Full Clock
- remaining
- target
- REC if applicable
- Pause
- Complete

작은 화면에서 우선 줄일 것:
1. decoration
2. secondary copy
3. spacing
4. panel padding
5. noncritical illustration scale

핵심 버튼/시계/시간 정보부터 줄이면 FAIL.

## 80.4 Text / Typography

- 한국어 실제 렌더링 가독성 우선
- 생성 이미지 속 임의 한글을 최종 UI 텍스트로 사용하지 않음
- 실제 앱에서는 HTML/CSS text로 배치
- 핵심 수치와 CTA는 이미지에 baked text로 넣지 않음
- Dynamic Type 확대 시 레이아웃 붕괴 방지
- 한 줄 강제 고정으로 말줄임이 핵심 의미를 없애면 FAIL
- 버튼은 기능 의미가 한눈에 읽혀야 함

## 80.5 Illustration Asset Rule

초고밀도 일러스트는:
- 배경/프로필/Guide/Share Card asset으로 사용
- UI text와 기능 버튼은 별도 native layout으로 분리
- 캐릭터가 CTA, 시계, waveform, 결과 수치를 가리지 않음
- 모바일에서 필요 이상으로 큰 원본을 그대로 decode하지 않도록 파생 asset 사용
- WebP/AVIF 우선 검토 + PNG fallback
- 투명 캐릭터 asset은 alpha edge artifact 검수
- image aspect ratio 고정
- CLS 방지를 위해 width/height/aspect-ratio 예약

## 80.6 Motion

- 60fps 목표
- 길잡이 entrance는 짧게
- transform/opacity 중심
- layout thrashing 유발 animation 금지
- `prefers-reduced-motion` 대응
- animation이 끝나기 전에도 핵심 버튼 사용 가능
- animation 실패가 기능을 막지 않음

## 80.7 UI State Completeness

모든 주요 화면은 최소 다음 상태를 가진다:
- default
- loading
- empty
- disabled
- error
- retry
- completed
- offline where relevant

“예쁜 정상 상태 한 장”만 있고 실패/대기 상태가 없으면 배포용 UI PASS가 아니다.

---

# 81. AVATAR STYLE SYSTEM — HARD LOCK

사용자 사진 기반 Illustration Avatar는 **선택 가능한 스타일 시스템**으로 제공한다.

## 81.1 Default Styles

### STYLE A — Ready & Set Signature 2.5D Editorial
기본 추천.
- 실제 얼굴 정체성 유지
- 밝고 따뜻한 자연광
- 섬세한 hair / fabric / skin / eye detail
- 약간의 입체감
- premium editorial mobile illustration
- HOME / Share Card와 가장 잘 어울림

### STYLE B — Soft Storybook
- 부드러운 선
- 따뜻한 종이/페인팅 감성
- 약간 더 감성적
- 유아틱한 과장 금지

### STYLE C — Clean Graphic Character
- 형태가 간결
- 색면과 선이 명확
- 작은 화면 / Profile icon에서 강한 가독성
- generic flat avatar가 되지 않도록 얼굴 identity 유지

### STYLE D — Natural Soft Portrait
- 원본 사진과 가장 가까움
- 일러스트 효과는 얕게
- 피부/헤어를 과도하게 보정하지 않음

## 81.2 Style Continuity

선택한 Avatar Style은:
- HOME
- Profile
- Result
- Share Card
- Optional Recording reaction

에 동일 Identity/Style로 이어진다.

화면마다 style이 바뀌면 FAIL.

## 81.3 User Control

```text
사진 찍기 / 선택
→ 스타일 미리보기 4종
→ 선택
→ 다시 만들기
→ 이 스타일로 적용
```

Settings:
- 스타일 다시 선택
- 사진 다시 찍기
- Avatar 다시 생성
- 원본에 가까운 버전으로 변경

Mission/Result/Recording 데이터는 유지.

---

# 82. FOCUS CLOCK PRESERVATION / UPGRADE LOCK — HARD LOCK

타이머 시안은 `거위.zip`의 승인 Focus UI 구조를 기준 골조로 사용한다.

**새 Focus 화면을 다른 컨셉으로 재디자인하지 않는다.**

보존:
- Yellow dominant background
- 큰 `타임어택` title
- 짧은 Mission pill
- 하단 Dark Control Panel
- 남은 시간 / 목표 시간 구조
- Pause / Complete
- BGM / secondary status
- 기존 전체 밀도와 layout rhythm

업데이트:
- 기존 검은 테두리 벽시계 느낌 제거
- White/Ivory **Full Analog Clock Hero**
- thin refined rim
- 선명한 numeral
- 정교한 black hands
- subtle second hand
- subtle material depth/shadow
- generic 상품 사진 느낌 금지
- 강제 crop 금지

영어 문장 녹음 선택 시:

```text
남은 시간        ● REC        목표 시간
24:52                         25:00
```

REC:
- 중앙
- red dot motif
- 실제 터치영역 확보
- 문장 녹음 Mission에만 노출
- 완료 후 complete state
- Focus visual hierarchy를 무너뜨리지 않음

---

# 83. DYNAMIC SHARE CARD CHARACTER DIRECTION ENGINE — HARD LOCK

공유카드는 고정 캐릭터 배치 템플릿이 아니라 **그날 결과의 뉘앙스에 따라 Character Direction이 달라지는 작은 장면**이다.

입력:

```text
shareMoment
+ missionType
+ completionState
+ targetDelta
+ issueLevel
+ recordingCompleted
+ actualCoachingObservation?
+ selectedAvatarStyle
+ mainGuide
+ guestGuide?
```

출력:

```text
avatarPose
guidePose
guestPresence
facialExpression
relativeDistance
sceneComposition
headline
guideLine
supportingMotif
```

## 83.1 Character Hierarchy

- USER = 주인공
- MAIN GUIDE = 반응/동행
- GUEST GUIDE = Recording Duo가 실제 있었을 때 선택적으로 등장
- 결과 수치 = 반드시 읽히는 정보
- 캐릭터가 결과 정보를 가리면 FAIL

## 83.2 Pre-Mission Share

정서:
- 출동 전
- 기대
- 약간의 긴장
- 응원 요청

장면 예:
- 사용자 Avatar가 준비 자세
- Main Guide가 살짝 가족 쪽을 바라보며 응원 요청
- Guest는 기본 미등장

## 83.3 Excellent / Fast Complete

- 사용자: 살짝 의기양양
- Main Guide: 시계를 보고 놀람/능청 반응
- Headline: `엣헴~! 오늘 좀 했습니다.`
- 정보: target / focus / TIME SAVE

## 83.4 On Target

- 사용자와 Guide가 시계를 같이 확인
- `오? 계산대로인데?`

## 83.5 Overtime but Complete

- 사용자: 지쳤지만 완료
- Guide: 기다렸다는 듯 따뜻한 반응
- `헤헤… 조금 늦었습니다. 그래도 작전 완료!`
- red failure visual 금지

## 83.6 Interrupted but Complete

- 둘 다 약간 지친 표정 가능
- 분위기는 밝음
- `오늘은 사건이 좀 많았습니다.`
- 아이의 실수를 웃음거리로 만들지 않음

## 83.7 English Recording Complete

Recording Duo가 실제 수행된 경우:
- USER + Main Guide + 오늘의 Guest
- 작은 microphone / waveform / recording motif 가능
- 실제 AI observation이 있을 때만 구체적 성장 문구 사용
- 근거 없는 `목소리가 커졌어` 등의 변화 주장 금지

## 83.8 Style Consistency

Share Card의 USER Avatar는 사용자가 선택한 Avatar Style을 그대로 사용한다.

Main/Guest Guide는 동일 character identity를 유지하고:
- 표정
- pose
- gesture
만 상황에 따라 변경한다.

---

# 84. SHARE CARD DEPLOYMENT UI RULE — HARD LOCK

공유카드는 screenshot 캡처를 Primary로 사용하지 않는다.

```text
Structured Data
→ Share Scene Resolver
→ Dedicated Card Renderer
→ Image File
→ Short Caption
→ Native Share Sheet
```

권장 출력 비율:
- 1:1 기본
- 4:5 optional
- 기기 화면 screenshot 비율을 공유 카드 기준으로 사용하지 않음

Rendering:
- 텍스트는 renderer에서 실제 font로 그린다.
- 캐릭터 asset은 transparent layered image.
- 결과 값은 live data에서 주입.
- card generation 시 실제 Mission/Result 값과 1:1 일치.
- stale cached data로 이전 결과가 공유되면 FAIL.

---

# 85. DEPLOYABLE PWA RULES — HARD LOCK

## 85.1 Required Files

Production package 최소:
- `index.html`
- CSS bundle/files
- JS bundle/files
- `manifest.json` 또는 `manifest.webmanifest`
- `sw.js`
- app icons 192 / 512
- maskable icon 권장
- `.nojekyll` when GitHub Pages
- local/offline critical assets

## 85.2 PWA Manifest

검사:
- name = Ready & Set
- short_name 일관성
- start_url
- scope
- display = standalone
- theme_color
- background_color
- icon 경로
- icon MIME
- relative path / base path

HTML title / manifest / Apple standalone 이름이 서로 다르면 FAIL.

## 85.3 Service Worker

- CACHE_VERSION 명시
- 새 Revision에서 cache version 갱신
- install/activate/fetch error 방어
- old cache cleanup
- navigation fallback
- core shell offline
- 외부 API 응답을 무분별하게 영구 cache하지 않음
- 녹음/audio blob을 일반 static cache와 섞지 않음

## 85.4 GitHub Pages

정적 배포 시:
- asset path 상대경로 검증
- repository subpath 대응
- root hard-coded `/assets/...` 사용 여부 검사
- `.nojekyll`
- Service Worker scope 검증
- 404 fallback / navigation 검증

## 85.5 Data Migration

기존 Time Attack PWA에서 Ready & Set으로 업데이트 시:
- 기존 mission/result 보존
- active session 안전 복구
- schemaVersion migration
- guide/profile 신규 필드 default
- recording field 추가
- migration 실패 시 기존 데이터 삭제 금지
- backup/recovery path 확보

## 85.6 IndexedDB / Binary Data

Recording:
- audio blob은 IndexedDB 등 binary suitable storage
- localStorage base64 대용량 저장 금지
- metadata와 blob 분리
- quota failure 처리
- final recording 삭제 정책
- orphan temp take cleanup

## 85.7 Microphone / Recording

- HTTPS / secure context
- permission denied
- permission revoked
- no mic
- interruption
- unsupported MediaRecorder
- MIME detection
- pause/resume browser differences
- background handling

모두 별도 처리.

## 85.8 Audio Format

- 파일명과 실제 포맷 일치
- `.m4a` 확장자 rename 금지
- MIME/container/codec 검증
- 실제 playback test
- conversion 실패 fallback
- Original Recording 보존

## 85.9 Web Share

- `navigator.share`
- file share support detect
- `navigator.canShare({files})` 검토
- image+text
- audio file
- user cancel 분리
- unsupported fallback
- share 실패가 result 저장을 rollback하지 않음

## 85.10 Offline / Network

Offline Core:
- Home
- Mission setup
- Timer
- Pause/Resume
- local Result
- History
- local Recording
- cached assets

Online Enhancement:
- AI coaching
- cloud TTS
- server cleanup
- Calendar
- external music

Network outage가 Timer를 막으면 FAIL.

---

# 86. DEPLOYMENT ENVIRONMENT MATRIX — HARD LOCK

배포 전 최소 검증:

```text
iPhone Safari browser
iPhone installed PWA
Android Chrome
Android installed PWA
Desktop Chrome/Edge basic fallback
```

화면:
- 320px class
- 375/390px class
- 430px class

상태:
- fresh install
- update from previous version
- offline launch
- online → offline
- background → resume
- screen lock → resume
- share app 이동 → return
- microphone interruption

---

# 87. RELEASE ARTIFACT RULE — HARD LOCK

배포용 ZIP에는 최소:

```text
/ app files
/ assets
manifest
service worker
README_DEPLOY.md
VALIDATION_REPORT.md
VERSION.json
```

VERSION.json 예:

```json
{
  "product": "Ready & Set",
  "masterRevision": "REV_05",
  "appVersion": "...",
  "schemaVersion": "...",
  "cacheVersion": "..."
}
```

README:
- deployment steps
- environment requirements
- OAuth/backend required areas
- known limitations
- rollback note

VALIDATION_REPORT:
- PASS
- FAIL
- UNKNOWN

을 구분한다.

실기기 미검증 항목을 PASS로 작성하지 않는다.

---

# 88. DEPLOYABLE UI SELF-VALIDATION GATE

- [ ] 화면이 실제 모바일 비율로 구현 가능한가?
- [ ] Safe Area가 보장되는가?
- [ ] 주요 Touch Target이 충분한가?
- [ ] HTML/CSS text로 구현 가능한가?
- [ ] Illustration이 CTA를 가리지 않는가?
- [ ] 작은 화면에서도 핵심 기능이 남는가?
- [ ] loading/error/offline 상태가 있는가?
- [ ] Reduced Motion이 가능한가?
- [ ] 캐릭터 없는 fallback에서도 기능이 동작하는가?
- [ ] Full Clock이 실제 responsive layout에서 보존되는가?
- [ ] REC가 조건부로만 노출되는가?

하나라도 모호하면 배포용 UI PASS 금지.

---

# 89. DEPLOYABLE PWA SELF-VALIDATION GATE

- [ ] manifest parse?
- [ ] SW syntax?
- [ ] cache version?
- [ ] icon files?
- [ ] relative paths?
- [ ] GitHub Pages subpath?
- [ ] fresh install?
- [ ] update install?
- [ ] offline launch?
- [ ] active session resume?
- [ ] migration?
- [ ] microphone?
- [ ] recording interruption?
- [ ] actual MIME?
- [ ] actual M4A if required?
- [ ] share image?
- [ ] share audio?
- [ ] share cancel?
- [ ] AI failure fallback?
- [ ] Calendar failure fallback?
- [ ] fatal console errors = 0?

실기기/외부 서비스가 필요한 항목은 검증 전 `UNKNOWN`.

`UNKNOWN`을 PASS로 올리면 MASTER 위반.

---

# 90. REV_05 DEPLOYMENT FLOW — HARD LOCK

```text
MASTER REV_05
→ Golden UI References
→ Production-capable UI Mockup
→ UI Self-Validation
→ Asset Production
→ PWA Integration
→ Static Validation
→ Local Browser Test
→ Installed PWA Test
→ Recording / Share / Resume Test
→ Migration Test
→ Regression Test
→ Deployment Candidate ZIP
→ Final Deployment Gate
→ GitHub / Hosting Deploy
→ Post-deploy Smoke Test
→ PASS
```

---

# 91. REV_05 FINAL DEPLOYMENT PRINCIPLE

> **Ready & Set의 시안은 배포와 분리된 예쁜 이미지가 아니다. 처음부터 실제 모바일 PWA로 구현 가능한 구조여야 한다.**

> **배포용 PWA는 MASTER의 시각·기능·캐릭터·공유·녹음 규칙을 희생해서는 안 된다.**

> **사용자 Avatar와 길잡이는 Ready & Set의 감정 경험을 강화하지만, Timer·Mission·Recording·Result의 핵심 정보 위계를 침범하지 않는다.**

> **공유카드는 사용자 캐릭터와 길잡이가 결과의 뉘앙스에 맞게 반응하는 작은 에피소드이되, 실제 데이터와 일치하는 배포 가능한 렌더링 결과여야 한다.**

> **배포 전 실제 결과를 다시 검증하고, PASS·FAIL·UNKNOWN을 정직하게 분리한다.**

**END OF READY & SET UI MASTER LOGIC REV_05**


---

# 92. REV_06 — OFFICIAL END-TO-END RELEASE CONTROL LOOP — HARD LOCK

REV_06는 REV_05의 모든 HARD LOCK을 보존하면서, MASTER 보완부터 실제 배포 후 검증과 다음 MASTER 개선까지의 전 과정을 하나의 공식 Release Control Loop로 고정한다.

이 순서는 Ready & Set의 최상위 제작·검증·배포 프로세스이며, 하위 구현 절차가 이 순서와 충돌할 경우 본 절차를 우선한다.

```text
MASTER 보완
→ 시안 제작
→ 시안 검토 / Self-Validation
→ 배포용 UI 확정
→ 기능 검토
→ 기능 명세 확정
→ PWA 구현
→ 실제 브라우저 검증
→ 기능·데이터·PWA 테스트
→ 오류 수정 / 재검증
→ Release Candidate Freeze
→ 배포
→ 실제 배포 URL 테스트
→ Install / Offline / Cache 검증
→ Release PASS
→ 실제 사용 피드백
→ 다음 MASTER 개선
```

---

# 93. PHASE 01 — MASTER 보완

입력:
- 최신 검증 MASTER
- 사용자 신규 요구사항
- 실제 사용 피드백
- 기존 배포본
- 승인 Visual Reference
- 발견된 오류 / Regression

검토:
- 충돌
- 중복
- 후퇴
- 누락
- Design Drift
- State/Data 영향
- PWA/배포 영향

결과:
- ADOPT / ADJUST / HOLD / REJECT
- Revision 증가 필요 여부
- MASTER Self-Validation

MASTER PASS 전에는 신규 시안 제작으로 넘어가지 않는다.

---

# 94. PHASE 02 — 시안 제작

시안은 최신 MASTER와 Golden Reference를 기준으로 제작한다.

Ready & Set의 경우 최소 비교:
- 승인 HOME
- Mission Selector
- Focus Yellow UI
- Full Clock
- REC
- Recording Event
- Main / Guest Guide
- Avatar Style
- Result
- Dynamic Share Card

새로운 디자인을 만들었다는 이유만으로 개선으로 판단하지 않는다.

---

# 95. PHASE 03 — 시안 검토 / SELF-VALIDATION

실제 생성 결과를 다음으로 분류한다.

```text
PRESERVED
IMPROVED
CHANGED
REGRESSED
UNKNOWN
```

검사:
- MASTER 준수
- 기존 컨셉 보존
- 캐릭터/길잡이 통합성
- 사용자=주인공 위계
- 초고밀도 일러스트 품질
- Full Clock
- REC 위치
- Safe Area
- Touch target
- 한국어 오탈자
- 모바일 밀도
- 구현 가능성

`REGRESSED`가 있으면 수정.

중요한 `UNKNOWN`이 있으면 배포용 UI 확정 금지.

---

# 96. PHASE 04 — 배포용 UI 확정 — UI FREEZE GATE

시안 중 실제 PWA 구현 기준이 될 UI를 확정한다.

확정 항목:
- screen hierarchy
- component hierarchy
- spacing
- typography
- colors
- illustration assets
- Avatar Style behavior
- Guide behavior
- Focus Clock
- REC
- modal / bottom sheet
- Recording UI
- Result
- Share Card
- responsive behavior
- loading/error/offline states

이 시점부터 승인 UI는 **Golden UI Reference**가 된다.

기능 구현 편의를 이유로 승인 UI를 임의 변경하지 않는다.

변경 필요 시:
`UI Change Request → 영향 분석 → 승인 → UI Freeze 갱신`

---

# 97. PHASE 05 — 기능 검토

배포용 UI 확정 후 화면별 기능을 다시 검토한다.

검사:
- 모든 CTA의 실제 action
- 상태 전이
- Back/Cancel
- Pause/Resume
- Recording
- AI failure
- Share
- Calendar
- Profile
- Avatar
- Guide
- Guest random
- data persistence
- offline
- interruption
- error recovery

UI에 존재하지만 기능 정의가 없는 버튼이 남으면 FAIL.

기능은 있는데 UI 진입점이 없으면 FAIL.

---

# 98. PHASE 06 — 기능 명세 확정 — FUNCTION FREEZE GATE

PWA 구현 전에 기능 명세를 동결한다.

각 기능은 최소:
```text
Feature ID
Purpose
Entry Condition
Input
State
Action
Output
Persistence
Error
Fallback
Resume Behavior
Analytics/Log if needed
Validation Criteria
```

를 정의한다.

특히:
- Timer formulas
- Multi Mission
- REC condition
- Recording Event
- BGM routing
- System Wait
- Original/Clean recording
- actual M4A
- AI Guide
- Guide Duo
- Dynamic Share Card
- Native Share
- Calendar
- Migration

은 모호한 상태로 구현 단계에 넘기지 않는다.

---

# 99. PHASE 07 — PWA 구현

구현은:
```text
Latest MASTER
+ Golden UI Reference
+ Frozen Function Spec
```
세 가지를 동시에 기준으로 한다.

구현 중 임의 디자인 변경 금지.

구현 중 기능 명세 변경이 필요한 경우:
```text
Implementation Issue
→ 영향 분석
→ MASTER/UI/Function Spec 중 변경 대상 결정
→ 승인
→ 관련 Freeze 갱신
→ 구현 재개
```

---

# 100. PHASE 08 — 실제 브라우저 검증

정적 코드 검토만으로 PASS하지 않는다.

실제 브라우저에서:
- layout
- touch
- scroll
- safe area
- keyboard
- timer
- visibility/background
- microphone
- audio
- share
- file
- offline
- install prompt/standalone behavior

을 검증한다.

가능하면 개발 서버와 실제 hosting 환경을 모두 확인한다.

---

# 101. PHASE 09 — 기능·데이터·PWA 테스트

## Function
- Mission
- Timer
- Pause
- REC
- Recording
- Guide
- Result
- Share
- Calendar
- Settings

## Data
- create
- update
- persist
- reload
- migration
- corruption recovery
- audio blob
- deletion
- session restore

## PWA
- manifest
- icons
- SW
- cache
- offline
- install
- update
- navigation
- base path
- standalone

각 결과:
`PASS / FAIL / UNKNOWN`

---

# 102. PHASE 10 — 오류 수정 / 재검증 LOOP

```text
FAIL 발견
→ Root Cause
→ 영향 범위
→ 수정
→ 해당 기능 재검증
→ 연관 기능 Regression Test
→ 전체 Gate 재검증
```

증상만 가리는 임시 수정으로 PASS하지 않는다.

오류 수정이 다른 기능을 후퇴시키면 Release Candidate로 넘어가지 않는다.

---

# 103. PHASE 11 — RELEASE CANDIDATE FREEZE — HARD LOCK

Release Candidate Freeze는:
- UI Freeze
- Function Freeze
- Data Schema
- assets
- app version
- cache version
- deployment configuration

이 동결된 배포 직전 상태다.

RC 이후 금지:
- 신규 기능
- 신규 디자인 실험
- 카피 전면 변경
- schema 구조 변경
- 캐릭터 시스템 변경

허용:
- Release Blocking Bug 수정
- security/privacy critical fix
- 명확한 데이터 손실 방지 수정

RC 수정 발생 시 관련 테스트를 다시 수행하고 RC build/version을 갱신한다.

---

# 104. PHASE 12 — 배포

배포 artifact:
- production app files
- assets
- manifest
- service worker
- VERSION.json
- README_DEPLOY
- VALIDATION_REPORT

배포 시:
- build/version 확인
- cache version 확인
- base path
- environment configuration
- backend endpoint
- OAuth redirect
- HTTPS
- service worker scope

을 확인한다.

---

# 105. PHASE 13 — 실제 배포 URL 테스트 — HARD LOCK

배포 성공 메시지만으로 Release PASS하지 않는다.

**실제 사용자가 접속하는 production URL**을 직접 기준으로 검증한다.

검사:
- URL 정상 접근
- 첫 화면
- asset 404
- console fatal error
- manifest
- service worker
- API
- microphone secure context
- Share
- Calendar redirect
- refresh/deep navigation
- mobile layout
- deployed version 표시/추적

Local PASS ≠ Production PASS.

---

# 106. PHASE 14 — INSTALL / OFFLINE / CACHE 검증 — HARD LOCK

실제 배포 URL 기준:

## Install
- 설치 가능
- 아이콘
- 이름 Ready & Set
- standalone launch
- safe area

## Offline
- 설치 후 offline launch
- Home
- Mission
- Timer
- local Result
- cached assets
- network enhancement graceful failure

## Cache / Update
- 신규 버전 배포
- stale cache 제거
- 새 asset 반영
- 이전 session/data 유지
- old SW와 new app 충돌 없음

`새 버전을 배포했는데 이전 UI가 계속 보임` = FAIL.

---

# 107. PHASE 15 — RELEASE PASS GATE — HARD LOCK

Release PASS는 다음을 의미한다.

- MASTER PASS
- Golden UI PASS
- Function Spec PASS
- Browser PASS
- Function PASS
- Data PASS
- PWA PASS
- Production URL PASS
- Install PASS
- Offline PASS
- Cache/Update PASS
- Regression PASS
- Release Blocking FAIL = 0
- Critical UNKNOWN = 0

Release PASS 전에는 사용자에게 `최종 배포 완료`라고 표현하지 않는다.

---

# 108. PHASE 16 — 실제 사용 피드백

Release PASS 이후 실제 사용에서 확인:
- 과제 선택이 자연스러운가
- 아이가 스스로 시작하는가
- Timer가 압박스럽지 않은가
- REC 진입이 자연스러운가
- Recording Event가 너무 긴가
- Guide가 재미있지만 방해되지 않는가
- Avatar Style 만족도
- Share Card를 실제 가족에게 보내고 싶은가
- PWA 실행/설치 불편
- Offline/Resume 문제
- 반복적으로 발생하는 오류

실사용 피드백은 즉시 Production을 임의 변경하는 명령이 아니다.

다음 MASTER 개선 입력으로 등록한다.

---

# 109. PHASE 17 — 다음 MASTER 개선

```text
실사용 피드백
+ 오류 로그
+ 사용자 요청
+ Regression 기록
+ 기술 제약
→ 영향 분석
→ ADOPT / ADJUST / HOLD / REJECT
→ 다음 MASTER Revision
→ 전체 Release Control Loop 재시작
```

이로써 Ready & Set은 일회성 `완성본`이 아니라 검증 가능한 Revision 체계로 발전한다.

---

# 110. FREEZE HIERARCHY — HARD LOCK

Ready & Set은 다음 세 가지 Freeze를 구분한다.

## MASTER FREEZE
Revision의 제품 원칙과 구조를 확정.

## UI FREEZE
실제 구현 기준 Golden UI를 확정.

## FUNCTION FREEZE
실제 구현 기능/상태/데이터 계약을 확정.

## RELEASE CANDIDATE FREEZE
배포 후보 전체를 동결.

하위 Freeze가 상위 MASTER를 임의로 변경할 수 없다.

---

# 111. CHANGE AFTER FREEZE RULE

Freeze 이후 변경 요청:

```text
Change Request
→ 변경 이유
→ MASTER 영향
→ UI 영향
→ Function 영향
→ Data 영향
→ PWA 영향
→ Regression 위험
→ ADOPT / ADJUST / HOLD / REJECT
```

채택 시 필요한 단계까지 되돌아간다.

예:
- 색상 미세 조정 → UI Freeze
- REC 상태 변경 → Function Freeze + UI
- Timer 계산 변경 → MASTER/Function/Data 검토
- schema 변경 → Function/Data/Migration/RC 재검증
- 앱 철학 변경 → MASTER부터 재시작

---

# 112. REV_06 SELF-VALIDATION

- [x] MASTER 개선이 시작점인가?
- [x] 시안과 배포용 UI 확정을 분리했는가?
- [x] 시안 Self-Validation이 있는가?
- [x] UI 확정 후 기능을 별도 검토하는가?
- [x] Function Freeze가 있는가?
- [x] 구현 후 실제 브라우저 검증이 있는가?
- [x] Function/Data/PWA 테스트가 분리되어 있는가?
- [x] 오류 수정 후 Regression 재검증이 있는가?
- [x] RC Freeze가 있는가?
- [x] 실제 Production URL 테스트가 있는가?
- [x] Install/Offline/Cache 검증이 Release PASS 전에 있는가?
- [x] 실사용 피드백이 다음 MASTER로 환류되는가?
- [x] Freeze 이후 변경의 되돌림 규칙이 있는가?

**REV_06 RELEASE CONTROL LOOP SELF-VALIDATION: PASS**

---

# 113. REV_06 FINAL HARD LOCK

> **Ready & Set의 공식 제작 순서는 `MASTER → 시안 → 시안검증 → 배포용 UI 확정 → 기능검토 → 기능명세 확정 → PWA 구현 → 실제 브라우저 검증 → 기능·데이터·PWA 테스트 → 오류수정/재검증 → RC Freeze → 배포 → 실제 URL 테스트 → Install/Offline/Cache 검증 → Release PASS → 실사용 피드백 → 다음 MASTER`이다.**

> **Local PASS는 Production PASS가 아니다.**

> **Deploy Success는 Release PASS가 아니다.**

> **실제 배포 URL과 설치된 PWA에서 검증되기 전에는 최종 배포 완료로 간주하지 않는다.**

> **Freeze 이후 변경은 영향 분석 없이 직접 반영하지 않는다.**

> **실사용 피드백은 다음 MASTER Revision으로 환류한다.**

**END OF READY & SET UI MASTER LOGIC REV_06**
