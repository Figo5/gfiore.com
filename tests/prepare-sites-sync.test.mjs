import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { link, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareSitesSync } from "../scripts/prepare-sites-sync.mjs";

const PREFIX = "gfiore-sites-sync-test-";
const PROJECT = "test-project-exact";
const ORIGIN = "https://github.com/Figo5/gfiore.com.git";
const IGNORE = ".dev.vars*\n!.dev.vars.example\n.env*\n!.env.example\n.wrangler/\nnode_modules/\ndist/\n";

function git(root, args, input) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", input, windowsHide: true });
  assert.equal(result.status, 0, `Git ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
}

async function put(root, filename, content) {
  const destination = path.join(root, ...filename.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

function commit(root, message = "fixture") {
  git(root, ["add", "--all"]);
  git(root, ["commit", "--quiet", "-m", message]);
}

async function fixture(context) {
  const directory = await mkdtemp(path.join(os.tmpdir(), PREFIX));
  const source = path.join(directory, "source");
  const target = path.join(directory, "target");
  context.after(async () => {
    const tempRoot = path.resolve(os.tmpdir());
    const resolved = path.resolve(directory);
    const relative = path.relative(tempRoot, resolved);
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    assert.ok(path.basename(resolved).startsWith(PREFIX));
    assert.ok(!(await lstat(resolved)).isSymbolicLink());
    await rm(resolved, { recursive: true, force: true });
  });
  for (const root of [source, target]) {
    await mkdir(root);
    git(root, ["init", "--quiet", "--initial-branch=main"]);
    git(root, ["config", "user.name", "Fixture"]);
    git(root, ["config", "user.email", "fixture@example.test"]);
    git(root, ["config", "core.autocrlf", "false"]);
    await put(root, ".gitignore", IGNORE);
  }
  git(source, ["remote", "add", "origin", ORIGIN]);
  await put(source, ".openai/hosting.json", '{"d1":"DB","r2":null}\n');
  await put(source, "README.md", "New public source\n");
  await put(source, "app/page.tsx", "export default function Page() { return null; }\n");
  await put(source, ".dev.vars.example", "SITE_OWNER_EMAIL=seedy@sites.test\n");
  await put(target, ".openai/hosting.json", `{\n\t"r2": null,\n\t"project_id": "${PROJECT}",\n\t"d1": "DB"\n}\n`);
  await put(target, "README.md", "Old hosted source\n");
  await put(target, "obsolete.txt", "Remove this tracked file\n");
  await put(target, ".openai/github-source.json", '{"commit":"old"}\n');
  await put(target, "public/deployment.json", '{"commit":"old"}\n');
  commit(source);
  commit(target);
  await put(target, ".dev.vars", "SITE_OWNER_EMAIL=owner@example.test\n");
  await put(target, ".wrangler/state/local.sqlite", "private local state");
  return { directory, source, target, sync: () => prepareSitesSync({ sourceRoot: source, targetRoot: target, projectId: PROJECT }) };
}

test("mirrors committed source while preserving hosting identity, Git, and ignored data", async context => {
  const { source, target, sync } = await fixture(context);
  const hosting = await readFile(path.join(target, ".openai/hosting.json"));
  const gitHead = git(target, ["rev-parse", "HEAD"]);
  const result = await sync();
  assert.equal(result.commit, git(source, ["rev-parse", "HEAD"]));
  assert.equal(result.removed, 1);
  assert.equal(await readFile(path.join(target, "README.md"), "utf8"), "New public source\n");
  await assert.rejects(readFile(path.join(target, "obsolete.txt")), { code: "ENOENT" });
  assert.deepEqual(await readFile(path.join(target, ".openai/hosting.json")), hosting);
  assert.equal(await readFile(path.join(target, ".dev.vars"), "utf8"), "SITE_OWNER_EMAIL=owner@example.test\n");
  assert.equal(await readFile(path.join(target, ".wrangler/state/local.sqlite"), "utf8"), "private local state");
  assert.equal(git(target, ["rev-parse", "HEAD"]), gitHead);
  const expected = { repository: "Figo5/gfiore.com", branch: "main", commit: result.commit };
  assert.deepEqual(JSON.parse(await readFile(path.join(target, ".openai/github-source.json"), "utf8")), expected);
  assert.deepEqual(JSON.parse(await readFile(path.join(target, "public/deployment.json"), "utf8")), expected);
});

for (const which of ["source", "target"]) {
  test(`refuses a dirty ${which} without changing hosted files`, async context => {
    const fixtureData = await fixture(context);
    await put(fixtureData[which], "README.md", "Uncommitted user edits\n");
    const before = await readFile(path.join(fixtureData.target, "README.md"));
    await assert.rejects(fixtureData.sync(), /has local changes/);
    assert.deepEqual(await readFile(path.join(fixtureData.target, "README.md")), before);
  });
}

test("refuses the wrong target project ID", async context => {
  const { source, target } = await fixture(context);
  await assert.rejects(prepareSitesSync({ sourceRoot: source, targetRoot: target, projectId: "different-project" }), /project ID does not match/);
  assert.equal(await readFile(path.join(target, "README.md"), "utf8"), "Old hosted source\n");
});

test("refuses hosting binding changes even when JSON key order differs", async context => {
  const { source, target, sync } = await fixture(context);
  await put(source, ".openai/hosting.json", '{"d1":"OTHER_DB","r2":null}\n');
  commit(source, "different binding");
  await assert.rejects(sync(), /Hosting bindings or capabilities differ/);
  assert.equal(await readFile(path.join(target, "README.md"), "utf8"), "Old hosted source\n");
});

test("refuses a live Site identity in the public manifest", async context => {
  const { source, sync } = await fixture(context);
  await put(source, ".openai/hosting.json", `{"project_id":"${PROJECT}","d1":"DB","r2":null}\n`);
  commit(source, "live identity");
  await assert.rejects(sync(), /must omit the live project ID/);
});

test("refuses tracked environment secrets", async context => {
  const { source, sync } = await fixture(context);
  await put(source, ".env.production", "SECRET=not-a-real-secret\n");
  git(source, ["add", "--force", ".env.production"]);
  git(source, ["commit", "--quiet", "-m", "forbidden source path"]);
  await assert.rejects(sync(), /tracks a secret or runtime path/);
});

test("refuses non-placeholder values in environment examples", async context => {
  const { source, sync } = await fixture(context);
  await put(source, ".env.example", "API_KEY=some-real-looking-value\n");
  commit(source, "unsafe template");
  await assert.rejects(sync(), /non-placeholder secret value/);
});

for (const filename of [".openai/github-source.json", "public/deployment.json", "public/Deployment.json"]) {
  test(`reserves generated metadata path ${filename}`, async context => {
    const { source, target, sync } = await fixture(context);
    await put(source, filename, '{"commit":"spoofed"}\n');
    commit(source, "spoof generated metadata");
    await assert.rejects(sync(), /Generated deployment metadata must not be tracked/);
    const existing = filename === "public/Deployment.json" ? "public/deployment.json" : filename;
    assert.equal(await readFile(path.join(target, existing), "utf8"), '{"commit":"old"}\n');
  });
}

test("refuses ignored target-file collisions", async context => {
  const { source, target, sync } = await fixture(context);
  await put(target, ".gitignore", `${IGNORE}private-note.txt\n`);
  commit(target, "ignore local note");
  await put(target, "private-note.txt", "Keep local-only data\n");
  await put(source, "private-note.txt", "Public replacement\n");
  commit(source, "new source file");
  await assert.rejects(sync(), /overwrite an untracked or ignored target file/);
  assert.equal(await readFile(path.join(target, "private-note.txt"), "utf8"), "Keep local-only data\n");
});

test("refuses committed symlink modes without needing Windows symlink privileges", async context => {
  const { source, sync } = await fixture(context);
  git(source, ["config", "core.symlinks", "false"]);
  const object = git(source, ["hash-object", "-w", "--stdin"], "../outside");
  git(source, ["update-index", "--add", "--cacheinfo", `120000,${object},link`]);
  git(source, ["commit", "--quiet", "-m", "symlink tree entry"]);
  git(source, ["checkout", "--", "link"]);
  assert.equal(git(source, ["status", "--porcelain"]), "");
  await assert.rejects(sync(), /Only committed regular files/);
});

test("refuses an unexpected source origin and branch", async context => {
  const { source, sync } = await fixture(context);
  git(source, ["remote", "set-url", "origin", "https://github.com/example/other.git"]);
  await assert.rejects(sync(), /Source origin must be/);
  git(source, ["remote", "set-url", "origin", ORIGIN]);
  git(source, ["switch", "--quiet", "-c", "other"]);
  await assert.rejects(sync(), /Only the public main branch/);
});

test("refuses ignored target junction ancestors without following them", async context => {
  const { directory, target, sync } = await fixture(context);
  const outside = path.join(directory, "outside");
  await mkdir(outside);
  await put(outside, "page.tsx", "Keep outside content\n");
  await put(target, ".gitignore", `${IGNORE}app/\n`);
  commit(target, "ignore an existing local directory");
  try { await symlink(outside, path.join(target, "app"), "junction"); }
  catch (error) {
    if (error.code === "EPERM" || error.code === "EACCES") return context.skip("This host cannot create junctions.");
    throw error;
  }
  await assert.rejects(sync(), /Symlink or junction paths/);
  assert.equal(await readFile(path.join(outside, "page.tsx"), "utf8"), "Keep outside content\n");
});

test("refuses target hard links without altering the other link", async context => {
  const { directory, target, sync } = await fixture(context);
  const outside = path.join(directory, "linked-readme.txt");
  await link(path.join(target, "README.md"), outside);
  await assert.rejects(sync(), /Hard-linked target files/);
  assert.equal(await readFile(outside, "utf8"), "Old hosted source\n");
});

test("retains committed executable modes when Git ignores filesystem modes", async context => {
  const { source, target, sync } = await fixture(context);
  git(source, ["config", "core.filemode", "false"]);
  git(target, ["config", "core.filemode", "false"]);
  git(source, ["update-index", "--chmod=+x", "app/page.tsx"]);
  git(source, ["commit", "--quiet", "-m", "executable source mode"]);
  await sync();
  assert.match(git(target, ["ls-files", "--stage", "app/page.tsx"]), /^100755 /);
});
