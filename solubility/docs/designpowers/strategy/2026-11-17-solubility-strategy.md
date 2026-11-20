# Design Strategy: Solubility & Ksp (AP Chem 12)

**Date:** 2026-11-17  
**Status:** Approved (2026-11-17)  
**Brief:** `docs/designpowers/briefs/2026-11-17-solubility.md`

---

## Design Principles

### 1. Same K, now for a solid
**The principle:** Ksp is the K students already know, written for a solid dissolving. Q vs Ksp is the same Q vs K.  
**In practice:** A saturated beaker is shown as dynamic. Ions keep leaving and rejoining the crystal while the amounts hold steady (the "it never stops" idea from Intro to Equilibrium). The Ksp expression is built from the dissolving equation, leaving out the solid exactly as K leaves out pure solids and liquids. The Q vs Ksp gauge looks and reads like Q vs K in the Le Châtelier sim.  
**We will NOT:** Present Ksp as a new formula to memorise, show a saturated solution as "finished", or invent a new visual language for Q.

### 2. Every number has a picture
**The principle:** Each quantity (g/L, mol/L, [ions], Ksp, Q) points at something students can see.  
**In practice:** Mass dissolved matches the solid shrinking in the beaker. [Ion] matches the particle view, where PbI₂ visibly releases two I⁻ for every Pb²⁺, so 4x³ comes from counting. In the Guide, each worked step that reveals lights up the part of the picture it refers to. In the Qual Lab, every observation ("yellow solid") comes with the Q vs Ksp numbers behind it.  
**We will NOT:** Show a number with nothing to point at, or show a picture whose behaviour disagrees with the numbers.

### 3. The Guide explains, the rooms measure
**The principle:** Only the Guide teaches and works the maths. The Sandbox and Qual Lab show real values and stay quiet. (This adapts "name once, then go quiet" from the IMF and equilibrium suites.)  
**In practice:** The Guide reveals worked steps one line at a time and uses predict-then-reveal chips. The Sandbox has readouts, axis names and a neutral live summary, but no worked steps, no "Saturated!" or "Precipitate!" banners and no hints. The Qual Lab shows what happened and the numbers; it names the ions only at the final reveal.  
**We will NOT:** Narrate the Sandbox, auto-solve conversions outside the Guide, score anything, or gate a room behind another.

### 4. Rehearse the method, keep the labs' secrets
**The principle:** The sim builds the skills the labs need without giving away any lab's answers.  
**In practice:** No kidney-stone chemistry anywhere. The Qual Lab uses Pb²⁺ / Sr²⁺ / Mg²⁺, not the real lab's Ag⁺ / Ba²⁺ / Fe³⁺. No room reproduces a lab procedure step for step. Each Part ends by pointing towards its lab ("you'll measure this yourself") without previewing results.  
**We will NOT:** Use calcium oxalate or phosphate, urine, citrate or diet examples, or let a Sandbox preset match a lab setup.

### 5. Readable from the back row, and without colour
**The principle:** Every value, verdict and observation works on a projector, by keyboard, with a screen reader and with colour blindness.  
**In practice:** In presentation view, numbers and gauges are large enough to read from the back of a classroom. Precipitate colours are always named in words. Ion charge is carried by + / − glyphs. Q vs Ksp uses position and <, =, > as well as colour. Live values and verdicts go to a polite live region. Motion is lively, but a tap or the next step settles any animation instantly. Headings carry their own labels (no eyebrow lines).  
**We will NOT:** Use colour alone for a precipitate, ion or verdict, make drag the only way to add salt or reagent, or put a small label line above a heading.

---

## Family Position

| Reference | Role | Our differentiation |
|---|---|---|
| `equilibrium_simulations.html` (Le Châtelier) | Already has a PbI₂ Ksp scene (Q/Ksp-driven dissolving, temperature) | Same PbI₂ numbers and Q vs K look. This suite adds the conversions, the comparison of salts, mixing, common ion, pH and qualitative analysis |
| `equilibrium-intro/` | Process and Guide parent; K built symbolically | Same Guide / presentation view / predict chips, and Parts that each open with their own "Before you begin". Numbers are in this time |
| `intermolecular-forces/` | Identity parent (Toy Box) | Same look, applied to ions in water |
| PhET "Salts & Solubility" (general reference) | Particle-level dissolving and saturation | We add real Ksp numbers and both-way conversions, Q vs Ksp with mixing, pH and temperature, and a qualitative analysis scheme. The Guide carries the teaching |

