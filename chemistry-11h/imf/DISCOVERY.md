# Discovery - Intermolecular Forces

> Capture answers here as we go. No sim files until the brief is approved.
> Designpowers lane: **Build** · Mode: **Direct** (default)

---

## Known so far

- **Working title:** Intermolecular Forces (IMF)
- **Repo home:** `intermolecular-forces/` inside DiSimulations
- **Process:** Designpowers from the ground up (discovery → strategy → design → build)
- **Course / hub:** Chemistry 11H - listed from `chemistry-11h/index.html` (alongside Unit 1b Atomic Structure)
- **Visual freedom:** Does **not** have to follow prior sim design choices. Fresh identity OK.
- **Tech (assumed):** vanilla HTML/CSS/JS, Netlify static

### Architecture - three parts
1. **Part 1 - Guide:** Walks the student through **each IMF type** with interactive components. **Intentionally names and shows** aspects (labels on, teaching voice on).
2. **Part 2 - Discovery sandbox:** Pick molecules, bring them close, watch interaction - **no force labels**. Transfer / apply what Part 1 taught.
3. **Part 3 - Physical properties:** Melting point, **boiling point**, and vapor pressure - **mostly discovery**-focused (ties IMF strength to macroscopic properties).
   - **Manipulable sketch:** **Heat the sample** - student warms a chosen substance; **temperature** and **pressure** gauges are available.
   - **Flow:** start **one substance at a time**, then a **compare** function for **side-by-side** heating.
   - Macroscopic behaviour (melt / boil / vapor pressure response) should read as a consequence of IMF strength from Parts 1–2 - still pedagogical, not a full thermo engine.

**Navigation:** Free jump between parts from a hub - **no unlock gates.** Order is suggested (Guide → Sandbox → Properties), never enforced.

### Pedagogy posture
- Hybrid: guided naming (Part 1) → unlabeled sandbox (Part 2) → property discovery (Part 3). Not pure “discover as you go” like Unit 1b end-to-end.
- **Sim carries the teaching** - no companion worksheet required. Part 1 Guide copy must stand in for the teacher (names, why, what to notice). Parts 2–3 stay quieter / discovery-led.
- **Anti-goal (learned the hard way):** a previous attempt was **too physics-dominant**. Prefer pedagogical clarity over realistic dynamics. Not “physics real” - get the *point* of different IMFs across.

### Core manipulable (sketch)
- Student chooses molecules → brings them near each other → sees which IMF(s) apply and (qualitatively) how they behave.
- Interaction should illustrate force *type* and *relative strength* drivers (shape, polarity, EN, contact area / polarizability) without a full MD simulation feel.

### Failure of the prior build (do not repeat)
- **Repulsion-dominated dynamics:** bringing two molecules together often made repulsive forces win → molecules flew off-screen or shot around randomly.
- **3D container was hard to use:** looking around / framing the scene competed with the chemistry.
- **Implication:** **2D interaction plane** (no orbit/rotate camera). Soft/bounded motion, no runaway trajectories. Pedagogy > conservation of momentum.

### Stage / rendering
- **Interaction:** 2D - drag, approach, soft attract/repel, in-plane rotation to favourable pose. Camera does **not** need to orbit if those moves read clearly.
- **Look:** **fake depth / space-filling** molecules (soft-shaded spheres, volume illusion) - not flat schematic discs, not a true 3D scene you navigate.

### Desired interaction feel (“gets the point across”)
- **Squishy electron clouds** around molecules - soft, deformable envelopes that attract or repel on contact/nearness (not rigid billiard balls, not ballistic MD).
- **Polarity via colour:** δ+ / δ− (and ion charges) use related colours so polarity is readable at a glance.
- **Attraction (opposite charges)** draws molecules together; **repulsion (same charge)** pushes them apart - qualitative Coulomb story, not full electrostatic solver.
- **Favorable reorientation:** if molecules approach near a better alignment, they may **rotate into a more favorable conformation** (dipole–dipole / H-bond geometry) rather than only translating.
- Still **not physics-real** - staged / damped / capped forces so nothing flies off the stage.
- **London dispersion (LDF):** shown via **pulsing** cloud polarity - temporary / fluctuating dipoles, not fixed δ+/δ− colour. Distinct from permanent-polarity colouring so students can tell LDF from dipole–dipole / H-bond at a glance.

