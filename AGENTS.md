# AGENTS.md — DiSimulations (repo-wide conventions)

These rules apply to every sim in this repo. Project folders may add their own `AGENTS.md`
with more specific build rules; those add to this file, they don't replace it.

## Student-facing copy

- **Write in the teacher's voice: read `VOICE.md` first.** It holds the confirmed voice rules and a
  before → after log of the teacher's own rewrites. When the teacher rewrites copy, add the pair to that log.

- **No personification of particles.** Atoms, ions, molecules, and electrons are not people.
  Don't give them wants, feelings, or agency.
  - "who sticks" → "what sticks"; "who pulls harder" → "which atom pulls the electrons more"
  - Avoid: *wants to*, *likes*, *is happy/greedy/hungry*, *steals*, *shares nicely*, *wins*.
  - Physical verbs are fine: *pulls*, *attracts*, *repels*, *shifts*, *bonds*.
- **Atoms are spheres, not balls**, when describing space-filling or model-kit atoms.

## Calculations

- **Show calculations as unit analysis** (user, 2026-11-18). Any calculation that isn't a K calculation
  (K, Ksp, Q, x² / 4x³, ICE tables) or a substitution straight into an expression is shown as unit
  analysis: the given value, then conversion factors written as fractions with the **numerator stacked
  over the denominator**, units (and the substance, e.g. `g NaCl`, `mol OH⁻`) on every value, units that
  cancel struck through, factors joined by ×. Long chains wrap before a ×, never after it.
- **No formula shortcuts for mole and concentration work.** Don't write `n = m ÷ M`, `c = n ÷ V` or
  `c₁V₁ = c₂V₂`, in worked steps or in body copy. Dilution is a volume ratio inside the chain
  (`0.100 mol KI / 1 L × 50.0 mL / 250.0 mL`).
  - **Exception: dilution walkthroughs** (user, 2026-11-18). Show the moles route first, in unit analysis:
    Cᵢ × Vᵢ gives the moles moved, then those moles over the final volume. Then finish with
    `CᵢVᵢ = C_fV_f` rearranged and worked out, as the same answer in one step. Label the picture the same way
    (CᵢVᵢ and its values under the starting solution). The Solubility Guide's Dilution tab is the model.
- Solubility builds these with `SolUI.ua` (`frac`, `x`, `chain`) in `solubility/assets/sol-ui.js`, styled
  by `.ua-*` in `sol.css`. Reuse it rather than writing fractions by hand.

## Visual

- **No dotted or dot-grid backgrounds** on stages, trays, canvases or pages (user preference, 2026-11-10).
  Plain surfaces only.
- **No "AI-tell" eyebrow labels** (user, 2026-11-17; students noticed it). Don't put a small capitalised,
  letter-spaced or mono label directly above a regular heading (e.g. a `.beat-kicker` / `.mod-num` /
  `.briefing-num` line over an `h2`). Students read this as AI-generated. If the label carries information,
  fold it into the heading ("Part 2: Q vs Ksp"), the body, or the navigation chrome instead.
  All suites were cleaned on 2026-11-17 (hub card labels, Guide section labels, briefing titles).
  Small labels over a *list or paragraph* (e.g. "Learning intentions" in a briefing) are a separate case, left as is.
- **Ion, acid and base colours** (user, 2026-11-17). Cations rose `#f06a84`, anions yellow `#ffd257`, each
  labelled with symbol + charge. Acids (H⁺ / H₃O⁺) magenta `#c2347a`, bases (OH⁻) violet-blue `#5b5fd6`:
  they never use the plain cation / anion colours. Neutral products such as H₂O are pale grey `#e4ebf3`.
  Ions inside a solid take the solid's real colour; a yellow solid is a paler yellow than the anion yellow
  (PbI₂ `#f6e39a`, user 2026-11-20), so solid and dissolved never look alike. Tokens live in `solubility/assets/sol.css`; the
  acids and bases unit reuses them.

## Hosting & search

- The site is served by **GitHub Pages** at `https://atomicsimulations.ca/` (see `CNAME`). No build step.
- Every public page's `<head>` carries: a descriptive `<title>` (`Topic Simulation | Course`),
  `meta description`, an absolute `canonical` URL, Open Graph / Twitter tags, and a JSON-LD
  `LearningResource` block. Copy them from an existing sim when adding a page.
- Every page (public or dev-only) links the water-molecule tab icon just before `</head>`:
  `/favicon.svg`, with `/favicon-32.png` and `/apple-touch-icon.png` as fallbacks.
- Add each new public page to `sitemap.xml`. Dev-only pages (taste passes, screenshot harnesses)
  get `<meta name="robots" content="noindex, nofollow">` instead.
