// Check exact independently packed service artifacts. No credentials or paid calls.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SERVICE_PLUGINS } from "../src/service-plugins/definitions.ts";
const host = process.env.SERVICE_PLUGIN_HOST;
const channel = process.env.SERVICE_PLUGIN_CHANNEL ?? "local";
if (!["local", "clawhub", "npm"].includes(channel)) throw new Error("Unsupported service install channel");
const evidence = "service-plugin-proof"; mkdirSync(evidence, { recursive: true });
for (const def of SERVICE_PLUGINS) {
  const root = join(process.cwd(), "service-plugins", def.service);
  const manifest = JSON.parse(readFileSync(join(root, "openclaw.plugin.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (pkg.name !== def.packageName || manifest.id !== def.id) throw new Error("Service package identity drift");
  if (JSON.stringify(readdirSync(join(root, "dist/src/services/contracts"))) !== JSON.stringify([`${def.service}.json`])) throw new Error("Unrelated API contracts shipped");
  const entry = (await import(pathToFileURL(join(root, "index.js")).href)).default;
  if (entry.id !== def.id) throw new Error("Wrong service runtime entry");
  execFileSync("npm", ["pack", "--ignore-scripts", "--pack-destination", process.cwd()], { cwd: root, stdio: "inherit" });
  if (host) {
    const env = { ...process.env, OPENCLAW_HOME: join(process.env.RUNNER_TEMP, `home-${channel}-${def.service}`), OPENCLAW_STATE_DIR: join(process.env.RUNNER_TEMP, `state-${channel}-${def.service}`), OPENCLAW_CONFIG_PATH: join(process.env.RUNNER_TEMP, `state-${channel}-${def.service}/openclaw.json`) };
    const tar = join(process.cwd(), `acedatacloud-${def.service}-openclaw-${pkg.version}.tgz`);
    const run = args => execFileSync(process.execPath, [host, ...args], { env, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    const spec = channel === "clawhub" ? `clawhub:${pkg.name}` : channel === "npm" ? `npm:${pkg.name}@${pkg.version}` : `npm-pack:${tar}`;
    console.log(run(["plugins", "install", spec, ...(channel !== "clawhub" ? ["--force"] : []), "--accept-capabilities"]));
    if (channel === "clawhub") {
      const search = JSON.parse(run(["plugins", "search", def.label, "--json"]));
      if (!search.results.some(x => x.package.name === pkg.name)) throw new Error("Brand search did not find the published service plugin");
    }
    const result = JSON.parse(run(["plugins", "inspect", def.id, "--runtime", "--json"]));
    const actual = result.plugin;
    const installedPackage = JSON.parse(readFileSync(join(actual.rootDir, "package.json"), "utf8"));
    if (installedPackage.name !== pkg.name || (channel !== "clawhub" && installedPackage.version !== pkg.version)) throw new Error("Installed package identity/version mismatch");
    if (actual.status !== "loaded" || result.diagnostics.some(x => x.level === "error")) throw new Error(`${def.id} did not load`);
    for (const [field, contract] of [["toolNames", "tools"], [`${def.kind}GenerationProviderIds`, `${def.kind}GenerationProviders`]]) {
      if (JSON.stringify([...actual[field]].sort()) !== JSON.stringify([...manifest.contracts[contract]].sort())) throw new Error(`${def.id} runtime contract mismatch ${field}`);
    }
    if (actual.providerIds.length !== 1 || actual.providerIds[0] !== def.id) throw new Error("Unrelated auth provider registered");
    const models = JSON.parse(run(["models", "list", "--provider", def.id, "--all", "--json"]));
    // models list is the text-inference inventory; media discovery belongs to
    // the host native capability registration/manifest, not invented chat rows.
    if (models.models.some(x => !x.key.startsWith(def.id + "/"))) throw new Error("Unrelated chat models exposed by media-only package");
    writeFileSync(join(evidence, `${channel}-${def.service}.json`), JSON.stringify({ channel, package: pkg.name, version: installedPackage.version, candidateVersion: pkg.version, pluginId: def.id, status: actual.status, tools: actual.toolNames, textModels: models.models, nativeCapability: {kind:def.kind, providerId:def.id, contract:manifest.contracts[`${def.kind}GenerationProviders`]}, diagnostics: result.diagnostics, authenticatedApiCalls: 0, newGenerationCalls: 0 }, null, 2) + "\n");
  }
}
