import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { SERVICES, serviceById } from "../src/services/catalog.js";
import { ServiceClient, cleanResult, normalize, prepare } from "../src/services/client.js";
import { IMAGE_OPERATIONS, VIDEO_OPERATIONS, mapImageRequest, mapVideoRequest, operationModels } from "../src/services/media.js";
import { toolSchema } from "../src/services/tools.js";

type Example = { service: string; name: string; tool: string; inputs: Record<string, unknown>; method?: string; path?: string; body?: Record<string, unknown>; query?: Record<string, unknown>; headers?: Record<string, string>; read_only?: boolean; error?: string; body_absent?: string[] };
const examples: Example[] = JSON.parse(readFileSync(new URL("./service-contract-examples.json", import.meta.url), "utf8"));
describe("independent Dify contract parity", () => {
  for (const example of examples) it(`${example.service}: ${example.name}`, () => {
    const run = () => prepare(serviceById(example.service), example.tool, example.inputs);
    if (example.error) { expect(run).toThrow(); return; }
    const req = run();
    if (example.method) expect(req.method).toBe(example.method);
    if (example.path) expect(req.path).toBe(example.path);
    if (example.body) expect(req.body).toMatchObject(example.body);
    if (example.query) expect(req.query).toMatchObject(example.query);
    if (example.headers) expect(req.headers).toMatchObject(example.headers);
    if (example.read_only !== undefined) expect(req.readOnly).toBe(example.read_only);
    for (const key of example.body_absent ?? []) expect(req.body).not.toHaveProperty(key);
  });
  it("keeps 17 services, 97 named optional tools and native capability ownership discoverable", () => {
    const manifest = JSON.parse(readFileSync(new URL("../openclaw.plugin.json", import.meta.url), "utf8"));
    expect(SERVICES).toHaveLength(17);
    const names = SERVICES.flatMap(s => Object.keys(s.endpoints).filter(k => !k.includes(":"))).map(n => `acedata_${n}`);
    expect(names).toHaveLength(97); expect(new Set(names).size).toBe(97);
    expect(manifest.contracts.tools).toEqual(names);
    for (const name of names) expect(manifest.toolMetadata[name].optional).toBe(true);
    expect(manifest.contracts.imageGenerationProviders).toHaveLength(6);
    expect(manifest.contracts.videoGenerationProviders).toHaveLength(9);
    for (const service of SERVICES) for (const endpoint of Object.values(service.endpoints)) expect(toolSchema(endpoint).type).toBe("object");
  });
});
describe("task settlement and transport", () => {
  it("does not confuse an accepted task or unfinished thumbnail with completion", () => {
    expect(normalize({ task_id: "owned" }, "", false, false).status).toBe("pending");
    expect(normalize({ id: "owned", finished_at: null, response: { data: [{ image_url: "https://example.org/preview.png" }] } }, "owned", true).status).toBe("pending");
    expect(normalize({ finished_at: "now", response: { success: true, data: [{ image_url: "https://example.org/final.png" }] } }, "owned", true).success).toBe(true);
    expect(() => normalize({ task_id: "owned", status: "failed" }, "", false, false)).toThrow("owned");
  });
  it("removes secrets and internal route data recursively", () => {
    expect(cleanResult({ request: { authorization: "secret" }, data: { upstream_model: "hidden", url: "https://example.org/image.png" } })).toEqual({ data: { url: "https://example.org/image.png" } });
  });
  it("does not retry a chargeable creation request on transport failure", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("private response"));
    await expect(new ServiceClient("test-key", fetchFn).invoke(serviceById("nano-banana"), "nano_banana_generate_image", { prompt: "test" })).rejects.toThrow("Inspect task/request history");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it("uses the same task when polling and never leaks auth through a redirect", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "owned", finished_at: "now", response: { data: [{ image_url: "https://example.org/result.png" }] } })));
    const result = await new ServiceClient("test-key", fetchFn).invoke(serviceById("nano-banana"), "nano_banana_task_retrieve", { task_id: "owned" });
    expect(result.success).toBe(true);
    expect(fetchFn.mock.calls[0][1].redirect).toBe("error");
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ action: "retrieve", id: "owned" });
  });
});
describe("native media request mapping", () => {
  for (const [id, [op]] of Object.entries(IMAGE_OPERATIONS)) it(`validates native ${id} generation without losing host options`, () => {
    const endpoint = serviceById(id).endpoints[op];
    const model = String(endpoint.defaults?.model ?? operationModels(endpoint)[0]);
    const request = mapImageRequest(id, { provider: `acedatacloud-${id}`, model, cfg: {}, prompt: "test", count: 1 });
    expect(prepare(serviceById(id), request.tool, request.params).path).toBe(endpoint.path);
  });
  for (const [id, op] of Object.entries(VIDEO_OPERATIONS)) it(`validates native ${id} text generation`, () => {
    const endpoint = serviceById(id).endpoints[op];
    const model = String(endpoint.defaults?.model ?? operationModels(endpoint).find(m => m.endsWith("-t2v")) ?? operationModels(endpoint)[0]);
    const request = mapVideoRequest(id, { provider: `acedatacloud-${id}`, model, cfg: {}, prompt: "test" });
    expect(prepare(serviceById(id), request.tool, request.params).path).toBe(endpoint.path);
  });
  it("keeps Nano Banana edit inputs and the exact selected model", () => {
    const req = mapImageRequest("nano-banana", { provider: "acedatacloud-nano-banana", model: "nano-banana-2.1", cfg: {}, prompt: "edit", inputImages: [{ buffer: Buffer.from("image"), mimeType: "image/png" }] });
    const prepared = prepare(serviceById("nano-banana"), req.tool, req.params);
    expect(prepared.body).toMatchObject({ action: "edit", model: "nano-banana-2.1", image_urls: ["data:image/png;base64,aW1hZ2U="] });
  });
  it("maps Seedance typed reference roles to the API content array", () => {
    const req = mapVideoRequest("seedance", { provider: "acedatacloud-seedance", model: "doubao-seedance-2-0-mini-260615", prompt: "animate", cfg: {}, inputImages: [{ url: "https://example.org/image.png", role: "first_frame" }] });
    expect(prepare(serviceById("seedance"), req.tool, req.params).body.content).toEqual([{ type: "text", text: "animate" }, { type: "image_url", role: "first_frame", image_url: { url: "https://example.org/image.png" } }]);
  });
});
