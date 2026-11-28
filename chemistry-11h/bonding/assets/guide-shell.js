/**
 * Chemical Bonding - guide shell (Task 6).
 *
 * One long scroll: chapters → beats. A sticky stage panel shows the active beat's scene.
 * Narrow screens: the stage sits under the beat in view instead (../../assets/guide-inline.js).
 * Ported from the IMF guide's scroll sync (reading line + hysteresis) and learn mode, plus:
 *   - scenes: each beat names a scene (data-scene); the shell mounts / updates / destroys them
 *   - presentation mode (P, or ?present=1): one beat at a time, big text left + stage right,
 *     clicker / arrows / Page keys / space step, Esc exits, T hides the text, chapter jump menu
 *   - nothing waits on animation: stepping calls settle() on the active scene first
 *
 * Scenes register with GuideShell.registerScene(name, factory):
 *   factory(mountEl, beatEl, ctx) → { update(beatEl), settle(), destroy() }   (all optional)
 *   ctx = { shell, presenting() }
 */
(function (global) {
  'use strict';

  var SCENES = {};
  function registerScene(name, factory) { SCENES[name] = factory; }

  // Fallback scene while a chapter is still being built
  registerScene('placeholder', function (mount, beat) {
    var box = document.createElement('div');
    box.className = 'scene-placeholder';
    mount.appendChild(box);
    function fill(b) {
      box.innerHTML = '';
      var k = document.createElement('p');
      k.className = 'scene-placeholder-kicker';
      k.textContent = 'Scene coming · ' + (b.dataset.plan || b.dataset.scene || '');
      var t = document.createElement('p');
      t.className = 'scene-placeholder-title';
      t.textContent = (b.querySelector('h3') || {}).textContent || '';
      box.appendChild(k);
      box.appendChild(t);
    }
    fill(beat);
    return { update: fill };
  });

  // Before we begin: the chapter's learning intentions and competencies, shown on the stage in
  // presentation mode (the text column is hidden there). While scrolling, the stage loads the
  // chapter's first scene instead, so it is ready beside the card (see stageBeat below).
  registerScene('brief', function (mount, beat) {
    var box = document.createElement('div');
    box.className = 'scene-brief';
    mount.appendChild(box);
    function fill(b) {
      box.innerHTML = '';
      var ch = b.closest('[data-chapter]');
      var h = ch && ch.querySelector('.chapter-head h2');
      var t = document.createElement('h2');
      t.className = 'scene-brief-title';
      t.textContent = h ? h.textContent : '';
      box.appendChild(t);
      var cols = b.querySelector('.brief-cols');
      if (cols) box.appendChild(cols.cloneNode(true));
    }
    fill(beat);
    return { update: fill };
  });

  function init() {
    var beats = Array.prototype.slice.call(document.querySelectorAll('.guide-beat'));
    if (!beats.length) return;
    var stageBody = document.getElementById('stageBody');
    var badge = document.getElementById('stageBadge');
    var where = document.getElementById('stageWhere');
    var presentBtn = document.getElementById('presentToggle');
    var prevBtn = document.getElementById('presentPrev');
    var nextBtn = document.getElementById('presentNext');
    var jump = document.getElementById('chapterJump');
    var progress = document.getElementById('presentProgress');
    var textBtn = document.getElementById('presentText');

    var active = null;
    var scene = null;          // { name, instance, host }
    var pinUntil = 0;
    var HYSTERESIS = 56;
    var ctx = { shell: null, presenting: function () { return document.body.classList.contains('present'); } };
    // Narrow screens: each beat's text, then its stage (assets/guide-inline.js)
    var inline = global.GuideInline ? GuideInline.attach({
      stage: document.querySelector('.guide-stage-panel'), beats: beats,
      skip: function (b) { return b.classList.contains('brief-beat'); },
      current: function () { return active; },
      activate: function (b) { apply(b); },
      presenting: ctx.presenting
    }) : null;

    // Number beats within their chapter ("B·1 · 3 of 10") for kickers and the presenter readout
    beats.forEach(function (b, i) {
      b.dataset.index = i;
      var k = b.querySelector('.beat-kicker');
      if (k && !k.textContent.trim()) {
        var sib = beats.filter(function (x) { return x.dataset.part === b.dataset.part; });
        k.textContent = b.dataset.part + ' · ' + (sib.indexOf(b) + 1) + ' of ' + sib.length + (b.dataset.tag ? ' · ' + b.dataset.tag : '');
      }
    });

    // Which beat the stage shows: a Before we begin card hands the stage to the next beat while
    // scrolling; in presentation mode the card itself is on the stage.
    function stageBeat(b) {
      if (!b.classList.contains('brief-beat') || ctx.presenting()) return b;
      return beats[beats.indexOf(b) + 1] || b;
    }

    function mountScene(b) {
      if (scene && scene.beat === b) return;   // already on the stage (preloaded by a brief)
      var name = b.dataset.scene || 'placeholder';
      if (!SCENES[name]) name = 'placeholder';
      var sameGroup = scene && scene.name === name && (b.dataset.group || b.id) === scene.group;
      if (sameGroup && scene.instance.update) { scene.instance.update(b); scene.beat = b; return; }
      if (scene) {
        if (scene.instance.destroy) scene.instance.destroy();
        var old = scene.host;
        old.classList.add('is-leaving');
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 220);
      }
      var host = document.createElement('div');
      host.className = 'scene-host';
      stageBody.appendChild(host);
      scene = { name: name, group: b.dataset.group || b.id, beat: b, host: host, instance: SCENES[name](host, b, ctx) || {} };
      // dev: ?settle jumps every scene to its end state (headless screenshots)
      if (/[?&]settle/.test(location.search)) { var inst = scene.instance; setTimeout(function () { if (inst.settle) inst.settle(); }, 60); }
    }

    function apply(b, force) {
      if (!b || (b === active && !force)) return;
      if (inline) inline.place(stageBeat(b));   // before the old scene leaves, so its still copy keeps it
      active = b;
      beats.forEach(function (x) { x.classList.toggle('is-active', x === b); });
      var sb = stageBeat(b);
      var h = sb.querySelector('h3');
      badge.textContent = h ? h.textContent : '';
      where.textContent = sb.dataset.part + (sb.dataset.tag ? ' · ' + sb.dataset.tag : '');
      if (progress) progress.textContent = (beats.indexOf(b) + 1) + ' / ' + beats.length;
      if (jump) jump.value = b.closest('[data-chapter]') ? b.closest('[data-chapter]').id : '';
      mountScene(sb);
      if (history.replaceState && ctx.presenting()) history.replaceState(null, '', '#' + b.id);
    }

    // --- Scroll sync (student mode) --------------------------------------------------------
    function pickFromScroll() {
      if (ctx.presenting() || Date.now() < pinUntil || (inline && inline.on())) return;
      var line = window.innerHeight * 0.38;
      var best = null, bestD = Infinity, activeD = Infinity;
      beats.forEach(function (b) {
        var r = b.getBoundingClientRect();
        if (r.bottom < 80 || r.top > window.innerHeight - 80) return;
        var d = Math.abs((r.top + r.bottom) / 2 - line);
        if (b === active) activeD = d;
        if (d < bestD) { bestD = d; best = b; }
      });
      var last = beats[beats.length - 1];
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && last.getBoundingClientRect().top < window.innerHeight - 80) { best = last; bestD = -Infinity; }
      if (best && best !== active && bestD + HYSTERESIS < activeD) apply(best);
    }
    var tick = 0;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = requestAnimationFrame(function () { tick = 0; pickFromScroll(); });
    }, { passive: true });

    function scrollToBeat(b, smooth) {
      if (inline && inline.on()) { inline.scrollTo(b, smooth); return; }
      var r = b.getBoundingClientRect();
      var top = window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.38;
      window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
    }
    function goTo(b, smooth) {
      if (!b) return;
      if (scene && scene.instance.settle) scene.instance.settle();   // nothing waits on animation
      pinUntil = Date.now() + 800;
      apply(b);
      if (!ctx.presenting()) scrollToBeat(b, smooth);
    }
    function step(dir) {
      var i = beats.indexOf(active) + dir;
      if (i >= 0 && i < beats.length) goTo(beats[i], true);
      if (ctx.presenting()) focusBeat();
    }
    function focusBeat() {
      var h = active && active.querySelector('h3');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }

    // In-page links (chapter TOC, beat links)
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        var b = target.classList.contains('guide-beat') ? target : target.querySelector('.guide-beat');
        if (!b) return;
        e.preventDefault();
        goTo(b, true);
        if (history.replaceState) history.replaceState(null, '', '#' + b.id);
      });
    });

    // --- Presentation mode -----------------------------------------------------------------
    function setPresent(on) {
      document.body.classList.toggle('present', on);
      if (presentBtn) presentBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (inline) inline.sync();   // the stage leaves (or returns to) the slot under its beat
      if (active && active.classList.contains('brief-beat')) apply(active, true);   // card ↔ first scene
      if (on) focusBeat();
      else if (active) { pinUntil = Date.now() + 600; scrollToBeat(active, false); }
      window.dispatchEvent(new Event('resize'));   // stages re-measure at the new scale
    }
    function setText(on) {
      document.body.classList.toggle('present-text-off', !on);
      if (textBtn) textBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
      window.dispatchEvent(new Event('resize'));
    }
    if (presentBtn) presentBtn.addEventListener('click', function () { setPresent(!ctx.presenting()); });
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
    if (textBtn) textBtn.addEventListener('click', function () { setText(document.body.classList.contains('present-text-off')); });
    if (jump) jump.addEventListener('change', function () {
      var ch = document.getElementById(jump.value);
      if (ch) goTo(ch.querySelector('.guide-beat'), true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      // Typing, drawing and form controls keep their own keys
      if (t.closest && t.closest('input, select, textarea, .de-svg, .de-tally-list, [contenteditable]')) return;
      var k = e.key;
      if ((k === 'p' || k === 'P') && !e.shiftKey) { e.preventDefault(); setPresent(!ctx.presenting()); return; }
      if (!ctx.presenting()) return;
      var onButton = /^(BUTTON|A)$/.test(t.tagName);
      if (k === 'Escape') { setPresent(false); }
      else if (k === 't' || k === 'T') { setText(document.body.classList.contains('present-text-off')); }
      else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !onButton && !e.shiftKey)) { e.preventDefault(); step(1); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && !onButton && e.shiftKey)) { e.preventDefault(); step(-1); }
      else if (k === 'Home') { e.preventDefault(); goTo(beats[0]); focusBeat(); }
      else if (k === 'End') { e.preventDefault(); goTo(beats[beats.length - 1]); focusBeat(); }
    });

    // --- Start -------------------------------------------------------------------------------
    var q = new URLSearchParams(location.search);
    var start = document.getElementById((location.hash || '').slice(1));
    var startBeat = start ? (start.classList.contains('guide-beat') ? start : start.querySelector('.guide-beat')) : null;
    apply(startBeat || beats[0]);
    if (q.get('present') === '1') setPresent(true);
    else if (startBeat) setTimeout(function () { scrollToBeat(startBeat, false); }, 0);

    ctx.shell = { goTo: goTo, step: step, active: function () { return active; }, beats: beats, setPresent: setPresent };
    global.GuideShell.shell = ctx.shell;
  }

  global.GuideShell = { registerScene: registerScene, init: init, shell: null };
})(window);
