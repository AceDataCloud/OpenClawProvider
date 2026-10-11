import type { Endpoint } from "./catalog.js";

type Values = Record<string, unknown>;
function required(body: Values, fields: string[]): void {
  if (fields.some(k => body[k] === undefined || body[k] === "" || body[k] === null))
    throw new Error(`Required inputs: ${fields.join(", ")}`);
}

/** Service-specific aliases from the reviewed Dify contracts; no model substitution. */
export function adaptParameters(service: string, params: Values, endpoint: Endpoint): Values {
  const p = { ...params };
  if (service === "gpt-image") {
    if (p.count !== undefined) { p.n = p.count; delete p.count; }
    if (p.image_urls !== undefined) {
      const images = p.image_urls;
      p.image = typeof images === "string" && !images.startsWith("data:") ? images.trim().startsWith("[") ? JSON.parse(images) : images.split("\n").filter(Boolean) : images;
      delete p.image_urls;
    }
  }
  if (service === "fish-audio" && endpoint.method === "GET" && endpoint.path === "/fish/model") {
    if (p.query !== undefined) { p.title = p.query; delete p.query; }
    if (p.limit !== undefined) { p.page_size = p.limit; delete p.limit; }
  }
  if (service === "seedream") {
    if (p.image_urls !== undefined && p.image === undefined) { p.image = p.image_urls; delete p.image_urls; }
    if (p.max_images !== undefined) { p.sequential_image_generation_options = { max_images: p.max_images }; delete p.max_images; }
    if (p.optimize_prompt_mode) { p.optimize_prompt_options = { mode: p.optimize_prompt_mode }; delete p.optimize_prompt_mode; }
    if (p.web_search) { p.tools = [{ type: "web_search" }]; delete p.web_search; }
  }
  if (service === "happyhorse" && endpoint.path.endsWith("/videos") && !p.model) {
    const models: Record<string, string> = { generate: "happyhorse-1.1-t2v", image_to_video: "happyhorse-1.1-i2v", reference_to_video: "happyhorse-1.1-r2v", video_edit: "happyhorse-1.0-video-edit" };
    p.model = models[String(p.action ?? "generate")];
  }
  if (service === "seedance" && endpoint.path.endsWith("/videos")) {
    if (p.camera_fixed !== undefined) { p.camerafixed = p.camera_fixed; delete p.camera_fixed; }
    if (p.image_url && !p.first_frame_url) { p.first_frame_url = p.image_url; delete p.image_url; }
    const helpers = ["prompt", "first_frame_url", "last_frame_url", "reference_image_urls", "reference_audio_urls", "reference_video_urls"];
    if (p.content && helpers.some(k => p[k])) throw new Error("Use content or prompt/reference shortcuts, not both.");
    if (!p.content) {
      const content: Values[] = [];
      if (p.prompt) content.push({ type: "text", text: p.prompt });
      for (const [key, type, role, many] of [
        ["first_frame_url", "image_url", "first_frame", false], ["last_frame_url", "image_url", "last_frame", false],
        ["reference_image_urls", "image_url", "reference_image", true], ["reference_audio_urls", "audio_url", "reference_audio", true], ["reference_video_urls", "video_url", "reference_video", true],
      ] as const) {
        if (!p[key]) continue;
        let urls = p[key];
        if (many && typeof urls === "string") urls = urls.trim().startsWith("[") ? JSON.parse(urls) : urls.split("\n").filter(Boolean);
        if (many && !Array.isArray(urls)) throw new Error(`${key} must be an array.`);
        for (const url of many ? urls as unknown[] : [urls]) content.push({ type, role, [type]: { url } });
      }
      if (!content.length) throw new Error("A prompt or reference content is required.");
      p.content = content;
    }
    for (const k of helpers) delete p[k];
    if (p.frames !== undefined && p.duration !== undefined) throw new Error("Use frames or duration, not both.");
  }
  return p;
}

