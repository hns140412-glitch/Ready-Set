const { test, expect } = require('@playwright/test');

test('birthdate learner context adapts chunk size without inferring grade or schedule', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const dates=await page.evaluate(()=>{
    const keyForAge=age=>{
      const now=new Date();
      return new Date(now.getFullYear()-age,now.getMonth(),now.getDate()).toLocaleDateString('sv-SE');
    };
    return {age6:keyForAge(6),age11:keyForAge(11),age12:keyForAge(12)};
  });

  await page.locator('[data-nav="profile"]:visible').first().click();
  await page.locator('#profileName').fill('Learner 6');
  await page.locator('#profileBirthdate').fill(dates.age6);
  await page.locator('#saveProfileBtn').click();

  const profileContext=await page.evaluate(()=>window.ReadySetLearnerContext.current());
  expect(profileContext.chronological_age_years).toBe(6);
  expect(profileContext.age_band).toBe('FOUNDATION_5_7');
  expect(profileContext.inferred_grade).toBeNull();
  expect(profileContext.inferred_region).toBeNull();
  expect(profileContext.inferred_curriculum).toBeNull();
  expect(profileContext.cannot_influence).toContain('SCHEDULE_DATE');
  expect(profileContext.cannot_influence).toContain('PLANNER_DATE');

  const result=await page.evaluate(({age6,age11,age12})=>{
    const context=window.ReadyRebuildLearnerContext;
    const lm=window.ReadyLearningMasterV01;
    const asOf=new Date().toLocaleDateString('sv-SE');
    const fact={
      assignment_id:'age_math',
      confirmation_state:'FACT_CONFIRMED',
      deadline_state:'DATE_CONFIRMED',
      deadline_boundary:'2099-01-01',
      source_type:'TALENT_BOOK_ASSIGNMENT',
      book_subject:'수학',
      subject:'수학',
      source_range:'1~12번',
      teacher_instruction:'',
      fact_revision:1,
      claims:[]
    };
    const run=birthdate=>lm.interpretFact(fact,{
      actor:'AGE_TEST',
      learner_context:context.resolve({birthdate,as_of:asOf})
    });
    const six=run(age6),eleven=run(age11),twelve=run(age12);
    return {
      six:{
        context:six.analysis.learner_context,
        policy:six.analysis.learner_age_policy,
        counts:six.learning_units.map(x=>x.range_descriptor.count),
        sequences:six.learning_units.map(x=>x.activity_sequence),
        provenance:six.learning_units.map(x=>x.analysis_provenance.learner_age_policy)
      },
      eleven:{
        context:eleven.analysis.learner_context,
        policy:eleven.analysis.learner_age_policy,
        counts:eleven.learning_units.map(x=>x.range_descriptor.count),
        sequences:eleven.learning_units.map(x=>x.activity_sequence)
      },
      twelve:{
        context:twelve.analysis.learner_context,
        policy:twelve.analysis.learner_age_policy,
        counts:twelve.learning_units.map(x=>x.range_descriptor.count),
        sequences:twelve.learning_units.map(x=>x.activity_sequence)
      }
    };
  },dates);

  expect(result.six.context.chronological_age_years).toBe(6);
  expect(result.six.policy.max_span).toBe(3);
  expect(result.six.counts).toEqual([3,3,3,3]);
  expect(result.six.sequences.every(x=>x.includes('SHORT_CHECKPOINT'))).toBe(true);
  expect(result.six.provenance.every(x=>x.authority==='BIRTHDATE_DEVELOPMENTAL_ADAPTATION_ONLY')).toBe(true);

  expect(result.eleven.context.chronological_age_years).toBe(11);
  expect(result.eleven.policy.max_span).toBe(6);
  expect(result.eleven.counts).toEqual([6,6]);
  expect(result.eleven.sequences.some(x=>x.includes('SHORT_CHECKPOINT'))).toBe(false);

  expect(result.twelve.context.chronological_age_years).toBe(12);
  expect(result.twelve.policy.max_span).toBe(6);
  expect(result.twelve.counts).toEqual([6,6]);
  expect(result.twelve.sequences.some(x=>x.includes('SHORT_CHECKPOINT'))).toBe(false);
});
