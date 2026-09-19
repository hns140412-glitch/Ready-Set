#!/usr/bin/env python3
"""Trusted Ready & Set validation profile READY_SET_STATIC_V1.

Commands are repository-owned; task/issue content cannot inject shell commands.
"""
from __future__ import annotations
import argparse, fnmatch, json, subprocess
from pathlib import Path

CORE=["index.html","styles.css","app.js","ready-runtime-v07.js","config.js","sw.js","manifest.webmanifest"]

def allowed(path, rules):
    return any(path==r or path.startswith(r.rstrip("/")+"/") or fnmatch.fnmatch(path,r) for r in rules)

def run_node_check(path):
    p=subprocess.run(["node","--check",path],text=True,capture_output=True)
    return p.returncode==0, (p.stdout+p.stderr).strip()

def validate(task, changed_files):
    rules=(task.get("change_scope") or {}).get("allowed",[])
    changed=[x.strip() for x in changed_files if x.strip() and not x.startswith(".taky/")]
    deviations=[x for x in changed if not allowed(x,rules)]
    vr={}
    vr["diff_scope"]={"status":"PASS" if changed and not deviations else "FAIL","evidence":f"changed={changed}; outside_allowed={deviations}"}
    vr["build"]={"status":"NOT_APPLICABLE","evidence":"Ready & Set is a static PWA repository with no package build pipeline in the verified base."}
    js_files=sorted({p for p in CORE+changed if p.endswith(".js") and Path(p).exists()})
    syntax=[]; syntax_ok=True
    for p in js_files:
        ok,msg=run_node_check(p); syntax_ok=syntax_ok and ok; syntax.append({"file":p,"pass":ok,"output":msg[-2000:]})
    vr["relevant_tests"]={"status":"PASS" if syntax_ok else "FAIL","evidence":json.dumps(syntax,ensure_ascii=False)}
    missing=[p for p in CORE if not Path(p).exists()]
    regression_ok=syntax_ok and not missing
    vr["regression"]={"status":"PASS" if regression_ok else "FAIL","evidence":f"core_missing={missing}; core_js_syntax={syntax_ok}"}
    overall=vr["diff_scope"]["status"]=="PASS" and syntax_ok and regression_ok
    risks=[]
    if deviations: risks.append({"severity":"BLOCKING","detail":f"Out-of-scope changes: {deviations}"})
    if not syntax_ok: risks.append({"severity":"HIGH","detail":"JavaScript syntax validation failed."})
    if missing: risks.append({"severity":"HIGH","detail":f"Core files missing: {missing}"})
    return {"pass":overall,"profile":"READY_SET_STATIC_V1","changed_files":changed,"scope_deviations":deviations,"validation_results":vr,"unresolved_risks":risks}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--task",type=Path,required=True); ap.add_argument("--changed-files",type=Path,required=True); ap.add_argument("--output",type=Path,required=True); a=ap.parse_args()
    task=json.loads(a.task.read_text(encoding="utf-8")); changed=a.changed_files.read_text(encoding="utf-8").splitlines() if a.changed_files.exists() else []
    out=validate(task,changed); a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(json.dumps(out,ensure_ascii=False,indent=2)); return 0 if out["pass"] else 1

if __name__=="__main__": raise SystemExit(main())
