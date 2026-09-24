import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL=process.env.CF_PROOF_URL||'http://127.0.0.1:4173/';
const outDir=process.env.CF_PROOF_OUT||'artifacts/character-formation-responsive-proof';
await fs.mkdir(outDir,{recursive:true});

const browser=await chromium.launch({headless:true});

async function openPage(viewport,{withPhoto=false}={}){
  const page=await browser.newPage({viewport});
  if(withPhoto){
    await page.addInitScript(()=>{
      localStorage.setItem('readyset_state',JSON.stringify({
        schemaVersion:5,
        profile:{
          name:'Responsive Proof',
          sourcePhoto:{source_hash:'responsive-proof-source',width:1200,height:1600}
        }
      }));
    });
  }else{
    await page.addInitScript(()=>localStorage.removeItem('readyset_state'));
  }
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>typeof window.nav==='function');
  return page;
}

async function measure(page,viewSelector,sceneSelector,uiSelector){
  return await page.evaluate(({viewSelector,sceneSelector,uiSelector})=>{
    const view=document.querySelector(viewSelector);
    const scene=document.querySelector(sceneSelector);
    const ui=document.querySelector(uiSelector);
    const vr=view.getBoundingClientRect();
    const sr=scene.getBoundingClientRect();
    const ur=ui.getBoundingClientRect();
    return {
      viewport:{width:window.innerWidth,height:window.innerHeight},
      view:{x:vr.x,y:vr.y,width:vr.width,height:vr.height},
      scene:{x:sr.x,y:sr.y,width:sr.width,height:sr.height},
      ui:{x:ur.x,y:ur.y,width:ur.width,height:ur.height,right:ur.right},
      rightGap:window.innerWidth-ur.right
    };
  },{viewSelector,sceneSelector,uiSelector});
}

function assertResponsivePair(name,mobile,tablet){
  const fail=(reason)=>{throw new Error('RESPONSIVE_GEOMETRY_FAIL:'+name+':'+reason);};
  if(Math.abs(mobile.scene.width-mobile.viewport.width)>2)fail('MOBILE_SCENE_NOT_FULL_VIEWPORT');
  if(Math.abs(tablet.scene.width-tablet.viewport.width)>2)fail('TABLET_SCENE_NOT_FULL_VIEWPORT');
  if(tablet.ui.width>432)fail('TABLET_UI_BLOCK_TOO_WIDE:'+tablet.ui.width);
  if(tablet.ui.width<360)fail('TABLET_UI_BLOCK_TOO_NARROW:'+tablet.ui.width);
  if(tablet.rightGap<18)fail('TABLET_UI_RIGHT_SAFE_GAP_TOO_SMALL:'+tablet.rightGap);
  if(tablet.rightGap>Math.max(120,tablet.viewport.width*.12))fail('TABLET_UI_NOT_IN_RIGHT_TOUCH_ZONE:'+tablet.rightGap);
  if(tablet.ui.width>mobile.ui.width*1.18)fail('TABLET_UI_SCALED_UP_TOO_MUCH');
}

async function screenshotJourney(viewport,label,stage){
  const page=await openPage(viewport);
  await page.evaluate(()=>window.nav('formation-journey'));
  await page.waitForSelector('#formationJourneyView.active');
  if(stage==='COMPANION_SELECT'||stage==='COMPANION_NAME'){
    await page.click('[data-formation-action="MEET_DONE"]');
    await page.waitForFunction(()=>document.querySelector('#formationJourneyView')?.dataset.formationStage==='COMPANION_SELECT');
  }
  if(stage==='COMPANION_NAME'){
    await page.click('[data-formation-crew="dubi"]');
    await page.waitForFunction(()=>document.querySelector('#formationJourneyView')?.dataset.formationStage==='COMPANION_NAME');
  }
  const state=await page.getAttribute('#formationJourneyView','data-formation-stage');
  if(state!==stage)throw new Error('JOURNEY_STAGE_MISMATCH:'+state+'!='+stage);
  const geometry=await measure(page,'#formationJourneyView','#formationJourneyView .formationJourneyScene','#formationJourneyView .formationJourneyMain');
  await page.screenshot({path:`${outDir}/${label}.png`,fullPage:true});
  await page.close();
  return geometry;
}

async function screenshotSignature(viewport,label){
  const page=await openPage(viewport,{withPhoto:true});
  await page.evaluate(()=>window.nav('character-setup'));
  await page.waitForSelector('#characterSetupView.active');
  await page.click('#beginCharacterSetupBtn');
  await page.waitForFunction(()=>document.querySelector('#characterSetupView')?.dataset.cfStatus==='ITEM_SELECTION');
  const state=await page.getAttribute('#characterSetupView','data-cf-status');
  if(state!=='ITEM_SELECTION')throw new Error('CHARACTER_SETUP_STAGE_MISMATCH:'+state);
  const geometry=await measure(page,'#characterSetupView','#characterSetupView .cfScene','#characterSetupView .cfCharacterMain');
  await page.screenshot({path:`${outDir}/${label}.png`,fullPage:true});
  await page.close();
  return geometry;
}

const mobile={width:390,height:844};
const tablet={width:1194,height:834};

const proofGeometry={};

proofGeometry.crewMeet={
  mobile:await screenshotJourney(mobile,'01-crew-meet-mobile-390x844','CREW_MEET'),
  tablet:await screenshotJourney(tablet,'02-crew-meet-tablet-1194x834','CREW_MEET')
};
assertResponsivePair('CREW_MEET',proofGeometry.crewMeet.mobile,proofGeometry.crewMeet.tablet);

proofGeometry.companionSelect={
  mobile:await screenshotJourney(mobile,'03-companion-select-mobile-390x844','COMPANION_SELECT'),
  tablet:await screenshotJourney(tablet,'04-companion-select-tablet-1194x834','COMPANION_SELECT')
};
assertResponsivePair('COMPANION_SELECT',proofGeometry.companionSelect.mobile,proofGeometry.companionSelect.tablet);

proofGeometry.companionName={
  mobile:await screenshotJourney(mobile,'05-companion-name-mobile-390x844','COMPANION_NAME'),
  tablet:await screenshotJourney(tablet,'06-companion-name-tablet-1194x834','COMPANION_NAME')
};
assertResponsivePair('COMPANION_NAME',proofGeometry.companionName.mobile,proofGeometry.companionName.tablet);

proofGeometry.signatureItem={
  mobile:await screenshotSignature(mobile,'07-signature-item-mobile-390x844'),
  tablet:await screenshotSignature(tablet,'08-signature-item-tablet-1194x834')
};
assertResponsivePair('SIGNATURE_ITEM',proofGeometry.signatureItem.mobile,proofGeometry.signatureItem.tablet);

await fs.writeFile(`${outDir}/proof.json`,JSON.stringify({
  contract:'MOBILE_SOURCE_TABLET_BACKGROUND_EXTENSION',
  captures:[
    ['CREW_MEET',mobile],
    ['CREW_MEET',tablet],
    ['COMPANION_SELECT',mobile],
    ['COMPANION_SELECT',tablet],
    ['COMPANION_NAME',mobile],
    ['COMPANION_NAME',tablet],
    ['SIGNATURE_ITEM',mobile],
    ['SIGNATURE_ITEM',tablet]
  ],
  geometry:proofGeometry
},null,2)+'\n');

await browser.close();
console.log('CHARACTER_FORMATION_RESPONSIVE_RUNTIME_PROOF_PASS');
