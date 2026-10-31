# AGENTS.md — DiSimulations (repo-wide conventions)

These rules apply to every sim in this repo. Project folders may add their own `AGENTS.md`
with more specific build rules; those add to this file, they don't replace it.

## Student-facing copy

- **No personification of particles.** Atoms, ions, molecules, and electrons are not people.
  Don't give them wants, feelings, or agency.
  - "who sticks" → "what sticks"; "who pulls harder" → "which atom pulls the electrons more"
  - Avoid: *wants to*, *likes*, *is happy/greedy/hungry*, *steals*, *shares nicely*, *wins*.
  - Physical verbs are fine: *pulls*, *attracts*, *repels*, *shifts*, *bonds*.
- **Atoms are spheres, not balls**, when describing space-filling or model-kit atoms.

## Hosting & search

- The site is served by **GitHub Pages** at `https://atomicsimulations.ca/` (see `CNAME`). No build step.
- Every public page's `<head>` carries: a descriptive `<title>` (`Topic Simulation | Course`),
  `meta description`, an absolute `canonical` URL, Open Graph / Twitter tags, and a JSON-LD
  `LearningResource` block. Copy them from an existing sim when adding a page.
- Add each new public page to `sitemap.xml`. Dev-only pages (taste passes, screenshot harnesses)
  get `<meta name="robots" content="noindex, nofollow">` instead.
