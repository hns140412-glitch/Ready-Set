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

export function loadConfig(file = cfgPath) {
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of ['central', 'family_id', 'member_id', 'device_token_file']) if (!c[k]) throw Error('CONFIG_MISSING_' + k);
  c.work_dir = c.work_dir || path.join(HERE, 'work');
  c.cli = c.cli || 'claude';
  return c;
}
const token = c => fs.readFileSync(path.resolve(HERE, c.device_token_file), 'utf8').trim();

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

const getRecord = c => api(c, 'GET', '/api/family/user-data', { query: { family_id: c.family_id, member_id: c.member_id, record_type: 'MATERIAL_REFERENCE', record_id: RECORD } });
async function putRecord(c, record_id, payload, etag) {
  return api(c, 'POST', '/api/family/user-data', { body: { record: { family_id: c.family_id, member_id: c.member_id, record_type: 'MATERIAL_REFERENCE', record_id,
    status: 'CONFIRMED', source_app: 'render-talent', occurred_at: new Date().toISOString(), due_at: new Date(payload.deadline + 'T12:00:00+09:00').toISOString(), payload }, ...(etag ? { expected_etag: etag } : {}) } });
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
  const opt = { cwd: dir, encoding: 'utf8', timeout: 8 * 60 * 1000, maxBuffer: 8 * 1024 * 1024, shell: process.platform === 'win32', input: '' };
  const r = c.cli === 'codex'
    ? spawnSync('codex', ['exec', '--skip-git-repo-check', ...files.flatMap(f => ['-i', path.basename(f)]), prompt], opt)
    : spawnSync(c.claude_bin || 'claude', ['-p', prompt, '--max-turns', turns, '--output-format', 'text', '--allowedTools', 'Read'], opt);
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
export function merge(payload, answer, Parent, now = Date.now()) {
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
      interpreted = { by: 'RENDER_CLI', confidence: sure ? 'high' : 'low', note: String((a && a.note) || (a && a.range_text ? '' : '범위를 못 읽었어요')).slice(0, 60), at: new Date(now).toISOString() };
      if (!sure) unsure++;
    }
    state.books[key] = { range, sessions: cur.sessions || null, chars: key === 'hanja' ? ((payload.hanja && payload.hanja.chars || []).join('') || (answer && answer.hanja_chars) || '') : '',
      items: key === 'hanja' ? ((payload.hanja && payload.hanja.items || []).concat((answer && answer.hanja_items) || [])) : undefined };
    state.books[key].interpreted = interpreted;
  }
  // Characters read from the 한자 photo count as sure only when the CLI says so; otherwise the parent sees them once.
  const cliHanja = !(payload.hanja && (payload.hanja.chars || []).length) && answer && answer.hanja_chars && ((byKey.hanja || {}).photo_refs || []).length;
  if (cliHanja && answer.hanja_confidence !== 'high') { unsure++; state.books.hanja.interpreted = Object.assign({ by: 'RENDER_CLI', at: new Date(now).toISOString() }, state.books.hanja.interpreted, { confidence: 'low', note: '한자 글자 확인' }); }
  const p = Parent.plan(state, now);
  const out = Object.assign({}, payload, {
    state: unsure ? 'INTERPRETED' : 'CONFIRMED',
    days: p.days,
    books: p.books.map(b => ({ key: b.key, subject: b.subject, range_text: b.range_text, from: b.from, to: b.to, unit: b.unit, sessions: state.books[b.key].sessions,
      photo_refs: (byKey[b.key] || {}).photo_refs || [], interpreted: state.books[b.key].interpreted,
      parts: b.parts.map(x => ({ date: x.date, label: x.label, from: x.from, to: x.to, todo_id: x.todo_id })) })),
    hanja: p.hanja, interpreted_by: 'RENDER_CLI', interpreted_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(),
  });
  return { payload: out, unsure, filled };
}

const photosKey = pl => crypto.createHash('sha256').update(JSON.stringify((pl.books || []).map(b => [b.key, (b.photo_refs || []).slice().sort()]))).digest('hex').slice(0, 16);

export async function runOnce(c, { dry = false } = {}) {
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
      const r = await api(c, 'GET', '/api/family/material-photo', { query: { family_id: c.family_id, member_id: c.member_id, ref }, raw: true });
      if (!r.ok) { log('photo download failed', b.key, r.status); continue; }
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    }
    files.push(f);
  }
  if (!files.length) return { state: 'NO_PHOTOS' };
  log('reading', files.length, 'photos for', pl.week_id, 'with', c.cli);
  const answer = parseAnswer(runCli(c, dir, files));
  if (!answer) { log('CLI gave no JSON'); }
  const m = merge(pl, answer || { books: [] }, Parent);
  m.payload.interpreted_photos = key;
  log('result', m.payload.state, 'filled', m.filled, 'unsure', m.unsure, m.payload.books.map(b => b.key + '=' + (b.range_text || '-')).join(' '), 'hanja=' + (m.payload.hanja.chars || []).join(''));
  if (dry) return { state: 'DRY', payload: m.payload };
  const w = await putRecord(c, RECORD, m.payload, g.j.etag);
  if (!w.ok) { log('write failed', w.status, w.j.reason || ''); return { state: 'WRITE_FAILED' }; }
  const wk = 'ready-talent-week-' + pl.week_id;
  const g2 = await api(c, 'GET', '/api/family/user-data', { query: { family_id: c.family_id, member_id: c.member_id, record_type: 'MATERIAL_REFERENCE', record_id: wk } });
  await putRecord(c, wk, m.payload, g2.ok ? g2.j.etag : undefined);
  return { state: m.payload.state, payload: m.payload };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (async () => {
    const c = loadConfig();
    await renewToken(c).catch(e => log('renew error', e.message));
    const r = await runOnce(c, { dry: flag('--dry-run') });
    if (flag('--dry-run') && r.payload) console.log(JSON.stringify(r.payload, null, 1));
  })().catch(e => { log('ERROR', e.message); process.exit(1); });
}
