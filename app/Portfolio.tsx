import type { ProfileContent } from "./profile-types";
import type { GitHubSnapshot } from "./github-types";
import { FAVORITE_MEDIA, getFavoriteMedia } from "./favorite-media";

type FavoriteCategory = "albums" | "movies" | "courses";

type Project = { name: string; description: string; stack: string; url: string; stage?: string; notes?: string[] };
type Finding = { project: string; title: string; description: string; status: string; type: string; url: string; number: string; issueKey?: string; release?: boolean };

const projects: Project[] = [
  { name: "FairwayOS", description: "A golf-video analysis prototype for tracking the ball, clubhead, golfer, and cup.", stack: "Python · Computer vision", url: "https://github.com/Figo5/fairwayos", stage: "Prototype", notes: ["Development is paused at a research checkpoint."] },
  { name: "Gmail Tidy", description: "A Gmail cleanup CLI using declarative, non-destructive rules.", stack: "Python · CLI", url: "https://github.com/Figo5/gmail-tidy" },
  { name: "Civicfolio", description: "A local-first stock research app with cited hypotheses, market context, and a research journal.", stack: "TypeScript · Research tools", url: "https://github.com/Figo5/civicfolio" },
  { name: "Balatro AI Sparring", description: "An experimental local AI practice companion for Balatro.", stack: "Python · AI", url: "https://github.com/Figo5/BalatroAISparring", stage: "In development", notes: ["Development is in progress; it is not yet playable."] },
  { name: "SQLSage", description: "A PostgreSQL CLI for query analysis and rewrite suggestions.", stack: "TypeScript · PostgreSQL", url: "https://github.com/Figo5/sqlsage" },
  { name: "AgentOps", description: "A local viewer for coding-agent activity, handoffs, and verdicts.", stack: "TypeScript · Developer tools", url: "https://github.com/Figo5/agentops" },
  { name: "EdgeTerminal", description: "A local NFL research beta for comparing prices, inspecting projections, and tracking forecasts.", stack: "Python · Research tools", url: "https://github.com/Figo5/edgeterminal", stage: "Beta" },
  { name: "Lab in a Box", description: "A local Docker lab for practicing web, API, and SSH security.", stack: "Python · Docker", url: "https://github.com/Figo5/lab-in-a-box" },
  { name: "DiffGuard", description: "AI-assisted git diff reviews for security issues and unintended behavior changes.", stack: "TypeScript · Code review", url: "https://github.com/Figo5/diffguard" },
];

const findings: Finding[] = [
  { project: "qs", title: "Object-input prototype assignment", description: "Reported an object-input parsing regression. The merged upstream fix references my report.", status: "Report addressed · Fix merged", type: "Contribution", url: "https://github.com/ljharb/qs/issues/633", number: "#633" },
  { project: "follow-redirects", title: "Affected-version correction", description: "Compared redirect-header behavior across releases and reported an affected-range gap.", status: "Maintainer acknowledged · Completed", type: "Acknowledgment", url: "https://github.com/follow-redirects/follow-redirects/issues/294#issuecomment-6344092099", number: "#294", issueKey: "follow-redirects/follow-redirects#294" },
  { project: "oapi-codegen", title: "Middleware routing analysis", description: "Contributed an analysis of how middleware and request routing interpret encoded paths.", status: "Public contribution · Awaiting response", type: "Contribution", url: "https://github.com/oapi-codegen/nethttp-middleware/issues/89#issuecomment-6383483915", number: "#89", issueKey: "oapi-codegen/nethttp-middleware#89" },
  { project: "tar-fs", title: "Archive extraction version matrix", description: "Documented a destination-symlink regression and the versions affected.", status: "Public report · Awaiting response", type: "Finding", url: "https://github.com/mafintosh/tar-fs/issues/122", number: "#122", issueKey: "mafintosh/tar-fs#122" },
  { project: "Node.js", title: "NO_PROXY loopback matching", description: "Reported loopback hostname forms that do not match NO_PROXY as expected.", status: "Correctness report · Awaiting response", type: "Contribution", url: "https://github.com/nodejs/node/issues/66853", number: "#66853", issueKey: "nodejs/node#66853" },
  { project: "SQLSage", title: "v0.2.2 release", description: "A release of my PostgreSQL query explainer and optimizer CLI.", status: "Own-project release", type: "Release", url: "https://github.com/Figo5/sqlsage/releases/tag/v0.2.2", number: "v0.2.2", release: true },
];

