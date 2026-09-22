import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/identity/character-direction-runtime.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(source,context);
const api=context.globalThis.CharacterVisualIdDirection||context.globalThis.ReadyCharacterDirection;
if(!api) throw new Error('CHARACTER_DIRECTION_RUNTIME_MISSING');

const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};
const ids=a=>Array.from(a,x=>x.id);

assert(api.identityContract().userSelectionsExactly===2,'USER_SELECTION_COUNT_MUST_BE_TWO');
assert(api.identityContract().thirdDirection==='SYSTEM_AUTO_CONTRAST','THIRD_DIRECTION_MUST_BE_SYSTEM_AUTO');
assert(api.identityContract().sourcePhotoIsHighestAuthority===true,'SOURCE_PHOTO_IDENTITY_LOCK_MISSING');
assert(api.identityContract().directionChangesIdentity===false,'MOOD_DIRECTION_MUST_NOT_REDEFINE_IDENTITY');
assert(api.identityContract().emojiOrEmoticonUi===false,'EMOJI_UI_MUST_BE_DISABLED');

const r1=api.firstRound();
assert(r1.length===3,'ROUND_1_MUST_HAVE_THREE_OPTIONS');
let s=api.createState();
s=api.select(s,r1[0].id);
assert(s.selectionCount===1&&s.status==='ROUND_2','ROUND_1_SELECTION_STATE_INVALID');

const r2=api.secondRound(s.firstSelection);
assert(r2.length===3,'ROUND_2_MUST_HAVE_THREE_OPTIONS');
assert(!ids(r2).includes(s.firstSelection),'ROUND_2_MUST_EXCLUDE_FIRST_SELECTION');

s=api.select(s,r2[0].id);
assert(s.selectionCount===2,'DIRECT_SELECTIONS_MUST_STOP_AT_TWO');
assert(s.status==='READY_FOR_CANDIDATE_GENERATION','CANDIDATE_READY_STATE_INVALID');
assert(s.candidates.length===3,'THREE_CANDIDATE_DIRECTIONS_REQUIRED');
assert(s.candidates[0].source==='USER_SELECTION_1','CANDIDATE_A_PROVENANCE_INVALID');
assert(s.candidates[1].source==='USER_SELECTION_2','CANDIDATE_B_PROVENANCE_INVALID');
assert(s.candidates[2].source==='SYSTEM_AUTO_CONTRAST','CANDIDATE_C_PROVENANCE_INVALID');
assert(new Set(s.candidates.map(x=>x.direction.id)).size===3,'CANDIDATE_DIRECTIONS_MUST_BE_DISTINCT');

console.log('CHARACTER_VISUAL_ID_DIRECTION_V01 PASS');
