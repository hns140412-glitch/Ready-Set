/* Ready & Set — approved-design rebuild 2026-11-05
   Visual authority: CODEX_TASK_RS_MOCKUP_UI.md (2026-11-05), GUIDE transcription and supplied timer mockups.
   Logic authority: current READY_SET canonical contract and runtime state model; historical REV is provenance only.
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
  // Focus sound set confirmed 2026-09-18 (lofi removed as noisy; Essential = linked YouTube playlist).
  const BGMS = [['essential', 'Essential'], ['metronome', '메트로놈'], ['nature', '자연'], ['water', '물소리'], ['off', '끄기']];
  const YT_BGM = { essential: { id: 'h2sHEe_xnmU', list: 'PLKRZTF1Q1uwYFbRwQzrySyGXYJVXqcUVu' } };
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

  /* ---------------- state ---------------- */
  const blank = () => ({
    profile: null, // {name, nickname, guide, theme, voice, recPrefix}
    curCat: '재능',
    plan: { tasks: [], target: 25, custom: '', bgm: 'essential', moods: [], sys: null },
    session: null,
    records: [],
    guestHistory: [],
    result: null
  });
  let S = load();
  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') { const o = Object.assign(blank(), v); if (o.plan && !BGMS.some(b => b[0] === o.plan.bgm)) o.plan.bgm = 'essential'; return o; } } catch (e) { /* ignore */ }
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
  const guide = () => { const c = CREW.get(S.profile && S.profile.guide); const n = S.profile && S.profile.guideNick; return n ? Object.assign({}, c, { name: n }) : c; };
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
    bgmStop(false); if (AUD.bgm && AUD.bgm.destroy) AUD.bgm.destroy();
    const a = YT_BGM[key] ? ytSource(YT_BGM[key]) : key === 'metronome' ? metronomeSource(52) : new Audio(`assets/bgm-${key}.wav`);
    a.loop = true; a.volume = fade ? 0 : .55; a.preload = 'auto';
    AUD.bgm = a; AUD.bgmKey = key;
    a.play().then(() => fade && fadeTo(a, .55)).catch(() => toast('음악은 화면을 한 번 누르면 재생돼요'));
  }
  function bgmStop(fade = true) {
    const a = AUD.bgm; if (!a) return;
    if (fade) fadeTo(a, 0, () => a.pause()); else a.pause();
  }
  // Hidden YouTube player driven through the iframe API messages (play/pause/volume), shaped like an <audio>.
  function ytSource(v) {
    const f = document.createElement('iframe'); let vol = .55;
    f.id = 'rsYoutubeBgm'; f.title = '집중 음악 Essential'; f.allow = 'autoplay; encrypted-media'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;width:2px;height:2px;left:-20px;top:-20px;border:0;opacity:.01;pointer-events:none';
    const cmd = (func, args = []) => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) { /* not ready */ } };
    const o = { paused: true, loop: true, preload: 'auto', started: false,
      get volume() { return vol; }, set volume(n) { vol = n; cmd('setVolume', [Math.round(n * 100)]); },
      play() { o.paused = false; if (!o.started) { o.started = true; f.src = `https://www.youtube.com/embed/${v.id}?autoplay=1&loop=1&playlist=${v.id}&list=${v.list}&controls=0&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`; f.onload = () => setTimeout(() => { cmd('setVolume', [Math.round(vol * 100)]); if (o.paused) cmd('pauseVideo'); }, 400); document.body.appendChild(f); } else cmd('playVideo'); return Promise.resolve(); },
      pause() { o.paused = true; cmd('pauseVideo'); },
      destroy() { o.paused = true; f.remove(); } };
    return o;
  }
  // Soft wood-block metronome (Web Audio), shaped like an <audio>.
  function metronomeSource(bpm) {
    let t = null, vol = .55;
    const o = { paused: true, loop: true, preload: 'auto',
      get volume() { return vol; }, set volume(n) { vol = n; },
      play() {
        o.paused = false; clearInterval(t);
        const ctx = AUD.ctx || (AUD.ctx = new (window.AudioContext || window.webkitAudioContext)()); if (ctx.resume) ctx.resume();
        const beat = () => { if (o.paused) return; const c = ctx.currentTime, os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'triangle'; os.frequency.value = 1180; g.gain.setValueAtTime(.0001, c); g.gain.exponentialRampToValueAtTime(Math.max(.0002, .25 * vol), c + .005); g.gain.exponentialRampToValueAtTime(.0001, c + .09); os.connect(g).connect(ctx.destination); os.start(c); os.stop(c + .1); };
        beat(); t = setInterval(beat, 60000 / bpm); return Promise.resolve();
      },
      pause() { o.paused = true; clearInterval(t); },
      destroy() { o.pause(); } };
    return o;
  }
  function bgmPause() { const a = AUD.bgm; if (a) fadeTo(a, 0, () => a.pause()); }
  function fadeTo(a, v, done) {
    clearInterval(a._f); const step = (v - a.volume) / 12;
    a._f = setInterval(() => { const n = a.volume + step; if ((step >= 0 && n >= v) || (step < 0 && n <= v) || step === 0) { a.volume = Math.max(0, Math.min(1, v)); clearInterval(a._f); done && done(); } else a.volume = Math.max(0, Math.min(1, n)); }, 40);
  }
  function playVoice(c) {
    if (!c || (S.profile && S.profile.voice === false)) return;
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
  /* ---------------- crew voice lines (REV06 §31-35): rs/voice/<crew>/<key>.mp3, ElevenLabs ---------------- */
  const VTAG = '20261107g';
  const REC_TXT = {
    'rec-intro': '오? 녹음할 시간이군.', 'rec-alone': '잠깐… 오늘은 나 혼자 듣기 좀 아까운데?', 'rec-fetch': '같이 들어줄 친구 좀 잡아올게!',
    'rec-back': '잡아왔다!', 'g-arrive': '나는 그냥 지나가고 있었는데?', 'rec-listen': '됐고, 이것 좀 같이 들어봐.',
    'good-m1': '오늘 목소리 좀 달라졌지?', 'good-g1': '응. 마지막 문장 꽤 자연스러웠는데?', 'good-m2': '그치? 내가 잘 듣고 있었다니까.', 'good-g2': '네가 한 건 없잖아.', 'good-m3': '…그건 굳이 말하지 않아도 돼.',
    'soft-m1': '오늘은 목소리가 살짝 숨어 있었어.', 'soft-g1': '그래도 끝까지 읽었잖아.', 'soft-m2': '맞아. 다음엔 첫 문장만 조금 크게 시작해보자.', 'soft-g2': '그럼 딱 하나네.', 'soft-m3': '좋아. 다음 작전 발견!',
    'rec-final': '목소리까지 잘 챙겨 넣었어. 이제 보내기만 하면 끝!'
  };
  let SCRIPT = null; // scene lines per crew (start/mid/timeup/resume/done/part)
  fetch('rs/voice/script.json?v=' + VTAG).then(r => r.ok ? r.json() : null).then(j => { SCRIPT = j; }).catch(() => {});
  const resKey = (cid, st) => SCRIPT && SCRIPT.result && (SCRIPT.result[cid] || []).includes(st) ? 'res-' + st : null;
  const lineText = (cid, key) => (/^res-/.test(key) && REACT[key.slice(4)] ? REACT[key.slice(4)][2] : '') || REC_TXT[key] || (SCRIPT && SCRIPT.moments && SCRIPT.moments[cid] && SCRIPT.moments[cid][key]) || '';
  const voiceOn = () => !(S.profile && S.profile.voice === false);
  function sayLine(cid, key, cb) {
    const txt = lineText(cid, key); const wait = 700 + txt.length * 75;
    let fired = false; const done = () => { if (fired) return; fired = true; clearTimeout(t); cb && cb(); };
    const t = setTimeout(done, voiceOn() ? Math.max(9000, wait + 4000) : wait);
    if (!voiceOn()) return;
    try { if (AUD.voice) AUD.voice.pause(); } catch (e) { /* noop */ }
    const v = new Audio(`rs/voice/${cid}/${key}.mp3?v=${VTAG}`); AUD.voice = v; v.dataset.line = `${cid}/${key}`;
    const b = AUD.bgm; const duck = b && !b.paused; if (duck) b.volume = .12;
    const end = () => { if (duck && AUD.bgm === b && !b.paused) fadeTo(b, .55); };
    v.onended = () => { end(); done(); };
    v.onerror = () => { end(); clearTimeout(t); setTimeout(done, wait); };
    v.play().catch(() => { end(); });
  }
  function sayScene(key) { const g = guide(); const txt = lineText(g.id, key); sayLine(g.id, key); return txt; }
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
    setTimeout(() => sayScene('start'), 400);
  }
  function isPaused(s) { const l = s.pauses[s.pauses.length - 1]; return !!(l && !l.e); }
  function pauseNow() { const s = S.session; if (!s || isPaused(s)) return; s.pauses.push({ s: Date.now(), e: 0, reason: '' }); save(); bgmPause(); UI.ov = 'pause'; render(); }
  function resume() { const s = S.session; if (!s) return; const l = s.pauses[s.pauses.length - 1]; if (l && !l.e) l.e = Date.now(); save(); UI.ov = null; render(); if (s.bgmOn) bgmPlay(s.bgm); setTimeout(() => sayScene('resume'), 300); }
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
    setTimeout(() => { const g = guide(), k = resKey(g.id, rec.state); if (k) sayLine(g.id, k); else sayScene(rec.state === 'STOPPED' || rec.state === 'PARTIAL_COMPLETE' ? 'part' : 'done'); }, 500);
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

  /* ---------------- guest pick ---------------- */
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

  /* ---------------- duo coaching staging (REV06 §31/§33): Main exits, returns with Guest, then good/soft talk ---------------- */
  const DUO_IN = [['m', 'rec-alone'], ['m', 'rec-fetch'], ['exit'], ['m', 'rec-back'], ['g', 'g-arrive'], ['m', 'rec-listen']];
  const DUO_TALK = { good: [['m', 'good-m1'], ['g', 'good-g1'], ['m', 'good-m2'], ['g', 'good-g2'], ['m', 'good-m3']], soft: [['m', 'soft-m1'], ['g', 'soft-g1'], ['m', 'soft-m2'], ['g', 'soft-g2'], ['m', 'soft-m3']] };
  // No speech analysis yet: a confident take = long enough, audible, without many retries. Never mocks the child (§33).
  function duoTone(R) { const t = R.takes[R.sel]; if (!t) return 'soft'; return t.dur >= 6000 && R.takes.length <= 2 && (t.lvl == null || t.lvl >= .03) ? 'good' : 'soft'; }
  function duoStart() {
    const R = UI.rec; const s = S.session; clearTimeout(R.duo && R.duo.t);
    R.duo = { main: S.profile.guide, guest: s.guest, tone: duoTone(R), i: 0, out: false, back: false, done: false };
    R.duo.steps = DUO_IN.concat(DUO_TALK[R.duo.tone]);
    duoRun(R.duo);
  }
  function duoRun(D) {
    if (UI.rec.duo !== D || UI.rec.phase !== 'coach') return;
    const st = D.steps[D.i];
    if (!st) { D.done = true; D.i = D.steps.length - 1; render(); return; }
    if (st[0] === 'exit') { D.out = true; render(); D.t = setTimeout(() => { if (UI.rec.duo !== D) return; D.out = false; D.back = true; D.i++; duoRun(D); }, 1300); return; }
    render();
    sayLine(st[0] === 'm' ? D.main : D.guest, st[1], () => { D.t = setTimeout(() => { if (UI.rec.duo !== D || D.done) return; D.i++; duoRun(D); }, 380); });
  }
  function duoStop() { const D = UI.rec.duo; if (D) { clearTimeout(D.t); D.done = true; } try { AUD.voice && AUD.voice.pause(); } catch (e) { /* noop */ } }

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
        if (blob.size > 0) { UI.rec.takes.push({ blob, url: URL.createObjectURL(blob), type, dur, lvl: MIC.ln ? MIC.lv / MIC.ln : null }); UI.rec.sel = UI.rec.takes.length - 1; }
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
      const buf = new Uint8Array(an.fftSize); MIC.lv = 0; MIC.ln = 0;
      const loop = () => {
        const cv = $('#wave'); const tm = $('#recTime');
        if (tm) tm.textContent = 'REC ' + mmss(Date.now() - MIC.t0);
        if (cv) {
          const w = cv.width = cv.clientWidth * 2, h = cv.height = cv.clientHeight * 2, g = cv.getContext('2d');
          an.getByteTimeDomainData(buf); { let q = 0; for (let i = 0; i < buf.length; i++) { const d = (buf[i] - 128) / 128; q += d * d; } MIC.lv += Math.sqrt(q / buf.length); MIC.ln++; } g.clearRect(0, 0, w, h); g.lineWidth = 4; g.strokeStyle = '#ff3b30'; g.beginPath();
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
  /* weekly journey home — mockup 16 (7 days × 오전/오후/저녁) */
  const WK_KINDS = [
    { k: 'fixed', t: '학교', e: '🏫' }, { k: 'other', t: '학원', e: '📚' }, { k: 'other', t: '운동', e: '🥋' }, { k: 'other', t: '악기', e: '🎹' },
    { k: 'family', t: '가족 시간', e: '👨‍👩‍👧' }, { k: 'free', t: '친구랑 놀기', e: '⚽' }, { k: 'free', t: '자유 시간', e: '🎮' }, { k: 'free', t: '늦잠', e: '😴' }
  ];
  const WK_SLOTS = [['am', '오전'], ['pm', '오후'], ['ev', '저녁']];
  const WK_DAYS = '월화수목금토일';
  const MAP_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/><path d="M12 9.5l1 1.6 1.8.3-1.3 1.3.3 1.8-1.8-.9-1.6.9.3-1.8-1.3-1.3 1.8-.3z" fill="currentColor" stroke="none"/></svg>';
  function vHome() {
    const today = new Date(), todayKey = ymd(today);
    const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    anchor.setDate(anchor.getDate() - (anchor.getDay() + 6) % 7 + (UI.weekOffset || 0) * 7);
    const days = Array.from({ length: 7 }, (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + i));
    const fmt = d => `${d.getMonth() + 1}월 ${d.getDate()}일`;
    const P = S.profile || {}, g = guide(), wk = S.week || {};
    const recOf = key => S.records.filter(r => ymd(r.startAt) === key);
    const weekRecs = S.records.filter(r => r.startAt >= +anchor && r.startAt < +days[6] + 864e5);
    const tasks = weekRecs.flatMap(r => r.tasks), complete = tasks.filter(t => t.outcome === 'COMPLETED').length;
    const rate = tasks.length ? Math.round(complete / tasks.length * 100) : 0;
    const planTxt = S.plan.tasks.length ? S.plan.tasks.map(t => t.item).join(' · ') : '';
    const tdi = (today.getDay() + 6) % 7, todoSlot = ['pm', 'ev', 'am'].find(s => !wk[tdi + '-' + s]) || 'pm';
    const ti = days.findIndex(d => ymd(d) === todayKey);
    const cell = (d, i, s, r) => {
      const key = i + '-' + s, it = wk[key], pos = `style="grid-area:${r + 2}/${i + 2}"`;
      if (i === ti && s === todoSlot) { const n = recOf(todayKey).length; return `<button class="wk-cell todo" ${pos} data-act="homeView" data-k="day"><i class="wk-check">✓</i><b>오늘 할 일</b><small>${planTxt ? esc(planTxt) : n ? `탐험 ${n}번 완료` : '탐험 준비'}</small></button>`; }
      if (it) return `<button class="wk-cell ${it.k}" ${pos} data-act="wkCell" data-key="${key}"><b>${esc(it.t)}</b><span>${it.e}</span></button>`;
      return `<button class="wk-cell free empty" ${pos} data-act="wkCell" data-key="${key}" aria-label="${WK_DAYS[i]}요일 ${s === 'am' ? '오전' : s === 'pm' ? '오후' : '저녁'} 일정 정하기"><b>자유 시간</b><span>⛰️</span></button>`;
    };
    const week = `<div class="wk-head"><img class="wk-map" src="rs/art/home-map.webp?v=20261107g" alt=""><h1>이번 주 여정</h1><p class="wk-sub">오늘도 한 걸음, 더 멋진 너의 이야기를!</p><img class="wk-tent" src="rs/art/home-tent.webp?v=20261107g" alt=""><p class="wk-motto">Same Sky,<br>Different Stories,<br>Together.</p></div>
      <div class="wk-grid">
        ${ti >= 0 ? `<i class="wk-colmark" style="grid-area:1/${ti + 2}/5/${ti + 3}"></i>` : ''}
        ${days.map((d, i) => { const k = ymd(d); return `<button class="wk-day ${i === ti ? 'today' : ''}" style="grid-area:1/${i + 2}" data-act="homeDay" data-day="${k}"><b>${WK_DAYS[i]}</b><small>${i === ti ? '오늘' : `${d.getMonth() + 1}/${d.getDate()}`}</small>${recOf(k).length ? '<i class="wk-dot" aria-label="탐험 기록 있음"></i>' : ''}</button>`; }).join('')}
        ${WK_SLOTS.map(([s, l], r) => `<span class="wk-slot" style="grid-area:${r + 2}/1">${l}</span>${days.map((d, i) => cell(d, i, s, r)).join('')}`).join('')}
      </div>
      <div class="wk-legend"><span><i class="lg-fixed"></i><em>고정 일정<small>(학교 등)</small></em></span><span><i class="lg-todo"></i><em>오늘의 할 일</em></span><span><i class="lg-other"></i><em>다른 일정<small>(학원, 약속 등)</small></em></span><span><i class="lg-free"></i><em>자유 시간</em></span></div>
      <p class="wk-cheer"><span aria-hidden="true">⛰️</span>지금의 너도, 멋지게 성장하고 있어!<span aria-hidden="true">🌤️</span></p>
      `;
    const day = UI.homeDay || todayKey, dd = new Date(day + 'T12:00:00'), daily = recOf(day);
    const dayBody = `<div class="wk-head"><img class="wk-map" src="rs/art/home-map.webp?v=20261107g" alt=""><h1>오늘의 탐험길</h1><p class="wk-sub">작은 계획이, 좋은 하루를 만들어요.</p><img class="wk-tent" src="rs/art/home-tent.webp?v=20261107g" alt=""><p class="wk-motto">Same Sky,<br>Different Stories,<br>Together.</p></div>
      <div class="journey-range"><button data-act="weekMove" data-d="-1" aria-label="이전 날">‹</button><b>${fmt(dd)} (${'일월화수목금토'[dd.getDay()]})</b><button data-act="weekMove" data-d="1" aria-label="다음 날">›</button></div>
      <div class="day-route"><div class="timeline">${daily.map(r => `<article><time>${hhmm(r.startAt)}</time><div><b>${esc(r.tasks.map(t => t.item).join(' · '))}</b><small>${mmss(r.focusMs)} 탐험 기록</small></div></article>`).join('')}<article class="current"><time>${day === todayKey ? hhmm(Date.now()) : '탐험'}</time><div><b>${planTxt ? esc(planTxt) : '새로운 탐험을 시작해요'}</b><button data-act="goSetup">시작하기 →</button></div></article></div></div>
      <div class="week-summary"><h2>이번 주 요약</h2><div><span>기록한 탐험<b>${tasks.length}개</b></span><span>실제 집중 시간<b>${(m => m > 0 && m < 60000 ? '1분 미만' : `${Math.round(m / 60000)}분`)(weekRecs.reduce((n, r) => n + r.focusMs, 0))}</b></span><span class="summary-ring" style="--rate:${rate}%"><strong>${rate}%</strong><small>완료율</small></span></div></div>
      `;
    const ek = UI.wkEdit, pick = ek ? `<div class="wk-pick" role="dialog" aria-label="일정 정하기"><div class="wk-pick-card"><h2>${WK_DAYS[+ek.split('-')[0]]}요일 ${{ am: '오전', pm: '오후', ev: '저녁' }[ek.split('-')[1]]} 일정</h2><p>매주 같은 요일에 반복돼요.</p><div class="wk-pick-grid">${WK_KINDS.map((k, i) => `<button class="wk-cell ${k.k} ${wk[ek] && wk[ek].t === k.t ? 'on' : ''}" data-act="wkSet" data-i="${i}"><b>${k.t}</b><span>${k.e}</span></button>`).join('')}</div><div class="wk-pick-row"><button class="gd-btn" data-act="wkSet" data-i="-1">비우기</button><button class="gd-btn navy" data-act="wkClose">닫기</button></div></div></div>` : '';
    return `<section class="screen wk">
      <div class="wk-bg"><img src="rs/scenes/home-header.webp" alt=""></div>
      <header class="wk-top"><img class="wk-art" src="rs/art/home-top.webp?v=20261107g" alt="TAKY Ready &amp; Set. 좋은 친구와 어디든 멋진 이야기가 시작돼!"><button class="wk-me" data-act="nav" data-to="settings" aria-label="내 정보"><img src="${P.avatar || P.photo || g.face}" alt=""></button></header>
      <div class="wk-card">${UI.homeView === 'day' ? dayBody : week}</div>
      <div class="wk-props"><img src="rs/art/home-props.webp?v=20261107g" alt=""><button class="wk-cta" data-act="homeView" data-k="${UI.homeView === 'day' ? 'week' : 'day'}">${I.cal}<span>${UI.homeView === 'day' ? '이번 주 보기' : '오늘 보기'}</span><b aria-hidden="true">›</b></button></div>
      <nav class="journey-nav wk-nav"><button class="${UI.homeView === 'day' ? '' : 'on'}" data-act="homeView" data-k="week">${I.home}<span>이번 주 여정</span></button><button data-act="goSetup">${I.target}<span>탐험하기</span></button><button data-act="campView">${MAP_IC}<span>베이스캠프</span></button><button data-act="editGuide">${I.chat}<span>친구들</span></button><button data-act="nav" data-to="settings">${I.gear}<span>더보기</span></button></nav>
      ${pick}
    </section>`;
  }
  function vNav(on) {
    // same five entries as the home menu; history and calendar live under 더보기
    const more = on === 'settings' || on === 'history' || on === 'calendar';
    return `<nav class="nav nav5"><button data-act="nav" data-to="home">${I.home}<span>이번 주 여정</span></button><button data-act="goSetup">${I.target}<span>탐험하기</span></button><button data-act="campView">${MAP_IC}<span>베이스캠프</span></button><button data-act="editGuide">${I.chat}<span>친구들</span></button><button class="${more ? 'on' : ''}" data-act="nav" data-to="settings" aria-current="${more}">${I.gear}<span>더보기</span></button></nav>`;
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
      <div class="top"><button class="back" data-act="nav" data-to="home" aria-label="뒤로">${I.back}</button><h1>오늘 목표 정하기</h1><span class="step">1 / 2</span></div>
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
  const guideScene = g => `<div class="ob-scene g-scene" aria-hidden="true"><img class="g-fig" src="${g.img}" alt=""></div>`;
  function vBrief() {
    const p = S.plan; const g = guide();
    return `<section class="screen warm">
      <div class="top"><button class="back" data-act="nav" data-to="setup1" aria-label="뒤로">${I.back}</button><h1>탐험 확인</h1><span class="step">2 / 2</span></div>
      <h2 class="page-title">오늘의 탐험, 접수!</h2>
      <div class="grow">
        <div class="card brief">
          <div class="brief-row"><span>탐험</span><b>${p.tasks.map(t => esc(taskLabel(t))).join('<br>')}</b></div>
          <div class="brief-row"><span>목표 시간</span><b>${targetMin()}분</b></div>
          <div class="brief-row"><span>집중 음악</span><b>${BGMS.find(b => b[0] === p.bgm)[1]}</b></div>
        </div>
        ${guideScene(g)}
        <div class="guide-say"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>${esc(g.signature)} 준비됐으면 바로 출발!</div></div>
      </div>
      <div class="cta-row" style="margin-top:10px"><button class="cta ghost" data-act="preShare">응원 요청</button><button class="cta" data-act="start">탐험 시작!</button></div>
    </section>`;
  }
  function clockSVG() {
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? 78 : 82, r2 = 86; ticks += `<line x1="${(100 + r1 * Math.sin(a)).toFixed(2)}" y1="${(100 - r1 * Math.cos(a)).toFixed(2)}" x2="${(100 + r2 * Math.sin(a)).toFixed(2)}" y2="${(100 - r2 * Math.cos(a)).toFixed(2)}" stroke="#141414" stroke-width="${big ? 3 : 1.2}" stroke-linecap="round"/>`; }
    for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; nums += `<text x="${(100 + 64 * Math.sin(a)).toFixed(2)}" y="${(100 - 64 * Math.cos(a) + 7.6).toFixed(2)}" text-anchor="middle" font-size="22" font-weight="800" fill="#141414" font-family="Pretendard Variable, Pretendard, sans-serif" letter-spacing="-.5">${h}</text>`; }
    return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="현재 시각 시계">
      <defs>
        <linearGradient id="rimO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1eee8"/><stop offset="1" stop-color="#c9c2b6"/></linearGradient>
        <linearGradient id="rimI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc8bc"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
        <radialGradient id="cf" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#ffffff"/><stop offset=".8" stop-color="#fbfaf7"/><stop offset="1" stop-color="#ebe7df"/></radialGradient>
        <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>
      <circle cx="100" cy="100" r="99.5" fill="url(#rimO)"/>
      <circle cx="100" cy="100" r="92.5" fill="url(#rimI)"/>
      <circle cx="100" cy="100" r="90" fill="url(#cf)"/>
      ${ticks}${nums}
      <g fill="#141414" font-family="Pretendard Variable, Pretendard, sans-serif"><text x="100" y="70" text-anchor="middle" font-size="9.5" font-weight="800">Ready &amp; Set</text></g>
      <g stroke="#141414" stroke-width="1.1" stroke-linecap="round"><line x1="94" y1="58.5" x2="92.5" y2="56"/><line x1="100" y1="57.5" x2="100" y2="54.5"/><line x1="106" y1="58.5" x2="107.5" y2="56"/></g>
      <g id="hH"><path d="M97 112 L98.6 56 Q100 52 101.4 56 L103 112 Z" fill="#141414"/></g>
      <g id="hM"><path d="M98 114 L99.1 28 Q100 25 100.9 28 L102 114 Z" fill="#141414"/></g>
      <g id="hS"><line x1="100" y1="122" x2="100" y2="24" stroke="#f2a900" stroke-width="1.6" stroke-linecap="round"/></g>
      <circle cx="100" cy="100" r="6" fill="#f2b200" stroke="#141414" stroke-width="1.6"/>
      <path d="M22 82 A80 80 0 0 1 178 82 A90 70 0 0 0 22 82 Z" fill="url(#gloss)"/>
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
      <div class="guide-say" style="margin-bottom:12px"><img src="${g.face}" alt="${esc(g.name)}"><div class="bubble"><small>${esc(g.name)}</small>오? 녹음할 시간이군.</div></div>
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
      const D = R.duo; const q = CREW.get(D.guest);
      const said = D.steps.slice(0, D.i + 1).filter(x => x[0] !== 'exit' && x[0] !== 'gap');
      const cur = D.steps[D.i] || [];
      const who = c => c === 'm' ? g : q;
      const last = said.slice(-3);
      // entry animations play once per stage phase; a re-render for the next line must not replay them
      const ph = D.out ? 'out' : D.back ? 'back' : 'in'; const fresh = D.ph !== ph; D.ph = ph;
      const newLine = said.length !== D.shown; D.shown = said.length;   // only the line just spoken slides in
      body = `<h2>${D.done ? '오늘 목소리, 어땠냐면…' : D.out ? '후다닥!' : '잠깐만요…'}</h2>
        <div class="duo-stage ${D.out ? 'out' : ''} ${D.back ? 'back' : ''}" aria-hidden="true">
          <img class="fig m ${fresh && !D.out ? 'enter' : ''} ${cur[0] === 'm' && !fresh ? 'talk' : ''}" src="${g.img}" alt="">
          ${D.back ? `<img class="fig g ${fresh ? 'enter' : ''} ${cur[0] === 'g' && !fresh ? 'talk' : ''}" src="${q.img}" alt="">` : ''}
          ${D.out ? '<span class="dust"></span>' : ''}
        </div>
        <div class="duo" aria-live="polite">${last.map(([c, k], j) => `<div class="ln ${c === 'm' ? '' : 'r'} ${newLine && j === last.length - 1 ? 'new' : ''}"><img src="${who(c).face}" alt="${esc(who(c).name)}"><div class="bubble"><small>${esc(who(c).name)}</small>${esc(REC_TXT[k])}</div></div>`).join('')}</div>
        ${D.done ? '' : '<button class="link-btn duo-skip" data-act="duoSkip">넘기기</button>'}
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
      <div class="top"><h1>더보기</h1></div>
      <div class="grow" style="overflow-y:auto">
        <div class="card">
          <div class="set-row"><span>탐험 기록</span><button class="link-btn" data-act="nav" data-to="history">${S.records.length}개 보기 ›</button></div>
          <div class="set-row"><span>탐험 일지</span><button class="link-btn" data-act="nav" data-to="calendar">달력 열기 ›</button></div>
        </div>
        <div class="card" data-taky-card>
          <div class="set-row"><span>가족 탐험대</span><button class="link-btn" data-act="takyFamily">${globalThis.TAKY_FAMILY_RUNTIME ? '합류 완료 ›' : UI.takyExpired ? '다시 합류 ›' : '합류하기 ›'}</button></div>
          <div class="set-row"><span>탐험가 카드</span><b data-taky-character>${esc(takyCharacterLine(p))}</b></div>
        </div>
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
  /* ---------- GUIDE first journey (mockup "GUIDE 1~8": crew intro → companion → photo+name tag → item+vibe → sail/fall → island → basecamp → ready) ---------- */
  // Painted backgrounds: drop rs/scenes/<key>.webp and list the key here; until then a vector plate is drawn.
  const SCENE_FILES = ['camp', 'island', 'base', 'sea', 'sky', 'vibe-curious', 'vibe-calm', 'vibe-bold', 'vibe-warm', 'home-header'];
  const OB_STEPS = ['ob1', 'ob2', 'ob3', 'ob4', 'obArrival', 'ob5', 'ob6', 'ob7', 'ob8'];
  // Item art cut from approved mockup 02 (rs/items/*.webp, see rs/art/PROVENANCE.json).
  const ITEMS = [['camera', '카메라'], ['compass', '나침반'], ['notebook', '탐험 노트'], ['binoculars', '쌍안경'], ['bottle', '물통']];
  // Character direction: the child picks two vibes, the guide adds a contrasting third; the three become A/B/C.
  const VIBE_DIR = { curious: ['호기심 많은 탐험가', '음…! 더 재밌는 게 기다리고 있어!'], calm: ['차분하고 든든한 탐험가', '천천히 가도, 끝까지 갈 수 있어!'], bold: ['에너지 넘치는 탐험가', '언제나, 더 멀리! 더 즐겁게!'], warm: ['밝고 다정한 탐험가', '좋은 친구들과 어디든 갈 수 있어!'] };
  const VIBE_PAIR = { curious: 'calm', calm: 'bold', bold: 'calm', warm: 'curious' };
  const vibeSys = picks => { if (picks.length < 2) return ''; for (const k of picks) { const o = VIBE_PAIR[k]; if (!picks.includes(o)) return o; } return VIBES.map(v => v[0]).find(k => !picks.includes(k)); };
  const vibeDirs = d => { const p = (d.vibes || []).slice(0, 2); return p.length === 2 ? [...p, d.vibeSys || vibeSys(p)] : ['warm', 'curious', 'bold']; };
  const VIBES = [['curious', '호기심 가득', '새로운 것을 발견'], ['calm', '평화로운', '여유롭게, 천천히'], ['bold', '도전적인', '더 멀리, 더 높이'], ['warm', '따뜻한', '함께, 우정으로']];
  function plate(kind) {
    const sky = { camp: ['#9cc9ef', '#e9f3fb'], island: ['#8cc6ee', '#e6f4fb'], base: ['#f2c58e', '#fbe7cf'], sea: ['#9fd2f2', '#eaf6fc'], sky: ['#7fb6ea', '#dceefb'] }[kind] || ['#9cc9ef', '#e9f3fb'];
    const mtn = `<path d="M0 250 L70 170 L120 205 L190 120 L250 190 L300 150 L360 210 L400 180 V400 H0Z" fill="#6f8fbf" opacity=".55"/><path d="M190 120 L172 146 L186 142 L196 152 L206 138 L212 140Z" fill="#fff" opacity=".9"/><path d="M0 285 L60 225 L110 255 L170 200 L230 250 L290 215 L350 262 L400 236 V400 H0Z" fill="#4f6ea3" opacity=".75"/>`;
    const pines = (y, c) => [12, 40, 66, 330, 356, 384].map((x, i) => `<path d="M${x} ${y - 46 - (i % 2) * 10} L${x - 13} ${y} H${x + 13}Z" fill="${c}"/>`).join('');
    let mid = '';
    if (kind === 'island' || kind === 'sea') mid = `<rect y="270" width="400" height="130" fill="#3f86c2"/><path d="M0 300 Q50 292 100 300 T200 300 T300 300 T400 300" stroke="#bfe3fa" stroke-width="3" fill="none" opacity=".7"/><path d="M0 340 Q50 332 100 340 T200 340 T300 340 T400 340" stroke="#bfe3fa" stroke-width="3" fill="none" opacity=".5"/>`
      + (kind === 'island' ? `<path d="M110 282 Q150 190 205 200 Q240 150 285 206 Q318 230 330 282Z" fill="#4c8a52"/><path d="M180 282 Q200 232 236 236 Q258 240 270 282Z" fill="#7a6a58"/><path d="M96 284 H344 Q300 296 220 296 Q140 296 96 284Z" fill="#f1dfb0"/>${[160, 214, 262].map((x, i) => `<path d="M${x} ${222 - i * 8} L${x - 10} ${250 - i * 4} H${x + 10}Z" fill="#2f6b3f"/>`).join('')}` : '');
    else if (kind === 'base') mid = `<rect y="300" width="400" height="100" fill="#7a5a3a"/><path d="M120 300 V214 L200 168 L280 214 V300Z" fill="#9b6b42" stroke="#5a3a22" stroke-width="5"/><path d="M110 218 L200 160 L290 218" fill="none" stroke="#5a3a22" stroke-width="10" stroke-linecap="round"/><rect x="180" y="248" width="40" height="52" rx="4" fill="#5a3a22"/><rect x="138" y="232" width="28" height="24" rx="3" fill="#ffd27a"/><rect x="234" y="232" width="28" height="24" rx="3" fill="#ffd27a"/><path d="M200 168 V108" stroke="#5a3a22" stroke-width="4"/><path d="M200 110 H246 L236 124 L246 138 H200Z" fill="#203f86"/><path d="M212 132 L222 118 L232 132Z" fill="#fff"/>${[52, 348].map(x => `<path d="M${x} 300 L${x - 34} 300 L${x} 248 L${x + 34} 300Z" fill="#203f86" opacity=".9"/>`).join('')}`;
    else mid = `<rect y="292" width="400" height="108" fill="#6aa0d0"/><path d="M0 292 H400" stroke="#cfe6f6" stroke-width="3"/>`;
    if (kind === 'sky') mid = `<rect y="318" width="400" height="82" fill="#3f86c2"/><path d="M140 322 Q190 270 250 322Z" fill="#4c8a52"/>${[60, 300].map(x => `<ellipse cx="${x}" cy="120" rx="44" ry="16" fill="#fff" opacity=".85"/>`).join('')}`;
    return `<svg class="plate" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sk-${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="400" height="400" fill="url(#sk-${kind})"/>${kind === 'sky' ? '' : mtn}${mid}${kind === 'base' || kind === 'camp' ? pines(kind === 'base' ? 300 : 292, '#2f5b45') : ''}</svg>`;
  }
  const sceneBg = k => SCENE_FILES.includes(k) ? `<img class="plate" src="rs/scenes/${k}.webp?v=20261107g" alt="">` : plate(k);
  const gdHead = (n, t, sub) => `<header class="gd-head${n ? '' : ' no-step'}">${n ? `<span class="gd-no">${n}</span>` : ''}<h1>${t}</h1><p>${sub}</p></header>`;
  const gdDots = n => `<div class="gd-dots" aria-label="${n}/8 단계">${Array.from({length: 5}, (_, i) => `<i class="${i < Math.ceil(n * 5 / 8) ? 'on' : ''}"></i>`).join('')}</div>`;
  const arrow = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const gdCta = (act, label, ok) => `<button class="gd-cta" id="obNext" data-act="${act}" ${ok ? '' : 'disabled'}>${label}${arrow}</button>`;
  const INTRO_LINES = ['언제나, 해보자!', '새상을 더 귀엽게!', '좋은 생각이 떠올라', '더 멀리, 더 높이!', '지금이 바로 그때!', '서로 다른 우리가, 더 멋지잖아!'];
  const guideNick = d => (d.guideNick || '').trim() || CREW.get(d.guide).name;
  function obOk(d, s) {
    if (s === 'ob3') return !!d.nickname.trim();
    if (s === 'ob4') return !!(d.item && (d.vibes || []).length === 2);
    if (s === 'ob5') return !!d.theme;
    return true;
  }
  // On-device cartoon look for the child's photo (no upload): smooth, posterize, ink edges, per-style tint.
  function toonify(src, v) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => {
        const S = 240, c = document.createElement('canvas'); c.width = c.height = S;
        const x = c.getContext('2d'), m = Math.min(im.width, im.height);
        x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S);
        const d = x.getImageData(0, 0, S, S), p = d.data;
        let b = new Uint8ClampedArray(p);
        for (let pass = 0; pass < 2; pass++) {
          const a = b.slice();
          for (let y = 1; y < S - 1; y++) for (let q = 1; q < S - 1; q++) for (let k = 0; k < 3; k++) {
            let t = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) t += a[((y + dy) * S + q + dx) * 4 + k];
            b[(y * S + q) * 4 + k] = t / 9;
          }
        }
        const g = new Float32Array(S * S);
        for (let i = 0; i < S * S; i++) g[i] = b[i * 4] * .3 + b[i * 4 + 1] * .59 + b[i * 4 + 2] * .11;
        const T = { warm: [1.06, 1.0, .9, 1.25], curious: [.96, 1.0, 1.06, 1.2], calm: [.92, 1.0, 1.08, 1.05], bold: [1.1, .98, .88, 1.45] }[v] || [1, 1, 1, 1.2];
        const qz = n => Math.min(255, Math.round(n / 42) * 42 + 18);
        for (let y = 0; y < S; y++) for (let q = 0; q < S; q++) {
          const i = y * S + q;
          const e = (y > 0 && q > 0 && y < S - 1 && q < S - 1) ? Math.hypot(g[i + 1] - g[i - 1], g[i + S] - g[i - S]) : 0;
          let r = b[i * 4], gg = b[i * 4 + 1], bb = b[i * 4 + 2]; const l = (r + gg + bb) / 3;
          r = l + (r - l) * T[3]; gg = l + (gg - l) * T[3]; bb = l + (bb - l) * T[3];
          const ink = e > 26 ? .4 : 1;
          p[i * 4] = qz(r * T[0]) * ink; p[i * 4 + 1] = qz(gg * T[1]) * ink; p[i * 4 + 2] = qz(bb * T[2]) * ink;
        }
        x.putImageData(d, 0, 0); res(c.toDataURL('image/jpeg', .86));
      };
      im.onerror = rej; im.src = src;
    });
  }
  // AI 2.5D characters (server function, paid, locked until Taky turns it on). Falls back to the on-device toon.
  function aiCharacters(d, dirs, key) {
    if (UI.ai && UI.ai.key === key) return;
    UI.ai = { key, state: 'pending' };
    fetch('/api/rs-character', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo: d.photo, dirs, hood: d.hood || 'navy', item: d.item, confirmCost: true }) })
      .then(r => r.json().then(j => ({ r, j })))
      .then(async ({ r, j }) => {
        if (!UI.ai || UI.ai.key !== key) return;
        if (r.ok && j.ok && Array.isArray(j.images)) { UI.ai.full = j.images.slice(0, 3); UI.ai.imgs = await Promise.all(j.images.map(src => shrink(src, 384))); UI.ai.state = 'done'; }
        else UI.ai.state = r.status === 423 ? 'locked' : 'error';
        if (UI.screen === 'obArrival') render();
      })
      .catch(() => { if (UI.ai && UI.ai.key === key) { UI.ai.state = 'error'; if (UI.screen === 'obArrival') render(); } });
  }
  function shrink(src, w) {
    return new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = Math.round(im.height * w / im.width); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .85)); }; im.onerror = () => res(src); im.src = src; });
  }
  function vOb() {
    const d = UI.draft; const s = UI.screen; const g = CREW.get(d.guide);
    const wrap = (bg, body) => `<section class="screen gd gd-${s}"><div class="gd-bg">${sceneBg(bg)}</div><div class="gd-card">${body}</div></section>`;
    if (s === 'ob1') {
      const say = CREW.core[UI.obSay || 0];
      return wrap('camp', `${gdHead(1, '탐험대원 자기소개', '우리와 함께할 친구들을 만나보세요!')}
        <div class="gd-stage">
          <div class="crew-line">${[[1, 3, 44, 46, 1], [2, 31, 46, 44, 1], [4, 57, 44, 46, 1], [3, -1, 0, 52, 3], [0, 28, 0, 56, 4], [5, 59, 0, 52, 3]].map(([i, l, bt, h, z]) => `<button class="${(UI.obSay || 0) === i ? 'on' : ''}" data-act="obSay" data-i="${i}" style="left:${l}%;bottom:${bt}%;height:${h}%;width:${Math.round(h * .82)}%;z-index:${z}" aria-label="${esc(CREW.core[i].name)} 인사 듣기"><img src="${CREW.core[i].img}" alt=""></button>`).join('')}</div>
          <div class="gd-bubble top"><b>${esc(say.name)}</b>“${INTRO_LINES[UI.obSay || 0]}”</div>
        </div>
        <p class="gd-hand">좋은 친구들과 어디든 갈 수 있어!</p>
        ${gdDots(1)}${gdCta('obGo', '다음으로', true)}`);
    }
    if (s === 'ob2') {
      const page = UI.obPage; const list = CREW.all.slice(page * 6, page * 6 + 6);
      return wrap('camp', `${UI.obEdit ? `<button class="gd-back" data-act="nav" data-to="settings" aria-label="뒤로">${I.back}</button>` : ''}${gdHead(UI.obEdit ? 0 : 2, UI.obEdit ? '동행 탐험대원 바꾸기' : '동행 탐험대원 선택', '함께할 탐험대원을 한 명 선택해주세요.')}
        <div class="gd-stage pick">
          <button class="gd-arr l" data-act="obStep" data-d="-1" aria-label="이전 친구">‹</button>
          <img class="gd-fig" src="${g.img}" alt="${esc(g.name)}">
          <button class="gd-arr r" data-act="obStep" data-d="1" aria-label="다음 친구">›</button>
          <div class="gd-bubble side"><b>${esc(g.name)}</b>“${esc(INTRO_LINES[CREW.core.indexOf(g)] || g.signature)}”</div>
        </div>
        <div class="gd-faces">${list.map(c => `<button class="${d.guide === c.id ? 'on' : ''}" data-act="pickGuide" data-id="${c.id}" aria-pressed="${d.guide === c.id}"><img src="${c.face}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div>
        <div class="gd-pager">${[0, 1, 2, 3].map(i => `<button class="${page === i ? 'on' : ''}" data-act="obPage" data-i="${i}">${i ? `${i * 6 + 1}~${i * 6 + 6}` : '탐험대 6'}</button>`).join('')}</div>
        <p class="gd-label">이름을 정해주세요!</p><div class="gd-names"><label>기본 이름<input class="gd-field" value="${esc(g.name)}" readonly></label><label>표시할 이름(닉네임)<span class="gd-clear-field"><input class="gd-field" data-draft="guideNick" value="${esc(d.guideNick)}" placeholder="${esc(g.name)}" maxlength="8" autocomplete="off"><button data-act="obClear" data-k="guideNick" aria-label="닉네임 지우기">×</button></span></label></div>
        <p class="gd-hand">좋은 친구와, 특별한 여정이 시작돼요!</p>${UI.obEdit ? '' : gdDots(2)}${gdCta(UI.obEdit ? 'guideSave' : 'obGo', UI.obEdit ? '이 친구로 바꿀게요' : '이 친구와 함께할게요!', true)}`);
    }
    if (s === 'ob3') {
      return wrap('camp', `${gdHead(3, '사진 찍기 / 사진 보관함 등록', '지금의 너를 기록해요. 탐험 여정에 특별한 추억이 될 거예요!')}
        <div class="gd-photo pd"><img class="pd-bg" src="rs/art/photo-desk.webp?v=20261107g" alt=""><div class="pd-frame">${d.photo ? `<img src="${d.photo}" alt="내 사진">` : `<span class="pd-empty"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="4"/></svg>내 사진</span>`}</div></div>
        <div class="gd-photo-btns"><label class="gd-btn navy"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="4"/></svg>사진 찍기<input type="file" accept="image/*" capture="user" data-photo hidden></label><label class="gd-btn">사진 보관함에서 선택<input type="file" accept="image/*" data-photo hidden></label></div><div class="photo-recent" aria-label="이 기기에서 고른 최근 사진">${Array.from({length:4},(_,i)=>(d.recentPhotos||[])[i]?`<button data-act="obRecent" data-i="${i}" aria-label="최근 사진 ${i+1} 선택"><img src="${d.recentPhotos[i]}" alt="최근 사진 ${i+1}"></button>`:`<span aria-label="빈 사진 자리">${I.book}</span>`).join('')}</div>
        <p class="gd-preview">이 사진은 탐험 여정 속에서 프로필로 사용돼요!</p><div class="gd-names"><label>닉네임 <small>공유할 때 앞</small><input class="gd-field" data-draft="nickname" value="${esc(d.nickname)}" placeholder="예: 별이" maxlength="10" autocomplete="off"></label><label>이름 <small>괄호 안</small><input class="gd-field" data-draft="name" value="${esc(d.name)}" placeholder="예: 김하늘" maxlength="10" autocomplete="off"></label></div>
        <p class="gd-preview">공유 이름: <b id="pvName">${esc(shareName({ nickname: d.nickname.trim(), name: d.name.trim() }) || '닉네임(이름)')}</b></p>
        ${gdDots(3)}${gdCta('obGo', '다음으로', obOk(d, s))}`);
    }
    if (s === 'obArrival') {
      const choice = d.character || 'A', hood = d.hood || 'navy';
      const dirs = vibeDirs(d), tk = d.photo + '|' + dirs.join();
      if (d.photo && !(UI.toon && UI.toon.key === tk)) { UI.toon = { key: tk, v: [] }; Promise.all(dirs.map(v => toonify(d.photo, v))).then(v => { if (UI.toon && UI.toon.key === tk) { UI.toon.v = v; if (UI.screen === 'obArrival') render(); } }).catch(() => {}); }
      if (d.photo) aiCharacters(d, dirs, tk);
      const ai = UI.ai && UI.ai.key === tk ? UI.ai : null;
      const charImg = i => (ai && ai.imgs && ai.imgs[i]) || (UI.toon && UI.toon.key === tk && UI.toon.v[i]) || d.photo;
      return wrap('camp', `${gdHead('4+', '나의 캐릭터 도착!', '고른 느낌 두 개와 길잡이가 더한 하나로 만든 모습이에요.')}
        <div class="arrival-cards hood-${hood}">${dirs.map((v, i) => ['ABC'[i], VIBE_DIR[v][0], VIBE_DIR[v][1]]).map(([k,t,q],i)=>`<button data-act="obCharacter" data-k="${k}" class="${choice===k?'on':''}" aria-pressed="${choice===k}" aria-label="${k} ${t}"><span class="ac-tag"><b>${k}</b>${t}</span><i class="ac-check" aria-hidden="true">✓</i>${d.photo ? `<span class="ac-me ${ai && ai.imgs ? 'ai' : ''}"><img src="${charImg(i)}" alt="${k} 모습의 나"></span>` : `<img src="${CREW.core[i].img}" alt="">`}<em>“${q}”</em></button>`).join('')}</div>
        ${d.photo && ai && ai.state === 'pending' ? '<p class="ai-note" role="status">AI가 너의 2.5D 캐릭터를 그리는 중이에요… (1분쯤 걸려요)</p>' : ''}
        <div class="arrival-crew" aria-hidden="true">${CREW.core.map(c=>`<img src="${c.img}" alt="">`).join('')}<p>다른 우리가,<br>더 멋진 이야기를 만든다!</p></div>
        <p class="gd-label">후드 색상</p><div class="hood-options">${[['navy','네이비'],['gold','골드'],['forest','숲 초록'],['rose','로즈']].map(([k,n])=>`<button class="hood-${k} ${hood===k?'on':''}" data-act="obHood" data-k="${k}" aria-pressed="${hood===k}" aria-label="${n}"><i></i><span>${n}</span></button>`).join('')}</div>
        <p class="gd-hand">나만의 모습으로, 새로운 이야기를 시작해요!</p>
        ${gdCta('obGo', '이 모습으로 함께할게요!', true)}`);
    }
    if (s === 'ob4') {
      return wrap('camp', `${gdHead(4, '아이템 선정 + 느낌 고르기', '탐험에 꼭 필요한 아이템 하나와, 너다운 느낌 두 개를 골라보세요! 길잡이가 하나를 더해 너만의 캐릭터 세 가지를 만들어요.')}
        <p class="gd-label">탐험 아이템 <small>(하나만 선택)</small></p>
        <div class="gd-items">${ITEMS.map(([k, n]) => `<button class="${d.item === k ? 'on' : ''}" data-act="obItem" data-k="${k}" aria-pressed="${d.item === k}"><img src="rs/items/${k}.webp?v=20261107g" alt=""><span>${n}</span></button>`).join('')}</div>
        <p class="gd-label">어떤 느낌이 더 너 같아? <small>두 개 고르면, 세 번째는 ${esc(josa(guideNick(d), '이', '가'))} 골라줘요</small></p>
        <div class="gd-vibes">${(() => { const pk = d.vibes || [], sy = vibeSys(pk); return VIBES.map(([k, n, t]) => { const i = pk.indexOf(k), sys = sy === k; return `<button class="v-${k} ${i >= 0 ? 'on' : ''} ${sys ? 'sys' : ''}" data-act="obVibe" data-k="${k}" aria-pressed="${i >= 0}" ${i < 0 && pk.length >= 2 ? 'disabled' : ''}>${i >= 0 ? `<em class="v-no">${i + 1}</em>` : sys ? `<em class="v-no g">${esc(guideNick(d))} 픽</em>` : ''}<i style="background-image:url(rs/scenes/vibe-${k}.webp)"></i><b>${n}</b><span>${t}</span></button>`; }).join(''); })()}</div>
        <p class="gd-hand">${(d.vibes || []).length === 2 ? '좋아! 이 세 가지 느낌으로 너의 모습을 만들어 볼게!' : '이제, 너만의 탐험대 캐릭터가 준비되고 있어요!'}</p>
        ${gdDots(4)}${gdCta('obGo', '다음으로', obOk(d, s))}`);
    }
    if (s === 'ob5') {
      return wrap('sea', `${gdHead(5, '항해모드 / 낙하모드 선택', '어떻게 이 섬에 도착하고 싶나요? 두 가지 방법 중 하나를 선택해보세요!')}
        <div class="gd-modes">
          <button class="${d.theme === '항해' ? 'on' : ''}" data-act="obTheme" data-t="항해" aria-pressed="${d.theme === '항해'}"><div class="mode-pic">${sceneBg('sea')}</div><b>항해모드</b><span>바람을 따라, 천천히 세상을 만나며 도착해요.</span></button>
          <button class="${d.theme === '낙하' ? 'on' : ''}" data-act="obTheme" data-t="낙하" aria-pressed="${d.theme === '낙하'}"><div class="mode-pic">${sceneBg('sky')}</div><b>낙하모드</b><span>하늘에서 내려다보며 힘차게 도착해요.</span></button>
        </div>
        <p class="gd-hand">어떤 방법으로 가든, 멋진 모험이 기다리고 있어요!</p>
        ${gdDots(5)}${gdCta('obGo', '이 방법으로 출발할게요!', obOk(d, s))}`);
    }
    if (s === 'ob6' || s === 'ob7') {
      const isl = s === 'ob6';
      return wrap(isl ? 'island' : 'base', `${gdHead(isl ? 6 : 7, isl ? '섬 발견 + 섬 이름 짓기' : '베이스 캠프 이동 + 이름짓기', isl ? '드디어, 첫 번째 섬에 도착했어요! 이 특별한 섬의 이름을 지어주세요.' : '이제, 우리의 베이스 캠프로 함께해요! 여기서 더 많은 이야기가 시작될 거예요.')}
        <div class="gd-stage open"><div class="gd-bubble float">${isl ? '새로운 이야기가 시작되는 곳!' : '좋은 친구들과 더 많은 이야기를 만들어가자!'}</div><img class="gd-mini" src="${g.img}" alt=""></div>
        <div class="gd-sign"><p>${isl ? '이 섬의 이름은?' : '우리의 베이스 캠프 이름은?'}</p><span class="gd-clear-field"><input class="gd-field" data-draft="${isl ? 'island' : 'camp'}" value="${esc(isl ? d.island : d.camp)}" placeholder="${isl ? '반짝이는 섬' : '하늘빛 캠프'}" maxlength="12" aria-label="${isl ? '섬 이름' : '베이스 캠프 이름'}" autocomplete="off"><button data-act="obClear" data-k="${isl ? 'island' : 'camp'}" aria-label="이름 지우기">×</button></span></div>
        <p class="gd-hand">${isl ? '멋진 이름이에요! 이곳에서 어떤 이야기가 펼쳐질까요?' : '멋진 베이스 캠프! 이제, 진짜 탐험이 시작돼요!'}</p>
        ${gdDots(isl ? 6 : 7)}${gdCta('obGo', isl ? '다음으로' : '탐험을 시작해요!', true)}`);
    }
    const isl = d.island.trim() || '반짝이는 섬'; const camp = d.camp.trim() || '하늘빛 캠프';
    return wrap('base', `${UI.campVisit ? gdHead(0, '베이스 캠프', '같은 하늘 아래, 더 멋진 이야기를 함께!') : gdHead(8, '탐험 준비 완료!', '같은 하늘 아래, 더 멋진 이야기를 함께!')}
      <div class="gd-ready-tools"><span aria-label="알림"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 20h4"/></svg></span><img src="${obAvatar(d) || d.photo || g.face}" alt="내 프로필"></div><div class="gd-ready">
        <div class="hello"><small>안녕, ${esc(guideNick(d))}와 함께하는</small><b>${esc(camp)}!</b><span>${esc(shareName({ nickname: d.nickname.trim(), name: d.name.trim() }))}, 오늘도 좋은 하루, 탐험할 준비 되셨나요?</span></div>
        <div class="buddy"><div class="gd-bubble">좋은 친구와 어디든 갈 수 있어!<small>- ${esc(guideNick(d))}</small></div><img src="${g.img}" alt=""></div>
      </div>
      <div class="gd-tiles">
        <button data-act="welcomeNav" data-to="setup1">${I.target}<b>오늘의 탐험</b><span>새로운 이야기를 만나보세요</span></button>
        <button data-act="welcomeNav" data-to="island">${I.sail}<b>나의 섬</b><span>${esc(isl)}</span></button>
        <button data-act="welcomeNav" data-to="home">${I.home}<b>베이스 캠프</b><span>${esc(camp)}</span></button>
        <button data-act="welcomeNav" data-to="history">${I.book}<b>탐험 노트</b><span>기록하고, 되돌아봐요</span></button>
      </div>
      <div class="gd-banner">${sceneBg('island')}<p>지금, 어떤 이야기를 시작할까요?</p></div>
      ${gdCta('obDone', '탐험하기', true)}<nav class="gd-welcome-nav" aria-label="탐험 안내">${[['home','홈',I.home],['setup1','탐험',I.target],['island','섬 지도',I.sail],['friends','친구들',I.chat],['settings','더보기',I.gear]].map(([k,n,icon])=>`<button data-act="welcomeNav" data-to="${k}">${icon}<span>${n}</span></button>`).join('')}</nav>`);
  }
  // No-cost character (Taky 11/06): the photo goes to the parent as a private request; the parent makes the
  // character in TAKY Mobile and approves it. Ready never publishes a master; it reads the approved one back.
  // S.profile.takyCharacter = { state: NEED_PHOTO_SEND | REQUESTED | MASTER_READY | ..., version, at }
  function takyMark(state, extra) {
    if (!S.profile) return; S.profile.takyCharacter = Object.assign({}, S.profile.takyCharacter, { state, at: new Date().toISOString() }, extra || {}); save();
    const line = document.querySelector('[data-taky-character]'); if (line) line.textContent = takyCharacterLine(S.profile);
  }
  async function takySync() {
    const sync = globalThis.RsTakyCharacterSync; const p = S.profile; if (!sync || !p || UI.takyBusy) return;
    UI.takyBusy = true;
    if (!p.takyCharacter && p.photo) p.takyCharacter = { state: 'NEED_PHOTO_SEND' };   // profiles made before this flow
    try {
      if ((p.takyCharacter || {}).state === 'NEED_PHOTO_SEND' && p.photo) {
        const sent = await sync.requestCharacter({ photo: p.photo });
        if (sent.state === 'PENDING_TAKY_SESSION') return;
        if (sent.state === 'SESSION_EXPIRED') return takyExpired();
        takyMark(sent.ok ? 'REQUESTED' : 'NEED_PHOTO_SEND', { error: sent.ok ? null : sent.state });
        if (!sent.ok) return;
      }
      const st = await sync.characterStatus({});
      if (st.state === 'SESSION_EXPIRED') return takyExpired();
      if (!st.ok) return;
      if (st.image && st.version && st.version !== (p.takyCharacter || {}).version) {
        if (!p.avatarLocal) p.avatarLocal = p.avatar || '';
        p.avatar = st.image; takyMark(st.state, { version: st.version, error: null });
        if (UI.screen === 'home' || UI.screen === 'settings') render(); toast('탐험본부에서 내 탐험가 카드가 날아왔어요!');
      } else if ((p.takyCharacter || {}).state !== st.state && !(st.image === null && /^MASTER/.test(st.state))) takyMark(st.state);
    } finally { UI.takyBusy = false; }
  }
  // Google sign-in lasts about an hour. When it runs out, drop the stale session and say so in the
  // expedition voice instead of failing silently; the photo/card state is kept and resumes on re-join.
  function takyExpired() {
    UI.takyExpired = true;
    try { globalThis.RsTakyFamily && globalThis.RsTakyFamily.expire(); } catch {}
    const line = document.querySelector('[data-taky-character]'); if (line) line.textContent = takyCharacterLine(S.profile);
    if (UI.screen === 'settings') render();
    toast('탐험본부 무전이 끊겼어요. 더보기에서 다시 합류해 줘요!');
  }
  globalThis.addEventListener('taky-central-auth-ready', () => { UI.takyExpired = false; if (UI.screen === 'settings') render(); void takySync(); });
  globalThis.addEventListener('taky-central-auth-cleared', () => { if (UI.screen === 'settings') render(); });
  // Coming back to the app is when a parent-approved character usually becomes visible (no polling loop).
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && globalThis.TAKY_FAMILY_RUNTIME) void takySync(); });
  function takyCharacterLine(p) {
    const t = (p && p.takyCharacter) || (p && p.photo ? { state: 'NEED_PHOTO_SEND' } : {}), linked = !!globalThis.TAKY_FAMILY_RUNTIME;
    if (t.state === 'MASTER_READY_NEW_REQUEST') return `새 카드 그리는 중 · 지금은 No.${t.version || 1}`;
    if (/^MASTER_READY/.test(t.state || '')) return `탐험가 카드 No.${t.version || 1} 도착!`;
    if (t.state === 'REQUESTED') return '탐험본부에서 내 카드 그리는 중 ✎';
    if (t.state === 'NEED_PHOTO_SEND') return linked ? '사진이 탐험본부로 날아가는 중…' : UI.takyExpired ? '다시 합류하면 사진이 출발해요' : '탐험대에 합류하면 사진이 출발해요';
    return linked ? '아직 탐험가 카드가 없어요' : '탐험대 합류 전';
  }
  function obAvatar(d) {
    const dirs = vibeDirs(d), tk = d.photo + '|' + dirs.join(), i = 'ABC'.indexOf(d.character || 'A');
    return (UI.ai && UI.ai.key === tk && UI.ai.imgs && UI.ai.imgs[i]) || (UI.toon && UI.toon.key === tk && UI.toon.v[i]) || '';
  }
  async function obPhoto(file) {
    if (!file) return;
    try {
      const url = URL.createObjectURL(file); const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      const side = Math.min(img.naturalWidth, img.naturalHeight); const c = document.createElement('canvas'); c.width = c.height = 320;
      c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 320, 320);
      URL.revokeObjectURL(url); UI.draft.photo = c.toDataURL('image/jpeg', .82); UI.draft.recentPhotos = [UI.draft.photo, ...(UI.draft.recentPhotos || []).filter(p => p !== UI.draft.photo)].slice(0, 4); render();
    } catch (e) { toast('사진을 불러오지 못했어요. 다른 사진으로 해 볼까요?'); }
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

  // Fetch every scene plate once, early and off the critical path, so ob4-ob8 never show an empty frame while a 150KB plate downloads.
  let scenesWarm = false;
  function preloadScenes() {
    if (scenesWarm) return; scenesWarm = true;
    const go = () => SCENE_FILES.forEach(k => { const i = new Image(); i.decoding = 'async'; i.src = `rs/scenes/${k}.webp?v=20261107g`; (window.__rsWarm = window.__rsWarm || []).push(i); });
    (window.requestIdleCallback || (f => setTimeout(f, 400)))(go);
  }
  function render() {
    if (!S.profile && !/^ob/.test(UI.screen || '')) { UI.draft = UI.draft || { name: '', nickname: '', guide: 'dubi', guideNick: '', photo: '', item: '', vibe: '', theme: '', island: '', camp: '' }; UI.screen = 'ob1'; UI.obSay = 0; }
    if (S.session && !['focus', 'record'].includes(UI.screen)) UI.screen = 'focus';
    const v = { home: vHome, setup1: vSetup1, setup2: vBrief, brief: vBrief, focus: vFocus, record: vRecord, result: vResult, history: vHistory, calendar: vCalendar, settings: vSettings, ob1: vOb, ob2: vOb, ob3: vOb, obArrival: vOb, ob4: vOb, ob5: vOb, ob6: vOb, ob7: vOb, ob8: vOb }[UI.screen] || vHome;
    let html = v();
    if (UI.ov === 'sheet') html += vSheet();
    if (UI.ov === 'pause') html += vPauseOv();
    if (UI.ov === 'end') html += vEndOv();
    if (UI.ov === 'recIntro') html += vRecIntro();
    if (UI.ov === 'share' && UI.share) html += vShareOv();
    if (UI.ov === 'reset') html += vResetOv();
    app.innerHTML = html;
    preloadScenes();
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
      if (rem <= 0 && !s.alerted) { s.alerted = true; save(); chime(); toast('목표 시간 돌파! 지금부터는 보너스 시간이에요', 3500); if (UI.screen === 'focus') setTimeout(() => sayScene('timeup'), 1200); }
      if (!s.midSaid && s.targetMs >= 4 * 60000 && f >= s.targetMs / 2 && rem > 0 && !isPaused(s)) { s.midSaid = true; save(); if (UI.screen === 'focus') { const t = sayScene('mid'); t && toast(`${guide().name}: ${t}`, 3200); } }
    }
  }
  setInterval(tick, 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /* ---------------- events ---------------- */
  const A = {
    homeView: e => { UI.homeView=e.dataset.k; go('home'); },
    weekMove: e => { if(UI.homeView==='day') { const date=new Date((UI.homeDay||ymd(Date.now()))+'T12:00:00'); date.setDate(date.getDate()+Number(e.dataset.d)); UI.homeDay=ymd(date); } else { UI.weekOffset=(UI.weekOffset||0)+Number(e.dataset.d); } render(); },
    wkCell: e => { UI.wkEdit = e.dataset.key; render(); },
    wkSet: e => { const i = +e.dataset.i, wk = S.week = S.week || {}; if (UI.wkEdit) { if (i < 0) delete wk[UI.wkEdit]; else { const k = WK_KINDS[i]; wk[UI.wkEdit] = { k: k.k, t: k.t, e: k.e }; } save(); } UI.wkEdit = null; render(); },
    wkClose: () => { UI.wkEdit = null; render(); },
    homeDay: e => { UI.homeDay=e.dataset.day; UI.homeView='day'; render(); },
    campView: () => { UI.draft=Object.assign({island:'반짝이는 섬',camp:'하늘빛 캠프',guideNick:'',photo:''},S.profile); UI.campVisit=true; go('ob8'); },
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
    toSetup2: () => { bgmStop(false); S.plan.moods = []; S.plan.sys = null; save(); go('brief'); },
    toBrief: () => go('brief'),
    start: () => startSession(),
    preShare: () => { if (!S.plan.tasks.length || !targetMin()) { toast('먼저 오늘 목표를 정해요'); return go('setup1'); } openShare('pre'); },
    postShare: () => { const r = S.records.find(x => x.id === S.result); if (r) openShare('post', r); },
    doShare: () => doShare(),
    music: () => { const s = S.session; if (s.bgm === 'off') { s.bgm = 'essential'; } s.bgmOn = !s.bgmOn; save(); s.bgmOn ? bgmPlay(s.bgm) : bgmPause(); render(); },
    pause: () => pauseNow(),
    reason: e => { const s = S.session; const l = s.pauses[s.pauses.length - 1]; if (l) l.reason = l.reason === e.dataset.r ? '' : e.dataset.r; save(); render(); },
    resume: () => resume(),
    endAsk: () => { UI.ov = 'end'; render(); },
    outcome: e => { const t = S.session.tasks.find(x => x.id === e.dataset.id); if (t) t.outcome = e.dataset.k; save(); render(); },
    finish: () => finalize(),
    ovClose: () => { if (UI.share && UI.share.url) URL.revokeObjectURL(UI.share.url); UI.share = null; UI.ov = null; render(); },
    recIntro: () => { bgmPause(); UI.ov = 'recIntro'; render(); sayLine(guide().id, 'rec-intro'); },
    toRecord: () => { bgmPause(); UI.rec = { phase: 'ready', takes: UI.rec.takes || [], sel: UI.rec.sel }; go('record'); },
    recStart: () => recStart(),
    recStop: () => recStop(),
    recPhase: e => { UI.rec.phase = e.dataset.p; render(); },
    recRetry: () => { duoStop(); UI.rec.phase = 'ready'; render(); },
    duoSkip: () => { const D = UI.rec.duo; duoStop(); if (D) { D.out = false; D.back = true; D.i = D.steps.length - 1; } render(); },
    play: e => { const t = UI.rec.takes[+e.dataset.i]; if (!t) return; if (AUD.take) AUD.take.pause(); AUD.take = new Audio(t.url); AUD.take.play().catch(() => toast('재생할 수 없어요')); },
    selTake: e => { UI.rec.sel = +e.dataset.i; render(); },
    recCoach: () => { const s = S.session; if (!s.guest) { s.guest = pickGuest(S.profile.guide, s.moods).id; save(); } UI.rec.phase = 'coach'; duoStart(); },
    recFinal: () => { const s = S.session; const t = UI.rec.takes[UI.rec.sel]; if (!t) return; s.recDone = true; s.recFile = recFileName(t); save(); duoStop(); UI.rec.phase = 'final'; render(); sayLine(S.profile.guide, 'rec-final'); },
    shareRec: async () => { const t = UI.rec.takes[UI.rec.sel]; if (!t) return; const name = recFileName(t); const r = await shareFile(new File([t.blob], name, { type: t.type }), name); if (r === 'shared') toast('보냈어요'); },
    backFocus: () => { duoStop(); recStop(); cleanupMic(); if (AUD.take) AUD.take.pause(); go('focus'); const s = S.session; if (s && s.bgmOn && !isPaused(s)) bgmPlay(s.bgm); },
    calMove: e => { const now = new Date(); const m = UI.calMonth || new Date(now.getFullYear(), now.getMonth(), 1); UI.calMonth = new Date(m.getFullYear(), m.getMonth() + (+e.dataset.d), 1); render(); },
    calDay: e => { UI.calSel = e.dataset.d; render(); },
    editGuide: () => { UI.draft = Object.assign({ guideNick: '' }, S.profile); UI.obEdit = true; UI.obPage = Math.floor(CREW.all.indexOf(CREW.get(S.profile.guide)) / 6); go('ob2'); },
    guideSave: () => { S.profile.guide = UI.draft.guide; S.profile.guideNick = (UI.draft.guideNick || '').trim(); save(); UI.obEdit = false; go('settings'); },
    theme: e => { S.profile.theme = e.dataset.t; save(); render(); },
    voice: () => { S.profile.voice = S.profile.voice === false; save(); render(); },
    resetAsk: () => { UI.ov = 'reset'; render(); },
    resetDo: () => { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } S = blank(); UI.draft = null; go('ob1'); },
    obGo: () => { const d = UI.draft; const i = OB_STEPS.indexOf(UI.screen); if (!obOk(d, UI.screen)) return; ['nickname', 'name', 'guideNick', 'island', 'camp'].forEach(k => { d[k] = (d[k] || '').trim(); }); go(OB_STEPS[i + 1] || 'ob8'); if (UI.screen === 'ob2') playVoice(CREW.get(d.guide)); },
    obSay: e => { UI.obSay = +e.dataset.i; render(); playVoice(CREW.core[UI.obSay]); },
    obStep: e => { const all = CREW.all; const i = (all.indexOf(CREW.get(UI.draft.guide)) + +e.dataset.d + all.length) % all.length; UI.draft.guide = all[i].id; UI.obPage = Math.floor(i / 6); render(); playVoice(all[i]); },
    takyFamily: () => { const s = document.getElementById('takyFamilySheet'); if (s) { s.hidden = false; const b = s.querySelector('#familySignInBtn'); (b && !b.hidden ? b : s.querySelector('button')).focus(); } },
    obPage: e => { UI.obPage = +e.dataset.i; render(); },
    pickGuide: e => { UI.draft.guide = e.dataset.id; render(); playVoice(CREW.get(e.dataset.id)); },
    welcomeNav: e => { A.obDone(); if(e.dataset.to==='island') A.campView(); else if(e.dataset.to==='friends') A.editGuide(); else go(e.dataset.to); },
    obRecent: e => { const photo=(UI.draft.recentPhotos||[])[Number(e.dataset.i)]; if(photo) { UI.draft.photo=photo; render(); } },
    obClear: e => { UI.draft[e.dataset.k]=''; render(); },
    obCharacter: e => { UI.draft.character = e.dataset.k; render(); },
    obHood: e => { UI.draft.hood = e.dataset.k; render(); },
    obItem: e => { UI.draft.item = e.dataset.k; render(); },
    obVibe: e => { const d = UI.draft, k = e.dataset.k, a = d.vibes || (d.vibes = []); const i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else if (a.length < 2) a.push(k); d.vibe = a[0] || ''; d.vibeSys = vibeSys(a); render(); },
    obTheme: e => { UI.draft.theme = e.dataset.t; render(); },
    obDone: () => { if(UI.campVisit) { UI.campVisit=false; UI.draft=null; return go('home'); } const d = UI.draft; S.profile = { name: d.name.trim(), nickname: d.nickname.trim(), guide: d.guide, guideNick: d.guideNick.trim(), photo: d.photo, avatar: obAvatar(d), character: d.character || 'A', hood: d.hood || 'navy', item: d.item, vibe: (d.vibes || [])[0] || d.vibe, vibes: vibeDirs(d), theme: d.theme, island: d.island.trim() || '반짝이는 섬', camp: d.camp.trim() || '하늘빛 캠프', voice: true, recPrefix: '' }; if (d.photo) S.profile.takyCharacter = { state: 'NEED_PHOTO_SEND', at: new Date().toISOString() }; save(); UI.draft = null; go('home'); void takySync(); }
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
    if (t.dataset.draft) { UI.draft[t.dataset.draft] = t.value; const pv = $('#pvName'); if (pv) pv.textContent = shareName({ nickname: UI.draft.nickname.trim(), name: UI.draft.name.trim() }) || '닉네임(이름)'; const nb = $('#obNext'); if (nb) nb.disabled = !obOk(UI.draft, UI.screen); }
    if (t.dataset.prof) { const k = t.dataset.prof; const v = t.value.trim(); if (k === 'nickname' && !v) return; S.profile[k] = v; save(); }
  });
  app.addEventListener('change', e => { if (e.target.dataset.prof) render(); if (e.target.dataset.photo !== undefined) obPhoto(e.target.files && e.target.files[0]); });

  /* ---------------- boot ---------------- */
  UI.screen = S.session ? 'focus' : 'home';
  if (S.session && S.session.bgmOn && !isPaused(S.session)) { /* autoplay needs a gesture; music button resumes */ S.session.bgmOn = false; save(); }
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__RS = { get state() { return S; }, ui: UI };
})();
