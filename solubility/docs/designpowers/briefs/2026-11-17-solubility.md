# Design Brief: Solubility & Ksp (AP Chem 12)

**Date:** 2026-11-17  
**Status:** Approved (2026-11-17)  
**Approach:** Family pattern with three rooms: Guide (teaches, presentation view) → Sandbox (quiet, live numbers) → Qual Lab (follow a scheme)  
**Hub:** AP Chemistry 12 (`ap-chemistry-12/index.html`), card after "Equilibrium Simulations", before "Titration Simulator"  
**Repo:** `solubility/`

---

## Problem Statement

AP Chem 12 students already know K, Q and Le Châtelier from the equilibrium unit, but they haven't yet applied them to a solid dissolving in water. Solubility looks like a new topic with its own vocabulary: molar solubility, g/L, Ksp, "insoluble". The conversions between these quantities trip students up, especially for salts like PbI₂ where the ion counts aren't 1:1. Without a picture of what is happening, Ksp turns into a formula to memorise, Q vs Ksp turns into a rule, and the common ion effect turns into one more exception.

This suite needs to give students one connected picture:
- **Dissolving is an equilibrium.** A saturated solution keeps dissolving and re-forming at the crystal surface. Ksp is the same K as before, written for a solid.
- **The numbers link up.** g/L ↔ mol/L ↔ [ions] ↔ Ksp, in both directions, for salts with different ion ratios.
- **Q vs Ksp predicts precipitation**, including the dilution that happens when two solutions are mixed.
- **Le Châtelier changes solubility.** A common ion, pH and temperature can each make more or less of a salt dissolve.
- **Solubility differences can separate ions.** A precipitation scheme identifies the ions in an unknown solution.

The Guide is the core of the teacher's lessons and doubles as students' self-study notes. The Sandbox and Qual Lab let students practise with real numbers. The class labs (Ksp lab, Q vs Ksp lab, Kidney Stones Lab, real qualitative analysis lab) stay separate, and the sim does not copy them.

---

## Users

**Primary:** AP Chemistry 12 students, after the equilibrium unit. They know K, Q, Le Châtelier, ICE tables, molar mass and stoichiometry. The Chem 11H material (concentration, dilution, solubility rules) needs a refresher, not reteaching.

**Secondary:** the teacher, presenting the Guide on a projector as the lesson, one Part per lesson.

**Context of use:**
- **In class:** the teacher steps through the Guide in presentation view (clicker or arrow keys) and uses the Sandbox live for demos.
- **On their own time:** students reread the explanation beside each section on a laptop or tablet, and use the Sandbox and Qual Lab before or after the labs.
- Phones are not a target.

**Ability spectrum:**
- **Screen reader / keyboard:** every control (salt picker, scoops, reagent buttons, sliders, prediction chips) works without a pointer. Live numbers and Q vs Ksp verdicts are announced as text ("Q is greater than Ksp. A solid forms.").
- **Low vision / colour vision:** precipitate colours are always named in text ("yellow solid"). Ion charge is carried by + / − glyphs, not colour alone. Q vs Ksp uses position and a symbol (<, =, >), not just colour.
- **Cognitive load:** worked steps reveal one line at a time in the Guide. The Sandbox shows numbers without commentary. The Qual Lab only shows the next step of the scheme.
- **Motion:** robust, lively animation (standing preference). Animations are interruptible, and a tap or the next step settles them instantly. No `prefers-reduced-motion` branches.
- **Not-first-language English:** plain teaching copy, short consistent labels, units always written out.

---

## Design Direction

### 1. Guide (teaches)
Scroll sections beside a sticky stage, with **presentation view** (same as the IMF and Intro to Equilibrium Guides). There are **four Parts, one per curriculum block**, so each lesson starts at its own Part. **Every Part opens with its own "Before you begin" card** listing that block's learning intentions beside its curricular competencies (verbatim wording, BC competency names spelled out). It is the first slide of that lesson in presentation view. The top of the Guide is just a contents list of the four Parts. **Predict-then-reveal chips** appear throughout, and nothing is saved or scored. Worked examples reveal one line at a time.

