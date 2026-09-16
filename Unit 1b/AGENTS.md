# AGENTS.md — Atomic Structure Simulation Suite

> An 8-module set of interactive simulations covering the first twelve
> ChemActivities of Moog & Farrell, *Chemistry: A Guided Inquiry* (5th ed.).
> Built for Chemistry 11 Honors / AP Chemistry. Vanilla HTML/CSS/JS,
> one HTML entry per module (inline and/or shared `assets/`), deployed to
> Netlify via GitHub. No build step.

---

## 1. What this is (and what it is not)

This suite rebuilds the atomic-structure unit of *Chemistry: A Guided Inquiry*
as a sequence of **manipulable models that students probe**, in the order Moog
uses to construct atomic structure from experimental evidence.

The unit is a single continuous argument, not twelve topics. It builds the atom
**from measured data** — ionization energies and photoelectron spectra — rather
than asserting a planetary model or handing down quantum numbers. The
simulations must preserve that logic: structure is *discovered* from the
instruments, never declared up front.

### Core principles

1. **Evidence-driven.** Every claim the student reaches should be traceable to
   something they measured or manipulated in the sim. IE and PES are the
   through-line.
2. **No Bohr model. Ever.** No electrons-in-planetary-orbits imagery anywhere
   in the suite. Use the shell model (concentric shells / core-charge diagrams)
   and, later, subshell energy-level and electron-density representations.
   This is a hard rule, carried over from the Powers-of-Ten visualizer.
3. **Exploration-first, not Q&A.** These are sandboxes the student works
   through slowly to figure out what's going on — not levels to clear and not
   quizzes. **Nothing is gated behind a correct answer.** (See §4.)
4. **The sim stays quiet about the answer.** Names, labels, and trends
   (`2s`/`2p`, "shielding", the anomaly) surface only once the student's own
   exploration brings them into view. Discovery is earned by doing, not
   revealed on load.
5. **The paper interrogates; the sim is the instrument.** Moog's actual
   Critical Thinking Questions live on a companion worksheet, not inside the
   app. (See §4 and §10.)
6. **Learning intentions are the spine.** Every module exists to serve a named
   set of learning intentions and BC curricular competencies (§5, §11). The
   simulation is the vehicle; the intentions are the destination. If a
   manipulable advances no listed intention, cut it. If an intention has no
   manipulable behind it, the module is unfinished.
7. **Element symbols keep proper capitalization. Always.** Wherever an
   element is named — table cell, diagram label, sentence, title, HUD,
   readout, picker, debrief — use standard chemical-symbol casing: first
   letter capital, second letter lowercase. Write **Li**, **Be**, **Fe**,
   **Ne**, **Mg**. Never **LI**, **BE**, **FE**, **NE**, **MG**. This
   applies to the entire periodic table, including one-letter symbols (**H**,
   **C**, **N**, **O**, **F**, **P**, **S**, **K**, **V**, **Y**, **I**,
   **W**, **U**) and every two-letter symbol. Do not let CSS
   `text-transform: uppercase` on mono micro-labels flatten two-letter
   symbols; element symbols are an exception to the uppercase-label rule.

### Non-goals

- No Bohr orbits, no "electron shells as rings the electron travels on."
- No natural-language auto-grading. Where a module offers a self-check, it
  reveals a model answer for the student to compare against — it does not judge
  typed prose.
- No progress gated behind a correct answer, no score, no points, no
  celebratory "correct!" feedback.
- No reproduction of Moog's activity prose or CTQ text inside the app or this
  spec. Reference **data** (measured values, constants) is factual and used
  freely; the workbook's wording is not. Students use their own copy of the
  workbook alongside the sims.

---

## 2. Tech stack & conventions

Consistent with the existing toolchain — do not introduce a build step.

- **Vanilla HTML/CSS/JS.** No frameworks, no bundlers, no npm at runtime.
- **One HTML entry per module.** CSS/JS may be inline **or** linked from
  `assets/` (§2.2). No build step. A module must still open and run from the
  repo root (or Netlify) with only relative paths.
- **A hub `index.html`** links the eight modules and shows unit progress
  (visited/not-visited only — no scoring).
- **Graphics: SVG + HTML/CSS by default.** Compose module openers, structural
  diagrams (shells, particles, box diagrams), labels, and decorative plates as
  inline SVG and HTML — crisp vectors, CSS motion, markup you can restyle.
  Prefer this stack whenever the figure is not a continuous live plot.
- **Canvas 2D only for hot redraws.** Use `<canvas>` when the viewport must
  redraw continuously from live quantitative data — spectra, V(d) curves,
  animated waves, soft radius disks that update every frame. Decision rule:
  *if it redraws continuously from live data, use Canvas; otherwise compose
  with SVG + HTML.*
- **Chrome/UI: HTML + CSS.** Plate border, HUD, help panel, manipulator controls.
- **Shared design tokens** live in §7 and in `assets/suite.css` (the runtime
  source of truth for new work). Legacy modules 01–05 may still inline an
  identical `:root` block. **Do not** re-paste tokens into a file on unrelated
  edits. If a token changes, change `assets/suite.css` once (and any remaining
  inlined copies only when that module is already being touched).
- **Deploy:** GitHub → Netlify, no build command, publish directory = repo
  root. GitHub Desktop for version control, Cursor as editor.
- **Data:** small reference tables (§8) are embedded as JS objects in each
  module that needs them. No external data fetches; the suite runs fully
  offline/local.

### 2.1 Editing efficiency (surgical changes)

Modules 01–05 are **shipped reference implementations** — keep their look and
structure. The cost problem is agents rewriting 2–4k-line files for small
tasks. Agents editing an existing module MUST:

1. **Prefer surgical edits.** Change only the functions, CSS rules, or markup
   blocks required by the task. Do **not** rewrite or re-emit an entire module
   HTML file unless the user explicitly asks for a full rewrite, or the file is
   a stub under ~200 lines with no real chrome yet.
2. **Do not regenerate chrome.** Do not re-paste `:root` tokens, the grain
   overlay (`body::before`), `.top-nav` / briefing / debrief / Stuck? markup,
   or the shared helpers (`fillIntentionList`, `fillCompetencyList`,
   `renderBriefing`, `renderDebrief`, `revealDebrief`, Stuck? wiring) unless
   those specific blocks are the change request.
3. **Read before writing.** Open the target module and locate the relevant
   `id` / function (`#debrief`, `DEBRIEF`, `revealDebrief`, stage gates).
   Patch in place. Do **not** copy `01-nucleus-isotopes.html` wholesale into
   another module.
4. **Match by reference, not by duplication.** “Match 01” / “match the visual
   system” means: same tokens, type roles, plate conventions, and interaction
   contract — **not** “duplicate 01’s file structure and CSS line-for-line.”
5. **DEBRIEF data only for curriculum text.** To update learning intentions or
   competencies, edit the `DEBRIEF` object (and keep wording aligned with §5).
   When adding or renaming acts, also set/update each intention's `target` and
   `revisit` (§11.5). Leave the briefing/debrief HTML shell alone unless markup
   is broken.
6. **One concern per edit pass.** Visual-token tweaks, discovery-arc logic,
   and data-table fixes are separate passes when possible.
7. **Grow stubs; don’t replace shells.** For modules 06–08, grow the existing
   file (or link shared assets and add module-only code). Do not replace a
   working chrome shell with a new full-file draft “for consistency.”

### 2.2 Optional shared assets (still no build step)

Self-contained single files remain valid. Shared assets are **allowed and
preferred for new work** (modules 06+) when they keep the suite offline and
Netlify-static:

| Path | Contents |
|------|----------|
| `assets/suite.css` | §7 tokens, grain, nav, buttons, Stuck?/help, briefing, debrief, `.student-q`, base `.viewport` |
| `assets/suite-chrome.js` | `SuiteChrome.fillIntentionList`, `fillCompetencyList`, `renderBriefing`, `renderDebrief`, `revealDebrief` (exclusive stage + revisit wiring), `enterDebriefStage`, `leaveDebriefStage`, `wireStuckHelp`, `prefersReduced` |
| `assets/pubchem-data.js` | `SuitePubChem.PUBCHEM` — atomic radius / Pauling EN / EA (eV + MJ/mol) for Z = 1–54 when Moog is silent (§8.0) |

Rules:

- Relative URLs only (`href="assets/suite.css"`). No CDN CSS/JS except the
  existing Google Fonts links.
- No bundler, no npm, no build command. Netlify publish dir stays repo root.
- A module may still inline everything (legacy 01–05). **New modules (06+)
  should link shared assets** and keep only module-specific CSS/JS inline.
- If a token changes, change **`assets/suite.css` once**. Do not ask agents to
  paste tokens into nine files by hand.
- Module-specific CSS stays in a small inline `<style>` after the shared link.
  Extend the `.mono-label` selector list locally; do not fork the token block.
- Head pattern for new / rebuilt modules:

```html
<link rel="stylesheet" href="assets/suite.css">
<style>/* module-only CSS + local .mono-label extensions */</style>
…
<script src="assets/suite-chrome.js"></script>
<script>/* module JS; call SuiteChrome.renderBriefing(DEBRIEF) etc. */</script>
```

### 2.3 What NOT to regenerate

Unless explicitly requested, agents must **not** recreate or replace:

- The §7 `:root` token block or press-grain `body::before` SVG
- `.module-wrap` / `.top-nav` / `.back-link` / `.mod-meta` chrome
- `#briefing` … `#briefingNext` / `#moduleStage` shell
- `#debrief` markup (`#debriefTitle`, `#debriefIntentions`, `#debriefCompetencies`)
- Shared helpers listed in §2.2 (or their inlined equivalents in 01–05)
- Entire Canvas/SVG draw loops when the task is a label, gate, or copy tweak
- A second visual theme “to match 01” when tokens and plate rules already match

Anti-patterns:

- “I’ll rewrite the whole HTML for consistency”
- Pasting AGENTS §7 into a file that already has identical tokens
- Cloning `01-nucleus-isotopes.html` as a template for 06+ after 03–05 already
  establish the briefing → stage → debrief pattern
