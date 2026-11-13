/**
 * Lewis model tests (Task 3, step 5). Runs in node (`node dev/lewis-tests.js`) and in
 * dev/lewis-tests.html. Every reference structure in the kit must count correctly.
 */
(function (global) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var Kit = isNode ? require('../assets/bonding-kit.js') : global.BondingKit;
  var L = isNode ? require('../assets/lewis-model.js') : global.LewisModel;

  var results = [];
  function check(name, ok, detail) { results.push({ name: name, ok: !!ok, detail: detail || '' }); }
  function eq(name, got, want) { check(name, JSON.stringify(got) === JSON.stringify(want), 'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want)); }

  // 1. Every reference structure: electrons placed = available, every atom counted, FC sum = charge
  Kit.MOLECULES.forEach(function (m) {
    var s = Kit.structure(m.id);
    var t = L.tally(s);
    eq(m.id + ' placed = available', t.placed, t.available);
    check(m.id + ' every atom counted', t.allCounted,
      t.atoms.filter(function (a) { return a.status === 'short' || a.status === 'over'; }).map(function (a) { return a.countText; }).join('; '));
    eq(m.id + ' FC sum = charge', t.fcSum, m.charge);
  });

  // 2. Formal charges that the Guide teaches
  var FC = {
    'co': [-1, 1], 'co2': [0, 0, 0], 'co2-alt': [1, 0, -1], 'o3': [0, 1, -1],
    'no3': [1, 0, -1, -1], 'co3': [0, 0, -1, -1], 'nh4': [1, 0, 0, 0, 0], 'h3o': [1, 0, 0, 0],
    'cn-': [-1, 0], 'no-': [-1, 0], 'no2': [0, 0, -1], 'so2': [0, 0, 0], 'h2o': [0, 0, 0], 'hcn': [0, 0, 0],
  };
  Object.keys(FC).forEach(function (id) {
    eq(id + ' formal charges', L.tally(Kit.structure(id)).atoms.map(function (a) { return a.fc; }), FC[id]);
  });

  // 3. Expanded octets are reported as expanded (not "over")
  var EXP = { so2: 10, pcl5: 10, sf6: 12, xef4: 12, xef2: 10, sf4: 10, clf3: 10, brf5: 12 };
  Object.keys(EXP).forEach(function (id) {
    var c = L.tally(Kit.structure(id)).atoms[0];
    eq(id + ' central atom count', [c.around, c.status], [EXP[id], 'expanded']);
  });
  eq('bf3 boron exception', L.tally(Kit.structure('bf3')).atoms[0].status, 'ok');

  // 4. VSEPR shapes at the central atom
  var SHAPE = {
    ch4: 'tetrahedral', h2o: 'bent', nh3: 'trigonal pyramidal', pcl3: 'trigonal pyramidal', sf2: 'bent',
    hcn: 'linear', co2: 'linear', nh4: 'tetrahedral', co3: 'trigonal planar', h3o: 'trigonal pyramidal',
    o3: 'bent', no3: 'trigonal planar', no2: 'bent', so2: 'bent', pcl5: 'trigonal bipyramidal', sf6: 'octahedral',
    xef4: 'square planar', xef2: 'linear', sf4: 'seesaw', clf3: 'T-shaped', brf5: 'square pyramidal',
    bf3: 'trigonal planar', ccl4: 'tetrahedral', chcl3: 'tetrahedral',
  };
  Object.keys(SHAPE).forEach(function (id) {
    var m = Kit.get(id);
    eq(id + ' shape', L.domains(Kit.structure(id), m.center).shape, SHAPE[id]);
  });

  // 5. Carbon hybridization (Ch C)
  var HYB = { c2h6: ['sp³', 'sp³'], c2h4: ['sp²', 'sp²'], c2h2: ['sp', 'sp'], c3h6: ['sp²', 'sp²', 'sp³'], c3h4: ['sp', 'sp', 'sp³'], ch2nh: ['sp²'] };
  Object.keys(HYB).forEach(function (id) {
    var s = Kit.structure(id);
    var got = [];
    s.atoms.forEach(function (a, i) { if (a.el === 'C') got.push(L.domains(s, i).hybridization); });
    eq(id + ' carbon hybridization', got, HYB[id]);
  });

  // 6. Resonance forms
  var RES = { o3: 2, no3: 3, co3: 3, no2: 2, so2: 1, co2: 1 };
  Object.keys(RES).forEach(function (id) {
    var forms = L.resonanceForms(Kit.structure(id));
    eq(id + ' resonance forms', forms.length, RES[id]);
    check(id + ' resonance forms all count', forms.every(function (f) { var t = L.tally(f); return t.placed === t.available && t.fcSum === (f.charge || 0); }));
  });

  // 7. Matching ignores layout; distinguishes arrangements; skeleton match spots "right track"
  var moved = Kit.structure('co2');
  moved.atoms.forEach(function (a) { a.x *= 3; a.y += 2; });
  check('co2 matches itself after moving atoms', L.sameStructure(moved, Kit.structure('co2')));
  check('co2 differs from co2-alt', !L.sameStructure(Kit.structure('co2'), Kit.structure('co2-alt')));
  check('co2 and co2-alt share a skeleton', L.sameSkeleton(Kit.structure('co2'), Kit.structure('co2-alt')));

  // 8. Building with editing ops (what the draw engine does)
  var b = L.empty();
  var o1 = L.addAtom(b, 'O', -1, 0), c = L.addAtom(b, 'C', 0, 0), o2 = L.addAtom(b, 'O', 1, 0);
  L.cycleBond(b, o1, c); L.cycleBond(b, o1, c);   // tap twice → double
  L.setBond(b, c, o2, 2);
  L.setLonePairs(b, o1, 2); L.setLonePairs(b, o2, 2);
  check('CO2 built by taps matches reference', L.sameStructure(b, Kit.structure('co2')));
  var bt = L.tally(b);
  eq('built CO2 tally text', [bt.availableText, bt.placedText], ['Valence 16 = 16', 'Placed 16 / 16']);
  eq('O teach FC text', bt.atoms[0].fcTeach, 'FC = 6 − 4 − ½(4) = 0');
  eq('CO carbon teach FC text', L.tally(Kit.structure('co')).atoms[0].fcTeach, 'FC = 4 − 2 − ½(6) = −1');
  eq('NH4+ available text', L.tally(Kit.structure('nh4')).availableText, 'Valence 9 − 1 = 8');
  eq('CO3 2- available text', L.tally(Kit.structure('co3')).availableText, 'Valence 22 + 2 = 24');
  L.cycleBond(b, o1, c); L.cycleBond(b, o1, c);   // double → triple → none
  eq('cycle wraps to no bond', L.findBond(b, o1, c), -1);
  var short = Kit.structure('h2o'); short.atoms[0].lp = 1;
  var st = L.tally(short).atoms[0];
  eq('unfinished water: O short, text shows working', [st.status, st.countText], ['short', 'O · bonds 4 + lone 2 = 6 / 8']);
  L.removeAtom(b, 0);
  eq('remove atom reindexes bonds', b.bonds, [{ a: 0, b: 1, order: 2 }]);

  // 8b. Odd electron counts (draw engine mid-build uses `ne`)
  var half = { atoms: [{ el: 'C', x: 0, y: 0, ne: 2 }, { el: 'O', x: 1, y: 0, ne: 5 }], bonds: [{ a: 0, b: 1, order: 1 }], charge: 0 };
  var ht = L.tally(half);
  eq('odd ne counts and FCs', [ht.atoms[0].around, ht.atoms[1].around, ht.atoms[0].fc, ht.atoms[1].fc], [4, 7, 1, 0]);

  // 9. Kit integrity
  Object.keys(Kit.PRACTICE).forEach(function (k) {
    check('practice ' + k + ' ids exist', Kit.PRACTICE[k].every(function (id) { return !!Kit.get(id); }));
  });
  check('crystals have melting points', Kit.CRYSTALS.length === 5 && Kit.CRYSTALS.every(function (c) { return typeof c.mp === 'number'; }));
  eq('teacher starter list size', Kit.STARTER_LIST.length, 11);
  check('salts reference known ions', Kit.SALTS.every(function (s) { return Kit.IONS[s.cation] && Kit.IONS[s.anion]; }));

  var passed = results.filter(function (r) { return r.ok; }).length;
  var summary = { passed: passed, total: results.length, results: results };

  if (isNode) {
    results.filter(function (r) { return !r.ok; }).forEach(function (r) { console.log('FAIL  ' + r.name + '  ' + r.detail); });
    console.log(passed + ' / ' + results.length + ' passed');
    process.exitCode = passed === results.length ? 0 : 1;
  } else {
    global.LewisTests = summary;
  }
})(typeof window !== 'undefined' ? window : this);
