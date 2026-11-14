/**
 * Chapter C scenes: hybridization (3D arrives here).
 *   orbitals         carbon’s orbital boxes + CH₄ in 3D: ground → promote → the angles do not fit → combine (beat 26)
 *   hybrid           data-hyb="sp3": two sp³ carbons overlap (C–C σ), then H 1s overlaps (C–H σ);
 *                    "sp2|sp": boxes + 3D orbitals → the molecule with σ and π (beats 27–29)
 *   pattern          domains ↔ hybridization ↔ angle table (beat 30)
 *   label-carbons    click each carbon to label it; show answer (beat 31)
 *   lift             draw, then lift the drawing into 3D beside it (beat 32)
 *   which-picture    Lewis vs 3D: what each shows and hides; on to IMF (beat 33)
 */
(function (global) {
  'use strict';
  var K = global.SceneKit, Kit = global.BondingKit, Gm = global.Geometry, SV = global.ShapeView, L = global.LewisModel, h = K.h, s = K.s;
  var BLUE = 0x4152d9, GREY = 0x9aa3b5;
  // Orbital colours, the same everywhere in this chapter (and in the boxes and the key):
  //   hybrid (sp³, sp², sp) yellow · carbon's unhybridized 2s / 2p faded blue · other atoms' orbitals (H 1s) grey.
  //   An overlap takes a deeper shade of what overlaps: σ from hybrids deep yellow, π from p orbitals deeper blue.
  var HYB_Y = 0xffb300, HYB_DEEP = 0xf08c00, UNH = 0x8f9cf5, UNH_DEEP = 0x5d6de0;
  var BOX_HYB = '#ffeeb3', BOX_UNH = '#e9ecff';
  /** The colour key in a 3D view: [[label, css colour], …]. */
  function orbitalKey(view, items) {
    var k = h('div', 'orb-key');
    items.forEach(function (it) {
      var row = h('span', 'orb-key-row');
      var sw = h('i', 'orb-key-sw');
      sw.style.background = it[1];
      row.appendChild(sw);
      row.appendChild(document.createTextNode(it[0]));
      k.appendChild(row);
    });
    view.appendChild(k);
    return k;
  }
  var KEY_HYB = ['hybrid orbital', '#ffc94d'], KEY_UNH = ['unhybridized (2s, 2p)', '#b3bcfa'], KEY_H = ['H 1s', '#c3c9d6'];

  function model(id) {
    var m = Gm.embed(Kit.structure(id), Kit.get(id).center != null ? { root: Kit.get(id).center } : {});
    if (Kit.get(id).center == null) Gm.level(m);
    return m;
  }

  // --- Orbital boxes ---------------------------------------------------------------------------------
  var HYB = {
    sp3: { n: 4, label: 'sp³', p: 0, angle: '109.5°', mol: 'c2h6', name: 'ethane' },
    sp2: { n: 3, label: 'sp²', p: 1, angle: '120°', mol: 'c2h4', name: 'ethene' },
    sp:  { n: 2, label: 'sp',  p: 2, angle: '180°', mol: 'c2h2', name: 'ethyne' },
  };
  /** stage: 'ground' | 'promote' | 'hybrid'; t blends from the previous stage. */
  function boxes(svg, kind, stage, t, title) {
    K.clear(svg);
    svg.setAttribute('viewBox', '0 0 340 340');
    var e = K.ease(t == null ? 1 : t);
    s('path', { d: 'M28 300 L28 30 M20 42 L28 28 L36 42', stroke: '#5b6474', 'stroke-width': 2, fill: 'none' }, svg);
    K.text(svg, 16, 170, 'energy', { 'font-size': 12, 'font-family': 'Space Mono, monospace', fill: '#5b6474', transform: 'rotate(-90 16 170)' });
    K.text(svg, 190, 330, '(1s² is not shown: it stays put)', { 'font-size': 12, fill: '#5b6474', 'font-weight': 400 });
    var B = 40;
    function box(x, y, lab, up, down, op, hl) {
      var g = s('g', { opacity: op }, svg);
      s('rect', { x: x, y: y, width: B, height: B, rx: 6, fill: hl ? BOX_HYB : BOX_UNH, stroke: '#1d2433', 'stroke-width': 2 }, g);
      K.text(g, x + B / 2, y + B + 15, lab, { 'font-size': 15 });
      if (up) arrow(g, x + (down ? B * 0.33 : B / 2), y, true);
      if (down) arrow(g, x + B * 0.67, y, false);
      return g;
    }
    function arrow(g, x, y, up) {
      var y1 = y + B - 7, y2 = y + 7;
      if (!up) { var tmp = y1; y1 = y2; y2 = tmp; }
      var hy = y2 + (up ? 8 : -8);
      s('path', { d: 'M' + x + ' ' + y1 + ' L' + x + ' ' + y2 + ' M' + (x - 5.5) + ' ' + hy + ' L' + x + ' ' + y2 + ' L' + (x + 5.5) + ' ' + hy, stroke: '#4152d9', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    }
    var sx = 70, sy = 236, px = [160, 210, 260], py = 96;
    if (stage === 'ground' || stage === 'promote') {
      var moved = stage === 'promote' ? e : 0;
      box(sx, sy, '2s', true, moved < 0.5, 1);
      box(px[0], py, '2p', true, false, 1);
      box(px[1], py, '2p', true, false, 1);
      box(px[2], py, '2p', moved >= 1, false, 1);
      if (stage === 'promote' && moved > 0 && moved < 1) {
        var ax = sx + B * 0.67 + (px[2] + B / 2 - sx - B * 0.67) * moved, ay = sy + (py - sy) * moved;
        arrow(s('g', {}, svg), ax, ay, moved > 0.5);
      }
      K.text(svg, 190, 22, title || (stage === 'ground' ? '2s² 2p²: 2 unpaired electrons' : '2s¹ 2p³: 4 unpaired electrons'), { 'font-size': 16, fill: '#4152d9' });
      return;
    }
    // hybrid: old boxes fade while the new set rises/falls to the middle
    var H = HYB[kind], my = 166;
    if (e < 1) {
      box(sx, sy + (my - sy) * e, '2s', true, false, 1 - e);
      for (var k = 0; k < 3 - H.p; k++) box(px[k], py + (my - py) * e, '2p', true, false, 1 - e);
    }
    var n = H.n, x0 = 60;
    for (var i = 0; i < n; i++) box(x0 + i * (B + 10), my, H.label, true, false, e, true);
    for (var j = 0; j < H.p; j++) box(px[2] - (H.p - 1 - j) * 50 + (H.p === 2 ? 0 : 0), py, '2p', true, false, 1);
    K.text(svg, 190, 22, '2s + ' + (3 - H.p) + ' × 2p → ' + n + ' ' + H.label + (H.p ? ' + ' + H.p + ' p left' : ''), { 'font-size': 16, fill: '#4152d9' });
  }

  /** One ethane carbon's four sp³ boxes: its own electron in each (blue ↑); the partner's electron (↓) arrives as each σ bond forms. */
  function shareBoxes(svg, cc, ch, title) {
    K.clear(svg);
    svg.setAttribute('viewBox', '0 0 340 340');
    var B = 44, gap = 18, x0 = 170 - (4 * B + 3 * gap) / 2, y = 132;
    K.text(svg, 170, 22, title, { 'font-size': 15, fill: '#4152d9' });
    K.text(svg, 170, 62, 'one carbon in ethane', { 'font-size': 13, 'font-family': 'Space Mono, monospace', fill: '#5b6474' });
    function arrow(x, yy, up, colour, op) {
      var y1 = yy + B - 7, y2 = yy + 7;
      if (!up) { var tmp = y1; y1 = y2; y2 = tmp; }
      var hy = y2 + (up ? 8 : -8);
      s('path', { d: 'M' + x + ' ' + y1 + ' L' + x + ' ' + y2 + ' M' + (x - 5.5) + ' ' + hy + ' L' + x + ' ' + y2 + ' L' + (x + 5.5) + ' ' + hy, stroke: colour, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op }, svg);
    }
    for (var i = 0; i < 4; i++) {
      var x = x0 + i * (B + gap), f = i === 0 ? cc : ch;
      s('rect', { x: x, y: y, width: B, height: B, rx: 6, fill: f >= 1 ? '#ffdf80' : BOX_HYB, stroke: '#1d2433', 'stroke-width': 2 }, svg);
      K.text(svg, x + B / 2, y + B + 16, 'sp³', { 'font-size': 14 });
      arrow(x + (f > 0 ? B * 0.33 : B / 2), y, true, '#4152d9', 1);
      if (f > 0) {
        arrow(x + B * 0.67, y, false, '#1d2433', f);
        K.text(svg, x + B / 2, y - 14, i === 0 ? 'C–C' : 'C–H', { 'font-size': 12, 'font-family': 'Space Mono, monospace', fill: '#1d2433', opacity: f });
      }
    }
    // key
    arrow(70, 236, true, '#4152d9', 1);
    s('text', { x: 92, y: 258, 'font-size': 13, 'font-family': 'Space Mono, monospace', fill: '#1d2433', 'dominant-baseline': 'central' }, svg).textContent = 'this carbon’s electron';
    arrow(70, 280, false, '#1d2433', 1);
    s('text', { x: 92, y: 302, 'font-size': 13, 'font-family': 'Space Mono, monospace', fill: '#1d2433', 'dominant-baseline': 'central' }, svg).textContent = 'the partner atom’s electron';
  }
  function win(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  /** Remove (and free) everything a scene added to the turntable's content group. */
  function emptyContent(tt) {
    if (!tt.content) return;
    while (tt.content.children.length) {
      var c = tt.content.children.pop();
      c.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
  }
  function ball(T, r, colour, op) {
    return new T.Mesh(new T.SphereGeometry(r, 28, 20), new T.MeshStandardMaterial({ color: colour, transparent: op != null, opacity: op == null ? 1 : op, roughness: 0.45, depthWrite: op == null }));
  }

  // =================================================================================================
  // Beat 26 · carbon's puzzle
  // =================================================================================================
  GuideShell.registerScene('orbitals', function (mount) {
    var root = h('div', 'scene scene-orbitals');
    var head = h('div', 'scene-head');
    var body = h('div', 'orb-body');
    var bx = K.svg('orb-boxes');
    var view = h('div', 'hyb-3d');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    body.appendChild(bx); body.appendChild(view);
    root.appendChild(head); root.appendChild(body); root.appendChild(foot);
    mount.appendChild(root);
    var anim = null;
    var STEPS = [{ id: 'ground', label: '1 · Ground state' }, { id: 'promote', label: '2 · Promote' }, { id: 'check', label: '3 · Check the angles' }, { id: 'hybrid', label: '4 · Combine' }];
    var c = K.chips(STEPS, go, { label: 'Step' });
    head.appendChild(c.el);
    // CH₄ as observed: four identical bonds, 109.5° apart
    var tt = Turntable.create(view, {}), T = tt.THREE, has = !!tt.content, V = Gm.v;
    var m = model('ch4'), C = m.atoms[m.root].p;
    var bonds = m.atoms.map(function (a, i) { return i; }).filter(function (i) { return i !== m.root; })
      .map(function (i) { return { d: V.norm(V.sub(m.atoms[i].p, C)), L: V.len(V.sub(m.atoms[i].p, C)) }; });
    // the p axes as in the textbook cube picture: each bond sits 54.7° from every axis, so none lines up
    var axes = [[0, 1], [0, 2], [0, 3]].map(function (pr) { return V.norm(V.add(bonds[pr[0]].d, bonds[pr[1]].d)); });
    if (has) tt.setMolecule(m, { lones: false });
    if (has) orbitalKey(view, [KEY_HYB, KEY_UNH]);
    // In the box on step 3: pull the four unhybridized orbitals apart to see each one on its own
    var sepBox = h('div', 'gal-space'), sepBtn = h('button', 'btn scene-chip-step', 'Separate');
    sepBtn.type = 'button';
    sepBtn.setAttribute('aria-pressed', 'false');
    sepBox.appendChild(sepBtn);
    sepBox.hidden = true;
    view.appendChild(sepBox);
    var chk = null;   // the step-3 pieces: { sOrb, ps, arcs, sep }
    var mine = [];
    function lab(id, text, p, o) { mine.push(id); tt.label(id, text, p, o); }
    function at(o) { o.position.set(C[0], C[1], C[2]); return o; }
    // side by side: 2s, then 2px, 2py, 2pz, each turned onto its own axis (content shrinks a little so the row fits)
    var SLOTS = [[-3.0, 0, 0], [-1.0, 0, 0], [1.0, 0, 0], [2.6, 0, 0]].map(function (p) { return [p[0] + 0.25, p[1], p[2]]; });
    var SHRINK = 0.2, NAMES = ['2s', '2p<sub>x</sub>', '2p<sub>y</sub>', '2p<sub>z</sub>'];
    function placeSep(k) {
      var e = K.ease(k);
      tt.content.scale.setScalar(1 - SHRINK * e);
      [chk.sOrb].concat(chk.ps).forEach(function (o, i) {
        var P = [C[0] + (SLOTS[i][0] - C[0]) * e, C[1] + (SLOTS[i][1] - C[1]) * e, C[2] + (SLOTS[i][2] - C[2]) * e];
        o.position.set(P[0], P[1], P[2]);
        if (i) o.quaternion.copy(new T.Quaternion().slerp(chk.q[i - 1], e));
      });
      tt.render();
    }
    function sepLabels(on) {
      var sc = 1 - SHRINK;
      // brought forward by the start view's yaw, so the labels on the left are not dimmed as 'behind'
      NAMES.forEach(function (n, i) { var x = SLOTS[i][0] * sc; if (on) lab('sep' + i, n, [x, -1.62 * sc, x * Math.tan(-0.35)], { cls: 'is-small', html: true }); else tt.label('sep' + i, null); });
    }
    function separate(on) {
      if (!chk || chk.sep === on) return;
      tt.settle();
      chk.sep = on;
      sepBtn.textContent = on ? 'Put together' : 'Separate';
      sepBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        ['hch', 'pp', 'p0', 'p1', 'p2', 'info'].forEach(function (k) { tt.label(k, null); });
        chk.arcs.forEach(function (a) { a.visible = false; });
        tt.showMolecule(false);
        tt.preset('start');
      } else sepLabels(false);
      tt.animate(1100, function (t) { placeSep(on ? t : 1 - t); }, function () {
        if (on) {
          sepLabels(true);
          lab('info', '2s: no direction · 2p: 90° apart', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        } else {
          tt.showMolecule(true);
          chk.arcs.forEach(function (a) { tt.content.remove(a); a.geometry.dispose(); a.material.dispose(); });
          chk.arcs = [tt.angleArc(C, bonds[0].d, bonds[1].d, '109.5°', 'hch'), tt.angleArc(C, axes[1], axes[2], '90°', 'pp')];
          axes.forEach(function (d, i) { lab('p' + i, '2p', V.add(C, V.mul(d, 1.5)), { cls: 'is-small' }); });
          lab('info', '2p orbitals: 90° apart · bonds: 109.5°', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        }
      });
      foot.textContent = on
        ? 'Carbon’s four unhybridized orbitals, side by side: 2s is a sphere with no direction, and the three 2p orbitals are dumbbells along the x, y and z axes, 90° to each other. Drag to turn them.'
        : FOOT.check;
    }
    sepBtn.addEventListener('click', function () { separate(!(chk && chk.sep)); });
    var FOOT = {
      ground: 'CH₄ has four identical C–H bonds, 109.5° apart. Carbon’s ground state has only two unpaired electrons to share.',
      promote: 'One 2s electron moves up into the empty 2p orbital. Now there are four unpaired electrons to share.',
      check: 'Could carbon bond with these orbitals as they are? Its three 2p orbitals point 90° apart, and 2s is a sphere with no direction. But CH₄’s four bonds are identical and 109.5° apart: none of them lines up with a p orbital. Press Separate to see the four orbitals side by side.',
      hybrid: 'The 2s and all three 2p orbitals combine into four identical sp³ orbitals. They point to the corners of a tetrahedron, 109.5° apart: right at the four H atoms.',
    };
    function go(id) {
      c.set(id);
      if (anim) anim.cancel();
      var stage = id === 'check' ? 'promote' : id;
      anim = K.tween(id === 'promote' || id === 'hybrid' ? 1100 : 1, function (t) {
        boxes(bx, 'sp3', stage, t, id === 'check' ? 'four electrons, but in s and p' : null);
      });
      foot.textContent = FOOT[id];
      sepBox.hidden = !has || id !== 'check';
      if (!has) return;
      tt.settle();
      mine.forEach(function (k) { tt.label(k, null); });
      mine = [];
      emptyContent(tt);
      tt.content.scale.setScalar(1);
      tt.showMolecule(true);
      chk = null;
      sepBtn.textContent = 'Separate';
      sepBtn.setAttribute('aria-pressed', 'false');
      var arcHCH = tt.angleArc(C, bonds[0].d, bonds[1].d, '109.5°', 'hch');
      mine.push('hch');
      if (id === 'ground' || id === 'promote') {
        lab('info', 'CH₄: four identical bonds, 109.5° apart', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        tt.render();
        return;
      }
      var sOrb = at(ball(T, 0.55, UNH, 0.33));
      var ps = axes.map(function (d) { return at(pOrbital(T, d, 0.42)); });
      var hy = bonds.map(function (b) { var g = at(hybridLobe(T, b.d, b.L * 0.98)); g.scale.setScalar(0.001); return g; });
      tt.content.add(sOrb);
      ps.forEach(function (p) { tt.content.add(p); });
      hy.forEach(function (g) { tt.content.add(g); });
      if (id === 'check') {
        var arcPP = tt.angleArc(C, axes[1], axes[2], '90°', 'pp');   // axes[0] bisects the 109.5° pair, so measure the other two
        // each p turns onto its own axis when separated (whichever end is nearer, so the turn is short)
        var q = axes.map(function (d, i) {
          var e0 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]][i];
          if (V.dot(d, e0) < 0) e0 = V.mul(e0, -1);
          return new T.Quaternion().setFromUnitVectors(new T.Vector3(d[0], d[1], d[2]), new T.Vector3(e0[0], e0[1], e0[2]));
        });
        chk = { sOrb: sOrb, ps: ps, arcs: [arcHCH, arcPP], sep: false, q: q };
        mine.push('pp');
        axes.forEach(function (d, i) { lab('p' + i, '2p', V.add(C, V.mul(d, 1.5)), { cls: 'is-small' }); });
        lab('info', '2p orbitals: 90° apart · bonds: 109.5°', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        sOrb.scale.setScalar(0.001);
        ps.forEach(function (p) { p.scale.setScalar(0.001); });
        tt.animate(900, function (t) {
          var e = K.ease(t);
          sOrb.scale.setScalar(Math.max(0.001, e));
          ps.forEach(function (p) { p.scale.setScalar(Math.max(0.001, e)); });
        });
        return;
      }
      tt.animate(1300, function (t) {
        var e = K.ease(t);
        sOrb.scale.setScalar(Math.max(0.001, 1 - e));
        ps.forEach(function (p) { p.scale.setScalar(Math.max(0.001, 1 - e)); });
        hy.forEach(function (g) { g.scale.setScalar(Math.max(0.001, e)); });
      }, function () {
        lab('info', 'sp³: four identical orbitals, 109.5° apart', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
      });
    }
    go('ground');
    return { settle: function () { if (anim) anim.settle(); if (has) tt.settle(); }, destroy: function () { if (anim) anim.cancel(); tt.destroy(); } };
  });

  // =================================================================================================
  // Beats 27–29 · sp³ / sp² / sp in 3D
  // =================================================================================================
  function pOrbital(T, dir, op) {
    var g = new T.Group();
    g.add(Turntable.lobe(dir, 1.25, 0.42, UNH, op));
    g.add(Turntable.lobe([-dir[0], -dir[1], -dir[2]], 1.25, 0.42, UNH, op));
    return g;
  }
  /** One hybrid orbital: a single lobe (the small back lobe is left out at this level). */
  function hybridLobe(T, dir, len) {
    var g = new T.Group(), k = (len || 1.55) / 1.55;
    g.add(Turntable.lobe(dir, 1.55 * k, 0.5 * Math.min(1, k * 1.1), HYB_Y, 0.6));
    return g;
  }

  /**
   * Ethane from two sp³ carbons: st = { grow, a (carbons close in), p (C–C pair forms), hv, hA (H atoms close in), hP (C–H pairs form) }.
   * Each lobe holds one electron (blue); each H 1s holds one (ink). Where two orbitals overlap head on, the two electrons pair: a σ bond.
   */
  function ethaneBuild(tt) {
    var T = tt.THREE, V = Gm.v, m = model('c2h6');
    var Cs = [], Hs = [];
    m.atoms.forEach(function (a, i) { (a.el === 'C' ? Cs : Hs).push(i); });
    var A0 = m.atoms[Cs[0]].p, B0 = m.atoms[Cs[1]].p, mid = V.mul(V.add(A0, B0), 0.5), ax = V.norm(V.sub(B0, A0)), Lcc = V.len(V.sub(B0, A0));
    function rel(p) { return V.sub(p, mid); }
    function perp(d) { var q = V.cross(d, Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); return V.norm(q); }
    function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function put(o, p) { o.position.set(p[0], p[1], p[2]); }
    function glow(len, d) {
      var g = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: HYB_DEEP, transparent: true, opacity: 0, depthWrite: false }));
      g.scale.set(0.24, len, 0.24);
      g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(d[0], d[1], d[2]).normalize());
      tt.content.add(g);
      return g;
    }
    var neigh = function (i) { return m.bonds.filter(function (b) { return b.a === i || b.b === i; }).map(function (b) { return b.a === i ? b.b : b.a; }); };
    var carbons = Cs.map(function (ci, k) {
      var g = new T.Group();
      tt.content.add(g);
      var core = ball(T, m.atoms[ci].r * 0.82, 0x2a3142);
      g.add(core);
      var fin = rel(m.atoms[ci].p), far = V.add(fin, V.mul(ax, (k ? 1 : -1) * 1.05));
      var lobes = neigh(ci).map(function (j) {
        var d = V.norm(V.sub(m.atoms[j].p, m.atoms[ci].p)), L = V.len(V.sub(m.atoms[j].p, m.atoms[ci].p)), isC = m.atoms[j].el === 'C';
        var len = isC ? L * 0.64 : L * 0.8;
        var lob = hybridLobe(T, d, len);
        g.add(lob);
        var e = ball(T, 0.075, BLUE);
        g.add(e);
        return { j: j, d: d, L: L, len: len, isC: isC, lob: lob, e: e, own: V.mul(d, len * 0.62) };
      });
      tt.label('a' + ci, 'C', [0, 0, 0], { obj: core, cls: 'is-dark' });
      return { g: g, fin: fin, far: far, lobes: lobes, k: k };
    });
    var hs = Hs.map(function (hi, n) {
      var ci = neigh(hi)[0], k = Cs.indexOf(ci), C0 = m.atoms[ci].p;
      var d = V.norm(V.sub(m.atoms[hi].p, C0)), L = V.len(V.sub(m.atoms[hi].p, C0));
      var g = new T.Group();
      tt.content.add(g);
      var core = ball(T, m.atoms[hi].r * 0.82, 0xf4f6fb);
      g.add(core);
      g.add(ball(T, 0.46, GREY, 0.28));   // the 1s orbital
      var e = ball(T, 0.075, 0x1d2433);
      g.add(e);
      var fin = rel(m.atoms[hi].p);
      return { g: g, e: e, core: core, hi: hi, k: k, d: d, L: L, n: n, fin: fin, far: V.add(fin, V.mul(d, 1.9)), own: V.mul(d, -0.26),
        pair: V.add(rel(C0), V.mul(d, L * 0.7)), side: perp(d), sig: glow(L * 0.2, d) };
    });
    var sigCC = glow(Lcc * 0.2, ax), sideCC = perp(ax);
    function set(st) {
      var grow = st.grow == null ? 1 : st.grow, a = K.ease(st.a || 0), p = K.ease(st.p || 0);
      carbons.forEach(function (C) {
        var pos = lerp3(C.far, C.fin, a);
        put(C.g, pos);
        C.lobes.forEach(function (lb) {
          lb.lob.scale.setScalar(Math.max(0.001, grow));
          lb.e.visible = grow > 0.6;
          var target, f;
          if (lb.isC) { target = V.add([0, 0, 0], V.mul(sideCC, C.k ? 0.08 : -0.08)); f = p; }
          else {
            var H = hs.filter(function (x) { return x.k === C.k && Math.abs(V.dot(x.d, lb.d) - 1) < 1e-3; })[0];
            target = V.add(H.pair, V.mul(H.side, 0.08)); f = H.pf || 0;
          }
          var own = lb.own, loc = V.sub(target, pos);
          put(lb.e, lerp3(own, loc, f));
        });
      });
      sigCC.position.set(0, 0, 0);
      sigCC.material.opacity = 0.3 * p;
      hs.forEach(function (H) {
        var t0 = H.n * 0.07, ha = K.ease(win(st.hA || 0, t0, t0 + 0.58));
        H.pf = K.ease(win(st.hP || 0, 0, 1));
        H.g.visible = !!st.hv;
        if (st.hv && !H.named) { H.named = true; tt.label('a' + H.hi, 'H', [0, 0, 0], { obj: H.core }); }   // labelled only once the H atoms are in view
        var pos = lerp3(H.far, H.fin, ha);
        put(H.g, pos);
        put(H.e, lerp3(H.own, V.sub(V.add(H.pair, V.mul(H.side, -0.08)), pos), H.pf));
        put(H.sig, H.pair);
        H.sig.material.opacity = 0.3 * H.pf;
      });
      // the carbons' C–H electrons follow the pairing (set after H.pf is known)
      carbons.forEach(function (C) {
        var pos = lerp3(C.far, C.fin, a);
        C.lobes.forEach(function (lb) {
          if (lb.isC) return;
          var H = hs.filter(function (x) { return x.k === C.k && Math.abs(V.dot(x.d, lb.d) - 1) < 1e-3; })[0];
          put(lb.e, lerp3(lb.own, V.sub(V.add(H.pair, V.mul(H.side, 0.08)), pos), H.pf));
        });
      });
      tt.render();
    }
    return { set: set, carbons: carbons, hs: hs, ax: ax, Lcc: Lcc };
  }
  function hybridDirs(kind) {
    if (kind === 'sp3') return { h: Gm.domainDirs(4, 0).bonds, p: [] };
    if (kind === 'sp2') return { h: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]], p: [[0, 0, 1]] };
    return { h: [[1, 0, 0], [-1, 0, 0]], p: [[0, 1, 0], [0, 0, 1]] };
  }

  GuideShell.registerScene('hybrid', function (mount, beat) {
    var kind = beat.dataset.hyb || 'sp3', H = HYB[kind];
    var root = h('div', 'scene scene-hybrid');
    var head = h('div', 'scene-head');
    var body = h('div', 'hyb-body');
    var bx = K.svg('orb-boxes');
    var view = h('div', 'hyb-3d');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    body.appendChild(bx); body.appendChild(view);
    root.appendChild(head); root.appendChild(body); root.appendChild(foot);
    mount.appendChild(root);
    var tt = Turntable.create(view, {});
    var T = tt.THREE;
    if (tt.content) orbitalKey(view, kind === 'sp3' ? [KEY_HYB, KEY_H] : [KEY_HYB, KEY_UNH]);
    var STEPS = kind === 'sp3'
      ? [{ id: 'two', label: '1 · Two sp³ carbons' }, { id: 'cc', label: '2 · C–C overlap' }, { id: 'ch', label: '3 · C–H overlap' }]
      : [{ id: 'sp', label: '1 · s and p' }, { id: 'mix', label: '2 · Combine' }, { id: 'mol', label: '3 · Build ' + H.name }];
    var c = K.chips(STEPS, go, { label: 'Step' });
    head.appendChild(c.el);
    var anim = null;

    function clearContent() { if (tt.content) { while (tt.content.children.length) tt.content.remove(tt.content.children[0]); } tt.clearLabels(); }
    function ethaneStep(id) {
      var TITLE = { two: 'sp³: one electron in each orbital', cc: 'C–C σ bond: sp³ + sp³', ch: 'C–H σ bonds: sp³ + H 1s' };
      foot.textContent = {
        two: 'Each carbon in ethane is sp³: four identical orbitals, 109.5° apart, each holding one electron. Drag the model to turn it.',
        cc: 'The carbons move together until one sp³ orbital from each overlaps the other head on. The two electrons, one from each carbon, pair up in the overlap: the C–C σ bond.',
        ch: 'Each H has a 1s orbital with one electron. It overlaps head on with a carbon sp³ orbital, and the two electrons pair up: six C–H σ bonds. Every bond in ethane is a σ bond, and each carbon stays tetrahedral (109.5°).',
      }[id];
      var ms = { two: 700, cc: 1900, ch: 2300 }[id];
      anim = K.tween(ms, function (t) {
        shareBoxes(bx, id === 'cc' ? win(t, 0.62, 1) : id === 'ch' ? 1 : 0, id === 'ch' ? win(t, 0.66, 1) : 0, TITLE[id]);
      });
      if (!tt.content) return;
      clearContent();
      tt.clear();
      tt.setRadius(2.4);
      var E = ethaneBuild(tt);
      if (id === 'two') {
        E.set({ grow: 0, a: 0 });
        var C0 = E.carbons[0], ds = C0.lobes.filter(function (lb) { return !lb.isC; });
        tt.angleArc(C0.far, ds[0].d, ds[1].d, '109.5°', 'arc');
        tt.label('info', 'two sp³ carbons, one electron per orbital', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        tt.animate(ms, function (t) { E.set({ grow: K.ease(t), a: 0 }); });
      } else if (id === 'cc') {
        E.set({ a: 0 });
        tt.label('info', 'sp³ + sp³ overlap → C–C σ bond', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        tt.animate(ms, function (t) { E.set({ a: win(t, 0, 0.58), p: win(t, 0.62, 1) }); },
          function () { tt.label('scc', 'σ', [0, 0.42, 0], { cls: 'is-small is-amber' }); });
      } else {
        E.set({ a: 1, p: 1, hv: 1, hA: 0, hP: 0 });
        tt.label('scc', 'σ', [0, 0.42, 0], { cls: 'is-small is-amber' });
        tt.label('info', 'sp³ + H 1s overlap → C–H σ bonds', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        tt.animate(ms, function (t) { E.set({ a: 1, p: 1, hv: 1, hA: win(t, 0, 0.62), hP: win(t, 0.66, 1) }); },
          function () {
            E.hs.forEach(function (H, n) { if (n % 3 === 0) tt.label('sh' + n, 'σ', V3add(H.pair, H.side, 0.3), { cls: 'is-small is-amber' }); });
            tt.label('ang', 'H–C–H 109.5°', [0, 0, 0], { cls: 'is-fixed-bc', fixed: true });
          });
      }
    }
    function V3add(p, d, k) { return [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k]; }
    function go(id) {
      c.set(id);
      if (anim) anim.cancel();
      tt.settle();
      if (kind === 'sp3') { ethaneStep(id); return; }
      if (!tt.content) { boxes(bx, kind, id === 'sp' ? 'promote' : 'hybrid', 1); return; }
      var D = hybridDirs(kind);
      if (id === 'sp' || id === 'mix') {
        tt.setMolecule({ atoms: [{ el: 'C', p: [0, 0, 0], lones: [], r: 0.36 }], bonds: [] }, { lones: false });
        tt.setRadius(1.9);
        clearContent();
        var sOrb = new T.Mesh(new T.SphereGeometry(0.62, 32, 22), new T.MeshStandardMaterial({ color: UNH, transparent: true, opacity: 0.33, depthWrite: false }));
        var ps = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(function (d) { return pOrbital(T, d, 0.42); });
        // the p orbitals that stay unmixed (sp², sp) line up with the leftovers
        var keep = kind === 'sp3' ? [] : kind === 'sp2' ? [2] : [1, 2];
        tt.content.add(sOrb);
        ps.forEach(function (p) { tt.content.add(p); });
        var hy = D.h.map(function (d) { var g = hybridLobe(T, d); g.scale.setScalar(0.001); tt.content.add(g); return g; });
        if (id === 'sp') {
          boxes(bx, kind, 'promote', 1);
          tt.label('s', '2s', [0, -0.78, 0], { cls: 'is-small' });
          tt.label('px', '2p<sub>x</sub>', [1.45, 0, 0], { cls: 'is-small', html: true });
          tt.label('py', '2p<sub>y</sub>', [0, 1.45, 0], { cls: 'is-small', html: true });
          tt.label('pz', '2p<sub>z</sub>', [0, 0, 1.45], { cls: 'is-small', html: true });
          foot.textContent = 'Carbon’s valence orbitals: one spherical 2s and three dumbbell 2p orbitals, at right angles. Drag to turn.';
          tt.render();
          return;
        }
        var mixT = function (t) {
          var e = K.ease(t);
          sOrb.scale.setScalar(Math.max(0.001, 1 - e));
          ps.forEach(function (p, i) { if (keep.indexOf(i) === -1) p.scale.setScalar(Math.max(0.001, 1 - e)); });
          hy.forEach(function (g) { g.scale.setScalar(Math.max(0.001, e)); });
          boxes(bx, kind, 'hybrid', t);
          tt.render();
        };
        tt.animate(1300, mixT, function () {
          D.h.forEach(function (d, i) { tt.label('h' + i, H.label, [d[0] * 1.75, d[1] * 1.75, d[2] * 1.75], { cls: 'is-small is-amber' }); });
          keep.forEach(function (k) { var d = [[1, 0, 0], [0, 1, 0], [0, 0, 1]][k]; tt.label('p' + k, 'p', [d[0] * 1.45, d[1] * 1.45, d[2] * 1.45], { cls: 'is-small' }); });
          tt.label('ang', H.angle + ' apart', [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
        });
        foot.textContent = '2s + ' + (3 - H.p) + ' × 2p → ' + H.n + ' ' + H.label + ' orbitals, ' + H.angle + ' apart' +
          (H.p ? '. ' + H.p + ' p orbital' + (H.p > 1 ? 's stay' : ' stays') + ' unmixed, at right angles to them.' : '.');
        return;
      }
      // Build the molecule with σ and π overlap
      boxes(bx, kind, 'hybrid', 1);
      clearContent();
      var m = model(H.mol);
      tt.setMolecule(m, { lones: false });
      m.bonds.forEach(function (b) {
        var A = m.atoms[b.a].p, B = m.atoms[b.b].p;
        var mid = Gm.v.mul(Gm.v.add(A, B), 0.5), d = Gm.v.sub(B, A), L2 = Gm.v.len(d);
        var sig = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: HYB_DEEP, transparent: true, opacity: 0.3, depthWrite: false }));
        sig.scale.set(0.3, L2 * 0.62, 0.3);
        sig.position.set(mid[0], mid[1], mid[2]);
        sig.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(d[0], d[1], d[2]).normalize());
        tt.content.add(sig);
      });
      // π: the unmixed p orbitals overlap side by side above and below the C–C axis
      var Cs = m.atoms.map(function (a, i) { return i; }).filter(function (i) { return m.atoms[i].el === 'C'; });
      var A0 = m.atoms[Cs[0]].p, B0 = m.atoms[Cs[1]].p, mid0 = Gm.v.mul(Gm.v.add(A0, B0), 0.5), ax = Gm.v.norm(Gm.v.sub(B0, A0));
      var pDirs = kind === 'sp2' ? [[0, 0, 1]] : kind === 'sp' ? [[0, 1, 0], [0, 0, 1]] : [];
      pDirs.forEach(function (pd, k) {
        [1, -1].forEach(function (sgn) {
          var blob = new T.Mesh(new T.SphereGeometry(1, 28, 18), new T.MeshStandardMaterial({ color: UNH_DEEP, transparent: true, opacity: 0.38, depthWrite: false }));
          blob.scale.set(0.62, 0.32, 0.32);
          var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(1, 0, 0), new T.Vector3(ax[0], ax[1], ax[2]));
          blob.quaternion.copy(q);
          blob.position.set(mid0[0] + pd[0] * 0.55 * sgn, mid0[1] + pd[1] * 0.55 * sgn, mid0[2] + pd[2] * 0.55 * sgn);
          tt.content.add(blob);
        });
        tt.label('pi' + k, 'π', [mid0[0] + pd[0] * 1.05, mid0[1] + pd[1] * 1.05, mid0[2] + pd[2] * 1.05], { cls: 'is-small' });
      });
      tt.label('sig', 'σ', [mid0[0], mid0[1] - 0.05, mid0[2] + 0.4], { cls: 'is-small is-amber' });
      tt.label('ang', 'H–C–H ' + H.angle + (kind === 'sp' ? ' (H–C≡C)' : ''), [0, 0, 0], { cls: 'is-fixed-tl', fixed: true });
      tt.preset(kind === 'sp2' ? 'start' : 'start');
      foot.textContent = {
        sp3: 'Ethane: every bond is a σ bond, made by sp³ orbitals (yellow) overlapping head on. Each carbon is tetrahedral, 109.5°.',
        sp2: 'Ethene: the hybrid sp² orbitals (yellow) make the σ bonds, 120° in a plane. The unhybridized p orbitals (blue) overlap side by side above and below: the π bond. Double bond = σ + π.',
        sp: 'Ethyne: the hybrid sp orbitals (yellow) make the σ bonds in a straight line (180°). Two unhybridized p orbitals (blue) make two π bonds. Triple bond = σ + 2π.',
      }[kind];
    }
    go(STEPS[0].id);
    return { settle: function () { if (anim) anim.settle(); tt.settle(); }, destroy: function () { if (anim) anim.cancel(); tt.destroy(); } };
  });

  // =================================================================================================
  // Beat 30 · the pattern
  // =================================================================================================
  GuideShell.registerScene('pattern', function (mount) {
    var root = h('div', 'scene scene-pattern');
    var table = h('div', 'pattern-table');
    var foot = h('p', 'scene-readout', 'Count the domains around a carbon (bonds count once, whatever their order). That number tells you the hybridization and the angle.');
    root.appendChild(table); root.appendChild(foot);
    mount.appendChild(root);
    var head = h('div', 'pattern-row pattern-head');
    ['Domains', 'Hybrid orbitals', 'Angle', 'Shape at C', 'Example'].forEach(function (t) { head.appendChild(h('span', null, t)); });
    table.appendChild(head);
    [['4', 'sp³', '109.5°', 'tetrahedral', 'ch4', 'CH₄, ethane: single bonds only', 's + 3 p → 4 sp³'],
      ['3', 'sp²', '120°', 'trigonal planar', 'c2h4', 'ethene: one double bond', 's + 2 p → 3 sp², 1 p left for π'],
      ['2', 'sp', '180°', 'linear', 'c2h2', 'ethyne: one triple bond', 's + 1 p → 2 sp, 2 p left for 2 π']].forEach(function (r) {
      var row = h('button', 'pattern-row');
      row.type = 'button';
      row.appendChild(h('strong', 'pattern-big', r[0]));
      row.appendChild(h('strong', 'pattern-big', r[1]));
      row.appendChild(h('span', 'pattern-big', r[2]));
      row.appendChild(h('span', null, r[3]));
      var ex = h('span', 'pattern-ex');
      var sv = K.svg('pattern-svg');
      SV.render(sv, model(r[4]), { width: 260, height: 150, angle: false, maxScale: 80 });
      ex.appendChild(sv);
      ex.appendChild(h('small', null, r[5]));
      row.appendChild(ex);
      row.addEventListener('click', function () {
        table.querySelectorAll('.pattern-row').forEach(function (x) { x.classList.toggle('is-on', x === row); });
        foot.textContent = r[1] + ': ' + r[6] + '. ' + r[0] + ' domains, ' + r[2] + ' apart (' + r[3] + ').';
      });
      table.appendChild(row);
    });
    return {};
  });

  // =================================================================================================
  // Beat 31 · label each carbon
  // =================================================================================================
  GuideShell.registerScene('label-carbons', function (mount, beat) {
    var ids = (beat.dataset.mols || 'c3h6 c3h4 ch2nh').split(/\s+/);
    var memo = {};
    var root = h('div', 'scene scene-label');
    var head = h('div', 'scene-head');
    var sv = K.svg('scene-svg');
    sv.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var foot = h('p', 'scene-readout');
    foot.setAttribute('aria-live', 'polite');
    root.appendChild(head); root.appendChild(sv); root.appendChild(foot);
    mount.appendChild(root);
    var c = K.chips(ids.map(function (id) { return { id: id, label: Kit.get(id).formula + ' · ' + Kit.get(id).name }; }), show, { label: 'Molecule' });
    head.appendChild(c.el);
    var ans = h('button', 'btn scene-chip-step', 'Show answer');
    ans.type = 'button';
    c.el.appendChild(ans);
    var cur = ids[0];
    ans.addEventListener('click', function () { memo[cur].open = !memo[cur].open; show(cur); });
    var CYCLE = [null, 'sp³', 'sp²', 'sp'];
    function show(id) {
      cur = id;
      c.set(id);
      var st = Kit.structure(id), mm = memo[id] = memo[id] || { picks: {}, open: false };
      ans.textContent = mm.open ? 'Hide answer' : 'Show answer';
      DrawEngine.renderStatic(sv, st, { width: 640, height: 360, maxScale: 1.25 });
      var V = sv.__lewis.view, U = sv.__lewis.unit * V.k;
      var g = s('g', {}, sv);
      st.atoms.forEach(function (a, i) {
        if (a.el !== 'C' && a.el !== 'N') return;
        // put the label in the most open direction around the atom
        var bondAng = [];
        st.bonds.forEach(function (b) { if (b.a === i || b.b === i) { var o = st.atoms[b.a === i ? b.b : b.a]; bondAng.push(Math.atan2(o.y - a.y, o.x - a.x)); } });
        var best = null;
        [90, 270, 45, 135, 315, 225, 0, 180].forEach(function (dg) {
          var t = dg * Math.PI / 180, sep = Math.min.apply(null, bondAng.map(function (b) { var d = Math.abs(t - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }).concat([Math.PI]));
          if (!best || sep > best.sep + 0.05) best = { t: t, sep: sep };
        });
        var x = V.ox + a.x * U + Math.cos(best.t) * 40 * V.k, y = V.oy + a.y * U + Math.sin(best.t) * 40 * V.k;
        var pick = mm.picks[i] || null;
        var bt = s('g', { class: 'lab-pill', tabindex: 0, role: 'button', 'aria-label': 'Label ' + a.el + ': ' + (pick || 'not chosen') }, g);
        var w = 46;
        s('rect', { x: x - w / 2, y: y - 14, width: w, height: 28, rx: 14, fill: pick ? '#e7eaff' : '#ffffff', stroke: '#4152d9', 'stroke-width': 2, 'stroke-dasharray': pick ? 'none' : '4 3' }, bt);
        K.text(bt, x, y + 1, pick || '?', { 'font-size': 15, 'font-family': 'Space Mono, monospace', fill: '#4152d9' });
        function cycle() { mm.picks[i] = CYCLE[(CYCLE.indexOf(pick) + 1) % CYCLE.length]; show(id); }
        bt.addEventListener('click', cycle);
        bt.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } });
        if (mm.open) {
          var d = L.domains(st, i);
          K.text(g, x, y + 30, d.hybridization + ' · ' + d.steric + ' domains', { 'font-size': 12, 'font-family': 'Space Mono, monospace', fill: '#1d2433' });
        }
      });
      foot.textContent = mm.open ? 'Each answer shows the hybridization and its domain count. Compare them with your labels.'
        : 'Click the label under each carbon (and the N) to cycle sp³ → sp² → sp. Count domains: bonds count once, lone pairs count too.';
    }
    show(cur);
    return {};
  });

  // =================================================================================================
  // Beat 32 · lift into 3D
  // =================================================================================================
  GuideShell.registerScene('lift', function (mount, beat) {
    var root = h('div', 'scene scene-lift');
    var cols = h('div', 'lift-cols');
    var left = h('div', 'lift-draw');
    var right = h('div', 'lift-3d');
    var bar = h('div', 'lift-bar');
    var go = h('button', 'btn lift-go', 'Lift into 3D →');
    go.type = 'button';
    bar.appendChild(go);
    var foot = h('p', 'scene-readout', 'Draw a molecule (or keep ethene), then lift it. The Lewis drawing stays where it is.');
    foot.setAttribute('aria-live', 'polite');
    right.appendChild(bar);
    cols.appendChild(left); cols.appendChild(right);
    root.appendChild(cols); root.appendChild(foot);
    mount.appendChild(root);
    var engine = DrawEngine.create(left, {
      palette: (beat.dataset.palette || 'H C N O Cl').split(/\s+/), fcMode: 'off', allowReveal: false, allowExport: false,
      prompt: beat.dataset.prompt || 'Draw, then lift',
    });
    if (beat.dataset.load) engine.loadMany([Kit.structure(beat.dataset.load)]);
    var tt = Turntable.create(right, {});
    function lift() {
      var m = engine.get();
      if (!m.atoms.length) { foot.textContent = 'Drag some atoms in first.'; return; }
      var hubs = m.atoms.filter(function (_, i) { return m.bonds.filter(function (b) { return b.a === i || b.b === i; }).length >= 2; }).length;
      var em = Gm.embed(m);
      if (hubs > 1) Gm.level(em);
      var cx = 0, cy = 0;
      m.atoms.forEach(function (a) { cx += a.x; cy += a.y; });
      cx /= m.atoms.length; cy /= m.atoms.length;
      var from = m.atoms.map(function (a) { return [(a.x - cx) * 1.3, -(a.y - cy) * 1.3, 0]; });
      tt.preset('front');
      tt.setMolecule(em, { from: from, ms: 1600, lones: 'inner', done: function () { tt.preset('start'); } });
      var r = em.atoms[em.root];
      foot.textContent = r.steric >= 2 ? 'Around ' + r.el + ': ' + r.steric + ' domains → ' + (r.shape || 'shape') + '. Drag the model to turn it; the drawing on the left is unchanged.'
        : 'Lifted. Drag the model to turn it.';
    }
    go.addEventListener('click', lift);
    var auto = setTimeout(lift, 500);   // arrive with the starting molecule already lifted
    return { settle: function () { tt.settle(); }, destroy: function () { clearTimeout(auto); tt.destroy(); engine.destroy(); } };
  });

  // =================================================================================================
  // Beat 33 · which picture shows what?
  // =================================================================================================
  GuideShell.registerScene('which-picture', function (mount, beat) {
    var ids = (beat.dataset.mols || 'h2o nh3 co2 ch4 c2h4').split(/\s+/);
    var root = h('div', 'scene scene-which');
    var head = h('div', 'scene-head');
    var cols = h('div', 'which-cols');
    var lc = h('div', 'which-col'), rc = h('div', 'which-col');
    var lsv = K.svg('which-svg');
    lc.appendChild(h('p', 'which-title', 'Lewis structure'));
    lc.appendChild(lsv);
    lc.appendChild(list('Shows', ['every valence electron, lone pairs included', 'single, double and triple bonds', 'formal charge'], 'Hides', ['the real shape and angles']));
    var view = h('div', 'which-3d');
    rc.appendChild(h('p', 'which-title', '3D model'));
    rc.appendChild(view);
    rc.appendChild(list('Shows', ['the shape and bond angles', 'which way the molecule points (polarity)'], 'Hides', ['electrons, unless lone pairs are drawn', 'formal charge']));
    cols.appendChild(lc); cols.appendChild(rc);
    var next = h('a', 'which-next');
    next.href = '../intermolecular-forces/guide.html';
    next.innerHTML = '<span>Next</span><strong>Intermolecular Forces →</strong><small>Shapes and partial charges decide how molecules attract each other.</small>';
    root.appendChild(head); root.appendChild(cols); root.appendChild(next);
    mount.appendChild(root);
    var tt = Turntable.create(view, { presets: false });
    var c = K.chips(ids.map(function (id) { return { id: id, label: Kit.get(id).formula }; }), show, { label: 'Molecule' });
    head.appendChild(c.el);
    function list(a, aa, b, bb) {
      var d = h('div', 'which-list');
      [[a, aa], [b, bb]].forEach(function (p) {
        var g = h('div', 'which-group');
        g.appendChild(h('strong', null, p[0]));
        var ul = h('ul');
        p[1].forEach(function (x) { ul.appendChild(h('li', null, x)); });
        g.appendChild(ul);
        d.appendChild(g);
      });
      return d;
    }
    function show(id) {
      c.set(id);
      DrawEngine.renderStatic(lsv, Kit.structure(id), { width: 300, height: 200, maxScale: 1 });
      tt.setMolecule(model(id), { lones: 'inner' });
    }
    show(ids[0]);
    return { destroy: function () { tt.destroy(); } };
  });
})(window);
