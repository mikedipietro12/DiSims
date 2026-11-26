# Guide Section Copy: Solubility & Ksp (Task 6)

> **2026-11-18:** the mole, concentration, dilution and mass calculations in the step tables below were rebuilt as unit analysis (stacked fractions, cancelled units struck), per repo `AGENTS.md` "Calculations". The tables keep the original approved wording for the record; `assets/guide.js` is the source of truth for the steps.

**Date:** 2026-11-17
**Status:** Parts 1 and 2 approved (2026-11-17; conductivity added to 1.7). Parts 3 and 4 drafted for sign-off.
**Plan:** `2026-11-17-solubility-plan.md` · Task 6
**Format:** same Guide as `equilibrium-intro/` (sticky stage beside the copy, presentation view steps through sections). Each Part opens with its own **Before you begin** card. Each section has a heading that carries its own label (no line above it), 2 to 4 short paragraphs, an optional **Watch / Notice** list, and some of: predict chips, worked steps, a stage preset.

**Rules applied:**
- no em or en dashes
- vocabulary is **bold** where it is first named
- every number from the BC Chemistry 12 Data Booklet (via `salts.js`)
- no kidney-stone chemistry
- no particles with wants or feelings
- worked steps use the Task 5 component: one line per tap, a reason under each line, and a **marks** note naming the part of the picture it lights up

**Stage key:**
- **Beaker:** the 3D beaker with its pile.
- **Window:** the zoomed particle view. Its caption says "zoomed in, not to scale" the first time it appears.
- **Check:** the Q vs Ksp check.
- **Readout:** the shared readout panel.

Stage numbers are always live from the engine.

---

# Part 1: Molar solubility and Ksp

## Before you begin (Part 1)

**Heading:** Part 1: Molar solubility and Ksp

**Learning intentions**
- We will learn about the relationship between molar solubility (mol/L), solubility (g/L), and the solubility product (Ksp)
- We will contextualize these data points and begin a lab to use technologies to assist us in our understandings.
- We will learn how to convert between the amount of substance dissolved to Ksp and vice-versa, as well as practical applications of these skills

**Curricular competencies**
- **Questioning and predicting:** We will make observations of real life phenomena to identify our own questions about solubility
- **Planning and conducting:** Use appropriate SI units and equipment to accurately collect and record data
- **Applying and innovating:** We will implement multiple strategies to solve for Ksp values in the lab
- **Evaluating:** We will critically analyze different sources of information and evaluate the approaches used to solve problems regarding Ksp calculations.

**Stage:** the hub's dissolving tile animation (white AgCl crystal with rose and yellow ions), large.

---

## 1.1 · A quick look back: concentration and dilution (`p1-conc`)

**Heading:** A quick look back: concentration and dilution

> You met these in Chemistry 11. **Concentration** tells you how much solute is in each litre of solution: c = n ÷ V, in mol/L (also written M).
>
> **Dilution** adds water but not solute. The moles stay the same, so c₁V₁ = c₂V₂.
>
> One more idea you will need all unit. When an ionic compound dissolves, each ion's concentration depends on how many of that ion are in the formula. 0.10 M Pb(NO₃)₂ gives [Pb²⁺] = 0.10 M, but [NO₃⁻] = 0.20 M.

**Worked steps A (concentration):** "2.00 g of NaCl is dissolved to make 250.0 mL of solution."

| Line | Reason under it | Marks |
|---|---|---|
| n = 2.00 g ÷ 58.5 g/mol = 0.0342 mol | Molar mass from the Data Booklet | the solid on the balance |
| V = 250.0 mL = 0.2500 L | Volume in litres | the flask's line |
| c = 0.0342 mol ÷ 0.2500 L | | |
| = 0.137 mol/L | | the solution |

**Worked steps B (dilution):** "50.0 mL of 0.100 M KI is diluted to 250.0 mL."

| Line | Reason under it | Marks |
|---|---|---|
| c₁V₁ = c₂V₂ | Same moles before and after | |
| c₂ = (0.100 M)(50.0 mL) ÷ 250.0 mL | The units of volume cancel, so mL is fine here | |
| = 0.0200 M | Five times the volume, one fifth the concentration | the diluted flask |

**Stage:** "flask" preset. A volumetric flask filling to the line, then a second flask showing the dilution. Particle window: the same number of K⁺ and I⁻, spread through more water.

---

## 1.2 · Soluble or not? (`p1-rules`)

**Heading:** Soluble or not? The solubility rules

> The Data Booklet's solubility table sorts ionic compounds into two groups. **Soluble** means more than 0.1 mol/L dissolves at 25 °C. Everything else has **low solubility**.
>
> Tap each compound to predict, then reveal. Use the table on page 4 of the booklet.

**Predict chips** (from `RULE_CHIPS`, tap Soluble or Low solubility, then Reveal):
- KNO₃
- AgCl
- MgSO₄
- PbI₂
- Mg(OH)₂
- Sr(OH)₂ (the surprise card)
- (NH₄)₂CO₃
- CaCO₃

Each reveal shows its one-line reason from the booklet rule.

- **Notice:** "low solubility" is not "zero". The table only tells you which side of 0.1 mol/L a compound is on. It cannot tell you how much dissolves.

**Stage:** "rules" preset. The booklet's anion table, with the row for the selected chip highlighted.

---

## 1.3 · "Insoluble" still dissolves (`p1-saturated`)

**Heading:** "Insoluble" still dissolves a little

> Add AgCl to water and stir. Almost all of it sits on the bottom, but a tiny amount does dissolve. Once the water holds as much as it can, the solution is **saturated**.
>
> Zoom in on a saturated solution. Ions leave the crystal surface and other ions land back on it, at the same rate. The amount of solid stops changing, but both processes keep going. This is the same **dynamic equilibrium** you met with K.
>
> You can see it in everyday life. Look at the three cards and write one question of your own about each one.

**Observation cards** (from `GUIDE.observations`, no explanation given):
- **Cave formations:** "Stalactites grow drop by drop as calcium carbonate comes out of dripping water."
- **Kettle scale:** "A white crust builds up inside kettles in hard-water towns."
- **Milk of magnesia:** "A cloudy white suspension that dissolves once it meets stomach acid."

Under the cards: "What do you notice? What do you wonder?" There is no answer box and nothing is saved. Students use their own notebook.

- **Watch:** one scoop dissolves completely. The second scoop leaves solid behind, and the readout's "Dissolved" value stops rising.
- **Watch:** in the window, an ion leaves the crystal and another one lands, again and again.

**Stage:** "saturate" preset. Beaker + Window + Readout with AgCl, plus an **Add a scoop** button. The check is hidden until 1.4.

---

## 1.4 · Ksp: the same K, for a solid dissolving (`p1-ksp`)

