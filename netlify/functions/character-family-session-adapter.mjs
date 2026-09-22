import familyCore from './ready-family-auth-core.js';

const { familySessionFromIdentityUser }=familyCore;

/*
  Character Visual ID does not own family identity semantics.
  This adapter is the current implementation boundary to the Learning/Family identity authority.
  Consumers inside Character must import this adapter rather than the Ready host directly.
*/
function mapCharacterSession(identityUser){
  return familySessionFromIdentityUser(identityUser);
}

export { mapCharacterSession };
