# Design Brief: Intro to Equilibrium (AP Chem 12)

**Date:** 2026-10-30  
**Status:** Approved (2026-10-30)  
**Approach:** IMF-style two parts: Guide (names) → Sandbox (quiet discovery)  
**Hub:** AP Chemistry 12 (`ap-chemistry-12/index.html`), card before "Equilibrium Simulations"  
**Repo:** `equilibrium-intro/`

---

## Problem Statement

AP Chem 12 students reach the Le Châtelier sim (`equilibrium_simulations.html`) without the ideas it assumes. They have not seen why reactions go the way they do: enthalpy, the entropy idea of spreading out, and how the two trade off with temperature through ΔG. They also haven't seen why a reaction stops changing: it is reversible, both directions run, and the rates become equal. Without that groundwork, "equilibrium" reads as "the reaction stopped".

This suite needs to give students a clear first experience of four things:
- **ΔH vs ΔS.** What sets each sign, in physical and in chemical changes.
- **Reversibility, micro and macro.** Particles keep reacting while the colour and the graph stop changing.
- **Rates meeting.** Graphs show the forward and reverse rates converging.
- **ΔG = ΔH − TΔS as a sign story.** Which way a process goes, and how temperature can flip it.

The sim carries all the teaching (no worksheet). It hands off to the Le Châtelier sim, which introduces K.

---

## Users

**Primary:** AP Chemistry 12 students. They know ΔH and endo/exo (refresh only), rates and collision theory, and Hess's law. **Entropy is new.** This is a **pre-load**: they work through the Guide and Sandbox before a class discussion that unpacks what they saw.

**Context of use:** a laptop in class or at home is the main device. Phone is a nice-to-have. The teacher leads the discussion afterwards.

**Ability spectrum:**
- **Screen reader / keyboard:** prediction chips, sliders, the reaction picker and the graphs all work without a pointer. The graphs get text summaries ("forward and reverse rates are now equal").
- **Low vision / colour vision:** ΔH, ΔS and ΔG signs are carried by + / − glyphs and bar direction, never by colour alone. Species are told apart by both shape and colour.
- **Cognitive load:** entropy is new, so it gets its own paced beats before ΔG combines it with ΔH. The Sandbox stays quiet.
- **Vestibular:** soft particle motion and `prefers-reduced-motion` support (graphs still update; particles slow down or freeze).
- **Not-first-language English:** plain teaching copy and short, consistent labels.

---

## Design Direction

### 1. Guide
Scroll beats beside a sticky stage, with the same pacing as the IMF Guide. The Guide names the ideas: enthalpy, entropy, reversible, dynamic equilibrium, state function, Gibbs free energy. Each example has **predict-then-reveal chips**: students tap + or − for ΔH and ΔS, then reveal the answer with a one-line reason. Nothing is saved or scored.

Draft beat order:
1. **Heat flows.** ΔH refresh. Endo vs exo in physical and chemical changes. Hot/cold packs: CaCl₂ vs NH₄NO₃.
2. **Spreading out.** Entropy from scratch. What makes ΔS + or −: solid → liquid → gas, more moles of gas, dissolving. Ice melting, water evaporating.
3. **Two pulls.** ΔH and ΔS are different things that can agree or disagree. The cold pack is endothermic yet still goes, so entropy wins.
4. **Both arrows.** Reversible reactions. The micro view (particles still reacting) next to the macro view (the colour stops changing).
5. **Rates meet.** Rate vs time and concentration vs time graphs. Dynamic equilibrium means the forward rate equals the reverse rate.
6. **Equilibrium around us.** Sealed soda bottle (CO₂(g) ⇌ CO₂(aq); opening it breaks the closed system). Blood CO₂ / bicarbonate. Ocean CO₂ uptake.
7. **State functions.** Two paths, same Δ. H, S and G depend only on start and end, which links back to Hess's law.
8. **ΔG = ΔH − TΔS.** Four sign cases and a temperature slider. Students watch −TΔS grow until ΔG flips sign. Qualitative only.
9. **What ΔG can't tell you.** Speed (diamond → graphite). ΔH and ΔS drift with temperature, so the flip temperature is only an estimate.
10. **Next.** Hand-off to the Le Châtelier sim, where K is introduced.

