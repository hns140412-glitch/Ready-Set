import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const direction=read('src/identity/character-direction-runtime.js');
const identity=read('src/identity/character-identity-consistency-runtime.js');
const signatureItem=read('src/identity/character-signature-item-runtime.js');
const signatureItemServer=read('netlify/functions/character-signature-item-core.mjs');
const consistency=read('src/identity/character-consistency-gate-runtime.js');
const consistencyReview=read('netlify/functions/character-consistency-review.mjs');
const jobServer=read('netlify/functions/character-job.mjs');
const master=read('src/identity/character-master-runtime.js');
const controller=read('src/identity/character-setup-controller-runtime.js');
const projection=read('src/identity/character-visual-id-projection-runtime.js');
const derivative=read('src/identity/character-derivative-runtime.js');
const derivativeServer=read('netlify/functions/character-derivatives.mjs');
const view=read('src/identity/character-setup-view-runtime.js');
const app=read('app.js');
const index=read('index.html');
const serverMaster=read('netlify/functions/character-master.mjs');

const checks=[
  ['independent direction namespace',direction.includes('root.CharacterVisualIdDirection=api')],
  ['identity consistency contract',identity.includes('SAME_CHILD_DIFFERENT_DIRECTION')&&identity.includes("identity_authority:'SOURCE_PHOTO'")],
  ['consistency gate contract',consistency.includes('CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01')&&consistency.includes('assertLockable')],
  ['visual review remains externally gated',consistencyReview.includes('CHARACTER_VISUAL_ID_PAID_REVIEW')],
  ['job server validates identity contract',jobServer.includes('validateIdentityContract')&&jobServer.includes('IDENTITY_CONTRACT_VERSION')],
  ['Ready direction alias compatibility retained',direction.includes('root.ReadyCharacterDirection=api')],
  ['independent master namespace',master.includes('root.CharacterVisualIdMaster=api')],
  ['local master cannot bypass gate',master.includes('CHARACTER_CONSISTENCY_GATE_NOT_PASS')],
  ['Visual ID lock distinct from derivatives',master.includes("state:'VISUAL_ID_LOCKED'")&&master.includes("derivative_state:'DERIVATIVES_PENDING'")],
  ['derived assets explicit readiness',master.includes("state:'MASTER_ASSETS_READY'")&&master.includes('attachDerivedAssets')],
  ['controller prefers Character namespace',controller.includes('root.CharacterVisualIdMaster||root.ReadyCharacterMaster')],
  ['projection contract exists',projection.includes("CHARACTER_VISUAL_ID_PROJECTION_V02")],
  ['signature item independent contract',signatureItem.includes('CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01')&&signatureItem.includes('EXACTLY_ONE_SIGNATURE_ITEM')],
  ['signature item server validation',signatureItemServer.includes('normalizeSignatureItem')&&signatureItemServer.includes('SAME_ITEM_ACROSS_A_B_C')],
  ['projection exposes only minimal signature item',projection.includes('signature_item:')&&projection.includes('label:clean')],
  ['projection exposes identity vs derivative readiness',projection.includes('identity_locked')&&projection.includes('derivatives_ready')],
  ['projection assurance is required',projection.includes('CHARACTER_VISUAL_ID_ASSURANCE_NOT_PASS')&&projection.includes('assurance')],
  ['server does not fake portrait derivative',serverMaster.includes('portrait_card:null')],
  ['server does not fake avatar derivative',serverMaster.includes('avatar_square:null')],
  ['server records derivative pending',serverMaster.includes("derivative_state:'DERIVATIVES_PENDING'")],
  ['deterministic derivative runtime exists',derivative.includes("CHARACTER_VISUAL_ID_DERIVATIVE_V01")&&derivative.includes('deriveFromUrl')],
  ['derivative server stores real avatar and portrait assets',derivativeServer.includes("avatar-square.")&&derivativeServer.includes("portrait-card.")],
  ['derivative server promotes MASTER_ASSETS_READY',derivativeServer.includes("job.status='MASTER_ASSETS_READY'")],
  ['formation UI exposes derivative step',view.includes('buildCharacterDerivativesBtn')&&view.includes('활용 이미지 준비')],
  ['app wires derivative build handler',app.includes('buildDerivativeAssets')&&app.includes('buildCharacterDerivativesBtn')],
  ['index loads derivative runtime',index.includes('character-derivative-runtime.js')],
  ['index loads projection runtime',index.includes('character-visual-id-projection-runtime.js')]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log((ok?'PASS ':'FAIL ')+name);
if(failed.length){
  console.error('Character independence/formation validation failed:',failed.map(x=>x[0]).join(', '));
  process.exit(1);
}
console.log('CHARACTER_VISUAL_ID_INDEPENDENCE_AND_FORMATION_V01 PASS');
