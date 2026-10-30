/**
 * IMF shared molecule kit - roster + render contract.
 *
 * Decisions (Task 2):
 *   B3 - LDF / bulk as discrete tiers now; numeric polarizabilityScore reserved for later
 *   C3 - layout.simplified for Guide/Sandbox; layout.heatRich for Heat sample view
 *
 * Rooms must resolve substances through ImfMolecules - no one-off molecule defs.
 */
(function (global) {
  'use strict';

  /** @typedef {'weak'|'medium'|'strong'} LdfTier */
  /** @typedef {'nonpolar'|'polar'|'ion'} PolarityClass */

  /**
   * Render contract (all drawers should honour this):
   * - Atoms: fake-depth space-filling spheres (soft radial shade), not flat discs.
   * - Cloud: soft squishy envelope around the molecule bounding box.
   * - Permanent polarity: fixed δ+/δ− colours + text signs in Guide; colour alone never carries meaning.
   * - LDF: pulse cloud polarity (temporary); no fixed δ labels on nonpolar species.
   * - Ions: full charge label (e.g. Na⁺), stronger colour cue than partial charges.
   * - Guide/Sandbox use layout.simplified; Heat may use layout.heatRich for bulk species.
   */
  var RENDER = {
    atomShade: 'fake-depth',
    cloud: 'squishy',
    polarity: { positive: 'delta-pos', negative: 'delta-neg', ion: 'ion' },
    ldfCue: 'pulse',
    layouts: { guideSandbox: 'simplified', heat: 'heatRich' },
  };

  /** LDF tier ordering for comparisons (Heat, pulse amplitude). */
  var LDF_ORDER = { weak: 0, medium: 1, strong: 2 };

  /**
   * Roster - pedagogical tags, not a full force field.
   * polarizabilityScore: null until B3 “scores later” pass.
   */
  var BY_ID = {
    ne: {
      id: 'ne',
      formula: 'Ne',
      name: 'Neon',
      polarity: 'nonpolar',
      vsepr: 'atom',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 0,
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: { kind: 'mono', atoms: [{ el: 'Ne', r: 1 }] },
        heatRich: { kind: 'mono', atoms: [{ el: 'Ne', r: 1 }] },
      },
      notes: 'Weak LDF baseline - pulse only.',
    },
    ch4: {
      id: 'ch4',
      formula: 'CH₄',
      name: 'Methane',
      polarity: 'nonpolar',
      vsepr: 'tetrahedral',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 0,
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'center-spokes',
          center: { el: 'C', r: 1 },
          spokes: [
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
          ],
        },
        heatRich: {
          kind: 'center-spokes',
          center: { el: 'C', r: 1 },
          spokes: [
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
            { el: 'H', r: 0.55 },
          ],
        },
      },
      notes: 'Nonpolar despite polar C–H bonds - shape cancel.',
    },
    br2: {
      id: 'br2',
      formula: 'Br₂',
      name: 'Bromine',
      polarity: 'nonpolar',
      vsepr: 'linear',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 0,
      ldfTier: 'medium',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'diatomic',
          atoms: [
            { el: 'Br', r: 1.15 },
            { el: 'Br', r: 1.15 },
          ],
        },
        heatRich: {
          kind: 'diatomic',
          atoms: [
            { el: 'Br', r: 1.15 },
            { el: 'Br', r: 1.15 },
          ],
        },
      },
      notes: 'Larger nonpolar → stronger LDF than CH₄ / Ne.',
    },
    hcl: {
      id: 'hcl',
      formula: 'HCl',
      name: 'Hydrogen chloride',
      polarity: 'polar',
      vsepr: 'linear',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 1,
      partialCharges: [
        { site: 'H', sign: '+' },
        { site: 'Cl', sign: '-' },
      ],
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'diatomic',
          atoms: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'Cl', r: 1.1, delta: '-' },
          ],
        },
        heatRich: {
          kind: 'diatomic',
          atoms: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'Cl', r: 1.1, delta: '-' },
          ],
        },
      },
      notes: 'Permanent dipole; no classic H-bond with itself.',
    },
    co2: {
      id: 'co2',
      formula: 'CO₂',
      name: 'Carbon dioxide',
      polarity: 'nonpolar',
      vsepr: 'linear',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 0,
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'linear-tri',
          atoms: [
            { el: 'O', r: 0.9 },
            { el: 'C', r: 1 },
            { el: 'O', r: 0.9 },
          ],
        },
        heatRich: {
          kind: 'linear-tri',
          atoms: [
            { el: 'O', r: 0.9 },
            { el: 'C', r: 1 },
            { el: 'O', r: 0.9 },
          ],
        },
      },
      notes: 'Polar bonds cancel - nonpolar molecule.',
    },
    h2o: {
      id: 'h2o',
      formula: 'H₂O',
      name: 'Water',
      polarity: 'polar',
      vsepr: 'bent',
      hBondDonor: true,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1.2,
      partialCharges: [
        { site: 'H', sign: '+' },
        { site: 'H', sign: '+' },
        { site: 'O', sign: '-' },
      ],
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'bent',
          center: { el: 'O', r: 1, delta: '-' },
          spokes: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
          ],
        },
        heatRich: {
          kind: 'bent',
          center: { el: 'O', r: 1, delta: '-' },
          spokes: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
          ],
        },
      },
      notes: 'H-bond poster child; Heat property star.',
    },
    nh3: {
      id: 'nh3',
      formula: 'NH₃',
      name: 'Ammonia',
      polarity: 'polar',
      vsepr: 'trigonal pyramidal',
      hBondDonor: true,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1,
      partialCharges: [
        { site: 'H', sign: '+' },
        { site: 'N', sign: '-' },
      ],
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'pyramid',
          center: { el: 'N', r: 1, delta: '-' },
          spokes: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
          ],
        },
        heatRich: {
          kind: 'pyramid',
          center: { el: 'N', r: 1, delta: '-' },
          spokes: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.55, delta: '+' },
          ],
        },
      },
      notes: 'H-bonding; compare to H₂O / CH₄.',
    },
    hf: {
      id: 'hf',
      formula: 'HF',
      name: 'Hydrogen fluoride',
      polarity: 'polar',
      vsepr: 'linear',
      hBondDonor: true,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1.3,
      partialCharges: [
        { site: 'H', sign: '+' },
        { site: 'F', sign: '-' },
      ],
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'diatomic',
          atoms: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'F', r: 0.95, delta: '-' },
          ],
        },
        heatRich: {
          kind: 'diatomic',
          atoms: [
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'F', r: 0.95, delta: '-' },
          ],
        },
      },
      notes: 'Clean H-bond diatomic for Guide.',
    },
    ch3oh: {
      id: 'ch3oh',
      formula: 'CH₃OH',
      name: 'Methanol',
      polarity: 'polar',
      vsepr: 'tetrahedral-at-C / bent-at-O',
      hBondDonor: true,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1.1,
      partialCharges: [
        { site: 'H(O)', sign: '+' },
        { site: 'O', sign: '-' },
      ],
      ldfTier: 'medium',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'methanol',
          atoms: [
            { el: 'C', r: 1 },
            { el: 'O', r: 0.95, delta: '-' },
            { el: 'H', r: 0.55, delta: '+' },
          ],
        },
        heatRich: {
          kind: 'methanol',
          atoms: [
            { el: 'C', r: 1 },
            { el: 'O', r: 0.95, delta: '-' },
            { el: 'H', r: 0.55, delta: '+' },
            { el: 'H', r: 0.5 },
            { el: 'H', r: 0.5 },
            { el: 'H', r: 0.5 },
          ],
        },
      },
      notes: 'Organic H-bonder - another H-bonding example.',
    },
    acetone: {
      id: 'acetone',
      formula: '(CH₃)₂CO',
      name: 'Acetone',
      polarity: 'polar',
      vsepr: 'trigonal-planar-at-C',
      hBondDonor: false,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1.3,
      partialCharges: [
        { site: 'C(=O)', sign: '+' },
        { site: 'O', sign: '-' },
      ],
      ldfTier: 'medium',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: {
          kind: 'acetone',
          atoms: [
            { el: 'O', r: 0.95, delta: '-' },
            { el: 'C', r: 1, delta: '+' },
            { el: 'C', r: 1 },
            { el: 'C', r: 1 },
          ],
        },
        heatRich: {
          kind: 'acetone',
          atoms: [
            { el: 'O', r: 0.95, delta: '-' },
            { el: 'C', r: 1, delta: '+' },
            { el: 'C', r: 1 },
            { el: 'C', r: 1 },
          ],
        },
      },
      notes: 'Polar C=O but no O–H: the classic dipole-dipole example (no H-bonding between acetones).',
    },
    na: {
      id: 'na',
      formula: 'Na⁺',
      name: 'Sodium ion',
      polarity: 'ion',
      vsepr: 'ion',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: true,
      charge: 1,
      dipole: 0,
      ldfTier: 'weak',
      polarizabilityScore: null,
      bulk: false,
      layout: {
        simplified: { kind: 'ion', atoms: [{ el: 'Na', r: 1.05, charge: '+' }] },
        heatRich: { kind: 'ion', atoms: [{ el: 'Na', r: 1.05, charge: '+' }] },
      },
      notes: 'Use with polar partner for ion–dipole.',
    },
    octane: {
      id: 'octane',
      formula: 'C₈H₁₈',
      name: 'Octane',
      polarity: 'nonpolar',
      vsepr: 'chain',
      hBondDonor: false,
      hBondAcceptor: false,
      ion: false,
      charge: 0,
      dipole: 0,
      ldfTier: 'strong',
      polarizabilityScore: null,
      bulk: true,
      layout: {
        simplified: {
          kind: 'chain',
          segments: 5,
          atom: { el: 'C', r: 0.85 },
        },
        heatRich: {
          kind: 'chain',
          segments: 8,
          atom: { el: 'C', r: 0.85 },
          showHydrogens: true,
        },
      },
      notes: 'Bulky nonpolar - LDF + dipole–induced with polar partners.',
    },
    glucose: {
      id: 'glucose',
      formula: 'C₆H₁₂O₆',
      name: 'Glucose',
      polarity: 'polar',
      vsepr: 'ring',
      hBondDonor: true,
      hBondAcceptor: true,
      ion: false,
      charge: 0,
      dipole: 1,
      ldfTier: 'strong',
      polarizabilityScore: null,
      bulk: true,
      layout: {
        simplified: {
          kind: 'sugar-ring',
          ringSize: 6,
          ohMarks: 3,
        },
        heatRich: {
          kind: 'sugar-ring',
          ringSize: 6,
          ohMarks: 5,
          showHydrogens: true,
        },
      },
      notes: 'Bulky + many OH - H-bonding contrast with octane.',
    },
  };

  var LIST = Object.keys(BY_ID).map(function (k) {
    return BY_ID[k];
  });

  function get(id) {
    return BY_ID[id] || null;
  }

  function layoutFor(id, mode) {
    var m = get(id);
    if (!m) return null;
    var key = mode === 'heatRich' || mode === 'heat' ? 'heatRich' : 'simplified';
    return m.layout[key];
  }

  function ldfRank(id) {
    var m = get(id);
    if (!m) return -1;
    return LDF_ORDER[m.ldfTier];
  }

  function compareLdf(aId, bId) {
    return ldfRank(aId) - ldfRank(bId);
  }

  global.ImfMolecules = {
    RENDER: RENDER,
    LDF_ORDER: LDF_ORDER,
    BY_ID: BY_ID,
    LIST: LIST,
    get: get,
    layoutFor: layoutFor,
    ldfRank: ldfRank,
    compareLdf: compareLdf,
  };
})(window);