- Replacing shipped `note: 'on paper'` with `paper: true` (or the reverse)
  without a coordinated suite-wide change — **shipped code uses `note`**

### Quality floor (every module)

- Responsive down to a phone screen; the physics viewport reflows, never
  clips.
- Visible keyboard focus on every interactive control; full keyboard operation
  of manipulators where feasible (sliders, steppers, element selector).
- `prefers-reduced-motion` respected: the one scripted reveal per module
  becomes an instant draw; nothing else animates.
- Color is never the only carrier of meaning (peaks/labels also differ by
  position and text).
- Runs offline, no console errors, no external JS/CSS except Google Fonts.

---

## 3. Module map (the 8 modules)

Grouped from the twelve ChemActivities. Each module is one HTML file.

| # | Module | Moog CAs | Central manipulable | The discovery |
|---|--------|----------|---------------------|---------------|
| 01 | **Nucleus & Isotopes** | CA1, CA2 | Build-an-atom + isotope abundance mixer | Z fixes identity; mass is a weighted average of isotopes |
| 02 | **Coulomb & Ionization** | CA3 | Two-charge sandbox (vary q, d) | V = kq₁q₂/d governs how tightly an electron is held |
| 03 | **Shell Model & Core Charge** | CA4, CA5 | IE data explorer + shell/core-charge diagram | IE jumps reveal shells; core charge (not full Z) sets the pull |
| 04 | **Atomic Size** | CA6 | Periodic radius explorer | Radius trends fall out of core charge + valence shell |
| 05 | **Light & Energy** | CA7 | Wave sandbox + EM spectrum | c = λf; photon energy E = hf |
| 06 | **Photoelectron Spectroscopy** | CA8, CA9 | PES spectrometer (choose atom, read peaks) | Ne shows **three** peaks where the shell model predicted two → subshells |
| 07 | **Electron Configurations** | CA10, CA11 | PES → written configs (full / short-hand) | Peaks → configuration notation |
| 08 | **Electron Configuration Diagrams, Quantum Numbers, and Spin** | CA11, CA12 | Orbital-box builder (Aufbau / Hund / Pauli); IE-exception payoff | Shell rings can’t place electrons inside a shell → orbital diagrams + spin; Be→B / N→O IE dips |

**Sequencing:** modules are meant to be worked in order; 06→07→08 is the
payoff chain into configurations, diagrams, and spin. The hub should present them as
an ordered path, but must not lock later modules (a student may revisit freely).
`08-electron-spin.html` redirects to `08-electron-diagrams-spin.html`.

---

## 4. Interaction contract (applies to every module)

This is the heart of the redesign. Every module obeys all six:

**A. Opens with framing, never a question.**
One light line on load: what you're looking at and a loose invitation to poke.
> e.g. "This is neon's photoelectron spectrum. Change the atom and watch what
> moves." — never "How many peaks do you see? (a) (b) (c)".

**B. Responds honestly and immediately.**
Every manipulation updates the model in real time with physically faithful
behavior. No fake or decorative responses; if the student drags abundance to
100 % ²⁴Mg, the average mass reads 23.9850 amu exactly.

**C. Stays quiet about the answer.**
Subshell tags (`2s`, `2p`), trend names, and the "aha" labels appear only after
the student's exploration surfaces them (e.g. a peak is only *named* once the
student has separated it; a trend is only *named* once the student has swept
across a period). Nothing announces the conclusion on load.

**D. Carries a designed discovery arc in its content.**
The anomaly does the teaching; the sim guarantees the student meets it. PES is
the archetype: H, He, Li behave and confirm the shell model, building
confidence — then Ne quietly refuses to cooperate with a third peak. Each
module's arc is specified in §5.

**E. Help is optional, sparse, and never blocking.**
A **"Stuck?"** affordance the student summons on demand — **only on steps
where a nudge earns its keep**, not as permanent chrome on every screen. It
opens the inverted plate panel (§7) with **one** Socratic nudge drawn from the
spirit of Moog's CTQs — a hint about *what to try*, never the answer.
> e.g. "Watch what happens to the potential energy as d shrinks toward zero."
Help never quizzes, never gates, and never auto-advances anything. Prefer a
**← Back** control for revisiting prior steps; do not make Stuck? stand in for
navigation.

**F. Ends by naming what it was for.**
Every module closes with a **debrief** (§11) showing the student the learning
intentions they just worked through and the "I can" success criteria for the
curricular competencies they just demonstrated. This is the one place a module
is allowed to be explicit: the sim stays quiet the whole way through (C), and
then the debrief says plainly what the exploration was for. It comes *after*
the work — never on load, and never as a gate. The debrief is the **last
exclusive stage** inside the module file (§11.5): prior acts hide while it is
showing, and each in-sim intention carries an **Explore again** link back into
the section that served it.

**Companion worksheet.** Moog's real CTQs stay on paper. Each module links to a
short worksheet (student's own workbook, or a printable stub referencing the CA
number) so the paper stays the thing that interrogates. The sim is what the
student interrogates *with*.

---

## 5. Module specifications

Each module below gives: its **learning intentions** and **curricular
competencies** (the reason it exists), the manipulable, the plate (SVG+HTML or
Canvas illustration) vs page (typeset chrome) split, the discovery arc, the help
nudges, and the reference data used.

Learning intentions are written in the class's voice — "We will…" — and are what
the student reads back in the debrief (§11). Curricular competencies are the BC
science competencies, written as student-facing "I can…" success criteria and
tagged with the codes in §11.1. Both are quoted **verbatim** from the course's
own planning document, `docs/learning-intentions-and-success-criteria.pdf` —
the teacher's adaptation of the BC curriculum, not the ministry document, and
the authority here where the two differ. They are the assessment wording, so
they are not paraphrased, tightened, or re-voiced per module.

Where an intention or competency demands something the manipulable as specified
cannot do, the shortfall is flagged **[LI gap]** in that module. Those are build
requirements, not optional polish — an unbuilt `[LI gap]` means the module does
not yet meet its own learning intentions.

### 5.0 Curriculum overlaps and how they resolve

Three places where the course's stated intentions collide with this suite's hard
rules or with its module map. Resolved once, here, so no module re-litigates
them.

**Overlap 1 — "Bohr Diagrams" vs. §1 principle 2 ("No Bohr model. Ever.").**
The lesson's intention is *review and critique* — review the diagrams "and some
of the limitations which come with using them" — and its competency is **E:
evaluate the validity and limitations of our current understanding of atoms.**
That is compatible with the no-Bohr rule, because the rule bans Bohr *imagery*,
not Bohr *criticism*. Resolution:

- The suite **never renders** an orbiting electron — not even to debunk one.
- Drawing and critiquing Bohr diagrams stays on **paper**. That is where
  students review the model they arrive with.
- The **E** competency is carried in-app by having students evaluate the **shell
  model they build themselves** in Module 03, then watch it fail in Module 06.
  Module 03's debrief may refer to "the model you came in with"; it may not draw
  it.

**Overlap 2 — "construct a model … in Bohr diagrams" (CA8 success criteria).**
Same resolution, narrower. In-app this is the **shell / energy-level diagram**:
static shells or a subshell energy ladder with electrons as markers. It carries
the identical relationship between energy levels and electron configuration
without the orbits. A student who wants the Bohr-style drawing makes it on the
worksheet.

**Overlap 3 — "Periodic Table Trends" has no home module.**
Its radius and ionization-energy intentions are already covered by Modules 03
and 04. Its **electronegativity** and **electron affinity** intentions are
covered by nothing in the suite, and §8 holds no data for them. Resolution:
grow **Module 04** from a radius explorer into the unit's periodic-trend
explorer (see its `[LI gap]`) rather than adding a ninth module — Module 04
already owns the periodic-table picker and the trend readout, and the trends
lesson is explicitly a synthesis of radius and IE, which is exactly what that
module holds. The trends lesson's **C** competency (define and use *electron
affinity*, *ionization energy*, *electronegativity*) lands in Module 04's
debrief.

### Module 01 — Nucleus & Isotopes (CA1, CA2)

**Covers the lessons** *Atom Basics* and *Isotopes and AAM*.

- **Learning intentions:**
  - We will work independently to recall some of the main concepts of atomic
    theory.
  - We will discuss our current understanding of atomic theory and fill in any
    current gaps.
  - We will learn some of the important language used in science to talk about
    different types of particles.
  - We will discuss "isotopes" and "relative mass".
  - We will draw and discuss the different uses for isotopes. *(on paper)*
  - We will cover the details of isotopes and understand how our knowledge of
    isotopes affects the average atomic mass of each element.
  - We will see how scientific inventions help us understand the world on a
    deeper level.
- **Curricular competencies:**
  - **Q&P** — I will demonstrate a sustained intellectual curiosity by testing
    my current knowledge of atomic theory, and filling in any gaps by asking
    good questions during discussion.
  - **PAI** — Use knowledge of scientific concepts to draw conclusions that are
    consistent with evidence.
- **Manipulable:** (a) a build-an-atom stage — add/remove protons, neutrons,
  electrons as draggable **soft-shaded particle spheres**; the readout shows Z,
  A, net charge, element identity, and whether it's an ion/isotope. (b) An
  **isotope abundance mixer** — for a chosen element, sliders set each isotope's
  natural abundance (%); a live readout computes the weighted-average atomic
  mass. Moog's "average mass of a marble" analogy is rendered as a tray of
  **shaded marbles** whose count reflects abundance.
- **Plate vs page:** particles and marbles are gradient-filled spheres on the
  plate — discrete, soft-shaded, colour-coded by `--proton` / `--neutron` /
  `--electron`. The mass-number line and average-mass readout are typeset on the
  page in mono. No continuous curve here; this module is the most figure-like
  of the eight, and it is the reference implementation for the plate
  conventions in §6.
- **Discovery arc:** changing neutron count changes A but not identity →
  isotopes. Then: one carbon atom is *most likely* 12.0000 amu, yet the
  periodic-table mass isn't a whole number → it's a weighted average. Sweeping
  the abundance sliders lets the student watch the average slide between isotope
  masses and land on the tabulated value only at the real abundances.
