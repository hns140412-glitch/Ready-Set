(function(root){
'use strict';
if(typeof state==='undefined'||typeof save!=='function'||typeof nav!=='function')return;
const direction=root.CharacterVisualIdDirection||root.ReadyCharacterDirection;
const coreApi=root.CharacterVisualIdCoreOrchestrator||root.ReadyCharacterCoreOrchestrator;
const remoteApi=root.CharacterVisualIdRemoteAdapter||root.ReadyCharacterRemoteAdapter;
const masterApi=root.CharacterVisualIdMaster||root.ReadyCharacterMaster;
const derivativeApi=root.CharacterVisualIdDerivative;
const setupViewApi=root.CharacterVisualIdSetupView||root.ReadyCharacterSetupView;
const setupControllerApi=root.CharacterVisualIdSetupController||root.ReadyCharacterSetupController;
const journeyApi=root.CharacterFormationJourneyRuntime;
if(!direction||!coreApi||!remoteApi||!masterApi||!setupViewApi||!setupControllerApi||!journeyApi)return;

state.profile=state.profile||{};
if(!state.profile.characterDirection)state.profile.characterDirection=direction.createState();
if(!('sourcePhoto' in state.profile))state.profile.sourcePhoto=null;
if(!('characterGenerationJob' in state.profile))state.profile.characterGenerationJob=null;
if(!('characterRemoteJob' in state.profile))state.profile.characterRemoteJob=null;
if(!('characterMaster' in state.profile))state.profile.characterMaster=null;
if(!('visualId' in state.profile))state.profile.visualId=null;
state.expedition=state.expedition||{};
save();

const rebuildCharacterDirection=direction;
const rebuildCharacterCore=coreApi;
const rebuildCharacterRemoteAdapter=remoteApi;
const rebuildCharacterMaster=masterApi;
const rebuildCharacterDerivative=derivativeApi;
const rebuildCharacterSetupView=setupViewApi;
const rebuildCharacterSetupController=setupControllerApi;
const rebuildCharacterFormationJourney=journeyApi;
const characterCoreRuntime=rebuildCharacterCore.create({
  directionApi:rebuildCharacterDirection,
  jobApi:root.ReadyCharacterGenerationJob,
  assetKeysApi:root.ReadyCharacterAssetKeys
});
root.ReadySetCharacterDirection=rebuildCharacterDirection;
root.ReadySetCharacterCore=characterCoreRuntime;
const characterRemoteRuntime=rebuildCharacterRemoteAdapter.create();
const characterMasterApi=rebuildCharacterMaster;
let characterFormationJourneyRuntime=null;
const characterFormationAssetRegistry=globalThis.CharacterFormationAssetRuntime?.create({
  manifestUrl:'./assets/character-formation/asset-manifest.json'
});
const characterSetupView=rebuildCharacterSetupView.create({
  query:$,
  escapeHtml,
  applyAvatar,
  assetRegistry:characterFormationAssetRegistry
});
const characterFormationSceneRuntime=globalThis.CharacterFormationSceneRuntime?.create({
  query:$,
  getState:()=>state,
  assetRegistry:characterFormationAssetRegistry
});
const characterSetupRuntime=rebuildCharacterSetupController.create({
  view:characterSetupView,
  core:characterCoreRuntime,
  getState:()=>state,
  save,
  familySession,
  toast,
  remote:characterRemoteRuntime,
  masterApi:characterMasterApi,
  derivativeApi:rebuildCharacterDerivative
});
characterFormationJourneyRuntime=rebuildCharacterFormationJourney.create({
  query:$,
  getState:()=>state,
  save,
  nav,
  toast,
  assetRegistry:characterFormationAssetRegistry
});
characterFormationAssetRegistry?.load?.().then(()=>{
  characterFormationAssetRegistry?.bind?.($('#formationJourneyView'));
  characterFormationAssetRegistry?.bind?.($('#characterSetupView'));
  characterFormationJourneyRuntime?.render?.();
  characterFormationSceneRuntime?.render?.($('#characterSetupView')?.dataset.cfStatus||'START');
  characterSetupRuntime?.render?.();
});
$('#openCharacterSetupBtn').onclick=()=>{
  nav('formation-journey');
  characterFormationJourneyRuntime?.render?.();
};
$('#beginCharacterSetupBtn').onclick=()=>{
  const result=characterSetupRuntime.begin();
  if(result?.ok)$('#beginCharacterSetupBtn').hidden=true;
};
$('#characterSetupView').addEventListener('click',async e=>{
  const continueItem=e.target.closest?.('#continueAfterSignatureItemBtn');
  if(continueItem){
    const result=characterSetupRuntime.continueAfterItem();
    if(result?.ok)characterFormationSceneRuntime?.render?.(result.status);
    return;
  }
  const prepare=e.target.closest?.('#prepareCharacterJobBtn');
  const generate=e.target.closest?.('#generateCharacterCandidatesBtn');
  const select=e.target.closest?.('[data-select-character-candidate]');
  const reviewConsistency=e.target.closest?.('#reviewCharacterConsistencyBtn');
  const confirmSameIdentity=e.target.closest?.('#confirmSameIdentityBtn');
  const correct=e.target.closest?.('#correctCharacterLikenessBtn');
  const lockMaster=e.target.closest?.('#lockCharacterMasterBtn');
  const derivatives=e.target.closest?.('#buildCharacterDerivativesBtn');
  const masterSheet=e.target.closest?.('#generateCharacterMasterSheetBtn');
  const button=prepare||generate||select||reviewConsistency||confirmSameIdentity||correct||lockMaster||derivatives||masterSheet;
  if(!button)return;
  const status=$('#characterRemoteStatus');
  button.disabled=true;
  try{
    let result=null;
    if(prepare){
      if(status)status.textContent='원본 사진과 생성 계약을 서버에 등록하는 중…';
      result=await characterSetupRuntime.prepareRemoteJob();
      if(result?.ok){
        toast('캐릭터 생성 준비를 서버에 저장했어요.');
        characterSetupRuntime.render();
      }
    }else if(generate){
      if(status)status.textContent='A/B/C 후보를 순서대로 생성하는 중…';
      result=await characterSetupRuntime.generateAllCandidates();
      if(result?.ok){
        toast('캐릭터 후보 3개가 준비됐어요.');
        characterSetupRuntime.render();
      }
    }else if(select){
      const slot=select.dataset.selectCharacterCandidate;
      result=await characterSetupRuntime.selectCandidate(slot);
      if(result?.ok){
        toast('이 후보를 기준 캐릭터로 선택했어요.');
        characterSetupRuntime.render();
      }
    }else if(reviewConsistency){
      if(status)status.textContent='원본 사진과 후보들을 비교해 같은 나인지 검사하는 중…';
      result=await characterSetupRuntime.reviewConsistency();
      if(result?.ok){
        toast(result.state==='PASS'?'같은 나로 일관되게 보여요.':'일관성 보정이 더 필요해요.');
        characterSetupRuntime.render();
      }
    }else if(confirmSameIdentity){
      if(status)status.textContent='같은 나 확인을 저장하는 중…';
      result=await characterSetupRuntime.confirmSameIdentity({accepted:true});
      if(result?.ok){
        toast('같은 나로 확인했어요.');
        characterSetupRuntime.render();
      }
    }else if(correct){
      if(status)status.textContent='원본 사진과 선택 후보를 비교해 닮기를 보정하는 중…';
      result=await characterSetupRuntime.correctLikeness();
      if(result?.ok){
        toast('원본 사진 기준 닮기 보정이 끝났어요.');
        characterSetupRuntime.render();
      }
    }else if(lockMaster){
      if(status)status.textContent='Visual ID를 잠그는 중…';
      result=await characterSetupRuntime.lockMaster();
      if(result?.ok){
        toast('내 캐릭터 Visual ID가 확정됐어요.');
        nav('formation-journey');
        characterFormationJourneyRuntime?.syncAfterCharacterLock?.();
      }
    }else if(derivatives){
      if(status)status.textContent='프로필/카드용 이미지를 준비하는 중…';
      result=await characterSetupRuntime.buildDerivativeAssets();
      if(result?.ok){
        toast('캐릭터 활용 이미지가 준비됐어요.');
        characterSetupRuntime.render();
      }
    }else if(masterSheet){
      if(status)status.textContent='Character Master 일관성 시트를 만드는 중…';
      result=await characterSetupRuntime.generateMasterSheet();
      if(result?.ok){
        toast('Character Master가 준비됐어요.');
        characterSetupRuntime.render();
      }
    }
    if(result&&!result.ok){
      const reason=String(result.reason||'UNKNOWN');
      if(status)status.textContent='처리 중단 · '+reason;
      if(reason==='UNAUTHENTICATED')toast('로그인 후 서버 기능을 사용할 수 있어요.');
      else if(reason==='CHARACTER_GENERATION_PROVIDER_LOCKED')toast('이미지 생성은 외부 리소스 게이트로 잠겨 있어요.');
      else if(reason==='CHARACTER_VISUAL_REVIEW_PROVIDER_LOCKED')toast('시각 일관성 검사는 외부 리소스 게이트로 잠겨 있어요.');
      else if(reason==='CHARACTER_CONSISTENCY_GATE_NOT_PASS')toast('일관성 확인이 끝나야 Visual ID를 확정할 수 있어요.');
      else toast('캐릭터 작업을 완료하지 못했어요.');
    }
  }catch(err){
    if(status)status.textContent='처리 중단 · '+String(err?.message||err);
    toast('캐릭터 작업을 완료하지 못했어요.');
  }finally{button.disabled=false;}
});
$('#characterDirectionGrid').onclick=e=>{
  const direction=e.target.closest?.('[data-character-direction]');
  if(direction){
    const result=characterSetupRuntime.choose(direction.dataset.characterDirection);
    if(result?.ok)characterFormationSceneRuntime?.render?.(result.status);
    return;
  }
  const item=e.target.closest?.('[data-character-item]');
  if(item){
    const result=characterSetupRuntime.chooseItem(item.dataset.characterItem);
    if(result?.ok)characterFormationSceneRuntime?.render?.(result.status);
  }
};




root.ReadyCharacterIntroIntegration=Object.freeze({
  version:'READY_CHARACTER_INTRO_INTEGRATION_V01',
  stage:()=>characterFormationJourneyRuntime?.stage?.()||'UNAVAILABLE',
  render:()=>characterFormationJourneyRuntime?.render?.()
});
})(globalThis);
