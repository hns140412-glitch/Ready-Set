import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};

const characterFiles=[
  'character-action.mjs','character-asset.mjs','character-consistency-review.mjs','character-correct.mjs',
  'character-derivatives.mjs','character-generate.mjs','character-job.mjs','character-master-sheet.mjs',
  'character-master.mjs','character-source.mjs'
].map(x=>'netlify/functions/'+x);

for(const path of characterFiles){
  const src=read(path);
  assert(!src.includes("from './ready-family-auth-core.js'"),'DIRECT_READY_AUTH_IMPORT_FORBIDDEN:'+path);
  assert(src.includes("from './character-family-session-adapter.mjs'"),'CHARACTER_SESSION_ADAPTER_REQUIRED:'+path);
  assert(!src.includes('ready-character-assets-v1'),'READY_STORAGE_NAMESPACE_FORBIDDEN:'+path);
  assert(src.includes('character-visual-id-assets-v1'),'CHARACTER_STORAGE_NAMESPACE_REQUIRED:'+path);
}

const adapter=read('netlify/functions/character-family-session-adapter.mjs');
assert(adapter.includes('familySessionFromIdentityUser'),'ADAPTER_MUST_DELEGATE_TO_CURRENT_FAMILY_AUTHORITY');
assert(adapter.includes('does not own family identity semantics'),'ADAPTER_OWNERSHIP_COMMENT_MISSING');

const master=read('netlify/functions/character-master.mjs');
assert(master.includes("event:'SOURCE_PHOTO_PURGED'"),'SOURCE_PURGE_TRACE_MISSING');
assert(master.includes("source_retention='PURGED_AFTER_VISUAL_ID_LOCK'"),'SOURCE_PURGE_POLICY_MISSING');
assert(master.includes("store.delete(sourceMeta.source_key)"),'SOURCE_BLOB_DELETE_MISSING');
assert(master.includes("store.delete(prefix+'/source/meta.json')"),'SOURCE_META_DELETE_MISSING');

const masterSheet=read('netlify/functions/character-master-sheet.mjs');
assert(!masterSheet.includes("prefix+'/source/meta.json'"),'MASTER_SHEET_MUST_NOT_READ_SOURCE_META');
assert(!masterSheet.includes("identity-source.jpg"),'MASTER_SHEET_MUST_NOT_USE_RAW_SOURCE');
assert(masterSheet.includes("locked-character.webp"),'MASTER_SHEET_MUST_USE_LOCKED_CHARACTER');

const projection=read('src/identity/character-visual-id-projection-runtime.js');
assert(!projection.includes("source_hash:clean("),'PROJECTION_MUST_NOT_PUBLISH_SOURCE_HASH');
assert(projection.includes('source_fingerprint_exposed:false'),'PROJECTION_FINGERPRINT_PRIVACY_FLAG_MISSING');

console.log('CHARACTER_VISUAL_ID_PRIVACY_AND_BOUNDARY_V01 PASS');
