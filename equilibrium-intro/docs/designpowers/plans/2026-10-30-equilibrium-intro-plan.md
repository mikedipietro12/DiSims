# Design Plan: Intro to Equilibrium (AP Chem 12)

> **For agentic workers:** Review completed work against this plan and the five principles before marking a task done.

**Status:** Approved (2026-10-30). Order: Task 1 → Task 8 (taste) → Tasks 2, 3, 4 → Task 7 (Sandbox, moved ahead at user request) → Tasks 5, 6 → Task 9.

**Goal:** Ship an AP Chem 12 pre-load suite with a hub, a Guide (10 beats) and a Sandbox (reversible vessel + Gibbs bars). It hands off to the Le Châtelier sim.

**Design Direction:** Brief `docs/designpowers/briefs/2026-10-30-equilibrium-intro.md` · Strategy `docs/designpowers/strategy/2026-10-30-equilibrium-intro-strategy.md`

**Persona:** AP Chem 12 pre-load student. Knows ΔH, rates and Hess's law. Entropy is new. Laptop first.

**Principles to enforce every task:** It never stops · Two pulls, one verdict · Signs before sums · Name once then quiet · Meaning without colour/pointer/motion

---

## Task 1: Suite structure & AP 12 hub entry

**Files:** `equilibrium-intro/index.html` · `guide.html` · `sandbox.html` (stubs) · `ap-chemistry-12/index.html`

- [x] Step 1: Suite hub with two room cards (Guide / Sandbox), short teasers and a suggested order with no locks. Add a "Next: Equilibrium Simulations" link to the Le Châtelier sim.
- [x] Step 2: Add an "Intro to Equilibrium" card on the AP 12 hub, before Equilibrium Simulations.
- [x] Step 3: Shared chrome: back link, a room switcher (reuse `intermolecular-forces/assets/suite-chrome.js` + `suite.css`) and unique titles.

**Accessibility check:** Links are focusable, teasers aren't colour-only, page titles are unique.

**Verification:** From `ap-chemistry-12/` a student can open the suite and jump to either room.

---

## Task 2: Reaction kit (data)

**Files:** `equilibrium-intro/assets/reactions.js`

- [x] Step 1: Encode the menu, one entry per reaction: N₂O₄ ⇌ 2NO₂ (+,+), N₂ + 3H₂ ⇌ 2NH₃ (−,−), 2O₃ ⇌ 3O₂ (−,+), 3O₂ ⇌ 2O₃ (+,−), and custom A ⇌ B (sign toggles). Each entry carries its species, coefficients, ΔH (kJ), ΔS (J/K), drawing info (atoms, colours, shape), its macro cue (e.g. NO₂ brown) and a plain-language label.
- [x] Step 2: Pick the T slider range (about 200–700 K) so both "flips" cases cross ΔG = 0 inside it. Approximate crossovers: N₂O₄ about 325 K, Haber about 465 K.
- [x] Step 3: Add Guide example cards with predict-then-reveal answers: ice melting, water evaporating, CaCl₂ hot pack, NH₄NO₃ cold pack, soda CO₂, blood CO₂, ocean CO₂, diamond → graphite. Each card has the ΔH and ΔS signs and a one-line reason.

**Accessibility check:** Every species and sign has a text label for screen readers.

**Verification:** Every Guide and Sandbox reaction or example comes from this one file, with no one-off data inside the rooms.

---

## Task 3: Vessel engine (shared)

**Files:** `equilibrium-intro/assets/vessel-engine.js`

- [x] Step 1: Bounded 2D particle vessel (Toy Box look, same vessel language as `equilibrium_simulations.html`). Particles drift softly, with no runaway motion.
- [x] Step 2: Mass-action forward and reverse rates. Set k_f / k_r from the ΔG sign and size at the current T, so the vessel settles product-heavy when ΔG < 0 and reactant-heavy when ΔG > 0. K is never shown. Equilibrium should arrive in about 5–10 s.
- [x] Step 3: Visible reaction events (merge / split animations) that **keep happening at equilibrium** (principle 1).
- [x] Step 4: Expose state for the graphs: concentrations, forward rate, reverse rate, ΔH, −TΔS, ΔG.
- [x] Step 5: API for scripted Guide presets: set the reaction, mix and T; pause; play.
- [x] Step 6: `prefers-reduced-motion`: particles freeze or slow right down while the numbers, graphs and bars keep updating.

**Accessibility check:** The engine emits plain-text state summaries for a live region ("forward and reverse rates are equal").

**Verification:** For all 5 reactions, at 3 temperatures and 3 starting mixes, nothing leaves the vessel, the forward and reverse rates converge, the settled side agrees with the ΔG sign, and reaction events keep happening at equilibrium.

