// Ready & Set: TAKY family login sheet (same contract as TAKY Mobile, vendored as taky-family-signin.mjs).
// Google credential -> TAKY central /api/family/session -> globalThis.TAKY_FAMILY_RUNTIME (memory only).
// The sheet lives outside #app so Ready's re-renders never drop its handlers.
import { createFamilySignin } from './taky-family-signin.mjs?v=20261107h';

const sheet = document.getElementById('takyFamilySheet');
if (sheet) {
  const close = () => { sheet.hidden = true; };
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-taky-close]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });
  globalThis.addEventListener('taky-central-auth-ready', () => setTimeout(close, 900));
  // The vendored sign-in speaks TAKY Mobile's admin tone; Ready says the same thing in the expedition voice.
  const VOICE = {
    '로그인하지 않음 · 가족 개인정보 숨김': '아직 캠프 밖이에요 · 가족 정보는 꼭꼭 숨겨 뒀어요',
    '가족 로그인을 다시 연결하는 중이에요. 자동으로 안 되면 Google 로그인 버튼을 눌러 주세요.': '탐험본부에 다시 무전 치는 중… 응답이 없으면 Google 버튼을 눌러 줘요.',
    '가족 로그인 설정 확인 중…': '캠프 무전기 켜는 중…',
    'Google 계정으로 로그인하세요. 가족 권한은 중앙 서버에서 확인합니다.': '가족 Google 계정으로 들어와요. 탐험대 명단은 탐험본부가 확인해요.',
    '중앙 로그인 설정 또는 Google 연결이 없어 로그인할 수 없습니다.': '지금은 탐험본부 무전이 안 닿아요. 조금 뒤에 다시 해 봐요.',
    'Google 로그인 응답이 유효하지 않습니다.': 'Google 답장이 이상해요. 한 번만 다시 눌러 줘요.',
    '중앙 가족 소속 확인 중…': '탐험대 명단에서 이름 찾는 중…',
    '중앙 서버에서 승인된 가족을 선택하세요.': '어느 탐험대로 갈지 골라 줘요.',
    '가족 소속을 확인하지 못했습니다. 로그인 상태가 적용되지 않았습니다.': '명단에서 이름을 못 찾았어요. 가족 계정이 맞는지 확인해 줘요.',
    '중앙 가족 인증 완료 · 본인과 허용된 구성원만 조회합니다.': '합류 완료! 이제 우리 탐험대만 서로 볼 수 있어요.',
  };
  const status = document.getElementById('familyLoginStatus');
  if (status) new MutationObserver(() => { const v = VOICE[status.textContent.trim()]; if (v) status.textContent = v; })
    .observe(status, { childList: true, characterData: true, subtree: true });
  const signin = createFamilySignin();
  signin.mount();
  // Ready calls expire() when the Google sign-in has run out (about an hour): clear the stale session
  // and leave a friendly note in the sheet for the next time it opens.
  globalThis.RsTakyFamily = Object.freeze({
    expire() {
      signin.signOut();
      delete globalThis.TAKY_FAMILY_RUNTIME;   // a session the server already rejected is never reused
      if (status) status.textContent = '탐험본부 무전이 끊겼어요. 버튼을 눌러 다시 합류해 줘요.';
    },
  });
}
