# Guide Beat Copy: Intro to Equilibrium (Task 5)

**Date:** 2026-10-30  
**Status:** Approved (2026-10-30). Beat 2 stage uses simple drawn before/after snapshots, not the IMF heat jar.  
**Plan:** `2026-10-30-equilibrium-intro-plan.md` · Task 5  
**Format:** same as the IMF Guide. Each beat has a kicker, a heading, 1–3 short paragraphs, a "Watch / Notice" list and an optional aside. The sticky stage changes per beat.

**Rules applied:** no em or en dashes; vocabulary is **bold** where it is first named; signs always written as + / −; no K or Q; no ΔG arithmetic.

**Prediction chips:** each example card asks the student to tap + or − for ΔH and/or ΔS, then press **Reveal**. The reveal shows the answer and its one-line reason (from `EqReactions.EXAMPLES`). Nothing is saved or scored, and the student can reveal without choosing.

---

## Beat 1 · Heat flows (`beat-heat`)

**Kicker:** Part 1 · Enthalpy  
**Heading:** Where does the heat go?

> You already know this one. **Enthalpy** (H) is the heat stored in a system. **ΔH** is how much it changes. If heat leaves the system and warms the surroundings, ΔH is **negative**: the change is **exothermic**. If heat flows in from the surroundings, ΔH is **positive**: the change is **endothermic**.
>
> The sign comes from a tug between breaking and forming. Breaking bonds or pulling particles apart always costs energy. Forming bonds or letting particles settle together always releases it.

- **ΔH +** when more energy goes into breaking than comes out of forming. Melting and boiling are examples.
- **ΔH −** when forming wins. Burning fuel and freezing are examples.
- **Watch:** the arrows show heat crossing the edge of the system. Ember arrows point in for +, and out for −.

**Stage:** "heat flow" mode. A box labelled "system" with ember arrows crossing its edge, sized by the selected card's ΔH sign. Cards: **Hot pack** (ΔH chip only; its ΔS chip comes back in beat 2) and **Ice melting** (ΔH chip only).

**Aside:** Physical changes like melting and chemical changes like burning both have a ΔH. The rule is the same for both.

---

## Beat 2 · Spreading out (`beat-spread`)

**Kicker:** Part 1 · Entropy  
**Heading:** Things tend to spread out

> Here is a new idea. Drop food colouring into water and it spreads until the colour is even. It never gathers itself back into a drop. **Entropy** (S) measures how spread out a system's particles and energy are. The more ways the particles can be arranged, the higher the entropy.
>
> **ΔS** is the change. Spreading out makes ΔS **positive**. Getting more ordered or more crowded makes ΔS **negative**.

- **Solid → liquid → gas:** each step makes ΔS more positive. A gas has by far the most freedom.
- **More gas particles:** a reaction that makes more gas particles has ΔS +. N₂O₄ → 2NO₂ turns one particle into two.
- **Dissolving:** usually ΔS +, as a neat crystal breaks up into ions that wander through the water.
- **Watch:** the same particles before and after. Count how many ways they could be arranged.

**Stage:** "spread" mode. Before and after particle pictures (lattice → loose → scattered) for the selected card. Cards: **Ice melting**, **Water evaporating**, **Water freezing** (ΔH and ΔS chips), then **Hot pack again** (ΔS chip only; this is the surprise card).

**Aside (shown with the hot pack reveal):** Rules of thumb have exceptions. Ca²⁺ is a small ion with a big charge, so it grabs water molecules and holds them tightly. Those trapped water molecules lose more freedom than the ions gain. Chemists check the data rather than trust the rule.

---

## Beat 3 · Two pulls (`beat-pulls`)

**Kicker:** Part 1 · Enthalpy and entropy together  
**Heading:** Two different pulls

> ΔH and ΔS are not the same thing. ΔH is about **heat**. ΔS is about **spreading**. A change is favoured when it gives off heat (ΔH −), and also when it spreads things out (ΔS +).
>
> Sometimes both pulls point the same way. Sometimes they fight. A cold pack fights. It **takes in** heat, which works against it, yet it still dissolves on its own. Spreading out wins.

- **Both favour it** (ΔH −, ΔS +): it happens.
- **Both oppose it** (ΔH +, ΔS −): it does not happen on its own.
- **They fight:** the winner depends on temperature. That is Part 3.
- **Notice:** in the cold pack, the heat arrow and the spreading arrow point opposite ways.

