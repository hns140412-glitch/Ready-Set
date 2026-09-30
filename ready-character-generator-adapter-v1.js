(() => {
'use strict';
if (window.ReadyCharacterGeneratorAdapterV1) return;

const VERSION = '2026.09.30-character-generator-adapter-v1';
let provider = null;

function assertProvider(p) {
  if (!p || typeof p !== 'object') throw new Error('GENERATOR_PROVIDER_REQUIRED');
  if (typeof p.generateCandidates !== 'function') throw new Error('GENERATOR_PROVIDER_GENERATE_REQUIRED');
  if (typeof p.refineMaster !== 'function') throw new Error('GENERATOR_PROVIDER_REFINE_REQUIRED');
  return p;
}

function registerProvider(p) {
  provider = assertProvider(p);
  return { version: VERSION, providerId: String(p.id || 'custom') };
}

function clearProvider() {
  provider = null;
}

function status() {
  return {
    version: VERSION,
    available: !!provider,
    providerId: provider ? String(provider.id || 'custom') : null,
    capabilities: provider ? ['CANDIDATES', 'MASTER_REFINEMENT'] : []
  };
}

async function generateCandidates(request) {
  if (!provider) throw Object.assign(new Error('GENERATOR_UNAVAILABLE'), { code: 'GENERATOR_UNAVAILABLE' });
  if (!request || !Array.isArray(request.plan) || request.plan.length !== 3) {
    throw new Error('GENERATOR_PLAN_REQUIRED');
  }
  const result = await provider.generateCandidates(request);
  if (!Array.isArray(result) || result.length !== 3) throw new Error('THREE_CANDIDATES_REQUIRED');
  return result;
}

async function refineMaster(request) {
  if (!provider) throw Object.assign(new Error('GENERATOR_UNAVAILABLE'), { code: 'GENERATOR_UNAVAILABLE' });
  if (!request?.sourcePhoto || !request?.selectedDraft) throw new Error('REFINEMENT_REQUEST_INCOMPLETE');
  const result = await provider.refineMaster(request);
  if (!result?.assetRef) throw new Error('REFINED_ASSET_REQUIRED');
  return result;
}

window.ReadyCharacterGeneratorAdapterV1 = {
  version: VERSION,
  registerProvider,
  clearProvider,
  status,
  generateCandidates,
  refineMaster
};
})();