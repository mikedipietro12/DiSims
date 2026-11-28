# Discovery: Acids and Bases (AP Chem 12, Unit 4)

> Capture answers here as we go. No engine or room content until the brief is approved.
> Designpowers lane: **Build** · Mode: **Direct** (emulated in Claude Code, same as `solubility/`).
> Source plan: the teacher's "Acids and Bases Plan" PDF (2026-11-27). Content source: Hebden Chemistry 12, Unit IV
> (`private/HEBDEN/Hebden 12 (p101-226).pdf`, book pp. 109 to 190; answers in `(p227-336).pdf`).

---

## Known so far

- **Repo home:** `ap-chemistry-12/acids-bases/`. It already holds the unit hub (`index.html`, "Unit 4 - Acids and
  Bases", 1 sim) and the **Weak Acid Titration Simulator** (`titration.html`, React, its own styling, in the sitemap).
- **The titration simulator stays as it is.** The plan links it and doesn't rebuild it. The weak acid titration lesson
  (2.4) borrows its visual language.
- **Carried over from the other suites (plan, "things to maintain"):**
  - Presentation view, sections, navigation (shared `assets/suite.css` + `suite-chrome.js`).
  - **Predictions check themselves**: a card turns green for a correct answer and red otherwise, or shows the
    explanation (as in the Solubility Guide).
  - High-quality animation and glass that looks real (`solubility/assets/sol-draw.js`).
  - **Particle sizes are exaggerated for the picture; numbers are always real** (Solubility's representative
    particle window).
- **Dark mode is not pre-built for this suite yet.** Only Bonding has it (`assets/theme.js` + a dark block at the end
  of `chemistry-11h/bonding/assets/bonding.css`). Bonding's note says to move that block into `suite.css` when the next
  suite gets dark mode. This unit is that suite, so moving it is a build task.
- **Colours are already set** (AGENTS.md): H⁺ / H₃O⁺ red `#d62828` (changed from magenta 2026-11-27), OH⁻ violet-blue `#5b5fd6`, H₂O pale grey
  `#e4ebf3`, cations rose `#f06a84`, anions yellow `#ffd257`. Tokens live in `solubility/assets/sol.css`.
- **Numbers:** BC Chemistry 12 Data Booklet only (`docs/reference/chem12-data-booklet.md`). The Ka table (p. 6) and
  indicator table (p. 7) are already transcribed.
- **Calculations:** unit analysis for every mole, mass and concentration step (`SolUI.ua`). Ka, Kb, Kw, Keq and ICE work
  are K calculations, so they're shown as substitution.
- **Reusable pieces:** ICE tables (`equilibrium/assets/ice-ui.js`, fillable table + stepped working), the Coulomb's law
  equation whose terms resize (`chemistry-11h/atomic-structure/02-coulomb-ionization.html`, the plan's "electron
  section"), Solubility's beaker, particle window and worked-step components.
- **Standing rules:** teacher's voice (`docs/VOICE.md`, "we"), no personified particles, no eyebrow labels, no dot
  grids, no em dashes in student copy, Canadian spelling, laptop + tablet (no phones), robust interruptible animation.

---

## Plan structure as read from the PDF

The header lists **four sections and one sim**. The lesson table numbers them 1.x, 2.x and 3.x. Read together:

| Section | Lessons | Hebden |
|---|---|---|
| 1. Grade 11 review and key details | 1.1 AB intro · 1.2 Self-ionization of water · 1.3 Neutralizations and titrations review | IV.1 to IV.7, IV.11, IV.12, IV.16 |
| 2. Acid-base equilibrium | 2.1 Ka, Kb and strength · 2.2 pH of weak acids · 2.3 pH of weak bases | IV.8 to IV.10, IV.14, IV.15 |
| 3. Weak acid titrations | 2.4 Weak acid titrations | IV.16, IV.18 |
| 4. Indicators, hydrolysis, buffers, structure | 3.1 Indicators · 3.2 Hydrolysis · 3.3 Buffers and biological systems · 3.3 (sic) AB structures | IV.17, IV.13, IV.19, IV.20, none |
| Sim | Weak Acid Titration Simulator (built) | |

Things in the PDF to tidy at the brief:
- Two lessons are numbered 3.3 (Buffers, AB structures). Working fix: structures becomes **3.4**.
- **3.3 Buffers lists two hydrolysis LIs** ("how a salt may be acidic or basic", "estimate the pH of a salt solution").
  They probably belong to 3.2, which has only one LI.
- Curricular competencies are missing for 2.3, 3.3 and 3.4 (3.2 has one).
- 3.4's "Reference" link didn't come through in the PDF. Need the URL.
- 2.1 mentions a **weak acid ranking lab** slide. Need to know what the lab uses so the sim doesn't give it away
  (same rule as Solubility's Qual Lab).
- 1.3 asks for a **"classic" titration simulator** (1:1 and 2:1 ratios, simpler than the weak acid one). That is a new
  room, not part of the Guide text.

---

## Hebden coverage check (Unit IV, IV.1 to IV.21)

✓ = in the plan · ◐ = partly · ✗ = not in the plan

| Hebden | Topic (key ideas) | Plan | Note |
|---|---|---|---|
| IV.1 | Arrhenius acids, bases, salts; balancing neutralizations; descriptive properties (litmus, Mg + acid, sour/bitter, slippery) | ✓ 1.1 | |
| IV.2 | Common acids and bases: H₂SO₄, HCl, HNO₃, CH₃COOH, NaOH, KOH, NH₃ (properties, uses, concentrated strengths) | ✗ | Short card set in 1.1? |
| IV.3 | True nature of H⁺: the proton, H₃O⁺, rewriting ionizations with water | ✓ 1.1 | "Background theory of H⁺" |
| IV.4 | Brønsted-Lowry; acid/base on each side; mono-, di-, tri-, polyprotic; amphiprotic (negative charge + removable H) | ◐ 1.1 | Polyprotic and amphiprotic not named in the plan |
| IV.5 | Conjugate pairs; conjugate acid/base of a species; organic COOH and NH₂ groups; writing B-L equilibria | ✓ 1.1 | Clicking game |
| IV.6 | Strong vs weak (100% vs <100% ionized); strong vs concentrated; reading the Table (top six strong acids, O²⁻ and NH₂⁻); **levelling effect** | ◐ 1.1 | Levelling effect not named |
| IV.7 | Self-ionization of water, Kw = 1.00 × 10⁻¹⁴; neutral/acidic/basic by [H₃O⁺] vs [OH⁻]; endothermic, so Kw rises when heated | ✓ 1.2 | |
| IV.8 | Ka and Kb expressions; bigger Ka, stronger acid; strong acids have no Ka | ✓ 2.1 | |
| IV.9 | Ka × Kb = Kw for a conjugate pair; finding Kb from the Table | ◐ 2.1 | Not named; needed for 2.3 |
| IV.10 | Proton competition; the side with the weaker acid is favoured; Keq = Ka(reactant acid) ÷ Ka(product acid) | ✓ 2.1 | Plan's sample mixes are Hebden's Q38 |
| IV.11 | pH, pOH, logs and antilogs; pH + pOH = 14; pKw; **sig figs: only digits after the decimal count**; pH scale is logarithmic | ✓ 1.2 | "Magic square" = Hebden's four-corner scheme |
| IV.12 | Mixing strong acids and bases: dilute first, subtract, excess decides pH; finding moles or mass needed for a target pH | ✓ 1.3 | Plan's two problems are Hebden's worked example and Q60 |
| IV.13 | Hydrolysis: spectator ions (Group 1 and 2 cations; ClO₄⁻, I⁻, Br⁻, Cl⁻, NO₃⁻); ions on the Table act as acids or bases; amphiprotic ions (Ka vs Kb); both ions hydrolyse (compare Ka and Kb); hydrated metal ions (Fe(H₂O)₆³⁺) | ✓ 3.2 | Plan gives no Hebden number; this is it |
| IV.14 | Weak acid calcs (three problem types); assume [HA] − x ≈ [HA], state it, check ≤ 5% dissociation; Table Ka gives 2 sig figs; first proton only; H₂CO₃ and H₂SO₃ "don't exist" | ✓ 2.2 | Hebden calls the table **"ST, A, EQ"**; our suite says ICE |
| IV.15 | Weak base calcs: Kb from Kw ÷ Ka; salts like NaCN; Ksp + pH problems | ✓ 2.3 | Ksp + pH also suits 3.2 |
| IV.16 | Titration: equivalence point; three-step stoichiometry; partial neutralization of polyprotic acids; **% purity; molar mass**; repeat until volumes agree; conductivity titration | ◐ 1.3 | % purity and molar mass not in the plan |
| IV.17 | Indicators: HIn ⇌ In⁻ by Le Châtelier; end point vs equivalence point; pH = pKa at the transition; universal indicator; pH range from several indicators | ✓ 3.1 | |
| IV.18 | Standard solutions, primary standards (KHP, oxalic acid dihydrate, Na₂CO₃); titration curves (SA-SB, WA-SB, WB-SA); Ka = [H₃O⁺] at half volume; initial [HA] from pH_init; indicator choice | ✓ 2.4 + 1.3 | |
| IV.19 | Buffers: pH = pKa when equal; dilution doesn't change pH; small added H₃O⁺/OH⁻ barely moves the ratio; capacity; buffer region of a titration curve. **Hebden: no buffer calculations required** | ✓ 3.3 | Plan adds Henderson-Hasselbalch (AP, past Hebden: teacher's call) |
| IV.20 | Biological buffers: haemoglobin, CO₂/HCO₃⁻ in blood, acidosis/alkalosis, phosphate; the carbonated-water egg shell story | ✓ 3.3 | |
| IV.21 | Metal oxides basic, nonmetal oxides acidic; acid rain (SOₓ, NOₓ, pH 5.6 line, limestone, effects) | ✗ | Not in the plan |
| none | Acid strength from structure (bond polarity, bond strength, oxyacids, electronegativity) | 3.4 | AP content past Hebden, teacher asked for it |

### Order: plan vs Hebden
Hebden's order is IV.13 hydrolysis before IV.14 Ka calculations, and IV.17 indicators before IV.18 titration curves.
The plan moves hydrolysis and indicators to Section 4, after weak acid titrations. AGENTS.md says to match Hebden's order
unless the teacher says otherwise; the plan is the teacher saying otherwise. **Working assumption: follow the plan.**

### Hebden exercises by lesson (reference only, not copied into the site)
1.1: Q1 to Q27 · 1.2: Q28 to Q30, Q47 to Q57 · 1.3: Q58 to Q68, Q94 to Q107, Q121 to Q123 · 2.1: Q31 to Q46 ·
2.2: Q74 to Q83 · 2.3: Q84 to Q93 · 2.4: Q124 to Q130 · 3.1: Q108 to Q120 · 3.2: Q69 to Q73 · 3.3: Q131 to Q143 ·
IV.21: Q144 to Q147 (not placed).

---

## Open questions

### Decided (user, 2026-11-27)
- **Four Guide pages**, one per section. Each lesson is a Part with its own "Before we begin" card (LIs + competencies),
  as in Solubility. The hub shows the four Guides, then the existing simulator.
- **Practice problems are our own**, in the same shape as Hebden's. Each lesson cites the Hebden question numbers for
  homework (e.g. "Hebden Q58 to Q68"). No Hebden questions or numbers on the site.
- **No extra Hebden topics.** IV.2 (common acids and bases), IV.21 (oxides, acid rain), IV.16 % purity / molar mass and
  the conductivity titration stay out. Levelling effect, Ka × Kb = Kw, polyprotic and amphiprotic are folded into
  their lessons.
- **Section 1 first** (1.1, 1.2, 1.3, with the titration demo in 1.3). It also builds the shared beaker / particle / pH pieces
  the later sections reuse.

### Defaults taken unless the teacher objects
- Plan order, not Hebden's (hydrolysis and indicators in Section 4).
- ICE tables, as in the equilibrium unit; the first weak acid lesson notes once that Hebden calls it "ST, A, EQ".
- Hebden's 5% assumption, no quadratic formula.
- Henderson-Hasselbalch derived and used in 3.3 (plan), past Hebden.
- Structures lesson renumbered 3.4; the two hydrolysis LIs move from 3.3 to 3.2.

### 1. Architecture
- [x] Four Guide pages (decided above).
- [x] **No Classic Titration room** (user, 2026-11-27): the classic titration is done in class. It sits in Guide 1,
      Part 1.3 as a simulation demo on the stage beside the notes, not its own room or hub tile.
- [x] No other rooms, assumed (2026-11-27): the teacher dropped the one extra room proposed, so the Guides carry the
      unit with the existing simulator. Reopen if a sandbox is wanted. Was: any other quiet room (e.g. a pH sandbox: beaker, add acid/base/salt, live pH and [H₃O⁺]/[OH⁻] bars)? The plan
      doesn't ask for one.

### 2. Content and Hebden
- [x] Practice problems: our own, cite Hebden (decided above).
- [x] Extra Hebden topics: none (decided above).
- [x] ICE naming, 5% rule, Henderson-Hasselbalch: defaults above.

### 3. Labs
- [x] **Weak acid ranking lab (2.1)** (user, 2026-11-27): only a mention, giving nothing away. Use generic acids
      ("HA", "HB", ...) and made-up indicator colours, no real acids or indicators.
- [x] **Classic titration lab (1.3)** (user, 2026-11-27): the Part 1.3 titration demo may use the **same reagents as
      the class lab**, since the lab's unknown is unmarked: **HCl or H₂SO₄ titrated with NaOH, phenolphthalein**.
      That gives the plan's 1:1 and 2:1 ratios.

### 4. Missing from the PDF
- [x] **Curricular competencies** (user, 2026-11-27):
  - **2.3:** same as 2.2. Applying and Innovating: We will implement multiple strategies to solve problems that deal
    with pH.
  - **3.3:** Processing and Analyzing Data and Information: We will use our knowledge of Le Châtelier's principle to draw
    conclusions about how buffers resist changes in pH. · Applying and Innovating: We will apply our understanding of
    buffers to real systems in the body, such as blood and cells. · Planning and Conducting: We will plan how to make a
    buffer with a chosen pH from a weak acid and its conjugate base.
  - **3.4:** Questioning and Predicting: We will hypothesize why one acid is stronger than another based on its
    structure. · Processing and Analyzing Data and Information: We will seek patterns and trends in acid strength using
    electronegativity, bond strength and other periodic table trends. · Communicating: We will use Lewis structures and
    3D models to explain how a proton is donated or accepted.
  - 3.2 keeps its one competency unless the teacher adds more.
- [x] **3.4 numbers** (user, 2026-11-27): Ka values from outside the Data Booklet are allowed for 3.4 only, for acids
      the booklet doesn't list (e.g. HClO, HClO₂, HClO₃), each marked "not in your Data Booklet". Booklet values are used
      wherever the booklet has one.
- [x] **3.4 reference** (user, 2026-11-27): LibreTexts Inorganic Chemistry 6.3.7, "The Acidity of an Oxoacid is
      Determined by the Electronegativity and Oxidation State of the Oxoacid's Central Atom" (CC BY 3.0). Covers:
      central-atom electronegativity (HOCl > HOBr > HOI), number of oxygens (HClO < HClO₂ < HClO₃ < HClO₄: more O pulls on
      the O-H bond and spreads the conjugate base's charge over more atoms), successive ionizations of polyprotic acids
      getting weaker, Pauling's rules, and the contrast with binary acids (H-X gets stronger down a group).
  - **Trends only, no Pauling's rules** (user, 2026-11-27).
  - **Chlorine series:** outside Ka values for HClO and HClO₂, marked "not in your Data Booklet"; HClO₃ and HClO₄
    shown as strong (HClO₄ is strong in the booklet). Source for the two values to be picked and noted at the plan.
  - **Hypohalous series** from the reference, marked "not in your Data Booklet": HOCl 4.0 × 10⁻⁸, HOBr 2.8 × 10⁻⁹,
    HOI 3.2 × 10⁻¹¹ (Pauling electronegativity of X: 3.0, 2.8, 2.5). HOCl here is the same acid as HClO above, so the
    lesson uses one value for it.
  - **Booklet wins where the two disagree:** the reference gives H₂CO₃ pKa 3.6 (true carbonic acid), but the booklet
    and Hebden treat it as CO₂ + H₂O with Ka 4.3 × 10⁻⁷; H₃PO₄ pKa 2.2 vs the booklet's 7.5 × 10⁻³. Use booklet values.
  - The reference's Pauling's-rule p and q labels are inconsistent; not used anyway.
- [ ] Confirm the two hydrolysis LIs move from 3.3 to 3.2.

### 5. Constraints
- [x] Section 1 first (decided above). By when? _Open._
- [x] **No hub wiring yet** (user, 2026-11-27): no stub pages, hub tiles or sitemap entries until the teacher says so.
