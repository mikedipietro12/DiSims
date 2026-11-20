/* Solubility & Ksp: dissolving engine (SolEngine), shared by the Guide stage, the Sandbox and
   the Qual Lab test tube. Needs SolData (salts.js).

   How it works
   - A beaker holds total moles of each ion (dissolved + locked in solids) and moles of each solid.
   - An exact solver finds equilibrium for every possible solid at once: each solid either has
     Q = Ksp, or is absent with Q ≤ Ksp. Common ions, acid and mixing all fall out of this.
   - The live state eases toward that equilibrium (seconds, not minutes), so dissolving shows
     Q rising to Ksp and precipitating shows Q falling to Ksp. Numbers are always real.
   - The particle window gets separate dissolve / re-form event rates that stay equal at
     saturation, so ions keep leaving and rejoining the crystal (principle 1: it never stops).

   Textbook conventions (match what students calculate)
   - Ksp uses concentrations; no activity corrections.
   - Carbonate and hydroxide don't react with water on their own (no hydrolysis), so CaCO₃ in
     pure water has s = √Ksp. Only added strong acid (HNO₃) protonates them, using the booklet's
     Ka values for H₂CO₃ / HCO₃⁻ and Kw for OH⁻. */
(function (global) {
  'use strict';
  const D = global.SolData || (typeof require !== 'undefined' ? require('./salts.js') : null);
  if (!D) throw new Error('SolEngine needs SolData (salts.js) loaded first');

  const T25 = 298.15;
  const CFG = {
    tauDissolve: 0.9,   // s: how fast the numbers ease toward equilibrium while dissolving
    tauPrecip: 0.5,     // s: precipitating is quicker (a cloud forms on mixing)
    eventRate: 2.2,     // dissolve (= re-form) events per second at saturation, full crystal
    settledTol: 2e-4,   // gap to equilibrium (fraction of the most solid there could be) that counts as
                        // settled; below this the state snaps to the exact answer (invisible at 3 sig figs)
    eqTol: 0.02         // |Q/Ksp − 1| below this reads as "Q = Ksp"
  };

  const ionOf = k => D.ION[k];

  // ---------- Speciation: free [OH⁻], [CO₃²⁻], [H⁺] from totals (mol/L) ----------
  // ohDiss: hydroxide in solution (from solids and NaOH); co3Diss: carbonate in solution;
  // hAdd: strong acid added. Acid neutralises OH⁻ first, then protonates CO₃²⁻.
  function speciate(ohDiss, co3Diss, hAdd) {
    const Kw = D.KA.Kw, Ka1 = D.KA.H2CO3, Ka2 = D.KA.HCO3;
    const B = ohDiss - hAdd; // net base
    if (B >= 0 || co3Diss <= 0) {
      const r = Math.sqrt(B * B + 4 * Kw);
      const oh = B >= 0 ? (B + r) / 2 : (2 * Kw) / (r - B); // stable form when acid is in excess
      const h = Kw / oh;
      const pH = (ohDiss > 0 || hAdd > 0) ? -Math.log10(h) : null;
      // with no excess acid, carbonate stays as CO₃²⁻ (textbook convention)
      return { oh, h, co3: co3Diss, pH };
    }
    // excess acid A protonates carbonate: A = h + C·(h/Ka2 + 2h²/(Ka1Ka2)) / (1 + h/Ka2 + h²/(Ka1Ka2))
    const A = -B, C = co3Diss;
    const protonsHeld = h => {
      const x = h / Ka2, y = (h * h) / (Ka1 * Ka2), den = 1 + x + y;
      return h + C * (x + 2 * y) / den;
    };
    let lo = -20, hi = Math.log10(A) + 0.01; // bisection on log10(h)
    for (let i = 0; i < 90; i++) {
      const mid = (lo + hi) / 2;
      if (protonsHeld(Math.pow(10, mid)) > A) hi = mid; else lo = mid;
    }
    const h = Math.pow(10, (lo + hi) / 2);
    const den = 1 + h / Ka2 + (h * h) / (Ka1 * Ka2);
    return { oh: Kw / h, h, co3: C / den, pH: -Math.log10(h) };
  }

  // ---------- Beaker ----------
  function createBeaker(opts) {
    opts = opts || {};
    const b = {
      V: opts.volume || 0.100,      // L
      T: opts.T || T25,             // K
      tot: {},                      // ion key → total mol (dissolved + in solids)
      solid: {},                    // salt id → mol of solid present now
      solidAdded: {},               // salt id → mol of that solid ever scooped in
      fromReagent: {},              // ion key → mol added by soluble reagents (common ions, acid)
      target: null,                 // equilibrium solids (cached until something changes)
      scale: {},                    // salt id → most of that solid that could exist (for tolerances)
      t: 0
    };

    function candidates() {
      // every booklet salt whose two ions are both in the beaker
      const out = [];
      for (const id in D.SALTS) {
        const s = D.SALTS[id];
        if ((b.tot[s.cat[0]] || 0) > 0 && (b.tot[s.an[0]] || 0) > 0) out.push(id);
      }
      return out;
    }
    function ksp(id) {
      const s = D.SALTS[id];
      if (b.T === T25 || !s.dHsoln) return s.ksp;
      return D.kspAt(s, b.T);
    }

    // moles of each ion locked in a set of solids
    function heldBy(solids) {
      const held = {};
      for (const id in solids) {
        const s = D.SALTS[id], n = solids[id];
        if (!n) continue;
        held[s.cat[0]] = (held[s.cat[0]] || 0) + s.cat[1] * n;
        held[s.an[0]] = (held[s.an[0]] || 0) + s.an[1] * n;
      }
      return held;
    }
    // free concentrations (mol/L) given a set of solid amounts
    function freeConc(solids) {
      const held = heldBy(solids);
      const c = {};
      for (const k in b.tot) c[k] = Math.max(0, (b.tot[k] - (held[k] || 0)) / b.V);
      const sp = speciate(c['OH-'] || 0, c['CO3^2-'] || 0, c['H+'] || 0);
      if ('OH-' in c || 'H+' in c) c['OH-'] = sp.oh;
      if ('CO3^2-' in c) c['CO3^2-'] = sp.co3;
      if ('H+' in c || 'OH-' in c) c['H+'] = sp.h;
      c._pH = sp.pH;
      return c;
    }
    function Q(id, c) {
      const s = D.SALTS[id];
      return Math.pow(c[s.cat[0]] || 0, s.cat[1]) * Math.pow(c[s.an[0]] || 0, s.an[1]);
    }

    // Exact equilibrium: Gauss-Seidel over solids, bisection on each solid's amount
    function solveEquilibrium() {
      const ids = candidates();
      const S = {};
      ids.forEach(id => { S[id] = b.solid[id] || 0; });
      for (let sweep = 0; sweep < 60; sweep++) {
        let change = 0;
        for (const id of ids) {
          const s = D.SALTS[id];
          const others = Object.assign({}, S); others[id] = 0;
          // most of this solid that could exist, given what the other solids hold (raw moles)
          const h0 = heldBy(others);
          const sMax = Math.max(0, Math.min(((b.tot[s.cat[0]] || 0) - (h0[s.cat[0]] || 0)) / s.cat[1],
                                            ((b.tot[s.an[0]] || 0) - (h0[s.an[0]] || 0)) / s.an[1]));
          b.scale[id] = Math.max(sMax, 1e-30);
          const K = ksp(id);
          const f = n => { const t = Object.assign({}, others); t[id] = n; return Q(id, freeConc(t)) - K; };
          let n;
          if (sMax <= 0 || f(0) <= 0) n = 0;
          else {
            let lo = 0, hi = sMax;
            for (let i = 0; i < 200 && hi - lo > 1e-19; i++) {
              const mid = (lo + hi) / 2;
              if (f(mid) > 0) lo = mid; else hi = mid;
            }
            n = (lo + hi) / 2;
          }
          change = Math.max(change, Math.abs(n - S[id]) / Math.max(1e-30, n, S[id]));
          S[id] = n;
        }
        if (change < 1e-12) break;
      }
      return S;
    }
    function invalidate() { b.target = null; }
    function target() { if (!b.target) b.target = solveEquilibrium(); return b.target; }

    // ---------- Actions ----------
    function addIons(pairs, mol) {
      pairs.forEach(([k, n]) => { b.tot[k] = (b.tot[k] || 0) + n * mol; });
    }
    b.addSolid = function (id, mol) {
      const s = D.SALTS[id];
      addIons([s.cat, s.an], mol);
      b.solid[id] = (b.solid[id] || 0) + mol;
      b.solidAdded[id] = (b.solidAdded[id] || 0) + mol;
      invalidate();
    };
    b.addReagent = function (key, mol) {
      addIons(D.REAGENTS[key].ions, mol);
      D.REAGENTS[key].ions.forEach(([k, n]) => { b.fromReagent[k] = (b.fromReagent[k] || 0) + n * mol; });
      invalidate();
    };
    b.setTemperature = function (T) { b.T = T; invalidate(); };
    b.reset = function () {
      b.tot = {}; b.solid = {}; b.solidAdded = {}; b.fromReagent = {}; b.scale = {}; b.t = 0; invalidate();
    };

    // ease the solids toward equilibrium
    b.step = function (dt) {
      const S = target();
      for (const id in S) {
        const cur = b.solid[id] || 0, goal = S[id];
        const tau = goal > cur ? CFG.tauPrecip : CFG.tauDissolve;
        let next = cur + (goal - cur) * (1 - Math.exp(-dt / tau));
        // snap to the exact answer once the gap is too small to see or read
        if (Math.abs(next - goal) <= CFG.settledTol * Math.max(goal, b.scale[id] || 0, 1e-30)) next = goal;
        b.solid[id] = next;
      }
      for (const id in b.solid) if (!(id in S)) b.solid[id] = 0;
      b.t += dt;
    };
    // jump straight to equilibrium (Guide presets, "tap to settle")
    b.settle = function () {
      const S = target();
      b.solid = Object.assign({}, S);
    };
    b.isSettled = function () {
      const S = target();
      for (const id in S) {
        const cur = b.solid[id] || 0, goal = S[id];
        if (cur !== goal) return false;
      }
      return true;
    };

    // Qual Lab: centrifuge and pour off. Returns a new beaker with only the solution;
    // the solids stay behind (returned so the UI can show them).
    b.decant = function () {
      const nb = createBeaker({ volume: b.V, T: b.T });
      const c = freeConc(b.solid);
      // carry totals of dissolved ions (speciated forms count toward their parent ion)
      const held = {};
      for (const id in b.solid) {
        const s = D.SALTS[id], n = b.solid[id] || 0;
        held[s.cat[0]] = (held[s.cat[0]] || 0) + s.cat[1] * n;
        held[s.an[0]] = (held[s.an[0]] || 0) + s.an[1] * n;
      }
      for (const k in b.tot) nb.tot[k] = Math.max(0, b.tot[k] - (held[k] || 0));
      for (const k in b.fromReagent) nb.fromReagent[k] = Math.min(b.fromReagent[k], nb.tot[k] || 0);
      void c;
      const left = {};
      for (const id in b.solid) if (b.solid[id] > 0) left[id] = b.solid[id];
      return { solution: nb, solids: left };
    };

    // ---------- Reading the state ----------
    b.state = function () {
      const c = freeConc(b.solid);
      const out = { V: b.V, T: b.T, pH: c._pH, ions: {}, salts: {} };
      for (const k in c) if (k[0] !== '_') out.ions[k] = c[k];
      const ids = new Set(candidates().concat(Object.keys(b.solidAdded)));
      ids.forEach(id => {
        const s = D.SALTS[id], K = ksp(id), q = Q(id, c);
        const r = q / K;
        const added = b.solidAdded[id] || 0, now = b.solid[id] || 0;
        // Molar solubility: count the ion that only comes from this salt (so a common ion
        // doesn't inflate it); fall back to scooped minus left when both ions were added.
        const held = heldBy(b.solid);
        const diss = k => Math.max(0, (b.tot[k] || 0) - (held[k] || 0));
        let dissolvedMol;
        if (!(b.fromReagent[s.cat[0]] > 0)) dissolvedMol = diss(s.cat[0]) / s.cat[1];
        else if (!(b.fromReagent[s.an[0]] > 0)) dissolvedMol = diss(s.an[0]) / s.an[1];
        else dissolvedMol = Math.max(0, added - now);
        out.salts[id] = {
          ksp: K, Q: q, ratio: r,
          relation: Math.abs(r - 1) < CFG.eqTol ? '=' : r < 1 ? '<' : '>',
          addedMol: added, addedG: added * s.molarMass,   // all the solid ever scooped in
          solidMol: now, solidG: now * s.molarMass,
          dissolvedMol, dissolvedG: dissolvedMol * s.molarMass,
          s: dissolvedMol / b.V,                      // mol/L dissolved from the scooped solid
          sGL: dissolvedMol * s.molarMass / b.V,      // g/L
          saturated: now > 0 && Math.abs(r - 1) < CFG.eqTol
        };
      });
      out.settled = b.isSettled();
      return out;
    };

    // Particle window: dissolve and re-form events per second for one solid.
    // Equal at saturation; dissolving wins below Ksp, re-forming wins above it.
    b.eventRates = function (id) {
      const st = b.state().salts[id];
      if (!st) return { dissolve: 0, reform: 0 };
      const ref = Math.max(b.solidAdded[id] || 0, st.solidMol, 1e-30);
      const g = st.solidMol > 0 ? 0.35 + 0.65 * Math.pow(st.solidMol / ref, 2 / 3) : 0;
      const dissolve = CFG.eventRate * g;
      const reform = st.solidMol > 0
        ? CFG.eventRate * g * Math.min(st.ratio, 4)
        : (st.ratio > 1 ? CFG.eventRate * Math.min(st.ratio - 1, 4) : 0); // a new solid appears
      return { dissolve, reform };
    };

    // Representative particle counts: refSalt saturated in pure water shows `base` formula
    // units, with exact ion ratios; everything else is on the same scale, capped at `max`.
    b.particleCounts = function (refSalt, base, max) {
      const s = D.SALTS[refSalt], c = freeConc(b.solid);
      const sRef = D.molarSolubility(s); // 25 °C, pure water
      const out = {};
      for (const k in c) {
        if (k[0] === '_' || k === 'H+' && !(b.tot['H+'] > 0)) continue;
        const n = (c[k] / sRef) * base;
        out[k] = { count: Math.min(max, Math.round(n)), capped: n > max + 0.5, exact: n };
      }
      return out;
    };

    // Plain-text summary for a live region (no narration beyond the facts)
    b.summary = function (id) {
      const st = b.state().salts[id];
      if (!st) return '';
      const s = D.SALTS[id];
      const rel = st.relation === '<' ? 'Q is less than Ksp' : st.relation === '=' ? 'Q equals Ksp' : 'Q is greater than Ksp';
      const solid = st.solidMol > 0 ? `Some ${s.colourName} solid is at the bottom.` : 'No solid is at the bottom.';
      return `${s.name}: ${rel}. ${solid}`;
    };

    return b;
  }

  // ---------- Mixing two (or more) solutions ----------
  // parts: [{ reagent: 'AgNO3', conc: 0.010 (mol/L), vol: 0.050 (L) }, ...]
  function mix(parts, opts) {
    const V = parts.reduce((a, p) => a + p.vol, 0);
    const b = createBeaker(Object.assign({ volume: V }, opts || {}));
    parts.forEach(p => b.addReagent(p.reagent, p.conc * p.vol));
    return b;
  }

  // Exact molar solubility (mol/L) of a salt, optionally with a common ion and/or acid already
  // in the water. extra: { KI: 0.10, HNO3: 0.01 } in mol/L. Used by Guide worked examples.
  function solubility(id, extra, T) {
    const b = createBeaker({ volume: 1, T: T || T25 });
    for (const k in (extra || {})) b.addReagent(k, extra[k]);
    const s0 = D.molarSolubility(D.SALTS[id]);
    b.addSolid(id, Math.max(1, s0 * 1e4)); // plenty of solid
    b.settle();
    return b.state().salts[id].s;
  }

  // A sensible scoop: half of what saturates the beaker in pure water at 25 °C,
  // so two scoops saturate and the third leaves solid behind.
  function scoopMol(id, volume) {
    return 0.5 * D.molarSolubility(D.SALTS[id]) * (volume || 0.100);
  }

  const SolEngine = { createBeaker, mix, solubility, scoopMol, speciate, CFG };
  global.SolEngine = SolEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = SolEngine;
})(typeof window !== 'undefined' ? window : globalThis);
