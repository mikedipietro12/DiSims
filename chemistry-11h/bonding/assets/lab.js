/**
 * Chemical Bonding - Draw Lab (Task 13).
 * Pick a molecule (or a blank canvas), draw it with the shared draw engine, see a green box when the drawing
 * matches the accepted structure, and lift it into 3D once every count is complete.
 *
 *   lab.html?m=ch4      open on a molecule (the picker keeps the URL in step)
 *   window.DrawLab      { pick(id), engine(), open3d(on), state() } for the dev self-test
 */
(function (global) {
  'use strict';
  var Kit = global.BondingKit, SL = global.ShapeLift;
  var ORDER = ['H', 'Li', 'Na', 'K', 'Mg', 'Ca', 'B', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I', 'Xe'];
  var METALS = { Li: 1, Na: 1, K: 1, Mg: 1, Ca: 1 };
  var BLANK = 'blank';

  // Picker groups. Every molecule tagged 'lab' in the kit appears once (the self-test checks this).
  var GROUPS = [
    { label: 'Starter list', ids: Kit.STARTER_LIST },
    { label: 'More molecules', ids: ['cl2', 'hcl', 'o2', 'ch4', 'h2o', 'nh3', 'hcn', 'co2', 'ccl4', 'chcl3', 'bf3'] },
    { label: 'Polyatomic ions', ids: ['nh4', 'h3o'] },
    { label: 'Resonance', ids: ['o3', 'co3', 'no3', 'no2'] },
    { label: 'Expanded octets', ids: ['so2', 'pcl5', 'sf4', 'clf3', 'brf5', 'sf6', 'xef2', 'xef4'] },
    { label: 'Carbon chains', ids: ['c2h6', 'c2h2', 'c3h6', 'c3h4'] },
  ].map(function (g) { return { label: g.label, ids: g.ids.filter(function (id) { return Kit.get(id); }) }; });
  var ALL = [BLANK].concat(GROUPS.reduce(function (a, g) { return a.concat(g.ids); }, []));

  var $ = function (id) { return document.getElementById(id); };
  var pickEl = $('labPick'), nextBtn = $('labNext'), btn3d = $('lab3d'), bigBtn = $('labBig');
  var note3d = $('lab3dNote'), drawHost = $('labDraw'), panel = $('lab3dPanel'), view3d = $('lab3dView');
  var readout = $('lab3dReadout'), toggles3d = $('lab3dToggles'), close3d = $('lab3dClose'), live = $('labLive');

  var store = {};          // molecule id → engine state, so switching back keeps the work
  var engine = null, cur = null, tt = null, vt = null, open = false, lastOk = null, lastMatched = '';
  // The engine's switches sit in the controls row, remembered on this device: electron counters (on to start),
  // total e⁻ count, atom table and formal charge (off to start)
  var switchHost = $('labSwitches'), KEY = 'bonding-lab-';
  var shown = { counters: true, count: false, table: false, fc: false };
  try {
    Object.keys(shown).forEach(function (n) { var v = global.localStorage.getItem(KEY + n); if (v) shown[n] = v === 'on'; });
  } catch (e) { /* storage blocked: defaults */ }

  // --- Picker -------------------------------------------------------------------------------
  function optionText(id) { var m = Kit.get(id); return m.formula + ' · ' + m.name; }
  (function buildPicker() {
    var blank = document.createElement('option');
    blank.value = BLANK; blank.textContent = 'Blank canvas';
    pickEl.appendChild(blank);
    GROUPS.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.label;
      g.ids.forEach(function (id) {
        var o = document.createElement('option');
        o.value = id; o.textContent = optionText(id);
        og.appendChild(o);
      });
      pickEl.appendChild(og);
    });
  })();

  function paletteFor(id) {
    if (id === BLANK) return ORDER;
    var seen = {};
    Kit.structure(id).atoms.forEach(function (a) { seen[a.el] = true; });
    return ORDER.filter(function (e) { return seen[e]; });
  }

  function pick(id, quiet) {
    if (ALL.indexOf(id) === -1) id = BLANK;
    if (engine) { store[cur] = engine.state(); engine.destroy(); }
    cur = id;
    pickEl.value = id;
    var mol = id === BLANK ? null : Kit.get(id);
    engine = DrawEngine.create(drawHost, {
      palette: paletteFor(id),
      fcMode: 'compact',
      references: mol ? [id] : null,
      allowReveal: true,
      matchBox: true,
      counters: shown.counters, countersSwitch: true,
      count: shown.count, table: shown.table, fc: shown.fc,
      switchHost: switchHost,
      onToggle: function (name, on) {
        shown[name] = on;
        try { global.localStorage.setItem(KEY + name, on ? 'on' : 'off'); } catch (e) { /* not remembered */ }
      },
      prompt: mol ? 'Draw ' + mol.formula : '',
      onChange: onChange,
    });
    if (store[id]) engine.restore(store[id]); else onChange(engine.get(), engine.tally());
    show3d(false);
    if (!quiet && history.replaceState) history.replaceState(null, '', id === BLANK ? location.pathname : '?m=' + id);
  }
  pickEl.addEventListener('change', function () { pick(pickEl.value); });
  nextBtn.addEventListener('click', function () { pick(ALL[(ALL.indexOf(cur) + 1) % ALL.length]); });

  // --- Match + 3D readiness -----------------------------------------------------------------
  /** Pieces of the drawing (atoms joined by bonds). */
  function pieces(model) {
    var n = model.atoms.length, seen = new Array(n), out = [];
    for (var i = 0; i < n; i++) {
      if (seen[i]) continue;
      var stack = [i], members = [];
      seen[i] = true;
      while (stack.length) {
        var a = stack.pop();
        members.push(a);
        model.bonds.forEach(function (b) {
          var j = b.a === a ? b.b : b.b === a ? b.a : -1;
          if (j !== -1 && !seen[j]) { seen[j] = true; stack.push(j); }
        });
      }
      out.push(members);
    }
    return out;
  }
  /** Can this drawing go to 3D? { ok, why } */
  function readiness(model, tally) {
    if (!model.atoms.length) return { ok: false, why: '3D opens once every count is complete.' };
    var raw = engine.state();
    if ((raw.transfers || []).length || model.atoms.some(function (a) { return METALS[a.el]; })) {
      return { ok: false, why: '3D shows molecules. Ionic compounds form a lattice instead.' };
    }
    if (model.atoms.length < 2 || !tally.allCounted) return { ok: false, why: '3D opens once every count is complete.' };
    if (pieces(model).length > 1) return { ok: false, why: '3D shows one molecule at a time.' };
    return { ok: true, why: '' };
  }

  function onChange(model, tally) {
    if (!engine) return;
    var r = readiness(model, tally);
    lastOk = r.ok ? model : null;
    btn3d.disabled = !r.ok && !open;
    note3d.textContent = open ? '' : r.why;
    var matched = engine.matched().join(',');
    if (matched !== lastMatched) {
      live.textContent = matched ? 'Your drawing matches the accepted Lewis structure.' : '';
      lastMatched = matched;
    }
    if (open) update3d(false);
  }

  // --- 3D -----------------------------------------------------------------------------------
  function nameOf(model) {
    var id = engine.matched()[0] || DrawEngine.findReference(model);
    return id ? Kit.get(id).formula : 'Your molecule';
  }
  function ensureTurntable() {
    if (tt) return;
    tt = Turntable.create(view3d, {});
    if (!tt.content) return;   // no WebGL: the turntable shows its own note, and there is nothing to toggle
    vt = SL.viewToggles(tt);
    toggles3d.appendChild(vt.space);
    toggles3d.appendChild(vt.shape);
  }
  function update3d(lift) {
    if (!lastOk) {
      panel.classList.add('is-stale');
      readout.textContent = 'The drawing has changed. Finish every count again to update the shape.';
      return;
    }
    panel.classList.remove('is-stale');
    var src = { atoms: lastOk.atoms, bonds: lastOk.bonds, charge: lastOk.charge };
    var m;
    try { m = SL.showShape(tt, src, lift, null, !lift); }
    catch (e) { readout.textContent = 'This drawing has no VSEPR shape to show.'; return; }
    var r = m.atoms[m.root];
    var many = lastOk.atoms.filter(function (_, i) {
      return lastOk.bonds.filter(function (b) { return b.a === i || b.b === i; }).length > 1;
    }).length > 1;
    var multiple = lastOk.bonds.some(function (b) { return b.order > 1 && (b.a === m.root || b.b === m.root); });
    readout.textContent = (many ? 'Around ' + r.el + ' · ' : '') + SL.axeText(r) + ' · ' + nameOf(lastOk) + ': ' +
      SL.domainText(m) + ' → ' + r.shape + (r.bonded > 1 ? ', ' + SL.angleOf(m) + '°' : '') + '.' +
      (multiple ? ' A double or triple bond counts as one domain.' : '') +
      (r.lone ? ' Lone pairs (yellow lobes) take up room, so the bonds squeeze closer.' : '') + ' Drag the model to turn it.';
    if (vt) vt.sync();
  }
  function show3d(on) {
    open = !!on;
    panel.hidden = !open;
    document.body.classList.toggle('lab-3d-open', open);
    btn3d.setAttribute('aria-pressed', open ? 'true' : 'false');
    btn3d.textContent = open ? 'Hide 3D' : '3D';
    if (open) {
      ensureTurntable();
      if (engine) engine.render();      // the drawing narrows to make room
      update3d(true);
      // narrow screens (tablet portrait) stack the panel under the drawing: bring it into view
      if (global.matchMedia && global.matchMedia('(max-width: 900px)').matches && panel.scrollIntoView) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    if (engine) onChange(engine.get(), engine.tally());
  }
  btn3d.addEventListener('click', function () { show3d(!open); });
  close3d.addEventListener('click', function () { show3d(false); btn3d.focus(); });

  // --- Present (bigger drawing and buttons for the projector) -------------------------------
  bigBtn.addEventListener('click', function () {
    var on = !document.body.classList.contains('lab-big');
    document.body.classList.toggle('lab-big', on);
    bigBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (engine) engine.render();
  });

  var start = (location.search.match(/[?&]m=([^&]+)/) || [])[1];
  pick(start ? decodeURIComponent(start) : BLANK, true);   // opening the page leaves the address as it is

  global.DrawLab = {
    groups: GROUPS, all: ALL,
    pick: pick,
    engine: function () { return engine; },
    open3d: show3d,
    state: function () { return { cur: cur, open: open, ready: !!lastOk, note: note3d.textContent, readout: readout.textContent, hasTurntable: !!tt }; },
  };
})(window);
