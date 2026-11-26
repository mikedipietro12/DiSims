# Design Plan: Intermolecular Forces (Chem 11H)

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Ship a Chem 11H IMF suite - hub + Guide + Sandbox + Heat (solo→compare) - clarity-first, sim-as-teacher, pre-load ready.

**Design Direction:** Brief `docs/designpowers/briefs/2026-10-16-intermolecular-forces.md` · Strategy `docs/designpowers/strategy/2026-10-16-intermolecular-forces-strategy.md` · Approach B

**Personas:** Chem 11H pre-load student (IMF-naive, intra-ready, laptop-first) - brief Users section

**Principles to enforce every task:** Clarity over physics · Name once then quiet · Pre-load not mastery · One kit three jobs · Meaning without colour/pointer

---

## Task 1: Suite structure & Chem 11H hub entry

**Files:** `intermolecular-forces/index.html` · `chemistry-11h/index.html` · optional `intermolecular-forces/assets/`

- [x] Step 1: Create suite hub with three room links (Guide / Sandbox / Heat) + short teasers; mark suggested order without locks
- [x] Step 2: Add IMF card/link under Chemistry 11H hub
- [x] Step 3: Shared chrome shell (back to Chem 11H, room switcher) stubbed for all rooms

**Accessibility check:** Hub links keyboard-focusable; teasers not colour-only; page titles unique.

**Verification:** From `chemistry-11h/` user can open IMF hub and jump to any room stub.

---

## Task 2: Shared molecule kit (data + look contract)

**Files:** `intermolecular-forces/assets/molecules.js` (or equivalent) · visual spec notes in plan/taste

- [x] Step 1: Encode roster: Ne, CH₄, Br₂, HCl, CO₂, H₂O, NH₃, HF, CH₃OH, Na⁺, octane, glucose - polarity, H-bond roles, relative “bulk,” ion flag
- [x] Step 2: Define render contract: fake-depth space-filling atoms; squishy cloud; δ+/δ− colour + sign fields; LDF pulse flag
- [x] Step 3: Define interaction pair outcomes table (which IMF dominates for key pairs) - pedagogical, not MD
- [x] Decisions locked: A3 hybrid · B3 tiers now · C3 simplified vs heatRich · D2 molecules.js + pairs.js

**Accessibility check:** Data model includes text labels for charge/polarity for Guide; Sandbox can omit names but keep structural descriptions for SR if needed later.

**Verification:** Every Guide/Sandbox/Heat substance resolves from one kit; no one-off molecule definitions in rooms.

---

## Task 3: Soft interaction engine (2D, capped)

**Files:** `intermolecular-forces/assets/imf-engine.js` (or room-shared module)

- [x] Step 1: 2D stage drag + soft attract/repel by charge sign; hard speed/force caps; walls
- [x] Step 2: Gentle reorient toward favourable pose when near alignment
- [x] Step 3: LDF pulse behaviour for nonpolar/temporary dipole cases
- [x] Step 4: `prefers-reduced-motion`: instant settle; pulse off or static
- [x] Wired into sandbox with Bring together / Separate (force labels off)

**Accessibility check:** Non-drag alternative (“Bring together” / “Separate”); focusable controls; live region optional for state changes in Guide only.

**Verification:** Stress-test pairs never leave the stage; reduced-motion path works.

---

## Task 4: Guide IA - beat list per force type

**Files:** `guide.html` (or `part-guide.html`) · content outline

- [x] Step 1: Ordered beats: Between (refresher) → LDF → dipole–induced → ion–induced (own beat) → dipole–dipole → ion–dipole → H-bonding → Names wrap
- [x] Step 2: Each beat: title, 2–4 sentence teaching copy, interactive demo using kit, named force label on
- [x] Step 3: Stronger/weaker drivers called out (size/contact area, dipole magnitude, N/O/F, orientation)
- [x] Step 4: Navigation between beats + suite room switcher

**Accessibility check:** Headings hierarchy; copy not colour-dependent; demo controllable by keyboard.

**Verification:** IMF-naive reader can finish Guide with names for all five force types; LI “types + stronger/weaker + polar/nonpolar” addressed.

**Canonical demos:** Between HCl·HCl (labels off) · LDF CH₄·CH₄ (+ Br₂ compare) · dipole–induced HCl·Ne · ion–induced Na⁺·CH₄ · dipole–dipole HCl·HCl · ion–dipole Na⁺·H₂O · H-bond H₂O·H₂O

---

## Task 5: Guide UI composition & content pass

**Files:** Guide room CSS/HTML · copy in place

- [x] Step 1: Layout - teaching column + sticky demo stage (laptop-first; stacks on narrow)
- [x] Step 2: Toy Box tokens applied (taste locked)
- [x] Step 3: Guide copy in place - teacher-over-shoulder sentences; scroll sync via IntersectionObserver

**Accessibility check:** Contrast AA for text/chrome; focus rings; δ+ / δ− text alongside colour.

**Verification:** Critique against principles 1–2 and 5; no unlabeled Sandbox behaviour leaking into Guide. _(Playtest / critique still open.)_

---

## Task 6: Sandbox room

**Files:** `sandbox.html` · uses kit + engine

- [ ] Step 1: Molecule picker (multi-select / two slots) from full roster
- [ ] Step 2: Stage with drag + Bring together; **no force-type labels**
- [ ] Step 3: Optional quiet HUD (formula names only - not IMF names)

**Accessibility check:** Picker and Bring together fully keyboard; motion capped; reduced-motion.

**Verification:** Same pairs as Guide demos behave recognizably but unnamed; principle 2 holds.

---

## Task 7: Heat room - solo

**Files:** `heat.html`

- [ ] Step 1: Single substance picker; sample visualization (pedagogical particles or condensed sample - not MD)
- [ ] Step 2: Temperature control + temperature & pressure gauges (numeric + graphic)
- [ ] Step 3: Melt / boil / vapor-pressure response tied qualitatively to IMF strength from kit

**Accessibility check:** Gauge values as text; controls labeled; not colour-only phase state.

**Verification:** Heating H₂O vs CH₄ (separately) yields clearly different stories; no fly-away physics.

---

## Task 8: Heat room - compare

**Files:** `heat.html` (compare mode)

- [ ] Step 1: Compare mode after solo (entry: always available from Heat, default landing = solo)
- [ ] Step 2: Side-by-side two substances, mirrored T control or linked/unlinked heat - pick one in build and document
- [ ] Step 3: Dual gauges; contrast readable on laptop width

**Accessibility check:** Two panes announced; don’t rely on left/right colour alone; keyboard can switch pane focus.

**Verification:** Octane vs glucose or CH₄ vs H₂O comparison supports discussion fodder.

---

## Task 9: Cross-room polish & LI/SC traceability

**Files:** `DESIGN.md` or `docs/.../li-map.md` · suite CSS

- [ ] Step 1: Map each course LI/SC to Guide beat / Sandbox behaviour / Heat behaviour
- [ ] Step 2: Shared suite navigation consistency; Chem 11H back link
- [ ] Step 3: Reduced-motion + keyboard smoke test across all rooms

**Accessibility check:** Full keyboard path Guide→Sandbox→Heat solo→compare.

**Verification:** Traceability table complete; principles checklist pass; critique skill run.

---

## Deferred (not this plan)

- Biomolecule intramolecular H-bonds
- Phone-first Heat layout
- In-app scoring / gradebook
- Full design-taste calibration may run between Tasks 4–5 if user wants palette lock first
