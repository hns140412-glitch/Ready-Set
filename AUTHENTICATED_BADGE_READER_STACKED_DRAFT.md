# AUTHENTICATED BADGE READER — STACKED DRAFT

This branch is stacked on Ready PR #112 and is NOT deployed.

## What is implemented
- authenticated GET `/api/badges/progress?badge_id=...`
- authenticated GET `/api/badges/gate-bindings?badge_ids=...`
- server-side current Identity session resolution
- child self-scope / verified same-family Parent target scope
- TAKY signed Award Ledger projection through the vendored, SHA-pinned central reader modules
- Netlify Blobs strong reads and CAS-compatible ETag adapter
- server-only signing key requirement: `TAKY_BADGE_LEDGER_SIGNING_KEY_BASE64`
- fail-closed server gate catalog

Netlify Blobs supports ETag reads plus `onlyIfNew` / `onlyIfMatch` conditional writes. The endpoint only reads, but uses the same TAKY CAS ledger format so future writes can remain owner-controlled.

## Current badge gate catalog
The four candidates used by Snap's `방 정리 해주기` blessing are included with original stable name, source meaning and motif, but remain `approved:false / runtime_active:false` because the 60-badge source is still WORKING_DRAFT_NOT_ACTIVE.

Therefore a signed historical award alone cannot unlock the blessing; server catalog approval is also required.

## Still open
- provision the real signing key in an authorized deployment environment
- confirm/seed the production Award Ledger store
- approve/activate intended badge IDs through the owning badge governance process
- authenticated cross-app transport from Snap to this reader (do not pass credentials or trust URL child_id)
- external checkpoint anchoring/rollback policy
- no main merge or Netlify deploy in this draft
