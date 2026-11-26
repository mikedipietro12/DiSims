/* ICE Tables page: the content of each section's stage.
   Plan and sign-off: docs/designpowers/plans/2026-11-20-ice-tables.md
   Examples A to F are Hebden, Chemistry 12, pp. 63 to 69 (wording used with the teacher's OK, 2026-11-20).
   Hebden writes K_eq; these are concentrations, so the page writes K_c (teacher, 2026-11-20: Kc and Kp).
   Practice problems are new (Hebden's Q50 to Q60 were a reference only). Every answer was recomputed 2026-11-20.

   section: { problem, table, bulb, gauge, steps, you }
     problem: html of the problem card. table: an IceUI.table spec. steps: IceUI.steps lines.
     bulb: an IceUI.bulb spec (cap: its caption, if not the usual one); a step's `bulb` names the state to move to. gauge: an IceUI.gauge spec;
     a step's `gauge` sets it ({ q, label, shifted }).
     you: the Your turn problem: { problem, table, boxes, parts, steps } (steps = the answer, shown on request)
   Each calculation fills its own cell of the table on the same step (teacher, 2026-11-20: calculation → table,
   next calculation → table). Notes are the full explanation, hidden by default; `brief` is what shows instead.
   Calculations follow repo AGENTS.md: mole and concentration conversions are unit analysis (SolUI.ua);
   K and Q are substitution. */
