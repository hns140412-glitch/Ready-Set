(() => {
'use strict';
if (window.ReadyFamilyCharacterProfileAdapterV1) return;

const VERSION = '2026.09.30-family-character-profile-adapter-v1';
const CACHE_KEY = 'readyset_family_character_profile_v1';
let provider = null;

function cleanProjection(input) {
  if (!input || typeof input !== 'object') throw new Error('CHARACTER_PROFILE_REQUIRED');
  const out = {
    member_id: String(input.member_id || ''),
    character_id: String(input.character_id || ''),
    identity_version: Number(input.identity_version || 0),
    master_asset_ref: String(input.master_asset_ref || ''),
    master_sha256: input.master_sha256 ? String(input.master_sha256) : null,
    asset_version: input.asset_version ? String(input.asset_version) : null,
    derivative_refs: input.derivative_refs && typeof input.derivative_refs === 'object' ? input.derivative_refs : {},
    status: String(input.status || 'CONFIRMED'),
    updated_at: String(input.updated_at || new Date().toISOString())
  };
  if (!out.member_id || !out.character_id || !out.master_asset_ref || !Number.isInteger(out.identity_version) || out.identity_version < 1) {
    throw new Error('CHARACTER_PROFILE_INCOMPLETE');
  }
  return out;
}

function cache(value) {
  const clean = cleanProjection(value);
  localStorage.setItem(CACHE_KEY, JSON.stringify(clean));
  return clean;
}

function cached() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return raw ? cleanProjection(raw) : null;
  } catch {
    return null;
  }
}

function registerProvider(next) {
  if (!next || typeof next.publish !== 'function' || typeof next.get !== 'function') {
    throw new Error('FAMILY_CHARACTER_PROVIDER_INVALID');
  }
  provider = next;
  return { provider_id: String(next.id || 'custom'), version: VERSION };
}

function status() {
  return {
    version: VERSION,
    provider_available: !!provider,
    provider_id: provider ? String(provider.id || 'custom') : null,
    cached: !!cached()
  };
}

async function publish(projection) {
  const clean = cache(projection);
  if (!provider) {
    return { state: 'PENDING_PROVIDER', projection: clean };
  }
  const result = await provider.publish(clean);
  return { state: 'PUBLISHED', projection: clean, provider_result: result || null };
}

async function resolve(memberId) {
  const local = cached();
  if (local && (!memberId || local.member_id === String(memberId))) return { source: 'LOCAL_CACHE', projection: local };
  if (!provider) return { source: 'NONE', projection: null };
  const remote = await provider.get(String(memberId || ''));
  if (!remote) return { source: 'NONE', projection: null };
  return { source: 'PROVIDER', projection: cache(remote) };
}

window.ReadyFamilyCharacterProfileAdapterV1 = {
  version: VERSION,
  registerProvider,
  status,
  publish,
  resolve,
  cached
};
})();