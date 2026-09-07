(() => {
  'use strict';

  const STAGE_VERSION = '2026.09.07-stage-c1';
  const APP_VERSION = '0.9.3-rc2';
  const CACHE_VERSION = 'ready-set-v093-rev07-staging1';
  const ESSENTIAL = 'essential;';
  const VIDEO_ID = 'h2sHEe_xnmU';
  const PLAYLIST_ID = 'PLKRZTF1Q1uwYFbRwQzrySyGXYJVXqcUVu';

  let ytPlayer = null;
  let ytPlayerPromise = null;
  let ytApiPromise = null;

  const basePlayBgm = playBgm;
  const basePauseBgm = pauseBgm;
  const baseResumeBgm = resumeBgm;
  const baseUpdateBgmStatus = updateBgmStatus;

  try {
    SOUND_MAP[ESSENTIAL] = '__YOUTUBE__';
    VERSION.app = APP_VERSION;
    VERSION.master = 'REV_07';
    VERSION.cache = CACHE_VERSION;
  } catch {}

  function activeSound() {
    return state.activeSession?.sound || state.sound;
  }

  function status(text) {
    const el = document.getElementById('bgmStatus');
    if (el) el.textContent = text;
  }

  function ensureYouTubeHost() {
    let wrap = document.getElementById('readyEssentialHostWrap');
    if (wrap) return document.getElementById('readyEssentialHost');
    wrap = document.createElement('div');
    wrap.id = 'readyEssentialHostWrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;overflow:hidden;opacity:.01;pointer-events:none';
    const host = document.createElement('div');
    host.id = 'readyEssentialHost';
    wrap.appendChild(host);
    document.body.appendChild(wrap);
    return host;
  }

  function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try { if (typeof previous === 'function') previous(); } catch {}
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error('YOUTUBE_API_UNAVAILABLE'));
      };
      let script = document.querySelector('script[data-ready-essential-youtube]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.readyEssentialYoutube = '1';
        script.onerror = () => reject(new Error('YOUTUBE_API_LOAD_FAILED'));
        document.head.appendChild(script);
      }
      setTimeout(() => {
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error('YOUTUBE_API_TIMEOUT'));
      }, 8000);
    }).catch(error => {
      ytApiPromise = null;
      throw error;
    });
    return ytApiPromise;
  }

  async function ensureYouTubePlayer() {
    if (ytPlayer?.playVideo) return ytPlayer;
    if (ytPlayerPromise) return ytPlayerPromise;
    ytPlayerPromise = loadYouTubeApi().then(() => new Promise((resolve, reject) => {
      ensureYouTubeHost();
      try {
        ytPlayer = new YT.Player('readyEssentialHost', {
          height: '2',
          width: '2',
          videoId: VIDEO_ID,
          playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            playsinline: 1,
            controls: 0,
            rel: 0
          },
          events: {
            onReady: event => resolve(event.target),
            onStateChange: event => {
              if (activeSound() !== ESSENTIAL) return;
              if (event.data === YT.PlayerState.PLAYING) status(`${ESSENTIAL} · 재생 중`);
              if (event.data === YT.PlayerState.PAUSED) status(`${ESSENTIAL} · 일시정지`);
            },
            onError: () => status(`${ESSENTIAL} · 재생목록 연결을 확인해 주세요`)
          }
        });
      } catch (error) {
        reject(error);
      }
    })).catch(error => {
      ytPlayerPromise = null;
      ytPlayer = null;
      throw error;
    });
    return ytPlayerPromise;
  }

  function pauseEssential() {
    try { if (ytPlayer?.pauseVideo) ytPlayer.pauseVideo(); } catch {}
  }

  async function playEssential({ preview = false } = {}) {
    const local = bgm();
    if (local) {
      try { local.pause(); } catch {}
    }
    status(`${ESSENTIAL} · 연결 중`);
    try {
      const player = await ensureYouTubePlayer();
      try { player.setVolume(preview ? 26 : 34); } catch {}
      player.playVideo();
      setTimeout(() => {
        try {
          if (activeSound() === ESSENTIAL && player.getPlayerState() !== YT.PlayerState.PLAYING) {
            status(`${ESSENTIAL} · 음악을 한 번 더 눌러 재생해 주세요`);
          }
        } catch {}
      }, 900);
      return true;
    } catch {
      status(`${ESSENTIAL} · 온라인 연결 후 다시 눌러주세요`);
      return false;
    }
  }

  playBgm = async function patchedPlayBgm(sound = activeSound(), options = {}) {
    if (sound === ESSENTIAL) return playEssential(options);
    pauseEssential();
    return basePlayBgm(sound, options);
  };

  pauseBgm = async function patchedPauseBgm(options = {}) {
    pauseEssential();
    if (activeSound() === ESSENTIAL) {
      updateBgmStatus();
      return true;
    }
    return basePauseBgm(options);
  };

  resumeBgm = async function patchedResumeBgm(sound = activeSound()) {
    if (sound === ESSENTIAL) return playEssential({ preview: false });
    pauseEssential();
    return baseResumeBgm(sound);
  };

  updateBgmStatus = function patchedUpdateBgmStatus(custom = '') {
    if (activeSound() !== ESSENTIAL) return baseUpdateBgmStatus(custom);
    const session = state.activeSession;
    if (!session) {
      status(custom || ESSENTIAL);
      return;
    }
    if (session.pausedAt) {
      status(`타이머 멈춤 · ${ESSENTIAL} 일시정지`);
      return;
    }
    status(custom || `${ESSENTIAL} · ${ytPlayer?.getPlayerState?.() === 1 ? '재생 중' : '대기'}`);
  };

  async function chooseEssential(previewMs) {
    state.sound = ESSENTIAL;
    if (state.activeSession) state.activeSession.sound = ESSENTIAL;
    save();
    renderSettings();
    renderMission();
    document.querySelectorAll('[data-sheet-sound]').forEach(button => {
      button.classList.toggle('on', button.dataset.sheetSound === ESSENTIAL);
    });
    clearTimeout(previewTimer);
    await playBgm(ESSENTIAL, { preview: !state.activeSession });
    if (!state.activeSession) previewTimer = setTimeout(() => pauseBgm(), previewMs);
    renderFocus();
  }

  function installEssentialControls() {
    const settings = document.querySelector('.soundSettingsGrid');
    if (settings && !settings.querySelector(`[data-sound="${ESSENTIAL}"]`)) {
      const button = document.createElement('button');
      button.dataset.sound = ESSENTIAL;
      button.textContent = ESSENTIAL;
      button.title = 'YouTube 재생목록 · 온라인 재생';
      button.onclick = () => chooseEssential(4000);
      const off = settings.querySelector('[data-sound="OFF"]');
      settings.insertBefore(button, off || null);
    }

    const sheet = document.querySelector('.soundSheetOptions');
    if (sheet && !sheet.querySelector(`[data-sheet-sound="${ESSENTIAL}"]`)) {
      const button = document.createElement('button');
      button.dataset.sheetSound = ESSENTIAL;
      button.innerHTML = '<span>YOUTUBE</span><b>essential;</b><small>YouTube 재생목록 · 온라인 재생</small><i>▶</i>';
      button.onclick = () => chooseEssential(5000);
      const off = sheet.querySelector('[data-sheet-sound="OFF"]');
      sheet.insertBefore(button, off || null);
    }
  }

  function normalizeStageText() {
    document.documentElement.dataset.readyStageC = STAGE_VERSION;
    document.querySelectorAll('#settingsView .muted').forEach(el => {
      const text = el.textContent || '';
      if (/APP_VERSION/.test(text)) {
        el.textContent = `APP_VERSION ${APP_VERSION} · MASTER REV_07 · SCHEMA 5 + REV_07 SESSION CONTRACT · STAGING`;
      } else if (/실제 오디오 파일/.test(text)) {
        el.textContent = '로컬 BGM과 essential; YouTube 재생목록을 선택할 수 있어요. essential;은 온라인 재생이며 iPhone 잠금/백그라운드 지속 재생은 보장하지 않습니다.';
      }
    });
  }

  function warmYouTubeWhenChooserOpens() {
    ['soundBtn', 'focusSoundBtn', 'changeBgm'].forEach(id => {
      const button = document.getElementById(id);
      if (!button) return;
      button.addEventListener('click', () => loadYouTubeApi().catch(() => {}), { passive: true });
    });
  }

  function installResumeGesture() {
    const resumeOnce = async () => {
      const session = state.activeSession;
      if (!session || session.pausedAt || session.sound === 'OFF') return;
      if (session.sound === ESSENTIAL && ytPlayer?.getPlayerState?.() === 1) return;
      if (session.sound !== ESSENTIAL && !bgm()?.paused) return;
      await resumeBgm(session.sound);
    };
    window.addEventListener('pointerdown', resumeOnce, { passive: true });
  }

  function validate() {
    return {
      version: STAGE_VERSION,
      appVersion: VERSION?.app || null,
      master: VERSION?.master || null,
      cache: VERSION?.cache || null,
      essentialInSoundMap: Object.prototype.hasOwnProperty.call(SOUND_MAP, ESSENTIAL),
      essentialSettingsButton: !!document.querySelector(`[data-sound="${ESSENTIAL}"]`),
      essentialSheetButton: !!document.querySelector(`[data-sheet-sound="${ESSENTIAL}"]`),
      readyRev07Loaded: !!window.ReadySetRev07,
      routeMode: 'HTTPS_CONTEXT_PRESERVING',
      installedPwaDirectLaunch: 'REVIEW_REQUIRED'
    };
  }

  function boot() {
    installEssentialControls();
    normalizeStageText();
    warmYouTubeWhenChooserOpens();
    installResumeGesture();
    window.ReadyStageC = Object.freeze({ version: STAGE_VERSION, validate, loadYouTubeApi });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