Draft section order:

**Part 1 · Molar solubility and Ksp** (Block 1: topics 1 and 2)
0. Before you begin: Block 1 learning intentions and competencies (QP, P&C, AI, E).

_Chem 11H refresher_
1. Concentration: M = n/V, with one worked example.
2. Dilution: M₁V₁ = M₂V₂, with one worked example.
3. Solubility rules: a table and "soluble or not?" chips.
4. "Insoluble" really means "slightly soluble". So how much dissolves?

_Molar solubility and Ksp_
5. Dissolving to saturation: dissolving and re-forming at the same rate, seen at particle scale and in the beaker. This links back to Intro to Equilibrium.
6. Writing Ksp: the solid is left out of the expression, the same as for K.
7. Molar solubility s ↔ Ksp, worked both ways: g/L → mol/L → [ions] → Ksp. Examples: AgCl (x²) and PbI₂ (4x³). No 1:3 salts (27x⁴ not needed, user 2026-11-17).
8. Comparing salts: a smaller Ksp doesn't always mean less soluble when the formulas differ. This is the E moment: evaluating approaches.
9. Real-life observations to start students' own questions (QP), such as cave formations and hard-water scale.

**Part 2 · Q vs Ksp** (Block 2)
0. Before you begin: Block 2 learning intentions and competency (PAI).
10. Q for a salt, and the dilution step when two solutions are mixed (links back to the dilution refresher in Part 1).
11. Q < Ksp, Q = Ksp, Q > Ksp: will a solid form? Predict chips.
12. Back to equilibrium: the same Q vs K story as the Le Châtelier sim.

**Part 3 · Changing solubility** (Block 3: Le Châtelier)
0. Before you begin: Block 3 learning intentions and competencies (Q&P, PAI). The Kidney Stones Lab competency is listed as written; the Part itself uses other examples.
13. Common ion: KI added to PbI₂, with s worked out when a common ion is present.
14. pH: acid dissolves Mg(OH)₂ (antacid) and CaCO₃ (caves, shells in a more acidic ocean).
15. Temperature: PbI₂ dissolves more on heating (same numbers as the Le Châtelier sim).
16. Predict several outcomes: chips for "more, less or no change".

**Part 4 · Qualitative analysis** (Block 4)
0. Before you begin: Block 4 learning intentions and competencies (Q&P, PAI, E, AI, C).
17. Selective precipitation: using Ksp to pull one ion out and leave the others.
18. Reading a scheme: a flowchart walk-through, handing off to the Qual Lab.
19. Careers where qualitative analysis matters (E): forensic chemist, water-quality technician, mining assayer, environmental lab analyst.
20. Suggest a course of action (C): a sample of water may contain lead. What would you test, and what would you recommend?

### 2. Sandbox (quiet, live numbers)
A beaker of water with the particle view beside it (micro + macro, as in Intro to Equilibrium). Students:
- pick a salt and add it scoop by scoop until it saturates
- add a common-ion salt, add acid, or change the temperature
- mix two solutions to see whether a solid forms

Live readouts: mass dissolved, s in g/L and mol/L, [ions], Q, Ksp, and a Q vs Ksp gauge. No worked steps or commentary.

Draft salt menu: AgCl (1:1) · PbI₂ (1:2, shared with the Le Châtelier sim) · Ag₂CrO₄ (2:1, red-brown) · Mg(OH)₂ (pH) · CaCO₃ (pH). Common ions: NaCl with AgCl, KI with PbI₂.

### 3. Qual Lab (follow a scheme)
Students get a random unknown: any mix of **Pb²⁺, Sr²⁺, Mg²⁺** (7 combinations, plus a blank with none). They follow a flowchart:
1. Add **KI**. Yellow PbI₂ means Pb²⁺. Centrifuge, then pour off the liquid.
2. Add **Na₂SO₄** to that liquid. White SrSO₄ means Sr²⁺. Separate again.
3. Add **NaOH** to that liquid. White Mg(OH)₂ means Mg²⁺.

