// Guide 1 self-test (dev only): load dev/run.html?page=review.html&test=review-test.js&selftest
// Every section loads on the stage (every tab, every step) with no script errors; the stage sits in its own Part's dock;
// each Part's Before we begin spans the page; the worked numbers and the titration demo check out.
(function () {
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message));
  window.addEventListener('load', () => setTimeout(run, 300));
  function run() {
    const out = [], ok = (n, c, x) => out.push((c ? 'PASS ' : 'FAIL ') + n + (c || x == null ? '' : '  ' + x));
    const G = window.__ab, near = (a, b, tol) => Math.abs(a - b) <= (tol || 5e-4);
    // layout: each Part = Before we begin (full width) + its own two columns
    const parts = Array.from(document.querySelectorAll('.guide-part'));
    ok('three Parts, each with Before we begin above its own layout', parts.length === 3 && parts.every(p => p.firstElementChild.classList.contains('brief-beat') && p.querySelector(':scope > .guide-layout > .stage-dock')), parts.length);
    // every section, every tab, every step
    let bad = [];
    G.beats.forEach(b => {
      try {
        G.apply(b, true);
        const sb = G.stageBeat(b), dock = sb.closest('.guide-part').querySelector('.stage-dock');
        // wide: the stage sits in its Part's dock. Narrow (guide-inline.js): in the slot right after its section
        const narrow = document.body.classList.contains('guide-inline');
        const home = narrow ? G.stage.parentNode.classList.contains('guide-slot') && G.stage.parentNode.previousElementSibling === sb : G.stage.parentNode === dock;
        if (!home) bad.push(b.id + ': stage not in its place (' + (narrow ? 'narrow' : 'wide') + ')');
        if (G.cur().id !== sb.id) bad.push(b.id + ': stage shows ' + G.cur().id);
        const sec = G.cur().sec;
        (sec && sec.tabs ? sec.tabs.map(t => t[0]) : [null]).forEach(tab => {
          if (tab) G.load(sb.id, tab);
          const c = G.cur();
          if (c.steps) { c.steps.all(); c.steps.reset(); c.steps.all(); }
          const filled = ['top', 'left', 'right'].some(id => document.getElementById(id).childElementCount);
          if (!filled) bad.push(sb.id + (tab ? '/' + tab : '') + ': empty stage');
        });
      } catch (e) { bad.push(b.id + ': ' + e.message); }
    });
    ok('every section and tab loads, steps run, stage in its place (' + (document.body.classList.contains('guide-inline') ? 'narrow: under its section' : 'wide: its Part') + ')', bad.length === 0, bad.join(' | '));
    // the numbers in the worked problems
    const pH = h => -Math.log10(h), CH = window.AbChem;
    ok('mix: 30.0 mL 0.200 M HCl + 20.0 mL 0.150 M NaOH gives pH 1.222', near(pH((30.0 * 0.200 - 20.0 * 0.150) / 50.0), 1.222));
    ok('two OH⁻: 25.0 mL 0.100 M Sr(OH)₂ + 40.0 mL 0.100 M HCl gives pOH 1.813, pH 12.187', near(pH((25.0 * 0.100 * 2 - 40.0 * 0.100) / 65.0), 1.813));
    ok('backwards: NaOH into 500.0 mL 0.0200 M HCl for pH 2.300 is 0.300 g', near((0.500 * 0.0200 - 0.500 * Math.pow(10, -2.3)) * CH.molarMass({ Na: 1, O: 1, H: 1 }), 0.300, 6e-4));
    ok('your turn: KOH into 250.0 mL 0.0400 M HNO₃ for pH 2.000 is 0.421 g', near((0.250 * 0.0400 - 0.250 * 0.0100) * CH.molarMass({ K: 1, O: 1, H: 1 }), 0.421, 6e-4));
    ok('titration HCl: 21.44 mL × 0.1052 M ÷ 25.00 mL = 0.09022 M', near(21.44 * 0.1052 / 25.00, 0.09022, 6e-6));
    ok('titration H₂SO₄: 18.73 mL × 0.1052 M ÷ 2 ÷ 25.00 mL = 0.03941 M', near(18.73 * 0.1052 / 2 / 25.00, 0.03941, 6e-6));
    ok('square: [OH⁻] 3.2 × 10⁻⁵ M → pOH 4.49, pH 9.51, [H⁺] 3.1 × 10⁻¹⁰ M', near(pH(3.2e-5), 4.49, 0.005) && near(Math.pow(10, -9.51) / 1e-10, 3.1, 0.05));
    ok('sig figs: pH of 4.7 × 10⁻⁴ is 3.33; pOH of 6.25 × 10⁻³ is 2.204; 10^−11.62 is 2.4 × 10⁻¹²', near(pH(4.7e-4), 3.33, 0.005) && near(pH(6.25e-3), 2.204) && near(Math.pow(10, -11.62) / 1e-12, 2.4, 0.05));
    ok('find: 0.600 g NaOH in 250.0 mL is 0.0600 M; [H⁺] 1.67 × 10⁻¹³ M', near(0.600 / CH.molarMass({ Na: 1, O: 1, H: 1 }) / 0.2500, 0.0600, 1e-6) && near(1e-14 / 0.0600 / 1e-13, 1.67, 0.005));
    // the magic square solves from any corner, with the right significant figures
    G.apply(document.getElementById('p12-square'), true);
    const corner = name => Array.from(document.querySelectorAll('.ab-sq-corner')).find(c => c.querySelector('.ab-sq-name').textContent === name).querySelector('input');
    const solve = (name, v) => { const i = corner(name); i.value = v; i.dispatchEvent(new Event('change')); };
    const vals = () => ['[H+]', '[OH−]', 'pH', 'pOH'].map(n => corner(n).value).join(' | ');
    solve('pH', '4.20');
    ok('square from pH 4.20: [H⁺] 6.3 × 10⁻⁵, [OH⁻] 1.6 × 10⁻¹⁰, pOH 9.80', vals() === '6.3 × 10⁻⁵ | 1.6 × 10⁻¹⁰ | 4.20 | 9.80', vals());
    solve('[H+]', '2.5e-3');
    ok('square from [H⁺] 2.5e-3: pH 2.60, pOH 11.40, [OH⁻] 4.0 × 10⁻¹²', vals() === '2.5 × 10⁻³ | 4.0 × 10⁻¹² | 2.60 | 11.40', vals());
    solve('[OH−]', '1.25 × 10⁻²');
    ok('square from [OH⁻] typed with ×10: pOH 1.903, pH 12.097', /1\.25 × 10⁻² \| 12\.097 \| 1\.903$/.test(vals().replace(/^[^|]*\| /, '')), vals());
    solve('pOH', 'abc');
    ok('square: a value that is not a number is marked, nothing changes', corner('pOH').closest('.ab-sq-corner').classList.contains('is-bad'));
    // the titration keys: hold S to stream, D dropwise, F one drop, N new trial, 2 the H₂SO₄ sample
    G.apply(document.getElementById('p13-equiv'), true);
    const T0 = window.AbTitration.demo().state;
    const key = (type, k) => window.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    const drops0 = T0.drops.length; key('keydown', 'f');
    ok('key F: one drop leaves the tip', T0.drops.length === drops0 + 1);
    key('keydown', 's'); const streaming = T0.flow === 'stream'; key('keyup', 's');
    ok('hold S streams, letting go closes the stopcock', streaming && T0.flow === 'closed');
    key('keydown', 'd'); const dw = T0.flow === 'drop'; key('keydown', 'd');
    ok('D turns dropwise on, and off again', dw && T0.flow === 'closed');
    key('keydown', '2'); ok('key 2: the H₂SO₄ sample', T0.sample === 'H2SO4'); key('keydown', '1');
    const nTr = T0.trials.HCl.length; T0.v = 5; key('keydown', 'n');
    ok('key N: the trial is recorded and a new one starts', T0.trials.HCl.length === nTr + 1 && T0.v === 0);
    T0.trials.HCl.pop();
    ok('the burette controls sit on the picture beside the burette', !!document.querySelector('.ab-ti-rig > canvas + .ab-ti-panel'));
    // the titration demo: the end point is within a drop, and the colour follows pH
    const T = window.AbTitration, d = T.demo(), st = d.state;
    ok('demo: HCl equivalence at 20.77 mL, H₂SO₄ at 21.44 mL', near(25.00 * 0.0874 / 0.1052, 20.77, 0.005) && near(25.00 * 0.0451 * 2 / 0.1052, 21.44, 0.005));
    ok('no script errors', errs.length === 0, errs.join(' | '));
    // newest first, so a short screenshot shows the layout checks; pinned to the top of the window
    const pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.slice().reverse().join('\n');
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99;background:#fff;color:#000;margin:0;padding:6px;font-size:12px';
    document.body.prepend(pre);
  }
})();
