/* Path B — Graphing rates (integration) */
(function () {
  'use strict';

  var DEBRIEF = {
    intentions: [
      { text: 'Identify the rate law expression of a chemical reaction using data that show how the concentrations of reaction species change over time.', target: 'lin', revisit: '5.3.A linearize' }
    ],
    /* Essential knowledge stays here for coverage checks — not student-facing on the opening screen. */
    essentialKnowledge: [
      { code: '5.3.A.1', name: '5.3.A.1', text: 'The order of a reaction can be inferred from a graph of concentration of reactant versus time.', target: 'side', revisit: 'Zero vs first' },
      { code: '5.3.A.2', name: '5.3.A.2', text: 'If a reaction is first order with respect to a reactant being monitored, a plot of the natural log (ln) of the reactant concentration as a function of time will be linear.', target: 'lin', revisit: 'ln[A] vs t' },
      { code: '5.3.A.3', name: '5.3.A.3', text: 'If a reaction is second order with respect to a reactant being monitored, a plot of the reciprocal of the concentration of that reactant versus time will be linear.', target: 'lin', revisit: '1/[A] vs t' },
      { code: '5.3.A.4', name: '5.3.A.4', text: 'The slopes of the concentration versus time data for zeroth, first, and second order reactions can be used to determine the rate constant for the reaction.', target: 'slope', revisit: 'Slope = k' },
      { code: '5.3.A.5', name: '5.3.A.5', text: 'Half-life is a critical parameter for first order reactions because the half-life is constant and related to the rate constant by t½ = 0.693/k.', target: 'halflife', revisit: 'Half-life' },
      { code: '5.3.A.6', name: '5.3.A.6', text: 'Radioactive decay processes provide an important illustration of first order kinetics.', target: 'decay', revisit: 'Radioactive decay' }
    ],
    competencies: [
      { code: 'Q&P', name: 'Questioning and predicting', text: 'I can predict which concentration-versus-time plot will be linear for a given reaction order, then check that prediction against the graph.', target: 'lin', revisit: 'ln[A] vs t' },
      { code: 'PC', name: 'Planning and conducting', text: 'I can set up the transformed plots ([A], ln[A], and 1/[A] vs t) needed to test reaction order from time-course data.', target: 'sheets', revisit: 'Sheets practice' },
      { code: 'PAI', name: 'Processing and analyzing data and information', text: 'I can determine the order from which transform straightens the curve, and find k from the slope of that straight line.', target: 'slope', revisit: 'Slope = k' },
      { code: 'E', name: 'Evaluating', text: 'I can recognize when a transform leaves the plot curved and explain why that means the reaction is not that order.', target: 'lin', revisit: 'ln[A] vs t' },
      { code: 'C', name: 'Communicating', text: 'I can write a rate law from the linear plot and use the first-order half-life relationship t½ = 0.693/k when the data call for it.', target: 'halflife', revisit: 'Half-life' }
    ]
  };

  var STEPS = ['review', 'side', 'bridge', 'lin', 'slope', 'irl', 'sheets', 'halflife', 'summary'];
  var HELP = {
    review: 'Rate is how fast concentration changes — the slope of [A] vs t at a moment, or Δ[A]/Δt over an interval. Steeper means faster; a curve that flattens is a reaction that is slowing as [A] falls.',
    side: 'Same starting count, same clock. Zero-order declines in a straight line; first-order bends as it slows. If you wondered why zero-order does not slow as it runs out: a saturated catalyst or surface, not a simple particle story.',
    bridge: 'Raw [A] vs t is curved for first and second order, so the shape is only a hint. A transform of the same y-values can make the plot linear. The one that straightens names the order.',
    lin: 'Drag ln or 1/ onto the y-axis (or tap a chip). A wrong transform stays curved or bends the other way — that failure is the teaching. This is still the first-order run you just watched, not a new example.',
    slope: 'Click two points on the straight line. Slope is Δy/Δx. For this first-order ln[A] vs t plot, slope = −k, so k is the positive value you get by flipping the sign.',
    irl: 'Click Zero-order, First-order, or Second-order to switch the graph. Each card is a short summary: rate law, linear axes, what the slope means, and a real-world example.',
    sheets: 'Download a CSV, open it in Google Sheets, and build three scatter plots: raw, ln, and 1/[A]. The visually straight one names the order. Write that rate law here; leave k as a symbol. The checklist is only if you need the chart menus again.',
    halflife: 'Many small points sit on the curve. Find the ones where concentration is half of the previous mark — not every dot is a half-life. The time between correct marks is the half-life interval. Switch Zero / First / Second to compare whether those intervals shrink, stay constant, or grow.',
    summary: 'Order comes from which graph straightens. k is now a value you can read off a slope. AP tests first-order half-life only: t½ = 0.693/k. Radioactive decay is the usual illustration of that constant half-life.'
  };

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = {};
  var state = { step: 0, transform: 'raw', slopePts: [], irlRow: null, sheetsLaw: {}, hl: { order: 0, picked: {} } };
  var anim = { raf: 0 };

  /* Kinetics parameters shared from step B into D/E */
  var A0 = 1.00;
  var K0 = 0.012;   /* zero-order: A = A0 - k t, empty at ~83 s */
  var K1 = 0.018;   /* first-order */
  var K2 = 0.025;   /* second-order, used in half-life + CSVs */
  var TMAX = 80;

  function $(id) { return document.getElementById(id); }

  function conc(order, t) {
    if (order === 0) return Math.max(0, A0 - K0 * t);
    if (order === 1) return A0 * Math.exp(-K1 * t);
    return A0 / (1 + K2 * A0 * t);
  }

  function series(order, n) {
    return seriesTo(order, TMAX, n);
  }

  function seriesTo(order, tmax, n) {
    n = n || 40;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = tmax * i / n;
      pts.push({ t: t, A: conc(order, t) });
    }
    return pts;
  }

  function yVal(pt, transform) {
    if (transform === 'ln') return Math.log(Math.max(pt.A, 1e-6));
    if (transform === 'inv') return 1 / Math.max(pt.A, 1e-6);
    return pt.A;
  }

  /* Shared plot geometry so live path updates keep the same axes as svgPlot. */
  function plotGeom(scalePts, transform, opts) {
    opts = opts || {};
    var G = 24;
    var W = 22 * G, H = 13 * G;
    var tmax = opts.tmax || TMAX;
    var wide = !!(opts.axisTicks || opts.yDrop || opts.tickGrid);
    var padBox = {
      l: (wide ? 3.25 : 2) * G,
      r: G,
      t: G,
      /* Room for tick numerals + axis title, not a deep empty strip. */
      b: (opts.axisTicks || opts.tickGrid ? 2.1 : 2) * G
    };
    var ys = scalePts.map(function (pt) { return yVal(pt, transform); });
    var yMin = Math.min.apply(null, ys);
    var yMax = Math.max.apply(null, ys);
    if (yMax === yMin) { yMax += 1; yMin -= 1; }
    var pad = (yMax - yMin) * 0.08;
    yMin -= pad;
    yMax += pad;
    /* Raw [A] and 1/[A] are non-negative. Pin the floor at 0 so the x-axis
       sits on the zero tick instead of floating in padded empty space. */
    if (transform !== 'ln' && yMin < 0) yMin = 0;
    return {
      W: W,
      H: H,
      p: padBox,
      yMin: yMin,
      yMax: yMax,
      tmax: tmax,
      x: function (t) { return padBox.l + (t / tmax) * (W - padBox.l - padBox.r); },
      y: function (v) { return padBox.t + (1 - (v - yMin) / (yMax - yMin)) * (H - padBox.t - padBox.b); }
    };
  }

  function pathFromPts(pts, transform, geom) {
    return pts.map(function (pt, i) {
      return (i ? 'L' : 'M') + geom.x(pt.t).toFixed(1) + ',' + geom.y(yVal(pt, transform)).toFixed(1);
    }).join(' ');
  }

  function niceTicks(min, max, target) {
    target = target || 4;
    var span = max - min;
    if (!(span > 0) || !isFinite(span)) return [min];
    var raw = span / target;
    var pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / pow;
    var step = n < 1.5 ? pow : n < 3.5 ? 2 * pow : n < 7.5 ? 5 * pow : 10 * pow;
    var start = Math.ceil(min / step - 1e-9) * step;
    var out = [];
    for (var v = start; v <= max + step * 1e-6; v += step) out.push(v);
    return out;
  }

  function fmtTick(v) {
    var a = Math.abs(v);
    if (a >= 10) return v.toFixed(0);
    if (a >= 1) return Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : v.toFixed(1);
    return v.toFixed(2);
  }

  function svgPlot(pts, transform, opts) {
    opts = opts || {};
    if (opts.graphPaper && opts.axisTicks == null) opts.axisTicks = true;
    var scalePts = opts.scalePts || pts;
    var geom = plotGeom(scalePts, transform, opts);
    var W = geom.W, H = geom.H, p = geom.p;
    var x = geom.x, y = geom.y;
    var d = pathFromPts(pts, transform, geom);
    var ylab = transform === 'ln' ? 'ln[A]' : transform === 'inv' ? '1/[A]' : '[A]';
    var dots = '';
    if (opts.dots) {
      pts.forEach(function (pt, i) {
        if (i % 4 !== 0) return;
        dots += '<circle class="pt" data-i="' + i + '" cx="' + x(pt.t) + '" cy="' + y(yVal(pt, transform)) + '" r="5" fill="#1565c0" stroke="#000" stroke-width="1"/>';
      });
    }
    var guides = '';
    if (opts.rateGuides && transform === 'raw') {
      /* Instantaneous tangents + average secant. Three colours; labels on
         paper plates clear of the traces. Reveal after the curve draws. */
      var COL_EARLY = '#1565c0';
      var COL_LATE = '#6b3fa0';
      var COL_AVG = '#8a5a00';
      var UNIT = 'Mol/L/s';
      var half = 10;

      function labelPlate(cx, cy, lines, color, anchor, angleDeg) {
        var padX = 5;
        var padY = 3;
        var lineH = 11;
        var fs = 9;
        var maxLen = 0;
        lines.forEach(function (s) { if (s.length > maxLen) maxLen = s.length; });
        var tw = maxLen * 5.5 + padX * 2;
        var th = lines.length * lineH + padY * 2;
        var x0 = anchor === 'end' ? -tw : anchor === 'middle' ? -tw / 2 : 0;
        var y0 = -th / 2;
        var rect =
          '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) +
          '" width="' + tw.toFixed(1) + '" height="' + th.toFixed(1) +
          '" fill="#ffffff" stroke="' + color + '" stroke-width="1.25"/>';
        var texts = lines.map(function (line, i) {
          var tx = anchor === 'end' ? -padX : anchor === 'middle' ? 0 : padX;
          var ty = y0 + padY + (i + 0.78) * lineH;
          return '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) +
            '" text-anchor="' + anchor +
            '" font-family="IBM Plex Mono,monospace" font-size="' + fs +
            '" font-weight="600" fill="' + color + '">' + line + '</text>';
        }).join('');
        var rot = angleDeg ? ' rotate(' + angleDeg.toFixed(1) + ')' : '';
        return '<g transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')' + rot + '">' +
          rect + texts + '</g>';
      }

      function tangentMark(tHit, color, title, place) {
        var A = conc(1, tHit);
        var m = -K1 * A;
        var tL = Math.max(0, tHit - half);
        var tR = Math.min(TMAX, tHit + half);
        var AL = A + m * (tL - tHit);
        var AR = A + m * (tR - tHit);
        var x1 = x(tL);
        var y1 = y(AL);
        var x2 = x(tR);
        var y2 = y(AR);
        var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        var nx = -(y2 - y1);
        var ny = (x2 - x1);
        var nlen = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= nlen;
        ny /= nlen;
        var side = place.side || 1;
        var lx = x(tHit) + nx * side * (place.dist || 28) + (place.dx || 0);
        var ly = y(A) + ny * side * (place.dist || 28) + (place.dy || 0);
        var lines = [title, m.toFixed(3) + ' ' + UNIT];
        return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
          '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
          '" stroke="' + color + '" stroke-width="2.25"/>' +
          '<circle cx="' + x(tHit).toFixed(1) + '" cy="' + y(A).toFixed(1) +
          '" r="4.5" fill="' + color + '" stroke="#000" stroke-width="1"/>' +
          labelPlate(lx, ly, lines, color, place.anchor || 'middle', ang);
      }

      var A0pt = pts[0] ? yVal(pts[0], 'raw') : A0;
      var Aend = pts[pts.length - 1] ? yVal(pts[pts.length - 1], 'raw') : conc(1, TMAX);
      var mAvg = (Aend - A0pt) / TMAX;
      var ax1 = x(0);
      var ay1 = y(A0pt);
      var ax2 = x(TMAX);
      var ay2 = y(Aend);
      var amx = (ax1 + ax2) / 2;
      var amy = (ay1 + ay2) / 2;
      var anx = -(ay2 - ay1);
      var any = (ax2 - ax1);
      var anlen = Math.sqrt(anx * anx + any * any) || 1;
      anx /= anlen;
      any /= anlen;
      if (any > 0) { anx = -anx; any = -any; }
      var alx = amx + anx * 30;
      var aly = amy + any * 30;

      var early = tangentMark(12, COL_EARLY, 'early slope', { side: 1, dist: 34, anchor: 'middle' });
      var late = tangentMark(48, COL_LATE, 'late slope', { side: 1, dist: 28, anchor: 'middle' });
      var avgLine =
        '<line x1="' + ax1.toFixed(1) + '" y1="' + ay1.toFixed(1) +
        '" x2="' + ax2.toFixed(1) + '" y2="' + ay2.toFixed(1) +
        '" stroke="' + COL_AVG + '" stroke-width="2.25" stroke-dasharray="7 4"/>' +
        labelPlate(alx, aly, ['average Δ[A]/Δt', mAvg.toFixed(3) + ' ' + UNIT], COL_AVG, 'middle', 0);

      var guideAnim = prefersReduced
        ? ''
        : 'class="rate-guides" style="opacity:0;animation:rate-guides-in 0.55s ease forwards 1.65s"';
      guides = '<g ' + guideAnim + '>' + avgLine + early + late + '</g>';
    }

    var ticks = '';
    var grid = '';
    if (opts.axisTicks || opts.tickGrid) {
      var tmax = geom.tmax || TMAX;
      var xVals = [];
      var xStep = tmax <= 80 ? 20 : (tmax <= 120 ? 20 : 40);
      for (var xt = 0; xt <= tmax + 1e-9; xt += xStep) xVals.push(xt);
      if (xVals[xVals.length - 1] !== tmax) xVals.push(tmax);
      var yTickVals = niceTicks(geom.yMin, geom.yMax, 4).filter(function (vv) {
        return vv >= geom.yMin - 1e-6 && vv <= geom.yMax + 1e-6;
      });
      if (opts.tickGrid) {
        xVals.forEach(function (tv) {
          var px = x(tv);
          grid += '<line class="tick-grid" x1="' + px.toFixed(1) + '" y1="' + p.t + '" x2="' + px.toFixed(1) +
            '" y2="' + (H - p.b) + '" stroke="#c5d8f0" stroke-width="1"/>';
        });
        yTickVals.forEach(function (vv) {
          var py = y(vv);
          grid += '<line class="tick-grid" x1="' + p.l + '" y1="' + py.toFixed(1) + '" x2="' + (W - p.r) +
            '" y2="' + py.toFixed(1) + '" stroke="#c5d8f0" stroke-width="1"/>';
        });
      }
      if (opts.axisTicks) {
        xVals.forEach(function (tv) {
          var px = x(tv);
          ticks += '<line x1="' + px.toFixed(1) + '" y1="' + (H - p.b) + '" x2="' + px.toFixed(1) +
            '" y2="' + (H - p.b + 5) + '" stroke="#000" stroke-width="1"/>';
          ticks += '<text x="' + px.toFixed(1) + '" y="' + (H - p.b + 16) +
            '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9">' +
            tv + '</text>';
        });
        yTickVals.forEach(function (vv) {
          var py = y(vv);
          ticks += '<line x1="' + (p.l - 5) + '" y1="' + py.toFixed(1) + '" x2="' + p.l +
            '" y2="' + py.toFixed(1) + '" stroke="#000" stroke-width="1"/>';
          ticks += '<text x="' + (p.l - 7) + '" y="' + (py + 3).toFixed(1) +
            '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9">' +
            fmtTick(vv) + '</text>';
        });
      }
    }

    var yDrop = '';
    /* Sit just left of tick numerals (or the axis), not parked at the SVG edge. */
    var ylabX = opts.yDrop
      ? 12
      : (opts.axisTicks || opts.tickGrid ? (p.l - 40) : 14);
    var ylabSvg = '';
    if (opts.yDrop) {
      var empty = transform === 'raw';
      /* Hit zone covers the [A]/ln[A]/1/[A] label and the axis line. */
      yDrop =
        '<g id="yDrop" class="y-axis-drop' + (empty ? ' is-empty' : '') + '">' +
        '<rect class="y-drop-hit" x="0" y="' + (p.t - 4) + '" width="' + (p.l + 10) +
        '" height="' + (H - p.t - p.b + 8) + '" fill="' +
        (empty ? 'rgba(21,101,192,0.07)' : 'rgba(21,101,192,0.02)') +
        '" stroke="' + (empty ? '#1565c0' : '#c5d8f0') +
        '" stroke-width="1.5" stroke-dasharray="' + (empty ? '5 4' : '2 3') + '"/>' +
        '<text class="y-drop-label" x="' + ylabX + '" y="' + (H / 2) +
        '" transform="rotate(-90 ' + ylabX + ' ' + (H / 2) +
        ')" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12" font-weight="600" fill="' +
        (empty ? '#1565c0' : '#000') + '">' + ylab + '</text>' +
        '</g>';
    } else if (ylab) {
      ylabSvg =
        '<text x="' + ylabX + '" y="' + (H / 2) + '" transform="rotate(-90 ' + ylabX + ' ' + (H / 2) +
        ')" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11">' + ylab + '</text>';
    }

    var len = 900;
    var draw = (prefersReduced || opts.noDrawAnim)
      ? ''
      : 'stroke-dasharray="' + len + '" stroke-dashoffset="' + len + '" style="animation:trace-draw 1.6s ease-out forwards"';
    var paperCls = opts.graphPaper ? ' plot-paper' : '';
    return '<svg class="plot' + paperCls + '" viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
      '<style>@keyframes trace-draw{to{stroke-dashoffset:0}}' +
      '@keyframes rate-guides-in{to{opacity:1}}</style>' +
      yDrop +
      grid +
      '<line x1="' + p.l + '" y1="' + (H - p.b) + '" x2="' + (W - p.r) + '" y2="' + (H - p.b) + '" stroke="#000" stroke-width="1.5"/>' +
      '<line x1="' + p.l + '" y1="' + p.t + '" x2="' + p.l + '" y2="' + (H - p.b) + '" stroke="#000" stroke-width="1.5"/>' +
      ticks +
      '<text x="' + (W / 2) + '" y="' + (H - p.b + (opts.axisTicks || opts.tickGrid ? 30 : 16)) +
      '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11">time (s)</text>' +
      ylabSvg +
      '<path class="trace" d="' + d + '" fill="none" stroke="#000" stroke-width="2" ' + draw + '/>' +
      dots + guides + '</svg>';
  }

  /* Grow a live [A] vs t prefix by editing path.d — no remount, no CSS flash. */
  function paintLivePlot(host, order, tEnd, scalePts) {
    if (!host) return;
    var pts = [];
    var step = TMAX / 48;
    for (var s = 0; s <= tEnd; s += step) pts.push({ t: s, A: conc(order, s) });
    if (!pts.length || pts[pts.length - 1].t < tEnd - 1e-6) {
      pts.push({ t: tEnd, A: conc(order, tEnd) });
    }
    if (pts.length === 1) {
      pts.push({ t: Math.min(TMAX, tEnd + 0.01), A: conc(order, Math.min(TMAX, tEnd + 0.01)) });
    }
    var path = host.querySelector('svg.plot path.trace');
    if (!path) {
      host.innerHTML = svgPlot(pts, 'raw', { noDrawAnim: true, scalePts: scalePts });
      return;
    }
    path.setAttribute('d', pathFromPts(pts, 'raw', plotGeom(scalePts, 'raw')));
  }

  function paintTiers() {
    els.tierRow.innerHTML = STEPS.map(function (_, i) {
      var cls = 'tier-dot';
      if (i === state.step) cls += ' current';
      else if (i < state.step) cls += ' complete';
      return '<div class="' + cls + '"></div>';
    }).join('');
  }

  function renderReview() {
    els.kicker.textContent = 'A · 5.2.A.1 / 5.3.A.1';
    els.title.textContent = 'Concentration versus time';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">In Part A, each trial was a single initial rate. Here we watch one run as concentration falls with time.</span>' +
      '<span class="frame-line">The rate at any moment is how steep [A] vs t is — Δ[A]/Δt, or the slope of a tangent.</span>' +
      '<strong class="frame-line">The shape of that curve is how we will infer the order.</strong>';
    var pts = series(1, 30);
    els.body.innerHTML =
      '<div class="viewport graph-paper" data-fig="FIG. A  ·  [A] VS t">' +
      '<div class="viewport-body plot-host">' + svgPlot(pts, 'raw', { graphPaper: true, rateGuides: true }) +
      '<p>Steeper means faster. After the curve draws in, three rates appear: the blue early tangent, the purple late tangent, and the gold dashed average over the whole run — each with units Mol/L/s.</p>' +
      '<p>This curve is first-order: as [A] runs down, the instantaneous slope gets shallower — fewer particles, fewer collisions, slower rate.</p>' +
      '</div></div>';
  }

  function renderSide() {
    els.kicker.textContent = 'B · 5.3.A.1';
    els.title.textContent = 'Zero-order vs first-order, same start';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">These two graphs start with the same amount of reactant and start at the same time. Watch carefully how the shape of their curve changes.</span>' +
      '<strong class="frame-line">The order of a reaction can be inferred from the shape of the concentration vs. time graph.</strong>' +
      '<span class="frame-line">This module is going to walk us through how we can determine the order of a reaction from “integrated rate laws” and graphing.</span>' +
      '<strong class="frame-line student-q">What do you think leads to the difference in shape?</strong>';
    els.body.innerHTML =
      '<div class="two-col">' +
      '<div class="viewport" data-fig="FIG. B1  ·  ZERO-ORDER"><div class="viewport-body">' +
      '<canvas class="sim-canvas" id="c0" width="420" height="160" aria-label="Zero-order particles"></canvas>' +
      '<div id="g0"></div></div></div>' +
      '<div class="viewport" data-fig="FIG. B2  ·  FIRST-ORDER"><div class="viewport-body">' +
      '<canvas class="sim-canvas" id="c1" width="420" height="160" aria-label="First-order particles"></canvas>' +
      '<div id="g1"></div></div></div></div>' +
      '<button type="button" class="btn" id="replayB">Replay</button>';
    runSide();
    $('replayB').addEventListener('click', runSide);
  }

  function runSide() {
    cancelAnimationFrame(anim.raf);
    var N = 36;
    function dots() {
      var a = [];
      /* Top band reserved for the ZERO/FIRST readout so it does not sit on the atoms. */
      for (var i = 0; i < N; i++) a.push({ x: 20 + (i % 12) * 32, y: 46 + Math.floor(i / 12) * 36, live: true });
      return a;
    }
    var z = dots();
    var f = dots();
    var t0 = performance.now();
    var c0 = $('c0'), c1 = $('c1');
    var g0 = $('g0'), g1 = $('g1');
    if (!c0 || !g0) return;
    var x0 = c0.getContext('2d'), x1 = c1.getContext('2d');
    var scale0 = series(0);
    var scale1 = series(1);

    function draw(ctx, arr, label) {
      ctx.clearRect(0, 0, 420, 160);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(4, 4, 412, 152);
      arr.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = p.live ? '#1565c0' : '#ddd';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
      });
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#000';
      ctx.fillText(label, 12, 18);
    }

    /* Mount empty axes once; path grows in place each frame. */
    g0.innerHTML = '';
    g1.innerHTML = '';
    paintLivePlot(g0, 0, 0, scale0);
    paintLivePlot(g1, 1, 0, scale1);

    function tick(now) {
      var t = Math.min(TMAX, (now - t0) / 1000 * (prefersReduced ? 1000 : 12));
      var liveZ = Math.max(0, Math.round(N * conc(0, t) / A0));
      var liveF = Math.max(0, Math.round(N * conc(1, t) / A0));
      var zLive = z.filter(function (p) { return p.live; }).length;
      while (zLive > liveZ) {
        var cand = z.filter(function (p) { return p.live; });
        cand[cand.length - 1].live = false;
        zLive--;
      }
      var fLive = f.filter(function (p) { return p.live; }).length;
      while (fLive > liveF) {
        var cf = f.filter(function (p) { return p.live; });
        cf[cf.length - 1].live = false;
        fLive--;
      }
      draw(x0, z, 'ZERO  ·  ' + zLive);
      draw(x1, f, 'FIRST  ·  ' + fLive);
      paintLivePlot(g0, 0, t, scale0);
      paintLivePlot(g1, 1, t, scale1);
      if (t < TMAX && !prefersReduced) anim.raf = requestAnimationFrame(tick);
      else {
        paintLivePlot(g0, 0, TMAX, scale0);
        paintLivePlot(g1, 1, TMAX, scale1);
      }
    }
    if (prefersReduced) {
      z.forEach(function (p, i) { p.live = i < 8; });
      f.forEach(function (p, i) { p.live = i < 8; });
      draw(x0, z, 'ZERO');
      draw(x1, f, 'FIRST');
      paintLivePlot(g0, 0, TMAX, scale0);
      paintLivePlot(g1, 1, TMAX, scale1);
    } else requestAnimationFrame(tick);
  }

  function renderBridge() {
    els.kicker.textContent = 'C · 5.3.A.2 / 5.3.A.3';
    els.title.textContent = 'We can manipulate the data';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">Raw [A] vs t is curved for first and second order, so looking at the curve is only a hint, not a clean test.</span>' +
      '<span class="frame-line">We can change what we plot on the y-axis (a logarithm, or a reciprocal) and ask which version becomes a straight line.</span>' +
      '<strong class="frame-line">The transform that straightens the data names the order.</strong>';
    els.body.innerHTML =
      '<div class="viewport graph-paper" data-fig="FIG. C  ·  SAME RUN, RAW"><div class="viewport-body">' +
      svgPlot(series(1), 'raw', { graphPaper: true }) +
      '</div></div>';
  }

  function renderLin() {
    els.kicker.textContent = 'D · 5.3.A.2 / 5.3.A.3';
    els.title.textContent = 'Drag a transform onto the y-axis';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<strong class="frame-line student-q">Drag ln or 1/ onto the y-axis (or tap a chip). One transform will straighten the curve; the other will stay bent or bend the other way.</strong>';
    paintLin();
  }

  function paintLin() {
    var t = state.transform;
    var note = {
      raw: 'Still the raw curve. First-order [A] vs t falls exponentially, so it is not a straight line. Try a transform.',
      ln: 'Straight. For a first-order reaction, a plot of ln[A] versus time is linear. The slope of this line will be −k — we will read that next.',
      inv: 'Bent the other way. A plot of 1/[A] versus time is linear for <em>second</em> order, so it is the wrong test for this run. Reset, or try the other transform.'
    };
    els.body.innerHTML =
      '<div class="transform-tray">' +
      '<span class="chip" draggable="true" data-t="ln">ln</span>' +
      '<span class="chip" draggable="true" data-t="inv">1/</span>' +
      '<span class="chip" draggable="true" data-t="raw">[A] (reset)</span>' +
      '</div>' +
      '<div class="viewport graph-paper" data-fig="FIG. D  ·  Y-AXIS = ' + (t === 'ln' ? 'ln[A]' : t === 'inv' ? '1/[A]' : '[A]') + '" data-fig-case="preserve">' +
      '<div class="viewport-body">' +
      svgPlot(series(1), t, { graphPaper: true, yDrop: true }) +
      '<p class="callout ' + (t === 'ln' ? 'ok' : t === 'inv' ? 'bad' : '') + '">' + note[t] + '</p>' +
      '</div></div>';
    Array.prototype.forEach.call(els.body.querySelectorAll('.chip'), function (ch) {
      ch.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', ch.dataset.t); });
      ch.addEventListener('click', function () { state.transform = ch.dataset.t; paintLin(); });
    });
    var drop = $('yDrop');
    if (!drop) return;
    drop.addEventListener('dragover', function (e) {
      e.preventDefault();
      drop.classList.add('is-over');
    });
    drop.addEventListener('dragleave', function () { drop.classList.remove('is-over'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('is-over');
      state.transform = e.dataTransfer.getData('text/plain') || 'raw';
      paintLin();
    });
  }

  function renderSlope() {
    els.kicker.textContent = 'E · 5.3.A.4';
    els.title.textContent = 'Slope determines k';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">Once a plot is linear, it has a constant slope. That constant is the rate constant k — with a sign that depends on the order.</span>' +
      '<strong class="frame-line student-q">This is still your first-order ln[A] vs t line. Click two blue points. We will compute Δy/Δx and show how that slope relates to k.</strong>';
    var pts = series(1, 24);
    els.body.innerHTML =
      '<div class="viewport graph-paper" data-fig="FIG. E  ·  ln[A] VS t  ·  SLOPE −k" data-fig-case="preserve">' +
      '<div class="viewport-body" id="slopeHost">' + svgPlot(pts, 'ln', { graphPaper: true, dots: true }) +
      '<p id="slopeNote">Click two blue points on the line. Slope is rise over run: ' +
      stackedFrac('y<sub>2</sub> − y<sub>1</sub>', 't<sub>2</sub> − t<sub>1</sub>') + '.</p>' +
      '<div id="slopeWork" class="slope-work" hidden></div>' +
      '</div></div>';
    state.slopePts = [];
    var svg = els.body.querySelector('svg.plot');
    var geom = plotGeom(pts, 'ln', { axisTicks: true });

    function clearSlopeViz() {
      var old = svg.querySelector('#slopeViz');
      if (old) old.remove();
      Array.prototype.forEach.call(svg.querySelectorAll('circle.pt'), function (c) {
        c.setAttribute('r', '5');
      });
    }

    function paintSlopeViz(ia, ib) {
      clearSlopeViz();
      var p1 = pts[ia];
      var p2 = pts[ib];
      if (p1.t > p2.t) { var swap = p1; p1 = p2; p2 = swap; }
      var ya = yVal(p1, 'ln');
      var yb = yVal(p2, 'ln');
      var x1 = geom.x(p1.t);
      var y1 = geom.y(ya);
      var x2 = geom.x(p2.t);
      var y2 = geom.y(yb);
      var dLn = yb - ya;
      var dT = p2.t - p1.t;
      var slope = dLn / dT;
      var k = -slope;

      /* Rise/run: horizontal run at the higher point, vertical rise at the later time. */
      var runY = y1;
      var riseX = x2;
      var midRunX = (x1 + x2) / 2;
      var midRiseY = (y1 + y2) / 2;
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'slopeViz');
      g.innerHTML =
        '<line x1="' + x1.toFixed(1) + '" y1="' + runY.toFixed(1) + '" x2="' + x2.toFixed(1) +
        '" y2="' + runY.toFixed(1) + '" stroke="#1565c0" stroke-width="1.75" stroke-dasharray="5 4"/>' +
        '<line x1="' + riseX.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + riseX.toFixed(1) +
        '" y2="' + y2.toFixed(1) + '" stroke="#6b3fa0" stroke-width="1.75" stroke-dasharray="5 4"/>' +
        '<text x="' + midRunX.toFixed(1) + '" y="' + (runY - 8).toFixed(1) +
        '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10" font-weight="600" fill="#1565c0">Δt = ' +
        dT.toFixed(1) + ' s</text>' +
        '<text x="' + (riseX + 8).toFixed(1) + '" y="' + midRiseY.toFixed(1) +
        '" text-anchor="start" font-family="IBM Plex Mono,monospace" font-size="10" font-weight="600" fill="#6b3fa0">Δ ln[A] = ' +
        dLn.toFixed(3) + '</text>';
      svg.appendChild(g);

      Array.prototype.forEach.call(svg.querySelectorAll('circle.pt'), function (c) {
        var i = Number(c.dataset.i);
        if (i === ia || i === ib) c.setAttribute('r', '7');
      });

      $('slopeNote').innerHTML =
        'Rise over run: <span class="slope-calc">slope = ' +
        stackedFrac('Δ ln[A]', 'Δt') +
        ' <span class="eq-op">=</span> ' +
        stackedFrac(
          '(' + yb.toFixed(3) + ' − ' + ya.toFixed(3) + ')',
          '(' + p2.t.toFixed(1) + ' − ' + p1.t.toFixed(1) + ')'
        ) +
        ' <span class="eq-op">=</span> ' +
        stackedFrac(dLn.toFixed(3), dT.toFixed(1)) +
        ' <span class="eq-op">=</span> <strong>' + slope.toFixed(3) + ' s⁻¹</strong></span>';

      var work = $('slopeWork');
      work.hidden = false;
      work.innerHTML =
        '<p>We already know this run is first-order in A, so the differential rate law is:</p>' +
        '<p class="slope-eq"><span class="mono-inline">rate = k[A]<sup>1</sup></span></p>' +
        '<p>If we know it is first order, we can integrate that equation to get the integrated rate law:</p>' +
        '<p class="slope-eq"><span class="mono-inline">ln[A]<sub>t</sub> = (−k)t + ln[A]<sub>0</sub></span></p>' +
        '<p>Line those up with <span class="mono-inline">y = mx + b</span> — same positions, same roles. The coloured pieces match:</p>' +
        '<div class="eq-align slope-eq" aria-label="Aligned line equation and integrated rate law">' +
        '<div class="eq-row">' +
        '<span class="eq-y">y</span><span class="eq-op">=</span><span class="eq-m">m</span><span class="eq-x">x</span><span class="eq-op">+</span><span class="eq-b">b</span>' +
        '</div>' +
        '<div class="eq-row">' +
        '<span class="eq-y">ln[A]<sub>t</sub></span><span class="eq-op">=</span><span class="eq-m">(−k)</span><span class="eq-x">t</span><span class="eq-op">+</span><span class="eq-b">ln[A]<sub>0</sub></span>' +
        '</div>' +
        '<p class="eq-legend"><span class="eq-m">m</span> and <span class="eq-m">(−k)</span> are the same slot — the slope.</p>' +
        '</div>' +
        '<p>So on this graph, the slope <strong>is</strong> −k. Your rise-over-run gave <span class="mono-inline">m = ' +
        slope.toFixed(3) + ' s⁻¹</span>, therefore <span class="mono-inline">k = −m = ' + k.toFixed(3) +
        ' s⁻¹</span> (true k for this run: ' + K1.toFixed(3) + ' s⁻¹).</p>' +
        '<p class="callout"><strong>For this course, you do not need to know how to integrate the rate law.</strong> Once you have the proper graph (the one that is linear), the related integrated equation is available — and k lives in the slope.</p>';
    }

    Array.prototype.forEach.call(els.body.querySelectorAll('circle.pt'), function (c) {
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () {
        var i = Number(c.dataset.i);
        if (state.slopePts.indexOf(i) !== -1) return;
        if (state.slopePts.length === 2) {
          state.slopePts = [];
          clearSlopeViz();
          $('slopeWork').hidden = true;
          $('slopeWork').innerHTML = '';
          $('slopeNote').innerHTML = 'Click two blue points on the line. Slope is rise over run: ' +
            stackedFrac('y<sub>2</sub> − y<sub>1</sub>', 't<sub>2</sub> − t<sub>1</sub>') + '.';
        }
        state.slopePts.push(i);
        c.setAttribute('r', '7');
        if (state.slopePts.length === 2) {
          paintSlopeViz(state.slopePts[0], state.slopePts[1]);
        }
      });
    });
  }

  function renderIRL() {
    if (state.irlRow == null) state.irlRow = 1;
    els.kicker.textContent = 'F · 5.3.A.4';
    els.title.textContent = 'Order summaries';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">You already linearized a first-order run. Use this page as a quick reference: each order has its own linear graph, rate law, and slope story.</span>' +
      '<strong class="frame-line student-q">Click an order below. The graph and summary update together.</strong>';

    var ORDERS = [
      {
        o: 0,
        label: 'Zero-order',
        transform: 'raw',
        fig: 'FIG. F  ·  ZERO-ORDER  ·  [A] VS t',
        rate: 'rate = k',
        integrated: '[A]<sub>t</sub> = (−k)t + [A]<sub>0</sub>',
        axes: '[A] vs t',
        slope: 'm = −k',
        body:
          '<p>Zero order means the rate does <strong>not</strong> depend on how much reactant is left. As [A] falls, the rate stays the same — a constant decline.</p>' +
          '<p>On a raw <span class="mono-inline">[A] vs t</span> graph that shows up as a straight line already. No transform needed. The slope of that line is <span class="mono-inline">−k</span>.</p>' +
          '<p><strong>Key traits</strong></p>' +
          '<ul class="trait-list">' +
          '<li>Constant rate — does not change as [A] falls</li>' +
          '<li>Straight <span class="mono-inline">[A] vs t</span> already (no transform needed)</li>' +
          '<li>Common when a catalyst or surface is saturated, so the “working” amount does not change with concentration</li>' +
          '</ul>' +
          '<p><strong>In real life:</strong> many enzyme-catalyzed reactions at high substrate concentration, and some surface-catalyzed decompositions (for example ammonia on a metal surface when the surface is fully covered).</p>'
      },
      {
        o: 1,
        label: 'First-order',
        transform: 'ln',
        fig: 'FIG. F  ·  FIRST-ORDER  ·  ln[A] VS t',
        rate: 'rate = k[A]<sup>1</sup>',
        integrated: 'ln[A]<sub>t</sub> = (−k)t + ln[A]<sub>0</sub>',
        axes: 'ln[A] vs t',
        slope: 'm = −k',
        body:
          '<p>First order means the rate is proportional to the concentration of the reactant. As [A] drops, collisions become rarer and the rate slows — that is why raw [A] vs t curves downward.</p>' +
          '<p>When we graph <span class="mono-inline">ln[A] vs t</span>, that curve becomes a straight line (the integrated form). The slope of that line stays constant: <span class="mono-inline">m = −k</span>. So once the plot is linear, reading the slope gives you k.</p>' +
          '<p><strong>Key traits</strong></p>' +
          '<ul class="trait-list">' +
          '<li>Rate slows as [A] falls</li>' +
          '<li>Raw curve bends</li>' +
          '<li><span class="mono-inline">ln[A] vs t</span> is linear</li>' +
          '<li>Half-life is constant (same fraction gone in equal time intervals)</li>' +
          '</ul>' +
          '<p><strong>In real life:</strong> radioactive decay, many drug-elimination processes in the body, and the hydrolysis of some esters under excess water.</p>'
      },
      {
        o: 2,
        label: 'Second-order',
        transform: 'inv',
        fig: 'FIG. F  ·  SECOND-ORDER  ·  1/[A] VS t',
        rate: 'rate = k[A]<sup>2</sup>',
        integrated: stackedFrac('1', '[A]<sub>t</sub>') + ' = (+k)t + ' + stackedFrac('1', '[A]<sub>0</sub>'),
        axes: stackedFrac('1', '[A]') + ' vs t',
        slope: 'm = +k',
        body:
          '<p>Second order (in one reactant) means the rate depends on [A]<sup>2</sup>. As concentration falls, the rate slows even more sharply than first order — raw [A] vs t bends hard.</p>' +
          '<p>The transform that straightens it is <span class="mono-inline">' + stackedFrac('1', '[A]') + ' vs t</span>. That plot is a straight line with a <em>positive</em> slope: <span class="mono-inline">m = +k</span>. The reaction is still consuming A; the linearized y-axis just climbs as ' + stackedFrac('1', '[A]') + ' grows.</p>' +
          '<p><strong>Key traits</strong></p>' +
          '<ul class="trait-list">' +
          '<li>Strong concentration dependence</li>' +
          '<li>Raw curve bends more than first order</li>' +
          '<li><span class="mono-inline">' + stackedFrac('1', '[A]') + ' vs t</span> is linear</li>' +
          '<li>Half-life gets longer as [A] drops</li>' +
          '</ul>' +
          '<p><strong>In real life:</strong> some dimerization reactions, and classic gas-phase examples such as the decomposition of nitrogen dioxide (2 NO<sub>2</sub> → 2 NO + O<sub>2</sub>), which is second order in NO<sub>2</sub>.</p>'
      }
    ];
    var cur = ORDERS.filter(function (r) { return r.o === state.irlRow; })[0] || ORDERS[1];
    var tabs = ORDERS.map(function (r) {
      var pressed = r.o === cur.o ? 'true' : 'false';
      return '<button type="button" class="choice order-tab" data-o="' + r.o + '" aria-pressed="' + pressed + '">' + r.label + '</button>';
    }).join('');

    var pts = series(cur.o);
    var plotOpts = { axisTicks: true, tickGrid: true, noDrawAnim: true };
    var plots;
    if (cur.o === 0) {
      plots = svgPlot(pts, 'raw', plotOpts);
    } else {
      var linCap = cur.transform === 'ln'
        ? 'ln[A] VS t'
        : (stackedFrac('1', '[A]') + ' VS t');
      plots =
        '<div class="two-col order-plots">' +
        '<div class="order-plot-pane">' +
        '<div class="fig-cap">RAW  ·  [A] VS t</div>' +
        svgPlot(pts, 'raw', plotOpts) +
        '</div>' +
        '<div class="order-plot-pane">' +
        '<div class="fig-cap">INTEGRATED  ·  ' + linCap + '</div>' +
        svgPlot(pts, cur.transform, plotOpts) +
        '</div></div>';
    }

    var figTitle = cur.o === 0
      ? cur.fig
      : (cur.o === 1
        ? 'FIG. F  ·  FIRST-ORDER  ·  RAW + ln[A]'
        : 'FIG. F  ·  SECOND-ORDER  ·  RAW + 1/[A]');

    els.body.innerHTML =
      '<div class="order-tab-row">' + tabs + '</div>' +
      '<div class="viewport" data-fig="' + figTitle + '" data-fig-case="preserve">' +
      '<div class="viewport-body" id="irlHost">' +
      plots +
      '<div class="order-summary-card">' +
      '<p class="order-meta"><span class="mono-inline">' + cur.rate + '</span>' +
      ' &nbsp;·&nbsp; linear plot <span class="mono-inline">' + cur.axes + '</span>' +
      ' &nbsp;·&nbsp; <span class="mono-inline">' + cur.integrated + '</span>' +
      ' &nbsp;·&nbsp; <span class="mono-inline">' + cur.slope + '</span></p>' +
      cur.body +
      '</div></div></div>';

    Array.prototype.forEach.call(els.body.querySelectorAll('.order-tab'), function (btn) {
      btn.addEventListener('click', function () {
        state.irlRow = Number(btn.dataset.o);
        renderIRL();
      });
    });
  }

  function csvFor(order, name) {
    var k = order === 0 ? 0.010 : order === 1 ? 0.014 : 0.030;
    var a0 = 0.80;
    var lines = ['t_s,' + name];
    for (var t = 0; t <= 120; t += 15) {
      var A;
      if (order === 0) A = Math.max(0.05, a0 - k * t);
      else if (order === 1) A = a0 * Math.exp(-k * t);
      else A = a0 / (1 + k * a0 * t);
      lines.push(t + ',' + A.toFixed(4));
    }
    return lines.join('\n');
  }

  var SHEETS = [
    { id: 'z', name: 'A_M', order: 0, title: 'Run Z — unknown order', law: 'rate = k', file: 'Run z.csv' },
    { id: 'br', name: 'Br2_M', order: 1, title: 'Br₂ + HCOOH → products', law: 'rate = k[Br₂]', file: 'Br2 + HCOOH.csv' },
    { id: 's', name: 'A_M', order: 2, title: 'Run S — unknown order', law: 'rate = k[A]²', file: 'Run S.csv' }
  ];

  function downloadCSV(text, filename) {
    var blob = new Blob([text], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function renderSheets() {
    els.kicker.textContent = 'G · Spreadsheet';
    els.title.textContent = 'Do it in Google Sheets';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">Now you are going to try it in Google Sheets yourself. Using data to figure out if it is zero, first, or second order is an important step for the lab we will conduct together. These are great practice problems to get you started.</span>';
    var summary =
      '<div class="viewport" data-fig="SUMMARY  ·  ORDERS AT A GLANCE">' +
      '<div class="viewport-body sheets-summary">' +
      '<p>From the last screen: once you know the order, the differential rate law is set. For a reactant that is first order, that is <span class="mono-inline">rate = k[A]</span>. If we know the order, we can integrate to get the integrated rate law — already in the form of a straight line <span class="mono-inline">y = mx + b</span>, with <strong>k sitting in the slope m</strong>.</p>' +
      '<p class="callout"><strong>For this course, you do not need to know how to integrate the rate law.</strong> Once you have the proper graph (the one that is linear), the related equation is available — and k lives in the slope.</p>' +
      '<p>The straight-line graph for each order, and the axes that make it straight:</p>' +
      '<table class="lab-table order-summary">' +
      '<thead><tr><th>Order</th><th>Linear graph</th><th>Axes</th><th>Integrated rate law</th><th>Slope m</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>0</td><td>straight decline</td><td><span class="mono-inline">[A] vs t</span></td><td><span class="mono-inline">[A]<sub>t</sub> = (−k)t + [A]<sub>0</sub></span></td><td><span class="mono-inline">m = −k</span></td></tr>' +
      '<tr><td>1</td><td>straight line</td><td><span class="mono-inline">ln[A] vs t</span></td><td><span class="mono-inline">ln[A]<sub>t</sub> = (−k)t + ln[A]<sub>0</sub></span></td><td><span class="mono-inline">m = −k</span></td></tr>' +
      '<tr><td>2</td><td>straight line</td><td><span class="mono-inline">1/[A] vs t</span></td><td><span class="mono-inline">1/[A]<sub>t</sub> = (+k)t + 1/[A]<sub>0</sub></span></td><td><span class="mono-inline">m = +k</span></td></tr>' +
      '</tbody></table>' +
      '<p>Raw <span class="mono-inline">[A] vs t</span> is already straight only for zero order. For first and second order that raw curve bends — you transform the y-axis until one plot goes linear. That straight one names the order. Download a CSV below, build all three scatter plots in Sheets, and write the differential rate law with k as a symbol.</p>' +
      '</div></div>';
    var cards = SHEETS.map(function (s) {
      return '<div class="viewport" data-fig="' + s.title + '"><div class="viewport-body">' +
        '<button type="button" class="btn" data-dl="' + s.id + '">Download CSV</button>' +
        '<p>Find the straight plot, then write the rate law.</p>' +
        '<input class="rate-input" style="width:12rem" data-law="' + s.id + '" placeholder="rate = …" aria-label="Rate law for ' + s.title + '">' +
        '<button type="button" class="btn submit" data-check="' + s.id + '">Check</button>' +
        '<p class="guess-feedback" id="fb-' + s.id + '"></p></div></div>';
    }).join('');
    els.body.innerHTML = summary + cards +
      '<div class="viewport" data-fig="FIG. G  ·  LIGHT CHECKLIST"><div class="viewport-body">' +
      '<p>If you need the menus again:</p>' +
      '<ul class="checklist">' +
      '<li><label><input type="checkbox"> Add a column: =LN(B2), fill down</label></li>' +
      '<li><label><input type="checkbox"> Add a column: =1/B2, fill down</label></li>' +
      '<li><label><input type="checkbox"> Insert → Chart → Scatter for raw, ln, and 1/[A]</label></li>' +
      '<li><label><input type="checkbox"> Trendline + equation + R² on each</label></li>' +
      '<li><label><input type="checkbox"> The visually straight one wins — write that rate law</label></li>' +
      '</ul>' +
      '<button type="button" class="btn ghost" id="showWorked">Stuck? Reveal a worked version</button>' +
      '<div class="worked" id="worked" hidden>' +
      '<p>Run Z: [A] vs t is already straight, so the reaction is zero order. The rate law is rate = k — [A] does not appear.</p>' +
      '<p>Br₂ + HCOOH: ln[Br₂] vs t is straight, so first order. rate = k[Br₂]. This is a known first-order time course, reserved for graphing on purpose.</p>' +
      '<p>Run S: 1/[A] vs t is straight, so second order. rate = k[A]², not 2k[A] — the 2 is an exponent, not a coefficient in front of k.</p>' +
      '</div></div></div>';
    Array.prototype.forEach.call(els.body.querySelectorAll('[data-dl]'), function (btn) {
      btn.addEventListener('click', function () {
        var s = SHEETS.filter(function (x) { return x.id === btn.dataset.dl; })[0];
        downloadCSV(csvFor(s.order, s.name), s.file);
      });
    });
    Array.prototype.forEach.call(els.body.querySelectorAll('[data-check]'), function (btn) {
      btn.addEventListener('click', function () {
        var s = SHEETS.filter(function (x) { return x.id === btn.dataset.check; })[0];
        var val = (els.body.querySelector('[data-law="' + s.id + '"]').value || '').replace(/\s+/g, '').toLowerCase();
        var fb = $('fb-' + s.id);
        var ok = false;
        if (s.order === 0) ok = /rate=k$/.test(val) || /rate=k\[a\]\^0/.test(val);
        if (s.order === 1) ok = /rate=k\[(a|br2|br₂)\]$/.test(val);
        if (s.order === 2) ok = /rate=k\[a\](\^2|²)$/.test(val);
        if (/2k/.test(val)) ok = false;
        fb.className = 'guess-feedback teach-fb ' + (ok ? 'is-match' : 'is-miss');
        fb.innerHTML = ok
          ? 'That is the rate law — order from the straight plot, written as a differential expression.'
          : 'Write the differential rate law from the straight plot. Order 2 is k[A]², not 2k[A]. Zero order is rate = k, with [A] absent.';
      });
    });
    $('showWorked').addEventListener('click', function () {
      $('worked').hidden = !$('worked').hidden;
    });
  }

  function stackedFrac(num, den) {
    return '<span class="iso-frac" aria-label="' + String(num).replace(/<[^>]+>/g, '') + ' over ' + String(den).replace(/<[^>]+>/g, '') + '">' +
      '<span class="iso-frac-num">' + num + '</span>' +
      '<span class="iso-frac-bar" aria-hidden="true"></span>' +
      '<span class="iso-frac-den">' + den + '</span>' +
      '</span>';
  }

  function timeForConc(order, A) {
    if (order === 0) return (A0 - A) / K0;
    if (order === 1) return Math.log(A0 / Math.max(A, 1e-9)) / K1;
    return (1 / Math.max(A, 1e-9) - 1 / A0) / K2;
  }

  function halfLifeTargets(order, tmax) {
    tmax = tmax == null ? TMAX : tmax;
    var out = [{ A: A0, t: 0 }];
    var A = A0;
    while (out.length < 5) {
      A = A / 2;
      if (A < 0.06) break;
      var t = timeForConc(order, A);
      if (t > tmax - 0.5) break;
      out.push({ A: A, t: t });
    }
    return out;
  }

  /* Dense candidates on the curve so half-life marks must be chosen, not spotted as the only dots. */
  function halfLifeCandidates(order, tmax) {
    var targets = halfLifeTargets(order, tmax);
    var pts = [];
    var seen = {};

    function add(A, halfStep) {
      var key = (Math.round(A * 1e4) / 1e4).toFixed(4);
      if (seen[key] != null) {
        if (halfStep >= 0) pts[seen[key]].halfStep = halfStep;
        return;
      }
      var t = timeForConc(order, A);
      if (!(t >= -1e-9) || t > tmax + 1e-6 || A < 0.05) return;
      seen[key] = pts.length;
      pts.push({ A: A, t: Math.max(0, t), halfStep: halfStep });
    }

    var fracs = [
      1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55,
      0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.175, 0.15, 0.125, 0.1, 0.08
    ];
    fracs.forEach(function (f) { add(A0 * f, -1); });
    targets.forEach(function (tg, i) { add(tg.A, i); });
    pts.sort(function (a, b) { return a.t - b.t; });
    return { candidates: pts, targets: targets };
  }

  function renderHL() {
    var ORDERS = [
      {
        order: 0,
        name: 'Zero-order',
        frame: '<span class="frame-line">Half-life is the time for concentration to fall to half of whatever you just had — not always half of the original start.</span><strong class="frame-line student-q">The curve is crowded with small points. Click them in order to mark each half-life — start at [A]<sub>0</sub>, then find half of that, then half again. Wrong points stay unmarked; watch whether the time gaps shrink, stay the same, or grow.</strong>',
        formulaHtml: 't<sub>½</sub> = ' + stackedFrac('[A]<sub>0</sub>', '2k'),
        why: 'Zero-order rate does not depend on [A] — the reaction burns at a constant pace. Clearing half of a smaller pile at that same pace takes less time, so successive half-lives get shorter as concentration falls.',
        apNote: ''
      },
      {
        order: 1,
        name: 'First-order',
        frame: '<span class="frame-line">Same hunt, first-order this time: find the points where half of the previous mark remains.</span><span class="frame-line">First-order half-life is the one AP tests: it is constant, and t<sub>½</sub> = 0.693/k. Radioactive decay is the usual illustration.</span>',
        formulaHtml: 't<sub>½</sub> = ' + stackedFrac('0.693', 'k'),
        why: 'First-order rate is proportional to [A]. When concentration halves, the reaction slows by the same factor — so the time to lose another half stays the same no matter how much is left.',
        apNote: 'Radioactive decay is first-order for the same reason: constant t<sub>½</sub>.'
      },
      {
        order: 2,
        name: 'Second-order',
        frame: '<span class="frame-line">Last contrast: second order. Find successive half-marks among the points and watch the spacing.</span><span class="frame-line">AP will not ask you to compute a second-order half-life. The point is to make first-order’s constancy look like a fact, not a slogan.</span>',
        formulaHtml: 't<sub>½</sub> = ' + stackedFrac('1', 'k[A]<sub>0</sub>'),
        why: 'Second-order rate depends on [A]<sup>2</sup>. Halving concentration cuts the rate to one-fourth, so the reaction is much slower at low [A] and each successive half-life takes longer.',
        apNote: ''
      }
    ];
    if (state.hl.order == null) state.hl.order = 0;
    if (!state.hl.picked) state.hl.picked = {};
    var r = ORDERS.filter(function (o) { return o.order === state.hl.order; })[0] || ORDERS[0];
    /* Second-order half-lives stretch out — give the axis enough room for 2–3 intervals. */
    var tmax = r.order === 2 ? 200 : TMAX;
    var pack = halfLifeCandidates(r.order, tmax);
    var targets = pack.targets;
    var candidates = pack.candidates;
    if (!state.hl.picked[r.order]) state.hl.picked[r.order] = [];
    var picked = state.hl.picked[r.order];

    els.kicker.textContent = 'H · 5.3.A.5' + (r.order === 1 ? ' / 5.3.A.6' : '');
    els.title.textContent = 'Click when half remains';
    els.frame.className = 'framing';
    els.frame.innerHTML = r.frame;

    var tabs = ORDERS.map(function (o) {
      var pressed = o.order === r.order ? 'true' : 'false';
      return '<button type="button" class="choice order-tab" data-o="' + o.order + '" aria-pressed="' + pressed + '">' + o.name + '</button>';
    }).join('');

    var pts = seriesTo(r.order, tmax);
    var plotOpts = { axisTicks: true, tickGrid: true, noDrawAnim: true, tmax: tmax };
    var geom = plotGeom(pts, 'raw', plotOpts);

    els.body.innerHTML =
      '<div class="order-tab-row">' + tabs + '</div>' +
      '<div class="viewport" data-fig="FIG. H  ·  ' + r.name.toUpperCase() + '">' +
      '<div class="viewport-body" id="hlHost">' +
      svgPlot(pts, 'raw', plotOpts) +
      '<p id="hlPrompt" class="hl-prompt"></p>' +
      '<p id="hlMiss" class="hl-miss" hidden></p>' +
      '<p id="hlNote" class="hl-note"></p>' +
      '<div class="hl-teach" id="hlTeach" hidden>' +
      '<p class="hl-formula">' + r.formulaHtml + '</p>' +
      '<p class="hl-why">' + r.why + '</p>' +
      (r.apNote ? '<p class="callout">' + r.apNote + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn ghost" id="hlReset">Reset marks</button>' +
      '</div></div>';

    var svg = els.body.querySelector('svg.plot');
    var nextI = picked.length;
    var missEl = $('hlMiss');
    var teachEl = $('hlTeach');

    function timeBetween(a, b) {
      return Math.abs(b.t - a.t);
    }

    function clearMiss() {
      missEl.hidden = true;
      missEl.textContent = '';
    }

    function showMiss(html) {
      missEl.hidden = false;
      missEl.innerHTML = html;
    }

    function paintHL() {
      var old = svg.querySelector('#hlMarks');
      if (old) old.remove();
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'hlMarks');
      var html = '';
      var intervals = [];
      var pickedSet = {};
      picked.forEach(function (step) { pickedSet[step] = true; });

      candidates.forEach(function (pt, ci) {
        var cx = geom.x(pt.t);
        var cy = geom.y(pt.A);
        var done = pt.halfStep >= 0 && pickedSet[pt.halfStep];
        var fill = done ? '#1565c0' : '#fff';
        var stroke = done ? '#1565c0' : '#7a9cc4';
        var rDot = done ? 4 : 2.75;
        /* Invisible hit target keeps small dots usable. */
        html += '<circle class="hl-hit" data-ci="' + ci + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
          '" r="9" fill="transparent" stroke="none" style="cursor:pointer"/>';
        html += '<circle class="hl-pt" data-ci="' + ci + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
          '" r="' + rDot + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.25" style="pointer-events:none"/>';
        if (done) {
          html += '<line x1="' + cx.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + cx.toFixed(1) +
            '" y2="' + (geom.H - geom.p.b).toFixed(1) + '" stroke="#1565c0" stroke-width="1.25" stroke-dasharray="4 3"/>';
          html += '<line x1="' + geom.p.l.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + cx.toFixed(1) +
            '" y2="' + cy.toFixed(1) + '" stroke="#6b3fa0" stroke-width="1.25" stroke-dasharray="4 3"/>';
        }
      });
      for (var j = 1; j < picked.length; j++) {
        var a = targets[picked[j - 1]];
        var b = targets[picked[j]];
        var dt = timeBetween(a, b);
        intervals.push(dt);
        var mx = (geom.x(a.t) + geom.x(b.t)) / 2;
        var my = Math.min(geom.y(a.A), geom.y(b.A)) - 14;
        html += '<text x="' + mx.toFixed(1) + '" y="' + my.toFixed(1) +
          '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" font-weight="600" fill="#8a5a00">Δt = ' +
          dt.toFixed(1) + ' s</text>';
      }
      g.innerHTML = html;
      svg.appendChild(g);

      var prompt = $('hlPrompt');
      if (nextI >= targets.length) {
        prompt.innerHTML = 'All half-life marks placed for this order. Switch tabs to compare, or reset to try again.';
      } else if (nextI === 0) {
        prompt.innerHTML = 'Click the starting point — concentration <span class="mono-inline">[A]<sub>0</sub> = ' +
          A0.toFixed(2) + '</span> at t = 0.';
      } else {
        prompt.textContent = 'Now find the next half life, take note of how long it takes. Continue until you run out of points';
      }

      var note = $('hlNote');
      if (intervals.length === 0) {
        note.textContent = 'No half-life intervals yet. Each pair of consecutive correct marks is one half-life; the time between them will appear on the graph.';
      } else {
        note.innerHTML = 'Time between half-lives: <span class="mono-inline">' +
          intervals.map(function (d) { return d.toFixed(1) + ' s'; }).join(' → ') +
          '</span>' +
          (intervals.length >= 2
            ? (r.order === 0 ? ' (shrinking)' : r.order === 1 ? ' (constant)' : ' (growing)')
            : ' — pick the next half to compare.');
      }

      /* Formula + why: only after two half-life intervals so the pattern is earned first. */
      if (intervals.length >= 2) {
        if (teachEl.hidden) {
          teachEl.hidden = false;
          if (!prefersReduced) {
            teachEl.classList.remove('is-revealed');
            /* Force reflow so the reveal transition runs when unhiding. */
            void teachEl.offsetWidth;
            teachEl.classList.add('is-revealed');
          } else {
            teachEl.classList.add('is-revealed');
          }
        }
      } else {
        teachEl.hidden = true;
        teachEl.classList.remove('is-revealed');
      }

      Array.prototype.forEach.call(svg.querySelectorAll('circle.hl-hit'), function (c) {
        c.addEventListener('click', function () {
          if (nextI >= targets.length) return;
          var ci = Number(c.dataset.ci);
          var pt = candidates[ci];
          if (pt.halfStep >= 0 && pickedSet[pt.halfStep]) return;
          if (pt.halfStep === nextI) {
            clearMiss();
            picked.push(nextI);
            nextI = picked.length;
            paintHL();
            return;
          }
          if (nextI === 0) {
            showMiss('That is not the start. Look for <span class="mono-inline">[A]<sub>0</sub> = ' +
              A0.toFixed(2) + ' M</span> at the left edge of the curve (t = 0).');
            return;
          }
          var need = targets[nextI];
          showMiss('Not half of the last mark. You clicked <span class="mono-inline">' +
            pt.A.toFixed(2) + ' M</span>; from <span class="mono-inline">' +
            targets[nextI - 1].A.toFixed(2) + ' M</span> you need <span class="mono-inline">' +
            need.A.toFixed(2) + ' M</span>.');
        });
      });
    }

    paintHL();

    Array.prototype.forEach.call(els.body.querySelectorAll('.order-tab'), function (btn) {
      btn.addEventListener('click', function () {
        state.hl.order = Number(btn.dataset.o);
        renderHL();
      });
    });
    $('hlReset').addEventListener('click', function () {
      state.hl.picked[r.order] = [];
      renderHL();
    });
  }

  function renderSummary() {
    els.kicker.textContent = 'Summary · 5.3.A';
    els.title.textContent = 'Final Section Review';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">Order comes from which graph straightens. k is now a value you can read from that slope — the same k whose units you found from overall order in Part A.</span>';
    els.body.innerHTML =
      '<div class="two-col">' +
      '<div class="viewport" data-fig="5.2.A  ·  INITIAL RATES"><div class="viewport-body">' +
      '<p>Many trials, different starting concentrations, compared by ratio. The result is a differential rate law. Units of k come from the overall order — the sum of the exponents.</p>' +
      '</div></div>' +
      '<div class="viewport graph-paper" data-fig="5.3.A  ·  OVER TIME"><div class="viewport-body">' +
      '<p>One trial over time. Transform [A] to ln[A] or 1/[A] until the plot is straight; that names the order. The slope of that line is ±k. First-order t<sub>½</sub> = 0.693/k.</p>' +
      '</div></div>' +
      '</div>' +
      '<p class="callout ok">Only first-order half-life is tested. Radioactive decay is first-order — constant t<sub>½</sub>, same math as the curve you just timed. Zero- and second-order spacing were contrast, not exam items.</p>';
  }

  function finishPartB() {
    SuiteChrome.revealDebrief(DEBRIEF, {
      exclusive: true,
      onRevisit: function (target) {
        SuiteChrome.leaveDebriefStage();
        els.footer.hidden = false;
        var map = { lin: 3, slope: 4, halflife: 7, side: 1, decay: 7, '5.3.A.1': 1, '5.3.A.2': 3, '5.3.A.3': 3, '5.3.A.4': 4, '5.3.A.5': 7, '5.3.A.6': 7 };
        if (target === 'decay' || target === '5.3.A.6') state.hl.order = 1;
        state.step = map[target] != null ? map[target] : 0;
        showStep();
      }
    });
    els.footer.hidden = true;
  }

  function showStep() {
    cancelAnimationFrame(anim.raf);
    var id = STEPS[state.step];
    els.helpText.textContent = HELP[id] || '';
    els.helpPanel.classList.remove('open');
    els.stuckBtn.hidden = !HELP[id];
    els.nextBtn.hidden = false;
    els.nextBtn.textContent = id === 'summary' ? 'What this was for →' : 'Next →';
    paintTiers();
    ({
      review: renderReview,
      side: renderSide,
      bridge: renderBridge,
      lin: renderLin,
      slope: renderSlope,
      irl: renderIRL,
      sheets: renderSheets,
      halflife: renderHL,
      summary: renderSummary
    })[id]();
  }

  function init() {
    els.kicker = $('stepKicker');
    els.title = $('stepTitle');
    els.frame = $('stepFrame');
    els.body = $('stepBody');
    els.tierRow = $('tierRow');
    els.helpPanel = $('helpPanel');
    els.helpText = $('helpText');
    els.stuckBtn = $('stuckBtn');
    els.backBtn = $('backBtn');
    els.nextBtn = $('nextBtn');
    els.footer = $('moduleFooter');
    SuiteChrome.renderBriefing(DEBRIEF);
    SuiteChrome.wireStuckHelp();
    $('briefingNext').addEventListener('click', function () {
      $('briefing').hidden = true;
      $('moduleStage').hidden = false;
      showStep();
    });
    els.backBtn.addEventListener('click', function () {
      if (state.step === 0) {
        $('moduleStage').hidden = true;
        $('briefing').hidden = false;
        return;
      }
      state.step--;
      els.footer.hidden = false;
      showStep();
    });
    els.nextBtn.addEventListener('click', function () {
      if (STEPS[state.step] === 'summary') {
        finishPartB();
        return;
      }
      if (state.step < STEPS.length - 1) {
        state.step++;
        showStep();
      }
    });
  }
  init();
})();
