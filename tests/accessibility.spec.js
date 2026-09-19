const { test, expect } = require('@playwright/test');

test.use({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });

test('accessibility: dialogs expose semantics, trap focus and close with Escape', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#soundBtn').click();

  const sheet=page.locator('#soundSheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('role','dialog');
  await expect(sheet).toHaveAttribute('aria-modal','true');

  const activeId=await page.evaluate(()=>document.activeElement?.getAttribute('data-close-sound')!==null || document.activeElement?.hasAttribute('data-sheet-sound'));
  expect(activeId).toBeTruthy();

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.locator('#soundBtn')).toBeFocused();
});

test('accessibility: planner tabs expose selected state and support arrow-key navigation', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();

  const week=page.locator('[data-planner-tab="week"]');
  const day=page.locator('[data-planner-tab="day"]');
  await expect(week).toHaveAttribute('aria-selected','true');
  await expect(day).toHaveAttribute('aria-selected','false');

  await week.focus();
  await page.keyboard.press('ArrowRight');
  await expect(day).toBeFocused();
  await expect(day).toHaveAttribute('aria-selected','true');
  await expect(week).toHaveAttribute('aria-selected','false');
  await expect(page.locator('#plannerDayPanel')).toBeVisible();
});

test('accessibility: stateful controls announce pressed state and toast is a polite live region', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="mission"]').first().click();

  const category=page.locator('#missionView [data-category="영어"]').first();
  await expect(category).toHaveAttribute('aria-pressed','false');
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed','true');

  const toast=page.locator('#toast');
  await expect(toast).toHaveAttribute('role','status');
  await expect(toast).toHaveAttribute('aria-live','polite');
  await expect(toast).toHaveAttribute('aria-atomic','true');
});

test('accessibility: icon-only/back controls have accessible names', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const unnamed=await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>{
    const text=(b.textContent||'').trim();
    const aria=(b.getAttribute('aria-label')||'').trim();
    const title=(b.getAttribute('title')||'').trim();
    const symbolic=/^[←→›×♪🎙↗—▶]*$/.test(text);
    return symbolic && !aria && !title;
  }).map(b=>({id:b.id,text:(b.textContent||'').trim(),nav:b.dataset.nav||null})));
  expect(unnamed).toEqual([]);
});
