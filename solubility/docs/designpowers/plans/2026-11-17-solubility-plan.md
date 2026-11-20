# Design Plan: Solubility & Ksp (AP Chem 12)

> **For agentic workers:** Review completed work against this plan and the five principles before marking a task done.

**Status:** Approved (2026-11-17). Full scope, proposed order; target: the next few days.

**Goal:** Ship an AP Chem 12 suite with a hub, a Guide in four Parts (one per lesson, each opening with its own Before you begin card, presentation view), a Sandbox (dissolve, push, mix, with live real numbers) and a Qual Lab (follow a scheme on random Pb²⁺ / Sr²⁺ / Mg²⁺ unknowns).

**Design Direction:** Brief `docs/designpowers/briefs/2026-11-17-solubility.md` · Strategy `docs/designpowers/strategy/2026-11-17-solubility-strategy.md`

**Persona:** AP Chem 12 student after the equilibrium unit; the teacher presenting the Guide as the lesson. Laptop, tablet and projector.

**Principles to enforce every task:** Same K, now for a solid · Every number has a picture · The Guide explains, the rooms measure · Rehearse the method, keep the labs' secrets · Readable from the back row, and without colour

**Hard rules every task:** no kidney-stone chemistry · no Ag⁺ / Ba²⁺ / Fe³⁺ in the Qual Lab · no eyebrow labels above headings · no em dashes in student copy · no personified ions · no dot-grid backgrounds · lively animation that a tap or step settles instantly

**Proposed order:** Task 1 (done) → **Task 2 (taste, early)** → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Tasks 6 and 7 run **Part by Part**, so Part 1 can be used in class before Parts 2 to 4 exist.

---

## Task 1: Suite structure & AP 12 hub entry

**Files:** `solubility/index.html` · `guide.html` · `sandbox.html` · `qual-lab.html` (stubs) · `assets/sol.css` · `ap-chemistry-12/index.html` · `index.html`

- [x] Step 1: Hub with Guide / Sandbox / Qual Lab tiles and a Le Châtelier refresher tile, suggested order, no locks. Four across, 2 × 2 on tablets.
- [x] Step 2: "Solubility & Ksp" card on the AP 12 hub, after Equilibrium Simulations (7 → 8 sims); course descriptions mention solubility.
- [x] Step 3: Room switcher (Hub · Guide · Sandbox · Qual Lab) via `suite-chrome.js`; unique titles; all pages `noindex` until they ship.

**Accessibility check:** Links focusable, unique titles, no eyebrow labels on tiles.

**Verification:** From `ap-chemistry-12/` a student can open the suite and reach every room. (Done 2026-11-16/17.)

---

## Task 2: Taste pass (tokens), early

**Files:** `docs/designpowers/taste/2026-11-17-solubility-taste.md` · `assets/sol.css` · `taste-directions.html` (noindex comparison page)

- [x] Step 1: Two or three directions on one live comparison page (as Intro to Equilibrium did): cation / anion colours (red/yellow stays reserved for δ+ / δ−), the solid, water, and the Q vs Ksp gauge (<, =, > with position, not colour alone).
- [x] Step 2: Real precipitate colours as fixed tokens: yellow PbI₂, white AgCl / SrSO₄ / CaCO₃ / Mg(OH)₂, red-brown Ag₂CrO₄. Check that the white solids still read against water and the stage.
- [x] Step 3: Projector check: readouts and gauge at presentation size (1280 × 720 and 1920 × 1080). _Done in Task 5 on `dev/ui.html` (2026-11-17)._
- [x] Step 4: Repaint the three hub tile animations with the chosen tokens.

**Accessibility check:** Every colour pair has a glyph or text partner; contrast checked on white and on water tint.

**Verification:** User picks a direction on the comparison page; tokens land in `sol.css`.

---

## Task 3: Salt & reagent kit (data)

**Files:** `solubility/assets/salts.js`

