# Discovery - Solubility & Ksp (working title)

> Capture answers here as we go. No sim engine or room content until the brief is approved.
> Designpowers lane: **Build** · Mode: **Direct** (emulated in Claude Code, same as `equilibrium-intro/`)
> Folder name is a working title. Rename before build if the module title changes.

---

## Known so far

- **Working title:** Solubility & Ksp
- **Repo home:** `solubility/` inside DiSimulations
- **Process:** Designpowers from the ground up (discovery → brief → strategy → plan → taste → build), same artefacts as `equilibrium-intro/` (`docs/designpowers/{briefs,strategy,plans,taste}`)
- **Course / hub:** AP Chemistry 12 (`ap-chemistry-12/index.html`), card placed **after** Equilibrium Simulations (Le Châtelier) and **before** Titration (AP CED Unit 7.11 to 7.13 sits at the end of equilibrium, ahead of acids and bases)
- **Visual identity:** IMF "Toy Box" suite (`intermolecular-forces/assets/suite.css`, Space Grotesk + Space Mono), as used by `equilibrium-intro/`. Suite tokens go in `assets/sol.css` (placeholders only until the taste pass)
- **Tech:** static on GitHub Pages, no build step. Vanilla not required; libraries via CDN are fine (user, 2026-11-10)
- **Standing preferences:** robust animation (no reduced-motion branches), no dot-grid backgrounds, no em dashes in student copy (`.cursor/rules/no-em-dashes.mdc`), no personification of particles (repo `AGENTS.md`)
- **Device priority (inherited from equilibrium-intro):** class laptop and tablet. Phones not a target. _Confirm._

### Kidney stones stay out (user, 2026-11-16)
- The **Kidney Stones Lab is separate** and students research it on their own. Keep the mystery: **no kidney-stone chemistry in any room** (no calcium oxalate / calcium phosphate, no urine pH, citrate or diet stories).
- Use **other examples** for solubility and the common ion effect. A light nod that "this matters inside the body too" is fine; no explanation.

### Existing work to reuse or stay consistent with
- `equilibrium_simulations.html` already has a **PbI₂ Ksp scene** (Ksp = 9.8e-9 at 25 °C, ΔH_soln ≈ +70 kJ/mol, solubility rises ~6× from 25 °C to 100 °C; dissolving/growing runs on the crystal surface at Q/Ksp). Any PbI₂ numbers here must match it.
- `equilibrium-intro/` introduced **K symbolically** from elementary steps (Part 4). Ksp should read as "the same K, for a solid dissolving".

### Wiring done (2026-11-16, user request ahead of the brief)
- `solubility/index.html` hub: Room 1 Guide, Room 2 Sandbox, Room 3 Qual Lab, Refresher tile → Le Châtelier. Hub tile animations use ink/grey placeholders only
- `solubility/guide.html`, `solubility/sandbox.html`, `solubility/qual-lab.html`: "Being built" stubs with the room switcher (Hub · Guide · Sandbox · Qual Lab)
- All four pages carry `noindex, nofollow` and are **not** in `sitemap.xml` yet. Flip both when a room ships
- AP 12 hub: Solubility & Ksp card added (7 → 8 sims); AP 12 and root meta descriptions mention solubility
- **Room structure decided (user, 2026-11-16):** Guide + Sandbox + **Qual Lab** (third room for Block 4)

---

## Curriculum spine (verbatim from user)

### Main topics
1. Chem 11H Review of solutions, dilutions, and solubility rules
2. Molar Solubility (what is Ksp)?
3. Q vs. Ksp
4. Common Ion effect
5. Qualitative Analysis

### Block 1 - Molar solubility and Ksp (topics 1 and 2)

Learning Intentions
- We will learn about the relationship between molar solubility (mol/L), solubility (g/L), and the solubility product (Ksp)
- We will contextualize these data points and begin a lab to use technologies to assist us in our understandings.
- We will learn how to convert between the amount of substance dissolved to Ksp and vice-versa, as well as practical applications of these skills

Curricular Competencies
- **QP:** We will make observations of real life phenomena to identify our own questions about solubility
- **P&C:** Use appropriate SI units and equipment to accurately collect and record data
- **AI:** We will implement multiple strategies to solve for Ksp values in the lab
- **E:** We will critically analyze different sources of information and evaluate the approaches used to solve problems regarding Ksp calculations.

### Block 2 - Q vs. Ksp (topic 3)

Learning Intention
- We will apply our knowledge of "Q" vs. K to salts and how that can let us know if something will precipitate in solution or not.
- We will connect Q and K back to equilibrium and how it applies to salts
- We will begin our next lab!

Curricular Competencies
- **PAI:** We will use our knowledge of scientific concepts to draw conclusions that are consistent with evidence in the lab

### Block 3 - Common ion effect (topic 4)

Learning Intention:
- We will discover what factors effect the solubility of salts in relation to LeChateliers principle
- We can apply different equilibrium stresses to dissolve more, or less, salt in a solution

Curricular Competencies
- **Q&P:** We will sustain our intellectual curiosity as it applies to our Kidney Stones Lab
- **Q&P:** We will hypothesize and predict multiple outcomes with different scenarios
- **PAI:** We will use knowledge of LeChateliers principles to draw conclusions about solubility

### Block 4 - Qualitative analysis (topic 5)

Learning Intention:
- We will discover how to use our understanding of solubility to investigate unknown solutions
- We will use precipitation to isolate key ions in a solution

Curricular Competencies
- **Q&P:** We will make general hypothesis about which ions could be in a solution based on tests and observations both theoretically and practically
- **PAI:** We will use previous scientific knowledge of Ksp and solubility to determine what unknown ions are in a solution
- **E:** We will explore some careers in which qualitative analysis is crucial to the research
- **AI:** We will use multiple strategies to solve problems in real-life and conceptual situations
- **C:** We will communicate scientific ideas and suggest a course of action based on research.

