# ICE Tables: section plan

**Date:** 2026-11-20
**Status:** Signed off and built 2026-11-20 (`ice-tables.html`, `assets/ice-ui.js`, `assets/ice-data.js`, `assets/ice-guide.js`, `assets/ice.css`). `assets/ice-data.js` is now the source of truth for the steps.
**Page:** `equilibrium-intro/ice-tables.html`, the fourth tile on the Unit 2 hub, after Equilibrium Simulations.
**Purpose:** teach students to fill in an ICE table themselves. The simulation supports the worked logic; it does not lead.

**Format:** the same Guide layout as `guide.html` and the Solubility Guide: sections scroll on one side, a sticky stage beside them, and a presentation view that steps through the sections. No Design Powers discovery or taste pass: tokens, voice and components are inherited.

**Rules applied:**
- Teacher's voice (`VOICE.md`): "we", labelled lines, one idea per line, ends by pointing at the simulation and the button to press.
- Hebden wording is used for problem statements and for Hebden's rules (the "IMPORTANT" boxes), with the teacher's OK (2026-11-20).
- Practice problems are new. Hebden's practice set (Q50 to Q60) was a reference only; no reactions or numbers are reused from it.
- Concentration and mole conversions are unit analysis (`SolUI.ua`); K and Q are substitution (repo `AGENTS.md`, Calculations).
- **K<sub>c</sub> and K<sub>p</sub>** (teacher, 2026-11-20: AP course, K<sub>p</sub> is part of it). Hebden's K<sub>eq</sub> is printed as K<sub>c</sub> in the problem cards; the opening section says Hebden writes K<sub>eq</sub>. Section 8 adds a K<sub>p</sub> example (not in Hebden).
- No em or en dashes; curly quotes; Canadian spelling.

---

## How each example section works

Each example has the same four stages, in this order (teacher, 2026-11-20):

| Stage | What is on screen | Control |
|---|---|---|
| **1. Problem** | The Hebden problem card, word for word. Under it, Hebden's **Preliminary analysis** where Hebden has one (B, D, F). | |
| **2. Walk-through** | Worked steps fill one line per tap, with a reason under each line. The ICE table fills row by row as the steps reach it. | “Next step” |
| **3. Your turn** | A new problem with the same structure. A blank **fillable ICE table** plus answer boxes for the working. | “Check” |
| **4. Answer** | The full table and working for the Your turn problem, in the same step format as the walk-through. | “Show the answer” |

The particle bulb appears only in **B, D and F**, where it makes a step clearer. Everywhere else the stage is the problem card, the table and the working.

---

## New component: the fillable ICE table

This is the one new piece. Everything else is reused (see "Build notes").

- The equation row and the I / C / E labels are given. Every other cell is a text box.
- Accepted entries: numbers (`0.250`, `.25`, `2.00`), and simple expressions in x (`+x`, `-2x`, `0.80 - x`, `X − 0.800`). Case doesn't matter, and either the keyboard minus or the − sign works.
- Expressions are checked for being equal, not for matching exactly: `0.80 - x` and `-x + 0.80` both count. Numbers are checked to within half a unit in the last digit of the answer.
- **Check** marks each wrong cell red and each right cell green. Blank cells are left alone.
- **Show this cell** on a wrong cell fills in the answer and greys it, so a student who is stuck can move on.
- Answer boxes under the table (K, x, the final concentration or moles) are checked the same way.
- Nothing is saved. Reloading clears the table.
- In presentation view the cells are large enough to type into on a projector or tablet.

---

## 0 · Before we begin

**Heading:** ICE Tables

**Learning intentions** (draft, for the teacher to rewrite)
- We will learn when a problem needs an ICE table and when it doesn't.
- We will learn how to fill in an ICE table, one row at a time, using the coefficients of the balanced equation.
- We will use the E row to calculate K<sub>c</sub>, or to calculate an unknown concentration.

**Stage:** the hub tile animation, large.

---

## 1 · Where does ICE come from? (`ice-intro`)

**Heading:** What is an ICE table?

> When a reaction runs, the concentrations change until the system reaches equilibrium. An ICE table is how we keep track of those changes.
>
> **I: Initial.** The concentrations at the start, before the reaction shifts.
> **C: Change.** How much each concentration goes up or down as the reaction shifts.
> **E: Equilibrium.** The concentrations once the system has reached equilibrium.
>
> Every column follows one rule: **I + C = E.**
>
> **Other names:** Hebden labels the same rows **START**, **+Δ** and **= EQUIL**, so the rule reads START + Δ = EQUIL. Some textbooks add a fourth row on top for the Reaction and call it a **RICE** table. They all work the same way.
>
> **Recall:** K<sub>c</sub> is the same K we built in the Guide: products over reactants, each raised to its coefficient.

