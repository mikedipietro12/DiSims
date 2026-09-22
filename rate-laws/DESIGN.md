# DESIGN.md — Rate Laws (Interactive Sim)

> **Audience:** the coding agent (Cursor) building this sim, and future-Mike.
> **Status:** design complete except two flagged TODOs (see end). Ready to build.
> **What this is:** an interactive, self-paced AP Chemistry sim on rate laws, part of the
> DiPietro Science Sims stream. Two learning paths behind one hub.

---

## 0. Read this first — the one rule that governs everything

Every interactive step must make the student **do the reasoning**, not watch it happen.
The failure mode this whole design fights is "a slideshow with buttons" — passive reveals a
student clicks through without thinking. Two mechanics enforce this:

- **Predict-before-reveal:** where the student commits a guess, THEN the answer is shown.
- **Exploration-with-validation:** where the student's *action* (which data to select, which
  transform to apply) IS the reasoning, and wrong actions produce instructive failure — not
  a red X, but a state that shows *why* it's wrong and sends them back.

If you are about to build a step that just animates the answer on a button press with no prior
commitment or consequential choice, stop — it's the thing this design exists to avoid.

There is **no teacher in the loop.** This is self-paced. Every hint, every wrong-answer branch,
every "stuck" affordance is standing in for a teacher leaning over a shoulder. Design for the
student who is confused with nobody to ask.

**Standing in for a teacher includes the copy.** Unit 1b can stay quiet because a worksheet
interrogates. This sim teaches a method with no companion CTQ sheet, so instructional text has
to carry setup, why-this-step, and what-to-do — in complete sentences, not telegram fragments.
Chrome furniture (kickers, FIG captions, readouts) stays short. Framing, body explanations,
failure callouts, and summaries do not. **The compressed bullets in §2 and §6 are build specs,
not student-facing copy — expand them.** Full copy rules live in AGENTS.md (Copy / narrative).
Do not spoil the answer before commitment; do not skip the explanation after it.

---

## 1. Architecture

### Hub
Landing screen titled **RATE LAWS**. Routes to two paths:

1. **METHOD OF INITIAL RATES** (tabular, multi-reactant, ratio reasoning)
2. **GRAPHING RATES (INTEGRATION)** (visual, single-reactant, straighten-the-curve)

These are two genuinely different techniques for the same job (finding a rate law). The hub
fork is itself the teaching device: it shows the student these are two tools, chosen by
situation, not one method with two coats of paint.

### The forward-lock (the ONLY gate in the app)
- **INITIAL RATES must be completed before GRAPHING unlocks.** (Rationale: initial rates is
  taught first in AP sequence, AND the k-units concept is introduced there and *called back* in
  graphing — so graphing assumes initial rates was seen.)
- The lock is **forward-only.** Once graphing unlocks it stays unlocked. Nothing ever re-locks.
- **Back-navigation is always free.** A student can revisit any unlocked content anytime.
- **"Completed" is defined precisely** — see §3, the completion gate. It is NOT "viewed the last
  screen"; it requires solving one unseen problem.
- **No other gating anywhere.** Do NOT gate reveals inside discovery steps (see §0). Do NOT gate
  path order beyond this single lock. Do NOT add "you must answer to continue" walls inside the
  teaching flow.

### Persistence
- Use **`localStorage`** to remember completion state (whether initial rates is done, so graphing
  stays unlocked across refreshes/sessions).
- Known limitation, acceptable: `localStorage` is per-device, so a student on a different laptop
  starts locked again. Fine for single-class use. Do not over-engineer around this.
- This sim is Netlify-hosted (not a sandboxed artifact), so `localStorage` is available and
  appropriate.

### Convergence beat (unification)
The payoff of the two-path structure is that both methods reach the **same kind of object: a rate
law.** Bank that at the hub:
- **Path A carried example:** **F₂ + 2ClO₂ → 2FClO₂** (see §5, Dataset 3; both reactants first
  order — the simplest clean case). Path A only.
- **Path B real-example anchor:** a different single-reactant time course (e.g. Br₂ + HCOOH,
  Dataset 4). Do **not** run F₂ + 2ClO₂ through graphing.
- Unification is a hub closing line naming the relationship — e.g. *"Two roads, same rate law."*
  — not one shared reaction forced through both methods.

