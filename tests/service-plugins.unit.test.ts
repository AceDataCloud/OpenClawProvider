import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import aggregate from "../index.js";
import { SERVICE_PLUGINS } from "../src/service-plugins/definitions.js";
import { createServicePlugin, applyServiceConfig, resolveStandaloneKey } from "../src/service-plugins/entry.js";
import { serviceById } from "../src/services/catalog.js";

function registry() {
  const rows = { provider: [] as any[], image: [] as any[], video: [] as any[], music: [] as any[], speech: [] as any[], search: [] as any[], tools: [] as any[], catalogs: [] as any[] };
  const resolve = vi.fn().mockResolvedValue({ apiKey: "test-scoped-key" });
  const api = new Proxy({
    runtime: { modelAuth: { resolveApiKeyForProvider: resolve } },
    registerProvider: (x: any) => rows.provider.push(x), registerImageGenerationProvider: (x: any) => rows.image.push(x),
    registerVideoGenerationProvider: (x: any) => rows.video.push(x), registerMusicGenerationProvider: (x: any) => rows.music.push(x),
    registerSpeechProvider: (x: any) => rows.speech.push(x), registerWebSearchProvider: (x: any) => rows.search.push(x),
    registerTool: (factory: any, options: any) => rows.tools.push({ factory, ...options }),
    registerModelCatalogProvider: (x: any) => rows.catalogs.push(x),
  }, { get: (target, key) => (target as any)[key] ?? (() => {}) });
  return { rows, api: api as unknown as OpenClawPluginApi, resolve };
}
describe("independent service plugins", () => {
  for (const def of SERVICE_PLUGINS) {
    it(`${def.label} registers exactly its native capability and owned optional tools`, () => {
      const { rows, api } = registry(); const plugin = createServicePlugin(def); plugin.register!(api);
      const manifest = JSON.parse(readFileSync(new URL(`../service-plugins/${def.service}/openclaw.plugin.json`, import.meta.url), "utf8"));
      expect(rows.provider.map(x => x.id)).toEqual([def.id]);
      expect([...rows.image, ...rows.video, ...rows.music].map(x => x.id)).toEqual([def.id]);
      expect(rows[def.kind]).toHaveLength(1); expect(rows.speech).toHaveLength(0); expect(rows.search).toHaveLength(0);
      expect(rows.tools.map(x => x.name)).toEqual(manifest.contracts.tools);
      expect(rows.tools.every(x => x.optional)).toBe(true);
      const names = Object.keys(serviceById(def.service).endpoints).filter(name => !name.includes(":"));
      expect(rows.tools.map(x => x.name)).toEqual(names.map(name => `ace_service_${name}`));
      expect(manifest.name).toBe(`${def.label} by Ace Data Cloud`);
      expect(rows.catalogs[0].staticCatalog().every((x: any) => x.provider === def.id && x.authEnvVars.includes(def.envVar))).toBe(true);
      expect(manifest.providerAuthChoices[0].optionKey).toBe(manifest.providerAuthChoices[0].cliFlag.slice(2).replace(/-([a-z])/g, (_m: string, c: string) => c.toUpperCase()));
      const config = { agents: { defaults: { model: { primary: "other/chat" }, mediaModels: { [def.kind]: { primary: "other/media" } } } } };
      expect(applyServiceConfig(def, config)).toBe(config);
      expect(applyServiceConfig(def, {}).agents?.defaults?.mediaModels?.[def.kind]?.primary).toBe(`${def.id}/${def.model}`);
      expect((serviceById(def.service).endpoints[def.action].properties.model.enum as string[])).toContain(def.model);
    });
    it(`${def.label} resolves only its scoped key/profile and fails closed for unresolved overrides`, async () => {
      const { api, resolve } = registry();
      expect(await resolveStandaloneKey(def, api, {plugins:{entries:{[def.id]:{config:{apiKey:"own-key"}}}}})).toBe("own-key");
      expect(resolve).not.toHaveBeenCalled();
      expect(await resolveStandaloneKey(def, api, {})).toBe("test-scoped-key");
      expect(resolve).toHaveBeenCalledWith({ provider: def.id, cfg: {} });
      await expect(resolveStandaloneKey(def, api, {plugins:{entries:{[def.id]:{config:{apiKey:""}}}}})).rejects.toThrow("unresolved or empty");
    });
  }
  it("coexists with the collection and all five standalone service packages", () => {
    const { rows, api } = registry(); aggregate.register!(api);
    for (const def of SERVICE_PLUGINS) createServicePlugin(def).register!(api);
    for (const list of [rows.provider, rows.image, rows.video, rows.music, rows.tools.map(x => ({id:x.name}))]) {
      expect(new Set(list.map(x => x.id)).size).toBe(list.length);
    }
  });
  it("retrieval from an independent tool queries the same task once using its own key", async () => {
    const def = SERVICE_PLUGINS[0]; const { rows, api } = registry(); createServicePlugin(def).register!(api);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "old-task", finished_at: "now", response: { success:true,data:[{audio_url:"https://example.org/song.mp3"}] } })));
    vi.stubGlobal("fetch",fetchMock);
    try {
      const tool = rows.tools.find(x=>x.name==="ace_service_suno_task_retrieve").factory({config:{},resolveApiKeyForProvider:vi.fn(()=>{throw new Error("must not use collection auth");})});
      const result = await tool.execute("call",{task_id:"old-task",wait_seconds:0});
      expect(result.details.success).toBe(true);expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({action:"retrieve",id:"old-task"});
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-scoped-key");
    } finally { vi.unstubAllGlobals(); }
  });
});
