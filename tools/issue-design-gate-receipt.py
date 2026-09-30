#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path

def h(x):
    return hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--comparison",default="ui-audit/design-gate-result.json")
    ap.add_argument("--app",required=True)
    ap.add_argument("--out",default="ui-audit/design-gate-receipt.json")
    ap.add_argument("--interaction-pass",action="store_true")
    ap.add_argument("--responsive-pass",action="store_true")
    ap.add_argument("--asset-integrity-pass",action="store_true")
    a=ap.parse_args()
    comp=json.loads(Path(a.comparison).read_text(encoding="utf8"))
    if comp.get("pass") is not True: raise SystemExit("VISUAL_COMPARISON_NOT_PASS")
    if not (a.interaction_pass and a.responsive_pass and a.asset_integrity_pass):
        raise SystemExit("DESIGN_SUBGATE_NOT_PASS")
    rows=[]
    for r in comp.get("results",[]):
        ref=Path(r["reference"]);actual=Path(r["actual"])
        if not ref.is_file() or not actual.is_file():raise SystemExit("REFERENCE_OR_RENDER_MISSING")
        rows.append({
          "screen_id":r["id"],
          "approved_reference_sha256":hashlib.sha256(ref.read_bytes()).hexdigest(),
          "runtime_render_sha256":hashlib.sha256(actual.read_bytes()).hexdigest(),
          "comparison_score":r.get("score"),
          "threshold":r.get("threshold")
        })
    body={"schema":"TAKY_DESIGN_GATE_RECEIPT_SET_V1","app_id":a.app,"screens":rows,
          "interaction_gate_pass":True,"responsive_gate_pass":True,"asset_integrity_gate_pass":True}
    out={"pass":True,**body,"receipt_sha256":h(body)}
    p=Path(a.out);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(out,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
