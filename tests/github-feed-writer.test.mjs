import assert from "node:assert/strict";
import test from "node:test";
import { githubFetcher, updatePublicFeed } from "../scripts/update-github-feed.mjs";

const NOW = Date.UTC(2026, 9, 25, 18);
const SOURCE_SHA = "a".repeat(40);
const FILE_SHA = "b".repeat(40);
const SAVED_SHA = "c".repeat(40);
const TOKEN = "dummy-workflow-token";
const API = "https://api.github.com/repos/Figo5/gfiore.com";
const environment = { GITHUB_REPOSITORY: "Figo5/gfiore.com", GITHUB_REF: "refs/heads/main", GITHUB_SHA: SOURCE_SHA, GITHUB_TOKEN: TOKEN };

function snapshot(overrides = {}) {
  return {
    repositories: { sqlsage: { description: "Query tools", language: "TypeScript", pushedAt: new Date(NOW).toISOString(), archived: false, url: "https://github.com/Figo5/sqlsage" } },
    issues: Object.fromEntries(["follow-redirects/follow-redirects#294", "oapi-codegen/nethttp-middleware#89", "mafintosh/tar-fs#122", "nodejs/node#66853"].map(key => [key, { state: "open", url: `https://github.com/${key.replace("#", "/issues/")}`, updatedAt: new Date(NOW).toISOString() }])),
    contributions: [],
    latestRelease: { tag: "v0.2.2", name: "v0.2.2", url: "https://github.com/Figo5/sqlsage/releases/tag/v0.2.2", publishedAt: new Date(NOW).toISOString() },
    fetchedAt: new Date(NOW).toISOString(), stale: false,
    ...overrides,
  };
}

function json(value, status = 200) { return Response.json(value, { status }); }

test("rejects another repository, branch, or invalid source commit before reading or writing", async () => {
  for (const overrides of [{ GITHUB_REPOSITORY: "someone/else" }, { GITHUB_REF: "refs/heads/github-data" }, { GITHUB_SHA: "main" }]) {
    let called = false;
    await assert.rejects(updatePublicFeed({ environment: { ...environment, ...overrides }, loadSnapshot: async () => { called = true; }, transport: async () => { called = true; }, now: () => NOW }), /main branch/);
    assert.equal(called, false);
  }
});

test("an incomplete, stale, or future snapshot cannot replace the previous feed", async () => {
  for (const value of [snapshot({ stale: true }), snapshot({ issues: {} }), snapshot({ latestRelease: null }), snapshot({ fetchedAt: new Date(NOW + 120_000).toISOString() })]) {
    let writes = 0;
    await assert.rejects(updatePublicFeed({ environment, loadSnapshot: async () => value, transport: async () => { writes += 1; }, now: () => NOW }), /incomplete/);
    assert.equal(writes, 0);
  }
});

test("creates only the data branch and publishes the normalized public contract there", async () => {
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ url, options });
    assert.equal(new Headers(options.headers).get("Authorization"), `Bearer ${TOKEN}`);
    assert.equal(options.redirect, "manual");
    if (url.endsWith("/git/ref/heads/github-data")) return json({ message: "Not Found" }, 404);
    if (url.endsWith("/git/refs")) {
      assert.deepEqual(JSON.parse(options.body), { ref: "refs/heads/github-data", sha: SOURCE_SHA });
      return json({ ref: "refs/heads/github-data", object: { sha: SOURCE_SHA } }, 201);
    }
    if (url.endsWith("/contents/github.json?ref=github-data")) return json({ message: "Not Found" }, 404);
    const body = JSON.parse(options.body);
    assert.equal(url, `${API}/contents/github.json`);
    assert.equal(options.method, "PUT");
    assert.equal(body.branch, "github-data");
    assert.equal("sha" in body, false);
    const published = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
    assert.equal(published.fetchedAt, new Date(NOW).toISOString());
    assert.equal("jobToken" in published, false);
    assert.equal(JSON.stringify(published).includes(TOKEN), false);
    return json({ commit: { sha: SAVED_SHA }, content: { path: "github.json" } }, 201);
  };
  const result = await updatePublicFeed({ environment, transport, now: () => NOW, loadSnapshot: async (_db, options) => {
    assert.equal(options.usePublishedFeed, false);
    return snapshot({ jobToken: TOKEN });
  } });
  assert.equal(result.branch, "github-data");
  assert.equal(result.commit, SAVED_SHA);
  assert.equal(calls.length, 4);
  assert.equal(calls.some(call => call.url.includes("heads/main")), false);
});

test("updates an existing data file with its SHA without creating or changing main", async () => {
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/git/ref/heads/github-data")) return json({ ref: "refs/heads/github-data", object: { sha: SOURCE_SHA } });
    if (options.method === "GET") return json({ path: "github.json", type: "file", sha: FILE_SHA });
    const body = JSON.parse(options.body);
    assert.equal(body.sha, FILE_SHA);
    assert.equal(body.branch, "github-data");
    return json({ commit: { sha: SAVED_SHA }, content: { path: "github.json" } });
  };
  await updatePublicFeed({ environment, transport, now: () => NOW, loadSnapshot: async () => snapshot() });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(call => call.options.method), ["GET", "GET", "PUT"]);
});

test("workflow credentials cannot reach raw files, another host, or unlisted API paths", async () => {
  let calls = 0;
  const request = githubFetcher(TOKEN, async () => { calls += 1; return json({}); });
  for (const destination of ["https://raw.githubusercontent.com/Figo5/gfiore.com/github-data/github.json", "https://example.com/", "http://api.github.com/users/Figo5/repos", "https://api.github.com/user", "https://api.github.com/repos/another/private-repo", "https://user:pass@api.github.com/users/Figo5/repos"]) {
    await assert.rejects(request(destination), /cannot send credentials/);
  }
  assert.equal(calls, 0);
});

test("redirect responses stop after the GitHub request without forwarding the token", async () => {
  const urls = [];
  const request = githubFetcher(TOKEN, async url => {
    urls.push(url);
    return new Response(null, { status: 302, headers: { Location: "https://example.com/collect" } });
  });
  await assert.rejects(request("https://api.github.com/users/Figo5/repos?type=owner"), /redirects are not followed/);
  assert.deepEqual(urls, ["https://api.github.com/users/Figo5/repos?type=owner"]);
});

test("a failed GitHub write reports a bounded status without returning a false receipt", async () => {
  const transport = async (url, options) => {
    if (url.endsWith("/git/ref/heads/github-data")) return json({ ref: "refs/heads/github-data", object: { sha: SOURCE_SHA } });
    if (options.method === "GET") return json({ message: "Not Found" }, 404);
    return json({ message: "Permission denied" }, 403);
  };
  await assert.rejects(updatePublicFeed({ environment, transport, now: () => NOW, loadSnapshot: async () => snapshot() }), /publication failed \(403\)/);
});
