# Design State: Intro to Equilibrium (AP Chem 12)

_Last updated: 2026-10-30 by design-builder (Task 6 complete: Guide live)_

## Brief
- **Problem:** AP Chem 12 students reach Le Châtelier without ΔH/ΔS/ΔG or reversibility/rates groundwork
- **Primary persona:** AP Chem 12 pre-load student; knows ΔH, rates, Hess; entropy new
- **Brief document:** `docs/designpowers/briefs/2026-10-30-equilibrium-intro.md` 

## Design Principles
1. It never stops: micro keeps reacting under a steady macro view
2. Two pulls, one verdict: ΔH and −TΔS always shown as separate pieces stacking into ΔG
3. Signs before sums: no arithmetic, no K/Q
4. Name once, then go quiet (Guide names, Sandbox quiet)
5. Meaning without colour, pointer or motion

## Taste Profile
- **Direction:** Toy Box (inherited) + **Ember and Tide** additions: ember `#e07a2e` = ΔH, tide `#14918f` = −TΔS, ink = ΔG; forward rate solid ink, reverse dashed tide; A/B = ember/tide
- **Tokens:** `assets/eq-intro.css`
- **Taste document:** `docs/designpowers/taste/2026-10-30-equilibrium-intro-taste.md`
- **Type:** Space Grotesk + Space Mono
- **Charge convention:** red = δ+ / positive, yellow = δ− / negative. Reserved; not reused for ΔH/ΔS/ΔG.

## Decisions Log

