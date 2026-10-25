import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

// Compile the production core without importing the Cloudflare-only environment adapter.
const compiled = ts.transpileModule(readFileSync(new URL("../app/github-data-core.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { readGitHubSnapshotFromDb } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const HOUR = 60 * 60 * 1000;
const START = Date.UTC(2026, 9, 25, 17);
const FEED_URL = "https://raw.githubusercontent.com/Figo5/gfiore.com/github-data/github.json";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0000_loud_shatterstar.sql", import.meta.url), "utf8"));
  sqlite.exec("INSERT INTO profile VALUES ('main', 'owner', '', '{\"albums\":[]}', '2026-10-25')");
  sqlite.exec(readFileSync(new URL("../drizzle/0001_sweet_captain_flint.sql", import.meta.url), "utf8"));
  const db = {
    sqlite,
    failFinalWrite: false,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async first() { return statement.get(...bindings) || null; },
        async run() {
          if (db.failFinalWrite && sql.startsWith("UPDATE github_snapshot SET payload")) throw new Error("storage unavailable");
          return statement.run(...bindings);
        },
      };
    },
  };
  return db;
}

function issue(owner, repo, number, overrides = {}) {
  return {
    html_url: `https://github.com/${owner}/${repo}/issues/${number}`,
    state: "open", updated_at: "2026-10-25T12:00:00Z", created_at: "2026-10-24T12:00:00Z",
    title: `Public report ${number}`, user: { login: "Figo5" }, ...overrides,
  };
}

function fixtures(version = "v0.2.2") {
  return {
    repositories: [
      { name: "SQLSage", owner: { login: "Figo5" }, private: false, html_url: "https://github.com/Figo5/SQLSage", description: `Query tools ${version}`, language: "TypeScript", pushed_at: "2026-10-25T12:00:00Z", archived: false },
      { name: "private-project", owner: { login: "Figo5" }, private: true, html_url: "https://github.com/Figo5/private-project", description: "Never returned", language: "TypeScript", pushed_at: "2026-10-25T12:00:00Z", archived: false },
    ],
    search: {
      incomplete_results: false,
      items: [
        issue("follow-redirects", "follow-redirects", 294),
        issue("external", "first", 12),
        issue("external", "first", 12),
        issue("Figo5", "own-project", 1),
        issue("external", "second", 13, { user: { login: "someone-else" } }),
        issue("external", "third", 14, { html_url: "https://github.com/external/third/pull/14", pull_request: {} }),
        issue("external", "fourth", 15),
        issue("external", "fifth", 16),
      ],
    },
    release: { tag_name: version, name: `SQLSage ${version}`, html_url: `https://github.com/Figo5/sqlsage/releases/tag/${version}`, published_at: "2026-10-25T12:00:00Z", draft: false, prerelease: false },
  };
}

function publicFetch(data = fixtures(), overrides = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push(url);
    assert.equal(new URL(url).hostname, "api.github.com");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "manual");
    const path = new URL(url).pathname;
    if (overrides.handle) {
      const response = await overrides.handle(path, calls.length);
      if (response) return response;
    }
    if (path === "/users/Figo5/repos") return Response.json(data.repositories);
    if (path === "/search/issues") return Response.json(data.search);
    if (path === "/repos/Figo5/sqlsage/releases/latest") return Response.json(data.release);
    const match = /^\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)$/.exec(path);
    if (match) return Response.json(issue(match[1], match[2], Number(match[3]), { state: match[1] === "follow-redirects" ? "closed" : "open" }));
    throw new Error(`Unexpected endpoint: ${path}`);
  };
  return { fetcher, calls };
}

function publishedSnapshot(fetchedAt = new Date(START - HOUR).toISOString()) {
  const sourceDate = new Date(Date.parse(fetchedAt) - HOUR).toISOString();
  const issueSources = [
    ["follow-redirects", "follow-redirects", 294], ["oapi-codegen", "nethttp-middleware", 89],
    ["mafintosh", "tar-fs", 122], ["nodejs", "node", 66853],
  ];
  return {
    repositories: { sqlsage: { description: "Scheduled public data", language: "TypeScript", pushedAt: sourceDate, archived: false, url: "https://github.com/Figo5/sqlsage" } },
    issues: Object.fromEntries(issueSources.map(([owner, repo, number]) => [`${owner}/${repo}#${number}`, { state: "open", url: `https://github.com/${owner}/${repo}/issues/${number}`, updatedAt: sourceDate }])),
    contributions: [{ title: "A public report", url: "https://github.com/external/report/issues/1", repository: "external/report", action: "Public report", occurredAt: sourceDate }],
    latestRelease: { tag: "v0.2.2", name: "SQLSage v0.2.2", url: "https://github.com/Figo5/sqlsage/releases/tag/v0.2.2", publishedAt: sourceDate },
    fetchedAt, stale: false,
  };
}

