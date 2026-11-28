# Design Strategy: Acids and Bases (AP Chem 12, Unit 4)

**Date:** 2026-11-27
**Status:** Approved (2026-11-27)
**Brief:** `docs/designpowers/briefs/2026-11-27-acids-bases.md` (approved 2026-11-27)

---

## Design Principles

### 1. One proton, one picture
**The principle:** Every acid-base reaction in the unit is the same event: a proton moves from one species to another.
Students should see that one event under every name it gets (neutralization, self-ionization, hydrolysis, indicator
change, buffering).
**In practice:** The proton has one look, kept from Part 1.1 to Part 3.4. It is drawn leaving a bond and landing on a
lone pair in the Lewis structures, and it is the same mark in the particle views. Brønsted-Lowry reactions always show
both directions, so every equation has an acid and a base on each side. Later Parts reuse this picture: water passing a
proton to water (1.2), an indicator losing one (3.1), a buffer's base taking one (3.3).
**We will NOT:** Draw H⁺ as a free particle floating in water after Part 1.1 (it is H₃O⁺ once we've said so), show a
reaction with only the forward direction when it is an equilibrium, or let particles "want", "give away" or "steal"
protons (no personification: protons *move*, bonds *break*, lone pairs *attract*).

### 2. Kw holds the balance
**The principle:** [H₃O⁺] and [OH⁻] are never shown apart. When one rises, the other falls, and their product stays
1.00 × 10⁻¹⁴.
**In practice:** Wherever a pH appears, [H₃O⁺] and [OH⁻] appear with it, and the product can be read. The Kw equation
is the resizing equation (Unit 1's Coulomb style): one term grows as the other shrinks. Concentration bars use a
powers-of-ten scale, so 10⁻¹³ and 10⁻¹ both show. The magic square keeps all four corners on screen, so each move is a
step between neighbours, not a new formula.
**We will NOT:** Show pH without the concentrations behind it, use linear bars that make one ion vanish, or teach
pH + pOH = 14 as a separate fact from Kw.

### 3. Every number has a picture, and the picture is honestly scaled
**The principle:** The plan asks for pictures that look real, with sizes exaggerated and numbers exact. We do both and
say so.
**In practice:** Particle views are a zoomed, representative window: a strong acid shows every molecule ionized, a weak
acid shows the true *ratio* of ionized to whole molecules at a count that can be drawn, and the window says "scaled"
once per Part. Molecule sizes are exaggerated so H₃O⁺, OH⁻ and the acid's anion read from the back row. Every number
on the stage (pH, concentrations, volumes, burette readings, Ka) is computed from Data Booklet values. Worked steps
light up the part of the picture they refer to.
**We will NOT:** Show a picture that disagrees with the numbers (a weak acid drawn half ionized, a "neutral" beaker
with more H₃O⁺ than OH⁻), invent a value the booklet doesn't have (except the marked 3.4 values), or round in a way
that changes a verdict.

### 4. Predict first, and the check comes with a reason
**The principle:** Students commit before the stage shows them. Every prediction checks itself and explains (plan ask).
**In practice:** Choice cards (acid / base / salt / none, strong or weak, acidic / neutral / basic, too high / too low)
turn green or red at once and then show one line on why. The matching game locks a correct pair and shakes back a wrong
one. Where a beaker or a curve can answer, it plays after the choice, not before. Nothing is saved, scored or gated.
**We will NOT:** Reveal the answer before the student chooses, mark wrong without a reason, keep a score, or block the
next section behind a correct answer.

### 5. The teacher talks, the stage shows the maths
**The principle:** The Guides are presented live. The stage gives room to equations, calculations and pictures; the
teacher's voice carries the explanation (standing preference).
**In practice:** Stage text is short by default, with the full explanation behind a "Show full explanation" toggle for
students at home. Worked problems interleave each calculation with where its result lands (calculation → fill the cell
or the picture → next calculation). Back / Next step buttons stay fixed at the bottom right of the stage. The section
copy beside the stage is in the teacher's voice (`docs/VOICE.md`) and ends by pointing at the simulation and the button
to press. In presentation view, values and labels read from the back row.
**We will NOT:** Fill the stage with paragraphs, show all the calculations before any results, move the step buttons
between sections, or write copy that talks past the class ("you will see" instead of "we").

### 6. Readable without colour, usable without a mouse, and keeps the labs' secrets
**The principle:** The magenta / violet-blue split helps, but every acid, base and verdict is also named. The labs stay
the labs.
**In practice:** Every particle carries its formula and charge; verdicts use words and symbols ("pH 3.20, acidic");
indicator colours are named in text ("faint pink"). Every control works by keyboard, and live values go to a polite
live region. Animations are lively but a tap or the next step settles them at once. The weak acid ranking lab slide
uses only HA, HB, HC and made-up colours. The titration demo uses the class lab's reagents (teacher OK) but random
concentrations, so it can't stand in for a lab result.
**We will NOT:** Use colour alone for acid, base or an endpoint, make drag the only way to do anything, name real acids
or indicators on the ranking lab slide, or use the class lab's actual unknown concentration.

---

## Family Position

| Reference | Role | Our differentiation |
|---|---|---|
| Solubility Guide (`solubility/`) | Guide pattern: Parts with Before we begin, worked steps, unit analysis, choice cards, beakers and particle window | Same behaviour. The look is new (taste pass). Adds Lewis-structure proton transfers, the Kw balance and the magic square |
| Equilibrium ICE Tables (`equilibrium/ice-tables.html`) | Fillable ICE table, worked example → Your turn → answer | Reused as-is for 2.2 and 2.3, beside a weak acid beaker |
| Bonding (`chemistry-11h/bonding/`) | Lewis structure drawing and 3D models; dark mode | Lewis structures now move: bonds break and protons land on lone pairs. Its dark rules move into `suite.css` for this suite |
| Unit 1 Coulomb's law (`atomic-structure/02-coulomb-ionization.html`) | Equation whose terms resize | Used for Kw (1.2), proton competition (2.1) and the indicator equilibrium (3.1) |
| Weak Acid Titration Simulator (`titration.html`) | The deeper titration tool | Unchanged. Guide 3 borrows its curve language and links to it; the 1.3 demo is the simple strong-strong version |
| PhET "Acid-Base Solutions" and "pH Scale" (general reference) | Particle and pH views for students | We add the proton-transfer story from Lewis structures, Kw as a live balance, worked calculations in unit analysis, and Hebden's scope and notation |

---

## Experience Map

Each Part is one lesson, presented by the teacher and reread at home. Guide 1 is detailed; Guides 2 to 4 are at outline
level until their detail pass.

| Lesson | Guide Part | Stage moments | Then | Emotional state |
|---|---|---|---|---|
| 1.1 | **What Makes an Acid an Acid?** | Lewis structures coming apart; H⁺ landing on water; a proton moving in both directions; conjugate matching game; strong vs weak beakers | Hebden Q1 to Q4, Q10 to Q27 | "I remember: starts with H" (confident) → "water is the base here?" (surprise) → "the pair differs by one H" (aha, from the game) |
| 1.2 | **Water Reacts With Itself** | Water passing a proton to water; the Kw balance with resizing terms and log bars; pH strip; the magic square | Q28 to Q30, Q47 to Q57 | "Pure water has ions?" (curious) → "one goes up, one goes down" (aha) → "I can get from any corner to any corner" (in control) |
| 1.3 | **Neutralization and Titration** | Two beakers poured into a third, ions pairing into water, the leftover setting the pH; labelled glassware; the titration demo (pink flashes, one drop to endpoint, trials table) | Q58 to Q68, Q94 to Q99, Q106, Q121 to Q123; class titration lab | "Just subtract?" (friction: forgetting the total volume) → "the leftover decides" (fixed) → "I can read a burette" (ready for the lab) |
| 2.1 | **Ka, Kb and Strength** | Same-concentration beakers by Ka; proton competition with the equation tipping; ranking lab slide | Ranking lab | "Bigger Ka, more H₃O⁺" → "the weaker acid's side wins" (aha) |
| 2.2 | **pH of Weak Acids** | ICE table beside a weak acid beaker; strong vs weak at the same concentration | Q74 to Q83 | "Same ICE table as before" (confident) → "why can I drop the x?" (friction, then the 5% check) |
| 2.3 | **pH of Weak Bases** | Kb from Ka; OH⁻ → pOH → pH | Q84 to Q93 | "Same, but flip it" |
| 2.4 | **Weak Acid Titrations** | Three curve types; half-volume point; buffer region; link to the simulator | Q124 to Q130; Weak Acid Titration Simulator | "The curve tells me Ka" (aha) |
| 3.1 | **Indicators** | HIn / In⁻ equation tipping with colour; phenolphthalein structure; curve drawn in the indicator's colour | Q108 to Q120 | "An indicator is just a weak acid" (aha) |
| 3.2 | **Hydrolysis** | Maths first; predict salt pH and indicator colour, then the beaker answers | Q69 to Q73 | "Salts change pH?" (surprise) → "find the ion on the table" (method) |
| 3.3 | **Buffers and Biological Systems** | Ratio bars before and after; H-H from Ka; blood and phosphate | Q131 to Q143 | "It barely moved" (surprise) → "the ratio barely changes" (aha) |
| 3.4 | **Acid-Base Structures** | Lewis and 3D models, H leaving; trends across series | (no Hebden) | "I can predict which is stronger from the drawing" (pride) |

**Entry:** AP 12 hub → Unit 4 hub → the Guide for this lesson (wiring later, when the teacher says).
**Likely friction (Guide 1):** H⁺ vs H₃O⁺ notation; acid/base labels on the product side; strong vs concentrated;
logs and the pH significant-figure rule; forgetting the total volume after mixing; mole ratios for H₂SO₄ and Sr(OH)₂.
Each gets its own section, card or worked line.
**Exit:** each Part ends with "Practice in Hebden"; 1.3 ends at the class titration lab; Guide 3 hands off to the
simulator.

---

## Success Metrics

- Students label every species in a Brønsted-Lowry equation as acid or base, on both sides, and pair the conjugates.
- Students say a strong acid is "100% ionized", and don't confuse strong with concentrated.
- Students go from any of [H₃O⁺], [OH⁻], pH, pOH to the other three, with the right significant figures.
- Students divide by the total volume when finding the pH after mixing, and use 2 for H₂SO₄ and Sr(OH)₂.
- Students name the glassware for a titration, read a burette to 0.01 mL and judge whether trials agree.
- Guides 2 to 4: metrics follow the brief's success criteria and get sharpened in each detail pass.
- **Accessibility:** every task works by keyboard; every verdict is available as text.
- **Teacher:** each Part runs as one lesson in presentation view with no scrolling or setup, and the stage text stays
  short enough to talk over.

---

## Constraints and Trade-offs

| Trade-off | Choice | Why |
|---|---|---|
| Real ion counts vs a visible particle view | Numbers exact; the window shows the true ratio at a drawable count, labelled "scaled" | Neutral water has about 1 H₃O⁺ per 500 million water molecules; 1.0 M acetic acid is about 0.4% ionized |
| Lewis structures vs particle views | Lewis structures for single reactions (1.1, 3.4); particle views for solutions (1.1 strong vs weak onward). The proton mark is the same in both | The plan: "start with Lewis structures, move towards solutions as molecules floating around" |
| Concentrations over 13 orders of magnitude | Powers-of-ten bars and scales everywhere [H₃O⁺] and [OH⁻] appear | Linear bars hide one ion completely |
| Hebden's dilute-first method vs unit analysis | Moles route in unit analysis for mixing, as the repo rule requires | AGENTS.md: no c = n ÷ V; the moles route is also Hebden's own alternative |
| A realistic titration vs a lesson's pace | Real chemistry, but the stream fills quickly and slows near the endpoint; one-drop control at the end | The demo must fit beside the notes in one lesson |
| Hebden's depth vs the plan's additions | Hebden depth everywhere except Henderson-Hasselbalch (3.3) and structures (3.4), which the plan asks for | AGENTS.md: past Hebden only when the teacher asks |
| One look for the unit vs Solubility's | Fresh taste pass for the look; shared chrome and acid/base colours fixed unless the teacher changes them | Teacher, brief §7 |
| One engine vs separate demos | One solution engine (species, Kw, Ka, mixing, pH) behind every beaker, the demo and the bars | One set of numbers across all four Guides |
