# AGENTS.md — DiSimulations (repo-wide conventions)

These rules apply to every sim in this repo. Project folders may add their own `AGENTS.md`
with more specific build rules; those add to this file, they don't replace it.

## Student-facing copy

- **Write in the teacher's voice: read `docs/VOICE.md` first.** It holds the confirmed voice rules and a
  before → after log of the teacher's own rewrites. When the teacher rewrites copy, add the pair to that log.

- **No personification of particles.** Atoms, ions, molecules, and electrons are not people.
  Don't give them wants, feelings, or agency.
  - "who sticks" → "what sticks"; "who pulls harder" → "which atom pulls the electrons more"
  - Avoid: *wants to*, *likes*, *is happy/greedy/hungry*, *steals*, *shares nicely*, *wins*.
  - Physical verbs are fine: *pulls*, *attracts*, *repels*, *shifts*, *bonds*.
- **Atoms are spheres, not balls**, when describing space-filling or model-kit atoms.

## Grade 12 content: follow Hebden

- **Check the Hebden Chemistry 12 textbook before building or editing anything for grade 12** (user, 2026-11-27).
  That covers everything in `ap-chemistry-12/`. The PDFs are in `private/HEBDEN/` (local only, see Folder layout):
  `Hebden 12 (p1-100).pdf`, `(p101-226).pdf`, `(p227-336).pdf`. Read the chapter for the topic first.
- **Match Hebden on content:** definitions, terms, symbols and notation, the order ideas are taught in, and how
  deep a topic goes. Don't add content past what Hebden covers unless the teacher asks for it.
- **This file still decides how things are shown.** Unit analysis, voice (`docs/VOICE.md`), colours and the other
  rules here apply even where Hebden lays something out differently. Numbers come from the Data Booklet
  (`docs/reference/chem12-data-booklet.md`).
- **Copyrighted: don't copy it into the site.** No pasted passages, figures, scans or textbook questions word for
  word. Write the sim's own copy and examples, consistent with Hebden.
- Reading the PDFs needs poppler (`brew install poppler`) for the Read tool, or `pdftotext`.

## Calculations

- **Show calculations as unit analysis** (user, 2026-11-18). Any calculation that isn't a K calculation
  (K, Ksp, Q, x² / 4x³, ICE tables) or a substitution straight into an expression is shown as unit
  analysis: the given value, then conversion factors written as fractions with the **numerator stacked
  over the denominator**, units (and the substance, e.g. `g NaCl`, `mol OH⁻`) on every value, units that
  cancel struck through with a diagonal line (user, 2026-11-27: a line through the middle hides parts of letters), factors joined by ×. Long chains wrap before a ×, never after it.
- **No formula shortcuts for mole and concentration work.** Don't write `n = m ÷ M`, `c = n ÷ V` or
  `c₁V₁ = c₂V₂`, in worked steps or in body copy. Dilution is a volume ratio inside the chain
  (`0.100 mol KI / 1 L × 50.0 mL / 250.0 mL`).
  - **Exception: dilution walkthroughs** (user, 2026-11-18). Show the moles route first, in unit analysis:
    Cᵢ × Vᵢ gives the moles moved, then those moles over the final volume. Then finish with
    `CᵢVᵢ = C_fV_f` rearranged and worked out, as the same answer in one step. Label the picture the same way
    (CᵢVᵢ and its values under the starting solution). The Solubility Guide's Dilution tab is the model.
- Solubility builds these with `SolUI.ua` (`frac`, `x`, `chain`) in `ap-chemistry-12/solubility/assets/sol-ui.js`, styled
  by `.ua-*` in `sol.css`. Reuse it rather than writing fractions by hand.

## Visual

- **No dotted or dot-grid backgrounds** on stages, trays, canvases or pages (user preference, 2026-11-10).
  Plain surfaces only.
- **Learning intentions and curricular competencies span the full page** (user, 2026-11-27). Any Before we begin /
  briefing block that lists them runs the full width of the page, with the two lists side by side, and the
  simulation stage only starts below it, beside the first section after it. While scrolling, the block hands the stage
  to that first section so it is already loaded. Presentation view still shows the block as its own slide.
  Solubility's Guide and the Acids and Bases review are the models.
