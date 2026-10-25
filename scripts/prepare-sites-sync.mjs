import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { chmod, lstat, mkdir, open, readFile, realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY = "Figo5/gfiore.com";
const BRANCH = "main";
const HOSTING_PATH = ".openai/hosting.json";
const GENERATED_PATHS = new Set([".openai/github-source.json", "public/deployment.json"]);
const PROTECTED_PATHS = new Set([HOSTING_PATH, ...GENERATED_PATHS]);
const MAX_FILES = 5_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const FORBIDDEN_DIRECTORIES = new Set([
  ".git", ".wrangler", ".sites-runtime", ".sites-checkout", ".next", ".vinext",
  ".codex", ".agents", "node_modules", "dist", "out", "coverage", "outputs", "work",
]);

function git(root, args, { binary = false } = {}) {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: binary ? undefined : "utf8",
    maxBuffer: MAX_TOTAL_BYTES,
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Git ${args[0]} failed; source preparation stopped.`);
  }
  return binary ? result.stdout : result.stdout.trim();
}

function comparable(value) {
  return process.platform === "win32" ? value.toLowerCase() : value;
}

function isWithin(root, candidate) {
  const relative = path.relative(comparable(root), comparable(candidate));
  return relative !== "" && !path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

function validateRelativePath(value) {
  if (!value || /[\\:\x00-\x1f\x7f]/.test(value) || path.posix.isAbsolute(value)) {
    throw new Error("A committed path is unsafe for source preparation.");
  }
  const segments = value.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === ".." || /[. ]$/.test(segment)
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) {
    throw new Error("A committed path is unsafe for source preparation.");
  }
  if (segments.some(segment => segment.toLowerCase() === ".git")) {
    throw new Error("Git metadata cannot be mirrored.");
  }
}

function isForbiddenSourcePath(value) {
  const segments = value.toLowerCase().split("/");
  if (segments.some(segment => FORBIDDEN_DIRECTORIES.has(segment))) return true;
  const filename = segments.at(-1);
  if (filename === ".env.example" || filename === ".dev.vars.example") return false;
  return filename.startsWith(".env") || filename.startsWith(".dev.vars")
    || /\.(pem|key|p12|pfx|sqlite|sqlite3|db|log)$/.test(filename);
}

function validateTemplate(filename, data) {
  if (![".env.example", ".dev.vars.example"].includes(path.posix.basename(filename))) return;
  for (const line of data.toString("utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (/TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY|CREDENTIAL/i.test(key)
      && value && !/^(?:<.*>|your[-_ ].*|example.*|placeholder.*|change[-_]?me|dummy.*)$/i.test(value)) {
      throw new Error("An environment example contains a non-placeholder secret value.");
    }
    if (/EMAIL/i.test(key) && value && !/^[^@\s]+@(?:[^@\s]+\.(?:test|example)|example\.(?:com|net|org))$/i.test(value)) {
      throw new Error("An environment example contains a non-example email address.");
    }
  }
}

async function optionalStat(filename) {
  try { return await lstat(filename); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function safePath(root, relative, { mustBeFile = false } = {}) {
  validateRelativePath(relative);
  const destination = path.resolve(root, ...relative.split("/"));
  if (!isWithin(root, destination)) throw new Error("A target path escaped the verified checkout.");
  let cursor = root;
  const segments = relative.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    const info = await optionalStat(cursor);
    if (!info) continue;
    if (info.isSymbolicLink()) throw new Error("Symlink or junction paths require a manual source sync.");
    if (info.isFile() && info.nlink > 1) throw new Error("Hard-linked target files require a manual source sync.");
    const final = index === segments.length - 1;
    if ((!final && !info.isDirectory()) || (final && mustBeFile && !info.isFile())) {
      throw new Error("Directory/file shape changes require a manual source sync.");
    }
  }
  return destination;
}

async function repositoryRoot(input, label) {
  if (!path.isAbsolute(input)) throw new Error(`${label} must be an absolute Git checkout path.`);
  const requested = path.resolve(input);
  const info = await lstat(requested);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${label} must be a real checkout directory.`);
  const root = await realpath(requested);
  const gitRoot = await realpath(git(root, ["rev-parse", "--show-toplevel"]));
  if (comparable(root) !== comparable(gitRoot)) throw new Error(`${label} must be the Git checkout root.`);
  return root;
}

