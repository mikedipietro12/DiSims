/**
 * Intro to Equilibrium - Guide stage pictures (Task 6).
 *
 * Small drawn scenes for the Guide's non-vessel beats:
 *   intro4 - four changes side by side: two go to completion, two reach equilibrium
 *   energy - animated potential energy diagram, exothermic or endothermic
 *   beaker - NaOH dissolving in a beaker (with thermometer), or an ice cube melting into a puddle
 *   spread - one jar animated from before to after (IMF heat-room look); food colouring spreading
 *   gibbs4 - the four ΔH / ΔS sign cases: term arrows on the equation + waterfall bars
 *   favour - which side ΔH or ΔS favours: energy shelves, or ordered vs spread out
 *   coldpack - stepped cold pack story: dissolving, then ΔH ← and ΔS → on the equation's half-arrows
 *   paths  - two routes between the same start and end (state functions)
 *   kpuzzle - stepped: a guessed rate law fails an initial-rates test, yet K uses the coefficients
 *   kderive - stepped algebra: equal forward and reverse rates rearrange into K (N₂O₄ ⇌ 2NO₂)
 *   kmulti - stepped algebra: a two-step mechanism's K₁ × K₂ cancels down to the overall K
 *   kmass  - summary: the law of mass action, for N₂O₄ ⇌ 2NO₂ and for aA + bB ⇌ cC + dD
 *   kmanip - stepped algebra: add equations → multiply K's; reverse an equation → 1/K
 *   kpure  - stepped algebra: solids and pure liquids are left out of K; gases and (aq) stay in
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
    // Plain white tray, as in the vessel (no dot grid: repo rule)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
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
     Shows ΔG = ΔH − TΔS, the example equation (⇌ turns into a single → or ← once ΔG has a sign),
     one arrow per term pointing at the side that term favours (labelled), and waterfall bars (ΔH, −TΔS, ΔG) with + / − glyphs, no numbers.
     When the terms push opposite ways ΔG is drawn as a dashed "?": it depends which is bigger. */
  var G4 = [
    { dH: '−', dS: '+', L: 'C₃H₈(g) + 5O₂(g)', R: '3CO₂(g) + 4H₂O(g)', h: -0.55, s: -0.42 },
    { dH: '+', dS: '−', L: 'N₂(g) + 2O₂(g)', R: '2NO₂(g)', h: 0.55, s: 0.42 },
    { dH: '−', dS: '−', L: 'N₂(g) + 3H₂(g)', R: '2NH₃(g)', h: -0.6, s: 0.45 },
    { dH: '+', dS: '+', L: 'NH₄NO₃(s)', R: 'NH₄⁺(aq) + NO₃⁻(aq)', h: 0.45, s: -0.6 },
  ];
  function gibbs4(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var c = G4[o.idx || 0], t = o.still ? 9 : (o.t || 0);
    var kBars = smooth(t / 0.6), kG = smooth((t - 0.5) / 0.5), kArr = smooth(t / 0.4);
    var hFwd = c.dH === '−', sFwd = c.dS === '+';
    var verdict = hFwd === sFwd ? (hFwd ? 'f' : 'r') : '?';

    // Wide canvas (Learn mode, projector): equation + term arrows on the left, big bars on the right.
    // Narrow canvas (side panel): everything stacked, bars underneath.
    var wide = w >= 640 && w / h > 1.6;
    var lx0 = wide ? 12 : 0, lx1 = wide ? w * 0.55 : w, lw = lx1 - lx0, lmid = (lx0 + lx1) / 2;
    var S = wide
      ? { fm: 28, eq: 21, term: 18, note: 14, aw: 86, gap: 22, fy: h * 0.15, ey: h * 0.38, ay: [h * 0.62, h * 0.84], reach: Math.min(170, lw * 0.3), stroke: 5 }
      : { fm: 17, eq: 15, term: 13, note: 10, aw: 64, gap: 20, fy: 22, ey: 66, ay: [102, 134], reach: Math.min(110, w * 0.26), stroke: 4 };

    // ΔG = ΔH − TΔS, each part in its colour
    ctx.font = '700 ' + S.fm + 'px ' + BODY;
    var fp = [['ΔG', INK], [' = ', INK], ['ΔH', EMBER], [' − TΔS', TIDE]];
    var fw = fp.reduce(function (a, q) { return a + ctx.measureText(q[0]).width; }, 0), fx = lmid - fw / 2;
    fp.forEach(function (q) { label(ctx, q[0], fx, S.fy, { font: BODY, size: S.fm, color: q[1], align: 'left' }); ctx.font = '700 ' + S.fm + 'px ' + BODY; fx += ctx.measureText(q[0]).width; });

    // The equation with an equilibrium double arrow
    // Heat is a term: products side when heat comes out (ΔH −), reactants side when it goes in (ΔH +)
    var ey = S.ey, aw = S.aw, gap = S.gap, HEAT = ' + heat', es = S.eq;
    var heatL = c.dH === '+', heatR = c.dH === '−', hw, wl, wr;
    function measureEq() {
      ctx.font = '700 ' + es + 'px ' + BODY;
      hw = ctx.measureText(HEAT).width;
      wl = ctx.measureText(c.L).width + (heatL ? hw : 0); wr = ctx.measureText(c.R).width + (heatR ? hw : 0);
    }
    measureEq();
    // Shrink the equation only if the longest one would not fit its column
    var need = wl + gap + aw + gap + wr + 24;
    if (need > lw) { es = Math.max(12, Math.floor(es * lw / need)); measureEq(); }
    var x0 = lmid - (wl + gap + aw + gap + wr) / 2, ax0 = x0 + wl + gap, ax1 = ax0 + aw, xr = ax1 + gap;
    var ph = es * 2, pr = es;
    // Favoured side gets a soft ink pill once ΔG has settled
    if (verdict !== '?' && kG > 0) {
      ctx.save(); ctx.globalAlpha = kG;
      ctx.fillStyle = 'rgba(29,36,51,0.08)'; ctx.strokeStyle = INK; ctx.lineWidth = wide ? 2 : 1.6;
      if (verdict === 'f') roundBox(ctx, xr - 8, ey - ph / 2, wr + 16, ph, pr); else roundBox(ctx, x0 - 8, ey - ph / 2, wl + 16, ph, pr);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    label(ctx, c.L, x0, ey, { font: BODY, size: es, color: INK, align: 'left' });
    label(ctx, c.R, xr, ey, { font: BODY, size: es, color: INK, align: 'left' });
    if (heatL) label(ctx, HEAT, x0 + wl - hw, ey, { font: BODY, size: es, color: EMBER, align: 'left' });
    if (heatR) label(ctx, HEAT, xr + wr - hw, ey, { font: BODY, size: es, color: EMBER, align: 'left' });
    var hs = wide ? 1.35 : 1;
    function half(y, right, lw, col) {
      var tip = right ? ax1 : ax0, tail = right ? ax0 : ax1, dir = right ? 1 : -1, barb = right ? -1 : 1;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * (6 + lw * 1.6) * hs, y + barb * (5 + lw * 1.4) * hs); ctx.stroke();
    }
    // Once ΔG settles on a sign the reaction goes one way, so ⇌ becomes a single arrow
    if (verdict !== '?' && kG > 0.5) {
      var right = verdict === 'f', tip = right ? ax1 : ax0, tail = right ? ax0 : ax1, dir = right ? 1 : -1;
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * hs; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(tail, ey); ctx.lineTo(tip, ey);
      ctx.moveTo(tip - dir * 10 * hs, ey - 7 * hs); ctx.lineTo(tip, ey); ctx.lineTo(tip - dir * 10 * hs, ey + 7 * hs); ctx.stroke();
    } else {
      half(ey - 4 * hs, true, 1.8 * hs, INK);
      half(ey + 4 * hs, false, 1.8 * hs, INK);
    }

    // One arrow per term toward the side it favours; both labels sit in one column under the ⇌
    var mx = (ax0 + ax1) / 2, reach = S.reach;
    ctx.font = '700 ' + S.term + 'px ' + MONO;
    var lab = Math.max(ctx.measureText('ΔH ' + c.dH).width, ctx.measureText('ΔS ' + c.dS).width) / 2 + 10;
    // Each arrow carries a note above its shaft naming the side it favours
    [[c.dH, hFwd, EMBER, 'ΔH ' + c.dH, S.ay[0]], [c.dS, sFwd, TIDE, 'ΔS ' + c.dS, S.ay[1]]].forEach(function (q) {
      var y = q[4], dir = q[1] ? 1 : -1, from = mx + dir * lab, tip = from + dir * reach * kArr;
      ctx.save(); ctx.globalAlpha = kArr;
      arrow(ctx, from, y, tip, y, q[2], S.stroke);
      label(ctx, q[3], mx, y, { color: q[2], size: S.term });
      label(ctx, q[1] ? 'favours products' : 'favours reactants', from + dir * reach / 2, y - S.note - 2, { color: q[2], size: S.note });
      ctx.restore();
    });

    // Waterfall bars: ΔH, then −TΔS from where ΔH ends, then ΔG from zero
    var top, bot, gw, L0, axisPad, nameY, nameSize, glyph, axisSize;
    if (wide) {
      var rx0 = w * 0.58, rw = w - 16 - rx0;
      top = 30; bot = h - 44; axisPad = 30;
      gw = Math.min(rw, 460); L0 = rx0 + (rw - gw) / 2 + axisPad;
      nameY = h - 18; nameSize = 18; glyph = 20; axisSize = 17;
      // A faint rule separates the two halves
      ctx.strokeStyle = 'rgba(29,36,51,0.12)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w * 0.565, 24); ctx.lineTo(w * 0.565, h - 24); ctx.stroke();
    } else {
      top = 150; bot = h - 26; axisPad = 16;
      gw = Math.min(w * 0.6, 270); L0 = (w - gw) / 2 + axisPad;
      nameY = h - 10; nameSize = 11; glyph = 14; axisSize = 12;
    }
    var mid = (top + bot) / 2, unit = (bot - top) / 2 / 1.1;
    var slot = (gw - axisPad) / 3, bw = Math.min(wide ? 96 : 52, slot * 0.58);
    ctx.strokeStyle = INK; ctx.lineWidth = wide ? 2 : 1.5;
    ctx.beginPath(); ctx.moveTo(L0 - 6, mid); ctx.lineTo(L0 + gw - axisPad, mid); ctx.stroke();
    var ax = L0 - axisPad + 2;
    label(ctx, '+', ax, top + 8, { size: axisSize }); label(ctx, '0', ax, mid, { size: axisSize }); label(ctx, '−', ax, bot - 8, { size: axisSize });
    var hv = c.h * kBars, sv = c.s * kBars;
    var cols = [
      { name: 'ΔH', from: 0, to: hv, fill: EMBER, k: kBars, col: EMBER },
      { name: '−TΔS', from: hv, to: hv + sv, fill: TIDE, k: kBars, col: TIDE },
      { name: 'ΔG', from: 0, to: hv + sv, fill: INK, k: kG, unknown: verdict === '?', col: INK },
    ];
    cols.forEach(function (b, i) {
      var x = L0 + slot * i + (slot - bw) / 2;
      label(ctx, b.name, x + bw / 2, nameY, { size: nameSize, color: wide ? b.col : DIM });
      if (b.k <= 0) return;
      ctx.save(); ctx.globalAlpha = b.k;
      if (b.unknown) {
        ctx.setLineDash(wide ? [6, 6] : [4, 4]); ctx.strokeStyle = INK; ctx.lineWidth = wide ? 2.2 : 1.6;
        roundBox(ctx, x, mid - unit * 0.45, bw, unit * 0.9, 5); ctx.stroke(); ctx.setLineDash([]);
        label(ctx, '?', x + bw / 2, mid, { color: INK, size: wide ? 36 : 22 });
        ctx.restore(); return;
      }
      var y0 = mid - b.from * unit, y1 = mid - b.to * unit, tp = Math.min(y0, y1), hh = Math.max(2, Math.abs(y1 - y0));
      ctx.fillStyle = b.fill; roundBox(ctx, x, tp, bw, hh, wide ? 7 : 5); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = wide ? 2 : 1.5; ctx.stroke();
      if (i === 0) {
        ctx.setLineDash([2, 3]); ctx.strokeStyle = DIM; ctx.lineWidth = wide ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(x + bw, y1); ctx.lineTo(x + slot, y1); ctx.stroke(); ctx.setLineDash([]);
      }
      var up = b.to - b.from >= 0, go = glyph * 0.65;
      label(ctx, up ? '+' : '−', x + bw / 2, up ? tp - go : tp + hh + go, { color: INK, size: glyph });
      ctx.restore();
    });

    var side = { f: 'the products are favoured', r: 'the reactants are favoured', '?': 'the sign of ΔG depends on which term is bigger' }[verdict];
    return c.L + ' to ' + c.R + '. ΔH is ' + (c.dH === '+' ? 'positive' : 'negative') + ', pushing toward the ' + (hFwd ? 'products' : 'reactants') +
      '. ΔS is ' + (c.dS === '+' ? 'positive' : 'negative') + ', pushing toward the ' + (sFwd ? 'products' : 'reactants') + '. So ' + side + '.';
  }

  /* ---------- favour: what "favours the products / reactants" looks like, one term at a time ----------
     o.idx 0–3 picks ΔH −, ΔH +, ΔS +, ΔS −; o.t = seconds since it was picked.
     Two panels, reactants and products. Enthalpy: each side sits on an energy shelf, and the lower
     shelf is favoured (heat leaves as particles settle there). Entropy: one side is a packed lattice,
     the other spread out, and the spread-out side is favoured. The matching half of ⇌ goes bold. */
  var FV = [
    { H: true, sign: '−', fwd: true }, { H: true, sign: '+', fwd: false },
    { H: false, sign: '+', fwd: true }, { H: false, sign: '−', fwd: false },
  ];
  var R_A = ['#4152d9', '#8494ff'];
  function favour(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var c = FV[o.idx || 0], t = o.still ? 9 : (o.t || 0), k = smooth((t - 0.3) / 0.6);
    var col = c.H ? EMBER : TIDE, term = (c.H ? 'ΔH ' : 'ΔS ') + c.sign;

    // Reactants ⇌ Products, with heat written in as a term for the enthalpy cases
    var ey = 28, aw = 64, gap = 16, HEAT = ' + heat';
    ctx.font = '700 15px ' + BODY;
    var hw = ctx.measureText(HEAT).width, heatL = c.H && c.sign === '+', heatR = c.H && c.sign === '−';
    var wl = ctx.measureText('Reactants').width + (heatL ? hw : 0), wr = ctx.measureText('Products').width + (heatR ? hw : 0);
    var x0 = (w - (wl + gap + aw + gap + wr)) / 2, ax0 = x0 + wl + gap, ax1 = ax0 + aw, xr = ax1 + gap;
    label(ctx, 'Reactants', x0, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    label(ctx, 'Products', xr, ey, { font: BODY, size: 15, color: INK, align: 'left' });
    if (heatL) label(ctx, HEAT, x0 + wl - hw, ey, { font: BODY, size: 15, color: EMBER, align: 'left' });
    if (heatR) label(ctx, HEAT, xr + wr - hw, ey, { font: BODY, size: 15, color: EMBER, align: 'left' });
    function half(y, right, on) {
      var lw = on ? 3.6 : 1.8, tip = right ? ax1 : ax0, tail = right ? ax0 : ax1, dir = right ? 1 : -1, barb = right ? -1 : 1;
      ctx.strokeStyle = on ? col : (k > 0.5 ? FAINT : INK); ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * (6 + lw * 1.6), y + barb * (5 + lw * 1.4)); ctx.stroke();
    }
    half(ey - 4, true, c.fwd && k > 0.5);
    half(ey + 4, false, !c.fwd && k > 0.5);

    // Two panels with a gap for the arrow between them
    var top = 64, bot = h - 46, ph = bot - top;
    var pw = Math.min(180, w * 0.34), cg = Math.max(64, Math.min(120, w * 0.2));
    var px = [w / 2 - cg / 2 - pw, w / 2 + cg / 2];
    var fav = c.fwd ? 1 : 0;
    [0, 1].forEach(function (i) {
      var on = i === fav;
      ctx.fillStyle = on ? mix('#ffffff', col, 0.07 * k) : 'rgba(255,255,255,0.85)';
      roundBox(ctx, px[i], top, pw, ph, 10); ctx.fill();
      ctx.strokeStyle = on && k > 0 ? col : 'rgba(29,36,51,0.3)'; ctx.lineWidth = on ? 1.4 + 1.2 * k : 1.4; ctx.stroke();
      label(ctx, i ? 'Products' : 'Reactants', px[i] + pw / 2, bot + 14, { font: BODY, size: 13, color: INK });
      if (on && k > 0) {
        ctx.save(); ctx.globalAlpha = k;
        label(ctx, 'favoured', px[i] + pw / 2, bot + 32, { color: col, size: 12 });
        ctx.restore();
      }
    });

    var r = Math.max(6, Math.min(9, pw / 18)), n = 9;
    function sphere(x, y, i) { ball(ctx, x, y, r, i ? O_A[0] : R_A[0], i ? O_A[1] : R_A[1]); }

    if (c.H) {
      // Energy axis on the left
      var axX = px[0] - 16;
      arrow(ctx, axX, bot - 4, axX, top + 4, DIM, 1.6);
      ctx.save(); ctx.translate(axX - 10, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
      label(ctx, 'Potential energy', 0, 0, { size: 11 }); ctx.restore();
      // Shelves: the favoured side sits low
      var hi = top + ph * 0.32, lo = top + ph * 0.8, sy = [fav === 0 ? lo : hi, fav === 1 ? lo : hi];
      [0, 1].forEach(function (i) {
        var y = sy[i], inset = 14;
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px[i] + inset, y); ctx.lineTo(px[i] + pw - inset, y); ctx.stroke();
        for (var j = 0; j < 5; j++) {
          var bx = px[i] + inset + r + 4 + j * (pw - 2 * inset - 2 * r - 8) / 4;
          sphere(bx, y - r - 1.5 - Math.abs(Math.sin(t * 3 + j * 1.7 + i)) * 2.2, i);
        }
        label(ctx, i === fav ? 'lower potential energy' : 'higher potential energy', px[i] + pw / 2, y + 16, { color: i === fav ? col : DIM, size: 11 });
      });
      // Heat leaves as particles settle on the lower shelf
      var fx = px[fav] + pw / 2, pulse = o.still ? 0.5 : (t % 1.4) / 1.4, ha = (o.still ? 1 : Math.sin(Math.PI * pulse)) * k;
      [-0.28, 0.28].forEach(function (dx) {
        var x = fx + dx * pw, y0 = sy[fav] - 2 * r - 10 - pulse * 10;
        heatWave(ctx, x, y0, x + dx * 40, y0 - 40, ha);
      });
      // Downhill arrow from the higher shelf to the lower one
      var a0x = fav ? px[0] + pw - 6 : px[1] + 6, a1x = fav ? px[1] + 6 : px[0] + pw - 6;
      var a0y = hi - 6, a1y = lo - 6;
      if (k > 0) {
        ctx.save(); ctx.globalAlpha = k;
        arrow(ctx, a0x, a0y, a0x + (a1x - a0x) * k, a0y + (a1y - a0y) * k, col, 3.6);
        label(ctx, term, w / 2, hi - 22, { color: col, size: 13 });
        ctx.restore();
      }
    } else {
      // Packed lattice on one side, spread out on the other; the spread-out side is favoured
      [0, 1].forEach(function (i) {
        var spreadOut = i === fav, x0p = px[i] + r + 10, x1p = px[i] + pw - r - 10, y0p = top + 30, y1p = bot - r - 10;
        for (var j = 0; j < n; j++) {
          // Evenly scattered starts (golden-ratio steps), each drifting at its own speed
          var sx = (j * 0.618 + 0.11) % 1, sy2 = (j * 0.382 + 0.57) % 1, vx = 16 + (j * 7) % 30, vy = 12 + (j * 11) % 26;
          var x, y;
          if (spreadOut) {
            x = tri(x0p + sx * (x1p - x0p) + vx * t, x0p, x1p);
            y = tri(y0p + sy2 * (y1p - y0p) + vy * t, y0p, y1p);
          } else {
            var cx = px[i] + pw / 2 + (j % 3 - 1) * 2.2 * r, cy = bot - r - 12 - Math.floor(j / 3) * 2.2 * r;
            x = cx + Math.sin(t * 14 + j) * r * 0.1; y = cy + Math.cos(t * 12 + j * 2) * r * 0.1;
          }
          sphere(x, y, i);
        }
        label(ctx, spreadOut ? 'more spread out' : 'more ordered', px[i] + pw / 2, top + 14, { color: spreadOut ? col : DIM, size: 11 });
      });
      var my = top + ph * 0.5, s0 = fav ? px[0] + pw + 8 : px[1] - 8, s1 = fav ? px[1] - 8 : px[0] + pw + 8;
      if (k > 0) {
        ctx.save(); ctx.globalAlpha = k;
        arrow(ctx, s0, my, s0 + (s1 - s0) * k, my, col, 3.6);
        label(ctx, term, w / 2, my - 18, { color: col, size: 13 });
        ctx.restore();
      }
    }

    var side = c.fwd ? 'products' : 'reactants';
    return c.H
      ? term + '. The ' + side + ' have the lower potential energy, and the difference is released as heat. Enthalpy favours the ' + side + '.'
      : term + '. The ' + side + ' are more spread out than the other side, with more ways to be arranged. Entropy favours the ' + side + '.';
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

  /* ---------- intro4: four everyday changes side by side ----------
     Two go to completion (methane burning, iron rusting) and two settle at equilibrium
     (CO₂ in a sealed bottle, salt in a saturated solution). A stateless function of time t (s);
     each tile has its equation underneath. Reduced motion: one still frame. */
  var C_A = ['#3a3f4b', '#9aa0ad'], NA_A = ['#7d6bd6', '#e0dafc'];
  var RUST = { clean: 1.2, grow: 6.0, hold: 2.0, fade: 0.6 };
  var I4 = [
    { id: 'burn', eq: ['CH₄(g) + 2O₂(g)', '→', 'CO₂(g) + 2H₂O(g)'], desc: 'Methane burns in a gas flame. O₂ is used up at the flame, and CO₂ and H₂O rise away.' },
    { id: 'rust', eq: ['4Fe(s) + 3O₂(g)', '→', '2Fe₂O₃(s)'], desc: 'An iron nail rusts until it is rust all over.' },
    { id: 'soda', eq: ['CO₂(g)', '→', 'CO₂(aq)'], desc: 'In a sealed bottle, CO₂ molecules move from the gas into the liquid and back out at the same time.' },
    { id: 'salt', eq: ['NaCl(s)', '→', 'Na⁺(aq) + Cl⁻(aq)'], desc: 'In a saturated salt solution, ions leave the crystal and others join it at the same time.' }
  ];
  function co2(ctx, x, y, r, a) {
    var dx = Math.cos(a) * r * 1.5, dy = Math.sin(a) * r * 1.5;
    ball(ctx, x - dx, y - dy, r, O_A[0], O_A[1]); ball(ctx, x + dx, y + dy, r, O_A[0], O_A[1]);
    ball(ctx, x, y, r * 0.95, C_A[0], C_A[1]);
  }
  function h2o(ctx, x, y, r, a) {
    [-0.9, 0.9].forEach(function (d) { ball(ctx, x + Math.sin(a + d) * r * 1.1, y + Math.cos(a + d) * r * 1.1, r * 0.6, H_A[0], H_A[1]); });
    ball(ctx, x, y, r, O_A[0], O_A[1]);
  }
  function o2(ctx, x, y, r, a) {
    var dx = Math.cos(a) * r * 0.8, dy = Math.sin(a) * r * 0.8;
    ball(ctx, x - dx, y - dy, r, O_A[0], O_A[1]); ball(ctx, x + dx, y + dy, r, O_A[0], O_A[1]);
  }
  function ion(ctx, x, y, na) {
    var c = na ? NA_A : CL_A;
    ball(ctx, x, y, na ? 4.2 : 5.6, c[0], c[1]);
    label(ctx, na ? '+' : '−', x, y + 0.5, { size: 8, color: INK });
  }
  function flame(ctx, cx, base, hw, hh, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - hw, base);
    ctx.bezierCurveTo(cx - hw, base - hh * 0.5, cx - hw * 0.3, base - hh * 0.8, cx, base - hh);
    ctx.bezierCurveTo(cx + hw * 0.3, base - hh * 0.8, cx + hw, base - hh * 0.5, cx + hw, base);
    ctx.closePath(); ctx.fill();
  }
  // A particle drifting in straight lines and bouncing inside a box, from a seeded start
  function drift(R, t, x0, x1, y0, y1) {
    var a = R(), b = R(), c = R(), d = R();
    return [tri(x0 + a * (x1 - x0) + t * (6 + 10 * c) * (d > 0.5 ? 1 : -1), x0, x1),
            tri(y0 + b * (y1 - y0) + t * (4 + 8 * d) * (c > 0.5 ? 1 : -1), y0, y1)];
  }

  var I4_TILE = {
    /* Methane burner: O₂ drifts in and is used up; CO₂ and H₂O (1 : 2) rise away and never come back */
    burn: function (ctx, x, y, w, h, t) {
      var cx = x + w / 2, base = y + h - 14, tubeTop = base - 62;
      ctx.fillStyle = '#c3c8d2'; roundBox(ctx, cx - 22, base - 8, 44, 8, 3); ctx.fill();
      var tg = ctx.createLinearGradient(cx - 7, 0, cx + 7, 0);
      tg.addColorStop(0, '#9aa1ae'); tg.addColorStop(0.4, '#eef0f4'); tg.addColorStop(1, '#8a91a0');
      ctx.fillStyle = tg; ctx.fillRect(cx - 7, tubeTop, 14, base - 8 - tubeTop);
      ctx.strokeStyle = 'rgba(29,36,51,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(cx - 7, tubeTop, 14, base - 8 - tubeTop);
      for (var k = 0; k < 4; k++) {
        var p = (t * 0.3 + k / 4) % 1, side = k % 2 ? 1 : -1;
        ctx.globalAlpha = Math.min(1, (1 - p) * 5, p * 5);
        o2(ctx, cx + side * (10 + (w / 2 - 4) * (1 - p)), tubeTop - 6 + (Math.floor(k / 2) ? 12 : -12) * (1 - p), 3.2, t * 1.5 + k);
      }
      ctx.globalAlpha = 1;
      var fl = 1 + 0.07 * Math.sin(t * 13) + 0.05 * Math.sin(t * 21.7);
      flame(ctx, cx, tubeTop, 10, 46 * fl, 'rgba(120,170,255,0.45)');
      flame(ctx, cx, tubeTop, 6, 22 * (2 - fl), 'rgba(40,90,230,0.85)');
      var y0 = tubeTop - 44, y1 = y + 10;
      for (var j = 0; j < 6; j++) {
        var q = (t * 0.22 + j / 6) % 1;
        ctx.globalAlpha = Math.min(1, q * 6, (1 - q) * 5);
        var mx = cx + Math.sin(q * 5 + j * 1.7) * w * 0.25 * q, my = y0 + (y1 - y0) * q;
        if (j % 3 === 0) co2(ctx, mx, my, 3.2, t * 0.8 + j); else h2o(ctx, mx, my, 3.6, t * 0.8 + j);
      }
      ctx.globalAlpha = 1;
    },

    /* Iron nail: rust spreads until the whole nail is rust, holds, then a fresh nail */
    rust: function (ctx, x, y, w, h, t) {
      var cyc = RUST.clean + RUST.grow + RUST.hold + RUST.fade, u = t % cyc;
      var prog = smooth((u - RUST.clean) / RUST.grow), fade = Math.min(1, (cyc - u) / RUST.fade);
      var cx = x + w / 2, top = y + 34, tip = y + h - 18, sw = 6;
      function nail() {
        ctx.beginPath();
        [[-17, 0], [17, 0], [17, 7], [sw, 7], [sw, tip - top - 18], [0, tip - top], [-sw, tip - top - 18], [-sw, 7], [-17, 7]]
          .forEach(function (q, i) { if (i) ctx.lineTo(cx + q[0], top + q[1]); else ctx.moveTo(cx + q[0], top + q[1]); });
        ctx.closePath();
      }
      // O₂ drifts to the surface while the iron is still reacting
      ctx.globalAlpha = 1 - smooth((prog - 0.85) / 0.15);
      for (var k = 0; k < 3; k++) {
        var p = (t * 0.35 + k / 3) % 1, side = k % 2 ? 1 : -1;
        o2(ctx, cx + side * (sw + 6 + (w / 2 - sw - 8) * (1 - p)), top + 30 + k * (tip - top - 60) / 2, 3.2, t + k);
      }
      ctx.globalAlpha = 1;
      var mg = ctx.createLinearGradient(cx - 17, 0, cx + 17, 0);
      mg.addColorStop(0, '#7d8491'); mg.addColorStop(0.4, '#eef0f4'); mg.addColorStop(1, '#7d8491');
      nail(); ctx.fillStyle = mg; ctx.fill();
      ctx.save(); nail(); ctx.clip(); ctx.globalAlpha = fade;
      var R = rng(31);
      for (var b = 0; b < 24; b++) {
        var fx = R() * 2 - 1, fy = R(), r = 3 + R() * 6, at = R() * 0.75;
        var g = smooth((prog - at) / 0.2); if (g <= 0) continue;
        ctx.fillStyle = b % 3 ? 'rgba(181,83,42,0.9)' : 'rgba(143,63,31,0.9)';
        ctx.beginPath(); ctx.arc(cx + fx * 14 * (fy < 0.05 ? 1 : sw / 14), top + fy * (tip - top), r * g, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(169,81,43,' + (0.92 * smooth((prog - 0.75) / 0.25)) + ')'; ctx.fillRect(cx - 18, top - 1, 36, tip - top + 2);
      ctx.restore();
      nail(); ctx.strokeStyle = 'rgba(29,36,51,0.6)'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke();
    },

    /* The soda scene's bottle (EqScenes.bottle), filled to the shoulder so the gas shows.
       Four molecules keep crossing the surface, staggered so two are always on each side. */
    soda: function (ctx, x, y, w, h, t) {
      var B = global.EqScenes && global.EqScenes.bottle; if (!B) return;
      var FILL = 44, s = Math.min((h - 22) / 104, (w - 16) / 28);
      var ox = x + w / 2, oy = y + 12 + 3 * s + (h - 22 - 104 * s) / 2;
      var kit = { fill: FILL, asp: 1, base: ctx.getTransform(), capK: 0 };
      var X = function (wx) { return ox + wx * s; }, Y = function (wy) { return oy + wy * s; };
      var r = 3, m = 6.4 / s;                         // molecule radius (px); its half-length in world units
      function at(u, wy) { return [X(u * Math.max(0, B.bore(wy) - m)), Y(wy)]; }
      ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
      B.drawGlass(ctx, false, kit);
      ctx.save(); B.glassPath(ctx, true); ctx.clip();
      ctx.setTransform(kit.base);
      var R = rng(11), k, p, q;
      for (k = 0; k < 3; k++) { p = drift(R, t * 0.025, 0, 1, 0, 1); q = at(p[0] * 2 - 1, 16 + p[1] * (FILL - 19)); B.co2(ctx, q[0], q[1], r, t * 0.7 + k, 1, 'gas'); }
      for (k = 0; k < 4; k++) { p = drift(R, t * 0.015, 0, 1, 0, 1); q = at(p[0] * 2 - 1, FILL + 4 + p[1] * (92 - FILL)); B.co2(ctx, q[0], q[1], r, t * 0.5 + k * 2, 1, 'aq'); }
      for (k = 0; k < 4; k++) {
        var sn = Math.sin(2 * Math.PI * ((t * 0.12 + k / 4) % 1)), wy = FILL - (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), 0.5) * 14;
        q = at(tri(-0.7 + 0.45 * k + t * 0.06, -1, 1), wy);
        if (Math.abs(sn) < 0.15) {
          ctx.strokeStyle = 'rgba(20,145,143,' + (1 - Math.abs(sn) / 0.15) * 0.8 + ')'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(q[0], Y(FILL), 8, 3, 0, 0, Math.PI * 2); ctx.stroke();
        }
        B.co2(ctx, q[0], q[1], r, t * 0.6 + k, 1, wy < FILL ? 'gas' : 'aq');
      }
      ctx.restore();
      B.drawFront(ctx, false, kit); B.cap(ctx, kit);
      ctx.restore();
    },

    /* Saturated salt solution: ions leave the crystal's top row and come back; others wander */
    salt: function (ctx, x, y, w, h, t) {
      var G = beakerGeom(x + 12, y + 34, w - 24, h - 52);
      beakerBack(ctx, G, '#ddeefa');
      var sp = 10, lx = G.cx - 1.5 * sp, ly = G.bb - 4;
      var away = [];
      for (var k = 0; k < 4; k++) {
        var p = (t * 0.09 + k / 4 + 0.13 * (k % 2)) % 1;
        away.push(p < 0.3 ? null : (p - 0.3) / 0.7);
      }
      for (var row = 0; row < 3; row++) for (var col = 0; col < 4; col++) {
        if (row === 2 && away[col] !== null) continue;
        ion(ctx, lx + col * sp, ly - row * sp, (row + col) % 2 === 0);
      }
      var R = rng(5);
      for (var i = 0; i < 4; i++) { var fp = drift(R, t * 0.8, G.bx + 8, G.bx + G.bw - 8, G.wt + G.ry + 6, ly - 3 * sp - 6); ion(ctx, fp[0], fp[1], i % 2 === 0); }
      away.forEach(function (u, col) {
        if (u === null) return;
        var sx = lx + col * sp, sy = ly - 2 * sp, lift = Math.pow(Math.sin(Math.PI * u), 0.8);
        ion(ctx, sx + Math.sin(2 * Math.PI * u) * G.bw * 0.28 * (col < 2 ? -1 : 1), sy - lift * (sy - G.wt - G.ry - 10), (2 + col) % 2 === 0);
      });
      beakerFront(ctx, G);
    }
  };

  function intro4(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var t = o.still ? 7 : (o.t || 0);
    var pad = 12, gap = 10, tw = (w - pad * 2 - gap * 3) / 4;
    var top = 42, eqH = 62, th = h - top - eqH - pad;
    ['Go to completion', 'Reach equilibrium'].forEach(function (g, gi) {
      var x0 = pad + gi * 2 * (tw + gap), x1 = x0 + tw * 2 + gap;
      label(ctx, g, (x0 + x1) / 2, 18, { size: 11, color: INK });
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 + 4, 30); ctx.lineTo(x1 - 4, 30); ctx.stroke();
    });
    // One text size for every equation, shrunk so the longest line fits a tile
    ctx.font = '700 12px ' + MONO;
    var widest = 0;
    I4.forEach(function (s) { widest = Math.max(widest, ctx.measureText(s.eq[0]).width, ctx.measureText(s.eq[2]).width); });
    var size = Math.min(12, 12 * (tw - 4) / widest);
    I4.forEach(function (s, i) {
      var x = pad + i * (tw + gap);
      ctx.save();
      roundBox(ctx, x, top, tw, th, 12); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = 'rgba(29,36,51,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.clip();
      I4_TILE[s.id](ctx, x, top, tw, th, t);
      ctx.restore();
      var ey = top + th + 16;
      label(ctx, s.eq[0], x + tw / 2, ey, { size: size, color: INK });
      label(ctx, s.eq[1], x + tw / 2, ey + 17, { size: 16, color: INK, font: BODY });
      label(ctx, s.eq[2], x + tw / 2, ey + 34, { size: size, color: INK });
    });
    return 'Four changes side by side. ' + I4.map(function (s) { return s.desc; }).join(' ');
  }

  /* ---------- algebra: equations whose terms glide into place (Part 4, the equilibrium constant) ----------
     A small layout engine for the K beats, drawn in a virtual 460 × 330 box scaled to the canvas.
     A step is a list of rows { y, s (size scale), at: [item index, x] (pin that item's left edge), items }.
     Items: text { id, t, c, sup, sub, px (fixed px size, for captions), mono, strike, from }
            fraction { frac: id, num: [...], den: [...] } · arrows { arrows: id, hi: 'f' | 'r', one: 'f' | 'r' }
            line { line: id, len } · gap { gap: ems }.
     Tokens keep their id from step to step, so stepping slides every term from where it was to where
     it now sits. New tokens fade in after the slide (or fly out of the token named by `from`); tokens
     that are gone fade out; a newly struck token gets its line drawn once everything has landed. */
  var ALG = { W: 460, H: 330 }, INK_R = TIDE;
  function tk(id, t, o) { var r = { id: id, t: t }; if (o) for (var q in o) r[q] = o[q]; return r; }
  function cap(id, t, o) { var r = tk(id, t, { px: 12, wt: '500', c: DIM }); if (o) for (var q in o) r[q] = o[q]; return r; }
  function algLayout(ctx, rows, base) {
    var out = { tok: {}, bar: {}, arr: {} };
    rows.forEach(function (row) {
      var rs = base * (row.s || 1);
      function size(it) { return it.px || rs * (it.sup || it.sub ? 0.6 : 1); }
      function wOf(it) {
        if (it.frac) return Math.max(seqW(it.num), seqW(it.den)) + rs * 0.4;
        if (it.arrows) return rs * 3.3;
        if (it.line) return it.len;
        if (it.gap != null) return rs * it.gap;
        ctx.font = (it.wt || '700') + ' ' + size(it) + 'px ' + (it.mono ? MONO : BODY);
        return ctx.measureText(it.t).width + (it.sup ? rs * 0.06 : 0);
      }
      function seqW(items) { return items.reduce(function (a, it) { return a + wOf(it); }, 0); }
      function place(items, x, y) {
        items.forEach(function (it) {
          var iw = wOf(it);
          if (it.frac) {
            var nw = seqW(it.num), dw = seqW(it.den), cx = x + iw / 2;
            place(it.num, cx - nw / 2, y - rs * 0.68);
            place(it.den, cx - dw / 2, y + rs * 0.72);
            out.bar[it.frac] = { x: x + rs * 0.1, y: y, w: iw - rs * 0.2, lw: Math.max(1.6, rs * 0.085) };
          } else if (it.arrows) {
            out.arr[it.arrows] = { x: x + rs * 0.6, y: y, w: iw - rs * 1.2, hi: it.hi || null, one: it.one || null, size: rs };
          } else if (it.line) {
            out.bar[it.line] = { x: x, y: y, w: iw, lw: 1.6 };
          } else if (it.gap == null) {
            var sz = size(it);
            out.tok[it.id] = { x: x, y: y + (it.sup ? -rs * 0.36 : it.sub ? rs * 0.3 : 0), t: it.t, c: it.c || INK, size: sz,
              mono: !!it.mono, wt: it.wt, strike: !!it.strike, from: it.from, w: iw };
          }
          x += iw;
        });
      }
      var x0 = (ALG.W - seqW(row.items)) / 2;
      if (row.at) x0 = row.at[1] - seqW(row.items.slice(0, row.at[0]));
      place(row.items, x0, row.y);
    });
    return out;
  }
  // ⇌ as forward solid ink over reverse dashed tide (the rate-graph styles); one: a single step's →
  function eqArrows(ctx, p, alpha) {
    if (alpha <= 0.01) return;
    var s = p.size, x0 = p.x, x1 = p.x + p.w, off = p.one ? 0 : s * 0.2, hb = s * 0.42;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p.one !== 'r') {
      ctx.globalAlpha = alpha * (p.hi === 'r' ? 0.3 : 1);
      ctx.strokeStyle = INK; ctx.lineWidth = s * (p.hi === 'f' ? 0.17 : 0.1);
      ctx.beginPath(); ctx.moveTo(x0, p.y - off); ctx.lineTo(x1, p.y - off); ctx.lineTo(x1 - hb, p.y - off - hb * (p.one ? 0.7 : 0.75));
      if (p.one) ctx.moveTo(x1, p.y), ctx.lineTo(x1 - hb, p.y + hb * 0.7);
      ctx.stroke();
    }
    if (p.one !== 'f') {
      ctx.globalAlpha = alpha * (p.hi === 'f' ? 0.3 : 1);
      ctx.strokeStyle = INK_R; ctx.lineWidth = s * (p.hi === 'r' ? 0.17 : 0.1);
      // A one-way reverse step is still written left to right, in tide and dashed
      var from = p.one ? x0 : x1, to = p.one ? x1 : x0, dir = p.one ? 1 : -1;
      ctx.setLineDash([s * 0.28, s * 0.22]);
      ctx.beginPath(); ctx.moveTo(from, p.y + off); ctx.lineTo(to - dir * s * 0.1, p.y + off); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(to - dir * hb, p.y + off + hb * 0.75); ctx.lineTo(to, p.y + off);
      if (p.one) ctx.lineTo(to - dir * hb, p.y + off - hb * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
  function algDraw(canvas, rowsFrom, rowsTo, base, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var sc = Math.min(w / ALG.W, h / ALG.H);
    ctx.save();
    ctx.translate((w - ALG.W * sc) / 2, (h - ALG.H * sc) / 2); ctx.scale(sc, sc);
    var A = algLayout(ctx, rowsFrom, base), B = algLayout(ctx, rowsTo, base);
    var t = o.still ? 9 : (o.t || 0), same = rowsFrom === rowsTo;
    var k = same ? 1 : smooth(t / 0.9), kIn = same ? smooth(t / 0.5) : smooth((t - 0.6) / 0.5), kSt = smooth((t - (same ? 0.4 : 1.05)) / 0.45);
    function lerp(a, b, u) { return a + (b - a) * u; }
    function tok(p, alpha, strikeK) {
      if (alpha <= 0.01) return;
      ctx.save(); ctx.globalAlpha = Math.min(1, alpha) * (1 - 0.55 * strikeK);
      label(ctx, p.t, p.x, p.y, { font: p.mono ? MONO : BODY, size: p.size, color: p.c, align: 'left', weight: p.wt });
      if (strikeK > 0) {
        var x1 = p.x + 1, y1 = p.y + p.size * 0.36, x2 = p.x + p.w - 1, y2 = p.y - p.size * 0.36;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.3, p.size * 0.07); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, strikeK), lerp(y1, y2, strikeK)); ctx.stroke();
      }
      ctx.restore();
    }
    function between(a, b, u) {
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), size: lerp(a.size, b.size, u), w: lerp(a.w, b.w, u),
        t: u < 0.5 ? a.t : b.t, c: u < 0.5 ? a.c : b.c, mono: b.mono, wt: b.wt };
    }
    Object.keys(A.tok).forEach(function (id) { if (!B.tok[id]) tok(A.tok[id], 1 - smooth(k * 1.6), A.tok[id].strike ? 1 : 0); });
    Object.keys(B.tok).forEach(function (id) {
      var b = B.tok[id], a = A.tok[id], sk = b.strike ? (a && a.strike && !same ? 1 : kSt) : 0;
      if (a) tok(between(a, b, k), 1, sk);
      else if (b.from && A.tok[b.from] && !same) tok(between(A.tok[b.from], b, k), Math.min(1, 0.35 + k), sk);
      else tok(b, kIn, sk);
    });
    // Fraction bars and lines: slide, grow in, or fade out
    ctx.strokeStyle = INK; ctx.lineCap = 'round';
    Object.keys(A.bar).forEach(function (id) {
      if (B.bar[id]) return;
      var p = A.bar[id]; ctx.globalAlpha = 1 - k; ctx.lineWidth = p.lw;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.stroke();
    });
    Object.keys(B.bar).forEach(function (id) {
      var b = B.bar[id], a = A.bar[id], p = a ? { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), lw: b.lw } : b;
      var grow = a ? 1 : kIn;
      ctx.globalAlpha = a ? 1 : kIn; ctx.lineWidth = p.lw;
      ctx.beginPath(); ctx.moveTo(p.x + p.w / 2 * (1 - grow), p.y); ctx.lineTo(p.x + p.w / 2 * (1 + grow), p.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // Reaction arrows: ⇌ is forward solid ink over reverse dashed tide (the rate-graph styles)
    function arrows(p, alpha) { eqArrows(ctx, p, alpha); }
    Object.keys(A.arr).forEach(function (id) { if (!B.arr[id]) arrows(A.arr[id], 1 - k); });
    Object.keys(B.arr).forEach(function (id) {
      var b = B.arr[id], a = A.arr[id];
      if (a) arrows({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), size: lerp(a.size, b.size, k), hi: b.hi, one: b.one }, 1);
      else arrows(b, kIn);
    });
    ctx.restore();
  }

  // Draw a list of algebra rows once, without stepping (ctx already in the virtual box)
  function algStatic(ctx, rows, base, alpha) {
    var L = algLayout(ctx, rows, base);
    ctx.save(); ctx.globalAlpha = alpha;
    Object.keys(L.tok).forEach(function (id) {
      var p = L.tok[id];
      label(ctx, p.t, p.x, p.y, { font: p.mono ? MONO : BODY, size: p.size, color: p.c, align: 'left', weight: p.wt });
      if (p.strike) {
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x + 1, p.y + p.size * 0.1); ctx.lineTo(p.x + p.w - 1, p.y - p.size * 0.1); ctx.stroke();
      }
    });
    ctx.strokeStyle = INK; ctx.lineCap = 'round';
    Object.keys(L.bar).forEach(function (id) {
      var b = L.bar[id]; ctx.lineWidth = b.lw;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.stroke();
    });
    Object.keys(L.arr).forEach(function (id) { eqArrows(ctx, L.arr[id], 1); });
    ctx.restore();
  }

  /* ---------- kpuzzle: rate laws need experiments, K doesn't (2NO₂ + F₂ → 2NO₂F) ----------
     o.step 0–2, o.t = seconds since the step changed.
     0 a rate law guessed from the coefficients · 1 an initial-rates table proves it wrong (rate = k[NO₂][F₂])
     2 K, though, keeps every coefficient as an exponent. The next beats answer why. */
  function kpuzzle(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var sc = Math.min(w / ALG.W, h / ALG.H), W = ALG.W;
    ctx.save(); ctx.translate((w - W * sc) / 2, (h - ALG.H * sc) / 2); ctx.scale(sc, sc);
    var step = o.step || 0, t = o.still ? 9 : (o.t || 0);
    function at(t0, d) { return smooth((t - t0) / (d || 0.45)); }
    function fade(a, fn) { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = a; fn(); ctx.restore(); }
    function txt(s, x, y, size, col, o2) {
      o2 = o2 || {};
      var sz = size;
      if (o2.max) for (ctx.font = (o2.wt || '700') + ' ' + sz + 'px ' + BODY; sz > 8 && ctx.measureText(s).width > o2.max; ctx.font = (o2.wt || '700') + ' ' + sz + 'px ' + BODY) sz -= 0.5;
      label(ctx, s, x, y, { font: o2.mono ? MONO : BODY, size: sz, color: col || INK, align: o2.align || 'center', weight: o2.wt });
    }
    var NO2 = '[NO₂]', F2 = '[F₂]', NO2F = '[NO₂F]';

    // The reaction across the top (→ while we talk about rates, ⇌ once K comes in)
    var eqY = step === 0 ? 40 : 24, eqS = step === 0 ? 21 : 15;
    if (step < 2) txt('2NO₂ + F₂ → 2NO₂F', W / 2, eqY, eqS);
    else algStatic(ctx, [{ y: eqY, items: [tk('a', '2NO₂ + F₂'), { arrows: 'e' }, tk('b', '2NO₂F')] }], eqS, 1);

    if (step === 0) {
      fade(at(0.2), function () {
        txt('a guess from the coefficients', W / 2, 104, 12, DIM, { wt: '500' });
        algStatic(ctx, [{ y: 146, items: [tk('r', 'rate = k'), tk('n', NO2), tk('e', '2', { sup: 1 }), tk('c', F2), tk('q', '  ?', { c: DIM })] }], 24, 1);
        txt('coefficients 2 and 1, so exponents 2 and 1?', W / 2, 190, 12, DIM, { wt: '500' });
      });
      fade(at(0.9), function () { txt('test it: change one amount at a time and measure the starting rate', W / 2, 262, 12, INK, { wt: '500' }); });
    }

    if (step === 1) {
      var cx = [44, 118, 190], bx0 = 252, unit = 34, hy = 62;
      txt('trial', cx[0], hy, 11, DIM, { wt: '500' }); txt(NO2, cx[1], hy, 13, INK); txt(F2, cx[2], hy, 13, INK);
      txt('starting rate', bx0, hy, 11, DIM, { wt: '500', align: 'left' });
      ctx.strokeStyle = 'rgba(29,36,51,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, hy + 14); ctx.lineTo(W - 20, hy + 14); ctx.stroke();
      var rows = [[0.1, 0.1, 1, -1], [0.1, 0.2, 2, 2], [0.2, 0.1, 2, 1]];   // [NO₂], [F₂], rate ×, column changed
      rows.forEach(function (r, i) {
        var y = 98 + i * 36, k = at(0.3 + i * 0.8);
        fade(k, function () {
          txt(String(i + 1), cx[0], y, 14, INK);
          [r[0], r[1]].forEach(function (v, j) {
            var on = r[3] === j + 1, x = cx[j + 1];
            if (on) { ctx.fillStyle = 'rgba(29,36,51,0.08)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; roundBox(ctx, x - 27, y - 12, 54, 24, 12); ctx.fill(); ctx.stroke(); }
            txt(v.toFixed(2) + ' M', x, y, 13, on ? INK : DIM, on ? null : { wt: '500' });
          });
          var bw = unit * r[2] * smooth((t - 0.45 - i * 0.8) / 0.6);
          ctx.fillStyle = INK; roundBox(ctx, bx0, y - 7, Math.max(4, bw), 14, 7); ctx.fill();
          txt('×' + r[2], bx0 + unit * r[2] + 10, y, 13, INK, { align: 'left' });
        });
      });
      fade(at(1.4), function () { txt('double [F₂]: 2 times faster, so first order in F₂', W / 2, 214, 12, DIM, { wt: '500' }); });
      fade(at(2.2), function () { txt('double [NO₂]: only 2 times faster, so first order in NO₂, not second', W / 2, 234, 12, DIM, { wt: '500', max: W - 20 }); });
      fade(at(2.8), function () {
        algStatic(ctx, [{ y: 280, items: [tk('r', 'rate = k'), tk('n', NO2), tk('c', F2), { gap: 1.2 }, cap('x', 'not '), tk('g', 'k[NO₂]²[F₂]', { c: DIM, strike: true, px: 14 })] }], 21, 1);
      });
    }

    if (step === 2) {
      var Lc = W * 0.27, Rc = W * 0.73;
      ctx.strokeStyle = 'rgba(29,36,51,0.15)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W / 2, 58); ctx.lineTo(W / 2, 236); ctx.stroke();
      fade(at(0.1), function () {
        txt('rate law', Lc, 70, 16, INK); txt('found by experiment', Lc, 92, 12, DIM, { wt: '500' });
        algStatic(ctx, [{ y: 156, at: [0, Lc - 74], items: [tk('r', 'rate = k'), tk('n', NO2), tk('c', F2)] }], 19, 1);
        txt('NO₂: order 1, coefficient 2', Lc, 214, 12, DIM, { wt: '500' });
      });
      fade(at(0.8), function () {
        txt('equilibrium constant', Rc, 70, 16, INK); txt('written from the equation', Rc, 92, 12, DIM, { wt: '500' });
        algStatic(ctx, [{ y: 156, at: [0, Rc - 80], items: [tk('k', 'K = '), { frac: 'f', num: [tk('a', NO2F), tk('a2', '2', { sup: 1 })], den: [tk('c', NO2), tk('c2', '2', { sup: 1 }), tk('d', F2)] }] }], 18, 1);
        txt('every exponent = coefficient', Rc, 214, 12, DIM, { wt: '500' });
      });
      fade(at(1.6), function () {
        txt('Same reaction. Why does K get to use the coefficients', W / 2, 266, 14, INK, { max: W - 20 });
        txt('when the rate law can\'t?', W / 2, 288, 14, INK);
      });
    }

    ctx.restore();
    return [
      '2NO₂ + F₂ → 2NO₂F. A rate law guessed from the coefficients would be rate = k[NO₂]²[F₂]. Is it right?',
      'Experiment. Trial 1: both at 0.10 M. Trial 2: [F₂] doubled, the rate doubles. Trial 3: [NO₂] doubled, the rate only doubles. So rate = k[NO₂][F₂], first order in NO₂, not k[NO₂]²[F₂].',
      'The rate law, rate = k[NO₂][F₂], is found by experiment and does not match the coefficients. The equilibrium constant, K = [NO₂F] squared over [NO₂] squared [F₂], keeps every coefficient as an exponent.'
    ][step];
  }

  /* ---------- kderive: K from equal forward and reverse rates (N₂O₄ ⇌ 2NO₂) ----------
     o.step 0–5, o.from = the step shown before, o.t = seconds since the step changed.
     Forward terms in ink, reverse terms in tide, as in the rate graphs. The coefficient 2 of the
     reverse step lifts up into the exponent; at equilibrium the two rate laws meet across one
     equals sign; dividing slides kᵣ under k_f and [N₂O₄] under [NO₂]²; k_f / kᵣ becomes K. */
  function kderiveRows(step) {
    var R = { c: INK_R }, eq = { y: 34, s: 1.05, items: [tk('eL', 'N₂O₄'), { arrows: 'eA', hi: step === 1 ? 'f' : step === 2 ? 'r' : null }, tk('eC', '2'), tk('eR', 'NO₂')] };
    var kf = [tk('kf', 'k'), tk('kfs', 'f', { sub: 1 })], kr = [tk('kr', 'k', R), tk('krs', 'r', { sub: 1, c: INK_R })];
    var fwdStep = { y: 112, at: [2, 168], items: [cap('fl', 'forward step'), { gap: 0.7 }, tk('fN', 'N₂O₄'), { arrows: 'fA', one: 'f' }, tk('f2', '2NO₂')] };
    var fwdRate = { y: 112, at: [2, 168], items: [cap('fl', 'forward rate'), { gap: 0.7 }, tk('feq', '= ')].concat(kf, [tk('fN', '[N₂O₄]')]) };
    var revStep = { y: 168, at: [2, 168], items: [cap('rl', 'reverse step', { c: INK_R }), { gap: 0.7 }, tk('r2c', '2', R), tk('rN', 'NO₂', R), { arrows: 'rA', one: 'r' }, tk('r4', 'N₂O₄', R)] };
    var revRate = { y: 168, at: [2, 168], items: [cap('rl', 'reverse rate', { c: INK_R }), { gap: 0.7 }, tk('req', '= ', R)].concat(kr, [tk('rN', '[NO₂]', R), tk('r2c', '2', { sup: 1, c: INK_R })]) };
    if (step === 0) return [eq, fwdStep, revStep, { y: 236, items: [cap('c0', 'each one happens in a single step')] }];
    if (step === 1) return [eq, fwdRate, revStep, { y: 236, items: [cap('c1', 'one N₂O₄ breaks apart: rate = k × [N₂O₄]')] }];
    if (step === 2) return [eq, fwdRate, revRate, { y: 236, items: [cap('c2', 'two NO₂ collide: the coefficient 2 becomes the exponent')] }];
    if (step === 3) return [eq, { y: 104, items: [cap('c3', 'at equilibrium: forward rate = reverse rate')] },
      { y: 160, s: 1.3, items: kf.concat([tk('fN', '[N₂O₄]'), tk('mid', ' = ')], kr, [tk('rN', '[NO₂]', R), tk('r2c', '2', { sup: 1, c: INK_R })]) }];
    var left = { frac: 'bL', num: kf, den: kr }, right = { frac: 'bR', num: [tk('rN', '[NO₂]', R), tk('r2c', '2', { sup: 1, c: INK_R })], den: [tk('fN', '[N₂O₄]')] };
    if (step === 4) return [eq, { y: 96, items: [cap('c4a', 'divide both sides by '), cap('c4k', 'k', { c: INK_R }), cap('c4r', 'r', { c: INK_R, px: 9, sub: 1 }), cap('c4b', ' and by [N₂O₄]')] },
      { y: 170, s: 1.3, items: [left, tk('mid', ' = '), right] }];
    return [eq, { y: 96, items: [cap('c5', 'a constant ÷ a constant = a constant: K')] },
      { y: 170, s: 1.3, items: [left, tk('mid', ' = '), tk('K', 'K'), tk('mid2', ' = '), right] },
      { y: 258, items: [cap('c5b', 'products on top · reactants on the bottom')] },
      { y: 280, items: [cap('c5c', 'each coefficient becomes an exponent')] }];
  }
  var KDERIVE_DESC = [
    'N₂O₄ ⇌ 2NO₂ written as two elementary steps: the forward step N₂O₄ → 2NO₂ and the reverse step 2NO₂ → N₂O₄.',
    'Forward rate = k f times the concentration of N₂O₄.',
    'Reverse rate = k r times the concentration of NO₂ squared. The coefficient 2 has become the exponent.',
    'At equilibrium the forward rate equals the reverse rate: k f times [N₂O₄] = k r times [NO₂] squared.',
    'Divide both sides by k r and by [N₂O₄]: k f over k r = [NO₂] squared over [N₂O₄].',
    'k f over k r is a constant, K. So K = [NO₂] squared over [N₂O₄]: products on top, reactants on the bottom, coefficients as exponents.'
  ];
  function kderive(canvas, o) {
    var step = o.step || 0, from = o.from == null ? step : o.from;
    var to = kderiveRows(step);
    algDraw(canvas, from === step ? to : kderiveRows(from), to, 20, o);
    return KDERIVE_DESC[step];
  }

  /* ---------- kmulti: the overall K from a two-step mechanism (2NO₂ + F₂ ⇌ 2NO₂F) ----------
     Step 1 (slow) NO₂ + F₂ ⇌ NO₂F + F, step 2 (fast) NO₂ + F ⇌ NO₂F. Adding the steps cancels the
     intermediate F; multiplying K₁ × K₂ cancels [F]. Each K term flies out of the species it came from.
     The two [NO₂F] then merge into [NO₂F]² and the two [NO₂] into [NO₂]² (the second one's square
     flies out of it). Last step: double the equation and K is squared; the rate law stays put. */
  function kmultiRows(step) {
    var small = step >= 2 && step <= 4, ms = small ? 0.72 : 1, my = small ? [24, 50] : [62, 104], ax = 236;
    var strikeM = step === 1 || step === 4;
    var m1 = { y: my[0], s: ms, at: [5, ax], items: [cap('m1l', 'step 1 · slow', { px: small ? 9 : 11 }), { gap: 0.8 }, tk('m1a', 'NO₂'), tk('m1p', ' + '), tk('m1b', 'F₂'),
      { arrows: 'm1A' }, tk('m1c', 'NO₂F'), tk('m1q', ' + '), tk('m1d', 'F', { strike: strikeM })] };
    var m2 = { y: my[1], s: ms, at: [5, ax], items: [cap('m2l', 'step 2 · fast', { px: small ? 9 : 11 }), { gap: 0.8 }, tk('m2a', 'NO₂'), tk('m2p', ' + '), tk('m2b', 'F', { strike: strikeM }),
      { arrows: 'm2A' }, tk('m2c', 'NO₂F')] };
    var dbl = step === 6;
    var oy = step === 1 ? 158 : 36, os = step === 1 ? 1 : 1.12;
    var overall = { y: oy, s: os, at: [5, ax], items: [cap('ol', step === 1 ? 'overall' : dbl ? 'doubled' : ''), { gap: 0.8 }, tk('oa', dbl ? '4NO₂' : '2NO₂'), tk('op', ' + '), tk('ob', dbl ? '2F₂' : 'F₂'),
      { arrows: 'oA' }, tk('oc', dbl ? '4NO₂F' : '2NO₂F')] };
    if (step === 0) return [overall,
      { y: 104, items: [cap('c0a', 'rate law measured in the lab')] },
      { y: 134, s: 1.1, items: [tk('rr', 'rate = k'), tk('rb', '[NO₂]'), tk('rc', '[F₂]')] },
      { y: 186, items: [cap('c0n', 'not  '), tk('ng', 'rate = k[NO₂]²[F₂]', { c: DIM, strike: true })] },
      { y: 246, items: [cap('c0b', 'so the overall equation is not one step')] }];
    if (step === 1) return [m1, m2, { y: 130, at: [0, 108], items: [{ line: 'sum', len: 290 }] }, overall,
      { y: 214, items: [cap('c1a', 'F is made in step 1, then used up in step 2: an intermediate')] },
      { y: 236, items: [cap('c1b', 'the two NO₂ add up to 2NO₂, the two NO₂F to 2NO₂F')] }];
    var ST = step === 4;
    var k1n = [tk('k1n1', '[NO₂F]', { from: 'm1c' }), tk('k1n2', '[F]', { from: 'm1d', strike: ST })];
    var k1d = [tk('k1d1', '[NO₂]', { from: 'm1a' }), tk('k1d2', '[F₂]', { from: 'm1b' })];
    var k2n = [tk('k2n1', '[NO₂F]', { from: 'm2c' })];
    var k2d = [tk('k2d1', '[NO₂]', { from: 'm2a' }), tk('k2d2', '[F]', { from: 'm2b', strike: ST })];
    if (step === 2) return [m1, m2,
      { y: 124, at: [1, 190], items: [tk('k1L', 'K₁'), tk('k1e', ' = '), { frac: 'f1', num: k1n, den: k1d }] },
      { y: 208, at: [1, 190], items: [tk('k2L', 'K₂'), tk('k2e', ' = '), { frac: 'f2', num: k2n, den: k2d }] },
      { y: 280, items: [cap('c2', 'each step is elementary, so each has its own K')] }];
    if (step === 3 || step === 4) return [m1, m2,
      { y: 150, s: 1.1, items: [tk('k1L', 'K₁'), tk('x', ' × '), tk('k2L', 'K₂'), tk('k1e', ' = '), { frac: 'f1', num: k1n.concat(k2n), den: k1d.concat(k2d) }] },
      { y: 250, items: [cap(step === 3 ? 'c3' : 'c4', step === 3 ? 'multiply the two K expressions' : '[F] cancels, just as F cancelled when you added the steps')] }];
    // The two [NO₂F] become [NO₂F]²; the two [NO₂] become [NO₂]² (each square flies out of the copy it replaces)
    var sq1 = tk('sq1', dbl ? '4' : '2', { sup: 1, from: 'k2n1' }), sq2 = tk('sq2', dbl ? '4' : '2', { sup: 1, from: 'k2d1' });
    var num = [k1n[0], sq1], den = [k1d[0], sq2, k1d[1]];
    if (dbl) den = den.concat([tk('sqF', '2', { sup: 1 })]);
    if (step === 5) return [overall,
      { y: 150, s: 1.2, items: [tk('K', 'K'), tk('ke', ' = '), tk('k1L', 'K₁'), tk('x', ' × '), tk('k2L', 'K₂'), tk('k1e', ' = '), { frac: 'f1', num: num, den: den }] },
      { y: 240, items: [cap('c5a', 'the coefficients come back as exponents')] },
      { y: 262, items: [cap('c5b', 'K for the overall equation, straight from the balanced equation')] }];
    return [overall,
      { y: 116, s: 1.05, items: [tk('K', 'K'), tk('kd', 'doubled', { sub: 1, c: DIM }), tk('ke', ' = '), tk('kk', 'K²'), tk('k1e', ' = '), { frac: 'f1', num: num, den: den }] },
      { y: 172, items: [cap('c6a', 'write the equation twice over and K is squared')] },
      { y: 204, items: [tk('rr', 'rate = k[NO₂][F₂]', { px: 16 }), cap('c6r', '   still')] },
      { y: 228, items: [cap('c6b', 'the rate law comes from the steps, not from how you write the equation')] },
      { y: 270, items: [tk('road1', 'Kinetics asks which road you took.', { px: 14 })] },
      { y: 291, items: [tk('road2', 'Equilibrium only asks where you ended up.', { px: 14 })] }];
  }
  var KMULTI_DESC = [
    '2NO₂ + F₂ ⇌ 2NO₂F. The rate law measured in the lab is rate = k[NO₂][F₂], not k[NO₂] squared [F₂]. So the overall equation is not one step.',
    'Two steps: NO₂ + F₂ ⇌ NO₂F + F (slow), then NO₂ + F ⇌ NO₂F (fast). Added together, F cancels, leaving 2NO₂ + F₂ ⇌ 2NO₂F.',
    'Each step has its own K. K₁ = [NO₂F][F] over [NO₂][F₂]. K₂ = [NO₂F] over [NO₂][F].',
    'K₁ times K₂ = [NO₂F][F][NO₂F] over [NO₂][F₂][NO₂][F].',
    '[F] cancels top and bottom, just as F cancelled when the steps were added.',
    'K = K₁ times K₂ = [NO₂F] squared over [NO₂] squared [F₂]: the coefficients come back as exponents.',
    'Doubled, 4NO₂ + 2F₂ ⇌ 4NO₂F has K squared: [NO₂F] to the 4 over [NO₂] to the 4 [F₂] squared. The rate law is still rate = k[NO₂][F₂]. Kinetics asks which road you took. Equilibrium only asks where you ended up.'
  ];
  function kmulti(canvas, o) {
    var step = o.step || 0, from = o.from == null ? step : o.from;
    var to = kmultiRows(step);
    algDraw(canvas, from === step ? to : kmultiRows(from), to, 17, o);
    return KMULTI_DESC[step];
  }

  /* ---------- kmass: the law of mass action (summary) ----------
     A real example (N₂O₄ ⇌ 2NO₂, K = 4.63 × 10⁻³ at 25 °C) above the general form aA + bB ⇌ cC + dD.
     Coefficients and the exponents they become share a colour: reactant side ember, product side tide.
     Fades in top to bottom; o.t = seconds since the beat opened. */
  var RCT = '#b4561a', PRD = '#0d6e6c', ITAL = 'italic 700';
  function kmass(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var sc = Math.min(w / ALG.W, h / ALG.H), W = ALG.W;
    ctx.save(); ctx.translate((w - W * sc) / 2, (h - ALG.H * sc) / 2); ctx.scale(sc, sc);
    var t = o.still ? 9 : (o.t || 0);
    function at(t0) { return smooth((t - t0) / 0.5); }
    var sup = function (id, t2, c) { return tk(id, t2, { sup: 1, c: c }); };
    algStatic(ctx, [{ y: 28, items: [tk('a', 'N₂O₄(g)'), { arrows: 'e' }, tk('c', '2', { c: PRD }), tk('b', 'NO₂(g)')] }], 19, at(0.1));
    algStatic(ctx, [{ y: 88, items: [tk('k', 'K = '), { frac: 'f', num: [tk('n', '[NO₂]'), sup('n2', '2', PRD)], den: [tk('d', '[N₂O₄]')] },
      tk('v', ' = 4.63 × 10'), sup('ve', '−3')] }], 19, at(0.5));
    algStatic(ctx, [{ y: 134, items: [cap('c', 'at 25 °C · K is much smaller than 1, so reactants are favoured')] }], 19, at(0.9));
    var dv = at(1.2);
    if (dv > 0.01) { ctx.save(); ctx.globalAlpha = dv; ctx.strokeStyle = 'rgba(29,36,51,0.18)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(40, 160); ctx.lineTo(W - 40, 160); ctx.stroke(); ctx.restore(); }
    var cf = function (id, t2, c) { return tk(id, t2, { c: c, wt: ITAL }); };
    algStatic(ctx, [{ y: 192, items: [cf('a', 'a', RCT), tk('A', 'A'), tk('p', ' + '), cf('b', 'b', RCT), tk('B', 'B'), { arrows: 'e' },
      cf('c', 'c', PRD), tk('C', 'C'), tk('q', ' + '), cf('d', 'd', PRD), tk('D', 'D')] }], 20, at(1.4));
    algStatic(ctx, [{ y: 258, at: [0, 22], items: [tk('k', 'K = '), { frac: 'f',
      num: [tk('C', '[C]'), tk('c', 'c', { sup: 1, c: PRD, wt: ITAL }), tk('D', '[D]'), tk('d', 'd', { sup: 1, c: PRD, wt: ITAL })],
      den: [tk('A', '[A]'), tk('a', 'a', { sup: 1, c: RCT, wt: ITAL }), tk('B', '[B]'), tk('b', 'b', { sup: 1, c: RCT, wt: ITAL })] }] }], 20, at(1.9));
    var bx = at(2.4);
    if (bx > 0.01) {
      ctx.save(); ctx.globalAlpha = bx;
      var X0 = 236, Y0 = 236, BW = 206, BH = 44;
      ctx.fillStyle = INK; roundBox(ctx, X0 + 4, Y0 + 4, BW, BH, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; roundBox(ctx, X0, Y0, BW, BH, 8); ctx.fill(); ctx.stroke();
      ctx.font = ITAL + ' 20px ' + BODY; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Law of Mass Action', X0 + BW / 2, Y0 + BH / 2 + 1);
      ctx.restore();
    }
    algStatic(ctx, [{ y: 312, items: [cap('c', 'products on top · reactants on the bottom · coefficients become exponents')] }], 19, at(2.8));
    ctx.restore();
    return 'The law of mass action. Example: N₂O₄ ⇌ 2NO₂, K = [NO₂] squared over [N₂O₄] = 4.63 × 10 to the −3 at 25 °C, much smaller than 1, so reactants are favoured. In general, for aA + bB ⇌ cC + dD, K = [C] to the c times [D] to the d, over [A] to the a times [B] to the b: products on top, reactants on the bottom, coefficients become exponents.';
  }

  /* ---------- kmanip: changing the equation changes K ----------
     0 two equations add up; C and D cancel · 1 each equation's K (each term flies out of its species)
     2 K₁ × K₂: [C] and [D] cancel, leaving K, so K = K₁ × K₂ · 3 N₂O₄ ⇌ 2NO₂, K = 4.63 × 10⁻³
     4 written backwards: the species cross over, the fraction flips, K′ = 1/K = 216. */
  function kmanipRows(step) {
    if (step <= 2) {
      var sm = step >= 1, s = sm ? 0.72 : 1, y = sm ? [22, 46, 80] : [62, 112, 176], ax = sm ? 196 : 206, lx = sm ? 312 : 336, ly = sm ? 62 : 144;
      var rows = [
        { y: y[0], s: s, at: [3, ax], items: [tk('aA', 'A'), tk('p1', ' + '), tk('aB', 'B'), { arrows: 'a1' }, tk('aC', 'C', { strike: 1 }), tk('p2', ' + '), tk('aD', 'D', { strike: 1 })] },
        { y: y[0], s: s, at: [0, lx], items: [tk('L1', 'K₁')] },
        { y: y[1], s: s, at: [3, ax], items: [tk('bC', 'C', { strike: 1 }), tk('p3', ' + '), tk('bD', 'D', { strike: 1 }), { arrows: 'a2' }, tk('bE', 'E'), tk('p4', ' + '), tk('bF', 'F')] },
        { y: y[1], s: s, at: [0, lx], items: [tk('L2', 'K₂')] },
        { y: ly, s: s, at: [0, ax - 112 * s], items: [{ line: 'sum', len: 270 * s }] },
        { y: y[2], s: s, at: [3, ax], items: [tk('cA', 'A'), tk('p5', ' + '), tk('cB', 'B'), { arrows: 'a3' }, tk('cE', 'E'), tk('p6', ' + '), tk('cF', 'F')] },
        { y: y[2], s: s, at: [0, lx], items: [tk('L3', 'K')] }
      ];
      if (step === 0) return rows.concat([{ y: 250, items: [cap('c0', 'add the equations: C and D are made, then used up, so they cancel')] }]);
      var kRow = { y: 248, s: 1.05, items: [tk('e3', 'K', { from: 'L3' }), tk('e3q', ' = '), { frac: 'f3', num: [tk('kE', '[E]', { from: 'cE' }), tk('kF', '[F]', { from: 'cF' })], den: [tk('kA', '[A]', { from: 'cA' }), tk('kB', '[B]', { from: 'cB' })] }] };
      var n1 = [tk('n1C', '[C]', { from: 'aC' }), tk('n1D', '[D]', { from: 'aD' })], d1 = [tk('d1A', '[A]', { from: 'aA' }), tk('d1B', '[B]', { from: 'aB' })];
      var n2 = [tk('n2E', '[E]', { from: 'bE' }), tk('n2F', '[F]', { from: 'bF' })], d2 = [tk('d2C', '[C]', { from: 'bC' }), tk('d2D', '[D]', { from: 'bD' })];
      if (step === 1) return rows.concat([
        { y: 150, at: [0, 34], items: [tk('e1', 'K₁', { from: 'L1' }), tk('e1q', ' = '), { frac: 'f1', num: n1, den: d1 }] },
        { y: 150, at: [0, 252], items: [tk('e2', 'K₂', { from: 'L2' }), tk('e2q', ' = '), { frac: 'f2', num: n2, den: d2 }] },
        kRow]);
      function st(t0) { return tk(t0.id, t0.t, { from: t0.from, strike: 1 }); }
      return rows.concat([
        { y: 156, s: 1.05, items: [tk('e1', 'K₁'), tk('x', ' × '), tk('e2', 'K₂'), tk('e1q', ' = '),
          { frac: 'f1', num: [st(n1[0]), st(n1[1]), n2[0], n2[1]], den: [d1[0], d1[1], st(d2[0]), st(d2[1])] }] },
        kRow,
        { y: 306, s: 1.1, items: [tk('r1', 'K = K₁ × K₂')] }]);
    }
    var fwdEq = { y: 34, items: [tk('rA', 'N₂O₄'), { arrows: 'ra' }, tk('rB', '2NO₂')] };
    var fwdK = { y: 98, items: [tk('fK', 'K = '), { frac: 'ff', num: [tk('fn', '[NO₂]'), tk('fn2', '2', { sup: 1 })], den: [tk('fd', '[N₂O₄]')] }, tk('fv', ' = 4.63 × 10'), tk('fe', '−3', { sup: 1 })] };
    var c3 = { y: 146, items: [cap('c3', 'at 25 °C · much smaller than 1: N₂O₄ is favoured')] };
    if (step === 3) return [fwdEq, fwdK, c3];
    return [fwdEq, fwdK, c3,
      { y: 188, items: [tk('qA', '2NO₂', { from: 'rB' }), { arrows: 'qa' }, tk('qB', 'N₂O₄', { from: 'rA' })] },
      { y: 254, items: [tk('gK', 'K′ = '), { frac: 'gf', num: [tk('gn', '[N₂O₄]', { from: 'fd' })], den: [tk('gd', '[NO₂]', { from: 'fn' }), tk('gd2', '2', { sup: 1, from: 'fn2' })] },
        tk('gq', ' = '), { frac: 'g1', num: [tk('g1n', '1')], den: [tk('g1d', 'K')] }, tk('gv', ' = 216')] },
      { y: 308, items: [cap('c4', 'written backwards, the fraction flips over: K′ = 1/K')] }];
  }
  var KMANIP_DESC = [
    'Two equations add up: A + B ⇌ C + D with K₁, and C + D ⇌ E + F with K₂, give A + B ⇌ E + F with K. C and D cancel.',
    'Each equation has its own K. K₁ = [C][D] over [A][B]. K₂ = [E][F] over [C][D]. K = [E][F] over [A][B].',
    'K₁ times K₂ = [C][D][E][F] over [A][B][C][D]. [C] and [D] cancel, leaving [E][F] over [A][B], which is K. So K = K₁ × K₂.',
    'N₂O₄ ⇌ 2NO₂ has K = [NO₂] squared over [N₂O₄] = 4.63 × 10 to the −3 at 25 °C.',
    'Written backwards, 2NO₂ ⇌ N₂O₄ has K′ = [N₂O₄] over [NO₂] squared = 1 over K = 216. The fraction flips over.'
  ];
  function kmanip(canvas, o) {
    var step = o.step || 0, from = o.from == null ? step : o.from;
    var to = kmanipRows(step);
    algDraw(canvas, from === step ? to : kmanipRows(from), to, 18, o);
    return KMANIP_DESC[step];
  }

  /* ---------- kpure: solids and pure liquids are left out of K ----------
     0 CaCO₃(s) ⇌ CaO(s) + CO₂(g) and K written by mass action as it is · 1 the two solids are struck,
     leaving K = [CO₂] (flies out of [CO₂]) · 2 NH₃(aq) + H₂O(l): solvent water struck · 3 2H₂ + O₂ ⇌ 2H₂O(g):
     water as a gas stays in · 4 AgCl(s) ⇌ Ag⁺ + Cl⁻: K = [Ag⁺][Cl⁻] (Ksp later), with the in / out summary. */
  function kpureRows(step) {
    var sq = function (id) { return tk(id, '2', { sup: 1 }); };
    if (step <= 1) {
      var S = step === 1 ? 1 : 0;
      return [
        { y: 40, items: [tk('a', 'CaCO₃(s)'), { arrows: 'e' }, tk('b', 'CaO(s)'), tk('p', ' + '), tk('c', 'CO₂(g)')] },
        { y: 124, items: [tk('k', 'K = '), { frac: 'f', num: [tk('kb', '[CaO]', { from: 'b', strike: S }), tk('kc', '[CO₂]', { from: 'c' })], den: [tk('ka', '[CaCO₃]', { from: 'a', strike: S })] }] }
      ].concat(step === 0 ? [
        { y: 214, items: [cap('c0a', 'the law of mass action, as it is')] },
        { y: 236, items: [cap('c0b', 'but two of these are pure solids')] }
      ] : [
        { y: 204, s: 1.25, items: [tk('k2', 'K = '), tk('k2c', '[CO₂]', { from: 'kc' })] },
        { y: 262, items: [cap('c1a', 'a pure solid\'s concentration never changes, so it is left out')] },
        { y: 284, items: [cap('c1b', 'only the gas is left')] }
      ]);
    }
    if (step === 2) return [
      { y: 40, s: 0.92, items: [tk('na', 'NH₃(aq)'), tk('np', ' + '), tk('nw', 'H₂O(l)'), { arrows: 'ne' }, tk('nb', 'NH₄⁺(aq)'), tk('nq', ' + '), tk('nc', 'OH⁻(aq)')] },
      { y: 120, items: [tk('k', 'K = '), { frac: 'f', num: [tk('kb', '[NH₄⁺]', { from: 'nb' }), tk('kc', '[OH⁻]', { from: 'nc' })], den: [tk('ka', '[NH₃]', { from: 'na' }), tk('kw', '[H₂O]', { from: 'nw', strike: 1 })] }] },
      { y: 204, s: 1.15, items: [tk('k2', 'K = '), { frac: 'f2', num: [tk('k2b', '[NH₄⁺]', { from: 'kb' }), tk('k2c', '[OH⁻]', { from: 'kc' })], den: [tk('k2a', '[NH₃]', { from: 'ka' })] }] },
      { y: 270, items: [cap('c2a', 'water is the solvent, a pure liquid, so it is left out')] },
      { y: 292, items: [cap('c2b', 'about 55.5 mol/L, and the reaction barely changes it')] }
    ];
    if (step === 3) return [
      { y: 40, items: [tk('ha', '2H₂(g)'), tk('hp', ' + '), tk('hb', 'O₂(g)'), { arrows: 'he' }, tk('hw', '2H₂O(g)')] },
      { y: 136, s: 1.15, items: [tk('k', 'K = '), { frac: 'f', num: [tk('kw', '[H₂O]', { from: 'hw' }), sq('kw2')], den: [tk('ka', '[H₂]', { from: 'ha' }), sq('ka2'), tk('kb', '[O₂]', { from: 'hb' })] }] },
      { y: 222, items: [cap('c3a', 'here water is a gas, so it stays in K')] },
      { y: 262, items: [tk('l1', 'H₂O(l): left out', { px: 15, c: DIM }), { gap: 1.6 }, tk('l2', 'H₂O(g): stays in', { px: 15 })] },
      { y: 292, items: [cap('c3b', 'check the phase, not the formula')] }
    ];
    return [
      { y: 40, items: [tk('sa', 'AgCl(s)'), { arrows: 'se' }, tk('sb', 'Ag⁺(aq)'), tk('sp', ' + '), tk('sc', 'Cl⁻(aq)')] },
      { y: 112, s: 1.2, items: [tk('k', 'K = '), tk('kb', '[Ag⁺]', { from: 'sb' }), tk('kc', '[Cl⁻]', { from: 'sc' })] },
      { y: 156, items: [cap('c4a', 'the solid is left out: only the ions are left')] },
      { y: 178, items: [cap('c4b', 'we will see this K again as K'), cap('c4s', 'sp', { px: 9, sub: 1 }), cap('c4c', ' in the solubility unit')] },
      { y: 236, items: [tk('in', 'in K:  (g)  and  (aq)', { px: 17 })] },
      { y: 270, items: [tk('out', 'left out:  (s)  and  (l)', { px: 17, c: DIM })] }
    ];
  }
  var KPURE_DESC = [
    'CaCO₃(s) ⇌ CaO(s) + CO₂(g). Written by the law of mass action as it is, K = [CaO][CO₂] over [CaCO₃]. Two of these are pure solids.',
    '[CaO] and [CaCO₃] are crossed out: a pure solid\'s concentration never changes, so it is left out. K = [CO₂].',
    'NH₃(aq) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq). Water is the solvent, a pure liquid, so [H₂O] is crossed out. K = [NH₄⁺][OH⁻] over [NH₃].',
    '2H₂(g) + O₂(g) ⇌ 2H₂O(g). Here water is a gas, so it stays in: K = [H₂O] squared over [H₂] squared [O₂]. H₂O(l) is left out, H₂O(g) stays in.',
    'AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq). The solid is left out: K = [Ag⁺][Cl⁻]. In K: gases and aqueous species. Left out: solids and pure liquids.'
  ];
  function kpure(canvas, o) {
    var step = o.step || 0, from = o.from == null ? step : o.from;
    var to = kpureRows(step);
    algDraw(canvas, from === step ? to : kpureRows(from), to, 18, o);
    return KPURE_DESC[step];
  }

  /* ---------- equation card ---------- */
  function equation(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    label(ctx, o.title || '', w / 2, h * 0.3, { font: BODY, weight: '700', size: 18, color: INK });
    var size = Math.min(26, Math.max(14, w / Math.max(10, (o.eq || '').length) * 1.5));
    label(ctx, o.eq || '', w / 2, h * 0.52, { font: BODY, weight: '700', size: size, color: INK });
    if (o.note) label(ctx, o.note, w / 2, h * 0.72, { size: 11 });
  }

  global.EqPictures = { energy: energy, beaker: beaker, spread: spread, coldpack: coldpack, favour: favour, gibbs4: gibbs4, paths: paths, equation: equation, intro4: intro4, kpuzzle: kpuzzle, kderive: kderive, kmulti: kmulti, kmass: kmass, kmanip: kmanip, kpure: kpure };
  // Shared drawing helpers for the live scenes (eq-scenes.js)
  global.EqPictures.util = { fit: fit, ball: ball, label: label, roundBox: roundBox, arrow: arrow, mix: mix, rng: rng, smooth: smooth,
    INK: INK, DIM: DIM, FAINT: FAINT, EMBER: EMBER, TIDE: TIDE, MONO: MONO, BODY: BODY };
})(window);
