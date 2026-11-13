# Design Strategy: Chemical Bonding (Chem 11H)

**Date:** 2026-11-10
**Status:** APPROVED 2026-11-10 · Principles ✓ · Beat list ✓ (2026-11-10; practice beats added; teacher starter list; Ch C practice)
**Brief:** `docs/designpowers/briefs/2026-11-10-chemical-bonding.md`

---

## Design Principles

### 1. The count teaches; the sim never grades
**The principle:** The builder shows the electron arithmetic live: valence total, electrons used, octet per atom, formal charge per atom. The student decides whether the structure works.
**In practice:** A tally that shows its working, e.g. *O · 2 bonds + 2 lone pairs = 8 · FC 0*. Atoms whose count is off get a sign plus text (e.g. *6 / 8*), never only a red glow. Guide draw beats offer an optional **"Show one structure"** reveal so self-paced students aren't stranded.
**We will NOT:** Show green ticks or red ✗, block progress until correct, auto-fix a structure, or keep a score.

### 2. Paper before sphere
**The principle:** Each representation earns the next: electron configuration → dot symbol → Lewis structure → VSEPR shape → 3D model. 3D arrives as the payoff after VSEPR and hybridization, and when it does, **the Lewis drawing stays on screen beside it**.
**In practice:** Ch A and B are flat and drawn on paper. Ch B's VSEPR uses wedge-and-dash and silhouettes. 3D first appears in Ch C. Lifting into 3D is a visible transformation from *this* drawing, not a swap to a stock model. That side-by-side view serves the **E** criterion (strengths and weaknesses of each representation).
**We will NOT:** Open with 3D, replace the student's drawing with a model, or make 3D something you navigate (see Constraints: 3D).

### 3. One canvas for every hand
**The principle:** Guide draw beats, the Draw Lab and presentation mode run on **one draw engine**, so a student's mouse, trackpad or finger and the teacher's projector behave the same way.
**In practice (skeleton-first, user 2026-11-10):** drag atoms in from a tray and arrange the skeleton (least electronegative atom in the middle); drag an atom onto another to bond (again for double / triple); click an atom to add electrons; drag electrons to pair, move or remove them. A charge number shows on any atom whose charge isn't 0. Every drag has a keyboard path. Hovering an atom highlights its count (and, from beat 13, its formal-charge equation) in the tally. No stylus features.
**We will NOT:** Build a separate teacher tool, add stylus-specific features, or let the canvas trap page scroll.

### 4. Built as IMF's on-ramp
**The principle:** Every visual convention students first meet here is the one IMF will use: red δ+, yellow δ−, signs and clouds, model-kit atom hues, lone-pair lobes, Toy Box chrome.
**In practice:** The electronegativity slider's cloud uses IMF's cloud. δ signs are ink-outlined pills. Lone pairs in 3D match IMF's "rabbit ear" lobes. Shared kit code where possible (`intermolecular-forces/assets/molecules.js`).
**We will NOT:** Invent a second cloud or colour language, or use red or yellow for anything except charge.

### 5. Big motion, never in the way
**The principle:** Animation is robust and expressive, because it's how the ideas move: clouds shift, electrons transfer, orbitals combine, a drawing lifts into 3D. But a student or teacher never waits on it.
**In practice:** Every animation is interruptible, and a tap or the next beat settles it to its end state instantly. Presentation mode steps never queue animations. Meaning never lives only in motion: the end state always shows it too.
**We will NOT:** Use blocking intros, animations that must finish before input, or decorative motion with no chemistry behind it.

---

## Competitive Position

