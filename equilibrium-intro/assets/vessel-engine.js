/**
 * Intro to Equilibrium - shared vessel engine (Task 3).
 *
 * One sealed vessel for the Guide stage and the Sandbox.
 *
 * Model (pedagogical, not exact kinetics):
 *   - Progress ξ runs 0 (all reactants) → 1 (all products).
 *     forward rate = kf (1 − ξ), reverse rate = kr ξ, with kf + kr = kTot(T).
 *   - The settled point ξ* = kf / kTot follows the ΔG sign through a compressed drive:
 *     ξ* = 1 / (1 + e^(ΔG / G0)), clamped so both directions always keep happening.
 *     K is never shown (brief: no K / Q).
 *   - Graphs read the smooth ODE. Particles follow it through event budgets
 *     (the Le Châtelier sim's "visual reaction budgeting"), so forward and reverse
 *     events keep firing at equilibrium (principle 1: it never stops).
 *
 * Usage: EqVessel.create({ canvas, reaction: 'n2o4', T: 298, mix: 'reactants' })
 * canvas may be null for headless runs (tests).
 */
(function (global) {
  'use strict';

  var R = global.EqReactions;

  var CFG = {
    G0: 15,            // kJ: drive compression. ΔG of ±15 kJ ≈ 27% / 73% products
    xiMin: 0.04,       // settled point clamp: a few of the minority side always remain
    xiMax: 0.96,
    k298: 0.45,        // 1/s: kf + kr at 298 K. 3τ ≈ 7 s to settle
    kTempExp: 0.8,     // hotter → faster in both directions (rates link)
    histDt: 0.1,       // s between graph samples
    histMax: 400,      // samples kept (40 s)
    eqTol: 0.04,       // |rf − rr| / max(rf, rr) under this = "rates equal"
    W: 100, H: 66,     // default vessel in logical units; H follows the canvas aspect when drawn
    atomScale: 1.9,    // atom radius unit → logical units
    atomPxMax: 10,     // cap on drawn atom radius (px) so big stages don't blow molecules up
    glide: 0.35,       // s: reactants glide together before a forward/reverse event
    flash: 0.45,       // s: event ring
    speed298: 9,       // logical units/s drift at 298 K
  };

  // Particle units per reaction: how many "reaction sets" the vessel holds.
  var UNITS = { n2o4: 20, haber: 12, ozone: 12, ozoneRev: 12, custom: 30 };

  var RIM = 'rgba(40,48,66,0.55)';
  var INK = '#1d2433';

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function create(opts) {
    opts = opts || {};
    var canvas = opts.canvas || null;
    var ctx = canvas ? canvas.getContext('2d') : null;
    var dpr = 1, cw = 0, ch = 0, scale = 1, ox = 0, oy = 0;
    var vw = CFG.W, vh = CFG.H;  // this vessel's logical size
    var outline = !!opts.outline; // draw a vessel wall (off when the stage frame is the vessel)

    var rxn = null;          // working copy (custom signs can change)
    var T = opts.T || R.T_RANGE.start;
    var mix = opts.mix || 'reactants';
    var reduced = opts.reducedMotion != null ? !!opts.reducedMotion :
      !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var running = opts.autoplay !== false;

    var U = 20, xi = 0, t = 0;
    var budF = 0, budR = 0, evF = 0, evR = 0;
    var parts = [], events = [], flashes = [];
    var hist = [], histAcc = 0;
    var listeners = [];
    var raf = 0, lastTs = 0, nextId = 1;

    // ---------- chemistry ----------
    function dGnow() { return R.dG(rxn, T); }
    function kTot() { return CFG.k298 * Math.pow(T / 298, CFG.kTempExp); }
    function xiStar() { return clamp(1 / (1 + Math.exp(dGnow() / CFG.G0)), CFG.xiMin, CFG.xiMax); }
    function rates() {
      var k = kTot(), s = xiStar();
      return { f: k * s * (1 - xi) * U, r: k * (1 - s) * xi * U }; // events per second
    }

    function speciesCounts() {
      var out = {};
      Object.keys(rxn.reactants).forEach(function (s) { out[s] = rxn.reactants[s] * U * (1 - xi); });
      Object.keys(rxn.products).forEach(function (s) { out[s] = (out[s] || 0) + rxn.products[s] * U * xi; });
      return out;
    }

    // ---------- particles ----------
    function speed() { return CFG.speed298 * Math.sqrt(T / 298); }

    function spawn(sp, x, y) {
      var a = Math.random() * Math.PI * 2, v = speed() * (0.6 + Math.random() * 0.6);
      var p = { id: nextId++, sp: sp, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 1.2, busy: false, born: 0 };
      parts.push(p);
      return p;
    }

    function randomSpot() {
      return { x: 6 + Math.random() * (vw - 12), y: 6 + Math.random() * (vh - 12) };
    }

    function placeUnits(side, n) {
      var set = side === 'r' ? rxn.reactants : rxn.products;
      for (var i = 0; i < n; i++) {
        Object.keys(set).forEach(function (sp) {
          for (var k = 0; k < set[sp]; k++) { var q = randomSpot(); spawn(sp, q.x, q.y); }
        });
      }
    }

    function free(sp) { return parts.filter(function (p) { return p.sp === sp && !p.busy; }); }

    // Gather one unit of a side (nearest free particles to a random seed). null if not available.
    function gather(set) {
      var keys = Object.keys(set), pick = [];
      var first = free(keys[0]);
      if (first.length < set[keys[0]]) return null;
      var seed = first[Math.floor(Math.random() * first.length)];
      for (var i = 0; i < keys.length; i++) {
        var pool = free(keys[i]).filter(function (p) { return pick.indexOf(p) < 0; });
        if (pool.length < set[keys[i]]) return null;
        pool.sort(function (a, b) {
          return Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y);
        });
        pick = pick.concat(pool.slice(0, set[keys[i]]));
      }
      return pick;
    }

    function startEvent(dir) {
      var from = dir === 'f' ? rxn.reactants : rxn.products;
      var to = dir === 'f' ? rxn.products : rxn.reactants;
      var g = gather(from);
      if (!g) return false;
      var cx = 0, cy = 0;
      g.forEach(function (p) { p.busy = true; cx += p.x; cy += p.y; });
      cx /= g.length; cy /= g.length;
      events.push({ dir: dir, parts: g, to: to, cx: cx, cy: cy, t: 0, dur: reduced ? 0 : CFG.glide });
      if (dir === 'f') evF++; else evR++;
      return true;
    }

    function finishEvent(e) {
      parts = parts.filter(function (p) { return e.parts.indexOf(p) < 0; });
      Object.keys(e.to).forEach(function (sp) {
        for (var k = 0; k < e.to[sp]; k++) {
          var p = spawn(sp, e.cx + (Math.random() - 0.5) * 3, e.cy + (Math.random() - 0.5) * 3);
          p.born = reduced ? 0 : 0.25;
        }
      });
      if (!reduced) flashes.push({ x: e.cx, y: e.cy, t: 0, dir: e.dir });
    }

    function productUnitsShown() {
      // Units on the product side, counting in-flight events by where they are heading.
      var key = Object.keys(rxn.products)[0], coef = rxn.products[key];
      var n = parts.filter(function (p) { return p.sp === key && !p.busy; }).length / coef;
      events.forEach(function (e) { if (e.dir === 'f') n += 1; });
      // reverse events in flight are removing product units already marked busy (not counted)
      return n;
    }

    // ---------- stepping ----------
    function step(dt) {
      if (!rxn) return;
      t += dt;
      var rt = rates();
      xi = clamp(xi + (rt.f - rt.r) / U * dt, 0, 1);

      // Event budgets track the ODE so particles follow the graphs.
      budF += rt.f * dt; budR += rt.r * dt;
      var guard = 0;
      while (budF >= 1 && guard++ < 6) { if (!startEvent('f')) break; budF -= 1; }
      guard = 0;
      while (budR >= 1 && guard++ < 6) { if (!startEvent('r')) break; budR -= 1; }
      budF = Math.min(budF, 3); budR = Math.min(budR, 3);

      // Drift correction: keep shown product units within one of U·ξ.
      var drift = productUnitsShown() - U * xi;
      if (drift < -1.5) startEvent('f');
      else if (drift > 1.5) startEvent('r');

      // Events: glide reactants together, then swap.
      for (var i = events.length - 1; i >= 0; i--) {
        var e = events[i];
        e.t += dt;
        var k = e.dur ? Math.min(1, dt / Math.max(0.001, e.dur - e.t + dt)) : 1;
        e.parts.forEach(function (p) { p.x += (e.cx - p.x) * k; p.y += (e.cy - p.y) * k; });
        if (e.t >= e.dur) { finishEvent(e); events.splice(i, 1); }
      }
      for (var j = flashes.length - 1; j >= 0; j--) {
        flashes[j].t += dt;
        if (flashes[j].t > CFG.flash) flashes.splice(j, 1);
      }

      // Soft drift with wall bounce. No particle collisions: the vessel pictures, it does not simulate.
      if (!reduced) {
        var v0 = speed();
        parts.forEach(function (p) {
          if (p.born > 0) p.born = Math.max(0, p.born - dt);
          if (p.busy) return;
          p.vx += (Math.random() - 0.5) * v0 * 0.6 * dt;
          p.vy += (Math.random() - 0.5) * v0 * 0.6 * dt;
          var s = Math.hypot(p.vx, p.vy) || 1, m = clamp(s, v0 * 0.5, v0 * 1.4) / s;
          p.vx *= m; p.vy *= m;
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          var pad = 3.5;
          if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx); }
          if (p.x > vw - pad) { p.x = vw - pad; p.vx = -Math.abs(p.vx); }
          if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy); }
          if (p.y > vh - pad) { p.y = vh - pad; p.vy = -Math.abs(p.vy); }
        });
      }

      histAcc += dt;
      while (histAcc >= CFG.histDt) {
        histAcc -= CFG.histDt;
        hist.push(snapshot());
        if (hist.length > CFG.histMax) hist.shift();
      }
    }

    function snapshot() {
      var rt = rates();
      return { t: t, xi: xi, rf: rt.f, rr: rt.r, counts: speciesCounts() };
    }

    // ---------- public state ----------
    function getState() {
      var rt = rates(), mx = Math.max(rt.f, rt.r, 1e-9);
      var equal = Math.abs(rt.f - rt.r) / mx < CFG.eqTol;
      var g = dGnow();
      return {
        reaction: rxn.id, label: rxn.label, T: T, t: t, xi: xi, xiStar: xiStar(),
        rf: rt.f, rr: rt.r, ratesEqual: equal,
        counts: speciesCounts(),
        dH: rxn.dH, mTdS: R.minusTdS(rxn, T), dG: g,
        favours: g < 0 ? 'products' : g > 0 ? 'reactants' : 'neither',
        crossover: R.crossover(rxn),
        eventsForward: evF, eventsReverse: evR,
      };
    }

    // Plain-text summary for a live region (screen readers). Neutral, no narration.
    function summary() {
      var s = getState();
      if (s.ratesEqual) return 'Forward and reverse rates are equal. Particles are still reacting both ways.';
      return s.rf > s.rr ? 'Forward rate is faster than reverse. Products are building up.'
        : 'Reverse rate is faster than forward. Reactants are building up.';
    }

    // ---------- drawing ----------
    function resize() {
      if (!canvas) return;
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      cw = canvas.clientWidth || 600; ch = canvas.clientHeight || 400;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      // The vessel fills the canvas: width stays 100 units, height follows the aspect.
      // Low floor so wide, short canvases (Learn mode with graphs) still fill edge to edge
      var nh = clamp(vw * ch / cw, 25, 160);
      if (nh !== vh) {
        parts.forEach(function (p) { p.y = clamp(p.y * nh / vh, 3.5, nh - 3.5); });
        events.forEach(function (e) { e.cy = e.cy * nh / vh; });
        vh = nh;
      }
      scale = Math.min(cw / vw, ch / vh);
      ox = (cw - vw * scale) / 2; oy = (ch - vh * scale) / 2;
    }

    function atom(x, y, r, el) {
      if (el === 'clear') {
        var c0 = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
        c0.addColorStop(0, 'rgba(255,255,255,0.85)');
        c0.addColorStop(0.7, 'rgba(235,239,246,0.45)');
        c0.addColorStop(1, 'rgba(160,170,190,0.5)');
        ctx.fillStyle = c0;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(29,36,51,0.6)'; ctx.lineWidth = 1.25; ctx.stroke();
      } else {
        var c = R.ATOM[el];
        var g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
        g.addColorStop(0, c[0]); g.addColorStop(0.7, c[1]); g.addColorStop(1, RIM);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.44, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    }

    function molecule(p) {
      var sp = R.SPECIES[p.sp], s = Math.min(CFG.atomScale * scale, CFG.atomPxMax);
      var grow = p.born > 0 ? 1 - p.born / 0.25 * 0.4 : 1;
      var cx = ox + p.x * scale, cy = oy + p.y * scale;
      var cs = Math.cos(p.rot), sn = Math.sin(p.rot);
      // back-to-front by y so overlapping atoms stack sensibly
      sp.atoms.slice().sort(function (a, b) { return (a.x * sn + a.y * cs) - (b.x * sn + b.y * cs); })
        .forEach(function (a) {
          var ax = (a.x * cs - a.y * sn) * s * grow, ay = (a.x * sn + a.y * cs) * s * grow;
          atom(cx + ax, cy + ay, a.r * s * grow, a.el);
        });
    }

    function paintTray() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(29,36,51,0.10)';
      for (var x = 11; x < cw; x += 22) for (var y = 11; y < ch; y += 22) ctx.fillRect(x, y, 1.4, 1.4);
      // Macro cue: NO2 is brown, so the gas tints as products build up
      if (rxn.id === 'n2o4') {
        ctx.fillStyle = 'rgba(154,91,46,' + (0.22 * xi).toFixed(3) + ')';
        ctx.fillRect(ox, oy, vw * scale, vh * scale);
      }
    }

    function draw() {
      if (!ctx || !rxn) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintTray();
      parts.slice().sort(function (a, b) { return a.y - b.y; }).forEach(molecule);
      flashes.forEach(function (f) {
        var k = f.t / CFG.flash;
        ctx.strokeStyle = 'rgba(29,36,51,' + (0.45 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ox + f.x * scale, oy + f.y * scale, (3 + 6 * k) * scale * 0.5, 0, Math.PI * 2); ctx.stroke();
      });
      if (outline) {
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(ox + 1, oy + 1, vw * scale - 2, vh * scale - 2, 14);
        else ctx.rect(ox + 1, oy + 1, vw * scale - 2, vh * scale - 2);
        ctx.stroke();
      }
    }

    function frame(ts) {
      raf = 0;
      var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
      lastTs = ts;
      if (running) step(dt);
      draw();
      listeners.forEach(function (fn) { fn(api); });
      if (running) schedule();
    }

    function schedule() {
      if (canvas && !raf && global.requestAnimationFrame) raf = global.requestAnimationFrame(frame);
    }

    // ---------- setup ----------
    function load(id) {
      var base = R.get(id);
      rxn = JSON.parse(JSON.stringify(base));
      U = UNITS[id] || 20;
      reset();
    }

    function reset() {
      xi = mix === 'products' ? 1 : mix === 'half' ? 0.5 : 0;
      t = 0; budF = 0; budR = 0; evF = 0; evR = 0; histAcc = 0;
      parts = []; events = []; flashes = []; hist = [];
      var nP = Math.round(U * xi);
      placeUnits('r', U - nP);
      placeUnits('p', nP);
      hist.push(snapshot());
      draw();
      listeners.forEach(function (fn) { fn(api); });
    }

    var api = {
      CFG: CFG,
      setReaction: function (id) { load(id); return api; },
      setT: function (v) { T = clamp(v, R.T_RANGE.min, R.T_RANGE.max); return api; },
      // mix: 'reactants' | 'half' | 'products' (takes effect on reset)
      setMix: function (m) { mix = m; reset(); return api; },
      // Custom A ⇌ B only: signs are '+' or '−'
      setSigns: function (dHs, dSs) {
        if (!rxn || !rxn.custom) return api;
        var base = R.get('custom');
        rxn.dH = Math.abs(base.dH) * (dHs === '−' || dHs === '-' ? -1 : 1);
        rxn.dS = Math.abs(base.dS) * (dSs === '−' || dSs === '-' ? -1 : 1);
        return api;
      },
      reset: function () { reset(); return api; },
      play: function () { running = true; lastTs = 0; schedule(); return api; },
      pause: function () { running = false; return api; },
      isRunning: function () { return running; },
      setReducedMotion: function (b) { reduced = !!b; return api; },
      // Guide presets: { reaction, T, mix, signs: ['+', '−'], play }
      preset: function (p) {
        if (p.T != null) T = clamp(p.T, R.T_RANGE.min, R.T_RANGE.max);
        if (p.mix) mix = p.mix;
        load(p.reaction || (rxn && rxn.id) || 'n2o4');
        if (p.signs) api.setSigns(p.signs[0], p.signs[1]);
        if (p.play === false) api.pause(); else api.play();
        return api;
      },
      getState: getState,
      summary: summary,
      history: function () { return hist; },
      reaction: function () { return rxn; },
      onUpdate: function (fn) { listeners.push(fn); return api; },
      resize: function () { resize(); draw(); return api; },
      destroy: function () {
        running = false; listeners = [];
        if (raf && global.cancelAnimationFrame) global.cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
      },
      // Headless stepping for tests and the Guide's "skip ahead"
      advance: function (seconds) { var n = Math.round(seconds / 0.02); for (var i = 0; i < n; i++) step(0.02); draw(); return api; },
      _parts: function () { return parts; },
    };

    var ro = null;
    if (canvas) {
      resize();
      if (global.ResizeObserver) { ro = new global.ResizeObserver(function () { resize(); draw(); }); ro.observe(canvas); }
    }
    load(opts.reaction || 'n2o4');
    if (running) schedule();
    return api;
  }

  global.EqVessel = { create: create };
})(window);
