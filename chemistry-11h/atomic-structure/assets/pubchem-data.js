/* PubChem periodic-table properties — offline embed.
 * Sources (cite in-app wherever shown):
 *   Atomic radius:        https://pubchem.ncbi.nlm.nih.gov/ptable/atomic-radius/
 *   Electron affinity:    https://pubchem.ncbi.nlm.nih.gov/ptable/electron-affinity/
 *   Electronegativity:    https://pubchem.ncbi.nlm.nih.gov/ptable/electronegativity/
 * Pulled via PubChem REST /rest/pug/periodictable/JSON (same values as the ptable pages).
 *
 * Notes:
 *   - radiusPm is PubChem atomic radius (pm) — NOT Moog CA6 covalent radii.
 *   - en is PubChem/Pauling scale — NOT Moog CA22 Allen/configuration-energy EN.
 *   - eaEv is eV; eaMjMol = eaEv * 96.485/1000. null = no stable anion (never 0).
 * Use Moog §8 values when the workbook supplies them; use this table to fill gaps
 * or when a module needs a complete H–Ar (or broader) set Moog does not provide.
 */
(function (root) {
  'use strict';
  const PUBCHEM = {
    H: { z: 1, radiusPm: 120, en: 2.2, eaEv: 0.754, eaMjMol: 0.073 },
    He: { z: 2, radiusPm: 140, en: null, eaEv: null, eaMjMol: null },
    Li: { z: 3, radiusPm: 182, en: 0.98, eaEv: 0.618, eaMjMol: 0.060 },
    Be: { z: 4, radiusPm: 153, en: 1.57, eaEv: null, eaMjMol: null },
    B: { z: 5, radiusPm: 192, en: 2.04, eaEv: 0.277, eaMjMol: 0.027 },
    C: { z: 6, radiusPm: 170, en: 2.55, eaEv: 1.263, eaMjMol: 0.122 },
    N: { z: 7, radiusPm: 155, en: 3.04, eaEv: null, eaMjMol: null },
    O: { z: 8, radiusPm: 152, en: 3.44, eaEv: 1.461, eaMjMol: 0.141 },
    F: { z: 9, radiusPm: 135, en: 3.98, eaEv: 3.339, eaMjMol: 0.322 },
    Ne: { z: 10, radiusPm: 154, en: null, eaEv: null, eaMjMol: null },
    Na: { z: 11, radiusPm: 227, en: 0.93, eaEv: 0.548, eaMjMol: 0.053 },
    Mg: { z: 12, radiusPm: 173, en: 1.31, eaEv: null, eaMjMol: null },
    Al: { z: 13, radiusPm: 184, en: 1.61, eaEv: 0.441, eaMjMol: 0.043 },
    Si: { z: 14, radiusPm: 210, en: 1.9, eaEv: 1.385, eaMjMol: 0.134 },
    P: { z: 15, radiusPm: 180, en: 2.19, eaEv: 0.746, eaMjMol: 0.072 },
    S: { z: 16, radiusPm: 180, en: 2.58, eaEv: 2.077, eaMjMol: 0.200 },
    Cl: { z: 17, radiusPm: 175, en: 3.16, eaEv: 3.617, eaMjMol: 0.349 },
    Ar: { z: 18, radiusPm: 188, en: null, eaEv: null, eaMjMol: null },
    K: { z: 19, radiusPm: 275, en: 0.82, eaEv: 0.501, eaMjMol: 0.048 },
    Ca: { z: 20, radiusPm: 231, en: 1, eaEv: null, eaMjMol: null },
    Sc: { z: 21, radiusPm: 211, en: 1.36, eaEv: 0.188, eaMjMol: 0.018 },
    Ti: { z: 22, radiusPm: 187, en: 1.54, eaEv: 0.079, eaMjMol: 0.008 },
    V: { z: 23, radiusPm: 179, en: 1.63, eaEv: 0.525, eaMjMol: 0.051 },
    Cr: { z: 24, radiusPm: 189, en: 1.66, eaEv: 0.666, eaMjMol: 0.064 },
    Mn: { z: 25, radiusPm: 197, en: 1.55, eaEv: null, eaMjMol: null },
    Fe: { z: 26, radiusPm: 194, en: 1.83, eaEv: 0.163, eaMjMol: 0.016 },
    Co: { z: 27, radiusPm: 192, en: 1.88, eaEv: 0.661, eaMjMol: 0.064 },
    Ni: { z: 28, radiusPm: 163, en: 1.91, eaEv: 1.156, eaMjMol: 0.112 },
    Cu: { z: 29, radiusPm: 140, en: 1.9, eaEv: 1.228, eaMjMol: 0.118 },
    Zn: { z: 30, radiusPm: 139, en: 1.65, eaEv: null, eaMjMol: null },
    Ga: { z: 31, radiusPm: 187, en: 1.81, eaEv: 0.3, eaMjMol: 0.029 },
    Ge: { z: 32, radiusPm: 211, en: 2.01, eaEv: 1.35, eaMjMol: 0.13 },
    As: { z: 33, radiusPm: 185, en: 2.18, eaEv: 0.81, eaMjMol: 0.078 },
    Se: { z: 34, radiusPm: 190, en: 2.55, eaEv: 2.021, eaMjMol: 0.195 },
    Br: { z: 35, radiusPm: 183, en: 2.96, eaEv: 3.365, eaMjMol: 0.325 },
    Kr: { z: 36, radiusPm: 202, en: 3, eaEv: null, eaMjMol: null },
    Rb: { z: 37, radiusPm: 303, en: 0.82, eaEv: 0.468, eaMjMol: 0.045 },
    Sr: { z: 38, radiusPm: 249, en: 0.95, eaEv: null, eaMjMol: null },
    Y: { z: 39, radiusPm: 219, en: 1.22, eaEv: 0.307, eaMjMol: 0.03 },
    Zr: { z: 40, radiusPm: 186, en: 1.33, eaEv: 0.426, eaMjMol: 0.041 },
    Nb: { z: 41, radiusPm: 207, en: 1.6, eaEv: 0.893, eaMjMol: 0.086 },
    Mo: { z: 42, radiusPm: 209, en: 2.16, eaEv: 0.746, eaMjMol: 0.072 },
    Tc: { z: 43, radiusPm: 209, en: 1.9, eaEv: 0.55, eaMjMol: 0.053 },
    Ru: { z: 44, radiusPm: 207, en: 2.2, eaEv: 1.05, eaMjMol: 0.101 },
    Rh: { z: 45, radiusPm: 195, en: 2.28, eaEv: 1.137, eaMjMol: 0.11 },
    Pd: { z: 46, radiusPm: 202, en: 2.2, eaEv: 0.557, eaMjMol: 0.054 },
    Ag: { z: 47, radiusPm: 172, en: 1.93, eaEv: 1.302, eaMjMol: 0.126 },
    Cd: { z: 48, radiusPm: 158, en: 1.69, eaEv: null, eaMjMol: null },
    In: { z: 49, radiusPm: 193, en: 1.78, eaEv: 0.3, eaMjMol: 0.029 },
    Sn: { z: 50, radiusPm: 217, en: 1.96, eaEv: 1.2, eaMjMol: 0.116 },
    Sb: { z: 51, radiusPm: 206, en: 2.05, eaEv: 1.07, eaMjMol: 0.103 },
    Te: { z: 52, radiusPm: 206, en: 2.1, eaEv: 1.971, eaMjMol: 0.19 },
    I: { z: 53, radiusPm: 198, en: 2.66, eaEv: 3.059, eaMjMol: 0.295 },
    Xe: { z: 54, radiusPm: 216, en: 2.6, eaEv: null, eaMjMol: null },
  };
  root.SuitePubChem = { PUBCHEM: PUBCHEM };
})(typeof window !== 'undefined' ? window : globalThis);
