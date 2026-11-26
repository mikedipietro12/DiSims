/**
 * Guide scene: draw / practice beats (Task 6, revised 2026-11-10).
 * Every molecule in a beat is built on ONE tray, under a blue prompt ("Draw CH₄ and H₂O").
 *
 * Beat attributes:
 *   data-set="ch4 h2o"     kit ids to build (all on the same tray); "Show answer" shows each
 *   data-prompt="…"        override the prompt
 *   data-fc="teach|compact|off"   formal-charge display (off until the formal-charge beat)
 *   data-counters="off"    no corner counts on the atoms (every draw beat after multiple-bond practice)
 *   data-table             open the atom table on arrival (formal charge beat: its prompt reads the table);
 *                          otherwise the table follows the student's last switch (closed to start)
 *   data-palette="Na Cl"   override the palette (default: the elements in the set)
 *   data-load              start with the reference structures already on the tray (side by side)
 *   data-letters           label molecules A, B… on the tray and in the tally (comparisons)
 *   data-reveal            open "Show answer" on arrival
 *   data-sets="a b | c d"  several comparisons: chips switch between them (each loads like data-load);
 *                          data-prompts="… | …" gives each its own prompt
 *   data-zoom="1.6"        let loaded structures grow up to this much past the normal size to fill the box
 *   data-no-tray           no atom tray (the structures are given; the tray row holds the chips instead)
 * The tray is kept per beat, so scrolling away and back keeps the work.
 */
(function (global) {
  'use strict';
  var Kit = global.BondingKit;
  var ORDER = ['H', 'Li', 'Na', 'K', 'Mg', 'Ca', 'B', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I', 'Xe'];
  var store = {};   // beatId → raw engine state
  var tableOn = false;   // the 'Atom table' switch, carried from beat to beat

  function paletteFor(beat, ids) {
    if (beat.dataset.palette) return beat.dataset.palette.split(/\s+/);
    var seen = {};
    ids.forEach(function (id) { Kit.structure(id).atoms.forEach(function (a) { seen[a.el] = true; }); });
    return ORDER.filter(function (e) { return seen[e]; });
  }
  function listJoin(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  GuideShell.registerScene('draw', function (mount, beat) {
    var ids = (beat.dataset.set || '').split(/\s+/).filter(Boolean);
    var formulas = ids.map(function (id) { return Kit.get(id).formula; });
    var prompt = beat.dataset.prompt || (ids.length ? ('load' in beat.dataset ? 'Compare ' : 'Draw ') + listJoin(formulas) : '');
    var sets = null, setNo = 0, chips = null;
    var host = document.createElement('div');
    host.className = 'scene-draw';
    mount.appendChild(host);

    var engine = DrawEngine.create(host, {
      palette: paletteFor(beat, ids),
      fcMode: beat.dataset.fc || 'off',
      counters: beat.dataset.counters !== 'off',
      table: 'table' in beat.dataset || tableOn,
      onTable: function (on) { tableOn = on; },
      references: ids.length ? ids : null,
      allowReveal: ids.length > 0,
      prompt: prompt,
      letters: 'letters' in beat.dataset,
      zoom: +beat.dataset.zoom || 1,
      onChange: function () { store[sets ? beat.id + '|' + setNo : beat.id] = engine.state(); },
    });

    sets = beat.dataset.sets ? beat.dataset.sets.split('|').map(function (x) { return x.trim().split(/\s+/); }) : null;
    var prompts = (beat.dataset.prompts || '').split('|').map(function (x) { return x.trim(); });
    var tray = engine.root.querySelector('.de-tray');
    if ('noTray' in beat.dataset) {
      tray.innerHTML = '';
      engine.root.querySelector('.de-tools').querySelectorAll('.de-tool').forEach(function (b) { if (b.textContent === 'Clear') b.hidden = true; });
    }
    if (sets) {
      chips = SceneKit.chips(sets.map(function (set, i) {
        var f = Kit.get(set[0]).formula, g = Kit.get(set[1] || set[0]).formula;
        return { id: String(i), label: f === g ? f : f + ' vs ' + g };
      }), function (i) { loadSet(+i); }, { label: 'Example' });
      if ('noTray' in beat.dataset) tray.appendChild(chips.el); else tray.parentNode.insertBefore(chips.el, tray.nextSibling);
    }
    function loadSet(i) {
      setNo = i;
      if (chips) chips.set(String(i));
      var set = sets[i];
      engine.setReference(set);
      engine.setPrompt(prompts[i] || prompts[0] || prompt);
      var saved = store[beat.id + '|' + i];
      if (saved) engine.restore(saved); else engine.loadMany(set.map(function (id) { return Kit.structure(id); }));
    }
    if (sets) loadSet(0);
    else if (store[beat.id]) engine.restore(store[beat.id]);
    else if ('load' in beat.dataset && ids.length) engine.loadMany(ids.map(function (id) { return Kit.structure(id); }));
    if ('reveal' in beat.dataset) engine.showReference(true);

    return { destroy: function () { engine.destroy(); }, engine: engine };
  });
})(window);
