// Ready & Set -> TAKY central: publish the child's confirmed AI Character Master.
// Contract: TAKY OS/CHARACTER_ASSET_BEHAVIOR_PIPELINE.md 3, 6.1, 6.2.
//   READY MASTER -> AUTHENTICATED PRIVATE ASSET UPLOAD -> VERIFIED COMMIT/SHA -> opaque master_asset_ref
//   -> FAMILY CHARACTER PROFILE (PUBLISH). The raw source photo is never sent here.
// Runs only with a verified TAKY family session (globalThis.TAKY_FAMILY_RUNTIME). Without one it
// reports PENDING_TAKY_SESSION and does nothing (fail-closed, no local "synced" claim).
(function (root) {
  'use strict';
  const CHARACTER_ID = 'ready-explorer';            // one stable child identity across Ready/Hide/Snap
  const TYPES = ['image/webp', 'image/png', 'image/jpeg'];
  const MAX_BYTES = 8 * 1024 * 1024;

  function decodeDataUrl(src) {
    const m = String(src || '').match(/^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) throw new Error('MASTER_IMAGE_FORMAT');
    const bin = root.atob(m[2]); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('MASTER_IMAGE_SIZE');
    return { type: m[1], bytes };
  }
  async function sha256Hex(bytes) {
    const d = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
  }

  // Whose character is this? An explicit member wins. Otherwise: a guardian session with exactly one other
  // authorized member -> that child; a session with only itself -> self. Anything else must be chosen by
  // the family (TAKY FAMILY_PROFILE_AUTHORITY: MEMBER_SELECTION_REQUIRED, no arbitrary child selection).
  function resolveMember(session, explicit) {
    const self = String(session && session.self_member_id || '');
    const ids = Array.isArray(session && session.authorized_member_ids) ? session.authorized_member_ids.map(String) : [];
    if (explicit) return ids.includes(String(explicit)) ? String(explicit) : '';
    const others = ids.filter(x => x && x !== self);
    if (others.length === 1) return others[0];
    if (!others.length && self) return self;
    return null;
  }

  async function publishMaster({ image, memberId = '', runtime = root.TAKY_FAMILY_RUNTIME, fetchImpl = root.fetch, now = () => new Date() } = {}) {
    if (!runtime || typeof runtime.getToken !== 'function') return { ok: false, state: 'PENDING_TAKY_SESSION' };
    let src; try { src = decodeDataUrl(image); } catch (e) { return { ok: false, state: e.message }; }
    if (!TYPES.includes(src.type)) return { ok: false, state: 'MASTER_IMAGE_FORMAT' };
    let token, family_id, member_id, base;
    try {
      token = String(await runtime.getToken() || '');
      family_id = String(await runtime.getFamilyId() || '');
      const s = await runtime.currentSession();
      member_id = resolveMember(s, memberId);
      base = new URL(String(runtime.apiBaseUrl || ''));
    } catch { return { ok: false, state: 'PENDING_TAKY_SESSION' }; }
    if (member_id === null) return { ok: false, state: 'MEMBER_SELECTION_REQUIRED' };
    if (!member_id) return { ok: false, state: 'MEMBER_NOT_AUTHORIZED' };
    if (!token || !family_id || !member_id || base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname))
      return { ok: false, state: 'PENDING_TAKY_SESSION' };
    const post = async (path, body) => {
      const r = await fetchImpl(new URL(path, base).href, { method: 'POST', cache: 'no-store', redirect: 'error',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
      let j = {}; try { j = await r.json(); } catch {}
      return { status: r.status, ok: r.ok && j && j.ok !== false, j };
    };
    const scope = { family_id, member_id, character_id: CHARACTER_ID };
    try {
      const cur = await post('/api/family/character-profile', { action: 'GET', family_id, member_id });
      if (!cur.ok) return { ok: false, state: 'CHARACTER_PROFILE_UNAVAILABLE', status: cur.status };
      const prev = cur.j.found && cur.j.projection ? Number(cur.j.projection.identity_version) || 0 : 0;
      const identity_version = prev + 1, asset_version = 'v' + identity_version;
      const sha256 = await sha256Hex(src.bytes);
      const up = await post('/api/family/character-asset', { action: 'CREATE_UPLOAD', ...scope, content_type: src.type, byte_size: src.bytes.length, sha256, asset_version });
      if (!up.ok || !up.j.upload_url) return { ok: false, state: 'ASSET_UPLOAD_TICKET_FAILED', status: up.status };
      const put = await fetchImpl(up.j.upload_url, { method: 'PUT', headers: { 'Content-Type': src.type }, body: src.bytes });
      if (!put.ok) return { ok: false, state: 'ASSET_UPLOAD_FAILED', status: put.status };
      const commit = await post('/api/family/character-asset', { action: 'COMMIT_UPLOAD', ...scope, asset_ref: up.j.asset_ref, upload_id: up.j.upload_id, sha256 });
      if (!commit.ok || commit.j.committed !== true) return { ok: false, state: 'ASSET_COMMIT_FAILED', status: commit.status };
      const projection = { member_id, character_id: CHARACTER_ID, identity_version, master_asset_ref: up.j.asset_ref,
        master_sha256: sha256, asset_version, derivative_refs: {}, status: 'CONFIRMED', updated_at: now().toISOString() };
      const pub = await post('/api/family/character-profile', { action: 'PUBLISH', family_id, member_id, projection });
      if (!pub.ok) return { ok: false, state: 'CHARACTER_PROFILE_PUBLISH_FAILED', status: pub.status, reason: pub.j.reason || null };
      return { ok: true, state: 'REGISTRY_BOUND', identity_version, master_sha256: sha256 };
    } catch { return { ok: false, state: 'CENTRAL_UNREACHABLE' }; }
  }

  const api = Object.freeze({ CHARACTER_ID, publishMaster, decodeDataUrl, resolveMember });
  root.RsTakyCharacterSync = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