- **Guides on narrow screens alternate text and simulation** (user, 2026-11-27). At 860 px and under (phones and
  tablet portrait) each section's text is followed by its stage, then the next section's text, instead of the stage
  sitting at the top while the text scrolls under or away from it. `assets/guide-inline.js` does this for every
  Guide: it moves the one stage into a slot under the section in view and leaves a still copy in the slot it left.
  A new Guide hooks into it the same way (see the comment at the top of the file); check it with
  `assets/dev/guide-inline-check.html?page=<guide path>` through `.claude/scripts/run-page.sh`.
- **No "AI-tell" eyebrow labels** (user, 2026-11-17; students noticed it). Don't put a small capitalised,
  letter-spaced or mono label directly above a regular heading (e.g. a `.beat-kicker` / `.mod-num` /
  `.briefing-num` line over an `h2`). Students read this as AI-generated. If the label carries information,
  fold it into the heading ("Part 2: Q vs Ksp"), the body, or the navigation chrome instead.
  All suites were cleaned on 2026-11-17 (hub card labels, Guide section labels, briefing titles).
  Small labels over a *list or paragraph* (e.g. "Learning intentions" in a briefing) are a separate case, left as is.
- **Ion, acid and base colours** (user, 2026-11-17). Cations rose `#f06a84`, anions yellow `#ffd257`, each
  labelled with symbol + charge. Acids (H⁺ / H₃O⁺) red `#d62828` (user 2026-11-27, was magenta `#c2347a`: changed so
  pink only ever means phenolphthalein), bases (OH⁻) violet-blue `#5b5fd6`:
  they never use the plain cation / anion colours. Neutral products such as H₂O are pale grey `#e4ebf3`.
  Ions inside a solid take the solid's real colour; a yellow solid is a paler yellow than the anion yellow
  (PbI₂ `#f6e39a`, user 2026-11-20), so solid and dissolved never look alike. Tokens live in `ap-chemistry-12/solubility/assets/sol.css`; the
  acids and bases unit reuses them.

## Folder layout

The folders mirror the site (user, 2026-11-25): one folder per course hub, one subfolder per unit, sims inside.

- `ap-chemistry-12/` → `kinetics/` (hub + collision theory, Maxwell–Boltzmann, Beer's law, `rate-laws/`),
  `equilibrium/` (intro suite + `le-chatelier.html`), `solubility/`, `acids-bases/` (hub + `titration.html`).
- `chemistry-11h/` → `atomic-structure/` (Unit 1), `bonding/` (Unit 2), `imf/` (Unit 3).
- `other/` → sims outside a course (`bc-tides.html`).
- `assets/` at the root holds files several suites share: `suite.css` and `suite-chrome.js` (the shared suite
  chrome), `courses.css`, `home.css`, `section-jump.js`, `guide-inline.js` (Guides on narrow screens). A suite's own `assets/` holds only its own files.
- `private/` is git-ignored and local only (e.g. `private/HEBDEN/`, the Hebden 12 textbook PDFs). Use it for
  reference while writing content (see "Grade 12 content: follow Hebden"), but never link to it, copy files out of it into the site, or un-ignore it.
- A new unit or sim goes in its course folder, gets a card on that hub, and an entry in `sitemap.xml`.
- **Moving a public page changes its URL.** Update every link to it, its canonical / `og:url` / JSON-LD URLs and
  `sitemap.xml`, and add the old path to the redirect list in `404.html` so old links and bookmarks still work.

## Hosting & search

- The site is served by **GitHub Pages** at `https://atomicsimulations.ca/` (see `CNAME`). No build step.
- Every public page's `<head>` carries: a descriptive `<title>` (`Topic Simulation | Course`),
  `meta description`, an absolute `canonical` URL, Open Graph / Twitter tags, and a JSON-LD
  `LearningResource` block. Copy them from an existing sim when adding a page.
- Every page (public or dev-only) links the water-molecule tab icon just before `</head>`:
  `/assets/icons/favicon.svg`, with `/assets/icons/favicon-32.png` and `/assets/icons/apple-touch-icon.png` as fallbacks.
- Add each new public page to `sitemap.xml`. Dev-only pages (taste passes, screenshot harnesses)
  get `<meta name="robots" content="noindex, nofollow">` instead.
