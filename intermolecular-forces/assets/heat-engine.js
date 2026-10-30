/**
 * IMF Heat room - one sealed jar of a single substance on a hot plate.
 *
 * Thermo is real-data but deliberately small:
 *   - One molar heat capacity for every phase, so slopes compare fairly between substances.
 *   - Vapour pressure from Clausius–Clapeyron through the normal boiling point.
 *   - The jar is sized so the last liquid vaporizes right at the boiling point (gauge = 1 atm).
 * Particles are a picture of that state (lattice / puddle / free flight), not an MD simulation:
 * phase fractions decide how many sit in each role, and motion is damped and capped.
 */
(function (global) {
  'use strict';

  var R_GAS = 8.314e-3;   // kJ/(mol·K)
  var C_MOLAR = 0.075;    // kJ/(mol·K), every phase
  var POWER = 2.5;        // kJ/mol per second at full burner
  var T_MIN = 40;
  var T_MAX = 520;
  var T_ROOM = 298;
  var SCALE = 0.375;      // model units → px, same for every substance so sizes compare honestly
  var CLOUD_PAD = 16;     // model units, as in the Guide
  var CLOUD_LAYERS = 4;
  var FILL = 0.26;        // fraction of the jar the condensed sample fills
  var SWAPS_PER_S = 40;   // role changes per second, so phase shifts read as a flow
  var LIQUID_FLOW = 22;   // px/s drift of liquid molecules at their melting point
  var EXCHANGE = 0.12;    // surface swaps per vapour molecule per second (evaporate + condense at once)
  // Depth, as in the equilibrium sims: z = +1 at the front glass (full size), −1 at the back wall,
  // drawn at PERSP_BACK × size toward a vanishing point at the jar's centre; far molecules fade
  var PERSP_BACK = 0.62;
  var DEPTH_ALPHA = 0.32;
  var LAYERS_Z = [0.66, 0, -0.66]; // condensed molecules pack in three depth layers, front first

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /** Energy ↔ state for one substance. h: { mp, bp, hfus, hvap } in K and kJ/mol. */
  function heatModel(h) {
    function vaporFrac(T) {
      var p = Math.exp(-(h.hvap / R_GAS) * (1 / T - 1 / h.bp));
      return clamp((p * h.bp) / T, 0, 1);
    }
    var xm = vaporFrac(h.mp);
    var meltSpan = h.hfus * (1 - xm);
    function energyAt(T) {
      if (T <= h.mp) return C_MOLAR * T + (h.hfus + h.hvap) * vaporFrac(T);
      return C_MOLAR * T + h.hfus + h.hvap * vaporFrac(T);
    }
    var eMelt0 = energyAt(h.mp);
    var eMelt1 = eMelt0 + meltSpan;
    var eLo = energyAt(T_MIN);
    var eHi = energyAt(T_MAX);

    function stateAt(E) {
      if (E >= eMelt0 && E <= eMelt1 && meltSpan > 1e-6) {
        return { T: h.mp, x: xm, melt: (E - eMelt0) / meltSpan };
      }
      var lo = E < eMelt0 ? T_MIN : h.mp;
      var hi = E < eMelt0 ? h.mp : T_MAX;
      for (var i = 0; i < 40; i++) {
        var mid = (lo + hi) / 2;
        if (energyAt(mid) < E) lo = mid;
        else hi = mid;
      }
      var T = (lo + hi) / 2;
      return { T: T, x: vaporFrac(T), melt: T > h.mp ? 1 : 0 };
    }

    return {
      energyAt: energyAt,
      stateAt: stateAt,
      clampE: function (E) {
        return clamp(E, eLo, eHi);
      },
      // vapour pressure while liquid remains, then the ideal-gas rise of a fixed amount
      pressure: function (s) {
        return (s.x * s.T) / h.bp;
      },
    };
  }

  function phaseOf(s, h) {
    if (s.x > 0.995) return 'gas';
    if (s.melt <= 0 && s.T <= h.mp) return 'solid';
    if (s.melt < 1) return 'melting';
    return 'liquid';
  }

  function create(opts) {
    var canvas = opts.canvas;
    var ctx = canvas.getContext('2d');
    var T = global.ImfEngine.THEME;
    var GEOM = global.ImfEngine.GEOM;
    var reduced = global.ImfEngine.prefersReduced();
    var onUpdate = opts.onUpdate || null;

    var W = 0;
    var H = 0;
    var dpr = 1;
    var jar = { x0: 0, y0: 0, x1: 0, y1: 0 };

    var mol = null;
    var g = null;
    var model = null;
    var E = 0;
    var power = 0;
    var state = null;
    var parts = [];
    var cell = { w: 0, h: 0, r: 0 };
    var slots = [];
    var swapBudget = 0;
    var exchangeBudget = 0;
    var hbonds = {};
    var clock = 0;
    var running = false;
    var last = 0;

    /* ---------- layout ---------- */

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      var ow = W;
      var oh = H;
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      var jw = Math.min(W - 40, H * 1.05);
      jar.x0 = (W - jw) / 2;
      jar.x1 = jar.x0 + jw;
      jar.y1 = H - 44;
      jar.y0 = 22;
      if (g) {
        buildSlots();
        if (ow && oh) {
          parts.forEach(function (p) {
            p.x *= W / ow;
            p.y *= H / oh;
          });
        }
      }
    }

    function bbox(geo) {
      var x0 = Infinity;
      var x1 = -Infinity;
      var y0 = Infinity;
      var y1 = -Infinity;
      geo.atoms.forEach(function (a) {
        x0 = Math.min(x0, a.x - a.r);
        x1 = Math.max(x1, a.x + a.r);
        y0 = Math.min(y0, a.y - a.r);
        y1 = Math.max(y1, a.y + a.r);
      });
      var s = geo.shell || 0;
      return { w: x1 - x0 + 2 * s, h: y1 - y0 + 2 * s };
    }

    function buildSlots() {
      var b = bbox(g);
      cell.w = (b.w + CLOUD_PAD) * SCALE + 2;
      cell.h = (b.h + CLOUD_PAD) * SCALE + 2;
      cell.r = Math.sqrt(cell.w * cell.h) / 2;
      var iw = jar.x1 - jar.x0 - 8;
      var cols = Math.max(1, Math.floor(iw / cell.w));
      var left = jar.x0 + 4 + (iw - cols * cell.w) / 2;
      slots = [];
      var perRow = cols * LAYERS_Z.length;
      for (var i = 0; i < parts.length; i++) {
        var row = Math.floor(i / perRow);
        var layer = Math.floor((i % perRow) / cols);
        var col = i % cols;
        // brick offset on alternate rows and layers packs round molecules tighter, like a crystal
        var off = (row + layer) % 2 ? cell.w / 2 : 0;
        if (off && col === cols - 1) off = 0;
        slots.push({
          x: left + cell.w * (col + 0.5) + off,
          y: jar.y1 - 4 - cell.h * (row + 0.5) * 0.92,
          z: LAYERS_Z[layer],
        });
      }
    }

    /* ---------- substance ---------- */

    function setSubstance(id) {
      mol = global.ImfMolecules.get(id);
      g = GEOM[id];
      model = heatModel(mol.heat);
      var b = bbox(g);
      var area = ((b.w + CLOUD_PAD) * SCALE + 2) * ((b.h + CLOUD_PAD) * SCALE + 2);
      var n = clamp(Math.round(((jar.x1 - jar.x0) * (jar.y1 - jar.y0) * FILL * LAYERS_Z.length) / area), 12, 160);
      parts = [];
      hbonds = {};
      for (var i = 0; i < n; i++) {
        parts.push({ x: 0, y: 0, z: Math.random() * 1.8 - 0.9, vz: 0, vx: 0, vy: 0, a: 0, va: 0, role: 'solid', slot: -1, seed: Math.random() * 100, td: { x: 0, y: 0, sx: 0, sy: 0, amp: 0, near: 0 } });
      }
      buildSlots();
      reset();
    }

    function reset() {
      E = model.energyAt(T_ROOM);
      state = model.stateAt(E);
      placeAll();
      emit();
    }

    // Snap every particle into the roles the current state calls for
    function placeAll() {
      var want = targetCounts();
      var used = 0;
      parts.forEach(function (p, i) {
        p.slot = -1;
        p.va = 0;
        if (i < want.solid) {
          p.role = 'solid';
          p.slot = used++;
          p.x = slots[p.slot].x;
          p.y = slots[p.slot].y;
          p.z = slots[p.slot].z;
          p.a = 0;
        } else if (i < want.solid + want.liquid) {
          p.role = 'liquid';
          p.x = slots[i].x;
          p.y = slots[i].y;
          p.z = slots[i].z;
          p.a = Math.random() * Math.PI * 2;
        } else {
          p.role = 'gas';
          p.x = jar.x0 + 20 + Math.random() * (jar.x1 - jar.x0 - 40);
          p.y = jar.y0 + 20 + Math.random() * (jar.y1 - jar.y0) * 0.5;
          var ang = Math.random() * Math.PI * 2;
          var v = gasSpeed();
          p.vx = Math.cos(ang) * v;
          p.vy = Math.sin(ang) * v;
          p.vz = depthSpeed(v);
          p.a = Math.random() * Math.PI * 2;
        }
      });
    }

    function targetCounts() {
      var n = parts.length;
      var gas = Math.round(state.x * n);
      var cond = n - gas;
      var solid = state.melt >= 1 ? 0 : Math.round(cond * (1 - state.melt));
      return { gas: gas, solid: solid, liquid: cond - solid };
    }

    // a random in/out-of-page speed (depth units/s) in proportion to a px/s flight speed
    function depthSpeed(v) {
      return (Math.random() * 2 - 1) * (v / ((jar.x1 - jar.x0) / 2)) * 0.9;
    }

    function gasSpeed() {
      var size = (cell.w * cell.h) / 700;
      return clamp((120 * Math.sqrt(state.T / 300)) / Math.sqrt(size), 30, 300) * (reduced ? 0.5 : 1);
    }

    /* ---------- role changes ---------- */

    function count(role) {
      var c = 0;
      parts.forEach(function (p) {
        if (p.role === role) c++;
      });
      return c;
    }

    function pick(role, score) {
      var best = null;
      var bs = -Infinity;
      parts.forEach(function (p) {
        if (p.role !== role) return;
        var s = score(p);
        if (s > bs) {
          bs = s;
          best = p;
        }
      });
      return best;
    }

    function freeSlot() {
      var taken = {};
      parts.forEach(function (p) {
        if (p.role === 'solid') taken[p.slot] = true;
      });
      for (var i = 0; i < slots.length; i++) if (!taken[i]) return i;
      return 0;
    }

    function toGas(p) {
      p.role = 'gas';
      p.slot = -1;
      var v = gasSpeed();
      p.vx = (Math.random() - 0.5) * v;
      p.vy = -v;
      p.vz = depthSpeed(v);
      p.va = (Math.random() - 0.5) * 3;
    }

    function toSolid(p) {
      p.role = 'solid';
      p.slot = freeSlot();
    }

    function toLiquid(p) {
      p.role = 'liquid';
      p.slot = -1;
      p.vx *= 0.2;
      p.vy *= 0.2;
    }

    // One step toward the target counts; condensed ↔ gas through the surface, solid ↔ liquid in place
    function swapOne() {
      var want = targetCounts();
      var gas = count('gas');
      var solid = count('solid');
      if (gas < want.gas) {
        var top = pick('liquid', function (p) {
          return -p.y;
        }) || pick('solid', function (p) {
          return p.slot;
        });
        if (top) toGas(top);
        return true;
      }
      if (gas > want.gas) {
        var low = pick('gas', function (p) {
          return p.y;
        });
        if (low) {
          if (want.liquid > count('liquid') || want.solid === 0) toLiquid(low);
          else toSolid(low);
        }
        return true;
      }
      if (solid > want.solid) {
        var up = pick('solid', function (p) {
          return p.slot;
        });
        if (up) toLiquid(up);
        return true;
      }
      if (solid < want.solid) {
        var deep = pick('liquid', function (p) {
          return p.y;
        });
        if (deep) toSolid(deep);
        return true;
      }
      return false;
    }

    // Dynamic equilibrium: with the counts already right, a surface molecule escapes while a vapour
    // molecule lands, so evaporation and condensation are both visible at a steady temperature
    function exchange(dt) {
      var gas = count('gas');
      var liquid = count('liquid');
      if (!gas || !liquid || reduced) {
        exchangeBudget = 0;
        return;
      }
      exchangeBudget += dt * Math.min(EXCHANGE * gas, 1.5);
      if (exchangeBudget < 1) return;
      exchangeBudget -= 1;
      var tops = parts
        .filter(function (p) {
          return p.role === 'liquid';
        })
        .sort(function (m, n) {
          return m.y - n.y;
        })
        .slice(0, 3);
      var leaving = tops[Math.floor(Math.random() * tops.length)];
      var landing = pick('gas', function (p) {
        return p.y;
      });
      toLiquid(landing);
      toGas(leaving);
    }

    /* ---------- motion ---------- */

    // From how much is condensed, not from the highest particle: a just-condensed molecule
    // still falling would otherwise lift the floor and squash the gas
    function surfaceY() {
      var cols = Math.max(1, Math.floor((jar.x1 - jar.x0 - 8) / cell.w));
      var rows = (parts.length - count('gas')) / (cols * LAYERS_Z.length);
      var y = jar.y1 - 4 - rows * cell.h * 0.92 - (rows > 0 ? cell.h * 0.3 : 0);
      return Math.max(y, jar.y0 + 4 + cell.r * 3);
    }

    function stepParticles(dt) {
      var heatK = clamp(state.T / Math.max(mol.heat.mp, 1), 0, 2.5);
      var jig = reduced ? 0.25 : 1;
      var floor = surfaceY();
      var left = jar.x0 + 4;
      var right = jar.x1 - 4;
      var top = jar.y0 + 4;
      var vt = gasSpeed();

      parts.forEach(function (p) {
        if (p.role === 'solid') {
          var s = slots[p.slot] || slots[0];
          var amp = (0.6 + 1.6 * heatK) * jig;
          var tx = s.x + Math.sin(clock * 9 + p.seed) * amp;
          var ty = s.y + Math.cos(clock * 11 + p.seed * 1.7) * amp * 0.7;
          var k = 1 - Math.exp(-dt / 0.12);
          p.x += (tx - p.x) * k;
          p.y += (ty - p.y) * k;
          p.a += (Math.sin(clock * 7 + p.seed) * 0.06 * heatK * jig - p.a) * k;
          p.z += (s.z - p.z) * k;
        } else if (p.role === 'liquid') {
          // each molecule wanders on a slow private current; packing turns that into sliding past
          // neighbours rather than jiggling on the spot
          var flow = LIQUID_FLOW * Math.sqrt(heatK) * jig;
          var wa = p.seed * 7 + clock * 0.35 + Math.sin(clock * 0.6 + p.seed) * 1.6;
          var kv = 1 - Math.exp(-dt / 0.3);
          p.vx += (Math.cos(wa) * flow - p.vx) * kv;
          p.vy += (Math.sin(wa) * flow * 0.6 - p.vy) * kv + 260 * dt;
          p.vx += (Math.random() - 0.5) * 300 * dt * jig;
          p.vy += (Math.random() - 0.5) * 200 * dt * jig;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // slow tumbling, so donors and acceptors keep meeting new partners
          // drifting slowly toward and away from the glass as well
          p.z += Math.sin(clock * 0.3 + p.seed * 2) * 0.12 * dt * jig;
          var spinTo = Math.sin(clock * 0.5 + p.seed * 3) * 1.4 * jig;
          p.va += (spinTo - p.va) * (1 - Math.exp(-dt / 0.8));
          p.a += p.va * dt;
          // long chains (octane) lie roughly flat in the puddle instead of spearing the floor
          if (cell.w > cell.h * 2) p.a = clamp(p.a, -0.35, 0.35);
        } else {
          // ease toward the temperature's speed without losing direction
          var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
          var ns = sp + (vt - sp) * (1 - Math.exp(-dt / 0.5));
          p.vx *= ns / sp;
          p.vy *= ns / sp;
          p.vz *= ns / sp;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.a += p.va * dt;
          if (p.z < -1) {
            p.z = -1;
            p.vz = Math.abs(p.vz);
          } else if (p.z > 1) {
            p.z = 1;
            p.vz = -Math.abs(p.vz);
          }
          if (p.x < left + cell.r) {
            p.x = left + cell.r;
            p.vx = Math.abs(p.vx);
          }
          if (p.x > right - cell.r) {
            p.x = right - cell.r;
            p.vx = -Math.abs(p.vx);
          }
          if (p.y < top + cell.r) {
            p.y = top + cell.r;
            p.vy = Math.abs(p.vy);
          }
          if (p.y > floor - cell.r * 0.4) {
            p.y = floor - cell.r * 0.4;
            p.vy = -Math.abs(p.vy);
          }
        }
      });

      // condensed particles keep a molecule's width apart; solids hold their slots
      var zPx = (cell.r * 1.8) / 0.66;
      for (var it = 0; it < 2; it++) {
        for (var i = 0; i < parts.length; i++) {
          var a = parts[i];
          if (a.role === 'gas') continue;
          for (var j = i + 1; j < parts.length; j++) {
            var b = parts[j];
            if (b.role === 'gas') continue;
            if (a.role === 'solid' && b.role === 'solid') continue;
            // packing is 3D: one depth layer apart (0.66) counts as one molecule width
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var dz = (b.z - a.z) * zPx;
            var min = cell.r * 1.8;
            if (Math.abs(dx) >= min || Math.abs(dy) >= min || Math.abs(dz) >= min) continue;
            var d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
            if (d >= min) continue;
            var push = Math.min(min - d, 4) / d;
            var wa = a.role === 'solid' ? 0 : b.role === 'solid' ? 1 : 0.5;
            a.x -= dx * push * wa;
            a.y -= dy * push * wa;
            a.z -= (dz * push * wa) / zPx;
            b.x += dx * push * (1 - wa);
            b.y += dy * push * (1 - wa);
            b.z += (dz * push * (1 - wa)) / zPx;
          }
        }
        parts.forEach(function (p) {
          if (p.role !== 'liquid') return;
          p.z = clamp(p.z, -0.95, 0.95);
          var hw = cell.r;
          if (p.x < left + hw) {
            p.x = left + hw;
            p.vx = Math.abs(p.vx) * 0.3;
          }
          if (p.x > right - hw) {
            p.x = right - hw;
            p.vx = -Math.abs(p.vx) * 0.3;
          }
          if (p.y < top + hw) {
            p.y = top + hw;
            p.vy = Math.max(0, p.vy);
          }
          if (p.y > jar.y1 - 4 - cell.h * 0.46) {
            p.y = jar.y1 - 4 - cell.h * 0.46;
            p.vy = Math.min(0, p.vy);
          }
        });
      }
    }

    /* ---------- drawing ---------- */

    /* ---------- perspective ---------- */

    function persp(z) {
      return PERSP_BACK + (1 - PERSP_BACK) * (z + 1) * 0.5;
    }

    // Screen position, px-per-model-unit scale and depth fade for a molecule
    function view(p) {
      var k = persp(p.z);
      var vx = (jar.x0 + jar.x1) / 2;
      var vy = (jar.y0 + jar.y1) / 2;
      return {
        x: vx + (p.x - vx) * k,
        y: vy + (p.y - vy) * k,
        s: SCALE * k,
        alpha: 1 - DEPTH_ALPHA * (1 - (p.z + 1) * 0.5),
      };
    }

    /* Electron clouds: the Guide's squishy teardrop (imf-engine drawDropCloud), drawn in model
       units around each molecule. Polar molecules lean toward their δ− end for good; nonpolar
       ones sit small, round and grey on their own (gas) and slosh with temporary dipoles only
       when packed against neighbours (solid / liquid). */

    var OUTLINE_N = 30;
    var OUTLINE_A = new Float32Array(OUTLINE_N);
    var OUTLINE_S = new Float32Array(OUTLINE_N);
    var COS_T = new Float32Array(OUTLINE_N);
    var SIN_T = new Float32Array(OUTLINE_N);
    for (var ci = 0; ci < OUTLINE_N; ci++) {
      COS_T[ci] = Math.cos((ci / OUTLINE_N) * Math.PI * 2);
      SIN_T[ci] = Math.sin((ci / OUTLINE_N) * Math.PI * 2);
    }

    function dropProfile(t, r0) {
      return Math.sin(t) * (r0 + (1 - r0) * Math.sin(t / 2));
    }

    function cloudRich(w) {
      if (w.src.q < -0.05) return true;
      return g.lps.length > 0 && /^(O|N|F)$/.test(w.src.el);
    }

    // Origin, unit axis rich → poor, and skew 0..1 (see imf-engine dropFrame)
    function dropFrame(p, atoms) {
      var cx = 0;
      var cy = 0;
      atoms.forEach(function (w) {
        cx += w.x;
        cy += w.y;
      });
      cx /= atoms.length;
      cy /= atoms.length;
      if (g.polar) {
        var rx = 0;
        var ry = 0;
        var rn = 0;
        var qx = 0;
        var qy = 0;
        var qn = 0;
        atoms.forEach(function (w) {
          if (cloudRich(w)) {
            rx += w.x;
            ry += w.y;
            rn++;
          } else if (w.src.q > 0.05) {
            qx += w.x;
            qy += w.y;
            qn++;
          }
        });
        if (rn && qn) {
          rx /= rn;
          ry /= rn;
          var dx = qx / qn - rx;
          var dy = qy / qn - ry;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > 3) return { x: rx, y: ry, ux: dx / d, uy: dy / d, skew: 1 };
        }
      }
      var td = p.td;
      var tl = Math.sqrt(td.x * td.x + td.y * td.y);
      var ux = tl > 1e-3 ? td.x / tl : Math.cos(p.a);
      var uy = tl > 1e-3 ? td.y / tl : Math.sin(p.a);
      var skew = g.polar ? 0 : clamp(td.amp, 0, 1);
      // elongated molecules (Br₂, octane) keep the cloud on their long axis
      var sxx = 0;
      var syy = 0;
      var sxy = 0;
      atoms.forEach(function (w) {
        sxx += (w.x - cx) * (w.x - cx);
        syy += (w.y - cy) * (w.y - cy);
        sxy += (w.x - cx) * (w.y - cy);
      });
      var spread = sxx + syy;
      if (spread > 1e-6 && Math.sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy) / spread > 0.3) {
        var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
        var dot = Math.cos(th) * ux + Math.sin(th) * uy;
        var sgn = dot < 0 ? -1 : 1;
        ux = Math.cos(th) * sgn;
        uy = Math.sin(th) * sgn;
        skew *= Math.abs(dot);
      }
      return { x: cx, y: cy, ux: ux, uy: uy, skew: skew };
    }

    // Nonpolar clouds stay tucked in until neighbours crowd them
    function padFor(p) {
      var pad = CLOUD_PAD * (g.cloud || 1);
      return g.polar ? pad : pad * (0.55 + 0.45 * p.td.near);
    }

    function updateTempDipoles(dt) {
      var ease = reduced ? 1 : 1 - Math.exp(-dt / 0.45);
      var easeNear = reduced ? 1 : 1 - Math.exp(-dt / 0.6);
      parts.forEach(function (p) {
        var td = p.td;
        if (g.polar) return;
        td.near += ((p.role === 'gas' ? 0 : 1) - td.near) * easeNear;
        var t = clock;
        var wa = p.seed + t * 0.3 + Math.sin(t * 0.7 + p.seed) * 0.8;
        var wAmp = reduced ? 0 : td.near * (0.35 + 0.4 * Math.pow(Math.sin(t * 0.9 + p.seed * 3), 2));
        td.sx += (Math.cos(wa) * wAmp - td.sx) * ease;
        td.sy += (Math.sin(wa) * wAmp - td.sy) * ease;
        var m = Math.sqrt(td.sx * td.sx + td.sy * td.sy);
        td.amp = clamp(m, 0, 1);
        td.x = m ? td.sx / m : 0;
        td.y = m ? td.sy / m : 0;
      });
    }

    // Atoms in model units, rotated, relative to the molecule centre
    function modelAtoms(p) {
      var ca = Math.cos(p.a);
      var sa = Math.sin(p.a);
      return g.atoms.map(function (at) {
        return { src: at, x: at.x * ca - at.y * sa, y: at.x * sa + at.y * ca, r: at.r };
      });
    }

    function mixRgb(from, to, t) {
      if (t <= 0 || from === to) return from;
      var a = from.split(',');
      var b = to.split(',');
      return [0, 1, 2]
        .map(function (i) {
          return Math.round(+a[i] + (+b[i] - +a[i]) * Math.min(t, 1));
        })
        .join(',');
    }

    // Lone-pair molecules (water): soft union of atom and lone-pair lobes, as in imf-engine
    // The outline is fixed in the molecule's own frame (lobes and axis turn together), so it is
    // worked out once per substance and only the wobble is per molecule
    var lobedCache = { g: null, rad: new Float32Array(OUTLINE_N) };

    function drawLobedCloud(p, f, pad) {
      if (lobedCache.g !== g) {
        var f0 = dropFrame({ a: 0, td: p.td }, modelAtoms({ a: 0 }));
        global.ImfEngine.lobedRadii(global.ImfEngine.cloudLobes(g, pad), f0.x, f0.y, f0.ux, f0.uy, OUTLINE_N, lobedCache.rad);
        lobedCache.g = g;
      }
      var ux = f.ux;
      var uy = f.uy;
      var rad = OUTLINE_A;
      rad.set(lobedCache.rad);
      var tau = reduced ? 0 : clock + p.seed * 5;
      var breathe = 1 + 0.04 * Math.sin(tau * 1.4);
      var back = 0;
      var tip = 0;
      for (var i = 0; i < OUTLINE_N; i++) {
        var t = (i / OUTLINE_N) * Math.PI * 2;
        var bulb = (1 - COS_T[i]) / 2;
        var wob = 1 + (0.4 + 0.6 * bulb) * (0.05 * Math.sin(2 * t + tau * 1.7) + 0.035 * Math.sin(3 * t - tau * 2.3));
        rad[i] *= wob * breathe;
        tip = Math.max(tip, rad[i] * COS_T[i]);
        back = Math.max(back, -rad[i] * COS_T[i]);
      }
      var neg = mixRgb(T.neutralRgb, T.negRgb, f.skew);
      var pos = mixRgb(T.neutralRgb, T.posRgb, f.skew);
      var v = view(p);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(v.s, v.s);
      var lg = ctx.createLinearGradient(f.x - ux * back, f.y - uy * back, f.x + ux * tip, f.y + uy * tip);
      lg.addColorStop(0, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.45, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.72, 'rgba(' + pos + ',1)');
      lg.addColorStop(1, 'rgba(' + pos + ',1)');
      ctx.globalCompositeOperation = T.cloudBlend;
      ctx.fillStyle = lg;
      ctx.globalAlpha = (0.7 / CLOUD_LAYERS) * T.cloudAlpha * v.alpha;
      for (var li = 0; li < CLOUD_LAYERS; li++) {
        var sc = 1 - li * (0.7 / CLOUD_LAYERS);
        ctx.beginPath();
        for (var k = 0; k < OUTLINE_N; k++) {
          var dx = ux * COS_T[k] - uy * SIN_T[k];
          var dy = ux * SIN_T[k] + uy * COS_T[k];
          var r = rad[k] * sc;
          if (k === 0) ctx.moveTo(f.x + dx * r, f.y + dy * r);
          else ctx.lineTo(f.x + dx * r, f.y + dy * r);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawCloud(p) {
      var atoms = modelAtoms(p);
      var f = dropFrame(p, atoms);
      var pad = padFor(p);
      if (g.lps.length) {
        drawLobedCloud(p, f, pad);
        return;
      }
      var ux = f.ux;
      var uy = f.uy;
      var sk = f.skew;
      var r0 = 1 - 0.65 * sk;
      var back = 0;
      var tip = 0;
      var reach = 0;
      atoms.forEach(function (w) {
        var a = (w.x - f.x) * ux + (w.y - f.y) * uy;
        back = Math.max(back, w.r - a);
        tip = Math.max(tip, w.r + a);
        reach = Math.max(reach, w.r + Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy));
      });
      back += pad * (0.6 + 0.2 * sk);
      reach += pad * (0.6 + 0.2 * sk);
      tip += pad * (0.6 - 0.35 * sk);
      var half = (back + tip) / 2;
      var mid = (tip - back) / 2;
      var peak = 0;
      for (var k = 1; k < 16; k++) peak = Math.max(peak, dropProfile((k / 16) * Math.PI, r0));
      var wide = reach / peak;
      atoms.forEach(function (w) {
        var a = (w.x - f.x) * ux + (w.y - f.y) * uy;
        var b = Math.abs((w.y - f.y) * ux - (w.x - f.x) * uy);
        var t = Math.acos(clamp((a - mid) / half, -1, 1));
        wide = Math.max(wide, (b + w.r + pad * 0.3) / Math.max(0.3, dropProfile(t, r0)));
      });
      var tau = reduced ? 0 : clock + p.seed * 5;
      var breathe = 1 + 0.04 * Math.sin(tau * 1.4);
      var neg = mixRgb(T.neutralRgb, T.negRgb, sk);
      var pos = mixRgb(T.neutralRgb, T.posRgb, sk);

      var v = view(p);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(v.s, v.s);
      var lg = ctx.createLinearGradient(f.x - ux * back, f.y - uy * back, f.x + ux * tip, f.y + uy * tip);
      lg.addColorStop(0, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.45, 'rgba(' + neg + ',1)');
      lg.addColorStop(0.72, 'rgba(' + pos + ',1)');
      lg.addColorStop(1, 'rgba(' + pos + ',1)');
      ctx.globalCompositeOperation = T.cloudBlend;
      ctx.fillStyle = lg;
      // outline once (unit-layer offsets), then nested layers shrinking toward the rich end:
      // soft edge, densest where electrons crowd
      var olA = OUTLINE_A;
      var olS = OUTLINE_S;
      for (var i = 0; i < OUTLINE_N; i++) {
        var th = (i / OUTLINE_N) * Math.PI * 2;
        var bulb = (1 - COS_T[i]) / 2;
        var wob = 1 + (0.4 + 0.6 * bulb) * (0.06 * Math.sin(2 * th + tau * 1.7) + 0.04 * Math.sin(3 * th - tau * 2.3));
        olA[i] = (mid + half * COS_T[i]) * wob;
        olS[i] = wide * dropProfile(th, r0) * wob * breathe;
      }
      ctx.globalAlpha = (0.7 / CLOUD_LAYERS) * T.cloudAlpha * v.alpha;
      for (var li = 0; li < CLOUD_LAYERS; li++) {
        var sc = 1 - li * (0.7 / CLOUD_LAYERS);
        ctx.beginPath();
        for (var j = 0; j < OUTLINE_N; j++) {
          var al = olA[j] * sc;
          var sd = olS[j] * sc;
          if (j === 0) ctx.moveTo(f.x + ux * al - uy * sd, f.y + uy * al + ux * sd);
          else ctx.lineTo(f.x + ux * al - uy * sd, f.y + uy * al + ux * sd);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    /* Hydrogen bonds between condensed molecules: an H sitting close to a neighbour's O/N/F gets
       a dotted ink bridge (as in the Guide) that fades in and out, so bonds visibly form and break
       as molecules slide. One bond per H. */
    var HB_REACH = 28;   // model units of gap between H and acceptor that still counts (liquid spacing)

    function worldAtom(p, at) {
      var ca = Math.cos(p.a);
      var sa = Math.sin(p.a);
      return { x: p.x + (at.x * ca - at.y * sa) * SCALE, y: p.y + (at.x * sa + at.y * ca) * SCALE };
    }

    function updateHBonds(dt) {
      var live = {};
      if (mol.hBondDonor) {
        var donors = [];
        var accs = [];
        g.atoms.forEach(function (at, ai) {
          if (at.el === 'H' && at.q > 0) donors.push(ai);
          else if (/^(O|N|F)$/.test(at.el)) accs.push(ai);
        });
        var hr = g.atoms[donors[0]].r;
        var accAt = parts.map(function (b) {
          return b.role === 'gas'
            ? null
            : accs.map(function (ai) {
                return worldAtom(b, g.atoms[ai]);
              });
        });
        // coarse grid so each H only checks molecules in nearby buckets
        var gw = cell.w * 2;
        var gh = cell.h * 2;
        var grid = {};
        parts.forEach(function (b, j) {
          if (!accAt[j]) return;
          var key = Math.floor(b.x / gw) + ',' + Math.floor(b.y / gh);
          (grid[key] = grid[key] || []).push(j);
        });
        parts.forEach(function (a, i) {
          if (a.role === 'gas') return;
          var gx = Math.floor(a.x / gw);
          var gy = Math.floor(a.y / gh);
          var near = [];
          for (var ox = -1; ox <= 1; ox++) {
            for (var oy = -1; oy <= 1; oy++) {
              var bucket = grid[gx + ox + ',' + (gy + oy)];
              if (bucket) near.push.apply(near, bucket);
            }
          }
          donors.forEach(function (di) {
            var h = worldAtom(a, g.atoms[di]);
            var best = null;
            var bd = Infinity;
            near.forEach(function (j) {
              var b = parts[j];
              if (j === i) return;
              if (Math.abs(b.x - a.x) > cell.w * 2 || Math.abs(b.y - a.y) > cell.h * 2) return;
              if (Math.abs(b.z - a.z) > 0.75) return;
              accs.forEach(function (ai, ak) {
                var o = accAt[j][ak];
                var d = Math.sqrt((o.x - h.x) * (o.x - h.x) + (o.y - h.y) * (o.y - h.y));
                var reach = (hr + g.atoms[ai].r + HB_REACH) * SCALE;
                // the H must point at the acceptor: closer to it than its own molecule's centre is
                var dc = Math.sqrt((o.x - a.x) * (o.x - a.x) + (o.y - a.y) * (o.y - a.y));
                if (d < reach && d < dc - hr * SCALE * 0.6 && d < bd) {
                  bd = d;
                  best = j + ':' + ai;
                }
              });
            });
            if (best) live[i + ':' + di + '>' + best] = true;
          });
        });
      }
      var kIn = 1 - Math.exp(-dt / 0.35);
      Object.keys(live).forEach(function (k) {
        if (!hbonds[k]) hbonds[k] = 0;
      });
      Object.keys(hbonds).forEach(function (k) {
        hbonds[k] += ((live[k] ? 1 : 0) - hbonds[k]) * kIn;
        if (!live[k] && hbonds[k] < 0.02) delete hbonds[k];
      });
    }

    function viewAtom(p, at) {
      var v = view(p);
      var ca = Math.cos(p.a);
      var sa = Math.sin(p.a);
      return { x: v.x + (at.x * ca - at.y * sa) * v.s, y: v.y + (at.x * sa + at.y * ca) * v.s, k: v.s / SCALE, alpha: v.alpha };
    }

    function drawHBonds() {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.setLineDash([0.5, 3.5]);
      ctx.lineWidth = 2;
      Object.keys(hbonds).forEach(function (k) {
        var m = k.split('>');
        var d = m[0].split(':');
        var e = m[1].split(':');
        var a = parts[+d[0]];
        var b = parts[+e[0]];
        if (!a || !b) return;
        var h = viewAtom(a, g.atoms[+d[1]]);
        var o = viewAtom(b, g.atoms[+e[1]]);
        ctx.lineWidth = 2 * h.k;
        ctx.strokeStyle = 'rgba(' + T.pullRgb + ',' + 0.85 * hbonds[k] * h.alpha + ')';
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(o.x, o.y);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawAtoms(p) {
      var atoms = modelAtoms(p).sort(function (m, n) {
        return (m.src.z || 0) - (n.src.z || 0);
      });
      var v = view(p);
      atoms.forEach(function (w) {
        var x = v.x + w.x * v.s;
        var y = v.y + w.y * v.s;
        var r = w.r * v.s;
        var c = T.el[w.src.el] || T.el.C;
        var sg = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.06, x, y, r);
        sg.addColorStop(0, c[0]);
        sg.addColorStop(0.7, c[1]);
        sg.addColorStop(1, T.rim);
        ctx.globalAlpha = ((w.src.z || 0) < 0 ? T.behindAlpha : 1) * v.alpha;
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /* Hot plate: a slab in the jar's perspective. Its top face recedes toward the vanishing
       point (mostly hidden under the jar, showing at the sides), with a darker front face.
       Heating: the plate glows hot red-orange (an element colour, kept clear of the δ+ red) with
       ink shimmer rising beside the jar. Cooling: ice-blue frost on the front face. */
    var GLOW_RGB = '255,86,34';
    function drawPlate() {
      var vx = (jar.x0 + jar.x1) / 2;
      var vy = (jar.y0 + jar.y1) / 2;
      var pb = PERSP_BACK;
      var over = 18;
      var fy = jar.y1 + 8;
      var lx = jar.x0 - over;
      var rx = jar.x1 + over;
      var thick = 18;
      function back(x, y) {
        return { x: vx + (x - vx) * pb, y: vy + (y - vy) * pb };
      }
      var bl = back(lx, fy);
      var br = back(rx, fy);

      // shadow on the bench
      var sh = ctx.createRadialGradient(vx, fy + thick, 0, vx, fy + thick, (rx - lx) * 0.55);
      sh.addColorStop(0, 'rgba(29,36,51,0.16)');
      sh.addColorStop(1, 'rgba(29,36,51,0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.ellipse(vx, fy + thick + 3, (rx - lx) * 0.55, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // top face
      var top = ctx.createLinearGradient(0, fy, 0, bl.y);
      top.addColorStop(0, '#4a5366');
      top.addColorStop(1, '#2a3140');
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(lx, fy);
      ctx.lineTo(rx, fy);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
      ctx.fill();
      if (power < -0.01) {
        ctx.fillStyle = 'rgba(150,200,240,' + (0.35 * -power).toFixed(3) + ')';
        ctx.fill();
      } else if (power > 0.01) {
        ctx.fillStyle = 'rgba(' + GLOW_RGB + ',' + (0.75 * power).toFixed(3) + ')';
        ctx.fill();
      }

      // front face, with a rounded lower edge and a pale top lip
      var front = ctx.createLinearGradient(0, fy, 0, fy + thick);
      front.addColorStop(0, '#1d2433');
      front.addColorStop(1, '#11151f');
      ctx.fillStyle = front;
      ctx.beginPath();
      ctx.moveTo(lx, fy);
      ctx.lineTo(rx, fy);
      ctx.lineTo(rx, fy + thick - 6);
      ctx.quadraticCurveTo(rx, fy + thick, rx - 6, fy + thick);
      ctx.lineTo(lx + 6, fy + thick);
      ctx.quadraticCurveTo(lx, fy + thick, lx, fy + thick - 6);
      ctx.closePath();
      ctx.fill();
      if (power > 0.01) {
        // glow brightest along the top edge, fading down the front, with a halo around the slab
        var hot = ctx.createLinearGradient(0, fy, 0, fy + thick);
        hot.addColorStop(0, 'rgba(' + GLOW_RGB + ',' + (0.85 * power).toFixed(3) + ')');
        hot.addColorStop(1, 'rgba(' + GLOW_RGB + ',' + (0.25 * power).toFixed(3) + ')');
        ctx.save();
        ctx.shadowColor = 'rgba(' + GLOW_RGB + ',' + (0.8 * power).toFixed(3) + ')';
        ctx.shadowBlur = 22 * power;
        ctx.fillStyle = hot;
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx + 2, fy + 0.5);
      ctx.lineTo(rx - 2, fy + 0.5);
      ctx.stroke();

      // control knob: its pointer turns with the setting
      var kx = rx - 24;
      var ky = fy + thick / 2;
      ctx.fillStyle = '#e6eaf1';
      ctx.beginPath();
      ctx.arc(kx, ky, 6, 0, Math.PI * 2);
      ctx.fill();
      var ka = -Math.PI / 2 + power * 2.2;
      ctx.strokeStyle = '#1d2433';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.lineTo(kx + Math.cos(ka) * 5, ky + Math.sin(ka) * 5);
      ctx.stroke();

      if (power > 0.01) {
        // shimmer rising off the exposed plate on each side of the jar
        ctx.strokeStyle = 'rgba(29,36,51,' + (0.2 + 0.45 * power).toFixed(3) + ')';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        [lx + 6, lx + 14, rx - 14, rx - 6].forEach(function (x, i) {
          ctx.beginPath();
          for (var k = 0; k <= 10; k++) {
            var yy = fy - 2 - k * 3 * (0.6 + power);
            var xx = x + Math.sin(k * 0.9 - clock * 8 + i * 1.7) * 2.5;
            if (k === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        });
      } else if (power < -0.01) {
        // frost crystals across the front face
        ctx.strokeStyle = 'rgba(150,205,245,' + (0.4 + 0.55 * -power).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        var m = 7;
        for (var f = 0; f < m; f++) {
          var cxs = lx + 24 + (f * (rx - lx - 70)) / (m - 1);
          var cys = fy + thick / 2;
          var fr = 3 + 2.5 * -power;
          for (var sgi = 0; sgi < 3; sgi++) {
            var t = (sgi * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(cxs - Math.cos(t) * fr, cys - Math.sin(t) * fr);
            ctx.lineTo(cxs + Math.cos(t) * fr, cys + Math.sin(t) * fr);
            ctx.stroke();
          }
        }
      }
    }

    // Inside of the jar receding to a smaller back wall: floor, ceiling and sides shade darker
    // toward the back, as in the equilibrium vessel
    function drawInterior() {
      var vx = (jar.x0 + jar.x1) / 2;
      var vy = (jar.y0 + jar.y1) / 2;
      var pb = PERSP_BACK;
      var bx0 = vx + (jar.x0 - vx) * pb;
      var bx1 = vx + (jar.x1 - vx) * pb;
      var by0 = vy + (jar.y0 - vy) * pb;
      var by1 = vy + (jar.y1 - vy) * pb;
      function quad(pts, y0, y1, x0, x1, a0, a1) {
        var gr = ctx.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, 'rgba(29,36,51,' + a0 + ')');
        gr.addColorStop(1, 'rgba(29,36,51,' + a1 + ')');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.closePath();
        ctx.fill();
      }
      quad([jar.x0, jar.y1, jar.x1, jar.y1, bx1, by1, bx0, by1], jar.y1, by1, 0, 0, 0.03, 0.11);
      quad([jar.x0, jar.y0, jar.x1, jar.y0, bx1, by0, bx0, by0], jar.y0, by0, 0, 0, 0.01, 0.05);
      quad([jar.x0, jar.y0, bx0, by0, bx0, by1, jar.x0, jar.y1], 0, 0, jar.x0, bx0, 0.01, 0.06);
      quad([jar.x1, jar.y0, bx1, by0, bx1, by1, jar.x1, jar.y1], 0, 0, jar.x1, bx1, 0.01, 0.06);
      roundRect(bx0, by0, bx1 - bx0, by1 - by0, 18 * pb);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(29,36,51,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // receding edges, from just inside the front's rounded corners
      var c = 18 * 0.3;
      ctx.beginPath();
      ctx.moveTo(jar.x0 + c, jar.y0 + c);
      ctx.lineTo(bx0 + c * pb, by0 + c * pb);
      ctx.moveTo(jar.x1 - c, jar.y0 + c);
      ctx.lineTo(bx1 - c * pb, by0 + c * pb);
      ctx.moveTo(jar.x0 + c, jar.y1 - c);
      ctx.lineTo(bx0 + c * pb, by1 - c * pb);
      ctx.moveTo(jar.x1 - c, jar.y1 - c);
      ctx.lineTo(bx1 - c * pb, by1 - c * pb);
      ctx.strokeStyle = 'rgba(29,36,51,0.14)';
      ctx.stroke();
    }

    // Soft contact shadows on the floor beneath each molecule, fainter the higher it floats
    function drawShadows(order) {
      var vx = (jar.x0 + jar.x1) / 2;
      var vy = (jar.y0 + jar.y1) / 2;
      var jh = jar.y1 - jar.y0;
      ctx.save();
      order.forEach(function (p) {
        var k = persp(p.z);
        var fx = vx + (p.x - vx) * k;
        var fy = vy + (jar.y1 - 4 - vy) * k;
        var lift = clamp((jar.y1 - p.y) / jh, 0, 1);
        var r = cell.r * k * (1 + 0.5 * lift);
        ctx.fillStyle = 'rgba(29,36,51,' + (0.09 * (1 - 0.9 * lift)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(fx, fy, r, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (T.paintBg) T.paintBg(ctx, W, H);
      else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      }
      drawPlate();

      var jw = jar.x1 - jar.x0;
      var jh = jar.y1 - jar.y0;
      ctx.fillStyle = 'rgba(244,246,250,0.96)';
      roundRect(jar.x0, jar.y0, jw, jh, 18);
      ctx.fill();

      ctx.save();
      roundRect(jar.x0, jar.y0, jw, jh, 18);
      ctx.clip();
      drawInterior();
      // back to front; within that, every cloud before any atom so clouds never veil atoms
      var order = parts.slice().sort(function (m, n) {
        return m.z - n.z;
      });
      drawShadows(order);
      order.forEach(drawCloud);
      drawHBonds();
      order.forEach(drawAtoms);
      ctx.restore();

      // front glass: outline and a soft highlight
      ctx.strokeStyle = '#1d2433';
      ctx.lineWidth = 2.5;
      roundRect(jar.x0, jar.y0, jw, jh, 18);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(jar.x0 + 10, jar.y0 + 16, 7, jh * 0.55, 3.5);
      ctx.fill();
    }

    /* ---------- loop ---------- */

    var lastPhase = '';
    var emitClock = 0;

    function emit() {
      if (!onUpdate) return;
      var phase = phaseOf(state, mol.heat);
      onUpdate({
        id: mol.id,
        T: state.T,
        pressure: model.pressure(state),
        phase: phase,
        vapour: state.x,
        melt: state.melt,
        phaseChanged: phase !== lastPhase,
        power: power,
        time: clock,
      });
      lastPhase = phase;
    }

    function step(dt) {
      clock += dt;
      E = model.clampE(E + power * POWER * dt);
      state = model.stateAt(E);
      swapBudget = Math.min(swapBudget + dt * SWAPS_PER_S, 3);
      while (swapBudget >= 1) {
        swapBudget -= 1;
        if (!swapOne()) {
          swapBudget = 0;
          break;
        }
      }
      exchange(dt);
      stepParticles(dt);
      updateTempDipoles(dt);
      updateHBonds(dt);
      emitClock += dt;
      if (emitClock >= 0.1) {
        emitClock = 0;
        emit();
      }
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      step(dt);
      draw();
      global.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      global.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
    }

    resize();
    if (global.ResizeObserver) new global.ResizeObserver(resize).observe(canvas);
    else global.addEventListener('resize', resize);
    setSubstance(opts.substance || 'h2o');

    return {
      setSubstance: setSubstance,
      reset: reset,
      setPower: function (v) {
        power = clamp(+v || 0, -1, 1);
      },
      start: start,
      stop: stop,
      getState: function () {
        return { T: state.T, pressure: model.pressure(state), phase: phaseOf(state, mol.heat) };
      },
    };
  }

  global.ImfHeat = { create: create, T_MIN: T_MIN, T_MAX: T_MAX, T_ROOM: T_ROOM };
})(window);
