#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VALIDATOR=ROOT/"tools/taky-design-to-ui-validate.py"
MANIFEST=ROOT/"design-to-ui.json"
OUT=ROOT/"ui-audit/design-to-ui-contract-validation.json"

cp=subprocess.run([sys.executable,str(VALIDATOR),str(MANIFEST),"--root",str(ROOT),"--out",str(OUT)],text=True,capture_output=True)
if cp.returncode != 0:
    print(cp.stdout)
    print(cp.stderr,file=sys.stderr)
    raise SystemExit(cp.returncode)

result=json.loads(OUT.read_text(encoding="utf-8"))
assert result["contract_valid"] is True, result
assert result["design_pass_ready"] is False, "Ready must remain blocked until approved binaries/layers/implementation gaps close."
assert result["errors"] == [], result["errors"]
blockers=result["blockers"]
for screen in ("planner_week","planner_day","goal","focus"):
    assert f"{screen}:GOLDEN_IMPORT_OPEN" in blockers, (screen,blockers)
assert any("ASSET_PRODUCTION_OPEN" in x for x in blockers)
assert any("IMPLEMENTATION_OPEN" in x for x in blockers)
print(json.dumps({
    "schema":"READY_DESIGN_TO_UI_ADOPTION_CHECK_V1",
    "contract_valid":True,
    "design_pass_ready":False,
    "blocker_count":len(blockers),
    "image_generation_required":False
},indent=2))