### Curriculum sources
1. **Course learning intentions & success criteria** (verbatim below) - Chem 11H assessment spine.
2. **AP Chem Unit 3 / Topic 3.1 (SAP-5)** screenshot - force taxonomy and strength factors to cover in the model (reference content; course LI/SC still win for debrief wording).

#### AP Topic 3.1 force checklist (from screenshot - for model coverage)
- London dispersion (temp. dipoles; contact area; polarizability / e⁻ count / cloud size; π bonding enhances; LDF ≠ synonym for van der Waals)
- Dipole–induced dipole (polar + nonpolar; always attractive)
- Dipole–dipole (polar + polar; magnitude + orientation; often > LDF for similar size)
- Ion–dipole (ion + polar; typically stronger than dipole–dipole)
- Hydrogen bonding (H bonded to N/O/F attracted to N/O/F on neighbor)
- Qualitative via partial-charge signs / orientation
- Note: biomolecule intramolecular H-bonds (SAP-5.A.5) - scope TBD

### Learning intentions (verbatim)
- We will learn about the different types of INTERmolecular forces using our knowledge of shape, polarity, EN, and INTRAmolecular forces
- We will learn about the physical properties (melting point, vapor pressure) associated with IMFs
- We will learn about some of the details about each type of IMF and what leads to stronger or weaker IMFs
- We will discuss what makes some molecules "polar" and other molecules "non-polar" based on their VESPR shape
- I can see the relationship between electronegativity, shape, and Intramolecular forces

### Success criteria (verbatim)
- **QP:** I can predict how changing a molecule’s shape or the elements involved (based on electronegativity) could lead to different types of polarity or intermolecular interactions.
- **QP:** I can predict the types of intermolecular forces present between molecules based on their structure and polarity, and hypothesize how changes in molecular shape or electronegativity would affect those forces.
- **PAI:** I can analyze how patterns in electronegativity and molecular geometry help determine whether a molecule is polar or non-polar.
- **PAI:** I can identify and explain how the polarity and shape of molecules lead to different types of intermolecular forces (e.g., dipole-dipole, London dispersion, hydrogen bonding), using evidence from molecular properties.
- **E:** I can evaluate statements and data regarding polarity by applying my understanding of electronegativity and molecular shape to support or refute those claims with evidence.
- **E:** I can assess the strengths and limitations of using simplified models (like ball-and-stick or space-filling models) to represent intermolecular forces, and suggest how they might misrepresent real molecular interactions.
- **C:** I can model the relationship between molecular structure (including intramolecular bonds) and the resulting intermolecular forces using drawings, physical representations, or analogies.

---

## Open questions

### 1. Curriculum & audience
- [x] Course: Chemistry 11H
- [x] LI / SC provided; AP 3.1 as force taxonomy reference
- [x] Sim carries teaching - no companion worksheet required

### 2. Scope of the chemistry
- [x] Force types: LDF, dipole–induced, dipole–dipole, ion–dipole, H-bonding (per AP 3.1)
- [x] Physical properties live in **Part 3** (MP, BP, vapor pressure) - not forced into the pair sandbox
- [ ] Biomolecule same-molecule H-bonds in or out?
- [x] Molecule set locked (see table below)
- [x] Part 3: heat-the-sample + T/P gauges; **individual first, then compare (side-by-side)**
- [ ] Part 3 details: phase change visuals? vapor pressure as gauge reading vs particle escape? when compare unlocks (after first sample? always available?)

### Molecule set - draft (for discussion)

Goal: cover every IMF type + polarity/VSEPR story with a **small** roster. Species can appear in Guide demos, Sandbox picker, and (where useful) Part 3 property comparisons.