---

## Experience Map

Each Part is one lesson, presented by the teacher. Students reread it at home, and the rooms are open throughout.

| Lesson | Guide Part | Rooms | Then | Emotional state |
|---|---|---|---|---|
| 1 | **Part 1: Molar solubility and Ksp** (Before you begin → 11H refresher → saturation → Ksp → s ↔ Ksp → comparing salts) | Sandbox: dissolve AgCl and PbI₂ to saturation | Ksp lab | "I remember this" → "insoluble still dissolves?" (curious) → "4x³ comes from counting ions" (aha) |
| 2 | **Part 2: Q vs Ksp** (Before you begin → mixing and dilution → will a solid form? → back to Q vs K) | Sandbox: mix two solutions | Q vs Ksp lab | "Same as Q vs K" (confident) → "I forgot the dilution" (friction, then fixed) |
| 3 | **Part 3: Changing solubility** (Before you begin → common ion → pH → temperature → predict several outcomes) | Sandbox: push PbI₂, Mg(OH)₂, CaCO₃ both ways | Kidney Stones Lab (separate, a mystery) | "I can make it dissolve more or less" (in control) |
| 4 | **Part 4: Qualitative analysis** (Before you begin → selective precipitation → reading a scheme → careers → course of action) | **Qual Lab**: random unknowns | Real qualitative analysis lab | "Why iodide first?" (puzzle) → "I worked out what's in it" (pride) |

**Entry:** AP 12 hub → Solubility hub → Guide (for the lesson) or straight to a room (for practice).  
**Likely friction:** the algebra of 4x³, forgetting dilution when mixing, assuming "smaller Ksp means less soluble", and the logic of the scheme order. The Guide gives each one its own section and predict chip.  
**Exit:** each Part ends by pointing towards its lab, and Part 4 hands off to the Qual Lab.

---

## Success Metrics

- Students can go from g/L to Ksp and back for a 1:1 and a 1:2 (or 2:1) salt without a template.
- Students include the dilution step when predicting precipitation on mixing.
- Students describe a saturated solution as "dissolving and re-forming at the same rate", not "it stopped dissolving".
- Students can explain, using Le Châtelier, why a common ion lowers solubility and why acid raises it for Mg(OH)₂ and CaCO₃.
- Students can say why the scheme adds KI before NaOH, and can identify a random Qual Lab unknown from what they observe.
- **Accessibility:** every task in all three rooms can be completed by keyboard only, and every verdict is available as text.
- **Teacher:** each Part runs as a lesson in presentation view with no scrolling or setup.

---

## Constraints and Trade-offs

| Trade-off | Choice | Why |
|---|---|---|
| Real concentrations vs a visible particle view | Numbers are always real. The particle view is a zoomed, representative window ("not to scale" noted once in the Guide) | Real [Ag⁺] in saturated AgCl is about 1 in 4 million water molecules, which can't be drawn honestly |
| Real dissolving speed vs a lesson's pace | Saturation reached in seconds, driven by Q/Ksp (same approach as the Le Châtelier PbI₂ scene) | Students need to see it settle before attention drifts |
| Full pH speciation vs a readable pH story | "Add acid" removes OH⁻ or CO₃²⁻, with a pH readout. Carbonate chemistry simplified (no HCO₃⁻ / H₂CO₃ bookkeeping on screen) | AP 7.13 asks for the qualitative Le Châtelier argument |
| Temperature for every salt vs honest data | Temperature control only for salts with reliable data (PbI₂ at minimum); disabled with a short note for the others | Never invent a temperature trend |
| Ideal separations vs real ones | Qual Lab precipitation and decanting are clean; the Q vs Ksp numbers show how complete each step is | Keeps the scheme logic clear without hiding the chemistry |
| One engine vs separate demos | One dissolving engine shared by the Guide stage, the Sandbox and the Qual Lab test tube. Start from the PbI₂ code in `equilibrium_simulations.html` | One kit, one set of numbers, fewer bugs |
