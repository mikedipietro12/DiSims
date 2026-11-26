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
    // Corner counts: on through multiple-bond practice (b14), off from polyatomic ions (b15) on
    function cornersAfterOneElectron(id) {
      shell.goTo(document.getElementById(id));
      var host = document.querySelector('.scene-host:not(.is-leaving)');
      var tileEl = host.querySelector('.de-tray .de-el');
      tileEl.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));   // keyboard place
      var atom = host.querySelector('.de-hit-atom');
      atom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));   // one electron
      return host.querySelectorAll('.de-count-octet, .de-count-valence').length;
    }
    var c14 = cornersAfterOneElectron('b14-practice-multiple'), c15 = cornersAfterOneElectron('b15-ions');
    ok('corner counts show on b14 and are gone from b15', c14 > 0 && c15 === 0, c14 + ' / ' + c15);

    // Atom table: open on the formal-charge beat (its prompt reads it), closed elsewhere; the panel stays inside the stage
    function hostQ(sel) { return document.querySelector('.scene-host:not(.is-leaving) ' + sel); }
    shell.goTo(document.getElementById('b13-formal-charge'));
    var fcs = Array.prototype.map.call(document.querySelectorAll('.scene-host:not(.is-leaving) .de-tally-row .de-fc'), function (c) { return c.textContent; });
    ok('b13: atom table open, with FC worked out in each row', hostQ('.de-table-toggle').getAttribute('aria-pressed') === 'true' && fcs.length === 6 && fcs.every(function (x) { return /= [+−]?\d$/.test(x); }), fcs.join(' ; '));
    var stage = document.querySelector('.guide-stage-panel').getBoundingClientRect(), tally = hostQ('.de-tally').getBoundingClientRect(), svgR = hostQ('.de-svg').getBoundingClientRect();
    ok('b13 in Present: table fits inside the stage, drawing keeps its 200 px minimum', tally.bottom <= stage.bottom + 1 && svgR.height >= 199, Math.round(tally.bottom) + ' vs ' + Math.round(stage.bottom) + ', svg ' + Math.round(svgR.height));
    shell.goTo(document.getElementById('b15-ions'));
    ok('b15: atom table closed (follows the last switch), count line shows NH₄⁺ and CO₃²⁻', hostQ('.de-table-toggle').getAttribute('aria-pressed') === 'false' && hostQ('.de-tally-list').hidden && /NH₄⁺ 8 \+ CO₃²⁻ 24 = 32/.test(hostQ('.de-tally-sum').textContent), hostQ('.de-tally-sum').textContent);
    key('Escape');
    ok('Esc leaves presentation mode', !document.body.classList.contains('present'));
    ok('no script errors', errs.length === 0, errs.join(' | '));
    var pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
  });
})();
