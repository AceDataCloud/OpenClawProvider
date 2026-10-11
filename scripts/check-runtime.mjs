import { readFileSync } from "node:fs";
const result = JSON.parse(readFileSync(process.argv[2], "utf8"));
const manifest = JSON.parse(readFileSync("openclaw.plugin.json", "utf8"));
const plugin = result.plugin;
if (plugin.status !== "loaded" || !plugin.providerIds.includes("acedatacloud") || result.diagnostics.length) throw new Error("Plugin did not load cleanly");
for (const [field, contract] of [
  ["toolNames", "tools"], ["imageGenerationProviderIds", "imageGenerationProviders"],
  ["videoGenerationProviderIds", "videoGenerationProviders"], ["musicGenerationProviderIds", "musicGenerationProviders"],
  ["speechProviderIds", "speechProviders"], ["webSearchProviderIds", "webSearchProviders"],
]) {
  const expected = [...manifest.contracts[contract]].sort(), actual = [...plugin[field]].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Missing runtime ${contract}: expected ${expected.length}, got ${actual.length}`);
}
console.log("Loaded all 97 tools and native image/video/music/speech/search providers.");
