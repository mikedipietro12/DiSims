# Design Brief: Acids and Bases (AP Chem 12, Unit 4)

**Date:** 2026-11-27
**Status:** **Approved 2026-11-27**, section by section (§3 after dropping the Classic Titration room; §7 and §8 after
adding the taste pass). Sections 2 to 4 approved at outline level; each gets a detail pass before it is built
**Approach:** Four Guides (one per section of the teacher's plan, each lesson a Part) + the existing **Weak Acid
Titration Simulator** (linked, unchanged). The classic titration is a demo on the Part 1.3 stage, not its own room
**Hub:** `ap-chemistry-12/acids-bases/index.html` (Unit 4 hub, already live with the titration simulator)
**Sources:** the teacher's plan PDF · Hebden Chemistry 12, Unit IV (content, terms, depth) · BC Chemistry 12 Data Booklet
(every number) · `DISCOVERY.md` (decisions and coverage check)
**First build:** Section 1 (Guide 1, including the titration demo). Sections 2 to 4 are outlined here and get their own detail
pass before they are built.

---

## 1. Problem statement

Students arrive from the equilibrium and solubility units knowing K, Q, Le Châtelier and ICE tables, and from last year
knowing acids as "things that start with H". This unit asks them to hold three ideas at once:

- **Acids and bases are proton transfers**, and water takes part in every one of them. H⁺ is really H₃O⁺, water can act
  as an acid or a base, and every acid has a conjugate base.
- **[H₃O⁺] and [OH⁻] are tied together by Kw.** pH, pOH, [H₃O⁺] and [OH⁻] are four views of one number, and students
  need to move between them quickly and correctly (logs, significant figures).
- **Strength is an equilibrium.** Strong acids ionize completely and weak acids barely do; Ka and Kb say how far, and the
  same idea explains salts, indicators, titration curves and buffers.

Without a picture, these become separate formulas (pH = −log, Kw, Ka × Kb = Kw, Henderson-Hasselbalch) and separate
rules (spectator ions, "the weaker acid side is favoured", "pH = pKa at half volume"). The suite should make them one
story: **particles in water passing protons, with real numbers attached.**

The Guides are the teacher's lessons in presentation view and the students' notes afterwards. The classic titration is
done in class; the Guide shows it as a demo beside the notes. The Weak Acid Titration Simulator stays the deeper tool
for Section 3.

---

## 2. Users

**Primary:** AP Chemistry 12 students after the solubility unit. They know K, Q, Le Châtelier, ICE tables, Ksp,
unit analysis and solubility rules. Chem 11 acid-base ideas (Arrhenius, neutralization, titration) need review, not
reteaching.

**Secondary:** the teacher, presenting one Part per lesson on a projector (clicker or arrow keys).

**Context of use:** in class through presentation view; on their own time, students reread a Part on a laptop or tablet
and replay the titration demo before the lab. Phones are not a target.

**Ability spectrum** (same commitments as Solubility):
- Every control works by keyboard; live values and verdicts are announced as text ("pH 12.90, basic").
- Acid / base / water are never told apart by colour alone: every particle carries its formula and charge, and verdicts
  use words and symbols.
- Worked steps reveal one line at a time.
- Animation is lively and interruptible: a tap or the next step settles it at once. No reduced-motion branches.
- Plain copy, units always written, the teacher's voice (`docs/VOICE.md`).

---

## 3. Structure

### Rooms on the hub (in order)
1. **Guide 1: Acid-Base Review and Key Details** (lessons 1.1, 1.2, 1.3)
2. **Guide 2: Acid-Base Equilibrium** (2.1, 2.2, 2.3)
3. **Guide 3: Weak Acid Titrations** (2.4)
4. **Guide 4: Indicators, Hydrolysis, Buffers and Structure** (3.1, 3.2, 3.3, 3.4)
5. **Weak Acid Titration Simulator** (existing `titration.html`, unchanged)

No Classic Titration room (teacher, 2026-11-27): the classic titration happens in class, and Part 1.3 shows it as a
simulation demo on the stage beside the notes (§5).

### Every Guide works the same way
- Same layout as the Solubility Guide: sections scroll beside a sticky stage; presentation view steps through them.
- The top of each Guide lists its Parts (one per lesson). **Each Part opens with its own "Before we begin" block**:
  the lesson's learning intentions beside its curricular competencies, word for word from the plan, competency names
  spelled out. In presentation view it is the first slide of the lesson.
- **Predictions check themselves.** Choice cards turn green for a correct answer and red otherwise, then show a short
  explanation. Nothing is saved or scored.
- **Worked examples** reveal one line at a time with a note under each line, and mark the picture as they go. Each is
  followed by a **"Your turn"** problem of the same shape with a Check button, then "Show the answer".
- Every problem on the site is **our own**, in the same shape as Hebden's. Each Part ends with **"Practice in Hebden"**:
  the question numbers for homework, and, where it fits, a hand-off to the simulator or a lab.

---

## 4. Section 1 in detail: Guide 1, Acid-Base Review and Key Details

### Part 1.1: What Makes an Acid an Acid? (Hebden IV.1, IV.3 to IV.6)

**Before we begin**
- LI: I can identify an acid or a base molecule or solution based on my previous knowledge.
- LI: I can distinguish between strong and weak acids and bases.
- Questioning and Predicting: We will make observations based on what we know about acids and bases to help review our
  current understandings.
- Processing and Analyzing Data and Information: We will seek and analyze patterns and trends.

**Sections**
1. **The Arrhenius theory.** An acid releases H⁺ in water; a base releases OH⁻; a salt is what is left from
   neutralization. Stage: Lewis structures of an acid and a base coming apart in water (the bonding pair stays with the
   Cl, so H leaves as a bare H⁺). Sort cards: acid, base, salt or none (our own compounds).
2. **Neutralization.** Acid + base → salt + water; every one has the net ionic equation H⁺ + OH⁻ → H₂O. Balancing in
   Hebden's steps (match the H⁺ and OH⁻, count waters, build the salt), one step per tap. Properties of acids and bases
   (litmus, H₂ from magnesium, electrolytes, sour / bitter / slippery, never taste in the lab) as acid / base / both /
   neither cards.
3. **What H⁺ really is.** A hydrogen ion is a bare proton, a +1 charge in a tiny space, so it is pulled onto a lone pair
   of a water molecule: H₃O⁺, the **hydronium ion**. Stage: the proton drawn onto the oxygen's lone pair; then the
   ionization equation rewritten with water on both sides.
4. **The Brønsted-Lowry theory.** Acid = proton donor, base = proton acceptor. Stage: Lewis structures of a weak base
   and of a weak acid each reacting with water, the proton moving between lone pairs, then the reverse reaction, so each
   side has an acid and a base. Water is acid in one, base in the other: **amphiprotic**. Mono-, di-, tri- and
   polyprotic named here. Cards: label each species acid or base.
5. **Conjugate pairs: the matching game.** Click a species, then its partner (they differ by one proton). A correct pair
   locks together with a bracket and the labels "conjugate acid" / "conjugate base"; a wrong one shakes back. Then
   "conjugate acid of …" / "conjugate base of …" cards.
6. **Strong and weak.** Stage: two beakers at the same concentration, particle view. The strong acid is all H₃O⁺ and
   anions, no molecules left; the weak acid is mostly whole molecules with a few ions. Then the 2 × 2 of strong / weak and
   concentrated / dilute. The six strong acids from the Data Booklet (p. 6); strong acids are all "levelled" to H₃O⁺ in
   water; strong bases are metal hydroxides, NH₃ is weak. Prediction: which beaker is the strong acid?

Practice in Hebden: Q1 to Q4, Q10 to Q27.

### Part 1.2: Water Reacts With Itself (Hebden IV.7, IV.11)

**Before we begin**
- LI: I can visualize how water reacts with itself, and other molecules, to create an acidic or basic solution.
- LI: I can calculate the concentration of hydronium or hydroxide in a solution.
- LI: I can understand the relationship between hydronium and hydroxide in a solution.
- Communicating: We will formulate mental models to describe how water can be both an acid or base.

**Sections**
1. **Self-ionization of water.** One water molecule passes a proton to another, rarely. It is endothermic.
   Kw = [H⁺][OH⁻] = 1.00 × 10⁻¹⁴ at 25 °C (also shown once as [H₃O⁺][OH⁻]; Part 1.2 keeps H⁺ until its last
   section, as the plan asks); neutral water has both at 1.0 × 10⁻⁷ M. Neutral, acidic and basic defined
   by comparing the two. Heating raises Kw, but hot pure water is still neutral (prediction card).
2. **The balance.** The plan's key visual. The Kw equation sits above a beaker, and its two terms **grow and shrink**
   (like the Coulomb's law equation in Unit 1 of Chemistry 11H) while their product stays 1.00 × 10⁻¹⁴. Beside it, bar
   graphs of [H₃O⁺] and [OH⁻] on a powers-of-ten scale. Buttons add a strong acid, a weak acid, a strong base or a weak
   base to neutral water; one rises, the other falls. The particle window is scaled for the picture and labelled as such;
   the numbers are exact.
3. **Finding one from the other.** Worked examples: [OH⁻] in a strong acid of known [H₃O⁺]; [H₃O⁺] and [OH⁻] after
   dissolving a mass of NaOH in a volume of water (grams → moles → mol/L as unit analysis); [OH⁻] from a base with two
   OH⁻ per formula, using **Sr(OH)₂** (the only Group 2 hydroxide the booklet lists as soluble; the plan's 3.0 M Mg(OH)₂
   can't dissolve that far). Kw steps are substitution.
4. **pH and pOH.** Logs as powers of ten; pH = −log[H₃O⁺]; the significant-figure rule (only the digits after the
   decimal count); one pH unit is a factor of ten. Stage: a pH strip with the [H₃O⁺] and [OH⁻] scales lined up under it
   and a slider.
5. **The magic square.** Four corners ([H₃O⁺], [OH⁻], pH, pOH) joined by Kw, pH + pOH = 14.00, −log and 10 to the power
   of −p. Given any one corner, click the edges to travel to the others; each move shows its step. Prediction cards:
   acidic, neutral or basic from a pH, a pOH or a concentration.
6. **From now on: H₃O⁺.** A short closing section: the rest of the unit writes H₃O⁺, not H⁺ (plan).

Practice in Hebden: Q28 to Q30, Q47 to Q57.

### Part 1.3: Neutralization and Titration (Hebden IV.12, IV.16, IV.18)

**Before we begin**
- LI: I can calculate the pH or pOH of a solution that has been partially neutralized by another solution.
- LI: I can identify the glassware and skills needed to conduct a "classic" strong acid strong base titration.
- LI: I can calculate the concentration of an unknown strong acid or base titration.
- LI: I can identify the equivalence point of a titration.
- Planning and Conducting: We will analyze cause-and-effect relationships of neutralization reactions.
- Planning and Conducting: We will apply the concepts of accuracy and precision in the titration lab.
- Processing and Analyzing Data and Information: We will analyze the cause-and-effect relationship of mono and diprotic
  acids on a titration.
- Evaluating: You will evaluate your methods and identify sources of error.

**Sections**
1. **Mixing a strong acid and a strong base.** Stage: two beakers, each with its particle view, poured into a third.
   H₃O⁺ and OH⁻ meet and become water two at a time until one runs out; what is left over sets the pH. The working is
   the moles route in unit analysis: moles H₃O⁺, moles OH⁻, subtract, divide by the **total** volume, then pH. The
   picture shows all three solutions (plan: particle diagrams of the first two and the final solution).
2. **Two OH⁻ per formula.** The same with Sr(OH)₂ and HCl; the mole ratio sits inside the unit-analysis chain.
3. **Working backwards.** What mass of acid or base gives a target pH? One worked example, one "Your turn".
4. **The glassware.** A labelled titration bench: burette, pipette and bulb, volumetric flask, Erlenmeyer flask,
   indicator, white tile, wash bottle. Click each for its job and the skill that goes with it (read the bottom of the
   meniscus at eye level to 0.01 mL, rinse with the solution it will hold, swirl, go drop by drop near the end). Standard
   solutions and primary standards named.
5. **The equivalence point.** Moles of acid to moles of base exactly match the equation's ratio. The indicator's colour
   change shows it (why it works waits for Part 3.1).
6. **The titration calculation.** Three steps: moles of the known, mole ratio, concentration of the unknown, all one
   unit-analysis chain. Worked for HCl (1:1) and H₂SO₄ (1 : 2 with NaOH). Precision: repeat until trials agree within
   0.1 mL, drop the outlier, average.
7. **Sources of error.** Cards for common mistakes (overshooting, air bubble in the burette tip, not rinsing, reading
   the meniscus from above): does each make the calculated concentration too high, too low or no different?
8. **The titration demo** (§5) sits on the stage beside the glassware, equivalence point and calculation sections:
   the teacher runs it in class, and its readings feed the worked calculation. Then the class lab.

Practice in Hebden: Q58 to Q68, Q94 to Q99, Q106, Q121 to Q123.

---

## 5. The titration demo (Part 1.3 stage)

Not its own room (teacher, 2026-11-27). A realistic titration on the Guide's stage, beside the notes in sections 4 to 7
of Part 1.3, for the teacher to run in front of the class and for students to replay.

- **Reagents** (same as the class lab, teacher OK 2026-11-27): standardized NaOH in the burette; a 25.00 mL pipetted
  sample of **HCl (1:1)** or **H₂SO₄ (2:1)** in the flask; phenolphthalein.
- **Controls:** open the stopcock to a stream, dropwise, or a single drop; swirl; refill; new trial. A zoomed meniscus
  shows each burette reading (initial and final, to 0.01 mL).
- **Colour follows the real pH.** Pink flashes where the drops land and fades on swirling as the endpoint nears; one drop
  gives a faint pink that stays; overshooting gives deep pink.
- **Trials table** fills in as trials finish, so the class can see precision (trials agreeing within 0.1 mL) and the
  numbers go straight into the section 6 calculation.
- Numbers are exact (strong acid + strong base, Kw, booklet atomic masses). Equivalence is within one drop (0.05 mL).

---

## 6. Sections 2 to 4 (outline; each gets a detail pass before it is built)

### Guide 2: Acid-Base Equilibrium
- **2.1 Ka, Kb and Strength** (IV.8 to IV.10). Ka and Kb expressions; beakers of acids at the same concentration with
  different booklet Ka values, showing more or less H₃O⁺; Ka × Kb = Kw; proton competition between two acids, with the
  equation's sides growing and shrinking toward the side with the weaker acid; Keq = Ka(reactant acid) ÷ Ka(product
  acid); "reactants or products favoured?" cards. **Weak acid ranking lab slide:** a short reminder with generic acids
  (HA, HB, HC) and made-up indicator colours shifting, giving nothing away (teacher, 2026-11-27).
- **2.2 pH of Weak Acids** (IV.14). ICE tables (reused from the equilibrium unit) beside a beaker; the three problem
  types (find pH, find Ka, find starting concentration); the 5% assumption, stated every time; percent dissociation;
  strong and weak acid at the same concentration compared; first proton only; "H₂CO₃" is CO₂ in water. Notes once that
  Hebden calls the table "ST, A, EQ".
- **2.3 pH of Weak Bases** (IV.15). Kb from Kw ÷ Ka; [OH⁻] → pOH → pH; anions of salts as weak bases. Competency: the same as 2.2
  (Applying and Innovating).

### Guide 3: Weak Acid Titrations
- **2.4 Weak Acid Titrations** (IV.16, IV.18). The three curve types (strong-strong, weak acid-strong base, weak
  base-strong acid); equivalence pH above or below 7 and why (the salt); half-volume point: pH = pKa; starting [HA] from
  the initial pH and Ka; the buffer region named; telling weak from strong by the curve. Uses the Weak Acid Titration
  Simulator's visual language and links to it.

### Guide 4: Indicators, Hydrolysis, Buffers and Structure
- **3.1 Indicators** (IV.17). HIn ⇌ H₃O⁺ + In⁻ with each side in its own colour, one side growing as H₃O⁺ or OH⁻ is
  added; one real indicator (phenolphthalein) simplified, its structure changing as it loses H⁺; a titration curve whose
  line is drawn in the indicator's colour at each point; pH = pKa at the colour change; end point vs equivalence point;
  choosing an indicator; universal indicator and reading a pH range from several indicators.
- **3.2 Hydrolysis** (IV.13). Maths first, then pictures (plan). Spectator ions; ions on the Table act as acids or bases;
  amphiprotic ions (compare Ka and Kb); salts where both ions react; hydrated metal ions. pH of a salt solution, and the
  mass of salt from a measured pH. Predict acidic / basic / neutral before adding a salt; predict an indicator's colour.
  Ksp and pH together (plan: "combine Ksp and Ka"). LIs from the plan's 3.3 moved here.
- **3.3 Buffers and Biological Systems** (IV.19, IV.20). What a buffer is; pH = pKa when equal amounts; dilution doesn't
  change it; ratio bars before and after adding acid or base; capacity; the buffer region of a titration curve;
  **Henderson-Hasselbalch derived from Ka** and used (past Hebden, teacher's plan); blood (CO₂ / HCO₃⁻, haemoglobin,
  acidosis and alkalosis) and phosphate buffers. Competencies: Le Châtelier conclusions (Processing and Analyzing),
  buffers in the body (Applying and Innovating), planning a buffer of a chosen pH (Planning and Conducting).
- **3.4 Acid-Base Structures** (not in Hebden; teacher's plan). Why one acid is stronger than another of the same type:
  bond polarity, bond strength, electronegativity, number of oxygens. Lewis structures with an optional 3D model showing
  the H leaving. Competencies: hypothesize from structure (Questioning and Predicting), periodic trends (Processing and
  Analyzing), Lewis structures and 3D models (Communicating). **Numbers:** booklet Ka values where they exist; for acids
  the booklet doesn't list (e.g. HClO, HClO₂, HClO₃), standard textbook values marked "not in your Data Booklet"
  (teacher, 2026-11-27). Content follows the plan's reference (LibreTexts 6.3.7): binary acids get stronger down a
  group (bond strength); oxoacids get stronger with a more electronegative central atom (HOCl > HOBr > HOI) and with
  more oxygens (HClO < HClO₂ < HClO₃ < HClO₄); each proton removed from a polyprotic acid is harder to remove (booklet
  H₃PO₄ series). **Trends only, no Pauling's rules** (teacher, 2026-11-27). Booklet values win where the reference
  disagrees (H₂CO₃, H₃PO₄).

---

## 7. Constraints

**Curriculum**
- Content, terms, notation and depth follow Hebden Unit IV (AGENTS.md), in the **plan's order** (hydrolysis and
  indicators in Section 4). Past Hebden only where the plan asks (Henderson-Hasselbalch, structures).
- Out by decision (2026-11-27): IV.2 common acids and bases, IV.21 oxides and acid rain, % purity and molar mass by
  titration, the conductivity titration.
- No Hebden questions or numbers on the site; Hebden question numbers are cited for homework.
- Labs: the Part 1.3 titration demo uses the class lab's reagents (teacher OK); the ranking lab slide uses generic acids
  and made-up colours.
- Free navigation, no gates, no scores, nothing saved.

**Numbers and calculations**
- Every number from the Data Booklet (Ka table p. 6, indicators p. 7, atomic masses, solubility rules). One exception:
  Part 3.4 may use outside Ka values for acids the booklet doesn't list, marked "not in your Data Booklet". Ka-based answers
  to 2 significant figures, as Hebden says. Compounds must be able to reach the concentrations used.
- Unit analysis for every mole, mass, volume and concentration step (`SolUI.ua`), no c = n ÷ V. Kw, Ka, Kb, Keq, ICE and
  pH steps are substitution. The 5% assumption, no quadratic formula.

**Technical**
- Static on GitHub Pages, no build step; libraries from a CDN are fine. Laptop and tablet first; the projector is a real
  target.
- **Dark mode on every new page.** Bonding's dark rules move from `bonding.css` into `suite.css` (as Bonding's notes ask)
  so this suite and later ones share them; `assets/theme.js` adds the switch.
- Every page carries the full head (title, description, canonical, Open Graph, JSON-LD, favicon). Pages are added to the
  hub and `sitemap.xml` when they ship.

**Visual**
- **The look is decided by a fresh taste pass** (teacher, 2026-11-27), not inherited from Solubility. A comparison page
  offers 2 or 3 directions for this unit (particles, molecules, beakers, equations, stage and page), as Solubility's
  taste page did. The plan's asks are the brief for it: high-quality animation, things that look real, molecule sizes
  exaggerated for the picture with exact numbers.
- Fixed going in (repo `AGENTS.md`, site-wide rules): the site's shared chrome (`suite.css`, hub, presentation view) so
  the unit still sits in the family, and the acid / base colours below. The taste pass can propose changing the colours,
  but only with the teacher's OK, since other units use them.
- H₃O⁺ magenta, OH⁻ violet-blue, H₂O pale grey, other cations rose, other anions yellow, always with formula and charge.
- No dot grids, no eyebrow labels above headings, no em dashes in student copy, no personified particles.

---

## 8. Reuse

Reuse is for **code and behaviour** (engines, components, layout). How each piece looks is open to the taste pass.

- `assets/suite.css`, `suite-chrome.js`, `theme.js`: hub, Guide layout, presentation view, room switcher, dark mode.
- `solubility/assets/guide.js`, `sol-ui.js` (worked steps, unit analysis, choice cards), `sol-draw.js` (beakers,
  flasks, glass), `sol-scene.js` (particle window).
- `equilibrium/assets/ice-ui.js`: fillable ICE table and stepped working (Section 2).
- `chemistry-11h/bonding/assets/draw-engine.js` and `turntable.js`: Lewis structures and 3D models (1.1, 3.4).
- The resizing equation from `chemistry-11h/atomic-structure/02-coulomb-ionization.html` (1.2, 2.1, 3.1).

---

## 9. Success criteria

- A student can classify a species as an Arrhenius or Brønsted-Lowry acid or base, name its conjugate, and say whether
  it is strong or weak.
- A student can move between [H₃O⁺], [OH⁻], pH and pOH with correct significant figures, and explain why one rises as
  the other falls.
- A student can find the pH after mixing a strong acid and a strong base, and the concentration of an unknown from
  titration data (1:1 and 2:1).
- A student can predict which side of an acid-base equilibrium is favoured, and calculate pH, Ka or starting
  concentration for weak acids and bases.
- A student can read a titration curve for equivalence point, pKa and buffer region, and choose an indicator.
- A student can predict whether a salt solution is acidic, basic or neutral, and explain how a buffer resists change.
- The teacher can run each Part as one lesson in presentation view.

---

## 10. Out of scope

IV.2 and IV.21 content, % purity and molar mass, conductivity titrations, the quadratic formula, activity corrections,
scores or saved answers, phone layouts, changes to the existing Weak Acid Titration Simulator.
