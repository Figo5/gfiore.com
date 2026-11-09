# Automatic updates

## Website publication

The public site targets the `gfiore-com` Cloudflare Worker. Its temporary address is <https://gfiore-com.ginoman525.workers.dev>. The original Next.js app remains intact; the Cloudflare build uses the existing pinned vinext beta with a separate `vite.cloudflare.ts`, without the historical Sites database or connector bindings.

| Setting | Value |
| --- | --- |
| Git repository | `Figo5/gfiore.com` |
| Production branch | `main` |
| Install command | `npm ci` |
| Build command | `npm test && npm run typecheck && npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Node.js version | `24` |
| Worker configuration | `wrangler.jsonc` |
| Generated deploy configuration | `dist/server/wrangler.json` |

The `.github/workflows/cloudflare.yml` workflow runs these commands on GitHub Actions for `main` pushes and manual dispatches. Configure the repository secret `CLOUDFLARE_DEPLOY_TOKEN` with a Cloudflare Individual Workers Editor token scoped only to `gfiore-com`. The workflow never deploys pull request code or the data-only `github-data` branch. A failed check or build leaves the previous successful version serving visitors. No separate Cloudflare Git integration is required.

Build and test locally with:

```sh
npm ci
npm test
npm run typecheck
npm run build:cloudflare
npm run preview:cloudflare
```

The preview uses the actual Workers runtime. `npm run deploy:cloudflare` uploads a version and activates exactly that version after Wrangler authentication. It preserves the domain bindings managed in Cloudflare and avoids account-wide subdomain permissions. Version preview URLs are disabled so the Worker-only token can perform this operation. Do not deploy the historical `vite.config.ts`, which belongs to the old Sites workflow.

Use Workers Free, with no paid add-ons. Its request, CPU, and bundle limits still apply. This build needs only static assets and the Worker; it requires no runtime secret, database, or paid image optimization. The public GitHub feed retains five-minute fetch revalidation and a validated committed fallback. No GitHub token is exposed to visitor requests.

### Custom domain cutover

Add `gfiore.com` to Cloudflare on the free domain plan, copy all existing DNS records, and verify the imported records against Namecheap before changing nameservers. Preserve email, verification, and other unrelated records. The domain registration stays at Namecheap; Cloudflare becomes the DNS provider.

After the Workers deployment is verified, attach both `gfiore.com` and `www.gfiore.com` as Worker Custom Domains. Use Cloudflare's exact assigned nameservers in Namecheap. Verify HTTPS and the endpoints below on both domains after activation. Retain the old Netlify deployment during the change; `netlify.toml` remains as recovery configuration. Once the domain is confirmed on Cloudflare, stop Git builds at Netlify.

The Vercel attempt was blocked before project creation because the existing Hobby team was paused for CPU usage. No Vercel hosting or paid upgrade was activated.

### Deployment verification

`npm run build:cloudflare` writes `public/deployment.json` with the repository and full Git commit. Cloudflare's `WORKERS_CI_COMMIT_SHA` supplies hosted build metadata; Vercel's `VERCEL_GIT_COMMIT_SHA`, Netlify's `COMMIT_REF`, and local Git remain supported for alternate builds.

After publishing, check both custom domains:

- `/deployment.json` matches the deployed Git commit.
- `/` serves the current experience, Ousel walkthrough, and upgrade-check project.
- `/api/github` returns a valid public snapshot.
- `/api/profile` returns committed favorites with `canEdit: false`; `PUT /api/profile` returns `405`.
- The carousel responds to keyboard navigation and the Ousel video loads.

Use the GitHub Actions deployment log to investigate failures. Do not bypass failed checks or switch DNS to an unverified deployment.

## Personal content

Experience, selected projects, and featured reports are curated in `app/Portfolio.tsx`. Favorites are stored in `content/favorites.json`; the initial file preserves the existing published favorites. Edit this file directly in GitHub. Keep each favorite's `title`, `note`, and `url` fields; use an empty string for optional notes or links.

The **Featured projects** section uses an automatic carousel in `app/featured-projects/FeaturedProjects.tsx`. Its curated data lives in `app/featured-projects/projects.ts`: Civicfolio, Ousel, SQLSage, EdgeTerminal, DiffGuard, and Lab in a Box. Project names, straightforward descriptions, technology labels, and links appear above compact media. The section and media frames are transparent over the existing interactive grain background. Slides advance every five seconds, including the muted Ousel recording, and loop back to the beginning. There is no dropdown, navigation toolbar, counter, or dot navigation. Visitors can browse with arrow keys, Home/End, or drag gestures. Hover does not stop rotation. The plain-text **Pause motion** control pauses the carousel, video, and background together; the footer control shares that state through `app/MotionProvider.tsx`. Offscreen or hidden-tab playback stops. Reduced motion removes carousel transitions and retains the background's static fallback. CLI excerpts remain selectable text. Civicfolio and EdgeTerminal use October 30, 2026 local application captures; other examples retain their latest published assets. Featured selection, descriptions, media, and links stay curated. Demo captions remain accessible to screen readers; refresh the media when the corresponding product changes. Media provenance is recorded in `NOTICE.md`. The other four projects remain under **More projects**, including upgrade-check. Its entry is marked **Live on Agensi** and links to the [published marketplace listing](https://www.agensi.io/skills/upgrade-check), with Agensi as the link label.

The **Security research** section includes public findings, finder credits, and upstream acknowledgments. Each entry states its verified outcome and links to the public evidence. A CVE finder credit, published advisory credit, merged fix, and released fix are distinct outcomes; label them accordingly. Private reports and unpublished advisory details are not displayed. Verify public attribution and refresh the review date when changing entries.

The November 9, 2026 review adds [adm-zip's CVE finder credit](https://www.cve.org/CVERecord?id=CVE-2026-116137), [simple-git's merged fix and maintainer acknowledgment](https://github.com/steveukx/git-js/pull/1206), and [SiYuan's published reporter credit](https://github.com/siyuan-note/siyuan/security/advisories/GHSA-6pg3-pqxw-jm82). The CNA record credits Giovanni Fiore (Figo5) as finder of the adm-zip issue. simple-git's PR thanks Figo5 among the reporters whose proposals contributed to the changes; the entry claims a merged fix, without claiming authorship or a released version. SiYuan is shown as a published advisory credit: its advertised v3.8.10 fix still has no accessible tag or release, so the entry makes no released-fix claim. Unpublished reports remain omitted.

The existing [mcp-sanitizer exported-validator fix](https://github.com/starman69/mcp-sanitizer/pull/14) and [qs object-input fix](https://github.com/ljharb/qs/pull/636) remain. Both PRs are merged and their fixed npm packages are available. The November 2 local checks reproduced mcp-sanitizer's accepted exported-validator gap in 1.4.1 and confirmed that 1.4.2 rejects the four reported restricted URL forms and two sensitive paths while accepting benign controls; its separate duplicate relative-path gap is not claimed. Those checks also reproduced qs's attacker-controlled nested prototype in 6.16.1 and confirmed that released 6.17.1 preserves the ordinary prototype, keeps the input unchanged, and parses a benign query normally. The mcp-sanitizer repository advisory page and API confirm public reporter credit even though the global advisory index does not resolve its identifier.

Album covers, movie posters, and course photos are matched by title in `app/favorite-media.ts`, with local files under `public/favorites/`. Add media and its attribution there when adding favorites that need new images. A title without matching artwork displays a simple initial tile.

The application has no browser editor, runtime database, or writable profile API. GitHub repository permissions control who can change the content. No owner runtime secret or identity headers are used.

## Public GitHub content

The **Refresh public GitHub data** Actions workflow updates a public snapshot every six hours and saves `github.json` on the separate `github-data` branch. It also supports **Run workflow** and refreshes when its workflow or source changes on `main`. A failed refresh keeps the previous feed.

The website reads this fixed public feed through Next.js's persistent fetch cache, with a five-minute revalidation interval. Requests can refresh the cached feed without a new deployment. The feed's own timestamp determines freshness: data older than six hours is marked stale. If the feed request or validation fails, the site serves the validated snapshot in `content/github-fallback.json` and marks it stale. Refresh that committed fallback when a newer baseline is wanted.

The four projects under **More projects** keep their order and curated stage notes. Their repository descriptions, primary languages, last-push dates, and archived status come from GitHub. The feed also retains public issue states, recent contributions, and the latest SQLSage release for API consumers; those fields do not automatically add reports to the homepage.

Report selection, outcome wording, experience, and favorites stay curated. The report review date is separate from the project feed's sync date. An issue closing does not automatically become a confirmed security finding or a maintainer credit. The automatic feed publishes only public GitHub data. The Actions job uses its temporary repository-scoped token to refresh public API data and update the data branch; that token stays in the job. The website uses no GitHub credentials, and private report bodies are not sent to visitors.

## Historical Sites tooling

The repository retains the earlier Sites sync helper, `.openai` hosting metadata, and D1 schema/migrations as historical tooling. They are not called by the public site runtime or Cloudflare build. The previous local polling publisher is not required for Git continuous deployment, and its state file is not a deployment authority.
