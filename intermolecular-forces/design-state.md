# Design State: Intermolecular Forces (Chem 11H)

_Last updated: 2026-10-16 by design-builder (Guide Tasks 4–5: beats + sticky demo UI)_

## Brief
- **Problem:** IMF-naive Chem 11H students need a clarity-first pre-load (Guide → Sandbox → Heat) that teaches force names and gives discussable observations - without runaway physics or a worksheet.
- **Primary persona:** Chem 11H student with intra/shape/EN/polarity only; laptop class pre-load before discussion.
- **Success metric:** Named forces from Guide; readable capped Sandbox; Heat individual→compare yields discussion fodder; LI/SC addressable.
- **Brief document:** `docs/designpowers/briefs/2026-10-16-intermolecular-forces.md`

## Personas
_Inclusive-personas not yet run - primary user captured in brief._
- Chem 11H pre-load student - IMF-naive, intra-ready, laptop-first

## Design Principles
1. Clarity over physics theatre - readable capped motion; no runaway MD
2. Name once, then go quiet - Guide names; Sandbox/Heat protect discovery
3. Pre-load, don’t pretend mastery - discussable experience; no gates/scores
4. One kit, three jobs - shared roster/clouds; three distinct rooms
5. Meaning without colour or pointer - signs, keyboard, reduced-motion

## Taste Profile
- **Direction:** Toy Box: squishy model-kit molecules on a bright studio tray; playful, tactile, game-like; stage is the hero
- **Quality level:** Production (class-ready pre-load)
- **Key references:** Apple-style product pages (pacing for Guide scroll); molecular model kits
- **Charge convention:** red = δ+ / positive, yellow = δ− / negative, for signs and clouds alike; reserved, never used for chrome
- **Atoms:** traditional model-kit hues, stylised (coral O, periwinkle N, slate C, white H…)
- **Type:** Space Grotesk (UI/display) + Space Mono (labels, formulas, numbers)
- **Aesthetic principles:** charge colour is sacred; toys not diagrams; stage brightest surface; tactile ink-on-white chrome; mono = measurement/name
- **Taste document:** `docs/designpowers/taste/2026-10-16-intermolecular-forces-taste.md`

## Decisions Log

