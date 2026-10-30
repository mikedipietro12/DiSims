/**
 * Intro to Equilibrium - graphs and Gibbs bars (Task 4).
 *
 * Shared by the Sandbox and the Guide stage. Each chart reads an EqVessel engine and
 * redraws on demand: chart.draw().
 *   - concentration(canvas, engine): molecules of each species over time
 *   - rates(canvas, engine): forward (solid ink) vs reverse (dashed tide) meeting
 *   - gibbs(canvas, engine): waterfall ΔH → −TΔS → ΔG, glyphs, no numbers (principle 3)
 * Taste: Ember and Tide (docs/designpowers/taste/2026-10-30-equilibrium-intro-taste.md).
 */
(function (global) {
  'use strict';

  var R = global.EqReactions;
  var INK = '#1d2433', DIM = '#5b6474';
  var EMBER = '#e07a2e', TIDE = '#14918f';
  var MONO = '"Space Mono", monospace';
  var WINDOW = 30; // seconds of history shown

  function fit(canvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 300, h = canvas.clientHeight || 150;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function niceTop(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return n * p;
  }

  function frame(ctx, L, T, gw, gh) {
    ctx.strokeStyle = 'rgba(29,36,51,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + gh); ctx.lineTo(L + gw, T + gh); ctx.stroke();
  }

  function timeWindow(hist) {
    var t1 = hist.length ? hist[hist.length - 1].t : 0;
    return { t0: Math.max(hist.length ? hist[0].t : 0, t1 - WINDOW), t1: Math.max(t1, 1) };
  }

  /** Concentration (molecule count) of each species over time. */
  function concentration(canvas, engine) {
    function draw() {
      var f = fit(canvas), ctx = f.ctx, hist = engine.history();
      var L = 40, Rm = 10, T = 8, B = 22, gw = f.w - L - Rm, gh = f.h - T - B;
      if (gw < 20 || gh < 20 || !hist.length) return;
      var rxn = engine.reaction();
      var sps = Object.keys(rxn.reactants).concat(Object.keys(rxn.products));
      var win = timeWindow(hist), tw = win.t1 - win.t0;
      var ymax = 1;
      hist.forEach(function (s) { if (s.t >= win.t0) sps.forEach(function (sp) { ymax = Math.max(ymax, s.counts[sp] || 0); }); });
      var step = Math.max(1, Math.ceil(niceTop(ymax * 1.1 / 4))), top = step * 4;
      var xAt = function (t) { return L + (t - win.t0) / tw * gw; };
      var yAt = function (v) { return T + gh * (1 - v / top); };

      ctx.font = '10px ' + MONO; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (var i = 0; i <= 4; i++) {
        var v = step * i, y = yAt(v);
        ctx.strokeStyle = i === 0 ? 'rgba(29,36,51,0.25)' : 'rgba(29,36,51,0.08)';
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + gw, y); ctx.stroke();
        ctx.fillStyle = DIM; ctx.fillText(String(Math.round(v)), L - 6, y);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('time →', L + gw / 2, f.h - B + 7);

      ctx.save(); ctx.beginPath(); ctx.rect(L, 0, gw, f.h); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      sps.forEach(function (sp, k) {
        var info = R.SPECIES[sp];
        ctx.strokeStyle = info.color; ctx.lineWidth = 3;
        // reactants solid, products dashed: species stay apart without colour
        ctx.setLineDash(k < Object.keys(rxn.reactants).length ? [] : [7, 4]);
        ctx.beginPath();
        var started = false;
        hist.forEach(function (s) {
          if (s.t < win.t0) return;
          var x = xAt(s.t), y = yAt(s.counts[sp] || 0);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
      ctx.restore();
    }
    return { draw: draw };
  }

  /** Forward and reverse rates over time: two lines that meet. No numbers. */
  function rates(canvas, engine) {
    function draw() {
      var f = fit(canvas), ctx = f.ctx, hist = engine.history();
      var L = 22, Rm = 10, T = 10, B = 22, gw = f.w - L - Rm, gh = f.h - T - B;
      if (gw < 20 || gh < 20 || !hist.length) return;
      var win = timeWindow(hist), tw = win.t1 - win.t0;
      var ymax = 1e-6;
      hist.forEach(function (s) { if (s.t >= win.t0) ymax = Math.max(ymax, s.rf, s.rr); });
      var top = ymax * 1.15;
      var xAt = function (t) { return L + (t - win.t0) / tw * gw; };
      var yAt = function (v) { return T + gh * (1 - v / top); };
      frame(ctx, L, T, gw, gh);
      ctx.font = '10px ' + MONO; ctx.fillStyle = DIM;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('time →', L + gw / 2, f.h - B + 7);
      ctx.save(); ctx.translate(L - 8, T + gh / 2); ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle'; ctx.fillText('faster →', 0, 0); ctx.restore();

      ctx.save(); ctx.beginPath(); ctx.rect(L, 0, gw, f.h); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 3.5;
      [['rf', INK, []], ['rr', TIDE, [7, 5]]].forEach(function (d) {
        ctx.strokeStyle = d[1]; ctx.setLineDash(d[2]);
        ctx.beginPath();
        var started = false;
        hist.forEach(function (s) {
          if (s.t < win.t0) return;
          var x = xAt(s.t), y = yAt(s[d[0]]);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
      ctx.restore();

      // Line-end labels: the higher line's label goes above, the other below, and the
      // pair is kept 14 px apart and inside the plot. Right of the line end when there is room.
      var last = hist[hist.length - 1];
      var yf = yAt(last.rf), yr = yAt(last.rr), fTop = yf <= yr;
      var a = Math.min(yf, yr) - 9, b = Math.max(yf, yr) + 9;
      // No room under the lines (both near zero): stack both labels above them
      if (b > T + gh - 6) { a = Math.min(yf, yr) - 23; b = Math.min(yf, yr) - 9; }
      if (a < T + 6) { b += T + 6 - a; a = T + 6; }
      var xe = xAt(last.t), roomRight = xe + 78 < L + gw;
      var lx = roomRight ? xe + 6 : xe - 2;
      ctx.font = '700 10px ' + MONO; ctx.textAlign = roomRight ? 'left' : 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = INK; ctx.fillText('→ forward', lx, fTop ? a : b);
      ctx.fillStyle = TIDE; ctx.fillText('← reverse', lx, fTop ? b : a);
    }
    return { draw: draw };
  }

  /**
   * Waterfall Gibbs bars. Scale is per reaction (the largest bar end over the whole
   * T range) so the ozone pair doesn't flatten N2O4 / Haber, and only −TΔS moves with T.
   */
  function gibbs(canvas, engine) {
    function scaleFor(rxn) {
      var tr = R.T_RANGE;
      return Math.max(Math.abs(rxn.dH), Math.abs(R.dG(rxn, tr.min)), Math.abs(R.dG(rxn, tr.max))) * 1.08;
    }
    function draw() {
      var f = fit(canvas), ctx = f.ctx, st = engine.getState(), rxn = engine.reaction();
      var T = 18, B = 24, gh = f.h - T - B;
      if (f.w < 60 || gh < 30) return;
      var span = scaleFor(rxn);
      var mid = T + gh / 2, unit = (gh / 2) / span;
      var yAt = function (v) { return mid - v * unit; };
      var cols = [
        { name: 'ΔH', from: 0, to: st.dH, fill: EMBER },
        { name: '−TΔS', from: st.dH, to: st.dH + st.mTdS, fill: TIDE },
        { name: 'ΔG', from: 0, to: st.dG, fill: INK },
      ];
      var L = 34, gw = f.w - L - 8, slot = gw / 3, bw = Math.min(56, slot * 0.58);

      // zero line + quiet side marks
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L - 6, mid); ctx.lineTo(L + gw, mid); ctx.stroke();
      ctx.font = '700 12px ' + MONO; ctx.fillStyle = DIM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', 14, T + 8); ctx.fillText('0', 14, mid); ctx.fillText('−', 14, T + gh - 8);

      cols.forEach(function (c, i) {
        var x = L + slot * i + (slot - bw) / 2;
        var y0 = yAt(c.from), y1 = yAt(c.to);
        var top = Math.min(y0, y1), h = Math.max(2, Math.abs(y1 - y0));
        ctx.fillStyle = c.fill;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, top, bw, h, 5); else ctx.rect(x, top, bw, h);
        ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
        // waterfall connector from the end of ΔH to the start of −TΔS
        if (i === 0) {
          ctx.setLineDash([2, 3]); ctx.strokeStyle = DIM; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x + bw, y1); ctx.lineTo(x + slot, y1); ctx.stroke(); ctx.setLineDash([]);
        }
        var up = c.to - c.from >= 0, tiny = Math.abs(c.to - c.from) * unit < 1;
        ctx.fillStyle = INK; ctx.font = '700 14px ' + MONO; ctx.textAlign = 'center';
        ctx.textBaseline = up ? 'bottom' : 'top';
        ctx.fillText(tiny ? '0' : up ? '+' : '−', x + bw / 2, up ? top - 3 : top + h + 3);
        ctx.font = '700 11px ' + MONO; ctx.fillStyle = DIM; ctx.textBaseline = 'bottom';
        ctx.fillText(c.name, x + bw / 2, f.h - 4);
      });
    }
    return { draw: draw };
  }

  /** Plain-language bar description for screen readers. */
  function gibbsText(st) {
    function sign(v) { return Math.abs(v) < 0.5 ? 'about zero' : v > 0 ? 'positive' : 'negative'; }
    return 'ΔH is ' + sign(st.dH) + '. Minus T ΔS is ' + sign(st.mTdS) + '. ΔG is ' + sign(st.dG) + '.';
  }

  global.EqCharts = { concentration: concentration, rates: rates, gibbs: gibbs, gibbsText: gibbsText };
})(window);
