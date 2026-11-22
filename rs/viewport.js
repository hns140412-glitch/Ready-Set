/* Ready & Set: keep the app full-screen on iPhone (Taky 2026-11-22 real-device report).
   Home-screen app on iOS: after the keyboard closes, WebKit can leave the page scrolled up and the
   viewport short, so the bottom of the screen stays blank and the screen does not come back.
   - --app-h is the app height. In the home-screen app it holds the tallest height seen at this width
     (the keyboard never squashes the layout); in a browser tab it follows the visible height
     (Safari toolbars come and go).
   - After an input loses focus, on resume and on rotation: scroll back to the top and, if the
     viewport is still short, force one relayout of #app so WebKit re-measures. */
(function () {
  var de = document.documentElement, maxH = 0, lastW = 0;
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  function typing() { var a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); }
  function measure() {
    var w = window.innerWidth, h = Math.max(window.innerHeight, de.clientHeight);
    if (w !== lastW) { lastW = w; maxH = 0; }
    if (!typing() || !maxH) maxH = standalone ? Math.max(maxH, h) : h;
    de.style.setProperty('--app-h', maxH + 'px');
  }
  function heal() {
    if (typing()) return;
    window.scrollTo(0, 0); de.scrollTop = 0; if (document.body) document.body.scrollTop = 0;
    var app = document.getElementById('app');
    if (app && standalone && maxH - window.innerHeight > 4) { app.style.display = 'none'; void app.offsetHeight; app.style.display = ''; window.scrollTo(0, 0); }
    measure();
  }
  window.addEventListener('resize', measure);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', measure);
  document.addEventListener('focusout', function () { setTimeout(heal, 140); }, true);
  window.addEventListener('orientationchange', function () { setTimeout(function () { lastW = 0; measure(); }, 300); });
  window.addEventListener('pageshow', function () { setTimeout(heal, 60); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(heal, 60); });
  measure();
  window.RSViewport = { heal: heal, measure: measure };
})();