**Stage:** "two pulls" mode. The ΔH heat arrow (ember) and the ΔS spreading arrow (tide) for the selected card, with no verdict bar yet. Card: **Cold pack** (ΔH and ΔS chips).

---

## Beat 4 · Both arrows (`beat-arrows`)

**Kicker:** Part 2 · Reversible reactions  
**Heading:** Reactions that run both ways

> Many reactions are **reversible**. As soon as products form, some of them react back into reactants. We write this with a double arrow: ⇌.
>
> Here is N₂O₄ ⇌ 2NO₂ in a sealed vessel. N₂O₄ is colourless and NO₂ is brown. Watch the colour (what you would see in the lab), then watch the particles (what you would see if you could zoom in).

- **Macro:** the colour darkens, then holds steady.
- **Micro:** particles keep splitting and joining. They never stop.
- **Watch:** each ring is one reaction event. Count them after the colour stops changing.

**Stage:** vessel, `{ reaction: 'n2o4', T: 400, mix: 'reactants' }`, with molecule counts. No graphs yet. Controls: Start over · Pause.

**Aside:** The bottle looks finished, but it is not. Both reactions are still happening at the same speed.

---

## Beat 5 · Rates meet (`beat-rates`)

**Kicker:** Part 2 · Rates and equilibrium  
**Heading:** When the rates meet

> At the start there is only N₂O₄, so the forward reaction is fast and the reverse is zero. As NO₂ builds up, the forward rate slows (fewer N₂O₄ left to split) and the reverse rate speeds up (more NO₂ to join).
>
> Eventually the two rates are **equal**. From then on, every NO₂ made is matched by one used up. The amounts stop changing even though both reactions continue. This is **dynamic equilibrium**.

- **Amount graph:** the lines curve, then go flat.
- **Rate graph:** the forward line falls and the reverse line rises until they meet.
- **Equilibrium does not mean equal amounts.** It means equal **rates**.
- **Try:** start with products instead. The rates still meet, from the other side.

**Stage:** vessel plus the amount and rate graphs, `{ reaction: 'n2o4', T: 400 }`, with start-mix buttons (Reactants / Products).

**Aside:** You already know rates from collision theory. Equilibrium is what happens when two opposite rates balance.

---

## Beat 6 · Equilibrium around us (`beat-around`)

**Kicker:** Part 2 · Everywhere  
**Heading:** Equilibrium is all around you

> A sealed soda bottle is a system at equilibrium. CO₂ gas above the drink dissolves into the liquid at the same rate as dissolved CO₂ escapes. The fizz stays put. Open the cap and the system is no longer closed, so the gas escapes faster than it returns.
>
> The same balance shows up far from the chemistry lab.

- **Your blood:** CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻ keeps your blood's acidity steady. Breathing faster removes CO₂ and shifts the balance.
- **The ocean:** CO₂(g) ⇌ CO₂(aq). Cold water holds more CO₂ than warm water, so warming oceans can take up less.
- **Notice:** each one needs a closed system and two opposite processes running at the same rate.

**Stage:** "cards" mode. Three cards: **Sealed soda bottle** (ΔH and ΔS chips), **Carbon dioxide in your blood** (context only, no chips), **Carbon dioxide in the ocean** (ΔH and ΔS chips).

**Aside:** Where else might two opposite processes balance? Think about population in an ecosystem, or water evaporating and raining back down.

---

## Beat 7 · State functions (`beat-state`)

**Kicker:** Part 3 · State functions  
**Heading:** Only the start and finish matter

> Climb a mountain by the steep trail or the long switchbacks. Either way your change in height is the same, because it depends only on where you started and where you finished. The distance you walked is different for each route.
>
> H, S and G are **state functions**. Like height, their change depends only on the start and end states, not the path. That is why Hess's law works: add up any route of steps and you get the same ΔH. Heat and work are **not** state functions. They depend on the path, like the distance walked.

- **State functions:** H, S, G (and height, temperature, pressure).
- **Path-dependent:** heat, work (and distance walked).
- **Watch:** two different routes between the same start and end give the same Δ.

**Stage:** "two paths" picture. Start and end states on an energy axis; a one-step route and a two-step route both span the same ΔH, with Δ bracket labels on each.

---

## Beat 8 · Gibbs free energy (`beat-gibbs`)

