# AGENTS.md — Rate Laws sim (build conventions)

> **Read `DESIGN.md` for WHAT to build and WHY.** This file is HOW to build it: stack, structure,
> visual rules, and **copy length**. These are conformance rules — follow them so the sim sits
> natively in the DiPietro Science Sims stream and doesn't read as generic AI output *or* as a
> Unit 1b clone with telegram body copy.

---

## Naming — Part A / Part B (student-facing)

In all **student-facing** copy (hub labels, topbar meta, framing, feedback, Stuck? help,
summaries, lock tags), call the two branches **Part A** and **Part B** — never “Path A” /
“Path B.”

| Part | Method |
|---|---|
| **Part A** | Method of Initial Rates (tabular) |
| **Part B** | Graphing Rates / Integration (visual) |

Internal code, file names (`path-a.html`, `path-a.js`), and DESIGN.md may still say “path” —
that is build vocabulary. Do not leak “Path” into the UI.

## Resume queue (Part A)

When picking Part A back up, **rework `FIG. 07 · DRAG TO CANCEL` (k-units) first.** The current
drag-M-onto-M chip fraction is not good — needs a clearer, more visual structure. Pedagogy stays
the same (overall order sets units; leftover denominator M → M⁻¹; no numerical k). See DESIGN.md
§8 remaining TODOs.

---

## Stack — hard rules

- **Vanilla HTML / CSS / JS only.** No framework (no React/Vue/Svelte), no build step, no bundler,
  no TypeScript compile. A browser opens the file and it runs.
- **No plotting library.** All graphs, axes, curves, and animations are **hand-rolled** in SVG
  and/or `<canvas>` with `requestAnimationFrame`. (This matches the existing sims and is required
  for the custom draw-in animations — a charting lib brings its own look to fight and can't do the
  reveal motion.) Do NOT add Chart.js, Plotly, D3, etc.
- **One external dependency is allowed: Google Fonts.** Specifically the three the stream already
  uses:
  - `Archivo Black` — display / headings
  - `Barlow` — body
  - `IBM Plex Mono` — micro-labels, kickers, numeric readouts, data tables
  No other external scripts, styles, CDNs, or trackers.
- **No `localStorage` ban here** — this is Netlify-hosted, not a sandboxed artifact. Use
  `localStorage` for the completion/unlock state (see DESIGN.md §1). Wrap access in try/catch and
  degrade gracefully if it's unavailable.

## Structure

- This sim is a **suite** (a hub + two parts), so follow the existing **suite pattern**, not the
  single-file-per-sim pattern:
  - Shared chrome and styles in `assets/` (mirroring how the existing suite sim pulls
    `assets/suite.css` + `assets/suite-chrome.js`).
  - The hub and each part as their own file(s) under the suite (`path-a.html`, `path-b.html`),
    sharing that chrome.
  - Do NOT cram the whole thing into one monolith HTML file, and do NOT make the parts fully
    independent duplicated files — share the chrome.
- **`suite.css` / `suite-chrome.js` were not available when the spec was written.** If they exist
  in the repo, **conform to them** (reuse the topbar, back-link, status-readout furniture, module
  wrapper, mono-label recipe) rather than reinventing. Read them before styling chrome.
- Static hosting conventions: relative paths, versioned stylesheet query strings (e.g.
  `home.css?v=N`) consistent with the rest of the stream. Deploy target is GitHub → Netlify.

## Following the existing sims (loose inspiration, not cloning)

Treat the existing sims as **reference for conventions and interaction patterns**, NOT as templates
to copy pixel-for-pixel, and NOT as an aesthetic to clone (this sim has its own look — see below).
Specifically, reuse these established patterns rather than inventing new ones:

- **Predict-before-reveal / guess-plate:** the existing sims already implement commit-a-guess →
  reveal-the-measured-answer (e.g. a `revealGuess()` / guess-plate pattern). The Rate Laws hook
  steps and forward-prediction beat use exactly this. Reuse the pattern.
- **Tier/stage progression:** the existing sims use a staged progression with tier-dots showing
  `current` / `complete` state. The A–H graphing flow and the initial-rates steps are this same
  staged pattern (plus the one persisted forward-lock).
- **Self-drawing trace motion:** the existing sims animate a line/trace drawing itself in at a
  readable pace (e.g. a `*-trace-draw` keyframe). The live-plotted [A]-vs-t point (B), the curve
  straightening (D), and any reveal of a plotted line use this same "draws itself in" character —
  never an instant snap-in.