| Date | Agent | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-10-16 | user + discovery | Approach B: three rooms, shared kit | Guide teaching ≠ Sandbox quiet ≠ Heat properties |
| 2026-10-16 | user + discovery | Free hub navigation, no gates | Pre-load flexibility |
| 2026-10-16 | user + discovery | Sim carries teaching | No companion worksheet |
| 2026-10-16 | user + discovery | 2D + fake-depth space-filling; no orbit camera | Prior 3D camera failed |
| 2026-10-16 | user + discovery | Soft capped dynamics; LDF = pulse | Prior build flew off-screen; clarity > MD |
| 2026-10-16 | user + discovery | Roster locked (Ne…glucose + octane + CH₃OH…) | Cover all IMF types + bulk stories |
| 2026-10-16 | user + discovery | Heat: individual then compare | Discovery then contrast |
| 2026-10-16 | user + discovery | Chem 11H hub; fresh visual identity | Course placement; not clone prior sims |
| 2026-10-16 | design-discovery | Brief approved end-to-end | Section-by-section sign-off |
| 2026-10-16 | design-strategist | Five principles + experience map + trade-offs approved | Guides all later craft |
| 2026-10-16 | writing-design-plans | 9-task plan approved | Ready to execute; taste optional before Guide UI |
| 2026-10-16 | design-builder | Task 1: suite hub, room stubs, Chem 11H link, starter chrome | Structure before kit/engine |
| 2026-10-16 | user + builder | Kit options A3/B3/C3/D2 | Hybrid pairs; LDF tiers; simplified vs heatRich; two files |
| 2026-10-16 | design-builder | Task 2: molecules.js + pairs.js | Shared roster + resolve() for all rooms |
| 2026-10-16 | design-builder | Task 3: imf-engine.js + sandbox wire-up | Soft capped 2D; drag + keyboard buttons; no force labels in Sandbox |
| 2026-10-16 | user + builder | Divergent void-lab look; fix approach lerp; tetrahedral H₂O clouds | Break from DiPietro chrome; interactions were too weak |
| 2026-10-16 | design-builder | Engine rebuilt on charge sites (δ+ atoms, δ− lone pairs, ion charge) | Old spring had inverted sign (pushed pairs to corners); no real repulsion or orientation dependence |
| 2026-10-16 | design-builder | Overdamped motion (no momentum) + speed/spin caps + walls; repulsion twists more than it travels | Like charges visibly push, then the pair turns and re-meets - never flies off (max push 8 units across 78 pairs × 8 poses) |
| 2026-10-16 | design-builder | LDF = atom–atom contact pull (polarizability-weighted); fluctuating δ± cloud that falls into step when two nonpolar molecules touch | Contact area + size drive strength; LDF reads as distinct from fixed polarity |
| 2026-10-16 | design-builder | Induced dipole = per-atom pull toward stronger field; partner's cloud shifts colour + faint δ± | Dipole–induced and ion–induced read without labels |
| 2026-10-16 | design-builder | H-bonds one-to-one per acceptor atom; H₂O lone pairs drawn as projected tetrahedral pair (front + back lobe up the bisector) | Produces textbook linear O–H···O instead of a 2D "double handshake" |
| 2026-10-16 | design-builder | Teaching overrides on top of site model: ion–dipole ×1.6, H-bond ×1.7 attraction; polar pairs' LDF fades when dipoles push | Keeps median strength order ion–dipole > H-bond > ion–induced > dipole–dipole > dipole–induced > LDF |
| 2026-10-16 | design-builder | Sandbox feedback: dotted pull bridges, dashed push arrows, cloud lean, plain-language live status ("Pulling together" / "Pushing apart") - no force names | Visible interaction feedback without breaking principle 2 |
| 2026-10-16 | design-builder | Sandbox: Turn A / Turn B quarter-turn buttons | Keyboard path to test orientation |
| 2026-10-16 | design-builder | pairs.js: ion + nonpolar → "Ion–induced dipole"; Na⁺ + Na⁺ → "Like charges repel" | Previous rule mislabelled both as London dispersion |
| 2026-10-16 | user | Next step = taste pass before Task 4; Ion–induced dipole gets its own Guide beat | Lock the identity before building Guide UI |
| 2026-10-16 | user + design-taste | Toy Box direction chosen over Arcade and Keynote (live comparison page) | Playful/tactile, stage as hero, technical type |
| 2026-10-16 | user | Charge colours: red = δ+, yellow = δ−, same rule for signs and clouds | One convention everywhere; replaces coral/teal |
| 2026-10-16 | user | Atom colours: traditional model-kit hues in stylised "trendy" versions | Familiar from kits, fresher look |
| 2026-10-16 | design-taste | δ signs drawn as ink-outlined pills; O shifted to coral; pull/push feedback in ink (shape-coded) | Yellow text is unreadable on white; O must not read as δ+ red; keep red/yellow reserved for charge |
| 2026-10-16 | user + builder | H-bond donors dock onto the acceptor's lone pair, not its O/N/F atom: δ− charge moved out into each lobe; along a lone-pair direction the lobe is the contact surface (LOBE_REACH 8); front lobes drawn over atoms in yellow with gold Lewis electron-pair dots | "H is attracted to the valence electrons that make the O δ−." Measured: donor H settles within ~2–14° of the lone-pair axis; 78 pairs × 8 contact-gap poses all touch except Na⁺–Na⁺ (repels); strength order unchanged |
| 2026-10-16 | user + builder | Two small H-bonders (water, NH₃, HF, CH₃OH) form ONE H-bond: the strongest H···acceptor link is primary (sticky); once it is nearly docked, ring (reverse) links and second-H links drop to 10%; glucose (several acceptor atoms) exempt; one bridge line per H–acceptor pair | Water had settled into a two-H "bifurcated" contact with the oxygens 7–12 units apart. Now 1 H-bond in 8/8 poses, O–O clearance ~20; all 78 pairs × 8 poses touch except Na⁺–Na⁺; strength order unchanged |
| 2026-10-16 | user | No δ+/δ− tags in the Sandbox (engine `showDeltas` option / `setShowDeltas`, default on for Guide); clouds, lobes and charge colours still carry polarity | Tags belong to Part 1 teaching; Sandbox stays observational. Ion "+" on Na⁺ kept (real charge, not δ) |
| 2026-10-16 | design-builder | Engine default theme = Toy Box (`DEFAULT_THEME`, `opts.theme`, `setTheme`); suite.css rewritten to Toy Box tokens; fonts Space Grotesk + Space Mono on all rooms | Identity applied suite-wide |
| 2026-10-16 | design-builder | Guide Tasks 4–5: scroll beats + sticky stage; force labels on (except intro); δ signs on; CH₄↔Br₂ LDF compare; ion–induced Na⁺·CH₄ override | Name once in Guide; Apple-style pacing |
| 2026-10-16 | design-builder | pairs.js teaching overrides for `ch4\|na` and `na\|ne` → Ion–induced dipole | Guide beat 3 canonical demos |

