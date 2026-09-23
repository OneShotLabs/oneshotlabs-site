# HANDOFF — OneShotLabs site (`oneshotlabs-site`)

**⚠️ This snapshot is OLDER than the current state of the project.**
David's most recent progress was made outside of Claude (in ChatGPT, on a different computer) and is **not** reflected here. Treat this branch as a checkpoint of where things stood as of the last GitHub push before that work, **not** as the latest version. Before continuing work, reconcile this against whatever came out of the ChatGPT/other-computer session.

- Branch: `claude-old-snapshot`
- Created from: `main` @ `412b0ad` ("Publish consolidated site and Career intelligence system"), pushed 2026-09-22 22:35 CDT
- `main` was not touched, modified, or merged to produce this branch or this file.

---

## What this project is

`oneshotlabs-site` is the source for David Jergovic's personal/professional site under the **OneShotLabs** brand — a static, no-build-step website (plain HTML/CSS/JS, no bundler/framework) deployed to Netlify. It serves three overlapping purposes:

1. **AI consulting practice** — positioning David (20 years in CRE finance / underwriting at PGIM Real Estate) as an independent AI consultant for commercial real estate finance teams ("Scoped engagements, built once, shipped in one shot" — the "One Shot" name).
2. **Career / professional narrative** — his PGIM background, underwriting expertise, and a standalone "Applied Intelligence Systems" portfolio piece (the Career Intelligence app).
3. **Photography portfolio + personal writing** — a photo portfolio and a "Musings" blog/journal (AI, photography, deliberate work).

There is no build system (no webpack/vite/etc.) — `package.json` exists mainly for a local dev server and a small Node-based test suite (`npm run dev`, `npm test`), plus two Netlify runtime dependencies (`@netlify/blobs`, `@netlify/functions`) used by serverless functions.

## Site map / what we built

| Page | File | Purpose / status |
|---|---|---|
| Home | `index.html` | Editorial origin-story homepage. Splash → header lockup → "Decision Cube" centerpiece → story copy. Large file (~143KB) — most animation/motion logic lives inline here. |
| AI | `ai.html` (served at `/ai`) | Core consulting page: intro → constellation visual → supporting evidence → the "AI Curve" self-assessment tool. This is the most-iterated page (see Known status / in-progress below). |
| AI Curve assessment | embedded in `ai.html` + `js/ai-curve.js`, `data/ai-curve-questions-public.json`, `netlify/functions/score-curve.js` | Interactive scored assessment; served with caching headers via `netlify.toml`. `friction-feedback.js` (Netlify function) captures user friction feedback. |
| Career | `career.html` | PGIM / underwriting career narrative. |
| Career Intelligence | `career-intelligence/` (`index.html`, `app.js`, `styles.css`) | Standalone "Applied Intelligence Systems" portfolio app, embedded/linked from Career. Newest major addition (added in the latest commit, `412b0ad`). |
| Decision Cube | `decision-cube/` + `css/decision-cube.css` + `js/decision-cube.js` | Interactive 3D-ish cube UI, now the homepage centerpiece (replaced an earlier "architecture" homepage treatment — see below). |
| Bio | `bio.html` | Combined bio for both the AI consulting and photography sides. |
| Photography | `photography.html` | Portfolio grid, editorial motion treatment (`css/photography-editorial.css`, `js/photography.js`, `js/photography-layout-tool.js`). Recently redesigned; EXIF reader is decoupled so images render without needing internet access. |
| Musings | `musings.html`, `post.html`, `posts/*.md`, `posts/manifest.json`, `musings/` | Blog/journal. Fully static-generated client-side from `posts/manifest.json` (rendering, cards, tags, search, sort, pagination, reading time, TOC, prev/next all driven by `js/musings.js` — manifest is the one manual step). Currently lists one live post: `ai-has-a-branding-problem`. Also has a pre-rendered static copy at `musings/ai-has-a-branding-problem/index.html`. Placeholder posts were removed in `b48ed88`. Blog routes were canonicalized to `/musings` (old `/blog` paths 301-redirect via `netlify.toml`). |
| Contact | `contact.html` | Contact form with a gold-rule/field-sequence animation. |
| 404 | `404.html` | Custom not-found page. |

### Archived / retired experiments (kept intentionally, not accidental cruft)
- `architectural-diorama/` and `architectural-ledger/` — two earlier AI-hero prototypes (3D diorama video hero, then an "Architectural Ledger" treatment). Both were superseded by the current AI page constellation/Decision Cube approach but are **kept on disk on purpose**, documented in `archive/ai-animation-2026-09-06/README.md`, with the production baseline commit (`86a3136…`, see that file) and staged branch (`codex/architectural-ledger-hero`) noted for recovery.
- `archive/homepage-timeline-v1.md` documents the original animated "Weeks → Days → Hours → Minutes" homepage timeline, retired in favor of the current editorial homepage. It's recoverable from an inert `<template id="archived-homepage-timeline-v1">` still sitting in `index.html`, or from commit `fd35b23`.
- These two archive docs are worth reading before ripping out anything that looks unused — several "dead" files are deliberately preserved fallbacks, not leftovers.

## Key decisions (from commit history / archive notes)