- **Chrome furniture (not body copy):** mono uppercase tracked micro-labels, `FIG. 0X` plate
  captions, instrument-panel readouts, back-link + status topbar. Keep that furniture — it's most
  of what makes a sim read as "a DiPietro sim" independent of colour. **Do not apply that
  telegram voice to instructions, framing, feedback, or explanations.** See **Copy / narrative**
  below. This is a hard override of Unit 1b / previous-sim copy length.

---

## Copy / narrative — stand in for the teacher

This sim is **method teaching with nobody in the room**, not Unit 1b's guided-inquiry sandbox.
Unit 1b opens with one light framing line and stays quiet about the answer because a worksheet
interrogates. Rate Laws has no companion CTQ sheet doing that work. **Instructional copy has to
carry the explanation.** If a later pass feels "short-formed," it is almost always because an
agent inherited Unit 1b brevity or pasted a DESIGN.md bullet into the UI.

### Two registers (do not mix them)

| Register | Where | Length |
|---|---|---|
| **Furniture** | Kickers, `FIG.` captions, tier labels, numeric readouts, table headers, chip labels, hub status | Short, mono, tracked. Fragments are fine. |
| **Teaching copy** | Step titles, `.framing`, body paragraphs, callouts, guess-feedback, isolation failure, summaries, Stuck? help, hub path teasers that explain a method | Full sentences. Usually **2–4 sentences** for framing; a short paragraph (or two) when the student needs why + what-to-do. |

Hub teasers and the hub closing line can stay compact. **Every teaching step cannot.**

### Shape of a teaching beat

1. **Title** — a real heading a student can reread ("Find the order in each reactant"), not a
   caption ("Trial selection").
2. **Framing** — 2–4 complete sentences: what this screen is for, what they already have, what
   to do now, and *why that action is the method*. Do not spoil the numerical answer.
3. **Body setup** — if the interaction needs a situation (what the table is, which reaction, what
   "held constant" means), write it as paragraphs above/beside the control. One imperative
   ("Click two trial rows.") is not enough.
4. **Feedback / callouts** — restates the chemistry in sentences. Wrong paths explain *why* the
   move failed. Right paths name the insight, not just "Order 2."
5. **Stuck?** — a Socratic nudge in full sentences: what to try and why, never the answer.

### Hard no's (this is the first-pass failure mode)

- **Do not** paste DESIGN.md bullets into the UI. Those bullets are build specs. Expand them.
- **Do not** inherit Unit 1b's "one light framing line, never a question" rule. Framing here
  may ask a question *after* the setup paragraph. Setup still comes first.
- **Do not** write fragment stacks as body copy (`Many trials. Different starts. Ratios.`).
  Furniture may talk like that; a student reading how to isolate an order may not.
- **Do not** treat an EK code as the explanation (`… (5.2.A.3).`). Quote the idea in English;
  the kicker already carries the code.
- **Do not** pad. No "In this lesson you will learn…", no restating the title, no cheerful
  filler. Dense teacher-over-the-shoulder, not brochure.

### Too short vs. enough (use these as calibration, not as final copy)

Too short (current first pass):

> Click two trial rows.

> Unseen table. Find the orders and the units of k.

> You have rate = k[F₂][ClO₂] from the table. Plug in.

Enough (same beats, still not spoiling):

> This table has two reactants. The method only works if you compare two trials that isolate
> one of them: everything else held exactly constant, one concentration changed. Click two
> rows. The table will tell you whether you isolated something, or changed two things at once
> and learned nothing.

> This last table is one you have not seen. Use the same method — pick clean pairs, read each
> order from the rate ratio, then choose k's units from the *overall* order (the sum of the
> exponents), not from one reactant.

> You already have the rate law from the F₂ + ClO₂ table. A rate law is for predicting a run
> nobody has done yet. Plug the new starting concentrations into `rate = k[F₂][ClO₂]` and
> commit a number; then we'll show the measured initial rate.

If a screen teaches a rule, a distinction, or a procedure, default to the longer shape. If a
screen is a live readout sitting under a graph the student already understands, furniture-short
is fine.

---

## Aesthetics — "graph-paper lab"

This sim shares the stream's **fonts, chrome furniture, motion character, and light mode**, but
has its own **visual identity: clean graph-paper** and its own **teaching-copy length** (full
sentences when instructing — see Copy / narrative). It is deliberately distinct from the existing
sims' riso/paper-and-noise look — do not reproduce that noise-overlay/paper-tone palette here.
Do not reproduce their one-line framing either.

### Palette
- **Background: clean white.**
- **Lines, axes, graph curves, body text: black.**
- **Blue:** the graph-paper grid (faint) AND plotted data points/markers. (Grid is *faint* blue,
  background role; data points are *saturated* blue, foreground role — never faint data on faint
  grid.)
