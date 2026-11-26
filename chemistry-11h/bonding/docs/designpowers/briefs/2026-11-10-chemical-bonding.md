# Design Brief: Chemical Bonding

_Status: **APPROVED** 2026-11-10 · Problem ✓ · Users ✓ (motion amended) · Direction ✓ (Ch A real examples, Ch C ethane/ethene/ethyne) · Constraints ✓ (tech open; electron representations widened)_

## Problem Statement
Students leave Unit 1b knowing electronegativity (EN) and ionization energy as **atom** trends, but haven't yet used them to explain **bonds**. The Intermolecular Forces suite assumes students already arrive with bond polarity, Lewis structures, molecular shape and molecular polarity. This module closes that gap. It carries the chain from atomic properties to bond type, then to representation (Lewis structures, formal charge), shape (VSEPR, hybridization) and molecular polarity. Students should finish ready to open IMF.

It runs both as a self-paced scroll (pre-load or catch-up) and as a teacher-driven presentation. In both, students actively **draw** structures instead of only reading them.

## Users
**Primary: Chem 11H student, just finished Unit 1b.** Knows EN, IE, atomic size, electron configuration and valence electrons. Hasn't drawn Lewis structures with formal charge, VSEPR or hybridization in this course. Uses a laptop or touch-screen device; draws by clicking or tapping (no stylus-specific features, user 2026-11-10). Works alone outside class or follows along in class.

**Secondary: the teacher, in presentation mode.** Steps through beats with a clicker or arrow keys, jumps between chapters, and draws live on the projector, likely from a mirrored tablet.

**Ability spectrum**
- **Fine motor / finger-only:** drawing can't depend on precise ink. Snapping does the precision work, with large targets and tap-to-place as an alternative to dragging.
- **Keyboard / screen reader:** the builder needs a non-drawing route: select an atom, then add a bond or lone pair with buttons. Electron count, octet and formal-charge tallies are announced as text.
- **Colour vision:** charge is never shown by colour alone. Every charge carries a δ+/δ− or +/− sign (IMF rule).
- **Low vision / back of the room:** presentation mode enlarges type and the stage, so labels stay readable from across the room on a projector.
- **Cognitive load:** one idea per beat. The tally shows its arithmetic, e.g. *valence 8 · in bonds 4 · lone pairs 4*, instead of just a verdict.
- **English as an additional language:** plain language, and each term is defined the first time it appears and then used consistently.
- **Motion:** _user decision 2026-11-10: robust animation is wanted; `prefers-reduced-motion` is **not** honoured._ The rule instead is **animation never gets in the way**: any animation can be interrupted, and a tap or the next beat settles it instantly. Nothing waits on an animation to finish. _Accepted trade-off: motion-sensitive students get no reduced path. A single "calm motion" toggle can be added later if needed._

## Design Direction
**One long Guide + a Draw Lab, in the IMF Toy Box identity.**

