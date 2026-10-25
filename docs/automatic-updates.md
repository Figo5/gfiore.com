# Automatic updates

## Public GitHub content

GitHub Actions refreshes a public snapshot every six hours and saves `github.json` on the repository's separate `github-data` branch. The site reads that feed into a shared D1 cache. The next visitor can trigger a cache refresh; the owner's computer and browser do not need to be open. Concurrent requests share a refresh lease. The direct public GitHub API is a fallback. If a source is unavailable or rate-limited, the last successful data remains visible and retries back off.

The nine selected projects keep their order and curated stage notes. Repository descriptions, primary languages, last-push dates, and archived status come from GitHub. Featured issue states and the latest SQLSage release refresh too. Up to three other public reports or pull requests authored by Figo5 appear as compact links.

Acknowledgment wording, featured write-ups, experience, and favorites stay curated. An issue closing does not automatically become a confirmed security finding or a maintainer credit. Only public GitHub data is published. The Actions job uses its temporary repository-scoped token to refresh public API data and update the data branch; that token stays in the job. The website uses no GitHub credentials, and no private repository data is sent to visitors.

The Actions workflow also supports **Run workflow** and refreshes when its source or workflow changes on `main`. A failed refresh keeps the previous feed. Data-branch commits do not trigger a website rebuild.

## Website publication

A Codex heartbeat checks `Figo5/gfiore.com`'s `main` branch hourly. It publishes only when the remote commit differs from the last successfully deployed commit. This is periodic polling rather than an immediate GitHub push hook. It needs the computer powered on, Codex running, and Sites available.

GitHub is the source for code changes. The existing Sites project continues to own hosting, D1 data, runtime secrets, authentication, and the custom domains. No GitHub deployment secret is required.

### Publisher runbook

The automation prompt supplies the exact Site ID, workspace directory, and publisher-state file. Those installation-specific settings stay outside the public repository.

1. Read the remote `main` SHA using `git ls-remote https://github.com/Figo5/gfiore.com.git refs/heads/main`. Compare it with the last successful GitHub commit in the local publisher-state JSON. When unchanged, finish quietly without rebuilding or republishing.
2. For a changed commit, create a unique run directory inside the designated workspace's `work/auto-publish/runs/`. Clone the public repository into `source/` there. Use this clean clone instead of resetting an existing working checkout. Record the exact cloned commit.
3. Read the Sites skill and the existing published Site. Preserve its audience, custom domains, runtime variables, and storage bindings. Obtain a fresh short-lived source credential and use the Sites source helper to open the same Site into the run's empty `hosted/` directory. Keep credentials in session memory and pass them to the helper through hidden stdin only.
4. From the cloned GitHub source, run `node scripts/prepare-sites-sync.mjs --target <absolute-hosted-checkout> --project-id <exact-existing-site-id>`. The helper checks both repositories, preserves the live hosting manifest and ignored runtime files, rejects binding changes or unsafe source paths, mirrors committed regular files, and records the GitHub commit in `.openai/github-source.json` and `public/deployment.json`.
5. Use the Sites source helper with its complete prior opening result. Run missing dependency installation, the Sites build helper, the TypeScript check, and the repository tests as ordered commands before it commits, pushes, and packages. Do not reuse build output from another commit. The existing profile table and saved favorites must remain intact; Sites applies the checked-in migrations during publication.
6. Save the helper's exact pushed commit and matching archive with Sites, then deploy that saved version using the appropriate tool for the site's current audience. Wait for a terminal deployment result. If a version was already saved, retain and reuse its returned ID rather than saving it again.
7. After success, read `https://gfiore.com/deployment.json?commit=<github-sha>` and the equivalent `www` URL. Both must report the tested GitHub commit. Verify the homepage and `/api/github` return successful responses, and `/api/profile` remains non-editable for anonymous visitors.
8. Only after successful publication and readback, atomically update the local state JSON with `repository`, `branch`, `githubCommit`, `siteProjectId`, `siteCommit`, `versionId`, `deploymentId`, and `verifiedAt`. Report the new deployment. If a build or access check fails, do not publish. If publication or readback fails, retain the last successful state and report the actionable failure without bypassing approval or authentication. After a successful deployment with failed readback, restore the previously verified saved version when available and verify that rollback; never claim the old version is still live without checking.

The publisher never pushes changes back to GitHub, changes DNS, changes site sharing, or edits owner secrets. It must preserve unfinished local work. A change to hosting bindings or capabilities needs a separate reviewed update.

### Manual source preparation

The sync helper prepares source only; it does not authenticate, push, deploy, or alter DNS. Its target must be a clean existing Sites checkout with the expected project ID. Its source must be a clean committed checkout of this repository. Use the supported Sites workflow for publication.

```sh
node scripts/prepare-sites-sync.mjs --target /absolute/path/to/hosted-checkout --project-id EXISTING_SITE_ID
```
