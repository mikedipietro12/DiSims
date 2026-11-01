/**
 * Intro to Equilibrium - live scenes for the Guide ("Equilibrium around us" and the diamond in "Limits of ΔG").
 *
 *   soda  - CO₂(g) ⇌ CO₂(aq): a fizzing bottle zooms into its neck. Cap on / off, cold / warm.
 *   ocean - CO₂(g) ⇌ CO₂(aq) between the air and the sea. Cold / warm, add CO₂ to the air.
 *   diamond - C(diamond) → C(graphite): ΔG −, but a huge hill. Time-lapse clock; heat it (no air) to cross.
 *   blood - the four carbonic acid equilibria, written large and small with each breath. Regular breathing / panic attack / exercise.
 *
 * Unlike the looping pictures, these keep state: change a condition and the particles settle
 * into a new balance, then change it back and they return. Crossings happen one particle at a
 * time, so the equilibrium is never still. The equation's two half-arrows grow and shrink with
 * the rolling forward and reverse rates, so "rates equal" is something you can see.
 * Coordinates are normalised to each scene's region, so the scenes rescale (full screen later).
 *
 * API: EqScenes.create(id, canvas, { reduced }) → { controls, set(key, val), action(key),
 *      update(dt), draw(), describe() }
 */
(function (global) {
  'use strict';

  var U = global.EqPictures.util;
  var fit = U.fit, ball = U.ball, label = U.label, roundBox = U.roundBox, mix = U.mix, rng = U.rng, smooth = U.smooth;
  var INK = U.INK, DIM = U.DIM, EMBER = U.EMBER, TIDE = U.TIDE, BODY = U.BODY, FAINT_LINE = U.FAINT;
  var C_A = ['#3a3f4b', '#9aa3b5'], O_A = ['#e0503a', '#ff8a6a'], H_A = ['#d5d9e3', '#ffffff'];
  var RATE_WINDOW = 3;   // seconds of events behind each live arrow

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ---------- shared drawing ---------- */

  // O=C=O, linear, rotating in the picture plane.
  // look 'gas': colourless glassy atoms (as N₂O₄ in the vessel); 'aq': coloured atoms under a blue tint.
  function co2(ctx, x, y, r, rot, alpha, look) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    var dx = Math.cos(rot) * r * 1.25, dy = Math.sin(rot) * r * 1.25 * 0.6;
    var back = dy < 0 ? -1 : 1;
    co2Atom(ctx, x - dx * back, y - dy * back, r * 0.85, O_A, look);
    co2Atom(ctx, x, y, r * 0.75, C_A, look);
    co2Atom(ctx, x + dx * back, y + dy * back, r * 0.85, O_A, look);
    ctx.restore();
  }
  function co2Atom(ctx, x, y, r, col, look) {
    if (look === 'gas') {
      var g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.7, 'rgba(235,239,246,0.45)'); g.addColorStop(1, 'rgba(160,170,190,0.5)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(29,36,51,0.6)'; ctx.lineWidth = 1.1; ctx.stroke();
      return;
    }
    ball(ctx, x, y, r, col[0], col[1]);
    if (look === 'aq') { ctx.fillStyle = 'rgba(79,151,196,0.38)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  }

  // Rolling event counter → rate per second
  function rateMeter() {
    var ev = [];
    return {
      add: function (t) { ev.push(t); },
      rate: function (t) { while (ev.length && ev[0] < t - RATE_WINDOW) ev.shift(); return ev.length / RATE_WINDOW; },
      clear: function () { ev = []; },
    };
  }

  // Equation across the top. parts: strings and { f, r } arrow pairs (rates per second).
  // Each half-arrow's length follows its rate, so equal rates read as equal arrows.
  function liveEquation(ctx, w, y, parts, size, maxRate) {
    var aw = 52, gap = 10, widths, total;
    // Shrink the text until the whole equation fits the width
    for (; size > 9; size -= 0.5) {
      ctx.font = '700 ' + size + 'px ' + BODY;
      widths = parts.map(function (q) { return typeof q === 'string' ? ctx.measureText(q).width : aw; });
      total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (parts.length - 1);
      if (total <= w - 12) break;
    }
    var x = (w - total) / 2;
    parts.forEach(function (q, i) {
      if (typeof q === 'string') label(ctx, q, x, y, { font: BODY, size: size, color: INK, align: 'left' });
      else {
        var mid = x + aw / 2;
        var lf = 10 + (aw - 10) * clamp(q.f / maxRate, 0, 1), lr = 10 + (aw - 10) * clamp(q.r / maxRate, 0, 1);
        half(ctx, mid - lf / 2, mid + lf / 2, y - 4, true);
        half(ctx, mid - lr / 2, mid + lr / 2, y + 4, false);
      }
      x += widths[i] + gap;
    });
  }
  function half(ctx, x0, x1, y, right) {
    var tip = right ? x1 : x0, tail = right ? x0 : x1, dir = right ? 1 : -1, barb = right ? -1 : 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * 8, y + barb * 6); ctx.stroke();
  }

  // A small frosted panel of labelled bars (no numbers). bars: [{ name, k (0–1), color, mark }]
  function meterPanel(ctx, x, y, w, bars, title) {
    var rowH = 22, h = 14 + (title ? 16 : 0) + bars.length * rowH;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.strokeStyle = 'rgba(29,36,51,0.25)'; ctx.lineWidth = 1;
    roundBox(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke();
    var yy = y + 12;
    if (title) { label(ctx, title, x + 10, yy, { size: 10, align: 'left' }); yy += 16; }
    bars.forEach(function (b) {
      label(ctx, b.name, x + 10, yy + 5, { size: 10, color: INK, align: 'left' });
      var bx = x + 64, bw = w - 74;
      ctx.fillStyle = 'rgba(29,36,51,0.08)'; roundBox(ctx, bx, yy, bw, 10, 5); ctx.fill();
      ctx.fillStyle = b.color; roundBox(ctx, bx, yy, Math.max(4, bw * clamp(b.k, 0, 1)), 10, 5); ctx.fill();
      if (b.mark != null) {
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx + bw * b.mark, yy - 3); ctx.lineTo(bx + bw * b.mark, yy + 13); ctx.stroke();
      }
      yy += rowH;
    });
    ctx.restore();
  }

  // Frosted panel of counted rows. rows: [name, count, colour, full-scale count, optional start mark]
  function countPanel(ctx, x, y, w, title, rows, minH) {
    var h = Math.max(26 + rows.length * 30, minH || 0);
    ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.strokeStyle = 'rgba(29,36,51,0.25)'; ctx.lineWidth = 1;
    roundBox(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke();
    label(ctx, title, x + 12, y + 14, { size: 10, align: 'left' });
    rows.forEach(function (row, i) {
      var yy = y + 34 + i * 30, bw = w - 24;
      label(ctx, row[0], x + 12, yy, { size: 10, color: INK, align: 'left' });
      label(ctx, String(row[1]), x + w - 12, yy, { size: 11, color: INK, align: 'right' });
      ctx.fillStyle = 'rgba(29,36,51,0.08)'; roundBox(ctx, x + 12, yy + 8, bw, 8, 4); ctx.fill();
      ctx.fillStyle = row[2]; roundBox(ctx, x + 12, yy + 8, Math.max(4, bw * clamp(row[1] / row[3], 0, 1)), 8, 4); ctx.fill();
      if (row[4] != null) {
        var mx = x + 12 + bw * clamp(row[4] / row[3], 0, 1);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx, yy + 5); ctx.lineTo(mx, yy + 19); ctx.stroke();
      }
    });
    return h;
  }

  function ring(ctx, x, y, k, r) {
    ctx.strokeStyle = 'rgba(29,36,51,' + (0.45 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r * (1 + 1.6 * k), 0, Math.PI * 2); ctx.stroke();
  }

  // Carbonic acid family: C CO₂ · A H₂CO₃ · B HCO₃⁻ (yellow glow, −) · H H⁺ (red glow, +)
  function carbonSp(ctx, sp, x, y, r, rot, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    if (sp === 'C') { ctx.restore(); co2(ctx, x, y, r, rot, alpha); return; }
    if (sp === 'H') {
      var gH = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.9);
      gH.addColorStop(0, 'rgba(232,38,79,0.4)'); gH.addColorStop(1, 'rgba(232,38,79,0)');
      ctx.fillStyle = gH; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI * 2); ctx.fill();
      ball(ctx, x, y, r * 0.6, H_A[0], H_A[1]);
      label(ctx, '+', x, y + 0.5, { size: Math.max(8, r * 1.1), color: INK });
      ctx.restore(); return;
    }
    if (sp === 'B') {
      var gB = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.4);
      gB.addColorStop(0, 'rgba(255,194,26,0.45)'); gB.addColorStop(1, 'rgba(255,194,26,0)');
      ctx.fillStyle = gB; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill();
    }
    // H₂CO₃ / HCO₃⁻: C with three O, and two or one H
    var nH = sp === 'A' ? 2 : 1;
    for (var q = 0; q < 3; q++) {
      var a = rot + q * Math.PI * 2 / 3, ox = x + Math.cos(a) * r * 1.15, oy = y + Math.sin(a) * r * 0.85;
      if (q < nH) ball(ctx, x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.4, r * 0.42, H_A[0], H_A[1]);
      ball(ctx, ox, oy, r * 0.72, O_A[0], O_A[1]);
    }
    ball(ctx, x, y, r * 0.7, C_A[0], C_A[1]);
    if (sp === 'B') label(ctx, '−', x + r * 1.9, y - r * 1.6, { size: Math.max(9, r * 1.3), color: INK });
    ctx.restore();
  }

  /* ---------- the soda bottle (shared by the soda scene and the Guide's opening picture) ----------
     World units: the bottle is 100 tall, x centred on 0, y down from the top of the glass lip.
     b = { fill: liquid surface y, asp: close-up x stretch, base: the canvas's own transform, capK: 0 on → 1 off } */
  // Outer half-width of the glass at height y, and the inner bore
  function hw(y) {
    if (y < 3.2) return 5.6;                                   // lip bead (under the cap)
    if (y < 4.4) return 5.0;
    if (y < 30) return 5.0 + (y - 4.4) / 25.6 * 0.9;           // long, slightly tapering neck
    if (y < 52) return 5.9 + 7.1 * smooth((y - 30) / 22);      // sloping shoulder
    return 13;
  }
  function bore(y) { return y < 4.4 ? 3.7 : hw(y) - 0.9; }

  // Stroke the current path with a width in screen pixels, even inside the stretched close-up
  function linePx(ctx, lw, base) { ctx.save(); ctx.setTransform(base); ctx.lineWidth = lw; ctx.stroke(); ctx.restore(); }

  // Glass outline (outer) or bore (inner), traced in world units
  function glassPath(ctx, inner) {
    var f = inner ? bore : hw, base = inner ? 98.4 : 100, y;
    ctx.beginPath(); ctx.moveTo(-f(0), 0);
    for (y = 0; y <= 95; y += 0.5) ctx.lineTo(f(y), y);
    ctx.quadraticCurveTo(f(95), base, f(95) - 3, base);
    ctx.lineTo(-f(95) + 3, base);
    ctx.quadraticCurveTo(-f(95), base, -f(95), 95);
    for (y = 95; y >= 0; y -= 0.5) ctx.lineTo(-f(y), y);
    ctx.closePath();
  }

  // Crown cap, drawn at the origin of the lip; capK 0 = on, 1 = lifted away to the upper left
  function cap(ctx, b) {
    var k = smooth(b.capK);
    ctx.save();
    ctx.translate(-18 * k, -16 * k); ctx.rotate(-1.1 * k);
    var top = -2.6, skirt = 2.4, half = 6.1;
    var g = ctx.createLinearGradient(-half, 0, half, 0);
    g.addColorStop(0, '#c9960f'); g.addColorStop(0.4, '#f6cf3e'); g.addColorStop(0.6, '#f9db6a'); g.addColorStop(1, '#b8870c');
    ctx.beginPath();
    ctx.moveTo(-half + 0.6, top); ctx.quadraticCurveTo(0, top - 0.7, half - 0.6, top);
    ctx.quadraticCurveTo(half, top, half, top + 0.8);
    var n = 9, step = (2 * half) / n;
    for (var i = 0; i <= n; i++) ctx.lineTo(half - i * step, i % 2 ? skirt - 0.6 : skirt);
    ctx.lineTo(-half, top + 0.8); ctx.quadraticCurveTo(-half, top, -half + 0.6, top);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineJoin = 'round'; linePx(ctx, 1.8, b.base);
    // Crimp flutes
    ctx.strokeStyle = 'rgba(120,80,0,0.45)';
    for (var j = 1; j < n; j++) { var fx = half - j * step; ctx.beginPath(); ctx.moveTo(fx, top + 1.2); ctx.lineTo(fx, skirt - 0.7); linePx(ctx, 1, b.base); }
    ctx.restore();
  }

  // Back of the bottle: glass, then the bore filled with gas above the line and drink below it
  function drawGlass(ctx, cold, b) {
    var FILL = b.fill;
    glassPath(ctx, false); ctx.fillStyle = 'rgba(214,232,240,0.75)'; ctx.fill();
    glassPath(ctx, true); ctx.fillStyle = 'rgba(244,250,253,0.95)'; ctx.fill();
    ctx.save(); glassPath(ctx, true); ctx.clip();
    var tint = cold ? '#dceef8' : '#e3f0f6';
    var lg = ctx.createLinearGradient(-13, 0, 13, 0);
    lg.addColorStop(0, mix(tint, '#6f9cbd', 0.3)); lg.addColorStop(0.45, tint); lg.addColorStop(0.6, tint); lg.addColorStop(1, mix(tint, '#6f9cbd', 0.35));
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(-14, FILL - 0.5); ctx.quadraticCurveTo(-3, FILL + 0.15, 0, FILL); ctx.quadraticCurveTo(3, FILL + 0.15, 14, FILL - 0.5);
    ctx.lineTo(14, 101); ctx.lineTo(-14, 101); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(111,156,189,0.6)';
    ctx.beginPath(); ctx.moveTo(-14, FILL - 0.5); ctx.quadraticCurveTo(-3, FILL + 0.15, 0, FILL); ctx.quadraticCurveTo(3, FILL + 0.15, 14, FILL - 0.5); linePx(ctx, 1.5, b.base);
    ctx.restore();
  }
  // Front of the bottle: labels, condensation, edges and highlights
  function drawFront(ctx, cold, b) {
    var asp = b.asp;
    // Labels: a round one on the shoulder, a band around the body
    ctx.fillStyle = '#f6cf3e'; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.ellipse(0, 42, 3.1 / asp, 3.1, 0, 0, Math.PI * 2); ctx.fill(); linePx(ctx, 1.4, b.base);
    ctx.beginPath(); ctx.rect(-13, 68, 26, 15); ctx.fill(); linePx(ctx, 1.4, b.base);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-10.5, 68.6, 2.2, 13.8);
    // Condensation on a cold bottle
    if (cold) {
      var dr = rng(7);
      for (var k = 0; k < 90; k++) {
        var dy = 6 + dr() * 88, side = dr() < 0.5 ? -1 : 1, dx = side * hw(dy) * (0.55 + dr() * 0.42), rs = 0.12 + dr() * 0.3;
        if (dy > 67.5 && dy < 83.5) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(dx, dy, rs / asp, rs, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(110,150,180,0.5)'; linePx(ctx, 0.8, b.base);
      }
    }
    // Glass edges and highlights
    ctx.strokeStyle = 'rgba(29,36,51,0.35)'; glassPath(ctx, true); linePx(ctx, 1, b.base);
    ctx.strokeStyle = INK; ctx.lineJoin = 'round'; glassPath(ctx, false); linePx(ctx, 2.4, b.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineCap = 'round';
    ctx.beginPath(); for (var y = 6; y <= 64; y += 1) ctx[y === 6 ? 'moveTo' : 'lineTo'](-hw(y) * 0.68, y); linePx(ctx, 1.2, b.base);
    ctx.beginPath(); ctx.moveTo(-9, 86); ctx.lineTo(-9, 94); linePx(ctx, 1.2, b.base);
  }

  /* =====================================================================
     SODA: CO₂(g) ⇌ CO₂(aq) in a glass bottle
     Opens on the whole bottle fizzing, then the camera zooms into the neck, where the cap, the
     gas above the drink and the liquid surface all fit in view. Molecules appear once zoomed.
     World units: the bottle is 100 tall, x centred on 0, y down from the top of the glass lip.
     ===================================================================== */
  function soda(canvas, opts) {
    var FILL = 10, TOP = 2.6, FLOOR = 23;          // liquid surface, just under the cap's skirt, hidden floor of the close-up
    var VIEW = [-5, 22];                           // world y shown in the close-up
    var HOLD = 1.8, ZOOM = 2.2, FADE = 0.8;        // intro timing (s)
    var R = 0.42;                                  // molecule radius (world units)
    var VG = 5.5, VD = 3;
    var P = { cold: { pd: 0.6, pe: 0.6, v: 1 }, warm: { pd: 0.18, pe: 1, v: 1.45 } };
    var N0 = 36, GAS0 = 7, PANEL_W = 140;
    var st = { cap: 'on', temp: 'cold' }, parts, bubbles, flashes, time, opened, capK, inR, outR, intro;
    var asp = 1, baseT;                            // close-up x stretch; the canvas's own transform

    function line(ctx, lw) { linePx(ctx, lw, baseT); }
    function kit() { return { fill: FILL, asp: asp, base: baseT, capK: capK }; }

    function reset() {
      parts = []; bubbles = []; flashes = []; time = 0; opened = -10; capK = 0;
      inR = rateMeter(); outR = rateMeter();
      intro = opts.reduced ? HOLD + ZOOM + FADE : 0;
      for (var i = 0; i < N0; i++) {
        if (i < GAS0) parts.push(gasP(rand(-3, 3), rand(TOP + 1, FILL - 1)));
        else parts.push(liqP(rand(-3.6, 3.6), rand(FILL + 1, FLOOR - 0.5)));
      }
      for (var b = 0; b < 70; b++) bubbles.push(fizz(rand(FILL, 95)));
      st.cap = 'on';
    }
    function gasP(x, y) { var a = rand(0, Math.PI * 2); return { ph: 'g', x: x, y: y, vx: Math.cos(a) * VG, vy: Math.sin(a) * VG, rot: rand(0, 6.3), vr: rand(-3, 3) }; }
    function liqP(x, y) { var a = rand(0, Math.PI * 2); return { ph: 'd', x: x, y: y, vx: Math.cos(a) * VD, vy: Math.sin(a) * VD, rot: rand(0, 6.3), vr: rand(-1, 1), turn: rand(0, 0.5) }; }
    // A rising fizz bubble (visual only), started at height y somewhere across the drink
    function fizz(y) { return { x: rand(-0.85, 0.85), y: y, r: rand(0.18, 0.45), w: rand(0, 6) }; }

    function zoomed() { return intro >= HOLD + ZOOM; }
    function skipIntro() { if (!zoomed()) intro = HOLD + ZOOM; }

    function update(dt) {
      time += dt;
      if (intro < HOLD + ZOOM + FADE) intro += dt;
      capK = clamp(capK + (st.cap === 'off' ? dt : -dt) / 0.6, 0, 1);
      var pr = P[st.temp], sp = (opts.reduced ? 0.35 : 1) * pr.v, open = capK > 0.25;
      var since = time - opened;
      // Right after opening, dissolved CO₂ rushes out as bubbles; it eases to a steady fizz
      var bubbleOut = st.cap === 'off' ? 0.03 + 0.12 * Math.exp(-since / 3) : 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i], lim;
        p.rot += p.vr * dt * sp;
        if (p.ph === 'out') {                           // escaped from the open mouth
          p.x += p.vx * dt * sp; p.y += p.vy * dt * sp; p.life -= dt;
          if (p.life <= 0) parts.splice(i, 1);
          continue;
        }
        if (p.ph === 'bub') {                           // carried up inside a bubble
          p.y -= dt * 5 * sp; p.br = Math.min(1.1, p.br + dt * 0.8);
          p.x += Math.sin(time * 4 + p.rot) * dt * 0.4;
          if (p.y < FILL + 0.3) {
            p.ph = 'g'; p.y = FILL - 0.5; p.vy = -VG; p.vx = rand(-1, 1) * VG * 0.4;
            outR.add(time); flashes.push({ x: p.x, y: FILL, t: 0, pop: 1 });
          }
          continue;
        }
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp;
        lim = bore(p.y) - R * 1.4 / asp;
        if (p.x < -lim) { p.x = -lim; p.vx = Math.abs(p.vx); }
        if (p.x > lim) { p.x = lim; p.vx = -Math.abs(p.vx); }
        if (p.ph === 'g') {
          if (p.y < TOP + R && p.vy < 0) {
            if (open) { p.ph = 'out'; p.life = 1.6; p.vy = -rand(3, 5); p.vx = rand(-1.5, 1.5); }
            else { p.y = TOP + R; p.vy = Math.abs(p.vy); }
          }
          if (p.y > FILL - R && p.vy > 0) {
            if (Math.random() < pr.pd) { p.ph = 'd'; p.y = FILL + R + 0.1; p.vy = VD; p.vx = rand(-VD, VD); p.turn = 0.4; inR.add(time); flashes.push({ x: p.x, y: FILL, t: 0 }); }
            else { p.y = FILL - R; p.vy = -Math.abs(p.vy); }
          }
        } else {
          p.turn -= dt;
          if (p.turn <= 0) { var a = rand(0, Math.PI * 2), v = VD * rand(0.6, 1.3); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.turn = rand(0.3, 0.7); }
          if (p.y > FLOOR) { p.y = FLOOR; p.vy = -Math.abs(p.vy); }
          if (p.y < FILL + R && p.vy < 0) {
            if (Math.random() < pr.pe) { p.ph = 'g'; p.y = FILL - R - 0.1; p.vy = -VG * rand(0.6, 1); p.vx = rand(-VG, VG) * 0.6; outR.add(time); flashes.push({ x: p.x, y: FILL, t: 0 }); }
            else { p.y = FILL + R; p.vy = Math.abs(p.vy); }
          }
          if (bubbleOut && p.y > FILL + 2 && Math.random() < bubbleOut * dt) { p.ph = 'bub'; p.br = 0.3; }
        }
      }
      // Fizz: lively in the opening shot and after the cap comes off, otherwise only while
      // CO₂ is leaving the drink faster than it returns
      var excess = Math.max(0, outR.rate(time) - inR.rate(time));
      var rate = zoomed() ? excess * 4 + (st.cap === 'off' ? 6 + 30 * Math.exp(-since / 2.5) : 0) : 26;
      if (!opts.reduced && Math.random() < rate * dt) bubbles.push(fizz(zoomed() ? FLOOR + 1 : 96));
      bubbles.forEach(function (b) { b.y -= dt * (zoomed() ? 4 : 11) * (0.7 + b.r); b.r += dt * 0.02; });
      bubbles = bubbles.filter(function (b) { return b.y > FILL + b.r; });
      flashes.forEach(function (f) { f.t += dt; }); flashes = flashes.filter(function (f) { return f.t < 0.5; });
    }

    function counts() {
      var g = 0, d = 0;
      parts.forEach(function (p) { if (p.ph === 'g') g++; else if (p.ph === 'd' || p.ph === 'bub') d++; });
      return { g: g, d: d };
    }

    // Camera: whole bottle → neck close-up. screen = anchor + (world − focus) × (sx, s).
    // The close-up is stretched sideways so the neck fills the room between the labels and the counter.
    function camera(w, h) {
      var s0 = (h - 24) / 104, s1 = (h - 52) / (VIEW[1] - VIEW[0]);
      var left = 100, right = w - PANEL_W - 18, cx = (left + right) / 2;
      var stretch = clamp((right - left) / 2 / 6.1 / s1, 1, 2.2);
      var e = smooth((intro - HOLD) / ZOOM), s = s0 * Math.pow(s1 / s0, e);
      var fy = 48.5 + (((VIEW[0] + VIEW[1]) / 2) - 48.5) * e;
      return {
        s: s, sx: s * (1 + (stretch - 1) * e), fx: 0, fy: fy,
        ax: w * 0.5 + (cx - w * 0.5) * e, ay: h / 2 + (46 + (h - 52) / 2 - h / 2) * e, e: e,
      };
    }

    function draw() {
      var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
      baseT = ctx.getTransform();
      var cold = st.temp === 'cold', cam = camera(w, h);
      asp = cam.sx / cam.s;
      var X = function (x) { return cam.ax + (x - cam.fx) * cam.sx; }, Y = function (y) { return cam.ay + (y - cam.fy) * cam.s; };
      var show = clamp((intro - HOLD - ZOOM) / FADE, 0, 1);

      var bg = ctx.createRadialGradient(w * 0.42, h * 0.55, 10, w * 0.42, h * 0.55, w * 0.7);
      bg.addColorStop(0, cold ? 'rgba(207,230,247,0.6)' : 'rgba(253,222,186,0.7)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // World: shadow, bottle, fizz, cap
      ctx.save();
      ctx.translate(cam.ax, cam.ay); ctx.scale(cam.sx, cam.s); ctx.translate(-cam.fx, -cam.fy);
      var sh = ctx.createRadialGradient(0, 100, 0.5, 0, 100, 18);
      sh.addColorStop(0, 'rgba(29,36,51,0.22)'); sh.addColorStop(1, 'rgba(29,36,51,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, 100, 18, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      drawGlass(ctx, cold, kit());
      ctx.save(); glassPath(ctx, true); ctx.clip();
      bubbles.forEach(function (b) {
        var bx = b.x * (bore(b.y) - b.r) + Math.sin(time * 3 + b.w) * 0.15;
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.ellipse(bx, b.y, b.r / asp, b.r, 0, 0, Math.PI * 2); ctx.fill(); line(ctx, 1);
      });
      // Molecules (screen units, still clipped to the bore)
      ctx.setTransform(baseT);
      if (show > 0) {
        var r = R * cam.s;
        parts.forEach(function (p) {
          if (p.ph === 'out') return;
          if (p.ph === 'bub') {
            var br = r * (1.6 + 1.4 * p.br);
            ctx.fillStyle = 'rgba(255,255,255,' + (0.4 * show).toFixed(3) + ')'; ctx.strokeStyle = 'rgba(255,255,255,' + show.toFixed(3) + ')'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          co2(ctx, X(p.x), Y(p.y), r, p.rot, show, p.ph === 'd' ? 'aq' : 'gas');
        });
        flashes.forEach(function (fl) { ring(ctx, X(fl.x), Y(fl.y), fl.t / 0.5, r * (fl.pop ? 2.4 : 1.6)); });
      }
      ctx.restore(); ctx.restore();
      ctx.save();
      ctx.translate(cam.ax, cam.ay); ctx.scale(cam.sx, cam.s); ctx.translate(-cam.fx, -cam.fy);
      drawFront(ctx, cold, kit()); cap(ctx, kit());
      ctx.restore();
      if (show > 0) {
        var rr = R * cam.s;
        parts.forEach(function (p) { if (p.ph === 'out') co2(ctx, X(p.x), Y(p.y), rr, p.rot, clamp(p.life / 1.6, 0, 1) * show, 'gas'); });
      }
      // "psst" when just opened
      var since = time - opened;
      if (since < 1.2 && zoomed()) {
        ctx.strokeStyle = 'rgba(29,36,51,' + (0.5 * (1 - since / 1.2)).toFixed(3) + ')'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        for (var m = -2; m <= 2; m++) {
          ctx.beginPath(); ctx.moveTo(X(m * 1.4), Y(-1 - since * 2)); ctx.lineTo(X(m * 2.4), Y(-2.6 - since * 3.5)); ctx.stroke();
        }
      }

      if (intro < HOLD + ZOOM) {
        ctx.globalAlpha = 1 - cam.e;
        label(ctx, 'A sealed bottle', cam.ax - 13 * cam.sx - 14, cam.ay + 20 * cam.s, { size: 11, align: 'right' });
        label(ctx, 'of soda', cam.ax - 13 * cam.sx - 14, cam.ay + 20 * cam.s + 15, { size: 11, align: 'right' });
        ctx.globalAlpha = 1;
      }
      if (show <= 0) return;
      ctx.save(); ctx.globalAlpha = show;
      liveEquation(ctx, w, 24, ['CO₂(g)', { f: inR.rate(time), r: outR.rate(time) }, 'CO₂(aq)'], 16, 3);

      // Where the gas and the drink are, beside the neck
      var nl = X(-hw(FILL)) - 10;
      label(ctx, 'gas', nl, Y((TOP + FILL) / 2), { size: 10, align: 'right' });
      label(ctx, 'soda', nl, Y(FILL + 5), { size: 10, align: 'right' });

      // Thumbnail: the whole bottle, with the zoomed part boxed
      var ts = (h * 0.32) / 104, tx = 34, ty = h - 10 - 100 * ts;
      var zoomAsp = asp; asp = 1;
      ctx.save(); ctx.translate(tx, ty); ctx.scale(ts, ts);
      drawGlass(ctx, cold, kit()); drawFront(ctx, cold, kit()); if (capK < 0.5) cap(ctx, kit());
      ctx.restore();
      asp = zoomAsp;
      ctx.strokeStyle = TIDE; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
      ctx.strokeRect(tx - 8 * ts, ty + VIEW[0] * ts, 16 * ts, (VIEW[1] - VIEW[0]) * ts);
      ctx.setLineDash([]);
      label(ctx, 'zoomed in', tx, ty + VIEW[0] * ts - 9, { size: 9, color: TIDE });

      // Counter and thermometer
      sodaPanel(ctx, w - PANEL_W - 10, 48, PANEL_W, counts(), cold);
      ctx.restore();
    }

    function sodaPanel(ctx, x, y, w, c, cold) {
      var h = countPanel(ctx, x, y, w, 'CO₂ molecules', [['gas', c.g, '#8a93a6', N0], ['dissolved', c.d, '#4f97c4', N0]], 132);
      // Thermometer, lying flat
      var ty = y + h - 22, tx0 = x + 22, tx1 = x + w - 52, k = cold ? 0.22 : 0.8, col = cold ? '#2f6fa8' : EMBER;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      roundBox(ctx, tx0, ty - 3.5, tx1 - tx0, 7, 3.5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx0, ty, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx0, ty, 4.5, 0, Math.PI * 2); ctx.fill();
      roundBox(ctx, tx0, ty - 1.8, (tx1 - tx0 - 3) * k, 3.6, 1.8); ctx.fill();
      label(ctx, cold ? 'cold' : 'warm', x + w - 12, ty, { size: 11, color: col, align: 'right' });
    }

    function describe() {
      if (!zoomed()) return 'A sealed bottle of soda, fizzing. Zooming in on the neck, where the gas meets the drink.';
      var c = counts(), fr = inR.rate(time), rr = outR.rate(time), diff = Math.abs(fr - rr), eq = diff < 0.35 + 0.2 * Math.max(fr, rr);
      var cond = (st.cap === 'on' ? 'Sealed' : 'Open') + ' and ' + st.temp + '.';
      if (st.cap === 'off') return cond + (c.d > 2
        ? ' Gas escapes out of the open mouth, so CO₂ leaves the drink faster than it returns. Bubbles carry it up. The soda is going flat.'
        : ' Almost all the CO₂ has escaped. The soda is flat.');
      if (eq) return cond + ' CO₂ dissolves and escapes at the same rate, so the amounts stay steady even though molecules keep crossing.' +
        (since() < 40 && opened > 0 ? ' Some CO₂ escaped while it was open, so there is less of it now.' : '');
      return cond + (fr > rr ? ' More CO₂ is dissolving than escaping, so the drink is taking up gas.' : ' More CO₂ is escaping than dissolving, so gas is building up above the drink.');
    }
    function since() { return time - opened; }

    reset();
    return {
      controls: [
        { type: 'seg', key: 'cap', label: 'Cap', options: [['on', 'On'], ['off', 'Off']] },
        { type: 'seg', key: 'temp', label: 'Temperature', options: [['cold', 'Cold'], ['warm', 'Warm']] },
        { type: 'btn', key: 'reset', label: 'New bottle' },
      ],
      get: function (k) { return st[k]; },
      set: function (k, v) { skipIntro(); if (k === 'cap' && v === 'off' && st.cap === 'on') opened = time; st[k] = v; },
      action: function (k) { if (k === 'reset') { var t = st.temp; reset(); st.temp = t; } },
      stats: function () { var c = counts(); return { gas: c.g, dissolved: c.d, in: inR.rate(time), out: outR.rate(time), zoomed: zoomed() }; },
      update: update, draw: draw, describe: describe,
    };
  }

  /* =====================================================================
     OCEAN: CO₂(g) ⇌ CO₂(aq) at the surface, then CO₂(aq) + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻ in the sea
     A block of coast seen from above at an angle (ice-cube style): the sea fills the front, cut away
     to show the water, and the land runs along the back. Cars and a factory add CO₂ to the air; each
     "Increase carbon output" adds a car, a burst from the stack, and a higher steady output.
     Some CO₂ drifts off into the wider atmosphere, so the air settles at a level set by the output.
     Every change fires from a rate (event budgets), so the molecules can drift slowly without
     slowing the chemistry: gas nearest the water dips in to dissolve, dissolved CO₂ nearest the
     surface rises out, the highest gas drifts away, and H⁺ + HCO₃⁻ glide together to join.
     Block coordinates: x 0–1 along the front, y 0 (front) – D (back), z up from sea level; the
     shore runs along x at y = SH.
     Species: G CO₂(g) · C CO₂(aq) · A H₂CO₃ · H H⁺ · B HCO₃⁻ · W water (scenery: it is always in excess).
     ===================================================================== */
  function ocean(canvas, opts) {
    var D = 0.8, T = 0.28, FLOOR = -0.23, SH = 0.42, LANDZ = 0.025, ZA = 0.3, ROAD = 0.52;
    var VA = 0.1, VW = 0.05, MAXN = 4, PANEL_W = 152;
    var K = { k1: 0.25, k1r: 1.2, k2: 1.6, k2r: 0.04, kd: 0.3, ke: 0.3, kt: 0.08 };
    var parts, smoke, cars, time, bud, meters, H0, n, burst;
    var P, S;                                       // projection, set each frame

    function src() { return 0.5 + 0.5 * n; }
    function shoreAt(z) { return SH - 0.08 * clamp(z / FLOOR, 0, 1); }   // the beach runs out under the water
    function mk(sp, x, y, z) {
      var a = rand(0, Math.PI * 2), b = rand(-0.6, 0.6), v = sp === 'G' ? VA : VW;
      return { sp: sp, x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: b * v, rot: rand(0, 6.3), vr: rand(-0.7, 0.7), turn: rand(0, 0.6), busy: false, born: 0 };
    }
    function seaP(sp) { var z = rand(FLOOR + 0.04, -0.04); return mk(sp, rand(0.03, 0.97), rand(0.03, shoreAt(z) - 0.04), z); }
    function airP() { return mk('G', rand(0.03, 0.97), rand(0.03, D - 0.03), rand(0.1, ZA)); }
    function reset() {
      parts = []; smoke = []; time = 0; n = 0; burst = 0;
      bud = { r1: 0, r1r: 0, r2: 0, r2r: 0, src: 0, esc: 0, dis: 0, top: 0 };
      meters = { in: rateMeter(), out: rateMeter(), r1: rateMeter(), r1r: rateMeter(), r2: rateMeter(), r2r: rateMeter() };
      // Start settled for the starting output
      [['G', 7], ['C', 6], ['A', 1], ['H', 6], ['B', 6], ['W', 10]].forEach(function (q) {
        for (var i = 0; i < q[1]; i++) parts.push(q[0] === 'G' ? airP() : seaP(q[0]));
      });
      cars = [{ x: 0.3, dir: 1, hue: 0 }];
      H0 = 6;
    }
    function count(sp) { var c = 0; parts.forEach(function (p) { if (p.sp === sp && !p.busy) c++; }); return c; }
    function pick(sp) { var c = parts.filter(function (p) { return p.sp === sp && !p.busy && p.out == null; }); return c.length ? c[Math.floor(Math.random() * c.length)] : null; }
    // The free molecule of a species with the largest score
    function best(sp, score) { var b = null, bs = -1e9; parts.forEach(function (o) { if (o.sp === sp && !o.busy && o.out == null) { var s = score(o); if (s > bs) { bs = s; b = o; } } }); return b; }

    var STACK = [0.7, 0.67, 0.24];                    // top of the factory stack
    function fromStack() {
      var p = mk('G', STACK[0], STACK[1], STACK[2] + 0.02); p.vz = VA * 0.8; p.born = 0.3; parts.push(p);
      smoke.push({ x: STACK[0], y: STACK[1], z: STACK[2] + 0.02, t: 0, s: rand(0.014, 0.022) });
    }
    function emit() {
      if (Math.random() < 0.45 && cars.length) {      // a car's exhaust
        var c = cars[Math.floor(Math.random() * cars.length)], tx = c.x - c.dir * 0.06;
        if (tx < 0.02 || tx > 0.98) return fromStack();
        var p = mk('G', tx, lane(c), LANDZ + 0.03); p.vz = VA * 0.6; p.born = 0.3; parts.push(p);
        smoke.push({ x: p.x, y: p.y, z: p.z, t: 0, s: 0.008 });
      } else fromStack();
    }

    function lane(c) { return ROAD + (c.dir > 0 ? -0.022 : 0.022); }

    function fire(name) {
      var p;
      if (name === 'src') return emit();
      if (name === 'esc') { p = best('C', function (o) { return o.z; }); if (p) p.busy = p.rise = true; return; }
      if (name === 'dis') { p = best('G', function (o) { return o.y < SH - 0.02 ? -o.z : -9; }); if (p && p.y < SH - 0.02) p.busy = p.sink = true; return; }
      if (name === 'top') { p = best('G', function (o) { return o.z; }); if (p) { p.busy = true; p.out = 0; } return; }
      if (name === 'r1') { p = pick('C'); if (!p) return; p.sp = 'A'; }
      if (name === 'r1r') { p = pick('A'); if (!p) return; p.sp = 'C'; }
      if (name === 'r2') {
        p = pick('A'); if (!p) return; p.sp = 'B';
        var h = mk('H', p.x + 0.02, p.y, Math.max(FLOOR + 0.04, p.z - 0.03)); h.born = 0.3; parts.push(h);
      }
      if (name === 'r2r') {
        p = pick('B'); if (!p) return;
        var near = best('H', function (o) { return -Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z); });
        if (!near) return;
        p.busy = near.busy = true; p.glide = { to: near, t: 0 };
      }
      meters[name].add(time);
    }

    function update(dt) {
      time += dt;
      var sp = opts.reduced ? 0.35 : 1;
      var A = count('A'), C = count('C'), B = count('B'), H = count('H'), G = count('G');
      var rates = { r1: K.k1 * C, r1r: K.k1r * A, r2: K.k2 * A, r2r: K.k2r * H * B, src: src(), esc: K.ke * C, dis: K.kd * G, top: K.kt * G };
      Object.keys(rates).forEach(function (k) {
        bud[k] += rates[k] * dt;
        while (bud[k] >= 1) { bud[k] -= 1; fire(k); }
      });
      // A burst from the stack just after each increase
      if (burst > 0) { burst -= dt; if (Math.random() < dt * 6) fromStack(); }
      // Cars drive both ways along the coast road, wrapping at the edges of the block
      cars.forEach(function (c) { c.x += c.dir * dt * 0.05 * sp; if (c.x > 1.07) c.x = -0.07; if (c.x < -0.07) c.x = 1.07; });

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.rot += p.vr * dt * sp; if (p.born > 0) p.born = Math.max(0, p.born - dt);
        if (p.out != null) { p.out += dt; p.z += dt * 0.08; if (p.out > 1.6) parts.splice(i, 1); continue; }
        if (p.glide) {                                // H⁺ + HCO₃⁻ → H₂CO₃
          var o = p.glide.to; p.glide.t += dt;
          var k = Math.min(1, dt / Math.max(0.01, 0.45 - p.glide.t + dt));
          o.x += (p.x - o.x) * k; o.y += (p.y - o.y) * k; o.z += (p.z - o.z) * k;
          if (p.glide.t >= 0.45) { var oi = parts.indexOf(o); parts.splice(oi, 1); if (oi < i) i--; p.sp = 'A'; p.busy = false; p.glide = null; }
          continue;
        }
        if (p.sink) {                                 // gas dipping into the sea
          p.z -= dt * 0.25 * sp;
          if (p.z < -0.04) { p.sp = 'C'; p.busy = p.sink = false; p.vz = -VW; meters.in.add(time); }
          continue;
        }
        if (p.rise) {                                 // dissolved CO₂ leaving the sea
          p.z += dt * 0.25 * sp;
          if (p.z > 0.06) { p.sp = 'G'; p.busy = p.rise = false; p.vz = VA * 0.7; meters.out.add(time); }
          continue;
        }
        if (p.busy) continue;
        var lo, hi, ymax;
        if (p.sp === 'G') { lo = (p.y < SH ? 0 : LANDZ) + 0.06; hi = ZA; ymax = D - 0.03; }
        else {
          p.turn -= dt;
          var fast = p.sp === 'H' ? 1.5 : p.sp === 'W' ? 0.7 : 1;
          if (p.turn <= 0) { var a = rand(0, Math.PI * 2), v = VW * fast * rand(0.6, 1.3); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.vz = rand(-1, 1) * v; p.turn = rand(0.4, 0.9); }
          lo = FLOOR + 0.04; hi = -0.04; ymax = shoreAt(p.z) - 0.04;
        }
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp; p.z += p.vz * dt * sp;
        if (p.x < 0.03) { p.x = 0.03; p.vx = Math.abs(p.vx); }
        if (p.x > 0.97) { p.x = 0.97; p.vx = -Math.abs(p.vx); }
        if (p.y < 0.03) { p.y = 0.03; p.vy = Math.abs(p.vy); }
        if (p.y > ymax) { p.y = ymax; p.vy = -Math.abs(p.vy); }
        if (p.z < lo) { p.z = lo; p.vz = Math.abs(p.vz); }
        if (p.z > hi) { p.z = hi; p.vz = -Math.abs(p.vz); }
      }
      smoke.forEach(function (m) { m.t += dt; m.z += dt * 0.05; m.x += dt * 0.015; m.s += dt * 0.01; }); smoke = smoke.filter(function (m) { return m.t < 2.2; });
    }

    /* ---------- drawing: flat faces with a thin darker rim and white highlights, like the ice cube ---------- */
    function poly(ctx, pts, fill, rim, lw) {
      ctx.beginPath(); pts.forEach(function (q, i) { var s = P(q[0], q[1], q[2]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath();
      ctx.lineJoin = 'round'; ctx.fillStyle = fill; ctx.fill();
      if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = lw || 1.3; ctx.stroke(); }
    }
    function shine(ctx, a, b, lw) {
      var s0 = P(a[0], a[1], a[2]), s1 = P(b[0], b[1], b[2]);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = lw || 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    }
    // A box with its three visible faces: top, front (y0) and right (x1)
    function box(ctx, x0, x1, y0, y1, z0, z1, top, front, side, rim) {
      poly(ctx, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], side, rim);
      poly(ctx, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], front, rim);
      poly(ctx, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top, rim);
    }

    function mountain(ctx, mx, my, r, ht) {
      var pk = [mx, my, ht];
      var L = [Math.max(0, mx - r), my, LANDZ], F = [mx, my - r * 0.6, LANDZ], R = [Math.min(1, mx + r), my, LANDZ];
      poly(ctx, [L, F, pk], '#e3e8f2', '#8e9bb3');
      poly(ctx, [F, R, pk], '#c9d2e2', '#8e9bb3');
      var cap = function (a) { return [pk[0] + (a[0] - pk[0]) * 0.32, pk[1] + (a[1] - pk[1]) * 0.32, pk[2] + (a[2] - pk[2]) * 0.32]; };
      poly(ctx, [cap(L), cap(F), pk], '#ffffff', '#8e9bb3', 1.1);
      poly(ctx, [cap(F), cap(R), pk], '#eef3fa', '#8e9bb3', 1.1);
      shine(ctx, [mx - r * 0.45, my - r * 0.12, ht * 0.45], [mx - r * 0.2, my - r * 0.05, ht * 0.8], 1.6);
    }
    function factory(ctx) {
      box(ctx, 0.58, 0.8, 0.6, 0.74, LANDZ, 0.11, '#eef1f6', '#e0e6ef', '#c9d2df', '#7f8ea6');
      for (var j = 0; j < 4; j++) {                   // windows on the front
        var wx = 0.6 + j * 0.052;
        poly(ctx, [[wx, 0.6, 0.05], [wx + 0.032, 0.6, 0.05], [wx + 0.032, 0.6, 0.085], [wx, 0.6, 0.085]], '#bcdcf3', '#7fa9cc', 1);
      }
      box(ctx, STACK[0] - 0.016, STACK[0] + 0.016, STACK[1] - 0.016, STACK[1] + 0.016, 0.11, STACK[2], '#b9c3d2', '#d7dde7', '#bfc8d6', '#7f8ea6');
      shine(ctx, [0.59, 0.6, 0.04], [0.59, 0.6, 0.1], 1.5);
    }
    function car(ctx, c) {
      var body = ['#f6c9b8', '#cfe3c4', '#f5e0a8', '#cfd8f5'][c.hue % 4], rim = ['#cf8a72', '#88b277', '#c9a85a', '#8796c9'][c.hue % 4];
      var y0 = lane(c) - 0.018, x0 = Math.max(0, c.x - 0.045), x1 = Math.min(1, c.x + 0.045);
      if (x1 <= x0) return;
      box(ctx, x0, x1, y0, y0 + 0.036, LANDZ, LANDZ + 0.026, body, body, mix(body, '#7f8ea6', 0.25), rim);
      var cx0 = Math.max(0, c.x - 0.022 - c.dir * 0.006), cx1 = Math.min(1, c.x + 0.018 - c.dir * 0.006);
      if (cx1 > cx0) box(ctx, cx0, cx1, y0 + 0.004, y0 + 0.032, LANDZ + 0.026, LANDZ + 0.046, '#d7ebf8', '#d7ebf8', '#b8d4ea', rim);
    }
    function water(ctx, x, y, r, rot, al) {
      ctx.save(); ctx.globalAlpha = 0.45 * al;
      [-0.92, 0.92].forEach(function (s) { ball(ctx, x + Math.cos(rot + s) * r * 0.85, y + Math.sin(rot + s) * r * 0.85, r * 0.45, H_A[0], H_A[1]); });
      ball(ctx, x, y, r * 0.72, O_A[0], O_A[1]);
      ctx.restore();
    }
    function molecule(ctx, p, r) {
      var s = P(p.x, p.y, p.z), g = p.born > 0 ? 1 - p.born / 0.3 * 0.5 : 1, rr = r * g;
      var al = p.out != null ? clamp(1 - p.out / 1.6, 0, 1) : 1;
      if (p.z < 0) al *= 1 - 0.35 * p.y / SH;                           // farther back in the water, fainter
      if (p.sp === 'W') return water(ctx, s[0], s[1], rr, p.rot, al);
      if (p.sp === 'G' || p.sp === 'C') return co2(ctx, s[0], s[1], rr, p.rot, al, p.z >= 0 ? 'gas' : 'aq');
      carbonSp(ctx, p.sp, s[0], s[1], rr * (p.sp === 'H' ? 1.3 : 0.85), p.rot, al);
    }

    function draw() {
      var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
      var top = 58;
      // As big as fits, centred; the counter sits in the empty corner at the top left
      S = Math.min((h - top - 10) / (0.42 * D + 0.08 + T + ZA), (w - 20) / (0.94 + 0.5 * D));
      var ox = (w - (0.94 + 0.5 * D) * S) / 2, oy = top + 6 + (ZA + 0.42 * D) * S;
      P = function (x, y, z) { return [ox + (0.94 * x + 0.5 * y) * S, oy + (0.08 * x - 0.42 * y) * S - z * S]; };
      var r = Math.max(2.6, S * 0.014);
      var G = count('G');

      // Faint haze in the air as CO₂ builds up
      var haze = clamp((G - 7) / 60, 0, 0.14);
      if (haze > 0) { ctx.fillStyle = 'rgba(150,140,128,' + haze.toFixed(3) + ')'; ctx.fillRect(0, top, w, h - top); }

      // Soil: the right face (land behind, seabed under the sea) and a band under the front of the sea
      poly(ctx, [[1, SH, LANDZ], [1, D, LANDZ], [1, D, -T], [1, 0, -T], [1, 0, FLOOR], [1, SH - 0.08, FLOOR], [1, SH, 0]], '#e3d3ae', '#b89f70');
      poly(ctx, [[0, 0, FLOOR], [1, 0, FLOOR], [1, 0, -T], [0, 0, -T]], '#efe3c6', '#c4ad80');
      [-0.1, -0.18].forEach(function (lz) {                            // soil layers
        var a = P(1, shoreAt(lz) + 0.03, lz), b = P(1, D, lz);
        ctx.strokeStyle = 'rgba(160,135,90,0.4)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      });
      poly(ctx, [[0, 0, FLOOR], [1, 0, FLOOR], [1, 0, FLOOR - 0.02], [0, 0, FLOOR - 0.02]], '#d9c49a');
      // Land top, and the low step up from the water
      poly(ctx, [[0, SH, LANDZ], [1, SH, LANDZ], [1, D, LANDZ], [0, D, LANDZ]], '#d6eacb', '#86ad79');
      poly(ctx, [[0, SH, 0], [1, SH, 0], [1, SH, LANDZ], [0, SH, LANDZ]], '#c2ddb3', '#86ad79', 1);
      // Coast road with a dashed centre line
      poly(ctx, [[0, ROAD - 0.045, LANDZ], [1, ROAD - 0.045, LANDZ], [1, ROAD + 0.045, LANDZ], [0, ROAD + 0.045, LANDZ]], '#dfe3ea', '#aab3c2', 1);
      ctx.setLineDash([4, 5]); var r0 = P(0, ROAD, LANDZ), r1 = P(1, ROAD, LANDZ);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke(); ctx.setLineDash([]);

      // Scenery, far to near: mountains and factory behind the road, cars on it
      mountain(ctx, 0.2, 0.7, 0.18, 0.26);
      mountain(ctx, 0.38, 0.74, 0.12, 0.16);
      factory(ctx);
      cars.slice().sort(function (a, b) { return a.dir - b.dir; }).forEach(function (c) { car(ctx, c); });

      // Sea: molecules inside, then see-through water over them (top surface and front face)
      var far = function (a, b) { return (b.y - 0.6 * b.x) - (a.y - 0.6 * a.x); };
      parts.filter(function (p) { return p.z < 0; }).sort(far).forEach(function (p) { molecule(ctx, p, r); });
      poly(ctx, [[1, 0, 0], [1, SH, 0], [1, SH - 0.08, FLOOR], [1, 0, FLOOR]], 'rgba(110,170,220,0.3)', '#5f9fcf', 1.4);
      poly(ctx, [[0, 0, 0], [1, 0, 0], [1, SH, 0], [0, SH, 0]], 'rgba(150,200,236,0.32)', '#5f9fcf', 1.4);
      poly(ctx, [[0, 0, 0], [1, 0, 0], [1, 0, FLOOR], [0, 0, FLOOR]], 'rgba(120,180,226,0.22)', '#5f9fcf', 1.4);
      shine(ctx, [0.08, 0.04, 0], [0.26, 0.04, 0], 2);
      shine(ctx, [0.55, SH * 0.6, 0], [0.7, SH * 0.6, 0], 2);
      shine(ctx, [0.02, 0, -0.04], [0.02, 0, -0.17], 1.8);

      // Smoke, then the air (and anything crossing the surface), back to front
      smoke.forEach(function (m) {
        var s = P(m.x, m.y, m.z), a = 0.32 * (1 - m.t / 2.2);
        ctx.fillStyle = 'rgba(130,136,148,' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(s[0], s[1], m.s * S, 0, Math.PI * 2); ctx.fill();
      });
      parts.filter(function (p) { return p.z >= 0; }).sort(far).forEach(function (p) { molecule(ctx, p, r); });

      // Equations: one at the surface, one in the sea
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(0, 0, w, top);
      ctx.strokeStyle = 'rgba(29,36,51,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(w, top); ctx.stroke();
      var tag = 92;
      label(ctx, 'at the surface', 10, 17, { size: 9, align: 'left' });
      label(ctx, 'in the ocean', 10, 41, { size: 9, align: 'left' });
      ctx.save(); ctx.translate(tag, 0);
      liveEquation(ctx, w - tag, 17, ['CO₂(g)', { f: meters.in.rate(time), r: meters.out.rate(time) }, 'CO₂(aq)'], 14, 2.5);
      liveEquation(ctx, w - tag, 41, ['CO₂(aq) + H₂O', { f: meters.r1.rate(time), r: meters.r1r.rate(time) }, 'H₂CO₃',
        { f: meters.r2.rate(time), r: meters.r2r.rate(time) }, 'H⁺ + HCO₃⁻'], 14, 2.5);
      ctx.restore();

      countPanel(ctx, 10, top + 8, PANEL_W, 'Molecules', [
        ['CO₂ in the air', G, '#8a93a6', 40],
        ['H⁺ in the ocean', count('H') + parts.filter(function (p) { return p.sp === 'H' && p.busy; }).length, '#e8264f', 20, H0],
      ]);
    }

    function describe() {
      var Hn = count('H'), fr = meters.in.rate(time), rr = meters.out.rate(time), acid = Hn > H0 + 2, up = fr > rr + 0.4;
      var cond = n === 0 ? 'Carbon output as at the start.' : n >= MAXN ? 'Carbon output at its highest.' : 'Carbon output raised ' + (n === 1 ? 'once.' : n + ' times.');
      if (up) return cond + ' More CO₂ in the air pushes more CO₂ into the ocean. It forms H₂CO₃, which splits into H⁺ and HCO₃⁻.' + (acid ? ' The ocean is more acidic than at the start.' : '');
      if (acid) return cond + ' Both equilibria have settled with more CO₂ dissolved and more H⁺ in the water. The ocean is more acidic than at the start.';
      return cond + ' CO₂ dissolves and escapes at the same rate, and the reactions in the water run both ways at the same rate. The acidity holds steady.';
    }

    reset();
    return {
      controls: [
        { type: 'btn', key: 'more', label: 'Increase carbon output' },
        { type: 'btn', key: 'reset', label: 'Start over' },
      ],
      get: function () { return null; },
      set: function () {},
      action: function (k) {
        if (k === 'more') {
          burst = 1.5; for (var i = 0; i < 4; i++) fromStack();
          if (n < MAXN) { n++; var d = cars.length % 2 ? -1 : 1; cars.push({ x: d > 0 ? -0.07 : 1.07, dir: d, hue: cars.length }); }
        }
        if (k === 'reset') reset();
      },
      stats: function () { return { n: n, G: count('G'), C: count('C'), A: count('A'), H: count('H'), B: count('B') }; },
      update: update, draw: draw, describe: describe,
    };
  }

  /* =====================================================================
     BLOOD: the four carbonic acid equilibria, breathing
     No particles. Each species is written at a size that follows its amount, greatly
     exaggerated, and keeps that size in every equation it appears in.
     Regular breathing: one slow breath. Breathing in brings fresh air with almost no CO₂, so CO₂(g) drops
     and the chain shifts left; breathing out, CO₂ builds up in the lungs and the chain shifts
     right. CO₃²⁻ moves against H⁺. Each step down the chain trails the one before it.
     Panic attack: fast, shallow breaths blow off CO₂; everything shifts left and H⁺ falls.
     Exercise: muscles add H⁺ and CO₂; the extra H⁺ drives the chain left, using up HCO₃⁻ and CO₃²⁻.
     Each ⇌ has two half-arrows; the longer one shows which way that equilibrium is shifting.
     ===================================================================== */
  function blood(canvas, opts) {
    var LAG = 0.35, TAU = 2.5, IN = 0.45;               // delay per step down the chain (s); settling time (s); share of a breath spent breathing in
    // swing: how far the size moves with the CO₂ load over a breath (− moves against it); lag: steps down the chain
    var SP = {
      g: { t: 'CO₂(g)', swing: 0.45, lag: 0 }, aq: { t: 'CO₂(aq)', swing: 0.45, lag: 1 }, w: { t: 'H₂O', swing: 0, lag: 0 },
      a: { t: 'H₂CO₃', swing: 0.45, lag: 2 }, b: { t: 'HCO₃⁻', swing: 0.2, lag: 3 }, h: { t: 'H⁺', swing: 0.5, lag: 3 },
      c: { t: 'CO₃²⁻', swing: -0.4, lag: 4 }
    };
    var EQS = [[['g'], ['aq']], [['aq', 'w'], ['a']], [['a'], ['b', 'h']], [['b'], ['c', 'h']]];
    // Each state: breath length (s), breath depth, steady size offsets, and which way each equilibrium shifts on the way in
    var MODES = {
      rest: { cyc: 10, depth: 1, off: {}, dir: [0, 0, 0, 0],
        sub: ['fresh air, almost no CO₂', 'air leaves; CO₂ builds up in the lungs'] },
      panic: { cyc: 2.4, depth: 0.5, off: { g: -0.5, aq: -0.5, a: -0.5, h: -0.55, b: -0.15, c: 0.6 }, dir: [-1, -1, -1, 1],
        sub: ['fast, shallow breaths', 'blowing off CO₂'] },
      exercise: { cyc: 4, depth: 1.2, off: { g: 0.35, aq: 0.35, a: 0.45, h: 0.7, b: -0.35, c: -0.45 }, dir: [-1, -1, -1, -1],
        sub: ['breathing hard', 'muscles add CO₂ and H⁺'] }
    };
    var st = { mode: 'rest', run: 'on' }, ph, cur, dir;

    function reset() { ph = 0; cur = {}; dir = [0, 0, 0, 0]; Object.keys(SP).forEach(function (id) { cur[id] = 0; }); }
    // Lung volume over a breath (p in breaths): fills while breathing in, empties while breathing out
    function lungVol(p) { var u = ((p % 1) + 1) % 1; return u < IN ? smooth(u / IN) : 1 - smooth((u - IN) / (1 - IN)); }
    function load(p) { return 1 - lungVol(p); }        // CO₂ load over a breath: lowest just after fresh air comes in
    function lagP(id) { return ph - SP[id].lag * LAG / MODES[st.mode].cyc; }
    function size(id) { var m = MODES[st.mode]; return Math.max(0.42, 1 + cur[id] + m.depth * SP[id].swing * (2 * load(lagP(id)) - 1)); }
    function breathShift(eq) {                          // + shifting right, − shifting left, per second
      var id = eq[1][0], p = lagP(id), m = MODES[st.mode];
      return (SP[id].swing < 0 ? -1 : 1) * m.depth * (load(p + 0.005) - load(p - 0.005)) / 0.01 / m.cyc;
    }
    function unsettled() {
      var m = MODES[st.mode], d = 0;
      Object.keys(SP).forEach(function (id) { d = Math.max(d, Math.abs((m.off[id] || 0) - cur[id])); });
      return d;
    }

    function update(dt) {
      if (st.run !== 'on') return;
      dt *= opts.reduced ? 0.35 : 1;
      var m = MODES[st.mode];
      ph += dt / m.cyc;
      Object.keys(SP).forEach(function (id) { cur[id] += ((m.off[id] || 0) - cur[id]) * Math.min(1, dt / TAU); });
    }

    function lungs(ctx, cx, cy, v) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(0.8 + 0.28 * v, 0.8 + 0.28 * v);
      [-1, 1].forEach(function (sd) {
        var g = ctx.createRadialGradient(sd * 11, -2, 2, sd * 13, 3, 20);
        g.addColorStop(0, '#fde6e9'); g.addColorStop(1, '#eba5ae');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sd * 13, 4, 10, 17, sd * -0.15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,80,95,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      });
      ctx.strokeStyle = '#c47883'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -6); ctx.lineTo(-8, 1); ctx.moveTo(0, -6); ctx.lineTo(8, 1); ctx.stroke();
      ctx.restore();
    }

    function draw() {
      var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, m = MODES[st.mode];
      var u = ((ph % 1) + 1) % 1, inhale = u < IN;

      // Header: lungs filling and emptying, which half of the breath this is, and how far through
      var top = 74;
      lungs(ctx, 42, 40, lungVol(ph) * Math.min(1, m.depth));
      var ay = inhale ? 10 + 8 * ((u * m.cyc / 0.8) % 1) : 18 - 8 * (((u - IN) * m.cyc / 0.8) % 1);
      ctx.globalAlpha = 0.7; U.arrow(ctx, 42, inhale ? ay - 8 : ay + 8, 42, ay, inhale ? TIDE : DIM, 1.8); ctx.globalAlpha = 1;
      label(ctx, inhale ? 'Breathe in' : 'Breathe out', 84, 28, { font: BODY, size: 18, color: INK, align: 'left' });
      label(ctx, m.sub[inhale ? 0 : 1], 84, 48, { size: 10, align: 'left' });
      var pw = Math.min(150, w - 260), pf = inhale ? u / IN : (u - IN) / (1 - IN);
      ctx.fillStyle = 'rgba(29,36,51,0.08)'; roundBox(ctx, 84, 58, pw, 6, 3); ctx.fill();
      ctx.fillStyle = inhale ? TIDE : DIM; roundBox(ctx, 84, 58, Math.max(6, pw * pf), 6, 3); ctx.fill();
      label(ctx, 'text size = amount', w - 12, 22, { size: 10, color: INK, align: 'right' });
      label(ctx, '(exaggerated)', w - 12, 36, { size: 10, align: 'right' });
      var acid = cur.h > 0.25 ? ['blood: more acidic', '#c81e45'] : cur.h < -0.25 ? ['blood: less acidic', TIDE] : ['blood: normal acidity', DIM];
      label(ctx, acid[0], w - 12, 56, { size: 11, color: acid[1], align: 'right' });
      ctx.strokeStyle = 'rgba(29,36,51,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(12, top - 4); ctx.lineTo(w - 12, top - 4); ctx.stroke();

      // Four equations: reactants right-aligned against a fixed arrow column, products left-aligned
      var rowH = (h - top - 6) / 4, base = Math.min(rowH * 0.34, w / 26), cx = w / 2, aw = 58, push = Math.min(1, unsettled() * 2.5);
      EQS.forEach(function (eq, i) {
        var y = top + rowH * (i + 0.5);
        if (i) { ctx.strokeStyle = 'rgba(29,36,51,0.06)'; ctx.beginPath(); ctx.moveTo(24, top + rowH * i); ctx.lineTo(w - 24, top + rowH * i); ctx.stroke(); }
        [0, 1].forEach(function (side) {
          var ids = side ? eq[1] : eq[0].slice().reverse(), x = side ? cx + aw / 2 + 10 : cx - aw / 2 - 10;
          ids.forEach(function (id, k) {
            if (k) { label(ctx, '+', x + (side ? 8 : -8), y, { font: BODY, size: base * 0.9, color: DIM }); x += side ? 16 : -16; }
            var sz = base * size(id);
            ctx.font = '700 ' + sz + 'px ' + BODY;
            var tw = ctx.measureText(SP[id].t).width;
            label(ctx, SP[id].t, x, y, { font: BODY, size: sz, color: id === 'h' ? '#c81e45' : INK, align: side ? 'left' : 'right' });
            x += side ? tw + 4 : -tw - 4;
          });
        });
        var d = clamp(breathShift(eq) * 2.2 * (1 - push) + dir[i] * push * 0.75, -0.75, 0.75), half0 = aw * 0.42;
        var lf = half0 * (1 + d), lr = half0 * (1 - d);
        half(ctx, cx - lf / 2, cx + lf / 2, y - 4, true);
        half(ctx, cx - lr / 2, cx + lr / 2, y + 4, false);
      });
    }

    function describe() {
      if (st.mode === 'panic') return 'Panic attack. Fast, shallow breathing blows CO₂ out of the lungs faster than the body makes it. CO₂(g) falls, so every equilibrium shifts left, back toward CO₂(g), using up H⁺. Only CO₃²⁻ grows. Blood CO₂ and H⁺ drop far below normal and the blood becomes less acidic, which brings on the dizziness and tingling of a panic attack. Slow breathing lets CO₂ build back up.';
      if (st.mode === 'exercise') return 'Exercise. Working muscles release extra CO₂ and acid (H⁺). The extra H⁺ drives the last two equilibria left: HCO₃⁻ and CO₃²⁻ are used up making H₂CO₃, which breaks down into more CO₂. CO₂ piles up in the blood and lungs, so you breathe hard to get rid of it. H⁺ stays high and the blood becomes more acidic.';
      if (((ph % 1) + 1) % 1 < IN) return 'Regular breathing, in. Fresh air has almost no CO₂, so CO₂(g) in the lungs drops and each equilibrium shifts left, back toward CO₂(g). H₂CO₃, H⁺ and HCO₃⁻ drop. With less H⁺, the last equilibrium shifts right, so CO₃²⁻ rises.';
      return 'Regular breathing, out. The air left in the lungs fills with CO₂ from the blood, so CO₂(g) rises and each equilibrium shifts right. H₂CO₃, H⁺ and HCO₃⁻ rise. The extra H⁺ pushes the last equilibrium back, so CO₃²⁻ drops.';
    }

    reset();
    return {
      controls: [
        { type: 'seg', key: 'mode', label: 'Situation', options: [['rest', 'Regular breathing'], ['panic', 'Panic attack'], ['exercise', 'Exercise']] },
        { type: 'seg', key: 'run', label: 'Animation', options: [['on', 'Play'], ['hold', 'Pause']] },
        { type: 'btn', key: 'reset', label: 'Start over' },
      ],
      get: function (k) { return st[k]; },
      set: function (k, v) {
        if (k === 'mode' && v !== st.mode) {
          // The breath carries on from where it is; the arrows lean the way this change pushes each equilibrium
          dir = v === 'rest' ? MODES[st.mode].dir.map(function (d) { return -d; }) : MODES[v].dir;
        }
        st[k] = v;
      },
      action: function (k) { if (k === 'reset') { reset(); st.mode = 'rest'; st.run = 'on'; } },
      stats: function () { var o = {}; Object.keys(SP).forEach(function (id) { o[id] = +size(id).toFixed(2); }); return o; },
      update: update, draw: draw, describe: describe,
    };
  }

  /* =====================================================================
     DIAMOND: C(diamond) → C(graphite). ΔG is negative, but the hill is enormous.
     A free energy diagram, not to scale (the real gap is tiny next to the hill). Carbon atoms on
     the diamond shelf keep getting random kicks, climbing part way up and sliding back. A clock
     runs in time-lapse to the age of Earth and nothing changes. Heat it (no air) and the kicks
     get big enough to cross: most atoms end up as graphite, a few cross back. ΔG never changed
     sign, only the rate. Kicks are energies, so crossing back from the lower graphite shelf is rarer.
     ===================================================================== */
  function diamond(canvas, opts) {
    var N = 8, SH = { d: 0.24, g: 0.17, pk: 0.94 }, FOOT = [0.36, 0.64];
    var MIN_PER_S = 4, AGE = 4.5e9;                      // heating time-lapse; the age of Earth (years)
    var st = { temp: 'room' }, atoms, clock, heatT;

    function energy(x) {
      if (x <= FOOT[0]) return SH.d;
      if (x >= FOOT[1]) return SH.g;
      if (x <= 0.5) return SH.d + (SH.pk - SH.d) * smooth((x - FOOT[0]) / (0.5 - FOOT[0]));
      return SH.pk + (SH.g - SH.pk) * smooth((x - 0.5) / (FOOT[1] - 0.5));
    }
    // x on the near slope where the curve reaches height e (side 0 diamond, 1 graphite)
    function reachX(side, e) {
      var lo = side ? 0.5 : FOOT[0], hi = side ? FOOT[1] : 0.5;
      for (var i = 0; i < 30; i++) {
        var mid = (lo + hi) / 2, above = energy(mid) > e;
        if (side ? above : !above) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    function slotX(side, i) { return side ? 0.96 - i * 0.04 : 0.04 + i * 0.04; }
    function freeSlot(side) {
      var used = {};
      atoms.forEach(function (a) { if (a.move && a.move.over) { if (a.move.side === side) used[a.move.slot] = 1; } else if (a.side === side) used[a.slot] = 1; });
      for (var i = 0; i < N; i++) if (!used[i]) return i;
      return null;
    }
    function count(side) { return atoms.filter(function (a) { return (a.move && a.move.over ? a.move.side : a.side) === side; }).length; }

    function reset() {
      clock = 0; heatT = 0; st.temp = 'room'; atoms = [];
      for (var i = 0; i < N; i++) atoms.push({ side: 0, slot: i, x: slotX(0, i), wait: rand(0.2, 2), move: null, ph: rand(0, 6.3) });
    }
    function kick(a) {
      var hot = st.temp === 'hot', u = Math.random();
      var K = (hot ? 0.35 + 0.8 * u * u : 0.06 + 0.3 * u * u) * (SH.pk - SH.d);   // energy of this kick
      var e = (a.side ? SH.g : SH.d) + K, to = e >= SH.pk ? freeSlot(1 - a.side) : null;
      if (to != null) a.move = { over: true, side: 1 - a.side, slot: to, from: a.x, to: slotX(1 - a.side, to), t: 0, dur: 1.8 };
      else a.move = { over: false, from: a.x, to: reachX(a.side, Math.min(e, SH.pk - 0.03)), t: 0, dur: 0.7 + 1.4 * Math.min(1, K / (SH.pk - SH.d)) };
    }
    function atomX(a) {
      var m = a.move; if (!m) return a.x;
      var p = Math.min(1, m.t / m.dur);
      if (!m.over) return m.from + (m.to - m.from) * Math.sin(Math.PI * p);
      return p < 0.45 ? m.from + (0.5 - m.from) * smooth(p / 0.45) : 0.5 + (m.to - 0.5) * smooth((p - 0.45) / 0.55);
    }

    function update(dt) {
      dt *= opts.reduced ? 0.35 : 1;
      if (st.temp === 'hot') heatT += dt; else clock += dt;
      atoms.forEach(function (a) {
        a.ph += dt;
        if (a.move) {
          a.move.t += dt;
          if (a.move.t >= a.move.dur) {
            if (a.move.over) { a.side = a.move.side; a.slot = a.move.slot; }
            a.x = slotX(a.side, a.slot); a.move = null;
            a.wait = st.temp === 'hot' ? rand(0.3, 1) : rand(0.5, 2);
          }
          return;
        }
        a.wait -= dt;
        if (a.wait <= 0) kick(a);
      });
    }

    // Time-lapse: 1 year after 6 s, then ×1000 every 6 s, stopping at the age of Earth
    function years() { return Math.min(AGE, Math.pow(10, clock / 2 - 3) - 0.001); }
    function fmtYears(y) {
      if (y < 1) { var d = Math.max(1, Math.round(y * 365)); return d + (d === 1 ? ' day' : ' days'); }
      if (y < 1e3) return Math.round(y) + (Math.round(y) === 1 ? ' year' : ' years');
      if (y < 1e6) return (y / 1e3).toFixed(y < 1e4 ? 1 : 0) + ' thousand years';
      if (y < 1e9) return (y / 1e6).toFixed(y < 1e7 ? 1 : 0) + ' million years';
      return (y / 1e9).toFixed(1) + ' billion years';
    }
    function fmtHeat() { var m = Math.round(heatT * MIN_PER_S); return m < 60 ? m + ' min' : (m / 60).toFixed(1) + ' h'; }

    function draw() {
      var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, hot = st.temp === 'hot';
      if (hot) {
        var hg = ctx.createLinearGradient(0, h, 0, h * 0.3);
        hg.addColorStop(0, 'rgba(240,140,60,0.22)'); hg.addColorStop(1, 'rgba(240,140,60,0)');
        ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);
      }
      label(ctx, 'C(diamond) → C(graphite)', w / 2, 20, { font: BODY, size: 16, color: INK });

      // Clock and counts
      label(ctx, hot ? 'heated to about 1,800 °C, no air' : 'time-lapse at room temperature', 14, 46, { size: 10, color: hot ? EMBER : DIM, align: 'left' });
      var y = years();
      label(ctx, hot ? fmtHeat() : fmtYears(y), 14, 66, { font: BODY, size: 17, color: INK, align: 'left' });
      if (!hot && y >= AGE) label(ctx, 'the age of Earth', 14, 84, { size: 10, color: DIM, align: 'left' });
      label(ctx, 'diamond ' + count(0) + '  ·  graphite ' + count(1), w - 14, 46, { size: 11, color: INK, align: 'right' });
      label(ctx, 'ΔG −  ·  spontaneous', w - 14, 66, { size: 11, color: TIDE, align: 'right' });

      // Free energy diagram
      var PL = 46, PR = w - 64, top = 100, bot = h - 44, pw = PR - PL;
      var X = function (x) { return PL + x * pw; }, Y = function (e) { return bot - e * (bot - top); };
      var r = Math.max(4.5, Math.min(6.5, pw / 60));
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PL - 14, top - 10); ctx.lineTo(PL - 14, bot + 8); ctx.lineTo(PR + 8, bot + 8); ctx.stroke();
      ctx.save(); ctx.translate(PL - 28, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
      label(ctx, 'free energy →', 0, 0, { size: 11 }); ctx.restore();
      label(ctx, 'reaction progress →', (PL + PR) / 2, h - 10, { size: 11 });
      label(ctx, 'diamond', X(0.18), bot + 22, { color: INK, size: 11 });
      label(ctx, 'graphite', X(0.82), bot + 22, { color: INK, size: 11 });
      label(ctx, 'not to scale', PR + 8, h - 10, { size: 9, align: 'right', weight: '400' });

      // ΔG between the shelves, Eₐ up the hill
      var yd = Y(SH.d), yg = Y(SH.g), yk = Y(SH.pk), ax = PR + 24;
      ctx.strokeStyle = FAINT_LINE; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(X(0.34), yd); ctx.lineTo(ax + 6, yd); ctx.stroke(); ctx.setLineDash([]);
      U.arrow(ctx, ax, yd, ax, yg, TIDE, 2.2);
      label(ctx, 'ΔG', ax + 8, yd - 12, { color: TIDE, size: 11, align: 'left' });
      ctx.strokeStyle = DIM; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(X(0.5), yd); ctx.lineTo(X(0.5), yk + 4); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, 'Eₐ: huge', X(0.5) + 7, (yd + yk) / 2, { size: 11, align: 'left', weight: '400' });

      ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 160; i++) { var xx = i / 160; if (i) ctx.lineTo(X(xx), Y(energy(xx))); else ctx.moveTo(X(xx), Y(energy(xx))); }
      ctx.stroke();

      // Carbon atoms: resting ones jiggle (harder when hot); climbing ones ride the curve
      atoms.forEach(function (a) {
        var x = atomX(a), j = a.move ? 0 : Math.sin(a.ph * (hot ? 19 : 9)) * (hot ? 2.2 : 0.9);
        var px = X(x) + j, py = Y(energy(x)) - r - 1.5;
        if (hot) {
          var gl = ctx.createRadialGradient(px, py, r * 0.3, px, py, r * 2.4);
          gl.addColorStop(0, 'rgba(240,140,60,0.45)'); gl.addColorStop(1, 'rgba(240,140,60,0)');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, r * 2.4, 0, Math.PI * 2); ctx.fill();
        }
        ball(ctx, px, py, r, C_A[0], C_A[1]);
      });
    }

    function describe() {
      if (st.temp === 'hot') return 'Heated to about 1,800 °C with no air, the atoms get kicks big enough to cross the hill, and they settle as graphite. A few cross back, but far fewer. ΔG has the same sign as before; only the rate changed. (In air, the diamond would burn to CO₂ first.)';
      if (count(1)) return 'Back at room temperature. The atoms that crossed stay as graphite and the rest stay as diamond: none of them can get back over the hill.';
      return 'Room temperature. ΔG is negative, so diamond turning into graphite is spontaneous. But the hill (Eₐ) is so high that every atom slides back down. After ' + fmtYears(years()) + ', the diamond is still diamond.';
    }

    reset();
    return {
      controls: [
        { type: 'seg', key: 'temp', label: 'Temperature', options: [['room', 'Room temperature'], ['hot', 'Heat it (no air)']] },
        { type: 'btn', key: 'reset', label: 'Start over' },
      ],
      get: function (k) { return st[k]; },
      set: function (k, v) { if (k === 'temp' && v !== st.temp) { if (v === 'hot') heatT = 0; else clock = 0; } st[k] = v; },
      action: function (k) { if (k === 'reset') reset(); },
      stats: function () { return { diamond: count(0), graphite: count(1) }; },
      update: update, draw: draw, describe: describe,
    };
  }

  var MAKERS = { soda: soda, ocean: ocean, blood: blood, diamond: diamond };
  global.EqScenes = {
    bottle: { hw: hw, bore: bore, glassPath: glassPath, drawGlass: drawGlass, drawFront: drawFront, cap: cap, co2: co2 },
    has: function (id) { return !!MAKERS[id]; },
    create: function (id, canvas, opts) { return MAKERS[id](canvas, opts || {}); },
  };
})(window);
