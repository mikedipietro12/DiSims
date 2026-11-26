# Design Strategy: Intro to Equilibrium (AP Chem 12)

**Date:** 2026-10-30  
**Status:** Approved (2026-10-30)  
**Brief:** `docs/designpowers/briefs/2026-10-30-equilibrium-intro.md`

---

## Design Principles

### 1. It never stops (micro under macro)
**The principle:** Students should always be able to see that particles keep reacting while the macro view (colour, graph, counts) holds steady.  
**In practice:** Reaction events stay visible at equilibrium. The particle view and the graph sit side by side. Forward and reverse rates are drawn as two lines that meet, not as one line going to zero.  
**We will NOT:** Freeze the particles at equilibrium, or show a single "net" rate that suggests the reaction has finished.

### 2. Two pulls, one verdict
**The principle:** ΔH and ΔS are separate ideas. ΔG is how they combine at a given temperature.  
**In practice:** Entropy gets its own beats before ΔG appears. The Gibbs bars always show ΔH and −TΔS as separate pieces that stack into ΔG. The temperature slider visibly stretches only the −TΔS piece.  
**We will NOT:** Show a single "spontaneity" meter with no visible parts, or blur enthalpy and entropy into one "energy" idea.

### 3. Signs before sums
**The principle:** Gibbs is a sign story here (no arithmetic, no units).  
**In practice:** Bars carry + / − glyphs and direction. The four-case table is a picture, not a calculator. The flip temperature is shown as a point where a bar crosses zero, not as a computed number.  
**We will NOT:** Ask for ΔH/ΔS values, show kJ vs J conversions, or show K or Q (those belong to the Le Châtelier sim).

### 4. Name once, then go quiet (from IMF)
**The principle:** The Guide is where vocabulary is born. The Sandbox protects discovery.  
**In practice:** The Guide names ideas and uses predict-then-reveal chips. The Sandbox has only bar and axis names, with no narration and no "you reached equilibrium!" banner.  
**We will NOT:** Narrate the Sandbox, score predictions, or gate the Sandbox behind the Guide.

### 5. Meaning survives without colour, pointer or motion (from IMF)
**The principle:** Every sign, rate and state can be read by keyboard, by screen reader, with colour-blindness and with reduced motion.  
**In practice:** + / − glyphs on all bars and chips. Text summaries of the graphs in a live region. Sliders and chips are keyboard-operable. With reduced motion the particles freeze but the graphs and bars still update.  
**We will NOT:** Use colour alone for ΔH/ΔS/ΔG sign or species, or make drag the only way to change T or the mix.

---

## Family Position

| Reference | Role | Our differentiation |
|---|---|---|
| `equilibrium_simulations.html` (Le Châtelier) | The next step: K, Q, stresses | Same vessel, gauges and type. This suite adds the *why* (ΔH/ΔS/ΔG) and the *how it gets there* (rates meeting). No K or Q, so the two don't overlap |
| `intermolecular-forces/` (IMF suite) | Process and identity parent | Same Guide/Sandbox posture and Toy Box look, applied to energy and time rather than forces |
| `collision_theory.html`, `rate-laws/` | Prior knowledge | Rates come back as "two rates that meet", not as rate laws |
| PhET "Reversible Reactions" (general reference) | Particle-level reversibility | We add Gibbs bars and real reactions, and the sim carries the teaching |

---

## Experience Map

AP 12 hub → **Intro to Equilibrium hub** → **Guide** (10 beats, predict-then-reveal chips, about 20 min) → **Sandbox** (try each sign case, change T, watch the rates meet, about 10 min) → **Le Châtelier sim** (K, stresses) → class discussion.

Emotional arc: "I know ΔH" (comfortable) → "entropy is a new kind of pull" (curious) → "it never actually stops" (surprised) → "temperature decides the winner" (aha) → "but it can't tell me how fast" (healthy doubt).

---

## Success Metrics

- **Without prompting,** students can say that ΔH is heat flow and ΔS is spreading out, and that these are different things.
- **Students predict the signs** of ΔH and ΔS for a phase change and a gas reaction before revealing them.
- **Students describe equilibrium** as "the rates are equal" rather than "the reaction stopped".
- **Students can read the rate graph** and point to the moment the two rates meet.
- **For a (+,+) or (−,−) reaction,** students can say which way temperature flips it.
- **Students can name one limit of ΔG** (speed, or ΔH/ΔS changing with T).

---

## Constraints and Trade-offs

| Trade-off | Choice | Why |
|---|---|---|
| Real ΔH/ΔS vs clean teaching values | Real-ish values for the real reactions; custom A⇌B uses tidy values | Honesty for the real menu, freedom for the sign table |
| Real kinetics vs readable kinetics | Mass-action rates scaled so equilibrium arrives in about 5–10 s | Students need to see the rates meet before they lose interest |
| Coupling ΔG to where the vessel settles | The vessel favours products when ΔG<0 and reactants when ΔG>0, without showing K | Sandbox behaviour has to agree with the bars, but without introducing K |
| One shared engine vs separate Guide demos | One vessel engine reused by the Guide stage and the Sandbox | One kit, fewer bugs. The Guide stage just runs scripted presets |
| Heat-engine reuse for the phase beats | Reuse `heat-engine.js` (particle jar) for the ice/evaporation beats if it fits cleanly; otherwise draw a simple picture | Avoid a second phase engine |
