/* SolUI: shared components for the Solubility & Ksp suite (Guide, Sandbox, Qual Lab).
   - num():      1.29 × 10⁻³ as HTML, plain text and speech ("1.29 times 10 to the minus 3")
   - readout():  a panel of labelled values; saltReadout() fills it from a SolEngine beaker
   - qvk():      Q vs Ksp check: comparison, log number line, dissolving equation, status
   - steps():    worked steps for the Guide, one line per tap, each able to mark part of the picture
   No room-specific copies: every room loads this file and sol.css. */
(function (global) {
  'use strict';

  // ---------- Numbers ----------
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const UNIT_SPEECH = {
    'mol/L': 'moles per litre', 'g/L': 'grams per litre', 'mg': 'milligrams', 'g': 'grams',
    'g/mol': 'grams per mole', 'mL': 'millilitres', 'L': 'litres', '°C': 'degrees Celsius', 'K': 'kelvin'
  };
  // opts: sig (3), sci: 'auto' (plain from 0.01 to 999) | 'always' | 'never', unit, fixed (decimals, plain only)
  function num(x, opts) {
    opts = opts || {};
    const sig = opts.sig || 3, unit = opts.unit || '';
    const uHtml = unit ? ' <span class="num-unit">' + unit + '</span>' : '';
    const uText = unit ? ' ' + unit : '';
    const uSpeech = unit ? ' ' + (UNIT_SPEECH[unit] || unit) : '';
    if (x == null || !isFinite(x)) return { html: '–', text: '–', speech: 'not available' };
    if (x === 0) return { html: '0' + uHtml, text: '0' + uText, speech: '0' + uSpeech };
    let e = Math.floor(Math.log10(Math.abs(x)));
    let m = x / Math.pow(10, e);
    if (Math.abs(+m.toFixed(sig - 1)) >= 10) { m /= 10; e += 1; }  // 9.996 → 1.00 × 10¹
    const plain = opts.sci === 'never' || (opts.sci !== 'always' && e >= -2 && e < 3);
    if (plain) {
      // toPrecision only switches to "e" notation when the exponent reaches sig (e.g. 150 at sig 2)
      const out = opts.fixed != null ? x.toFixed(opts.fixed) : e >= sig ? String(Math.round(x)) : x.toPrecision(sig);
      return { html: out + uHtml, text: out + uText, speech: out.replace('-', 'minus ') + uSpeech };
    }
    const ms = m.toFixed(sig - 1);
    const es = String(e);
    return {
      html: '<span class="num">' + ms + ' × 10<sup>' + es.replace('-', '−') + '</sup></span>' + uHtml,
      text: ms + ' × 10' + es.split('').map(c => SUP[c]).join('') + uText,
      speech: ms + ' times 10 to the ' + (e < 0 ? 'minus ' + (-e) : e) + uSpeech
    };
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  // Only touch the DOM when the text changes (these update every frame)
  function setHTML(node, html) { if (node._h !== html) { node._h = html; node.innerHTML = html; } }
  function setText(node, text) { if (node._t !== text) { node._t = text; node.textContent = text; } }

  // ---------- Readout panel ----------
  // rows: [{ id, label (html), speech (spoken label), hidden }]
  // set(id, value, opts) uses num(); opts.sub adds a second, smaller value under the first
  function readout(host, rows) {
    const dl = el('dl', 'sol-read');
    const map = {};
    rows.forEach(r => {
      const row = el('div', 'rd-row');
      const dt = el('dt', null, r.label);
      const dd = el('dd');
      const vis = el('span', 'rd-val'); vis.setAttribute('aria-hidden', 'true');
      const sub = el('span', 'rd-sub'); sub.setAttribute('aria-hidden', 'true');
      const sr = el('span', 'sr-only');
      dd.append(vis, sub, sr); row.append(dt, dd); dl.appendChild(row);
      if (r.hidden) row.hidden = true;
      map[r.id] = { row, vis, sub, sr, speech: r.speech || dt.textContent };
    });
    host.appendChild(dl);
    return {
      el: dl,
      set(id, x, opts) {
        const m = map[id]; if (!m) return;
        opts = opts || {};
        const a = typeof x === 'object' && x && x.html != null ? x : num(x, opts);
        const b = opts.sub == null ? null : (typeof opts.sub === 'object' && opts.sub.html != null ? opts.sub : num(opts.sub, opts.subOpts || {}));
        setHTML(m.vis, a.html);
        setHTML(m.sub, b ? b.html : '');
        setText(m.sr, a.speech + (b ? (/^at /.test(b.speech) ? ' ' : ', or ') + b.speech : ''));
      },
      show(id, on) { const m = map[id]; if (m && m.row.hidden === !!on) m.row.hidden = !on; }
    };
  }

  // The standard readout for one salt in a SolEngine beaker
  function ionLabel(D, k) { return '[' + D.ION[k].html + ']'; }
  function saltReadout(host, D, saltId, opts) {
    opts = opts || {};
    const s = D.SALTS[saltId];
    // opts.mass: show the solid as a mass story, Solid added = Dissolved + Solid left (all in mg), molar units underneath
    const rows = [
      { id: 'added', label: 'Solid added', speech: 'Solid added so far' },
      { id: 's', label: 'Dissolved', speech: 'Amount dissolved' },
      { id: 'solid', label: 'Solid left', speech: 'Solid left at the bottom' },
      { id: 'cat', label: ionLabel(D, s.cat[0]), speech: 'Concentration of ' + D.ION[s.cat[0]].name },
      { id: 'an', label: ionLabel(D, s.an[0]), speech: 'Concentration of ' + D.ION[s.an[0]].name },
      { id: 'Q', label: 'Q' },
      { id: 'ksp', label: 'K<sub>sp</sub>', speech: 'K s p' },
      { id: 'pH', label: 'pH', hidden: !s.pH }
    ];
    const r = readout(host, opts.only ? rows.filter(x => opts.only.includes(x.id)) : rows);
    r.update = function (all, T) {
      const st = all.salts[saltId], c = all.ions;
      r.set('added', st ? st.addedG * 1000 : 0, { unit: 'mg', sig: 3, sub: st ? st.addedMol : 0, subOpts: { unit: 'mol', sci: 'always' } });
      if (opts.mass) r.set('s', st ? st.dissolvedG * 1000 : 0, { unit: 'mg', sig: 3, sub: st ? st.s : 0, subOpts: { unit: 'mol/L', sci: 'always' } });
      else r.set('s', st ? st.s : 0, { unit: 'mol/L', sci: 'always', sub: st ? st.sGL : 0, subOpts: { unit: 'g/L' } });
      r.set('cat', c[s.cat[0]] || 0, { unit: 'mol/L', sci: 'always' });
      r.set('an', c[s.an[0]] || 0, { unit: 'mol/L', sci: 'always' });
      r.set('Q', st ? st.Q : 0, { sci: 'always' });
      const tc = T == null ? 25 : Math.round(T - 273.15);
      r.set('ksp', st ? st.ksp : s.ksp, { sci: 'always', sub: { html: 'at ' + tc + ' °C', text: 'at ' + tc + ' °C', speech: 'at ' + tc + ' degrees Celsius' } });
      r.set('solid', st ? st.solidG * 1000 : 0, { unit: 'mg', sig: 3 });
      r.show('pH', all.pH != null && (s.pH || opts.alwaysPH));
      if (all.pH != null) r.set('pH', { html: all.pH.toFixed(2), text: all.pH.toFixed(2), speech: all.pH.toFixed(2) });
    };
    return r;
  }

  // ---------- Q vs Ksp check ----------
  // Reads the same way as Q vs K in the Le Châtelier sim: Q < Ksp dissolves (→), Q > Ksp precipitates (←).
  // opts: { span: decades either side of Ksp (3), equation: { left, right } html, live: announce status changes,
  //         abs: [lo, hi] log10 range: a fixed scale of powers of ten, so the Ksp mark itself moves (temperature) }
  function qvk(host, opts) {
    opts = opts || {};
    const span = opts.span || 3, abs = opts.abs || null;
    const root = el('section', 'qk');
    root.setAttribute('aria-label', 'Q compared with Ksp');
    const head = el('div', 'qk-head');
    head.setAttribute('aria-hidden', 'true');
    head.innerHTML = '<span>Q</span><span class="qk-sym">=</span><span>K<sub>sp</sub></span>';
    const sym = head.querySelector('.qk-sym');
    const sr = el('p', 'sr-only');

    // number line: Ksp in the middle, a decade per tick
    const line = el('div', 'qk-line'); line.setAttribute('aria-hidden', 'true');
    const track = el('div', 'qk-track');
    track.innerHTML = '<span class="qk-zone lo">dissolves</span><span class="qk-zone hi">precipitates</span><span class="qk-ksp"></span>';
    const scale = el('div', 'qk-scale');
    const absLabs = [];
    if (abs) {
      root.classList.add('qk-abs');
      for (let e = abs[0]; e <= abs[1]; e++) {
        const pct = 100 * (e - abs[0]) / (abs[1] - abs[0]);
        const tick = el('span', 'qk-tick'); tick.style.left = pct + '%'; track.appendChild(tick);
        const lab = el('span', 'qk-lab', '10<sup>' + String(e).replace('-', '−') + '</sup>');
        lab.style.left = pct + '%'; scale.appendChild(lab); absLabs.push([pct, lab]);
      }
    } else for (let d = -span; d <= span; d++) {
      const pct = 50 + 50 * d / span;
      const tick = el('span', 'qk-tick' + (d === 0 ? ' mid' : '')); tick.style.left = pct + '%'; track.appendChild(tick);
      const lab = el('span', 'qk-lab' + (d === 0 ? ' mid' : Math.abs(d) === 2 ? ' d2' : ''), d === 0 ? 'K<sub>sp</sub>' : (d < 0 ? '÷' : '×') + Math.pow(10, Math.abs(d)));
      lab.style.left = pct + '%'; scale.appendChild(lab);
    }
    const kspLine = track.querySelector('.qk-ksp'), zoneLo = track.querySelector('.qk-zone.lo'), zoneHi = track.querySelector('.qk-zone.hi');
    const kspLab = el('span', 'qk-ksplab', 'K<sub>sp</sub>');
    if (abs) track.appendChild(kspLab);
    const mark = el('span', 'qk-q', '<b>Q</b>');
    const markLab = mark.querySelector('b');
    // a second, dashed marker for a reading to compare against (e.g. "without dilution")
    const ghost = el('span', 'qk-q qk-ghost', '<b></b>'); ghost.hidden = true;
    track.append(ghost, mark);
    line.append(track, scale);

    // dissolving equation, arrows sized by how far Q is from Ksp
    const eqn = el('div', 'qk-eqn'); eqn.setAttribute('aria-hidden', 'true');
    eqn.innerHTML = '<span class="qk-side l"></span><span class="qk-arrows"><span class="rev">←</span><span class="fwd">→</span></span><span class="qk-side r"></span>';
    const fwd = eqn.querySelector('.fwd'), rev = eqn.querySelector('.rev');
    const status = el('p', 'qk-status');
    if (opts.live) status.setAttribute('aria-live', 'polite');

    root.append(head, sr, line, eqn, status);
    host.appendChild(root);

    let shown = null, kspShown = null, lastT = 0;
    function setEquation(left, right) {
      setHTML(eqn.querySelector('.l'), left || '');
      setHTML(eqn.querySelector('.r'), right || '');
      eqn.hidden = !left;
    }
    if (opts.equation) setEquation(opts.equation.left, opts.equation.right); else eqn.hidden = true;

    // state: { q, ksp, relation ('<' | '=' | '>'), solid (bool), status (optional override) }
    function update(st) {
      const q = st.q, ksp = st.ksp;
      const rel = st.relation || (q < ksp ? '<' : q > ksp ? '>' : '=');
      const lg = q > 0 ? Math.log10(q / ksp) : -Infinity;
      // positions in % of the track: relative mode keeps Ksp in the middle; abs mode places both on powers of ten
      let goal, kGoal;
      if (abs) {
        const P = lx => 100 * (lx - abs[0]) / (abs[1] - abs[0]);
        kGoal = P(Math.log10(ksp));
        goal = Math.max(-3, Math.min(103, rel === '=' ? kGoal : q > 0 ? P(Math.log10(q)) : -3));
      } else {
        kGoal = 50;
        goal = 50 + 50 * (rel === '=' ? 0 : Math.max(-span * 1.06, Math.min(span * 1.06, lg))) / span;
      }
      // ease the markers; jumps (a reagent added) glide over ~0.3 s
      const now = (global.performance && performance.now()) || Date.now();
      const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 1); lastT = now;
      const ease = (a, b) => a == null || st.snap ? b : a + (b - a) * Math.min(1, dt * 9);
      shown = ease(shown, goal); kspShown = ease(kspShown, kGoal);
      const pct = Math.max(0, Math.min(100, shown));
      mark.style.left = pct + '%';
      mark.classList.toggle('at-start', pct < 6); mark.classList.toggle('at-end', pct > 94);
      if (abs) {
        const k = Math.max(0, Math.min(100, kspShown));
        kspLine.style.left = kspLab.style.left = k + '%';
        track.style.background = 'linear-gradient(90deg,var(--sol-zone-lo) 0 ' + k + '%,var(--sol-zone-hi) ' + k + '% 100%)';
        zoneLo.style.left = (k / 2) + '%'; zoneLo.hidden = k < 30;
        zoneHi.style.left = ((k + 100) / 2) + '%'; zoneHi.hidden = k > 70;
        absLabs.forEach(([p, lab]) => { lab.style.visibility = Math.abs(p - k) < 10 ? 'hidden' : ''; });
      }
      const off = q > 0 && rel !== '=' && (abs ? goal < 0 || goal > 100 : Math.abs(lg) > span);
      setHTML(markLab, q === 0 ? 'Q = 0' : off ? (lg < 0 ? '◀ Q' : 'Q ▶') : 'Q');
      mark.classList.toggle('is-eq', rel === '=');
      setText(sym, rel);
      sym.className = 'qk-sym ' + (rel === '<' ? 'lt' : rel === '>' ? 'gt' : 'eq');
      // arrows: same sizing idea as the Le Châtelier sim (the faster direction is bigger)
      const t = rel === '=' ? 0 : Math.max(-1.2, Math.min(1.2, lg * 0.6));
      fwd.style.fontSize = (1 + 0.55 * Math.max(0, -t)).toFixed(3) + 'em';
      rev.style.fontSize = (1 + 0.55 * Math.max(0, t)).toFixed(3) + 'em';
      // words: status line and the spoken comparison
      let words = st.status;
      if (!words) {
        if (rel === '=') words = 'Saturated: Q = Ksp';
        else if (q === 0) words = 'Nothing dissolved yet: Q = 0';
        else if (rel === '<') words = st.solid ? 'Q < Ksp: dissolving →' : 'Unsaturated: Q < Ksp, no solid present';
        else words = 'Q > Ksp: precipitating ←';
      }
      setHTML(status, words.replace(/Ksp/g, 'K<sub>sp</sub>'));
      // the status says which side; the spoken line adds how far
      let say = '';
      if (rel !== '=' && q > 0) {
        const f = rel === '<' ? ksp / q : q / ksp;
        const n = f < 10 ? +f.toPrecision(2) : +Math.round(f).toPrecision(2);
        say = 'Q is about ' + n.toLocaleString('en-CA') + ' times ' + (rel === '<' ? 'smaller' : 'bigger') + ' than K s p. ';
      }
      const spoken = words.replace(/ < /g, ' is less than ').replace(/ > /g, ' is greater than ').replace(/ = /g, ' equals ')
        .replace(/Ksp/g, 'K s p').replace(/[←→]/g, '').trim();
      setText(sr, say + spoken + '.' + (abs ? ' K s p is ' + num(ksp, { sci: 'always', sig: 2 }).speech + '.' : ''));
    }
    function setGhost(q, ksp, label) {
      if (q == null) { ghost.hidden = true; return; }
      const lg = Math.log10(q / ksp);
      ghost.hidden = false;
      ghost.style.left = Math.max(0, Math.min(100, 50 + 50 * Math.max(-span * 1.06, Math.min(span * 1.06, lg)) / span)) + '%';
      setHTML(ghost.querySelector('b'), label || 'Q');
    }
    return { el: root, update, setEquation, setGhost };
  }
  // The dissolving equation for a salt: "PbI₂(s)" and "Pb²⁺ + 2 I⁻"
  function dissolvingEquation(D, saltId) {
    const s = D.SALTS[saltId];
    const part = (k, n) => (n > 1 ? n + ' ' : '') + '<span class="' + (k === 'OH-' ? 'qk-base' : k === 'H+' ? 'qk-acid' : D.ION[k].z > 0 ? 'qk-cat' : 'qk-an') + '">' + D.ION[k].html + '</span>';
    return { left: s.html + '(s)', right: part(s.cat[0], s.cat[1]) + ' + ' + part(s.an[0], s.an[1]) };
  }
  function qvkForSalt(host, D, saltId, opts) {
    const g = qvk(host, Object.assign({ equation: dissolvingEquation(D, saltId) }, opts || {}));
    g.setSalt = id => { const e = dissolvingEquation(D, id); g.setEquation(e.left, e.right); };
    g.updateFrom = (all, id, extra) => {
      const st = all.salts[id];
      g.update(Object.assign({ q: st ? st.Q : 0, ksp: st ? st.ksp : D.SALTS[id].ksp, relation: st ? st.relation : '<', solid: !!(st && st.solidMol > 0) }, extra || {}));
    };
    return g;
  }

  // ---------- Unit analysis (AGENTS.md: every non-K calculation is shown this way) ----------
  // frac(top, bottom): a factor with the numerator stacked over the denominator.
  // x(unit): a unit (with its substance label) that cancels, struck through.
  // chain(a, b, ...): factors joined by ×. A bare given quantity can lead the chain.
  const ua = {
    frac: (top, bottom) => '<span class="ua-frac"><span class="ua-num">' + top + '</span><span class="sr-only"> per </span><span class="ua-den">' + bottom + '</span></span>',
    x: unit => '<span class="ua-x">' + unit + '</span>',
    // each × stays with the factor after it, so a long chain wraps before a ×, never after one
    chain: (first, ...rest) => first + rest.map(f => ' <span class="ua-step"><span class="ua-op">×</span> ' + f + '</span>').join('')
  };

  // ---------- Worked steps ----------
  // lines: [{ lhs, rhs, note, speech, mark }]
  //   lhs / rhs: html either side of "="; a line with only lhs is shown whole (an equation, a sentence)
  //   rhs only: a continuation ("= 4x³"); eq: the sign between them when it isn't "=" (e.g. "≈")
  //   note: plain-language reason beside the line; mark: a key the stage highlights (onStep)
  // opts: { onStep(index, line), labels: { next, back, all } }
  function steps(host, lines, opts) {
    opts = opts || {};
    const L = Object.assign({ next: 'Next step', back: 'Back', all: 'Show all' }, opts.labels || {});
    const root = el('div', 'ws');
    const ol = el('ol', 'ws-lines');
    // opts.ice: an ICE table above the lines. A line with `ice` ('R' equation, 'I', 'C', 'E') and no lhs/rhs
    // fills that part of the table instead of adding a line; its note shows under the table. `useE` lights the E row.
    // opts.mix: the same idea for mixing two solutions (mixTable): a line with `mx: 'net'` turns the full equation
    // into the net ionic one, and `rows: [...]` fills those rows of the table under the ions.
    const silent = ln => (ln.ice || ln.mx || ln.rows) && ln.lhs == null && ln.rhs == null;
    const ice = opts.ice ? iceTable(opts.ice, lines) : opts.mix ? mixTable(opts.mix, lines) : null;
    if (ice) root.appendChild(ice.el);
    const items = lines.map((ln, i) => {
      const li = el('li', 'ws-line' + (ln.lhs != null && ln.rhs == null ? ' whole' : '') + (silent(ln) ? ' ws-ice' : ''));
      const lhs = el('span', 'ws-lhs', ln.lhs || '');
      const eq = el('span', 'ws-eq', ln.eq || (ln.rhs != null ? '=' : ''));
      const rhs = el('span', 'ws-rhs', ln.rhs || '');
      li.append(lhs, eq, rhs);
      if (ln.note) li.appendChild(el('span', 'ws-note', ln.note));
      li.hidden = true;
      ol.appendChild(li);
      return li;
    });
    const bar = el('div', 'ws-bar');
    const bBack = el('button', 'btn btn-sm', L.back); bBack.type = 'button';
    const bNext = el('button', 'btn primary ws-next', L.next); bNext.type = 'button';
    const bAll = el('button', 'btn btn-sm', L.all); bAll.type = 'button';
    const count = el('span', 'ws-count'); count.setAttribute('aria-hidden', 'true');
    bar.append(bNext, bBack, bAll, count);
    const live = el('p', 'sr-only'); live.setAttribute('aria-live', 'polite');
    root.append(ol, bar, live);
    host.appendChild(root);

    let shown = 0;
    const spoken = ln => ln.speech || [ln.lhs, ln.rhs != null ? (ln.lhs ? 'equals ' : 'equals ') + ln.rhs : '', ln.note ? '. ' + ln.note : '']
      .join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    function render(announce) {
      items.forEach((li, i) => {
        li.hidden = i >= shown; // an ICE line (.ws-ice) only shows in presentation view; elsewhere its note sits under the table
        li.classList.toggle('is-current', i === shown - 1);
      });
      if (ice) ice.render(shown);
      // an empty box says what goes there (presentation view styles it); the newest line stays in view
      ol.classList.toggle('is-empty', !items.some(li => !li.hidden && li.offsetParent !== null));
      const curLi = shown > 0 ? items[shown - 1] : null;
      if (curLi && !curLi.hidden && ol.scrollHeight > ol.clientHeight) {
        const bottom = curLi.offsetTop + curLi.offsetHeight;
        if (bottom > ol.scrollTop + ol.clientHeight) ol.scrollTop = bottom - ol.clientHeight + 8;
        else if (curLi.offsetTop < ol.scrollTop) ol.scrollTop = curLi.offsetTop - 8;
      }
      bBack.disabled = shown === 0; bNext.disabled = shown === items.length; bAll.disabled = shown === items.length;
      count.textContent = shown + ' / ' + items.length;
      if (announce && shown > 0) live.textContent = spoken(lines[shown - 1]);
      if (opts.onStep) opts.onStep(shown - 1, shown > 0 ? lines[shown - 1] : null);
    }
    const api = {
      el: root,
      get index() { return shown; },
      next() { if (shown < items.length) { shown++; render(true); } return shown; },
      back() { if (shown > 0) { shown--; render(true); } return shown; },
      all() { shown = items.length; render(false); return shown; },
      reset() { shown = 0; render(false); return shown; }
    };
    bNext.addEventListener('click', api.next); bBack.addEventListener('click', api.back); bAll.addEventListener('click', api.all);
    render(false);
    return api;
  }

  // ---------- ICE table (used by steps) ----------
  // spec: { species: [{ html, solid, cls }], unit, rows: { I: [...], C: [...], E: [...] } }, one value per species.
  // Everything is laid out from the start (no jumping); cells stay invisible until their step is shown.
  function iceTable(spec, lines) {
    const wrap = el('div', 'ice-wrap');
    const tbl = el('table', 'ice');
    const at = key => lines.findIndex(l => l.ice === key);
    const head = el('tr'), cells = { R: [] };
    head.appendChild(el('th', 'ice-unit', spec.unit ? '(' + spec.unit + ')' : ''));
    spec.species.forEach((s, i) => {
      if (i) { const op = el('th', 'ice-op', i === 1 ? '⇌' : '+'); head.appendChild(op); cells.R.push(op); }
      const th = el('th', s.solid ? 'ice-solid' : '', s.cls ? '<span class="' + s.cls + '">' + s.html + '</span>' : s.html);
      head.appendChild(th); cells.R.push(th);
    });
    const thead = el('thead'); thead.appendChild(head);
    const tbody = el('tbody'), rows = {};
    ['I', 'C', 'E'].forEach(k => {
      const tr = el('tr'); tr.appendChild(el('th', 'ice-key', k));
      cells[k] = [];
      spec.rows[k].forEach((v, i) => {
        if (i) tr.appendChild(el('td', 'ice-op'));
        const td = el('td', spec.species[i].solid ? 'ice-solid' : '', v);
        tr.appendChild(td); cells[k].push(td);
      });
      tbody.appendChild(tr); rows[k] = tr;
    });
    tbl.append(thead, tbody);
    const note = el('p', 'ice-note'); note.setAttribute('aria-hidden', 'true'); // the steps' live region speaks it
    wrap.append(tbl, note);
    return {
      el: wrap,
      render(shown) {
        const cur = shown > 0 ? lines[shown - 1] : null;
        ['R', 'I', 'C', 'E'].forEach(k => {
          const i = at(k), on = i >= 0 && i < shown;
          cells[k].forEach(c => c.classList.toggle('is-blank', !on));
          const tr = k === 'R' ? head : rows[k];
          tr.classList.toggle('is-current', i >= 0 && i === shown - 1);
        });
        rows.E.classList.toggle('is-used', !!(cur && cur.useE));
        note.innerHTML = cur && cur.ice && cur.note ? cur.note : '';
        note.hidden = !note.innerHTML;
      }
    };
  }

  // ---------- Mixing table (used by steps) ----------
  // Only the reactants sit over the (still empty) table at first. The step with `mx: 'net'` plays the morph
  // (user, 2026-11-19: slower, products first): the products appear, each aqueous compound splits into its ions
  // (complete ionic equation), the spectator ions are crossed out, and what is left (the net ionic equation)
  // slides up into the table's header, one ion over each column.
  // Rows of values then fill in under the ions, one step at a time (`rows: ['Ci', 'Vi']`).
  // spec: { tokens: { id: html }, reactants: [ids], full: [ids], ionic: [ids], spect: [ids], from: { id: parentId }, ops: [ids],
  //         net: [ids, one per header cell], rows: [{ key, head, vals: [one per non-op net cell] }] }
  function mixTable(spec, lines) {
    const wrap = el('div', 'ice-wrap mx-wrap');
    const flow = el('div', 'mx-flow'); flow.setAttribute('aria-hidden', 'true');
    const tbl = el('table', 'ice mx');
    const tok = {};
    Object.keys(spec.tokens).forEach(id => { tok[id] = el('span', 'mx-tok' + (spec.ops.includes(id) ? ' mx-op' : ''), spec.tokens[id]); });
    const head = el('tr'), hcells = [];
    head.appendChild(el('th', 'ice-unit', ''));
    spec.net.forEach(id => { const th = el('th', spec.ops.includes(id) ? 'ice-op' : ''); head.appendChild(th); hcells.push(th); });
    const thead = el('thead'); thead.appendChild(head);
    const tbody = el('tbody'), rows = {};
    spec.rows.forEach(r => {
      const tr = el('tr'); tr.appendChild(el('th', 'ice-key', r.head));
      let v = 0; const cells = [];
      spec.net.forEach(id => {
        if (spec.ops.includes(id)) { tr.appendChild(el('td', 'ice-op')); return; }
        const td = el('td', '', r.vals[v++]); tr.appendChild(td); cells.push(td);
      });
      tbody.appendChild(tr); rows[r.key] = { tr, cells };
    });
    tbl.append(thead, tbody);
    const note = el('p', 'ice-note'); note.setAttribute('aria-hidden', 'true');
    const sr = el('p', 'sr-only'); // the equation as it stands, for a screen reader
    wrap.append(tbl, flow, note, sr);
    const netAt = lines.findIndex(l => l.mx === 'net');
    const rowAt = key => lines.findIndex(l => l.rows && l.rows.includes(key));
    const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let state = null, timers = [], prev = -1;
    const listOf = st => st === 'net' ? spec.net : st === 'reactants' ? spec.reactants : st === 'full' ? spec.full : spec.ionic;

    function place(st) {
      // crossing out happens in place (running moves keep going), one spectator after another
      if (st === 'struck' && state === 'ionic') { spec.spect.forEach((id, k) => { tok[id].style.animationDelay = (k * 0.18) + 's'; tok[id].classList.add('is-struck'); }); state = st; return; }
      Object.keys(tok).forEach(id => { tok[id].remove(); tok[id].classList.remove('is-struck'); tok[id].style.animationDelay = ''; });
      if (st === 'net') spec.net.forEach((id, i) => hcells[i].appendChild(tok[id]));
      else listOf(st).forEach(id => flow.appendChild(tok[id]));
      if (st === 'struck') spec.spect.forEach(id => tok[id].classList.add('is-struck'));
      wrap.classList.toggle('is-net', st === 'net');
      sr.textContent = listOf(st).map(id => tok[id].textContent).join(' ');
      state = st;
    }
    // FLIP: measure, move, then play each token from where it was (a new ion grows out of its compound)
    function go(st, ms) {
      const first = {}, base = wrap.getBoundingClientRect();
      Object.keys(tok).forEach(id => { if (tok[id].isConnected) first[id] = tok[id].getBoundingClientRect(); });
      place(st);
      if (!ms || !tok[spec.net[0]].animate) return;
      const ease = 'cubic-bezier(0.3, 0.7, 0.2, 1)';
      Object.keys(tok).forEach(id => {
        const t = tok[id];
        if (!t.isConnected) {
          if (!first[id]) return; // leaving: a copy fades and shrinks where it was
          const f = first[id], c = t.cloneNode(true);
          c.classList.add('mx-ghost'); if (st === 'net') c.classList.add('is-struck');
          c.style.left = (f.left - base.left) + 'px'; c.style.top = (f.top - base.top) + 'px';
          wrap.appendChild(c);
          c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.7)' }], { duration: ms * 0.6, easing: 'ease-in', fill: 'forwards' }).onfinish = () => c.remove();
          return;
        }
        const last = t.getBoundingClientRect();
        let f = first[id], grow = false;
        if (!f && spec.from[id] && first[spec.from[id]]) { f = first[spec.from[id]]; grow = true; }
        if (f) {
          const dx = (f.left + f.width / 2) - (last.left + last.width / 2), dy = (f.top + f.height / 2) - (last.top + last.height / 2);
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && !grow) return;
          t.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + (grow ? 0.55 : 1) + ')', opacity: grow ? 0 : 1 },
            { transform: 'none', opacity: 1 }], { duration: ms, easing: ease, delay: grow ? ms * 0.15 : 0, fill: 'backwards' });
        } else t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms * 0.6, delay: ms * 0.4, fill: 'backwards' });
      });
    }
    function clear() { timers.forEach(clearTimeout); timers = []; wrap.querySelectorAll('.mx-ghost').forEach(c => c.remove()); }
    // the morph, timed to the pour on the stage (about 7 s): products appear, split, cross out, collapse
    function playNet() {
      clear();
      if (still()) { place('net'); return; }
      go('full', 1100);
      timers.push(setTimeout(() => { go('ionic', 1300); }, 1700));
      timers.push(setTimeout(() => { place('struck'); }, 3700));
      timers.push(setTimeout(() => { go('net', 1400); }, 5500));
    }
    place('reactants');
    return {
      el: wrap,
      render(shown) {
        const cur = shown > 0 ? lines[shown - 1] : null;
        const want = netAt >= 0 && shown > netAt ? 'net' : 'reactants';
        if (want === 'net' && shown === netAt + 1 && prev === netAt) playNet();
        else if (want !== state || (want === 'reactants' && timers.length)) { clear(); place(want); }
        prev = shown;
        spec.rows.forEach(r => {
          const i = rowAt(r.key), on = i >= 0 && i < shown;
          rows[r.key].cells.forEach(c => c.classList.toggle('is-blank', !on));
          rows[r.key].tr.classList.toggle('is-current', i >= 0 && i === shown - 1);
        });
        note.innerHTML = cur && (cur.mx || cur.rows) && cur.lhs == null && cur.note ? cur.note : '';
        note.hidden = !note.innerHTML;
      }
    };
  }

  // ---------- Predict-then-reveal chip ----------
  // spec: { title (html, optional), prompt (html), options: [{ label (html), correct }] (may be empty), multi, reveal (html), compact, revealLabel }
  // Pick (or don't), then Reveal. Nothing is saved or scored; Reset starts it again.
  // spec.instant: picking an option reveals at once; the whole card turns green (right) or red (wrong), then Try again
  // Every card with choices marks itself (user, 2026-11-19): one choice reveals at once and the card turns green
  // or red; "choose all that apply" has a Check button instead of Reveal. A card with no choices keeps its button.
  // spec.onReveal / spec.onReset: hooks for a page that adds its own controls (e.g. Run it).
  function chip(host, spec) {
    spec = Object.assign({}, spec);
    const marked = spec.options.length > 0 && spec.instant !== false;
    spec.instant = marked && !spec.multi;
    if (marked && spec.multi && !spec.revealLabel) spec.revealLabel = 'Check';
    const root = el('div', 'chip-card' + (spec.compact ? ' compact' : ''));
    if (spec.title) root.appendChild(el('p', 'chip-title', spec.title));
    if (spec.prompt) root.appendChild(el('p', 'chip-prompt', spec.prompt));
    const opts = el('div', 'chip-opts');
    if (!spec.options.length) opts.hidden = true;
    opts.setAttribute('role', 'group');
    opts.setAttribute('aria-label', spec.multi ? 'Choose all that apply' : 'Choose one');
    const btns = spec.options.map(o => {
      const b = el('button', 'btn chip-opt', o.label); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        if (root.classList.contains('is-revealed')) return;
        const on = b.getAttribute('aria-pressed') !== 'true';
        if (!spec.multi) btns.forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', String(on));
        if (spec.instant) reveal();
      });
      opts.appendChild(b); return b;
    });
    const revealLabel = spec.revealLabel || 'Reveal';
    const act = el('button', 'btn btn-sm chip-reveal', revealLabel); act.type = 'button';
    const out = el('p', 'chip-out'); out.setAttribute('aria-live', 'polite');
    const foot = el('div', 'chip-foot'); foot.append(act);
    if (spec.instant) foot.hidden = true;
    if (spec.instant) root.append(opts, out, foot); else root.append(opts, foot, out); // instant: the reason first, then Try again
    host.appendChild(root);
    function reveal() {
      root.classList.add('is-revealed');
      btns.forEach((b, i) => {
        const right = !!spec.options[i].correct, picked = b.getAttribute('aria-pressed') === 'true';
        b.classList.toggle('is-right', right);
        b.classList.toggle('is-wrong', picked && !right);
        b.setAttribute('aria-label', b.textContent + (right ? ' (correct)' : picked ? ' (your choice, not correct)' : ''));
      });
      out.innerHTML = spec.reveal;
      act.textContent = spec.instant ? 'Try again' : 'Reset';
      if (marked) {
        const ok = btns.every((b, i) => (b.getAttribute('aria-pressed') === 'true') === !!spec.options[i].correct);
        act.textContent = 'Try again';
        root.classList.add(ok ? 'is-correct' : 'is-incorrect');
        out.innerHTML = (ok ? 'Correct. ' : 'Not quite. ') + spec.reveal;
        foot.hidden = false;
      }
      if (spec.onReveal) spec.onReveal();
    }
    function reset() {
      root.classList.remove('is-revealed', 'is-correct', 'is-incorrect');
      if (spec.instant) foot.hidden = true;
      btns.forEach(b => { b.classList.remove('is-right', 'is-wrong'); b.setAttribute('aria-pressed', 'false'); b.removeAttribute('aria-label'); });
      out.innerHTML = ''; act.textContent = revealLabel;
      if (spec.onReset) spec.onReset();
    }
    act.addEventListener('click', () => root.classList.contains('is-revealed') ? reset() : reveal());
    return { el: root, reveal, reset };
  }

  const SolUI = { num, readout, saltReadout, qvk, qvkForSalt, dissolvingEquation, steps, chip, ua };
  global.SolUI = SolUI;
  if (typeof module !== 'undefined' && module.exports) module.exports = SolUI;
})(typeof window !== 'undefined' ? window : globalThis);
