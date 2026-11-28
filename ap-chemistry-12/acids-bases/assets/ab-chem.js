/* AbChem: the numbers behind the Acids and Bases Guides. Every value is from the BC Chemistry 12 Data Booklet
   (docs/reference/chem12-data-booklet.md): Ka from the table on p. 6, atomic masses to one decimal.
   Kw = 1.00 × 10⁻¹⁴ at 25 °C (Hebden IV.7). Pictures use the exact quadratic; worked steps use Hebden's
   assumption ([HA] − x ≈ [HA]) and say so. */
(function (global) {
  'use strict';
  const KW = 1.00e-14;
  // Ka (booklet p. 6). Strong acids have no Ka: they are 100% ionized.
  const KA = {
    HIO3: 1.7e-1, H2C2O4: 5.9e-2, H2SO3: 1.5e-2, HSO4: 1.2e-2, H3PO4: 7.5e-3, HNO2: 4.6e-4, HF: 3.5e-4, HCOOH: 1.8e-4,
    C6H5COOH: 6.5e-5, CH3COOH: 1.8e-5, H2CO3: 4.3e-7, H2S: 9.1e-8, H2PO4: 6.2e-8, NH4: 5.6e-10, HCN: 4.9e-10,
    HCO3: 5.6e-11, HPO4: 2.2e-13
  };
  const STRONG_ACIDS = ['HClO₄', 'HI', 'HBr', 'HCl', 'HNO₃', 'H₂SO₄'];
  const MASS = { H: 1.0, C: 12.0, N: 14.0, O: 16.0, F: 19.0, Na: 23.0, Mg: 24.3, S: 32.1, Cl: 35.5, K: 39.1, Ca: 40.1, Br: 79.9, Sr: 87.6, Ba: 137.3 };

  // exact [H₃O⁺] from a weak acid HA of starting concentration c: x² / (c − x) = Ka
  const weakH = (Ka, c) => (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
  const ionizedFraction = (Ka, c) => weakH(Ka, c) / c;
  const pH = h => -Math.log10(h);
  const fromP = p => Math.pow(10, -p);

  // formula mass from an element count, e.g. { Na: 1, O: 1, H: 1 }
  const molarMass = counts => Object.keys(counts).reduce((s, k) => s + MASS[k] * counts[k], 0);

  // n.nn × 10^e for display: { m: '4.2', e: -3 }
  function sci(v, sig) {
    sig = sig || 2;
    const e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    let m = (v / Math.pow(10, e)).toFixed(sig - 1);
    if (+m >= 10) return sci(v * 1.0000001, sig);
    return { m, e };
  }

  global.AbChem = { KW, KA, STRONG_ACIDS, MASS, weakH, ionizedFraction, pH, fromP, molarMass, sci };
})(window);
