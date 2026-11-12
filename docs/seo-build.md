# SEO publishing

Source pages belong to their feature branches. `npm run generate` copies the complete
site into a clean, ignored `dist/`, then generates SEO and discovery output there.
It never rewrites source HTML, the Musings engine, or the source sitemap.

`npm run build` generates `dist/` and runs the publication checks against that
actual output. `npm test` also generates the output before running the complete
suite. Netlify's Git build runs `npm run build` and publishes `dist/`.

The manual production script first verifies the canonical checkout, a clean
working tree, and an exact pushed `main`, then builds and publishes `dist/`.
Never publish the repository root or skip the existing source guard.

## New Musings

Add the slug to `posts/manifest.json` and its source to `posts/<slug>.md`.
The build creates a missing route shell, pre-renders the body, supplies metadata
and BlogPosting, and updates the sitemap, llms.txt and missing index links.
An existing custom article layout is preserved, including The Fabric gallery.

A film has `format: film`, `runtime: m:ss` (or `h:mm:ss`), `video`, and a cover.
The referenced media must exist. Film runtime is displayed instead of reading
time, and VideoObject gets an ISO 8601 duration, upload date, thumbnail and video
URL. `tests/fixtures/the-turn.md` is the real front matter and copy from the
Studio branch, used only as an isolated fixture, not a published post here.

`data/published-catalog.json` records the seven live posts and 81 live photo
paths. Tests protect each identity and its source asset, while allowing new
entries and short films. Extend that baseline when future work is published;
never remove a protected item without an explicit retirement decision.
