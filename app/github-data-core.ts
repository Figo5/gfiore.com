import type {
  GitHubContribution,
  GitHubIssue,
  GitHubRelease,
  GitHubRepository,
  GitHubSnapshot,
} from "./github-types";

const ACCOUNT = "Figo5";
const CACHE_KEY = "public-github-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 30 * 60 * 1000;
const LEASE_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const ISSUE_SOURCES = [
  { owner: "follow-redirects", repo: "follow-redirects", number: 294 },
  { owner: "oapi-codegen", repo: "nethttp-middleware", number: 89 },
  { owner: "mafintosh", repo: "tar-fs", number: 122 },
  { owner: "nodejs", repo: "node", number: 66853 },
] as const;

const issueKey = (owner: string, repo: string, number: number) =>
  `${owner}/${repo}#${number}`.toLowerCase();
const FEATURED_ISSUES = new Set(ISSUE_SOURCES.map(source =>
  issueKey(source.owner, source.repo, source.number)));
const SOURCE_IDS = ["repositories", "contributions", "release", ...ISSUE_SOURCES.map(source =>
  `issue:${issueKey(source.owner, source.repo, source.number)}`)];

type SnapshotContent = Omit<GitHubSnapshot, "fetchedAt" | "stale">;
type CachedPayload = {
  version: 1;
  content: SnapshotContent;
  sourceTimes: Record<string, string>;
  failedSources: string[];
};
type CacheRow = {
  payload: string | null;
  checked_at: number | null;
  next_refresh_at: number;
  lease_until: number;
};

interface CacheStatement {
  bind(...values: (string | number | null)[]): CacheStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface GitHubCacheDatabase {
  prepare(query: string): CacheStatement;
}

type Options = {
  fetcher?: typeof fetch;
  now?: () => number;
};

class UpstreamError extends Error {
  constructor(readonly retryAt = 0) {
    super("Public GitHub data is temporarily unavailable.");
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new UpstreamError();
  return value as Record<string, unknown>;
}

function text(value: unknown, maximum: number): string {
  if (typeof value !== "string" || !value.trim()) throw new UpstreamError();
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maximum);
}

function optionalText(value: unknown, maximum: number): string | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  return text(value, maximum);
}

function date(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string" || value.length > 50) throw new UpstreamError();
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new UpstreamError();
  return new Date(time).toISOString();
}

function githubUrl(value: unknown): URL {
  if (typeof value !== "string" || value.length > 1500) throw new UpstreamError();
  const url = new URL(text(value, 1500));
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password) {
    throw new UpstreamError();
  }
  return url;
}

function repositoryName(value: unknown): string {
  const name = text(value, 100);
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) throw new UpstreamError();
  return name;
}

function parseRepositories(value: unknown): Record<string, GitHubRepository> {
  if (!Array.isArray(value) || value.length > 100) throw new UpstreamError();
  const entries: [string, GitHubRepository][] = [];
  for (const item of value) {
    const repo = object(item);
    if (repo.private !== false) continue;
    if (text(object(repo.owner).login, 100).toLowerCase() !== ACCOUNT.toLowerCase()) continue;
    const name = repositoryName(repo.name);
    const url = githubUrl(repo.html_url);
    if (url.pathname.toLowerCase() !== `/${ACCOUNT}/${name}`.toLowerCase() || typeof repo.archived !== "boolean") {
      throw new UpstreamError();
    }
    entries.push([name.toLowerCase(), {
      description: optionalText(repo.description, 500),
      language: optionalText(repo.language, 60),
      pushedAt: date(repo.pushed_at),
      archived: repo.archived,
      url: url.href,
    }]);
  }
  return Object.fromEntries(entries);
}