export function finalizePayload(service: string, body: Values, endpoint: Endpoint): Values {
  if (["nano-banana", "gpt-image"].includes(service) && endpoint.operation === "edit")
    required(body, [service === "nano-banana" ? "image_urls" : "image"]);
  if (service === "flux" && endpoint.path.endsWith("/images")) {
    if (endpoint.operation === "edit") {
      required(body, ["image_url"]);
      if (!["flux-kontext-pro", "flux-kontext-max"].includes(String(body.model))) throw new Error("Editing requires a Kontext model.");
    }
    if (String(body.model).startsWith("flux-kontext") && !["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"].includes(String(body.size))) throw new Error("Kontext size must be an aspect ratio.");
  }
  if (service === "seedance" && body.frames !== undefined) delete body.duration;
  if (service === "seedream" && endpoint.path.endsWith("/images")) {
    if (["edit", "decompose"].includes(endpoint.operation)) required(body, ["image"]);
    if (endpoint.operation !== "decompose") required(body, ["prompt"]);
    if (body.model === "doubao-seedream-5-0-pro-260628") {
      delete body.stream;
      if ((Array.isArray(body.image) ? body.image : body.image ? [body.image] : []).length > 10) throw new Error("Seedream Pro accepts at most 10 input images.");
      if (body.sequential_image_generation === "auto" || body.tools) throw new Error("Sequential generation and search require a supporting Lite model.");
    } else if (body.background || body.layer_decomposition) throw new Error("Layer decomposition and background control require Seedream 5.0 Pro.");
    if (body.layer_decomposition && body.background) throw new Error("Layer decomposition and background control cannot be combined.");
    if (body.background === "transparent") body.output_format = "png";
  }
  if (service === "happyhorse" && endpoint.path.endsWith("/videos")) {
    const action = String(body.action ?? "generate");
    const modes: Record<string, [string, string[]]> = { generate: ["t2v", ["prompt"]], image_to_video: ["i2v", ["image_url"]], reference_to_video: ["r2v", ["prompt", "image_urls"]], video_edit: ["video-edit", ["prompt", "video_url"]] };
    const mode = modes[action];
    if (!mode || !String(body.model).endsWith(mode[0])) throw new Error("Select a Happy Horse model matching the action.");
    required(body, mode[1]);
    if (["image_to_video", "video_edit"].includes(action)) delete body.ratio;
    if (action === "video_edit") delete body.duration;
  }
  if (service === "kling" && endpoint.path === "/kling/videos") {
    if (body.action === "text2video") required(body, ["prompt"]);
    if (body.action === "image2video" && !body.start_image_url && !body.image_list) throw new Error("Image-to-video requires a first frame or image list.");
    if (body.action === "extend") required(body, ["video_id"]);
  }
  if (service === "minimax" && body.resolution === "480P") throw new Error("MiniMax H3 supports 768P and 2K.");
  if (service === "suno" && endpoint.path === "/suno/audios") {
    const action = String(body.action ?? "generate");
    if (action === "generate") {
      if (body.custom && !body.instrumental && !body.lyric && !body.lyric_prompt) throw new Error("Custom vocal music requires lyrics or a lyric prompt.");
      if (!body.custom) required(body, ["prompt"]);
    }
    const needs: Record<string, string[]> = { extend: ["audio_id", "continue_at"], upload_extend: ["audio_id", "continue_at"], cover: ["audio_id"], concat: ["audio_id"], upload_cover: ["audio_id"], artist_consistency: ["persona_id"], artist_consistency_vox: ["persona_id"], remaster: ["audio_id"], stems: ["audio_id"], all_stems: ["audio_id"], add_stem: ["audio_id"], extract_stem: ["audio_id"], mashup: ["mashup_audio_ids"], sounds: ["sound"], adjust_speed: ["audio_id", "speed_multiplier"] };
    required(body, needs[action] ?? []);
    for (const prefix of ["replace_section", "underpainting", "overpainting", "samples"]) {
      if (action === prefix) required(body, ["audio_id", `${prefix}_start`, `${prefix}_end`]);
      if (body[`${prefix}_start`] !== undefined && body[`${prefix}_end`] !== undefined && Number(body[`${prefix}_end`]) <= Number(body[`${prefix}_start`])) throw new Error(`${prefix}_end must exceed its start.`);
    }
  }
  return body;
}