- **Red and green:** reserved primarily for **feedback semantics** — green = correct / success /
  straight-line-found; red = incorrect / wrong-transform / error. Keep this mapping consistent so a
  colour never means two things (don't colour a correct state red because red is "an accent").
- **Additional colours are allowed only where meaning requires a distinction the core colours can't
  carry** — e.g. distinguishing the three reaction orders on one plot, or multiple reactants in one
  table. When you must, keep additions **muted and flat**, in the same clean register. Do not
  introduce colour decoratively.

### Hard no-slop rules (this is unsupervised — these prevent generic-AI drift)
- **NO gradients** (no purple/blue gradient fills, no gradient backgrounds).
- **NO glassmorphism**, blur panels, or drop-shadow-heavy "cards."
- **NO emoji** anywhere.
- **NO `Inter` / `system-ui` / default sans stack** — use the three fonts above.
- **NO rounded-card default look.** Flat, precise, technical — like graph paper and lab
  instruments. That look is visual; it is not permission to write body copy like a caption.

### Graph paper is a TOOL, not wallpaper
- Use the faint-blue grid on plots **where reading values off the grid helps** — the linearization
  plots (D), the half-life-interval measurement (H). There, **snap the grid to real axis ticks** so
  gridlines correspond to actual values (a sharp student will notice cosmetic gridlines that don't
  line up with the axis).
- **Drop the graph paper** where a plot is busy, doesn't fit it cleanly, or would be clearer plain.
  Some graphs on graph paper, some not — this is intended, not inconsistent.
- **Part A (Method of Initial Rates) does NOT use the graph-paper background** by default — it's
  table-driven (lab-notebook of data tables), so a grid behind tables is decoration without
  function. Same white/black/blue palette and same feedback semantics — just no grid wallpaper.
  Graph paper appears in Part A only if/where an actual graph does (the hook, the k-units visual).

### Motion
- **Everything draws itself in at a readable, revealing pace** so students see *what is happening* —
  a line plots itself point-by-point, a curve straightens progressively, a reveal fades/draws in.
- **Never** snap new lines/content in instantly or "refresh randomly." Abrupt state swaps are the
  motion failure mode to avoid.
- Easing should feel deliberate and physical (things settling into place), not bouncy or decorative.

---

## Behavior rules (from DESIGN.md — repeated here as build constraints)

- **Only ONE gate exists:** initial-rates-complete → graphing-unlocks. Forward-only, never
  re-locks, back-nav always free, state in `localStorage`. Build no other "must answer to proceed"
  walls.
- **Never gate a reveal inside a discovery step.** Predict-before-reveal and
  exploration-with-validation are the mechanics; a plain reveal-on-button-press with no prior
  commitment is the anti-pattern to avoid (DESIGN.md §0).
- **Wrong answers/actions produce instructive failure, not just a red X** — the wrong graph
  transform stays curved; the bad trial-selection says "you isolated nothing" and explains why.
- **The initial-rates trial-selection mechanic validates held-constant columns by exact equality.**
  Every dataset must have a clean-isolation pair per reactant or the mechanic dead-ends (DESIGN.md
  §5). Verify datasets before wiring them in.
- **Graphing practice hands a real downloadable CSV** (Blob + anchor download, vanilla JS) for
  Google Sheets — do NOT build a fake in-app spreadsheet.
- **Gate input:** adaptive exponent boxes (only the reactants present get boxes; no fixed 3-box
  skeleton) + multiple-choice k units (not typed). Infinite retries, method-directed hints.

## Accessibility / correctness niceties
- `font-variant-numeric: tabular-nums` and `"zero" 1` feature on all numeric/mono readouts (matches
  the stream; keeps data columns aligned).
- Sufficient contrast: black-on-white and saturated-accent-on-white are fine; never rely on
  faint-blue for anything a student must read.
- Respect `prefers-reduced-motion`: provide a non-animated fallback (draw-in completes instantly)
  for students who set it, without breaking the pedagogy (the end state must still be correct).

## Do-not-do checklist (quick scan)
- [ ] No framework / build step / bundler
- [ ] No plotting library
- [ ] No external deps except Google Fonts (the three named)
- [ ] No gradients, glassmorphism, emoji, Inter/system-ui, rounded-card look
- [ ] No monolith file — use the suite pattern with shared `assets/` chrome
- [ ] No fake in-app spreadsheet
- [ ] No gate other than the single forward-lock
- [ ] No instant/abrupt reveals — everything draws in
- [ ] No graph-paper wallpaper behind Part A tables
- [ ] No Unit 1b / telegram body copy — instructional framing, feedback, and explanations are
  full sentences (2–4), not DESIGN bullets pasted into the UI
- [ ] Student-facing copy says Part A / Part B — never Path A / Path B
