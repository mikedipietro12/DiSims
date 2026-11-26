/* Light / dark theme switch (students asked for dark mode, 2026-11-25).
   Load synchronously in <head>, after the stylesheets, so the page never flashes the wrong theme.
   Sets <html data-theme="light|dark"> from, in order:
     ?theme=dark|light in the URL (for screenshots and tests; not saved),
     the saved choice (localStorage 'as-theme'),
     the device setting (prefers-color-scheme).
   Adds a sun/moon keycap to the page's .top-nav. A click flips the theme, saves it,
   and fires a 'themechange' event on window with { detail: { theme } }.
   Only pages that load this file can go dark; the dark tokens live in the suite's CSS. */
(function (global) {
  var KEY = 'as-theme';
  var root = document.documentElement;

  function saved() {
    try { var v = global.localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; }
    catch (e) { return null; }
  }
  function fromUrl() {
    var m = /[?&]theme=(dark|light)\b/.exec(global.location.search || '');
    return m ? m[1] : null;
  }
  function fromDevice() {
    try { return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }

  var forced = fromUrl();
  var theme = forced || saved() || fromDevice();
  root.setAttribute('data-theme', theme);

  function apply(next, save) {
    theme = next;
    root.setAttribute('data-theme', next);
    if (save) { try { global.localStorage.setItem(KEY, next); } catch (e) { /* private window: theme just won't persist */ } }
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    try { global.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } })); } catch (e) { /* old browser */ }
  }

  /* Follow the device setting live until the student picks a theme themselves. */
  try {
    var mq = global.matchMedia('(prefers-color-scheme: dark)');
    var onDevice = function (e) { if (!forced && !saved()) apply(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', onDevice); else if (mq.addListener) mq.addListener(onDevice);
  } catch (e) { /* no matchMedia */ }

  var ICON =
    '<svg class="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<g class="theme-sun" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="12" r="4.2"/>' +
        '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>' +
      '</g>' +
      '<path class="theme-moon" fill="currentColor" d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8z"/>' +
    '</svg>';

  function addButton() {
    var nav = document.querySelector('.top-nav');
    if (!nav || nav.querySelector('.theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn theme-toggle';
    btn.setAttribute('aria-label', 'Dark mode');
    btn.setAttribute('title', 'Dark mode');
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.innerHTML = ICON;
    btn.addEventListener('click', function () { apply(theme === 'dark' ? 'light' : 'dark', true); });

    /* Sit at the right-hand end of the nav, next to whatever is already there. */
    var end = nav.querySelector('.top-nav-end');
    if (!end) {
      end = document.createElement('div');
      end.className = 'top-nav-end';
      var last = nav.lastElementChild;
      if (last && last !== nav.firstElementChild) end.appendChild(last);
      nav.appendChild(end);
    }
    end.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();

  global.SiteTheme = { get: function () { return theme; }, set: function (t) { apply(t === 'dark' ? 'dark' : 'light', true); } };
})(window);
