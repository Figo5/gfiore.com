export type ProjectMedia =
  | { type: "image"; src: string; alt: string; width: number; height: number }
  | { type: "video"; src: string; poster: string; label: string; width: number; height: number }
  | { type: "code"; command: string; output: string };

export type FeaturedProject = {
  name: string;
  description: string;
  stack: string;
  url: string;
  stage?: string;
  media: ProjectMedia;
  caption: string;
  links: { label: string; url: string }[];
};

export const featuredProjects: FeaturedProject[] = [
  {
    name: "Civicfolio",
    description: "A local-first stock research app with cited hypotheses, market context, and a research journal.",
    stack: "TypeScript · Research tools",
    url: "https://github.com/Figo5/civicfolio",
    media: { type: "image", src: "/projects/civicfolio.png", alt: "Civicfolio's market research interface with clearly labeled fictional example data", width: 1440, height: 600 },
    caption: "Built application with fictional demo data.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/civicfolio" }],
  },
  {
    name: "AgentOps",
    description: "A local viewer for coding-agent activity, handoffs, and verdicts.",
    stack: "TypeScript · Developer tools",
    url: "https://github.com/Figo5/agentops",
    media: { type: "video", src: "/projects/agentops-demo.mp4", poster: "/projects/agentops.png", label: "Recorded AgentOps demo with example actors, handoffs, and review verdicts", width: 1440, height: 900 },
    caption: "Recorded example workflow. Provider labels describe reported events; the viewer does not launch agents.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/agentops" }],
  },
  {
    name: "SQLSage",
    description: "A PostgreSQL CLI for query analysis and rewrite suggestions.",
    stack: "TypeScript · PostgreSQL",
    url: "https://github.com/Figo5/sqlsage",
    media: { type: "code", command: "npx sqlsage demo", output: "Nullable NOT IN subquery can invalidate anti-membership.\n\nSQL NOT IN becomes UNKNOWN for every otherwise-unmatched outer row if this subquery emits even one NULL.\n\nFix — Use NULL-safe NOT EXISTS anti-membership" },
    caption: "Excerpt from the published offline demo. No query execution or speedup is implied.",
    links: [
      { label: "Docs", url: "https://github.com/Figo5/sqlsage/blob/main/docs/tutorials/01-wrong-results-not-in.md" },
      { label: "GitHub", url: "https://github.com/Figo5/sqlsage" },
    ],
  },
  {
    name: "EdgeTerminal",
    description: "A local NFL research beta for comparing prices, inspecting projections, and tracking forecasts.",
    stack: "Python · Research tools",
    url: "https://github.com/Figo5/edgeterminal",
    stage: "Beta",
    media: { type: "image", src: "/projects/edgeterminal.png", alt: "EdgeTerminal's published NFL research board with game projections and research-only labels", width: 1440, height: 900 },
    caption: "Published UI capture, not current prices or a validated prediction record.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/edgeterminal" }],
  },
  {
    name: "DiffGuard",
    description: "AI-assisted git diff reviews for security issues and unintended behavior changes.",
    stack: "TypeScript · Code review",
    url: "https://github.com/Figo5/diffguard",
    media: { type: "code", command: "npm run demo", output: "FIXTURE DEMO — prewritten finding, no model call or accuracy claim.\n\n[security] high  query.js:2\n  User input is interpolated into a SQL query.\n  Fix: Use a parameterized query with a separate values array.\n\n1 finding (1 security)" },
    caption: "Captured fixture output through the real CLI. The finding is prewritten; this is not evidence of model accuracy.",
    links: [
      { label: "Example", url: "https://github.com/Figo5/diffguard/blob/main/docs/try-it.md" },
      { label: "GitHub", url: "https://github.com/Figo5/diffguard" },
    ],
  },
  {
    name: "Lab in a Box",
    description: "A local Docker lab for practicing web, API, and SSH security.",
    stack: "Python · Docker",
    url: "https://github.com/Figo5/lab-in-a-box",
    media: { type: "image", src: "/projects/lab-in-a-box.png", alt: "Lab in a Box's actual labctl help output, listing commands for a local authorized security lab", width: 960, height: 590 },
    caption: "Published labctl help capture. It does not start targets or test external systems.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/lab-in-a-box" }],
  },
];

export const FEATURED_PROJECT_URLS = new Set(featuredProjects.map(project => project.url));