| Date | Agent | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-10-30 | user + discovery | Guide + Sandbox (IMF-style), not three rooms | Guide names, Sandbox discovers |
| 2026-10-30 | user + discovery | Hub: AP Chem 12, card before Equilibrium Simulations | Groundwork for Le Châtelier |
| 2026-10-30 | user + discovery | Sim carries teaching; pre-load; no gates or scores | Same posture as IMF |
| 2026-10-30 | user + discovery | Designpowers emulated in Claude Code | Plugin is Cursor-only |
| 2026-10-30 | discovery | Reuse Toy Box suite.css; no-em-dash rule copied | Family consistency with Le Châtelier page |
| 2026-10-30 | user + discovery | Sandbox = reversible vessel + live ΔH / −TΔS / ΔG bars | One stage carries rates→equilibrium and Gibbs |
| 2026-10-30 | user + discovery | No K / Q in this suite | K is introduced by the Le Châtelier sim |
| 2026-10-30 | user + discovery | Gibbs qualitative: sign table + T slider, no arithmetic | Keep focus on meaning, not unit conversion |
| 2026-10-30 | user + discovery | Prior: ΔH, rates/collision theory, Hess's law; entropy new | Guide builds S from scratch, refreshes ΔH |
| 2026-10-30 | user + discovery | Vessel: real 4-case menu + custom A ⇌ B sign toggles | Real chemistry first, free exploration of the sign table |
| 2026-10-30 | user + discovery | Guide examples: phase changes, cold/hot packs, soda bottle, blood/ocean CO₂ | "Equilibrium all around us" + cross-discipline QP |
| 2026-10-30 | user + discovery | Predict-then-reveal chips for ΔH/ΔS signs | QP hypothesis without scoring |
| 2026-10-30 | user + discovery | Block 3 depth: state function (two paths), ΔG ≠ speed, ΔH/ΔS assumed constant | E competency (limitations) |
| 2026-10-30 | user + discovery | Reaction menu: N₂O₄⇌2NO₂ (+,+) · Haber (−,−) · 2O₃⇌3O₂ (−,+) · 3O₂⇌2O₃ (+,−) · custom A⇌B | One real reaction per sign case; two shared with Le Châtelier sim |
| 2026-10-30 | design-discovery | Brief approved end-to-end | Section-by-section sign-off |
| 2026-10-30 | user + strategist | Five principles + experience map + trade-offs approved | Guides all later craft |
| 2026-10-30 | user + strategist | Vessel settled mix coupled to ΔG sign (no K shown) | Bars and particles must agree |
| 2026-10-30 | writing-design-plans | 9-task plan approved; taste pass moved to right after Task 1 | Lock ΔH/ΔS/ΔG tokens before building charts (as IMF did before Guide UI) |
| 2026-10-30 | design-builder | Task 1: suite hub (Guide, Sandbox, Next → Le Châtelier), room stubs, AP 12 card before Equilibrium Simulations (hub count 6 → 7) | Structure before kit/engine; styles and room switcher load straight from `../intermolecular-forces/assets/` |
| 2026-10-30 | user + design-taste | Ember and Tide chosen over Ink and Pattern and Verdict in colour (live comparison page) | Heat/spread metaphor; signs still carried by glyph + dash; indigo stays chrome (avoids N₂ clash) |
| 2026-10-30 | design-taste | Gibbs bars drawn as a waterfall (ΔH from 0, −TΔS from ΔH end, ΔG from 0 to sum), no numbers | Principle 2 (two pulls, one verdict) + 3 (signs before sums) |
| 2026-10-30 | design-builder | Task 2: `assets/reactions.js` (EqReactions): species drawings, 5 vessel reactions, 9 Guide example cards, dG/crossover helpers; T slider 200–700 K | Crossovers: N₂O₄ 325 K, Haber 464 K, custom 400 K, all in range; ozone pair has none |
| 2026-10-30 | design-builder | Custom reaction is A ⇌ B (1:1), not 2A ⇌ B | Particle count must never contradict a student-chosen ΔS sign |
| 2026-10-30 | user + builder | CaCl₂ hot pack kept with its real ΔS (−) as a deliberate "surprise" card (Ca²⁺ holds water tightly) | Rule of thumb has exceptions; serves E competency (limits of simple models) |
| 2026-10-30 | design-builder | Task 3: `assets/vessel-engine.js` (EqVessel). Progress ξ with forward kf(1−ξ), reverse kr·ξ; settled point ξ* = 1/(1+e^(ΔG/15 kJ)) clamped 0.04–0.96; kf+kr = 0.45/s·(T/298)^0.8 | Smooth textbook graphs; vessel side always agrees with ΔG sign; no K shown; ozone doesn't saturate |
| 2026-10-30 | design-builder | Particles follow the ODE via forward/reverse event budgets (glide together → swap → ink ring), drift-corrected to ±1 unit; no particle collisions | Principle 1: events keep firing at equilibrium. Stress test 5 reactions × 3 T × 3 mixes = 45/45 pass (rates equal, side matches ΔG, stays in vessel, events both ways in last 10 s). N₂O₄ at 298 K settles in 8.3 s |
| 2026-10-30 | design-builder | N₂O₄ drawn with glassy clear atoms; brown tint over the vessel scales with ξ for N₂O₄ | Matches Le Châtelier sim; macro cue (colour) beside micro (particles) |
| 2026-10-30 | design-builder | O₃ atoms pale blue (`Oz`) instead of coral | Render showed O₂/O₃ indistinguishable; ozone really is pale blue |
| 2026-10-30 | design-builder | Reduced motion: particles hold still, events swap instantly with no ring; graphs and state keep updating | Principle 5 |
| 2026-10-30 | user | Build the Sandbox (Tasks 4 + 7) before the Guide copy (Tasks 5–6) | Get a playable page first; Guide copy sign-off follows |
| 2026-10-30 | design-builder | Task 4: `assets/eq-charts.js` (EqCharts). Amount over time (reactants solid, products dashed, integer axis steps); rates over time (forward solid ink, reverse dashed tide, no numbers, labels at line ends, stacked above when both lines hug zero); waterfall Gibbs bars with per-reaction scale (closes DD-2) | Taste rules; principle 3; readable without colour |
| 2026-10-30 | design-builder | Four-case sign table deferred to the Guide | Its verdict labels would narrate in the Sandbox (principle 4) |
| 2026-10-30 | design-builder | Task 7: `sandbox.html`: reaction picker, T slider 200–700 K, start-mix segmented buttons, custom ΔH/ΔS sign toggles (shown only for A ⇌ B), Pause, Start over; gauges (T, reaction, molecule counts); stage + three side panels; live region with neutral summaries; layout CSS lifted into `eq-intro.css` | Family layout with the Le Châtelier sim; quiet HUD (no "equilibrium reached" banner) |
| 2026-10-30 | design-builder | Vessel fills the stage frame (height follows canvas aspect, no inner wall); atom radius capped at 10 px | First render had a double border and oversized molecules |
| 2026-10-30 | design-builder | Verified: N₂O₄ at 450 K, Haber at 600 K, custom (ΔH −, ΔS +) at 600 K all settle with rates meeting and bars matching; 390 px width has no horizontal scroll; engine stress test still 45/45 | Headless checks via a temporary harness (removed) |
| 2026-10-30 | user + builder | Task 5: Guide beat copy approved for all 10 beats (`docs/designpowers/plans/2026-10-30-guide-beats.md`); every LI/competency maps to a beat | Section-by-section sign-off |
| 2026-10-30 | user + builder | Hot pack: ΔH chip in beat 1, ΔS surprise chip held to beat 2 | Entropy must be named before its sign is asked |
| 2026-10-30 | user + builder | Beat 2 stage = simple drawn before/after snapshots (not IMF heat-engine jar) | Faster, clearer, no cross-suite coupling |
| 2026-10-30 | design-builder | Task 6: `guide.html` with the approved copy verbatim; sticky stage switches between a picture canvas (`assets/guide-pictures.js`: heat, spread, pulls, paths, equation) and the shared vessel (+ graphs / Gibbs bars / T slider / picker / sign table per beat via data attributes) | One engine, one chart module, one panel; beat config lives in the HTML |
| 2026-10-30 | design-builder | Heat and two-pulls pictures stay grey with "?" until Reveal | A picture must not give away the prediction it asks for |
| 2026-10-30 | design-builder | Predictions held in memory per beat + card; reveal shows the answer and reason beside the student's own choice, no right/wrong wording | Pre-load, not mastery; nothing saved or scored |
| 2026-10-30 | design-builder | Guide stage column widened to 320–500 px (IMF: 280–400) | Vessel shares it with graphs, bars and sign table |
| 2026-10-30 | design-builder | Verified: beats 1, 2 (hot pack surprise + aside), 3, 5, 7, 8 render correctly after predict + reveal / fast-forward; N₂O₄ at 450 K highlights "Forward only when hot"; no horizontal scroll at 390 px on any beat | Headless harness (removed) |

