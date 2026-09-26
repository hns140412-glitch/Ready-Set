# READY FAMILY + BADGE PLANNER COMBINED VALIDATION — 2026-09-26

This integration branch explicitly combines **DRAFT** Ready PR #110 (family relation and gift permission) with **DRAFT** PR #111 (earned-only day/week badges), both based on Ready main `1d672d862cc8329a5f19ca91c9ed6a338752f5ae`. It does not imply either draft was independently merged or deployed. A combined main-ready branch prevents losing shared `app.js` and Ready Integration CI changes across the two parallel PRs.

Source preservation:
- PR #110 verified, explicitly provisioned `FAMILY_ADULT` relationship and permission model, server read-only permission endpoint, Planner sync restrictions, existing Parent/Child privilege isolation.
- PR #111 read-only signed-child-month badge presentation shell, no unapproved assets, no automatic badge award, no Planner goal quota, server adapter still absent.
- Combined `app.js` contains BOTH correct adult family login labels and the optional read-only badge render at the bottom of the Planner. Combined CI contains BOTH original per-feature regressions.
- New combined-browser regressions check FAMILY_ADULT never inherits Parent Planner or Child badge rail, and SIBLING child cannot display another child's forged badge month.

Real server Award Ledger backend, production child-authenticated badge reader, final approved catalogue/assets, actual production family invitation and gift permission grant workflow remain OPEN. This combined draft is held from main until main→Netlify auto-deploy linkage is explicitly cleared; this operation does NOT deploy anything or approve art.