## Open Questions
- [x] Part 1 Guide beat list per force type
- [ ] Heat: when does Compare appear (always vs after first sample)? - user
- [ ] Phase-change / vapor-pressure visual language in Heat - strategist / lead
- [x] Fonts - Space Grotesk + Space Mono (taste pass)
- [x] Look approval - Toy Box locked (taste pass)
- [x] Ion–induced dipole - own Guide beat (user)
- [ ] Inclusive personas formal pass - optional later
- [ ] Guide playtest / designpowers critique - optional before Sandbox polish

## Artefact Index

| Artefact | Path | Status |
|----------|------|--------|
| Discovery notes | `DISCOVERY.md` | Complete |
| Brief | `docs/designpowers/briefs/2026-10-16-intermolecular-forces.md` | Approved |
| Strategy | `docs/designpowers/strategy/2026-10-16-intermolecular-forces-strategy.md` | Approved |
| Personas | - | Pending |
| Plan | `docs/designpowers/plans/2026-10-16-intermolecular-forces-plan.md` | Approved |
| Taste | `docs/designpowers/taste/2026-10-16-intermolecular-forces-taste.md` | Approved |
| Taste comparison (dev page) | `taste-directions.html` | Reference only - not linked from hub |

## Design Debt Register

_Items: 6 | Critical: 0 | Oldest: 2026-10-16_

| ID | Date | Source | Severity | What | Who is affected | Suggested fix | Status | Notes |
|----|------|--------|----------|------|----------------|---------------|--------|-------|
| DD-1 | 2026-10-16 | builder | Minor | Sandbox exposes `window.__imfStage` and engine has `debugRun` test hook | None (dev only) | Remove `__imfStage` before ship; keep `debugRun` or move to a test page | Open | Used for the 78-pair stress test |
| DD-2 | 2026-10-16 | builder | Minor | Engine geometry lives in imf-engine.js, not molecules.js `layout.simplified` | Future maintainers | Fold GEOM into the kit when Heat needs heatRich drawings | Open | Principle 4 (one kit) - data duplicated |
| DD-3 | 2026-10-16 | builder | Minor | δ labels can still collide with each other (not with atoms) in tight poses | Low-vision readers | Label-vs-label avoidance pass | Open | Seen briefly in HCl head-to-head |
| DD-4 | 2026-10-16 | builder | Minor | HCl–HCl pull (0.22) < Br₂–Br₂ (0.35) - matches real BPs but may surprise if Guide says "dipole–dipole > LDF" | Guide copy | Guide wording: "for molecules of similar size" | Open | Not a bug - copy guard |
| DD-5 | 2026-10-16 | builder | Minor | Na⁺–H₂O and NH₃–NH₃ can stall in one exactly-symmetric pose without jitter | Reduced-motion users | Seeded tiny angle offset on Bring together | Open | 1 of 8 test poses; live jitter resolves it |
| DD-6 | 2026-10-16 | design-taste | Minor | `taste-directions.html` still carries its own Toy Box theme override (old yellow-button chrome, CPK reds) and the Arcade/Keynote themes | None (dev only) | Delete the page before ship, or keep it as an archived reference | Open | Real rooms use the engine default |

