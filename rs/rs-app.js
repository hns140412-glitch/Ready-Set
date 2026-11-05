/* Ready & Set — approved-design rebuild 2026-11-05
   Visual authority: Drive READY_HOME_MASTER_APPROVED.png (10/06), Focus Phone+Tablet Golden REV_01.
   Logic authority: Ready_Set_Ui_Master_Logic_REV_06 (+ share golden vocabulary: 탐험).
   Self-selected tasks (재능/학교/영어) start a session without a Planner assignment (Taky 2026-11-05). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const CREW = window.RSCrew;
  const KEY = 'rs2:state:v1';
  const CATS = {
    재능: { sub: '개인 학습 과제', items: ['국어', '한자', '피자', '수학', '연산', '기타'] },
    학교: { sub: '과제', items: ['독서', '글쓰기', '숙제', '준비물', '기타'] },
    영어: { sub: '학습', items: ['라이팅', '문장 녹음', '단어 외우기', '기타'] }
  };
  const BGMS = [['off', '끔'], ['lofi', '로파이'], ['nature', '자연'], ['piano', '피아노'], ['water', '물소리']];
  const TIMES = [10, 15, 25];
  const REASONS = ['화장실', '물·간식', '준비물', '도움 필요', '컨디션', '기타'];
  const MOODS = [
    { id: 'excited', t: '신나요', e: 'up', c: '#ffb020', k: ['활력', '에너지', '도전', '행동', '즐거움'] },
    { id: 'calm', t: '차분해요', e: 'calm', c: '#5bb98c', k: ['차분함', '여유', '안정감'] },
    { id: 'sure', t: '자신있어요', e: 'up', c: '#ef6b45', k: ['도전', '리더십', '탐험'] },
    { id: 'curious', t: '궁금해요', e: 'mid', c: '#5a8de8', k: ['호기심', '탐색', '발견', '관찰'] },
    { id: 'worried', t: '걱정돼요', e: 'low', c: '#9b7be0', k: ['다정함', '공감', '치유', '응원', '배려'] },
    { id: 'sleepy', t: '졸려요', e: 'low', c: '#7b8794', k: ['에너지', '활기', '놀이'] },
    { id: 'tired', t: '지쳤어요', e: 'low', c: '#b08968', k: ['다정함', '여유', '챙김'] },
    { id: 'meh', t: '귀찮아요', e: 'low', c: '#d0769a', k: ['실행', '장난기', '즐거움'] }
  ];
  // System-chosen 3rd card: a strategy that differs from the two feelings the child picked.
  const SYS_CARDS = {
    small: { t: '첫 5분만', d: '딱 5분만 해보고 다시 정하기', ic: 'timer' },
    easy: { t: '쉬운 것부터', d: '제일 쉬운 것 하나로 시작', ic: 'step' },
    hard: { t: '어려운 것부터', d: '힘 있을 때 어려운 것 먼저', ic: 'peak' },
    quiet: { t: '조용히 집중', d: '음악 끄고 한 가지에만', ic: 'mute' },
    note: { t: '궁금한 것 한 줄', d: '끝나고 궁금한 걸 하나 적기', ic: 'pen' },
    water: { t: '물 한 컵 먼저', d: '시작 전에 물 한 컵, 기지개', ic: 'drop' }
  };

  /* ---------------- state ---------------- */
  const blank = () => ({
    profile: null, // {name, nickname, guide, theme, voice, recPrefix}
    curCat: '재능',
    plan: { tasks: [], target: 25, custom: '', bgm: 'lofi', moods: [], sys: null },
    session: null,
    records: [],
    guestHistory: [],
    result: null
  });
  let S = load();
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') return Object.assign(blank(), v); } catch (e) { /* ignore */ }
    return blank();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }

  const UI = { screen: null, ov: null, sheetCat: null, sheetSel: [], obPage: 0, obEdit: false, calMonth: null, calSel: null, rec: { phase: 'ready', takes: [], sel: -1 }, share: null };
  function go(screen, opts) { if (screen !== UI.screen) { const t = $('#toast'); if (t) t.classList.remove('on'); } UI.screen = screen; UI.ov = null; Object.assign(UI, opts || {}); render(); }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return pad(Math.floor(t / 60)) + ':' + pad(t % 60); };
  const hhmm = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const ymd = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const guide = () => CREW.get(S.profile && S.profile.guide);
  const shareName = p => p && p.nickname ? (p.name ? `${p.nickname}(${p.name})` : p.nickname) : '';
  function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms); }
  const targetMin = () => { const p = S.plan; const c = parseInt(p.custom, 10); return p.target === 'custom' ? (c > 0 ? Math.min(c, 180) : 0) : p.target; };
  const josa = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };
  const taskLabel = t => t.cat + ' · ' + t.item + (t.detail ? ' · ' + t.detail : '');

  /* ---------------- icons ---------------- */
  const I = {
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><circle cx="11" cy="13" r="1" fill="currentColor"/><path d="M15 9l5-5M17 4h3v3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5" stroke-linecap="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5V6h6V3.5M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.6 2.3 2.7-.6.8 2.6 2.6.8-.6 2.7 2.3 1.6-2.3 1.6.6 2.7-2.6.8-.8 2.6-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.8-2.6-2.6-.8.6-2.7L2.6 12l2.3-1.6-.6-2.7 2.6-.8.8-2.6 2.7.6z" stroke-linejoin="round"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 17.5V5.5l11-2v12"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/><path d="M9 5.5l11-2v3l-11 2z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5v13"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '+',
    // mood faces
    face: (e, c) => {
      const mouth = e === 'up' ? 'M11 25q7 7 14 0' : e === 'calm' ? 'M12 25q6 3 12 0' : e === 'mid' ? 'M13 26h10' : 'M12 28q6-5 12 0';
      const eyes = e === 'calm' ? '<path d="M11 16q2.5 2 5 0M20 16q2.5 2 5 0" stroke="#2a1a14" stroke-width="2.2" fill="none" stroke-linecap="round"/>' : '<circle cx="13.5" cy="16" r="2.4" fill="#2a1a14"/><circle cx="22.5" cy="16" r="2.4" fill="#2a1a14"/>';
      return `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16.5" fill="${c}" opacity=".22"/><circle cx="18" cy="18" r="13.5" fill="${c}"/>${eyes}<path d="${mouth}" stroke="#2a1a14" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;
    },
    sys: k => ({
      timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
      step: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 20h5v-5h5v-5h5V5h3"/></svg>',
      peak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 20l7-12 4 6 3-4 6 10z"/></svg>',
      mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/></svg>',
      pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>',
      drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s7 7 7 12a7 7 0 01-14 0c0-5 7-12 7-12z"/></svg>'
    }[k]),
    sail: '<svg viewBox="0 0 48 48" fill="none" stroke="#ef6b45" stroke-width="2.4" stroke-linejoin="round"><path d="M24 6v26M24 8l13 22H24M24 12L13 30h11"/><path d="M8 34h32l-4 6H12z" fill="#fbd9c7"/><path d="M4 44q5-3 10 0t10 0 10 0 10 0" stroke-linecap="round"/></svg>',
    chute: '<svg viewBox="0 0 48 48" fill="none" stroke="#ef6b45" stroke-width="2.4" stroke-linejoin="round"><path d="M6 20a18 14 0 0136 0z" fill="#fbd9c7"/><path d="M6 20l15 16M42 20L27 36M18 20l5 16M30 20l-5 16"/><rect x="20" y="35" width="8" height="7" rx="2"/><path d="M4 46h40" stroke-linecap="round"/></svg>'
  };

  /* ---------------- audio: BGM / voice / chime ---------------- */
  const AUD = { bgm: null, bgmKey: null, voice: null, ctx: null };
  function bgmPlay(key, fade = true) {
    if (!key || key === 'off') return bgmStop();
    if (AUD.bgm && AUD.bgmKey === key) { AUD.bgm.play().catch(() => {}); if (fade) fadeTo(AUD.bgm, .55); return; }
    bgmStop(false);
    const a = new Audio(`assets/bgm-${key}.wav`); a.loop = true; a.volume = fade ? 0 : .55; a.preload = 'auto';
    AUD.bgm = a; AUD.bgmKey = key;
    a.play().then(() => fade && fadeTo(a, .55)).catch(() => toast('음악은 화면을 한 번 누르면 재생돼요'));
  }
  function bgmStop(fade = true) {
    const a = AUD.bgm; if (!a) return;
    if (fade) fadeTo(a, 0, () => a.pause()); else a.pause();
  }
  function bgmPause() { const a = AUD.bgm; if (a) fadeTo(a, 0, () => a.pause()); }
  function fadeTo(a, v, done) {
    clearInterval(a._f); const step = (v - a.volume) / 12;
    a._f = setInterval(() => { const n = a.volume + step; if ((step >= 0 && n >= v) || (step < 0 && n <= v) || step === 0) { a.volume = Math.max(0, Math.min(1, v)); clearInterval(a._f); done && done(); } else a.volume = Math.max(0, Math.min(1, n)); }, 40);
  }
  function playVoice(c) {
    if (!S.profile || S.profile.voice === false || !c) return;
    try { if (AUD.voice) AUD.voice.pause(); } catch (e) { /* noop */ }
    const v = new Audio(c.voice); AUD.voice = v;
    const b = AUD.bgm; const duck = b && !b.paused; if (duck) b.volume = .12;
    v.onended = v.onerror = () => { if (duck && AUD.bgm === b && !b.paused) fadeTo(b, .55); };
    v.play().catch(() => {});
  }
  function chime() {
    try {
      const ctx = AUD.ctx || (AUD.ctx = new (window.AudioContext || window.webkitAudioContext)());
      ctx.resume && ctx.resume();
      [0, .22, .44].forEach((t, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = [880, 1046.5, 1318.5][i];
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.35, ctx.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + .5);
        o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .55);
      });
    } catch (e) { /* no audio */ }
    try { navigator.vibrate && navigator.vibrate([180, 90, 180]); } catch (e) { /* noop */ }
  }
  // Unlock audio on first gesture (iOS)
  document.addEventListener('pointerdown', () => { if (!AUD.ctx) { try { AUD.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* noop */ } } }, { once: true });

  /* ---------------- session timing (timestamp-derived, REV06 §17) ---------------- */
  function pausedMs(s, now) { let t = 0; for (const p of s.pauses) t += (p.e || now) - p.s; return t; }
  function focusMs(s, now = Date.now()) { const end = s.endAt || now; return Math.max(0, end - s.startAt - pausedMs(s, end)); }
  function startSession() {
    const p = S.plan; const min = targetMin();
    if (!p.tasks.length) { toast('먼저 오늘 할 탐험을 골라요'); return go('setup1'); }
    if (!min) { toast('목표 시간을 정해요'); return go('setup1'); }
    S.session = {
      id: uid('ses'), startAt: Date.now(), targetMs: min * 60000, pauses: [], bgm: p.bgm, bgmOn: p.bgm !== 'off', alerted: false,
      tasks: p.tasks.map(t => Object.assign({}, t, { outcome: null })), moods: p.moods.slice(), sys: p.sys, recDone: false, recFile: null, guest: null
    };
    save(); go('focus');
    if (S.session.bgmOn) bgmPlay(S.session.bgm);
    setTimeout(() => playVoice(guide()), 400);
  }
  function isPaused(s) { const l = s.pauses[s.pauses.length - 1]; return !!(l && !l.e); }
  function pauseNow() { const s = S.session; if (!s || isPaused(s)) return; s.pauses.push({ s: Date.now(), e: 0, reason: '' }); save(); bgmPause(); UI.ov = 'pause'; render(); }
  function resume() { const s = S.session; if (!s) return; const l = s.pauses[s.pauses.length - 1]; if (l && !l.e) l.e = Date.now(); save(); UI.ov = null; render(); if (s.bgmOn) bgmPlay(s.bgm); }
  function finalize() {
    const s = S.session; if (!s || s.endAt) return; // exactly one finalization path
    const l = s.pauses[s.pauses.length - 1]; const now = Date.now(); if (l && !l.e) l.e = now;
    s.endAt = now;
    s.tasks.forEach(t => { if (!t.outcome) t.outcome = 'COMPLETED'; });
    const f = focusMs(s);
    const rec = {
      id: s.id, startAt: s.startAt, endAt: s.endAt, targetMs: s.targetMs, focusMs: f, pausedMs: pausedMs(s, now), pauseCount: s.pauses.length,
      tasks: s.tasks.map(t => ({ cat: t.cat, item: t.item, detail: t.detail, outcome: t.outcome })), moods: s.moods, sys: s.sys, recDone: s.recDone, recFile: s.recFile, guide: S.profile.guide
    };
    rec.state = reaction(rec);
    S.records.unshift(rec); S.records = S.records.slice(0, 400); S.result = rec.id; S.session = null; save(); // local save before any share
    bgmStop(); cleanupMic();
    go('result');
    setTimeout(() => playVoice(guide()), 500);
  }
  function reaction(r) {
    const done = r.tasks.filter(t => t.outcome === 'COMPLETED').length;
    if (!done) return 'STOPPED';
    if (done < r.tasks.length) return 'PARTIAL_COMPLETE';
    if (r.pauseCount >= 3 || r.pausedMs >= 5 * 60000) return 'INTERRUPTED_BUT_COMPLETE';
    if (r.focusMs <= r.targetMs * .85) return 'EXCELLENT_FLOW';
    if (r.focusMs <= r.targetMs) return 'ON_TARGET';
    return 'OVERTIME_COMPLETE';
  }
  const REACT = {
    EXCELLENT_FLOW: ['엣헴~! 오늘 좀 했습니다.', '목표보다 빨리 끝!', '시계보다 먼저 돌아왔네!'],
    ON_TARGET: ['오? 계산대로인데?', '정한 시간 안에 탐험 완료!', '딱 정한 만큼, 해냈어.'],
    OVERTIME_COMPLETE: ['헤헤… 조금 늦었습니다.', '그래도 탐험 완료!', '시간이 좀 걸려도 끝까지 간 게 중요해.'],
    INTERRUPTED_BUT_COMPLETE: ['오늘은 사건이 좀 많았습니다.', '그래도 탐험 완료!', '이런저런 일이 있었지만… 결국 다시 돌아와서 끝냈어.'],
    PARTIAL_COMPLETE: ['오늘 탐험은 여기까지.', '해낸 만큼 기록했어요', '남은 건 다음에 조금 더 가볍게 시작해보자.'],
    STOPPED: ['오늘 탐험은 여기까지.', '기록은 남겨둘게요', '다음에는 조금 더 가볍게 시작해보자.']
  };

  /* ---------------- mood → system card / guest pick ---------------- */
  function sysCardFor(ids) {
    const m = ids.map(id => MOODS.find(x => x.id === id)).filter(Boolean);
    const low = m.filter(x => x.e === 'low').length, up = m.filter(x => x.e === 'up').length;
    if (ids.includes('worried')) return 'easy';
    if (low === 2) return 'small';
    if (ids.includes('sleepy') || ids.includes('tired')) return 'water';
    if (up === 2) return 'hard';
    if (ids.includes('curious')) return 'note';
    if (ids.includes('meh')) return 'small';
    return 'quiet';
  }
  function pickGuest(mainId, moods) {
    const recent = S.guestHistory.slice(-2);
    const want = new Set(moods.flatMap(id => (MOODS.find(m => m.id === id) || { k: [] }).k));
    const pool = CREW.all.filter(c => c.id !== mainId && !recent.includes(c.id));
    const w = pool.map(c => 1 + 2 * c.keywords.filter(k => want.has(k)).length);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    let g = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { g = pool[i]; break; } }
    S.guestHistory.push(g.id); S.guestHistory = S.guestHistory.slice(-6); save();
    return g;
  }

  /* ---------------- recording (REV06 §20-38) ---------------- */
  const MIC = { stream: null, rec: null, chunks: [], t0: 0, busy: false, raf: 0, an: null };
  function cleanupMic() {
    try { if (MIC.rec && MIC.rec.state !== 'inactive') MIC.rec.stop(); } catch (e) { /* noop */ }
    if (MIC.stream) MIC.stream.getTracks().forEach(t => t.stop());
    MIC.stream = null; cancelAnimationFrame(MIC.raf);
  }
  async function recStart() {
    if (MIC.busy || (MIC.rec && MIC.rec.state === 'recording')) return; // double-tap guard
    MIC.busy = true;
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      MIC.stream = stream;
      const types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mt = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined);
      MIC.rec = rec; MIC.chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) MIC.chunks.push(e.data); };
      rec.onstop = () => {
        const type = (rec.mimeType || mt || 'audio/webm').split(';')[0];
        const blob = new Blob(MIC.chunks, { type });
        const dur = Date.now() - MIC.t0;
        if (MIC.stream) MIC.stream.getTracks().forEach(t => t.stop()); MIC.stream = null;
        if (blob.size > 0) { UI.rec.takes.push({ blob, url: URL.createObjectURL(blob), type, dur }); UI.rec.sel = UI.rec.takes.length - 1; }
        UI.rec.phase = UI.rec.takes.length ? 'review' : 'ready';
        if (UI.screen === 'record') render();
      };
      MIC.t0 = Date.now(); rec.start(250);
      UI.rec.phase = 'recording'; render(); drawWave(stream);
    } catch (e) {
      cleanupMic();
      toast(e && e.name === 'NotAllowedError' ? '마이크 권한이 필요해요. 설정에서 허용해 주세요.' : '이 기기에서는 녹음을 시작할 수 없어요.', 3200);
    } finally { MIC.busy = false; }
  }
  function recStop() { if (MIC.rec && MIC.rec.state === 'recording') MIC.rec.stop(); cancelAnimationFrame(MIC.raf); }
  function drawWave(stream) {
    try {
      const ctx = AUD.ctx || (AUD.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => {
        const cv = $('#wave'); const tm = $('#recTime');
        if (tm) tm.textContent = 'REC ' + mmss(Date.now() - MIC.t0);
        if (cv) {
          const w = cv.width = cv.clientWidth * 2, h = cv.height = cv.clientHeight * 2, g = cv.getContext('2d');
          an.getByteTimeDomainData(buf); g.clearRect(0, 0, w, h); g.lineWidth = 4; g.strokeStyle = '#ff3b30'; g.beginPath();
          for (let i = 0; i < buf.length; i++) { const x = i / (buf.length - 1) * w, y = (buf[i] / 255) * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
        }
        MIC.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { /* waveform optional */ }
  }
  function recFileName(take) {
    const d = new Date(); const p = (S.profile.recPrefix || `${S.profile.nickname}'s English`).trim();
    const ext = /mp4|m4a|aac/.test(take.type) ? 'm4a' : /webm/.test(take.type) ? 'webm' : /ogg/.test(take.type) ? 'ogg' : 'audio';
    return `${p} recording ${d.getFullYear()} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}.${ext}`;
  }
  async function shareFile(file, text) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return 'shared'; }
    } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('파일로 저장했어요'); return 'saved';
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && MIC.rec && MIC.rec.state === 'recording') recStop(); });
  window.addEventListener('pagehide', () => cleanupMic());

  /* ---------------- share card renderer (REV06 §44, Share Golden) ---------------- */
  function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
  function wrap(g, text, x, y, maxW, lh, maxLines = 3) {
    const words = String(text).split(''); let line = '', n = 0;
    for (const ch of words) { const t = line + ch; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = ch; if (++n >= maxLines - 1) { } } else line = t; }
    g.fillText(line, x, y); return y + lh;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  async function renderCard(kind, data) {
    const W = 1080, H = 1080, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const F = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f9c3a6'); bg.addColorStop(.55, '#fde3d4'); bg.addColorStop(1, '#fff4ec');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // theme motif (profile theme, no picker at share time)
    g.save(); g.globalAlpha = .18; g.strokeStyle = '#ef6b45'; g.lineWidth = 6;
    if (S.profile.theme === '낙하') { g.beginPath(); g.arc(880, 210, 120, Math.PI, 0); g.stroke(); [[760, 210, 850, 330], [1000, 210, 910, 330], [840, 210, 870, 330], [920, 210, 890, 330]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); }); }
    else { for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, 1010 - k * 26 + Math.sin(x / 40) * 10); g.stroke(); } }
    g.restore();
    g.fillStyle = '#8a4a30'; g.font = `800 30px ${F}`; g.fillText('READY & SET', 80, 110);
    g.fillStyle = '#4a2214'; g.font = `900 66px ${F}`;
    g.fillText(kind === 'pre' ? '탐험 시작 전, 응원 요청!' : data.head, 80, 200);
    g.font = `700 34px ${F}`; g.fillStyle = '#ef6b45'; g.fillText(shareName(S.profile) + (kind === 'pre' ? '의 오늘의 탐험' : '의 탐험 기록'), 80, 258);
    // info box
    g.fillStyle = 'rgba(255,255,255,.9)'; rr(g, 60, 300, W - 120, 430, 40); g.fill();
    g.fillStyle = '#8a6a5c'; g.font = `700 30px ${F}`; g.fillText('오늘의 탐험', 110, 365);
    g.fillStyle = '#2a1a14'; g.font = `800 40px ${F}`;
    let y = 420; data.tasks.slice(0, 3).forEach(t => { g.fillText((t.mark || '•') + ' ' + t.text, 110, y); y += 56; });
    if (data.tasks.length > 3) { g.font = `700 30px ${F}`; g.fillStyle = '#8a6a5c'; g.fillText(`외 ${data.tasks.length - 3}개`, 110, y); y += 46; }
    g.fillStyle = '#f0d8cb'; g.fillRect(110, 600, W - 220, 3);
    const cols = data.stats; const cw = (W - 220) / cols.length;
    cols.forEach((c, i) => { g.fillStyle = '#8a6a5c'; g.font = `700 28px ${F}`; g.fillText(c[0], 110 + i * cw, 650); g.fillStyle = c[2] || '#2a1a14'; g.font = `900 46px ${F}`; g.fillText(c[1], 110 + i * cw, 705); });
    // guide
    const gd = guide(); const im = await loadImg(gd.face);
    g.save(); g.beginPath(); g.arc(170, 880, 100, 0, Math.PI * 2); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.clip(); if (im) g.drawImage(im, 70, 780, 200, 200); g.restore();
    g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.arc(170, 880, 100, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; rr(g, 300, 790, W - 360, 170, 36); g.fill();
    g.fillStyle = '#ef6b45'; g.font = `800 28px ${F}`; g.fillText(gd.name, 336, 835);
    g.fillStyle = '#2a1a14'; g.font = `700 34px ${F}`; wrap(g, data.say, 336, 882, W - 430, 44, 2);
    g.fillStyle = '#8a6a5c'; g.font = `700 28px ${F}`; g.fillText(data.date, W - 80 - g.measureText(data.date).width, 1040);
    return new Promise(r => cv.toBlob(b => r(b), 'image/png'));
  }
  async function openShare(kind, rec) {
    const p = S.plan; let data, caption;
    if (kind === 'pre') {
      const min = targetMin();
      data = { tasks: p.tasks.map(t => ({ text: taskLabel(t) })), stats: [['목표 시간', `${min}분`], ['길잡이', guide().name]], say: '준비는 끝났는데 말이죠… 응원 보급이 조금 필요합니다~!', date: ymd(Date.now()).replace(/-/g, '.') };
      caption = `${shareName(S.profile)}, ${min}분 탐험 출발합니다. 응원 한 스푼 부탁해요!`;
    } else {
      const R = REACT[rec.state]; const save = rec.targetMs - rec.focusMs;
      const mark = { COMPLETED: '✓', PARTIAL: '△', DEFERRED: '→' };
      data = { head: R[0], tasks: rec.tasks.map(t => ({ mark: mark[t.outcome] || '•', text: taskLabel(t) })), stats: [['목표', mmss(rec.targetMs)], ['집중', mmss(rec.focusMs)]].concat(save > 0 && rec.state !== 'STOPPED' ? [['TIME SAVE', mmss(save), '#ef6b45']] : []), say: R[2], date: ymd(rec.endAt).replace(/-/g, '.') };
      caption = `${shareName(S.profile)}의 탐험 기록: ${R[0]} 집중 ${mmss(rec.focusMs)} / 목표 ${mmss(rec.targetMs)}`;
    }
    UI.share = { kind, caption, url: null, file: null }; UI.ov = 'share'; render();
    try {
      const blob = await renderCard(kind, data);
      const file = new File([blob], kind === 'pre' ? 'ready-set-start.png' : 'ready-set-record.png', { type: 'image/png' });
      if (UI.share) { UI.share.file = file; UI.share.url = URL.createObjectURL(blob); render(); }
    } catch (e) { if (UI.share) { UI.share.err = true; render(); } }
  }
  async function doShare() {
    const sh = UI.share; if (!sh) return;
    try {
      if (sh.file && navigator.canShare && navigator.canShare({ files: [sh.file] })) { await navigator.share({ files: [sh.file], text: sh.caption }); return; }
      if (navigator.share) { await navigator.share({ text: sh.caption }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    if (sh.file) await shareFile(sh.file, sh.caption);
    try { await navigator.clipboard.writeText(sh.caption); toast('문구도 복사했어요'); } catch (e) { /* noop */ }
  }

  /* ---------------- views ---------------- */
  function vHome() {
    const p = S.plan; const sel = c => p.tasks.filter(t => t.cat === c).length;
    const min = targetMin() || 25;
    return `<section class="screen home">
      <div class="home-hero">
        <img class="hero-bg" src="rs/home-hero.webp" alt="FOCUS CHALLENGE 타임어택 이벤트 — 목표를 정하고, 집중의 시간을 시작해보세요!">
        <div class="face" aria-label="목표 시간 ${min}분"><small>TARGET TIME</small><b>${pad(min)}:00</b><i></i><em>목표 ${min}분</em></div>
        <button class="stat-btn" data-act="nav" data-to="history" aria-label="기록 보기"></button>
      </div>
      <div class="home-body">
        <div class="menu-card">
          <button class="menu-row" data-act="goSetup"><span class="ico">${I.target}</span><span class="t"><b>오늘 목표 정하기</b><span>${p.tasks.length ? esc(p.tasks.map(t => t.item).join(' · ')) + ` · ${min}분` : '효과적인 목표 설정으로 시작해요'}</span></span><span class="chev">${I.chev}</span></button>
          <button class="menu-row" data-act="preShare"><span class="ico">${I.chat}</span><span class="t"><b>시작 전 작전 공유</b><span>부모님께 오늘의 계획을 알려드려요</span></span><span class="chev">${I.chev}</span></button>
          <button class="menu-row" data-act="nav" data-to="history"><span class="ico">${I.cal}</span><span class="t"><b>기록 및 캘린더</b><span>시작부터 완료까지 실제 시간대로 남겨요</span></span><span class="chev">${I.chev}</span></button>
        </div>
        <div class="cat-card">
          <h2>어떤 과제에 도전할까요?</h2>
          <div class="cat-row">${Object.keys(CATS).map(c => `<button class="cat ${S.curCat === c ? 'on' : ''}" data-act="cat" data-cat="${c}"><b>${c}</b><span>${CATS[c].sub}</span>${sel(c) ? `<em class="cnt">${sel(c)}</em>` : ''}</button>`).join('')}</div>
        </div>
      </div>
      ${vNav('home')}
    </section>`;
  }
  function vNav(on) {
    const b = (k, ic, t) => `<button class="${on === k ? 'on' : ''}" data-act="nav" data-to="${k}" aria-current="${on === k}">${ic}<span>${t}</span></button>`;
    return `<nav class="nav">${b('home', I.home, '홈')}${b('history', I.log, '기록')}${b('calendar', I.cal, '캘린더')}${b('settings', I.gear, '설정')}</nav>`;
  }
  function vSheet() {
    const c = UI.sheetCat; const cur = UI.sheetSel;
    return `<div class="dim" data-act="sheetClose"><div class="sheet" data-stop>
      <div class="grab"></div><h3>${c}</h3><p>여러 개 골라도 돼요. 타이머는 하나로 같이 가요.</p>
      <div class="opt-grid">${CATS[c].items.map(it => `<button class="opt ${cur.includes(it) ? 'on' : ''}" data-act="opt" data-it="${it}" aria-pressed="${cur.includes(it)}">${it}</button>`).join('')}</div>
      <button class="cta" data-act="sheetDone">${cur.length ? `${cur.length}개 담기` : '닫기'}</button>
    </div></div>`;
  }
  function vSetup1() {
    const p = S.plan; const min = targetMin();
    return `<section class="screen warm">
      <div class="top"><button class="back" data-act="nav" data-to="home" aria-label="뒤로">${I.back}</button><h1>오늘 목표 정하기</h1><span class="step">1 / 3</span></div>
      <h2 class="page-title">오늘, 뭐부터 해볼까?</h2>
      <div class="grow">
        <div class="card" style="flex:0 1 auto;min-height:0;display:flex;flex-direction:column">
          <p class="label">오늘의 탐험 <small>${p.tasks.length}개</small></p>
          <div class="task-list" style="flex:1 1 auto;min-height:0;overflow-y:auto">${p.tasks.length ? p.tasks.map(t => `<div class="task-item"><span class="tag">${t.cat} · ${esc(t.item)}</span><input class="field" data-detail="${t.id}" value="${esc(t.detail)}" placeholder="무엇을? 예: 20문제" maxlength="30" enterkeyhint="done"><button class="x" data-act="delTask" data-id="${t.id}" aria-label="${esc(t.item)} 빼기">${I.x}</button></div>`).join('') : '<p class="hint" style="margin:8px 0 10px">아래에서 과제를 골라 담아요</p>'}</div>
          <div class="add-row" style="margin-top:8px">${Object.keys(CATS).map(c => `<button data-act="cat" data-cat="${c}">+ ${c}</button>`).join('')}</div>
        </div>
        <div class="card"><p class="label">목표 시간 <small>${min ? min + '분' : '정해 주세요'}</small></p>
          <div class="seg">${TIMES.map(t => `<button class="${p.target === t ? 'on' : ''}" data-act="time" data-t="${t}">${t}분</button>`).join('')}<button class="${p.target === 'custom' ? 'on' : ''}" data-act="time" data-t="custom">직접</button></div>
          ${p.target === 'custom' ? `<input class="field" style="margin-top:8px" id="customMin" type="number" inputmode="numeric" min="1" max="180" placeholder="분 단위로 입력 (1~180)" value="${esc(p.custom)}">` : ''}
        </div>
        <div class="card"><p class="label">집중 음악 <small>누르면 미리 들어요</small></p>
          <div class="seg">${BGMS.map(([k, t]) => `<button class="${p.bgm === k ? 'on' : ''}" data-act="bgm" data-k="${k}" style="font-size:13.5px">${t}</button>`).join('')}</div>
        </div>
      </div>
      <button class="cta" style="margin-top:10px" data-act="toSetup2" ${p.tasks.length && min ? '' : 'disabled'}>다음</button>
    </section>`;
  }
  function vSetup2() {
    const p = S.plan; const picks = p.moods;
    const slot = i => { const m = MOODS.find(x => x.id === picks[i]); return m ? `<div class="slot fill">${I.face(m.e, m.c)}<b>${m.t}</b><small>내가 고른 카드</small></div>` : `<div class="slot">${i + 1}번째 기분</div>`; };
    const sc = picks.length === 2 && p.sys ? SYS_CARDS[p.sys] : null;
    return `<section class="screen warm">
      <div class="top"><button class="back" data-act="nav" data-to="setup1" aria-label="뒤로">${I.back}</button><h1>오늘 기분 카드</h1><span class="step">2 / 3</span></div>
      <h2 class="page-title">지금 기분, 두 장 골라요</h2>
      <p class="page-sub">세 번째 카드는 길잡이 ${esc(josa(guide().name, '이', '가'))} 골라줄게요.</p>
      <div class="grow">
        <div class="moods">${MOODS.map(m => { const i = picks.indexOf(m.id); return `<button class="mood ${i >= 0 ? 'on' : ''}" data-n="${i + 1}" data-act="mood" data-id="${m.id}" aria-pressed="${i >= 0}" ${i < 0 && picks.length >= 2 ? 'disabled' : ''}>${I.face(m.e, m.c)}<b>${m.t}</b></button>`; }).join('')}</div>
        <div class="trio">${slot(0)}${slot(1)}${sc ? `<div class="slot sys">${I.sys(sc.ic)}<b>${sc.t}</b><small>${esc(josa(guide().name, '이', '가'))} 고른 카드</small></div>` : '<div class="slot">길잡이 카드</div>'}</div>
        ${sc ? `<div class="guide-say"><img src="${guide().face}" alt="${esc(guide().name)}"><div class="bubble"><small>${esc(guide().name)}</small>${esc(sc.d)}! 오늘은 이렇게 가보자.</div></div>` : ''}
      </div>
      <button class="cta" data-act="toBrief" ${sc ? '' : 'disabled'}>다음</button>
    </section>`;
  }
  const guideScene = g => `<div class="ob-scene g-scene" aria-hidden="true"><div class="ob-rays"></div><img class="g-fig" src="${g.img}" alt=""></div>`;
  function vBrief() {
    const p = S.plan; const g = guide(); const sc = SYS_CARDS[p.sys];
    return `<section class="screen warm">
      <div class="top"><button class="back" data-act="nav" data-to="setup2" aria-label="뒤로">${I.back}</button><h1>탐험 확인</h1><span class="step">3 / 3</span></div>
      <h2 class="page-title">오늘의 탐험, 접수!</h2>
      <div class="grow">
        <div class="card brief">
          <div class="brief-row"><span>탐험</span><b>${p.tasks.map(t => esc(taskLabel(t))).join('<br>')}</b></div>
          <div class="brief-row"><span>목표 시간</span><b>${targetMin()}분</b></div>
          <div class="brief-row"><span>집중 음악</span><b>${BGMS.find(b => b[0] === p.bgm)[1]}</b></div>
          <div class="brief-row"><span>오늘의 카드</span><b>${sc ? sc.t : '-'}</b></div>
        </div>
        ${guideScene(g)}
        <div class="guide-say"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>${esc(g.signature)} 준비됐으면 바로 출발!</div></div>
      </div>
      <div class="cta-row" style="margin-top:10px"><button class="cta ghost" data-act="preShare">응원 요청</button><button class="cta" data-act="start">탐험 시작!</button></div>
    </section>`;
  }
  function clockSVG() {
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? 86 : 89, r2 = 94; ticks += `<line x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}" stroke="#111" stroke-width="${big ? 2.6 : 1.1}" stroke-linecap="round"/>`; }
    for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; nums += `<text x="${100 + 73 * Math.sin(a)}" y="${100 - 73 * Math.cos(a) + 6.5}" text-anchor="middle" font-size="19" font-weight="700" fill="#111" font-family="Pretendard Variable, sans-serif">${h}</text>`; }
    return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="현재 시각 시계">
      <defs><radialGradient id="cf" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".85" stop-color="#fbfaf6"/><stop offset="1" stop-color="#eeebe3"/></radialGradient>
      <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9d4ca"/></linearGradient></defs>
      <circle cx="100" cy="100" r="99" fill="url(#rim)"/><circle cx="100" cy="100" r="95.5" fill="url(#cf)" stroke="#e2ddd2" stroke-width="1"/>
      ${ticks}${nums}
      <text x="100" y="72" text-anchor="middle" font-size="9.5" font-weight="800" fill="#222" font-family="Pretendard Variable, sans-serif">Ready &amp; Set</text>
      <g id="hH"><line x1="100" y1="106" x2="100" y2="55" stroke="#111" stroke-width="6" stroke-linecap="round"/></g>
      <g id="hM"><line x1="100" y1="108" x2="100" y2="30" stroke="#111" stroke-width="4" stroke-linecap="round"/></g>
      <g id="hS"><line x1="100" y1="118" x2="100" y2="22" stroke="#f0b400" stroke-width="1.6" stroke-linecap="round"/></g>
      <circle cx="100" cy="100" r="5.5" fill="#f0b400" stroke="#111" stroke-width="1.5"/>
    </svg>`;
  }
  function vFocus() {
    const s = S.session; const first = s.tasks[0]; const more = s.tasks.length - 1;
    const hasRec = s.tasks.some(t => t.item === '문장 녹음');
    const bgmName = (BGMS.find(b => b[0] === s.bgm) || BGMS[0])[1];
    return `<section class="screen focus">
      <div class="rays"><i style="left:8%;top:14%">★</i><i style="right:12%;top:30%">★</i><i style="left:6%;top:52%">★</i><i style="right:7%;top:56%">★</i><i style="left:14%;top:34%;font-size:12px">★</i></div>
      <div class="stage">
        <button class="music ${s.bgmOn ? '' : 'off'}" data-act="music" aria-label="집중 음악 ${s.bgmOn ? '끄기' : '켜기'}">${I.note}</button>
        <h1 class="headline"><span class="l1">그냥!</span><br>지금 하면 돼!</h1>
        <div class="pill">${I.book}<span>${esc(first.cat)} · ${esc(first.detail || first.item)}${more > 0 ? ` 외 ${more}` : ''}</span></div>
        <div class="clock-wrap">${clockSVG()}<p class="note l">오늘도<br>너는 충분히<br>멋져!</p><p class="note r">집중하는<br>지금이<br>멋진 너야!</p></div>
        <div class="panel">
          <div class="p-top">
            <div class="remain" id="remainBox"><small id="remainLbl">남은 시간</small><b id="remain">--:--</b></div>
            ${hasRec ? `<button class="rec ${s.recDone ? 'done' : ''}" data-act="recIntro" aria-label="문장 녹음${s.recDone ? ' 완료' : ''}"><i></i>${s.recDone ? 'REC ✓' : 'REC'}</button>` : ''}
            <div class="target"><small>목표 시간</small><b>${mmss(s.targetMs)}</b></div>
          </div>
          <div class="p-mid"><span class="m">${I.book}${esc(taskLabel(first))}</span><span class="sep"></span><span class="b">${I.note}<b>${bgmName}</b>${s.bgm === 'off' ? '' : (s.bgmOn ? ' · 재생 중' : ' · 꺼짐')}</span></div>
          ${more > 0 ? `<div class="tasks-mini">${s.tasks.map(t => `<span>${esc(t.item)}${t.detail ? ' · ' + esc(t.detail) : ''}</span>`).join('')}</div>` : ''}
          <div class="p-btns"><button class="pause" data-act="pause">잠깐 멈춤</button><button class="done" data-act="endAsk">완료했어요</button></div>
          <div class="p-stats"><div><small>시작 시간</small><b>${hhmm(s.startAt)}</b></div><div><small>집중 시간</small><b id="focusT">00:00</b></div><div><small>멈춘 시간</small><b id="pauseT">00:00</b></div></div>
        </div>
      </div>
    </section>`;
  }
  function vPauseOv() {
    const s = S.session; const l = s.pauses[s.pauses.length - 1];
    return `<div class="overlay"><div class="pop">
      <h3>잠깐! 탐험 정지</h3><p>시간은 멈춰 있어요. 이유를 골라두면 기록에 남아요.</p>
      <div class="big" id="pauseBig">00:00</div>
      <div class="reasons">${REASONS.map(r => `<button class="${l && l.reason === r ? 'on' : ''}" data-act="reason" data-r="${r}">${r}</button>`).join('')}</div>
      <button class="btn-k" data-act="resume">다시, 탐험 속으로</button>
    </div></div>`;
  }
  function vEndOv() {
    const s = S.session; const O = [['COMPLETED', '다 했어요'], ['PARTIAL', '조금 남았어요'], ['DEFERRED', '다음에']];
    return `<div class="overlay" data-act="ovClose"><div class="pop" data-stop>
      <h3>탐험 끝낼까요?</h3><p>과제마다 어디까지 했는지 골라요.</p>
      <div class="outcome">${s.tasks.map(t => `<div class="o"><b>${esc(taskLabel(t))}</b><div class="seg">${O.map(([k, l]) => `<button class="${(t.outcome || 'COMPLETED') === k ? 'on' : ''}" data-act="outcome" data-id="${t.id}" data-k="${k}">${l}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="row2"><button class="btn-w" data-act="ovClose">계속하기</button><button class="btn-y" data-act="finish">탐험 끝내기</button></div>
    </div></div>`;
  }
  function vRecIntro() {
    const g = guide();
    return `<div class="overlay"><div class="pop">
      <div class="guide-say" style="margin-bottom:12px"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>오? 녹음할 시간이군.<br>잠깐만… 같이 들어줄 친구 좀 잡아올게!</div></div>
      <div class="row2"><button class="btn-w" data-act="ovClose">나중에</button><button class="btn-y" data-act="toRecord">녹음하러 가기</button></div>
    </div></div>`;
  }
  function vRecord() {
    const s = S.session; const R = UI.rec; const g = guide();
    const mini = `<div class="mini-timer"><span>Ready &amp; Set · 탐험 진행 중</span><span>남은 시간 <b id="miniRemain">--:--</b></span></div>`;
    let body = '';
    if (R.phase === 'ready' || R.phase === 'recording') {
      const on = R.phase === 'recording';
      body = `<h2>${on ? '듣고 있어요' : '목소리 준비됐나요?'}</h2>
        <button class="rec-btn ${on ? 'on' : ''}" data-act="${on ? 'recStop' : 'recStart'}" aria-label="${on ? '녹음 끝내기' : '녹음 시작'}"><i></i></button>
        <div class="rec-time" id="recTime">${on ? 'REC 00:00' : '● 녹음 시작'}</div>
        <canvas class="wave" id="wave"></canvas>
        ${on ? '<button class="btn-k" data-act="recStop">녹음 끝내기</button>' : `${R.takes.length ? '<button class="btn-w" data-act="recPhase" data-p="review">녹음한 것 보기</button>' : ''}`}`;
    } else if (R.phase === 'review') {
      body = `<h2>녹음 완료</h2>
        <div class="takes">${R.takes.map((t, i) => `<div class="take ${R.sel === i ? 'on' : ''}"><span>${i + 1}번째 녹음 · ${mmss(t.dur)}</span><button data-act="play" data-i="${i}">들어보기</button><button data-act="selTake" data-i="${i}">${R.sel === i ? '선택됨' : '이걸로'}</button></div>`).join('')}</div>
        <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%"><button class="btn-w" data-act="recRetry">한 번 더 가볼까?</button><button class="btn-y" data-act="recCoach">길잡이에게 들려주기</button></div>`;
    } else if (R.phase === 'coach') {
      const q = s.guest ? CREW.get(s.guest) : g;
      const lines = [[g, '같이 들어줄 친구 좀 잡아올게!'], [g, '잡아왔다!'], [q, '나는 그냥 지나가고 있었는데?'], [g, '됐고, 이것 좀 같이 들어봐.'], [q, '오, 끝까지 목소리 담았네.'], [g, '다음엔 첫 문장만 조금 크게 시작해볼까?'], [q, '그럼 딱 하나네.']];
      body = `<h2>오늘 목소리, 어땠냐면…</h2>
        <div class="duo">${lines.map(([c, t], i) => `<div class="ln ${c === g ? '' : 'r'}" style="animation-delay:${i * .35}s"><img src="${c.face}" alt="${esc(c.name)}"><div class="bubble"><small>${esc(c.name)}</small>${esc(t)}</div></div>`).join('')}</div>
        <p class="hint">목소리 분석 코칭은 아직 연결 전이라 길잡이 응원만 나와요.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%"><button class="btn-w" data-act="recRetry">한 번 더 가볼까?</button><button class="btn-y" data-act="recFinal">좋아, 이걸로 제출!</button></div>`;
    } else if (R.phase === 'final') {
      const t = R.takes[R.sel];
      body = `<h2>영어 탐험, 제출 준비 완료!</h2>
        <div class="file-name">${esc(recFileName(t))}</div>
        <div class="guide-say"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>목소리까지 잘 챙겨 넣었어. 이제 보내기만 하면 끝!</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%"><button class="btn-w" data-act="play" data-i="${R.sel}">들어보기</button><button class="btn-y" data-act="shareRec">파일 공유</button></div>`;
    }
    return `<section class="screen recs">${mini}<div class="rec-stage">${body}</div>
      <button class="btn-k" data-act="backFocus">탐험으로 돌아가기</button></section>`;
  }
  function vResult() {
    const r = S.records.find(x => x.id === S.result); if (!r) return vHome();
    const R = REACT[r.state]; const g = CREW.get(r.guide); const save = r.targetMs - r.focusMs;
    const lab = { COMPLETED: ['완료', ''], PARTIAL: ['일부', 'p'], DEFERRED: ['다음에', 'd'] };
    return `<section class="screen warm result">
      <div class="top"><h1>오늘의 탐험 보고서</h1></div>
      <h1>${esc(R[0])}</h1><p class="sub">${esc(R[1])}</p>
      <div class="grow">
        <div class="stat3"><div><small>목표</small><b>${mmss(r.targetMs)}</b></div><div><small>집중</small><b>${mmss(r.focusMs)}</b></div>${save > 0 && r.state !== 'STOPPED' ? `<div class="save"><small>TIME SAVE</small><b>${mmss(save)}</b></div>` : `<div><small>멈춘 시간</small><b>${mmss(r.pausedMs)}</b></div>`}</div>
        <div class="res-tasks" style="max-height:30dvh;overflow-y:auto">${r.tasks.map(t => `<div><span>${esc(taskLabel(t))}</span><em class="${lab[t.outcome][1]}">${lab[t.outcome][0]}</em></div>`).join('')}</div>
        ${guideScene(g)}
        <div class="guide-say"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>${esc(R[2])}</div></div>
      </div>
      <div class="cta-row" style="margin-top:10px"><button class="cta ghost" data-act="nav" data-to="home">홈으로</button><button class="cta" data-act="postShare">탐험 기록 공유</button></div>
    </section>`;
  }
  function recItem(r) {
    const R = REACT[r.state] || REACT.STOPPED;
    return `<div class="rec-item"><div class="h"><span>${ymd(r.startAt).replace(/-/g, '.')} · ${hhmm(r.startAt)}~${hhmm(r.endAt)}</span><span>${esc(R[0])}</span></div>
      <b>${r.tasks.map(t => esc(t.item + (t.detail ? ' ' + t.detail : ''))).join(' · ')}</b>
      <div class="n"><span>목표 ${mmss(r.targetMs)}</span><span>집중 ${mmss(r.focusMs)}</span><span>멈춤 ${r.pauseCount}회</span>${r.recDone ? '<span>녹음 ✓</span>' : ''}</div></div>`;
  }
  function vHistory() {
    const g = guide();
    return `<section class="screen warm">
      <div class="top"><h1>탐험 기록</h1><span class="step">${S.records.length}개</span></div>
      ${S.records.length ? `<div class="list">${S.records.map(recItem).join('')}</div>` : `<div class="empty"><img src="${g.face}" alt="${esc(g.name)}"><b>아직 기록이 없어요</b><span>첫 탐험을 끝내면 여기에 시간대로 남아요.</span><button class="cta" style="max-width:240px" data-act="goSetup">오늘 목표 정하기</button></div>`}
      <div style="height:10px"></div>${vNav('history')}</section>`;
  }
  function vCalendar() {
    const now = new Date(); const m = UI.calMonth || new Date(now.getFullYear(), now.getMonth(), 1);
    const y = m.getFullYear(), mo = m.getMonth(); const first = new Date(y, mo, 1).getDay(); const days = new Date(y, mo + 1, 0).getDate();
    const has = new Set(S.records.map(r => ymd(r.startAt)));
    const sel = UI.calSel || ymd(Date.now()); let cells = '';
    for (let i = 0; i < first; i++) cells += '<button class="out" tabindex="-1" aria-hidden="true"></button>';
    for (let d = 1; d <= days; d++) { const k = `${y}-${pad(mo + 1)}-${pad(d)}`; cells += `<button class="${has.has(k) ? 'has' : ''} ${k === ymd(Date.now()) ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-act="calDay" data-d="${k}">${d}</button>`; }
    const list = S.records.filter(r => ymd(r.startAt) === sel);
    return `<section class="screen warm">
      <div class="top"><h1>탐험 일지</h1></div>
      <div class="cal-head"><button data-act="calMove" data-d="-1" aria-label="이전 달">${I.back}</button><b>${y}년 ${mo + 1}월</b><button data-act="calMove" data-d="1" aria-label="다음 달" style="transform:scaleX(-1)">${I.back}</button></div>
      <div class="cal">${'일월화수목금토'.split('').map(d => `<span class="dow">${d}</span>`).join('')}${cells}</div>
      <p class="label" style="margin:12px 0 6px">${sel.replace(/-/g, '.')} <small>${list.length}개</small></p>
      <div class="list">${list.length ? list.map(recItem).join('') : '<p class="hint">이 날은 기록이 없어요</p>'}</div>
      <div style="height:10px"></div>${vNav('calendar')}</section>`;
  }
  function vSettings() {
    const p = S.profile; const g = guide();
    return `<section class="screen warm">
      <div class="top"><h1>설정</h1></div>
      <div class="grow" style="overflow-y:auto">
        <div class="card">
          <div class="set-row"><span>닉네임</span><input class="field" style="max-width:190px;padding:8px 12px" data-prof="nickname" value="${esc(p.nickname)}" maxlength="10"></div>
          <div class="set-row"><span>이름</span><input class="field" style="max-width:190px;padding:8px 12px" data-prof="name" value="${esc(p.name)}" maxlength="10"></div>
          <div class="set-row"><span>공유 이름</span><b>${esc(shareName(p))}</b></div>
        </div>
        <div class="card">
          <div class="set-row"><span>내 길잡이</span><button class="link-btn" data-act="editGuide" style="display:flex;align-items:center;gap:8px"><img src="${g.face}" alt="" style="width:32px;height:32px;border-radius:50%">${esc(g.name)} 바꾸기</button></div>
          <div class="set-row"><span>탐험 테마</span><div class="seg" style="width:160px"><button class="${p.theme === '항해' ? 'on' : ''}" data-act="theme" data-t="항해">항해</button><button class="${p.theme === '낙하' ? 'on' : ''}" data-act="theme" data-t="낙하">낙하</button></div></div>
          <div class="set-row"><span>길잡이 목소리</span><button class="switch ${p.voice !== false ? 'on' : ''}" data-act="voice" role="switch" aria-checked="${p.voice !== false}" aria-label="길잡이 목소리"></button></div>
          <div class="set-row"><span>녹음 파일 이름</span><input class="field" style="max-width:190px;padding:8px 12px" data-prof="recPrefix" value="${esc(p.recPrefix || `${p.nickname}'s English`)}" maxlength="30"></div>
        </div>
        <button class="link-btn" data-act="resetAsk" style="color:#a0522d;align-self:center">모든 기록 지우기</button>
      </div>
      ${vNav('settings')}</section>`;
  }
  function vOb() {
    const p = UI.draft;
    if (UI.screen === 'ob1') {
      return `<section class="screen ob">
        <div class="ob-hero"><div class="brand">READY &amp; SET</div><h1>준비는 가볍게,<br>시작은 자신 있게</h1><p>먼저 탐험가 이름표를 만들어요.</p></div>
        <div class="ob-scene" aria-hidden="true"><div class="ob-rays"></div><div class="crew-line">${[[2, 0, 52, 1], [1, 11, 64, 2], [0, 23, 80, 4], [3, 40, 80, 3], [4, 57, 64, 2], [5, 73, 52, 1]].map(([i, l, h, z]) => `<img src="${CREW.core[i].img}" alt="" style="left:${l}%;height:${h}%;z-index:${z}">`).join('')}</div></div>
        <div class="grow" style="flex:0 0 auto;justify-content:flex-end">
          <div class="card"><p class="label">닉네임 <small>공유할 때 앞에 보여요</small></p><input class="field" data-draft="nickname" value="${esc(p.nickname)}" placeholder="예: 별이" maxlength="10" autocomplete="off"></div>
          <div class="card"><p class="label">이름 <small>괄호 안에 보여요</small></p><input class="field" data-draft="name" value="${esc(p.name)}" placeholder="예: 김하늘" maxlength="10" autocomplete="off">
          <p class="preview-name">공유 이름: <b id="pvName">${esc(shareName(p) || '닉네임(이름)')}</b></p></div>
        </div>
        <button class="cta" data-act="ob2" ${p.nickname.trim() ? '' : 'disabled'} id="ob1Next">다음</button>
      </section>`;
    }
    if (UI.screen === 'ob2') {
      const pages = [0, 1, 2, 3]; const list = CREW.all.slice(UI.obPage * 6, UI.obPage * 6 + 6); const sel = CREW.get(p.guide);
      return `<section class="screen ob">
        ${UI.obEdit ? `<div class="top"><button class="back" data-act="nav" data-to="settings" aria-label="뒤로">${I.back}</button><h1>길잡이 바꾸기</h1></div>` : ''}
        <div class="ob-hero"><h1 style="font-size:25px">함께 갈 길잡이를 골라요</h1><p>누르면 목소리를 들을 수 있어요.</p></div>
        <div class="grow" style="justify-content:center">
          <div class="pager">${pages.map(i => `<button class="${UI.obPage === i ? 'on' : ''}" data-act="obPage" data-i="${i}">${i ? i * 6 + 1 + '~' + (i * 6 + 6) : '탐험대'}</button>`).join('')}</div>
          <div class="crew-grid">${list.map(c => `<button class="crew ${p.guide === c.id ? 'on' : ''}" data-act="pickGuide" data-id="${c.id}" aria-pressed="${p.guide === c.id}"><img src="${c.face}" alt="" loading="lazy"><b>${esc(c.name)}</b><span>${esc(c.keywords.slice(0, 2).join(' · '))}</span></button>`).join('')}</div>
          <div class="guide-say"><img src="${sel.face}" alt="${esc(sel.name)}"><div class="bubble"><small>${esc(sel.name)}</small>${esc(sel.signature)}</div></div>
        </div>
        <button class="cta" data-act="${UI.obEdit ? 'guideSave' : 'ob3'}">${UI.obEdit ? '이 길잡이로 할게요' : '다음'}</button>
      </section>`;
    }
    return `<section class="screen ob">
      <div class="ob-hero"><h1 style="font-size:25px">어떻게 섬에 도착할까요?</h1><p>공유 카드와 탐험 분위기에 쓰여요. 나중에 설정에서 바꿀 수 있어요.</p></div>
      <div class="grow">
        <div class="theme-pick"><button class="${p.theme === '항해' ? 'on' : ''}" data-act="obTheme" data-t="항해">${I.sail}<b>항해</b><span>바다를 건너 섬으로</span></button><button class="${p.theme === '낙하' ? 'on' : ''}" data-act="obTheme" data-t="낙하">${I.chute}<b>낙하</b><span>하늘에서 섬으로 내려가기</span></button></div>
        ${guideScene(CREW.get(p.guide))}
        <div class="guide-say"><img src="${CREW.get(p.guide).face}" alt=""><div class="bubble"><small>${esc(CREW.get(p.guide).name)}</small>${esc(shareName(p))}, 반가워! 이제 오늘 할 일을 골라보자.</div></div>
      </div>
      <button class="cta" data-act="obDone" ${p.theme ? '' : 'disabled'}>시작하기</button>
    </section>`;
  }
  function vShareOv() {
    const sh = UI.share;
    return `<div class="overlay" data-act="ovClose"><div class="pop" data-stop>
      <h3>${sh.kind === 'pre' ? '탐험 시작 공유' : '탐험 기록 공유'}</h3><p>${esc(sh.caption)}</p>
      ${sh.url ? `<img class="share-img" src="${sh.url}" alt="공유 카드 미리보기">` : `<p class="hint">${sh.err ? '카드를 만들지 못했어요. 문구만 공유할 수 있어요.' : '카드 만드는 중…'}</p>`}
      <div class="row2" style="margin-top:12px"><button class="btn-w" data-act="ovClose">닫기</button><button class="btn-y" data-act="doShare" ${sh.url || sh.err ? '' : 'disabled'}>공유하기</button></div>
    </div></div>`;
  }
  function vResetOv() {
    return `<div class="overlay" data-act="ovClose"><div class="pop" data-stop><h3>모든 기록을 지울까요?</h3><p>이름표, 길잡이, 탐험 기록이 이 기기에서 모두 지워져요.</p>
      <div class="row2"><button class="btn-w" data-act="ovClose">취소</button><button class="btn-k" data-act="resetDo">지우기</button></div></div></div>`;
  }

  function render() {
    if (!S.profile && !/^ob/.test(UI.screen || '')) { UI.draft = UI.draft || { name: '', nickname: '', guide: 'dubi', theme: '' }; UI.screen = 'ob1'; }
    if (S.session && !['focus', 'record'].includes(UI.screen)) UI.screen = 'focus';
    const v = { home: vHome, setup1: vSetup1, setup2: vSetup2, brief: vBrief, focus: vFocus, record: vRecord, result: vResult, history: vHistory, calendar: vCalendar, settings: vSettings, ob1: vOb, ob2: vOb, ob3: vOb }[UI.screen] || vHome;
    let html = v();
    if (UI.ov === 'sheet') html += vSheet();
    if (UI.ov === 'pause') html += vPauseOv();
    if (UI.ov === 'end') html += vEndOv();
    if (UI.ov === 'recIntro') html += vRecIntro();
    if (UI.ov === 'share' && UI.share) html += vShareOv();
    if (UI.ov === 'reset') html += vResetOv();
    app.innerHTML = html;
    tick();
  }

  /* ---------------- live tick ---------------- */
  function tick() {
    const s = S.session; const now = Date.now(); const d = new Date(now);
    const rot = (id, deg) => { const e = document.getElementById(id); if (e) e.setAttribute('transform', `rotate(${deg} 100 100)`); };
    rot('hS', d.getSeconds() * 6 + d.getMilliseconds() * .006);
    rot('hM', d.getMinutes() * 6 + d.getSeconds() * .1);
    rot('hH', (d.getHours() % 12) * 30 + d.getMinutes() * .5 + d.getSeconds() / 120);
    if (s) {
      const f = focusMs(s, now), rem = s.targetMs - f;
      const set = (id, t) => { const e = document.getElementById(id); if (e && e.textContent !== t) e.textContent = t; };
      if (rem >= 0) { set('remain', mmss(rem)); set('remainLbl', '남은 시간'); } else { set('remain', '+' + mmss(-rem)); set('remainLbl', '초과 시간'); const b = $('#remainBox'); b && b.classList.add('over'); }
      set('miniRemain', rem >= 0 ? mmss(rem) : '+' + mmss(-rem));
      set('focusT', mmss(f)); set('pauseT', mmss(pausedMs(s, now)));
      const l = s.pauses[s.pauses.length - 1]; if (l && !l.e) set('pauseBig', mmss(now - l.s));
      if (rem <= 0 && !s.alerted) { s.alerted = true; save(); chime(); toast('목표 시간 돌파! 지금부터는 보너스 시간이에요', 3500); }
    }
  }
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /* ---------------- events ---------------- */
  const A = {
    nav: e => { const to = e.dataset.to; if (to === 'history' || to === 'calendar' || to === 'settings' || to === 'home' || to === 'setup1' || to === 'setup2') go(to); },
    goSetup: () => go('setup1'),
    cat: e => { const c = e.dataset.cat; S.curCat = c; save(); UI.sheetCat = c; UI.sheetSel = S.plan.tasks.filter(t => t.cat === c).map(t => t.item); UI.ov = 'sheet'; render(); },
    opt: e => { const it = e.dataset.it; const a = UI.sheetSel; const i = a.indexOf(it); i >= 0 ? a.splice(i, 1) : a.push(it); render(); },
    sheetClose: () => { UI.ov = null; render(); },
    sheetDone: () => {
      const c = UI.sheetCat; const keep = S.plan.tasks.filter(t => t.cat !== c || UI.sheetSel.includes(t.item));
      UI.sheetSel.forEach(it => { if (!keep.some(t => t.cat === c && t.item === it)) keep.push({ id: uid('t'), cat: c, item: it, detail: '' }); });
      S.plan.tasks = keep; save(); UI.ov = null;
      if (UI.screen === 'home' && UI.sheetSel.length) toast(`${c} ${UI.sheetSel.length}개 담았어요 · 오늘 목표 정하기에서 이어가요`);
      render();
    },
    delTask: e => { S.plan.tasks = S.plan.tasks.filter(t => t.id !== e.dataset.id); save(); render(); },
    time: e => { const t = e.dataset.t; S.plan.target = t === 'custom' ? 'custom' : +t; save(); render(); if (t === 'custom') { const i = $('#customMin'); i && i.focus(); } },
    bgm: e => { S.plan.bgm = e.dataset.k; save(); render(); if (e.dataset.k !== 'off') { bgmPlay(e.dataset.k, false); clearTimeout(A._pv); A._pv = setTimeout(() => { if (!S.session) bgmStop(); }, 3500); } else bgmStop(false); },
    toSetup2: () => { bgmStop(false); go('setup2'); },
    mood: e => { const id = e.dataset.id; const a = S.plan.moods; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else if (a.length < 2) a.push(id); S.plan.sys = a.length === 2 ? sysCardFor(a) : null; save(); render(); },
    toBrief: () => go('brief'),
    start: () => startSession(),
    preShare: () => { if (!S.plan.tasks.length || !targetMin()) { toast('먼저 오늘 목표를 정해요'); return go('setup1'); } openShare('pre'); },
    postShare: () => { const r = S.records.find(x => x.id === S.result); if (r) openShare('post', r); },
    doShare: () => doShare(),
    music: () => { const s = S.session; if (s.bgm === 'off') { s.bgm = 'lofi'; } s.bgmOn = !s.bgmOn; save(); s.bgmOn ? bgmPlay(s.bgm) : bgmPause(); render(); },
    pause: () => pauseNow(),
    reason: e => { const s = S.session; const l = s.pauses[s.pauses.length - 1]; if (l) l.reason = l.reason === e.dataset.r ? '' : e.dataset.r; save(); render(); },
    resume: () => resume(),
    endAsk: () => { UI.ov = 'end'; render(); },
    outcome: e => { const t = S.session.tasks.find(x => x.id === e.dataset.id); if (t) t.outcome = e.dataset.k; save(); render(); },
    finish: () => finalize(),
    ovClose: () => { if (UI.share && UI.share.url) URL.revokeObjectURL(UI.share.url); UI.share = null; UI.ov = null; render(); },
    recIntro: () => { UI.ov = 'recIntro'; render(); },
    toRecord: () => { bgmPause(); UI.rec = { phase: 'ready', takes: UI.rec.takes || [], sel: UI.rec.sel }; go('record'); },
    recStart: () => recStart(),
    recStop: () => recStop(),
    recPhase: e => { UI.rec.phase = e.dataset.p; render(); },
    recRetry: () => { UI.rec.phase = 'ready'; render(); },
    play: e => { const t = UI.rec.takes[+e.dataset.i]; if (!t) return; if (AUD.take) AUD.take.pause(); AUD.take = new Audio(t.url); AUD.take.play().catch(() => toast('재생할 수 없어요')); },
    selTake: e => { UI.rec.sel = +e.dataset.i; render(); },
    recCoach: () => { const s = S.session; if (!s.guest) { s.guest = pickGuest(S.profile.guide, s.moods).id; save(); } UI.rec.phase = 'coach'; render(); },
    recFinal: () => { const s = S.session; const t = UI.rec.takes[UI.rec.sel]; if (!t) return; s.recDone = true; s.recFile = recFileName(t); save(); UI.rec.phase = 'final'; render(); },
    shareRec: async () => { const t = UI.rec.takes[UI.rec.sel]; if (!t) return; const name = recFileName(t); const r = await shareFile(new File([t.blob], name, { type: t.type }), name); if (r === 'shared') toast('보냈어요'); },
    backFocus: () => { recStop(); cleanupMic(); if (AUD.take) AUD.take.pause(); go('focus'); const s = S.session; if (s && s.bgmOn && !isPaused(s)) bgmPlay(s.bgm); },
    calMove: e => { const now = new Date(); const m = UI.calMonth || new Date(now.getFullYear(), now.getMonth(), 1); UI.calMonth = new Date(m.getFullYear(), m.getMonth() + (+e.dataset.d), 1); render(); },
    calDay: e => { UI.calSel = e.dataset.d; render(); },
    editGuide: () => { UI.draft = Object.assign({}, S.profile); UI.obEdit = true; UI.obPage = Math.floor(CREW.all.indexOf(guide()) / 6); go('ob2'); },
    guideSave: () => { S.profile.guide = UI.draft.guide; save(); UI.obEdit = false; go('settings'); },
    theme: e => { S.profile.theme = e.dataset.t; save(); render(); },
    voice: () => { S.profile.voice = S.profile.voice === false; save(); render(); },
    resetAsk: () => { UI.ov = 'reset'; render(); },
    resetDo: () => { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } S = blank(); UI.draft = null; go('ob1'); },
    ob2: () => { if (!UI.draft.nickname.trim()) return; UI.draft.nickname = UI.draft.nickname.trim(); UI.draft.name = UI.draft.name.trim(); go('ob2'); },
    obPage: e => { UI.obPage = +e.dataset.i; render(); },
    pickGuide: e => { UI.draft.guide = e.dataset.id; render(); playVoice(CREW.get(e.dataset.id)); },
    ob3: () => go('ob3'),
    obTheme: e => { UI.draft.theme = e.dataset.t; render(); },
    obDone: () => { const d = UI.draft; S.profile = { name: d.name, nickname: d.nickname, guide: d.guide, theme: d.theme, voice: true, recPrefix: '' }; save(); UI.draft = null; go('home'); }
  };
  // playVoice during onboarding (no profile yet) — allow
  const _pv = playVoice; playVoice = function (c) { if (!S.profile) { const v = new Audio(c.voice); AUD.voice && AUD.voice.pause(); AUD.voice = v; v.play().catch(() => {}); return; } _pv(c); };

  app.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const stop = e.target.closest('[data-stop]');
    if (stop && t !== stop && t.contains(stop)) return; // tap on empty sheet/pop area must not trigger the backdrop's close
    const fn = A[t.dataset.act]; if (fn) { e.preventDefault(); fn(t, e); }
  });
  app.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.detail) { const k = S.plan.tasks.find(x => x.id === t.dataset.detail); if (k) { k.detail = t.value.slice(0, 30); save(); } }
    if (t.id === 'customMin') { S.plan.custom = t.value.replace(/\D/g, '').slice(0, 3); save(); const lbl = t.closest('.card').querySelector('.label small'); if (lbl) lbl.textContent = targetMin() ? targetMin() + '분' : '정해 주세요'; const b = $('[data-act="toSetup2"]'); if (b) b.disabled = !(S.plan.tasks.length && targetMin()); }
    if (t.dataset.draft) { UI.draft[t.dataset.draft] = t.value; const pv = $('#pvName'); if (pv) pv.textContent = shareName({ nickname: UI.draft.nickname.trim(), name: UI.draft.name.trim() }) || '닉네임(이름)'; const nb = $('#ob1Next'); if (nb) nb.disabled = !UI.draft.nickname.trim(); }
    if (t.dataset.prof) { const k = t.dataset.prof; const v = t.value.trim(); if (k === 'nickname' && !v) return; S.profile[k] = v; save(); }
  });
  app.addEventListener('change', e => { if (e.target.dataset.prof) render(); });

  /* ---------------- boot ---------------- */
  UI.screen = S.session ? 'focus' : 'home';
  if (S.session && S.session.bgmOn && !isPaused(S.session)) { /* autoplay needs a gesture; music button resumes */ S.session.bgmOn = false; save(); }
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__RS = { get state() { return S; }, ui: UI };
})();
