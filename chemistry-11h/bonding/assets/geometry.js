/**
 * Chemical Bonding - geometry (VSEPR directions + 3D embedding). No DOM.
 *
 * Coordinates: x right, y UP, z toward the viewer. Lewis structures use y DOWN; convert with -y.
 *
 *   Geometry.domainDirs(steric, lone)   → { bonds: [v…], lones: [v…] } ideal directions (lone-pair
 *                                          compression applied), oriented for a textbook wedge/dash drawing
 *   Geometry.embed(structure, opts)     → { atoms: [{ el, p:[x,y,z], lones:[v…], steric, lone }], bonds, root }
 *                                          a full 3D layout of any (acyclic) Lewis structure
 *   Geometry.dipole(embedded)           → { bonds: [{ a, b, from, to, mag }], net:[x,y,z], size }
 *   Geometry.kit(el)                    → [light, dark] model-kit colours (colour starts at VSEPR)
 */
(function (global) {
  'use strict';
  var L = global.LewisModel, Kit = global.BondingKit;

  // --- vectors -------------------------------------------------------------------------------
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function norm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function angle(a, b) { return Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))) * 180 / Math.PI; }
  /** Rotate v about unit axis k by t radians (Rodrigues). */
  function rot(v, k, t) {
    var c = Math.cos(t), s = Math.sin(t);
    return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
  }
  /** Smallest rotation taking unit a onto unit b, applied to v. */
  function align(v, a, b) {
    var ax = cross(a, b), s = len(ax), c = dot(a, b);
    if (s < 1e-9) {
      if (c > 0) return v.slice();
      var perp = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      return rot(v, norm(cross(a, perp)), Math.PI);
    }
    return rot(v, mul(ax, 1 / s), Math.atan2(s, c));
  }
  function tilt(list, yawDeg, pitchDeg) {
    var y = yawDeg * Math.PI / 180, p = pitchDeg * Math.PI / 180;
    return list.map(function (v) { return rot(rot(v, [0, 1, 0], y), [1, 0, 0], p); });
  }

  // --- ideal directions ------------------------------------------------------------------------
  // Lone pairs take the FIRST slots of each list, so the drawings match the textbook pictures.
  var T = 0.9428, U = 0.3333, W = 0.4714, Z = 0.8165;
  var ORIENT = {
    2: [[1, 0, 0], [-1, 0, 0]],
    3: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]],
    4: tilt([[0, 1, 0], [T, -U, 0], [-W, -U, Z], [-W, -U, -Z]], 0, -20),
    '4,2': [[0, 0.5774, Z], [0, 0.5774, -Z], [Z, -0.5774, 0], [-Z, -0.5774, 0]],
    5: tilt([[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866], [0, 1, 0], [0, -1, 0]], 0, -25),
    '5,3': tilt([[0, 0, 1], [-0.866, 0, -0.5], [0.866, 0, -0.5], [1e-6, 1, 0], [0, -1, 0]], 0, -16),
    6: tilt([[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]], 30, -25),
  };
  // XeF₂: three equatorial lone pairs, the two bonds axial; draw it lying flat (bonds left-right)
  ORIENT['5,3'] = ORIENT['5,3'].map(function (v) { return rot(v, [0, 0, 1], -Math.PI / 2); });
  // Measured squeeze from lone pairs (degrees between two bonds)
  var SQUEEZE = { '4,1': 107, '4,2': 104.5, '3,1': 118 };

  function domainDirs(steric, lone) {
    var base = ORIENT[steric + ',' + lone] || ORIENT[steric];
    if (!base) {   // unusual counts: spread evenly on a circle
      base = [];
      for (var i = 0; i < steric; i++) base.push([Math.cos(2 * Math.PI * i / steric), Math.sin(2 * Math.PI * i / steric), 0]);
    }
    base = base.map(norm);
    var lones = base.slice(0, lone), bonds = base.slice(lone);
    var target = SQUEEZE[steric + ',' + lone];
    if (target && bonds.length >= 2 && lones.length) {
      var Lsum = norm(lones.reduce(add, [0, 0, 0]));
      var lo = 0, hi = 1.5, out = bonds;
      for (var it = 0; it < 30; it++) {
        var m = (lo + hi) / 2;
        out = bonds.map(function (b) { return norm(sub(b, mul(Lsum, m))); });
        if (angle(out[0], out[1]) > target) lo = m; else hi = m;
      }
      bonds = out;
      // lone pairs open up a little in the other direction (drawing only)
      lones = lones.map(function (l) { return norm(add(l, mul(Lsum, 0.15))); });
    }
    return { bonds: bonds, lones: lones };
  }

  // --- element sizes + colours -------------------------------------------------------------------
  var RADIUS = { H: 0.26, Li: 0.5, Be: 0.4, B: 0.36, C: 0.36, N: 0.35, O: 0.34, F: 0.33, Ne: 0.33,
    Na: 0.55, Mg: 0.5, Al: 0.48, Si: 0.46, P: 0.45, S: 0.45, Cl: 0.44, K: 0.62, Ca: 0.56, Br: 0.5, I: 0.56, Xe: 0.55 };
  var FALLBACK = { Li: ['#d9c2ff', '#8c64e6'], Be: ['#d8f0a0', '#7aa83a'], B: ['#ffc59c', '#d9783d'], Mg: ['#a9eaa9', '#3f9c4a'],
    Al: ['#d4d6e2', '#868aa0'], Si: ['#ecd2ad', '#a8804a'], P: ['#ffb46b', '#d9741f'], S: ['#f6dc6a', '#c29a16'],
    K: ['#d9c2ff', '#8c64e6'], Ca: ['#b8ecb0', '#4f9c45'], I: ['#c9a2ec', '#7b46b0'], Xe: ['#9fe4f2', '#2d9cb6'] };
  function kit(el) {
    var e = Kit.ELEMENTS[el];
    return (e && e.kit) || FALLBACK[el] || ['#e1e4ec', '#8a90a0'];
  }
  function radius(el) { return RADIUS[el] || 0.42; }
  function bondLength(a, b) { return 0.62 + (radius(a) + radius(b)) * 1.15; }

  // --- embedding -----------------------------------------------------------------------------------
  function neighbours(s, i) {
    var out = [];
    s.bonds.forEach(function (b) { if (b.a === i) out.push({ j: b.b, order: b.order }); else if (b.b === i) out.push({ j: b.a, order: b.order }); });
    return out;
  }
  function lewisAngle(s, i, j) { return Math.atan2(-(s.atoms[j].y - s.atoms[i].y), s.atoms[j].x - s.atoms[i].x); }
  function angDiff(a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }

  /**
   * Full 3D layout. opts.root: atom index to start from (default: most bonds).
   * Root directions match the Lewis drawing's 2D angles as closely as possible.
   */
  function embed(s, opts) {
    opts = opts || {};
    var n = s.atoms.length, P = new Array(n), info = new Array(n);
    var dom = s.atoms.map(function (_, i) { return L.domains(s, i); });
    var root = opts.root != null ? opts.root : 0;
    if (opts.root == null) {
      var best = -1;
      s.atoms.forEach(function (a, i) {
        var score = neighbours(s, i).length * 10 + (a.el === 'H' ? -5 : 0) - Math.abs(a.x) * 0.1;
        if (score > best) { best = score; root = i; }
      });
    }
    function lonesOf(i) { return dom[i].lone; }

    // Root: ideal set, neighbours matched to directions by 2D angle
    var d0 = domainDirs(Math.max(dom[root].steric, 1), lonesOf(root));
    P[root] = [0, 0, 0];
    info[root] = { lones: d0.lones };
    var nb = neighbours(s, root), free = d0.bonds.slice(), queue = [];
    var pairs = [];
    nb.forEach(function (x) { free.forEach(function (v, k) { pairs.push({ x: x, k: k, d: angDiff(lewisAngle(s, root, x.j), Math.atan2(v[1], v[0])) + (Math.abs(v[2]) > 0.5 ? 0.35 : 0) }); }); });
    pairs.sort(function (p, q) { return p.d - q.d; });
    var usedX = {}, usedK = {};
    pairs.forEach(function (p) {
      if (usedX[p.x.j] || usedK[p.k]) return;
      usedX[p.x.j] = usedK[p.k] = true;
      P[p.x.j] = mul(free[p.k], bondLength(s.atoms[root].el, s.atoms[p.x.j].el));
      queue.push({ i: p.x.j, parent: root });
    });

    while (queue.length) {
      var q = queue.shift(), i = q.i, p = q.parent;
      var u = norm(sub(P[p], P[i]));       // back along the bond
      var dd = domainDirs(Math.max(dom[i].steric, 1), lonesOf(i));
      var all = dd.bonds.concat(dd.lones);
      var anchor = dd.bonds[0];
      var R = all.map(function (v) { return align(v, anchor, u); });
      // Spin about the bond so the next direction lies opposite one of the parent's other neighbours
      // (keeps sp² carbons coplanar and chains zig-zag)
      var ref = null;
      neighbours(s, p).some(function (x) { if (x.j !== i && P[x.j]) { ref = sub(P[x.j], P[p]); return true; } return false; });
      if (!ref) ref = info[p] && info[p].lones.length ? info[p].lones[0] : [0, 0, 1];
      var refPerp = sub(ref, mul(u, dot(ref, u)));
      if (len(refPerp) > 1e-6 && R.length > 1) {
        var want = norm(mul(refPerp, -1)), bestT = 0, bestD = -2;
        for (var t = 0; t < 360; t += 3) {
          var cand = rot(R[1], u, t * Math.PI / 180);
          var dd2 = dot(norm(sub(cand, mul(u, dot(cand, u)))), want);
          if (dd2 > bestD) { bestD = dd2; bestT = t; }
        }
        R = R.map(function (v) { return rot(v, u, bestT * Math.PI / 180); });
      }
      var bondDirs = R.slice(1, dd.bonds.length), loneDirs = R.slice(dd.bonds.length);
      info[i] = { lones: loneDirs };
      var k = 0;
      neighbours(s, i).forEach(function (x) {
        if (x.j === p || P[x.j]) return;
        var v = bondDirs[k++] || norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        P[x.j] = add(P[i], mul(v, bondLength(s.atoms[i].el, s.atoms[x.j].el)));
        queue.push({ i: x.j, parent: i });
      });
    }
    // Disconnected pieces (ions): lay them side by side
    var off = 0;
    s.atoms.forEach(function (a, i) { if (!P[i]) { off += 2.2; P[i] = [off, 0, 0]; info[i] = { lones: [] }; } });

    // Centre on the root's molecule
    var c = [0, 0, 0];
    P.forEach(function (p) { c = add(c, p); });
    c = mul(c, 1 / n);
    if (opts.centreRoot) c = P[root];
    return {
      root: root,
      atoms: s.atoms.map(function (a, i) {
        return { el: a.el, p: sub(P[i], c), lones: info[i].lones, steric: dom[i].steric, lone: dom[i].lone, bonded: dom[i].bonded,
          shape: dom[i].shape, electronGeometry: dom[i].electronGeometry, hyb: dom[i].hybridization, r: radius(a.el) };
      }),
      bonds: s.bonds.map(function (b) { return { a: b.a, b: b.b, order: b.order }; }),
      charge: s.charge || 0,
    };
  }

  /** Turn a chain so its heavy atoms run left to right (ethene, propene…). Mutates and returns m. */
  function level(m) {
    var heavy = m.atoms.filter(function (a) { return a.el !== 'H'; });
    if (heavy.length < 2) return m;
    var lo = heavy[0], hi = heavy[0];
    heavy.forEach(function (a) { if (a.p[0] < lo.p[0]) lo = a; if (a.p[0] > hi.p[0]) hi = a; });
    var d = sub(hi.p, lo.p), t = -Math.atan2(d[1], d[0]);
    m.atoms.forEach(function (a) { a.p = rot(a.p, [0, 0, 1], t); a.lones = a.lones.map(function (l) { return rot(l, [0, 0, 1], t); }); });
    return m;
  }

  /** Bond dipoles point from the less to the more electronegative atom; magnitude = ΔEN. */
  function dipole(m) {
    var net = [0, 0, 0], out = [];
    m.bonds.forEach(function (b) {
      var A = m.atoms[b.a], B = m.atoms[b.b];
      var ea = Kit.ELEMENTS[A.el].en || 0, eb = Kit.ELEMENTS[B.el].en || 0, d = eb - ea;
      if (Math.abs(d) < 1e-6) { out.push({ a: b.a, b: b.b, mag: 0 }); return; }
      var from = d > 0 ? b.a : b.b, to = d > 0 ? b.b : b.a;
      var v = mul(norm(sub(m.atoms[to].p, m.atoms[from].p)), Math.abs(d));
      net = add(net, v);
      out.push({ a: b.a, b: b.b, from: from, to: to, mag: Math.abs(d), v: v });
    });
    // Lone pairs on the central atom push the same way as the bonds' negative ends (small extra pull)
    return { bonds: out, net: net, size: len(net) };
  }

  global.Geometry = {
    domainDirs: domainDirs, embed: embed, level: level, dipole: dipole, kit: kit, radius: radius, bondLength: bondLength,
    v: { add: add, sub: sub, mul: mul, dot: dot, cross: cross, len: len, norm: norm, angle: angle, rot: rot, align: align },
  };
})(typeof window !== 'undefined' ? window : globalThis);
