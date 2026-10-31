/**
 * IMF soft 2D interaction engine - clarity over physics.
 *
 * Model (pedagogical, not MD):
 *   - Each molecule carries charge sites (δ+ atoms, δ− lone pairs / atoms, ion charge).
 *     Site–site pushes and pulls give attract vs. repel AND a torque, so orientation matters.
 *   - London dispersion: short-range atom–atom pull scaled by polarizability (contact area counts).
 *   - Induced dipole: a nonpolar molecule near a charge is pulled toward stronger field.
 *   - Overdamped motion (no momentum) with speed / spin caps and walls - nothing can fly away.
 *     Steps are low-passed so stiff contact can't flip-flop frame to frame (stutter).
 *   - Any number of molecules: every pair interacts; the first two are "A" and "B".
 * Positions are in model units; the canvas is scaled so molecules read large on a laptop.
 */
(function (global) {
  'use strict';

  var KE = 1700;            // site–site strength
  var SOFT2 = 100;          // softening² so close sites never explode
  var LDF_K = 0.14;
  var LDF_RANGE = 34;       // atom–atom gap beyond which dispersion is ignored
  var IND_K = 1.0e7;
  var CONTACT_K = 0.5;
  var CONTACT_PAD = 4;      // clouds meet a little before atoms do, so bridges stay visible
  var LOBE_REACH = 8;       // along a lone pair, the lobe (not the atom) is the contact surface
  var CUTOFF = 200;         // centre distance where all interaction fades to zero
  var MOB = 1;
  var ROT_MOB = 0.045;
  var MAX_STEP = 2.0;       // model units / frame
  var MAX_SPIN = 0.06;      // rad / frame
  var SMOOTH = 0.4;         // 0..1 share of each new step taken this frame (lower = smoother)
  var MAX_PAIR_F = 3.0;
  var MAX_IND_F = 1.2;
  var TIER = { soft: 0.75, medium: 1, strong: 1.3 };
  // teaching overrides on top of the site model: keep the textbook strength order
  var BOOST = { 'ion-dipole': 1.6, 'hydrogen-bond': 1.7 };
  var HB_SHARED = 0.35;     // extra H···acceptor links while the pair is still approaching
  var HB_EXTRA = 0.1;       // extra links once the primary H-bond has docked: no ring, no two H on one O
  var HB_DOCKED = 40;       // primary donor H ↔ acceptor site distance that counts as (nearly) docked
  var HB_SWITCH = 0.6;      // the primary H-bond only moves when another is clearly stronger (no flicker)

  var POL = { H: 0.3, C: 0.7, N: 0.7, O: 0.6, F: 0.5, Cl: 1.2, Br: 1.6, Ne: 0.6, Ar: 1.1, Na: 0.3 };
  // Pauling electronegativity - Guide intro labels only
  var EN = { H: 2.1, C: 2.5, N: 3.0, O: 3.5, F: 4.0, Cl: 3.0, Br: 2.8, Ne: null, Ar: null, Na: 0.9 };

  // Toy Box atoms: model-kit hues (O red, N blue, C dark, H white), pushed to a softer "vinyl" palette
  var EL = {
    H: ['#ffffff', '#d5d9e3'],
    C: ['#545b6e', '#23272f'],
    O: ['#ff8a6a', '#e0503a'],
    N: ['#8494ff', '#4152d9'],
    F: ['#86e3b0', '#2f9e6a'],
    Cl: ['#bce673', '#69a42b'],
    Br: ['#d98463', '#8a3b22'],
    Ne: ['#86dff0', '#2d9cb6'],
    Ar: ['#e6a8f0', '#a04fb8'],
    Na: ['#c9a8ff', '#7a52e0'],
  };

  // δ+ = red, δ− = yellow, for signs and cloud tints alike
  var POS = '#e8264f';
  var NEG = '#ffc21a';
  var POS_RGB = '232,38,79';
  var NEG_RGB = '255,194,26';
  var NEUTRAL_RGB = '150,160,200';

  // View transitions: layer fades settle in ~3 time constants; molecule swaps dissolve
  var FADE_TAU = 90;
  var DISSOLVE_MS = 320;

  /**
   * Visual theme. Rooms (or the taste comparison page) can pass a partial override.
   * pos/neg carry meaning (δ+ / δ−) and must stay paired with text signs.
   */
  function toyTray(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(29,36,51,0.10)';
    for (var x = 11; x < w; x += 22) {
      for (var y = 11; y < h; y += 22) ctx.fillRect(x, y, 1.4, 1.4);
    }
    var g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(214,222,235,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  var DEFAULT_THEME = {
    bg: ['#ffffff', '#e6eaf1'],
    paintBg: toyTray,         // optional function(ctx, cssW, cssH) replacing the gradient
    text: '#1d2433',
    halo: 'rgba(255,255,255,0.96)',
    font: '"Space Grotesk", Helvetica, sans-serif',
    formulaFont: '700 12px "Space Mono", ui-monospace, monospace',
    pos: POS,
    neg: NEG,
    posRgb: POS_RGB,
    negRgb: NEG_RGB,
    neutralRgb: NEUTRAL_RGB,
    // δ signs drawn as pills: { pos: textColour, neg: textColour }, or null for haloed text
    badge: { pos: '#ffffff', neg: '#1d2433', edge: 'rgba(29,36,51,0.9)' },
    el: EL,
    rim: 'rgba(40,48,66,0.55)',
    behindAlpha: 0.9,
    gloss: 0.18,              // 0–1 crisp specular dot on atoms
    cloudBlend: 'source-over',
    cloudAlpha: 1.7,
    lobeAlpha: 1.15,
    lobeDot: 'rgba(196,128,0,0.95)', // Lewis-style electron pair inside each front lobe, or null; keep distinct from ink bridges
    shadow: { rgb: '29,36,51', alpha: 0.2, dy: 9 }, // soft contact shadow under atoms, or null
    pullRgb: '29,36,51',
    pullGlowRgb: '255,255,255',
    pushRgb: '29,36,51',
    ionText: '#ffffff',
  };

  function mergeTheme(over) {
    var t = {};
    Object.keys(DEFAULT_THEME).forEach(function (k) {
      t[k] = over && over[k] !== undefined ? over[k] : DEFAULT_THEME[k];
    });
    return t;
  }

  function deg(d) {
    return (d * Math.PI) / 180;
  }

  // depth: -1 into the page (drawn behind the atoms, smaller), +1 out of it (larger), 0 in plane
  function lp(cx, cy, angDeg, site, lobe, q, depth) {
    var t = deg(angDeg);
    return {
      x: cx + Math.cos(t) * site,
      y: cy + Math.sin(t) * site,
      lx: cx + Math.cos(t) * lobe,
      ly: cy + Math.sin(t) * lobe,
      ang: t,
      q: q,
      cx: cx,
      cy: cy,
      behind: depth < 0,
      depth: depth || 0,
    };
  }

  /**
   * Simplified space-filling geometry (model units).
   * atoms: { el, x, y, r, q, z }  z < 0 draws behind (fake depth)
   * lps:   lone-pair lobes that also carry δ− charge
   * labels: upright δ / charge text anchors
   */
  function buildGeometry() {
    var G = {};

    G.ne = { atoms: [{ el: 'Ne', x: 0, y: 0, r: 14 }] };

    // small nucleus + core, big soft valence cloud: cloud scales the pad, shell keeps partners at its edge
    G.ar = { atoms: [{ el: 'Ar', x: 0, y: 0, r: 9 }], cloud: 2.2, shell: 9 };

    G.na = {
      atoms: [{ el: 'Na', x: 0, y: 0, r: 12, q: 1 }],
      labels: [{ x: 0, y: 0, t: '+', big: true }],
    };

    G.ch4 = {
      atoms: [
        { el: 'H', x: 0, y: -15, r: 10, z: -1 },
        { el: 'C', x: 0, y: 0, r: 15 },
        { el: 'H', x: -14, y: 9, r: 10 },
        { el: 'H', x: 14, y: 9, r: 10 },
        { el: 'H', x: 0, y: 6, r: 9.5, z: 1 },
      ],
    };

    // like Ar: compact atoms inside a big, squishy, polarizable cloud (vs CH₄'s tight one)
    G.br2 = {
      atoms: [
        { el: 'Br', x: -10, y: 0, r: 13 },
        { el: 'Br', x: 10, y: 0, r: 13 },
      ],
      cloud: 2.4,
      shell: 8,
    };

    G.co2 = {
      atoms: [
        { el: 'O', x: -21, y: 0, r: 14 },
        { el: 'C', x: 0, y: 0, r: 14 },
        { el: 'O', x: 21, y: 0, r: 14 },
      ],
    };

    G.hcl = {
      atoms: [
        { el: 'H', x: -17, y: 0, r: 10, q: 0.45 },
        { el: 'Cl', x: 5, y: 0, r: 18, q: -0.45 },
      ],
      bonds: [[0, 1]],
      labels: [
        { x: -17, y: 0, t: 'δ+', out: [-1, 0] },
        { x: 5, y: 0, t: 'δ−', out: [1, 0] },
      ],
    };

    G.hf = {
      atoms: [
        { el: 'H', x: -15, y: 0, r: 10, q: 0.6 },
        { el: 'F', x: 4, y: 0, r: 14 },
      ],
      lps: [lp(4, 0, 0, 15, 16, -0.2), lp(4, 0, -115, 15, 16, -0.2), lp(4, 0, 115, 15, 16, -0.2)],
      labels: [
        { x: -15, y: 0, t: 'δ+', out: [-1, 0] },
        { x: 4, y: 0, t: 'δ−', out: [1, 0] },
      ],
    };

    G.h2o = {
      atoms: [
        { el: 'O', x: 0, y: -3, r: 15 },
        { el: 'H', x: -13.4, y: 7.5, r: 10, q: 0.42 },
        { el: 'H', x: 13.4, y: 7.5, r: 10, q: 0.42 },
      ],
      // Tetrahedral "rabbit ears" with depth: H–O–H lies in the page, one lone pair leans into the
      // page (left: shorter, smaller, behind O) and one comes out of it (right: longer, larger).
      // The docking sites stay the same distance out so both accept H-bonds alike.
      lps: [lp(0, -3, -132, 17, 18.5, -0.42, -1), lp(0, -3, -50, 17, 20, -0.42, 1)],
      labels: [
        { x: 0, y: -3, t: 'δ−', out: [0, -1] },
        { x: -13.4, y: 7.5, t: 'δ+', out: [-0.8, 0.6] },
        { x: 13.4, y: 7.5, t: 'δ+', out: [0.8, 0.6] },
      ],
    };

    G.nh3 = {
      atoms: [
        { el: 'H', x: 0, y: 13, r: 9.5, z: -1, q: 0.2 },
        { el: 'N', x: 0, y: -3, r: 15.5 },
        { el: 'H', x: -15, y: 6, r: 10, q: 0.2 },
        { el: 'H', x: 15, y: 6, r: 10, q: 0.2 },
      ],
      lps: [lp(0, -3, -90, 18, 19, -0.6)],
      labels: [
        { x: 0, y: -3, t: 'δ−', out: [0, -1] },
        { x: -15, y: 6, t: 'δ+', out: [-0.8, 0.6] },
        { x: 15, y: 6, t: 'δ+', out: [0.8, 0.6] },
      ],
    };

    G.ch3oh = {
      atoms: [
        { el: 'H', x: -11, y: -14, r: 9.5, z: -1 },
        { el: 'C', x: -11, y: 0, r: 15 },
        { el: 'H', x: -25, y: -4, r: 10 },
        { el: 'H', x: -18, y: 11, r: 10 },
        { el: 'O', x: 9, y: 0, r: 14.5 },
        { el: 'H', x: 17, y: 13, r: 10, q: 0.45 },
      ],
      lps: [lp(9, 0, -100, 16, 17, -0.225), lp(9, 0, -25, 16, 17, -0.225)],
      labels: [
        { x: 9, y: 0, t: 'δ−', out: [0.5, -1] },
        { x: 17, y: 13, t: 'δ+', out: [0.6, 0.8] },
      ],
    };

    // Acetone: polar C=O, no O–H, so between two acetones it's dipole-dipole (no H-bond)
    G.acetone = {
      atoms: [
        { el: 'O', x: 0, y: -18, r: 13 },
        { el: 'C', x: 0, y: -1, r: 12.5, q: 0.4 },
        { el: 'C', x: -18, y: 8, r: 13 },
        { el: 'H', x: -30, y: 3, r: 8.5 },
        { el: 'H', x: -20, y: 20, r: 8.5, z: 1 },
        { el: 'C', x: 18, y: 8, r: 13 },
        { el: 'H', x: 30, y: 3, r: 8.5 },
        { el: 'H', x: 20, y: 20, r: 8.5, z: 1 },
      ],
      lps: [lp(0, -18, -125, 14, 15, -0.2), lp(0, -18, -55, 14, 15, -0.2)],
      labels: [
        { x: 0, y: -18, t: 'δ−', out: [0, -1] },
        { x: 0, y: -1, t: 'δ+', out: [0, 1] },
      ],
    };

    var oct = [];
    for (var i = 0; i < 8; i++) {
      oct.push({ el: 'C', x: -49 + i * 14, y: i % 2 ? 4 : -4, r: 12 });
    }
    G.octane = { atoms: oct };

    var gl = [];
    var glLabels = [];
    var ohAt = [0, 1, 2, 4];
    for (var k = 0; k < 6; k++) {
      var t = deg(-90 + k * 60);
      var ringO = k === 5;
      gl.push({
        el: ringO ? 'O' : 'C',
        x: Math.cos(t) * 17,
        y: Math.sin(t) * 17,
        r: 11.5,
        q: ringO ? -0.2 : k === 0 || k === 4 ? 0.1 : 0,
      });
    }
    ohAt.forEach(function (k2) {
      var t2 = deg(-90 + k2 * 60);
      var ox = Math.cos(t2) * 32;
      var oy = Math.sin(t2) * 32;
      var t3 = t2 + deg(28);
      gl.push({ el: 'O', x: ox, y: oy, r: 10.5, q: -0.4 });
      gl.push({ el: 'H', x: ox + Math.cos(t3) * 12, y: oy + Math.sin(t3) * 12, r: 7.5, q: 0.4 });
      glLabels.push({ x: ox + Math.cos(t3) * 12, y: oy + Math.sin(t3) * 12, t: 'δ+', out: [Math.cos(t3), Math.sin(t3)], small: true });
    });
    G.glucose = { atoms: gl, labels: glLabels };

    var HB = { h2o: 1, nh3: 1, hf: 1, ch3oh: 1, glucose: 1, acetone: 1 };

    Object.keys(G).forEach(function (id) {
      var g = G[id];
      g.lps = g.lps || [];
      g.labels = g.labels || [];
      g.bonds = g.bonds || [];
      if (!g.bonds.length && g.atoms.length === 2) g.bonds = [[0, 1]];
      g.sites = [];
      var R = 0;
      var I = 0;
      g.atoms.forEach(function (a, ai) {
        a.q = a.q || 0;
        a.z = a.z || 0;
        a.pol = POL[a.el] || 0.5;
        a.hbDon = !!(HB[id] && a.el === 'H' && a.q > 0);
        a.lpDirs = HB[id]
          ? g.lps
              .filter(function (l) {
                return l.cx === a.x && l.cy === a.y;
              })
              .map(function (l) {
                return l.ang;
              })
          : [];
        if (a.q) {
          var hb = null;
          if (a.hbDon) hb = 'don';
          else if (HB[id] && a.q < 0 && !g.lps.length && /^(O|N|F)$/.test(a.el)) hb = 'acc';
          g.sites.push({ x: a.x, y: a.y, q: a.q, hb: hb, grp: 'at' + ai });
        }
        R = Math.max(R, Math.sqrt(a.x * a.x + a.y * a.y) + a.r);
        I += a.x * a.x + a.y * a.y + 0.4 * a.r * a.r;
      });
      // lone pairs on one atom form one acceptor (in projection they are the same spot)
      g.lps.forEach(function (l) {
        g.sites.push({ x: l.x, y: l.y, q: l.q, hb: HB[id] ? 'acc' : null, grp: 'lp' + l.cx + ',' + l.cy });
      });
      g.polar = g.sites.length > 0;
      var accGroups = {};
      g.sites.forEach(function (s) {
        if (s.hb === 'acc') accGroups[s.grp] = 1;
      });
      g.multiHB = Object.keys(accGroups).length > 1;
      g.shell = g.shell || 0;
      g.R = R + g.shell;
      g.inertia = Math.max(1, I / 100);
      g.mass = 1 + 0.15 * g.atoms.length;
      g.alpha = g.atoms.reduce(function (s, a) {
        return s + a.pol;
      }, 0);
    });
    return G;
  }

  var GEOM = buildGeometry();

  function prefersReduced() {
    try {
      return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function len(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function shortestAngle(from, to) {
    var d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function smoothFade(d) {
    if (d >= CUTOFF) return 0;
    var inner = CUTOFF * 0.7;
    if (d <= inner) return 1;
    var u = (CUTOFF - d) / (CUTOFF - inner);
    return u * u * (3 - 2 * u);
  }

  function makeBody(mol, x, y, angle, seed) {
    return {
      id: mol.id,
      mol: mol,
      g: GEOM[mol.id],
      x: x,
      y: y,
      angle: angle || 0,
      spinLeft: 0,
      seed: seed,
      fx: 0,
      fy: 0,
      torque: 0,
      pullX: 0,
      pullY: 0,
      tdip: { x: 0, y: 0, amp: 0 },
      ldfNear: 0,
      field: { x: 0, y: 0 },
      // smoothed step (see SMOOTH) and per-frame neighbour bookkeeping from computeForces
      vx: 0,
      vy: 0,
      vs: 0,
      pushing: false,
      near: false,
      nearest: null,
      nearGap: Infinity,
    };
  }

  function toWorld(body, p) {
    var c = Math.cos(body.angle);
    var s = Math.sin(body.angle);
    return { x: body.x + p.x * c - p.y * s, y: body.y + p.x * s + p.y * c };
  }

  function worldSites(body) {
    return body.g.sites.map(function (s) {
      var w = toWorld(body, s);
      w.q = s.q;
      w.hb = s.hb;
      w.grp = s.grp;
      return w;
    });
  }

  function worldAtoms(body) {
    return body.g.atoms.map(function (a) {
      var w = toWorld(body, a);
      w.r = a.r;
      w.pol = a.pol;
      w.src = a;
      return w;
    });
  }

  function lobeReach(other, host, hostBody) {
    if (!host.src.lpDirs.length) return 0;
    var d = len(other.x - host.x, other.y - host.y) || 1;
    var ux = (other.x - host.x) / d;
    var uy = (other.y - host.y) / d;
    var best = -1;
    host.src.lpDirs.forEach(function (ang) {
      var wa = ang + hostBody.angle;
      best = Math.max(best, ux * Math.cos(wa) + uy * Math.sin(wa));
    });
    return LOBE_REACH * clamp((best - 0.75) / 0.25, 0, 1);
  }

  function fieldAt(sites, px, py) {
    var ex = 0;
    var ey = 0;
    for (var i = 0; i < sites.length; i++) {
      var dx = px - sites[i].x;
      var dy = py - sites[i].y;
      var d2 = dx * dx + dy * dy + SOFT2;
      var inv = sites[i].q / (d2 * Math.sqrt(d2));
      ex += dx * inv;
      ey += dy * inv;
    }
    return { x: ex, y: ey };
  }

  /* ---------- lobed clouds (molecules with lone pairs) ---------- */

  // Two lone pairs on one atom fan out to the tetrahedral angle in the cloud, so water reads as
  // four lobes (two H, two lone pairs) rather than a teardrop. The docking sites stay put.
  var LP_FAN = deg(54.75);
  var LOBE_K = 0.45;        // log-sum-exp sharpness: higher = crisper creases between lobes

  /** Cloud lobes in model units: a round lobe per atom and a fatter one per lone pair. */
  function cloudLobes(g, pad) {
    // the atom carrying the lone pairs stays a small core so the lobes around it stand out
    var hosts = {};
    g.lps.forEach(function (l) {
      hosts[l.cx + ',' + l.cy] = true;
    });
    var lobes = g.atoms.map(function (a) {
      return { x: a.x, y: a.y, r: a.r + pad * (hosts[a.x + ',' + a.y] ? 0.15 : 0.45) };
    });
    var groups = {};
    g.lps.forEach(function (l) {
      var k = l.cx + ',' + l.cy;
      (groups[k] = groups[k] || []).push(l);
    });
    Object.keys(groups).forEach(function (k) {
      var ls = groups[k];
      var angs = ls.map(function (l) {
        return l.ang;
      });
      if (ls.length === 2) {
        var d = Math.atan2(Math.sin(angs[1] - angs[0]), Math.cos(angs[1] - angs[0]));
        if (Math.abs(d) < deg(70)) {
          var m = angs[0] + d / 2;
          var sgn = d < 0 ? -1 : 1;
          angs = [m - sgn * LP_FAN, m + sgn * LP_FAN];
        }
      }
      ls.forEach(function (l, i) {
        var reach = len(l.lx - l.cx, l.ly - l.cy) + pad * 0.35;
        var persp = 1 + 0.07 * l.depth;
        lobes.push({ x: l.cx + Math.cos(angs[i]) * reach, y: l.cy + Math.sin(angs[i]) * reach, r: (10 + pad * 0.5) * persp });
      });
    });
    return lobes;
  }

  /**
   * Smooth union of round lobes as a radius from (ox, oy) in each of n directions, the i-th at
   * angle 2πi/n from the axis (ux, uy). Log-sum-exp keeps the creases between lobes soft.
   */
  function lobedRadii(lobes, ox, oy, ux, uy, n, out) {
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var dx = ux * Math.cos(t) - uy * Math.sin(t);
      var dy = ux * Math.sin(t) + uy * Math.cos(t);
      var sum = 0;
      for (var j = 0; j < lobes.length; j++) {
        var px = lobes[j].x - ox;
        var py = lobes[j].y - oy;
        var along = px * dx + py * dy;
        var perp = Math.abs(px * dy - py * dx);
        var r = lobes[j].r;
        var reach = perp < r ? along + Math.sqrt(r * r - perp * perp) : along - (perp - r) * 1.5;
        sum += Math.exp(LOBE_K * reach);
      }
      out[i] = Math.max(0, Math.log(sum) / LOBE_K);
    }
    return out;
  }

  function minGap(A, B) {
    var aa = worldAtoms(A);
    var bb = worldAtoms(B);
    var best = Infinity;
    for (var i = 0; i < aa.length; i++) {
      for (var j = 0; j < bb.length; j++) {
        var g = len(bb[j].x - aa[i].x, bb[j].y - aa[i].y) - aa[i].r - bb[j].r - A.g.shell - B.g.shell;
        if (g < best) best = g;
      }
    }
    return best;
  }

  function create(opts) {
    var canvas = opts.canvas;
    if (!canvas || !canvas.getContext) throw new Error('ImfEngine.create requires a canvas');

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var reduced = prefersReduced();
    var running = false;
    var raf = 0;
    var clock = 0;
    var showLabels = !!opts.showForceLabels;
    var showDeltas = opts.showDeltas !== false;
    var showClouds = opts.showClouds !== false;
    var showBonds = !!opts.showBonds;
    var showEN = !!opts.showEN;
    var showLobes = opts.showLobes !== false;
    var showSharedElectrons = !!opts.showSharedElectrons;
    // Guide: valence electrons zipping through the cloud
    var showCloudElectrons = !!opts.showCloudElectrons;
    // 'off' | 'neutral' | 'polar' : polar uses charge tint; neutral is even grey-blue
    var cloudMode = opts.cloudMode || 'polar';
    // 'round' per-atom halos | 'drop' one squishy teardrop per molecule, swelling toward δ−
    var cloudShape = opts.cloudShape || 'round';
    // 'badge' δ signs in pills | 'plain' bare symbols, letting the cloud colour carry the sign
    var deltaStyle = opts.deltaStyle || 'badge';
    var viewZoom = opts.zoom != null ? +opts.zoom : 1;
    var cloudPad = opts.cloudPad != null ? +opts.cloudPad : 16;
    // Guide: dissolve the old frame when the molecules change
    var crossfade = !!opts.crossfade;
    var dissolve = null;
    var snapCanvas = null;
    // Drawn strength of each layer (0..1), eased toward the show* flags so view changes fade
    var fade = fadeTargets();
    // Solo layout eases too: scale (zoom) and vertical anchor
    var soloY = 0.5;
    var layoutAnim = false;
    var solo = false;
    // H-bond hysteresis per molecule pair, keyed 'i|j'
    var hbPrimary = {};
    var pairOutcomes = {};
    // Extra contact padding (model units) so molecules settle with a visible gap
    var spacing = opts.spacing != null ? +opts.spacing : 0;
    // Seconds the formula labels stay up after a scene appears (0 = always)
    var formulaHold = opts.formulaHold != null ? +opts.formulaHold : 0;
    // Guide: a new scene waits, spread out, until the user grabs a molecule
    var holdUntilDrag = !!opts.holdUntilDrag;
    var waiting = false;
    var sceneStart = 0;
    var T = mergeTheme(opts.theme);
    var onStatus = typeof opts.onStatus === 'function' ? opts.onStatus : null;
    var status = '';
    var outcome = null;
    // All molecules on the tray; a and b alias the first two (Turn A / Turn B, status, Sandbox)
    var bodies = [];
    var a = null;
    var b = null;
    var drag = null;
    var tween = null;
    var bridges = [];
    var cssW = 640;
    var cssH = 360;
    var S = 1;
    var W = 640;
    var H = 360;

    function computeScaleFor(molR) {
      if (solo && molR) {
        // Target on-screen size as a fraction of the tray (zoom raises the fraction).
        // Bond-focus stretch widens the molecule, so use the stretched span.
        var span = showSharedElectrons ? molR * 2 * 1.85 : molR * 2;
        var frac = clamp(0.42 * (viewZoom || 1), 0.38, 0.62);
        var fill = Math.min(cssW, cssH) * frac;
        return clamp(fill / Math.max(28, span), 1.4, 4.0);
      }
      return clamp(Math.min(cssW / 430, cssH / 220) * (viewZoom || 1), 0.8, 3.2);
    }

    function computeScale() {
      return computeScaleFor(a && a.g ? a.g.R : 0);
    }

    function fadeTargets() {
      return {
        clouds: showClouds && cloudMode !== 'off' ? 1 : 0,
        polar: cloudMode === 'neutral' ? 0 : 1,
        drop: cloudShape === 'drop' ? 1 : 0,
        badges: deltaStyle === 'badge' ? 1 : 0,
        bonds: showBonds ? 1 : 0,
        en: showEN ? 1 : 0,
        deltas: showDeltas ? 1 : 0,
        lobes: showLobes ? 1 : 0,
        shared: showSharedElectrons ? 1 : 0,
        electrons: showCloudElectrons ? 1 : 0,
        labels: showLabels ? 1 : 0,
      };
    }

    // Leave headroom for EN labels above the molecule
    function soloYTarget() {
      return showEN ? 0.58 : 0.5;
    }

    function placeSolo() {
      if (!solo || !a) return;
      a.x = W * 0.5;
      a.y = H * soloY;
    }

    /** Jump straight to the current view (new molecules, first paint, reduced motion). */
    function snapView() {
      fade = fadeTargets();
      soloY = soloYTarget();
      S = computeScale();
      W = cssW / S;
      H = cssH / S;
      placeSolo();
      layoutAnim = false;
    }

    function animateView(dt) {
      var k = reduced ? 1 : 1 - Math.exp(-dt / FADE_TAU);
      var tg = fadeTargets();
      Object.keys(tg).forEach(function (key) {
        fade[key] += (tg[key] - fade[key]) * k;
        if (Math.abs(tg[key] - fade[key]) < 0.003) fade[key] = tg[key];
      });
      if (!solo || !a) return;
      var ts = computeScale();
      var ty = soloYTarget();
      S += (ts - S) * k;
      soloY += (ty - soloY) * k;
      var settled = Math.abs(ts - S) < 0.002 && Math.abs(ty - soloY) < 0.001;
      if (settled) {
        S = ts;
        soloY = ty;
      }
      W = cssW / S;
      H = cssH / S;
      if (layoutAnim && !drag) placeSolo();
      if (settled) layoutAnim = false;
    }

    function beginDissolve() {
      if (!crossfade || reduced || !a || !global.document) return;
      if (!snapCanvas) snapCanvas = global.document.createElement('canvas');
      snapCanvas.width = canvas.width;
      snapCanvas.height = canvas.height;
      snapCanvas.getContext('2d').drawImage(canvas, 0, 0);
      dissolve = { t: 0 };
    }

    function resize() {
      var oldW = W;
      var oldH = H;
      cssW = canvas.clientWidth || opts.width || 640;
      cssH = canvas.clientHeight || opts.height || 360;
      S = computeScale();
      W = cssW / S;
      H = cssH / S;
      // Assigning width/height clears the canvas, so only do it on a real size change
      var pw = Math.round(cssW * dpr);
      var ph = Math.round(cssH * dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      if (a && oldW && oldH) {
        if (solo) {
          placeSolo();
        } else {
          bodies.forEach(function (body) {
            body.x *= W / oldW;
            body.y *= H / oldH;
            walls(body);
          });
        }
      }
    }

    function contactPad() {
      return CONTACT_PAD + spacing;
    }

    // Where the k-th of n partners sits around A: two fan out right (a triangle, wider than
    // tall), three or more ring A evenly
    function clusterAngle(k, n) {
      if (n === 2) return (k ? 1 : -1) * deg(40);
      var off = n % 2 === 0 ? Math.PI / n : 0;
      return off + (k * Math.PI * 2) / n;
    }

    // Partners at distance dist(body, angle) around A, the group centred on the tray
    function clusterPoses(dist) {
      var n = bodies.length - 1;
      var pts = bodies.map(function (body, i) {
        if (!i) return { x: 0, y: 0 };
        var t = clusterAngle(i - 1, n);
        var D = dist(body, t);
        return { x: Math.cos(t) * D, y: Math.sin(t) * D };
      });
      var x0 = Infinity;
      var x1 = -Infinity;
      var y0 = Infinity;
      var y1 = -Infinity;
      pts.forEach(function (p, i) {
        var R = bodies[i].g.R;
        x0 = Math.min(x0, p.x - R);
        x1 = Math.max(x1, p.x + R);
        y0 = Math.min(y0, p.y - R);
        y1 = Math.max(y1, p.y + R);
      });
      var ox = W / 2 - (x0 + x1) / 2;
      var oy = H / 2 - (y0 + y1) / 2;
      return pts.map(function (p) {
        return { x: p.x + ox, y: p.y + oy };
      });
    }

    // Spread-out start: two molecules side by side; more go in a staggered row across the wide
    // tray, the first (A) in the middle
    function homePoses() {
      if (bodies.length === 2) {
        return [
          { x: W * 0.24, y: H * 0.5 },
          { x: W * 0.76, y: H * 0.5 },
        ];
      }
      var n = bodies.length;
      var order = bodies.slice(1);
      order.splice(Math.floor((n - 1) / 2), 0, bodies[0]);
      var poses = [];
      order.forEach(function (body, k) {
        var stagger = n > 3 ? (k % 2 ? 1 : -1) * H * 0.1 : 0;
        poses[bodies.indexOf(body)] = { x: (W * (k + 0.5)) / n, y: H * 0.5 + stagger };
      });
      return poses;
    }

    function placeDefault() {
      if (bodies.length < 2) return;
      tween = null;
      homePoses().forEach(function (p, i) {
        var body = bodies[i];
        body.x = p.x;
        body.y = p.y;
        body.angle = body.initAngle;
        body.spinLeft = body.vx = body.vy = body.vs = 0;
        walls(body);
      });
    }

    function setPair(idA, idB) {
      setScene([idA, idB]);
    }

    /** Put several molecules on the tray; every pair interacts. ids[0] and ids[1] are A and B. */
    function setScene(ids) {
      if (!ids || ids.length < 2) return;
      var mols = ids.map(function (id) {
        return GEOM[id] ? global.ImfMolecules.get(id) : null;
      });
      if (mols.some(function (m) {
        return !m;
      })) return;
      beginDissolve();
      solo = false;
      showSharedElectrons = false;
      hbPrimary = {};
      pairOutcomes = {};
      for (var i = 0; i < ids.length; i++) {
        for (var j = i + 1; j < ids.length; j++) pairOutcomes[i + '|' + j] = global.ImfPairs.resolve(ids[i], ids[j]);
      }
      outcome = pairOutcomes['0|1'];
      snapView();
      bodies = mols.map(function (m, k) {
        var body = makeBody(m, 0, 0, 0, 0.3 + k * 1.8);
        // extras start at varied angles so a cluster doesn't look stamped out
        body.initAngle = k < 2 ? 0 : (k * 2.4) % (Math.PI * 2);
        return body;
      });
      a = bodies[0];
      b = bodies[1];
      sceneStart = clock;
      waiting = holdUntilDrag;
      placeDefault();
      status = '';
      computeForces();
      emitStatus();
    }

    function setSolo(id) {
      var m = global.ImfMolecules.get(id);
      if (!m || !GEOM[id]) return;
      beginDissolve();
      solo = true;
      hbPrimary = {};
      outcome = null;
      bridges = [];
      drag = null;
      a = makeBody(m, 0, 0, 0, 0.3);
      b = null;
      bodies = [a];
      snapView();
      status = '';
      if (onStatus) onStatus('');
    }

    function setView(view) {
      if (!view) return;
      if (view.showForceLabels !== undefined) showLabels = !!view.showForceLabels;
      if (view.showDeltas !== undefined) showDeltas = !!view.showDeltas;
      if (view.showClouds !== undefined) showClouds = !!view.showClouds;
      if (view.showBonds !== undefined) showBonds = !!view.showBonds;
      if (view.showEN !== undefined) showEN = !!view.showEN;
      if (view.showLobes !== undefined) showLobes = !!view.showLobes;
      if (view.showSharedElectrons !== undefined) showSharedElectrons = !!view.showSharedElectrons;
      if (view.showCloudElectrons !== undefined) showCloudElectrons = !!view.showCloudElectrons;
      if (view.cloudMode !== undefined) cloudMode = view.cloudMode || 'polar';
      if (view.cloudShape !== undefined) cloudShape = view.cloudShape || 'round';
      if (view.deltaStyle !== undefined) deltaStyle = view.deltaStyle || 'badge';
      if (view.zoom !== undefined) viewZoom = Math.max(0.5, +view.zoom || 1);
      if (view.cloudPad !== undefined) cloudPad = Math.max(6, +view.cloudPad || 16);
      if (view.spacing !== undefined) spacing = Math.max(0, +view.spacing || 0);
      if (view.formulaHold !== undefined) formulaHold = Math.max(0, +view.formulaHold || 0);
      if (view.holdUntilDrag !== undefined) holdUntilDrag = !!view.holdUntilDrag;
      // Layers, zoom and anchor ease toward the new view in animateView
      layoutAnim = solo;
      if (reduced) snapView();
      if (!solo && bodies.length > 1) rescaleKeepCentre();
    }

    // Zoom change with molecules already out: keep the group centred on the tray
    function rescaleKeepCentre() {
      var oW = W;
      var oH = H;
      S = computeScale();
      W = cssW / S;
      H = cssH / S;
      if (W === oW && H === oH) return;
      bodies.forEach(function (body) {
        body.x += (W - oW) / 2;
        body.y += (H - oH) / 2;
        walls(body);
      });
    }

    function walls(body) {
      var m = body.g.R + 6;
      body.x = clamp(body.x, m, Math.max(m, W - m));
      body.y = clamp(body.y, m, Math.max(m, H - m));
    }

    /* ---------- forces ---------- */

    function computeForces() {
      bridges = [];
      bodies.forEach(function (body) {
        body.fx = body.fy = body.torque = 0;
        body.pullX = body.pullY = 0;
        body.field.x = body.field.y = 0;
        body.pushing = false;
        body.near = false;
        body.nearest = null;
        body.nearGap = Infinity;
      });
      if (bodies.length < 2) return { radial: 0, gap: Infinity, dist: Infinity };
      var main = null;
      for (var i = 0; i < bodies.length; i++) {
        for (var j = i + 1; j < bodies.length; j++) {
          var info = pairForces(bodies[i], bodies[j], i + '|' + j);
          if (i === 0 && j === 1) main = info;
        }
      }
      // cloud squish cue: sum of leans toward each partner, capped
      bodies.forEach(function (body) {
        var m = len(body.pullX, body.pullY);
        if (m > 3.5) {
          body.pullX *= 3.5 / m;
          body.pullY *= 3.5 / m;
        }
      });
      return main;
    }

    /** Forces between one pair of molecules (A before B in the scene). Info feeds status. */
    function pairForces(A, B, key) {
      var oc = pairOutcomes[key];
      var dx = B.x - A.x;
      var dy = B.y - A.y;
      var dist = len(dx, dy) || 0.0001;
      var fade = smoothFade(dist);
      var mult = (TIER[oc && oc.attraction] || 1) * (BOOST[oc && oc.force] || 1);
      var radial = 0;
      var esPush = false;
      var esRadialOut = 0;

      function apply(body, px, py, fx, fy) {
        body.fx += fx;
        body.fy += fy;
        body.torque += (px - body.x) * fy - (py - body.y) * fx;
      }

      var sa = worldSites(A);
      var sb = worldSites(B);
      if (fade > 0) {
        // permanent charges: like repels, opposite attracts; off-centre → torque
        var cand = [];
        var esX = 0;
        var esY = 0;
        var esPairs = [];
        for (var i = 0; i < sa.length; i++) {
          for (var j = 0; j < sb.length; j++) {
            var rx = sb[j].x - sa[i].x;
            var ry = sb[j].y - sa[i].y;
            var r2 = rx * rx + ry * ry;
            var r = Math.sqrt(r2) || 0.0001;
            var qq = sa[i].q * sb[j].q;
            var f = (KE * qq) / (r2 + SOFT2);
            if (qq < 0) f *= mult;
            f *= fade;
            var hbPair =
              f < 0 &&
              ((sa[i].hb === 'don' && sb[j].hb === 'acc') || (sa[i].hb === 'acc' && sb[j].hb === 'don'));
            esPairs.push({ i: i, j: j, f: f, ux: rx / r, uy: ry / r, hb: hbPair });
          }
        }

        // H-bonds between the pair all run one way (set by the strongest, with hysteresis) and are
        // one-to-one per H and per acceptor atom. Blocks water's two-bond ring: one linear O–H···O.
        var hbList = esPairs.filter(function (p) {
          return p.hb;
        });
        if (hbList.length) {
          var keyOf = function (p) {
            return sa[p.i].grp + '|' + sb[p.j].grp;
          };
          var bestHb = hbList.reduce(function (m, p) {
            return p.f < m.f ? p : m;
          });
          var keep = null;
          hbList.forEach(function (p) {
            if (keyOf(p) === hbPrimary[key]) keep = p;
          });
          if (!keep || keep.f > bestHb.f * HB_SWITCH) keep = bestHb;
          hbPrimary[key] = keyOf(keep);
          var aDonates = sa[keep.i].hb === 'don';
          // molecules with several acceptor atoms (glucose) really can hold more than one H-bond
          var docked =
            !A.g.multiHB && !B.g.multiHB && len(sb[keep.j].x - sa[keep.i].x, sb[keep.j].y - sa[keep.i].y) < HB_DOCKED;
          var used = {};
          used['a' + sa[keep.i].grp] = used['b' + sb[keep.j].grp] = true;
          hbList
            .slice()
            .sort(function (m, n) {
              return m.f - n.f;
            })
            .forEach(function (p) {
              if (keyOf(p) === hbPrimary[key]) return;
              var ka = 'a' + sa[p.i].grp;
              var kb = 'b' + sb[p.j].grp;
              if ((sa[p.i].hb === 'don') !== aDonates || used[ka] || used[kb]) p.f *= docked ? HB_EXTRA : HB_SHARED;
              else used[ka] = used[kb] = true;
            });
        } else {
          hbPrimary[key] = null;
        }

        esPairs.forEach(function (p) {
          p.fx = p.ux * p.f;
          p.fy = p.uy * p.f;
          esX += p.fx;
          esY += p.fy;
          cand.push({ a: sa[p.i], b: sb[p.j], f: p.f });
        });
        var esMag = len(esX, esY);
        var scale = esMag > MAX_PAIR_F ? MAX_PAIR_F / esMag : 1;
        esPairs.forEach(function (p) {
          // force on B is +f along A→B; on A it is the reverse
          apply(B, sb[p.j].x, sb[p.j].y, p.fx * scale, p.fy * scale);
          apply(A, sa[p.i].x, sa[p.i].y, -p.fx * scale, -p.fy * scale);
        });
        radial += ((esX * dx + esY * dy) / dist) * scale;

        cand.sort(function (m, n) {
          return Math.abs(n.f) - Math.abs(m.f);
        });
        var esRadial = ((esX * dx + esY * dy) / dist) * scale;
        esPush = esRadial > 0.005;
        esRadialOut = esRadial;
        var wantKind = esRadial > 0.02 ? 'push' : esRadial < -0.02 ? 'pull' : null;
        var top = 0;
        var shown = 0;
        var shownGroups = {};
        // a cluster shows each pair's main link only, so the lines stay readable
        var maxShown = bodies.length > 2 ? 1 : 2;
        for (var c = 0; c < cand.length && shown < maxShown && wantKind; c++) {
          var cf = cand[c].f * scale;
          var kind = cf < 0 ? 'pull' : 'push';
          if (kind !== wantKind || Math.abs(cf) < 0.05) continue;
          // a lone pair drawn front + back is one acceptor: one line, not two
          var gk = cand[c].a.grp + '|' + cand[c].b.grp;
          if (shownGroups[gk]) continue;
          shownGroups[gk] = true;
          if (!top) top = Math.abs(cf);
          if (Math.abs(cf) < top * 0.45) break;
          bridges.push({ a: cand[c].a, b: cand[c].b, s: clamp(Math.abs(cf) / 0.9, 0.15, 1), kind: kind });
          shown++;
        }

        // induced dipole: each atom of a nonpolar partner is pulled toward stronger field
        [[A, B, sb], [B, A, sa]].forEach(function (trip) {
          var target = trip[0];
          var source = trip[1];
          var srcSites = trip[2];
          if (target.g.polar || !srcSites.length) return;
          var h = 1.5;
          var e0 = fieldAt(srcSites, target.x, target.y);
          target.field.x += e0.x;
          target.field.y += e0.y;
          function e2(px, py) {
            var e = fieldAt(srcSites, px, py);
            return e.x * e.x + e.y * e.y;
          }
          var parts = [];
          var tx = 0;
          var ty = 0;
          worldAtoms(target).forEach(function (w) {
            var gx = (e2(w.x + h, w.y) - e2(w.x - h, w.y)) / (2 * h);
            var gy = (e2(w.x, w.y + h) - e2(w.x, w.y - h)) / (2 * h);
            var k = 0.5 * IND_K * w.pol * mult * fade;
            parts.push({ x: w.x, y: w.y, fx: gx * k, fy: gy * k });
            tx += gx * k;
            ty += gy * k;
          });
          var tm = len(tx, ty);
          var sc = tm > MAX_IND_F ? MAX_IND_F / tm : 1;
          parts.forEach(function (pt) {
            apply(target, pt.x, pt.y, pt.fx * sc, pt.fy * sc);
          });
          apply(source, source.x, source.y, -tx * sc, -ty * sc);
          var sgn = target === B ? 1 : -1;
          radial += (sgn * sc * (tx * dx + ty * dy)) / dist;
        });
      }

      // dispersion + contact (atom–atom; shape and contact area matter)
      var aa = worldAtoms(A);
      var bb = worldAtoms(B);
      var gapMin = Infinity;
      // two polar molecules: orientation of the dipoles decides attract vs. repel
      var ldfScale = A.g.polar && B.g.polar ? clamp(1 - esRadialOut / 0.03, 0, 1) : 1;
      var ldfX = 0;
      var ldfY = 0;
      for (var p = 0; p < aa.length; p++) {
        for (var q = 0; q < bb.length; q++) {
          var ax = bb[q].x - aa[p].x;
          var ay = bb[q].y - aa[p].y;
          var d = len(ax, ay) || 0.0001;
          var gap = d - aa[p].r - bb[q].r - A.g.shell - B.g.shell - lobeReach(aa[p], bb[q], B) - lobeReach(bb[q], aa[p], A);
          if (gap < gapMin) gapMin = gap;
          var nx = ax / d;
          var ny = ay / d;
          var f2 = 0;
          if (gap < LDF_RANGE) {
            var gg = Math.max(gap, 0) / 7;
            f2 -= (ldfScale * LDF_K * aa[p].pol * bb[q].pol) / (1 + gg * gg);
            ldfX += nx * f2;
            ldfY += ny * f2;
          }
          if (gap < contactPad()) {
            var ov = contactPad() - gap;
            f2 += CONTACT_K * (ov + 0.25 * ov * ov);
          }
          if (f2) {
            var cx = (aa[p].x + bb[q].x) / 2;
            var cy = (aa[p].y + bb[q].y) / 2;
            apply(B, cx, cy, nx * f2, ny * f2);
            apply(A, cx, cy, -nx * f2, -ny * f2);
          }
        }
      }
      radial += (ldfX * dx + ldfY * dy) / dist;

      // lean toward the partner when net non-contact pull is inward
      var inward = Math.max(0, -radial);
      var lean = clamp(inward * 2.5, 0, 3.5);
      A.pullX += (dx / dist) * lean;
      A.pullY += (dy / dist) * lean;
      B.pullX -= (dx / dist) * lean;
      B.pullY -= (dy / dist) * lean;

      var pushing = esPush || radial > 0.02;
      [[A, B], [B, A]].forEach(function (pr) {
        var me = pr[0];
        if (pushing) me.pushing = true;
        if (dist < CUTOFF) me.near = true;
        if (gapMin < me.nearGap) {
          me.nearGap = gapMin;
          me.nearest = pr[1];
        }
      });

      return { radial: radial, gap: gapMin, dist: dist, esPush: esPush };
    }

    function updateTempDipoles() {
      bodies.forEach(function (body, bi) {
        var td = body.tdip;
        if (body.g.polar) {
          td.amp = 0;
          body.ldfNear = 1;
          return;
        }
        // alone, a nonpolar cloud sits small, round and grey; it only starts sloshing near a partner
        var near = clamp(1 - (body.nearGap - 6 - spacing) / 60, 0, 1);
        var t = clock;
        // ease toward the target so the cloud glides rather than jitters
        var dtc = clamp(t - (td.t != null ? td.t : t), 0, 0.1);
        td.t = t;
        var ease = reduced ? 1 : 1 - Math.exp(-dtc / 0.45);
        body.ldfNear += (near - body.ldfNear) * (reduced ? 1 : 1 - Math.exp(-dtc / 0.6));
        near = body.ldfNear;
        var wa = body.seed + t * 0.3 + Math.sin(t * 0.7 + body.seed) * 0.8;
        var wAmp = reduced ? 0 : near * (0.35 + 0.4 * Math.pow(Math.sin(t * 0.9 + body.seed * 3), 2));
        var vx = Math.cos(wa) * wAmp;
        var vy = Math.sin(wa) * wAmp;

        var other = body.nearest;
        if (other && !other.g.polar) {
          // nonpolar neighbours: fluctuations fall into step when close (δ+ faces δ−). Both use
          // the axis from the earlier molecule to the later one, so their dipoles point alike.
          var first = bodies.indexOf(other) < bi ? other : body;
          var second = first === body ? other : body;
          var ux = second.x - first.x;
          var uy = second.y - first.y;
          var ud = len(ux, uy) || 1;
          ux /= ud;
          uy /= ud;
          var corr = clamp(1 - (body.nearGap - 6 - spacing) / 40, 0, 1);
          var s = reduced ? 1 : Math.sin(t * 1.2);
          vx = vx * (1 - corr) + ux * s * corr;
          vy = vy * (1 - corr) + uy * s * corr;
        }
        // induced: δ+ end points along the field from nearby charges
        var ex = body.field.x;
        var ey = body.field.y;
        var em = len(ex, ey);
        if (em > 0) {
          var c = clamp(em / 0.00035, 0, 1);
          vx = vx * (1 - c) + (ex / em) * c;
          vy = vy * (1 - c) + (ey / em) * c;
        }
        td.sx = (td.sx || 0) + (vx - (td.sx || 0)) * ease;
        td.sy = (td.sy || 0) + (vy - (td.sy || 0)) * ease;
        var m = len(td.sx, td.sy);
        td.amp = clamp(m, 0, 1);
        td.x = m ? td.sx / m : 0;
        td.y = m ? td.sy / m : 0;
      });
    }

    function integrate(body, f, jitter, pushing) {
      // a wrong-way approach should mostly twist, not travel, so the pair can re-meet
      var mob = pushing && body.g.polar ? MOB * 0.35 : MOB;
      var sx = (body.fx * mob * f) / body.g.mass;
      var sy = (body.fy * mob * f) / body.g.mass;
      if (jitter) {
        sx += (Math.random() - 0.5) * 0.12 * f;
        sy += (Math.random() - 0.5) * 0.12 * f;
      }
      var s = len(sx, sy);
      var cap = MAX_STEP * f;
      if (s > cap) {
        sx *= cap / s;
        sy *= cap / s;
      }
      var k = 1 - Math.pow(1 - SMOOTH, f);
      body.vx += (sx - body.vx) * k;
      body.vy += (sy - body.vy) * k;
      body.x += body.vx;
      body.y += body.vy;

      var spin = (body.torque * ROT_MOB * f * (pushing ? 1.8 : 1)) / body.g.inertia;
      if (jitter) spin += (Math.random() - 0.5) * 0.006 * f;
      // head-on like charges give zero torque; tip off the balance point so it turns
      if (pushing && body.g.polar && Math.abs(spin) < 0.002 * f) spin += 0.004 * f;
      spin = clamp(spin, -MAX_SPIN * f, MAX_SPIN * f);
      body.vs += (spin - body.vs) * k;
      body.angle += body.vs;
      walls(body);
    }

    function applySpin(body, f) {
      if (!body.spinLeft) return;
      var stepA = reduced ? body.spinLeft : clamp(body.spinLeft, -0.09 * f, 0.09 * f);
      body.angle += stepA;
      body.spinLeft -= stepA;
      if (Math.abs(body.spinLeft) < 1e-4) body.spinLeft = 0;
    }

    function physicsStep(f, jitter) {
      var info = computeForces();
      updateTempDipoles();
      var held = drag ? drag.body : null;
      bodies.forEach(function (body) {
        if (body.spinLeft) {
          applySpin(body, f);
          return;
        }
        if (body === held) {
          var spin = clamp((body.torque * ROT_MOB * f) / body.g.inertia, -MAX_SPIN * f, MAX_SPIN * f);
          body.angle += spin;
          return;
        }
        integrate(body, f, jitter && body.near, body.pushing);
      });
      // keep a cluster on the tray: ease the group's centre back toward the middle, and each
      // molecule softly toward the midline so chains lie along the wide tray, not off its edges
      // Only molecules actually in contact count: one pulled off on its own stays where it was put
      var cluster = bodies.filter(function (body) {
        return body.nearGap < LDF_RANGE;
      });
      if (bodies.length > 2 && cluster.length > 1 && !drag) {
        var gx = 0;
        var gy = 0;
        cluster.forEach(function (body) {
          gx += body.x;
          gy += body.y;
        });
        var kx = (W / 2 - gx / cluster.length) * 0.02 * f;
        var ky = (H / 2 - gy / cluster.length) * 0.02 * f;
        cluster.forEach(function (body) {
          body.x += kx;
          body.y += ky + (H / 2 - body.y) * 0.004 * f;
          walls(body);
        });
      }
      return info;
    }

    function emitStatus(info) {
      if (!a || !b) return;
      info = info || computeForces();
      var next;
      if (info.dist >= CUTOFF * 0.95) next = 'apart';
      else if (info.gap < contactPad() + 2 && info.radial < 0) next = 'touching';
      else if (info.radial < -0.03) next = 'pulling';
      else if (info.radial > 0.03) next = 'pushing';
      else next = 'drifting';
      if (next !== status) {
        status = next;
        if (onStatus) onStatus(status);
      }
    }

    function settleNow(steps) {
      if (!a || !b) return;
      tween = null;
      var n = steps || 900;
      var info;
      for (var i = 0; i < n; i++) info = physicsStep(1, false);
      emitStatus(info);
    }

    /** Centre distance along (ux, uy) at which B just clears A with the contact padding. */
    function contactDistance(A, B, ux, uy) {
      var probeA = { g: A.g, x: 0, y: 0, angle: A.angle };
      var probeB = { g: B.g, x: 0, y: 0, angle: B.angle };
      for (var D = 0; D < 400; D += 1) {
        probeB.x = ux * D;
        probeB.y = uy * D;
        if (minGap(probeA, probeB) >= contactPad()) return D;
      }
      return 400;
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function startTween(targets, dur) {
      tween = {
        t: 0,
        dur: dur,
        from: bodies.map(function (body) {
          return { x: body.x, y: body.y };
        }),
        to: targets,
      };
    }

    function jumpTo(targets) {
      targets.forEach(function (p, i) {
        bodies[i].x = p.x;
        bodies[i].y = p.y;
      });
    }

    // Meeting poses: a pair closes along its current line; partners gather around the first
    function togetherPoses() {
      if (bodies.length === 2) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = len(dx, dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var D = contactDistance(a, b, ux, uy) + 6;
        var mx = clamp((a.x + b.x) / 2, W * 0.3, W * 0.7);
        var my = clamp((a.y + b.y) / 2, H * 0.3, H * 0.7);
        return [
          { x: mx - (ux * D) / 2, y: my - (uy * D) / 2 },
          { x: mx + (ux * D) / 2, y: my + (uy * D) / 2 },
        ];
      }
      return clusterPoses(function (body, t) {
        return contactDistance(a, body, Math.cos(t), Math.sin(t)) + 6;
      });
    }

    function bringTogether() {
      if (bodies.length < 2) return;
      release();
      var targets = togetherPoses();
      if (reduced) {
        jumpTo(targets);
        settleNow();
        return;
      }
      startTween(targets, bodies.length > 2 ? 900 : 700);
    }

    function separate() {
      if (bodies.length < 2) return;
      if (reduced) {
        placeDefault();
        emitStatus();
        return;
      }
      startTween(homePoses(), 600);
    }

    function rotate(which, delta) {
      var body = typeof which === 'number' ? bodies[which] : which === 'b' ? b : a;
      if (!body) return;
      body.spinLeft += delta;
      if (reduced) {
        applySpin(body, 1);
        settleNow(600);
      }
    }

    function stepTween(dt) {
      if (!tween) return false;
      tween.t += dt;
      var u = clamp(tween.t / tween.dur, 0, 1);
      var e = easeInOut(u);
      bodies.forEach(function (body, i) {
        var p0 = tween.from[i];
        var p1 = tween.to[i];
        if (!p0 || !p1) return;
        body.x = p0.x + (p1.x - p0.x) * e;
        body.y = p0.y + (p1.y - p0.y) * e;
        body.vx = body.vy = 0;
      });
      if (u >= 1) tween = null;
      return true;
    }

    // Start the physics on a waiting scene; status re-announces from scratch
    function release() {
      if (!waiting) return;
      waiting = false;
      status = '';
    }

    function step(dt) {
      if (!a) return;
      clock += dt / 1000;
      if (!b || !outcome) return;
      var f = dt / 16.67;
      if (stepTween(dt) || waiting) {
        computeForces();
        updateTempDipoles();
        // still waiting: molecules stay put with no force lines, but Turn A / Turn B still turn them
        if (waiting) {
          bridges = [];
          bodies.forEach(function (body) {
            applySpin(body, f);
          });
        }
        return;
      }
      var info = physicsStep(f, !reduced);
      emitStatus(info);
    }

    /* ---------- drawing (model units) ---------- */

    function blob(x, y, r, rgb, alpha) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
      g.addColorStop(0.55, 'rgba(' + rgb + ',' + alpha * 0.55 + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function lobeShape(cx, cy, ang, along, across, rgb, alpha) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      var g = ctx.createRadialGradient(along * 0.15, 0, 0, 0, 0, along);
      g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
      g.addColorStop(0.6, 'rgba(' + rgb + ',' + alpha * 0.6 + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, along, across, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha * 0.55 + ')';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, along * 0.82, across * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function sphere(x, y, r, el, behind) {
      var c = T.el[el] || T.el.C || EL.C;
      var g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
      g.addColorStop(0, c[0]);
      g.addColorStop(0.7, c[1]);
      g.addColorStop(1, T.rim);
      ctx.globalAlpha = behind ? T.behindAlpha : 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (T.gloss && !behind) {
        ctx.fillStyle = 'rgba(255,255,255,' + T.gloss + ')';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.36, y - r * 0.44, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawShadow(body) {
      if (!T.shadow) return;
      var sh = T.shadow;
      viewAtoms(body).forEach(function (w) {
        var cy = w.y + sh.dy;
        var g = ctx.createRadialGradient(w.x, cy, 0, w.x, cy, w.r * 1.25);
        g.addColorStop(0, 'rgba(' + sh.rgb + ',' + sh.alpha + ')');
        g.addColorStop(1, 'rgba(' + sh.rgb + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(w.x, cy, w.r * 1.25, w.r * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Polar-mode tint for one atom; drawCloud blends it with neutral by fade.polar
    function cloudRgb(atom) {
      if (atom.q > 0.05) return T.posRgb;
      if (atom.q < -0.05) return T.negRgb;
      return T.neutralRgb;
    }

    function mixRgb(from, to, t) {
      if (t <= 0 || from === to) return from;
      if (t >= 1) return to;
      var p = from.split(',');
      var q = to.split(',');
      return [0, 1, 2]
        .map(function (i) {
          return Math.round(+p[i] + (q[i] - p[i]) * t);
        })
        .join(',');
    }

    /** When teaching the bond, stretch a diatomic so the shared pair is readable. */
    function viewAtoms(body) {
      var atoms = worldAtoms(body);
      if (fade.shared <= 0 || atoms.length < 2) return atoms;
      var cx = 0;
      var cy = 0;
      atoms.forEach(function (w) {
        cx += w.x;
        cy += w.y;
      });
      cx /= atoms.length;
      cy /= atoms.length;
      var k = 1 + 0.85 * fade.shared;
      return atoms.map(function (w) {
        return {
          x: cx + (w.x - cx) * k,
          y: cy + (w.y - cy) * k,
          r: w.r,
          pol: w.pol,
          src: w.src,
        };
      });
    }

    function drawBonds(body) {
      if (fade.bonds <= 0 || !body.g.bonds.length) return;
      var atoms = viewAtoms(body);
      ctx.save();
      ctx.globalAlpha = fade.bonds;
      ctx.lineCap = 'round';
      body.g.bonds.forEach(function (pair) {
        var p0 = atoms[pair[0]];
        var p1 = atoms[pair[1]];
        if (!p0 || !p1) return;
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        var d = len(dx, dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var x0 = p0.x + ux * p0.r;
        var y0 = p0.y + uy * p0.r;
        var x1 = p1.x - ux * p1.r;
        var y1 = p1.y - uy * p1.r;
        ctx.strokeStyle = 'rgba(29,36,51,0.7)';
        ctx.lineWidth = 7 - 2 * fade.shared;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 3 - 0.8 * fade.shared;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawSharedElectrons(body) {
      if (fade.shared <= 0 || !body.g.bonds.length) return;
      var atoms = viewAtoms(body);
      var pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 3.2);
      ctx.save();
      ctx.globalAlpha = fade.shared;
      body.g.bonds.forEach(function (pair) {
        var p0 = atoms[pair[0]];
        var p1 = atoms[pair[1]];
        if (!p0 || !p1) return;
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        var d = len(dx, dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        // Surface-to-surface gap: park the pair in that open stretch (H · · Cl)
        var pad = 2.2;
        var x0 = p0.x + ux * (p0.r + pad);
        var y0 = p0.y + uy * (p0.r + pad);
        var x1 = p1.x - ux * (p1.r + pad);
        var y1 = p1.y - uy * (p1.r + pad);
        var mx = (x0 + x1) / 2;
        var my = (y0 + y1) / 2;
        blob(mx, my, 8 * pulse, T.neutralRgb, 0.22);
        var dotR = 2.4;
        [[x0, y0], [x1, y1]].forEach(function (pt) {
          ctx.fillStyle = 'rgba(29,36,51,0.92)';
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(pt[0] - 0.7, pt[1] - 0.7, 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.restore();
      // Caption in CSS-pixel space so zoom keeps it readable
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = fade.shared;
      ctx.font = '700 12px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T.text;
      body.g.bonds.forEach(function (pair) {
        var atoms = viewAtoms(body);
        var p0 = atoms[pair[0]];
        var p1 = atoms[pair[1]];
        if (!p0 || !p1) return;
        var mx = ((p0.x + p1.x) / 2) * S;
        var labelY = Math.min(cssH - 16, Math.max((p0.y + p0.r) * S, (p1.y + p1.r) * S) + 18);
        ctx.fillText('shared e⁻', mx, labelY);
      });
      ctx.restore();
    }

    // Deterministic 0..1 noise so each electron keeps the same orbit every frame
    function hash01(n) {
      var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    }

    /**
     * Valence electron paths: tilted orbits around each non-H atom that slowly precess,
     * plus figure-8s through each bond so electrons visibly visit both atoms.
     */
    function cloudElectronPaths(body) {
      var atoms = viewAtoms(body);
      var paths = [];
      atoms.forEach(function (w, i) {
        if (w.src.el === 'H') return;
        for (var k = 0; k < 3; k++) {
          var n = i * 7 + k;
          paths.push({
            bond: false,
            c: w,
            R: w.r + cloudPad * (0.3 + 0.35 * hash01(n)),
            inc: 0.9 + 0.5 * hash01(n + 0.3),
            node: body.angle + k * 2.1 + 0.8 * hash01(n + 0.7),
            phase: Math.PI * 2 * hash01(n + 0.9),
            speed: (3.2 + 1.2 * hash01(n + 1.3)) * (k % 2 ? -1 : 1),
            prec: 0.25 + 0.2 * hash01(n + 1.7),
          });
        }
      });
      body.g.bonds.forEach(function (pair, j) {
        var p0 = atoms[pair[0]];
        var p1 = atoms[pair[1]];
        if (!p0 || !p1) return;
        for (var k = 0; k < 2; k++) {
          paths.push({
            bond: true,
            p0: p0,
            p1: p1,
            phase: k * Math.PI + j,
            speed: 2.4 + 0.3 * k,
            roll: k * Math.PI * 0.5 + j,
            rollRate: 0.55,
          });
        }
      });
      return paths;
    }

    /** Electron position on its path at time t; z (-1..1) is depth toward the viewer. */
    function electronAt(p, t) {
      if (!p.bond) {
        var th = p.phase + p.speed * t;
        var ox = p.R * Math.cos(th);
        var oy = p.R * Math.sin(th) * Math.cos(p.inc);
        var nd = p.node + p.prec * t;
        var cn = Math.cos(nd);
        var sn = Math.sin(nd);
        return { x: p.c.x + ox * cn - oy * sn, y: p.c.y + ox * sn + oy * cn, z: Math.sin(th) * Math.sin(p.inc) };
      }
      // Gerono figure-8 along the bond, each lobe sized to its atom, rolling about the bond axis
      var dx = p.p1.x - p.p0.x;
      var dy = p.p1.y - p.p0.y;
      var d = len(dx, dy) || 1;
      var ux = dx / d;
      var uy = dy / d;
      var s = p.phase + p.speed * t;
      var gx = Math.cos(s);
      var gy = Math.sin(s) * gx;
      var host = gx >= 0 ? p.p1 : p.p0;
      var reach = host.r + cloudPad * 0.45;
      var along = gx * (d / 2 + reach);
      var roll = p.roll + p.rollRate * t;
      var lat = gy * 2 * reach * Math.cos(roll);
      return {
        x: (p.p0.x + p.p1.x) / 2 + ux * along - uy * lat,
        y: (p.p0.y + p.p1.y) / 2 + uy * along + ux * lat,
        z: gy * 2 * Math.sin(roll),
      };
    }

    // Back half draws under the atoms, front half over them, so orbits read as 3D
    function drawCloudElectrons(body, front) {
      var alpha = fade.electrons * fade.clouds;
      if (alpha <= 0) return;
      var t = reduced ? 0 : clock;
      var trail = reduced ? 0 : 12;
      ctx.save();
      ctx.lineCap = 'butt';
      cloudElectronPaths(body).forEach(function (p) {
        var head = electronAt(p, t);
        if (head.z >= 0 !== front) return;
        var depth = 0.5 + 0.5 * head.z;
        var r = 1.5 + 0.8 * depth;
        var a = alpha * (0.45 + 0.55 * depth);
        // Comet tail from recent positions
        var prev = head;
        for (var i = 1; i <= trail; i++) {
          var q = electronAt(p, t - i * 0.018);
          var fadeK = 1 - i / (trail + 1);
          ctx.strokeStyle = 'rgba(29,36,51,' + a * 0.5 * fadeK + ')';
          ctx.lineWidth = r * 1.6 * fadeK;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
          prev = q;
        }
        ctx.fillStyle = 'rgba(29,36,51,' + 0.92 * a + ')';
        ctx.beginPath();
        ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + 0.55 * a + ')';
        ctx.beginPath();
        ctx.arc(head.x - r * 0.3, head.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawEN(body) {
      if (fade.en <= 0) return;
      var atoms = worldAtoms(body);
      // Draw in CSS-pixel space so zoom does not blow up the chrome
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = fade.en;
      ctx.font = '700 12px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      atoms.forEach(function (w) {
        var val = EN[w.src.el];
        if (val == null) return;
        var label = 'EN ' + val.toFixed(1);
        var bw = ctx.measureText(label).width + 14;
        var bh = 20;
        var rr = 6;
        var leftEnd = w.x <= body.x;
        var tx = w.x * S + (leftEnd ? -(bw / 2 + 8) : bw / 2 + 8);
        tx = clamp(tx, bw / 2 + 8, cssW - bw / 2 - 8);
        var ty = w.y * S - w.r * S - 16;
        ty = clamp(ty, bh / 2 + 8, cssH - bh / 2 - 8);
        ctx.beginPath();
        ctx.moveTo(tx - bw / 2 + rr, ty - bh / 2);
        ctx.arcTo(tx + bw / 2, ty - bh / 2, tx + bw / 2, ty + bh / 2, rr);
        ctx.arcTo(tx + bw / 2, ty + bh / 2, tx - bw / 2, ty + bh / 2, rr);
        ctx.arcTo(tx - bw / 2, ty + bh / 2, tx - bw / 2, ty - bh / 2, rr);
        ctx.arcTo(tx - bw / 2, ty - bh / 2, tx + bw / 2, ty - bh / 2, rr);
        ctx.closePath();
        ctx.fillStyle = 'rgba(29,36,51,0.92)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, tx, ty + 0.5);
      });

      if (atoms.length === 2) {
        var lo = atoms[0];
        var hi = atoms[1];
        if ((EN[hi.src.el] || 0) < (EN[lo.src.el] || 0)) {
          lo = atoms[1];
          hi = atoms[0];
        }
        if (EN[lo.src.el] != null && EN[hi.src.el] != null && EN[hi.src.el] > EN[lo.src.el]) {
          var midY = Math.max((lo.y + lo.r) * S, (hi.y + hi.r) * S) + 22;
          midY = Math.min(midY, cssH - 22);
          var ax0 = lo.x * S;
          var ax1 = hi.x * S;
          ctx.strokeStyle = 'rgba(29,36,51,0.75)';
          ctx.fillStyle = 'rgba(29,36,51,0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ax0, midY);
          ctx.lineTo(ax1 - 6 * Math.sign(ax1 - ax0 || 1), midY);
          ctx.stroke();
          var sx = Math.sign(ax1 - ax0 || 1);
          ctx.beginPath();
          ctx.moveTo(ax1, midY);
          ctx.lineTo(ax1 - 8 * sx, midY - 4);
          ctx.lineTo(ax1 - 8 * sx, midY + 4);
          ctx.closePath();
          ctx.fill();
          ctx.font = '700 11px "Space Mono", ui-monospace, monospace';
          ctx.fillStyle = T.text;
          ctx.fillText('pulls e⁻', (ax0 + ax1) / 2, midY + 14);
        }
      }
      ctx.restore();
    }

    // Teardrop half-width profile along t in 0..π (t = 0 is the tip). r0 = 1 gives an ellipse;
    // smaller r0 tapers the tip while keeping it rounded.
    function dropProfile(t, r0) {
      return Math.sin(t) * (r0 + (1 - r0) * Math.sin(t / 2));
    }

    // Nonpolar clouds stay tucked in until a partner comes close
    function padFor(body) {
      var pad = cloudPad * (body.g.cloud || 1);
      if (body.g.polar || body.mol.ion) return pad;
      return pad * (0.55 + 0.45 * body.ldfNear);
    }

    // Electron-rich atom: the yellow (δ−) end of the cloud
    function cloudRich(body, w) {
      if (body.mol.ion) return false;
      if (w.src.q < -0.05) return true;
      return body.g.lps.length > 0 && (w.src.el === 'O' || w.src.el === 'N' || w.src.el === 'F');
    }

    /**
     * Where the teardrop points: origin, unit axis from electron-rich toward electron-poor, and
     * skew 0..1. Polar molecules use their permanent dipole; everything else leans along its
     * temporary / induced dipole, so a nonpolar cloud sloshes between round and teardrop.
     * Null for polar molecules with no single clear axis (glucose): those keep per-atom halos.
     */
    function dropFrame(body, atoms) {
      var cx = 0;
      var cy = 0;
      atoms.forEach(function (w) {
        cx += w.x;
        cy += w.y;
      });
      cx /= atoms.length;
      cy /= atoms.length;
      if (body.g.polar && !body.mol.ion) {
        var rx = 0;
        var ry = 0;
        var rn = 0;
        var qx = 0;
        var qy = 0;
        var qn = 0;
        atoms.forEach(function (w) {
          if (cloudRich(body, w)) {
            rx += w.x;
            ry += w.y;
            rn++;
          } else if (w.src.q > 0.05) {
            qx += w.x;
            qy += w.y;
            qn++;
          }
        });
        if (rn && qn) {
          rx /= rn;
          ry /= rn;
          var dx = qx / qn - rx;
          var dy = qy / qn - ry;
          var d = len(dx, dy);
          if (d > 3) return { x: rx, y: ry, ux: dx / d, uy: dy / d, skew: 1 };
        }
        return null;
      }
      // tdip points toward the δ+ side, i.e. rich → poor
      var td = body.tdip;
      var tl = len(td.x, td.y);
      var ux = tl > 1e-3 ? td.x / tl : Math.cos(body.angle);
      var uy = tl > 1e-3 ? td.y / tl : Math.sin(body.angle);
      var skew = body.mol.ion ? 0 : clamp(td.amp, 0, 1);
      // Elongated molecules (Br₂, CO₂, octane) keep the cloud on their long axis and slosh along
      // it; a tilted fit around a long chain balloons
      var sxx = 0;
      var syy = 0;
      var sxy = 0;
      atoms.forEach(function (w) {
        sxx += (w.x - cx) * (w.x - cx);
        syy += (w.y - cy) * (w.y - cy);
        sxy += (w.x - cx) * (w.y - cy);
      });
      var spread = sxx + syy;
      if (spread > 1e-6 && len(sxx - syy, 2 * sxy) / spread > 0.3) {
        var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
        var dot = Math.cos(th) * ux + Math.sin(th) * uy;
        var sgn = dot < 0 ? -1 : 1;
        ux = Math.cos(th) * sgn;
        uy = Math.sin(th) * sgn;
        skew *= Math.abs(dot);
      }
      return { x: cx, y: cy, ux: ux, uy: uy, skew: skew };
    }

    /**
     * One squishy cloud per molecule: a fat, wobbling bulb at the electron-rich end tapering to a
     * rounded tip past the electron-poor end, so the cloud visibly favours the more
     * electronegative side. Sized so every atom stays inside.
     */
    var LOBE_N = 64;
    var lobeBuf = new Float64Array(LOBE_N);

    /**
     * Molecules with lone pairs: the cloud is a soft union of lobes around each atom and lone pair
     * (water: two H below, two lone pairs fanned above, so a tetrahedral four-lobe outline), with
     * the same δ−→δ+ colour run, wobble and nested layers as the teardrop.
     */
    function drawLobedCloud(body, f, alpha) {
      var pad = padFor(body);
      var lobes = cloudLobes(body.g, pad).map(function (l) {
        var w = toWorld(body, l);
        w.r = l.r;
        return w;
      });
      var ux = f.ux;
      var uy = f.uy;
      var rad = lobedRadii(lobes, f.x, f.y, ux, uy, LOBE_N, lobeBuf);
      var tau = reduced ? 0 : clock + body.seed * 5;
      var breathe = 1 + 0.04 * Math.sin(tau * 1.4);
      var back = 0;
      var tip = 0;
      for (var i = 0; i < LOBE_N; i++) {
        var t = (i / LOBE_N) * Math.PI * 2;
        var bulb = (1 - Math.cos(t)) / 2;
        // Squish mostly on the electron-rich side, like the teardrop
        var wob = 1 + (0.4 + 0.6 * bulb) * (0.05 * Math.sin(2 * t + tau * 1.7) + 0.035 * Math.sin(3 * t - tau * 2.3));
        rad[i] *= wob * breathe;
        tip = Math.max(tip, rad[i] * Math.cos(t));
        back = Math.max(back, -rad[i] * Math.cos(t));
      }
      var cx = f.x + body.pullX * 0.6;
      var cy = f.y + body.pullY * 0.6;
      var tint = fade.polar * f.skew;
      var neg = mixRgb(T.neutralRgb, T.negRgb, tint);
      var pos = mixRgb(T.neutralRgb, T.posRgb, tint);
      var lg = ctx.createLinearGradient(cx - ux * back, cy - uy * back, cx + ux * tip, cy + uy * tip);
      lg.addColorStop(0, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.45, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.72, 'rgba(' + pos + ',1)');
      lg.addColorStop(1, 'rgba(' + pos + ',1)');

      ctx.save();
      ctx.globalCompositeOperation = T.cloudBlend;
      ctx.fillStyle = lg;
      ctx.globalAlpha = alpha * 0.05 * T.cloudAlpha;
      for (var li = 0; li < 14; li++) {
        var sc = 1 - li * 0.05;
        ctx.beginPath();
        for (var k = 0; k < LOBE_N; k++) {
          var a = (k / LOBE_N) * Math.PI * 2;
          var dx = ux * Math.cos(a) - uy * Math.sin(a);
          var dy = ux * Math.sin(a) + uy * Math.cos(a);
          var r = rad[k] * sc;
          if (k === 0) ctx.moveTo(cx + dx * r, cy + dy * r);
          else ctx.lineTo(cx + dx * r, cy + dy * r);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawDropCloud(body, f, atoms, alpha) {
      if (body.g.lps.length && !body.mol.ion) {
        drawLobedCloud(body, f, alpha);
        return;
      }
      var pad = padFor(body);
      var ux = f.ux;
      var uy = f.uy;
      var sk = f.skew;
      var r0 = 1 - 0.65 * sk;
      var back = 0;
      var tip = 0;
      var reach = 0;
      atoms.forEach(function (w) {
        var a = (w.x - f.x) * ux + (w.y - f.y) * uy;
        back = Math.max(back, w.r - a);
        tip = Math.max(tip, w.r + a);
        reach = Math.max(reach, w.r + Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy));
      });
      back += pad * (0.6 + 0.2 * sk);
      reach += pad * (0.6 + 0.2 * sk);
      tip += pad * (0.6 - 0.35 * sk);
      var half = (back + tip) / 2;
      var mid = (tip - back) / 2;
      var peak = 0;
      for (var k = 1; k < 32; k++) peak = Math.max(peak, dropProfile((k / 32) * Math.PI, r0));
      // Bulb as wide as the atoms reach sideways, widened if any atom would poke out the side
      var wide = reach / peak;
      atoms.forEach(function (w) {
        var a = (w.x - f.x) * ux + (w.y - f.y) * uy;
        var b = Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy);
        var t = Math.acos(clamp((a - mid) / half, -1, 1));
        wide = Math.max(wide, (b + w.r + pad * 0.3) / Math.max(0.3, dropProfile(t, r0)));
      });
      var tau = reduced ? 0 : clock + body.seed * 5;
      var breathe = 1 + 0.04 * Math.sin(tau * 1.4);
      var cx = f.x + body.pullX * 0.6;
      var cy = f.y + body.pullY * 0.6;
      var tint = fade.polar;

      var neg;
      var pos;
      if (body.mol.ion) {
        neg = pos = mixRgb(T.neutralRgb, T.posRgb, tint);
      } else {
        neg = mixRgb(T.neutralRgb, T.negRgb, tint * sk);
        pos = mixRgb(T.neutralRgb, T.posRgb, tint * sk);
      }
      var lg = ctx.createLinearGradient(cx - ux * back, cy - uy * back, cx + ux * tip, cy + uy * tip);
      lg.addColorStop(0, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.45, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.72, 'rgba(' + pos + ',1)');
      lg.addColorStop(1, 'rgba(' + pos + ',1)');

      ctx.save();
      ctx.globalCompositeOperation = T.cloudBlend;
      ctx.fillStyle = lg;
      // Nested layers shrinking toward the rich end: soft edge, densest where electrons crowd
      var LAYERS = 14;
      for (var li = 0; li < LAYERS; li++) {
        var sc = 1 - li * 0.05;
        ctx.globalAlpha = alpha * 0.05 * T.cloudAlpha;
        ctx.beginPath();
        for (var i = 0; i <= 64; i++) {
          var t = (i / 64) * Math.PI * 2;
          var bulb = (1 - Math.cos(t)) / 2;
          // Squish mostly on the bulb; the tip stays fairly steady
          var wob =
            1 + (0.4 + 0.6 * bulb) * (0.06 * Math.sin(2 * t + tau * 1.7) + 0.04 * Math.sin(3 * t - tau * 2.3));
          var along = (mid + half * Math.cos(t)) * wob * sc;
          var side = wide * dropProfile(t, r0) * wob * breathe * sc;
          var x = cx + ux * along - uy * side;
          var y = cy + uy * along + ux * side;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawCloud(body) {
      if (fade.clouds <= 0) return;
      var g = body.g;
      var atoms = worldAtoms(body);
      var px = body.pullX;
      var py = body.pullY;
      var pm = len(px, py);
      var hasLp = g.lps.length > 0;
      var tint = fade.polar;
      var pad = padFor(body);
      var frame = fade.drop > 0 ? dropFrame(body, atoms) : null;
      var dropK = frame ? fade.drop : 0;
      if (dropK > 0) drawDropCloud(body, frame, atoms, dropK * fade.clouds);

      ctx.save();
      ctx.globalCompositeOperation = T.cloudBlend;
      atoms.forEach(function (w) {
        var ox = w.x - body.x;
        var oy = w.y - body.y;
        var od = len(ox, oy) || 1;
        var face = pm ? Math.max(0, (ox * px + oy * py) / (od * pm)) : 0;
        var k = 0.4 + 0.6 * face;
        var rgb = cloudRgb(w.src);
        if (hasLp && (w.src.el === 'O' || w.src.el === 'N' || w.src.el === 'F')) rgb = T.negRgb;
        if (body.mol.ion) rgb = T.posRgb;
        rgb = mixRgb(T.neutralRgb, rgb, tint);
        var alpha = (0.2 + (g.polar ? 0.08 * tint : 0)) * T.cloudAlpha * fade.clouds * (1 - dropK);
        blob(w.x + px * k, w.y + py * k, w.r + pad + pm * face, rgb, alpha);
      });

      // temporary / induced dipole: shift cloud colour across the molecule
      var td = body.tdip;
      if (tint > 0 && !g.polar && td.amp > 0.04) {
        var R = g.R + pad * 0.6;
        var lg = ctx.createLinearGradient(
          body.x - td.x * R,
          body.y - td.y * R,
          body.x + td.x * R,
          body.y + td.y * R
        );
        var al = 0.42 * td.amp * T.cloudAlpha * tint * fade.clouds * (1 - dropK);
        lg.addColorStop(0, 'rgba(' + T.negRgb + ',' + al + ')');
        lg.addColorStop(0.5, 'rgba(' + T.neutralRgb + ',0)');
        lg.addColorStop(1, 'rgba(' + T.posRgb + ',' + al + ')');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = lg;
        ctx.beginPath();
        atoms.forEach(function (w) {
          var rr = w.r + pad * 0.85;
          ctx.moveTo(w.x + px * 0.6 + rr, w.y + py * 0.6);
          ctx.arc(w.x + px * 0.6, w.y + py * 0.6, rr, 0, Math.PI * 2);
        });
        ctx.fill('nonzero');
      }
      ctx.restore();

      // lone pairs pointing away from the viewer sit behind the atoms
      if (fade.lobes <= 0) return;
      g.lps.forEach(function (l) {
        if (!l.behind) return;
        var c = toWorld(body, { x: l.lx, y: l.ly });
        var k = 1 + 0.08 * l.depth;
        var bx = c.x + px * 0.8;
        var by = c.y + py * 0.8;
        var ang = l.ang + body.angle;
        var al = fade.lobes * fade.clouds;
        lobeShape(bx, by, ang, 12.5 * k, 8.5 * k, T.negRgb, 0.6 * T.lobeAlpha * al);
        // its electron pair shows faintly through, so it still reads as a lone pair
        if (!T.lobeDot) return;
        ctx.save();
        ctx.globalAlpha = 0.7 * al;
        ctx.fillStyle = T.lobeDot;
        [1, -1].forEach(function (s) {
          ctx.beginPath();
          ctx.arc(bx - Math.sin(ang) * 2.2 * s, by + Math.cos(ang) * 2.2 * s, 1.1, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });
    }

    // front lone pairs: drawn over all atoms so a docking H visibly meets the electrons, not the O
    function drawLobes(body) {
      if (fade.lobes <= 0) return;
      var px = body.pullX;
      var py = body.pullY;
      ctx.save();
      ctx.globalAlpha = fade.lobes;
      body.g.lps.forEach(function (l) {
        if (l.behind) return;
        var c = toWorld(body, { x: l.lx, y: l.ly });
        var cx = c.x + px * 0.8;
        var cy = c.y + py * 0.8;
        var ang = l.ang + body.angle;
        var k = 1 + 0.08 * l.depth;
        lobeShape(cx, cy, ang, 12.5 * k, 8.5 * k, T.negRgb, 0.62 * T.lobeAlpha);
        if (!T.lobeDot) return;
        var nx = -Math.sin(ang) * 2.6 * k;
        var ny = Math.cos(ang) * 2.6 * k;
        ctx.fillStyle = T.lobeDot;
        [1, -1].forEach(function (s) {
          ctx.beginPath();
          ctx.arc(cx + nx * s, cy + ny * s, 1.3 * k, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.restore();
    }

    function drawAtoms(body) {
      var atoms = viewAtoms(body).slice().sort(function (m, n) {
        return m.src.z - n.src.z;
      });
      atoms.forEach(function (w) {
        sphere(w.x, w.y, w.r, w.src.el, w.src.z < 0);
      });
    }

    function textBadge(x, y, t, color, size) {
      ctx.font = '700 ' + size + 'px ' + T.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Pill and plain styles crossfade as deltaStyle changes
      var pill = T.badge ? fade.badges : 0;
      var base = ctx.globalAlpha;
      if (pill > 0) {
        ctx.globalAlpha = base * pill;
        var isPos = t.indexOf('+') >= 0;
        var bw = ctx.measureText(t).width + size * 0.75;
        var bh = size + 4;
        var rr = bh / 2;
        ctx.beginPath();
        ctx.moveTo(x - bw / 2 + rr, y - bh / 2);
        ctx.arcTo(x + bw / 2, y - bh / 2, x + bw / 2, y + bh / 2, rr);
        ctx.arcTo(x + bw / 2, y + bh / 2, x - bw / 2, y + bh / 2, rr);
        ctx.arcTo(x - bw / 2, y + bh / 2, x - bw / 2, y - bh / 2, rr);
        ctx.arcTo(x - bw / 2, y - bh / 2, x + bw / 2, y - bh / 2, rr);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = T.badge.edge;
        ctx.stroke();
        ctx.fillStyle = isPos ? T.badge.pos : T.badge.neg;
        ctx.fillText(t, x, y + 0.5);
      }
      if (pill < 1) {
        ctx.globalAlpha = base * (1 - pill);
        // Badge themes go plain in ink: the cloud colour already says which end is which
        if (T.badge) ctx.font = '700 ' + (size + 2) + 'px ' + T.font;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = T.halo;
        ctx.strokeText(t, x, y);
        ctx.fillStyle = T.badge ? T.text : color;
        ctx.fillText(t, x, y);
      }
      ctx.globalAlpha = base;
    }

    // Atoms of every other molecule on the tray (labels dodge them)
    function othersAtoms(body) {
      var out = [];
      bodies.forEach(function (o) {
        if (o !== body) out = out.concat(worldAtoms(o));
      });
      return out;
    }

    // Formula labels introduce the molecules, then fade once formulaHold seconds have passed
    function formulaFade() {
      if (!formulaHold || solo) return 1;
      return 1 - clamp((clock - sceneStart - formulaHold) / 0.8, 0, 1);
    }

    function drawLabels(body) {
      var g = body.g;
      var c = Math.cos(body.angle);
      var s = Math.sin(body.angle);
      g.labels.forEach(function (lb) {
        var w = toWorld(body, lb);
        var color = lb.t.indexOf('+') >= 0 ? T.pos : T.neg;
        if (!lb.big && fade.deltas <= 0) return;
        if (lb.big) {
          ctx.save();
          ctx.font = '800 15px ' + T.font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = T.ionText;
          ctx.fillText(lb.t, w.x, w.y + 0.5);
          ctx.restore();
          return;
        }
        var ox = lb.out[0] * c - lb.out[1] * s;
        var oy = lb.out[0] * s + lb.out[1] * c;
        var atomR = 10;
        g.atoms.forEach(function (at) {
          if (at.x === lb.x && at.y === lb.y) atomR = at.r;
        });
        var push = atomR + (lb.small ? 6 : 9) + (lb.t === 'δ−' && g.lps.length ? 12 : 0);
        var otherAtoms = othersAtoms(body);
        // if the partner covers the spot, swing the label around the atom to a free side
        var tries = [0, 1.1, -1.1, 2.0, -2.0];
        for (var ti = 0; ti < tries.length; ti++) {
          var rc = Math.cos(tries[ti]);
          var rs = Math.sin(tries[ti]);
          var tx = w.x + (ox * rc - oy * rs) * push;
          var ty = w.y + (ox * rs + oy * rc) * push;
          var covered = otherAtoms.some(function (oa) {
            return len(tx - oa.x, ty - oa.y) < oa.r + 3;
          });
          if (!covered) {
            ctx.globalAlpha = fade.deltas;
            textBadge(tx, ty, lb.t, color, lb.small ? 9 : 11);
            ctx.globalAlpha = 1;
            break;
          }
        }
      });

      // temporary / induced δ signs appear only when the shift is strong
      var td = body.tdip;
      if (fade.deltas > 0 && !g.polar && td.amp > 0.6) {
        var R = g.R + 4;
        ctx.globalAlpha = clamp((td.amp - 0.6) / 0.3, 0, 1) * 0.85 * fade.deltas;
        var partnerAtoms = othersAtoms(body);
        [[1, 'δ+', T.pos], [-1, 'δ−', T.neg]].forEach(function (end) {
          var ex = body.x + end[0] * td.x * R;
          var ey = body.y + end[0] * td.y * R;
          var hidden = partnerAtoms.some(function (oa) {
            return len(ex - oa.x, ey - oa.y) < oa.r + 8;
          });
          if (!hidden) textBadge(ex, ey, end[1], end[2], 10);
        });
        ctx.globalAlpha = 1;
      }

      // formula sits below; when crowded it slides to the far side of the partner
      // hide under bond-focus / EN chrome so labels stay clear
      var formulaAlpha = (1 - Math.max(fade.shared, fade.en)) * formulaFade();
      if (formulaAlpha <= 0) return;
      var fx = body.x;
      var fy = body.y + g.R + 16;
      var other = body.nearest || (body === a ? b : a);
      if (other) {
        var awx = body.x - other.x;
        var awy = body.y - other.y;
        var awd = len(awx, awy) || 1;
        var crowd = clamp(1 - (awd - g.R - other.g.R) / 40, 0, 1);
        var lx = (awx / awd) * crowd;
        var ly = 1;
        var lm = len(lx, ly);
        fx = body.x + (lx / lm) * (g.R + 16);
        fy = body.y + (ly / lm) * (g.R + 16);
      }
      ctx.font = T.formulaFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T.text;
      ctx.globalAlpha = formulaAlpha;
      ctx.fillText(body.mol.formula, fx, fy);
      ctx.globalAlpha = 1;
    }

    function drawBridges() {
      bridges.forEach(function (br) {
        var dx = br.b.x - br.a.x;
        var dy = br.b.y - br.a.y;
        var d = len(dx, dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        ctx.save();
        ctx.lineCap = 'round';
        if (br.kind === 'pull') {
          ctx.setLineDash([0.5, 4.5]);
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = 'rgba(' + T.pullRgb + ',' + (0.25 + 0.65 * br.s) + ')';
          ctx.shadowColor = 'rgba(' + T.pullGlowRgb + ',0.9)';
          ctx.shadowBlur = 6 * br.s;
          ctx.beginPath();
          ctx.moveTo(br.a.x, br.a.y);
          ctx.lineTo(br.b.x, br.b.y);
          ctx.stroke();
        } else {
          var al = 0.3 + 0.6 * br.s;
          ctx.strokeStyle = 'rgba(' + T.pushRgb + ',' + al + ')';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(br.a.x, br.a.y);
          ctx.lineTo(br.b.x, br.b.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
          [[br.a, -1], [br.b, 1]].forEach(function (end) {
            var tipX = end[0].x + ux * end[1] * 11;
            var tipY = end[0].y + uy * end[1] * 11;
            var bx = end[0].x + ux * end[1] * 4;
            var by = end[0].y + uy * end[1] * 4;
            var nx = -uy * 4;
            var ny = ux * 4;
            ctx.beginPath();
            ctx.moveTo(bx + nx, by + ny);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(bx - nx, by - ny);
            ctx.stroke();
          });
        }
        ctx.restore();
      });
    }

    function drawBody(body) {
      if (!body) return;
      drawShadow(body);
      drawCloud(body);
      drawBonds(body);
      drawCloudElectrons(body, false);
      drawAtoms(body);
      drawCloudElectrons(body, true);
      drawSharedElectrons(body);
      drawLobes(body);
      drawLabels(body);
      drawEN(body);
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      if (T.paintBg) {
        T.paintBg(ctx, cssW, cssH);
      } else {
        var bg = ctx.createRadialGradient(cssW * 0.5, cssH * 0.45, 20, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.65);
        bg.addColorStop(0, T.bg[0]);
        bg.addColorStop(1, T.bg[1]);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      if (!a) {
        ctx.fillStyle = T.text;
        ctx.font = '500 15px ' + T.font;
        ctx.textAlign = 'center';
        ctx.fillText('Choose two molecules to begin.', cssW / 2, cssH / 2);
        return;
      }

      ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
      bodies.forEach(drawBody);
      if (bodies.length > 1) drawBridges();

      if (fade.labels > 0 && outcome) {
        ctx.font = '700 12px ' + T.font;
        ctx.fillStyle = T.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = fade.labels;
        ctx.fillText(outcome.label, 12, 20);
        ctx.globalAlpha = 1;
      }
    }

    // Old frame laid over the new one, fading out
    function drawDissolve() {
      if (!dissolve) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1 - easeInOut(clamp(dissolve.t / DISSOLVE_MS, 0, 1));
      // Centred, in case the canvas is changing height under the dissolve
      ctx.drawImage(snapCanvas, (canvas.width - snapCanvas.width) / 2, (canvas.height - snapCanvas.height) / 2);
      ctx.globalAlpha = 1;
    }

    /* ---------- loop + input ---------- */

    var lastT = 0;
    function loop(t) {
      if (!running) return;
      var dt = lastT ? Math.min(32, t - lastT) : 16;
      lastT = t;
      step(dt);
      animateView(dt);
      if (dissolve) {
        dissolve.t += dt;
        if (dissolve.t >= DISSOLVE_MS) dissolve = null;
      }
      draw();
      drawDissolve();
      raf = global.requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      lastT = 0;
      resize();
      raf = global.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0;
    }

    function canvasPoint(evt) {
      var rect = canvas.getBoundingClientRect();
      var clientX = evt.clientX;
      var clientY = evt.clientY;
      if (evt.touches && evt.touches[0]) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
      }
      return {
        x: (((clientX - rect.left) / rect.width) * cssW) / S,
        y: (((clientY - rect.top) / rect.height) * cssH) / S,
      };
    }

    function hit(body, p) {
      return len(p.x - body.x, p.y - body.y) <= body.g.R + 8;
    }

    function onDown(evt) {
      if (!a) return;
      var p = canvasPoint(evt);
      // topmost (last drawn) molecule wins
      var body = null;
      for (var i = bodies.length - 1; i >= 0 && !body; i--) {
        if (hit(bodies[i], p)) body = bodies[i];
      }
      if (!body) return;
      release();
      tween = null;
      layoutAnim = false;
      drag = { body: body, ox: body.x - p.x, oy: body.y - p.y };
      evt.preventDefault();
    }

    function onMove(evt) {
      if (!drag) return;
      var p = canvasPoint(evt);
      var body = drag.body;
      body.x = p.x + drag.ox;
      body.y = p.y + drag.oy;
      walls(body);
      evt.preventDefault();
    }

    function onUp() {
      if (drag && reduced) settleNow();
      drag = null;
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    global.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    global.addEventListener('touchend', onUp);

    var ro = null;
    if (global.ResizeObserver) {
      ro = new ResizeObserver(function () {
        resize();
        draw();
      });
      ro.observe(canvas);
    }

    resize();
    draw();

    return {
      setPair: setPair,
      setScene: setScene,
      /** Test hook: advance the simulation dt ms without drawing. */
      tick: function (dt) {
        step(dt || 16.67);
      },
      getBodies: function () {
        return bodies.map(function (body) {
          return { id: body.id, x: body.x, y: body.y, angle: body.angle };
        });
      },
      setSolo: setSolo,
      setView: setView,
      bringTogether: bringTogether,
      separate: separate,
      rotate: rotate,
      settleNow: settleNow,
      render: draw,
      start: start,
      stop: stop,
      resize: resize,
      getOutcome: function () {
        return outcome;
      },
      getStatus: function () {
        return status;
      },
      isWaiting: function () {
        return waiting;
      },
      isSolo: function () {
        return solo;
      },
      setShowForceLabels: function (on) {
        showLabels = !!on;
      },
      setShowDeltas: function (on) {
        showDeltas = !!on;
      },
      setTheme: function (theme) {
        T = mergeTheme(theme);
        draw();
      },
      isReducedMotion: function () {
        return reduced;
      },
      /** Test hook: pose the pair (model units), run n frames headless, report. */
      debugRun: function (pose, n) {
        if (pose) {
          if (pose.ax != null) a.x = pose.ax;
          if (pose.ay != null) a.y = pose.ay;
          if (pose.bx != null) b.x = pose.bx;
          if (pose.by != null) b.y = pose.by;
          if (pose.aa != null) a.angle = pose.aa;
          if (pose.ba != null) b.angle = pose.ba;
        }
        tween = null;
        var info = computeForces();
        var first = { radial: info.radial, gap: info.gap };
        var maxDist = info.dist;
        var minD = info.dist;
        for (var i = 0; i < (n || 0); i++) {
          info = physicsStep(1, false);
          maxDist = Math.max(maxDist, info.dist);
          minD = Math.min(minD, info.dist);
        }
        emitStatus(info);
        return {
          W: W,
          H: H,
          first: first,
          dist: info.dist,
          gap: info.gap,
          radial: info.radial,
          maxDist: maxDist,
          minDist: minD,
          a: { x: a.x, y: a.y, angle: a.angle },
          b: { x: b.x, y: b.y, angle: b.angle },
          status: status,
        };
      },
      destroy: function () {
        stop();
        canvas.removeEventListener('mousedown', onDown);
        canvas.removeEventListener('mousemove', onMove);
        global.removeEventListener('mouseup', onUp);
        canvas.removeEventListener('touchstart', onDown);
        canvas.removeEventListener('touchmove', onMove);
        global.removeEventListener('touchend', onUp);
        if (ro) ro.disconnect();
      },
    };
  }

  global.ImfEngine = {
    create: create,
    prefersReduced: prefersReduced,
    GEOM: GEOM,
    THEME: DEFAULT_THEME,
    cloudLobes: cloudLobes,
    lobedRadii: lobedRadii,
  };
})(window);
