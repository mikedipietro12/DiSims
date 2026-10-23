# Design Brief: Intermolecular Forces (Chem 11H)

**Date:** 2026-10-16  
**Status:** Approved (2026-10-16)  
**Approach:** B - Three distinct rooms, shared molecule kit  
**Hub:** Chemistry 11H (`chemistry-11h/index.html`)  
**Repo:** `intermolecular-forces/`

---

## Problem Statement

Chem 11H students need to connect molecular shape, electronegativity, and intramolecular bonding to the **types and relative strengths of intermolecular forces**, then to macroscopic properties (melting point, boiling point, vapor pressure). Prior “physics-real” sims failed: runaway repulsion and awkward 3D cameras hid the chemistry. We need a **clarity-first** experience - space-filling molecules with soft electron clouds - where Guide names the forces, Sandbox lets students see unlabeled interactions, and Heat-the-sample makes properties discoverable, with the **sim carrying all teaching** (no companion worksheet).

---

## Users

**Primary:** Chemistry 11 Honours students who know **intramolecular** ideas (bonds, shape/VSEPR, EN, polarity) but have **no IMF concept yet**. This sim is a **pre-load** - they poke Guide / Sandbox / Heat *before* a class discussion that unpacks what they saw. They are not expected to arrive with “London,” “H-bond,” or property–IMF links already formed; Part 1 introduces names; Parts 2–3 give experiences to talk about afterward.

**Context of use:** **Laptop in class (or prep) is the main device.** Phone is a soft nice-to-have, not a design driver. Teacher leads discussion *after*; during the sim the Guide still carries naming/explanation so the pre-load works without a worksheet.

**Ability spectrum:**
- Screen reader / keyboard: molecule picker, drag alternatives (e.g. “bring together”), gauges, and part navigation must not be pointer-only.
- Low vision / colour vision: polarity colours reinforced by labels/signs (δ+/δ−) in Guide; Sandbox stays unlabeled but motion/position still carry meaning.
- Cognitive load / stress: first exposure - Part 1 paced and named; Part 2 quiet; free hub jump; don’t assume prior IMF vocabulary.
- Vestibular / motion sensitivity: soft motion, capped forces, `prefers-reduced-motion` (instant settle, no pulse flicker if needed).
- Not-first-language English: plain teaching copy in Guide; furniture labels short and consistent.

---

## Design Direction

**Approach B - three distinct rooms, shared molecule kit.**

One Chem 11H hub entry opens an IMF suite with free navigation (no gates) among:

1. **Guide** - Walks each IMF type with interactive demos. Intentionally **names** forces and shows polarity / clouds / pulsing LDF. Teaching copy lives here (sim-as-teacher). Student arrives IMF-naive; Guide is the first vocabulary.
2. **Sandbox** - Pick from the shared roster, bring molecules close on a **2D stage** with **fake-depth space-filling** look. Squishy electron clouds; fixed δ+/δ− colour for permanent polarity; **pulsing** for LDF; soft attract/repel; gentle reorient to favourable pose. **No force labels.** Capped motion - never fly off-screen. Pre-load fodder for later discussion.
3. **Heat** - Starts **one substance at a time**; student heats the sample with **temperature** and **pressure** gauges. After that individual experience, a **compare** function lets students run substances **side-by-side** so IMF-driven property differences are obvious. Melting / boiling / vapor-pressure behaviour as discovery, tied to IMF strength without a full thermo engine.

**Shared across rooms:** roster (Ne, CH₄, Br₂, HCl, CO₂, H₂O, NH₃, HF, CH₃OH, Na⁺, octane, glucose), space-filling + cloud visual language, clarity over physics realism.

**Emotional / pedagogical target:** curious pre-load instrument - clear enough to teach names in Guide, honest enough in Sandbox/Heat that class discussion has something real to unpack - not a physics toy, not a worksheet clone.

---

## Constraints

