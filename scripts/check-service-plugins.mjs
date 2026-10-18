// Check exact independently packed service artifacts. No credentials or paid calls.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SERVICE_PLUGINS } from "../src/service-plugins/definitions.ts";
const host = process.env.SERVICE_PLUGIN_HOST;
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
    const env = { ...process.env, OPENCLAW_HOME: join(process.env.RUNNER_TEMP, `home-${def.service}`), OPENCLAW_STATE_DIR: join(process.env.RUNNER_TEMP, `state-${def.service}`), OPENCLAW_CONFIG_PATH: join(process.env.RUNNER_TEMP, `state-${def.service}/openclaw.json`) };
    const tar = join(process.cwd(), `acedatacloud-${def.service}-openclaw-${pkg.version}.tgz`);
    const run = args => execFileSync(process.execPath, [host, ...args], { env, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    console.log(run(["plugins", "install", `npm-pack:${tar}`, "--force", "--accept-capabilities"]));
    const result = JSON.parse(run(["plugins", "inspect", def.id, "--runtime", "--json"]));
    const actual = result.plugin;
    if (actual.status !== "loaded" || result.diagnostics.some(x => x.level === "error")) throw new Error(`${def.id} did not load`);
    for (const [field, contract] of [["toolNames", "tools"], [`${def.kind}GenerationProviderIds`, `${def.kind}GenerationProviders`]]) {
      if (JSON.stringify([...actual[field]].sort()) !== JSON.stringify([...manifest.contracts[contract]].sort())) throw new Error(`${def.id} runtime contract mismatch ${field}`);
    }
    if (actual.providerIds.length !== 1 || actual.providerIds[0] !== def.id) throw new Error("Unrelated auth provider registered");
    const models = JSON.parse(run(["models", "list", "--provider", def.id, "--all", "--json"]));
    if (!models.models.length || models.models.some(x => !x.key.startsWith(def.id + "/"))) throw new Error("Service models not discoverable");
    writeFileSync(join(evidence, `${def.service}.json`), JSON.stringify({ package: pkg.name, version: pkg.version, pluginId: def.id, status: actual.status, tools: actual.toolNames, models: models.models, diagnostics: result.diagnostics, authenticatedApiCalls: 0, newGenerationCalls: 0 }, null, 2) + "\n");
  }
}
