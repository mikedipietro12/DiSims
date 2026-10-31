/**
 * Intro to Equilibrium - shared reaction kit (Task 2).
 *
 * One file feeds the Guide stage and the Sandbox: vessel reactions (one per ΔH/ΔS sign
 * case + custom A ⇌ B) and the Guide's predict-then-reveal example cards.
 * Rooms must resolve reactions and examples through EqReactions - no one-off data.
 *
 * Values are approximate standard values (ΔH in kJ, ΔS in J/K, per reaction as written).
 * They only set signs and bar lengths; no numbers are shown to students (principle 3).
 */
(function (global) {
  'use strict';

  /** Atom shades [highlight, base] - same model-kit palette as equilibrium_simulations.html. */
  var ATOM = {
    H: ['#ffffff', '#d5d9e3'],
    N: ['#8494ff', '#4152d9'],
    O: ['#ff8a6a', '#e0503a'],
    // NO2 is a brown gas, so both its atoms are brown
    Nb: ['#c9956a', '#8b5a2b'],
    Ob: ['#d4a574', '#8f5e32'],
    // NH3 is green to match its chart line
    Ng: ['#6fd39b', '#24835a'],
    Hg: ['#e3f7ea', '#9fd8b5'],
    // ozone is a pale blue gas, so its atoms are blue (tells O3 from O2 at a glance)
    Oz: ['#a9d6f7', '#3f8fcb'],
    // custom particles: ember / tide (taste: Ember and Tide)
    A: ['#f6b27a', '#e07a2e'],
    B: ['#6cc9c6', '#14918f'],
  };

  /**
   * Species drawings: atoms in molecule units (x, y, radius r), centred on 0,0.
   * color = chart line / label colour.
   */
  var SPECIES = {
    no2:  { label: 'NO₂',  name: 'nitrogen dioxide',   color: '#9a5b2e', atoms: [{ el: 'Nb', x: 0, y: 0, r: 1 }, { el: 'Ob', x: -1.15, y: 0.75, r: 0.95 }, { el: 'Ob', x: 1.15, y: 0.75, r: 0.95 }] },
    // N2O4 is colourless: glassy 'clear' atoms, as in the Le Châtelier sim
    n2o4: { label: 'N₂O₄', name: 'dinitrogen tetroxide', color: '#1d2433', atoms: [{ el: 'clear', x: -0.7, y: 0, r: 1 }, { el: 'clear', x: 0.7, y: 0, r: 1 }, { el: 'clear', x: -1.55, y: -0.95, r: 0.95 }, { el: 'clear', x: -1.55, y: 0.95, r: 0.95 }, { el: 'clear', x: 1.55, y: -0.95, r: 0.95 }, { el: 'clear', x: 1.55, y: 0.95, r: 0.95 }] },
    n2:   { label: 'N₂',   name: 'nitrogen',           color: '#4152d9', atoms: [{ el: 'N', x: -0.55, y: 0, r: 1 }, { el: 'N', x: 0.55, y: 0, r: 1 }] },
    h2:   { label: 'H₂',   name: 'hydrogen',           color: '#5b6474', atoms: [{ el: 'H', x: -0.4, y: 0, r: 0.7 }, { el: 'H', x: 0.4, y: 0, r: 0.7 }] },
    nh3:  { label: 'NH₃',  name: 'ammonia',            color: '#24835a', atoms: [{ el: 'Ng', x: 0, y: 0, r: 1 }, { el: 'Hg', x: -0.95, y: 0.6, r: 0.7 }, { el: 'Hg', x: 0.95, y: 0.6, r: 0.7 }, { el: 'Hg', x: 0, y: -1.05, r: 0.7 }] },
    o2:   { label: 'O₂',   name: 'oxygen',             color: '#e0503a', atoms: [{ el: 'O', x: -0.55, y: 0, r: 0.95 }, { el: 'O', x: 0.55, y: 0, r: 0.95 }] },
    o3:   { label: 'O₃',   name: 'ozone',              color: '#3f8fcb', atoms: [{ el: 'Oz', x: 0, y: -0.45, r: 0.95 }, { el: 'Oz', x: -1.1, y: 0.4, r: 0.95 }, { el: 'Oz', x: 1.1, y: 0.4, r: 0.95 }] },
    a:    { label: 'A',    name: 'particle A',         color: '#e07a2e', atoms: [{ el: 'A', x: 0, y: 0, r: 1.1 }] },
    b:    { label: 'B',    name: 'particle B',         color: '#14918f', atoms: [{ el: 'B', x: -0.5, y: 0, r: 0.95 }, { el: 'B', x: 0.5, y: 0, r: 0.95 }] },
  };

  /** Sandbox temperature slider range (K). Both "flips" crossovers sit inside it. */
  var T_RANGE = { min: 200, max: 700, start: 298 };

  /**
   * Vessel reactions. reactants/products: species id → coefficient.
   * sign case: 'flipHot' (+,+), 'flipCold' (−,−), 'always' (−,+), 'never' (+,−).
   */
  var REACTIONS = [
    {
      id: 'n2o4', label: 'N₂O₄ ⇌ 2NO₂', case: 'flipHot',
      reactants: { n2o4: 1 }, products: { no2: 2 },
      dH: 57.2, dS: 175.8,
      macro: 'Brown NO₂ colour deepens as products build up.',
      note: 'Same reaction as the Le Châtelier sim.',
    },
    {
      id: 'haber', label: 'N₂ + 3H₂ ⇌ 2NH₃', case: 'flipCold',
      reactants: { n2: 1, h2: 3 }, products: { nh3: 2 },
      dH: -92.2, dS: -198.7,
      macro: 'Fewer gas particles when the mix sits on the product side.',
      note: 'The Haber process. Also in the Le Châtelier sim.',
    },
    {
      id: 'ozone', label: '2O₃ ⇌ 3O₂', case: 'always',
      reactants: { o3: 2 }, products: { o2: 3 },
      dH: -285.4, dS: 137.8,
      macro: 'Ozone almost all turns into oxygen.',
      note: 'Ozone in the upper atmosphere only lasts because sunlight keeps making more.',
    },
    {
      id: 'ozoneRev', label: '3O₂ ⇌ 2O₃', case: 'never',
      reactants: { o2: 3 }, products: { o3: 2 },
      dH: 285.4, dS: -137.8,
      macro: 'Hardly any ozone forms.',
      note: 'The same pair as above, written the other way.',
    },
    {
      id: 'custom', label: 'A ⇌ B', case: 'custom',
      // 1 : 1 so particle count never contradicts a chosen ΔS sign.
      reactants: { a: 1 }, products: { b: 1 },
      // Sign toggles flip these; magnitudes put the crossover at 400 K (mid-slider).
      dH: 60, dS: 150, custom: true,
      macro: 'You pick the signs of ΔH and ΔS.',
      note: '',
    },
  ];

  var CASES = {
    flipHot:  { dH: '+', dS: '+', verdict: 'Goes forward only when hot' },
    flipCold: { dH: '−', dS: '−', verdict: 'Goes forward only when cold' },
    always:   { dH: '−', dS: '+', verdict: 'Goes forward at every temperature' },
    never:    { dH: '+', dS: '−', verdict: 'Never goes forward on its own' },
  };

  /**
   * Guide example cards (predict-then-reveal). dH / dS: '+' | '−' | null (no chip).
   * beat = Guide beat id where the card appears.
   */
  var EXAMPLES = [
    { id: 'dye', beat: 'spread', title: 'Food colouring in water', eq: '', dH: null, dS: null,
      context: 'Nothing pushes the colour around. The random motion of the particles spreads it out until it is even.' },
    { id: 'melt', beat: 'spread', title: 'Ice melting', eq: 'H₂O(s) → H₂O(l)', dH: '+', dS: '+',
      whyH: 'Heat flows into the ice from the air and the surface around it, loosening the solid.', whyS: 'Liquid particles move around more than solid ones.' },
    { id: 'ammonia', beat: 'spread', title: 'Making ammonia', eq: 'N₂(g) + 3H₂(g) → 2NH₃(g)', dH: '−', dS: '−',
      whyH: 'Forming the N–H bonds releases more energy than breaking the N≡N and H–H bonds costs.',
      whyS: 'Four gas molecules become two. Fewer particles means fewer ways to arrange them.' },
    { id: 'freeze', beat: 'spread', title: 'Water freezing', eq: 'H₂O(l) → H₂O(s)', dH: '−', dS: '−',
      whyH: 'Heat comes out as the particles lock into place.', whyS: 'Particles settle into a fixed pattern.' },
    { id: 'naoh', beat: 'heat', title: 'Sodium hydroxide dissolving', eq: 'NaOH(s) → Na⁺(aq) + OH⁻(aq)', dH: '−', dS: '−',
      whyH: 'The water warms up, so heat flows out of the dissolving NaOH into the water.',
      whyS: 'Na⁺ and OH⁻ attract water molecules strongly and bind them in tight shells, so things end up slightly less spread out.' },
    { id: 'hotpack', beat: 'spread', title: 'Hot pack', eq: 'CaCl₂(s) → Ca²⁺(aq) + 2Cl⁻(aq)', dH: '−', dS: '−',
      whyH: 'The pack warms up, so heat is coming out.',
      whyS: 'A surprise. The small, highly charged Ca²⁺ ion attracts water molecules strongly and binds them in a tight shell, so things end up slightly less spread out.' },
    { id: 'coldpack', beat: 'pulls', title: 'Cold pack', eq: 'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)', dH: '+', dS: '+',
      whyH: 'The pack gets cold, so heat is going in.', whyS: 'A neat crystal breaks up into ions that spread through the water.' },
    { id: 'soda', beat: 'around', title: 'Sealed soda bottle', eq: 'CO₂(g) ⇌ CO₂(aq)', dH: '−', dS: '−',
      whyH: 'Dissolving gas gives off a little heat.', whyS: 'Gas particles lose their freedom when they dissolve.',
      context: 'Sealed, gas dissolves as fast as it escapes. Take the cap off, or warm the bottle, and watch the balance move.' },
    { id: 'blood', beat: 'around', title: 'Carbon dioxide in your blood', eq: 'CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻', dH: null, dS: null,
      context: 'Your blood keeps its acidity steady because these reactions run both ways. Change how fast you breathe and watch the acidity follow.' },
    { id: 'ocean', beat: 'around', title: 'Carbon dioxide in the ocean', eq: 'CO₂(g) ⇌ CO₂(aq) · CO₂(aq) + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻', dH: null, dS: null,
      context: 'CO₂ from cars and factories dissolves into the sea, where it forms carbonic acid (H₂CO₃), which splits into H⁺ and HCO₃⁻. Raise the carbon output and watch both equilibria shift toward more H⁺: ocean acidification.' },
    { id: 'diamond', beat: 'limits', title: 'Diamond to graphite', eq: 'C(diamond) → C(graphite)', dH: '−', dS: '+',
      whyH: 'Graphite is slightly lower in energy.', whyS: 'Graphite\'s layers are a little less rigid than diamond.',
      context: 'ΔG says this should happen at any temperature. It takes millions of years. ΔG tells you which way, not how fast.' },
  ];

  var byId = {};
  REACTIONS.forEach(function (r) { byId[r.id] = r; });

  /** ΔG in kJ at temperature T (K), assuming ΔH and ΔS do not change with T. */
  function dG(rxn, T) { return rxn.dH - T * rxn.dS / 1000; }

  /** −TΔS term in kJ. */
  function minusTdS(rxn, T) { return -T * rxn.dS / 1000; }

  /** Temperature where ΔG = 0, or null when the signs agree (no crossover). */
  function crossover(rxn) {
    if (!rxn.dS || (rxn.dH > 0) !== (rxn.dS > 0)) return null;
    return rxn.dH * 1000 / rxn.dS;
  }

  /** Case for a reaction's current signs (used by custom A ⇌ B after toggles). */
  function caseOf(rxn) {
    if (rxn.dH > 0 && rxn.dS > 0) return 'flipHot';
    if (rxn.dH < 0 && rxn.dS < 0) return 'flipCold';
    if (rxn.dH < 0) return 'always';
    return 'never';
  }

  global.EqReactions = {
    ATOM: ATOM,
    SPECIES: SPECIES,
    REACTIONS: REACTIONS,
    CASES: CASES,
    EXAMPLES: EXAMPLES,
    T_RANGE: T_RANGE,
    get: function (id) { return byId[id]; },
    species: function (id) { return SPECIES[id]; },
    examplesFor: function (beat) { return EXAMPLES.filter(function (e) { return e.beat === beat; }); },
    dG: dG,
    minusTdS: minusTdS,
    crossover: crossover,
    caseOf: caseOf,
  };
})(window);
