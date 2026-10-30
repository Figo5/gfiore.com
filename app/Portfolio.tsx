import type { ProfileContent } from "./profile-types";
import type { GitHubSnapshot } from "./github-types";
import { FAVORITE_MEDIA, getFavoriteMedia } from "./favorite-media";
import GrainBackground from "./GrainBackground";
import FeaturedProjects from "./featured-projects/FeaturedProjects";
import { FEATURED_PROJECT_URLS } from "./featured-projects/projects";

type FavoriteCategory = "albums" | "movies" | "courses";

type Project = { name: string; description: string; stack: string; url: string; stage?: string; notes?: string[] };
type Finding = { project: string; title: string; description: string; outcome: string; url: string; number: string; reference?: { label: string; url: string } };

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
  { project: "qs", title: "Object-input prototype assignment", description: "Found and reproduced a parsing regression that assigned an attacker-controlled prototype. The upstream fix references my report and copies the key as data.", outcome: "Fix merged · Oct 27, 2026", url: "https://github.com/ljharb/qs/issues/633", number: "#633", reference: { label: "Merged fix", url: "https://github.com/ljharb/qs/pull/636" } },
  { project: "follow-redirects", title: "Advisory affected-version gap", description: "Reproduced a redirect-header bypass on an earlier release and reported that the advisory's affected range omitted it. The maintainer acknowledged the report.", outcome: "Maintainer acknowledged · Oct 22, 2026", url: "https://github.com/follow-redirects/follow-redirects/issues/294", number: "#294", reference: { label: "Maintainer response", url: "https://github.com/follow-redirects/follow-redirects/issues/294#issuecomment-6344092099" } },
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

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-shell">
        <header className="site-header" id="top">
          <div className="identity"><h1>Gio Fiore</h1></div>
          <nav className="profile-links" aria-label="Profile links">{hasFavorites && <a href="#favorites-title">Favorites</a>}<a href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/gfiore25/" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://stackoverflow.com/users/33244143/gio-fiore" target="_blank" rel="noopener noreferrer">Stack Overflow</a></nav>
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

          <FeaturedProjects />

          <div className="main-columns">
            <section className="projects-column" aria-labelledby="projects-title">
              <div className="column-heading"><h2 id="projects-title">More projects</h2><a className="subtle-link" href="https://github.com/Figo5?tab=repositories" target="_blank" rel="noopener noreferrer">All repos</a></div>
              <div className="project-list">{projects.filter(project => !FEATURED_PROJECT_URLS.has(project.url)).map(project => {
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
              <p className="dated-note">{github.fetchedAt ? `${github.stale ? "Last synced" : "GitHub updated"} ${shortDate(github.fetchedAt)}.` : "Project details from public GitHub repositories."}</p>
            </section>

            <aside className="findings-column" aria-labelledby="findings-title">
              <div className="column-heading"><h2 id="findings-title">Reports & outcomes</h2><a className="subtle-link" href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a></div>
              <p className="column-intro">Selected public reports with a documented outcome.</p>
              <div className="findings-list">{findings.map(finding => <article className="finding-row" key={finding.url}><div className="finding-label"><span>{finding.project}</span><a href={finding.url} target="_blank" rel="noopener noreferrer" aria-label={`${finding.project} report ${finding.number}`}>{finding.number}</a></div><h3><a href={finding.url} target="_blank" rel="noopener noreferrer">{finding.title}</a></h3><p>{finding.description}</p><div className="finding-footer"><span>{finding.outcome}</span>{finding.reference && <a href={finding.reference.url} target="_blank" rel="noopener noreferrer">{finding.reference.label}</a>}</div></article>)}</div>
              <p className="dated-note">Reports reviewed October 30, 2026.</p>
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

        <footer className="site-footer"><span>Gio Fiore · 2026</span><div><a href="https://github.com/Figo5" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://www.linkedin.com/in/gfiore25/" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://stackoverflow.com/users/33244143/gio-fiore" target="_blank" rel="noopener noreferrer">Stack Overflow</a><a href="https://github.com/Figo5/gfiore.com/edit/main/content/favorites.json" target="_blank" rel="noopener noreferrer">Edit favorites</a><GrainBackground /><a href="#top">Back to top</a></div></footer>
      </div>
    </>
  );
}
