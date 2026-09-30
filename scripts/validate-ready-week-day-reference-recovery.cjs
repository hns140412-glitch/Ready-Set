const fs=require('node:fs');
const p='C2S/READY_WEEK_DAY_REFERENCE_RECOVERY_2026-09-30.json';
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const e=[];
const expected={
 week:['cd479f1c72a58171a5873a6c06e442fecfb7d63819a741f6984650968308db42','b5dd7c19319d1ec7f875439df05d8c8f8e3cf8c1'],
 day:['733aa39ea2972fffa04362994cb1218c60e34eb1558a86816a2388dd4f6e9ad5','b0c61fec3bbc95097932b124f9254048b5717b76'],
 preparation_scene:['03f3229200a20a38b875b68b0feb1e8f06bb71cd593178311595aaab6162bd53','60f7a9d358bc589ff8395b153374dd94b708a103']
};
if(x.status!=='EXACT_ACCEPTED_REFERENCES_RECOVERED_AND_CENTRALIZED__RUNTIME_SCENE_STILL_OPEN')e.push('status');
if(x.central_source?.repository!=='hns140412-glitch/TAKY-ASSETS')e.push('central repo');
if(!/^[a-f0-9]{40}$/.test(x.central_source?.commit||''))e.push('central commit');
if(x.central_source?.pull_request!==2)e.push('central pull request');
if(x.central_source?.manifest!=='assets/ready-set/references/basecamp-timetable/2026-09-28/manifest.v1.json')e.push('central manifest');
if(x.central_source?.review_state!=='DRAFT_NOT_MAIN')e.push('central review state');
for(const [k,[sha,blob]] of Object.entries(expected)){
 const r=x.references?.[k];
 if(!r||r.sha256!==sha||r.git_blob_sha!==blob||r.width!==941||r.height!==1672)e.push('reference '+k);
}
if(x.runtime_constraints?.direct_full_reference_background_binding!=='FORBIDDEN')e.push('direct binding must remain forbidden');
if(x.runtime_constraints?.planner_content!=='LIVE_DOM_ONLY')e.push('planner content');
if(x.release?.ready_main_merge!=='HOLD'||x.release?.netlify!=='HOLD')e.push('release hold');
if(e.length){console.error('[READY REFERENCE RECOVERY] FAIL');e.forEach(v=>console.error(' - '+v));process.exit(1)}
console.log('[READY REFERENCE RECOVERY] PASS — exact accepted references recovered and centralized; runtime visual scene remains OPEN/HOLD.');
