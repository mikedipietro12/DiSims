# Design State: Acids and Bases (AP Chem 12, Unit 4)

_Last updated: 2026-11-27 (taste approved; Guide 1 Part 1.1 built, waiting for review)_

## Brief
- **Problem:** acids and bases as proton transfers in water, [H₃O⁺] and [OH⁻] tied by Kw, strength as an equilibrium,
  told as one story ("particles in water passing protons, with real numbers attached") instead of separate formulas
- **Primary persona:** AP Chem 12 student after Solubility. Secondary: the teacher presenting one Part per lesson
- **Brief document:** `docs/designpowers/briefs/2026-11-27-acids-bases.md` (approved)
- **Discovery notes:** `DISCOVERY.md` (decisions, Hebden coverage check, Hebden question numbers by lesson)
- **Source plan:** the teacher's "Acids and Bases Plan" PDF

## Structure
- Four Guides (Guide 1: 1.1 to 1.3 · Guide 2: 2.1 to 2.3 · Guide 3: 2.4 · Guide 4: 3.1 to 3.4), each lesson a Part
  opening with "Before we begin", + the existing Weak Acid Titration Simulator (unchanged)
- Classic titration = a demo on the Part 1.3 stage, not a room
- **First build: Guide 1**

## Next
1. ~~Strategy~~ approved: `docs/designpowers/strategy/2026-11-27-acids-bases-strategy.md`
2. Taste pass: `taste-directions.html` (dev only, noindex, not linked) shows A · Ink and spheres, B · Real molecules,
   C · Night lab, each with the same four scenes in light and dark. Round 2 = the chosen look (A light / C dark).
   Taste doc drafted: `docs/designpowers/taste/2026-11-27-acids-bases-taste.md`, **waiting for approval**
3. ~~Taste~~ approved. Plan: `docs/designpowers/plans/2026-11-27-guide-1-plan.md`
4. **Build Guide 1 (`review.html`) one Part at a time.** Part 1.1 built 2026-11-27, waiting for the teacher's review; then 1.2, then 1.3

## Design Principles
1. One proton, one picture
2. Kw holds the balance
3. Every number has a picture, and the picture is honestly scaled
4. Predict first, and the check comes with a reason
5. The teacher talks, the stage shows the maths
6. Readable without colour, usable without a mouse, and keeps the labs' secrets

## Hard rules (from discovery)
1. Hebden Unit IV content and depth, in the plan's order; past Hebden only for Henderson-Hasselbalch and 3.4 structures
2. Our own problems; Hebden question numbers cited for homework. No Hebden questions, numbers or text on the site
3. Data Booklet numbers only (3.4 may add outside Ka for acids the booklet lacks, marked "not in your Data Booklet")
4. Unit analysis for mole / mass / volume / concentration; Kw, Ka, Kb, ICE and pH as substitution; 5% rule
5. No hub wiring, stub pages or sitemap entries until the teacher says so
6. Ranking lab slide gives nothing away: generic HA / HB / HC, made-up indicator colours
7. Repo rules: teacher's voice, no personification, no eyebrow labels, no dot grids, no em dashes in student copy,
   laptop + tablet, dark mode on every page

## Decisions Log

