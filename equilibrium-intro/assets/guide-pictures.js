/**
 * Intro to Equilibrium - Guide stage pictures (Task 6).
 *
 * Small drawn scenes for the Guide's non-vessel beats:
 *   heat   - system box with heat arrows (ember) crossing its edge
 *   spread - before / after particle snapshots (beat 2: simple drawings, not the IMF heat jar)
 *   pulls  - heat arrow (ember) beside spreading arrow (tide)
 *   paths  - two routes between the same start and end (state functions)
 *   equation - big equation for example cards
 * Pictures that would give away a prediction (heat, pulls) stay grey with "?" until revealed.
 */
(function (global) {
  'use strict';

  var INK = '#1d2433', DIM = '#5b6474', FAINT = 'rgba(29,36,51,0.18)';
  var EMBER = '#e07a2e', TIDE = '#14918f', WATER = '#8fc6ec';
  var MONO = '"Space Mono", monospace', BODY = '"Space Grotesk", Helvetica, sans-serif';

  function fit(canvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 400, h = canvas.clientHeight || 300;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  // Seeded jitter so snapshots don't reshuffle on every redraw
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------- heat: system box with heat arrows ---------- */
  function heat(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var bw = Math.min(w * 0.42, 190), bh = Math.min(h * 0.46, 150), bx = (w - bw) / 2, by = (h - bh) / 2 + 6;
    ctx.fillStyle = '#fbfcfe'; roundBox(ctx, bx, by, bw, bh, 16); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    label(ctx, 'system', w / 2, by + bh / 2 - 10, { color: INK, size: 13 });
    label(ctx, o.title || '', w / 2, by + bh / 2 + 12, { font: BODY, weight: '500', size: 13, color: DIM });
    label(ctx, 'surroundings', w / 2, 16, { size: 11 });
    var sign = o.revealed ? o.dH : null;
    var col = sign ? EMBER : FAINT, phase = o.phase || 0;
    var spots = [[bx - 70, by + bh * 0.3, bx - 8, by + bh * 0.3], [bx + bw + 70, by + bh * 0.3, bx + bw + 8, by + bh * 0.3],
      [bx - 70, by + bh * 0.72, bx - 8, by + bh * 0.72], [bx + bw + 70, by + bh * 0.72, bx + bw + 8, by + bh * 0.72]];
    spots.forEach(function (s) {
      var x1 = s[0], y1 = s[1], x2 = s[2], y2 = s[3];
      if (sign === '−') { var t = x1; x1 = x2; x2 = t; }
      var dash = sign ? [8, 6] : [4, 6];
      ctx.lineDashOffset = sign ? -phase * 28 : 0;
      arrow(ctx, x1, y1, x2, y2, col, 4, dash);
      ctx.lineDashOffset = 0;
    });
    var cap = !sign ? '? Predict which way heat flows' : sign === '+' ? 'Heat flows in · ΔH +' : 'Heat flows out · ΔH −';
    label(ctx, cap, w / 2, h - 18, { color: sign ? INK : DIM, size: 12 });
  }

  /* ---------- spread: before / after snapshots ---------- */
  var STATES = {
    solid: function (ctx, cx, cy, s, r) {
      for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) ball(ctx, cx + i * s * 2.05, cy + j * s * 2.05, s, '#4f9fd8', '#d7ecfb');
    },
    liquid: function (ctx, cx, cy, s, r) {
      for (var k = 0; k < 25; k++) {
        var a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * 6.2;
        ball(ctx, cx + Math.cos(a) * d * 1.15, cy + 10 + Math.sin(a) * d * 0.62, s, '#4f9fd8', '#d7ecfb');
      }
    },
    gas: function (ctx, cx, cy, s, r, box) {
      for (var k = 0; k < 25; k++) ball(ctx, box.x + s + r() * (box.w - 2 * s), box.y + s + r() * (box.h - 2 * s), s, '#4f9fd8', '#d7ecfb');
    },
    crystal: function (ctx, cx, cy, s) {
      for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) {
        var pos = (i + j) % 2 === 0;
        ball(ctx, cx + i * s * 2.05, cy + j * s * 2.05, s, pos ? '#8a93a6' : '#c9a227', pos ? '#eef0f5' : '#fff1b3');
      }
    },
    ions: function (ctx, cx, cy, s, r, box) {
      for (var k = 0; k < 24; k++) {
        var x = box.x + s * 2 + r() * (box.w - 4 * s), y = box.y + s * 2 + r() * (box.h - 4 * s);
        ball(ctx, x, y, s * 0.55, 'rgba(143,198,236,0.9)', '#eef7fd');
      }
      for (var m = 0; m < 12; m++) {
        var ix = box.x + s * 2 + r() * (box.w - 4 * s), iy = box.y + s * 2 + r() * (box.h - 4 * s);
        ball(ctx, ix, iy, s, m % 2 ? '#8a93a6' : '#c9a227', m % 2 ? '#eef0f5' : '#fff1b3');
      }
    },
    // Hot pack surprise: each Ca2+ wears a tight shell of water molecules
    shells: function (ctx, cx, cy, s, r, box) {
      for (var m = 0; m < 6; m++) {
        var ix = box.x + s * 4 + r() * (box.w - 8 * s), iy = box.y + s * 4 + r() * (box.h - 8 * s);
        for (var q = 0; q < 6; q++) {
          var a = q / 6 * Math.PI * 2;
          ball(ctx, ix + Math.cos(a) * s * 1.6, iy + Math.sin(a) * s * 1.6, s * 0.55, 'rgba(79,159,216,0.95)', '#d7ecfb');
        }
        ball(ctx, ix, iy, s, '#8a93a6', '#eef0f5');
      }
      for (var k = 0; k < 10; k++) ball(ctx, box.x + s * 2 + r() * (box.w - 4 * s), box.y + s * 2 + r() * (box.h - 4 * s), s * 0.85, '#c9a227', '#fff1b3');
    },
  };
  var SPREAD = {
    melt: ['solid', 'liquid', 'Solid', 'Liquid'],
    evap: ['liquid', 'gas', 'Liquid', 'Gas'],
    freeze: ['liquid', 'solid', 'Liquid', 'Solid'],
    hotpack: ['crystal', 'shells', 'Crystal + water', 'Dissolved'],
    coldpack: ['crystal', 'ions', 'Crystal + water', 'Dissolved'],
  };

  function spread(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, pair = SPREAD[o.id] || SPREAD.melt;
    var pad = 14, gap = 44, pw = (w - pad * 2 - gap) / 2, ph = h - 64, py = 30;
    var s = Math.max(5, Math.min(pw, ph) / 15);
    [0, 1].forEach(function (k) {
      var px = pad + k * (pw + gap);
      ctx.fillStyle = '#fbfcfe'; roundBox(ctx, px, py, pw, ph, 14); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); roundBox(ctx, px, py, pw, ph, 14); ctx.clip();
      var box = { x: px + 4, y: py + 4, w: pw - 8, h: ph - 8 };
      STATES[pair[k]](ctx, px + pw / 2, py + ph / 2, s, rng(7 + k * 13 + (o.id || '').length), box);
      ctx.restore();
      label(ctx, (k ? 'After · ' : 'Before · ') + pair[k + 2], px + pw / 2, py + ph + 18, { color: INK, size: 11 });
    });
    arrow(ctx, pad + pw + 8, py + ph / 2, pad + pw + gap - 8, py + ph / 2, INK, 3);
    label(ctx, o.title || '', w / 2, 14, { font: BODY, weight: '700', size: 13, color: INK });
  }

  /* ---------- pulls: heat arrow vs spreading arrow ---------- */
  function pulls(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    label(ctx, o.title || '', w / 2, 18, { font: BODY, weight: '700', size: 14, color: INK });
    var cols = [
      { name: 'Heat', sym: 'ΔH', sign: o.dH, color: EMBER, favours: o.dH === '−' },
      { name: 'Spreading', sym: 'ΔS', sign: o.dS, color: TIDE, favours: o.dS === '+' },
    ];
    var midY = h / 2 + 4, span = Math.min(h * 0.28, 80);
    cols.forEach(function (c, i) {
      var x = w * (i ? 0.7 : 0.3), shown = o.revealed;
      label(ctx, c.name, x, midY - span - 26, { color: INK, size: 12 });
      if (!shown) {
        label(ctx, '?', x, midY, { color: DIM, size: 34 });
      } else {
        var up = c.favours;
        arrow(ctx, x, up ? midY + span : midY - span, x, up ? midY - span : midY + span, c.color, 8);
        label(ctx, c.sym + ' ' + c.sign, x + 30, midY, { color: INK, size: 13, align: 'left' });
      }
      label(ctx, shown ? (c.favours ? 'helps it go' : 'works against it') : '', x, midY + span + 24, { color: DIM, size: 11 });
    });
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2, midY - span - 10); ctx.lineTo(w / 2, midY + span + 10); ctx.stroke();
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

  /* ---------- equation card ---------- */
  function equation(canvas, o) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    label(ctx, o.title || '', w / 2, h * 0.3, { font: BODY, weight: '700', size: 18, color: INK });
    var size = Math.min(26, Math.max(14, w / Math.max(10, (o.eq || '').length) * 1.5));
    label(ctx, o.eq || '', w / 2, h * 0.52, { font: BODY, weight: '700', size: size, color: INK });
    if (o.note) label(ctx, o.note, w / 2, h * 0.72, { size: 11 });
  }

  global.EqPictures = { heat: heat, spread: spread, pulls: pulls, paths: paths, equation: equation };
})(window);
