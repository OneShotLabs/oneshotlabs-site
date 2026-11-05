# OneShotLens production source

This repository is the canonical source for `oneshotlens.com`.

## Production safety

- Never deploy the site from a dated task snapshot, handoff folder, downloaded deploy, partial copy, stale release branch, or unreconciled working directory.
- Before changing or deploying production, fetch `origin` and reconcile `main` so Git contains every live change. Do not use a production deploy as the only copy of a change.
- Before any `netlify deploy --prod`, run `npm run verify:production-source` from the intended publish directory.
- Photo-only updates must first be applied on top of the latest `origin/main`; a Netlify CLI deploy publishes the whole directory, not only changed photo files.
- Keep every published Musings slug in all three places: `posts/manifest.json`, `musings.html`, and `sitemap.xml`. The article markdown, route shell, and referenced media must also exist.
- Run `node --test tests/published-musings-catalog.test.cjs` before every production deploy, plus the tests relevant to the files changed. The Netlify production build must keep this catalog gate enabled.
- Preserve `.netlify/` in `.gitignore`. Link only this canonical checkout to the OneShotLens Netlify project.
- This checkout is the only local directory authorized to link to the OneShotLens Netlify production site. Dated task folders and alternate clones are snapshots and must stay unlinked.
- Prefer Git-backed production deploys from `origin/main`. If a manual production deploy is unavoidable, run only `npm run deploy:production` from this clean canonical checkout after its commit has been pushed. Never bypass the source guard with a raw `netlify deploy --prod` command.

## Published Musings

The catalog test is the authoritative regression guard. Update its `published` list whenever a new post goes live; never remove an existing slug unless the user explicitly retires that post.
