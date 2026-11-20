/* Solubility & Ksp: salt, reagent and example data (SolData).
   Every number comes from the BC Chemistry 12 Data Booklet the class uses
   (docs/reference/chem12-data-booklet.md): Ksp at 25 °C, Ka, atomic masses (one decimal),
   and the solubility rules. A salt that isn't in the booklet is not used.
   One exception, kept honest: PbI₂'s enthalpy of dissolving (+70 kJ/mol), which only shapes the
   temperature trend and matches equilibrium_simulations.html.
   Hard rules: no kidney-stone chemistry (no oxalate, no phosphate); the Qual Lab never uses
   the real lab's ions (Ag⁺, Ba²⁺, Fe³⁺). */
(function (global) {
  'use strict';

  // ---------- Atomic masses (booklet, p. 2) ----------
  const MASS = {
    H: 1.0, C: 12.0, N: 14.0, O: 16.0, Na: 23.0, Mg: 24.3, S: 32.1, Cl: 35.5, K: 39.1,
    Ca: 40.1, Cr: 52.0, Sr: 87.6, Ag: 107.9, I: 126.9, Pb: 207.2
  };
  function molarMass(comp) {
    let m = 0;
    for (const el in comp) m += MASS[el] * comp[el];
    return Math.round(m * 10) / 10;
  }

  // ---------- Ions ----------
  // sym: plain text; html: with sub/superscripts; z: charge; comp: atoms; name: spoken name
  const ION = {
    'Ag+':   { sym: 'Ag⁺',    html: 'Ag<sup>+</sup>',              z: 1,  name: 'silver ion',      comp: { Ag: 1 } },
    'Pb2+':  { sym: 'Pb²⁺',   html: 'Pb<sup>2+</sup>',             z: 2,  name: 'lead(II) ion',    comp: { Pb: 1 } },
    'Mg2+':  { sym: 'Mg²⁺',   html: 'Mg<sup>2+</sup>',             z: 2,  name: 'magnesium ion',   comp: { Mg: 1 } },
    'Ca2+':  { sym: 'Ca²⁺',   html: 'Ca<sup>2+</sup>',             z: 2,  name: 'calcium ion',     comp: { Ca: 1 } },
    'Sr2+':  { sym: 'Sr²⁺',   html: 'Sr<sup>2+</sup>',             z: 2,  name: 'strontium ion',   comp: { Sr: 1 } },
    'Na+':   { sym: 'Na⁺',    html: 'Na<sup>+</sup>',              z: 1,  name: 'sodium ion',      comp: { Na: 1 } },
    'K+':    { sym: 'K⁺',     html: 'K<sup>+</sup>',               z: 1,  name: 'potassium ion',   comp: { K: 1 } },
    'H+':    { sym: 'H⁺',     html: 'H<sup>+</sup>',               z: 1,  name: 'hydrogen ion',    comp: { H: 1 } },
    'Cl-':   { sym: 'Cl⁻',    html: 'Cl<sup>−</sup>',              z: -1, name: 'chloride ion',    comp: { Cl: 1 } },
    'I-':    { sym: 'I⁻',     html: 'I<sup>−</sup>',               z: -1, name: 'iodide ion',      comp: { I: 1 } },
    'OH-':   { sym: 'OH⁻',    html: 'OH<sup>−</sup>',              z: -1, name: 'hydroxide ion',   comp: { O: 1, H: 1 } },
    'NO3-':  { sym: 'NO₃⁻',   html: 'NO<sub>3</sub><sup>−</sup>',  z: -1, name: 'nitrate ion',     comp: { N: 1, O: 3 } },
    'CO3^2-':  { sym: 'CO₃²⁻',  html: 'CO<sub>3</sub><sup>2−</sup>', z: -2, name: 'carbonate ion', comp: { C: 1, O: 3 } },
    'CrO4^2-': { sym: 'CrO₄²⁻', html: 'CrO<sub>4</sub><sup>2−</sup>', z: -2, name: 'chromate ion', comp: { Cr: 1, O: 4 } },
    'SO4^2-':  { sym: 'SO₄²⁻',  html: 'SO<sub>4</sub><sup>2−</sup>', z: -2, name: 'sulphate ion', comp: { S: 1, O: 4 } }
  };

  // ---------- Low-solubility salts (booklet, p. 5) ----------
  // cat/an: ion keys with counts per formula unit. colour: real precipitate colour token.
  // pH: how acid (H⁺) removes the anion: 'hydroxide' (OH⁻ + H⁺ → H₂O) or 'carbonate'
  // (CO₃²⁻ → HCO₃⁻ → H₂CO₃, using the booklet's Ka values). null: acid has no real effect.
  // dHsoln: J/mol, only where a reliable value exists; null means the temperature control is off.
  const SALTS = {
    AgCl: {
      formula: 'AgCl', html: 'AgCl', name: 'silver chloride', ksp: 1.8e-10,
      cat: ['Ag+', 1], an: ['Cl-', 1], comp: { Ag: 1, Cl: 1 },
      colour: '--ppt-white', colourName: 'white', pH: null, dHsoln: null,
      commonIons: ['NaCl', 'AgNO3']
    },
    PbI2: {
      formula: 'PbI₂', html: 'PbI<sub>2</sub>', name: 'lead(II) iodide', ksp: 8.5e-9,
      cat: ['Pb2+', 1], an: ['I-', 2], comp: { Pb: 1, I: 2 },
      colour: '--ppt-pbi2', colourName: 'yellow', pH: null, dHsoln: 70e3,
      commonIons: ['KI', 'PbNO32']
    },
    Ag2CrO4: {
      formula: 'Ag₂CrO₄', html: 'Ag<sub>2</sub>CrO<sub>4</sub>', name: 'silver chromate', ksp: 1.1e-12,
      cat: ['Ag+', 2], an: ['CrO4^2-', 1], comp: { Ag: 2, Cr: 1, O: 4 },
      colour: '--ppt-ag2cro4', colourName: 'red-brown', pH: null, dHsoln: null,
      commonIons: ['AgNO3', 'K2CrO4']
    },
    MgOH2: {
      formula: 'Mg(OH)₂', html: 'Mg(OH)<sub>2</sub>', name: 'magnesium hydroxide', ksp: 5.6e-12,
      cat: ['Mg2+', 1], an: ['OH-', 2], comp: { Mg: 1, O: 2, H: 2 },
      colour: '--ppt-white', colourName: 'white', pH: 'hydroxide', dHsoln: null,
      commonIons: ['NaOH', 'MgNO32']
    },
    CaCO3: {
      formula: 'CaCO₃', html: 'CaCO<sub>3</sub>', name: 'calcium carbonate', ksp: 5.0e-9,
      cat: ['Ca2+', 1], an: ['CO3^2-', 1], comp: { Ca: 1, C: 1, O: 3 },
      colour: '--ppt-white', colourName: 'white', pH: 'carbonate', dHsoln: null,
      commonIons: ['Na2CO3', 'CaNO32']
    },
    // Qual Lab only (Pb²⁺ / Sr²⁺ / Mg²⁺ scheme)
    SrSO4: {
      formula: 'SrSO₄', html: 'SrSO<sub>4</sub>', name: 'strontium sulphate', ksp: 3.4e-7,
      cat: ['Sr2+', 1], an: ['SO4^2-', 1], comp: { Sr: 1, S: 1, O: 4 },
      colour: '--ppt-white', colourName: 'white', pH: null, dHsoln: null, qualOnly: true
    },
    PbSO4: {
      formula: 'PbSO₄', html: 'PbSO<sub>4</sub>', name: 'lead(II) sulphate', ksp: 1.8e-8,
      cat: ['Pb2+', 1], an: ['SO4^2-', 1], comp: { Pb: 1, S: 1, O: 4 },
      colour: '--ppt-white', colourName: 'white', pH: null, dHsoln: null, qualOnly: true
    }
  };
  for (const k in SALTS) SALTS[k].molarMass = molarMass(SALTS[k].comp);

  const SANDBOX_SALTS = ['AgCl', 'PbI2', 'Ag2CrO4', 'MgOH2', 'CaCO3'];

  // ---------- Soluble salts used as reagents (soluble by the booklet's rules, p. 4) ----------
  // ions: [ionKey, count] released per formula unit
  const REAGENTS = {
    NaCl:    { formula: 'NaCl',      html: 'NaCl',                   name: 'sodium chloride',     ions: [['Na+', 1], ['Cl-', 1]], rule: 'alkali ion' },
    KI:      { formula: 'KI',        html: 'KI',                     name: 'potassium iodide',    ions: [['K+', 1], ['I-', 1]],   rule: 'alkali ion' },
    AgNO3:   { formula: 'AgNO₃',     html: 'AgNO<sub>3</sub>',       name: 'silver nitrate',      ions: [['Ag+', 1], ['NO3-', 1]], rule: 'nitrate' },
    PbNO32:  { formula: 'Pb(NO₃)₂',  html: 'Pb(NO<sub>3</sub>)<sub>2</sub>', name: 'lead(II) nitrate', ions: [['Pb2+', 1], ['NO3-', 2]], rule: 'nitrate' },
    K2CrO4:  { formula: 'K₂CrO₄',    html: 'K<sub>2</sub>CrO<sub>4</sub>', name: 'potassium chromate', ions: [['K+', 2], ['CrO4^2-', 1]], rule: 'alkali ion' },
    NaOH:    { formula: 'NaOH',      html: 'NaOH',                   name: 'sodium hydroxide',    ions: [['Na+', 1], ['OH-', 1]], rule: 'alkali ion' },
    KNO3:    { formula: 'KNO₃',      html: 'KNO<sub>3</sub>',        name: 'potassium nitrate',   ions: [['K+', 1], ['NO3-', 1]], rule: 'alkali ion' },
    MgNO32:  { formula: 'Mg(NO₃)₂',  html: 'Mg(NO<sub>3</sub>)<sub>2</sub>', name: 'magnesium nitrate', ions: [['Mg2+', 1], ['NO3-', 2]], rule: 'nitrate' },
    Na2CO3:  { formula: 'Na₂CO₃',    html: 'Na<sub>2</sub>CO<sub>3</sub>', name: 'sodium carbonate', ions: [['Na+', 2], ['CO3^2-', 1]], rule: 'alkali ion' },
    SrNO32:  { formula: 'Sr(NO₃)₂',  html: 'Sr(NO<sub>3</sub>)<sub>2</sub>', name: 'strontium nitrate', ions: [['Sr2+', 1], ['NO3-', 2]], rule: 'nitrate' },
    CaNO32:  { formula: 'Ca(NO₃)₂',  html: 'Ca(NO<sub>3</sub>)<sub>2</sub>', name: 'calcium nitrate', ions: [['Ca2+', 1], ['NO3-', 2]], rule: 'nitrate' },
    Na2SO4:  { formula: 'Na₂SO₄',    html: 'Na<sub>2</sub>SO<sub>4</sub>', name: 'sodium sulphate', ions: [['Na+', 2], ['SO4^2-', 1]], rule: 'alkali ion' },
    // The acid is nitric, not hydrochloric: its anion (nitrate) is soluble with everything,
    // so adding acid never brings down AgCl or PbCl₂ by accident.
    HNO3:    { formula: 'HNO₃',      html: 'HNO<sub>3</sub>',        name: 'nitric acid',         ions: [['H+', 1], ['NO3-', 1]], rule: 'strong acid', acid: true },
    // HCl only where no Ag⁺ or Pb²⁺ can be in the beaker: the Guide's CaCO₃ acid tab (user, 2026-11-20: the class reacted
    // seashells with hydrochloric acid)
    HCl:     { formula: 'HCl',       html: 'HCl',                    name: 'hydrochloric acid',   ions: [['H+', 1], ['Cl-', 1]], rule: 'strong acid', acid: true }
  };

  // ---------- Acid constants for the pH stress (booklet, p. 6) ----------
  const KA = {
    H2CO3: 4.3e-7,   // H₂CO₃ ⇌ H⁺ + HCO₃⁻
    HCO3: 5.6e-11,   // HCO₃⁻ ⇌ H⁺ + CO₃²⁻
    Kw: 1.0e-14
  };

  // ---------- Qual Lab (follow a scheme) ----------
  // Unknown: any mix of three ions (7 combinations) or none. Separation order matters:
  // iodide first (only Pb²⁺), then sulphate (Sr²⁺; Mg²⁺ stays, MgSO₄ is soluble), then hydroxide (Mg²⁺).
  const QUAL = {
    ions: ['Pb2+', 'Sr2+', 'Mg2+'],
    startConc: 0.050,          // mol/L of each ion present in the unknown
    steps: [
      { reagent: 'KI',     excess: 1.0,  target: 'Pb2+', solid: 'PbI2' },
      { reagent: 'Na2SO4', excess: 0.25, target: 'Sr2+', solid: 'SrSO4' },
      { reagent: 'NaOH',   excess: 0.50, target: 'Mg2+', solid: 'MgOH2' }
    ],
    // Every solid the scheme could form, so each step can show Q vs Ksp for the others too
    possibleSolids: ['PbI2', 'PbSO4', 'SrSO4', 'MgOH2'],
    // Soluble by the booklet's rules (p. 4), so they never form
    solubleByRule: [
      { formula: 'SrI₂', why: 'iodides are soluble except with Ag⁺, Pb²⁺, Cu⁺' },
      { formula: 'MgI₂', why: 'iodides are soluble except with Ag⁺, Pb²⁺, Cu⁺' },
      { formula: 'MgSO₄', why: 'sulphates are soluble except with Ag⁺, Ca²⁺, Sr²⁺, Ba²⁺, Pb²⁺' },
      { formula: 'Sr(OH)₂', why: 'Sr²⁺ is one of the few ions whose hydroxide is soluble' }
    ]
  };

  // ---------- Solubility rules (booklet, p. 4), for Part 1 chips ----------
  // "Soluble" means more than 0.1 mol/L at 25 °C.
  const RULE_CHIPS = [
    { formula: 'KNO₃',     soluble: true,  why: 'Alkali ions and nitrate are soluble with everything.' },
    { formula: 'AgCl',     soluble: false, why: 'Chlorides are soluble except with Ag⁺, Pb²⁺ and Cu⁺.' },
    { formula: 'MgSO₄',    soluble: true,  why: 'Sulphates are soluble except with Ag⁺, Ca²⁺, Sr²⁺, Ba²⁺ and Pb²⁺.' },
    { formula: 'PbI₂',     soluble: false, why: 'Iodides are soluble except with Ag⁺, Pb²⁺ and Cu⁺.' },
    { formula: 'Mg(OH)₂',  soluble: false, why: 'Hydroxides have low solubility except with alkali ions, H⁺, NH₄⁺ and Sr²⁺.' },
    { formula: 'Sr(OH)₂',  soluble: true,  why: 'A surprise: Sr²⁺ is on the short list of ions whose hydroxide is soluble.' },
    { formula: '(NH₄)₂CO₃', soluble: true, why: 'Anything with ammonium is soluble.' },
    { formula: 'CaCO₃',    soluble: false, why: 'Carbonates have low solubility except with alkali ions, H⁺ and NH₄⁺.' },
    { formula: 'Pb(NO₃)₂', soluble: true,  why: 'Nitrates are soluble with everything, even Pb²⁺.' },
    { formula: 'BaSO₄',    soluble: false, why: 'Sulphates are soluble except with Ag⁺, Ca²⁺, Sr²⁺, Ba²⁺ and Pb²⁺.' },
    { formula: 'Na₂CO₃',   soluble: true,  why: 'Anything with an alkali ion is soluble, even a carbonate.' },
    { formula: 'ZnS',      soluble: false, why: 'Sulphides have low solubility except with alkali ions, H⁺, NH₄⁺, Be²⁺, Mg²⁺, Ca²⁺, Sr²⁺ and Ba²⁺.' }
  ];

  // ---------- Guide examples ----------
  const GUIDE = {
    // Part 1: worked s ↔ Ksp, one 1:1 and one 1:2
    worked: ['AgCl', 'PbI2'],
    // "Smaller Ksp isn't always less soluble": Ag₂CrO₄ has the smaller Ksp but dissolves more than AgCl
    comparePair: ['AgCl', 'Ag2CrO4'],
    // Real-life observations to start students' own questions (QP)
    observations: [
      { id: 'cave',  salt: 'CaCO3', title: 'Cave formations', line: 'Stalactites grow drop by drop as calcium carbonate comes out of dripping water.' },
      { id: 'scale', salt: 'CaCO3', title: 'Kettle scale', line: 'A white crust builds up inside kettles in hard-water towns.' },
      { id: 'antacid', salt: 'MgOH2', title: 'Milk of magnesia', line: 'A cloudy white suspension that dissolves once it meets stomach acid.' }
    ]
  };

  // ---------- Helpers ----------
  function counts(salt) { return { m: salt.cat[1], n: salt.an[1] }; }
  // Molar solubility in pure water: Ksp = (m s)^m (n s)^n
  function molarSolubility(salt) {
    const { m, n } = counts(salt);
    return Math.pow(salt.ksp / (Math.pow(m, m) * Math.pow(n, n)), 1 / (m + n));
  }
  function kspFromS(salt, s) {
    const { m, n } = counts(salt);
    return Math.pow(m * s, m) * Math.pow(n * s, n);
  }
  // Ksp at temperature T (K), van 't Hoff from 25 °C; null when there's no data
  function kspAt(salt, T) {
    if (!salt.dHsoln) return T === 298.15 ? salt.ksp : null;
    return salt.ksp * Math.exp(-(salt.dHsoln / 8.314) * (1 / T - 1 / 298.15));
  }

  const SolData = { MASS, ION, SALTS, SANDBOX_SALTS, REAGENTS, KA, QUAL, RULE_CHIPS, GUIDE,
    molarMass, molarSolubility, kspFromS, kspAt };
  global.SolData = SolData;
  if (typeof module !== 'undefined' && module.exports) module.exports = SolData;
})(typeof window !== 'undefined' ? window : globalThis);
