// Offline evidence validation. PASS means reviewed evidence, never AI/pixel certification.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const criteria = {
  REFERENCE_COVERAGE:['four-original-boards','all-reference-regions-mapped','no-material-reference-drift'],
  UI_LAYOUT:['premium-child-friendly','pale-sky-blue-world','navy-blue-type-hierarchy','rounded-white-cards','deliberate-spacing','mascot-and-speech-bubbles'],
  CHARACTER_IDENTITY:['photo-resemblance-permitted','recognizable-same-child','stable-face-hair-age','coherent-explorer-outfit-accessories','meaningfully-distinct-candidates'],
  CHARACTER_RENDER_QUALITY:['premium-3d-animated-film','dimensional-materials-lighting','clean-silhouette','natural-anatomy-hands-eyes','full-body-uncropped','sharp-native-resolution','no-placeholder-emoji-icon-flat-cartoon'],
  CROSS_VIEW_CONSISTENCY:['same-selected-identity','stable-face-hair-outfit','front-side-back-reusable','expressions-actions-reusable'],
  MOBILE_RESPONSIVE:['no-overflow-clipping-overlap','readable-type','touch-targets-44px','safe-area-and-scroll-access'],
  SIDE_BY_SIDE_REVIEW:['matched-state-viewport-dpr-crop','all-boards-compared','all-deltas-resolved','human-image-review']
};
export const states = ['PHOTO','CHARACTER','CANDIDATES','CONFIRM','COMPLETE','VISUAL_ID'];
export const widths = [320,390,430];
export const outputRoles = ['candidate-1','candidate-2','candidate-3','selected','front','side','back','expression','action'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
export function evaluate(e = {}, root = '.') {
  const gates = Object.fromEntries(Object.keys(criteria).map(k=>[k,{status:'BLOCKED',reasons:[]}]));
  const issue = (g, message) => gates[g].reasons.push(message);
  const artifacts = new Map();
  const records = [...(e.references||[]),...(e.screenshots||[]),...(e.outputs||[]),...(e.comparisons||[])];
  const evidenceRoot = fs.realpathSync(root);
  for (const a of records) {
    try {
      if (!nonempty(a.id) || artifacts.has(a.id)) throw Error();
      // Only explicitly provided PNG evidence; never URLs, environment files or arbitrary paths.
      if (!/^[a-zA-Z0-9_/-]+\.png$/.test(a.file) || a.file.split('/').includes('..')) throw Error();
      const full = fs.realpathSync(path.resolve(evidenceRoot,a.file));
      if (!full.startsWith(evidenceRoot+path.sep)) throw Error();
      const stat = fs.statSync(full);
      if (!stat.isFile() || stat.size > 30_000_000) throw Error();
      const bytes = fs.readFileSync(full);
      if (bytes.length < 33 || bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' || bytes.toString('ascii',12,16)!=='IHDR' || sha(bytes)!==a.sha256) throw Error();
      const width=bytes.readUInt32BE(16), height=bytes.readUInt32BE(20);
      if (width!==a.width || height!==a.height || width<1 || height<1) throw Error();
      artifacts.set(a.id,a);
    } catch { issue('REFERENCE_COVERAGE','Invalid/missing/duplicate or hash-mismatched PNG evidence'); }
  }
  const refs=e.references||[], shots=e.screenshots||[], outputs=e.outputs||[];
  if (e.version!==1 || !nonempty(e.revision)) issue('REFERENCE_COVERAGE','Version and exact implementation revision required');
  if (refs.length!==4 || new Set(refs.map(x=>x.sha256)).size!==4 || refs.some(x=>x.origin!=='USER_SUPPLIED' || !nonempty(x.boardName) || !x.regions?.length || x.regions.some(r=>!nonempty(r)))) issue('REFERENCE_COVERAGE','Exactly four distinct original user boards and named regions required');
  for (const state of states) for (const width of widths) {
    const s=shots.find(x=>x.state===state && x.viewport?.width===width);
    if (!s || !artifacts.has(s.id) || s.revision!==e.revision || s.dpr!==1 || s.width!==width || s.height!==s.viewport?.height || !nonempty(s.browser) || s.fixtureKind!=='ACTUAL_RENDER') issue('MOBILE_RESPONSIVE',`Missing actual rendered ${state} at ${width}px`);
    if (!s?.metrics || s.metrics.horizontalOverflow!==false || s.metrics.clippedContent!==false || s.metrics.overlap!==false || !(s.metrics.minTouchTarget>=44) || s.metrics.brokenImages!==0) issue('MOBILE_RESPONSIVE',`Missing/failing runtime measurements: ${state}/${width}`);
  }
  for (const role of outputRoles) {
    const a=outputs.find(x=>x.role===role);
    if (!a || !artifacts.has(a.id) || a.kind!=='GENERATED_OUTPUT' || Math.min(a.width,a.height)<1024 || !nonempty(a.identityId) || !nonempty(a.generationId)) issue('CHARACTER_RENDER_QUALITY',`Missing native >=1024px generated output: ${role}`);
  }
  if (new Set(outputs.map(x=>x.identityId)).size!==1 || !outputs.length) issue('CHARACTER_IDENTITY','One child identity required across outputs');
  const candidates=outputs.filter(x=>/^candidate-[123]$/.test(x.role));
  if (candidates.length!==3 || new Set(candidates.map(x=>x.sha256)).size!==3) issue('CHARACTER_IDENTITY','Three distinct candidate images required');
  const selected=outputs.find(x=>x.role==='selected');
  if (!selected || !candidates.some(x=>x.id===e.selectedCandidateId)) issue('CROSS_VIEW_CONSISTENCY','Selected candidate/master lineage required');
  for (const s of shots.filter(x=>['CONFIRM','COMPLETE','VISUAL_ID'].includes(x.state))) {
    if (s.selectedOutputId!==selected?.id || s.identityId!==selected?.identityId) issue('CROSS_VIEW_CONSISTENCY','Selected master must be tracked across confirm/complete/visual ID');
  }
  for (const ref of refs) for (const region of ref.regions||[]) {
    if (!(e.comparisons||[]).some(c=>c.referenceId===ref.id && c.region===region && artifacts.has(c.id) && shots.some(s=>s.id===c.screenshotId) && nonempty(c.alignment))) issue('SIDE_BY_SIDE_REVIEW','Every board region requires a side-by-side PNG and explicit alignment');
  }
  for (const s of shots) if (!(e.comparisons||[]).some(c=>c.screenshotId===s.id && artifacts.has(c.id))) issue('SIDE_BY_SIDE_REVIEW','Every screenshot requires side-by-side evidence');
  for (const [gate, keys] of Object.entries(criteria)) {
    const review=e.reviews?.[gate];
    if (!review || !nonempty(review.reviewer) || !Number.isFinite(Date.parse(review.reviewedAt))) issue(gate,'Named human reviewer and review timestamp required');
    let rejected=false;
    for (const key of keys) {
      const c=review?.criteria?.[key];
      if (c?.verdict==='FAIL') rejected=true;
      if (c?.verdict!=='PASS' || !nonempty(c?.observation) || !c?.evidenceIds?.length || c.evidenceIds.some(id=>!artifacts.has(id))) issue(gate,`Unverified criterion: ${key}`);
    }
    gates[gate].status=rejected?'FAIL':gates[gate].reasons.length?'BLOCKED':'PASS';
  }
  return {status:Object.values(gates).some(g=>g.status==='FAIL')?'FAIL':Object.values(gates).every(g=>g.status==='PASS')?'PASS':'BLOCKED',
    basis:'Evidence integrity plus explicit human visual review; not automated perceptual certification',gates};
}
export function template() {
  return {version:1,revision:'',references:[],screenshots:[],outputs:[],comparisons:[],selectedCandidateId:'',
    reviews:Object.fromEntries(Object.entries(criteria).map(([g,keys])=>[g,{reviewer:'',reviewedAt:'',criteria:Object.fromEntries(keys.map(k=>[k,{verdict:'UNREVIEWED',observation:'',evidenceIds:[]}]))}]))};
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if (process.argv[2]==='--template') console.log(JSON.stringify(template(),null,2));
  else {
    const input=process.argv[2];
    if (!input || path.extname(input)!=='.json') throw Error('Provide an evidence .json file, or --template');
    const result=evaluate(JSON.parse(fs.readFileSync(input,'utf8')),path.dirname(path.resolve(input)));
    console.log(JSON.stringify(result,null,2));
    process.exitCode=result.status==='PASS'?0:result.status==='FAIL'?1:2;
  }
}
