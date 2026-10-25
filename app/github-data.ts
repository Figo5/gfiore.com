import { env } from "cloudflare:workers";
import { emptyGitHubSnapshot, readGitHubSnapshotFromDb } from "./github-data-core";
import type { GitHubSnapshot } from "./github-types";

export async function readGitHubSnapshot(): Promise<GitHubSnapshot> {
  if (!env.DB) return emptyGitHubSnapshot();
  try {
    return await readGitHubSnapshotFromDb(env.DB, { usePublishedFeed: true });
  } catch {
    // Missing migrations or a storage outage must not break the personal site or trigger uncached API polling.
    console.warn("The public GitHub cache is unavailable.");
    return emptyGitHubSnapshot();
  }
}
