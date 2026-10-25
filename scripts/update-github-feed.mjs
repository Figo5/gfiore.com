import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readGitHubSnapshotFromDb } from "../app/github-data-core.ts";

const REPOSITORY = "Figo5/gfiore.com";
const BRANCH = "github-data";
const API_ROOT = `https://api.github.com/repos/${REPOSITORY}`;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const FEATURED_KEYS = [
  "follow-redirects/follow-redirects#294",
  "oapi-codegen/nethttp-middleware#89",
  "mafintosh/tar-fs#122",
  "nodejs/node#66853",
];
const PUBLIC_SOURCE_PATHS = new Set([
  "/users/Figo5/repos",
  "/search/issues",
  "/repos/Figo5/sqlsage/releases/latest",
  "/repos/follow-redirects/follow-redirects/issues/294",
  "/repos/oapi-codegen/nethttp-middleware/issues/89",
  "/repos/mafintosh/tar-fs/issues/122",
  "/repos/nodejs/node/issues/66853",
]);

function writerMethodAllowed(url, method) {
  const root = `/repos/${REPOSITORY}`;
  if (method === "GET" && PUBLIC_SOURCE_PATHS.has(url.pathname)) return true;
  if (method === "GET" && url.pathname === `${root}/git/ref/heads/${BRANCH}`) return !url.search;
  if (method === "POST" && url.pathname === `${root}/git/refs`) return !url.search;
  if (url.pathname === `${root}/contents/github.json`) {
    if (method === "GET") return url.searchParams.get("ref") === BRANCH && [...url.searchParams].length === 1;
    if (method === "PUT") return !url.search;
  }
  return false;
}

/** The workflow token can only reach fixed public sources and this repository's feed writer. */
export function githubFetcher(token, transport = fetch) {
  if (typeof token !== "string" || !token || /[\r\n]/.test(token)) throw new Error("A workflow token is required.");
  return async (input, init = {}) => {
    if (typeof input !== "string" && !(input instanceof URL)) throw new Error("Unsupported GitHub request.");
    const url = new URL(input);
    const method = (init.method || "GET").toUpperCase();
    if (url.protocol !== "https:" || url.hostname !== "api.github.com" || url.port || url.username || url.password || url.hash || !writerMethodAllowed(url, method)) {
      throw new Error("The workflow cannot send credentials to this destination.");
    }
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", "2026-03-10");
    headers.set("User-Agent", "gfiore-public-data-workflow");
    const response = await transport(url.href, {
      ...init, method, headers, redirect: "manual", signal: init.signal || AbortSignal.timeout(15_000),
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => {});
      throw new Error("GitHub API redirects are not followed.");
    }
    return response;
  };
}

function localCache() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("CREATE TABLE github_snapshot (id TEXT PRIMARY KEY NOT NULL, payload TEXT, checked_at INTEGER, next_refresh_at INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0)");
  return {
    close: () => sqlite.close(),
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async first() { return statement.get(...bindings) || null; },
        async run() { return statement.run(...bindings); },
      };
    },
  };
}

