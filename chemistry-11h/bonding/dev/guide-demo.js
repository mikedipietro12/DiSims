// Guide screenshot states (dev only): run.html?page=guide.html&test=guide-demo.js&beat=b13-formal-charge[&present=1]
(function () {
  window.addEventListener('load', function () {
    var q = new URLSearchParams(location.search);
    var shell = GuideShell.shell, beat = document.getElementById(q.get('beat') || 'b13-formal-charge');
    if (q.get('present')) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    shell.goTo(beat);
  });
})();
