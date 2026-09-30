const {test,expect}=require('@playwright/test');
test('Ready local or Netlify-only identity cannot masquerade as central Google session',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.addScriptTag({url:'/ready-central-evidence-session-v01.js'});
 const result=await page.evaluate(()=>{
  const api=window.ReadyCentralEvidenceSessionV01;
  const ready={authenticated:true,family_id:'family_a',member_id:'parent_a',source:'NETLIFY_IDENTITY'};
  const central={authenticated:true,issuer:'GOOGLE_OIDC_VERIFIED_SERVER',
   subject:'google-sub',family_id:'family_a',authorized_member_ids:['child_a'],
   expires_at:'2099-01-01T00:00:00.000Z'};
  return {
   noCentral:api.resolve({readySession:ready,selectedMemberId:'child_a'}),
   wrongFamily:api.resolve({readySession:ready,centralSession:{...central,family_id:'family_b'},selectedMemberId:'child_a'}),
   wrongMember:api.resolve({readySession:ready,centralSession:central,selectedMemberId:'child_b'}),
   fakeIssuer:api.resolve({readySession:ready,centralSession:{...central,issuer:'NETLIFY_IDENTITY'},selectedMemberId:'child_a'}),
   expired:api.resolve({readySession:ready,centralSession:{...central,expires_at:'2020-01-01T00:00:00Z'},selectedMemberId:'child_a'}),
   valid:api.resolve({readySession:ready,centralSession:central,selectedMemberId:'child_a'})
  };
 });
 expect(result.noCentral.reason).toBe('INDEPENDENT_CENTRAL_IDENTITY_REQUIRED');
 expect(result.wrongFamily.reason).toBe('FAMILY_IDENTITY_LINK_NOT_CONFIRMED');
 expect(result.wrongMember.reason).toBe('CENTRAL_SELECTED_MEMBER_GRANT_REQUIRED');
 expect(result.fakeIssuer.reason).toBe('INDEPENDENT_CENTRAL_IDENTITY_REQUIRED');
 expect(result.expired.reason).toBe('CENTRAL_SESSION_EXPIRED');
 expect(result.valid).toEqual({ok:true,session:{authenticated:true,family_id:'family_a',selected_member_id:'child_a'}});
});