- **Quiet-about-answer:** the words "isotope" and "weighted average" are not
  printed until the student has made two atoms of the same Z with different A,
  and has moved the abundance sliders at least once, respectively.
- **Help nudges:** "Two atoms, same element, different mass — what did you
  change?" / "The tray has more of one marble than the other. How should that
  affect the average?"
- **Data:** §8.1 (isotopes), §8.2 (constants).
- **[LI gap]** "Scientific inventions help us understand the world on a deeper
  level" has nothing behind it — the mixer hands the student abundances as
  given, and **the workbook names no instrument at all** for them (CA2 simply
  asserts the abundances; the only instrument named anywhere in the book is the
  photoelectron spectrometer in CA8, and CA4's *electron impact method* for IE).
  So this intention cannot be sourced from Moog. Two ways to serve it, pick one:
  - name the **mass spectrometer** as where abundance numbers come from and
    render the student's mix as a stylised mass spectrum — factually correct and
    the obvious fit, but an addition from outside the source material; or
  - leave the instrument for later and let the intention be met in Module 06,
    where the photoelectron spectrometer *is* the workbook's own answer to "a
    scientific invention that shows us something we couldn't otherwise see".

  Either way it also feeds the **PAI** competency, which needs the abundances to
  be *evidence* rather than a given table.

### Module 02 — Coulomb & Ionization (CA3)

**Covers the lesson** *Coulombic Potential Energy & Ionization Energy* (CA3).

- **Learning intentions:**
  - We will use data to understand the relationships between charge and
    distance of two particles.
  - We will use data to understand the relationship between "ionization energy"
    and "coulombic potential".
  - We will solve problems to further solidify our understanding of the key
    equation.
- **Curricular competencies:**
  - **PAI** — I can analyze how changes in nuclear and electron charge (q₁ and
    q₂) and the distance between them (d) affect the ionization energy by
    applying Coulomb's Law, and use this relationship to estimate relative
    ionization energies across atoms.
- **Manipulable:** two charged particles on a track; sliders/steppers for q₁,
  q₂ (integer charges incl. sign) and separation d. A live **potential-energy
  curve** V(d) plots as the student drags, with the current (q,d) point marked.
  A second panel frames ionization as "pull the electron to d = ∞" and reads off
  the energy required.
- **Plate vs page:** the V(d) curve and the field/force visualization are inked
  on the plate as a hairline graph with mono axis ticks. The two particles are
  soft-shaded spheres; the control panel is typeset chrome.
- **Discovery arc:** same-sign → V > 0 (repulsive, energy rises as d shrinks);
  opposite-sign → V < 0 (bound, energy well). For H (proton + electron), V is
  negative → energy must be *added* to ionize. Increasing nuclear charge or
  decreasing d deepens the well → higher IE. This sets up every later "why is
  IE bigger here?" argument.
- **Quiet-about-answer:** "ionization energy" is named only after the student
  has dragged an opposite-charge pair apart and watched V climb toward zero.
- **Help nudges:** "Make the charges the same sign, then opposite. What flips?"
  / "Slide d toward zero. Which way does V run off?"
- **Data:** §8.2 (Coulomb constant, charges).
- **[LI gap]** "Solve problems" and "estimate relative ionization energies
  **across atoms**" both reach past a free sandbox. Add a third panel of short
  **compare-two-atoms problems**: the student is handed two (q, d) pairs — or
  two real atoms — and works out which holds its electron more tightly, then
  checks against V = kq₁q₂/d. Per §1 non-goals this reveals a model answer to
  compare against; it does not grade.

### Module 03 — Shell Model & Core Charge (CA4, CA5)

**Covers the lessons** *Introducing the Shell Model* (CA4), *Shell Model
Continued* (CA5), and the **E** competency from *Bohr Diagrams* (see overlap 1).

- **Learning intentions:**
  - We will review our previous understandings and conceptions of what "atoms"
    are.
  - We will review the model of the atom we came in with, and some of the
    limitations which come with using it. *(the Bohr diagram itself stays on
    paper — overlap 1)*
  - We will discover what the "first ionization" energy is.
  - We will use data and hypothesis to compare atoms with different
    characteristics and IEs.
  - We will learn about valence vs. inner shell electrons.
  - We will discover the concept of "core charge" using data and diagrams.
  - We will connect the concepts of core charge and ionization energy.
  - We will use data to strengthen our understanding of core charge and
    ionization energy.
- **Curricular competencies:**
  - **Q&P** — I can make informed predictions about the relative first
    ionization energies of two hypothetical atoms by reasoning through how
    atomic structure — such as nuclear charge and electron distance —
    influences the energy required to remove an electron.
  - **Q&P** — I can predict how the number of valence electrons influences the
    ionization energy of an atom, using ideas about electrostatic forces and
    atomic structure.
  - **PC** — I can calculate the core charge of any atom in the first three
    periods of the periodic table using periodic trends and atomic structure.
  - **PAI** — I can analyze how valence electrons and core charge relate to
    each other by identifying patterns across periods and groups in the
    periodic table.
  - **E** — I can evaluate how core charge affects ionization energy by
    connecting changes in nuclear attraction to energy required for electron
    removal, considering atomic size and effective nuclear charge.
  - **E** — I can evaluate the validity and limitations of our current
    understanding of atoms.
- **Manipulable:** (a) an **IE₁ data explorer** — the first-20-elements
  ionization energies plotted across Z; the student clicks elements, orders
  them, and looks for the pattern (the He→Li drop, the Ne→Na drop). (b) A
  **shell / core-charge diagram builder** — place valence vs inner-shell
  electrons; the diagram computes and displays the **core charge** (Z − inner
  electrons) and shows the valence electron sitting outside the core.
- **Plate vs page:** the IE-vs-Z plot and the shell diagram share one plate —
  concentric shell rings as hairline arcs, electrons as small `--electron`
  (mustard) markers on them, the core as a soft shaded cloud carrying its
  core-charge value.
  **No orbital paths.**
- **Discovery arc:** big IE drops (He→Li, Ne→Na) don't match "IE just rises with
  Z" → electrons must live in shells, and a new shell starts farther out (easier
  to remove). Then: within a period IE rises because **core charge** rises while
  the valence shell stays put; the inner electrons *shield*, so it's core charge
  — not full Z — that the valence electron feels.
- **Quiet-about-answer:** "shell" appears only after the student flags the first
  IE discontinuity; "core charge" / "shielding" appears only after they've built
  a Li diagram and seen inner electrons cancel part of Z.
- **Help nudges:** "IE climbs, then suddenly falls at Li. What could make an
  electron *easier* to remove?" / "Count the protons the valence electron
  actually feels through the inner electrons."
- **Data:** §8.3 (IE₁ first 20).
- **[LI gap]** Two competencies need more range than the spec above gives:
  - **PC** says "any atom in the first three periods", so the core-charge
    builder must accept **every** element Z = 1–18, not a curated handful.
  - **Q&P** says "two **hypothetical** atoms", so the builder must also accept
    off-table combinations of nuclear charge and electron count — students have
    to be able to reason about atoms that don't exist.
  - The closing **E** competency is this module's debrief job: the student
    states what the shell model explains well and where they can already feel
    it straining (it says nothing about *why* a shell holds 2 or 8).

### Module 04 — Atomic Size (CA6)

**Covers the lessons** *Atomic Radius* (CA6) and *Periodic Table Trends* (see
overlap 3).

- **Learning intentions:**
  - We will learn about the concept of atomic radius.
  - We will connect core charge to atomic radius.
  - We will learn how adding or removing electrons affects the atomic radius.
  - We will discuss the patterns and trends which exist on the periodic table.
  - We will learn about terms such as affinity, ionization, and
    electronegativity.
  - We will relate the trends to previous learnings such as radius and
    ionization energy.
  - We will see how the trends change as electrons are gained or lost by atoms.
- **Curricular competencies:**
  - **Q&P** — I can compare two atoms and hypothesize which one has a larger
    atomic radius based on their position in the periodic table and their core
    charge.
  - **PAI** — I can analyze how gaining or losing electrons affects the radius
    of an ion by comparing their core charge and electron configuration.
  - **Q&P** — I can make predictions about chemical properties or reactivity
    based on multiple trends, including atomic radius and ionization energy, and
    support those predictions using prior learning.
  - **PAI** — I can identify and explain periodic trends (e.g. atomic radius,
    electronegativity, ionization energy) by analyzing their patterns across
    periods and down groups on the periodic table and justify those patterns
    based on their atomic configuration and associated properties.
  - **C** — I can accurately define and use key terms such as electron
    affinity, ionization energy, and electronegativity when explaining periodic
    trends or comparing elements.
- **Manipulable:** a periodic-trend explorer — pick atoms/ions; the sim draws
  them **to scale** (radius) side by side and tabulates valence shell, core
  charge, and radius. An isoelectronic panel lines up S²⁻, Cl⁻, K⁺, Ca²⁺ (same
  electron count, rising core charge).
- **Plate vs page:** the atoms are drawn as soft radial size disks whose fill
  fades toward the edge (continuous radius is the whole point; a gradient edge
  reads the soft boundary without noise); the periodic-table picker and readout
  are typeset chrome.
- **Discovery arc:** across a period radius shrinks (core charge pulls the same
  shell tighter); down a group radius grows (new outer shell). Isoelectronic
  series: identical electron count, yet radius falls as core charge climbs —
  isolating core charge as the cause.
- **Quiet-about-answer:** trend statements ("radius decreases across a period")
  are never printed; the student reads them off the scaled disks. Only the raw
  radius/core-charge values are shown.
- **Help nudges:** "Same number of electrons across this row — so what's
  different that makes them shrink?"