function parseIssue(value: unknown, source: typeof ISSUE_SOURCES[number]): GitHubIssue {
  const issue = object(value);
  const url = githubUrl(issue.html_url);
  const expectedPath = `/${source.owner}/${source.repo}/issues/${source.number}`.toLowerCase();
  const updatedAt = date(issue.updated_at);
  if (url.pathname.toLowerCase() !== expectedPath || !updatedAt || (issue.state !== "open" && issue.state !== "closed")) {
    throw new UpstreamError();
  }
  return { state: issue.state, url: url.href, updatedAt };
}

function parseContributions(value: unknown): GitHubContribution[] {
  const result = object(value);
  if (!Array.isArray(result.items) || result.items.length > 10 || result.incomplete_results !== false) throw new UpstreamError();
  const contributions: GitHubContribution[] = [];
  const seen = new Set<string>();
  for (const item of result.items) {
    const issue = object(item);
    if (text(object(issue.user).login, 100).toLowerCase() !== ACCOUNT.toLowerCase()) continue;
    const url = githubUrl(issue.html_url);
    const match = /^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(issues|pull)\/(\d+)$/.exec(url.pathname);
    if (!match || match[1].toLowerCase() === ACCOUNT.toLowerCase()) continue;
    const key = issueKey(match[1], match[2], Number(match[4]));
    if (FEATURED_ISSUES.has(key) || seen.has(key)) continue;
    const occurredAt = date(issue.created_at);
    if (!occurredAt || (issue.pull_request ? match[3] !== "pull" : match[3] !== "issues")) throw new UpstreamError();
    contributions.push({
      title: text(issue.title, 180),
      url: url.href,
      repository: `${match[1]}/${match[2]}`,
      action: issue.pull_request ? "Pull request" : "Public report",
      occurredAt,
    });
    seen.add(key);
    if (contributions.length === 3) break;
  }
  return contributions;
}

function parseRelease(value: unknown): GitHubRelease {
  const release = object(value);
  const url = githubUrl(release.html_url);
  if (!url.pathname.toLowerCase().startsWith(`/${ACCOUNT}/sqlsage/releases/tag/`.toLowerCase()) || release.draft || release.prerelease) {
    throw new UpstreamError();
  }
  const tag = text(release.tag_name, 100);
  return { tag, name: optionalText(release.name, 180) || tag, url: url.href, publishedAt: date(release.published_at) };
}

function retryTime(headers: Headers, now: number): number {
  const retryAfter = headers.get("Retry-After");
  const retrySeconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : NaN;
  const retryDate = retryAfter && !Number.isFinite(retrySeconds) ? Date.parse(retryAfter) : NaN;
  const reset = headers.get("X-RateLimit-Remaining") === "0" ? Number(headers.get("X-RateLimit-Reset")) * 1000 : 0;
  return Math.max(
    Number.isFinite(retrySeconds) ? now + retrySeconds * 1000 : 0,
    Number.isFinite(retryDate) ? retryDate : 0,
    Number.isFinite(reset) ? reset : 0,
  );
}

async function requestJson(path: string, fetcher: typeof fetch, now: number): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetcher(`https://api.github.com${path}`, {
      method: "GET",
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "gfiore.com-public-portfolio" },
      // workerd supports follow/manual, but not redirect:error. Reject 3xx below without following an unvalidated target.
      redirect: "manual",
      signal: controller.signal,
    });
    const retryAt = retryTime(response.headers, now);
    if (!response.ok) throw new UpstreamError(retryAt);
    if (!response.headers.get("Content-Type")?.toLowerCase().includes("json")) throw new UpstreamError(retryAt);
    const length = Number(response.headers.get("Content-Length") || "0");
    if (length > MAX_BODY_BYTES || !response.body) throw new UpstreamError(retryAt);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let body = "";
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BODY_BYTES) throw new UpstreamError(retryAt);
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
    } finally {
      await reader.cancel().catch(() => {});
    }
    return JSON.parse(body);
  } finally {
    clearTimeout(timeout);
  }
}