**Product / curriculum**
- Lives under **Chemistry 11H** hub (`chemistry-11h/index.html`); suite folder `intermolecular-forces/`.
- Must serve course LI/SC (IMF types via shape/polarity/EN/intra; physical properties; stronger/weaker drivers; polar vs nonpolar from VSEPR; EN–shape–intra link) plus AP 3.1 force taxonomy as model coverage (LDF, dipole–induced, dipole–dipole, ion–dipole, H-bonding).
- **Pre-load** before discussion; **sim carries teaching** (no companion worksheet).
- Free navigation between Guide / Sandbox / Heat - **no unlock gates**.

**Technical**
- Vanilla HTML/CSS/JS, no build step, Netlify static (DiSimulations conventions).
- Laptop-first interaction and layout.
- Soft, **capped** dynamics - no runaway repulsion / off-screen flight (lesson from prior build).
- 2D interaction; fake-depth space-filling look; no orbit camera.

**Visual**
- Need **not** inherit Unit 1b or Rate Laws aesthetics - fresh identity allowed.
- Still a DiPietro Science Sim in the collection (deploy path, hub listing).

**Accessibility**
- Keyboard / non-pointer paths; meaning not colour-only in Guide; `prefers-reduced-motion` supported.

---

## Existing Design System

**None required for IMF.** Visual identity is free of Unit 1b (paper/riso) and Rate Laws (graph-paper lab) inheritance.

**Repo conventions that still apply (deploy / stack, not look):**
- DiSimulations static hosting; Chemistry 11H hub listing pattern (`chemistry-11h/index.html`).
- Vanilla HTML/CSS/JS; Google Fonts already used elsewhere in the stream (Archivo Black / Barlow / IBM Plex Mono) are **available but not mandatory** - taste calibration may keep, swap, or extend.
- Suite pattern (hub + parts + shared `assets/`) is a useful structural reference from Rate Laws / Unit 1b - optional, not aesthetic.

**Reference for anti-goals only:** prior physics-heavy 3D IMF attempt (runaway forces, orbit camera) - do not recreate.

---

## Taste Direction (Early Signal)

*(Seeds for later `design-taste` - not a full calibration yet.)*

- **Feel:** curious pre-load instrument - soft, readable, a bit “molecular,” not sterile textbook and not arcade physics.
- **Hero craft:** space-filling atoms with **fake depth**; **squishy electron clouds**; polarity as related colours + signs in Guide; LDF as **pulse**.
- **Motion:** gentle attract / repel / reorient; capped; never chaotic flight.
- **Freedom:** not Unit 1b paper/riso, not Rate Laws graph-paper - invent IMF’s own surface.
- **Open for taste pass:** palette, type choices (keep stream trio or not), Guide chrome voice, Heat gauge styling.

---

## Success Criteria

**We know this works when:**

1. An IMF-naive student can complete the **Guide** and leave with working names for the main IMF types and what drives stronger/weaker (without a worksheet).
2. In the **Sandbox**, bringing roster pairs together makes attract/repel / pulse / H-bond-friendly reorient **readable** - and nothing flies off-screen.
3. After Sandbox + **Heat** (individual, then optional **compare**), students have concrete observations (who stuck, who boiled “easier,” what gauges did) that a teacher can unpack in discussion - the pre-load did its job.
4. Course **LI/SC** are addressable by the three rooms (types + polarity/VSEPR/EN–shape–intra; stronger/weaker details; MP/BP/vapor pressure), even if full mastery is confirmed in class after.
5. Laptop experience is primary and solid; keyboard / reduced-motion paths don’t strand the student.

---

## Out of Scope

- True 3D / orbit-camera navigation; physically accurate MD or unbounded electrostatics.
- Companion worksheet / CTQ sheet as a required dependency.
- Unlock gates between Guide / Sandbox / Heat.
- Biomolecule same-molecule (intramolecular) H-bonding as a first-class Guide topic (AP SAP-5.A.5) - defer unless added later.
- Cloning Unit 1b or Rate Laws visual systems.
- AP Chemistry 12 hub placement (this is Chem 11H).
- Full thermodynamic engine / real steam tables - Heat is pedagogical gauges + phase behaviour, not lab-grade thermo.
- Scoring, accounts, or progress grades (visited state optional later; not a gradebook).