**Hebden's rules, word for word, as a short list under the text:**
- The values put into such a table MUST ALWAYS HAVE UNITS OF MOLES/L.
- The values in the Δ-line obey the stoichiometry of the reaction coefficients.
- Because the Δ-values represent a shift, the Δ-values on one side of an equation will always be POSITIVE, while the Δ-values on the other side will always be NEGATIVE.

**Stage:** an empty ICE table for 2 NO(g) + O₂(g) ⇌ 2 NO₂(g). Pressing “Next step” lights up each row in turn with its three names (I / START / Initial, and so on), then shows the arrows for I + C = E down one column.

---

## 2 · Example A: is time passing? (`ex-a`)

**Heading:** Does This Problem Need an ICE Table?

> The first question we ask is whether time passes in the problem.
> If the problem only describes a system that is already at equilibrium, there is nothing to keep track of. We go straight to K<sub>c</sub>.
> If something is put in a container and then left to react, the concentrations change. Therefore, we need an ICE table.
>
> Click the “Next step” button to see how we find K<sub>c</sub> when nothing changes.

**Problem card (Hebden, Example A):**
> A 2.0 L bulb contains 6.00 mol of NO₂(g), 3.0 mol of NO(g) and 0.20 mol of O₂(g) at equilibrium. What is K<sub>c</sub> for 2 NO(g) + O₂(g) ⇌ 2 NO₂(g)?

**Walk-through:**

| Line | Reason under it |
|---|---|
| K<sub>c</sub> = [NO₂]² / [NO]²[O₂] | First, determine the equilibrium expression |
| [NO₂] = 6.0 mol NO₂ / 2.0 L = 3.0 mol/L | Next, use the data to calculate the concentrations required |
| [NO] = 3.0 mol NO / 2.0 L = 1.5 mol/L | |
| [O₂] = 0.20 mol O₂ / 2.0 L = 0.10 mol/L | |
| K<sub>c</sub> = (3.0)² / (1.5)²(0.10) = **40** | Substitute these values into the K<sub>c</sub> expression |

**Hebden note, under the working:** Ignore the UNITS of K<sub>c</sub> since they depend on the particular equilibrium equation and have little or no significance at this time.

**Your turn:**
> A 4.0 L flask contains 1.60 mol of N₂(g), 2.40 mol of H₂(g) and 1.00 mol of NH₃(g) at equilibrium. What is K<sub>c</sub> for N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g)?

No table for this one. Answer boxes: the three concentrations, then K<sub>c</sub>.

**Answer:** [N₂] = 0.400 mol/L, [H₂] = 0.600 mol/L, [NH₃] = 0.250 mol/L. K<sub>c</sub> = (0.250)² / (0.400)(0.600)³ = **0.723**

---

## 3 · Example B: from a start to an equilibrium (`ex-b`)

**Heading:** Filling In an ICE Table

> Example B has a sense of time passing: NO₂ is put in a bulb, and then the reaction runs until it reaches equilibrium. Therefore, we need an ICE table.
> We fill in what we know first, then use the coefficients to fill in the rest.
>
> Click the “Next step” button to fill in the ICE table one row at a time.

**Problem card (Hebden, Example B):**
> 4.00 mol of NO₂(g) is introduced into a 2.00 L bulb. After a while equilibrium is attained according to the equation 2 NO(g) + O₂(g) ⇌ 2 NO₂(g). At equilibrium, 0.500 mol of NO(g) is found. What is the K<sub>c</sub> value?

**Preliminary analysis (Hebden):** Notice that there is a distinct sense of time passing: NO₂ was put in a bulb, then time passed until equilibrium occurred. This means you have to distinguish between concentrations at the START and concentrations at EQUILIBRIUM.

**Walk-through:**

