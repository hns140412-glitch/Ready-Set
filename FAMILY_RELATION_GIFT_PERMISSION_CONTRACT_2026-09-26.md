# READY FAMILY RELATIONS & PRAISE GIFT PERMISSION — 2026-09-26

## Direct user authority
Family is NOT synonymous with Parent. Model relationship, app capability role and permission independently. Parent has no personal unearned/locked badge atlas. Family praise Gift uses integer 1–5 gems per individual gift and a separately approved family-praise badge catalog.

## Existing Ready runtime constraints
- Current app's `PARENT` is the planner administration role, and `CHILD` is the learner role. Do not turn Grandparent/Guardian into either role merely to make a gift available.
- This slice supports separately **admin-provisioned** Identity `appMetadata.roles=['FAMILY_ADULT']`, an explicit `appMetadata.family_id`, and `appMetadata.family_relation` in `GRANDPARENT`, `GUARDIAN`, `AUNT_UNCLE`, `OTHER_ADULT_FAMILY`. Existing Parent/Child default relationships remain compatible; a Child may have `SIBLING` relationship. Relationship is descriptive and not permission.
- Conflicting application roles or mismatched role/relation fail closed.
- `appMetadata.family_permissions=['FAMILY_PRAISE_GIFT']` is an independent trusted provider grant. PARENT, FAMILY_ADULT, CHILD/SIBLING, or another relation is not sufficient by itself. No grant is made on signup, family link, or login. User-editable `userMetadata` cannot confer it.
- A trusted server must call `authorizeFamilyGiverFromIdentityUser(user, scope)` using the actual verified account for EACH requested gift action, verifying the same `family_id`, `giver_member_id`, action and target. The child target must then independently be verified against current provider family membership by the TAKY V2 gift service.
- Read-only `GET /api/family/gift-permission` reports current server Identity capability. It is not a credential or authority for a later gift POST.
- `FAMILY_ADULT` is explicitly barred from existing Ready remote sync POST and from Parent Planner UI; the historical Parent/Child authority stays unchanged.

## Integration / not yet connected
TAKY central counterpart: `BADGE/family-praise-gift.js`, `BADGE/family-praise-gift-journal.js` in TAKY main after PR #149. This Ready slice provides the server-side identity and permission predicate only, NOT a new live Gem transfer endpoint.

Remaining OPEN: a consent-based/authorized account invitation and server-side permission-management UI, verified child target lookup, production transactional durable Gift Journal/Gem Wallet/Badge Collection adapter, approved praise badge art, cross-repo package deployment and live QA. Do NOT use local Netlify Function filesystem for multi-device source of truth, or activate historical draft badges. Do not infer permission from relationship or let browser dictate application metadata. No Netlify deploy for this slice.
