/**
 * Chapter B scenes (beyond the draw beats).
 *   count            the valence count, atom by atom, then the structure it makes (beat 9)
 *   vsepr            Lewis → shape, domains spread out (beats 19–20; data-mols); data-layout="gallery" (beat 21)
 *   shape-practice   count domains → choose the shape → show answer (beat 22)
 *   polarity         bond dipoles, then add them tip to tail (beat 23)
 *   what-if          change one thing, predict, then see (beat 24)
 *   polarity-sort    sort cards into polar / nonpolar; each flips to show its dipole sum (beat 25)
 */
(function (global) {
  'use strict';
  var K = global.SceneKit, Kit = global.BondingKit, Gm = global.Geometry, SV = global.ShapeView, L = global.LewisModel, h = K.h, s = K.s;

  function model(id) {
    var m = Gm.embed(Kit.structure(id), Kit.get(id).center != null ? { root: Kit.get(id).center } : {});
    if (Kit.get(id).center == null) Gm.level(m);
    return m;
  }
  function frame(mount, cls, vb) {
    var root = h('div', 'scene ' + cls), head = h('div', 'scene-head'), stage = K.svg('scene-svg'), foot = h('p', 'scene-readout');
    stage.setAttribute('viewBox', vb || '0 0 680 400');
    stage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(head); root.appendChild(stage); root.appendChild(foot);
    mount.appendChild(root);
    return { root: root, head: head, svg: stage, foot: foot };
  }
  function nested(parent, x, y, w, hh) { return s('svg', { x: x, y: y, width: w, height: hh, overflow: 'visible' }, parent); }
  function formula(id) { return Kit.get(id).formula; }
  function domainText(m) {
    var r = m.atoms[m.root];
    return r.steric + ' domain' + (r.steric === 1 ? '' : 's') + ' (' + r.bonded + ' bonding, ' + r.lone + ' lone)';
  }
  function angleOf(m) {
    var r = m.root, nb = [];
    m.bonds.forEach(function (b) { if (b.a === r) nb.push(b.b); else if (b.b === r) nb.push(b.a); });
    var mn = 999;
    for (var i = 0; i < nb.length; i++) for (var j = i + 1; j < nb.length; j++) mn = Math.min(mn, Gm.v.angle(Gm.v.sub(m.atoms[nb[i]].p, m.atoms[r].p), Gm.v.sub(m.atoms[nb[j]].p, m.atoms[r].p)));
    return Math.round(mn * 2) / 2;
  }
  function polarText(m, id) {
    var d = Gm.dipole(m), k = Kit.get(id);
    var reason = k.polar ? k.polar[1] : '';
    return (d.size > 0.05 ? 'Net dipole: yes, so ' + k.formula + ' is polar. ' : 'Net dipole: none, the pulls cancel. ' + k.formula + ' is nonpolar. ') + reason;
  }

  // =================================================================================================
  // Beat 9 · the count
  // =================================================================================================
  GuideShell.registerScene('count', function (mount, beat) {
    var ids = (beat.dataset.mols || 'ch4 h2o co2 nh4 co3').split(/\s+/);
    var F = frame(mount, 'scene-count', '0 0 680 440');
    var INK = '#1d2433', BLUE = '#4152d9', MONO = 'Space Mono, monospace';
    var anim = null, cur = ids[0];
    var c = K.chips(ids.map(function (id) { return { id: id, label: formula(id) }; }), show, { label: 'Molecule' });
    var again = h('button', 'btn scene-chip-step', 'Play again');
    again.type = 'button';
    again.addEventListener('click', function () { show(cur); });
    c.el.appendChild(again);
    F.head.appendChild(c.el);
    function lerp(a, b, t) { return a + (b - a) * t; }
    function win(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
    function at(n, x, y) { n.setAttribute('cx', x); n.setAttribute('cy', y); }

    function show(id) {
      cur = id;
      c.set(id);
      if (anim) anim.cancel();
      K.clear(F.svg);
      var mol = Kit.get(id), st = Kit.structure(id);
      // centre atom first, then the rest in order
      var order = st.atoms.map(function (_, i) { return i; });
      if (mol.center != null) order = [mol.center].concat(order.filter(function (i) { return i !== mol.center; }));
      var n = order.length + (mol.charge ? 1 : 0), slot = Math.min(110, 620 / n), x0 = 340 - slot * (n - 1) / 2;
      var rowK = slot < 100 ? 0.8 : 0.95, ROWY = 64, NUMY = 122, total = 0;

      // --- the finished structure, drawn now but hidden: it gives every target position -------------
      var LX = 90, LY = 214, LW = 500, LH = 220;
      var lg = s('g', { opacity: 0 }, F.svg), lw = nested(lg, LX, LY, LW, LH);
      DrawEngine.renderStatic(lw, st, { width: LW, height: LH, maxScale: 1.1 });
      var V = lw.__lewis.view, U = lw.__lewis.unit * V.k;
      var fin = st.atoms.map(function (a) { return { x: LX + V.ox + a.x * U, y: LY + V.oy + a.y * U }; });

      // --- the separate atoms, each with its valence dots, and the count under them -----------------
      var counts = [], movers = [];
      order.forEach(function (ai, i) {
        var a = st.atoms[ai], v = Kit.ELEMENTS[a.el].valence, x = x0 + i * slot;
        var cg = s('g', { opacity: 0 }, F.svg);
        K.text(cg, x, NUMY, String(v), { 'font-size': 22, 'font-family': MONO, fill: BLUE });
        if (i) K.text(cg, x - slot / 2, NUMY, '+', { 'font-size': 22, 'font-family': MONO, fill: '#5b6474' });
        counts.push(cg);
        var mg = s('g', { opacity: 0 }, F.svg);
        var dots = K.dotSymbol(mg, x, ROWY, a.el, v, rowK);
        movers.push({ ai: ai, g: mg, letter: mg.querySelector('text'), x: x, y: ROWY,
          dots: dots.map(function (d) { return { n: d, ox: +d.getAttribute('cx') - x, oy: +d.getAttribute('cy') - ROWY, own: ai }; }) });
        total += v;
      });
      var chargeAt = null, chargeLbl = null;
      if (mol.charge) {
        var cg2 = s('g', { opacity: 0 }, F.svg), cx = x0 + order.length * slot;
        chargeLbl = s('g', {}, cg2);
        K.text(chargeLbl, cx, ROWY, 'charge ' + (mol.charge > 0 ? mol.charge + '+' : -mol.charge + '−'), { 'font-size': 15, 'font-family': MONO, fill: '#5b6474' });
        K.text(cg2, cx - slot / 2, NUMY, mol.charge > 0 ? '−' : '+', { 'font-size': 22, 'font-family': MONO, fill: '#5b6474' });
        K.text(cg2, cx, NUMY, String(Math.abs(mol.charge)), { 'font-size': 22, 'font-family': MONO, fill: BLUE });
        counts.push(cg2);
        chargeAt = { x: cx, y: ROWY + 22 };
        total -= mol.charge;
      }
      var tot = s('g', { opacity: 0 }, F.svg);
      s('rect', { x: 240, y: 146, width: 200, height: 44, rx: 22, fill: '#e7eaff', stroke: BLUE, 'stroke-width': 2 }, tot);
      K.text(tot, 340, 169, '= ' + total + ' electrons', { 'font-size': 20, 'font-family': MONO, fill: BLUE });

      // --- where every electron ends up: shared pairs on the bonds, lone pairs from the drawing ------
      var want = st.atoms.map(function () { return []; });
      st.bonds.forEach(function (b) {
        var A = fin[b.a], B = fin[b.b], dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
        var ux = dx / len, uy = dy / len, mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, sep = 4.6 * V.k;
        for (var l = 0; l < b.order; l++) {
          var off = (l - (b.order - 1) / 2) * 7 * V.k;
          want[b.a].push({ x: mx - ux * sep - uy * off, y: my - uy * sep + ux * off, bond: true });
          want[b.b].push({ x: mx + ux * sep - uy * off, y: my + uy * sep + ux * off, bond: true });
        }
      });
      var eg = lw.querySelector('g').children[1];
      Array.prototype.forEach.call(eg.querySelectorAll('circle'), function (d) {
        var x = LX + +d.getAttribute('cx'), y = LY + +d.getAttribute('cy'), best = 0, bd = 1e9;
        fin.forEach(function (p, i) { var dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; best = i; } });
        want[best].push({ x: x, y: y, bond: false });
      });

      // atoms gather near their final spots first, then close in and share
      var cx0 = fin.reduce(function (n2, p) { return n2 + p.x; }, 0) / fin.length;
      var cy0 = fin.reduce(function (n2, p) { return n2 + p.y; }, 0) / fin.length;
      var hub = mol.center != null ? fin[mol.center] : { x: cx0, y: cy0 };
      var dotK = V.k * 2.9 / (3.6 * rowK), offK = (23 * V.k) / (24 * rowK);
      var rowFont = 34 * rowK;
      var leaving = [], extras = [], all = [];
      movers.forEach(function (m) {
        var f = fin[m.ai];
        m.near = { x: hub.x + (f.x - hub.x) * 1.6, y: Math.max(LY + 18, hub.y + (f.y - hub.y) * 1.6) };
        if (Math.hypot(f.x - hub.x, f.y - hub.y) < 1) m.near = { x: f.x, y: f.y };
        m.font = (st.atoms[m.ai].el.length > 1 ? 26 * 0.86 : 26) * V.k;
        // pair each electron with the closest free target on its own atom (seen from the gathered position)
        var free = want[m.ai].slice();
        m.dots.forEach(function (d) {
          var sx = m.near.x + d.ox * offK, sy = m.near.y + d.oy * offK, best = -1, bd = 1e9;
          free.forEach(function (t2, i) { var dd = Math.hypot(t2.x - sx, t2.y - sy); if (dd < bd) { bd = dd; best = i; } });
          if (best < 0) { d.to = chargeAt || { x: sx, y: sy - 40 }; d.leave = true; leaving.push(d); }
          else { d.to = free[best]; free.splice(best, 1); }
          all.push(d);
        });
        free.forEach(function (t2) {   // electrons the charge adds
          var at0 = chargeAt || { x: 340, y: ROWY };
          var nd = s('circle', { cx: at0.x, cy: at0.y, r: 3.6 * rowK, fill: BLUE, opacity: 0 }, F.svg);
          var e = { n: nd, extra: true, to: t2, from: at0 };
          extras.push(e); all.push(e);
        });
      });

      function place(m, x, y, sc, font) {
        m.letter.setAttribute('x', x); m.letter.setAttribute('y', y);
        m.letter.setAttribute('font-size', font);
        m.dots.forEach(function (d) { at(d.n, x + d.ox * sc, y + d.oy * sc); d.n.setAttribute('r', 3.6 * rowK * lerp(1, dotK, (sc - 1) / ((offK - 1) || 1))); });
      }
      function travel(t) {
        var N = movers.length;
        movers.forEach(function (m, i) {
          var a = i * 0.35 / Math.max(1, N - 1), e = K.ease(win(t, a, a + 0.65));
          var x = lerp(m.x, m.near.x, e), y = lerp(m.y, m.near.y, e) - Math.sin(Math.PI * e) * 18;
          place(m, x, y, lerp(1, offK, e), lerp(rowFont, m.font, e));
        });
      }
      function share(t) {
        var e = K.ease(t);
        movers.forEach(function (m) {
          var f = fin[m.ai], x = lerp(m.near.x, f.x, e), y = lerp(m.near.y, f.y, e);
          m.letter.setAttribute('x', x); m.letter.setAttribute('y', y);
          m.dots.forEach(function (d) {
            var sx = m.near.x + d.ox * offK, sy = m.near.y + d.oy * offK;
            if (d.leave) { at(d.n, lerp(sx, d.to.x, e), lerp(sy, d.to.y, e)); d.n.setAttribute('opacity', 1 - e); return; }
            // swing around the atom (never through its letter) while the atom moves in
            var a0 = Math.atan2(d.oy, d.ox), r0 = Math.hypot(d.ox, d.oy) * offK;
            var rx = d.to.x - f.x, ry = d.to.y - f.y, a1 = Math.atan2(ry, rx), r1 = Math.hypot(rx, ry);
            var da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
            var ang = a0 + da * e, rad = lerp(r0, r1, e) + Math.sin(Math.PI * e) * 6;
            at(d.n, x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
          });
        });
        extras.forEach(function (d) {
          at(d.n, lerp(d.from.x, d.to.x, e), lerp(d.from.y, d.to.y, e) + Math.sin(Math.PI * e) * -30);
          d.n.setAttribute('r', lerp(3.6 * rowK, 2.9 * V.k, e));
          d.n.setAttribute('opacity', Math.min(1, t * 4));
        });
      }
      function finish(t) {
        // shared pairs turn into bond lines; everything else is already in place
        lg.setAttribute('opacity', t);
        all.forEach(function (d) { if (!d.leave) d.n.setAttribute('opacity', 1 - t); });
        movers.forEach(function (m) { m.letter.setAttribute('opacity', 1 - t); });
      }
      // the end: the sum and the total rise into the empty top band; the structure rises and grows into the rest
      var LIFT = -78, fit = null;
      function fitBox() {
        var x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
        Array.prototype.forEach.call(lw.children, function (n) {
          if (n.tagName === 'defs' || !n.getBBox) return;
          var b = n.getBBox();
          if (!b.width && !b.height) return;
          x1 = Math.min(x1, LX + b.x); y1 = Math.min(y1, LY + b.y); x2 = Math.max(x2, LX + b.x + b.width); y2 = Math.max(y2, LY + b.y + b.height);
        });
        if (x2 <= x1) fin.forEach(function (p) { x1 = Math.min(x1, p.x - 20); y1 = Math.min(y1, p.y - 20); x2 = Math.max(x2, p.x + 20); y2 = Math.max(y2, p.y + 20); });
        var top = 190 + LIFT + 18, bot = 428, sc = Math.max(1, Math.min(1.35, (bot - top) / (y2 - y1), 600 / (x2 - x1)));
        return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, tx: 340, ty: (top + bot) / 2, sc: sc };
      }
      function lift(t) {
        if (!fit) fit = fitBox();
        var e = K.ease(t), dy = LIFT * e, sc = lerp(1, fit.sc, e);
        counts.forEach(function (g) { g.setAttribute('transform', 'translate(0 ' + dy + ')'); });
        tot.setAttribute('transform', 'translate(0 ' + dy + ')');
        if (chargeLbl) chargeLbl.setAttribute('opacity', 1 - Math.min(1, t * 2.5));
        var X = lerp(fit.cx, fit.tx, e), Y = lerp(fit.cy, fit.ty, e);
        lg.setAttribute('transform', 'translate(' + (X - fit.cx * sc) + ' ' + (Y - fit.cy * sc) + ') scale(' + sc + ')');
      }

      var t2 = L.tally(st), inB = st.bonds.reduce(function (n2, b) { return n2 + 2 * b.order; }, 0);
      var spare = leaving.length, added = extras.length;
      F.foot.textContent = mol.formula + ': ' + order.map(function (i) { return Kit.ELEMENTS[st.atoms[i].el].valence; }).join(' + ') +
        (mol.charge ? (mol.charge > 0 ? ' − ' : ' + ') + Math.abs(mol.charge) + ' (charge)' : '') + ' = ' + total + ' valence electrons. ' +
        'Each bond is a pair shared between two atoms; the rest sit as lone pairs. ' +
        (spare ? 'The + charge means ' + spare + ' electron' + (spare > 1 ? 's are' : ' is') + ' missing. ' : '') +
        (added ? 'The ' + (mol.charge < 0 ? '−' : '') + ' charge adds ' + added + ' electron' + (added > 1 ? 's' : '') + ' (blue). ' : '') +
        'In the structure: ' + inB + ' in bonds + ' + (t2.placed - inB) + ' in lone pairs = ' + t2.placed + '.';

      var steps = [];
      order.forEach(function (_, i) {
        var m = movers[i], cg = counts[i];
        steps.push({ ms: 300, run: function (tt) { m.g.setAttribute('opacity', tt); cg.setAttribute('opacity', tt); } });
      });
      if (mol.charge) steps.push({ ms: 300, run: function (tt) { counts[counts.length - 1].setAttribute('opacity', tt); } });
      steps.push({ ms: 380, run: function (tt) { tot.setAttribute('opacity', tt); } });
      steps.push({ ms: 500 });
      steps.push({ ms: 1700, run: travel });
      steps.push({ ms: 350 });
      steps.push({ ms: 1500, run: share });
      steps.push({ ms: 450 });
      steps.push({ ms: 700, run: finish });
      steps.push({ ms: 350 });
      steps.push({ ms: 1000, run: lift });
      anim = K.sequence(steps);
    }
    show(ids[0]);
    return { settle: function () { if (anim) anim.settle(); }, destroy: function () { if (anim) anim.cancel(); } };
  });

  // =================================================================================================
  // Beat 16 · resonance: curved arrows push electron pairs from one form to the next; then the hybrid
  // =================================================================================================
  GuideShell.registerScene('resonance', function (mount, beat) {
    var ids = (beat.dataset.mols || 'o3 no3 co3').split(/\s+/);
    var W = 640, H = 380, BLUE = '#4152d9';
    var root = h('div', 'scene scene-resonance');
    var head = h('div', 'scene-head');
    var stage = K.svg('scene-svg');
    stage.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    stage.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var strip = h('div', 'res-strip');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(head); root.appendChild(stage); root.appendChild(strip); root.appendChild(foot);
    mount.appendChild(root);
    var c = K.chips(ids.map(function (id) { return { id: id, label: formula(id) }; }), function (id) { load(id); }, { label: 'Molecule' });
    head.appendChild(c.el);
    var playBtn = h('button', 'btn scene-chip-step', 'Pause');
    var stepBtn = h('button', 'btn scene-chip-step is-next', 'Next form');
    var hybBtn = h('button', 'btn scene-chip-step is-next', 'Show the hybrid');
    [playBtn, stepBtn, hybBtn].forEach(function (b) { b.type = 'button'; c.el.appendChild(b); });
    var forms = [], k = 0, id = null, playing = true, hybrid = false, anim = null, timer = null, layers = [], over = null;

    function fcOf(form) { return L.tally(form).atoms.map(function (a) { return a.fc; }); }
    function charge(n) { return n > 0 ? '+' + (n === 1 ? '' : n) : n < 0 ? '−' + (n === -1 ? '' : -n) : ''; }
    function frac(x) {
      var sgn = x < 0 ? '−' : '+', a = Math.abs(x);
      var F = [[1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [1, '1']];
      for (var i = 0; i < F.length; i++) if (Math.abs(a - F[i][0]) < 0.02) return sgn + F[i][1];
      return sgn + a.toFixed(2);
    }
    /** One form drawn into its own layer (same size, so every form lines up exactly). */
    function drawForm(form) {
      var g = K.s('svg', { x: 0, y: 0, width: W, height: H, overflow: 'visible' }, stage);
      DrawEngine.renderStatic(g, form, { width: W, height: H, maxScale: 2.1, fcMode: 'off' });
      var V = g.__lewis.view, U = g.__lewis.unit * V.k, fc = fcOf(form);
      form.atoms.forEach(function (a, i) {
        if (!fc[i]) return;
        var x = V.ox + a.x * U + 20 * V.k, y = V.oy + a.y * U - 22 * V.k;
        K.s('circle', { cx: x, cy: y, r: 10 * V.k, fill: '#ffffff', stroke: fc[i] > 0 ? '#e8264f' : '#b98a00', 'stroke-width': 1.6 }, g);
        K.text(g, x, y + 0.5, charge(fc[i]), { 'font-size': 13 * V.k, fill: fc[i] > 0 ? '#e8264f' : '#b98a00' });
      });
      return g;
    }
    function px(i) { var V = layers[0].__lewis.view, U = layers[0].__lewis.unit * V.k, a = forms[0].atoms[i]; return [V.ox + a.x * U, V.oy + a.y * U]; }
    function bondOrder(form, a, b) { var o = 0; form.bonds.forEach(function (x) { if ((x.a === a && x.b === b) || (x.a === b && x.b === a)) o = x.order; }); return o; }

    function load(nid) {
      id = nid;
      c.set(id);
      forms = L.resonanceForms(Kit.structure(id));
      k = 0; hybrid = false;
      hybBtn.textContent = 'Show the hybrid';
      redraw();
      buildStrip();
      if (playing) schedule(900);
    }
    function redraw() {
      if (anim) anim.cancel();
      K.clear(stage);
      layers = forms.map(drawForm);
      layers.forEach(function (g, i) { g.setAttribute('opacity', i === k ? 1 : 0); });
      over = K.s('g', {}, stage);
      if (hybrid) drawHybrid();
      markStrip();
      readout();
    }
    function buildStrip() {
      K.clear(strip);
      forms.forEach(function (f, i) {
        if (i) strip.appendChild(h('span', 'res-arrow', '↔'));
        var b = h('button', 'res-thumb');
        b.type = 'button';
        b.setAttribute('aria-label', 'Resonance form ' + (i + 1));
        var sv = K.svg('res-thumb-svg');
        DrawEngine.renderStatic(sv, f, { width: 200, height: 120, maxScale: 0.7 });
        b.appendChild(sv);
        b.addEventListener('click', function () { stop(); hybrid = false; hybBtn.textContent = 'Show the hybrid'; k = i; redraw(); });
        strip.appendChild(b);
      });
      markStrip();
    }
    function markStrip() {
      Array.prototype.forEach.call(strip.querySelectorAll('.res-thumb'), function (b, i) { b.classList.toggle('is-on', !hybrid && i === k); });
    }
    function readout() {
      var n = forms.length;
      foot.textContent = hybrid
        ? 'The real ' + formula(id) + ' is not any one drawing: the double-bond electrons are spread over all ' + n + ' bonds. Each bond is between a single and a double bond, and the charge is shared equally.'
        : 'Form ' + (k + 1) + ' of ' + n + '. Blue arrows show where an electron pair goes: a lone pair swings in to make a new bond, and the old π pair moves out onto the other O. No atoms move, only electrons.';
    }

    /** Animate form k → k+1: arrows draw in, electron pairs travel along them, the next form fades in. */
    function step() {
      if (forms.length < 2) return;
      var from = forms[k], nk = (k + 1) % forms.length, to = forms[nk];
      var lost = null, gained = null;   // the C=X bond that becomes single, and the C–Y bond that becomes double
      from.bonds.forEach(function (b) {
        var o2 = bondOrder(to, b.a, b.b);
        if (o2 < b.order) lost = b;
        if (o2 > b.order) gained = b;
      });
      if (!lost || !gained) { k = nk; redraw(); return; }
      var cA = lost.a === gained.a || lost.a === gained.b ? lost.a : lost.b;   // shared central atom
      var X = lost.a === cA ? lost.b : lost.a, Y = gained.a === cA ? gained.b : gained.a;
      var V = layers[0].__lewis.view, R = 30 * V.k;
      var C = px(cA), PX = px(X), PY = px(Y);
      function unit(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
      // which side of each bond faces away from the rest of the molecule
      var cen = [0, 0];
      forms[0].atoms.forEach(function (_, i) { var p = px(i); cen[0] += p[0]; cen[1] += p[1]; });
      cen = [cen[0] / forms[0].atoms.length, cen[1] / forms[0].atoms.length];
      function side(P, u) { var n = [-u[1], u[0]], m = [(C[0] + P[0]) / 2 - cen[0], (C[1] + P[1]) / 2 - cen[1]]; return n[0] * m[0] + n[1] * m[1] >= 0 ? 1 : -1; }
      var uY = unit(C, PY), nY = [-uY[1], uY[0]], sY = side(PY, uY);
      var uX = unit(C, PX), nX = [-uX[1], uX[0]], sX = side(PX, uX);
      var cos = Math.cos(1.05), sin = Math.sin(1.05);
      // A: a lone pair on Y swings into the C–Y bond
      var A0 = [PY[0] + (uY[0] * cos + nY[0] * sin * sY) * R, PY[1] + (uY[1] * cos + nY[1] * sin * sY) * R];
      var A1 = [(C[0] + PY[0]) / 2 + nY[0] * sY * 7 * V.k, (C[1] + PY[1]) / 2 + nY[1] * sY * 7 * V.k];
      var AC = [(A0[0] + A1[0]) / 2 + nY[0] * sY * 42 * V.k, (A0[1] + A1[1]) / 2 + nY[1] * sY * 42 * V.k];
      // B: the π pair of C=X moves out onto X as a lone pair
      var B0 = [(C[0] + PX[0]) / 2 + nX[0] * sX * 7 * V.k, (C[1] + PX[1]) / 2 + nX[1] * sX * 7 * V.k];
      var B1 = [PX[0] + (uX[0] * cos + nX[0] * sin * sX) * R, PX[1] + (uX[1] * cos + nX[1] * sin * sX) * R];
      var BC = [(B0[0] + B1[0]) / 2 + nX[0] * sX * 42 * V.k, (B0[1] + B1[1]) / 2 + nX[1] * sX * 42 * V.k];
      function q(P0, P1, PC, t) { var u = 1 - t; return [u * u * P0[0] + 2 * u * t * PC[0] + t * t * P1[0], u * u * P0[1] + 2 * u * t * PC[1] + t * t * P1[1]]; }
      function tan(P0, P1, PC, t) { var d = [2 * (1 - t) * (PC[0] - P0[0]) + 2 * t * (P1[0] - PC[0]), 2 * (1 - t) * (PC[1] - P0[1]) + 2 * t * (P1[1] - PC[1])], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; }
      function arrow(P0, P1, PC, upto) {
        var pts = '', N = 30;
        for (var i = 0; i <= N * upto; i++) { var p = q(P0, P1, PC, i / N); pts += (i ? ' L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
        K.s('path', { d: pts, fill: 'none', stroke: BLUE, 'stroke-width': 3, 'stroke-linecap': 'round' }, over);
        if (upto >= 1) {
          var tg = tan(P0, P1, PC, 1), n = [-tg[1], tg[0]], hd = 11;
          K.s('path', { d: 'M' + P1[0] + ' ' + P1[1] + ' L' + (P1[0] - tg[0] * hd + n[0] * hd * 0.55) + ' ' + (P1[1] - tg[1] * hd + n[1] * hd * 0.55) +
            ' L' + (P1[0] - tg[0] * hd - n[0] * hd * 0.55) + ' ' + (P1[1] - tg[1] * hd - n[1] * hd * 0.55) + 'Z', fill: BLUE }, over);
        }
      }
      function pair(P0, P1, PC, t) {
        var p = q(P0, P1, PC, t), tg = tan(P0, P1, PC, t), n = [-tg[1], tg[0]], sp = 4.5 * V.k;
        K.s('circle', { cx: p[0] + n[0] * sp, cy: p[1] + n[1] * sp, r: 4.2 * V.k, fill: BLUE }, over);
        K.s('circle', { cx: p[0] - n[0] * sp, cy: p[1] - n[1] * sp, r: 4.2 * V.k, fill: BLUE }, over);
      }
      var Lfrom = layers[k], Lto = layers[nk];
      anim = K.sequence([
        { ms: 520, run: function (t) { K.clear(over); arrow(A0, A1, AC, t); arrow(B0, B1, BC, t); } },
        { ms: 1100, run: function (t) { var e = K.ease(t); K.clear(over); arrow(A0, A1, AC, 1); arrow(B0, B1, BC, 1); pair(A0, A1, AC, e); pair(B0, B1, BC, e); } },
        { ms: 600, run: function (t) { K.clear(over); Lfrom.setAttribute('opacity', 1 - t); Lto.setAttribute('opacity', t); } },
      ], function () { k = nk; markStrip(); readout(); if (playing) schedule(1300); });
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { if (playing && !hybrid) step(); }, ms); }
    function stop() { playing = false; clearTimeout(timer); if (anim) anim.settle(); playBtn.textContent = 'Play'; }
    playBtn.addEventListener('click', function () {
      if (playing) { stop(); return; }
      playing = true; playBtn.textContent = 'Pause';
      if (hybrid) { hybrid = false; hybBtn.textContent = 'Show the hybrid'; redraw(); }
      step();
    });
    stepBtn.addEventListener('click', function () {
      stop();
      if (hybrid) { hybrid = false; hybBtn.textContent = 'Show the hybrid'; redraw(); }
      step();
    });
    hybBtn.addEventListener('click', function () {
      stop();
      hybrid = !hybrid;
      hybBtn.textContent = hybrid ? 'Show the forms' : 'Show the hybrid';
      redraw();
    });

    /** The hybrid: every delocalised bond drawn as one line plus a dashed line; the charge shared out. */
    function drawHybrid() {
      layers.forEach(function (g) { g.setAttribute('opacity', 0); });
      var V = layers[0].__lewis.view, f0 = forms[0], n = forms.length;
      var order = {}, fcs = forms.map(fcOf);
      f0.bonds.forEach(function (b) { order[b.a + '-' + b.b] = forms.reduce(function (sum, f) { return sum + bondOrder(f, b.a, b.b); }, 0) / n; });
      var g = K.s('g', {}, over);
      var defs = K.s('defs', {}, g);
      var fl = K.s('filter', { id: 'res-blur', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
      K.s('feGaussianBlur', { stdDeviation: 10 * V.k }, fl);
      var cloud = K.s('g', { filter: 'url(#res-blur)', opacity: 0.5 }, g);
      K.s('animate', { attributeName: 'opacity', values: '0.3;0.6;0.3', dur: '2.6s', repeatCount: 'indefinite' }, cloud);
      f0.bonds.forEach(function (b) {
        var o = order[b.a + '-' + b.b], A = px(b.a), B = px(b.b);
        if (o % 1) K.s('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: BLUE, 'stroke-width': 30 * V.k, 'stroke-linecap': 'round' }, cloud);
      });
      f0.bonds.forEach(function (b) {
        var o = order[b.a + '-' + b.b], A = px(b.a), B = px(b.b);
        var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux, tr = 15 * V.k, gap = 3.6 * V.k;
        var x1 = A[0] + ux * tr, y1 = A[1] + uy * tr, x2 = B[0] - ux * tr, y2 = B[1] - uy * tr;
        if (o % 1) {
          K.s('line', { x1: x1 - nx * gap, y1: y1 - ny * gap, x2: x2 - nx * gap, y2: y2 - ny * gap, stroke: '#1d2433', 'stroke-width': 2.6 * V.k, 'stroke-linecap': 'round' }, g);
          K.s('line', { x1: x1 + nx * gap, y1: y1 + ny * gap, x2: x2 + nx * gap, y2: y2 + ny * gap, stroke: '#1d2433', 'stroke-width': 2.6 * V.k, 'stroke-dasharray': 6 * V.k + ' ' + 5 * V.k }, g);
        } else {
          for (var j = 0; j < o; j++) {
            var off = (j - (o - 1) / 2) * 7.2 * V.k;
            K.s('line', { x1: x1 + nx * off, y1: y1 + ny * off, x2: x2 + nx * off, y2: y2 + ny * off, stroke: '#1d2433', 'stroke-width': 2.6 * V.k, 'stroke-linecap': 'round' }, g);
          }
        }
      });
      f0.atoms.forEach(function (a, i) {
        var P = px(i);
        K.s('circle', { cx: P[0], cy: P[1], r: 14 * V.k, fill: '#ffffff' }, g);
        K.text(g, P[0], P[1], a.el, { 'font-size': 26 * V.k });
        var avg = fcs.reduce(function (sum, f) { return sum + f[i]; }, 0) / n;
        if (Math.abs(avg) > 0.01) {
          // the open side: away from this atom's bonds
          var angs = [];
          f0.bonds.forEach(function (b) { if (b.a === i || b.b === i) { var o2 = px(b.a === i ? b.b : b.a); angs.push(Math.atan2(o2[1] - P[1], o2[0] - P[0])); } });
          var best = null;
          [-Math.PI / 4, -3 * Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 2, 0, Math.PI, Math.PI / 2].forEach(function (t) {
            var sep = Math.min.apply(null, angs.map(function (u) { var d = Math.abs(t - u) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }).concat([Math.PI]));
            if (!best || sep > best.sep + 0.05) best = { t: t, sep: sep };
          });
          var x = P[0] + Math.cos(best.t) * 34 * V.k, y = P[1] + Math.sin(best.t) * 30 * V.k, col = avg > 0 ? '#e8264f' : '#b98a00', t = frac(avg), w = t.length * 9 * V.k + 10 * V.k;
          K.s('rect', { x: x - w / 2, y: y - 11 * V.k, width: w, height: 22 * V.k, rx: 11 * V.k, fill: '#ffffff', stroke: col, 'stroke-width': 1.6 }, g);
          K.text(g, x, y + 0.5, t, { 'font-size': 13 * V.k, fill: col });
        }
      });
      var q = Kit.get(id).charge;
      if (q) {   // an ion keeps its brackets and overall charge
        var xs = f0.atoms.map(function (_, i) { return px(i)[0]; }), ys = f0.atoms.map(function (_, i) { return px(i)[1]; });
        var pad = 52 * V.k, x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad, y0 = Math.min.apply(null, ys) - pad, y1 = Math.max.apply(null, ys) + pad, lip = 10 * V.k;
        var bp = { fill: 'none', stroke: '#1d2433', 'stroke-width': 2.4 * V.k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        K.s('path', Object.assign({ d: 'M' + (x0 + lip) + ',' + y0 + ' H' + x0 + ' V' + y1 + ' H' + (x0 + lip) }, bp), g);
        K.s('path', Object.assign({ d: 'M' + (x1 - lip) + ',' + y0 + ' H' + x1 + ' V' + y1 + ' H' + (x1 - lip) }, bp), g);
        K.text(g, x1 + 14 * V.k, y0 + 4 * V.k, (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−'), { 'font-size': 18 * V.k, 'font-family': 'Space Mono, monospace' });
      }
      K.text(g, W / 2, H - 18, 'resonance hybrid: bond order ' + (forms.length === 2 ? '1½' : '1⅓') + ' in every delocalised bond', { 'font-size': 15, 'font-family': 'Space Mono, monospace', fill: BLUE });
    }

    load(ids[0]);
    return {
      settle: function () { if (anim) anim.settle(); },
      destroy: function () { playing = false; clearTimeout(timer); if (anim) anim.cancel(); },
    };
  });

  // =================================================================================================
  // Beats 19–22 · VSEPR in 3D (colour starts here): the Lewis drawing lifts into a shape you can turn
  // =================================================================================================
  function flatFrom(id) {
    var st = Kit.structure(id), cx = 0, cy = 0;
    st.atoms.forEach(function (a) { cx += a.x; cy += a.y; });
    cx /= st.atoms.length; cy /= st.atoms.length;
    return st.atoms.map(function (a) { return [(a.x - cx) * 1.25, -(a.y - cy) * 1.25, 0]; });
  }
  function clearContent(tt) {
    if (!tt.content) return;
    while (tt.content.children.length) {
      var c = tt.content.children.pop();
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }
  /** VSEPR notation: A = central atom, X = bonded atoms, E = lone pairs (AX₃E). */
  function axeText(r) { return 'AX' + sub(r.bonded) + (r.lone ? 'E' + (r.lone > 1 ? sub(r.lone) : '') : ''); }
  function sub(n) { return String(n).split('').map(function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }).join(''); }
  function axe(r) {
    return 'AX<sub>' + r.bonded + '</sub>' + (r.lone ? 'E' + (r.lone > 1 ? '<sub>' + r.lone + '</sub>' : '') : '');
  }
  /** Toggles for space-filling spheres and the geometric shape, shared by the VSEPR scenes (one at a time). */
  function viewToggles(tt) {
    var sp = h('button', 'btn scene-chip-step', 'Space filling'), sh = h('button', 'btn scene-chip-step', 'Shape');
    [sp, sh].forEach(function (b) { b.type = 'button'; b.setAttribute('aria-pressed', 'false'); });
    function sync() {
      sp.setAttribute('aria-pressed', tt.isSpaceFill() ? 'true' : 'false');
      sh.setAttribute('aria-pressed', tt.isShape && tt.isShape() ? 'true' : 'false');
      shapeLabel(tt);
    }
    sp.addEventListener('click', function () { tt.setSpaceFill(!tt.isSpaceFill()); sync(); });
    sh.addEventListener('click', function () { tt.setShape(!tt.isShape()); sync(); });
    tt.__toggles = sync;
    return { space: sp, shape: sh, sync: sync };
  }
  /** The solid each VSEPR shape is named for; the flat ones are traced along their bonds instead. */
  var SOLID = {
    'linear': ['a straight line', false], 'bent': ['a V', false], 'T-shaped': ['a T', false],
    'trigonal planar': ['a triangle', true], 'square planar': ['a square', true],
    'tetrahedral': ['a tetrahedron', true], 'trigonal pyramidal': ['a triangular pyramid', true],
    'seesaw': ['a seesaw', true], 'trigonal bipyramidal': ['a trigonal bipyramid', true],
    'square pyramidal': ['a square pyramid', true], 'octahedral': ['an octahedron', true],
  };
  function shapeLabel(tt) {
    var r = tt.__shapeOf, on = tt.isShape && tt.isShape() && r;
    tt.label('shape', on ? 'The atoms make ' + (SOLID[r.shape] || [r.shape])[0] : null, [0, 0, 0], { cls: 'is-fixed-bc', fixed: true });
  }
  /**
   * Turn a model so its electron domains sit on the standard directions for its domain count (methane's for 4,
   * PCl₅'s for 5, SF₆'s for 6). Shapes with the same count then line up: NH₃'s lone pair takes the place of one of
   * methane's H atoms, H₂O's two take two. Best fit over every slot assignment; ties (equivalent slots) put lone
   * pairs in the highest slots.
   */
  function alignDomains(m) {
    var V = Gm.v, r = m.atoms[m.root], dirs = [];
    m.bonds.forEach(function (b) { var j = b.a === m.root ? b.b : b.b === m.root ? b.a : -1; if (j >= 0) dirs.push({ v: V.norm(V.sub(m.atoms[j].p, r.p)), lone: false }); });
    r.lones.forEach(function (d) { dirs.push({ v: V.norm(d), lone: true }); });
    var n = dirs.length;
    if (n < 3 || n > 6) return m;
    var slots = Gm.domainDirs(n, 0).bonds;
    if (!slots || slots.length !== n) return m;
    var best = null;
    (function perm(arr, k) {
      if (k === n) {
        var q = horn(dirs.map(function (d) { return d.v; }), arr.map(function (i) { return slots[i]; }));
        var fit = 0, lift = 0;
        dirs.forEach(function (d, i) { fit += V.dot(qrot(q, d.v), slots[arr[i]]); if (d.lone) lift += slots[arr[i]][1]; });
        var score = fit + 0.002 * lift;
        if (!best || score > best.score + 1e-9) best = { score: score, q: q };
        return;
      }
      for (var i = k; i < n; i++) { var t = arr[k]; arr[k] = arr[i]; arr[i] = t; perm(arr, k + 1); t = arr[k]; arr[k] = arr[i]; arr[i] = t; }
    })(slots.map(function (_, i) { return i; }), 0);
    var c = r.p;
    m.atoms.forEach(function (a) {
      a.p = V.add(c, qrot(best.q, V.sub(a.p, c)));
      a.lones = a.lones.map(function (d) { return qrot(best.q, d); });
    });
    return m;
  }
  /** Horn's method: the unit quaternion turning vectors A onto B (best fit), by power iteration on the 4×4 matrix. */
  function horn(A, B) {
    var S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    A.forEach(function (a, k) { for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) S[i][j] += a[i] * B[k][j]; });
    var xx = S[0][0], xy = S[0][1], xz = S[0][2], yx = S[1][0], yy = S[1][1], yz = S[1][2], zx = S[2][0], zy = S[2][1], zz = S[2][2];
    var N = [[xx + yy + zz, yz - zy, zx - xz, xy - yx], [yz - zy, xx - yy - zz, xy + yx, zx + xz],
      [zx - xz, xy + yx, -xx + yy - zz, yz + zy], [xy - yx, zx + xz, yz + zy, -xx - yy + zz]];
    var sh = 3 * A.length, q = [1, 0.1, 0.2, 0.3];
    for (var it = 0; it < 120; it++) {
      var nq = [0, 0, 0, 0];
      for (var i = 0; i < 4; i++) { nq[i] = sh * q[i]; for (var j = 0; j < 4; j++) nq[i] += N[i][j] * q[j]; }
      var l = Math.hypot(nq[0], nq[1], nq[2], nq[3]) || 1;
      q = nq.map(function (v) { return v / l; });
    }
    return q;
  }
  function qrot(q, v) {
    var w = q[0], x = q[1], y = q[2], z = q[3];
    var tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
    return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
  }
  /**
   * Put molecule id on the turntable (lifting from its Lewis layout when lift is true), then draw its angle.
   * keepView: leave the turntable where the student turned it (switching molecules within a scene).
   */
  function showShape(tt, id, lift, done, keepView) {
    var m = alignDomains(model(id)), r = m.atoms[m.root];
    clearContent(tt);
    if (!keepView) tt.preset('start');
    tt.__shapeOf = r;
    if (tt.shapeOptions) tt.shapeOptions({ faces: !SOLID[r.shape] || SOLID[r.shape][1] });
    tt.setMolecule(m, { lones: 'inner', from: lift ? flatFrom(id) : null, ms: 1500, done: function () { arc(); if (done) done(); } });
    if (!lift) arc();
    function arc() {
      var nb = [];
      m.bonds.forEach(function (b) { if (b.a === m.root) nb.push(b.b); else if (b.b === m.root) nb.push(b.a); });
      if (nb.length < 2 || !tt.content) return;
      var best = null;
      for (var i = 0; i < nb.length; i++) for (var j = i + 1; j < nb.length; j++) {
        var va = Gm.v.sub(m.atoms[nb[i]].p, r.p), vb = Gm.v.sub(m.atoms[nb[j]].p, r.p), ang = Gm.v.angle(va, vb);
        if (!best || ang < best.ang - 0.5) best = { a: va, b: vb, ang: ang };
      }
      tt.angleArc(r.p, best.a, best.b, (Math.round(best.ang * 2) / 2) + '°');
    }
    tt.label('info', r.steric + ' domains → ' + r.shape, [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
    tt.label('ax', axe(r), [0, 0, 0], { cls: 'is-fixed-br', fixed: true, html: true });
    shapeLabel(tt);
    return m;
  }

  GuideShell.registerScene('vsepr', function (mount, beat) {
    var ids = (beat.dataset.mols || 'co2 bf3 ch4').split(/\s+/);
    if (beat.dataset.layout === 'gallery') return gallery(mount, ids);
    var root = h('div', 'scene scene-vsepr');
    var head = h('div', 'scene-head');
    var body = h('div', 'vs-body');
    var left = h('div', 'vs-lewis');
    left.appendChild(h('p', 'vs-cap', 'Lewis structure'));
    var lsv = K.svg('vs-lewis-svg');
    left.appendChild(lsv);
    var right = h('div', 'vs-3d');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    body.appendChild(left); body.appendChild(right);
    root.appendChild(head); root.appendChild(body); root.appendChild(foot);
    mount.appendChild(root);
    var tt = Turntable.create(right, {});
    var c = K.chips(ids.map(function (id) { return { id: id, label: formula(id) }; }), show, { label: 'Molecule' });
    head.appendChild(c.el);
    var replay = h('button', 'btn scene-chip-step', 'Lift again');
    replay.type = 'button';
    c.el.appendChild(replay);
    var vt = viewToggles(tt);
    vt.space.classList.add('is-next');
    c.el.appendChild(vt.space);
    vt.shape.classList.add('is-next');
    c.el.appendChild(vt.shape);
    var cur = ids[0];
    replay.addEventListener('click', function () { show(cur, true); });
    var shownOnce = false;
    function show(id, lift) {
      cur = id;
      c.set(id);
      DrawEngine.renderStatic(lsv, Kit.structure(id), { width: 280, height: 260, maxScale: 1 });
      // the first molecule (and Lift again) rises out of its Lewis drawing; switching keeps the view the student turned to
      lift = lift || !shownOnce;
      shownOnce = true;
      var m = showShape(tt, id, lift, null, !lift), r = m.atoms[m.root];
      var multiple = Kit.structure(id).bonds.some(function (b) { return b.order > 1 && (b.a === m.root || b.b === m.root); });
      foot.textContent = formula(id) + ': ' + domainText(m) + ' → ' + r.shape + ', ' + angleOf(m) + '°.' +
        (multiple ? ' A double or triple bond counts as one domain.' : '') + (r.lone ? ' Lone pairs (yellow lobes) take up room, so the bonds squeeze closer.' : '') + ' Drag the model to turn it.';
      foot.innerHTML = '';
      foot.appendChild(document.createTextNode(axeText(r) + ' · ' + formula(id) + ': ' + domainText(m) + ' → ' + r.shape + ', ' + angleOf(m) + '°.' +
        (multiple ? ' A double or triple bond counts as one domain.' : '') + (r.lone ? ' Lone pairs (yellow lobes) take up room, so the bonds squeeze closer.' : '') + ' Drag the model to turn it.'));
    }
    show(cur, true);
    return { settle: function () { tt.settle(); }, destroy: function () { tt.destroy(); } };
  });

  function gallery(mount, ids) {
    var root = h('div', 'scene scene-gallery');
    var body = h('div', 'gal-body');
    var grid = h('div', 'shape-grid');
    var view = h('div', 'vs-3d');
    body.appendChild(grid); body.appendChild(view);
    root.appendChild(body);
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(foot);
    mount.appendChild(root);
    var tt = Turntable.create(view, {}), galleryShown = false;
    var vt = viewToggles(tt), gbox = h('div', 'gal-space');
    gbox.appendChild(vt.space); gbox.appendChild(vt.shape);
    view.appendChild(gbox);
    function pick(id, card) {
      grid.querySelectorAll('.shape-card').forEach(function (x) { x.classList.toggle('is-on', x === card); x.setAttribute('aria-pressed', x === card ? 'true' : 'false'); });
      var m = showShape(tt, id, false, null, galleryShown), r = m.atoms[m.root];   // after the first card, the view stays where it was turned
      galleryShown = true;
      foot.textContent = formula(id) + ': ' + domainText(m) + '. The domains point to the corners of a ' + r.electronGeometry + '; the atoms alone make a ' + r.shape + ' shape. Drag to turn it.';
    }
    ids.forEach(function (id, n) {
      var m = model(id), r = m.atoms[m.root];
      var card = h('button', 'shape-card');
      card.type = 'button';
      var sv = K.svg('shape-card-svg');
      card.appendChild(sv);
      SV.render(sv, m, { width: 200, height: 130, angle: false, maxScale: 52 });
      card.appendChild(h('strong', null, r.shape));
      card.appendChild(h('span', null, formula(id) + ' · ' + r.steric + ' domains, ' + r.lone + ' lone'));
      card.addEventListener('click', function () { pick(id, card); });
      grid.appendChild(card);
      if (!n) pick(id, card);
    });
    return { settle: function () { tt.settle(); }, destroy: function () { tt.destroy(); } };
  }

  // =================================================================================================
  // Beat 22 · practice: name the shape
  // =================================================================================================
  var SHAPES = ['linear', 'bent', 'trigonal planar', 'trigonal pyramidal', 'tetrahedral', 'seesaw', 'T-shaped', 'trigonal bipyramidal', 'square planar', 'square pyramidal', 'octahedral'];
  GuideShell.registerScene('shape-practice', function (mount, beat) {
    var ids = (beat.dataset.mols || 'bf3 so2 pcl3 sf4 xef2').split(/\s+/);
    var memo = {};
    var root = h('div', 'scene scene-practice');
    var head = h('div', 'scene-head');
    root.appendChild(head);
    var body = h('div', 'practice-body');
    root.appendChild(body);
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(foot);
    mount.appendChild(root);
    // Left: the Lewis structure, then (on Show answer) the shape in 3D
    var left = h('div', 'practice-left');
    var lsv = K.svg('practice-svg');
    var l3d = h('div', 'practice-3d');
    var cap = h('p', 'practice-cap');
    left.appendChild(lsv); left.appendChild(l3d); left.appendChild(cap);
    var right = h('div', 'practice-right');
    body.appendChild(left); body.appendChild(right);
    var tt = null, shownId = null;
    var c = K.chips(ids.map(function (id) { return { id: id, label: formula(id) }; }), show, { label: 'Molecule' });
    head.appendChild(c.el);
    function stepper(label, get, set) {
      var w = h('div', 'stepper');
      w.appendChild(h('span', 'stepper-label', label));
      var minus = h('button', 'btn stepper-btn', '−'), val = h('span', 'stepper-val'), plus = h('button', 'btn stepper-btn', '+');
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', 'Fewer ' + label.toLowerCase());
      plus.setAttribute('aria-label', 'More ' + label.toLowerCase());
      function upd() { val.textContent = get() == null ? '?' : get(); }
      minus.addEventListener('click', function () { set(Math.max(0, (get() || 0) - 1)); upd(); });
      plus.addEventListener('click', function () { set(Math.min(6, (get() == null ? 0 : get()) + 1)); upd(); });
      w.appendChild(minus); w.appendChild(val); w.appendChild(plus);
      upd();
      return w;
    }
    function show(id) {
      c.set(id);
      var st = memo[id] = memo[id] || { bonding: null, lone: null, shape: null, open: false, solved: false };
      var m = model(id), r = m.atoms[m.root];
      // all three right → the Lewis structure lifts into the 3D shape
      function check() {
        if (st.open || st.bonding !== r.bonded || st.lone !== r.lone || st.shape !== r.shape) return;
        st.open = st.solved = true;
        show(id);
      }
      left.classList.toggle('is-open', st.open);
      if (st.open) {
        if (!tt) {
          tt = Turntable.create(l3d, {});
          var pvt = viewToggles(tt), pbox = h('div', 'gal-space');
          pbox.appendChild(pvt.space); pbox.appendChild(pvt.shape);
          l3d.appendChild(pbox);
        }
        if (shownId !== id) { showShape(tt, id, true); shownId = id; }
        cap.textContent = 'Shape · drag to turn';
      } else {
        DrawEngine.renderStatic(lsv, Kit.structure(id), { width: 340, height: 280, maxScale: 1 });
        shownId = null;
        cap.textContent = 'Lewis structure';
      }
      K.clear(right);
      right.appendChild(h('p', 'practice-q', '1 · Count around the central atom'));
      var steps = h('div', 'stepper-row');
      steps.appendChild(stepper('Bonding domains', function () { return st.bonding; }, function (v) { st.bonding = v; check(); }));
      steps.appendChild(stepper('Lone pairs', function () { return st.lone; }, function (v) { st.lone = v; check(); }));
      right.appendChild(steps);
      right.appendChild(h('p', 'practice-q', '2 · Choose the shape'));
      var grid = h('div', 'shape-choices');
      SHAPES.forEach(function (name) {
        var b = h('button', 'btn shape-choice', name);
        b.type = 'button';
        b.setAttribute('aria-pressed', st.shape === name ? 'true' : 'false');
        if (st.open && name === r.shape) b.classList.add('is-answer');
        if (st.solved && name === st.shape) b.classList.add('is-correct');
        b.addEventListener('click', function () { st.shape = name; show(id); check(); });
        grid.appendChild(b);
      });
      right.appendChild(grid);
      var ans = h('button', 'btn scene-chip-step', st.open ? (st.solved ? 'Back to the Lewis structure' : 'Hide answer') : 'Show answer');
      ans.type = 'button';
      ans.addEventListener('click', function () { st.open = !st.open; show(id); });
      right.appendChild(ans);
      foot.textContent = st.solved && st.open
        ? 'Correct! ' + formula(id) + ': ' + r.bonded + ' bonding + ' + r.lone + ' lone = ' + r.steric + ' domains → ' + r.shape + '. Drag the model to turn it.'
        : st.open
        ? formula(id) + ': ' + r.bonded + ' bonding + ' + r.lone + ' lone = ' + r.steric + ' domains → ' + r.shape + '.' +
          (st.shape ? ' You chose ' + st.shape + '.' : '')
        : 'Count the domains on the Lewis structure, then pick the shape. A double bond counts as one domain.';
    }
    show(ids[0]);
    return { settle: function () { if (tt) tt.settle(); }, destroy: function () { if (tt) tt.destroy(); } };
  });

  // =================================================================================================
  // Beat 23 · bond dipoles add up by shape
  // =================================================================================================
  /**
   * Drag (or arrow keys) to turn the 2D shape views like the 3D turntable: yaw follows x with a little
   * coast after release, tilt follows y within ±1.2 rad. pick(e) → the { yaw, tilt } view the pointer is on
   * (or null to ignore it); redraw(view) is called after each change.
   */
  function turnable(el, pick, redraw) {
    var cur = null, last = null, vYaw = 0, coast = null;
    el.classList.add('is-turnable');
    el.setAttribute('tabindex', '0');
    function stop() { if (coast) cancelAnimationFrame(coast); coast = null; vYaw = 0; }
    function down(e) {
      cur = pick(e);
      if (!cur) return;
      stop();
      last = { x: e.clientX, y: e.clientY };
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (!cur || !last) return;
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      cur.yaw += dx * 0.011;
      cur.tilt = Math.max(-1.2, Math.min(1.2, cur.tilt + dy * 0.008));
      vYaw = dx * 0.011 * 0.6;
      last = { x: e.clientX, y: e.clientY };
      redraw(cur);
    }
    function up() {
      if (!cur || !last) return;
      last = null;
      var v = cur;
      (function glide() {
        if (Math.abs(vYaw) < 0.0004) { coast = null; return; }
        v.yaw += vYaw; vYaw *= 0.93;
        redraw(v);
        coast = requestAnimationFrame(glide);
      })();
    }
    function key(e) {
      var v = pick(null);
      if (!v) return;
      var k = e.key;
      if (k === 'ArrowLeft') v.yaw -= 0.2; else if (k === 'ArrowRight') v.yaw += 0.2;
      else if (k === 'ArrowUp') v.tilt = Math.max(-1.2, v.tilt - 0.15); else if (k === 'ArrowDown') v.tilt = Math.min(1.2, v.tilt + 0.15);
      else return;
      e.preventDefault(); e.stopPropagation();
      stop();
      redraw(v);
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', key);
    return {
      stop: stop,
      destroy: function () {
        stop();
        el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('keydown', key);
      },
    };
  }
  function view0(v) { v = v || {}; v.yaw = 0; v.tilt = 0; return v; }

  /**
   * Bond dipoles fade in, then the sum plays out below; with breathe, the cloud keeps moving after (stop with .cancel).
   * view ({ yaw, tilt }) turns the molecule; .redraw() shows a new view at once.
   */
  function dipoleRun(sw, m, w, hh, done, breathe, view) {
    var o = { width: w, height: hh, sumBelow: true, angle: false, maxScale: 90, lones: 'centre', rot: view || null };
    var t0 = performance.now(), raf = null, dead = false, lastX = { dipoles: 0.001 };
    function with2(x) { lastX = x; var r = {}; for (var k in o) r[k] = o[k]; for (var k2 in x) r[k2] = x[k2]; r.tau = (performance.now() - t0) / 1000; return r; }
    var n = SV.render(sw, m, with2({ dipoles: 0.001 })).phases || 3;
    var seq = K.sequence([
      { ms: 600, run: function (t) { SV.render(sw, m, with2({ dipoles: t })); } },
      { ms: 500 },
      { ms: 1150 * n, run: function (t) { SV.render(sw, m, with2({ dipoles: 1, sum: t, net: true })); } },
    ], function () {
      // then the emptied panel gives its room back: the molecule grows into it (and, with breathe, keeps moving)
      var tEnd = performance.now();
      if (done) done();
      (function loop() {
        if (dead) return;
        var f = Math.min(1, (performance.now() - tEnd) / 900);
        SV.render(sw, m, with2({ dipoles: 1, sum: 1, net: true, focus: settled ? 1 : f }));
        raf = (breathe || (f < 1 && !settled)) ? requestAnimationFrame(loop) : null;
      })();
    });
    var settled = false;
    return {
      settle: function () { settled = true; seq.settle(); if (!dead && lastX.sum >= 1) SV.render(sw, m, with2({ dipoles: 1, sum: 1, net: true, focus: 1 })); },
      redraw: function () { if (!dead && !raf) SV.render(sw, m, with2(lastX)); },
      cancel: function () { dead = true; seq.cancel(); if (raf) cancelAnimationFrame(raf); },
    };
  }
  GuideShell.registerScene('polarity', function (mount, beat) {
    var ids = (beat.dataset.mols || 'co2 h2o bf3 nh3').split(/\s+/);
    var F = frame(mount, 'scene-polarity', '0 0 640 440');
    var anim = null, cur = ids[0], view = view0();
    var turn = turnable(F.svg, function () { return view; }, function () { if (anim) anim.redraw(); });
    var c = K.chips(ids.map(function (id) { return { id: id, label: formula(id) }; }), show, { label: 'Molecule' });
    F.head.appendChild(c.el);
    var replay = h('button', 'btn scene-chip-step', 'Add them again');
    replay.type = 'button';
    replay.addEventListener('click', function () { show(cur); });
    c.el.appendChild(replay);
    var sw = nested(F.svg, 0, 0, 640, 400);
    var label = s('g', {}, F.svg);
    function show(id) {
      cur = id;
      c.set(id);
      if (anim) anim.cancel();
      turn.stop();
      view0(view);
      var m = model(id);
      K.clear(label);
      F.foot.textContent = 'Each arrow points from δ+ toward δ− (its size follows ΔEN). Below, the pulls meet at one point: sideways parts cancel, same-way parts add, opposite parts cancel. What is left is the net dipole, which goes back onto the molecule, and the electron cloud shows where the electrons sit. Drag the molecule to turn it.';
      anim = dipoleRun(sw, m, 640, 360, function () {
        var d = Gm.dipole(m);
        K.clear(label);
        K.text(label, 320, 420, d.size > 0.05 ? 'net dipole → polar' : 'the pulls cancel → nonpolar', { 'font-size': 18, 'font-family': 'Space Mono, monospace', fill: '#4152d9' });
        F.foot.textContent = polarText(m, id) + ' Drag the molecule to turn it: the net dipole turns with it.';
      }, true, view);
    }
    show(cur);
    return { settle: function () { if (anim) anim.settle(); }, destroy: function () { if (anim) anim.cancel(); turn.destroy(); } };
  });

  // =================================================================================================
  // Beat 24 · what if…
  // =================================================================================================
  GuideShell.registerScene('what-if', function (mount) {
    var PAIRS = [
      { id: 'cl-h', from: 'ccl4', to: 'chcl3', label: 'Swap one Cl for H' },
      { id: 'bf-nh', from: 'bf3', to: 'nh3', label: 'BF₃ → NH₃' },
      { id: 'co-so', from: 'co2', to: 'so2', label: 'CO₂ → SO₂' },
    ];
    var F = frame(mount, 'scene-whatif', '0 0 720 400');
    var anim = null, memo = {}, lv = view0(), rv = view0(), drawL = null, drawR = null;
    var turn = turnable(F.svg, function (e) {
      if (!e) return lv;
      var r = F.svg.getBoundingClientRect();
      return (e.clientX - r.left) / r.width < 0.5 ? lv : rv;
    }, function (v) { var f = v === lv ? drawL : drawR; if (f) f(); });
    var c = K.chips(PAIRS.map(function (p) { return { id: p.id, label: p.label }; }), show, { label: 'Change' });
    F.head.appendChild(c.el);
    var ask = h('div', 'whatif-ask');
    F.root.insertBefore(ask, F.foot);
    function show(id) {
      c.set(id);
      if (anim) anim.cancel();
      anim = null;
      turn.stop();
      var p = PAIRS.filter(function (x) { return x.id === id; })[0], st = memo[id] = memo[id] || { guess: null, open: false };
      K.clear(F.svg);
      var a = model(p.from), b = model(p.to);
      var left = nested(F.svg, 0, 30, 320, 320), right = nested(F.svg, 400, 30, 320, 320);
      K.text(F.svg, 160, 18, formula(p.from) + ' · ' + (Gm.dipole(a).size > 0.05 ? 'polar' : 'nonpolar'), { 'font-size': 16, 'font-family': 'Space Mono, monospace' });
      if (show.last !== id) { view0(lv); view0(rv); show.last = id; }
      drawL = function () { SV.render(left, a, { width: 320, height: 320, dipoles: 1, sum: 1, net: true, sumBelow: true, angle: false, maxScale: 90, rot: lv, focus: 1 }); };
      drawL();
      s('path', { d: 'M335 190 L385 190 M373 178 L387 190 L373 202', stroke: '#4152d9', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, F.svg);
      K.text(F.svg, 560, 18, formula(p.to) + (st.open ? ' · ' + (Gm.dipole(b).size > 0.05 ? 'polar' : 'nonpolar') : ''), { 'font-size': 16, 'font-family': 'Space Mono, monospace' });
      if (st.open) {
        anim = dipoleRun(right, b, 320, 320, null, false, rv);
        drawR = function () { if (anim) anim.redraw(); };
      } else {
        drawR = function () { SV.render(right, b, { width: 320, height: 320, dipoles: 0.001, sumBelow: true, angle: false, maxScale: 70, faint: true, rot: rv }); };
        drawR();
        K.text(F.svg, 560, 190, '?', { 'font-size': 80, fill: '#4152d9' });
      }
      K.clear(ask);
      ask.appendChild(h('span', 'whatif-q', 'Predict ' + formula(p.to) + ':'));
      ['polar', 'nonpolar'].forEach(function (g) {
        var btn = h('button', 'btn scene-chip', g);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', st.guess === g ? 'true' : 'false');
        btn.addEventListener('click', function () { st.guess = g; show(id); });
        ask.appendChild(btn);
      });
      var see = h('button', 'btn scene-chip-step', st.open ? 'Hide' : 'Show me');
      see.type = 'button';
      see.addEventListener('click', function () { st.open = !st.open; show(id); });
      ask.appendChild(see);
      F.foot.textContent = st.open ? (st.guess ? 'You predicted ' + st.guess + '. ' : '') + polarText(b, p.to) + ' Drag either molecule to turn it.'
        : 'The left molecule is ' + (Gm.dipole(a).size > 0.05 ? 'polar' : 'nonpolar') + '. ' + p.label + ': what happens to the net dipole? Drag either molecule to turn it.';
    }
    show(PAIRS[0].id);
    return { settle: function () { if (anim) anim.settle(); }, destroy: function () { if (anim) anim.cancel(); turn.destroy(); } };
  });

  // =================================================================================================
  // Beat 25 · polarity sort
  // =================================================================================================
  GuideShell.registerScene('polarity-sort', function (mount, beat) {
    var ids = (beat.dataset.mols || 'co2 h2o nh3 ch4 bf3 chcl3 hcn so2 ccl4 xef4').split(/\s+/);
    var placed = {};
    var root = h('div', 'scene scene-sort');
    var tray = h('div', 'sort-tray');
    var cols = h('div', 'sort-cols');
    var foot = h('p', 'scene-readout', 'Choose polar or nonpolar for each molecule. The card flips to show how its bond dipoles add up.');
    root.appendChild(tray); root.appendChild(cols); root.appendChild(foot);
    mount.appendChild(root);
    var reset = h('button', 'btn scene-chip-step', 'Start again');
    reset.type = 'button';
    reset.addEventListener('click', function () { placed = {}; draw(); });
    var colEls = {};
    ['polar', 'nonpolar'].forEach(function (k) {
      var col = h('div', 'sort-col');
      col.appendChild(h('p', 'sort-col-head', k === 'polar' ? 'Polar' : 'Nonpolar'));
      var list = h('div', 'sort-list');
      col.appendChild(list);
      cols.appendChild(col);
      colEls[k] = list;
    });
    function draw() {
      K.clear(tray);
      K.clear(colEls.polar); K.clear(colEls.nonpolar);
      ids.forEach(function (id) {
        if (placed[id]) {
          var m = model(id), d = Gm.dipole(m), truth = d.size > 0.05 ? 'polar' : 'nonpolar';
          var card = h('div', 'sort-card is-flipped');
          var sv = K.svg('sort-svg');
          card.appendChild(sv);
          // the finished sum leaves only the net = 0 ring below a nonpolar molecule (the net arrow sits on a polar one), so keep little room
          var pol = d.size > 0.05;
          SV.render(sv, m, { width: 260, height: 190, dipoles: 1, sum: 1, net: true, sumBelow: true, sumRoom: pol ? 0 : 0.9, sumGap: 1.05,
            captions: false, deltas: false, angle: false, maxScale: 80 });
          var cap = h('p', 'sort-cap');
          cap.appendChild(h('strong', null, formula(id) + ' · ' + truth));
          cap.appendChild(h('span', null, (Kit.get(id).polar || [])[1] || ''));
          card.appendChild(cap);
          card.title = 'Click to put it back';
          card.addEventListener('click', function () { delete placed[id]; draw(); });
          colEls[placed[id]].appendChild(card);
        } else {
          var t = h('div', 'sort-chip');
          t.appendChild(h('strong', null, formula(id)));
          ['polar', 'nonpolar'].forEach(function (k) {
            var b = h('button', 'btn sort-btn', k);
            b.type = 'button';
            b.addEventListener('click', function () { placed[id] = k; draw(); });
            t.appendChild(b);
          });
          tray.appendChild(t);
        }
      });
      if (!tray.children.length) tray.appendChild(h('p', 'sort-done', 'All sorted. Compare each card’s label with the column you chose.'));
      tray.appendChild(reset);
    }
    draw();
    return {};
  });
})(window);
