#!/usr/bin/env node
// 재능 숙제 사진 자동 해석 (RENDER PC). Taky 2026-11-24: "CLI로 해석 하고 플래너로 이관 시키는 자동화", "랜더 컴에서 작동 되게".
//
// 1. Reads the week record (TAKY central user-data MATERIAL_REFERENCE "ready-talent-week-current", READY_TALENT_WEEK_V1).
// 2. When the parent sent photos (state PHOTOS_UPLOADED, or new photos after INTERPRETED), downloads them from the family
//    Google Drive through /api/family/material-photo into a work folder.
// 3. Asks the local CLI (Claude Code `claude -p`, or Codex `codex exec`) to read each book's photos: range and, for 한자,
//    the week's characters. No paid API key; the CLI runs on the PC's own subscription sign-in.
// 4. Splits the week with Ready's own planner rule (rs-parent.js, copied next to this file) and writes the record back:
//    every book sure -> CONFIRMED (the child's Ready puts it in its Planner by itself); anything unsure -> INTERPRETED
//    (the parent confirms in the 보호자 화면 with one tap).
//
// Usage: node talent-interpret.mjs [--once] [--dry-run] [--config <file>]
// Config (JSON, next to this file by default, never committed): see talent-interpret.config.example.json.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const cfgPath = args.includes('--config') ? args[args.indexOf('--config') + 1] : path.join(HERE, 'talent-interpret.config.json');
const RECORD = 'ready-talent-week-current';
const BOOK_KEYS = { calc: '연산', hanja: '한자', korean: '국어', social: '사회', math: '수학', pizza: '생각하는 피자' };

const log = (...a) => {
  const line = new Date().toISOString() + ' ' + a.join(' ');
  console.log(line);
  try { fs.appendFileSync(path.join(HERE, 'talent-interpret.log'), line + '\n'); } catch { /* read-only folder */ }
};

// One-time pairing: the parent screen (Ready 보호자 화면 -> 렌더 PC 연결 파일 받기) saves taky-render-pairing*.txt in
// Downloads. Take it in: token to device_token_file, family/member into the config, then delete the file.
export function importPairing(file = cfgPath, dirs = [path.join(os.homedir(), 'Downloads')]) {
  const c = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const d of dirs) {
    let names = []; try { names = fs.readdirSync(d).filter(n => /^taky-render-pairing.*\.txt$/i.test(n)); } catch { continue; }
    names.sort((a, b) => fs.statSync(path.join(d, b)).mtimeMs - fs.statSync(path.join(d, a)).mtimeMs);
    for (const n of names) {
      const f = path.join(d, n); let j = null; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { j = null; }
      if (!j || j.kind !== 'TAKY_RENDER_PAIRING_V1' || !/^tdv1\./.test(j.device_token || '')) continue;
      const tokenFile = path.resolve(HERE, c.device_token_file || 'device-token.txt');
      fs.writeFileSync(tokenFile, j.device_token, { mode: 0o600 });
      Object.assign(c, { central: c.central || j.central, family_id: j.family_id, member_id: j.member_id, device_token_file: c.device_token_file || 'device-token.txt' });
      fs.writeFileSync(file, JSON.stringify(c, null, 2));
      for (const m of names) try { fs.unlinkSync(path.join(d, m)); } catch { /* noop */ }
      log('paired', j.family_id, j.member_id, 'token until', j.expires_at || '?');
      return true;
    }
  }
  return false;
}

export function loadConfig(file = cfgPath) {
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of ['central', 'family_id', 'member_id', 'device_token_file']) if (!c[k]) throw Error('CONFIG_MISSING_' + k);
  c.work_dir = c.work_dir || path.join(HERE, 'work');
  c.cli = c.cli || 'claude';
  return c;
}
const token = c => fs.readFileSync(path.resolve(HERE, c.device_token_file), 'utf8').trim();