const privateReports: { project: string; repository: string; count?: number }[] = [
  { project: "validator.js", repository: "validatorjs/validator.js" },
  { project: "node-tar", repository: "isaacs/node-tar" },
  { project: "python-multipart", repository: "Kludex/python-multipart" },
  { project: "safehtml", repository: "google/safehtml" },
  { project: "liquidjs", repository: "harttle/liquidjs", count: 2 },
  { project: "Kong", repository: "Kong/kong" },
  { project: "unzipper", repository: "ZJONSSON/node-unzipper" },
  { project: "kin-openapi", repository: "getkin/kin-openapi" },
  { project: "happy-dom", repository: "capricorn86/happy-dom" },
  { project: "SvelteKit", repository: "sveltejs/kit" },
];

const favoriteLabels: Record<FavoriteCategory, string> = {
  albums: "Favorite albums",
  movies: "Favorite movies",
  courses: "Golf courses",
};

function safeLink(value: string): string | undefined {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; } catch { return undefined; }
}

function shortDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function repositoryName(url: string) {
  return url.split("/").at(-1)?.toLowerCase() || "";
}

export default function Portfolio({ initialProfile: profile, github }: { initialProfile: ProfileContent; github: GitHubSnapshot }) {
  const hasFavorites = profile.albums.length + profile.movies.length + profile.courses.length > 0;
  const displayedMedia = FAVORITE_MEDIA.filter(media => profile[media.category].some(item => getFavoriteMedia(media.category, item.title)?.src === media.src));
  const recentReports = github.contributions.filter(contribution => !findings.some(finding => finding.url.split("#")[0] === contribution.url));

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-shell">
        <header className="site-header" id="top">
          <div className="identity"><h1>Gio Fiore</h1></div>
          <nav className="profile-links" aria-label="Profile links">{hasFavorites && <a href="#favorites-title">Favorites</a>}<a href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/gfiore25/" target="_blank" rel="noopener noreferrer">LinkedIn</a></nav>
        </header>

        <main id="main">
          <section className="experience-section" aria-labelledby="experience-title">
            <h2 id="experience-title">Experience</h2>
            <div className="experience-grid">
              <article className="experience-item"><h3>Welty Enterprises</h3><p className="experience-role">Junior Solutions Engineer</p><p className="experience-dates">Aug 2026–present</p><p className="experience-summary">Internal AI tools and cloud integrations on Azure.</p></article>
              <article className="experience-item"><h3>Cleveland Metroparks</h3><p className="experience-role">IT Rotational Intern</p><p className="experience-dates">May–Aug 2026</p><p className="experience-summary">Designed and deployed a zoo scavenger hunt web app.</p></article>
              <article className="experience-item"><h3>Mentor Public Schools</h3><p className="experience-role">Information Technology Assistant</p><p className="experience-dates">May–Aug 2025</p><p className="experience-summary">Device deployment, helpdesk support, and school technology.</p></article>
            </div>
            <p className="education-line">Kent State University · B.S. Emerging Media & Technology, 2026 · Entrepreneurship minor</p>
          </section>

          <div className="main-columns">
            <section className="projects-column" aria-labelledby="projects-title">
              <div className="column-heading"><h2 id="projects-title">Projects</h2><a className="subtle-link" href="https://github.com/Figo5?tab=repositories" target="_blank" rel="noopener noreferrer">All repos</a></div>
              <div className="project-list">{projects.map(project => {
                const repository = github.repositories[repositoryName(project.url)];
                const stage = repository?.archived ? "Archived" : project.stage;
                const pushed = shortDate(repository?.pushedAt ?? null);
                const stack = repository?.language ? [repository.language, ...project.stack.split(" · ").slice(1)].join(" · ") : project.stack;
                return <article className="project-row" key={project.name}>
                  <div className="item-heading"><h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>{stage && <span>{stage}</span>}</div>
                  <p>{repository?.description || project.description}</p>
                  <div className="item-meta"><span>{stack}{pushed && <span className="project-updated"> · Updated {pushed}</span>}</span><a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} on GitHub`}>GitHub</a></div>
                  {project.notes && <details className="project-details"><summary>Details</summary><div>{project.notes.map(note => <p key={note}>{note}</p>)}</div></details>}
                </article>;
              })}</div>
            </section>

            <aside className="findings-column" aria-labelledby="findings-title">
              <div className="column-heading"><h2 id="findings-title">Findings & contributions</h2><a className="subtle-link" href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a></div>
              <p className="column-intro">Public contributions, private security reports, and things I’ve released.</p>
              <div className="findings-list">{findings.map(finding => {
                const issue = finding.issueKey ? github.issues[finding.issueKey.toLowerCase()] : undefined;
                const release = finding.release ? github.latestRelease : null;
                const title = release ? `${release.tag} release` : finding.title;
                const url = release?.url || finding.url;
                const number = release?.tag || finding.number;
                const status = issue ? `${finding.status.split(" · ")[0]} · ${issue.state === "closed" ? "Closed" : "Open"}` : finding.status;
                return <article className="finding-row" key={finding.url}><div className="finding-label"><span>{finding.project}</span><span>{finding.type}</span></div><h3><a href={url} target="_blank" rel="noopener noreferrer">{title}</a></h3><p>{finding.description}</p><div className="finding-footer"><span>{status}</span><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${finding.project} ${finding.type === "Release" ? "release" : "issue"} ${number}`}>{number}</a></div></article>;
              })}</div>
              <section className="private-advisories" aria-labelledby="private-advisories-title">
                <h3 id="private-advisories-title">Private reports in triage</h3>
                <p>Reporter credit accepted on {privateReports.reduce((total, report) => total + (report.count ?? 1), 0)} private security reports. All are awaiting maintainer review; none is published yet.</p>
                <ul>{privateReports.map(report => <li key={report.repository}><a href={`https://github.com/${report.repository}`} target="_blank" rel="noopener noreferrer">{report.project}</a><span>{report.count && report.count > 1 ? `${report.count} reporter credits accepted` : "Reporter credit accepted"}</span></li>)}</ul>
                <p className="private-advisories-note">Updated October 28, 2026. Technical details remain private.</p>
                <a className="subtle-link" href="https://github.com/advisories?query=credit%3AFigo5+sort%3Acreated-desc" target="_blank" rel="noopener noreferrer">Published credits on GitHub</a>
              </section>
              {recentReports.length > 0 && <section className="recent-reports" aria-labelledby="recent-reports-title">
                <h3 id="recent-reports-title">Recent public reports</h3>
                <ul>{recentReports.map(contribution => <li key={contribution.url}><div><span>{contribution.repository}</span><span>{contribution.action}</span></div><a href={contribution.url} target="_blank" rel="noopener noreferrer">{contribution.title}</a>{shortDate(contribution.occurredAt) && <time dateTime={contribution.occurredAt}>{shortDate(contribution.occurredAt)}</time>}</li>)}</ul>
              </section>}
              <p className="dated-note">{github.fetchedAt ? `${github.stale ? "Last synced" : "GitHub updated"} ${shortDate(github.fetchedAt)}.` : "Featured reports reviewed October 24, 2026."}</p>
            </aside>
          </div>

          {hasFavorites && <section className="favorites-section" aria-labelledby="favorites-title"><div className="favorites-heading"><h2 id="favorites-title">A few favorites</h2></div><div className="favorites-grid">{(["albums", "movies", "courses"] as FavoriteCategory[]).map(category => {
            const label = favoriteLabels[category];
            const items = profile[category];
            if (items.length === 0) return null;
            return <section className="favorite-category" key={category} aria-labelledby={`${category}-title`}><div className="favorite-heading"><h3 id={`${category}-title`}>{label}</h3></div>
              <ul className={`favorite-gallery favorite-gallery-${category}`}>{items.map((item, index) => {
                const media = getFavoriteMedia(category, item.title);
                const target = safeLink(item.url) || media?.sourceUrl;
                const content = <>{media ? <img className="favorite-art" src={media.src} alt={media.alt} width={300} height={category === "movies" ? 450 : category === "courses" ? 200 : 300} loading="lazy" decoding="async" /> : <span className="favorite-art favorite-art-empty" aria-hidden="true">{item.title.slice(0, 1)}</span>}<span className="favorite-caption"><span className="favorite-name">{item.title}</span>{item.note && <span className="favorite-note">{item.note}</span>}</span></>;
                return <li key={`${item.title}-${index}`}>{target ? <a className="favorite-tile" href={target} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title}`}>{content}</a> : <div className="favorite-tile">{content}</div>}</li>;
              })}</ul>
            </section>;
          })}</div>{displayedMedia.length > 0 && <details className="image-credits"><summary>Image sources</summary><ul>{displayedMedia.map(media => <li key={media.src}><a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">{media.title}</a><span> — {media.credit}{media.licenseUrl && <> · <a href={media.licenseUrl} target="_blank" rel="noopener noreferrer">{media.license}</a></>}</span></li>)}</ul></details>}</section>}
        </main>

        <footer className="site-footer"><span>Gio Fiore · 2026</span><div><a href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/gfiore25/" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://github.com/Figo5/gfiore.com/edit/main/content/favorites.json" target="_blank" rel="noopener noreferrer">Edit favorites</a><a href="#top">Back to top</a></div></footer>
      </div>
    </>
  );
}
