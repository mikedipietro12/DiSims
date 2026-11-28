/* Solubility & Ksp: canvas drawing kit (SolDraw), shared by the Guide stage, the Sandbox and
   the Qual Lab. Glass that looks like glass, solids that show their ionic network, and ions
   as shaded spheres that move in depth. Colours come from sol.css tokens.

   Colour rule (user, 2026-11-17): an ion in a solid takes the crystal's real colour (yellow
   PbI₂, white AgCl, red-brown Ag₂CrO₄); once dissolved it takes the standard colours, cations
   rose (+) and anions amber (−). It cross-fades as it leaves or joins the crystal (opts.solid
   0 … 1). In the solid, cations are drawn smaller than anions so the lattice still reads. */
(function (global) {
  'use strict';
  const INK = '#1d2433';
  let css = null;
  function tok(name, fallback) {
    if (!css && typeof getComputedStyle !== 'undefined') css = getComputedStyle(document.documentElement);
    const v = css ? css.getPropertyValue(name).trim() : '';
    return v || fallback;
  }
  const C = () => ({
    cat: tok('--sol-cat', '#f06a84'), catLine: tok('--sol-cat-line', '#b3263f'),
    an: tok('--sol-an', '#ffd257'), anLine: tok('--sol-an-line', '#b38a10'),
    water: tok('--sol-water', '#e3f1fb'), waterLine: tok('--sol-water-line', '#7fb3d9'),
    acid: tok('--sol-acid', '#d62828'), acidLine: tok('--sol-acid-line', '#8f1515'),
    base: tok('--sol-base', '#5b5fd6'), baseLine: tok('--sol-base-line', '#3438a3'),
    neutral: tok('--sol-neutral', '#e4ebf3'), neutralLine: tok('--sol-neutral-line', '#7f8ea6')
  });

  function rgbOf(c) {
    if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    const m = c.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  }
  function mix(a, b, t) { // blend colour a → b by t (0 … 1), returns #rrggbb
    const A = rgbOf(a), B = rgbOf(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function light(c) { const [r, g, b] = rgbOf(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6; }
  function shade(hex, f) { // f > 0 lightens, f < 0 darkens
    let [r, g, b] = rgbOf(hex);
    const t = f > 0 ? 255 : 0, a = Math.abs(f);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return `rgb(${r},${g},${b})`;
  }

  // ---------- Ion sphere ----------
  // ion: { sym: 'Pb', q: '2+', z: +2 }
  // opts: alpha, label, charge, solidColour + solid (0 dissolved … 1 in the crystal)
  function ion(g, x, y, r, ionInfo, opts) {
    opts = opts || {};
    const c = C();
    const pos = ionInfo.z > 0;
    const t = opts.solidColour ? Math.max(0, Math.min(1, opts.solid == null ? 1 : opts.solid)) : 0;
    // acids (H⁺, H₃O⁺) and bases (OH⁻) never use the plain cation / anion colours
    let base = ionInfo.role === 'acid' ? c.acid : ionInfo.role === 'base' ? c.base : pos ? c.cat : c.an;
    let line = ionInfo.role === 'acid' ? c.acidLine : ionInfo.role === 'base' ? c.baseLine : pos ? c.catLine : c.anLine;
    if (t > 0) {
      base = mix(base, opts.solidColour, t);
      line = mix(line, shade(opts.solidColour, light(opts.solidColour) ? -0.45 : -0.3), t);
      r *= 1 - (pos ? 0.16 : 0) * t; // cations sit smaller in the lattice
    }
    const a = opts.alpha == null ? 1 : opts.alpha;
    g.save();
    g.globalAlpha = a;
    const grad = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
    grad.addColorStop(0, shade(base, 0.55));
    grad.addColorStop(0.55, base);
    grad.addColorStop(1, shade(base, -0.18));
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = grad; g.fill();
    g.lineWidth = Math.max(1, r * 0.1); g.strokeStyle = line; g.stroke();
    if (opts.label !== false && r >= 7) {
      const sym = ionInfo.sym;
      g.fillStyle = light(base) ? INK : '#ffffff';
      g.font = `700 ${Math.round(r * (sym.length > 2 ? 0.62 : 0.82))}px "Space Grotesk", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(sym, x, y + r * 0.06);
      if (opts.charge !== false && r >= 10 && t < 0.5) {
        g.font = `700 ${Math.round(Math.max(10, r * 0.62))}px "Space Mono", monospace`;
        g.lineWidth = 3; g.strokeStyle = '#ffffff';
        const qx = x + r * 0.78, qy = y - r * 0.72;
        g.strokeText(ionInfo.q, qx, qy); g.fillStyle = INK; g.fillText(ionInfo.q, qx, qy);
      }
    }
    g.restore();
  }

  // A neutral molecule (no charge), e.g. the H₂O made when acid meets hydroxide
  // (charge: optional, e.g. '−' for HCO₃⁻, which is drawn in the product colour but keeps its sign)
  function neutral(g, x, y, r, label, alpha, charge) {
    const c = C();
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
    const grad = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.6, c.neutral); grad.addColorStop(1, shade(c.neutral, -0.15));
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = grad; g.fill();
    g.lineWidth = Math.max(1, r * 0.1); g.strokeStyle = c.neutralLine; g.stroke();
    g.fillStyle = INK; g.font = `700 ${Math.round(r * (label.length > 3 ? 0.55 : 0.7))}px "Space Grotesk", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x, y + r * 0.05);
    if (charge) {
      g.font = `700 ${Math.round(Math.max(10, r * 0.62))}px "Space Mono", monospace`;
      g.lineWidth = 3; g.strokeStyle = '#ffffff';
      g.strokeText(charge, x + r * 0.78, y - r * 0.72); g.fillText(charge, x + r * 0.78, y - r * 0.72);
    }
    g.restore();
  }

  // Repeating unit of a lattice row for a salt with cat:an = m:n (e.g. PbI₂ → C A A)
  function latticeUnit(m, n) {
    const out = [];
    const total = m + n;
    let ci = 0, ai = 0;
    for (let k = 0; k < total; k++) {
      // spread cations evenly through the unit
      if (ci < m && (ai >= n || (ci + 0.5) / m <= (ai + 0.5) / n)) { out.push('c'); ci++; } else { out.push('a'); ai++; }
    }
    return out;
  }

  // ---------- Beaker (cylinder seen slightly from above) ----------
  // box: area to draw in. opts: { level 0..1, tilt, spout, grads: [{f, label}], liquid }
  function beakerGeom(box, opts) {
    const tilt = (opts && opts.tilt) || 0.2;
    const rx = box.w / 2, ry = rx * tilt;
    const cx = box.x + rx, topY = box.y + ry, botY = box.y + box.h - ry;
    const level = Math.max(0, Math.min(1, opts && opts.level != null ? opts.level : 0.8));
    const surfY = botY - level * (botY - topY) * 0.92;
    return { cx, rx, ry, topY, botY, surfY, tilt, box };
  }
  function silhouette(g, G) {
    g.beginPath();
    g.ellipse(G.cx, G.topY, G.rx, G.ry, 0, Math.PI, Math.PI * 2);
    g.lineTo(G.cx + G.rx, G.botY);
    g.ellipse(G.cx, G.botY, G.rx, G.ry, 0, 0, Math.PI);
    g.closePath();
  }
  // Everything behind the contents: shadow, glass body, floor, back rim, liquid
  function beakerBack(g, G, opts) {
    opts = opts || {};
    const c = C();
    // shadow on the bench (opts.shadow false: a beaker lifted off the bench, e.g. tipped to pour)
    if (opts.shadow !== false) {
      const sh = g.createRadialGradient(G.cx, G.botY + G.ry * 0.4, 0, G.cx, G.botY + G.ry * 0.4, G.rx * 1.25);
      sh.addColorStop(0, 'rgba(29,36,51,0.20)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
      g.fillStyle = sh; g.beginPath(); g.ellipse(G.cx, G.botY + G.ry * 0.45, G.rx * 1.25, G.ry * 1.35, 0, 0, Math.PI * 2); g.fill();
    }
    // glass body
    silhouette(g, G);
    const body = g.createLinearGradient(G.cx - G.rx, 0, G.cx + G.rx, 0);
    body.addColorStop(0, 'rgba(214,224,238,0.55)'); body.addColorStop(0.5, 'rgba(246,249,253,0.35)'); body.addColorStop(1, 'rgba(206,218,234,0.6)');
    g.fillStyle = body; g.fill();
    // inside floor
    g.beginPath(); g.ellipse(G.cx, G.botY, G.rx - 3, G.ry - 2, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(29,36,51,0.06)'; g.fill();
    // back half of the rim, seen through the glass
    g.beginPath(); g.ellipse(G.cx, G.topY, G.rx, G.ry, 0, Math.PI, Math.PI * 2);
    g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 1.5; g.stroke();
    // liquid body and surface
    if (opts.liquid !== false) {
      const liq = opts.liquidColor || c.water;
      g.save();
      g.beginPath();
      g.ellipse(G.cx, G.surfY, G.rx - 2, G.ry - 1, 0, Math.PI, Math.PI * 2);
      g.lineTo(G.cx + G.rx - 2, G.botY);
      g.ellipse(G.cx, G.botY, G.rx - 2, G.ry - 1, 0, 0, Math.PI);
      g.closePath();
      const lg = g.createLinearGradient(0, G.surfY, 0, G.botY + G.ry);
      lg.addColorStop(0, liq); lg.addColorStop(1, shade(liq.startsWith('#') ? liq : '#e3f1fb', -0.06));
      g.globalAlpha = 0.85; g.fillStyle = lg; g.fill();
      g.restore();
    }
  }
  // The water surface (drawn after things below it, before things floating above)
  function beakerSurface(g, G, opts) {
    const c = C();
    if (opts && opts.liquid === false) return;
    g.save();
    g.beginPath(); g.ellipse(G.cx, G.surfY, G.rx - 2, G.ry - 1, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
    g.strokeStyle = c.waterLine; g.lineWidth = 1.6; g.stroke();
    // meniscus: the front edge reads darker
    g.beginPath(); g.ellipse(G.cx, G.surfY, G.rx - 2, G.ry - 1, 0, 0.08, Math.PI - 0.08);
    g.strokeStyle = shade(c.waterLine.startsWith('#') ? c.waterLine : '#7fb3d9', -0.2); g.lineWidth = 2.2; g.stroke();
    g.restore();
  }
  // Everything in front of the contents: front glass edges, rim, spout, highlights, graduations
  function beakerFront(g, G, opts) {
    opts = opts || {};
    g.save();
    // highlights (clipped to the glass)
    silhouette(g, G); g.save(); g.clip();
    const hl = (x, w, a) => {
      const gr = g.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, G.topY - G.ry, w, G.botY - G.topY + 2 * G.ry);
    };
    hl(G.cx - G.rx * 0.78, G.rx * 0.18, 0.75);
    hl(G.cx - G.rx * 0.52, G.rx * 0.05, 0.5);
    hl(G.cx + G.rx * 0.68, G.rx * 0.12, 0.4);
    // edge shading so the walls read as curved glass
    const eg = g.createLinearGradient(G.cx - G.rx, 0, G.cx + G.rx, 0);
    eg.addColorStop(0, 'rgba(29,36,51,0.10)'); eg.addColorStop(0.08, 'rgba(29,36,51,0)'); eg.addColorStop(0.92, 'rgba(29,36,51,0)'); eg.addColorStop(1, 'rgba(29,36,51,0.12)');
    g.fillStyle = eg; g.fillRect(G.cx - G.rx, G.topY - G.ry, 2 * G.rx, G.botY - G.topY + 2 * G.ry);
    g.restore();
    // graduations on the front face, following its curve
    (opts.grads || []).forEach(gr => {
      const y = G.botY - gr.f * (G.botY - G.topY) * 0.92;
      const a0 = Math.PI * 0.56, a1 = gr.major ? Math.PI * 0.74 : Math.PI * 0.66;
      g.beginPath(); g.ellipse(G.cx, y, G.rx, G.ry, 0, a0, a1);
      g.strokeStyle = 'rgba(29,36,51,0.55)'; g.lineWidth = gr.major ? 1.8 : 1.2; g.stroke();
      if (gr.label) {
        const ang = a1, lx = G.cx + G.rx * Math.cos(ang) + 2, ly = y + G.ry * Math.sin(ang) - 9; // just above the tick, not on it
        g.font = '700 11px "Space Mono", monospace'; g.fillStyle = 'rgba(29,36,51,0.7)';
        g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(gr.label, lx, ly);
      }
    });
    // front walls and base
    g.strokeStyle = INK; g.lineWidth = 2.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(G.cx - G.rx, G.topY); g.lineTo(G.cx - G.rx, G.botY);
    g.ellipse(G.cx, G.botY, G.rx, G.ry, 0, Math.PI, 0, true);
    g.lineTo(G.cx + G.rx, G.topY); g.stroke();
    // thick glass at the base
    g.beginPath(); g.ellipse(G.cx, G.botY - 4, G.rx - 3, G.ry - 1, 0, 0.15, Math.PI - 0.15);
    g.strokeStyle = 'rgba(29,36,51,0.18)'; g.lineWidth = 3; g.stroke();
    // rim: outer and inner edge (glass thickness)
    g.beginPath(); g.ellipse(G.cx, G.topY, G.rx, G.ry, 0, 0, Math.PI * 2);
    g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.ellipse(G.cx, G.topY + 1, G.rx - 5, G.ry - 2.5, 0, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(29,36,51,0.3)'; g.lineWidth = 1.2; g.stroke();
    // pour spout on the left: the rim pinches out into a small lip that runs into the left wall
    if (opts.spout !== false) {
      const L = G.cx - G.rx, out = Math.max(10, G.rx * 0.11), th = 0.42;
      const back = [G.cx - G.rx * Math.cos(th), G.topY - G.ry * Math.sin(th)];   // where the lip leaves the back rim
      const tip = [L - out, G.topY - G.ry * 0.12];                                 // the pouring point, a touch above the rim
      const wall = [L, G.topY + Math.max(8, G.ry * 0.75)];                         // where it rejoins the wall
      const lip = () => {
        g.moveTo(back[0], back[1]);
        g.bezierCurveTo(back[0] - out * 0.5, back[1] + 1, tip[0] + out * 0.25, tip[1] - 2, tip[0], tip[1]);
        g.bezierCurveTo(tip[0] + out * 0.15, tip[1] + 3, L - out * 0.45, wall[1] - 4, wall[0], wall[1]);
      };
      g.beginPath(); lip(); g.lineTo(L, G.topY); g.ellipse(G.cx, G.topY, G.rx, G.ry, 0, Math.PI, Math.PI + th); g.closePath();
      g.fillStyle = 'rgba(240,245,251,0.97)'; g.fill();          // covers the rim where the lip takes over
      g.beginPath(); lip(); g.strokeStyle = INK; g.lineWidth = 2.5; g.lineCap = 'round'; g.stroke();
      // the glass thickness inside the lip
      g.beginPath(); g.moveTo(back[0] + 3, back[1] + 2);
      g.quadraticCurveTo(L - out * 0.55, G.topY - G.ry * 0.05, L + 2, G.topY + G.ry * 0.45);
      g.strokeStyle = 'rgba(29,36,51,0.3)'; g.lineWidth = 1.2; g.stroke();
    }
    g.restore();
  }

  // ---------- Solid pile with its lattice showing ----------
  const patCache = {};
  function latticePattern(g, salt, ions, colour) {
    const key = salt.formula + colour;
    if (patCache[key]) return patCache[key];
    const unit = latticeUnit(salt.cat[1], salt.an[1]);
    const cell = 9, cols = unit.length * 2, rows = 2;
    const cv = document.createElement('canvas'); cv.width = cell * cols; cv.height = cell * rows;
    const p = cv.getContext('2d');
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const kind = unit[(k + r * Math.ceil(unit.length / 2)) % unit.length];
      const info = kind === 'c' ? ions.cat : ions.an;
      ion(p, k * cell + cell / 2, r * cell + cell / 2, 3.6, info, { label: false, solidColour: colour, solid: 1 });
    }
    patCache[key] = g.createPattern(cv, 'repeat');
    return patCache[key];
  }
  // A mound sitting on the beaker floor. frac 0..1 sets its size.
  function pile(g, G, frac, salt, ions, colour) {
    if (frac <= 0) return;
    const f = Math.min(1, Math.sqrt(frac));
    const w = G.rx * (0.22 + 0.62 * f), h = 10 + 46 * f, x = G.cx - w * 0.05, y = G.botY + G.ry * 0.15;
    const path = () => {
      g.beginPath();
      g.moveTo(x - w, y);
      g.bezierCurveTo(x - w * 0.7, y - h * 0.55, x - w * 0.35, y - h * 1.05, x - w * 0.05, y - h);
      g.bezierCurveTo(x + w * 0.3, y - h * 0.95, x + w * 0.65, y - h * 0.5, x + w, y);
      g.ellipse(x, y, w, w * G.tilt * 0.9, 0, 0, Math.PI);
      g.closePath();
    };
    g.save();
    path(); g.fillStyle = colour; g.fill();
    path(); g.save(); g.clip();
    g.globalAlpha = 1; g.fillStyle = latticePattern(g, salt, ions, colour); g.fillRect(x - w - 10, y - h - 10, 2 * w + 20, h + 40);
    // light from the top left
    const lg = g.createLinearGradient(x - w, y - h, x + w, y);
    lg.addColorStop(0, 'rgba(255,255,255,0.35)'); lg.addColorStop(0.6, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(29,36,51,0.18)');
    g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(x - w - 10, y - h - 10, 2 * w + 20, h + 40);
    g.restore();
    path(); g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke();
    g.restore();
  }

  // ---------- Zoomed crystal: a 3D slab of ion spheres ----------
  // win: { x, y, r } circle; top: y of the slab's front top edge. Returns top-surface sites
  // (screen x, y) so free ions can leave from and land on them.
  // Layers of the solid stacked on the beaker floor, seen slightly from above.
  // opts.layers: how many layers (decimal: 2.4 = two full layers and a third one 40 % built,
  // filling from the centre outwards so new layers can be watched forming).
  // Returns { surface: top sites (where ions leave from), edge: next empty sites (where ions land),
  //           topAt(x): the top surface's front y at x, top: that y at the centre }.
  function crystalSlab(g, win, floor, salt, ions, opts) {
    opts = opts || {};
    const unit = latticeUnit(salt.cat[1], salt.an[1]);
    const R = opts.r || 15, gap = R * 2.15, LH = gap * 0.92, DEPTH = R * 2.3, DR = 4;
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    const H = Math.max(0, opts.layers || 0);
    const full = Math.floor(H + 1e-6), frac = H - full;
    const mod = (a, n) => ((a % n) + n) % n;
    const kindAt = (k, row) => unit[mod(k + row * 2, unit.length)];
    const rowY = j => floor - R - (j - 1) * LH;       // front row of layer j (1 = on the floor)
    const halfChord = y => Math.sqrt(Math.max(0, win.r * win.r - (y - win.y) * (y - win.y)));
    // even, so k runs over whole numbers: an odd n gave half-integer k, no lattice kind matched, and every site drew as the
    // anion (the 4.2 beaker's wider floor: "just a network of I", user 2026-11-20). Same n as before for the zoom window
    const n = 2 * Math.ceil(((win.r * 2.2) / gap + 2) / 2);
    const draw = (x, y, s, kind, a) => ion(g, x, y, R * s, kind === 'c' ? ions.cat : ions.an,
      { alpha: a * alpha, label: s > 0.8, charge: false, solidColour: opts.colour, solid: 1 });
    // glass floor of the beaker
    g.save(); g.globalAlpha = 0.9;
    g.fillStyle = 'rgba(127,179,217,0.18)'; g.fillRect(win.x - win.r, floor, win.r * 2, win.r);
    g.strokeStyle = 'rgba(80,120,160,0.45)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(win.x - win.r, floor); g.lineTo(win.x + win.r, floor); g.stroke(); g.restore();
    // top face of layer j, back rows first; only sites with |x - centre| <= half are built
    const face = (j, half, rows) => {
      for (let d = 0; d < rows; d++) {
        const t = d / (DR - 1), s = 0.62 + 0.38 * t, back = DR - 1 - d;
        const y = rowY(j) - (1 - t) * DEPTH, step = gap * s;
        for (let k = -n / 2; k <= n / 2; k++) {
          const x = win.x + (k + mod(j + back, 2) * 0.5) * step;
          if (Math.abs(x - win.x) > half) continue;
          draw(x, y, s, kindAt(k, j + back), 0.55 + 0.45 * t);
        }
      }
    };
    const frontRow = j => {
      const out = [];
      for (let k = -n / 2; k <= n / 2; k++) out.push({ x: win.x + (k + mod(j, 2) * 0.5) * gap, y: rowY(j), kind: kindAt(k, j) });
      return out;
    };
    const partHalf = frac > 0.002 ? frac * (halfChord(rowY(full + 1)) + gap * 0.5) : -1;
    if (full >= 1) face(full, 1e9, DR - 1);             // top face of the last full layer
    if (partHalf > 0) face(full + 1, partHalf, DR - 1);  // the layer being built: back rows
    for (let j = full; j >= 1; j--) frontRow(j).forEach(st => draw(st.x, st.y, 1, st.kind, 1));
    const part = full + 1, partRow = frontRow(part);
    partRow.forEach(st => { if (Math.abs(st.x - win.x) <= partHalf) draw(st.x, st.y, 1, st.kind, 1); });
    // where ions leave from / land on
    const lower = full >= 1 ? frontRow(full) : [];
    const surface = partRow.filter(st => Math.abs(st.x - win.x) <= partHalf)
      .concat(lower.filter(st => Math.abs(st.x - win.x) > partHalf + gap * 0.5))
      .filter(st => Math.abs(st.x - win.x) < halfChord(st.y) - R);
    const edge = partRow.filter(st => Math.abs(st.x - win.x) > partHalf && Math.abs(st.x - win.x) < halfChord(st.y) - R)
      .sort((a, b) => Math.abs(a.x - win.x) - Math.abs(b.x - win.x)).slice(0, 6);
    const topAt = x => (Math.abs(x - win.x) <= partHalf + R ? rowY(part) : full >= 1 ? rowY(full) : floor + R) - R;
    return { surface, edge, topAt, top: topAt(win.x) + R };
  }

  // ---------- Magnifier frame around the zoomed view ----------
  function lensBack(g, win) {
    const c = C();
    g.beginPath(); g.arc(win.x, win.y, win.r, 0, Math.PI * 2);
    const rg = g.createRadialGradient(win.x, win.y - win.r * 0.3, win.r * 0.2, win.x, win.y, win.r);
    rg.addColorStop(0, '#f2f8fd'); rg.addColorStop(1, c.water);
    g.fillStyle = rg; g.fill();
  }
  function lensFront(g, win) {
    g.save();
    g.beginPath(); g.arc(win.x, win.y, win.r, 0, Math.PI * 2);
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(win.x, win.y, win.r - 6, Math.PI * 1.08, Math.PI * 1.42);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5; g.lineCap = 'round'; g.stroke();
    g.restore();
  }

  const SolDraw = { ion, neutral, mix, latticeUnit, beakerGeom, beakerBack, beakerSurface, beakerFront, pile, crystalSlab, lensBack, lensFront, shade };
  global.SolDraw = SolDraw;
})(typeof window !== 'undefined' ? window : globalThis);