function requireClean(root, label) {
  if (git(root, ["status", "--porcelain=v1", "--untracked-files=all"])) {
    throw new Error(`${label} has local changes; source preparation will not overwrite them.`);
  }
}

function tree(root) {
  const entries = git(root, ["ls-tree", "-rz", "--full-tree", "HEAD"], { binary: true })
    .toString("utf8").split("\0").filter(Boolean).map(entry => {
      const match = entry.match(/^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/);
      if (!match || match[2] !== "blob" || !["100644", "100755"].includes(match[1])) {
        throw new Error("Only committed regular files can be mirrored; symlinks and submodules require manual review.");
      }
      validateRelativePath(match[4]);
      return { mode: match[1], sha: match[3], filename: match[4] };
    });
  if (entries.length > MAX_FILES) throw new Error("Source snapshot exceeds the file limit.");
  const names = new Set();
  for (const entry of entries) {
    const name = comparable(entry.filename);
    if (names.has(name)) throw new Error("Case-colliding paths require a manual source sync.");
    names.add(name);
  }
  return entries;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseManifest(data, label) {
  let value;
  try { value = JSON.parse(data.toString("utf8")); }
  catch { throw new Error(`${label} hosting manifest is not valid JSON.`); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} hosting manifest must be an object.`);
  return value;
}

async function writeRegularFile(root, filename, data, mode = "100644") {
  const destination = await safePath(root, filename, { mustBeFile: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await safePath(root, filename, { mustBeFile: true });
  const handle = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW || 0), mode === "100755" ? 0o755 : 0o644);
  try { await handle.writeFile(data); }
  finally { await handle.close(); }
  await chmod(destination, mode === "100755" ? 0o755 : 0o644);
}

/** Prepare a clean, existing Site checkout; this never pushes or deploys. */
export async function prepareSitesSync({ sourceRoot, targetRoot, projectId }) {
  if (typeof projectId !== "string" || !projectId.trim()) throw new Error("An exact target project ID is required.");
  const source = await repositoryRoot(sourceRoot, "Source");
  const target = await repositoryRoot(targetRoot, "Target");
  if (comparable(source) === comparable(target) || isWithin(source, target) || isWithin(target, source)) {
    throw new Error("Source and target must be separate, non-nested checkouts.");
  }
  requireClean(source, "Source");
  requireClean(target, "Target");
  if (git(source, ["branch", "--show-current"]) !== BRANCH) throw new Error("Only the public main branch can be prepared.");
  const remote = git(source, ["remote", "get-url", "origin"]);
  if (!/^https:\/\/github\.com\/Figo5\/gfiore\.com(?:\.git)?\/?$/i.test(remote)) {
    throw new Error("Source origin must be the public Figo5/gfiore.com repository over HTTPS.");
  }
  const commit = git(source, ["rev-parse", "HEAD"]);
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Source HEAD is not a supported commit SHA.");
  const sourceEntries = tree(source);
  const targetEntries = tree(target);
  const sourceFiles = new Map();
  let totalBytes = 0;
  for (const entry of sourceEntries) {
    if (GENERATED_PATHS.has(entry.filename.toLowerCase())) throw new Error("Generated deployment metadata must not be tracked by the public source.");
    if (isForbiddenSourcePath(entry.filename)) throw new Error("The public source tracks a secret or runtime path; source preparation stopped.");
    const data = git(source, ["cat-file", "blob", entry.sha], { binary: true });
    totalBytes += data.byteLength;
    if (data.byteLength > MAX_FILE_BYTES || totalBytes > MAX_TOTAL_BYTES) throw new Error("Source snapshot exceeds the size limit.");
    validateTemplate(entry.filename, data);
    sourceFiles.set(entry.filename, { ...entry, data });
  }
  const sourceHosting = sourceFiles.get(HOSTING_PATH);
  if (!sourceHosting) throw new Error("The public source must contain a hosting manifest.");
  const publicManifest = parseManifest(sourceHosting.data, "Source");
  if (Object.hasOwn(publicManifest, "project_id")) throw new Error("The public source manifest must omit the live project ID.");
  const targetHostingPath = await safePath(target, HOSTING_PATH, { mustBeFile: true });
  const originalHostingBytes = await readFile(targetHostingPath);
  const targetManifest = parseManifest(originalHostingBytes, "Target");
  if (targetManifest.project_id !== projectId) throw new Error("The target project ID does not match the requested Site.");
  const { project_id: ignoredProjectId, ...targetBindings } = targetManifest;
  if (stableJson(publicManifest) !== stableJson(targetBindings)) {
    throw new Error("Hosting bindings or capabilities differ; review the hosting change before syncing.");
  }
  const targetNames = new Set(targetEntries.map(entry => entry.filename));
  const targetModes = new Map(targetEntries.map(entry => [entry.filename, entry.mode]));
  const deletions = targetEntries.filter(entry => !PROTECTED_PATHS.has(entry.filename) && !sourceFiles.has(entry.filename));
  const copies = [];
  for (const entry of sourceFiles.values()) {
    if (PROTECTED_PATHS.has(entry.filename)) continue;
    const destination = await safePath(target, entry.filename, { mustBeFile: true });
    const existing = await optionalStat(destination);
    if (existing && !targetNames.has(entry.filename)) throw new Error("A source file would overwrite an untracked or ignored target file.");
    const previous = existing ? await readFile(destination) : null;
    if (!previous || !previous.equals(entry.data) || targetModes.get(entry.filename) !== entry.mode) copies.push(entry);
  }
  for (const entry of deletions) await safePath(target, entry.filename, { mustBeFile: true });
  for (const filename of GENERATED_PATHS) await safePath(target, filename, { mustBeFile: true });
  requireClean(source, "Source");
  requireClean(target, "Target");
  if (git(source, ["rev-parse", "HEAD"]) !== commit) throw new Error("Source HEAD changed during preparation.");
  // Every unlink is non-recursive and bounded by the verified checkout immediately before use.
  for (const entry of deletions) await unlink(await safePath(target, entry.filename, { mustBeFile: true }));
  for (const entry of copies) {
    await writeRegularFile(target, entry.filename, entry.data, entry.mode);
    // Git for Windows ignores filesystem execute bits. Preserve explicit mode changes
    // in the index so the later source-helper commit retains the source tree's mode.
    const previousMode = targetModes.get(entry.filename);
    if (previousMode !== entry.mode && (previousMode === "100755" || entry.mode === "100755")) {
      git(target, ["update-index", "--add", `--chmod=${entry.mode === "100755" ? "+x" : "-x"}`, "--", entry.filename]);
    }
  }
  const metadata = { repository: REPOSITORY, branch: BRANCH, commit };
  const metadataBytes = Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`);
  let metadataChanges = 0;
  for (const filename of GENERATED_PATHS) {
    const destination = await safePath(target, filename, { mustBeFile: true });
    const existing = await optionalStat(destination);
    if (!existing || !(await readFile(destination)).equals(metadataBytes)) {
      await writeRegularFile(target, filename, metadataBytes);
      metadataChanges += 1;
    }
  }
  if (!(await readFile(targetHostingPath)).equals(originalHostingBytes)) throw new Error("The target hosting manifest changed during preparation.");
  return { source, target, repository: REPOSITORY, branch: BRANCH, commit, copied: copies.length, removed: deletions.length, metadataChanges };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== "--target" || args[2] !== "--project-id") {
    throw new Error("Usage: node scripts/prepare-sites-sync.mjs --target <absolute Site checkout> --project-id <exact Site ID>");
  }
  const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
  console.log(JSON.stringify(await prepareSitesSync({ sourceRoot, targetRoot: args[1], projectId: args[3] })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
