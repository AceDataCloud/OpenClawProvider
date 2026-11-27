import { expect, it, vi } from "vitest";
import { serviceById } from "../src/services/catalog.js";
import { prepare, ServiceClient } from "../src/services/client.js";

const service = serviceById("tripo");
const id = "40000000-0000-4000-8000-000000000001";
it("preserves Tripo multi-view slots, retry keys and action-specific inputs", () => {
  const request = prepare(service, "tripo_generate", {image_urls:["https://example.org/front.png", null, "https://example.org/back.png"], idempotency_key:"one"});
  expect(request.body).toEqual({action:"generate", async:true, image_urls:["https://example.org/front.png", null, "https://example.org/back.png"]});
  expect(request.headers["Idempotency-Key"]).toBe("one");
  expect(prepare(service, "tripo_import", {model_url:"https://example.org/file.glb"}).body).toEqual({action:"import", async:true, model_url:"https://example.org/file.glb"});
});
it("returns the model download from a completed task", async () => {
  const url = "https://cdn.acedata2.cloud/tripo/asset.glb";
  const request = vi.fn(async () => Response.json({id, finished_at:10, response:{success:true, data:[{model_url:url,format:"GLB"}]}}));
  const result = await new ServiceClient("token", request).invoke(service, "tripo_retrieve", {id});
  expect(result.status).toBe("succeeded");
  expect(result.media_urls).toContain(url);
});
