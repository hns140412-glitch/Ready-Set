'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const match=sw.match(/const CORE=\[([\s\S]*?)\];/);
if(!match)throw Error('SERVICE_WORKER_CORE_NOT_FOUND');
const items=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
const absent=items.filter(x=>!fs.existsSync(path.join(root,x.split('?')[0].replace(/^\.\//,''))));
const required=['./ready-first-journey-scenes-v1.js','./explorer-crew-voice/ready-explorer-intro-canonical-v1.js',
 ...['dubi','lori','ink','nova','take','zero'].map(id=>'./characters/ui_cutouts/'+id+'.png')];
const notPrecaching=required.filter(x=>!items.some(y=>y.split('?')[0]===x));
const result={total:items.length,missing:absent,uncachedIntro:notPrecaching};
console.log(JSON.stringify(result,null,2));
if(absent.length||notPrecaching.length)process.exitCode=1;
