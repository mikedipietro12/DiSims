/**
 * Draw engine self-test (skeleton-first model). Loaded by dev/draw-test.html; runs with ?selftest.
 * Drives the live engine with real pointer and key events.
 */
function selfTest(d) {
  var out = [];
  function ok(name, cond, extra) { out.push((cond ? 'PASS ' : 'FAIL ') + name + (cond || !extra ? '' : '  ' + extra)); }
  var svg = d.svg, pid = 1;
  function abs(p) { var r = svg.getBoundingClientRect(); return { x: r.left + p.x, y: r.top + p.y }; }
  function fire(target, type, c, buttons) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, pointerId: pid, pointerType: 'mouse', button: 0, buttons: buttons, isPrimary: true }));
  }
  function click(p) { var c = abs(p); fire(svg, 'pointerdown', c, 1); fire(svg, 'pointerup', c, 0); pid++; }
  function drag(p1, p2) {
    var a = abs(p1), b = abs(p2);
    fire(svg, 'pointerdown', a, 1);
    for (var i = 1; i <= 8; i++) fire(svg, 'pointermove', { x: a.x + (b.x - a.x) * i / 8, y: a.y + (b.y - a.y) * i / 8 }, 1);
    fire(svg, 'pointerup', b, 0);
    pid++;
  }
  function A(i) { return d._atomPx(i); }
  function dotsOf(i) { return d._dots().filter(function (x) { return x.atom === i; }); }
  function tile(sym) { return Array.prototype.filter.call(d.root.querySelectorAll('.de-el'), function (x) { return x.textContent === sym; })[0]; }
  function m() { return d.get(); }
  function layerCount(sel) { return svg.firstElementChild.querySelectorAll(sel).length; }
  function clickN(i, n) { for (var k = 0; k < n; k++) click(A(i)); }
  function bond(i, j) { drag(A(i), A(j)); }
  var t;

  // --- Tray ---------------------------------------------------------------------------
  d.clear();
  tile('C').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  ok('clicking a tray tile does not place an atom', m().atoms.length === 0);
  var tl = tile('O'), tr = tl.getBoundingClientRect(), sr = svg.getBoundingClientRect();
  var drop = { x: sr.left + sr.width / 2 + 96, y: sr.top + sr.height / 2 };
  fire(tl, 'pointerdown', { x: tr.left + 10, y: tr.top + 10 }, 1);
  fire(document, 'pointermove', drop, 1);
  fire(document, 'pointerup', drop, 0);
  pid++;
  ok('dragging a tile into the box places it where dropped', m().atoms.length === 1 && Math.abs(m().atoms[0].x - 1.5) < 0.2, JSON.stringify(m().atoms));
  ok('a placed atom starts with no electrons', m().atoms.length === 1 && m().atoms[0].ne === 0 && dotsOf(0).length === 0);
  tile('N').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  ok('keyboard Enter on a tile places it at a free spot', m().atoms.length === 2);

  // --- CO2: atoms, then electrons by clicking, then share by dragging electron onto electron ---
  function share(i, j) { drag(dotsOf(i)[0], dotsOf(j)[0]); }
  function eraseClick(p) { d.root.querySelector('.de-tools .btn').click(); click(p); d.root.querySelector('.de-tools .btn').click(); }
  d.clear();
  d.place('O', -1.5, 0); d.place('C', 0, 0); d.place('O', 1.5, 0);
  ok('untouched atoms show no number', layerCount('.de-count') === 0);
  clickN(0, 4);
  ok('clicking an atom adds electrons one at a time', m().atoms[0].ne === 4 && dotsOf(0).length === 4);
  function counts(sel) { return Array.prototype.map.call(svg.firstElementChild.querySelectorAll(sel), function (x) { return x.textContent; }).sort().join(','); }
  function pills() { return counts('.de-count-octet'); }
  ok('O with 4 electrons shows 4 (electrons still needed for its octet)', pills() === '4', pills());
  ok('O with 4 electrons shows 2 valence electrons still to place', counts('.de-count-valence') === '2', counts('.de-count-valence'));
  clickN(1, 1);
  ok('C with its first electron shows 7 (octet) and 3 (valence)', pills() === '4,7' && counts('.de-count-valence') === '2,3', pills() + ' / ' + counts('.de-count-valence'));
  d.setCounters(false);
  ok('counters off: no corner numbers, the drawing is unchanged', layerCount('.de-count') === 0 && m().atoms[1].ne === 1);
  d.setCounters(true);
  ok('counters back on: the same numbers return', pills() === '4,7' && counts('.de-count-valence') === '2,3');
  clickN(0, 2); clickN(1, 3); clickN(2, 6);
  ok('unbonded O, C, O count to the octet: 2, 4, 2', pills() === '2,2,4', pills());
  ok('full valence shells hide the valence count', counts('.de-count-valence') === '', counts('.de-count-valence'));
  share(1, 0);
  ok('electron onto electron makes a bond; loose O slides to bond length', m().bonds.length === 1 && Math.abs(m().atoms[0].x + 1) < 0.05, JSON.stringify(m().atoms[0]));
  share(1, 0); share(1, 2); share(1, 2);
  ok('sharing again raises the order: O=C=O matches', LewisModel.sameStructure(m(), BondingKit.structure('co2')), JSON.stringify(m()));
  ok('every octet complete: no numbers left', layerCount('.de-count') === 0);
  function sumLine() { return d.root.querySelector('.de-tally-sum').textContent; }
  ok('count line from the tray (no reference): CO₂ 16, all placed', /= 16 · Placed: 16 · Still to place: 0/.test(sumLine()), sumLine());
  d.setTable(true);
  function cells() { return Array.prototype.map.call(d.root.querySelectorAll('.de-tally-row'), function (r) { return Array.prototype.map.call(r.children, function (c) { return c.textContent; }).join('|'); }); }
  ok('atom table: C first, then O₁ and O₂ (numbered in the table only)', cells().join(' ; ') === 'C|8|0|8 / 8|0 ; O₁|4|4|8 / 8|0 ; O₂|4|4|8 / 8|0' && layerCount('text') === 3, cells().join(' ; '));
  fire(svg, 'pointermove', abs(A(1)), 0);
  ok('hovering C highlights its tally row', d.root.querySelectorAll('.de-tally-row.is-focus').length === 1);

  // --- Click a bond: one pair breaks, each atom gets one electron back ------------------
  click({ x: (A(0).x + A(1).x) / 2, y: (A(0).y + A(1).y) / 2 });
  ok('clicking a double bond breaks one pair and returns electrons', m().bonds[0].order === 1 && m().atoms[1].ne === 1 && m().atoms[0].ne === 5);
  d.undo();

  // --- Moving: central atom moves the whole structure, a terminal atom moves alone ------
  var before = m().atoms.map(function (x) { return x.x; });
  drag(A(1), { x: A(1).x, y: A(1).y + 64 });
  ok('dragging the central atom moves the whole structure', m().atoms.every(function (x) { return Math.abs(x.y - 1) < 0.01; }), JSON.stringify(m().atoms));
  drag(A(0), { x: A(0).x, y: A(0).y - 64 });
  ok('dragging a terminal atom moves only that atom', Math.abs(m().atoms[0].y) < 0.01 && Math.abs(m().atoms[1].y - 1) < 0.01);
  click(A(1));
  ok('a click on an atom never moves it', Math.abs(m().atoms[1].y - 1) < 0.01);

  // --- Electrons: pair on the same atom, empty-space drop snaps back, Erase removes -----
  d.clear();
  d.place('O', 0, 0);
  clickN(0, 4);
  ok('four clicks give four single electrons on four sides', d.state().atoms[0].slots.filter(function (c) { return c === 1; }).length === 4);
  var ds = dotsOf(0);
  drag(ds[0], ds[1]);
  var sl = d.state().atoms[0].slots;
  ok('dragging one electron onto another on the same atom pairs them', sl.filter(function (c) { return c === 2; }).length === 1 && sl.reduce(function (x, y) { return x + y; }) === 4, JSON.stringify(sl));
  var e0 = dotsOf(0)[0];
  drag(e0, { x: e0.x + 220, y: e0.y + 140 });
  ok('dropping an electron in empty space snaps it back', m().atoms[0].ne === 4);
  click(dotsOf(0)[0]);
  ok('clicking an electron does nothing', m().atoms[0].ne === 4);
  eraseClick(dotsOf(0)[0]);
  ok('Erase + click an electron removes it', m().atoms[0].ne === 3);

  // --- CO: covalent drops on a letter share (never move); fix the count with Erase + click ---
  d.clear();
  d.place('C', -0.75, 0); d.place('O', 0.75, 0);
  clickN(0, 4); clickN(1, 6);
  share(0, 1); share(0, 1);
  drag(dotsOf(0)[0], A(1));
  ok('covalent: electron onto a letter shares it (triple bond, no transfer)', m().bonds[0].order === 3 && !(d.state().transfers || []).length, JSON.stringify(d.state()));
  ok('C short by one shows 1; O over by one shows +1', pills() === '+1,1', pills());
  eraseClick(dotsOf(1)[0]); click(A(0));
  var fc = d.tally().atoms.map(function (x) { return x.fc; });
  ok('CO: both octets complete, formal charges C −1 and O +1', LewisModel.sameStructure(m(), BondingKit.structure('co')) && fc[0] === -1 && fc[1] === 1 && layerCount('.de-count') === 0, JSON.stringify(m()));

  // --- NH4+: four shares, then remove N's extra electron -----------------------------------
  d.clear();
  d.place('N', 0, 0); d.place('H', 0, -1.6); d.place('H', 1.6, 0); d.place('H', 0, 1.6); d.place('H', -1.6, 0);
  clickN(0, 5); clickN(1, 1); clickN(2, 1); clickN(3, 1); clickN(4, 1);
  share(1, 0); share(2, 0); share(3, 0); share(4, 0);
  ok('no brackets while N still has 9 electrons around it', layerCount('path[d*=" V"]') === 0);
  eraseClick(dotsOf(0)[0]);
  ok('NH4+: N +1 and brackets with the charge', LewisModel.sameStructure(m(), BondingKit.structure('nh4')) && m().charge === 1 && layerCount('path[d*=" V"]') === 2, JSON.stringify(m()));

  // --- Ionic: Na's electron dropped on Cl's electron is sent, not shared --------------------
  d.clear();
  d.place('Na', -1.5, 0); d.place('Cl', 1.5, 0);
  clickN(0, 1); clickN(1, 7);
  share(0, 1);
  t = m();
  ok('Na sends its electron to Cl (no bond)', t.bonds.length === 0 && t.atoms[0].ne === 0 && t.atoms[1].ne === 8, JSON.stringify(t));
  ok('a solid curved arrow shows while the electron is sent; both ions are bracketed', layerCount('path[d*="Q"]') === 1 && layerCount('path[d*=" V"]') === 4);
  var clSlots = d.state().atoms[1].slots;
  ok('Cl\u207b electrons settle as four even pairs', [0, 2, 4, 6].every(function (q) { return clSlots[q] === 2; }), JSON.stringify(clSlots));

  // --- Keyboard: Enter adds electrons, B on one atom then B on another shares ---------------
  d.clear();
  d.place('H', -1, 0); d.place('Cl', 1, 0);
  function key(i, k, shift) {
    svg.querySelector('.de-hit-atom[data-atom="' + i + '"]').focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey: !!shift, bubbles: true }));
  }
  key(0, 'Enter');
  for (var q = 0; q < 7; q++) key(1, 'Enter');
  key(0, 'b'); key(1, 'b');
  ok('keyboard: Enter adds electrons, B then B shares (HCl)', LewisModel.sameStructure(m(), BondingKit.structure('hcl')), JSON.stringify(m()));

  // --- The view holds still while drawing: adding atoms (even near the edge) never rescales ---
  d.clear();
  d.place('C', 1.5, 1);
  var p0 = A(0);
  d.place('O', 5.5, 2.5); d.place('O', -5.5, -2.5); clickN(1, 6); clickN(2, 6);
  ok('adding atoms near the edge does not zoom or shift the drawing', Math.abs(A(0).x - p0.x) < 0.5 && Math.abs(A(0).y - p0.y) < 0.5, JSON.stringify([p0, A(0)]));

  // --- Reveal + multi-load --------------------------------------------------------------
  d.setReference(['ch4', 'h2o']);
  d.showReference(true);
  ok('reveal lists every molecule in the set', d.root.querySelectorAll('.de-reveal-item').length === 2);
  d.showReference(false);
  d.setReference(null);
  d.loadMany([BondingKit.structure('co2'), BondingKit.structure('co2-alt')]);
  ok('loadMany: two structures side by side with all electrons', m().atoms.length === 6 && LewisModel.tally(m()).placed === 32);

  var pre = document.createElement('pre');
  pre.id = 'selftest';
  pre.textContent = out.join('\n');
  document.querySelector('.wrap').insertBefore(pre, document.getElementById('mount'));
  d.load(BondingKit.structure('co'));
  d.exportJPEG().then(function (blob) {
    pre.textContent += '\n' + (blob && blob.type === 'image/jpeg' && blob.size > 5000 ? 'PASS ' : 'FAIL ') + 'JPEG export (' + (blob ? blob.size + ' bytes' : 'none') + ')';
  });
  // The send arrow clears from the tray once the electron lands
  d.clear();
  d.place('Na', -1.5, 0); d.place('Cl', 1.5, 0);
  clickN(0, 1); clickN(1, 7);
  share(0, 1);
  setTimeout(function () {
    function line(ok2, name, extra) { pre.textContent += '\n' + (ok2 ? 'PASS ' : 'FAIL ') + name + (ok2 || !extra ? '' : '  ' + extra); }
    line(layerCount('path[d*="Q"]') === 0 && layerCount('path[d*=" V"]') === 4, 'the arrow disappears after the send; brackets stay');
    var at = m().atoms, dist = Math.hypot(at[0].x - at[1].x, at[0].y - at[1].y);
    line(Math.abs(dist - 1.8) < 0.05 && Math.abs(at[0].y - at[1].y) < 0.01, 'Na⁺ snaps in beside Cl⁻ (opposite charges attract)', JSON.stringify(at));
    var fills = Array.prototype.map.call(svg.firstElementChild.querySelectorAll('circle'), function (c) { return c.getAttribute('fill'); });
    line(fills.indexOf('#e8264f') !== -1 && fills.indexOf('#ffc21a') !== -1, 'Na⁺ glows red and Cl⁻ yellow');
    var clDot = dotsOf(1)[0];
    drag(clDot, { x: clDot.x + 200, y: clDot.y + 120 });
    click(A(1));
    line(m().atoms[1].ne === 8 && d.state().atoms[1].slots.join() === '2,0,2,0,2,0,2,0', 'Cl⁻ electrons are set: no drag, no add', JSON.stringify(d.state().atoms[1].slots));
    var before = A(0);
    drag(A(1), { x: A(1).x, y: A(1).y + 64 });
    line(Math.abs(A(0).y - before.y - 64) < 2, 'dragging one ion moves the pair together');
  }, 1600);
}
