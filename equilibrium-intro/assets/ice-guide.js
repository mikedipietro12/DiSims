/* ICE Tables page controller: scroll tracking, the stage for each section, Example / Your turn, presentation view.
   Same reading model as the Solubility and Intro to Equilibrium Guides: the section nearest the reading line drives
   the stage; presentation view hides the text and steps through each worked line, then Your turn and its answer,
   then the next section. Content lives in ice-data.js; components in ice-ui.js.
   Stage layout: the problem across the top; the ICE table on the left with any picture under it; the working on
   the right. The step buttons sit in a footer at the bottom right that never moves (Your turn's Check buttons on its left). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const U = window.IceUI, D = window.IceData.SECTIONS;
  const beats = Array.from(document.querySelectorAll('.guide-beat'));
  const top = $('top'), left = $('left'), right = $('right'), grid = $('grid'), modes = $('modes');
  const footL = $('footL'), footR = $('footR');
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  let active = null, cur = null;

  // ---------- one section on the stage ----------
  function clear() {
    if (cur && cur.bulb) cur.bulb.destroy();
    top.innerHTML = ''; left.innerHTML = ''; right.innerHTML = ''; footL.innerHTML = ''; footR.innerHTML = '';
    grid.scrollTop = 0;
  }
  // which parts of the stage are in use, so presentation view drops an empty row or column
  function markGrid() {
    grid.classList.toggle('no-top', !top.childElementCount);
    grid.classList.toggle('no-left', !left.childElementCount);
  }
  function applyBeat(b) {
    if (!b || b === active) return;
    beats.forEach(x => x.classList.toggle('is-active', x === b));
    active = b;
    $('badge').innerHTML = b.dataset.badge || '';
    load(b.id, 'ex');
  }
  function load(id, mode) {
    clear();
    const sec = D[id];
    cur = { id, sec, mode };
    modes.hidden = !(sec && sec.you);
    modes.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    grid.className = 'ice-grid';
    if (!sec) return loadStatic(id);
    if (mode === 'you') loadYou(sec.you); else loadExample(sec);
    markGrid();
  }
  function setMode(mode, allSteps) {
    if (!cur || cur.mode === mode) return;
    load(cur.id, mode);
    if (allSteps && cur.steps) cur.steps.all();
  }
  modes.addEventListener('click', e => { const b = e.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode); });

  // Before we begin and the summary: a picture made of HTML, kept in a <template> on the page
  function loadStatic(id) {
    const tpl = $('tpl-' + id);
    grid.classList.add('one-col');
    if (tpl) left.appendChild(tpl.content.cloneNode(true));
  }

  function loadExample(sec) {
    if (sec.problem) top.appendChild(el('div', 'ice-card ice-problem', sec.problem));
    if (sec.table) { cur.table = U.table(sec.table, 'walk'); left.appendChild(cur.table.el); }
    if (sec.bulb) {
      cur.bulb = U.bulb(left, sec.bulb);
      left.appendChild(el('p', 'ice-cap', sec.bulb.cap || 'Zoomed in, not to scale. The numbers of particles are in proportion to the concentrations.'));
    }
    if (sec.gauge) { cur.gauge = U.gauge(left, sec.gauge); cur.gauge.set(null); }
    cur.steps = U.steps(right, sec.steps, { table: cur.table, bar: footR, onStep: (i, line, forward) => syncPicture(sec, sec.steps, i, line, forward) });
  }
  // the bulb and gauge follow the newest step that names a state for them
  function syncPicture(sec, lines, i, line, forward) {
    if (cur.bulb) {
      let name = sec.bulb.initial;
      for (let k = 0; k <= i; k++) if (lines[k].bulb) name = lines[k].bulb;
      cur.bulb.goTo(name, forward && !!line && line.bulb === name);
    }
    if (cur.gauge) {
      let g = null;
      for (let k = 0; k <= i; k++) if (lines[k].gauge) g = lines[k].gauge;
      cur.gauge.set(g);
    }
  }

  // ---------- Your turn ----------
  function loadYou(you) {
    top.appendChild(el('div', 'ice-card ice-problem is-you', you.problem));
    if (you.hint) top.appendChild(el('p', 'ice-hint', you.hint));
    const fillable = !!(you.table || you.boxes || you.parts); // Example A: nothing to type, worked on paper
    right.appendChild(el('p', 'ice-howto', !fillable ? 'Work it out on paper first. Then press “Show the answer” to check it one step at a time.'
      : you.parts ? 'For each mixture, type its Q value and choose which way the reaction shifts. Press “Check” to see which answers are right. Nothing is saved.'
      : 'Type each answer into its box. You can write expressions such as <b>0.80 − x</b> or <b>+2x</b>. Press “Check” to see which boxes are right. Nothing is saved.'));
    if (you.table) { cur.table = U.table(you.table, 'input'); left.appendChild(cur.table.el); }
    const work = el('div', 'ice-work');
    if (you.boxes) { cur.boxes = U.boxes(you.boxes); work.appendChild(cur.boxes.el); }
    if (you.parts) { cur.parts = parts(you.parts); work.appendChild(cur.parts.el); }
    if (work.childElementCount) right.appendChild(work);
    const bar = el('div', 'ice-bar'); // in the footer, so it stays put
    const bCheck = el('button', 'btn primary', 'Check'); bCheck.type = 'button';
    const bShow = el('button', fillable ? 'btn' : 'btn primary', 'Show the answer'); bShow.type = 'button';
    const bAgain = el('button', 'btn btn-sm', 'Start over'); bAgain.type = 'button';
    if (fillable) bar.append(bCheck, bShow, bAgain); else bar.append(bShow);
    const fb = el('p', 'ice-feedback'); fb.setAttribute('aria-live', 'polite');
    const ans = el('div', 'ice-answer'); ans.hidden = true;
    footL.appendChild(bar);
    if (fillable) right.appendChild(fb);
    right.appendChild(ans);
    cur.ansHost = ans; cur.bShow = bShow;
    bCheck.addEventListener('click', () => {
      const r = { right: 0, wrong: 0, blank: 0 };
      [cur.table, cur.boxes, cur.parts].forEach(x => { if (!x) return; const o = x.check(); r.right += o.right; r.wrong += o.wrong; r.blank += o.blank; });
      const filled = r.right + r.wrong;
      fb.className = 'ice-feedback' + (filled && !r.wrong ? ' is-good' : r.wrong ? ' is-bad' : '');
      fb.innerHTML = !filled ? 'Fill in some boxes first, then press “Check”.'
        : r.right + ' of ' + filled + ' correct.' + (r.wrong ? ' Red boxes need another look' + (cur.table ? '. In the table, “Show” gives the answer for that box.' : '.') : r.blank ? ' Some boxes are still empty.' : ' All correct.');
    });
    bShow.addEventListener('click', showAnswer);
    bAgain.addEventListener('click', () => { load(cur.id, 'you'); });
    const first = cur.table ? cur.table.firstInput() : null;
    if (first && !document.body.classList.contains('learn-mode') && cur.focusYou) first.focus();
  }
  function showAnswer() {
    const you = cur.sec.you;
    if (!cur.ans) {
      cur.ansHost.hidden = false;
      cur.ansHost.appendChild(el('p', 'ice-answer-head', 'The answer, one step at a time'));
      cur.ans = U.steps(cur.ansHost, you.steps, { table: cur.table, bar: footR, onStep: i => {
        const done = i === you.steps.length - 1;
        if (cur.boxes) cur.boxes.showAnswers(done);
        if (cur.parts) cur.parts.showAnswers(done);
      } });
      cur.bShow.disabled = true;
    }
    cur.ans.next();
  }
  function hideAnswer() { load(cur.id, 'you'); }

  // Example D's Your turn: a Q box and a shift choice for each mixture
  const SHIFT = [['products', 'Shifts to products'], ['reactants', 'Shifts to reactants'], ['none', 'At equilibrium']];
  function parts(list) {
    const root = el('div', 'ice-parts');
    const rows = list.map(p => {
      const row = el('div', 'ice-part');
      row.appendChild(el('p', 'ice-part-lab', p.label));
      const qRow = el('label', 'ice-box');
      const inp = el('input', 'ice-in'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
      const qAns = el('span', 'ice-box-ans', p.q); qAns.hidden = true;
      qRow.append(el('span', 'ice-box-lab', 'Q'), el('span', 'ice-box-eq', '='), inp, qAns);
      const seg = el('div', 'seg ice-shift'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Which way it shifts');
      const btns = SHIFT.map(([k, t]) => {
        const b = el('button', 'btn btn-sm', t); b.type = 'button'; b.dataset.shift = k; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => { btns.forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.classList.remove('is-right', 'is-wrong'); }); });
        seg.appendChild(b); return b;
      });
      inp.addEventListener('input', () => qRow.classList.remove('is-right', 'is-wrong'));
      row.append(qRow, seg); root.appendChild(row);
      return { p, qRow, inp, qAns, btns };
    });
    return {
      el: root,
      check() {
        const out = { right: 0, wrong: 0, blank: 0 };
        rows.forEach(r => {
          const v = r.inp.value.trim();
          r.qRow.classList.remove('is-right', 'is-wrong');
          if (!v) out.blank++;
          else { const ok = U.same(v, r.p.q); r.qRow.classList.add(ok ? 'is-right' : 'is-wrong'); out[ok ? 'right' : 'wrong']++; }
          const pick = r.btns.find(b => b.getAttribute('aria-pressed') === 'true');
          r.btns.forEach(b => b.classList.remove('is-right', 'is-wrong'));
          if (!pick) out.blank++;
          else { const ok = pick.dataset.shift === r.p.shift; pick.classList.add(ok ? 'is-right' : 'is-wrong'); out[ok ? 'right' : 'wrong']++; }
        });
        return out;
      },
      showAnswers(on) {
        rows.forEach(r => {
          r.qAns.hidden = !on; r.qRow.classList.toggle('is-answered', on);
          r.btns.forEach(b => b.classList.toggle('is-answer', on && b.dataset.shift === r.p.shift));
        });
      }
    };
  }

  // ---------- scroll: the section nearest the reading line drives the stage ----------
  let activeDist = Infinity, pinUntil = 0;
  const HYSTERESIS = 56;
  function pickBeatFromScroll() {
    if (Date.now() < pinUntil) return;
    const mid = innerHeight * 0.38; let best = null, bestDist = Infinity;
    activeDist = Infinity;
    beats.forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 80) return;
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (b === active) activeDist = dist;
      if (dist < bestDist) { bestDist = dist; best = b; }
    });
    const lastBeat = beats[beats.length - 1];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && lastBeat.getBoundingClientRect().top < innerHeight - 80) { best = lastBeat; bestDist = -Infinity; }
    if (best && best !== active && bestDist + HYSTERESIS < activeDist) applyBeat(best);
  }
  let tick = 0;
  addEventListener('scroll', () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; pickBeatFromScroll(); }); }, { passive: true });
  function goToBeat(id) { const b = $(id); if (!b) return; pinUntil = Date.now() + 700; applyBeat(b); }
  document.querySelectorAll('.guide-toc a[href^="#"], .guide-beat a[href^="#"]').forEach(a => a.addEventListener('click', () => goToBeat(a.getAttribute('href').slice(1))));
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id) goToBeat(id); });
  // the "Your turn" links in the text open that section's Your turn
  document.querySelectorAll('[data-open-you]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const b = a.closest('.guide-beat'); goToBeat(b.id); cur.focusYou = true; setMode('you');
  }));

  // ---------- presentation view ----------
  // ‹ › / arrow keys / clicker: the next worked line, then Your turn, then its answer line by line, then the next section.
  const learnToggle = $('learnToggle'), LEARN_KEY = 'ice-guide-learn';
  const learnOn = () => document.body.classList.contains('learn-mode');
  const q = new URLSearchParams(location.search);
  const noScroll = q.has('beat'); // headless shots go blank after a scroll
  function scrollToBeat(b, smooth) {
    if (noScroll) return;
    const r = b.getBoundingClientRect();
    scrollTo({ top: Math.max(0, scrollY + r.top + r.height / 2 - innerHeight * 0.38), behavior: smooth ? 'smooth' : 'auto' });
  }
  function stepBeat(dir) {
    const i = beats.indexOf(active) + dir;
    if (i < 0 || i >= beats.length) return;
    goToBeat(beats[i].id); scrollToBeat(beats[i], true);
  }
  SectionJump.attach({
    badge: $('badge'), beats,
    current: () => active,
    go: b => { goToBeat(b.id); scrollToBeat(b, true); },
    label: b => b.dataset.nav || null
  });
  function next() {
    if (!cur) return stepBeat(1);
    if (cur.mode === 'ex' && cur.steps && cur.steps.index < cur.steps.length) { cur.steps.next(); return; }
    if (cur.mode === 'ex' && cur.sec && cur.sec.you) { setMode('you'); return; }
    if (cur.mode === 'you' && (!cur.ans || cur.ans.index < cur.ans.length)) { showAnswer(); return; }
    stepBeat(1);
  }
  function back() {
    if (cur && cur.mode === 'you') {
      if (cur.ans && cur.ans.index > 1) { cur.ans.back(); return; }
      if (cur.ans) { hideAnswer(); return; }
      setMode('ex', true); return;
    }
    if (cur && cur.steps && cur.steps.index > 0) { cur.steps.back(); return; }
    stepBeat(-1);
  }
  function setLearn(on) {
    document.body.classList.toggle('learn-mode', on);
    learnToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(LEARN_KEY, on ? '1' : '0'); } catch (e) { /* private window */ }
    if (active) { pinUntil = Date.now() + 300; scrollToBeat(active, false); }
  }
  learnToggle.addEventListener('click', () => setLearn(!learnOn()));
  $('learnPrev').addEventListener('click', back);
  $('learnNext').addEventListener('click', next);
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'p' || e.key === 'P') && !e.altKey && !e.ctrlKey && !e.metaKey && !typing) { e.preventDefault(); setLearn(!learnOn()); return; }
    if (!learnOn() || e.altKey || e.ctrlKey || e.metaKey || typing) return;
    const onControl = /^(BUTTON|SELECT)$/.test(e.target.tagName), k = e.key;
    if (k === 'Escape') setLearn(false);
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !onControl && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && !onControl && e.shiftKey)) { e.preventDefault(); back(); }
  });

  // ---------- start ----------
  // dev hooks for headless checks: ?beat=ex-b&steps=6&mode=you&answer=3&learn=1&fill=1
  let learnSaved = false;
  try { learnSaved = localStorage.getItem(LEARN_KEY) === '1'; } catch (e) { /* private window */ }
  const startId = q.get('beat') || location.hash.slice(1);
  const start = (startId && $(startId)) || beats[0];
  if (q.has('learn') || learnSaved) setLearn(true);
  applyBeat(start);
  if (start !== beats[0] && !noScroll) start.scrollIntoView();
  if (q.has('steps') && cur.steps) for (let i = 0; i < +q.get('steps'); i++) cur.steps.next();
  if (q.get('mode') === 'you') setMode('you');
  if (q.has('fill') && cur.table) { // type a mix of right and wrong answers, then Check
    Object.values(cur.table.cells).forEach((c, i) => { if (c.inp) c.inp.value = i % 4 === 3 ? '9' : c.ans.replace(/<[^>]+>/g, ''); });
    footL.querySelector('.ice-bar .btn.primary').click();
  }
  if (q.has('answer')) for (let i = 0; i < +q.get('answer'); i++) showAnswer();
  window.__ice = { cur: () => cur }; // dev hook for headless checks
})();
