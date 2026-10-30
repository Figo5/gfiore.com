# gfiore.com

Source for my personal website: **[gfiore.com](https://gfiore.com)**.

A minimal dark site with my experience, selected projects, public reports with documented outcomes, and favorite albums, movies, and golf courses.

Built with React, TypeScript, and Next.js. The deployment configuration targets Netlify, with continuous deployment from this repository's `main` branch. Personal content lives in GitHub; the app needs no runtime database, owner sign-in, or write credentials.

## Run locally

Requires Node.js 22.13 or newer and npm. Netlify builds use Node.js 24.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`.

Run the same checks used for deployment:

```sh
npm test
npm run typecheck
npm run build
```

Use `npm start` to serve the production build locally. No database migrations or environment secrets are needed.

## Where to edit

| File | Contents |
| --- | --- |
| `app/Portfolio.tsx` | Experience, selected projects, curated reports and outcomes, and page components |
| `content/favorites.json` | Favorite albums, movies, and golf courses |
| `app/favorite-media.ts` | Artwork matching, image sources, and photo credits |
| `public/favorites/` | Album covers, movie posters, and course photos |
| `app/globals.css` | Layout and dark theme |
| `app/github-data.ts` | Hosted public GitHub feed reader and committed fallback |
| `app/github-data-core.ts` | Public GitHub source validation and feed generation logic |
| `content/github-fallback.json` | Committed public snapshot used during feed outages |
| `netlify.toml` | Deployment checks, build command, Node version, and publish directory |

Edit a file on GitHub and commit it to `main`, or merge a pull request. Once the Netlify project is connected to the repository, each `main` update runs the checks and build before publishing. The footer's **Edit favorites** link opens the favorites file in GitHub. Image matching uses the favorite titles, so adding a new title may also require a media entry and an image.

## Automatic updates

Website deployments run on Netlify's build infrastructure. They do not need a desktop computer, an open browser, or a Codex task. The build command is `npm test && npm run typecheck && npm run build`, and the publish directory is `.next`. Failed checks or builds leave the previous successful deployment in place.

GitHub Actions separately refreshes public project details, featured issue states, the latest SQLSage release, and recent authored public reports every six hours. The website checks that public feed through a five-minute Next.js fetch cache, without rebuilding the site or using GitHub credentials. A validated committed snapshot keeps the content available if the feed cannot be read.

See [automatic updates](docs/automatic-updates.md) for deployment setup, content sources, and verification. Legacy Sites helpers, hosting metadata, and D1 migrations remain in the repository as historical tooling; the Next.js runtime and Netlify deployment do not use them.

## Credits

Image credits are listed on the site and in `app/favorite-media.ts`. Artwork and photographs retain their respective ownership and licenses; see [NOTICE.md](NOTICE.md). Bundled third-party code retains the license notices in `scripts/vite/sites-vite-plugin.LICENSE` and `vendor/shadcn-tailwind-4.13.0.LICENSE.md`.
