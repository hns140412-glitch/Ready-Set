#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
reg=json.loads((ROOT/"READY_SET_LEGACY_AUTHORITY_REGISTRY.json").read_text(encoding="utf-8"))
fail=[]

current=set(reg.get("current_authority") or [])
legacy=reg.get("legacy_authority") or []

required_current={
    "READY_SET_CANONICAL_PRODUCT_CONTRACT.md",
    "READY_SET_RUNTIME_STATE_MODEL.md",
    "READY_SET_DECISION_LEDGER.md",
    "READY_SET_VERSION_REGISTRY.json",
    "READY_SET_VALIDATION_STATUS.json",
}
if current!=required_current:
    fail.append("CURRENT_AUTHORITY_SET_INVALID")

for row in legacy:
    path=row.get("path")
    if not path or not (ROOT/path).exists():
        fail.append(f"LEGACY_FILE_MISSING:{path}")
        continue
    if row.get("current_authority") is not False:
        fail.append(f"LEGACY_CURRENT_AUTHORITY_TRUE:{path}")
    text=(ROOT/path).read_text(encoding="utf-8")
    if "ARCHIVED LEGACY AUTHORITY — NOT CURRENT SOURCE OF TRUTH" not in text:
        fail.append(f"LEGACY_BANNER_MISSING:{path}")
    if path=="Ready_Set_Focus_Golden_Reference_REV_01.md":
        if row.get("semantic_authority") is not False:
            fail.append("GOLDEN_REFERENCE_SEMANTIC_AUTHORITY_MUST_BE_FALSE")
        if "Current semantic authority: `READY_SET_CANONICAL_PRODUCT_CONTRACT.md` + `READY_SET_RUNTIME_STATE_MODEL.md`" not in text:
            fail.append("GOLDEN_REFERENCE_CURRENT_OWNER_POINTER_MISSING")

agents=(ROOT/"AGENTS.md").read_text(encoding="utf-8")
for path in [x.get("path") for x in legacy]:
    if path not in agents:
        fail.append(f"AGENTS_LEGACY_ROUTE_MISSING:{path}")

readme=(ROOT/"README.md").read_text(encoding="utf-8")
if "READY_SET_CANONICAL_PRODUCT_CONTRACT.md" not in readme:
    fail.append("README_CURRENT_AUTHORITY_MISSING")

if fail:
    print("FAIL: Ready legacy authority isolation")
    for item in fail:
        print(item)
    raise SystemExit(1)

print("PASS: Ready legacy authority isolated; current canonical remains authoritative")