## Handoff Chain

### 2026-10-16 design-discovery → design-strategist
> "Brief is approved - Approach B, Chem 11H pre-load, sim-as-teacher, shared roster, 2D fake-depth clouds with LDF pulse, Heat individual→compare. Prior MD failure is a hard anti-goal. Need principles, journey map, and explicit trade-offs before we plan rooms."

### 2026-10-16 design-strategist → writing-design-plans
> "Principles locked: clarity over physics, name-once-then-quiet, pre-load not mastery, one kit three jobs, a11y without colour/pointer. Journey is hub → Guide → Sandbox → Heat solo → compare → class talk. Break that into a buildable plan - Guide beats per force, shared molecule engine, Heat compare - without sneaking MD back in."

### 2026-10-16 writing-design-plans → (execution)
> "Plan approved. Next: Task 1 suite hub + Chem 11H link, or optional design-taste before Guide UI (Task 5). User steers."

### 2026-10-16 Task 1 complete → Task 2
> "Hub + Guide/Sandbox/Heat stubs live under intermolecular-forces/; Chem 11H lists IMF. Starter cool-mist tokens in suite.css (replaceable at taste). Next: shared molecule kit data + render contract."

### 2026-10-16 Task 2 complete → Task 3
> "Roster of 12 in molecules.js with simplified/heatRich layouts and LDF tiers. pairs.js hybrid resolve() + teaching overrides. Rooms load both scripts. Next: soft 2D capped interaction engine consuming ImfPairs.resolve."

### 2026-10-16 Task 3 complete → Task 4
> "Engine is live in Sandbox: soft spring attraction, damped overlap, walls, reorient, LDF pulse, reduced-motion settle, Bring together/Separate. Force labels API exists but Sandbox keeps them off. Next: Guide beat list per force type."

### 2026-10-16 Task 3 rework → (user choice: taste pass or Task 4)
> "Engine rebuilt on charge sites: like charges push, opposite pull, torque reorients; H-bonds linear and one-to-one; LDF fluctuates and syncs on contact; induced dipoles shift partner clouds. Stress test: 78 pairs × 8 poses, nothing leaves stage, strength order holds. Sandbox has bridges/push arrows, live status, Turn buttons. Look still unapproved. Next: user picks design-taste pass or Task 4 Guide beats."

### 2026-10-16 design-taste → Task 4 (Guide beat list)
> "Toy Box is locked and applied: white tray, matte stylised model-kit atoms, keycap ink chrome, Space Grotesk + Space Mono. Charge colours are red = δ+, yellow = δ− everywhere (signs as pills, clouds, lobes, ion glow); never use them for chrome. Guide beats: London dispersion → dipole–induced dipole → ion–induced dipole (own beat) → dipole–dipole → ion–dipole → hydrogen bonding. Use the Apple-style scroll pacing for Guide."

### 2026-10-16 Tasks 4–5 complete → Task 6 (Sandbox polish)
> "Guide ships with 8 scroll beats (Between → LDF → dipole–induced → ion–induced → dipole–dipole → ion–dipole → H-bond → Names wrap), sticky Toy Box stage, labels/δ on for force beats, CH₄/Br₂ LDF compare, keyboard Bring/Separate/Turn. Next: Sandbox Task 6 polish (picker/HUD already live - verify principle 2, quiet HUD, reduced-motion), then Heat solo (Task 7)."
