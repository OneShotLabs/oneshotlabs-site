# OneShotLens production source

This repository is the canonical source for `oneshotlens.com`.

## Production safety

- Never deploy the site from a dated task snapshot, handoff folder, downloaded deploy, or partial copy.
- Before changing or deploying production, fetch `origin` and reconcile `main` so Git contains every live change. Do not use a production deploy as the only copy of a change.
- Keep every published Musings slug in all three places: `posts/manifest.json`, `musings.html`, and `sitemap.xml`. The article markdown, route shell, and referenced media must also exist.
- Run `node --test tests/published-musings-catalog.test.cjs` before every production deploy, plus the tests relevant to the files changed. The Netlify production build must keep this catalog gate enabled.
- Preserve `.netlify/` in `.gitignore`. Link only this canonical checkout to the OneShotLens Netlify project.
- Prefer Git-backed production deploys from `origin/main`. If a manual production deploy is unavoidable, deploy only this clean canonical checkout after its commit has been pushed.

## Published Musings

The catalog test is the authoritative regression guard. Update its `published` list whenever a new post goes live; never remove an existing slug unless the user explicitly retires that post.
