(() => {
  'use strict';
  // Native focus BGM, ported from legacy app.js / ready-stage-c-base.js without
  // their globals (mediaRecorder, SOUND_MAP, VERSION). Local wav files only; the
  // YouTube "essential;" playlist is not ported (external dependency).
  const VERSION = '2026.11.05-bgm-v1';
  const SOUND_MAP = {
    '집중 피아노': './assets/bgm-piano.wav',
    '자연 숲': './assets/bgm-nature.wav',
    '잔잔한 물결': './assets/bgm-water.wav',
    '로파이': './assets/bgm-lofi.wav'
  };
  const OFF = 'OFF', DEFAULT = '집중 피아노', VOLUME = .34;
  const $ = s => document.querySelector(s);
  const core = () => (typeof state !== 'undefined' ? state : null);
  const persist = () => { try { if (typeof save === 'function') save(); } catch {} };

  function player() {
    let p = $('#bgmPlayer');
    if (!p) { p = document.createElement('audio'); p.id = 'bgmPlayer'; p.loop = true; p.preload = 'auto'; document.body.appendChild(p); }
    return p;
  }
  function normalize(sound) { return sound === OFF || Object.prototype.hasOwnProperty.call(SOUND_MAP, sound) ? sound : DEFAULT; }
  function activeSound() { const s = core(); return normalize(s?.activeSession?.sound || s?.sound); }
  function setSource(sound) {
    const p = player(), src = SOUND_MAP[sound];
    if (!src) return;
    const resolved = new URL(src, location.href).href;
    if (p.src !== resolved) { p.pause(); p.src = src; p.load(); }
  }
  function status(custom = '') {
    const el = $('#bgmStatus'); if (!el) return;
    const s = core()?.activeSession, sound = activeSound(), p = player();
    if (custom) { el.textContent = custom; return; }
    if (sound === OFF) { el.textContent = '집중 사운드 끔'; return; }
    if (s?.pausedAt) { el.textContent = `${sound} · 타이머 멈춤`; return; }
    el.textContent = `${sound} · ${p.paused ? '일시정지' : '재생 중'}`;
  }
  function allowedNow() {
    const s = core()?.activeSession;
    if (!s || s.completed || s.pausedAt) return false;
    if (window.__readyRecordingActive) return false;
    return !!$('#focusView')?.classList.contains('active');
  }
  async function play(sound = activeSound()) {
    sound = normalize(sound);
    if (sound === OFF) { pause(); return false; }
    setSource(sound);
    const p = player(); p.volume = VOLUME;
    try { await p.play(); status(); return true; }
    catch { status('재생하려면 ♪ 버튼을 한 번 눌러주세요'); return false; }
  }
  function pause() { const p = player(); if (!p.paused) p.pause(); status(); }
  // Called on every focus tick and on state changes: never leaves music playing
  // outside an active, unpaused focus view.
  function sync() { if (!allowedNow()) { pause(); return; } status(); }
  function resume() { return allowedNow() ? play() : (sync(), Promise.resolve(false)); }

  function choose(sound) {
    sound = normalize(sound);
    const s = core(); if (!s) return;
    s.sound = sound; if (s.activeSession) s.activeSession.sound = sound; persist();
    renderSheet();
    if (sound === OFF) pause(); else if (allowedNow()) play(sound); else status();
  }
  function ensureSheet() {
    let sheet = $('#readyBgmSheet'); if (sheet) return sheet;
    sheet = document.createElement('div'); sheet.id = 'readyBgmSheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '집중 사운드 선택');
    const options = [...Object.keys(SOUND_MAP), OFF].map(k => `<button type="button" data-ready-bgm="${k}">${k === OFF ? '소리 끄기' : k}</button>`).join('');
    sheet.innerHTML = `<div class="readyBgmCard"><b>집중 사운드</b>${options}<button type="button" data-ready-bgm-close>닫기</button></div>`;
    sheet.addEventListener('click', e => {
      if (e.target === sheet || e.target.closest('[data-ready-bgm-close]')) { sheet.hidden = true; return; }
      const b = e.target.closest('[data-ready-bgm]'); if (b) choose(b.dataset.readyBgm);
    });
    document.body.appendChild(sheet);
    const style = document.createElement('style'); style.id = 'readyBgmStyle';
    style.textContent = `#readyBgmSheet{position:fixed;inset:0;z-index:9998;background:rgba(20,16,14,.38);display:flex;align-items:flex-end}#readyBgmSheet[hidden]{display:none}
      .readyBgmCard{width:100%;padding:18px 18px calc(18px + env(safe-area-inset-bottom));background:#fffaf5;border-radius:28px 28px 0 0;display:grid;gap:10px}.readyBgmCard b{font-size:18px}
      .readyBgmCard button{border:0;border-radius:16px;padding:14px;font-weight:800;font-size:15px;background:#fff;color:#2a231f;text-align:left}.readyBgmCard button.on{background:#2a231f;color:#fff}.readyBgmCard [data-ready-bgm-close]{text-align:center;background:#f3ebe3}`;
    document.head.appendChild(style);
    return sheet;
  }
  function renderSheet() { const cur = activeSound(); document.querySelectorAll('[data-ready-bgm]').forEach(b => b.classList.toggle('on', b.dataset.readyBgm === cur)); }
  function openSheet() { const sheet = ensureSheet(); renderSheet(); sheet.hidden = false; }

  function bind() {
    const btn = $('#focusSoundBtn');
    if (btn && !btn.dataset.readyBgmBound) { btn.dataset.readyBgmBound = '1'; btn.type = 'button'; btn.setAttribute('aria-label', '집중 사운드 선택'); btn.addEventListener('click', openSheet); }
    const change = $('#changeBgm');
    if (change && !change.dataset.readyBgmBound) { change.dataset.readyBgmBound = '1'; change.addEventListener('click', openSheet); }
    // Pause/resume follows the timer pause button (runtime handles state first).
    const pauseBtn = $('#pauseBtn');
    if (pauseBtn && !pauseBtn.dataset.readyBgmBound) { pauseBtn.dataset.readyBgmBound = '1'; pauseBtn.addEventListener('click', () => setTimeout(() => { if (core()?.activeSession?.pausedAt) pause(); else resume(); }, 0)); }
    status();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pause(); });
  window.addEventListener('pagehide', pause);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();

  window.ReadyBgmV1 = Object.freeze({ version: VERSION, play, pause, resume, sync, choose, open: openSheet, render: bind, sounds: Object.keys(SOUND_MAP),
    validate: () => ({ version: VERSION, buttonBound: !!$('#focusSoundBtn')?.dataset.readyBgmBound, sound: activeSound(), playing: !player().paused }) });
  document.documentElement.dataset.readyBgm = VERSION;
})();
