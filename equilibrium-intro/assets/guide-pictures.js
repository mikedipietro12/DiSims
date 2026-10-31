/**
 * Intro to Equilibrium - Guide stage pictures (Task 6).
 *
 * Small drawn scenes for the Guide's non-vessel beats:
 *   energy - animated potential energy diagram, exothermic or endothermic
 *   beaker - NaOH dissolving in a beaker (with thermometer), or an ice cube melting into a puddle
 *   spread - one jar animated from before to after (IMF heat-room look); food colouring spreading
 *   gibbs4 - the four ΔH / ΔS sign cases: term arrows on the equation + waterfall bars
 *   coldpack - stepped cold pack story: dissolving, then ΔH ← and ΔS → on the equation's half-arrows
 *   paths  - two routes between the same start and end (state functions)
 *   equation - big equation for example cards
 * Pictures that would give away a prediction (beaker heat arrows) stay grey with "?" until revealed.
 */
(function (global) {
  'use strict';

  var INK = '#1d2433', DIM = '#5b6474', FAINT = 'rgba(29,36,51,0.18)';
  var EMBER = '#e07a2e', TIDE = '#14918f', WATER = '#8fc6ec';
  var MONO = '"Space Mono", monospace', BODY = '"Space Grotesk", Helvetica, sans-serif';

  function fit(canvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var cw = canvas.clientWidth || 400, ch = canvas.clientHeight || 300;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    }
    // Pictures are drawn for the side panel (~460 × 330). On a bigger canvas (Learn mode, full
    // screen) scale the whole drawing up so text, particles and lines grow together; layouts
    // still use the wider logical width.
    var k = Math.max(1, Math.min(cw / 520, ch / 380));
    var w = cw / k, h = ch / k;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    // Studio tray, as in the vessel
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(29,36,51,0.10)';
    for (var x = 11; x < w; x += 22) for (var y = 11; y < h; y += 22) ctx.fillRect(x, y, 1.4, 1.4);
    return { ctx: ctx, w: w, h: h };
  }

  function ball(ctx, x, y, r, base, hi) {
    var g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
    g.addColorStop(0, hi || '#ffffff'); g.addColorStop(0.7, base); g.addColorStop(1, 'rgba(40,48,66,0.55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function roundBox(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }

  function arrow(ctx, x1, y1, x2, y2, color, width, dash) {
    var a = Math.atan2(y2 - y1, x2 - x1), hl = width * 3.2;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.8, y2 - Math.sin(a) * hl * 0.8); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * hl, y2 - Math.sin(a - 0.45) * hl);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * hl, y2 - Math.sin(a + 0.45) * hl);
    ctx.closePath(); ctx.fill();
  }

  function label(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || '700') + ' ' + (opts.size || 12) + 'px ' + (opts.font || MONO);
    ctx.fillStyle = opts.color || DIM; ctx.textAlign = opts.align || 'center'; ctx.textBaseline = opts.base || 'middle';
    ctx.fillText(text, x, y);
  }

  // Tetrahedral bond directions (unit vectors), spun about the vertical and tipped toward the viewer.
  // x right, y down the screen, z toward the viewer. NH₄⁺ uses all four; NH₃ uses three (the
  // fourth points at the lone pair), which makes it trigonal pyramidal.
  var TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(function (v) { return v.map(function (c) { return c / Math.sqrt(3); }); });
  function tetraDirs(spin, tilt) {
    var cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    return TETRA.map(function (v) {
      var x = v[0] * cs + v[2] * sn, z = -v[0] * sn + v[2] * cs;
      return { x: x, y: v[1] * ct - z * st, z: v[1] * st + z * ct };
    });
  }

  // Seeded jitter so snapshots don't reshuffle on every redraw
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------- beaker: a real system in water (NaOH dissolving, ice melting) ----------
     A stateless function of time t (s). The thermometer and the water's tint are the
     evidence, shown before the prediction. Heat arrows (which way heat flows) appear only
     after Reveal. Returns a text description for the canvas label. */
  var BK = { settle: 0.8, drop: 0.7, react: 4.5, hold: 2.2, fade: 0.5 };
  function mix(c1, c2, k) {
    var a = [1, 3, 5].map(function (i) { return parseInt(c1.substr(i, 2), 16); });
    var b = [1, 3, 5].map(function (i) { return parseInt(c2.substr(i, 2), 16); });
    return '#' + a.map(function (v, i) { return ('0' + Math.round(v + (b[i] - v) * k).toString(16)).slice(-2); }).join('');
  }
  function heatWave(ctx, x1, y1, x2, y2, alpha) {
    // Wavy ember arrow from (x1, y1) to (x2, y2), arrowhead at the end
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 6) return;
    var ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    var waves = Math.max(2, len / 12), steps = Math.ceil(waves * 6);
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.strokeStyle = EMBER; ctx.fillStyle = EMBER; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var k = 0; k <= steps; k++) {
      var d = len * 0.8 * k / steps, o = Math.sin(k / steps * Math.PI * waves) * 3;
      var px = x1 + ux * d + nx * o, py = y1 + uy * d + ny * o;
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * 8 + nx * 4.5, y2 - uy * 8 + ny * 4.5);
    ctx.lineTo(x2 - ux * 8 - nx * 4.5, y2 - uy * 8 - ny * 4.5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Glass beaker drawn as a cylinder. G = { bx, by, bw, bb, ry, cx, wt }.
  function beakerGeom(bx, by, bw, bh) {
    return { bx: bx, by: by, bw: bw, bb: by + bh, ry: bw * 0.13, cx: bx + bw / 2, wt: by + bh * 0.24 };
  }
  function beakerBack(ctx, G, water) {
    var edge = mix(water, '#4d6f8f', 0.28);
    ctx.strokeStyle = 'rgba(29,36,51,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(G.cx, G.by, G.bw / 2, G.ry, 0, Math.PI, 0); ctx.stroke();
    // Water body: shaded darker at the edges so it reads as a cylinder
    var g = ctx.createLinearGradient(G.bx, 0, G.bx + G.bw, 0);
    g.addColorStop(0, edge); g.addColorStop(0.35, water); g.addColorStop(0.6, water); g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(G.bx, G.wt); ctx.lineTo(G.bx, G.bb);
    ctx.ellipse(G.cx, G.bb, G.bw / 2, G.ry, 0, Math.PI, 0, true);
    ctx.lineTo(G.bx + G.bw, G.wt); ctx.ellipse(G.cx, G.wt, G.bw / 2, G.ry, 0, 0, Math.PI, false); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(water, '#ffffff', 0.35);
    ctx.beginPath(); ctx.ellipse(G.cx, G.wt, G.bw / 2, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(29,36,51,0.22)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  function beakerFront(ctx, G) {
    var bx = G.bx, by = G.by, bw = G.bw, bb = G.bb, ry = G.ry;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, bb); ctx.ellipse(G.cx, bb, bw / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(bx + bw, by); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(G.cx, by, bw / 2, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx + 12, by + ry + 12); ctx.lineTo(bx + 12, bb - 10); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx + 22, by + ry + 18); ctx.lineTo(bx + 22, bb - 24); ctx.stroke();
  }
  // Thermometer standing in the beaker; lvl 0–1 is the height of the red column
  function thermometer(ctx, tx, tTop, bulbY, lvl) {
    var colY = bulbY - 10 - (bulbY - 10 - (tTop + 8)) * lvl;
    var tg = ctx.createLinearGradient(tx - 5, 0, tx + 5, 0);
    tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#e3e8ef');
    ctx.fillStyle = tg; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    roundBox(ctx, tx - 5, tTop, 10, bulbY - tTop, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, bulbY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d93a3a'; ctx.fillRect(tx - 2, colY, 4, bulbY - colY);   // classic red thermometer liquid
    ctx.beginPath(); ctx.arc(tx, bulbY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(tx - 3.5, tTop + 6, 1.4, bulbY - tTop - 16);
    for (var gI = 1; gI <= 5; gI++) { var gy = tTop + 10 + (bulbY - tTop - 24) * gI / 6; ctx.fillStyle = INK; ctx.fillRect(tx + 5, gy, 4, 1.2); }
  }

  function beaker(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var ice = o.id === 'melt';
    var cyc = BK.settle + BK.drop + BK.react + BK.hold;
    var t = o.still ? cyc - BK.hold : (o.t || 0) % cyc;
    var t0 = BK.settle + (ice ? 0 : BK.drop);
    var prog = smooth((t - t0) / BK.react);                  // 0 → 1: dissolved / melted
    var fadeA = o.still ? 1 : Math.min(1, t / 0.3, (cyc - t) / BK.fade);
    var pulse = o.still ? 0.55 : (t % 1.3) / 1.3;             // heat pulse along each arrow
    var showHeat = o.revealed && (o.still || (prog > 0.02 && prog < 0.99));
    var ha = o.still ? 1 : Math.sin(Math.PI * pulse);

    if (ice) iceScene(); else naohScene();
    equationWithHeat();

    var cap = !o.revealed ? (ice ? 'The ice melts into a puddle. Predict the sign of ΔH.' : 'The water warms up. Predict the sign of ΔH.')
      : (ice ? 'Heat flows into the ice from around it · ΔH +' : 'Heat flows out of the NaOH into the water · ΔH −');
    return (ice ? 'An ice cube sits on a flat surface and melts into a small puddle.'
      : 'NaOH pellets drop into a beaker of water and dissolve. The thermometer rises: the water gets warmer.')
      + (o.revealed ? ' ' + cap.replace(' · ', '. ') + '.' : '');

    /* The equation across the top. After Reveal, heat appears as a term: on the products
       side when heat comes out (NaOH), on the reactants side when heat goes in (ice). */
    function equationWithHeat() {
      var parts = ice ? [['H₂O(s)'], ['+ heat', 1], ['→'], ['H₂O(l)']]
        : [['NaOH(s)'], ['→'], ['Na⁺(aq) + OH⁻(aq)'], ['+ heat', 1]];
      if (!o.revealed) parts = parts.filter(function (q) { return !q[1]; });
      ctx.font = '700 16px ' + BODY;
      var sp = 8, widths = parts.map(function (q) { return ctx.measureText(q[0]).width + (q[1] ? 12 : 0); });
      var total = widths.reduce(function (a2, b2) { return a2 + b2; }, 0) + sp * (parts.length - 1);
      var x = (w - total) / 2, y = 26;
      parts.forEach(function (q, i) {
        if (q[1]) {
          ctx.fillStyle = 'rgba(224,122,46,0.14)'; roundBox(ctx, x, y - 13, widths[i], 26, 13); ctx.fill();
          ctx.strokeStyle = EMBER; ctx.lineWidth = 1.5; ctx.stroke();
        }
        label(ctx, q[0], x + (q[1] ? 6 : 0), y, { font: BODY, size: 16, color: q[1] ? EMBER : INK, align: 'left' });
        x += widths[i] + sp;
      });
    }

    /* NaOH: pellets drop into a glass beaker (drawn as a cylinder) and dissolve */
    function naohScene() {
      var bw = Math.min(w * 0.44, 200), bh = Math.min(h * 0.56, 180);
      var G = beakerGeom((w - bw) / 2 - 18, 96, bw, bh);
      var bx = G.bx, by = G.by, bb = G.bb, ry = G.ry, cx = G.cx, wt = G.wt;
      beakerBack(ctx, G, mix('#ddeefa', '#f8c393', prog));

      // Pellets drop in, sink to the bottom, shrink, and spread out as dissolved particles
      ctx.save(); ctx.globalAlpha = fadeA;
      var rng2 = rng(7), px = [-0.2, 0.0, 0.18].map(function (k) { return cx - 16 + bw * k; });
      var restY = bb - 2, dropK = smooth((t - BK.settle) / BK.drop);
      var py = t < BK.settle ? by - 44 : by - 44 + (restY - by + 44) * dropK * dropK;
      px.forEach(function (x0, i) {
        for (var d = 0; d < 9; d++) {
          var ang = rng2() * Math.PI * 2, rad = Math.sqrt(rng2());
          var tx2 = cx - 14 + Math.cos(ang) * rad * (bw / 2 - 30), ty2 = wt + ry + 8 + rng2() * (bb - wt - ry - 10);
          var k = smooth(prog * 1.25 - d * 0.03);
          if (k <= 0) continue;
          ctx.fillStyle = 'rgba(29,36,51,0.5)';
          ctx.beginPath(); ctx.arc(x0 + (tx2 - x0) * k, py + (ty2 - py) * k, 2, 0, Math.PI * 2); ctx.fill();
        }
        var sz = 1 - prog;
        if (sz > 0.04) {
          var pr = 8 * sz + 1.5, pry = pr * 0.45;
          ctx.fillStyle = '#b9bfca';
          ctx.beginPath(); ctx.ellipse(x0, py + 2.2, pr, pry, 0, 0, Math.PI * 2); ctx.fill();
          var pg = ctx.createRadialGradient(x0 - pr * 0.3, py - pry * 0.4, 0.5, x0, py, pr);
          pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#dfe3ea');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x0, py, pr, pry, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(29,36,51,0.55)'; ctx.lineWidth = 1; ctx.stroke();
        }
      });
      ctx.restore();

      // Thermometer: the evidence
      var tTop = by - 46;
      thermometer(ctx, bx + bw - 30, tTop, bb - 12, 0.45 + 0.32 * prog);
      label(ctx, 'temperature', bx + bw + 16, tTop + 8, { size: 11, align: 'left' });
      beakerFront(ctx, G);

      if (showHeat) {
        var hp = [px[1], restY - 4];
        [-150, -115, -90, -65, -30].forEach(function (deg) {
          var rad = deg * Math.PI / 180, ux = Math.cos(rad), uy = Math.sin(rad);
          var r0 = 22 + 30 * pulse, r1 = r0 + 28;
          heatWave(ctx, hp[0] + ux * r0, hp[1] + uy * r0 * 0.8, hp[0] + ux * r1, hp[1] + uy * r1 * 0.8, ha);
        });
      }
    }

    /* Ice: an isometric cube on an unseen flat surface, slumping into a puddle */
    function iceScene() {
      var a = Math.min(w, h) * 0.2, cx = w / 2, cy = h * 0.64;
      var hw = a * (1 - 0.3 * prog) / 2, hz = a * (1 - 0.7 * prog), round = 12 + 8 * prog;
      var iso = function (x, y, z) { return [cx + (x - y) * 0.866, cy + (x + y) * 0.5 - z]; };

      // Puddle: an isometric circle that spreads as the ice melts
      var R = hw * 1.2 + a * 0.6 * prog;
      ctx.save(); ctx.globalAlpha = fadeA;
      var pg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.22);
      pg.addColorStop(0, 'rgba(150,200,236,0.55)'); pg.addColorStop(1, 'rgba(150,200,236,0.3)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.22, R * 0.71, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(79,140,190,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.95, R * 0.52, 0, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();

      // Cube faces, rounded more as it melts
      function face(pts, fill) {
        ctx.beginPath(); pts.forEach(function (q, i) { var s2 = iso(q[0], q[1], q[2]); if (i) ctx.lineTo(s2[0], s2[1]); else ctx.moveTo(s2[0], s2[1]); });
        ctx.closePath();
        ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineWidth = round; ctx.lineJoin = 'round';
        ctx.stroke(); ctx.fill();
      }
      var leftG = '#c6e3f7', rightG = '#9ccbec', topG = '#eef8fe';
      // Outline of the whole cube, drawn first and a little wider so a thin rim shows
      ctx.beginPath();
      [[-hw, -hw, hz], [hw, -hw, hz], [hw, -hw, 0], [hw, hw, 0], [-hw, hw, 0], [-hw, hw, hz]].forEach(function (q, i) {
        var s2 = iso(q[0], q[1], q[2]); if (i) ctx.lineTo(s2[0], s2[1]); else ctx.moveTo(s2[0], s2[1]);
      });
      ctx.closePath(); ctx.strokeStyle = '#5f9fcf'; ctx.lineWidth = round + 3; ctx.lineJoin = 'round'; ctx.stroke();
      face([[-hw, hw, 0], [hw, hw, 0], [hw, hw, hz], [-hw, hw, hz]], leftG);    // front-left face (y = +hw)
      face([[hw, -hw, 0], [hw, hw, 0], [hw, hw, hz], [hw, -hw, hz]], rightG);   // front-right face (x = +hw)
      face([[-hw, -hw, hz], [hw, -hw, hz], [hw, hw, hz], [-hw, hw, hz]], topG); // top
      // Edges and highlights
      ctx.strokeStyle = 'rgba(70,130,180,0.55)'; ctx.lineWidth = 1.3;
      var e1 = iso(hw, hw, 0), e2 = iso(hw, hw, hz), e3 = iso(-hw, hw, hz), e4 = iso(hw, -hw, hz);
      ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.moveTo(e3[0], e3[1]); ctx.lineTo(e2[0], e2[1]); ctx.lineTo(e4[0], e4[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      var h1 = iso(-hw * 0.6, hw, hz * 0.8), h2 = iso(-hw * 0.6, hw, hz * 0.3);
      ctx.beginPath(); ctx.moveTo(h1[0], h1[1]); ctx.lineTo(h2[0], h2[1]); ctx.stroke();
      var h3 = iso(-hw * 0.5, -hw * 0.2, hz), h4 = iso(-hw * 0.1, -hw * 0.6, hz);
      ctx.beginPath(); ctx.moveTo(h3[0], h3[1]); ctx.lineTo(h4[0], h4[1]); ctx.stroke();
      // A drip running down the front edge
      if (prog > 0.05 && prog < 0.95) {
        var dy = (t * 22) % Math.max(8, hz);
        var dp = iso(hw * 0.4, hw, hz - dy);
        ctx.fillStyle = 'rgba(120,180,225,0.8)'; ctx.beginPath(); ctx.arc(dp[0], dp[1], 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      if (showHeat) {
        var mid = iso(0, 0, hz * 0.5), topP = iso(0, 0, hz);
        [[-1, -0.35], [1, -0.35], [-0.6, -1], [0.6, -1]].forEach(function (dv) {
          var len = Math.hypot(dv[0], dv[1]), ux = dv[0] / len, uy = dv[1] / len;
          var near = a * 0.75 + 6 + 28 * (1 - pulse), far = near + 34;
          var tgt = dv[1] < -0.5 ? topP : mid;
          heatWave(ctx, tgt[0] + ux * far, tgt[1] + uy * far, tgt[0] + ux * near, tgt[1] + uy * near, ha);
        });
      }
    }
  }

  /* ---------- spread: one jar, animated from before to after (IMF heat-room look) ----------
     A stateless function of time t (s). Particles live in jar coordinates: x px from the
     centre, y px above the floor, z from −1 (back wall) to +1 (front glass). Far particles are
     drawn smaller and fainter toward a vanishing point, with soft shadows on the floor.
     Each particle blends from its "before" motion to its "after" motion, staggered.
     Reduced motion: two still jars side by side (before | after). */
  var SP = { hold1: 1.6, trans: 3.0, hold2: 3.4, fade: 0.5, back: 0.62 };
  var WATER_A = ['#4f9fd8', '#d7ecfb'], CA_A = ['#8a93a6', '#eef0f5'], CL_A = ['#c9a227', '#fff1b3'];
  var N_A = ['#4152d9', '#8494ff'], H_A = ['#d5d9e3', '#ffffff'];   // same model-kit shades as the vessel
  var SPREAD = {
    dye:     { from: 'Drop', to: 'Even colour', trans: 5.0 },
    melt:    { from: 'Solid', to: 'Liquid', a: 'solid', b: 'liquid' },
    ammonia: { from: '12 gas molecules', to: '6 gas molecules', rxn: true },
    freeze:  { from: 'Liquid', to: 'Solid', a: 'liquid', b: 'solid' },
    hotpack: { from: 'Crystal in water', to: 'Dissolved', hot: true },
  };
  function tri(v, lo, hi) { var L = hi - lo, m = ((v - lo) % (2 * L) + 2 * L) % (2 * L); return lo + (m < L ? m : 2 * L - m); }

  function spread(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var spec = SPREAD[o.id] || SPREAD.melt, trans = spec.trans || SP.trans;
    var cyc = SP.hold1 + trans + SP.hold2;
    var T = (o.t || 0) % cyc;

    if (o.still) {
      var jw = Math.min((w - 54) / 2, 200), jh = Math.min(h - 90, jw * 0.95);
      jar(w / 2 - jw / 2 - 12, h / 2 + 4, jw, jh, 0, 1.2, 1);
      jar(w / 2 + jw / 2 + 12, h / 2 + 4, jw, jh, 1, 1.2, 1);
      label(ctx, spec.from, w / 2 - jw / 2 - 12, h / 2 + jh / 2 + 22, { color: INK, size: 12 });
      label(ctx, spec.to, w / 2 + jw / 2 + 12, h / 2 + jh / 2 + 22, { color: INK, size: 12 });
      arrow(ctx, w / 2 - 9, h / 2 + 4, w / 2 + 9, h / 2 + 4, INK, 2.5);
    } else {
      var k = smooth((T - SP.hold1) / trans), fadeA = Math.min(1, T / 0.3, (cyc - T) / SP.fade);
      var JW = Math.min(w * 0.66, 300), JH = Math.min(h - 84, JW * 0.78);
      jar(w / 2, h / 2 + 14, JW, JH, k, T, fadeA, T - SP.hold1, trans);
      // State names: the current one is ink and underlined
      var ty = 20, gap = 26;
      ctx.font = '700 12px ' + MONO;
      var wa = ctx.measureText(spec.from).width, wb = ctx.measureText(spec.to).width;
      var x0 = w / 2 - (wa + gap + wb) / 2;
      var onB = k > 0.5;
      label(ctx, spec.from, x0, ty, { color: onB ? DIM : INK, size: 12, align: 'left' });
      label(ctx, spec.to, x0 + wa + gap, ty, { color: onB ? INK : DIM, size: 12, align: 'left' });
      label(ctx, '→', x0 + wa + gap / 2, ty, { color: DIM, size: 12 });
      ctx.fillStyle = INK; ctx.fillRect(onB ? x0 + wa + gap : x0, ty + 9, onB ? wb : wa, 2);
    }
    return 'A jar of particles. ' + spec.from + ' changes to ' + spec.to.toLowerCase() + '.';

    // One jar centred at (cx, cy), front face jw × jh. k: 0 before → 1 after (staggered per particle).
    function jar(cx, cy, jw, jh, k, t, alpha, tIn, dur) {
      var K = SP.back, x0 = cx - jw / 2, x1 = cx + jw / 2, y0 = cy - jh / 2, y1 = cy + jh / 2;
      var bx0 = cx - jw / 2 * K, bx1 = cx + jw / 2 * K, by0 = cy - jh / 2 * K, by1 = cy + jh / 2 * K;
      var r = jw / 26;
      var P = function (x, y, z) { var s = K + (1 - K) * (z + 1) / 2; return [cx + x * s, cy + (jh / 2 - y) * s, s]; };

      // Room: back wall, side walls, floor
      ctx.fillStyle = '#f6f8fb'; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      ctx.fillStyle = '#eef1f6';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, by1); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e6eaf1';
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(29,36,51,0.12)'; ctx.lineWidth = 1;
      ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
      [[x0, y0, bx0, by0], [x1, y0, bx1, by0], [x0, y1, bx0, by1], [x1, y1, bx1, by1]].forEach(function (l) {
        ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke();
      });
      var watery = o.id === 'dye' || spec.hot;
      if (watery) { ctx.fillStyle = 'rgba(143,198,236,0.16)'; roundBox(ctx, x0, y0 + jh * 0.12, jw, jh * 0.88, 12); ctx.fill(); }

      var parts = o.id === 'dye' ? dyeParts(jw, jh, r, t, tIn, dur, k) : spec.hot ? hotParts(jw, jh, r, t, k, tIn, dur)
        : spec.rxn ? ammoniaParts(jw, jh, r, t, k, tIn, dur) : phaseParts(jw, jh, r, t, k, tIn, dur);
      ctx.save(); roundBox(ctx, x0 + 1, y0 + 1, jw - 2, jh - 2, 13); ctx.clip(); ctx.globalAlpha = alpha;
      // Soft contact shadows, fainter the higher a particle floats
      if (o.id !== 'dye') parts.forEach(function (q) {
        var fp = P(q.x, 0, q.z), sa = 0.16 * Math.max(0, 1 - q.y / (jh * 0.7));
        if (sa < 0.01) return;
        ctx.fillStyle = 'rgba(29,36,51,' + sa.toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(fp[0], fp[1], q.r * fp[2] * 0.9, q.r * fp[2] * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      });
      parts.sort(function (a, b) { return a.z - b.z; }).forEach(function (q) {
        var sp = P(q.x, q.y, q.z), rr = q.r * sp[2];
        ctx.globalAlpha = alpha * (q.a == null ? 1 : q.a) * (0.68 + 0.32 * (q.z + 1) / 2);
        if (q.soft) {
          var g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], rr);
          g.addColorStop(0, q.soft); g.addColorStop(1, 'rgba(123,75,196,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sp[0], sp[1], rr, 0, Math.PI * 2); ctx.fill();
        } else ball(ctx, sp[0], sp[1], rr, q.c[0], q.c[1]);
      });
      if (o.id === 'dye') {
        var even = smooth((k - 0.55) / 0.45);
        if (even > 0) {
          ctx.globalAlpha = alpha * even; ctx.fillStyle = 'rgba(150,110,210,0.32)';
          roundBox(ctx, x0, y0 + jh * 0.12, jw, jh * 0.88, 12); ctx.fill();
        }
      }
      ctx.restore();

      // Front glass
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; roundBox(ctx, x0, y0, jw, jh, 14); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 + 10, y0 + 16); ctx.lineTo(x0 + 10, y1 - 26); ctx.stroke();
    }

    // Per-particle blend, staggered so the change ripples through rather than snapping
    function blendK(i, n, tIn, dur, k) {
      if (tIn == null) return k;
      var st = (i / n) * 0.45 * dur;
      return smooth((tIn - st) / (dur * 0.55));
    }

    function phaseParts(jw, jh, r, t, k, tIn, dur) {
      var N = 36, out = [], rnd = rng(11);
      for (var i = 0; i < N; i++) {
        var seeds = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
        var pa = statePos(spec.a, i, seeds, jw, jh, r, t), pb = statePos(spec.b, i, seeds, jw, jh, r, t);
        var kk = blendK(i, N, tIn, dur, k);
        out.push({ x: pa.x + (pb.x - pa.x) * kk, y: pa.y + (pb.y - pa.y) * kk, z: pa.z + (pb.z - pa.z) * kk, r: r, c: WATER_A });
      }
      return out;
    }

    function statePos(state, i, sd, jw, jh, r, t) {
      if (state === 'solid') {
        var ix = i % 4, iz = Math.floor(i / 4) % 3, iy = Math.floor(i / 12);
        var j = r * 0.14;
        return { x: (ix - 1.5) * 2.1 * r + Math.sin(t * 13 + i) * j, y: r + iy * 2.05 * r + Math.sin(t * 11 + i * 2.3) * j, z: (iz - 1) * 0.42 + Math.sin(t * 9 + i) * 0.02 };
      }
      if (state === 'liquid') {
        return { x: (sd[0] * 2 - 1) * (jw / 2 - r * 2.2) * 0.85 + Math.sin(t * 0.9 + sd[3] * 6) * r * 1.4,
          y: r + sd[1] * jh * 0.16 + Math.abs(Math.sin(t * 1.3 + sd[4] * 6)) * r * 0.4,
          z: (sd[2] * 2 - 1) * 0.8 + Math.sin(t * 0.7 + sd[5] * 6) * 0.12 };
      }
      // gas: straight-line flight with bounces off the walls
      var v = 55 + sd[6] * 45, a = sd[7] * Math.PI * 2;
      return { x: tri((sd[0] * 2 - 1) * jw * 0.4 + Math.cos(a) * v * t, -(jw / 2 - r * 1.2), jw / 2 - r * 1.2),
        y: tri(r + sd[1] * (jh - 2 * r) + Math.sin(a) * v * 0.8 * t, r, jh - r * 1.2),
        z: tri(sd[2] * 1.8 - 0.9 + (sd[3] - 0.5) * 0.5 * t, -0.9, 0.9) };
    }

    function dyeParts(jw, jh, r, t, tIn, dur, k) {
      var N = 120, out = [], rnd = rng(23), even = smooth((k - 0.55) / 0.45);
      for (var i = 0; i < N; i++) {
        var sx = rnd(), sy = rnd(), sz = rnd(), ph = rnd() * 6, ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd());
        var kk = tIn == null ? k : smooth((tIn - rnd() * 0.25 * dur) / (dur * 0.8));
        // The drop falls in just before the spreading starts
        var fall = tIn == null ? 1 : smooth((tIn + 0.7) / 0.7);
        var dx = Math.cos(ang) * rad * r * 1.3, dz = Math.sin(ang) * rad * 0.12;
        var dropY = jh * 1.05 - (jh * 0.25) * fall + Math.sin(ang) * rad * r;
        var ex = (sx * 2 - 1) * (jw / 2 - r * 1.5), ey = r + sy * (jh * 0.86 - 2 * r), ez = sz * 1.8 - 0.9;
        var wob = r * 0.9 * kk;
        out.push({
          x: dx + (ex - dx) * kk + Math.sin(t * 1.1 + ph) * wob,
          y: dropY + (ey - dropY) * kk + Math.cos(t * 0.9 + ph) * wob,
          z: dz + (ez - dz) * kk,
          r: r * (0.9 + 2.8 * kk), soft: 'rgba(123,75,196,' + ((0.85 - 0.6 * kk) * (1 - even)).toFixed(3) + ')', a: fall > 0.02 ? 1 : 0,
        });
      }
      return out;
    }

    // N₂ + 3H₂ → 2NH₃, three times over: 12 gas molecules re-pair into 6. Atoms keep their colours.
    function ammoniaParts(jw, jh, r, t, k, tIn, dur) {
      var out = [], rnd = rng(41), rN = r * 1.2, rH = r * 0.75;
      var seedsOf = function () { return [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()]; };
      var before = [], after = [], m, u;
      for (m = 0; m < 12; m++) before.push(seedsOf());          // 0–2: N₂, 3–11: H₂
      for (u = 0; u < 6; u++) after.push(seedsOf());            // NH₃
      function centre(sd, i, tt) { return statePos('gas', i, sd, jw, jh, r * 1.6, tt); }
      function spin(sd, tt) { return sd[4] * 6.3 + tt * (0.8 + sd[5]); }
      // Atom position inside a diatomic (side ±1) or NH₃ (slot −1 = N, 0–2 = H)
      function inPair(c, sd, side, d, tt) { var a = spin(sd, tt); return { x: c.x + Math.cos(a) * d * side, y: c.y + Math.sin(a) * d * side * 0.7, z: c.z + Math.sin(a) * 0.04 * side }; }
      function inNH3(c, sd, slot, tt) {
        if (slot < 0) return { x: c.x, y: c.y, z: c.z };
        var v = tetraDirs(spin(sd, tt), 0.5)[slot];                // trigonal pyramid: lone pair on the 4th
        return { x: c.x + v.x * rN * 1.3, y: c.y - v.y * rN * 1.3, z: c.z + v.z * 0.08 };
      }
      function push(p, q, kk, rad, col) {
        out.push({ x: p.x + (q.x - p.x) * kk, y: p.y + (q.y - p.y) * kk, z: p.z + (q.z - p.z) * kk, r: rad, c: col });
      }
      var ta = t * 0.7;                                          // fewer, heavier molecules drift slower
      for (var n = 0; n < 6; n++) {                              // N atoms: N₂ #floor(n/2) → NH₃ #n
        var sdB = before[Math.floor(n / 2)], sdA = after[n];
        var p = inPair(centre(sdB, n, t), sdB, n % 2 ? 1 : -1, rN * 0.85, t);
        var q = inNH3(centre(sdA, 20 + n, ta), sdA, -1, ta);
        push(p, q, blendK(n, 6, tIn, dur, k), rN, N_A);
      }
      for (var j = 0; j < 18; j++) {                             // H atoms: H₂ #floor(j/2) → NH₃ #floor(j/3)
        var sdB2 = before[3 + Math.floor(j / 2)], un = Math.floor(j / 3), sdA2 = after[un];
        var p2 = inPair(centre(sdB2, 3 + j, t), sdB2, j % 2 ? 1 : -1, rH * 0.75, t);
        var q2 = inNH3(centre(sdA2, 20 + un, ta), sdA2, j % 3, ta);
        push(p2, q2, blendK(un, 6, tIn, dur, k), rH, H_A);
      }
      return out;
    }

    function hotParts(jw, jh, r, t, k, tIn, dur) {
      var out = [], rnd = rng(31);
      // 4 Ca²⁺ + 8 Cl⁻ in a small crystal on the floor → spread through the water
      var ions = [];
      for (var i = 0; i < 12; i++) {
        var ix = i % 3, iz = Math.floor(i / 3) % 2, iy = Math.floor(i / 6);
        var ca = i % 3 === 1;
        var sd = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
        var a = { x: (ix - 1) * 2.05 * r + Math.sin(t * 12 + i) * r * 0.1, y: r + iy * 2.05 * r, z: (iz - 0.5) * 0.4 };
        var gs = statePos('gas', i, sd, jw * 0.8, jh * 0.85, r, t * 0.35);
        var kk = blendK(i, 12, tIn, dur, k);
        var p = { x: a.x + (gs.x - a.x) * kk, y: a.y + (gs.y + r - a.y) * kk, z: a.z + (gs.z - a.z) * kk, r: ca ? r * 0.9 : r * 1.05, c: ca ? CA_A : CL_A, ca: ca, kk: kk };
        ions.push(p); out.push(p);
      }
      var cas = ions.filter(function (q) { return q.ca; });
      // 30 water molecules: free in the water before; after, 24 of them sit in tight shells around Ca²⁺
      for (var m = 0; m < 30; m++) {
        var sd2 = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
        var free = statePos('gas', m + 40, sd2, jw * 0.95, jh * 0.86, r * 0.6, t * 0.4);
        var host = m < 24 ? cas[m % 4] : null, kk2 = host ? host.kk : 0;
        var q = { x: free.x, y: free.y, z: free.z, r: r * 0.58, c: WATER_A };
        if (host && kk2 > 0) {
          var slot = Math.floor(m / 4), ang = slot / 6 * Math.PI * 2 + t * 0.8;
          var sx = host.x + Math.cos(ang) * r * 1.55, sy = host.y + Math.sin(ang) * r * 1.55, sz = host.z + Math.sin(ang * 2) * 0.05;
          q.x += (sx - q.x) * kk2; q.y += (sy - q.y) * kk2; q.z += (sz - q.z) * kk2;
        }
        out.push(q);
      }
      return out;
    }
  }

  /* ---------- coldpack: stepped story of two pulls ----------
     o.step 0–3, o.t = seconds since the step began.
       0  solid NH₄NO₃ sits in water          1  it dissolves; heat flows in from the water; it cools
       2  ΔH +: the reverse half-arrow (←) lights up, pointing at the reactants
       3  ΔS +: the forward half-arrow (→) lights up too, pointing at the products
     The equation's two half-arrows carry the two pulls, so they visibly point opposite ways. */
  var O_A = ['#e0503a', '#ff8a6a'];
  function coldpack(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var step = o.step || 0, t = o.still ? 6 : (o.t || 0);
    var dis = step === 0 ? 0 : step === 1 ? smooth((t - 0.6) / 3.0) : 1;   // 0 crystal → 1 dissolved

    // Equation with an equilibrium double arrow drawn as two half-arrows
    var ey = 34;
    ctx.font = '700 15px ' + BODY;
    var L = 'NH₄NO₃(s)', Rt = 'NH₄⁺(aq) + NO₃⁻(aq)', aw = 78, gap = 12;
    var wl = ctx.measureText(L).width, wr = ctx.measureText(Rt).width;
    var x0 = (w - (wl + gap + aw + gap + wr)) / 2, ax0 = x0 + wl + gap, ax1 = ax0 + aw;
    label(ctx, L, x0, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    label(ctx, Rt, ax1 + gap, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    function halfArrow(y, right, col, lw) {
      var tip = right ? ax1 : ax0, tail = right ? ax0 : ax1, dir = right ? 1 : -1, barb = right ? -1 : 1;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * (6 + lw * 1.6), y + barb * (5 + lw * 1.4)); ctx.stroke();
    }
    var onH = step >= 2, onS = step >= 3;
    halfArrow(ey - 4, true, onS ? TIDE : INK, onS ? 4 : 1.8);      // forward  →
    halfArrow(ey + 4, false, onH ? EMBER : INK, onH ? 4 : 1.8);    // reverse  ←
    if (onS) label(ctx, 'ΔS +', (ax0 + ax1) / 2, ey - 20, { color: TIDE, size: 12 });
    if (onH) label(ctx, 'ΔH +', (ax0 + ax1) / 2, ey + 22, { color: EMBER, size: 12 });

    // Beaker
    var bw = Math.min(w * 0.46, 210), bh = Math.min(h - 130, 176);
    var G = beakerGeom((w - bw) / 2 - 16, 96, bw, bh);
    var cool = step === 0 ? 0 : dis;
    beakerBack(ctx, G, mix('#ddeefa', '#9fcbee', cool));

    // Ions: a 4 × 2 crystal on the floor → spread through the water, drifting
    var r = Math.max(5, bw / 30), rnd = rng(61), floorY = G.bb - r - 2;
    var spreadMore = step >= 3 ? 1.35 : 1;
    for (var i = 0; i < 8; i++) {
      var col = i % 4, row = Math.floor(i / 4), nh4 = (col + row) % 2 === 0;
      var cx0 = G.cx - 16 + (col - 1.5) * 3.1 * r, cy0 = floorY - row * 2.9 * r;
      var vib = Math.sin(t * 12 + i) * r * 0.08 * (1 - dis);
      var sx = rnd(), sy = rnd(), ph = rnd() * 6;
      var tx = G.bx + 26 + sx * (G.bw - 66), ty = G.wt + G.ry + 12 + sy * (G.bb - G.wt - G.ry - 26);
      var drift = dis * r * 1.6 * spreadMore;
      var x = cx0 + (tx - cx0) * dis + Math.sin(t * 0.8 + ph) * drift + vib;
      var y = cy0 + (ty - cy0) * dis + Math.cos(t * 0.6 + ph) * drift * 0.6;
      var rot = t * 0.6 * dis + ph;
      if (nh4) {                                   // NH₄⁺: N with four H, tetrahedral; H behind the N drawn first
        var hs = tetraDirs(rot, 0.55 + 0.25 * Math.sin(rot * 0.7));
        hs.forEach(function (v) { if (v.z < 0) ball(ctx, x + v.x * r * 1.1, y + v.y * r * 1.1, r * 0.55 * (1 + 0.15 * v.z), '#d5d9e3', '#ffffff'); });
        ball(ctx, x, y, r, '#4152d9', '#8494ff');
        hs.forEach(function (v) { if (v.z >= 0) ball(ctx, x + v.x * r * 1.1, y + v.y * r * 1.1, r * 0.55 * (1 + 0.15 * v.z), '#d5d9e3', '#ffffff'); });
      } else {                                     // NO₃⁻: N with three O
        ball(ctx, x, y, r * 0.85, '#4152d9', '#8494ff');
        for (var q3 = 0; q3 < 3; q3++) { var a3 = rot + q3 * Math.PI * 2 / 3; ball(ctx, x + Math.cos(a3) * r * 1.05, y + Math.sin(a3) * r * 0.75, r * 0.72, O_A[0], O_A[1]); }
      }
    }

    // Thermometer: drops as it dissolves
    var tTop = G.by - 40;
    thermometer(ctx, G.bx + G.bw - 30, tTop, G.bb - 12, 0.62 - 0.32 * cool);
    beakerFront(ctx, G);

    // Heat flowing in from the water toward the dissolving ions (steps 1 and 2)
    if ((step === 1 && dis > 0.02 && dis < 0.99) || step === 2) {
      var pulse = o.still ? 0.55 : (t % 1.3) / 1.3, ha = o.still ? 1 : Math.sin(Math.PI * pulse);
      var hx = G.cx - 16, hy = G.bb - 34;
      [[-1, -0.3], [1, -0.3], [-0.6, -1], [0.6, -1]].forEach(function (dv) {
        var len = Math.hypot(dv[0], dv[1]), ux = dv[0] / len, uy = dv[1] / len;
        var near = 26 + 26 * (1 - pulse), far = near + 30;
        heatWave(ctx, hx + ux * far, hy + uy * far * 0.8, hx + ux * near, hy + uy * near * 0.8, ha);
      });
    }

    return ['Solid ammonium nitrate sits in a beaker of water.',
      'It dissolves. The ions spread through the water and the thermometer drops.',
      'Heat flows in from the water, so ΔH is positive. The reverse arrow, pointing at the reactants, is highlighted.',
      'The ions are more spread out, so ΔS is positive. The forward arrow, pointing at the products, is highlighted. The two arrows point opposite ways.'][step];
  }

  /* ---------- gibbs4: the four sign cases, before temperature comes in ----------
     o.idx 0–3 picks the case; o.t = seconds since it was picked (bars grow in).
     Shows ΔG = ΔH − TΔS, the example equation with ⇌, one arrow per term pointing at the
     side that term favours, and waterfall bars (ΔH, −TΔS, ΔG) with + / − glyphs, no numbers.
     When the terms push opposite ways ΔG is drawn as a dashed "?": it depends which is bigger. */
  var G4 = [
    { dH: '−', dS: '+', L: '2H₂O₂(l)', R: '2H₂O(l) + O₂(g)', h: -0.55, s: -0.42 },
    { dH: '+', dS: '−', L: '3O₂(g)', R: '2O₃(g)', h: 0.55, s: 0.42 },
    { dH: '−', dS: '−', L: 'N₂(g) + 3H₂(g)', R: '2NH₃(g)', h: -0.6, s: 0.45 },
    { dH: '+', dS: '+', L: 'NH₄NO₃(s)', R: 'NH₄⁺(aq) + NO₃⁻(aq)', h: 0.45, s: -0.6 },
  ];
  function gibbs4(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var c = G4[o.idx || 0], t = o.still ? 9 : (o.t || 0);
    var kBars = smooth(t / 0.6), kG = smooth((t - 0.5) / 0.5), kArr = smooth(t / 0.4);
    var hFwd = c.dH === '−', sFwd = c.dS === '+';
    var verdict = hFwd === sFwd ? (hFwd ? 'f' : 'r') : '?';

    // ΔG = ΔH − TΔS, each part in its colour
    ctx.font = '700 17px ' + BODY;
    var fp = [['ΔG', INK], [' = ', INK], ['ΔH', EMBER], [' − TΔS', TIDE]];
    var fw = fp.reduce(function (a, q) { return a + ctx.measureText(q[0]).width; }, 0), fx = (w - fw) / 2;
    fp.forEach(function (q) { label(ctx, q[0], fx, 22, { font: BODY, size: 17, color: q[1], align: 'left' }); fx += ctx.measureText(q[0]).width; });

    // The equation with an equilibrium double arrow
    // Heat is a term: products side when heat comes out (ΔH −), reactants side when it goes in (ΔH +)
    var ey = 66, aw = 64, gap = 20, HEAT = ' + heat';
    ctx.font = '700 15px ' + BODY;
    var hw = ctx.measureText(HEAT).width, heatL = c.dH === '+', heatR = c.dH === '−';
    var wl = ctx.measureText(c.L).width + (heatL ? hw : 0), wr = ctx.measureText(c.R).width + (heatR ? hw : 0);
    var x0 = (w - (wl + gap + aw + gap + wr)) / 2, ax0 = x0 + wl + gap, ax1 = ax0 + aw, xr = ax1 + gap;
    // Favoured side gets a soft ink pill once ΔG has settled
    if (verdict !== '?' && kG > 0) {
      ctx.save(); ctx.globalAlpha = kG;
      ctx.fillStyle = 'rgba(29,36,51,0.08)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      if (verdict === 'f') roundBox(ctx, xr - 7, ey - 15, wr + 14, 30, 15); else roundBox(ctx, x0 - 7, ey - 15, wl + 14, 30, 15);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    label(ctx, c.L, x0, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    label(ctx, c.R, xr, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    if (heatL) label(ctx, HEAT, x0 + wl - hw, ey, { font: BODY, size: 15, color: EMBER, align: 'left' });
    if (heatR) label(ctx, HEAT, xr + wr - hw, ey, { font: BODY, size: 15, color: EMBER, align: 'left' });
    function half(y, right, lw, col) {
      var tip = right ? ax1 : ax0, tail = right ? ax0 : ax1, dir = right ? 1 : -1, barb = right ? -1 : 1;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * (6 + lw * 1.6), y + barb * (5 + lw * 1.4)); ctx.stroke();
    }
    var fwdBold = verdict === 'f' && kG > 0.5, revBold = verdict === 'r' && kG > 0.5;
    half(ey - 4, true, fwdBold ? 3.4 : 1.8, verdict === 'r' && kG > 0.5 ? FAINT : INK);
    half(ey + 4, false, revBold ? 3.4 : 1.8, verdict === 'f' && kG > 0.5 ? FAINT : INK);

    // One arrow per term toward the side it favours; both labels sit in one column under the ⇌
    var mx = (ax0 + ax1) / 2, reach = Math.min(110, w * 0.26);
    ctx.font = '700 13px ' + MONO;
    var lab = Math.max(ctx.measureText('ΔH ' + c.dH).width, ctx.measureText('ΔS ' + c.dS).width) / 2 + 8;
    [[c.dH, hFwd, EMBER, 'ΔH ' + c.dH, 100], [c.dS, sFwd, TIDE, 'ΔS ' + c.dS, 126]].forEach(function (q) {
      var y = q[4], dir = q[1] ? 1 : -1, from = mx + dir * lab, tip = from + dir * reach * kArr;
      ctx.save(); ctx.globalAlpha = kArr;
      arrow(ctx, from, y, tip, y, q[2], 4);
      label(ctx, q[3], mx, y, { color: q[2], size: 13 });
      ctx.restore();
    });

    // Waterfall bars: ΔH, then −TΔS from where ΔH ends, then ΔG from zero
    var top = 150, bot = h - 26, mid = (top + bot) / 2, unit = (bot - top) / 2 / 1.1;
    var gw = Math.min(w * 0.6, 270), L0 = (w - gw) / 2 + 16, slot = (gw - 16) / 3, bw = Math.min(52, slot * 0.58);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L0 - 6, mid); ctx.lineTo(L0 + gw - 16, mid); ctx.stroke();
    label(ctx, '+', L0 - 20, top + 8, { size: 12 }); label(ctx, '0', L0 - 20, mid, { size: 12 }); label(ctx, '−', L0 - 20, bot - 8, { size: 12 });
    var hv = c.h * kBars, sv = c.s * kBars;
    var cols = [
      { name: 'ΔH', from: 0, to: hv, fill: EMBER, k: kBars },
      { name: '−TΔS', from: hv, to: hv + sv, fill: TIDE, k: kBars },
      { name: 'ΔG', from: 0, to: hv + sv, fill: INK, k: kG, unknown: verdict === '?' },
    ];
    cols.forEach(function (b, i) {
      var x = L0 + slot * i + (slot - bw) / 2;
      label(ctx, b.name, x + bw / 2, h - 10, { size: 11 });
      if (b.k <= 0) return;
      ctx.save(); ctx.globalAlpha = b.k;
      if (b.unknown) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        roundBox(ctx, x, mid - unit * 0.45, bw, unit * 0.9, 5); ctx.stroke(); ctx.setLineDash([]);
        label(ctx, '?', x + bw / 2, mid, { color: INK, size: 22 });
        ctx.restore(); return;
      }
      var y0 = mid - b.from * unit, y1 = mid - b.to * unit, tp = Math.min(y0, y1), hh = Math.max(2, Math.abs(y1 - y0));
      ctx.fillStyle = b.fill; roundBox(ctx, x, tp, bw, hh, 5); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      if (i === 0) {
        ctx.setLineDash([2, 3]); ctx.strokeStyle = DIM; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + bw, y1); ctx.lineTo(x + slot, y1); ctx.stroke(); ctx.setLineDash([]);
      }
      var up = b.to - b.from >= 0;
      label(ctx, up ? '+' : '−', x + bw / 2, up ? tp - 9 : tp + hh + 9, { color: INK, size: 14 });
      ctx.restore();
    });

    var side = { f: 'the products are favoured', r: 'the reactants are favoured', '?': 'the sign of ΔG depends on which term is bigger' }[verdict];
    return c.L + ' to ' + c.R + '. ΔH is ' + (c.dH === '+' ? 'positive' : 'negative') + ', pushing toward the ' + (hFwd ? 'products' : 'reactants') +
      '. ΔS is ' + (c.dS === '+' ? 'positive' : 'negative') + ', pushing toward the ' + (sFwd ? 'products' : 'reactants') + '. So ' + side + '.';
  }

  /* ---------- paths: state function picture ---------- */
  function paths(canvas) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var L = 46, R = w - 24, top = 30, bot = h - 40;
    var yStart = bot - (bot - top) * 0.15, yEnd = top + (bot - top) * 0.25, yMid = top + (bot - top) * 0.02;
    ctx.strokeStyle = 'rgba(29,36,51,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L, top - 8); ctx.lineTo(L, bot); ctx.lineTo(R, bot); ctx.stroke();
    ctx.save(); ctx.translate(16, (top + bot) / 2); ctx.rotate(-Math.PI / 2); label(ctx, 'enthalpy H →', 0, 0, { size: 11 }); ctx.restore();
    var xs = L + 30, xe = R - 40;
    function level(x, y, text) {
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.stroke();
      label(ctx, text, x, y + 16, { color: INK, size: 11 });
    }
    level(xs, yStart, 'start');
    level(xe, yEnd, 'end');
    // Route 1: one step (solid ink)
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(xs + 30, yStart); ctx.bezierCurveTo(xs + 120, yStart, xe - 120, yEnd, xe - 30, yEnd); ctx.stroke();
    // Route 2: two steps through a high point (dashed)
    var xm = (xs + xe) / 2;
    ctx.setLineDash([6, 5]); ctx.strokeStyle = DIM;
    ctx.beginPath(); ctx.moveTo(xs + 30, yStart); ctx.lineTo(xm - 28, yMid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xm + 28, yMid); ctx.lineTo(xe - 30, yEnd); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = DIM; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xm - 26, yMid); ctx.lineTo(xm + 26, yMid); ctx.stroke();
    label(ctx, 'route 2 (two steps)', xm, yMid - 12, { size: 11 });
    label(ctx, 'route 1 (one step)', xm + 16, (yStart + yEnd) / 2 + 30, { size: 11, color: INK, align: 'left' });
    // ΔH bracket at the right: same for both routes
    var bx = xe + 36;
    arrow(ctx, bx, yStart, bx, yEnd + 2, EMBER, 3);
    ctx.strokeStyle = 'rgba(29,36,51,0.3)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xs + 30, yStart); ctx.lineTo(bx, yStart); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, 'ΔH', bx - 6, (yStart + yEnd) / 2, { color: INK, size: 12, align: 'right' });
    label(ctx, 'Same ΔH either way', w / 2, h - 14, { color: INK, size: 12 });
  }

  /* ---------- energy: animated potential energy diagram (exo / endo) ----------
     A stateless function of time t (s). One group of molecules crosses together.
     Exo: A₂ + B₂ climb, pause at the top while the atoms loosen into the activated complex
     and re-pair as 2AB, slide down faster and give off heat. Endo: 2AB → A₂ + B₂, settling
     higher while heat flows in. ΔH arrow joins the two shelves. No numbers. */
  var EN = { start: 1.0, climb: 2.0, top: 0.8, fall: 0.7, puff: 2.0, hold: 2.4, fade: 0.5 };
  var ATOM_A = ['#4f9fd8', '#d7ecfb'], ATOM_B = ['#8a93a6', '#eef0f5'];
  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function shelves(mode) { return mode === 'endo' ? { r: 0.18, p: 0.56, pk: 0.9 } : { r: 0.56, p: 0.18, pk: 0.9 }; }
  function energyAt(L, x) {
    var a = 0.33, b = 0.67;
    if (x <= a) return L.r;
    if (x >= b) return L.p;
    if (x <= 0.5) return L.r + (L.pk - L.r) * smooth((x - a) / (0.5 - a));
    return L.pk + (L.p - L.pk) * smooth((x - 0.5) / (b - 0.5));
  }
  function energyCycle() { return EN.start + EN.climb + EN.top + EN.fall + EN.puff + EN.hold; }

  function squiggle(ctx, x, y1, y2, alpha) {
    // Wavy ember heat arrow from y1 to y2 (arrowhead at y2)
    var up = y2 < y1, len = Math.abs(y2 - y1), dir = up ? -1 : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.strokeStyle = EMBER; ctx.fillStyle = EMBER; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    var waves = Math.max(3, len / 13), steps = Math.ceil(waves * 6);
    for (var k = 0; k <= steps; k++) {
      var yy = y1 + dir * len * (k / steps) * 0.82, xx = x + Math.sin(k / steps * Math.PI * waves) * 3.2;
      if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 4.5, y2 - dir * 7); ctx.lineTo(x + 4.5, y2 - dir * 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function energy(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var mode = o.mode === 'endo' ? 'endo' : 'exo', L = shelves(mode);
    var PL = 46, PR = w - 74, top = 62, bot = h - 52, pw = PR - PL;
    var X = function (x) { return PL + x * pw; };
    var Y = function (e) { return bot - e * (bot - top); };
    var r = Math.max(5, Math.min(8.5, pw / 50));

    // Time within the loop; reduced motion shows one still frame (products settled, heat moving)
    var cyc = energyCycle(), tLand = EN.start + EN.climb + EN.top + EN.fall;
    var t = o.still ? tLand + EN.puff * 0.45 : (o.t || 0) % cyc;
    var fadeA = o.still ? 1 : Math.min(1, t / 0.3, (cyc - t) / EN.fade);

    // Axes
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PL - 14, top - 18); ctx.lineTo(PL - 14, bot + 10); ctx.lineTo(PR + 8, bot + 10); ctx.stroke();
    ctx.save(); ctx.translate(PL - 28, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
    label(ctx, 'potential energy →', 0, 0, { size: 11 }); ctx.restore();
    label(ctx, 'reaction progress →', (PL + PR) / 2, h - 12, { size: 11 });
    label(ctx, 'reactants', X(0.15), bot + 26, { color: INK, size: 11 });
    label(ctx, 'products', X(0.85), bot + 26, { color: INK, size: 11 });

    // Guide lines at each shelf, out to the ΔH arrow
    var yr = Y(L.r), yp = Y(L.p), yk = Y(L.pk), ax = PR + 22;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(X(0.33), yr); ctx.lineTo(ax + 8, yr); ctx.moveTo(X(0.67), yp); ctx.lineTo(ax + 8, yp); ctx.stroke();
    ctx.setLineDash([]);

    // Eₐ: faint, from the reactant shelf up to the top of the hill
    var ex = X(0.5);
    ctx.strokeStyle = DIM; ctx.fillStyle = DIM; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(ex, yr); ctx.lineTo(ex, yk + 2); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, 'Eₐ', ex + 6, (yr + yk) / 2 + 6, { size: 11, align: 'left', weight: '400' });

    // The curve
    ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 120; i++) { var xx = i / 120; if (i) ctx.lineTo(X(xx), Y(energyAt(L, xx))); else ctx.moveTo(X(xx), Y(energyAt(L, xx))); }
    ctx.stroke();
    label(ctx, 'activated complex', ex, yk - 5.2 * r - 14, { color: INK, size: 11 });

    // Molecules: two columns, each holding four atoms. Pairing is shown by spacing:
    // A₂ / B₂ = tight horizontal pairs (A₂ below, B₂ above); AB = tight vertical pairs.
    // The atoms never move far, only the pairing changes. Halfway, all four sit in a loose
    // square: the activated complex.
    var x0 = 0.165, x1 = 0.835, off = 2.75 * r / pw;
    var sg = t - EN.start, gx, k;   // group position (progress) and re-pairing 0 → 1
    if (sg < 0) { gx = x0; k = 0; }
    else if (sg < EN.climb) { gx = x0 + (0.5 - x0) * smooth(sg / EN.climb); k = 0; }
    else if (sg < EN.climb + EN.top) { gx = 0.5; k = smooth((sg - EN.climb) / EN.top); }
    else if (sg < EN.climb + EN.top + EN.fall) { var u = (sg - EN.climb - EN.top) / EN.fall; gx = 0.5 + (x1 - 0.5) * u * u; k = 1; }
    else { gx = x1; k = 1; }

    // The whole group stays level, resting on the highest point of the curve beneath it
    var lift = function (px) { return Y(energyAt(L, (px - PL) / pw)) - r - 2; };
    function groupBase(cxp) {
      var span = off * pw + 1.35 * r, b = Infinity;
      for (var i2 = 0; i2 <= 12; i2++) b = Math.min(b, lift(X(cxp) - span + 2 * span * i2 / 12));
      return b;
    }
    function column(cxp, kk, alpha, phase, base) {
      var horiz = mode === 'exo' ? 1 - kk : kk;           // 1 = A₂ / B₂ pairing, 0 = AB pairing
      var dx = r * (1.35 - 0.73 * horiz), dy = r * (1.24 + 1.86 * horiz);
      var j = o.still ? 0 : Math.sin(t * 6 + phase) * 1.1;
      var xl = X(cxp) - dx, xr2 = X(cxp) + dx;
      var A1 = [xl, base + j], A2 = [xr2, base - j];
      var B1 = [xl, A1[1] - dy - j], B2 = [xr2, A2[1] - dy + j];
      ctx.save(); ctx.globalAlpha = alpha;
      var mid = Math.sin(Math.PI * kk);
      if (mid > 0.02) {
        ctx.strokeStyle = 'rgba(29,36,51,' + (0.7 * mid).toFixed(3) + ')'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(A1[0], A1[1]); ctx.lineTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(B1[0], B1[1]); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]);
      }
      [B1, B2].forEach(function (b) { ball(ctx, b[0], b[1], r, ATOM_B[0], ATOM_B[1]); });
      [A1, A2].forEach(function (a) { ball(ctx, a[0], a[1], r, ATOM_A[0], ATOM_A[1]); });
      ctx.restore();
      return Math.min(B1[1], B2[1]) - r;                   // top of the column
    }

    if (o.still) { var b0 = groupBase(x0); column(x0 - off, 0, 0.3, 0, b0); column(x0 + off, 0, 0.3, 0, b0); }
    var gb = groupBase(gx);
    var topY = Math.min(column(gx - off, k, fadeA, 0, gb), column(gx + off, k, fadeA, 2.1, gb));

    // Heat leaving (exo) or coming in (endo) once the group settles
    var p = (t - tLand) / EN.puff;
    if (p >= 0 && p <= 1) {
      var a = Math.min(1, Math.sin(Math.PI * Math.min(1, p * 1.1)) * 1.6);
      ctx.save(); ctx.globalAlpha = a;
      // Exo: heat rises off the products. Endo: heat fills the ΔH gap, rising from the
      // reactant level up to the underside of the products shelf.
      if (mode === 'exo') label(ctx, 'heat out', X(x1), topY - 66, { color: EMBER, size: 11 });
      else label(ctx, 'heat in', X(x1), yr + 14, { color: EMBER, size: 11 });
      ctx.restore();
      for (var q = -1; q <= 1; q++) {
        var hx = X(x1) + q * r * 2.4;
        if (mode === 'exo') squiggle(ctx, hx, topY - 4 - p * 14, topY - 28 - p * 24, a);
        else squiggle(ctx, hx, yr - 4, yr - 16 - (yr - yp - 22) * smooth(p * 1.4), a);
      }
    }

    // ΔH arrow between the shelves, once the products have settled
    var ha = o.still ? 1 : smooth((t - tLand) / 0.6) * fadeA;
    if (ha > 0) {
      ctx.save(); ctx.globalAlpha = ha;
      arrow(ctx, ax, yr, ax, yp, EMBER, 3);
      label(ctx, 'ΔH', ax + 10, (yr + yp) / 2 - 8, { color: INK, size: 13, align: 'left' });
      label(ctx, mode === 'exo' ? '−' : '+', ax + 10, (yr + yp) / 2 + 9, { color: INK, size: 15, align: 'left' });
      ctx.restore();
    }
  }
  energy.cycle = energyCycle;

  /* ---------- equation card ---------- */
  function equation(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    label(ctx, o.title || '', w / 2, h * 0.3, { font: BODY, weight: '700', size: 18, color: INK });
    var size = Math.min(26, Math.max(14, w / Math.max(10, (o.eq || '').length) * 1.5));
    label(ctx, o.eq || '', w / 2, h * 0.52, { font: BODY, weight: '700', size: size, color: INK });
    if (o.note) label(ctx, o.note, w / 2, h * 0.72, { size: 11 });
  }

  global.EqPictures = { energy: energy, beaker: beaker, spread: spread, coldpack: coldpack, gibbs4: gibbs4, paths: paths, equation: equation };
  // Shared drawing helpers for the live scenes (eq-scenes.js)
  global.EqPictures.util = { fit: fit, ball: ball, label: label, roundBox: roundBox, arrow: arrow, mix: mix, rng: rng, smooth: smooth,
    INK: INK, DIM: DIM, FAINT: FAINT, EMBER: EMBER, TIDE: TIDE, MONO: MONO, BODY: BODY };
})(window);
