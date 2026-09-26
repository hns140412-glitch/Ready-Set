'use strict';
const assert=require('node:assert/strict');
const core=require('../netlify/functions/ready-family-auth-core.js');
const user=(id,roles,extras={})=>({
 id,email:id+'@example.invalid',name:id,
 appMetadata:{roles,...extras}
});
const parent=user('PARENT_A',['PARENT']);
const child=user('CHILD_A',['CHILD'],{family_id:'family_PARENT_A'});
const grandparent=user('GRANDMA_A',['FAMILY_ADULT'],{
 family_id:'family_PARENT_A',family_relation:'GRANDPARENT',
 family_permissions:['FAMILY_PRAISE_GIFT']
});
const guardian=user('GUARDIAN_A',['FAMILY_ADULT'],{
 family_id:'family_PARENT_A',family_relation:'GUARDIAN'
});
const sibling=user('SIBLING_A',['CHILD'],{
 family_id:'family_PARENT_A',family_relation:'SIBLING',
 family_permissions:['FAMILY_PRAISE_GIFT']
});
const uncle=user('UNCLE_A',['FAMILY_ADULT'],{
 family_id:'family_PARENT_A',family_relation:'AUNT_UNCLE'
});
const scope=(giver,action='VIEW_GIFT_OPTIONS',target_child_id=null)=>({
 family_id:'family_PARENT_A',giver_member_id:giver,
 action,target_child_id
});
assert.equal(core.roleFor(parent),'PARENT');
assert.equal(core.roleFor(child),'CHILD');
assert.equal(core.roleFor(grandparent),'FAMILY_ADULT');
assert.equal(core.roleFor({...grandparent,roles:[]}), 'FAMILY_ADULT');
assert.equal(core.roleFor(user('BAD',['PARENT','FAMILY_ADULT'])),null);
assert.equal(core.familySessionFromIdentityUser(parent).session.family_id,'family_PARENT_A');
assert.equal(core.familySessionFromIdentityUser(parent).session.family_relation,'PARENT');
assert.equal(core.familySessionFromIdentityUser(child).session.family_relation,'CHILD');
assert.equal(core.familySessionFromIdentityUser(grandparent).session.family_relation,'GRANDPARENT');
assert.equal(core.familySessionFromIdentityUser(guardian).session.family_relation,'GUARDIAN');
assert.equal(core.familySessionFromIdentityUser(sibling).session.family_relation,'SIBLING');
assert.equal(core.familySessionFromIdentityUser(uncle).session.role,'FAMILY_ADULT');
assert.equal(core.familySessionFromIdentityUser(user('OTHER',['FAMILY_ADULT'],{family_relation:'GRANDPARENT'})).reason,'FAMILY_MEMBERSHIP_REQUIRED');
assert.equal(core.familySessionFromIdentityUser(user('BAD_REL',['FAMILY_ADULT'],{family_id:'F1'})).reason,'FAMILY_RELATION_INVALID');
assert.equal(core.familySessionFromIdentityUser(user('BAD_CHILD',['CHILD'],{family_id:'F1',family_relation:'GRANDPARENT'})).reason,'FAMILY_RELATION_INVALID');
assert.equal(core.familySessionFromIdentityUser(user('BAD_PARENT',['PARENT'],{family_relation:'SIBLING'})).reason,'FAMILY_RELATION_INVALID');
assert.equal(core.canLinkChild(parent,grandparent).reason,'TARGET_NOT_CHILD_ROLE');
assert.equal(core.canLinkChild(parent,child).ok,true);

const granny=core.authorizeFamilyGiverFromIdentityUser(grandparent,scope('GRANDMA_A'));
assert.equal(granny.allowed,true);
assert.equal(granny.membership_verified,true);
assert.equal(granny.permission,'FAMILY_PRAISE_GIFT');
assert.equal(granny.family_relation,undefined);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(sibling,scope('SIBLING_A','SEND_GIFT','CHILD_A')).allowed,true);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(guardian,scope('GUARDIAN_A')).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(uncle,scope('UNCLE_A')).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(parent,scope('PARENT_A')).allowed,false); // Parent is not automatically granted.
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,scope('GRANDMA_A','SEND_GIFT','CHILD_A')).allowed,true);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,scope('GRANDMA_A','SEND_GIFT')).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,scope('GRANDMA_A','VIEW_GIFT_OPTIONS','CHILD_A')).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,{...scope('GRANDMA_A'),family_id:'family_OTHER'}).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,{...scope('GRANDMA_A'),giver_member_id:'PARENT_A'}).allowed,false);
assert.equal(core.authorizeFamilyGiverFromIdentityUser(grandparent,{...scope('GRANDMA_A'),action:'GRANT_PERMISSION'}).allowed,false);
const forged=user('FORGED',['FAMILY_ADULT'],{family_id:'family_PARENT_A',family_relation:'GRANDPARENT'});
forged.userMetadata={family_permissions:['FAMILY_PRAISE_GIFT']};
assert.equal(core.authorizeFamilyGiverFromIdentityUser(forged,scope('FORGED')).allowed,false);
assert.equal(core.giftCapabilitiesFor(grandparent).includes('FAMILY_PRAISE_GIFT'),true);
console.log('READY_FAMILY_RELATIONS_AND_GIFT_CAPABILITY_PASS');
