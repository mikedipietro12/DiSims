/* Solubility Sandbox: one beaker on the real engine. Quiet by design: readouts and axis names only,
   a neutral live summary, no banners or hints.
   Dissolve: pick a salt, add scoops, push it (common ions, acid, temperature where the booklet allows).
   Mix: pour two soluble solutions together and see whether Q > Ksp. */
(function () {
  'use strict';
  const D = SolData, E = SolEngine, U = SolUI, Pic = SolPictures;
  const $ = id => document.getElementById(id);
  const S = D.SALTS, FW = 900, FH = 530;
  // the two soluble solutions that make each salt when mixed (cation source, anion source)
  const PAIR = { AgCl: ['AgNO3', 'NaCl'], PbI2: ['PbNO32', 'KI'], Ag2CrO4: ['AgNO3', 'K2CrO4'], MgOH2: ['MgNO32', 'NaOH'], CaCO3: ['CaNO32', 'Na2CO3'] };
  const DOSE = 0.010; // mol of a reagent per press: 0.10 M in the 100 mL beaker

  const st = { mode: 'dissolve', salt: 'PbI2', scene: null, check: null, readout: null, mix: null, lastSay: '' };
  const cv = $('cv'), g = cv.getContext('2d');

  // ---------- salt picker ----------
  D.SANDBOX_SALTS.forEach(id => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = S[id].html; b.dataset.salt = id;
    b.addEventListener('click', () => { st.salt = id; build(); });
    $('salts').appendChild(b);
  });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { st.mode = b.dataset.mode; build(); }));

  // ---------- dissolve mode ----------
  function stressButtons() {
    const host = $('stressBtns'); host.innerHTML = '';
    const s = S[st.salt];
    const add = (html, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = html; b.addEventListener('click', fn); host.appendChild(b); };
    add('Add a scoop', () => st.scene.scoop());
    s.commonIons.forEach(r => add('Add ' + D.REAGENTS[r].html, () => st.scene.addReagent(r, DOSE)));
    add('Add acid', () => st.scene.acid());
    add('Start over', () => { st.scene.reset(T()); });
  }
  const T = () => +$('temp').value + 273.15;
  function tempControl() {
    const s = S[st.salt], ok = !!s.dHsoln, r = $('temp');
    r.disabled = !ok;
    if (!ok) { r.value = 25; }
    $('tempOut').textContent = r.value + ' °C';
    r.setAttribute('aria-valuetext', r.value + ' degrees Celsius');
    $('tempNote').hidden = ok;
    $('tempNote').innerHTML = ok ? '' : 'The Data Booklet gives no ΔH for ' + s.html + ', so it stays at 25 °C.';
  }
  $('temp').addEventListener('input', () => { tempControl(); if (st.scene) st.scene.setTemperature(T()); });

  // ---------- mix mode ----------
  const fmtM = lg => U.num(Math.pow(10, lg), { sig: 2, sci: 'auto' }).text + ' M';
  function solCtl(id, reagent) {
    const fs = $(id), r = D.REAGENTS[reagent], [c, v] = fs.querySelectorAll('input'), [co, vo] = fs.querySelectorAll('output');
    fs.querySelector('legend').innerHTML = r.html + ' <span class="sbx-dim">(' + r.name + ')</span>';
    const sync = () => {
      co.innerHTML = U.num(Math.pow(10, +c.value), { sig: 2, sci: 'auto', unit: 'M' }).html; vo.textContent = v.value + ' mL';
      c.setAttribute('aria-valuetext', fmtM(+c.value).replace(' M', ' molar')); v.setAttribute('aria-valuetext', v.value + ' millilitres');
    };
    c.oninput = () => { sync(); if (st.mix && st.mix.state !== 'ready') resetMix(); };
    v.oninput = c.oninput;
    sync();
    return () => ({ reagent, conc: +Math.pow(10, +c.value).toPrecision(2), vol: +v.value / 1000, name: fmtM(+c.value) + ' ' + r.formula });
  }
  let partA, partB;
  function resetMix() { st.mix = { state: 'ready', t: 0 }; st.scene = null; }
  $('mixBtn').addEventListener('click', () => { resetMix(); st.mix.parts = [partA(), partB()]; st.mix.state = 'pouring'; });
  $('mixReset').addEventListener('click', resetMix);
  function finishPour() {
    const sc = SolScene.create({ salt: st.salt, volume: 0.100 });
    sc.loadBeaker(E.mix(st.mix.parts)); sc.chemRate = 0.35; sc.warm(0.3);
    st.scene = sc; st.mix.state = 'mixed'; st.mix.t = 1;
  }

  // ---------- (re)build for the current mode and salt ----------
  function build() {
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
    Array.from($('salts').children).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.salt === st.salt)));
    $('dissolveCtl').hidden = st.mode !== 'dissolve'; $('mixCtl').hidden = st.mode !== 'mix';
    $('check').innerHTML = ''; $('readout').innerHTML = '';
    st.check = U.qvkForSalt($('check'), D, st.salt);
    const s = S[st.salt];
    // pH only for the hydroxide: carbonate's pH reads oddly without hydrolysis (design-state, Task 8)
    const rows = st.mode === 'mix' ? ['cat', 'an', 'Q', 'ksp', 'solid'] : ['s', 'cat', 'an', 'Q', 'ksp', 'solid'].concat(s.pH === 'hydroxide' ? ['pH'] : []);
    st.readout = U.saltReadout($('readout'), D, st.salt, { only: rows });
    if (st.mode === 'dissolve') {
      tempControl();
      st.scene = SolScene.create({ salt: st.salt, volume: 0.100 });
      st.scene.reset(T()); st.scene.warm(0.5); st.mix = null;
      stressButtons();
      cv.setAttribute('aria-label', 'A beaker of water for ' + s.name + ' and a zoomed window of the ions.');
    } else {
      partA = solCtl('solA', PAIR[st.salt][0]); partB = solCtl('solB', PAIR[st.salt][1]);
      resetMix();
      cv.setAttribute('aria-label', 'Two solutions ready to pour into one beaker: ' + D.REAGENTS[PAIR[st.salt][0]].name + ' and ' + D.REAGENTS[PAIR[st.salt][1]].name + '.');
    }
    st.lastSay = '';
    fit();
  }

  // ---------- drawing ----------
  let dpr = 1, cw = 1, ch = 1;
  function fit() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1); cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    draw();
  }
  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    const k = Math.min(cw / FW, ch / FH), ox = (cw - FW * k) / 2, oy = (ch - FH * k) / 2;
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    if (st.mode === 'mix') {
      const parts = st.mix.parts || [partA(), partB()];
      const W = { x: 650, y: 265, r: 215 };
      if (st.scene) st.scene.draw(g, { beaker: Pic.MIXED, win: W });
      Pic.mixSources(g, parts, st.mix.t, null, null, null, { mixed: !st.scene }); // the beakers tip over the mixed one, so they go on top
      if (!st.scene) {
        SolDraw.lensBack(g, W); SolDraw.lensFront(g, W);
        Pic.label(g, st.mix.state === 'ready' ? 'Not mixed yet' : 'Mixing…', W.x, W.y, { size: 20, weight: '400', color: '#5b6474' });
      }
    } else if (st.scene) st.scene.draw(g, { beaker: { x: 70, y: 70, w: 270, h: 380 }, win: { x: 640, y: 255, r: 225 } });
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (st.mix && st.mix.state === 'pouring') { st.mix.t = Math.min(1, st.mix.t + dt / 3.2); if (st.mix.t >= 1) finishPour(); }
    if (st.scene) {
      $('readout').hidden = false;
      st.scene.step(dt);
      const all = st.scene.state();
      st.readout.update(all, st.scene.beaker.T);
      st.check.updateFrom(all, st.salt);
      // the live summary only speaks when the situation changes (not every number)
      const say = st.scene.beaker.summary(st.salt);
      if (say && say !== st.lastSay && all.settled) { st.lastSay = say; $('live').textContent = say; }
    } else if (st.check) {
      $('readout').hidden = true;
      st.check.update({ q: 0, ksp: S[st.salt].ksp, relation: '<', status: st.mix && st.mix.state === 'pouring' ? 'Mixing…' : 'Not mixed yet' });
    }
    draw();
    requestAnimationFrame(frame);
  }
  cv.addEventListener('click', () => {
    if (st.mix && st.mix.state === 'pouring') finishPour();
    if (st.scene) st.scene.settle();
  });
  if (window.ResizeObserver) new ResizeObserver(fit).observe(cv.parentElement);
  addEventListener('resize', fit);

  // dev hooks for headless checks: ?salt=MgOH2&mode=mix&scoops=3&press=Add acid&settle=1&mix=now
  const q = new URLSearchParams(location.search);
  if (q.has('salt') && S[q.get('salt')]) st.salt = q.get('salt');
  if (q.get('mode') === 'mix') st.mode = 'mix';
  build();
  if (q.has('scoops') && st.scene) st.scene.scoop(+q.get('scoops'));
  if (q.has('press')) Array.from($('stressBtns').querySelectorAll('button')).filter(b => b.textContent.startsWith(q.get('press'))).forEach(b => b.click());
  if (q.has('mix') && st.mode === 'mix') { $('mixBtn').click(); if (q.get('mix') === 'now') finishPour(); }
  if (q.has('settle') && st.scene) st.scene.settle();
  requestAnimationFrame(frame);
})();