function emptyPayload(): CachedPayload {
  return { version: 1, content: { repositories: {}, issues: {}, contributions: [], latestRelease: null }, sourceTimes: {}, failedSources: [...SOURCE_IDS] };
}

function cachedPayload(raw: string | null): CachedPayload {
  if (!raw || raw.length > MAX_BODY_BYTES) return emptyPayload();
  try {
    const payload = object(JSON.parse(raw));
    const content = object(payload.content);
    const times = object(payload.sourceTimes);
    if (payload.version !== 1 || !Array.isArray(payload.failedSources) || !Array.isArray(content.contributions)) return emptyPayload();
    const repositories = object(content.repositories);
    const issues = object(content.issues);
    if (Object.keys(repositories).length > 100 || Object.keys(issues).some(key => !FEATURED_ISSUES.has(key)) || content.contributions.length > 3) return emptyPayload();
    for (const [name, value] of Object.entries(repositories)) {
      const repo = object(value);
      if (repositoryName(name).toLowerCase() !== name || typeof repo.archived !== "boolean") return emptyPayload();
      optionalText(repo.description, 500);
      optionalText(repo.language, 60);
      date(repo.pushedAt);
      if (githubUrl(repo.url).pathname.toLowerCase() !== `/${ACCOUNT}/${name}`.toLowerCase()) return emptyPayload();
    }
    for (const [key, value] of Object.entries(issues)) {
      const issue = object(value);
      const url = githubUrl(issue.url);
      if ((issue.state !== "open" && issue.state !== "closed") || !date(issue.updatedAt) || url.pathname.toLowerCase().replace(/\/issues\//, "#").slice(1) !== key) return emptyPayload();
    }
    for (const value of content.contributions) {
      const contribution = object(value);
      const url = githubUrl(contribution.url);
      const match = /^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/(issues|pull)\/(\d+)$/.exec(url.pathname);
      if (!match || contribution.repository !== `${match[1]}/${match[2]}` || !date(contribution.occurredAt) || (contribution.action !== "Public report" && contribution.action !== "Pull request")) return emptyPayload();
      text(contribution.title, 180);
    }
    if (content.latestRelease !== null) {
      const release = object(content.latestRelease);
      text(release.tag, 100);
      text(release.name, 180);
      date(release.publishedAt);
      if (!githubUrl(release.url).pathname.toLowerCase().startsWith(`/${ACCOUNT}/sqlsage/releases/tag/`.toLowerCase())) return emptyPayload();
    }
    for (const source of SOURCE_IDS) {
      if (times[source] != null && !date(times[source])) return emptyPayload();
    }
    // Only this module writes the cache. A versioned envelope prevents old or corrupt rows from rendering as fresh data.
    return { version: 1, content: content as SnapshotContent, sourceTimes: times as Record<string, string>, failedSources: payload.failedSources.filter((source): source is string => typeof source === "string" && SOURCE_IDS.includes(source)) };
  } catch {
    return emptyPayload();
  }
}

function snapshot(payload: CachedPayload, now: number): GitHubSnapshot {
  const times = SOURCE_IDS.map(source => payload.sourceTimes[source]).filter((time): time is string => Boolean(time));
  const fetchedAt = times.length ? times.reduce((oldest, time) => time < oldest ? time : oldest) : null;
  return {
    ...payload.content,
    fetchedAt,
    stale: payload.failedSources.length > 0 || times.length !== SOURCE_IDS.length || times.some(time => now - Date.parse(time) >= CACHE_TTL_MS),
  };
}

export function emptyGitHubSnapshot(): GitHubSnapshot {
  return snapshot(emptyPayload(), Date.now());
}

export async function readGitHubSnapshotFromDb(db: GitHubCacheDatabase, options: Options = {}): Promise<GitHubSnapshot> {
  const fetcher = options.fetcher || fetch;
  const now = (options.now || Date.now)();
  let row = await db.prepare("SELECT payload, checked_at, next_refresh_at, lease_until FROM github_snapshot WHERE id = ?").bind(CACHE_KEY).first<CacheRow>();
  if (!row) {
    await db.prepare("INSERT INTO github_snapshot (id, next_refresh_at, lease_until) VALUES (?, 0, 0) ON CONFLICT(id) DO NOTHING").bind(CACHE_KEY).run();
  } else if (row.next_refresh_at > now || row.lease_until > now) {
    return snapshot(cachedPayload(row.payload), now);
  }

  const leaseUntil = now + LEASE_MS;
  // Persist retry backoff with the lease, before network work. A crashed refresh or failed final write cannot create a retry storm.
  row = await db.prepare("UPDATE github_snapshot SET lease_until = ?, next_refresh_at = ? WHERE id = ? AND lease_until <= ? AND next_refresh_at <= ? RETURNING payload, checked_at, next_refresh_at, lease_until")
    .bind(leaseUntil, now + RETRY_MS, CACHE_KEY, now, now).first<CacheRow>();
  if (!row) {
    const latest = await db.prepare("SELECT payload, checked_at, next_refresh_at, lease_until FROM github_snapshot WHERE id = ?").bind(CACHE_KEY).first<CacheRow>();
    return snapshot(cachedPayload(latest?.payload || null), now);
  }

  const previous = cachedPayload(row.payload);
  const content: SnapshotContent = { ...previous.content, issues: { ...previous.content.issues } };
  const sourceTimes = { ...previous.sourceTimes };
  const failedSources: string[] = [];
  let failureRetryAt = now + RETRY_MS;
  const tasks: { id: string; run: () => Promise<unknown>; apply: (value: unknown) => void }[] = [
    {
      id: "repositories",
      run: () => requestJson(`/users/${ACCOUNT}/repos?type=owner&sort=pushed&per_page=100`, fetcher, now),
      apply: value => { content.repositories = parseRepositories(value); },
    },
    {
      id: "contributions",
      run: () => requestJson(`/search/issues?q=${encodeURIComponent(`author:${ACCOUNT} -user:${ACCOUNT}`)}&sort=updated&order=desc&per_page=10`, fetcher, now),
      apply: value => { content.contributions = parseContributions(value); },
    },
    {
      id: "release",
      run: () => requestJson(`/repos/${ACCOUNT}/sqlsage/releases/latest`, fetcher, now),
      apply: value => { content.latestRelease = parseRelease(value); },
    },
    ...ISSUE_SOURCES.map(source => {
      const key = issueKey(source.owner, source.repo, source.number);
      return {
        id: `issue:${key}`,
        run: () => requestJson(`/repos/${source.owner}/${source.repo}/issues/${source.number}`, fetcher, now),
        apply: (value: unknown) => { content.issues[key] = parseIssue(value, source); },
      };
    }),
  ];

  await Promise.all(tasks.map(async task => {
    try {
      task.apply(await task.run());
      sourceTimes[task.id] = new Date(now).toISOString();
    } catch (error) {
      failedSources.push(task.id);
      failureRetryAt = Math.max(failureRetryAt, error instanceof UpstreamError ? error.retryAt : 0);
    }
  }));

  const payload: CachedPayload = { version: 1, content, sourceTimes, failedSources };
  const nextRefreshAt = failedSources.length ? failureRetryAt : now + CACHE_TTL_MS;
  try {
    await db.prepare("UPDATE github_snapshot SET payload = ?, checked_at = ?, next_refresh_at = ?, lease_until = 0 WHERE id = ? AND lease_until = ?")
      .bind(JSON.stringify(payload), now, nextRefreshAt, CACHE_KEY, leaseUntil).run();
  } catch {
    // The claim already persisted a backoff. Keep serving the prior durable snapshot until storage recovers.
    return { ...snapshot(previous, now), stale: true };
  }
  return snapshot(payload, now);
}
