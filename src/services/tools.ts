import type { AnyAgentTool, OpenClawConfig, OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { normalizeResolvedSecretInputString } from "openclaw/plugin-sdk/secret-input";
import { SERVICES, type Service, type Endpoint, type Schema } from "./catalog.js";
import { ServiceClient, record } from "./client.js";

export async function resolveServiceKey(api: OpenClawPluginApi, service: string, config?: OpenClawConfig): Promise<string> {
  const entry = record(config?.plugins?.entries?.acedatacloud?.config);
  const credential = record(record(entry.serviceCredentials)[service]).apiKey;
  if (credential !== undefined) {
    const key = normalizeResolvedSecretInputString({ value: credential, path: `plugins.entries.acedatacloud.config.serviceCredentials.${service}.apiKey` });
    if (!key?.trim()) throw new Error(`The ${service} credential is unresolved or empty.`);
    return key;
  }
  const auth = await api.runtime.modelAuth.resolveApiKeyForProvider({ provider: "acedatacloud", cfg: config });
  if (!auth.apiKey) throw new Error("Configure an Ace Data Cloud API key with access to this service.");
  return auth.apiKey;
}
export function toolSchema(endpoint: Endpoint): Schema {
  const properties: Record<string, Schema> = {};
  const required: string[] = [];
  for (const input of endpoint.tool?.input ?? []) {
    // Accept native structured tool input, retaining Dify convenience parameters.
    properties[input.name] = endpoint.properties[input.name] ?? input.schema;
    if (input.required && !(input.name in (endpoint.defaults ?? {}))) required.push(input.name);
  }
  for (const [name, schema] of Object.entries(endpoint.properties)) {
    if (!(name in (endpoint.fixed ?? {})) && !["async", "stream", "callback_url"].includes(name)) properties[name] ??= schema;
  }
  for (const p of endpoint.parameters ?? []) {
    const key = p.name.toLowerCase() === "idempotency-key" ? "idempotency_key" : p.name;
    properties[key] ??= p.schema;
    if (p.required && !required.includes(key)) required.push(key);
  }
  return { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false };
}
export function operationName(name: string): string { return `acedata_${name}`; }
export function registerServiceTools(api: OpenClawPluginApi): void {
  const entries: Array<{service: Service; name: string; endpoint: Endpoint}> = SERVICES.flatMap(service => Object.entries(service.endpoints).filter(([name]) => !name.includes(":" )).map(([name, endpoint]) => ({ service, name, endpoint })));
  for (const { service, name, endpoint } of entries) {
    api.registerTool(ctx => {
      const nameInHost = operationName(name);
      return {
        name: nameInHost, label: endpoint.tool?.label ?? `${service.label}: ${name}`,
        description: `${endpoint.tool?.description ?? name} Uses Ace Data Cloud credits for billable operations. Prompts and reference URLs are sent to api.acedata.cloud. Preserve pending task IDs; do not repeat creation requests.`,
        parameters: toolSchema(endpoint) as AnyAgentTool["parameters"],
        async execute(_id, args, signal) {
          const config = ctx.getRuntimeConfig?.() ?? ctx.runtimeConfig ?? ctx.config;
          const serviceKey = record(record(record(config?.plugins?.entries?.acedatacloud?.config).serviceCredentials)[service.id]).apiKey;
          const key = serviceKey !== undefined ? await resolveServiceKey(api, service.id, config) : await ctx.resolveApiKeyForProvider?.("acedatacloud") ?? await resolveServiceKey(api, service.id, config);
          const result = await new ServiceClient(key).invoke(service, name, record(args), signal);
          return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
        },
      } satisfies AnyAgentTool;
    }, { name: operationName(name), optional: true });
  }
}
