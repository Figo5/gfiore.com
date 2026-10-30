# Automatic updates

## Website publication

Netlify's Git integration is the deployment path for `Figo5/gfiore.com`. Connect the repository to a Netlify project and set `main` as the production branch. The checked-in `netlify.toml` supplies:

| Setting | Value |
| --- | --- |
| Base directory | Repository root |
| Production branch | `main` |
| Build command | `npm test && npm run typecheck && npm run build` |
| Publish directory | `.next` |
| Node.js version | `24` |

Netlify supports the Next.js App Router and server routes through its OpenNext adapter. Use its automatically managed adapter rather than pinning a version. Keep `.netlify/` ignored and leave production deploys unlocked so successful Git builds can publish automatically.

For a content or code change:

1. Edit the relevant file in GitHub, or push a local change to a branch.
2. Commit to `main`, or merge the pull request into `main`.
3. Netlify checks out the commit, installs dependencies, runs the tests and TypeScript check, and builds the site.
4. A successful build is published as an atomic deployment. A failed check or build leaves the previous successful deployment serving visitors. Fix the failure and push a new commit.

This runs on Netlify's cloud infrastructure. No desktop computer, local publisher state file, scheduled Codex task, or Sites source credential is part of the deployment path. Limit production builds to `main`; the separate `github-data` branch contains feed data and does not need website deployments.

Configure `gfiore.com` and `www.gfiore.com` on the Netlify project using the DNS records supplied by Netlify. Verify a successful project deploy and HTTPS before switching the domains. Repository configuration alone does not connect the GitHub integration or change DNS.

### Deployment verification

`npm run build` writes `public/deployment.json` with the repository, branch, and full GitHub commit. Netlify's `COMMIT_REF` supplies the build's commit; local builds use `git rev-parse HEAD`.

After publishing, check both custom domains:

- `/deployment.json` reports the intended `main` commit.
- The homepage loads the expected experience, projects, reports and outcomes, favorites, and images.
- `/api/github` returns a valid public snapshot.
- `/api/profile` returns the committed favorites with `canEdit: false`; `PUT /api/profile` returns `405`.

When investigating a failed build, use the Netlify deploy log for the failing commit. Do not change production DNS or bypass failed checks to publish an unverified build.

## Personal content

Experience, selected projects, and featured reports are curated in `app/Portfolio.tsx`. Favorites are stored in `content/favorites.json`; the initial file preserves the existing published favorites. The footer's **Edit favorites** link opens this file in GitHub. Keep each favorite's `title`, `note`, and `url` fields; use an empty string for optional notes or links.

The **Reports & outcomes** section is a curated selection of public work with a documented result. Each entry explains the report and links to the upstream fix or maintainer response. Distinguish a merged fix from an acknowledgment; a closed issue alone does not establish remediation. Verify the public evidence and update the review date when changing these entries. Private reports, pending credit invitations, and unresolved report feeds are not displayed. A private report becoming closed does not authorize publishing it here; wait for a public advisory or other authorized disclosure.

Album covers, movie posters, and course photos are matched by title in `app/favorite-media.ts`, with local files under `public/favorites/`. Add media and its attribution there when adding favorites that need new images. A title without matching artwork displays a simple initial tile.

The application has no browser editor, runtime database, or writable profile API. GitHub repository permissions control who can change the content. No owner runtime secret or identity headers are used.

## Public GitHub content

The **Refresh public GitHub data** Actions workflow updates a public snapshot every six hours and saves `github.json` on the separate `github-data` branch. It also supports **Run workflow** and refreshes when its workflow or source changes on `main`. A failed refresh keeps the previous feed.

The website reads this fixed public feed through Next.js's persistent fetch cache, with a five-minute revalidation interval. Requests can refresh the cached feed without a new deployment. The feed's own timestamp determines freshness: data older than six hours is marked stale. If the feed request or validation fails, the site serves the validated snapshot in `content/github-fallback.json` and marks it stale. Refresh that committed fallback when a newer baseline is wanted.

The nine selected projects keep their order and curated stage notes. Repository descriptions, primary languages, last-push dates, and archived status come from GitHub. The feed also retains public issue states, recent contributions, and the latest SQLSage release for API consumers; those fields do not automatically add reports to the homepage.

Report selection, outcome wording, experience, and favorites stay curated. The report review date is separate from the project feed's sync date. An issue closing does not automatically become a confirmed security finding or a maintainer credit. The automatic feed publishes only public GitHub data. The Actions job uses its temporary repository-scoped token to refresh public API data and update the data branch; that token stays in the job. The website uses no GitHub credentials, and private report bodies are not sent to visitors.

## Historical Sites tooling

The repository retains the earlier Sites sync helper, `.openai` hosting metadata, and D1 schema/migrations as historical tooling. They are not called by the Next.js runtime or Netlify build. The previous local polling publisher is not required for Git continuous deployment, and its state file is not a deployment authority.
