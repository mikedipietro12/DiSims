/* Path A datasets. Every table has a clean-isolation pair per reactant.
   Orders verified numerically. Never 0-order reactants. No logs needed. */
(function (global) {
  'use strict';

  function fmtRate(n) {
    if (n === 0) return '0';
    var exp = n.toExponential(2).replace('e', '×10^').replace('+', '');
    return exp.replace('×10^', '×10<sup>') + '</sup>';
  }

  function rateOf(ds, conc) {
    var k = ds.k;
    var p = k;
    ds.reactants.forEach(function (r) {
      p *= Math.pow(conc[r.key], r.order);
    });
    return p;
  }

  function verify(ds) {
    ds.trials.forEach(function (t) {
      var expected = rateOf(ds, t.conc);
      var err = Math.abs(expected - t.rate) / t.rate;
      if (err > 1e-6) {
        console.warn('Dataset ' + ds.id + ' trial ' + t.exp + ' rate mismatch', expected, t.rate);
      }
    });
    ds.reactants.forEach(function (r) {
      var pair = null;
      for (var i = 0; i < ds.trials.length && !pair; i++) {
        for (var j = i + 1; j < ds.trials.length; j++) {
          var a = ds.trials[i];
          var b = ds.trials[j];
          var onlyThis = a.conc[r.key] !== b.conc[r.key];
          var othersHeld = ds.reactants.every(function (o) {
            return o.key === r.key || a.conc[o.key] === b.conc[o.key];
          });
          if (onlyThis && othersHeld) {
            pair = [a.exp, b.exp];
            break;
          }
        }
      }
      if (!pair) console.warn('Dataset ' + ds.id + ' missing isolation for ' + r.key);
    });
  }

  var DATASETS = {
    hook: {
      id: 'hook',
      title: 'A second-order example',
      reaction: '2 A → products',
      rateUnit: 'M·s⁻¹',
      reactants: [{ key: 'A', label: '[A]', order: 2 }],
      k: 0.40,
      trials: [
        { exp: 1, conc: { A: 0.10 }, rate: 0.0040 },
        { exp: 2, conc: { A: 0.20 }, rate: 0.0160 }
      ]
    },
    warmup2: {
      id: 'warmup2',
      title: 'Single reactant — order 2',
      reaction: 'A → products',
      rateUnit: 'M·s⁻¹',
      reactants: [{ key: 'A', label: '[A]', order: 2 }],
      k: 0.20,
      trials: [
        { exp: 1, conc: { A: 0.10 }, rate: 0.0020 },
        { exp: 2, conc: { A: 0.20 }, rate: 0.0080 },
        { exp: 3, conc: { A: 0.40 }, rate: 0.0320 }
      ]
    },
    warmup1: {
      id: 'warmup1',
      title: 'Single reactant — order 1',
      reaction: 'B → products',
      rateUnit: 'M·s⁻¹',
      reactants: [{ key: 'B', label: '[B]', order: 1 }],
      k: 0.015,
      trials: [
        { exp: 1, conc: { B: 0.10 }, rate: 0.00150 },
        { exp: 2, conc: { B: 0.30 }, rate: 0.00450 }
      ]
    },
    /* Carried Path A example — Dataset 3 */
    clo2: {
      id: 'clo2',
      title: 'F₂ + 2 ClO₂ → 2 FClO₂',
      reaction: 'F₂ + 2ClO₂ → 2FClO₂',
      rateUnit: 'M·s⁻¹',
      real: true,
      reactants: [
        { key: 'F2', label: '[F₂]', order: 1 },
        { key: 'ClO2', label: '[ClO₂]', order: 1 }
      ],
      k: 1.2,
      trials: [
        { exp: 1, conc: { F2: 0.10, ClO2: 0.010 }, rate: 1.2e-3 },
        { exp: 2, conc: { F2: 0.10, ClO2: 0.040 }, rate: 4.8e-3 },
        { exp: 3, conc: { F2: 0.20, ClO2: 0.010 }, rate: 2.4e-3 }
      ],
      unseen: { conc: { F2: 0.20, ClO2: 0.040 }, rate: 9.6e-3 }
    },
    /* Dataset 1 — Path A practice */
    noh2: {
      id: 'noh2',
      title: '2 NO + 2 H₂ → N₂ + 2 H₂O',
      reaction: 'NO + H₂ → N₂ (simplified stoich. for the table)',
      rateUnit: 'mol·L⁻¹·min⁻¹',
      real: true,
      reactants: [
        { key: 'NO', label: '[NO]', order: 2 },
        { key: 'H2', label: '[H₂]', order: 1 }
      ],
      k: 5000,
      trials: [
        { exp: 1, conc: { NO: 0.0060, H2: 0.0010 }, rate: 1.8e-4 },
        { exp: 2, conc: { NO: 0.0060, H2: 0.0020 }, rate: 3.6e-4 },
        { exp: 3, conc: { NO: 0.0010, H2: 0.0060 }, rate: 0.30e-4 },
        { exp: 4, conc: { NO: 0.0020, H2: 0.0060 }, rate: 1.2e-4 }
      ]
    },
    ab1: {
      id: 'ab1',
      title: 'A + B → products',
      reaction: 'A + B → products',
      rateUnit: 'M·s⁻¹',
      reactants: [
        { key: 'A', label: '[A]', order: 1 },
        { key: 'B', label: '[B]', order: 1 }
      ],
      k: 0.20,
      trials: [
        { exp: 1, conc: { A: 0.10, B: 0.10 }, rate: 2.0e-3 },
        { exp: 2, conc: { A: 0.20, B: 0.10 }, rate: 4.0e-3 },
        { exp: 3, conc: { A: 0.10, B: 0.30 }, rate: 6.0e-3 }
      ]
    },
    ab2: {
      id: 'ab2',
      title: 'A + B → products',
      reaction: 'A + B → products',
      rateUnit: 'M·s⁻¹',
      reactants: [
        { key: 'A', label: '[A]', order: 2 },
        { key: 'B', label: '[B]', order: 1 }
      ],
      k: 2.0,
      trials: [
        { exp: 1, conc: { A: 0.10, B: 0.20 }, rate: 4.0e-3 },
        { exp: 2, conc: { A: 0.20, B: 0.20 }, rate: 1.6e-2 },
        { exp: 3, conc: { A: 0.10, B: 0.10 }, rate: 2.0e-3 }
      ]
    },
    ab3: {
      id: 'ab3',
      title: 'A + B → products',
      reaction: 'A + B → products',
      rateUnit: 'M·s⁻¹',
      reactants: [
        { key: 'A', label: '[A]', order: 1 },
        { key: 'B', label: '[B]', order: 2 }
      ],
      k: 0.40,
      trials: [
        { exp: 1, conc: { A: 0.20, B: 0.10 }, rate: 8.0e-4 },
        { exp: 2, conc: { A: 0.40, B: 0.10 }, rate: 1.6e-3 },
        { exp: 3, conc: { A: 0.20, B: 0.20 }, rate: 3.2e-3 }
      ]
    },
    /* Completion gate — unseen, abstract, verified */
    gate: {
      id: 'gate',
      title: 'A + B → products',
      reaction: 'A + B → products',
      rateUnit: 'M·s⁻¹',
      gate: true,
      reactants: [
        { key: 'A', label: '[A]', order: 2 },
        { key: 'B', label: '[B]', order: 1 }
      ],
      k: 0.20,
      trials: [
        { exp: 1, conc: { A: 0.10, B: 0.10 }, rate: 2.0e-4 },
        { exp: 2, conc: { A: 0.20, B: 0.10 }, rate: 8.0e-4 },
        { exp: 3, conc: { A: 0.10, B: 0.30 }, rate: 6.0e-4 }
      ]
    }
  };

  Object.keys(DATASETS).forEach(function (id) { verify(DATASETS[id]); });

  function unitsForTotalOrder(n) {
    if (n === 0) return 'M·s⁻¹';
    if (n === 1) return 's⁻¹';
    if (n === 2) return 'M⁻¹s⁻¹';
    if (n === 3) return 'M⁻²s⁻¹';
    return 'M<sup>' + (1 - n) + '</sup>s⁻¹';
  }

  function totalOrder(ds) {
    return ds.reactants.reduce(function (s, r) { return s + r.order; }, 0);
  }

  function isolationDiff(ds, i, j) {
    var a = ds.trials[i];
    var b = ds.trials[j];
    var changed = [];
    var held = [];
    ds.reactants.forEach(function (r) {
      if (a.conc[r.key] === b.conc[r.key]) held.push(r);
      else changed.push(r);
    });
    return { a: a, b: b, changed: changed, held: held, clean: changed.length === 1 };
  }

  global.RateData = {
    DATASETS: DATASETS,
    PRACTICE: ['noh2', 'ab2', 'ab3'],
    fmtRate: fmtRate,
    rateOf: rateOf,
    unitsForTotalOrder: unitsForTotalOrder,
    totalOrder: totalOrder,
    isolationDiff: isolationDiff
  };
})(typeof window !== 'undefined' ? window : this);
