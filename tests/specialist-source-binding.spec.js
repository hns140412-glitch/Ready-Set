const {test,expect}=require('@playwright/test');

test('Ready specialist learning context preserves task identity and source provenance without inventing Hide lexical ids',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const decoded=await page.evaluate(()=>{
    const task={
      learning_unit_id:'unit-source-1',
      analysis_id:'analysis-source-1',
      assignment_id:'assignment-source-1',
      source_range:'Unit 7 / p.18-19',
      workbook_ref_id:'workbook-source-1',
      subject:'영어',
      concept_skill_target:'VOCABULARY',
      activity_types:['MEMORY'],
      activity_sequence:['RECALL'],
      route_plan:{allowed_specialists:['hide-seek']}
    };
    const encoded=window.ReadySpecialistHandoffContract.encodeLearningContext(task);
    const normalized=encoded.replace(/-/g,'+').replace(/_/g,'/');
    const padded=normalized+'='.repeat((4-normalized.length%4)%4);
    const binary=atob(padded);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  });
  expect(decoded.contract_version).toBe('READY_LEARNING_CONTEXT_V1');
  expect(decoded.assignment_id).toBe('assignment-source-1');
  expect(decoded.analysis_id).toBe('analysis-source-1');
  expect(decoded.learning_unit_id).toBe('unit-source-1');
  expect(decoded.source_range).toBe('Unit 7 / p.18-19');
  expect(decoded.workbook_ref_id).toBe('workbook-source-1');
  expect(decoded.lexicalIds).toBeUndefined();
});