// Cloud mode (Taky 2026-11-25 "클라우드 Claude로 바꾸기"): the scheduled cloud Claude run holds only the server-side
// agent key (env TAKY_TALENT_AGENT_KEY) and trades it for a 15-minute parent device token. Nothing is stored on disk.
export async function agentConfig(env = process.env) {
  const c = { central: env.TAKY_CENTRAL || 'https://taky-mobile.netlify.app', family_id: env.TAKY_FAMILY_ID || 'TAKY-HOME',
    work_dir: env.TAKY_TALENT_WORK_DIR || path.join(os.tmpdir(), 'taky-talent'), cli: 'agent', agentKey: String(env.TAKY_TALENT_AGENT_KEY || '').trim() };
  if (c.agentKey.length < 32) throw Error('AGENT_KEY_MISSING');
  const r = await agentCall(c, {});
  if (!r.ok || !r.j.member_id) throw Error('AGENT_LOGIN_FAILED ' + r.status + ' ' + (r.j.reason || ''));
  c.member_id = r.j.member_id; return c;
}
// The agent key opens one narrow door (/api/family/talent-agent): get_week, put_week, photo. Nothing else.
async function agentCall(c, body, raw = false) {
  const r = await fetch(new URL('/api/family/talent-agent', c.central), { method: 'POST', headers: { 'content-type': 'application/json', 'x-taky-agent-key': c.agentKey }, body: JSON.stringify(Object.assign({ family_id: c.family_id }, body)), redirect: 'error' });
  if (raw) return r;
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok && j.ok !== false, j };
}

async function api(c, method, p, { query, body, type, raw } = {}) {
  const u = new URL(p, c.central); if (query) for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
  const headers = { authorization: 'Bearer ' + token(c) };
  if (body !== undefined) headers['content-type'] = type || 'application/json';
  const r = await fetch(u, { method, headers, body: body === undefined ? undefined : (type ? body : JSON.stringify(body)), redirect: 'error' });
  if (raw) return r;
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok && j.ok !== false, j };
}

// The device token lasts 400 days; renew it once a month so the PC never drops out.
async function renewToken(c) {
  const f = path.resolve(HERE, c.device_token_file);
  const age = Date.now() - fs.statSync(f).mtimeMs;
  if (age < 30 * 864e5) return;
  const r = await api(c, 'POST', '/api/family/device', { body: {} });
  if (r.ok && /^tdv1\./.test(r.j.device_token || '')) { fs.writeFileSync(f, r.j.device_token, { mode: 0o600 }); log('device token renewed'); }
  else log('device token renewal failed', r.status);
}

const getWeek = (c, record_id) => c.agentKey ? agentCall(c, { op: 'get_week', record_id })
  : api(c, 'GET', '/api/family/user-data', { query: { family_id: c.family_id, member_id: c.member_id, record_type: 'MATERIAL_REFERENCE', record_id } });
const getRecord = c => getWeek(c, RECORD);
async function putRecord(c, record_id, payload, etag) {
  const record = { family_id: c.family_id, member_id: c.member_id, record_type: 'MATERIAL_REFERENCE', record_id,
    status: 'CONFIRMED', source_app: c.agentKey ? 'cloud-talent' : 'render-talent', occurred_at: new Date().toISOString(), due_at: new Date(payload.deadline + 'T12:00:00+09:00').toISOString(), payload };
  if (c.agentKey) return agentCall(c, { op: 'put_week', record, ...(etag ? { expected_etag: etag } : {}) });
  return api(c, 'POST', '/api/family/user-data', { body: { record, ...(etag ? { expected_etag: etag } : {}) } });
}