| Species | Why it's here | Forces it unlocks / teaches |
|---|---|---|
| **Ne** | Tiny nonpolar, weak LDF only | Pure LDF baseline (pulse only) |
| **CH₄** | Nonpolar, tetrahedral, common comparison | LDF; “nonpolar despite polar bonds” / VSEPR |
| **Br₂** | Larger nonpolar → stronger LDF | LDF strength vs size / polarizability |
| **HCl** | Polar, no H-bond donor pattern | Dipole–dipole (+ LDF); permanent δ+/δ− colour |
| **CO₂** | Linear, polar bonds cancel → nonpolar | Shape → polarity; LDF only between CO₂…CO₂ |
| **H₂O** | Bent, H-bond poster child | H-bonding + dipole; Part 3 property star |
| **NH₃** | Trigonal pyramidal, H-bonds | H-bonding; compare to H₂O / CH₄ |
| **HF** | Strong H-bond, simple diatomic | H-bonding; Guide clarity |
| **CH₃OH** | Organic H-bonder | Another H-bonding example; Part 3 rankings |
| **Na⁺** (+ polar partner) | Ion with e.g. H₂O | Ion–dipole |
| **Octane (C₈H₁₈)** | Bulky nonpolar hydrocarbon | Strong LDF vs CH₄; dipole–induced with polar partner |
| **Glucose (C₆H₁₂O₆)** | Bulky carbohydrate + many OH | Size + H-bonding; contrast with octane |

**Roster status:** Locked - Ne, CH₄, Br₂, HCl, CO₂, H₂O, NH₃, HF, CH₃OH, Na⁺, octane, glucose.

**Suggested Sandbox default pairs (no labels):** CH₄–CH₄ · Br₂–Br₂ · HCl–HCl · H₂O–H₂O · CH₃OH–CH₃OH · HCl–Ne · Na⁺–H₂O · H₂O–CH₄ · HCl–octane · CH₄–octane · octane–octane · glucose–glucose · H₂O–glucose · CH₃OH–H₂O

**Part 3 property lens (candidates):** CH₄ vs Br₂ vs octane vs HCl vs H₂O vs HF vs CH₃OH vs glucose - BP / vapor pressure / “who sticks.”

### 3. Pedagogy posture
- [x] Three-part: Guide (named) → Sandbox (unlabeled) → Properties (discovery)
- [x] Clarity > physics realism
- [x] Naming: Part 1 names; Part 2 does **not** label forces
- [x] Free navigation between parts - no gates

### 4. The manipulable
- [x] Parts 1–2 share cloud / polarity / soft attract–repel language
- [x] Prior failure: runaway repulsion + awkward 3D camera
- [x] Desired feel: squishy coloured clouds, attract/repel by charge sign, gentle reorient to favourable pose
- [x] LDF = pulsing / fluctuating cloud polarity (not fixed charge colours)
- [x] Stage: 2D interaction + **fake-depth space-filling** look; no camera orbit
- [x] Drag-to-approach assumed for sandbox
- [x] Part 1 beat list per force type (Guide Tasks 4–5, 2026-10-16)
- [x] Sim carries teaching (no companion worksheet)
- [ ] Biomolecule intramolecular H-bonds - out of v1 unless added later

### 5. Visual identity
- [x] Free of prior-sim look constraints - own identity OK
- [ ] Feel / references (calibrate in design-taste after brief)

### 6. Constraints
- [x] Hub: Chemistry 11H
- [ ] Timeline / first slice
- [ ] Device priority (assume class laptop + phone OK)

---

## Approaches

**Chosen: B - Three distinct rooms, shared molecule kit**  
Guide / Sandbox / Heat as separate rooms; shared roster + space-filling / cloud visual language; free hub navigation.

---

## Design brief

Full brief: `docs/designpowers/briefs/2026-10-16-intermolecular-forces.md`  
Approval proceeds **section by section** in chat.