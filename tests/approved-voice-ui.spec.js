const { test, expect } = require('@playwright/test');

test.describe('Ready approved voice interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  });

  test('child walkie-talkie parser creates a confirmation draft instead of auto-commit', async ({ page }) => {
    const parsed = await page.evaluate(() => window.ReadyVoiceParser.childDraft('금요일까지 리코더 연습 20분'));
    expect(parsed.type).toBe('PRACTICE');
    expect(parsed.minutes).toBe(20);
    expect(parsed.date).toBeTruthy();
    expect(parsed.title).toContain('리코더');

    const before = await page.evaluate(() => window.ReadyAssignments?.pendingChildFacts?.().length || 0);
    await page.locator('[data-nav="mission"]').first().click();
    await expect(page.locator('#voiceTaskBtn')).toBeVisible();
    await page.evaluate(() => {
      const d=window.ReadyVoiceParser.childDraft('내일 책 읽기 20분');
      document.querySelector('#voiceDraftCard').hidden=false;
      document.querySelector('#voiceDraftTitle').textContent=d.title;
    });
    await expect(page.locator('#voiceDraftCard')).toBeVisible();
    const after = await page.evaluate(() => window.ReadyAssignments?.pendingChildFacts?.().length || 0);
    expect(after).toBe(before);
  });

  test('parent natural language request is parsed as a proposal', async ({ page }) => {
    const proposal = await page.evaluate(() => window.ReadyVoiceParser.parentProposal('이번 주 토요일 가족 일정 있어서 영어 숙제 금요일로 당겨줘'));
    expect(proposal.action).toBe('REPLAN_REQUEST');
    expect(proposal.raw).toContain('가족 일정');
  });

  test('approved flow labels and quick-add controls are present', async ({ page }) => {
    await page.locator('[data-nav="mission"]').first().click();
    await expect(page.locator('.approvedFlowSteps')).toContainText('목표 정하기');
    await expect(page.locator('.approvedFlowSteps')).toContainText('공유하기');
    await expect(page.locator('.approvedFlowSteps')).toContainText('타이머');

    await page.locator('[data-nav="planner"]').first().click();
    await page.locator('[data-planner-tab="day"]').click();
    await expect(page.locator('#childRadioQuickAdd')).toBeVisible();
    await expect(page.locator('#childRadioQuickAdd')).toContainText('숙제·이벤트 무전');
  });
});
