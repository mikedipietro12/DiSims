/**
 * Chapter A scenes: from atoms to bonds.
 *   dot-symbol   electron configuration → valence electrons → Lewis dot symbol (beat 1)
 *   cloud        shared-pair clouds: data-mode="pair" (H₂ forms, beat 2) | "slider" (ΔEN slider, beat 3)
 *                | "examples" (Cl₂, HCl, H₂O, beat 5)
 *   continuum    ΔEN axis with fuzzy bands and real bonds on it (beat 4)
 *   lattice      ion pair → row → layer → crystal (beat 7)
 *   salts        melting points side by side (beat 8)
 */
(function (global) {
  'use strict';
  var K = global.SceneKit, Kit = global.BondingKit, h = K.h, s = K.s;

  function frame(mount, cls, vb) {
    var root = h('div', 'scene ' + cls);
    var head = h('div', 'scene-head');
    var stage = K.svg('scene-svg');
    stage.setAttribute('viewBox', vb || '0 0 640 400');
    stage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(head);
    root.appendChild(stage);
    root.appendChild(foot);
    mount.appendChild(root);
    return { root: root, head: head, svg: stage, foot: foot };
  }
  function sub(str) { return str.replace(/(\d+)/g, function (d) { return d.split('').map(function (c) { return '₀₁₂₃₄₅₆₇₈₉'[+c]; }).join(''); }); }

  // =================================================================================================
  // Beat 1 · dot symbol from the configuration
  // =================================================================================================
  GuideShell.registerScene('dot-symbol', function (mount) {
    var F = frame(mount, 'scene-dot', '0 0 640 400');
    var anim = null;
    var els = ['H', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Cl'];
    var row = K.chips(els.map(function (e) { return { id: e, label: e }; }), show, { label: 'Element' });
    F.head.appendChild(row.el);
    var replay = h('button', 'btn scene-chip-step', 'Replay');
    replay.type = 'button';
    replay.addEventListener('click', function () { show(cur); });
    row.el.appendChild(replay);
    var cur = 'O';

    function show(el) {
      cur = el;
      row.set(el);
      if (anim) anim.cancel();
      K.clear(F.svg);
      var cfg = K.configuration(el), E = Kit.ELEMENTS[el];
      // Configuration across the top, valence subshells boxed in blue
      var size = 30, cw = size * 0.62, parts = [];
      cfg.forEach(function (o) { parts.push({ str: o.sub + K.sup(o.n), sub: o.sub, n: String(o.n), valence: o.valence }); });
      function pw(p) { return p.sub.length * cw + p.n.length * cw * 0.62; }
      var total = parts.reduce(function (n, p) { return n + pw(p); }, 0) + (parts.length - 1) * cw;
      var x = 320 - total / 2, y = 70, vx0 = null, vx1 = null;
      var cap = K.text(F.svg, 320, 26, E.name.replace(/^./, function (c) { return c.toUpperCase(); }) + ' · ' + E.Z + ' electrons', { 'font-size': 15, fill: '#5b6474', 'font-family': 'Space Mono, monospace' });
      parts.forEach(function (p) {
        var w = pw(p);
        if (p.valence) { vx0 = vx0 == null ? x : vx0; vx1 = x + w; }
        var tx = K.text(F.svg, x, y, p.sub, { 'font-size': size, 'font-family': 'Space Mono, monospace', fill: p.valence ? '#4152d9' : '#5b6474', 'text-anchor': 'start' });
        var sp = s('tspan', { dy: -12, 'font-size': size * 0.6 }, tx);
        sp.textContent = p.n;
        x += w + cw;
      });
      var box = s('rect', { x: vx0 - 8, y: y - 24, width: vx1 - vx0 + 16, height: 48, rx: 12, fill: 'none', stroke: '#4152d9', 'stroke-width': 2.5, opacity: 0 }, F.svg);
      var lab = K.text(F.svg, (vx0 + vx1) / 2, y + 42, 'valence', { 'font-size': 14, fill: '#4152d9', 'font-family': 'Space Mono, monospace', opacity: 0 });
      // Dot symbol
      var g = s('g', {}, F.svg);
      var dots = K.dotSymbol(g, 320, 252, el, E.valence, 2.5);   // fills the middle band: dots stay clear of the 'valence' label and the count
      var sym = g.firstChild;
      sym.setAttribute('opacity', 0);
      var targets = dots.map(function (d) { return [+d.getAttribute('cx'), +d.getAttribute('cy')]; });
      var sx = (vx0 + vx1) / 2, sy = y;
      dots.forEach(function (d) { d.setAttribute('cx', sx); d.setAttribute('cy', sy); d.setAttribute('opacity', 0); });
      var count = K.text(F.svg, 320, 365, '', { 'font-size': 17, 'font-family': 'Space Mono, monospace' });
      F.foot.textContent = el + ': ' + parts.map(function (p) { return p.str; }).join(' ') + ' → ' + E.valence + ' valence electron' + (E.valence > 1 ? 's' : '') + '. The dot symbol keeps only these.';
      var steps = [
        { ms: 380, run: function (t) { box.setAttribute('opacity', t); lab.setAttribute('opacity', t); } },
        { ms: 300, run: function (t) { sym.setAttribute('opacity', t); } },
      ];
      targets.forEach(function (tg, i) {
        steps.push({ ms: 260, run: function (t) {
          var e = K.easeOut(t), d = dots[i];
          d.setAttribute('opacity', 1);
          d.setAttribute('cx', sx + (tg[0] - sx) * e);
          d.setAttribute('cy', sy + (tg[1] - sy) * e - Math.sin(Math.PI * t) * 30);
          if (t >= 1) count.textContent = (i + 1) + ' valence electron' + (i ? 's' : '');
        } });
      });
      anim = K.sequence(steps);
    }
    show(cur);
    return { settle: function () { if (anim) anim.settle(); }, destroy: function () { if (anim) anim.cancel(); } };
  });

  // =================================================================================================
  // Beats 2, 3, 5 · charge clouds
  // =================================================================================================
  /** n electrons around an atom on the given sides (degrees, SVG: 0 = right, 90 = down): singles first, then pairs. */
  function atomDots(g, x, y, el, n, sides, sc) {
    var R = (el.length > 1 ? 32 : 27) * sc, sep = 5.5 * sc, count = sides.map(function () { return 0; });
    for (var i = 0; i < n; i++) count[i % sides.length] = Math.min(2, count[i % sides.length] + 1);
    if (n > sides.length * 2) n = sides.length * 2;
    sides.forEach(function (deg, k) {
      var t = deg * Math.PI / 180, cx = x + Math.cos(t) * R, cy = y + Math.sin(t) * R, px = -Math.sin(t), py = Math.cos(t);
      var pts = count[k] === 2 ? [[cx + px * sep, cy + py * sep], [cx - px * sep, cy - py * sep]] : count[k] === 1 ? [[cx, cy]] : [];
      pts.forEach(function (p) { s('circle', { cx: p[0], cy: p[1], r: 3.6 * sc, fill: K.INK }, g); });
    });
  }
  /** A shared pair drawn Lewis-style (a colon) at (x, y), across the bond direction. */
  function sharedPair(g, x, y, ang, sc) {
    var px = -Math.sin(ang), py = Math.cos(ang), sep = 5.5 * sc;
    s('circle', { cx: x + px * sep, cy: y + py * sep, r: 3.6 * sc, fill: K.INK }, g);
    s('circle', { cx: x - px * sep, cy: y - py * sep, r: 3.6 * sc, fill: K.INK }, g);
  }

  /**
   * Draw one A–B pair at (cx, cy). d = EN(right) − EN(left). t: 0 apart → 1 bonded (approach).
   * Every valence electron is drawn: the shared pair on the line between the nuclei (sliding toward the
   * higher-EN atom), the rest as Lewis dots on the outer sides. noPair: the caller draws the bonding electrons.
   */
  function drawPair(g, left, right, d, cx, cy, sc, t, noPair) {
    sc = sc || 1;
    t = t == null ? 1 : t;
    var a = Math.abs(d), f = Math.min(1, a / 1.8);
    var gi = Math.max(0, Math.min(1, (a - 1.5) / 0.8));         // how ionic (0 → 1 between ΔEN 1.5 and 2.3)
    var sep = (150 + 40 * gi) * sc + (1 - t) * 190 * sc;
    var hiRight = d >= 0;
    var lx = cx - sep / 2, rx = cx + sep / 2;
    var base = 58 * sc;
    var rHi = base * (1 + 0.3 * f), rLo = base * (1 - 0.32 * f - 0.25 * gi);
    var rL = a < 0.01 ? base : hiRight ? rLo : rHi, rR = a < 0.01 ? base : hiRight ? rHi : rLo;
    var qL = hiRight ? a : -a, qR = -qL;
    if (a < 0.01) qL = qR = 0;
    var w = 92 * sc * (1 - gi) * Math.max(0, (t - 0.55) / 0.45);
    K.cloud(g, [{ x: lx, y: cy, r: rL, q: qL }, { x: rx, y: cy, r: rR, q: qR }], [{ a: 0, b: 1, w: w }], { blur: 10 * sc });
    K.text(g, lx, cy, left, { 'font-size': 30 * sc });
    K.text(g, rx, cy, right, { 'font-size': 30 * sc });
    // Non-bonding valence electrons (covalent: valence − 1 each; ionic: the high-EN atom has a full octet, the other none)
    var ionic = gi >= 0.5;
    var vL = Kit.ELEMENTS[left] ? Kit.ELEMENTS[left].valence : 1, vR = Kit.ELEMENTS[right] ? Kit.ELEMENTS[right].valence : 1;
    var nL = ionic ? (hiRight ? 0 : 6) : vL - 1, nR = ionic ? (hiRight ? 6 : 0) : vR - 1;
    if (left === 'A') nL = 0;
    if (right === 'B') nR = 0;
    atomDots(g, lx, cy, left, nL, [180, 270, 90], sc);
    atomDots(g, rx, cy, right, nR, [0, 270, 90], sc);
    // The bonding pair sits on the line through the nuclei and slides toward the higher-EN atom
    var mid = (lx + rx) / 2, hiX = hiRight ? rx : lx, Rhi = ((hiRight ? right : left).length > 1 ? 31 : 25) * sc;
    var target = hiX + (hiRight ? -Rhi : Rhi), lean = Math.min(1, a / 2.3);
    var px = mid + (target - mid) * lean, py = cy;
    if (!noPair) sharedPair(g, px, py, 0, sc);
    if (t >= 1 && a >= 0.15) {
      var lo = hiRight ? lx : rx, hi = hiRight ? rx : lx, rlo = hiRight ? rL : rR, rhi = hiRight ? rR : rL;
      if (!ionic) { K.pill(g, lo, cy + rlo + 22 * sc, 'δ+', 'pos'); K.pill(g, hi, cy + rhi + 22 * sc, 'δ−', 'neg'); }
      else { K.pill(g, lo, cy + rlo + 22 * sc, '+', 'pos'); K.pill(g, hi, cy + rhi + 22 * sc, '−', 'neg'); }
    }
    return { lx: lx, rx: rx, px: px, py: py };
  }

  /** Water-shaped cloud (beat 5): O in the middle, two H at 104.5°, with every valence electron. */
  function drawBent(g, centre, outer, cx, cy, sc) {
    var d = K.en(centre) - K.en(outer), L = 120 * sc, half = 104.5 / 2 * Math.PI / 180;
    var A = [{ x: cx, y: cy - 20 * sc, r: 64 * sc, q: -2 * d },
      { x: cx - Math.sin(half) * L, y: cy - 20 * sc + Math.cos(half) * L, r: 40 * sc, q: d },
      { x: cx + Math.sin(half) * L, y: cy - 20 * sc + Math.cos(half) * L, r: 40 * sc, q: d }];
    K.cloud(g, A, [{ a: 0, b: 1, w: 70 * sc }, { a: 0, b: 2, w: 70 * sc }], { blur: 10 * sc });
    K.text(g, A[0].x, A[0].y, centre, { 'font-size': 30 * sc });
    K.text(g, A[1].x, A[1].y, outer, { 'font-size': 26 * sc });
    K.text(g, A[2].x, A[2].y, outer, { 'font-size': 26 * sc });
    // two lone pairs on O, and each O–H pair on its bond line, nearer O
    atomDots(g, A[0].x, A[0].y, centre, Kit.ELEMENTS[centre].valence - 2, [225, 315], sc);
    [1, 2].forEach(function (k) {
      var ang = Math.atan2(A[k].y - A[0].y, A[k].x - A[0].x);
      sharedPair(g, A[0].x + (A[k].x - A[0].x) * 0.42, A[0].y + (A[k].y - A[0].y) * 0.42, ang, sc);
    });
    K.pill(g, A[0].x, A[0].y - 86 * sc, 'δ−', 'neg');
    K.pill(g, A[1].x - 10 * sc, A[1].y + 62 * sc, 'δ+', 'pos');
    K.pill(g, A[2].x + 10 * sc, A[2].y + 62 * sc, 'δ+', 'pos');
  }

  GuideShell.registerScene('cloud', function (mount, beat) {
    var mode = beat.dataset.mode || 'pair';
    var F = frame(mount, 'scene-cloud', mode === 'examples' ? '0 0 720 400' : '0 0 640 400');
    var anim = null;

    if (mode === 'pair') {
      var replay = h('button', 'btn scene-chip-step', 'Replay');
      replay.type = 'button';
      F.head.appendChild(replay);
      var run = function () {
        if (anim) anim.cancel();
        var TOTAL = 5200, ORBIT = 0.5, REV = 2400;   // half the time orbiting (one turn per 2.4 s), then the bond forms
        anim = K.tween(TOTAL, function (t) {
          K.clear(F.svg);
          var u = t < ORBIT ? 0 : K.ease((t - ORBIT) / (1 - ORBIT));
          var P = drawPair(F.svg, 'H', 'H', 0, 320, 190, 1.25, u, true);
          var R = 46 * 1.25, ms = t * TOTAL;
          [P.lx, P.rx].forEach(function (x, i) {
            var th = ms / REV * 2 * Math.PI + (i ? Math.PI : 0);
            var ox = x + Math.cos(th) * R, oy = 190 + Math.sin(th) * R;
            var tx = P.px, ty = P.py + (i ? 5.5 : -5.5) * 1.25;
            var k = u;
            var ex = ox + (tx - ox) * k, ey = oy + (ty - oy) * k;
            if (t >= 1) { ex = tx; ey = ty; }
            if (t < ORBIT) s('circle', { cx: x, cy: 190, r: R, fill: 'none', stroke: '#5b6474', 'stroke-width': 1.2, 'stroke-dasharray': '3 6', opacity: 0.5 }, F.svg);
            s('circle', { cx: ex, cy: ey, r: 4.5, fill: K.INK }, F.svg);
          });
          if (t >= 1) K.text(F.svg, 320, 330, 'one shared pair, held by both nuclei', { 'font-size': 18, 'font-family': 'Space Mono, monospace', fill: '#4152d9' });
        });
        F.foot.textContent = 'Each H brings one electron. Between the nuclei, the pair attracts both: a covalent bond. ΔEN = 0, so the cloud is even.';
      };
      replay.addEventListener('click', run);
      run();
      return { settle: function () { if (anim) anim.settle(); }, destroy: function () { if (anim) anim.cancel(); } };
    }

    if (mode === 'examples') {
      var g = s('g', {}, F.svg);
      drawPair(g, 'Cl', 'Cl', 0, 120, 150, 0.78);
      drawPair(g, 'H', 'Cl', K.en('Cl') - K.en('H'), 360, 150, 0.78);
      drawBent(g, 'O', 'H', 600, 140, 0.78);
      [['Cl₂', 'ΔEN 0.00', 'nonpolar covalent', 120], ['HCl', 'ΔEN ' + (K.en('Cl') - K.en('H')).toFixed(2), 'polar covalent', 360],
        ['H₂O', 'ΔEN ' + (K.en('O') - K.en('H')).toFixed(2) + ' per O–H', 'polar covalent', 600]].forEach(function (c) {
        K.text(g, c[3], 300, c[0], { 'font-size': 26 });
        K.text(g, c[3], 332, c[1], { 'font-size': 14, 'font-family': 'Space Mono, monospace', fill: '#5b6474' });
        K.text(g, c[3], 356, c[2], { 'font-size': 14, 'font-family': 'Space Mono, monospace', fill: '#4152d9' });
      });
      F.foot.textContent = 'Cl₂ shares evenly. In HCl and H₂O the shared pairs sit closer to the more electronegative atom, giving δ+ and δ− ends.';
      return {};
    }

    // --- slider ------------------------------------------------------------------------------------
    var PICK = ['H', 'Li', 'Na', 'K', 'Be', 'Mg', 'Ca', 'B', 'Al', 'C', 'Si', 'N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'];
    var ctl = h('div', 'scene-controls');
    function picker(label, val) {
      var wrap = h('label', 'scene-field');
      wrap.appendChild(h('span', 'scene-field-label', label));
      var sel = h('select', 'scene-select');
      PICK.forEach(function (e) { var o = h('option', null, e + '  (EN ' + Kit.ELEMENTS[e].en.toFixed(2) + ')'); o.value = e; sel.appendChild(o); });
      sel.value = val;
      wrap.appendChild(sel);
      ctl.appendChild(wrap);
      return sel;
    }
    var selA = picker('Atom A', 'H'), selB = picker('Atom B', 'Cl');
    var sw = h('label', 'scene-field scene-field-grow');
    sw.appendChild(h('span', 'scene-field-label', 'ΔEN'));
    var range = h('input', 'scene-range');
    range.type = 'range'; range.min = 0; range.max = 3.3; range.step = 0.01;
    range.setAttribute('aria-label', 'Electronegativity difference');
    sw.appendChild(range);
    ctl.appendChild(sw);
    F.head.appendChild(ctl);
    var free = false;
    function fromPick() {
      free = false;
      range.value = Math.abs(K.en(selB.value) - K.en(selA.value)).toFixed(2);
      draw();
    }
    function draw() {
      var A = selA.value, B = selB.value, dv = +range.value;
      var match = !free;
      var signed = match ? K.en(B) - K.en(A) : dv;
      if (match) dv = Math.abs(signed);
      K.clear(F.svg);
      drawPair(F.svg, match ? A : 'A', match ? B : 'B', signed, 320, 180, 1.2);
      var kind = K.bondType(dv);
      K.text(F.svg, 320, 352, 'ΔEN ' + dv.toFixed(2) + '  ·  ' + kind, { 'font-size': 20, 'font-family': 'Space Mono, monospace', fill: '#4152d9' });
      range.setAttribute('aria-valuetext', dv.toFixed(2) + ', ' + kind);
      F.foot.textContent = match
        ? 'ΔEN = |' + K.en(B).toFixed(2) + ' − ' + K.en(A).toFixed(2) + '| = ' + dv.toFixed(2) + ' → ' + kind + '. ' +
          (dv < 0.01 ? 'Both atoms pull equally.' : kind === 'ionic' ? 'The electron moves completely from ' + (K.en(B) > K.en(A) ? A : B) + ' to ' + (K.en(B) > K.en(A) ? B : A) + ': ions form.' : (K.en(B) > K.en(A) ? B : A) + ' pulls the shared pair harder.')
        : 'Slide to explore: ΔEN ' + dv.toFixed(2) + ' → ' + kind + '. Pick two elements to see a real pair.';
    }
    selA.addEventListener('change', fromPick);
    selB.addEventListener('change', fromPick);
    range.addEventListener('input', function () { free = true; draw(); markTable(); });

    // --- Mini periodic table (main groups, periods 1–5), coloured by EN: pale = low, yellow = high ----------
    var PT = [
      [['H', 2.20], null, null, null, null, null, null, ['He', null]],
      [['Li', 0.98], ['Be', 1.57], ['B', 2.04], ['C', 2.55], ['N', 3.04], ['O', 3.44], ['F', 3.98], ['Ne', null]],
      [['Na', 0.93], ['Mg', 1.31], ['Al', 1.61], ['Si', 1.90], ['P', 2.19], ['S', 2.58], ['Cl', 3.16], ['Ar', null]],
      [['K', 0.82], ['Ca', 1.00], ['Ga', 1.81], ['Ge', 2.01], ['As', 2.18], ['Se', 2.55], ['Br', 2.96], ['Kr', 3.00]],
      [['Rb', 0.82], ['Sr', 0.95], ['In', 1.78], ['Sn', 1.96], ['Sb', 2.05], ['Te', 2.10], ['I', 2.66], ['Xe', 2.60]],
    ];
    function enColour(v) {   // one sequential ramp: pale blue-grey (low) → pale yellow → strong yellow (high)
      var t = Math.max(0, Math.min(1, (v - 0.7) / 3.3));
      return t < 0.5 ? K.mix('#e3e8f1', '#ffeaa6', t / 0.5) : K.mix('#ffeaa6', '#ffc21a', (t - 0.5) / 0.5);
    }
    var stageWrap = h('div', 'scene-stagewrap');
    F.root.insertBefore(stageWrap, F.svg);
    stageWrap.appendChild(F.svg);
    var pt = h('div', 'ptable');
    var tog = h('button', 'btn ptable-toggle');
    tog.type = 'button';
    var body = h('div', 'ptable-body');
    body.id = 'ptable-body-' + Math.round(Math.random() * 1e6);
    tog.setAttribute('aria-controls', body.id);
    var grid = h('div', 'ptable-grid');
    var cells = {}, nextSlot = 'A';
    PT.forEach(function (row) {
      row.forEach(function (c) {
        if (!c) { grid.appendChild(h('span', 'pt-gap')); return; }
        var usable = c[1] != null && PICK.indexOf(c[0]) !== -1;
        var cell = h(usable ? 'button' : 'span', 'pt-cell' + (c[1] == null ? ' is-none' : '') + (usable ? ' is-usable' : ''));
        if (usable) cell.type = 'button';
        if (c[1] != null) cell.style.background = enColour(c[1]);
        cell.appendChild(h('strong', null, c[0]));
        cell.appendChild(h('small', null, c[1] == null ? '–' : c[1].toFixed(2)));
        cell.title = c[0] + (c[1] == null ? ': no EN value' : ': EN ' + c[1].toFixed(2));
        if (usable) {
          cell.setAttribute('aria-label', c[0] + ', EN ' + c[1].toFixed(2) + '. Set as atom ' + nextSlot);
          cell.addEventListener('click', function () {
            (nextSlot === 'A' ? selA : selB).value = c[0];
            nextSlot = nextSlot === 'A' ? 'B' : 'A';
            fromPick();
          });
        }
        cells[c[0]] = cell;
        grid.appendChild(cell);
      });
    });
    var key = h('div', 'ptable-key');
    key.appendChild(h('span', null, 'low EN'));
    var bar = h('span', 'ptable-bar');
    bar.style.background = 'linear-gradient(90deg,' + enColour(0.7) + ',' + enColour(2.35) + ',' + enColour(4) + ')';
    key.appendChild(bar);
    key.appendChild(h('span', null, 'high EN'));
    var hint = h('p', 'ptable-hint');
    body.appendChild(grid); body.appendChild(key); body.appendChild(hint);
    pt.appendChild(tog); pt.appendChild(body);
    stageWrap.appendChild(pt);
    function markTable() {
      Object.keys(cells).forEach(function (k) { cells[k].classList.remove('is-a', 'is-b'); cells[k].removeAttribute('data-slot'); });
      if (!free) {
        if (cells[selA.value]) { cells[selA.value].classList.add('is-a'); cells[selA.value].setAttribute('data-slot', 'A'); }
        if (cells[selB.value]) { cells[selB.value].classList.add(selA.value === selB.value ? 'is-a' : 'is-b'); cells[selB.value].setAttribute('data-slot', selA.value === selB.value ? 'A B' : 'B'); }
      }
      hint.textContent = 'Click an element to set atom ' + nextSlot + '.';
    }
    var PT_KEY = 'cb-ptable-open', open = false, saved = null;
    try { saved = localStorage.getItem(PT_KEY); } catch (e) {}
    // no saved choice: open on a big stage (presentation mode), folded on the narrow scroll stage
    setTimeout(function () { if (saved == null) setOpen(document.body.classList.contains('present') || stageWrap.clientWidth > 900, true); }, 0);
    if (saved != null) open = saved === '1';
    function setOpen(on, auto) {
      open = on;
      pt.classList.toggle('is-open', on);
      tog.setAttribute('aria-expanded', on ? 'true' : 'false');
      tog.textContent = on ? 'Periodic table ▾' : 'Periodic table ▸';
      if (!auto) try { localStorage.setItem(PT_KEY, on ? '1' : '0'); } catch (e) {}
    }
    tog.addEventListener('click', function () { setOpen(!open); });
    setOpen(open, true);
    var baseFromPick = fromPick;
    fromPick = function () { baseFromPick(); markTable(); };
    selA.removeEventListener('change', baseFromPick); selB.removeEventListener('change', baseFromPick);
    selA.addEventListener('change', fromPick); selB.addEventListener('change', fromPick);
    fromPick();
    return {};
  });

  // =================================================================================================
  // Beat 4 · the continuum
  // =================================================================================================
  GuideShell.registerScene('continuum', function (mount) {
    var F = frame(mount, 'scene-continuum', '0 0 680 420');
    var X0 = 50, X1 = 630, MAX = 3.4;
    function X(v) { return X0 + (X1 - X0) * v / MAX; }
    var BONDS = [['H', 'H'], ['C', 'H'], ['N', 'H'], ['H', 'Cl'], ['O', 'H'], ['H', 'F'], ['Mg', 'O'], ['Na', 'Cl'], ['Na', 'F']]
      .map(function (p) { var lo = K.en(p[0]) <= K.en(p[1]) ? p : [p[1], p[0]]; return { a: lo[0], b: lo[1], d: Math.abs(K.en(p[1]) - K.en(p[0])) }; });
    var sel = 3;
    var top = s('g', {}, F.svg), axis = s('g', {}, F.svg);
    // Fuzzy bands
    var defs = s('defs', {}, axis);
    var lg = s('linearGradient', { id: 'cont-bands', x1: X0, x2: X1, y1: 0, y2: 0, gradientUnits: 'userSpaceOnUse' }, defs);
    [[0, '#dfe3eb'], [0.3, '#dfe3eb'], [0.5, '#dfe2ff'], [1.65, '#dfe2ff'], [1.95, '#ffe0e6'], [MAX, '#ffe0e6']].forEach(function (st) {
      s('stop', { offset: (st[0] / MAX * 100) + '%', 'stop-color': st[1] }, lg);
    });
    s('rect', { x: X0, y: 262, width: X1 - X0, height: 44, rx: 12, fill: 'url(#cont-bands)', stroke: K.INK, 'stroke-width': 2 }, axis);
    // each label centred in its band ('nonpolar' has only 0–0.4, so it is set a little smaller to clear the divider)
    [['nonpolar', 0.2, 11], ['polar covalent', 1.1, 15], ['ionic', 2.6, 15]].forEach(function (b) {
      K.text(axis, X(b[1]), 284, b[0], { 'font-size': b[2], 'font-family': 'Space Mono, monospace', 'text-anchor': 'middle' });
    });
    [0, 1, 2, 3].forEach(function (v) {
      s('line', { x1: X(v), y1: 306, x2: X(v), y2: 314, stroke: K.INK, 'stroke-width': 2 }, axis);
      K.text(axis, X(v), 326, String(v), { 'font-size': 13, 'font-family': 'Space Mono, monospace', fill: '#5b6474' });
    });
    K.text(axis, X1 + 4, 326, 'ΔEN', { 'font-size': 13, 'font-family': 'Space Mono, monospace', fill: '#5b6474', 'text-anchor': 'start' });
    [0.4, 1.8].forEach(function (v) { s('line', { x1: X(v), y1: 256, x2: X(v), y2: 312, stroke: K.INK, 'stroke-width': 1.5, 'stroke-dasharray': '3 4', opacity: 0.5 }, axis); });
    var marks = BONDS.map(function (b, i) {
      var g = s('g', { class: 'cont-mark', tabindex: 0, role: 'button', 'aria-label': b.a + '–' + b.b + ', ΔEN ' + b.d.toFixed(2) }, axis);
      var row = i % 2;
      s('line', { x1: X(b.d), y1: 240, x2: X(b.d), y2: 262, stroke: K.INK, 'stroke-width': 2 }, g);
      s('circle', { cx: X(b.d), cy: 240, r: 6, fill: '#ffffff', stroke: K.INK, 'stroke-width': 2 }, g);
      var ty = row ? 352 : 376;
      s('line', { x1: X(b.d), y1: 306, x2: X(b.d), y2: ty - 12, stroke: K.INK, 'stroke-width': 1, opacity: 0.25 }, g);
      var t = K.text(g, X(b.d), ty, b.a + '–' + b.b, { 'font-size': 14, 'font-family': 'Space Mono, monospace' });
      s('rect', { x: X(b.d) - 26, y: 226, width: 52, height: 166, fill: 'transparent' }, g);
      g.addEventListener('click', function () { pick(i); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); } });
      return { g: g, t: t };
    });
    function pick(i) {
      sel = i;
      var b = BONDS[i];
      K.clear(top);
      drawPair(top, b.a, b.b, b.d, 340, 110, 0.85);
      marks.forEach(function (m, k) { m.t.setAttribute('fill', k === i ? '#4152d9' : K.INK); m.g.firstChild.nextSibling.setAttribute('fill', k === i ? '#4152d9' : '#ffffff'); });
      F.foot.textContent = b.a + '–' + b.b + ': ΔEN = ' + b.d.toFixed(2) + ' → ' + K.bondType(b.d) +
        '. The lines at 0.4 and 1.8 are guides; bonds near them sit between types.';
    }
    pick(sel);
    return {};
  });

  // =================================================================================================
  // Beat 7 · lattice
  // =================================================================================================
  /*
   * Two salts, two packings. Spacing is set so opposite ions touch at contact distance d when packed.
   *   NaCl (rock salt): ions alternate on a cubic grid; each touches 6 of the other (d = 1).
   *   CsCl: Cl⁻ on the corners of cubes, Cs⁺ in each centre; each touches 8 of the other (d = √3/2).
   * Radii from Shannon (pm): Na⁺ 102, Cs⁺ 174 (8-coordinate), Cl⁻ 181.
   */
  var SALT3D = {
    nacl: {
      label: 'NaCl', cation: 'Na⁺', n: 6, d: 1, rPos: 102 / 283, rNeg: 181 / 283,
      steps: [{ id: 'pair', label: 'Ion pair' }, { id: 'row', label: 'A row' }, { id: 'layer', label: 'A layer' }, { id: 'crystal', label: 'The crystal' }],
      sites: function (st) {
        var out = [], N = 3, nx = st === 'pair' ? 2 : st === 'row' ? 7 : N, nz = st === 'pair' || st === 'row' ? 1 : N, ny = st === 'crystal' ? N : 1;
        for (var y = 0; y < ny; y++) for (var z = 0; z < nz; z++) for (var x = 0; x < nx; x++) out.push({ p: [x, y, z], pos: (x + y + z) % 2 === 0 });
        return { list: out, box: st === 'layer' || st === 'crystal' ? 0.5 : null };
      },
      text: {
        pair: 'Na⁺ (red) and Cl⁻ (green) attract. But nothing stops other ions joining in. Drag to turn it.',
        row: 'Each ion attracts the opposite charges on both sides, so more keep joining: a row, alternating + − + − + − +.',
        layer: 'Rows lie side by side in a layer. Each ion now has 4 opposite neighbours in the layer. Click an ion.',
        crystal: 'Layers stack into a cube-shaped crystal: no separate molecules, just ions locked together. Drag to turn it; click an ion to see the 6 it touches.',
      },
    },
    cscl: {
      label: 'CsCl', cation: 'Cs⁺', n: 8, d: Math.sqrt(3) / 2, rPos: 174 / 355 * Math.sqrt(3) / 2, rNeg: 181 / 355 * Math.sqrt(3) / 2,
      steps: [{ id: 'pair', label: 'Ion pair' }, { id: 'cell', label: 'Unit cell' }, { id: 'crystal', label: 'The crystal' }],
      sites: function (st) {
        var out = [];
        if (st === 'pair') return { list: [{ p: [0, 0, 0], pos: false }, { p: [0.5, 0.5, 0.5], pos: true }], box: null };
        var N = st === 'cell' ? 2 : 3;
        for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) for (var z = 0; z < N; z++) out.push({ p: [x, y, z], pos: false });
        for (var i = 0; i < N - 1; i++) for (var j = 0; j < N - 1; j++) for (var k = 0; k < N - 1; k++) out.push({ p: [i + 0.5, j + 0.5, k + 0.5], pos: true });
        return { list: out, box: 0 };   // the box runs through the corner ions: you can see each cube
      },
      text: {
        pair: 'Cs⁺ (red) and Cl⁻ (green) attract. Cs⁺ is much bigger than Na⁺ (174 pm vs 102 pm). Drag to turn it.',
        cell: 'The unit cell: the smallest repeating piece of the crystal. A big Cs⁺ has room for 8 Cl⁻ around it, one on each corner of the cube. Click the Cs⁺ in the middle.',
        crystal: 'Unit cells share corners and stack into a crystal. Every Cs⁺ sits in a cube of 8 Cl⁻, and every Cl⁻ in a cube of 8 Cs⁺. Click an ion.',
      },
    },
  };

  GuideShell.registerScene('lattice', function (mount) {
    var root = h('div', 'scene scene-lattice');
    var head = h('div', 'scene-head');
    var view = h('div', 'lat-3d');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(head); root.appendChild(view); root.appendChild(foot);
    mount.appendChild(root);
    var saltRow = K.chips([{ id: 'nacl', label: 'NaCl · 6 neighbours' }, { id: 'cscl', label: 'CsCl · 8 neighbours' }], function (id) { setSalt(id); }, { label: 'Salt', cls: 'lat-salts' });
    head.appendChild(saltRow.el);
    var stepWrap = h('div', 'scene-chips-wrap');
    head.appendChild(stepWrap);
    var packBtn = h('button', 'btn scene-chip-step', 'Pack them tight');
    packBtn.type = 'button';
    packBtn.setAttribute('aria-pressed', 'false');
    var row = null;
    var tt = Turntable.create(view, { letters: false, yaw: -0.6, tilt: 0.42, onPick: pick });
    var T = tt.THREE;
    var salt = 'nacl', packed = false, step = 'pair', focus = null, ions = {}, edges = null, current = [];
    // matte, like model-kit spheres: the cation red (positive), Cl⁻ chlorine green
    var matPos = T && new T.MeshStandardMaterial({ color: 0xf2647c, roughness: 0.85, metalness: 0 });
    var matNeg = T && new T.MeshStandardMaterial({ color: 0x8ccf4d, roughness: 0.85, metalness: 0 });

    function sites() {
      var S = SALT3D[salt].sites(step), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      S.list.forEach(function (o) { for (var k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], o.p[k]); hi[k] = Math.max(hi[k], o.p[k]); } });
      var c = [0, 1, 2].map(function (k) { return (lo[k] + hi[k]) / 2; });
      S.list.forEach(function (o) { o.key = salt + ':' + o.p.join(','); o.c = [o.p[0] - c[0], o.p[1] - c[1], o.p[2] - c[2]]; });
      S.span = [0, 1, 2].map(function (k) { return hi[k] - lo[k]; });
      return S;
    }
    function touching(a, b) {
      if (a.pos === b.pos) return false;
      var d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
      return Math.abs(d - SALT3D[salt].d) < 0.01;
    }
    function scaleOf() { return packed ? 1 : 0.55; }
    function paint() {
      var cfg = SALT3D[salt];
      Object.keys(ions).forEach(function (k) {
        var m = ions[k], o = m.userData.site;
        var near = focus && touching(focus, o), me = focus && focus.key === o.key;
        if (m.material !== matPos && m.material !== matNeg) m.material.dispose();
        m.material = (o.pos ? matPos : matNeg).clone();
        if (focus && !me && !near) { m.material.transparent = true; m.material.opacity = 0.22; m.material.depthWrite = false; }
        if (me) { m.material.emissive = new T.Color(0x4152d9); m.material.emissiveIntensity = 0.55; }
        if (near) { m.material.emissive = new T.Color(0x4152d9); m.material.emissiveIntensity = 0.25; }
        m.scale.setScalar((o.pos ? cfg.rPos : cfg.rNeg) * scaleOf() * (me ? 1.12 : 1));
      });
      tt.render();
    }
    function build(animateNew) {
      if (!T) return;
      var S = sites(), keep = {};
      current = S.list;
      S.list.forEach(function (o) { keep[o.key] = o; });
      Object.keys(ions).forEach(function (k) { if (!keep[k]) { tt.content.remove(ions[k]); ions[k].geometry.dispose(); delete ions[k]; } });
      var fresh = [];
      S.list.forEach(function (o) {
        var m = ions[o.key];
        if (!m) {
          m = new T.Mesh(new T.SphereGeometry(1, 36, 24), o.pos ? matPos : matNeg);
          m.userData = { pick: o.key };
          tt.content.add(m);
          ions[o.key] = m;
          fresh.push(m);
        }
        m.userData.site = o;
        m.userData.to = o.c;
        if (!animateNew || fresh.indexOf(m) === -1) m.position.set(o.c[0], o.c[1], o.c[2]);
      });
      // outline: faint cube edges make the shape read as a cube from any angle
      if (edges) { tt.content.remove(edges); edges.geometry.dispose(); edges = null; }
      if (S.box != null) {
        var pad = S.box, flat = S.span[1] < 0.01;
        var bx = new T.BoxGeometry(S.span[0] + pad * 2, flat ? 0.02 : S.span[1] + pad * 2, S.span[2] + pad * 2);
        edges = new T.LineSegments(new T.EdgesGeometry(bx), new T.LineBasicMaterial({ color: 0x1d2433, transparent: true, opacity: 0.35 }));
        bx.dispose();
        tt.content.add(edges);
      }
      var ext = Math.max.apply(null, S.span) / 2 + 0.55;
      tt.setRadius(step === 'row' ? ext * 0.62 : step === 'pair' ? ext * 0.8 : ext * 1.15);   // a long thin row, or a lone pair, can be framed tighter
      paint();
      if (animateNew && fresh.length) {
        fresh.forEach(function (m) { m.position.set(m.userData.to[0], m.userData.to[1] + 4, m.userData.to[2]); });
        tt.animate(900 + fresh.length * 18, function (t) {
          fresh.forEach(function (m, n) {
            var d = Math.max(0, Math.min(1, t * 1.5 - n / fresh.length * 0.5)), e = 1 - Math.pow(1 - d, 3), to = m.userData.to;
            m.position.set(to[0], to[1] + 4 * (1 - e), to[2]);
          });
        });
      }
    }
    function pick(obj) {
      var o = obj && obj.userData.site;
      focus = o && !(focus && focus.key === o.key) ? o : null;
      paint();
      readout();
    }
    function readout() {
      var cfg = SALT3D[salt];
      if (focus) {
        var me = focus.pos ? cfg.cation : 'Cl⁻', them = focus.pos ? 'Cl⁻' : cfg.cation;
        var count = current.filter(function (o) { return touching(focus, o); }).length;
        foot.textContent = 'This ' + me + ' touches ' + count + ' ' + them + ' here. Deep inside a ' + cfg.label + ' crystal, every ion touches ' + cfg.n + ' of the opposite charge. Click it again to let go.';
        return;
      }
      foot.textContent = cfg.text[step];
    }
    function go(id) {
      step = id;
      focus = null;
      row.set(id);
      tt.settle();
      build(true);
      readout();
    }
    function setSalt(id) {
      salt = id;
      saltRow.set(id);
      K.clear(stepWrap);
      row = K.chips(SALT3D[id].steps, function (sid) { go(sid); }, { label: 'Build' });
      row.el.appendChild(packBtn);
      stepWrap.appendChild(row.el);
      if (tt.content) { tt.content.rotation.y = id === 'cscl' ? 0.5 : 0; tt.content.rotation.x = id === 'cscl' ? 0.12 : 0; }   // CsCl: turned so the centre ion isn't hidden behind a corner
      tt.label('key', '<b style="color:#e8264f">●</b> ' + SALT3D[id].cation + ' &nbsp; <b style="color:#69a42b">●</b> Cl⁻', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true, html: true });
      go('pair');
    }
    packBtn.addEventListener('click', function () {
      packed = !packed;
      packBtn.setAttribute('aria-pressed', packed ? 'true' : 'false');
      packBtn.textContent = packed ? 'Spread them out' : 'Pack them tight';
      build(false);
    });
    setSalt('nacl');
    return { settle: function () { tt.settle(); }, destroy: function () { tt.destroy(); if (matPos) { matPos.dispose(); matNeg.dispose(); } } };
  });

  // =================================================================================================
  // Beat 8 · salts side by side (melting point)
  // =================================================================================================
  GuideShell.registerScene('salts', function (mount) {
    var root = h('div', 'scene scene-salts');
    mount.appendChild(root);
    var head = h('div', 'scene-head');
    root.appendChild(head);
    var ask = h('p', 'scene-ask');
    var list = h('div', 'salt-list');
    var note = h('p', 'scene-readout');
    root.appendChild(ask);
    root.appendChild(list);
    root.appendChild(note);
    var VIEWS = [
      { id: 'size', label: 'Bigger ions', rows: ['naf', 'nacl', 'nabr', 'nai'],
        ask: 'Same charges (1+ and 1−), but the anion grows from F⁻ to I⁻. What happens to the melting point? Why might that be?' },
      { id: 'charge', label: 'Bigger charges', rows: ['naf', 'mgo'],
        ask: 'Na⁺F⁻ and Mg²⁺O²⁻ have ions of similar size, but MgO’s charges are doubled. Compare the melting points.' },
      { id: 'all', label: 'Beside other crystals', rows: 'all',
        ask: 'Salts sit high on the scale. Network solids are higher still, and molecular solids much lower. You will meet these properly later in the course.' },
    ];
    var c = K.chips(VIEWS, show, { label: 'Compare' });
    head.appendChild(c.el);
    var MIN = -100, MAX = 3600;
    function pct(v) { return (v - MIN) / (MAX - MIN) * 100; }
    function ionDots(salt) {
      var A = Kit.IONS[salt.cation], B = Kit.IONS[salt.anion], k = 0.11;
      var sv = K.svg('salt-ions');
      var w = (A.r + B.r) * k * 2 + 6;
      sv.setAttribute('viewBox', '0 0 ' + w + ' 52');
      sv.setAttribute('aria-hidden', 'true');
      s('circle', { cx: A.r * k + 2, cy: 26, r: A.r * k, fill: '#ff9aae', stroke: K.INK, 'stroke-width': 1.5 }, sv);
      s('circle', { cx: A.r * k * 2 + B.r * k + 4, cy: 26, r: B.r * k, fill: '#ffe38a', stroke: K.INK, 'stroke-width': 1.5 }, sv);
      return sv;
    }
    // One colour per crystal type (validated palette; values are always printed, so colour is never the only cue)
    var TYPE_COL = { ionic: '#e8821e', network: '#4152d9', molecular: '#d6364f' };
    function rowEl(label, sublabel, mp, extra, art, kind) {
      var r = h('div', 'salt-row');
      var l = h('div', 'salt-label');
      var slot = h('span', 'salt-art');   // fixed-width slot so every name lines up
      if (art) slot.appendChild(art);
      l.appendChild(slot);
      var tx = h('div', 'salt-name');
      tx.appendChild(h('strong', null, label));
      if (sublabel) tx.appendChild(h('span', null, sublabel));
      l.appendChild(tx);
      r.appendChild(l);
      var track = h('div', 'salt-track');
      var zero = h('span', 'salt-zero');
      zero.style.left = pct(0) + '%';
      track.appendChild(zero);
      var bar = h('span', 'salt-bar');
      bar.style.background = TYPE_COL[kind || 'ionic'];
      var x0 = Math.min(pct(0), pct(mp)), x1 = Math.max(pct(0), pct(mp));
      bar.style.left = x0 + '%';
      bar.style.width = '0%';
      setTimeout(function () { bar.style.width = (x1 - x0) + '%'; }, 40);
      track.appendChild(bar);
      var val = h('span', 'salt-value', mp + ' °C' + (extra ? ' ' + extra : ''));
      val.style.left = 'calc(' + x1 + '% + 8px)';
      track.appendChild(val);
      r.appendChild(track);
      r.title = label + ': ' + mp + ' °C';
      return r;
    }
    function group(title, note, kind) {
      var g = h('p', 'salt-group');
      var sw = h('span', 'salt-swatch');
      sw.style.background = TYPE_COL[kind];
      g.appendChild(sw);
      g.appendChild(document.createTextNode(title));
      if (note) g.appendChild(h('span', 'salt-group-note', note));
      list.appendChild(g);
    }
    function leBadge() {
      var b = h('p', 'le-eq salt-le');
      b.setAttribute('aria-label', 'L E equals k q 1 q 2 over r');
      b.appendChild(document.createTextNode('LE = '));
      var f = h('span', 'le-frac');
      f.appendChild(h('span', null, 'kq₁q₂'));
      f.appendChild(h('span', null, 'r'));
      b.appendChild(f);
      return b;
    }
    function show(id) {
      c.set(id);
      var v = VIEWS.filter(function (x) { return x.id === id; })[0];
      ask.textContent = v.ask;
      K.clear(list);
      list.appendChild(leBadge());   // lattice energy equation, top-right corner of every comparison
      list.classList.toggle('is-compact', v.rows === 'all');   // 13 rows: names and bars only
      var salts = v.rows === 'all' ? Kit.SALTS : v.rows.map(function (r) { return Kit.SALTS.filter(function (x) { return x.id === r; })[0]; });
      if (v.rows === 'all') group('Ionic (salts)', 'ions held by opposite charges', 'ionic');
      salts.forEach(function (x) {
        var A = Kit.IONS[x.cation], B = Kit.IONS[x.anion];
        var compact = v.rows === 'all';
        list.appendChild(rowEl(x.formula, compact ? null : x.cation.replace('2+', '²⁺').replace('+', '⁺') + ' ' + A.r + ' · ' + x.anion.replace('2-', '²⁻').replace('-', '⁻') + ' ' + B.r + ' pm', x.mp, null, compact ? null : ionDots(x)));
      });
      if (v.rows === 'all') {
        group('Covalent network', 'covalent bonds run through the whole crystal', 'network');
        Kit.CRYSTALS.filter(function (x) { return x.type === 'covalent network'; }).forEach(function (x) { list.appendChild(rowEl(x.formula, null, x.mp, x.mpNote ? '*' : '', null, 'network')); });
        group('Molecular', 'forces between molecules (coming in Intermolecular Forces)', 'molecular');
        Kit.CRYSTALS.filter(function (x) { return x.type === 'molecular'; }).forEach(function (x) { list.appendChild(rowEl(x.formula, null, x.mp, x.mpNote ? '*' : '', null, 'molecular')); });
      }
      var axis = h('div', 'salt-axis');
      [0, 1000, 2000, 3000].forEach(function (t) { var tk = h('span', null, t + ' °C'); tk.style.left = pct(t) + '%'; axis.appendChild(tk); });
      list.appendChild(axis);
      note.textContent = v.rows === 'all'
        ? 'Melting points at 1 atm (CRC Handbook). * Diamond changes form before melting; dry ice sublimes at −78 °C.'
        : 'Melting points at 1 atm (CRC Handbook). Ion sizes: Shannon radii. Drawn circles are to scale.';
    }
    show('size');
    return {};
  });
})(window);