### 2. Sandbox
A sealed vessel running a reversible reaction, with the same vessel language as the Le Châtelier sim. Students set the **starting mix** and **temperature**. The page shows:
- **Micro:** particles reacting in both directions, with reaction events still visible at equilibrium.
- **Macro:** a colour or count readout, a concentration vs time graph and a rate vs time graph (forward and reverse rates converging).
- **Gibbs bars:** live ΔH, −TΔS and ΔG bars that show which way the system is driven at this temperature.

Reaction menu (one per sign case):

| Case | Reaction | ΔH | ΔS | Behaviour |
|---|---|---|---|---|
| Flips at high T | N₂O₄ ⇌ 2NO₂ | + | + | Brown colour is the macro cue. Same reaction as the Le Châtelier sim |
| Flips at low T | N₂ + 3H₂ ⇌ 2NH₃ | − | − | Haber. Also in the Le Châtelier sim |
| Always forward | 2O₃ ⇌ 3O₂ | − | + | Earth link (ozone) |
| Never forward | 3O₂ ⇌ 2O₃ | + | − | Same pair as above, reversed |
| Custom | A ⇌ B | toggle | toggle | Students choose the signs and explore the table freely |

There are no force or term labels beyond the bar names. The Sandbox is for observation.

**Emotional / pedagogical target:** "oh, it never actually stops". It should be a curious, calm instrument that sets up the class discussion and the Le Châtelier sim.

---

## Constraints

**Product / curriculum**
- Lives under AP Chem 12, before Equilibrium Simulations.
- Serves the three LI/competency blocks in `DISCOVERY.md`: QP (hypothesize signs, cross-discipline curiosity), PAI (rate graphs, patterns in real reactions), C (lab and everyday experiences, formulas for real phenomena), E (limits of ΔG).
- **No K or Q.** Gibbs stays **qualitative** (no arithmetic, no kJ/J conversion).
- Free navigation, no gates, no scores, sim carries the teaching.

**Technical**
- Vanilla HTML/CSS/JS, no build step, Netlify static.
- Laptop first.
- Kinetics are pedagogical, not exact. Simple mass-action rates tuned so equilibrium is reached in seconds and nothing runs away.
- The ΔG readout uses the real sign, and approximate real ΔH/ΔS values for the real reactions. The flip temperature should fall inside the slider range (about 200–700 K) for the two "flips" cases.

**Visual**
- Toy Box identity: `intermolecular-forces/assets/suite.css`, Space Grotesk + Space Mono.
- Red/yellow stays reserved for charge. ΔH, ΔS and ΔG get their own tokens in the taste pass.
- Must read as one family with `equilibrium_simulations.html`.

**Accessibility**
- Keyboard and non-pointer paths for everything. Meaning never carried by colour alone. Text summaries for the graphs. `prefers-reduced-motion` support.
- No em or en dashes in user-facing copy (`.cursor/rules/no-em-dashes.mdc`).

---

## Existing Design System

**Toy Box (IMF suite), inherited.**
- Tokens and components: `intermolecular-forces/assets/suite.css`. Covers the hub (`.mod-*`, `.path`), the room switcher (`suite-chrome.js`), the Guide layout (`.guide-hero`, `.guide-toc`, `.guide-beat`, `.guide-stage-panel`), the sandbox layout (`.sandbox-layout`, `.controls-row`, `.btn`, `.stage-wrap`) and the gauges and graph cards (`.gauge.mini`, `.heat-curve`).
- Vessel, gauge, graph-modal and species-colour patterns: `equilibrium_simulations.html`.
- Possible engine reuse: `intermolecular-forces/assets/heat-engine.js` (particle jar with solid/liquid/gas) for the phase-change beats.
