/* IMF suite chrome - room switcher current-page marking. */
(function (global) {
  function markRoomNav() {
    var path = (global.location.pathname || '').split('/').pop() || '';
    var links = document.querySelectorAll('.room-switch a[data-room]');
    links.forEach(function (a) {
      var room = a.getAttribute('data-room');
      var href = (a.getAttribute('href') || '').split('/').pop();
      var current =
        path === href ||
        (room === 'hub' && (path === '' || path === 'index.html')) ||
        (room === 'guide' && path === 'guide.html') ||
        (room === 'sandbox' && path === 'sandbox.html') ||
        (room === 'heat' && path === 'heat.html');
      if (current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  global.ImfChrome = { markRoomNav: markRoomNav };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markRoomNav);
  } else {
    markRoomNav();
  }
})(window);