// What the CLI must answer. Kept strict so a vague answer becomes "low" and goes to the parent, never into the Planner.
export function promptFor(files) {
  return [
    '아래 사진들은 초등학생의 재능 학습지(연산, 한자, 국어, 사회, 수학, 생각하는 피자) 이번 주 숙제 사진이에요.',
    '각 사진 파일을 Read 도구로 열어 보고, 책마다 이번 주에 풀어야 할 범위를 찾아 주세요.',
    '파일 이름의 앞부분이 책 키예요: ' + Object.entries(BOOK_KEYS).map(([k, v]) => `${k}=${v}`).join(', ') + '.',
    '파일: ' + files.map(f => path.basename(f)).join(', '),
    '규칙:',
    '- 범위는 사진에 실제로 보이는 쪽/회/장 번호만 쓰세요. 추측이면 confidence를 "low"로 하세요.',
    '- range_text 형식 예: "21~26쪽", "3~5회", "12쪽". 번호를 못 찾으면 range_text를 빈 문자열로 두세요.',
    '- 한자 책이면 이번 주에 배우는 한자 글자들을 hanja_chars 에 문자열로 모두 적으세요 (예: "日月火水木"). 못 읽으면 빈 문자열.',
    '- 다른 설명 없이 JSON 한 개만 출력하세요.',
    '- 한자 글자를 모두 또렷하게 읽었으면 hanja_confidence 를 "high", 아니면 "low".',
    '- 학습지에 인쇄된 훈음도 hanja_items 에 적으세요: [{"char":"日","meaning":"날","reading":"일"}]. meaning 은 한글 훈, reading 은 한글 한 글자 음. 사진에 인쇄된 것만 쓰고, 안 보이면 그 글자는 빼세요.',
    '출력 형식: {"books":[{"key":"calc","range_text":"21~26쪽","confidence":"high","note":""}],"hanja_chars":"","hanja_confidence":"high","hanja_items":[]}',
  ].join('\n');
}