**Kicker:** Part 3 · Gibbs free energy  
**Heading:** Temperature picks the winner

> Combine the two pulls into one number, **Gibbs free energy**:
>
> **ΔG = ΔH − TΔS**
>
> If **ΔG is negative**, the reaction goes forward on its own; we call it **spontaneous**. If ΔG is positive, the reverse is favoured. The T in the middle is the temperature in kelvin. The hotter it gets, the more the entropy pull (−TΔS) counts.

- **The bars:** ΔH stays put. −TΔS stretches as you drag T. ΔG is where they land together.
- **When the pulls fight,** dragging T across a certain point flips ΔG's sign.
- **Try:** N₂O₄ ⇌ 2NO₂ (ΔH +, ΔS +). Cold, ΔG is +; hot, ΔG is −.
- **Try:** Haber (ΔH −, ΔS −). It flips the other way.

**Stage:** vessel plus Gibbs bars plus a temperature slider; reaction picker limited to N₂O₄ and Haber; the **four-case sign table** below the bars with the current case highlighted:

| | ΔS + | ΔS − |
|---|---|---|
| **ΔH −** | Forward at every temperature | Forward only when cold |
| **ΔH +** | Forward only when hot | Never forward on its own |

**Aside:** "Spontaneous" does not mean fast or sudden. It only means "goes this way without being pushed". See the next beat.

---

## Beat 9 · What ΔG can't tell you (`beat-limits`)

**Kicker:** Part 3 · Limits  
**Heading:** What the formula leaves out

> ΔG is powerful, but it is a model, and every model has limits.
>
> **It says nothing about speed.** Diamond turning into graphite has ΔG −, so it is spontaneous at every temperature. It also takes millions of years. ΔG tells you which way a reaction can go. Rates (and collision theory) tell you how fast.
>
> **It assumes ΔH and ΔS stay fixed.** Real values drift as temperature changes, so the flip temperature you find with ΔG = ΔH − TΔS is an estimate, not an exact answer.

- **Which way:** ΔG.
- **How fast:** rates and activation energy.
- **Notice:** a "spontaneous" reaction can still need a spark to get started (think of a match).

**Stage:** "cards" mode. **Diamond to graphite** card (ΔH and ΔS chips, then the context line).

**Aside:** Can you think of another reaction that "should" happen but doesn't seem to? (Paper burning in air is one.)

---

## Beat 10 · Next (`beat-next`)

**Kicker:** Before you leave  
**Heading:** What to take with you

> - ΔH is heat flow. ΔS is spreading out. They are different pulls.
> - Many reactions run both ways. At equilibrium the **rates** are equal, and both directions keep going.
> - ΔG = ΔH − TΔS. Temperature decides who wins when the pulls fight.
> - ΔG tells you which way, not how fast.
>
> Next, open the **Sandbox** and try every reaction at different temperatures. Then open **Equilibrium Simulations** to push a system at equilibrium and watch it respond.

**Stage:** vessel running the custom A ⇌ B with ΔH/ΔS sign toggles (a preview of the Sandbox).

---

## Coverage check (every LI / competency hits at least one beat)

| Learning intention / competency | Beats |
|---|---|
| Distinguish enthalpy and entropy | 1, 2, 3 |
| Apply ΔH / ΔS in physical and chemical systems | 1, 2 (phase changes, N₂O₄), 3 |
| Factors that influence the sign of ΔH and ΔS | 1, 2 |
| QP: hypothesize ΔH from prior understanding | 1, 2, 3, 6, 9 (prediction chips) |
| C: express and reflect on experiences in and out of the lab | 1 (packs), 6 (soda, blood, ocean), 9 (match) |
| Macro vs micro characteristics of equilibrium | 4 |
| Many important reactions are reversible | 4, 6 |
| Equilibrium is all around us | 6 |
| Connections between rates and equilibrium | 5, 9 |
| Graphs illustrate equilibrium; PAI: analyze rate graphs | 5 |
| QP: connections to other disciplines | 6 (biology, Earth science) |
| PAI: patterns in reactions from our environment | 6, 8 |
| Mathematical relationship between H and S | 8 |
| Use ΔG to predict direction, in general and mathematically | 8 (sign form of ΔG = ΔH − TΔS) |
| State functions | 7 |
| C: formulas that describe real phenomena | 8 |
| E: limitations of the formula and real-life applications | 9 |
