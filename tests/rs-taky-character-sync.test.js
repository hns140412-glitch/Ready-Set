// Ready -> TAKY central no-cost character request (Taky 11/06): Ready sends the photo as a private request and
// reads back the master a PARENT approved in TAKY Mobile. Ready never publishes a master itself.
// The real-handler contract test lives in TAKY-MOBILE tools/test-central-functions.mjs (READY_CHARACTER_SYNC_MODULE).
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const Sync = require(path.join(__dirname, '..', 'rs', 'rs-taky-character-sync.js'));

const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), crypto.randomBytes(500)]);
const photo = 'data:image/jpeg;base64,' + jpg.toString('base64');
const master = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(700)]);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BASE = 'https://central.test/';

function mockCentral() {
  const st = { calls: [], requests: new Map(), profile: null, tickets: new Map() };
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body, headers: new Map() });
  // Like window.fetch: throws when called as a method of some other object (browser "Illegal invocation").
  const fetchImpl = async function (url, opt = {}) {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    const u = new URL(url); st.calls.push(u.pathname + ':' + (opt.method || 'GET'));
    if (u.pathname === '/bytes') {
      if (opt.method === 'PUT') {
        const t = st.tickets.get(u.searchParams.get('t')); if (!t) return json(403, {});
        if (sha(Buffer.from(opt.body)) !== t.sha256) return json(409, {});
        st.requests.set(t.member_id, { id: t.request_id, bytes: Buffer.from(opt.body) }); return json(200, { ok: true });
      }
      return { ok: true, status: 200, headers: { get: () => 'image/png' }, arrayBuffer: async () => master.buffer.slice(master.byteOffset, master.byteOffset + master.length) };
    }
    assert.equal(opt.headers.authorization, 'Bearer TEST_TOKEN_0123456789');
    const b = JSON.parse(opt.body); assert.equal(b.family_id, 'FAM1');
    if (u.pathname === '/api/family/character-request') {
      assert.equal(b.member_id, 'KID1');
      if (b.action === 'CREATE') {
        assert.equal(b.content_type, 'image/jpeg'); assert.equal(b.byte_size, jpg.length); assert.equal(b.sha256, sha(jpg));
        const t = 'tk' + st.tickets.size, request_id = 'req_' + 'a'.repeat(24); st.tickets.set(t, { ...b, request_id });
        return json(200, { ok: true, request_id, upload_url: BASE + 'bytes?t=' + t });
      }
      if (b.action === 'STATUS') return json(200, { ok: true, pending: st.requests.has('KID1') });
      return json(400, {});
    }
    if (u.pathname === '/api/family/character-profile') {
      assert.equal(b.action, 'GET', 'Ready must only read the profile');
      return json(200, st.profile ? { ok: true, found: true, projection: st.profile } : { ok: true, found: false });
    }
    if (u.pathname === '/api/family/character-asset') {
      assert.equal(b.action, 'RESOLVE_READ', 'Ready must never upload a master');
      return json(200, { ok: true, read_url: BASE + 'bytes?r=1' });
    }
    return json(404, {});
  };
  return { st, fetchImpl };
}
const runtime = (ids = ['PARENT1', 'KID1']) => ({ apiBaseUrl: BASE, getToken: async () => 'TEST_TOKEN_0123456789', getFamilyId: async () => 'FAM1',
  currentSession: async () => ({ family_id: 'FAM1', self_member_id: 'PARENT1', authorized_member_ids: ids }) });