---

## 2. Path A — METHOD OF INITIAL RATES (teaching flow)

**Core cognitive work:** compare experimental trials, hold one reactant constant, vary another,
deduce each reactant's order from how the rate responds. This is **tabular ratio reasoning.**
There is no curve to draw — the honest shape of this path is "data detective," not "physics
animation." Do not force graph-heavy visuals where tables are the right tool. The
graph-paper theme is dropped here (see AESTHETICS); this path reads like a lab notebook of
data tables.

**Molecular honesty note:** the "more concentration → more collisions → faster rate" story here
is *true physics* and ties to collision theory. Unlike the graphing path's zero-order case, there
is no lie to hand-wave. Lean into the molecular picture freely in the hook.

### Steps

Each step below is a **spec of the cognitive beat**, not the words on screen. Write the
on-screen framing and explanations as a short teacher-over-the-shoulder paragraph (see
AGENTS.md, Copy / narrative). Do not drop these bullets into `.framing` or a callout.

**1. Hook — "double it, double the rate?"**
- Predict-before-reveal (reuse the guess-plate mechanic; see §6).
- Student predicts what happens to the rate when a reactant's concentration doubles.
- Reveal: it **quadruples** (a 2nd-order example). The disproportionality is the provocation —
  there's a hidden exponent, and finding it is what this path teaches.

**2. Molecular why.**
- Particle density → collision frequency → reaction rate. Honest, anchors to collision theory
  (which the AP course already covers). A brief molecular animation is appropriate here.

**3. Single-reactant ratio→exponent warm-up.** *(Scaffolding — deliberately isolates one skill.)*
- Trials varying **one reactant only.**
- Teach the rule: **rate ratio = (concentration ratio)^order.** The "concentration ×2 → rate ×4,
  so order = 2" tool.
- **Pattern-based only.** Keep all data clean (ratios that are recognizable powers: ×2→×4,
  ×3→×9, ×2→×2). **Do NOT teach the logarithmic method** (order = log(rate ratio)/log(conc ratio)).
  Logs are out of scope for this sim — a possible day-two extension, not here.
- Why this step exists: the ratio→exponent leap is where math-shy students stall, and every later
  order determination runs through it. De-risk it alone before adding the isolation skill on top.

**4. THE CENTERPIECE — multi-reactant isolation (the "trial selection" mechanic).**
This is the step slides cannot do, and the highest-value interaction in the path. On a slide, the
trials to compare are pre-chosen ("compare experiments 1 and 2"). That deletes the actual skill.
Here, **the student chooses which trials to compare**, and choosing correctly IS the reasoning.

- Present a multi-reactant data table (trials × concentrations × initial rate). Goal stated:
  e.g. *"Find the order in [A]."*
