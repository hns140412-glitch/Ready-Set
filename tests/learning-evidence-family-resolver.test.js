'use strict';
const assert=require('node:assert/strict');
const R=require('../netlify/functions/learning-evidence-family-resolver.js');

const parent={id:'P1',appMetadata:{roles:['GUARDIAN'],family_id:'F1',membership_id:'MP',membership_status:'ACTIVE'}};
const child={id:'C1',appMetadata:{roles:['CHILD'],family_id:'F1',membership_id:'MC',membership_status:'ACTIVE'}};
const sibling={id:'C2',appMetadata:{roles:['CHILD'],family_id:'F1',membership_id:'MS',membership_status:'ACTIVE'}};
const outsider={id:'X1',appMetadata:{roles:['CHILD'],family_id:'F2',membership_id:'MX',membership_status:'ACTIVE'}};

const p=R.resolveEvidenceIdentity(parent,[parent,child,sibling,outsider]);
assert.equal(p.ok,true);
assert.equal(p.identity.family_id,'F1');
assert.deepEqual(new Set(p.identity.authorized_member_ids),new Set(['P1','C1','C2']));

const c=R.resolveEvidenceIdentity(child,[parent,child,sibling]);
assert.equal(c.ok,true);
assert.deepEqual(c.identity.authorized_member_ids,['C1']);

const unbound=R.resolveEvidenceIdentity({id:'U1',appMetadata:{roles:['CHILD']}},[]);
assert.equal(unbound.ok,false);

console.log('LEARNING_EVIDENCE_FAMILY_RESOLVER_PASS');
