// Ready & Set 보호자 화면: 재능 숙제 주간 등록 (Taky 2026-11-24 "래디앤셋 보호자 모드가 없는듯 한데").
// Tuesday evening the 재능 books come home. A parent photographs each book, types the range while looking at
// the photo, and the week (day after the source day .. day before the next Tuesday) is split into Planner
// to-dos. The week's 한자 list is published for Hide & Seek as READY_TALENT_WEEK_V1 (TAKY central user-data,
// MATERIAL_REFERENCE, record_id "ready-talent-week-current"). Photos never leave the device (IndexedDB).
// Restores the intake the legacy app.js had (TALENT_BOOKS) without its analysis stack: no OCR, no paid API.
(function (root) {
  'use strict';
  const BOOKS = [
    { key: 'calc', subject: '연산' }, { key: 'hanja', subject: '한자' }, { key: 'korean', subject: '국어' },
    { key: 'social', subject: '사회' }, { key: 'math', subject: '수학' }, { key: 'pizza', subject: '생각하는 피자' },
  ];
  const STORE_KEY = 'rs2:talent:v1';
  const SCHEMA = 'READY_TALENT_WEEK_V1';
  const CURRENT_ID = 'ready-talent-week-current';
  const DAY = 864e5;
  const pad = n => String(n).padStart(2, '0');
  const ymd = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const atNoon = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WD = '일월화수목금토';
  const md = s => { const d = new Date(atNoon(s)); return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`; };

  // The 재능 week starts on the Tuesday the books come home (on or before today).
  function weekOf(now = Date.now()) {
    const d = new Date(now); const back = (d.getDay() - 2 + 7) % 7;
    const source = ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - back, 12));
    const deadline = ymd(atNoon(source) + 7 * DAY);
    return { week_id: source, source_date: source, deadline };
  }
  // Practice days: the day after the source day (or today, when entered late) .. the day before the deadline.
  function daysFor(week, now = Date.now()) {
    const first = Math.max(atNoon(week.source_date) + DAY, atNoon(ymd(now)));
    const out = []; for (let t = first; t < atNoon(week.deadline); t += DAY) out.push(ymd(t));
    return out.length ? out : [ymd(now)];
  }
  // "21~26", "21-26쪽", "p.21-26", "3~5회", "12쪽" -> {from,to,unit}; anything else stays free text.
  function parseRange(text) {
    const s = String(text || '').trim(); if (!s) return null;
    const m = s.match(/(\d{1,4})\s*(?:[~\-–—]|부터)\s*(\d{1,4})\s*(쪽|장|회|과|단원|번|p)?/i);
    const one = !m && s.match(/^(?:p\.?\s*)?(\d{1,4})\s*(쪽|장|회|과|단원|번|p)?$/i);
    if (!m && !one) return { text: s, from: null, to: null, unit: '' };
    let from = +(m ? m[1] : one[1]), to = +(m ? m[2] : one[1]); if (to < from) [from, to] = [to, from];
    if (to - from > 300) return { text: s, from: null, to: null, unit: '' };
    const unit = ((m ? m[3] : one[2]) || (/p/i.test(s) ? '쪽' : '쪽')).replace(/^p$/i, '쪽');
    return { text: s, from, to, unit };
  }
  // Even split of a numeric range over n sessions; sessions spread evenly over the practice days.
  function splitBook(book, days, sessions) {
    const r = parseRange(book.range); if (!r) return [];
    const label = `재능 ${book.subject}`;
    if (r.from == null) return [{ date: days[0], label: `${label} · ${r.text}`.slice(0, 40), from: null, to: null }];
    const total = r.to - r.from + 1;
    const n = Math.max(1, Math.min(sessions || days.length, total, days.length));
    const out = []; let at = r.from;
    for (let i = 0; i < n; i++) {
      const size = Math.floor(total / n) + (i < total % n ? 1 : 0);
      const a = at, b = at + size - 1; at = b + 1;
      const date = days[Math.round(i * (days.length - 1) / Math.max(1, n - 1))] || days[0];
      out.push({ date, label: `${label} · ${a === b ? a : a + '~' + b}${r.unit}`.slice(0, 40), from: a, to: b });
    }
    if (n === 1) out[0].date = days[0];
    return out;
  }
  const hanjaChars = s => [...new Set(Array.from(String(s || '')).filter(c => /[㐀-䶿一-鿿豈-﫿]/.test(c)))].slice(0, 60);

  function plan(state, now = Date.now()) {
    const week = state.week; const days = daysFor(week, now); const load = Object.fromEntries(days.map(d => [d, 0]));
    const split = BOOKS.map(b => { const v = state.books[b.key] || {}; return { b, v, parts: splitBook({ subject: b.subject, range: v.range }, days, v.sessions) }; });
    // Spread books first, then put one-shot books (사회 2단원, 피자 3~5회) on the lightest day, earliest first.
    split.filter(x => x.parts.length > 1).forEach(x => x.parts.forEach(y => { load[y.date]++; }));
    split.filter(x => x.parts.length === 1).forEach(x => { const d = days.reduce((m, d2) => load[d2] < load[m] ? d2 : m, days[0]); x.parts[0].date = d; load[d]++; });
    const books = split.map(({ b, v, parts: raw }) => {
      const r = parseRange(v.range);
      const parts = raw.map((x, i) => Object.assign(x, { todo_id: `talent-${week.week_id}-${b.key}-${i + 1}` }));
      return { key: b.key, subject: b.subject, range_text: r ? r.text : '', from: r ? r.from : null, to: r ? r.to : null, unit: r ? r.unit : '', photos: (v.photos || []).length, parts };
    });
    const hanja = hanjaChars((state.books.hanja || {}).chars);
    return { schema: SCHEMA, week_id: week.week_id, source_date: week.source_date, deadline: week.deadline, days, books,
      hanja: { chars: hanja, range_text: (state.books.hanja || {}).range || '', practice_label: '이번 주 구간' } };
  }

  // ---------- storage ----------
  function load() {
    let s = null; try { s = JSON.parse(root.localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { s = null; }
    const week = weekOf();
    if (!s || !s.week || s.week.week_id !== week.week_id) s = { week, books: {}, saved: null, prev: s && s.saved ? { week_id: s.week.week_id, todo_ids: s.saved.todo_ids } : (s && s.prev) || null };
    return s;
  }
  function store(s) { try { root.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* storage full or blocked */ } }
  const IDB = { db: null };
  function idb() {
    if (IDB.db) return Promise.resolve(IDB.db);
    return new Promise(res => { try { const r = root.indexedDB.open('rs-parent', 1); r.onupgradeneeded = () => r.result.createObjectStore('photos'); r.onsuccess = () => res(IDB.db = r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
  }
  async function photoPut(id, blob) { const db = await idb(); if (!db) return false; return new Promise(res => { const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').put(blob, id); t.oncomplete = () => res(true); t.onerror = () => res(false); }); }
  async function photoGet(id) { const db = await idb(); if (!db) return null; return new Promise(res => { const q = db.transaction('photos').objectStore('photos').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); }
  async function photoDel(id) { const db = await idb(); if (!db) return; db.transaction('photos', 'readwrite').objectStore('photos').delete(id); }
  // Phone photos are 3-12MB; 1600px JPEG keeps the page numbers readable at a fraction of the size.
  function shrink(file) {
    return new Promise(res => {
      const u = URL.createObjectURL(file); const im = new Image();
      im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => res(b || file), 'image/jpeg', .82); };
      im.onerror = () => { URL.revokeObjectURL(u); res(file); }; im.src = u;
    });
  }

  // ---------- central: the week for Hide & Seek ----------
  async function publish(p) {
    const rt = root.TAKY_FAMILY_RUNTIME; const Sync = root.RsTakyCharacterSync;
    if (!rt || !Sync) return { ok: false, state: 'NOT_JOINED' };
    try {
      const token = String(await rt.getToken() || ''), family_id = String(await rt.getFamilyId() || '');
      const member_id = Sync.resolveMember(await rt.currentSession());
      if (!member_id) return { ok: false, state: 'MEMBER_SELECTION_REQUIRED' };
      const base = new URL(String(rt.apiBaseUrl || ''));
      const H = { authorization: 'Bearer ' + token };
      const payload = { schema: SCHEMA, week_id: p.week_id, source_date: p.source_date, deadline: p.deadline, days: p.days,
        books: p.books.map(b => ({ subject: b.subject, range_text: b.range_text, from: b.from, to: b.to, unit: b.unit, parts: b.parts.map(x => ({ date: x.date, label: x.label, from: x.from, to: x.to, todo_id: x.todo_id })) })),
        hanja: p.hanja, entered_by: 'PARENT', source: 'READY_PARENT_INTAKE', updated_at: new Date().toISOString() };
      const one = async record_id => {
        const q = new URLSearchParams({ family_id, member_id, record_type: 'MATERIAL_REFERENCE', record_id });
        const g = await fetch(new URL('/api/family/user-data?' + q, base).href, { headers: H, cache: 'no-store', redirect: 'error' });
        let etag = ''; if (g.ok) { try { etag = (await g.json()).etag || ''; } catch (e) { /* noop */ } }
        else if (g.status === 401) return { ok: false, state: 'SESSION_EXPIRED' };
        const r = await fetch(new URL('/api/family/user-data', base).href, { method: 'POST', cache: 'no-store', redirect: 'error',
          headers: Object.assign({ 'content-type': 'application/json' }, H),
          body: JSON.stringify({ record: { family_id, member_id, record_type: 'MATERIAL_REFERENCE', record_id, status: 'CONFIRMED', source_app: 'ready-set',
            occurred_at: new Date().toISOString(), due_at: new Date(atNoon(p.deadline)).toISOString(), payload }, ...(etag ? { expected_etag: etag } : {}) }) });
        return { ok: r.ok, state: r.ok ? 'PUBLISHED' : 'HTTP_' + r.status };
      };
      const cur = await one(CURRENT_ID); if (!cur.ok) return cur;
      await one('ready-talent-week-' + p.week_id);
      return { ok: true, state: 'PUBLISHED', member_id };
    } catch (e) { return { ok: false, state: 'CENTRAL_UNREACHABLE' }; }
  }

  // ---------- UI ----------
  const V = { el: null, s: null, msg: '', busy: false, view: null };
  function toPlanner(p) {
    const P = root.ReadySetPlanner; if (!P) return { ok: false, n: 0 };
    const ids = new Set(); let n = 0;
    p.books.forEach(b => b.parts.forEach((x, i) => { ids.add(x.todo_id);
      P.upsertDatedTodo({ todo_id: x.todo_id, date: x.date, label: x.label, source: 'PLANNER', source_actor: 'PARENT_TALENT', order: 100 + i,
        provenance: { via: 'READY_PARENT_INTAKE', schema: SCHEMA, week_id: p.week_id, subject: b.subject } }); n++; }));
    // A re-save replaces this week's earlier split; done or started to-dos are left as they are.
    const old = [].concat((V.s.saved && V.s.saved.todo_ids) || []);
    try { P.snapshot().dated_todos.filter(t => old.includes(t.todo_id) && !ids.has(t.todo_id) && t.state === 'PLANNED')
      .forEach(t => P.upsertDatedTodo(Object.assign({}, t, { state: 'SUPERSEDED' }))); } catch (e) { /* noop */ }
    V.s.saved = { at: new Date().toISOString(), todo_ids: [...ids] }; store(V.s);
    return { ok: true, n };
  }
  function build() {
    const s = V.s; const p = plan(s);
    const ready = p.books.filter(b => b.range_text).length;
    return `<section class="screen warm parent">
      <div class="top"><button class="back" data-p="close" aria-label="닫기">‹</button><h1>보호자 · 재능 숙제</h1></div>
      <div class="grow" style="overflow-y:auto">
        <p class="pa-week">${md(p.source_date)} 받은 숙제 · ${md(p.deadline)}까지 · 연습일 ${p.days.length}일</p>
        <p class="pa-help">책마다 사진을 찍고, 사진을 보며 범위를 적어 주세요. 예: 21~26쪽, 3~5회</p>
        ${BOOKS.map(b => { const v = s.books[b.key] || {}; const bp = p.books.find(x => x.key === b.key); return `<div class="card pa-book" data-book="${b.key}">
          <div class="pa-head"><b>${esc(b.subject)}</b><label class="pa-cam"><input type="file" accept="image/*" capture="environment" multiple data-photo="${b.key}" hidden>사진 찍기</label></div>
          <div class="pa-thumbs" data-thumbs="${b.key}">${(v.photos || []).map(id => `<button class="pa-th" data-view="${id}" aria-label="사진 크게 보기"><img alt="" data-ph="${id}"></button>`).join('')}</div>
          <div class="pa-row"><input class="field" data-range="${b.key}" value="${esc(v.range || '')}" placeholder="범위 (예: 21~26쪽)" maxlength="30" enterkeyhint="next">
            <select class="field pa-n" data-sessions="${b.key}" aria-label="나눌 횟수">${['', 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${String(v.sessions || '') === String(n) ? 'selected' : ''}>${n ? n + '번에' : '매일'}</option>`).join('')}</select></div>
          ${b.key === 'hanja' ? `<input class="field pa-hanja" data-chars="hanja" value="${esc(v.chars || '')}" placeholder="이번 주 한자 (예: 日月火水木)" maxlength="80">
            <div data-dyn="note"><p class="pa-note">${p.hanja.chars.length ? `한자 ${p.hanja.chars.length}자 · 숨바꼭질에서 이번 주 구간으로 연습해요` : '적어 두면 숨바꼭질에서 이번 주 한자만 연습해요'}</p></div>` : ''}
          <div data-dyn="parts-${b.key}">${bp.parts.length ? `<p class="pa-parts">${bp.parts.map(x => `${md(x.date)} ${esc(x.label.replace('재능 ' + b.subject + ' · ', ''))}`).join(' · ')}</p>` : ''}</div>
        </div>`; }).join('')}
        <div class="card pa-sum" data-dyn="sum"><b>주간 플래너 미리보기</b>${p.days.map(d => { const l = p.books.flatMap(b => b.parts.filter(x => x.date === d)); return `<div class="pa-day"><small>${md(d)}</small><span>${l.length ? l.map(x => esc(x.label.replace('재능 ', ''))).join(', ') : '<i>쉬는 날</i>'}</span></div>`; }).join('')}</div>
      </div>
      <div class="pa-foot" data-dyn="foot">${V.msg ? `<p class="pa-msg" role="status">${esc(V.msg)}</p>` : ''}<button class="btn-y" data-p="save" ${ready && !V.busy ? '' : 'disabled'}>${V.busy ? '넣는 중…' : s.saved ? '다시 나눠서 플래너에 넣기' : `플래너에 넣기 (${ready}권)`}</button></div>
      ${V.view ? `<div class="pa-view" data-p="unview"><img alt="숙제 사진" data-ph="${V.view}"><button class="pa-del" data-del="${V.view}">이 사진 지우기</button></div>` : ''}
    </section>`;
  }
  function render() {
    if (!V.el) return; const sc = V.el.querySelector('.grow'); const y = sc ? sc.scrollTop : 0;
    V.el.innerHTML = build(); const sc2 = V.el.querySelector('.grow'); if (sc2) sc2.scrollTop = y;
    V.el.querySelectorAll('img[data-ph]').forEach(async im => { const b = await photoGet(im.dataset.ph); if (b) im.src = URL.createObjectURL(b); });
  }
  function set(key, field, value) { const b = V.s.books[key] = V.s.books[key] || {}; b[field] = value; store(V.s); }
  async function onClick(e) {
    const t = e.target.closest('[data-p],[data-view],[data-del]'); if (!t) return;
    if (t.dataset.del) { e.stopPropagation(); const id = t.dataset.del; Object.values(V.s.books).forEach(b => { if (b.photos) b.photos = b.photos.filter(x => x !== id); }); store(V.s); await photoDel(id); V.view = null; return render(); }
    if (t.dataset.view) { V.view = t.dataset.view; return render(); }
    const a = t.dataset.p;
    if (a === 'unview') { V.view = null; return render(); }
    if (a === 'close') return close();
    if (a === 'save') {
      if (V.busy) return; V.busy = true; V.msg = ''; render();
      const p = plan(V.s); const r = toPlanner(p);
      let c = { ok: false, state: 'NOT_JOINED' }; if (r.ok) c = await publish(p);
      V.busy = false;
      V.msg = !r.ok ? '플래너를 찾지 못했어요. 앱을 다시 열어 주세요.'
        : `플래너에 ${r.n}개 넣었어요. ` + (c.ok ? (p.hanja.chars.length ? `이번 주 한자 ${p.hanja.chars.length}자를 숨바꼭질에 보냈어요.` : '탐험본부에도 이번 주 숙제를 보냈어요.')
          : c.state === 'NOT_JOINED' ? '가족 탐험대에 합류하면 숨바꼭질에도 이번 주 한자가 가요.' : `숨바꼭질로는 아직 못 보냈어요 (${c.state}). 다시 눌러 주세요.`);
      render(); root.dispatchEvent(new Event('rs-planner-changed'));
    }
  }
  function onInput(e) {
    const x = e.target;
    if (x.dataset.range) { set(x.dataset.range, 'range', x.value); refreshParts(); }
    else if (x.dataset.chars) { set('hanja', 'chars', x.value); refreshParts(); }
  }
  // Typing must not re-render the field under the finger (keeps focus and the iOS keyboard).
  let tm = 0; function refreshParts() { clearTimeout(tm); tm = setTimeout(() => {
    const t = document.createElement('div'); t.innerHTML = build();
    t.querySelectorAll('[data-dyn]').forEach(n => { const o = V.el.querySelector(`[data-dyn="${n.dataset.dyn}"]`); if (o) o.innerHTML = n.innerHTML; }); }, 250); }
  async function onChange(e) {
    const x = e.target;
    if (x.dataset.sessions) { set(x.dataset.sessions, 'sessions', x.value ? +x.value : null); return render(); }
    if (x.dataset.photo && x.files && x.files.length) {
      const key = x.dataset.photo; const b = V.s.books[key] = V.s.books[key] || {}; b.photos = b.photos || [];
      for (const f of Array.from(x.files).slice(0, 6)) { const id = `${V.s.week.week_id}:${key}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; if (await photoPut(id, await shrink(f))) b.photos.push(id); }
      store(V.s); render();
    }
  }
  function open() {
    V.s = load(); V.msg = ''; V.view = null;
    if (!V.el) { V.el = document.createElement('div'); V.el.id = 'rsParent'; V.el.setAttribute('role', 'dialog'); V.el.setAttribute('aria-label', '보호자 화면');
      V.el.addEventListener('click', onClick); V.el.addEventListener('input', onInput); V.el.addEventListener('change', onChange); document.body.appendChild(V.el); }
    V.el.hidden = false; document.documentElement.classList.add('parent-open'); render();
  }
  function close() { if (V.el) V.el.hidden = true; document.documentElement.classList.remove('parent-open'); root.dispatchEvent(new Event('rs-parent-closed')); }

  // Entry: press and hold "보호자 화면" for 1.2s (a tap from the child does nothing).
  function bindHold() {
    let timer = 0, btn = null;
    const stop = () => { clearTimeout(timer); if (btn) btn.classList.remove('holding'); btn = null; };
    document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('[data-parent-hold]'); if (!b) return;
      btn = b; b.classList.add('holding'); timer = setTimeout(() => { stop(); open(); }, 1200); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => document.addEventListener(n, e => { if (btn && (n !== 'pointerleave' || e.target === btn)) stop(); }, true));
    document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('[data-parent-hold]')) e.preventDefault(); });
  }
  if (root.document) bindHold();
  root.RsParent = Object.freeze({ open, close, BOOKS, SCHEMA, CURRENT_ID, weekOf, daysFor, parseRange, splitBook, hanjaChars, plan });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RsParent;
})(typeof globalThis !== 'undefined' ? globalThis : this);
