/**
 * Chemical Bonding - lift a Lewis structure into 3D on the turntable (VSEPR).
 * Shared by the Guide's VSEPR scenes (ch-b.js) and the Draw Lab.
 *
 *   ShapeLift.model(src)        Geometry model for a kit id, or for any structure { atoms, bonds, charge }
 *                               (a student's drawing: atoms carry x, y and ne)
 *   ShapeLift.showShape(tt, src, lift, done, keepView)   put it on the turntable (rising out of its
 *                               Lewis layout when lift is true) with its angle arc and labels
 *   ShapeLift.viewToggles(tt)   'Space filling' and 'Shape' buttons
 *   ShapeLift.domainText(m), angleOf(m), axeText(r)      readout text
 */
(function (global) {
  'use strict';
  var Kit = global.BondingKit, Gm = global.Geometry, L = global.LewisModel;
  var h = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function structureOf(src) { return typeof src === 'string' ? Kit.structure(src) : src; }
  /** A chain (two or more atoms with 2+ bonds, e.g. ethene) or a diatomic is levelled; one central atom is not. */
  function chainLike(st) {
    var deg = st.atoms.map(function (_, i) { return L.neighbours(st, i).length; });
    return deg.filter(function (d) { return d >= 2; }).length !== 1;
  }
  function model(src) {
    if (typeof src === 'string') {
      var k = Kit.get(src), mk = Gm.embed(Kit.structure(src), k.center != null ? { root: k.center } : {});
      if (k.center == null) Gm.level(mk);
      return mk;
    }
    var m = Gm.embed(src, src.center != null ? { root: src.center } : {});
    if (src.center == null && chainLike(src)) Gm.level(m);
    return m;
  }
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

  function flatFrom(src) {
    var st = structureOf(src), cx = 0, cy = 0;
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
   * Put a molecule (kit id, or any structure) on the turntable (lifting from its Lewis layout when lift is true), then draw its angle.
   * keepView: leave the turntable where the student turned it (switching molecules within a scene).
   */
  function showShape(tt, src, lift, done, keepView) {
    var m = alignDomains(model(src)), r = m.atoms[m.root];
    clearContent(tt);
    if (!keepView) tt.preset('start');
    tt.__shapeOf = r;
    if (tt.shapeOptions) tt.shapeOptions({ faces: !SOLID[r.shape] || SOLID[r.shape][1] });
    tt.setMolecule(m, { lones: 'inner', from: lift ? flatFrom(src) : null, ms: 1500, done: function () { arc(); if (done) done(); } });
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

  global.ShapeLift = {
    model: model, showShape: showShape, viewToggles: viewToggles, shapeLabel: shapeLabel, alignDomains: alignDomains,
    flatFrom: flatFrom, clearContent: clearContent, domainText: domainText, angleOf: angleOf, axeText: axeText, axe: axe, SOLID: SOLID,
  };
})(window);
