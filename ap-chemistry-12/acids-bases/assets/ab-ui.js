/* AbUI: stage components for the Acids and Bases Guides.
   - card(host, spec):   a prediction card that checks itself. Pick an answer: it turns green or red at once and
                         a one-line reason appears (strategy principle 4). Try again clears it. Nothing is saved.
   - cards(host, list):  a set of cards in a grid (sort them, label each species)
   - match(host, spec):  the conjugate matching game. Click a species, then its partner (one H⁺ apart).
                         A correct pair locks with "conjugate acid" / "conjugate base"; a wrong one shakes back.
   - modelSwitch(host, value, onChange): Lewis / Ball and stick / Space-filling
   - tabs(host, list, value, onChange): picture tabs for a section
   - stepper(host, lines, { bar, onStep }): Next step / Back drive the picture (visual primary, teacher 2026-11-27).
                         No sentences on the stage: a line can carry an equation (eqn), shown large under the
                         picture; the newest equation stays until a later line replaces it.
                         { stack: true }: a worked problem. Every equation so far stays, one per line, newest last
                         (calculation, then its result where it belongs: memory presenting-tool). */
(function (global) {
  'use strict';
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const plain = html => String(html).replace(/<[^>]+>/g, '');

  // spec: { prompt, options: [{ label, correct }], why, pic, onPick(i, ok) }
  // pic: optional small picture (SVG markup) beside the prompt; decorative, the prompt carries the meaning
  function card(host, spec) {
    const root = el('div', 'ab-card' + (spec.pic ? ' has-pic' : ''));
    if (spec.pic) { const p = el('div', 'ab-card-pic', spec.pic); p.setAttribute('aria-hidden', 'true'); root.appendChild(p); }
    if (spec.prompt) root.appendChild(el('p', 'ab-card-q', spec.prompt));
    const opts = el('div', 'ab-card-opts'); opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', plain(spec.prompt || 'Choose one'));
    const why = el('p', 'ab-card-why'); why.setAttribute('aria-live', 'polite');
    const again = el('button', 'btn btn-sm ab-card-again', 'Try again'); again.type = 'button'; again.hidden = true;
    let done = false;
    const btns = spec.options.map((o, i) => {
      const b = el('button', 'btn ab-opt', o.label); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        const ok = !!o.correct;
        b.setAttribute('aria-pressed', 'true');
        btns.forEach((x, k) => {
          const right = !!spec.options[k].correct;
          x.classList.toggle('is-right', right);
          x.classList.toggle('is-wrong', x === b && !right);
          x.setAttribute('aria-label', plain(spec.options[k].label) + (right ? ' (correct)' : x === b ? ' (your choice, not correct)' : ''));
        });
        root.classList.add(ok ? 'is-correct' : 'is-incorrect');
        why.innerHTML = '<b>' + (ok ? 'Correct.' : 'Not quite.') + '</b> ' + (spec.why || '');
        again.hidden = false;
        if (spec.onPick) spec.onPick(i, ok);
      });
      opts.appendChild(b); return b;
    });
    function reset() {
      done = false; root.classList.remove('is-correct', 'is-incorrect'); why.innerHTML = ''; again.hidden = true;
      btns.forEach(b => { b.classList.remove('is-right', 'is-wrong'); b.setAttribute('aria-pressed', 'false'); b.removeAttribute('aria-label'); });
      if (spec.onReset) spec.onReset();
    }
    again.addEventListener('click', reset);
    root.append(opts, why, again);
    host.appendChild(root);
    return { el: root, reset };
  }
  function cards(host, list, opts) {
    const grid = el('div', 'ab-cards' + (opts && opts.cols ? ' cols-' + opts.cols : ''));
    host.appendChild(grid);
    return list.map(spec => card(grid, spec));
  }

  // spec: { items: [{ html, pair, role: 'acid' | 'base' }] }
  function match(host, spec) {
    const root = el('div', 'ab-match');
    const head = el('div', 'ab-match-head');
    const count = el('p', 'ab-match-count'); count.setAttribute('aria-live', 'polite');
    const again = el('button', 'btn btn-sm', 'Start over'); again.type = 'button';
    head.append(count, again);
    const grid = el('div', 'ab-match-grid'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Species to pair up');
    root.append(head, grid);
    host.appendChild(root);
    const nPairs = new Set(spec.items.map(it => it.pair)).size;
    let picked = null, done = 0, order = [];
    function shuffle() {
      order = spec.items.map((it, i) => i);
      let seed = Date.now() % 997; // a different order each time, without Math.random
      for (let i = order.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor(seed / 233280 * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    }
    function render() {
      grid.innerHTML = ''; picked = null; done = 0;
      order.forEach(i => {
        const it = spec.items[i];
        const b = el('button', 'btn ab-tile', '<span class="ab-tile-f">' + it.html + '</span><span class="ab-tile-role" aria-hidden="true"></span>');
        b.type = 'button'; b.dataset.i = i; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => pick(b));
        grid.appendChild(b);
      });
      say();
    }
    function say(msg) { count.textContent = msg || (done === nPairs ? 'All ' + nPairs + ' pairs found.' : done + ' of ' + nPairs + ' pairs found'); }
    function pick(b) {
      if (b.classList.contains('is-locked')) return;
      if (!picked) { picked = b; b.setAttribute('aria-pressed', 'true'); return; }
      if (picked === b) { b.setAttribute('aria-pressed', 'false'); picked = null; return; }
      const a = spec.items[+picked.dataset.i], c = spec.items[+b.dataset.i];
      const first = picked; picked = null;
      if (a.pair === c.pair) {
        [first, b].forEach(x => {
          const it = spec.items[+x.dataset.i];
          x.classList.add('is-locked', 'pair-' + (done % 6)); x.setAttribute('aria-pressed', 'false');
          x.querySelector('.ab-tile-role').textContent = it.role === 'acid' ? 'conjugate acid' : 'conjugate base';
          x.setAttribute('aria-label', plain(it.html) + ', conjugate ' + it.role);
        });
        done++;
        say(done === nPairs ? 'All ' + nPairs + ' pairs found.' : 'A pair: ' + plain(a.role === 'acid' ? a.html : c.html) + ' and ' + plain(a.role === 'acid' ? c.html : a.html) + '. ' + done + ' of ' + nPairs + ' found');
      } else {
        [first, b].forEach(x => { x.setAttribute('aria-pressed', 'false'); x.classList.remove('is-shake'); void x.offsetWidth; x.classList.add('is-shake'); });
        say('Not a pair: ' + plain(a.html) + ' and ' + plain(c.html) + ' are not one H⁺ apart. ' + done + ' of ' + nPairs + ' found');
      }
    }
    again.addEventListener('click', () => { shuffle(); render(); });
    shuffle(); render();
    return { el: root };
  }

  const MODELS = [['lewis', 'Lewis'], ['ball', 'Ball and stick'], ['fill', 'Space-filling']];
  function seg(host, list, value, onChange, label) {
    const g = el('div', 'seg ab-seg'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
    const btns = list.map(([k, t]) => {
      const b = el('button', 'btn', t); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', String(k === value));
      b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); onChange(k); });
      g.appendChild(b); return b;
    });
    host.appendChild(g);
    return { el: g, set: k => btns.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === k))) };
  }
  const modelSwitch = (host, value, onChange) => seg(host, MODELS, value, onChange, 'Model');
  const tabs = (host, list, value, onChange) => seg(host, list, value, onChange, 'Choose a picture');

  function stepper(host, lines, o) {
    o = o || {};
    const box = el('div', 'ab-eqn' + (o.stack ? ' ab-calc' : '')); box.setAttribute('aria-live', 'polite');
    const has = lines.some(l => l.eqn);
    if (has) host.appendChild(box);
    const bar = el('div', 'ws-bar');
    const count = el('span', 'ws-count'); count.setAttribute('aria-hidden', 'true');
    const bAll = el('button', 'btn btn-sm', 'Show all'); bAll.type = 'button';
    const bBack = el('button', 'btn btn-sm', 'Back'); bBack.type = 'button';
    const bNext = el('button', 'btn primary ws-next', 'Next step'); bNext.type = 'button';
    bar.append(count, bAll, bBack, bNext);
    (o.bar || host).appendChild(bar);
    let shown = 0;
    function render(forward) {
      let eqn = null;
      if (o.stack) {
        const all = [];
        for (let k = 0; k < shown; k++) if (lines[k].eqn) all.push(lines[k].eqn);
        box.innerHTML = all.map((h, k) => '<div class="ab-calc-line' + (k === all.length - 1 && forward ? ' is-new' : '') + '">' + h + '</div>').join('');
        eqn = all.length ? all[all.length - 1] : null;
        const sc = forward && box.closest('.ice-grid');   // keep the newest line in view inside the stage only
        if (sc && sc.scrollHeight > sc.clientHeight) sc.scrollTop = sc.scrollHeight;
        if (forward && box.scrollHeight > box.clientHeight) box.scrollTop = box.scrollHeight;   // presentation view: the list scrolls in place
      } else {
        for (let k = 0; k < shown; k++) if (lines[k].eqn) eqn = lines[k].eqn;
        box.innerHTML = eqn || '';
      }
      box.classList.toggle('is-empty', !eqn);
      bBack.disabled = shown === 0; bNext.disabled = shown === lines.length; bAll.disabled = shown === lines.length;
      count.textContent = shown + ' / ' + lines.length;
      if (o.onStep) o.onStep(shown - 1, shown > 0 ? lines[shown - 1] : null, !!forward);
    }
    const api = {
      get index() { return shown; }, get length() { return lines.length; },
      next() { if (shown < lines.length) { shown++; render(true); } return shown; },
      back() { if (shown > 0) { shown--; render(false); } return shown; },
      all() { shown = lines.length; render(false); return shown; },
      reset() { shown = 0; render(false); return shown; }
    };
    bNext.addEventListener('click', api.next); bBack.addEventListener('click', api.back); bAll.addEventListener('click', api.all);
    render(false);
    return api;
  }

  global.AbUI = { card, cards, match, modelSwitch, tabs, stepper, el };
})(window);
