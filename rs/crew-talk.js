/* Ready & Set — companion crew "talks" with its recorded voice (Taky 2026-11-16, LivLiv review option 1).
   Renderer-only effect: the approved crew picture (rs/crew/NN.webp) moves with the loudness of the clip
   that is playing. No new art, no new voice, no network service (EXPLORATION_CREW_CANONICAL §4/§5:
   the renderer receives approved assets only, missing mouth frames are not drawn).
   - envelope: the clip is decoded once (OfflineAudioContext, so it works before any gesture and never
     reroutes the <audio> element's output), RMS per 1/60 s, normalised, attack/release smoothed.
   - each frame while the clip plays: --talk (0..1) on every <img> of that crew member; CSS turns it into
     a small hop / lean / squash from the feet (rs.css .crew-talking).
   - prefers-reduced-motion: no movement. Voice off: playVoice/sayLine never start a clip, so nothing moves. */
(function () {
  'use strict';
  const FPS = 60;
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const cache = new Map();

  function decode(buf) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.reject(new Error('no-offline-audio'));
    const ctx = new OAC(1, 1, 44100);
    return new Promise((res, rej) => { const q = ctx.decodeAudioData(buf, res, rej); if (q && q.then) q.then(res, rej); });
  }

  function envelope(url) {
    if (cache.has(url)) return cache.get(url);
    const p = fetch(url).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('http ' + r.status)))).then(decode).then(ab => {
      const d = ab.getChannelData(0), hop = Math.max(1, Math.round(ab.sampleRate / FPS)), n = Math.ceil(d.length / hop);
      const e = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let s = 0; const a = i * hop, b = Math.min(d.length, a + hop);
        for (let j = a; j < b; j++) s += d[j] * d[j];
        e[i] = Math.sqrt(s / Math.max(1, b - a));
      }
      const ref = Array.from(e).sort((x, y) => x - y)[Math.floor(n * 0.95)] || 1;
      let y = 0;
      for (let i = 0; i < n; i++) {
        const x = Math.min(1, Math.max(0, (e[i] / ref - 0.12) / 0.88));
        y += (x - y) * (x > y ? 0.55 : 0.16);
        e[i] = y;
      }
      return e;
    }).catch(() => null);
    if (cache.size >= 40) cache.delete(cache.keys().next().value);
    cache.set(url, p);
    return p;
  }

  let cur = null;
  const pics = n => document.querySelectorAll(`img[src*="rs/crew/${n}.webp"]`);
  function clear() {
    document.querySelectorAll('img.crew-talking').forEach(el => { el.classList.remove('crew-talking'); el.style.removeProperty('--talk'); });
  }

  /* audio: the HTMLAudioElement that is about to play; crew: an RSCrew entry ({ n }) */
  function talk(audio, crew) {
    if (!audio || !crew || !crew.n) return;
    const me = { audio, n: crew.n, env: null, t0: performance.now() };
    cur = me; clear();
    envelope(audio.src).then(e => { me.env = e; });
    const stop = () => { if (cur === me) { cur = null; clear(); } };
    audio.addEventListener('ended', stop, { once: true });
    audio.addEventListener('error', stop, { once: true });
    const tick = () => {
      if (cur !== me) return;
      const started = audio.currentTime > 0;
      if (audio.ended || (audio.paused && started) || (!started && performance.now() - me.t0 > 5000)) return stop();
      let lv = 0;
      if (!RM.matches && me.env && !audio.paused) lv = me.env[Math.min(me.env.length - 1, Math.floor(audio.currentTime * FPS))] || 0;
      pics(me.n).forEach(el => { el.classList.add('crew-talking'); el.style.setProperty('--talk', lv.toFixed(3)); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  window.RSCrewTalk = { talk, envelope, get speaking() { return cur ? cur.n : null; } };
})();
