# Discovery - Intro to Equilibrium

> Capture answers here as we go. No sim files until the brief is approved.
> Designpowers lane: **Build** · Mode: **Direct** (emulated in Claude Code; plugin not available)

---

## Known so far

- **Working title:** Intro to Equilibrium
- **Repo home:** `equilibrium-intro/` inside DiSimulations
- **Process:** Designpowers from the ground up (discovery → brief → strategy → plan → taste → build), same artefacts as `intermolecular-forces/`
- **Course / hub:** AP Chemistry 12 (`ap-chemistry-12/index.html`), card placed **before** "Equilibrium Simulations" (Le Châtelier)
- **Relationship to existing sim:** groundwork for `equilibrium_simulations.html` (sealed vessel, T/V/add gas, concentration graph, Q vs K). Must read as the same family.
- **Visual identity:** IMF "Toy Box" suite (`intermolecular-forces/assets/suite.css`, Space Grotesk + Space Mono), already borrowed by the Le Châtelier page
- **Tech (assumed):** vanilla HTML/CSS/JS, no build step, Netlify static

### Architecture - IMF-style, two parts
1. **Guide:** scroll beats with a sticky interactive stage. **Names** ideas (ΔH, ΔS, reversible, dynamic equilibrium, state function, ΔG). Teaching voice on.
2. **Sandbox:** quiet discovery. Students manipulate and observe; minimal labels. Transfer what the Guide taught.

**Navigation:** free jump between hub / Guide / Sandbox. No unlock gates. Suggested order only.

### Pedagogy posture
- Same as IMF: **pre-load** before class discussion. **Sim carries the teaching.** No worksheet, no scores, no saved answers.
- Guide names, Sandbox stays quiet.
- Clarity over physics realism.

### Curriculum sources

#### Block 1 - Enthalpy and entropy (verbatim)

Learning Intentions. We will:
- Distinguish the differences and relationships between enthalpy and entropy
- Apply our understanding of enthalpy and entropy in physical and chemical systems
- Understand the factors which influence the "sign" of enthalpy and entropy

Curricular Competencies
- **QP:** We will make hypothesis about ΔH and our previous understandings of enthalpy
- **C:** We will express and reflect on a variety of experiences both in the lab and outside of the lab

#### Block 2 - Equilibrium (verbatim)

Learning Intentions. We will:
- see the relationship between macro and micro characteristics of equilibrium.
- start to realize that many important chemical reactions are reversible.
- See how equilibrium is all around us
- make connections between rates and equilibrium.
- understand how graphs can help illustrate equilibrium.

Curricular Competencies
- **QP:** We will demonstrate our sustained intellectual curiosity by making connections between equilibrium and other disciplines/topics
- **PAI:** We will analyze graphs related to rates and equilibrium
- **PAI:** We will look at patterns and trends within chemical reactions from our environment

#### Block 3 - Gibbs free energy (verbatim)

Learning Intentions. We will:
- Learn about the mathematical relationships between H and S.
- Discover how to use "Gibbs Free Energy" to predict how a reaction will proceed.
- Both in general and mathematically.
- Look at what "state functions" are

Curricular Competencies
- **C:** We will look at formulas that describe a real life phenomena
- **E:** We will evaluate some limitations of this formula and "real life" applications

---

## Open questions

### 1. Curriculum & audience
- [x] Course: AP Chemistry 12, intro ahead of Le Châtelier
- [x] LI / competencies provided (3 blocks above)
- [x] Sim carries teaching, no worksheet
- [x] Prior knowledge: ΔH / endo vs exo (refresh only) · rates + collision theory · Hess's law. **Entropy is brand new** (Guide builds S from scratch)
- [ ] Is this one pre-load or spread across several lessons (one per LI block)?

### 2. Scope of the chemistry
- [x] Guide examples: phase changes (ice, evaporation) · cold/hot packs (NH₄NO₃ vs CaCl₂) · sealed soda bottle · blood + ocean CO₂ (cross-discipline)
- [x] **No K / Q here.** Suite stops at "rates equal, concentrations constant"; K belongs to the Le Châtelier sim
- [x] Gibbs is **qualitative**: four ΔH/ΔS sign cases + T slider; no arithmetic, no unit conversion
- [x] State functions: two paths, same Δ (Hess-style picture; H, S, G are state functions)
- [x] Limits of ΔG: says nothing about speed (diamond → graphite) · ΔH, ΔS assumed constant so crossover T is an estimate. (Open systems / ATP coupling: out)

### 3. The manipulable (Sandbox)
- [x] **Core manipulable: reversible vessel + Gibbs bars.** Sealed vessel running a reversible reaction; set starting mix and T; forward/reverse rates converge (rate vs time) beside concentration vs time; live ΔH / −TΔS / ΔG bars
- [x] Card deck / two-chamber box not chosen for Sandbox (process cards may still live in the Guide)
- [x] Vessel menu: real reactions covering all four sign cases **plus** a custom A ⇌ B with ΔH/ΔS sign toggles
- [ ] Particle view (micro) and graph/colour view (macro) shown together?

### 4. Guide
- [ ] Beat order (draft): Heat flows → Spreading out → Both arrows → Rates meet → Equilibrium around us → State functions → ΔG = ΔH − TΔS → Limits of ΔG → Hand-off to Le Châtelier sim
- [x] QP: predict-then-reveal chips (tap +/− for ΔH and ΔS, reveal with one-line reason; nothing saved or scored)

### 5. Visual identity
- [x] Toy Box suite carries over
- [ ] New tokens: ΔH energy-flow colour, ΔS spread cue, ΔG sign colours (red/yellow stays reserved for charge)

### 6. Constraints
- [ ] Timeline / first slice
- [x] Device priority: class laptop and tablet. Phones are not a target (user, 2026-10-30)
