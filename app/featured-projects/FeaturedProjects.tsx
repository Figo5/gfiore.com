import styles from "./featured-projects.module.css";

type FeaturedProject = {
  name: string;
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
    description: "A local-first stock research app with cited hypotheses, market context, and a research journal.",
    stack: "TypeScript · Research tools",
    url: "https://github.com/Figo5/civicfolio",
    image: { src: "/projects/civicfolio.png", alt: "Civicfolio's market research interface with clearly labeled fictional example data", width: 1440, height: 600 },
    caption: "Built application with fictional demo data.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/civicfolio" }],
  },
  {
    name: "AgentOps",
    description: "A local viewer for coding-agent activity, handoffs, and verdicts.",
    stack: "TypeScript · Developer tools",
    url: "https://github.com/Figo5/agentops",
    image: { src: "/projects/agentops.png", alt: "AgentOps recorded demo with six labeled actors, handoff edges, and a review verdict", width: 1440, height: 900 },
    caption: "Still from the recorded demo workflow.",
    links: [
      { label: "Demo", url: "https://github.com/Figo5/agentops/blob/main/docs/demo.mp4" },
      { label: "GitHub", url: "https://github.com/Figo5/agentops" },
    ],
  },
  {
    name: "SQLSage",
    description: "A PostgreSQL CLI for query analysis and rewrite suggestions.",
    stack: "TypeScript · PostgreSQL",
    url: "https://github.com/Figo5/sqlsage",
    caption: "Excerpt from the bundled offline demo.",
    links: [
      { label: "Docs", url: "https://github.com/Figo5/sqlsage/blob/main/docs/tutorials/01-wrong-results-not-in.md" },
      { label: "GitHub", url: "https://github.com/Figo5/sqlsage" },
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
      {projects.map(project => (
        <article className={styles.row} key={project.url}>
          <div>
            <h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a></h3>
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
            <figcaption className="sr-only">{project.caption}</figcaption>
          </figure>
        </article>
      ))}
    </section>
  );
}
