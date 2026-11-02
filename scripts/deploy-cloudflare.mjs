import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const config = "dist/server/wrangler.json";

// Version deployment preserves domain settings and needs only this Worker's
// editor token. Full `wrangler deploy` also reads account-wide subdomain data.
const output = execFileSync(process.execPath, [wrangler, "versions", "upload", "--config", config], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
  maxBuffer: 16 * 1024 * 1024,
});
process.stdout.write(output);
const version = output.match(/Worker Version ID:\s*([a-f0-9-]{36})\b/)?.[1];
if (!version || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(version)) {
  throw new Error("Cloudflare did not return a valid uploaded version; no version was activated.");
}
execFileSync(process.execPath, [wrangler, "versions", "deploy", `${version}@100%`, "--yes", "--config", config], {
  stdio: "inherit",
});
