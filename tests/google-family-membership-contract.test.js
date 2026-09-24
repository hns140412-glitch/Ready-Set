const core=require('../netlify/functions/ready-family-auth-core.js');
const assert=require('assert');

const parent={id:'acct_parent',email:'parent@gmail.test',appMetadata:{roles:['GUARDIAN'],family_id:'fam_1',membership_id:'mem_parent',relationship:'MOTHER',membership_status:'ACTIVE',provider:'google'}};
const child={id:'acct_child',email:'child@gmail.test',appMetadata:{roles:['CHILD'],family_id:'fam_1',membership_id:'mem_child',relationship:'CHILD',membership_status:'ACTIVE',provider:'google'}};

const ps=core.familySessionFromIdentityUser(parent);
const cs=core.familySessionFromIdentityUser(child);
assert.equal(ps.ok,true);assert.equal(cs.ok,true);
assert.equal(ps.session.account_id,'acct_parent');
assert.equal(ps.session.family_id,'fam_1');
assert.equal(ps.session.membership_id,'mem_parent');
assert.equal(ps.session.role,'PARENT');
assert.equal(ps.session.relationship,'MOTHER');
assert.equal(cs.session.account_id,'acct_child');
assert.equal(cs.session.member_id,'acct_child');
assert.equal(cs.session.role,'CHILD');
assert.equal(core.canLinkChild(parent,child).family_id,'fam_1');
console.log('GOOGLE_ACCOUNT_FAMILY_MEMBERSHIP_CONTRACT_PASS');
