/* Skip bar — teacher (?demo=1) or student (after this module is complete).
   First-time students never see it. Keyboard ← → / H are teacher-only. */
(function (global) {
  'use strict';

  var qs = new URLSearchParams(location.search);
  var teacher = qs.has('demo');
  var HIDE_KEY = teacher ? 'unit1b_demo_bar_hidden' : 'unit1b_stages_bar_hidden';
  var COMPLETE_KEY = 'unit1b_complete';
  var barHidden = false;
  try { barHidden = sessionStorage.getItem(HIDE_KEY) === '1'; } catch (e) {}

  var controller = null;
  var mounted = false;
  var keysBound = false;
  var clicksWired = false;
  var completeWired = false;

  function $(id) { return document.getElementById(id); }

  function fileName() {
    var path = location.pathname.replace(/\\/g, '/');
    return decodeURIComponent(path.split('/').pop() || '');
  }

  function moduleIdFromFile() {
    var m = /^(\d{2})-/.exec(fileName());
    return m ? m[1] : null;
  }

  function readComplete() {
    if (global.SuiteChrome && typeof SuiteChrome.isComplete === 'function') {
      return null;
    }
    var map = {};
    try { map = JSON.parse(global.localStorage.getItem(COMPLETE_KEY)) || {}; } catch (e) {}
    try {
      if (global.localStorage.getItem('mod01_complete') === 'true' && !map['01']) {
        map['01'] = true;
        global.localStorage.setItem(COMPLETE_KEY, JSON.stringify(map));
      }
    } catch (e) {}
    return map;
  }

  function isComplete(id) {
    if (!id) return false;
    if (global.SuiteChrome && typeof SuiteChrome.isComplete === 'function') {
      return SuiteChrome.isComplete(id);
    }
    return !!readComplete()[String(id)];
  }

  function markComplete(id) {
    if (!id) return;
    if (global.SuiteChrome && typeof SuiteChrome.markComplete === 'function') {
      SuiteChrome.markComplete(id);
      return;
    }
    var map = readComplete() || {};
    map[String(id)] = true;
    try { global.localStorage.setItem(COMPLETE_KEY, JSON.stringify(map)); } catch (e) {}
  }

  function isBriefing() {
    var b = $('briefing');
    return !!(b && !b.hidden);
  }

  function isDebriefing() {
    var d = $('debrief');
    if (d && !d.hidden) return true;
    var stage = $('moduleStage');
    return !!(stage && stage.classList.contains('is-debriefing'));
  }

  function showBriefing() {
    leaveDebrief();
    var stage = $('moduleStage');
    var briefing = $('briefing');
    if (stage) stage.hidden = true;
    if (briefing) briefing.hidden = false;
    window.scrollTo(0, 0);
  }

  function leaveDebrief() {
    if (typeof leaveDebriefStage === 'function') {
      leaveDebriefStage();
    } else if (typeof SuiteChrome !== 'undefined' && SuiteChrome.leaveDebriefStage) {
      SuiteChrome.leaveDebriefStage();
    } else if (typeof hideDebrief === 'function') {
      hideDebrief();
    }
    var stage = $('moduleStage');
    if (stage) stage.classList.remove('is-debriefing');
  }

  function ensureStarted(startFn) {
    var briefing = $('briefing');
    var stage = $('moduleStage');
    if (briefing && !briefing.hidden && typeof startFn === 'function') {
      startFn();
    } else if (stage && stage.hidden && typeof startFn === 'function') {
      startFn();
    } else {
      leaveDebrief();
      if (stage) stage.hidden = false;
      if (briefing) briefing.hidden = true;
    }
  }

  function scrollTop() { window.scrollTo(0, 0); }

  /* ---------- per-module adapters ---------- */

  function adapter01() {
    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(startModule);
      STATE.completed = false;
      STATE.mode = 'challenge';
      if (id === 't1') {
        STATE.tier = 1; STATE.challengeIndex = 0; setChallenge();
      } else if (id === 't2') {
        STATE.tier = 2; STATE.challengeIndex = 0; setChallenge();
      } else if (id === 't3') {
        STATE.tier = 3; STATE.challengeIndex = 0;
        if (typeof resetTutorialState === 'function') resetTutorialState();
        setChallenge();
      } else if (id === 't4') {
        STATE.tier = 4;
        if (typeof resetMassSpecState === 'function') resetMassSpecState();
        setChallenge();
      } else if (id === 'debrief') {
        STATE.completed = true;
        showCompletion();
      }
      scrollTop();
    }
    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 't1', label: 'Build' },
        { id: 't2', label: 'Isotopes' },
        { id: 't3', label: 'Avg mass' },
        { id: 't4', label: 'Mass spec' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        return 't' + (STATE.tier || 1);
      },
      go: go
    };
  }

  function adapter02() {
    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(function () { startModule({ skipIntro: true }); });
      var playground = $('playground');
      var p2 = $('part2');
      if (id === 'sandbox') {
        if (p2) { p2.hidden = true; p2.classList.remove('is-live'); }
        if (playground) {
          playground.hidden = false;
          playground.classList.add('intro-done');
          playground.classList.remove('intro-active', 'is-leaving');
        }
        if (typeof resize === 'function') requestAnimationFrame(resize);
      } else if (id === 'part2') {
        if (typeof CHALLENGE !== 'undefined') CHALLENGE.phase = 'done';
        goToPart2();
      } else if (id === 'debrief') {
        revealDebrief();
      }
      scrollTop();
    }
    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 'sandbox', label: 'Sandbox' },
        { id: 'part2', label: 'Ionization' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        var p2 = $('part2');
        if (p2 && !p2.hidden) return 'part2';
        return 'sandbox';
      },
      go: go
    };
  }

  function adapter03() {
    function hideActs() {
      ['actLi', 'actPeriod', 'actCompare', 'actGroup'].forEach(function (id) {
        var el = $(id);
        if (!el) return;
        el.hidden = true;
        el.classList.remove('is-exiting');
      });
      var header = document.querySelector('#moduleStage > header');
      if (header) {
        header.hidden = false;
        header.classList.remove('is-clearing');
      }
      var help = $('helpPanel');
      if (help) help.hidden = false;
    }

    function goLi() {
      hideActs();
      var framing = $('framing');
      if (framing) framing.hidden = false;
      var actLi = $('actLi');
      if (actLi) actLi.hidden = false;
      STATE.act = 'li';
      STATE.transitioning = false;
      STATE.inner = 0;
      STATE.reachedPlus1 = false;
      STATE.revealStage = 0;
      renderLiAtoms();
      var nextBtn = $('liNext');
      if (nextBtn) nextBtn.disabled = false;
      syncStageNav();
    }

    function goPeriod() {
      hideActs();
      var framing = $('framing');
      if (framing) framing.hidden = true;
      $('actPeriod').hidden = false;
      var chrome = $('periodChrome');
      var pageNav = $('pageNav');
      var periodEq = $('periodEq');
      if (chrome) chrome.classList.add('is-in');
      if (pageNav) pageNav.classList.add('is-in');
      if (periodEq) periodEq.setAttribute('aria-hidden', 'false');
      STATE.act = 'period';
      STATE.periodPage = 0;
      STATE.transitioning = false;
      STATE.inner = 2;
      STATE.reachedPlus1 = true;
      STATE.revealStage = 5;
      renderPeriodPage({ animate: false });
      var pageNext = $('pageNext');
      if (pageNext) pageNext.disabled = false;
      syncStageNav();
    }

    function goCompare() {
      hideActs();
      var framing = $('framing');
      if (framing) framing.hidden = true;
      STATE.transitioning = false;
      STATE.compareStep = 0;
      var actCompare = $('actCompare');
      var chrome = $('compareChrome');
      var actions = $('compareActions');
      var grid = $('compareGrid');
      var prompt = $('comparePrompt');
      if (prompt) {
        prompt.textContent = 'Take a look at the entire row — what do you notice?';
        prompt.classList.add('student-q');
      }
      if (grid) {
        grid.replaceChildren();
        if (typeof mountIEStrip === 'function') mountIEStrip($('compareIEHost'));
        PERIOD2_ROW.forEach(function (atom, i) {
          var card = makeCompareCard(atom, { uid: 'demo-cmp-' + i });
          card.classList.add('is-in');
          grid.appendChild(card);
        });
      }
      actCompare.hidden = false;
      if (chrome) chrome.classList.add('is-in');
      if (actions) actions.classList.add('is-in');
      var doneBtn = $('compareDone');
      if (doneBtn) doneBtn.disabled = false;
      STATE.act = 'compare';
      syncStageNav();
    }

    function goGroup() {
      hideActs();
      var framing = $('framing');
      if (framing) framing.hidden = true;
      STATE.transitioning = false;
      STATE.groupStep = 0;
      var actGroup = $('actGroup');
      var chrome = $('groupChrome');
      var actions = $('groupActions');
      actGroup.hidden = false;
      if (chrome) chrome.classList.add('is-in');
      if (actions) actions.classList.add('is-in');
      STATE.act = 'group';
      if (typeof renderAlkaliColumn === 'function') renderAlkaliColumn();
      var groupNext = $('groupNext');
      var groupFade = $('groupFadeBtn');
      if (groupNext) groupNext.disabled = false;
      if (groupFade) groupFade.disabled = false;
      syncStageNav();
    }

    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(startModule);
      if (id === 'li') goLi();
      else if (id === 'period') goPeriod();
      else if (id === 'compare') goCompare();
      else if (id === 'group') goGroup();
      else if (id === 'debrief') {
        if (typeof finishAct1 === 'function') finishAct1();
        else revealDebrief();
      }
      scrollTop();
    }

    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 'li', label: 'Lithium' },
        { id: 'period', label: 'Period' },
        { id: 'compare', label: 'Compare' },
        { id: 'group', label: 'Group' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        return STATE.act || 'li';
      },
      go: go
    };
  }

  function adapter04() {
    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(startModule);
      if (id === 'debrief') {
        STATE.actIndex = ACTS.length - 1;
        STATE.defineMeasured = true;
        STATE.downStep = 2;
        STATE.ionStep = 2;
        STATE.ionTransferred = true;
        showAct('summary');
        setGate('moduleComplete', true);
        scrollTop();
        return;
      }
      var idx = ACTS.indexOf(id);
      if (idx < 0) return;
      STATE.actIndex = idx;
      STATE.defineMeasured = true;
      STATE.downStep = id === 'down' ? 0 : 2;
      if (id === 'ions') {
        STATE.ionStep = 0;
        STATE.ionTransferred = false;
      } else if (idx > ACTS.indexOf('ions')) {
        STATE.ionStep = 2;
        STATE.ionTransferred = true;
      }
      showAct(id);
      var next = $('stageNext');
      if (next) {
        next.disabled = false;
        next.textContent = id === 'summary' ? 'Finish → What this was for' : 'Continue →';
      }
      scrollTop();
    }
    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 'define', label: 'Radius' },
        { id: 'hypothesize', label: 'Hypothesize' },
        { id: 'across', label: 'Across' },
        { id: 'down', label: 'Down' },
        { id: 'ions', label: 'Ions' },
        { id: 'summary', label: 'Summary' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        return ACTS[STATE.actIndex] || 'define';
      },
      go: go
    };
  }

  function adapter05() {
    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(startModule);
      if (id === 'debrief') {
        STATE.namedE = true;
        STATE.namedIE = true;
        STATE.ejected = true;
        setAct(3);
        setGate('moduleComplete', true);
        scrollTop();
        return;
      }
      var n = Number(id.replace('act', '')) || 1;
      if (n >= 2) STATE.namedE = true;
      if (n >= 3) { STATE.namedIE = true; STATE.hasSwept = true; }
      STATE.hasSwept = true;
      setAct(n);
      if (n === 2 && typeof finishPhotonIntro === 'function') {
        finishPhotonIntro();
        STATE.namedE = true;
      }
      var btn = document.querySelector('#continueBtn, .module-footer .submit');
      if (btn) btn.disabled = false;
      scrollTop();
    }
    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 'act1', label: 'Wave' },
        { id: 'act2', label: 'Photon energy' },
        { id: 'act3', label: 'Ionization' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        return 'act' + (STATE.act || 1);
      },
      go: go
    };
  }

  function adapter06() {
    function go(id) {
      if (id === 'briefing') { showBriefing(); return; }
      ensureStarted(startModule);
      if (id === 'debrief') {
        STATE.namedIE = true;
        STATE.partDone = true;
        revealDebrief();
        scrollTop();
        return;
      }
      var n = Number(id.replace('act', '')) || 1;
      if (n >= 2) {
        STATE.hasSeenKE = true;
        STATE.namedIE = true;
        STATE.promptsShown = true;
      }
      if (n >= 3) {
        STATE.act2Phase = 'done';
        STATE.act2Milestone = 5;
        STATE.peakHeights = { 0.85: 3, 4.25: 2 };
        STATE.partDone = true;
      }
      setAct(n);
      scrollTop();
    }
    return {
      parts: [
        { id: 'briefing', label: 'Briefing' },
        { id: 'act1', label: 'Photon & detector' },
        { id: 'act2', label: 'Quantized levels' },
        { id: 'act3', label: 'Practice' },
        { id: 'debrief', label: 'Debrief' }
      ],
      current: function () {
        if (isBriefing()) return 'briefing';
        if (isDebriefing()) return 'debrief';
        return 'act' + (STATE.act || 1);
      },
      go: go
    };
  }

  function hookAdapter() {
    var hook = global.Unit1bDemo;
    if (!hook || !hook.parts || typeof hook.go !== 'function') return null;
    return {
      parts: hook.parts,
      current: typeof hook.current === 'function' ? hook.current : function () { return hook.parts[1].id; },
      go: hook.go
    };
  }

  function pickAdapter() {
    var name = fileName();
    if (name.indexOf('01-') === 0) return adapter01();
    if (name.indexOf('02-') === 0) return adapter02();
    if (name.indexOf('03-') === 0) return adapter03();
    if (name.indexOf('04-') === 0) return adapter04();
    if (name.indexOf('05-') === 0) return adapter05();
    if (name.indexOf('06-') === 0) return adapter06();
    return hookAdapter();
  }

  /* ---------- chrome ---------- */

  function injectStyle() {
    if ($('demoSkipStyle')) return;
    var css = document.createElement('style');
    css.id = 'demoSkipStyle';
    css.textContent = [
      'body.demo-skip-on{padding-bottom:3.4rem;}',
      '#demoSkip{position:fixed;left:0;right:0;bottom:0;z-index:10000;',
      'background:var(--plate,#050505);color:var(--plate-ink,#e8e6d9);',
      'border-top:2px solid var(--plate-ink,#e8e6d9);',
      'font-family:var(--font-mono,ui-monospace,monospace);',
      'font-variant-numeric:tabular-nums;font-size:0.72rem;',
      'letter-spacing:0.08em;text-transform:uppercase;}',
      '#demoSkip[hidden]{display:none;}',
      '#demoSkip .demo-skip-inner{display:flex;align-items:center;gap:0.55rem;',
      'flex-wrap:wrap;padding:0.45rem 0.7rem 0.5rem;max-width:1120px;margin:0 auto;}',
      '#demoSkip .demo-skip-kicker{font-weight:600;letter-spacing:0.16em;color:#c4a35a;flex:none;}',
      '#demoSkip .demo-skip-parts{display:flex;flex-wrap:wrap;gap:0.2rem;flex:1;}',
      '#demoSkip button{appearance:none;background:transparent;color:inherit;',
      'border:1px solid transparent;border-radius:0;font:inherit;letter-spacing:inherit;',
      'text-transform:inherit;padding:0.22rem 0.45rem;cursor:pointer;color:#b7b39f;}',
      '#demoSkip button:hover,#demoSkip button:focus-visible{color:var(--plate-ink,#e8e6d9);',
      'border-color:rgba(232,230,217,0.45);outline:none;}',
      '#demoSkip button.is-on{color:var(--plate-ink,#e8e6d9);border-color:var(--plate-ink,#e8e6d9);}',
      '#demoSkip .demo-skip-keys{color:#8a8674;flex:none;letter-spacing:0.06em;}',
      '#demoSkip .demo-skip-hide{margin-left:auto;flex:none;}'
    ].join('');
    document.head.appendChild(css);
  }

  function mountBar(ctrl) {
    injectStyle();
    document.body.classList.add('demo-skip-on');
    var nav = document.createElement('nav');
    nav.id = 'demoSkip';
    nav.setAttribute('aria-label', teacher ? 'Demo skip' : 'Stages');
    if (barHidden) {
      nav.hidden = true;
      document.body.classList.remove('demo-skip-on');
    }
    var partsHtml = ctrl.parts.map(function (p) {
      return '<button type="button" data-demo-part="' + p.id + '">' + p.label + '</button>';
    }).join('');
    var keys = teacher
      ? '<span class="demo-skip-keys">← → skip · H hide</span>'
      : '';
    nav.innerHTML =
      '<div class="demo-skip-inner">' +
        '<span class="demo-skip-kicker">' + (teacher ? 'Demo skip' : 'Stages') + '</span>' +
        '<div class="demo-skip-parts">' + partsHtml + '</div>' +
        keys +
        '<button type="button" class="demo-skip-hide" data-demo-hide>Hide</button>' +
      '</div>';
    document.body.appendChild(nav);
    nav.addEventListener('click', function (e) {
      var hideBtn = e.target.closest('[data-demo-hide]');
      if (hideBtn) { toggleBar(true); return; }
      var btn = e.target.closest('[data-demo-part]');
      if (!btn) return;
      ctrl.go(btn.getAttribute('data-demo-part'));
      paint(ctrl);
    });
  }

  function toggleBar(forceHide) {
    barHidden = forceHide == null ? !barHidden : !!forceHide;
    try { sessionStorage.setItem(HIDE_KEY, barHidden ? '1' : '0'); } catch (e) {}
    var nav = $('demoSkip');
    if (nav) nav.hidden = barHidden;
    document.body.classList.toggle('demo-skip-on', !barHidden);
  }

  function paint(ctrl) {
    var nav = $('demoSkip');
    if (!nav || !ctrl) return;
    var cur = ctrl.current();
    nav.querySelectorAll('[data-demo-part]').forEach(function (btn) {
      btn.classList.toggle('is-on', btn.getAttribute('data-demo-part') === cur);
    });
  }

  function step(ctrl, dir) {
    var ids = ctrl.parts.map(function (p) { return p.id; });
    var cur = ctrl.current();
    var i = ids.indexOf(cur);
    if (i < 0) i = isBriefing() ? 0 : 1;
    var next = Math.max(0, Math.min(ids.length - 1, i + dir));
    if (ids[next] === cur && dir > 0 && next < ids.length - 1) next += 1;
    ctrl.go(ids[next]);
    paint(ctrl);
  }

  function bindKeys(ctrl) {
    if (keysBound || !teacher) return;
    keysBound = true;
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        step(ctrl, 1);
      } else if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        step(ctrl, -1);
      } else if (e.key === 'h' || e.key === 'H' || e.key === '`') {
        e.preventDefault();
        toggleBar();
      }
    });
  }

  function demoHref(href) {
    if (!href) return href;
    if (href === 'index.html' || href === './index.html') return 'demo/index.html';
    var file = href.split('?')[0].split('#')[0];
    if (!/^\d{2}-.+\.html$/.test(file)) return href;
    if (/(?:\?|&)demo(?:&|=|$)/.test(href)) return href;
    var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    var q = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?') + 1).split('#')[0] : '';
    return file + '?demo=1' + (q ? '&' + q : '') + hash;
  }

  function rewriteLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var next = demoHref(a.getAttribute('href'));
      if (next && next !== a.getAttribute('href')) a.setAttribute('href', next);
    });
  }

  function retargetClicks() {
    if (clicksWired) return;
    clicksWired = true;
    rewriteLinks();
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var next = demoHref(href);
      if (!next || next === href) return;
      e.preventDefault();
      location.href = next;
    }, true);
  }

  function watch(ctrl) {
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function () { paint(ctrl); });
    ['briefing', 'debrief', 'moduleStage'].forEach(function (id) {
      var el = $(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ['hidden', 'class'] });
    });
  }

  function shouldShow() {
    return teacher || isComplete(moduleIdFromFile());
  }

  function refresh() {
    if (!controller) controller = pickAdapter();
    if (!controller) return;
    if (!shouldShow()) return;
    if (mounted) {
      paint(controller);
      return;
    }
    mountBar(controller);
    bindKeys(controller);
    watch(controller);
    mounted = true;
    if (teacher) {
      retargetClicks();
      if (isBriefing()) {
        var first = controller.parts[1];
        if (first) controller.go(first.id);
      }
      rewriteLinks();
    }
    paint(controller);
  }

  function onMarked(id) {
    markComplete(id || moduleIdFromFile());
    refresh();
  }

  function patchRevealDebrief() {
    if (!global.SuiteChrome || typeof SuiteChrome.revealDebrief !== 'function') return;
    if (SuiteChrome.revealDebrief._unit1bSkipPatched) return;
    var orig = SuiteChrome.revealDebrief;
    function wrapped(debrief, opts) {
      orig(debrief, opts);
      onMarked((opts && opts.moduleId) || moduleIdFromFile());
    }
    wrapped._unit1bSkipPatched = true;
    SuiteChrome.revealDebrief = wrapped;
  }

  function boot() {
    if (!completeWired) {
      completeWired = true;
      global.addEventListener('unit1b-complete', function () { refresh(); });
    }
    patchRevealDebrief();
    global.Unit1bSkip = {
      markComplete: onMarked,
      isComplete: isComplete,
      refresh: refresh
    };
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
