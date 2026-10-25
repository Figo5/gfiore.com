import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const commit = process.env.COMMIT_REF || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("A full deployment commit is required.");
await writeFile(new URL("../public/deployment.json", import.meta.url), `${JSON.stringify({ repository: "Figo5/gfiore.com", branch: "main", commit })}\n`);
