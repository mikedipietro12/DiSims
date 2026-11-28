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
  const ATOM = { O:'#e5533d', H:'#f4f6f8', Cl:'#3fbf5f', F:'#a6db6e', N:'#3f6fe0', Na:'#a98bd6' };
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
    H2O: { label:'H₂O',  role:'water',  charge:'',  heavy:'O',  hs:[38, 142] }
  };
  const HEAVY_R = { O:1.0, Cl:1.28, F:0.98, N:1.05, Na:1.1 };
  function roleColour(role, P) {
    return role === 'acid' ? C.acid : role === 'base' ? C.base : role === 'anion' ? C.anion : role === 'cation' ? C.cation
      : role === 'mol' ? P.molFill : P.waterMol;
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
      if (!sp.hs.length || sp.role === 'mol') { // Cl⁻, F⁻, Na⁺, HF: formula inside the big atom
        text(g, sp.label, x, y + 0.5, (P.dark && sp.role === 'mol') ? '#ffffff' : C.ink, Math.round(s * 0.6), 700, 'center', 'middle');
      } else { // H₃O⁺, OH⁻: charge on the oxygen, formula underneath
        text(g, sp.charge, x, y + 0.5, onDark ? '#ffffff' : C.ink, Math.round(s * 0.9), 700, 'center', 'middle');
        text(g, sp.label, x, y + s * 1.55, P.dark ? shade(col, 0.45) : P.ink, Math.round(s * 0.62), 700, 'center', 'top');
      }
    }
    g.restore();
  }

  // a window of solution: list = species keys; water drifts behind. Positions are stateless, so time can jump.
  function solutionWindow(g, box, list, t, opts) {
    opts = opts || {};
    const P = pal(), { x, y, w, h } = box, seed = opts.seed || 0, s = opts.size || 13;
    g.save(); rrect(g, x, y, w, h, 12);
    g.fillStyle = P.water; g.fill();
    if (P.dark) { g.strokeStyle = hexA('#6fa8e8', 0.55); g.lineWidth = 1.5; g.shadowColor = '#6fa8e8'; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0; }
    else { g.strokeStyle = P.waterEdge; g.lineWidth = 2; g.stroke(); }
    g.clip();
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
      .forEach(p => particle(g, p.key, p.x, p.y, s * (0.82 + p.z * 0.3), t * 0.5 + p.i * 1.7, 0.6 + p.z * 0.4, P));
    g.restore();
  }

  // ---------- proton transfer (Lewis / ball and stick / space-filling) ----------
  // spec: {
  //   L: acceptor (or null: the proton just leaves) { sym, hs:[deg], lps:[deg], acc:deg, become:'acid'|'cation', charge:'+' }
  //   R: donor (or null: a bare proton arrives)     { sym, hs:[deg], lps:[deg], don:deg, become:'base'|'anion', charge:'−' }
  //   eq: [[html-free text, side, role]], caps: ['before', 'after'] }
  // f: 0 = reactants, 1 = products (the controller eases it).
  const BOND = { lewis:44, ball:50, fill:30 };
  const R_FILL = { N:25, O:24, F:23, Cl:28, H:15 }, R_BALL = { N:17, O:17, F:16, Cl:19, H:11 };
  function transfer(g, W, H, spec, f, model, t, opts) {
    opts = opts || {};
    const P = pal();
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    const bl = BOND[model], cy = H * 0.47;
    const Lp = { x: W * (spec.R ? 0.3 : 0.4), y: cy }, Rp = { x: W * (spec.L ? 0.7 : 0.6), y: cy };
    const at = (p, deg, d) => ({ x: p.x + Math.cos(deg * Math.PI / 180) * d, y: p.y + Math.sin(deg * Math.PI / 180) * d });
    const hStart = spec.R ? at(Rp, spec.R.don, bl) : { x: W * 0.8, y: cy - 40 };
    const hEnd = spec.L ? at(Lp, spec.L.acc, bl) : { x: W * 0.22, y: cy - 30 };
    const hp = { x: hStart.x + (hEnd.x - hStart.x) * f, y: hStart.y + (hEnd.y - hStart.y) * f - Math.sin(Math.PI * f) * 18 };
    const darkStage = P.dark;
    const inkCol = P.ink;
    const roleOf = r => r === 'acid' ? C.acid : r === 'base' ? C.base : r === 'anion' ? C.anion : C.cation;
    // text in a role colour: yellow and rose are too pale for text on white, so they darken in light mode
    const roleText = r => darkStage ? shade(roleOf(r), 0.3) : r === 'anion' ? '#a07b0c' : r === 'cation' ? '#c23a5a' : roleOf(r);
    const heavyCol = (m, which) => model === 'fill' || model === 'lewis' ? ATOM[m.sym] : mix(P.molFill, roleOf(m.become), f);
    const letterCol = (sym, m) => sym === 'H' ? C.ink : (model === 'ball' && f < 0.5 ? C.ink : '#ffffff');

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
    function atom(sym, p, col, isProton, m) {
      if (model === 'lewis') {
        g.save();
        if (isProton) { g.fillStyle = C.acid; if (darkStage) { g.shadowColor = C.acid; g.shadowBlur = 18; } circ(g, p.x, p.y, 15); g.shadowBlur = 0; letter('H', p, 20, '#ffffff'); }
        else letter(sym, p, sym === 'H' ? 22 : 26, inkCol);
        g.restore(); return;
      }
      const r = (model === 'fill' ? R_FILL : R_BALL)[sym];
      if (darkStage && sym !== 'H' && model === 'fill') { g.save(); g.shadowColor = '#6fa8e8'; g.shadowBlur = 10; ball(g, p.x, p.y, r, col, true); g.restore(); }
      else ball(g, p.x, p.y, r, col, true);
      letter(sym, p, sym === 'H' ? (model === 'fill' ? 12 : 11) : (model === 'fill' ? 16 : 13), letterCol(sym, m));
      if (isProton) ring(g, p.x, p.y, r + 3, C.acid, 3);
    }

    const Lhs = spec.L ? spec.L.hs.map(a => at(Lp, a, bl)) : [];
    const Rhs = spec.R ? spec.R.hs.map(a => at(Rp, a, bl)) : [];
    // space-filling: the charge haze first, behind the spheres
    if (model === 'fill') {
      const a = (darkStage ? 0.55 : 0.45) * f;
      if (spec.L && spec.L.charge) haze(g, Lp.x + 4, Lp.y, R_FILL[spec.L.sym] + 24, spec.L.charge === '+' ? DPOS : DNEG, a);
      if (spec.R && spec.R.charge) haze(g, Rp.x + 4, Rp.y + 4, R_FILL[spec.R.sym] + 20, spec.R.charge === '+' ? DPOS : DNEG, a);
      if (!spec.R) haze(g, hp.x, hp.y, R_FILL.H + 6, DPOS, 0.45 * (1 - f));          // the bare proton, before it lands
      if (!spec.L) haze(g, hp.x, hp.y, R_FILL.H + 6, DPOS, 0.45 * f);                // the proton, once it has left
      [...Lhs, ...Rhs].forEach(p => atom('H', p, ATOM.H));
      if (spec.L) atom(spec.L.sym, Lp, heavyCol(spec.L));
      if (spec.R) atom(spec.R.sym, Rp, heavyCol(spec.R));
      atom('H', hp, ATOM.H, true); // last, so its red ring reads over the atom it is bonded to
    } else {
      if (spec.L) {
        Lhs.forEach(p => bond(Lp, p, 1));
        spec.L.lps.forEach(a => pair(Lp, a, 1));
        pair(Lp, spec.L.acc, 1 - f);
        bond(Lp, hEnd, f);
      }
      if (spec.R) {
        Rhs.forEach(p => bond(Rp, p, 1));
        spec.R.lps.forEach(a => pair(Rp, a, 1));
        pair(Rp, spec.R.don, f);
        bond(Rp, hStart, 1 - f);
      }
      Lhs.forEach(p => atom('H', p, ATOM.H)); Rhs.forEach(p => atom('H', p, ATOM.H));
      if (spec.L) atom(spec.L.sym, Lp, heavyCol(spec.L));
      if (spec.R) atom(spec.R.sym, Rp, heavyCol(spec.R));
      atom('H', hp, ATOM.H, true);
    }
    // charges, fading in with the products
    const ch = clamp(f * 1.4 - 0.2, 0, 1);
    g.save(); g.globalAlpha = ch;
    const signCol = m => model === 'fill' ? (m.charge === '+' ? DPOS : (darkStage ? DNEG : '#a07b0c')) : roleText(m.become);
    if (spec.L && spec.L.charge) text(g, spec.L.charge, Lp.x + 38, Lp.y - 38, signCol(spec.L), 26, 700);
    if (spec.R && spec.R.charge) text(g, spec.R.charge, Rp.x + 40, Rp.y - 36, signCol(spec.R), 28, 700);
    if (!spec.L) text(g, 'H⁺', hp.x, hp.y - 26, darkStage ? shade(C.acid, 0.35) : C.acid, 17, 700);
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

  // ---------- ionic base coming apart in water (NaOH → Na⁺ + OH⁻) ----------
  function dissociate(g, W, H, f, t) {
    const P = pal(); g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    solutionWindow(g, { x: 20, y: 46, w: W - 40, h: H - 100 }, [], t, { water: 30, seed: 4 });
    const cy = H * 0.5, gap = 22 + f * 150;
    particle(g, 'Na', W / 2 - gap / 2 - 10, cy, 26, 0, 1, P);
    particle(g, 'OH', W / 2 + gap / 2 + 14, cy, 26, Math.PI * 0.15, 1, P);
    const eq = 'NaOH(s)  →  Na⁺(aq)  +  OH⁻(aq)';
    text(g, eq, W / 2, H - 20, P.ink, 19, 700);
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
    SPECIES, particle, solutionWindow, transfer, dissociate, tokens, logBars, sup };
})(window);