function withFeed(feed, api = publicFetch(), contentType = "text/plain; charset=utf-8") {
  const calls = [];
  return {
    calls,
    api,
    fetcher: async (url, options) => {
      calls.push(url);
      if (url !== FEED_URL) return api.fetcher(url, options);
      assert.equal(options.redirect, "manual");
      assert.equal(options.headers.Authorization, undefined);
      return new Response(JSON.stringify(typeof feed === "function" ? feed() : feed), { headers: { "Content-Type": contentType } });
    },
  };
}

test("cold refresh persists public data, excludes duplicate featured reports, and retains profile data", async () => {
  const db = database();
  const upstream = publicFetch();
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START });
  assert.equal(upstream.calls.length, 7);
  assert.equal(snapshot.stale, false);
  assert.equal(snapshot.fetchedAt, new Date(START).toISOString());
  assert.deepEqual(Object.keys(snapshot.repositories), ["sqlsage"]);
  assert.equal(snapshot.issues["follow-redirects/follow-redirects#294"].state, "closed");
  assert.deepEqual(snapshot.contributions.map(entry => entry.repository), ["external/first", "external/third", "external/fourth"]);
  assert.deepEqual(snapshot.contributions.map(entry => entry.action), ["Public report", "Pull request", "Public report"]);
  assert.equal(snapshot.latestRelease.tag, "v0.2.2");
  assert.equal(db.sqlite.prepare("SELECT owner_user_id FROM profile").get().owner_user_id, "owner");
  const second = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START + HOUR });
  assert.deepEqual(second, snapshot);
  assert.equal(upstream.calls.length, 7);
});

test("a D1 lease allows only one cold request to fetch GitHub", async () => {
  const db = database();
  let unblock;
  const barrier = new Promise(resolve => { unblock = resolve; });
  let started;
  const firstRequest = new Promise(resolve => { started = resolve; });
  const upstream = publicFetch(fixtures(), { handle: async (_path, count) => { if (count === 7) started(); await barrier; } });
  const winner = readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START });
  await firstRequest;
  const observer = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START });
  assert.equal(observer.fetchedAt, null);
  assert.equal(observer.stale, true);
  assert.equal(upstream.calls.length, 7);
  unblock();
  assert.equal((await winner).stale, false);
  assert.equal(db.sqlite.prepare("SELECT lease_until FROM github_snapshot").get().lease_until, 0);
});

test("one failed source retains its last good value while other sources refresh", async () => {
  const db = database();
  const initial = publicFetch();
  await readGitHubSnapshotFromDb(db, { fetcher: initial.fetcher, now: () => START });
  const refresh = publicFetch(fixtures("v0.3.0"), {
    handle: path => path === "/repos/mafintosh/tar-fs/issues/122" ? new Response("unavailable", { status: 503 }) : null,
  });
  const now = START + 6 * HOUR;
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: refresh.fetcher, now: () => now });
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.fetchedAt, new Date(START).toISOString());
  assert.equal(snapshot.issues["mafintosh/tar-fs#122"].state, "open");
  assert.equal(snapshot.latestRelease.tag, "v0.3.0");
  assert.equal(snapshot.repositories.sqlsage.description, "Query tools v0.3.0");
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, now + HOUR / 2);
  await readGitHubSnapshotFromDb(db, { fetcher: refresh.fetcher, now: () => now + 1000 });
  assert.equal(refresh.calls.length, 7);
});

test("rate-limit Retry-After prevents retries until the provider's deadline", async () => {
  const db = database();
  const upstream = publicFetch(fixtures(), { handle: () => new Response("rate limited", { status: 429, headers: { "Retry-After": "7200" } }) });
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START });
  assert.equal(snapshot.fetchedAt, null);
  assert.equal(snapshot.stale, true);
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, START + 2 * HOUR);
  await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START + HOUR });
  assert.equal(upstream.calls.length, 7);
});

test("upstream redirects are rejected without following another origin", async () => {
  const db = database();
  const upstream = publicFetch(fixtures(), { handle: () => new Response(null, { status: 302, headers: { Location: "https://example.com/redirect" } }) });
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => START });
  assert.equal(snapshot.fetchedAt, null);
  assert.equal(snapshot.stale, true);
  assert.equal(upstream.calls.length, 7);
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, START + HOUR / 2);
});

test("malformed and oversized upstream data cannot replace a valid cached source", async () => {
  const db = database();
  const first = publicFetch();
  await readGitHubSnapshotFromDb(db, { fetcher: first.fetcher, now: () => START });
  const bad = publicFetch(fixtures("v9.0.0"), {
    handle: path => {
      if (path === "/users/Figo5/repos") return Response.json({ unexpected: "shape" });
      if (path === "/search/issues") return Response.json(fixtures().search, { headers: { "Content-Length": "3000000" } });
      if (path === "/repos/Figo5/sqlsage/releases/latest") return Response.json({ ...fixtures().release, html_url: "https://example.com/redirect" });
      return null;
    },
  });
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: bad.fetcher, now: () => START + 6 * HOUR });
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.repositories.sqlsage.description, "Query tools v0.2.2");
  assert.equal(snapshot.latestRelease.tag, "v0.2.2");
  assert.equal(snapshot.contributions.length, 3);
});