(function (global) {
  'use strict';
  const ua = global.SolUI.ua, F = ua.frac, X = ua.x, CH = ua.chain;
  const EQ = (v, u) => ' <span class="ua-step">= ' + v + (u ? ' ' + u : '') + '</span>';
  const s = t => t.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>'); // NO2 → NO<sub>2</sub>
  const B = t => '[' + s(t) + ']';
  const sq = t => t + '<sup>2</sup>';
  const P = t => 'P<sub>' + s(t) + '</sub>';
  const Kc = 'K<sub>c</sub>', Kp = 'K<sub>p</sub>';
  const conc = (mol, sp, L) => F(mol + ' mol ' + s(sp), L + ' L');
  const ML = 'mol/L';

  // ---------- reactions used more than once ----------
  const NOX = { unit: ML, split: 2, species: ['2 NO(g)', 'O<sub>2</sub>(g)', '2 NO<sub>2</sub>(g)'] };
  const SOX = { unit: ML, split: 2, species: ['SO<sub>2</sub>(g)', 'NO<sub>2</sub>(g)', 'SO<sub>3</sub>(g)', 'NO(g)'] };
  const KNOX = F(sq(B('NO2')), sq(B('NO')) + B('O2'));
  const KSOX = F(B('SO3') + B('NO'), B('SO2') + B('NO2'));

  const SECTIONS = {
    // ---------- 1. What is an ICE table? (Hebden Example B's finished table, with every row named) ----------
    'ice-intro': {
      table: Object.assign({}, NOX, { preshown: true, alt: { I: 'START', C: '+Δ', E: '= EQUIL' },
        rows: { I: ['0', '0', '2.00'], C: ['+0.250', '+0.125', '−0.250'], E: ['0.250', '0.125', '1.75'] } }),
      bulb: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split: 2, volume: '2.00 L', initial: 'start',
        states: { start: { c: [0, 0, 32] }, eq: { c: [4, 2, 28], tally: [-1, 2] } } },
      steps: [
        { tag: 'I', hl: 'I', bulb: 'start', brief: 'Initial', note: '<strong>I: Initial.</strong> The concentrations at the start, before the reaction shifts' },
        { tag: 'C', hl: 'C', bulb: 'eq', brief: 'Change', note: '<strong>C: Change.</strong> How much each concentration goes up or down as the reaction shifts' },
        { tag: 'E', hl: 'E', brief: 'Equilibrium', note: '<strong>E: Equilibrium.</strong> The concentrations once the system has reached equilibrium' },
        { lhs: 'I + C', rhs: 'E', hl: 'col0', note: 'Every column follows this rule. For NO: 0 + 0.250 = 0.250', brief: 'NO: 0 + 0.250 = 0.250' },
        { whole: '<strong>Other names:</strong> Hebden labels the same rows START, +Δ and = EQUIL', alt: true,
          brief: '<strong>Other names:</strong> START, +Δ, = EQUIL. Also a RICE table.',
          note: 'Some textbooks add a row on top for the Reaction and call it a RICE table. They all work the same way' },
        { whole: 'The values put into the table MUST ALWAYS HAVE UNITS OF MOLES/L', brief: '<strong>Units:</strong> mol/L (atm for ' + Kp + ')', note: 'For K<sub>p</sub>, every value is a partial pressure in atm instead' }
      ]
    },

    // ---------- 2. Example A: nothing changes, so no table ----------
    'ex-a': {
      problem: '<strong>Example A:</strong> A 2.0 L bulb contains 6.00 mol of NO<sub>2</sub>(g), 3.0 mol of NO(g) and 0.20 mol of O<sub>2</sub>(g) at equilibrium. What is ' + Kc + ' for 2 NO(g) + O<sub>2</sub>(g) ⇌ 2 NO<sub>2</sub>(g)?',
      bulb: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split: 2, volume: '2.0 L', initial: 'eq',
        states: { eq: { c: [15, 1, 30] } },
        cap: 'Zoomed in, not to scale. The numbers of particles are in proportion to the concentrations. They stay the same, because the bulb is already at equilibrium.' },
      steps: [
        { whole: '<strong>Does time pass?</strong> No. The bulb is already at equilibrium, so there is nothing to keep track of. No ICE table.',
          brief: '<strong>Does time pass?</strong> No. No ICE table.' },
        { lhs: Kc, rhs: KNOX, note: 'First, determine the equilibrium expression' },
        { lhs: B('NO2'), rhs: conc('6.00', 'NO2', '2.0') + EQ('3.0', ML), note: 'Next, use the data to calculate the concentrations required' },
        { lhs: B('NO'), rhs: conc('3.0', 'NO', '2.0') + EQ('1.5', ML) },
        { lhs: B('O2'), rhs: conc('0.20', 'O2', '2.0') + EQ('0.10', ML) },
        { lhs: Kc, rhs: F(sq('(3.0)'), sq('(1.5)') + '(0.10)') + EQ('<strong>40</strong>'), note: 'Substitute these values into the ' + Kc + ' expression' },
        { whole: '<strong>Note:</strong> Ignore the UNITS of ' + Kc + ' since they depend on the particular equilibrium equation.',
          brief: '<strong>Note:</strong> no units on ' + Kc + '.' }
      ],
      you: {
        problem: '<strong>Your turn:</strong> A 4.0 L flask contains 1.60 mol of N<sub>2</sub>(g), 2.40 mol of H<sub>2</sub>(g) and 1.00 mol of NH<sub>3</sub>(g) at equilibrium. What is ' + Kc + ' for N<sub>2</sub>(g) + 3 H<sub>2</sub>(g) ⇌ 2 NH<sub>3</sub>(g)?',
        hint: 'No ICE table for this one: nothing changes.',
        steps: [
          { lhs: Kc, rhs: F(sq(B('NH3')), B('N2') + B('H2') + '<sup>3</sup>'), note: 'The coefficient 3 becomes a power' },
          { lhs: B('N2'), rhs: conc('1.60', 'N2', '4.0') + EQ('0.400', ML) },
          { lhs: B('H2'), rhs: conc('2.40', 'H2', '4.0') + EQ('0.600', ML) },
          { lhs: B('NH3'), rhs: conc('1.00', 'NH3', '4.0') + EQ('0.250', ML) },
          { lhs: Kc, rhs: F(sq('(0.250)'), '(0.400)(0.600)<sup>3</sup>') + EQ('<strong>0.723</strong>') }
        ]
      }
    },

    // ---------- 3. Example B: fill in what we know, then use the coefficients ----------
    'ex-b': {
      problem: '<strong>Example B:</strong> 4.00 mol of NO<sub>2</sub>(g) is introduced into a 2.00 L bulb. After a while equilibrium is attained according to the equation 2 NO(g) + O<sub>2</sub>(g) ⇌ 2 NO<sub>2</sub>(g). At equilibrium, 0.500 mol of NO(g) is found. What is the ' + Kc + ' value?',
      table: Object.assign({}, NOX, { rows: { I: ['0', '0', '2.00'], C: ['+0.250', '+0.125', '−0.250'], E: ['0.250', '0.125', '1.75'] } }),
      bulb: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split: 2, volume: '2.00 L', initial: 'start',
        states: { start: { c: [0, 0, 32] }, eq: { c: [4, 2, 28], tally: [-1, 2] } } },
      steps: [
        { whole: '<strong>Preliminary analysis:</strong> there is a distinct sense of time passing. NO<sub>2</sub> was put in a bulb, then time passed until equilibrium occurred. This means we have to tell apart the concentrations at the START and the concentrations at EQUILIBRIUM.',
          brief: '<strong>Does time pass?</strong> Yes. ICE table.' },
        { lhs: Kc, rhs: KNOX, note: 'First, determine the equilibrium expression' },
        { lhs: B('NO2') + '<sub>I</sub>', rhs: conc('4.00', 'NO2', '2.00') + EQ('2.00', ML), show: ['I2'], note: 'Next, calculate the concentrations which can be found straight from the data. This one is at the start, so it goes on the I row' },
        { tag: 'I', show: ['I0', 'I1'], note: 'We assume [NO] = [O<sub>2</sub>] = 0 at the start, since they were not put in the bulb', brief: '[NO] = [O<sub>2</sub>] = 0' },
        { lhs: B('NO') + '<sub>E</sub>', rhs: conc('0.500', 'NO', '2.00') + EQ('0.250', ML), show: ['E0'], note: 'The one equilibrium value we know, so it goes on the E row' },
        { tag: 'C', show: ['C0'], bulb: 'eq', note: 'Since I + C = E, the change in [NO] must be +0.250. In the bulb, every reaction event uses 2 NO<sub>2</sub> and makes 2 NO and 1 O<sub>2</sub>', brief: 'NO: 0.250 − 0 = +0.250' },
        { tag: 'C', show: ['C1'], note: 'O<sub>2</sub>’s coefficient (1) is half of NO’s (2), so the change in [O<sub>2</sub>] is half: ½ × 0.250 = +0.125', brief: 'O<sub>2</sub>: ½ × 0.250 = +0.125' },
        { tag: 'C', show: ['C2'], note: 'NO<sub>2</sub>’s coefficient (2) equals NO’s (2), so its change is the same size. It is NEGATIVE: the reaction used up NO<sub>2</sub> to make NO and O<sub>2</sub>', brief: 'NO<sub>2</sub>: same size as NO, but −0.250' },
        { tag: 'E', show: ['E1', 'E2'], note: 'I + C = E down each column' },
        { lhs: Kc, rhs: F(sq('(1.75)'), sq('(0.250)') + '(0.125)') + EQ('<strong>392</strong>'), hl: 'E', note: 'Finally, substitute the E row into the ' + Kc + ' expression' },
        { whole: '<strong>Notice:</strong> the C values on one side of the equation are all POSITIVE, and on the other side they are all NEGATIVE. Because the C row represents a shift, this is always true.',
          brief: '<strong>Notice:</strong> C row: one side +, the other side −.' }
      ],
      you: {
        problem: '<strong>Your turn:</strong> 4.00 mol of NOBr(g) is placed in a 2.00 L flask. Equilibrium is reached according to the equation 2 NOBr(g) ⇌ 2 NO(g) + Br<sub>2</sub>(g). At equilibrium, 0.500 mol of Br<sub>2</sub>(g) is found. What is the ' + Kc + ' value?',
        hint: 'This one starts on the reactant side, so the signs are the other way round from Example B.',
        table: { unit: ML, split: 1, species: ['2 NOBr(g)', '2 NO(g)', 'Br<sub>2</sub>(g)'],
          rows: { I: ['2.00', '0', '0'], C: ['−0.500', '+0.500', '+0.250'], E: ['1.50', '0.500', '0.250'] } },
        boxes: [{ label: Kc, ans: '0.0278' }],
        steps: [
          { lhs: Kc, rhs: F(sq(B('NO')) + B('Br2'), sq(B('NOBr'))) },
          { lhs: B('NOBr') + '<sub>I</sub>', rhs: conc('4.00', 'NOBr', '2.00') + EQ('2.00', ML), show: ['I0'], note: 'At the start, so it goes on the I row' },
          { tag: 'I', show: ['I1', 'I2'], note: 'Only NOBr was put in the flask', brief: '[NO] = [Br<sub>2</sub>] = 0' },
          { lhs: B('Br2') + '<sub>E</sub>', rhs: conc('0.500', 'Br2', '2.00') + EQ('0.250', ML), show: ['E2'], note: 'The one equilibrium value we know, so it goes on the E row' },
          { tag: 'C', show: ['C2'], note: 'I + C = E, so the change in [Br<sub>2</sub>] is +0.250', brief: 'Br<sub>2</sub>: 0.250 − 0 = +0.250' },
          { tag: 'C', show: ['C0', 'C1'], note: 'NO’s coefficient (2) is twice Br<sub>2</sub>’s (1), so it goes up by 0.500. NOBr is used up, so it goes down by 0.500', brief: 'NO: 2 × 0.250 = +0.500. NOBr: −0.500' },
          { tag: 'E', show: ['E0', 'E1'], note: 'I + C = E down each column' },
          { lhs: Kc, rhs: F(sq('(0.500)') + '(0.250)', sq('(1.50)')) + EQ('<strong>0.0278</strong>'), hl: 'E' }
        ]
      }
    },

    // ---------- 4. Example C: the unknown is in the I row ----------
    'ex-c': {
      problem: '<strong>Example C:</strong> A certain amount of NO<sub>2</sub>(g) was introduced into a 5.00 L bulb. When equilibrium was attained according to the equation 2 NO(g) + O<sub>2</sub>(g) ⇌ 2 NO<sub>2</sub>(g), the concentration of NO(g) was 0.800 M. If ' + Kc + ' has a value of 24.0, how many moles of NO<sub>2</sub> were originally put into the bulb?',
      table: Object.assign({}, NOX, { rows: { I: ['0', '0', 'X'], C: ['+0.800', '+0.400', '−0.800'], E: ['0.800', '0.400', 'X − 0.800'] } }),
      bulb: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split: 2, volume: '5.00 L', initial: 'start',
        states: { start: { c: [0, 0, 33] }, eq: { c: [8, 4, 25], tally: [-1, 4] } } },
      steps: [
        { lhs: Kc, rhs: KNOX, note: 'First, determine the equilibrium expression' },
        { tag: 'I', show: ['I'], note: '[NO<sub>2</sub>] at the START is unknown, so we use a variable, X. [NO] = [O<sub>2</sub>] = 0 can be assumed from the problem statement', brief: '[NO<sub>2</sub>] = X. [NO] = [O<sub>2</sub>] = 0' },
        { tag: 'E', show: ['E0'], note: 'Given: [NO] = 0.800 M at equilibrium', brief: 'Given: [NO] = 0.800 M' },
        { tag: 'C', show: ['C0'], bulb: 'eq', note: 'I + C = E, so the change in [NO] is +0.800', brief: 'NO: 0.800 − 0 = +0.800' },
        { tag: 'C', show: ['C1', 'C2'], note: 'The C row must be in a 2 : 1 : 2 ratio. Some of the starting NO<sub>2</sub> reacts, so the change in [NO<sub>2</sub>] is a decrease', brief: '2 : 1 : 2, so O<sub>2</sub>: +0.400 and NO<sub>2</sub>: −0.800' },
        { tag: 'E', show: ['E1', 'E2'], note: 'I + C = E down each column' },
        { lhs: '24.0', rhs: F(sq('(X − 0.800)'), sq('(0.800)') + '(0.400)'), hl: 'E', note: 'Substitute the E row into the ' + Kc + ' expression' },
        { lhs: sq('(X − 0.800)'), rhs: '(24.0)(0.800)<sup>2</sup>(0.400) = 6.144', note: 'Multiply both sides by the bottom of the fraction' },
        { lhs: 'X − 0.800', rhs: '2.479', note: 'No quadratic formula needed: take the square root of both sides' },
        { lhs: 'X', rhs: '3.279 mol/L = ' + B('NO2') + '<sub>I</sub>' },
        { lhs: 'Moles of NO<sub>2</sub>', rhs: CH(F('3.279 mol NO<sub>2</sub>', '1 ' + X('L')), '5.00 ' + X('L')) + EQ('<strong>16.4 mol NO<sub>2</sub></strong>'), note: 'The question asks for moles, so we multiply by the volume of the bulb. Litres cancel' }
      ],
      you: {
        problem: '<strong>Your turn:</strong> A certain amount of NO(g) is placed in a 2.00 L flask. Equilibrium is reached according to the equation N<sub>2</sub>(g) + O<sub>2</sub>(g) ⇌ 2 NO(g), and 0.300 mol of N<sub>2</sub>(g) is found. If ' + Kc + ' = 0.0400, how many moles of NO were originally placed in the flask?',
        table: { unit: ML, split: 2, species: ['N<sub>2</sub>(g)', 'O<sub>2</sub>(g)', '2 NO(g)'],
          rows: { I: ['0', '0', 'X'], C: ['+0.150', '+0.150', '−0.300'], E: ['0.150', '0.150', 'X − 0.300'] } },
        boxes: [{ label: 'X', unit: ML, ans: '0.330' }, { label: 'Moles of NO', unit: 'mol', ans: '0.660' }],
        steps: [
          { lhs: Kc, rhs: F(sq(B('NO')), B('N2') + B('O2')) },
          { tag: 'I', show: ['I'], note: 'Only NO was put in the flask. Its starting concentration is unknown, so we use X', brief: '[NO] = X. [N<sub>2</sub>] = [O<sub>2</sub>] = 0' },
          { lhs: B('N2') + '<sub>E</sub>', rhs: conc('0.300', 'N2', '2.00') + EQ('0.150', ML), show: ['E0'], note: 'The one equilibrium value we know, so it goes on the E row' },
          { tag: 'C', show: ['C0'], note: 'I + C = E, so the change in [N<sub>2</sub>] is +0.150', brief: 'N<sub>2</sub>: 0.150 − 0 = +0.150' },
          { tag: 'C', show: ['C1', 'C2'], note: 'O<sub>2</sub> changes by the same amount as N<sub>2</sub> (1 : 1). NO’s coefficient is 2, so it goes down by 2 × 0.150 = 0.300', brief: 'O<sub>2</sub>: +0.150. NO: 2 × 0.150 = −0.300' },
          { tag: 'E', show: ['E1', 'E2'], note: 'I + C = E down each column' },
          { lhs: '0.0400', rhs: F(sq('(X − 0.300)'), '(0.150)(0.150)'), hl: 'E' },
          { lhs: '0.200', rhs: F('X − 0.300', '0.150'), note: 'Take the square root of both sides' },
          { lhs: 'X − 0.300', rhs: '0.0300', note: 'Multiply both sides by 0.150' },
          { lhs: 'X', rhs: '0.330 mol/L' },
          { lhs: 'Moles of NO', rhs: CH(F('0.330 mol NO', '1 ' + X('L')), '2.00 ' + X('L')) + EQ('<strong>0.660 mol NO</strong>'), note: 'Litres cancel' }
        ]
      }
    },

    // ---------- 5. Example D: a decision, not a number ----------
    'ex-d': {
      problem: '<strong>Example D:</strong> ' + Kc + ' = 49 for 2 NO(g) + O<sub>2</sub>(g) ⇌ 2 NO<sub>2</sub>(g). If 2.0 mol of NO(g), 0.20 mol of O<sub>2</sub>(g) and 0.40 mol of NO<sub>2</sub>(g) are put into a 2.0 L bulb, which way will the reaction shift in order to reach equilibrium?',
      bulb: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split: 2, volume: '2.0 L', initial: 'start',
        states: { start: { c: [20, 2, 4] }, eq: { c: [16, 0, 8], tally: [1, 2] } } },
      gauge: { k: 49, kLabel: Kc, lo: -2, hi: 3 },
      steps: [
        { whole: '<strong>Preliminary analysis:</strong> this question is NOT asking us to find a numerical value; it is asking us for a DECISION. Decisions are often based on comparing two numbers: “Is A bigger than, less than, or equal to B?”',
          brief: '<strong>A decision, not a number:</strong> compare Q with ' + Kc + '.' },
        { lhs: 'Q', rhs: F(sq(B('NO2')), sq(B('NO')) + B('O2')), note: 'Q, the reaction quotient, has the same expression as ' + Kc + '. We fill it in with the starting concentrations' },
        { lhs: B('NO') + '<sub>I</sub>', rhs: conc('2.0', 'NO', '2.0') + EQ('1.0', ML), note: 'Calculate the starting concentrations' },
        { lhs: B('O2') + '<sub>I</sub>', rhs: conc('0.20', 'O2', '2.0') + EQ('0.10', ML) },
        { lhs: B('NO2') + '<sub>I</sub>', rhs: conc('0.40', 'NO2', '2.0') + EQ('0.20', ML) },
        { lhs: 'Q', rhs: F(sq('(0.20)'), sq('(1.0)') + '(0.10)') + EQ('0.40'), gauge: { q: 0.40, label: '0.40' }, note: 'Calculate the reaction quotient' },
        { lhs: '0.40', eq: '&lt;', rhs: '49', note: 'Q is less than ' + Kc + ', so [PRODUCTS] ÷ [REACTANTS] is TOO SMALL' },
        { whole: '<strong>The reaction must shift to the product side</strong>', bulb: 'eq', gauge: { q: 49, label: '49', shifted: true },
          note: 'This increases the value of Q up to the required value for ' + Kc }
      ],
      you: {
        problem: '<strong>Your turn:</strong> ' + Kc + ' = 0.20 for N<sub>2</sub>O<sub>4</sub>(g) ⇌ 2 NO<sub>2</sub>(g) at a certain temperature. Which way will the reaction shift, if at all, for each mixture?',
        parts: [
          { label: 'a) 0.40 mol of N<sub>2</sub>O<sub>4</sub> and 0.20 mol of NO<sub>2</sub> in a 2.0 L flask', q: '0.050', shift: 'products' },
          { label: 'b) 0.10 mol of N<sub>2</sub>O<sub>4</sub> and 0.60 mol of NO<sub>2</sub> in a 2.0 L flask', q: '1.8', shift: 'reactants' },
          { label: 'c) 0.50 mol of N<sub>2</sub>O<sub>4</sub> and 0.50 mol of NO<sub>2</sub> in a 2.5 L flask', q: '0.20', shift: 'none' }
        ],
        steps: [
          { lhs: 'Q', rhs: F(sq(B('NO2')), B('N2O4')) },
          { lhs: 'a) ' + B('N2O4'), rhs: conc('0.40', 'N2O4', '2.0') + EQ('0.20', ML) + ', &nbsp;' + B('NO2') + ' = ' + conc('0.20', 'NO2', '2.0') + EQ('0.10', ML) },
          { lhs: 'a) Q', rhs: F(sq('(0.10)'), '(0.20)') + EQ('0.050'), note: '0.050 &lt; 0.20, so the reaction shifts to the <strong>products</strong>' },
          { lhs: 'b) ' + B('N2O4'), rhs: conc('0.10', 'N2O4', '2.0') + EQ('0.050', ML) + ', &nbsp;' + B('NO2') + ' = ' + conc('0.60', 'NO2', '2.0') + EQ('0.30', ML) },
          { lhs: 'b) Q', rhs: F(sq('(0.30)'), '(0.050)') + EQ('1.8'), note: '1.8 &gt; 0.20, so the reaction shifts to the <strong>reactants</strong>' },
          { lhs: 'c) ' + B('N2O4'), rhs: conc('0.50', 'N2O4', '2.5') + EQ('0.20', ML) + ', &nbsp;' + B('NO2') + ' = ' + conc('0.50', 'NO2', '2.5') + EQ('0.20', ML) },
          { lhs: 'c) Q', rhs: F(sq('(0.20)'), '(0.20)') + EQ('0.20'), note: 'Q = ' + Kc + ', so the mixture is <strong>already at equilibrium</strong>. No shift' }
        ]
      }
    },

    // ---------- 6. Example E: x on the C row ----------
    'ex-e': {
      problem: '<strong>Example E:</strong> ' + Kc + ' = 3.5 for SO<sub>2</sub>(g) + NO<sub>2</sub>(g) ⇌ SO<sub>3</sub>(g) + NO(g). If 4.0 mol of SO<sub>2</sub>(g) and 4.0 mol of NO<sub>2</sub>(g) are placed in a 5.0 L bulb and allowed to come to equilibrium, what concentration of all species will exist at equilibrium?',
      table: Object.assign({}, SOX, { rows: { I: ['0.80', '0.80', '0', '0'], C: ['−x', '−x', '+x', '+x'], E: ['0.80 − x', '0.80 − x', 'x', 'x'] } }),
      bulb: { species: ['so2', 'no2', 'so3', 'no'], coef: [1, 1, 1, 1], split: 2, volume: '5.0 L', initial: 'start',
        states: { start: { c: [20, 20, 0, 0] }, eq: { c: [7, 7, 13, 13], tally: [1, 13] } } },
      steps: [
        { lhs: Kc, rhs: KSOX, note: 'First, write out the equilibrium expression' },
        { lhs: B('SO2') + '<sub>I</sub>', rhs: conc('4.0', 'SO2', '5.0') + EQ('0.80', ML), show: ['I0'], note: 'Starting concentrations go on the I row' },
        { lhs: B('NO2') + '<sub>I</sub>', rhs: conc('4.0', 'NO2', '5.0') + EQ('0.80', ML), show: ['I1'] },
        { tag: 'I', show: ['I2', 'I3'], note: 'SO<sub>3</sub> and NO were not put in the bulb, so they start at 0', brief: '[SO<sub>3</sub>] = [NO] = 0' },
        { tag: 'C', show: ['C'], bulb: 'eq', brief: 'Let x be the change. 1 : 1 : 1 : 1', note: 'There is nothing else to put in the table except the unknown. We let x be the CHANGE IN CONCENTRATION. The coefficients are 1 : 1 : 1 : 1, so every change is x. The products started at zero, so they must GAIN; the reactants must LOSE' },
        { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
        { lhs: '3.5', rhs: F(sq('x'), sq('(0.80 − x)')), hl: 'E', note: 'Substitute the E row into the ' + Kc + ' expression' },
        { lhs: '1.87', rhs: F('x', '0.80 − x'), note: 'This does NOT need the quadratic formula: take the square root of both sides' },
        { lhs: '1.87(0.80 − x)', rhs: 'x', note: 'Multiply both sides by (0.80 − x)' },
        { lhs: '1.496', rhs: '2.87x', note: 'Expand, then gather the x terms on one side' },
        { lhs: 'x', rhs: '0.52' },
        { lhs: B('SO3') + ' = ' + B('NO'), rhs: 'x = <strong>0.52 M</strong>', note: 'Read each answer from the E row' },
        { lhs: B('SO2') + ' = ' + B('NO2'), rhs: '0.80 − x = <strong>0.28 M</strong>' }
      ],
      you: {
        problem: '<strong>Your turn:</strong> ' + Kc + ' = 64 for H<sub>2</sub>(g) + Br<sub>2</sub>(g) ⇌ 2 HBr(g) at a certain temperature. If 0.600 mol of H<sub>2</sub>(g) and 0.600 mol of Br<sub>2</sub>(g) are placed in a 2.00 L flask and allowed to come to equilibrium, what concentration of each substance will exist at equilibrium?',
        hint: 'One new step from Example E: HBr’s coefficient is 2.',
        table: { unit: ML, split: 2, species: ['H<sub>2</sub>(g)', 'Br<sub>2</sub>(g)', '2 HBr(g)'],
          rows: { I: ['0.300', '0.300', '0'], C: ['−x', '−x', '+2x'], E: ['0.300 − x', '0.300 − x', '2x'] } },
        boxes: [{ label: 'x', unit: ML, ans: '0.240' }, { label: B('HBr'), unit: ML, ans: '0.480' }, { label: B('H2') + ' = ' + B('Br2'), unit: ML, ans: '0.060' }],
        steps: [
          { lhs: Kc, rhs: F(sq(B('HBr')), B('H2') + B('Br2')) },
          { lhs: B('H2') + '<sub>I</sub>', rhs: conc('0.600', 'H2', '2.00') + EQ('0.300', ML), show: ['I0'], note: 'Starting concentrations go on the I row' },
          { lhs: B('Br2') + '<sub>I</sub>', rhs: conc('0.600', 'Br2', '2.00') + EQ('0.300', ML), show: ['I1'] },
          { tag: 'I', show: ['I2'], note: 'No HBr was put in the flask', brief: '[HBr] = 0' },
          { tag: 'C', show: ['C'], brief: 'Let x be the change. HBr: +2x', note: 'Let x be the change in [H<sub>2</sub>]. Br<sub>2</sub> also goes down by x. HBr’s coefficient is 2, so it goes up by 2x' },
          { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
          { lhs: '64', rhs: F(sq('(2x)'), sq('(0.300 − x)')), hl: 'E' },
          { lhs: '8.0', rhs: F('2x', '0.300 − x'), note: 'Take the square root of both sides' },
          { lhs: '8.0(0.300 − x)', rhs: '2x', note: 'Multiply both sides by (0.300 − x)' },
          { lhs: '2.40', rhs: '10.0x', note: 'Expand, then gather the x terms on one side' },
          { lhs: 'x', rhs: '0.240' },
          { lhs: B('HBr'), rhs: '2x = <strong>0.480 M</strong>' },
          { lhs: B('H2') + ' = ' + B('Br2'), rhs: '0.300 − x = <strong>0.060 M</strong>' }
        ]
      }
    },

    // ---------- 7. Example F: adding to a system at equilibrium ----------
    'ex-f': {
      problem: '<strong>Example F:</strong> A 1.0 L reaction vessel contained 1.0 mol of SO<sub>2</sub>, 4.0 mol of NO<sub>2</sub>, 4.0 mol of SO<sub>3</sub> and 4.0 mol of NO at equilibrium according to SO<sub>2</sub>(g) + NO<sub>2</sub>(g) ⇌ SO<sub>3</sub>(g) + NO(g). If 3.0 mol of SO<sub>2</sub> is added to the mixture, what will be the new concentration of NO when equilibrium is re-attained?',
      table: Object.assign({}, SOX, { rows: { I: ['1.0 + 3.0', '4.0', '4.0', '4.0'], C: ['−x', '−x', '+x', '+x'], E: ['4.0 − x', '4.0 − x', '4.0 + x', '4.0 + x'] } }),
      bulb: { species: ['so2', 'no2', 'so3', 'no'], coef: [1, 1, 1, 1], split: 2, volume: '1.0 L', initial: 'first',
        states: { first: { c: [3, 12, 12, 12] }, added: { c: [12, 12, 12, 12] }, eq: { c: [8, 8, 16, 16], tally: [1, 4] } } },
      steps: [
        { whole: '<strong>Preliminary analysis:</strong> we are NOT given the value for ' + Kc + '. We ARE told the amount of each gas previously present at equilibrium. This information allows us to calculate a value for ' + Kc + '.',
          brief: '<strong>' + Kc + ' is not given:</strong> find it from the first equilibrium.' },
        { lhs: Kc, rhs: KSOX + ' = ' + F('(4.0)(4.0)', '(1.0)(4.0)') + EQ('4.0'), note: 'First, find the value of ' + Kc + ' from the first equilibrium. The volume is 1.0 L, so each concentration has the same value as its moles' },
        { whole: 'There is no mention of the temperature changing, so ' + Kc + ' stays 4.0.' },
        { tag: 'I', show: ['I'], bulb: 'added', brief: 'Add 3.0 to [SO<sub>2</sub>]. Additions go on the I row', note: '<strong>IMPORTANT:</strong> any ADDITION (or REMOVAL) is shown on the I row. A system at equilibrium will not shift by itself; something has to cause the shift' },
        { tag: 'C', show: ['C'], bulb: 'eq', brief: 'Let x be the change', note: 'The system shifts to use up some of the added SO<sub>2</sub>, so the change in [SO<sub>2</sub>] is −x' },
        { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
        { lhs: '4.0', rhs: F(sq('(4.0 + x)'), sq('(4.0 − x)')), hl: 'E', note: 'Substitute the E row' },
        { lhs: '2.0', rhs: F('4.0 + x', '4.0 − x'), note: 'Take the square root of both sides' },
        { lhs: '2.0(4.0 − x)', rhs: '4.0 + x', note: 'Multiply both sides by (4.0 − x)' },
        { lhs: '4.0', rhs: '3.0x', note: 'Expand, then gather the x terms on one side' },
        { lhs: 'x', rhs: '1.33' },
        { lhs: B('NO'), rhs: '4.0 + x = <strong>5.3 M</strong>' }
      ],
      you: {
        problem: '<strong>Your turn:</strong> A 2.0 L reaction vessel contains 0.40 mol of CO, 1.60 mol of NO<sub>2</sub>, 2.40 mol of CO<sub>2</sub> and 2.40 mol of NO at equilibrium according to CO(g) + NO<sub>2</sub>(g) ⇌ CO<sub>2</sub>(g) + NO(g). If 1.20 mol of CO is added to the mixture, what will be the new concentration of NO when equilibrium is re-attained?',
        hint: 'Find ' + Kc + ' first, from the equilibrium before the CO is added.',
        table: { unit: ML, split: 2, species: ['CO(g)', 'NO<sub>2</sub>(g)', 'CO<sub>2</sub>(g)', 'NO(g)'],
          rows: { I: ['0.20 + 0.60', '0.80', '1.20', '1.20'], C: ['−x', '−x', '+x', '+x'], E: ['0.80 − x', '0.80 − x', '1.20 + x', '1.20 + x'] } },
        boxes: [{ label: Kc, ans: '9.0' }, { label: 'x', unit: ML, ans: '0.30' }, { label: B('NO'), unit: ML, ans: '1.50' }],
        steps: [
          { lhs: Kc, rhs: F(B('CO2') + B('NO'), B('CO') + B('NO2')) },
          { lhs: B('CO'), rhs: conc('0.40', 'CO', '2.0') + EQ('0.20', ML), note: 'The first equilibrium, as concentrations' },
          { lhs: B('NO2'), rhs: conc('1.60', 'NO2', '2.0') + EQ('0.80', ML), show: ['I1'], note: 'Nothing is added to NO<sub>2</sub>, so this also goes on the I row' },
          { lhs: B('CO2') + ' = ' + B('NO'), rhs: F('2.40 mol', '2.0 L') + EQ('1.20', ML), show: ['I2', 'I3'] },
          { lhs: Kc, rhs: F('(1.20)(1.20)', '(0.20)(0.80)') + EQ('9.0'), note: 'First, find ' + Kc + ' from the first equilibrium' },
          { lhs: 'Added CO', rhs: conc('1.20', 'CO', '2.0') + EQ('0.60', ML), show: ['I0'], note: 'The CO we add, as a concentration. The addition goes on the I row', brief: 'I row: 0.20 + 0.60' },
          { tag: 'C', show: ['C'], brief: 'Let x be the change', note: 'The system shifts to use up some of the added CO, so the change in [CO] is −x' },
          { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
          { lhs: '9.0', rhs: F(sq('(1.20 + x)'), sq('(0.80 − x)')), hl: 'E' },
          { lhs: '3.0', rhs: F('1.20 + x', '0.80 − x'), note: 'Take the square root of both sides' },
          { lhs: '3.0(0.80 − x)', rhs: '1.20 + x', note: 'Multiply both sides by (0.80 − x)' },
          { lhs: '1.20', rhs: '4.0x', note: 'Expand, then gather the x terms on one side' },
          { lhs: 'x', rhs: '0.30' },
          { lhs: B('NO'), rhs: '1.20 + x = <strong>1.50 M</strong>' }
        ]
      }
    },

    // ---------- 8. Kp: the same table, with partial pressures (AP; not in Hebden) ----------
    'ex-kp': {
      problem: '<strong>Example G:</strong> N<sub>2</sub>O<sub>4</sub>(g) is placed in an empty flask at a pressure of 1.00 atm. At equilibrium, the total pressure in the flask is 1.40 atm. What is ' + Kp + ' for N<sub>2</sub>O<sub>4</sub>(g) ⇌ 2 NO<sub>2</sub>(g)?',
      table: { unit: 'atm', split: 1, species: ['N<sub>2</sub>O<sub>4</sub>(g)', '2 NO<sub>2</sub>(g)'],
        rows: { I: ['1.00', '0'], C: ['−x', '+2x'], E: ['1.00 − x', '2x'] } },
      bulb: { species: ['n2o4', 'no2'], coef: [1, 2], split: 1, pressure: 0.05, initial: 'start',
        states: { start: { c: [20, 0] }, eq: { c: [12, 16], tally: [1, 8] } },
        cap: 'Zoomed in, not to scale. The flask is sealed and the temperature stays the same, so each particle adds the same pressure: 0.05 atm.' },
      steps: [
        { lhs: Kp, rhs: F(sq('(' + P('NO2') + ')'), P('N2O4')), note: Kp + ' uses partial pressures in place of concentrations' },
        { tag: 'I', show: ['I'], note: 'N<sub>2</sub>O<sub>4</sub> starts at 1.00 atm. There is no NO<sub>2</sub> yet', brief: P('N2O4') + ' = 1.00 atm. ' + P('NO2') + ' = 0' },
        { tag: 'C', show: ['C'], bulb: 'eq', brief: 'Let x be the change. NO<sub>2</sub>: +2x', note: 'Let x be the drop in the pressure of N<sub>2</sub>O<sub>4</sub>. NO<sub>2</sub>’s coefficient is 2, so its pressure goes up by 2x' },
        { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
        { lhs: 'P<sub>total</sub>', rhs: '(1.00 − x) + 2x = 1.00 + x', hl: 'E', note: 'The total pressure is the sum of the partial pressures in the E row' },
        { lhs: '1.40', rhs: '1.00 + x', note: 'The problem gives the total pressure at equilibrium' },
        { lhs: 'x', rhs: '0.40 atm' },
        { lhs: P('N2O4'), rhs: '1.00 − 0.40 = 0.60 atm', note: 'Read the E row with x = 0.40' },
        { lhs: P('NO2'), rhs: '2(0.40) = 0.80 atm' },
        { lhs: Kp, rhs: F(sq('(0.80)'), '0.60') + EQ('<strong>1.1</strong>') }
      ],
      you: {
        problem: '<strong>Your turn:</strong> COCl<sub>2</sub>(g) is placed in an empty flask at a pressure of 2.00 atm. At equilibrium, the total pressure in the flask is 2.50 atm. What is ' + Kp + ' for COCl<sub>2</sub>(g) ⇌ CO(g) + Cl<sub>2</sub>(g)?',
        table: { unit: 'atm', split: 1, species: ['COCl<sub>2</sub>(g)', 'CO(g)', 'Cl<sub>2</sub>(g)'],
          rows: { I: ['2.00', '0', '0'], C: ['−x', '+x', '+x'], E: ['2.00 − x', 'x', 'x'] } },
        boxes: [{ label: 'x', unit: 'atm', ans: '0.50' }, { label: Kp, ans: '0.167', tol: 0.03 }],
        steps: [
          { lhs: Kp, rhs: F('(' + P('CO') + ')(' + P('Cl2') + ')', P('COCl2')) },
          { tag: 'I', show: ['I'], note: 'Only COCl<sub>2</sub> is in the flask at the start', brief: P('COCl2') + ' = 2.00 atm. ' + P('CO') + ' = ' + P('Cl2') + ' = 0' },
          { tag: 'C', show: ['C'], brief: 'Let x be the change. 1 : 1 : 1', note: 'Let x be the drop in the pressure of COCl<sub>2</sub>. CO and Cl<sub>2</sub> each go up by x (1 : 1 : 1)' },
          { tag: 'E', show: ['E'], note: 'I + C = E down each column' },
          { lhs: 'P<sub>total</sub>', rhs: '(2.00 − x) + x + x = 2.00 + x', hl: 'E', note: 'Add up the E row' },
          { lhs: '2.50', rhs: '2.00 + x' },
          { lhs: 'x', rhs: '0.50 atm' },
          { lhs: P('COCl2'), rhs: '2.00 − 0.50 = 1.50 atm' },
          { lhs: P('CO') + ' = ' + P('Cl2'), rhs: '0.50 atm' },
          { lhs: Kp, rhs: F('(0.50)(0.50)', '1.50') + EQ('<strong>0.17</strong>') }
        ]
      }
    }
  };

  global.IceData = { SECTIONS };
})(window);