- [x] Step 1: Sandbox salts, one entry each: AgCl · PbI₂ · Ag₂CrO₄ · Mg(OH)₂ · CaCO₃. Each carries formula, molar mass (booklet atomic masses), ions and their counts, Ksp at 25 °C (**BC Chemistry 12 Data Booklet only**), solid colour, a plain-language label, and flags for pH sensitivity (basic anion) and temperature data (ΔH_soln where reliable; PbI₂ = 8.5e-9 and +70 kJ/mol, same as `equilibrium_simulations.html`).
- [x] Step 2: Common-ion salts (NaCl, KI, NaF, etc.) and the acid.
- [x] Step 3: Qual Lab ions and reagents: Pb²⁺ / Sr²⁺ / Mg²⁺; KI, Na₂SO₄, NaOH; Ksp for every possible solid in the booklet (PbI₂, PbSO₄, SrSO₄, Mg(OH)₂) plus the soluble ones per the booklet's rules (SrI₂, MgI₂, MgSO₄).
- [x] Step 4: Guide example data: solubility-rule chips (soluble or not, with a one-line reason), the AgCl and PbI₂ worked examples, the "smaller Ksp isn't always less soluble" pair, real-life observation cards.

**Accessibility check:** Every species has a spoken name ("lead(II) iodide") as well as a formula.

**Verification:** Every number in every room comes from this one file. A scheme check at the chosen concentrations shows each Qual Lab step precipitates only its target ion (the earlier ions are left below 0.1 % by then).

---

## Task 4: Dissolving engine (shared)

**Files:** `solubility/assets/sol-engine.js`

