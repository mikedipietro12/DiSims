/**
 * Chemical Bonding - draw engine (skeleton-first model, user 2026-11-10).
 *
 * How it is taught: place the atoms (least electronegative in the middle), connect them with
 * bonds, then add electrons until every atom is satisfied. The engine follows that order:
 *   - drag an element tile from the TRAY into the box to place an atom (clicking a tile does not)
 *   - drag an atom onto another atom → a bond (again → double, again → triple)
 *   - drag an atom onto empty space → it moves
 *   - click an atom → add one electron (singles go round the sides first, then pair)
 *   - drag an electron around its atom to pair it; onto another atom to move it there
 *     (from or to a metal: a solid curved "send" arrow); off into empty space to remove it
 *   - click a bond → one order less (triple → double → single → none)
 * A small number shows each atom's charge (valence − lone electrons − bonds) once the atom has a
 * bond or an electron; it is hidden when 0. Brackets + overall charge appear around a molecule
 * or ion once every atom in it is satisfied. The tally shows working, never a verdict.
 *
 *   var d = DrawEngine.create(mountEl, { palette, fcMode, references, prompt, letters, counters, onChange })
 *   counters: false hides the two corner counts on each atom (Guide beats after multiple-bond practice;
 *   the Draw Lab's 'Electron counters' switch calls d.setCounters(on))
 *   table: true opens the atom table under the count line (its 'Atom table' switch); onTable(on) hears the switch
 *   d.load(structure) · d.loadMany([...]) · d.get() · d.state() · d.restore(raw) · d.clear() · d.undo()
 *   DrawEngine.renderStatic(svgEl, structure, { fcMode })
 *
 * Needs BondingKit + LewisModel loaded first.
 */
