# Ready & Set

Ready & Set은 학습 가족의 **베이스캠프 / Planner / 실행 세션 오케스트레이터**입니다.

## 현재 권위

제품·런타임·검증 기준은 다음 canonical 문서를 우선합니다.

- `READY_SET_CANONICAL_PRODUCT_CONTRACT.md`
- `READY_SET_RUNTIME_STATE_MODEL.md`
- `READY_SET_DECISION_LEDGER.md`
- `READY_SET_VALIDATION_STATUS.json`
- `READY_SET_VERSION_REGISTRY.json`

`Ready_Set_Ui_Master_Logic_REV_06.md`, `Ready_Set_Ui_Master_Logic_REV_07.md` 등 REV 문서는 현재 제품 권위가 아니라 **provenance/reference**입니다.

## 실행 구조

`Assignment FACT → Parent Confirm → Learning Master → Planner → TODAY → Session → Result/Carry-over`

Hide & Seek / Snap & Pop 같은 specialist 앱으로 이동해도 Ready & Set이 세션 소유권을 유지하며 `session_id / goal_id / task_id / lap_id` 연속성을 보존합니다.

Hide & Seek의 Memory Summary는 `SPECIALIST_MEMORY_ADVISORY_ONLY`로만 수신하며 Assignment FACT, 범위, 마감, 필수 오늘 학습량을 변경할 권한이 없습니다.

## 개발·검증 원칙

- branch first
- CI / Runtime 검증 우선
- 사용자를 디버거·테스터로 사용하지 않음
- Netlify/Production은 frozen candidate 확정 전 디버깅 표면으로 사용하지 않음
- `CODED != CI_VERIFIED != RUNTIME_VERIFIED != DEVICE_VERIFIED != PRODUCTION_VERIFIED`

현재 renewal candidate는 Production/Device 검증을 주장하지 않습니다.
