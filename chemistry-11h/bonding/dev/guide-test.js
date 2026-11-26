// Guide shell self-test: load guide.html?selftest=1 (dev only). Steps every beat by keyboard in presentation mode.
(function () {
  if (!/selftest/.test(location.search)) return;
  window.addEventListener('load', function () {
    var out = [], errs = [];
    window.addEventListener('error', function (e) { errs.push(e.message); });
    function ok(n, c, x) { out.push((c ? 'PASS ' : 'FAIL ') + n + (c || !x ? '' : '  ' + x)); }
    function key(k) { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }
    var shell = GuideShell.shell;
    key('p');
    ok('P enters presentation mode', document.body.classList.contains('present'));
    var seen = [shell.active().id];
    for (var i = 0; i < 40; i++) { key('ArrowRight'); if (seen[seen.length - 1] !== shell.active().id) seen.push(shell.active().id); }
    ok('arrows step through all 33 beats in order', seen.length === 33 && seen[32] === 'b33-which-picture', seen.length);
    ok('one scene mounted at a time (after leave fades)', document.querySelectorAll('.scene-host:not(.is-leaving)').length === 1);
    key('Home');
    ok('Home returns to the first beat', shell.active().id === 'b01-left-off');
    var jump = document.getElementById('chapterJump');
    jump.value = 'ch-b1'; jump.dispatchEvent(new Event('change'));
    ok('chapter jump lands on B·1 beat 9', shell.active().id === 'b09-count');
    key('ArrowRight');
    ok('draw beat mounts the engine', !!document.querySelector('.scene-host:not(.is-leaving) .de-svg'));
    key('t');
    ok('T hides the text', document.body.classList.contains('present-text-off'));
    key('t');
    // Arrow keys inside the drawing must not step beats
    var before = shell.active().id;
    var svg = document.querySelector('.scene-host:not(.is-leaving) .de-svg');
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    ok('arrow keys inside the drawing do not step beats', shell.active().id === before);
    key('Escape');
    ok('Esc leaves presentation mode', !document.body.classList.contains('present'));
    ok('no script errors', errs.length === 0, errs.join(' | '));
    var pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
  });
})();
