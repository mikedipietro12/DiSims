# Design Strategy: Intermolecular Forces (Chem 11H)

**Date:** 2026-10-16  
**Status:** Approved (2026-10-16)  
**Brief:** `docs/designpowers/briefs/2026-10-16-intermolecular-forces.md`

---

## Design Principles

### 1. Clarity over physics theatre
**The principle:** Every motion exists to make an IMF idea readable - never to look “real.”  
**In practice:** Soft clouds, capped attract/repel, gentle reorient, LDF pulse; stage boundaries hold molecules.  
**We will NOT:** Unbounded MD, orbit cameras, or forces that fling molecules off-screen.

### 2. Name once, then go quiet
**The principle:** Guide is where vocabulary is born; Sandbox and Heat protect discovery for later discussion.  
**In practice:** Part 1 labels force types and drivers; Part 2 shows the same visual language with **no force names**; Part 3 is property discovery (individual → compare).  
**We will NOT:** Label Sandbox interactions with “hydrogen bonding,” or turn Heat into a vocabulary quiz.

### 3. Pre-load, don’t pretend mastery
**The principle:** Success is discussable experience + first names - not graded mastery before class.  
**In practice:** Free hub jump; Guide teaches; Sandbox/Heat generate “what did you notice?” moments for the teacher.  
**We will NOT:** Gate rooms, score students, or assume IMF prior knowledge.

### 4. One kit, three jobs
**The principle:** Shared molecules and cloud language; three rooms optimized for teaching, poke, and properties.  
**In practice:** Approach B - distinct layouts; same roster and space-filling/cloud craft.  
**We will NOT:** Force one UI to do Guide pacing and Heat gauges at once, or fork incompatible molecule looks per room.

### 5. Meaning survives without colour or pointer
**The principle:** Polarity and interaction must remain understandable under colour-blindness, keyboard-only, and reduced motion.  
**In practice:** Guide pairs colour with δ+/δ− (and names); keyboard “bring together”; reduced-motion settles instantly / softens pulse.  
**We will NOT:** Rely on colour alone for charge, or make drag the only way to run a demo.

---

## Competitive Position

| Reference | Strengths | Weaknesses | Accessibility | Our differentiation |
|-----------|-----------|------------|---------------|---------------------|
| Prior DiPietro IMF (physics 3D) | Ambitious space-filling feel | Runaway forces; hard camera; pedagogy lost | Pointer/3D-heavy | Soft capped 2D + fake depth; clarity first |
| Unit 1b suite | Strong discover-as-you-go; paper companion | Quiet-about-answer; needs worksheet | Good chrome patterns | This sim **names in Guide** and carries teaching alone |
| Rate Laws suite | Method teaching; predict-before-reveal | Different topic; graph-paper identity | Solid | Own visual identity; IMF is spatial/molecular not tabular |
| Typical PhET / web IMF toys | Polished physics sandboxes | Often force-type labeling always on, or too abstract | Mixed | **Pre-load arc:** named Guide → quiet Sandbox → Heat individual→compare for class talk |
| Static textbook IMF diagrams | Clear force taxonomy | No interaction; no property transfer | Readable | Living clouds + Heat gauges students can run |

**Position in one line:** The clarity-first Chem 11H pre-load that teaches IMF names once, then lets students *feel* unlabeled interactions and heat behaviour worth discussing - without turning into a physics demo.

---

## Experience Map

| Moment | What happens | Emotional state | Inclusive notes |
|--------|--------------|-----------------|-----------------|
| **Entry** | From Chem 11H hub → IMF suite hub (Guide / Sandbox / Heat). Suggested order visible; all open. | Curious, maybe unsure what IMF means | Clear room titles + one-line teasers; keyboard-focusable links |
| **First 5s** | Suite hub shows three rooms and that this is a pre-load tool - not a test. | Orienting | No quiz chrome; plain language |
| **Guide** | Step through force types; interactive demos; names + δ+/δ− + clouds + LDF pulse. | “Oh, there’s a word for that” | Paceable steps; Stuck?/back; colour + text |
| **Sandbox** | Pick roster pairs; drag close; watch unlabeled behaviour. | Playful / noticing | Keyboard bring-together; capped motion; reduced-motion settle |
| **Heat (solo)** | Pick one substance; heat; watch T/P gauges + phase behaviour. | Experimental | Gauge text values, not colour-only; laptop layout |
| **Heat (compare)** | After individual play, open compare; side-by-side heat. | “These are different” | Same controls mirrored; don’t overload with >2 panes in v1 |
| **Friction** | Jumping Sandbox before Guide → confusion without names (acceptable for pre-load; Free jump stays). Heat compare too early → empty contrast. | Mild stuck | Guide teasers on hub; Compare available but solo is default path |
| **Exit** | Leave for class discussion with names (if Guide done) + observations. | Ready to talk | No score wall; optional “what you might have noticed” is teacher-owned in class, not a grade |

**Suggested (not enforced) path:** Guide → Sandbox → Heat solo → Heat compare → class discussion.

---

## Success Metrics

| Metric | What it measures | Target | How to measure |
|--------|------------------|--------|----------------|
| Guide vocabulary | Student can name main IMF types after Guide | Can match force ↔ demo pair without Sandbox labels | Teacher spot-check / exit ticket in class (not in-app score) |
| Sandbox readability | Attract/repel/pulse/reorient understood | Zero “it flew away” reports; students describe what they saw | Classroom observation; playtest |
| Pre-load discussion quality | Heat + Sandbox feed talk | Students cite specific pairs or gauge behaviour in discussion | Teacher reflection after first use |
| LI/SC coverage | Rooms address course intentions | Every LI has a home in Guide, Sandbox, and/or Heat | Traceability in design plan |
| Accessibility task completion | Keyboard + reduced-motion paths | Complete Guide demo + Sandbox bring-together + Heat heat without pointer | Manual a11y pass; WCAG AA for text/UI chrome |
| Laptop fitness | Primary device | Comfortable stage + gauges on ~13" laptop | Design QA on target viewport |

---

## Constraints and Trade-offs

**We are choosing NOT to optimise for:**

| Trade-off | We choose | We sacrifice |
|-----------|-----------|--------------|
| Realism vs clarity | Pedagogical soft dynamics | Lab-accurate trajectories / energies |
| Always-on labels vs pre-load arc | Quiet Sandbox after named Guide | Instant force names during free poke |
| Free jump vs guided mastery | No gates | Some students skip Guide |
| Three rooms vs one sandbox | Distinct jobs (Approach B) | More surfaces to design/maintain |
| Individual→compare Heat | Solo first, then side-by-side | Immediate multi-substance dashboard |
| Fresh visual identity | Not cloning Unit 1b / Rate Laws | Less “instant DiPietro familiarity” in look |
| Laptop-first | Class laptop layouts | Phone-perfect Heat gauges |
| Sim-as-teacher | Full Guide copy in-app | Companion worksheet workflow |
| Scope | Roster + three rooms | Biomolecule intramolecular H-bonds; AP12 hub; gradebook |
