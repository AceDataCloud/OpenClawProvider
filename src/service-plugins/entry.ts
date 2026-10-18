import { definePluginEntry, type OpenClawConfig, type OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod, isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { normalizeResolvedSecretInputString } from "openclaw/plugin-sdk/secret-input";
import { record } from "../services/client.js";
import { registerMediaProviders } from "../services/media.js";
import { registerServiceTools } from "../services/tools.js";
import type { ServicePluginDefinition } from "./definitions.js";

export function configuredServiceKey(def: ServicePluginDefinition, cfg?: OpenClawConfig): string | undefined {
  const value = record(cfg?.plugins?.entries?.[def.id]?.config).apiKey;
  if (value !== undefined) {
    const key = normalizeResolvedSecretInputString({ value, path: `plugins.entries.${def.id}.config.apiKey` });
    if (!key?.trim()) throw new Error(`The ${def.label} API key is unresolved or empty.`);
    return key;
  }
  return process.env[def.envVar]?.trim() || undefined;
}
export async function resolveStandaloneKey(def: ServicePluginDefinition, api: OpenClawPluginApi, cfg?: OpenClawConfig): Promise<string> {
  const key = configuredServiceKey(def, cfg);
  if (key) return key;
  const auth = await api.runtime.modelAuth.resolveApiKeyForProvider({ provider: def.id, cfg });
  if (!auth.apiKey) throw new Error(`Configure ${def.label} by Ace Data Cloud with a key allowing this service.`);
  return auth.apiKey;
}
export function applyServiceConfig(def: ServicePluginDefinition, cfg: OpenClawConfig): OpenClawConfig {
  if (cfg.agents?.defaults?.mediaModels?.[def.kind]) return cfg;
  return { ...cfg, agents: { ...cfg.agents, defaults: { ...cfg.agents?.defaults,
    mediaModels: { ...cfg.agents?.defaults?.mediaModels, [def.kind]: { primary: `${def.id}/${def.model}` } },
  } } };
}
export function createServicePlugin(def: ServicePluginDefinition) {
  return definePluginEntry({
    id: def.id, name: `${def.label} by Ace Data Cloud`,
    description: `${def.label} ${def.kind} generation, editing and task retrieval through Ace Data Cloud.`,
    register(api) {
      api.registerProvider({
        id: def.id, label: `${def.label} by Ace Data Cloud`, envVars: [def.envVar],
        docsPath: `https://github.com/AceDataCloud/OpenClawProvider/blob/main/service-plugins/${def.service}/README.md`,
        auth: [createProviderApiKeyAuthMethod({
          providerId: def.id, methodId: "api-key", label: `${def.label} Ace Data Cloud API key`,
          hint: "Get an application API token with access to this service at platform.acedata.cloud",
          optionKey: `${def.service.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())}AceApiKey`,
          flagName: `--${def.service}-ace-api-key`, envVar: def.envVar,
          promptMessage: `Enter your Ace Data Cloud API key for ${def.label}`,
          expectedProviders: [def.id], applyConfig: cfg => applyServiceConfig(def, cfg),
          wizard: { choiceId: `${def.id}-api-key`, choiceLabel: `${def.label} by Ace Data Cloud`,
            groupId: def.id, groupLabel: `${def.label} by Ace Data Cloud`, groupHint: `${def.label} ${def.kind}`,
            onboardingScopes: def.kind === "video" ? [] : [`${def.kind}-generation`], },
        })],
      });
      const key = (_service: string, cfg?: OpenClawConfig) => resolveStandaloneKey(def, api, cfg);
      registerMediaProviders(api, { services: [def.service], resolveKey: key,
        isConfigured: (_service, cfg, agentDir) => !!configuredServiceKey(def, cfg) || isProviderApiKeyConfigured({ provider: def.id, agentDir }),
        providerId: () => def.id, label: () => `${def.label} by Ace Data Cloud`, authEnvVars: [def.envVar],
      });
      registerServiceTools(api, { services: [def.service], prefix: "ace_service_", resolveKey: key });
    },
  });
}
