# Taste: Intro to Equilibrium (AP Chem 12)

**Date:** 2026-10-30  
**Status:** Approved (2026-10-30)  
**Base:** Toy Box (`intermolecular-forces/docs/designpowers/taste/2026-10-16-intermolecular-forces-taste.md`), unchanged  
**Comparison page:** `taste-directions.html` (dev only, not linked from the hub)

## Direction: Ember and Tide

These are the only colours this suite adds to Toy Box. The colour metaphor: ember is heat, tide is things spreading out, and ink is the final verdict.

| Token | Value | Use |
|---|---|---|
| `--eq-dh` | `#e07a2e` ember | ΔH bars, heat-flow arrows |
| `--eq-ts` | `#14918f` tide | −TΔS bars, entropy / spreading cues |
| `--eq-dg` | ink `#1d2433` | ΔG bar (the sum) |
| `--eq-fwd` | ink, solid line | Forward rate |
| `--eq-rev` | tide, dashed line | Reverse rate |
| `--eq-a` / `--eq-b` | ember / tide | Custom A ⇌ B particles |
| `--chem-no2` / `--chem-nh3` | `#9a5b2e` / `#24835a` | Shared with the Le Châtelier sim |

## Rules

- **Red and yellow are still reserved for charge.** Ember orange is the closest colour to them, so it's only ever used for ΔH, heat cues and particle A.
- **Gibbs bars use a waterfall layout.** The ΔH bar rises or falls from zero. The −TΔS bar starts where ΔH ends. The ΔG bar runs from zero to the sum. Every bar carries a + / − glyph.
- **Rate lines differ by both colour and dash.** Forward is a solid ink line, reverse is a dashed tide line, and both are labelled at the line ends (→ forward, ← reverse).
- **No numbers on the bars** (principle 3).
- **Indigo (`--accent`) stays chrome only** (focus rings, active controls). This avoids clashing with N₂.
- **O₂** uses the model-kit coral. **O₃ is pale blue** (`#3f8fcb`), because ozone really is a pale blue gas. That is the same honest-colour rule as brown NO₂. It was changed after a render showed coral O₂ and O₃ were hard to tell apart.