| Line | Reason under it | Table / bulb |
|---|---|---|
| K<sub>c</sub> = [NO₂]² / [NO]²[O₂] | First, determine the equilibrium expression | |
| [NO₂]<sub>I</sub> = 4.00 mol NO₂ / 2.00 L = 2.00 mol/L | Calculate the concentrations we can find straight from the data | |
| [NO]<sub>E</sub> = 0.500 mol NO / 2.00 L = 0.250 mol/L | | |
| I row: 0, 0, 2.00 | We assume [NO] = [O₂] = 0 at the start, since they were not put in the bulb | I row fills. Bulb: NO₂ only |
| E row: 0.250 under NO | The one equilibrium value we know | NO's E cell fills |
| C for NO: +0.250 | Since I + C = E, the change in NO must be +0.250 | NO's C cell fills |
| C for O₂: +0.125 | O₂'s coefficient (1) is half of NO's (2), so its change is half: ½ × 0.250 | |
| C for NO₂: −0.250 | NO₂'s coefficient (2) equals NO's (2), so its change is the same size. It is negative: the reaction used up NO₂ to make NO and O₂ | Bulb runs: NO₂ drops, NO and O₂ appear. A tally counts each 2 NO₂ → 2 NO + O₂ |
| E row: 0.250, 0.125, 1.75 | I + C = E down each column | E row fills |
| K<sub>c</sub> = (1.75)² / (0.250)²(0.125) = **392** | Finally, substitute the equilibrium concentrations into the K<sub>c</sub> expression | |

**Hebden rule, under the table:** Because the Δ-values represent a shift, the Δ-values on one side of an equation will always be POSITIVE, while the Δ-values on the other side will always be NEGATIVE.

**Bulb scale:** 1 particle = 0.0625 mol/L. NO₂ 32 → 28, NO 0 → 4, O₂ 0 → 2.

**Your turn:**
> 4.00 mol of NOBr(g) is placed in a 2.00 L flask. Equilibrium is reached according to the equation 2 NOBr(g) ⇌ 2 NO(g) + Br₂(g). At equilibrium, 0.500 mol of Br₂(g) is found. What is the K<sub>c</sub> value?

This one starts on the reactant side, so the signs are the other way round from the sample.

**Answer:**

| | 2 NOBr | 2 NO | Br₂ |
|---|---|---|---|
| I | 2.00 | 0 | 0 |
| C | −0.500 | +0.500 | +0.250 |
| E | 1.50 | 0.500 | 0.250 |

K<sub>c</sub> = (0.500)²(0.250) / (1.50)² = **0.0278**

---

## 4 · Example C: an unknown starting amount (`ex-c`)

**Heading:** When the Start Is Unknown

> Sometimes the value we don't know is in the I row. We give it a letter, X, and carry it through the table.
> We will not need the quadratic formula in this course. Whenever it looks like we do, we can take the square root of both sides instead.
>
> Click the “Next step” button to see how X moves through the table.

**Problem card (Hebden, Example C):**
> A certain amount of NO₂(g) was introduced into a 5.00 L bulb. When equilibrium was attained according to the equation 2 NO(g) + O₂(g) ⇌ 2 NO₂(g), the concentration of NO(g) was 0.800 M. If K<sub>c</sub> has a value of 24.0, how many moles of NO₂ were originally put into the bulb?

**Walk-through:**

| Line | Reason under it |
|---|---|
| I row: 0, 0, X | [NO₂]<sub>I</sub> is unknown, so we use a variable. [NO] = [O₂] = 0 can be assumed from the problem statement |
| E row: 0.800 under NO | Given in the problem |
| C row: +0.800, +0.400, −0.800 | I + C = E gives +0.800 for NO. The C row is in a 2 : 1 : 2 ratio. Some of the starting NO₂ reacts, so its change is a decrease |
| E row: 0.800, 0.400, X − 0.800 | I + C = E down each column |
| 24.0 = (X − 0.800)² / (0.800)²(0.400) | Substitute the E row into the K<sub>c</sub> expression |
| (X − 0.800)² = (24.0)(0.800)²(0.400) = 6.144 | Multiply both sides by the bottom |
| X − 0.800 = 2.479 | Take the square root of both sides |
| X = 3.279 mol/L = [NO₂]<sub>I</sub> | |
| 3.279 mol NO₂ / 1 L × 5.00 L = **16.4 mol NO₂** | The question asks for moles, not concentration (unit analysis, L cancels) |

**Your turn:**
> A certain amount of NO(g) is placed in a 2.00 L flask. Equilibrium is reached according to the equation N₂(g) + O₂(g) ⇌ 2 NO(g), and 0.300 mol of N₂(g) is found. If K<sub>c</sub> = 0.0400, how many moles of NO were originally placed in the flask?

**Answer:**