**Heading:** Ksp: the same K, for a solid dissolving

> A saturated solution is at equilibrium, so it has a K. For a solid dissolving, it is called the **solubility product constant**, **Ksp**.
>
> Write it like any K: products over reactants. The solid is left out, just as pure solids were left out of K before. That leaves only the ions, each raised to its coefficient.

**Worked steps (writing Ksp):**

| Line | Reason under it | Marks |
|---|---|---|
| AgCl(s) ⇌ Ag⁺ + Cl⁻ | One of each ion per formula unit | the crystal and both ions |
| Ksp = [Ag⁺][Cl⁻] | The solid is left out | the dissolved ions |
| PbI₂(s) ⇌ Pb²⁺ + 2 I⁻ | Two iodide ions per formula unit | both I⁻ beside one Pb²⁺ |
| Ksp = [Pb²⁺][I⁻]² | The coefficient 2 becomes a power | the two I⁻ |

> Three numbers describe how much dissolves. The **solubility** is the mass that dissolves, in g/L. The **molar solubility**, **s**, is the moles of compound that dissolve, in mol/L. **Ksp** comes from the ion concentrations.

**Diagram under the paragraph:** g/L ⇄ mol/L ⇄ [ions] ⇄ Ksp. Each arrow is labelled with what you do:
- g/L to mol/L: ÷ molar mass
- mol/L to [ions]: × ion counts in the formula
- [ions] to Ksp: into the Ksp expression

Each arrow also goes back the other way.

- **Notice:** a small Ksp means only a little dissolves. Every Ksp in the booklet is much less than 1.

**Stage:** "ksp" preset. Beaker + Window + Check + Readout, with AgCl saturated. The check reads "Saturated: Q = Ksp". Switch to PbI₂ for the second pair of lines.

---

## 1.5 · From Ksp to solubility: AgCl (`p1-agcl`)

**Heading:** From Ksp to solubility: silver chloride

> Let x be the molar solubility. Every AgCl that dissolves gives one Ag⁺ and one Cl⁻, so both concentrations are x.

**Worked steps:**

| Line | Reason under it | Marks |
|---|---|---|
| AgCl(s) ⇌ Ag⁺ + Cl⁻ | | the crystal |
| Ksp = [Ag⁺][Cl⁻] | | the dissolved ions |
| = (x)(x) = x² | If x mol/L dissolves, [Ag⁺] = x and [Cl⁻] = x | Ag⁺ labelled x, Cl⁻ labelled x |
| x = √Ksp = √(1.8 × 10⁻¹⁰) | Ksp from the Data Booklet | |
| x = 1.34 × 10⁻⁵ mol/L | This is the molar solubility, s | the readout's "Dissolved" row |
| s = (1.34 × 10⁻⁵ mol/L)(143.4 g/mol) | Times the molar mass gives grams per litre | |
| = 1.92 × 10⁻³ g/L | About 2 mg in a whole litre | the pile in the beaker |

- **Notice:** the readout beside you shows the same numbers. The engine and the algebra agree.

**Stage:** "agcl" preset. AgCl saturated, Readout visible.

---

## 1.6 · From Ksp to solubility: PbI₂ (`p1-pbi2`)

**Heading:** From Ksp to solubility: lead(II) iodide

> PbI₂ is different. Each formula unit gives one Pb²⁺ but **two** I⁻. Before you start, predict.

**Predict chip:** "In saturated PbI₂, if [Pb²⁺] = x, then [I⁻] = …" with three options: **x**, **2x**, **x²**. Reveal: "2x. Count the ions in the window: two I⁻ for every Pb²⁺."

**Worked steps:** (the Task 5 demo, unchanged)

| Line | Reason under it | Marks |
|---|---|---|
| PbI₂(s) ⇌ Pb²⁺ + 2 I⁻ | Each PbI₂ that dissolves gives one Pb²⁺ and two I⁻ | the crystal and both kinds of ion |
| Ksp = [Pb²⁺][I⁻]² | The solid is left out | the dissolved ions |
| = (x)(2x)² | If x mol/L dissolves, [Pb²⁺] = x and [I⁻] = 2x | Pb²⁺ labelled x, I⁻ labelled 2x |
| = 4x³ | | |
| x = ∛(Ksp ÷ 4) = ∛(8.5 × 10⁻⁹ ÷ 4) | Ksp from the Data Booklet | |
| x = 1.29 × 10⁻³ mol/L | This is the molar solubility, s | the readout's "Dissolved" row |
| s = (1.29 × 10⁻³ mol/L)(461.0 g/mol) | Times the molar mass gives grams per litre | |
| = 0.593 g/L | | the pile in the beaker |

- **Watch:** the window's ion counts. There are always twice as many I⁻ as Pb²⁺. That is where the 4 in 4x³ comes from: (2x)² = 4x².

**Aside:** A common slip is to write [I⁻] = x. That gives Ksp = x³ and a molar solubility about 1.6 times too big. Section 1.8 asks you to spot it.

**Stage:** "pbi2" preset. PbI₂ saturated. The Window shows the 1 : 2 ion count, labelled.

---

## 1.7 · From a lab measurement to Ksp (`p1-lab`)

**Heading:** Working backwards: from a measurement to Ksp

> In the lab you measure something and work back to Ksp. There is more than one way to do it.
>
> **Strategy 1: mass.** Evaporate a known volume of saturated solution and weigh what is left. 250.0 mL of saturated Mg(OH)₂ leaves 1.63 mg of solid.

**Worked steps (strategy 1):**

| Line | Reason under it | Marks |
|---|---|---|
| n = 0.00163 g ÷ 58.3 g/mol = 2.80 × 10⁻⁵ mol | Convert mg to g first | the residue |
| s = 2.80 × 10⁻⁵ mol ÷ 0.2500 L = 1.12 × 10⁻⁴ mol/L | Molar solubility | |
| [Mg²⁺] = 1.12 × 10⁻⁴ M, [OH⁻] = 2.24 × 10⁻⁴ M | Two OH⁻ in the formula | Mg²⁺ labelled s, OH⁻ labelled 2s |
| Ksp = [Mg²⁺][OH⁻]² | | |
| = (1.12 × 10⁻⁴)(2.24 × 10⁻⁴)² | | |
| = 5.6 × 10⁻¹² | Matches the Data Booklet | the check's Ksp mark |