- **Data:** §8.4 (radii).
- **[LI gap]** This module absorbs *Periodic Table Trends* (overlap 3) and as
  specified cannot serve it. It needs:
  - **ion radii for gain/loss of electrons.** "How adding or removing electrons
    affects the atomic radius" is a listed intention and the second **PAI**
    competency, and §8.4's isoelectronic row doesn't serve it — that row varies
    core charge, not electron count. Use the workbook's neutral/ion **pairs**
    (§8.4: F 64 → F⁻ 133, O 66 → O²⁻ 140). Same atom, same core charge, extra
    electrons, much bigger radius. That's the comparison the competency names.
  - **electronegativity** — Moog Allen values in §8.9 when teaching the AVEE
    bridge (EN ≈ 1.8 × AVEE). When a module needs a broader table Moog does not
    cover, or shows EN as an outside measured scale, use **PubChem Pauling**
    (§8.0) and cite it. Never mix Allen and Pauling in one unlabeled cell.
  - **electron affinity** — no Moog table; use PubChem (§8.0 / §8.13). Show
    MJ/mol, cite on screen, treat blanks as *no stable anion* (never zero).
    Primary home is Module 09.
  - **atomic radius fill-ins** — CA6 only lists a handful of covalent radii
    (§8.4). Module 04 keeps those Moog numbers. When Module 09 (or later) needs
    radius for atoms Moog never tabulated, use PubChem atomic radius (§8.0),
    cite it, and do not overwrite Module 04’s covalent / ionic set.
  - the picker to sweep a whole **period** and a whole **group** in one motion,
    so patterns are read across and down rather than atom by atom (the **PAI**
    competency is about the pattern, not the pair);
  - the terms in the **C** competency defined somewhere the student can reach —
    put the definitions in the debrief (§11), not on load, so the student meets
    the trend before the vocabulary.

### Module 05 — Light & Energy (CA7)

**Covers the lesson** *Light, Waves, Electrons* (CA7).

- **Learning intentions:**
  - We will review the properties of waves and light.
  - We will discover how light and energy are related.
  - We will calculate the amount of energy associated with different light
    sources.
  - We will see how we can measure IE using photons.
- **Curricular competencies:**
  - **Q&P** — Demonstrate curiosity about how light's properties relate to
    energy.
  - **PAI** — Describe relationships between variables, perform calculations.
  - **A&I** — Use multiple strategies to solve applied and conceptual problems.
  - **C** — Construct evidence-based explanations using scientific language.
- **Manipulable:** a wave sandbox — a slider sets wavelength; the wave redraws,
  frequency updates (c = λf), and photon energy updates (E = hf). A position
  marker "X" lets the student count cycles-per-second. An EM-spectrum strip
  maps the current λ to its band (radio→γ).
- **Plate vs page:** the wave is a hairline ink sinusoid and the spectrum a band
  of spot inks stepping through the visible range; the λ control and band readout
  are typeset chrome.
- **Discovery arc:** shorter λ → higher f → more energetic photon. Blue beats
  red. This is the tool that makes "energy of light" concrete before PES uses
  light to eject electrons.
- **Quiet-about-answer:** the relationships (inverse λ–f, direct f–E) aren't
  stated; the student infers them by sweeping λ and watching f and E move.
- **Help nudges:** "Halve the wavelength. What happens to how many cycles pass X
  each second?"
- **Data:** §8.5 (c, h, spectrum bands).
- **[LI gap]** Two intentions outrun the λ sandbox:
  - "**Calculate** the amount of energy associated with different light
    **sources**" wants named real sources — a red laser pointer, a microwave
    oven, a tanning lamp, a dental X-ray — that the student picks and computes
    E for. An abstract wavelength slider is not a light source. This is also
    where **A&I** ("multiple strategies") lives: let the student reach E from λ
    or from f. The workbook's own λ/f/E triplets (§8.5) are the calibration set;
    its red-vs-blue comparison (700 nm vs 400 nm) is the simplest such pair, and
    its microwave band makes the microwave-oven case sourceable.
  - "We will see how we can **measure IE using photons**" is the bridge into
    Module 06. Close this module by firing a chosen photon at an atom and
    showing that it either ejects an electron or doesn't — without yet naming
    IE = E_photon − KE, which is Module 06's discovery.

### Module 06 — Photoelectron Spectroscopy (CA8, CA9) — the centerpiece

**Covers the lesson** *Photoelectron Spectroscopy* (CA8, CA9).

- **Learning intentions:**
  - We will develop an understanding of the relationship between ionization
    energy, energy of a photon, and kinetic energy, using the equation
    IE = E_photon − KE.
  - We will analyze graphs to understand how the electrons in an atom are
    organized.
  - We will begin to see how electrons are organized in an atom based on
    "quantized energy levels".
- **Curricular competencies:**
  - **PAI** — I can analyze and interpret spectral data or ionization energy
    graphs to identify unknown elements by comparing patterns and values.
  - **PAI** — I can construct a model showing the relationship between energy
    levels and electron configuration. *(In-app this is the shell / energy-level
    diagram — overlap 2.)*
  - **C** — I can model and explain, using diagrams or mental images, how
    photons interact with electrons to cause ionization.
- **Manipulable:** a **PES spectrometer**. Student selects an atom (H, He, Li,
  Be, B, C, N, O, F, **Ne**, …); the instrument renders its photoelectron
  spectrum — peaks at each subshell's binding energy, peak **height ∝ number of
  electrons** in that subshell. An axis break keeps the deep 1s peak and the
  shallow valence peaks both legible. A prediction scratch-panel lets the
  student sketch how many peaks they *expect* from the shell model before
  revealing the real spectrum.
- **Plate vs page:** the spectrum is the suite's most demanding plate — Gaussian
  peaks in `--phosphor` over a hairline log-ish energy axis, with mono tick
  values and a paper knockout behind every peak label. Chrome (element tile, HUD,
  controls, help) is typeset.
- **Discovery arc (the signature moment):** H, He, Li, Be behave — peak counts
  match the shell model, confidence builds. Then the student runs **Ne** and
  gets **three peaks, not the two** the shell model predicted (1s at 84.0, and
  the n=2 shell split into 4.68 and 2.08 MJ/mol). The n=2 shell holds two
  different energies → **subshells** (2s below 2p). The anomaly is the lesson;
  the sim's job is to make the student meet it after they've come to trust the
  two-shell prediction.
- **Quiet-about-answer:** peaks are unlabeled at first. The `2s`/`2p` tags
  appear only after the student has run Ne and expanded/inspected the n=2
  region. "Subshell" is not printed until then.
- **Help nudges:** "Predict Ne's peaks from the shell model first — then run
  it." / "The n=2 shell gave you one peak for Li. Why two for Ne?"
- **Data:** §8.6 (PES binding energies by subshell).
- **[LI gap]** The spec above builds the subshell discovery but not the
  *measurement* behind it, and the intentions require both:
  - **IE = E_photon − KE must be visible.** The spectrometer needs a **photon
    energy** control and a **measured KE** readout, so the student sees that the
    instrument measures kinetic energy and *infers* binding energy. Name the
    equation only after they've watched one fixed photon energy produce
    different KE for different peaks (§4C). This is the module's first learning
    intention and currently nothing serves it. The workbook develops it directly
    (CA8 Model 2) and its worked values are in §8.11 — use them as the
    calibration case so the sim and the paper agree to the digit.
  - **Unknown-element identification.** Add an **unknown mode** that renders a
    spectrum with the element hidden, for the student to identify from peak
    positions and heights. That is the first **PAI** competency verbatim, so it
    is not optional — and the workbook already supplies three unknowns (§8.12)
    of escalating difficulty, ending with one whose peaks aren't even labelled.
    Ship those three before inventing any.

### Module 07 — Electron Configurations (CA10, CA11)

**Covers** written electron configurations from PES (full and noble-gas
short-hand). Spin, orbital diagrams, and quantum numbers live in Module 08.

- **Learning intentions:**
  - We will learn about shells, subshells, and orbitals.
  - We will discover how electrons are arranged in specific, quantized places
    within an atom.
  - We will link concepts from previous chem activities to synthesize our
    understandings.
  - We will use PES to hypothesize the electron configuration of atoms.
- **Curricular competencies:**
  - **C** — I can use scientific terminology to explain the structure of an
    atom in terms of shells, subshells, and orbitals as part of electron
    configuration.
  - **PAI** — I can construct and interpret full and short-hand electron
    configurations of atoms.
- **Manipulable:** PES→config path already shipped in
  `07-electron-configurations.html` (Ne spectrum beats, unknowns, table blocks,
  short-hand). Close growth here; new diagram / spin work goes to Module 08.
- **Data:** §8.6 (subshell IE), §8.7 (configurations).

### Module 08 — Electron Configuration Diagrams, Quantum Numbers, and Spin
(CA11, CA12)

**Covers** orbital diagrams, the three filling rules, and spin. Quantum numbers
are in the module title/scope; LI wording ships when the course text is pasted
(no invented intentions).

- **Learning intentions:**
  - We will discuss Hund's rule, the Pauli principle, and the Aufbau principle
    and how "spin" relates to electron configurations.
  - We will use orbital diagrams to explain drops in ionization energy between
    Be and B and between N and O.
  - *(Quantum numbers — deferred until verbatim course wording is supplied.)*
- **Curricular competencies:**
  - **PAI** — I can construct and interpret full, short-hand, and orbital
    diagrams for electron configurations of atoms.
  - **E** — I can critically evaluate the strengths and limitations of previous
    models (like the Bohr diagram and planetary model) and how they can or
    cannot apply PES, Aufbau, Hund's rule, and Pauli exclusion when applied to
    real atomic systems. *(Discussed, never drawn — overlap 1. Opener uses the
    suite shell-model rings only.)*
- **Manipulable / discovery arc:**
  1. **Shell limit** — Ne shell diagram (Module 03 default); rings can’t show
     how n=2 electrons sit after PES split them → need orbital boxes.
  2. **Orbital builder** — drag/keyboard electrons into blank boxes (H–Ne);
     Aufbau / Hund / Pauli enforce snap; rule names stay quiet until the
     student completes **C** or **N**.
  3. **IE exceptions** — period-2 IE₁ strip (MJ/mol); Be→B and N→O dips;
     student draws orbital diagrams, then compares a model answer (2p onset;
     pairing / electron repulsion). Payoff for dips already visible but
     unexplained in Module 03.
- **Help nudges:** “The outer ring holds eight… What can’t a single ring
  show?” / “Try carbon: do the three 2p boxes share before any pairs?” /
  “Compare Be’s filled 2s with B’s first 2p electron — then N’s half-filled
  2p with O’s first pair.”
