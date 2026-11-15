// Rebuilt Ready & Set: full first-use flow from a fresh state, at the two phone heights we design for.
// Replaces the 32 old-app specs (tests/legacy-old-app) per Taky's decision 2026-11-06.
const { test, expect } = require('@playwright/test');
const BASE = process.env.RS_BASE || 'http://127.0.0.1:4173/';
const PHOTO = require('node:path').join(__dirname, '..', 'assets', 'icon-192.png');

for (const [W, H] of [[390, 844], [390, 664]]) {
  test(`first journey to a finished session at ${W}x${H}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    const page = await ctx.newPage();
    const pageErrors = [], bad = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('response', r => { const u = new URL(r.url()); if (u.origin === new URL(BASE).origin && !u.pathname.startsWith('/api/') && r.status() >= 400) bad.push(`${r.status()} ${u.pathname}`); });
    // The family sign-in makes one silent stop at TAKY central on a first visit (another origin, covered by the
    // family-login tests); this journey stays inside Ready, so mark that stop as already made.
    await ctx.addInitScript(() => { try { localStorage.setItem('taky.familySignin.centralCheckedAt', String(Date.now())); } catch {} });
    await page.goto(BASE);

    // one screen, nothing cut off, no broken images
    const fits = async tag => {
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [], vh = innerHeight, vw = innerWidth;
        if (document.scrollingElement.scrollHeight > vh + 1) out.push('DOC_SCROLL');
        const sc = document.querySelector('.screen'); if (sc && sc.scrollHeight > sc.clientHeight + 1) out.push('SCREEN_OVERFLOW');
        document.querySelectorAll('.screen *').forEach(e => {
          const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
          let q = e.parentElement; while (q && !q.classList.contains('screen')) { const o = getComputedStyle(q); if (/(auto|scroll|hidden)/.test(o.overflowY) || /(auto|scroll)/.test(o.overflowX)) return; q = q.parentElement; }
          if (b.right > vw + 1 || b.left < -1 || (b.bottom > vh + 1 && !e.closest('.rays'))) out.push(String(e.className || e.tagName).slice(0, 30));
        });
        [...document.images].filter(i => i.complete && i.naturalWidth === 0).forEach(i => out.push('BROKEN ' + i.src));
        return [...new Set(out)];
      });
      expect(r, `${tag} fits one screen`).toEqual([]);
    };
    const tap = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(150); };

    await fits('ob1');
    await tap('[data-act=obGo]'); await fits('ob2');
    await tap('[data-act=pickGuide][data-id="dubi"]'); await page.fill('[data-draft=guideNick]', '두비짱');
    await tap('[data-act=obGo]');
    await expect(page.locator('#obNext')).toBeDisabled();
    await page.locator('input[data-photo]').nth(1).setInputFiles(PHOTO);
    await page.fill('[data-draft=nickname]', '별이'); await page.fill('[data-draft=name]', '김하늘');
    await expect(page.locator('#pvName')).toContainText('별이(김하늘)');
    await expect(page.locator('#ob3Photo')).toContainText('캐릭터를 요청해요'); // the photo's purpose is said out loud
    await fits('ob3');
    await tap('[data-act=obGo]');
    // item + two vibes; the guide adds the third. A blocked 다음 button always says what is still missing.
    await tap('[data-act=obItem][data-k="compass"]');
    await tap('[data-act=obVibe][data-k="curious"]');
    await expect(page.locator('#obNext')).toBeDisabled(); await expect(page.locator('#obNext')).toContainText('느낌 두 개를 골라주세요');
    await expect(page.locator('#ob4Hint')).toContainText('하나 더'); await fits('ob4 one vibe');
    await tap('[data-act=obVibe][data-k="calm"]'); await expect(page.locator('#obNext')).toContainText('다음으로');
    await expect(page.locator('.gd-vibes button.sys')).toHaveCount(1);
    await fits('ob4');
    await tap('[data-act=obGo]');
    // A/B/C are the child's own photo, labelled by the three directions
    await expect(page.locator('.arrival-cards .ac-me img')).toHaveCount(3);
    await expect(page.locator('.arrival-cards .ac-tag').first()).toContainText('호기심');
    await tap('[data-act=obCharacter][data-k="B"]'); await tap('[data-act=obHood][data-k="forest"]');
    await fits('arrival');
    await tap('[data-act=obGo]'); await tap('[data-act=obTheme][data-t="항해"]'); await fits('ob5');
    await tap('[data-act=obGo]'); await page.fill('[data-draft=island]', '반짝이는 섬'); await fits('ob6');
    await tap('[data-act=obGo]'); await page.fill('[data-draft=camp]', '하늘빛 캠프'); await fits('ob7');
    await tap('[data-act=obGo]'); await fits('ob8');
    await expect(page.locator('.gd-tiles button')).toHaveCount(4);
    await tap('.gd-tiles button[data-to="setup1"]'); // a ready-screen tile really moves on
    await expect(page.locator('.screen h1')).toContainText('오늘 목표 정하기');

    // daily flow: goals -> confirm -> focus -> result
    await tap('[data-act=cat][data-cat="재능"]'); await tap('[data-act=opt][data-it="수학"]'); await tap('[data-act=sheetDone]');
    await page.fill('.task-item input', '익힘책 24~25쪽');
    await tap('[data-act=time][data-t="10"]');
    await expect(page.locator('[data-act=bgm]')).toHaveText(['Essential', '메트로놈', '자연', '물소리', '끄기']);
    await tap('[data-act=bgm][data-k="nature"]');
    await fits('setup1');
    await tap('[data-act=toSetup2]');
    await expect(page.locator('.step')).toHaveText('2 / 2');
    await expect(page.locator('.ob-rays')).toHaveCount(0);
    await fits('brief');
    await tap('[data-act=start]'); await page.waitForTimeout(1200);
    await fits('focus');
    const r1 = await page.textContent('#remain'); await page.waitForTimeout(2100);
    expect(await page.textContent('#remain')).not.toBe(r1);
    // SESSION_END != TASK_COMPLETE: nothing is preselected and the exploration cannot end until the child answers
    await tap('[data-act=endAsk]');
    await expect(page.locator('.outcome button.on')).toHaveCount(0);
    await expect(page.locator('[data-act=finish]')).toBeDisabled();
    await expect(page.locator('.outcome .o').first().locator('button')).toHaveText(['다 했어요', '조금 남았어요', '다음에', '도움이 필요해요', '막혔어요']);
    await fits('end overlay');
    await tap('[data-act=outcome]'); await tap('[data-act=finish]');
    await fits('result');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rs2:state:v1')));
    expect(saved.profile.nickname).toBe('별이');
    expect(saved.profile.vibes).toEqual(['curious', 'calm', 'bold']);
    expect(saved.records.length).toBe(1);
    expect(saved.records[0].tasks[0].outcome).toBe('COMPLETED');

    // second exploration: two tasks, one active lap at a time, truthful per-task results, unfinished work carries over
    for (let i = 0; i < 12 && await page.locator('[data-act=rvSkip], [data-act=rvClose]').count(); i++) { await page.locator('[data-act=rvSkip], [data-act=rvClose]').first().click(); await page.waitForTimeout(250); }
    await tap('[data-act=nav][data-to="home"]'); await tap('[data-act=goSetup]');
    expect(await page.evaluate(() => __RS.state.plan.tasks.length)).toBe(0); // finished tasks are not offered again as to-do
    await tap('[data-act=cat][data-cat="재능"]'); await tap('[data-act=opt][data-it="국어"]'); await tap('[data-act=opt][data-it="한자"]'); await tap('[data-act=sheetDone]');
    await tap('[data-act=toSetup2]'); await tap('[data-act=start]'); await page.waitForTimeout(1100);
    await expect(page.locator('.pill-btn')).toContainText('국어 외 1');
    await fits('focus multi');
    await tap('[data-act=taskAsk]'); await fits('task overlay');
    await tap('[data-act=taskDone]');                       // 국어 done -> lap ends, 한자 lap starts
    await expect(page.locator('.pill-btn')).toContainText('한자 외 1');
    let ses = await page.evaluate(() => __RS.state.session);
    expect(ses.laps.length).toBe(2); expect(ses.laps[0].e).toBeGreaterThan(0); expect(ses.laps[1].e).toBe(0);
    expect(ses.laps.filter(l => !l.e).length).toBe(1);      // ONE ACTIVE LAP
    // 한자 is a retrieval task: the Hide & Seek shortcut takes the REC slot; opening it neither pauses nor ends the lap
    await expect(page.locator('.rec.go')).toHaveAttribute('aria-label', 'Hide & Seek 열기');
    await expect(page.locator('[data-act=recIntro]')).toHaveCount(0);
    await page.evaluate(() => { window.RsTakyFamily = { openApp: u => { window.__opened = u; return Promise.resolve(); } }; });
    await tap('[data-act=openApp]');
    expect(await page.evaluate(() => window.__opened)).toBe('https://hide-seek-taky.netlify.app/');
    ses = await page.evaluate(() => __RS.state.session);
    expect(ses.apps.length).toBe(1); expect(ses.pauses.length).toBe(0); expect(ses.laps.filter(l => !l.e).length).toBe(1); expect(ses.endAt).toBeFalsy();
    await fits('focus with app shortcut');
    await page.waitForTimeout(1100);
    await tap('[data-act=endAsk]');
    await expect(page.locator('.outcome button.on')).toHaveText(['다 했어요']); // only the answered task is filled in
    await expect(page.locator('[data-act=finish]')).toBeDisabled();
    await fits('end overlay multi');
    await page.locator('.outcome .o').nth(1).locator('[data-k=WAITING_FOR_PARENT]').click();
    await tap('[data-act=finish]');
    await expect(page.locator('.res-tasks em')).toHaveText(['완료', '도움 필요']);
    await expect(page.locator('.res-tasks small.lap')).toHaveCount(2);
    await fits('result multi');
    const st = await page.evaluate(() => __RS.state);
    expect(st.records[0].state).toBe('PARTIAL_COMPLETE');
    expect(st.records[0].tasks.map(t => t.outcome)).toEqual(['COMPLETED', 'WAITING_FOR_PARENT']);
    expect(st.carry.map(c => [c.item, c.outcome, c.n])).toEqual([['한자', 'WAITING_FOR_PARENT', 1]]);
    for (let i = 0; i < 12 && await page.locator('[data-act=rvSkip], [data-act=rvClose]').count(); i++) { await page.locator('[data-act=rvSkip], [data-act=rvClose]').first().click(); await page.waitForTimeout(250); }
    await tap('[data-act=nav][data-to="home"]'); await tap('[data-act=goSetup]');
    await expect(page.locator('.carry-chips button')).toHaveText(['한자도움 필요']);
    await tap('[data-act=carryAdd]');
    await expect(page.locator('.task-item .tag')).toHaveText(['재능 · 한자']);
    await expect(page.locator('.carry-chips button')).toHaveCount(0);
    await fits('setup1 carry');
    // finishing the carried task clears it from the carry list, keeping its lineage
    await tap('[data-act=toSetup2]'); await tap('[data-act=start]'); await page.waitForTimeout(600);
    await tap('[data-act=endAsk]'); await tap('[data-act=outcome][data-k=COMPLETED]'); await tap('[data-act=finish]');
    const st2 = await page.evaluate(() => __RS.state);
    expect(st2.carry).toEqual([]);
    expect(st2.records[0].tasks[0].root).toBe(st.records[0].tasks[1].root);
    expect(st2.records.length).toBe(3);

    // every crew voice clip decodes and is not silent
    const voices = await page.evaluate(() => Promise.all(RSCrew.all.map(async c => { const r = await fetch(c.voice); const a = await new OfflineAudioContext(1, 1, 22050).decodeAudioData(await r.arrayBuffer()); const d = a.getChannelData(0); let pk = 0; for (let i = 0; i < d.length; i += 7) pk = Math.max(pk, Math.abs(d[i])); return r.status === 200 && a.duration > .3 && pk > .02; })));
    expect(voices.every(Boolean)).toBe(true);
    expect(bad).toEqual([]);
    expect(pageErrors).toEqual([]);
    await ctx.close();
  });
}
