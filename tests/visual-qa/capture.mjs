// Optional adapter: uses an already installed Playwright; never installs/downloads.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer, fixtures} from './server.mjs';
const fixture = process.argv[2] || 'onboarding-mode';
const viewportName = process.argv[3] || 'mobile';
const viewports = {small:{width:320,height:740}, mobile:{width:390,height:844}, wide:{width:430,height:932}, desktop:{width:1440,height:900}};
if (!fixtures.includes(fixture) || !viewports[viewportName]) throw new Error('Use a documented fixture and small|mobile|wide|desktop');
let chromium;
try { ({chromium} = await import('playwright')); }
catch { throw new Error('Runtime blocker: Playwright is not installed. Use the documented manual capture, or an existing test environment with Playwright. No dependency was installed.'); }
const server = createServer();
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4177, '127.0.0.1', resolve); });
  browser = await chromium.launch({headless:true, timeout:15000});
  const context = await browser.newContext({viewport:viewports[viewportName], deviceScaleFactor:1,
    locale:'ko-KR', timezoneId:'Asia/Seoul', colorScheme:'light', reducedMotion:'reduce', serviceWorkers:'block'});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === 'http://127.0.0.1:4177' && !url.pathname.startsWith('/api/')
      ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:4177/__visual/?state=${fixture}`, {waitUntil:'load', timeout:15000});
  await page.waitForSelector(`html[data-visual-qa-ready="${fixture}"]`, {state:'attached',timeout:10000});
  if (errors.length) throw new Error(`Ready runtime errors: ${errors.join('; ')}`);
  const metrics = await page.evaluate(() => {
    const visible = el => {const r=el.getBoundingClientRect();return r.width>0 && r.height>0 && getComputedStyle(el).visibility!=='hidden';};
    const controls = [...document.querySelectorAll('button,input:not([type=hidden]),select,textarea,a[href]')].filter(visible);
    return {
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
      minTouchTarget:controls.length ? Math.min(...controls.map(el=>{const r=el.getBoundingClientRect();return Math.min(r.width,r.height);})) : 0,
      brokenImages:[...document.images].filter(visible).filter(img=>!img.complete || !img.naturalWidth).length,
      clippedContent:null, overlap:null,
      note:'Clipping/overlap and CSS background image decoding require runtime/image review.'
    };
  });
  const output = new URL('../../artifacts/visual-qa/', import.meta.url);
  await fs.mkdir(output, {recursive:true});
  const id = `${fixture}-${viewportName}`;
  await page.screenshot({path:fileURLToPath(new URL(`${id}.png`, output)), fullPage:false, timeout:10000});
  await fs.writeFile(new URL(`${id}.capture.json`, output), JSON.stringify({fixture,
    viewport:viewports[viewportName], dpr:1, locale:'ko-KR', timezone:'Asia/Seoul', metrics,
    browser:browser.version(), implementationScreenshot:`artifacts/visual-qa/${id}.png`,
    reviewStatus:'UNREVIEWED', note:'Capture is not a visual verdict; complete the evidence record.'}, null, 2));
  console.log(`Captured ${id}; reference review required.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
