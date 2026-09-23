import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/identity/character-signature-item-runtime.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(source,context);
const api=context.globalThis.CharacterExplorationSignatureItem;
if(!api)throw new Error('SIGNATURE_ITEM_RUNTIME_MISSING');

const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const expected=['CAMERA','COMPASS','FIELD_NOTEBOOK','BINOCULARS','WATER_BOTTLE'];
const state=api.createState();
assert(state.status==='ITEM_SELECTION','SIGNATURE_ITEM_STATE_INVALID');
assert(JSON.stringify(state.offered)===JSON.stringify(expected),'SIGNATURE_ITEM_MUST_OFFER_LOCKED_FIVE');
assert(new Set(state.offered).size===5,'SIGNATURE_ITEM_OPTIONS_MUST_BE_DISTINCT');
assert(state.rule==='EXACTLY_ONE_SIGNATURE_ITEM','SIGNATURE_ITEM_ONE_ONLY_RULE_INVALID');

const selected=api.select(state,state.offered[0]);
assert(selected.status==='ITEM_SELECTED','SIGNATURE_ITEM_SELECTION_FAILED');
assert(selected.selected?.id===state.offered[0],'SIGNATURE_ITEM_SELECTED_ID_INVALID');

const contract=api.generationContract(selected.selected);
assert(contract.candidate_rule==='SAME_ITEM_ACROSS_A_B_C','SIGNATURE_ITEM_A_B_C_RULE_INVALID');
assert(contract.correction_rule==='PRESERVE_SIGNATURE_ITEM','SIGNATURE_ITEM_CORRECTION_RULE_INVALID');
assert(contract.max_visible_signature_items===1,'SIGNATURE_ITEM_MAX_COUNT_INVALID');
assert(contract.identity_priority==='IDENTITY_OVER_ITEM','SIGNATURE_ITEM_IDENTITY_PRIORITY_INVALID');
assert(contract.selected?.face_policy,'SIGNATURE_ITEM_FACE_POLICY_REQUIRED');

assert(JSON.stringify(api.OFFERED)===JSON.stringify(expected),'SIGNATURE_ITEM_API_OFFERED_SET_MISMATCH');
assert(Object.keys(api.ITEMS).length===5,'SIGNATURE_ITEM_CATALOG_MUST_HAVE_FIVE');
for(const item of Object.values(api.ITEMS)){
  assert(item.prompt,'SIGNATURE_ITEM_PROMPT_REQUIRED:'+item.id);
  assert(item.face_policy,'SIGNATURE_ITEM_FACE_POLICY_REQUIRED:'+item.id);
}
console.log('CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01 PASS');