- **No framework, no build step** — deliberate; kept the whole site framework-free and hand-authored.
- **Homepage went through several redesigns**: animated timeline → editorial origin-story/founder-quote treatment → Decision Cube as the centerpiece after splash. Each pivot is preserved in git history and, in two cases, in `archive/`.
- **AI page hero went through three treatments**: Architectural Ledger hero → institutional "diorama" (Higgsfield-generated video) → current AI constellation + AI Curve assessment. Older treatments intentionally left recoverable rather than deleted.
- **Blog naming/routing was canonicalized**: "blog" → "Musings" everywhere (nav label, routes); old URLs redirect (301/302) rather than break.
- **Navy page-transition wipe was tried and explicitly rejected** ("provided no performance benefit" — see `REVIEW-NOTES.md`); current approach favors immediate navigation.
- **Motion/performance philosophy**: reveals are observer-driven (IntersectionObserver-style) and stop after completion — no continuous animation loops. Reduced-motion users get composed static states with a brief dissolve instead of spatial movement. This pattern is applied across Home, AI, Photography, and Contact per `REVIEW-NOTES.md`.
- **Photography EXIF reader decoupled**: the optional online EXIF lookup no longer blocks image rendering, so the portfolio works offline/without a network call.

## Current status per screen/feature (as of this snapshot)

- **Home** — Live on `main`. Decision Cube + editorial story sequence is the current, shipped design (multiple polish passes: scale, transition, typography, story wrapping).
- **AI page** — Live on `main`, most recently polished for mobile (`fe97fff`, merged PR #8) and typography-unified with an "approved REEFI treatment" (`749a967`, merged PR #3). Treat this as the most actively-worked page.
- **AI Curve assessment** — Live, backed by a Netlify function (`score-curve.js`) and a public question set (`data/ai-curve-questions-public.json`). Participation-globe UI (`js/participation-globe.js`) was sequenced carefully (moved below methodology, shown before live data is enabled) — check `netlify/functions/participation.ts` if reworking this.
- **Career Intelligence app** — Just published in the latest commit on `main` (`412b0ad`, ~22 hours before this snapshot). This is the newest feature and likely the least battle-tested — check it first if something seems unfinished.
- **Photography** — Redesigned and republished (`4d74ddd`); latest commit also tweaked its motion/caption behavior. Photo library spans 2024–2026 (many images), all filenames date-stamped.
- **Musings/blog** — Canonicalized and cleaned of placeholders in the latest commit. Only one real post live (`ai-has-a-branding-problem`); the manifest-driven system is otherwise ready for more posts (adding a post = write the `.md` + add one line to `posts/manifest.json`).
- **Contact** — Live, polished gold-rule/field animation.
- **Bio** — Live, canonical origin story (per `678f264`).

## Branches not yet merged into `main`

Only one remote branch is unmerged relative to `main`:
- `origin/codex/ai-curve-integration` (last commit `aa8bf10`, 2026-08-21) — appears to be superseded by the later `architectural-ledger-hero` → current AI page work, but it was never merged or explicitly closed out. Worth checking whether it's abandoned or still wanted before deleting.

GitHub also shows **1 open pull request** at the time of this snapshot — it was not inspected as part of this handoff (this snapshot was taken via a plain clone, not the GitHub API/UI), so check GitHub directly for what it contains before assuming it's covered by branch state above.

All other `codex/*` branches (`ai-mobile-polish`, `ai-typography-unification`, `architectural-ledger-hero`, `bio-origin-story`, `header-then-timeline`, `header-visible-silent-splash`, `home-header-transparent`, `static-header-lockup`) are already merged into `main` via PRs #2–#8 and can likely be deleted, but they were left as-is here since this handoff does not touch branches other than creating this one.

## Known bugs / rough edges

No explicit TODO/FIXME/bug markers were found in the codebase at this snapshot — the code and docs are unusually clean of inline bug notes. That said:

- The unmerged `codex/ai-curve-integration` branch (above) may represent an incomplete or abandoned thread — status unconfirmed.
- The open GitHub PR (also above) was not reviewed — could contain in-progress work, a bug fix, or be stale.
- `REVIEW-NOTES.md` describes itself as documenting a **local-only review build that was never deployed to Netlify** — worth confirming whether everything it describes actually made it into the commits that followed, or whether some of that review round's feedback is still outstanding.
- No CI configuration was found in this repo (no `.github/workflows`) — `npm test` (`tests/*.cjs` and `tests/*.test.js` referenced in `package.json`) appears to be run manually/locally only.

## What was left to do

This snapshot has no explicit "next steps" document, so the following is inferred, not stated by David — verify against his newer (ChatGPT-side) progress before trusting it:

- Reconcile whatever was built in the newer, non-Claude session (the actual reason this branch exists) with what's here.
- Decide the fate of `origin/codex/ai-curve-integration` (merge, close, or delete).
- Review and resolve the 1 open GitHub pull request.
- Career Intelligence app (`career-intelligence/`) just shipped — likely needs real-world testing/feedback since it's the newest, least-iterated piece.
- Confirm whether the local-only review round documented in `REVIEW-NOTES.md` is now fully reflected in `main`, or whether some feedback from it is still pending.

---

*Generated by Claude while snapshotting the repo to a side branch at David's request, ahead of moving work to another computer. Source: a fresh clone of `github.com/OneShotLabs/oneshotlabs-site` at `main@412b0ad`. No files on `main` or any other existing branch were read-write touched, merged, rebased, or reset.*
