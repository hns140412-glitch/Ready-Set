import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const index=read('index.html');
const app=read('app.js');
const styles=read('styles.css');
const view=read('src/identity/character-setup-view-runtime.js');
const controller=read('src/identity/character-setup-controller-runtime.js');
const core=read('src/identity/character-core-orchestrator-runtime.js');
const signatureItemRuntime=read('src/identity/character-signature-item-runtime.js');
const signatureItemServer=read('netlify/functions/character-signature-item-core.mjs');
const journey=read('src/identity/character-formation-journey-runtime.js');
const poseBankRuntime=read('src/identity/character-formation-pose-bank-runtime.js');

assert(index.includes('id="characterSetupView"'),'CHARACTER_SETUP_VIEW_MISSING');
assert(index.includes('id="openCharacterSetupBtn"'),'CHARACTER_SETUP_ENTRY_MISSING');
assert(index.includes('id="characterDirectionGrid"'),'CHARACTER_DIRECTION_GRID_MISSING');
assert(index.includes('character-setup-view-runtime.js'),'CHARACTER_SETUP_VIEW_NOT_LOADED');
assert(index.includes('character-setup-controller-runtime.js'),'CHARACTER_SETUP_CONTROLLER_NOT_LOADED');
assert(index.includes('character-signature-item-runtime.js'),'SIGNATURE_ITEM_RUNTIME_NOT_LOADED');
assert(index.includes('character-formation-asset-runtime.js'),'CHARACTER_FORMATION_ASSET_RUNTIME_NOT_LOADED');
assert(index.includes('character-formation-scene-runtime.js'),'CHARACTER_FORMATION_SCENE_RUNTIME_NOT_LOADED');
assert(index.includes('character-formation-journey-runtime.js'),'CHARACTER_FORMATION_JOURNEY_RUNTIME_NOT_LOADED');
assert(index.includes('id="formationJourneyView"'),'CHARACTER_FORMATION_JOURNEY_VIEW_MISSING');
assert(index.includes('id="formationJourneyBody"'),'CHARACTER_FORMATION_JOURNEY_BODY_MISSING');
assert(index.indexOf('character-formation-asset-runtime.js')<index.indexOf('character-formation-scene-runtime.js'),'CHARACTER_ASSET_RUNTIME_LOAD_ORDER_INVALID');
assert(index.indexOf('character-formation-journey-runtime.js')<index.indexOf('app.js'),'CHARACTER_FORMATION_JOURNEY_LOAD_ORDER_INVALID');
assert(index.includes('id="cfScene"'),'CHARACTER_FORMATION_SCENE_MISSING');
assert(index.includes('id="cfCommonTools"'),'CHARACTER_COMMON_TOOL_LAYER_MISSING');
assert(index.includes('id="cfCrewAsset"'),'CHARACTER_FORMATION_CREW_ASSET_SLOT_MISSING');
assert(index.indexOf('character-setup-view-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_VIEW_LOAD_ORDER_INVALID');
assert(index.indexOf('character-setup-controller-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_CONTROLLER_LOAD_ORDER_INVALID');

assert(app.includes("'formation-journey':()=>characterFormationJourneyRuntime?.render?.()"),'CHARACTER_FORMATION_JOURNEY_ROUTE_MISSING');
assert(app.includes("'character-setup':()=>{"),'CHARACTER_SETUP_ROUTE_MISSING');
assert(app.includes('characterSetupRuntime.begin()'),'CHARACTER_SETUP_BEGIN_NOT_WIRED');
assert(app.includes('characterSetupRuntime.choose(direction.dataset.characterDirection)'),'CHARACTER_SETUP_CHOICE_NOT_WIRED');
assert(app.includes("nav('formation-journey')"),'CHARACTER_FORMATION_ENTRY_NAV_MISSING');
assert(!app.includes("if(!state.profile?.sourcePhoto?.source_hash){toast('먼저 사진을 등록해 주세요.');return;}\n  nav('character-setup')"),'PHOTO_GATE_MUST_NOT_BYPASS_CREW_JOURNEY');
assert(app.includes('CharacterFormationJourneyRuntime'),'CHARACTER_FORMATION_JOURNEY_BOOTSTRAP_MISSING');
assert(app.includes('rebuildCharacterFormationJourney.create'),'CHARACTER_FORMATION_JOURNEY_CREATE_MISSING');
assert(app.includes('syncAfterCharacterLock'),'CHARACTER_FORMATION_POST_LOCK_RETURN_MISSING');
assert(app.includes('CharacterFormationAssetRuntime?.create'),'CHARACTER_ASSET_REGISTRY_BOOTSTRAP_MISSING');
assert(app.includes('assetRegistry:characterFormationAssetRegistry'),'CHARACTER_ASSET_REGISTRY_NOT_INJECTED');
assert(app.includes('characterFormationAssetRegistry?.load?.()'),'CHARACTER_ASSET_MANIFEST_LOAD_MISSING');

assert(controller.includes("status:'ITEM_SELECTION'"),'SIGNATURE_ITEM_UI_STATE_MISSING');
assert(controller.includes("status:'ROUND_2'"),'ROUND_2_UI_STATE_MISSING');
assert(controller.includes('chooseItem'),'SIGNATURE_ITEM_CONTROLLER_MISSING');
assert(controller.includes('continueAfterItem'),'SIGNATURE_ITEM_CONFIRM_CONTROLLER_MISSING');
assert(app.includes('data-character-item'),'SIGNATURE_ITEM_UI_ACTION_MISSING');
assert(controller.includes('SYSTEM_AUTO_CONTRAST')===false,'CONTROLLER_MUST_NOT_INVENT_AUTO_CONTRAST');
assert(core.includes('p.characterDirection.candidates'),'CORE_MUST_OWN_CANDIDATE_DIRECTION_RESULT');
assert(core.includes("status:'ITEM_SELECTION'"),'CORE_SIGNATURE_ITEM_STAGE_MISSING');
assert(core.indexOf("status:'ITEM_SELECTION'")<core.indexOf("status:'ROUND_1'"),'SIGNATURE_ITEM_MUST_PRECEDE_DIRECTION_ROUND_1');
assert(core.includes("status:'ITEM_SELECTED'"),'SIGNATURE_ITEM_SELECTED_STATE_MISSING');
assert(core.includes('continueAfterItem'),'SIGNATURE_ITEM_CONFIRM_TRANSITION_MISSING');
assert(signatureItemRuntime.includes("CAMERA"),'SIGNATURE_CAMERA_MISSING');
assert(signatureItemRuntime.includes("COMPASS"),'SIGNATURE_COMPASS_MISSING');
assert(signatureItemRuntime.includes("FIELD_NOTEBOOK"),'SIGNATURE_NOTEBOOK_MISSING');
assert(signatureItemRuntime.includes("BINOCULARS"),'SIGNATURE_BINOCULARS_MISSING');
assert(signatureItemRuntime.includes("WATER_BOTTLE"),'SIGNATURE_WATER_BOTTLE_MISSING');
assert(signatureItemRuntime.includes('EXACTLY_ONE_SIGNATURE_ITEM'),'SIGNATURE_ITEM_ONE_ONLY_RULE_MISSING');
assert(signatureItemRuntime.includes('SAME_ITEM_ACROSS_A_B_C'),'SIGNATURE_ITEM_CANDIDATE_RULE_MISSING');
assert(signatureItemServer.includes('normalizeSignatureItem'),'SIGNATURE_ITEM_SERVER_VALIDATION_MISSING');
assert(view.includes('두 번만 직접 고르면 끝이에요.'),'TWO_SELECTION_COPY_MISSING');
assert(view.includes('시그니처 아이템'),'SIGNATURE_ITEM_FIRST_COPY_MISSING');
assert(view.includes('시스템이 만든 대비 방향'),'AUTO_CONTRAST_PROVENANCE_COPY_MISSING');
assert(view.includes('세 후보 모두 같은 나'),'SAME_CHILD_COMPARISON_COPY_MISSING');

// Previously confirmed Character Formation journey must be executable, not dead documentation.
const journeyStages=[
  'CREW_MEET','COMPANION_SELECT','COMPANION_NAME','PHOTO_REQUIRED','CHARACTER_FORMATION',
  'SHARED_ACCENT','WORLD_ENTRY','ISLAND_DISCOVERY','ISLAND_NAME','BASE_CAMP_MOVE','BASE_CAMP_NAME','READY'
];
let lastStageIndex=-1;
for(const stage of journeyStages){
  const i=journey.indexOf("'"+stage+"'");
  assert(i>=0,'CHARACTER_FORMATION_STAGE_MISSING_'+stage);
  assert(i>lastStageIndex,'CHARACTER_FORMATION_STAGE_ORDER_REGRESSION_'+stage);
  lastStageIndex=i;
}
assert(journey.includes("data-formation-entry=\"VOYAGE\""),'VOYAGE_MODE_CHOICE_MISSING');
assert(journey.includes("data-formation-entry=\"DROP\""),'DROP_MODE_CHOICE_MISSING');
assert(journey.includes("f.worldEntry.variant=mode"),'WORLD_ENTRY_MODE_PERSISTENCE_MISSING');
assert(journey.includes("f.pendingAccent=id"),'EXPEDITION_ACCENT_PREVIEW_STATE_MISSING');
assert(journey.includes("state.expedition.sharedAccent=chosen"),'EXPEDITION_ACCENT_CONFIRMATION_MISSING');
assert(journey.includes("{id:'PINK',label:'분홍'}"),'EXPEDITION_ACCENT_PINK_LABEL_REGRESSION');
assert(!journey.includes("p?.visualId ||"),'RAW_VISUAL_ID_MUST_NOT_COUNT_AS_LOCKED');
assert(journey.includes("VISUAL_ID_LOCKED")&&journey.includes("MASTER_ASSETS_READY"),'VISUAL_ID_LOCK_STATE_GUARD_MISSING');
assert(journey.includes("primaryCompanionId"),'PRIMARY_COMPANION_STATE_MISSING');
assert(journey.includes("primaryCompanionAlias"),'PRIMARY_COMPANION_ALIAS_STATE_MISSING');
assert(journey.includes("f.island.name"),'ISLAND_NAME_STATE_MISSING');
assert(journey.includes("f.baseCamp.name"),'BASE_CAMP_NAME_STATE_MISSING');
assert(styles.includes('.formationEntryChoice'),'WORLD_ENTRY_CHOICE_STYLE_MISSING');

console.log('CHARACTER_VISUAL_ID_UI_JOURNEY_V01_PASS');


const remote=read('src/identity/character-remote-adapter-runtime.js');
const master=read('src/identity/character-master-runtime.js');
const sourceFn=read('netlify/functions/character-source.mjs');
const jobFn=read('netlify/functions/character-job.mjs');
const generateFn=read('netlify/functions/character-generate.mjs');
const assetFn=read('netlify/functions/character-asset.mjs');
const actionFn=read('netlify/functions/character-action.mjs');
const correctFn=read('netlify/functions/character-correct.mjs');
const masterFn=read('netlify/functions/character-master.mjs');
const derivativeFn=read('netlify/functions/character-derivatives.mjs');
const identityRuntime=read('src/identity/character-identity-consistency-runtime.js');
const consistencyGate=read('src/identity/character-consistency-gate-runtime.js');
const consistencyCore=read('netlify/functions/character-consistency-core.mjs');
const consistencyReviewFn=read('netlify/functions/character-consistency-review.mjs');

assert(remote.includes('/api/character/source'),'CHARACTER_REMOTE_SOURCE_ENDPOINT_MISSING');
assert(remote.includes('/api/character/job'),'CHARACTER_REMOTE_JOB_ENDPOINT_MISSING');
assert(remote.includes('/api/character/generate'),'CHARACTER_REMOTE_GENERATE_ENDPOINT_MISSING');
assert(remote.includes('/api/character/action'),'CHARACTER_REMOTE_ACTION_ENDPOINT_MISSING');
assert(remote.includes('/api/character/correct'),'CHARACTER_REMOTE_CORRECT_ENDPOINT_MISSING');
assert(remote.includes('/api/character/master'),'CHARACTER_REMOTE_MASTER_ENDPOINT_MISSING');
assert(remote.includes('/api/character/derivatives'),'CHARACTER_REMOTE_DERIVATIVE_ENDPOINT_MISSING');
assert(remote.includes('/api/character/consistency-review'),'CHARACTER_REMOTE_CONSISTENCY_REVIEW_MISSING');
assert(remote.includes('CONFIRM_SAME_IDENTITY'),'CHARACTER_REMOTE_SAME_IDENTITY_CONFIRM_MISSING');

assert(sourceFn.includes("role!=='CHILD'"),'CHARACTER_SOURCE_CHILD_SCOPE_MISSING');
assert(jobFn.includes('DIRECTION_PROVENANCE_INVALID'),'CHARACTER_JOB_PROVENANCE_GUARD_MISSING');
assert(generateFn.includes('READY_CHARACTER_PAID_GENERATION'),'CHARACTER_GENERATION_GATE_MISSING');
assert(generateFn.includes('SYSTEM_AUTO_CONTRAST')===false,'SERVER_GENERATOR_MUST_CONSUME_NOT_INVENT_CONTRAST');
assert(generateFn.includes("https://api.openai.com/v1/images/edits"),'IMAGE_EDIT_PROVIDER_BOUNDARY_MISSING');
assert(generateFn.includes('promptForSignatureItem'),'SIGNATURE_ITEM_GENERATION_PROMPT_MISSING');
assert(correctFn.includes('promptForSignatureItem'),'SIGNATURE_ITEM_CORRECTION_PRESERVATION_MISSING');
assert(masterFn.includes('signature_item:job.signature_item'),'SIGNATURE_ITEM_MASTER_LOCK_MISSING');
assert(generateFn.includes("Reference image")===false,'CANDIDATE_GENERATION_SHOULD_USE_SINGLE_SOURCE_PHOTO');
assert(assetFn.includes("getUser"),'CHARACTER_ASSET_AUTH_MISSING');
assert(actionFn.includes('SELECT_CANDIDATE'),'CHARACTER_SELECT_ACTION_MISSING');
assert(correctFn.includes("image[]"),'LIKENESS_MULTI_REFERENCE_EDIT_MISSING');
assert(correctFn.includes('READY_CHARACTER_PAID_GENERATION'),'LIKENESS_PROVIDER_GATE_MISSING');
assert(masterFn.includes('IDENTITY_LOCKED__DERIVATIVES_PENDING'),'MASTER_NORMALIZATION_TRUTHFUL_STATE_MISSING');

assert(identityRuntime.includes('SAME_CHILD_DIFFERENT_DIRECTION'),'IDENTITY_CONSISTENCY_CONTRACT_MISSING');
assert(consistencyGate.includes('CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01'),'CHARACTER_CONSISTENCY_GATE_RUNTIME_MISSING');
assert(consistencyCore.includes('lock_allowed'),'CHARACTER_CONSISTENCY_SERVER_CORE_MISSING');
assert(consistencyReviewFn.includes('CHARACTER_VISUAL_ID_PAID_REVIEW'),'CHARACTER_VISUAL_REVIEW_GATE_MISSING');
assert(consistencyReviewFn.includes("https://api.openai.com/v1/responses"),'CHARACTER_VISUAL_REVIEW_PROVIDER_BOUNDARY_MISSING');
assert(consistencyReviewFn.includes("type:'json_schema'"),'CHARACTER_VISUAL_REVIEW_STRUCTURED_OUTPUT_MISSING');
assert(derivativeFn.includes("job.status='MASTER_ASSETS_READY'"),'DERIVATIVE_READY_TRANSITION_MISSING');
assert(master.includes('CANDIDATES_READY'),'CHARACTER_MASTER_DOMAIN_MISSING');
assert(master.includes('LIKENESS_CORRECTION_REQUESTED'),'CHARACTER_MASTER_CORRECTION_TRACE_MISSING');
assert(master.includes('VISUAL_ID_LOCKED'),'CHARACTER_VISUAL_ID_LOCK_TRACE_MISSING');

assert(controller.includes('generateAllCandidates'),'CHARACTER_GENERATE_ALL_CONTROLLER_MISSING');
assert(controller.includes('selectCandidate'),'CHARACTER_SELECT_CONTROLLER_MISSING');
assert(controller.includes('correctLikeness'),'CHARACTER_CORRECTION_CONTROLLER_MISSING');
assert(controller.includes('lockMaster'),'CHARACTER_MASTER_LOCK_CONTROLLER_MISSING');
assert(controller.includes('buildDerivativeAssets'),'CHARACTER_DERIVATIVE_CONTROLLER_MISSING');
assert(controller.includes('reviewConsistency'),'CHARACTER_CONSISTENCY_REVIEW_CONTROLLER_MISSING');
assert(controller.includes('confirmSameIdentity'),'CHARACTER_SAME_IDENTITY_CONFIRM_CONTROLLER_MISSING');
assert(app.includes('correctCharacterLikenessBtn'),'CHARACTER_CORRECTION_UI_ACTION_MISSING');
assert(app.includes('lockCharacterMasterBtn'),'CHARACTER_MASTER_UI_ACTION_MISSING');
assert(app.includes('buildCharacterDerivativesBtn'),'CHARACTER_DERIVATIVE_UI_ACTION_MISSING');
assert(app.includes('reviewCharacterConsistencyBtn'),'CHARACTER_CONSISTENCY_REVIEW_UI_ACTION_MISSING');
assert(app.includes('confirmSameIdentityBtn'),'CHARACTER_SAME_IDENTITY_CONFIRM_UI_ACTION_MISSING');

console.log('CHARACTER_VISUAL_ID_CORE_SERVER_CONTRACT_V01_PASS');


const masterSheetFn=read('netlify/functions/character-master-sheet.mjs');
assert(remote.includes('/api/character/master-sheet'),'CHARACTER_MASTER_SHEET_ENDPOINT_MISSING');
assert(masterSheetFn.includes('READY_CHARACTER_PAID_GENERATION'),'CHARACTER_MASTER_SHEET_PROVIDER_GATE_MISSING');
assert(masterSheetFn.includes("image[]"),'CHARACTER_MASTER_SHEET_MULTI_REFERENCE_MISSING');
assert(masterSheetFn.includes('MASTER_ASSETS_READY'),'CHARACTER_MASTER_SHEET_READY_STATE_MISSING');
assert(controller.includes('generateMasterSheet'),'CHARACTER_MASTER_SHEET_CONTROLLER_MISSING');
assert(app.includes('generateCharacterMasterSheetBtn'),'CHARACTER_MASTER_SHEET_UI_ACTION_MISSING');

const assetRuntime=read('src/identity/character-formation-asset-runtime.js');
const sceneRuntime=read('src/identity/character-formation-scene-runtime.js');
const assetManifest=JSON.parse(read('assets/character-formation/asset-manifest.json'));
assert(sceneRuntime.includes('DeviceOrientationEvent'),'CHARACTER_SENSOR_DEPTH_RUNTIME_MISSING');
assert(sceneRuntime.includes('prefers-reduced-motion'),'CHARACTER_REDUCED_MOTION_RUNTIME_MISSING');
assert(assetManifest.status==='HARD_LOCK','CHARACTER_ASSET_MANIFEST_NOT_HARD_LOCKED');
assert(assetManifest.runtime_rule==='DECOMPOSED_ASSETS_ONLY_NO_FULL_SCREEN_MOCKUP_CROP','FULL_SCREEN_MOCKUP_CROP_GUARD_MISSING');
assert(assetManifest.effect_contract?.sensor_depth_default==='CHARACTER_ONLY','CHARACTER_SENSOR_DEPTH_MUST_BE_CHARACTER_ONLY');
assert(assetRuntime.includes('asset-manifest.json'),'CHARACTER_ASSET_RUNTIME_MANIFEST_SOURCE_MISSING');
assert(assetRuntime.includes('data-cf-asset-group'),'CHARACTER_ASSET_RUNTIME_BINDING_PROTOCOL_MISSING');
assert(index.includes('data-cf-asset-group="background" data-cf-asset-key="prep_room_base"'),'DECOMPOSED_BACKGROUND_BINDING_MISSING');
assert(view.includes('data-cf-asset-group="signature_items"'),'SIGNATURE_ITEM_ASSET_BINDING_MISSING');
assert(!view.includes('ITEM_ASSETS'),'SIGNATURE_ITEM_HARDCODED_ASSET_MAP_REGRESSION');
assert(!sceneRuntime.includes('./assets/character-formation/crew/'),'CREW_HARDCODED_ASSET_PATH_REGRESSION');
assert(!styles.includes("url('./assets/character-formation/background/prep-room-base.png')"),'BACKGROUND_HARDCODED_ASSET_PATH_REGRESSION');
assert(!styles.includes("url('./assets/character-formation/foreground/mid-props.png')"),'MID_PROPS_HARDCODED_ASSET_PATH_REGRESSION');
assert(!styles.includes("url('./assets/character-formation/foreground/prep-foreground.png')"),'FOREGROUND_HARDCODED_ASSET_PATH_REGRESSION');
assert(!styles.includes("url('./assets/character-formation/fx/warm-glow.png')"),'FX_HARDCODED_ASSET_PATH_REGRESSION');

// Exact current identity/item contracts. Stale catalogs must not silently re-enter runtime.
const exactCrew=['dubi','lori','ink','nova','take','zero'];
const exactItems=['CAMERA','COMPASS','FIELD_NOTEBOOK','BINOCULARS','WATER_BOTTLE'];
const manifestCrew=Object.keys(assetManifest.asset_files?.crew||{}).sort();
const manifestItems=Object.keys(assetManifest.asset_files?.signature_items||{}).sort();
assert(JSON.stringify(manifestCrew)===JSON.stringify([...exactCrew].sort()),'CORE6_ASSET_MANIFEST_SET_MISMATCH');
assert(JSON.stringify(manifestItems)===JSON.stringify([...exactItems].sort()),'SIGNATURE_ITEM_ASSET_MANIFEST_SET_MISMATCH');
assert(assetManifest.tool_contract?.signature_items_are_not_total_tool_inventory===true,'SIGNATURE_ITEMS_MUST_NOT_EQUAL_TOTAL_TOOL_INVENTORY');
assert(assetManifest.tool_contract?.common_tools_selection_rule==='NOT_PART_OF_SIGNATURE_ITEM_CHOICE','COMMON_TOOLS_MUST_STAY_OUTSIDE_SIGNATURE_SELECTION');
const commonTools=assetManifest.asset_groups?.common_tools||[];
assert(commonTools.length>=5,'COMMON_TOOL_POOL_TOO_THIN');
const signatureGroup=new Set(assetManifest.asset_groups?.signature_items||[]);
assert(commonTools.every(x=>!signatureGroup.has(x)),'COMMON_TOOL_AND_SIGNATURE_GROUP_OVERLAP');
const commonToolFiles=Object.keys(assetManifest.asset_files?.common_tools||{});
assert(commonToolFiles.length===8,'COMMON_TOOL_ASSET_FILE_SLOTS_INCOMPLETE');
const commonToolConsumers=[...index.matchAll(/data-cf-asset-group="common_tools"/g)].length;
assert(commonToolConsumers===8,'COMMON_TOOL_RUNTIME_CONSUMER_COUNT_MISMATCH');
assert(assetManifest.tool_contract?.binary_truth==='MANIFEST_ENTRY_DOES_NOT_PROVE_BINARY_EXISTS','BINARY_TRUTH_CONTRACT_MISSING');
assert(signatureItemRuntime.includes("Object.freeze(['CAMERA','COMPASS','FIELD_NOTEBOOK','BINOCULARS','WATER_BOTTLE'])"),'SIGNATURE_ITEM_RUNTIME_EXACT_SET_MISMATCH');

// Inherited family state is broader than this app-local projection. Local runtime must not redefine it.
assert(assetManifest.projection_scope?.type==='CHARACTER_FORMATION_RUNTIME_PROJECTION','CHARACTER_FORMATION_PROJECTION_SCOPE_MISSING');
assert(assetManifest.projection_scope?.canonical_redefinition===false,'LOCAL_PROJECTION_MUST_NOT_REDEFINE_FAMILY_CANONICAL');
assert(assetManifest.projection_scope?.signature_items_scope==='USER_CHOICE_ONLY','SIGNATURE_ITEM_SCOPE_REGRESSION');
assert(assetManifest.projection_scope?.common_tools_scope==='CURRENT_RUNTIME_VISIBLE_SUBSET','COMMON_TOOLS_MUST_REMAIN_VISIBLE_SUBSET');
assert(assetManifest.projection_scope?.inherits_family_confirmed_state===true,'FAMILY_CONFIRMED_STATE_INHERITANCE_MISSING');
assert(journey.includes('같은 섬으로 향하는 첫 여정 연출 선택'),'VOYAGE_DROP_MUST_TARGET_SAME_ISLAND');
assert(journey.includes('Ready & Set, Hide & Seek, Snap & Pop')&&journey.includes('이 하나의 섬 안에서 이어져'),'SHARED_ISLAND_CONTINUITY_COPY_MISSING');
for(const familyRoot of ['badges','gems','wishes','blessings','Explorer_ID','explorerId']){
  assert(!new RegExp('state\\\\.'+familyRoot+'\\\\s*=').test(journey),'FAMILY_STATE_REDEFINED_BY_CHARACTER_FORMATION_'+familyRoot);
}

// Core 6 runtime files are direct locked-canonical derivatives, not lookalikes or re-prompts.
const core6Provenance=assetManifest.asset_sources?.core6_runtime_derivatives||{};
assert(core6Provenance.source_file_id==='file_0000000022f0823090aec9a5d4c42aa3','CORE6_CANONICAL_SOURCE_ID_REGRESSION');
assert(core6Provenance.derivation==='CANONICAL_FRONT_TURNAROUND_DIRECT_EXTRACT','CORE6_DERIVATION_METHOD_REGRESSION');
assert(core6Provenance.redraw===false&&core6Provenance.generated_lookalike===false,'CORE6_LOOKALIKE_REGENERATION_FORBIDDEN');
const core6HashMismatches=[];
for(const id of exactCrew){
  const p=assetManifest.asset_files.crew[id];
  assert(fs.existsSync(p),'CORE6_RUNTIME_BINARY_MISSING_'+id);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const expected=String(core6Provenance.sha256?.[id]||'');
  console.log('CORE6_RUNTIME_BINARY_SHA256',id,actual,expected);
  if(actual!==expected)core6HashMismatches.push({id,actual,expected});
}
assert(core6HashMismatches.length===0,'CORE6_RUNTIME_BINARY_HASH_MISMATCHES__'+JSON.stringify(core6HashMismatches));
console.log('CHARACTER_FORMATION_FAMILY_INHERITANCE_AND_CORE6_PROVENANCE_PASS');

const projectionV02=read('INTEGRATION/CHARACTER_VISUAL_ID_PROJECTION_V02.md');
for(const stale of ['MAGNIFIER','EXPLORER_HAT','ROUND_GLASSES','MINI_FIELD_BAG']){
  assert(!projectionV02.includes(stale),'STALE_SIGNATURE_ITEM_REENTERED_PROJECTION_'+stale);
}

// CHARACTER_ONLY means no sensor variable may move world/UI layers.
function cssRule(selector){
  const marker='\n'+selector+'{';
  let start=styles.indexOf(marker);
  if(start>=0)start+=1;
  else if(styles.startsWith(selector+'{'))start=0;
  assert(start>=0,'CSS_RULE_MISSING_'+selector);
  const end=styles.indexOf('}',start);
  assert(end>start,'CSS_RULE_UNCLOSED_'+selector);
  return styles.slice(start,end+1);
}
for(const selector of [
  '#characterSetupView .cfFarWorld',
  '#characterSetupView .cfDestinationHint',
  '#characterSetupView .cfMidProps',
  '#characterSetupView .cfForeground',
  '#characterSetupView .cfFxLayer'
]){
  const rule=cssRule(selector);
  assert(!rule.includes('var(--cf-x)')&&!rule.includes('var(--cf-y)'),'NON_CHARACTER_SENSOR_DEPTH_REGRESSION_'+selector);
}
const crewRule=cssRule('#characterSetupView .cfCrewAsset');
assert(crewRule.includes('var(--cf-x)')&&crewRule.includes('var(--cf-y)'),'CHARACTER_SENSOR_DEPTH_BINDING_MISSING');
assert(!styles.includes("url('./assets/character-formation/_references/"),'REFERENCE_MOCKUP_USED_AS_RUNTIME_ASSET');
assert(!index.includes('assets/character-formation/_references/'),'REFERENCE_MOCKUP_USED_IN_RUNTIME_DOM');

// A manifest path is not implementation proof. Missing binaries must stay truthfully PENDING.
function flattenAssetPaths(node,out=[]){
  if(typeof node==='string'){out.push(node);return out;}
  if(node&&typeof node==='object')for(const value of Object.values(node))flattenAssetPaths(value,out);
  return out;
}
const declaredAssetPaths=flattenAssetPaths(assetManifest.asset_files);
const missingAssets=declaredAssetPaths.filter(p=>!fs.existsSync(p));
const anchorState=String(assetManifest.current_runtime_anchor?.state||'');
const core6Paths=Object.values(assetManifest.asset_files?.crew||{});
if(missingAssets.length){
  assert(anchorState.includes('PENDING_BINARY_ASSETS'),'MISSING_BINARY_ASSETS_NOT_DECLARED_PENDING');
  assert(missingAssets.length===core6Paths.length,'NON_CORE6_ASSET_STILL_MISSING');
  assert(missingAssets.every(p=>core6Paths.includes(p)),'ONLY_CORE6_ASSETS_MAY_REMAIN_PENDING');
  assert((assetManifest.current_runtime_anchor?.pending_only||[]).length===6,'CORE6_PENDING_LIST_MUST_HAVE_SIX');
  console.log('CHARACTER_FORMATION_CORE6_ONLY_PENDING',missingAssets.length,missingAssets.join(','));
}else{
  assert(!anchorState.includes('PENDING_BINARY_ASSETS'),'ASSET_STATE_STALE_PENDING_AFTER_BINARIES_READY');
  console.log('CHARACTER_FORMATION_ASSET_BINDING_V01_PASS');
}


// Responsive contract: mobile source + tablet background extension.
assert(assetManifest.responsive_contract?.mode==='MOBILE_SOURCE_TABLET_BACKGROUND_EXTENSION','CHARACTER_FORMATION_RESPONSIVE_MODE_REGRESSION');
assert(assetManifest.responsive_contract?.source_layout?.width===390&&assetManifest.responsive_contract?.source_layout?.height===844,'CHARACTER_FORMATION_MOBILE_SOURCE_SIZE_REGRESSION');
assert(assetManifest.responsive_contract?.tablet_behavior==='PRESERVE_CORE_UI_BLOCK_AND_TOUCH_FLOW__EXPAND_WORLD_BACKGROUND','TABLET_MUST_EXTEND_BACKGROUND_NOT_REDEFINE_UI');
assert(assetManifest.responsive_contract?.live_ui_max_width_px===430,'TABLET_LIVE_UI_WIDTH_CONTRACT_REGRESSION');
assert(assetManifest.responsive_contract?.forbidden_changes?.includes('NEW_TABLET_INFORMATION_ARCHITECTURE'),'TABLET_NEW_IA_GUARD_MISSING');
assert(styles.includes('Character Formation responsive contract: MOBILE_SOURCE_TABLET_BACKGROUND_EXTENSION'),'RESPONSIVE_CSS_CONTRACT_MISSING');
assert(styles.includes('width:min(430px,calc(100vw - 40px))'),'TABLET_PHONE_SCALE_UI_BLOCK_MISSING');

const poseBank=assetManifest.asset_sources?.core6_pose_action_source_bank||{};
assert(poseBank.canonical_source_file_id==='file_0000000022f0823090aec9a5d4c42aa3','POSE_BANK_CANONICAL_LINEAGE_REGRESSION');
assert(poseBank.identity_rule==='CORE6_VISUAL_ID_REMAINS_HARD_LOCK','POSE_BANK_MUST_NOT_REDEFINE_VISUAL_ID');
assert(['SOURCE_REFERENCE_ONLY_NOT_YET_RUNTIME_BINARY','POSE_BINARY_MATERIALIZATION_OPEN__CANONICAL_FALLBACK_ACTIVE','RUNTIME_SPRITE_BOUND_V1'].includes(poseBank.runtime_binding_state),'POSE_BANK_SOURCE_STATE_INVALID');
assert((poseBank.source_sets?.standing_action_set||[]).length===6,'POSE_BANK_STANDING_SET_INCOMPLETE');
assert((poseBank.source_sets?.seated_context_set||[]).length===6,'POSE_BANK_SEATED_SET_INCOMPLETE');
for(const set of Object.values(poseBank.source_sets||{})){
  for(const x of set)assert(exactCrew.includes(x.id),'POSE_BANK_UNKNOWN_CORE6_'+x.id);
}
console.log('CHARACTER_FORMATION_RESPONSIVE_AND_POSE_SOURCE_BANK_PASS');


// Tablet world must be full-bleed while the live UI remains phone-scale.
assert(assetManifest.responsive_contract?.tablet_world_full_bleed===true,'TABLET_WORLD_FULL_BLEED_CONTRACT_MISSING');
assert(assetManifest.responsive_contract?.tablet_live_ui_remains_phone_scale===true,'TABLET_LIVE_UI_PHONE_SCALE_CONTRACT_MISSING');
assert(styles.includes('#formationJourneyView.view,')&&styles.includes('#characterSetupView.view{'),'TABLET_FULL_BLEED_VIEW_OVERRIDE_MISSING');


// Tablet background extends without cover-zooming the phone source art.
assert(assetManifest.responsive_contract?.tablet_background_scaling==='PRESERVE_SOURCE_HEIGHT_RIGHT_ANCHORED','TABLET_BACKGROUND_SCALE_CONTRACT_MISSING');
assert(assetManifest.responsive_contract?.tablet_extension_fill==='PREPARATION_ROOM_TONE_EXTENSION','TABLET_BACKGROUND_EXTENSION_FILL_CONTRACT_MISSING');
assert(styles.includes('Character Formation tablet world extension without background zoom'),'TABLET_NO_ZOOM_EXTENSION_CSS_MISSING');


// Stage-specific compositions must remain distinct.
assert(journey.includes('formationCrewMeetStage'),'CREW_MEET_GROUP_STAGE_COMPOSITION_MISSING');
assert(journey.includes('formationCrewMeetConstellation'),'CREW_MEET_GROUP_COMPOSITION_MISSING');
assert(journey.includes('formationCrewGrid selectable'),'COMPANION_SELECT_CARD_COMPOSITION_MISSING');
assert(journey.includes('formationNameStage'),'COMPANION_NAME_RELATIONSHIP_COMPOSITION_MISSING');
assert(journey.includes('formationNameCrew'),'COMPANION_NAME_SELECTED_CREW_VISUAL_MISSING');
assert(styles.includes('Character Formation stage-specific composition: A01 meet / A02 select / A03 name'),'STAGE_SPECIFIC_VISUAL_CSS_MISSING');
const crewMeetSlice=journey.slice(
  journey.indexOf("if(s==='CREW_MEET')"),
  journey.indexOf("}else if(s==='COMPANION_SELECT')")
);
assert(crewMeetSlice.length>0,'CREW_MEET_SOURCE_SLICE_MISSING');
assert(!crewMeetSlice.includes('formationCrewGrid'),'CREW_MEET_MUST_NOT_REUSE_SELECTION_CARD_GRID');


// Tablet visual parity correction: world extension must be manifest-bound.
assert(assetManifest.asset_files?.background?.prep_room_tablet_extension==='assets/character-formation/background/prep-room-tablet-extension.svg','TABLET_WORLD_EXTENSION_ASSET_MISSING');
assert(index.includes('data-cf-asset-key="prep_room_tablet_extension"'),'TABLET_WORLD_EXTENSION_DOM_BINDING_MISSING');
assert(styles.includes('Character Formation tablet visual parity correction V01'),'TABLET_VISUAL_PARITY_CSS_MISSING');
assert(styles.includes('#characterSetupView .cfCommonTools{\n    left:auto;\n    right:0;\n    width:430px;'),'TABLET_COMMON_TOOLS_MUST_STAY_IN_PHONE_STAGE');


// Pose/action derivatives are optional runtime enrichments. Canonical direct extracts remain safe fallback.
assert(index.includes('character-formation-pose-bank-runtime.js'),'POSE_BANK_RUNTIME_NOT_LOADED');
assert(index.indexOf('character-formation-pose-bank-runtime.js')<index.indexOf('character-formation-scene-runtime.js'),'POSE_BANK_RUNTIME_LOAD_ORDER_INVALID');
assert(poseBankRuntime.includes("identityAuthority:'CORE6_CANONICAL_VISUAL_ID'"),'POSE_BANK_IDENTITY_AUTHORITY_REGRESSION');
assert(poseBankRuntime.includes('changesIdentity:false'),'POSE_BANK_MUST_NOT_CHANGE_IDENTITY');
assert(journey.includes('bindPoseBankImages'),'JOURNEY_POSE_BANK_BINDING_MISSING');
assert(journey.includes("stageName==='COMPANION_NAME'?'seated':'standing'"),'JOURNEY_STAGE_POSE_MAPPING_MISSING');
assert(sceneRuntime.includes("CharacterFormationPoseBank?.bindImage?.(crewImg,id,'seated')"),'PREPARATION_SCENE_SEATED_POSE_BINDING_MISSING');
console.log('CHARACTER_FORMATION_POSE_BANK_CONSUMER_CONTRACT_PASS');


// Final Character Formation completion contract.
const poseAsset=assetManifest.asset_sources?.core6_pose_action_source_bank?.runtime_asset||{};
assert(assetManifest.current_runtime_anchor?.state==='CHARACTER_FORMATION_RUNTIME_COMPLETE','CHARACTER_FORMATION_FINAL_STATE_REGRESSION');
assert(assetManifest.current_runtime_anchor?.proof_required==='COMPLETE','CHARACTER_FORMATION_FINAL_PROOF_STATE_REGRESSION');
assert(Array.isArray(assetManifest.current_runtime_anchor?.pending_only)&&assetManifest.current_runtime_anchor.pending_only.length===0,'CHARACTER_FORMATION_PENDING_OPEN_MUST_BE_EMPTY');
assert(assetManifest.asset_sources?.core6_pose_action_source_bank?.runtime_binding_state==='RUNTIME_SPRITE_BOUND_V1','POSE_RUNTIME_SPRITE_BINDING_STATE_MISSING');
assert(assetManifest.asset_sources?.core6_pose_action_source_bank?.consumer_binding_state==='CONSUMER_BOUND_TO_REPO_SPRITE_WITH_CANONICAL_FALLBACK','POSE_CONSUMER_SPRITE_STATE_MISSING');
assert(assetManifest.asset_sources?.core6_pose_action_source_bank?.user_action_required===false,'USER_MUST_NOT_BECOME_POSE_BINARY_DEBUGGER');
assert(assetManifest.asset_sources?.core6_pose_action_source_bank?.fallback==='asset_files.crew canonical direct extracts','POSE_CANONICAL_FALLBACK_MISSING');
assert(poseAsset.path==='assets/character-formation/crew/core6-pose-sprite-64.webp','POSE_SPRITE_PATH_REGRESSION');
assert(fs.existsSync(poseAsset.path),'POSE_SPRITE_BINARY_MISSING');
const poseSpriteHash=crypto.createHash('sha256').update(fs.readFileSync(poseAsset.path)).digest('hex');
assert(poseSpriteHash===poseAsset.sha256,'POSE_SPRITE_BINARY_HASH_MISMATCH');
assert(poseBankRuntime.includes("SPRITE_URL='./assets/character-formation/crew/core6-pose-sprite-64.webp'"),'POSE_RUNTIME_SPRITE_URL_MISSING');
assert(poseBankRuntime.includes("backgroundSize='600% 200%'"),'POSE_RUNTIME_SPRITE_GEOMETRY_BINDING_MISSING');
assert(assetManifest.asset_quality?.pose_action_runtime==='REPO_SPRITE_BOUND_V1__FINAL_VISUAL_PARITY_PASS','POSE_FINAL_VISUAL_PARITY_NOT_LOCKED');
assert(assetManifest.asset_quality?.final_anchor_parity==='RESPONSIVE_POSE_BOUND_RUNTIME_VISUAL_PARITY_PASS','FINAL_ANCHOR_PARITY_NOT_LOCKED');
assert(assetManifest.final_runtime_proof?.pose_dom_binding==='PASS','POSE_DOM_PROOF_MISSING');
assert(assetManifest.final_runtime_proof?.responsive_geometry==='PASS','RESPONSIVE_GEOMETRY_PROOF_MISSING');
assert(assetManifest.final_runtime_proof?.visual_review==='PASS','FINAL_VISUAL_REVIEW_PROOF_MISSING');
console.log('CHARACTER_FORMATION_FINAL_COMPLETION_PASS',poseSpriteHash);

assert(['chunk-1.js','chunk-2.js','chunk-3.js','chunk-4.js','chunk-5.js'].every(x=>index.includes('./src/identity/pose-data/'+x)),'POSE_SPRITE_CHUNKS_NOT_LOADED');
assert(poseBankRuntime.includes("materialization:'REPOSITORY_EMBEDDED_WEBP_SPRITE_2X6'"),'POSE_SPRITE_RUNTIME_MATERIALIZATION_MISSING');
assert(poseBankRuntime.includes('spriteCells:12'),'POSE_SPRITE_CELL_COUNT_MISSING');
console.log('CHARACTER_FORMATION_POSE_BINARY_MATERIALIZATION_PASS');
