/* Acids and Bases Guide controller (Guide 1: review.html). Built on the ICE Tables pattern (equilibrium/assets/ice-guide.js):
   the section nearest the reading line drives the stage; presentation view hides the text and steps through each worked
   line, then each picture tab, then the next section. Step buttons sit in a footer at the bottom right that never moves.
   Full explanation: off by default (the teacher talks through each step); the checkbox shows every note for home study.
   Stage presets live in SECTIONS below. Pictures are canvas scenes from AbDraw; numbers come from AbChem (Data Booklet). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const A = window.AbDraw, CH = window.AbChem, UI = window.AbUI;
  const el = UI.el;
  const beats = Array.from(document.querySelectorAll('.guide-beat'));
  const top = $('top'), left = $('left'), right = $('right'), grid = $('grid');
  const footL = $('footL'), footR = $('footR'), stage = $('stage');
  const q = new URLSearchParams(location.search);
  let active = null, cur = null;
  // narrow screens: each section's text, then the stage under it (assets/guide-inline.js)
  const inline = GuideInline.attach({
    stage, beats,
    skip: b => b.classList.contains('brief-beat'),
    current: () => active,
    activate: b => applyBeat(b),
    presenting: () => document.body.classList.contains('learn-mode')
  });
  let model = ['lewis', 'ball', 'fill'].indexOf(q.get('model')) >= 0 ? q.get('model') : 'lewis'; // kept across sections

  // ---------- numbers shown on the stage ----------
  const sciHTML = (v, sig, unit) => { const s = CH.sci(v, sig); return s.m + ' × 10<sup>' + String(s.e).replace('-', '−') + '</sup>' + (unit ? ' ' + unit : ''); };
  const hCH3COOH = c => CH.weakH(CH.KA.CH3COOH, c);

  // ---------- proton transfers ----------
  // eq: [text, side (0 reactants, 1 products, -1 arrow), role colour once formed, acid / base tag]
  const T = {
    // What is H⁺? HCl and a water molecule: the H–Cl bond breaks, then the same proton bonds to water (AbDraw.protonStory)
    h3o: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' },
      R: { sym: 'Cl', hs: [], lps: [-90, 90, 0], don: 180, become: 'anion', charge: '−' } },
    nh3: { L: { sym: 'N', hs: [180, -90, 90], lps: [], acc: 0, become: 'cation', charge: '+' },
      R: { sym: 'O', hs: [55], lps: [-70, 125], don: 180, become: 'base', charge: '−' },
      eq: [['NH₃', 0, null, 'base'], ['  +  ', 0], ['H₂O', 0, null, 'acid'], ['   ⇌   ', -1], ['NH₄⁺', 1, 'cation', 'acid'], ['  +  ', 1], ['OH⁻', 1, 'base', 'base']] },
    // amphiprotic: HS⁻ gives up its H⁺ to water (acid), or takes one from water (base). charge0: HS⁻ starts charged
    hsAcid: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' },
      R: { sym: 'S', hs: [], lps: [-90, 90, 0], don: 180, become: 'anion', charge0: '−', charge: '2−' },
      eq: [['HS⁻', 0], ['  +  ', 0], ['H₂O', 0], ['   ⇌   ', -1], ['S²⁻', 1, 'anion'], ['  +  ', 1], ['H₃O⁺', 1, 'acid']] },
    hsBase: { L: { sym: 'S', hs: [180], lps: [-90, 90], acc: 0, become: 'mol', charge0: '−', charge: '' },
      R: { sym: 'O', hs: [55], lps: [-70, 125], don: 180, become: 'base', charge: '−' },
      eq: [['HS⁻', 0], ['  +  ', 0], ['H₂O', 0], ['   ⇌   ', -1], ['H₂S', 1, 'mol'], ['  +  ', 1], ['OH⁻', 1, 'base']] },
    // Part 1.2: one water passes a proton to another; and the bare proton landing on water (From now on: H₃O⁺)
    selfIon: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' },
      R: { sym: 'O', hs: [55], lps: [-70, 125], don: 180, become: 'base', charge: '−' },
      eq: [['H₂O', 0], ['  +  ', 0], ['H₂O', 0], ['   ⇌   ', -1], ['H₃O⁺', 1, 'acid'], ['  +  ', 1], ['OH⁻', 1, 'base']] },
    bare: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' }, R: null,
      eq: [['H⁺', 0], [' + ', 0], ['H₂O', 0], ['  →  ', -1], ['H₃O⁺', 1, 'acid']] },
    hf: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' },
      R: { sym: 'F', hs: [], lps: [-90, 90, 0], don: 180, become: 'anion', charge: '−' },
      eq: [['HF', 0, null, 'acid'], ['  +  ', 0], ['H₂O', 0, null, 'base'], ['   ⇌   ', -1], ['F⁻', 1, 'anion', 'base'], ['  +  ', 1], ['H₃O⁺', 1, 'acid', 'acid']] }
  };
  // A picture moves between numbered states. pos eases toward the target at one state per MOVE seconds,
  // passing through the states in between. A tap on the picture finishes a move, or replays the last one.
  const MOVE = 1.6;
  function anim() { return { f: 0, target: 0, from: 0 }; }
  function stepAnim(a, dt) {
    if (a.f === a.target) return;
    const d = dt / MOVE; a.f = a.target > a.f ? Math.min(a.target, a.f + d) : Math.max(a.target, a.f - d);
  }
  function tap(a) { if (a.f !== a.target) a.f = a.target; else if (a.target > 0) a.f = Math.max(0, a.target - 1); else { a.f = 0; a.target = 1; } }
  // Next step drives the picture: the newest line that names a state wins; `tags` lines label acid and base
  function steps(lines, a) {
    cur.lines = lines;
    cur.steps = UI.stepper(right, lines, { bar: footR, onStep: i => {
      let st = 0, tags = false;
      for (let k = 0; k <= i; k++) { if (lines[k].state != null) st = lines[k].state; if (lines[k].tags) tags = true; }
      if (a) a.target = st;
      cur.tags = tags;
    } });
    return cur.steps;
  }

  // a worked problem under the picture: each line stays, newest last; a line's state moves the picture (as steps())
  const U = window.SolUI.ua;
  // q: the question being solved, shown first and kept at the top (with any given data, e.g. the trials table).
  // A worked problem with no picture is a calculation slide: in presentation view it starts top left and fills down.
  function work(lines, a, q) {
    if (q) left.appendChild(el('div', 'ab-calc-q', q));
    if (!cur.canvases.length) grid.classList.add('is-calc');
    // the answer at the end of a line ("= 2.2555 × 10⁻³ mol HCl") never breaks across lines
    lines.forEach(l => {
      if (!l.eqn) return;
      const k = l.eqn.lastIndexOf(' = ');
      if (k > 0 && l.eqn.indexOf('ua-', k) < 0) l.eqn = l.eqn.slice(0, k) + ' <span class="ab-ans">= ' + l.eqn.slice(k + 3) + '</span>';
    });
    cur.lines = lines;
    cur.steps = UI.stepper(left, lines, { bar: footR, stack: true, onStep: i => {
      let st = 0;
      for (let k = 0; k <= i; k++) if (lines[k].state != null) st = lines[k].state;
      if (a) a.target = st;
    } });
    return cur.steps;
  }

  // mixing: three beakers in a row, and the working laid out in three columns under them. The moles of each
  // solution come out boxed under its beaker; on the "fly" step those boxes travel over to the mixture's column,
  // where the smaller is taken from the larger. A line's state moves the picture (0 before, 1 the pour, 2 the reaction).
  const chip = (id, html) => '<span class="ab-chip" data-chip="' + id + '">' + html + '</span>';
  const from = id => '<span class="ab-chip" data-from="' + id + '">' + '</span>';
  function mixWork(spec, q, lines) {
    const a = anim(); cur.anim = a;
    if (q) left.appendChild(el('div', 'ab-calc-q', q));
    const rig = el('div', 'ab-mixrig'); left.appendChild(rig);
    const c = canvas(230, (g, W, H, t, dt) => { stepAnim(a, dt); A.mixScene(g, W, H, spec, a.f, t); }, () => tap(a),
      spec.acid.vol + ' mL of ' + spec.acid.title + ' and ' + spec.base.vol + ' mL of ' + spec.base.title + ' are poured together; H₃O⁺ and OH⁻ react in pairs to make water.');
    rig.appendChild(c.cv.parentNode);
    const fr = A.MIX_COLS(W), cols = el('div', 'ab-mixcols');
    cols.style.padding = '0 ' + (fr.pad * 100) + '%'; cols.style.columnGap = (fr.gap * 100) + '%';
    const colEls = [0, 1, 2].map(() => cols.appendChild(el('div', 'ab-mixcol ab-calc')));
    rig.appendChild(cols);
    grid.classList.add('is-mix');
    // a "from" box shows the same value as the box it comes from
    const resolve = html => html.replace(/<span class="ab-chip" data-from="(\w+)"><\/span>/g, (m, id) => {
      const src = lines.map(l => l.html.match(new RegExp('data-chip="' + id + '">(.*?)</span>'))).find(Boolean);
      return '<span class="ab-chip" data-from="' + id + '">' + (src ? src[1] : '') + '</span>';
    });
    function render(i, fwd) {
      colEls.forEach(e => { e.innerHTML = ''; });
      lines.forEach((ln, k) => {
        if (k > i) return;
        const d = el('div', 'ab-calc-line' + (k === i && fwd ? ' is-new' : ''), resolve(ln.html));
        colEls[ln.col].appendChild(d);
        if (k === i && fwd) {   // keep the newest line in view inside the stage (presentation view scrolls the working)
          const r = d.getBoundingClientRect(), lr = left.getBoundingClientRect();
          if (r.bottom > lr.bottom && left.scrollHeight > left.clientHeight) left.scrollTop += r.bottom - lr.bottom + 10;
        }
        if (k === i && fwd && ln.fly && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          d.querySelectorAll('[data-from]').forEach(t => {   // the box glides over from under its own beaker
            const src = cols.querySelector('[data-chip="' + t.dataset.from + '"]');
            if (!src || !t.animate) return;
            const s = src.getBoundingClientRect(), e = t.getBoundingClientRect();
            t.animate([{ transform: 'translate(' + (s.left - e.left) + 'px,' + (s.top - e.top) + 'px)' }, { transform: 'none' }],
              { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' });
          });
        }
      });
    }
    cur.lines = lines;
    cur.steps = UI.stepper(right, lines, { bar: footR, onStep: (i, ln, fwd) => {
      let st = 0;
      for (let k = 0; k <= i; k++) if (lines[k].state != null) st = lines[k].state;
      a.target = st;
      render(i, fwd);
    } });
  }

  // ---------- stage pieces ----------
  const W = 760;                                       // logical canvas width; heights per scene
  function canvas(h, draw, onTap, aria) {
    const wrap = el('div', 'ab-canvas-wrap');
    const cv = el('canvas', 'ab-canvas'); cv.width = W * 2; cv.height = h * 2; cv.setAttribute('role', 'img');
    if (aria) cv.setAttribute('aria-label', aria);
    wrap.appendChild(cv); left.appendChild(wrap);
    const c = { cv, g: cv.getContext('2d'), h, draw, t0: performance.now() };
    cv.addEventListener('click', () => { if (onTap) onTap(); else c.t0 = performance.now(); });
    cur.canvases.push(c);
    return c;
  }
  // a proton transfer with the model switch (Lewis / ball and stick / space-filling)
  function transferScene(key, h) {
    const a = anim(); cur.anim = a;
    const sw = el('div', 'ab-switch-row'); top.appendChild(sw);
    UI.modelSwitch(sw, model, m => { model = m; });
    canvas(h || 330, (g, W, H, t, dt) => { stepAnim(a, dt); A.transfer(g, W, H, T[key], A.ease(A.clamp(a.f, 0, 1)), model, t, { tags: cur.tags }); },
      () => tap(a), 'Proton transfer: ' + T[key].eq.map(e => e[0]).join(''));
    return a;
  }
  const sub = x => x.replace(/₂/g, '<sub>2</sub>').replace(/₃/g, '<sub>3</sub>').replace(/₄/g, '<sub>4</sub>').replace(/⁺/g, '<sup>+</sup>').replace(/⁻/g, '<sup>−</sup>').replace(/²⁺/g, '<sup>2+</sup>');

  // ---------- data for the cards ----------
  const ACID_SORT = [
    ['HNO₃', 'acid', 'It starts with H and releases H⁺ in water.'],
    ['KOH', 'base', 'It ends with OH and releases OH⁻ in water.'],
    ['CaCl₂', 'salt', 'An ionic compound that neither starts with H nor ends with OH.'],
    ['CH₄', 'none', 'Not ionic, and it releases neither H⁺ nor OH⁻.'],
    ['Sr(OH)₂', 'base', 'It ends with OH: two OH⁻ per formula.'],
    ['Na₂CO₃', 'salt', 'Na⁺ and CO₃²⁻ ions, with no H at the start and no OH at the end.'],
    ['H₂SO₄', 'acid', 'It starts with H and releases H⁺ in water.'],
    ['CH₃OH', 'none', 'It ends with OH, but it is not ionic: the OH never leaves as OH⁻.']
  ];
  const KIND = [['acid', 'Acid'], ['base', 'Base'], ['salt', 'Salt'], ['none', 'None']];
  const PROPS = [
    ['Turns litmus red', 'acid', 'Acids turn litmus red.', 'litmusRed'],
    ['Turns litmus blue', 'base', 'Bases turn litmus blue.', 'litmusBlue'],
    ['Conducts electricity in water', 'both', 'Both are electrolytes: they make ions in water.', 'bulb'],
    ['Reacts with magnesium to make H₂ gas', 'acid', 'Mg is reactive enough to make H₂(g) with acids.', 'mg'],
    ['Feels slippery', 'base', 'Bases react with the oils on skin to make soap.', 'soap'],
    ['Tastes sour', 'acid', 'Vinegar and lemon juice are acids. We never taste anything in the lab.', 'lemon']
  ];
  // Small pictures for the property cards. Real-object colours only (litmus, bulb, lemon); never the acid red or
  // base violet, so a picture never gives the answer away. Lines are currentColor (ink), so they follow the theme.
  const PROP_PIC = (() => {
    const svg = body => '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
    // a litmus strip, its dipped end changed colour, one drop falling from the tip
    const strip = (from, to) => svg(
      '<rect x="22" y="4" width="20" height="44" rx="3" fill="' + from + '" stroke="none"/>' +
      '<path d="M22 30 q5 -3 10 0 t10 0 V45 a3 3 0 0 1 -3 3 H25 a3 3 0 0 1 -3 -3z" fill="' + to + '" stroke="none"/>' +
      '<rect x="22" y="4" width="20" height="44" rx="3"/>' +
      '<path class="pp-drop" d="M32 52 q-3.5 4.5 0 7 q3.5 -2.5 0 -7z" fill="var(--ab-water)"/>');
    return {
      litmusRed: strip('#4a86d8', '#d9534a'),
      litmusBlue: strip('#d9534a', '#4a86d8'),
      // conductivity tester: two electrodes in solution, wired to a lit bulb
      bulb: svg(
        '<path d="M10 30 V55 a4 4 0 0 0 4 4 H50 a4 4 0 0 0 4 -4 V30" />' +
        '<path d="M11 40 H53 V55 a3 3 0 0 1 -3 3 H14 a3 3 0 0 1 -3 -3z" fill="var(--ab-water)" stroke="none"/>' +
        '<path d="M10 30 V55 a4 4 0 0 0 4 4 H50 a4 4 0 0 0 4 -4 V30"/>' +
        '<rect x="19" y="24" width="6" height="28" rx="1" fill="#a9b4c2"/><rect x="39" y="24" width="6" height="28" rx="1" fill="#a9b4c2"/>' +
        '<path d="M22 24 V22 H29 M42 24 V22 H35"/>' +
        '<g class="pp-glow" stroke="#f5a524"><path d="M32 5 V2 M25 8 L23 6 M39 8 L41 6 M23.5 14 H20.5 M40.5 14 H43.5"/></g>' +
        '<circle cx="32" cy="14" r="6" fill="#fff1b8"/><path d="M29 20 H35 V23 H29z" fill="#a9b4c2"/>'),
      // a test tube of solution, a magnesium ribbon at the bottom, bubbles of H₂ rising off it
      mg: svg(
        '<path d="M23 22 H41 V50 a9 9 0 0 1 -18 0z" fill="var(--ab-water)" stroke="none"/>' +
        '<path d="M23 4 V50 a9 9 0 0 0 18 0 V4"/><path d="M20 4 H44"/>' +
        '<path d="M27 54 L37 46" stroke="#8d99a8" stroke-width="3.5"/>' +
        '<g class="pp-bubbles" stroke-width="1.6"><circle cx="30" cy="42" r="2"/><circle cx="35" cy="36" r="1.6"/><circle cx="29" cy="31" r="2.2"/><circle cx="34" cy="26" r="1.5"/></g>'),
      // a bar of soap, sliding (motion lines) with a few suds
      soap: svg(
        '<g transform="rotate(-12 34 40)"><rect x="14" y="30" width="38" height="20" rx="9" fill="var(--ab-soap)"/>' +
        '<path d="M22 36 q6 -3 14 -2" stroke-width="1.6" opacity="0.6"/></g>' +
        '<path d="M3 38 H10 M5 45 H11 M3 52 H9" stroke-width="1.8"/>' +
        '<g stroke-width="1.5"><circle cx="40" cy="22" r="3.5"/><circle cx="47" cy="16" r="2.4"/><circle cx="33" cy="17" r="2"/></g>'),
      // a lemon slice
      lemon: svg(
        '<circle cx="32" cy="34" r="25" fill="#f4d23c" stroke="#c99a00"/>' +
        '<circle cx="32" cy="34" r="20" fill="#fff4c2" stroke="none"/>' +
        '<g stroke="#e8c34a" stroke-width="1.8">' + [0, 45, 90, 135].map(a => '<path d="M32 34 m' + (20 * Math.cos(a * Math.PI / 180)).toFixed(1) + ' ' + (20 * Math.sin(a * Math.PI / 180)).toFixed(1) + ' L' + (32 - 20 * Math.cos(a * Math.PI / 180)).toFixed(1) + ' ' + (34 - 20 * Math.sin(a * Math.PI / 180)).toFixed(1) + '"/>').join('') + '</g>' +
        '<circle cx="32" cy="34" r="2.5" fill="#fff4c2" stroke="#e8c34a" stroke-width="1.5"/>')
    };
  })();
  const BOTH = [['acid', 'Acid'], ['base', 'Base'], ['both', 'Both']];

  // ---------- neutralization: 2 HNO₃ + Sr(OH)₂ → Sr(NO₃)₂ + 2 H₂O, as ions ----------
  // states: 0 one of each · 1 two HNO₃ · 2 H⁺ and OH⁻ meet · 3 they are water · 4 the salt · 5 net ionic (spectators fade)
  const NEUT = (() => {
    const s6 = (...v) => v; // one [x, y, alpha] per state
    return [
      { kind: 'H',   at: s6([95, 165, 1], [95, 105, 1], [476, 105, 1], [476, 105, 0], [476, 105, 0], [476, 105, 0]) },
      { kind: 'NO3', at: s6([140, 165, 1], [140, 105, 1], [140, 105, 1], [140, 105, 1], [612, 128, 1], [612, 128, 0.22]) },
      { kind: 'H',   at: s6([95, 245, 0], [95, 230, 1], [476, 232, 1], [476, 232, 0], [476, 232, 0], [476, 232, 0]) },
      { kind: 'NO3', at: s6([140, 245, 0], [140, 230, 1], [140, 230, 1], [140, 230, 1], [612, 208, 1], [612, 208, 0.22]) },
      { kind: 'Sr',  at: s6([300, 165, 1], [300, 168, 1], [300, 168, 1], [300, 168, 1], [668, 168, 1], [668, 168, 0.22]) },
      { kind: 'OH',  at: s6([250, 165, 1], [250, 168, 1], [522, 105, 1], [522, 105, 0], [522, 105, 0], [522, 105, 0]) },
      { kind: 'OH',  at: s6([350, 165, 1], [350, 168, 1], [522, 232, 1], [522, 232, 0], [522, 232, 0], [522, 232, 0]) },
      { kind: 'H2O', at: s6([500, 105, 0], [500, 105, 0], [500, 105, 0], [500, 105, 1], [500, 105, 1], [500, 105, 1]) },
      { kind: 'H2O', at: s6([500, 232, 0], [500, 232, 0], [500, 232, 0], [500, 232, 1], [500, 232, 1], [500, 232, 1]) }
    ];
  })();

  // ---------- section presets ----------
  // Visual primary (teacher, 2026-11-27): no sentences on the stage. Explanations live in the section text.
  const SECTIONS = {
    'p11-arrhenius': {
      tabs: [['acid', 'An acid'], ['base', 'A base'], ['sort', 'Sort them']],
      load(tab) {
        if (tab === 'acid' || tab === 'base') {
          // both drawn the same way: in a window of water, large, in the chosen model (teacher, 2026-11-27)
          const a = anim(); cur.anim = a;
          const sw = el('div', 'ab-switch-row'); top.appendChild(sw);
          UI.modelSwitch(sw, model, m => { model = m; });
          canvas(400, (g, W, H, t, dt) => { stepAnim(a, dt); A.dissolve(g, W, H, tab, a.f, model, t); }, () => tap(a),
            tab === 'acid' ? 'An HCl molecule in water. The H–Cl bond breaks, its electron pair stays on Cl, and H⁺ and Cl⁻ move apart.'
              : 'NaOH in water. Its Na⁺ and OH⁻ ions move apart.');
          steps([{ state: 0 }, { state: 1 }], a);
        } else {
          UI.cards(right, ACID_SORT.map(([f, k, why]) => ({ prompt: sub(f), options: KIND.map(([kk, t]) => ({ label: t, correct: kk === k })), why })), { cols: 2 });
        }
      }
    },
    'p11-neut': {
      tabs: [['balance', 'Balancing'], ['props', 'Properties']],
      load(tab) {
        if (tab === 'balance') {
          const a = anim(); cur.anim = a;
          canvas(330, (g, W, H, t, dt) => { stepAnim(a, dt); A.tokens(g, W, H, NEUT, a.f, { arrowX: 410, questionUntil: 1 }); }, () => tap(a),
            'Neutralization of HNO₃ with Sr(OH)₂, shown as ions');
          const L = '2 HNO<sub>3</sub> + Sr(OH)<sub>2</sub>';
          steps([
            { state: 0, eqn: 'HNO<sub>3</sub> + Sr(OH)<sub>2</sub> → ?' },
            { state: 1, eqn: '<b class="ab-coef">2</b> HNO<sub>3</sub> + Sr(OH)<sub>2</sub> → ?' },
            { state: 3, eqn: L + ' → <b class="ab-coef">2</b> H<sub>2</sub>O + ?' },
            { state: 4, eqn: L + ' → Sr(NO<sub>3</sub>)<sub>2</sub> + 2 H<sub>2</sub>O' },
            { state: 5, eqn: 'H<sup>+</sup> + OH<sup>−</sup> → H<sub>2</sub>O' }
          ], a);
        } else {
          UI.cards(right, PROPS.map(([p, k, why, pic]) => ({ prompt: sub(p), pic: PROP_PIC[pic], options: BOTH.map(([kk, t]) => ({ label: t, correct: kk === k })), why })), { cols: 2 });
        }
      }
    },
    'p11-h3o': {
      load() {
        // HCl + H₂O · the H–Cl bond breaks · zoom in: H⁺ is one proton · zoom out, follow it onto water · overall
        const a = anim(); cur.anim = a;
        const sw = el('div', 'ab-switch-row'); top.appendChild(sw);
        UI.modelSwitch(sw, model, m => { model = m; });
        canvas(330, (g, W, H, t, dt) => { stepAnim(a, dt); A.protonStory(g, W, H, T.h3o, a.f, model, t); }, () => tap(a),
          'HCl beside a water molecule. The H–Cl bond breaks and its electron pair stays on Cl. Close up, the H⁺ is a single proton with no electron. The same proton then bonds to a lone pair on water, making H₃O⁺.');
        steps([
          { state: 0, eqn: 'HCl(g) + H<sub>2</sub>O(l)' },
          { state: 1, eqn: 'HCl(g) → H<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)' },
          { state: 2 },
          { state: 3, eqn: 'H<sup>+</sup>(aq) + H<sub>2</sub>O(l) → H<sub>3</sub>O<sup>+</sup>(aq)' },
          { eqn: 'HCl(g) + H<sub>2</sub>O(l) → H<sub>3</sub>O<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)' }
        ], a);
      }
    },
    'p11-bl': {
      tabs: [['nh3', 'NH₃ + H₂O'], ['hf', 'HF + H₂O'], ['amph', 'Amphiprotic and polyprotic'], ['check', 'Check yourself']],
      load(tab) {
        if (tab === 'amph') {
          // one stepper drives both pictures: 1 HS⁻ as an acid · 2 HS⁻ as a base · 3–5 the acids release protons one at a time
          const a = anim(); cur.anim = a;
          const sw = el('div', 'ab-switch-row'); top.appendChild(sw);
          UI.modelSwitch(sw, model, m => { model = m; });
          const RH = 190;
          canvas(RH * 2, (g, W, H, t, dt) => {
            stepAnim(a, dt);
            [['hsAcid', 'HS⁻ as an acid'], ['hsBase', 'HS⁻ as a base']].forEach(([k, title], row) => {
              g.save(); g.translate(0, row * RH);
              A.transfer(g, W, RH, T[k], A.ease(A.clamp(a.f - row, 0, 1)), model, t);
              A.text(g, title, 18, 26, A.pal().ink, 17, 700, 'left');
              g.restore();
            });
            const P = A.pal(); g.strokeStyle = P.dark ? '#26304d' : '#e3e7ee'; g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(14, RH); g.lineTo(W - 14, RH); g.stroke();
          }, () => tap(a), 'HS⁻ acting as an acid: HS⁻ + H₂O ⇌ S²⁻ + H₃O⁺. HS⁻ acting as a base: HS⁻ + H₂O ⇌ H₂S + OH⁻.');
          let below = false;   // the stage scrolls to the acids when the steps reach them, and back up before them
          const poly = canvas(270, (g, W, H) => {
            A.polyprotic(g, W, H, A.clamp(a.f - 2, 0, 3));
            if ((a.target >= 3) !== below) { below = a.target >= 3; if (below) poly.cv.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); else grid.scrollTo({ top: 0, behavior: 'smooth' }); }
          }, () => tap(a),
            'HCl releases one proton, H₂SO₄ two, H₃PO₄ three: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.');
          steps([{ state: 0 }, { state: 1 }, { state: 2 }, { state: 3 }, { state: 4 }, { state: 5 }], a);
          return;
        }
        if (tab === 'check') {
          UI.cards(right, [
            { prompt: 'In HNO<sub>2</sub> + H<sub>2</sub>O ⇌ NO<sub>2</sub><sup>−</sup> + H<sub>3</sub>O<sup>+</sup>, H<sub>2</sub>O is the…',
              options: [{ label: 'acid' }, { label: 'base', correct: true }], why: 'H₂O becomes H₃O⁺: it accepted an H⁺.' },
            { prompt: 'In CO<sub>3</sub><sup>2−</sup> + H<sub>2</sub>O ⇌ HCO<sub>3</sub><sup>−</sup> + OH<sup>−</sup>, H<sub>2</sub>O is the…',
              options: [{ label: 'acid', correct: true }, { label: 'base' }], why: 'H₂O becomes OH⁻: it donated an H⁺.' },
            { prompt: 'Which one is amphiprotic?',
              options: [{ label: 'HCO<sub>3</sub><sup>−</sup>', correct: true }, { label: 'CO<sub>3</sub><sup>2−</sup>' }, { label: 'H<sub>2</sub>CO<sub>3</sub>' }],
              why: 'HCO₃⁻ is negative and still has an H to lose, so it can gain an H⁺ (to H₂CO₃) or lose one (to CO₃²⁻).' },
            { prompt: 'H<sub>2</sub>CO<sub>3</sub> is…',
              options: [{ label: 'monoprotic' }, { label: 'diprotic', correct: true }, { label: 'triprotic' }],
              why: 'It can supply up to two protons: H₂CO₃ → HCO₃⁻ → CO₃²⁻.' }
          ], { cols: 2 });
          return;
        }
        const a = transferScene(tab);
        // reactants · forward · back again · both sides labelled acid and base
        steps([{ state: 0 }, { state: 1 }, { state: 0 }, { state: 1, tags: true }], a);
      }
    },
    'p11-conj': {
      load() {
        UI.match(right, { items: [
          ['HF', 'hf', 'acid'], ['F<sup>−</sup>', 'hf', 'base'],
          ['NH<sub>4</sub><sup>+</sup>', 'nh', 'acid'], ['NH<sub>3</sub>', 'nh', 'base'],
          ['HSO<sub>4</sub><sup>−</sup>', 'so', 'acid'], ['SO<sub>4</sub><sup>2−</sup>', 'so', 'base'],
          ['H<sub>2</sub>PO<sub>4</sub><sup>−</sup>', 'po', 'acid'], ['HPO<sub>4</sub><sup>2−</sup>', 'po', 'base'],
          ['CH<sub>3</sub>COOH', 'ac', 'acid'], ['CH<sub>3</sub>COO<sup>−</sup>', 'ac', 'base'],
          ['H<sub>3</sub>O<sup>+</sup>', 'w', 'acid'], ['H<sub>2</sub>O', 'w', 'base']
        ].map(([html, pair, role]) => ({ html, pair, role })) });
      }
    },
    'p11-strong': {
      tabs: [['which', 'Which is strong?'], ['conc', 'Strong or concentrated?'], ['six', 'The strong acids']],
      load(tab) {
        if (tab === 'which') {
          // 0.10 M HF: Ka 3.5 × 10⁻⁴ (booklet) → about 6% ionized, drawn as 1 ionized of 17. 0.10 M HCl: all ionized.
          const fHF = CH.ionizedFraction(CH.KA.HF, 0.10);
          const st = { revealed: false };
          const beakers = [
            { list: Array(16).fill('HF').concat(['H3O', 'F']), name: '0.10 M HF', sub: 'about ' + Math.round(fHF * 100) + '% ionized', seed: 1 },
            { list: Array(7).fill(0).flatMap(() => ['H3O', 'Cl']), name: '0.10 M HCl', sub: '100% ionized', seed: 0 }
          ];
          canvas(340, (g, W, H, t) => {
            const P = A.pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
            const ww = W / 2 - 30;
            beakers.forEach((b, k) => {
              const x = 20 + k * (ww + 20);
              A.text(g, st.revealed ? b.name : 'Beaker ' + (k + 1), x + ww / 2, 26, P.ink, 18, 700);
              A.solutionWindow(g, { x, y: 40, w: ww, h: H - 86 }, b.list, t, { key: 'strong' + k, size: 15, water: 40 });
              if (st.revealed) A.text(g, b.sub, x + ww / 2, H - 18, P.dim, 16, 700);
            });
            A.text(g, 'scaled', W - 14, H - 4, P.dim, 11, 500, 'right');
          }, null, 'Two beakers of acid at the same concentration, shown as particles');
          UI.card(right, { prompt: 'Which beaker holds the strong acid?',
            options: [{ label: 'Beaker 1' }, { label: 'Beaker 2', correct: true }],
            why: 'Beaker 2 is all H₃O⁺ and Cl⁻: 100% ionized. Beaker 1 is HF: most of it stays as whole molecules.',
            onPick: () => { st.revealed = true; }, onReset: () => { st.revealed = false; } });
        } else if (tab === 'conc') {
          const rows = [
            ['1.0 M HCl', 'concentrated', 'strong', 1.0],
            ['0.010 M HCl', 'dilute', 'strong', 0.010],
            ['1.0 M CH<sub>3</sub>COOH', 'concentrated', 'weak', hCH3COOH(1.0)],
            ['0.010 M CH<sub>3</sub>COOH', 'dilute', 'weak', hCH3COOH(0.010)]
          ];
          const t = el('table', 'ab-table');
          t.innerHTML = '<thead><tr><th>Solution</th><th>Concentrated or dilute?</th><th>Strong or weak?</th><th>[H<sub>3</sub>O<sup>+</sup>]</th></tr></thead><tbody>' +
            rows.map(r => '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td><td class="num">' + (r[3] >= 0.01 ? r[3].toFixed(r[3] >= 1 ? 1 : 3) + ' M' : sciHTML(r[3], 2, 'M')) + '</td></tr>').join('') + '</tbody>';
          left.appendChild(t);
          UI.card(right, { prompt: 'Which has more H<sub>3</sub>O<sup>+</sup>?',
            options: [{ label: '1.0 M CH<sub>3</sub>COOH' }, { label: '0.010 M HCl', correct: true }],
            why: '0.010 M HCl is all H₃O⁺ (1.0 × 10⁻² M). Only 0.4% of 1.0 M CH₃COOH ionizes (' + CH.sci(hCH3COOH(1.0)).m + ' × 10⁻³ M).' });
        } else {
          // each strong acid with water, a one-way arrow to its conjugate base and H₃O⁺ (teacher, 2026-11-27)
          const S6 = [['HClO<sub>4</sub>', 'ClO<sub>4</sub><sup>−</sup>'], ['HI', 'I<sup>−</sup>'], ['HBr', 'Br<sup>−</sup>'],
            ['HCl', 'Cl<sup>−</sup>'], ['HNO<sub>3</sub>', 'NO<sub>3</sub><sup>−</sup>'], ['H<sub>2</sub>SO<sub>4</sub>', 'HSO<sub>4</sub><sup>−</sup>']];
          const box = el('table', 'ab-strong-eqs');
          box.innerHTML = '<thead><tr><th>Strong acid</th><th></th><th></th><th></th><th>Conjugate base</th><th></th><th></th></tr></thead><tbody>' +
            S6.map(([acid, cb]) => '<tr><td class="sa">' + acid + '</td><td class="op">+</td><td>H<sub>2</sub>O</td><td class="arr">→</td>' +
              '<td class="cb">' + cb + '</td><td class="op">+</td><td class="h3o">H<sub>3</sub>O<sup>+</sup></td></tr>').join('') + '</tbody>';
          box.setAttribute('aria-label', 'The six strong acids, each reacting with water in one direction only to give its conjugate base and H₃O⁺');
          left.appendChild(box);
          UI.card(right, { prompt: 'Which has more H<sub>3</sub>O<sup>+</sup>: 0.10 M HClO<sub>4</sub> or 0.10 M HCl?',
            options: [{ label: 'HClO<sub>4</sub>' }, { label: 'HCl' }, { label: 'The same', correct: true }],
            why: 'Both are 100% ionized, so both are 0.10 M H₃O⁺. In water, strong acids all level to H₃O⁺.' });
        }
      }
    },
    // ================= Part 1.2: Water Reacts With Itself (Hebden IV.7, IV.11). H⁺ until the last section =================
    'p12-self': {
      tabs: [['two', 'Two waters'], ['hot', 'Hot water']],
      load(tab) {
        if (tab === 'hot') {
          UI.cards(right, [
            { prompt: 'When pure water is heated, K<sub>w</sub>…', options: [{ label: 'increases', correct: true }, { label: 'decreases' }, { label: 'stays the same' }],
              why: 'The reaction is endothermic, so heating shifts it to the right: more H⁺ and OH⁻, a bigger Kw.' },
            { prompt: 'Hot pure water is…', options: [{ label: 'acidic' }, { label: 'neutral', correct: true }, { label: 'basic' }],
              why: '[H⁺] and [OH⁻] both go up, but they stay equal, so it is still neutral.' },
            { prompt: 'Which solution is acidic?', options: [{ label: '[H<sup>+</sup>] = 1.0 × 10<sup>−5</sup> M', correct: true }, { label: '[OH<sup>−</sup>] = 1.0 × 10<sup>−5</sup> M' }, { label: '[H<sup>+</sup>] = [OH<sup>−</sup>]' }],
              why: '1.0 × 10⁻⁵ M is more than 1.0 × 10⁻⁷ M, so [H⁺] > [OH⁻].' }
          ], { cols: 1 });
          return;
        }
        const a = transferScene('selfIon');
        steps([
          { state: 0 },
          { state: 1, eqn: '2 H<sub>2</sub>O(l) + 59 kJ ⇌ H<sub>3</sub>O<sup>+</sup>(aq) + OH<sup>−</sup>(aq)' },
          { eqn: 'H<sub>2</sub>O(l) + 59 kJ ⇌ H<sup>+</sup>(aq) + OH<sup>−</sup>(aq)' },
          { eqn: 'K<sub>w</sub> = [H<sup>+</sup>][OH<sup>−</sup>] = 1.00 × 10<sup>−14</sup>' },
          { eqn: 'pure water: [H<sup>+</sup>] = [OH<sup>−</sup>] = 1.0 × 10<sup>−7</sup> M' }
        ], a);
      }
    },
    'p12-balance': {
      load() {
        // [H⁺] for each choice: strong acid / base 100% ionized; weak ones from the booklet Ka (NH₃: Kb = Kw ÷ Ka of NH₄⁺)
        const ohNH3 = CH.weakH(CH.KW / CH.KA.NH4, 0.10);
        const CHOICE = [
          ['water', 'Pure water', -7], ['hcl', '0.10 M HCl', -1], ['ch3cooh', '0.10 M CH<sub>3</sub>COOH', Math.log10(hCH3COOH(0.10))],
          ['naoh', '0.10 M NaOH', -13], ['nh3', '0.10 M NH<sub>3</sub>', -14 - Math.log10(ohNH3)]
        ];
        const st = { lh: -7, target: -7 };
        const row = el('div', 'ab-seg ab-choice'); top.appendChild(row);
        const btns = CHOICE.map(([k, label, lh]) => {
          const b = el('button', 'btn', label); b.type = 'button'; b.setAttribute('aria-pressed', k === 'water' ? 'true' : 'false');
          b.addEventListener('click', () => pick(k)); row.appendChild(b); return b;
        });
        function pick(k) {
          const c = CHOICE.find(x => x[0] === k); st.target = c[2];
          btns.forEach((b, i) => b.setAttribute('aria-pressed', CHOICE[i][0] === k ? 'true' : 'false'));
        }
        canvas(400, (g, W, H, t, dt) => {
          st.lh += (st.target - st.lh) * Math.min(1, dt * 3.2);
          if (Math.abs(st.target - st.lh) < 0.002) st.lh = st.target;
          A.kwBalance(g, W, H, st.lh, t);
        }, null, 'The Kw balance: [H⁺] times [OH⁻] stays 1.00 × 10⁻¹⁴ as one rises and the other falls');
        cur.lines = CHOICE.map(c => ({ pick: c[0] }));
        cur.steps = UI.stepper(right, cur.lines, { bar: footR, onStep: i => pick(i >= 0 ? CHOICE[i][0] : 'water') });
      }
    },
    'p12-find': {
      tabs: [['acid', 'Strong acid'], ['naoh', 'Dissolved NaOH'], ['sr', 'Two OH⁻'], ['turn', 'Your turn']],
      load(tab) {
        if (tab === 'turn') {
          UI.cards(right, [
            { prompt: 'In 0.050 M KOH, [H<sup>+</sup>] is…', options: [{ label: '2.0 × 10<sup>−13</sup> M', correct: true }, { label: '5.0 × 10<sup>−2</sup> M' }, { label: '2.0 × 10<sup>−12</sup> M' }],
              why: 'KOH is a strong base, so [OH⁻] = 0.050 M. [H⁺] = 1.00 × 10⁻¹⁴ ÷ 0.050 = 2.0 × 10⁻¹³ M.' },
            { prompt: 'In 0.025 M Sr(OH)<sub>2</sub>, [OH<sup>−</sup>] is…', options: [{ label: '0.0125 M' }, { label: '0.025 M' }, { label: '0.050 M', correct: true }],
              why: 'Two OH⁻ for each Sr(OH)₂: 0.025 M × 2 = 0.050 M.' },
            { prompt: 'In 3.0 × 10<sup>−4</sup> M HCl, [OH<sup>−</sup>] is…', options: [{ label: '3.3 × 10<sup>−11</sup> M', correct: true }, { label: '3.0 × 10<sup>−4</sup> M' }, { label: '3.3 × 10<sup>−10</sup> M' }],
              why: '[H⁺] = 3.0 × 10⁻⁴ M, so [OH⁻] = 1.00 × 10⁻¹⁴ ÷ 3.0 × 10⁻⁴ = 3.3 × 10⁻¹¹ M.' }
          ], { cols: 1 });
          return;
        }
        const KW = '1.00 × 10<sup>−14</sup>', H = '[H<sup>+</sup>]', OH = '[OH<sup>−</sup>]';
        if (tab === 'acid') work([
          { eqn: 'HNO<sub>3</sub>(aq) → H<sup>+</sup>(aq) + NO<sub>3</sub><sup>−</sup>(aq)' },
          { eqn: H + ' = [HNO<sub>3</sub>] = 2.0 × 10<sup>−3</sup> M' },
          { eqn: 'K<sub>w</sub> = ' + H + OH },
          { eqn: OH + ' = ' + U.frac('K<sub>w</sub>', H) },
          { eqn: OH + ' = ' + U.frac(KW, '2.0 × 10<sup>−3</sup>') + ' = 5.0 × 10<sup>−12</sup> M' }
        ], null, 'What are ' + H + ' and ' + OH + ' in 0.0020 M HNO<sub>3</sub>?');
        if (tab === 'naoh') work([
          { eqn: 'NaOH(s) → Na<sup>+</sup>(aq) + OH<sup>−</sup>(aq)' },
          { eqn: OH + ' = ' + U.chain(U.frac('0.600 ' + U.x('g NaOH'), '250.0 ' + U.x('mL')), U.frac('1 ' + U.x('mol NaOH'), '40.0 ' + U.x('g NaOH')),
            U.frac('1 mol OH<sup>−</sup>', '1 ' + U.x('mol NaOH')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' = 0.0600 M' },
          { eqn: 'K<sub>w</sub> = ' + H + OH },
          { eqn: H + ' = ' + U.frac('K<sub>w</sub>', OH) },
          { eqn: H + ' = ' + U.frac(KW, '0.0600') + ' = 1.67 × 10<sup>−13</sup> M' }
        ], null, '0.600 g of NaOH is dissolved to make 250.0 mL of solution. What are ' + OH + ' and ' + H + '?');
        if (tab === 'sr') work([
          { eqn: 'Sr(OH)<sub>2</sub>(s) → Sr<sup>2+</sup>(aq) + 2 OH<sup>−</sup>(aq)' },
          { eqn: OH + ' = ' + U.chain(U.frac('0.0150 ' + U.x('mol Sr(OH)<sub>2</sub>'), '1 L'), U.frac('2 mol OH<sup>−</sup>', '1 ' + U.x('mol Sr(OH)<sub>2</sub>'))) + ' = 0.0300 M' },
          { eqn: 'K<sub>w</sub> = ' + H + OH },
          { eqn: H + ' = ' + U.frac('K<sub>w</sub>', OH) },
          { eqn: H + ' = ' + U.frac(KW, '0.0300') + ' = 3.33 × 10<sup>−13</sup> M' }
        ], null, 'What are ' + OH + ' and ' + H + ' in 0.0150 M Sr(OH)<sub>2</sub>?');
      }
    },
    'p12-ph': {
      tabs: [['scale', 'The scale'], ['sf', 'Significant figures']],
      load(tab) {
        if (tab === 'sf') {
          const sf = s => '<b class="ab-sf">' + s + '</b>';
          work([
            { eqn: '[H<sup>+</sup>] = ' + sf('4.7') + ' × 10<sup>−4</sup> M' },
            { eqn: 'pH = −log(4.7 × 10<sup>−4</sup>) = 3.' + sf('33') },
            { eqn: '[OH<sup>−</sup>] = ' + sf('6.25') + ' × 10<sup>−3</sup> M' },
            { eqn: 'pOH = −log(6.25 × 10<sup>−3</sup>) = 2.' + sf('204') },
            { eqn: 'pH = 11.' + sf('62') },
            { eqn: '[H<sup>+</sup>] = 10<sup>−11.62</sup> = ' + sf('2.4') + ' × 10<sup>−12</sup> M' }
          ], null, 'To the correct number of significant figures, find the pH when [H<sup>+</sup>] = 4.7 × 10<sup>−4</sup> M, the pOH when [OH<sup>−</sup>] = 6.25 × 10<sup>−3</sup> M, and [H<sup>+</sup>] when the pH is 11.62.');
          return;
        }
        const st = { ph: 7, target: 7 };
        canvas(270, (g, W, H, t, dt) => {
          st.ph += (st.target - st.ph) * Math.min(1, dt * 5);
          if (Math.abs(st.target - st.ph) < 0.001) st.ph = st.target;
          A.phStrip(g, W, H, st.ph);
        }, null, 'The pH scale with [H⁺], [OH⁻] and pOH lined up under it');
        const wrap = el('div', 'ab-ph-slider');
        const lab = el('label', null, 'pH'); lab.htmlFor = 'phSlide';
        const sl = el('input'); sl.type = 'range'; sl.min = 0; sl.max = 14; sl.step = 0.01; sl.value = 7; sl.id = 'phSlide';
        wrap.append(lab, sl); left.appendChild(wrap);
        const out = el('div', 'ab-eqn'); out.setAttribute('aria-live', 'polite'); left.appendChild(out);
        const show = ph => {
          const h = Math.pow(10, -ph), oh = Math.pow(10, ph - 14);
          out.innerHTML = 'pH = ' + ph.toFixed(2) + ' · [H<sup>+</sup>] = ' + sciHTML(h, 2, 'M') + ' · pOH = ' + (14 - ph).toFixed(2) + ' · [OH<sup>−</sup>] = ' + sciHTML(oh, 2, 'M');
        };
        const set = ph => { st.target = ph; sl.value = ph; show(ph); };
        sl.addEventListener('input', () => { st.target = +sl.value; show(+sl.value); });
        show(7);
        // Next step: 2, then 3 (one pH unit is a factor of ten), neutral, then basic
        cur.lines = [2, 3, 7, 12].map(ph => ({ ph }));
        cur.steps = UI.stepper(right, cur.lines, { bar: footR, onStep: i => set(i >= 0 ? cur.lines[i].ph : 7) });
      }
    },
    'p12-square': {
      tabs: [['travel', 'Travel'], ['which', 'Acidic or basic?']],
      load(tab) {
        if (tab === 'which') {
          const AB = [['acidic', 'acidic'], ['neutral', 'neutral'], ['basic', 'basic']];
          const q = (prompt, k, why) => ({ prompt, options: AB.map(([kk, t]) => ({ label: t, correct: kk === k })), why });
          UI.cards(right, [
            q('pH = 8.3', 'basic', 'pH above 7.'),
            q('pOH = 2.6', 'basic', 'pOH below 7 means pH above 7: pH = 14.0 − 2.6 = 11.4.'),
            q('[H<sup>+</sup>] = 6.0 × 10<sup>−4</sup> M', 'acidic', 'More than 1.0 × 10⁻⁷ M.'),
            q('[OH<sup>−</sup>] = 1.0 × 10<sup>−7</sup> M', 'neutral', 'Equal to [H⁺] in pure water.'),
            q('pOH = 11.2', 'acidic', 'pH = 14.0 − 11.2 = 2.8.'),
            q('[OH<sup>−</sup>] = 4.0 × 10<sup>−11</sup> M', 'acidic', 'Less OH⁻ than neutral water, so more H⁺.')
          ], { cols: 2 });
          return;
        }
        // The magic square as a solver: type a value into any corner (Enter, or leave the box) and the other three
        // are worked out around the square, each step shown. Next step travels one corner at a time instead.
        // Significant figures (Hebden IV.11): a concentration's sig figs = the decimal places of its pH or pOH.
        const NAME = { H: '[H<sup>+</sup>]', OH: '[OH<sup>−</sup>]', pH: 'pH', pOH: 'pOH' };
        const PLAIN = { H: '[H⁺]', OH: '[OH⁻]', pH: 'pH', pOH: 'pOH' };
        const ROUTE = { H: ['pH', 'pOH', 'OH'], OH: ['pOH', 'pH', 'H'], pH: ['H', 'pOH', 'OH'], pOH: ['OH', 'pH', 'H'] };
        const FROM = { pH: { H: 'H', pOH: 'pOH' }, pOH: { OH: 'OH', pH: 'pH' }, H: { pH: 'pH', OH: 'OH' }, OH: { pOH: 'pOH', H: 'H' } };
        const isConc = k => k === 'H' || k === 'OH';
        const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
        const concText = (v, sig) => { const c = CH.sci(v, sig); return c.m + ' × 10' + A.sup(c.e); };
        const concHTML = (v, sig) => { const c = CH.sci(v, sig); return c.m + ' × 10<sup>' + String(c.e).replace('-', '−') + '</sup>'; };
        // "3.2 × 10⁻⁵", "3.2x10^-5", "3.2e-5", "0.000032" → { v, sig }; "4.49" → { v, dp }
        function parse(k, raw) {
          let t = String(raw).trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, ch => SUPS[ch]).replace(/−/g, '-').replace(/\s|M$/gi, '');
          if (!isConc(k)) { if (!/^-?\d+(\.\d*)?$/.test(t)) return null; return { v: +t, dp: (t.split('.')[1] || '').length }; }
          t = t.replace(/[×x*]10\^?/i, 'e');
          if (!/^\d*\.?\d+(e-?\d+)?$/i.test(t) || !(+t > 0)) return null;
          let man = t.split(/e/i)[0].replace('.', '').replace(/^0+/, '');
          return { v: +t, sig: Math.max(1, man.length) };
        }
        const wrap = el('div', 'ab-sq-wrap'); left.appendChild(wrap);
        const sq = el('div', 'ab-square'); wrap.appendChild(sq);
        // the four sides: a two-way arrow and how to go each way
        const SIDES = {
          top: ['H', 'OH', 'K<sub>w</sub> = [H<sup>+</sup>][OH<sup>−</sup>]', ''],
          bottom: ['pH', 'pOH', 'pH + pOH = 14.00', ''],
          left: ['H', 'pH', '−log', '10<sup>−pH</sup>'],
          right: ['OH', 'pOH', '−log', '10<sup>−pOH</sup>']
        };
        const sides = {};
        Object.keys(SIDES).forEach(k => {
          const [, , a, b] = SIDES[k], vert = k === 'left' || k === 'right';
          const d = el('div', 'ab-sq-side ' + k);
          // a two-way arrow: fixed heads, a line between them that stretches
          const head = rot => '<svg class="ab-sq-head" viewBox="0 0 20 20" aria-hidden="true" style="transform:rotate(' + rot + 'deg)"><path d="M14 3 L5 10 L14 17"/></svg>';
          const arrow = '<span class="ab-sq-arrow">' + head(vert ? 90 : 0) + '<span class="ab-sq-shaft"></span>' + head(vert ? -90 : 180) + '</span>';
          d.innerHTML = vert ? '<span class="ab-sq-lab">' + a + ' ↓</span>' + arrow + '<span class="ab-sq-lab">↑ ' + b + '</span>'
            : '<span class="ab-sq-lab">' + a + '</span>' + arrow;
          sq.appendChild(d); sides[k] = d;
        });
        const sideOf = (a, b) => Object.keys(SIDES).find(k => (SIDES[k][0] === a && SIDES[k][1] === b) || (SIDES[k][0] === b && SIDES[k][1] === a));
        const cells = {};
        [['H', 'tl'], ['OH', 'tr'], ['pH', 'bl'], ['pOH', 'br']].forEach(([k, pos]) => {
          const c = el('label', 'ab-sq-corner ' + pos);
          c.innerHTML = '<span class="ab-sq-name">' + NAME[k] + '</span>';
          const inp = el('input', 'ab-sq-in'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.spellcheck = false;
          inp.setAttribute('aria-label', PLAIN[k] + (isConc(k) ? ' in mol per litre' : ''));
          const row = el('span', 'ab-sq-row'); row.appendChild(inp);
          if (isConc(k)) row.appendChild(el('span', 'ab-sq-unit', 'M'));
          c.appendChild(row);
          const go = () => { if (inp.value.trim() === '' || inp.dataset.shown === inp.value) return; solveFrom(k, inp.value); };
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
          inp.addEventListener('change', go);
          sq.appendChild(c); cells[k] = { c, inp };
        });
        const log = el('div', 'ab-eqn ab-calc ab-sq-log'); log.setAttribute('aria-live', 'polite'); wrap.appendChild(log);
        let val = {}, src = 'OH';
        function show(k, quiet) {
          const x = val[k], inp = cells[k].inp;
          inp.value = x ? (isConc(k) ? concText(x.v, x.sig) : x.v.toFixed(x.dp)) : '';
          inp.dataset.shown = inp.value;
          cells[k].c.classList.toggle('is-known', !!x);
          cells[k].c.classList.toggle('is-source', k === src && !!x);
          cells[k].c.classList.toggle('is-new', !!x && !quiet && k !== src);
          cells[k].c.classList.remove('is-bad');
        }
        // one step around the square: the new value and the lines that get there
        function move(from, to) {
          const f = val[from], fs = isConc(from) ? concHTML(f.v, f.sig) : f.v.toFixed(f.dp);
          if (isConc(from) && !isConc(to)) { const v = -Math.log10(f.v); return [{ v, dp: f.sig }, [NAME[to] + ' = −log(' + fs + ') = ' + v.toFixed(f.sig)]]; }
          if (!isConc(from) && isConc(to)) { const v = Math.pow(10, -f.v), sig = Math.max(1, f.dp); return [{ v, sig }, [NAME[to] + ' = 10<sup>−' + fs + '</sup> = ' + concHTML(v, sig) + ' M']]; }
          if (!isConc(from)) { const v = 14 - f.v; return [{ v, dp: f.dp }, [NAME[to] + ' = ' + (14).toFixed(f.dp) + ' − ' + fs + ' = ' + v.toFixed(f.dp)]]; }
          const v = 1e-14 / f.v;   // Kw: the expression, the rearranged form, then the numbers
          return [{ v, sig: f.sig }, ['K<sub>w</sub> = [H<sup>+</sup>][OH<sup>−</sup>]', NAME[to] + ' = ' + U.frac('K<sub>w</sub>', NAME[from]),
            NAME[to] + ' = ' + U.frac('1.00 × 10<sup>−14</sup>', fs) + ' = ' + concHTML(v, f.sig) + ' M']];
        }
        function start(k, x) {
          src = k; val = { [k]: x }; log.innerHTML = '';
          Object.values(sides).forEach(s => s.classList.remove('is-used'));
          Object.keys(cells).forEach(c => show(c, true));
        }
        function travel(quiet) {   // fill the next corner on the route from the starting corner
          const to = ROUTE[src].find(k => !val[k]);
          if (!to) return false;
          const from = Object.keys(FROM[to]).find(k => val[k]);
          const [x, lines] = move(from, to);
          val[to] = x;
          lines.forEach((ln, i) => log.insertAdjacentHTML('beforeend', '<div class="ab-calc-line' + (quiet || i < lines.length - 1 ? '' : ' is-new') + '">' + ln + '</div>'));
          sides[sideOf(from, to)].classList.add('is-used');
          show(to, quiet);
          return true;
        }
        function solveFrom(k, raw) {
          const x = parse(k, raw);
          if (!x) { cells[k].c.classList.add('is-bad'); return; }
          start(k, x);
          while (travel(false)) { /* every corner */ }
          if (cur.steps) cur.steps.all();
        }
        const EXAMPLE = () => start('OH', { v: 3.2e-5, sig: 2 });
        EXAMPLE();
        cur.lines = [0, 1, 2].map(i => ({ i }));
        cur.steps = UI.stepper(right, cur.lines, { bar: footR, onStep: i => {
          const keep = src === 'OH' && val.OH && val.OH.v === 3.2e-5 ? null : { k: src, x: val[src] };   // a typed start is kept
          if (keep) start(keep.k, keep.x); else EXAMPLE();
          for (let j = 0; j <= i; j++) travel(j < i);
        } });
      }
    },
    'p12-h3o': {
      load() {
        const a = transferScene('bare');
        steps([
          { state: 0 },
          { state: 1 },
          { eqn: 'K<sub>w</sub> = [H<sub>3</sub>O<sup>+</sup>][OH<sup>−</sup>] = 1.00 × 10<sup>−14</sup>' },
          { eqn: 'pH = −log[H<sub>3</sub>O<sup>+</sup>]' }
        ], a);
      }
    },

    // ================= Part 1.3: Neutralization and Titration (Hebden IV.12, IV.16, IV.18) =================
    'p13-mix': {
      load() {
        // 30.0 mL of 0.200 M HCl + 20.0 mL of 0.150 M NaOH. One particle = 1.00 × 10⁻³ mol (scaled); water to scale with the volumes
        const spec = { acid: { title: '0.200 M HCl', vol: 30.0, list: [].concat(...Array(6).fill(['H3O', 'Cl']), Array(12).fill('H2O')) },
          base: { title: '0.150 M NaOH', vol: 20.0, list: [].concat(...Array(3).fill(['OH', 'Na']), Array(8).fill('H2O')) }, mixTitle: 'mixture' };
        const L1 = U.frac('1 ' + U.x('L'), '1000 ' + U.x('mL')), H3O = 'H<sub>3</sub>O<sup>+</sup>';
        mixWork(spec, '30.0 mL of 0.200 M HCl is mixed with 20.0 mL of 0.150 M NaOH. What is the pH of the mixture?', [
          { col: 0, state: 0, html: 'moles ' + H3O + ' = ' + U.chain('30.0 ' + U.x('mL'), L1, U.frac('0.200 mol ' + H3O, '1 ' + U.x('L'))) + ' = ' + chip('h', '6.00 × 10<sup>−3</sup> mol ' + H3O) },
          { col: 1, html: 'moles OH<sup>−</sup> = ' + U.chain('20.0 ' + U.x('mL'), L1, U.frac('0.150 mol OH<sup>−</sup>', '1 ' + U.x('L'))) + ' = ' + chip('oh', '3.00 × 10<sup>−3</sup> mol OH<sup>−</sup>') },
          { col: 2, state: 1, html: '30.0 mL + 20.0 mL = 50.0 mL' },
          { col: 2, state: 2, html: H3O + ' + OH<sup>−</sup> → 2 H<sub>2</sub>O' },
          { col: 2, fly: true, html: from('h') + ' − ' + from('oh') + ' = 3.00 × 10<sup>−3</sup> mol ' + H3O + ' left over' },
          { col: 2, html: '[' + H3O + '] = ' + U.chain(U.frac('3.00 × 10<sup>−3</sup> mol ' + H3O, '50.0 ' + U.x('mL')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' = 0.0600 M' },
          { col: 2, html: 'pH = −log(0.0600) = 1.222' }
        ]);
      }
    },
    'p13-two': {
      load() {
        // 40.0 mL of 0.100 M HCl + 25.0 mL of 0.100 M Sr(OH)₂. One particle = 5.0 × 10⁻⁴ mol (scaled)
        const spec = { acid: { title: '0.100 M HCl', vol: 40.0, list: [].concat(...Array(8).fill(['H3O', 'Cl']), Array(14).fill('H2O')) },
          base: { title: '0.100 M Sr(OH)₂', vol: 25.0, list: [].concat(...Array(5).fill(['OH', 'Sr', 'OH']), Array(9).fill('H2O')) }, mixTitle: 'mixture' };
        const L1 = U.frac('1 ' + U.x('L'), '1000 ' + U.x('mL')), H3O = 'H<sub>3</sub>O<sup>+</sup>', SR = 'Sr(OH)<sub>2</sub>';
        mixWork(spec, '40.0 mL of 0.100 M HCl is mixed with 25.0 mL of 0.100 M ' + SR + '. What is the pH of the mixture?', [
          { col: 0, state: 0, html: 'moles ' + H3O + ' = ' + U.chain('40.0 ' + U.x('mL'), L1, U.frac('0.100 mol ' + H3O, '1 ' + U.x('L'))) + ' = ' + chip('h', '4.00 × 10<sup>−3</sup> mol ' + H3O) },
          { col: 1, html: 'moles OH<sup>−</sup> = ' + U.chain('25.0 ' + U.x('mL'), L1, U.frac('0.100 ' + U.x('mol ' + SR), '1 ' + U.x('L')), U.frac('2 mol OH<sup>−</sup>', '1 ' + U.x('mol ' + SR))) + ' = ' + chip('oh', '5.00 × 10<sup>−3</sup> mol OH<sup>−</sup>') },
          { col: 2, state: 1, html: '40.0 mL + 25.0 mL = 65.0 mL' },
          { col: 2, state: 2, html: H3O + ' + OH<sup>−</sup> → 2 H<sub>2</sub>O' },
          { col: 2, fly: true, html: from('oh') + ' − ' + from('h') + ' = 1.00 × 10<sup>−3</sup> mol OH<sup>−</sup> left over' },
          { col: 2, html: '[OH<sup>−</sup>] = ' + U.chain(U.frac('1.00 × 10<sup>−3</sup> mol OH<sup>−</sup>', '65.0 ' + U.x('mL')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' = 0.01538 M' },
          { col: 2, html: 'pOH = −log(0.01538) = 1.813' },
          { col: 2, html: 'pH = 14.000 − 1.813 = 12.187' }
        ]);
      }
    },
    'p13-back': {
      tabs: [['work', 'Worked example'], ['turn', 'Your turn']],
      load(tab) {
        if (tab === 'turn') {
          UI.card(right, { prompt: 'What mass of KOH(s) must be added to 250.0 mL of 0.0400 M HNO<sub>3</sub> to make the pH 2.000? Assume the volume does not change.',
            options: [{ label: '0.140 g' }, { label: '0.421 g', correct: true }, { label: '0.561 g' }],
            why: '[H₃O⁺] left over = 1.00 × 10⁻² M, so 2.50 × 10⁻³ mol stays. 1.00 × 10⁻² − 2.50 × 10⁻³ = 7.50 × 10⁻³ mol KOH × 56.1 g/mol = 0.421 g.' });
          return;
        }
        const L1 = U.frac('1 ' + U.x('L'), '1000 ' + U.x('mL'));
        work([
          { eqn: '[H<sub>3</sub>O<sup>+</sup>] left over = 10<sup>−2.300</sup> = 5.01 × 10<sup>−3</sup> M' },
          { eqn: 'moles left over = ' + U.chain('500.0 ' + U.x('mL'), L1, U.frac('5.01 × 10<sup>−3</sup> mol H<sub>3</sub>O<sup>+</sup>', '1 ' + U.x('L'))) + ' = 2.51 × 10<sup>−3</sup> mol H<sub>3</sub>O<sup>+</sup>' },
          { eqn: 'moles at the start = ' + U.chain('500.0 ' + U.x('mL'), L1, U.frac('0.0200 mol H<sub>3</sub>O<sup>+</sup>', '1 ' + U.x('L'))) + ' = 1.00 × 10<sup>−2</sup> mol H<sub>3</sub>O<sup>+</sup>' },
          { eqn: 'moles that react = 1.00 × 10<sup>−2</sup> − 2.51 × 10<sup>−3</sup> = 7.49 × 10<sup>−3</sup> mol OH<sup>−</sup>' },
          { eqn: 'mass NaOH = ' + U.chain('7.49 × 10<sup>−3</sup> ' + U.x('mol OH<sup>−</sup>'), U.frac('1 ' + U.x('mol NaOH'), '1 ' + U.x('mol OH<sup>−</sup>')),
            U.frac('40.0 g NaOH', '1 ' + U.x('mol NaOH'))) + ' = 0.300 g NaOH' }
        ], null, 'What mass of NaOH(s) must be added to 500.0 mL of 0.0200 M HCl to make the pH 2.300? Assume the volume does not change.');
      }
    },
    'p13-glass': {
      load() {
        const b = AbTitration.bench(left);
        cur.lines = b.pieces.map(k => ({ k }));
        cur.steps = UI.stepper(right, cur.lines, { bar: footR, onStep: i => { if (i >= 0) b.pick(b.pieces[i]); } });
      }
    },
    'p13-equiv': {
      load() {
        const d = AbTitration.demo();
        d.controls(top);
        const c = canvas(560, (g, W, H, t, dt) => d.draw(g, W, H, t, dt), () => d.swirl(),
          'A titration: NaOH in a burette above an Erlenmeyer flask of acid with phenolphthalein, and a magnifying lens on the burette reading');
        d.rig(c.cv);
        d.table(right);
        grid.classList.add('is-demo');
      }
    },
    'p13-calc': {
      tabs: [['hcl', 'HCl (1 : 1)'], ['h2so4', 'H₂SO₄ (1 : 2)']],
      load(tab) {
        const trials = (v, out) => '<table class="ab-table ab-mini"><tr><th>Trial</th>' + v.map((_, i) => '<th>' + (i + 1) + '</th>').join('') + '</tr><tr><th>NaOH (mL)</th>' +
          v.map((x, i) => '<td' + (out.indexOf(i) >= 0 ? ' class="is-out"' : '') + '>' + x + '</td>').join('') + '</tr></table>';
        const L1 = U.frac('1 ' + U.x('L'), '1000 ' + U.x('mL')), NA = U.frac('0.1052 ' + U.x('mol NaOH'), '1 ' + U.x('L'));
        if (tab === 'hcl') work([
          { eqn: 'average of trials 2 and 3 = 21.44 mL' },
          { eqn: 'HCl + NaOH → NaCl + H<sub>2</sub>O' },
          { eqn: 'moles HCl = ' + U.chain('21.44 ' + U.x('mL'), L1, NA, U.frac('1 mol HCl', '1 ' + U.x('mol NaOH'))) + ' = 2.2555 × 10<sup>−3</sup> mol HCl' },
          { eqn: '[HCl] = ' + U.chain(U.frac('2.2555 × 10<sup>−3</sup> mol HCl', '25.00 ' + U.x('mL')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' = 0.09022 M' }
        ], null, '25.00 mL samples of HCl are titrated with 0.1052 M NaOH. What is [HCl]?' + trials(['21.85', '21.42', '21.46'], []));
        else work([
          { eqn: 'average of trials 2 and 3 = 18.73 mL' },
          { eqn: 'H<sub>2</sub>SO<sub>4</sub> + 2 NaOH → Na<sub>2</sub>SO<sub>4</sub> + 2 H<sub>2</sub>O' },
          { eqn: 'moles H<sub>2</sub>SO<sub>4</sub> = ' + U.chain('18.73 ' + U.x('mL'), L1, NA, U.frac('1 mol H<sub>2</sub>SO<sub>4</sub>', '2 ' + U.x('mol NaOH'))) + ' = 9.852 × 10<sup>−4</sup> mol H<sub>2</sub>SO<sub>4</sub>' },
          { eqn: '[H<sub>2</sub>SO<sub>4</sub>] = ' + U.chain(U.frac('9.852 × 10<sup>−4</sup> mol H<sub>2</sub>SO<sub>4</sub>', '25.00 ' + U.x('mL')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' = 0.03941 M' }
        ], null, '25.00 mL samples of H<sub>2</sub>SO<sub>4</sub> are titrated with 0.1052 M NaOH. What is [H<sub>2</sub>SO<sub>4</sub>]?' + trials(['19.05', '18.71', '18.75'], []));
      }
    },
    'p13-error': {
      load() {
        const E = [['high', 'Too high'], ['low', 'Too low'], ['same', 'No different']];
        const q = (prompt, k, why) => ({ prompt, options: E.map(([kk, t]) => ({ label: t, correct: kk === k })), why });
        UI.cards(right, [
          q('Going past the end point: the flask turns deep pink', 'high', 'More NaOH is recorded than the acid needed.'),
          q('An air bubble in the burette tip comes out during the titration', 'high', 'The bubble is read as NaOH delivered, so the recorded volume is too big.'),
          q('The burette was rinsed with distilled water, not with the NaOH', 'high', 'Water left inside dilutes the NaOH, so more of it is needed.'),
          q('The pipette was rinsed with distilled water, not with the acid', 'low', 'Water left inside dilutes the acid, so the flask holds fewer moles than we think and less NaOH is needed.'),
          q('Distilled water is added to the flask to rinse its walls', 'same', 'Water does not change the moles of acid in the flask.'),
          q('Both burette readings are taken from above the meniscus, off by the same amount', 'same', 'Both readings are off by the same amount, so their difference, the volume, is still right.')
        ], { cols: 2 });
      }
    }
  };

  // ---------- one section on the stage ----------
  function clear() {
    top.innerHTML = ''; left.innerHTML = ''; right.innerHTML = ''; footL.innerHTML = ''; footR.innerHTML = '';
    grid.scrollTop = 0;
  }
  function markGrid() {
    grid.classList.toggle('no-top', !top.childElementCount);
    grid.classList.toggle('no-left', !left.childElementCount);
  }
  // Before we begin runs the full page width above the stage. While scrolling it hands the stage to the first
  // section after it, so that picture is ready when the stage comes into view; presentation view shows it as a slide.
  function stageBeat(b) {
    if (!b.classList.contains('brief-beat') || document.body.classList.contains('learn-mode')) return b;
    return beats[beats.indexOf(b) + 1] || b;
  }
  function dock(b) {
    if (inline.on() || !b) return;
    const part = b.closest('.guide-part'), d = part && part.querySelector('.stage-dock');
    if (d && stage.parentNode !== d) { d.appendChild(stage); dispatchEvent(new Event('resize')); }
  }
  function applyBeat(b, force) {
    if (!b || (b === active && !force)) return;
    inline.place(stageBeat(b)); // before the stage is cleared, so its still copy keeps the last section
    dock(stageBeat(b));
    beats.forEach(x => x.classList.toggle('is-active', x === b));
    active = b;
    const sb = stageBeat(b);
    $('badge').innerHTML = sb.dataset.badge || '';
    if (cur && cur.id === sb.id && !force) return;   // already on the stage (handed over by Before we begin)
    const sec = SECTIONS[sb.id];
    load(sb.id, sec && sec.tabs ? sec.tabs[0][0] : null);
  }
  function load(id, tab) {
    clear();
    const sec = SECTIONS[id];
    cur = { id, sec, tab, canvases: [], steps: null, anim: null, lines: null, tags: false };
    grid.className = 'ice-grid ab-grid' + (sec && sec.tabs ? '' : '');
    if (!sec) { loadStatic(id); markGrid(); return; }
    if (sec.tabs) {
      const row = el('div', 'ab-tab-row'); top.appendChild(row);
      cur.tabsUI = UI.tabs(row, sec.tabs, tab, k => load(id, k));
    }
    sec.load(tab);
    markGrid();
  }
  // Before we begin: the lesson's learning intentions and competencies, shown on the stage as the first slide
  function loadStatic(id) {
    const tpl = $('tpl-' + id), art = $(id);
    grid.classList.add('one-col');
    if (tpl) left.appendChild(tpl.content.cloneNode(true));
    else if (art && art.querySelector('.brief-cols')) {
      const slide = el('div', 'ab-brief-slide');
      slide.appendChild(el('h2', 'ab-brief-title', art.querySelector('h2').innerHTML));
      slide.appendChild(art.querySelector('.brief-cols').cloneNode(true));
      left.appendChild(slide);
    }
  }

  // ---------- drawing ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (active) dock(stageBeat(active));   // after a resize the inline slots hand the stage back to Part 1.1's dock
    if (cur) cur.canvases.forEach(c => {
      c.g.setTransform(2, 0, 0, 2, 0, 0);
      c.draw(c.g, W, c.h, (now - c.t0) / 1000 + (+q.get('t') || 0), dt);
    });
    requestAnimationFrame(frame);
  }

  // ---------- scroll: the section nearest the reading line drives the stage ----------
  let activeDist = Infinity, pinUntil = 0;
  const HYSTERESIS = 56;
  function pickBeatFromScroll() {
    if (Date.now() < pinUntil || inline.on()) return;
    const mid = innerHeight * 0.38; let best = null, bestDist = Infinity;
    activeDist = Infinity;
    beats.forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 80) return;
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (b === active) activeDist = dist;
      if (dist < bestDist) { bestDist = dist; best = b; }
    });
    const lastBeat = beats[beats.length - 1];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && lastBeat.getBoundingClientRect().top < innerHeight - 80) { best = lastBeat; bestDist = -Infinity; }
    if (best && best !== active && bestDist + HYSTERESIS < activeDist) applyBeat(best);
  }
  let tick = 0;
  addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; pickBeatFromScroll(); }); }, { passive: true });
  function goToBeat(id) { const b = $(id); if (!b) return; pinUntil = Date.now() + 700; applyBeat(b); }
  document.querySelectorAll('.guide-toc a[href^="#"], .guide-beat a[href^="#"]').forEach(a => a.addEventListener('click', () => goToBeat(a.getAttribute('href').slice(1))));
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id) goToBeat(id); });

  // ---------- presentation view ----------
  // ‹ › / arrow keys / clicker: the next worked line, then the next picture tab, then the next section.
  const learnToggle = $('learnToggle'), LEARN_KEY = 'ab-guide-learn';
  const learnOn = () => document.body.classList.contains('learn-mode');
  const noScroll = q.has('beat');
  function scrollToBeat(b, smooth) {
    if (noScroll) return;
    if (inline.on()) { inline.scrollTo(b, smooth); return; }
    const r = b.getBoundingClientRect();
    scrollTo({ top: Math.max(0, scrollY + r.top + r.height / 2 - innerHeight * 0.38), behavior: smooth ? 'smooth' : 'auto' });
  }
  function stepBeat(dir) {
    const i = beats.indexOf(active) + dir;
    if (i < 0 || i >= beats.length) return;
    goToBeat(beats[i].id); scrollToBeat(beats[i], true);
    if (dir < 0 && cur && cur.sec && cur.sec.tabs) { // coming back: land on the last tab, fully shown
      const lastTab = cur.sec.tabs[cur.sec.tabs.length - 1][0];
      if (lastTab !== cur.tab) load(cur.id, lastTab);
      if (cur.steps) cur.steps.all();
    }
  }
  function tabIndex() { return cur && cur.sec && cur.sec.tabs ? cur.sec.tabs.findIndex(t => t[0] === cur.tab) : -1; }
  function next() {
    if (!cur) return stepBeat(1);
    if (cur.steps && cur.steps.index < cur.steps.length) { cur.steps.next(); return; }
    const ti = tabIndex();
    if (ti >= 0 && ti < cur.sec.tabs.length - 1) { load(cur.id, cur.sec.tabs[ti + 1][0]); return; }
    stepBeat(1);
  }
  function back() {
    if (cur && cur.steps && cur.steps.index > 0) { cur.steps.back(); return; }
    const ti = tabIndex();
    if (ti > 0) { load(cur.id, cur.sec.tabs[ti - 1][0]); if (cur.steps) cur.steps.all(); return; }
    stepBeat(-1);
  }
  function setLearn(on) {
    document.body.classList.toggle('learn-mode', on);
    inline.sync(); // narrow screens: the stage leaves (or returns to) the slot under its section
    learnToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(LEARN_KEY, on ? '1' : '0'); } catch (e) { /* private window */ }
    if (active) { pinUntil = Date.now() + 300; if (active.classList.contains('brief-beat')) applyBeat(active, true); scrollToBeat(active, false); }
  }
  learnToggle.addEventListener('click', () => setLearn(!learnOn()));
  $('learnPrev').addEventListener('click', back);
  $('learnNext').addEventListener('click', next);
  SectionJump.attach({ badge: $('badge'), beats, current: () => active, go: b => { goToBeat(b.id); scrollToBeat(b, true); }, label: b => b.dataset.nav || null });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'p' || e.key === 'P') && !e.altKey && !e.ctrlKey && !e.metaKey && !typing) { e.preventDefault(); setLearn(!learnOn()); return; }
    if (!learnOn() || e.altKey || e.ctrlKey || e.metaKey || typing) return;
    const onControl = /^(BUTTON|SELECT)$/.test(e.target.tagName), k = e.key;
    if (k === 'Escape') setLearn(false);
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !onControl && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && !onControl && e.shiftKey)) { e.preventDefault(); back(); }
  });

  // ---------- start ----------
  // dev hooks for headless checks: ?beat=p11-bl&tab=hf&steps=2&model=fill&learn=1&pick=0&t=3
  let learnSaved = false;
  try { learnSaved = localStorage.getItem(LEARN_KEY) === '1'; } catch (e) { /* private window */ }
  const startId = q.get('beat') || location.hash.slice(1);
  const start = (startId && $(startId)) || beats[0];
  if (q.has('learn') || learnSaved) setLearn(true);
  applyBeat(start);
  if (q.get('tab') && cur.sec && cur.sec.tabs) load(cur.id, q.get('tab'));
  if (start !== beats[0] && !noScroll) start.scrollIntoView();
  if (q.has('steps') && cur.steps) { for (let i = 0; i < +q.get('steps'); i++) cur.steps.next(); if (cur.anim) cur.anim.f = cur.anim.target; }
  if (q.has('pick')) { const b = right.querySelectorAll('.ab-opt')[+q.get('pick')]; if (b) b.click(); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(frame));
  window.__ab = { cur: () => cur, apply: applyBeat, load, beats, stage, stageBeat, active: () => active };   // dev: dev/review-test.js
})();
