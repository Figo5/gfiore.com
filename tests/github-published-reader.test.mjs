import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../app/github-data-core.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { parsePublishedGitHubSnapshot, readPublishedGitHubSnapshot } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const fallback = JSON.parse(readFileSync(new URL("../content/github-fallback.json", import.meta.url), "utf8"));
const HOUR = 60 * 60 * 1000;
const START = Date.parse(fallback.fetchedAt) + HOUR;
const FEED_URL = "https://raw.githubusercontent.com/Figo5/gfiore.com/github-data/github.json";
const freshFeed = () => structuredClone(fallback);
const runtimeCompiled = ts.transpileModule(readFileSync(new URL("../app/github-data.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
  .replace(/^import fallback from "\.\.\/content\/github-fallback\.json";/m, `const fallback = ${JSON.stringify(fallback)};`)
  .replace('"./github-data-core"', JSON.stringify(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`));
const { readGitHubSnapshot } = await import(`data:text/javascript;base64,${Buffer.from(runtimeCompiled).toString("base64")}`);

test("the committed fallback is a complete validated public snapshot", () => {
  const feed = freshFeed();
  feed.ignoredField = "not forwarded";
  const parsed = parsePublishedGitHubSnapshot(feed, START);
  assert.ok(Object.keys(parsed.repositories).length > 0);
  assert.equal(Object.keys(parsed.issues).length, 4);
  assert.ok(parsed.latestRelease);
  assert.equal(parsed.stale, false);
  assert.equal(parsed.fetchedAt, fallback.fetchedAt);
  assert.equal(Object.hasOwn(parsed, "ignoredField"), false);
});

test("freshness uses the feed timestamp and preserves a source's stale flag", () => {
  assert.equal(parsePublishedGitHubSnapshot(freshFeed(), START + 5 * HOUR - 1).stale, false);
  assert.equal(parsePublishedGitHubSnapshot(freshFeed(), START + 5 * HOUR).stale, true);
  assert.equal(parsePublishedGitHubSnapshot({ ...freshFeed(), stale: true }, START).stale, true);
});

test("invalid timestamps and incomplete envelopes cannot enter public responses", async t => {
  const mutations = {
    future: feed => { feed.fetchedAt = new Date(START + 1).toISOString(); },
    missingTimestamp: feed => { delete feed.fetchedAt; },
    invalidTimestamp: feed => { feed.fetchedAt = "invalid"; },
    incompleteIssues: feed => { delete feed.issues["nodejs/node#66853"]; },
    noRepositories: feed => { feed.repositories = {}; },
    noRelease: feed => { feed.latestRelease = null; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    await t.test(name, () => {
      const feed = freshFeed();
      mutate(feed);
      assert.throws(() => parsePublishedGitHubSnapshot(feed, START));
    });
  }
});

test("foreign origins, credentials, and mismatched GitHub paths are rejected", async t => {
  for (const url of [
    "https://example.com/Figo5/sqlsage",
    "https://github.com@evil.example/Figo5/sqlsage",
    "https://secret@github.com/Figo5/sqlsage",
    "https://github.com/another-user/sqlsage",
    "https://github.com/Figo5/sqlsage?redirect=elsewhere",
  ]) {
    await t.test(url, () => {
      const feed = freshFeed();
      feed.repositories.sqlsage.url = url;
      assert.throws(() => parsePublishedGitHubSnapshot(feed, START));
    });
  }
});

test("the runtime reader fetches only the fixed public feed without credentials", async () => {
  let calls = 0;
  const parsed = await readPublishedGitHubSnapshot({
    now: () => START,
    fetcher: async (url, options) => {
      calls += 1;
      assert.equal(url, FEED_URL);
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "manual");
      assert.equal(options.headers.Authorization, undefined);
      assert.ok(options.signal instanceof AbortSignal);
      return new Response(JSON.stringify(freshFeed()), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    },
  });
  assert.equal(calls, 1);
  assert.equal(parsed.stale, false);
  assert.equal(parsed.fetchedAt, fallback.fetchedAt);
});

test("network redirects, bad content, and oversized payloads fail closed", async t => {
  const responses = {
    redirect: () => new Response(null, { status: 302, headers: { Location: "https://example.com" } }),
    outage: () => new Response("unavailable", { status: 503 }),
    html: () => new Response("<html>unexpected</html>", { headers: { "Content-Type": "text/html" } }),
    invalidJson: () => new Response("{invalid", { headers: { "Content-Type": "application/json" } }),
    advertisedOversize: () => Response.json(freshFeed(), { headers: { "Content-Length": "3000000" } }),
    actualOversize: () => new Response(" ".repeat(2 * 1024 * 1024 + 1), { headers: { "Content-Type": "application/json" } }),
    partial: () => Response.json({ ...freshFeed(), latestRelease: null }),
  };
  for (const [name, response] of Object.entries(responses)) {
    await t.test(name, async () => {
      let calls = 0;
      await assert.rejects(() => readPublishedGitHubSnapshot({ now: () => START, fetcher: async () => { calls += 1; return response(); } }));
      assert.equal(calls, 1);
    });
  }
});

test("the website requests five-minute revalidation and retains the committed snapshot on outage", async t => {
  t.mock.method(Date, "now", () => START);
  t.mock.method(console, "warn", () => {});
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, FEED_URL);
    assert.deepEqual(options.next, { revalidate: 300 });
    return new Response("unavailable", { status: 503 });
  });
  assert.deepEqual(await readGitHubSnapshot(), { ...parsePublishedGitHubSnapshot(fallback, START), stale: true });
  assert.equal(fetchMock.mock.callCount(), 1);
  fetchMock.mock.mockImplementation(async () => Response.json({ ...freshFeed(), fetchedAt: new Date(START).toISOString() }));
  const recovered = await readGitHubSnapshot();
  assert.equal(recovered.stale, false);
  assert.equal(recovered.fetchedAt, new Date(START).toISOString());
});
