// Publish immutable, already-built release artifacts using the existing npm account.
// Existing exact versions must match local bytes; only a registry E404 permits publish.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { basename, join, resolve } from "node:path";
import { SERVICE_PLUGINS } from "../src/service-plugins/definitions.ts";

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
  const allowed = new Set(["@acedatacloud/openclaw-provider", ...SERVICE_PLUGINS.map(plugin => plugin.packageName)]);
  if (!allowed.has(pkg.name) || !/^(?:\d{4}\.\d+\.\d+|0\.\d+\.\d+)$/.test(pkg.version)) throw new Error("Unexpected release artifact identity");
  if (basename(path) !== `${pkg.name.slice(1).replace("/", "-")}-${pkg.version}.tgz`) throw new Error("Artifact filename differs from packed metadata");
  return { name: pkg.name, version: pkg.version, integrity: `sha512-${createHash("sha512").update(readFileSync(path)).digest("base64")}` };
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const directory = resolve(process.argv[2] ?? ".");
  const scope = process.env.NPM_RELEASE_SCOPE || "all";
  if (!["all", "acemusic", "provider"].includes(scope)) throw new Error("Unknown npm release scope");
  const serviceRoot = resolve(process.env.RELEASE_SERVICES_ROOT ?? "service-plugins");
  const expected = new Set(["@acedatacloud/openclaw-provider"]);
  for (const entry of readdirSync(serviceRoot, { withFileTypes: true })) {
    if (scope === "provider" || !entry.isDirectory() || (scope === "acemusic" && entry.name !== "acemusic")) continue;
    const metadata = JSON.parse(readFileSync(join(serviceRoot, entry.name, "package.json"), "utf8"));
    expected.add(metadata.name);
  }
  if (scope === "acemusic" && !expected.has("@acedatacloud/acemusic-openclaw")) throw new Error("This release has no ACE Music package");
  const files = [];
  const found = new Set();
  for (const file of readdirSync(directory).filter(name => /^acedatacloud-.*-([\d.]+)\.tgz$/.test(name)).sort()) {
    const { name } = inspectArtifact(join(directory, file));
    if (scope !== "all" && !expected.has(name)) continue;
    if (!expected.has(name) || found.has(name)) throw new Error("Unexpected or duplicate release package: " + name);
    found.add(name);
    files.push(file);
  }
  if (found.size !== expected.size) throw new Error("Missing release artifacts for the selected scope");
  if (process.argv[3] === "--stage") {
    const destination = resolve(process.argv[4]);
    mkdirSync(destination);
    for (const file of files) copyFileSync(join(directory, file), join(destination, file));
    process.exit(0);
  }
  if (!process.env.NODE_AUTH_TOKEN?.trim()) throw new Error("Existing npm publishing token is not configured");
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
