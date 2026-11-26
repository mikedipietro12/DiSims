/* IceUI: components for the ICE Tables page (equilibrium-intro/ice-tables.html).
   - same(a, b):  is a typed entry ("0.80 - x", "+2x", "1.0 + 3.0", "0.25 M") equal to the answer?
   - table():     an ICE table. Walk-through: cells stay blank until a step shows them.
                  Your turn: cells are text boxes; Check marks them; a step can still fill them with the answer.
   - boxes():     answer boxes under a table (K, x, a final concentration), checked the same way
   - steps():     worked steps, one line per tap, with a reason under each line. A line can fill table cells,
                  light a row or column, and move the bulb or the gauge (through onStep)
   - bulb():      particles in a sealed bulb. Moving to a new state plays reaction events one at a time
                  (the C row as a tally), or drops added particles in from the top
   - gauge():     Q vs K on a log number line
   No particle has wants or feelings in any label (repo AGENTS.md). */
(function (global) {
  'use strict';

  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const reduced = !!(global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const plain = html => String(html).replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  // ---------- entries ----------
  // An entry is evaluated at two values of x, so "0.80 - x" and "-x + 0.80" match, and "1.0 + 3.0" matches 4.0.
  const XS = [0.137, 0.713];
  function evaluate(src) {
    let s = plain(src).replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/\s+/g, '').toLowerCase();
    s = s.replace(/(mol\/l|mol|atm|m)$/, '');
    if (!s) return null;
    let i = 0;
    const peek = () => s[i];
    function num() {
      const m = /^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/.exec(s.slice(i));
      if (!m) throw new Error('num');
      i += m[0].length; return [+m[0], +m[0]];
    }
    function atom() {
      if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error(')'); i++; return v; }
      if (peek() === 'x') { i++; return XS.slice(); }
      return num();
    }
    function power() {
      let v = atom();
      if (peek() === '^') { i++; const e = unary(); v = [Math.pow(v[0], e[0]), Math.pow(v[1], e[1])]; }
      return v;
    }
    function unary() {
      if (peek() === '+') { i++; return unary(); }
      if (peek() === '-') { i++; const v = unary(); return [-v[0], -v[1]]; }
      return power();
    }
    function term() {
      let v = unary();
      for (;;) {
        const c = peek();
        if (c === '*' || c === '/') { i++; const r = unary(); v = c === '*' ? [v[0] * r[0], v[1] * r[1]] : [v[0] / r[0], v[1] / r[1]]; }
        else if (c === 'x' || c === '(' || (c && /[\d.]/.test(c))) { const r = power(); v = [v[0] * r[0], v[1] * r[1]]; } // 2x, 2(0.30 - x)
        else return v;
      }
    }
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); v = op === '+' ? [v[0] + r[0], v[1] + r[1]] : [v[0] - r[0], v[1] - r[1]]; }
      return v;
    }
    try { const v = expr(); return i === s.length && v.every(Number.isFinite) ? v : null; } catch (e) { return null; }
  }
  // tol: how far off a number may be, as a fraction of the answer (2.5% by default, so 0.028 passes for 0.0278)
  function same(entry, answer, tol) {
    const a = evaluate(entry), b = evaluate(answer);
    if (!a || !b) return false;
    tol = tol == null ? 0.025 : tol;
    return a.every((v, k) => Math.abs(b[k]) < 1e-12 ? Math.abs(v) < 1e-9 : Math.abs(v - b[k]) <= tol * Math.abs(b[k]) + 1e-12);
  }

  // ---------- ICE table ----------
  // spec: { unit, split (number of reactants), species: [html], rows: { I: [], C: [], E: [] }, alt: { I, C, E } (other names),
  //         preshown (every cell shown from the start) }. mode: 'walk' | 'input'
  const ROWS = ['I', 'C', 'E'];
  const ROW_NAME = { I: 'Initial', C: 'Change', E: 'Equilibrium' };
  function table(spec, mode) {
    const wrap = el('div', 'ice-wrap');
    const tbl = el('table', 'ice ice-n' + spec.species.length + (mode === 'input' ? ' ice-input' : ''));
    const head = el('tr');
    head.appendChild(el('th', 'ice-unit', spec.unit ? '(' + spec.unit + ')' : ''));
    const cols = []; // per species: the cells of that column, header included
    spec.species.forEach((s, j) => {
      if (j) head.appendChild(el('th', 'ice-op', j === spec.split ? '⇌' : '+'));
      const th = el('th', 'ice-sp', s); head.appendChild(th); cols[j] = [th];
    });
    const thead = el('thead'); thead.appendChild(head);
    const tbody = el('tbody'), trs = {}, cells = {};
    ROWS.forEach(r => {
      const tr = el('tr', 'ice-row-' + r);
      tr.appendChild(el('th', 'ice-key', '<span class="ice-k">' + r + '</span>' + (spec.alt ? '<span class="ice-alt">' + spec.alt[r] + '</span>' : '')));
      spec.species.forEach((s, j) => {
        if (j) tr.appendChild(el('td', 'ice-op'));
        const td = el('td', 'ice-cell');
        const val = el('span', 'ice-val', spec.rows[r][j]);
        td.appendChild(val);
        const c = { key: r + j, td, val, ans: spec.rows[r][j], inp: null, state: '' };
        if (mode === 'input') {
          const inp = el('input', 'ice-in');
          inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'off');
          inp.setAttribute('aria-label', ROW_NAME[r] + ' row, ' + plain(s));
          inp.addEventListener('input', () => setState(c, ''));
          td.appendChild(inp); c.inp = inp;
        }
        tr.appendChild(td); cells[c.key] = c; cols[j].push(td);
      });
      tbody.appendChild(tr); trs[r] = tr;
    });
    tbl.append(thead, tbody);
    wrap.appendChild(tbl);

    function setState(c, st) {
      c.state = st;
      c.td.classList.toggle('is-right', st === 'right');
      c.td.classList.toggle('is-wrong', st === 'wrong');
      const b = c.td.querySelector('.ice-show'); if (b && st !== 'wrong') b.remove();
    }
    function reveal(c, given) {
      c.revealed = true;
      c.td.classList.add('is-revealed');
      c.td.classList.toggle('is-given', !!given);
      if (c.inp) c.inp.hidden = true;
      const b = c.td.querySelector('.ice-show'); if (b) b.remove();
    }
    const api = {
      el: wrap, cells, spec,
      // shown: keys shown so far; current: keys the newest step showed; hl: a row key ('I'), 'col0', or null
      render(shown, current, hl, alt) {
        Object.values(cells).forEach(c => {
          const on = spec.preshown || shown.has(c.key);
          if (mode === 'input') {
            if (on && !c.revealed) reveal(c, false);
            if (!on && c.revealed && !c.given) { c.revealed = false; c.td.classList.remove('is-revealed'); c.inp.hidden = false; }
          } else c.td.classList.toggle('is-blank', !on);
          c.td.classList.toggle('is-new', !!(current && current.has(c.key)));
        });
        ROWS.forEach(r => trs[r].classList.toggle('is-current', hl === r));
        cols.forEach((col, j) => col.forEach(td => td.classList.toggle('is-col', hl === 'col' + j)));
        wrap.classList.toggle('show-alt', !!alt);
      },
      // Your turn: mark every filled box. Returns { right, wrong, blank }
      check() {
        const out = { right: 0, wrong: 0, blank: 0 };
        Object.values(cells).forEach(c => {
          if (!c.inp || c.revealed) return;
          const v = c.inp.value.trim();
          if (!v) { setState(c, ''); out.blank++; return; }
          const ok = same(v, c.ans);
          setState(c, ok ? 'right' : 'wrong'); out[ok ? 'right' : 'wrong']++;
          if (!ok && !c.td.querySelector('.ice-show')) {
            const b = el('button', 'ice-show', 'Show'); b.type = 'button';
            b.setAttribute('aria-label', 'Show the answer for the ' + ROW_NAME[c.key[0]] + ' row, ' + plain(spec.species[+c.key.slice(1)]));
            b.addEventListener('click', () => { c.given = true; setState(c, ''); reveal(c, true); });
            c.td.appendChild(b);
          }
        });
        return out;
      },
      clear() {
        Object.values(cells).forEach(c => {
          c.revealed = false; c.given = false; setState(c, '');
          c.td.classList.remove('is-revealed', 'is-given', 'is-new');
          if (c.inp) { c.inp.value = ''; c.inp.hidden = false; }
        });
      },
      firstInput() { const c = Object.values(cells).find(x => x.inp && !x.revealed); return c && c.inp; }
    };
    return api;
  }

  // ---------- answer boxes ----------
  // list: [{ label, unit, ans, tol }]
  function boxes(list) {
    const root = el('div', 'ice-boxes');
    const rows = list.map(b => {
      const row = el('label', 'ice-box');
      const lab = el('span', 'ice-box-lab', b.label);
      const inp = el('input', 'ice-in'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
      const unit = el('span', 'ice-box-unit', b.unit || '');
      const ans = el('span', 'ice-box-ans', b.ans + (b.unit ? ' ' + b.unit : '')); ans.hidden = true;
      row.append(lab, el('span', 'ice-box-eq', '='), inp, unit, ans);
      inp.addEventListener('input', () => row.classList.remove('is-right', 'is-wrong'));
      root.appendChild(row);
      return { row, inp, ans, spec: b };
    });
    return {
      el: root,
      check() {
        const out = { right: 0, wrong: 0, blank: 0 };
        rows.forEach(r => {
          const v = r.inp.value.trim();
          r.row.classList.remove('is-right', 'is-wrong');
          if (!v) { out.blank++; return; }
          const ok = same(v, r.spec.ans, r.spec.tol);
          r.row.classList.add(ok ? 'is-right' : 'is-wrong'); out[ok ? 'right' : 'wrong']++;
        });
        return out;
      },
      showAnswers(on) { rows.forEach(r => { r.ans.hidden = !on; r.row.classList.toggle('is-answered', on); }); },
      clear() { rows.forEach(r => { r.inp.value = ''; r.row.classList.remove('is-right', 'is-wrong', 'is-answered'); r.ans.hidden = true; }); }
    };
  }

  // ---------- worked steps ----------
  // lines: [{ lhs, rhs, eq, note, whole, tag, show: ['I', 'C2', …], hl, alt, bulb, gauge }]
  //   lhs / rhs: html either side of "=" (eq: another sign); whole: one full-width line of html
  //   tag: 'I' | 'C' | 'E': a line that fills part of the ICE table; it shows as the row letter and its note
  //   show: cells this line fills ('I' = the whole row); hl: light a row or 'col0'; alt: show the other row names
  //   brief: what shows when the full explanation is off (the default): it replaces the note, or a whole line's text.
  //     Notes are the full explanation (.ws-full); a whole line with no brief always shows; a tag line with no brief
  //     shows its row name (TAG_BRIEF). The stage's .show-full class picks which set is visible.
  // o: { table, onStep(index, line, forward), labels, bar (where the buttons go: a fixed footer; default under the lines) }
  const TAG_BRIEF = { I: 'Initial', C: 'Change', E: 'I + C = E' };
  function steps(host, lines, o) {
    o = o || {};
    const L = Object.assign({ next: 'Next step', back: 'Back', all: 'Show all' }, o.labels || {});
    const root = el('div', 'ws');
    const ol = el('ol', 'ws-lines');
    const items = lines.map(ln => {
      const li = el('li', 'ws-line' + (ln.whole != null ? ' whole' : '') + (ln.tag ? ' tbl' : ''));
      if (ln.whole != null) {
        if (ln.brief) li.append(el('span', 'ws-lhs ws-full', ln.whole), el('span', 'ws-lhs ws-brief', ln.brief));
        else li.appendChild(el('span', 'ws-lhs', ln.whole));
      }
      else if (ln.tag) li.appendChild(el('span', 'ws-tag', ln.tag));
      else li.append(el('span', 'ws-lhs', ln.lhs || ''), el('span', 'ws-eq', ln.eq || (ln.rhs != null ? '=' : '')), el('span', 'ws-rhs', ln.rhs || ''));
      if (ln.note) li.appendChild(el('span', 'ws-note ws-full', ln.note));
      const brief = ln.whole != null ? null : ln.brief || (ln.tag ? TAG_BRIEF[ln.tag] : null);
      if (brief) li.appendChild(el('span', 'ws-note ws-brief', brief));
      li.hidden = true; ol.appendChild(li);
      return li;
    });
    const bar = el('div', 'ws-bar');
    const bNext = el('button', 'btn primary ws-next', L.next); bNext.type = 'button';
    const bBack = el('button', 'btn btn-sm', L.back); bBack.type = 'button';
    const bAll = el('button', 'btn btn-sm', L.all); bAll.type = 'button';
    const count = el('span', 'ws-count'); count.setAttribute('aria-hidden', 'true');
    bar.append(count, bAll, bBack, bNext); // Next step sits at the far right
    const live = el('p', 'sr-only'); live.setAttribute('aria-live', 'polite');
    root.append(ol, live);
    host.appendChild(root);
    (o.bar || root).appendChild(bar);

    const expand = keys => {
      const out = [];
      (keys || []).forEach(k => { if (k.length === 1) for (let j = 0; j < o.table.spec.species.length; j++) out.push(k + j); else out.push(k); });
      return out;
    };
    let shown = 0;
    function render(announce, forward) {
      items.forEach((li, i) => { li.hidden = i >= shown; li.classList.toggle('is-current', i === shown - 1); });
      const cur = shown > 0 ? lines[shown - 1] : null;
      if (o.table) {
        const all = new Set();
        lines.slice(0, shown).forEach(ln => expand(ln.show).forEach(k => all.add(k)));
        const alt = lines.slice(0, shown).some(ln => ln.alt);
        o.table.render(all, new Set(cur ? expand(cur.show) : []), cur ? cur.hl || (cur.tag && cur.tag.length === 1 && !cur.show ? cur.tag : null) : null, alt);
      }
      // the newest line stays in view inside whichever box scrolls (the column, or the whole stage).
      // Never the page: scrolling the page would change the section.
      const curLi = shown > 0 ? items[shown - 1] : null;
      if (curLi) {
        let sc = ol;
        while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
        if (sc && sc !== document.body && sc !== document.documentElement) {
          const r = curLi.getBoundingClientRect(), b = sc.getBoundingClientRect();
          if (r.bottom > b.bottom - 8) sc.scrollTop += r.bottom - b.bottom + 8;
          else if (r.top < b.top + 8) sc.scrollTop -= b.top + 8 - r.top;
        }
      }
      ol.classList.toggle('is-empty', shown === 0);
      bBack.disabled = shown === 0; bNext.disabled = shown === items.length; bAll.disabled = shown === items.length;
      count.textContent = shown + ' / ' + items.length;
      if (announce && cur) live.textContent = plain([cur.whole, cur.tag ? cur.tag + ' row.' : '', cur.lhs, cur.rhs != null ? (cur.eq || '=') + ' ' + cur.rhs : '', cur.note || cur.brief].filter(Boolean).join(' '));
      if (o.onStep) o.onStep(shown - 1, cur, !!forward);
    }
    const api = {
      el: root,
      get index() { return shown; },
      get length() { return items.length; },
      next() { if (shown < items.length) { shown++; render(true, true); } return shown; },
      back() { if (shown > 0) { shown--; render(true, false); } return shown; },
      all() { shown = items.length; render(false, false); return shown; },
      reset() { shown = 0; render(false, false); return shown; }
    };
    bNext.addEventListener('click', api.next); bBack.addEventListener('click', api.back); bAll.addEventListener('click', api.all);
    render(false, false);
    return api;
  }

  // ---------- molecules ----------
  // Model-kit atom shades [highlight, base], the same palette as reactions.js (equilibrium_simulations.html).
  const ATOM = {
    N: ['#8494ff', '#4152d9'], O: ['#ff8a6a', '#e0503a'],
    Nb: ['#c9956a', '#8b5a2b'], Ob: ['#d4a574', '#8f5e32'], // NO₂ is a brown gas, so both its atoms are brown
    S: ['#f6e7a0', '#c9a227'],                               // sulfur: a dull mustard, kept apart from the ion yellow
    C: ['#8a93a6', '#3d4658']
  };
  const SPECIES = {
    no:  { html: 'NO', color: '#4152d9', atoms: [{ el: 'N', x: -0.52, y: 0, r: 1 }, { el: 'O', x: 0.55, y: 0, r: 0.95 }] },
    o2:  { html: 'O<sub>2</sub>', color: '#e0503a', atoms: [{ el: 'O', x: -0.55, y: 0, r: 0.95 }, { el: 'O', x: 0.55, y: 0, r: 0.95 }] },
    no2: { html: 'NO<sub>2</sub>', color: '#8b5a2b', atoms: [{ el: 'Nb', x: 0, y: 0, r: 1 }, { el: 'Ob', x: -1.15, y: 0.75, r: 0.95 }, { el: 'Ob', x: 1.15, y: 0.75, r: 0.95 }] },
    so2: { html: 'SO<sub>2</sub>', color: '#a8861a', atoms: [{ el: 'S', x: 0, y: 0, r: 1.1 }, { el: 'O', x: -1.2, y: 0.78, r: 0.92 }, { el: 'O', x: 1.2, y: 0.78, r: 0.92 }] },
    n2o4: { html: 'N<sub>2</sub>O<sub>4</sub>', color: '#4152d9', atoms: [{ el: 'N', x: -0.62, y: 0, r: 1 }, { el: 'N', x: 0.62, y: 0, r: 1 },
      { el: 'O', x: -1.45, y: -0.9, r: 0.92 }, { el: 'O', x: -1.45, y: 0.9, r: 0.92 }, { el: 'O', x: 1.45, y: -0.9, r: 0.92 }, { el: 'O', x: 1.45, y: 0.9, r: 0.92 }] }, // colourless, so model-kit colours
    so3: { html: 'SO<sub>3</sub>', color: '#5b6474', atoms: [{ el: 'O', x: 0, y: -1.32, r: 0.92 }, { el: 'S', x: 0, y: 0, r: 1.1 }, { el: 'O', x: -1.18, y: 0.72, r: 0.92 }, { el: 'O', x: 1.18, y: 0.72, r: 0.92 }] }
  };

  // ---------- bulb ----------
  // spec: { species: ['no', 'o2', 'no2'], coef: [2, 1, 2], split, volume: '2.00 L', initial,
  //         states: { name: { c: [counts], tally: [direction, events] } },
  //         pressure: atm per particle (optional: the corner shows the total pressure, live, in place of the volume) }
  function bulb(host, spec) {
    const wrap = el('div', 'ice-bulb');
    const box = el('div', 'ice-bulb-box');
    const cv = el('canvas'); cv.setAttribute('role', 'img');
    box.appendChild(cv);
    const legend = el('div', 'ice-legend');
    const tally = el('p', 'ice-tally');
    wrap.append(box, legend, tally);
    host.appendChild(wrap);
    const n = spec.species.length, SP = spec.species.map(id => SPECIES[id]);
    const sideOf = j => j < spec.split ? -1 : 1; // forward: reactants go down, products go up
    const eqText = d => {
      const side = (a, b) => SP.slice(a, b).map((s, k) => { const c = spec.coef[a + k]; return (c > 1 ? c + ' ' : '') + s.html; }).join(' + ');
      const L = side(0, spec.split), R = side(spec.split, n);
      return d > 0 ? L + ' → ' + R : R + ' → ' + L;
    };
    const legendItems = SP.map(s => {
      const it = el('span', 'ice-leg', '<i style="background:' + s.color + '"></i><span>' + s.html + ':</span><b>0</b>');
      legend.appendChild(it); return it.querySelector('b');
    });

    let parts = [], events = [], active = null, gap = 0, tallyN = 0, tallyDir = 0, raf = 0, last = 0, W = 0, H = 0, dpr = 1, stateName = null;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function spawn(i, x, y, o) {
      const a = rnd(0, Math.PI * 2), v = rnd(0.03, 0.07);
      const p = { i, x: x == null ? rnd(0.08, 0.92) : x, y: y == null ? rnd(0.1, 0.9) : y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rnd(0, Math.PI * 2), vr: rnd(-0.6, 0.6), born: 1, fade: null, drop: false };
      if (o) Object.assign(p, o);
      parts.push(p); return p;
    }
    const alive = () => parts.filter(p => p.fade == null);
    function counts() { const c = new Array(n).fill(0); alive().forEach(p => c[p.i]++); return c; }
    function syncLegend() { const c = counts(); legendItems.forEach((b, j) => { b.textContent = c[j]; }); }
    function syncTally() {
      tally.innerHTML = tallyN ? 'Reaction events: ' + eqText(tallyDir) + ' &nbsp;×&nbsp;<b>' + tallyN + '</b>' : '';
      cv.setAttribute('aria-label', 'A sealed ' + (spec.volume ? spec.volume + ' bulb' : 'flask') + ' with ' + counts().map((c, j) => c + ' ' + plain(SP[j].html)).join(', ') + ' particles.' + (tallyN ? ' ' + plain(tally.innerHTML) : ''));
    }
    function snap(name) {
      flush();
      const st = spec.states[name], c = counts();
      st.c.forEach((want, j) => {
        let have = c[j];
        while (have < want) { spawn(j); have++; }
        while (have > want) { const k = parts.findIndex(p => p.i === j && p.fade == null); parts.splice(k, 1); have--; }
      });
      tallyDir = st.tally ? st.tally[0] : 0; tallyN = st.tally ? st.tally[1] : 0;
      stateName = name; syncLegend(); syncTally();
    }
    function flush() { // finish any events at once
      while (active || events.length) { if (!active) active = startEvent(events.shift()); if (active) finishEvent(active); active = null; }
      parts = parts.filter(p => p.fade == null); parts.forEach(p => { p.born = 1; p.drop = false; });
    }
    function startEvent(d) {
      const from = [], to = [];
      for (let j = 0; j < n; j++) (sideOf(j) === -d ? from : to).push(j);
      const pool = alive();
      const seed = pool.filter(p => p.i === from[0]);
      if (!seed.length) return null;
      const s0 = seed[Math.floor(Math.random() * seed.length)], picked = [];
      for (const j of from) {
        const cands = pool.filter(p => p.i === j && !picked.includes(p)).sort((a, b) => Math.hypot(a.x - s0.x, a.y - s0.y) - Math.hypot(b.x - s0.x, b.y - s0.y));
        if (cands.length < spec.coef[j]) return null;
        picked.push(...cands.slice(0, spec.coef[j]));
      }
      const cx = picked.reduce((s, p) => s + p.x, 0) / picked.length, cy = picked.reduce((s, p) => s + p.y, 0) / picked.length;
      picked.forEach(p => { p.fade = 0; p.tx = cx; p.ty = cy; });
      return { d, t: 0, picked, cx, cy, to, made: false };
    }
    function finishEvent(e) {
      if (!e.made) {
        e.to.forEach(j => { for (let k = 0; k < spec.coef[j]; k++) spawn(j, e.cx + rnd(-0.04, 0.04), e.cy + rnd(-0.04, 0.04), { born: 0 }); });
        e.made = true;
        if (tallyDir !== e.d) { tallyDir = e.d; tallyN = 0; }
        tallyN++; syncLegend(); syncTally();
      }
      e.picked.forEach(p => { const k = parts.indexOf(p); if (k >= 0) parts.splice(k, 1); });
    }
    function goTo(name, animate) {
      if (name === stateName) return;
      if (!animate || reduced || stateName == null) { snap(name); return; }
      flush();
      const want = spec.states[name].c, c = counts(), diff = want.map((w, j) => w - c[j]);
      const j0 = diff.findIndex(v => v !== 0);
      stateName = name;
      if (j0 < 0) { syncTally(); return; }
      const k = diff[j0] / (sideOf(j0) * spec.coef[j0]);
      const stoich = Number.isInteger(k) && diff.every((v, j) => v === sideOf(j) * spec.coef[j] * k);
      if (stoich) { // the shift: one reaction event at a time
        const d = Math.sign(k);
        if (tallyDir !== d) { tallyDir = d; tallyN = 0; }
        for (let m = 0; m < Math.abs(k); m++) events.push(d);
        gap = 0.25;
      } else { // an addition (or removal): new particles drop in from the top
        diff.forEach((v, j) => {
          for (let m = 0; m < v; m++) spawn(j, rnd(0.1, 0.9), rnd(-0.5, -0.05), { drop: true, vy: rnd(0.45, 0.7), vx: rnd(-0.05, 0.05) });
          for (let m = 0; m < -v; m++) { const p = parts.find(q => q.i === j && q.fade == null); if (p) { p.fade = 0; p.tx = p.x; p.ty = p.y; } }
        });
        tallyN = 0; syncLegend(); syncTally();
      }
    }
    function step(dt) {
      parts.forEach(p => {
        if (p.fade != null) { p.fade += dt; p.x += (p.tx - p.x) * Math.min(1, dt * 6); p.y += (p.ty - p.y) * Math.min(1, dt * 6); return; }
        if (p.born < 1) p.born = Math.min(1, p.born + dt / 0.3);
        if (p.drop) { p.y += p.vy * dt; if (p.y > 0.08) { p.drop = false; const a = rnd(0, Math.PI * 2); p.vx = Math.cos(a) * 0.05; p.vy = Math.sin(a) * 0.05; } return; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.x < 0.05 || p.x > 0.95) { p.vx = -p.vx; p.x = Math.min(0.95, Math.max(0.05, p.x)); }
        if (p.y < 0.07 || p.y > 0.93) { p.vy = -p.vy; p.y = Math.min(0.93, Math.max(0.07, p.y)); }
        if (Math.random() < dt * 0.4) { const a = Math.atan2(p.vy, p.vx) + rnd(-0.8, 0.8), v = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; }
      });
      parts = parts.filter(p => p.fade == null || p.fade < 0.6);
      if (active) {
        active.t += dt;
        if (active.t > 0.35 && !active.made) finishEvent(active);
        if (active.t > 0.6) { active = null; gap = 0.3; }
      } else if (events.length) {
        gap -= dt;
        if (gap <= 0) { active = startEvent(events.shift()); if (!active) events.length = 0; }
      }
    }
    function fit() {
      const r = box.getBoundingClientRect();
      dpr = global.devicePixelRatio || 1;
      W = Math.max(10, r.width); H = Math.max(10, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
    }
    function atom(g, x, y, r, e, al) {
      const c = ATOM[e];
      const gr = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
      gr.addColorStop(0, c[0]); gr.addColorStop(0.7, c[1]); gr.addColorStop(1, 'rgba(29,36,51,0.85)');
      g.globalAlpha = al; g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.ellipse(x - r * 0.36, y - r * 0.44, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    function draw() {
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const pad = 6, x0 = pad, y0 = pad, w = W - pad * 2, h = H - pad * 2, rad = Math.min(26, h * 0.18);
      g.fillStyle = '#f3f6fb'; g.strokeStyle = '#1d2433'; g.lineWidth = 2.5;
      g.beginPath(); g.roundRect(x0, y0, w, h, rad); g.fill(); g.stroke();
      g.font = '700 13px "Space Mono", monospace'; g.fillStyle = '#5b6474'; g.textAlign = 'right'; g.textBaseline = 'top';
      if (spec.pressure) { // particles mid-reaction still count until the new ones appear, so the reading never dips
        const nP = alive().length + (active && !active.made ? active.picked.length : 0);
        g.fillText('Total pressure: ' + (nP * spec.pressure).toFixed(2) + ' atm', x0 + w - 12, y0 + 9);
      } else if (spec.volume) g.fillText(spec.volume, x0 + w - 12, y0 + 9);
      const u = Math.max(3.2, Math.min(7.5, Math.sqrt(w * h / (parts.length + 6)) / 6.2));
      g.save(); g.beginPath(); g.roundRect(x0, y0, w, h, rad); g.clip();
      parts.forEach(p => {
        const s = SP[p.i], sc = u * (p.fade != null ? 1 - p.fade / 0.6 * 0.5 : 0.6 + 0.4 * p.born);
        const al = p.fade != null ? Math.max(0, 1 - p.fade / 0.6) : Math.min(1, 0.3 + p.born);
        const cx = x0 + p.x * w, cy = y0 + p.y * h, co = Math.cos(p.rot), si = Math.sin(p.rot);
        s.atoms.forEach(a => atom(g, cx + (a.x * co - a.y * si) * sc, cy + (a.x * si + a.y * co) * sc, a.r * sc, a.el, al));
      });
      g.restore();
    }
    function loop(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (!reduced) step(dt); else if (events.length || active) flush();
      draw();
      raf = requestAnimationFrame(loop);
    }
    fit();
    const ro = global.ResizeObserver ? new ResizeObserver(() => fit()) : null;
    if (ro) ro.observe(box);
    snap(spec.initial);
    raf = requestAnimationFrame(loop);
    return {
      el: wrap, goTo,
      get state() { return stateName; },
      tick(dt) { step(dt); }, // dev hook: advance the animation without frames (headless checks)
      destroy() { cancelAnimationFrame(raf); if (ro) ro.disconnect(); }
    };
  }

  // ---------- Q vs K gauge ----------
  // spec: { k, kLabel, lo, hi } (lo / hi: powers of ten at the ends of the line)
  function gauge(host, spec) {
    const root = el('div', 'ice-gauge');
    const track = el('div', 'ig-track');
    for (let p = spec.lo; p <= spec.hi; p++) {
      const t = el('span', 'ig-tick', '<span>' + (p >= 0 ? String(Math.pow(10, p)) : '0.' + '0'.repeat(-p - 1) + '1') + '</span>');
      t.style.left = (p - spec.lo) / (spec.hi - spec.lo) * 100 + '%'; track.appendChild(t);
    }
    const kM = el('span', 'ig-k', '<span>' + spec.kLabel + ' = ' + spec.k + '</span>');
    const qM = el('span', 'ig-q', '<span></span>');
    track.append(kM, qM);
    const status = el('p', 'ig-status'); status.setAttribute('aria-live', 'polite');
    root.append(el('p', 'ig-cap', 'Q compared with ' + spec.kLabel + ' (each mark is 10 times the last)'), track, status);
    host.appendChild(root);
    const pos = v => Math.min(100, Math.max(0, (Math.log10(v) - spec.lo) / (spec.hi - spec.lo) * 100)) + '%';
    kM.style.left = pos(spec.k);
    return {
      el: root,
      // st: null (no Q yet) or { q, shifted }
      set(st) {
        qM.hidden = !st;
        if (!st) { status.innerHTML = ''; return; }
        qM.style.left = pos(st.q);
        qM.querySelector('span').innerHTML = 'Q = ' + st.label;
        const K = spec.kLabel;
        status.innerHTML = st.shifted ? 'Q has risen to ' + K + ': the system is at equilibrium.'
          : st.q < spec.k ? 'Q &lt; ' + K + ': the reaction shifts to the products →'
          : st.q > spec.k ? '← Q &gt; ' + K + ': the reaction shifts to the reactants'
          : 'Q = ' + K + ': the system is at equilibrium.';
        root.classList.toggle('is-low', !st.shifted && st.q < spec.k);
      }
    };
  }

  global.IceUI = { same, evaluate, table, boxes, steps, bulb, gauge, SPECIES };
})(window);
