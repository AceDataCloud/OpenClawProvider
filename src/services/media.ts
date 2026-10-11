import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { fetchWithSsrFGuard } from "openclaw/plugin-sdk/ssrf-runtime";
import { isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { serviceById, type Endpoint } from "./catalog.js";
import { ServiceClient, readLimited, record } from "./client.js";
import { resolveServiceKey } from "./tools.js";

type ImageProvider = Parameters<OpenClawPluginApi["registerImageGenerationProvider"]>[0];
type VideoProvider = Parameters<OpenClawPluginApi["registerVideoGenerationProvider"]>[0];
type MusicProvider = Parameters<OpenClawPluginApi["registerMusicGenerationProvider"]>[0];
type ImageRequest = Parameters<ImageProvider["generateImage"]>[0];
type VideoRequest = Parameters<VideoProvider["generateVideo"]>[0];
type Values = Record<string, unknown>;
function configured(service: string, cfg?: ImageRequest["cfg"], agentDir?: string): boolean {
  return !!record(record(record(cfg?.plugins?.entries?.acedatacloud?.config).serviceCredentials)[service]).apiKey || !!cfg?.models?.providers?.acedatacloud?.apiKey || !!(process.env.ACEDATA_API_KEY || process.env.ACEDATACLOUD_API_KEY) || isProviderApiKeyConfigured({ provider: "acedatacloud", agentDir });
}
export const IMAGE_OPERATIONS: Record<string, [string, string | null]> = {
  "nano-banana": ["nano_banana_generate_image", "nano_banana_edit_image"],
  "gpt-image": ["gpt_image_generate_image", "gpt_image_edit_image"],
  seedream: ["seedream_generate_image", "seedream_edit_image"],
  flux: ["flux_generate_image", "flux_edit_image"],
  "qwen-image": ["qwen_image", "qwen_image"],
  midjourney: ["midjourney_imagine", "midjourney_edits"],
};
export const VIDEO_OPERATIONS: Record<string, string> = {
  seedance: "seedance_generate_video", happyhorse: "happyhorse_generate_video", grok: "grok_generate_video",
  kling: "kling_generate_video", veo: "veo_generate_video", minimax: "minimax_generate_video",
  wan: "wan_generate_video", flux: "flux_generate_video", midjourney: "midjourney_videos",
};
export const providerId = (service: string): string => `acedatacloud-${service}`;
export function operationModels(endpoint: Endpoint): string[] {
  const models = endpoint.properties.model?.enum;
  if (Array.isArray(models)) return models.filter((m): m is string => typeof m === "string");
  if (endpoint.path.startsWith("/midjourney/")) return endpoint.path.endsWith("/videos") ? ["midjourney-video"] : ["midjourney"];
  return [];
}
function catalog(api: OpenClawPluginApi, provider: string, kind: "image_generation" | "video_generation" | "music_generation" | "voice", models: readonly string[], label: string, capabilities?: unknown): void {
  api.registerModelCatalogProvider({ provider, kinds: [kind], staticCatalog: () => models.map(model => ({ kind, provider, model, label: `${label} / ${model}`, source: "static", capabilities, authEnvVars: ["ACEDATA_API_KEY", "ACEDATACLOUD_API_KEY"] })) });
}
function exactModel(endpoint: Endpoint, model: string): void {
  if (!operationModels(endpoint).includes(model)) throw new Error(`Unsupported model for ${endpoint.path}: ${model}`);
}
function dataUrl(image: { buffer: Buffer; mimeType: string }): string {
  if (!image.buffer.length || image.buffer.length > 10 * 1024 * 1024 || !/^image\/(png|jpeg|webp)$/.test(image.mimeType)) throw new Error("Input images must be PNG/JPEG/WebP and at most 10 MiB.");
  return `data:${image.mimeType};base64,${image.buffer.toString("base64")}`;
}
function assetUrl(asset: { url?: string; buffer?: Buffer; mimeType?: string }): string {
  if (asset.url) { if (!asset.url.startsWith("https://")) throw new Error("Use HTTPS reference media URLs."); return asset.url; }
  if (asset.buffer && asset.mimeType?.startsWith("image/")) return dataUrl({ buffer: asset.buffer, mimeType: asset.mimeType });
  throw new Error("This API requires an HTTPS reference URL for video/audio assets.");
}
export async function downloadAsset(url: string, kind: "image" | "audio", timeoutMs = 60_000): Promise<{ buffer: Buffer; mimeType: string }> {
  // Never send the service credential to a returned media URL. DNS pinning and
  // redirect validation stay in the host's public SSRF guard.
  const { response, release } = await fetchWithSsrFGuard({ url, requireHttps: true, maxRedirects: 3, timeoutMs, auditContext: `acedatacloud-${kind}-result` });
  try {
    if (!response.ok) throw new Error(`Generated media download HTTP ${response.status}.`);
    const buffer = await readLimited(response, kind === "image" ? 30 * 1024 * 1024 : 100 * 1024 * 1024);
    const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!buffer.length || !mimeType.startsWith(`${kind}/`)) throw new Error(`Generated result is not a nonempty ${kind} asset.`);
    return { buffer, mimeType };
  } finally { await release(); }
}
export function mapImageRequest(service: string, req: ImageRequest): { tool: string; params: Values } {
  const [generate, edit] = IMAGE_OPERATIONS[service]; const hasImages = !!req.inputImages?.length;
  const tool = hasImages ? edit : generate;
  if (!tool) throw new Error("This model has no native image edit operation.");
  const endpoint = serviceById(service).endpoints[tool]; exactModel(endpoint, req.model);
  if (hasImages && service === "gpt-image" && req.model.startsWith("dall-e")) throw new Error("DALL-E editing is not supported by this native endpoint.");
  if (service === "gpt-image" && req.model === "dall-e-3" && (req.count ?? 1) !== 1) throw new Error("DALL-E 3 generates one image per request.");
  if (service === "flux" && req.model.startsWith("flux-kontext") && req.size && !req.size.includes(":")) throw new Error("Kontext size must be an aspect ratio.");
  const params: Values = { ...record(req.providerOptions?.acedatacloud), model: req.model, prompt: req.prompt };
  if (service === "flux" && req.model.startsWith("flux-kontext")) params.size = "1:1";
  const images = req.inputImages?.map(dataUrl);
  if (req.count !== undefined && service !== "seedream" && service !== "midjourney") params[["gpt-image", "qwen-image"].includes(service) ? "n" : "count"] = req.count;
  if (images) {
    if (service === "flux" || service === "midjourney") { if (images.length !== 1) throw new Error("This edit operation accepts one image."); params.image_url = images[0]; }
    else params[["gpt-image", "seedream"].includes(service) ? "image" : "image_urls"] = images;
  }
  if (req.size) params.size = service === "qwen-image" ? req.size.replace("x", "*") : req.size;
  if (req.aspectRatio) params[service === "flux" ? "size" : "aspect_ratio"] = req.aspectRatio;
  if (req.resolution) params[service === "seedream" ? "size" : "resolution"] = req.resolution;
  if (req.quality) params.quality = req.quality;
  if (req.outputFormat) params.output_format = req.outputFormat;
  if (req.background) params.background = req.background;
  if (service === "seedream" && req.count && req.count > 1) { params.sequential_image_generation = "auto"; params.sequential_image_generation_options = { max_images: req.count }; delete params.count; }
  if (service === "midjourney") { delete params.model; delete params.count; }
  return { tool, params };
}
export function mapVideoRequest(service: string, req: VideoRequest): { tool: string; params: Values } {
  const tool = VIDEO_OPERATIONS[service]; const endpoint = serviceById(service).endpoints[tool]; exactModel(endpoint, req.model);
  const params: Values = { ...req.providerOptions, model: req.model, prompt: req.prompt };
  const images = req.inputImages?.map(assetUrl) ?? [], videos = req.inputVideos?.map(assetUrl) ?? [], audios = req.inputAudios?.map(assetUrl) ?? [];
  if (videos.length && !["seedance", "minimax", "happyhorse", "wan", "flux"].includes(service)) throw new Error("Use the dedicated service edit/extend tool for this video operation.");
  if (audios.length && !["seedance", "minimax", "wan"].includes(service)) throw new Error("This native video operation does not accept reference audio.");
  const maxImages = service === "veo" ? req.model.endsWith("-ingredients") ? 3 : 2 : ["kling", "flux", "midjourney"].includes(service) ? 2 : ["seedance", "minimax", "grok"].includes(service) ? 9 : service === "wan" && req.model === "wan3.0-video" ? 10 : service === "happyhorse" && req.model.endsWith("-r2v") ? 9 : 1;
  if (images.length > maxImages || videos.length > (service === "wan" && req.model === "wan3.0-video" ? 5 : 1)) throw new Error("Too many reference assets for this native operation.");
  if (service === "veo" && req.model.endsWith("-ingredients") && !images.length) throw new Error("Veo ingredients requires reference images.");
  if (service === "midjourney" && !images.length) throw new Error("Midjourney video requires an input image.");
  if (service === "seedance" && req.model.includes("lite-i2v") && !images.length) throw new Error("The selected Seedance model requires an input image.");
  if (service === "seedance" && req.model.includes("lite-t2v") && images.length) throw new Error("The selected Seedance model only supports text-to-video.");
  if (service === "wan" && req.model !== "wan3.0-video") {
    if (req.model.includes("-i2v") && !images.length) throw new Error("The selected Wan model requires an input image.");
    if (req.model.endsWith("-r2v") && !videos.length) throw new Error("The selected Wan model requires reference video.");
    if (req.model.endsWith("-t2v") && (images.length || videos.length)) throw new Error("The selected Wan model supports text-to-video only.");
    if (req.durationSeconds !== undefined && ![5, 10, 15].includes(req.durationSeconds)) throw new Error("Wan 2.6 supports 5, 10 or 15 seconds.");
  }
  if (req.durationSeconds !== undefined) params.duration = req.durationSeconds;
  if (req.aspectRatio) params[["seedance", "happyhorse", "minimax", "wan"].includes(service) ? "ratio" : "aspect_ratio"] = req.aspectRatio;
  if (req.resolution) params.resolution = ["seedance", "grok", "veo"].includes(service) ? req.resolution.toLowerCase() : req.resolution;
  if (req.size) params.size = req.size;
  if (req.audio !== undefined) params[service === "wan" ? "audio" : "generate_audio"] = req.audio;
  if (req.watermark !== undefined) params.watermark = req.watermark;
  if (["seedance", "minimax"].includes(service)) {
    const content: Values[] = req.prompt ? [{ type: "text", text: req.prompt }] : [];
    for (const [assets, type, role] of [[req.inputImages ?? [], "image_url", "first_frame"], [req.inputVideos ?? [], "video_url", "reference_video"], [req.inputAudios ?? [], "audio_url", "reference_audio"]] as const)
      for (const a of assets) content.push({ type, role: a.role ?? role, [type]: { url: assetUrl(a) } });
    params.content = content; delete params.prompt;
  } else if (service === "happyhorse") {
    if (req.model.endsWith("-video-edit")) { params.action = "video_edit"; params.video_url = videos[0]; }
    else if (req.model.endsWith("-r2v")) { params.action = "reference_to_video"; params.image_urls = images; }
    else if (req.model.endsWith("-i2v")) { params.action = "image_to_video"; params.image_url = images[0]; }
    else { if (images.length || videos.length) throw new Error("Select a Happy Horse model matching the input mode."); params.action = "generate"; }
  } else if (service === "kling") {
    params.action = images.length ? "image2video" : "text2video";
    if (images.length) { params.start_image_url = images[0]; if (images[1]) params.end_image_url = images[1]; }
  } else if (service === "veo") { params.action = req.model.endsWith("-ingredients") ? "ingredients2video" : images.length ? "image2video" : "text2video"; if (images.length) params.image_urls = images; }
  else if (service === "wan") {
    params.action = images.length ? "image2video" : "text2video";
    if (req.model === "wan3.0-video") {
      params.media = [...(req.inputImages ?? []).map(a => ({ type: a.role ?? "reference_image", url: assetUrl(a) })), ...(req.inputVideos ?? []).map(a => ({ type: a.role ?? "reference_video", url: assetUrl(a) })), ...(req.inputAudios ?? []).map(a => ({ type: a.role ?? "reference_audio", url: assetUrl(a) }))];
      const roles = (params.media as Array<{type: string}>).map(a => a.type);
      if (roles.some(r => ["first_frame", "last_frame"].includes(r)) && roles.some(r => r.startsWith("reference_"))) throw new Error("Wan 3 frame mode cannot mix with reference mode.");
    } else {
      if (images.length) params.image_url = images[0]; if (videos.length) params.reference_video_urls = videos;
      if (audios.length) params.audio_url = audios[0];
    }
  } else if (service === "flux") {
    params.mode = videos.length ? "v2v" : images.length ? "i2v" : "t2v";
    if (images.length) params.keyframes = images;
    if (videos.length) params.start_video = videos[0];
  } else if (service === "grok") { if (images.length > 1) params.reference_image_urls = images; else if (images.length) params.image_url = images[0]; }
  else if (service === "midjourney") { delete params.model; if (images.length) params.image_url = images[0]; if (images[1]) params.end_image_url = images[1]; }
  return { tool, params };
}
export function registerMediaProviders(api: OpenClawPluginApi): void {
  for (const [id, [generate, edit]] of Object.entries(IMAGE_OPERATIONS)) {
    const service = serviceById(id), endpoint = service.endpoints[generate];
    const models = operationModels(endpoint);
    const provider: ImageProvider = {
      id: providerId(id), label: `Ace Data Cloud — ${service.label}`, models,
      defaultModel: String(endpoint.defaults?.model ?? models[0]), defaultTimeoutMs: 600_000,
      isConfigured: ({cfg, agentDir}) => configured(id, cfg, agentDir),
      capabilities: { generate: { maxCount: id === "nano-banana" ? 4 : id === "gpt-image" ? 10 : id === "qwen-image" ? 6 : 1, supportsSize: !!endpoint.properties.size, supportsAspectRatio: !!endpoint.properties.aspect_ratio || id === "flux", supportsResolution: !!endpoint.properties.resolution || id === "seedream" }, edit: { enabled: !!edit, maxInputImages: ["flux", "midjourney"].includes(id) ? 1 : id === "seedream" ? 10 : 4, ...(id === "gpt-image" ? {maxInputImagesByModel: { "dall-e-2": 0, "dall-e-3": 0 }} : {}), ...(id === "seedream" ? {maxInputImagesByModel: { "doubao-seedream-5-0-lite-260128": 14, "doubao-seedream-5-0-pro-260628": 10 }} : {}) }, ...(id === "nano-banana" ? { geometry: { aspectRatios: endpoint.properties.aspect_ratio.enum as string[], resolutions: ["1K", "2K", "4K"] } } : {}) },
      async generateImage(req) {
        const mapped = mapImageRequest(id, req);
        const result = await new ServiceClient(await resolveServiceKey(api, id, req.cfg)).complete(service, mapped.tool, mapped.params, req.timeoutMs ?? 600_000);
        if (!result.media_urls.length) throw new Error(`No image output in completed task ${result.task_id}.`);
        let images: Array<{buffer: Buffer; mimeType: string}>;
        try { images = await Promise.all(result.media_urls.map(url => downloadAsset(url, "image"))); }
        catch { throw new Error(`Image task ${result.task_id || result.trace_id} completed but media delivery failed. Retrieve this task; do not regenerate.`); }
        return { images, model: req.model, metadata: { status: result.status, taskId: result.task_id, traceId: result.trace_id } };
      },
    };
    api.registerImageGenerationProvider(provider);
    catalog(api, provider.id, "image_generation", models, service.label, provider.capabilities);
  }
  for (const [id, operation] of Object.entries(VIDEO_OPERATIONS)) {
    const service = serviceById(id), endpoint = service.endpoints[operation], models = operationModels(endpoint);
    const limits = { maxVideos: 1, supportsResolution: !!endpoint.properties.resolution, supportsAspectRatio: !!(endpoint.properties.aspect_ratio || endpoint.properties.ratio), supportsAudio: !!(endpoint.properties.generate_audio || endpoint.properties.audio), supportsWatermark: !!endpoint.properties.watermark, ...(Array.isArray(endpoint.properties.resolution?.enum) ? { resolutions: (endpoint.properties.resolution.enum as string[]).filter(r => id !== "minimax" || r !== "480P") } : {}) };
    const provider: VideoProvider = {
      id: providerId(id), label: `Ace Data Cloud — ${service.label}`, models,
      defaultModel: String(endpoint.defaults?.model ?? models.find(m => !m.endsWith("-i2v") && !m.endsWith("-r2v")) ?? models[0]), defaultTimeoutMs: 900_000,
      isConfigured: ({cfg, agentDir}) => configured(id, cfg, agentDir),
      capabilities: { generate: limits, imageToVideo: { ...limits, enabled: true, maxInputImages: ["seedance", "minimax", "grok"].includes(id) ? 9 : id === "veo" ? 3 : ["kling", "flux", "midjourney"].includes(id) ? 2 : 1 }, videoToVideo: { enabled: ["seedance", "minimax", "happyhorse", "wan", "flux"].includes(id), maxInputVideos: 1 } },
      async generateVideo(req) {
        const mapped = mapVideoRequest(id, req);
        const result = await new ServiceClient(await resolveServiceKey(api, id, req.cfg)).complete(service, mapped.tool, mapped.params, req.timeoutMs ?? 900_000);
        if (!result.media_urls.length) throw new Error(`No video output in completed task ${result.task_id}.`);
        return { videos: result.media_urls.map(url => ({ url, mimeType: "video/mp4" })), model: req.model, metadata: { taskId: result.task_id, traceId: result.trace_id } };
      },
    };
    api.registerVideoGenerationProvider(provider);
    catalog(api, provider.id, "video_generation", models, service.label, provider.capabilities);
  }
  const suno = serviceById("suno"), endpoint = suno.endpoints.suno_generate_audios;
  const music: MusicProvider = {
    id: providerId("suno"), label: "Ace Data Cloud — Suno", models: operationModels(endpoint), defaultModel: String(endpoint.defaults?.model ?? "chirp-v6"),
    isConfigured: ({cfg, agentDir}) => configured("suno", cfg, agentDir),
    capabilities: { generate: { maxTracks: 2, supportsLyrics: true, supportsInstrumental: true }, edit: { enabled: false } },
    async generateMusic(req) {
      exactModel(endpoint, req.model);
      const result = await new ServiceClient(await resolveServiceKey(api, "suno", req.cfg)).complete(suno, "suno_generate_audios", { model: req.model, prompt: req.prompt, ...(req.lyrics ? { custom: true, lyric: req.lyrics } : {}), ...(req.instrumental !== undefined ? { instrumental: req.instrumental } : {}) }, req.timeoutMs ?? 900_000);
      if (!result.media_urls.length) throw new Error(`No music output in completed task ${result.task_id}.`);
      let tracks: Array<{buffer: Buffer; mimeType: string}>;
      try { tracks = await Promise.all(result.media_urls.filter(url => /\.(mp3|wav|ogg|flac|m4a)(\?|$)/i.test(url)).map(url => downloadAsset(url, "audio"))); }
      catch { throw new Error(`Music task ${result.task_id || result.trace_id} completed but media delivery failed. Retrieve this task; do not regenerate.`); }
      if (!tracks.length) throw new Error("No audio tracks in completed task.");
      return { tracks, model: req.model, metadata: { taskId: result.task_id, traceId: result.trace_id } };
    },
  };
  api.registerMusicGenerationProvider(music);
  catalog(api, music.id, "music_generation", music.models ?? [], "Suno", music.capabilities);
  api.registerSpeechProvider({
    id: providerId("fish-audio"), label: "Ace Data Cloud — Fish Audio", defaultModel: "s2-pro", models: ["s1", "s2-pro", "s2.1-pro"], defaultTimeoutMs: 300_000,
    resolveConfig: ({rawConfig}) => {
      const source = record(rawConfig);
      const settings = record(record(source.providers)[providerId("fish-audio")] ?? source);
      const allowed = new Set([...Object.keys(serviceById("fish-audio").endpoints.fish_generate_audio.properties), "model", "voice", "voiceId", "modelId", "responseFormat"]);
      return { ...Object.fromEntries(Object.entries(settings).filter(([key]) => allowed.has(key))), model: settings.model ?? "s2-pro" };
    },
    resolveTalkOverrides: ({params}) => ({ ...(params.voiceId ? {voice: params.voiceId} : {}), ...(params.modelId ? {model: params.modelId} : {}) }),
    isConfigured: ({ cfg }) => configured("fish-audio", cfg),
    async synthesize(req) {
      const { apiKey: _key, ...settings } = req.providerConfig;
      const merged = { ...settings, ...req.providerOverrides };
      const { voice, modelId, voiceId, responseFormat, ...rest } = merged;
      const params = { ...rest, ...(modelId ? {model: modelId} : {}), ...(voice || voiceId ? {reference_id: voice || voiceId} : {}), text: req.text, format: responseFormat ?? rest.format ?? "mp3" };
      const result = await new ServiceClient(await resolveServiceKey(api, "fish-audio", req.cfg)).complete(serviceById("fish-audio"), "fish_generate_audio", params, req.timeoutMs);
      if (!result.media_urls[0]) throw new Error(`No speech audio in completed task ${result.task_id}.`);
      let asset: {buffer: Buffer; mimeType: string};
      try { asset = await downloadAsset(result.media_urls[0], "audio"); }
      catch { throw new Error(`Speech task ${result.task_id || result.trace_id} completed but media delivery failed. Retrieve this task; do not synthesize again.`); }
      const format = String(params.format);
      return { audioBuffer: asset.buffer, outputFormat: format, fileExtension: `.${format}`, voiceCompatible: false };
    },
    async listVoices(req) {
      const result = await new ServiceClient(await resolveServiceKey(api, "fish-audio", req.cfg)).invoke(serviceById("fish-audio"), "fish_search_voices", {page_size: 20});
      const data = record(result.result); const voices = data.items ?? data.data;
      return Array.isArray(voices) ? voices.map(v => { const row=record(v); return {id:String(row._id ?? row.id), name:String(row.title ?? row.name ?? row._id ?? row.id)}; }) : [];
    },
  });
  catalog(api, providerId("fish-audio"), "voice", ["s1", "s2-pro", "s2.1-pro"], "Fish Audio");
}
