import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const direction=read('src/identity/character-direction-runtime.js');
const master=read('src/identity/character-master-runtime.js');
const controller=read('src/identity/character-setup-controller-runtime.js');
const projection=read('src/identity/character-visual-id-projection-runtime.js');
const serverMaster=read('netlify/functions/character-master.mjs');

const checks=[
  ['independent direction namespace',direction.includes('root.CharacterVisualIdDirection=api')],
  ['Ready direction alias compatibility retained',direction.includes('root.ReadyCharacterDirection=api')],
  ['independent master namespace',master.includes('root.CharacterVisualIdMaster=api')],
  ['Visual ID lock distinct from derivatives',master.includes("state:'VISUAL_ID_LOCKED'")&&master.includes("derivative_state:'DERIVATIVES_PENDING'")],
  ['derived assets explicit readiness',master.includes("state:'MASTER_ASSETS_READY'")&&master.includes('attachDerivedAssets')],
  ['controller prefers Character namespace',controller.includes('root.CharacterVisualIdMaster||root.ReadyCharacterMaster')],
  ['projection contract exists',projection.includes("CHARACTER_VISUAL_ID_PROJECTION_V01")],
  ['projection exposes identity vs derivative readiness',projection.includes('identity_locked')&&projection.includes('derivatives_ready')],
  ['server does not fake portrait derivative',serverMaster.includes('portrait_card:null')],
  ['server does not fake avatar derivative',serverMaster.includes('avatar_square:null')],
  ['server records derivative pending',serverMaster.includes("derivative_state:'DERIVATIVES_PENDING'")]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log((ok?'PASS ':'FAIL ')+name);
if(failed.length){
  console.error('Character independence/formation validation failed:',failed.map(x=>x[0]).join(', '));
  process.exit(1);
}
console.log('CHARACTER_VISUAL_ID_INDEPENDENCE_AND_FORMATION_V01 PASS');
