# Ready & Set Reborn — Implementation Request Trace

Status: EXPERIMENTAL / BRANCH-ONLY / NOT CANONICAL / NOT RELEASED
Branch: `taky-reborn-mobile-2026-09-06`
Date: 2026-09-06

## Purpose

오늘 구현 범위를 사용자 요구사항 이력에 따라 잠그고, 구현 결과와 요구사항 사이의 누락을 탐지하기 위한 경량 Request Trace이다. 이 문서는 REV_06 canonical master를 대체하지 않는다.

## Active requests

| ID | User intent / request | Relation | Implementation status |
|---|---|---|---|
| R-001 | Ready & Set을 오늘 실제 구현하는 것이 목표 | CURRENT GOAL | IN PROGRESS |
| R-002 | 아이 화면은 주간 계획 / 오늘 계획 / 실행 3화면을 Swipe로 이동 | CORE UI | PROTOTYPE |
| R-003 | 3화면은 끝단이 아니라 순환 Swipe 구조 | EXTEND | PROTOTYPE |
| R-004 | 기본 진입은 TODAY, 진행 중 Session이 있으면 실행 화면 복귀 우선 | STATE RULE | PROTOTYPE |
| R-005 | Swipe로 다른 화면을 보더라도 타이머/Session은 계속 유지 | STATE RULE | PROTOTYPE |
| R-006 | Phone / Pad와 Portrait / Landscape를 병행 지원 | RESPONSIVE | PROTOTYPE |
| R-007 | Pad는 휴대폰 화면 단순 확대가 아니라 넓은 공간을 활용 | RESPONSIVE | PROTOTYPE |
| R-008 | 부모는 타이머 대신 오늘 진행 화면을 봄 | ROLE VIEW | PROTOTYPE |
| R-009 | 부모 오늘 진행에는 진행 흐름 / 도움이 필요한 부분 / 칭찬할 부분 / 다음 계획 참고점이 필요 | ROLE VIEW | PROTOTYPE |
| R-010 | 개선은 아이의 잘못이 아니라 앞으로의 계획 기준/참고 후보라는 의미 | WORDING / MODEL | PROTOTYPE |
| R-011 | MASTER 조정 계획은 주간 계획과 오늘 계획 모두 갱신되어 아이가 인지 | PLAN SYNC | PROTOTYPE MODEL |
| R-012 | 부모는 하루 끝에 조정된 시간표/Daily Review를 봄 | DAILY REVIEW | PROTOTYPE |
| R-013 | 학습 계획·운영 알림은 부모만, 다른 가족관계에는 노출하지 않음 | ACCESS | MODEL ONLY |
| R-014 | 다른 가족에게는 아이가 선택한 성취/자랑은 공유 가능 | SHARE EXCEPTION | MODEL ONLY |
| R-015 | 마지막 과제 완료 후 잠자리 준비 전에 아이가 `오늘 하루 끝!`으로 하루 마감 | DAY CLOSE | PROTOTYPE |
| R-016 | `해냈어!` 축하는 과제/도전 완료 및 하루 끝에 모두 사용 가능하나, 많이 늦어진 날의 연출 강도는 상황에 맞춰 조절 | CELEBRATION | HOLD — audio integration later |
| R-017 | 길잡이는 전체 실행을 함께 하는 동행형 Guide이며 단순 완료 확인자가 아님 | GUIDE | PRESERVE / NEXT INTEGRATION |
| R-018 | 길잡이 질문 후 가능한 경우 음성 답변을 자연스럽게 받음 | VOICE GUIDE | NEXT INTEGRATION |
| R-019 | 부모 도움/채점 요청은 부모 역할 내부에서 라우팅하며 다른 가족은 후보가 아님 | PARENT ROUTING | MODEL ONLY |
| R-020 | 사용자에게 복잡한 설정을 요구하지 않고 Master default + 예외 음성 입력을 선호 | UX RULE | PRESERVE |

## Coverage rule

모든 구현 대상 요청은 `PROTOTYPE / IMPLEMENTED / HOLD / MODEL ONLY / NEXT INTEGRATION / CONFLICT / UNVERIFIED` 중 하나의 상태를 가져야 한다. 상태가 없는 요청은 handoff 완료로 보지 않는다.

## Current implementation boundary

이번 첫 구현 패스는 기존 REV_06 앱을 파괴하지 않고, 실험 브랜치에서 다음 Shell을 독립 프로토타입으로 검증한다.

`CHILD: TODAY ↔ TIMER+GUIDE ↔ WEEK`

`PARENT: TODAY ↔ TODAY PROGRESS ↔ WEEK`

동일한 plan state를 역할별 View로 표시하고, `activeView`와 `sessionState`를 분리한다. 실제 REV_06 통합은 Shell 동작 검증 후 최소 변경으로 진행한다.
