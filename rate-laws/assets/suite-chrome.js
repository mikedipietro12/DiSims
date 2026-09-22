/* Suite chrome helpers — briefing / debrief / Stuck? wiring.
   Modules 06+ should <script src="assets/suite-chrome.js"></script> before
   their own script, then call SuiteChrome.* with the module's DEBRIEF object.
   Modules 01–05 may keep local copies; do not regenerate those unless asked. */
(function (global) {
  'use strict';

  var prefersReduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revisitHandler = null;
  var revisitWired = false;

  function fillIntentionList(ul, items, opts) {
    if (!ul || ul.childElementCount) return;
    opts = opts || {};
    var showRevisit = !!opts.showRevisit;
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(item.text));
      if (item.note) {
        li.className = 'elsewhere';
        var tag = document.createElement('span');
        tag.className = 'debrief-tag';
        tag.textContent = ' — ' + item.note;
        li.appendChild(tag);
      }
      if (showRevisit && item.target && item.revisit) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'debrief-revisit';
        btn.dataset.target = item.target;
        btn.textContent = 'Explore again → ' + item.revisit;
        li.appendChild(btn);
      }
      ul.appendChild(li);
    });
  }

  function fillCompetencyList(ul, items, opts) {
    if (!ul || ul.childElementCount) return;
    opts = opts || {};
    var showRevisit = !!opts.showRevisit;
    items.forEach(function (item) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.className = 'cc-name';
      name.textContent = item.name;
      li.appendChild(name);
      li.appendChild(document.createTextNode(item.text));
      if (item.note) {
        var tag = document.createElement('span');
        tag.className = 'debrief-tag';
        tag.textContent = ' — ' + item.note;
        li.appendChild(tag);
      }
      if (showRevisit && item.target && item.revisit) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'debrief-revisit';
        btn.dataset.target = item.target;
        btn.textContent = 'Explore again → ' + item.revisit;
        li.appendChild(btn);
      }
      ul.appendChild(li);
    });
  }

  function renderBriefing(debrief) {
    if (!debrief) return;
    fillIntentionList(document.getElementById('briefingIntentions'), debrief.intentions);
    var ek = debrief.essentialKnowledge;
    if (ek) {
      fillCompetencyList(document.getElementById('briefingEssential'), ek);
      fillCompetencyList(document.getElementById('briefingCompetencies'), debrief.competencies);
    } else {
      fillCompetencyList(document.getElementById('briefingCompetencies'), debrief.competencies);
    }
  }

  function renderDebrief(debrief) {
    if (!debrief) return;
    fillIntentionList(document.getElementById('debriefIntentions'), debrief.intentions, {
      showRevisit: true
    });
    var ek = debrief.essentialKnowledge;
    if (ek) {
      fillCompetencyList(document.getElementById('debriefEssential'), ek, {
        showRevisit: true
      });
      fillCompetencyList(document.getElementById('debriefCompetencies'), debrief.competencies, {
        showRevisit: true
      });
    } else {
      fillCompetencyList(document.getElementById('debriefCompetencies'), debrief.competencies, {
        showRevisit: true
      });
    }
  }

  function enterDebriefStage() {
    var stage = document.getElementById('moduleStage');
    var debrief = document.getElementById('debrief');
    if (!stage || !debrief) return;
    Array.prototype.forEach.call(stage.children, function (child) {
      if (child === debrief) return;
      if (!child.hasAttribute('data-pre-debrief-hidden')) {
        child.setAttribute('data-pre-debrief-hidden', child.hidden ? '1' : '0');
      }
      child.hidden = true;
    });
    debrief.hidden = false;
  }

  function leaveDebriefStage() {
    var stage = document.getElementById('moduleStage');
    var debrief = document.getElementById('debrief');
    if (!stage) return;
    Array.prototype.forEach.call(stage.children, function (child) {
      if (child === debrief) return;
      if (child.hasAttribute('data-pre-debrief-hidden')) {
        child.hidden = child.getAttribute('data-pre-debrief-hidden') === '1';
        child.removeAttribute('data-pre-debrief-hidden');
      }
    });
    if (debrief) debrief.hidden = true;
  }

  function wireRevisitClicks() {
    if (revisitWired) return;
    revisitWired = true;
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.debrief-revisit') : null;
      if (!btn || !btn.dataset.target) return;
      e.preventDefault();
      if (typeof revisitHandler === 'function') {
        revisitHandler(btn.dataset.target);
      }
    });
  }

  function revealDebrief(debrief, opts) {
    var section = document.getElementById('debrief');
    if (!section) return;
    opts = opts || {};
    renderDebrief(debrief);
    if (opts.onRevisit) revisitHandler = opts.onRevisit;
    wireRevisitClicks();
    if (opts.exclusive !== false) enterDebriefStage();
    else section.hidden = false;
    section.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function wireStuckHelp() {
    var stuckBtn = document.getElementById('stuckBtn');
    var helpPanel = document.getElementById('helpPanel');
    if (!stuckBtn || !helpPanel) return;
    stuckBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      helpPanel.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!helpPanel.contains(e.target) && e.target !== stuckBtn) {
        helpPanel.classList.remove('open');
      }
    });
  }

  global.SuiteChrome = {
    prefersReduced: prefersReduced,
    fillIntentionList: fillIntentionList,
    fillCompetencyList: fillCompetencyList,
    renderBriefing: renderBriefing,
    renderDebrief: renderDebrief,
    revealDebrief: revealDebrief,
    enterDebriefStage: enterDebriefStage,
    leaveDebriefStage: leaveDebriefStage,
    wireStuckHelp: wireStuckHelp
  };
})(typeof window !== 'undefined' ? window : this);