- Student **clicks two trial rows.**
- App reads what differs between the selected rows:
  - **Clean isolation** (exactly one reactant's concentration differs, all others equal):
    highlight the held reactant(s) as "held constant," the varied one as "varied," the rate as
    "response." Show the ratios → student derives the exponent.
  - **Bad selection** (two or more reactants differ): flag both changed columns. Message in the
    spirit of: *"You changed [A] AND [B]. The rate change could come from either — you've isolated
    nothing."* No exponent is extractable. Return them to the table to choose again.
- The bad-selection failure path is the teaching — it is the analog of a wrong graph transform
  staying curved. Do **not** prevent bad selections; let them happen and explain them.
- This is exploration-with-validation, NOT predict-then-reveal. The commitment (which rows) is
  itself the reasoning, so there is no separate "reveal" to gate.

**CRITICAL DATA REQUIREMENT:** every dataset used in this step MUST contain a clean-isolation pair
for *each* reactant (a pair where only that reactant's concentration changes). The app validates
held-constant columns by **exact equality.** If a dataset lacks a clean pair for some reactant,
this mechanic breaks (student clicks the only varying pair, both columns change, dead end). See §5
for which datasets satisfy this and which are excluded because they don't.

**5. Assemble the differential rate law.**
- From the orders found, build `rate = k[A]^x[B]^y…`.
- Name it the **differential rate law** explicitly. This reinforces the wall vs. the graphing
  path's *integrated* rate law — same words "rate law," different objects, and students conflate
  them constantly.

**6. Forward-prediction beat.** *(Hits the LI "predict the result of a chemical reaction.")*
- Predict-before-reveal. Given the assembled rate law, the student **predicts an unseen trial's
  initial rate** (plug in concentrations), then reveals the actual value.
- This is the only step that uses the rate law *predictively* (forward), rather than deriving it
  from data (backward). Having a rate law is *for* prediction — this beat makes that point.

**7. k and its units.** *(Units taught here; numerical value deferred to graphing.)*
- Isolate k: the app rearranges `rate = k[A]^x[B]^y` → `k = rate / ([A]^x[B]^y)` as a **scripted
  animated transition** (NOT a free-form algebra engine — see §6, k-units).
- Student **drag-cancels units** in the isolated expression to discover k's units.
- Key insight to build: **k's units depend on the total order** (the sum x+y+z), because the
  concentration units must cancel to leave rate's units (M·s⁻¹). Students frequently compute units
  from *one* reactant's order instead of the sum — the design targets this error.
- **No numerical k here.** k's value is a graphing-path concept (read off a slope). Here k is a
  symbol with units. This two-beat arc (units now, value later) is the main thread linking the two
  paths — see §4.
- **The M⁻¹ stumble:** cancelling to leave a concentration term *in the denominator* (written M⁻¹)
  is where students break. The cancel animation should leave the surviving unit visibly *below the
  bar* before converting it to negative-exponent notation, so the student sees the
  denominator-to-negative-exponent step happen rather than just seeing the result.

**8. Practice.**
- Curated multi-reactant tables, full method each (select trials → orders → rate law).
- Pool: real datasets 1 and 3 (§5) + 2–3 generated abstract A+B tables. See §5 for the spec.

**9. Summary + the wall.**
- Recap the method.
- Then **explicitly contrast the two paths** so the student leaves able to tell them apart:
  - *Initial rates:* MANY trials, each at DIFFERENT starting concentrations, compared by RATIO.
  - *Graphing:* ONE trial, tracked OVER TIME, straightened by transform.
- Foreshadow the graphing path (now unlocking).

### Completion gate → see §3.

### Scope boundaries for Path A (do NOT cross these)
- **No logarithmic order-solving.** Clean power-ratio data only.
- **No zero-order-reactant case.** Every reactant in every dataset has order ≥ 1. (A zero exponent
  would teach "a reactant absent from the rate law," which is deliberately out of scope for this
  sim — don't add datasets that introduce it.)
- **No advanced back-out isolation** (where two things change and you divide out a known order to
  get the other). Clean-isolation pairs only. (This is why Dataset 2 is excluded — see §5.)

---

## 3. Path A completion gate (the forward-lock trigger)

This is the ONE assessment-like moment in the app. It is a **do-it-once-unaided** gate, not a
seen-the-screens gate. Passing it unlocks GRAPHING.

**Trigger:** student reaches the last screen of Path A AND solves one final problem.

**The final problem:**
- **Unseen** — distinct from every practice/teaching dataset (not a dataset they already worked).
- **Multi-reactant** — required, because the method structurally needs ≥2 reactants (you can only
  hold one constant while varying another if there's more than one). A single-reactant "method of
  initial rates" is not the method.
- **Generated + verified, abstract** (A + B…, integer orders, guaranteed clean isolation). Numbers
  constructed and verified, NOT taken from an unverified source. (Rationale: the gate has zero
  teacher oversight behind a hard lock — a bad number strands a student who did everything right.)

**Input the student provides:**
- **Adaptive exponent boxes:** a `rate = k[A]^_ [B]^_ …` skeleton where the boxes shown match
  exactly the reactants present in THIS experiment (no fixed 3-box `[C]^z` skeleton — only real
  reactants get boxes). Student types the integer order in each.
- **Multiple-choice k units** (not typed — this sidesteps all `M⁻¹s⁻¹` vs `1/(M·s)` notation
  ambiguity). Student picks the correct units.

**MC distractor design (important — do not make this guessable):**
- Distractors are the units for **neighbouring total orders.** If the answer is overall 2nd order
  (`M⁻¹s⁻¹`), offer overall-1st (`s⁻¹`) and overall-3rd (`M⁻²s⁻¹`) as distractors.
- This forces the student to actually know that **total order (the sum of exponents)** determines
  the units. Lazy/obviously-wrong distractors would let them pick by elimination and the units
  insight goes untaught. The distractors specifically punish the "used one reactant's order
  instead of the sum" error.

**Retry behavior:**
- **Infinite retries.** This is a completion gate, not an exam — its job is "prove you can, once,"
  not "catch you out."
- **Method-directed hints** surface after a couple of misses: e.g. *"Compare trials 1 and 2 — what
  changed, and what did the rate do?"* Hints point at the METHOD, never at the answer
  (*not* "the order in A is 2").
- **No attempt limits, no hard fail.** Do not add friction that fights the self-paced design.

**Accepted brute-force hole (do not try to close it):** typed integer boxes (small range) + infinite
retries means a determined student could cycle values until it unlocks. This is knowingly accepted.
The gate is formative; brute-forcing it mostly wastes the student's own time, and the real stakes
live in graphing and on the actual assessment. Method-directed hints make brute-forcing slower than
just doing the method. Do NOT add anti-cheat (attempt caps, randomization-per-attempt) — it costs
more in honest-student friction than it saves.

---

## 4. The k thread (links the two paths)

k is taught in **two deliberate beats across the two paths.** Preserve this:

- **Initial rates (Path A, step 7):** k's **UNITS** are discovered (drag-cancel), depending on
  total order. **No numerical value.**
- **Graphing (Path B):** k's **VALUE** is found — read off the slope of the straight linearized
  line. This is a **callback** to the units concept from Path A.

Because the app gates initial-rates-before-graphing, the callback always lands on something already
seen. HOWEVER: write the graphing k-moment so it still **stands alone** if it happens to be a
student's first real engagement (e.g. they rushed Path A). Reward having done Path A first; don't
*require* remembering it.

---

## 5. Datasets

### Verified real datasets (from Mike's existing slides; orders confirmed numerically)

**Dataset 1 — NO + H₂ → N₂.** USE in Path A practice.
| Exp | [NO] | [H₂] | rate (mol/L·min) |
|----|--------|--------|--------|
| 1 | 0.0060 | 0.0010 | 1.8×10⁻⁴ |
| 2 | 0.0060 | 0.0020 | 3.6×10⁻⁴ |
| 3 | 0.0010 | 0.0060 | 0.30×10⁻⁴ |
| 4 | 0.0020 | 0.0060 | 1.2×10⁻⁴ |
- Order in **H₂ = 1** (exp 1–2, [NO] held). Order in **NO = 2** (exp 3–4, [H₂] held). Overall 3.
- Clean isolation pair for **each** reactant. Spans a 1st and a 2nd order in one table — the best
  real dataset for the app. `rate = k[NO]²[H₂]`.

**Dataset 3 — F₂ + 2ClO₂ → 2FClO₂.** USE as the **Path A carried example** AND in Path A
practice. Do **not** carry this reaction into Path B.
| Exp | [F₂] | [ClO₂] | rate |
|----|------|--------|--------|
| 1 | 0.10 | 0.010 | 1.2×10⁻³ |
| 2 | 0.10 | 0.040 | 4.8×10⁻³ |
| 3 | 0.20 | 0.010 | 2.4×10⁻³ |
- Order in **ClO₂ = 1** (exp 1–2, [F₂] held). Order in **F₂ = 1** (exp 1–3, [ClO₂] held). Overall 2.
- Clean isolation for each reactant. Simplest multi-reactant case (both first order) — ideal for
  first contact with the isolation mechanic and as the shared convergence reaction. `rate = k[F₂][ClO₂]`.

### Excluded datasets (do NOT use in the core flow — here's why, so they're not re-added)

**Dataset 2 — 2ClO₂ + F₂ → 2ClO₂F.** EXCLUDE from Path A core.
| Exp | [ClO₂] | [F₂] | rate |
|----|--------|------|--------|
| 1 | 0.010 | 0.10 | 1.2×10⁻³ |
| 2 | 0.010 | 0.40 | 4.8×10⁻³ |
| 3 | 0.020 | 0.20 | 9.6×10⁻³ |
- F₂ isolates cleanly (exp 1–2, order 1). **But NO pair holds F₂ constant**, so ClO₂'s order can
  only be found by the advanced back-out method (compare exp 2–3 where both change, divide out the
  known F₂ order → ClO₂ order 2). That back-out case is **explicitly out of scope** (§2 boundaries),
  so this dataset would break the clean-isolation mechanic. It is a good dataset for the *excluded*
  advanced case only — keep it out of the app.

**Dataset 4 — Br₂ + HCOOH → products.** NOT an initial-rates dataset. Reserve for **Path B (graphing).**
- It is a single-reactant **time course** ([Br₂] decreasing over time, instantaneous rates from
  tangent slopes, rate/[Br₂] = constant → first order). That is graphing/integrated-rate-law
  pedagogy, and it uses *time* as a variable, which initial rates never does. Putting it in Path A
  would blur the wall between the paths.
- It IS a clean real-world first-order example — earmark it for Path B's "real example" anchor
  (also satisfies the "real examples of reactions" LI).

### Generated datasets (to be produced at build; spec)
- **Path A practice pool:** the two real datasets above + **2–3 abstract A+B tables** so not every
  student works NO+H₂.
- **Path A gate:** **1 generated, verified, abstract** table (see §3).
- **Spec for all generated Path A tables:** integer orders only; each reactant order ∈ {1, 2}
  (**never 0** — no zero-order reactants); overall order 2–3; 3–4 trials; **a clean-isolation pair
  guaranteed for every reactant** (held columns exactly equal); rate ratios are clean recognizable
  powers (no logs needed). **Verify every order numerically before use.**

---

## 6. Path B — GRAPHING RATES (INTEGRATION) (teaching flow)

**Core cognitive work:** take ONE concentration-vs-time run, apply transforms, find which one
straightens the data → that identifies the order. Single-reactant, time-course, visual. This is
the graph-paper path (see AESTHETICS).

**Flow (A–H):**

Same copy rule as Path A: the letters below are beats, not captions to paste. Graphing is
visual, but the student still needs a paragraph of *why this transform / why this slope /
why these half-life spacings* before they act.

**A. Review — what is a rate.** Brief grounding: rate as change in concentration over time.

**B. Zero-order vs first-order, side by side.** *(Highest-risk build — the linchpin.)*
- Animate molecules converting for a zero-order and a first-order reaction **side by side, same
  starting count, same scale** (contrast is the whole point).
- A **live-drawn point traces [A] vs t in the same eyeline, on the same clock** as the animation —
  the curve is drawn *as* the molecules convert, so the animation and the graph are visibly the
  same event, not two separate things. (Reuse the self-drawing-trace motion, cf. `ms-trace-draw`
  in the existing sims.)
- **Zero-order honesty caveat:** true molecular zero-order (constant rate regardless of
  concentration) has no clean particle-level cause at this level (it comes from saturated
  catalysts/surfaces). A sharp student will ask "why doesn't it slow as it runs out?" — there's no
  molecular answer at this level. Decide the hand-wave deliberately; don't pretend it's obvious.

**C. Bridge — "we can manipulate the data to reveal the order."** Motivate transforms.

**D. Linearization drag (the best interaction in this path).**
- Student drags a transform (ln, or 1/) onto the y-axis and watches the curve straighten (or not).
- MUST be **their** data — the same reaction carried from B, not a fresh generic plot. Continuity
  sells "we transformed the data, we didn't switch examples."
- **Let them apply the WRONG transform** and see it stay curved / bend the other way. The failing
  transforms teach as much as the winning one. Do not allow only the correct drag.

**E. Slope = k (protect this beat — it's the conceptual bridge).**
- "Where is there a constant in these graphs?" → the slope of the straight line → that's k.
- Make them **click/mark the slope** (two points, read the value, see it matches k) — earned, not
  told.
- **The sign gotcha (AP-specific):** zero and first order have slope −k, but second order's 1/[A]
  plot slopes **UP (+k)**. Students expect "it's decaying so slope is negative" and get burned.
  Surface this here explicitly.

**F. Integrated rate law reveal.**
- Reveal the three integrated forms and their three plot types — but keep it **anchored to the
  student's reaction** (highlight their reaction's row, gray the others). Three plots × three
  orders = nine things; if it's a passive reveal it becomes the most slide-like moment in the
  lesson. Keep it active/anchored.

**G. Practice — real spreadsheet (Google Sheets).** *(This step teaches the PROCEDURE, deliberately
using the real tool.)*
- The app hands the student a **downloadable CSV** (a Blob + download link, vanilla JS — do NOT
  build a fake in-app spreadsheet; that would be rebuilding Sheets, worse, to teach Sheets).
- Student opens it in Google Sheets (all students on laptops — confirmed), builds three scatter
  plots (raw, ln, 1/), finds the straight one, writes the rate law.
- Curated known-good datasets (3–4). Spanning orders: ensure at least one zero, one first, one
  second across the set, so students practice all three straightenings.
- **The gate here is "write the rate law," NOT "pick the order from a dropdown."** The order→
  expression translation (e.g. order 2 → `rate = k[A]²`, not `k[A]` or `2k[A]`) is itself an
  error-prone skill worth practicing. Accept order exactly; de-emphasize numerical k here (see
  below).
- **Numerical k is de-emphasized in this practice step** (Mike's call): the point is "find the
  straight line → write the rate law," not slope arithmetic. k remains in the written law as a
  symbol. This also removes the most error-prone move from the worksheet (reading slope off a
  trendline label and doing the −k sign flip). k's *value* is demonstrated earlier in E and can be
  shown on the real-example anchor, but the practice gate doesn't demand the arithmetic.
- **Ship a one-page procedural worksheet** as the scaffold (the app can't scaffold inside Sheets):
  add column, `=LN(B2)`, fill down; Insert → Chart → Scatter; add trendline, show equation + R²;
  repeat for 1/[A]; the straight one wins. Include a "reveal worked version" path for stuck
  students (self-paced = someone will be stuck with no one to ask). If numerical k is ever
  reintroduced here, **bold the −k sign-flip warning** on the worksheet — it's the single most
  error-prone step.
- **Fluency risk (biggest risk in this step):** laptop access ≠ Sheets fluency. Students who can't
  build a trendline scatter from a standing start will fight chart menus instead of learning
  kinetics, and you won't see it until you're in the room. Scale the worksheet scaffold to whether
  this class has made a trendline+R² scatter before. **TODO: confirm prior Sheets experience** —
  light checklist if review, screenshot-by-screenshot walkthrough if cold.
- Curated data is clean, so the straight line is visually obvious and no one is forced to lean on
  R² to break a tie. Correct for first contact; just don't mistake "everyone nailed it" for
  "everyone can do it on messy data" — the ambiguous/noisy case is a later rep, not this step.

**H. Half-life discovery.** *(The payoff — memorable and testable.)*
- A sample "reacts live"; the student **clicks when half remains**, repeatedly, for zero, first,
  and second order. Then compares the time *between* successive half-lives.
- **Get the directions right (this is the whole insight):** first order → **constant** spacing
  (t½ independent of concentration); zero order → intervals **shrink** (t½ = [A]₀/2k); second
  order → intervals **grow** (t½ = 1/k[A]₀).
- **Sequencing:** do a **zero-order round first**, then **first order second**, so the constant-t½
  result lands as the surprise it should be.
- **Measurement friction:** clicking "half remains" live off a curve is fiddly — give a snap-to or
  a tolerance band, or fighting the mouse becomes the memory instead of the concept.
- **AP scope note:** AP only tests **first-order** half-life (t½ = 0.693/k is the only one on the
  equation sheet). The zero/second half-life behavior here is *excellent teaching* (the contrast is
  what makes first-order's constancy land) but is **enrichment, not tested content.** Don't let a
  student think they'll be asked to compute a second-order half-life.
- The LI says half-life *related to the integrated rate law* — so surface the actual t½ formula(s),
  at least first-order's, not just the visual spacing pattern. Probably in the summary.

**Summary.** Recap; reinforce the wall vs. initial rates; k reintroduced as a *value* (callback).

### Note on Path B and initial-rates method
Path B never uses the method of initial rates, and initial rates never uses a time-course. Keep
them distinct — the two-path wall depends on it. If Dataset 4 (Br₂+HCOOH) is used as B's real
anchor, it demonstrates rate ∝ [Br₂] from a *single run over time* (rate/[Br₂] = constant) —
that's differential-law-from-one-experiment, which belongs to B, not A.

---

## 7. Content leads (from the 5.2.A / 5.3.A screenshots)

These points are the spine. Briefing, step kickers, and debrief quote them; do not
substitute generic “I can” competencies.

**Path A — 5.2.A** *Represent experimental data with a consistent rate law expression.*
- **5.2.A.1** Monitor amounts / determine rate → hook + molecular (Path B owns the *over time* half).
- **5.2.A.2** Rate ∝ each concentration to a power → assemble.
- **5.2.A.3** Power = order in that reactant; sum = overall order → warmup + assemble.
- **5.2.A.4** Rate constant; temperature dependent; units from overall order → k-units (value later in B).
- **5.2.A.5** Comparing initial rates → trial selection.

**Path B — 5.3.A** *Identify the rate law using data that show how concentrations change over time.*
- **5.3.A.1** Order inferred from [A] vs t → A/B.
- **5.3.A.2** First order: ln[A] vs t linear → D.
- **5.3.A.3** Second order: 1/[A] vs t linear → D (wrong-transform on the first-order run).
- **5.3.A.4** Slopes give k. Zeroth: [A]ₜ − [A]₀ = −kt. First: ln[A]ₜ − ln[A]₀ = −kt. Second: 1/[A]ₜ − 1/[A]₀ = kt → E/F.
- **5.3.A.5** First-order half-life is constant: t½ = 0.693/k → H.
- **5.3.A.6** Radioactive decay as the illustration of first-order kinetics → H (first-order round) + summary.

---

## 8. Build decisions (2026-09-18) + remaining TODOs

Resolved before first build:

1. **Home:** this suite lives in the existing DiSims repo as `rate-laws/` (same pattern as
   `Unit 1b/`). Conform to `Unit 1b/assets/suite.css` + `suite-chrome.js` for chrome; keep this
   sim's graph-paper visual identity.
2. **Zero-order honesty (Path B step B):** brief in-app note — this happens with saturated
   catalysts/surfaces; do not pretend there is a simple particle-level cause.
3. **Google Sheets scaffold (Path B step G):** Mike will work through this section with the class.
   Ship a **light checklist** only, for students who need to go over it again by themselves.
4. **Carried-example / convergence:** keep **F₂ + 2ClO₂ for Path A only.** Path B uses a different
   single-reactant example (e.g. Br₂ + HCOOH). Unification is the hub line ("Two roads, same rate
   law"), not a shared reaction run through both paths.
5. **Generated datasets:** generate and verify the abstract Path A practice/gate tables to spec.
6. **Content leads:** use the 5.2.A and 5.3.A screenshot points verbatim. Do not invent a parallel
   LI/competency layer.
7. **Copy length:** instructional framing, explanations, and feedback are full sentences
   (typically 2–4), standing in for a teacher. Do not inherit Unit 1b's one-line framing or
   paste §2/§6 bullets into the UI. Furniture (kickers, FIG captions, readouts) stays short.
   See AGENTS.md, Copy / narrative.

Still open (not blocking first ship, but **do these in order when editing resumes**):

1. **`FIG. 07 · DRAG TO CANCEL` (Part A, k-units) — REWORK FIRST.** Current drag-chip
   fraction UI is not good enough: unstructured, weakly visual, hard to read as a teaching beat.
   When resuming Part A edits that touch units of k, **rewrite this step first** before polishing
   surrounding copy. Keep the pedagogy (overall order → units; leave leftover M visibly below
   the bar before M⁻¹; no numerical k here). Replace the interaction/layout.
2. **`suite.css` / `suite-chrome.js`:** they exist in `Unit 1b/assets/`. Read them before styling
   chrome; reuse topbar / back-link / status furniture; do not reinvent.

---

## 9. Aesthetics — see AGENTS.md

The visual constraints (graph-paper theme, palette, motion, fonts, no-slop rules) live in
**AGENTS.md** because they're build-conformance rules. Copy length also lives there: chrome
furniture is short; teaching copy is not. The one design-level visual point worth repeating
here: **graph paper is a tool, not a wallpaper** — it appears on plots where reading values off
the grid helps (linearization, half-life intervals), and is dropped where a plot doesn't fit it
or where content is tabular (all of Path A). Some graphs are on graph paper, some aren't; that's
intended.