(async () => {
  let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('PASS', name); };
  await t('no session -> nothing sent', async () => {
    const m = mockCentral();
    assert.equal((await Sync.requestCharacter({ photo, runtime: null, fetchImpl: m.fetchImpl })).state, 'PENDING_TAKY_SESSION');
    assert.equal(m.st.calls.length, 0);
  });
  await t('photo -> private request; status REQUESTED while the parent makes it', async () => {
    const m = mockCentral();
    const out = await Sync.requestCharacter({ photo, runtime: runtime(), fetchImpl: m.fetchImpl });
    assert.equal(out.ok, true); assert.equal(out.state, 'REQUESTED');
    assert.ok(m.st.requests.get('KID1').bytes.equals(jpg), 'exact photo bytes, sha-checked');
    const s = await Sync.characterStatus({ runtime: runtime(), fetchImpl: m.fetchImpl });
    assert.equal(s.state, 'REQUESTED');
    assert.ok(!m.st.calls.some(c => /character-asset:|PUBLISH/.test(c)), 'no master write');
  });
  await t('approved master is read back byte-identical', async () => {
    const m = mockCentral();
    m.st.profile = { member_id: 'KID1', character_id: 'ready-explorer', identity_version: 2, master_asset_ref: 'ref', master_sha256: sha(master), status: 'CONFIRMED' };
    const s = await Sync.characterStatus({ runtime: runtime(), fetchImpl: m.fetchImpl });
    assert.equal(s.state, 'MASTER_READY'); assert.equal(s.version, 2);
    assert.ok(Buffer.from(s.image.split(',')[1], 'base64').equals(master)); assert.match(s.image, /^data:image\/png;base64,/);
  });
  await t('tampered master bytes are refused', async () => {
    const m = mockCentral();
    m.st.profile = { member_id: 'KID1', character_id: 'ready-explorer', identity_version: 1, master_asset_ref: 'ref', master_sha256: 'f'.repeat(64), status: 'CONFIRMED' };
    const s = await Sync.characterStatus({ runtime: runtime(), fetchImpl: m.fetchImpl });
    assert.equal(s.ok, false); assert.equal(s.state, 'MASTER_SHA_MISMATCH'); assert.ok(!s.image);
  });
  await t('member scope: two children -> MEMBER_SELECTION_REQUIRED; unknown member refused', async () => {
    const m = mockCentral();
    assert.equal((await Sync.requestCharacter({ photo, runtime: runtime(['PARENT1', 'KID1', 'KID2']), fetchImpl: m.fetchImpl })).state, 'MEMBER_SELECTION_REQUIRED');
    assert.equal((await Sync.requestCharacter({ photo, memberId: 'STRANGER', runtime: runtime(), fetchImpl: m.fetchImpl })).state, 'MEMBER_NOT_AUTHORIZED');
    assert.equal(m.st.calls.length, 0);
  });
  await t('only image data URLs are sent', async () => {
    const m = mockCentral();
    assert.equal((await Sync.requestCharacter({ photo: 'https://x/y.jpg', runtime: runtime(), fetchImpl: m.fetchImpl })).state, 'PHOTO_FORMAT');
    assert.equal(typeof Sync.publishMaster, 'undefined');
  });
  await t('expired Google sign-in -> SESSION_EXPIRED before any call; server 401 -> SESSION_EXPIRED', async () => {
    const jwt = exp => 'h.' + Buffer.from(JSON.stringify({ exp })).toString('base64url') + '.s';
    const now = 1_800_000_000_000;
    assert.equal(Sync.tokenExpired(jwt(now / 1000 - 1), now), true);
    assert.equal(Sync.tokenExpired(jwt(now / 1000 + 10), now), true, '30s margin');
    assert.equal(Sync.tokenExpired(jwt(now / 1000 + 600), now), false);
    assert.equal(Sync.tokenExpired('TEST_TOKEN_0123456789', now), false, 'unreadable token: let the server decide');
    const m = mockCentral();
    const old = { ...runtime(), getToken: async () => jwt(now / 1000 - 60) };
    assert.equal((await Sync.requestCharacter({ photo, runtime: old, fetchImpl: m.fetchImpl, now: () => now })).state, 'SESSION_EXPIRED');
    assert.equal((await Sync.characterStatus({ runtime: old, fetchImpl: m.fetchImpl, now: () => now })).state, 'SESSION_EXPIRED');
    assert.equal(m.st.calls.length, 0, 'nothing sent with an expired token');
    const r401 = async () => ({ ok: false, status: 401, json: async () => ({ ok: false, reason: 'BEARER_IDENTITY_VERIFICATION_FAILED' }) });
    assert.equal((await Sync.characterStatus({ runtime: runtime(), fetchImpl: r401 })).state, 'SESSION_EXPIRED');
    assert.equal((await Sync.requestCharacter({ photo, runtime: runtime(), fetchImpl: r401 })).state, 'SESSION_EXPIRED');
  });
  console.log(`rs-taky-character-sync: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
