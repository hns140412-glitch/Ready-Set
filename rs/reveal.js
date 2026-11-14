/* Ready & Set — own-record reveal ceremony + seasonal theme tokens (11/11, benchmark rows 1 and 11).
   Mechanic only: records open one by one, smallest to biggest, and the crew closes the ceremony.
   The child is only ever compared with their own earlier records. No ranks, no other children.
   SESSION_END != TASK_COMPLETE: unfinished tasks are always revealed, never hidden.
   Everything a designer may want to change lives in VARIANTS (pace, layout, which facts) and SEASONS (decoration tokens).
   Copy is assembled from the real numbers; the arrays are phrasing choices, not fixed lines. */
(function () {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const DAY = 864e5;
  const ymd = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const weekStart = ts => { const d = new Date(ts); const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()); a.setDate(a.getDate() - (a.getDay() + 6) % 7); return +a; };
  const mins = ms => Math.round(ms / 60000);
  const dur = ms => { const t = Math.max(0, Math.round(ms / 1000)); if (t < 60) return { v: String(t), u: '초' }; const m = Math.floor(t / 60), h = Math.floor(m / 60); return h ? (m % 60 ? { v: `${h}시간 ${m % 60}`, u: '분' } : { v: String(h), u: '시간' }) : { v: String(m), u: '분' }; };
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const pick = (arr, seed) => arr[hash(seed) % arr.length];
  const done = r => r.tasks.filter(t => t.outcome === 'COMPLETED').length;

  /* ---- 3 variants, one per purpose ---- */
  const VARIANTS = {
    session: { label: '오늘 탐험 기록 공개', layout: 'stack', pace: 'tap', max: 5, confetti: 1, finale: 'crew' },
    week: { label: '이번 주 여정 공개', layout: 'board', pace: 'tap', max: 6, confetti: 1.4, finale: 'crew' },
    milestone: { label: '새 기록 달성', layout: 'medal', pace: 'tap', max: 1, confetti: 2.2, finale: 'crew' }
  };
  const MILESTONES = {
    count: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300],
    focusMin: [60, 180, 300, 600, 1200, 3000, 6000],
    streak: [3, 5, 7, 14, 21, 30]
  };

  /* ---- seasonal theme tokens: decoration only, the approved screens keep their composition and colours ---- */
  const SEASONS = {
    base: { name: '기본', piece: 'spark', ink: ['#fdd931', '#fff3b0', '#ffffff'], sky: ['#142a5c', '#203f86'], glow: '#fdd931' },
    spring: { name: '봄', piece: 'petal', ink: ['#ffb7c9', '#ffd6e0', '#fff0f4'], sky: ['#3a2b63', '#5b4a92'], glow: '#ffc4d4' },
    summer: { name: '여름', piece: 'drop', ink: ['#7fd8ff', '#bdf0ff', '#fdd931'], sky: ['#0e3a63', '#1a6a9a'], glow: '#9fe6ff' },
    autumn: { name: '가을', piece: 'leaf', ink: ['#f59a3c', '#e86a3a', '#fdd931'], sky: ['#3b2238', '#6b3a3a'], glow: '#ffb46b' },
    winter: { name: '겨울', piece: 'flake', ink: ['#ffffff', '#dceeff', '#b8d8ff'], sky: ['#18284d', '#2f4a7a'], glow: '#dceeff' },
    festive: { name: '축제', piece: 'star', ink: ['#fdd931', '#ef6b45', '#7fd8ff'], sky: ['#1b1f4a', '#3a2a6a'], glow: '#fdd931' }
  };
  function seasonOf(date, pref) {
    if (pref && pref !== 'auto') return SEASONS[pref] ? pref : 'base';
    const d = new Date(date), m = d.getMonth() + 1, day = d.getDate();
    if ((m === 12 && day >= 20) || (m === 1 && day <= 3)) return 'festive';
    return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  }

  /* ---- facts from the child's own records ---- */
  function streakEnding(records, ts) {
    const days = new Set(records.map(r => ymd(r.startAt)));
    let n = 0, d = new Date(ts); d.setHours(12, 0, 0, 0);
    while (days.has(ymd(+d))) { n++; d = new Date(+d - DAY); }
    return n;
  }
  function crossed(list, before, after) { let hit = null; list.forEach(t => { if (before < t && after >= t) hit = t; }); return hit; }

  function milestonesFor(rec, records) {
    const prev = records.filter(r => r.id !== rec.id && r.startAt <= rec.startAt);
    const all = prev.concat([rec]);
    const out = [];
    const c = crossed(MILESTONES.count, prev.length, all.length);
    if (c) out.push({ k: 'count', w: 7, n: c, big: String(c), unit: '번째', title: c === 1 ? '첫 탐험 기록' : `탐험 ${c}번째`, note: c === 1 ? '첫 기록은 한 번뿐이야. 오늘이 시작점!' : `처음부터 지금까지, ${c}번 출발했어.` });
    const fb = prev.reduce((n, r) => n + r.focusMs, 0), fa = fb + rec.focusMs;
    const f = crossed(MILESTONES.focusMin, mins(fb), mins(fa));
    if (f) out.push({ k: 'focusTotal', w: 7, n: f, big: f >= 60 ? String(f / 60) : String(f), unit: f >= 60 ? '시간' : '분', title: `모은 집중 ${f >= 60 ? f / 60 + '시간' : f + '분'}`, note: '지금까지 모은 집중 시간이 새 칸에 닿았어.' });
    const sb = streakEnding(prev, rec.startAt), sa = streakEnding(all, rec.startAt);
    const s = sa > sb ? crossed(MILESTONES.streak, sb, sa) : null;
    if (s) out.push({ k: 'streak', w: 7, n: s, big: String(s), unit: '일', title: `${s}일 연속 탐험`, note: `${s}일 동안 하루도 빠짐없이 출발했어.` });
    return out;
  }

  function sessionFacts(rec, records) {
    const seed = rec.id, facts = [];
    const n = done(rec), total = rec.tasks.length, left = rec.tasks.filter(t => t.outcome !== 'COMPLETED');
    facts.push({ k: 'tasks', w: 1, big: total > 1 ? `${n}/${total}` : n ? '완료' : '기록', unit: total > 1 ? '개' : '',
      title: n === total ? pick(['오늘 고른 탐험, 전부 해냄', '고른 탐험 모두 완료'], seed) : n ? `${total}개 중 ${n}개 해냄` : '오늘은 출발까지 기록',
      note: left.length ? `남은 탐험: ${left.map(t => t.item).join(' · ')}. 다음 탐험으로 이어가자.` : rec.tasks.map(t => t.item).join(' · '), keep: true });
    const d = dur(rec.focusMs);
    facts.push({ k: 'focus', w: 2, big: d.v, unit: d.u, title: '오늘 집중한 시간', note: rec.focusMs < rec.targetMs ? `목표 ${mins(rec.targetMs)}분 안에서 해냈어.` : `목표 ${mins(rec.targetMs)}분, 끝까지 가 본 시간이야.` });
    const save = rec.targetMs - rec.focusMs;
    if (save >= 60000 && n) facts.push({ k: 'save', w: 3, big: String(mins(save)), unit: '분', title: 'TIME SAVE', note: pick(['시계보다 먼저 도착했어.', '남은 시간은 너의 자유 시간!'], seed) });
    if (rec.pauseCount && n) facts.push({ k: 'comeback', w: 3, big: String(rec.pauseCount), unit: '번', title: '멈췄다가 다시 돌아옴', note: '멈춰도 돌아오면 탐험은 이어져.' });
    const today = records.filter(r => ymd(r.startAt) === ymd(rec.startAt));
    if (today.length >= 2) facts.push({ k: 'today', w: 4, big: String(today.length), unit: '번째', title: '오늘의 탐험', note: `오늘만 벌써 ${today.length}번 출발했어.` });
    const prev = records.filter(r => r.id !== rec.id && r.startAt < rec.startAt);
    const wk = prev.filter(r => r.startAt >= weekStart(rec.startAt));
    if (prev.length >= 2 && rec.focusMs > Math.max(...prev.map(r => r.focusMs)) && rec.focusMs >= 60000) {
      facts.push({ k: 'best', w: 6, big: dur(rec.focusMs).v, unit: dur(rec.focusMs).u, title: '내 최고 집중 기록 경신', note: `지금까지 가장 길었던 ${dur(Math.max(...prev.map(r => r.focusMs))).v}${dur(Math.max(...prev.map(r => r.focusMs))).u}을 넘었어.` });
    } else if (wk.length >= 1 && rec.focusMs > Math.max(...wk.map(r => r.focusMs)) && rec.focusMs >= 60000) {
      facts.push({ k: 'weekBest', w: 5, big: d.v, unit: d.u, title: '이번 주 가장 긴 집중', note: '이번 주 너의 기록 중 제일 길어.' });
    }
    const st = streakEnding(records, rec.startAt);
    if (st >= 2 && !milestonesFor(rec, records).some(m => m.k === 'streak')) facts.push({ k: 'streak', w: 5, big: String(st), unit: '일', title: '연속 탐험', note: `${st}일째 이어지는 중.` });
    return trim(facts, VARIANTS.session.max);
  }

  function weekFacts(records, anchorTs) {
    const a = weekStart(anchorTs), b = a + 7 * DAY;
    const wr = records.filter(r => r.startAt >= a && r.startAt < b);
    const lw = records.filter(r => r.startAt >= a - 7 * DAY && r.startAt < a);
    if (!wr.length) return [];
    const tasks = wr.flatMap(r => r.tasks), ok = tasks.filter(t => t.outcome === 'COMPLETED').length;
    const days = [...new Set(wr.map(r => ymd(r.startAt)))];
    const dots = Array.from({ length: 7 }, (_, i) => days.includes(ymd(a + i * DAY + 12 * 36e5)));
    const focus = wr.reduce((n, r) => n + r.focusMs, 0), lfocus = lw.reduce((n, r) => n + r.focusMs, 0);
    const facts = [];
    facts.push({ k: 'days', w: 1, big: String(days.length), unit: '일', title: '탐험한 날', note: `7일 중 ${days.length}일 출발했어.`, dots });
    facts.push({ k: 'tasks', w: 2, big: `${ok}/${tasks.length}`, unit: '개', title: '해낸 탐험', note: tasks.length - ok ? `${tasks.length - ok}개는 다음 주로 이어가도 괜찮아.` : '고른 탐험을 모두 해냈어.', keep: true });
    const fd = dur(focus);
    facts.push({ k: 'focus', w: 3, big: fd.v, unit: fd.u, title: '이번 주 모은 집중', note: `탐험 ${wr.length}번을 모은 시간이야.` });
    const byDay = days.map(k => ({ k, ms: wr.filter(r => ymd(r.startAt) === k).reduce((n, r) => n + r.focusMs, 0) })).sort((x, y) => y.ms - x.ms);
    if (days.length >= 2) { const bd = new Date(byDay[0].k + 'T12:00:00'); facts.push({ k: 'bestDay', w: 4, big: '월화수목금토일'[(bd.getDay() + 6) % 7], unit: '요일', title: '가장 오래 집중한 날', note: `${bd.getMonth() + 1}월 ${bd.getDate()}일, ${dur(byDay[0].ms).v}${dur(byDay[0].ms).u} 집중했어.` }); }
    const longest = wr.reduce((m, r) => r.focusMs > m.focusMs ? r : m, wr[0]);
    if (wr.length >= 2) { const ld = dur(longest.focusMs); facts.push({ k: 'longest', w: 4, big: ld.v, unit: ld.u, title: '한 번에 가장 길게', note: longest.tasks.map(t => t.item).join(' · ') }); }
    if (lw.length) {
      const diff = mins(focus - lfocus);
      facts.push(diff > 0
        ? { k: 'vsLast', w: 6, big: '+' + diff, unit: '분', title: '지난주의 나보다', note: `지난주 ${mins(lfocus)}분 → 이번 주 ${mins(focus)}분.` }
        : { k: 'vsLast', w: 5, big: String(mins(focus)), unit: '분', title: '이번 주의 나', note: `지난주는 ${mins(lfocus)}분이었어. 비교는 나랑만, 속도는 내 마음대로.` });
    }
    return trim(facts, VARIANTS.week.max);
  }

  // keep the facts that must stay (unfinished work), then the heaviest, then show them light → heavy
  function trim(facts, max) {
    const keep = facts.filter(f => f.keep), rest = facts.filter(f => !f.keep).sort((x, y) => y.w - x.w);
    return keep.concat(rest.slice(0, Math.max(0, max - keep.length))).sort((x, y) => x.w - y.w);
  }

  /* ---- build one ceremony ---- */
  function build(kind, ctx) {
    const v = VARIANTS[kind];
    if (kind === 'session') {
      const ms = milestonesFor(ctx.rec, ctx.records);
      return { kind, v, steps: sessionFacts(ctx.rec, ctx.records), medal: ms.sort((x, y) => y.n - x.n)[0] || null, seed: ctx.rec.id };
    }
    if (kind === 'week') return { kind, v, steps: weekFacts(ctx.records, ctx.anchor), medal: null, seed: 'w' + weekStart(ctx.anchor), anchor: weekStart(ctx.anchor) };
    if (kind === 'milestone') return { kind, v, steps: [], medal: ctx.medal, seed: 'm' + (ctx.medal && ctx.medal.k + ctx.medal.n) };
    return null;
  }

  window.RS_REVEAL = { VARIANTS, SEASONS, MILESTONES, seasonOf, build, weekStart, milestonesFor, sessionFacts, weekFacts };
})();
