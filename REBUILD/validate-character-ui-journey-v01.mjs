import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const index=read('index.html');
const app=read('app.js');
const view=read('src/identity/character-setup-view-runtime.js');
const controller=read('src/identity/character-setup-controller-runtime.js');
const core=read('src/identity/character-core-orchestrator-runtime.js');

assert(index.includes('id="characterSetupView"'),'CHARACTER_SETUP_VIEW_MISSING');
assert(index.includes('id="openCharacterSetupBtn"'),'CHARACTER_SETUP_ENTRY_MISSING');
assert(index.includes('id="characterDirectionGrid"'),'CHARACTER_DIRECTION_GRID_MISSING');
assert(index.includes('character-setup-view-runtime.js'),'CHARACTER_SETUP_VIEW_NOT_LOADED');
assert(index.includes('character-setup-controller-runtime.js'),'CHARACTER_SETUP_CONTROLLER_NOT_LOADED');
assert(index.indexOf('character-setup-view-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_VIEW_LOAD_ORDER_INVALID');
assert(index.indexOf('character-setup-controller-runtime.js')<index.indexOf('app.js'),'CHARACTER_SETUP_CONTROLLER_LOAD_ORDER_INVALID');

assert(app.includes("'character-setup':()=>characterSetupRuntime.render()"),'CHARACTER_SETUP_ROUTE_MISSING');
assert(app.includes('characterSetupRuntime.begin()'),'CHARACTER_SETUP_BEGIN_NOT_WIRED');
assert(app.includes('characterSetupRuntime.choose(button.dataset.characterDirection)'),'CHARACTER_SETUP_CHOICE_NOT_WIRED');
assert(app.includes("nav('character-setup')"),'CHARACTER_SETUP_ENTRY_NAV_MISSING');

assert(controller.includes("status:'ROUND_2'"),'ROUND_2_UI_STATE_MISSING');
assert(controller.includes('SYSTEM_AUTO_CONTRAST')===false,'CONTROLLER_MUST_NOT_INVENT_AUTO_CONTRAST');
assert(core.includes('p.characterDirection.candidates'),'CORE_MUST_OWN_CANDIDATE_DIRECTION_RESULT');
assert(view.includes('두 번만 직접 고르면 끝이에요.'),'TWO_SELECTION_COPY_MISSING');
assert(view.includes('시스템이 대비되도록 만든 방향'),'AUTO_CONTRAST_COPY_MISSING');
assert(view.includes('유료 이미지 호출을 하지 않습니다.'),'NO_PAID_GENERATION_DISCLOSURE_MISSING');

console.log('READY_CHARACTER_UI_JOURNEY_V01_PASS');
