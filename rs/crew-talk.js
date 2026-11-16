/* Ready & Set — the companion crew's speech bubble follows its recorded voice (Taky 2026-11-16).
   Taky picked the typed bubble (A) after rejecting the hop; A+B (rim light + voice bars) is kept behind one switch.
   Renderer-only: no new art, no new voice, no network service (EXPLORATION_CREW_CANONICAL §4/§5).
   - envelope: the clip is decoded once with an OfflineAudioContext, so it works before any gesture and never
     reroutes the <audio> element's output. RMS per 1/60 s, normalised, attack/release smoothed.
   - typing: the bubble text appears as fast as the voice is actually voiced, and is complete when the clip ends.
     The full line stays in aria-label while it types.
   - FX 'type+wave' adds: the bubble rim lights up while the crew member speaks, and five bars beside the name
     follow the voice.
   - which bubble: the one that shares a parent with a picture of the speaking crew member
     (rs/crew/NN.webp or NN-face.webp); in a duo the newest line.
   - prefers-reduced-motion: the text is shown at once and the bars stay still. Voice off: no clip, nothing changes. */
(function () {
  'use strict';
  const FX = window.RS_CREW_TALK_FX || 'type'; // 'type' (A, Taky 2026-11-16) | 'type+wave' (A+B); the window value is for side-by-side review only
  const FPS = 60;
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const BUBBLE = '.gd-bubble, .bubble, .rv-say';
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
      const cum = new Float32Array(n); let s = 0;
      for (let i = 0; i < n; i++) { s += e[i] > 0.08 ? e[i] : 0; cum[i] = s; }
      return { e, cum };
    }).catch(() => null);
    if (cache.size >= 40) cache.delete(cache.keys().next().value);
    cache.set(url, p);
    return p;
  }

  /* the bubble that belongs to crew member n: shares a parent (up to 3 levels) with one of their pictures */
  function findBubble(n) {
    const re = new RegExp(`rs/crew/${n}(-face)?\\.webp`);
    let best = null;
    document.querySelectorAll('img').forEach(img => {
      if (!re.test(img.getAttribute('src') || '')) return;
      let p = img.parentElement;
      for (let k = 0; k < 3 && p; k++, p = p.parentElement) {
        const list = p.querySelectorAll(BUBBLE);
        if (list.length) { const b = list[list.length - 1]; if (!best || (best.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)) best = b; break; }
      }
    });
    return best;
  }
  const label = b => b.querySelector(':scope > b, :scope > small');
  function textNodes(b) {
    const lab = label(b), out = [];
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) if (!(lab && lab.contains(t)) && !(t.parentElement && t.parentElement.closest('.ct-wave, .ct-rest'))) out.push(t);
    return out;
  }

  let cur = null;
  function release(me) {
    const t = me.target;
    if (t) {
      t.nodes && t.nodes.forEach((n, i) => { n.textContent = t.full[i]; });
      t.rest && t.rest.forEach(r => r.remove());
      t.el.classList.remove('ct-typing', 'ct-speaking'); t.el.removeAttribute('aria-label');
      t.wave && t.wave.remove();
    }
    me.target = null;
  }
  function attach(me) {
    const el = findBubble(me.n); if (!el) return null;
    const nodes = textNodes(el); const full = nodes.map(n => n.textContent);
    const t = { el, nodes, full, rest: [], total: full.reduce((a, s) => a + s.length, 0), wave: null };
    if (!RM.matches) {
      // untyped text stays in place but invisible, so the bubble keeps its final size and nothing jumps
      el.setAttribute('aria-label', ((label(el) ? label(el).textContent.trim() + ': ' : '') + full.join('')).trim()); el.classList.add('ct-typing');
      t.rest = nodes.map((n, i) => { const r = document.createElement('span'); r.className = 'ct-rest'; r.setAttribute('aria-hidden', 'true'); r.textContent = full[i]; n.parentNode.insertBefore(r, n.nextSibling); n.textContent = ''; return r; });
    }
    if (FX === 'type+wave') {
      el.classList.add('ct-speaking');
      const w = document.createElement('span'); w.className = 'ct-wave'; w.setAttribute('aria-hidden', 'true'); w.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
      (label(el) || el).appendChild(w); t.wave = w;
    }
    return t;
  }
  function show(t, frac) {
    let left = Math.round(t.total * frac);
    t.nodes.forEach((n, i) => { const s = t.full[i]; const k = Math.max(0, Math.min(s.length, left)); n.textContent = s.slice(0, k); if (t.rest[i]) t.rest[i].textContent = s.slice(k); left -= s.length; });
  }

  /* audio: the HTMLAudioElement that is about to play; crew: an RSCrew entry ({ n }) */
  function talk(audio, crew) {
    if (!audio || !crew || !crew.n) return;
    if (cur) release(cur);
    const me = { audio, n: crew.n, env: null, target: null, t0: performance.now() };
    cur = me;
    envelope(audio.src).then(e => { me.env = e; });
    const stop = () => { if (cur === me) { release(me); cur = null; } };
    audio.addEventListener('ended', stop, { once: true });
    audio.addEventListener('error', stop, { once: true });
    const tick = () => {
      if (cur !== me) return;
      const started = audio.currentTime > 0;
      if (audio.ended || (audio.paused && started) || (!started && performance.now() - me.t0 > 5000)) return stop();
      if (me.target && !me.target.el.isConnected) me.target = null; // the screen re-rendered: pick up the new bubble
      if (!me.target) me.target = attach(me);
      const t = me.target;
      if (t) {
        const env = me.env, fi = env ? Math.min(env.e.length - 1, Math.floor(audio.currentTime * FPS)) : 0;
        if (!RM.matches) {
          let frac;
          if (env && env.cum[env.cum.length - 1] > 0) frac = env.cum[fi] / env.cum[env.cum.length - 1];
          else frac = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
          show(t, Math.min(1, frac * 1.04));
        }
        if (t.wave) {
          const lv = env && !audio.paused && !RM.matches ? env.e : null;
          [...t.wave.children].forEach((el, k) => { const v = lv ? lv[Math.max(0, fi - [0, 6, 2, 8, 4][k])] : 0; el.style.height = (3 + v * 11 * [0.7, 1, 0.85, 0.6, 0.9][k]).toFixed(1) + 'px'; });
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  window.RSCrewTalk = { talk, envelope, findBubble, FX, get speaking() { return cur ? cur.n : null; } };
})();
