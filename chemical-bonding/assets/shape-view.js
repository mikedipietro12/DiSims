/**
 * Chemical Bonding - 2D shape view (VSEPR wedge/dash drawings). Colour starts here.
 *
 *   ShapeView.render(svg, model, opts)
 *     model: Geometry.embed(...) result
 *     opts: { width, height, scale, from (2D lewis layout to blend from), t (0 lewis → 1 shape),
 *             lones: 'centre' | 'all' | false, angle: true | false, dipoles: 0..1 (fade in),
 *             sumRoom / sumGap (bond lengths kept below the molecule for the sum, and where its centre sits), captions: false,
 *             rot: { yaw, tilt } (turn the 3D shape about its centre; the fit then stays the same at any angle),
 *             sum: 0..1 (the pulls move to one centre point, split into parts along / across the net direction,
 *                  the sideways parts cancel, same-way parts add, opposite parts cancel), net: bool, deltas: bool, faint: bool }
 *   Returns also phases: how many steps the sum takes (give each ~900 ms)
 *   Returns { px(i) → [x, y], scale }
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1d2433', ACCENT = '#4152d9', POS = '#e8264f', NEG = '#c99a00';
  var POS_RGB = '232,38,79', NEG_RGB = '255,194,26', NEUTRAL_RGB = '150,160,200';   // the IMF unit's cloud colours
  var Gm = global.Geometry, V = Gm.v;
  var uid = 0;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function render(svg, m, opts) {
    opts = opts || {};
    var w = opts.width || 320, h = opts.height || 240;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var id = 'sv' + (++uid);
    var defs = el('defs', {}, svg);
    var seen = {};
    m.atoms.forEach(function (a) {
      if (seen[a.el]) return;
      seen[a.el] = true;
      var c = Gm.kit(a.el);
      var g = el('radialGradient', { id: id + a.el, cx: '35%', cy: '30%', r: '75%' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#ffffff' }, g);
      el('stop', { offset: '28%', 'stop-color': c[0] }, g);
      el('stop', { offset: '100%', 'stop-color': c[1] }, g);
    });

    var t = opts.t == null ? 1 : ease(Math.max(0, Math.min(1, opts.t)));
    // Positions: blend from the flat Lewis layout (y down) into the 3D shape
    var P = m.atoms.map(function (a, i) {
      if (!opts.from || t >= 1) return a.p;
      var f = opts.from[i];
      var flat = [f.x, -f.y, 0];
      return V.add(V.mul(flat, 1 - t), V.mul(a.p, t));
    });
    // Turn: the same rotation as the 3D turntable (yaw about the vertical, then tilt), about the atoms' centre
    var C = [0, 0, 0], RAD = 0, LN = m.atoms.map(function (a) { return a.lones; });
    if (opts.rot) {
      P.forEach(function (p) { C = V.add(C, p); });
      C = V.mul(C, 1 / P.length);
      var cyw = Math.cos(opts.rot.yaw || 0), syw = Math.sin(opts.rot.yaw || 0), ct = Math.cos(opts.rot.tilt || 0), stt = Math.sin(opts.rot.tilt || 0);
      var turn = function (v) {
        var x = v[0] * cyw + v[2] * syw, z = -v[0] * syw + v[2] * cyw;
        return [x, v[1] * ct - z * stt, v[1] * stt + z * ct];
      };
      P = P.map(function (p) { var d = V.sub(p, C); RAD = Math.max(RAD, V.len(d)); return V.add(C, turn(d)); });
      LN = m.atoms.map(function (a) { return a.lones.map(turn); });
    }
    // Fit
    var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    // room for the electron cloud (the turn fit already has spare room; lone-pair lobes reach further)
    var pad = opts.dipoles && opts.sumBelow ? (opts.rot ? 0.8 : 1.25 + (m.atoms[m.root].lones.length ? 0.3 : 0)) : 0.9;
    var sumRoom = opts.dipoles && opts.sumBelow ? (opts.sumRoom != null ? opts.sumRoom : 3.1) : 0;
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (opts.rot) { x0 = C[0] - RAD; x1 = C[0] + RAD; y0 = C[1] - RAD; y1 = C[1] + RAD; }   // room for any angle
    var spanX = x1 - x0 + pad * 2, spanY = y1 - y0 + pad * 2 + sumRoom;
    var S = opts.scale || Math.min(w / spanX, h / spanY, opts.maxScale || 90);
    var cx = w / 2 - (x1 + x0) / 2 * S;
    var cy = h / 2 + (y1 + y0) / 2 * S - sumRoom / 2 * S;
    function X(p) { return cx + p[0] * S; }
    function Y(p) { return cy - p[1] * S; }

    var cloudG = el('g', {}, svg);   // the molecule's electron cloud sits behind everything
    var root = el('g', { opacity: opts.faint ? 0.35 : 1 }, svg);
    var items = [];

    // Lone-pair lobes (fade in as the shape forms)
    var showL = opts.lones === undefined ? 'centre' : opts.lones;
    if (showL) m.atoms.forEach(function (a, i) {
      if (showL === 'centre' && i !== m.root) return;
      var dirs = LN[i].slice();
      // two lobes that would overlap on paper fan apart a little
      for (var p = 0; p < dirs.length; p++) for (var q = p + 1; q < dirs.length; q++) {
        var ap = Math.atan2(dirs[p][1], dirs[p][0]), aq = Math.atan2(dirs[q][1], dirs[q][0]);
        if (Math.abs(ap - aq) < 0.3 && Math.hypot(dirs[p][0], dirs[p][1]) > 0.3) {
          var mid = (ap + aq) / 2, rr = Math.hypot(dirs[p][0], dirs[p][1]);
          dirs[p] = [Math.cos(mid - 0.42) * rr, Math.sin(mid - 0.42) * rr, dirs[p][2]];
          dirs[q] = [Math.cos(mid + 0.42) * rr, Math.sin(mid + 0.42) * rr, dirs[q][2]];
        }
      }
      dirs.forEach(function (d) {
        items.push({ z: P[i][2] + d[2] * 0.6, draw: function (g) { lobe(g, P[i], d, a.r); } });
      });
    });
    function lobe(g, p, d, r) {
      var L = 1.0 * S, Wd = 0.3 * S;
      var dx = d[0], dy = -d[1], l2 = Math.hypot(dx, dy);
      var shrink = 0.55 + 0.45 * l2;          // a lobe pointing at the viewer looks shorter
      if (l2 < 1e-3) { dx = 0; dy = -1; } else { dx /= l2; dy /= l2; }
      var x0 = X(p), y0 = Y(p), px = -dy, py = dx, len = L * shrink;
      // balloon: narrow at the atom, a round end (semicircle) at the far side
      var cx = x0 + dx * (len - Wd), cy = y0 + dy * (len - Wd);
      var dpath = 'M' + x0 + ' ' + y0 +
        ' Q' + (x0 + dx * len * 0.45 + px * Wd * 0.75) + ' ' + (y0 + dy * len * 0.45 + py * Wd * 0.75) + ' ' + (cx + px * Wd) + ' ' + (cy + py * Wd) +
        ' A' + Wd + ' ' + Wd + ' 0 0 0 ' + (cx - px * Wd) + ' ' + (cy - py * Wd) +
        ' Q' + (x0 + dx * len * 0.45 - px * Wd * 0.75) + ' ' + (y0 + dy * len * 0.45 - py * Wd * 0.75) + ' ' + x0 + ' ' + y0 + 'Z';
      el('path', { d: dpath, fill: 'rgba(255,194,26,0.32)', stroke: 'rgba(201,154,0,0.85)', 'stroke-width': 1.5, opacity: t }, g);
      var s2 = 4.2;
      el('circle', { cx: cx + px * s2, cy: cy + py * s2, r: 3.2, fill: '#c99a00', opacity: t }, g);
      el('circle', { cx: cx - px * s2, cy: cy - py * s2, r: 3.2, fill: '#c99a00', opacity: t }, g);
    }

    // Bonds: wedge (toward viewer), hashed (away), plain line (in the page)
    m.bonds.forEach(function (b) {
      var A = P[b.a], B = P[b.b];
      items.push({ z: (A[2] + B[2]) / 2 - 0.01, draw: function (g) { bond(g, b, A, B); } });
    });
    function bond(g, b, A, B) {
      var x1 = X(A), y1 = Y(A), x2 = X(B), y2 = Y(B);
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, px = -uy, py = ux;
      var dz = (B[2] - A[2]) / (V.len(V.sub(B, A)) || 1);
      var flat = Math.abs(dz) < 0.46 || t < 0.5;
      if (flat) {
        for (var k = 0; k < b.order; k++) {
          var off = (k - (b.order - 1) / 2) * 6;
          el('line', { x1: x1 + px * off, y1: y1 + py * off, x2: x2 + px * off, y2: y2 + py * off, stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
        }
        return;
      }
      // narrow end at the atom nearer the page; solid wedge if the other end comes toward the viewer, hashed if it goes back
      var aNear = Math.abs(A[2]) <= Math.abs(B[2]);
      var nx = aNear ? x1 : x2, ny = aNear ? y1 : y2, fx = aNear ? x2 : x1, fy = aNear ? y2 : y1;
      var toward = (aNear ? B[2] - A[2] : A[2] - B[2]) > 0;
      var wide = 7.5;
      if (toward) {
        el('path', { d: 'M' + nx + ' ' + ny + ' L' + (fx + px * wide) + ' ' + (fy + py * wide) + ' L' + (fx - px * wide) + ' ' + (fy - py * wide) + 'Z', fill: INK }, g);
      } else {
        var n = 8;
        for (var j = 1; j <= n; j++) {
          var f = j / (n + 0.4), cx2 = nx + (fx - nx) * f, cy2 = ny + (fy - ny) * f, half = wide * f;
          el('line', { x1: cx2 + px * half, y1: cy2 + py * half, x2: cx2 - px * half, y2: cy2 - py * half, stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
        }
      }
    }

    // Atoms: model-kit spheres
    m.atoms.forEach(function (a, i) {
      items.push({ z: P[i][2] + 0.02, draw: function (g) {
        var r = a.r * S * 0.8 * (1 + P[i][2] * 0.06);
        el('circle', { cx: X(P[i]), cy: Y(P[i]), r: r, fill: 'url(#' + id + a.el + ')', stroke: INK, 'stroke-width': 2 }, g);
        var tx = el('text', { x: X(P[i]), y: Y(P[i]) + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-family': 'Space Grotesk, sans-serif', 'font-weight': 700, 'font-size': Math.max(11, Math.min(22, r * 0.95)),
          fill: a.el === 'C' ? '#ffffff' : INK }, g);
        tx.textContent = a.el;
      } });
    });

    items.sort(function (p, q) { return p.z - q.z; }).forEach(function (it) { it.draw(root); });
    var over = el('g', {}, svg);

    // Angle arc at the central atom (between the two flattest bonds)
    if (opts.angle && t > 0.9) {
      var r0 = m.root, nb = [];
      m.bonds.forEach(function (b) { if (b.a === r0) nb.push(b.b); else if (b.b === r0) nb.push(b.a); });
      if (nb.length >= 2) {
        var best = null;
        for (var p2 = 0; p2 < nb.length; p2++) for (var q2 = p2 + 1; q2 < nb.length; q2++) {
          var va = V.sub(P[nb[p2]], P[r0]), vb = V.sub(P[nb[q2]], P[r0]);
          var ang = V.angle(va, vb);
          var flatness = Math.abs(va[2]) + Math.abs(vb[2]) + (ang > 179 ? 0.2 : 0);
          var wantSmall = opts.angle === 'small' ? ang * 0.01 : 0;
          if (!best || flatness + wantSmall < best.f) best = { f: flatness + wantSmall, a: va, b: vb, ang: ang };
        }
        var a1 = Math.atan2(-best.a[1], best.a[0]), a2 = Math.atan2(-best.b[1], best.b[0]);
        var d = a2 - a1;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        if (best.ang > 179) d = Math.PI;   // straight: arc over the top
        var R = 0.62 * S, c0x = X(P[r0]), c0y = Y(P[r0]);
        var steps = 24, path = '';
        for (var s3 = 0; s3 <= steps; s3++) {
          var aa = a1 + d * s3 / steps;
          path += (s3 ? ' L' : 'M') + (c0x + Math.cos(aa) * R) + ' ' + (c0y + Math.sin(aa) * R);
        }
        el('path', { d: path, fill: 'none', stroke: ACCENT, 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }, over);
        var am = a1 + d / 2, lx = c0x + Math.cos(am) * (R + 22), ly = c0y + Math.sin(am) * (R + 18);
        var label = (Math.round(best.ang * 2) / 2).toString().replace(/\.0$/, '') + '°';
        var tw = label.length * 8.6 + 12;
        el('rect', { x: lx - tw / 2, y: ly - 11, width: tw, height: 22, rx: 11, fill: '#ffffff', stroke: ACCENT, 'stroke-width': 1.6 }, over);
        var lt = el('text', { x: lx, y: ly + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Space Mono, monospace', 'font-weight': 700, 'font-size': 13, fill: ACCENT }, over);
        lt.textContent = label;
      }
    }

    // Bond dipoles: cross-tailed arrows from δ+ toward δ−, and their sum
    var dip = null, phasesOut = 0;
    if (opts.dipoles) {
      dip = Gm.dipole({ atoms: m.atoms.map(function (a, i) { return { el: a.el, p: P[i] }; }), bonds: m.bonds });
      var fade = Math.max(0, Math.min(1, opts.dipoles));
      var sumT = Math.max(0, Math.min(1, opts.sum || 0));
      var lowY = opts.rot ? cy - y0 * S : Math.max.apply(null, P.map(function (p) { return Y(p); }));
      var O = opts.sumBelow ? [opts.rot ? X(C) : X(P[m.root]), lowY + (opts.sumGap || 1.75) * S] : [X(P[m.root]), Y(P[m.root])];
      var AR = 0.9 * S, PK = 0.95;   // arrow length per unit ΔEN on the bonds; the centre panel draws them a bit smaller
      var big = opts.captions !== false && (S >= 50 || w >= 500);
      // 1 · each bond dipole, drawn beside its bond (cross at δ+, head at δ−)
      var vecs = [];
      dip.bonds.forEach(function (bd) {
        if (!bd.mag) return;
        var A = P[bd.from], B = P[bd.to];
        var x1 = X(A), y1 = Y(A), x2 = X(B), y2 = Y(B);
        var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
        var alen = Math.max(18, Math.min(l * 0.9, bd.mag * AR));
        var mx = (x1 + x2) / 2 - ux * alen / 2 + -uy * 13, my = (y1 + y2) / 2 - uy * alen / 2 + ux * 13;
        vecs.push({ w: 2.2 + bd.mag * 1.6, tail: [mx, my], onBond: [ux * alen, uy * alen], d: [bd.v[0] * AR * PK, -bd.v[1] * AR * PK] });
      });
      // the centre panel shows directions at one size: the longest pull is always ~1 S (proportions kept)
      var longest = Math.max.apply(null, vecs.map(function (v) { return Math.hypot(v.d[0], v.d[1]); }).concat([1]));
      vecs.forEach(function (v) { v.d = [v.d[0] * S / longest, v.d[1] * S / longest]; });
      vecs.forEach(function (v) {
        arrow(over, v.tail[0], v.tail[1], v.tail[0] + v.onBond[0], v.tail[1] + v.onBond[1], v.w, sumT > 0 ? fade * 0.22 : fade, true);
      });
      // 2 · the sum, at one centre point: split each pull along the net direction and across it
      var N = vecs.reduce(function (acc, v) { return [acc[0] + v.d[0], acc[1] + v.d[1]]; }, [0, 0]);
      var nl = Math.hypot(N[0], N[1]), axis;
      if (nl > 3) axis = [N[0] / nl, N[1] / nl];
      else {   // no net pull: line up with the biggest arrow
        var bigV = vecs.reduce(function (b2, v) { return !b2 || Math.hypot(v.d[0], v.d[1]) > Math.hypot(b2.d[0], b2.d[1]) + 0.5 ? v : b2; }, null);
        var bl = bigV ? Math.hypot(bigV.d[0], bigV.d[1]) || 1 : 1;
        axis = bigV ? [bigV.d[0] / bl, bigV.d[1] / bl] : [1, 0];
      }
      var perpAx = [-axis[1], axis[0]];
      var side = { pos: [], neg: [] };
      vecs.forEach(function (v) {
        v.par = v.d[0] * axis[0] + v.d[1] * axis[1];
        v.perp = [v.d[0] - v.par * axis[0], v.d[1] - v.par * axis[1]];
        if (v.par > 2) side.pos.push(v); else if (v.par < -2) side.neg.push(v);
      });
      ['pos', 'neg'].forEach(function (k) {   // same-side parts sit a few px apart until they stack
        var L = side[k];
        L.forEach(function (v, i) { v.off = (i - (L.length - 1) / 2) * 9; });
      });
      var tot = { pos: side.pos.reduce(function (n2, v) { return n2 + v.par; }, 0), neg: -side.neg.reduce(function (n2, v) { return n2 + v.par; }, 0) };
      var hasPerp = vecs.some(function (v) { return Math.hypot(v.perp[0], v.perp[1]) > 2; });
      var hasStack = side.pos.length > 1 || side.neg.length > 1;
      var hasTug = tot.pos > 2 && tot.neg > 2;
      var phases = ['slide'];
      if (hasPerp) phases.push('split', 'across');
      if (hasStack) phases.push('stack');
      if (hasTug) phases.push('tug');
      phases.push('net');
      var polarNet = dip.size > 0.05;
      if (polarNet) phases.push('up');   // the net arrow slides back up onto the molecule
      phases.push('cloud');              // then the electron cloud shows where the electrons sit
      phasesOut = phases.length;
      var ph = Math.min(phases.length - 1, Math.floor(sumT * phases.length)), pt = sumT >= 1 ? 1 : sumT * phases.length - ph;
      var e = ease(Math.min(1, pt / 0.75));    // move during the first ¾ of each phase, then hold
      var at = sumT >= 1 ? phases.length : ph;
      function done(name) { var i = phases.indexOf(name); return i >= 0 && i < at; }
      function now(name) { return phases[ph] === name && sumT < 1; }
      var CAP = { slide: 'move each pull to the centre', split: 'split each pull into two parts', across: 'the sideways parts cancel',
        stack: 'pulls the same way add up', tug: 'opposite pulls cancel', net: '',
        up: 'the net dipole points to the δ− end', cloud: polarNet ? 'the electron cloud leans to the δ− end' : 'the electron cloud stays even' };
      if (sumT > 0) {
        if (big) {
          el('circle', { cx: O[0], cy: O[1], r: 3.5, fill: '#5b6474' }, over);
          var cap = sumT >= 1 ? CAP.cloud : CAP[phases[ph]];
          // caption just under the lowest thing the panel can draw
          var down = Math.max(0.3 * S, tot.pos * axis[1], -tot.neg * axis[1]);
          vecs.forEach(function (v) { down = Math.max(down, v.d[1], v.par * axis[1] + v.perp[1]); });
          if (cap) {
            var ct = el('text', { x: O[0], y: Math.min(h - 12, O[1] + down + 26), 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Space Mono, monospace', 'font-size': 14, 'font-weight': 700, fill: '#5b6474' }, over);
            ct.textContent = cap;
          }
        }
        var ink = INK, partCol = '#8a93a6';
        if (phases[ph] === 'slide' && sumT < 1) {
          // the arrows keep their direction and slide so every tail sits on the centre point
          vecs.forEach(function (v) {
            // straight down first, then sideways in to the centre
            var e1 = ease(Math.min(1, pt / 0.4)), e2 = ease(Math.max(0, Math.min(1, (pt - 0.4) / 0.4)));
            var tx = v.tail[0] + (O[0] - v.tail[0]) * e2, ty = v.tail[1] + (O[1] - v.tail[1]) * e1;
            var vx = v.onBond[0] + (v.d[0] - v.onBond[0]) * e1, vy = v.onBond[1] + (v.d[1] - v.onBond[1]) * e1;
            arrow(over, tx, ty, tx + vx, ty + vy, v.w, 1, true);
          });
        } else {
          var splitE = done('split') ? 1 : now('split') ? e : 0;
          var acrossE = done('across') ? 1 : now('across') ? e : 0;
          var stackE = done('stack') ? 1 : now('stack') ? e : 0;
          var tugE = done('tug') ? 1 : now('tug') ? e : 0;
          var netE = sumT >= 1 || done('net') ? 1 : now('net') ? e : 0;
          var upE = sumT >= 1 || done('up') ? 1 : now('up') ? e : 0;
          var cloudE = sumT >= 1 ? 1 : now('cloud') ? e : 0;
          // whole pulls fade back as their parts appear
          if (!hasPerp || splitE < 1) vecs.forEach(function (v) { arrow(over, O[0], O[1], O[0] + v.d[0], O[1] + v.d[1], v.w, hasPerp ? 1 - 0.8 * splitE : (stackE > 0 || tugE > 0 ? 0 : 1), true); });
          else if (acrossE < 1) vecs.forEach(function (v) { arrow(over, O[0], O[1], O[0] + v.d[0], O[1] + v.d[1], v.w, 0.2 * (1 - acrossE), true); });
          var shown = hasPerp ? splitE : 1;
          if (hasPerp ? splitE > 0 : true) {
            // sideways parts: from the tip of each along-the-line part, shrinking away together
            if (hasPerp && acrossE < 1) vecs.forEach(function (v) {
              if (Math.hypot(v.perp[0], v.perp[1]) <= 2) return;
              var bx = O[0] + axis[0] * v.par + perpAx[0] * v.off, by = O[1] + axis[1] * v.par + perpAx[1] * v.off;
              var k2 = 1 - acrossE;
              arrow(over, bx, by, bx + v.perp[0] * k2, by + v.perp[1] * k2, 2.4, shown * (acrossE > 0.6 ? (1 - acrossE) / 0.4 : 1), false, partCol, true);
            });
            // along-the-line parts: side by side, then tip to tail, then the two sides cancel
            if (netE < 1 || dip.size <= 0.05) ['pos', 'neg'].forEach(function (k) {
              var sgn = k === 'pos' ? 1 : -1, run = 0, L = side[k];
              var cut = hasTug ? Math.min(tot.pos, tot.neg) * tugE : 0;
              if (hasStack && stackE < 1) L.forEach(function (v) {
                var a0 = run * stackE, len = Math.abs(v.par), off = v.off * (1 - stackE);
                var x0 = O[0] + axis[0] * sgn * a0 + perpAx[0] * off, y0 = O[1] + axis[1] * sgn * a0 + perpAx[1] * off;
                arrow(over, x0, y0, x0 + axis[0] * sgn * len, y0 + axis[1] * sgn * len, v.w, shown, false, ink);
                run += len;
              });
              else {
                var len2 = tot[k] - cut;
                if (len2 > 2) arrow(over, O[0], O[1], O[0] + axis[0] * sgn * len2, O[1] + axis[1] * sgn * len2, Math.max.apply(null, L.map(function (v) { return v.w; })), 1, false, ink);
              }
            });
          }
          // what is left: the net dipole (blue), or nothing at all
          if (netE > 0) {
            if (dip.size > 0.05) {
              var nlen = Math.abs(tot.pos - tot.neg), ns = tot.pos >= tot.neg ? 1 : -1;
              // up: the arrow rides back to the molecule and sits across its centre (cross at the δ+ end)
              var mcx = 0, mcy = 0;
              P.forEach(function (p) { mcx += X(p); mcy += Y(p); });
              mcx /= P.length; mcy /= P.length;
              // on the molecule it keeps one readable size, shortened only when it points out of the page
              var face = Math.hypot(dip.net[0], dip.net[1]) / (dip.size || 1);
              var nL = upE > 0 ? Math.max(nlen, 1.1 * S) * face * upE + nlen * (1 - upE) : nlen;
              var tx0 = O[0] + (mcx - axis[0] * ns * nL / 2 - O[0]) * upE, ty0 = O[1] + (mcy - axis[1] * ns * nL / 2 - O[1]) * upE;
              arrow(over, tx0, ty0, tx0 + axis[0] * ns * nL, ty0 + axis[1] * ns * nL, 5, netE, upE > 0.5, ACCENT);
            } else {
              el('circle', { cx: O[0], cy: O[1], r: 0.3 * S * (0.6 + 0.4 * netE), fill: 'none', stroke: ACCENT, 'stroke-width': 2.4, 'stroke-dasharray': '6 5', opacity: netE }, over);
              if (big) { var zl = el('text', { x: O[0] + 0.42 * S, y: O[1], 'dominant-baseline': 'central', 'font-family': 'Space Mono, monospace', 'font-size': 14, 'font-weight': 700, fill: ACCENT, opacity: netE }, over);
                zl.textContent = 'net = 0'; }
            }
          }
        }
      }
      if (sumT > 0 && (sumT >= 1 || phases.indexOf('cloud') <= ph)) cloud(cloudG, sumT >= 1 ? 1 : (phases[ph] === 'cloud' ? ease(Math.min(1, pt / 0.75)) : 0));
      if (opts.deltas !== false) {
        var q = {};
        dip.bonds.forEach(function (bd) { if (bd.mag) { q[bd.from] = (q[bd.from] || 0) + 1; q[bd.to] = (q[bd.to] || 0) - 1; } });
        Object.keys(q).forEach(function (k) {
          if (!q[k]) return;
          var i = +k, a = m.atoms[i], p = P[i], up = (i === m.root) ? -1 : 1;
          var d2 = V.sub(p, P[m.root]), dl = Math.hypot(d2[0], d2[1]);
          var dir = i === m.root ? [0, 1] : dl > 0.15 ? [d2[0] / dl, d2[1] / dl] : [0.7, 0.7];
          var lx = X(p) + (i === m.root ? -a.r * S - 14 : dir[0] * (a.r * S + 16)), ly = Y(p) + (i === m.root ? -a.r * S - 6 : -dir[1] * (a.r * S + 16));
          var tx = el('text', { x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Space Grotesk, sans-serif',
            'font-weight': 700, 'font-size': 16, fill: q[k] > 0 ? POS : NEG, opacity: fade }, over);
          tx.textContent = q[k] > 0 ? 'δ+' : 'δ−';
        });
      }
    }
    // --- Electron cloud, IMF style: one soft cloud per molecule in nested layers, δ− (yellow) → δ+ (red);
    //     a teardrop, or a union of lobes when the central atom has lone pairs; nonpolar = even grey.
    function cloud(g, alpha) {
      if (alpha <= 0) return;
      var tau = opts.tau || 0, pad = 0.42 * S, polar = dip.size > 0.05;
      var W = m.atoms.map(function (a, i) { return { x: X(P[i]), y: Y(P[i]), r: a.r * S * 0.8 }; });
      var q = {};
      dip.bonds.forEach(function (bd) { if (bd.mag) { q[bd.from] = (q[bd.from] || 0) + 1; q[bd.to] = (q[bd.to] || 0) - 1; } });
      var cx = 0, cy = 0;
      W.forEach(function (w) { cx += w.x; cy += w.y; });
      cx /= W.length; cy /= W.length;
      var f = null;
      if (polar) {   // axis from the electron-rich atoms toward the electron-poor ones
        var r = [0, 0, 0], p2 = [0, 0, 0];
        W.forEach(function (w, i) { var A = (q[i] || 0) < 0 || (i === m.root && m.atoms[i].lones.length) ? r : (q[i] || 0) > 0 ? p2 : null; if (A) { A[0] += w.x; A[1] += w.y; A[2]++; } });
        if (r[2] && p2[2]) {
          var dx = p2[0] / p2[2] - r[0] / r[2], dy = p2[1] / p2[2] - r[1] / r[2], d = Math.hypot(dx, dy);
          // seen end-on the lean fades out (the cloud looks round, its colours mixed)
          var sk0 = Math.min(1, d / (0.6 * S));
          f = d > 3 ? { x: r[0] / r[2], y: r[1] / r[2], ux: dx / d, uy: dy / d, skew: sk0 } : { x: cx, y: cy, ux: 1, uy: 0, skew: 0 };
        }
      }
      if (!f) {   // nonpolar: even, along the long axis if there is one
        var sxx = 0, syy = 0, sxy = 0;
        W.forEach(function (w) { sxx += (w.x - cx) * (w.x - cx); syy += (w.y - cy) * (w.y - cy); sxy += (w.x - cx) * (w.y - cy); });
        var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
        f = { x: cx, y: cy, ux: Math.cos(th), uy: Math.sin(th), skew: 0 };
      }
      var neg = polar ? NEG_RGB : NEUTRAL_RGB, pos = polar ? POS_RGB : NEUTRAL_RGB;
      if (polar && f.skew < 1) {
        var mixc = function (a, b, k) { a = a.split(',').map(Number); b = b.split(',').map(Number); return a.map(function (v, j) { return Math.round(v + (b[j] - v) * k); }).join(','); };
        var midc = mixc(neg, pos, 0.5);
        neg = mixc(neg, midc, 1 - f.skew); pos = mixc(pos, midc, 1 - f.skew);
      }
      var lones = polar ? LN[m.root] : [];
      var Nn = 64, rad = [], back = 0, tip = 0, ux = f.ux, uy = f.uy, ox, oy;
      var breathe = 1 + 0.04 * Math.sin(tau * 1.4);
      if (lones.length) {
        // lobes: one per atom (the lone-pair atom stays a small core) and a fat one per lone pair
        var lp = pad * 1.7;   // ball-and-stick bonds are long, so the lobes are plumper than the IMF space-filling ones
        var lobes = W.map(function (w, i) { return { x: w.x, y: w.y, r: w.r + lp * (i === m.root ? 0.3 : 0.45) }; });
        var R0 = W[m.root];
        lones.forEach(function (dd) {
          var lx = dd[0], ly = -dd[1], l2 = Math.hypot(lx, ly) || 1, reach = (0.62 + 0.25 * Math.min(1, l2)) * S;
          lobes.push({ x: R0.x + lx / l2 * reach, y: R0.y + ly / l2 * reach, r: 0.3 * S + lp * 0.45 });
        });
        ox = f.x; oy = f.y;
        var K = 3 / S;
        for (var i = 0; i < Nn; i++) {
          var t = i / Nn * Math.PI * 2, dx2 = ux * Math.cos(t) - uy * Math.sin(t), dy2 = ux * Math.sin(t) + uy * Math.cos(t), sum = 0;
          lobes.forEach(function (L2) {
            var px = L2.x - ox, py = L2.y - oy, along = px * dx2 + py * dy2, perp = Math.abs(px * dy2 - py * dx2);
            var reach2 = perp < L2.r ? along + Math.sqrt(L2.r * L2.r - perp * perp) : along - (perp - L2.r) * 1.5;
            sum += Math.exp(K * reach2);
          });
          var bulb = (1 - Math.cos(t)) / 2;
          var wob = 1 + (0.4 + 0.6 * bulb) * (0.05 * Math.sin(2 * t + tau * 1.7) + 0.035 * Math.sin(3 * t - tau * 2.3));
          rad[i] = Math.max(0, Math.log(sum) / K) * wob * breathe;
          tip = Math.max(tip, rad[i] * Math.cos(t)); back = Math.max(back, -rad[i] * Math.cos(t));
        }
      } else {
        // teardrop: a fat bulb at the electron-rich end tapering past the poor end (an even ellipse when nonpolar)
        var sk = f.skew, r0 = 1 - 0.65 * sk, bk = 0, tp = 0, reachS = 0;
        W.forEach(function (w) {
          var a2 = (w.x - f.x) * ux + (w.y - f.y) * uy;
          bk = Math.max(bk, w.r - a2); tp = Math.max(tp, w.r + a2);
          reachS = Math.max(reachS, w.r + Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy));
        });
        bk += pad * (0.6 + 0.2 * sk); reachS += pad * (0.6 + 0.2 * sk); tp += pad * (0.6 - 0.35 * sk);
        var half = (bk + tp) / 2, mid = (tp - bk) / 2;
        function prof(t2) { return Math.sin(t2) * (r0 + (1 - r0) * Math.sin(t2 / 2)); }
        var peak = 0;
        for (var k2 = 1; k2 < 32; k2++) peak = Math.max(peak, prof(k2 / 32 * Math.PI));
        var wide = reachS / peak;
        W.forEach(function (w) {
          var a3 = (w.x - f.x) * ux + (w.y - f.y) * uy, b3 = Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy);
          var t3 = Math.acos(Math.max(-1, Math.min(1, (a3 - mid) / half)));
          wide = Math.max(wide, (b3 + w.r + pad * 0.3) / Math.max(0.3, prof(t3)));
        });
        ox = f.x; oy = f.y;
        // store as polar radii about the frame origin so both shapes share the layer code
        for (var i2 = 0; i2 < Nn; i2++) {
          var t4 = i2 / Nn * Math.PI * 2, bulb2 = (1 - Math.cos(t4)) / 2;
          var wob2 = 1 + (0.4 + 0.6 * bulb2) * (0.06 * Math.sin(2 * t4 + tau * 1.7) + 0.04 * Math.sin(3 * t4 - tau * 2.3));
          rad[i2] = { along: (mid + half * Math.cos(t4)) * wob2, side: wide * prof(t4) * wob2 * breathe };
        }
        back = bk; tip = tp;
      }
      var gid = id + 'cl';
      var defs2 = el('defs', {}, g);
      var lg = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1: ox - ux * back, y1: oy - uy * back, x2: ox + ux * tip, y2: oy + uy * tip }, defs2);
      [[0, neg], [0.45, neg], [0.72, pos], [1, pos]].forEach(function (st) { el('stop', { offset: st[0], 'stop-color': 'rgb(' + st[1] + ')' }, lg); });
      var LAYERS = 14;
      for (var li = 0; li < LAYERS; li++) {
        var sc = 1 - li * 0.05, d3 = '';
        for (var k3 = 0; k3 < Nn; k3++) {
          var x, y;
          if (typeof rad[k3] === 'number') {
            var a4 = k3 / Nn * Math.PI * 2, ddx = ux * Math.cos(a4) - uy * Math.sin(a4), ddy = ux * Math.sin(a4) + uy * Math.cos(a4);
            x = ox + ddx * rad[k3] * sc; y = oy + ddy * rad[k3] * sc;
          } else {
            x = ox + ux * rad[k3].along * sc - uy * rad[k3].side * sc; y = oy + uy * rad[k3].along * sc + ux * rad[k3].side * sc;
          }
          d3 += (k3 ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        el('path', { d: d3 + 'Z', fill: 'url(#' + gid + ')', opacity: (0.085 * alpha).toFixed(3) }, g);
      }
    }
    function arrow(g, x1, y1, x2, y2, wdt, op, crossTail, colour, dashed) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy);
      if (l < 4 || op <= 0) return;
      var ux = dx / l, uy = dy / l, px = -uy, py = ux, hd = Math.min(7 + wdt * 1.6, l * 0.6);
      colour = colour || INK;
      el('line', { x1: x1, y1: y1, x2: x2 - ux * hd * 0.8, y2: y2 - uy * hd * 0.8, stroke: colour, 'stroke-width': wdt, 'stroke-linecap': 'round', opacity: op, 'stroke-dasharray': dashed ? '6 5' : null }, g);
      el('path', { d: 'M' + x2 + ' ' + y2 + ' L' + (x2 - ux * hd + px * hd * 0.55) + ' ' + (y2 - uy * hd + py * hd * 0.55) + ' L' + (x2 - ux * hd - px * hd * 0.55) + ' ' + (y2 - uy * hd - py * hd * 0.55) + 'Z', fill: colour, opacity: op }, g);
      if (crossTail) {
        var cx2 = x1 + ux * 7, cy2 = y1 + uy * 7;
        el('line', { x1: cx2 + px * 6, y1: cy2 + py * 6, x2: cx2 - px * 6, y2: cy2 - py * 6, stroke: colour, 'stroke-width': wdt * 0.9, 'stroke-linecap': 'round', opacity: op }, g);
      }
    }
    return { scale: S, px: function (i) { return [X(P[i]), Y(P[i])]; }, dipole: dip, phases: dip ? phasesOut : 0 };
  }

  global.ShapeView = { render: render };
})(window);
