/* SolPictures: the Guide's drawn pictures (lab glassware, a balance, a calibration graph, test tubes).
   All drawn in a 900 × 530 frame; the Guide scales that frame to fit its stage.
   marks: a Set of keys from the worked steps that light up one part of the picture.

   Animation (2026-11-18): every picture is a function of t, the seconds since its section opened.
   A short story plays once (a solid is weighed and dissolves, a solution is poured and diluted, a
   residue is evaporated and weighed, a calibration line is built), then the picture holds with the
   ions still drifting. Ions move in depth like the live beaker (SolScene): z 0 = back, 1 = front,
   drawn smaller and fainter at the back. Positions are stateless (a bounce in a unit box), so a
   picture can be redrawn at any t and skipping to the end is just a later t. END gives each story's
   length; t = Infinity (or any t past END) is the finished picture. */
(function (global) {
  'use strict';
  const INK = '#1d2433', DIM = '#5b6474', ACCENT = '#4152d9', WATER = '#e3f1fb', WATER_LINE = '#7fb3d9';
  const Draw = global.SolDraw;

  // ---------- time and randomness ----------
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const phase = (t, a, b) => ease((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const tri = v => { const m = ((v % 2) + 2) % 2; return m < 1 ? m : 2 - m; };  // bounce inside 0 … 1
  function rng(seed) { let s = ((seed || 1) * 7919) % 2147483647 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  // a fixed scatter so dots don't jump between frames
  function scatter(n, seed) { const r = rng(seed || 7), out = []; for (let i = 0; i < n; i++) out.push([r(), r()]); return out; }

  // ---------- ions that drift in depth ----------
  function ionInfo(k) {
    if (k === 'Cu2+') return { sym: 'Cu', q: '2+', z: 2 };
    const s = global.SolData.ION[k].sym, sym = s.replace(/[⁺⁻²³]+$/, '');
    return { sym, q: s.slice(sym.length).replace('⁺', '+').replace('⁻', '−').replace('²', '2'), z: global.SolData.ION[k].z,
      role: k === 'H+' ? 'acid' : k === 'OH-' ? 'base' : null };
  }
  // keys: ion keys. Each ion bounces through a unit box: u across, v down, z depth
  function swarm(keys, seed) {
    const r = rng(seed || 3), sg = () => (r() < 0.5 ? -1 : 1);
    // starting spots spread evenly (golden-ratio steps plus a little jitter), so no swarm starts in a clump
    return keys.map((k, i) => ({ info: ionInfo(k), u0: (i * 0.618 + r() * 0.25) % 1, v0: (i * 0.382 + 0.2 + r() * 0.3) % 1, z0: r(),
      du: sg() * (0.11 + r() * 0.1), dv: sg() * (0.09 + r() * 0.08), dz: sg() * (0.12 + r() * 0.12) }));
  }
  const at = (p, t) => ({ u: tri(p.u0 + p.du * t), v: tri(p.v0 + p.dv * t), z: tri(p.z0 + p.dz * t) });
  const repeat = (k, n) => Array.from({ length: n }, () => k);
  // sprites: [{ x, y, z, info, a, solidColour, solid }], drawn back to front
  function drawSprites(g, list, R) {
    list.filter(Boolean).sort((a, b) => a.z - b.z).forEach(p => {
      const k = 0.62 + 0.38 * p.z;
      Draw.ion(g, p.x, p.y, (p.r || R) * k, p.info, { alpha: (p.a == null ? 1 : p.a) * (0.55 + 0.45 * p.z), label: k > 0.7,
        solidColour: p.solidColour, solid: p.solid });
    });
  }
  // where a unit-box position lands inside a SolDraw beaker's liquid
  const beakerPlace = (G, R) => q => ({
    x: G.cx + (2 * q.u - 1) * Math.max(0, G.rx - R - 6),
    y: G.surfY + R + 3 + q.v * Math.max(0, G.botY - G.surfY - R - 5) - (1 - q.z) * G.ry * 0.7, z: q.z });

  // ---------- small drawing helpers ----------
  function mark(g, x, y, w, h, on) {
    if (!on) return;
    g.save(); g.strokeStyle = ACCENT; g.lineWidth = 3; g.setLineDash([7, 6]);
    g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 14) : g.rect(x, y, w, h); g.stroke(); g.restore();
  }
  function label(g, text, x, y, o) {
    o = o || {};
    if (o.alpha === 0) return;
    // Space Mono has no superscript or subscript digits, so chemical formulas always use Space Grotesk
    const mono = o.mono && !/[⁰-₟¹²³]/.test(text);
    g.save(); g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.fillStyle = o.color || INK; g.font = (o.weight || '700') + ' ' + (o.size || 18) + 'px ' + (mono ? 'Space Mono, monospace' : 'Space Grotesk, sans-serif');
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y); g.restore();
  }
  function arrow(g, x1, y, x2, text) {
    g.save(); g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x1, y); g.lineTo(x2 - 12, y); g.stroke();
    g.beginPath(); g.moveTo(x2, y); g.lineTo(x2 - 14, y - 8); g.lineTo(x2 - 14, y + 8); g.closePath(); g.fill(); g.restore();
    if (text) label(g, text, (x1 + x2) / 2, y - 20, { size: 15, mono: true, weight: '400', color: DIM });
  }
  // a stream of liquid along a quadratic curve, with drops moving along it
  function stream(g, pts, t, w) {
    const [a, c, b] = pts;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(127,179,217,0.55)'; g.lineWidth = w || 6;
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(c[0], c[1], b[0], b[1]); g.stroke();
    g.strokeStyle = 'rgba(79,140,190,0.85)'; g.lineWidth = Math.max(2, (w || 6) * 0.45); g.setLineDash([7, 11]); g.lineDashOffset = -t * 90;
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(c[0], c[1], b[0], b[1]); g.stroke();
    g.restore();
  }
  const quad = (a, c, b, s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
  // a small faceted crystal (cube seen from above and to the side); colour: the solid's real colour
  function crystal(g, x, y, s, colour, rot) {
    if (s < 0.8) return;
    const d = s * 0.38;
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.lineWidth = Math.max(0.8, s * 0.09); g.strokeStyle = 'rgba(29,36,51,0.6)'; g.lineJoin = 'round';
    const face = (pts, fill) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = fill; g.fill(); g.stroke(); };
    const h = s / 2;
    face([[-h, -h], [h, -h], [h, h], [-h, h]], colour);                                   // front
    face([[-h, -h], [-h + d, -h - d], [h + d, -h - d], [h, -h]], 'rgba(255,255,255,0.9)'); // top
    face([[h, -h], [h + d, -h - d], [h + d, h - d], [h, h]], 'rgba(29,36,51,0.16)');       // side
    g.restore();
  }
  // a balance with a digital display; heap: 0 … 1 for a small pile of crystals on the pan
  function balance(g, cx, y, w, reading, pileColour, heap) {
    g.save();
    const sh = g.createRadialGradient(cx, y + 70, 0, cx, y + 70, w * 0.6);
    sh.addColorStop(0, 'rgba(29,36,51,0.18)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(cx, y + 72, w * 0.6, 14, 0, 0, Math.PI * 2); g.fill();
    const body = g.createLinearGradient(0, y, 0, y + 70); body.addColorStop(0, '#eef1f6'); body.addColorStop(1, '#d9dfe8');
    g.fillStyle = body; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(cx - w / 2, y, w, 70, 12); g.fill(); g.stroke();                 // body
    g.fillStyle = '#b7c0ce'; g.fillRect(cx - 6, y - 8, 12, 9);                                  // post
    const pan = g.createLinearGradient(0, y - 18, 0, y + 6); pan.addColorStop(0, '#e6eaf1'); pan.addColorStop(1, '#b9c2d0');
    g.fillStyle = pan; g.beginPath(); g.ellipse(cx, y - 6, w * 0.38, 12, 0, 0, Math.PI * 2); g.fill(); g.stroke(); // pan
    g.fillStyle = '#20293a'; g.beginPath(); g.roundRect(cx - 62, y + 20, 124, 36, 6); g.fill();   // display
    g.fillStyle = '#8ff0c4'; g.font = '700 21px Space Mono, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(reading, cx, y + 39);
    const k = heap == null ? 1 : heap;
    if (pileColour && k > 0.02) { // a small heap of crystals on the pan
      g.fillStyle = pileColour; g.strokeStyle = INK; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(cx, y - 12, 34 * Math.sqrt(k), 13 * k, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      scatter(7, 9).forEach((p, i) => { if (i / 7 < k) crystal(g, cx - 22 * Math.sqrt(k) + p[0] * 44 * Math.sqrt(k), y - 13 - p[1] * 8 * k, 5, pileColour, p[0] - 0.5); });
    }
    g.restore();
  }

  // ---------- a volumetric flask (round bulb, long neck, one ring on the neck) ----------
  function flaskGeom(cx, bottom, R, o) {
    o = o || {};
    const nw = o.nw || Math.max(13, R * 0.15), cy = bottom - R * 0.82, yj = cy - Math.sqrt(R * R - nw * nw);
    const neckH = R * (o.neck || 1.2), neckTop = yj - neckH, lineY = neckTop + neckH * 0.38;
    const bw = Math.sqrt(R * R - (bottom - cy) * (bottom - cy));
    const halfW = y => (y < yj ? nw : Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))));
    // volume below each height (a body of revolution), so a level can be set as a fraction of the flask
    const N = 240, dy = (bottom - lineY) / N, ys = [bottom], vs = [0];
    for (let i = 1; i <= N; i++) { const y = bottom - dy * i, w = halfW(y + dy / 2); ys.push(y); vs.push(vs[i - 1] + w * w * dy); }
    const total = vs[N];
    const levelY = f => {
      if (f <= 0) return bottom;
      const tgt = Math.min(1, f) * total;
      for (let i = 1; i <= N; i++) if (vs[i] >= tgt) return ys[i - 1] + (ys[i] - ys[i - 1]) * (tgt - vs[i - 1]) / Math.max(1e-9, vs[i] - vs[i - 1]);
      return lineY;
    };
    return { cx, R, nw, cy, yj, neckTop, lineY, bottom, bw, halfW, levelY };
  }
  function flaskPath(g, F) {
    const aL = Math.atan2(F.yj - F.cy, -F.nw), aBL = Math.atan2(F.bottom - F.cy, -F.bw);
    const aBR = Math.atan2(F.bottom - F.cy, F.bw), aR = Math.atan2(F.yj - F.cy, F.nw);
    g.beginPath(); g.moveTo(F.cx - F.nw, F.neckTop); g.lineTo(F.cx - F.nw, F.yj);
    g.arc(F.cx, F.cy, F.R, aL, aBL, true); g.lineTo(F.cx + F.bw, F.bottom);
    g.arc(F.cx, F.cy, F.R, aBR, aR, true); g.lineTo(F.cx + F.nw, F.neckTop);
  }
  // behind the contents: bench shadow, glass body, liquid up to levelY
  function flaskBack(g, F, levelY) {
    g.save();
    const sh = g.createRadialGradient(F.cx, F.bottom + 4, 0, F.cx, F.bottom + 4, F.bw * 1.6);
    sh.addColorStop(0, 'rgba(29,36,51,0.22)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(F.cx, F.bottom + 5, F.bw * 1.6, 13, 0, 0, Math.PI * 2); g.fill();
    flaskPath(g, F); g.closePath();
    const body = g.createLinearGradient(F.cx - F.R, 0, F.cx + F.R, 0);
    body.addColorStop(0, 'rgba(214,224,238,0.6)'); body.addColorStop(0.5, 'rgba(246,249,253,0.35)'); body.addColorStop(1, 'rgba(206,218,234,0.65)');
    g.fillStyle = body; g.fill();
    if (levelY < F.bottom - 0.5) {
      flaskPath(g, F); g.closePath(); g.save(); g.clip();
      const lg = g.createLinearGradient(0, levelY, 0, F.bottom);
      lg.addColorStop(0, '#d9ecf9'); lg.addColorStop(1, '#b6d8f1');
      g.globalAlpha = 0.9; g.fillStyle = lg; g.fillRect(F.cx - F.R - 4, levelY, 2 * F.R + 8, F.bottom - levelY + 4);
      g.restore();
    }
    g.restore();
  }
  // the liquid surface: an ellipse as wide as the glass at that height
  function flaskSurface(g, F, levelY) {
    if (levelY >= F.bottom - 1) return;
    const rx = Math.max(2, F.halfW(levelY) - 2), ry = Math.max(1.6, rx * 0.16);
    g.save(); g.beginPath(); g.ellipse(F.cx, levelY, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fill(); g.strokeStyle = WATER_LINE; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.ellipse(F.cx, levelY, rx, ry, 0, 0.1, Math.PI - 0.1); g.strokeStyle = '#5f97c2'; g.lineWidth = 2; g.stroke();
    g.restore();
  }
  // in front: highlights, outline, base, the ring on the neck, the lip
  function flaskFront(g, F) {
    g.save();
    flaskPath(g, F); g.closePath(); g.save(); g.clip();
    const hl = g.createRadialGradient(F.cx - F.R * 0.45, F.cy - F.R * 0.35, 2, F.cx - F.R * 0.45, F.cy - F.R * 0.35, F.R * 0.55);
    hl.addColorStop(0, 'rgba(255,255,255,0.7)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.fillRect(F.cx - F.R, F.cy - F.R, F.R * 2, F.R * 2);
    const eg = g.createLinearGradient(F.cx - F.R, 0, F.cx + F.R, 0);
    eg.addColorStop(0, 'rgba(29,36,51,0.12)'); eg.addColorStop(0.1, 'rgba(29,36,51,0)'); eg.addColorStop(0.9, 'rgba(29,36,51,0)'); eg.addColorStop(1, 'rgba(29,36,51,0.14)');
    g.fillStyle = eg; g.fillRect(F.cx - F.R, F.neckTop, F.R * 2, F.bottom - F.neckTop);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(F.cx, F.cy, F.R * 0.8, Math.PI * 1.08, Math.PI * 1.32); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(F.cx - F.nw + 5, F.neckTop + 10); g.lineTo(F.cx - F.nw + 5, F.yj - 6); g.stroke();
    flaskPath(g, F); g.strokeStyle = INK; g.lineWidth = 2.8; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); g.moveTo(F.cx - F.bw + 4, F.bottom - 3); g.lineTo(F.cx + F.bw - 4, F.bottom - 3);
    g.strokeStyle = 'rgba(29,36,51,0.2)'; g.lineWidth = 3; g.stroke();
    // the ring on the neck (back half faint, front half dark)
    g.beginPath(); g.ellipse(F.cx, F.lineY, F.nw, F.nw * 0.32, 0, Math.PI, Math.PI * 2); g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.ellipse(F.cx, F.lineY, F.nw + 1, F.nw * 0.32, 0, 0, Math.PI); g.strokeStyle = INK; g.lineWidth = 2.4; g.stroke();
    // lip
    g.beginPath(); g.ellipse(F.cx, F.neckTop, F.nw + 4, 4, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(240,245,251,0.95)'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
    g.restore();
  }
  // where a unit-box position lands in the flask's liquid (the bulb; the neck is too narrow to show ions)
  const flaskPlace = (F, levelY, R) => q => {
    const top = Math.max(levelY, F.cy - F.R * 0.72) + R + 2, bot = F.bottom - R - 3;
    const y = top + q.v * Math.max(0, bot - top), hw = Math.max(0, F.halfW(y) - R - 4);
    return { x: F.cx + (2 * q.u - 1) * hw, y: y - (1 - q.z) * F.R * 0.06, z: q.z };
  };
  // a wash bottle tipped over the flask; p 0 … 1 fades it in and out
  function washBottle(g, x, y, p) {
    if (p <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, p * 3); g.translate(x, y); g.rotate(-0.5);
    const body = g.createLinearGradient(-22, 0, 22, 0); body.addColorStop(0, '#dfe7f1'); body.addColorStop(0.5, '#ffffff'); body.addColorStop(1, '#cfd9e6');
    g.fillStyle = body; g.strokeStyle = INK; g.lineWidth = 2.2;
    g.beginPath(); g.roundRect(-22, -30, 44, 66, 10); g.fill(); g.stroke();
    g.fillStyle = '#9aa6b8'; g.beginPath(); g.roundRect(-10, -40, 20, 12, 3); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0, -40); g.lineTo(0, -52); g.quadraticCurveTo(0, -60, -10, -62); g.lineTo(-30, -64);
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.restore();
    // where the nozzle points (for the stream), after the rotation
    const c = Math.cos(-0.5), s = Math.sin(-0.5);
    return [x + (-30) * c - (-64) * s, y + (-30) * s + (-64) * c];
  }
  // a hot plate; glow 0 … 1
  function hotPlate(g, cx, y, glow) {
    g.save();
    g.fillStyle = '#c5ccd8'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(cx - 95, y, 190, 46, 9); g.fill(); g.stroke();
    g.fillStyle = '#3a4252'; g.beginPath(); g.roundRect(cx - 82, y - 9, 164, 12, 4); g.fill(); g.stroke();
    if (glow > 0) { g.fillStyle = `rgba(240,96,40,${0.85 * glow})`; g.beginPath(); g.roundRect(cx - 78, y - 7, 156, 8, 3); g.fill(); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + 66, y + 23, 9, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx + 66, y + 23); g.lineTo(cx + 66 + 6 * Math.cos(-2.2 + glow * 2), y + 23 + 6 * Math.sin(-2.2 + glow * 2)); g.stroke();
    g.fillStyle = glow > 0.05 ? '#f06028' : '#7f8ea6'; g.beginPath(); g.arc(cx - 70, y + 23, 4, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // steam rising from x, y; k 0 … 1 for how much
  function steam(g, x, y, t, k) {
    if (k <= 0.01) return;
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const s = (t * 0.55 + i / 5) % 1, px = x + (i - 2) * 22, py = y - 10 - s * 110;
      g.strokeStyle = `rgba(140,155,175,${(1 - s) * 0.55 * k})`; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(px, py + 22);
      g.bezierCurveTo(px + 10 * Math.sin(t * 2 + i), py + 14, px - 10 * Math.sin(t * 2 + i), py + 6, px + 4 * Math.sin(t * 3 + i), py);
      g.stroke();
    }
    g.restore();
  }
  // a shallow porcelain evaporating dish; y = the rim's centre. liq / residue 0 … 1
  function dish(g, x, y, s, liq, residue) {
    const rx = 100 * s, ry = 24 * s, depth = 62 * s;
    g.save(); g.strokeStyle = INK; g.lineWidth = 3;
    const bowl = g.createLinearGradient(x - rx, 0, x + rx, 0); bowl.addColorStop(0, '#dcd5c6'); bowl.addColorStop(0.4, '#f3efe6'); bowl.addColorStop(1, '#d6cfbf');
    g.fillStyle = bowl; g.beginPath(); g.ellipse(x, y, rx, depth, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f7f4ee'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (residue > 0.01) {
      g.globalAlpha = residue; g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(x, y + 5 * s, 40 * s, 10 * s, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      scatter(10, 4).forEach(p => crystal(g, x - 30 * s + p[0] * 60 * s, y + 2 * s + p[1] * 7 * s, 4 * s, '#fbfbf8', p[1]));
      g.globalAlpha = 1;
    }
    if (liq > 0.01) {
      const k = Math.sqrt(liq);
      g.fillStyle = 'rgba(205,229,246,0.92)'; g.strokeStyle = WATER_LINE; g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(x, y + 4 * s * (1 - k), rx * 0.86 * k, ry * 0.8 * k, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    g.restore();
  }

  // ---------- Part 1 · 1.1 concentration: weigh the solid, dissolve it, fill to the line ----------
  const FLASK_R = 126;
  // st (optional) moves it one stage per worked step: 0 nothing yet; 1 weigh (to 1.5 s); 2 into the flask, dissolve and
  // fill to the line (1.5–6.4 s); 3 finished. st.k: seconds since that stage began (large = finished).
  function concMass(g, marks, t, st) {
    t = t == null ? 1e4 : t;
    if (st) { const from = [0, 0, 1.5, 6.4][Math.min(st.shown, 3)], to = [0, 1.5, 6.4, 6.4][Math.min(st.shown, 3)];
      t = from + Math.min(Math.max(isFinite(st.k) ? st.k : 1e4, 0), to - from); }
    // 0.2–1.3 s: crystals pour onto the pan and the reading climbs; 1.5–2.3 s: the solid is tipped off the pan into the flask
    const heap = phase(t, 0.2, 1.3) * (1 - clamp01((t - 1.5) / 0.66)); // empties as the six crystals leave
    label(g, 'Weigh the solid', 190, 40, { size: 20 });
    balance(g, 190, 330, 260, (2.00 * heap).toFixed(2) + ' g', '#fbfbf8', heap);
    for (let i = 0; i < 10; i++) {
      const p = clamp01((t - 0.15 - i * 0.1) / 0.35);
      if (p > 0 && p < 1) crystal(g, 172 + (i % 5) * 9, 200 + p * p * 112, 6, '#fbfbf8', i);
    }
    label(g, '2.00 g NaCl', 190, 432, { size: 16, mono: true, weight: '700', alpha: phase(t, 1.0, 1.4) });
    mark(g, 50, 270, 280, 182, marks.has('balance'));
    arrow(g, 345, 300, 470, 'dissolve, fill to the line');
    label(g, 'Make 250.0 mL of solution', 660, 40, { size: 20 });

    const F = flaskGeom(660, 470, FLASK_R), R = 14;
    // 4.9–6.2 s: water from a wash bottle brings the level from about half full up to the line
    const fill = phase(t, 4.9, 6.2), levelY = F.levelY(0.55 + 0.45 * fill);
    flaskBack(g, F, levelY);
    // six crystals arc from the pan to the mouth of the flask, drop down the neck, then shrink as they dissolve (3.0–4.6 s)
    const rest = j => ({ x: F.cx + (j - 2.5) * 17, y: F.bottom - 9 - (j % 2) * 4 });
    for (let j = 0; j < 6; j++) {
      const f = phase(t, 1.5 + j * 0.12, 2.2 + j * 0.12), d = phase(t, 2.2 + j * 0.12, 2.7 + j * 0.12), r = rest(j);
      if (f <= 0) continue;
      const mouth = [F.cx + (j - 2.5) * 3, F.neckTop - 4];
      let x, y;
      if (d <= 0) [x, y] = quad([168 + j * 9, 314], [430, -30], mouth, f);
      else {
        y = lerp(mouth[1], r.y, d * d);
        x = y < F.yj ? mouth[0] : lerp(mouth[0], r.x, clamp01((y - F.yj) / (r.y - F.yj)));
      }
      crystal(g, x, y, (d > 0 ? 12 : 7 + 5 * f) * (1 - phase(t, 3.0 + j * 0.15, 4.6 + j * 0.1)), '#fbfbf8', j * 0.7 + f * 3);
    }
    // ions leave the crystals (white, still in the solid) and spread through the water as they take their own colours
    const keys = []; for (let i = 0; i < 9; i++) keys.push('Na+', 'Cl-');
    const place = flaskPlace(F, levelY, R);
    drawSprites(g, swarm(keys, 11).map((p, i) => {
      const e = phase(t, 3.1 + i * 0.07, 4.2 + i * 0.07);
      if (e <= 0) return null;
      const q = at(p, t), pos = place(q), o = rest(i % 6);
      return { x: lerp(o.x, pos.x, e), y: lerp(o.y - 4, pos.y, e), z: lerp(1, q.z, e), info: p.info, a: Math.min(1, e * 4), solidColour: '#fbfbf8', solid: 1 - e };
    }), R);
    flaskSurface(g, F, levelY);
    flaskFront(g, F);
    if (fill > 0 && fill < 1) {
      const tip = washBottle(g, F.cx + 124, F.neckTop + 26, Math.min(fill, 1 - fill) * 4);
      stream(g, [tip, [F.cx + 10, tip[1] - 10], [F.cx, F.neckTop + 8]], t, 4);
      g.save(); g.strokeStyle = 'rgba(127,179,217,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(F.cx, F.neckTop + 8); g.lineTo(F.cx, levelY); g.stroke(); g.restore();
    }
    label(g, '250.0 mL', F.cx + F.nw + 16, F.lineY, { size: 16, mono: true, weight: '700', align: 'left' });
    mark(g, F.cx - F.nw - 30, F.lineY - 24, F.nw * 2 + 60 + 100, 48, marks.has('line'));
    mark(g, F.cx - F.R - 18, F.cy - F.R - 10, 2 * F.R + 36, F.bottom - F.cy + F.R + 22, marks.has('solution'));
    label(g, 'Na⁺ and Cl⁻ spread through the whole volume', 450, 505, { size: 15, weight: '400', color: DIM, alpha: phase(t, 3.9, 4.7) });
  }

  // a formula with subscripts: 'C_iV_i' draws C, small i, V, small i
  function formula(g, text, x, y, o) {
    o = o || {}; if (o.alpha === 0) return;
    const sz = o.size || 20, runs = text.split(/(_\w)/).filter(Boolean).map(r => (r[0] === '_' ? [r[1], true] : [r, false]));
    const font = sub => (o.weight || '700') + ' ' + (sub ? Math.round(sz * 0.64) : sz) + 'px Space Grotesk, sans-serif';
    g.save(); g.globalAlpha = o.alpha == null ? 1 : o.alpha; g.fillStyle = o.color || INK; g.textBaseline = 'middle'; g.textAlign = 'left';
    let w = 0; runs.forEach(([r, sub]) => { g.font = font(sub); w += g.measureText(r).width; });
    let px = o.align === 'left' ? x : x - w / 2;
    runs.forEach(([r, sub]) => { g.font = font(sub); g.fillText(r, px, sub ? y + sz * 0.3 : y); px += g.measureText(r).width; });
    g.restore();
  }

  // a 50.0 mL volumetric pipette standing on its tip at (x, tipY): thin stem, a bulb, a mark on the upper stem.
  // f: 0 … 1, how full (1 = up to the mark). sprites: ions inside it (drawn small, r 7).
  const PIP = { mark: 148, top: 190, bulb: 90, rv: 38, hw: 15 }; // short enough to stay on the stage over the flask's neck
  const pipHW = dy => dy < 14 ? lerp(1.4, 3.2, dy / 14) : Math.max(3.2, PIP.hw * Math.sqrt(Math.max(0, 1 - ((dy - PIP.bulb) / PIP.rv) ** 2)));
  function pipette(g, x, tipY, f, alpha, sprites) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = alpha;
    const side = (sign, inset) => { const pts = []; for (let dy = 0; dy <= PIP.top; dy += 2) pts.push([x + sign * Math.max(0.5, pipHW(dy) - inset), tipY - dy]); return pts; };
    const outline = inset => { const L = side(-1, inset), Rr = side(1, inset).reverse(); g.beginPath(); L.concat(Rr).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
    outline(0);
    const gb = g.createLinearGradient(x - 18, 0, x + 18, 0);
    gb.addColorStop(0, 'rgba(206,218,234,0.75)'); gb.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gb.addColorStop(1, 'rgba(198,212,230,0.8)');
    g.fillStyle = gb; g.fill();
    if (f > 0.002) { // the liquid, from the tip up to its level
      g.save(); outline(1.4); g.clip();
      const top = tipY - f * PIP.mark;
      g.fillStyle = '#cfe6f7'; g.fillRect(x - 20, top, 40, tipY - top + 2);
      g.strokeStyle = WATER_LINE; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 18, top); g.lineTo(x + 18, top); g.stroke();
      g.restore();
    }
    if (sprites && sprites.length) drawSprites(g, sprites, 6.5);
    outline(0); g.strokeStyle = INK; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
    // highlight down the bulb, and the calibration mark on the upper stem
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 8, tipY - PIP.bulb - 22); g.quadraticCurveTo(x - 11, tipY - PIP.bulb, x - 8, tipY - PIP.bulb + 22); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, tipY - PIP.mark); g.lineTo(x + 7, tipY - PIP.mark); g.stroke();
    g.restore();
  }
  // eight places inside the bulb, two across and four down
  const bulbSlot = (x, tipY, j, T) => ({ x: x + (j % 2 ? 5 : -5) + 1.2 * Math.sin(T * 1.7 + j), y: tipY - PIP.bulb + (Math.floor(j / 2) - 1.5) * 14 + 1.2 * Math.cos(T * 1.3 + j * 2), z: 1, r: 6.5 });

  // ---------- 1.1 dilution, one stage per worked step ----------
  // st.shown: worked steps on show (0 the beaker and CᵢVᵢ; 1 a pipette moves 50.0 mL into the flask, the moles;
  // 2 water to the line, moles ÷ final volume; 3 CᵢVᵢ = C_fV_f). st.k: seconds since that stage began (large = finished).
  // The transfer (user, 2026-11-19: "a glass pipette, not a stream"): the pipette dips into the beaker, draws
  // the solution up to its mark, lifts across, drains into the flask's neck, and lifts away (about 7 s).
  function concDilute(g, marks, t, st) {
    t = t == null ? 1e4 : t; st = st || { shown: 3, k: 1e4 };
    const n = st.shown, lt = isFinite(st.k) ? st.k : 1e4;
    const pt = n >= 2 ? 1e4 : n === 1 ? lt : -1, ft = n >= 3 ? 1e4 : n === 2 ? lt : -1; // time into the transfer, the fill
    const R = 13, keys = []; for (let i = 0; i < 8; i++) keys.push('K+', 'I-');
    const MOVED = 8;                                         // the ions that go with the 50.0 mL (half the beaker)
    const sw = swarm(keys, 5);
    const drawP = phase(pt, 1.3, 2.7), drainP = phase(pt, 4.5, 6.1), fillP = phase(ft, 0.3, 2.0);
    const lvl = lerp(0.62, 0.31, drawP);
    const G = Draw.beakerGeom({ x: 70, y: 190, w: 190, h: 200 }, { level: lvl, tilt: 0.2 });
    const F = flaskGeom(640, 455, 100, { neck: 0.8 });       // a short neck, so the pipette's tip reaches it on the stage
    const frac = 0.2 * drainP + 0.8 * fillP, levelY = F.levelY(frac);
    const inB = beakerPlace(G, R), inF = flaskPlace(F, levelY, R);
    // the pipette's path: in over the beaker, down into the liquid, up, across, down into the neck, up and away
    const inX = G.cx + 28, dipY = G.botY - 16, overY = F.neckTop - 6, neckY = F.neckTop + 50;
    const descend = phase(pt, 0.3, 1.1), lift = phase(pt, 2.9, 3.4), across = phase(pt, 3.4, 4.1), lower = phase(pt, 4.1, 4.5), away = phase(pt, 6.3, 7.0);
    const px = lerp(inX, F.cx, across);
    const tipY = across < 1 ? lerp(lerp(dipY - 90, dipY, descend), overY, lift) : lerp(lerp(overY, neckY, lower), neckY - 60, away);
    const pAlpha = n >= 1 ? phase(pt, 0.1, 0.5) * (1 - phase(pt, 6.5, 7.0)) : 0;
    const pFill = drawP * (1 - drainP);
    const inPip = [], sprites = sw.map((p, i) => {
      const q = at(p, t), b = inB(q), fl = inF(q);
      if (i >= MOVED) return Object.assign(b, { info: p.info, where: 'b' });
      const kIn = clamp01((pt - 1.3 - i * 0.1) / 0.5), kOut = clamp01((pt - 4.5 - i * 0.12) / 0.6);
      const slot = Object.assign(bulbSlot(px, tipY, i, t), { info: p.info });
      if (kIn <= 0) return Object.assign(b, { info: p.info, where: 'b' });
      if (kOut >= 1) return Object.assign(fl, { info: p.info, where: 'f' });
      if (kOut > 0) { // down the stem, out of the tip, into the flask
        const tip = [px, tipY];
        if (kOut < 0.5) { const u = kOut / 0.5; inPip.push(Object.assign({}, slot, { x: lerp(slot.x, tip[0], u), y: lerp(slot.y, tip[1], u) })); return null; }
        const u = (kOut - 0.5) / 0.5; return { x: lerp(tip[0], fl.x, u), y: lerp(tip[1], fl.y, u), z: lerp(1, fl.z, u), r: lerp(6.5, R, u), info: p.info, where: 'f' };
      }
      if (kIn < 1) { // up from the beaker, in at the tip, up into the bulb
        if (kIn < 0.5) { const u = kIn / 0.5; return { x: lerp(b.x, px, u), y: lerp(b.y, tipY, u), z: lerp(b.z, 1, u), r: lerp(R, 6.5, u), info: p.info, where: 'b' }; }
        const u = (kIn - 0.5) / 0.5; inPip.push(Object.assign({}, slot, { x: lerp(px, slot.x, u), y: lerp(tipY, slot.y, u) })); return null;
      }
      inPip.push(slot); return null;
    }).filter(Boolean);
    label(g, '0.100 M KI', G.cx, 34, { size: 20 });
    Draw.beakerBack(g, G, { level: lvl });
    drawSprites(g, sprites.filter(s => s.where === 'b'), R);
    Draw.beakerSurface(g, G); Draw.beakerFront(g, G, { spout: false, grads: [] });
    label(g, 'Diluted to 250.0 mL', F.cx, 34, { size: 20 });
    flaskBack(g, F, levelY);
    drawSprites(g, sprites.filter(s => s.where === 'f'), R);
    flaskSurface(g, F, levelY); flaskFront(g, F);
    if (fillP > 0 && fillP < 1) {
      const tip = washBottle(g, F.cx + 124, F.neckTop + 26, Math.min(fillP, 1 - fillP) * 4);
      stream(g, [tip, [F.cx + 10, tip[1] - 10], [F.cx, F.neckTop + 8]], t, 4);
    }
    pipette(g, px, tipY, pFill, pAlpha, inPip);
    label(g, '50.0 mL pipette', px + 26, tipY - PIP.bulb, { size: 14, mono: true, weight: '400', color: DIM, align: 'left', alpha: pAlpha * (1 - phase(pt, 3.3, 3.6)) });
    label(g, '250.0 mL', F.cx + F.nw + 16, F.lineY, { size: 16, mono: true, weight: '700', align: 'left' });

    // under the beaker: CᵢVᵢ, its values, then (step 1) the moles they make
    formula(g, 'C_iV_i', G.cx, 430, { size: 22 });
    label(g, '0.100 M × 50.0 mL', G.cx, 460, { size: 16, mono: true, weight: '700' });
    label(g, '= 0.00500 mol KI', G.cx, 488, { size: 16, mono: true, weight: '700', color: ACCENT, alpha: n >= 1 ? phase(pt, 0, 0.5) : 0 });
    mark(g, G.cx - 118, 410, 236, n >= 1 ? 96 : 68, marks.has('moles'));
    // under the flask: the same moles arrive (step 1), then are divided by the final volume (step 2)
    label(g, '0.00500 mol KI', F.cx, 478, { size: 16, mono: true, weight: '700', color: ACCENT, alpha: n >= 1 ? phase(pt, 2.0, 2.5) : 0 });
    label(g, '÷ 0.2500 L = 0.0200 M', F.cx, 505, { size: 16, mono: true, weight: '700', alpha: n >= 2 ? phase(ft, 1.9, 2.4) : 0 });
    mark(g, F.cx - 125, 460, 250, 34, marks.has('moles'));
    mark(g, F.cx - F.R - 22, F.neckTop - 16, 2 * F.R + 44, 540 - F.neckTop, marks.has('diluted'));
    // step 3: the same thing in one equation
    if (n >= 3) {
      const a = phase(lt, 0, 0.5);
      formula(g, 'C_iV_i = C_fV_f', 395, 282, { size: 24, alpha: a });
      label(g, 'same moles before and after', 395, 314, { size: 14, weight: '400', color: DIM, alpha: a });
      mark(g, 290, 252, 210, 82, marks.has('eqn'));
    }
  }

  // ---------- 1.7 strategy 1: pour into a dish, evaporate, weigh the residue ----------
  function labMass(g, marks, t) {
    t = t == null ? 1e4 : t;
    const R = 10, keys = repeat('Mg2+', 3).concat(repeat('OH-', 6)), sw = swarm(keys, 21);
    const pourP = phase(t, 0.8, 2.0), evap = phase(t, 2.2, 5.0), move = phase(t, 5.3, 6.4), weigh = phase(t, 6.5, 7.2);
    const lvl = lerp(0.75, 0.02, pourP);
    const G = Draw.beakerGeom({ x: 40, y: 170, w: 160, h: 220 }, { level: lvl, tilt: 0.2 });
    const plateX = 440, plateY = 352, dishS = 0.8, onPlate = [plateX, plateY - 62 * dishS + 4], onPan = [770, 324 - 62 * dishS + 6];
    const dx = lerp(onPlate[0], onPan[0], move), dy = lerp(onPlate[1], onPan[1], move) - Math.sin(Math.PI * move) * 70;
    // beaker and its ions; ions ride the stream into the dish and fade there
    const inB = beakerPlace(G, R), rim = [G.cx + G.rx - 4, G.topY - 4], ctrl = [(rim[0] + onPlate[0]) / 2, rim[1] - 60];
    const sprites = sw.map((p, i) => {
      const q = at(p, t), k = clamp01((t - 0.9 - i * 0.1) / 0.8);
      if (k <= 0) return Object.assign(inB(q), { info: p.info, where: 'b' });
      if (k >= 1) return null;
      const xy = k < 0.3 ? [lerp(inB(q).x, rim[0], k / 0.3), lerp(inB(q).y, rim[1], k / 0.3)] : quad(rim, ctrl, [onPlate[0] + (i - 4) * 6, onPlate[1]], (k - 0.3) / 0.7);
      return { x: xy[0], y: xy[1], z: 1, info: p.info, a: 1 - phase(k, 0.8, 1), where: 'air' };
    });
    Draw.beakerBack(g, G, { level: lvl });
    drawSprites(g, sprites.filter(s => s && s.where === 'b'), R);
    Draw.beakerSurface(g, G); Draw.beakerFront(g, G, { spout: false, grads: [] });
    label(g, '250.0 mL saturated', 120, 440, { size: 15, mono: true });
    label(g, 'Mg(OH)₂ solution', 120, 462, { size: 15, mono: true });
    arrow(g, 222, 300, 330, 'evaporate');
    hotPlate(g, plateX, plateY, Math.max(0, Math.min(evap * 3, 1 - move)) * (evap > 0 ? 1 : 0));
    label(g, 'hot plate', plateX, plateY + 66, { size: 14, mono: true, weight: '400', color: DIM });
    arrow(g, 560, 300, 650, 'weigh');
    balance(g, 770, 330, 220, (1.63 * weigh).toFixed(2) + ' mg', null);
    const liq = pourP * (1 - evap);
    dish(g, dx, dy, dishS, liq, evap);
    steam(g, dx, dy - 10, t, evap > 0 && evap < 1 ? Math.min(1, Math.min(evap, 1 - evap) * 4) : 0);
    if (pourP > 0 && pourP < 1) stream(g, [rim, ctrl, onPlate], t, 6);
    drawSprites(g, sprites.filter(s => s && s.where === 'air'), R);
    label(g, 'white residue', dx, dy - 52, { size: 15, mono: true, weight: '400', color: DIM, alpha: phase(t, 4.2, 5.0) });
    mark(g, dx - 90, dy - 32, 180, 80, marks.has('residue'));
    mark(g, 650, 260, 240, 150, marks.has('balance'));
  }

  // ---------- 1.7 strategy 2: conductivity standards, the calibration line, then the sample ----------
  const STANDARDS = [[0.5, 24.6], [1.0, 50.8], [1.5, 74.1], [2.0, 100.5]];
  // A glass dropper over a beaker, k seconds into one addition: it comes in (0–0.25), the bulb squeezes and three
  // drops fall to the surface with a ripple (0.35–1.1), then it goes (1.3–1.6). tipX/tipY: where the tip hangs.
  function standardDropper(g, tipX, tipY, surfY, k) {
    const a = phase(k, 0, 0.25) * (1 - phase(k, 1.3, 1.6));
    if (a <= 0) return;
    const lift = (1 - phase(k, 0, 0.25)) * -18, ty = tipY + lift;
    const squeeze = Math.sin(Math.PI * clamp01((k - 0.3) / 0.8)) * 0.35;
    g.save(); g.globalAlpha = a; g.lineJoin = 'round';
    // drops, falling from the tip to the surface; a ripple where each lands
    for (let j = 0; j < 3; j++) {
      const d = clamp01((k - 0.35 - j * 0.24) / 0.26);
      if (d > 0 && d < 1) {
        const y = lerp(ty + 6, surfY - 4, d * d);
        g.fillStyle = 'rgba(207,230,247,0.95)'; g.strokeStyle = '#5f97c2'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(tipX, y - 7); g.quadraticCurveTo(tipX + 4.5, y - 1, tipX, y + 3.5); g.quadraticCurveTo(tipX - 4.5, y - 1, tipX, y - 7); g.fill(); g.stroke();
      }
      const r = clamp01((k - 0.61 - j * 0.24) / 0.35);
      if (r > 0 && r < 1) { g.strokeStyle = `rgba(95,151,194,${0.8 * (1 - r)})`; g.lineWidth = 1.5;
        g.beginPath(); g.ellipse(tipX, surfY, 4 + 16 * r, 1.5 + 4 * r, 0, 0, Math.PI * 2); g.stroke(); }
    }
    // glass barrel, tapering to the tip
    const top = ty - 58, bw = 6;
    g.fillStyle = 'rgba(236,243,250,0.95)'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(tipX - bw, top); g.lineTo(tipX - bw, ty - 16); g.lineTo(tipX - 1.6, ty); g.lineTo(tipX + 1.6, ty);
    g.lineTo(tipX + bw, ty - 16); g.lineTo(tipX + bw, top); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(127,179,217,0.55)'; g.fillRect(tipX - bw + 2, ty - 30, 2 * bw - 4, 12); // liquid left in the barrel
    // rubber bulb, squeezed while the drops come out
    g.fillStyle = '#3a4152'; g.strokeStyle = INK;
    g.beginPath(); g.ellipse(tipX, top - 12, 11 * (1 - squeeze), 15, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillRect(tipX - bw - 2, top - 3, 2 * bw + 4, 6); g.strokeRect(tipX - bw - 2, top - 3, 2 * bw + 4, 6);
    g.restore();
  }

  // The apparatus sits on the left, the graph on the right, so no label crosses a line.
  // Timeline (s): standards one at a time from 0.4 s, 2.0 s each (a dropper adds it, its molarity shows under the
  // beaker, the meter climbs, the point lands), the line 8.4–9.3; the saturated sample dropped in at 9.6, its
  // reading across to the line 11.1–12.2; down to the concentration 12.4–13.3.
  // st (optional) moves it one stage per worked step: 0 nothing measured; 1 the standards and the line;
  // 2 the sample's reading, across to the line; 3 and on, down to the concentration.
  const COND_STAGE = [0, 9.5, 12.3, 13.8];
  function labConductivity(g, marks, t, st) {
    t = t == null ? 1e4 : t;
    if (st) { const n = Math.min(st.shown, 3), from = n ? COND_STAGE[n - 1] : 0, to = COND_STAGE[n];
      t = from + Math.min(Math.max(isFinite(st.k) ? st.k : 1e4, 0), to - from); }
    const x0 = 360, y0 = 440, w = 500, h = 360, xMax = 2.5, yMax = 130;
    const X = c => x0 + w * c / xMax, Y = k => y0 - h * k / yMax;
    // axes
    g.save();
    g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, y0 - h - 10); g.lineTo(x0, y0); g.lineTo(x0 + w + 10, y0); g.stroke();
    g.font = '400 14px Space Mono, monospace'; g.fillStyle = DIM; g.textAlign = 'center'; g.textBaseline = 'top';
    for (let c = 0; c <= 2.5; c += 0.5) { g.beginPath(); g.moveTo(X(c), y0); g.lineTo(X(c), y0 + 7); g.stroke(); g.fillText(c.toFixed(1), X(c), y0 + 11); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let k = 0; k <= 125; k += 25) { g.beginPath(); g.moveTo(x0 - 7, Y(k)); g.lineTo(x0, Y(k)); g.stroke(); g.fillText(String(k), x0 - 11, Y(k)); }
    g.restore();
    label(g, 'Concentration (× 10⁻⁴ mol/L)', x0 + w / 2, y0 + 48, { size: 16, weight: '700' });
    g.save(); g.translate(x0 - 62, y0 - h / 2); g.rotate(-Math.PI / 2); label(g, 'Conductivity (µS/cm)', 0, 0, { size: 16 }); g.restore();

    // which solution is under the probe: standard i (2.0 s each from 0.4 s), then the saturated sample from 9.6 s
    const SAMPLE_T = 9.6, sampleOn = t >= SAMPLE_T, EACH = 2.0;
    const si = sampleOn ? -1 : Math.max(0, Math.min(3, Math.floor((t - 0.4) / EACH)));
    const st0 = sampleOn ? SAMPLE_T : 0.4 + si * EACH;
    const target = sampleOn ? 56 : STANDARDS[si][1], nMg = sampleOn ? 2 : si + 1;
    // the meter on top, the probe in a small beaker under it, that solution's ions drifting (more ions, more current)
    const mx = 40, my = 34, mw = 190, mh = 84;
    const G = Draw.beakerGeom({ x: 60, y: 214, w: 150, h: 150 }, { level: 0.72, tilt: 0.2 });
    Draw.beakerBack(g, G, { level: 0.72 });
    const inB = beakerPlace(G, 10);
    drawSprites(g, swarm(repeat('Mg2+', nMg).concat(repeat('OH-', 2 * nMg)), sampleOn ? 41 : 30 + si).map(p => Object.assign(inB(at(p, t)), { info: p.info, a: phase(t, st0 + 0.45, st0 + 1.0) })), 10);
    Draw.beakerSurface(g, G);
    const px = G.cx + 22, pTop = G.topY - 44;
    g.save(); g.fillStyle = '#9aa6b8'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.roundRect(px - 6, pTop, 12, G.botY - G.topY + 24, 5); g.fill(); g.stroke(); g.restore();
    Draw.beakerFront(g, G, { spout: false, grads: [] });
    if (t >= 0.4) standardDropper(g, G.cx - 28, G.topY - 8, G.surfY, t - st0);
    g.save(); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, pTop);
    g.bezierCurveTo(px, pTop - 30, mx + mw - 30, my + mh + 30, mx + mw - 30, my + mh); g.stroke(); g.restore();
    g.save(); g.fillStyle = '#e6eaf1'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(mx, my, mw, mh, 10); g.fill(); g.stroke();
    g.fillStyle = '#20293a'; g.beginPath(); g.roundRect(mx + 14, my + 12, mw - 28, 40, 6); g.fill();
    g.fillStyle = '#8ff0c4'; g.font = '700 23px Space Mono, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText((t < 0.4 ? 0 : target * phase(t, st0 + 0.6, st0 + 1.3)).toFixed(1), mx + mw / 2, my + 33); g.restore();
    label(g, 'µS/cm', mx + mw / 2, my + 68, { size: 13, mono: true, weight: '400', color: DIM });
    // what is going in, and its molarity, under the beaker as it is dropped in (the sample's is what we want to find)
    const shown = t >= 0.4 ? phase(t, st0, st0 + 0.3) : 0;
    label(g, sampleOn ? 'saturated Mg(OH)₂' : 'standard ' + (si + 1), G.cx, G.botY + 26, { size: 14, mono: true, weight: '400', color: DIM, alpha: shown });
    label(g, sampleOn ? '? mol/L' : STANDARDS[si][0].toFixed(2) + ' × 10⁻⁴ mol/L', G.cx, G.botY + 50, { size: 16, mono: true, weight: '700', alpha: shown });

    // standards pop onto the graph as each is measured, then the line through them
    STANDARDS.forEach((p, i) => {
      const k = phase(t, 0.4 + i * EACH + 1.4, 0.4 + i * EACH + 1.7);
      if (k <= 0) return;
      g.save(); g.fillStyle = '#ffffff'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.arc(X(p[0]), Y(p[1]), 8 * k, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
    });
    const ln = phase(t, 8.4, 9.3);
    if (ln > 0) { g.save(); g.strokeStyle = ACCENT; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(2.4 * ln), Y(120 * ln)); g.stroke(); g.restore(); }
    label(g, 'standards', X(2.0) + 14, Y(100.5) + 30, { size: 14, mono: true, weight: '400', color: DIM, align: 'left', alpha: phase(t, 7.6, 8.1) });
    mark(g, X(0.32), Y(110), X(2.2) - X(0.32), Y(14) - Y(110), marks.has('standards'));
    // the sample's reading: across from the axis to the line, then down to the concentration
    const k = 56, c = 1.12, across = phase(t, 11.1, 12.2), down = phase(t, 12.4, 13.3);
    if (across > 0) {
      const xr = lerp(x0, X(c), across), yr = lerp(Y(k), y0, down);
      g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([6, 5]);
      g.beginPath(); g.moveTo(x0, Y(k)); g.lineTo(xr, Y(k)); if (down > 0) g.lineTo(X(c), yr); g.stroke(); g.restore();
      g.save(); g.fillStyle = '#ffd257'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.arc(xr, Y(k), 9, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
    }
    // below the line, to the right of the point (clear of the line, the dashes and the standards)
    label(g, 'saturated Mg(OH)₂: 56 µS/cm', X(c) + 22, Y(k) + 30, { size: 15, mono: true, align: 'left', alpha: phase(t, 11.8, 12.3) });
    label(g, '1.12', X(c) + 10, y0 - 18, { size: 15, mono: true, align: 'left', alpha: phase(t, 13.1, 13.5) });
    mark(g, X(c) - 24, Y(k) - 22, 300, 70, marks.has('reading'));
    mark(g, X(c) - 14, y0 - 38, 70, 42, marks.has('conc'));
  }

  // ---------- 1.4 Strategy 3: a pH probe (a preview of next unit) ----------
  // A pH probe sits in neutral water (pH 7.000). A spatula adds Mg(OH)₂ a scoop at a time, 3 s apart. In the
  // beaker each scoop sits on the floor and shrinks as it dissolves; the pH climbs on a graph of pH against time.
  // During the third scoop the water is saturated: later scoops stay on the floor and the pH levels off at
  // 10.350. Below the beaker, the molecular view: ions leave the solid's surface while it dissolves, then leave
  // and rejoin it at the same rate once it is saturated.
  const PH_ADD = [1.5, 4.5, 7.5, 10.5, 13.5], PH_SAT = 10.35, PH_END = 17, PH_SCOOP = 0.42;
  function phAt(t) {
    let f = 0, added = 0;
    PH_ADD.forEach(ta => { f += PH_SCOOP * ease(phase(t, ta + 0.8, ta + 3.2)); added += PH_SCOOP * phase(t, ta + 0.4, ta + 0.9); });
    const oh = 2.24e-4 * Math.min(1, f);
    return { f, added, undissolved: Math.max(0, added - Math.min(1, f)), pH: Math.min(PH_SAT, 14 + Math.log10(1e-7 + oh)) };
  }
  // when each formula unit in the molecular view comes off the solid (4 units: 4 Mg²⁺, 8 OH⁻), and when it saturates
  const PH_N = 4, PH_REL = [], PH_SAT_T = (() => {
    let tSat = PH_END;
    for (let t = 0, u = 0; t <= PH_END; t += 0.02) {
      const f = phAt(t).f;
      while (u < PH_N && f >= (u + 0.6) / PH_N) PH_REL[u++] = t;
      if (f >= 1 && tSat === PH_END) tSat = t;
    }
    return tSat;
  })();
  function labPH(g, marks, t) {
    t = t == null ? 1e4 : Math.min(t, PH_END);
    const now = phAt(t), D = global.SolData;
    // ---- the meter, the beaker (solid only) and the probe ----
    const mx = 26, my = 16, mw = 180, mh = 80;
    const G = Draw.beakerGeom({ x: 46, y: 132, w: 152, h: 146 }, { level: 0.72, tilt: 0.2 });
    Draw.beakerBack(g, G, { level: 0.72 });
    const heap = now.undissolved;
    if (heap > 0.01 && D) Draw.pile(g, G, Math.min(1, heap / 1.1) * 0.32, D.SALTS.MgOH2, { cat: ionInfo('Mg2+'), an: ionInfo('OH-') }, '#f4f4f0');
    Draw.beakerSurface(g, G);
    const px = G.cx + 42, pTop = G.topY - 40;
    g.save(); g.fillStyle = 'rgba(236,243,250,0.95)'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.roundRect(px - 7, pTop, 14, G.botY - G.topY, 6); g.fill(); g.stroke();
    g.beginPath(); g.arc(px, G.botY - G.topY + pTop, 9, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#9aa6b8'; g.fillRect(px - 7, pTop, 14, 20); g.strokeRect(px - 7, pTop, 14, 20); g.restore();
    Draw.beakerFront(g, G, { spout: false, grads: [] });
    g.save(); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, pTop);
    g.bezierCurveTo(px, pTop - 26, mx + mw - 26, my + mh + 26, mx + mw - 26, my + mh); g.stroke(); g.restore();
    g.save(); g.fillStyle = '#e6eaf1'; g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(mx, my, mw, mh, 10); g.fill(); g.stroke();
    g.fillStyle = '#20293a'; g.beginPath(); g.roundRect(mx + 12, my + 10, mw - 24, 40, 6); g.fill();
    g.fillStyle = '#8ff0c4'; g.font = '700 23px Space Mono, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(now.pH.toFixed(3), mx + mw / 2, my + 31); g.restore();
    label(g, 'pH meter', mx + mw / 2, my + 65, { size: 13, mono: true, weight: '400', color: DIM });
    // the spatula tips a scoop in, the grains fall to the floor
    PH_ADD.forEach((ta, j) => {
      const k = t - ta;
      if (k < -0.4 || k > 1.6) return;
      const a = phase(k, -0.4, 0) * (1 - phase(k, 1.2, 1.6)), tip = phase(k, 0, 0.45) * (1 - phase(k, 1.0, 1.3));
      const sx = G.cx - 24, sy = G.topY - 26;
      g.save(); g.globalAlpha = a; g.translate(sx, sy); g.rotate(-0.15 - 0.45 * tip);
      g.fillStyle = '#c9d1dc'; g.strokeStyle = INK; g.lineWidth = 2;
      g.beginPath(); g.roundRect(-100, -4, 72, 8, 3); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(-10, 0, 19, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      if (k < 0.6) { g.fillStyle = '#f4f4f0'; g.beginPath(); g.ellipse(-8, -4, 12 * (1 - phase(k, 0.2, 0.6)), 5, 0, Math.PI, 0); g.fill(); g.stroke(); }
      g.restore();
      for (let i = 0; i < 6; i++) {
        const d = clamp01((k - 0.25 - i * 0.06) / 0.6);
        if (d > 0 && d < 1) crystal(g, sx - 4 + (i % 3) * 5, lerp(sy + 4, G.botY - 6, d * d), 4.5, '#f4f4f0', i + j);
      }
    });
    mark(g, mx - 8, my - 8, mw + 16, mh + 16, marks.has('ph'));

    // ---- the molecular view of the floor of the beaker ----
    const W = { x: 126, y: 398, r: 106 }, R = 12, step = 2 * R * 0.92;
    const rowY = k => W.y + W.r - R - 4 - k * step;
    const KEYS = ['Mg2+', 'OH-', 'OH-'];
    const slots = k => { const y = rowY(k), n = Math.max(1, Math.floor((2 * chord(W, y, 3)) / (2 * R))), out = [];
      for (let i = 0; i < n; i++) out.push({ x: W.x + (i - (n - 1) / 2) * 2 * R, y, key: KEYS[(i + k) % 3] }); return out; };
    const solidA = clamp01(heap * 5) || (now.f >= 1 ? 1 : 0);
    lensOpen(g, W);
    const sprites = [];
    if (solidA > 0) [0, 1].forEach(k => slots(k).forEach(sl => sprites.push({ x: sl.x, y: sl.y, z: 1, info: ionInfo(sl.key), solidColour: '#f4f4f0', solid: 1, a: solidA })));
    const top = slots(2).concat(slots(1)), place = inLens(W, W.y - W.r * 0.82, rowY(2) - R - 6, R, { top: true });
    const ions = []; for (let u = 0; u < PH_N; u++) ions.push('Mg2+', 'OH-', 'OH-');
    swarm(ions, 71).forEach((p, j) => {
      const u = Math.floor(j / 3), rel = PH_REL[u];
      if (rel == null || t < rel) return;
      const q = at(p, t), free = place(q), src = top[(j * 5) % top.length];
      let k = phase(t, rel, rel + 1.4), x = lerp(src.x, free.x, ease(k)), y = lerp(src.y, free.y, ease(k)), solid = 1 - phase(t, rel, rel + 0.4);
      // saturated: one ion at a time goes back to the surface and another leaves it, at the same rate
      if (t > PH_SAT_T + 1) {
        const c = Math.floor((t - PH_SAT_T - 1) / 2.4), cyc = (t - PH_SAT_T - 1) % 2.4, who = (c * 4) % (3 * PH_N);
        if (j === who) {
          const land = top[(c * 7) % top.length], leave = top[(c * 7 + 5) % top.length];
          if (cyc < 1.0) { const e = ease(cyc / 1.0); x = lerp(free.x, land.x, e); y = lerp(free.y, land.y - 2, e); solid = phase(cyc, 0.8, 1.0); }
          else if (cyc < 1.3) { x = land.x; y = land.y; solid = 1; }
          else { const e = ease(clamp01((cyc - 1.3) / 1.0)); x = lerp(leave.x, free.x, e); y = lerp(leave.y, free.y, e); solid = 1 - phase(cyc, 1.3, 1.6); }
        }
      }
      sprites.push({ x, y, z: 1, info: p.info, solidColour: '#f4f4f0', solid });
    });
    drawSprites(g, sprites, R);
    lensClose(g, W, [G.cx - 18, G.botY - 4]);
    mark(g, W.x - W.r - 8, W.y - W.r - 8, 2 * W.r + 16, 2 * W.r + 16, marks.has('an') || marks.has('cat'));

    // ---- pH against time ----
    const x0 = 370, y0 = 440, w = 490, h = 350, tMax = PH_END, lo = 6.5, hi = 11;
    const X = s2 => x0 + w * s2 / tMax, Y = v => y0 - h * (v - lo) / (hi - lo);
    g.save(); g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, y0 - h - 10); g.lineTo(x0, y0); g.lineTo(x0 + w + 10, y0); g.stroke();
    g.font = '400 14px Space Mono, monospace'; g.fillStyle = DIM; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = 7; v <= 11; v++) { g.beginPath(); g.moveTo(x0 - 7, Y(v)); g.lineTo(x0, Y(v)); g.stroke(); g.fillText(String(v), x0 - 11, Y(v)); }
    g.restore();
    label(g, 'Time', x0 + w / 2, y0 + 26, { size: 16, weight: '700' });
    g.save(); g.translate(x0 - 46, y0 - h / 2); g.rotate(-Math.PI / 2); label(g, 'pH', 0, 0, { size: 16 }); g.restore();
    g.save(); g.strokeStyle = ACCENT; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
    const tEnd = Math.min(t, tMax);
    for (let s2 = 0; s2 <= tEnd + 1e-6; s2 += 0.05) { const v = phAt(s2).pH; s2 === 0 ? g.moveTo(X(s2), Y(v)) : g.lineTo(X(s2), Y(v)); }
    g.stroke();
    if (t > 0) { g.fillStyle = ACCENT; g.beginPath(); g.arc(X(tEnd), Y(now.pH), 5, 0, Math.PI * 2); g.fill(); }
    g.restore();
    PH_ADD.forEach(ta => { if (t >= ta) { g.save(); g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(ta), y0); g.lineTo(X(ta), y0 - 10); g.stroke(); g.restore(); } });
    label(g, 'a scoop added', X(PH_ADD[0]) + 6, y0 - 18, { size: 12, mono: true, weight: '400', color: DIM, align: 'left', alpha: phase(t, 1.5, 2.0) });
    label(g, 'neutral water: pH 7.000', X(0.2), Y(7) - 18, { size: 13, mono: true, weight: '400', color: DIM, align: 'left', alpha: 1 - phase(t, 1.8, 2.4) });
    const sat = phase(t, 12.8, 13.6);
    if (sat > 0) {
      g.save(); g.globalAlpha = sat; g.strokeStyle = INK; g.lineWidth = 1.5; g.setLineDash([6, 5]);
      g.beginPath(); g.moveTo(x0, Y(PH_SAT)); g.lineTo(x0 + w, Y(PH_SAT)); g.stroke(); g.restore();
    }
    label(g, 'pH stops rising: saturated', X(7.2), Y(PH_SAT) - 24, { size: 15, mono: true, align: 'left', alpha: sat });
    label(g, 'pH 10.350', X(12.2), Y(PH_SAT) + 22, { size: 15, mono: true, weight: '700', align: 'left', alpha: sat });
    mark(g, X(6.9), Y(PH_SAT) - 46, X(tMax) - X(6.9) + 8, 92, marks.has('ph'));
  }

  // ---------- Part 2 · two solutions poured into one beaker ----------
  // parts: [{ vol (L), conc (M), name, reagent }], tPour: 0 (not poured) … 1 (poured). The mixed beaker itself
  // is drawn by SolScene once the pour ends; until then (o.mixed) it is drawn here, empty, then filling.
  // The pour (user, 2026-11-19: "less janky"): each beaker lifts, tips from its spout over the mixed beaker
  // (the left one pours right, the right one pours left, so the streams never cross), the liquid stays level
  // while it drains, then the empty beaker goes back to the bench.
  // time + saltId: the ions drift in each beaker and ride the streams across.
  // o: { mixed (draw the mixed beaker), counts: [{ ionKey: n }, …] per part (default: 4 of the salt's ion),
  //      landed (0 … 1: the salt's ions still drawn in the mixed beaker after the pour; fades as the solid forms) }
  const SRC = [{ x: 24, y: 72, w: 124, h: 148 }, { x: 192, y: 72, w: 124, h: 148 }];
  const MIXED = { x: 70, y: 255, w: 230, h: 255 };
  const MIX_R = 8;
  const POUR = { move: [0, 0.26], tip: [0.1, 0.32], drain: [0.3, 0.8], back: [0.84, 1] };
  const mixLevel = (tPour, total) => phase(tPour, POUR.drain[0], POUR.drain[1]) * (total || 0.100) / 0.150; // total: litres after mixing
  // polygon helpers for the level liquid in a tipped beaker
  function polyBelow(poly, s) { // the part of a convex polygon with y ≥ s
    const out = [];
    poly.forEach((p, i) => {
      const q = poly[(i + 1) % poly.length], pin = p[1] >= s, qin = q[1] >= s;
      if (pin) out.push(p);
      if (pin !== qin) { const k = (s - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * k, s]); }
    });
    return out;
  }
  const polyArea = P => Math.abs(P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  function chordAt(poly, y) { // where a level line crosses a convex polygon
    const xs = [];
    poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1])); });
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  }
  function mixSources(g, parts, tPour, marks, time, saltId, o) {
    o = o || {};
    const D = global.SolData, salt = saltId && D && D.SALTS[saltId];
    const T = time == null ? 0 : time;
    const drain = phase(tPour, POUR.drain[0], POUR.drain[1]);
    const total = parts.reduce((v, p) => v + p.vol, 0);
    const GM = Draw.beakerGeom(MIXED, { level: Math.max(0.001, mixLevel(tPour, total)), tilt: 0.2 });
    const inM = beakerPlace(GM, MIX_R);
    const inMixed = [], air = [], streams = [], beakers = [];
    const keep = salt ? [salt.cat[0], salt.an[0]] : [];
    parts.forEach((p, i) => {
      const box = SRC[i], dir = i ? -1 : 1;                       // the left beaker pours to the right
      const L0 = Math.min(0.85, (p.vol / 0.100) * 0.8);
      const G = Draw.beakerGeom(box, { level: L0, tilt: 0.2 });
      const out = Math.max(10, G.rx * 0.11);
      const lipHome = [G.cx + dir * (G.rx + out), G.topY - G.ry * 0.12];
      // the pose: the spout travels to just above the mixed beaker, the beaker tips about it
      const go = phase(tPour, POUR.move[0], POUR.move[1]) * (1 - phase(tPour, POUR.back[0], POUR.back[1]));
      const target = [GM.cx - dir * 26, GM.topY - 40];
      const lip = [lerp(lipHome[0], target[0], go), lerp(lipHome[1], target[1], go)];
      const sz = 1 - 0.24 * go;                                   // a little smaller while lifted, so the tipped glass stays on the stage
      const ang = (1.2 * phase(tPour, POUR.tip[0], POUR.tip[1]) + 0.75 * drain) * (1 - phase(tPour, POUR.back[0], POUR.back[1] - 0.06));
      const c = Math.cos(dir * ang), s = Math.sin(dir * ang);
      const toWorld = (x, y) => { const dx = (x - lipHome[0]) * sz, dy = (y - lipHome[1]) * sz; return [lip[0] + dx * c - dy * s, lip[1] + dx * s + dy * c]; };
      // the liquid: the same cross-section area as at rest, less what has drained, under a level surface
      const inner = [[G.cx - G.rx + 3, G.topY], [G.cx + G.rx - 3, G.topY], [G.cx + G.rx - 3, G.botY], [G.cx - G.rx + 3, G.botY]].map(q => toWorld(q[0], q[1]));
      const want = (G.botY - G.surfY) * (2 * G.rx - 6) * (1 - drain) * sz * sz;
      let lo = Math.min(...inner.map(q => q[1])), hi = Math.max(...inner.map(q => q[1]));
      for (let k = 0; k < 28; k++) { const mid = (lo + hi) / 2; if (polyArea(polyBelow(inner, mid)) > want) lo = mid; else hi = mid; }
      const surf = want > 1 ? (lo + hi) / 2 : Infinity, bottom = Math.max(...inner.map(q => q[1]));
      // ions: placed in the liquid as it sits now (a level line across the tipped glass)
      const place = q => {
        if (!isFinite(surf)) return { x: lip[0], y: lip[1], z: q.z };
        const y = surf + MIX_R + 3 + q.v * Math.max(0, bottom - surf - 2 * MIX_R - 6) * (ang < 0.05 ? 1 : 0.7);
        const ch = chordAt(inner, Math.min(y, bottom - 1)) || [lip[0], lip[0]];
        return { x: lerp(ch[0] + MIX_R + 4, ch[1] - MIX_R - 4, q.u), y: y - (ang < 0.05 ? (1 - q.z) * G.ry * 0.7 : 0), z: q.z };
      };
      const counts = (o.counts && o.counts[i]) || null;
      let keys = [];
      if (counts) Object.keys(counts).forEach(k => { keys = keys.concat(repeat(k, counts[k])); });
      else if (salt && p.reagent && D.REAGENTS[p.reagent]) {
        const own = D.REAGENTS[p.reagent].ions.map(x => x[0]).filter(k => keep.includes(k));
        keys = own.length ? repeat(own[0], 4) : [];
      }
      const end = [target[0] + dir * 8, GM.surfY];
      const ctrl = [lip[0] + dir * 16, lip[1] + 18];
      const inBeaker = [];
      swarm(keys, 60 + i * 7).forEach((sp, j) => {
        const q = at(sp, T), spect = !keep.includes(keys[j]);
        const start = POUR.drain[0] + 0.02 + 0.4 * j / Math.max(1, keys.length), k = clamp01((tPour - start) / 0.17);
        const fade = spect ? 1 - phase(tPour, 0.86, 1) : 1;            // spectators are left out of the mixed beaker's picture
        if (k <= 0) { inBeaker.push(Object.assign(place(q), { info: sp.info })); return; }
        const m = inM(q);
        if (k >= 1) { inMixed.push(Object.assign(m, { info: sp.info, a: spect ? fade : 1, salt: !spect })); return; }
        const a = place(q);
        let xy, z = 1;
        if (k < 0.3) { const u = k / 0.3; xy = [lerp(a.x, lip[0], u), lerp(a.y, lip[1], u)]; z = lerp(a.z, 1, u); }
        else if (k < 0.8) xy = quad(lip, ctrl, end, (k - 0.3) / 0.5);
        else { const u = (k - 0.8) / 0.2; xy = [lerp(end[0], m.x, u), lerp(end[1], m.y, u)]; z = lerp(1, m.z, u); }
        air.push({ x: xy[0], y: xy[1], z, info: sp.info });
      });
      if (drain > 0.01 && drain < 0.99) streams.push({ pts: [lip, ctrl, end], w: 2.5 + 4.5 * Math.sqrt(Math.sin(Math.PI * drain)) });
      beakers.push({ G, dir, lipHome, lip, ang, sz, inner, surf, inBeaker, box, p });
    });

    // the mixed beaker (until SolScene takes over), with the ions that have landed
    if (o.mixed) {
      const lvl = Math.max(0.001, mixLevel(tPour, total));
      Draw.beakerBack(g, GM, { level: lvl });
      drawSprites(g, inMixed, MIX_R);
      Draw.beakerSurface(g, GM);
      Draw.beakerFront(g, GM, { grads: [25, 50, 75, 100, 125].map(v => ({ f: v / 150, major: v % 50 === 0, label: v % 50 === 0 ? v + ' mL' : '' })) });
    } else if (o.landed > 0) drawSprites(g, inMixed.filter(s => s.salt).map(s => Object.assign(s, { a: o.landed })), MIX_R);

    // the two beakers, at rest or tipped over the mixed one
    beakers.forEach(b => {
      const { G, dir, lipHome, lip, ang } = b, tipped = ang > 0.004 || Math.hypot(lip[0] - lipHome[0], lip[1] - lipHome[1]) > 0.5;
      const frame = () => { g.translate(lip[0], lip[1]); g.rotate(dir * ang); g.scale(b.sz, b.sz); g.translate(-lipHome[0], -lipHome[1]); if (dir > 0) { g.translate(G.cx, 0); g.scale(-1, 1); g.translate(-G.cx, 0); } };
      g.save(); frame(); Draw.beakerBack(g, G, { liquid: false, shadow: !tipped }); g.restore();
      if (isFinite(b.surf)) { // level liquid, clipped to the glass
        const base = g.getTransform();
        g.save(); frame();
        g.beginPath(); g.moveTo(G.cx - G.rx + 2, G.topY); g.lineTo(G.cx + G.rx - 2, G.topY); g.lineTo(G.cx + G.rx - 2, G.botY);
        g.ellipse(G.cx, G.botY, G.rx - 2, G.ry - 1, 0, 0, Math.PI); g.closePath(); g.clip();
        g.setTransform(base);
        const ch = chordAt(b.inner, b.surf) || [G.cx - G.rx, G.cx + G.rx];
        const ry = Math.max(1.5, (ch[1] - ch[0]) / 2 * 0.2 * Math.max(0, 1 - ang / 1.3));
        const lg = g.createLinearGradient(0, b.surf, 0, b.surf + 160);
        lg.addColorStop(0, WATER); lg.addColorStop(1, '#d5e7f5');
        g.globalAlpha = 0.85; g.fillStyle = lg;
        g.beginPath(); g.ellipse((ch[0] + ch[1]) / 2, b.surf, (ch[1] - ch[0]) / 2, ry, 0, Math.PI, 0, false); g.lineTo(ch[1] + 400, b.surf + 400); g.lineTo(ch[0] - 400, b.surf + 400); g.closePath(); g.fill();
        g.globalAlpha = 1;
        drawSprites(g, b.inBeaker, MIX_R);
        g.beginPath(); g.ellipse((ch[0] + ch[1]) / 2, b.surf, (ch[1] - ch[0]) / 2, ry, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); g.strokeStyle = WATER_LINE; g.lineWidth = 1.6; g.stroke();
        g.restore();
      }
      g.save(); frame(); Draw.beakerFront(g, G, { grads: [] }); g.restore();
      label(g, (b.p.vol * 1000).toFixed(1) + ' mL', b.box.x + b.box.w / 2, 22, { size: 16, mono: true });
      label(g, b.p.name, b.box.x + b.box.w / 2, 44, { size: 15, mono: true, weight: '400' });
    });
    streams.forEach(st => stream(g, st.pts, T, st.w));
    drawSprites(g, air, MIX_R);
    if (tPour <= 0) label(g, '+', 170, 150, { size: 30 });
    mark(g, 12, 4, 316, 246, marks && marks.has('sources'));
  }
  function mixedEmpty(g, level) {
    const G = Draw.beakerGeom(MIXED, { level: Math.max(0.001, level), tilt: 0.2 });
    Draw.beakerBack(g, G, { level: Math.max(0.001, level) }); Draw.beakerSurface(g, G);
    Draw.beakerFront(g, G, { grads: [25, 50, 75, 100, 125].map(v => ({ f: v / 150, major: v % 50 === 0, label: v % 50 === 0 ? v + ' mL' : '' })) });
  }

  // ---------- one test tube (Part 2 evidence, Part 4, the Qual Lab) ----------
  // o: { level 0..1, tint (liquid colour), solid: { colour, mg, packed }, cloud: { colour, t 0..1 (0 = just formed, 1 = settled) },
  //      haze (0..1, fine specks that never settle), drop: { t 0..1, label } (a dropper above), tilt (radians, pouring), seed,
  //      t (seconds: haze specks drift with it) }
  function tube(g, cx, top, w, h, o) {
    o = o || {};
    const r = w / 2, level = o.level == null ? 0.8 : o.level, liqTop = top + h * (1 - level), T = o.t || 0;
    g.save();
    if (o.tilt) { g.translate(cx, top); g.rotate(o.tilt); g.translate(-cx, -top); }
    const path = () => { g.beginPath(); g.moveTo(cx - r, top); g.lineTo(cx - r, top + h - r); g.arc(cx, top + h - r, r, Math.PI, 0, true); g.lineTo(cx + r, top); };
    // shadow, then the glass behind the liquid
    if (!o.tilt) {
      const sh = g.createRadialGradient(cx, top + h + 6, 0, cx, top + h + 6, w);
      sh.addColorStop(0, 'rgba(29,36,51,0.18)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
      g.fillStyle = sh; g.beginPath(); g.ellipse(cx, top + h + 6, w, 8, 0, 0, Math.PI * 2); g.fill();
    }
    path(); const gb = g.createLinearGradient(cx - r, 0, cx + r, 0);
    gb.addColorStop(0, 'rgba(214,224,238,0.6)'); gb.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gb.addColorStop(1, 'rgba(206,218,234,0.65)');
    g.fillStyle = gb; g.fill();
    path(); g.save(); g.clip();
    if (level > 0) {
      const lg = g.createLinearGradient(0, liqTop, 0, top + h);
      lg.addColorStop(0, o.tint || '#e3f1fb'); lg.addColorStop(1, o.tint ? o.tint : '#cfe5f6');
      g.fillStyle = lg;
      if (o.tilt) { // keep the surface level while the tube tips
        g.save(); g.translate(cx, top); g.rotate(-o.tilt); g.translate(-cx, -top);
        g.fillRect(cx - h * 1.5, top + h * Math.cos(o.tilt) * (1 - level), h * 3, h * 2); g.restore(); // a tipped column is shorter
      } else g.fillRect(cx - r - 2, liqTop, w + 4, h);
      if (!o.tilt) {
        g.beginPath(); g.ellipse(cx, liqTop, r, Math.max(2, r * 0.18), 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(); g.strokeStyle = 'rgba(127,179,217,0.9)'; g.lineWidth = 2; g.stroke();
      }
    }
    const pileH = mg => Math.min(h * 0.32, 8 + 0.075 * h * Math.log10(1 + mg));
    const pile = (colour, ph) => {
      g.fillStyle = colour; g.strokeStyle = INK; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(cx - r, top + h - ph); g.quadraticCurveTo(cx, top + h - ph - Math.min(10, ph * 0.4), cx + r, top + h - ph);
      g.lineTo(cx + r, top + h); g.lineTo(cx - r, top + h); g.closePath(); g.fill(); g.stroke();
      // a few grains so it reads as a solid, not a coloured liquid
      g.fillStyle = 'rgba(29,36,51,0.18)';
      scatter(Math.round(ph / 2), 5).forEach(p => { g.beginPath(); g.arc(cx - r + 4 + p[0] * (w - 8), top + h - ph + 6 + p[1] * (ph - 8), 1.2, 0, Math.PI * 2); g.fill(); });
    };
    if (o.solid && o.solid.mg > 0) pile(o.solid.colour, pileH(o.solid.mg) * (o.solid.packed ? 0.7 : 1));
    if (o.solid2 && o.solid2.mg > 0) { g.save(); g.translate(0, -pileH(o.solid.mg) + 2); pile(o.solid2.colour, pileH(o.solid2.mg) * 0.8); g.restore(); }
    if (o.cloud && o.cloud.mg > 0) {
      // specks spread through the liquid fall and pack into a pile as t goes 0 → 1
      const t = Math.max(0, Math.min(1, o.cloud.t)), ph = pileH(o.cloud.mg) * t;
      if (ph > 1) pile(o.cloud.colour, ph);
      const pts = scatter(110, o.seed || 13);
      g.fillStyle = o.cloud.colour; g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 0.8;
      pts.forEach((p, i) => {
        if (i / pts.length < t) return;               // already settled into the pile
        const y0 = liqTop + 8 + p[1] * (h * level - 30), y = y0 + (top + h - 12 - y0) * t * t;
        g.beginPath(); g.arc(cx - r + 6 + p[0] * (w - 12) + Math.sin(T * 1.7 + i) * 1.5, y, 2.6, 0, Math.PI * 2); g.fill(); g.stroke();
      });
    }
    if (o.haze > 0) {
      g.fillStyle = o.hazeColour || '#f2c94c'; g.globalAlpha = Math.min(0.9, 0.25 + o.haze);
      scatter(140, (o.seed || 31)).forEach((p, i) => {
        g.beginPath(); g.arc(cx - r + 6 + p[0] * (w - 12) + Math.sin(T * 0.8 + i * 1.7) * 3, liqTop + 8 + p[1] * (h * level - 30) + Math.cos(T * 0.6 + i) * 4, 1.6, 0, Math.PI * 2); g.fill();
      });
      g.globalAlpha = 1;
    }
    g.restore();
    // front glass: edge shading, highlight, outline, lip
    path(); g.save(); g.clip();
    const eg = g.createLinearGradient(cx - r, 0, cx + r, 0);
    eg.addColorStop(0, 'rgba(29,36,51,0.12)'); eg.addColorStop(0.15, 'rgba(29,36,51,0)'); eg.addColorStop(0.85, 'rgba(29,36,51,0)'); eg.addColorStop(1, 'rgba(29,36,51,0.14)');
    g.fillStyle = eg; g.fillRect(cx - r, top, w, h); g.restore();
    path(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - r + 9, top + 24); g.lineTo(cx - r + 9, top + h - r - 8); g.stroke();
    g.beginPath(); g.ellipse(cx, top, r + 7, 4, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(240,245,251,0.95)'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); // lip
    g.restore();
    if (o.drop) dropper(g, cx, top - 18, o.drop.t, o.drop.label);
  }
  // a dropper above a tube; a drop falls as t goes 0 → 1
  function dropper(g, cx, bottom, t, text) {
    g.save(); g.strokeStyle = INK; g.lineWidth = 2.5; g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(cx - 6, bottom - 70); g.lineTo(cx - 6, bottom - 14); g.lineTo(cx, bottom); g.lineTo(cx + 6, bottom - 14); g.lineTo(cx + 6, bottom - 70); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#9aa6b8'; g.beginPath(); g.ellipse(cx, bottom - 84, 11, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (t > 0 && t < 1) {
      g.fillStyle = WATER_LINE; g.strokeStyle = '#4f86b0'; g.lineWidth = 1;
      const y = bottom + 6 + t * t * 60;
      g.beginPath(); g.moveTo(cx, y - 7); g.bezierCurveTo(cx + 5, y - 1, cx + 5, y + 5, cx, y + 5); g.bezierCurveTo(cx - 5, y + 5, cx - 5, y - 1, cx, y - 7); g.fill(); g.stroke();
    }
    g.restore();
    if (text) label(g, text, cx + 22, bottom - 74, { size: 16, mono: true, align: 'left' });
  }

  // ---------- Part 2 · evidence: three test tubes ----------
  // tubes: [{ caption, solidMg, colour, haze (0..1) }]. The solid settles and the haze appears as t runs.
  function testTubes(g, tubes, marks, t) {
    t = t == null ? 1e4 : t;
    tubes.forEach((tb, i) => {
      const cx = 165 + i * 285, top = 70, h = 340, settle = phase(t, 0.3, 2.8);
      const o = { level: 0.8, seed: 31 + i, t: isFinite(t) ? t : 0, hazeColour: tb.colour };
      if (tb.solidMg > 0) { if (settle < 1) o.cloud = { colour: tb.colour, mg: tb.solidMg, t: settle }; else o.solid = { colour: tb.colour, mg: tb.solidMg }; }
      if (tb.haze) o.haze = tb.haze * phase(t, 0.3, 1.8);
      tube(g, cx, top, 74, h, o);
      label(g, String(i + 1), cx, top - 30, { size: 24 });
      label(g, tb.caption, cx, top + h + 34, { size: 17, mono: true, alpha: phase(t, 2.4, 3.0) });
      mark(g, cx - 110, top - 52, 220, h + 110, marks && marks.has('tube' + (i + 1)));
    });
  }

  // ---------- 1.3 What do you notice? Three everyday slightly soluble solids, each with a zoom window ----------
  // Each runs on t like the stories: a short build (growth, a crust, a cloud clearing), then it keeps moving.
  const LENS = { x: 690, y: 238, r: 160 }, LR = 17;
  const chord = (W, y, pad) => Math.max(0, Math.sqrt(Math.max(0, W.r * W.r - (y - W.y) * (y - W.y))) - pad);
  // where a free ion sits in a zoom window. The window is a circle cut out of a bigger solution (user, 2026-11-19),
  // so ions drift past its edge and back rather than bouncing off it: they roam a box wider than the circle, and
  // past its top or bottom too where that edge is open water (o.top, o.bottom). lo / hi stay as the limits where the
  // edge is a solid or a surface; o.hiAt(x): a lower limit that changes across the window (a drop's curved surface).
  const inLens = (W, lo, hi, R, o) => q => {
    o = o || {}; const pad = R + 18;
    const x = W.x + (2 * q.u - 1) * (W.r + pad);
    const top = o.top ? W.y - W.r - pad : lo, bot = Math.min(o.bottom ? W.y + W.r + pad : hi, o.hiAt ? o.hiAt(x) : Infinity);
    return { x, y: top + q.v * Math.max(0, bot - top), z: q.z };
  };
  function lensOpen(g, W) { Draw.lensBack(g, W); g.save(); g.beginPath(); g.arc(W.x, W.y, W.r - 1.5, 0, Math.PI * 2); g.clip(); }
  function lensClose(g, W, from) {
    g.restore(); Draw.lensFront(g, W);
    label(g, 'zoomed in, not to scale', W.x, W.y + W.r + 22, { size: 13, mono: true, weight: '400', color: DIM });
    if (from) { // a thin dashed leader from the spot in the picture to the window
      const a = Math.atan2(from[1] - W.y, from[0] - W.x), ex = W.x + W.r * Math.cos(a), ey = W.y + W.r * Math.sin(a);
      g.save(); g.strokeStyle = 'rgba(29,36,51,0.45)'; g.lineWidth = 1.6; g.setLineDash([5, 5]);
      g.beginPath(); g.moveTo(from[0], from[1]); g.lineTo(ex, ey); g.stroke();
      g.setLineDash([]); g.fillStyle = INK; g.beginPath(); g.arc(from[0], from[1], 3.5, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }
  function caption(g, line) {
    if (line) label(g, line, 450, 492, { size: 15, weight: '400', color: DIM });
    label(g, 'What do you notice? What do you wonder?', 450, 517, { size: 16 });
  }
  // ions leave the water and join a solid, one at a time. dir -1: the solid is at the top of the window (a stalactite
  // tip); 1: at the bottom (on a kettle element, above o.base px of metal). Two rows are already there; a third fills.
  function depositLens(g, t, o) {
    const W = LENS, R = LR, d = o.dir, step = 2 * R * 0.92, base = o.base || 0;
    const rowY = k => W.y + d * (W.r - R - 3 - base - k * step);
    const slots = k => { const y = rowY(k), n = Math.max(1, Math.floor((2 * chord(W, y, 4)) / (2 * R))), out = [];
      for (let i = 0; i < n; i++) out.push({ x: W.x + (i - (n - 1) / 2) * 2 * R, y, key: o.keys[(i + k) % 2] }); return out; };
    const grow = slots(2), order = grow.map((_, i) => i).sort((a, b) => Math.abs(a - (grow.length - 1) / 2) - Math.abs(b - (grow.length - 1) / 2));
    const lo = d < 0 ? rowY(2) + R + 8 : W.y - W.r * 0.86, hi = d < 0 ? o.surface - R - 4 : rowY(2) - R - 8;
    // kettle (d > 0): water above the crust, open at the top. Cave (d < 0): water between the hanging solid and the
    // drop's curved surface, so the lower limit follows that curve across the window
    const surfAt = x => { const u = clamp01((x - (W.x - W.r)) / (2 * W.r)); return o.surface - 34 + 144 * u * (1 - u); };
    const place = inLens(W, lo, hi, R, d > 0 ? { top: true } : { hiAt: x => surfAt(x) - R - 4 });
    lensOpen(g, W);
    if (d < 0) { // the drop's surface, with cave air below it
      // the bottom of a hanging drop: it bulges down, so the surface is lowest in the middle
      const sY = o.surface, edge = () => { g.moveTo(W.x - W.r, sY - 34); g.quadraticCurveTo(W.x, sY + 38, W.x + W.r, sY - 34); };
      g.fillStyle = 'rgba(244,246,249,0.97)'; g.beginPath(); edge(); g.lineTo(W.x + W.r, W.y + W.r); g.lineTo(W.x - W.r, W.y + W.r); g.closePath(); g.fill();
      g.strokeStyle = WATER_LINE; g.lineWidth = 2.5; g.beginPath(); edge(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W.x - 50, sY + 9); g.quadraticCurveTo(W.x - 20, sY + 15, W.x + 10, sY + 15); g.stroke();
      label(g, 'air', W.x, W.y + W.r - 26, { size: 13, mono: true, weight: '400', color: DIM });
    }
    if (base) { // the heating element
      const mg = g.createLinearGradient(0, W.y + W.r - base, 0, W.y + W.r);
      mg.addColorStop(0, '#9aa4b2'); mg.addColorStop(1, '#5d6676');
      g.fillStyle = mg; g.fillRect(W.x - W.r, W.y + W.r - base, 2 * W.r, base);
      g.fillStyle = `rgba(240,96,40,${0.35 + 0.15 * Math.sin(t * 3)})`; g.fillRect(W.x - W.r, W.y + W.r - base * 0.45, 2 * W.r, base * 0.45);
    }
    const sprites = [];
    [0, 1].forEach(k => slots(k).forEach(sl => sprites.push({ x: sl.x, y: sl.y, z: 1, info: ionInfo(sl.key), solidColour: o.colour, solid: 1 })));
    const sw = swarm(order.map(i => grow[i].key).concat(o.extra), o.seed || 13);
    sw.forEach((p, j) => {
      const q = at(p, t), free = place(q);
      if (j >= order.length) return sprites.push(Object.assign(free, { info: p.info }));
      const sl = grow[order[j]], J = o.t0 + j * o.gap, k = phase(t, J - 0.9, J);
      sprites.push({ x: lerp(free.x, sl.x, k), y: lerp(free.y, sl.y, k), z: lerp(q.z, 1, k), info: p.info, solidColour: o.colour, solid: phase(t, J - 0.15, J + 0.4) });
    });
    if (o.bubbles === 'co2') for (let m = 0; m < 3; m++) { // CO₂ leaves the drop through its surface
      const s = ((t / 2.8 + m / 3) % 1), x0 = W.x + [-60, 35, 85][m], y = lerp(lo + 10, o.surface + 58, ease(s));
      Draw.neutral(g, x0 + 10 * Math.sin(t * 1.3 + m), y, 13, 'CO₂', Math.min(1, s * 6) * (1 - phase(s, 0.8, 1)));
    }
    drawSprites(g, sprites, R);
    if (o.bubbles === 'steam') for (let m = 0; m < 5; m++) { // steam bubbles leave the crust and rise
      const s = ((t / 1.5 + m / 5) % 1), x = W.x + [-90, -40, 5, 50, 95][m] + 6 * Math.sin(t * 2 + m), y = lerp(rowY(2) - R, W.y - W.r * 0.95, s), r = 5 + 9 * s;
      g.save(); g.globalAlpha = 1 - phase(s, 0.75, 1); g.fillStyle = 'rgba(255,255,255,0.55)'; g.strokeStyle = 'rgba(95,151,194,0.9)'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
    }
  }
  // ---------- drawing helpers for the everyday scenes ----------
  // a smooth closed outline through points (midpoint quadratics), for rock and mineral shapes
  function smooth(g, pts) {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
    g.beginPath(); const s0 = m(pts[n - 1], pts[0]); g.moveTo(s0[0], s0[1]);
    for (let i = 0; i < n; i++) { const q = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
    g.closePath();
  }
  // a calcite formation hanging from y (dir 1, a stalactite) or standing on y (dir -1, a stalagmite).
  // The outline wobbles and flares into the rock; shading makes it read as a rounded, damp column.
  function formation(g, x, y, len, w, dir, seed, far) {
    const N = 16, L = [], Rt = [], half = (s, ph) => {
      const taper = dir > 0 ? Math.pow(1 - s, 0.8) : 1 - 0.58 * Math.pow(s, 1.25);
      return w / 2 * taper * (1 + 0.09 * Math.sin(s * 10 + seed + ph) + 0.05 * Math.sin(s * 23 + seed * 2 + ph)) * (1 + 0.3 * Math.pow(1 - s, 9));
    };
    for (let k = 0; k <= N; k++) {
      const s = k / N * (dir > 0 ? 0.97 : 0.9), yy = y + dir * (s * len - 8);
      L.push([x - half(s, 0) + Math.sin(s * 4 + seed) * w * 0.04, yy]);
      Rt.unshift([x + half(s, 1.7) + Math.sin(s * 4 + seed) * w * 0.04, yy]);
    }
    const tipY = y + dir * len, pts = L.concat(dir > 0 ? [[x + 1, tipY + 2]] : [[x - w * 0.12, tipY + 4], [x + 1, tipY - 2], [x + w * 0.12, tipY + 4]], Rt);
    g.save();
    smooth(g, pts);
    const sg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    sg.addColorStop(0, far ? '#7d6b58' : '#a88f6f'); sg.addColorStop(0.32, far ? '#b4a088' : '#f2e6d0'); sg.addColorStop(0.5, far ? '#a28d75' : '#e4d3b5');
    sg.addColorStop(0.8, far ? '#7a6753' : '#bba280'); sg.addColorStop(1, far ? '#5e4f40' : '#8a7356');
    g.fillStyle = sg; g.fill();
    g.save(); g.clip();
    const vg = g.createLinearGradient(0, y, 0, y + dir * len); // darker where it meets the rock, paler and wetter toward the end
    vg.addColorStop(0, 'rgba(60,44,30,0.45)'); vg.addColorStop(0.35, 'rgba(60,44,30,0)'); vg.addColorStop(1, 'rgba(255,255,255,0.12)');
    g.fillStyle = vg; g.fillRect(x - w, Math.min(y, tipY) - 10, 2 * w, Math.abs(len) + 20);
    // flowstone ridges running along it, and growth rings across it
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(90,68,45,0.14)';
    [-0.55, -0.15, 0.3, 0.62].forEach(f => { g.beginPath(); for (let k = 0; k <= N; k++) { const s = k / N, yy = y + dir * s * len, xx = x + f * half(s, 0.8); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); });
    // faint, uneven growth bands (calcite builds up in layers)
    g.strokeStyle = 'rgba(120,95,65,0.13)'; g.lineWidth = 2.5;
    for (let k = 1; k < 5; k++) { const s = (k + 0.3 * Math.sin(k * 3 + seed)) / 5, yy = y + dir * s * len, h = half(s, 0); g.beginPath(); g.ellipse(x, yy, h, h * 0.18, 0, 0.3, Math.PI - 0.3); g.stroke(); }
    if (!far) { // a wet highlight down the lit side
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
      for (let k = 2; k <= N - 2; k++) { const s = k / N, yy = y + dir * s * len, xx = x - 0.42 * half(s, 0); k > 2 ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
    }
    g.restore();
    smooth(g, pts); g.strokeStyle = far ? 'rgba(25,18,12,0.5)' : 'rgba(30,22,14,0.85)'; g.lineWidth = far ? 1.4 : 2; g.lineJoin = 'round'; g.stroke();
    g.restore();
    return tipY;
  }
  // the cave roof or floor: a lumpy band of rock, lit from the front
  function caveRock(g, x0, x1, edgeY, farY, seed, amp) {
    const pts = scatter(18, seed), up = farY < edgeY, out = [[x0 - 20, farY], [x0 - 20, edgeY]];
    for (let i = 0; i <= 17; i++) out.push([x0 + (x1 - x0) * i / 17, edgeY + (pts[i][0] - 0.5) * amp + (up ? 1 : -1) * pts[i][1] * amp * 0.4]);
    out.push([x1 + 20, edgeY], [x1 + 20, farY]);
    g.save(); smooth(g, out);
    const rg = g.createLinearGradient(0, farY, 0, edgeY + (up ? 12 : -12));
    rg.addColorStop(0, '#3e332a'); rg.addColorStop(0.7, '#6f5e4d'); rg.addColorStop(1, '#9a8571');
    g.fillStyle = rg; g.fill(); g.save(); g.clip();
    g.strokeStyle = 'rgba(30,22,14,0.25)'; g.lineWidth = 2;   // bedding lines in the rock
    for (let k = 1; k < 4; k++) { const yy = lerp(farY, edgeY, k / 4); g.beginPath(); g.moveTo(x0 - 20, yy); for (let i = 0; i <= 8; i++) g.lineTo(x0 + (x1 - x0) * i / 8, yy + 4 * Math.sin(i * 1.7 + k + seed)); g.stroke(); }
    g.restore(); g.strokeStyle = 'rgba(30,22,14,0.9)'; g.lineWidth = 2; g.stroke(); g.restore();
  }
  function waterDrop(g, x, y, r, stretch) { // a glossy drop, pointed at the top
    g.save(); g.beginPath(); g.moveTo(x, y - r * (1.3 + stretch));
    g.bezierCurveTo(x + r * 0.9, y - r * 0.4, x + r, y + r * 0.9, x, y + r); g.bezierCurveTo(x - r, y + r * 0.9, x - r * 0.9, y - r * 0.4, x, y - r * (1.3 + stretch));
    const dg = g.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r * 1.3);
    dg.addColorStop(0, 'rgba(255,255,255,0.95)'); dg.addColorStop(0.35, 'rgba(176,216,242,0.95)'); dg.addColorStop(1, 'rgba(92,150,196,0.95)');
    g.fillStyle = dg; g.fill(); g.strokeStyle = 'rgba(40,80,120,0.8)'; g.lineWidth = 1.2; g.stroke(); g.restore();
  }

  function cave(g, marks, t, line) {
    t = t == null ? 1e4 : t;
    const grow = phase(t, 0, 9), X = 285, top = 70, floor = 440, BOX = [20, 14, 545, 456];
    g.save(); g.beginPath(); g.roundRect(BOX[0], BOX[1], BOX[2], BOX[3], 18); g.clip();
    const bg = g.createRadialGradient(X, 250, 30, X, 250, 420); // the cave, lit from in front
    bg.addColorStop(0, '#6f5d4c'); bg.addColorStop(0.55, '#463a30'); bg.addColorStop(1, '#241d18');
    g.fillStyle = bg; g.fillRect(BOX[0], BOX[1], BOX[2], BOX[3]);
    // far formations, then a haze so they sit back
    formation(g, 70, top - 10, 150, 26, 1, 4, true); formation(g, 150, top - 12, 92, 18, 1, 9, true); formation(g, 405, top - 10, 120, 22, 1, 2, true);
    formation(g, 520, top - 12, 170, 30, 1, 6, true); formation(g, 120, floor + 8, 70, 46, -1, 3, true); formation(g, 470, floor + 8, 110, 50, -1, 7, true);
    g.fillStyle = 'rgba(36,29,24,0.42)'; g.fillRect(BOX[0], BOX[1], BOX[2], BOX[3]);
    caveRock(g, BOX[0], BOX[0] + BOX[2], top, BOX[1] - 10, 3, 26);
    caveRock(g, BOX[0], BOX[0] + BOX[2], floor, BOX[1] + BOX[3] + 10, 8, 16);
    // a shallow wet patch on the floor around the stalagmite
    const pg = g.createRadialGradient(X, floor + 4, 4, X, floor + 4, 90); pg.addColorStop(0, 'rgba(170,205,230,0.32)'); pg.addColorStop(1, 'rgba(170,205,230,0)');
    g.fillStyle = pg; g.beginPath(); g.ellipse(X, floor + 6, 92, 14, 0, 0, Math.PI * 2); g.fill();
    formation(g, 180, top - 4, 84, 30, 1, 11); formation(g, 420, top - 2, 108, 36, 1, 5);
    const L = 120 + 70 * grow, H = 52 + 46 * grow;
    const tipY = formation(g, X, top - 6, L, 72, 1, 1.3), padY = formation(g, X, floor + 10, H + 10, 104, -1, 2.2);
    formation(g, 455, floor + 8, 40, 52, -1, 5);
    // a drop swells at the tip, lets go, falls and splashes on the stalagmite, again and again
    const u = (t / 1.8) % 1;
    if (u < 0.62) { const k = ease(u / 0.62); if (k > 0.05) waterDrop(g, X, tipY + 5 * k, 7.5 * k, 0.6 * k); }
    else if (u < 0.84) { const s = (u - 0.62) / 0.22; waterDrop(g, X, lerp(tipY + 8, padY - 6, s * s), 6, 0.9); }
    else {
      const s = (u - 0.84) / 0.16; g.save(); g.globalAlpha = 1 - s; g.strokeStyle = 'rgba(200,228,246,0.9)'; g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(X, padY + 2, 8 + 18 * s, 2.5 + 4 * s, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(200,228,246,0.95)'; [-1, -0.4, 0.5, 1].forEach((d, i) => { g.beginPath(); g.arc(X + d * 22 * s, padY - 14 * Math.sin(Math.PI * s) * (1 + i % 2 * 0.5), 1.8, 0, Math.PI * 2); g.fill(); });
      g.restore();
    }
    // the light falls off toward the edges of the cave
    const vg = g.createRadialGradient(X, 240, 160, X, 240, 440); vg.addColorStop(0, 'rgba(20,15,10,0)'); vg.addColorStop(1, 'rgba(20,15,10,0.5)');
    g.fillStyle = vg; g.fillRect(BOX[0], BOX[1], BOX[2], BOX[3]);
    g.restore();
    g.save(); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.roundRect(BOX[0], BOX[1], BOX[2], BOX[3], 18); g.stroke(); g.restore();
    label(g, 'stalactite', X + 62, top + 64, { size: 14, mono: true, weight: '400', color: '#efe4d2', align: 'left' });
    label(g, 'stalagmite', X + 72, floor - 40, { size: 14, mono: true, weight: '400', color: '#efe4d2', align: 'left' });
    depositLens(g, t, { dir: -1, keys: ['Ca2+', 'CO3^2-'], colour: '#f3ede2', t0: 1.0, gap: 1.05, extra: ['Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-'], surface: LENS.y + LENS.r * 0.42, bubbles: 'co2', seed: 17 });
    lensClose(g, LENS, [X, tipY + 2]);
    caption(g, line);
  }

  // ---------- kettle: a cut-away electric kettle on its base ----------
  function steel(g, x0, x1) {
    const sg = g.createLinearGradient(x0, 0, x1, 0);
    sg.addColorStop(0, '#7c8794'); sg.addColorStop(0.16, '#cfd7e0'); sg.addColorStop(0.27, '#ffffff'); sg.addColorStop(0.36, '#d7dee6');
    sg.addColorStop(0.55, '#aab4c0'); sg.addColorStop(0.74, '#eef2f6'); sg.addColorStop(0.86, '#b7c1cc'); sg.addColorStop(1, '#6c7784');
    return sg;
  }
  function kettle(g, marks, t, line) {
    t = t == null ? 1e4 : t;
    const crust = phase(t, 0.4, 9), waterY = 262, coilY = 392;
    const body = () => { g.beginPath(); g.moveTo(152, 426); g.bezierCurveTo(116, 392, 118, 262, 170, 206); g.lineTo(362, 206); g.bezierCurveTo(414, 262, 416, 392, 380, 426); g.quadraticCurveTo(372, 436, 358, 436); g.lineTo(174, 436); g.quadraticCurveTo(160, 436, 152, 426); g.closePath(); };
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    // shadow and the power base, with its light on
    const sh = g.createRadialGradient(266, 462, 10, 266, 462, 200); sh.addColorStop(0, 'rgba(29,36,51,0.28)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(266, 462, 200, 18, 0, 0, Math.PI * 2); g.fill();
    const bb = g.createLinearGradient(0, 432, 0, 462); bb.addColorStop(0, '#4a525e'); bb.addColorStop(1, '#1d2229');
    g.fillStyle = bb; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect(118, 432, 296, 28, 12); g.fill(); g.stroke();
    const led = g.createRadialGradient(386, 446, 0, 386, 446, 12); led.addColorStop(0, 'rgba(255,170,90,1)'); led.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = led; g.beginPath(); g.arc(386, 446, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff1e0'; g.beginPath(); g.arc(386, 446, 3, 0, Math.PI * 2); g.fill();
    // handle (black plastic)
    g.strokeStyle = INK; g.lineWidth = 26; g.beginPath(); g.moveTo(376, 230); g.bezierCurveTo(476, 226, 478, 396, 396, 402); g.stroke();
    g.strokeStyle = '#272c34'; g.lineWidth = 20; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(392, 232); g.bezierCurveTo(462, 236, 464, 380, 412, 392); g.stroke();
    // spout
    g.fillStyle = steel(g, 96, 172); g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(176, 212); g.quadraticCurveTo(134, 200, 98, 182); g.lineTo(104, 198); g.quadraticCurveTo(136, 224, 150, 266); g.closePath(); g.fill(); g.stroke();
    // body
    body(); g.fillStyle = steel(g, 118, 414); g.fill();
    g.save(); body(); g.clip(); const bd = g.createLinearGradient(0, 206, 0, 436); bd.addColorStop(0, 'rgba(255,255,255,0.15)'); bd.addColorStop(0.75, 'rgba(29,36,51,0)'); bd.addColorStop(1, 'rgba(29,36,51,0.22)');
    g.fillStyle = bd; g.fillRect(110, 200, 320, 240); g.restore();
    body(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    // lid and knob
    g.fillStyle = steel(g, 170, 362); g.beginPath(); g.moveTo(170, 206); g.quadraticCurveTo(266, 158, 362, 206); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#272c34'; g.beginPath(); g.roundRect(250, 166, 32, 16, 7); g.fill(); g.stroke();
    // the cut-away: inside wall, water, element; the cut edge shows the wall's thickness
    const wx = 184, wy = 226, ww = 164, wh = 194;
    g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 14); g.clip();
    const iw = g.createLinearGradient(wx, 0, wx + ww, 0); iw.addColorStop(0, '#5f6a77'); iw.addColorStop(0.5, '#a9b3be'); iw.addColorStop(1, '#5a6571');
    g.fillStyle = iw; g.fillRect(wx, wy, ww, wh);
    const lg = g.createLinearGradient(0, waterY, 0, wy + wh); lg.addColorStop(0, 'rgba(190,224,246,0.82)'); lg.addColorStop(1, 'rgba(110,168,212,0.9)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(wx, wy + wh);
    for (let i = 0; i <= 24; i++) { const x = wx + ww * i / 24; g.lineTo(x, waterY + 3 * Math.sin(i * 0.9 + t * 7) * Math.sin(t * 2.3 + i * 0.3)); }
    g.lineTo(wx + ww, wy + wh); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.6; g.beginPath();
    for (let i = 0; i <= 24; i++) { const x = wx + ww * i / 24, y = waterY + 3 * Math.sin(i * 0.9 + t * 7) * Math.sin(t * 2.3 + i * 0.3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    // limescale on the floor of the kettle: chalky, lumpy, a little speckled
    if (crust > 0.02) {
      const pts = scatter(24, 6); g.fillStyle = '#efeadf'; g.strokeStyle = 'rgba(120,110,95,0.5)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(wx, wy + wh);
      for (let i = 0; i <= 23; i++) g.lineTo(wx + ww * i / 23, wy + wh - 3 - (3 + 11 * pts[i][0]) * crust);
      g.lineTo(wx + ww, wy + wh); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = `rgba(160,150,132,${0.7 * crust})`; scatter(40, 9).forEach(q => { g.beginPath(); g.arc(wx + 4 + q[0] * (ww - 8), wy + wh - 3 - q[1] * 9 * crust, 0.9, 0, Math.PI * 2); g.fill(); });
    }
    // the element: a metal tube that glows, coated with scale as the crust builds
    const coil = () => { g.beginPath(); for (let i = 0; i <= 48; i++) { const x = wx + 18 + (ww - 36) * i / 48, y = coilY + 8 * Math.sin(i * 0.82); i ? g.lineTo(x, y) : g.moveTo(x, y); } };
    coil(); g.strokeStyle = '#2b2f36'; g.lineWidth = 11; g.stroke();
    coil(); g.strokeStyle = `rgb(206,${78 + 16 * Math.sin(t * 3)},34)`; g.lineWidth = 7; g.stroke();
    coil(); g.strokeStyle = 'rgba(255,186,110,0.95)'; g.lineWidth = 3; g.stroke();
    if (crust > 0.02) {
      coil(); g.strokeStyle = `rgba(238,233,222,${0.85 * crust})`; g.lineWidth = 9 + 6 * crust; g.setLineDash([3 + 4 * crust, 2]); g.stroke(); g.setLineDash([]);
    }
    for (let m = 0; m < 16; m++) { // bubbles stream off the element and wobble up
      const s = ((t / 1.15 + m / 16) % 1), x = wx + 16 + ((m * 37) % (ww - 32)) + 5 * Math.sin(t * 4 + m * 1.7) * s, y = lerp(coilY - 4, waterY + 6, s), r = 2 + 4.5 * s;
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    g.beginPath(); g.roundRect(wx, wy, ww, wh, 14); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
    g.strokeStyle = '#e3e8ee'; g.lineWidth = 4; g.stroke();   // the cut face of the wall
    // steam puffs from the spout
    for (let m = 0; m < 7; m++) {
      const s = ((t * 0.42 + m / 7) % 1), x = 98 - 34 * s + 10 * Math.sin(t * 1.6 + m), y = 172 - 130 * s, r = 6 + 28 * s;
      const pg = g.createRadialGradient(x, y, 0, x, y, r); pg.addColorStop(0, `rgba(190,199,210,${0.55 * (1 - s) * Math.min(1, s * 6)})`); pg.addColorStop(1, 'rgba(190,199,210,0)');
      g.fillStyle = pg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    label(g, 'hard tap water', wx + ww / 2, wy + 18, { size: 13, mono: true, weight: '400', color: '#f4f7fa' });
    label(g, 'heating element', wx + ww / 2, coilY - 26, { size: 12, mono: true, weight: '700', color: '#ffffff' });
    depositLens(g, t, { dir: 1, base: 34, keys: ['Ca2+', 'CO3^2-'], colour: '#f3ede2', t0: 1.0, gap: 1.05, extra: ['Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-', 'Ca2+', 'CO3^2-'], bubbles: 'steam', seed: 29 });
    lensClose(g, LENS, [320, coilY + 4]);
    caption(g, line);
  }

  // ---------- milk of magnesia poured into stomach acid ----------
  function antacid(g, marks, t, line) {
    t = t == null ? 1e4 : t;
    const W = LENS, R = LR, G = Draw.beakerGeom({ x: 180, y: 210, w: 210, h: 230 }, { level: 0.62 });
    const E = [G.cx - 24, G.surfY + 2];                                   // where the stream meets the acid
    const fill = phase(t, 0.9, 2.6), clear = 1 - phase(t, 3.0, 8.4);
    // the acid: H⁺ and Cl⁻ drift; as the cloud clears, some H⁺ are used up and Mg²⁺ appear
    const keys = repeat('H+', 6).concat(repeat('Cl-', 6), repeat('Mg2+', 2));
    const inB = beakerPlace(G, 11);
    Draw.beakerBack(g, G, { level: 0.62 });
    drawSprites(g, swarm(keys, 31).map((p, i) => {
      const a = i < 4 ? 1 - phase(t, 3.4 + i * 1.1, 4.1 + i * 1.1) : i >= 12 ? phase(t, 4.4 + (i - 12) * 2, 5.2 + (i - 12) * 2) : 1;
      return a > 0.01 ? Object.assign(inB(at(p, t)), { info: p.info, a }) : null;
    }), 11);
    if (fill * clear > 0.01) { // the suspension billows down from where it lands, fills the acid, then clears
      g.save(); g.beginPath(); g.rect(G.cx - G.rx + 3, G.surfY - 2, 2 * G.rx - 6, G.botY - G.surfY + G.ry * 0.7); g.clip();
      // a milky body, brightest in the middle and a little grey toward the glass, so it reads as cloudy liquid
      const mk = phase(t, 1.6, 3.0) * clear, mg = g.createRadialGradient(G.cx - 10, (G.surfY + G.botY) / 2, 10, G.cx, (G.surfY + G.botY) / 2, G.rx * 1.2);
      mg.addColorStop(0, `rgba(255,255,253,${mk})`); mg.addColorStop(0.7, `rgba(240,241,240,${0.97 * mk})`); mg.addColorStop(1, `rgba(214,219,226,${0.95 * mk})`);
      g.fillStyle = mg; g.fillRect(G.cx - G.rx, G.surfY, 2 * G.rx, G.botY - G.surfY + G.ry);
      const r = rng(19);
      for (let i = 0; i < 26; i++) {
        const a = -0.25 + r() * (Math.PI + 0.5), d = r() * 0.5, k = phase(t, 0.8 + d, 2.8 + d);
        if (k <= 0) continue;
        const x = E[0] + Math.cos(a) * G.rx * 0.95 * k + 5 * Math.sin(t * 0.8 + i), y = E[1] + 8 + Math.abs(Math.sin(a)) * (G.botY - G.surfY) * 0.95 * k, rad = 10 + 30 * k;
        const pg = g.createRadialGradient(x - rad * 0.25, y - rad * 0.3, 0, x, y, rad);
        pg.addColorStop(0, `rgba(255,255,255,${0.95 * clear})`); pg.addColorStop(0.65, `rgba(236,238,242,${0.7 * clear})`); pg.addColorStop(1, 'rgba(225,229,236,0)');
        g.fillStyle = pg; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
    Draw.beakerSurface(g, G); Draw.beakerFront(g, G, { spout: false, grads: [] });
    // the bottle tips in, pours, and lifts away
    const show = phase(t, 0.05, 0.35) * (1 - phase(t, 2.2, 2.6)), tip = phase(t, 0.15, 0.7) * (1 - phase(t, 2.0, 2.4));
    if (show > 0.01) {
      const bx = 140, by = 132, ang = 0.5 + 1.45 * tip, mouth = [bx + 92 * Math.sin(ang), by - 92 * Math.cos(ang)];
      if (t > 0.62 && t < 2.05) { // a thick, glossy white stream
        const end = E, c = [(mouth[0] + end[0]) / 2 + 14 + 3 * Math.sin(t * 9), Math.min(mouth[1], end[1]) - 6];
        g.save(); g.lineCap = 'round'; g.globalAlpha = show;
        g.strokeStyle = 'rgba(29,36,51,0.35)'; g.lineWidth = 11; g.beginPath(); g.moveTo(mouth[0], mouth[1]); g.quadraticCurveTo(c[0], c[1], end[0], end[1]); g.stroke();
        g.strokeStyle = '#f7f7f3'; g.lineWidth = 8; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(mouth[0] - 2, mouth[1]); g.quadraticCurveTo(c[0] - 3, c[1], end[0] - 3, end[1]); g.stroke();
        g.restore();
      }
      g.save(); g.globalAlpha = show; g.translate(bx, by); g.rotate(ang); g.lineJoin = 'round';
      const glass = g.createLinearGradient(-32, 0, 32, 0);
      glass.addColorStop(0, '#173f80'); glass.addColorStop(0.28, '#3f7fd6'); glass.addColorStop(0.4, '#a9cdf7'); glass.addColorStop(0.55, '#3a74c8'); glass.addColorStop(1, '#122f62');
      g.beginPath(); g.moveTo(-32, 42); g.lineTo(-32, -26); g.quadraticCurveTo(-32, -46, -15, -56); g.lineTo(-13, -76); g.lineTo(13, -76); g.lineTo(15, -56);
      g.quadraticCurveTo(32, -46, 32, -26); g.lineTo(32, 42); g.quadraticCurveTo(32, 52, 22, 52); g.lineTo(-22, 52); g.quadraticCurveTo(-32, 52, -32, 42); g.closePath();
      g.fillStyle = glass; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.4; g.stroke();
      g.fillStyle = '#ffffff'; g.fillRect(-32, -18, 64, 46); g.strokeRect(-32, -18, 64, 46);
      g.fillStyle = '#1d3d78'; g.font = '700 9px Space Grotesk, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('MILK OF', 0, -2); g.fillText('MAGNESIA', 0, 10);
      g.fillStyle = '#eef1f5'; g.beginPath(); g.roundRect(-12, -92, 24, 17, 3); g.fill(); g.stroke();
      g.restore();
      label(g, 'milk of magnesia', 128, 30, { size: 14, mono: true, weight: '400', color: DIM, alpha: show });
    }
    label(g, 'stomach acid (HCl)', G.cx, G.botY + G.ry + 26, { size: 14, mono: true, weight: '400', color: DIM });

    // zoom: before the pour there is only acid. Once the milk of magnesia lands (about 0.9 s) one grain of Mg(OH)₂
    // sinks into view; then H⁺ meets each OH⁻ and they leave as H₂O, Mg²⁺ drifts off, and the grain shrinks to nothing
    lensOpen(g, W);
    const step = 2 * R * 0.92, cells = [], drop = -(W.r + 90) * (1 - ease(phase(t, 0.9, 2.2)));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) cells.push({ x: W.x + (c - 2.5) * step, y: W.y + 22 + (r - 1) * step + drop, key: (c + r) % 3 === 0 ? 'Mg2+' : 'OH-' });
    const rank = cells.map((c, i) => i).sort((a, b) => Math.hypot(cells[b].x - W.x, cells[b].y - drop - W.y - 22) - Math.hypot(cells[a].x - W.x, cells[a].y - drop - W.y - 22) || a - b);
    rank.forEach((ci, k) => { cells[ci].rel = 2.9 + k * 0.32; });
    const place = inLens(W, W.y - W.r + R + 10, W.y + W.r - R - 10, R, { top: true, bottom: true });
    const freeSw = swarm(cells.map(c => c.key), 41), hSw = swarm(repeat('H+', 15), 43);
    const sprites = [], waters = [];
    const ohs = rank.filter(ci => cells[ci].key === 'OH-');
    cells.forEach((c, i) => {
      const p = freeSw[i], q = at(p, t), f = place(q), k = phase(t, c.rel, c.rel + 1.4);
      if (c.key === 'Mg2+') sprites.push({ x: lerp(c.x, f.x, k), y: lerp(c.y, f.y, k), z: lerp(1, q.z, k), info: ionInfo('Mg2+'), solidColour: '#f4f4f0', solid: 1 - phase(t, c.rel, c.rel + 0.5) });
      else if (t < c.rel) sprites.push({ x: c.x, y: c.y, z: 1, info: ionInfo('OH-'), solidColour: '#f4f4f0', solid: 1 });
      else waters.push({ x: lerp(c.x, f.x, k), y: lerp(c.y, f.y, k), z: lerp(1, q.z, k) });
    });
    hSw.forEach((p, j) => {
      const q = at(p, t), f = place(q);
      if (j >= ohs.length) return sprites.push(Object.assign(f, { info: p.info }));
      const c = cells[ohs[j]], k = phase(t, c.rel - 0.8, c.rel);
      if (t < c.rel) sprites.push({ x: lerp(f.x, c.x + 10, k), y: lerp(f.y, c.y - 12, k), z: lerp(q.z, 1, k), info: p.info });
    });
    waters.sort((a, b) => a.z - b.z).forEach(w => Draw.neutral(g, w.x, w.y, R * (0.62 + 0.38 * w.z) * 0.9, 'H₂O', 0.55 + 0.45 * w.z));
    drawSprites(g, sprites, R);
    lensClose(g, W, [G.cx + 10, G.surfY + 70]);
    caption(g, line);
  }

  // ---------- Part 4 ----------
  const COLOURLESS = '#f4f8fc', CU_BLUE = '#3f86d6', CU_SOLN = '#2a72c9'; // CU_SOLN: Cu²⁺ in water, as deep as copper(II) sulphate
  // 4.1: an unknown tube, and four ion cards: each a small beaker of that ion in water (Cu²⁺ is blue, the rest colourless)
  function unknown(g, marks, t) {
    t = t == null ? 0 : t;
    // colourless solutions are drawn nearly clear and Cu²⁺ a strong copper-sulphate blue, so the one coloured ion
    // stands out at once (user, 2026-11-20)
    tube(g, 220, 90, 96, 360, { level: 0.75, tint: COLOURLESS });
    label(g, 'Unknown', 220, 52, { size: 24 });
    label(g, 'colourless', 220, 486, { size: 16, mono: true, weight: '400', color: DIM });
    const cards = [['Pb2+', 'Pb²⁺', COLOURLESS, 'colourless'], ['Sr2+', 'Sr²⁺', COLOURLESS, 'colourless'], ['Mg2+', 'Mg²⁺', COLOURLESS, 'colourless'], ['Cu2+', 'Cu²⁺', CU_SOLN, 'blue']];
    cards.forEach(([key, sym, liquid, words], i) => {
      const x = 430 + (i % 2) * 220, y = 100 + Math.floor(i / 2) * 190;
      g.save(); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 2.5;
      g.beginPath(); g.roundRect ? g.roundRect(x, y, 196, 160, 14) : g.rect(x, y, 196, 160); g.fill(); g.stroke(); g.restore();
      label(g, sym, x + 98, y + 22, { size: 20 });
      const G = Draw.beakerGeom({ x: x + 50, y: y + 36, w: 96, h: 86 }, { level: 0.78, tilt: 0.2 });
      Draw.beakerBack(g, G, { level: 0.78, liquidColor: liquid || undefined });
      const inB = beakerPlace(G, 9);
      drawSprites(g, swarm(repeat(key, 3), 70 + i).map(p => Object.assign(inB(at(p, t)), { info: p.info })), 9);
      Draw.beakerSurface(g, G); Draw.beakerFront(g, G, { spout: false, grads: [] });
      label(g, words + ' in water', x + 98, y + 142, { size: 14, mono: true, weight: '400', color: DIM });
      mark(g, x - 6, y - 6, 208, 172, marks && marks.has(sym));
    });
  }
  // 4.3: two tubes, one reagent each: a drop goes in, the solid forms and settles.
  // tubes: [{ title, sub, solids: [{ colour, mg, name }], note }]
  function orderTubes(g, tubes, marks, t) {
    t = t == null ? 1e4 : t;
    tubes.forEach((tb, i) => {
      const cx = 230 + i * 440, top = 120, h = 306, t0 = 0.4 + i * 0.6;
      const a = tb.solids[0], b = tb.solids[1], dropT = clamp01((t - t0) / 0.5), settle = phase(t, t0 + 0.5, t0 + 3.0);
      const o = { level: 0.78, seed: 17 + i, t: isFinite(t) ? t : 0, drop: dropT < 1 ? { t: dropT, label: null } : null };
      if (settle >= 1) { o.solid = a ? { colour: a.colour, mg: a.mg } : null; o.solid2 = b ? { colour: b.colour, mg: b.mg } : null; }
      else if (dropT >= 1 && a) o.cloud = { colour: a.colour, mg: a.mg + (b ? b.mg : 0), t: settle };
      tube(g, cx, top, 86, h, o);
      label(g, tb.title, cx, 26, { size: 22 });
      label(g, tb.sub, cx, 50, { size: 15, mono: true, weight: '400', color: DIM });
      tb.solids.forEach((sd, j) => label(g, sd.name, cx + 64, top + h - 18 - j * 34, { size: 17, mono: true, align: 'left', alpha: phase(t, t0 + 2.6, t0 + 3.1) }));
      label(g, tb.note, cx, top + h + 40, { size: 17, mono: true, alpha: phase(t, t0 + 2.8, t0 + 3.3) });
      mark(g, cx - 160, 6, 320, h + 160, marks && marks.has('tube' + (i + 1)));
    });
  }
  // the scheme as a flowchart. active: step index (0..2) or 3 for the result; results: words per step
  const SCHEME = [
    { add: 'Add KI', yes: 'yellow solid: Pb²⁺', next: 'centrifuge, decant' },
    { add: 'Add Na₂SO₄', yes: 'white solid: Sr²⁺', next: 'centrifuge, decant' },
    { add: 'Add NaOH', yes: 'white solid: Mg²⁺', next: '' }
  ];
  function scheme(g, x, y, w, o) {
    o = o || {};
    const bh = 112, gap = 34;
    SCHEME.forEach((st, i) => {
      const by = y + i * (bh + gap), on = o.active === i, done = o.results && o.results[i];
      g.save(); g.fillStyle = on ? '#e8ebff' : '#fff'; g.strokeStyle = on ? ACCENT : INK; g.lineWidth = on ? 4 : 2.5;
      g.beginPath(); g.roundRect ? g.roundRect(x, by, w, bh, 14) : g.rect(x, by, w, bh); g.fill(); g.stroke(); g.restore();
      label(g, (i + 1) + '. ' + st.add, x + 18, by + 26, { size: 21, align: 'left' });
      label(g, 'Solid? ' + st.yes, x + 18, by + 58, { size: 15, mono: true, weight: '400', align: 'left' });
      if (st.next) label(g, 'Then ' + st.next + '. Take the liquid on.', x + 18, by + 84, { size: 15, mono: true, weight: '400', align: 'left', color: DIM });
      if (done) {
        g.save(); g.fillStyle = INK; g.font = '700 15px Space Grotesk, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
        g.fillText(done, x + w - 16, by + 26); g.restore();
      }
      if (i < SCHEME.length - 1) {
        g.save(); g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x + 46, by + bh); g.lineTo(x + 46, by + bh + gap - 10); g.stroke();
        g.beginPath(); g.moveTo(x + 46, by + bh + gap); g.lineTo(x + 39, by + bh + gap - 12); g.lineTo(x + 53, by + bh + gap - 12); g.closePath(); g.fill(); g.restore();
        // a drop of liquid travels down the arrow to the next step
        if (o.flow != null) {
          const k = (o.flow + i * 0.5) % 1;
          g.save(); g.fillStyle = WATER_LINE; g.globalAlpha = Math.sin(Math.PI * k); g.beginPath(); g.arc(x + 46, by + bh + 4 + k * (gap - 14), 4.5, 0, Math.PI * 2); g.fill(); g.restore();
        }
      }
    });
    if (o.result) {
      const by = y + 3 * (bh + gap) - gap + 14;
      g.save(); g.fillStyle = o.active === 3 ? '#e8ebff' : '#fff'; g.strokeStyle = o.active === 3 ? ACCENT : INK; g.lineWidth = o.active === 3 ? 4 : 2.5;
      g.beginPath(); g.roundRect ? g.roundRect(x, by, w, 46, 12) : g.rect(x, by, w, 46); g.fill(); g.stroke(); g.restore();
      label(g, o.result, x + w / 2, by + 23, { size: 19 });
    }
  }
  // 4.6: a tap dripping into a test tube that stays clear after KI. o: { t, drop (0..1), caption }
  function tapTube(g, o, marks) {
    o = o || {};
    const T = o.t || 0;
    g.save(); g.strokeStyle = INK; g.lineWidth = 3;
    const pipe = g.createLinearGradient(0, 70, 0, 104); pipe.addColorStop(0, '#d7dde7'); pipe.addColorStop(1, '#a9b3c2');
    g.fillStyle = pipe;
    g.beginPath(); g.roundRect ? g.roundRect(40, 70, 190, 34, 8) : g.rect(40, 70, 190, 34); g.fill(); g.stroke();        // pipe
    g.beginPath(); g.moveTo(200, 104); g.lineTo(200, 150); g.lineTo(176, 150); g.lineTo(176, 104); g.fill(); g.stroke();  // spout
    g.fillStyle = INK; g.fillRect(170, 52, 36, 12); g.fillRect(184, 60, 8, 12); // handle
    // drips falling from the spout
    g.fillStyle = WATER_LINE; g.strokeStyle = '#4f86b0'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const k = (T * 0.9 + i / 3) % 1, y = 158 + k * k * 90;
      g.globalAlpha = Math.min(1, (1 - k) * 4);
      g.beginPath(); g.moveTo(188, y - 7); g.bezierCurveTo(193, y - 1, 193, y + 5, 188, y + 5); g.bezierCurveTo(183, y + 5, 183, y - 1, 188, y - 7); g.fill(); g.stroke();
    }
    g.restore();
    label(g, 'older lead pipes', 100, 50, { size: 15, mono: true, weight: '400', color: DIM });
    g.save(); g.strokeStyle = DIM; g.lineWidth = 2.5; g.setLineDash([6, 6]); g.lineDashOffset = -T * 20;
    g.beginPath(); g.moveTo(210, 250); g.quadraticCurveTo(300, 210, 360, 250); g.stroke(); g.restore();
    label(g, 'fill a tube', 290, 196, { size: 15, mono: true, weight: '400', color: DIM });
    tube(g, 440, 190, 84, 290, { level: 0.72, drop: o.drop ? { t: o.drop, label: 'KI' } : null });
    label(g, o.caption || 'tap water', 440, 510, { size: 17, mono: true });
    mark(g, 360, 172, 160, 320, marks && marks.has('tube'));
  }

  // story lengths (s): a tap during the story skips to its end; a tap after it replays
  const END = { labPH: PH_END, cave: 9, kettle: 9, antacid: 9.8, labMass: 7.3, tubes: 3.0, order: 4.3 };

  global.SolPictures = { labPH, concMass, concDilute, cave, kettle, antacid, labMass, labConductivity, mixSources, mixedEmpty, mixLevel, testTubes, MIXED, balance, label, arrow, mark,
    tube, dropper, standardDropper, unknown, orderTubes, scheme, SCHEME, tapTube, CU_BLUE, drawSprites, MIX_R, END };
})(typeof window !== 'undefined' ? window : globalThis);