| | N₂ | O₂ | 2 NO |
|---|---|---|---|
| I | 0 | 0 | X |
| C | +0.150 | +0.150 | −0.300 |
| E | 0.150 | 0.150 | X − 0.300 |

0.0400 = (X − 0.300)² / (0.150)(0.150) → square root: 0.200 = (X − 0.300) / 0.150 → X − 0.300 = 0.0300 → X = 0.330 mol/L.
0.330 mol NO / 1 L × 2.00 L = **0.660 mol NO**

---

## 5 · Example D: which way will it shift? (`ex-d`)

**Heading:** Which Way Will It Shift?

> Not every problem asks for a number. Sometimes it asks for a decision.
> We calculate Q, the **reaction quotient**, using the starting concentrations. It is the same expression as K<sub>c</sub>, at any moment.
> If Q = K<sub>c</sub>, the system is at equilibrium.
> If Q is LESS than K<sub>c</sub>, the reaction must shift to produce more PRODUCTS.
> If Q is GREATER than K<sub>c</sub>, the reaction must shift to produce more REACTANTS.
>
> Click the “Next step” button to compare Q with K<sub>c</sub>.

**Problem card (Hebden, Example D):**
> K<sub>c</sub> = 49 for 2 NO(g) + O₂(g) ⇌ 2 NO₂(g). If 2.0 mol of NO(g), 0.20 mol of O₂(g) and 0.40 mol of NO₂(g) are put into a 2.0 L bulb, which way will the reaction shift in order to reach equilibrium?

**Preliminary analysis (Hebden):** This question is NOT asking us to find a numerical value; rather, it is asking us for a DECISION. When dealing with numbers, decisions are often based on comparisons of two numbers: “Is A bigger than, less than, or equal to B?”

**Walk-through:**

| Line | Reason under it | Stage |
|---|---|---|
| Q = [NO₂]² / [NO]²[O₂] | Q has the same expression as K<sub>c</sub> | |
| [NO]<sub>I</sub> = 2.0 mol NO / 2.0 L = 1.0 mol/L, [O₂]<sub>I</sub> = 0.10 mol/L, [NO₂]<sub>I</sub> = 0.20 mol/L | Calculate the starting concentrations | Bulb fills with the starting mix |
| Q = (0.20)² / (1.0)²(0.10) = 0.40 | Calculate the reaction quotient | Q vs K<sub>c</sub> gauge: Q at 0.40, K<sub>c</sub> at 49 |
| 0.40 < 49 | Q is too small | |
| **The reaction must shift to the product side** | To increase the value of Q up to the required value for K<sub>c</sub> | Bulb runs: NO and O₂ drop, NO₂ rises; the Q needle climbs to K<sub>c</sub> |

No ICE table here: there is no number to find. The section ends by pointing out that the ICE table in the next examples starts from exactly this kind of shift.

**Bulb scale:** 1 particle = 0.05 mol/L. NO 20, O₂ 2, NO₂ 4 at the start.

**Your turn** (three parts; each has a Q answer box and three buttons: shifts to products / shifts to reactants / at equilibrium):
> K<sub>c</sub> = 0.20 for N₂O₄(g) ⇌ 2 NO₂(g) at a certain temperature. Which way will the reaction shift, if at all, when each mixture is placed in the flask?
> a) 0.40 mol of N₂O₄ and 0.20 mol of NO₂ in a 2.0 L flask
> b) 0.10 mol of N₂O₄ and 0.60 mol of NO₂ in a 2.0 L flask
> c) 0.50 mol of N₂O₄ and 0.50 mol of NO₂ in a 2.5 L flask

**Answer:** a) Q = 0.050 < K<sub>c</sub>: shifts to products. b) Q = 1.8 > K<sub>c</sub>: shifts to reactants. c) Q = 0.20 = K<sub>c</sub>: already at equilibrium.

---

## 6 · Example E: x on the C row (`ex-e`)

**Heading:** Letting x Be the Change

> When we don't know any value in the C or E rows, we let the variable be the **change in concentration** of one species.
> The coefficients tell us how the other changes compare. The side that started at zero must gain, so the other side must lose.
>
> Click the “Next step” button to see how x fills the table, then how the square root solves it.

**Problem card (Hebden, Example E):**
> K<sub>c</sub> = 3.5 for SO₂(g) + NO₂(g) ⇌ SO₃(g) + NO(g). If 4.0 mol of SO₂(g) and 4.0 mol of NO₂(g) are placed in a 5.0 L bulb and allowed to come to equilibrium, what concentration of all species will exist at equilibrium?

