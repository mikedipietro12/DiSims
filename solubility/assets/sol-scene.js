/* SolScene: one beaker on the real engine, drawn as a 3D beaker plus a zoomed particle window.
   Shared by the Guide stage, the Sandbox and the dev harness.

   The particles live in a fixed window frame (centre 0,0, radius 225) and are drawn into whatever
   circle the page asks for, so the same scene can be big on a projector or small beside a second beaker.

   const sc = SolScene.create({ salt: 'PbI2', volume: 0.100 });
   sc.scoop(); sc.addReagent('KI', mol); sc.acid(); sc.settle(); sc.warm(10);
   per frame: sc.step(dt); sc.draw(g, { beaker: {x,y,w,h}, win: {x,y,r} });
   sc.marks = new Set(['cat', 'an', 'solid']); sc.legend = ['[Pb²⁺] = x', '[I⁻] = 2x'];  */
(function (global) {
  'use strict';
  const D = global.SolData, E = global.SolEngine, Draw = global.SolDraw;
  const WR = 225;                         // window radius in the particle frame
  const R = 17;                           // front ion radius
  const FLOOR = WR * 0.84;                // the beaker floor in the window; the solid stacks up from here
  const DEPTH = R * 2.3;                  // how much higher the back of the water sits
  const ACID_HOLD = 6;                    // how long the acid close-up holds once its events end
  const ACID_MEETS = 8;                   // H⁺ meetings shown per dose; any further ions the acid removes fade out of view
  const ACID_WAIT = 2.2;                  // the chemistry waits this long after acid lands, so H⁺ is seen arriving before anything dissolves
  const INK = '#1d2433', DIM = '#5b6474', ACCENT = '#4152d9';

  function rand(a, b) { return a + Math.random() * (b - a); }
  function info(k) {
    const sym = D.ION[k].sym.replace(/[⁺⁻²³]+$/, '');
    return { sym, q: D.ION[k].sym.slice(sym.length).replace('⁺', '+').replace('⁻', '−').replace('²', '2'), z: D.ION[k].z,
      role: k === 'H+' ? 'acid' : k === 'OH-' ? 'base' : null };
  }
  let css = null;
  function tok(n) { if (!css) css = getComputedStyle(document.documentElement); return css.getPropertyValue(n).trim(); }

  function create(opts) {
    opts = opts || {};
    let V = opts.volume || 0.100;
    const win = { x: 0, y: 0, r: WR };
    const sc = {
      saltId: opts.salt || 'PbI2', beaker: null, sprites: [],
      marks: new Set(), legend: null, caption: true, maxIons: opts.maxIons || 28,
      showIons: opts.showIons || [],     // other dissolved ions to show (e.g. Sr²⁺ and Mg²⁺ beside PbI₂ in the qual tube)
      base: opts.base || 6,              // particles for a pure-water saturated solution's cation (fewer: the rise as more dissolves shows)
      minOwn: opts.minOwn || 0,          // never fewer than this many of the salt's own ions while any are dissolved
      dropper: !!opts.dropper,
      tank: !!opts.tank,
      maxLayers: opts.maxLayers || 7,    // most layers the solid builds to (the tank's beaker is much taller than a layer)                 // drawn as one big beaker of particles (draw({ tank })), so the camera holds still           // a reagent goes in from a dropper over the beaker, and counts once its drops land
      chemRate: 1                         // < 1 slows the chemistry (not the particles) so a change can be watched
    };
    let slab = { surface: [], edge: [], topAt: () => FLOOR - R, top: FLOOR };
    let layersShown = 0, acidT = 99, meets = 0, fizzT = 99, hco3s = 0;
    // acid story order (user, 2026-11-20: "Ca coming off before I even see any H⁺"): H⁺ falls in while the chemistry waits;
    // a cation leaves the crystal only where H⁺ has taken an anion out of it, until the meetings are done
    let chemWait = 0, release = 0, releaseX = null, trickle = 0;
    let surfFizz = -1, fizzAt = [];   // small CO₂ bubbles off the crystal face, from the first surface meeting (CaCO₃ only)
    // reagents: a dropper's drops land DROP_LAND s after the press; then the new ions fall in from the top of the window
    const DROP_LAND = 0.75, DROP_END = 1.7, RAIN_RATE = 14, RAIN_MAX = 6;
    let pending = [], dropT = 99, dropLabel = '', rain = {};
    const cam = { k: 1, fx: 0, fy: 0 };

    sc.reset = function (T) {
      sc.beaker = E.createBeaker({ volume: V, T: T || 298.15 });
      sc.sprites = []; layersShown = 0; acidT = 99; cam.k = 1; pending = []; dropT = 99; rain = {}; fizzT = 99; chemWait = 0; release = 0; releaseX = null; surfFizz = -1; fizzAt = [];
    };
    sc.setSalt = function (id) { sc.saltId = id; sc.reset(); };
    // use a beaker made elsewhere, e.g. SolEngine.mix() of two solutions
    sc.loadBeaker = function (b) { sc.beaker = b; V = b.V; sc.sprites = []; layersShown = 0; acidT = 99; cam.k = 1; };
    sc.salt = () => D.SALTS[sc.saltId];
    sc.scoopMol = () => E.scoopMol(sc.saltId, V);
    sc.scoop = function (n) { sc.beaker.addSolid(sc.saltId, sc.scoopMol() * (n == null ? 1 : n)); };
    sc.addReagent = function (k, mol) {
      if (sc.dropper) { pending.push({ k, mol }); dropT = 0; dropLabel = D.REAGENTS[k].formula; return; }
      pour(k, mol);
    };
    function pour(k, mol) {
      sc.beaker.addReagent(k, mol);
      // its ions come in from the top of the window, not out of the solid (user, 2026-11-20); H⁺ keeps the acid close-up
      D.REAGENTS[k].ions.forEach(([i]) => { rain[i] = { t: RAIN_MAX, acc: 0 }; }); // H⁺ too: it falls in, then goes to meet OH⁻ / CO₃²⁻
    }
    const land = p => p.acid ? acidNow(p.mol, p.k) : pour(p.k, p.mol);
    // mol of an ion still in the dropper (pressed, not landed yet), so a page can count it from the press
    sc.pendingMol = ion => pending.reduce((a, p) => a + (D.REAGENTS[p.k].ions.find(x => x[0] === ion) || [0, 0])[1] * p.mol, 0);
    sc.setTemperature = function (T) { sc.beaker.setTemperature(T); };
    sc.state = () => sc.beaker.state();
    // A dose that takes out about a third of the dissolved anion, so more solid dissolves and some is left:
    // first H⁺ meets anions already in the water, then the spare H⁺ reaches the crystal
    // mol: a fixed dose instead (3.3: 1.0 × 10⁻³ M a press, user 2026-11-20)
    sc.acid = function (mol, reagent) {
      const k = reagent || 'HNO3';
      if (sc.dropper) { pending.push({ k, mol, acid: true }); dropT = 0; dropLabel = D.REAGENTS[k].formula; return; }
      acidNow(mol, k);
    };
    function acidNow(mol, reagent) {
      const s = sc.salt(), st = sc.beaker.state().salts[sc.saltId];
      const solidNow = sc.beaker.solid[sc.saltId] || sc.scoopMol();
      const dissolved = st ? st.s * s.an[1] * V : 0;
      pour(reagent || 'HNO3', mol != null ? mol : dissolved * 0.3 + solidNow * s.an[1] * 0.25);
      meets = 0; hco3s = 0; release = 0; releaseX = null; surfFizz = -1; fizzAt = [];
      if (s.pH) chemWait = ACID_WAIT;
      if (s.pH === 'carbonate') fizzT = 0; // CO₂ fizzes off the solid in the beaker
      if (s.pH) acidT = 0; // the window zooms in on the crystal surface where the acid acts
    }
    // a tap settles everything instantly: the numbers, any acid events, and the zoom
    sc.settle = function () {
      pending.forEach(land); pending = []; dropT = 99; rain = {}; fizzT = 99; chemWait = 0; surfFizz = -1;
      sc.beaker.settle(); acidT = 99; cam.k = 1; layersShown = layersGoal();
      sc.sprites.forEach(p => { if (p.visitor || p.taken) p.dead = true; });
      sc.sprites = sc.sprites.filter(p => !p.dead);
      syncParticles(0);
    };
    // run some seconds of motion at once (first frames, headless screenshots)
    sc._view = () => ({ cam: Object.assign({}, cam), top: slab.top, WR }); // dev: what the window shows (headless checks)
    sc.warm = function (seconds) { for (let i = 0; i < seconds * 60; i++) sc.step(1 / 60, true); };
    sc.isBusy = () => acidT < 12 || pending.length > 0 || chemWait > 0 || !sc.beaker.isSettled();

    // ---------- particles (ions move in depth: z 0 = back, 1 = front) ----------
    // Shown: the salt's own ions, plus H⁺ / OH⁻. Spectators (Na⁺, K⁺, NO₃⁻) are left out.
    // OH⁻ only when it belongs to the story: a hydroxide salt, or NaOH added (not a carbonate buffer's).
    function shown(k, s) {
      if (k === s.cat[0] || k === s.an[0] || k === 'H+' || sc.showIons.includes(k)) return true;
      return k === 'OH-' && (sc.beaker.fromReagent['OH-'] || 0) > 0;
    }
    const acidActive = () => acidT < 12;
    // Layers of solid: about 2 for a scoop past saturation, growing more slowly as the pile gets big
    function layersGoal() {
      const s = sc.salt(), st = sc.beaker.state().salts[sc.saltId];
      if (!st || !(st.solidMol > 0)) return 0;
      const units = st.solidMol / (D.molarSolubility(s) * V) * 6; // formula units, on the particle scale
      return Math.max(0.15, sc.maxLayers * (1 - Math.exp(-units / 8.9)));
    }
    const screenY = p => p.y - (1 - p.z) * DEPTH;
    function spawn(ion, fromCrystal, atX) {
      let sx, sy, z = rand(0.05, 1);
      const sites = slab.surface;
      if (fromCrystal && sites.length && atX != null) { // where H⁺ just took an anion out
        const kind = D.ION[ion].z > 0 ? 'c' : 'a';
        let best = null, bd = 1e9; sites.forEach(st => { const d = Math.abs(st.x - atX) + (st.kind === kind ? 0 : 40); if (d < bd) { bd = d; best = st; } });
        sx = best.x; sy = best.y - 4; z = rand(0.8, 1);
      } else if (fromCrystal && sites.length) {
        // during an acid close-up, new ions leave from the part of the crystal in view
        const near = acidActive() ? sites.filter(st => Math.abs(st.x - cam.fx) < 90) : sites;
        const pool = near.length ? near : sites;
        const st = pool[(Math.random() * pool.length) | 0]; sx = st.x; sy = st.y - 4; z = rand(0.7, 1);
      } else {
        // somewhere in the water around the window (it is centred on the camera, just above the solid)
        const A = roam(); let n = 0;
        do { sx = rand(A.x0, A.x1); sy = rand(A.y0, A.y0 + 2 * (A.x1 - cam.fx)); n++; } while (n < 200 && sy > slab.topAt(sx) - 30);
      }
      const a = rand(0, Math.PI * 2);
      // an ion leaving the crystal rises well clear of it before it starts to wander (user, 2026-11-19: they hung
      // just above the solid, so it didn't look dissolved)
      const off = fromCrystal && sites.length;
      sc.sprites.push({ ion, x: sx, y: sy, z, solid: off ? 1 : 0, vz: rand(-0.15, 0.15), rise: off ? rand(1.4, 2.2) / cam.k : 0,
        vx: 50 * Math.cos(a) * (off ? 0.5 : 1), vy: fromCrystal ? -rand(110, 150) : 50 * Math.sin(a), alpha: fromCrystal ? 1 : 0, leaving: 0 });
    }
    function spawnTop(ion) {
      const A = roam(), half = WR / cam.k;
      sc.sprites.push({ ion, x: rand(cam.fx - half * 0.85, cam.fx + half * 0.85), y: A.y0 + rand(0, 20), z: rand(0.15, 1), vz: rand(-0.1, 0.1),
        vx: rand(-25, 25), vy: rand(120, 170), fall: rand(1.0, 2.8), rise: 0, solid: 0, alpha: 1, leaving: 0 });
    }
    const freeOf = k => sc.sprites.filter(p => p.ion === k && !p.leaving && !p.visitor && !p.taken);
    // where ions roam: a square around the window (radius WR / zoom), ROAM bigger on each side, so they leave view
    const ROAM = R * 2 + 14;
    function roam() { const r = WR / cam.k + ROAM; return { x0: cam.fx - r, x1: cam.fx + r, y0: cam.fy - r }; }
    // the roaming area is bigger than the window, so there are more ions in all; this keeps the number in view the
    // same as before. Worked out on a grid, only when the view changes noticeably, in steps of 0.1
    let shareKey = '', share = 1;
    function roamShare() {
      const key = Math.round(cam.fy / 15) + ':' + Math.round(cam.k * 10);
      if (key === shareKey) return share;
      shareKey = key;
      const A = roam(), rv = WR / cam.k, N = 28; let all = 0, seen = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = A.x0 + (i + 0.5) / N * (A.x1 - A.x0), y = A.y0 + (j + 0.5) / N * (A.x1 - A.x0);
        if (y > slab.topAt(x)) continue;
        all++; if (Math.hypot(x - cam.fx, y - cam.fy) < rv) seen++;
      }
      share = seen ? Math.round(all / seen * 10) / 10 : 1;
      return share;
    }
    // the dissolved ion that joins the solid is one close to it (not one still rising off it), so the rest stay
    // spread through the water (user, 2026-11-19: ions hugged the surface once a solid had formed)
    function nearestToSolid(list) {
      const pool = list.filter(q => !q.leaving && !q.taken), settled = pool.filter(q => !(q.rise > 0));
      const from = settled.length ? settled : pool;
      let best = null, bd = Infinity;
      from.forEach(q => { const d = slab.topAt(q.x) - q.y; if (d < bd) { bd = d; best = q; } });
      return best;
    }
    function syncParticles(dt) {
      const b = sc.beaker, s = sc.salt();
      const pc = b.particleCounts(sc.saltId, sc.base, sc.maxIons);
      if (sc.minOwn) { // 3.2: K⁺ : I⁻ stays 1 : 1 and Pb²⁺ : NO₃⁻ 1 : 2 when the added ion fills the window; a Pb²⁺ or two stay in view
        let top = 0; for (const k in pc) if (shown(k, s)) top = Math.max(top, pc[k].exact);
        const mx = sc.maxIons / cam.k, f = top > mx ? mx / top : 1; // zoomed in, a smaller patch of water holds fewer
        for (const k in pc) {
          let c = Math.round(pc[k].exact * f);
          if ((k === s.cat[0] || k === s.an[0]) && pc[k].exact > 0) c = Math.max(c, sc.minOwn);
          pc[k].count = c;
        }
      }
      const solidThere = (b.solid[sc.saltId] || 0) > 0;
      const basic = s.pH ? s.an[0] : null;      // the anion acid removes (OH⁻ or CO₃²⁻)
      const acidOn = !!basic && acidActive();   // while acid acts, nothing joins the crystal
      // scale for the ions out of view; scaled by whole cations so the formula ratio holds (PbI₂: 1 Pb²⁺ to 2 I⁻)
      const F = roamShare(), c0 = pc[s.cat[0]] ? pc[s.cat[0]].count : 0, Fs = c0 > 0 ? Math.max(1, Math.round(c0 * F)) / c0 : F;
      for (const k in pc) {
        if (!shown(k, s)) continue;
        const free = freeOf(k);
        const want = Math.round((k === 'H+' ? Math.min(pc[k].count, 5) : pc[k].count) * Fs);
        const own = k === s.cat[0] || k === s.an[0];
        const rn = rain[k];
        if (rn && dt > 0 && free.length < want) { // brought by a reagent: they fall in from the top, a few at a time
          rn.acc += dt * RAIN_RATE;
          const nNew = Math.min(want - free.length, Math.floor(rn.acc)); rn.acc -= nNew;
          for (let i = 0; i < nNew; i++) spawnTop(k);
        } else if (acidOn && k === s.cat[0] && solidThere && dt > 0 && (acidT < ACID_WAIT + 2 || sc.sprites.some(q => q.visitor || q.taken))) {
          // held from the landing until H⁺ has had time to reach the crystal, and while any meeting is still on its way
          const nNew = Math.min(want - free.length, Math.floor(release)); release -= Math.max(0, nNew); // only where H⁺ has been
          for (let i = 0; i < nNew; i++) spawn(k, true, releaseX);
        } else if (acidOn && k === basic) {
          // while the acid acts, its anion is not topped up out of the crystal (H⁺ is taking it away)
        } else if (acidOn && k === s.cat[0] && dt > 0) { // after the meetings, the rest leave the crystal a few a second, not in a burst
          trickle = Math.min(2, trickle + dt * 4);
          const nNew = Math.min(want - free.length, Math.floor(trickle)); trickle -= Math.max(0, nNew);
          for (let i = 0; i < nNew; i++) spawn(k, solidThere);
        } else for (let i = free.length; i < want; i++) spawn(k, own && solidThere && dt > 0 && !(acidT >= 12 - 0.01 && cam.k > 1.02));
        for (let i = want; i < free.length; i++) {
          if (acidOn && k === basic) { meetDissolved(free); continue; }      // H⁺ meets a dissolved anion
          if (acidOn && k === 'H+') { meetSurface(free, basic); continue; }  // H⁺ pulls an anion out of the crystal
          const p = nearestToSolid(free); if (p) leave(p, own && solidThere && !acidOn);
        }
      }
      sc.sprites.forEach(p => { if (p.ion && !(p.ion in pc && shown(p.ion, s)) && !p.visitor && !p.taken && !p.product) p.leaving = 2; });
      // equilibrium events: one formula unit joins the crystal while another leaves it (paused while acid acts)
      const ev = b.eventRates(sc.saltId);
      const acidComing = pending.some(q => q.acid) && !!basic; // from the press: nothing leaves the crystal before H⁺ is seen
      if (dt > 0 && solidThere && !acidOn && !acidComing && Math.random() < Math.min(ev.dissolve, ev.reform, 0.7) * dt) {
        const take = (k, n) => { for (let i = 0; i < n; i++) { const p = nearestToSolid(sc.sprites.filter(q => q.ion === k && !q.leaving && !q.taken && !q.visitor)); if (p) leave(p, true); } };
        take(s.cat[0], s.cat[1]); take(s.an[0], s.an[1]);
        for (let i = 0; i < s.cat[1]; i++) spawn(s.cat[0], true);
        for (let i = 0; i < s.an[1]; i++) spawn(s.an[0], true);
      }
    }
    // Acid meetings (OH⁻ + H⁺ → H₂O; CO₃²⁻ + H⁺ → HCO₃⁻), one at a time, about 0.4 s apart.
    // The anion stays where it is; the H⁺ comes to it.
    const productOf = k => k === 'OH-' ? ['H₂O', ''] : ['HCO₃', '−'];
    const nextDelay = () => sc.sprites.filter(q => q.visitor && q.wait > 0).length * 0.4 + 0.15;
    const nearCam = q => Math.hypot(q.x - cam.fx, screenY(q) - cam.fy);
    function sendH(target, near) {
      const delay = near ? 0.15 : nextDelay();
      target.taken = true; target.wait = delay; target.product = productOf(target.ion);
      // a free H⁺ already in the water if there is one, otherwise one arriving from above
      const h = freeOf('H+').sort((a, b) => nearCam(a) - nearCam(b))[0];
      if (h) { h.visitor = true; h.real = true; h.wait = delay; h.target = target; return; }
      // otherwise one coming down from the top of the view, so the class sees it arrive (user, 2026-11-20: "I don't see any H⁺")
      const ny = near ? target.y - rand(70, 95) : cam.fy - WR / cam.k - R; // near: just above the crystal face, about a second away
      sc.sprites.push({ ion: 'H+', visitor: true, wait: delay, target, x: target.x + rand(-70, 70) * (near ? 0.6 : 1), y: ny, z: 1, vx: 0, vy: 0, vz: 0, alpha: 0, solid: 0, leaving: 0 });
    }
    // a big dose (3.3's 1.0 × 10⁻³ M) would queue dozens of meetings and hold the close-up for ~20 s; after ACID_MEETS the
    // rest go quietly (the one furthest from the close-up fades), so the zoom eases back out within about 8 s
    function meetDissolved(free) {
      const pool = free.filter(q => !q.leaving && !q.taken).sort((a, b) => nearCam(a) - nearCam(b));
      if (!pool.length) return;
      if (meets >= ACID_MEETS) { pool[pool.length - 1].leaving = 2; return; }
      meets++; sendH(pool[0]);
    }
    function meetSurface(freeH, k) {
      const h = freeH.filter(q => !q.visitor && !q.leaving).sort((a, b) => nearCam(a) - nearCam(b))[0];
      const sites = slab.surface.filter(st => st.kind === 'a').sort((a, b) => Math.abs(a.x - cam.fx) - Math.abs(b.x - cam.fx));
      if (!h || !sites.length || meets >= ACID_MEETS) { if (h) h.leaving = 2; return; }
      meets++;
      const st = sites[(Math.random() * Math.min(4, sites.length)) | 0];
      const delay = nextDelay();
      const o = { ion: k, x: st.x, y: st.y, z: 1, solid: 1, alpha: 1, vx: 0, vy: 0, vz: 0, leaving: 0, taken: true, anchored: true, wait: delay, product: productOf(k) };
      sc.sprites.push(o);
      h.visitor = true; h.real = true; h.wait = delay; h.target = o;
    }
    function leave(p, toCrystal) {
      if (!toCrystal || !(slab.edge.length || slab.surface.length)) { p.leaving = 2; return; }
      // land on the growing edge of the top layer, at a site of the matching kind
      const kind = D.ION[p.ion].z > 0 ? 'c' : 'a';
      const pick = list => { let best = null, bd = 1e9; list.forEach(st => { if (st.kind !== kind) return; const d = Math.abs(st.x - p.x) + Math.random() * 30; if (d < bd) { bd = d; best = st; } }); return best; };
      const best = pick(slab.edge) || pick(slab.surface);
      p.leaving = 1; p.tx = best ? best.x : p.x; p.ty = best ? best.y : slab.topAt(p.x) + R;
    }
    function moveParticles(dt) {
      sc.sprites.forEach(p => {
        if (p.kind === 'fizz') { // a small CO₂ bubble off the crystal face: speeds up, wobbles, leaves through the top
          p.age += dt; p.vy = Math.max(-160, p.vy - 50 * dt); p.y += p.vy * dt; p.x += Math.sin(p.age * 7 + p.ph) * 18 * dt; p.r += dt * 1.2; // lifts off the face, then a steady rise
          p.alpha = Math.min(1, p.age * 6); if (p.y < cam.fy - WR / cam.k - 30) p.dead = true; return;
        }
        if (p.kind === 'bubble') { // CO₂ rises, speeding up and swelling a little, and leaves through the top
          p.age += dt; p.vy = Math.max(-170, p.vy - 160 * dt); p.y += p.vy * dt; p.x += Math.sin(p.age * 5 + p.ph) * 14 * dt;
          p.alpha = Math.min(1, p.age * 5); if (p.y < cam.fy - WR / cam.k - 60) p.dead = true; return;
        }
        if (p.kind === 'product' && p.taken) { p.alpha = Math.min(1, p.alpha + dt * 4); return; } // HCO₃⁻ waiting for a second H⁺
        if (p.kind === 'product') { // a new molecule drifts off and fades into the water
          p.age += dt; p.y -= 14 * dt; p.x += Math.sin(p.age * 2 + p.ph) * 8 * dt;
          p.alpha = Math.min(1, p.age * 4) * Math.max(0, 1 - Math.max(0, p.age - 2.2) / 1.2);
          if (p.age > 3.4) p.dead = true; return;
        }
        if (p.taken) { // waits where it is (slowing to a stop) for the H⁺ coming to it
          if (p.wait > 0) p.wait -= dt;
          if (!p.anchored) { p.vx *= 0.92; p.vy *= 0.92; p.vz *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt; p.solid = Math.max(0, (p.solid || 0) - dt * 1.6); }
          return;
        }
        if (p.visitor && p.wait > 0) { p.wait -= dt; if (!p.real) return; } // a real H⁺ keeps drifting while it waits
        else if (p.visitor) { // H⁺ heads for its partner, then they join
          const t = p.target; p.alpha = Math.min(1, p.alpha + dt * 3);
          if (!t || t.dead) { p.dead = true; return; }
          const dx = t.x - p.x, dy = screenY(t) - screenY(p), d = Math.hypot(dx, dy), sp = 95; // slow enough to follow
          if (d < R * 1.3) {
            t.dead = true; p.dead = true;
            const mx = (t.x + p.x) / 2, my = (t.y + p.y) / 2;
            if (t.anchored) { const sl = sc.salt(); release += sl.cat[1] / sl.an[1]; releaseX = t.x; }
            if (t.product[0] === 'CO₂') { // HCO₃⁻ + H⁺ → H₂O + CO₂: the gas leaves as a bubble
              sc.sprites.push({ kind: 'product', label: ['H₂O', ''], x: mx + 14, y: my, z: 1, age: 0, ph: rand(0, 6), alpha: 0 });
              sc.sprites.push({ kind: 'bubble', x: mx - 10, y: my - 8, z: 1, vy: -30, age: 0, ph: rand(0, 6), alpha: 0 });
              return;
            }
            const prod = { kind: 'product', label: t.product, x: mx, y: my, z: 1, age: 0, ph: rand(0, 6), alpha: 0 };
            sc.sprites.push(prod);
            // carbonate: every other HCO₃⁻ meets a second H⁺ and gives off CO₂ (the fizz seen with seashells in acid)
            // at the crystal face, HCO₃⁻ takes a second H⁺ straight away and leaves as CO₂ (up to 4 a press; user, 2026-11-20:
            // "bubbles of CO₂ coming off the solid"); HCO₃⁻ made out in the water stays HCO₃⁻, as the engine has it
            if (t.product[0] === 'HCO₃' && t.anchored && hco3s < 4) { hco3s++; sendH(prod, true); prod.product = ['CO₂', '']; }
            if (t.anchored && sc.salt().pH === 'carbonate') { if (fizzAt.length > 3) fizzAt.shift(); fizzAt.push(t.x); surfFizz = Math.max(surfFizz, 0); }
            return;
          }
          p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; p.z += (t.z - p.z) * Math.min(1, dt * 3); return;
        }
        if (p.leaving === 1) { // glide down onto a site at the edge of the top layer, then merge into it
          p.x += (p.tx - p.x) * Math.min(1, dt * 4); p.z += (1 - p.z) * Math.min(1, dt * 4);
          p.solid = Math.min(1, (p.solid || 0) + dt * 2.5);
          p.y += 170 * dt; if (p.y >= p.ty) { p.y = p.ty; p.alpha -= dt * 4; if (p.alpha <= 0) p.dead = true; }
          return;
        }
        if (p.solid > 0) p.solid = Math.max(0, p.solid - dt * 1.6); // takes on its dissolved colour as it leaves
        if (p.leaving === 2) { p.alpha -= dt * 2; if (p.alpha <= 0) p.dead = true; }
        else p.alpha = Math.min(1, p.alpha + dt * 2);
        // random walk at a steady drifting speed (~55 px/s), and drifting in depth; just off the crystal, a steady
        // rise (~110 px/s, gently wandering sideways) carries the ion up into the water first
        const rising = p.rise > 0 && !p.leaving, falling = p.fall > 0 && !p.leaving;
        if (falling) { p.fall -= dt; p.vx += rand(-1, 1) * 120 * dt; p.vy += (140 - p.vy) * Math.min(1, dt * 3); }
        else if (rising) { p.rise -= dt; p.vx += rand(-1, 1) * 160 * dt; p.vy += (-120 - p.vy) * Math.min(1, dt * 3); }
        else { p.vx += rand(-1, 1) * 420 * dt; p.vy += rand(-1, 1) * 420 * dt; }
        p.vz += rand(-1, 1) * 1.6 * dt;
        const sp = Math.hypot(p.vx, p.vy) || 1, k = rising || falling ? 1 : 1 + (55 / sp - 1) * Math.min(1, dt * 2.5);
        p.vx *= k; p.vy *= k; p.vz *= 0.99;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz); } else if (p.z > 1) { p.z = 1; p.vz = -Math.abs(p.vz); }
        // the window is a circle cut out of a bigger solution (user, 2026-11-19): ions float past its edge and back.
        // They roam a square a little bigger than the window, centred on the camera, and turn round only out of view
        const A = roam(), sy0 = screenY(p);
        if (p.x < A.x0) { p.x = A.x0; p.vx = Math.abs(p.vx); p.rise = 0; } else if (p.x > A.x1) { p.x = A.x1; p.vx = -Math.abs(p.vx); p.rise = 0; }
        if (sy0 < A.y0) { p.y += A.y0 - sy0; p.vy = Math.abs(p.vy); p.rise = 0; }
        const floorY = slab.topAt(p.x) - R * 0.2;
        if (p.y > floorY) { p.y = floorY; p.vy = -Math.abs(p.vy); p.fall = 0; }
      });
      sc.sprites = sc.sprites.filter(p => !p.dead);
    }
    // close-up: ease in while acid events run, hold, then ease back out
    function stepCam(dt) {
      acidT += dt;
      const busy = sc.sprites.some(p => p.visitor || p.taken);
      if (busy && acidT > 1) acidT = Math.min(acidT, 12 - ACID_HOLD);
      const want = acidActive() && acidT < 12 - 0.01 ? 1.85 : 1;
      cam.k += (want - cam.k) * Math.min(1, dt * 2.2);
      cam.fx = 0; cam.fy = sc.tank ? (FLOOR - WR) / 2 : slab.top - 60;
      // the solid's layers build up (or come apart) a little behind the numbers
      layersShown += (layersGoal() - layersShown) * Math.min(1, dt * 1.4);
    }
    // headless warm-up also lays out the slab, so particles have a surface to leave from
    sc.step = function (dt, offscreen) {
      if (dropT < 99) { dropT += dt; if (pending.length && dropT >= DROP_LAND) { pending.forEach(land); pending = []; } if (dropT > DROP_END && !pending.length) dropT = 99; }
      for (const k in rain) { rain[k].t -= dt; if (rain[k].t <= 0) delete rain[k]; }
      if (fizzT < 99) { fizzT += dt; if (fizzT > 6) fizzT = 99; }
      if (surfFizz >= 0 && slab.surface.length) { // ~7 a second at first, dying away over about 6 s
        surfFizz += dt; const rate = 8 * Math.max(0, 1 - surfFizz / 7);
        if (rate <= 0) surfFizz = -1;
        else if (Math.random() < rate * dt) {
          const near = fizzAt.length && Math.random() < 0.7 ? fizzAt[(Math.random() * fizzAt.length) | 0] + rand(-40, 40) : cam.fx + rand(-1, 1) * WR / cam.k;
          sc.sprites.push({ kind: 'fizz', x: near, y: slab.topAt(near) - R * 0.5, z: 1, r: rand(5, 10), vy: -rand(70, 100), age: 0, ph: rand(0, 6), alpha: 0 });
        }
      }
      const waiting = chemWait > 0; chemWait = Math.max(0, chemWait - dt);
      sc.beaker.step(waiting ? 0 : dt * sc.chemRate); stepCam(dt); syncParticles(dt); moveParticles(dt);
      if (offscreen) slab = layoutSlab();
    };
    function layoutSlab() {
      // the same geometry crystalSlab returns, without drawing (an offscreen canvas would do, this is cheaper)
      const g = sc._scratch || (sc._scratch = document.createElement('canvas').getContext('2d'));
      const s = sc.salt();
      return Draw.crystalSlab(g, win, FLOOR, s, { cat: info(s.cat[0]), an: info(s.an[0]) }, { r: R, colour: tok(s.colour), layers: layersShown });
    }

    // ---------- drawing ----------
    // opts: { beaker: {x,y,w,h} | null, win: {x,y,r} | null, caption: true, zoomLines: true }
    sc.draw = function (g, o) {
      const s = sc.salt(), st = sc.beaker.state().salts[sc.saltId];
      const solid = st ? st.solidMol : 0, added = Math.max(sc.beaker.solidAdded[sc.saltId] || 0, 1e-30);
      const ions = { cat: info(s.cat[0]), an: info(s.an[0]) }, colour = tok(s.colour);
      let G = null;
      const drawDropper = G => {
      const Pic = global.SolPictures;
      if (dropT < DROP_END && Pic && Pic.standardDropper) { // the reagent goes in from a dropper, named beside its bulb
        const tx = G.cx + G.rx * 0.3, ty = G.topY + 22; // tip just inside the mouth, so the bulb stays in the frame
        // the dropper's drops take 0.35–1.1 s; DROP_LAND sits where the first ones meet the water
        Pic.standardDropper(g, tx, ty, G.surfY, dropT);
        const a = Math.min(1, dropT / 0.25) * (1 - Math.max(0, Math.min(1, (dropT - 1.3) / 0.3)));
        if (a > 0) { g.save(); g.globalAlpha = a; g.fillStyle = INK; g.font = '700 20px Space Grotesk, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
          g.fillText(dropLabel, tx + 22, ty - 70); g.restore(); }
      }
      };
      const drawLayer = slabWin => {
        const list = sc.sprites.slice().sort((a, b) => a.z - b.z);
        const hi = p => p.ion && !p.leaving && !p.solid && ((sc.marks.has('cat') && D.ION[p.ion].z > 0) || (sc.marks.has('an') && D.ION[p.ion].z < 0));
        const drawP = p => {
          const sc2 = 0.62 + 0.38 * p.z, y = screenY(p);
          if (p.kind === 'product') { Draw.neutral(g, p.x, y, R * 0.95, p.label[0], p.alpha, p.label[1]); return; }
          if (p.kind === 'fizz') {
            g.save(); g.globalAlpha = p.alpha; g.fillStyle = 'rgba(255,255,255,0.6)'; g.strokeStyle = '#3f7fb3'; g.lineWidth = 2.2;
            g.beginPath(); g.arc(p.x, y, p.r, 0, Math.PI * 2); g.fill(); g.stroke();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x - p.r * 0.35, y - p.r * 0.35, p.r * 0.28, 0, Math.PI * 2); g.fill(); g.restore(); return;
          }
          if (p.kind === 'bubble') { // a gas bubble: clear, outlined, with a highlight and its formula
            const r = R * (1 + Math.min(0.35, p.age * 0.15));
            g.save(); g.globalAlpha = p.alpha; g.fillStyle = 'rgba(255,255,255,0.45)'; g.strokeStyle = '#5f97c2'; g.lineWidth = 2;
            g.beginPath(); g.arc(p.x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(p.x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); g.fill();
            g.fillStyle = INK; g.font = '700 ' + Math.round(r * 0.72) + 'px Space Grotesk, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText('CO₂', p.x, y + 1); g.restore(); return;
          }
          if (hi(p)) { g.save(); g.globalAlpha = p.alpha; g.strokeStyle = ACCENT; g.lineWidth = 3.5; g.beginPath(); g.arc(p.x, y, R * sc2 + 5, 0, Math.PI * 2); g.stroke(); g.restore(); }
          // spectators (K⁺, NO₃⁻ when a page shows them) fade out while the acid close-up runs, so H⁺ meeting OH⁻ stays clear
          // (user, 2026-11-17 "too muddy"), and come back as the view eases out
          const spect = sc.showIons.includes(p.ion) && p.ion !== s.cat[0] && p.ion !== s.an[0] && p.ion !== 'H+' && p.ion !== 'OH-';
          const fade = spect ? Math.max(0, 1 - (cam.k - 1) / 0.35) : 1;
          if (fade <= 0) return;
          Draw.ion(g, p.x, y, R * sc2, info(p.ion), { alpha: fade * p.alpha * (0.55 + 0.45 * p.z), label: sc2 > 0.7, solidColour: colour, solid: p.solid || 0 });
        };
        list.filter(p => p.z < 0.6).forEach(drawP);
        slab = Draw.crystalSlab(g, slabWin, FLOOR, s, ions, { r: R, colour, layers: layersShown });
        if (sc.marks.has('solid') && layersShown > 0.05) {
          g.save(); g.strokeStyle = ACCENT; g.lineWidth = 4; g.setLineDash([8, 6]);
          g.strokeRect(-WR, slab.top - R * 1.6 - DEPTH, WR * 2, FLOOR - slab.top + R * 1.6 + DEPTH); g.restore();
        }
        list.filter(p => p.z >= 0.6).forEach(drawP);
      };
      // 4.2 (user, 2026-11-20): one big beaker with the particles in its water, no test tube and no zoom window.
      // The particle frame maps onto the water: its top at the surface, FLOOR on the beaker floor; the solid lies on the floor
      if (o.tank) {
        const level = o.level == null ? 0.88 : o.level;
        G = Draw.beakerGeom(o.tank, { level, tilt: 0.16 });
        Draw.beakerBack(g, G, { level, liquidColor: o.liquidColor });
        const kt = (G.botY + G.ry * 0.35 - G.surfY) / (FLOOR + WR);
        g.save();
        g.beginPath(); g.ellipse(G.cx, G.surfY, G.rx - 2, G.ry - 1, 0, Math.PI, Math.PI * 2); g.lineTo(G.cx + G.rx - 2, G.botY);
        g.ellipse(G.cx, G.botY, G.rx - 2, G.ry - 1, 0, 0, Math.PI); g.closePath(); g.clip();
        g.translate(G.cx, G.surfY + WR * kt); g.scale(kt, kt);
        drawLayer({ x: 0, y: 0, r: (G.rx - 2) / kt }); // the solid reaches the glass on both sides
        g.restore();
        Draw.beakerSurface(g, G);
        Draw.beakerFront(g, G, { grads: [] });
        drawDropper(G);
        return;
      }
      if (o.beaker) {
        // a 150 mL beaker holding 100 mL of water, graduated every 25 mL
        const level = o.level == null ? V / 0.150 : o.level;
        G = Draw.beakerGeom(o.beaker, { level, tilt: 0.2 });
        Draw.beakerBack(g, G, { level });
        if (solid > 0) Draw.pile(g, G, Math.min(1, solid / Math.max(added, sc.scoopMol() * 2)), s, ions, colour);
        Draw.beakerSurface(g, G);
        Draw.beakerFront(g, G, { grads: [25, 50, 75, 100, 125].map(v => ({ f: v / 150, major: v % 50 === 0, label: v % 50 === 0 ? v + ' mL' : '' })) });
        if (fizzT < 6) { // CO₂ bubbles rise from the solid to the surface, then die away
          const env = Math.min(1, fizzT / 0.3) * (1 - Math.max(0, (fizzT - 3.5) / 2.5));
          g.save(); g.strokeStyle = '#5f97c2'; g.lineWidth = 1.3;
          for (let i = 0; i < 16; i++) {
            const ph = (fizzT * (0.75 + (i % 5) * 0.08) + i * 0.137) % 1, h = Math.sin(i * 91.7) * 0.5 + 0.5;
            const x = G.cx + (h - 0.5) * G.rx * 1.1 + Math.sin(fizzT * 4 + i) * 2, y = G.botY - 16 - ph * (G.botY - 16 - G.surfY - 4);
            g.globalAlpha = env * (0.35 + 0.65 * (1 - ph)); g.fillStyle = 'rgba(255,255,255,0.7)';
            g.beginPath(); g.arc(x, y, 1.8 + ph * 2.4, 0, Math.PI * 2); g.fill(); g.stroke();
          }
          g.restore();
        }
        drawDropper(G);
        if (sc.marks.has('solid') && solid > 0) {
          g.save(); g.strokeStyle = ACCENT; g.lineWidth = 3; g.setLineDash([6, 5]);
          g.beginPath(); g.ellipse(G.cx, G.botY - 8, G.rw * 0.62, G.ry * 0.9 + 14, 0, 0, Math.PI * 2); g.stroke(); g.restore();
        }
      }
      if (!o.win) return;
      const W = o.win, k = W.r / WR;
      if (G && o.zoomLines !== false) {
        g.save(); g.setLineDash([5, 5]); g.strokeStyle = DIM; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(G.cx + G.rw * 0.2, G.botY - 30); g.lineTo(W.x - W.r * 0.72, W.y - W.r * 0.69);
        g.moveTo(G.cx + G.rw * 0.2, G.botY - 4); g.lineTo(W.x - W.r * 0.6, W.y + W.r * 0.8); g.stroke(); g.restore();
      }
      g.save(); g.translate(W.x, W.y); g.scale(k, k);
      Draw.lensBack(g, win);
      g.save(); g.beginPath(); g.arc(0, 0, WR, 0, Math.PI * 2); g.clip();
      g.scale(cam.k, cam.k); g.translate(-cam.fx, -cam.fy);
      drawLayer(win);
      g.restore();
      Draw.lensFront(g, win);
      // legend inside the window (e.g. "[Pb²⁺] = x   [I⁻] = 2x")
      if (sc.legend && sc.legend.length) {
        g.font = '700 22px Space Grotesk, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        // one line when it fits across the top of the window, otherwise one entry per line
        const one = sc.legend.join('     '), wide = g.measureText(one).width > 300;
        const lines = wide ? sc.legend : [one], tw = Math.max(...lines.map(t => g.measureText(t).width)) + 28, th = 30 * lines.length + 8;
        const top = wide ? -WR + 52 : -WR + 26;
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.strokeStyle = INK; g.lineWidth = 2;
        g.beginPath(); g.roundRect ? g.roundRect(-tw / 2, top, tw, th, 10) : g.rect(-tw / 2, top, tw, th); g.fill(); g.stroke();
        g.fillStyle = INK; lines.forEach((t, i) => g.fillText(t, 0, top + 19 + 30 * i));
      }
      g.restore();
      if (o.caption !== false && sc.caption) {
        g.fillStyle = DIM; g.font = Math.max(11, Math.round(13 * Math.max(0.85, k))) + 'px Space Mono, monospace'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillText(cam.k > 1.15 ? 'zoomed in further: where the acid acts' : 'zoomed in, not to scale', W.x, W.y + W.r + 20 * Math.max(0.85, k));
      }
    };

    sc.reset();
    return sc;
  }

  global.SolScene = { create, R, WR };
})(typeof window !== 'undefined' ? window : globalThis);
