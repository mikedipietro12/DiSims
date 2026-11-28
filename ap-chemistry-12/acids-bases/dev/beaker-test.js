// Beaker physics self-test (dev only): dev/run.html?page=review.html&test=beaker-test.js&selftest
// The mixture pours, spreads out, nothing overlaps at the same depth, and the reaction leaves exactly the excess.
(function () {
  const errs = [];
  window.addEventListener('error', e => errs.push(e.message + ' @' + (e.lineno || '')));
  window.addEventListener('load', () => setTimeout(go, 300));
  // run the physics directly: the mixture of Part 1.3 (6 H₃O⁺ + 6 Cl⁻, 3 OH⁻ + 3 Na⁺), 60 frames a second
  const spec = { acid: { title: 'acid', vol: 30.0, list: [].concat(...Array(6).fill(['H3O', 'Cl']), Array(12).fill('H2O')) },
    base: { title: 'base', vol: 20.0, list: [].concat(...Array(3).fill(['OH', 'Na']), Array(8).fill('H2O')) }, mixTitle: 'mix' };
  function go() {
    const cv = document.createElement('canvas'); cv.width = 760; cv.height = 230; const g = cv.getContext('2d');
    let t = 0;
    for (let i = 0; i < 120; i++) { t += 1 / 60; window.AbDraw.mixScene(g, 760, 230, spec, Math.min(1, i / 100), t); }   // pour
    window.__pourSpread = window.AbDraw.__lastMix.parts.filter(p => p.kind !== 'H2O').map(p => p.y);
    window.__doneAt = null;
    for (let i = 0; i < 600; i++) {                                                                                     // react, 10 s
      t += 1 / 60; window.AbDraw.mixScene(g, 760, 230, spec, 2, t);
      if (window.__doneAt == null && !window.AbDraw.__lastMix.parts.some(p => p.kind === 'OH')) window.__doneAt = i / 60;
    }
    // the Kw beaker: pure water (target 3 and 3), then 0.10 M HCl (lh = −1)
    const kc = document.createElement('canvas'); kc.width = 760; kc.height = 400; const kg = kc.getContext('2d');
    let tk = 0, samples = [], b = null;
    for (let i = 0; i < 900; i++) { tk += 1 / 60; b = window.AbDraw.solutionWindow(kg, { x: 20, y: 136, w: 456, h: 248 }, null, tk, { key: 'kwtest', react: 'kw', target: { H3O: 3, OH: 3 }, size: 11, water: 64 }); if (i > 300 && i % 30 === 0) samples.push(b.parts.filter(p => p.kind === 'H3O').length); if (i === 300) b.recombined = b.formed = 0; }
    window.__kwEvents = b.recombined; window.__kwFormed = b.formed;
    window.__kwWater = samples;
    for (let i = 0; i < 600; i++) { tk += 1 / 60; b = window.AbDraw.solutionWindow(kg, { x: 20, y: 136, w: 456, h: 248 }, null, tk, { key: 'kwtest', react: 'kw', target: { H3O: 28, OH: 1 }, size: 11, water: 64 }); }
    window.__kwAcid = [b.parts.filter(p => p.kind === 'H3O').length, b.parts.filter(p => p.kind === 'OH').length];
    // show the settled pictures at the top of the page, for a screenshot
    const show = document.createElement('div'); show.style.cssText = 'position:fixed;top:120px;left:0;z-index:98;background:#fff;display:flex;flex-direction:column';
    [cv, kc].forEach(c => { c.style.width = '760px'; show.appendChild(c); });
    document.body.appendChild(show);
    report();
  }
  function report() {
    const out = [], ok = (n, c, x) => out.push((c ? 'PASS ' : 'FAIL ') + n + (c || x == null ? '' : '  ' + x));
    const m = window.AbDraw.__lastMix;
    ok('no script errors', errs.length === 0, errs.join(' | '));
    if (m) {
      const ys = window.__pourSpread, spread = Math.max(...ys) - Math.min(...ys);
      ok('poured particles spread through the mixture within 2 s', spread > 40, Math.round(spread));
      const n = k => m.parts.filter(p => p.kind === k).length;
      ok('reaction leaves 3 H₃O⁺, 0 OH⁻, 6 new H₂O (6 H₃O⁺ + 3 OH⁻); all 20 waters poured in', n('H3O') === 3 && n('OH') === 0 && n('Wn') === 6 && n('H2O') === 20, 'H3O ' + n('H3O') + ' OH ' + n('OH') + ' Wn ' + n('Wn') + ' H2O ' + n('H2O'));
      let overlaps = 0;
      m.parts.forEach((a, i) => m.parts.slice(i + 1).forEach(b => { if (Math.abs(a.z - b.z) < 0.5 && Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.6) overlaps++; }));
      ok('no deep overlaps at the same depth', overlaps <= 1, overlaps);
      ok('the reaction is over within 5 s', window.__doneAt != null && window.__doneAt < 5, window.__doneAt);
      const w = window.__kwWater, mean = w.reduce((a, x) => a + x, 0) / w.length;
      ok('pure water: H₃O⁺ comes and goes but stays about 3', mean >= 1.5 && mean <= 4 && Math.max(...w) <= 5, w.join(','));
      ok('pure water keeps exchanging: waters form H₃O⁺ + OH⁻ and they recombine, again and again (10 s)', window.__kwEvents >= 3 && window.__kwFormed >= 3, 'formed ' + window.__kwFormed + ', recombined ' + window.__kwEvents);
      ok('0.10 M HCl: about 28 H₃O⁺ and 1 OH⁻', Math.abs(window.__kwAcid[0] - 28) <= 2 && window.__kwAcid[1] <= 2, window.__kwAcid.join(' / '));
    } else ok('mixture found', false);
    const pre = document.createElement('pre'); pre.textContent = out.join('\n'); pre.style.cssText = 'position:fixed;top:0;left:0;z-index:99;background:#fff;margin:0;font-size:11px'; document.body.prepend(pre);
  }
})();