- **Data:** §8.3 (IE₁), §8.7 (configurations). Magnetism bench / §8.8 and
  d-block anomalies are later passes.
- **File:** `08-electron-diagrams-spin.html`. Legacy `08-electron-spin.html`
  redirects here.

---

## 6. Rendering conventions

Every illustrated viewport is a **printed plate**: a clean vector textbook
figure in spot ink on paper — not a glowing screen, and not a noisy dotted
halftone. Whether the plate is SVG+HTML or Canvas, everything below serves that.

- **Default medium = SVG + HTML.** Build openers, shell/core diagrams,
  particle and marble scenes, orbital box diagrams, structural markers, and
  any figure that benefits from crisp edges or CSS-driven motion as inline
  `<svg>` plus HTML/CSS. Use design tokens for fill/stroke; keep paths
  hairline; layer labels as HTML (or SVG `<text>` in the same three type
  families) so they stay selectable and restylable. No external image assets,
  no icon libraries, no generate-an-image shortcuts — the figure is markup.
- **Canvas exception = continuous quantitative redraw.** Spectra, live
  potential-energy curves, animated waves, and soft radius disks that must
  recompute every frame stay on `<canvas>`, drawn at 2× backing resolution and
  CSS-scaled to fit. Do not reach for Canvas for a static or stepped diagram
  just because earlier modules did.
- **Soft shade, not stipple. Not glow.** Volume comes from smooth radial
  gradients (light → mid → dark) and soft translucent washes — never from
  randomly scattered dots, flecks, or halftone noise on the figure. Do not
  implement `paintStippleSphere`, `drawStippleCloud`, or SVG `<pattern>`
  stipple for particles, marbles, cores, or force fields. Nothing emits light;
  things are *printed*. Prefer a quiet highlight and a hairline rim only when
  the silhouette needs separation from the paper.
- **Ink hierarchy** mirrors the CSS tokens: solid ink for primary rule and
  type, then soft/mid translucencies for secondary structure. Hairlines
  throughout; no thick strokes except the plate border. On Canvas, map these
  to `INK` / `INK_LINE` / `INK_SOFT` / `INK_MID`; in SVG, use the same
  `--ink*` / spot-ink custom properties as `stroke` and `fill`.
- **Type on the plate** uses the same three families as the page — Archivo
  Black for figure headlines, Barlow for annotation, IBM Plex Mono for axis
  ticks and values. Give labels a paper-coloured knockout behind them so fills
  and rules read cleanly underneath. Prefer HTML labels over canvas `fillText`
  when the figure is SVG+HTML.
- **Chrome = HTML + CSS,** typeset rather than drawn: hairline rules, uppercase
  mono micro-labels, no image assets required.
- **One scripted motion moment per module** (the reveal/scan-in). Everything
  else animates only in response to the student's action. Prefer CSS
  transitions/transforms on SVG/HTML for that moment; respect
  `prefers-reduced-motion`.
- **Never** draw an electron traveling along a shell ring. Shells are drawn as
  static rings or as electron-density bands; electrons are markers, not
  orbiting bodies.
- **Default atom diagram.** Whenever a module draws an *atom* (shell structure,
  PES target, configuration story — not a lone particle sphere from Module 01,
  and not Module 04’s soft radius disk), use the Module 03 shell-model figure as
  the suite default: soft-shaded `--proton` nucleus (`#e8b48a` → `#a85a32` →
  `#5a2c16`), hairline concentric shell rings, mustard `--electron` markers on
  the rings (**static** — never orbiting), and when inner-shell electrons are
  present a soft mustard core wash (gradient only — no stipple flecks). Element
  symbol keeps proper capitalization (§1.7). Match `03-shell-core-charge.html` /
  `buildAtomSVG`. Do not invent a new atom look per module.

---

## 7. Visual system (locked design tokens)

Canonical token block (spec copy). Prefer `assets/suite.css` at runtime for
new work. If inlining in a legacy module, keep the block byte-identical to this
— but **do not re-emit it** when editing other code. Direction: **a printed
science textbook** — warm cream paper, olive and rust spot inks, clean technical
plates with soft shaded volume, and heavy typeset headlines. The student is
reading a beautifully printed lab manual whose figures happen to move.

`docs/visual-reference.jpg` is the moodboard this look comes from: a screenprinted
event poster (olive ground, sphere models, scanned figure cards over a thin
node-and-edge network), a record sleeve (flat spot colour, wireframe geometry,
one airbrushed radial orb), and two black tees whose scientific line-art is
built from hairline rule and solid/spot fills. Take the spot-ink restraint and
hairline discipline from the moodboard — **do not** copy its halftone/stipple
dot texture onto module figures. Read it before making visual decisions.

Colour carries physical meaning: **olive = measured data**, **rust = energy and
ionization**, **blue = structure being revealed**, **mustard yellow = the electron**
(and only the electron). Never use highlighter neon green for electrons or
particle markers — that colour is retired.

```css
:root{
  /* base — printed paper, never a screen */
  --paper:#e6e1cf;
  --paper-2:#d8d2bc;
  --paper-3:#c9c2a8;
  --void:#050505;
  --void-2:#0c0c0c;
  --panel:#efe9d4;
  --panel-edge:#1a1810;
  --grid:#cfc8ae;

  /* meaning-bearing spot inks */
  --phosphor:#5c6b28;      /* measured data / spectra / live readouts */
  --ember:#a85a32;         /* energy, ionization, emission */
  --signal:#1a6aa3;        /* structure being revealed (subshells, anomalies) */
  --olive:#7e8c45;
  --olive-deep:#4f5a28;
  --mustard:#c4a35a;       /* the electron — mustard yellow, never neon green */
  --neon:#c4a35a;          /* alias of --mustard / --electron (legacy token name) */

  /* particles */
  --proton:#a85a32;
  --neutron:#7e8c45;
  --electron:#c4a35a;

  /* inverted plate — the black-tee panel */
  --plate:#050505;
  --plate-ink:#e8e6d9;

  /* text */
  --ink:#16140e;
  --ink-soft:#33301f;
  --dim:#55513f;
  --faint:#6f6b59;
  --success:#4f5a28;
  --error:#a85a32;

  /* type */
  --font-display:'Archivo Black',Helvetica,sans-serif;
  --font-body:Barlow,Helvetica,Univers,'Helvetica Neue',sans-serif;
  --font-mono:'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,monospace;

  --label-xs:0.72rem;
  --label-sm:0.78rem;
  --label-md:0.85rem;
  --track-wide:0.13em;
  --track-tight:0.08em;
}
```

- **Type — three roles, no overlap.** `Archivo Black` for headlines only, set
  large with tight negative tracking (`-0.02em`) and sub-1.0 line-height, so a
  task title lands like poster lettering. `Barlow` for all prose. `IBM Plex Mono`
  for every micro-label — kickers, HUD, readouts, buttons, axis ticks — always
  uppercase, letterspaced (`--track-wide`), and with tabular figures on so
  numbers don't jitter as they update. **Exception:** chemical element symbols
  keep proper capitalization (§1 principle 7) — never force them through
  `text-transform: uppercase`. One shared `.mono-label` recipe carries
  the tabular-numeral settings; add new label classes to that selector list
  rather than restating the properties.
- **Texture:** fixed full-page SVG fractal-noise grain at ~14 % opacity,
  `mix-blend-mode:multiply`, `pointer-events:none`. This is the press grain that
  makes the paper read as printed. No scanlines — that was the old screen look.
- **No rounded corners, anywhere.** `border-radius:0` is the house rule.
- **Do not box everything by default.** Most chrome — readouts, controls,
  equations, kickers, helper copy — sits open on the paper with type and spacing
  alone. A hairline rule, filled panel, or enclosed container is earned: use it
  when grouping a real interaction, framing the physics plate, or marking a
  deliberate aside (help, debrief). Prefer a rule above/below or plain
  whitespace over a four-sided box. If removing the border does not hurt
  understanding, leave the box off.
- **Text spans the box.** When prose sits inside a boxed or ruled container
  (reveal steps, panels, asides), the copy runs the full width of that box —
  no `max-width:…ch` or narrow measure that leaves empty space on the right.
  Line length is controlled by the container, not by a second width clamp on
  the paragraph.
- **Student questions are blue and bold.** Any prompt the student is meant to
  answer (on paper or in notes) — not framing, not instructions, not Stuck?
  nudges — uses the shared `.student-q` recipe: `color: var(--signal)` and
  `font-weight: 700`. Apply the class (or the same properties) wherever a
  reflective / write-this-down question appears.
- **Frame:** a `3px solid var(--ink)` rule around the physics viewport — a plate
  border in a printed book. No glow, no shadow, no stepped frame.
- **Inverted plate:** the help panel and similar asides invert to `--plate` /
  `--plate-ink`, the black-tee panel from the moodboard. Use it for a small
  number of deliberate moments, not as a general surface.
- **Anchor bars:** section kickers carry a short heavy rule before the text
  (`::before`, ~1.6rem × 0.28rem, in `--olive-deep`) tying the eyebrow to the
  headline under it.
- **Restraint:** spend boldness on the illustrated plate and the headline. Keep
  everything else hairline and quiet. If a module feels busy, remove one thing.

> `01-nucleus-isotopes.html` is the reference for plate/illustration decisions
> (§6) and for how a shipped module *feels*. Open it when inventing a figure —
> not as a file to clone. Shared chrome lives in `assets/` (§2.2).

### 7.1 Suite status

Every shipped page (`index.html`, modules 01–10) uses the §7 token block and the
paper / Archivo Black / Barlow / IBM Plex Mono stack. Illustrated plates —
SVG+HTML or Canvas — are clean ink and soft shade: no stipple, no glow, no CRT
look, no alternate theme. Electrons and electron markers use mustard
(`--electron` / `--mustard`, `#c4a35a`), never highlighter green. New or rebuilt
figures default to SVG + HTML (§2, §6); existing Canvas hot-redraw viewports may
stay until touched. Match the visual system (§6–7) via `assets/suite.css` or an
existing `:root` — do not re-paste tokens or rewrite a module “to match 01”
when chrome already complies.

