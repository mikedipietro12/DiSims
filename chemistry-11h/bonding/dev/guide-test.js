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
    var n = shell.beats.length;
    ok('first beat is the Chapter A briefing, shown on the stage', seen[0] === 'a-brief' && !!document.querySelector('.scene-host:not(.is-leaving) .scene-brief .brief-block.cc li'));
    for (var i = 0; i < n + 5; i++) { key('ArrowRight'); if (seen[seen.length - 1] !== shell.active().id) seen.push(shell.active().id); }
    ok('arrows step through all ' + n + ' beats in order', seen.length === n && seen[n - 1] === 'b33-which-picture', seen.length);
    ok('three briefings: A, B·1, C', ['a-brief', 'b-brief', 'c-brief'].every(function (id) { return seen.indexOf(id) >= 0; }) && document.querySelectorAll('.brief-beat').length === 3);
    ok('one scene mounted at a time (after leave fades)', document.querySelectorAll('.scene-host:not(.is-leaving)').length === 1);
    key('Home');
    ok('Home returns to the first beat', shell.active().id === 'a-brief');
    var jump = document.getElementById('chapterJump');
    jump.value = 'ch-b1'; jump.dispatchEvent(new Event('change'));
    ok('chapter jump lands on the B briefing', shell.active().id === 'b-brief');
    key('ArrowRight');
    ok('next is B·1 beat 9', shell.active().id === 'b09-count');
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
    // Corner counts: on through the multiple bonds beat (b12), off from b13 on
    function cornersAfterOneElectron(id) {
      shell.goTo(document.getElementById(id));
      var host = document.querySelector('.scene-host:not(.is-leaving)');
      var tileEl = host.querySelector('.de-tray .de-el');
      tileEl.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));   // keyboard place
      var atom = host.querySelector('.de-hit-atom');
      atom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));   // one electron
      return host.querySelectorAll('.de-count-octet, .de-count-valence').length;
    }
    var c12 = cornersAfterOneElectron('b12-multiple'), c14 = cornersAfterOneElectron('b14-practice-multiple'), c15 = cornersAfterOneElectron('b15-ions');
    ok('corner counts show on b12 and are gone from b14 and b15', c12 > 0 && c14 === 0 && c15 === 0, c12 + ' / ' + c14 + ' / ' + c15);

    // Atom table: open on the formal-charge beat (its prompt reads it), closed elsewhere; the panel stays inside the stage
    function hostQ(sel) { return document.querySelector('.scene-host:not(.is-leaving) ' + sel); }
    shell.goTo(document.getElementById('b13-formal-charge'));
    var fcs = Array.prototype.map.call(document.querySelectorAll('.scene-host:not(.is-leaving) .de-tally-row .de-fc'), function (c) { return c.textContent; });
    ok('b13: atom table open, with FC worked out in each row', hostQ('[data-switch="table"]').getAttribute('aria-pressed') === 'true' && hostQ('[data-switch="fc"]').hidden && fcs.length === 6 && fcs.every(function (x) { return /= [+−]?\d$/.test(x); }), fcs.join(' ; '));
    var stage = document.querySelector('.guide-stage-panel').getBoundingClientRect(), tally = hostQ('.de-tally').getBoundingClientRect(), svgR = hostQ('.de-svg').getBoundingClientRect();
    ok('b13 in Present: table fits inside the stage, drawing keeps its 200 px minimum', tally.bottom <= stage.bottom + 1 && svgR.height >= 199, Math.round(tally.bottom) + ' vs ' + Math.round(stage.bottom) + ', svg ' + Math.round(svgR.height));
    shell.goTo(document.getElementById('b15-ions'));
    ok('b15: count, table and formal charge all start off; FC switch offered', ['count', 'table', 'fc'].every(function (n) { var b = hostQ('[data-switch="' + n + '"]'); return b && !b.hidden && b.getAttribute('aria-pressed') === 'false'; }) && hostQ('.de-tally-list').hidden && hostQ('.de-tally-sum').hidden);
    hostQ('[data-switch="count"]').click();
    shell.goTo(document.getElementById('b11-practice-single'));
    ok('before formal charge (b11): no formal charge switch', hostQ('[data-switch="fc"]').hidden && !hostQ('[data-switch="count"]').hidden);
    shell.goTo(document.getElementById('b15-ions'));
    ok('the count switch is carried from beat to beat', hostQ('[data-switch="count"]').getAttribute('aria-pressed') === 'true' && !hostQ('.de-tally-sum').hidden);
    // b15 asks for NH₄⁺ and CO₃²⁻, but only the H placed above is counted: no answer up front
    ok('b15: the count holds only what is placed (one H, one electron)', hostQ('.de-tally-sum').textContent === 'Valence electrons: H 1 = 1 · Placed: 1 · Still to place: 0', hostQ('.de-tally-sum').textContent);
    var lines;
    shell.goTo(document.getElementById('b13-formal-charge'));
    lines = Array.prototype.map.call(document.querySelectorAll('.scene-host:not(.is-leaving) .de-sum-line'), function (x) { return x.textContent; });
    ok('b13: structure A and structure B each have their own count of 16', lines.length === 2 && /^A · CO₂.*= 16 · Placed: 16/.test(lines[0]) && /^B · CO₂.*= 16 · Placed: 16/.test(lines[1]), lines.join(' | '));
    // Practice on paper: small tiles round a large centre; a tile shows its answer there, again hides it
    shell.goTo(document.getElementById('b18-paper'));
    var ptiles = document.querySelectorAll('.scene-host:not(.is-leaving) .paper-tile'), pc = hostQ('.paper-centre');
    var pcR = pc.getBoundingClientRect(), t0 = ptiles[0].getBoundingClientRect(), panel = document.querySelector('.guide-stage-panel').getBoundingClientRect();
    var inside = Array.prototype.every.call(ptiles, function (t) { var r = t.getBoundingClientRect(); return r.bottom <= panel.bottom + 1 && r.right <= panel.right + 1 && r.height >= 43; });
    ok('paper: 20 tiles round a centre tile larger than any tile, all inside the stage', ptiles.length === 20 && pcR.width > 3 * t0.width && pcR.height > 2 * t0.height && inside,
      ptiles.length + ' tiles, centre ' + Math.round(pcR.width) + '×' + Math.round(pcR.height) + ', tile ' + Math.round(t0.width) + '×' + Math.round(t0.height) + ', inside ' + inside);
    ok('paper: nothing shown to start', !pc.classList.contains('is-open') && !hostQ('.paper-centre-empty').hidden);
    var ch3oh = Array.prototype.filter.call(ptiles, function (t) { return /CH₃OH/.test(t.textContent); })[0];
    ch3oh.click();
    ok('paper: a tile shows its structure in the centre', pc.classList.contains('is-open') && ch3oh.getAttribute('aria-pressed') === 'true' && /methanol/.test(hostQ('.paper-centre-title').textContent) && hostQ('.paper-svg').querySelectorAll('text').length === 6);
    ptiles[1].click();
    ok('paper: another tile swaps the answer', ch3oh.getAttribute('aria-pressed') === 'false' && ptiles[1].getAttribute('aria-pressed') === 'true');
    ptiles[1].click();
    ok('paper: clicking it again hides the answer', !pc.classList.contains('is-open'));
    key('Escape');
    ok('Esc leaves presentation mode', !document.body.classList.contains('present'));
    key('p');
    shell.goTo(document.getElementById('c-brief'));
    ok('Present: C briefing on the stage', !!document.querySelector('.scene-host:not(.is-leaving) .scene-brief'));
    key('Escape');
    ok('scrolling: C briefing hands the stage to its first scene', shell.active().id === 'c-brief' && !document.querySelector('.scene-host:not(.is-leaving) .scene-brief') && /Carbon/.test(document.getElementById('stageBadge').textContent), document.getElementById('stageBadge').textContent);
    var host = document.querySelector('.scene-host:not(.is-leaving)');
    shell.goTo(document.getElementById('b26-puzzle'));
    ok('scrolling on to that scene keeps it (no remount)', document.querySelector('.scene-host:not(.is-leaving)') === host);
    ok('no script errors', errs.length === 0, errs.join(' | '));
    var pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
  });
})();