**Walk-through:**

| Line | Reason under it |
|---|---|
| K<sub>c</sub> = [SO₃][NO] / [SO₂][NO₂] | First, write out the equilibrium expression |
| [SO₂]<sub>I</sub> = [NO₂]<sub>I</sub> = 4.0 mol / 5.0 L = 0.80 mol/L | Starting concentrations, by unit analysis |
| I row: 0.80, 0.80, 0, 0 | |
| C row: −x, −x, +x, +x | The coefficients are 1 : 1 : 1 : 1, so every change is x. The products started at zero, so they must gain |
| E row: 0.80 − x, 0.80 − x, x, x | I + C = E |
| 3.5 = x² / (0.80 − x)² | Substitute the E row |
| 1.87 = x / (0.80 − x) | This does NOT need the quadratic formula: take the square root of both sides |
| x = 0.52 | Solve for x |
| [SO₃] = [NO] = x = **0.52 M**, [SO₂] = [NO₂] = 0.80 − x = **0.28 M** | Read the answers from the E row |

**Your turn:**
> K<sub>c</sub> = 64 for H₂(g) + Br₂(g) ⇌ 2 HBr(g) at a certain temperature. If 0.600 mol of H₂(g) and 0.600 mol of Br₂(g) are placed in a 2.00 L flask and allowed to come to equilibrium, what concentration of each substance will exist at equilibrium?

One new step from the sample: HBr's coefficient is 2, so its change is +2x.

**Answer:**

| | H₂ | Br₂ | 2 HBr |
|---|---|---|---|
| I | 0.300 | 0.300 | 0 |
| C | −x | −x | +2x |
| E | 0.300 − x | 0.300 − x | 2x |

64 = (2x)² / (0.300 − x)² → square root: 8.0 = 2x / (0.300 − x) → x = 0.240.
[HBr] = **0.480 M**, [H₂] = [Br₂] = **0.060 M**

---

## 7 · Example F: adding to a system at equilibrium (`ex-f`)

**Heading:** Disturbing an Equilibrium

> When something is added to a system that is already at equilibrium, we use Le Châtelier's principle, but now with numbers.
> First we need K<sub>c</sub>, from the equilibrium before anything was added.
> Then the addition goes on the I row. The system will not shift on its own; something has to cause the shift.
>
> Click the “Next step” button to find K<sub>c</sub>, then add the SO₂.

**Problem card (Hebden, Example F):**
> A 1.0 L reaction vessel contained 1.0 mol of SO₂, 4.0 mol of NO₂, 4.0 mol of SO₃ and 4.0 mol of NO at equilibrium according to SO₂(g) + NO₂(g) ⇌ SO₃(g) + NO(g). If 3.0 mol of SO₂ is added to the mixture, what will be the new concentration of NO when equilibrium is re-attained?

**Preliminary analysis (Hebden):** You are NOT given the value for K<sub>c</sub>. You ARE told the amount of each gas previously present at equilibrium. This information will allow you to calculate a value for K<sub>c</sub>.

**Walk-through:**

| Line | Reason under it | Bulb |
|---|---|---|
| K<sub>c</sub> = (4.0)(4.0) / (1.0)(4.0) = 4.0 | First find the value of K<sub>c</sub> from the first equilibrium | At equilibrium: 3, 12, 12, 12 |
| K<sub>c</sub> stays 4.0 | There is no mention of the temperature changing | |
| I row: 1.0 + 3.0, 4.0, 4.0, 4.0 | Any ADDITION (or REMOVAL) is shown on the START line | “+3.0 mol SO₂” drops 9 particles in |
| C row: −x, −x, +x, +x | The system shifts to use up some of the added SO₂, so SO₂'s change is −x | Bulb runs: SO₂ and NO₂ drop, SO₃ and NO rise |
| E row: 4.0 − x, 4.0 − x, 4.0 + x, 4.0 + x | I + C = E | Settles at 8, 8, 16, 16 |
| 4.0 = (4.0 + x)² / (4.0 − x)² | Substitute | |
| 2.0 = (4.0 + x) / (4.0 − x) | Take the square root | |
| x = 1.33 | | |
| [NO] = 4.0 + x = **5.3 M** | | |

**Bulb scale:** 1 particle = ⅓ mol/L.

