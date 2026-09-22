import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const index=read('index.html');
const app=read('app.js');
const view=read('src/identity/character-setup-view-runtime.js');
const controller=read('src/identity/character-setup-controller-runtime.js');
const core=read('src/identity/character-core-orchestrator-runtime.js');
const signatureItemRuntime=read('src/identity/character-signature-item-runtime.js');
const signatureItemServer=read('netlify/functions/character-signature-item-core.mjs');

assert(index.includes('id="characterSetupView"'),'CHARACTER_SETUP_VIEW_MISSING');
assert(index.includes('id="openCharacterSetupBtn"'),'CHARACTER_SETUP_ENTRY_MISSING');
assert(index.includes('id="characterDirectionGrid"'),'CHARACTER_DIRECTION_GRID_MISSING');
assert(index.includes('character-setup-view-runtime.js'),'CHARACTER_SETUP_VIEW_NOT_LOADED');
assert(index.includes('character-setup-controller-runtime.js'),'CHARACTER_SETUP_CONTROLLER_NOT_LOADED');
assert(index.includes('character-signature-item-runtime.js'),'SIGNATURE_ITEM_RUNTIME_NOT_LOADED');
assert(index.indexOf('character-setup-view-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_VIEW_LOAD_ORDER_INVALID');
assert(index.indexOf('character-setup-controller-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_CONTROLLER_LOAD_ORDER_INVALID');

assert(app.includes("'character-setup':()=>characterSetupRuntime.render()"),'CHARACTER_SETUP_ROUTE_MISSING');
assert(app.includes('characterSetupRuntime.begin()'),'CHARACTER_SETUP_BEGIN_NOT_WIRED');
assert(app.includes('characterSetupRuntime.choose(direction.dataset.characterDirection)'),'CHARACTER_SETUP_CHOICE_NOT_WIRED');
assert(app.includes("nav('character-setup')"),'CHARACTER_SETUP_ENTRY_NAV_MISSING');

assert(controller.includes("status:'ROUND_2'"),'ROUND_2_UI_STATE_MISSING');
assert(controller.includes("status:'ITEM_SELECTION'"),'SIGNATURE_ITEM_UI_STATE_MISSING');
assert(controller.includes('chooseItem'),'SIGNATURE_ITEM_CONTROLLER_MISSING');
assert(app.includes('data-character-item'),'SIGNATURE_ITEM_UI_ACTION_MISSING');
assert(controller.includes('SYSTEM_AUTO_CONTRAST')===false,'CONTROLLER_MUST_NOT_INVENT_AUTO_CONTRAST');
assert(core.includes('p.characterDirection.candidates'),'CORE_MUST_OWN_CANDIDATE_DIRECTION_RESULT');
assert(core.includes("status:'ITEM_SELECTION'"),'CORE_SIGNATURE_ITEM_STAGE_MISSING');
assert(signatureItemRuntime.includes('EXACTLY_ONE_SIGNATURE_ITEM'),'SIGNATURE_ITEM_ONE_ONLY_RULE_MISSING');
assert(signatureItemRuntime.includes('SAME_ITEM_ACROSS_A_B_C'),'SIGNATURE_ITEM_CANDIDATE_RULE_MISSING');
assert(signatureItemServer.includes('normalizeSignatureItem'),'SIGNATURE_ITEM_SERVER_VALIDATION_MISSING');
assert(view.includes('두 번만 직접 고르면 끝이에요.'),'TWO_SELECTION_COPY_MISSING');
assert(view.includes('시스템이 만든 대비 방향'),'AUTO_CONTRAST_PROVENANCE_COPY_MISSING');
assert(view.includes('세 후보 모두 같은 나'),'SAME_CHILD_COMPARISON_COPY_MISSING');

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