| Reference | Strengths | Weaknesses for us | Accessibility | Our differentiation |
|-----------|-----------|-------------------|---------------|---------------------|
| PhET *Molecule Polarity* | Two-atom EN sliders, dipole arrows | A standalone toy; its own visual language | Good keyboard support | Slider sits inside the bond-type story and hands its δ colours to IMF |
| PhET *Molecule Shapes* | Solid VSEPR, lone pairs, real angles | Free-orbit 3D; no Lewis link | Mixed | 3D lifts from **the student's own Lewis drawing**, constrained camera |
| app.moleview.com (user reference) | Connecting dots into bonds feels direct | _Teacher's reference for feel; not yet reviewed in detail_ | - | Same directness, plus a formal-charge tally and touch-first snapping |
| Paper / whiteboard Lewis structures | Fast, familiar, what students do on tests | No count feedback; no path to 3D | - | Same "drawing" act, with the arithmetic made visible |
| Intermolecular Forces (sibling) | Toy Box identity, sticky-stage guide, presentation stepping | Starts after bonding | Established patterns | This module is its prequel: same look, same conventions |
| Unit 1b (predecessor) | EN / IE / configurations from evidence | Atom-only; quiet / worksheet posture | Good chrome | Picks up its configurations and EN and turns them into bonds |

**Position in one line:** The Chem 11H prequel to IMF, where students draw their own Lewis structures on touch, watch the electron count work them out, and only then see those drawings lift into 3D.

---

## Experience Map

| Moment | What happens | Emotional state | Inclusive notes |
|--------|--------------|-----------------|-----------------|
| **Entry** | Chem 11H hub → Chemical Bonding hub: **Guide** (primary) and **Draw Lab**. Presentation mode from a button on the Guide (and `P`). | "Bonding, here we go" | Two clear cards; keyboard-focusable |
| **First 5 s (Guide)** | Ch A opener: a familiar Unit 1b atom with its configuration collapses into a dot symbol. Continuity, not a new world. | Recognition | Text first, motion second |
| **Ch A** | Electronegativity slider → real examples (nonpolar, polar, ionic dot transfer) → salts side by side. | Playful → "huh, why is MgO so much higher?" | Slider has keyboard steps; δ signs everywhere; salt data as text, not just bars |
| **Ch B** | Learn the count → draw beats (H₂O, CO₂, NH₄⁺, O₃ …) → formal charge picks between options → VSEPR shapes → polarity. | Effortful, then competent | Tap path, big targets, "Show one structure" escape hatch |
| **Ch C** | Carbon's orbital diagram stops matching CH₄ → s + p combine into sp³ / sp² / sp across ethane, ethene, ethyne → angles. | Puzzle, then "oh, that's why" | Orbital diagrams as labelled boxes, not colour-only |
| **Payoff** | Their own ethene (or anything) lifts from Lewis to 3D, side by side. | Delight | Preset-view buttons; angle labels as text |
| **Draw Lab** | Pick from the roster or start blank; build; tally; lift to 3D; **save JPEG**. | Ownership | Same engine and paths as the Guide |
| **Presentation** | Teacher clicks through beats, jumps chapters from a menu, and builds live on a draw beat at projector scale. | Teacher in control | Large type; nothing waits on animation |
| **Friction** | (1) Drawing on a tablet while the page wants to scroll. (2) Stuck on a structure with no verdict. (3) Ch B is long: Lewis + FC + ions + resonance + expanded octets + VSEPR + polarity. (4) Finger precision on lone pairs. | Frustration risk | (1) Stage-only touch capture. (2) Count shows *what's* off + "Show one structure". (3) Sub-chapter markers in B; one idea per beat. (4) Lone pairs placed by tapping an atom, not dragging dots. |
| **Exit** | Guide ends with a hand-off card into IMF ("you'll see these clouds again"). Lab drawings saved as JPEG. | Ready for IMF / ready to hand in | - |

**Suggested (not enforced) path:** Guide A → B → C (with draw beats) → Draw Lab practice → IMF.

---

## Beat List (draft - for the plan to refine)

_33 beats. ✎ = draw beat · ★ = practice beat. Each beat has one idea._