test("a failed final cache write keeps the prior snapshot and the claim's durable retry backoff", async () => {
  const db = database();
  const first = publicFetch();
  await readGitHubSnapshotFromDb(db, { fetcher: first.fetcher, now: () => START });
  db.failFinalWrite = true;
  const upstream = publicFetch(fixtures("v0.3.0"));
  const now = START + 6 * HOUR;
  const snapshot = await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => now });
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.latestRelease.tag, "v0.2.2");
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, now + HOUR / 2);
  await readGitHubSnapshotFromDb(db, { fetcher: upstream.fetcher, now: () => now + 60_000 });
  assert.equal(upstream.calls.length, 7);
});

test("hosted reads use one bounded text/plain feed request and cache until the source timestamp expires", async () => {
  const db = database();
  const feed = publishedSnapshot();
  feed.ignoredField = "not projected into public responses";
  feed.repositories.sqlsage.ignoredField = "not projected into public responses";
  const upstream = withFeed(feed);
  const snapshot = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START });
  assert.equal(snapshot.stale, false);
  assert.equal(snapshot.fetchedAt, feed.fetchedAt);
  assert.equal(snapshot.repositories.sqlsage.description, "Scheduled public data");
  assert.equal(Object.hasOwn(snapshot, "ignoredField"), false);
  assert.equal(Object.hasOwn(snapshot.repositories.sqlsage, "ignoredField"), false);
  assert.deepEqual(upstream.calls, [FEED_URL]);
  assert.equal(upstream.api.calls.length, 0);
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, START + 5 * HOUR);
  const cached = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START + HOUR });
  assert.deepEqual(cached, snapshot);
  assert.deepEqual(upstream.calls, [FEED_URL]);
});

test("future timestamps, foreign links, and incomplete published feeds fall back to the direct API", async t => {
  const mutations = {
    future: feed => { feed.fetchedAt = new Date(START + 1).toISOString(); },
    foreignLink: feed => { feed.repositories.sqlsage.url = "https://example.com/Figo5/sqlsage"; },
    incomplete: feed => { delete feed.issues["nodejs/node#66853"]; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, async () => {
      const db = database();
      const feed = publishedSnapshot();
      mutate(feed);
      const upstream = withFeed(feed);
      const snapshot = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START });
      assert.equal(snapshot.stale, false);
      assert.equal(snapshot.fetchedAt, new Date(START).toISOString());
      assert.equal(snapshot.repositories.sqlsage.description, "Query tools v0.2.2");
      assert.equal(upstream.calls.length, 8);
      assert.equal(upstream.api.calls.length, 7);
    });
  }
});

test("an old published feed remains visibly stale during an API outage and retries after thirty minutes", async () => {
  const db = database();
  let feed = publishedSnapshot(new Date(START - 7 * HOUR).toISOString());
  const api = publicFetch(fixtures(), { handle: () => new Response("unavailable", { status: 503 }) });
  const upstream = withFeed(() => feed, api);
  const snapshot = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START });
  assert.equal(snapshot.stale, true);
  assert.equal(snapshot.fetchedAt, feed.fetchedAt);
  assert.equal(snapshot.repositories.sqlsage.description, "Scheduled public data");
  assert.equal(Object.keys(snapshot.issues).length, 4);
  assert.equal(snapshot.latestRelease.tag, "v0.2.2");
  assert.equal(upstream.calls.length, 8);
  assert.equal(db.sqlite.prepare("SELECT next_refresh_at FROM github_snapshot").get().next_refresh_at, START + HOUR / 2);
  await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START + 1000 });
  assert.equal(upstream.calls.length, 8);
  feed = publishedSnapshot(new Date(START + HOUR / 2).toISOString());
  const recovered = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START + HOUR / 2 });
  assert.equal(recovered.stale, false);
  assert.equal(recovered.fetchedAt, feed.fetchedAt);
  assert.equal(upstream.calls.length, 9);
  assert.equal(upstream.api.calls.length, 7);
});

test("failed feed and API requests retain the prior complete D1 snapshot", async () => {
  const db = database();
  const initial = withFeed(publishedSnapshot());
  const saved = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: initial.fetcher, now: () => START });
  let requests = 0;
  const failedFetch = async () => { requests += 1; return new Response("unavailable", { status: 503 }); };
  const cached = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: failedFetch, now: () => START + 6 * HOUR });
  assert.deepEqual(cached, { ...saved, stale: true });
  assert.equal(requests, 8);
});

test("the hosted feed cache does not inherit the old incomplete cache's retry deadline", async () => {
  const db = database();
  db.sqlite.prepare("INSERT INTO github_snapshot (id, payload, next_refresh_at, lease_until) VALUES (?, NULL, ?, 0)").run("public-github-v1", START + 24 * HOUR);
  const upstream = withFeed(publishedSnapshot());
  const snapshot = await readGitHubSnapshotFromDb(db, { usePublishedFeed: true, fetcher: upstream.fetcher, now: () => START });
  assert.equal(snapshot.stale, false);
  assert.deepEqual(upstream.calls, [FEED_URL]);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM github_snapshot").get().count, 2);
  assert.equal(db.sqlite.prepare("SELECT owner_user_id FROM profile").get().owner_user_id, "owner");
});
