// Ready & Set: TAKY family login sheet (same contract as TAKY Mobile, vendored as taky-family-signin.mjs).
// Google credential -> TAKY central /api/family/session -> globalThis.TAKY_FAMILY_RUNTIME (memory only).
// The sheet lives outside #app so Ready's re-renders never drop its handlers.
import { createFamilySignin } from './taky-family-signin.mjs?v=20261107b';

const sheet = document.getElementById('takyFamilySheet');
if (sheet) {
  const close = () => { sheet.hidden = true; };
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-taky-close]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });
  globalThis.addEventListener('taky-central-auth-ready', () => setTimeout(close, 900));
  createFamilySignin().mount();
}
