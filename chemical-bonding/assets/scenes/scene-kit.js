/**
 * Small helpers shared by the guide scenes: DOM + SVG builders, chip rows, tweens that settle,
 * Lewis dot symbols, electron configurations and soft charge clouds.
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1d2433', POS = '#e8264f', NEG = '#ffc21a', NEUTRAL = '#cfd5e2';
  var Kit = global.BondingKit;

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function s(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svg(cls) { var n = s('svg', { class: cls || 'sk-svg', role: 'img' }); return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function text(parent, x, y, str, attrs) {
    var a = { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Space Grotesk, sans-serif', 'font-weight': 700, fill: INK };
    for (var k in attrs || {}) a[k] = attrs[k];
    var t = s('text', a, parent);
    t.textContent = str;
    return t;
  }

  /** A row of toggle chips. items: [{ id, label }]. Returns { el, set(id) }. */
  function chips(items, onPick, opts) {
    opts = opts || {};
    var row = h('div', 'scene-chips' + (opts.cls ? ' ' + opts.cls : ''));
    row.setAttribute('role', 'group');
    if (opts.label) row.setAttribute('aria-label', opts.label);
    var btns = {};
    items.forEach(function (it) {
      var b = h('button', 'btn scene-chip');
      b.type = 'button';
      b.innerHTML = it.html || '';
      if (!it.html) b.textContent = it.label;
      b.addEventListener('click', function () { set(it.id); onPick(it.id); });
      btns[it.id] = b;
      row.appendChild(b);
    });
    function set(id) { Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', k === String(id) ? 'true' : 'false'); }); }
    return { el: row, set: set, btns: btns };
  }

  /** Animation that can always be settled instantly: tween(ms, step(t 0..1), done) → { settle, cancel } */
  function tween(ms, step, done) {
    var t0 = performance.now(), live = true;
    function frame(now) {
      if (!live) return;
      var t = Math.min(1, (now - t0) / ms);
      step(t);
      if (t < 1) requestAnimationFrame(frame); else { live = false; if (done) done(); }
    }
    requestAnimationFrame(frame);
    return {
      settle: function () { if (!live) return; live = false; step(1); if (done) done(); },
      cancel: function () { live = false; },
      get live() { return live; },
    };
  }
  /** A chain of timed steps (each { ms, run(t) }), settle-able as a whole. */
  function sequence(steps, done) {
    var i = 0, cur = null, dead = false;
    function next() {
      if (dead) return;
      if (i >= steps.length) { if (done) done(); return; }
      var st = steps[i++];
      cur = tween(st.ms, st.run || function () {}, next);
    }
    next();
    return {
      settle: function () { if (dead) return; dead = true; if (cur) cur.cancel(); for (var k = i - 1; k < steps.length; k++) if (k >= 0 && steps[k].run) steps[k].run(1); if (done) done(); },
      cancel: function () { dead = true; if (cur) cur.cancel(); },
    };
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // --- Lewis dot symbols ---------------------------------------------------------------------------
  // Singles on four sides first (top, right, bottom, left), then pairs.
  function dotPositions(n) {
    var sides = [0, 0, 0, 0];
    for (var i = 0; i < n; i++) sides[i % 4] += 1;
    var out = [];
    var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (var k = 0; k < n; k++) {
      var side = k % 4, d = dirs[side], pair = sides[side] === 2, which = k < 4 ? 0 : 1;
      var px = -d[1], py = d[0], off = pair ? (which ? 1 : -1) : 0;
      out.push({ dx: d[0], dy: d[1], px: px * off, py: py * off });
    }
    return out;
  }
  /** Draw a dot symbol: returns the dot elements (in the order they are added). */
  function dotSymbol(g, x, y, el, n, k) {
    k = k || 1;
    text(g, x, y, el, { 'font-size': 34 * k });
    var R = (el.length > 1 ? 30 : 24) * k, sep = 6 * k;
    return dotPositions(n).map(function (p) {
      return s('circle', { cx: x + p.dx * R + p.px * sep, cy: y + p.dy * R + p.py * sep, r: 3.6 * k, fill: INK }, g);
    });
  }

  // --- Electron configuration (Z ≤ 20 plus the halogens we use) ----------------------------------
  var ORDER = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2], ['3d', 10], ['4p', 6], ['5s', 2], ['4d', 10], ['5p', 6]];
  var SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sup(n) { return String(n).split('').map(function (d) { return SUP[d]; }).join(''); }
  /** [{ sub: '2p', n: 4, valence: bool }] */
  function configuration(el) {
    var Z = Kit.ELEMENTS[el].Z, left = Z, out = [];
    ORDER.some(function (o) { if (left <= 0) return true; var n = Math.min(o[1], left); out.push({ sub: o[0], n: n }); left -= n; return false; });
    var top = Math.max.apply(null, out.map(function (o) { return +o.sub[0]; }));
    out.forEach(function (o) { o.valence = +o.sub[0] === top && /[sp]/.test(o.sub[1]); });
    return out;
  }

  // --- Charge clouds ---------------------------------------------------------------------------------
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return '#' + pa.map(function (v, i) { return ('0' + Math.round(v + (pb[i] - v) * t).toString(16)).slice(-2); }).join('');
  }
  /** Partial charge tint for a δ value (positive → red, negative → yellow). */
  function tint(q) {
    var f = Math.min(1, Math.abs(q) / 1.4);
    return q > 0 ? mix(NEUTRAL, POS, f * 0.85) : q < 0 ? mix(NEUTRAL, NEG, f) : NEUTRAL;
  }
  var cid = 0;
  /**
   * Soft cloud around atoms: atoms [{ x, y, r, q }], bonds [{ a, b, w }] (w: thickness, 0 = broken).
   * Each atom's blob takes its δ colour; bonds blend between the two.
   */
  function cloud(parent, atoms, bonds, opts) {
    opts = opts || {};
    var id = 'cl' + (++cid), live = opts.animate !== false;
    var defs = s('defs', {}, parent);
    var blur = opts.blur || 9;
    var f = s('filter', { id: id + 'f', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs);
    if (live) {
      // Drifting noise pushes the edges around: wisps that never settle
      var turb = s('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.013', numOctaves: 2, seed: (cid % 7) + 1, result: 'n' }, f);
      s('animate', { attributeName: 'baseFrequency', values: '0.011;0.017;0.012;0.011', dur: '9s', repeatCount: 'indefinite' }, turb);
      var disp = s('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: blur * 2.6, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
      s('animate', { attributeName: 'scale', values: [blur * 2, blur * 3.2, blur * 2].join(';'), dur: '5.5s', repeatCount: 'indefinite' }, disp);
      s('feGaussianBlur', { in: 'd', stdDeviation: blur }, f);
    } else {
      s('feGaussianBlur', { stdDeviation: blur }, f);
    }
    var g = s('g', { filter: 'url(#' + id + 'f)', opacity: opts.opacity == null ? 0.92 : opts.opacity }, parent);
    if (live) s('animate', { attributeName: 'opacity', values: '0.84;0.97;0.84', dur: '3.6s', repeatCount: 'indefinite' }, g);
    bonds.forEach(function (b, i) {
      if (!b.w) return;
      var A = atoms[b.a], B = atoms[b.b];
      var lg = s('linearGradient', { id: id + 'b' + i, gradientUnits: 'userSpaceOnUse', x1: A.x, y1: A.y, x2: B.x, y2: B.y }, defs);
      s('stop', { offset: '0%', 'stop-color': tint(A.q) }, lg);
      s('stop', { offset: '100%', 'stop-color': tint(B.q) }, lg);
      var ln = s('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: 'url(#' + id + 'b' + i + ')', 'stroke-width': b.w, 'stroke-linecap': 'round' }, g);
      if (live) s('animate', { attributeName: 'stroke-width', values: [b.w * 0.9, b.w * 1.08, b.w * 0.9].join(';'), dur: '3.1s', begin: '-' + (i * 0.7) + 's', repeatCount: 'indefinite' }, ln);
    });
    atoms.forEach(function (a, i) {
      var c = s('circle', { cx: a.x, cy: a.y, r: a.r, fill: tint(a.q) }, g);
      if (!live) return;
      // breathing, each atom slightly out of step
      s('animate', { attributeName: 'r', values: [a.r * 0.95, a.r * 1.07, a.r * 0.95].join(';'), dur: (2.6 + i * 0.45) + 's', begin: '-' + (i * 1.1) + 's', repeatCount: 'indefinite', calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' }, c);
      // bright patches of density swirling inside the cloud
      for (var k = 0; k < 2; k++) {
        var rr = a.r * (0.38 + 0.12 * k), orbit = a.r * (0.3 + 0.12 * k), dir = (i + k) % 2 ? 1 : 0;
        var spot = s('circle', { r: rr, fill: '#ffffff', opacity: 0.14 }, g);
        var path = 'M' + (a.x + orbit) + ' ' + a.y + ' A' + orbit + ' ' + (orbit * 0.75) + ' 0 1 ' + dir + ' ' + (a.x - orbit) + ' ' + a.y +
          ' A' + orbit + ' ' + (orbit * 0.75) + ' 0 1 ' + dir + ' ' + (a.x + orbit) + ' ' + a.y;
        s('animateMotion', { path: path, dur: (5 + k * 2.3 + i) + 's', begin: '-' + (k * 1.7 + i) + 's', repeatCount: 'indefinite' }, spot);
        s('animate', { attributeName: 'opacity', values: '0.04;0.2;0.04', dur: (3.3 + k) + 's', repeatCount: 'indefinite' }, spot);
      }
    });
    return g;
  }
  /** δ / charge pill */
  function pill(parent, x, y, str, kind) {
    var w = str.length * 10 + 16;
    var col = kind === 'pos' ? POS : kind === 'neg' ? '#b98a00' : INK;
    s('rect', { x: x - w / 2, y: y - 13, width: w, height: 26, rx: 13, fill: '#ffffff', stroke: col, 'stroke-width': 2 }, parent);
    text(parent, x, y + 0.5, str, { 'font-size': 15, fill: col });
  }

  function en(el) { return Kit.ELEMENTS[el].en; }
  function bondType(d) {
    return d < 0.4 ? 'nonpolar covalent' : d < 1.8 ? 'polar covalent' : 'ionic';
  }

  global.SceneKit = {
    INK: INK, POS: POS, NEG: NEG, NEUTRAL: NEUTRAL,
    h: h, s: s, svg: svg, clear: clear, text: text, chips: chips, tween: tween, sequence: sequence, ease: ease, easeOut: easeOut,
    dotSymbol: dotSymbol, dotPositions: dotPositions, configuration: configuration, sup: sup,
    cloud: cloud, tint: tint, mix: mix, pill: pill, en: en, bondType: bondType,
  };
})(window);
