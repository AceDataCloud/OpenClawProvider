import { Ajv2020 } from "ajv/dist/2020.js";
import type { Endpoint, Schema, Service } from "./catalog.js";
import { adaptParameters, finalizePayload } from "./parameters.js";

type Values = Record<string, unknown>;
const BASE = "https://api.acedata.cloud";
const ajv = new Ajv2020({ strict: false, allErrors: false, validateFormats: false });
const validators = new WeakMap<Schema, ReturnType<typeof ajv.compile>>();
const FAILED = new Set(["failed", "error", "cancelled", "canceled", "rejected"]);
const COMPLETE = new Set(["complete", "completed", "succeeded", "succeed", "success", "finished"]);
const sensitive = /^(request|request_body|headers|user_id|actor_user_id|credential_id|authorization_id|application_id|api_key|access_token|refresh_token|authorization|actual_model|provider_route)$|supplier|upstream|(?:^|_)secret(?:_|$)|^internal/i;
export const record = (x: unknown): Values => x && typeof x === "object" && !Array.isArray(x) ? x as Values : {};

export function cleanResult(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(cleanResult);
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).filter(([k]) => !sensitive.test(k)).map(([k, v]) => [k, k === "error" && v ? { code: "api_error", message: "Operation failed; inspect its task or trace ID." } : cleanResult(v)]));
  return x;
}
export function mediaUrls(x: unknown): string[] {
  const result = new Set<string>();
  function walk(n: unknown): void {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    for (const [key, value] of Object.entries(record(n))) {
      if (["url", "image_url", "audio_url", "video_url", "file_url", "raw_image_url"].includes(key) && typeof value === "string" && /^https:\/\//.test(value)) result.add(value);
      else if (typeof value === "object") walk(value);
    }
  }
  walk(x); return [...result];
}
function validate(value: unknown, schema: Schema, context: string): void {
  let fn = validators.get(schema);
  if (!fn) { fn = ajv.compile(schema); validators.set(schema, fn); }
  if (!fn(value)) throw new Error(`Invalid ${context}${fn.errors?.[0]?.instancePath ?? ""}: ${fn.errors?.[0]?.keyword ?? "schema"} constraint.`);
}
function coerce(value: unknown, schema: Schema): unknown {
  const type = schema.type;
  if (typeof value !== "string") return value;
  const alternatives = [...(Array.isArray(schema.oneOf) ? schema.oneOf : []), ...(Array.isArray(schema.anyOf) ? schema.anyOf : [])].map(s => record(s).type);
  const types = [...(Array.isArray(type) ? type : [type]), ...alternatives];
  if (types.some(t => t === "array" || t === "object") && /^[\[{]/.test(value.trim())) {
    try { return JSON.parse(value); } catch { throw new Error("Object/array parameters must contain valid JSON."); }
  }
  if (["array", "object"].includes(String(type))) {
    try { return JSON.parse(value); } catch {
      if (type === "array" && record(schema.items).type === "string") return value.split("\n").map(s => s.trim()).filter(Boolean);
      throw new Error("Object/array parameters must contain valid JSON.");
    }
  }
  if ((type === "number" || type === "integer") && value.trim() !== "") return Number(value);
  if (types.some(t => t === "number" || t === "integer") && /^[-+]?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (type === "boolean" && ["true", "false"].includes(value)) return value === "true";
  return value;
}
function permits(schema: Schema, name: string, values: Values): boolean {
  if (name in record(schema.properties)) return true;
  for (const group of ["oneOf", "anyOf", "allOf"]) {
    for (const s of Array.isArray(schema[group]) ? schema[group] as Schema[] : []) {
      const props = record(s.properties);
      if (["action", "mode"].every(k => {
        const d = record(props[k]);
        return values[k] === undefined || (!d.enum && d.const === undefined) || (Array.isArray(d.enum) ? d.enum : [d.const]).includes(values[k]);
      }) && permits(s, name, values)) return true;
    }
  }
  return false;
}
export type PreparedRequest = { method: string; path: string; body: Values; query: Values; headers: Record<string, string>; asynchronous: boolean; readOnly: boolean; endpoint: Endpoint };
export function prepare(service: Service, tool: string, parameters: Values): PreparedRequest {
  let endpoint = service.endpoints[tool];
  if (!endpoint) throw new Error("Unknown service operation.");
  if (endpoint.selector) {
    const selection = endpoint.selector[String(parameters.action ?? endpoint.selector_default)];
    if (!selection) throw new Error("Unsupported operation.");
    endpoint = service.endpoints[selection];
  }
  const params = adaptParameters(service.id, Object.fromEntries(Object.entries(parameters).filter(([, v]) => v !== undefined && v !== null)), endpoint);
  const values = { ...endpoint.defaults, ...params, ...endpoint.fixed };
  const allowed = new Set([...Object.keys(endpoint.properties), ...(endpoint.parameters ?? []).map(p => p.name.toLowerCase() === "idempotency-key" ? "idempotency_key" : p.name), ...Object.keys(endpoint.defaults ?? {}), "confirm", "wait_seconds", "task_id"]);
  if (service.endpoints[tool].selector) allowed.add("action");
  for (const name of Object.keys(params)) if (!allowed.has(name)) throw new Error(`Unsupported parameter: ${name}`);
  const body: Values = {};
  for (const [key, schema] of Object.entries(endpoint.properties)) {
    if (values[key] !== undefined && (values[key] !== "" || endpoint.allow_empty?.includes(key))) body[key] = coerce(values[key], schema);
  }
  const queryAction = endpoint.query_actions?.includes(String(values.action));
  if (!queryAction && permits(endpoint.schema, "async", values)) body.async = true;
  if (permits(endpoint.schema, "stream", values)) body.stream = false;
  if (endpoint.properties.response_format && endpoint.media_response) body.response_format = "url";
  let path = endpoint.path;
  const query: Values = {}, headers: Record<string, string> = {};
  for (const p of endpoint.parameters ?? []) {
    const key = p.name.toLowerCase() === "idempotency-key" ? "idempotency_key" : p.name;
    if (values[key] === undefined || values[key] === "") {
      if (p.required) throw new Error(`${key} is required.`);
      continue;
    }
    const value = coerce(values[key], p.schema); validate(value, p.schema, key);
    if (p.in === "path") path = path.replace(`{${p.name}}`, encodeURIComponent(String(value)));
    else if (p.in === "query") query[p.name] = value;
    else if (p.in === "header") headers[p.name] = String(value);
  }
  finalizePayload(service.id, body, endpoint);
  validate(body, endpoint.schema, tool);
  if ((endpoint.destructive || ["delete", "archive"].includes(String(body.action))) && params.confirm !== true) throw new Error("Set confirm=true only after approving this deletion/archive.");
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("{") || new URL(path, BASE).origin !== BASE) throw new Error("Invalid service endpoint.");
  return { method: endpoint.method, path, body, query, headers, asynchronous: endpoint.asynchronous === true || body.async === true, readOnly: endpoint.method === "GET" || endpoint.read_only === true || !!queryAction, endpoint };
}
export type ServiceResult = { status: "pending" | "succeeded" | "failed" | "partial"; success: boolean; task_id: string; trace_id: string; media_urls: string[]; data: unknown; result: unknown };
export function normalize(body: unknown, taskId = "", retrieved = false, synchronous = false, allowPartial = false): ServiceResult {
  const envelope = record(body);
  let result = retrieved && "response" in envelope ? envelope.response : body;
  if (typeof result === "string") { try { result = JSON.parse(result); } catch { result = {}; } }
  const clean = cleanResult(result), obj = record(result);
  const id = String(taskId || envelope.task_id || record(envelope.task).id || "");
  const trace = String(obj.trace_id || envelope.trace_id || "");
  const urls = mediaUrls(clean); const states: string[] = []; let failed = false;
  function visit(n: unknown): void {
    if (Array.isArray(n)) { n.forEach(visit); return; }
    const row = record(n);
    if (row.success === false || row.error) failed = true;
    for (const k of ["state", "status"]) if (typeof row[k] === "string") states.push(row[k].toLowerCase());
    for (const k of ["data", "content", "task"]) if (row[k]) visit(row[k]);
  }
  if (!(synchronous && !id)) visit(result);
  else if (obj.error || obj.success === false) failed = true;
  failed ||= states.some(s => FAILED.has(s));
  const unfinished = retrieved && "finished_at" in envelope && envelope.finished_at === null;
  const empty = result == null || (retrieved && typeof result === "object" && !Object.keys(result).length);
  const partial = allowPartial && failed && urls.length > 0 && states.every(s => COMPLETE.has(s) || FAILED.has(s));
  const done = !unfinished && !empty && (partial || (synchronous && !id) || (states.length > 0 && states.every(s => COMPLETE.has(s))) || (!states.length && (urls.length > 0 || retrieved && !!envelope.finished_at)));
  if (failed && !unfinished && !partial) throw new Error(`Ace Data Cloud task failed${id ? ` (${id})` : ""}${trace ? `; trace ${trace}` : ""}.`);
  if (!done && !id) throw new Error(`No task ID or completed result; inspect request history before resubmitting${trace ? ` (trace ${trace})` : ""}.`);
  return { status: done ? partial ? "partial" : "succeeded" : "pending", success: done && !partial, task_id: id, trace_id: trace, media_urls: done ? urls : [], data: done ? cleanResult(obj.data ?? obj.content ?? result) : {}, result: done ? clean : {} };
}
export async function readLimited(response: Response, limit: number): Promise<Buffer> {
  if (Number(response.headers.get("content-length")) > limit) throw new Error("Response exceeds the configured size limit.");
  const reader = response.body?.getReader(); if (!reader) throw new Error("Empty response body.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > limit) throw new Error("Response exceeds the configured size limit."); chunks.push(item.value); }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}
export class ServiceClient {
  constructor(private readonly apiKey: string, private readonly fetchFn: typeof fetch = fetch) {
    if (!apiKey.trim()) throw new Error("Configure an Ace Data Cloud API key.");
  }
  async request(request: PreparedRequest, signal?: AbortSignal): Promise<unknown> {
    const url = new URL(request.path, BASE);
    for (const [k, v] of Object.entries(request.query)) url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    const timeout = AbortSignal.timeout(60_000);
    let response: Response;
    try {
      response = await this.fetchFn(url, { method: request.method, headers: { ...request.headers, Authorization: `Bearer ${this.apiKey.replace(/^Bearer\s+/i, "").trim()}`, Accept: "application/json", "Content-Type": "application/json" }, body: ["GET", "DELETE"].includes(request.method) ? undefined : JSON.stringify(request.body), redirect: "error", signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    } catch {
      signal?.throwIfAborted();
      throw new Error("Ace Data Cloud request did not return a response. Inspect task/request history before retrying a creation request.");
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Ace Data Cloud HTTP ${response.status}.`); }
    const bytes = await readLimited(response, 8 * 1024 * 1024);
    try { return JSON.parse(bytes.toString("utf8")); } catch { throw new Error("Ace Data Cloud returned invalid JSON."); }
  }
  async invoke(service: Service, tool: string, params: Values, signal?: AbortSignal): Promise<ServiceResult> {
    const endpoint = service.endpoints[tool];
    if (!endpoint) throw new Error("Unknown service operation.");
    if (endpoint.operation === "task") {
      const id = params.task_id ?? params.id;
      const trace = endpoint.properties.trace_id ? params.trace_id : undefined;
      if (!(typeof id === "string" && id.trim()) && !(typeof trace === "string" && trace.trim())) throw new Error("A task ID or supported trace ID is required.");
      const wait = Number(params.wait_seconds ?? 0);
      if (!Number.isInteger(wait) || wait < 0 || wait > 240) throw new Error("wait_seconds must be between 0 and 240.");
      const end = Date.now() + wait * 1000;
      for (;;) {
        signal?.throwIfAborted();
        const request = prepare(service, tool, { ...params, action: "retrieve", ...(id ? { id } : {}), ...(trace ? { trace_id: trace } : {}) });
        const body = await this.request(request, signal);
        const result = normalize(body, String(id || record(body).id || ""), true, false, service.id === "seedream");
        if (result.status !== "pending" || Date.now() >= end) return result;
        await delay(Math.min(5000, end - Date.now()), signal);
      }
    }
    const req = prepare(service, tool, params); const body = await this.request(req, signal);
    if (endpoint.operation === "batch") {
      const obj = record(body); const items = Array.isArray(body) ? body : obj.items ?? obj.tasks ?? obj.data;
      if (!Array.isArray(items)) throw new Error("Invalid task batch response.");
      const results = items.map(item => { const id = String(record(item).id ?? record(item).task_id ?? ""); try { return normalize(item, id, true, false, service.id === "seedream"); } catch { return { status: "failed", success: false, task_id: id, trace_id: "", media_urls: [], data: {}, result: {} } as ServiceResult; } });
      const status = results.some(r => r.status === "pending") ? "pending" : results.some(r => r.status === "failed") ? "failed" : results.some(r => r.status === "partial") ? "partial" : "succeeded";
      return { status, success: status === "succeeded", task_id: "", trace_id: "", media_urls: results.flatMap(r => r.media_urls), data: results, result: { items: results } };
    }
    return normalize(body, "", false, !req.asynchronous, service.id === "seedream");
  }
  async complete(service: Service, tool: string, params: Values, timeoutMs = 600_000): Promise<ServiceResult> {
    const signal = AbortSignal.timeout(timeoutMs); let result = await this.invoke(service, tool, params, signal);
    const task = Object.keys(service.endpoints).find(k => service.endpoints[k].operation === "task");
    while (result.status === "pending") {
      if (!task || !result.task_id) throw new Error("Pending generation has no supported task retrieval contract.");
      try { await delay(3000, signal); result = await this.invoke(service, task, { task_id: result.task_id }, signal); }
      catch (error) { if (signal.aborted) throw new Error(`Generation is still pending: ${service.id} task ${result.task_id}. Retrieve this task; do not submit again.`); throw error; }
    }
    return result;
  }
}
async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  await new Promise<void>((resolve, reject) => { const stop = () => { clearTimeout(timer); reject(signal?.reason); }; const timer = setTimeout(() => { signal?.removeEventListener("abort", stop); resolve(); }, ms); signal?.addEventListener("abort", stop, { once: true }); });
}
