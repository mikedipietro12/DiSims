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
  let model = ['lewis', 'ball', 'fill'].indexOf(q.get('model')) >= 0 ? q.get('model') : 'lewis'; // kept across sections

  // ---------- numbers shown on the stage ----------
  const sciHTML = (v, sig, unit) => { const s = CH.sci(v, sig); return s.m + ' × 10<sup>' + String(s.e).replace('-', '−') + '</sup>' + (unit ? ' ' + unit : ''); };
  const hCH3COOH = c => CH.weakH(CH.KA.CH3COOH, c);

  // ---------- proton transfers ----------
  // eq: [text, side (0 reactants, 1 products, -1 arrow), role colour once formed, acid / base tag]
  const T = {
    hcl: { L: null, R: { sym: 'Cl', hs: [], lps: [-90, 90, 0], don: 180, become: 'anion', charge: '−' },
      eq: [['HCl(aq)', 0], ['  →  ', -1], ['H⁺(aq)', 1, 'acid'], [' + ', 1], ['Cl⁻(aq)', 1, 'anion']] },
    h3o: { L: { sym: 'O', hs: [180, 90], lps: [-90], acc: 0, become: 'acid', charge: '+' }, R: null,
      eq: [['H⁺', 0], [' + ', 0], ['H₂O', 0], ['  →  ', -1], ['H₃O⁺', 1, 'acid']] },
    nh3: { L: { sym: 'N', hs: [180, -90, 90], lps: [], acc: 0, become: 'cation', charge: '+' },
      R: { sym: 'O', hs: [55], lps: [-70, 125], don: 180, become: 'base', charge: '−' },
      eq: [['NH₃', 0, null, 'base'], ['  +  ', 0], ['H₂O', 0, null, 'acid'], ['   ⇌   ', -1], ['NH₄⁺', 1, 'cation', 'acid'], ['  +  ', 1], ['OH⁻', 1, 'base', 'base']] },
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
    ['Turns litmus red', 'acid', 'Acids turn litmus red.'],
    ['Turns litmus blue', 'base', 'Bases turn litmus blue.'],
    ['Conducts electricity in water', 'both', 'Both are electrolytes: they make ions in water.'],
    ['Reacts with magnesium to make H₂ gas', 'acid', 'Mg is reactive enough to make H₂(g) with acids.'],
    ['Feels slippery', 'base', 'Bases react with the oils on skin to make soap.'],
    ['Tastes sour', 'acid', 'Vinegar and lemon juice are acids. We never taste anything in the lab.']
  ];
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
        if (tab === 'acid') {
          const a = transferScene('hcl');
          steps([{ state: 0 }, { state: 1 }], a);
        } else if (tab === 'base') {
          const a = anim(); cur.anim = a;
          canvas(330, (g, W, H, t, dt) => { stepAnim(a, dt); A.dissociate(g, W, H, A.ease(A.clamp(a.f, 0, 1)), t); }, () => tap(a), 'NaOH separating into Na⁺ and OH⁻ in water');
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
          UI.cards(right, PROPS.map(([p, k, why]) => ({ prompt: sub(p), options: BOTH.map(([kk, t]) => ({ label: t, correct: kk === k })), why })), { cols: 2 });
        }
      }
    },
    'p11-h3o': {
      load() {
        const a = transferScene('h3o');
        steps([
          { state: 0 },
          { state: 1 },
          { eqn: 'HCl(g) → H<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)' },
          { eqn: 'HCl(g) + H<sub>2</sub>O(l) → H<sub>3</sub>O<sup>+</sup>(aq) + Cl<sup>−</sup>(aq)' }
        ], a);
      }
    },
    'p11-bl': {
      tabs: [['nh3', 'NH₃ + H₂O'], ['hf', 'HF + H₂O'], ['check', 'Check yourself']],
      load(tab) {
        if (tab === 'check') {
          UI.cards(right, [
            { prompt: 'In HNO<sub>2</sub> + H<sub>2</sub>O ⇌ NO<sub>2</sub><sup>−</sup> + H<sub>3</sub>O<sup>+</sup>, H<sub>2</sub>O is the…',
              options: [{ label: 'acid' }, { label: 'base', correct: true }], why: 'H₂O becomes H₃O⁺: it accepted an H⁺.' },
            { prompt: 'In CO<sub>3</sub><sup>2−</sup> + H<sub>2</sub>O ⇌ HCO<sub>3</sub><sup>−</sup> + OH<sup>−</sup>, H<sub>2</sub>O is the…',
              options: [{ label: 'acid', correct: true }, { label: 'base' }], why: 'H₂O becomes OH⁻: it donated an H⁺.' },
            { prompt: 'Which one is amphiprotic?',
              options: [{ label: 'HS<sup>−</sup>', correct: true }, { label: 'S<sup>2−</sup>' }, { label: 'H<sub>2</sub>S' }],
              why: 'HS⁻ is negative and still has an H to lose, so it can gain an H⁺ (to H₂S) or lose one (to S²⁻).' },
            { prompt: 'H<sub>3</sub>PO<sub>4</sub> is…',
              options: [{ label: 'monoprotic' }, { label: 'diprotic' }, { label: 'triprotic', correct: true }],
              why: 'It can supply up to three protons: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.' }
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
              A.solutionWindow(g, { x, y: 40, w: ww, h: H - 86 }, b.list, t, { seed: b.seed, size: 15 });
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
          const box = el('div', 'ab-strong');
          box.innerHTML = '<div class="ab-strong-list">' + ['HClO<sub>4</sub>', 'HI', 'HBr', 'HCl', 'HNO<sub>3</sub>', 'H<sub>2</sub>SO<sub>4</sub>'].map(f => '<span>' + f + '</span>').join('') + '</div>' +
            '<p class="ab-strong-arrow">→ 100% H<sub>3</sub>O<sup>+</sup></p>';
          left.appendChild(box);
          UI.card(right, { prompt: 'Which has more H<sub>3</sub>O<sup>+</sup>: 0.10 M HClO<sub>4</sub> or 0.10 M HCl?',
            options: [{ label: 'HClO<sub>4</sub>' }, { label: 'HCl' }, { label: 'The same', correct: true }],
            why: 'Both are 100% ionized, so both are 0.10 M H₃O⁺. In water, strong acids all level to H₃O⁺.' });
        }
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
  function applyBeat(b) {
    if (!b || b === active) return;
    beats.forEach(x => x.classList.toggle('is-active', x === b));
    active = b;
    $('badge').innerHTML = b.dataset.badge || '';
    const sec = SECTIONS[b.id];
    load(b.id, sec && sec.tabs ? sec.tabs[0][0] : null);
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
    if (Date.now() < pinUntil) return;
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
    learnToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(LEARN_KEY, on ? '1' : '0'); } catch (e) { /* private window */ }
    if (active) { pinUntil = Date.now() + 300; scrollToBeat(active, false); }
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
  window.__ab = { cur: () => cur };
})();