---

## Task 4: Graphs & Gibbs bars (shared components)

**Files:** `equilibrium-intro/assets/eq-charts.js` · `eq-intro.css`

- [x] Step 1: Concentration vs time graph (pattern from the Le Châtelier sim's chart and modal).
- [x] Step 2: Rate vs time graph: forward and reverse as two lines that meet (dashed vs solid so it doesn't rely on colour).
- [x] Step 3: Gibbs bars: ΔH and −TΔS stack into ΔG, with + / − glyphs and a zero line. Only −TΔS stretches with T (principle 2). No numbers (principle 3).
- [x] Step 4: Four-case sign table picture. **Built in the Guide (beat 8), not the Sandbox:** kept out of the Sandbox because its verdict labels would narrate (principle 4).

**Accessibility check:** Each graph has a text summary. Bars are readable without colour.

**Verification:** Dragging T across the crossover flips the ΔG bar's sign, and the table highlights the matching case.

---

## Task 5: Guide beat list (copy + stage script)

**Files:** this plan (beat table) · `guide.html` copy draft

- [x] Step 1: Write each beat: kicker, heading, 2–4 short paragraphs of teaching copy, the stage preset, chips (if any) and one "what to notice" line. Beats: Heat flows → Spreading out → Two pulls → Both arrows → Rates meet → Equilibrium around us → State functions → ΔG = ΔH − TΔS → What ΔG can't tell you → Next.
- [x] Step 2: Decide the phase-change beat visual: reuse `heat-engine.js` if it drops in cleanly, otherwise a simple particle picture.
- [x] Step 3: Draw the state-function picture (two paths between the same start and end).
- [x] User sign-off on the beat copy before Task 6.

**Accessibility check:** Plain-language copy, no em dashes, vocabulary defined at first use.

**Verification:** Every LI and competency in `DISCOVERY.md` maps to at least one beat.

---

## Task 6: Guide build

**Files:** `equilibrium-intro/guide.html`

- [x] Step 1: Scroll beats with a sticky stage (IMF `.guide-layout` / `.guide-beat` / `.guide-stage-panel` pattern) and a TOC.
- [x] Step 2: Stage swaps preset per beat (vessel, graphs, bars, sign table, state-function picture).
- [x] Step 3: Predict-then-reveal chips. Tap + or − for ΔH and ΔS, press Reveal to see the answer with its reason. Nothing is saved.
- [x] Step 4: Final beat hands off to the Sandbox and the Le Châtelier sim.

**Accessibility check:** Chips are keyboard-operable with `aria-pressed`. The reveal is announced. The stage controls have keyboard paths.

**Verification:** Scroll every beat at laptop and phone widths. Each stage preset loads and the chips work by keyboard.

---

## Task 7: Sandbox build

**Files:** `equilibrium-intro/sandbox.html`

- [x] Step 1: Controls: a reaction picker, a starting-mix control, a T slider, custom-mode ΔH/ΔS sign toggles, and Start over.
- [x] Step 2: Layout: the vessel next to the concentration graph, the rate graph and the Gibbs bars (family layout with the Le Châtelier sim).
- [x] Step 3: Quiet HUD: bar and axis names only. No narration and no "equilibrium reached" banner (principle 4).

**Accessibility check:** All controls are keyboard-operable. Live region for state summaries.

**Verification:** Every reaction behaves as described in Task 3. Changing T mid-run shifts the mix in the direction of the ΔG sign.

---

## Task 8: Taste pass (tokens)

**Files:** `docs/designpowers/taste/2026-10-30-equilibrium-intro-taste.md` · `eq-intro.css`

- [x] Step 1: Choose ΔH, ΔS (−TΔS) and ΔG tokens and the forward/reverse rate line styles. Red/yellow stays reserved for charge.
- [x] Step 2: Species colours for O₃/O₂ and A/B that don't clash with the NO₂/N₂O₄/NH₃ colours already in the Le Châtelier sim.
- [x] Step 3: Side-by-side visual check against `equilibrium_simulations.html`.

**Note:** this can run before Task 4 if you want to lock the look before building the charts.

---

## Task 9: Polish, accessibility & ship

- [ ] Grep user-facing copy for `—` and `–`.
- [ ] Reduced-motion pass, keyboard-only pass, screen-reader spot check.
- [ ] Phone-width check (no horizontal scroll).
- [ ] Optional: add a "← Intro to equilibrium" link on `equilibrium_simulations.html`.
- [ ] Update `design-state.md` (decisions, debt register, handoff).
