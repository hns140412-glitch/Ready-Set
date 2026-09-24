const assert=require('assert');
const fs=require('fs');
const core=require('../netlify/functions/ready-family-auth-core.js');

const unbound={
  id:'acct_new_google',
  email:'newchild@gmail.test',
  provider:'google',
  appMetadata:{provider:'google'}
};
const unboundSession=core.accountSessionFromIdentityUser(unbound);
assert.equal(unboundSession.ok,true);
assert.equal(unboundSession.session.state,'AUTHENTICATED_UNBOUND');
assert.equal(unboundSession.session.account_id,'acct_new_google');
assert.equal(unboundSession.session.family_id,null);
assert.equal(unboundSession.session.membership_status,'UNBOUND');

const guardian={
  id:'acct_mom',
  email:'mom@gmail.test',
  provider:'google',
  appMetadata:{
    roles:['GUARDIAN'],
    family_id:'family_1',
    membership_id:'membership_mom',
    relationship:'MOTHER',
    membership_status:'ACTIVE',
    provider:'google'
  }
};
const child={
  id:'acct_child',
  email:'child@gmail.test',
  provider:'google',
  appMetadata:{
    roles:['CHILD'],
    family_id:'family_1',
    membership_id:'membership_child',
    relationship:'CHILD',
    membership_status:'ACTIVE',
    provider:'google'
  }
};
assert.equal(core.familySessionFromIdentityUser(guardian).session.role,'PARENT');
assert.equal(core.familySessionFromIdentityUser(child).session.role,'CHILD');
assert.equal(core.canLinkChild(guardian,child).family_id,'family_1');

const client=fs.readFileSync('ready-family-session-v01.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(client.includes("AUTHENTICATED_UNBOUND"),'CLIENT_UNBOUND_STATE_MISSING');
assert(client.includes("createFamily"),'CREATE_FAMILY_CLIENT_ACTION_MISSING');
assert(client.includes("linkGuardian"),'LINK_GUARDIAN_CLIENT_ACTION_MISSING');
assert(html.includes('id="familyUnboundSection"'),'UNBOUND_ONBOARDING_UI_MISSING');
assert(html.includes('id="familyLinkGuardianSection"'),'GUARDIAN_LINK_UI_MISSING');
assert(html.includes('id="familyLinkChildSection"'),'CHILD_LINK_UI_MISSING');
console.log('FAMILY_MEMBERSHIP_ONBOARDING_CONTRACT_PASS');
