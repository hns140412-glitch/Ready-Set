const assert=require('node:assert/strict');
const fs=require('node:fs');
const reg=require('../ready-character-binding-registry-v1.js').registry();
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
for(const s of reg.slots){
  for(const key of ['selector','name_selector','text_selector']){
    const sel=s[key];
    if(!sel)continue;
    assert.match(sel,/^#[A-Za-z][A-Za-z0-9_:-]*$/,'Only stable id selectors are allowed in V1');
    const id=sel.slice(1);
    const re=new RegExp('id=["\\\']'+id+'["\\\']');
    assert.ok(re.test(html),`Missing binding selector ${sel} for slot ${s.slot_id}`);
  }
}
console.log(JSON.stringify({gate:'CHARACTER_BINDING_SELECTOR_INTEGRITY',app:reg.app_id,slots:reg.slots.length,pass:true},null,2));