- [x] Step 1: Beaker model: amount of solid, [ions], Q. Dissolving and re-forming at the crystal surface at a rate set by Q/Ksp (start from the PbI₂ code in `equilibrium_simulations.html`); saturation arrives in seconds and **events keep happening at saturation** (principle 1).
- [x] Step 2: Stresses: add a common ion (s from the full cubic for 1:2 salts, not the approximation), add acid (removes OH⁻ or CO₃²⁻, pH readout), change temperature (van 't Hoff, only for salts with data).
- [x] Step 3: Mixing two solutions: dilute both, compute Q, precipitate down to Ksp if Q > Ksp.
- [x] Step 4: Representative particle window: ion counts scaled from the real concentrations, ion ratios exact (two I⁻ per Pb²⁺).
- [x] Step 5: API for Guide presets and the Qual Lab test tube; state summaries as plain text for a live region.

**Accessibility check:** Summaries cover every verdict ("Q is greater than Ksp. A yellow solid forms.").

**Verification:** A test harness (removed after) checks: saturated s matches the textbook value for every salt; common-ion s matches the exact solution; mixing cases land on the right side of Ksp; PbI₂ matches the Le Châtelier sim at 25 °C and 100 °C; nothing runs away over 10 minutes.

---

## Task 5: Readouts, gauge & worked steps (shared components)

**Files:** `solubility/assets/sol-ui.js` · `sol.css`

- [x] Step 1: Readout panel: mass dissolved, s in g/L and mol/L, [each ion], Q, Ksp, in readable scientific notation (×10⁻⁹ with superscripts, never "e-9").
- [x] Step 2: Q vs Ksp gauge, same reading as Q vs K in the Le Châtelier sim: log scale, Ksp marked, Q marker, <, = or > shown as a symbol.
- [x] Step 3: Worked-step block for the Guide: one line per step, revealed by tap / next, each line able to highlight a part of the picture (principle 2).

**Accessibility check:** Numbers read correctly by screen reader ("1.3 times 10 to the minus 5"); gauge readable without colour.

**Verification:** The same component renders in the Guide stage, the Sandbox and the Qual Lab with no room-specific copies.

_Built 2026-11-17: `assets/sol-ui.js` (`SolUI.num`, `readout` / `saltReadout`, `qvk` / `qvkForSalt`, `steps`) + styles in `sol.css`. Demo and projector check on `dev/ui.html`; `dev/engine.html` now uses the shared readout and check. Checked at 1280 × 720, 1920 × 1080 and 390 px wide; screen-reader text verified ("8.13 times 10 to the minus 4 moles per litre"; "Q is about 64 times smaller than K s p. Unsaturated: …"). Rooms reuse these when built (Tasks 7–9)._

---

## Task 6: Guide section list (copy + stage script), Part by Part

**Files:** `docs/designpowers/plans/2026-11-17-guide-sections.md`

- [x] Step 1: For each Part: the **Before you begin** card (that block's learning intentions and competencies, verbatim, competency names spelled out), then each section's heading, 2 to 4 short paragraphs, stage preset, chips and worked steps. Headings carry their own labels ("Part 2: Q vs Ksp"); no eyebrow lines.
- [x] Step 2: Part 4 careers cards and the "this water may contain lead" course-of-action section.
- [x] Step 3: User sign-off on each Part's copy before it is built. _(All four Parts approved 2026-11-17.)_

**Accessibility check:** Plain language, no em dashes, every term defined at first use, no kidney-stone content.

**Verification:** Every LI and competency in `DISCOVERY.md` maps to at least one section of its Part.

---

## Task 7: Guide build, Part by Part

**Files:** `solubility/guide.html`

- [x] Step 1: Scroll sections with a sticky stage and a contents list of the four Parts (IMF / equilibrium-intro pattern).
- [x] Step 2: Presentation view: toggle, ‹ › steppers, arrow keys / clicker, Esc leaves; each Part's Before you begin card is its first slide.
- [ ] Step 3: Stage presets per section (engine, readouts, gauge, worked steps, pictures).
- [ ] Step 4: Predict-then-reveal chips; nothing saved.
- [ ] Step 5: Each Part ends by pointing to its lab; Part 4 hands off to the Qual Lab.

**Accessibility check:** Chips keyboard-operable with `aria-pressed`; reveals announced; presentation view fully keyboard-driven.

**Verification:** Each Part runs start to finish in presentation view with no scrolling or setup, and reads well at tablet width in scroll mode.

_Progress 2026-11-17: **Part 1 built.**
- **Files:** `guide.html` (copy as approved), `assets/guide.js` (presets, steps, chips, scroll tracking, presentation view), `assets/sol-scene.js` (beaker + particle window as a shared module; `dev/engine.html` now uses it), `assets/sol-pictures.js` (flasks, balance, evaporating dish, calibration graph), and the chip component in `sol-ui.js`.
- **Presentation view:** → reveals the next worked line, then the next tab, then the next section.
- **Checked** at 1440 × 900, at 1280 × 720 in presentation view, and at 820 px.
- **Part 2 built** (same day): pouring two beakers into one; worked steps that pour on the first line and hold the chemistry until the Q > Ksp line; a ghost "without dilution" Q marker; four quick mixes as tabs; a slowed replay of the AgCl mix (Q slides back to Ksp); three evidence tubes, each a real mix settled by the engine.
- **Part 3 built** (same day). Main pieces:
  - stress buttons that follow the salt (its common ion, acid, and heat for PbI₂ only); in 3.1 they are greyed and labelled with the section that uses them
  - a salt switcher (3.3 and the wrap)
  - 3.2 worked steps; the KI goes in at the line that uses it
  - 3.4: a 0 to 100 °C slider; the Q vs Ksp check switches to a fixed powers-of-ten scale (`abs`), so the Ksp mark itself moves; a four-row table from the engine's ΔH
  - 3.5: nine compact predict cards; choosing one sets up its salt, and Run it (after the reveal) makes the change on a fresh saturated beaker
  - `KNO₃` added to the reagents
  - extra dev hooks: `&salt=`, `&temp=`, `&press=`, `&settle=1` (remove with `__solGuide` before ship)
- **Part 4 built** (same day). Main pieces:
  - `assets/sol-qual.js` runs the scheme on the engine; the Guide and the Qual Lab share it
  - shared tube drawing (`SolPictures.tube`): dropper, falling cloud that settles, packed solid, tilt for pouring
  - 4.2 window shows Sr²⁺ and Mg²⁺ beside PbI₂ (`SolScene` `showIons`)
  - 4.3 and 4.4: fixed checks that show Q at the moment a reagent goes in
  - career tiles as HTML
  - 4.6 tap and tube
  - Health Canada lead limit verified (0.005 mg/L, 2019)
  - 4.6 correction: PbI₂ formed is about 7 µg, not 11 µg; only the lead above the Ksp limit comes out
- **Task 7 done.** The Guide has all four Parts._

---

## Task 8: Sandbox build

**Files:** `solubility/sandbox.html`

- [x] Step 1: Controls: salt picker, add-a-scoop, add common ion, add acid, temperature (disabled with a note where there's no data), mix-two-solutions mode, Start over.
- [x] Step 2: Layout: beaker and particle window beside the readouts and Q vs Ksp gauge (family layout with the Le Châtelier sim).
- [x] Step 3: Quiet: readout and axis names only, neutral live summary, no banners or hints (principle 3).

_Progress 2026-11-17: built in `sandbox.html` + `assets/sandbox.js`. Two modes: Dissolve a solid, Mix two solutions (log concentration slider 10⁻⁶ to 10⁻¹ M, 10 to 75 mL each). Each "Add" press is 0.010 mol. **pH:** shown for Mg(OH)₂ only; hidden for CaCO₃ (decision below). Dev hooks: `?salt=&mode=mix&scoops=&press=&mix=now&settle=1`._

**Accessibility check:** Every action has a button (no drag-only); live region for summaries.

**Verification:** Every salt saturates at its real s; each stress moves s the right way; mixing gives a solid exactly when Q > Ksp.

---

## Task 9: Qual Lab build

**Files:** `solubility/qual-lab.html`

- [x] Step 1: Random unknown (any mix of Pb²⁺ / Sr²⁺ / Mg²⁺, or none) and a "new unknown" button.
- [x] Step 2: The scheme as a flowchart beside a test tube: add KI → centrifuge → pour off → add Na₂SO₄ → centrifuge → pour off → add NaOH. Students choose which branch to follow at each fork.
- [x] Step 3: Each step shows what happened in words and colour, plus the Q vs Ksp numbers behind it; a notebook keeps the observations.
- [x] Step 4: Final "which ions are in it?" pick, then the reveal. Nothing saved.

_Progress 2026-11-17: built in `qual-lab.html` + `assets/qual-lab.js` on `sol-qual.js`.
- **The fork:** after each reagent the student chooses "A solid formed" or "It stayed clear". A wrong choice gets "Look at the tube again." Centrifuge and pour off appear only when a solid formed.
- **Numbers:** the Q vs Ksp numbers sit behind a "Show the numbers behind it" toggle, because they give the answer away.
- **Verified:** all 8 unknowns played end to end in headless Chrome: right observations at every step, conclusion matches.
- **Dev hooks:** `?unknown=0..7` and `window.__qual`._

**Accessibility check:** Flowchart navigable by keyboard; every observation in text; precipitate colours named.

**Verification:** All 8 unknowns (7 mixes + blank) give the right observations at every step.

---

## Task 10: Polish, accessibility & ship

- [ ] Grep user-facing copy for `—` and `–`, eyebrow labels, personified ions, and any kidney-stone terms.
- [ ] Keyboard-only pass, screen-reader spot check, colour-blind check of precipitates and gauge.
- [ ] Projector pass of every Part in presentation view; tablet portrait (~768 px) with no horizontal scroll.
- [ ] Remove `noindex` from shipped pages and add them to `sitemap.xml`.
- [ ] Update `design-state.md` (decisions, debt, handoff).
