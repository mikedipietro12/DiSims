/* Qual Lab: follow the Pb²⁺ / Sr²⁺ / Mg²⁺ scheme on a random unknown.
   Each step: add the reagent, look, choose the branch (solid or clear), then centrifuge and pour off
   if a solid formed. The notebook keeps every observation. At the end, pick the ions, then reveal.
   Nothing is saved. The chemistry is SolQual on the real engine. */
(function () {
  'use strict';
  const D = SolData, U = SolUI, Pic = SolPictures, Q = SolQual;
  const $ = id => document.getElementById(id);
  const FW = 600, FH = 530;
  const ION = { 'Pb2+': 'Pb<sup>2+</sup>', 'Sr2+': 'Sr<sup>2+</sup>', 'Mg2+': 'Mg<sup>2+</sup>' };
  const REAG = ['KI', 'Na<sub>2</sub>SO<sub>4</sub>', 'NaOH'], REAG_TXT = ['KI', 'Na₂SO₄', 'NaOH'];
  const cv = $('cv'), g = cv.getContext('2d');
  let css = null; const tok = n => { if (!css) css = getComputedStyle(document.documentElement); return css.getPropertyValue(n).trim(); };

  // st.phase per step: 'add' → 'look' → ('spin' → 'pour') → next step; 'done' after the last look
  let st;
  function newUnknown(pick) {
    const all = Q.allUnknowns();
    const ions = pick != null ? all[pick] : all[Math.floor(Math.random() * all.length)];
    st = { run: Q.start(ions), step: 0, phase: 'add', res: null, anim: null, kept: [], rows: [], wrongTry: false };
    $('book').innerHTML = '<tr class="ql-empty"><td colspan="3">Nothing recorded yet.</td></tr>';
    $('final').hidden = true; $('result').innerHTML = ''; $('numbers').hidden = true; $('numbers').open = false;
    Array.from($('picks').children).forEach(b => b.setAttribute('aria-pressed', 'false'));
    say('A new unknown is in the tube. Step 1: add KI.');
    render();
  }
  function say(t) { $('obs').innerHTML = t; }

  // ---------- the scheme, as buttons in a flowchart ----------
  function render() {
    const ol = $('scheme'); ol.innerHTML = '';
    Q.steps.forEach((step, i) => {
      const li = document.createElement('li');
      li.className = 'ql-node' + (i === st.step && st.phase !== 'done' ? ' is-current' : i < st.step || st.phase === 'done' ? ' is-done' : '');
      const name = ['Pb<sup>2+</sup>', 'Sr<sup>2+</sup>', 'Mg<sup>2+</sup>'][i];
      li.innerHTML = '<h3>' + (i + 1) + '. Add ' + REAG[i] + '</h3><p class="ql-branch">Solid? ' + ['yellow', 'white', 'white'][i] + ' solid means ' + name + '.' +
        (i < 2 ? ' Then centrifuge and pour off the liquid.' : '') + '</p>';
      if (i === st.step && st.phase !== 'done') {
        const row = document.createElement('div'); row.className = 'sbx-row';
        const btn = (label, fn, primary) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (primary ? ' primary' : ''); b.innerHTML = label; b.addEventListener('click', fn); row.appendChild(b); return b; };
        if (st.phase === 'add') btn('Add ' + REAG[i], () => addReagent(i), true);
        if (st.phase === 'look') {
          const p = document.createElement('p'); p.className = 'ql-ask'; p.textContent = 'What do you see?'; li.appendChild(p);
          btn('A solid formed', () => choose(true));
          btn('It stayed clear', () => choose(false));
        }
        if (st.phase === 'spin') btn('Centrifuge', spin, true);
        if (st.phase === 'pour') btn('Pour off the liquid', pour, true);
        if (st.phase === 'busy') btn('…', () => {}).disabled = true;
        li.appendChild(row);
        if (st.wrongTry) { const p = document.createElement('p'); p.className = 'ql-try'; p.textContent = 'Look at the tube again.'; li.appendChild(p); }
      }
      ol.appendChild(li);
      if (i < Q.steps.length - 1) { const a = document.createElement('li'); a.className = 'ql-arrow'; a.setAttribute('aria-hidden', 'true'); a.textContent = '↓'; ol.appendChild(a); }
    });
  }
  function addReagent(i) {
    st.res = Q.add(st.run, i);
    st.phase = 'busy'; st.wrongTry = false; render();
    st.anim = { kind: 'add', t0: performance.now(), res: st.res };
    say('Adding ' + REAG[i] + '…');
    showNumbers(st.res);
    setTimeout(() => {
      st.phase = 'look'; render();
      say('Look at the tube. Did a solid form?');
    }, 1900);
  }
  function choose(saidSolid) {
    const r = st.res, solid = Object.keys(r.solids).length > 0;
    if (saidSolid !== solid) { st.wrongTry = true; render(); return; }
    const target = ION[r.target];
    record(st.step, r.words.replace('.', '') + (solid ? '' : ''), solid ? target + ' present' : 'No ' + target);
    say(r.words + ' ' + (solid ? target + ' is present.' : 'No ' + target + '.'));
    if (solid && st.step < 2) st.phase = 'spin';
    else next();
    render();
  }
  function spin() {
    st.phase = 'busy'; render(); say('Centrifuging: the solid packs at the bottom.');
    st.anim = { kind: 'spin', t0: performance.now(), res: st.res };
    setTimeout(() => { st.phase = 'pour'; st.anim = { kind: 'packed', res: st.res }; render(); say('The solid is packed at the bottom. Pour off the liquid into a clean tube.'); }, 1400);
  }
  function pour() {
    st.phase = 'busy'; render(); say('Pouring off the liquid…');
    st.anim = { kind: 'pour', t0: performance.now(), res: st.res };
    setTimeout(() => {
      Q.decant(st.run);
      st.kept.push({ step: st.step, colour: tok(st.res.colour), mg: Object.values(st.res.solids)[0] });
      st.anim = null; next(); render();
      say('The liquid is in a clean tube. Step ' + (st.step + 1) + ': add ' + REAG[st.step] + '.');
    }, 1500);
  }
  function next() {
    if (st.step >= 2) { st.phase = 'done'; $('final').hidden = false; say('All three tests are done. Decide which ions are in your unknown.'); return; }
    st.step++; st.phase = 'add'; st.res = null; st.anim = null; $('numbers').hidden = true; $('numbers').open = false;
  }
  function record(i, obs, concl) {
    if (!st.rows.length) $('book').innerHTML = '';
    st.rows.push(i);
    const tr = document.createElement('tr');
    tr.innerHTML = '<th scope="row">' + (i + 1) + '. ' + REAG[i] + '</th><td>' + obs + '</td><td>' + concl + '</td>';
    $('book').appendChild(tr);
  }
  // Q vs Ksp at the moment the reagent went in, for each solid it could make
  function showNumbers(r) {
    const host = $('checks'); host.innerHTML = '';
    r.checks.forEach(c => {
      const h = document.createElement('div'); host.appendChild(h);
      const chk = U.qvkForSalt(h, D, c.id);
      chk.update({ q: c.q, ksp: c.ksp, snap: true, status: c.q === 0 ? 'Q = 0: none of one ion is there' : c.q > c.ksp ? 'Q > Ksp: a solid forms' : 'Q < Ksp: no solid' });
      const p = document.createElement('p'); p.className = 'ql-qline';
      p.innerHTML = D.SALTS[c.id].html + ': Q = ' + U.num(c.q, { sci: 'always', sig: 2 }).html + ', K<sub>sp</sub> = ' + U.num(c.ksp, { sci: 'always', sig: 2 }).html;
      h.prepend(p);
    });
    $('numbers').hidden = false;
  }

  // ---------- final answer ----------
  Q.ions.forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.innerHTML = ION[k]; b.dataset.ion = k; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
    $('picks').appendChild(b);
  });
  $('reveal').addEventListener('click', () => {
    const picked = Array.from($('picks').children).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.ion);
    const truth = st.run.ions;
    const list = a => a.length ? a.map(k => ION[k]).join(', ') : 'none of the three';
    const right = picked.length === truth.length && picked.every(k => truth.includes(k));
    $('result').innerHTML = '<strong>The unknown contained ' + list(truth) + '.</strong> You chose ' + list(picked) + '. ' +
      (right ? 'Your conclusion matches.' : 'Check your notebook: which observation points to each ion?');
  });
  $('newUnknown').addEventListener('click', () => newUnknown());

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
    const now = performance.now(), a = st.anim, cx = 360, top = 110, w = 96, h = 340;
    // separated solids, kept aside on the left
    st.kept.forEach((kp, i) => {
      Pic.tube(g, 50 + i * 74, 300, 48, 170, { level: 0.1, solid: { colour: kp.colour, mg: kp.mg, packed: true } });
      Pic.label(g, 'step ' + (kp.step + 1), 50 + i * 74, 496, { size: 14, mono: true, weight: '400', color: '#5b6474' });
    });
    if (st.kept.length) Pic.label(g, 'solids kept aside', 50 + (st.kept.length - 1) * 37, 270, { size: 14, mono: true, weight: '400', color: '#5b6474' });
    const r = a && a.res, solidId = r && Object.keys(r.solids)[0], colour = solidId ? tok(D.SALTS[solidId].colour) : null, mg = solidId ? r.solids[solidId] : 0;
    if (!a) { Pic.tube(g, cx, top, w, h, { level: 0.75 }); }
    else if (a.kind === 'add') {
      const t = (now - a.t0) / 1000;
      Pic.tube(g, cx, top, w, h, { level: 0.75, drop: { t: Math.min(1, t / 0.5), label: REAG_TXT[st.step] },
        cloud: solidId ? { colour, mg, t: Math.max(0, Math.min(1, (t - 0.5) / 2.2)) } : null, seed: 11 + st.step });
    } else if (a.kind === 'spin') {
      const t = (now - a.t0) / 1000;
      g.save(); g.translate(cx, top + h / 2); g.rotate(t * 14); g.translate(-cx, -(top + h / 2)); g.globalAlpha = 0.9;
      Pic.tube(g, cx, top, w, h, { level: 0.75, solid: { colour, mg } }); g.restore();
      Pic.label(g, 'centrifuge', cx, top + h + 50, { size: 17, mono: true });
    } else if (a.kind === 'packed') {
      Pic.tube(g, cx, top, w, h, { level: 0.75, solid: { colour, mg, packed: true } });
    } else if (a.kind === 'pour') {
      const t = Math.min(1, (now - a.t0) / 1300);
      Pic.tube(g, cx + 120, top + 40, w, h - 40, { level: 0.82 * t });
      Pic.tube(g, cx - 40, top - 20, w, h, { level: 0.75 * (1 - t) + 0.08, tilt: 1.15 * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2), solid: { colour, mg, packed: true } });
    }
  }
  let raf = 0;
  function frame() { draw(); raf = requestAnimationFrame(frame); }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(cv.parentElement);
  addEventListener('resize', fit);

  // dev hook for headless checks: ?unknown=0..7&auto=N (play N actions with the right choices)
  const q = new URLSearchParams(location.search);
  newUnknown(q.has('unknown') ? +q.get('unknown') : null);
  fit(); frame();
  window.__qual = { state: () => st, addReagent, choose, spin, pour };
})();
