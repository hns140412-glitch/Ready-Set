const { test, expect } = require('@playwright/test');
const fs=require('fs');

test('recording predeploy contract fails closed on unsupported and denied microphone access', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(async()=>{
    const service=window.ReadyRebuildRecordingService;
    const orchestratorFactory=window.ReadyRebuildRecordingOrchestrator;
    const unsupported=orchestratorFactory.create({
      recordingService:service,
      mediaDevices:null,
      MediaRecorderCtor:null
    });
    const unsupportedStart=await unsupported.start();

    const deniedDevices={getUserMedia:async()=>{const e=new Error('denied');e.name='NotAllowedError';throw e;}};
    const FakeRecorder=function(){};
    FakeRecorder.isTypeSupported=()=>true;
    const denied=orchestratorFactory.create({
      recordingService:service,
      mediaDevices:deniedDevices,
      MediaRecorderCtor:FakeRecorder
    });
    const deniedStart=await denied.start();

    return {
      unsupportedStart,
      deniedStart,
      mp4Ext:service.extensionFor('audio/mp4'),
      webmExt:service.extensionFor('audio/webm;codecs=opus'),
      mp4Note:service.formatNote('audio/mp4'),
      webmNote:service.formatNote('audio/webm')
    };
  });

  expect(result.unsupportedStart).toEqual({ok:false,reason:'UNSUPPORTED'});
  expect(result.deniedStart.reason).toBe('MIC_PERMISSION_DENIED');
  expect(result.mp4Ext).toBe('m4a');
  expect(result.webmExt).toBe('webm');
  expect(result.mp4Note).toContain('MP4/M4A');
  expect(result.webmNote).toContain('.m4a로 이름만 바꾸지 않으며');
});

test('recording service chooses a supported real mime instead of inventing a format', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(()=>{
    const service=window.ReadyRebuildRecordingService;
    class FakeRecorder{}
    FakeRecorder.isTypeSupported=(mime)=>mime==='audio/webm;codecs=opus';
    return {
      mime:service.chooseMime(FakeRecorder),
      filename:service.filenameFor({
        profileName:'Test/User',
        date:new Date(2026,8,22),
        type:'audio/webm;codecs=opus'
      })
    };
  });
  expect(result.mime).toBe('audio/webm;codecs=opus');
  expect(result.filename).toBe("Test_User's grammar recording 2026 09 22.webm");
});

test('capture provider contract remains fail-closed and review-only before deployment', async ()=>{
  const source=fs.readFileSync('netlify/functions/capture-analyze.mjs','utf8');
  expect(source).toContain("PARENT_AUTH_REQUIRED");
  expect(source).toContain("ANALYSIS_PROVIDER_NOT_CONFIGURED");
  expect(source).toContain("ANALYSIS_PROVIDER_ERROR");
  expect(source).toContain("Return review drafts only. Never invent unreadable values.");
  expect(source).toContain("Do not output answer contents even if an answer sheet is visible.");
  expect(source).toContain("store:false");
  expect(source).toContain("ANSWER_REFERENCE");
  expect(source).toContain("PARENT_ONLY");
});

test('capture provider limits image type, count and total upload size before external call', async ()=>{
  const source=fs.readFileSync('netlify/functions/capture-analyze.mjs','utf8');
  expect(source).toContain("MAX_IMAGES=24");
  expect(source).toContain("MAX_TOTAL_BYTES=24*1024*1024");
  expect(source).toContain("UNSUPPORTED_IMAGE_TYPE");
  expect(source).toContain("CAPTURE_BATCH_TOO_LARGE");
  expect(source).toContain("NO_ANALYZABLE_IMAGES");
  expect(source).toContain("NO_IMAGE_FILES_RECEIVED");
});