---

## 8. Reference data (factual — Moog 5th ed. measured values)

Embed as JS objects in the modules that need them. These are measurements and
constants (facts), used as ground truth.

### 8.0 Source priority

1. **Moog first** when the workbook prints a value (isotopes, IE, PES, CA6
   covalent radii, Allen EN, AVEE, photon/KE worked examples). Those keep the
   sim and the paper agreeing digit-for-digit.
2. **PubChem when Moog is silent or incomplete** — the standing fill-in sources
   for this suite:
   - Atomic radius — <https://pubchem.ncbi.nlm.nih.gov/ptable/atomic-radius/>
   - Electron affinity — <https://pubchem.ncbi.nlm.nih.gov/ptable/electron-affinity/>
   - Electronegativity — <https://pubchem.ncbi.nlm.nih.gov/ptable/electronegativity/>
3. Cite PubChem in-app wherever those numbers appear. Offline embed:
   `assets/pubchem-data.js` (`SuitePubChem.PUBCHEM`, Z = 1–54) and the audit
   dump `docs/pubchem-ptable-z1-54.json` (same REST table as the ptable pages).

**Do not mix scales in one readout without labeling.** PubChem atomic radius ≠
Moog CA6 covalent radius (e.g. C is 170 pm on PubChem vs 77 pm covalent in
CA6). PubChem EN is Pauling (H = 2.2; noble gases often blank); Moog CA22 EN is
Allen / configuration-energy (H = 2.30; He/Ne assigned). EA has no Moog table —
§8.13 is PubChem only. Module 04’s CA6 comparisons stay on Moog covalent /
ionic radii; Module 09 (and any later plate that needs a complete H–Ar radius
or EN set Moog does not supply) uses PubChem and cites it.

Everything below is transcribed from the workbook **except §8.13 (EA) and the
PubChem fill-ins in §8.0 / `assets/pubchem-data.js`**. Sections carrying known
source inconsistencies or inferred values (§8.6, §8.12) say so inline — read
those notes before treating a number as settled.

### 8.1 Isotopes — natural abundance & atomic mass
| Isotope | Abundance (%) | Mass (amu) |
|---|---|---|
| ¹H | 99.985 | 1.0078 |
| ²H | 0.015 | 2.0140 |
| ¹²C | 98.89 | 12.0000 |
| ¹³C | 1.11 | 13.0034 |
| ³⁵Cl | 75.77 | 34.9689 |
| ³⁷Cl | 24.23 | 36.9659 |
| ²⁴Mg | 78.99 | 23.9850 |
| ²⁵Mg | 10.00 | 24.9858 |
| ²⁶Mg | 11.01 | 25.9826 |

### 8.2 Constants
- 1 amu = 1.6606 × 10⁻²⁴ g
- Sub-particle masses (amu): proton 1.0073, neutron 1.0087, electron 5.486 × 10⁻⁴
- Coulomb: V = k·q₁·q₂ / d (use consistent units; charges as integer multiples
  of e for the sandbox)
- Speed of light c = 3.00 × 10⁸ m/s; Planck h = 6.626 × 10⁻³⁴ J·s; E = hf; 1 nm = 10⁻⁹ m

### 8.3 First ionization energy, first 20 elements (MJ/mol)
H 1.31 · He 2.37 · Li 0.52 · Be 0.90 · B 0.80 · C 1.09 · N 1.40 · O 1.31 ·
F 1.68 · Ne 2.08 · Na 0.50 · Mg 0.74 · Al 0.58 · Si 0.79 · P 1.01 · S 1.00 ·
Cl 1.25 · Ar 1.52 · K 0.42 · Ca 0.59

### 8.4 Atomic & ionic radii (pm)

CA6. These are **covalent** radii, as the workbook labels them.

- Atoms (CA6 Table 1, with shell and core charge): B (n=2, +3) 89 · C (n=2, +4)
  77 · O (n=2, +6) 66 · S (n=3, +6) 104 · As (n=4, +5) 121 · Se (n=4, +6) 117
- Isoelectronic ions, 18 e⁻ (CA6 Table 2) — core charge rises, radius falls:
  S²⁻ 184 (core +6) · Cl⁻ 181 (+7) · K⁺ 133 (+9) · Ca²⁺ 104 (+10)
- Neutral/ion **pairs** (CA6 Table 3) — same core charge, more electrons:
  F 64 (+7, 7 e⁻) → F⁻ 133 (+7, 8 e⁻) · O 66 (+6, 6 e⁻) → O²⁻ 140 (+6, 8 e⁻).
  This is the set Module 04's "adding or removing electrons" intention needs.
- Ionic radii used later for the ionic bond (CA24): Na⁺ 102 · F⁻ 133 · Cl⁻ 181 ·
  Mg²⁺ 72 · O²⁻ 140

> **Known inconsistency in the source:** O is 66 pm in both Table 1 and Table 3,
> but F appears only in Table 3 (64 pm) — there is no Table 1 value for F to
> check it against. Use 64.

### 8.5 Light: wavelength, frequency, energy (CA7)

Calibration triplets (CA7 Table 1) — the set that yields h and c:

| λ | f (s⁻¹) | E (J) |
|---|---|---|
| 333.1 nm | 9.000 × 10¹⁴ | 5.963 × 10⁻¹⁹ |
| 499.7 nm | 6.000 × 10¹⁴ | 3.976 × 10⁻¹⁹ |
| 999.3 nm | 3.000 × 10¹⁴ | 1.988 × 10⁻¹⁹ |

Spectrum bands (CA7 Table 2): radiowave 3 km–30 cm · microwave 30 cm–1 mm ·
IR 1 mm–800 nm · VIS 800–400 nm · UV 400–10 nm · X-ray 10–0.1 nm · γ < 0.1 nm

Comparisons the workbook uses: red ≈ 700 nm vs blue ≈ 400 nm (CA7 Ex. 3); a
500 nm photon against Na's first IE of 0.50 MJ/mol (CA7 Prob. 1).

### 8.6 Subshell ionization energies (MJ/mol) — PES peak positions
Peak **height ∝ electron count** in that subshell.

| El | 1s | 2s | 2p | 3s | 3p | 3d | 4s |
|----|----|----|----|----|----|----|----|
| H | 1.31 | | | | | | |
| He | 2.37 | | | | | | |
| Li | 6.26 | 0.52 | | | | | |
| Be | 11.5 | 0.90 | | | | | |
| B | 19.3 | 1.36 | 0.80 | | | | |
| C | 28.6 | 1.72 | 1.09 | | | | |
| N | 39.6 | 2.45 | 1.40 | | | | |
| O | 52.6 | 3.04 | 1.31 | | | | |
| F | 67.2 | 3.88 | 1.68 | | | | |
| Ne | 84.0 | 4.68 | 2.08 | | | | |
| Na | 104 | 6.84 | 3.67 | 0.50 | | | |
| Mg | 126 | 9.07 | 5.31 | 0.74 | | | |
| Al | 151 | 12.1 | 7.19 | 1.09 | 0.58 | | |
| Si | 178 | 15.1 | 10.3 | 1.46 | 0.79 | | |
| P | 208 | 18.7 | 13.5 | 1.95 | 1.06 | | |
| S | 239 | 22.7 | 16.5 | 2.05 | 1.00 | | |
| Cl | 273 | 26.8 | 20.2 | 2.44 | 1.25 | | |
| Ar | 309 | 31.5 | 24.1 | 2.82 | 1.52 | | |
| K | 347 | 37.1 | 29.1 | 3.93 | 2.38 | | 0.42 |
| Ca | 390 | 42.7 | 34.0 | 4.65 | 2.90 | | 0.59 |
| Sc | 433 | 48.5 | 39.2 | 5.44 | 3.24 | 0.77 | 0.63 |

> **Two known inconsistencies in the source.** Phosphorus is **1.01** MJ/mol in
> the first-IE table (§8.3, CA4) but **1.06** in this subshell table (CA10/CA20).
> Argon's 3s is **2.82** here but **−2.83** in the CA9 energy-level diagram.
> Both discrepancies are printed in the workbook. Pick one value per quantity
> and use it across all nine files, or Modules 03 and 07 will disagree with each
> other on screen.

### 8.7 Ground-state configurations (sample set)
H 1s¹ · He 1s² · Be 1s²2s² · C 1s²2s²2p² · Ne 1s²2s²2p⁶ · Mg 1s²2s²2p⁶3s²
(extend from §8.6 as needed)

### 8.8 Magnetic moments
| El | Behavior | Moment | Unpaired e⁻ |
|----|----------|--------|-------------|
| H | Paramagnetic | 1.7 | 1 |
| He | Diamagnetic | 0 | 0 |
| B | Paramagnetic | 1.7 | 1 |
| C | Paramagnetic | 2.8 | 2 |
| N | Paramagnetic | 3.9 | 3 |
| O | Paramagnetic | 2.8 | 2 |
| Ne | Diamagnetic | 0 | 0 |

### 8.9 Electronegativity (CA22 Table 1)

**Dimensionless — no units.** These are *not* Pauling values: the workbook uses
the Allen (configuration-energy) scale, derived from AVEE (§8.10), which is why
it can assign He 4.16 and Ne 4.79 at all — Pauling assigns the noble gases
nothing. Don't cross-check these against a Pauling table; they won't match, and
the whole point of this scale here is that it falls out of ionization energies
the students have already measured. Needed by Module 04 per overlap 3; note it
comes from CA22, far outside the atomic-structure unit.

| | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| H 2.30 | | | | | | | | He 4.16 |
| Li 0.91 | Be 1.58 | B 2.05 | C 2.54 | N 3.07 | O 3.61 | F 4.19 | | Ne 4.79 |
| Na 0.87 | Mg 1.29 | Al 1.61 | Si 1.92 | P 2.25 | S 2.59 | Cl 2.87 | | Ar 3.24 |
| K 0.73 | Ca 1.03 | Sc 1.2 | Ga 1.76 | Ge 1.99 | As 2.21 | Se 2.42 | Br 2.69 | Kr 2.97 |
| Rb 0.71 | Sr 0.96 | Y 1.0 | In 1.66 | Sn 1.82 | Sb 1.98 | Te 2.16 | I 2.36 | Xe 2.58 |

