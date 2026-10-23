/**
 * IMF soft 2D interaction engine - clarity over physics.
 *
 * Model (pedagogical, not MD):
 *   - Each molecule carries charge sites (δ+ atoms, δ− lone pairs / atoms, ion charge).
 *     Site–site pushes and pulls give attract vs. repel AND a torque, so orientation matters.
 *   - London dispersion: short-range atom–atom pull scaled by polarizability (contact area counts).
 *   - Induced dipole: a nonpolar molecule near a charge is pulled toward stronger field.
 *   - Overdamped motion (no momentum) with speed / spin caps and walls - nothing can fly away.
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
  var MAX_PAIR_F = 3.0;
  var MAX_IND_F = 1.2;
  var TIER = { soft: 0.75, medium: 1, strong: 1.3 };
  // teaching overrides on top of the site model: keep the textbook strength order
  var BOOST = { 'ion-dipole': 1.6, 'hydrogen-bond': 1.7 };
  var HB_SHARED = 0.35;     // extra H···acceptor links while the pair is still approaching
  var HB_EXTRA = 0.1;       // extra links once the primary H-bond has docked: no ring, no two H on one O
  var HB_DOCKED = 40;       // primary donor H ↔ acceptor site distance that counts as (nearly) docked
  var HB_SWITCH = 0.6;      // the primary H-bond only moves when another is clearly stronger (no flicker)

  var POL = { H: 0.3, C: 0.7, N: 0.7, O: 0.6, F: 0.5, Cl: 1.2, Br: 1.6, Ne: 0.6, Na: 0.3 };
  // Pauling electronegativity - Guide intro labels only
  var EN = { H: 2.1, C: 2.5, N: 3.0, O: 3.5, F: 4.0, Cl: 3.0, Br: 2.8, Ne: null, Na: 0.9 };

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
    Na: ['#c9a8ff', '#7a52e0'],
  };

  // δ+ = red, δ− = yellow, for signs and cloud tints alike
  var POS = '#e8264f';
  var NEG = '#ffc21a';
  var POS_RGB = '232,38,79';
  var NEG_RGB = '255,194,26';
  var NEUTRAL_RGB = '150,160,200';

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

  function lp(cx, cy, angDeg, site, lobe, q, behind) {
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
      behind: !!behind,
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

    G.br2 = {
      atoms: [
        { el: 'Br', x: -14, y: 0, r: 20 },
        { el: 'Br', x: 14, y: 0, r: 20 },
      ],
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
      // H–O–H lies in the screen plane, so the two tetrahedral lone pairs project
      // up the bisector - one toward the viewer, one behind
      lps: [lp(0, -3, -112, 17, 18, -0.42, true), lp(0, -3, -68, 17, 18, -0.42)],
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

    var HB = { h2o: 1, nh3: 1, hf: 1, ch3oh: 1, glucose: 1 };

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
      g.R = R;
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
      field: { x: 0, y: 0 },
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

  function minGap(A, B) {
    var aa = worldAtoms(A);
    var bb = worldAtoms(B);
    var best = Infinity;
    for (var i = 0; i < aa.length; i++) {
      for (var j = 0; j < bb.length; j++) {
        var g = len(bb[j].x - aa[i].x, bb[j].y - aa[i].y) - aa[i].r - bb[j].r;
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
    // 'off' | 'neutral' | 'polar' : polar uses charge tint; neutral is even grey-blue
    var cloudMode = opts.cloudMode || 'polar';
    var viewZoom = opts.zoom != null ? +opts.zoom : 1;
    var cloudPad = opts.cloudPad != null ? +opts.cloudPad : 16;
    var solo = false;
    var hbPrimary = null;
    var T = mergeTheme(opts.theme);
    var onStatus = typeof opts.onStatus === 'function' ? opts.onStatus : null;
    var status = '';
    var outcome = null;
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
      return clamp(Math.min(cssW / 430, cssH / 220), 0.8, 2.6);
    }

    function computeScale() {
      return computeScaleFor(a && a.g ? a.g.R : 0);
    }

    function resize() {
      var oldW = W;
      var oldH = H;
      cssW = canvas.clientWidth || opts.width || 640;
      cssH = canvas.clientHeight || opts.height || 360;
      S = computeScale();
      W = cssW / S;
      H = cssH / S;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      if (a && oldW && oldH) {
        if (solo) {
          a.x = W * 0.5;
          a.y = H * 0.48;
        } else {
          [a, b].forEach(function (body) {
            if (!body) return;
            body.x *= W / oldW;
            body.y *= H / oldH;
            walls(body);
          });
        }
      }
    }

    function homePose() {
      return {
        ax: W * 0.24,
        ay: H * 0.5,
        bx: W * 0.76,
        by: H * 0.5,
      };
    }

    function placeDefault() {
      if (!a || !b) return;
      tween = null;
      var p = homePose();
      a.x = p.ax;
      a.y = p.ay;
      b.x = p.bx;
      b.y = p.by;
      a.angle = 0;
      b.angle = 0;
      a.spinLeft = b.spinLeft = 0;
    }

    function setPair(idA, idB) {
      var mA = global.ImfMolecules.get(idA);
      var mB = global.ImfMolecules.get(idB);
      if (!mA || !mB || !GEOM[idA] || !GEOM[idB]) return;
      solo = false;
      viewZoom = 1;
      showSharedElectrons = false;
      hbPrimary = null;
      outcome = global.ImfPairs.resolve(idA, idB);
      S = computeScale();
      W = cssW / S;
      H = cssH / S;
      a = makeBody(mA, 0, 0, 0, 0.3);
      b = makeBody(mB, 0, 0, 0, 2.1);
      placeDefault();
      status = '';
      computeForces();
      emitStatus();
    }

    /** One molecule centred on the tray - Guide intro layers. */
    function setSolo(id) {
      var m = global.ImfMolecules.get(id);
      if (!m || !GEOM[id]) return;
      solo = true;
      hbPrimary = null;
      outcome = null;
      bridges = [];
      S = computeScaleFor(GEOM[id].R);
      W = cssW / S;
      H = cssH / S;
      // Leave headroom for EN labels / shared-e caption above or below
      var yFrac = showEN ? 0.58 : showSharedElectrons ? 0.5 : 0.5;
      a = makeBody(m, W * 0.5, H * yFrac, 0, 0.3);
      b = null;
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
      if (view.cloudMode !== undefined) cloudMode = view.cloudMode || 'polar';
      if (view.zoom !== undefined) viewZoom = Math.max(0.5, +view.zoom || 1);
      if (view.cloudPad !== undefined) cloudPad = Math.max(6, +view.cloudPad || 16);
      if (solo && a) {
        resize();
      }
    }

    function walls(body) {
      var m = body.g.R + 6;
      body.x = clamp(body.x, m, Math.max(m, W - m));
      body.y = clamp(body.y, m, Math.max(m, H - m));
    }

    /* ---------- forces ---------- */

    function computeForces() {
      bridges = [];
      [a, b].forEach(function (body) {
        body.fx = body.fy = body.torque = 0;
        body.pullX = body.pullY = 0;
        body.field.x = body.field.y = 0;
      });
      if (!a || !b) return { radial: 0, gap: Infinity, dist: Infinity };

      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var dist = len(dx, dy) || 0.0001;
      var fade = smoothFade(dist);
      var mult = (TIER[outcome && outcome.attraction] || 1) * (BOOST[outcome && outcome.force] || 1);
      var radial = 0;
      var esPush = false;
      var esRadialOut = 0;

      function apply(body, px, py, fx, fy) {
        body.fx += fx;
        body.fy += fy;
        body.torque += (px - body.x) * fy - (py - body.y) * fx;
      }

      var sa = worldSites(a);
      var sb = worldSites(b);

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
            if (keyOf(p) === hbPrimary) keep = p;
          });
          if (!keep || keep.f > bestHb.f * HB_SWITCH) keep = bestHb;
          hbPrimary = keyOf(keep);
          var aDonates = sa[keep.i].hb === 'don';
          // molecules with several acceptor atoms (glucose) really can hold more than one H-bond
          var docked =
            !a.g.multiHB && !b.g.multiHB && len(sb[keep.j].x - sa[keep.i].x, sb[keep.j].y - sa[keep.i].y) < HB_DOCKED;
          var used = {};
          used['a' + sa[keep.i].grp] = used['b' + sb[keep.j].grp] = true;
          hbList
            .slice()
            .sort(function (m, n) {
              return m.f - n.f;
            })
            .forEach(function (p) {
              if (keyOf(p) === hbPrimary) return;
              var ka = 'a' + sa[p.i].grp;
              var kb = 'b' + sb[p.j].grp;
              if ((sa[p.i].hb === 'don') !== aDonates || used[ka] || used[kb]) p.f *= docked ? HB_EXTRA : HB_SHARED;
              else used[ka] = used[kb] = true;
            });
        } else {
          hbPrimary = null;
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
          apply(b, sb[p.j].x, sb[p.j].y, p.fx * scale, p.fy * scale);
          apply(a, sa[p.i].x, sa[p.i].y, -p.fx * scale, -p.fy * scale);
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
        for (var c = 0; c < cand.length && shown < 2 && wantKind; c++) {
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
        [[a, b, sb], [b, a, sa]].forEach(function (trip) {
          var target = trip[0];
          var source = trip[1];
          var srcSites = trip[2];
          if (target.g.polar || !srcSites.length) return;
          var h = 1.5;
          var e0 = fieldAt(srcSites, target.x, target.y);
          target.field.x = e0.x;
          target.field.y = e0.y;
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
          var sgn = target === b ? 1 : -1;
          radial += (sgn * sc * (tx * dx + ty * dy)) / dist;
        });
      }

      // dispersion + contact (atom–atom; shape and contact area matter)
      var aa = worldAtoms(a);
      var bb = worldAtoms(b);
      var gapMin = Infinity;
      // two polar molecules: orientation of the dipoles decides attract vs. repel
      var ldfScale = a.g.polar && b.g.polar ? clamp(1 - esRadialOut / 0.03, 0, 1) : 1;
      var ldfX = 0;
      var ldfY = 0;
      for (var p = 0; p < aa.length; p++) {
        for (var q = 0; q < bb.length; q++) {
          var ax = bb[q].x - aa[p].x;
          var ay = bb[q].y - aa[p].y;
          var d = len(ax, ay) || 0.0001;
          var gap = d - aa[p].r - bb[q].r - lobeReach(aa[p], bb[q], b) - lobeReach(bb[q], aa[p], a);
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
          if (gap < CONTACT_PAD) {
            var ov = CONTACT_PAD - gap;
            f2 += CONTACT_K * (ov + 0.25 * ov * ov);
          }
          if (f2) {
            var cx = (aa[p].x + bb[q].x) / 2;
            var cy = (aa[p].y + bb[q].y) / 2;
            apply(b, cx, cy, nx * f2, ny * f2);
            apply(a, cx, cy, -nx * f2, -ny * f2);
          }
        }
      }
      radial += (ldfX * dx + ldfY * dy) / dist;

      // cloud squish cue: lean toward partner when net non-contact pull is inward
      var inward = Math.max(0, -radial);
      var lean = clamp(inward * 2.5, 0, 3.5);
      a.pullX = (dx / dist) * lean;
      a.pullY = (dy / dist) * lean;
      b.pullX = (-dx / dist) * lean;
      b.pullY = (-dy / dist) * lean;

      return { radial: radial, gap: gapMin, dist: dist, esPush: esPush };
    }

    function updateTempDipoles(info) {
      [[a, b], [b, a]].forEach(function (pair) {
        var body = pair[0];
        var other = pair[1];
        var td = body.tdip;
        if (body.g.polar) {
          td.amp = 0;
          return;
        }
        var t = clock;
        var wa = body.seed + t * 0.7 + Math.sin(t * 1.7 + body.seed) * 1.3;
        var wAmp = reduced ? 0 : 0.35 + 0.4 * Math.pow(Math.sin(t * 2.1 + body.seed * 3), 2);
        var vx = Math.cos(wa) * wAmp;
        var vy = Math.sin(wa) * wAmp;

        // shared A→B axis, so both temporary dipoles point the same way (δ+ faces δ−)
        var ux = b.x - a.x;
        var uy = b.y - a.y;
        var ud = len(ux, uy) || 1;
        ux /= ud;
        uy /= ud;

        if (other.g.polar) {
          // induced: δ+ end points along the field (away from partner's + charge)
          var ex = body.field.x;
          var ey = body.field.y;
          var em = len(ex, ey);
          var c = clamp(em / 0.00035, 0, 1);
          if (em > 0) {
            vx = vx * (1 - c) + (ex / em) * c;
            vy = vy * (1 - c) + (ey / em) * c;
          }
        } else {
          // both nonpolar: fluctuations fall into step when close (δ+ faces δ−)
          var corr = clamp(1 - (info.gap - 6) / 40, 0, 1);
          var s = reduced ? 1 : Math.sin(t * 2.4);
          vx = vx * (1 - corr) + ux * s * corr;
          vy = vy * (1 - corr) + uy * s * corr;
        }
        var m = len(vx, vy);
        td.amp = clamp(m, 0, 1);
        td.x = m ? vx / m : 0;
        td.y = m ? vy / m : 0;
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
      body.x += sx;
      body.y += sy;

      var spin = (body.torque * ROT_MOB * f * (pushing ? 1.8 : 1)) / body.g.inertia;
      if (jitter) spin += (Math.random() - 0.5) * 0.006 * f;
      // head-on like charges give zero torque; tip off the balance point so it turns
      if (pushing && body.g.polar && Math.abs(spin) < 0.002 * f) spin += 0.004 * f;
      spin = clamp(spin, -MAX_SPIN * f, MAX_SPIN * f);
      body.angle += spin;
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
      updateTempDipoles(info);
      var held = drag ? (drag.which === 'a' ? a : b) : null;
      [a, b].forEach(function (body) {
        if (body.spinLeft) {
          applySpin(body, f);
          return;
        }
        if (body === held) {
          var spin = clamp((body.torque * ROT_MOB * f) / body.g.inertia, -MAX_SPIN * f, MAX_SPIN * f);
          body.angle += spin;
          return;
        }
        integrate(body, f, jitter && info.dist < CUTOFF, info.esPush || info.radial > 0.02);
      });
      return info;
    }

    function emitStatus(info) {
      if (!a || !b) return;
      info = info || computeForces();
      var next;
      if (info.dist >= CUTOFF * 0.95) next = 'apart';
      else if (info.gap < CONTACT_PAD + 2 && info.radial < 0) next = 'touching';
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

    function contactDistance(ux, uy) {
      var probeA = { g: a.g, x: 0, y: 0, angle: a.angle };
      var probeB = { g: b.g, x: 0, y: 0, angle: b.angle };
      for (var D = 0; D < 400; D += 1) {
        probeB.x = ux * D;
        probeB.y = uy * D;
        if (minGap(probeA, probeB) >= 4) return D;
      }
      return 400;
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function startTween(ax2, ay2, bx2, by2, dur) {
      tween = { t: 0, dur: dur, ax: a.x, ay: a.y, bx: b.x, by: b.y, ax2: ax2, ay2: ay2, bx2: bx2, by2: by2 };
    }

    function bringTogether() {
      if (!a || !b) return;
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var d = len(dx, dy) || 1;
      var ux = dx / d;
      var uy = dy / d;
      var D = contactDistance(ux, uy) + 10;
      var mx = clamp((a.x + b.x) / 2, W * 0.3, W * 0.7);
      var my = clamp((a.y + b.y) / 2, H * 0.3, H * 0.7);
      var ax2 = mx - (ux * D) / 2;
      var ay2 = my - (uy * D) / 2;
      var bx2 = mx + (ux * D) / 2;
      var by2 = my + (uy * D) / 2;
      if (reduced) {
        a.x = ax2;
        a.y = ay2;
        b.x = bx2;
        b.y = by2;
        settleNow();
        return;
      }
      startTween(ax2, ay2, bx2, by2, 700);
    }

    function separate() {
      if (!a || !b) return;
      var p = homePose();
      if (reduced) {
        placeDefault();
        emitStatus();
        return;
      }
      startTween(p.ax, p.ay, p.bx, p.by, 600);
    }

    function rotate(which, delta) {
      var body = which === 'b' ? b : a;
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
      a.x = tween.ax + (tween.ax2 - tween.ax) * e;
      a.y = tween.ay + (tween.ay2 - tween.ay) * e;
      b.x = tween.bx + (tween.bx2 - tween.bx) * e;
      b.y = tween.by + (tween.by2 - tween.by) * e;
      if (u >= 1) tween = null;
      return true;
    }

    function step(dt) {
      if (!a) return;
      clock += dt / 1000;
      if (!b || !outcome) return;
      var f = dt / 16.67;
      if (stepTween(dt)) {
        var infoT = computeForces();
        updateTempDipoles(infoT);
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

    function cloudRgb(atom) {
      if (cloudMode === 'neutral') return T.neutralRgb;
      if (atom.q > 0.05) return T.posRgb;
      if (atom.q < -0.05) return T.negRgb;
      return T.neutralRgb;
    }

    /** When teaching the bond, stretch a diatomic so the shared pair is readable. */
    function viewAtoms(body) {
      var atoms = worldAtoms(body);
      if (!showSharedElectrons || atoms.length < 2) return atoms;
      var cx = 0;
      var cy = 0;
      atoms.forEach(function (w) {
        cx += w.x;
        cy += w.y;
      });
      cx /= atoms.length;
      cy /= atoms.length;
      var k = 1.85;
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
      if (!showBonds || !body.g.bonds.length) return;
      var atoms = viewAtoms(body);
      ctx.save();
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
        ctx.lineWidth = showSharedElectrons ? 5 : 7;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = showSharedElectrons ? 2.2 : 3;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawSharedElectrons(body) {
      if (!showSharedElectrons || !body.g.bonds.length) return;
      var atoms = viewAtoms(body);
      var pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock * 3.2);
      ctx.save();
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

    function drawEN(body) {
      if (!showEN) return;
      var atoms = worldAtoms(body);
      // Draw in CSS-pixel space so zoom does not blow up the chrome
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    function drawCloud(body) {
      if (!showClouds || cloudMode === 'off') return;
      var g = body.g;
      var atoms = worldAtoms(body);
      var px = body.pullX;
      var py = body.pullY;
      var pm = len(px, py);
      var hasLp = g.lps.length > 0;
      var polarTint = cloudMode === 'polar';

      ctx.save();
      ctx.globalCompositeOperation = T.cloudBlend;
      atoms.forEach(function (w) {
        var ox = w.x - body.x;
        var oy = w.y - body.y;
        var od = len(ox, oy) || 1;
        var face = pm ? Math.max(0, (ox * px + oy * py) / (od * pm)) : 0;
        var k = 0.4 + 0.6 * face;
        var rgb = cloudRgb(w.src);
        if (polarTint && hasLp && (w.src.el === 'O' || w.src.el === 'N' || w.src.el === 'F')) rgb = T.negRgb;
        if (polarTint && body.mol.ion) rgb = T.posRgb;
        blob(w.x + px * k, w.y + py * k, w.r + cloudPad + pm * face, rgb, ((polarTint && g.polar) ? 0.28 : 0.2) * T.cloudAlpha);
      });

      // temporary / induced dipole: shift cloud colour across the molecule
      var td = body.tdip;
      if (polarTint && !g.polar && td.amp > 0.04) {
        var R = g.R + cloudPad * 0.6;
        var lg = ctx.createLinearGradient(
          body.x - td.x * R,
          body.y - td.y * R,
          body.x + td.x * R,
          body.y + td.y * R
        );
        var al = 0.42 * td.amp * T.cloudAlpha;
        lg.addColorStop(0, 'rgba(' + T.negRgb + ',' + al + ')');
        lg.addColorStop(0.5, 'rgba(' + T.neutralRgb + ',0)');
        lg.addColorStop(1, 'rgba(' + T.posRgb + ',' + al + ')');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = lg;
        ctx.beginPath();
        atoms.forEach(function (w) {
          var rr = w.r + cloudPad * 0.85;
          ctx.moveTo(w.x + px * 0.6 + rr, w.y + py * 0.6);
          ctx.arc(w.x + px * 0.6, w.y + py * 0.6, rr, 0, Math.PI * 2);
        });
        ctx.fill('nonzero');
      }
      ctx.restore();

      // lone pairs pointing away from the viewer sit behind the atoms
      if (!showLobes) return;
      g.lps.forEach(function (l) {
        if (!l.behind) return;
        var c = toWorld(body, { x: l.lx, y: l.ly });
        lobeShape(c.x + px * 0.8, c.y + py * 0.8, l.ang + body.angle, 12.5, 8.5, T.negRgb, 0.5 * T.lobeAlpha);
      });
    }

    // front lone pairs: drawn over all atoms so a docking H visibly meets the electrons, not the O
    function drawLobes(body) {
      if (!showLobes) return;
      var px = body.pullX;
      var py = body.pullY;
      body.g.lps.forEach(function (l) {
        if (l.behind) return;
        var c = toWorld(body, { x: l.lx, y: l.ly });
        var cx = c.x + px * 0.8;
        var cy = c.y + py * 0.8;
        var ang = l.ang + body.angle;
        lobeShape(cx, cy, ang, 12.5, 8.5, T.negRgb, 0.62 * T.lobeAlpha);
        if (!T.lobeDot) return;
        var nx = -Math.sin(ang) * 2.6;
        var ny = Math.cos(ang) * 2.6;
        ctx.fillStyle = T.lobeDot;
        [1, -1].forEach(function (s) {
          ctx.beginPath();
          ctx.arc(cx + nx * s, cy + ny * s, 1.3, 0, Math.PI * 2);
          ctx.fill();
        });
      });
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
      if (T.badge) {
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
        return;
      }
      ctx.lineWidth = 3;
      ctx.strokeStyle = T.halo;
      ctx.strokeText(t, x, y);
      ctx.fillStyle = color;
      ctx.fillText(t, x, y);
    }

    function drawLabels(body) {
      var g = body.g;
      var c = Math.cos(body.angle);
      var s = Math.sin(body.angle);
      g.labels.forEach(function (lb) {
        var w = toWorld(body, lb);
        var color = lb.t.indexOf('+') >= 0 ? T.pos : T.neg;
        if (!lb.big && !showDeltas) return;
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
        var other = body === a ? b : a;
        var otherAtoms = other ? worldAtoms(other) : [];
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
            textBadge(tx, ty, lb.t, color, lb.small ? 9 : 11);
            break;
          }
        }
      });

      // temporary / induced δ signs appear only when the shift is strong
      var td = body.tdip;
      if (showDeltas && !g.polar && td.amp > 0.6) {
        var R = g.R + 4;
        ctx.globalAlpha = clamp((td.amp - 0.6) / 0.3, 0, 1) * 0.85;
        var partner = body === a ? b : a;
        var partnerAtoms = partner ? worldAtoms(partner) : [];
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
      if (showSharedElectrons || showEN) return;
      var fx = body.x;
      var fy = body.y + g.R + 16;
      if (b && a) {
        var other = body === a ? b : a;
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
      ctx.fillText(body.mol.formula, fx, fy);
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
      drawAtoms(body);
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
      drawBody(a);
      if (b) drawBody(b);
      if (b) drawBridges();

      if (showLabels && outcome) {
        ctx.font = '700 12px ' + T.font;
        ctx.fillStyle = T.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(outcome.label, 12, 20);
      }
    }

    /* ---------- loop + input ---------- */

    var lastT = 0;
    function loop(t) {
      if (!running) return;
      var dt = lastT ? Math.min(32, t - lastT) : 16;
      lastT = t;
      step(dt);
      draw();
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
      var which = hit(a, p) ? 'a' : b && hit(b, p) ? 'b' : null;
      if (!which) return;
      tween = null;
      var body = which === 'a' ? a : b;
      drag = { which: which, ox: body.x - p.x, oy: body.y - p.y };
      evt.preventDefault();
    }

    function onMove(evt) {
      if (!drag) return;
      var p = canvasPoint(evt);
      var body = drag.which === 'a' ? a : b;
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

  global.ImfEngine = { create: create, prefersReduced: prefersReduced, GEOM: GEOM };
})(window);
