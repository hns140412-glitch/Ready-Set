const { test, expect } = require('@playwright/test');

test('Ready loads TAKY shared release and PWA contracts', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

  const runtime = await page.evaluate(() => ({
    release: globalThis.ReadySetReleaseDescriptor,
    releaseValid: globalThis.TakyReleaseContract?.validateDescriptor?.(globalThis.ReadySetReleaseDescriptor)?.ok === true,
    updateStates: globalThis.TakyPwaUpdateState?.states || [],
    updateAdapter: !!globalThis.ReadySetPwaUpdate,
    safePoint: globalThis.ReadySetPwaSafePoint?.()
  }));

  expect(runtime.releaseValid).toBe(true);
  expect(runtime.release.app_id).toBe('ready-set');
  expect(runtime.release.release_id).toBe('ready-set-1.0.0-alpha.1-r1');
  expect(runtime.updateStates).toContain('DOWNLOADED_WAITING');
  expect(runtime.updateStates).toContain('SAFE_TO_ACTIVATE');
  expect(runtime.updateAdapter).toBe(true);
  expect(runtime.safePoint).toBe(true);

  const versionText = await page.locator('#readyVersionInfo').textContent();
  expect(versionText).toContain('1.0.0-alpha.1');
  expect(versionText).toContain('ready-set-1.0.0-alpha.1-r1');
});

test('service worker uses controlled APPLY_UPDATE instead of install-time skipWaiting', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:4173/sw.js');
  expect(response.ok()).toBe(true);
  const text = await response.text();

  expect(text).toContain("event.data?.type==='APPLY_UPDATE'");
  expect(text).toContain('self.skipWaiting()');
  expect(text).not.toContain(".then(()=>self.skipWaiting())");

  const installStart = text.indexOf("self.addEventListener('install'");
  const messageStart = text.indexOf("self.addEventListener('message'");
  expect(installStart).toBeGreaterThanOrEqual(0);
  expect(messageStart).toBeGreaterThan(installStart);
  expect(text.slice(installStart, messageStart)).not.toContain('skipWaiting');
});
