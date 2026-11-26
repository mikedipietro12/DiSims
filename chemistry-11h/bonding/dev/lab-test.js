// Draw Lab self-test (dev only). Run: .claude/scripts/run-page.sh "chemistry-11h/bonding/dev/run.html?page=lab.html&test=lab-test.js&selftest"
// Plan check (Task 13): every roster molecule is buildable, matchable, revealable, liftable and exportable.
(function () {
  var errs = [];
  window.addEventListener('error', function (e) { errs.push(e.message); });
  window.addEventListener('load', function () {
    var out = [];
    function ok(n, c, x) { out.push((c ? 'PASS ' : 'FAIL ') + n + (c || !x ? '' : '  ' + x)); }
    var Lab = window.DrawLab, Kit = window.BondingKit, L = window.LewisModel;
    function eng() { return Lab.engine(); }
    function boxes() { return eng().svg.querySelectorAll('.de-match').length; }
    function tiles() { return Array.prototype.map.call(eng().root.querySelectorAll('.de-tray .de-el'), function (b) { return b.textContent; }).join(' '); }
    function btn3d() { return document.getElementById('lab3d'); }

    // --- Picker ---
    var labIds = Kit.MOLECULES.filter(function (m) { return m.tags.indexOf('lab') !== -1; }).map(function (m) { return m.id; });
    var listed = Lab.all.filter(function (id) { return id !== 'blank'; });
    var missing = labIds.filter(function (id) { return listed.indexOf(id) === -1; });
    var dupes = listed.filter(function (id, i) { return listed.indexOf(id) !== i; });
    ok('picker lists every Lab molecule once', !missing.length && !dupes.length, 'missing ' + missing + ' dupes ' + dupes);
    ok('picker starts on a blank canvas with every element', Lab.state().cur === 'blank' && /H .*Xe/.test(tiles()), tiles());
    ok('3D starts off, with a note saying when it opens', btn3d().disabled && /every count is complete/.test(Lab.state().note), Lab.state().note);

    // --- One molecule, start to finish ---
    Lab.pick('ch4');
    ok('picking CH₄: prompt and a tray with just C and H', eng().root.querySelector('.de-prompt').textContent.replace('₄', '4') === 'Draw CH4' && tiles() === 'H C', tiles());
    eng().place('C', 0, 0); eng().place('H', 1, 0);
    ok('half-built: no green box, 3D still off', boxes() === 0 && btn3d().disabled);
    eng().load(Kit.structure('ch4'));
    ok('the accepted structure gets a green box', boxes() === 1);
    ok('a screen reader hears the match', /matches/.test(document.getElementById('labLive').textContent));
    ok('every count complete: 3D turns on', !btn3d().disabled && Lab.state().note === '');
    Lab.open3d(true);
    ok('3D opens beside the drawing with the shape named', !document.getElementById('lab3dPanel').hidden && /tetrahedral, 109\.5°/.test(Lab.state().readout), Lab.state().readout);
    var st = Kit.structure('ch4'); st.atoms[1].lp = 1;   // an extra lone pair on one H: H is over its 2
    eng().load(st);
    ok('changing the drawing while 3D is open: no box, the panel says to finish the counts', boxes() === 0 && /changed/.test(Lab.state().readout), Lab.state().readout);
    Lab.open3d(false);
    ok('closing 3D: button off again until the counts are complete', btn3d().disabled);

    // --- Electron counters switch ---
    function swOf(n) { return document.querySelector('#labSwitches [data-switch="' + n + '"]'); }
    ok('controls row holds four switches; only electron counters starts on',
      ['counters', 'count', 'table', 'fc'].map(function (n) { return swOf(n) && swOf(n).getAttribute('aria-pressed'); }).join(' ') === 'true false false false' &&
      document.querySelectorAll('#labSwitches .de-switch').length === 4);
    function cornerNums() { return eng().svg.querySelectorAll('.de-count-octet, .de-count-valence').length; }
    var oneE = { atoms: [{ el: 'C', x: 0, y: 0, slots: [0, 0, 0, 0, 0, 0, 1, 0] }], bonds: [], transfers: [] };
    Lab.pick('hcn'); eng().restore(oneE);
    function sum() { return eng().root.querySelector('.de-tally-sum').textContent; }
    ok('running count: only the C placed so far, so only its 4 (not the answer)', sum() === 'Valence electrons: C 4 = 4 · Placed: 1 · Still to place: 3', sum());
    eng().place('N', 2, 0); eng().place('H', -2, 0);
    ok('each atom placed adds its term, in the order placed', sum() === 'Valence electrons: C 4 + N 5 + H 1 = 10 · Placed: 1 · Still to place: 9', sum());
    eng().restore(oneE);
    eng().restore({ atoms: [{ el: 'C', x: 0, y: 0, slots: [0, 0, 0, 0, 0, 0, 1, 0] }, { el: 'N', x: 1, y: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0] }], bonds: [{ a: 0, b: 1, order: 1 }], transfers: [] });
    eng().setFc(true);
    var fcCell = eng().root.querySelector('.de-fc-table .de-fc');
    ok('FC waits (–) until the molecule is complete', fcCell && fcCell.textContent === '–', fcCell && fcCell.textContent);
    eng().setFc(false);
    eng().restore(oneE);
    ok('counters start on: a touched C shows its two corner numbers', swOf('counters').getAttribute('aria-pressed') === 'true' && cornerNums() === 2, cornerNums());
    swOf('counters').click();
    ok('switching counters off hides them', swOf('counters').getAttribute('aria-pressed') === 'false' && cornerNums() === 0, cornerNums());
    Lab.pick('nh3'); eng().restore(oneE);
    ok('off carries over to the next molecule', cornerNums() === 0, cornerNums());
    swOf('counters').click();
    ok('switching back on shows them again', cornerNums() === 2, cornerNums());
    Lab.pick('ch4');

    // --- Atom table switch ---
    var tsw = swOf('table'), tlist = eng().root.querySelector('.de-tally-list');
    ok('total e⁻ count starts hidden', eng().root.querySelector('.de-tally-sum').hidden);
    swOf('count').click();
    ok('the count switch shows it', !eng().root.querySelector('.de-tally-sum').hidden);
    swOf('count').click();
    ok('atom table starts closed under the count line', tsw.getAttribute('aria-pressed') === 'false' && tlist.hidden && /Placed: 10 · 2 too many$/.test(eng().root.querySelector('.de-tally-sum').textContent), tsw.getAttribute('aria-pressed') + ' ' + tlist.hidden + ' ' + eng().root.querySelector('.de-tally-sum').textContent);
    tsw.click();
    ok('the switch opens the table and reads on', tsw.getAttribute('aria-pressed') === 'true' && !tlist.hidden);
    Lab.pick('h2o');
    ok('the table stays open on the next molecule', swOf('table').getAttribute('aria-pressed') === 'true' && !eng().root.querySelector('.de-tally-list').hidden);
    eng().load(Kit.structure('co'));
    function fcRows() { return Array.prototype.map.call(eng().root.querySelectorAll('.de-fc-table .de-tally-row'), function (r) { return Array.prototype.map.call(r.children, function (c) { return c.textContent; }).join('|'); }).join(' ; '); }
    ok('formal charge off: no FC table, nothing written on the drawing', eng().root.querySelector('.de-fc-list').hidden && fcRows() === '' && !eng().svg.querySelector('.de-fc-mark'));
    swOf('fc').click();
    ok('formal charge on: a table below works out each atom (CO: C −1, O +1)', !eng().root.querySelector('.de-fc-list').hidden && fcRows() === 'C|4 − 2 − ½(6)|−1 ; O|6 − 2 − ½(6)|+1', fcRows());
    ok('the atom table keeps to electrons (no FC column)', eng().root.querySelectorAll('.de-tally-list:not(.de-fc-list) .de-fc').length === 0);
    eng().place('H', 3, 0);
    ok('a loose atom gets no formal charge row', fcRows() === 'C|4 − 2 − ½(6)|−1 ; O|6 − 2 − ½(6)|+1', fcRows());
    swOf('fc').click();
    Lab.pick('nh4');
    eng().place('N', 0, 0); eng().place('H', 1.5, 0); eng().place('H', -1.5, 0); eng().place('H', 0, 1.5);
    ok('NH₄⁺ with three H placed: no charge term yet', !/charge/.test(sum()) && /= 8 ·/.test(sum()), sum());
    eng().place('H', 0, -1.5);
    ok('the fourth H brings in the charge: 9 − 1 = 8', / − 1 \(charge\) = 8 ·/.test(sum()), sum());
    Lab.pick('co3'); eng().load(Kit.structure('co3'));
    var co3 = eng().root.querySelector('.de-tally-sum').textContent;
    ok('carbonate: charge term from the ion, 24 in all', /^Valence electrons: C 4 \+ O 6 \+ O 6 \+ O 6 \+ 2 \(charge\) = 24 · Placed: 24 · Still to place: 0$/.test(co3), co3);
    swOf('table').click();
    Lab.pick('ch4');

    // --- Work is kept per molecule ---
    eng().load(Kit.structure('ch4'));
    Lab.pick('h2o'); Lab.pick('ch4');
    ok('switching molecules and back keeps the drawing', boxes() === 1 && eng().get().atoms.length === 5);

    // --- Resonance: any equivalent form matches ---
    Lab.pick('no3');
    var forms = L.resonanceForms(Kit.structure('no3'));
    eng().load(forms[forms.length - 1]);
    ok('NO₃⁻: a different resonance form still gets the green box', forms.length === 3 && boxes() === 1, forms.length);

    // --- Formal charge choice: valid octets but not the accepted structure ---
    Lab.pick('co2');
    eng().load(Kit.structure('co2-alt'));
    ok('CO₂ drawn as O≡C–O: counts complete (3D on) but no green box', boxes() === 0 && !btn3d().disabled);

    // --- Blank canvas recognises known molecules ---
    Lab.pick('blank');
    eng().load(Kit.structure('h2o'));
    ok('blank canvas: water is recognised and boxed', boxes() === 1);
    Lab.open3d(true);
    ok('blank canvas: 3D names it and gives the bent shape', /H₂O: 4 domains .* bent/.test(Lab.state().readout), Lab.state().readout);
    Lab.open3d(false);
    eng().loadMany([Kit.structure('h2o'), Kit.structure('nh3')]);
    ok('two molecules on the tray: 3D says one at a time', btn3d().disabled && /one molecule at a time/.test(Lab.state().note), Lab.state().note);

    // --- Every roster molecule: match, reveal, 3D ---
    var bad = { match: [], reveal: [], lift: [] };
    listed.forEach(function (id) {
      Lab.pick(id);
      eng().load(Kit.structure(id));
      if (boxes() !== 1) bad.match.push(id);
      eng().showReference(true);
      if (!eng().root.querySelector('.de-reveal-item')) bad.reveal.push(id);
      eng().showReference(false);
      if (btn3d().disabled) { bad.lift.push(id + '(off)'); return; }
      Lab.open3d(true);
      if (!/ → [A-Za-z]/.test(Lab.state().readout)) bad.lift.push(id);
      Lab.open3d(false);
    });
    ok('every roster molecule: its structure gets the green box', !bad.match.length, bad.match.join(' '));
    ok('every roster molecule: Show answer shows it', !bad.reveal.length, bad.reveal.join(' '));
    // BF₃ (B has 6) and the expanded octets count as complete; odd-electron or exceptions would show here
    ok('every roster molecule: 3D opens with a shape', !bad.lift.length, bad.lift.join(' '));

    // --- Present + URL ---
    document.getElementById('labBig').click();
    ok('Present enlarges the drawing', document.body.classList.contains('lab-big') && getComputedStyle(eng().root).getPropertyValue('--de-scale').trim() === '1.35');
    document.getElementById('labBig').click();
    Lab.pick('sf6');
    ok('the address follows the picker (?m=sf6)', /[?&]m=sf6/.test(location.search), location.search);

    // --- Save (async) ---
    eng().load(Kit.structure('sf6'));
    eng().exportJPEG().then(function (blob) {
      ok('Save JPEG works (' + (blob && blob.size) + ' bytes)', blob && blob.size > 5000);
    }, function (e) { ok('Save JPEG works', false, e && e.message); }).then(function () {
      ok('no script errors', errs.length === 0, errs.join(' | '));
      var pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
    });
  });
})();
