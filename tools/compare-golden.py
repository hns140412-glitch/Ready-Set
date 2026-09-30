#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageStat

def open_norm(p: Path, size=(195,422)):
    im=Image.open(p).convert("RGB").resize(size,Image.Resampling.LANCZOS)
    return im

def mean_abs(a,b):
    d=ImageChops.difference(a,b)
    s=ImageStat.Stat(d)
    return sum(s.mean)/(3*255.0)

def gray_edge(im):
    return im.convert("L").filter(ImageFilter.FIND_EDGES)

def edge_diff(a,b):
    d=ImageChops.difference(gray_edge(a),gray_edge(b))
    return ImageStat.Stat(d).mean[0]/255.0

def histogram_diff(a,b):
    ha=a.histogram(); hb=b.histogram()
    sa=sum(ha); sb=sum(hb)
    if not sa or not sb: return 1.0
    return sum(abs(x/sa-y/sb) for x,y in zip(ha,hb))/2.0

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--config",default="design-gate.json")
    ap.add_argument("--actual-dir",default="ui-audit")
    ap.add_argument("--out",default="ui-audit/design-gate-result.json")
    args=ap.parse_args()
    cfg=json.loads(Path(args.config).read_text(encoding="utf-8"))
    results=[]; failed=False
    for s in cfg.get("screens",[]):
        ref=Path(s.get("approved_reference",""))
        actual=Path(args.actual_dir)/s.get("actual_snapshot",s.get("snapshot_name",""))
        threshold=float(s.get("visual_distance_max",cfg.get("visual_distance_max",0.18)))
        if not ref.is_file() or not actual.is_file():
            results.append({"id":s.get("id"),"pass":False,"error":"REFERENCE_OR_ACTUAL_MISSING","reference":str(ref),"actual":str(actual)})
            failed=True; continue
        r=open_norm(ref); a=open_norm(actual)
        pixel=mean_abs(r,a); edge=edge_diff(r,a); hist=histogram_diff(r,a)
        score=0.45*pixel+0.35*edge+0.20*hist
        ok=score<=threshold
        results.append({"id":s.get("id"),"pass":ok,"score":round(score,6),"threshold":threshold,
                        "pixel":round(pixel,6),"edge":round(edge,6),"histogram":round(hist,6),
                        "reference":str(ref),"actual":str(actual)})
        failed |= not ok
    out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({"schema":"TAKY_VISUAL_COMPARE_V1","pass":not failed,"results":results},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(out.read_text(encoding="utf-8"))
    return 1 if failed else 0
if __name__=="__main__": raise SystemExit(main())
