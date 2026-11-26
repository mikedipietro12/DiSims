/* Solubility Guide: section presets for the sticky stage, worked steps, prediction chips,
   scroll tracking and presentation view. Copy is from docs/designpowers/plans/2026-11-17-guide-sections.md
   (approved). Numbers come from salts.js through the engine or SolUI.num. */
(function () {
  'use strict';
  const D = SolData, E = SolEngine, U = SolUI, Pic = SolPictures;
  const $ = id => document.getElementById(id);
  const n = (x, o) => U.num(x, o).html;
  const sp = (x, o) => U.num(x, o).speech;
  const FW = 900, FH = 530;                                   // logical stage frame
  const S = D.SALTS;
  const sAgCl = D.molarSolubility(S.AgCl), sPbI2 = D.molarSolubility(S.PbI2);
  const sci = { sci: 'always' }, mol = { sci: 'always', unit: 'mol/L' };
  const ion = { Ag: 'Ag<sup>+</sup>', Cl: 'Cl<sup>−</sup>', Pb: 'Pb<sup>2+</sup>', I: 'I<sup>−</sup>', Mg: 'Mg<sup>2+</sup>', OH: 'OH<sup>−</sup>', CrO4: 'CrO<sub>4</sub><sup>2−</sup>' };
  const KSP = 'K<sub>sp</sub>';
  const gmol = ' <span class="num-unit">g/mol</span>';
  // unit analysis for every calculation that isn't K or a substitution into an expression (AGENTS.md)
  const F = U.ua.frac, X = U.ua.x, CH = U.ua.chain;
  const unit = u => ' <span class="num-unit">' + u + '</span>';
  const MgOH2f = 'Mg(OH)<sub>2</sub>';
  const EQ = (v, u) => ' <span class="ua-step">= ' + v + unit(u) + '</span>'; // the answer stays on the line with its = sign

  // ---------- worked steps (lhs = rhs, a reason under each line, marks light up the picture) ----------
  // ICE tables for the steps that start with one (key = steps key). The solid's column gets a dash.
  const DASH = '<span class="ice-dash">—</span>';
  const ICE = {
    agcl: { unit: 'mol/L', species: [{ html: 'AgCl(s)', solid: true }, { html: 'Ag<sup>+</sup>', cls: 'qk-cat' }, { html: 'Cl<sup>−</sup>', cls: 'qk-an' }],
      rows: { I: [DASH, '0', '0'], C: [DASH, '+x', '+x'], E: [DASH, 'x', 'x'] } },
    pbi2: { unit: 'mol/L', species: [{ html: 'PbI<sub>2</sub>(s)', solid: true }, { html: 'Pb<sup>2+</sup>', cls: 'qk-cat' }, { html: '2 I<sup>−</sup>', cls: 'qk-an' }],
      rows: { I: [DASH, '0', '0'], C: [DASH, '+x', '+2x'], E: [DASH, 'x', '2x'] } }
  };

  const STEPS = {
    // the lab order, one stage of the picture per step: weigh (grams to moles), dissolve and fill to the line (volume), then divide
    concMass: [
      { lhs: 'Moles of NaCl', rhs: CH('2.00 ' + X('g NaCl'), F('1 mol NaCl', '58.5 ' + X('g NaCl'))) + EQ('0.0342', 'mol NaCl'),
        note: 'We weigh 2.00 g of NaCl. Molar mass from the Data Booklet. Grams cancel', mark: ['balance'],
        speech: 'Moles of N a C l equals 2.00 grams of N a C l times 1 mole of N a C l per 58.5 grams, which is 0.0342 moles of N a C l. We weigh 2.00 grams of N a C l. Molar mass from the Data Booklet. Grams cancel.' },
      { lhs: 'V', rhs: CH('250.0 ' + X('mL'), F('1 L', '1000 ' + X('mL'))) + EQ('0.2500', 'L'),
        note: 'We dissolve the solid, then add water up to the line. The volume of solution is 250.0 mL', mark: ['line'],
        speech: 'V equals 250.0 millilitres times 1 litre per 1000 millilitres, which is 0.2500 litres. We dissolve the solid, then add water up to the line. The volume of solution is 250.0 millilitres.' },
      { lhs: '[NaCl]', rhs: F('0.0342 mol NaCl', '0.2500 L') + EQ('0.137', 'mol/L'),
        note: 'We divide the moles by the volume of solution', mark: ['solution'],
        speech: 'The concentration of N a C l equals 0.0342 moles of N a C l per 0.2500 litres, which is 0.137 moles per litre. We divide the moles by the volume of solution.' }
    ],
    // dilution, one stage per step (the picture follows): CᵢVᵢ gives the moles, the moles over the final volume, then CᵢVᵢ = C_fV_f
    concDilute: [
      { lhs: 'Moles of KI', rhs: CH(F('0.100 mol KI', '1 ' + X('L')), '50.0 ' + X('mL'), F('1 ' + X('L'), '1000 ' + X('mL'))) + EQ('0.00500', 'mol KI'),
        note: 'C<sub>i</sub> × V<sub>i</sub> gives us the moles of KI that the pipette moves into the flask', mark: ['moles'],
        speech: 'Moles of K I equals 0.100 moles of K I per litre, times 50.0 millilitres, times 1 litre per 1000 millilitres, which is 0.00500 moles of K I. C i times V i gives us the moles of K I that the pipette moves into the flask.' },
      { lhs: 'C<sub>f</sub>', rhs: CH(F('0.00500 mol KI', '250.0 ' + X('mL')), F('1000 ' + X('mL'), '1 L')) + EQ('0.0200', 'mol/L'),
        note: 'We add water, but the moles don\'t change. We divide the moles by the final volume', mark: ['diluted'],
        speech: 'C f equals 0.00500 moles of K I per 250.0 millilitres, times 1000 millilitres per litre, which is 0.0200 moles per litre. We add water, but the moles don\'t change. We divide the moles by the final volume.' },
      { lhs: 'C<sub>f</sub>', rhs: F('C<sub>i</sub>V<sub>i</sub>', 'V<sub>f</sub>') + ' = ' + F('0.100 mol/L × 50.0 ' + X('mL'), '250.0 ' + X('mL')) + EQ('0.0200', 'mol/L'),
        note: 'C<sub>i</sub>V<sub>i</sub> = C<sub>f</sub>V<sub>f</sub>, rearranged for C<sub>f</sub>. Same answer in one step', mark: ['eqn'],
        speech: 'C f equals C i V i over V f, which is 0.100 moles per litre times 50.0 millilitres, over 250.0 millilitres, which is 0.0200 moles per litre. C i V i equals C f V f, rearranged for C f. Same answer in one step.' }
    ],
    ksp: [
      { lhs: 'AgCl(s) ⇌ ' + ion.Ag + ' + ' + ion.Cl, note: 'One of each ion per formula unit', mark: ['solid', 'cat', 'an'], salt: 'AgCl',
        speech: 'Solid A g C l dissolves to give A g plus and C l minus. One of each ion per formula unit.' },
      { lhs: KSP, rhs: '[' + ion.Ag + '][' + ion.Cl + ']', note: 'The solid is left out', mark: ['cat', 'an'], salt: 'AgCl',
        speech: 'K s p equals the silver ion concentration times the chloride concentration. The solid is left out.' },
      { lhs: 'PbI<sub>2</sub>(s) ⇌ ' + ion.Pb + ' + 2 ' + ion.I, note: 'Two iodide ions per formula unit', mark: ['solid', 'cat', 'an'], salt: 'PbI2',
        speech: 'Solid P b I 2 dissolves to give P b 2 plus and 2 I minus. Two iodide ions per formula unit.' },
      { lhs: KSP, rhs: '[' + ion.Pb + '][' + ion.I + ']<sup>2</sup>', note: 'The coefficient 2 becomes a power', mark: ['an'], salt: 'PbI2',
        speech: 'K s p equals the lead ion concentration times the iodide concentration squared. The coefficient 2 becomes a power.' }
    ],
    // Ksp to solubility: an ICE table fills first (equation, I, C, E), then the equations use the E row
    agcl: [
      { ice: 'R', note: 'We start with the dissolving equation', mark: ['solid'], speech: 'The ICE table starts with the dissolving equation: solid A g C l, in equilibrium with A g plus and C l minus.' },
      { ice: 'I', note: 'Initial: pure water, so there are no ions yet. The solid gets a dash, because it is left out of K<sub>sp</sub>',
        speech: 'Initial: pure water, so both ion concentrations start at 0. The solid gets a dash, because it is left out of K s p.' },
      { ice: 'C', note: 'Change: x mol/L of AgCl dissolves. Each AgCl gives one ' + ion.Ag + ' and one ' + ion.Cl + ', so each goes up by x', mark: ['cat', 'an'],
        speech: 'Change: x moles per litre of A g C l dissolves. Each one gives one silver ion and one chloride ion, so each goes up by x.' },
      { ice: 'E', note: 'Equilibrium: the solution is saturated, with x mol/L of each ion', mark: ['cat', 'an'], legend: ['[Ag⁺] = x', '[Cl⁻] = x'],
        speech: 'Equilibrium: the solution is saturated, with x moles per litre of each ion.' },
      { lhs: KSP, rhs: '[' + ion.Ag + '][' + ion.Cl + ']', note: 'Products over reactants. The solid is left out', mark: ['cat', 'an'],
        speech: 'K s p equals the silver ion concentration times the chloride concentration. Products over reactants. The solid is left out.' },
      { rhs: '(x)(x) = x<sup>2</sup>', note: 'Fill in the E row of the ICE table', useE: true, mark: ['cat', 'an'],
        speech: 'equals x times x, which is x squared. We fill in the E row of the ICE table.' },
      { lhs: 'x', rhs: '√' + KSP + ' = √(' + n(S.AgCl.ksp, sci) + ')', note: KSP + ' from the Data Booklet',
        speech: 'x equals the square root of K s p, the square root of ' + sp(S.AgCl.ksp, sci) + '. K s p is from the Data Booklet.' },
      { lhs: 'x', rhs: n(sAgCl, mol), note: 'This is the molar solubility, s', mark: ['readout'], speech: 'x equals ' + sp(sAgCl, mol) + '. This is the molar solubility, s.' },
      { lhs: 'Solubility', rhs: CH(F(n(sAgCl, sci) + ' ' + X('mol AgCl'), '1 L'), F(S.AgCl.molarMass.toFixed(1) + ' g AgCl', '1 ' + X('mol AgCl'))), note: 'Molar mass from the Data Booklet. Moles cancel, leaving grams per litre',
        speech: 'The solubility equals ' + sp(sAgCl, sci) + ' moles of A g C l per litre, times ' + S.AgCl.molarMass.toFixed(1) + ' grams of A g C l per mole. Moles cancel, leaving grams per litre.' },
      { rhs: n(sAgCl * S.AgCl.molarMass, { sci: 'always', unit: 'g/L' }), note: 'About 2 mg in a whole litre', mark: ['solid'],
        speech: 'equals ' + sp(sAgCl * S.AgCl.molarMass, { sci: 'always', unit: 'g/L' }) + '. About 2 milligrams in a whole litre.' }
    ],
    pbi2: [
      { ice: 'R', note: 'We start with the dissolving equation. Each PbI<sub>2</sub> gives one ' + ion.Pb + ' and two ' + ion.I, mark: ['solid'],
        speech: 'The ICE table starts with the dissolving equation: solid P b I 2, in equilibrium with P b 2 plus and 2 I minus. Each P b I 2 gives one lead ion and two iodide ions.' },
      { ice: 'I', note: 'Initial: pure water, so there are no ions yet. The solid gets a dash, because it is left out of K<sub>sp</sub>',
        speech: 'Initial: pure water, so both ion concentrations start at 0. The solid gets a dash, because it is left out of K s p.' },
      { ice: 'C', note: 'Change: x mol/L of PbI<sub>2</sub> dissolves. ' + ion.Pb + ' goes up by x, but ' + ion.I + ' goes up by 2x, because there are two in the formula', mark: ['cat', 'an'],
        speech: 'Change: x moles per litre of P b I 2 dissolves. The lead ion goes up by x, but iodide goes up by 2 x, because there are two in the formula.' },
      { ice: 'E', note: 'Equilibrium: the solution is saturated, with x mol/L of ' + ion.Pb + ' and 2x mol/L of ' + ion.I, mark: ['cat', 'an'], legend: ['[Pb²⁺] = x', '[I⁻] = 2x'],
        speech: 'Equilibrium: the solution is saturated, with x moles per litre of lead ions and 2 x moles per litre of iodide.' },
      { lhs: KSP, rhs: '[' + ion.Pb + '][' + ion.I + ']<sup>2</sup>', note: 'The coefficient 2 becomes a power. The solid is left out', mark: ['cat', 'an'],
        speech: 'K s p equals the lead ion concentration times the iodide concentration squared. The coefficient 2 becomes a power. The solid is left out.' },
      { rhs: '(x)(2x)<sup>2</sup>', note: 'Fill in the E row of the ICE table', useE: true, mark: ['cat', 'an'],
        speech: 'equals x times 2 x, squared. We fill in the E row of the ICE table.' },
      { rhs: '4x<sup>3</sup>', note: '(2x)<sup>2</sup> = 4x<sup>2</sup>, then times x', useE: true, speech: 'equals 4 x cubed. 2 x squared is 4 x squared, then times x.' },
      { lhs: 'x', rhs: '∛(' + KSP + ' ÷ 4) = ∛(' + n(S.PbI2.ksp, sci) + ' ÷ 4)', note: KSP + ' from the Data Booklet',
        speech: 'x equals the cube root of K s p divided by 4, the cube root of ' + sp(S.PbI2.ksp, sci) + ' divided by 4. K s p is from the Data Booklet.' },
      { lhs: 'x', rhs: n(sPbI2, mol), note: 'This is the molar solubility, s', mark: ['readout'], speech: 'x equals ' + sp(sPbI2, mol) + '. This is the molar solubility, s.' },
      { lhs: 'Solubility', rhs: CH(F(n(sPbI2, sci) + ' ' + X('mol PbI<sub>2</sub>'), '1 L'), F(S.PbI2.molarMass.toFixed(1) + ' g PbI<sub>2</sub>', '1 ' + X('mol PbI<sub>2</sub>'))), note: 'Molar mass from the Data Booklet. Moles cancel, leaving grams per litre',
        speech: 'The solubility equals ' + sp(sPbI2, sci) + ' moles of P b I 2 per litre, times ' + S.PbI2.molarMass.toFixed(1) + ' grams of P b I 2 per mole. Moles cancel, leaving grams per litre.' },
      { rhs: n(sPbI2 * S.PbI2.molarMass, { unit: 'g/L' }), mark: ['solid'], speech: 'equals ' + sp(sPbI2 * S.PbI2.molarMass, { unit: 'g/L' }) + '.' }
    ],
    labMass: [
      { lhs: 'Mass', rhs: CH('1.63 ' + X('mg'), F('1 g', '1000 ' + X('mg'))) + ' = 0.00163' + unit('g'), note: 'Convert mg to g first', mark: ['residue', 'balance'],
        speech: 'The mass is 1.63 milligrams times 1 gram per 1000 milligrams, which is 0.00163 grams. Convert milligrams to grams first.' },
      { lhs: 's', rhs: CH(F('0.00163 ' + X('g ' + MgOH2f), '0.2500 L'), F('1 mol ' + MgOH2f, '58.3 ' + X('g ' + MgOH2f))), note: 'Molar mass from the Data Booklet. Grams cancel',
        speech: 's equals 0.00163 grams of magnesium hydroxide per 0.2500 litres, times 1 mole per 58.3 grams. Molar mass from the Data Booklet. Grams cancel.' },
      { rhs: n(1.12e-4, mol), note: 'This is the molar solubility, s', speech: 'equals 1.12 times 10 to the minus 4 moles per litre. This is the molar solubility, s.' },
      { lhs: '[' + ion.Mg + ']', rhs: 's = ' + n(1.12e-4, { sci: 'always', unit: 'M' }), speech: 'The magnesium ion concentration equals s, 1.12 times 10 to the minus 4 molar.' },
      { lhs: '[' + ion.OH + ']', rhs: CH(F(n(1.12e-4, sci) + ' ' + X('mol ' + MgOH2f), '1 L'), F('2 mol ' + ion.OH, '1 ' + X('mol ' + MgOH2f))), note: 'Two ' + ion.OH + ' in the formula',
        speech: 'The hydroxide concentration equals 1.12 times 10 to the minus 4 moles of magnesium hydroxide per litre, times 2 moles of O H minus per mole of magnesium hydroxide. There are two O H minus in the formula.' },
      { rhs: n(2.24e-4, { sci: 'always', unit: 'M' }), speech: 'equals 2.24 times 10 to the minus 4 molar.' },
      { lhs: KSP, rhs: '[' + ion.Mg + '][' + ion.OH + ']<sup>2</sup>', speech: 'K s p equals the magnesium ion concentration times the hydroxide concentration squared.' },
      { rhs: '(' + n(1.12e-4, sci) + ')(' + n(2.24e-4, sci) + ')<sup>2</sup>', speech: 'equals 1.12 times 10 to the minus 4, times 2.24 times 10 to the minus 4 squared.' },
      { rhs: n(5.6e-12, { sci: 'always', sig: 2 }), note: 'Matches the Data Booklet', speech: 'equals 5.6 times 10 to the minus 12. This matches the Data Booklet.' }
    ],
    labCond: [
      { lhs: 'Measure the standards and draw the line', note: 'Known concentrations, measured conductivity', mark: ['standards'],
        speech: 'Measure the standards and draw the calibration line: known concentrations, measured conductivity.' },
      { lhs: 'The saturated solution reads 56 µS/cm', note: 'Find it on the conductivity axis', mark: ['reading'], speech: 'The saturated solution reads 56 microsiemens per centimetre. Find it on the conductivity axis.' },
      { lhs: 's', rhs: n(1.12e-4, mol), note: 'Read across to the line, then down', mark: ['conc'],
        speech: 's equals 1.12 times 10 to the minus 4 moles per litre. Read across to the line, then down.' },
      { lhs: KSP, rhs: '(s)(2s)<sup>2</sup> = 4s<sup>3</sup> = 4(' + n(1.12e-4, sci) + ')<sup>3</sup>', speech: 'K s p equals s times 2 s squared, which is 4 s cubed, which is 4 times 1.12 times 10 to the minus 4, cubed.' },
      { rhs: n(5.6e-12, { sci: 'always', sig: 2 }), note: 'The same K<sub>sp</sub> as strategy 1', speech: 'equals 5.6 times 10 to the minus 12, the same K s p as strategy 1.' }
    ],
    // a pH probe (a preview of next unit): pH to pOH, pOH to [OH⁻], then the same route to Ksp
    labIon: [
      { lhs: '<span class="ws-stack"><span>pH = 10.350</span><span>14.000 = pH + pOH</span><span>pOH = 14.000 − pH = 14.000 − 10.350 = 3.650</span></span>',
        note: 'We read the pH once it stops rising (saturated). At 25 °C, pH + pOH = 14.000. A preview of next unit', mark: ['ph'],
        speech: 'p H equals 10.350. 14.000 equals p H plus p O H, so p O H equals 14.000 minus p H, which is 14.000 minus 10.350, which is 3.650. We read the p H once it stops rising: the solution is saturated. A preview of next unit.' },
      { lhs: '[' + ion.OH + ']', rhs: '10<sup>−3.650</sup> <span class="ua-step">= ' + n(2.24e-4, { sci: 'always', unit: 'mol/L' }) + '</span>', note: 'pOH to [' + ion.OH + ']: 10 to the power of −pOH', mark: ['an'],
        speech: 'The hydroxide concentration equals 10 to the minus 3.650, which is 2.24 times 10 to the minus 4 moles per litre. To go from p O H to hydroxide concentration, take 10 to the power of minus p O H.' },
      { lhs: '[' + ion.Mg + ']', rhs: CH(F(n(2.24e-4, sci) + ' ' + X('mol ' + ion.OH), '1 L'), F('1 mol ' + ion.Mg, '2 ' + X('mol ' + ion.OH))), note: 'Half as many ' + ion.Mg + ' as ' + ion.OH, mark: ['cat'],
        speech: 'The magnesium ion concentration equals 2.24 times 10 to the minus 4 moles of O H minus per litre, times 1 mole of magnesium ion per 2 moles of O H minus. Half as many magnesium ions as hydroxide ions.' },
      { rhs: n(1.12e-4, { sci: 'always', unit: 'M' }), mark: ['cat'], speech: 'equals 1.12 times 10 to the minus 4 molar.' },
      { lhs: KSP, rhs: '(' + n(1.12e-4, sci) + ')(' + n(2.24e-4, sci) + ')<sup>2</sup>', speech: 'K s p equals 1.12 times 10 to the minus 4, times 2.24 times 10 to the minus 4 squared.' },
      { rhs: n(5.6e-12, { sci: 'always', sig: 2 }), note: 'The same again', speech: 'equals 5.6 times 10 to the minus 12. The same again.' }
    ]
  };

  // ---------- prediction chips ----------
  const CHIPS = {
    pbi2: { prompt: 'In saturated PbI<sub>2</sub>, if [' + ion.Pb + '] = x, then [' + ion.I + '] = …',
      options: [{ label: 'x' }, { label: '2x', correct: true }, { label: 'x<sup>2</sup>' }],
      reveal: '2x. Count the ions in the window: two ' + ion.I + ' for every ' + ion.Pb + '.' }
  };
  const sub = s => s.replace(/([A-Za-z)])([₀-₉]+)/g, (m, a, d) => a + '<sub>' + [...d].map(c => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join('') + '</sub>');

  // ---------- section presets ----------
  // scene: { salt, scoops, settle }  tabs: [{ id, label, pic | scene, steps }]  tools: readout rows, check, chips
  const PRESETS = {
    'p1-brief': { kind: 'brief', part: 1, aria: 'Part 1: what this Part is aiming for.' },
    'p1-conc': { tabs: [
      { id: 'mass', label: 'Concentration', pic: 'concMass', steps: 'concMass', aria: 'A balance reads 2.00 g of sodium chloride; the solid is tipped into a volumetric flask, dissolved and made up to the 250.0 mL line.' },
      { id: 'dilute', label: 'Dilution', pic: 'concDilute', steps: 'concDilute', aria: 'A beaker holds 0.100 M potassium iodide. Step by step, a pipette moves 50.0 mL of it into a volumetric flask, water is added to the 250.0 mL line, and the concentration drops to 0.0200 M.' }] },
    'p1-rules': { kind: 'rules', aria: 'Twelve ionic compounds to sort as soluble or low solubility, using the Data Booklet.' },
    'p1-saturated': { scene: { salt: 'AgCl', scoops: 0 }, buttons: ['scoop', 'reset'], readout: ['added', 's', 'solid', 'cat', 'an'], readoutMass: true, hint: true,
      aria: 'A beaker of water with silver chloride added a scoop at a time, and a zoomed window of the ions.' },
    'p1-notice': { noHint: true, tabs: [ // a picture per example, like Equilibrium around us; captions from SolData.GUIDE.observations
      { id: 'cave', label: 'Cave formations', pic: 'cave', aria: 'A stalactite drips onto a stalagmite and both slowly grow. Zoomed in, calcium and carbonate ions in the drop join the solid at the tip while carbon dioxide leaves the drop.' },
      { id: 'scale', label: 'Kettle scale', pic: 'kettle', aria: 'Hard water boils in a kettle and a white crust builds on the heating element. Zoomed in, calcium and carbonate ions join the crust between steam bubbles.' },
      { id: 'antacid', label: 'Milk of magnesia', pic: 'antacid', aria: 'A white suspension of magnesium hydroxide is poured into stomach acid and the cloud clears. Zoomed in, hydrogen ions meet the hydroxide ions of a grain, water forms, and magnesium ions drift away until the grain is gone.' }] },
    'p1-ksp': { scene: { salt: 'AgCl', scoops: 3, settle: true }, check: true, steps: 'ksp', notes: true, hint: true,
      aria: 'A saturated solution with solid on the bottom, and the Q versus Ksp check reading saturated.' },
    'p1-agcl': { scene: { salt: 'AgCl', scoops: 3, settle: true }, readout: ['s', 'cat', 'an', 'ksp'], steps: 'agcl', readoutLast: true, iceScene: true, notes: true, hint: true,
      aria: 'Saturated silver chloride: the window shows equal numbers of silver and chloride ions.' },
    'p1-pbi2': { scene: { salt: 'PbI2', scoops: 3, settle: true }, chips: ['pbi2'], readout: ['s', 'cat', 'an', 'ksp'], steps: 'pbi2', readoutLast: true, iceScene: true, notes: true, hint: true,
      aria: 'Saturated lead(II) iodide: the window shows two iodide ions for every lead ion.' },
    'p1-lab': { tabs: [
      { id: 'mass', label: 'Mass', pic: 'labMass', steps: 'labMass', aria: '250.0 mL of saturated magnesium hydroxide is evaporated; the white residue weighs 1.63 mg.' },
      { id: 'cond', label: 'Conductivity', pic: 'labCond', steps: 'labCond', aria: 'A calibration line of conductivity against concentration; the saturated solution reads 56 microsiemens per centimetre, which is 1.12 times 10 to the minus 4 moles per litre.' },
      { id: 'ion', label: 'pH probe', pic: 'labPH', steps: 'labIon', aria: 'A pH probe in neutral water reads 7.000. Magnesium hydroxide is added a little at a time and the pH climbs on a graph of pH against time, then levels off at 10.350 once the solution is saturated and extra solid stays on the bottom.' }] },
    'p1-try': { scene: { salt: 'PbI2', scoops: 0 }, buttons: ['scoop', 'reset'], readout: ['added', 's', 'solid', 'cat', 'an'], readoutMass: true, check: true, link: ['sandbox.html', 'Open the Sandbox'], hint: true,
      aria: 'A beaker for lead(II) iodide; add scoops until solid stays on the bottom.' }
  };

  // ================= Part 2: Q vs Ksp =================
  const M = x => n(x, { sci: 'always', sig: 2, unit: 'M' }), Ms = x => sp(x, { sci: 'always', sig: 2, unit: 'M' });
  const s2 = x => n(x, { sci: 'always', sig: 2 }), s2s = x => sp(x, { sci: 'always', sig: 2 });
  const PART = (reagent, conc, vol, name) => ({ reagent, conc, vol, name });
  const Ci = 'C<sub>i</sub>', Vi = 'V<sub>i</sub>', Cf = 'C<sub>f</sub>', Vf = 'V<sub>f</sub>';
  const grp = (cls, html) => '<span class="mx-grp ' + cls + '">(' + html + ')</span>';
  const aq = '<span class="mx-st">(aq)</span>', sol = '<span class="mx-st">(s)</span>';
  // the mixing table (SolUI mixTable): full equation → complete ionic → net ionic, then values under each ion
  const MIXT = {
    mixPbI2: {
      tokens: { pbno3: 'Pb(NO<sub>3</sub>)<sub>2</sub>' + aq, ki: '2 KI' + aq, pbi2: 'PbI<sub>2</sub>' + sol, kno3: '2 KNO<sub>3</sub>' + aq,
        pb: '<span class="qk-cat">' + ion.Pb + '</span>' + aq, i: '2 <span class="qk-an">' + ion.I + '</span>' + aq,
        no3L: '2 NO<sub>3</sub><sup>−</sup>' + aq, kL: '2 K<sup>+</sup>' + aq, kR: '2 K<sup>+</sup>' + aq, no3R: '2 NO<sub>3</sub><sup>−</sup>' + aq,
        p1: '+', p2: '+', pB: '+', pC: '+', pE: '+', arrow: '→' },
      reactants: ['pbno3', 'p1', 'ki'],                       // before the pour: what goes in (user, 2026-11-19)
      full: ['pbno3', 'p1', 'ki', 'arrow', 'pbi2', 'p2', 'kno3'],
      ionic: ['pb', 'p1', 'no3L', 'pB', 'kL', 'pC', 'i', 'arrow', 'pbi2', 'p2', 'kR', 'pE', 'no3R'],
      spect: ['no3L', 'pB', 'kL', 'pC', 'p2', 'kR', 'pE', 'no3R'],
      from: { pb: 'pbno3', no3L: 'pbno3', pB: 'pbno3', kL: 'ki', i: 'ki', pC: 'ki', kR: 'kno3', pE: 'kno3', no3R: 'kno3' },
      ops: ['p1', 'p2', 'pB', 'pC', 'pE', 'arrow'],
      net: ['pb', 'p1', 'i', 'arrow', 'pbi2'],
      rows: [
        { key: 'Ci', head: Ci, vals: ['0.010 M', '0.020 M', DASH] },
        { key: 'Vi', head: Vi, vals: ['50.0 mL', '50.0 mL', DASH] },
        { key: 'Vf', head: Vf, vals: ['100.0 mL', '100.0 mL', DASH] },
        { key: 'Cf', head: Cf, vals: ['0.0050 M', '0.010 M', DASH] }]
    }
  };
  const MIX = {
    trap: { salt: 'PbI2', parts: [PART('PbNO32', 0.0020, 0.050, '0.0020 M Pb(NO₃)₂'), PART('KI', 0.0030, 0.050, '0.0030 M KI')] },
    // the worked mix (user, 2026-11-19): Q > Ksp, so it precipitates once Q is compared with Ksp
    pbi2: { salt: 'PbI2', parts: [PART('PbNO32', 0.010, 0.050, '0.010 M Pb(NO₃)₂'), PART('KI', 0.020, 0.050, '0.020 M KI')],
      show: [{ 'Pb2+': 2, 'NO3-': 4 }, { 'K+': 4, 'I-': 4 }], spect: 'K⁺ and NO₃⁻ (spectator ions) not shown' },
    agcl: { salt: 'AgCl', parts: [PART('AgNO3', 0.010, 0.025, '0.010 M AgNO₃'), PART('NaCl', 0.0010, 0.075, '0.0010 M NaCl')] },
    m1: { salt: 'PbI2', parts: [PART('PbNO32', 0.10, 0.050, '0.10 M Pb(NO₃)₂'), PART('KI', 0.10, 0.050, '0.10 M KI')] },
    m2: { salt: 'AgCl', parts: [PART('AgNO3', 1.0e-5, 0.050, '1.0×10⁻⁵ M AgNO₃'), PART('NaCl', 1.0e-5, 0.050, '1.0×10⁻⁵ M NaCl')] },
    // Mix 3 and Mix 4 use different volumes (user, 2026-11-19), so each concentration is diluted by its own factor
    m3: { salt: 'MgOH2', parts: [PART('MgNO32', 2.0e-4, 0.030, '2.0×10⁻⁴ M Mg(NO₃)₂'), PART('NaOH', 4.0e-4, 0.070, '4.0×10⁻⁴ M NaOH')] },
    m4: { salt: 'Ag2CrO4', parts: [PART('AgNO3', 1.0e-3, 0.020, '1.0×10⁻³ M AgNO₃'), PART('K2CrO4', 1.0e-3, 0.080, '1.0×10⁻³ M K₂CrO₄')] }
  };
  const TUBES = [
    { caption: 'stays clear', parts: MIX.trap.parts },
    { caption: 'yellow solid', parts: MIX.m1.parts },
    { caption: 'faint haze', parts: [PART('PbNO32', 0.0024, 0.050, '0.0024 M Pb(NO₃)₂'), PART('KI', 0.0056, 0.050, '0.0056 M KI')], haze: true }
  ];
  Object.assign(STEPS, {
    // Mixing, step by step (user, 2026-11-19): pour (the equation becomes net ionic), the values under each ion,
    // CᵢVᵢ = C_fV_f rearranged, C_f into Q as symbols, then numbers, then Q vs Ksp (and only then the solid forms)
    mixPbI2: [
      { mx: 'net', pour: true,
        note: 'We pour the two solutions together and write the products. Each compound splits into its ions. K<sup>+</sup> and NO<sub>3</sub><sup>−</sup> are on both sides and stay dissolved: they are <strong>spectator ions</strong>. Crossing them out leaves the <strong>net ionic equation</strong>',
        speech: 'We pour the two solutions together and write the products: solid P b I 2 and aqueous K N O 3. Each compound splits into its ions. Potassium and nitrate ions are on both sides and stay dissolved: they are spectator ions. Crossing them out leaves the net ionic equation: P b 2 plus, plus 2 I minus, gives solid P b I 2.' },
      { rows: ['Ci', 'Vi'], mark: ['sources'],
        note: 'Under each ion: its concentration and its volume before mixing. One Pb(NO<sub>3</sub>)<sub>2</sub> gives one ' + ion.Pb + ', and one KI gives one ' + ion.I + ', so each ion has the same concentration as its solution',
        speech: 'Under each ion: its concentration and its volume before mixing. Lead ions: 0.010 moles per litre, 50.0 millilitres. Iodide ions: 0.020 moles per litre, 50.0 millilitres.' },
      { lhs: '<span class="ws-stack"><span>' + Ci + Vi + ' = ' + Cf + Vf + '</span><span>' + Cf + ' = ' + F(Ci + Vi, Vf) + '</span></span>', rows: ['Vf'],
        note: 'Mixing dilutes both solutions, so we need two ' + Cf + ' values: one for ' + ion.Pb + ' and one for ' + ion.I + '. ' + Vf + ' is the total volume: 50.0 mL + 50.0 mL = 100.0 mL',
        speech: 'C i V i equals C f V f. Rearranged, C f equals C i V i over V f. Mixing dilutes both solutions, so we need two values of C f: one for the lead ion and one for the iodide ion. V f is the total volume, 50.0 plus 50.0, which is 100.0 millilitres.' },
      { lhs: 'Q', rhs: '<span class="ws-stack"><span>[' + ion.Pb + '][' + ion.I + ']<sup>2</sup></span><span>= ' + grp('cat', F(Ci + Vi, Vf)) + grp('an', F(Ci + Vi, Vf)) + '<sup>2</sup></span></span>',
        note: 'Each bracket is one ion’s ' + Cf + ': ' + ion.Pb + ' first, then ' + ion.I + '. [' + ion.I + '] is squared, from the 2 in front of ' + ion.I + ' in the equation',
        speech: 'Q equals the lead ion concentration times the iodide concentration squared. Each concentration is C i V i over V f for that ion, and the iodide one is squared.' },
      { lhs: 'Q', rhs: '<span class="ws-stack"><span>' + grp('cat', F('0.010 × 50.0 ' + X('mL'), '100.0 ' + X('mL'))) + grp('an', F('0.020 × 50.0 ' + X('mL'), '100.0 ' + X('mL'))) + '<sup>2</sup></span>' +
          '<span>= (0.0050)(0.010)<sup>2</sup></span><span>= ' + s2(5.0e-7) + '</span></span>', rows: ['Cf'],
        note: 'mL cancels mL. The ' + Cf + ' row of the table shows each diluted concentration',
        speech: 'Q equals 0.010 times 50.0 over 100.0, times 0.020 times 50.0 over 100.0, squared. That is 0.0050 times 0.010 squared, which is 5.0 times 10 to the minus 7.' },
      { lhs: 'Q &gt; ' + KSP + ': ' + s2(5.0e-7) + ' &gt; ' + s2(8.5e-9), mark: ['check', 'solid'], react: true,
        note: 'Q is about 60 times ' + KSP + ', so a yellow solid of PbI<sub>2</sub> forms. Ions join the solid until Q falls to ' + KSP,
        speech: 'Q is greater than K s p: 5.0 times 10 to the minus 7 is greater than 8.5 times 10 to the minus 9. Q is about 60 times K s p, so a yellow solid of P b I 2 forms. Ions join the solid until Q falls to K s p.' }
    ],
    agclMix: [
      { lhs: 'V', rhs: '25.0 mL + 75.0 mL = 100.0 mL', pour: true, speech: 'V equals 25.0 millilitres plus 75.0 millilitres, which is 100.0 millilitres.' },
      { lhs: '[' + ion.Ag + ']', rhs: CH(F('0.010 mol ' + ion.Ag, '1 L'), F('25.0 ' + X('mL'), '100.0 ' + X('mL'))), mark: ['cat'], speech: 'The silver ion concentration equals 0.010 moles per litre, times 25.0 millilitres per 100.0 millilitres.' },
      { rhs: M(2.5e-3), mark: ['cat'], speech: 'equals ' + Ms(2.5e-3) + '.' },
      { lhs: '[' + ion.Cl + ']', rhs: CH(F('0.0010 mol ' + ion.Cl, '1 L'), F('75.0 ' + X('mL'), '100.0 ' + X('mL'))), mark: ['an'], speech: 'The chloride concentration equals 0.0010 moles per litre, times 75.0 millilitres per 100.0 millilitres.' },
      { rhs: M(7.5e-4), mark: ['an'], speech: 'equals ' + Ms(7.5e-4) + '.' },
      { lhs: 'Q', rhs: '[' + ion.Ag + '][' + ion.Cl + '] = (' + s2(2.5e-3) + ')(' + s2(7.5e-4) + ')', speech: 'Q equals the silver ion concentration times the chloride concentration, ' + s2s(2.5e-3) + ' times ' + s2s(7.5e-4) + '.' },
      { rhs: s2(1.9e-6), note: 'About 10 000 times K<sub>sp</sub>', mark: ['check'], speech: 'equals ' + s2s(1.9e-6) + ', about 10 thousand times K s p.' },
      { lhs: 'Q &gt; ' + KSP + ' (' + s2(1.8e-10) + '): a white solid of AgCl forms', mark: ['solid', 'check'], react: true,
        speech: 'Q is greater than K s p, 1.8 times 10 to the minus 10, so a white solid of silver chloride forms.' }
    ]
  });
  const mixChip = (what, yes, reveal) => ({ prompt: 'Equal volumes of ' + what + '. Does a solid form?',
    options: [{ label: 'Yes', correct: yes }, { label: 'No', correct: !yes }], reveal });
  const volChip = (a, b, yes, reveal) => ({ prompt: a + ' is mixed with ' + b + '. Does a solid form?',
    options: [{ label: 'Yes', correct: yes }, { label: 'No', correct: !yes }], reveal });
  Object.assign(CHIPS, {
    p2q: { prompt: 'A PbI<sub>2</sub> solution has Q = ' + s2(2.0e-9) + '. ' + KSP + ' is ' + s2(8.5e-9) + '. What happens?',
      options: [{ label: 'Unsaturated', correct: true }, { label: 'Saturated' }, { label: 'A solid forms' }],
      reveal: 'Unsaturated. Q &lt; ' + KSP + ', so more PbI<sub>2</sub> could dissolve.' },
    m1: mixChip('0.10 M Pb(NO<sub>3</sub>)<sub>2</sub> and 0.10 M KI', true,
      'Yes, a yellow solid of PbI<sub>2</sub>. After mixing, [' + ion.Pb + '] = [' + ion.I + '] = 0.050 M, so Q = ' + s2(1.3e-4) + ', far above ' + KSP + ' (' + s2(8.5e-9) + ').'),
    m2: mixChip(s2(1.0e-5) + ' M AgNO<sub>3</sub> and ' + s2(1.0e-5) + ' M NaCl', false,
      'No. After mixing, [' + ion.Ag + '] = [' + ion.Cl + '] = ' + s2(5.0e-6) + ' M, so Q = ' + s2(2.5e-11) + ', below ' + KSP + ' (' + s2(1.8e-10) + ').'),
    m3: volChip('30.0 mL of ' + s2(2.0e-4) + ' M Mg(NO<sub>3</sub>)<sub>2</sub>', '70.0 mL of ' + s2(4.0e-4) + ' M NaOH', false,
      'No, but only just. After mixing, [' + ion.Mg + '] = ' + s2(2.0e-4) + ' × 30.0 mL ÷ 100.0 mL = ' + s2(6.0e-5) + ' M and [' + ion.OH + '] = ' + s2(4.0e-4) + ' × 70.0 mL ÷ 100.0 mL = ' + s2(2.8e-4) + ' M, so Q = (' + s2(6.0e-5) + ')(' + s2(2.8e-4) + ')<sup>2</sup> = ' + s2(4.7e-12) + ', just below ' + KSP + ' (' + s2(5.6e-12) + ').'),
    m4: volChip('20.0 mL of ' + s2(1.0e-3) + ' M AgNO<sub>3</sub>', '80.0 mL of ' + s2(1.0e-3) + ' M K<sub>2</sub>CrO<sub>4</sub>', true,
      'Yes, a brick-red solid of Ag<sub>2</sub>CrO<sub>4</sub>. After mixing, [' + ion.Ag + '] = ' + s2(1.0e-3) + ' × 20.0 mL ÷ 100.0 mL = ' + s2(2.0e-4) + ' M and [' + ion.CrO4 + '] = ' + s2(1.0e-3) + ' × 80.0 mL ÷ 100.0 mL = ' + s2(8.0e-4) + ' M, so Q = (' + s2(2.0e-4) + ')<sup>2</sup>(' + s2(8.0e-4) + ') = ' + s2(3.2e-11) + ', above ' + KSP + ' (' + s2(1.1e-12) + ').'),
    e1: { title: '1. The mixture stays clear.', options: [{ label: 'No Pb<sup>2+</sup> is present.' }, { label: 'Q was not greater than ' + KSP + '.', correct: true }, { label: 'The ' + KSP + ' in the booklet is wrong.' }],
      reveal: 'Q was not greater than ' + KSP + '. The ions are there, but too few to form a solid.' },
    e2: { title: '2. A yellow solid forms.', options: [{ label: 'Q was greater than ' + KSP + ' when the solutions met.', correct: true }, { label: 'All the Pb<sup>2+</sup> is now in the solid.' }, { label: 'Q is still greater than ' + KSP + '.' }],
      reveal: 'Q was greater than ' + KSP + ' at mixing. Now Q = ' + KSP + ', and a little Pb<sup>2+</sup> is still dissolved.' },
    e3: { title: '3. Our calculation says Q is just above ' + KSP + ', but the mixture looks clear.', options: [{ label: 'The calculation must be wrong.' }, { label: 'Very little solid forms, and it may be too little to see, or slow to appear.', correct: true }, { label: 'Q vs ' + KSP + ' doesn\'t work for real solutions.' }],
      reveal: 'When Q is only just above ' + KSP + ', very little solid forms. Look again after a few minutes, or against a dark background. Report what we saw, and say how it compares with our prediction.' }
  });
  Object.assign(PRESETS, {
    'p2-brief': { kind: 'brief', part: 2, tpl: 'tplSaturate', aria: 'Part 2: what this Part is aiming for.' },
    'p2-q': { scene: { salt: 'PbI2', scoops: 0 }, buttons: ['scoop', 'reset'], chips: ['p2q'], check: true, hint: true,
      aria: 'A beaker for lead(II) iodide and the Q versus Ksp check; Q climbs as scoops are added.' },
    'p2-dilute': { mix: MIX.pbi2, check: true, checkLast: true, steps: 'mixPbI2', hint: true,
      aria: '50.0 mL of 0.010 M lead(II) nitrate and 50.0 mL of 0.020 M potassium iodide are poured together into one beaker. The ions stay dissolved until Q is compared with Ksp; Q is greater, so a yellow solid of lead(II) iodide forms.' },
    'p2-predict': { check: true, hint: true, tabs: [
      { id: 'agcl', label: 'Worked example', mix: MIX.agcl, steps: 'agclMix', buttons: ['mix', 'reset'], aria: 'Silver nitrate and sodium chloride solutions are poured together; a white solid forms.' },
      { id: 'm1', label: 'Mix 1', mix: MIX.m1, chips: ['m1'], buttons: ['mix', 'reset'], aria: 'Equal volumes of 0.10 M lead(II) nitrate and 0.10 M potassium iodide.' },
      { id: 'm2', label: 'Mix 2', mix: MIX.m2, chips: ['m2'], buttons: ['mix', 'reset'], aria: 'Equal volumes of dilute silver nitrate and sodium chloride.' },
      { id: 'm3', label: 'Mix 3', mix: MIX.m3, chips: ['m3'], buttons: ['mix', 'reset'], aria: '30.0 mL of dilute magnesium nitrate and 70.0 mL of dilute sodium hydroxide.' },
      { id: 'm4', label: 'Mix 4', mix: MIX.m4, chips: ['m4'], buttons: ['mix', 'reset'], aria: '20.0 mL of silver nitrate and 80.0 mL of potassium chromate.' }] },
    'p2-evidence': { kind: 'tubes', chips: ['e1', 'e2', 'e3'], aria: 'Three test tubes, each 50.0 mL of lead(II) nitrate mixed with 50.0 mL of potassium iodide. Tube 1, 0.0020 M with 0.0030 M, stays clear. Tube 2, 0.10 M with 0.10 M, has a yellow solid at the bottom. Tube 3, 0.0024 M with 0.0056 M, has a faint yellow haze.' },
    'p2-try': { mix: MIX.trap, buttons: ['mix', 'reset'], check: true, link: ['sandbox.html', 'Open the Sandbox'],
      aria: 'Lead(II) nitrate and potassium iodide ready to mix.' }
  });


  // ================= Part 3: Changing solubility =================
  const DOSE = 0.010;                    // mol of a soluble reagent: 0.10 M in the 100 mL beaker
  const sx = x => n(x, { sci: 'always', sig: 2 });
  const ACT = { KI: sc => sc.addReagent('KI', DOSE) };
  ion.CO3 = 'CO<sub>3</sub><sup>2−</sup>'; ion.K = 'K<sup>+</sup>'; ion.NO3 = 'NO<sub>3</sub><sup>−</sup>'; ion.H = 'H<sup>+</sup>';
  const PbI2 = 'PbI<sub>2</sub>', MgOH2 = 'Mg(OH)<sub>2</sub>', CaCO3 = 'CaCO<sub>3</sub>', PbNO32 = 'Pb(NO<sub>3</sub>)<sub>2</sub>';
  Object.assign(STEPS, {
  });
  // the nine 3.5 outcomes: the stage follows the chosen card's salt, and "Run it" makes the change after the reveal
  const L = (what, salt, ans, why, run) => ({ what, salt, ans, why, run });
  const PRED = [
    L('Add KI to saturated ' + PbI2, 'PbI2', 'Less', ion.I + ' is a common ion; Q &gt; ' + KSP + ', shifts left', sc => sc.addReagent('KI', DOSE)),
    L('Add ' + PbNO32 + ' to saturated ' + PbI2, 'PbI2', 'Less', ion.Pb + ' is a common ion', sc => sc.addReagent('PbNO32', DOSE)),
    L('Add more solid ' + PbI2, 'PbI2', 'No change', 'The solid isn\'t in ' + KSP + '; the concentrations stay the same', sc => sc.scoop(4)),
    L('Heat saturated ' + PbI2, 'PbI2', 'More', 'Dissolving takes in heat; ' + KSP + ' gets bigger', sc => sc.setTemperature(353.15)),
    L('Add NaCl to saturated AgCl', 'AgCl', 'Less', ion.Cl + ' is a common ion', sc => sc.addReagent('NaCl', DOSE)),
    L('Add KNO<sub>3</sub> to saturated AgCl', 'AgCl', 'No change', 'Neither ' + ion.K + ' nor ' + ion.NO3 + ' is in the AgCl equilibrium', sc => sc.addReagent('KNO3', DOSE)),
    L('Add acid to ' + MgOH2, 'MgOH2', 'More', ion.H + ' removes ' + ion.OH + '; Q &lt; ' + KSP + ', shifts right', sc => sc.acid()),
    L('Add NaOH to ' + MgOH2, 'MgOH2', 'Less', ion.OH + ' is a common ion', sc => sc.addReagent('NaOH', DOSE)),
    L('Add acid to AgCl', 'AgCl', 'No change', ion.Cl + ' doesn\'t react with ' + ion.H, sc => sc.acid())
  ];
  Object.assign(CHIPS, {
  });
  const STRESS_LOCK = { common: '3.2', acid: '3.3', heat: '3.4' };
  Object.assign(PRESETS, {
    'p3-brief': { kind: 'brief', part: 3, tpl: 'tplSaturate', aria: 'Part 3: what this Part is aiming for.' },
    'p3-stress': { scene: { salt: 'PbI2', scoops: 12, settle: true }, buttons: ['common', 'acid', 'heat'], locked: STRESS_LOCK, check: true,
      aria: 'Saturated lead(II) iodide with the Q versus Ksp check. Three stress buttons wait for the sections that use them: add potassium iodide, add acid, heat.' },
    'p3-common': { scene: { salt: 'PbI2', scoops: 3, settle: true, dropper: true, showIons: ['K+', 'NO3-'], minOwn: 2, maxIons: 20 },
      buttons: ['common', 'common2', 'reset'], oneCommon: true, check: true, // scene: a dropper adds it; K⁺ / NO₃⁻ shown; a Pb²⁺ or two stay (user, 2026-11-20)
      liveIce: true, compare: true, iceTight: true, // a live ICE table and solved Ksp instead of steps; original vs new under the picture (user, 2026-11-20)
      aria: 'Saturated lead(II) iodide. Adding potassium iodide pushes Q past Ksp and new yellow layers form on the solid.' },
    // 3.3 follows 3.2 (user, 2026-11-20): dropper, NO₃⁻ shown, a couple of the salt's own ions always in view, original vs new under the
    // picture, the question in the text. A press is 1.0 × 10⁻³ M acid, as the copy says; 40 scoops so solid is left (CaCO₃ needs ~28)
    // base 2: a third of the usual ions to start, so the rise as more dissolves shows (user, 2026-11-20). CaCO₃ takes HCl and fizzes CO₂
    'p3-acid': { scene: { scoops: 40, settle: true, dropper: true, showIons: ['NO3-', 'Cl-'], minOwn: 2, maxIons: 20, base: 2 }, salts: ['MgOH2', 'CaCO3', 'AgCl', 'PbI2'],
      buttons: ['acid', 'reset'], acidMol: 1.0e-4, acidReagent: { CaCO3: 'HCl' }, check: true, compare: true, hint: true,
      aria: 'A saturated salt with an Add acid button. For magnesium hydroxide the window zooms in where hydrogen ions meet hydroxide ions.' },
    'p3-temp': { scene: { salt: 'PbI2', scoops: 16, settle: true }, buttons: ['temp', 'reset'], check: true, checkAbs: [-10, -5], heatEqn: true, tempTable: true,
      readout: ['s', 'ksp', 'solid'], hint: true,
      aria: 'Saturated lead(II) iodide with a temperature slider from 0 to 100 degrees Celsius. On the check, the Ksp mark moves as the temperature changes.' },
    'p3-predict': { scene: { salt: 'PbI2', scoops: 12, settle: true }, predict: true, buttons: ['reset'], check: true, readout: ['s', 'cat', 'an', 'solid'], hint: true,
      aria: 'A saturated salt that follows the chosen prediction card. After the reveal, Run it makes that change.' },
    'p3-try': { scene: { scoops: 12, settle: true }, salts: ['PbI2', 'MgOH2', 'CaCO3'], buttons: ['common', 'acid', 'heat', 'reset'], check: true,
      readout: ['s', 'cat', 'an', 'solid'], link: ['sandbox.html', 'Open the Sandbox'],
      aria: 'A saturated salt with three stresses: add a common ion, add acid, heat.' }
  });


  // ================= Part 4: Qualitative analysis =================
  const Qu = SolQual;
  ion.Br = 'Br<sup>−</sup>'; ion.Sr = 'Sr<sup>2+</sup>'; ion.SO4 = 'SO<sub>4</sub><sup>2−</sup>'; ion.Cu = 'Cu<sup>2+</sup>';
  const PbSO4 = 'PbSO<sub>4</sub>', SrSO4 = 'SrSO<sub>4</sub>', Na2SO4 = 'Na<sub>2</sub>SO<sub>4</sub>';
  const MM = 'M', gmolTxt = ' g/mol';
  // no highlight marks in Part 4 (user, 2026-11-20: the dotted boxes distracted and overlapped things)
  Object.assign(STEPS, {
    // 4.3: a demo, no values (user, 2026-11-20). Each line plays one stage of the picture
    isolate: [
      { lhs: Na2SO4 + ' first: a white solid', note: PbSO4 + ' and ' + SrSO4 + ' both have low solubility, and both are white. We can\'t tell which ion is there',
        speech: 'Sodium sulphate first: a white solid. Lead sulphate and strontium sulphate both have low solubility, and both are white. We can\'t tell which ion is there.' },
      { lhs: 'KI first: a yellow solid', note: 'Only PbI<sub>2</sub> has low solubility, so the solid can only mean ' + ion.Pb + '. ' + ion.Sr + ' and ' + ion.Mg + ' stay dissolved',
        speech: 'K I first: a yellow solid. Only lead iodide has low solubility, so the solid can only mean lead ions. Strontium and magnesium ions stay dissolved.' },
      { lhs: 'Filter', note: 'The PbI<sub>2</sub> stays on the filter paper. The filtrate still has the ' + ion.Sr + ' and ' + ion.Mg,
        speech: 'Filter. The lead iodide stays on the filter paper. The filtrate still has the strontium and magnesium ions.' },
      { lhs: 'Then ' + Na2SO4 + ': a white solid', note: 'The ' + ion.Pb + ' is gone, so this white solid can only mean ' + ion.Sr,
        speech: 'Then sodium sulphate: a white solid. The lead ions are gone, so this white solid can only mean strontium ions.' },
      { lhs: 'One ion at a time', note: 'Each reagent precipitates only one ion, so each solid tells us exactly one ion',
        speech: 'One ion at a time. Each reagent precipitates only one ion, so each solid tells us exactly one ion.' }
    ],
    // 4.4: Ag⁺ added slowly to 0.010 M Cl⁻ and 0.010 M Br⁻ (the values that used to be on 4.3, now with silver halides)
    // 4.4 (user, 2026-11-20): a Q trial for each solid (Q = Ksp where it starts), then a “more than this but less
    // than this” answer. stage: which stage of the picture a line plays (the working lines hold it)
    silver: [
      { lhs: 'AgBr: Q', rhs: '[' + ion.Ag + '][' + ion.Br + '] = ' + KSP, note: 'AgBr starts to precipitate when Q reaches ' + KSP, stage: 1,
        speech: 'For silver bromide, Q equals the silver ion concentration times the bromide concentration, and it starts to precipitate when Q equals K s p.' },
      { rhs: '[' + ion.Ag + '](0.010) = ' + sx(5.4e-13), stage: 1, speech: 'The silver ion concentration times 0.010 equals 5.4 times 10 to the minus 13.' },
      { lhs: '[' + ion.Ag + ']', rhs: sx(5.4e-13) + ' ÷ 0.010', stage: 1, speech: 'The silver ion concentration is 5.4 times 10 to the minus 13 divided by 0.010.' },
      { rhs: sx(5.4e-11) + unit('M'), note: 'More ' + ion.Ag + ' than this: AgBr precipitates', stage: 1, speech: 'equals 5.4 times 10 to the minus 11 molar. More silver ion than this, and silver bromide precipitates.' },
      { lhs: 'AgCl: Q', rhs: '[' + ion.Ag + '][' + ion.Cl + '] = ' + KSP, note: 'AgCl starts to precipitate when Q reaches ' + KSP, stage: 2,
        speech: 'For silver chloride, Q equals the silver ion concentration times the chloride concentration, and it starts to precipitate when Q equals K s p.' },
      { rhs: '[' + ion.Ag + '](0.010) = ' + sx(1.8e-10), stage: 2, speech: 'The silver ion concentration times 0.010 equals 1.8 times 10 to the minus 10.' },
      { lhs: '[' + ion.Ag + ']', rhs: sx(1.8e-10) + ' ÷ 0.010', stage: 2, speech: 'The silver ion concentration is 1.8 times 10 to the minus 10 divided by 0.010.' },
      { rhs: sx(1.8e-8) + unit('M'), note: 'Less ' + ion.Ag + ' than this: no AgCl', stage: 2, speech: 'equals 1.8 times 10 to the minus 8 molar. Less silver ion than this, and no silver chloride forms.' },
      { lhs: sx(5.4e-11) + ' M &lt; [' + ion.Ag + '] &lt; ' + sx(1.8e-8) + ' M', note: 'More than this, but less than this: AgBr precipitates and AgCl does not', stage: 3,
        speech: 'So with a silver ion concentration more than 5.4 times 10 to the minus 11 molar, but less than 1.8 times 10 to the minus 8 molar, silver bromide precipitates and silver chloride does not.' }
    ],
    scheme: [
      { lhs: 'Add KI: yellow solid', note: 'PbI<sub>2</sub>: Q ≫ ' + KSP + ', so ' + ion.Pb + ' is present', walk: 1,
        speech: 'Add K I: a yellow solid. For lead iodide, Q is far greater than K s p, so lead ions are present.' },
      { lhs: 'Filter', note: 'The solid stays on the filter paper. The filtrate has almost no ' + ion.Pb, walk: 2,
        speech: 'Filter. The solid stays on the filter paper, and the filtrate has almost no lead ions.' },
      { lhs: 'Add ' + Na2SO4 + ': stays clear', note: 'Q &lt; ' + KSP + ' for ' + SrSO4 + ' (no ' + ion.Sr + '), and for ' + PbSO4 + ' (' + ion.Pb + ' is gone)', walk: 3,
        speech: 'Add sodium sulphate: it stays clear. Q is less than K s p for strontium sulphate, because there is no strontium, and for lead sulphate, because the lead is gone.' },
      { lhs: 'Add NaOH: white solid', note: MgOH2 + ': Q ≫ ' + KSP + ', so ' + ion.Mg + ' is present', walk: 4,
        speech: 'Add sodium hydroxide: a white solid. For magnesium hydroxide, Q is far greater than K s p, so magnesium ions are present.' },
      { lhs: 'Conclusion: ' + ion.Pb + ' and ' + ion.Mg, note: ion.Sr + ' is absent', walk: 5,
        speech: 'Conclusion: lead and magnesium ions. Strontium ions are absent.' }
    ],
    action: [
      { lhs: 'Canada\'s drinking water limit for lead: 0.005 mg/L', note: 'Health Canada\'s maximum acceptable concentration',
        speech: 'Canada\'s drinking water limit for lead is 0.005 milligrams per litre, Health Canada\'s maximum acceptable concentration.' },
      { lhs: '[' + ion.Pb + ']', rhs: CH(F('0.005 ' + X('mg'), '1 L'), F('1 ' + X('g'), '1000 ' + X('mg')), F('1 mol ' + ion.Pb, '207.2 ' + X('g'))), note: 'mg to g, then the molar mass of lead',
        speech: 'The lead ion concentration equals 0.005 milligrams per litre, times 1 gram per 1000 milligrams, times 1 mole of lead ion per 207.2 grams. Milligrams to grams, then the molar mass of lead.' },
      { rhs: sx(2.4e-8) + unit('M'), speech: 'equals 2.4 times 10 to the minus 8 molar.' },
      { lhs: 'Q', rhs: '(' + sx(2.4e-8) + ')(1.0)<sup>2</sup> = ' + sx(2.4e-8), note: 'With 1.0 M ' + ion.I + '. Just above ' + KSP + ' (' + sx(8.5e-9) + ')', drop: true,
        speech: 'With 1.0 molar iodide, Q is 2.4 times 10 to the minus 8 times 1.0 squared, which is 2.4 times 10 to the minus 8. Just above K s p, 8.5 times 10 to the minus 9.' },
      { lhs: 'PbI<sub>2</sub> formed', rhs: sx(2.4e-8) + ' − ' + sx(8.5e-9), note: 'Moles in 1 L. Only the lead above the K<sub>sp</sub> limit comes out',
        speech: 'Lead iodide formed in 1 litre: 2.4 times 10 to the minus 8, minus 8.5 times 10 to the minus 9 moles. Only the lead above the K s p limit comes out.' },
      { rhs: sx(1.6e-8) + unit('mol'), speech: 'equals 1.6 times 10 to the minus 8 moles.' },
      { lhs: 'Mass', rhs: CH(sx(1.6e-8) + ' ' + X('mol PbI<sub>2</sub>'), F('461 ' + X('g PbI<sub>2</sub>'), '1 ' + X('mol PbI<sub>2</sub>')), F('10<sup>6</sup> µg PbI<sub>2</sub>', '1 ' + X('g PbI<sub>2</sub>'))),
        speech: 'The mass is 1.6 times 10 to the minus 8 moles of lead iodide, times 461 grams per mole, times 1 million micrograms per gram.' },
      { eq: '≈', rhs: '7' + unit('µg'), note: 'Far too little to see', speech: 'which is about 7 micrograms. Far too little to see.' }
    ]
  });
  Object.assign(CHIPS, {
    p4hyp: { prompt: 'An unknown is colourless and could contain any of ' + ion.Pb + ', ' + ion.Sr + ', ' + ion.Mg + ' and ' + ion.Cu + '. Which can we already rule out?',
      options: [{ label: ion.Pb }, { label: ion.Sr }, { label: ion.Mg }, { label: ion.Cu, correct: true }],
      reveal: ion.Cu + '. Its solutions are blue, so a colourless sample can\'t contain much of it. ' + ion.Pb + ', ' + ion.Sr + ' and ' + ion.Mg + ' are all colourless, so we will need tests.' },
    // each choice adds KI by dropper to a beaker of that one ion (user, 2026-11-20: the simulation answers, not a
    // Reveal button). One ion at a time, because with Pb²⁺ in the beaker any KI would bring down PbI₂.
    p4sel: { prompt: 'KI is added to a mixture of ' + ion.Pb + ', ' + ion.Sr + ' and ' + ion.Mg + '. Which solids form? Tap each one to test that ion with KI.', tryEach: true,
      options: [
        { label: 'PbI<sub>2</sub>', correct: true, test: 'Pb2+', result: '<b>PbI<sub>2</sub>:</b> a yellow solid forms.' },
        { label: 'SrI<sub>2</sub>', test: 'Sr2+', result: '<b>SrI<sub>2</sub>:</b> no solid. ' + ion.Sr + ', ' + ion.K + ' and ' + ion.I + ' stay dissolved.' },
        { label: 'MgI<sub>2</sub>', test: 'Mg2+', result: '<b>MgI<sub>2</sub>:</b> no solid. ' + ion.Mg + ', ' + ion.K + ' and ' + ion.I + ' stay dissolved.' }],
      reveal: 'Only PbI<sub>2</sub> forms. Iodides are soluble except with Ag<sup>+</sup>, ' + ion.Pb + ' and Cu<sup>+</sup>.' },
    // the question the steps answer: a card with no choices and no Reveal (plain)
    p4ag: { plain: true, prompt: ion.Ag + ' is added slowly to a solution with 0.010 M ' + ion.Cl + ' and 0.010 M ' + ion.Br + '. At what [' + ion.Ag + '] would one precipitate and not the other?', options: [] },
    p4note: { title: 'A note to the facilities manager', prompt: 'Write it in your notebook using the frame: what I would test; what a result would show, and what it wouldn\'t; what I recommend.',
      options: [], revealLabel: 'Show one possible answer', reveal: '“A KI precipitation test could show very high lead, but water at the legal limit would still look clear, so a clear result doesn\'t mean the water is safe. I recommend sending samples to an accredited lab that measures lead with an instrument. Until the results come back, run the taps before use and use a filter certified for lead.”' }
  });
  const CAREERS = [
    { title: 'Water-quality technician', line: 'Tests drinking water from wells, reservoirs and older buildings for metals such as lead.',
      icon: '<path d="M32 8 C22 22 16 30 16 38 a16 16 0 0 0 32 0 c0-8-6-16-16-30z" fill="#e3f1fb" stroke="#1d2433" stroke-width="3" stroke-linejoin="round"/><path d="M24 40 a8 8 0 0 0 8 8" fill="none" stroke="#7fb3d9" stroke-width="3" stroke-linecap="round"/>' },
    { title: 'Mining assayer', line: 'Finds out which metals are in rock samples, and how much, so a company knows whether a deposit is worth mining.',
      icon: '<path d="M8 52 L24 26 L34 38 L42 28 L56 52 Z" fill="#d9dee7" stroke="#1d2433" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="44" r="3" fill="#e0b84a"/><circle cx="26" cy="46" r="2.5" fill="#e0b84a"/>' },
    { title: 'Forensic chemist', line: 'Identifies unknown substances from a scene, where the result may be used in court.',
      icon: '<circle cx="27" cy="27" r="14" fill="#fff" stroke="#1d2433" stroke-width="3"/><path d="M37 37 L54 54" stroke="#1d2433" stroke-width="5" stroke-linecap="round"/><path d="M21 27 h12" stroke="#7fb3d9" stroke-width="3" stroke-linecap="round"/>' },
    { title: 'Environmental lab analyst', line: 'Checks soil and runoff near industry for ions that could harm fish or plants.',
      icon: '<path d="M14 50 C14 26 30 12 52 12 C52 34 38 50 14 50 Z" fill="#cfe8c9" stroke="#1d2433" stroke-width="3" stroke-linejoin="round"/><path d="M14 50 L40 24" stroke="#1d2433" stroke-width="2.5" stroke-linecap="round"/>' }
  ];
  Object.assign(PRESETS, {
    'p4-brief': { kind: 'brief', part: 4, tpl: 'tplQual', aria: 'Part 4: what this Part is aiming for.' },
    'p4-unknown': { pic: 'unknown', chips: ['p4hyp'],
      aria: 'A test tube of clear liquid labelled Unknown, beside four ion cards: lead, strontium and magnesium ions are colourless; copper(II) is blue.' },
    'p4-selective': { qual: true, buttons: ['qualKI', 'reset'], chips: ['p4sel'], check: true, hint: true,
      note: 'SrI<sub>2</sub> and MgI<sub>2</sub>: soluble by the rules, so they never form.',
      aria: 'A large beaker of water with lead, strontium and magnesium ions. Testing each ion with potassium iodide from a dropper: only lead ions form a yellow solid; strontium, magnesium, potassium and iodide ions stay dissolved.' },
    'p4-order': { pic: 'isolate', steps: 'isolate', stepsBare: true,
      aria: 'Two test tubes of lead, strontium and magnesium ions. Sodium sulphate first gives a white solid that could be lead or strontium. Potassium iodide first gives a yellow solid of lead iodide only; it is filtered off, then sodium sulphate gives a white solid that can only be strontium.' },
    'p4-silver': { pic: 'silver', chips: ['p4ag'], steps: 'silver',
      aria: 'A test tube of chloride and bromide ions beside a scale of silver ion concentration marking where silver bromide and silver chloride start to precipitate. Between the two marks, silver nitrate is added and only cream silver bromide forms.' },
    'p4-scheme': { pic: 'walk', steps: 'scheme', fixedChecks: 'walk',
      aria: 'An unknown that may contain lead, strontium and magnesium ions. The experiment as a flowchart beside a test tube that follows it: potassium iodide, filter, sodium sulphate, filter, then sodium hydroxide.' },
    'p4-careers': { kind: 'careers', aria: 'Four career tiles: water-quality technician, mining assayer, forensic chemist, environmental lab analyst.' },
    'p4-action': { pic: 'tap', steps: 'action', fixedChecks: 'action', chipsAfter: ['p4note'],
      aria: 'A tap above a test tube. Potassium iodide is added and the tube stays clear; on the check, Q is just above Ksp.' }
  });
  // 4.4: the example unknown (Pb²⁺ and Mg²⁺) at each line of the walk-through
  function walkData() {
    const run = Qu.start(['Pb2+', 'Mg2+']), out = [{ tube: {}, active: 0, results: [], checks: [] }];
    const col = r => r.colour ? tok(r.colour) : null;
    const chk = r => r.checks.map(c => ({ id: c.id, q: c.q, ksp: c.ksp }));
    const r0 = Qu.add(run, 0);
    out.push({ tube: { solid: { colour: col(r0), mg: r0.solids.PbI2 }, fresh: true, drop: 'KI' }, active: 0, results: [], checks: chk(r0) });
    Qu.filter(run);
    out.push({ tube: { filtered: { colour: col(r0), mg: r0.solids.PbI2 } }, active: 1, results: ['Pb²⁺ present'], checks: chk(r0) });
    const r1 = Qu.add(run, 1);
    out.push({ tube: { drop: 'Na₂SO₄' }, active: 1, results: ['Pb²⁺ present'], checks: chk(r1) });
    const r2 = Qu.add(run, 2);
    out.push({ tube: { solid: { colour: col(r2), mg: r2.solids.MgOH2 }, fresh: true, drop: 'NaOH' }, active: 2, results: ['Pb²⁺ present', 'no Sr²⁺'], checks: chk(r2) });
    out.push({ tube: { solid: { colour: col(r2), mg: r2.solids.MgOH2 } }, active: 3, results: ['Pb²⁺ present', 'no Sr²⁺', 'Mg²⁺ present'], checks: chk(r2), result: 'Pb²⁺ and Mg²⁺ (no Sr²⁺)' });
    return out;
  }
  let cssTok = null;
  function tok(n) { if (!cssTok) cssTok = getComputedStyle(document.documentElement); return cssTok.getPropertyValue(n).trim(); }

  // ---------- stage state ----------
  const stage = $('stage'), cv = $('cv'), g = cv.getContext('2d'), tools = $('tools');
  const beats = Array.from(document.querySelectorAll('.guide-beat'));
  // number each section within its Part (1.1, 1.2, … user, 2026-11-20), before any menu or badge reads the labels.
  // Before we begin is the Part's intro and stays unnumbered. Done here so adding or removing a section renumbers itself
  const secCount = {};
  beats.forEach(b => {
    if (b.classList.contains('brief-beat')) return;
    const p = b.dataset.part, num = p + '.' + (secCount[p] = (secCount[p] || 0) + 1);
    b.dataset.num = num;
    const h = b.querySelector('h2'); if (h) h.insertAdjacentHTML('afterbegin', num + ' ');
    if (b.dataset.nav) b.dataset.nav = num + ' ' + b.dataset.nav;
    if (b.dataset.badge) b.dataset.badge = num + ' ' + b.dataset.badge;
  });
  // each Part's Before you begin block opens with a list of the Part's sections
  document.querySelectorAll('.guide-part').forEach(part => {
    const list = document.createElement('ul');
    list.className = 'part-nav';
    const first = part.querySelector('.guide-beat');
    list.setAttribute('aria-label', 'Part ' + first.dataset.part + ' sections');
    part.querySelectorAll('.guide-beat').forEach(x => {
      const li = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + x.id; link.textContent = x.dataset.nav;
      li.appendChild(link); list.appendChild(li);
    });
    first.insertBefore(list, first.firstElementChild);
  });
  let active = null, cur = null; // cur: { preset, tab, scenes, steps, readout, check, picMarks, salt, hot, acted, run }

  function makeScene(cfg) {
    const sc = SolScene.create({ salt: cfg.salt, volume: 0.100, showIons: cfg.showIons, minOwn: cfg.minOwn, dropper: cfg.dropper, maxIons: cfg.maxIons, base: cfg.base });
    if (cfg.scoops) sc.scoop(cfg.scoops);
    if (cfg.settle) sc.settle();
    sc.warm(cfg.scoops ? 3 : 0.5);
    return sc;
  }
  function clearStage() {
    tools.innerHTML = ''; $('html').innerHTML = ''; $('btns').innerHTML = '';
    document.querySelectorAll('.sg-ro-under').forEach(e => e.remove());
    $('html').hidden = true; $('btns').hidden = true; $('cvWrap').hidden = false;
  }
  // On a wide screen, Before you begin is its own full-width block with no stage beside it, so it hands
  // the stage to the Part's first section; the stage sits in that Part's block, ready before it scrolls in.
  // Presentation view and narrow screens (stage on top of the page) keep Before you begin on the stage.
  const wideMQ = matchMedia('(min-width:861px)');
  function stageTarget(b) {
    if (!b || !b.classList.contains('brief-beat') || !wideMQ.matches || document.body.classList.contains('learn-mode')) return b;
    return b.closest('.guide-part').querySelector('.part-beats .guide-beat') || b;
  }
  function placeStage() {
    const dock = (wideMQ.matches && active && active.closest('.guide-part').querySelector('.part-body .stage-dock')) || $('stageDockTop');
    if (stage.parentNode !== dock) { dock.appendChild(stage); requestAnimationFrame(fit); }
  }
  function applyBeat(b) {
    b = stageTarget(b);
    if (!b || b === active) return;
    beats.forEach(x => x.classList.toggle('is-active', x === b));
    active = b;
    placeStage();
    $('badge').textContent = b.dataset.badge || '';
    const p = PRESETS[b.id] || {};
    cur = { preset: p, tabIdx: 0, scenes: [], steps: null, readout: null, check: null, picMarks: new Set(), run: 0 };
    buildTabs(p);
    loadTab();
  }
  function buildTabs(p) {
    const host = $('tabs'); host.innerHTML = '';
    host.hidden = !p.tabs && !p.salts;
    host.setAttribute('aria-label', p.salts ? 'Choose a salt' : 'Choose an example');
    if (p.salts) {
      p.salts.forEach(id => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = S[id].html; b.dataset.salt = id;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => switchSalt(id));
        host.appendChild(b);
      });
      return;
    }
    if (!p.tabs) return;
    p.tabs.forEach((t, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = t.label;
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => { cur.tabIdx = i; syncTabs(); loadTab(); });
      host.appendChild(b);
    });
  }
  function syncTabs() {
    Array.from($('tabs').children).forEach((b, i) => b.setAttribute('aria-pressed', String(b.dataset.salt ? b.dataset.salt === cur.salt : i === cur.tabIdx)));
  }

  // one tab (or the whole preset when there are no tabs)
  function loadTab() {
    clearStage();
    const p = cur.preset, t = p.tabs ? p.tabs[cur.tabIdx] : p;
    cur.view = t; cur.scenes = []; cur.picMarks = new Set(); cur.readout = null; cur.check = null; cur.steps = null; cur.mix = null; cur.tubes = null;
    cur.salt = p.salts ? p.salts[0] : t.scene && t.scene.salt; cur.hot = false; cur.acted = new Set(); cur.run++; cur.tempTable = null; cur.readoutHost = null; cur.fixed = null; cur.walk = null; cur.pstage = null; cur.icePhase = null; cur.liveIce = null; cur.compare = null; cur.anim = 0; cur.drop = -1; cur.t0 = performance.now();
    cur.stage = (t.pic === 'concDilute' || t.pic === 'concMass' || t.pic === 'labCond' || t.pic === 'isolate' || t.pic === 'silver') ? { shown: 0, at: performance.now() } : null; // a picture that moves one stage per worked step
    cv.setAttribute('aria-label', t.aria || p.aria || '');
    $('sgGrid').classList.toggle('no-tools', false);
    if (p.kind === 'brief') return loadBrief(p);
    if (p.kind === 'rules') return loadRules();
    if (p.kind === 'careers') return loadCareers();
    if (t.qual) cur.scenes = [makeQualScene()];
    if (t.pic === 'walk') cur.walk = walkData();
    if (t.scene) cur.scenes = [sceneNow()];
    if (p.salts) syncTabs();
    if (p.kind === 'two') cur.scenes = p.two.map(id => makeScene({ salt: id, scoops: 3, settle: true }));
    if (p.kind === 'tubes') cur.tubes = makeTubes();
    const mixSpec = t.mix || p.mix;
    if (mixSpec) cur.mix = { spec: mixSpec, t: 0, state: 'ready', hold: false };
    const saltOf = () => cur.scenes[0] ? cur.scenes[0].saltId : mixSpec && mixSpec.salt;
    renderButtons();
    // tools beside (or under) the picture, in teaching order: predict first, then the check, the steps, the readout
    const chips = t.chips || p.chips;
    if (chips) chips.forEach(c => U.chip(tools, chipSpec(CHIPS[c])));
    if ((t.check || p.check) && saltOf()) {
      const host = document.createElement('div'); tools.appendChild(host);
      cur.check = U.qvkForSalt(host, D, saltOf(), p.checkAbs ? { abs: p.checkAbs } : null);
      if (p.checkLast) { host.className = 'ro-last'; cur.readoutHost = host; } // shown once Q is compared with Ksp
      if (p.heatEqn) { const e = U.dissolvingEquation(D, saltOf()); cur.check.setEquation('heat + ' + e.left, e.right); }
    }
    if (p.liveIce && cur.scenes[0]) cur.liveIce = makeLiveIce();
    if (p.compare && cur.scenes[0]) cur.compare = makeCompare();
    if (p.tempTable) { cur.tempTable = makeTempTable(); cur.tempTable(25); }
    if (p.fixedChecks) makeFixedChecks(p.fixedChecks);
    if (p.note) { const n2 = document.createElement('p'); n2.className = 'sg-note'; n2.innerHTML = p.note; tools.appendChild(n2); }
    const stepsKey = t.steps || p.steps;
    if (stepsKey) {
      // stepsBare (4.3): no lines, just Next / Back under the picture; the teacher does the talking (user, 2026-11-20)
      const host = document.createElement('div'); host.className = 'sg-steps' + (p.stepsBare ? ' sg-steps-bare sg-ro-under' : '');
      if (p.stepsBare) $('btns').before(host); else tools.appendChild(host);
      cur.steps = U.steps(host, STEPS[stepsKey], { onStep, ice: ICE[stepsKey], mix: MIXT[stepsKey] });
    }
    if (p.chipsAfter) {
      // chipsUnder: the questions sit under the picture, which has room to spare, so the column keeps the checks and steps (4.3)
      let host = tools;
      if (p.chipsUnder) { host = document.createElement('div'); host.className = 'sg-chips-under'; tools.appendChild(host); }
      p.chipsAfter.forEach(c => U.chip(host, CHIPS[c]));
    }
    if (p.checkLast) syncReadoutLast();
    if ((t.readout || p.readout) && cur.scenes[0]) {
      cur.readoutHost = document.createElement('div'); tools.appendChild(cur.readoutHost);
      if (t.readoutLast || p.readoutLast) cur.readoutHost.className = 'ro-last'; // presentation view keeps its space while hidden
      makeReadout();
      syncReadoutLast();
    }
    if (p.predict) makePredict();
    if ((p.hint || storyEnd() != null) && !p.noHint) { // noHint: the picture keeps the whole stage
      const h = document.createElement('p'); h.className = 'sg-hint';
      h.textContent = storyEnd() != null ? 'Tap the picture to skip to the end, or to play it again.' : 'Tap the picture to skip to the end.';
      tools.appendChild(h);
    }
    if (p.link) {
      const a = document.createElement('a'); a.className = 'btn primary sg-link'; a.href = p.link[0]; a.textContent = p.link[1] + ' →';
      if (p.linkUnder) { const u = document.createElement('div'); u.className = 'sg-link-under'; u.appendChild(a); tools.appendChild(u); } // the column is full
      else tools.appendChild(a);
    }
    placeUnder();
    $('sgGrid').classList.toggle('no-tools', !tools.children.length);
    tools.classList.toggle('show-notes', !!p.notes);
    tools.classList.toggle('ice-tight', !!p.iceTight); // the Ksp sections keep their explanations in presentation view
    fit();
    sizeStepsBox();
  }
  // presentation view: questions and links marked "under" sit below the picture, where there is room; the scrolling
  // view keeps them at the end of the column, after the steps they follow
  function placeUnder() {
    document.querySelectorAll('.sg-chips-under, .sg-link-under').forEach(el => {
      if (learnOn()) { el.classList.add('sg-ro-under'); $('btns').before(el); }
      else { el.classList.remove('sg-ro-under'); const hint = tools.querySelector('.sg-hint'); tools.insertBefore(el, hint); }
    });
  }
  // presentation view: the steps box is as tall as all its lines together (measured with every line shown, the
  // readout that waits for the last step included), so it never has spare space and its buttons never move
  function sizeStepsBox() {
    const ol = tools.querySelector('.ws-lines:not(.is-live)'), bar = tools.querySelector('.ws-bar'); if (!ol) return;
    ol.style.height = ol.style.width = ''; if (bar) bar.style.width = '';
    if (!learnOn()) return;
    const lis = Array.from(ol.children), was = lis.map(li => li.hidden), empty = ol.classList.contains('is-empty'), top = ol.scrollTop;
    lis.forEach(li => { li.hidden = false; }); ol.classList.remove('is-empty');
    ol.style.flex = 'none'; ol.style.height = 'auto';
    const h = ol.scrollHeight + 4, w = ol.getBoundingClientRect().width;
    lis.forEach((li, i) => { li.hidden = was[i]; }); if (empty) ol.classList.add('is-empty');
    ol.style.flex = ''; ol.style.height = h + 'px'; ol.style.width = w + 'px';
    if (bar) bar.style.width = w + 'px';
    ol.scrollTop = top; // measuring with no scroll set it to 0: keep the newest line in view
    const curLi = ol.querySelector('.ws-line.is-current');
    if (curLi && curLi.offsetTop + curLi.offsetHeight > ol.scrollTop + ol.clientHeight) ol.scrollTop = curLi.offsetTop + curLi.offsetHeight - ol.clientHeight + 8;
  }

  // mol/L of the salt's own ion that a reagent has put in the beaker (the common ion, before the salt dissolves)
  function fromReagent(sc, reagent) {
    const s = S[sc.saltId], k = D.REAGENTS[reagent].ions.map(x => x[0]).find(i => i === s.cat[0] || i === s.an[0]);
    return k ? ((sc.beaker.fromReagent[k] || 0) + (sc.pendingMol ? sc.pendingMol(k) : 0)) / sc.beaker.V : 0; // counted from the press, while its drops fall
  }
  // 3.2: a live ICE table for PbI2 and the Ksp expression solved under it. The I row is the common ion added so far
  // (0.10 M a press); C and E keep x, so the class sees how it would be worked out. Rewritten only when the I row changes.
  function makeLiveIce() {
    const s = S.PbI2, wrap = document.createElement('div'); wrap.className = 'live-ice';
    tools.appendChild(wrap);
    const two = v => n(v, { sig: 2 }), x3 = v => n(v, { sci: 'always', sig: 3, unit: 'mol/L' });
    const ans = v => ' <span class="ua-step">= ' + x3(v) + '</span>'; // the answer moves to a new line as one piece
    const op = t => '<td class="ice-op">' + t + '</td>', hop = t => '<th class="ice-op">' + t + '</th>', cell = (v, on) => '<td' + (on ? ' class="ice-added"' : '') + '>' + v + '</td>', dash = '<td class="ice-solid">' + DASH + '</td>';
    let key = '';
    return function (sc) {
      const a = fromReagent(sc, 'PbNO32'), b = fromReagent(sc, 'KI'), k = a.toFixed(5) + '|' + b.toFixed(5);
      if (k === key) return; key = k;
      const I = [a ? two(a) : '0', b ? two(b) : '0'], Er = [a ? two(a) + ' + x' : 'x', b ? two(b) + ' + 2x' : '2x'];
      const row = (r, v, cls, on) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th class="ice-key">' + r + '</th>' + dash + op('') + cell(v[0], on && a) + op('') + cell(v[1], on && b) + '</tr>';
      const table = '<div class="ice-wrap"><table class="ice"><thead><tr><th class="ice-unit">(mol/L)</th><th class="ice-solid">' + PbI2 + '(s)</th>' + hop('⇌') +
        '<th><span class="qk-cat">' + ion.Pb + '</span></th>' + hop('+') + '<th><span class="qk-an">2 ' + ion.I + '</span></th></tr></thead><tbody>' +
        row('I', I, '', true) + row('C', ['+x', '+2x']) + row('E', Er, 'is-used') + '</tbody></table></div>';
      // which shortcut applies: no common ion is 4x³ as in pure water; otherwise x is tiny next to the added ion
      let lines, x;
      const L = (lhs, eq, rhs, note) => '<li class="ws-line"><span class="ws-lhs">' + lhs + '</span><span class="ws-eq">' + eq + '</span><span class="ws-rhs">' + rhs + '</span>' + (note ? '<span class="ws-note">' + note + '</span>' : '') + '</li>';
      if (!a && !b) {
        x = Math.cbrt(s.ksp / 4);
        lines = [L(sx(s.ksp), '=', '(x)(2x)<sup>2</sup> = 4x<sup>3</sup>', 'No common ion yet: the same as pure water'),
          L('x', '=', '∛(' + sx(s.ksp) + ' ÷ 4)' + ans(x), 'The molar solubility in pure water')];
      } else if (b) {
        x = s.ksp / (b * b);
        lines = [L(sx(s.ksp), '=', '(x)(' + I[1] + ' + 2x)<sup>2</sup> ≈ (x)(' + I[1] + ')<sup>2</sup>', '2x is tiny next to ' + I[1] + ', so we leave it out'),
          L('x', '=', sx(s.ksp) + ' ÷ ' + two(b * b) + ans(x), ratio(x))];
      } else {
        x = Math.sqrt(s.ksp / (4 * a));
        lines = [L(sx(s.ksp), '=', '(' + I[0] + ' + x)(2x)<sup>2</sup> ≈ (' + I[0] + ')(4x<sup>2</sup>)', 'x is tiny next to ' + I[0] + ', so we leave it out'),
          L('x', '=', '√(' + sx(s.ksp) + ' ÷ ' + two(4 * a) + ')' + ans(x), ratio(x))];
      }
      wrap.innerHTML = table + '<div class="ws"><ol class="ws-lines is-live">' + L(KSP, '=', '[' + ion.Pb + '][' + ion.I + ']<sup>2</sup>') + lines.join('') + '</ol></div>' +
        '<p class="sr-only">' + (a || b ? 'With ' + (b ? two(b) + ' molar iodide' : two(a) + ' molar lead ions') + ' added' : 'With no common ion') +
        ', the molar solubility is ' + sp(x, { sci: 'always', sig: 3, unit: 'mol/L' }) + '.</p>';
    };
    function ratio(x) { const r = sPbI2 / x; return 'About ' + (r < 10 ? Math.round(r) : Number(r.toPrecision(2))) + ' times less soluble than in pure water'; }
  }
  // 3.2: under the picture, the saturated solution as it started (blue) and as it is now (red), so the change shows
  function makeCompare() {
    const sc0 = () => cur.scenes[0], s = S[sc0().saltId], host = document.createElement('div');
    host.className = 'sg-ro-under'; $('btns').before(host);
    const cols = [['Dissolved', 'mol/L'], ['Solid left', 'mg'], ['[' + D.ION[s.cat[0]].html + ']', 'mol/L'], ['[' + D.ION[s.an[0]].html + ']', 'mol/L']];
    const tds = '<td></td>'.repeat(4);
    host.innerHTML = '<table class="ro-compare"><thead><tr><th scope="col"><span class="sr-only">Solution</span></th>' +
      cols.map(c => '<th scope="col">' + c[0] + '<small>' + c[1] + '</small></th>').join('') + '</tr></thead><tbody>' +
      '<tr class="rc-old"><th scope="row">Original solution</th>' + tds + '</tr><tr class="rc-new"><th scope="row">New concentration</th>' + tds + '</tr></tbody></table>';
    const cells = r => Array.from(host.querySelectorAll('.' + r + ' td'));
    const old = cells('rc-old'), now = cells('rc-new');
    const vals = (sc) => { const all = sc.state(), st = all.salts[sc.saltId], c = all.ions;
      return [n(st ? st.s : 0, { sci: 'always' }), n(st ? st.solidG * 1000 : 0, { sig: 3, sci: 'never' }), n(c[s.cat[0]] || 0, { sci: 'always' }), n(c[s.an[0]] || 0, { sci: 'always' })]; };
    const put = (tdsList, v) => tdsList.forEach((td, i) => { if (td.innerHTML !== v[i]) td.innerHTML = v[i]; });
    let base = null;
    return function (sc) {
      if (base !== sc) { base = sc; put(old, vals(sc)); } // a new beaker (load or Start over) is the original, already saturated
      const added = Object.keys(sc.beaker.fromReagent).some(k => sc.beaker.fromReagent[k] > 0);
      put(now, added ? vals(sc) : ['–', '–', '–', '–']);
    };
  }

  // ---------- Part 3: one saturated salt, pushed by a stress ----------
  function sceneNow() { const t = cur.view; return makeScene(Object.assign({}, t.scene, { salt: cur.salt })); }
  function makeReadout() {
    if (!cur.readoutHost) return;
    cur.readoutHost.innerHTML = '';
    cur.readout = U.saltReadout(cur.readoutHost, D, cur.salt, { only: cur.view.readout || cur.preset.readout, mass: cur.view.readoutMass || cur.preset.readoutMass });
  }
  // a fresh saturated beaker of another salt, with the check, readout and stress buttons to match
  function switchSalt(id) {
    cur.salt = id; cur.hot = false; cur.run++;
    cur.scenes = [sceneNow()];
    if (cur.check) cur.check.setSalt(id);
    makeReadout(); renderButtons(); syncTabs();
    if (cur.compare) { document.querySelectorAll('.sg-ro-under').forEach(e => e.remove()); cur.compare = makeCompare(); } // its column heads name this salt's ions
  }
  function startOver() {
    if (cur.mix) return resetMix();
    cur.hot = false; cur.run++; cur.acted = new Set();
    if (!cur.scenes[0]) return;
    if (cur.view.qual) { cur.scenes = [makeQualScene()]; cur.drop = -1; }
    else if (cur.view.scene) cur.scenes = [sceneNow()]; else cur.scenes[0].reset();
    if (cur.steps && STEPS[cur.view.steps || cur.preset.steps].some(l => l.act)) cur.steps.reset();
    renderButtons();
    if (cur.tempTable) cur.tempTable(25);
  }
  // buttons under the picture; the stress buttons follow the salt (its common ions, whether heat applies)
  function renderButtons() {
    const p = cur.preset, t = cur.view, host = $('btns'); host.innerHTML = '';
    const buttons = t.buttons || p.buttons, mixSpec = t.mix || p.mix;
    host.hidden = !buttons;
    if (!buttons) return;
    const sc = () => cur.scenes[0];
    buttons.forEach(k => {
      if (k === 'temp') return host.appendChild(makeSlider());
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn';
      let label = '', run = null, off = '';
      const salt = cur.salt && S[cur.salt];
      if (k === 'scoop') { // the scoop's mass on the button, so the readout's milligrams have a source
        const mg = sc().scoopMol() * S[sc().saltId].molarMass * 1000;
        label = 'Add a scoop (' + U.num(mg, { sig: 2, unit: 'mg' }).text + ')'; run = () => sc().scoop(); }
      else if (k === 'reset') { label = 'Start over'; run = startOver; }
      else if (k === 'mix') { label = 'Mix'; run = () => { resetMix(); pour(false); }; }
      else if (k === 'common' || k === 'common2') {
        const r = salt.commonIons[k === 'common' ? 0 : 1], other = salt.commonIons[k === 'common' ? 1 : 0];
        label = 'Add ' + D.REAGENTS[r].html; run = () => { sc().addReagent(r, DOSE); if (p.oneCommon) renderButtons(); };
        // oneCommon: KI and Pb(NO3)2 together would react before PbI2 dissolves, which the live ICE table doesn't model
        if (p.oneCommon && fromReagent(sc(), other) > 0) off = 'Start over first';
      }
      else if (k === 'acid') { label = 'Add acid'; run = () => sc().acid(p.acidMol, p.acidReagent && p.acidReagent[cur.salt]); }
      else if (k === 'qualKI') { label = 'Add KI'; run = () => { // to the mixture of all three; after a one-ion test (or a first KI), a fresh mixture first
        const fresh = sc().qualIons.length === Qu.ions.length && !(sc().beaker.tot['I-'] > 0) && !(sc().pendingMol('I-') > 0);
        if (fresh) sc().addReagent('KI', Qu.steps[0].excess * Qu.V);
        else { const s2 = makeQualScene(), token = ++cur.run; cur.scenes = [s2]; setTimeout(() => { if (cur.run === token && cur.scenes[0] === s2) s2.addReagent('KI', Qu.steps[0].excess * Qu.V); }, 600); }
      }; }
      else if (k === 'heat') {
        label = cur.hot ? 'Cool to 25 °C' : 'Heat to 80 °C';
        if (!salt.dHsoln) off = PbI2 + ' only';
        run = () => { cur.hot = !cur.hot; sc().setTemperature(cur.hot ? 353.15 : 298.15); renderButtons(); };
      }
      if (p.locked && p.locked[k]) off = 'in ' + p.locked[k];
      b.innerHTML = label + (off ? '<small>' + off + '</small>' : '');
      if (off) b.disabled = true; else b.addEventListener('click', run);
      host.appendChild(b);
    });
  }
  function makeSlider() {
    const wrap = document.createElement('label'); wrap.className = 'sg-temp';
    wrap.innerHTML = '<span>Temperature</span><input type="range" min="0" max="100" step="1" value="25"><output>25 °C</output>';
    const inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    const set = v => {
      out.textContent = v + ' °C'; inp.setAttribute('aria-valuetext', v + ' degrees Celsius');
      if (cur.scenes[0]) cur.scenes[0].setTemperature(v + 273.15);
      if (cur.tempTable) cur.tempTable(v);
    };
    inp.addEventListener('input', () => set(+inp.value));
    set(25);
    return wrap;
  }
  // 3.4 table: Ksp and solubility at four temperatures, from the same ΔH the engine uses; the row nearest the slider lights up
  function makeTempTable() {
    const s = S.PbI2, rows = [25, 50, 80, 100].map(c => {
      const k = D.kspAt(s, c + 273.15), gL = D.molarSolubility(Object.assign({}, s, { ksp: k })) * s.molarMass;
      return '<tr data-t="' + c + '"><th scope="row">' + c + ' °C</th><td>' + n(k, { sci: 'always', sig: 2 }) + '</td><td>' + gL.toFixed(2) + ' g/L</td></tr>';
    }).join('');
    const box = document.createElement('div');
    box.innerHTML = '<table class="temp-table"><caption>' + PbI2 + ' at four temperatures</caption><thead><tr><th scope="col">Temperature</th><th scope="col">' + KSP + '</th><th scope="col">Solubility</th></tr></thead><tbody>' + rows + '</tbody></table>';
    tools.appendChild(box);
    return v => box.querySelectorAll('tr[data-t]').forEach(tr => tr.classList.toggle('is-hot', Math.abs(+tr.dataset.t - v) <= 2));
  }
  // 3.5: nine compact cards; choosing one sets up its salt, and "Run it" (after the reveal) makes the change
  function makePredict() {
    const grid = document.createElement('div'); grid.className = 'pred-chips'; tools.appendChild(grid);
    PRED.forEach(it => {
      const ch = U.chip(grid, { compact: true, title: it.what,
        options: ['More', 'Less', 'No change'].map(o => ({ label: o, correct: o === it.ans })),
        reveal: '<b>' + it.ans + '.</b> ' + it.why + '.',
        onReveal: () => { runB.hidden = false; }, onReset: () => { runB.hidden = true; } }); // runB is made just below
      const runB = document.createElement('button'); runB.type = 'button'; runB.className = 'btn btn-sm chip-run'; runB.textContent = 'Run it'; runB.hidden = true;
      const foot = ch.el.querySelector('.chip-foot'); foot.insertBefore(runB, foot.firstChild);
      const pick = () => {
        grid.querySelectorAll('.chip-card').forEach(c => c.classList.toggle('is-hot', c === ch.el));
        if (cur.salt !== it.salt) switchSalt(it.salt);
      };
      ch.el.addEventListener('click', e => { if (e.target !== runB) pick(); });
      runB.addEventListener('click', () => {
        pick(); switchSalt(it.salt);                        // a fresh saturated beaker, then the change
        const token = cur.run, view = cur.view;
        setTimeout(() => { if (cur.view === view && cur.run === token && cur.scenes[0]) it.run(cur.scenes[0]); }, 700);
      });
    });
  }

  // ---------- Part 4 stage pieces ----------
  // 4.2: a 10 mL tube of Pb²⁺, Sr²⁺ and Mg²⁺ (0.050 M each); the window shows all three
  // ions: which of the three are in the beaker (all three by default; one when a 4.2 choice tests it). K⁺ shows once KI goes in
  function makeQualScene(ions) {
    ions = ions || Qu.ions;
    const sc = SolScene.create({ salt: 'PbI2', volume: Qu.V, showIons: ['Sr2+', 'Mg2+', 'K+'], maxIons: 10, tank: true, dropper: true, maxLayers: 3 });
    sc.dropper = false; // the starting ions are already in the water, not dropped in
    ions.forEach(k => sc.addReagent(Qu.SOURCE[k], D.QUAL.startConc * Qu.V));
    sc.dropper = true;
    sc.settle(); sc.warm(1); // spread through the water from the start
    sc.qualIons = ions.slice();
    return sc;
  }
  // a choice that runs a test on the stage (4.2): its option names the ion; Try again puts the mixture back
  function chipSpec(c) {
    if (!c.tryEach) return c;
    return Object.assign({}, c, { onPick: (i, o) => { if (o.test) qualTest(o.test); }, onReset: () => { if (cur.view.qual) startOver(); } });
  }
  // 4.2: a fresh beaker of one ion, then KI from the dropper a moment later
  function qualTest(ionKey) {
    if (!cur.view.qual) return;
    const sc = makeQualScene([ionKey]), token = ++cur.run;
    cur.scenes = [sc];
    setTimeout(() => { if (cur.run === token && cur.scenes[0] === sc) sc.addReagent('KI', Qu.steps[0].excess * Qu.V); }, 600);
  }
  // checks that show one moment (Q as a reagent goes in), not a live beaker
  function makeFixedChecks(kind) {
    const host = document.createElement('div'); host.className = 'fixed-checks'; tools.appendChild(host);
    cur.fixed = { host, kind, list: [] };
    if (kind === 'walk') setFixedChecks([]);
    else if (kind === 'action') setFixedChecks([{ id: 'PbI2', q: 0, ksp: S.PbI2.ksp, status: 'No KI added yet: Q = 0' }]);
  }
  function setFixedChecks(list) {
    const f = cur.fixed; if (!f) return;
    const key = list.map(c => c.id + c.q).join('|');
    if (f.key === key) return; f.key = key;
    f.host.innerHTML = ''; f.list = [];
    list.forEach(c => {
      const h = document.createElement('div'); f.host.appendChild(h);
      const chk = U.qvkForSalt(h, D, c.id);
      chk.update({ q: c.q, ksp: c.ksp, snap: true, status: c.status });
      chk.el.dataset.salt = c.id;
      f.list.push(chk);
    });
  }
  function loadCareers() {
    $('cvWrap').hidden = true; $('html').hidden = false;
    $('html').innerHTML = '<div class="career-tiles">' + CAREERS.map(c =>
      '<section class="career-tile"><svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false">' + c.icon + '</svg>' +
      '<h3>' + c.title + '</h3><p>' + c.line + '</p><p class="career-ask">What would you ask them?</p></section>').join('') + '</div>' +
      '<p class="notice-ask">Pick one career. What would they need to know about solubility? What question would you ask them?</p>';
    $('sgGrid').classList.add('no-tools');
  }
  // 4.4 picture: the flowchart beside the tube for the current line
  function drawWalk(g) {
    const i = cur.steps ? cur.steps.index : 0, w = cur.walk[i] || cur.walk[0], T = w.tube;
    Pic.scheme(g, 24, 24, 470, { active: w.active, results: w.results, result: w.result });
    const cx = 700, top = 120, h = 330;
    const t = T.fresh ? Math.min(1, (performance.now() - cur.anim) / 1600) : 1;
    if (T.filtered) {
      // filter (user, 2026-11-20: we filter, not centrifuge): the tube tips into a funnel, the solid stays on the paper
      // and the filtrate drips into a clean tube
      const k = cur.anim ? Math.min(1, (performance.now() - cur.anim) / (Pic.FILTER_S * 1000)) : 1;
      Pic.filtering(g, 500, 40, k, { colour: T.filtered.colour, mg: T.filtered.mg, T: (performance.now() - cur.t0) / 1000 });
    } else {
      const opts = { level: 0.78, drop: T.drop ? { t: T.fresh ? Math.min(1, (performance.now() - cur.anim) / 500) : 1, label: T.drop } : null };
      if (T.solid) { if (T.fresh) opts.cloud = { colour: T.solid.colour, mg: T.solid.mg, t }; else opts.solid = T.solid; }
      Pic.tube(g, cx, top, 86, h, opts);
      if (!T.solid && i > 0) Pic.label(g, 'stays clear', cx, top + h + 40, { size: 17, mono: true });
      // before the first step: the task, what could be in the tube (user, 2026-11-24)
      if (i === 0) { Pic.label(g, 'our unknown', cx, top + h + 34, { size: 17, mono: true }); Pic.label(g, 'Pb²⁺?  Sr²⁺?  Mg²⁺?', cx, top + h + 60, { size: 17, weight: '400' }); }
      if (T.solid) Pic.label(g, (T.solid.colour === tok('--ppt-pbi2') ? 'yellow' : 'white') + ' solid', cx, top + h + 40, { size: 17, mono: true });
    }
  }
  function drawQual(g) {
    // one big beaker of particles across the whole picture (user, 2026-11-20: no test tube, no zoom window)
    const sc = cur.scenes[0];
    sc.draw(g, { tank: { x: 235, y: 22, w: 430, h: 462 } });
    const names = { 'Pb2+': 'Pb²⁺', 'Sr2+': 'Sr²⁺', 'Mg2+': 'Mg²⁺' }, list = (sc.qualIons || Qu.ions).map(k => names[k]);
    const iodide = sc.beaker.tot['I-'] > 0 ? ' + KI' : '';
    Pic.label(g, (list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0]) + iodide + ' in water (not to scale)', 450, 512, { size: 16, mono: true, weight: '400' });
  }
  // ---------- mixing two solutions ----------
  // pour(hold): the two beakers empty into the mixed one over ~1.2 s. hold = true keeps the chemistry still
  // (Q stays at its just-mixed value) until a worked step with react: true, so the class sees Q before it falls.
  const POUR_S = 7; // seconds: lift, tip, drain, set back (the equation morph in the steps panel takes the same time; user: slower)
  function pour(hold) {
    if (!cur.mix || cur.mix.state !== 'ready') return;
    cur.mix.state = 'pouring'; cur.mix.hold = hold; cur.mix.t = 0;
  }
  function finishPour() {
    const spec = cur.mix.spec;
    const sc = SolScene.create({ salt: spec.salt, volume: 0.100 });
    sc.loadBeaker(E.mix(spec.parts));
    sc.chemRate = cur.mix.hold ? 0 : (spec.rate || 0.35);
    if (!cur.mix.hold && !cur.mix.reactAt) cur.mix.reactAt = performance.now();
    sc.warm(0.4);
    sc.marks = new Set([...cur.picMarks].filter(k => k === 'cat' || k === 'an' || k === 'solid'));
    cur.scenes = [sc]; cur.mix.state = 'mixed'; cur.mix.t = 1;
  }
  function resetMix() { if (!cur.mix) return; cur.mix.state = 'ready'; cur.mix.t = 0; cur.mix.reactAt = 0; cur.scenes = []; }
  function react() {
    const sc = cur.scenes[0]; if (!sc || !cur.mix) return;
    cur.mix.hold = false; sc.chemRate = cur.mix.spec.rate || 0.35;
    if (!cur.mix.reactAt) cur.mix.reactAt = performance.now();
  }
  // the three evidence tubes, each a real mix settled by the engine
  function makeTubes() {
    const colour = getComputedStyle(document.documentElement).getPropertyValue('--ppt-pbi2').trim();
    return TUBES.map(tb => {
      const b = E.mix(tb.parts); b.settle();
      const mg = b.state().salts.PbI2.solidG * 1000;
      // what went in, written over the tube (user, 2026-11-24): '50.0 mL of 0.0020 M Pb(NO₃)₂', '+ 50.0 mL of …'
      const mixed = tb.parts.map((p, i) => (i ? '+ ' : '') + (p.vol * 1000).toFixed(1) + ' mL of ' + p.name);
      return { caption: tb.caption, mixed, colour, solidMg: tb.haze ? 0 : mg, haze: tb.haze ? 0.35 : 0 };
    });
  }
  // a worked step lights up part of the picture
  // readoutLast: the readout stays hidden until every worked step is shown (the numbers are the answer)
  // In presentation view it sits at the end of the steps box, so the buttons below the box never move.
  function syncReadoutLast() {
    if (!cur || !cur.readoutHost || !(cur.view.readoutLast || cur.preset.readoutLast || cur.preset.checkLast)) return;
    const done = !!cur.steps && cur.steps.index >= STEPS[cur.view.steps || cur.preset.steps].length;
    cur.readoutHost.hidden = !done;
    const ol = tools.querySelector('.ws-lines');
    if (document.body.classList.contains('learn-mode') && ol) {
      let li = ol.querySelector('.ws-ro');
      if (!li) { li = document.createElement('li'); li.className = 'ws-ro'; ol.appendChild(li); }
      if (cur.readoutHost.parentNode !== li) li.appendChild(cur.readoutHost);
      li.hidden = !done;
      if (done) { const last = li.previousElementSibling; ol.scrollTop = last ? last.offsetTop - 8 : ol.scrollHeight; } // the answer on top, the readout under it
    } else if (cur.readoutHost.parentNode !== tools) {
      const li = cur.readoutHost.parentNode, after = tools.querySelector('.sg-steps');
      tools.insertBefore(cur.readoutHost, after ? after.nextSibling : null);
      if (li && li.classList.contains('ws-ro')) li.remove();
    }
  }
  // iceScene: the beaker follows the ICE rows. Up to I: solid in pure water, nothing dissolved (chemistry paused).
  // C: it dissolves, slowly enough to watch. E: saturated, ions leave and join the crystal at the same rate.
  // Stepping back to an earlier row starts the beaker again from that row.
  function syncIceScene(i) {
    if (!(cur.view.iceScene || cur.preset.iceScene) || !cur.scenes[0]) return;
    const lines = STEPS[cur.view.steps || cur.preset.steps], at = k => lines.findIndex(l => l.ice === k);
    const phase = i >= at('E') ? 'E' : i >= at('C') ? 'C' : 'I', was = cur.icePhase;
    if (phase === was) return;
    cur.icePhase = phase;
    const salt = cur.scenes[0].saltId;
    const fresh = () => { const sc = SolScene.create({ salt, volume: 0.100 }); sc.scoop(3); sc.chemRate = 0; sc.warm(0.5); return sc; };
    if (phase === 'I') cur.scenes[0] = fresh();
    else if (phase === 'C') { if (was !== 'I') cur.scenes[0] = fresh(); cur.scenes[0].chemRate = 0.3; }
    else if (was === 'C') cur.scenes[0].chemRate = 1;
    else cur.scenes[0] = makeScene({ salt, scoops: 3, settle: true });
  }
  function onStep(i, line) {
    syncReadoutLast();
    syncIceScene(i);
    const upTo = cur.steps ? STEPS[(cur.view.steps || cur.preset.steps)].slice(0, i + 1) : [];
    const lastWith = k => { for (let j = upTo.length - 1; j >= 0; j--) if (upTo[j][k]) return upTo[j][k]; return null; };
    const marks = new Set(line && line.mark ? line.mark : []);
    cur.picMarks = marks;
    // a step can switch the salt in the picture (Ksp: AgCl first, then PbI₂)
    const want = lastWith('salt') || (cur.view.scene && cur.view.scene.salt);
    const sc = cur.scenes[0];
    if (sc && want && sc.saltId !== want) {
      cur.scenes[0] = makeScene({ salt: want, scoops: 3, settle: true }); cur.salt = want;
      if (cur.check) { cur.check.setSalt(want); }
    }
    // a step can change the beaker (3.2: the KI goes in); stepping back before it starts the beaker again
    const lines = STEPS[cur.view.steps || cur.preset.steps] || [];
    if (lines.some(l => l.act) && cur.scenes[0]) {
      if ([...cur.acted].some(j => j > i)) { cur.scenes = [sceneNow()]; cur.acted = new Set(); }
      lines.forEach((l, j) => { if (l.act && j <= i && !cur.acted.has(j)) { ACT[l.act](cur.scenes[0]); cur.acted.add(j); } });
    }
    if (cur.mix) {
      const all = STEPS[(cur.view.steps || cur.preset.steps)];
      const pourAt = all.findIndex(l => l.pour), reactAt = all.findIndex(l => l.react);
      if (pourAt >= 0 && i >= pourAt) pour(true);
      if (pourAt >= 0 && i < pourAt && cur.mix.state !== 'ready') resetMix();
      if (reactAt >= 0 && i >= reactAt) { if (cur.mix.state === 'ready') pour(false); else if (cur.mix.state === 'pouring') cur.mix.hold = false; else react(); }
      // back from the Q vs Ksp step: the poured mixture again, ions still dissolved
      if (reactAt >= 0 && pourAt >= 0 && i >= pourAt && i < reactAt && cur.mix.state === 'mixed' && !cur.mix.hold) { cur.mix.hold = true; cur.mix.reactAt = 0; finishPour(); }
    }
    if (cur.check) cur.check.el.classList.toggle('is-marked', marks.has('check'));
    if (cur.stage && cur.stage.shown !== i + 1) cur.stage = { shown: i + 1, at: i + 1 === cur.stage.shown + 1 ? performance.now() : -1e9 }; // one step forward plays; back or Show all jumps
    if (cur.walk) { const w = cur.walk[i + 1] || cur.walk[0]; setFixedChecks(w.checks); if (w.tube.fresh || w.tube.filtered) cur.anim = performance.now(); }
    if (cur.fixed && cur.fixed.kind === 'action') {
      const on = lines.slice(0, i + 1).some(l => l.drop);
      setFixedChecks([on ? { id: 'PbI2', q: 2.4e-8, ksp: S.PbI2.ksp, status: 'Q > Ksp, but very little solid forms' } : { id: 'PbI2', q: 0, ksp: S.PbI2.ksp, status: 'No KI added yet: Q = 0' }]);
      if (on && cur.drop < 0) cur.drop = performance.now(); if (!on) cur.drop = -1;
    }
    if (cur.fixed) cur.fixed.list.forEach(c => c.el.classList.toggle('is-marked', marks.has(c.el.dataset.salt) || marks.has('check') || marks.has('checks')));
    // keep the newest line in view when the tools column (or the stage) scrolls
    requestAnimationFrame(() => {
      const el = tools.querySelector('.ws-line.is-current'); if (!el) return;
      const box = getComputedStyle(tools).overflowY === 'auto' ? tools : stage;
      const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r.bottom > b.bottom - 8) box.scrollTop += r.bottom - b.bottom + 16;
      else if (r.top < b.top + 8) box.scrollTop -= b.top - r.top + 16;
    });
    cur.scenes.forEach(s => { s.marks = new Set([...marks].filter(k => k === 'cat' || k === 'an' || k === 'solid')); s.legend = lastWith('legend'); });
    if (cur.readout) cur.readout.el.classList.toggle('is-marked', marks.has('readout'));
  }

  // ---------- HTML pictures ----------
  function loadBrief(p) {
    $('cvWrap').hidden = true; $('html').hidden = false;
    const art = active, heads = beats.filter(b => b.dataset.part === String(p.part) && b !== art).map(b => b.querySelector('h2').innerHTML);
    const wrap = document.createElement('div'); wrap.className = 'sg-brief';
    wrap.innerHTML = '<div class="sg-brief-pic">' + $(p.tpl || 'tplDissolve').innerHTML + '</div>' +
      '<div class="scroll-only"><p><strong>In this Part</strong></p><ol class="sg-brief-list">' + heads.map(h => '<li>' + h + '</li>').join('') + '</ol></div>' +
      '<div class="learn-only"><h2>' + art.querySelector('h2').innerHTML + '</h2></div>';
    wrap.querySelector('.learn-only').appendChild(art.querySelector('.brief-cols').cloneNode(true));
    $('html').appendChild(wrap);
    $('sgGrid').classList.add('no-tools');
  }
  // no table on the stage (teacher, 2026-11-18): students use the Data Booklet, and the cards fill the stage
  function loadRules() {
    $('cvWrap').hidden = true; $('html').hidden = false;
    $('html').innerHTML = '<div class="rules-wrap"><p class="rules-find">Find the rules in your Chemistry Data Booklet on page 4.</p>' +
      '<p class="sg-hint">“Soluble” means more than 0.1 mol/L at 25 °C.</p><div class="rules-chips"></div></div>';
    const grid = $('html').querySelector('.rules-chips');
    D.RULE_CHIPS.forEach(c => U.chip(grid, { compact: true, instant: true, title: sub(c.formula),
      options: [{ label: 'Soluble', correct: c.soluble }, { label: 'Low solubility', correct: !c.soluble }],
      reveal: c.why })); // the ✓ on the button already says which; "Correct." / "Not quite." comes from the chip
    $('sgGrid').classList.add('no-tools');
  }
  // ---------- drawing ----------
  let dpr = 1, cw = 0, ch = 0;
  function fit() {
    const r = $('cvWrap').getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    draw(); // resizing clears the canvas, so paint again at once
  }
  function drawTwo(g) {
    cur.scenes.forEach((sc, i) => {
      const ox = i * 450, s = sc.salt(), st = sc.state().salts[sc.saltId];
      Pic.label(g, s.formula, ox + 225, 40, { size: 24 });
      Pic.label(g, 'Ksp = ' + U.num(s.ksp, { sci: 'always', sig: 2 }).text, ox + 225, 72, { size: 17, mono: true, weight: '400' });
      sc.draw(g, { beaker: { x: ox + 30, y: 120, w: 150, h: 230 }, win: { x: ox + 310, y: 250, r: 112 }, caption: false });
      Pic.label(g, 's = ' + U.num(st ? st.s : 0, { sci: 'always', sig: i ? 2 : 3, unit: 'mol/L' }).text, ox + 225, 470, { size: 20, mono: true });
      Pic.mark(g, ox + 50, 445, 350, 52, cur.picMarks.has('readouts'));
    });
  }
  function draw() {
    if ($('cvWrap').hidden || !cur) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    const k = Math.min(cw / FW, ch / FH), ox = (cw - FW * k) / 2, oy = (ch - FH * k) / 2;
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    const v = cur.view, p = cur.preset, T = (performance.now() - cur.t0) / 1000;
    if (cur.mix) {
      const W = { x: 650, y: 265, r: 215 }, sc = cur.scenes[0], spec = cur.mix.spec;
      if (sc) sc.draw(g, { beaker: Pic.MIXED, win: W });
      // the poured ions stay drawn in the mixed beaker while the chemistry is held, and fade as the solid forms
      const landed = !sc ? 0 : !cur.mix.reactAt ? 1 : Math.max(0, 1 - (performance.now() - cur.mix.reactAt) / 1500);
      Pic.mixSources(g, spec.parts, cur.mix.t, cur.picMarks, T, spec.salt, { mixed: !sc, counts: spec.show, landed: spec.show ? landed : 0 });
      if (!sc) {
        SolDraw.lensBack(g, W); SolDraw.lensFront(g, W);
        Pic.label(g, cur.mix.state === 'ready' ? 'Not mixed yet' : 'Mixing…', W.x, W.y, { size: 20, weight: '400', color: '#5b6474' });
      }
      if (spec.spect && cur.mix.t > 0.85) Pic.label(g, spec.spect, W.x, W.y + W.r + 44, { size: 13, mono: true, weight: '400', color: '#5b6474', alpha: Math.min(1, (cur.mix.t - 0.85) / 0.15) });
    }
    else if (p.kind === 'tubes') Pic.testTubes(g, cur.tubes, cur.picMarks, T);
    else if (p.kind === 'two') drawTwo(g);
    else if (v.pic === 'concMass') Pic.concMass(g, cur.picMarks, T, { shown: cur.stage.shown, k: (performance.now() - cur.stage.at) / 1000 });
    else if (v.pic === 'cave' || v.pic === 'kettle' || v.pic === 'antacid') Pic[v.pic](g, cur.picMarks, T, (D.GUIDE.observations.find(o => o.id === v.id) || {}).line);
    else if (v.pic === 'concDilute') Pic.concDilute(g, cur.picMarks, T, { shown: cur.stage.shown, k: (performance.now() - cur.stage.at) / 1000 });
    else if (v.pic === 'labMass') Pic.labMass(g, cur.picMarks, T);
    else if (v.pic === 'labPH') Pic.labPH(g, cur.picMarks, cur.steps && cur.steps.index > 0 ? null : T); // the steps start from the finished reading
    else if (v.pic === 'labCond') Pic.labConductivity(g, cur.picMarks, T, { shown: cur.stage.shown, k: (performance.now() - cur.stage.at) / 1000 });
    else if (v.pic === 'unknown') Pic.unknown(g, cur.picMarks, T);
    else if (v.pic === 'isolate') Pic.isolate(g, cur.picMarks, T, picStage(), { yellow: tok('--ppt-pbi2'), white: tok('--ppt-white') });
    else if (v.pic === 'silver') Pic.silverOrder(g, cur.picMarks, T, picStage(), { agbr: tok('--ppt-agbr'), agcl: tok('--ppt-white') });
    else if (v.pic === 'walk') drawWalk(g);
    else if (v.pic === 'tap') Pic.tapTube(g, { t: T, drop: cur.drop > 0 ? Math.min(1, (performance.now() - cur.drop) / 500) : 0, caption: cur.drop > 0 ? 'KI added: stays clear' : 'tap water' }, cur.picMarks);
    else if (v.qual) drawQual(g);
    else if (cur.scenes[0]) cur.scenes[0].draw(g, { beaker: { x: 70, y: 70, w: 270, h: 380 }, win: { x: 640, y: 255, r: 225 } });
  }
  // the picture's stage for the steps shown: one per line, or the line's `stage` when result lines hold the picture still.
  // One stage forward plays it; back, Show all or a tap jumps to its end
  function picStage() {
    const lines = STEPS[cur.view.steps || cur.preset.steps] || [], shown = cur.stage.shown;
    const n = lines.some(l => l.stage != null) ? lines.slice(0, shown).reduce((m, l) => Math.max(m, l.stage || 0), 0) : shown;
    if (!cur.pstage || cur.pstage.n !== n) cur.pstage = { n, at: !cur.pstage ? cur.stage.at : n === cur.pstage.n + 1 && cur.stage.at > 0 ? cur.stage.at : -1e9 };
    return { shown: n, k: (performance.now() - cur.pstage.at) / 1000 };
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (cur) {
      if (cur.mix && cur.mix.state === 'pouring' && !cur.mix.freeze) { cur.mix.t = Math.min(1, cur.mix.t + dt / POUR_S); if (cur.mix.t >= 1) finishPour(); }
      if (cur.mix && !cur.scenes[0] && cur.check) cur.check.update({ q: 0, ksp: S[cur.mix.spec.salt].ksp, relation: '<', status: cur.mix.state === 'ready' ? 'Not mixed yet' : 'Mixing…' });
      cur.scenes.forEach(s => s.step(dt));
      draw();
      const sc = cur.scenes[0];
      if (sc && cur.readout) cur.readout.update(sc.state(), sc.beaker.T);
      if (sc && cur.liveIce) cur.liveIce(sc);
      if (sc && cur.compare) cur.compare(sc);
      if (sc && cur.check) cur.check.updateFrom(sc.state(), sc.saltId, cur.view.qual && !(sc.beaker.tot['I-'] > 0) ? { status: 'No iodide added yet: Q = 0' } : cur.view.qual && !(sc.beaker.tot['Pb2+'] > 0) ? { status: 'No Pb²⁺ in this beaker: Q = 0' } : null);
    }
    requestAnimationFrame(frame);
  }
  // the drawn stories (SolPictures.END): which one this tab shows
  function storyEnd() {
    if (!cur) return null;
    const key = cur.preset.kind === 'tubes' ? 'tubes' : cur.view && cur.view.pic === 'labCond' ? 'labCond' : cur.view && cur.view.pic;
    return key && Pic.END[key] != null ? Pic.END[key] : null;
  }
  cv.addEventListener('click', () => {
    if (!cur) return;
    const end = storyEnd();
    if (end != null) { const now = performance.now(); cur.t0 = (now - cur.t0) / 1000 < end ? now - end * 1000 : now; }
    if (cur.stage) cur.stage.at = -1e9;
    if (cur.pstage) cur.pstage.at = -1e9;
    if (cur.mix && cur.mix.state === 'pouring') finishPour();
    if (cur.mix && cur.scenes[0] && !cur.mix.hold) react(); // a mix held by the steps stays unreacted until its step
    cur.scenes.forEach(s => { if (s.chemRate > 0) s.settle(); }); // a paused beaker (ICE row I) stays as it is
  });
  if (window.ResizeObserver) new ResizeObserver(() => fit()).observe($('cvWrap'));
  addEventListener('resize', () => { fit(); sizeStepsBox(); });

  // ---------- scroll: the section nearest the reading line drives the stage ----------
  let activeDist = Infinity, pinUntil = 0;
  const HYSTERESIS = 56;
  function pickBeatFromScroll() {
    if (Date.now() < pinUntil) return;
    const mid = innerHeight * 0.38; let best = null, bestDist = Infinity;
    activeDist = Infinity;
    beats.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 80) return;
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (el === active) activeDist = dist;
      if (dist < bestDist) { bestDist = dist; best = el; }
    });
    const lastBeat = beats[beats.length - 1];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && lastBeat.getBoundingClientRect().top < innerHeight - 80) { best = lastBeat; bestDist = -Infinity; }
    if (best && best !== active && bestDist + HYSTERESIS < activeDist) applyBeat(best);
  }
  let tick = 0;
  addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; pickBeatFromScroll(); }); }, { passive: true });
  function goToBeat(id) { const el = $(id); if (!el) return; pinUntil = Date.now() + 700; applyBeat(el); }
  document.querySelectorAll('.guide-toc a[href^="#"], .part-nav a').forEach(a => a.addEventListener('click', () => goToBeat(a.getAttribute('href').slice(1))));
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id) goToBeat(id); });

  // ---------- presentation view (as in the IMF and Intro to Equilibrium Guides) ----------
  // Text hidden, the stage fills the screen. ‹ › / arrow keys / clicker: reveal the next worked line first,
  // then the next tab, then the next section. P toggles it anywhere; Esc leaves.
  const learnToggle = $('learnToggle'), LEARN_KEY = 'sol-guide-learn';
  const learnOn = () => document.body.classList.contains('learn-mode');
  const noScroll = new URLSearchParams(location.search).has('beat'); // headless shots go blank after a scroll
  function scrollToBeat(el, smooth) {
    if (noScroll) return;
    const r = el.getBoundingClientRect();
    scrollTo({ top: Math.max(0, scrollY + r.top + r.height / 2 - innerHeight * 0.38), behavior: smooth ? 'smooth' : 'auto' });
  }
  function stepBeat(dir) {
    const i = beats.indexOf(active) + dir;
    if (i < 0 || i >= beats.length) return;
    goToBeat(beats[i].id); scrollToBeat(beats[i], true);
  }
  // the stage title is a menu of every section, grouped by Part, for skipping straight to one
  const partTitle = part => { const b = document.querySelector('.brief-beat[data-part="' + part + '"] h2'); return b ? b.innerHTML : 'Part ' + part; };
  SectionJump.attach({
    badge: $('badge'), beats,
    current: () => active,
    go: el => { goToBeat(el.id); scrollToBeat(el, true); },
    label: el => el.classList.contains('brief-beat') ? 'Before we begin' : null,
    group: el => partTitle(el.dataset.part)
  });
  function next() {
    if (cur && cur.steps && cur.steps.index < STEPS[(cur.view.steps || cur.preset.steps)].length) { cur.steps.next(); return; }
    if (cur && cur.preset.tabs && cur.tabIdx < cur.preset.tabs.length - 1) { cur.tabIdx++; syncTabs(); loadTab(); return; }
    stepBeat(1);
  }
  function back() {
    if (cur && cur.steps && cur.steps.index > 0) { cur.steps.back(); return; }
    if (cur && cur.preset.tabs && cur.tabIdx > 0) { cur.tabIdx--; syncTabs(); loadTab(); return; }
    stepBeat(-1);
  }
  function setLearn(on) {
    document.body.classList.toggle('learn-mode', on);
    learnToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(LEARN_KEY, on ? '1' : '0'); } catch (e) { /* private window */ }
    requestAnimationFrame(fit);
    syncReadoutLast(); // the readout that waits for the last step moves into (or out of) the steps box
    placeUnder();
    requestAnimationFrame(sizeStepsBox);
    const shown = active;
    if (!on) applyBeat(active); // leaving on a Before you begin: its Part's first section takes the stage
    if (shown) { pinUntil = Date.now() + 300; scrollToBeat(shown, false); }
  }
  wideMQ.addEventListener('change', () => { applyBeat(active); placeStage(); });
  learnToggle.addEventListener('click', () => setLearn(!learnOn()));
  $('learnPrev').addEventListener('click', back);
  $('learnNext').addEventListener('click', next);
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'p' || e.key === 'P') && !e.altKey && !e.ctrlKey && !e.metaKey && !typing) { e.preventDefault(); setLearn(!learnOn()); return; }
    if (!learnOn() || e.altKey || e.ctrlKey || e.metaKey) return;
    const onControl = /^(BUTTON|SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName), k = e.key;
    if (k === 'Escape') setLearn(false);
    else if (typing && /^Arrow/.test(k)) return;
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !onControl && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && !onControl && e.shiftKey)) { e.preventDefault(); back(); }
  });

  // ---------- start ----------
  // dev hooks for headless checks: ?beat=p1-agcl&tab=1&steps=5&learn=1&salt=MgOH2&temp=100&press=Add KI&pick=SrI&settle=1
  const q = new URLSearchParams(location.search);
  let learnSaved = false;
  try { learnSaved = localStorage.getItem(LEARN_KEY) === '1'; } catch (e) { /* private window */ }
  const startId = q.get('beat') || location.hash.slice(1);
  const start = (startId && $(startId)) || beats[0];
  if (q.has('learn') || learnSaved) setLearn(true); // before the first section loads, so a Before you begin can open on the stage
  applyBeat(start);
  if (start !== beats[0] && !q.has('beat')) start.scrollIntoView(); // ?beat= is for headless shots, which go blank after a scroll
  if (q.has('tab')) { cur.tabIdx = +q.get('tab'); syncTabs(); loadTab(); }
  if (q.has('learn') || learnSaved) setLearn(true);
  if (q.has('steps')) for (let i = 0; i < +q.get('steps'); i++) cur.steps && cur.steps.next();
  if (q.has('mix') && cur.mix) { pour(false); if (q.get('mix') === 'now') finishPour(); }
  if (q.has('pour') && cur.mix) { const v = +q.get('pour'); if (v >= 1) finishPour(); else { cur.mix.state = 'pouring'; cur.mix.t = v; cur.mix.freeze = true; } } // a moment in the pour
  if (q.has('salt') && cur.preset.salts) switchSalt(q.get('salt'));
  if (q.has('temp')) { const r = document.querySelector('.sg-temp input'); if (r) { r.value = q.get('temp'); r.dispatchEvent(new Event('input')); } }
  if (q.has('press')) Array.from($('btns').querySelectorAll('button')).filter(b => b.textContent.startsWith(q.get('press'))).forEach(b => b.click());
  if (q.has('pick')) Array.from(tools.querySelectorAll('.chip-opt')).filter(b => b.textContent.startsWith(q.get('pick'))).forEach(b => b.click()); // a choice on a card
  if (q.has('settle')) cur.scenes.forEach(s => s.settle());
  if (q.has('t')) cur.t0 = performance.now() - (+q.get('t')) * 1000; // a moment in a drawn story
  if (q.has('t') && cur.stage) cur.stage.at = performance.now() - (+q.get('t')) * 1000; // a moment in the current stage
  fit();
  requestAnimationFrame(frame);
  window.__solGuide = { applyBeat: id => applyBeat($(id)), cur: () => cur }; // dev hook (remove before ship)
})();
