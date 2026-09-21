# Ready & Set — Deployment Gate

현재 상태: **RENEWAL_IN_PROGRESS / NOT FROZEN / NOT PRODUCTION VERIFIED**

- Product generation: `READY_RENEWAL_01`
- Product version: `1.0.0-alpha.2`
- Version authority: `READY_SET_VERSION_REGISTRY.json`
- Device verification: OPEN
- Production verification: OPEN

## Required sequence
1. Branch implementation
2. Integration CI
3. Runtime E2E
4. Exact candidate SHA freeze
5. TAKY external-resource gate
6. One deliberate external deployment for the frozen goal
7. Physical-device verification
8. Production provenance / Identity / cloud / PWA verification

Netlify 또는 다른 호스팅은 반복 디버깅에 사용하지 않습니다.
실기기 검증 전에는 DEVICE_VERIFIED를, 운영 URL 검증 전에는 PRODUCTION_VERIFIED를 주장하지 않습니다.

과거 REV_06 / REV_07 배포 문서는 historical provenance이며 현재 배포 권위가 아닙니다.