**Your turn:**
> A 2.0 L reaction vessel contains 0.40 mol of CO, 1.60 mol of NO₂, 2.40 mol of CO₂ and 2.40 mol of NO at equilibrium according to CO(g) + NO₂(g) ⇌ CO₂(g) + NO(g). If 1.20 mol of CO is added to the mixture, what will be the new concentration of NO when equilibrium is re-attained?

**Answer:**
K<sub>c</sub> = (1.20)(1.20) / (0.20)(0.80) = 9.0

| | CO | NO₂ | CO₂ | NO |
|---|---|---|---|---|
| I | 0.20 + 0.60 | 0.80 | 1.20 | 1.20 |
| C | −x | −x | +x | +x |
| E | 0.80 − x | 0.80 − x | 1.20 + x | 1.20 + x |

9.0 = (1.20 + x)² / (0.80 − x)² → square root: 3.0 = (1.20 + x) / (0.80 − x) → x = 0.30.
[NO] = 1.20 + 0.30 = **1.50 M**

---

## 8 · Example G: K<sub>p</sub> with partial pressures (`ex-kp`)

**Heading:** K<sub>p</sub>: ICE Tables With Pressures

> When every substance is a gas, we can also write K using **partial pressures**. This is **K<sub>p</sub>**.
> **K<sub>c</sub>:** uses concentrations, in mol/L. **K<sub>p</sub>:** uses partial pressures, in atm.
> In a sealed flask at a constant temperature, the pressure of each gas goes up and down with its moles. Therefore, the ICE table works the same way.
> **Total pressure:** the sum of all the partial pressures. Sometimes it is the only equilibrium value we are given.

**Problem card (new):** N₂O₄(g) is placed in an empty flask at a pressure of 1.00 atm. At equilibrium, the total pressure is 1.40 atm. What is K<sub>p</sub> for N₂O₄(g) ⇌ 2 NO₂(g)?
**Answer:** I 1.00, 0; C −x, +2x; E 1.00 − x, 2x. P<sub>total</sub> = 1.00 + x = 1.40, x = 0.40. K<sub>p</sub> = (0.80)² / 0.60 = **1.1**

**Your turn:** COCl₂(g) at 2.00 atm; total 2.50 atm at equilibrium; COCl₂(g) ⇌ CO(g) + Cl₂(g). x = 0.50; K<sub>p</sub> = (0.50)(0.50) / 1.50 = **0.17**

Not included (ask the teacher): the K<sub>p</sub> = K<sub>c</sub>(RT)<sup>Δn</sup> conversion.

---

## 9 · Before we leave (`ice-summary`)

**Heading:** What to Take With You

> **Does time pass?** If not, go straight to K<sub>c</sub>. If it does, set up an ICE table.
> **Units:** every value in the table is in mol/L. Convert moles first.
> **Fill what we know first,** then use I + C = E.
> **The C row follows the coefficients.** One side is positive, the other side is negative.
> **Additions and removals go on the I row.**
> **No quadratic formula:** take the square root of both sides.
> **A decision, not a number?** Compare Q with K<sub>c</sub>.

**Stage:** a blank fillable table with a picker of all six practice reactions, for extra practice with fresh numbers (stretch goal, can come later).

---

## Build notes

- **Reuse:** the Guide layout and presentation view from `equilibrium-intro/guide.html`; `SolUI.steps` (worked steps with ICE rows), `SolUI.ua` (unit analysis) and `SolUI.qvk` (Q vs K gauge, relabelled K<sub>c</sub>) from `solubility/assets/sol-ui.js`. Load `sol-ui.js` from the Solubility folder, or move the shared parts into a shared file if that is cleaner.
- **New:** the fillable ICE table component; two reactions in `vessel-engine.js` (2 NO + O₂ ⇌ 2 NO₂ and SO₂ + NO₂ ⇌ SO₃ + NO) with fixed particle counts per example, and a "+ add" button for F.
- **Hub:** a fourth tile, "ICE Tables", after Equilibrium Simulations. Tile animation: a small table filling in row by row.
- **Page head:** title, description, canonical, Open Graph, JSON-LD and favicon links copied from `guide.html`; add the page to `sitemap.xml`.
- **Checked arithmetic (2026-11-20):** every sample and practice answer above was recomputed. A 40, B 392, C 16.4 mol, D Q = 0.40, E 0.52 / 0.28, F 5.3; practice A 0.723, B 0.0278, C 0.660 mol, D 0.050 / 1.8 / 0.20, E 0.480 / 0.060, F 1.50; G K<sub>p</sub> 1.1, practice 0.17. Every table also checked for I + C = E down each column.