Sc (1.2) and Y (1.0) carry one decimal in the original; leave them as printed.

> **No electron-affinity data exists in the source.** The term appears nowhere
> in the workbook, so it comes from outside it — see §8.13.

### 8.10 Average valence electron energy — AVEE (CA20 Table 2)

MJ/mol. The workbook's own bridge from ionization energy to electronegativity:
**EN ≈ 1.8 × AVEE** (CA22 Table 2 — H 1.31→2.36 vs EN 2.30; F 2.30→4.14 vs 4.19;
Cl 1.59→2.86 vs 2.87; Br 1.53→2.75 vs 2.69; I 1.35→2.43 vs 2.36).

| | | | | | | | | |
|---|---|---|---|---|---|---|---|---|
| H 1.31 | | | | | | | | He 2.37 |
| Li 0.52 | Be 0.90 | B 1.17 | C 1.41 | N 1.82 | O 1.89 | F 2.30 | | Ne 2.73 |
| Na 0.50 | Mg 0.74 | Al 0.92 | Si 1.13 | P 1.42 | S 1.35 | Cl 1.59 | | Ar 1.85 |
| K 0.42 | Ca 0.59 | Sc 0.68 | Ga 1.00 | Ge 1.07 | As 1.26 | Se ≈1.3 | Br 1.53 | |
| Rb 0.40 | Sr 0.55 | Y 0.57 | In 0.94 | Sn 1.04 | Sb 1.13 | Te ≈1.2 | I 1.35 | |

The `≈` on Se and Te is in the original. Metal/nonmetal cutoffs the workbook
states: metals below 1.06, nonmetals above 1.26, metalloids between (the
staircase elements average ≈1.16).

### 8.11 Photon / kinetic energy (CA8 Model 2)

The workbook gives both forms: **E_photon = IE + KE**, i.e. **IE = E_photon − KE**,
with "the kinetic energy of the electrons is measured in a photoelectron
spectrometer." Worked values, all MJ/mol:

| Case | E_photon | KE | IE |
|---|---|---|---|
| CA8 Fig. 1 (hypothetical atom) | 143.4 | 114.8 | **28.6** |
| CA8 Ex. 1 | 165.7 | 25.4 | *(student derives)* |

Energy-level diagrams are given as **negative** energies (CA9 Model 2): He
−2.37; Ne −84.0, −4.68, −2.08; Ar −309, −31.5, −24.1, −2.83, −1.52. Hypothetical
practice levels: −0.52 / −6.26, and −0.85 / −4.25 (holding 2 and 3 electrons).

### 8.12 Unknown-element spectra (for Module 06's unknown mode)

Three, in the workbook's own order of difficulty. **The workbook never states
the answers**; the identities below are read off §8.6.

| Source | Peaks (MJ/mol) | Identity |
|---|---|---|
| CA8 Model 4 | 2.37 | He (one peak; deliberately ambiguous with H until peak *height* is used) |
| CA9 Ex. 4 | 126 · 9.07 · 5.31 · 0.74 | Mg |
| CA11 Ex. 1 | **unlabelled axis**, 1s omitted, 7 peaks with heights 2 : 6 : 2 : 6 : 10 : 2 : 6 | Kr (36 e⁻ with the omitted 1s²) |

CA11 Ex. 1 is the hardest and the best: the student gets no numbers at all and
must work from peak *heights* and spacing. Its axis ticks are 200/160, 30/10,
3/1 across three broken segments. Reproduce it as an unlabelled spectrum.

> The Kr identification is inferred from the drawn peak heights, not printed in
> the workbook. Confirm against the teacher's key before shipping it as an
> answer.

### 8.13 Electron affinity — **not from Moog**

Required by the trends **C** competency and the "affinity" intention (Module
09 primary; Module 04 may still reference). Same PubChem fill-in rule as §8.0
— radius and Pauling EN also live there when Moog is incomplete.