(function (global) {
  'use strict';

  var Kit = global.BondingKit;
  var L = global.LewisModel;
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1d2433';
  var ACCENT = '#4152d9';
  var OCTET_RED = '#d6283b';   // the "to the octet" count
  var MATCH_GREEN = '#1f9d55';  // Draw Lab: the drawing matches the reference (same green as a correct shape choice)
  var MINUS = '−';

  var UNIT = 64; // px per bond length at scale 1
  var G = { font: 26, trim: 15, bondW: 2.6, gap: 6, eR: 23, dot: 2.9, dotSep: 4.5, letterHit: 19, eHit: 10, bondHit: 12, near: 0.8, removeAt: 1.15 };
  var METALS = { Li: 1, Na: 1, K: 1, Mg: 1, Ca: 1 };
  var DEFAULT_PALETTE = ['H', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'B', 'Xe'];
  var SLOTS = [0, 45, 90, 135, 180, 225, 270, 315];   // electron positions around an atom (y down)

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function deg(a) { return ((a * 180 / Math.PI) % 360 + 360) % 360; }
  function angDist(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function chargeLabel(c) {
    if (!c) return '';
    var n = Math.abs(c);
    return (n > 1 ? n : '') + (c > 0 ? '+' : MINUS);
  }

  // ---------------------------------------------------------------------------
  // State
  //   atom: { el, x, y, slots: [8 counts, 0–2] }   electrons the student has placed
  //   bond: { a, b, order }
  //   transfers: [{ from, to }]                   electrons sent metal → nonmetal (arrows)
  // ---------------------------------------------------------------------------
  function newAtom(sym, x, y) { return { el: sym, x: x, y: y, slots: [0, 0, 0, 0, 0, 0, 0, 0] }; }
  function ne(a) { return a.slots.reduce(function (n, c) { return n + c; }, 0); }
  function bondIndex(s, i, j) {
    for (var k = 0; k < s.bonds.length; k++) {
      var b = s.bonds[k];
      if ((b.a === i && b.b === j) || (b.a === j && b.b === i)) return k;
    }
    return -1;
  }
  function bondAngles(s, i) {
    var a = s.atoms[i], out = [];
    s.bonds.forEach(function (b) {
      var j = b.a === i ? b.b : b.b === i ? b.a : -1;
      if (j !== -1) out.push(deg(Math.atan2(s.atoms[j].y - a.y, s.atoms[j].x - a.x)));
    });
    return out;
  }
  function blocked(angles, slotAngle) { return angles.some(function (t) { return angDist(t, slotAngle) < 35; }); }
  function touched(s, i) {
    return ne(s.atoms[i]) > 0 || s.bonds.some(function (b) { return b.a === i || b.b === i; }) ||
      (s.transfers || []).some(function (t) { return t.from === i || t.to === i; });
  }

  /** Add one electron where a student would write it: open sides first, singles before pairs. */
  function addElectron(s, i) {
    var a = s.atoms[i], bonds = bondAngles(s, i);
    if (ne(a) >= 16) return false;
    var order = [6, 2, 0, 4, 7, 5, 1, 3];   // slot indices: top, bottom, right, left, then the diagonals
    function pick(test) { for (var k = 0; k < order.length; k++) if (test(order[k])) return order[k]; return -1; }
    var slot = pick(function (q) { return q % 2 === 0 && !blocked(bonds, SLOTS[q]) && a.slots[q] === 0; });
    if (slot === -1) slot = pick(function (q) { return q % 2 === 0 && !blocked(bonds, SLOTS[q]) && a.slots[q] === 1; });
    if (slot === -1) slot = pick(function (q) { return !blocked(bonds, SLOTS[q]) && a.slots[q] === 0; });
    if (slot === -1) slot = pick(function (q) { return !blocked(bonds, SLOTS[q]) && a.slots[q] === 1; });
    if (slot === -1) slot = pick(function (q) { return a.slots[q] < 2; });
    if (slot === -1) return false;
    a.slots[slot] += 1;
    return true;
  }
  /** Nearest slot to an angle that still has room. */
  function nearestOpenSlot(a, angle, prefer) {
    var best = -1, bd = 999;
    SLOTS.forEach(function (sa, q) {
      if (a.slots[q] >= 2) return;
      var d = angDist(sa, angle) - (prefer && a.slots[q] === 1 ? 20 : 0);   // pairing with a single is easy
      if (d < bd) { bd = d; best = q; }
    });
    return best;
  }

  /** Kit / model structure → engine state (lone pairs written round the open sides). */
  var CANDIDATES = [0, 90, 180, 270, 45, 135, 225, 315];
  function combos(arr, k) {
    var out = [];
    (function rec(start, pick) {
      if (pick.length === k) { out.push(pick.slice()); return; }
      for (var i = start; i < arr.length; i++) { pick.push(arr[i]); rec(i + 1, pick); pick.pop(); }
    })(0, []);
    return out;
  }
  /** n directions: the four sides when everything stays ≥ 60° apart, else the widest spacing. */
  function chooseDirs(bonds, n) {
    if (!n) return [];
    n = Math.min(n, 8);
    var best = null, bestScore = -Infinity;
    combos(CANDIDATES, n).forEach(function (set) {
      var all = bonds.concat(set), minSep = 360, sum = 0;
      for (var x = 0; x < all.length; x++) {
        for (var y = x + 1; y < all.length; y++) {
          var d = angDist(all[x], all[y]);
          if (d < minSep) minSep = d;
          if (x >= bonds.length || y >= bonds.length) sum += Math.min(d, 90);
        }
      }
      if (all.length < 2) minSep = 360;
      var cardinal = set.filter(function (a) { return a % 90 === 0; }).length;
      var score = minSep >= 60 ? 1e6 + cardinal * 1e4 + minSep * 10 + sum / 100 : minSep * 1000 + sum + cardinal * 5;
      if (score > bestScore) { bestScore = score; best = set; }
    });
    return best;
  }
  function fromModel(m) {
    var s = {
      atoms: m.atoms.map(function (a) { return newAtom(a.el, a.x, a.y); }),
      bonds: m.bonds.map(function (b) { return { a: b.a, b: b.b, order: b.order }; }),
      transfers: [],
    };
    m.atoms.forEach(function (a, i) {
      var n = a.ne != null ? a.ne : 2 * (a.lp || 0);
      var groups = [];
      for (var p = 0; p < Math.floor(n / 2); p++) groups.push(2);
      if (n % 2) groups.push(1);
      var dirs = chooseDirs(bondAngles(s, i), groups.length);
      groups.forEach(function (c, g) { s.atoms[i].slots[SLOTS.indexOf(dirs[g])] += c; });
    });
    return s;
  }

  /** Where to draw each atom's electrons: stored slots, nudged off any bond that now covers them. */
  function displayGroups(s, i) {
    var a = s.atoms[i], bonds = bondAngles(s, i);
    var shown = [0, 0, 0, 0, 0, 0, 0, 0], from = [[], [], [], [], [], [], [], []];
    var moveLater = [];
    a.slots.forEach(function (c, q) {
      if (!c) return;
      if (!blocked(bonds, SLOTS[q])) { shown[q] += c; from[q].push(q); } else moveLater.push(q);
    });
    moveLater.forEach(function (q) {
      var c = a.slots[q], best = -1, bd = 999;
      SLOTS.forEach(function (sa, r) {
        if (blocked(bonds, sa) || shown[r] + c > 2) return;
        var d = angDist(sa, SLOTS[q]) + shown[r] * 30;
        if (d < bd) { bd = d; best = r; }
      });
      if (best === -1) best = q;   // nowhere free: draw it where it is
      shown[best] += c; from[best].push(q);
    });
    var out = [];
    shown.forEach(function (c, r) { if (c) out.push({ angle: SLOTS[r], n: Math.min(c, 2), extra: Math.max(0, c - 2), slots: from[r] }); });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Molecules on the tray
  // ---------------------------------------------------------------------------
  function SUBD(n) { return String(n).split('').map(function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }).join(''); }
  /** Number repeated elements within each structure, left to right (then top to bottom): O₁, O₂. 0 = only one. */
  function atomNumbers(s) {
    var out = s.atoms.map(function () { return 0; });
    fragments(s).forEach(function (f) {
      var by = {};
      f.members.forEach(function (i) { (by[s.atoms[i].el] = by[s.atoms[i].el] || []).push(i); });
      Object.keys(by).forEach(function (e) {
        if (by[e].length < 2) return;
        by[e].sort(function (p, q) { return (s.atoms[p].x - s.atoms[q].x) || (s.atoms[p].y - s.atoms[q].y); })
          .forEach(function (i, n) { out[i] = n + 1; });
      });
    });
    return out;
  }
  function fragments(s) {
    var seen = {}, out = [];
    s.atoms.forEach(function (_, start) {
      if (seen[start]) return;
      var stack = [start], members = [];
      seen[start] = true;
      while (stack.length) {
        var i = stack.pop();
        members.push(i);
        s.bonds.forEach(function (b) {
          var j = b.a === i ? b.b : b.b === i ? b.a : -1;
          if (j !== -1 && !seen[j]) { seen[j] = true; stack.push(j); }
        });
      }
      var valence = 0, electrons = 0;
      members.forEach(function (i) { valence += Kit.ELEMENTS[s.atoms[i].el].valence; electrons += ne(s.atoms[i]); });
      s.bonds.forEach(function (b) { if (members.indexOf(b.a) !== -1) electrons += 2 * b.order; });
      out.push({ members: members, charge: valence - electrons });
    });
    return out;
  }
  function toModel(s) {
    return {
      atoms: s.atoms.map(function (a) { return { el: a.el, x: a.x, y: a.y, ne: ne(a) }; }),
      bonds: s.bonds.map(function (b) { return { a: b.a, b: b.b, order: b.order }; }),
      charge: fragments(s).reduce(function (n, f) { return n + f.charge; }, 0),
    };
  }
  function subModel(s, members) {
    var map = {};
    members.forEach(function (i, n) { map[i] = n; });
    var full = toModel(s);
    return {
      atoms: members.map(function (i) { return full.atoms[i]; }),
      bonds: full.bonds.filter(function (b) { return b.a in map; }).map(function (b) { return { a: map[b.a], b: map[b.b], order: b.order }; }),
      charge: 0,
    };
  }
  /** Single-atom ions made by a transfer: atom index → its charge (0 for everything else). */
  function ionCharges(s) {
    var out = s.atoms.map(function () { return 0; });
    if (!(s.transfers || []).length) return out;
    fragments(s).forEach(function (f) {
      if (f.members.length !== 1 || !f.charge) return;
      var i = f.members[0];
      if (s.transfers.some(function (t) { return t.from === i || t.to === i; })) out[i] = f.charge;
    });
    return out;
  }
  /** An atom is satisfied when its count is complete (or expanded), or it is a metal that has sent its electrons. */
  function satisfied(s, i, st) {
    if (st.status === 'ok' || st.status === 'expanded') return true;
    return METALS[s.atoms[i].el] && ne(s.atoms[i]) === 0 && touched(s, i) &&
      !s.bonds.some(function (b) { return b.a === i || b.b === i; });
  }

  // ---------------------------------------------------------------------------
  // Reference lookup + formulas
  // ---------------------------------------------------------------------------
  function atomKey(m) { return m.atoms.map(function (a) { return a.el; }).sort().join(','); }
  function findReference(model) {
    if (!model.atoms.length) return null;
    var key = atomKey(model);
    var hits = Kit.MOLECULES.filter(function (m) { return !/-alt$/.test(m.id) && atomKey(m.structure) === key; });
    return hits.length ? hits[0].id : null;
  }
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  var SUP = { 2: '²', 3: '³', 4: '⁴' };
  function subN(n) { return n > 1 ? String(n).split('').map(function (d) { return SUB[+d]; }).join('') : ''; }
  function fragmentFormula(model, charge) {
    model.charge = charge;
    if (findReference(model)) {   // same atoms can mean different molecules (HCN, HNC): match the skeleton
      var key = atomKey(model), hit = Kit.MOLECULES.filter(function (m) { return atomKey(m.structure) === key && L.sameSkeleton(model, m.structure); })[0];
      if (hit) return hit.formula;
    }
    var c = {};
    model.atoms.forEach(function (a) { c[a.el] = (c[a.el] || 0) + 1; });
    var keys = Object.keys(c).sort(function (a, b) {
      var r = function (x) { return c.C && x === 'C' ? 0 : c.C && x === 'H' ? 1 : 2; };
      return r(a) - r(b) || (a < b ? -1 : 1);
    });
    return keys.map(function (k) { return k + subN(c[k]); }).join('');
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function arcPaths(x1, y1, x2, y2, lift, k) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    var cx = mx + (dy / len) * lift, cy = my - (dx / len) * lift;
    if (cy > my) { cx = mx - (dy / len) * lift; cy = my + (dx / len) * lift; }   // always bow upward
    var tx = x2 - cx, ty = y2 - cy, tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    var hl = 11 * k, hw = 6 * k, bx = x2 - tx * hl, by = y2 - ty * hl;
    return {
      d: 'M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + bx + ',' + by,
      head: 'M' + x2 + ',' + y2 + ' L' + (bx - ty * hw) + ',' + (by + tx * hw) + ' L' + (bx + ty * hw) + ',' + (by - tx * hw) + ' Z',
      cx: cx, cy: cy,
    };
  }
  /** A bare number with a white halo, so it reads even where a bond line runs past. */
  function cornerCount(g, x, y, text, fill, kind, k) {
    var t = el('text', { class: 'de-count de-count-' + kind, x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Space Mono, monospace', 'font-weight': 700, 'font-size': 14 * k, fill: fill,
      stroke: '#ffffff', 'stroke-width': 3.5 * k, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, g);
    t.textContent = text;
  }
  /**
   * Electrons that came from this atom: its dots, plus one per shared pair (sharing takes one from each atom),
   * less any that arrived in a transfer, plus any it sent away.
   */
  function ownElectrons(s, i) {
    var n = ne(s.atoms[i]);
    s.bonds.forEach(function (b) { if (b.a === i || b.b === i) n += b.order; });
    (s.transfers || []).forEach(function (t) { if (t.to === i) n -= 1; if (t.from === i) n += 1; });
    return n;
  }
  function pill(g, x, y, text, k) {
    var w = (text.length * 7.4 + 10) * k;
    el('rect', { x: x - w / 2, y: y - 8 * k, width: w, height: 16 * k, rx: 8 * k, fill: '#ffffff', stroke: INK, 'stroke-width': 1.5 * k }, g);
    var t = el('text', { x: x, y: y + 0.5 * k, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Space Mono, monospace', 'font-weight': 700, 'font-size': 10.5 * k, fill: INK }, g);
    t.textContent = text;
  }

  /**
   * marks: { selected, source, target, hover, tally, showCharges, letters, ghostBond }
   * Returns electron dot positions (px) for hit testing: [{ atom, slot, x, y }]
   */
  function drawState(g, s, view, marks, interactive) {
    marks = marks || {};
    var k = view.k, U = UNIT * k;
    function X(a) { return view.ox + a.x * U; }
    function Y(a) { return view.oy + a.y * U; }
    var dots = [];
    var gb = el('g', {}, g), ge = el('g', {}, g), ga = el('g', {}, g), gm = el('g', {}, g);

    s.bonds.forEach(function (b, bi) {
      var A = s.atoms[b.a], B = s.atoms[b.b];
      var x1 = X(A), y1 = Y(A), x2 = X(B), y2 = Y(B);
      var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      var ux = dx / len, uy = dy / len, px = -uy, py = ux, trim = G.trim * k;
      var bg = el('g', {}, gb);
      for (var i = 0; i < b.order; i++) {
        var off = (i - (b.order - 1) / 2) * G.gap * k;
        el('line', { x1: x1 + ux * trim + px * off, y1: y1 + uy * trim + py * off, x2: x2 - ux * trim + px * off, y2: y2 - uy * trim + py * off,
          stroke: INK, 'stroke-width': G.bondW * k, 'stroke-linecap': 'round' }, bg);
      }
      if (interactive) {
        el('line', { x1: x1 + ux * trim, y1: y1 + uy * trim, x2: x2 - ux * trim, y2: y2 - uy * trim,
          stroke: 'transparent', 'stroke-width': G.bondHit * 2, 'stroke-linecap': 'round', class: 'de-hit-bond',
          'data-bond': bi, tabindex: 0, role: 'button',
          'aria-label': ['', 'Single', 'Double', 'Triple'][b.order] + ' bond between ' + A.el + ' and ' + B.el + '. Activate to remove one line.' }, bg);
      }
    });
    if (marks.ghostBond) {
      var GA = s.atoms[marks.ghostBond[0]], GB = s.atoms[marks.ghostBond[1]];
      el('line', { x1: X(GA), y1: Y(GA), x2: X(GB), y2: Y(GB), stroke: ACCENT, 'stroke-width': 2.5 * k, 'stroke-dasharray': 6 * k + ' ' + 5 * k, 'stroke-linecap': 'round' }, gb);
    }

    s.atoms.forEach(function (a, i) {
      displayGroups(s, i).forEach(function (grp) {
        var r = grp.angle * Math.PI / 180;
        var cx = X(a) + Math.cos(r) * G.eR * k, cy = Y(a) + Math.sin(r) * G.eR * k;
        var px = -Math.sin(r) * G.dotSep * k, py = Math.cos(r) * G.dotSep * k;
        var pts = grp.n === 2 ? [[cx + px, cy + py], [cx - px, cy - py]] : [[cx, cy]];
        pts.forEach(function (p, n) {
          el('circle', { cx: p[0], cy: p[1], r: G.dot * k, fill: INK }, ge);
          dots.push({ atom: i, slot: grp.slots[Math.min(n, grp.slots.length - 1)], x: p[0], y: p[1] });
        });
      });
    });

    var ionCharge = ionCharges(s);
    s.atoms.forEach(function (a, i) {
      var ag = el('g', {}, ga);
      if (ionCharge[i]) {   // an ion made by a transfer: red for +, yellow for −, as everywhere charge shows
        var pos = ionCharge[i] > 0, col = pos ? '#e8264f' : '#ffc21a';
        el('circle', { cx: X(a), cy: Y(a), r: 36 * k, fill: col, opacity: pos ? 0.13 : 0.22 }, ag);
        el('circle', { cx: X(a), cy: Y(a), r: 24 * k, fill: col, opacity: pos ? 0.2 : 0.34 }, ag);
      }
      var strong = marks.selected === i || marks.source === i || marks.target === i;
      if (strong || marks.hover === i) {
        el('circle', { cx: X(a), cy: Y(a), r: (G.trim + 3) * k,
          fill: strong ? 'rgba(65,82,217,0.12)' : 'rgba(65,82,217,0.06)',
          stroke: strong ? ACCENT : 'rgba(65,82,217,0.45)', 'stroke-width': 2 * k,
          'stroke-dasharray': marks.target === i ? 5 * k + ' ' + 3 * k : 'none' }, ag);
      } else if (!ionCharge[i]) {
        el('circle', { cx: X(a), cy: Y(a), r: (G.trim - 1) * k, fill: '#ffffff' }, ag);
      }
      var t = el('text', { x: X(a), y: Y(a), 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-family': 'Space Grotesk, Helvetica, sans-serif', 'font-weight': 700,
        'font-size': (a.el.length > 1 ? G.font * 0.86 : G.font) * k, fill: INK }, ag);
      t.textContent = a.el;
      if (marks.subs && marks.subs[i]) {   // O₁, O₂…: matches the tally rows
        // tucked under the letter's lower right: inside the bond trim, above the lower electron pair
        var sub = el('text', { x: X(a) + (a.el.length > 1 ? 15 : 11) * k, y: Y(a) + 14 * k, 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-family': 'Space Grotesk, Helvetica, sans-serif', 'font-weight': 700, 'font-size': 12 * k, fill: ACCENT }, ag);
        sub.textContent = String(marks.subs[i]);
      }
      if (interactive) {
        var st = marks.tally && marks.tally.atoms[i];
        el('circle', { cx: X(a), cy: Y(a), r: G.letterHit * k, fill: 'transparent', class: 'de-hit-atom', 'data-atom': i,
          tabindex: 0, role: 'button', 'aria-label': (st ? st.speech : a.el) + ' Activate to add an electron.' }, ag);
      }
    });

    // Sent electrons: solid curved arrows from metal to nonmetal
    var seenPairs = {};
    (marks.arrows ? s.transfers || [] : []).forEach(function (tr) {
      var A = s.atoms[tr.from], B = s.atoms[tr.to];
      if (!A || !B) return;
      var key = tr.from + '>' + tr.to;
      seenPairs[key] = (seenPairs[key] || 0) + 1;
      var dx = X(B) - X(A), dy = Y(B) - Y(A), len = Math.hypot(dx, dy) || 1, trim = 30 * k;
      var arc = arcPaths(X(A) + dx / len * trim, Y(A) + dy / len * trim, X(B) - dx / len * trim, Y(B) - dy / len * trim,
        (26 + 16 * (seenPairs[key] - 1)) * k + len * 0.12, k);
      el('path', { d: arc.d, fill: 'none', stroke: INK, 'stroke-width': 2 * k, 'stroke-linecap': 'round' }, gm);
      el('path', { d: arc.head, fill: INK }, gm);
    });

    // Charge numbers (hidden at 0, and on atoms nobody has touched yet); selected atom's count
    var frs = fragments(s);
    s.atoms.forEach(function (a, i) {
      var st = marks.tally && marks.tally.atoms[i];
      if (!st) return;
      var taken = bondAngles(s, i).concat(displayGroups(s, i).map(function (gr) { return gr.angle; }));
      function openDir(pref) {
        var pick = pref.reduce(function (best, c) {
          var sep = taken.length ? Math.min.apply(null, taken.map(function (t) { return angDist(c, t); })) : 180;
          return sep > best.sep + 1 ? { c: c, sep: sep } : best;
        }, { c: pref[0], sep: -1 }).c;
        taken.push(pick);
        return pick * Math.PI / 180;
      }
      // Two fixed corner counts (metals show none; nothing until the atom is touched):
      //   top right, red: electrons still needed for the octet (+n if it has too many)
      //   bottom right, ink: valence electrons still to place (+n if it has too many)
      var counting = marks.showCharges !== false && marks.counters !== false && !METALS[a.el] && touched(s, i);
      //   Both go once the octet is complete (formal-charge structures such as CO end off by one on purpose).
      var need = st.target - st.around, full = st.status === 'ok' || st.status === 'expanded';
      if (counting && !full && need !== 0) {
        cornerCount(gm, X(a) + 31 * k, Y(a) - 29 * k, need > 0 ? String(need) : '+' + (-need), OCTET_RED, 'octet', k);
      }
      var short = st.valence - ownElectrons(s, i);
      if (counting && !full && short !== 0) {
        cornerCount(gm, X(a) + 31 * k, Y(a) + 29 * k, short > 0 ? String(short) : '+' + (-short), INK, 'valence', k);
      }
      if (marks.counters !== false) taken.push(315, 45);   // the corners stay theirs
      if (marks.selected === i) {
        var tr = openDir([135, 45, 90, 225, 315, 180, 0, 270]);
        pill(gm, X(a) + Math.cos(tr) * 46 * k, Y(a) + Math.sin(tr) * 40 * k, st.around + ' / ' + st.target, k);
      }
    });

    if (marks.letters && frs.length > 1) {
      frs.slice().sort(function (p, q) { return s.atoms[p.members[0]].x - s.atoms[q.members[0]].x; }).forEach(function (f, n) {
        var xs = f.members.map(function (i) { return X(s.atoms[i]); }), ys = f.members.map(function (i) { return Y(s.atoms[i]); });
        var lt = el('text', { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y: Math.max.apply(null, ys) + 62 * k,
          'text-anchor': 'middle', 'font-family': 'Space Mono, monospace', 'font-weight': 700, 'font-size': 15 * k, fill: '#5b6474' }, gm);
        lt.textContent = 'ABCDEFGH'[n];
      });
    }

    // Brackets + overall charge, once every atom in the molecule or ion is satisfied
    frs.forEach(function (f) {
      if (!f.charge || !marks.tally) return;
      if (!f.members.every(function (i) { return satisfied(s, i, marks.tally.atoms[i]); })) return;
      var xs = f.members.map(function (i) { return X(s.atoms[i]); }), ys = f.members.map(function (i) { return Y(s.atoms[i]); });
      var pad = (f.members.length > 1 ? 50 : 38) * k;
      var x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad;
      var y0 = Math.min.apply(null, ys) - pad, y1 = Math.max.apply(null, ys) + pad;
      var bp = { fill: 'none', stroke: INK, 'stroke-width': 2.4 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      var lip = 9 * k;
      el('path', Object.assign({ d: 'M' + (x0 + lip) + ',' + y0 + ' H' + x0 + ' V' + y1 + ' H' + (x0 + lip) }, bp), gm);
      el('path', Object.assign({ d: 'M' + (x1 - lip) + ',' + y0 + ' H' + x1 + ' V' + y1 + ' H' + (x1 - lip) }, bp), gm);
      var ionic = f.members.length === 1 && ionCharge[f.members[0]];
      var ct = el('text', { x: x1 + 6 * k, y: y0 + 4 * k, 'font-family': 'Space Mono, monospace', 'font-weight': 700, 'font-size': 18 * k,
        fill: ionic ? (f.charge > 0 ? '#e8264f' : '#b98a00') : INK }, gm);
      ct.textContent = chargeLabel(f.charge);
    });
    return dots;
  }

  function bbox(atoms) {
    if (!atoms.length) return { x0: 0, y0: 0, x1: 0, y1: 0, cx: 0, cy: 0 };
    var xs = atoms.map(function (a) { return a.x; }), ys = atoms.map(function (a) { return a.y; });
    var b = { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
    b.cx = (b.x0 + b.x1) / 2; b.cy = (b.y0 + b.y1) / 2;
    return b;
  }

  /** Read-only drawing of a kit / model structure (or raw engine state) into an <svg>. */
  function renderStatic(svg, structure, opts) {
    opts = opts || {};
    var w = opts.width || 240, hgt = opts.height || 160;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var s = structure.atoms.length && structure.atoms[0].slots ? clone(structure) : fromModel(structure);
    var b = bbox(s.atoms);
    var charged = fragments(s).some(function (f) { return f.charge; });
    var pad = charged ? 2.8 : 1.6;
    var span = Math.max(b.x1 - b.x0 + pad, (b.y1 - b.y0 + pad) * w / hgt);
    var k = opts.scale || Math.min(opts.maxScale || 1, w / (span * UNIT));
    var view = { ox: w / 2 - b.cx * UNIT * k, oy: hgt / 2 - b.cy * UNIT * k, k: k };
    drawState(el('g', {}, svg), s, view, { tally: L.tally(toModel(s)), showCharges: opts.fcMode !== 'off', counters: opts.counters }, false);
    svg.__lewis = { view: view, s: s, unit: UNIT };   // lets scenes pin labels to atoms
    return svg;
  }

  // ---------------------------------------------------------------------------
  // JPEG export (paints the SVG we draw straight onto a canvas, with live fonts)
  // ---------------------------------------------------------------------------
  function paintSvg(ctx, node, dx, dy) {
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      var A = function (k, d) { var v = n.getAttribute(k); return v == null ? d : v; };
      var fill = A('fill', tag === 'line' || tag === 'path' ? 'none' : '#000');
      var stroke = A('stroke', 'none');
      if (fill === 'transparent') fill = 'none';
      if (stroke === 'transparent') stroke = 'none';
      ctx.save();
      ctx.lineWidth = +A('stroke-width', 1);
      ctx.lineCap = A('stroke-linecap', 'butt');
      ctx.lineJoin = A('stroke-linejoin', 'miter');
      var dash = A('stroke-dasharray', 'none');
      ctx.setLineDash(dash === 'none' ? [] : dash.split(/[ ,]+/).map(Number));
      function finish() {
        if (fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke !== 'none') { ctx.strokeStyle = stroke; ctx.stroke(); }
      }
      if (tag === 'g') paintSvg(ctx, n, dx, dy);
      else if (tag === 'line') { ctx.beginPath(); ctx.moveTo(+A('x1') + dx, +A('y1') + dy); ctx.lineTo(+A('x2') + dx, +A('y2') + dy); finish(); }
      else if (tag === 'circle') { ctx.beginPath(); ctx.arc(+A('cx') + dx, +A('cy') + dy, +A('r'), 0, Math.PI * 2); finish(); }
      else if (tag === 'rect') {
        var x = +A('x') + dx, y = +A('y') + dy, w = +A('width'), hh = +A('height'), r = +A('rx', 0);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, hh, r); else ctx.rect(x, y, w, hh);
        finish();
      } else if (tag === 'path') {
        var d = A('d', ''), cx = 0, cy = 0;
        ctx.beginPath();
        (d.match(/[MLHVQZ][^MLHVQZ]*/g) || []).forEach(function (seg) {
          var c = seg[0], v = seg.slice(1).trim().split(/[ ,]+/).map(Number);
          if (c === 'M') { cx = v[0]; cy = v[1]; ctx.moveTo(cx + dx, cy + dy); }
          else if (c === 'L') { cx = v[0]; cy = v[1]; ctx.lineTo(cx + dx, cy + dy); }
          else if (c === 'H') { cx = v[0]; ctx.lineTo(cx + dx, cy + dy); }
          else if (c === 'V') { cy = v[0]; ctx.lineTo(cx + dx, cy + dy); }
          else if (c === 'Q') { ctx.quadraticCurveTo(v[0] + dx, v[1] + dy, v[2] + dx, v[3] + dy); cx = v[2]; cy = v[3]; }
          else if (c === 'Z') ctx.closePath();
        });
        finish();
      } else if (tag === 'text') {
        var fam = A('font-family', 'sans-serif');
        ctx.font = A('font-weight', '400') + ' ' + A('font-size', '16') + 'px ' + fam.split(',').map(function (f) { f = f.trim(); return /\s/.test(f) ? '"' + f + '"' : f; }).join(', ');
        ctx.fillStyle = fill === 'none' ? '#000' : fill;
        var anchor = A('text-anchor', 'start');
        ctx.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left';
        ctx.textBaseline = A('dominant-baseline', '') === 'central' ? 'middle' : 'alphabetic';
        ctx.fillText(n.textContent, +A('x') + dx, +A('y') + dy);
      }
      ctx.restore();
    });
  }
  function exportJPEG(structure, opts) {
    opts = opts || {};
    var W = 1600, H = 1100, HEAD = 150;
    var svg = document.createElementNS(NS, 'svg');
    renderStatic(svg, structure, { width: W, height: H - HEAD, maxScale: 3.4, fcMode: opts.fcMode || 'compact', counters: opts.counters });
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var fontsReady = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('700 48px "Space Grotesk"'), document.fonts.load('700 24px "Space Mono"')]).catch(function () {})
      : Promise.resolve();
    var model = structure.atoms.length && structure.atoms[0].slots ? toModel(structure) : structure;
    return fontsReady.then(function () {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.font = '700 52px "Space Grotesk", Helvetica, sans-serif';
      ctx.fillText(opts.title || 'My Lewis structure', 64, 96);
      ctx.font = '700 22px "Space Mono", monospace';
      ctx.fillStyle = '#5b6474';
      ctx.fillText((opts.subtitle ? opts.subtitle + '  ·  ' : '') + L.tally(model).availableText + '  ·  ' + new Date().toISOString().slice(0, 10), 64, 132);
      ctx.strokeStyle = 'rgba(29,36,51,0.15)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(64, HEAD); ctx.lineTo(W - 64, HEAD); ctx.stroke();
      paintSvg(ctx, svg, 0, HEAD);
      return new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/jpeg', 0.92); });
    });
  }
  function deliverFile(blob, filename) {
    var file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'image/jpeg' }) : null;
    if (navigator.maxTouchPoints > 1 && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: filename }).catch(function () {});
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return Promise.resolve();
  }

  // ---------------------------------------------------------------------------
  // Live engine
  // ---------------------------------------------------------------------------
  var ARROW_MS = 1100;   // a sent electron's arrow shows during the flight, then fades from the tray
  var HINT = 'Click an atom to add an electron. Drag an electron onto another atom\u2019s electron to share them. Drag an atom to move it. Click a bond to break one pair.';

  var tableSeq = 0;
  function create(mount, opts) {
    opts = opts || {};
    var palette = opts.palette || DEFAULT_PALETTE;
    var state = {
      s: { atoms: [], bonds: [], transfers: [] },
      erase: false,
      selected: null, source: null, hover: null,
      fcMode: opts.fcMode || 'compact',
      counters: opts.counters !== false,
      table: !!opts.table,
      references: opts.references || (opts.reference ? [opts.reference] : null),
      reveal: false,
      history: [],
      message: '',
    };
    var drag = null, dots = [], view = { ox: 0, oy: 0, k: 1 }, focusKey = null;

    // --- DOM ----------------------------------------------------------------------------
    var root = h('div', 'de');
    var bar = h('div', 'de-bar');
    var tray = h('div', 'de-row de-palette de-tray');
    tray.setAttribute('role', 'group');
    tray.setAttribute('aria-label', 'Atom tray: drag an atom into the box');
    palette.forEach(function (sym) {
      var b = h('button', 'btn de-el', sym);
      b.type = 'button';
      b.setAttribute('aria-label', Kit.ELEMENTS[sym].name + ': drag into the box, or press Enter to place');
      b.addEventListener('pointerdown', function (e) { startTileDrag(e, sym, b); });
      // Keyboard (Enter / Space gives detail 0): place at a free spot. Mouse clicks do nothing.
      b.addEventListener('click', function (e) { if (e.detail === 0) placeAt(sym, freeSpot(state.s, 0, 0)); else { say('Drag the atom into the box.'); render(); } });
      tray.appendChild(b);
    });
    var toolRow = h('div', 'de-row de-tools');
    toolRow.setAttribute('role', 'group');
    toolRow.setAttribute('aria-label', 'Tools');
    var eraseBtn = h('button', 'btn de-tool', 'Erase');
    eraseBtn.type = 'button';
    eraseBtn.title = 'Click an atom, bond or electron to remove it.';
    eraseBtn.addEventListener('click', function () { state.erase = !state.erase; state.source = null; render(); });
    var undoBtn = h('button', 'btn de-tool', 'Undo');
    undoBtn.type = 'button';
    undoBtn.addEventListener('click', function () { undo(); });
    var clearBtn = h('button', 'btn de-tool', 'Clear');
    clearBtn.type = 'button';
    clearBtn.addEventListener('click', function () {
      if (!state.s.atoms.length) return;
      refit(); snapshot(); state.s = { atoms: [], bonds: [], transfers: [] }; state.selected = state.source = state.hover = null; changed();
    });
    var revealBtn = h('button', 'btn de-tool', 'Show answer');
    revealBtn.type = 'button';
    revealBtn.setAttribute('aria-expanded', 'false');
    revealBtn.addEventListener('click', function () { state.reveal = !state.reveal; render(); });
    var saveBtn = h('button', 'btn de-tool', 'Save JPEG');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', function () { save(); });
    [eraseBtn, undoBtn, clearBtn, h('span', 'de-spacer')].forEach(function (n) { toolRow.appendChild(n); });
    if (opts.allowReveal !== false) toolRow.appendChild(revealBtn);
    if (opts.allowExport !== false) toolRow.appendChild(saveBtn);
    bar.appendChild(tray);
    bar.appendChild(toolRow);

    var work = h('div', 'de-work');
    var stageWrap = h('div', 'de-stage');
    var revealEl = h('aside', 'de-reveal');
    revealEl.setAttribute('aria-label', 'One way to draw it');
    revealEl.hidden = true;
    var svg = el('svg', { class: 'de-svg', role: 'group', 'aria-label': 'Drawing area' });
    var layer = el('g', {}, svg);
    var rubber = el('line', { stroke: ACCENT, 'stroke-width': 2.5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', visibility: 'hidden' }, svg);
    var carried = el('circle', { r: G.dot + 1, fill: ACCENT, visibility: 'hidden' }, svg);
    var flight = el('g', { visibility: 'hidden' }, svg);
    var flightPath = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, flight);
    var flightHead = el('path', { fill: INK }, flight);
    stageWrap.appendChild(svg);
    var headEl = h('div', 'de-head');
    stageWrap.appendChild(headEl);
    var promptEl = h('p', 'de-prompt', opts.prompt || '');
    if (!opts.prompt) promptEl.hidden = true;
    headEl.appendChild(promptEl);
    // the formal-charge equation, in the same words as the tally rows (teach mode only)
    var eqEl = h('p', 'de-fc-eq');
    eqEl.innerHTML = '<span class="de-fc-eq-main">FC = valence − lone − ½(bonds)</span>' +
      '<span class="de-fc-eq-key">lone = electrons in lone pairs · bonds = electrons in bonds</span>';
    headEl.appendChild(eqEl);
    var hintEl = h('p', 'de-hint');
    stageWrap.appendChild(hintEl);
    var msgEl = h('p', 'de-msg' + (opts.prompt ? ' has-prompt' : ''));
    msgEl.setAttribute('role', 'status');
    headEl.appendChild(msgEl);
    work.appendChild(stageWrap);
    work.appendChild(revealEl);

    // Under the drawing: the count line (always), and the atom table behind its switch (user 2026-11-25)
    var tallyEl = h('div', 'de-tally');
    var tallyBar = h('div', 'de-tally-bar');
    var tallySum = h('p', 'de-tally-sum');
    tallySum.setAttribute('aria-live', 'polite');
    var tableBtn = h('button', 'learn-toggle de-table-toggle');
    tableBtn.type = 'button';
    tableBtn.innerHTML = '<span class="learn-switch" aria-hidden="true"></span>Atom table';
    var tallyList = h('div', 'de-tally-list');
    tallyList.id = 'de-table-' + (++tableSeq);
    tableBtn.setAttribute('aria-controls', tallyList.id);
    tableBtn.addEventListener('click', function () {
      state.table = !state.table;
      tallyList.hidden = !state.table;   // before the refit, so the drawing fits the room that is left
      refit(); render();
      if (opts.onTable) opts.onTable(state.table);
    });
    tallyBar.appendChild(tallySum);
    tallyBar.appendChild(tableBtn);
    tallyEl.appendChild(tallyBar);
    tallyEl.appendChild(tallyList);

    root.appendChild(bar);
    root.appendChild(work);
    root.appendChild(tallyEl);
    mount.appendChild(root);

    // --- State helpers ------------------------------------------------------------------
    function snapshot() { state.history.push(clone(state.s)); if (state.history.length > 100) state.history.shift(); }
    function undo() {
      if (!state.history.length) return;
      state.s = state.history.pop();
      state.selected = state.source = state.hover = null;
      changed();
    }
    function say(m) { state.message = m || ''; }
    function changed() {
      render();
      if (opts.onChange) { var m = toModel(state.s); opts.onChange(m, L.tally(m)); }
    }
    function occupied(s, x, y) { return s.atoms.some(function (b) { return Math.hypot(b.x - x, b.y - y) < 1; }); }
    function freeSpot(s, x, y) {
      if (!occupied(s, x, y)) return { x: x, y: y };
      for (var r = 1; r < 10; r++) {
        for (var q = 0; q < 8 * r; q++) {
          var t = (q / (8 * r)) * Math.PI * 2;
          var px = Math.round((x + Math.cos(t) * r * 1.4) * 2) / 2, py = Math.round((y + Math.sin(t) * r * 1.4) * 2) / 2;
          if (!occupied(s, px, py)) return { x: px, y: py };
        }
      }
      return { x: x, y: y };
    }
    function placeAt(sym, u) {
      snapshot();
      state.s.atoms.push(newAtom(sym, Math.round(u.x * 4) / 4, Math.round(u.y * 4) / 4));
      say('');
      changed();
    }
    function degree(i) { return state.s.bonds.filter(function (b) { return b.a === i || b.b === i; }).length; }
    /** A newly bonded loose atom slides to bond length beside its partner, keeping its direction. */
    function tidyLoose(i, j) {
      var s = state.s, mover = degree(j) === 1 && degree(i) > 1 ? j : degree(i) === 1 && degree(j) > 1 ? i : degree(j) === 1 ? j : -1;
      if (mover === -1) return;
      var anchor = mover === j ? i : j, A = s.atoms[anchor], M = s.atoms[mover];
      var dx = M.x - A.x, dy = M.y - A.y, d = Math.hypot(dx, dy) || 1;
      var nx = A.x + dx / d, ny = A.y + dy / d;
      if (s.atoms.some(function (o, q) { return q !== mover && q !== anchor && Math.hypot(o.x - nx, o.y - ny) < 0.6; })) return;
      M.x = Math.round(nx * 100) / 100; M.y = Math.round(ny * 100) / 100;
    }
    /** Share: one electron from each atom becomes a bond (order +1). */
    function shareElectrons(i, qi, j, qj) {
      var s = state.s, A = s.atoms[i], B = s.atoms[j];
      if (METALS[A.el] || METALS[B.el]) { moveElectron(i, qi, j, 0); return; }
      if (locked(i) || locked(j)) { lockedSay(locked(i) ? i : j); return; }
      var k = bondIndex(s, i, j);
      if (k !== -1 && s.bonds[k].order >= 3) { say('Those two atoms already share a triple bond.'); render(); return; }
      if (!A.slots[qi] || !B.slots[qj]) return;
      snapshot();
      A.slots[qi] -= 1;
      B.slots[qj] -= 1;
      if (k === -1) s.bonds.push({ a: i, b: j, order: 1 }); else s.bonds[k].order += 1;
      if (k === -1) tidyLoose(i, j);
      say('');
      changed();
    }
    /** Click a bond: one shared pair breaks and each atom gets one electron back (Erase removes the whole bond). */
    function lowerBond(bi) {
      var s = state.s, b = s.bonds[bi];
      snapshot();
      var n = state.erase ? b.order : 1;
      for (var x = 0; x < n; x++) { addElectron(s, b.a); addElectron(s, b.b); }
      if (b.order - n <= 0) s.bonds.splice(bi, 1); else b.order -= n;
      say('');
      changed();
    }
    function removeAtomAt(i) {
      var s = state.s;
      snapshot();
      s.bonds = s.bonds.filter(function (b) { return b.a !== i && b.b !== i; })
        .map(function (b) { return { a: b.a > i ? b.a - 1 : b.a, b: b.b > i ? b.b - 1 : b.b, order: b.order }; });
      s.transfers = (s.transfers || []).filter(function (t) { return t.from !== i && t.to !== i; })
        .map(function (t) { return { from: t.from > i ? t.from - 1 : t.from, to: t.to > i ? t.to - 1 : t.to }; });
      s.atoms.splice(i, 1);
      state.selected = state.source = state.hover = null;
      say('');
      changed();
    }
    function locked(i) { return (state.s.transfers || []).some(function (t) { return t.to === i; }); }
    function lockedSay(i) { say('The electrons on ' + state.s.atoms[i].el + ' are set: they arrived in a transfer.'); render(); }
    function clickAtom(i) {
      if (state.erase) { removeAtomAt(i); return; }
      if (locked(i)) { lockedSay(i); return; }
      snapshot();
      if (!addElectron(state.s, i)) { state.history.pop(); say(state.s.atoms[i].el + ' has no room for another electron.'); render(); return; }
      say('');
      changed();
    }
    /** Move one electron from atom i (slot q) to atom j near an angle. */
    function moveElectron(i, q, j, angle) {
      var s = state.s, A = s.atoms[i], B = s.atoms[j];
      if (!A.slots[q]) return;
      var target = nearestOpenSlot(B, angle, true);
      if (target === -1) { say(B.el + ' has no room for another electron.'); render(); return; }
      if (i === j && target === q) return;
      snapshot();
      A.slots[q] -= 1;
      B.slots[target] += 1;
      var sent = i !== j && (METALS[A.el] || METALS[B.el]);
      if (sent) {
        s.transfers = s.transfers || []; s.transfers.push({ from: i, to: j });
        respread(s, i); respread(s, j);
        setTimeout(function () { snapIons(i, j); }, 480);   // once the electron lands
        state.arrowUntil = Date.now() + ARROW_MS;
        clearTimeout(state.arrowTimer);
        state.arrowTimer = setTimeout(render, ARROW_MS + 20);
      }
      say('');
      changed();
      if (sent) flyElectron(i, j);
    }
    /**
     * Opposite charges attract: the cation slides in beside the anion (the anion moves instead if the
     * cation already has a partner), with a little overshoot. Then other ions are nudged clear.
     */
    var CONTACT = 1.8;
    function snapIons(i, j) {
      var s = state.s, A = s.atoms[i], B = s.atoms[j];
      if (!A || !B || drag) return;
      var others = (s.transfers || []).filter(function (t) { return t.from === i && t.to !== j; }).map(function (t) { return t.to; })
        .filter(function (q, n, arr) { return arr.indexOf(q) === n && s.atoms[q]; });
      var mover, goal;
      if (!others.length) {
        var side = A.x <= B.x ? -1 : 1;
        mover = i; goal = { x: B.x + side * CONTACT, y: B.y };
      } else {
        // a second partner takes the free side of the cation (then above, then below)
        var taken = others.map(function (q) { return Math.atan2(s.atoms[q].y - A.y, s.atoms[q].x - A.x); });
        var best = [0, Math.PI, -Math.PI / 2, Math.PI / 2].map(function (t) {
          return { t: t, sep: Math.min.apply(null, taken.map(function (u) { var d = Math.abs(t - u) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; })) };
        }).sort(function (p, q) { return q.sep - p.sep; })[0].t;
        mover = j; goal = { x: A.x + Math.cos(best) * CONTACT, y: A.y + Math.sin(best) * CONTACT };
      }
      var M = s.atoms[mover], x0 = M.x, y0 = M.y;
      if (Math.hypot(goal.x - x0, goal.y - y0) < 0.02) return;
      var t0 = performance.now(), DUR = 520, done = false;
      setTimeout(function () { if (!done) step(t0 + DUR); }, DUR + 80);   // finishes even when frames are throttled
      function step(now) {
        if (done || !state.s.atoms[mover] || state.s.atoms[mover] !== M || drag) return;
        var t = Math.min(1, (now - t0) / DUR);
        var c1 = 1.9, c3 = c1 + 1, e = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);   // ease out with a small overshoot: a snap
        M.x = x0 + (goal.x - x0) * e; M.y = y0 + (goal.y - y0) * e;
        if (t < 1) { render(); requestAnimationFrame(step); return; }
        done = true;
        M.x = Math.round(goal.x * 100) / 100; M.y = Math.round(goal.y * 100) / 100;
        relaxIons(s);
        changed();
      }
      step(t0);
    }
    /** An ion's electrons settle evenly: singles on the four sides first, then pairs. */
    function respread(s, i) {
      var a = s.atoms[i], n = ne(a);
      a.slots = [0, 0, 0, 0, 0, 0, 0, 0];
      for (var x = 0; x < n; x++) addElectron(s, i);
    }
    function removeElectron(i, q) {
      if (locked(i)) { lockedSay(i); return; }
      var a = state.s.atoms[i];
      if (!a.slots[q]) return;
      snapshot();
      a.slots[q] -= 1;
      say('');
      changed();
    }
    /** Ions push apart so brackets and arrows have room (bonded molecules stay put). */
    function relaxIons(s) {
      var MIN = 2.6;
      var bonded = s.atoms.map(function (_, q) { return s.bonds.some(function (b) { return b.a === q || b.b === q; }); });
      for (var it = 0; it < 60; it++) {
        var moved = false;
        for (var i = 0; i < s.atoms.length; i++) {
          for (var j = i + 1; j < s.atoms.length; j++) {
            if (bonded[i] && bonded[j]) continue;
            if ((s.transfers || []).some(function (t) { return (t.from === i && t.to === j) || (t.from === j && t.to === i); })) continue;
            var A = s.atoms[i], B = s.atoms[j];
            var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
            if (d >= MIN) continue;
            if (d < 1e-6) { dx = 1; dy = 0; d = 1e-6; }
            var push = (MIN - d) / 2 + 0.01, ux = dx / (d || 1), uy = dy / (d || 1);
            if (!bonded[i] && !bonded[j]) { A.x -= ux * push; A.y -= uy * push; B.x += ux * push; B.y += uy * push; }
            else if (!bonded[i]) { A.x -= ux * push * 2; A.y -= uy * push * 2; }
            else { B.x += ux * push * 2; B.y += uy * push * 2; }
            moved = true;
          }
        }
        if (!moved) break;
      }
    }
    var flyToken = 0;
    function flyElectron(from, to) {
      var A = state.s.atoms[from], B = state.s.atoms[to];
      if (!A || !B) return;
      var U = UNIT * view.k, x1 = view.ox + A.x * U, y1 = view.oy + A.y * U, x2 = view.ox + B.x * U, y2 = view.oy + B.y * U;
      var arc = arcPaths(x1, y1, x2, y2, 26 * view.k + Math.hypot(x2 - x1, y2 - y1) * 0.12, view.k);
      var dot = el('circle', { r: (G.dot + 1.2) * view.k, fill: ACCENT }, svg);
      var token = ++flyToken, t0 = performance.now(), DUR = 520;
      setTimeout(function () { if (dot.parentNode) dot.remove(); }, DUR + 120);   // never left behind if frames are throttled
      (function step(now) {
        var t = Math.min(1, (now - t0) / DUR);
        if (token !== flyToken) t = 1;
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, u = 1 - e;
        dot.setAttribute('cx', u * u * x1 + 2 * u * e * arc.cx + e * e * x2);
        dot.setAttribute('cy', u * u * y1 + 2 * u * e * arc.cy + e * e * y2);
        if (t < 1) requestAnimationFrame(step); else dot.remove();
      })(t0);
    }

    // --- Layout -----------------------------------------------------------------------------
    // The zoom and centre are set when a structure is loaded, the tray is cleared or the window
    // resizes; drawing never rescales or shifts the view (the tally growing only trims the bottom).
    var fit = { k: null, W: 0, H: 0, base: 0, pending: true };
    function measure() {
      var r = svg.getBoundingClientRect();
      var w = r.width || 600, hh = r.height || 360;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hh);
      var base = parseFloat(getComputedStyle(root).getPropertyValue('--de-scale')) || 1;
      var need = fit.pending || fit.k == null || Math.abs(w - fit.W) > 1 || hh > fit.H + 40 || base !== fit.base;   // a box that grows a lot (layout settling, Present) re-centres
      if (need && r.height > 0 && !(drag && drag.moved)) {
        var k = base, oy = hh / 2;
        // A loaded structure fits the free space between the header (prompt, equation) and the hint,
        // centred there; it zooms out to fit, and in only as far as opts.zoom allows
        if (state.s.atoms.length) {
          var mx = 0, y0 = 1e9, y1 = -1e9;
          state.s.atoms.forEach(function (a) { mx = Math.max(mx, Math.abs(a.x)); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
          var top = 12, bot = hh - 12;
          if (headEl.offsetHeight) top = Math.max(top, headEl.getBoundingClientRect().bottom - r.top + 10);
          if (hintEl.offsetHeight) bot = Math.min(bot, hintEl.getBoundingClientRect().top - r.top - 8);
          var ion = fragments(state.s).some(function (f) { return f.charge; });
          var padT = ion ? 48 : 30, padB = opts.letters ? 70 : ion ? 40 : 30;   // electrons (or ion brackets) above; electrons, brackets or the A / B letters below
          k = Math.max(base * 0.5, Math.min(base * (opts.zoom || 1), (w / 2 - 12) / ((mx + 1.4) * UNIT),
            (bot - top) / ((y1 - y0) * UNIT + padT + padB)));
          oy = (top + bot) / 2 - ((y0 * UNIT - padT) + (y1 * UNIT + padB)) / 2 * k;
        }
        fit = { k: k, W: w, H: hh, base: base, oy: oy, pending: false };
      }
      view = { ox: w / 2, oy: fit.oy != null ? fit.oy : hh / 2, k: fit.k || base };
    }
    function refit() { fit.pending = true; }
    function local(e) { var r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function toUnits(p) { return { x: (p.x - view.ox) / (UNIT * view.k), y: (p.y - view.oy) / (UNIT * view.k) }; }
    function recentre() {
      var b = bbox(state.s.atoms);
      state.s.atoms.forEach(function (a) { a.x -= b.cx; a.y -= b.cy; });
    }

    // --- Render ---------------------------------------------------------------------------------
    function render() {
      measure();
      var model = toModel(state.s), t = L.tally(model);
      while (layer.firstChild) layer.removeChild(layer.firstChild);
      var subs = state.fcMode === 'teach' ? atomNumbers(state.s) : null;
      eqEl.hidden = state.fcMode !== 'teach';
      dots = drawState(layer, state.s, view, {
        selected: state.selected, source: state.source, hover: state.hover, tally: t, subs: subs,
        target: drag && drag.target ? drag.target.atom : null,
        showCharges: true, counters: state.counters, letters: !!opts.letters, arrows: Date.now() < (state.arrowUntil || 0),
      }, true);
      drawMatch();
      eraseBtn.setAttribute('aria-pressed', state.erase ? 'true' : 'false');
      root.classList.toggle('is-erasing', state.erase);
      undoBtn.disabled = !state.history.length;
      hintEl.textContent = !state.s.atoms.length ? 'Drag an atom from the tray into the box.'
        : state.erase ? 'Erase: click an atom, a bond or an electron to remove it.'
        : state.source != null ? 'Now press B on another atom to share an electron. Esc cancels.'
        : HINT;
      msgEl.textContent = state.message;
      renderTally(t, model, subs);
      renderReveal();
      if (focusKey) { var f = svg.querySelector(focusKey); if (f && document.activeElement !== f) f.focus(); }
    }

    /**
     * opts.matchBox (Draw Lab): a molecule or ion on the tray that matches the reference (any resonance form)
     * gets a green box round it; with no reference set, the kit molecule with the same atoms. state.matched lists
     * the ids matched.
     */
    function matchedFragments() {
      if (!opts.matchBox) return [];
      var given = state.references && state.references.length ? state.references : null, out = [];
      fragments(state.s).forEach(function (f) {
        if (f.members.length < 2) return;
        var sub = subModel(state.s, f.members);
        sub.charge = f.charge;
        var refs = given || [findReference(sub)].filter(Boolean);   // blank canvas: whatever molecule these atoms make
        refs.some(function (id) {
          var hit = L.resonanceForms(Kit.structure(id)).some(function (form) { return L.sameStructure(sub, form); });
          if (hit) out.push({ id: id, members: f.members, charge: f.charge });
          return hit;
        });
      });
      return out;
    }
    function drawMatch() {
      var hits = matchedFragments(), k = view.k;
      state.matched = hits.map(function (m) { return m.id; });
      hits.forEach(function (m) {
        var xs = m.members.map(function (i) { return view.ox + state.s.atoms[i].x * UNIT * k; });
        var ys = m.members.map(function (i) { return view.oy + state.s.atoms[i].y * UNIT * k; });
        var pad = (m.charge ? 66 : 48) * k;
        var x0 = Math.min.apply(null, xs) - pad, y0 = Math.min.apply(null, ys) - pad;
        var x1 = Math.max.apply(null, xs) + pad + (m.charge ? 22 * k : 0), y1 = Math.max.apply(null, ys) + pad;
        var box = el('rect', { class: 'de-match', x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 18 * k,
          fill: 'rgba(31,157,85,0.07)', stroke: MATCH_GREEN, 'stroke-width': 3 * k });
        layer.insertBefore(box, layer.firstChild);   // behind the structure
      });
    }

    function currentRefs() {
      if (state.references && state.references.length) return state.references;
      var out = [];
      fragments(state.s).forEach(function (f) {
        var id = findReference(subModel(state.s, f.members));
        if (id && out.indexOf(id) === -1) out.push(id);
      });
      return out;
    }
    function renderReveal() {
      revealBtn.textContent = state.reveal ? 'Hide answer' : 'Show answer';
      revealBtn.setAttribute('aria-expanded', state.reveal ? 'true' : 'false');
      root.classList.toggle('is-revealing', state.reveal);
      revealEl.hidden = !state.reveal;
      if (!state.reveal) return;
      var ids = currentRefs();
      var key = ids.join(',') + '|' + state.fcMode;
      if (revealEl.dataset.key === key) return;
      revealEl.dataset.key = key;
      revealEl.innerHTML = '';
      if (!ids.length) { revealEl.appendChild(h('p', 'de-reveal-empty', 'Place the atoms of a molecule first, and one way to draw it will appear here.')); return; }
      ids.forEach(function (id) {
        var mol = Kit.get(id), forms = L.resonanceForms(Kit.structure(id));
        var sec = h('section', 'de-reveal-item');
        sec.appendChild(h('p', 'de-reveal-kicker', forms.length > 1 ? 'Resonance' : 'One way to draw it'));
        sec.appendChild(h('h3', 'de-reveal-title', mol.formula + ' · ' + mol.name));
        var row = h('div', 'de-reveal-forms' + (forms.length > 1 ? ' is-resonance' : ''));
        forms.forEach(function (f, n) {
          if (n) { var arrow = h('span', 'de-reveal-arrow', '↔'); arrow.setAttribute('aria-hidden', 'true'); row.appendChild(arrow); }
          var sv = el('svg', { role: 'img', 'aria-label': mol.formula + (forms.length > 1 ? ', resonance structure ' + (n + 1) : '') });
          renderStatic(sv, f, { fcMode: state.fcMode === 'off' ? 'off' : 'compact' });
          row.appendChild(sv);
        });
        sec.appendChild(row);
        if (forms.length > 1) sec.appendChild(h('p', 'de-reveal-note', 'These ' + forms.length + ' structures are equivalent. The real ' + (mol.charge ? 'ion' : 'molecule') + ' is a blend of them.'));
        revealEl.appendChild(sec);
      });
    }

    /**
     * The count line: the valence electrons of the molecule(s) asked for (the prompt's, not the drawing's,
     * so the total is right before anything is placed), what is placed, and what is still to place.
     * No reference (blank canvas, ionic and lift beats): the atoms on the tray, with the charge of any
     * molecule or ion they already make.
     */
    function chargeTerm(c) { return c ? (c > 0 ? ' − ' : ' + ') + Math.abs(c) + ' (charge)' : ''; }
    function atomTerms(els, centre) {
      var order = els.map(function (_, i) { return i; });
      if (centre != null) order = [centre].concat(order.filter(function (i) { return i !== centre; }));
      var first = {};
      order.forEach(function (i, n) { if (!(els[i] in first)) first[els[i]] = n; });
      order.sort(function (p, q) { return first[els[p]] - first[els[q]] || p - q; });   // same elements side by side
      return order.map(function (i) { return els[i] + ' ' + Kit.ELEMENTS[els[i]].valence; });
    }
    function sumEls(els) { return els.reduce(function (n, e) { return n + Kit.ELEMENTS[e].valence; }, 0); }
    function countLine(t) {
      var refs = state.references && state.references.length ? state.references : null, terms, charge = 0, total;
      if (refs && refs.length === 1) {
        var mol = Kit.get(refs[0]), els = Kit.structure(refs[0]).atoms.map(function (a) { return a.el; });
        terms = atomTerms(els, mol.center); charge = mol.charge || 0; total = sumEls(els) - charge;
      } else if (refs) {
        total = 0;
        terms = refs.map(function (id) {
          var n = sumEls(Kit.structure(id).atoms.map(function (a) { return a.el; })) - (Kit.get(id).charge || 0);
          total += n;
          return Kit.get(id).formula + ' ' + n;
        });
      } else {
        var trayEls = state.s.atoms.map(function (a) { return a.el; });
        fragments(state.s).forEach(function (f) {
          if (f.members.length < 2) return;
          var id = findReference(subModel(state.s, f.members));
          if (id) charge += Kit.get(id).charge || 0;
        });
        terms = atomTerms(trayEls, null); total = sumEls(trayEls) - charge;
      }
      var left = total - t.placed;
      return 'Valence electrons: ' + terms.join(' + ') + chargeTerm(charge) + ' = ' + total +
        ' · Placed: ' + t.placed + ' · ' + (left >= 0 ? 'Still to place: ' + left : (-left) + ' too many');
    }

    function renderTally(t, model, subs) {
      tableBtn.setAttribute('aria-pressed', state.table ? 'true' : 'false');
      tallyList.hidden = !state.table;
      tallyList.innerHTML = '';
      if (!state.s.atoms.length && !(state.references && state.references.length)) { tallySum.textContent = 'Nothing placed yet.'; return; }
      tallySum.textContent = countLine(t);
      if (!state.s.atoms.length) return;
      var nums = atomNumbers(state.s);   // O₁, O₂…: in the table only (the teach beat also writes them on the tray)
      var focusAtom = state.hover != null ? state.hover : state.selected;
      // Each molecule or polyatomic ion gets its own table, side by side when there is room;
      // single atoms (loose, or ions made by a transfer) share one table at the end
      var isPiece = function (f) { return f.members.length > 1; };
      var groups = fragments(state.s).filter(isPiece).sort(function (p, q) { return state.s.atoms[p.members[0]].x - state.s.atoms[q.members[0]].x; });
      var singles = fragments(state.s).filter(function (f) { return !isPiece(f); });
      if (singles.length) groups.push({ members: [].concat.apply([], singles.map(function (f) { return f.members; })), loose: true });
      var multi = groups.filter(function (g) { return g.members.length > 1 && !g.loose; }).length > 1 || opts.letters;
      var showFc = state.fcMode !== 'off', n = 0;
      groups.forEach(function (g) {
        var tbl = h('table', 'de-tally-table');
        if (multi && g.members.length > 1 && !g.loose) {
          tbl.appendChild(h('caption', 'de-tally-head', (opts.letters ? 'ABCDEFGH'[n] + ' · ' : '') + fragmentFormula(subModel(state.s, g.members), g.charge)));
          n++;
        }
        var thead = h('thead'), r1 = h('tr'), r2 = h('tr');
        var eh = h('th', 'de-th-group', 'Electrons');
        eh.colSpan = 3; eh.scope = 'colgroup';
        r1.appendChild(h('th')); r1.appendChild(eh); if (showFc) r1.appendChild(h('th'));
        ['Atom', 'in bonds', 'lone', 'around'].concat(showFc ? ['FC'] : []).forEach(function (c) { var th = h('th', null, c); th.scope = 'col'; r2.appendChild(th); });
        thead.appendChild(r1); thead.appendChild(r2); tbl.appendChild(thead);
        var tbody = h('tbody');
        tbl.appendChild(tbody);
        // FC waits until every atom in this molecule has its full count
        var done = !g.loose && g.members.every(function (i) { var st = t.atoms[i]; return st.status === 'ok' || st.status === 'expanded'; });
        // rows like the count line: the centre (most bonds) first, then each element together, O₁, O₂, O₃
        var deg = function (i) { return state.s.bonds.filter(function (bd) { return bd.a === i || bd.b === i; }).length; };
        var lead = g.loose ? [] : g.members.slice().sort(function (p, q) { return deg(q) - deg(p) || p - q; }).slice(0, 1);
        var firstOf = {};
        lead.concat(g.members.slice().sort(function (p, q) { return p - q; })).forEach(function (i) { var e = state.s.atoms[i].el; if (!(e in firstOf)) firstOf[e] = i === lead[0] ? -1 : i; });
        g.members.slice().sort(function (p, q) {
          return firstOf[state.s.atoms[p].el] - firstOf[state.s.atoms[q].el] || nums[p] - nums[q] || p - q;
        }).forEach(function (i) { row(tbody, t.atoms[i], i, done); });
        tallyList.appendChild(tbl);
      });
      function row(tbody, a, i, done) {
        var tr = h('tr', 'de-tally-row' + (state.selected === i ? ' is-selected' : '') + (focusAtom === i ? ' is-focus' : ''));
        var name = a.el + (nums[i] ? SUBD(nums[i]) : '');
        var th = h('th', 'de-td-atom', name);
        th.scope = 'row';
        tr.appendChild(th);
        tr.appendChild(h('td', null, String(a.bonding)));
        tr.appendChild(h('td', null, String(a.nonbonding)));
        var ar = h('td', 'de-td-around', a.around + ' / ' + a.target);
        if (a.status === 'expanded') ar.appendChild(h('span', 'de-td-note', ' expanded'));
        tr.appendChild(ar);
        if (showFc) tr.appendChild(h('td', 'de-fc', !done ? '–' : state.fcMode === 'teach' ? a.fcTeach.replace(/^FC = /, '') : a.fcCompact.replace(/^FC /, '')));
        tr.tabIndex = 0;
        tr.setAttribute('aria-label', name + ': ' + a.bonding + ' electrons in bonds, ' + a.nonbonding + ' in lone pairs, ' + a.around + ' of ' + a.target + '.' +
          (showFc && done ? ' Formal charge ' + (a.fc === 0 ? 'zero' : (a.fc > 0 ? 'plus ' : 'minus ') + Math.abs(a.fc)) + '.' : '') + ' Activate to pick it out on the drawing.');
        tr.addEventListener('click', function () { state.selected = state.selected === i ? null : i; render(); });
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr.click(); } });
        tr.addEventListener('mouseenter', function () { state.hover = i; render(); });
        tr.addEventListener('mouseleave', function () { if (state.hover === i) { state.hover = null; render(); } });
        tbody.appendChild(tr);
      }
    }

    // --- Hit testing ---------------------------------------------------------------------------
    function atomAt(p, radiusPx) {
      var U = UNIT * view.k, best = -1, bd = radiusPx;
      state.s.atoms.forEach(function (a, i) {
        var d = Math.hypot(view.ox + a.x * U - p.x, view.oy + a.y * U - p.y);
        if (d <= bd) { bd = d; best = i; }
      });
      return best;
    }
    function hit(p) {
      var k = view.k, best = null, bd = G.eHit * k * 1.2;
      dots.forEach(function (d) {
        var dd = Math.hypot(d.x - p.x, d.y - p.y);
        if (dd <= bd) { bd = dd; best = { kind: 'e', atom: d.atom, slot: d.slot }; }
      });
      if (best) return best;
      var ai = atomAt(p, G.letterHit * k);
      if (ai !== -1) return { kind: 'atom', atom: ai };
      var U = UNIT * k, bi = -1, bdist = G.bondHit * k;
      state.s.bonds.forEach(function (b, i) {
        var A = state.s.atoms[b.a], B = state.s.atoms[b.b];
        var x1 = view.ox + A.x * U, y1 = view.oy + A.y * U, x2 = view.ox + B.x * U, y2 = view.oy + B.y * U;
        var dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
        var tt = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / l2));
        var dd = Math.hypot(x1 + tt * dx - p.x, y1 + tt * dy - p.y);
        if (dd <= bdist) { bdist = dd; bi = i; }
      });
      return bi !== -1 ? { kind: 'bond', bond: bi } : null;
    }

    // --- Tray: drag a tile into the box -------------------------------------------------------------
    function startTileDrag(e, sym, tile) {
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      var ghost = h('div', 'de-ghost', sym);
      document.body.appendChild(ghost);
      function moveG(ev) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
      moveG(e);
      function up(ev) {
        document.removeEventListener('pointermove', moveG);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', cancel);
        ghost.remove();
        var r = svg.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          var u = toUnits(local(ev));
          placeAt(sym, occupied(state.s, u.x, u.y) ? freeSpot(state.s, u.x, u.y) : u);
        } else if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) {
          say('Drag the atom into the box.'); render();
        }
      }
      function cancel() { up({ clientX: -9999, clientY: -9999 }); }
      document.addEventListener('pointermove', moveG);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', cancel);
    }

    // --- Pointer on the stage ----------------------------------------------------------------------
    /** Which atoms move with atom i: the whole structure when i is central (or the molecule has two atoms). */
    function ionGroup(i) {
      var seen = [i], tr = state.s.transfers || [];
      for (var k = 0; k < seen.length; k++) tr.forEach(function (t) {
        var o = t.from === seen[k] ? t.to : t.to === seen[k] ? t.from : -1;
        if (o !== -1 && seen.indexOf(o) === -1) seen.push(o);
      });
      return seen;
    }
    function moveSet(i) {
      var ig = ionGroup(i);
      if (ig.length > 1) return ig;
      var f = fragments(state.s).filter(function (fr) { return fr.members.indexOf(i) !== -1; })[0];
      if (!f || f.members.length === 1) return [i];
      return degree(i) >= 2 || f.members.length === 2 ? f.members : [i];
    }
    function onDown(e) {
      if (drag || (e.button !== undefined && e.button > 0)) return;
      e.preventDefault();
      focusKey = null;
      var p = local(e), t = hit(p);
      drag = { id: e.pointerId, start: p, t: t, moved: false };
      if (t && t.kind === 'atom') {
        drag.kind = 'atom';
        drag.set = moveSet(t.atom);
        drag.orig = drag.set.map(function (q) { return { x: state.s.atoms[q].x, y: state.s.atoms[q].y }; });
      }
      if (t && t.kind === 'e' && locked(t.atom) && !state.erase) {   // set electrons can't be picked up: grab the ion instead
        t = drag.t = { kind: 'atom', atom: t.atom };
        drag.kind = 'atom';
        drag.set = moveSet(t.atom);
        drag.orig = drag.set.map(function (q) { return { x: state.s.atoms[q].x, y: state.s.atoms[q].y }; });
        drag.fromLocked = true;
      }
      if (t && t.kind === 'e') drag.kind = 'e';
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    }
    /** Where an electron is being dropped: another atom's electron (share), its letter (move), own atom (re-place). */
    function electronTarget(p, fromAtom) {
      var k = view.k, best = null, bd = G.eHit * k * 1.8;
      dots.forEach(function (dt) {
        if (dt.atom === fromAtom) return;
        var dd = Math.hypot(dt.x - p.x, dt.y - p.y);
        if (dd <= bd) { bd = dd; best = { kind: 'share', atom: dt.atom, slot: dt.slot }; }
      });
      if (best) return best;
      var other = atomAt(p, G.near * UNIT * k);
      if (other !== -1 && other !== fromAtom) {
        if (METALS[state.s.atoms[fromAtom].el] || METALS[state.s.atoms[other].el]) return { kind: 'move', atom: other };
        // Covalent: dropping on the letter shares with that atom's nearest electron (a single first)
        var near = null, nd = Infinity;
        dots.forEach(function (dt) {
          if (dt.atom !== other) return;
          var dd = Math.hypot(dt.x - p.x, dt.y - p.y) + (state.s.atoms[other].slots[dt.slot] === 1 ? 0 : 1000);
          if (dd < nd) { nd = dd; near = dt; }
        });
        return near ? { kind: 'share', atom: other, slot: near.slot } : null;
      }
      var src = state.s.atoms[fromAtom], U = UNIT * k;
      if (Math.hypot(view.ox + src.x * U - p.x, view.oy + src.y * U - p.y) / U <= G.removeAt) return { kind: 'own', atom: fromAtom };
      return null;
    }
    function onMove(e) {
      var p = local(e);
      if (!drag) {
        var hv = hit(p), hi = hv && hv.atom != null ? hv.atom : null;
        if (hi !== state.hover) { state.hover = hi; render(); }
        return;
      }
      if (e.pointerId !== drag.id) return;
      if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 6) drag.moved = true;
      if (!drag.moved || state.erase) return;
      if (drag.kind === 'atom') {
        var u = toUnits(p), u0 = toUnits(drag.start);
        drag.set.forEach(function (q, n) { state.s.atoms[q].x = drag.orig[n].x + u.x - u0.x; state.s.atoms[q].y = drag.orig[n].y + u.y - u0.y; });
        render();
      } else if (drag.kind === 'e') {
        var tg = electronTarget(p, drag.t.atom);
        var prev = drag.target;
        drag.target = tg && tg.kind !== 'own' ? tg : null;
        carried.setAttribute('cx', p.x); carried.setAttribute('cy', p.y);
        carried.setAttribute('visibility', 'visible');
        if (drag.target && drag.target.kind === 'move') {
          var arc = arcPaths(drag.start.x, drag.start.y, p.x, p.y, 20 + Math.hypot(p.x - drag.start.x, p.y - drag.start.y) * 0.18, 1);
          flightPath.setAttribute('d', arc.d); flightHead.setAttribute('d', arc.head);
          flight.setAttribute('visibility', 'visible');
          rubber.setAttribute('visibility', 'hidden');
        } else {
          rubber.setAttribute('x1', drag.start.x); rubber.setAttribute('y1', drag.start.y);
          rubber.setAttribute('x2', p.x); rubber.setAttribute('y2', p.y);
          rubber.setAttribute('visibility', 'visible');
          flight.setAttribute('visibility', 'hidden');
        }
        if ((prev && prev.atom) !== (drag.target && drag.target.atom)) render();
      }
    }
    function endDrag() {
      carried.setAttribute('visibility', 'hidden');
      flight.setAttribute('visibility', 'hidden');
      rubber.setAttribute('visibility', 'hidden');
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      endDrag();
      var p = local(e), t = d.t;
      if (!d.moved) {
        if (!t) { if (state.selected != null) { state.selected = null; render(); } return; }
        if (t.kind === 'bond') lowerBond(t.bond);
        else if (t.kind === 'atom' && d.fromLocked) lockedSay(t.atom);
        else if (t.kind === 'atom') clickAtom(t.atom);
        else if (t.kind === 'e' && state.erase) removeElectron(t.atom, t.slot);
        else render();   // clicking an electron does nothing
        return;
      }
      if (state.erase || !t) { render(); return; }
      if (d.kind === 'atom') {
        var finals = d.set.map(function (q) { var a = state.s.atoms[q]; return { x: Math.round(a.x * 4) / 4, y: Math.round(a.y * 4) / 4 }; });
        d.set.forEach(function (q, n) { state.s.atoms[q].x = d.orig[n].x; state.s.atoms[q].y = d.orig[n].y; });
        snapshot();
        d.set.forEach(function (q, n) { state.s.atoms[q].x = finals[n].x; state.s.atoms[q].y = finals[n].y; });
        changed();
      } else if (d.kind === 'e') {
        var tg = electronTarget(p, t.atom), U = UNIT * view.k;
        if (!tg) { render(); return; }   // dropped in empty space: it snaps back
        var B = state.s.atoms[tg.atom];
        var ang = deg(Math.atan2(p.y - (view.oy + B.y * U), p.x - (view.ox + B.x * U)));
        if (tg.kind === 'share') shareElectrons(t.atom, t.slot, tg.atom, tg.slot);
        else moveElectron(t.atom, t.slot, tg.atom, ang);
      }
    }
    function onCancel(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.kind === 'atom') drag.set.forEach(function (q, n) { state.s.atoms[q].x = drag.orig[n].x; state.s.atoms[q].y = drag.orig[n].y; });
      drag = null;
      endDrag();
      render();
    }
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onCancel);
    svg.addEventListener('pointerleave', function () { if (!drag && state.hover != null) { state.hover = null; render(); } });

    // --- Keyboard ------------------------------------------------------------------------------------
    // Atom: Enter adds an electron · B starts a bond (then B on another atom) · − removes an electron ·
    // arrows move · Delete removes. Bond: Enter removes one line.
    svg.addEventListener('keydown', function (e) {
      var tg = e.target;
      var ai = tg.getAttribute && tg.getAttribute('data-atom');
      var bi = tg.getAttribute && tg.getAttribute('data-bond');
      if (ai == null && bi == null) return;
      var handled = true;
      if (ai != null) {
        ai = +ai;
        focusKey = '.de-hit-atom[data-atom="' + ai + '"]';
        var a = state.s.atoms[ai];
        if (e.key === 'Enter' || e.key === ' ') {
          clickAtom(ai);
        } else if (e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
          if (state.source != null && state.source !== ai) {
            var from = state.source, fa = state.s.atoms[from], ta = state.s.atoms[ai];
            state.source = null;
            var pickSlot = function (atom) { var q1 = atom.slots.indexOf(1); return q1 !== -1 ? q1 : atom.slots.findIndex(function (c) { return c > 0; }); };
            var qf = pickSlot(fa), qt = pickSlot(ta);
            if (locked(from)) lockedSay(from);
            else if (qf === -1) { say(fa.el + ' has no electron to use.'); render(); }
            else if (METALS[fa.el] || METALS[ta.el]) moveElectron(from, qf, ai, 0);
            else if (qt === -1) { say(ta.el + ' has no electron to share.'); render(); }
            else shareElectrons(from, qf, ai, qt);
          } else { state.source = state.source === ai ? null : ai; render(); }
        }
        else if ((e.key === '-' || e.key === '_') && locked(ai)) { lockedSay(ai); }
        else if (e.key === '-' || e.key === '_') {
          var q = a.slots.map(function (c, n) { return c === 1 ? n : -1; }).filter(function (n) { return n !== -1; })[0];
          if (q == null) q = a.slots.findIndex(function (c) { return c > 0; });
          if (q != null && q !== -1) removeElectron(ai, q);
        } else if (e.key === 'Delete' || e.key === 'Backspace') { focusKey = null; removeAtomAt(ai); }
        else if (/^Arrow/.test(e.key)) {
          snapshot();
          if (e.key === 'ArrowLeft') a.x -= 0.25;
          if (e.key === 'ArrowRight') a.x += 0.25;
          if (e.key === 'ArrowUp') a.y -= 0.25;
          if (e.key === 'ArrowDown') a.y += 0.25;
          changed();
        } else if (e.key === 'Escape') { state.source = state.selected = null; render(); }
        else handled = false;
      } else {
        bi = +bi;
        focusKey = null;
        if (e.key === 'Enter' || e.key === ' ') lowerBond(bi);
        else if (e.key === 'Delete' || e.key === 'Backspace') { snapshot(); state.s.bonds.splice(+bi, 1); changed(); }
        else handled = false;
      }
      if (handled) e.preventDefault();
    });
    svg.addEventListener('focusin', function (e) {
      var ai = e.target.getAttribute && e.target.getAttribute('data-atom');
      if (ai != null && state.hover !== +ai) { state.hover = +ai; focusKey = '.de-hit-atom[data-atom="' + ai + '"]'; render(); }
    });

    function exportTitle() {
      var ids = currentRefs();
      if (ids.length > 1) {
        var fs = ids.map(function (id) { return Kit.get(id).formula; });
        return { title: fs.slice(0, -1).join(', ') + ' and ' + fs[fs.length - 1], subtitle: '', slug: ids.join('-') };
      }
      if (ids.length === 1) { var m = Kit.get(ids[0]); return { title: m.formula, subtitle: m.name, slug: m.id }; }
      return { title: 'My Lewis structure', subtitle: '', slug: 'lewis-structure' };
    }
    function save() {
      if (!state.s.atoms.length) { say('Place some atoms first, then save.'); render(); return Promise.resolve(); }
      var t = exportTitle();
      return exportJPEG(clone(state.s), { title: t.title, subtitle: t.subtitle, fcMode: state.fcMode, counters: state.counters }).then(function (blob) {
        return deliverFile(blob, t.slug + '-' + new Date().toISOString().slice(0, 10) + '.jpg');
      });
    }

    var ro = global.ResizeObserver ? new ResizeObserver(function () { render(); }) : null;
    if (ro) ro.observe(stageWrap);
    function onWinResize() { refit(); render(); }
    global.addEventListener('resize', onWinResize);
    if (opts.structure) { state.s = fromModel(opts.structure); recentre(); }
    render();

    return {
      root: root,
      svg: svg,
      get: function () { return toModel(state.s); },
      state: function () { return clone(state.s); },
      restore: function (raw) { refit(); state.history = []; state.s = clone(raw); state.selected = state.source = state.hover = null; say(''); changed(); },
      tally: function () { return L.tally(toModel(state.s)); },
      load: function (structure) { refit(); state.history = []; state.s = fromModel(structure); state.selected = state.source = state.hover = null; recentre(); say(''); changed(); },
      loadMany: function (structures) {
        refit();
        var combined = { atoms: [], bonds: [], transfers: [] }, x = 0;
        structures.forEach(function (m) {
          var part = fromModel(m), b = bbox(part.atoms), base = combined.atoms.length;
          part.atoms.forEach(function (a) { a.x = a.x - b.x0 + x; a.y -= b.cy; combined.atoms.push(a); });
          part.bonds.forEach(function (bd) { combined.bonds.push({ a: bd.a + base, b: bd.b + base, order: bd.order }); });
          x += (b.x1 - b.x0) + 2.6;
        });
        state.history = []; state.s = combined; state.selected = state.source = state.hover = null;
        recentre(); say(''); changed();
      },
      clear: function () { refit(); snapshot(); state.s = { atoms: [], bonds: [], transfers: [] }; state.selected = state.source = null; changed(); },
      undo: undo,
      setFcMode: function (m) { state.fcMode = m; render(); },
      setCounters: function (on) { state.counters = !!on; render(); },
      setTable: function (on) { state.table = !!on; tallyList.hidden = !state.table; refit(); render(); },
      matched: function () { return (state.matched || []).slice(); },
      setReference: function (ids) { state.references = ids ? [].concat(ids) : null; revealEl.dataset.key = ''; render(); },
      showReference: function (on) { state.reveal = !!on; render(); },
      setPrompt: function (text) { promptEl.textContent = text || ''; promptEl.hidden = !text; msgEl.classList.toggle('has-prompt', !!text); },
      select: function (i) { state.selected = i; render(); },
      place: function (sym, x, y) { placeAt(sym, { x: x, y: y }); },   // tests / scripted demos
      exportJPEG: function () { var t = exportTitle(); return exportJPEG(clone(state.s), { title: t.title, subtitle: t.subtitle, fcMode: state.fcMode, counters: state.counters }); },
      save: save,
      render: render,
      _dots: function () { return dots.slice(); },
      _atomPx: function (i) { var a = state.s.atoms[i]; return { x: view.ox + a.x * UNIT * view.k, y: view.oy + a.y * UNIT * view.k }; },
      destroy: function () { if (ro) ro.disconnect(); global.removeEventListener('resize', onWinResize); mount.removeChild(root); },
    };
  }

  global.DrawEngine = {
    create: create,
    renderStatic: renderStatic,
    exportJPEG: exportJPEG,
    findReference: findReference,
    UNIT: UNIT,
    _: { fromModel: fromModel, toModel: toModel, fragments: fragments, addElectron: addElectron },
  };
})(window);