| Date | Agent | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-11-27 | discovery | Designpowers process run by hand (plugin not loaded this session), same artefacts as Solubility | "Design Powers as usual" |
| 2026-11-27 | discovery | Hebden Unit IV read in full (OCR of the scanned PDFs, text kept outside the repo); coverage table in `DISCOVERY.md` | AGENTS.md: check Hebden first |
| 2026-11-27 | user | Four Guide pages, one per section; each lesson a Part with its own Before we begin | "Four separate guided sections" |
| 2026-11-27 | user | Practice problems our own, Hebden question numbers cited | AGENTS.md copyright rule |
| 2026-11-27 | user | IV.2, IV.21, % purity, molar mass, conductivity titration left out | Not in the plan |
| 2026-11-27 | user | Section 1 first | |
| 2026-11-27 | user | Titration demo uses the class lab's reagents (HCl or H₂SO₄ with NaOH, phenolphthalein) | The lab's unknown is unmarked |
| 2026-11-27 | user | Ranking lab: mention only, generic acids and made-up colours | Don't give the lab away |
| 2026-11-27 | user | No hub wiring yet | |
| 2026-11-27 | user | Competencies added for 2.3 (same as 2.2), 3.3 (three), 3.4 (three) | Missing from the PDF |
| 2026-11-27 | user | 3.4 follows LibreTexts 6.3.7; trends only, no Pauling's rules; outside Ka marked; booklet wins on conflicts (H₂CO₃, H₃PO₄) | Plan's reference link |
| 2026-11-27 | discovery | Sr(OH)₂ is the two-OH⁻ base: the booklet lists only alkali, NH₄⁺ and Sr²⁺ hydroxides as soluble (plan's 3.0 M Mg(OH)₂ can't exist; Ba(OH)₂ counts as low solubility) | Concentrations must be reachable |
| 2026-11-27 | user | No Classic Titration room: the classic titration is done in class; Part 1.3 shows it as a stage demo beside the notes | "Doesn't need its own sim" |
| 2026-11-27 | user | Fresh taste pass for the unit's look; reuse covers code and behaviour only | Brief §7 change |
| 2026-11-27 | user | Brief approved section by section | |
| 2026-11-27 | user | Strategy approved: six principles, family position, experience map (Guide 1 detailed), metrics, trade-offs | Section-by-section sign-off |
| 2026-11-27 | design-taste | Comparison page built: three directions, same scenes (0.10 M HCl vs 0.10 M HF at booklet Ka, NH₃ + H₂O proton transfer, Kw balance, phenolphthalein endpoint, prediction card), light + dark, `?t=` hook. Flagged: H₃O⁺ magenta sits close to phenolphthalein pink | Brief §7: fresh taste pass |
| 2026-11-27 | user | Round 1 notes: **A in light mode, C in dark mode**; H₃O⁺ drawn as O + 3 H (OH⁻ as O + H, role colour on the O, H white); H₃O⁺ **red, not magenta**, so pink only means phenolphthalein; yellow anions and rose cations stay; proton transfer switches between **Lewis, ball-and-stick and space-filling** | Taste pass round 1 |
| 2026-11-27 | design-taste | Round 2 added to `taste-directions.html`: theme picks A/C, three candidate reds (Tomato #e0452b, Signal red #d62828, Crimson #b81d3a) beside phenolphthalein pinks and the other ion colours, three-way model switch; the moving H keeps a red ring in every model. Dev hooks `?red=0-2`, `?mode=lewis\|ball\|fill` | Teacher's notes |
| 2026-11-27 | user | H₃O⁺ red = **Signal red #d62828**, **site-wide** (AGENTS.md, sol.css, sol-draw.js, courses.css; cache versions bumped); 3D models use **role colours** (molecules grey, OH⁻ O violet-blue, NH₄⁺ N rose) | Taste round 2 questions |
| 2026-11-27 | user + design-taste | Teacher saw only the colour change (the O + 3 H H₃O⁺ was in a separate round 2). Page rebuilt as one comparison: A and C draw particles as atoms (H₃O⁺ = red O + 3 H); **B's Kw bars in every direction**; Lewis / ball-and-stick / space-filling switch on every proton transfer (A, C role colours; B keeps real atom colours); round 2 and the red picker removed | "Redo the taste directions for all those" |
| 2026-11-27 | user | **Taste page cut to the chosen look only**: A with the changes; B and C removed (C's night-lab stage stays as dark mode, per the earlier pick). Scenes in a 2-column grid at 520 px | "Just do A with the changes; we can keep editing" |
| 2026-11-27 | user | **Space-filling: classic atom colours + charge haze** (red haze for +, yellow haze for −, the δ+ / δ− tokens), fading in with the transfer. Ball and stick keeps role colours | "Leave the classical colours, then a red or yellow haze for charge" |
| 2026-11-27 | user | Taste approved ("looks awesome, let's build") | |
| 2026-11-27 | build | **Shared dark mode:** Bonding's dark tokens, theme keycap and text-on-ink rules lifted into `assets/suite.css`; Bonding keeps only its own drawing remaps. Bonding pages bumped to suite / bonding v20261127; Bonding dark mode checked by screenshot | Brief §7; Bonding's own note |
| 2026-11-27 | build | **Guide 1 scaffold** `review.html` (noindex, not linked): ICE Tables stage frame (`ice.css`, `IceUI.steps`, fixed Back / Next step footer, full-explanation toggle), Parts with Before we begin blocks, presentation view (steps, then picture tabs, then the next section). New `assets/ab.css`, `ab-draw.js` (particles as atoms, one proton-transfer engine in Lewis / ball and stick / space-filling, charge haze, log bars), `ab-chem.js` (booklet Ka, masses, exact weak-acid [H₃O⁺]), `ab-ui.js` (self-checking cards, conjugate matching game, model switch, tabs), `ab-guide.js` (controller). Dev hooks `?beat= &tab= &steps= &model= &pick= &learn=1 &full=1 &t=` | Plan |
| 2026-11-27 | build | **Part 1.1 built:** Arrhenius (HCl Lewis: the pair stays with Cl; NaOH separating; 8 sort cards incl. the CH₃OH exception), Neutralization (HNO₃ + Sr(OH)₂ balanced in Hebden's steps, net ionic; 6 property cards), What is H⁺ (proton onto water's lone pair; the ionization rewritten with water), Brønsted-Lowry (NH₃ + H₂O and HF + H₂O in all three models, steps forward and back, acid / base tags; 4 check cards: water as base, water as acid, amphiprotic HS⁻, triprotic H₃PO₄), Conjugates (12-tile matching game), Strong and weak (unlabelled 0.10 M HF / HCl windows, the card reveals the names; 2 × 2 strong / concentrated table with exact [H₃O⁺]: 1.0 M CH₃COOH 4.2 × 10⁻³ M vs 0.010 M HCl; the six strong acids and levelling). Practice in Hebden: Q1 to Q4, Q10 to Q27. Screenshots: light, dark, presentation view, tablet portrait | Plan Part 1.1 |
| 2026-11-27 | build | Fixes from screenshots: `.sr-only` (live regions showed), marked answers keep green / red over the suite's pressed colours in dark mode, anion / cation text darker in light mode, charge signs in the ion's own role colour, stage above text below 860 px | Self-check |
| 2026-11-27 | user | **Presentation view is visual primary**: the sim is the biggest thing; no "each step appears here", no step sentences, captions or how-to lines on the stage; explanations go in the section text. Built: new `AbUI.stepper` (Next step drives the picture; only an equation, large, under it), presentation layout = one big canvas that scales to fill the stage, Before we begin shows the lesson's LIs and competencies as the first slide, full-explanation toggle removed, card reasons hidden in presentation view. Neutralization got a picture (ions: two HNO₃ meet Sr(OH)₂, H⁺ and OH⁻ become water, the leftover ions form Sr(NO₃)₂, spectators fade for the net ionic equation). Brønsted-Lowry's last step labels acid / base under each species in the picture. Removed stage sentences moved into the section text (Arrhenius, balancing steps, rewriting with water, both directions, matching how-to, levelling). Rule added to the plan and to the repo memory | "The simulation should be the biggest thing on present view" |
