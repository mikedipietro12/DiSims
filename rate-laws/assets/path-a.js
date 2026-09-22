/* Path A — Method of Initial Rates */
(function () {
  'use strict';

  var DEBRIEF = {
    intentions: [
      { text: 'Represent experimental data with a consistent rate law expression.', target: 'isolation', revisit: '5.2.A isolate the orders' }
    ],
    essentialKnowledge: [
      { code: '5.2.A.1', name: '5.2.A.1', text: 'Experimental methods can be used to monitor the amounts of reactants and/or products of a reaction over time and to determine the rate of the reaction.', target: 'molecular', revisit: 'Particle density' },
      { code: '5.2.A.2', name: '5.2.A.2', text: 'The rate law expresses the rate of a reaction as proportional to the concentration of each reactant raised to a power.', target: 'ratelaw', revisit: 'The rate law' },
      { code: '5.2.A.3', name: '5.2.A.3', text: 'The power of each reactant in the rate law is the order of the reaction with respect to that reactant. The sum of the powers of the reactant concentrations in the rate law is the overall order of the reaction.', target: 'warmup', revisit: 'Ratio → exponent' },
      { code: '5.2.A.4', name: '5.2.A.4', text: 'The proportionality constant in the rate law is called the rate constant. The value of this constant is temperature dependent and the units reflect the overall reaction order.', target: 'kunits', revisit: 'Units of k' },
      { code: '5.2.A.5', name: '5.2.A.5', text: 'Comparing initial rates of a reaction is a method to determine the order with respect to each reactant.', target: 'isolation', revisit: 'Trial selection' }
    ],
    competencies: [
      { code: 'Q&P', name: 'Questioning and predicting', text: 'I can predict how changing a reactant’s initial concentration will affect the initial rate, then check my prediction against measured data.', target: 'hook', revisit: 'Predict the rate' },
      { code: 'PC', name: 'Planning and conducting', text: 'I can select pairs of trials that isolate one reactant by holding every other concentration constant.', target: 'isolation', revisit: 'Trial selection' },
      { code: 'PAI', name: 'Processing and analyzing data and information', text: 'I can determine the order with respect to each reactant from how the rate scales with concentration, and write a consistent differential rate law.', target: 'warmup', revisit: 'Ratio → exponent' },
      { code: 'E', name: 'Evaluating', text: 'I can recognize when a trial pair changes more than one concentration at once and explain why that comparison cannot determine an order.', target: 'isolation', revisit: 'Trial selection' },
      { code: 'C', name: 'Communicating', text: 'I can state the units of the rate constant from the overall reaction order (the sum of the exponents), not from a single reactant.', target: 'kunits', revisit: 'Units of k' }
    ]
  };

  var STEPS = ['hook', 'molecular', 'ratelaw', 'warmup', 'isolation', 'predict', 'kunits', 'practice', 'summary', 'gate'];
  var HELP = {
    hook: 'Commit a prediction first. The measured result only appears after you choose.',
    molecular: 'Watch collision count as density changes. More particles in the same volume means more collisions.',
    ratelaw: 'Click a row. The matching piece of the law lights up — that is where the value sits in the equation.',
    warmup: 'Write the rate ratio as (concentration ratio) raised to the order. The data are clean powers: if concentration doubles and the rate quadruples, the order is 2, because 2² = 4.',
    isolation: 'Click two rows. You want exactly one concentration different and every other column identical. If two concentrations change, the rate shift could come from either reactant — you isolated nothing, so pick again.',
    predict: 'Rearrange one measured trial to get k, then plug the new concentrations into the rate law. The prediction is the point of having a law — guess the rate, then reveal.',
    kunits: 'Drag a concentration unit from the numerator onto a matching unit in the denominator to cancel. The leftover M stays below the bar on purpose; that denominator is what becomes M⁻¹. Units come from the sum of the exponents, not from one reactant.',
    practice: 'Same method as before: pick a pair that isolates each reactant, read the exponent from how the rate scaled, then write the differential rate law. If two things changed, that pair taught you nothing.',
    summary: 'Initial rates compares many trials at different starting concentrations, by ratio, and gives a differential rate law. Graphing tracks one trial over time and straightens the curve. Same job, different tool.',
    gate: 'Compare trials. What changed, and what did the rate do? Units of k come from the overall order — add the exponents. Hints point at the method, never at the answer.'
  };

  var els = {};
  var state = {
    step: 0,
    hookChoice: null,
    hookRevealed: false,
    warmupOrder: null,
    warmupRevealed: false,
    isoSelected: [],
    isoOrders: {},
    predictVal: null,
    predictRevealed: false,
    unitsDone: false,
    practiceIndex: 0,
    practiceDone: {},
    gateMisses: 0,
    gateHint: 0
  };

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var molAnim = { raf: 0, t: 0 };
  var hookAnim = { raf: 0 };
  var isoRo = null;

  function $(id) { return document.getElementById(id); }

  function beakerGeomAt(cx, r) {
    r = r == null ? 6 : r;
    var lipW = 200, bodyW = 168, topY = 14, bottomY = 236, flareH = 16;
    var left = cx - bodyW / 2, right = cx + bodyW / 2;
    var liquidTop = topY + flareH + (bottomY - topY - flareH) * 0.22;
    return {
      cx: cx, lipW: lipW, bodyW: bodyW, topY: topY, bottomY: bottomY, flareH: flareH,
      left: left, right: right, liquidTop: liquidTop,
      x0: left + r + 3, x1: right - r - 3, y0: liquidTop + r + 2, y1: bottomY - r - 4
    };
  }

  function strokeBeaker(ctx, g) {
    var lipL = g.cx - g.lipW / 2, lipR = g.cx + g.lipW / 2;
    var spout = 12;
    ctx.beginPath();
    ctx.moveTo(lipL, g.topY);
    ctx.lineTo(g.left, g.topY + g.flareH);
    ctx.lineTo(g.left, g.bottomY);
    ctx.lineTo(g.right, g.bottomY);
    ctx.lineTo(g.right, g.topY + g.flareH);
    ctx.lineTo(lipR + spout, g.topY + 7);
    ctx.lineTo(lipR, g.topY);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(g.left, g.liquidTop);
    ctx.lineTo(g.left, g.bottomY);
    ctx.lineTo(g.right, g.bottomY);
    ctx.lineTo(g.right, g.liquidTop);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#f4f7fb';
    ctx.fillRect(g.left, g.liquidTop, g.bodyW, g.bottomY - g.liquidTop);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(g.left + 1, g.liquidTop);
    ctx.lineTo(g.right - 1, g.liquidTop);
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    for (var i = 0; i < 4; i++) {
      var ty = g.bottomY - 28 - i * 32;
      if (ty < g.topY + g.flareH + 8) continue;
      ctx.beginPath();
      ctx.moveTo(g.left, ty);
      ctx.lineTo(g.left + 12, ty);
      ctx.stroke();
    }
  }

  function fmt(n) {
    if (n >= 0.01) return String(n);
    return n.toExponential(2).replace('e-', '×10⁻').replace('e+', '×10').replace('e', '×10');
  }

  function htmlRate(n) {
    return RateData.fmtRate(n);
  }

  function tableHTML(ds, opts) {
    opts = opts || {};
    var sel = opts.selected || [];
    var highlight = opts.highlight || null;
    var h = '<table class="lab-table"><thead><tr><th>Exp</th>';
    ds.reactants.forEach(function (r) { h += '<th class="chem">' + r.label + '</th>'; });
    h += '<th>Initial rate (' + ds.rateUnit + ')</th></tr></thead><tbody>';
    ds.trials.forEach(function (t, i) {
      var cls = 'clickable';
      var isSel = sel.indexOf(i) !== -1;
      if (isSel) cls += ' selected';
      h += '<tr class="' + cls + '" data-i="' + i + '"><td>' + t.exp + '</td>';
      ds.reactants.forEach(function (r) {
        var cell = '';
        if (highlight && isSel) {
          if (highlight.held.some(function (x) { return x.key === r.key; })) cell = 'held';
          if (highlight.changed.some(function (x) { return x.key === r.key; })) cell = highlight.clean ? 'varied' : 'bad';
        }
        h += '<td class="' + cell + '" data-col="' + r.key + '">' + t.conc[r.key] + '</td>';
      });
      var rateCls = '';
      if (highlight && isSel) rateCls = highlight.clean ? 'response' : 'bad';
      h += '<td class="' + rateCls + '" data-col="rate">' + htmlRate(t.rate) + '</td></tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function isoTableBlock(ds, opts) {
    return '<div class="iso-table-wrap">' + tableHTML(ds, opts) +
      '<svg class="iso-overlay" aria-hidden="true"></svg></div>';
  }

  function pairOrder(selected) {
    return selected.slice().sort(function (a, b) { return a - b; });
  }

  function orderLetter(ds, key) {
    var i = 0;
    for (; i < ds.reactants.length; i++) {
      if (ds.reactants[i].key === key) return String.fromCharCode(120 + i);
    }
    return 'n';
  }

  function fmtTimes(n) {
    if (!isFinite(n) || n === 0) return '';
    var inv = 1 / n;
    var fracs = { 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 8: '⅛' };
    if (Math.abs(n - Math.round(n)) < 1e-6 && n >= 1) return '×' + Math.round(n);
    if (Math.abs(inv - Math.round(inv)) < 1e-6 && inv >= 2) {
      var k = Math.round(inv);
      return '×' + (fracs[k] || ('1/' + k));
    }
    return '×' + (Math.round(n * 100) / 100);
  }

  function stackedFrac(num, den) {
    return '<span class="iso-frac" aria-label="' + String(num).replace(/<[^>]+>/g, '') + ' over ' + String(den).replace(/<[^>]+>/g, '') + '">' +
      '<span class="iso-frac-num">' + num + '</span>' +
      '<span class="iso-frac-bar" aria-hidden="true"></span>' +
      '<span class="iso-frac-den">' + den + '</span>' +
      '</span>';
  }

  function scalePhrase(ratio, asVerb) {
    if (Math.abs(ratio - 2) < 1e-6) return asVerb ? 'doubles' : 'doubled';
    if (Math.abs(ratio - 3) < 1e-6) return asVerb ? 'triples' : 'tripled';
    if (Math.abs(ratio - 4) < 1e-6) return asVerb ? 'quadruples' : 'quadrupled';
    if (Math.abs(ratio - 0.5) < 1e-6) return asVerb ? 'halves' : 'halved';
    return asVerb ? ('changes by ' + fmtTimes(ratio)) : ('changed by ' + fmtTimes(ratio));
  }

  function orderWords(n) {
    if (n === 1) return 'first order';
    if (n === 2) return 'second order';
    if (n === 3) return 'third order';
    return 'order ' + n;
  }

  function liveLawHTML(ds, found, focusKey) {
    return 'rate = k' + ds.reactants.map(function (r) {
      var known = found[r.key] != null;
      var exp = known ? found[r.key] : orderLetter(ds, r.key);
      var cls = r.key === focusKey ? 'iso-focus' : (known ? 'iso-known' : '');
      return r.label + '<sup class="' + cls + '">' + exp + '</sup>';
    }).join('');
  }

  function isoDeriveHTML(ds, highlight, selected, found) {
    var rows = pairOrder(selected);
    var top = ds.trials[rows[0]];
    var bot = ds.trials[rows[1]];
    var r = highlight.changed[0];
    var letter = found[r.key] != null ? String(found[r.key]) : orderLetter(ds, r.key);
    var held = highlight.held;
    var cRatio = bot.conc[r.key] / top.conc[r.key];
    var rateRatio = bot.rate / top.rate;
    var cancel = held.length === 1
      ? held[0].label + ' did not change between those two experiments, so it cancels from the ratio.'
      : held.map(function (h) { return h.label; }).join(' and ') + ' did not change, so those concentrations cancel.';
    var n0 = top.exp, n1 = bot.exp;
    var known = found[r.key] != null;
    var all = ds.reactants.every(function (x) { return found[x.key] != null; });
    var verbal = 'When ' + r.label + ' is ' + scalePhrase(cRatio, false) + ', the rate ' + scalePhrase(rateRatio, true);
    if (known) verbal += ' — <span class="iso-focus">' + orderWords(found[r.key]) + '</span>.';
    else verbal += '.';
    var finalLaw = 'rate = k' + ds.reactants.map(function (x) {
      var o = found[x.key];
      if (o == null) return x.label + '<sup>?</sup>';
      return x.label + (o === 1 ? '' : '<sup>' + o + '</sup>');
    }).join('');
    var overall = ds.reactants.reduce(function (s, x) {
      return s + (found[x.key] != null ? found[x.key] : 0);
    }, 0);
    return '<div class="iso-derive">' +
      '<p class="law iso-law-live">' + liveLawHTML(ds, found, r.key) + '</p>' +
      '<p>' + cancel + ' What remains is how the rate scaled with ' + r.label + ':</p>' +
      '<p class="iso-verbal">' + verbal + '</p>' +
      '<div class="iso-math">' +
      '<p class="law iso-ratio-line">' + stackedFrac('rate<sub>' + n1 + '</sub>', 'rate<sub>' + n0 + '</sub>') +
      ' <span class="iso-eq">=</span> (' + stackedFrac(r.label + '<sub>' + n1 + '</sub>', r.label + '<sub>' + n0 + '</sub>') + ')<sup class="iso-focus">' + letter + '</sup></p>' +
      '<p class="law iso-ratio-nums">' + stackedFrac(htmlRate(bot.rate), htmlRate(top.rate)) +
      ' <span class="iso-eq">=</span> (' + stackedFrac(String(bot.conc[r.key]), String(top.conc[r.key])) + ')<sup class="iso-focus">' + letter + '</sup></p>' +
      '<p class="law iso-ratio-times">' + fmtTimes(rateRatio) + ' <span class="iso-eq">=</span> (' + fmtTimes(cRatio) + ')<sup class="iso-focus">' + letter + '</sup></p>' +
      '</div>' +
      (known
        ? '<p class="guess-feedback teach-fb is-match">' + r.label + ' is ' + orderWords(found[r.key]) + '. That is the exponent that turns ' + fmtTimes(cRatio) + ' into ' + fmtTimes(rateRatio) + '.' +
          (all
            ? '<span class="fb-note">Both reactants now have orders: ' + finalLaw + '. Overall order ' + overall + '.</span>'
            : '<span class="fb-note">Keep going until every reactant has an exponent — pick a pair that isolates the other one.</span>') +
          '</p>'
        : '<p>The order with respect to ' + r.label + ' is the exponent that makes those two factors equal.</p>') +
      '</div>';
  }

  function paintIsoOverlay(wrap, ds, highlight, selected) {
    var svg = wrap.querySelector('.iso-overlay');
    var table = wrap.querySelector('table');
    if (!svg || !table || !highlight || !highlight.clean || selected.length !== 2) {
      if (svg) svg.innerHTML = '';
      return;
    }
    var w = wrap.offsetWidth, hgt = wrap.offsetHeight;
    if (svg.getAttribute('width') !== String(w)) svg.setAttribute('width', w);
    if (svg.getAttribute('height') !== String(hgt)) svg.setAttribute('height', hgt);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    var wr = wrap.getBoundingClientRect();
    function box(el) {
      var b = el.getBoundingClientRect();
      return {
        l: b.left - wr.left, t: b.top - wr.top,
        r: b.right - wr.left, btm: b.bottom - wr.top,
        cy: (b.top + b.bottom) / 2 - wr.top
      };
    }
    function cell(trialIndex, col) {
      var tr = table.querySelector('tr[data-i="' + trialIndex + '"]');
      return tr ? tr.querySelector('td[data-col="' + col + '"]') : null;
    }
    var rows = pairOrder(selected);
    var topI = rows[0], botI = rows[1];
    var topT = ds.trials[topI], botT = ds.trials[botI];
    var parts = [];
    highlight.held.forEach(function (held) {
      var c0 = cell(topI, held.key), c1 = cell(botI, held.key);
      if (!c0 || !c1) return;
      var a = box(c0), b = box(c1);
      var l = Math.min(a.l, b.l) + 6;
      var rgt = Math.max(a.r, b.r) - 6;
      var top = Math.min(a.t, b.t) + 5;
      var bot = Math.max(a.btm, b.btm) - 5;
      var tick = 9;
      parts.push('<path class="iso-bracket" d="M' + (l + tick) + ',' + top + ' H' + l + ' V' + bot + ' H' + (l + tick) + '" fill="none" stroke="#000" stroke-width="2"/>');
      parts.push('<path class="iso-bracket" d="M' + (rgt - tick) + ',' + top + ' H' + rgt + ' V' + bot + ' H' + (rgt - tick) + '" fill="none" stroke="#000" stroke-width="2"/>');
    });
    function drawChange(col, factor) {
      var c0 = cell(topI, col), c1 = cell(botI, col);
      if (!c0 || !c1) return;
      var a = box(c0), b = box(c1);
      var left = Math.min(a.l, b.l), right = Math.max(a.r, b.r);
      var x = left + (right - left) * 0.72;
      var y0 = a.cy, y1 = b.cy;
      if (y1 - y0 < 8) return;
      var bow = Math.min(18, (right - x) - 8);
      if (bow < 10) bow = 10;
      var midY = (y0 + y1) / 2;
      var yEnd = y1 - 7;
      var d = 'M' + x + ',' + y0 + ' Q' + (x + bow) + ',' + midY + ' ' + x + ',' + yEnd;
      parts.push('<path class="iso-arrow-path" d="' + d + '" fill="none" stroke="#000" stroke-width="2.25"/>');
      parts.push('<path class="iso-arrow-head" d="M' + (x - 5.5) + ',' + (y1 - 10) + ' L' + x + ',' + y1 + ' L' + (x + 5.5) + ',' + (y1 - 10) + ' Z" fill="#000"/>');
      var label = fmtTimes(factor);
      var lw = 8 * label.length + 10;
      var lx = x + bow + 4;
      if (lx + lw > right - 4) lx = x - lw - 2;
      parts.push('<rect x="' + (lx - 2) + '" y="' + (midY - 12) + '" width="' + lw + '" height="16" fill="#fff"/>');
      parts.push('<text class="iso-times" x="' + lx + '" y="' + (midY + 4) + '" text-anchor="start" fill="#1565c0">' + label + '</text>');
    }
    var ch = highlight.changed[0];
    drawChange(ch.key, botT.conc[ch.key] / topT.conc[ch.key]);
    drawChange('rate', botT.rate / topT.rate);
    svg.innerHTML = parts.join('');
    if (!prefersReduced) {
      Array.prototype.forEach.call(svg.querySelectorAll('.iso-arrow-path, .iso-bracket'), function (p) {
        var len = 0;
        try { len = p.getTotalLength(); } catch (e) { len = 0; }
        if (!len) return;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.getBoundingClientRect();
        p.style.transition = 'stroke-dashoffset 0.7s ease';
        p.style.strokeDashoffset = '0';
      });
    }
  }

  function mountIsoVisual(wrap, ds, highlight, selected) {
    if (isoRo) { isoRo.disconnect(); isoRo = null; }
    if (!wrap) return;
    var last = '';
    function draw() {
      var key = wrap.offsetWidth + 'x' + wrap.offsetHeight;
      if (key === last && wrap.querySelector('.iso-overlay') && wrap.querySelector('.iso-overlay').childNodes.length) return;
      last = key;
      paintIsoOverlay(wrap, ds, highlight, selected);
    }
    draw();
    requestAnimationFrame(function () {
      last = '';
      draw();
    });
    if (typeof ResizeObserver !== 'undefined') {
      isoRo = new ResizeObserver(draw);
      isoRo.observe(wrap);
    }
  }

  function paintTiers() {
    els.tierRow.innerHTML = STEPS.map(function (id, i) {
      var cls = 'tier-dot';
      if (i === state.step) cls += ' current';
      else if (i < state.step) cls += ' complete';
      return '<div class="' + cls + '" title="' + id + '"></div>';
    }).join('');
  }

  /* ── Hook ─────────────────────────────────────────── */
  function renderHook() {
    els.kicker.textContent = 'Step 01 · Hook';
    els.title.textContent = 'Effect of initial concentration on rate';
    els.frame.hidden = true;
    var body = '<div class="viewport" data-fig="FIG. 01  ·  PREDICT" id="guessPlate">' +
      '<div class="viewport-body">' +
      '<p>Below is a reaction with a single reactant “A”. Recall that a square bracket [A] represents the concentration in mol/L. The experiment will measure the <em>initial rate</em>: how fast the reaction is going right at the start of the run, before too much A has been used up.</p>' +
      '<p>Trial 1 starts at [A] = 0.10 M. The same experiment is run again at [A] = 0.20 M. Same temperature, same volume, everything else held the same. Only the starting concentration of A has doubled.</p>' +
      '<div class="beaker-pair">' +
      '<canvas class="sim-canvas" id="hookBeakers" width="800" height="260" aria-label="Two beakers of equal volume. Left, [A] one equals 0.10 molar, half as many unreacted particles. Right, [A] two equals 0.20 molar, twice as many. Particles float; they are not reacting."></canvas>' +
      '<div class="beaker-captions">' +
      '<span>[A]<sub>1</sub> = 0.10 M</span>' +
      '<span>[A]<sub>2</sub> = 0.20 M</span>' +
      '</div></div>' +
      '<div class="guess-controls">' +
      '<p class="framing student-q">If reactant A’s concentration is doubled, what do you think would happen to its <button type="button" class="term-tip" aria-expanded="false" aria-describedby="hookIrDef">initial rate<span class="term-tip-pop" id="hookIrDef" role="tooltip"><span class="term-tip-kicker">Initial rate</span>How fast the reaction is going at the start of the run, before A has been used up. Units M·s⁻¹.</span></button>?</p>' +
      '<div class="guess-prompt-label">Commit a guess</div>' +
      '<div class="choice-row" id="hookChoices">' +
      ['Stays the same', 'Doubles', 'Triples', 'Quadruples'].map(function (c) {
        return '<button type="button" class="choice" data-c="' + c + '">' + c + '</button>';
      }).join('') +
      '</div>' +
      '<p class="guess-feedback" id="hookFb"></p>' +
      '</div></div></div>';
    els.body.innerHTML = body;
    if (state.hookRevealed) {
      var plate0 = $('guessPlate');
      if (plate0) plate0.dataset.fig = 'FIG. 01  ·  MEASURED';
      paintHookFeedback();
    }
    var tip = els.body.querySelector('.term-tip');
    if (tip) {
      tip.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = tip.getAttribute('aria-expanded') === 'true';
        tip.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll('#hookChoices .choice'), function (btn) {
      if (state.hookChoice === btn.dataset.c) btn.setAttribute('aria-pressed', 'true');
      btn.addEventListener('click', function () {
        if (state.hookRevealed) return;
        state.hookChoice = btn.dataset.c;
        Array.prototype.forEach.call(document.querySelectorAll('#hookChoices .choice'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        revealHook();
      });
    });
    startHookBeakers();
  }

  function startHookBeakers() {
    cancelAnimationFrame(hookAnim.raf);
    var canvas = $('hookBeakers');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var r = 6;

    function beakerGeom(cx) {
      return beakerGeomAt(cx, r);
    }

    function make(n, g) {
      var a = [];
      for (var i = 0; i < n; i++) {
        a.push({
          x: g.x0 + Math.random() * (g.x1 - g.x0),
          y: g.y0 + Math.random() * (g.y1 - g.y0),
          vx: (Math.random() * 2 - 1) * 0.55,
          vy: (Math.random() * 2 - 1) * 0.55
        });
      }
      return a;
    }

    var leftG = beakerGeom(w * 0.25);
    var rightG = beakerGeom(w * 0.75);
    var left = make(10, leftG);
    var right = make(20, rightG);

    function floatIn(p, g) {
      p.vx += (Math.random() * 2 - 1) * 0.04;
      p.vy += (Math.random() * 2 - 1) * 0.04;
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > 0.85) { p.vx *= 0.85 / sp; p.vy *= 0.85 / sp; }
      if (sp < 0.18) { p.vx *= 1.4; p.vy *= 1.4; }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < g.x0) { p.x = g.x0; p.vx = Math.abs(p.vx); }
      if (p.x > g.x1) { p.x = g.x1; p.vx = -Math.abs(p.vx); }
      if (p.y < g.y0) { p.y = g.y0; p.vy = Math.abs(p.vy); }
      if (p.y > g.y1) { p.y = g.y1; p.vy = -Math.abs(p.vy); }
    }

    function drawBeaker(g) {
      strokeBeaker(ctx, g);
    }

    function drawParticles(arr) {
      arr.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#1565c0';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      drawBeaker(leftG);
      drawBeaker(rightG);
      if (!prefersReduced) {
        left.forEach(function (p) { floatIn(p, leftG); });
        right.forEach(function (p) { floatIn(p, rightG); });
      }
      drawParticles(left);
      drawParticles(right);
      if (!prefersReduced) hookAnim.raf = requestAnimationFrame(frame);
    }

    frame();
  }

  function paintHookFeedback() {
    var fb = $('hookFb');
    if (!fb || !state.hookChoice) return;
    var match = state.hookChoice === 'Quadruples';
    fb.className = 'guess-feedback hook-fb ' + (match ? 'is-match' : 'is-miss');
    if (match) {
      fb.textContent = 'That matches the measured result.';
      return;
    }
    fb.innerHTML = 'You guessed “' + state.hookChoice + '.” The measured result is different.' +
      '<span class="fb-note">Your logic makes sense, but the chemistry DATA says otherwise.</span>';
  }

  function revealHook() {
    state.hookRevealed = true;
    paintHookFeedback();
    var plate = $('guessPlate');
    if (plate) plate.dataset.fig = 'FIG. 01  ·  MEASURED';
  }

  /* ── Molecular ────────────────────────────────────── */
  function renderMolecular() {
    els.kicker.textContent = 'Step 02 · 5.2.A.1';
    els.title.textContent = 'Why concentration changes the rate';
    els.frame.className = 'framing';
    els.frame.innerHTML = '<span class="frame-line">Recall: rate is determined from how much reactant is present.</span><span class="frame-line">More particles in the same volume → more collisions → faster rate.</span>';
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 02  ·  PARTICLE DENSITY">' +
      '<div class="viewport-body">' +
      '<canvas class="sim-canvas" id="molCanvas" width="800" height="260" aria-label="Two beakers. Beaker A is sparse. Beaker B has twice as many particles in the same volume. Particles collide and rebound."></canvas>' +
      '<div class="beaker-captions">' +
      '<div class="beaker-cap"><span>Beaker A</span><span class="beaker-count-label">Collisions</span><span class="readout beaker-count" id="molCountA">0</span></div>' +
      '<div class="beaker-cap"><span>Beaker B</span><span class="beaker-count-label">Collisions</span><span class="readout beaker-count" id="molCountB">0</span></div>' +
      '</div>' +
      '<p class="table-note">Beaker A: [A] = 0.10 M. Beaker B: [A] = 0.20 M.</p>' +
      '</div></div>';
    startMol();
  }

  function startMol() {
    cancelAnimationFrame(molAnim.raf);
    var canvas = $('molCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var R = 8;
    var z0 = 16, z1 = 88;
    var sparks = [];
    var leftG = beakerGeomAt(w * 0.25, R);
    var rightG = beakerGeomAt(w * 0.75, R);
    var elA = $('molCountA');
    var elB = $('molCountB');

    function depthT(z) {
      return (z - z0) / (z1 - z0);
    }
    function screenR(p) {
      return 3.1 + 5.4 * depthT(p.z);
    }
    function make(n, g) {
      var a = [];
      var tries = 0;
      while (a.length < n && tries < n * 40) {
        tries++;
        var p = {
          x: g.x0 + Math.random() * (g.x1 - g.x0),
          y: g.y0 + Math.random() * (g.y1 - g.y0),
          z: z0 + Math.random() * (z1 - z0),
          vx: (Math.random() * 2 - 1) * 1.35,
          vy: (Math.random() * 2 - 1) * 1.35,
          vz: (Math.random() * 2 - 1) * 0.95
        };
        var ok = true;
        for (var i = 0; i < a.length; i++) {
          var dx = p.x - a[i].x, dy = p.y - a[i].y, dz = p.z - a[i].z;
          if (dx * dx + dy * dy + dz * dz < (R * 2.2) * (R * 2.2)) { ok = false; break; }
        }
        if (ok) a.push(p);
      }
      return a;
    }
    var left = make(10, leftG);
    var right = make(20, rightG);
    var hitsL = 0, hitsR = 0;
    var recentL = [], recentR = [];

    function walls(p, g) {
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      if (p.x < g.x0) { p.x = g.x0; p.vx = Math.abs(p.vx); }
      if (p.x > g.x1) { p.x = g.x1; p.vx = -Math.abs(p.vx); }
      if (p.y < g.y0) { p.y = g.y0; p.vy = Math.abs(p.vy); }
      if (p.y > g.y1) { p.y = g.y1; p.vy = -Math.abs(p.vy); }
      if (p.z < z0) { p.z = z0; p.vz = Math.abs(p.vz); }
      if (p.z > z1) { p.z = z1; p.vz = -Math.abs(p.vz); }
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
      if (sp > 2.4) {
        p.vx *= 2.4 / sp; p.vy *= 2.4 / sp; p.vz *= 2.4 / sp;
      }
    }

    function knock(arr) {
      var c = 0;
      var zSlab = 30;
      for (var i = 0; i < arr.length; i++) {
        for (var j = i + 1; j < arr.length; j++) {
          var a = arr[i], b = arr[j];
          if (Math.abs(a.z - b.z) > zSlab) continue;
          var ra = screenR(a), rb = screenR(b);
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist2 = dx * dx + dy * dy;
          var min = ra + rb;
          if (dist2 >= min * min || dist2 < 0.0001) continue;
          var dist = Math.sqrt(dist2);
          var nx = dx / dist, ny = dy / dist;
          var vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (vn < 0) {
            a.vx -= vn * nx; a.vy -= vn * ny;
            b.vx += vn * nx; b.vy += vn * ny;
            var zv = (a.vz - b.vz) * 0.4;
            a.vz -= zv; b.vz += zv;
            c++;
            sparks.push({
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              t: (depthT(a.z) + depthT(b.z)) / 2,
              life: 1
            });
          }
          var push = (min - dist) * 0.5;
          a.x += nx * push; a.y += ny * push;
          b.x -= nx * push; b.y -= ny * push;
        }
      }
      return c;
    }

    function drawSparks() {
      var next = [];
      sparks.forEach(function (s) {
        var rad = 5 + (1 - s.life) * 11;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,' + (0.55 * s.life).toFixed(3) + ')';
        ctx.lineWidth = 1.25;
        ctx.stroke();
        s.life -= prefersReduced ? 1 : 0.065;
        if (s.life > 0) next.push(s);
      });
      sparks = next;
    }

    function drawParticles(arr) {
      var order = arr.slice().sort(function (a, b) { return a.z - b.z; });
      order.forEach(function (p) {
        var t = depthT(p.z);
        var rad = screenR(p);
        var alpha = 0.22 + 0.78 * t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(21,101,192,' + alpha.toFixed(3) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,' + (0.2 + 0.8 * t).toFixed(3) + ')';
        ctx.lineWidth = 0.8 + 0.5 * t;
        ctx.stroke();
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      strokeBeaker(ctx, leftG);
      strokeBeaker(ctx, rightG);
      if (!prefersReduced) {
        left.forEach(function (p) { walls(p, leftG); });
        right.forEach(function (p) { walls(p, rightG); });
        recentL.push(knock(left));
        recentR.push(knock(right));
        if (recentL.length > 48) recentL.shift();
        if (recentR.length > 48) recentR.shift();
        hitsL = 0; hitsR = 0;
        recentL.forEach(function (n) { hitsL += n; });
        recentR.forEach(function (n) { hitsR += n; });
      }
      drawParticles(left);
      drawParticles(right);
      drawSparks();
      var aTxt = String(hitsL), bTxt = String(hitsR);
      if (elA && elA.textContent !== aTxt) elA.textContent = aTxt;
      if (elB && elB.textContent !== bTxt) elB.textContent = bTxt;
      if (!prefersReduced) molAnim.raf = requestAnimationFrame(frame);
    }

    if (prefersReduced) {
      knock(left);
      knock(right);
      frame();
    } else {
      frame();
    }
  }

  /* ── Rate law explainer ───────────────────────────── */
  function renderRateLaw() {
    els.kicker.textContent = 'Step 03 · 5.2.A.2';
    els.title.textContent = 'The differential rate law';
    els.frame.className = 'framing';
    els.frame.innerHTML = '<span class="frame-line">Rate is proportional to each concentration raised to a power.</span><strong class="frame-line">The powers are the orders — those are what this path finds.</strong>';
    var defs = [
      { k: 'rate', sym: 'rate', name: 'Initial rate', text: 'How fast the reaction proceeds at t ≈ 0. Measured for each trial. Units M·s⁻¹.' },
      { k: 'k', sym: 'k', name: 'Rate constant', text: 'The proportionality constant. Each reaction has one; it lets chemists predict rates at any combination of concentrations. How to determine its value comes later.' },
      { k: 'conc', sym: '[A], [B]', name: 'Concentrations', text: 'Molarity of each reactant. The experiment sets these. Known.' },
      { k: 'order', sym: 'x, y', name: 'Orders', text: 'The exponents tell us the rate order. Different orders have different characteristics. We will determine them using two different methods.' }
    ];
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 03  ·  THE LAW">' +
      '<div class="viewport-body">' +
      '<p class="table-note">Differential rate law</p>' +
      '<div class="law-explainer" role="group" aria-label="Differential rate law. Click a symbol for its definition.">' +
      '<button type="button" class="law-term" data-k="rate">rate</button>' +
      '<span class="law-eq">=</span>' +
      '<button type="button" class="law-term" data-k="k">k</button>' +
      '<span class="law-factor">' +
      '<button type="button" class="law-term" data-k="conc">[A]</button>' +
      '<sup><button type="button" class="law-term law-exp" data-k="order">x</button></sup>' +
      '</span>' +
      '<span class="law-factor">' +
      '<button type="button" class="law-term" data-k="conc">[B]</button>' +
      '<sup><button type="button" class="law-term law-exp" data-k="order">y</button></sup>' +
      '</span>' +
      '</div>' +
      '<table class="lab-table def-table"><thead><tr><th>Symbol</th><th>Name</th><th>What it is</th></tr></thead><tbody>' +
      defs.map(function (d) {
        return '<tr class="clickable" data-k="' + d.k + '"><td>' + d.sym + '</td><td>' + d.name + '</td><td>' + d.text + '</td></tr>';
      }).join('') +
      '</tbody></table>' +
      '<p class="table-note" id="lawNote">Click a row to see where in the equation the value lies.</p>' +
      '<p class="law-lang">Below is the language we use to talk about reaction and reactant order.</p>' +
      '<div class="law-examples">' +
      '<div class="law-ex">' +
      '<p class="table-note">Ex. 1</p>' +
      '<p class="law">rate = k[A]<sup class="ord-1">1</sup></p>' +
      '<p>This reaction is <span class="ord-1">first order with respect to A</span>. It is also <span class="ord-all">first order overall</span>.</p>' +
      '</div>' +
      '<div class="law-ex">' +
      '<p class="table-note">Ex. 2</p>' +
      '<p class="law">rate = k[A]<sup class="ord-2">2</sup>[B]<sup class="ord-1">1</sup></p>' +
      '<p>This reaction is <span class="ord-2">second order with respect to A</span>, <span class="ord-1">first order with respect to B</span>, and <span class="ord-all">third order overall</span> (<span class="ord-2">2nd order</span> + <span class="ord-1">1st order</span> = <span class="ord-all">third order</span>).</p>' +
      '</div>' +
      '</div>' +
      '</div></div>';

    function selectTerm(key) {
      Array.prototype.forEach.call(els.body.querySelectorAll('.law-term'), function (b) {
        b.setAttribute('aria-pressed', b.dataset.k === key ? 'true' : 'false');
      });
      Array.prototype.forEach.call(els.body.querySelectorAll('.def-table tbody tr'), function (tr) {
        tr.classList.toggle('selected', tr.dataset.k === key);
      });
    }

    Array.prototype.forEach.call(els.body.querySelectorAll('.law-term, .def-table tbody tr'), function (el) {
      el.addEventListener('click', function () { selectTerm(el.dataset.k); });
    });
  }

  /* ── Warm-up ──────────────────────────────────────── */
  function renderWarmup() {
    var ds = RateData.DATASETS.warmup2;
    els.kicker.textContent = 'Step 04 · 5.2.A.3';
    els.title.textContent = 'One reactant, clean powers';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<strong class="frame-line student-q">Compare two experiments. What happened to the rate when [A] changed, and which exponent turns that concentration ratio into the rate ratio?</strong>';
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 04  ·  SINGLE-REACTANT TABLE">' +
      '<div class="viewport-body">' +
      '<p>For a single reactant the rule is rate ratio = (concentration ratio)<sup>order</sup>. The numbers here are clean powers, so you can see the exponent without logarithms. That ratio-to-exponent move is the tool every later table will use.</p>' +
      tableHTML(ds, { selected: [] }) +
      '<p class="table-note">Rule: rate ratio = (concentration ratio)<sup>order</sup></p>' +
      '<div class="guess-controls"><div class="guess-prompt-label">Order in A</div>' +
      '<div class="choice-row" id="wuChoices">' +
      [1, 2, 3].map(function (n) { return '<button type="button" class="choice" data-n="' + n + '">' + n + '</button>'; }).join('') +
      '</div><p class="guess-feedback" id="wuFb"></p></div></div></div>';
    Array.prototype.forEach.call(document.querySelectorAll('#wuChoices .choice'), function (btn) {
      btn.addEventListener('click', function () {
        state.warmupOrder = Number(btn.dataset.n);
        Array.prototype.forEach.call(document.querySelectorAll('#wuChoices .choice'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        var fb = $('wuFb');
        if (state.warmupOrder === 2) {
          state.warmupRevealed = true;
          fb.className = 'guess-feedback teach-fb is-match';
          fb.innerHTML = 'Concentration doubled and the rate quadrupled. 2² = 4, so the order in A is 2. Experiments 2 and 3 are the same doubling again; 1 vs 3 is [A] ×4 and rate ×16, because 4² = 16. Same exponent either way.' +
            '<span class="fb-note">That is the tool you will use on every table after this.</span>';
        } else {
          fb.className = 'guess-feedback teach-fb is-miss';
          fb.innerHTML = 'The rate went ×4 when [A] went ×2, not ×' + state.warmupOrder + '.' +
            '<span class="fb-note">Which power of 2 equals 4? That power is the order.</span>';
        }
      });
    });
  }

  /* ── Isolation ────────────────────────────────────── */
  function isolationState(dsKey) {
    if (!state._iso) state._iso = {};
    if (!state._iso[dsKey]) state._iso[dsKey] = { selected: [], found: {} };
    return state._iso[dsKey];
  }

  function renderIsolation() {
    var ds = RateData.DATASETS.clo2;
    var st = isolationState('clo2');
    els.kicker.textContent = 'Step 05 · 5.2.A.5';
    els.title.textContent = 'Find the order in each reactant';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">This table has two reactants. Comparing initial rates only works if you isolate one of them: hold the other concentration exactly constant, and let one change.</span>' +
      '<strong class="frame-line student-q">Click two experiments that will allow you to measure only the change of one of the reactants, and see how the concentration and rate change accordingly.</strong>';
    var highlight = null;
    var msg = '';
    if (st.selected.length === 2) {
      highlight = RateData.isolationDiff(ds, st.selected[0], st.selected[1]);
      if (!highlight.clean) {
        var names = highlight.changed.map(function (r) { return r.label; }).join(' AND ');
        msg = '<div class="callout bad">You changed ' + names + '. The rate change could come from either reactant, so you have isolated nothing. Pick a different pair — you want exactly one concentration different, and every other column identical.</div>';
      } else {
        var r = highlight.changed[0];
        msg = isoDeriveHTML(ds, highlight, st.selected, st.found);
        if (st.found[r.key] == null) {
          msg += '<div class="guess-controls"><div class="guess-prompt-label">Order in <span class="chem">' + r.label + '</span></div>' +
            '<div class="choice-row" id="isoOrd">' +
            [1, 2, 3].map(function (n) { return '<button type="button" class="choice" data-n="' + n + '" data-k="' + r.key + '">' + n + '</button>'; }).join('') +
            '</div><p class="guess-feedback" id="isoFb"></p></div>';
        }
      }
    }
    var found = ds.reactants.map(function (r) {
      return '<span class="chem">' + r.label + '</span> = ' + (st.found[r.key] != null ? st.found[r.key] : '—');
    }).join('   ·   ');
    var allFound = ds.reactants.every(function (r) { return st.found[r.key] != null; });
    if (allFound && !(highlight && highlight.clean)) {
      msg += '<div class="iso-derive">' +
        '<p class="table-note">Final rate law</p>' +
        '<p class="law iso-final">rate = k[F₂][ClO₂]</p>' +
        '<p class="guess-feedback teach-fb is-match">The overall order is the sum of those powers: 1 + 1 = 2.</p>' +
        '</div>';
    }
    els.body.innerHTML =
      '<div class="viewport iso-open" data-fig="FIG. 05  ·  F₂ + 2 ClO₂ → 2 FClO₂" data-fig-case="preserve">' +
      '<div class="viewport-body">' +
      '<p class="law">F<sub>2</sub> + 2 ClO<sub>2</sub> → 2 FClO<sub>2</sub></p>' +
      isoTableBlock(ds, { selected: st.selected, highlight: highlight }) +
      '<p class="table-note">Found: ' + found + '</p>' + msg +
      '</div></div>';
    mountIsoVisual(els.body.querySelector('.iso-table-wrap'), ds, highlight, st.selected);
    Array.prototype.forEach.call(els.body.querySelectorAll('tr.clickable'), function (tr) {
      tr.addEventListener('click', function () {
        var i = Number(tr.dataset.i);
        var ix = st.selected.indexOf(i);
        if (ix !== -1) st.selected.splice(ix, 1);
        else {
          if (st.selected.length === 2) st.selected = [];
          st.selected.push(i);
        }
        renderIsolation();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('#isoOrd .choice'), function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.k;
        var n = Number(btn.dataset.n);
        var rec = ds.reactants.filter(function (r) { return r.key === key; })[0];
        var fb = $('isoFb');
        if (n === rec.order) {
          st.found[key] = n;
          state.isoOrders = st.found;
          renderIsolation();
        } else {
          fb.className = 'guess-feedback teach-fb is-miss';
          fb.innerHTML = 'That power does not turn the concentration ratio into the rate ratio.' +
            '<span class="fb-note">Ask what exponent would.</span>';
        }
      });
    });
  }

  /* ── Predict ──────────────────────────────────────── */
  function renderPredict() {
    var ds = RateData.DATASETS.clo2;
    var u = ds.unseen;
    var t1 = ds.trials[0];
    els.kicker.textContent = 'Step 06 · Forward prediction';
    els.title.textContent = 'A rate law is for prediction';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">We can use the rate law found on the previous slide to then predict the initial rate of another experiment. First, we need to find the value and units of k.</span>' +
      '<strong class="frame-line student-q">Follow the steps below to see how that works.</strong>';
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 06  ·  UNSEEN TRIAL">' +
      '<div class="viewport-body">' +
      '<p class="table-note">Working rate law</p>' +
      '<p class="law iso-final">rate = k[F₂][ClO₂]</p>' +
      '<div class="pred-compare" role="group" aria-label="Known trial versus new trial">' +
      '<div class="pred-card">' +
      '<p class="table-note">Known · Exp ' + t1.exp + '</p>' +
      '<p class="pred-row"><span>[F₂]</span><strong>' + t1.conc.F2 + ' M</strong></p>' +
      '<p class="pred-row"><span>[ClO₂]</span><strong>' + t1.conc.ClO2 + ' M</strong></p>' +
      '<p class="pred-row pred-rate"><span>rate</span><strong>' + htmlRate(t1.rate) + ' ' + ds.rateUnit + '</strong></p>' +
      '</div>' +
      '<div class="pred-arrow" aria-hidden="true">' +
      '<svg viewBox="0 0 64 40" width="64" height="40">' +
      '<path d="M4 20 H48" fill="none" stroke="#000" stroke-width="2.25"/>' +
      '<path d="M40 10 L54 20 L40 30" fill="none" stroke="#000" stroke-width="2.25"/>' +
      '</svg>' +
      '<span>find k, then plug in</span>' +
      '</div>' +
      '<div class="pred-card pred-card-new">' +
      '<p class="table-note">New · unseen</p>' +
      '<p class="pred-row"><span>[F₂]</span><strong>' + u.conc.F2 + ' M</strong></p>' +
      '<p class="pred-row"><span>[ClO₂]</span><strong>' + u.conc.ClO2 + ' M</strong></p>' +
      '<p class="pred-row pred-rate"><span>rate</span><strong class="pred-unknown">?</strong></p>' +
      '</div>' +
      '</div>' +
      '<ol class="pred-steps">' +
      '<li>Rearrange Exp ' + t1.exp + ': <span class="mono">k = rate / ([F₂][ClO₂])</span>.</li>' +
      '<li>Plug the new concentrations into <span class="mono">rate = k[F₂][ClO₂]</span>.</li>' +
      '<li>Commit that predicted initial rate. Scientific notation is fine.</li>' +
      '</ol>' +
      '<div class="guess-controls">' +
      '<div class="guess-prompt-label">Predicted initial rate</div>' +
      '<div class="guess-row"><input class="rate-input" id="predIn" placeholder="e.g. 9.6e-3" aria-label="Predicted initial rate">' +
      '<button type="button" class="btn submit" id="predBtn">Commit</button></div>' +
      '<p class="guess-feedback" id="predFb"></p>' +
      '</div>' +
      '</div></div>';
    $('predBtn').addEventListener('click', function () {
      var raw = ($('predIn').value || '').trim().replace('×10', 'e').replace('x10', 'e');
      var val = Number(raw);
      state.predictVal = val;
      var fb = $('predFb');
      if (!isFinite(val)) {
        fb.className = 'guess-feedback teach-fb is-miss';
        fb.textContent = 'Enter a number. Scientific notation like 9.6e-3 is fine.';
        return;
      }
      state.predictRevealed = true;
      var ok = Math.abs(val - u.rate) / u.rate < 0.08;
      fb.className = 'guess-feedback teach-fb ' + (ok ? 'is-match' : 'is-miss');
      fb.innerHTML = (ok ? 'That matches the measured trial. ' : 'The measured initial rate is ') + htmlRate(u.rate) + ' ' + ds.rateUnit + '.' +
        '<span class="fb-note">The law predicted an experiment nobody had run yet — that is what a rate law is for.</span>';
      var unk = els.body.querySelector('.pred-unknown');
      if (unk) {
        unk.className = 'pred-reveal';
        unk.innerHTML = htmlRate(u.rate) + ' ' + ds.rateUnit;
      }
    });
  }

  /* ── k units ────────────────────────────────────────
     RESUME: rework this step FIRST (FIG. 07 · DRAG TO CANCEL).
     Current drag-chip UI is not good — needs clearer structure + better visuals.
     Keep pedagogy: overall order → units; leftover M below the bar before M⁻¹; no numerical k.
     Tracked in AGENTS.md (Resume queue) and DESIGN.md §8. */
  function renderKUnits() {
    els.kicker.textContent = 'Step 07 · 5.2.A.4';
    els.title.textContent = 'Cancel until only k’s units remain';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">One important aspect of “k” is to be able to know its units. The units will change depending on the order of the entire reaction.</span>' +
      '<strong class="frame-line student-q">Use the example below to see how the units would combine to get the final units of “k”.</strong>';
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 07  ·  DRAG TO CANCEL">' +
      '<div class="viewport-body">' +
      '<p>Rearranged, k = rate / ([F₂][ClO₂]). Rate contributes M·s⁻¹; each concentration contributes M. Overall order is 2, so two M’s sit in the denominator. Drag the blue M from the top onto a matching M below to cancel, and watch what is left <em>below the bar</em> — that leftover is where students usually stumble.</p>' +
      '<p class="law">k = rate / ([F₂][ClO₂])</p>' +
      '<p class="table-note">Overall order 2 · drag M onto M to cancel</p>' +
      '<div class="frac" id="unitFrac">' +
      '<div class="expr" id="numRow"></div>' +
      '<div class="frac-bar"></div>' +
      '<div class="expr drop-slot" id="denRow"></div>' +
      '</div>' +
      '<p class="guess-feedback" id="unitFb"></p>' +
      '</div></div>';
      var num = [{ id: 'nM', t: 'M' }, { id: 'ns', t: 's⁻¹' }];
    var den = [{ id: 'd1', t: 'M' }, { id: 'd2', t: 'M' }];
    var cancelled = 0;
    function paint() {
      $('numRow').innerHTML = num.filter(function (c) { return !c.dead; }).map(function (c) {
        return '<span class="chip" draggable="true" data-id="' + c.id + '">' + c.t + '</span>';
      }).join('');
      $('denRow').innerHTML = den.map(function (c) {
        return '<span class="chip denom' + (c.dead ? ' cancelled' : '') + '" data-id="' + c.id + '">' + c.t + '</span>';
      }).join('');
      Array.prototype.forEach.call($('numRow').querySelectorAll('.chip'), function (ch) {
        ch.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', ch.dataset.id);
        });
      });
    }
    $('denRow').addEventListener('dragover', function (e) { e.preventDefault(); });
    $('denRow').addEventListener('drop', function (e) {
      e.preventDefault();
      if (cancelled) return;
      var id = e.dataTransfer.getData('text/plain');
      var chip = num.filter(function (c) { return c.id === id; })[0];
      if (!chip || chip.t !== 'M') return;
      var target = den.filter(function (c) { return c.t === 'M' && !c.dead; })[0];
      if (!target) return;
      chip.dead = true;
      target.dead = true;
      cancelled = 1;
      paint();
      var fb = $('unitFb');
      fb.className = 'guess-feedback teach-fb';
      fb.innerHTML = 'The surviving concentration unit is still <strong>below the bar</strong>: s⁻¹ / M.' +
        '<span class="fb-note">That denominator is about to become a negative exponent — watch it happen, don’t skip to the result.</span>';
      setTimeout(function () {
        state.unitsDone = true;
        fb.className = 'guess-feedback teach-fb is-match';
        fb.innerHTML = 'That leftover M in the denominator is written M⁻¹. k’s units are <strong>M⁻¹s⁻¹</strong>.';
      }, prefersReduced ? 0 : 1100);
    });
    paint();
  }

  /* ── Practice ─────────────────────────────────────── */
  function renderPractice() {
    var ids = RateData.PRACTICE;
    var id = ids[state.practiceIndex];
    var ds = RateData.DATASETS[id];
    var st = isolationState('p-' + id);
    els.kicker.textContent = 'Step 08 · Practice ' + (state.practiceIndex + 1) + ' / ' + ids.length;
    els.title.textContent = ds.title;
    els.frame.className = 'framing';
    if (state.practiceIndex === 0) {
      els.frame.innerHTML =
        '<span class="frame-line">Same method, a new reaction. This table is not the F₂ + ClO₂ set you already solved — isolate each reactant, read each order from the rate ratio, and write the law.</span>' +
        '<strong class="frame-line student-q">If two concentrations change in your pair, you isolated nothing — pick again.</strong>';
    } else {
      els.frame.innerHTML =
        '<span class="frame-line">Another table. Isolate each reactant, read each order from how the rate scaled, and fill the law.</span>' +
        '<strong class="frame-line student-q">If two concentrations change in your pair, you isolated nothing — pick again.</strong>';
    }
    var highlight = null;
    var msg = '';
    if (st.selected.length === 2) {
      highlight = RateData.isolationDiff(ds, st.selected[0], st.selected[1]);
      if (!highlight.clean) {
        msg = '<div class="callout bad">You changed more than one concentration, so the rate change could come from either reactant. That pair isolated nothing. Choose two rows that hold one reactant constant.</div>';
      } else {
        var r = highlight.changed[0];
        msg = isoDeriveHTML(ds, highlight, st.selected, st.found);
        if (st.found[r.key] == null) {
          msg += '<div class="choice-row" id="prOrd">' +
            [1, 2, 3].map(function (n) {
              return '<button type="button" class="choice" data-n="' + n + '" data-k="' + r.key + '">order ' + n + '</button>';
            }).join('') + '</div><p class="guess-feedback" id="prFb"></p>';
        }
      }
    }
    var lawBits = ds.reactants.map(function (r) {
      return r.label + '<sup>' + (st.found[r.key] != null ? st.found[r.key] : '?') + '</sup>';
    }).join('');
    els.body.innerHTML =
      '<div class="viewport iso-open" data-fig="FIG. 08  ·  ' + ds.title + '" data-fig-case="preserve">' +
      '<div class="viewport-body">' +
      (state.practiceIndex === 0
        ? '<p>Real initial-rate data for NO + H₂. Orders are not both 1 this time — compare clean pairs carefully.</p>'
        : '') +
      isoTableBlock(ds, { selected: st.selected, highlight: highlight }) +
      msg +
      (!(highlight && highlight.clean) ? '<p class="law">rate = k ' + lawBits + '</p>' : '') +
      (state.practiceIndex < ids.length - 1 ? '<button type="button" class="btn" id="prNext">Next table →</button>' : '') +
      '</div></div>';
    mountIsoVisual(els.body.querySelector('.iso-table-wrap'), ds, highlight, st.selected);
    Array.prototype.forEach.call(els.body.querySelectorAll('tr.clickable'), function (tr) {
      tr.addEventListener('click', function () {
        var i = Number(tr.dataset.i);
        var ix = st.selected.indexOf(i);
        if (ix !== -1) st.selected.splice(ix, 1);
        else {
          if (st.selected.length === 2) st.selected = [];
          st.selected.push(i);
        }
        renderPractice();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('#prOrd .choice'), function (btn) {
      btn.addEventListener('click', function () {
        var rec = ds.reactants.filter(function (r) { return r.key === btn.dataset.k; })[0];
        var n = Number(btn.dataset.n);
        var fb = $('prFb');
        if (n === rec.order) {
          st.found[rec.key] = n;
          fb.className = 'guess-feedback teach-fb is-match';
          fb.innerHTML = rec.label + ' is order ' + n + '.';
          var all = ds.reactants.every(function (r) { return st.found[r.key] != null; });
          if (all) {
            state.practiceDone[id] = true;
            fb.innerHTML = rec.label + ' is order ' + n + '. Both exponents are in — that is the differential rate law for this table.';
          }
          renderPractice();
        } else {
          fb.className = 'guess-feedback teach-fb is-miss';
          fb.innerHTML = 'That exponent does not fit the ratios.' +
            '<span class="fb-note">Check which concentration changed, and by what factor the rate followed.</span>';
        }
      });
    });
    var nxt = $('prNext');
    if (nxt) nxt.addEventListener('click', function () {
      state.practiceIndex = Math.min(ids.length - 1, state.practiceIndex + 1);
      renderPractice();
    });
  }

  /* ── Summary ──────────────────────────────────────── */
  function renderSummary() {
    els.kicker.textContent = 'Step 09 · The wall';
    els.title.textContent = 'Two methods, keep them distinct';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">You are leaving Part A with a differential rate law from comparing trials.</span>' +
      '<span class="frame-line">Graphing — Part B — finds a rate law too, but it is a different tool on different data. Keep them distinct so you can choose which one a problem is asking for.</span>';
    els.body.innerHTML =
      '<div class="two-col">' +
      '<div class="viewport" data-fig="FIG. 09A  ·  INITIAL RATES"><div class="viewport-body">' +
      '<p><strong>Many trials</strong>, each started at <strong>different concentrations</strong>, compared by <strong>ratio</strong>. You choose which rows isolate a reactant.</p>' +
      '<p>The result is the <em>differential</em> rate law: rate = k[A]<sup>x</sup>[B]<sup>y</sup>…, with k as a symbol that has units.</p>' +
      '</div></div>' +
      '<div class="viewport graph-paper" data-fig="FIG. 09B  ·  GRAPHING"><div class="viewport-body">' +
      '<p><strong>One trial</strong>, tracked <strong>over time</strong> as concentration falls, straightened by a <strong>transform</strong>.</p>' +
      '<p>The result is the <em>integrated</em> rate law, and k becomes a slope you can read off the graph.</p>' +
      '</div></div></div>';
  }

  /* ── Gate ─────────────────────────────────────────── */
  function renderGate() {
    var ds = RateData.DATASETS.gate;
    var st = isolationState('gate');
    var n = RateData.totalOrder(ds);
    var units = ['s⁻¹', 'M⁻¹s⁻¹', 'M⁻²s⁻¹'];
    els.kicker.textContent = 'Completion gate';
    els.title.textContent = 'Prove it once';
    els.frame.className = 'framing';
    els.frame.innerHTML =
      '<span class="frame-line">This last table is one you have not seen. Use the method once, unaided: pick clean pairs, read each order from the rate ratio, write the differential rate law, then choose k’s units from the <em>overall</em> order — the sum of the exponents — not from one reactant.</span>' +
      '<span class="frame-line">Infinite retries. After a couple of misses, a hint will point at the method, never at the answer.</span>';
    var hint = '';
    if (state.gateMisses >= 2) {
      hint = '<p class="callout">Look at trials 1 and 2. Which concentration changed, and what did the rate do? That pair is trying to tell you one of the orders.</p>';
    }
    if (state.gateMisses >= 4) {
      hint = '<p class="callout">Trials 1 and 3 hold [A] constant, so that pair is for the order in B. Units of k come from the <em>sum</em> of the exponents, not from a single reactant.</p>';
    }
    var boxes = ds.reactants.map(function (r) {
      return r.label + '<sup><input class="order-box" data-k="' + r.key + '" maxlength="1" inputmode="numeric" aria-label="order ' + r.label + '"></sup>';
    }).join('');
    els.body.innerHTML =
      '<div class="viewport" data-fig="FIG. 11  ·  GATE">' +
      '<div class="viewport-body">' +
      '<p>Compare rows by eye the way you just practiced, then type the orders and pick the units. This is a completion gate, not an exam — its job is “prove you can, once.”</p>' +
      tableHTML(ds, { selected: st.selected }) +
      '<p class="law">rate = k ' + boxes + '</p>' +
      '<div class="guess-prompt-label">Units of k</div>' +
      '<div class="choice-row" id="gateU">' +
      units.map(function (u) { return '<button type="button" class="choice" data-u="' + u + '">' + u + '</button>'; }).join('') +
      '</div>' +
      '<button type="button" class="btn submit" id="gateBtn">Submit</button>' +
      '<p class="guess-feedback" id="gateFb"></p>' + hint +
      '</div></div>';
    var chosenU = null;
    Array.prototype.forEach.call(document.querySelectorAll('#gateU .choice'), function (btn) {
      btn.addEventListener('click', function () {
        chosenU = btn.dataset.u;
        Array.prototype.forEach.call(document.querySelectorAll('#gateU .choice'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      });
    });
    $('gateBtn').addEventListener('click', function () {
      var ordersOk = ds.reactants.every(function (r) {
        var inp = els.body.querySelector('input[data-k="' + r.key + '"]');
        return Number(inp.value) === r.order;
      });
      var want = RateData.unitsForTotalOrder(n);
      var unitsOk = chosenU === want;
      var fb = $('gateFb');
      if (ordersOk && unitsOk) {
        fb.className = 'guess-feedback teach-fb is-match';
        fb.innerHTML = 'That is a differential rate law, and the units match the overall order.' +
          '<span class="fb-note">Part B — graphing — is open from the hub whenever you want it. You can come back to initial rates anytime.</span>';
        if (window.RateLock) window.RateLock.markInitialRatesComplete();
        finishPath();
      } else {
        state.gateMisses++;
        fb.className = 'guess-feedback teach-fb is-miss';
        if (!ordersOk && !unitsOk) {
          fb.innerHTML = 'Orders and units both need another look.' +
            '<span class="fb-note">Isolate one reactant at a time, then add the exponents before you pick units.</span>';
        } else if (!ordersOk) {
          fb.innerHTML = 'The units idea can wait — the exponents are not yet right.' +
            '<span class="fb-note">Which pair holds one concentration constant?</span>';
        } else {
          fb.innerHTML = 'Orders are right. Units come from the <em>sum</em> of the exponents, not from one reactant.' +
            '<span class="fb-note">If you used only [A]’s order, you will land on a neighbouring total order — those are the distractors.</span>';
        }
        if (state.gateMisses === 2 || state.gateMisses === 4) renderGate();
      }
    });
  }

  function finishPath() {
    SuiteChrome.revealDebrief(DEBRIEF, {
      exclusive: true,
      onRevisit: function (target) {
        SuiteChrome.leaveDebriefStage();
        var map = { hook: 0, isolation: 4, predict: 5, kunits: 6, molecular: 1, ratelaw: 2, warmup: 3, '5.2.A.5': 4, '5.2.A.2': 2, '5.2.A.3': 3, '5.2.A.4': 6, '5.2.A.1': 1 };
        state.step = map[target] != null ? map[target] : 0;
        showStep();
      }
    });
    els.footer.hidden = true;
  }

  function showStep() {
    cancelAnimationFrame(molAnim.raf);
    cancelAnimationFrame(hookAnim.raf);
    if (isoRo) { isoRo.disconnect(); isoRo = null; }
    var id = STEPS[state.step];
    els.helpText.textContent = HELP[id] || '';
    els.helpPanel.classList.remove('open');
    els.stuckBtn.hidden = !HELP[id];
    els.backBtn.hidden = false;
    els.nextBtn.hidden = id === 'gate';
    els.nextBtn.textContent = id === 'summary' ? 'One more practice problem' : 'Next →';
    paintTiers();
    els.frame.hidden = false;
    ({
      hook: renderHook,
      molecular: renderMolecular,
      ratelaw: renderRateLaw,
      warmup: renderWarmup,
      isolation: renderIsolation,
      predict: renderPredict,
      kunits: renderKUnits,
      practice: renderPractice,
      summary: renderSummary,
      gate: renderGate
    })[id]();
    els.kicker.parentElement.hidden = false;
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
      showStep();
    });
    els.nextBtn.addEventListener('click', function () {
      if (state.step < STEPS.length - 1) {
        state.step++;
        showStep();
      }
    });
  }

  init();
})();
