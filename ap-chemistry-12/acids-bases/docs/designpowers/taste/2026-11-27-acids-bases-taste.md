# Taste: Acids and Bases (AP Chem 12, Unit 4)

**Date:** 2026-11-27
**Status:** Draft, for approval (from the teacher's round 1 notes and round 2 picks)
**Comparison page:** `taste-directions.html` (dev only, noindex, not linked from the hub): A, B and C, each updated with
the teacher's notes. Now shows the chosen look only: B and C retired 2026-11-27, C's stage kept as dark mode. Dev hooks `?theme=light|dark`, `?t=seconds`,
`?mode=lewis|ball|fill`.
**Base:** the site's shared chrome (`assets/suite.css`, Space Grotesk + Space Mono, hub, presentation view).

## Direction: A in light mode, C in dark mode

The theme switch (`assets/theme.js`, sun / moon keycap) changes the whole stage look, not just the page colours.

| | Light mode: **A · Ink and spheres** | Dark mode: **C · Night lab** |
|---|---|---|
| Stage | White, water windows pale blue `#e3f1fb` with an ink edge | Deep navy `#0b1020`, water windows `#101c34` with a rim-lit blue edge |
| Particles | Flat-shaded spheres, ink outline on every atom | The same atoms, no outline, each heavy atom glowing in its colour |
| Glass | Ink outline, water tint | Rim-lit blue lines, soft highlights |
| Lewis structures | Ink letters, bonds and lone-pair dots | Light lines and dots with a faint glow |
| Equations | Ink; the H₃O⁺ / OH⁻ terms in their colours | Light; the H₃O⁺ / OH⁻ terms glow |
| Concentration bars | **B's style** (teacher, 2026-11-27): rounded, gradient fill, no ink edge, on a pale track | The same bars on a dark track, glowing |
| Choice cards | Toy Box keycaps, green / red fills | Dark cards, green / red glowing edges |

## Particles

- **Every particle shows its atoms** (teacher, 2026-11-27). H₃O⁺ is an O with three H, OH⁻ an O with one H, H₂O an O
  with two, HF an F with one H. Hydrogens are always white.
- **The role colour sits on the heavy atom:** H₃O⁺ **red `#d62828`**, OH⁻ violet-blue `#5b5fd6`, other anions yellow
  `#ffd257`, other cations rose `#f06a84`, whole acid molecules (HF, CH₃COOH) grey, water pale grey and faint.
- **Labels:** monatomic ions carry their formula and charge inside (Cl⁻, F⁻). H₃O⁺ and OH⁻ carry their charge on the
  oxygen and their formula just below. Whole molecules carry their formula inside.
- Water sits behind, smaller and fainter, so the acid's particles read first. Depth: back particles smaller and fainter.
- Particle windows say "scaled" once; counts show the true ratio (e.g. 0.10 M HF: 1 ionized in 17).

## The proton

- **One look in every model:** the moving H has a red ring (H₃O⁺ red) wherever it is. It arcs from the bond it leaves
  to the lone pair it lands on, and the bond and lone pair cross-fade as it goes. Charges appear on the products.
- **Three models for a proton transfer** (teacher, 2026-11-27), switched by a button group on the stage:
  **Lewis structures · Ball and stick · Space-filling.** The same animation runs in all three.
- **Ball and stick uses role colours** (teacher, 2026-11-27), as in the particle windows: whole molecules start grey;
  an O turns violet-blue as it becomes OH⁻ (or red as it becomes H₃O⁺); NH₃'s N turns rose as it becomes NH₄⁺.
- **Space-filling uses the classic atom colours** (O red, N blue, H white) with a **charge haze** around each ion
  (teacher, 2026-11-27): **red haze for +, yellow haze for −**, the site's δ+ / δ− colours (`--delta-pos` `#e8264f`,
  `--delta-neg` `#ffc21a`). The haze fades in as the proton moves; neutral molecules have none. The + / − glyphs
  beside the ions match the haze.
- Atom letters on every sphere.

## Colour changes made site-wide (2026-11-27)

- **H⁺ / H₃O⁺: magenta `#c2347a` → red `#d62828`** (line `#8f1515`), so pink only ever means phenolphthalein. Changed
  in `AGENTS.md`, `solubility/assets/sol.css` (`--sol-acid`), the `sol-draw.js` fallback and `assets/courses.css`
  (`--c-acid`); cache versions bumped (sol.css v61, sol-draw.js v8, courses.css v4).
- Phenolphthalein is drawn only as the liquid's colour: a flash `#ff4fa3` where drops land, fading on swirling; the
  endpoint a faint pink that stays. Never as particles in Guide 1. (Part 3.1 will give HIn / In⁻ their own colours in
  its detail pass.)

## Rules carried from the repo

No dot grids, no eyebrow labels above headings, every ion with formula and charge, verdicts in words, interruptible
animation, laptop + tablet. Dark mode: Bonding's dark tokens move into `suite.css` at build (brief §7).
