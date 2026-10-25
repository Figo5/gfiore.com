# gfiore.com

Source for my personal website: **[gfiore.com](https://gfiore.com)**.

A minimal dark site with my experience, selected projects, public findings and contributions, and favorite albums, movies, and golf courses.

Built with React, TypeScript, Vinext/Vite, and Cloudflare Workers. Favorites use Cloudflare D1 and an owner-only editor with Sites authentication.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm run install:ci
npm run build
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_loud_shatterstar.sql
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_sweet_captain_flint.sql
npm run dev
```

Open `http://localhost:5173`. Run each SQL migration once for a new local database; saved local data stays in the ignored `.wrangler/` directory.

To try the favorites editor, copy `.dev.vars.example` to `.dev.vars`, restart the development server, and choose **Owner sign-in** in the footer. The example uses the starter's loopback-only mock identity. No real credentials are needed for local preview.

```sh
node node_modules/typescript/bin/tsc --noEmit
npm test
npm run build
```

## Where to edit

| File | Contents |
| --- | --- |
| `app/Portfolio.tsx` | Experience, projects, findings, and page components |
| `app/profile-types.ts` | Default favorite albums, movies, and golf courses |
| `app/favorite-media.ts` | Artwork matching, image sources, and photo credits |
| `app/globals.css` | Layout and dark theme |
| `app/api/profile/route.ts` | Validated owner-only saves |
| `app/profile-store.ts` | D1 persistence and owner authorization |
| `app/github-data-core.ts` | Public GitHub sources, validation, caching, and retry behavior |
| `db/schema.ts`, `drizzle/` | Database schema and migrations |

## Hosting and authentication

The live site is hosted on Sites. A Codex background publisher checks this repository's `main` branch hourly and publishes new commits after checks pass. The publisher needs the owner's computer and Codex running. The checked-in hosting manifest declares storage bindings and omits the live Site ID. Production data and deployment credentials are kept outside this repository.

Owner editing requires the server-side `SITE_OWNER_EMAIL` runtime secret for the first save, then the stored site-scoped user ID. The deployed app trusts identity headers supplied by Sites. If adapting it to another host, supply verified server-side authentication before enabling editing; arbitrary client identity headers must not be trusted. Local mock sign-in is restricted to loopback development requests.

Public visitors can browse without signing in. Anonymous and non-owner visitors cannot save changes. The old About field remains in the database schema for compatibility and is excluded from public responses.

Public GitHub project details, featured issue states, the latest SQLSage release, and recent authored public reports refresh through a shared six-hour cache. Last-good data remains available during GitHub outages. See [automatic updates](docs/automatic-updates.md) for the content sources and publication runbook.

## Credits

Image credits are listed on the site and in `app/favorite-media.ts`. Artwork and photographs retain their respective ownership and licenses; see [NOTICE.md](NOTICE.md). Bundled third-party code retains the license notices in `scripts/vite/sites-vite-plugin.LICENSE` and `vendor/shadcn-tailwind-4.13.0.LICENSE.md`.