> **Strategy 2: conductivity.** Dissolved ions let a solution carry an electric current. The more ions, the higher the **conductivity**. A conductivity probe can't name the ions, but it can tell you how many there are.
>
> First, measure standards of known concentration and plot a **calibration line**: conductivity against concentration. Then measure the saturated solution and read its concentration off the line. Say the line gives s = 1.12 × 10⁻⁴ mol/L. From there you finish the same way as strategy 1.
>
> **Strategy 3: one ion's concentration.** If a probe measures one ion directly, say [OH⁻] = 2.24 × 10⁻⁴ M, then [Mg²⁺] is half of that. Again, finish the same way.
>
> Every strategy depends on careful measurement. Record the volume in litres, keep the mass in grams, use distilled water (other ions would add to the conductivity), and keep the right number of significant figures. A small error in s grows in Ksp, because s is cubed.

- **Notice:** working backwards uses the same arrows as before, in the other direction.
- **Notice:** three different measurements, one Ksp. If two strategies disagree, check the measurements before the algebra.

**Stage:** "lab" preset, with three tabs, one per strategy:
- **Mass:** Mg(OH)₂ beaker with an evaporating dish beside it. The residue appears as a small white mark, with the balance reading 1.63 mg.
- **Conductivity:** a probe in the saturated solution beside a calibration graph. The standards are plotted as points, and the saturated reading is marked on the line with a dashed drop to the concentration axis.
- **One ion:** the window with OH⁻ labelled 2s and Mg²⁺ labelled s.

---

## 1.8 · Smaller Ksp, less soluble? (`p1-compare`)

**Heading:** Does a smaller Ksp mean less dissolves?

> AgCl has Ksp = 1.8 × 10⁻¹⁰. Ag₂CrO₄ has Ksp = 1.1 × 10⁻¹². The second Ksp is over 100 times smaller. Predict which one dissolves more.

**Predict chip:** "Which has the greater molar solubility?" **AgCl** / **Ag₂CrO₄**. Reveal: "Ag₂CrO₄, about 5 times more."

**Worked steps (Ag₂CrO₄):**

| Line | Reason under it | Marks |
|---|---|---|
| Ag₂CrO₄(s) ⇌ 2 Ag⁺ + CrO₄²⁻ | Two Ag⁺ per formula unit | |
| Ksp = [Ag⁺]²[CrO₄²⁻] = (2x)²(x) = 4x³ | Same pattern as PbI₂, with the 2 on the cation | |
| x = ∛(1.1 × 10⁻¹² ÷ 4) | | |
| x = 6.5 × 10⁻⁵ mol/L | AgCl's is 1.34 × 10⁻⁵ mol/L | both readouts side by side |

> Ksp values can only be compared directly when the compounds have the same ion ratio, like AgCl and AgBr. When the formulas differ, the powers differ too, so convert to molar solubility first.

**Evaluate card:** two students' solutions for the molar solubility of PbI₂, shown side by side.
- **Student A** writes Ksp = x · x², then x = ∛(8.5 × 10⁻⁹) = 2.04 × 10⁻³ mol/L.
- **Student B** writes Ksp = 4x³, then 1.29 × 10⁻³ mol/L.

Prompt: "Which approach is right, and where does the other go wrong?" Reveal: "B. A used [I⁻] = x instead of 2x, so the 4 is missing."

**Stage:** "compare" preset. Two small beakers side by side, AgCl and Ag₂CrO₄ (brick-red solid), each saturated, with its readout.

---

## Part 1 wrap: try it (`p1-try`)

**Heading:** Try it in the Sandbox

> Open the Sandbox. Dissolve AgCl, then PbI₂, until solid stays on the bottom. Check that the readouts match the answers you worked out here.
>
> Your Ksp lab starts next. Bring the arrows from 1.4: g/L ⇄ mol/L ⇄ [ions] ⇄ Ksp.

**Button:** Open the Sandbox (opens `sandbox.html` with PbI₂ selected).

**Stage:** "saturate" preset, PbI₂.

---

## Part 1 coverage check