- **Guide:** one continuous scroll in three chapters, each with a chapter marker. Sticky stage plus beats, like `intermolecular-forces/guide.html`. The guide copy carries the full teaching.
  - **Ch A - From atoms to bonds:** in three steps.
    1. **EN-difference slider:** pick two elements and watch the shared cloud shift from nonpolar to polar covalent to ionic.
    2. **Real examples of all three bond types,** with **Lewis dot transfer** for the ionic case: valence dots move from Na to Cl (or Mg to O) and the ion charges and formula follow from the electron count: e.g. Cl₂ / H₂ (nonpolar), HCl / H₂O (polar), NaCl (ionic). _Roster to confirm._
    3. **Salts side by side** (NaCl, MgO, KBr…): how charge and ion size relate to melting point, hardness, brittleness and conductivity. The salts are a **prompt for discussion**, not a prediction task.
  - **Ch B - Representing covalent compounds:**
    - Lewis structures and formal charge, including **polyatomic ions** (NH₄⁺, CO₃²⁻; overall charge in brackets) and **resonance** (O₃, NO₃⁻; formal charge decides between structures, resonance forms shown as equivalent).
    - Then VSEPR shapes, 2 to 6 electron domains, including **expanded octets** (PCl₅, SF₆; trigonal bipyramidal, octahedral, and their lone-pair variants).
    - Then molecular polarity from shape plus bond polarity.
  - **Ch C - Hybridization (kept simple; the teacher's own sequence):** carbon only, through **ethane (C–C) → ethene (C=C) → ethyne (C≡C)**, each with its hydrogens.
    - For each, carbon's **s and p orbitals** (orbital diagram + orbital shapes) visibly **combine** into the new hybrid orbital diagram: sp³, sp², sp.
    - Show the shape each hybrid gives: tetrahedral ~109.5°, trigonal planar ~120°, linear 180°. The p orbitals left unhybridized in ethene and ethyne carry the π bonds.
    - Then the 3D reveal.
    - _Not_ a general hybridization survey (no expanded-octet hybrids, no N/O hybridization beyond a passing mention, unless added later).
- **Draw mode, inside the guide and in the Lab:**
  - **Phase 1, snap-and-count (Ch B onward):** place atoms, drag to make single, double or triple bonds and lone pairs. Live tallies for valence electrons, octets and formal charge. It doesn't say "right" or "wrong".
  - **Phase 2, snap-and-reveal (after VSEPR and hybridization):** a finished structure can lift into a 3D VSEPR model that shows shape, angles and polarity. 3D is the payoff, not an early shortcut.
- **Draw Lab:** a standalone builder with a molecule picker for open practice. The 3D reveal lives here too.
- **Presentation mode:** a clicker or arrow keys step beats, chapters can be jumped to, and the teacher can draw live on any draw beat.
- **No gates, no scores** (Unit 1b and IMF posture).

## Constraints
- **Tech is open** _(user decision 2026-11-10)_: vanilla HTML/CSS/JS isn't required. Use whatever builds and animates best, e.g. CDN libraries for 3D (three.js) or animation (GSAP). The site is still static on GitHub Pages. A build step is allowed only if its payoff is clear, since today the repo has none.
- Repo `AGENTS.md` content rules still apply: no personified particles, SEO head block, favicon, sitemap entry.
- **Click / tap first:** mouse, trackpad and touch all work through the same pointer events; the canvas must not trap page scroll. No stylus features (user 2026-11-10).
- **3D lesson from IMF:** a free-orbit 3D camera failed before. The 3D reveal must be constrained, for example a limited turntable or a few preset views. The model is what students look at, not something they navigate. _(How to constrain it is an open question for strategy.)_
- **No Bohr imagery** (Unit 1b hard rule). Electrons appear as **Lewis dots, clouds, or electron configurations / orbital diagrams**, never as orbits.
- Element symbols keep proper capitalization everywhere (Unit 1b rule).

## Existing Design System
IMF Toy Box: `intermolecular-forces/assets/suite.css`, `suite-chrome.js`, and the taste doc `intermolecular-forces/docs/designpowers/taste/2026-10-16-intermolecular-forces-taste.md`. Possible reuse from IMF: molecule kit and atom drawing (`molecules.js`) and guide scroll and beat stepping (`guide.html`).

## Taste Direction (Early Signal)
- Carry Toy Box: playful, tactile, the stage is the brightest surface, Space Grotesk + Space Mono, model-kit atom hues.
- **Charge colours are introduced here:** red = δ+ or positive, yellow = δ− or negative, used for nothing else.
- **Open for design-taste:** a "paper" surface for the drawing canvas that sits inside the toy world. moleview is a reference for connecting dots into bonds.

## Success Criteria
- **Ch A:** a student can move the EN slider and explain in words why a bond is nonpolar, polar or ionic. The salts display gives a class something concrete to discuss (QP, AI, C).
- **Ch B:** a student builds Lewis structures, double bonds included, on touch with stylus or finger, and uses the formal-charge tally to compare options. They can predict a VSEPR shape and molecular polarity, and change a bond or the shape to test a hypothesis about polarity (Q&P, PAI, C).
- **Ch B/C → E:** the reveal from Lewis structure to 3D gives students a direct, side-by-side way to compare what each representation shows and hides.
- **Ch C:** a student can show how carbon's s and p orbital diagram combines into sp³, sp² or sp in ethane, ethene and ethyne, and links each to its angle (~109.5°, ~120°, 180°).
- **Teacher:** can run the whole guide from a clicker, jump to a chapter, and draw live with no setup.
- **Hand-off:** a student finishing this module recognises the language and visuals of IMF Part 1: δ colours, cloud shifts and lone pairs.

## In Scope - confirmed edges (2026-11-10)
- Resonance · Expanded octets · Polyatomic ions · Ionic Lewis dot transfer. The draw tool must support brackets with an overall charge, resonance sets, and more than 8 electrons on period-3+ central atoms.

## Out of Scope
- Intermolecular forces (the next suite).
- Scoring, accounts, or saving work across sessions. A JPEG export of a drawing is the only save.
- A free-orbit 3D camera.
- Freehand ink recognition. Draw mode is snapping, not handwriting recognition.
- Hybridization beyond carbon in ethane, ethene and ethyne. No sp³d / sp³d² even though expanded octets are in VSEPR.

## Open Questions
- [x] Title → **Chemical Bonding**, folder `chemical-bonding/`. Hub: Chem 11H, between Atomic Structure (Unit 1b) and Intermolecular Forces.
- [x] Scope edges → all four in (see In Scope). Radicals not included.
- [ ] How the 3D reveal is constrained (strategy).
- [ ] Molecule roster for Ch B/C and the Lab.
- [x] Save/export → **Yes: students can save a drawing as a JPEG** (from guide draw beats and the Lab), e.g. to hand in.
