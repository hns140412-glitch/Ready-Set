const { test, expect } = require('@playwright/test');

test('Ready produces resolved READY_LEARNING_CONTEXT_V1 from active Planner/Learning Unit lineage only', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__ = {
      authenticated:true,
      family_id:'TEST_FAMILY',
      member_id:'TEST_PARENT',
      role:'PARENT',
      session_id:'TEST_SESSION',
      expires_at:'2099-01-01T00:00:00.000Z',
      source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'load' });

  const seeded = await page.evaluate(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const books = window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject, i) => ({
      subject,
      source_range:`u${i + 1}`
    }));
    const pkg = window.ReadyAssignments.upsertTalentPackage({
      actor:'PARENT',
      source_date:today,
      deadline_boundary:end.toLocaleDateString('sv-SE'),
      books
    });
    const assignmentId = pkg.fact_ids[0];
    window.ReadyAssignments.confirmFact(assignmentId, { actor:'PARENT' });
    const result = window.ReadyIntegrationV1.processAssignment(assignmentId, { candidate_dates:[today] });
    return result.todos[0];
  });

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator(`[data-todo-id="${seeded.todo_id}"]`).click();
  await page.locator('#startBtn').click();

  const value = await page.evaluate(() => window.ReadySetRev07.learningContext());
  expect(value).toBeTruthy();
  expect(value.contract_version).toBe('READY_LEARNING_CONTEXT_V1');
  expect(value.learning_unit_id).toBe(seeded.learning_unit_id);
  expect(value.analysis_id).toBe(seeded.analysis_id);
  expect(value.assignment_id).toBe(seeded.assignment_id);
  expect(value.subject).toBeTruthy();
  expect(value.concept_skill_target).toBeTruthy();
  expect(Array.isArray(value.activity_types)).toBe(true);
  expect(Array.isArray(value.cognitive_load_profile)).toBe(true);
  expect(Array.isArray(value.unresolved_flags)).toBe(true);
  expect(value.confidence === null || (value.confidence >= 0 && value.confidence <= 1)).toBe(true);
  expect(value.provenance?.confirmation_state).toBe('FACT_CONFIRMED');

  const serialized = JSON.stringify(value);
  for (const forbidden of ['actor_role','permission','planner_authority','allocation_authority','family_id','child_id','allocation_run_id']) {
    expect(serialized.includes(forbidden)).toBe(false);
  }
});

test('Ready learning context fails closed without Learning Unit lineage', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'load' });
  const value = await page.evaluate(() => {
    localStorage.removeItem('readyset_assignments_v2');
    return window.ReadySetRev07.learningContext();
  });
  expect(value).toBeNull();
});