async function jsonResponse(response) {
  if (!response.headers.get("Content-Type")?.toLowerCase().includes("json") || !response.body) throw new Error("GitHub returned an invalid response.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > MAX_JSON_BYTES) throw new Error("GitHub response exceeded the size limit.");
      body += decoder.decode(result.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } finally {
    await reader.cancel().catch(() => {});
  }
}

function isRecord(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function sha(value) { return typeof value === "string" && /^[a-f0-9]{40}$/.test(value); }

function publicSnapshot(snapshot, now) {
  const fetched = snapshot && Date.parse(snapshot.fetchedAt);
  if (!snapshot || snapshot.stale !== false || !Number.isFinite(fetched) || fetched < now - 5 * 60_000 || fetched > now + 60_000
    || !isRecord(snapshot.repositories) || !isRecord(snapshot.issues) || !FEATURED_KEYS.every(key => snapshot.issues[key])
    || !Array.isArray(snapshot.contributions) || snapshot.contributions.length > 3 || !isRecord(snapshot.latestRelease)) {
    throw new Error("The refresh was incomplete; the previous public feed was preserved.");
  }
  // Publish only the normalized public contract, never job environment or API responses.
  return {
    repositories: snapshot.repositories,
    issues: snapshot.issues,
    contributions: snapshot.contributions,
    latestRelease: snapshot.latestRelease,
    fetchedAt: snapshot.fetchedAt,
    stale: false,
  };
}

async function ensureBranch(request, sourceCommit) {
  const branchUrl = `${API_ROOT}/git/ref/heads/${BRANCH}`;
  const existing = await request(branchUrl);
  if (existing.status === 200) {
    const branch = await jsonResponse(existing);
    if (branch.ref !== `refs/heads/${BRANCH}` || !sha(branch.object?.sha)) throw new Error("GitHub returned an unexpected feed branch.");
    return;
  }
  if (existing.status !== 404) throw new Error(`Feed branch lookup failed (${existing.status}).`);
  await existing.body?.cancel().catch(() => {});
  const created = await request(`${API_ROOT}/git/refs`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: sourceCommit }),
  });
  if (created.status === 201) {
    const branch = await jsonResponse(created);
    if (branch.ref !== `refs/heads/${BRANCH}`) throw new Error("GitHub created an unexpected feed branch.");
    return;
  }
  if (created.status === 422) {
    await created.body?.cancel().catch(() => {});
    const raced = await request(branchUrl);
    if (raced.status === 200 && (await jsonResponse(raced)).ref === `refs/heads/${BRANCH}`) return;
  }
  throw new Error(`Feed branch creation failed (${created.status}).`);
}

export async function updatePublicFeed({ environment = process.env, transport = fetch, loadSnapshot = readGitHubSnapshotFromDb, now = Date.now } = {}) {
  if (environment.GITHUB_REPOSITORY !== REPOSITORY || environment.GITHUB_REF !== "refs/heads/main" || !sha(environment.GITHUB_SHA)) {
    throw new Error("The public feed can run only from Figo5/gfiore.com's main branch.");
  }
  const request = githubFetcher(environment.GITHUB_TOKEN, transport);
  const db = localCache();
  let snapshot;
  try {
    snapshot = publicSnapshot(await loadSnapshot(db, { fetcher: request, usePublishedFeed: false, now }), now());
  } finally { db.close(); }
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (Buffer.byteLength(json) > MAX_JSON_BYTES) throw new Error("The public feed exceeded the size limit.");
  await ensureBranch(request, environment.GITHUB_SHA);
  const current = await request(`${API_ROOT}/contents/github.json?ref=${BRANCH}`);
  let previousSha;
  if (current.status === 200) {
    const file = await jsonResponse(current);
    if (file.path !== "github.json" || file.type !== "file" || !sha(file.sha)) throw new Error("GitHub returned an unexpected feed file.");
    previousSha = file.sha;
  } else if (current.status !== 404) {
    throw new Error(`Feed file lookup failed (${current.status}).`);
  } else { await current.body?.cancel().catch(() => {}); }
  const saved = await request(`${API_ROOT}/contents/github.json`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Refresh public GitHub data", branch: BRANCH, content: Buffer.from(json).toString("base64"), ...(previousSha ? { sha: previousSha } : {}) }),
  });
  if (saved.status !== 200 && saved.status !== 201) throw new Error(`Public feed publication failed (${saved.status}).`);
  const result = await jsonResponse(saved);
  if (!sha(result.commit?.sha) || result.content?.path !== "github.json") throw new Error("GitHub returned an invalid publication receipt.");
  return { repository: REPOSITORY, branch: BRANCH, commit: result.commit.sha, fetchedAt: snapshot.fetchedAt, repositories: Object.keys(snapshot.repositories).length, reports: snapshot.contributions.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updatePublicFeed().then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error(error instanceof Error ? error.message : "Public feed refresh failed.");
    process.exitCode = 1;
  });
}