### Chapter A - From atoms to bonds (8)
1. **Where we left off:** a Unit 1b electron configuration → valence electrons → Lewis dot symbol.
2. **Two atoms, one shared pair:** H₂, an even cloud. What a covalent bond is.
3. **Electronegativity-difference slider** _(manipulable)_: pick two elements; the shared cloud shifts; δ+/δ− and red/yellow **introduced here**.
4. **A continuum, not boxes:** ΔEN bands for nonpolar / polar / ionic, with fuzzy edges.
5. **Real examples, covalent:** Cl₂, HCl, H₂O. Nonpolar vs polar.
6. **Real examples, ionic dot transfer** ✎-lite: drag Na's dot to Cl; then Mg → O. Charges and formula come from the count.
7. **From a pair to a lattice:** NaCl ions stack into a crystal.
8. **Salts side by side** _(discussion prompt; melting point is the lens, user 2026-11-10)_: a size series NaF → NaCl → NaBr → NaI (same charges, bigger anion, lower mp) and a charge pair NaF vs MgO (similar ion sizes, doubled charges, about 3× the mp). Then, as a **short preview only**, covalent network crystals (diamond, SiO₂) and molecular crystals (ice, I₂, dry ice) sit beside the salts on the same melting-point scale. Students see what holds each crystal together, and the full treatment comes later in the course (molecular crystals link forward to IMF).

### Chapter B - Representing covalent compounds (17, sub-marked, practice built in)

**Practice beat format (★):** a mini-set of 3–5 molecules on the stage, as a carousel.
- The student builds each one with the same builder and tally.
- Each molecule has its own **"Show one structure"** reveal.
- Skip freely. No score, no gate, nothing recorded.
- In presentation mode, the teacher builds one live and leaves the rest for students.
- Every practice set includes at least one molecule the beat didn't demo.
- **Lewis practice is built on the teacher's starter list** _(2026-11-10)_: H₂ · HBr · PCl₃ · SF₂ · H₂CCH₂ · HNNH · H₂CNH · NO⁻ · N₂ · CO · CN⁻. It tiers naturally: single → double → triple, with ions mixed in. Demos avoid these molecules so the practice stays fresh.

**B·1 Lewis structures**
9. **The count:** total valence electrons; a bond is a shared pair; octets (duet for H).
10. ✎ **Single bonds:** CH₄, H₂O. First taste of the builder and tally.
11. ★ **Practice, single bonds:** H₂ · HBr · PCl₃ · SF₂.
_FC display rule (taste 2026-11-10): beats 12–13 show the full equation per atom, `FC = valence − nonbonding − ½(bonding)` with numbers; from ★14 on, compact pills only. Lewis structures are ink only, with no colour, until B·2 VSEPR._
12. ✎ **When the count runs short → multiple bonds:** O₂ (double), HCN (triple).
13. ✎ **Formal charge:** the tally per atom; compare two CO₂ arrangements and pick the better one.
14. ★ **Practice, multiple bonds + formal charge:** H₂CCH₂ · HNNH · H₂CNH · N₂ · CO. CO is the formal-charge stretch: an octet on both atoms only works with C≡O, which leaves formal charges of −1 on C and +1 on O.
15. ✎ **Polyatomic ions:** NH₄⁺, CO₃²⁻, brackets and overall charge.
16. **Resonance:** O₃ / NO₃⁻, equivalent structures; the real molecule is the blend.
17. ✎ **Expanded octets:** PCl₅, SF₆. Period 3 and later central atoms.
18. ★ **Practice, ions + mixed:** NO⁻ · CN⁻ (from the starter list) · H₃O⁺ · NO₂⁻ (resonance) · XeF₄ (expanded).

**B·2 Shape (VSEPR)**
19. **Electron domains spread out:** 2, 3, 4 domains → linear, trigonal planar, tetrahedral.
20. **Lone pairs bend shapes:** CH₄ → NH₃ → H₂O (109.5° → ~107° → ~104.5°).
21. **5 and 6 domains:** trigonal bipyramidal and octahedral, plus their lone-pair variants (gallery: SF₄, ClF₃, XeF₂, BrF₅, XeF₄).
22. ★ **Practice, name the shape:** count domains and lone pairs on a given Lewis structure, then choose the shape from silhouettes (BF₃ · SO₂ · PCl₃ · SF₄ · XeF₂). The choice is checked by **revealing the shape**, not by a ✓/✗.

**B·3 Polarity**
23. **Bond dipoles add up by shape:** CO₂ vs H₂O.
24. ✎ **What if…** _(Q&P)_: swap one atom or change the shape and predict the polarity (CCl₄ → CHCl₃; BF₃ → NH₃).
25. ★ **Practice, polarity sort:** sort molecules into polar and nonpolar. Ungraded; each card flips to show its dipole sum.

