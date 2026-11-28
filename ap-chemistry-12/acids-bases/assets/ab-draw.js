/* AbDraw: drawing kit for the Acids and Bases Guides (canvas 2D).
   Look (taste, approved 2026-11-27): light mode "ink and spheres", dark mode "night lab".
   - Particles show their atoms. The role colour sits on the heavy atom; hydrogens are white.
     H₃O⁺ red, OH⁻ violet-blue, other anions yellow, other cations rose, whole molecules grey, water faint.
   - Proton transfers run in three models: Lewis, ball and stick (role colours), space-filling
     (classic atom colours with a red / yellow charge haze). The moving H keeps a red ring in every model.
   - Concentration bars: rounded, gradient fill, no ink edge.
   Particles never want, take or give anything in a label (repo AGENTS.md): protons move, bonds break. */
(function (global) {
  'use strict';

  // ---------- colours ----------
  const C = { acid:'#d62828', base:'#5b5fd6', anion:'#ffd257', cation:'#f06a84', ink:'#1d2433', mol:'#c9ced8' };
  const DPOS = '#e8264f', DNEG = '#ffc21a';              // δ+ / δ− (suite.css): the charge haze
  const ATOM = { O:'#e5533d', H:'#f4f6f8', Cl:'#3fbf5f', F:'#a6db6e', N:'#3f6fe0', Na:'#a98bd6', S:'#e3c03a' };
  const FONT = "'Space Grotesk', Helvetica, sans-serif";
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function pal() {
    return isDark()
      ? { dark:true, stage:'#0b1020', water:'#101c34', waterEdge:'#3a6aa8', ink:'#e8ecf6', dim:'#8f9ab8', glass:'#7fb4ff',
          track:'#141f38', waterMol:'#33406a', molFill:'#8c93b8', h:'#dfe6ff' }
      : { dark:false, stage:'#ffffff', water:'#e3f1fb', waterEdge:'#1d2433', ink:'#1d2433', dim:'#5b6474', glass:'#1d2433',
          track:'#eef1f6', waterMol:'#d5dce7', molFill:'#c9ced8', h:'#ffffff' };
  }

  // ---------- small helpers ----------
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  function tri(u, lo, hi) { const L = hi - lo; let m = ((u - lo) % (2 * L) + 2 * L) % (2 * L); return lo + (m < L ? m : 2 * L - m); }
  function rnd(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, a = Math.abs(amt);
    r = Math.round(r + (f - r) * a); g = Math.round(g + (f - g) * a); b = Math.round(b + (f - b) * a);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function mix(a, b, k) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), m = (x, y) => Math.round(x + (y - x) * k);
    return '#' + ((1 << 24) | (m(A >> 16, B >> 16) << 16) | (m((A >> 8) & 255, (B >> 8) & 255) << 8) | m(A & 255, B & 255)).toString(16).slice(1);
  }
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const ring = (g, x, y, r, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(g, s, x, y, col, size, weight, align, base) {
    g.fillStyle = col; g.font = (weight || 700) + ' ' + size + 'px ' + FONT;
    g.textAlign = align || 'center'; g.textBaseline = base || 'alphabetic'; g.fillText(s, x, y);
  }
  // a shaded sphere. glossy: the space-filling / ball-and-stick look; flat: the particle-window look
  function ball(g, x, y, r, col, glossy) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    if (glossy) { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.28, col); gr.addColorStop(1, shade(col, -0.38)); }
    else { gr.addColorStop(0, shade(col, 0.45)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, -0.18)); }
    g.fillStyle = gr; circ(g, x, y, r);
  }
  function haze(g, x, y, R, col, a) {
    if (a <= 0.01) return;
    const gr = g.createRadialGradient(x, y, R * 0.55, x, y, R * 1.6);
    gr.addColorStop(0, hexA(col, a)); gr.addColorStop(0.6, hexA(col, a * 0.45)); gr.addColorStop(1, hexA(col, 0));
    g.fillStyle = gr; circ(g, x, y, R * 1.6);
  }

  // ---------- particles (particle windows) ----------
  // role: acid / base / anion / cation / mol (whole acid or base molecule) / water
  const SPECIES = {
    H3O: { label:'H₃O⁺', role:'acid',   charge:'+', heavy:'O',  hs:[-90, 30, 150] },
    OH:  { label:'OH⁻',  role:'base',   charge:'−', heavy:'O',  hs:[-35] },
    Cl:  { label:'Cl⁻',  role:'anion',  charge:'−', heavy:'Cl', hs:[] },
    F:   { label:'F⁻',   role:'anion',  charge:'−', heavy:'F',  hs:[] },
    NO3: { label:'NO₃⁻', role:'anion',  charge:'−', heavy:'N',  hs:[] },
    Na:  { label:'Na⁺',  role:'cation', charge:'+', heavy:'Na', hs:[] },
    HF:  { label:'HF',   role:'mol',    charge:'',  heavy:'F',  hs:[0] },
    HCl: { label:'HCl',  role:'mol',    charge:'',  heavy:'Cl', hs:[0] },
    H2O: { label:'H₂O',  role:'water',  charge:'',  heavy:'O',  hs:[38, 142] },
    Sr:  { label:'Sr²⁺', role:'cation', charge:'+', heavy:'Sr', hs:[] },
    Wn:  { label:'H₂O',  role:'h2o',    charge:'',  heavy:'O',  hs:[38, 142] }   // water made by neutralization: full strength
  };
  const HEAVY_R = { O:1.0, Cl:1.28, F:0.98, N:1.05, Na:1.1, Sr:1.2 };
  function roleColour(role, P) {
    return role === 'acid' ? C.acid : role === 'base' ? C.base : role === 'anion' ? C.anion : role === 'cation' ? C.cation
      : role === 'mol' ? P.molFill : role === 'h2o' ? (P.dark ? '#aab4cc' : '#e4ebf3') : P.waterMol;
  }
  function particle(g, key, x, y, s, rot, alpha, P) {
    P = P || pal();
    const sp = SPECIES[key], water = sp.role === 'water', k = water ? 0.62 : 1;
    const col = roleColour(sp.role, P), R = s * k * HEAVY_R[sp.heavy], hr = s * k * 0.56;
    g.save(); g.globalAlpha = alpha * (water ? 0.6 : 1);
    sp.hs.forEach(a => {
      const t = rot + a * Math.PI / 180, hx = x + Math.cos(t) * s * k * 0.95, hy = y + Math.sin(t) * s * k * 0.95;
      if (P.dark) { g.fillStyle = water ? P.waterMol : P.h; if (!water) { g.shadowColor = P.h; g.shadowBlur = 5; } circ(g, hx, hy, hr); g.shadowBlur = 0; }
      else { ball(g, hx, hy, hr, '#ffffff', false); ring(g, hx, hy, hr, water ? 'rgba(29,36,51,0.25)' : P.ink, water ? 1 : 1.3); }
    });
    if (P.dark) {
      if (!water) { g.shadowColor = col; g.shadowBlur = sp.role === 'mol' ? 4 : 16; }
      const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, shade(col, 0.5)); gr.addColorStop(0.7, col); gr.addColorStop(1, shade(col, -0.25));
      g.fillStyle = gr; circ(g, x, y, R); g.shadowBlur = 0;
    } else { ball(g, x, y, R, col, false); ring(g, x, y, R, water ? 'rgba(29,36,51,0.25)' : P.ink, water ? 1 : 1.7); }
    if (!water) {
      const onDark = sp.role === 'acid' || sp.role === 'base';
      if (!sp.hs.length || sp.role === 'mol' || sp.role === 'h2o') { // Cl⁻, F⁻, Na⁺, HF, new H₂O: formula inside the big atom
        text(g, sp.label, x, y + 0.5, (P.dark && sp.role === 'mol') ? '#ffffff' : C.ink, Math.round(s * 0.6), 700, 'center', 'middle');
      } else { // H₃O⁺, OH⁻: charge on the oxygen, formula underneath
        text(g, sp.charge, x, y + 0.5, onDark ? '#ffffff' : C.ink, Math.round(s * 0.9), 700, 'center', 'middle');
        text(g, sp.label, x, y + s * 1.55, P.dark ? shade(col, 0.45) : P.ink, Math.round(s * 0.62), 700, 'center', 'top');
      }
    }
    g.restore();
  }

  // ---------- beakers with depth and collisions (after equilibrium/le-chatelier.html) ----------
  // A beaker keeps its particles between frames. Each has a depth z (−1 back, +1 front): far ones are drawn
  // smaller and fainter, and everything is drawn back to front. Two particles only meet when they are near the same
  // depth, otherwise one slips behind the other; when they meet they are pushed apart (no overlap) and bounce.
  // A thermostat keeps the speeds steady. Reactions happen when particles bump:
  //   react 'neutralize': H₃O⁺ + OH⁻ → 2 H₂O (opposite charges pull together a little, so it finishes in seconds)
  //   react 'kw': pure water's equilibrium, kept at sim.target = { H3O, OH } counts: two waters that bump can pass a
  //     proton (H₃O⁺ + OH⁻) while both are below target; H₃O⁺ and OH⁻ that bump neutralize while either is above it.
  //     An acid or base that is added (one count far below target) appears in the water; a removed one fades.
  //   Any two waters that bump may pass a proton back and forth (a short red hop; both stay water).
  // The particle counts are scaled for the picture; the numbers on the stage are exact.
  const BK = { back: 0.66, fade: 0.38, speed: 26, thermo: 1.4, jitter: 26, zJitter: 0.5, zSpeed: 0.28, dz: 0.5, rest: 0.9 };
  const SIMS = new Map(), MIXES = new WeakMap();
  const isWater = k => k === 'H2O';
  function bodyR(kind, s) { const sp = SPECIES[kind]; return s * (isWater(kind) ? 0.62 * 1.25 : (HEAVY_R[sp.heavy] || 1) * (sp.hs.length ? 1.25 : 1.05)); }
  const newBeaker = t => ({ parts: [], lastT: t, id: 1, flashes: [], target: null, react: null, slow: 0 });
  function beaker(key, t) {   // a canvas that starts again (its time restarts) gets a fresh beaker
    let b = SIMS.get(key);
    if (!b || t < b.lastT - 1e-3) { b = newBeaker(t); SIMS.set(key, b); }
    return b;
  }
  function addPart(b, kind, box, s, at) {
    const r = bodyR(kind, s);
    let x, y, z = Math.random() * 2 - 1, tries = 0;
    do {   // a free spot, so nothing starts overlapping
      x = r + Math.random() * (box.w - 2 * r); y = r + Math.random() * (box.h - 2 * r);
      tries++;
    } while (tries < 30 && b.parts.some(q => Math.abs(q.z - z) < BK.dz && Math.hypot(q.x - x, q.y - y) < q.r + r));
    if (at && at.x != null) { x = at.x; y = at.y; if (at.z != null) z = at.z; }
    const a = Math.random() * Math.PI * 2, v = BK.speed * (0.6 + Math.random() * 0.8);
    const p = { id: b.id++, kind, x, y, z, vx: Math.cos(a) * v + (at && at.vx || 0), vy: Math.sin(a) * v + (at && at.vy || 0), vz: (Math.random() - 0.5) * 0.6,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2, r, s, born: at && at.instant ? 1 : 0, gone: 0, cd: 0, slot: at && at.slot };
    b.parts.push(p);
    return p;
  }
  function setKind(p, kind) { p.kind = kind; p.r = bodyR(kind, p.s); p.cd = 0.5; p.pop = 0.35; }
  function flash(b, x1, y1, x2, y2, type) { b.flashes.push({ x1, y1, x2, y2, type, age: 0 }); }
  const count = (b, k) => b.parts.reduce((n, p) => n + (p.kind === k && !p.gone ? 1 : 0), 0);
  function stepBeaker(b, box, dt) {
    const ps = b.parts;
    // thermostat on the mean speed, as in Le Chatelier
    let sum = 0; ps.forEach(p => { sum += Math.hypot(p.vx, p.vy); });
    const mean = ps.length ? sum / ps.length : 0, th = mean > 1e-3 ? 1 + (BK.speed / mean - 1) * Math.min(1, BK.thermo * dt) : 1;
    const pullOn = b.react === 'neutralize' || b.react === 'kw';   // opposite charges attract
    ps.forEach(p => {
      p.vx *= th; p.vy *= th;
      p.vx += (Math.random() - 0.5) * BK.jitter * dt; p.vy += (Math.random() - 0.5) * BK.jitter * dt;
      p.vz += (Math.random() - 0.5) * BK.zJitter * dt; p.vz = clamp(p.vz, -BK.zSpeed * 2, BK.zSpeed * 2);
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
      if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * BK.rest; } else if (p.x > box.w - p.r) { p.x = box.w - p.r; p.vx = -Math.abs(p.vx) * BK.rest; }
      if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * BK.rest; } else if (p.y > box.h - p.r) { p.y = box.h - p.r; p.vy = -Math.abs(p.vy) * BK.rest; }
      if (p.z < -1) { p.z = -1; p.vz = Math.abs(p.vz); } else if (p.z > 1) { p.z = 1; p.vz = -Math.abs(p.vz); }
      p.born = Math.min(1, p.born + dt * 3); if (p.cd > 0) p.cd -= dt;
      if (p.pop > 0) p.pop = Math.max(0, p.pop - dt);
      if (p.toWater > 0) { p.toWater -= dt; if (p.toWater <= 0) { p.kind = 'H2O'; p.r = bodyR('H2O', p.s); } }
      if (p.gone) p.gone += dt * 2.5;
    });
    // H₃O⁺ and OH⁻ attract when they can react (opposite charges)
    if (pullOn) {
      const H = ps.filter(p => p.kind === 'H3O' && !p.gone), O = ps.filter(p => p.kind === 'OH' && !p.gone);
      H.forEach(h => { let best = null, bd = 1e9; O.forEach(o => { const d = Math.hypot(o.x - h.x, o.y - h.y); if (d < bd) { bd = d; best = o; } });
        if (best && bd > 1) { const f = (b.react === 'kw' ? 16 : 40) * dt / bd; h.vx += (best.x - h.x) * f; h.vy += (best.y - h.y) * f; best.vx -= (best.x - h.x) * f; best.vy -= (best.y - h.y) * f; h.vz += (best.z - h.z) * 2 * dt; best.vz -= (best.z - h.z) * 2 * dt; } });
    }
    // collisions: only near the same depth; push apart, bounce, maybe react
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const A = ps[i], B = ps[j];
      if (A.gone || B.gone || Math.abs(A.z - B.z) > BK.dz) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), min = (A.r + B.r) * 0.92;
      if (d >= min || d < 1e-6) continue;
      const nx = dx / d, ny = dy / d, push = (min - d) * 0.5;
      A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
      const rel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
      if (rel <= 0) continue;
      const jv = -(1 + BK.rest) * rel * 0.5;
      A.vx += jv * nx; A.vy += jv * ny; B.vx -= jv * nx; B.vy -= jv * ny;
      const kz = (Math.random() - 0.5) * 0.5; A.vz += kz; B.vz -= kz;
      if (A.cd > 0 || B.cd > 0) continue;
      react(b, A, B);
    }
    // 'kw': an acid or base added or taken away
    if (b.react === 'kw' && b.target) {
      ['H3O', 'OH'].forEach(k => {
        const other = k === 'H3O' ? 'OH' : 'H3O', n = count(b, k), want = b.target[k];
        // an acid or base was added: its ions come in quickly (a few at a time) until the count is right
        if (n < want - 1 && count(b, other) >= b.target[other]) { b.slow += dt; if (b.slow > 0.06) { b.slow = 0; addPart(b, k, box, ps[0] ? ps[0].s : 13); } }
        if (n > want + 2 && count(b, other) <= b.target[other]) { const p = ps.find(q => q.kind === k && !q.gone); if (p && Math.random() < dt * 6) p.gone = 0.01; }
      });
    }
    b.parts = ps.filter(p => !(p.gone > 1));
    b.flashes.forEach(f => { f.age += dt; }); b.flashes = b.flashes.filter(f => f.age < 0.5);
  }
  function react(b, A, B) {
    const pair = (k1, k2) => (A.kind === k1 && B.kind === k2) || (A.kind === k2 && B.kind === k1);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    if (pair('H3O', 'OH')) {
      // 'kw': above the target they always recombine; at it, often (the reverse reaction never stops)
      const ok = b.react === 'neutralize' || (b.react === 'kw' && b.target &&
        (count(b, 'H3O') > b.target.H3O || count(b, 'OH') > b.target.OH || Math.random() < 0.4));
      if (!ok) return;
      const h = A.kind === 'H3O' ? A : B, o = h === A ? B : A;
      flash(b, h.x, h.y, o.x, o.y, 'hop'); flash(b, mx, my, mx, my, 'burst');
      setKind(A, 'Wn'); setKind(B, 'Wn');
      if (b.react === 'kw') A.toWater = B.toWater = 0.9;   // full-strength water for a moment, then back into the background
      b.recombined = (b.recombined || 0) + 1;
      return;
    }
    if (isWater(A.kind) && isWater(B.kind)) {
      // self-ionization: while neither ion is more than one above its target, a bump sometimes passes a proton
      if (b.react === 'kw' && b.target && count(b, 'H3O') <= b.target.H3O && count(b, 'OH') <= b.target.OH && Math.random() < 0.2) {
        flash(b, B.x, B.y, A.x, A.y, 'hop'); setKind(A, 'H3O'); setKind(B, 'OH');
        b.formed = (b.formed || 0) + 1;
      } else if (Math.random() < 0.12) {
        flash(b, A.x, A.y, B.x, B.y, 'hop'); A.cd = B.cd = 0.8;   // a proton passes across and both stay water
      }
    }
  }
  function drawBeaker(g, b, box, P) {
    b.parts.slice().sort((p, q) => p.z - q.z).forEach(p => {
      const zN = (p.z + 1) / 2, sc = (BK.back + (1 - BK.back) * zN) * (1 + 0.45 * (p.pop || 0)), a = (1 - BK.fade * (1 - zN)) * p.born * (p.gone ? Math.max(0, 1 - p.gone) : 1);
      particle(g, p.kind, box.x + p.x, box.y + p.y, p.s * sc, p.rot, a, P);
    });
    b.flashes.forEach(f => {
      const k = f.age / 0.5;
      if (f.type === 'hop') {   // the proton crossing from one particle to the other
        const x = box.x + f.x1 + (f.x2 - f.x1) * Math.min(1, k * 1.6), y = box.y + f.y1 + (f.y2 - f.y1) * Math.min(1, k * 1.6);
        g.save(); g.globalAlpha = 1 - k; g.fillStyle = C.acid; if (P.dark) { g.shadowColor = C.acid; g.shadowBlur = 10; } circ(g, x, y, 3.5); g.restore();
      } else {
        g.save(); g.globalAlpha = (1 - k) * 0.8; ring(g, box.x + f.x1, box.y + f.y1, 6 + k * 22, P.dark ? '#cfe3ff' : '#7aa7d6', 2.5); g.restore();
      }
    });
  }
  // keep a beaker's particles matching a list of kinds (one per slot; null = nothing in that slot) plus background water
  function syncBeaker(b, box, list, nWater, s) {
    if (!b.init) {
      b.init = true;
      for (let i = 0; i < nWater; i++) addPart(b, 'H2O', box, s, { instant: true });
    }
    if (!list) return;
    list.forEach((k, i) => {
      const p = b.parts.find(q => q.slot === i);
      if (k && !p) { const n = addPart(b, k, box, s); n.slot = i; n.born = b.ready ? 0 : 1; }
      else if (!k && p) b.parts.splice(b.parts.indexOf(p), 1);
      else if (k && p && p.kind !== k && p.cd <= 0) setKind(p, k);
    });
    b.ready = true;
  }

  // a window of solution: list = species keys; water drifts behind. Positions are stateless, so time can jump.
  // opts.key: a beaker with depth and collisions instead (above); opts.react, opts.target as there.
  function solutionWindow(g, box, list, t, opts) {
    opts = opts || {};
    const P = pal(), { x, y, w, h } = box, seed = opts.seed || 0, s = opts.size || 13;
    g.save(); rrect(g, x, y, w, h, 12);
    g.fillStyle = P.water; g.fill();
    if (P.dark) { g.strokeStyle = hexA('#6fa8e8', 0.55); g.lineWidth = 1.5; g.shadowColor = '#6fa8e8'; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0; }
    else { g.strokeStyle = P.waterEdge; g.lineWidth = 2; g.stroke(); }
    g.clip();
    if (opts.key) {
      const b = beaker(opts.key, t), inner = { x: x + 4, y: y + 4, w: w - 8, h: h - 8 }, dt = clamp(t - b.lastT, 0, 0.05);
      b.lastT = t; b.react = opts.react || null; b.target = opts.target || null;
      syncBeaker(b, inner, list, opts.water != null ? opts.water : Math.round(w * h / 1500), s);
      stepBeaker(b, inner, dt);
      drawBeaker(g, b, inner, P);
      g.restore();
      return b;
    }
    const x0 = x + 16, x1 = x + w - 16, y0 = y + 16, y1 = y + h - 22;
    const nWater = opts.water != null ? opts.water : Math.round(w * h / 1500);
    for (let i = 0; i < nWater; i++) {
      const px = tri(x0 + rnd(i, 1 + seed) * (x1 - x0) + (rnd(i, 3) - 0.5) * 14 * t, x0, x1);
      const py = tri(y0 + rnd(i, 2 + seed) * (y1 - y0) + (rnd(i, 4) - 0.5) * 12 * t, y0, y1);
      particle(g, 'H2O', px, py, s * 0.75, t * 0.6 + i, 0.75, P);
    }
    list.map((key, i) => ({ key, i, z: rnd(i, 9 + seed),
      x: tri(x0 + rnd(i, 5 + seed) * (x1 - x0) + (rnd(i, 7) - 0.5) * 22 * t, x0, x1),
      y: tri(y0 + rnd(i, 6 + seed) * (y1 - y0) + (rnd(i, 8) - 0.5) * 18 * t, y0, y1) }))
      .sort((a, b) => a.z - b.z)
      .filter(p => p.key)   // null: an empty place (a particle poured out, or not here yet); the rest keep their spots
      .forEach(p => particle(g, p.key, p.x, p.y, s * (0.82 + p.z * 0.3), t * 0.5 + p.i * 1.7, 0.6 + p.z * 0.4, P));
    g.restore();
  }

  // ---------- proton transfer (Lewis / ball and stick / space-filling) ----------
  // spec: {
  //   L: acceptor (or null: the proton just leaves) { sym, hs:[deg], lps:[deg], acc:deg, become:'acid'|'cation', charge:'+' }
  //   R: donor (or null: a bare proton arrives)     { sym, hs:[deg], lps:[deg], don:deg, become:'base'|'anion', charge:'−' }
  //   eq: [[html-free text, side, role]], caps: ['before', 'after'] }
  // f: 0 = reactants, 1 = products (the controller eases it).
  // opts.fL / opts.fR run the acceptor and donor sides separately, and opts.hp places the proton (protonStory)
  const BOND = { lewis:44, ball:50, fill:30 };
  const R_FILL = { N:25, O:24, F:23, Cl:28, S:28, H:15 }, R_BALL = { N:17, O:17, F:16, Cl:19, S:19, H:11 };
  const at = (p, deg, d) => ({ x: p.x + Math.cos(deg * Math.PI / 180) * d, y: p.y + Math.sin(deg * Math.PI / 180) * d });
  function transferGeom(W, H, spec, model) {
    const bl = BOND[model], cy = H * 0.47;
    const Lp = { x: W * (spec.R ? 0.3 : 0.4), y: cy }, Rp = { x: W * (spec.L ? 0.7 : 0.6), y: cy };
    const hStart = spec.R ? at(Rp, spec.R.don, bl) : { x: W * 0.8, y: cy - 40 };
    const hEnd = spec.L ? at(Lp, spec.L.acc, bl) : { x: W * 0.22, y: cy - 30 };
    return { bl, cy, Lp, Rp, hStart, hEnd };
  }
  function transfer(g, W, H, spec, f, model, t, opts) {
    opts = opts || {};
    const P = pal();
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const { bl, cy, Lp, Rp, hStart, hEnd } = transferGeom(W, H, spec, model);
    const fL = opts.fL != null ? opts.fL : f, fR = opts.fR != null ? opts.fR : f;
    const free = opts.fL != null ? Math.min(fR, 1 - fL) : 0;     // the proton between the two (H⁺ label)
    const hp = opts.hp || { x: hStart.x + (hEnd.x - hStart.x) * f, y: hStart.y + (hEnd.y - hStart.y) * f - Math.sin(Math.PI * f) * 18 };
    const darkStage = P.dark;
    const inkCol = P.ink;
    const roleOf = r => r === 'acid' ? C.acid : r === 'base' ? C.base : r === 'anion' ? C.anion : r === 'mol' ? P.molFill : C.cation;
    // text in a role colour: yellow and rose are too pale for text on white, so they darken in light mode
    const roleText = r => r === 'mol' ? inkCol : darkStage ? shade(roleOf(r), 0.3) : r === 'anion' ? '#a07b0c' : r === 'cation' ? '#c23a5a' : roleOf(r);
    const heavyCol = (m, fs) => model === 'fill' || model === 'lewis' ? ATOM[m.sym] : mix(P.molFill, roleOf(m.become), fs);
    const letterCol = (sym, fs) => sym === 'H' || (sym === 'S' && model === 'fill') ? C.ink : (model === 'ball' && (fs == null ? f : fs) < 0.5 ? C.ink : '#ffffff');

    function bond(a, b, alpha) {
      if (alpha <= 0.01) return;
      g.save(); g.globalAlpha = alpha;
      if (model === 'ball') { g.strokeStyle = darkStage ? '#8a96ab' : '#9aa6b8'; g.lineWidth = 7; g.lineCap = 'round'; }
      else { g.strokeStyle = inkCol; g.lineWidth = 2.6; if (darkStage) { g.shadowColor = '#9fc0ff'; g.shadowBlur = 6; } }
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), k1 = 15 / L, k2 = (L - 13) / L;
      g.beginPath(); g.moveTo(a.x + dx * k1, a.y + dy * k1); g.lineTo(a.x + dx * k2, a.y + dy * k2); g.stroke(); g.restore();
    }
    function pair(p, deg, alpha) {
      if (alpha <= 0.01 || model === 'fill') return;
      const a = deg * Math.PI / 180, d = model === 'ball' ? 27 : 22, cx = p.x + Math.cos(a) * d, cyy = p.y + Math.sin(a) * d, ox = -Math.sin(a) * 4.5, oy = Math.cos(a) * 4.5;
      g.save(); g.globalAlpha = alpha; g.fillStyle = inkCol;
      if (darkStage) { g.shadowColor = '#9fc0ff'; g.shadowBlur = 5; }
      circ(g, cx + ox, cyy + oy, 3.2); circ(g, cx - ox, cyy - oy, 3.2); g.restore();
    }
    function letter(sym, p, size, col) { text(g, sym, p.x, p.y + 0.5, col, size, 700, 'center', 'middle'); }
    function atom(sym, p, col, isProton, fs) {
      if (model === 'lewis') {
        g.save();
        if (isProton) { g.fillStyle = C.acid; if (darkStage) { g.shadowColor = C.acid; g.shadowBlur = 18; } circ(g, p.x, p.y, 15); g.shadowBlur = 0; letter('H', p, 20, '#ffffff'); }
        else letter(sym, p, sym === 'H' ? 22 : 26, inkCol);
        g.restore(); return;
      }
      const r = (model === 'fill' ? R_FILL : R_BALL)[sym];
      if (darkStage && sym !== 'H' && model === 'fill') { g.save(); g.shadowColor = '#6fa8e8'; g.shadowBlur = 10; ball(g, p.x, p.y, r, col, true); g.restore(); }
      else ball(g, p.x, p.y, r, col, true);
      letter(sym, p, sym === 'H' ? (model === 'fill' ? 12 : 11) : (model === 'fill' ? 16 : 13), letterCol(sym, fs));
      if (isProton) ring(g, p.x, p.y, r + 3, C.acid, 3);
    }

    const Lhs = spec.L ? spec.L.hs.map(a => at(Lp, a, bl)) : [];
    const Rhs = spec.R ? spec.R.hs.map(a => at(Rp, a, bl)) : [];
    // space-filling: the charge haze first, behind the spheres
    if (model === 'fill') {
      const a = darkStage ? 0.55 : 0.45;
      const hz = (m, p, extra, fs) => {
        if (m.charge0) haze(g, p.x + 4, p.y, R_FILL[m.sym] + extra, m.charge0 === '+' ? DPOS : DNEG, a * (1 - fs));
        if (m.charge) haze(g, p.x + 4, p.y, R_FILL[m.sym] + extra, m.charge === '+' ? DPOS : DNEG, a * fs);
      };
      if (spec.L) hz(spec.L, Lp, 24, fL);
      if (spec.R) hz(spec.R, Rp, 20, fR);
      if (!spec.R) haze(g, hp.x, hp.y, R_FILL.H + 6, DPOS, 0.45 * (1 - f));          // the bare proton, before it lands
      if (!spec.L) haze(g, hp.x, hp.y, R_FILL.H + 6, DPOS, 0.45 * f);                // the proton, once it has left
      if (free) haze(g, hp.x, hp.y, R_FILL.H + 6, DPOS, 0.45 * free);
      [...Lhs, ...Rhs].forEach(p => atom('H', p, ATOM.H));
      if (spec.L) atom(spec.L.sym, Lp, heavyCol(spec.L, fL), false, fL);
      if (spec.R) atom(spec.R.sym, Rp, heavyCol(spec.R, fR), false, fR);
      atom('H', hp, ATOM.H, true); // last, so its red ring reads over the atom it is bonded to
    } else {
      if (spec.L) {
        Lhs.forEach(p => bond(Lp, p, 1));
        spec.L.lps.forEach(a => pair(Lp, a, 1));
        pair(Lp, spec.L.acc, 1 - fL);
        bond(Lp, hEnd, fL);
      }
      if (spec.R) {
        Rhs.forEach(p => bond(Rp, p, 1));
        spec.R.lps.forEach(a => pair(Rp, a, 1));
        pair(Rp, spec.R.don, fR);
        bond(Rp, hStart, 1 - fR);
      }
      Lhs.forEach(p => atom('H', p, ATOM.H)); Rhs.forEach(p => atom('H', p, ATOM.H));
      if (spec.L) atom(spec.L.sym, Lp, heavyCol(spec.L, fL), false, fL);
      if (spec.R) atom(spec.R.sym, Rp, heavyCol(spec.R, fR), false, fR);
      atom('H', hp, ATOM.H, true);
    }
    // charges, fading in with the products
    const chOf = x => clamp(x * 1.4 - 0.2, 0, 1), ch = chOf(f);
    const signCol = m => model === 'fill' ? (m.charge === '+' ? DPOS : (darkStage ? DNEG : '#a07b0c')) : roleText(m.become);
    g.save();
    const signCol0 = m => model === 'fill' ? (m.charge0 === '+' ? DPOS : (darkStage ? DNEG : '#a07b0c')) : roleText(m.charge0 === '+' ? 'cation' : 'anion');
    g.globalAlpha = 1 - chOf(fL); if (spec.L && spec.L.charge0) text(g, spec.L.charge0, Lp.x + 38, Lp.y - 38, signCol0(spec.L), 26, 700);
    g.globalAlpha = 1 - chOf(fR); if (spec.R && spec.R.charge0) text(g, spec.R.charge0, Rp.x + 40, Rp.y - 36, signCol0(spec.R), 28, 700);
    g.globalAlpha = chOf(fL); if (spec.L && spec.L.charge) text(g, spec.L.charge, Lp.x + 38, Lp.y - 38, signCol(spec.L), 26, 700);
    g.globalAlpha = chOf(fR); if (spec.R && spec.R.charge) text(g, spec.R.charge, Rp.x + 40, Rp.y - 36, signCol(spec.R), 28, 700);
    g.globalAlpha = ch; if (!spec.L) text(g, 'H⁺', hp.x, hp.y - 26, darkStage ? shade(C.acid, 0.35) : C.acid, 17, 700);
    g.globalAlpha = free; if (free > 0.01) text(g, 'H⁺', hp.x, hp.y - 26, darkStage ? shade(C.acid, 0.35) : C.acid, 17, 700);
    g.restore();
    if (!spec.R) { g.save(); g.globalAlpha = 1 - ch; text(g, 'H⁺', hp.x, hp.y - 26, darkStage ? shade(C.acid, 0.35) : C.acid, 17, 700); g.restore(); }

    // equation strip: the current side is ink, the other side dim; products take their role colours
    if (spec.eq) {
      const after = f > 0.5;
      g.font = '700 19px ' + FONT;
      let wsum = 0; const ws = spec.eq.map(e => { const w = g.measureText(e[0]).width; wsum += w; return w; });
      let x = W / 2 - wsum / 2; const y = H - (opts.tags ? 42 : 18);
      spec.eq.forEach((e, i) => {
        const [s, side, role, tag] = e; let col = P.dim;
        if (opts.tags && tag) { // acid / base pill under the formula
          const cx = x + ws[i] / 2, pw = 46, ph = 20;
          g.save(); rrect(g, cx - pw / 2, y + 10, pw, ph, 10); g.fillStyle = tag === 'acid' ? C.acid : C.base; g.fill(); g.restore();
          text(g, tag, cx, y + 24.5, '#ffffff', 12, 700);
          g.font = '700 19px ' + FONT;
        }
        if (opts.tags) col = P.ink;
        if ((side === 0 && !after) || (side === 1 && after) || side === -1) col = P.ink;
        if (side === 1 && after && role) col = roleText(role);
        if (side === -1) col = P.dim;
        g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); x += ws[i];
      });
    }
  }

  // ---------- What is H⁺? HCl's H–Cl bond breaks, a zoom on the H⁺, then that proton bonds to water ----------
  // spec: a transfer spec with both sides (L water, R Cl). pos: 0 HCl + H₂O · 1 bond broken, H⁺ free between them ·
  // 2 zoomed in on the H⁺ (one proton, no electron) · 3 zoomed back out, the same proton bonded to water (H₃O⁺)
  function protonStory(g, W, H, spec, pos, model, t) {
    const P = pal();
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const { cy, hStart, hEnd } = transferGeom(W, H, spec, model);
    const brk = ease(clamp(pos, 0, 1));
    const zoom = pos <= 2 ? ease(clamp(pos - 1, 0, 1)) : 1 - ease(clamp((pos - 2) / 0.4, 0, 1));
    const travel = ease(clamp((pos - 2.3) / 0.7, 0, 1));
    const M = { x: (hStart.x + hEnd.x) / 2, y: cy - 46 };                 // where the free H⁺ waits
    const hp = travel > 0
      ? { x: M.x + (hEnd.x - M.x) * travel, y: M.y + (hEnd.y - M.y) * travel - Math.sin(Math.PI * travel) * 10 }
      : { x: hStart.x + (M.x - hStart.x) * brk, y: hStart.y + (M.y - hStart.y) * brk };
    // the zoom: scale about the proton while it slides to the middle of the picture
    const pr = model === 'ball' ? R_BALL.H + 3 : 15, Z = 1 + (60 / pr - 1) * zoom;
    const C0 = { x: W / 2, y: H * 0.46 }, Cp = { x: hp.x + (C0.x - hp.x) * zoom, y: hp.y + (C0.y - hp.y) * zoom };
    g.save(); g.translate(Cp.x, Cp.y); g.scale(Z, Z); g.translate(-hp.x, -hp.y);
    transfer(g, W, H, spec, 0, model, t, { fR: brk, fL: travel, hp });
    g.restore();
    // close up: one proton, and the dashed outline where hydrogen's electron would be
    const k = clamp((zoom - 0.55) / 0.45, 0, 1);
    if (k <= 0.01) return;
    g.save(); g.globalAlpha = k;
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const r = pr * Z, R = r * 1.85;
    g.save(); g.setLineDash([7, 7]); g.strokeStyle = P.dim; g.lineWidth = 2; g.beginPath(); g.arc(Cp.x, Cp.y, R, 0, Math.PI * 2); g.stroke(); g.restore();
    text(g, 'no electron', Cp.x + R + 12, Cp.y, P.dim, 16, 700, 'left', 'middle');
    if (P.dark) { g.save(); g.shadowColor = C.acid; g.shadowBlur = 30; ball(g, Cp.x, Cp.y, r, C.acid, false); g.restore(); }
    else { ball(g, Cp.x, Cp.y, r, C.acid, false); ring(g, Cp.x, Cp.y, r, P.ink, 2); }
    text(g, 'p⁺', Cp.x, Cp.y + 2, '#ffffff', 40, 700, 'center', 'middle');
    text(g, 'H⁺ = 1 proton', Cp.x, Cp.y + R + 30, P.dark ? shade(C.acid, 0.35) : C.acid, 22, 700);
    g.restore();
  }

  // ---------- Part 1.2: the Kw balance ----------
  // lh: log10 [H⁺] (eased by the controller). The two terms of Kw grow and shrink with their concentration (as the
  // resizing Coulomb's law in Chemistry 11H Unit 1); their product stays 1.00 × 10⁻¹⁴. Below: a scaled particle window
  // and the two concentrations as bars on a powers-of-ten scale.
  const sciStr = (v, sig) => { const e = Math.floor(Math.log10(v) + 1e-9); let m = (v / Math.pow(10, e)).toFixed((sig || 2) - 1); return m + ' × 10' + sup(e); };
  function kwBalance(g, W, H, lh, t) {
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const lo = -14 - lh, h = Math.pow(10, lh), oh = Math.pow(10, lo);
    const acidT = P.dark ? shade(C.acid, 0.35) : C.acid, baseT = P.dark ? shade(C.base, 0.35) : C.base;
    const fs = l => clamp(30 * (1 + (l + 7) * 0.12), 13, 66);
    const parts = [['[H⁺]', fs(lh), acidT], ['[OH⁻]', fs(lo), baseT], ['  =  1.00 × 10⁻¹⁴', 28, P.ink]];
    const ws = parts.map(p => { g.font = '700 ' + p[1] + 'px ' + FONT; return g.measureText(p[0]).width; });
    let x = W / 2 - ws.reduce((a, b) => a + b, 0) / 2; const base = 86;
    parts.forEach((p, i) => { text(g, p[0], x, base, p[2], p[1], 700, 'left'); x += ws[i]; });
    // the two values on their own line, so they never collide when the terms shrink
    g.font = '700 17px ' + FONT;
    const v1 = '[H⁺] = ' + sciStr(h) + ' M', v2 = '[OH⁻] = ' + sciStr(oh) + ' M', w1 = g.measureText(v1).width, gap = 36;
    const w2 = g.measureText(v2).width, x1 = W / 2 - (w1 + gap + w2) / 2;
    text(g, v1, x1, base + 32, acidT, 17, 700, 'left');
    text(g, v2, x1 + w1 + gap, base + 32, baseT, 17, 700, 'left');
    // particles: about 3 of each in neutral water, more of whichever is larger (scaled; there is always some of both)
    const n = l => clamp(Math.round(3 * Math.pow(1.45, l + 7)), 1, 30);   // pure water 3 and 3; 0.10 M HCl 28 and 1 (scaled)
    const box = { x: 20, y: 136, w: W * 0.6, h: H - 152 }, target = { H3O: n(lh), OH: n(lo) };
    const S = 11, b = solutionWindow(g, box, null, t, { key: 'kw', react: 'kw', target, size: S, water: 64 });
    if (!b.seeded) {   // start at the balance, not from zero
      b.seeded = true;
      const inner = { x: 0, y: 0, w: box.w - 8, h: box.h - 8 };
      for (let i = 0; i < target.H3O; i++) addPart(b, 'H3O', inner, S, { instant: true });
      for (let i = 0; i < target.OH; i++) addPart(b, 'OH', inner, S, { instant: true });
    }
    text(g, 'scaled', box.x + box.w - 10, box.y + box.h - 8, P.dim, 11, 500, 'right');
    logBars(g, { x: W * 0.6 + 90, y: 146, w: W * 0.4 - 110, h: H - 200 },
      [{ v: h, col: C.acid, label: '[H⁺]' }, { v: oh, col: C.base, label: '[OH⁻]' }]);
  }

  // ---------- Part 1.2: the pH strip, with [H⁺], [OH⁻] and pOH lined up under it ----------
  function phStrip(g, W, H, ph) {
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const x0 = 70, x1 = W - 30, X = v => x0 + (x1 - x0) * v / 14, y = 58, sh = 34;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, C.acid); gr.addColorStop(0.5, P.dark ? '#59627e' : '#d9dee8'); gr.addColorStop(1, C.base);
    g.save(); rrect(g, x0, y, x1 - x0, sh, 10); g.fillStyle = gr; g.fill(); g.restore();
    text(g, 'pH', x0 - 14, y + sh / 2 + 1, P.ink, 17, 700, 'right', 'middle');
    const rows = [['[H⁺]', i => '10' + sup(-i), y + sh + 52], ['[OH⁻]', i => '10' + sup(i - 14), y + sh + 96], ['pOH', i => String(14 - i), y + sh + 140]];
    for (let i = 0; i <= 14; i++) {
      text(g, String(i), X(i), y - 10, P.ink, 15, 700);
      rows.forEach(r => text(g, r[1](i), X(i), r[2], P.dim, i % 2 ? 0 : 13, 700));
    }
    rows.forEach(r => text(g, r[0], x0 - 14, r[2] - 4, P.ink, 15, 700, 'right', 'middle'));
    // the marker: a line down through every row at this pH
    const mx = X(clamp(ph, 0, 14));
    g.save(); g.strokeStyle = P.ink; g.lineWidth = 2.5; g.setLineDash([5, 5]);
    g.beginPath(); g.moveTo(mx, y - 4); g.lineTo(mx, y + sh + 152); g.stroke(); g.restore();
    g.save(); g.fillStyle = P.ink; g.beginPath(); g.moveTo(mx, y + sh + 2); g.lineTo(mx - 9, y + sh + 14); g.lineTo(mx + 9, y + sh + 14); g.closePath(); g.fill(); g.restore();
    const lab = ph < 6.995 ? 'acidic' : ph > 7.005 ? 'basic' : 'neutral';
    text(g, lab, mx, y + sh + 176, ph < 6.995 ? (P.dark ? shade(C.acid, 0.35) : C.acid) : ph > 7.005 ? (P.dark ? shade(C.base, 0.35) : C.base) : P.ink, 18, 700);
  }

  // ---------- Part 1.3: mixing a strong acid and a strong base ----------
  // spec: { acid: { title, vol, list }, base: { title, vol, list }, mixTitle }   (vol in mL; lists include their water)
  // Three glass beakers drawn to one scale, with graduations, so the volumes add up: the acid and the base at their
  // volumes, the mixture empty. pos: 0 before · 0 → 1 the pour (both drain together, particles and all, and the
  // mixture fills to the total volume) · past 1.5 the reaction: each H₃O⁺ that bumps an OH⁻ makes 2 H₂O, until one runs
  // out. The beakers have depth and collisions (beaker physics above). Columns line up with MIX_COLS for the working.
  const MIX_GAP = 18, MIX_PAD = 20;
  function mixScene(g, W, H, spec, pos, t) {
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const A = spec.acid.list, B = spec.base.list, all = A.concat(B), n = all.length;
    const vA = spec.acid.vol, vB = spec.base.vol, vT = vA + vB, cap = Math.ceil(vT / 10) * 10 + 10, S = 11;
    const w = (W - 2 * MIX_PAD - 2 * MIX_GAP) / 3;
    const top = 30, bot = H - 34;
    const geo = k => {   // the beaker in column k: its body, and the liquid for a given volume
      const x0 = MIX_PAD + k * (w + MIX_GAP) + 16, x1 = MIX_PAD + k * (w + MIX_GAP) + w - 16, inTop = top + 8;
      const yOfV = v => bot - (v / cap) * (bot - inTop);
      return { x0, x1, yOfV, liq: v => ({ x: x0 + 3, y: yOfV(v), w: x1 - x0 - 6, h: Math.max(1, bot - 3 - yOfV(v)) }) };
    };
    // the pour order: both beakers drain at the same rate, so particle i comes from whichever is further behind
    const order = all.map((k, i) => ({ i, f: i < A.length ? (i + 0.5) / A.length : (i - A.length + 0.5) / B.length })).sort((a, b) => a.f - b.f).map(o => o.i);
    let st = MIXES.get(spec);
    const fresh = () => {
      st = { a: newBeaker(t), b: newBeaker(t), m: newBeaker(t), poured: 0, reacting: false };
      const la = geo(0).liq(vA), lb = geo(1).liq(vB);
      A.forEach((k, i) => { const p = addPart(st.a, k, { w: la.w, h: la.h }, S); p.slot = i; p.born = 1; });
      B.forEach((k, i) => { const p = addPart(st.b, k, { w: lb.w, h: lb.h }, S); p.slot = A.length + i; p.born = 1; });
      MIXES.set(spec, st);
    };
    if (!st) fresh();
    global.AbDraw && (global.AbDraw.__lastMix = st.m);   // dev: dev/beaker-test.js
    const pour = clamp(pos, 0, 1), want = Math.ceil(pour * n - 1e-6), react = pos > 1.5;
    if (want < st.poured || (st.reacting && !react)) { const keep = want; fresh(); pourTo(keep, true); }
    pourTo(want, false);
    st.reacting = react;
    // how much is in each beaker right now, from how many particles have been poured
    const outA = order.slice(0, st.poured).filter(i => i < A.length).length / A.length, outB = order.slice(0, st.poured).filter(i => i >= A.length).length / B.length;
    const nowA = vA * (1 - outA), nowB = vB * (1 - outB), nowM = vA * outA + vB * outB;
    function pourTo(k, instant) {
      if (k - st.poured > 4) instant = true;   // a jump (Show all, a dev hook): place them through the liquid, not in a pile at the top
      while (st.poured < k) {
        const i = order[st.poured++], src = i < A.length ? st.a : st.b;
        const p = src.parts.find(q => q.slot === i);
        if (p) src.parts.splice(src.parts.indexOf(p), 1);
        const mb = geo(2).liq(instant ? vT : Math.max(nowMix(), 4));
        const q = addPart(st.m, all[i], { w: mb.w, h: mb.h }, S, instant ? null : { x: 10 + Math.random() * (mb.w - 20), y: 6, vy: 60 });
        q.born = instant ? 1 : 0.3;
      }
    }
    function nowMix() { return vT * st.poured / n; }
    [[spec.acid.title, st.a, nowA, vA, null], [spec.base.title, st.b, nowB, vB, null], [spec.mixTitle, st.m, nowM, vT, react ? 'neutralize' : null]].forEach(([title, b, v, vFull, rx], k) => {
      const G = geo(k);
      text(g, title, (G.x0 + G.x1) / 2, 18, P.ink, 15, 700);
      // the liquid with its particles (water drawn faint, ions full)
      if (v > 0.05) {
        const L = G.liq(v);
        g.save(); g.beginPath(); g.rect(L.x, L.y, L.w, L.h); g.clip();
        g.fillStyle = P.water; g.fillRect(L.x, L.y, L.w, L.h);
        const dt = clamp(t - b.lastT, 0, 0.05); b.lastT = t; b.react = rx;
        stepBeaker(b, { w: L.w, h: L.h }, dt); drawBeaker(g, b, L, P);
        g.restore();
        g.save(); g.strokeStyle = P.dark ? 'rgba(160,200,255,0.55)' : 'rgba(90,140,200,0.55)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(L.x, L.y); g.lineTo(L.x + L.w, L.y); g.stroke(); g.restore();
      } else { b.lastT = t; }
      // the glass: a beaker with a lip and spout, graduations to one scale, a shine
      g.save();
      const edge = P.dark ? '#a9bddf' : '#56657c';
      g.strokeStyle = edge; g.lineWidth = 2;
      g.beginPath(); g.moveTo(G.x0 - 7, top + 1); g.quadraticCurveTo(G.x0, top + 2, G.x0, top + 9); g.lineTo(G.x0, bot - 6);
      g.quadraticCurveTo(G.x0, bot, G.x0 + 6, bot); g.lineTo(G.x1 - 6, bot); g.quadraticCurveTo(G.x1, bot, G.x1, bot - 6); g.lineTo(G.x1, top + 4); g.lineTo(G.x1 + 3, top); g.stroke();
      g.fillStyle = P.dark ? 'rgba(150,185,235,0.07)' : 'rgba(170,198,228,0.12)'; g.fillRect(G.x0, top + 6, G.x1 - G.x0, bot - top - 6);
      g.strokeStyle = P.dark ? '#8f9ab8' : '#8d99a8'; g.lineWidth = 1.2; g.fillStyle = g.strokeStyle; g.font = '700 9px ' + FONT; g.textAlign = 'right';
      for (let mL = 10; mL < cap; mL += 10) { const y = G.yOfV(mL); g.beginPath(); g.moveTo(G.x1 - 12, y); g.lineTo(G.x1 - 3, y); g.stroke(); g.fillText(String(mL), G.x1 - 15, y + 3); }
      g.strokeStyle = P.dark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(G.x0 + 6, top + 14); g.lineTo(G.x0 + 6, bot - 10); g.stroke();
      g.restore();
      // the volume in it, under it: the mixture counts up to the total as it fills
      text(g, v.toFixed(1) + ' mL', (G.x0 + G.x1) / 2, H - 10, k === 2 && v < 0.05 ? P.dim : P.ink, 15, 700);
      if (k < 2) text(g, k ? '→' : '+', MIX_PAD + (k + 1) * (w + MIX_GAP) - MIX_GAP / 2, (top + bot) / 2, P.ink, 20, 700, 'center', 'middle');
    });
    text(g, 'scaled', W - 12, 12, P.dim, 10, 500, 'right');
  }
  // the three columns as fractions of the picture's width, for laying the working out under each beaker
  const MIX_COLS = W => { const w = (W - 2 * MIX_PAD - 2 * MIX_GAP) / 3; return { pad: MIX_PAD / W, col: w / W, gap: MIX_GAP / W }; };

  // ---------- mono-, di- and triprotic acids side by side ----------
  // pos: how many protons each acid has released so far (0 to 3, eased; an acid stops when it runs out of H).
  // Each H sits on the anion part with a red ring (the H that leaves), then rises into the row of released H⁺.
  const POLY = [
    { name: 'monoprotic', core: 'Cl', hs: [-90], stages: ['HCl', 'Cl⁻'] },
    { name: 'diprotic', core: 'SO₄', hs: [-135, -45], stages: ['H₂SO₄', 'HSO₄⁻', 'SO₄²⁻'] },
    { name: 'triprotic', core: 'PO₄', hs: [-150, -90, -30], stages: ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻'] }
  ];
  function polyprotic(g, W, H, pos) {
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const rowY = 74, coreY = H * 0.58, R = 36, hr = 13;
    const anionText = P.dark ? shade(C.anion, 0.3) : '#a07b0c';
    POLY.forEach((a, col) => {
      const cx = W * (col * 2 + 1) / 6, n = a.hs.length;
      text(g, a.name, cx, 30, P.ink, 19, 700);
      if (col) { g.save(); g.strokeStyle = P.dark ? '#26304d' : '#e3e7ee'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W * col / 3, 14); g.lineTo(W * col / 3, H - 14); g.stroke(); g.restore(); }
      // the anion part: grey while whole, yellow once it carries a negative charge
      const k0 = ease(clamp(pos, 0, 1));
      const coreCol = mix(P.molFill, C.anion, k0);
      if (P.dark) { g.save(); g.shadowColor = coreCol; g.shadowBlur = 10 * k0; ball(g, cx, coreY, R, coreCol, false); g.restore(); }
      else { ball(g, cx, coreY, R, coreCol, false); ring(g, cx, coreY, R, P.ink, 1.7); }
      text(g, a.core, cx, coreY + 1, C.ink, 19, 700, 'center', 'middle');
      a.hs.forEach((deg, i) => {
        const p = ease(clamp(pos - i, 0, 1));
        const ax = cx + Math.cos(deg * Math.PI / 180) * (R + hr - 3), ay = coreY + Math.sin(deg * Math.PI / 180) * (R + hr - 3);
        const rx = cx + (i - (n - 1) / 2) * 42, ry = rowY;
        const x = ax + (rx - ax) * p, y = ay + (ry - ay) * p - Math.sin(Math.PI * p) * 8;
        if (p < 0.99) {
          g.save(); g.globalAlpha = 1 - p;
          if (P.dark) { g.fillStyle = P.h; circ(g, x, y, hr); } else { ball(g, x, y, hr, '#ffffff', false); }
          text(g, 'H', x, y + 0.5, C.ink, 13, 700, 'center', 'middle');
          ring(g, x, y, hr + 2.5, C.acid, 2.6);
          g.restore();
        }
        if (p > 0.01) ion(g, 'H', x, y, 24, p, P);
      });
      // the formula under it, swapping as each proton leaves
      const st = clamp(pos, 0, n), i0 = Math.floor(st), i1 = Math.min(n, i0 + 1), fr = ease(st - i0);
      const lab = (i, al) => { if (al > 0.01) { g.save(); g.globalAlpha = al; text(g, a.stages[i], cx, coreY + R + 34, i ? anionText : P.ink, 21, 700); g.restore(); } };
      lab(i0, 1 - (i1 > i0 ? fr : 0)); if (i1 > i0) lab(i1, fr);
      text(g, 'up to ' + n + ' H⁺', cx, H - 16, P.dim, 15, 700);
    });
  }

  // ---------- Arrhenius: an acid or a base comes apart in water (Lewis / ball and stick / space-filling), drawn large ----------
  // kind 'acid': HCl(g) → H⁺ + Cl⁻. A molecule: the H–Cl pair stays on Cl, so the charges appear as the bond breaks.
  // kind 'base': NaOH(s) → Na⁺ + OH⁻. Ionic: the ions carry their charges from the start and only move apart.
  // f: 0 together, 1 apart. Colours follow transfer(): Lewis in ink with the H⁺ as a red disc, ball and stick in role
  // colours, space-filling in classic atom colours with the red / yellow charge haze.
  const DIS_S = { lewis:1.8, ball:2.1, fill:1.9 };
  const DIS_R_FILL = Object.assign({ Na:27 }, R_FILL), DIS_R_BALL = Object.assign({ Na:19 }, R_BALL);
  function dissolve(g, W, H, kind, f, model, t) {
    const P = pal(), S = DIS_S[model], dark = P.dark, ink = P.ink, k = ease(clamp(f, 0, 1));
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const box = { x: 16, y: 14, w: W - 32, h: H - 66 };
    solutionWindow(g, box, [], t, { key: 'dissolve-' + kind, water: 34, size: 16 });
    const cx = W / 2, cy = box.y + box.h * 0.52;
    const roleOf = r => r === 'acid' ? C.acid : r === 'base' ? C.base : r === 'anion' ? C.anion : C.cation;
    const roleText = r => dark ? shade(roleOf(r), 0.3) : r === 'anion' ? '#a07b0c' : r === 'cation' ? '#c23a5a' : roleOf(r);
    const rOf = sym => (model === 'fill' ? DIS_R_FILL : DIS_R_BALL)[sym] * S;
    const bl = BOND[model] * S;
    const glow = () => { if (dark) { g.shadowColor = '#9fc0ff'; g.shadowBlur = 6; } };

    function bond(a, b, alpha) {
      if (alpha <= 0.01 || model === 'fill') return;
      g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
      if (model === 'ball') { g.strokeStyle = dark ? '#8a96ab' : '#9aa6b8'; g.lineWidth = 6 * S; }
      else { g.strokeStyle = ink; g.lineWidth = 2.4 * S; glow(); }
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      const k1 = model === 'lewis' ? 15 * S / L : 0, k2 = model === 'lewis' ? (L - 13 * S) / L : 1;
      g.beginPath(); g.moveTo(a.x + dx * k1, a.y + dy * k1); g.lineTo(a.x + dx * k2, a.y + dy * k2); g.stroke(); g.restore();
    }
    function pair(p, sym, deg, alpha) {
      if (alpha <= 0.01 || model === 'fill') return;
      const a = deg * Math.PI / 180, d = model === 'ball' ? rOf(sym) + 9 * S : 22 * S;
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d, ox = -Math.sin(a) * 4.4 * S, oy = Math.cos(a) * 4.4 * S;
      g.save(); g.globalAlpha = alpha; g.fillStyle = ink; glow();
      circ(g, x + ox, y + oy, 3 * S); circ(g, x - ox, y - oy, 3 * S); g.restore();
    }
    // col: sphere colour (ball / fill); proton: the H that leaves as H⁺ (red disc in Lewis, red ring otherwise)
    function atom(sym, p, col, proton) {
      if (model === 'lewis') {
        g.save();
        if (proton) { g.fillStyle = C.acid; if (dark) { g.shadowColor = C.acid; g.shadowBlur = 18; } circ(g, p.x, p.y, 15 * S); g.shadowBlur = 0; text(g, 'H', p.x, p.y + 1, '#ffffff', 20 * S, 700, 'center', 'middle'); }
        else { glow(); text(g, sym, p.x, p.y + 1, ink, (sym === 'H' ? 22 : 26) * S, 700, 'center', 'middle'); }
        g.restore(); return;
      }
      const r = rOf(sym);
      if (dark && sym !== 'H' && model === 'fill') { g.save(); g.shadowColor = '#6fa8e8'; g.shadowBlur = 10; ball(g, p.x, p.y, r, col, true); g.restore(); }
      else ball(g, p.x, p.y, r, col, true);
      const pale = sym === 'H' || (model === 'ball' && col !== C.base);   // grey, yellow and rose spheres take ink letters
      text(g, sym, p.x, p.y + 1, pale ? C.ink : '#ffffff', (sym === 'H' ? (model === 'fill' ? 12 : 11) : (model === 'fill' ? 16 : 13)) * S, 700, 'center', 'middle');
      if (proton) ring(g, p.x, p.y, r + 3 * S, C.acid, 2.6 * S);
    }
    // a charge sign beside an atom; side -1 puts it up-left instead of up-right
    const sign = (s, p, sym, role, alpha, side) => {
      if (alpha <= 0.01) return;
      const off = (model === 'lewis' ? 26 * S : rOf(sym) + 6 * S) * 0.78;
      const col = model === 'fill' ? (s === '+' ? DPOS : (dark ? DNEG : '#a07b0c')) : roleText(role);
      g.save(); g.globalAlpha = alpha; text(g, s, p.x + (side || 1) * (off + 6 * S), p.y - off, col, 24 * S, 700, 'center', 'middle'); g.restore();
    };
    const label = (s, x, y, col, alpha) => { if (alpha > 0.01) { g.save(); g.globalAlpha = alpha; text(g, s, x, y, col, 13 * S, 700, 'center', 'top'); g.restore(); } };
    const below = sym => model === 'lewis' ? 36 * S : model === 'ball' ? rOf(sym) + 18 * S : rOf(sym) + 12 * S;   // under the lone pairs
    const lerp = (a, b) => a + (b - a) * k;

    let eq;
    if (kind === 'acid') {
      const cl = { x: lerp(cx + bl * 0.5, cx + 190), y: cy };
      const h = { x: lerp(cx - bl * 0.5, cx - 210), y: cy - Math.sin(Math.PI * k) * 24 };
      const clCol = model === 'fill' ? ATOM.Cl : mix(P.molFill, C.anion, k);
      if (model === 'fill') { const a = dark ? 0.55 : 0.45; haze(g, cl.x, cl.y, rOf('Cl') + 10 * S, DNEG, a * k); haze(g, h.x, h.y, rOf('H') + 8 * S, DPOS, a * k); }
      bond(cl, h, 1 - k);
      [-90, 90, 0].forEach(d => pair(cl, 'Cl', d, 1));
      pair(cl, 'Cl', 180, k);                                         // the bonding pair, now on Cl
      atom('Cl', cl, clCol);
      atom('H', h, ATOM.H, true);
      const ch = clamp(k * 1.4 - 0.2, 0, 1);
      sign('−', cl, 'Cl', 'anion', ch);
      label('HCl', (cl.x + h.x) / 2, cy + below('Cl'), ink, 1 - ch);
      label('H⁺', h.x, h.y + below('H'), roleText('acid'), ch);
      label('Cl⁻', cl.x, cl.y + below('Cl'), roleText('anion'), ch);
      eq = [['HCl(g)', 0], ['  →  ', -1], ['H⁺(aq)', 1, 'acid'], ['  +  ', 1], ['Cl⁻(aq)', 1, 'anion']];
    } else {
      const sep0 = model === 'fill' ? rOf('Na') + rOf('O') - 4 * S : model === 'ball' ? rOf('Na') + rOf('O') + 16 * S : 62 * S;
      const na = { x: lerp(cx - sep0 * 0.55, cx - 200), y: cy };
      const o = { x: lerp(cx + sep0 * 0.45, cx + 170), y: cy };
      const hAng = -40, h = at(o, hAng, bl);
      if (model === 'fill') { const a = dark ? 0.55 : 0.45; haze(g, na.x, na.y, rOf('Na') + 8 * S, DPOS, a); haze(g, o.x + 6 * S, o.y - 4 * S, rOf('O') + 12 * S, DNEG, a); }
      bond(o, h, 1);
      [60, 150, -130].forEach(d => pair(o, 'O', d, 1));
      atom('H', h, ATOM.H);
      atom('Na', na, model === 'fill' ? ATOM.Na : C.cation);
      atom('O', o, model === 'fill' ? ATOM.O : C.base);
      sign('+', na, 'Na', 'cation', 1, -1);
      // OH⁻'s charge sits straight above the O, between its upper lone pair and its H (clear of Na⁺ when they touch)
      const up = model === 'lewis' ? 36 * S : rOf('O') + 14 * S;
      text(g, '−', o.x + 2 * S, o.y - up, model === 'fill' ? (dark ? DNEG : '#a07b0c') : roleText('base'), 24 * S, 700, 'center', 'middle');
      label('Na⁺', na.x, na.y + below('Na'), roleText('cation'), 1);
      label('OH⁻', o.x, o.y + below('O'), roleText('base'), 1);
      eq = [['NaOH(s)', 0], ['  →  ', -1], ['Na⁺(aq)', 1, 'cation'], ['  +  ', 1], ['OH⁻(aq)', 1, 'base']];
    }
    // the equation under the window: products take their role colours once the pieces are apart
    g.font = '700 21px ' + FONT;
    let wsum = 0; const ws = eq.map(e => { const w = g.measureText(e[0]).width; wsum += w; return w; });
    let x = W / 2 - wsum / 2;
    eq.forEach((e, i) => {
      const col = e[1] === -1 ? P.dim : (e[1] === 1 && k > 0.5 && e[2]) ? roleText(e[2]) : ink;
      g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(e[0], x, H - 20); x += ws[i];
    });
  }

  // ---------- ions that move between states (neutralization) ----------
  // tokens: [{ kind, at: [[x, y, alpha], ...one per state] }]; pos: a float state index (eased between states)
  function ion(g, kind, x, y, s, alpha, P) {
    if (alpha <= 0.01) return;
    g.save(); g.globalAlpha = alpha;
    const flat = (col, r, lab, txt) => {
      if (P.dark) { g.shadowColor = col; g.shadowBlur = 14; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, shade(col, 0.5)); gr.addColorStop(0.7, col); gr.addColorStop(1, shade(col, -0.25)); g.fillStyle = gr; circ(g, x, y, r); g.shadowBlur = 0; }
      else { ball(g, x, y, r, col, false); ring(g, x, y, r, P.ink, 1.8); }
      text(g, lab, x, y + 0.5, txt, Math.round(r * 0.62), 700, 'center', 'middle');
    };
    if (kind === 'H') flat(C.acid, s * 0.7, 'H⁺', '#ffffff');
    else if (kind === 'NO3') flat(C.anion, s * 1.15, 'NO₃⁻', C.ink);
    else if (kind === 'Sr') flat(C.cation, s * 1.2, 'Sr²⁺', C.ink);
    else if (kind === 'OH') particle(g, 'OH', x, y, s, -0.6, 1, P);
    else if (kind === 'H2O') { // a water made here: full strength, not the faint background water
      const hr = s * 0.56;
      [38, 142].forEach(a => { const t = a * Math.PI / 180, hx = x + Math.cos(t) * s * 0.95, hy = y + Math.sin(t) * s * 0.95;
        if (P.dark) { g.fillStyle = P.h; circ(g, hx, hy, hr); } else { ball(g, hx, hy, hr, '#ffffff', false); ring(g, hx, hy, hr, P.ink, 1.3); } });
      if (P.dark) { g.fillStyle = '#9aa6c8'; circ(g, x, y, s); } else { ball(g, x, y, s, '#c9ced8', false); ring(g, x, y, s, P.ink, 1.7); }
      text(g, 'H₂O', x, y + s * 1.55, P.ink, Math.round(s * 0.62), 700, 'center', 'top');
    }
    g.restore();
  }
  function tokens(g, W, H, list, pos, opts) {
    opts = opts || {};
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const i0 = Math.floor(pos), i1 = Math.min(i0 + 1, list[0].at.length - 1), k = ease(pos - i0);
    if (opts.arrowX) {
      text(g, '→', opts.arrowX, H / 2 + 12, P.ink, 40, 700);
      const qa = clamp(1 - (pos - (opts.questionUntil || 0)), 0, 1);
      if (qa > 0.01) { g.save(); g.globalAlpha = qa; text(g, '?', opts.arrowX + 150, H / 2 + 14, P.dim, 46, 700); g.restore(); }
    }
    list.forEach(tk => {
      const a = tk.at[i0], b = tk.at[i1];
      ion(g, tk.kind, a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, opts.size || 26, a[2] + (b[2] - a[2]) * k, P);
    });
  }

  // ---------- concentration bars on a powers-of-ten scale ----------
  // bars: [{ v, col, label }], scale 10⁰ (top) to 10⁻¹⁴ (bottom)
  function logBars(g, box, bars) {
    const P = pal(), { x, y, w, h } = box, bw = Math.min(30, w / (bars.length * 2));
    const top = y, bot = y + h;
    [0, -7, -14].forEach(e => {
      const yy = bot - ((14 + e) / 14) * (bot - top);
      text(g, '10' + sup(e), x - 6, yy + 4, P.dim, 11, 500, 'right');
    });
    bars.forEach((b, i) => {
      const xx = x + 8 + i * (bw + 14), frac = clamp((14 + Math.log10(Math.max(b.v, 1e-14))) / 14, 0, 1), yv = bot - frac * (bot - top);
      g.save(); rrect(g, xx, top, bw, h, 7); g.fillStyle = P.track; g.fill(); g.clip();
      const gr = g.createLinearGradient(0, yv, 0, bot); gr.addColorStop(0, shade(b.col, 0.3)); gr.addColorStop(1, b.col);
      g.fillStyle = gr; if (P.dark) { g.shadowColor = b.col; g.shadowBlur = 14; }
      g.fillRect(xx, yv, bw, bot - yv); g.restore();
      text(g, b.label, xx + bw / 2, bot + 18, P.ink, 13, 700);
    });
  }
  const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' };
  const sup = s => String(s).split('').map(ch => SUP[ch] || ch).join('');

  global.AbDraw = { C, ATOM, DPOS, DNEG, FONT, pal, isDark, clamp, ease, tri, rnd, hexA, shade, mix, circ, ring, rrect, text, ball, haze,
    SPECIES, particle, solutionWindow, transfer, protonStory, polyprotic, dissolve, kwBalance, phStrip, mixScene, MIX_COLS, sciStr, tokens, logBars, sup };
})(window);