// Same shape as the Ready card-news runs on this PC: the rules live in TASK_CONTRACT.md next to the photos and the CLI is
// told to read it, with a turn cap big enough for one Read per photo (the 11-24 card-news runs hit "max turns (9)").
export function runCli(c, dir, files) {
  fs.writeFileSync(path.join(dir, 'TASK_CONTRACT.md'), '# 재능 숙제 사진 해석 (READY_TALENT_WEEK_V1)\n\n' + promptFor(files) + '\n');
  const prompt = 'Read TASK_CONTRACT.md in this folder and do exactly what it says. Answer with the JSON only.';
  const turns = String(Math.max(12, files.length * 2 + 6));
  // A full .exe path runs directly (no shell, args stay whole). A bare name on Windows may be a .cmd shim that needs the
  // shell; then every argument is quoted, or cmd would split the prompt into words ("-p Read").
  const [bin, argv] = c.cli === 'codex'
    ? [c.codex_bin || 'codex', ['exec', '--skip-git-repo-check', ...files.flatMap(f => ['-i', path.basename(f)]), prompt]]
    : [c.claude_bin || 'claude', ['-p', prompt, '--max-turns', turns, '--output-format', 'text', '--allowedTools', 'Read']];
  const shell = process.platform === 'win32' && !/\.exe$/i.test(bin);
  const q = a => shell ? '"' + String(a).replace(/"/g, '\\"') + '"' : a;
  const opt = { cwd: dir, encoding: 'utf8', timeout: 8 * 60 * 1000, maxBuffer: 8 * 1024 * 1024, shell, input: '' };
  const r = spawnSync(shell ? q(bin) : bin, argv.map(q), opt);
  try { fs.appendFileSync(path.join(dir, 'CLAUDE_RESULT.log'), new Date().toISOString() + ' exit ' + r.status + '\n' + String(r.stdout || '') + '\n' + String(r.stderr || '') + '\n'); } catch { /* noop */ }
  if (r.error || r.status !== 0) throw Error('CLI_FAILED ' + (r.error ? r.error.message : 'exit ' + r.status + ' ' + String(r.stderr || '').slice(0, 300)));
  return r.stdout;
}

// Take the last {...} block that parses; anything else is not an answer.
export function parseAnswer(text) {
  const s = String(text || ''); let best = null;
  for (let i = s.lastIndexOf('{'); i >= 0; i = s.lastIndexOf('{', i - 1)) {
    for (let j = s.lastIndexOf('}'); j > i; j = s.lastIndexOf('}', j - 1)) {
      try { const o = JSON.parse(s.slice(i, j + 1)); if (o && Array.isArray(o.books)) { best = o; break; } } catch { /* keep looking */ }
    }
    if (best) break;
  }
  return best;
}

// Merge the CLI answer into the week record using Ready's own split (rs-parent.js) so both sides agree to the day.
export function merge(payload, answer, Parent, now = Date.now(), by = 'RENDER_CLI') {
  const state = { week: { week_id: payload.week_id, source_date: payload.source_date, deadline: payload.deadline }, books: {} };
  const byKey = Object.fromEntries((payload.books || []).map(b => [b.key, b]));
  const ans = Object.fromEntries(((answer && answer.books) || []).filter(b => b && BOOK_KEYS[b.key]).map(b => [b.key, b]));
  let unsure = 0, filled = 0;
  for (const key of Object.keys(BOOK_KEYS)) {
    const cur = byKey[key] || {}; const a = ans[key]; const hasPhotos = (cur.photo_refs || []).length > 0;
    let range = cur.range_text || '', interpreted = cur.interpreted || null;
    // The parent's own range always wins; the CLI only fills books the parent left empty.
    if (!cur.range_text && hasPhotos) {
      const parsed = a && Parent.parseRange(a.range_text);
      const sure = !!(a && a.confidence === 'high' && parsed && parsed.from != null);
      if (a && a.range_text) { range = String(a.range_text).slice(0, 30); filled++; }
      interpreted = { by, confidence: sure ? 'high' : 'low', note: String((a && a.note) || (a && a.range_text ? '' : '범위를 못 읽었어요')).slice(0, 60), at: new Date(now).toISOString() };
      if (!sure) unsure++;
    }
    state.books[key] = { range, sessions: cur.sessions || null, chars: key === 'hanja' ? ((payload.hanja && payload.hanja.chars || []).join('') || (answer && answer.hanja_chars) || '') : '',
      items: key === 'hanja' ? ((payload.hanja && payload.hanja.items || []).concat((answer && answer.hanja_items) || [])) : undefined };
    state.books[key].interpreted = interpreted;
  }
  // Characters read from the 한자 photo count as sure only when the CLI says so; otherwise the parent sees them once.
  const cliHanja = !(payload.hanja && (payload.hanja.chars || []).length) && answer && answer.hanja_chars && ((byKey.hanja || {}).photo_refs || []).length;
  if (cliHanja && answer.hanja_confidence !== 'high') { unsure++; state.books.hanja.interpreted = Object.assign({ by, at: new Date(now).toISOString() }, state.books.hanja.interpreted, { confidence: 'low', note: '한자 글자 확인' }); }
  const p = Parent.plan(state, now);
  const out = Object.assign({}, payload, {
    state: unsure ? 'INTERPRETED' : 'CONFIRMED',
    days: p.days,
    books: p.books.map(b => ({ key: b.key, subject: b.subject, range_text: b.range_text, from: b.from, to: b.to, unit: b.unit, sessions: state.books[b.key].sessions,
      photo_refs: (byKey[b.key] || {}).photo_refs || [], interpreted: state.books[b.key].interpreted,
      parts: b.parts.map(x => ({ date: x.date, label: x.label, from: x.from, to: x.to, todo_id: x.todo_id })) })),
    hanja: p.hanja, interpreted_by: by, interpreted_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(),
  });
  return { payload: out, unsure, filled };
}

const photosKey = pl => crypto.createHash('sha256').update(JSON.stringify((pl.books || []).map(b => [b.key, (b.photo_refs || []).slice().sort()]))).digest('hex').slice(0, 16);

export async function runOnce(c, { dry = false, fetchOnly = false, answer: given = null } = {}) {
  // Ready's own split rule: the copy installed next to this file on the render PC, or the repo's rs/ when run from the repo.
  const local = path.join(HERE, 'rs-parent.js');
  const Parent = createRequire(import.meta.url)(fs.existsSync(local) ? local : path.join(HERE, '..', '..', 'rs', 'rs-parent.js'));
  const g = await getRecord(c);
  if (g.status === 404) { log('no week yet'); return { state: 'NO_WEEK' }; }
  if (!g.ok) { log('read failed', g.status, g.j.reason || ''); return { state: 'READ_FAILED' }; }
  const rec = g.j.record, pl = rec && rec.payload;
  if (!pl || pl.schema !== 'READY_TALENT_WEEK_V1') return { state: 'NOT_A_WEEK' };
  const key = photosKey(pl);
  const todo = (pl.books || []).some(b => (b.photo_refs || []).length && !b.range_text);
  if (pl.state === 'CONFIRMED' || !todo) { log('nothing to read', pl.week_id, pl.state); return { state: 'NOTHING' }; }
  if (pl.interpreted_photos === key) { log('already read these photos', pl.week_id); return { state: 'NOTHING' }; }
  const dir = path.join(c.work_dir, pl.week_id + '-' + key); fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const b of pl.books || []) for (const [i, ref] of (b.photo_refs || []).entries()) {
    if (b.range_text) continue;
    const f = path.join(dir, `${b.key}-${i + 1}.jpg`);
    if (!fs.existsSync(f)) {
      const r = c.agentKey ? await agentCall(c, { op: 'photo', ref }, true) : await api(c, 'GET', '/api/family/material-photo', { query: { family_id: c.family_id, member_id: c.member_id, ref }, raw: true });
      if (!r.ok) { log('photo download failed', b.key, r.status); continue; }
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    }
    files.push(f);
  }
  if (!files.length) return { state: 'NO_PHOTOS' };
  // Cloud mode, step 1: hand the photos and the rules to the Claude run itself; it answers with --apply.
  if (fetchOnly) { fs.writeFileSync(path.join(dir, 'TASK_CONTRACT.md'), '# 재능 숙제 사진 해석 (READY_TALENT_WEEK_V1)\n\n' + promptFor(files) + '\n'); return { state: 'FETCHED', week_id: pl.week_id, key, dir, files }; }
  log('reading', files.length, 'photos for', pl.week_id, 'with', given ? 'cloud Claude' : c.cli);
  const answer = given || parseAnswer(runCli(c, dir, files));
  if (!answer) { log('CLI gave no JSON'); }
  const m = merge(pl, answer || { books: [] }, Parent, Date.now(), given ? 'CLOUD_CLAUDE' : 'RENDER_CLI');
  m.payload.interpreted_photos = key;
  log('result', m.payload.state, 'filled', m.filled, 'unsure', m.unsure, m.payload.books.map(b => b.key + '=' + (b.range_text || '-')).join(' '), 'hanja=' + (m.payload.hanja.chars || []).join(''));
  if (dry) return { state: 'DRY', payload: m.payload };
  const w = await putRecord(c, RECORD, m.payload, g.j.etag);
  if (!w.ok) { log('write failed', w.status, w.j.reason || ''); return { state: 'WRITE_FAILED' }; }
  const wk = 'ready-talent-week-' + pl.week_id;
  const g2 = await getWeek(c, wk);
  await putRecord(c, wk, m.payload, g2.ok ? g2.j.etag : undefined);
  return { state: m.payload.state, payload: m.payload };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && flag('--agent')) {
  // node talent-interpret.mjs --agent --fetch          -> JSON {state, dir, files}; read the files, answer per TASK_CONTRACT.md
  // node talent-interpret.mjs --agent --apply ans.json -> merges the answer (same rules as the render PC) and writes the week
  (async () => {
    const c = await agentConfig();
    if (flag('--fetch')) { const r = await runOnce(c, { fetchOnly: true }); console.log(JSON.stringify(r)); return; }
    const f = args[args.indexOf('--apply') + 1]; if (!flag('--apply') || !f) throw Error('USE --fetch OR --apply <answer.json>');
    const answer = parseAnswer(fs.readFileSync(f, 'utf8')); if (!answer) throw Error('ANSWER_NOT_JSON');
    const r = await runOnce(c, { answer, dry: flag('--dry-run') });
    console.log(JSON.stringify({ state: r.state, books: r.payload ? r.payload.books.map(b => [b.key, b.range_text, b.interpreted && b.interpreted.confidence]) : null, hanja: r.payload ? r.payload.hanja : null }));
  })().catch(e => { log('ERROR', e.message); process.exit(1); });
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (async () => {
    importPairing();
    let c0; try { c0 = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { c0 = {}; }
    if (!c0.device_token_file || !fs.existsSync(path.resolve(HERE, c0.device_token_file))) { log('WAITING_FOR_PAIRING: open Ready 보호자 화면 on this PC and press 렌더 PC 연결 파일 받기'); return; }
    const c = loadConfig();
    await renewToken(c).catch(e => log('renew error', e.message));
    const r = await runOnce(c, { dry: flag('--dry-run') });
    if (flag('--dry-run') && r.payload) console.log(JSON.stringify(r.payload, null, 1));
  })().catch(e => { log('ERROR', e.message); process.exit(1); });
}
