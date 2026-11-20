# Taste: Solubility & Ksp (AP Chem 12)

**Date:** 2026-11-17  
**Status:** Approved (2026-11-17)  
**Base:** Toy Box (`intermolecular-forces/assets/suite.css`), unchanged. Space Grotesk + Space Mono  
**Comparison page:** `taste-directions.html` (dev only, noindex, not linked from the hub)

## Direction: A · Charge colours

Chosen over B (element colours) and C (ink and outline). It extends the rule students already know from the IMF and Bonding suites, where red means + and yellow means −. Ions *are* charges, so the colour is honest.

| Token | Value | Use |
|---|---|---|
| `--sol-cat` / `--sol-cat-line` | `#f06a84` / `#b3263f` rose | Every cation (Pb²⁺, Ag⁺, Sr²⁺, Mg²⁺, Ca²⁺, …) |
| `--sol-an` / `--sol-an-line` | `#ffd257` / `#b38a10` yellow | Every anion (I⁻, Cl⁻, OH⁻, CO₃²⁻, F⁻, CrO₄²⁻, …) |
| `--sol-water` / `--sol-water-line` | `#e3f1fb` / `#7fb3d9` | Water fill and surface line |
| `--sol-zone-lo` / `--sol-zone-hi` | `#e3f1fb` / `#fdeccf` | Q vs Ksp gauge: Q < Ksp side / Q > Ksp side |
| `--ppt-pbi2` | `#f2c230` yellow | PbI₂ |
| `--ppt-ag2cro4` | `#a4452c` red-brown | Ag₂CrO₄ |
| `--ppt-white` | `#fbfbf8` | AgCl, SrSO₄, CaCO₃, Mg(OH)₂ |

## Rules

- **Ions in a solid take the crystal's real colour** (yellow PbI₂, white AgCl, red-brown Ag₂CrO₄), with cations drawn smaller than anions so the lattice still reads. **Dissolved ions take the standard colours.** An ion cross-fades as it leaves or joins the crystal (user, 2026-11-17).
- **Acids and bases have their own colours, site-wide** (user, 2026-11-17): H⁺ / H₃O⁺ and OH⁻ never use the plain cation / anion colours. Tokens `--sol-acid` `#c2347a` / `--sol-base` `#5b5fd6` ("indicator ends": magenta acid, violet-blue base; user pick 2026-11-17, recorded in the repo `AGENTS.md`). Neutral products such as H₂O use `--sol-neutral`.
- **The zoomed view shows the salt's own ions plus H⁺ / OH⁻ only.** Spectators (Na⁺, K⁺, NO₃⁻) are left out to keep it readable. OH⁻ appears only for hydroxide salts or after NaOH.
- **Acid gets a close-up** (user, 2026-11-17): adding acid to a pH-sensitive salt zooms the view onto the crystal surface; each H⁺ meets one OH⁻ (→ H₂O) or CO₃²⁻ (→ HCO₃⁻), one meeting about every half second, while more cations leave the crystal; then the view eases back out. A tap finishes it instantly.
- **Every ion carries its symbol and its charge** (Pb with 2+, I with −). Colour says + or −; the label says which ion. Ion sizes follow rough ionic radii.
- **Macro solids (the pile in the beaker) keep their real colour with the ion lattice showing.** Anions stay yellow `#ffd257` (user, 2026-11-17; the warmer amber was declined). In a PbI₂ crystal they take the crystal's yellow, so the change on dissolving is mostly the charge label and lattice exit.
- **White precipitates always get an ink outline** and sit on the water tint, never on plain white.
- **Precipitate colours are real** and always named in words beside them ("yellow solid").
- **Q vs Ksp gauge:** log track, Ksp tick in the middle, a Q marker, and the symbol <, = or > written under it. Water tint on the dissolve side, warm tint on the solid-forms side.
- **Charge labels sized for the projector** (bigger than on the comparison page).
- **Indigo (`--accent`) stays chrome only.** No eyebrow labels above headings.
