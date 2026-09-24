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
  await page.screenshot({path:`${outDir}/${label}.png`,fullPage:true});
  await page.close();
}

async function screenshotSignature(viewport,label){
  const page=await openPage(viewport,{withPhoto:true});
  await page.evaluate(()=>window.nav('character-setup'));
  await page.waitForSelector('#characterSetupView.active');
  await page.click('#beginCharacterSetupBtn');
  await page.waitForFunction(()=>document.querySelector('#characterSetupView')?.dataset.cfStatus==='ITEM_SELECTION');
  const state=await page.getAttribute('#characterSetupView','data-cf-status');
  if(state!=='ITEM_SELECTION')throw new Error('CHARACTER_SETUP_STAGE_MISMATCH:'+state);
  await page.screenshot({path:`${outDir}/${label}.png`,fullPage:true});
  await page.close();
}

const mobile={width:390,height:844};
const tablet={width:1194,height:834};

await screenshotJourney(mobile,'01-crew-meet-mobile-390x844','CREW_MEET');
await screenshotJourney(tablet,'02-crew-meet-tablet-1194x834','CREW_MEET');
await screenshotJourney(mobile,'03-companion-select-mobile-390x844','COMPANION_SELECT');
await screenshotJourney(tablet,'04-companion-select-tablet-1194x834','COMPANION_SELECT');
await screenshotJourney(mobile,'05-companion-name-mobile-390x844','COMPANION_NAME');
await screenshotJourney(tablet,'06-companion-name-tablet-1194x834','COMPANION_NAME');
await screenshotSignature(mobile,'07-signature-item-mobile-390x844');
await screenshotSignature(tablet,'08-signature-item-tablet-1194x834');

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
  ]
},null,2)+'\n');

await browser.close();
console.log('CHARACTER_FORMATION_RESPONSIVE_RUNTIME_PROOF_PASS');
