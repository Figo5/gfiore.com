import fallback from "../content/github-fallback.json";
import { parsePublishedGitHubSnapshot, readPublishedGitHubSnapshot } from "./github-data-core";
import type { GitHubSnapshot } from "./github-types";

export async function readGitHubSnapshot(): Promise<GitHubSnapshot> {
  try {
    return await readPublishedGitHubSnapshot({
      // Next's persistent Data Cache refreshes this fixed public URL independently
      // of deployments. The feed timestamp still determines the six-hour freshness.
      fetcher: (url, options) => fetch(url, { ...options, next: { revalidate: 300 } }),
    });
  } catch {
    // Keep the committed public snapshot visible during network/provider outages.
    // No visitor request needs GitHub credentials or a database.
    console.warn("The public GitHub feed is unavailable; serving the committed snapshot.");
    return { ...parsePublishedGitHubSnapshot(fallback), stale: true };
  }
}
