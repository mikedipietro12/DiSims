/**
 * Chemical Bonding - shared kit (Task 2).
 *
 * One source for every element, molecule, and salt used in the Guide and the Draw Lab.
 * Pages resolve everything through BondingKit; no one-off molecule definitions in pages.
 *
 * Reference Lewis structures are compact strings:
 *   atoms: "El x y lp; El x y lp; ..."   x/y in bond lengths (y grows downward), lp = lone pairs
 *   bonds: "0-1, 1=2, 2#3"                - single, = double, # triple
 * Formal charges are NOT stored; lewis-model.js computes them (and the tests check them).
 *
 * Works as a browser global (window.BondingKit) and as a CommonJS module (node tests).
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Elements
  // valence: valence electrons · en: Pauling electronegativity · canExpand: period ≥ 3 (more than 8 allowed)
  // octet: usual electron target (H 2, B 6 as a common exception; everything else 8)
  // kit: model-kit hues for VSEPR / 3D only (Lewis drawing is ink, no colour). null = not yet chosen.
  // ---------------------------------------------------------------------------
  var ELEMENTS = {
    H:  { symbol: 'H',  name: 'hydrogen',  Z: 1,  valence: 1, en: 2.20, octet: 2, canExpand: false, kit: ['#ffffff', '#d5d9e3'] },
    Li: { symbol: 'Li', name: 'lithium',   Z: 3,  valence: 1, en: 0.98, octet: 8, canExpand: false, kit: null },
    Be: { symbol: 'Be', name: 'beryllium', Z: 4,  valence: 2, en: 1.57, octet: 4, canExpand: false, kit: null },
    B:  { symbol: 'B',  name: 'boron',     Z: 5,  valence: 3, en: 2.04, octet: 6, canExpand: false, kit: null },
    C:  { symbol: 'C',  name: 'carbon',    Z: 6,  valence: 4, en: 2.55, octet: 8, canExpand: false, kit: ['#545b6e', '#23272f'] },
    N:  { symbol: 'N',  name: 'nitrogen',  Z: 7,  valence: 5, en: 3.04, octet: 8, canExpand: false, kit: ['#8494ff', '#4152d9'] },
    O:  { symbol: 'O',  name: 'oxygen',    Z: 8,  valence: 6, en: 3.44, octet: 8, canExpand: false, kit: ['#ff8a6a', '#e0503a'] },
    F:  { symbol: 'F',  name: 'fluorine',  Z: 9,  valence: 7, en: 3.98, octet: 8, canExpand: false, kit: ['#86e3b0', '#2f9e6a'] },
    Ne: { symbol: 'Ne', name: 'neon',      Z: 10, valence: 8, en: null, octet: 8, canExpand: false, kit: ['#86dff0', '#2d9cb6'] },
    Na: { symbol: 'Na', name: 'sodium',    Z: 11, valence: 1, en: 0.93, octet: 8, canExpand: false, kit: ['#c9a8ff', '#7a52e0'] },
    Mg: { symbol: 'Mg', name: 'magnesium', Z: 12, valence: 2, en: 1.31, octet: 8, canExpand: false, kit: null },
    Al: { symbol: 'Al', name: 'aluminium', Z: 13, valence: 3, en: 1.61, octet: 8, canExpand: true,  kit: null },
    Si: { symbol: 'Si', name: 'silicon',   Z: 14, valence: 4, en: 1.90, octet: 8, canExpand: true,  kit: null },
    P:  { symbol: 'P',  name: 'phosphorus',Z: 15, valence: 5, en: 2.19, octet: 8, canExpand: true,  kit: null },
    S:  { symbol: 'S',  name: 'sulfur',    Z: 16, valence: 6, en: 2.58, octet: 8, canExpand: true,  kit: null },
    Cl: { symbol: 'Cl', name: 'chlorine',  Z: 17, valence: 7, en: 3.16, octet: 8, canExpand: true,  kit: ['#bce673', '#69a42b'] },
    K:  { symbol: 'K',  name: 'potassium', Z: 19, valence: 1, en: 0.82, octet: 8, canExpand: false, kit: null },
    Ca: { symbol: 'Ca', name: 'calcium',   Z: 20, valence: 2, en: 1.00, octet: 8, canExpand: false, kit: null },
    Br: { symbol: 'Br', name: 'bromine',   Z: 35, valence: 7, en: 2.96, octet: 8, canExpand: true,  kit: ['#d98463', '#8a3b22'] },
    I:  { symbol: 'I',  name: 'iodine',    Z: 53, valence: 7, en: 2.66, octet: 8, canExpand: true,  kit: null },
    Xe: { symbol: 'Xe', name: 'xenon',     Z: 54, valence: 8, en: 2.60, octet: 8, canExpand: true,  kit: null },
  };

  // ---------------------------------------------------------------------------
  // Molecules - reference Lewis structures
  // tags: where the molecule is used (demo / practice beat / lab group)
  // center: index of the central atom for VSEPR (null for chains; Ch C uses per-carbon domains)
  // polar: overall polarity + a short plain-language reason (for B·3 and the Lab)
  // angles: measured bond angles where they differ from ideal (degrees)
  // ---------------------------------------------------------------------------
  var M = [
    // --- Chapter A: covalent examples -------------------------------------
    { id: 'h2',  formula: 'H₂',  name: 'hydrogen',  atoms: 'H 0 0 0; H 1 0 0', bonds: '0-1', center: null,
      polar: [false, 'Identical atoms pull the shared pair equally.'], tags: ['chA', 'p11', 'lab'] },
    { id: 'cl2', formula: 'Cl₂', name: 'chlorine',  atoms: 'Cl 0 0 3; Cl 1 0 3', bonds: '0-1', center: null,
      polar: [false, 'Identical atoms pull the shared pair equally.'], tags: ['chA', 'lab'] },
    { id: 'hcl', formula: 'HCl', name: 'hydrogen chloride', atoms: 'H 0 0 0; Cl 1 0 3', bonds: '0-1', center: null,
      polar: [true, 'Cl pulls the shared pair more than H does.'], tags: ['chA', 'lab'] },
    { id: 'hbr', formula: 'HBr', name: 'hydrogen bromide', atoms: 'H 0 0 0; Br 1 0 3', bonds: '0-1', center: null,
      polar: [true, 'Br pulls the shared pair more than H does.'], tags: ['p11', 'lab'] },

    // --- Chapter B·1: single bonds ----------------------------------------
    { id: 'ch4', formula: 'CH₄', name: 'methane',
      atoms: 'C 0 0 0; H 0 -1 0; H 1 0 0; H 0 1 0; H -1 0 0', bonds: '0-1, 0-2, 0-3, 0-4', center: 0,
      polar: [false, 'Four identical C–H pulls spread evenly and cancel.'], tags: ['b10', 'vsepr', 'lab'] },
    { id: 'h2o', formula: 'H₂O', name: 'water',
      atoms: 'O 0 0 2; H -0.8 0.6 0; H 0.8 0.6 0', bonds: '0-1, 0-2', center: 0, angles: { HOH: 104.5 },
      polar: [true, 'The bent shape means the two O–H pulls do not cancel.'], tags: ['chA', 'b10', 'vsepr', 'polarity', 'lab'] },
    { id: 'nh3', formula: 'NH₃', name: 'ammonia',
      atoms: 'N 0 0 1; H -1 0 0; H 1 0 0; H 0 1 0', bonds: '0-1, 0-2, 0-3', center: 0, angles: { HNH: 107 },
      polar: [true, 'The lone pair makes the shape a pyramid, so the N–H pulls do not cancel.'], tags: ['vsepr', 'polarity', 'lab'] },
    { id: 'pcl3', formula: 'PCl₃', name: 'phosphorus trichloride',
      atoms: 'P 0 0 1; Cl -1 0 3; Cl 1 0 3; Cl 0 1 3', bonds: '0-1, 0-2, 0-3', center: 0,
      polar: [true, 'Trigonal pyramidal: the P–Cl pulls do not cancel.'], tags: ['p11', 'p22', 'lab'] },
    { id: 'sf2', formula: 'SF₂', name: 'sulfur difluoride',
      atoms: 'S 0 0 2; F -0.8 0.6 3; F 0.8 0.6 3', bonds: '0-1, 0-2', center: 0,
      polar: [true, 'Bent, like water: the S–F pulls do not cancel.'], tags: ['p11', 'lab'] },

    // --- Chapter B·1: multiple bonds + formal charge ----------------------
    { id: 'o2', formula: 'O₂', name: 'oxygen', atoms: 'O 0 0 2; O 1 0 2', bonds: '0=1', center: null,
      polar: [false, 'Identical atoms.'], tags: ['b12', 'lab'] },
    { id: 'hcn', formula: 'HCN', name: 'hydrogen cyanide', atoms: 'H -1 0 0; C 0 0 0; N 1 0 1', bonds: '0-1, 1#2', center: 1,
      polar: [true, 'Linear, but N pulls much harder than H, so the pulls do not cancel.'], tags: ['b12', 'lab'] },
    { id: 'co2', formula: 'CO₂', name: 'carbon dioxide', atoms: 'O -1 0 2; C 0 0 0; O 1 0 2', bonds: '0=1, 1=2', center: 1,
      polar: [false, 'Linear: the two C=O pulls point opposite ways and cancel.'], tags: ['b13', 'vsepr', 'polarity', 'lab'] },
    { id: 'co2-alt', formula: 'CO₂', name: 'carbon dioxide (other arrangement)', atoms: 'O -1 0 1; C 0 0 0; O 1 0 3', bonds: '0#1, 1-2', center: 1,
      note: 'Valid octets, but formal charges +1 and −1. Compared with O=C=O in beat 13.', tags: ['b13'] },
    { id: 'hnc', formula: 'HNC', name: 'hydrogen isocyanide', atoms: 'H -1 0 0; N 0 0 0; C 1 0 1', bonds: '0-1, 1#2', center: 1,
      note: 'Same atoms as HCN in a different order: FC +1 on N and −1 on C. Compared with HCN in beat 13.', tags: ['b13'] },
    { id: 'ocn', formula: 'OCN⁻', name: 'cyanate', charge: -1, atoms: 'N -1 0 1; C 0 0 0; O 1 0 3', bonds: '0#1, 1-2', center: 1,
      note: 'Best form: the −1 sits on O, the most electronegative atom.', tags: ['b13'] },
    { id: 'ocn-alt', formula: 'OCN⁻', name: 'cyanate (other arrangement)', charge: -1, atoms: 'N -1 0 2; C 0 0 0; O 1 0 2', bonds: '0=1, 1=2', center: 1,
      note: 'Valid octets, but the −1 sits on N, which is less electronegative than O.', tags: ['b13'] },
    { id: 'c2h4', formula: 'H₂CCH₂', name: 'ethene',
      atoms: 'C -0.5 0 0; C 0.5 0 0; H -1.1 -0.8 0; H -1.1 0.8 0; H 1.1 -0.8 0; H 1.1 0.8 0',
      bonds: '0=1, 0-2, 0-3, 1-4, 1-5', center: null,
      polar: [false, 'Symmetrical: the C–H pulls cancel.'], tags: ['p14', 'chC', 'lab'] },
    { id: 'n2h2', formula: 'HNNH', name: 'diazene',
      atoms: 'H -1.3 -0.6 0; N -0.5 0 1; N 0.5 0 1; H 1.3 0.6 0', bonds: '0-1, 1=2, 2-3', center: null, tags: ['p14', 'lab'] },
    { id: 'ch2nh', formula: 'H₂CNH', name: 'methanimine',
      atoms: 'C -0.5 0 0; N 0.5 0 1; H -1.1 -0.8 0; H -1.1 0.8 0; H 1.3 -0.6 0', bonds: '0=1, 0-2, 0-3, 1-4', center: null,
      tags: ['p14', 'p31', 'lab'] },
    { id: 'n2', formula: 'N₂', name: 'nitrogen', atoms: 'N 0 0 1; N 1 0 1', bonds: '0#1', center: null,
      polar: [false, 'Identical atoms.'], tags: ['p14', 'lab'] },
    { id: 'co', formula: 'CO', name: 'carbon monoxide', atoms: 'C 0 0 1; O 1 0 1', bonds: '0#1', center: null,
      note: 'Octets on both atoms only with C≡O, which leaves FC −1 on C and +1 on O.', tags: ['p14', 'lab'] },

    // --- Chapter B·1: polyatomic ions -------------------------------------
    { id: 'nh4', formula: 'NH₄⁺', name: 'ammonium', charge: 1,
      atoms: 'N 0 0 0; H 0 -1 0; H 1 0 0; H 0 1 0; H -1 0 0', bonds: '0-1, 0-2, 0-3, 0-4', center: 0, tags: ['b15', 'lab'] },
    { id: 'co3', formula: 'CO₃²⁻', name: 'carbonate', charge: -2,
      atoms: 'C 0 0 0; O 0 -1 2; O -0.87 0.5 3; O 0.87 0.5 3', bonds: '0=1, 0-2, 0-3', center: 0, resonance: true, tags: ['b15', 'lab'] },
    { id: 'no-', formula: 'NO⁻', name: 'nitroxyl anion', charge: -1,
      atoms: 'N 0 0 2; O 1 0 2', bonds: '0=1', center: null, tags: ['p18', 'lab'] },
    { id: 'cn-', formula: 'CN⁻', name: 'cyanide', charge: -1,
      atoms: 'C 0 0 1; N 1 0 1', bonds: '0#1', center: null, tags: ['p18', 'lab'] },
    { id: 'h3o', formula: 'H₃O⁺', name: 'hydronium', charge: 1,
      atoms: 'O 0 0 1; H -1 0 0; H 1 0 0; H 0 1 0', bonds: '0-1, 0-2, 0-3', center: 0, tags: ['p18', 'lab'] },

    // --- Chapter B·1: resonance -------------------------------------------
    { id: 'o3', formula: 'O₃', name: 'ozone',
      atoms: 'O -0.87 0.5 2; O 0 0 1; O 0.87 0.5 3', bonds: '0=1, 1-2', center: 1, resonance: true, angles: { OOO: 117 },
      polar: [true, 'Bent: the pulls do not cancel (a small dipole).'], tags: ['b16', 'lab'] },
    { id: 'no3', formula: 'NO₃⁻', name: 'nitrate', charge: -1,
      atoms: 'N 0 0 0; O 0 -1 2; O -0.87 0.5 3; O 0.87 0.5 3', bonds: '0=1, 0-2, 0-3', center: 0, resonance: true, tags: ['b16', 'lab'] },
    { id: 'no2', formula: 'NO₂⁻', name: 'nitrite', charge: -1,
      atoms: 'N 0 0 1; O -0.87 0.5 2; O 0.87 0.5 3', bonds: '0=1, 0-2', center: 0, resonance: true, tags: ['p18', 'lab'] },
    { id: 'so2', formula: 'SO₂', name: 'sulfur dioxide',
      atoms: 'S 0 0 1; O -0.87 0.5 2; O 0.87 0.5 2', bonds: '0=1, 0=2', center: 0, angles: { OSO: 119 },
      note: 'Expanded octet on S (10 electrons) with every formal charge 0 (teacher choice, 2026-11-10). A first expanded octet students meet on their own.',
      polar: [true, 'Bent: the S–O pulls do not cancel.'], tags: ['p22', 'lab'] },

    // --- Chapter B·1 / B·2: expanded octets -------------------------------
    { id: 'pcl5', formula: 'PCl₅', name: 'phosphorus pentachloride',
      atoms: 'P 0 0 0; Cl 0 -1 3; Cl -0.95 -0.31 3; Cl -0.59 0.81 3; Cl 0.59 0.81 3; Cl 0.95 -0.31 3',
      bonds: '0-1, 0-2, 0-3, 0-4, 0-5', center: 0, polar: [false, 'Trigonal bipyramidal: all P–Cl pulls cancel.'], tags: ['b17', 'vsepr', 'lab'] },
    { id: 'sf6', formula: 'SF₆', name: 'sulfur hexafluoride',
      atoms: 'S 0 0 0; F 0 -1 3; F 0.87 -0.5 3; F 0.87 0.5 3; F 0 1 3; F -0.87 0.5 3; F -0.87 -0.5 3',
      bonds: '0-1, 0-2, 0-3, 0-4, 0-5, 0-6', center: 0, polar: [false, 'Octahedral: all S–F pulls cancel.'], tags: ['b17', 'vsepr', 'lab'] },
    { id: 'xef4', formula: 'XeF₄', name: 'xenon tetrafluoride',
      atoms: 'Xe 0 0 2; F 0 -1 3; F 1 0 3; F 0 1 3; F -1 0 3', bonds: '0-1, 0-2, 0-3, 0-4', center: 0,
      polar: [false, 'Square planar: the Xe–F pulls cancel.'], tags: ['p18', 'vsepr', 'lab'] },
    { id: 'xef2', formula: 'XeF₂', name: 'xenon difluoride',
      atoms: 'Xe 0 0 3; F -1 0 3; F 1 0 3', bonds: '0-1, 0-2', center: 0,
      polar: [false, 'Linear: the two Xe–F pulls cancel.'], tags: ['p22', 'vsepr', 'lab'] },
    { id: 'sf4', formula: 'SF₄', name: 'sulfur tetrafluoride',
      atoms: 'S 0 0 1; F -1 0 3; F 1 0 3; F -0.6 0.8 3; F 0.6 0.8 3', bonds: '0-1, 0-2, 0-3, 0-4', center: 0,
      polar: [true, 'Seesaw: the S–F pulls do not cancel.'], tags: ['p22', 'vsepr', 'lab'] },
    { id: 'clf3', formula: 'ClF₃', name: 'chlorine trifluoride',
      atoms: 'Cl 0 0 2; F -1 0 3; F 1 0 3; F 0 1 3', bonds: '0-1, 0-2, 0-3', center: 0,
      polar: [true, 'T-shaped: the Cl–F pulls do not cancel.'], tags: ['vsepr', 'lab'] },
    { id: 'brf5', formula: 'BrF₅', name: 'bromine pentafluoride',
      atoms: 'Br 0 0 1; F -1 0 3; F 1 0 3; F 0 1 3; F -0.7 0.7 3; F 0.7 0.7 3', bonds: '0-1, 0-2, 0-3, 0-4, 0-5', center: 0,
      polar: [true, 'Square pyramidal: the Br–F pulls do not cancel.'], tags: ['vsepr', 'lab'] },

    // --- Chapter B·2 / B·3: shape and polarity ----------------------------
    { id: 'bf3', formula: 'BF₃', name: 'boron trifluoride',
      atoms: 'B 0 0 0; F 0 -1 3; F -0.87 0.5 3; F 0.87 0.5 3', bonds: '0-1, 0-2, 0-3', center: 0,
      note: 'B has only 6 electrons around it: a common exception.',
      polar: [false, 'Trigonal planar: the three B–F pulls cancel.'], tags: ['p22', 'polarity', 'lab'] },
    { id: 'ccl4', formula: 'CCl₄', name: 'carbon tetrachloride',
      atoms: 'C 0 0 0; Cl 0 -1 3; Cl 1 0 3; Cl 0 1 3; Cl -1 0 3', bonds: '0-1, 0-2, 0-3, 0-4', center: 0,
      polar: [false, 'Tetrahedral with four identical pulls: they cancel.'], tags: ['b24', 'polarity', 'lab'] },
    { id: 'chcl3', formula: 'CHCl₃', name: 'chloroform',
      atoms: 'C 0 0 0; H 0 -1 0; Cl 1 0 3; Cl 0 1 3; Cl -1 0 3', bonds: '0-1, 0-2, 0-3, 0-4', center: 0,
      polar: [true, 'Swapping one Cl for H breaks the balance: the pulls no longer cancel.'], tags: ['b24', 'polarity', 'lab'] },

    // --- Chapter C: hybridization -----------------------------------------
    { id: 'c2h6', formula: 'C₂H₆', name: 'ethane',
      atoms: 'C -0.5 0 0; C 0.5 0 0; H -0.5 -1 0; H -1.5 0 0; H -0.5 1 0; H 0.5 -1 0; H 1.5 0 0; H 0.5 1 0',
      bonds: '0-1, 0-2, 0-3, 0-4, 1-5, 1-6, 1-7', center: null, tags: ['chC', 'lab'] },
    { id: 'c2h2', formula: 'C₂H₂', name: 'ethyne',
      atoms: 'H -1.5 0 0; C -0.5 0 0; C 0.5 0 0; H 1.5 0 0', bonds: '0-1, 1#2, 2-3', center: null, tags: ['chC', 'lab'] },
    { id: 'c3h6', formula: 'C₃H₆', name: 'propene',
      atoms: 'C -1 0 0; C 0 0 0; C 1 0 0; H -1.6 -0.8 0; H -1.6 0.8 0; H 0 -1 0; H 1 -1 0; H 2 0 0; H 1 1 0',
      bonds: '0=1, 1-2, 0-3, 0-4, 1-5, 2-6, 2-7, 2-8', center: null, tags: ['p31', 'lab'] },
    { id: 'c3h4', formula: 'C₃H₄', name: 'propyne',
      atoms: 'H -2 0 0; C -1 0 0; C 0 0 0; C 1 0 0; H 1 -1 0; H 2 0 0; H 1 1 0',
      bonds: '0-1, 1#2, 2-3, 3-4, 3-5, 3-6', center: null, tags: ['p31', 'lab'] },
  ];

  // ---------------------------------------------------------------------------
  // Ionic examples (Ch A beat 6: Lewis dot transfer)
  // ---------------------------------------------------------------------------
  var IONIC = [
    { id: 'nacl', formula: 'NaCl', name: 'sodium chloride', metal: 'Na', nonmetal: 'Cl', ratio: [1, 1], transfer: 1 },
    { id: 'mgo',  formula: 'MgO',  name: 'magnesium oxide', metal: 'Mg', nonmetal: 'O',  ratio: [1, 1], transfer: 2 },
  ];

  // ---------------------------------------------------------------------------
  // Salts (Ch A beat 8) - melting point is the lens (user, 2026-11-10)
  // mp: °C at 1 atm, rounded. Source: CRC Handbook of Chemistry and Physics (via standard tables).
  // radii: Shannon ionic radii, 6-coordinate, pm. Source: Shannon (1976), Acta Cryst. A32, 751.
  // Groups: size series (same charges, growing anion) and charge pair (similar sizes, doubled charges).
  // ---------------------------------------------------------------------------
  var IONS = {
    'Li+': { charge: 1, r: 76 }, 'Na+': { charge: 1, r: 102 }, 'K+': { charge: 1, r: 138 },
    'Mg2+': { charge: 2, r: 72 }, 'Ca2+': { charge: 2, r: 100 },
    'F-': { charge: -1, r: 133 }, 'Cl-': { charge: -1, r: 181 }, 'Br-': { charge: -1, r: 196 }, 'I-': { charge: -1, r: 220 },
    'O2-': { charge: -2, r: 140 },
  };
  var SALTS = [
    { id: 'naf',  formula: 'NaF',  cation: 'Na+',  anion: 'F-',  mp: 993,  groups: ['size', 'charge'] },
    { id: 'nacl', formula: 'NaCl', cation: 'Na+',  anion: 'Cl-', mp: 801,  groups: ['size', 'core'] },
    { id: 'nabr', formula: 'NaBr', cation: 'Na+',  anion: 'Br-', mp: 747,  groups: ['size'] },
    { id: 'nai',  formula: 'NaI',  cation: 'Na+',  anion: 'I-',  mp: 661,  groups: ['size'] },
    { id: 'kcl',  formula: 'KCl',  cation: 'K+',   anion: 'Cl-', mp: 770,  groups: [] },
    { id: 'kbr',  formula: 'KBr',  cation: 'K+',   anion: 'Br-', mp: 734,  groups: ['core'] },
    { id: 'mgo',  formula: 'MgO',  cation: 'Mg2+', anion: 'O2-', mp: 2852, groups: ['charge', 'core'] },
    { id: 'cao',  formula: 'CaO',  cation: 'Ca2+', anion: 'O2-', mp: 2613, groups: [] },
  ];

  // Other crystal types beside the salts (beat 8 preview only; taught properly later in the course).
  // mp: °C at 1 atm, rounded; sublimation noted. Source: CRC Handbook of Chemistry and Physics (standard tables).
  var CRYSTALS = [
    { id: 'diamond', formula: 'C (diamond)', type: 'covalent network', mp: 3550, mpNote: 'approximate; changes form before melting at 1 atm',
      heldBy: 'covalent bonds running through the whole crystal' },
    { id: 'quartz', formula: 'SiO₂ (quartz)', type: 'covalent network', mp: 1713, heldBy: 'covalent bonds running through the whole crystal' },
    { id: 'ice', formula: 'H₂O (ice)', type: 'molecular', mp: 0, heldBy: 'forces between molecules (coming in Intermolecular Forces)' },
    { id: 'iodine', formula: 'I₂', type: 'molecular', mp: 114, heldBy: 'forces between molecules (coming in Intermolecular Forces)' },
    { id: 'dry-ice', formula: 'CO₂ (dry ice)', type: 'molecular', mp: -78, mpNote: 'sublimes at 1 atm', heldBy: 'forces between molecules (coming in Intermolecular Forces)' },
  ];

  // ---------------------------------------------------------------------------
  // Parsing
  // ---------------------------------------------------------------------------
  function parseAtoms(str) {
    return str.split(';').map(function (s) {
      var p = s.trim().split(/\s+/);
      if (!ELEMENTS[p[0]]) throw new Error('Unknown element ' + p[0]);
      return { el: p[0], x: +p[1], y: +p[2], lp: +(p[3] || 0) };
    });
  }
  function parseBonds(str) {
    if (!str) return [];
    return str.split(',').map(function (s) {
      var m = s.trim().match(/^(\d+)([-=#])(\d+)$/);
      if (!m) throw new Error('Bad bond ' + s);
      return { a: +m[1], b: +m[3], order: { '-': 1, '=': 2, '#': 3 }[m[2]] };
    });
  }

  var BY_ID = {};
  M.forEach(function (m) {
    m.charge = m.charge || 0;
    m.structure = { atoms: parseAtoms(m.atoms), bonds: parseBonds(m.bonds), charge: m.charge };
    BY_ID[m.id] = m;
  });

  /** A fresh, mutable copy of a molecule's reference structure. */
  function structure(id) {
    var m = BY_ID[id];
    if (!m) throw new Error('Unknown molecule ' + id);
    return JSON.parse(JSON.stringify(m.structure));
  }

  function byTag(tag) {
    return M.filter(function (m) { return m.tags.indexOf(tag) !== -1; });
  }

  // Practice sets (strategy beat list). Teacher's starter list is the backbone of the Lewis practice.
  var PRACTICE = {
    p11: ['h2', 'hbr', 'pcl3', 'sf2'],
    p14: ['c2h4', 'n2h2', 'ch2nh', 'n2', 'co'],
    p18: ['no-', 'cn-', 'h3o', 'no2', 'xef4'],
    p22: ['bf3', 'so2', 'pcl3', 'sf4', 'xef2'],
    p31: ['c3h6', 'c3h4', 'ch2nh'],
  };
  var STARTER_LIST = ['h2', 'hbr', 'pcl3', 'sf2', 'c2h4', 'n2h2', 'ch2nh', 'no-', 'n2', 'co', 'cn-'];

  var BondingKit = {
    ELEMENTS: ELEMENTS,
    MOLECULES: M,
    IONIC: IONIC,
    IONS: IONS,
    SALTS: SALTS,
    CRYSTALS: CRYSTALS,
    PRACTICE: PRACTICE,
    STARTER_LIST: STARTER_LIST,
    get: function (id) { return BY_ID[id]; },
    structure: structure,
    byTag: byTag,
    element: function (s) { return ELEMENTS[s]; },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = BondingKit;
  else global.BondingKit = BondingKit;
})(typeof window !== 'undefined' ? window : this);
