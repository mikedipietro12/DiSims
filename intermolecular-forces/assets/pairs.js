/**
 * IMF pair resolver - hybrid outcomes (Task 2 · A3).
 *
 * 1. OVERRIDES for teaching pairs (Guide demos / Sandbox defaults)
 * 2. RULES for everything else
 *
 * Requires ImfMolecules (load molecules.js first).
 *
 * Outcome shape for the future soft engine:
 *   {
 *     force: 'ldf'|'dipole-induced'|'dipole-dipole'|'ion-dipole'|'hydrogen-bond'|'ion-induced'|'repulsion',
 *     label: string,          // Guide only - Sandbox must not show this
 *     attraction: 'soft'|'medium'|'strong',
 *     pulse: boolean,         // LDF visual
 *     reorient: boolean,      // favour H-bond / dipole alignment
 *     source: 'override'|'rule'
 *   }
 */
(function (global) {
  'use strict';

  function mol(id) {
    return global.ImfMolecules && global.ImfMolecules.get(id);
  }

  function pairKey(a, b) {
    return a < b ? a + '|' + b : b + '|' + a;
  }

  /** Teaching overrides - canonical demos. */
  var OVERRIDES = {
    'ch4|ch4': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'soft',
      pulse: true,
      reorient: false,
    },
    'ne|ne': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'soft',
      pulse: true,
      reorient: false,
    },
    'br2|br2': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'medium',
      pulse: true,
      reorient: false,
    },
    'octane|octane': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'strong',
      pulse: true,
      reorient: false,
    },
    'co2|co2': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'soft',
      pulse: true,
      reorient: false,
    },
    'ch4|octane': {
      force: 'ldf',
      label: 'London dispersion',
      attraction: 'medium',
      pulse: true,
      reorient: false,
    },
    'hcl|ne': {
      force: 'dipole-induced',
      label: 'Dipole-induced dipole',
      attraction: 'soft',
      pulse: true,
      reorient: false,
    },
    'hcl|octane': {
      force: 'dipole-induced',
      label: 'Dipole-induced dipole',
      attraction: 'medium',
      pulse: true,
      reorient: false,
    },
    'ch4|h2o': {
      force: 'dipole-induced',
      label: 'Dipole-induced dipole',
      attraction: 'soft',
      pulse: true,
      reorient: false,
    },
    'hcl|hcl': {
      force: 'dipole-dipole',
      label: 'Dipole-dipole',
      attraction: 'medium',
      pulse: false,
      reorient: true,
    },
    'h2o|na': {
      force: 'ion-dipole',
      label: 'Ion-dipole',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'ch4|na': {
      force: 'ion-induced',
      label: 'Ion-induced dipole',
      attraction: 'medium',
      pulse: true,
      reorient: false,
    },
    'na|ne': {
      force: 'ion-induced',
      label: 'Ion-induced dipole',
      attraction: 'medium',
      pulse: true,
      reorient: false,
    },
    'h2o|h2o': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'nh3|nh3': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'hf|hf': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'ch3oh|ch3oh': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'glucose|glucose': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'ch3oh|h2o': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
    'glucose|h2o': {
      force: 'hydrogen-bond',
      label: 'Hydrogen bonding',
      attraction: 'strong',
      pulse: false,
      reorient: true,
    },
  };

  function attractionFromLdf(tierA, tierB) {
    var order = (global.ImfMolecules && global.ImfMolecules.LDF_ORDER) || {
      weak: 0,
      medium: 1,
      strong: 2,
    };
    var rank = Math.max(order[tierA] || 0, order[tierB] || 0);
    if (rank >= 2) return 'strong';
    if (rank >= 1) return 'medium';
    return 'soft';
  }

  function fromRules(a, b) {
    var A = mol(a);
    var B = mol(b);
    if (!A || !B) {
      return {
        force: 'ldf',
        label: 'London dispersion',
        attraction: 'soft',
        pulse: true,
        reorient: false,
        source: 'rule',
        error: 'unknown-molecule',
      };
    }

    // Ion + polar → ion-dipole
    if ((A.ion && B.polarity === 'polar') || (B.ion && A.polarity === 'polar')) {
      return {
        force: 'ion-dipole',
        label: 'Ion-dipole',
        attraction: 'strong',
        pulse: false,
        reorient: true,
        source: 'rule',
      };
    }

    // Ion + ion (same sign in this roster) - repel; not a featured teaching case
    if (A.ion && B.ion) {
      return {
        force: 'repulsion',
        label: 'Like charges repel',
        attraction: 'soft',
        pulse: false,
        reorient: false,
        source: 'rule',
      };
    }

    // Ion + nonpolar → ion-induced dipole
    if (A.ion || B.ion) {
      return {
        force: 'ion-induced',
        label: 'Ion-induced dipole',
        attraction: attractionFromLdf(A.ldfTier, B.ldfTier) === 'soft' ? 'medium' : 'strong',
        pulse: true,
        reorient: false,
        source: 'rule',
      };
    }

    // H-bond: donor on one, acceptor on the other (or both)
    var canHB =
      (A.hBondDonor && B.hBondAcceptor) || (B.hBondDonor && A.hBondAcceptor);
    if (canHB) {
      return {
        force: 'hydrogen-bond',
        label: 'Hydrogen bonding',
        attraction: 'strong',
        pulse: false,
        reorient: true,
        source: 'rule',
      };
    }

    // Dipole-dipole: both polar, no H-bond path
    if (A.polarity === 'polar' && B.polarity === 'polar') {
      return {
        force: 'dipole-dipole',
        label: 'Dipole-dipole',
        attraction: 'medium',
        pulse: false,
        reorient: true,
        source: 'rule',
      };
    }

    // Dipole-induced: polar + nonpolar
    if (
      (A.polarity === 'polar' && B.polarity === 'nonpolar') ||
      (B.polarity === 'polar' && A.polarity === 'nonpolar')
    ) {
      var attr = attractionFromLdf(A.ldfTier, B.ldfTier);
      if (attr === 'soft' && (A.bulk || B.bulk)) attr = 'medium';
      return {
        force: 'dipole-induced',
        label: 'Dipole-induced dipole',
        attraction: attr,
        pulse: true,
        reorient: false,
        source: 'rule',
      };
    }

    // Default: LDF (nonpolar-nonpolar, etc.)
    return {
      force: 'ldf',
      label: 'London dispersion',
      attraction: attractionFromLdf(A.ldfTier, B.ldfTier),
      pulse: true,
      reorient: false,
      source: 'rule',
    };
  }

  /**
   * @param {string} idA
   * @param {string} idB
   * @returns {object}
   */
  function resolve(idA, idB) {
    var key = pairKey(idA, idB);
    var o = OVERRIDES[key];
    if (o) {
      return {
        force: o.force,
        label: o.label,
        attraction: o.attraction,
        pulse: o.pulse,
        reorient: o.reorient,
        source: 'override',
        pair: key,
      };
    }
    var r = fromRules(idA, idB);
    r.pair = key;
    return r;
  }

  /** Default Sandbox starter pairs (ids). */
  var SANDBOX_DEFAULTS = [
    ['ch4', 'ch4'],
    ['br2', 'br2'],
    ['hcl', 'hcl'],
    ['h2o', 'h2o'],
    ['ch3oh', 'ch3oh'],
    ['hcl', 'ne'],
    ['na', 'h2o'],
    ['h2o', 'ch4'],
    ['hcl', 'octane'],
    ['ch4', 'octane'],
    ['octane', 'octane'],
    ['glucose', 'glucose'],
    ['h2o', 'glucose'],
    ['ch3oh', 'h2o'],
  ];

  global.ImfPairs = {
    OVERRIDES: OVERRIDES,
    SANDBOX_DEFAULTS: SANDBOX_DEFAULTS,
    pairKey: pairKey,
    resolve: resolve,
  };
})(window);
