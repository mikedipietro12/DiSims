/**
 * Chemical Bonding - Lewis model + tally (Task 3). Logic only, no DOM.
 *
 * A structure is { atoms: [{el, x, y, lp}], bonds: [{a, b, order}], charge }.
 * The draw engine edits structures through these functions; the tally reports the
 * electron arithmetic as working, never as a verdict (principle 1: the count teaches).
 *
 * Browser global: window.LewisModel (needs window.BondingKit). Node: require('./lewis-model.js').
 */
(function (global) {
  'use strict';

  var Kit = typeof module !== 'undefined' && module.exports ? require('./bonding-kit.js') : global.BondingKit;
  var MINUS = '−';

  // ---------------------------------------------------------------------------
  // Editing
  // ---------------------------------------------------------------------------
  function empty(charge) { return { atoms: [], bonds: [], charge: charge || 0 }; }

  function addAtom(s, el, x, y) {
    if (!Kit.ELEMENTS[el]) throw new Error('Unknown element ' + el);
    s.atoms.push({ el: el, x: x, y: y, lp: 0 });
    return s.atoms.length - 1;
  }

  function removeAtom(s, i) {
    s.bonds = s.bonds.filter(function (b) { return b.a !== i && b.b !== i; }).map(function (b) {
      return { a: b.a > i ? b.a - 1 : b.a, b: b.b > i ? b.b - 1 : b.b, order: b.order };
    });
    s.atoms.splice(i, 1);
  }

  function findBond(s, i, j) {
    for (var k = 0; k < s.bonds.length; k++) {
      var b = s.bonds[k];
      if ((b.a === i && b.b === j) || (b.a === j && b.b === i)) return k;
    }
    return -1;
  }

  /** Set the bond order between two atoms (0 removes the bond). */
  function setBond(s, i, j, order) {
    if (i === j) return;
    var k = findBond(s, i, j);
    if (order <= 0) { if (k !== -1) s.bonds.splice(k, 1); return; }
    if (k === -1) s.bonds.push({ a: i, b: j, order: order });
    else s.bonds[k].order = order;
  }

  /** Tap a bond: single → double → triple → none. Returns the new order. */
  function cycleBond(s, i, j) {
    var k = findBond(s, i, j);
    var next = k === -1 ? 1 : (s.bonds[k].order + 1) % 4;
    setBond(s, i, j, next);
    return next;
  }

  function setLonePairs(s, i, n) { s.atoms[i].lp = Math.max(0, Math.min(4, n)); }

  // ---------------------------------------------------------------------------
  // Counting
  // ---------------------------------------------------------------------------
  function bondOrderSum(s, i) {
    var n = 0;
    s.bonds.forEach(function (b) { if (b.a === i || b.b === i) n += b.order; });
    return n;
  }
  function neighbours(s, i) {
    var out = [];
    s.bonds.forEach(function (b) {
      if (b.a === i) out.push({ j: b.b, order: b.order });
      else if (b.b === i) out.push({ j: b.a, order: b.order });
    });
    return out;
  }

  /** Nonbonding electrons on an atom: `ne` (draw engine, may be odd) or 2 × `lp` (kit). */
  function nonbondingOf(a) { return a.ne != null ? a.ne : 2 * (a.lp || 0); }

  function fmtSigned(n) { return n === 0 ? '0' : (n > 0 ? '+' + n : MINUS + Math.abs(n)); }
  function fmtNum(n) { return n < 0 ? MINUS + Math.abs(n) : String(n); }

  /** Per-atom count + formal charge. */
  function atomTally(s, i) {
    var a = s.atoms[i];
    var E = Kit.ELEMENTS[a.el];
    var bonding = 2 * bondOrderSum(s, i);
    var nonbonding = nonbondingOf(a);
    var around = bonding + nonbonding;
    var target = E.octet;
    var status;
    if (around === target || (a.el === 'B' && around === 8)) status = 'ok';
    else if (around < target) status = 'short';
    else status = E.canExpand ? 'expanded' : 'over';
    var fc = E.valence - nonbonding - bonding / 2;
    return {
      index: i, el: a.el, valence: E.valence,
      bonding: bonding, nonbonding: nonbonding, around: around, target: target, status: status,
      fc: fc,
      // Working, never a verdict
      countText: a.el + ' · bonds ' + bonding + ' + lone ' + nonbonding + ' = ' + around + ' / ' + target,
      fcTeach: 'FC = ' + E.valence + ' ' + MINUS + ' ' + nonbonding + ' ' + MINUS + ' ½(' + bonding + ') = ' + fmtSigned(fc),
      fcCompact: 'FC ' + fmtSigned(fc),
      speech: a.el + ': ' + bonding + ' electrons in bonds and ' + nonbonding + ' in lone pairs, ' + around +
        ' of ' + target + '. Formal charge ' + (fc === 0 ? 'zero' : (fc > 0 ? 'plus ' : 'minus ') + Math.abs(fc)) + '.',
    };
  }

  /** Whole-structure tally. */
  function tally(s) {
    var atoms = s.atoms.map(function (_, i) { return atomTally(s, i); });
    var valenceSum = s.atoms.reduce(function (n, a) { return n + Kit.ELEMENTS[a.el].valence; }, 0);
    var available = valenceSum - (s.charge || 0);
    var placed = atoms.reduce(function (n, t) { return n + t.nonbonding; }, 0) +
      s.bonds.reduce(function (n, b) { return n + 2 * b.order; }, 0);
    var fcSum = atoms.reduce(function (n, t) { return n + t.fc; }, 0);
    var chargeText = s.charge ? ' ' + (s.charge > 0 ? MINUS : '+') + ' ' + Math.abs(s.charge) : '';
    return {
      atoms: atoms,
      valenceSum: valenceSum,
      available: available,
      placed: placed,
      remaining: available - placed,
      fcSum: fcSum,
      fcMatchesCharge: fcSum === (s.charge || 0),
      allCounted: atoms.every(function (t) { return t.status === 'ok' || t.status === 'expanded'; }),
      availableText: 'Valence ' + valenceSum + chargeText + ' = ' + available,
      placedText: 'Placed ' + placed + ' / ' + available,
    };
  }

  // ---------------------------------------------------------------------------
  // Shape (VSEPR) and hybridization
  // ---------------------------------------------------------------------------
  var SHAPES = {
    '2,0': { shape: 'linear', electron: 'linear', angle: '180°' },
    '3,0': { shape: 'trigonal planar', electron: 'trigonal planar', angle: '120°' },
    '3,1': { shape: 'bent', electron: 'trigonal planar', angle: 'just under 120°' },
    '4,0': { shape: 'tetrahedral', electron: 'tetrahedral', angle: '109.5°' },
    '4,1': { shape: 'trigonal pyramidal', electron: 'tetrahedral', angle: 'about 107°' },
    '4,2': { shape: 'bent', electron: 'tetrahedral', angle: 'about 104.5°' },
    '5,0': { shape: 'trigonal bipyramidal', electron: 'trigonal bipyramidal', angle: '90° and 120°' },
    '5,1': { shape: 'seesaw', electron: 'trigonal bipyramidal', angle: 'under 90° and 120°' },
    '5,2': { shape: 'T-shaped', electron: 'trigonal bipyramidal', angle: 'just under 90°' },
    '5,3': { shape: 'linear', electron: 'trigonal bipyramidal', angle: '180°' },
    '6,0': { shape: 'octahedral', electron: 'octahedral', angle: '90°' },
    '6,1': { shape: 'square pyramidal', electron: 'octahedral', angle: 'just under 90°' },
    '6,2': { shape: 'square planar', electron: 'octahedral', angle: '90°' },
  };
  var HYBRID = { 2: 'sp', 3: 'sp²', 4: 'sp³' }; // Ch C scope: carbon (and passing mentions) only

  /** Electron domains around atom i: each bonded neighbour counts once, whatever the bond order. */
  function domains(s, i) {
    var bonded = neighbours(s, i).length;
    var lone = Math.ceil(nonbondingOf(s.atoms[i]) / 2);
    var steric = bonded + lone;
    var info = SHAPES[steric + ',' + lone] || null;
    return {
      bonded: bonded, lone: lone, steric: steric,
      shape: info ? info.shape : null,
      electronGeometry: info ? info.electron : null,
      angle: info ? info.angle : null,
      hybridization: HYBRID[steric] || null,
    };
  }

  // ---------------------------------------------------------------------------
  // Matching (used only to choose which reference to reveal - never to grade)
  // ---------------------------------------------------------------------------
  function signature(s) {
    return s.atoms.map(function (a, i) {
      var n = neighbours(s, i).map(function (x) { return s.atoms[x.j].el + x.order; }).sort().join(',');
      return a.el + ':' + nonbondingOf(a) + '[' + n + ']';
    }).sort().join('|') + '#' + (s.charge || 0);
  }
  /** Same connectivity, bond orders and lone pairs as the reference (layout ignored). */
  function sameStructure(s, ref) { return signature(s) === signature(ref); }
  /** Same atoms and connections (bond orders and lone pairs ignored): "on the right track". */
  function sameSkeleton(s, ref) {
    function skel(t) {
      return t.atoms.map(function (a, i) {
        return a.el + '[' + neighbours(t, i).map(function (x) { return t.atoms[x.j].el; }).sort().join(',') + ']';
      }).sort().join('|');
    }
    return skel(s) === skel(ref);
  }

  // ---------------------------------------------------------------------------
  // Resonance
  // ---------------------------------------------------------------------------
  /**
   * Equivalent resonance forms: move a double bond from one terminal neighbour to another of the
   * same element (that neighbour gives up one lone pair; the old one gains one). Original first.
   */
  function resonanceForms(s) {
    var forms = [s];
    var seen = {};
    function key(t) { return t.bonds.map(function (b) { return b.a + '-' + b.b + ':' + b.order; }).join(',') + '/' + t.atoms.map(function (a) { return a.lp; }).join(''); }
    seen[key(s)] = true;
    s.atoms.forEach(function (_, c) {
      var nb = neighbours(s, c);
      nb.forEach(function (x) {
        if (x.order !== 2) return;
        nb.forEach(function (y) {
          if (y.order !== 1 || y.j === x.j) return;
          if (s.atoms[y.j].el !== s.atoms[x.j].el || s.atoms[y.j].lp < 1) return;
          var t = JSON.parse(JSON.stringify(s));
          setBond(t, c, x.j, 1); t.atoms[x.j].lp += 1;
          setBond(t, c, y.j, 2); t.atoms[y.j].lp -= 1;
          var k = key(t);
          if (!seen[k]) { seen[k] = true; forms.push(t); }
        });
      });
    });
    return forms;
  }

  var LewisModel = {
    empty: empty, addAtom: addAtom, removeAtom: removeAtom,
    setBond: setBond, cycleBond: cycleBond, findBond: findBond, setLonePairs: setLonePairs,
    neighbours: neighbours, atomTally: atomTally, tally: tally,
    domains: domains, SHAPES: SHAPES,
    sameStructure: sameStructure, sameSkeleton: sameSkeleton, signature: signature,
    resonanceForms: resonanceForms,
    fmtSigned: fmtSigned, fmtNum: fmtNum, nonbondingOf: nonbondingOf,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LewisModel;
  else global.LewisModel = LewisModel;
})(typeof window !== 'undefined' ? window : this);
