// Verify the installed public package, independently of the PR's local build.
// This has no API key and never submits an inference or media request.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const evidenceDir = process.argv[2];
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const runtime = readJson(join(evidenceDir, "runtime.json"));
const plugin = runtime.plugin;
const pkg = readJson(join(plugin.rootDir, "package.json"));
const manifestPath = join(plugin.rootDir, "openclaw.plugin.json");
const manifest = readJson(manifestPath);
const expectedVersion = process.env.PUBLISHED_VERSION;
if (pkg.name !== "@acedatacloud/openclaw-provider" || pkg.version !== expectedVersion || plugin.packageVersion !== expectedVersion) {
  throw new Error("The host did not load the requested published release");
}
execFileSync(process.execPath, ["scripts/check-runtime.mjs", join(evidenceDir, "runtime.json"), manifestPath, "--allow-community-provenance-warning"], { stdio: "inherit" });
const expectedModels = manifest.modelCatalog.providers.acedatacloud.models.map(model => `acedatacloud/${model.id}`).sort();
const actualModels = readJson(join(evidenceDir, "models.json")).models.map(model => model.key).sort();
if (JSON.stringify(expectedModels) !== JSON.stringify(actualModels)) throw new Error("Public install model catalog differs from its manifest");
const search = readJson(join(evidenceDir, "search.json"));
if (!search.results.some(result => result.package.name === pkg.name)) throw new Error("Published plugin is not discoverable in the host search");
const proof = {
  checkedAt: new Date().toISOString(), channel: process.env.INSTALL_CHANNEL,
  package: pkg.name, version: pkg.version, hostVersion: readFileSync(join(evidenceDir, "host-version.txt"), "utf8").trim(),
  modelCount: actualModels.length, toolCount: plugin.toolNames.length,
  status: plugin.status, trust: plugin.trust, diagnostics: runtime.diagnostics, authenticatedApiCalls: 0, newGenerationCalls: 0,
};
writeFileSync(join(evidenceDir, "public-install-proof.json"), JSON.stringify(proof, null, 2) + "\n");
console.log(JSON.stringify(proof));
