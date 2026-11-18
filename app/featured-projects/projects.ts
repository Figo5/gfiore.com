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
    media: { type: "image", src: "/projects/civicfolio-current.jpg", alt: "Civicfolio market screening and research interface, captured October 30, 2026", width: 1120, height: 800 },
    caption: "Screening and research view.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/civicfolio" }],
  },
  {
    name: "Borrow",
    description: "A native macOS recorder for unattended commands, Codex activity, and temporary wake holds.",
    stack: "Swift · macOS",
    stage: "Source preview",
    url: "/borrow",
    media: { type: "image", src: "/projects/borrow-walkthrough.jpg", alt: "Borrow’s native macOS interface showing an open-lid rehearsal and a confirmed idle-sleep hold", width: 1440, height: 900 },
    caption: "Native app holding a wake lease during a rehearsal.",
    links: [
      { label: "Case study", url: "/borrow" },
      { label: "GitHub", url: "https://github.com/Figo5/borrow" },
    ],
  },
  {
    name: "SQLSage",
    description: "A PostgreSQL CLI for query analysis and rewrite suggestions.",
    stack: "TypeScript · PostgreSQL",
    url: "https://github.com/Figo5/sqlsage",
    media: { type: "code", command: "npx sqlsage demo", output: "Nullable NOT IN subquery can invalidate anti-membership.\n\nSQL NOT IN becomes UNKNOWN for every otherwise-unmatched outer row if this subquery emits even one NULL.\n\nFix — Use NULL-safe NOT EXISTS anti-membership" },
    caption: "From the offline demo.",
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
    media: { type: "image", src: "/projects/edgeterminal-current.jpg", alt: "EdgeTerminal Week 8 NFL projections interface, captured October 30, 2026", width: 1120, height: 800 },
    caption: "Week 8 NFL projections.",
    links: [
      { label: "Live demo", url: "/edgeterminal/" },
      { label: "GitHub", url: "https://github.com/Figo5/edgeterminal" },
    ],
  },
  {
    name: "DiffGuard",
    description: "AI-assisted git diff reviews for security issues and unintended behavior changes.",
    stack: "TypeScript · Code review",
    url: "https://github.com/Figo5/diffguard",
    media: { type: "code", command: "npm run demo", output: "[security] high  query.js:2\n  User input is interpolated into a SQL query.\n  Fix: Use a parameterized query with a separate values array.\n\n1 finding (1 security)" },
    caption: "From the bundled demo.",
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
    caption: "The labctl command reference.",
    links: [{ label: "GitHub", url: "https://github.com/Figo5/lab-in-a-box" }],
  },
];

export const FEATURED_PROJECT_URLS = new Set(featuredProjects.map(project => project.url));