## Open Questions
See `DISCOVERY.md`.

## Artefact Index

| Artefact | Path | Status |
|----------|------|--------|
| Discovery notes | `DISCOVERY.md` | Complete |
| Brief | `docs/designpowers/briefs/2026-10-30-equilibrium-intro.md` | Approved |
| Strategy | `docs/designpowers/strategy/2026-10-30-equilibrium-intro-strategy.md` | Approved |
| Plan | `docs/designpowers/plans/2026-10-30-equilibrium-intro-plan.md` | Approved |
| Taste | `docs/designpowers/taste/2026-10-30-equilibrium-intro-taste.md` | Approved |
| Taste comparison (dev page) | `taste-directions.html` | Reference only - not linked from hub |

## Design Debt Register

_Items: 6 (open 5) | Critical: 0 | Oldest: 2026-10-30_

| ID | Date | Source | Severity | What | Who is affected | Suggested fix | Status | Notes |
|----|------|--------|----------|------|----------------|---------------|--------|-------|
| DD-1 | 2026-10-30 | design-taste | Minor | `taste-directions.html` is a dev page in the suite folder | None (dev only) | Delete before ship or keep as archived reference | Open | Same as IMF DD-6 |
| DD-2 | 2026-10-30 | builder | Minor | Ozone pair |ΔG| (~300 kJ) is ~6× the others; a shared bar scale would flatten N₂O₄/Haber | Sandbox readers | Per-reaction bar scale (fit the larger of ΔH, −TΔS over the T range) in Task 4 | Closed | Per-reaction bar scale in EqCharts.gibbs (Task 4) |
| DD-3 | 2026-10-30 | builder | Minor | Ozone pair at equilibrium only fires ~2–4 events per 10 s each way (ξ clamp 0.96 with 12 units) | Students watching ozone for "it never stops" | Raise ozone units or xiMax headroom if playtest shows it reads as stopped | Open | Other reactions fire 5–43 per 10 s |
| DD-4 | 2026-10-30 | builder | Minor | `sandbox.html` exposes `window.__eqSandbox` and `guide.html` exposes `window.__eqGuide` for headless checks | None (dev only) | Remove before ship | Open | Same pattern as IMF DD-1 |
| DD-5 | 2026-10-30 | builder | Minor | Le Châtelier sim's click-to-expand graph (zoom, pan, pause, read values) not ported | Students wanting to study the graphs closely | Port the chart modal into eq-charts.js if playtest asks for it | Open | Sandbox graphs show the last 30 s |
| DD-6 | 2026-10-30 | builder | Minor | `EqReactions.EXAMPLES[].beat` no longer drives placement (the Guide reads `data-cards`) and is stale for a few cards | Future maintainers | Drop the field or sync it | Open | Harmless |

