# gfiore.com

Source for my personal website: **[gfiore.com](https://gfiore.com)**.

A minimal dark site with my experience, selected projects, public reports with documented outcomes, and favorite albums, movies, and golf courses.

Built with React, TypeScript, and Next.js. The deployment configuration targets Cloudflare Workers, using vinext to run the existing Next.js app. Personal content lives in GitHub; the app needs no runtime database, owner sign-in, or write credentials.

## Run locally

Requires Node.js 22.13 or newer and npm. Cloudflare builds use Node.js 24.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`.

Run the standard Next.js checks:

```sh
npm test
npm run typecheck
npm run build
```

Use `npm start` to serve the production build locally. No database migrations or environment secrets are needed.

## Cloudflare build

```sh
npm run build:cloudflare
npm run preview:cloudflare
# After Wrangler authentication:
npm run deploy:cloudflare
```

This build uses the pinned vinext beta and a local Workers preview. The standard Next.js commands remain available.

## Where to edit

| File | Contents |
| --- | --- |
| `app/Portfolio.tsx` | Experience, selected projects, curated reports and outcomes, and page components |
| `app/featured-projects/` | Automatic featured project carousel, curated project data, responsive layout, and design notes |
| `app/MotionProvider.tsx` | Shared pause state for project rotation, video, and the interactive background |
| `content/favorites.json` | Favorite albums, movies, and golf courses |
| `app/favorite-media.ts` | Artwork matching, image sources, and photo credits |
| `public/favorites/` | Album covers, movie posters, and course photos |
| `public/projects/` | Original project screenshots and the Ousel walkthrough |
| `app/globals.css` | Layout and dark theme |
| `app/github-data.ts` | Hosted public GitHub feed reader and committed fallback |
| `app/github-data-core.ts` | Public GitHub source validation and feed generation logic |
| `content/github-fallback.json` | Committed public snapshot used during feed outages |
| `vite.cloudflare.ts`, `wrangler.jsonc` | Cloudflare Workers build and runtime configuration |
| `netlify.toml` | Previous Netlify configuration, retained during the hosting migration |

Edit a file on GitHub and commit it to `main`, or merge a pull request. With the deployment secret configured, GitHub Actions runs the checks and publishes each `main` update to Cloudflare. The footer's **Edit favorites** link opens the favorites file in GitHub. Image matching uses the favorite titles, so adding a new title may also require a media entry and an image.

## Automatic updates

The Cloudflare deployment workflow in GitHub Actions publishes changes from `main` without a desktop computer, open browser, or Codex task. The build command is `npm test && npm run typecheck && npm run build:cloudflare`; the deploy command is `npm run deploy:cloudflare`. Failed checks or builds leave the previous successful deployment in place.

GitHub Actions separately refreshes public project details, featured issue states, the latest SQLSage release, and recent authored public reports every six hours. The website checks that public feed with five-minute fetch revalidation, without rebuilding the site or using GitHub credentials. A validated committed snapshot keeps the content available if the feed cannot be read.

See [automatic updates](docs/automatic-updates.md) for deployment setup, content sources, and verification. Legacy Sites helpers, hosting metadata, and D1 migrations remain in the repository as historical tooling; the public site runtime and Cloudflare deployment do not use them.

## Credits

Image credits are listed on the site and in `app/favorite-media.ts`. Artwork and photographs retain their respective ownership and licenses; see [NOTICE.md](NOTICE.md). Bundled third-party code retains the license notices in `scripts/vite/sites-vite-plugin.LICENSE` and `vendor/shadcn-tailwind-4.13.0.LICENSE.md`.
