# Automatic updates

## Website publication

Vercel's Git integration is the deployment path for `Figo5/gfiore.com`. Import the repository into a Vercel Hobby project and set `main` as the production branch. The checked-in `vercel.json` supplies the framework and commands:

| Setting | Value |
| --- | --- |
| Base directory | Repository root |
| Production branch | `main` |
| Build command | `npm test && npm run typecheck && npm run build` |
| Install command | `npm ci` |
| Framework/output directory | Next.js / framework default |
| Node.js version | `24.x` in Vercel project settings |

Vercel's native Next.js integration supports the App Router, server routes, and persistent fetch revalidation. Keep `.vercel/` ignored. This personal site requires no runtime secrets or database. Use the free Hobby plan for this personal, non-commercial site.

For a content or code change:

1. Edit the relevant file in GitHub, or push a local change to a branch.
2. Commit to `main`, or merge the pull request into `main`.
3. Vercel checks out the commit, installs dependencies, runs the tests and TypeScript check, and builds the site.
4. A successful build is published as an atomic deployment. A failed check or build leaves the previous successful deployment serving visitors. Fix the failure and push a new commit.

This runs on Vercel's cloud infrastructure. No desktop computer, local publisher state file, scheduled Codex task, or Sites source credential is part of the deployment path. Limit production builds to `main`; the separate `github-data` branch contains feed data and does not need website deployments. In Vercel's Git settings, use a custom Ignored Build Step of `test "$VERCEL_GIT_COMMIT_REF" = "github-data"` to skip that branch while retaining normal preview builds.

Configure `gfiore.com` and `www.gfiore.com` on the Vercel project using the exact DNS records supplied by Vercel. Verify the deployment at its Vercel URL before switching the domain records, then verify HTTPS on both domains. Preserve unrelated email and verification records. Repository configuration alone does not connect the GitHub integration or change DNS.

After confirming the Vercel custom domains, disable Git builds on the previous Netlify project so future commits do not consume its allowance. Keep the existing Netlify deployment available during cutover. `netlify.toml` remains as the previous host's configuration; Vercel does not use it.

### Deployment verification

`npm run build` writes `public/deployment.json` with the repository, production branch, and full GitHub commit. Vercel's `VERCEL_GIT_COMMIT_SHA` supplies the build's commit. The previous host's `COMMIT_REF` remains supported; local builds use `git rev-parse HEAD`. Enable Vercel's system environment variables for Git metadata.

After publishing, check both custom domains:

- `/deployment.json` reports the intended `main` commit.
- The homepage loads the expected experience, projects, reports and outcomes, favorites, and images.
- `/api/github` returns a valid public snapshot.
- `/api/profile` returns the committed favorites with `canEdit: false`; `PUT /api/profile` returns `405`.

When investigating a failed build, use the Vercel deployment log for the failing commit. Do not change production DNS or bypass failed checks to publish an unverified build.

## Personal content

Experience, selected projects, and featured reports are curated in `app/Portfolio.tsx`. Favorites are stored in `content/favorites.json`; the initial file preserves the existing published favorites. The footer's **Edit favorites** link opens this file in GitHub. Keep each favorite's `title`, `note`, and `url` fields; use an empty string for optional notes or links.

The **Featured projects** section uses an automatic carousel in `app/featured-projects/FeaturedProjects.tsx`. Its curated data lives in `app/featured-projects/projects.ts`: Civicfolio, Ousel, SQLSage, EdgeTerminal, DiffGuard, and Lab in a Box. Project names, straightforward descriptions, technology labels, and links appear above compact media. The section and media frames are transparent over the existing interactive grain background. Slides advance every five seconds, including the muted Ousel recording, and loop back to the beginning. There is no dropdown, navigation toolbar, counter, or dot navigation. Visitors can browse with arrow keys, Home/End, or drag gestures. Hover does not stop rotation. The plain-text **Pause motion** control pauses the carousel, video, and background together; the footer control shares that state through `app/MotionProvider.tsx`. Offscreen or hidden-tab playback stops. Reduced motion removes carousel transitions and retains the background's static fallback. CLI excerpts remain selectable text. Civicfolio and EdgeTerminal use October 30, 2026 local application captures; other examples retain their latest published assets. Featured selection, descriptions, media, and links stay curated. Demo captions remain accessible to screen readers; refresh the media when the corresponding product changes. Media provenance is recorded in `NOTICE.md`. The other four projects remain under **More projects**, including upgrade-check.

The **Reports & outcomes** section is a curated selection of public work with a documented result. Each entry explains the report and links to the upstream fix or maintainer response. Distinguish a merged fix from an acknowledgment; a closed issue alone does not establish remediation. Verify the public evidence and update the review date when changing these entries. Private reports, pending credit invitations, and unresolved report feeds are not displayed. A private report becoming closed does not authorize publishing it here; wait for a public advisory or other authorized disclosure.

Album covers, movie posters, and course photos are matched by title in `app/favorite-media.ts`, with local files under `public/favorites/`. Add media and its attribution there when adding favorites that need new images. A title without matching artwork displays a simple initial tile.

The application has no browser editor, runtime database, or writable profile API. GitHub repository permissions control who can change the content. No owner runtime secret or identity headers are used.

## Public GitHub content

The **Refresh public GitHub data** Actions workflow updates a public snapshot every six hours and saves `github.json` on the separate `github-data` branch. It also supports **Run workflow** and refreshes when its workflow or source changes on `main`. A failed refresh keeps the previous feed.

The website reads this fixed public feed through Next.js's persistent fetch cache, with a five-minute revalidation interval. Requests can refresh the cached feed without a new deployment. The feed's own timestamp determines freshness: data older than six hours is marked stale. If the feed request or validation fails, the site serves the validated snapshot in `content/github-fallback.json` and marks it stale. Refresh that committed fallback when a newer baseline is wanted.

The four projects under **More projects** keep their order and curated stage notes. Their repository descriptions, primary languages, last-push dates, and archived status come from GitHub. The feed also retains public issue states, recent contributions, and the latest SQLSage release for API consumers; those fields do not automatically add reports to the homepage.

Report selection, outcome wording, experience, and favorites stay curated. The report review date is separate from the project feed's sync date. An issue closing does not automatically become a confirmed security finding or a maintainer credit. The automatic feed publishes only public GitHub data. The Actions job uses its temporary repository-scoped token to refresh public API data and update the data branch; that token stays in the job. The website uses no GitHub credentials, and private report bodies are not sent to visitors.

## Historical Sites tooling

The repository retains the earlier Sites sync helper, `.openai` hosting metadata, and D1 schema/migrations as historical tooling. They are not called by the Next.js runtime or Vercel build. The previous local polling publisher is not required for Git continuous deployment, and its state file is not a deployment authority.
