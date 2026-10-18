// Publish immutable, already-built release artifacts using the existing npm account.
// Existing exact versions must match local bytes; only a registry E404 permits publish.
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { basename, join, resolve } from "node:path";

export function registryDecision(result, integrity) {
  let value;
  try { value = JSON.parse(result.stdout || "{}"); } catch { throw new Error("npm registry returned non-JSON metadata"); }
  if (result.status === 0) {
    if (value.integrity !== integrity) throw new Error("Existing npm version has different artifact bytes; do not overwrite or silently skip");
    return "already-published";
  }
  if (value.error?.code === "E404") return "publish";
  throw new Error(`npm registry preflight failed (${value.error?.code ?? "unknown"}); refusing to publish blindly`);
}
export function inspectArtifact(path) {
  const pkg = JSON.parse(execFileSync("tar", ["-xOf", path, "package/package.json"], { encoding: "utf8" }));
  const allowed = new Set(["@acedatacloud/openclaw-provider", ...["suno", "seedance", "happyhorse", "gpt-image", "nano-banana"].map(s => `@acedatacloud/${s}-openclaw`)]);
  if (!allowed.has(pkg.name) || !/^(?:\d{4}\.\d+\.\d+|0\.\d+\.\d+)$/.test(pkg.version)) throw new Error("Unexpected release artifact identity");
  if (basename(path) !== `${pkg.name.slice(1).replace("/", "-")}-${pkg.version}.tgz`) throw new Error("Artifact filename differs from packed metadata");
  return { name: pkg.name, version: pkg.version, integrity: `sha512-${createHash("sha512").update(readFileSync(path)).digest("base64")}` };
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  if (!process.env.NODE_AUTH_TOKEN?.trim()) throw new Error("Existing npm publishing token is not configured");
  const directory = resolve(process.argv[2] ?? ".");
  const files = readdirSync(directory).filter(name => /^acedatacloud-(?:openclaw-provider|(?:suno|seedance|happyhorse|gpt-image|nano-banana)-openclaw)-[\d.]+\.tgz$/.test(name)).sort();
  if (files.length !== 6) throw new Error("Expected collection plus five service release artifacts");
  for (const file of files) {
    const path = join(directory, file), artifact = inspectArtifact(path), spec = `${artifact.name}@${artifact.version}`;
    const args = ["view", spec, "dist", "--json", "--registry=https://registry.npmjs.org", "--fetch-retries=2", "--fetch-timeout=30000"];
    let result = spawnSync("npm", args, { encoding: "utf8" });
    if (registryDecision(result, artifact.integrity) === "publish") {
      // Never invoke lifecycle scripts or repeat a publication after an ambiguous failure.
      execFileSync("npm", ["publish", path, "--access", "public", "--ignore-scripts", "--registry=https://registry.npmjs.org"], { stdio: "inherit" });
      for (let attempt = 0; attempt < 4; attempt++) {
        result = spawnSync("npm", args, { encoding: "utf8" });
        if (result.status === 0) break;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      if (registryDecision(result, artifact.integrity) !== "already-published") throw new Error(`Published ${spec}, but registry readback is still pending; inspect without re-publishing`);
    }
    console.log(`${spec}: exact npm integrity verified`);
  }
}
