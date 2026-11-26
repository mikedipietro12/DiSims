# Design Plan: Chemical Bonding (Chem 11H)

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Ship a Chem 11H Chemical Bonding module: a hub, a 33-beat Guide (Ch A / B / C) with draw and practice beats, a Draw Lab, and a presentation mode. Touch-first, Toy Box identity, built as IMF's prequel.

**Design Direction:** Brief `docs/designpowers/briefs/2026-11-10-chemical-bonding.md` · Strategy `docs/designpowers/strategy/2026-11-10-chemical-bonding-strategy.md` (beat list is the source of truth)

**Personas:** Chem 11H student fresh from Unit 1b, on a touch screen (stylus or finger). The teacher in presentation mode (clicker, live drawing on the projector). See the brief's Users section.

**Principles to enforce every task:** The count teaches, never grades · Paper before sphere · One canvas for every hand · Built as IMF's on-ramp · Big motion, never in the way

---

## Tech decisions (proposed - confirm at plan approval)

| Area | Choice | Why |
|------|--------|-----|
| Draw engine | **SVG + Pointer Events**, own code | Crisp at projector scale; big DOM hit targets; `pointerType` gives pen vs touch for palm rejection; SVG serialises cleanly to JPEG |
| Lewis logic | Pure JS module, no DOM (`lewis-model.js`) | Testable on its own; the same model drives the tally, "Show one structure", VSEPR and 3D |
| 3D turntable | **three.js** (pinned CDN version) | Real lighting for spheres and lone-pair lobes; turntable is easy to constrain |
| Orchestrated animation | **GSAP** (pinned CDN version) | Interruptible timelines (`progress(1)` = "tap settles it"); orbital-combine and lift-to-3D sequences |
| Charge clouds (Ch A) | Reuse IMF's cloud look; spike first on whether `imf-engine.js` can render a two-atom cloud with a ΔEN shift, else a small `cloud.js` using the same tokens | Principle 4 without dragging in 2,700 lines of physics |
| Chrome / tokens | Link `../intermolecular-forces/assets/suite.css` + a thin `bonding.css` | One Toy Box source, no fork |
| Guide scroll + presentation | Port IMF guide's beat / IntersectionObserver / learn-mode pattern into a reusable `guide-shell.js` | Proven clicker stepping; adds chapter jump |
| Build step | **None** | Static GitHub Pages; CDN ES modules are enough |

---

## Task 0: Taste pass - paper inside the toy box ✅ (Direction A locked 2026-11-10)

**Files:** `chemical-bonding/taste-paper.html` (dev only, `noindex`) · `docs/designpowers/taste/2026-11-10-chemical-bonding-taste.md`

- [x] Step 1: 2–3 live directions for the draw canvas inside Toy Box chrome (e.g. bright tray with a paper card; dotted graph paper; whiteboard), each showing the same CO₂ and NH₄⁺ build
- [x] Step 2: Lock Lewis notation style: atom symbol treatment, bond strokes, lone-pair dots, brackets + charge, formal-charge marks, wedge/dash, tally typography (Space Mono)
- [x] Step 3: Lock how "count is off" shows (sign + text, never red/yellow, which are reserved for charge)

**Accessibility check:** Ink contrast ≥ 4.5:1 on the paper surface; FC marks and tally readable at projector distance; off-count state carries text.

**Verification:** User picks a direction; recorded in design-state Taste Profile.

---

## Task 1: Module structure, hub and course link ✅

**Files:** `chemical-bonding/index.html` · `guide.html` · `lab.html` (stubs) · `chemistry-11h/index.html` · `sitemap.xml`

- [x] Step 1: Hub with two cards: **Guide** (primary) and **Draw Lab**; Presentation-mode note on the Guide card
- [x] Step 2: Chem 11H hub card placed **between Atomic Structure and Intermolecular Forces**
- [x] Step 3: SEO head block, favicon links and sitemap entries per repo `AGENTS.md`; dev pages `noindex`

**Accessibility check:** Cards keyboard-focusable; unique page titles; teasers not colour-only.

**Verification:** From `chemistry-11h/` you can reach the hub, Guide stub and Lab stub.

