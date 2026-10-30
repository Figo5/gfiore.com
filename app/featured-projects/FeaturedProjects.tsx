import styles from "./featured-projects.module.css";

type FeaturedProject = {
  name: string;
  tagline: string;
  description: string;
  stack: string;
  url: string;
  image?: { src: string; alt: string; width: number; height: number };
  caption: string;
  links: { label: string; url: string }[];
};

const projects: FeaturedProject[] = [
  {
    name: "Civicfolio",
    tagline: "Stock research with the sources attached.",
    description: "A local research workspace with market screens, cited AI hypotheses, and a journal to revisit the reasoning. Research only; no trade execution.",
    stack: "React / TypeScript / Express",
    url: "https://github.com/Figo5/civicfolio",
    image: { src: "/projects/civicfolio.png", alt: "Civicfolio's market research interface with clearly labeled fictional example data", width: 1440, height: 600 },
    caption: "Built application with fictional demo data.",
    links: [{ label: "Explore the project", url: "https://github.com/Figo5/civicfolio" }],
  },
  {
    name: "AgentOps",
    tagline: "See how coding agents hand work off.",
    description: "A local event viewer that turns reported activity, handoffs, and review verdicts into a live constellation.",
    stack: "TypeScript / React / SQLite",
    url: "https://github.com/Figo5/agentops",
    image: { src: "/projects/agentops.png", alt: "AgentOps recorded demo with six labeled actors, handoff edges, and a review verdict", width: 1440, height: 900 },
    caption: "Still from the recorded demo workflow.",
    links: [
      { label: "Watch the demo", url: "https://github.com/Figo5/agentops/blob/main/docs/demo.mp4" },
      { label: "Source", url: "https://github.com/Figo5/agentops" },
    ],
  },
  {
    name: "SQLSage",
    tagline: "Catch wrong results before tuning a query.",
    description: "A PostgreSQL CLI that spots correctness risks, proposes conservative rewrites, and labels predicted versus measured evidence.",
    stack: "TypeScript / PostgreSQL / CLI",
    url: "https://github.com/Figo5/sqlsage",
    caption: "Excerpt from the bundled offline demo.",
    links: [
      { label: "Read the walkthrough", url: "https://github.com/Figo5/sqlsage/blob/main/docs/tutorials/01-wrong-results-not-in.md" },
      { label: "Source", url: "https://github.com/Figo5/sqlsage" },
    ],
  },
];

export const FEATURED_PROJECT_URLS = new Set(projects.map(project => project.url));

export default function FeaturedProjects() {
  return (
    <section className={styles.section} aria-labelledby="featured-projects-title">
      <div className="column-heading">
        <h2 id="featured-projects-title">Featured projects</h2>
        <a className="subtle-link" href="https://github.com/Figo5?tab=repositories" target="_blank" rel="noopener noreferrer">All projects</a>
      </div>
      <p className={styles.intro}>Three things I built, with a look at how they work.</p>
      {projects.map(project => (
        <article className={styles.row} key={project.url}>
          <div>
            <h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
            <p className={styles.tagline}>{project.tagline}</p>
            <p className={styles.description}>{project.description}</p>
            <p className={styles.stack}>{project.stack}</p>
            <div className={styles.links}>{project.links.map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.name}: ${link.label}`}>{link.label}</a>
            ))}</div>
          </div>
          <figure className={styles.visual}>
            {project.image ? (
              <img src={project.image.src} alt={project.image.alt} width={project.image.width} height={project.image.height} loading="lazy" decoding="async" />
            ) : (
              <pre className={styles.output}><code><span className={styles.command}>npx sqlsage demo</span>{"\n\nNullable NOT IN subquery can invalidate anti-membership.\n\nFix — Use NULL-safe NOT EXISTS anti-membership"}</code></pre>
            )}
            <figcaption>{project.caption}</figcaption>
          </figure>
        </article>
      ))}
    </section>
  );
}