**Source:** PubChem periodic table, electron affinity
(<https://pubchem.ncbi.nlm.nih.gov/ptable/electron-affinity/>). Cite it in-app
wherever these numbers appear — unlike Moog-sourced quantities, these are
values the students did not measure their way to.

The source publishes **eV**. The MJ/mol column is converted here
(× 96.485 / 1000) so the number can sit beside the ionization energies students
have been reading all unit — **show MJ/mol in-app** and keep eV as the audit
trail back to the source.

| El | EA (eV) | EA (MJ/mol) |
|----|---------|-------------|
| H | 0.754 | 0.073 |
| He | — | — |
| Li | 0.618 | 0.060 |
| Be | — | — |
| B | 0.277 | 0.027 |
| C | 1.263 | 0.122 |
| N | — | — |
| O | 1.461 | 0.141 |
| F | 3.339 | 0.322 |
| Ne | — | — |
| Na | 0.548 | 0.053 |
| Mg | — | — |
| Al | 0.441 | 0.043 |
| Si | 1.385 | 0.134 |
| P | 0.746 | 0.072 |
| S | 2.077 | 0.200 |
| Cl | 3.617 | 0.349 |
| Ar | — | — |
| K | 0.501 | 0.048 |
| Ca | — | — |
| Sc | 0.188 | 0.018 |
| Ga | 0.300 | 0.029 |
| Ge | 1.35 | 0.130 |
| As | 0.81 | 0.078 |
| Se | 2.021 | 0.195 |
| Br | 3.365 | 0.325 |
| Kr | — | — |
| Rb | 0.468 | 0.045 |
| Sr | — | — |
| Y | 0.307 | 0.030 |
| In | 0.300 | 0.029 |
| Sn | 1.20 | 0.116 |
| Sb | 1.07 | 0.103 |
| Te | 1.971 | 0.190 |
| I | 3.059 | 0.295 |
| Xe | — | — |

**The dashes are the best thing in this table — do not fill them in, and do not
render them as zero.** He, Be, N, Ne, Mg, Ar, Ca, Kr, Sr and Xe have no value
because those atoms don't bind an extra electron into a stable anion: full
shells (He, Ne, Ar, Kr, Xe), full s subshells (Be, Mg, Ca, Sr), and a half-full
p subshell (N). That list *is* the shell-and-subshell structure the whole unit
builds, turning up again in a completely independent measurement. A student who
has come through Modules 06–08 can predict which cells are blank before seeing
them, which makes this the strongest available payoff for Module 04's **Q&P**
competency ("predictions about chemical properties or reactivity based on
multiple trends"). Draw the blanks as a distinct empty state — *no stable
anion* — never as a missing-data gap.

Two cautions for Module 04. EA runs an order of magnitude below the ionization
energies in §8.3 and §8.6, so a shared axis will flatten it — scale the trends
independently. And keep EA visually distinct from §8.9's electronegativity,
which sits beside it in the readout: EA is a measured energy with units, EN is a
dimensionless scale.

---

## 9. Repo structure & build

```
/index.html                 hub — ordered path to the modules, visited state
/01-nucleus-isotopes.html   … /05-light-energy.html   shipped (inline chrome OK)
/06-photoelectron-spectroscopy.html · /07-electron-configurations.html
/08-electron-diagrams-spin.html · /09-… · /10-summary.html
  (legacy /08-electron-spin.html redirects to 08-electron-diagrams-spin.html)
/assets/
  suite.css                 §7 tokens + shared chrome CSS (§2.2)
  suite-chrome.js           briefing / debrief / Stuck? helpers (§2.2)
/docs/                      reference material — not deployed, not linked
  learning-intentions-and-success-criteria.pdf   source for §5 and §11
  visual-reference.jpg                           the moodboard behind §7
/README.md
```

Modules 01–05 are the shipped look-and-feel reference. For plate/illustration
questions, open `01-nucleus-isotopes.html` (or the nearest finished peer) —
do not clone the whole file. For tokens and chrome on new work, use `assets/`.

- No build step. Netlify publish dir = repo root, no build command.
- Each module is independently openable and deployable (with its `assets/`
  siblings when linked).
- Progress/visited state (hub only) may use `localStorage`; never required for a
  module to function, and never a score.

---

## 10. Guardrails checklist (review every module against this)

- [ ] **Surgical edit:** change only what the task needs — no full-file rewrite
      “for consistency” (§2.1–2.3).
- [ ] No Bohr orbits / no electron traveling on a ring, anywhere.
- [ ] Opens with a framing line, not a question.
- [ ] Responds to manipulation immediately and physically faithfully.
- [ ] Stays quiet: labels/trends/names emerge only through exploration.
- [ ] Carries its designed discovery arc (the anomaly the student must meet).
- [ ] Help is one optional, non-blocking Socratic nudge — never a gate or quiz.
- [ ] Nothing gated behind a correct answer, no score, no auto-graded prose.
- [ ] Plate graphics use SVG + HTML by default; Canvas only for continuous
      live redraws; soft shade / no stipple either way; chrome typeset (CSS).
- [ ] Design tokens match §7 (via `assets/suite.css` or an existing `:root`).
      Do not re-paste tokens on unrelated edits.
- [ ] Electrons / electron markers use mustard `#c4a35a` (`--electron`), never
      highlighter green.
- [ ] Atom diagrams use the Module 03 shell-model default (§6) — soft-shaded
      nucleus, hairline shells, static mustard markers — not a one-off look.
- [ ] Paper ground, hairline rules, `border-radius:0`, grain overlay present.
- [ ] Chrome is not boxed by default — enclosed containers only where they earn
      their keep (§7).
- [ ] Archivo Black headlines only; mono micro-labels uppercase with tabular
      figures; no third display face.
- [ ] Element symbols always use proper capitalization (Li, Be, Fe — never
      LI, BE, FE), including inside otherwise-uppercase mono labels.
- [ ] Reference data matches §8 exactly.
- [ ] Moog's CTQ/activity wording is **not** reproduced in-app; the paper
      workbook is the companion that interrogates.
- [ ] Quality floor met (responsive, keyboard focus, reduced-motion, offline).
- [ ] Every learning intention listed in §5 has a manipulable behind it — none
      is served by text alone — and the module's `[LI gap]` items are built.
- [ ] Module ends with the debrief (§11): learning intentions, then competency
      success criteria, revealed only after the work — as an **exclusive last
      stage** inside the same HTML file (§11.5), not a strip under the sandbox.
- [ ] Every in-sim learning intention in `DEBRIEF` carries `target` + `revisit`
      pointing at a stable act/section id; paper / discussion / later intentions
      keep `note` only (no Explore-again link). New acts and Module 07 / 10
      rebuilds wire these when the section ships (§11.5).
- [ ] Debrief wording matches §5 for that module **verbatim**. Competencies are
      assessed against these exact words; they don't get paraphrased in-app.
- [ ] Debrief is unreachable before completion, is not a score, and does not
      gate the sandbox — Explore again / “What this was for →” let the student
      leave and return.

---

## 11. Module debrief — learning intentions & competencies

Required in every module by §4F. This is the unit's assessment surface: where a
student sees what the lesson was for and what they can now claim to be able to
do. It is also the only place a module speaks plainly, which is exactly why it
comes last.

### 11.1 Competency codes

The BC science curricular competencies as this course uses them. The debrief
shows the **full name**, not the bare code — the codes are shorthand for the
teacher's planning, not for students. The wording each module actually uses is
in the course's planning document (see §5).

| Code | Competency |
|------|------------|
| **Q&P** | Questioning and predicting |
| **PC** | Planning and conducting |
| **PAI** | Processing and analyzing data and information |
| **E** | Evaluating |
| **A&I** | Applying and innovating |
| **C** | Communicating |

### 11.2 What it contains

Two blocks, in this order:

1. **Learning intentions** — the lesson's "We will…" statements, verbatim from
   §5. *Every* intention for the lesson is listed, including the ones the paper
   handles; those carry a quiet **on paper** tag so the student can see where
   the rest of the lesson lives. Intentions the module itself delivered are
   marked as met.
2. **Curricular competencies** — the "I can…" success criteria, verbatim from
   §5, each labelled with its full competency name. These exist for the student
   to self-assess against. The app does not judge them.

Where a module's `[LI gap]` calls for vocabulary to be defined after the fact
(Module 04's *electronegativity* / *electron affinity* / *ionization energy*),
the definitions belong in the debrief — the trend is met first, the word for it
second.

### 11.3 Rules

- **After the work, never on load.** The debrief appears when the student
  reaches the end of the module, and must not be visible or reachable before
  then. It names, in plain language, the very things the module spent its whole
  length staying quiet about (§4C) — surfacing it early would give away every
  discovery in the module.
- **Exclusive last stage.** On completion, hide the prior acts / chrome inside
  `#moduleStage` and show only `#debrief` (same HTML file — never a separate
  `*-debrief.html`). Leaving via Explore again restores the tagged section in
  free/revisit mode; a **What this was for →** control (or Finish on the last
  act) brings the debrief stage back. See §11.5.
- **Verbatim from §5.** No rewriting, shortening, or re-voicing per module. The
  same words appear in this spec, in the app, and in the gradebook. The only
  permitted edits are obvious typo fixes ("Hunds rule" → "Hund's rule", "Pauli
  principal" → "Pauli principle") and the two Bohr rewordings that §5.0 resolves
  — both are already applied in §5, so modules copy §5 exactly and change
  nothing further. Two narrow
  exceptions: obvious **typos** are silently corrected ("Hunds rule, Pauli
  principal" → "Hund's rule, the Pauli principle"), and the **Bohr-diagram
  phrasings** are re-pointed per overlap 1 and 2. Everything else — including
  the planning document's inconsistent mix of "I can…", "I will…", and bare
  imperatives in the competency statements — is left exactly as written, because
  that is the wording being assessed against. The debrief's own framing must
  therefore not promise "I can" statements.
- **Not a score.** No percentage, no tally, no "3 of 4 competencies achieved".
  Intentions carry a tick because the student did the work that module — that's
  a record, not a grade. The competency statements carry **no** mark at all:
  judging those is the student's job and the teacher's, never the app's.
- **Never a gate.** The debrief doesn't block the sandbox or free play. A
  student can reach it, read it, and go back to poking (Explore again).
- **Reachable again.** Once revealed it stays available for the rest of the
  session, so a student can get back to it. It does not persist as a score.
- **Printable.** Plain semantic markup, no canvas, sensible print colours — the
  student should be able to screenshot or print it straight onto their
  worksheet.
- **Quiet visually.** Chrome, not spectacle (§7 restraint). Blue `--signal` for
  competency labels — this is structure being made explicit. Explore-again
  links use `.debrief-revisit` (mono, `--signal`); do not invent a second
  link style.

### 11.4 Canonical implementation

One `<section class="debrief">` as the **last child of `#moduleStage`**, hidden
until the module completes, plus a per-module data object. Briefing uses the
same `DEBRIEF` data up front (intentions without Explore-again links). Markup
shape is identical across modules; helpers may be inlined (01–05) or loaded
from `assets/suite-chrome.js` (preferred for 06+).

```html
<section class="briefing" id="briefing" aria-labelledby="briefingTitle">
  <!-- … kickers, lead, columns … -->
  <ul class="briefing-li" id="briefingIntentions"></ul>
  <ul class="briefing-cc" id="briefingCompetencies"></ul>
  <button type="button" class="btn submit" id="briefingNext">Next → Start simulation</button>
</section>

<div id="moduleStage" hidden>
  <!-- manipulable acts / panels with stable ids -->
  <section class="debrief" id="debrief" hidden aria-labelledby="debriefTitle">
    <h2 id="debriefTitle">What this was for</h2>
    <p class="debrief-lead">…</p>

    <div class="debrief-block">
      <div class="debrief-kicker">Learning intentions</div>
      <ul class="debrief-li" id="debriefIntentions"></ul>
    </div>

    <div class="debrief-block cc">
      <div class="debrief-kicker">Curricular competencies</div>
      <ul class="debrief-cc" id="debriefCompetencies"></ul>
    </div>
  </section>
</div>
```

```js
const DEBRIEF = {
  intentions: [
    // In-sim: stable section tag + short UI label (shown as Explore again → …)
    { text: 'We will …',
      target: 'act:1',           // or actLi / tier:3 / playground / …
      revisit: 'Wave sandbox' },
    // Elsewhere: note only — no Explore-again link
    { text: 'We will …', note: 'on paper' }
  ],
  competencies: [
    { code: 'PAI',
      name: 'Processing and analyzing data and information',
      text: 'I can …' }
  ]
};

// Shared helpers (assets/suite-chrome.js) — or the same functions inlined:
SuiteChrome.renderBriefing(DEBRIEF);
SuiteChrome.wireStuckHelp();
// on completion — exclusive stage + revisit handler:
SuiteChrome.revealDebrief(DEBRIEF, {
  exclusive: true,
  onRevisit: function (target) {
    SuiteChrome.leaveDebriefStage();
    // jump to the tagged act / tier / panel for this module
  }
});
```

Shipped modules use **`note: 'on paper'`** / `'in discussion'` / `'later'` /
`'revisited'` (not `paper: true`). Keep that shape. Competency columns use
`.debrief-block.cc` / `.briefing-block.cc` so the left rule turns `--signal`.

`revealDebrief(debrief, { exclusive, onRevisit })` renders both lists from
`DEBRIEF` (with Explore-again buttons on the debrief list only), enters the
exclusive stage via `enterDebriefStage()`, and scrolls `#debrief` into view. It
is idempotent, and it is called from the module's completion path — Module 01
calls it from `showCompletion()`. A module with no completion state yet calls
it from wherever its final discovery gate fires. Prefer
`assets/suite-chrome.js` for new / rebuilt modules; keep inlined copies in
01–05 in sync when those modules are already being touched.

### 11.5 Intention → section maps (required on every build / rebuild)

Whenever a module gains or changes navigable sections, **also** wire the
debrief map. Do not ship a new act without a stable id and at least one
intention `target` that points at it (or an explicit `note` if the intention
stays on paper).

**Authoring rules**

1. Give every navigable act / tier / panel a **stable id or key** (`#actLi`,
   `act:2`, `tier:3`, `playground`, …). Prefer ids that survive copy edits.
2. For each §5 learning intention the **sim** delivers, set on that
   `DEBRIEF.intentions` entry:
   - `target` — the section key/id the jump opens
   - `revisit` — short UI label only (e.g. `Lithium diagrams`, `Avg Mass`).
     Rendered as `Explore again → {revisit}`. Do not put the raw tag in the
     student-facing string.
3. Intentions with `note: 'on paper' | 'in discussion' | 'later'` get **no**
   `target` / `revisit`. Scaffold acts with no section yet (e.g. quantum
   numbers in Module 08) likewise omit links until sections exist.
4. Mapping is **curated**, not automatic — one intention may share a target
   with others; one act may serve several intentions. Pick the primary
   section the student should reopen.
5. Briefing lists intentions **without** Explore-again links. Links appear
   only on the debrief stage (after the work), so quiet-about-answer (§4C)
   is preserved.
6. Revisit lands in **free / sandbox mode** where the module has one — do not
   re-lock discovery gates. Offer a way back to the debrief stage.

**Required when completing unfinished work**

| Work | What to do |
|------|------------|
| **Module 06** remaining acts (Ne spectrometer, unknowns, …) | Add stable act ids; extend `DEBRIEF.intentions` with `target` / `revisit` for any new in-sim intention coverage; keep exclusive-stage reveal. |
| **Module 07** | Closed for growth — titles and DEBRIEF match §5 (written configs only). |
| **Module 08** (diagrams / spin) | Map every shipped in-sim §5 intention to `target` / `revisit`. Quantum-number LI waits on course wording. |
| **Module 09 / 10** further acts or polish | Same map discipline; Module 10 already maps Act 1 (instruments) and Act 2 (what survived) — keep those in sync if acts change. |
| **Any new module or hub summary page** | Ship briefing → stage → exclusive debrief with a full intention→section table in `DEBRIEF` on day one. |

Reference implementations: Module **09** (SuiteChrome) and Module **03**
(inlined helpers + multi-act jump). Match those patterns; do not invent a
third debrief API.