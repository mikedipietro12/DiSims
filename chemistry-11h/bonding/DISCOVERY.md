# Discovery - Chemical Bonding (working title)

> Capture answers here as we go. No sim files until the brief is approved.
> Designpowers lane: **Build** · Mode: **Direct** (default)
> Folder name is a working title - rename before build if the module title changes.

---

## Known so far

- **Purpose:** Bridge module between **Unit 1b (Atomic Structure)** and **Intermolecular Forces**.
  - Unit 1b ends at: electron configurations, electron affinity, electronegativity (`09`), summary (`10`).
  - IMF assumes students arrive with: intramolecular bonding, shape, EN, polarity.
- **Course / hub:** Chemistry 11H (assumed - confirm)
- **Format (from user):**
  - Self-paced **scroll guide** modelled on `intermolecular-forces/guide.html` (sticky stage + beats).
  - **Presentation mode** for teacher-led use (clicker / arrow keys step beats).
  - **Draw mode**: stylus, mouse or trackpad - draw simple Lewis structures / connect Lewis dots, a simple take on app.moleview.com.
- **Tech (assumed):** vanilla HTML/CSS/JS, GitHub Pages, no build step (repo convention).

### Draw mode - decided
- **Phase 1 - Snap-and-count (most of the module):** place atoms, drag to form bonds (single / double / triple) and lone pairs. Running tally of valence electrons, octets, formal charge. Quiet - no right/wrong verdict.
  - Purpose: how atoms connect, single vs double bonds, formal charge.
- **Phase 2 - Snap-and-reveal (end of module, after VSEPR + hybridization):** a valid structure can lift into a 3D VSEPR model (shape, angles, polarity).
  - Purpose: start thinking about shape in 3D space; feeds the "evaluate representations" success criterion.
- 3D is the *payoff*, not an early shortcut.

### Architecture - decided
- **Both:** draw beats woven into the Guide (sticky stage becomes the canvas, student builds the molecule the beat just discussed) **plus** a standalone **Draw Lab** (molecule picker, open practice, gains the 3D reveal at the end).
- **Presentation mode:** teacher both steps beats (clicker / arrows) **and** draws live on the projector (assumed from "both" - confirm).

## Curriculum spine (verbatim from user)

### Block A - Atomic properties → chemical properties
**Learning Intentions**
- We will continue to explore how the periodic table patterns and electron structure influences atomic and molecular behaviors
- We will see how atomic properties lead to chemical properties
- We will apply our previous knowledge of periodic table trends and electronegativity to predict the properties of salts

**Success Criteria**
- **QP:** I can predict how differences in atomic properties (like electronegativity and ionization energy) may lead to different chemical behaviors in compounds or reactions, and offer more than one possible outcome based on observed patterns.
- **AI:** I can use a range of strategies—such as drawing structures, comparing trends, and applying electronegativity rules—to explain or predict the behavior of elements in unfamiliar compounds or real-world scenarios.
- **C:** I can communicate how atomic structure affects molecular behavior by using scientific terminology, written explanations, and models or diagrams tailored to the question or audience.

### Block B - Representing covalent compounds, shape, polarity
**Learning Intentions**
- We will learn how to represent covalent compounds in multiple ways
- We will learn how shape and electronegativity affect the polarity of a molecule
- We will use concepts such as VSEPR and Formula charge to check our understanding of our Lewis structures

**Success Criteria**
- **Q&P:** I can hypothesize how changes in bond polarity or molecular shape might affect overall molecular polarity, proposing more than one possible configuration or outcome.
- **PAI:** I can construct accurate Lewis structures, molecular geometry diagrams (using VSEPR theory), and models to represent covalent compounds, and analyze them to predict molecular shape and, eventually, bonding patterns.
- **E:** I can evaluate the strengths and weaknesses of different molecular representations (e.g., Lewis structures vs. 3D VSEPR models) in explaining polarity and molecular behavior.
- **C:** I can clearly communicate the relationship between molecular shape, electronegativity, and polarity using scientific conventions, correct terminology, and appropriate visual representations.

### Block C - Hybridization
**Learning Intentions**
- We will review how "hybridization" can let us predict the shape of a bonding atom within a molecule
- We will connect the type of hybridization with the common angles seen in molecules

## Open questions
- [x] Architecture: draw beats in Guide + standalone Draw Lab
- [x] One guide or one per block? → **One long guide**, three chapters (A / B / C) with chapter markers; presentation mode can jump to a chapter
- [x] Block A manipulable → **EN-difference slider** (pick two elements, shared cloud shifts: nonpolar → polar → ionic) **+ salt properties side by side** (e.g. NaCl / MgO / KBr: charge + ion size → lattice strength → mp, hardness, brittleness, conductivity). Salts are a **discussion prompt, not a prediction task** - no answer entry. Lewis dot transfer not chosen as a Block A manipulable.
- [x] Teaching voice → **Sim carries the teaching** (IMF posture): Guide copy gives full explanations - names, why, what to notice. No companion worksheet required.
- [x] Visual identity → **Carry IMF Toy Box** (Space Grotesk + Space Mono, model-kit atom hues, red = δ+/positive, yellow = δ−/negative, reserved). Charge convention is *introduced* here and carries into IMF. Drawing canvas needs a "paper" surface that sits inside the toy world - for design-taste to resolve.
- [ ] Sim carries teaching vs companion worksheet?
- [ ] Teacher use in presentation mode: does the teacher draw live on the projector?
- [x] Devices → **All students have touch screens.** Stylus on tablet preferred; finger must work fully. Design touch-first (large snap targets, canvas vs page-scroll conflict, palm rejection when pen detected); mouse/trackpad still supported.