| From `DISCOVERY.md` (Block 1) | Section |
|---|---|
| LI: relationship between molar solubility (mol/L), solubility (g/L) and Ksp | 1.4, 1.5, 1.6 |
| LI: contextualize these data points and begin a lab using technologies | 1.3 (observations), 1.7 (lab measurements), wrap |
| LI: convert between amount dissolved and Ksp, both ways, with practical applications | 1.5 and 1.6 (Ksp → s), 1.7 (measurement → Ksp) |
| Questioning and predicting: observations of real life phenomena, own questions | 1.3 observation cards; predict chips in 1.2, 1.6, 1.8 |
| Planning and conducting: SI units and equipment, accurate data | 1.1 (units), 1.7 (volume, mass, significant figures) |
| Applying and innovating: multiple strategies to solve for Ksp | 1.7 (mass, conductivity and one-ion strategies) |
| Evaluating: analyze sources and evaluate approaches to Ksp problems | 1.8 (Ksp comparison trap, two students' solutions) |

**New stage presets this Part needs (Task 7):**
- flask and dilution
- booklet rules table
- evaporating dish and balance
- conductivity probe with a calibration graph
- two small beakers side by side

The other presets reuse the beaker, window, check and readout as they are now.

---

# Part 2: Q vs Ksp

## Before you begin (Part 2)

**Heading:** Part 2: Q vs Ksp

**Learning intentions**
- We will apply our knowledge of "Q" vs. K to salts and how that can let us know if something will precipitate in solution or not.
- We will connect Q and K back to equilibrium and how it applies to salts
- We will begin our next lab!

**Curricular competencies**
- **Processing and analyzing data and information:** We will use our knowledge of scientific concepts to draw conclusions that are consistent with evidence in the lab

**Stage:** the hub's "saturate" tile animation, large.

---

## 2.1 · Q: the same expression, at any moment (`p2-q`)

**Heading:** Q: the same expression, at any moment

> Ksp uses the ion concentrations at equilibrium. The **ion product**, **Q**, uses the same expression with the concentrations right now, whatever they are.
>
> Comparing Q with Ksp tells you what happens next. This is the same Q vs K reading you already know.

- **Q < Ksp:** the solution is **unsaturated**. More solid can dissolve.
- **Q = Ksp:** the solution is **saturated**. Nothing changes overall.
- **Q > Ksp:** too many ions for the water to hold. A solid **precipitates** (forms and settles out) until Q falls back to Ksp.
- **Watch:** add PbI₂ one scoop at a time. The Q marker climbs towards Ksp and stops there once solid stays on the bottom.

**Predict chip:** "A PbI₂ solution has Q = 2.0 × 10⁻⁹. Ksp is 8.5 × 10⁻⁹. Is it unsaturated, saturated, or will a solid form?" Reveal: "Unsaturated. Q < Ksp, so more PbI₂ could dissolve."

**Stage:** "q-climb" preset. PbI₂ Beaker + Window + Check, starting with no solid, with an **Add a scoop** button. The Readout is hidden so all the attention goes to the check.

---

## 2.2 · Mixing two solutions: dilute first (`p2-dilute`)

**Heading:** Mixing two solutions? Dilute first

> When two solutions are poured together, each one spreads into the total volume. Every concentration drops before anything else happens. Work out the new concentrations first, then Q.
>
> Predict first: "50.0 mL of 0.0020 M Pb(NO₃)₂ is mixed with 50.0 mL of 0.0030 M KI. Does a yellow solid form?"

**Predict chip:** Yes / No. Reveal after the worked steps.

**Worked steps:**

| Line | Reason under it | Marks |
|---|---|---|
| V = 50.0 mL + 50.0 mL = 100.0 mL | The total volume after mixing | the mixed beaker's level |
| [Pb²⁺] = (0.0020 M)(50.0 mL) ÷ 100.0 mL = 1.0 × 10⁻³ M | c₁V₁ = c₂V₂, from Part 1 | Pb²⁺ in the mixed beaker |
| [I⁻] = (0.0030 M)(50.0 mL) ÷ 100.0 mL = 1.5 × 10⁻³ M | Each solution is diluted by the other | I⁻ in the mixed beaker |
| Q = [Pb²⁺][I⁻]² | Same expression as Ksp | |
| = (1.0 × 10⁻³)(1.5 × 10⁻³)² | | |
| = 2.3 × 10⁻⁹ | | the Q marker |
| Q < Ksp (8.5 × 10⁻⁹) | No solid forms. The mixture stays clear | the check's symbol |

**Evaluate card:** "A student skipped the dilution and used 0.0020 M and 0.0030 M." Their Q = (0.0020)(0.0030)² = 1.8 × 10⁻⁸, which is greater than Ksp, so they predicted a yellow solid. Prompt: "What does the real mixture show?" Reveal: "It stays clear. Skipping the dilution made Q 8 times too big: each concentration was 2 times too big, and [I⁻] is squared."

**Stage:** "mix" preset. Two small beakers pour into a larger one. The Window shows the ions spreading out as the volume doubles, and the Check updates as the pour finishes. A toggle, **Without dilution**, moves a ghost Q marker to 1.8 × 10⁻⁸ so the two readings can be compared.

---

## 2.3 · Will a solid form? (`p2-predict`)

**Heading:** Will a solid form?

> Now with unequal volumes. Predict, then check.
>
> "25.0 mL of 0.010 M AgNO₃ is mixed with 75.0 mL of 0.0010 M NaCl."

**Worked steps:**

| Line | Reason under it | Marks |
|---|---|---|
| V = 25.0 mL + 75.0 mL = 100.0 mL | | |
| [Ag⁺] = (0.010 M)(25.0 mL) ÷ 100.0 mL = 2.5 × 10⁻³ M | | Ag⁺ |
| [Cl⁻] = (0.0010 M)(75.0 mL) ÷ 100.0 mL = 7.5 × 10⁻⁴ M | | Cl⁻ |
| Q = [Ag⁺][Cl⁻] = (2.5 × 10⁻³)(7.5 × 10⁻⁴) | | |
| = 1.9 × 10⁻⁶ | About 10 000 times Ksp | the Q marker, off the scale |
| Q > Ksp (1.8 × 10⁻¹⁰) | A white solid of AgCl forms | the new solid in the beaker |

> Then try four quick ones. Each mix uses equal volumes, so every concentration halves. Tap Yes or No, then Reveal. The stage runs the real mix.

**Predict chips:**

| Mix (equal volumes) | Q after mixing | Ksp | Solid? |
|---|---|---|---|
| 0.10 M Pb(NO₃)₂ + 0.10 M KI | 1.3 × 10⁻⁴ | 8.5 × 10⁻⁹ | Yes, yellow PbI₂ |
| 1.0 × 10⁻⁵ M AgNO₃ + 1.0 × 10⁻⁵ M NaCl | 2.5 × 10⁻¹¹ | 1.8 × 10⁻¹⁰ | No |
| 2.0 × 10⁻⁴ M Mg(NO₃)₂ + 2.0 × 10⁻⁴ M NaOH | 1.0 × 10⁻¹² | 5.6 × 10⁻¹² | No |
| 1.0 × 10⁻³ M AgNO₃ + 1.0 × 10⁻³ M K₂CrO₄ | 1.3 × 10⁻¹⁰ | 1.1 × 10⁻¹² | Yes, brick-red Ag₂CrO₄ |

Each reveal shows the halved concentrations, Q, and the check's symbol.

- **Notice:** the spectator ions (Na⁺, K⁺, NO₃⁻) never appear in Q. The solubility rules from Part 1 say they stay dissolved.

**Stage:** "mix" preset, one mix per chip. The colour of any solid is always named in text ("a yellow solid forms").

---

## 2.4 · Back to equilibrium (`p2-equilibrium`)

**Heading:** Back to equilibrium: Q moves to Ksp

> When Q > Ksp, the solid does not form all at once and then stop at a random point. Ions join the solid until the ions left in the water give Q = Ksp exactly. The solution left above the solid is saturated.
>
> It is the same story as the Le Châtelier sim. When Q > K, the reaction runs in reverse until Q = K. Here, "in reverse" means ions leaving the water and joining the solid.

- **Watch:** after the AgCl mix, the Q marker slides back from off the scale to the Ksp line. In the Window, new layers build up on the solid.
- **Watch:** the arrows in the dissolving equation. The reverse arrow is bigger while the solid forms, and both arrows are equal once Q = Ksp.
- **Notice:** the dissolved ions do not drop to zero. In the AgCl mix, there was more Ag⁺ than Cl⁻. Once Q = Ksp, about 1.75 × 10⁻³ M Ag⁺ is left, and only 1.0 × 10⁻⁷ M Cl⁻. Almost all the chloride is now in the solid. Part 4 uses exactly this to separate ions.

**Link:** "Open the Le Châtelier sim, PbI₂ scene" (`../equilibrium_simulations.html`), for students who want to see the same reading with K.

**Stage:** "settle" preset. The AgCl mix from 2.3, replayed so students can watch Q fall to Ksp while layers form. A tap on the stage settles it instantly.

---

## 2.5 · What does the evidence show? (`p2-evidence`)

**Heading:** What does the evidence show?

> In the lab you see a result, not Q. Your conclusion has to match what you actually saw. Choose the conclusion that fits each observation.

**Evidence chips** (one choice each, then Reveal):

1. **"The mixture stays clear."**
   - Options:
     - **No Pb²⁺ is present.**
     - **Q was not greater than Ksp.**
     - **The Ksp in the booklet is wrong.**
   - Reveal: "Q was not greater than Ksp. The ions are there, but too few to form a solid."
2. **"A yellow solid forms."**
   - Options:
     - **Q was greater than Ksp when the solutions met.**
     - **All the Pb²⁺ is now in the solid.**
     - **Q is still greater than Ksp.**
   - Reveal: "Q was greater than Ksp at mixing. Now Q = Ksp, and a little Pb²⁺ is still dissolved."
3. **"Your calculation says Q is just above Ksp, but the mixture looks clear."**
   - Options:
     - **The calculation must be wrong.**
     - **Very little solid forms, and it may be too little to see, or slow to appear.**
     - **Q vs Ksp doesn't work for real solutions.**
   - Reveal: "When Q is only just above Ksp, very little solid forms. Look again after a few minutes, or against a dark background. Report what you saw, and say how it compares with your prediction."

- **Notice:** a good lab conclusion states the observation, links it to Q and Ksp, and says whether it agrees with the prediction.

**Stage:** "evidence" preset. Three test tubes for the three cards: clear, yellow solid, and a faint haze. The haze uses a PbI₂ mix with Q just above Ksp, which the engine settles to a very small amount of solid.

---

## Part 2 wrap: try it (`p2-try`)

**Heading:** Try it in the Sandbox

> Open the Sandbox and mix two solutions. Change one concentration at a time, and find the point where a solid just starts to form. Then check it with Q = Ksp.
>
> Your Q vs Ksp lab starts next. Remember to dilute first.

**Button:** Open the Sandbox (mixing mode).

**Stage:** "mix" preset, Pb(NO₃)₂ and KI.

---

## Part 2 coverage check

| From `DISCOVERY.md` (Block 2) | Section |
|---|---|
| LI: apply Q vs K to salts to know if something will precipitate | 2.1, 2.2, 2.3 |
| LI: connect Q and K back to equilibrium and how it applies to salts | 2.1, 2.4 (Le Châtelier link) |
| LI: begin our next lab | 2.5 (lab evidence), wrap |
| Processing and analyzing data and information: conclusions consistent with evidence in the lab | 2.5 evidence chips; 2.2 evaluate card (prediction vs the real mix) |

**New stage presets this Part needs (Task 7):**
- **"mix":** pouring two beakers into one, with the dilution shown in the Window
- **"Without dilution":** a ghost Q marker
- **"evidence":** three test tubes (clear, solid, faint haze)

**Engine note:** a faint haze needs a "barely over Ksp" amount of solid to look faint. The pile and layer drawing should scale down cleanly for tiny amounts.

---

# Part 3: Changing solubility

## Before you begin (Part 3)

**Heading:** Part 3: Changing solubility

**Learning intentions**
- We will discover what factors effect the solubility of salts in relation to LeChateliers principle
- We can apply different equilibrium stresses to dissolve more, or less, salt in a solution

**Curricular competencies**
- **Questioning and predicting:** We will sustain our intellectual curiosity as it applies to our Kidney Stones Lab
- **Questioning and predicting:** We will hypothesize and predict multiple outcomes with different scenarios
- **Processing and analyzing data and information:** We will use knowledge of LeChateliers principles to draw conclusions about solubility

The competencies are listed as written. The Kidney Stones Lab is mentioned by name here and in the wrap, and nowhere else in the suite.

**Stage:** saturated PbI₂ Beaker + Window, idle.

---

## 3.1 · Stressing a Saturated Solution (`p3-stress`)

**Heading:** Stressing a Saturated Solution

> A saturated solution with solid on the bottom is at equilibrium. That means **Le Châtelier's principle** applies. If you add a **stress**, the equilibrium shifts to reduce it.
>
> For PbI₂(s) ⇌ Pb²⁺ + 2 I⁻ there are three stresses you can apply:
> - add one of the ions
> - remove one of the ions
> - change the temperature
>
> A shift to the right dissolves more solid. A shift to the left forms more solid.

- **Notice:** adding more solid is not a stress. The solid is not in the Ksp expression, so the concentrations stay the same. There is just more on the bottom.
- **Notice:** only temperature changes the value of Ksp. The other two stresses change Q, and the system shifts until Q = Ksp again.

**Stage:** "stress" preset. Saturated PbI₂ with the Check visible. Three buttons are shown but greyed out (Add KI, Add acid, Heat), each labelled with the section that uses it.

---

## 3.2 · The common ion effect (`p3-common`)

**Heading:** The common ion effect

> Add KI to saturated PbI₂. KI is soluble, so it adds lots of I⁻. That raises Q above Ksp, and the equilibrium shifts left. Yellow PbI₂ forms until Q = Ksp again.
>
> An ion that is already part of the equilibrium is called a **common ion**. Adding a common ion always makes a salt **less** soluble. This is the **common ion effect**.

- **Watch:** press Add KI. The Q marker jumps past Ksp, new layers form on the solid, and the marker slides back to Ksp.
- **Watch:** after the shift, there is more I⁻ than before but less Pb²⁺. The window shows fewer Pb²⁺ ions.

> How much less soluble? Work out the molar solubility of PbI₂ in 0.10 M KI.

**Worked steps:**

| Line | Reason under it | Marks |
|---|---|---|
| PbI₂(s) ⇌ Pb²⁺ + 2 I⁻ | | |
| [Pb²⁺] = x, [I⁻] = 0.10 + 2x | The I⁻ from KI is there before any PbI₂ dissolves | the K⁺ / I⁻ already in the water |
| Ksp = (x)(0.10 + 2x)² | | |
| ≈ (x)(0.10)² | 2x is tiny next to 0.10, so leave it out | |
| x = 8.5 × 10⁻⁹ ÷ 0.010 = 8.5 × 10⁻⁷ mol/L | | the readout's "Dissolved" row |
| Check: 2x = 1.7 × 10⁻⁶, much smaller than 0.10 | The shortcut was fine | |
| 1.29 × 10⁻³ ÷ 8.5 × 10⁻⁷ ≈ 1500 | About 1500 times less soluble than in pure water | both values side by side |

**Predict chip (several outcomes):** "Which lowers the solubility of PbI₂ more: 0.10 M KI or 0.10 M Pb(NO₃)₂?" Options: **KI**, **Pb(NO₃)₂**, **The same**. Reveal: "KI, by far. In 0.10 M Pb(NO₃)₂, s = 1.5 × 10⁻⁴ mol/L, only about 9 times less. [I⁻] is squared in Ksp, so adding I⁻ has the bigger effect."

**Aside:** The same idea works for any salt. AgCl in 0.10 M NaCl has s = 1.8 × 10⁻⁹ mol/L, about 7500 times less than in pure water.

**Stage:** "common" preset. Saturated PbI₂ with Add KI and Add Pb(NO₃)₂ buttons, and Check + Readout visible. A tap on the stage settles it.

---

## 3.3 · Removing an ion with acid (`p3-acid`)

**Heading:** Removing an ion: acid

> Some anions react with H⁺. OH⁻ and H⁺ make water. CO₃²⁻ and H⁺ make HCO₃⁻. If acid removes the anion from a saturated solution, Q drops below Ksp. The equilibrium shifts right and more solid dissolves.
>
> Remember the milk of magnesia card from Part 1? Mg(OH)₂ is a white solid with very low solubility. Stomach acid removes its OH⁻, so it keeps dissolving. That is how an antacid works.

- **Watch:** add acid to saturated Mg(OH)₂. The window zooms in where the acid acts. H⁺ meets OH⁻ to make H₂O, then Mg²⁺ and OH⁻ leave the crystal, and the top layer gets smaller.
- **Watch:** with 1.0 × 10⁻³ M acid, Mg(OH)₂ dissolves about 5 times more than in pure water, and CaCO₃ about 14 times more.

> Calcium carbonate works the same way. Rainwater picks up CO₂ and becomes slightly acidic. Over thousands of years it dissolves limestone and carves out caves. Seawater is becoming slightly more acidic too, which makes it harder for shells made of CaCO₃ to form.

**Predict chip:** "Adding acid makes which of these dissolve more?" Choose all that apply: **AgCl**, **Mg(OH)₂**, **PbI₂**, **CaCO₃**. Reveal: "Mg(OH)₂ and CaCO₃. Their anions react with H⁺. Cl⁻ and I⁻ don't, so acid has no effect on AgCl or PbI₂."

- **Notice:** adding a base does the opposite to Mg(OH)₂. NaOH adds OH⁻, which is a common ion, so less dissolves.

**Stage:** "acid" preset. Saturated Mg(OH)₂ with an Add acid button, using the acid close-up. A salt switcher offers CaCO₃, AgCl and PbI₂ so the chip can be checked live. The pH row in the Readout stays hidden for CaCO₃ until the Task 8 decision on its readout.

---

## 3.4 · Changing the temperature (`p3-temp`)

**Heading:** Changing the temperature

> For most salts, dissolving takes in heat: ΔH is positive. Treat heat as a reactant:
>
> heat + PbI₂(s) ⇌ Pb²⁺ + 2 I⁻
>
> Heating adds a "reactant", so the equilibrium shifts right and more dissolves. Cooling shifts it left and solid forms. Temperature is the only stress that changes the value of Ksp.

**Readout table** (live from the engine as the slider moves; values from ΔH = +70 kJ/mol, matching the Le Châtelier sim):

| Temperature | Ksp of PbI₂ | Solubility |
|---|---|---|
| 25 °C | 8.5 × 10⁻⁹ | 0.59 g/L |
| 50 °C | 7.6 × 10⁻⁸ | 1.23 g/L |
| 80 °C | 6.9 × 10⁻⁷ | 2.57 g/L |
| 100 °C | 2.5 × 10⁻⁶ | 3.93 g/L |

- **Watch:** heat the beaker. The solid shrinks and the Ksp mark itself moves on the check, not just Q.
- **Watch:** cool it again. Bright yellow PbI₂ crystals form as the solution cools. Chemists call this "golden rain".
- **Notice:** about 6.6 times more PbI₂ dissolves at 100 °C than at 25 °C. The Data Booklet's Ksp values are all for 25 °C.

**Stage:** "temp" preset. Saturated PbI₂ with a temperature slider from 0 to 100 °C, and Check + Readout visible. The Ksp row shows its temperature.

---

## 3.5 · Predict several outcomes (`p3-predict`)

**Heading:** Predict, then test

> Use Le Châtelier to predict each change. Write a hypothesis in the form "If I…, then…, because…". Then test each one in the Sandbox.

**Predict chips** (More / Less / No change, then Reveal with a one-line reason):

| Change | Answer | Reason in the reveal |
|---|---|---|
| Add KI to saturated PbI₂ | Less | I⁻ is a common ion; Q > Ksp, shifts left |
| Add Pb(NO₃)₂ to saturated PbI₂ | Less | Pb²⁺ is a common ion |
| Add more solid PbI₂ | No change | The solid isn't in Ksp; the concentrations stay the same |
| Heat saturated PbI₂ | More | Dissolving takes in heat; Ksp gets bigger |
| Add NaCl to saturated AgCl | Less | Cl⁻ is a common ion |
| Add KNO₃ to saturated AgCl | No change | Neither K⁺ nor NO₃⁻ is in the AgCl equilibrium |
| Add acid to Mg(OH)₂ | More | H⁺ removes OH⁻; Q < Ksp, shifts right |
| Add NaOH to Mg(OH)₂ | Less | OH⁻ is a common ion |
| Add acid to AgCl | No change | Cl⁻ doesn't react with H⁺ |

- **Notice:** every answer comes from one question: does the change raise Q, lower Q, or change Ksp?

**Stage:** "predict" preset. It follows the selected chip's salt, and the chip's button runs that change after the reveal.

---

## Part 3 wrap: try it (`p3-try`)

**Heading:** Try it in the Sandbox

> Open the Sandbox and push each salt both ways: make PbI₂, Mg(OH)₂ and CaCO₃ dissolve more, then less. For each push, say which stress you used and which way it shifted.
>
> Bring these three stresses into your Kidney Stones Lab.

**Button:** Open the Sandbox.

**Stage:** "stress" preset, all three buttons active.

---

## Part 3 coverage check

| From `DISCOVERY.md` (Block 3) | Section |
|---|---|
| LI: factors that affect solubility, using Le Châtelier's principle | 3.1, 3.2, 3.3, 3.4 |
| LI: apply stresses to dissolve more or less salt | 3.2 (less), 3.3 (more), 3.4 (both), wrap |
| Questioning and predicting: curiosity for the Kidney Stones Lab | Wrap (named only; no kidney-stone chemistry anywhere) |
| Questioning and predicting: hypothesize and predict multiple outcomes | 3.2 chip (KI vs Pb(NO₃)₂), 3.3 chip, 3.5 (nine outcomes, "If… then… because…") |
| Processing and analyzing data and information: use Le Châtelier to draw conclusions about solubility | 3.2 worked steps and check, 3.4 readout table, 3.5 reveals |

**New stage pieces this Part needs (Task 7):**
- greyed stress buttons with section labels
- a temperature slider with a Ksp mark that moves on the check
- the chip-driven "predict" preset

The acid close-up and growing layers are already built.

**Kidney check:** no oxalate, phosphate, urine, citrate or diet anywhere. The ocean and cave examples use CaCO₃ only.

---

# Part 4: Qualitative analysis

## Before you begin (Part 4)

**Heading:** Part 4: Qualitative analysis

**Learning intentions**
- We will discover how to use our understanding of solubility to investigate unknown solutions
- We will use precipitation to isolate key ions in a solution

**Curricular competencies**
- **Questioning and predicting:** We will make general hypothesis about which ions could be in a solution based on tests and observations both theoretically and practically
- **Processing and analyzing data and information:** We will use previous scientific knowledge of Ksp and solubility to determine what unknown ions are in a solution
- **Evaluating:** We will explore some careers in which qualitative analysis is crucial to the research
- **Applying and innovating:** We will use multiple strategies to solve problems in real-life and conceptual situations
- **Communicating:** We will communicate scientific ideas and suggest a course of action based on research.

**Stage:** the hub's Qual Lab tile animation, large.

**Ion set:** the Guide uses the Qual Lab's ions (Pb²⁺, Sr²⁺, Mg²⁺) and reagents (KI, Na₂SO₄, NaOH), so the Guide rehearses the method the Qual Lab practises. Neither one tests for the class lab's ions (Ag⁺, Ba²⁺, Fe³⁺).

---

## 4.1 · What's in the water? (`p4-unknown`)

**Heading:** What's in the water?

> **Qualitative analysis** finds out *which* ions are in a sample, not how much. (Finding how much is quantitative analysis, like your Ksp lab.)
>
> The idea is simple. Add a reagent that forms a solid with one ion and not the others. If a solid appears, that ion was there. Then separate the solid and test the liquid that's left for the next ion.

**Predict chip (hypothesis):** "An unknown is colourless and could contain any of Pb²⁺, Sr²⁺, Mg²⁺ and Cu²⁺. Which can you already rule out?" Reveal: "Cu²⁺. Its solutions are blue, so a colourless sample can't contain much of it. Pb²⁺, Sr²⁺ and Mg²⁺ are all colourless, so you'll need tests."

- **Notice:** a first observation (colour, smell, where the sample came from) narrows the list before any test. That is a hypothesis, not a result yet.

**Stage:** "unknown" preset. A test tube of clear liquid labelled "Unknown", with ion cards for Pb²⁺, Sr²⁺, Mg²⁺ and Cu²⁺ (blue swatch) beside it.

---

## 4.2 · One reagent, one solid (`p4-selective`)

**Heading:** One reagent, one solid

> **Selective precipitation** means choosing a reagent that makes only one of the ions precipitate. The solubility rules from Part 1 tell you which reagent to try.

**Predict chip:** "KI is added to a mixture of Pb²⁺, Sr²⁺ and Mg²⁺. Which solids form?" Choose all that apply: **PbI₂**, **SrI₂**, **MgI₂**. Reveal: "Only PbI₂, a yellow solid. Iodides are soluble except with Ag⁺, Pb²⁺ and Cu⁺."

> Ksp shows how well it works. With 0.050 M Pb²⁺, a solid starts once [I⁻] reaches 4.1 × 10⁻⁴ M. The scheme adds plenty of KI, so [I⁻] ends up near 0.9 M. Then the Pb²⁺ left in solution is
>
> [Pb²⁺] = Ksp ÷ [I⁻]² = 8.5 × 10⁻⁹ ÷ (0.9)² ≈ 1 × 10⁻⁸ M
>
> That is less than one millionth of what was there. The Pb²⁺ has been **isolated** in the solid.

- **Watch:** in the window, Pb²⁺ joins the yellow solid while Sr²⁺ and Mg²⁺ stay dissolved.
- **Notice:** this is Part 2's Q vs Ksp and Part 3's common ion effect, used on purpose. The extra I⁻ pushes almost all the Pb²⁺ out.

**Stage:** "selective" preset. A test tube with the three ions, an Add KI button, and the Window and Check. The check shows PbI₂'s Q vs Ksp. The solubility rule for SrI₂ and MgI₂ appears as text: "soluble by the rules".

---

## 4.3 · Why does the order matter? (`p4-order`)

**Heading:** Why test for Pb²⁺ first?

> Suppose you skip iodide and add Na₂SO₄ first. Both PbSO₄ and SrSO₄ have low solubility. Which one forms first?

**Worked steps (0.050 M of each ion):**

| Line | Reason under it | Marks |
|---|---|---|
| PbSO₄ starts when [SO₄²⁻] = 1.8 × 10⁻⁸ ÷ 0.050 = 3.6 × 10⁻⁷ M | Q = Ksp is the start of precipitation | PbSO₄ on the check |
| SrSO₄ starts when [SO₄²⁻] = 3.4 × 10⁻⁷ ÷ 0.050 = 6.8 × 10⁻⁶ M | A bigger Ksp needs more sulphate | SrSO₄ on the check |
| PbSO₄ forms first | It needs less sulphate | |
| When SrSO₄ starts, [Pb²⁺] = 1.8 × 10⁻⁸ ÷ 6.8 × 10⁻⁶ = 2.6 × 10⁻³ M | Pb²⁺ still dissolved at that point | |
| 2.6 × 10⁻³ ÷ 0.050 = 5.3 % of the Pb²⁺ is left | Both white solids are now forming together | both solids in the tube |

> The two Ksp values are too close, and both solids are white. You couldn't tell which ion made the solid. So the scheme takes Pb²⁺ out first with iodide, which leaves Sr²⁺ alone. Then sulphate finds only Sr²⁺.

**Predict chip:** "Why is NaOH the last reagent, not the first?" Options:
- **Hydroxides of both Pb²⁺ and Mg²⁺ have low solubility, so NaOH first would precipitate both.**
- **NaOH reacts too slowly.**
- **NaOH would dissolve PbI₂.**

Reveal: "The first. By the booklet's rules, hydroxides have low solubility with almost everything except alkali ions, H⁺, NH₄⁺ and Sr²⁺. So OH⁻ waits until Pb²⁺ is gone."

**Strategy chip (Applying and innovating):** "Could NaCl replace KI in step 1?" Reveal: "It could. PbCl₂ has low solubility too (Ksp = 1.2 × 10⁻⁵), and with about 0.9 M Cl⁻ only 0.03 % of the Pb²⁺ is left. But iodide leaves far less behind, and a yellow solid is easier to recognize than a white one. Different strategies can work. Pick the one with the clearest evidence."

**Stage:** "order" preset. Two test tubes side by side: one gets Na₂SO₄ first (two white solids, Check shows both above Ksp), the other follows the scheme. Each tube carries text labels naming its solids.

---

## 4.4 · Reading a scheme (`p4-scheme`)

**Heading:** Reading a scheme

> A **scheme** is a flowchart for an unknown. At each step:
> 1. Add the reagent.
> 2. Look for a solid.
> 3. **Centrifuge** (spin the tube so the solid packs at the bottom).
> 4. **Decant** (pour the liquid into a clean tube).
> 5. Take the liquid to the next step.

**Flowchart** (drawn on the stage, same as the Qual Lab's):
1. Add KI. A yellow solid means Pb²⁺. Centrifuge and decant.
2. Add Na₂SO₄ to the liquid. A white solid means Sr²⁺. Centrifuge and decant.
3. Add NaOH to the liquid. A white solid means Mg²⁺.

**Worked walk-through** (one tap per step, using the Task 5 steps component; each line has its observation and the Q vs Ksp numbers behind it). The example unknown contains Pb²⁺ and Mg²⁺:

| Line | Reason under it | Marks |
|---|---|---|
| Add KI: yellow solid | PbI₂: Q ≫ Ksp, so Pb²⁺ is present | the yellow solid; PbI₂ on the check |
| Centrifuge, decant | The liquid now has almost no Pb²⁺ | the decanted tube |
| Add Na₂SO₄: stays clear | Q < Ksp for SrSO₄ (no Sr²⁺), and for PbSO₄ (Pb²⁺ is gone) | the clear tube; both on the check |
| Add NaOH: white solid | Mg(OH)₂: Q ≫ Ksp, so Mg²⁺ is present | the white solid |
| Conclusion: Pb²⁺ and Mg²⁺ | Sr²⁺ is absent | the result card |

- **Notice:** "stays clear" is evidence too. It tells you an ion is absent, provided the earlier steps removed anything that would interfere.

**Button:** "Try an unknown in the Qual Lab" (`qual-lab.html`).

**Stage:** "scheme" preset. The flowchart with the current step highlighted, beside a test tube that follows the walk-through, plus the Check for the solid at that step.

---

## 4.5 · Who uses qualitative analysis? (`p4-careers`)

**Heading:** Who uses qualitative analysis?

> Testing for ions is everyday work in many jobs. Today most labs use instruments as well as precipitation tests, but the reasoning is the same: a test, an observation, and a conclusion that fits the evidence.

**Career cards** (a short line on what they test, and a "what would you ask them?" prompt for students' own notes):
- **Water-quality technician:** tests drinking water from wells, reservoirs and older buildings for metals such as lead.
- **Mining assayer:** finds out which metals are in rock samples, and how much, so a company knows whether a deposit is worth mining.
- **Forensic chemist:** identifies unknown substances from a scene, where the result may be used in court.
- **Environmental lab analyst:** checks soil and runoff near industry for ions that could harm fish or plants.

Prompt under the cards: "Pick one career. What would they need to know about solubility? What question would you ask them?" Nothing is saved.

**Stage:** "careers" preset. The four cards as large tiles, each with a simple drawn icon (no logos).

---

## 4.6 · This water may contain lead (`p4-action`)

**Heading:** This water may contain lead

> An older school building has lead pipes in one wing. Someone asks whether you could test the tap water for Pb²⁺ with KI, the way the scheme does.

**Worked steps (is a precipitation test enough?):**

| Line | Reason under it | Marks |
|---|---|---|
| Canada's drinking water limit for lead: 0.005 mg/L | Health Canada's maximum acceptable concentration | |
| [Pb²⁺] = 0.005 × 10⁻³ g/L ÷ 207.2 g/mol = 2.4 × 10⁻⁸ M | mg to g, then ÷ molar mass | |
| With 1.0 M I⁻: Q = (2.4 × 10⁻⁸)(1.0)² = 2.4 × 10⁻⁸ | Just above Ksp (8.5 × 10⁻⁹) | the Q marker, just right of Ksp |
| PbI₂ formed in 1 L = (2.4 × 10⁻⁸ − 8.5 × 10⁻⁹) mol × 461 g/mol ≈ 7 µg | Only the lead above the Ksp limit comes out; far too little to see (corrected at build from 11 µg, which assumed all the lead precipitates) | a tube that still looks clear |

> So a clear tube does not prove the water is safe. Water at the limit would still look clear. The KI test can show a big problem, but it can't show the water meets the limit.

**Communicate:** "Write a short note to the school's facilities manager." Use the frame:
- **What I would test:**
- **What a result would show, and what it wouldn't:**
- **What I recommend:**

There is no answer box and nothing is saved. A **Show one possible answer** reveal gives a model note:

> "A KI precipitation test could show very high lead, but water at the legal limit would still look clear, so a clear result doesn't mean the water is safe. I recommend sending samples to an accredited lab that measures lead with an instrument. Until the results come back, run the taps before use and use a filter certified for lead."

- **Notice:** a good recommendation says what the evidence can and can't support.

**Stage:** "action" preset. A tap above a test tube. KI is added, the tube stays clear, and the Check shows Q just above Ksp with the status "very little solid forms". This connects back to Part 2's evidence chip 3.

**To verify before build:**
- the Health Canada lead limit (0.005 mg/L, 2019): **verified at build**
- the wording of the model note

---

## Part 4 wrap: into the Qual Lab (`p4-try`)

**Heading:** Your turn: the Qual Lab

> Open the Qual Lab. You get a random unknown with any mix of Pb²⁺, Sr²⁺ and Mg²⁺, or none of them. Follow the scheme, record each observation, and decide which ions are in it before you reveal.
>
> Then take the method into your own qualitative analysis lab. It uses different ions, so you'll need to plan the order yourself.

**Button:** Open the Qual Lab.

**Stage:** the scheme flowchart, idle.

---

## Part 4 coverage check

| From `DISCOVERY.md` (Block 4) | Section |
|---|---|
| LI: use solubility to investigate unknown solutions | 4.1, 4.4, wrap |
| LI: use precipitation to isolate key ions | 4.2, 4.3 |
| Questioning and predicting: hypotheses about which ions could be present | 4.1 chip, 4.2 chip |
| Processing and analyzing data and information: use Ksp and solubility to determine unknown ions | 4.2 (ion left), 4.3 worked steps, 4.4 walk-through |
| Evaluating: careers where qualitative analysis is crucial | 4.5 |
| Applying and innovating: multiple strategies, real-life and conceptual | 4.3 strategy chip (NaCl vs KI), 4.6 (real-life test) |
| Communicating: communicate ideas and suggest a course of action | 4.6 note to the facilities manager |

**New stage presets this Part needs (Task 7):**
- unknown tube with ion cards
- selective tube
- order comparison (two tubes)
- scheme flowchart + following tube
- career tiles
- tap and clear tube

The tube, centrifuge and decant drawings are shared with the Qual Lab (Task 9), so they get built once.

**Lab secrecy check:**
- No qualitative analysis content (Part 4 and the Qual Lab) tests for Ag⁺, Ba²⁺ or Fe³⁺, or shows the class lab's reagents or order.
- Ag⁺ appears only as a Ksp example in Parts 1 and 2 (AgCl, Ag₂CrO₄). Ba²⁺ and Fe³⁺ appear nowhere.
- The wrap tells students their lab uses different ions.
