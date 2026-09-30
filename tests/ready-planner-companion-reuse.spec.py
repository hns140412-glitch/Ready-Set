#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def sha(path: Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest=json.loads((ROOT/"assets/character-formation/asset-manifest.json").read_text(encoding="utf-8"))
assert manifest["status"]=="HARD_LOCK"
assert manifest["runtime_rule"]=="DECOMPOSED_ASSETS_ONLY_NO_FULL_SCREEN_MOCKUP_CROP"
expected=manifest["asset_sources"]["core6_runtime_derivatives"]["sha256"]
for cid,rel in manifest["asset_files"]["crew"].items():
    path=ROOT/rel
    assert path.is_file(), (cid,rel)
    assert sha(path)==expected[cid], (cid,sha(path),expected[cid])

html=(ROOT/"index.html").read_text(encoding="utf-8")
for token in (
    'id="plannerCompanionPresence"',
    'id="plannerCompanionPortrait"',
    'id="plannerCompanionName"',
    './src/identity/character-formation-asset-runtime.js',
    './src/identity/character-formation-journey-runtime.js',
    './src/identity/expedition-companion-presentation-runtime.js',
):
    assert token in html, token

app=(ROOT/"app.js").read_text(encoding="utf-8")
assert "ReadyExpeditionCompanionPresentation?.create" in app
assert "CharacterFormationAssetRuntime?.create" in app
assert "expeditionCompanionPresenter?.renderPlanner()" in app
assert "...x," in app, "state migration must preserve prior expedition selection fields"

d=json.loads((ROOT/"design-to-ui.json").read_text(encoding="utf-8"))
for sid in ("planner_week","planner_day"):
    screen=next(x for x in d["screens"] if x["id"]==sid)
    layers=json.loads((ROOT/screen["layer_contract"]["path"]).read_text(encoding="utf-8"))
    slot=next(x for x in layers["layers"] if x["role"]=="CHARACTER_SLOT")
    assert slot["status"]=="RUNTIME_SLOT", slot
    assert slot["selector"]=="#plannerCompanionPresence", slot
    assert slot["source_pr"]==118, slot

print(json.dumps({
    "schema":"READY_PLANNER_COMPANION_REUSE_CHECK_V1",
    "pass":True,
    "core6_sha_verified":sorted(expected),
    "planner_surfaces":["planner_week","planner_day"],
    "source_pr":118,
    "new_image_generation":False
},indent=2))
