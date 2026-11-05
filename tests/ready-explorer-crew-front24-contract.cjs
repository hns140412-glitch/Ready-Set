const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const expected={
  "10": "38b7624f5d4f205acfd1173c4de09469467217ad9750face3d0211ac1b860eb7",
  "11": "6d898a6c990bd0895d75c5d007b95fbdd1189e1912b8e5bacb10bc4e4d083510",
  "12": "5f00543ab9570a83f62bc7159eab772b372d7ecb1f19f150697098c5e830b014",
  "13": "b91916c58a4497fee82122e092fb083e7bcffb8e5fe8992add7e4dc9124f61ef",
  "14": "62c04c2cd83bd737c40f56b987c99434ef152301620daf96d81213416752001f",
  "15": "437bc370493b466edd1aa17ec182f3285dafd58536d414715334f5bd273f4903",
  "16": "766176a65ddce66199b14d91782c8f9c83839a40bbe43db31b5cbe0190e79c97",
  "17": "2493c8450d61863cab28bbccfbbfca38a32c601a496a1eb74156045c4aeb484c",
  "18": "cfee3ce8cd707d95441d578f086852f1246d01a59625925388554d1adaf68ffb",
  "19": "e220e05d0e4adfe53d7e5c0fc0d3e9041a2311b1bb66d75b27354accf1a79a33",
  "20": "2326e79a94a21024a188a4a125494f4a3b186a3bd2fdf685a5f809caad79c2b8",
  "21": "901fd4d30f581e4bb0c2a6918952149bf6a2cfda43ae1ccf67db1e7e03a4dd64",
  "22": "18ad95072887c218899f59b1a13a0678c61d618423da0314c9c8b195a27330d7",
  "23": "e926fadffd67dc5967f6639d12ffb635d7bf9ca4972565bcd000d2b1aa97712d",
  "24": "4cca9b946de0b59d743b67c55ff26049e99f2b113c77c8444f05e81344bd31b2",
  "07": "159b0bba1f39cf95c90f091eecf5296233c510a0c1d63bd1bb51927752008f99",
  "08": "183433f836aa89ba5016c05c51a772f5059bb7709a999702cf778d390efec816",
  "09": "6a1f62673f67b02cd50debb480c9f76d679d35a320a997c6e70e15ea087ea5e2"
};
const source=fs.readFileSync(path.resolve('ready-explorer-crew-visible-v1.js'),'utf8');
const sw=fs.readFileSync(path.resolve('sw.js'),'utf8');
for(const [n,sha] of Object.entries(expected)){
  const asset=path.resolve('characters/ui_cutouts/guide-'+n+'.png');
  assert.equal(fs.existsSync(asset),true,'missing '+asset);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex'),sha,'sha '+n);
  assert.match(source,new RegExp("guide-"+n.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')));
  assert.match(source,new RegExp(sha));
  assert.match(sw,new RegExp("guide-"+n+"\\.png"));
}
assert.equal(Object.keys(expected).length,18);
console.log('READY_EXPLORER_CREW_FRONT24_CONTRACT_PASS');
