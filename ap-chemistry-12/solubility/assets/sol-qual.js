/* SolQual: the Pb²⁺ / Sr²⁺ / Mg²⁺ experiment on the real engine. Used by Guide Part 4 (the Qual Lab page was removed 2026-11-24).

   const run = SolQual.start(['Pb2+', 'Mg2+']);   // 10 mL, 0.050 M of each ion present
   const r = SolQual.add(run, 0);                  // step 0: add KI → { checks, solids, colour, words }
   SolQual.filter(run);                            // filter: the solid stays on the paper, the filtrate goes on
   Needs SolData and SolEngine. */
(function (global) {
  'use strict';
  const D = global.SolData, E = global.SolEngine, Q = D.QUAL;
  const V = 0.010;                       // a 10 mL test tube
  const VISIBLE_MG = 0.05;               // less than this in a test tube is too little to see
  const SOURCE = { 'Pb2+': 'PbNO32', 'Sr2+': 'SrNO32', 'Mg2+': 'MgNO32' };
  // which solids each step's check shows (the target, plus the other solid that reagent could make)
  const CHECKS = [['PbI2'], ['SrSO4', 'PbSO4'], ['MgOH2']];

  function start(ions, conc) {
    const b = E.createBeaker({ volume: V });
    ions.forEach(k => b.addReagent(SOURCE[k], (conc || Q.startConc) * V));
    return { ions: ions.slice(), beaker: b, step: -1, history: [] };
  }
  // Add a step's reagent. Q is read the moment it goes in (before anything forms), then the tube settles.
  function add(run, i) {
    const st = Q.steps[i], b = run.beaker;
    b.addReagent(st.reagent, st.excess * V);
    const before = b.state();
    const checks = CHECKS[i].map(id => {
      const s = before.salts[id];
      return { id, q: s ? s.Q : 0, ksp: s ? s.ksp : D.SALTS[id].ksp };
    });
    b.settle();
    const solids = {};
    for (const id in b.solid) {
      const mg = b.solid[id] * D.SALTS[id].molarMass * 1000;
      if (mg >= VISIBLE_MG) solids[id] = mg;
    }
    const ids = Object.keys(solids);
    const colourName = ids.length ? D.SALTS[ids[0]].colourName : null;
    const words = ids.length ? 'A ' + colourName + ' solid forms.' : 'It stays clear.';
    const res = { step: i, reagent: st.reagent, checks, solids, colourName, colour: ids.length ? D.SALTS[ids[0]].colour : null, words, target: st.target };
    run.step = i; run.history.push(res);
    return res;
  }
  // Filter: the solid stays on the filter paper, the filtrate becomes the new tube
  function filter(run) {
    const r = run.beaker.decant();
    run.beaker = r.solution;
    return r.solids;
  }
  // All the unknowns: none, each ion alone, each pair, all three
  function allUnknowns() {
    const out = [];
    for (let m = 0; m < 8; m++) out.push(Q.ions.filter((k, i) => (m >> i) & 1));
    return out;
  }
  global.SolQual = { V, VISIBLE_MG, SOURCE, CHECKS, start, add, filter, allUnknowns, steps: Q.steps, ions: Q.ions };
})(typeof window !== 'undefined' ? window : globalThis);
