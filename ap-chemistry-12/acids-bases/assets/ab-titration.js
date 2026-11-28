/* AbTitration: the classic titration for Part 1.3 (brief §5), and the labelled glassware bench.
   The demo: standardized NaOH in the burette, a 25.00 mL pipetted sample of HCl (1 : 1) or H₂SO₄ (1 : 2) with
   phenolphthalein in the flask. The teacher runs it in class; students can replay it. Numbers are exact (strong acid,
   strong base, Kw); the burette reads to 0.01 mL and one drop is 0.05 mL, so the end point is within one drop.
   Colour follows the real chemistry: pink flashes where the NaOH lands and fades on swirling, more slowly as the end
   point nears; past the equivalence point the whole flask stays pink, faint for one drop, deep for an overshoot.
   The acid concentrations are made up for the demo (labs keep their secrets: strategy principle 6).
   The state lives here, not in the stage, so trials survive moving between sections.

   const d = AbTitration.demo();      d.controls(host) (sample) · d.rig(canvas) (burette controls on the picture)
                                      · d.table(host) · d.draw(g, W, H, t, dt) · d.swirl()
   AbTitration.bench(host, onPick)    the glassware, each piece a button                                    */
(function (global) {
  'use strict';
  const A = global.AbDraw;
  const C_NAOH = 0.1052;                              // mol/L, the standardized NaOH
  const V_SAMPLE = 25.00;                             // mL, pipetted
  const DROP = 0.05;                                  // mL per drop
  const SAMPLES = {
    HCl: { label: 'HCl', c: 0.0874, protons: 1, eq: 'HCl + NaOH → NaCl + H<sub>2</sub>O',
      ratio: ['1 mol HCl', '1 mol NaOH'], acid: 'HCl' },
    H2SO4: { label: 'H₂SO₄', c: 0.0451, protons: 2, eq: 'H<sub>2</sub>SO<sub>4</sub> + 2 NaOH → Na<sub>2</sub>SO<sub>4</sub> + 2 H<sub>2</sub>O',
      ratio: ['1 mol H<sub>2</sub>SO<sub>4</sub>', '2 mol NaOH'], acid: 'H<sub>2</sub>SO<sub>4</sub>' }
  };
  const STARTS = [0.35, 1.10, 0.62, 0.18, 1.47, 0.80, 0.27, 1.02];   // initial burette readings, trial by trial
  const PINK = '#f25aa8';                             // phenolphthalein (pink means phenolphthalein, nothing else)

  const st = {
    sample: 'HCl', flow: 'closed', v: 0, r0: STARTS[0], startIx: 0, flash: 0, swirlT: 0, dropT: 0,
    drops: [], trials: { HCl: [], H2SO4: [] }, listeners: []
  };
  const S = () => SAMPLES[st.sample];
  const vEq = () => V_SAMPLE * S().c * S().protons / C_NAOH;
  const reading = () => st.r0 + st.v;
  function pH() {
    const nH = V_SAMPLE * S().c * S().protons, nOH = st.v * C_NAOH, vt = V_SAMPLE + st.v;
    if (Math.abs(nH - nOH) < 1e-9) return 7;
    return nH > nOH ? -Math.log10((nH - nOH) / vt) : 14 + Math.log10((nOH - nH) / vt);
  }
  function changed() { st.listeners.forEach(f => f()); }
  function add(dv) {
    const room = 50 - reading();
    dv = Math.min(dv, room);
    if (dv <= 0) { st.flow = 'closed'; changed(); return; }
    st.v += dv;
    st.flash = Math.min(1, st.flash + (st.flow === 'stream' ? dv * 1.6 : 0.55));
  }
  function newTrial() {
    if (st.v > 0) st.trials[st.sample].push({ i: st.r0, f: reading(), v: st.v });
    st.startIx = (st.startIx + 1) % STARTS.length;
    st.r0 = STARTS[st.startIx]; st.v = 0; st.flash = 0; st.flow = 'closed'; st.drops = [];
    changed();
  }
  function setSample(k) { if (k === st.sample) return; st.sample = k; st.v = 0; st.flash = 0; st.flow = 'closed'; st.drops = []; changed(); }

  // ---------- drawing: a stand and clamp, a glass burette with a turning stopcock, an Erlenmeyer flask on a white tile,
  // and a magnifying lens on the burette reading ----------
  const BX = 150;                                     // the burette's centre line
  const TIP = { x: BX, y: 418 };                      // the end of the burette tip, just inside the flask's neck
  const SCALE = { top: 34, mlPx: 6 };                 // 0 mL at the top of the scale, 6 px per mL
  const yOf = r => SCALE.top + r * SCALE.mlPx;
  const FLASK = { y: 512, neck: 13, body: 66, shoulder: 440, top: 402 };
  const LENS = { x: 565, y: 205, r: 148 };
  const surfaceY = () => FLASK.y - 24 - st.v * 0.42;  // the flask's liquid rises as NaOH goes in
  function step(dt) {
    if (st.flow === 'stream') { add(0.65 * dt); if (Math.random() < 0.5) st.drops.push({ y: TIP.y, stream: true }); }
    if (st.flow === 'drop') { st.dropT += dt; if (st.dropT > 0.45) { st.dropT = 0; st.drops.push({ y: TIP.y }); } }
    const land = surfaceY();
    st.drops.forEach(d => { d.vy = (d.vy || 60) + 900 * dt; d.y += d.vy * dt; });
    const landed = st.drops.filter(d => d.y > land);
    st.drops = st.drops.filter(d => d.y <= land);
    landed.forEach(d => { if (!d.stream) add(DROP); });
    if (landed.length && !landed.every(d => d.stream)) changed();
    // the pink where the drops land fades: fast with swirling, slowly near the end point
    const nH = V_SAMPLE * S().c * S().protons, left = Math.max(0, (nH - st.v * C_NAOH) / nH);
    const k = (st.swirlT > 0 ? 6 : 0.7) * (0.06 + 0.94 * A.clamp(left * 4, 0, 1));
    st.flash = Math.max(0, st.flash - st.flash * k * dt - 0.01 * dt);
    if (keys.w) st.swirlT = Math.max(st.swirlT, 0.6); else st.swirlT = Math.max(0, st.swirlT - dt);
    // the stopcock handle turns toward its position: across the tube is closed, along it is open
    const want = st.flow === 'stream' ? 0 : st.flow === 'drop' ? Math.PI * 0.32 : Math.PI / 2;
    if (st.handle == null) st.handle = Math.PI / 2;
    st.handle += (want - st.handle) * Math.min(1, dt * 14);
  }
  function look(P) {
    return P.dark
      ? { edge: '#a9bddf', glassA: 'rgba(150,185,235,0.16)', glassB: 'rgba(150,185,235,0.04)', shine: 'rgba(255,255,255,0.32)',
          naoh: ['#22406a', '#1b3356'], water: ['#1f3a5f', '#172c4a'], metal: ['#3b4560', '#9aa7c2', '#4a5470'], base: ['#2a3146', '#1a1f2e'],
          tile: '#e9edf5', tileEdge: '#59627e', ptfe: '#d9dee8', handle: '#5f8fa3', print: '#8f9ab8', ink: P.ink }
      : { edge: '#56657c', glassA: 'rgba(170,198,228,0.30)', glassB: 'rgba(255,255,255,0.10)', shine: 'rgba(255,255,255,0.85)',
          naoh: ['#e6f1fb', '#d2e4f5'], water: ['#e4f1fb', '#cfe3f4'], metal: ['#8f9aab', '#eef1f5', '#9aa5b5'], base: ['#3a404c', '#23272f'],
          tile: '#ffffff', tileEdge: '#c9ced8', ptfe: '#f1f3f6', handle: '#4a7a8c', print: '#8d99a8', ink: P.ink };
  }
  function hGrad(g, x0, x1, stops) { const gr = g.createLinearGradient(x0, 0, x1, 0); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
  function vGrad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
  function flaskPath(g, inset) {
    const f = FLASK, i = inset || 0, n = f.neck - i, b = f.body - i;
    g.beginPath();
    g.moveTo(-n, f.top - f.y + 4 + i); g.lineTo(-n, f.shoulder - f.y);
    g.lineTo(-b + 4, -10 - i); g.quadraticCurveTo(-b, -i, -b + 10, -i);
    g.lineTo(b - 10, -i); g.quadraticCurveTo(b, -i, b - 4, -10 - i);
    g.lineTo(n, f.shoulder - f.y); g.lineTo(n, f.top - f.y + 4 + i);
  }
  const halfAt = y => { const f = FLASK, k = A.clamp((f.y - y) / (f.y - f.shoulder), 0, 1); return f.body - (f.body - f.neck) * k; };
  function draw(g, W, H, t, dt) {
    step(dt || 0);
    const P = A.pal(), L = look(P);
    g.fillStyle = P.stage; g.fillRect(0, 0, W, H);
    // the stand: a heavy base, a chrome rod, a boss head and a clamp holding the burette
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
    A.rrect(g, 18, 522, 280, 22, 6); g.fillStyle = vGrad(g, 522, 544, L.base); g.fill();
    g.restore();
    g.fillStyle = hGrad(g, 56, 68, L.metal); g.fillRect(56, 10, 12, 514);
    A.rrect(g, 50, 150, 24, 26, 3); g.fillStyle = vGrad(g, 150, 176, [L.metal[2], L.metal[0]]); g.fill();
    g.fillStyle = vGrad(g, 156, 168, L.metal); g.fillRect(74, 157, BX - 84, 10);
    [-1, 1].forEach(sd => { A.rrect(g, BX + sd * 13 - 4, 146, 8, 32, 3); g.fillStyle = P.dark ? '#59627e' : '#4a505c'; g.fill(); });
    // the burette: glass tube, NaOH, graduations, meniscus
    const bw = 22, x0 = BX - bw / 2, yTop = 12, yBot = yOf(50) + 8, lvl = yOf(reading());
    g.fillStyle = hGrad(g, x0, x0 + bw, [L.glassA, L.glassB, L.glassB, L.glassA]); g.fillRect(x0, yTop, bw, yBot - yTop);
    g.fillStyle = hGrad(g, x0 + 2, x0 + bw - 2, [L.naoh[1], L.naoh[0], L.naoh[1]]); g.fillRect(x0 + 2, lvl, bw - 4, yBot - lvl);
    g.save(); g.strokeStyle = L.edge; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x0, yTop); g.lineTo(x0, yBot); g.moveTo(x0 + bw, yTop); g.lineTo(x0 + bw, yBot); g.stroke();
    g.beginPath(); g.ellipse(BX, yTop, bw / 2, 2.5, 0, 0, Math.PI * 2); g.stroke();
    for (let r = 0; r <= 50; r++) {
      const y = yOf(r), long = r % 5 === 0;
      g.lineWidth = long ? 1.4 : 1; g.beginPath(); g.moveTo(x0 + 2, y); g.lineTo(x0 + (long ? 12 : 7), y); g.stroke();
      if (long) A.text(g, String(r), x0 - 4, y + 3.5, P.dim, 9, 700, 'right');
    }
    g.strokeStyle = P.dark ? '#7fb4ff' : '#4a7fb5'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x0 + 2, lvl - 2.5); g.quadraticCurveTo(BX, lvl + 3.5, x0 + bw - 2, lvl - 2.5); g.stroke();
    g.restore();
    g.fillStyle = L.shine; g.fillRect(x0 + 4, yTop + 6, 2.5, yBot - yTop - 12);
    // the taper, the stopcock (a PTFE barrel and a handle that turns) and the tip
    g.save();
    g.beginPath(); g.moveTo(x0, yBot); g.quadraticCurveTo(x0, yBot + 8, BX - 4, yBot + 14); g.lineTo(BX + 4, yBot + 14); g.quadraticCurveTo(x0 + bw, yBot + 8, x0 + bw, yBot); g.closePath();
    g.fillStyle = L.glassA; g.fill(); g.strokeStyle = L.edge; g.lineWidth = 1.6; g.stroke();
    const cy = yBot + 22;
    g.fillStyle = hGrad(g, BX - 4, BX + 4, [L.glassA, L.naoh[0], L.glassA]); g.fillRect(BX - 3.5, yBot + 14, 7, TIP.y - yBot - 18);
    g.beginPath(); g.moveTo(BX - 3.5, yBot + 14); g.lineTo(BX - 3.5, TIP.y - 6); g.lineTo(BX - 1.5, TIP.y); g.moveTo(BX + 3.5, yBot + 14); g.lineTo(BX + 3.5, TIP.y - 6); g.lineTo(BX + 1.5, TIP.y); g.stroke();
    A.rrect(g, BX - 17, cy - 7, 34, 14, 7); g.fillStyle = vGrad(g, cy - 7, cy + 7, [L.ptfe, P.dark ? '#a9b2c4' : '#c9ced8']); g.fill(); g.stroke();
    g.translate(BX + 20, cy); g.rotate(st.handle == null ? Math.PI / 2 : st.handle);
    A.rrect(g, -4, -16, 8, 32, 4); g.fillStyle = L.handle; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-2, -13, 1.5, 26);
    g.restore();
    // drops (teardrops) and the stream
    g.save(); g.fillStyle = P.dark ? '#cfe3ff' : '#a9cbeb';
    if (st.flow === 'stream') { g.globalAlpha = 0.85; g.fillRect(TIP.x - 1.4, TIP.y, 2.8, surfaceY() - TIP.y); g.globalAlpha = 1; }
    st.drops.forEach(d => { if (d.stream) return; g.beginPath(); g.moveTo(TIP.x, d.y - 7); g.quadraticCurveTo(TIP.x + 4.5, d.y - 1, TIP.x, d.y + 3.5); g.quadraticCurveTo(TIP.x - 4.5, d.y - 1, TIP.x, d.y - 7); g.fill(); });
    g.restore();
    // the white tile on the base, and the flask on it, swirling
    g.save(); g.shadowColor = 'rgba(0,0,0,0.18)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    A.rrect(g, BX - 92, FLASK.y, 184, 10, 2); g.fillStyle = L.tile; g.fill(); g.restore();
    g.strokeStyle = L.tileEdge; g.lineWidth = 1; A.rrect(g, BX - 92, FLASK.y, 184, 10, 2); g.stroke();
    const sw = st.swirlT > 0 ? Math.sin(t * 16) * 0.05 * Math.min(1, st.swirlT * 2) : 0;
    g.save(); g.translate(BX, FLASK.y); g.rotate(sw);
    flaskPath(g, 0); g.closePath(); g.fillStyle = hGrad(g, -FLASK.body, FLASK.body, [L.glassA, L.glassB, L.glassB, L.glassA]); g.fill();
    // the liquid: its surface tilts as it swirls; clear, the whole flask pink past the equivalence point, a flash where drops land
    const sy = surfaceY() - FLASK.y, ph = pH(), past = st.v - vEq();
    const bulk = ph < 8.2 ? 0 : 0.16 + 0.84 * A.clamp(past / 0.8, 0, 1);
    g.save(); flaskPath(g, 2.2); g.closePath(); g.clip();
    const tilt = sw * 120;
    g.beginPath(); g.moveTo(-90, sy + tilt); g.lineTo(90, sy - tilt); g.lineTo(90, 4); g.lineTo(-90, 4); g.closePath();
    g.fillStyle = vGrad(g, sy, 0, L.water); g.fill();
    if (bulk > 0) { g.fillStyle = A.hexA(PINK, bulk); g.fill(); }
    if (st.flash > 0.01) {
      const gr = g.createRadialGradient(0, sy + 6, 2, 0, sy + 12, 52);
      gr.addColorStop(0, A.hexA(PINK, Math.min(0.95, st.flash))); gr.addColorStop(1, A.hexA(PINK, 0));
      g.fillStyle = gr; g.fill();
    }
    const hw = halfAt(surfaceY()) - 3;
    g.strokeStyle = P.dark ? 'rgba(200,220,255,0.45)' : 'rgba(255,255,255,0.9)'; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(0, sy, hw, 3.2, -sw * 1.6, 0, Math.PI * 2); g.stroke();
    g.restore();
    // printed graduations, the outline, the rim, a shine down the left
    g.strokeStyle = L.print; g.lineWidth = 1.2; g.fillStyle = L.print; g.font = '700 8px ' + A.FONT; g.textAlign = 'left';
    [[-28, '50'], [-52, '100'], [-70, '150']].forEach(([y, lab]) => { const w = halfAt(FLASK.y + y); g.beginPath(); g.moveTo(w - 22, y); g.lineTo(w - 10, y); g.stroke(); g.fillText(lab, w - 40, y + 3); });
    flaskPath(g, 0); g.strokeStyle = L.edge; g.lineWidth = 1.8; g.stroke();
    g.beginPath(); g.ellipse(0, FLASK.top - FLASK.y + 4, FLASK.neck + 2.5, 2.6, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = L.shine; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-FLASK.neck + 4, FLASK.top - FLASK.y + 12); g.lineTo(-FLASK.neck + 4, FLASK.shoulder - FLASK.y - 2); g.lineTo(-FLASK.body + 18, -16); g.stroke();
    g.restore();
    // the lens: a magnified view of the burette at the liquid level, joined to it, read to 0.01 mL
    const r = reading(), Lx = LENS.x, Ly = LENS.y, R = LENS.r;
    g.save(); g.beginPath(); g.arc(Lx, Ly, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = P.dark ? '#0e1830' : '#f6f9fd'; g.fillRect(Lx - R, Ly - R, 2 * R, 2 * R);
    const pxPerMl = 300, tw = 150, tx = Lx - tw / 2;
    g.fillStyle = hGrad(g, tx, tx + tw, [L.glassA, L.glassB, L.glassB, L.glassA]); g.fillRect(tx, Ly - R, tw, 2 * R);
    g.fillStyle = hGrad(g, tx + 6, tx + tw - 6, [L.naoh[1], L.naoh[0], L.naoh[1]]); g.fillRect(tx + 6, Ly, tw - 12, R);
    g.strokeStyle = L.edge; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, Ly - R); g.lineTo(tx, Ly + R); g.moveTo(tx + tw, Ly - R); g.lineTo(tx + tw, Ly + R); g.stroke();
    for (let k = Math.floor((r - 0.6) * 10); k <= Math.ceil((r + 0.6) * 10); k++) {
      const v = k / 10, y = Ly + (v - r) * pxPerMl, len = k % 10 === 0 ? 70 : k % 5 === 0 ? 50 : 32;
      g.lineWidth = k % 10 === 0 ? 2.6 : 1.8; g.strokeStyle = L.ink;
      g.beginPath(); g.moveTo(tx + 6, y); g.lineTo(tx + 6 + len, y); g.stroke();
      if (k % 10 === 0) A.text(g, String(k / 10), tx + len + 14, y + 7, L.ink, 20, 700, 'left');
    }
    g.strokeStyle = P.dark ? '#7fb4ff' : '#2b6cb0'; g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(tx + 6, Ly - 18); g.quadraticCurveTo(Lx, Ly + 18, tx + tw - 6, Ly - 18); g.stroke();
    g.setLineDash([7, 6]); g.strokeStyle = P.dim; g.lineWidth = 1.5; g.beginPath(); g.moveTo(Lx - R, Ly); g.lineTo(Lx + R, Ly); g.stroke(); g.setLineDash([]);
    g.restore();
    // the lens rim, with a glint
    g.save(); g.lineWidth = 9; g.strokeStyle = hGrad(g, Lx - R, Lx + R, L.metal); g.beginPath(); g.arc(Lx, Ly, R + 3, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 6; g.strokeStyle = P.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(Lx, Ly, R - 10, Math.PI * 1.1, Math.PI * 1.35); g.stroke();
    g.restore();
    A.text(g, r.toFixed(2) + ' mL', Lx, Ly + R + 44, L.ink, 28, 700);
  }

  // ---------- controls and the trials table (HTML) ----------
  // The stopcock controls sit on the picture, right beside the burette, so the flask stays in view while they are used.
  // Keyboard (a game-like feel): hold S to stream, D dropwise on / off, F one drop, hold W to swirl, N new trial,
  // 1 / 2 the sample. Arrow keys, Space and P are left alone: presentation view and clickers use them.
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const keys = { s: false, w: false };
  let streamByKey = false;
  function seg(host, items, value, on) {
    const row = el('div', 'ab-seg'); row.setAttribute('role', 'group');
    const bs = items.map(([k, label]) => {
      const b = el('button', 'btn', label); b.type = 'button'; b.setAttribute('aria-pressed', k === value() ? 'true' : 'false');
      b.addEventListener('click', () => { on(k); bs.forEach((x, i) => x.setAttribute('aria-pressed', items[i][0] === value() ? 'true' : 'false')); });
      row.appendChild(b); return b;
    });
    host.appendChild(row);
    return () => bs.forEach((x, i) => x.setAttribute('aria-pressed', items[i][0] === value() ? 'true' : 'false'));
  }
  const kbd = k => ' <kbd class="ab-key">' + k + '</kbd>';
  const oneDrop = () => { if (reading() < 50) st.drops.push({ y: TIP.y }); };
  const setFlow = f => { st.flow = st.flow === f ? 'closed' : f; st.dropT = 0.45; changed(); };
  // sample: a row above the picture. The rig: the burette controls placed on the picture beside the burette.
  function controls(host) {
    const r1 = el('div', 'ab-switch-row');
    const refreshSample = seg(r1, [['HCl', 'HCl sample' + kbd('1')], ['H2SO4', 'H₂SO₄ sample' + kbd('2')]], () => st.sample, setSample);
    host.appendChild(r1);
    st.listeners.push(refreshSample);
  }
  function rig(cv) {
    const wrap = cv.parentNode, box = el('div', 'ab-ti-rig');
    wrap.insertBefore(box, cv); box.appendChild(cv);
    const panel = el('div', 'ab-ti-panel'); panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Burette controls');
    const btn = (html, cls, on) => { const b = el('button', 'btn ' + (cls || ''), html); b.type = 'button'; b.addEventListener('click', on); panel.appendChild(b); return b; };
    const stream = btn('Stream' + kbd('S'), 'ab-ti-flow', () => setFlow('stream'));
    const drop = btn('Dropwise' + kbd('D'), 'ab-ti-flow', () => setFlow('drop'));
    btn('One drop' + kbd('F'), '', oneDrop);
    panel.appendChild(el('span', 'ab-ti-gap'));
    btn('Swirl' + kbd('W'), '', () => { st.swirlT = 1.1; });
    btn('New trial' + kbd('N'), 'primary', newTrial);
    box.appendChild(panel);
    const refresh = () => { stream.setAttribute('aria-pressed', st.flow === 'stream' ? 'true' : 'false'); drop.setAttribute('aria-pressed', st.flow === 'drop' ? 'true' : 'false'); };
    refresh(); st.listeners.push(refresh);
    return box;
  }
  // keys work while the demo is on the stage and nothing is being typed
  const live = () => !!document.querySelector('.ab-ti-panel') && document.querySelector('.ab-ti-panel').isConnected;
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  addEventListener('keydown', e => {
    if (!live() || typing(e) || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 's') { if (!e.repeat) { keys.s = true; if (st.flow !== 'stream') { streamByKey = true; st.flow = 'stream'; changed(); } } }
    else if (k === 'd') { if (!e.repeat) setFlow('drop'); }
    else if (k === 'f') oneDrop();
    else if (k === 'w') { keys.w = true; st.swirlT = Math.max(st.swirlT, 0.6); }
    else if (k === 'n') { if (!e.repeat) newTrial(); }
    else if (k === '1') setSample('HCl');
    else if (k === '2') setSample('H2SO4');
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 's' && keys.s) { keys.s = false; if (streamByKey && st.flow === 'stream') { st.flow = 'closed'; changed(); } streamByKey = false; }
    if (k === 'w') keys.w = false;
  }, true);
  addEventListener('blur', () => { keys.w = false; if (keys.s && streamByKey) { st.flow = 'closed'; changed(); } keys.s = false; streamByKey = false; });
  const ua = () => global.SolUI && global.SolUI.ua;
  function table(host) {
    const box = el('div', 'ab-ti-table'); host.appendChild(box);
    const render = () => {
      const tr = st.trials[st.sample], s = S();
      const rows = tr.map((x, i) => '<tr><th>' + (i + 1) + '</th><td>' + x.i.toFixed(2) + '</td><td>' + x.f.toFixed(2) + '</td><td>' + x.v.toFixed(2) + '</td></tr>').join('');
      const now = st.v > 0 ? '<tr class="is-now"><th>' + (tr.length + 1) + '</th><td>' + st.r0.toFixed(2) + '</td><td>' + reading().toFixed(2) + '</td><td>' + st.v.toFixed(2) + '</td></tr>' : '';
      let calc = '';
      const ok = agreeing(tr);
      if (ok.length >= 2 && ua()) {
        const U = ua(), avg = ok.reduce((a, x) => a + x.v, 0) / ok.length;
        const mol = avg / 1000 * C_NAOH * (s.protons === 2 ? 0.5 : 1), c = mol / (V_SAMPLE / 1000);
        calc = '<div class="ab-calc-line">average of trials ' + ok.map(x => tr.indexOf(x) + 1).join(', ') + ' = ' + avg.toFixed(2) + ' mL</div>' +
          '<div class="ab-calc-line">[' + s.acid + '] = ' + U.chain(avg.toFixed(2) + ' ' + U.x('mL'), U.frac('1 ' + U.x('L'), '1000 ' + U.x('mL')),
            U.frac(C_NAOH.toFixed(4) + ' ' + U.x('mol NaOH'), '1 ' + U.x('L')), U.frac(s.ratio[0], s.ratio[1].replace('mol NaOH', U.x('mol NaOH'))),
            U.frac('1', V_SAMPLE.toFixed(2) + ' ' + U.x('mL')), U.frac('1000 ' + U.x('mL'), '1 L')) + ' <span class="ab-ans">= ' + c.toFixed(4) + ' M</span></div>';
      }
      box.innerHTML = '<table class="ab-table ab-ti-trials"><thead><tr><th>Trial</th><th>Initial (mL)</th><th>Final (mL)</th><th>Volume NaOH (mL)</th></tr></thead><tbody>' +
        (rows + now || '<tr><td colspan="4" class="is-empty">–</td></tr>') + '</tbody></table>' +
        (calc ? '<div class="ab-eqn ab-calc">' + calc + '</div>' : '');
    };
    render();
    st.listeners.push(render);
    // the live row follows the stream
    let last = -1;
    const tick = () => { if (!box.isConnected) return; if (st.v !== last) { last = st.v; render(); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  // the biggest group of trials that agree within 0.10 mL of each other
  function agreeing(tr) {
    let best = [];
    tr.forEach(a => {   // every trial from a.v up to 0.10 mL above it
      const grp = tr.filter(b => b.v >= a.v - 1e-9 && b.v - a.v <= 0.10 + 1e-9);
      if (grp.length > best.length) best = grp;
    });
    return best;
  }
  // dev hooks for headless screenshots: ?ti=20.80 (mL delivered) &trials=21.30,20.78,20.80 &sample=H2SO4
  const q = new URLSearchParams(location.search);
  if (q.get('sample') && SAMPLES[q.get('sample')]) st.sample = q.get('sample');
  if (q.get('trials')) q.get('trials').split(',').forEach((v, i) => st.trials[st.sample].push({ i: STARTS[i % STARTS.length], f: STARTS[i % STARTS.length] + +v, v: +v }));
  if (q.get('ti')) st.v = +q.get('ti');
  function demo() {
    st.listeners = [];   // the stage was rebuilt: old controls are gone
    return { draw, controls, rig, table, swirl: () => { st.swirlT = 1.1; }, state: st, vEq };
  }

  // ---------- the glassware bench: drawn to look like the real equipment, each piece a button ----------
  const PIECES = [
    ['burette', 'Burette'], ['pipette', 'Pipette and bulb'], ['erlenmeyer', 'Erlenmeyer flasks (three, one for each trial)'],
    ['waste', 'Waste beakers'], ['indicator', 'Indicator (phenolphthalein)'], ['tile', 'White tile'], ['wash', 'Wash bottle']
  ];
  const DEFS = '<defs>' +
    '<linearGradient id="bGlass" x1="0" x2="1"><stop offset="0" class="bg-e"/><stop offset="0.16" class="bg-s"/><stop offset="0.32" class="bg-c"/><stop offset="0.78" class="bg-c"/><stop offset="1" class="bg-e"/></linearGradient>' +
    '<linearGradient id="bLiq" x1="0" x2="1"><stop offset="0" class="bl-e"/><stop offset="0.5" class="bl-c"/><stop offset="1" class="bl-e"/></linearGradient>' +
    '<linearGradient id="bMetal" x1="0" x2="1"><stop offset="0" class="bm-a"/><stop offset="0.45" class="bm-b"/><stop offset="1" class="bm-c"/></linearGradient>' +
    '<linearGradient id="bBase" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="bb-a"/><stop offset="1" class="bb-b"/></linearGradient>' +
    '<linearGradient id="bAmber" x1="0" x2="1"><stop offset="0" stop-color="#5e3a17"/><stop offset="0.3" stop-color="#a0682e"/><stop offset="1" stop-color="#5e3a17"/></linearGradient>' +
    '<linearGradient id="bRubber" x1="0" x2="1"><stop offset="0" stop-color="#2f333b"/><stop offset="0.35" stop-color="#6b717d"/><stop offset="1" stop-color="#2f333b"/></linearGradient>' +
    '<linearGradient id="bPoly" x1="0" x2="1"><stop offset="0" class="bp-e"/><stop offset="0.3" class="bp-c"/><stop offset="1" class="bp-e"/></linearGradient>' +
    '<filter id="bShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.22"/></filter>' +
    '</defs>';
  const ticks = (x, y0, n, dy, long) => Array.from({ length: n }, (_, i) => '<line x1="' + x + '" x2="' + (x + (i % long ? 5 : 9)) + '" y1="' + (y0 + i * dy) + '" y2="' + (y0 + i * dy) + '" class="b-tick"/>').join('');
  const shine = d => '<path d="' + d + '" class="b-shine"/>';
  const ERL = '<path d="M131 356 V372 L100 404 Q98 408 103 408 L181 408 Q186 408 184 404 L153 372 V356" fill="url(#bGlass)" class="b-edge"/>' +
    '<path d="M110 394 L174 394 L183 404 Q185 407.5 181 407.5 L103 407.5 Q99 407.5 101 404 Z" fill="url(#bLiq)"/>' +
    '<ellipse cx="142" cy="356" rx="13" ry="2.4" class="b-rim"/>' + shine('M135 362 V374 L110 401') +
    '<line x1="160" x2="168" y1="385" y2="385" class="b-print"/><line x1="156" x2="164" y1="378" y2="378" class="b-print"/>';
  function beaker(cx) {   // a 250 mL beaker with a spout, a little liquid, printed graduations and WASTE
    const x0 = cx - 34, x1 = cx + 34;
    return '<path d="M' + (x0 - 5) + ' 318 Q' + x0 + ' 319 ' + x0 + ' 324 V400 Q' + x0 + ' 408 ' + (x0 + 8) + ' 408 H' + (x1 - 8) + ' Q' + x1 + ' 408 ' + x1 + ' 400 V320" fill="url(#bGlass)" class="b-edge"/>' +
      '<path d="M' + (x0 + 2) + ' 384 H' + (x1 - 2) + ' V400 Q' + (x1 - 2) + ' 406 ' + (x1 - 8) + ' 406 H' + (x0 + 8) + ' Q' + (x0 + 2) + ' 406 ' + (x0 + 2) + ' 400 Z" fill="url(#bLiq)"/>' +
      [0, 1, 2].map(i => '<line x1="' + (x1 - 14) + '" x2="' + (x1 - 4) + '" y1="' + (338 + i * 18) + '" y2="' + (338 + i * 18) + '" class="b-print"/>').join('') +
      '<text x="' + cx + '" y="370" class="b-waste">WASTE</text>' + shine('M' + (x0 + 6) + ' 328 V398');
  }
  const ART = {
    // stand, boss head, clamp and the burette with its stopcock
    burette: '<rect x="40" y="398" width="200" height="16" rx="5" fill="url(#bBase)" filter="url(#bShadow)"/>' +
      '<rect x="70" y="40" width="9" height="362" fill="url(#bMetal)"/>' +
      '<rect x="64" y="150" width="21" height="20" rx="3" fill="url(#bMetal)"/><rect x="85" y="156" width="45" height="8" fill="url(#bMetal)"/>' +
      '<rect x="128" y="146" width="6" height="28" rx="2" fill="url(#bRubber)"/><rect x="150" y="146" width="6" height="28" rx="2" fill="url(#bRubber)"/>' +
      '<rect x="133" y="28" width="18" height="268" rx="2" fill="url(#bGlass)" class="b-edge"/>' +
      '<rect x="135" y="96" width="14" height="200" fill="url(#bLiq)"/>' +
      '<path d="M135 96 Q142 101 149 96" class="b-men"/>' +
      ticks(135, 40, 26, 10, 5) +
      shine('M137 34 V290') +
      '<path d="M133 296 Q133 304 139 310 L145 310 Q151 304 151 296" fill="url(#bGlass)" class="b-edge"/>' +
      '<rect x="128" y="310" width="28" height="11" rx="5.5" class="b-ptfe"/><rect x="156" y="300" width="7" height="30" rx="3.5" class="b-handle"/>' +
      '<path d="M139 321 V346 L141 352 L143 346 V321" fill="url(#bGlass)" class="b-edge"/>',
    erlenmeyer: [0, 228, 318].map(dx => '<g transform="translate(' + dx + ' 0)">' + ERL + '</g>').join(''),
    // two waste beakers, for the rinsings
    waste: [538, 620].map(beaker).join(''),
    tile: '<rect x="86" y="408" width="112" height="8" rx="2" class="b-tile" filter="url(#bShadow)"/>',
    // a volumetric pipette with a rubber pipette filler
    pipette: '<ellipse cx="282" cy="66" rx="17" ry="21" fill="url(#bRubber)"/><rect x="278" y="84" width="8" height="12" rx="2" fill="url(#bRubber)"/>' +
      '<rect x="279" y="96" width="6" height="62" fill="url(#bGlass)" class="b-edge"/><line x1="276" x2="288" y1="122" y2="122" class="b-tick"/>' +
      '<ellipse cx="282" cy="196" rx="14" ry="40" fill="url(#bGlass)" class="b-edge"/>' +
      '<path d="M269 210 Q282 214 295 210 Q294 230 282 236 Q270 230 269 210 Z" fill="url(#bLiq)"/>' + shine('M274 172 Q272 196 274 220') +
      '<rect x="279" y="236" width="6" height="140" fill="url(#bGlass)" class="b-edge"/><path d="M279 376 L282 392 L285 376" class="b-edge" fill="url(#bGlass)"/>',
    // a volumetric flask: a flat-bottomed bulb, a long neck, the etched line, a stopper
    indicator: '<g transform="translate(150 0)"><rect x="528" y="318" width="64" height="86" rx="10" fill="url(#bAmber)" filter="url(#bShadow)"/><rect x="546" y="300" width="28" height="20" rx="3" fill="url(#bAmber)"/>' +
      '<rect x="547" y="286" width="26" height="16" rx="3" fill="#1f2228"/><path d="M552 286 Q560 250 568 286 Z" fill="url(#bRubber)"/>' +
      '<rect x="536" y="342" width="48" height="34" rx="3" class="b-label"/><text x="560" y="356" class="b-labtext">phenol-</text><text x="560" y="368" class="b-labtext">phthalein</text>' +
      shine('M535 326 V396'),
    // a squeeze wash bottle with a bent nozzle + '</g>',
    wash: '<g transform="translate(130 0)"><path d="M648 300 Q648 290 660 288 L700 288 Q712 290 712 300 V396 Q712 406 700 406 H660 Q648 406 648 396 Z" fill="url(#bPoly)" class="b-poly" filter="url(#bShadow)"/>' +
      '<path d="M650 330 H710 V396 Q710 404 700 404 H660 Q650 404 650 396 Z" fill="url(#bLiq)" opacity="0.7"/>' +
      '<rect x="664" y="268" width="32" height="22" rx="4" class="b-cap"/><path d="M680 268 V236 Q680 226 690 222 L728 206" class="b-nozzle"/>' +
      '<text x="680" y="372" class="b-labtext b-wtext">H₂O</text>' + shine('M656 300 V392') + '</g>'
  };
  function bench(host, onPick) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const wrap = el('div', 'ab-bench');
    const name = el('div', 'ab-eqn ab-bench-name'); name.setAttribute('aria-live', 'polite');
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 860 440'); svg.setAttribute('class', 'ab-bench-svg');
    svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', 'Titration glassware');
    svg.innerHTML = DEFS;
    const nodes = {};
    PIECES.forEach(([k, label]) => {
      const gEl = document.createElementNS(svgNS, 'g');
      gEl.setAttribute('class', 'b-piece'); gEl.setAttribute('tabindex', '0'); gEl.setAttribute('role', 'button'); gEl.setAttribute('aria-label', label);
      gEl.innerHTML = ART[k];
      const pick = () => {
        Object.keys(nodes).forEach(x => nodes[x].classList.toggle('is-on', x === k));
        name.textContent = label;
        if (onPick) onPick(k);
      };
      gEl.addEventListener('click', pick);
      gEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      svg.appendChild(gEl); nodes[k] = gEl;
    });
    // small names on the bench
    [['burette', 142, 18], ['pipette', 282, 32], ['Erlenmeyer flasks', 410, 434], ['waste beakers', 579, 300], ['indicator', 710, 240], ['wash bottle', 812, 196], ['white tile', 142, 434]].forEach(([n, x, y]) => {
      const tEl = document.createElementNS(svgNS, 'text');
      tEl.setAttribute('x', x); tEl.setAttribute('y', y); tEl.setAttribute('class', 'b-name' + (n === 'white tile' ? ' b-name-l' : '')); tEl.textContent = n;
      svg.appendChild(tEl);
    });
    wrap.append(svg, name); host.appendChild(wrap);
    name.innerHTML = '&nbsp;';
    return { pick: k => nodes[k] && nodes[k].dispatchEvent(new Event('click')), pieces: PIECES.map(p => p[0]) };
  }

  global.AbTitration = { demo, bench, SAMPLES, C_NAOH, V_SAMPLE };
})(window);