---

## Task 2: Bonding kit (data) ✅

**Files:** `chemical-bonding/assets/bonding-kit.js`

- [x] Step 1: Elements used anywhere in the module: symbol (proper case), Z, valence e⁻, Pauling EN, model-kit colour (from IMF), `canExpand` (period ≥ 3)
- [x] Step 2: Molecule roster with **reference Lewis structures** (atoms, bonds, lone pairs, charges) and resonance sets. It covers every demo, all practice sets (including the teacher's starter list: H₂, HBr, PCl₃, SF₂, H₂CCH₂, HNNH, H₂CNH, NO⁻, N₂, CO, CN⁻) and the Lab
- [x] Step 3: Per molecule: electron-domain count, VSEPR shape name, ideal angles, polarity + reason; for C-containing beats, hybridization per carbon
- [x] Step 4: Salts data, melting point focus (user): NaF, NaCl, NaBr, NaI, KCl, KBr, MgO, CaO with mp (CRC) and Shannon ionic radii; sources noted in the kit

**Accessibility check:** Every molecule has a text name and description for screen readers.

**Verification:** One source for every molecule in the Guide and Lab; no one-off definitions in pages.

---

## Task 3: Lewis model + tally (logic only) ✅ (206 / 206 tests, node + browser)

**Files:** `chemical-bonding/assets/lewis-model.js` · `chemical-bonding/dev/lewis-tests.html` (noindex)

- [x] Step 1: Graph model: add/move/remove atom; bond order 0–3; lone pairs per atom; bracket + overall charge
- [x] Step 2: Tally: valence total (adjusted for ion charge), electrons placed, electrons per atom (octet / duet for H / expanded allowed when `canExpand`), formal charge per atom, sum of FC vs overall charge
- [x] Step 3: Tally output as **working, not verdict**, e.g. `O · 2 bonds + 2 lone pairs = 8 · FC 0` and `Placed 14 / 16`
- [x] Step 4: Structural match against references (connectivity + bond orders + lone pairs, ignoring layout). Used only to say *which* reference to reveal, never to grade
- [x] Step 5: Test page: every reference in the kit tallies to the right total and FCs; CO gives C −1 / O +1; resonance members are equivalent

**Accessibility check:** Tally strings are complete sentences for `aria-live`.

**Verification:** Test page green for the whole roster.

---

## Task 4: Draw engine - electron model ✅ (13/13 pointer + keyboard self-tests; rebuilt 2026-11-10 per user notes)

**Files:** `chemical-bonding/assets/draw-engine.js` · `bonding.css` · `dev/draw-test.html`

- [x] Step 1: SVG stage; `touch-action: none` on the stage only (page scrolls around it)
- [x] Step 2: Palette click places an atom **with its valence electrons as dots** (Lewis dot symbol); drawing re-centres
- [x] Step 3: **Drag an electron onto another atom's electron → share one each** (bond; the dots join the line). **Onto its letter → give a pair** (coordinate bond: FC appears naturally). **Metals transfer** the electron instead (ions in brackets)
- [x] Step 4: **Drag a letter → move.** Click a bond → break one shared pair (electrons return to whoever gave them). A newly bonded loose atom snaps to bond length in an open direction
- [x] Step 5: Tools: Erase · +e⁻ · −e⁻ (ions) · Undo · Clear; brackets + charge per charged fragment (no charge stepper)
- [x] Step 6: ~~Pen-aware palm rejection~~: removed, no stylus features (user)
- [x] Step 7: Keyboard path: focus atom, Enter picks up an electron, Enter on another atom shares (Shift+Enter gives a pair); arrows move; + / − electrons; Delete; bonds: Enter breaks a pair
- [x] Step 8: Live tally; **hover an atom → its count and formal charge row is highlighted**; rows select atoms
- [x] Step 9: FC modes `teach` (full equation) / `compact` / `off`
- [x] Step 10: Ink-only rendering (taste A)

**Accessibility check:** Every drag has a tap path; full keyboard path; tally announced; off-count atoms marked with sign + text.

**Verification:** Self-test builds CO₂ (shares), CO (given pair, FC −1/+1), NH₄⁺ (−e⁻ + given pair, brackets), Na⁺Cl⁻ (transfer), HCl by keyboard; refuses an impossible give with a message.

---

## Task 5: Draw engine - reveal, resonance, export ✅ (19/19 self-tests incl. JPEG)

**Files:** `draw-engine.js` · `bonding.css`

- [x] Step 1: **"Show one structure"** opens a panel beside the drawing (never over it). Reference = the beat's `reference` (kit id) or, in the Lab, the kit molecule with exactly the atoms drawn
- [x] Step 2: Resonance: every form from `LewisModel.resonanceForms`, joined by ↔, with a one-line "blend" note
- [x] Step 3: **Save JPEG**: drawing painted straight onto a canvas (live Space Grotesk / Mono), title = formula + name when the skeleton matches a reference, else "My Lewis structure"; electron count + date; download on laptops, share sheet on touch devices that support files

**Accessibility check:** Reveal is a button with `aria-expanded`; each reference SVG has a text label; the export carries the formula as text.

**Verification:** Self-test: water auto-matched from H, O, H; drawing untouched by reveal; O₃ 2 forms, NO₃⁻ 3 forms; JPEG blob `image/jpeg` (~31 KB). Share-sheet path still to check on a real tablet (Task 15).

---

## Task 6: Guide shell + presentation mode ✅ (10/10 keyboard self-tests; 33 beats live with draft copy)

**Files:** `assets/guide-shell.js` · `assets/scenes/draw-scene.js` · `guide.html` · `bonding.css` · `dev/guide-test.js`

- [x] Step 1: IMF scroll sync ported (reading line + hysteresis); each beat names a scene (`data-scene`), the shell mounts / updates / destroys it with a crossfade. Wider sticky stage (up to 640 px) to hold the draw engine
- [x] Step 2: Chapters A · B·1 · B·2 · B·3 · C with headers, TOC chips, auto-numbered kickers ("B·1 · 5 of 10 · Draw")
- [x] Step 3: Presentation mode (P or `?present=1`): one beat at a time, **text large on the left, stage on the right**; arrows / Page keys / space / clicker step; Home / End; Esc exits; **T hides the text** (stage full width); chapter jump menu; beat counter; draw engine at 1.35× with bigger buttons
- [x] Step 4: Nothing waits on animation: stepping calls `settle()` on the active scene; arrow keys inside the drawing never step beats
- [x] Step 5: ~~Practice carousel~~ → **one tray per beat** (user): every molecule in `data-set` is built on the same tray under a blue prompt; "Show one structure" lists each; tally grouped per molecule; `data-load` + `data-letters` for side-by-side comparisons (beat 13); FC off until beat 13

Draw / practice beats already live on the real engine: 6 (ionic transfer), 10, 11★, 12, 13, 14★, 15, 16 (resonance, preloaded + revealed), 17, 18★. All other beats show a labelled placeholder scene until their task lands.

**Run the test:** temporarily add `<script src="dev/guide-test.js"></script>` after `GuideShell.init()` and open `guide.html?selftest=1`.

---

## Task 7: Chapter A scenes (beats 1–8) 🟡 first pass 2026-11-11

**Files:** `guide.html` · `assets/scenes/ch-a.js` (+ `cloud.js` if the spike says so)

- [ ] Step 1: Beat 1: electron configuration → valence electrons → dot symbol (animated collapse, Unit 1b continuity; no Bohr imagery)
- [ ] Step 2: Beats 2–4: H₂ even cloud; **EN-difference slider** with two element pickers, cloud shift + δ± pills; continuum bands with fuzzy edges
- [ ] Step 3: Beat 5: Cl₂, HCl, H₂O examples
- [ ] Step 4: Beat 6: ionic dot transfer (drag Na's dot to Cl; Mg → O); charges and formula derived from the count
- [ ] Step 5: Beats 7–8: ion pair → lattice; **salts side by side** by melting point: size series NaF → NaI, charge pair NaF vs MgO (discussion prompt, no prediction entry)

**Accessibility check:** Slider has keyboard steps and a text readout (ΔEN value + bond type); δ signs always shown; salt data as text, not bars alone.

**Verification:** The EN slider moves smoothly from nonpolar to ionic, and the colours match IMF exactly.

---

## Task 8: Chapter B·1 - Lewis structures (beats 9–18)

**Files:** `guide.html` · `assets/scenes/ch-b.js`

- [ ] Step 1: Beat 9: "the count" explainer scene
- [ ] Step 2: Draw beats 10, 12, 13, 15, 17 wired to the builder with beat-specific palettes and molecules
- [ ] Step 3: Beats 12–13 use FC **teach** mode (full equation per atom); beat 13 compares two CO₂ arrangements side by side. ★14 onward uses **compact** mode
- [ ] Step 4: Beat 16: resonance (O₃, NO₃⁻) using the resonance display
- [ ] Step 5: Practice beats ★11, ★14, ★18 with the agreed sets

**Accessibility check:** Each draw beat has written instructions that name the molecule and its total valence electrons.

**Verification:** Every B·1 molecule can be built and revealed; CO shows C −1 / O +1.

---

## Task 9: Chapter B·2 - VSEPR (beats 19–22) 🟡 first pass 2026-11-11

**Files:** `assets/scenes/ch-b.js` · `assets/vsepr2d.js`

- [ ] Step 1: 2D wedge/dash + silhouette renderer driven by domain count and lone pairs. **Colour starts here**: model-kit atom hues enter with VSEPR
- [ ] Step 2: Beats 19–21: 2–4 domains; CH₄ → NH₃ → H₂O angle squeeze; 5/6-domain gallery
- [ ] Step 3: ★22 Name-the-shape practice (count domains → choose silhouette → reveal shape)

**Accessibility check:** Shape names and angles as text; silhouettes have labels.

**Verification:** All five practice molecules show correct shapes and angles. Paper before sphere holds: no 3D yet.

---

## Task 10: Chapter B·3 - Polarity (beats 23–25) 🟡 first pass 2026-11-11

**Files:** `assets/scenes/ch-b.js`

- [ ] Step 1: Bond-dipole arrows (cross-tail arrow + δ±) summed by shape; CO₂ vs H₂O
- [ ] Step 2: ✎ Beat 24 "What if…": swap an atom or change the shape, predict, then reveal the net dipole
- [ ] Step 3: ★25 polarity sort: cards flip to show their dipole sum

**Accessibility check:** Net dipole stated in text ("Net dipole: none, the pulls cancel").

**Verification:** CCl₄ → CHCl₃ and BF₃ → NH₃ show the polarity change clearly.

---

## Task 11: 3D turntable + lift-from-Lewis 🟡 first pass 2026-11-11 (three.js r128, no GSAP: own tweens)

**Files:** `assets/turntable.js` · `assets/vsepr3d.js`

- [ ] Step 1: three.js scene: Toy Box spheres, bonds, **IMF-style lone-pair lobes**, δ± tint optional
- [ ] Step 2: Geometry from the Lewis model: domains → ideal positions; lone pairs take equatorial slots in 5-domain molecules
- [ ] Step 3: Turntable: horizontal drag spins about the vertical axis, tilt clamped ±25°, no zoom or pan, eases to a stop; presets **Front · Top · Side · Down a bond**; angle labels toggle; arrow keys + number keys
- [ ] Step 4: **Lift** animation: the student's 2D drawing rises into 3D in a side-by-side panel (the drawing stays put)

**Accessibility check:** Presets as buttons; shape and angles in text beside the canvas.

**Verification:** Every roster molecule lifts to the right shape; the camera can't be lost.

---

## Task 12: Chapter C - Hybridization (beats 26–33) 🟡 first pass 2026-11-11

**Files:** `assets/scenes/ch-c.js` · `assets/orbitals.js`

- [ ] Step 1: Orbital diagram (labelled boxes + arrows) for C: 2s² 2p² → promote → combine
- [ ] Step 2: Orbital-shape view (s sphere + p dumbbells → hybrid lobes) on the turntable
- [ ] Step 3: Beats 27–29: ethane sp³ / ethene sp² + p (π) / ethyne sp + 2 p (2 π), with angles; ethene calls back to the H₂CCH₂ practice
- [ ] Step 4: Beat 30: domains ↔ hybridization ↔ angle table
- [ ] Step 5: ★31 label-each-carbon practice (propene, propyne, H₂CNH)
- [ ] Step 6: ✎ Beat 32: lift to 3D (payoff); beat 33: "which picture shows what?" + IMF hand-off card

**Accessibility check:** Orbital boxes labelled (2s, 2p, sp³…), not colour-only; π vs σ stated in text.

**Verification:** A student can watch s + p combine into each hybrid and see its angle.

---

## Task 13: Draw Lab ✅ (2026-11-25, 24 / 24 self-test)

**Files:** `lab.html`

- [x] Step 1: Roster picker (grouped: starter list · ions · resonance · expanded · Ch C) + blank canvas
- [x] Step 2: Full builder + tally + "Show one structure" + resonance
- [x] Step 3: **Lift to 3D**, available from day one
- [x] Step 4: Save JPEG; presentation-scale toggle for teacher use

**Accessibility check:** Same input paths as the Guide; picker is keyboard-navigable.

**Verification:** Every roster molecule is buildable, revealable, liftable and exportable.

---

## Task 14: Content pass (content-writer)

**Files:** `guide.html` (all beat copy) · `lab.html` microcopy

- [ ] Step 1: Full teaching copy for all 33 beats (sim carries the teaching)
- [ ] Step 2: Repo copy rules: no personified particles; "spheres, not balls"; proper element casing
- [ ] Step 3: Terms defined once, then used consistently; plain language for EAL readers

**Accessibility check:** Reading level checked; every scene has a text equivalent.

**Verification:** Copy review against the learning intentions and success criteria (see traceability below).

---

## Task 15: Verify, critique, review

- [ ] Step 1: Device pass: iPad + Pencil, finger-only tablet, touch Chromebook, laptop + trackpad, projector
  - _Constraint (2026-11-10): built on a MacBook; tablets only once pages are live. Interim: trackpad + Chrome DevTools touch emulation. Pen / palm rejection / iOS Safari (download vs share sheet for JPEG) need a live preview URL._
- [ ] Step 2: Presentation dry-run: whole Guide by clicker, including a live build
- [ ] Step 3: designpowers-critique + accessibility-reviewer in parallel; fixes; debt logged

**Verification:** Success metrics from the strategy are met or logged as debt.

---

## Build order

```
0 Taste ─┐
1 Structure → 2 Kit → 3 Lewis model → 4 Draw core → 5 Reveal/export
                                   ↘ 6 Guide shell ─→ 7 Ch A
                                                    → 8 Ch B·1 (needs 4–5)
                                                    → 9 B·2 → 10 B·3
                          11 Turntable (needs 3) ──→ 12 Ch C → 13 Lab
                                                              → 14 Copy → 15 Verify
```
Task 0 must land before Task 4's styling; Task 3 and 6 can run in parallel.

---

## Traceability: success criteria → beats

| Success criterion | Where it lives |
|----|----|
| **A · QP** predict behaviour from EN / IE, more than one outcome | 3 EN slider · 4 continuum · 6 ionic transfer · 8 salts discussion |
| **A · AI** range of strategies (drawing, trends, EN rules) | 3 · 5 · 6 (draw) · 8 |
| **A · C** communicate atomic structure → behaviour | 1 · 4 · 8 (discussion prompt) |
| **B · Q&P** hypothesise polarity changes from bond polarity / shape | 23 · ✎24 What if · ★25 |
| **B · PAI** construct Lewis, VSEPR, models; predict shape | 9–18 (draw + ★11/14/18) · 19–22 · Lab |
| **B · E** evaluate Lewis vs 3D | 32 lift side by side · 33 which picture shows what · Lab |
| **B · C** communicate shape + EN + polarity with conventions | 19–25 · δ± convention throughout |
| **C · LI** hybridization predicts shape at an atom | 26–29 · ★31 |
| **C · LI** hybridization ↔ common angles | 27–30 · ★31 |
