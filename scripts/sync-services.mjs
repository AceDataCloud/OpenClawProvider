import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const services = readdirSync(`${root}src/services/contracts`).filter(f => f.endsWith(".json")).sort().map(f => JSON.parse(readFileSync(`${root}src/services/contracts/${f}`, "utf8")));
const manifestPath = `${root}openclaw.plugin.json`;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const image = ["nano-banana", "gpt-image", "seedream", "flux", "qwen-image", "midjourney"];
const video = ["seedance", "happyhorse", "grok", "kling", "veo", "minimax", "wan", "flux", "midjourney"];
const tools = services.flatMap(s => Object.keys(s.endpoints).filter(k => !k.includes(":" )).map(k => `acedata_${k}`));
if (new Set(tools).size !== tools.length || tools.length !== 97) throw new Error("Unexpected Dify operation coverage");
manifest.description = "Ace Data Cloud LLMs, Nano Banana, GPT Image, Seedream, Flux, Qwen Image, Midjourney, Seedance, Veo, Kling, Grok, Happy Horse, MiniMax, Wan, Suno, Fish Audio, Google Search and face tools.";
manifest.contracts = { ...manifest.contracts, imageGenerationProviders: image.map(s => `acedatacloud-${s}`), videoGenerationProviders: video.map(s => `acedatacloud-${s}`), musicGenerationProviders: ["acedatacloud-suno"], speechProviders: ["acedatacloud-fish-audio"], tools };
const metadata = id => ({ authProviders: ["acedatacloud"], configSignals: [{rootPath: `plugins.entries.acedatacloud.config.serviceCredentials.${id}`, required: ["apiKey"]}] });
manifest.imageGenerationProviderMetadata = Object.fromEntries(image.map(id => [`acedatacloud-${id}`, metadata(id)]));
manifest.videoGenerationProviderMetadata = Object.fromEntries(video.map(id => [`acedatacloud-${id}`, {...metadata(id), ...(["seedance", "minimax", "wan"].includes(id) ? {referenceAudioInputs:true} : {})}]));
manifest.musicGenerationProviderMetadata = {"acedatacloud-suno": metadata("suno")};
manifest.providerAuthAliases = Object.fromEntries([...new Set([...image, ...video, "suno", "fish-audio"])].map(id => [`acedatacloud-${id}`, "acedatacloud"]));
manifest.toolMetadata = Object.fromEntries(services.flatMap(service => Object.entries(service.endpoints).filter(([name]) => !name.includes(":" )).map(([name, e]) => [`acedata_${name}`, { optional: true, ...metadata(service.id), replaySafe: e.method === "GET" || e.read_only === true || ["task", "batch"].includes(e.operation), sideEffecting: !(e.method === "GET" || e.read_only === true || ["task", "batch"].includes(e.operation)) }])));
manifest.skills = ["./skills"];
manifest.configContracts = { ...manifest.configContracts, secretInputs: { paths: [
  { path: "webSearch.apiKey", expected: "string", ownerKind: "capability" },
  { path: "serviceCredentials.*.apiKey", expected: "string", ownerKind: "capability" },
] } };
manifest.configSchema.properties.serviceCredentials = { type: "object", additionalProperties: false, properties: Object.fromEntries(services.map(s => [s.id, { type: "object", additionalProperties: false, properties: { apiKey: { type: ["string", "object"] } } }])) };
for (const s of services) manifest.uiHints[`serviceCredentials.${s.id}.apiKey`] = { label: `${s.label} API key (optional override)`, sensitive: true, help: "Uses your Ace Data Cloud provider credential when omitted. Use a scoped key to restrict this service." };
const rendered = JSON.stringify(manifest, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(manifestPath, "utf8") !== rendered) throw new Error("Service manifest is stale; run pnpm sync-services");
} else writeFileSync(manifestPath, rendered);
console.log(`Verified ${services.length} services / ${tools.length} optional tools and native media contracts.`);
