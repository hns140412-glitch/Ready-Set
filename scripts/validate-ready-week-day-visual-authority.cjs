/* TAKY: Prevent browser-only PASS from being called approved SOULS-inspired timetable UI.
   This gate deliberately FAILS while an approved real Base Camp source is unresolved. */
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const state=JSON.parse(fs.readFileSync('C2S/READY_WEEK_DAY_VISUAL_ACCEPTANCE_STATE_2026-09-28.json','utf8'));
const problems=[];
const latest=JSON.parse(fs.readFileSync('C2S/READY_WEEK_DAY_LATEST_SOURCE_LAYER_GATE_2026-09-29.json','utf8'));
if(latest.status!=='PRODUCTION_SCENE_VERIFIED')problems.push('LATEST_ACCEPTED_WEEK_DAY_SOURCE_NOT_IMPLEMENTED: '+latest.status);
for(const name of ['week','day','preparation_scene']){
  const row=latest.references?.[name];
  if(!row||!/^([a-f0-9]{64})$/.test(row.sha256||'')||row.width!==941||row.height!==1672)
    problems.push('CURRENT_941PX_SOURCE_PROVENANCE_INVALID: '+name);
}
for(const item of ['source_image_clean_plate','full_approved_environment_1_to_1','actual_child_character_visual_binding','companion_at_preparation_table_placement']){
  if(latest.runtime_qa?.[item]!=='PASS')problems.push('VISUAL_SCENE_MISSING_'+item.toUpperCase());
}

if(state.scope!=='READY_WEEKLY_DAILY_ONLY')problems.push('SCOPE_MUST_BE_WEEKLY_DAILY_ONLY');
if(state.timer!=='PRESERVE_EXISTING_LOCKED_UI')problems.push('TIMER_LOCK_NOT_ACKNOWLEDGED');
if(state.status!=='VISUAL_QA_APPROVED')problems.push('VISUAL_QA_NOT_APPROVED: '+state.status);
const asset=state.source_asset||{};
if(!asset.path||!asset.visual_id||!/^[a-f0-9]{64}$/i.test(asset.sha256||'')||!asset.approval_evidence)
  problems.push('APPROVED_BASE_CAMP_SOURCE_WITH_VISUAL_ID_HASH_AND_APPROVAL_EVIDENCE_MISSING');
else{
  const local=path.normalize(asset.path);
  if(path.isAbsolute(local)||local.startsWith('..')||!local.startsWith('assets'+path.sep))
    problems.push('SOURCE_MUST_BE_REPOSITORY_LOCAL_APPROVED_ASSET');
  else if(!fs.existsSync(local))problems.push('BOUND_SOURCE_FILE_MISSING');
  else{
    const actual=crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex');
    if(actual!==asset.sha256.toLowerCase())problems.push('SOURCE_SHA256_MISMATCH');
  }
}
for(const screen of ['weekly','daily']){
  const bound=state.scene_binding?.[screen];
  const screenshot=state.rendered_evidence?.[screen];
  if(!bound||!screenshot||!fs.existsSync(screenshot))problems.push(screen.toUpperCase()+'_REAL_SOURCE_BINDING_AND_RENDER_EVIDENCE_MISSING');
}
if(!state.rendered_evidence?.mobile_and_tablet_review||!fs.existsSync(state.rendered_evidence.mobile_and_tablet_review))
  problems.push('MOBILE_TABLET_COMPOSITION_REVIEW_MISSING');
if(state.human_approval?.approved!==true||!state.human_approval?.evidence)
  problems.push('EXPLICIT_VISUAL_APPROVAL_NOT_RECORDED');
if(problems.length){
  console.error('[TAKY VISUAL AUTHORITY GATE] FAIL / HOLD — functional/browser PASS does not authorize design approval.');
  problems.forEach(x=>console.error(' - '+x));
  process.exitCode=1;
}else console.log('[TAKY VISUAL AUTHORITY GATE] machine evidence present; still require human visual judgement, no automated deployment.');