### Chapter C - Hybridization (8)
26. **Carbon's puzzle:** ground state 2s² 2p² predicts 2 bonds, yet CH₄ has 4 identical bonds.
27. **Ethane, sp³:** s + 3 p combine into 4 sp³ (orbital diagram + orbital shapes animate); 109.5°.
28. **Ethene, sp²:** s + 2 p → 3 sp² + 1 p; 120°; the leftover p forms the π bond. _Callback: "you drew H₂CCH₂ in practice."_
29. **Ethyne, sp:** s + 1 p → 2 sp + 2 p; 180°; two π bonds.
30. **The pattern:** domains ↔ hybridization ↔ angle, in one table.
31. ★ **Practice, label each carbon:** tap a carbon to cycle sp³ / sp² / sp; each tap reveals that carbon's angle. Propene (CH₂=CH–CH₃: sp², sp², sp³), propyne (HC≡C–CH₃: sp, sp, sp³), and H₂CNH from the starter list (carbon sp²). Carbon only, per scope.
32. ✎ **Lift it into 3D** _(payoff)_: draw ethene (or anything), lift to 3D beside the Lewis drawing.
33. **Which picture shows what?** _(E)_: Lewis vs 3D, what each shows and hides. Hand-off card to IMF.

---

## Constraints and Trade-offs

### 3D: the call
**A turntable, not a camera.**
- The model is always centred and auto-framed.
- Horizontal drag spins it about the vertical axis. Vertical tilt is clamped to about ±25°.
- There's no zoom, no pan and no free tumble.
- Preset-view buttons: **Front · Top · Side · Down a bond**.
- When you let go, the model eases to a stop (big motion, never in the way). Angle labels can be toggled.
- Keyboard: arrow keys spin, number keys jump to presets.

This keeps every 3D moment about the shape, which is the lesson from IMF's camera failure.

| Trade-off | We choose | We sacrifice |
|-----------|-----------|--------------|
| Feedback vs verdict | A count that shows its working | The certainty of a ✓ |
| Payoff vs freedom | 3D introduced last in the Guide; **always available in the Lab** (no gates) | Some students will try 3D early in the Lab |
| Turntable vs free orbit | Constrained spin + presets | Arbitrary viewing angles |
| Snapping vs freehand | Atoms, bonds and lone pairs snap | The feel of real handwriting |
| One long guide | One continuous story | A very long Ch B (mitigated by sub-markers) |
| Wide scope | Resonance, expanded octets, ions included | More beats and builder features |
| Robust motion | Expressive animation | No reduced-motion path (DD-1) |
| Toy Box continuity | Familiar into IMF | A fresh look for this module |
| Hybridization | Carbon only (ethane, ethene, ethyne) | sp³d / sp³d², N/O hybridization |

---

## Success Metrics

| Metric | What it measures | Target | How to measure |
|--------|------------------|--------|----------------|
| Drawing works | Builder usable by click and tap | A student builds CO₂ and NH₄⁺ with no help | Classroom playtest on student devices |
| Count → judgement | Formal charge is used to choose | Students can say *why* O=C=O beats the alternative, citing FC | Teacher spot-check in class |
| Shape + polarity | B·2–B·3 land | Students predict shape and polarity for an unseen molecule | Exit ticket (teacher-owned, not in-app) |
| Hybridization link | Ch C lands | Students match sp³/sp²/sp ↔ ethane/ethene/ethyne ↔ angle | Exit ticket |
| Presentation fitness | Teacher can run it live | Whole Guide driven by clicker; live build at projector scale | Teacher dry-run |
| Non-pointer path | Inclusive | Every draw beat completable by keyboard / tap only | Manual a11y pass; WCAG AA text and UI contrast |
| IMF hand-off | Bridge works | Students starting IMF recognise δ colours and lone-pair lobes without re-teaching | Teacher reflection at IMF launch |
| LI/SC coverage | Spine | Every success criterion maps to at least one beat | Traceability table in the plan |
