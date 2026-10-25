export type GitHubRepository = {
  description: string | null;
  language: string | null;
  pushedAt: string | null;
  archived: boolean;
  url: string;
};

export type GitHubIssue = {
  state: "open" | "closed";
  url: string;
  updatedAt: string;
};

export type GitHubContribution = {
  title: string;
  url: string;
  repository: string;
  action: "Public report" | "Pull request";
  occurredAt: string;
};

export type GitHubRelease = {
  tag: string;
  name: string;
  url: string;
  publishedAt: string | null;
};

export type GitHubSnapshot = {
  repositories: Record<string, GitHubRepository>;
  issues: Record<string, GitHubIssue>;
  contributions: GitHubContribution[];
  latestRelease: GitHubRelease | null;
  fetchedAt: string | null;
  stale: boolean;
};