---

## Open questions

### 1. Curriculum & audience
- [x] Course: AP Chemistry 12, after Le Châtelier
- [x] LI / competencies provided (4 blocks above)
- [x] **Posture (user, 2026-11-16): as before.** The Guide is the core of the teacher's lessons. **Presentation view** (the IMF / equilibrium-intro learn mode: toggle, ‹ › steppers, arrow keys / clickers step beats, Esc leaves) lets the teacher walk the sims as a lesson; the **explanation copy beside each beat** lets students go back over it on their own time. Same no gates, no scores posture
- [x] Guide structure (family pattern): "Before you begin" briefing listing each Part's learning intentions beside its competencies, then **Parts 1 to 4 matching the four blocks**, so each lesson starts at its Part. _Assumed from "as before", confirm at brief_
- [ ] Prior knowledge: assume K, Q, Le Châtelier and ICE tables are solid (from equilibrium-intro + Le Châtelier sim). _Confirm at brief_
- [x] **11H review = quick refresher (user, 2026-11-16).** Part 1 is a few beats: M = n/V and M₁V₁ = M₂V₂ (one worked example each) · solubility rules table with "soluble or not?" predict-then-reveal chips · "insoluble" really means "slightly soluble", which becomes Part 2's opening question (how much?)

### 2. Scope of the chemistry
- [x] **Numbers this time (user, 2026-11-16):** yes, unlike equilibrium-intro. **Guide** shows worked steps (g/L ↔ mol/L ↔ [ions] ↔ Ksp, the x² / 4x³ / 27x⁴ patterns). **Sandbox and Qual Lab** show real live values (concentrations, Ksp, Q) without walking through the maths. Guide teaches, other rooms stay quiet
- [ ] Salt menu (draft): AgCl (1:1) · PbI₂ (1:2, shared with Le Châtelier sim) · CaF₂ (1:2, fluoride) · Ag₂CrO₄ (2:1, coloured, qual) · Mg(OH)₂ (pH link) · maybe CaCO₃ / BaSO₄. **No CaC₂O₄** (kidney stones stay out)
- [x] **Factors (user, 2026-11-16): all three.** Sandbox lets students change:
  - **Common ion:** KI into saturated PbI₂ (more yellow solid, matches Le Châtelier sim) · NaCl into AgCl
  - **pH:** acid dissolves Mg(OH)₂ (antacid / stomach acid) · CaCO₃ (limestone caves, shells in a more acidic ocean) · fluoride and tooth enamel
  - **Temperature:** PbI₂'s real rise in solubility on heating (same numbers as `equilibrium_simulations.html`)
- [ ] Complex ions (e.g. AgCl dissolving in NH₃): out unless asked
- [ ] Ksp "comparison trap" (smaller Ksp ≠ less soluble when formulas differ): include as an E moment?
- [ ] Qual analysis scope: which ion groups (e.g. Ag⁺/Pb²⁺/Hg₂²⁺ chlorides, then sulfates, hydroxides)? Flowchart-style separation?

### 3. Architecture & manipulables
- [x] **3.1 Rooms:** Guide + Sandbox + **Qual Lab** (user, 2026-11-16). Guide names the idea of qualitative analysis; the Qual Lab is where students test unknowns, add reagents, separate precipitates and deduce ions
- [x] **3.1b Qual Lab shape (user, 2026-11-17): follow a scheme** (flowchart). Students add a reagent, see whether a solid forms, separate, and branch. No open bench.
  - **Must NOT copy the real class lab.** The real lab uses **Ag⁺, Ba²⁺, Fe³⁺**: the sim uses a different ion set (and ideally different reagents), so the method transfers but the answers don't.
  - [ ] Ion set + reagents (draft: Pb²⁺ / Ni²⁺ / Sr²⁺ · KI → yellow PbI₂ · then NaOH → green Ni(OH)₂ · then Na₂CO₃ → white SrCO₃). No oxalate or phosphate
  - [ ] Unknowns: any mix of the three (7 combinations + blank)? Final "which ions?" pick with a reveal, nothing saved?
- [ ] 3.2 Sandbox core: beaker of water + salt scoop; dissolve to saturation; live [ion] readout, Q vs Ksp gauge; add a common-ion salt; precipitate on mixing two solutions?
- [ ] 3.3 Micro + macro together (ions in a zoom window beside the beaker), as in equilibrium-intro?
- [ ] 3.4 Lab tie-ins: Ksp lab ("technologies": conductivity? mass of residue?), Q vs Ksp lab (Kidney Stones Lab is separate, not mirrored). Should the sim mirror any lab procedure, or stay independent so it doesn't spoil the labs?

### 4. Guide
- [ ] Beat order (draft): Solutions refresher → Dissolving a salt, saturation → Writing Ksp → s ↔ Ksp (g/L ↔ mol/L) → Comparing salts → Q vs Ksp, will it precipitate? → Common ion → Qual analysis → Careers → Hand-off to the labs
- [ ] QP: predict-then-reveal chips again (e.g. "will a solid form?"), nothing saved or scored?
- [ ] Careers for the E competency (forensics, water testing, mining assay, clinical labs): cards in the Guide?

### 5. Visual identity
- [x] Toy Box suite carries over
- [ ] Ion colours: reuse red = + / yellow = − charge convention for cations/anions, or give ions their own pair and keep red/yellow for δ only?
- [ ] Real precipitate colours (PbI₂ yellow, AgCl white, Ag₂CrO₄ red-brown) as a macro cue?

### 6. Constraints
- [ ] Timeline / first slice (which block first?)