## Handoff Chain

### 2026-10-30 design-discovery → design-strategist
> "Brief approved: Guide (10 named beats, predict-then-reveal chips) → quiet Sandbox (reversible vessel, micro + macro, rate/concentration graphs, live ΔH / −TΔS / ΔG bars, 4-case real menu + custom A⇌B). AP Chem 12 pre-load ahead of Le Châtelier; no K/Q; qualitative Gibbs; Toy Box. Entropy is new, so it needs its own pacing. Need principles, journey map, trade-offs before planning."

### 2026-10-30 design-strategist → writing-design-plans
> "Principles locked: it never stops, two pulls one verdict, signs before sums, name once then quiet, meaning without colour/pointer/motion. Vessel settles with the ΔG sign, no K. Journey: hub → Guide → Sandbox → Le Châtelier. Break into a buildable plan: hub + AP12 card, reaction data, one vessel engine shared by Guide stage and Sandbox, Guide beats, Sandbox, polish."

### 2026-10-30 writing-design-plans → (execution)
> "Plan approved. Order: Task 1 hub + AP12 card → Task 8 taste tokens → Tasks 2–7 → Task 9 polish."

### 2026-10-30 Task 1 complete → Task 8 (taste, moved early)
> "Hub + Guide/Sandbox stubs live under equilibrium-intro/, linked from AP 12. Shared chrome comes from the IMF suite (suite.css, suite-chrome.js), no copies. Next: lock ΔH / −TΔS / ΔG tokens and forward/reverse rate line styles before Task 2."

### 2026-10-30 design-taste → Task 2 (reaction kit)
> "Ember and Tide locked in assets/eq-intro.css: ember ΔH, tide −TΔS, ink ΔG, forward solid ink / reverse dashed tide, A/B ember/tide. Waterfall bars, glyphs always, no numbers. Next: reactions.js data for the menu + Guide examples."

### 2026-10-30 Task 2 complete → Task 3 (vessel engine)
> "EqReactions live: species atoms (Le Châtelier palette), 5 reactions with real ΔH/ΔS, CASES, 9 Guide examples, dG/minusTdS/crossover/caseOf. Next: shared vessel engine with ΔG-coupled mass-action rates (compress the drive so ozone doesn't saturate), events that continue at equilibrium, Guide preset API, reduced motion."

### 2026-10-30 Task 3 complete → Task 4 (graphs + Gibbs bars)
> "EqVessel live and stress-tested (45/45). API: setReaction/setT/setMix/setSigns/reset/play/pause/preset/advance, getState (rf, rr, ratesEqual, counts, dH, mTdS, dG, favours, crossover), history() at 0.1 s, summary() for live region. Next: concentration + rate graphs (forward solid ink, reverse dashed tide) and waterfall Gibbs bars with per-reaction scale (DD-2)."

### 2026-10-30 Tasks 4 + 7 complete → Task 5 (Guide beat copy)
> "Sandbox is live: vessel + amount/rate graphs + waterfall Gibbs bars, all five reactions, custom sign toggles, quiet HUD, live region. Next: Guide beat copy for user sign-off (10 beats, chips from EqReactions.EXAMPLES, four-case sign table lives in beat 8), then Task 6 Guide build reusing EqVessel + EqCharts on the sticky stage."

### 2026-10-30 Task 5 approved → Task 6 (Guide build)
> "Beat copy locked. Stage modes needed: heat flow (1), spread snapshots (2), two pulls (3), vessel (4, 10), vessel + graphs (5), cards (6, 9), two paths (7), vessel + Gibbs bars + T slider + sign table (8). Chips from EqReactions.EXAMPLES; reveal shows reason; nothing saved."

### 2026-10-30 Task 6 complete → Task 9 (polish + ship)
> "Guide and Sandbox both live. Remaining: remove dev hooks (DD-4) and the taste comparison page (DD-1), keyboard-only + screen reader + reduced-motion passes, final dash grep, optional back-link from equilibrium_simulations.html, then a user playtest (watch DD-3 ozone 'looks stopped')."
