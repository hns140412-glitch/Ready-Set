// Ready -> TAKY central Character Master publish (pipeline 6.2), against a mock central that enforces
// the same contract as TAKY LEARNING/transport (scope-bound asset_ref, sha-verified commit, CONFIRMED projection).
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const Sync = require(path.join(__dirname, '..', 'rs', 'rs-taky-character-sync.js'));

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const dataUrl = 'data:image/png;base64,' + png.toString('base64');
const sha = crypto.createHash('sha256').update(png).digest('hex');
const BASE = 'https://central.test/';

function mockCentral({ failCommit = false } = {}) {
  const state = { calls: [], uploads: new Map(), committed: new Set(), profile: null, sawRaw: false };
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body });
  const fetchImpl = async (url, opt = {}) => {
    const u = new URL(url); state.calls.push(u.pathname + (opt.method === 'PUT' ? ':PUT' : ''));
    if (opt.method === 'PUT') {
      const up = state.uploads.get(u.searchParams.get('t')); if (!up) return json(403, {});
      const h = crypto.createHash('sha256').update(Buffer.from(opt.body)).digest('hex');
      if (h !== up.sha256) return json(409, {}); up.put = true; return json(200, { ok: true });
    }
    assert.equal(opt.headers.authorization, 'Bearer TEST_TOKEN_0123456789');
    const b = JSON.parse(opt.body);
    if (/photo/i.test(opt.body)) state.sawRaw = true;
    assert.equal(b.family_id, 'FAM1'); assert.equal(b.member_id, 'KID1');
    if (u.pathname === '/api/family/character-profile') {
      if (b.action === 'GET') return json(200, state.profile ? { ok: true, found: true, projection: state.profile } : { ok: true, found: false });
      const p = b.projection;
      assert.equal(p.status, 'CONFIRMED'); assert.ok(state.committed.has(p.master_asset_ref), 'publish only a committed master');
      if (state.profile && p.identity_version <= state.profile.identity_version) return json(409, { ok: false, reason: 'CHARACTER_PROFILE_VERSION_REGRESSION' });
      state.profile = p; return json(200, { ok: true });
    }
    if (u.pathname === '/api/family/character-asset') {
      const prefix = `taky-character:FAM1:KID1:${b.character_id}:`;
      if (b.action === 'CREATE_UPLOAD') {
        const t = 'ticket' + state.uploads.size, asset_ref = prefix + b.asset_version;
        state.uploads.set(t, { sha256: b.sha256, asset_ref });
        return json(200, { ok: true, asset_ref, upload_id: t, upload_url: BASE + 'api/family/character-asset-bytes?t=' + t });
      }
      if (!b.asset_ref.startsWith(prefix)) return json(403, { ok: false, reason: 'ASSET_REF_SCOPE_MISMATCH' });
      if (b.action === 'COMMIT_UPLOAD') {
        const up = state.uploads.get(b.upload_id);
        if (failCommit || !up || !up.put || up.sha256 !== b.sha256) return json(409, { ok: false, reason: 'ASSET_COMMIT_VERIFICATION_FAILED' });
        state.committed.add(b.asset_ref); return json(200, { ok: true, committed: true, asset_ref: b.asset_ref, sha256: b.sha256 });
      }
    }
    return json(404, { ok: false });
  };
  return { state, fetchImpl };
}
const runtime = { apiBaseUrl: BASE, getToken: async () => 'TEST_TOKEN_0123456789', getFamilyId: async () => 'FAM1', currentSession: async () => ({ family_id: 'FAM1', self_member_id: 'KID1', authorized_member_ids: ['KID1'] }) };

(async () => {
  // 1. no TAKY session -> fail-closed, no network
  { const m = mockCentral(); const out = await Sync.publishMaster({ image: dataUrl, runtime: null, fetchImpl: m.fetchImpl });
    assert.equal(out.state, 'PENDING_TAKY_SESSION'); assert.equal(m.state.calls.length, 0); }
  // 2. first publish -> upload, PUT, commit, publish v1; raw photo never sent
  const m = mockCentral();
  let out = await Sync.publishMaster({ image: dataUrl, runtime, fetchImpl: m.fetchImpl });
  assert.equal(out.ok, true, JSON.stringify(out)); assert.equal(out.state, 'REGISTRY_BOUND'); assert.equal(out.identity_version, 1);
  assert.deepEqual(m.state.calls, ['/api/family/character-profile', '/api/family/character-asset', '/api/family/character-asset-bytes:PUT', '/api/family/character-asset', '/api/family/character-profile']);
  assert.equal(m.state.profile.master_sha256, sha); assert.equal(m.state.profile.character_id, 'ready-explorer');
  assert.equal(m.state.sawRaw, false, 'no photo field is ever sent');
  // 3. re-onboarding -> monotonic v2, new asset version
  out = await Sync.publishMaster({ image: dataUrl, runtime, fetchImpl: m.fetchImpl });
  assert.equal(out.identity_version, 2); assert.ok(m.state.profile.master_asset_ref.endsWith(':v2'));
  // 4. commit failure -> profile not published
  { const f = mockCentral({ failCommit: true }); const o = await Sync.publishMaster({ image: dataUrl, runtime, fetchImpl: f.fetchImpl });
    assert.equal(o.state, 'ASSET_COMMIT_FAILED'); assert.equal(f.state.profile, null); }
  // 5. non-image / oversized input rejected before any network
  { const f = mockCentral(); assert.equal((await Sync.publishMaster({ image: 'data:text/plain;base64,aGk=', runtime, fetchImpl: f.fetchImpl })).state, 'MASTER_IMAGE_FORMAT'); assert.equal(f.state.calls.length, 0); }
  // 6. member resolution: guardian with one child -> child; two children -> selection required; explicit outsider -> refused
  assert.equal(Sync.resolveMember({ self_member_id: 'P', authorized_member_ids: ['P', 'K'] }), 'K');
  assert.equal(Sync.resolveMember({ self_member_id: 'P', authorized_member_ids: ['P', 'K1', 'K2'] }), null);
  assert.equal(Sync.resolveMember({ self_member_id: 'K', authorized_member_ids: ['K'] }), 'K');
  assert.equal(Sync.resolveMember({ self_member_id: 'P', authorized_member_ids: ['P', 'K'] }, 'X'), '');
  { const f = mockCentral(); const two = { ...runtime, currentSession: async () => ({ self_member_id: 'P', authorized_member_ids: ['P', 'K1', 'K2'] }) };
    assert.equal((await Sync.publishMaster({ image: dataUrl, runtime: two, fetchImpl: f.fetchImpl })).state, 'MEMBER_SELECTION_REQUIRED'); assert.equal(f.state.calls.length, 0); }
  console.log('rs-taky-character-sync: 6 checks passed');
})().catch(e => { console.error(e); process.exit(1); });
