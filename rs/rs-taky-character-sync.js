// Ready & Set -> TAKY central: no-cost character request (Taky 2026-11-06 "사진 등록하면 내가 만들어주면 되겟네").
// Contract: TAKY OS/CHARACTER_ASSET_BEHAVIOR_PIPELINE.md 3, 6.1, 6.2.
//   Ready sends the child's photo as a PRIVATE character request (family Drive, never a shared package).
//   A PARENT makes the character in TAKY Mobile and approves it; only that approval creates the
//   Character Master (private asset + character profile pointer) and deletes the photo.
//   Ready never publishes a master itself. It only reads the approved master back.
// Runs only with a verified TAKY family session (globalThis.TAKY_FAMILY_RUNTIME). Without one it
// reports PENDING_TAKY_SESSION and does nothing (fail-closed, no local "sent" claim).
(function (root) {
  'use strict';
  const CHARACTER_ID = 'ready-explorer';            // one stable child identity across Ready/Hide/Snap
  const TYPES = ['image/webp', 'image/png', 'image/jpeg'];
  const MAX_BYTES = 8 * 1024 * 1024;

  function decodeDataUrl(src) {
    const m = String(src || '').match(/^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) throw new Error('PHOTO_FORMAT');
    const bin = root.atob(m[2]); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('PHOTO_SIZE');
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

  // Shared session + scope check. Returns {post, family_id, member_id} or {state}.
  async function connect({ memberId = '', runtime = root.TAKY_FAMILY_RUNTIME, fetchImpl = root.fetch } = {}) {
    if (!runtime || typeof runtime.getToken !== 'function') return { state: 'PENDING_TAKY_SESSION' };
    let token, family_id, member_id, base;
    try {
      token = String(await runtime.getToken() || '');
      family_id = String(await runtime.getFamilyId() || '');
      member_id = resolveMember(await runtime.currentSession(), memberId);
      base = new URL(String(runtime.apiBaseUrl || ''));
    } catch { return { state: 'PENDING_TAKY_SESSION' }; }
    if (member_id === null) return { state: 'MEMBER_SELECTION_REQUIRED' };
    if (!member_id) return { state: 'MEMBER_NOT_AUTHORIZED' };
    if (!token || !family_id || base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname))
      return { state: 'PENDING_TAKY_SESSION' };
    const post = async (path, body) => {
      const r = await fetchImpl(new URL(path, base).href, { method: 'POST', cache: 'no-store', redirect: 'error',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
      let j = {}; try { j = await r.json(); } catch {}
      return { status: r.status, ok: r.ok && j && j.ok !== false, j };
    };
    return { post, family_id, member_id, fetchImpl };
  }

  // Child side: send the photo to the parent as a private request. A newer photo replaces an older one.
  async function requestCharacter({ photo, ...opts } = {}) {
    const c = await connect(opts); if (!c.post) return { ok: false, state: c.state };
    let src; try { src = decodeDataUrl(photo); } catch (e) { return { ok: false, state: e.message }; }
    try {
      const sha256 = await sha256Hex(src.bytes);
      const t = await c.post('/api/family/character-request', { action: 'CREATE', family_id: c.family_id, member_id: c.member_id,
        content_type: src.type, byte_size: src.bytes.length, sha256 });
      if (!t.ok || !t.j.upload_url) return { ok: false, state: 'REQUEST_TICKET_FAILED', status: t.status };
      const put = await c.fetchImpl(t.j.upload_url, { method: 'PUT', headers: { 'Content-Type': src.type }, body: src.bytes });
      if (!put.ok) return { ok: false, state: 'REQUEST_UPLOAD_FAILED', status: put.status };
      return { ok: true, state: 'REQUESTED', request_id: t.j.request_id || null };
    } catch { return { ok: false, state: 'CENTRAL_UNREACHABLE' }; }
  }

  // Where is my character? MASTER_READY (with the approved image), REQUESTED (parent is making it), or NONE.
  async function characterStatus({ withImage = true, ...opts } = {}) {
    const c = await connect(opts); if (!c.post) return { ok: false, state: c.state };
    try {
      const prof = await c.post('/api/family/character-profile', { action: 'GET', family_id: c.family_id, member_id: c.member_id });
      if (!prof.ok) return { ok: false, state: 'CHARACTER_PROFILE_UNAVAILABLE', status: prof.status };
      const p = prof.j.found ? prof.j.projection : null;
      const req = await c.post('/api/family/character-request', { action: 'STATUS', family_id: c.family_id, member_id: c.member_id });
      const pending = !!(req.ok && req.j.pending);
      if (!p || p.character_id !== CHARACTER_ID) return { ok: true, state: pending ? 'REQUESTED' : 'NONE' };
      const out = { ok: true, state: pending ? 'MASTER_READY_NEW_REQUEST' : 'MASTER_READY', version: Number(p.identity_version) || null, sha256: p.master_sha256 };
      if (!withImage) return out;
      const rr = await c.post('/api/family/character-asset', { action: 'RESOLVE_READ', family_id: c.family_id, member_id: c.member_id,
        character_id: CHARACTER_ID, asset_ref: p.master_asset_ref });
      if (!rr.ok || !rr.j.read_url) return { ...out, image: null };
      const r = await c.fetchImpl(rr.j.read_url, { cache: 'no-store' });
      if (!r.ok) return { ...out, image: null };
      const buf = new Uint8Array(await r.arrayBuffer());
      if ((await sha256Hex(buf)) !== p.master_sha256) return { ...out, image: null, state: 'MASTER_SHA_MISMATCH', ok: false };
      const type = (r.headers.get('content-type') || 'image/png').split(';')[0];
      let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return { ...out, image: 'data:' + (TYPES.includes(type) ? type : 'image/png') + ';base64,' + root.btoa(bin) };
    } catch { return { ok: false, state: 'CENTRAL_UNREACHABLE' }; }
  }

  const api = Object.freeze({ CHARACTER_ID, requestCharacter, characterStatus, decodeDataUrl, resolveMember });
  root.RsTakyCharacterSync = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