Each step shows the real Q vs Ksp numbers. Students finish by picking "which ions are in it?", and the answer is revealed with nothing saved. The Qual Lab deliberately avoids the real lab's ions (Ag⁺, Ba²⁺, Fe³⁺).

**Emotional / pedagogical target:** "Ksp is just K for a solid, and I can push it". A confident, hands-on toolset that makes the numbers feel physical.

---

## Constraints

**Product / curriculum**
- Lives under AP Chem 12, after Equilibrium Simulations.
- Serves the four LI/competency blocks in `DISCOVERY.md`.
- **Kidney stones stay out of every room.** No calcium oxalate or phosphate, and nothing about urine pH, citrate or diet. At most a light hint that solubility matters inside the body too.
- **The class labs are not copied.** The Qual Lab uses different ions, and the Sandbox doesn't reproduce a lab procedure.
- Numbers: the Guide works through the conversions step by step. The Sandbox and Qual Lab show real live values without walking through the maths.
- Free navigation, no gates, no scores.

**Technical**
- Static on GitHub Pages, no build step. Libraries from a CDN are fine.
- Laptop and tablet first. The projector is a real target for the Guide.
- Every number comes from the **BC Chemistry 12 Data Booklet** the class uses (`docs/reference/chem12-data-booklet.md`); salts not in it are dropped. PbI₂ = 8.5e-9, and `equilibrium_simulations.html` now matches (temperature trend: ΔH_soln ≈ +70 kJ/mol). Dissolving rates are for teaching, not exact.

**Visual**
- Toy Box identity (`intermolecular-forces/assets/suite.css`, Space Grotesk + Space Mono), reading as one family with `equilibrium-intro/`.
- Real precipitate colours are a macro cue. Red/yellow is reserved for charge; the taste pass decides how cations and anions are coloured.
- No dot-grid backgrounds. No em or en dashes in student copy. No personification of particles or ions.
- **No "AI-tell" eyebrow labels** (user, 2026-11-17). No small capitalised / mono label above a regular heading: no beat kickers, no tile eyebrows. Part numbers go in the heading itself ("Part 2: Q vs Ksp"). Repo `AGENTS.md` carries the rule.

---

## Existing Design System

**Toy Box (IMF suite), inherited through `equilibrium-intro/`.**
- `intermolecular-forces/assets/suite.css` and `suite-chrome.js`: hub, room switcher, Guide layout, presentation view, sandbox layout.
- `equilibrium-intro/`: Guide beat pattern, "Before you begin" briefing, prediction chips, chart conventions.
- `equilibrium_simulations.html`: the PbI₂ Ksp scene (dissolving and growing at the crystal surface at the rate set by Q/Ksp), for possible engine reuse.

---

## Taste Direction (Early Signal)
- Same family as Intro to Equilibrium. New tokens are needed for the ions, the solid, water, and the Q vs Ksp gauge.
- Real precipitate colours (yellow PbI₂, white SrSO₄, Mg(OH)₂ and AgCl, red-brown Ag₂CrO₄) give the macro view its look.

---

## Success Criteria
- A student can convert g/L ↔ mol/L ↔ Ksp, in both directions, for 1:1 and 1:2 (or 2:1) salts.
- A student can predict whether a solid forms by comparing Q and Ksp, including the dilution when two solutions are mixed.
- A student can explain, using Le Châtelier, how a common ion, pH and temperature each change solubility.
- A student can follow a precipitation scheme and work out which ions an unknown contains from what they observe.
- The teacher can run each Part as a lesson in presentation view, and students can reread it on their own afterwards.

---

## Out of Scope
- Any kidney-stone chemistry or context.
- Copying any class lab (ions, reagents or procedure).
- Complex ions (e.g. AgCl dissolving in NH₃).
- Activity coefficients and other non-ideal behaviour.
- Scores, saved answers, accounts.
- Phone layouts.
