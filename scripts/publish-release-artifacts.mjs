// Publish immutable, already-built release artifacts using the existing npm account.
// Existing exact versions must match local bytes; only a registry E404 permits publish.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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
  const accepted = new Set((process.env.NPM_ALREADY_SUBMITTED ?? "").split(",").map(x => x.trim()).filter(Boolean));
  const records = [];
  const save = () => writeFileSync("npm-publication-receipt.json", JSON.stringify(records, null, 2) + "\n");
  const argsFor = spec => ["view", spec, "dist", "--json", "--registry=https://registry.npmjs.org", "--fetch-retries=2", "--fetch-timeout=30000"];
  for (const file of files) {
    const path = join(directory, file), artifact = inspectArtifact(path), spec = `${artifact.name}@${artifact.version}`;
    const result = spawnSync("npm", argsFor(spec), { encoding: "utf8" });
    const record = { ...artifact, spec, state: "preflight" };
    records.push(record); save();
    if (registryDecision(result, artifact.integrity) === "publish") {
      if (accepted.has(spec)) {
        record.state = "accepted-previous-run";
      } else {
        // A successful npm response may remain invisible during registry processing.
        // Record it once, continue unrelated packages, and never retry this upload.
        execFileSync("npm", ["publish", path, "--access", "public", "--ignore-scripts", "--registry=https://registry.npmjs.org"], { stdio: "inherit" });
        record.state = "accepted-this-run";
      }
    } else record.state = "verified";
    save();
  }
  for (let attempt = 0; attempt < 20 && records.some(x => x.state !== "verified"); attempt++) {
    for (const record of records.filter(x => x.state !== "verified")) {
      const result = spawnSync("npm", argsFor(record.spec), { encoding: "utf8" });
      if (registryDecision(result, record.integrity) === "already-published") record.state = "verified";
    }
    save();
    if (records.some(x => x.state !== "verified")) await new Promise(resolve => setTimeout(resolve, 15000));
  }
  const pending = records.filter(x => x.state !== "verified");
  if (pending.length) throw new Error(`npm accepted these uploads but registry readback is still pending: ${pending.map(x => x.spec).join(", ")}. Reuse the receipt; do not upload again.`);
  for (const record of records) console.log(`${record.spec}: exact npm integrity verified`);
}
