import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import { resolvePositiveTimeoutSeconds } from "openclaw/plugin-sdk/provider-web-search";
import {
  normalizeResolvedSecretInputString,
  normalizeSecretInput,
} from "openclaw/plugin-sdk/secret-input";
import { normalizeOptionalString } from "openclaw/plugin-sdk/string-coerce-runtime";
import { ACEDATA_BASE_URL } from "../constants.js";

export const ACEDATA_SEARCH_DEFAULT_TIMEOUT_SECONDS = 30;

type AcedataSearchConfig =
  | {
      apiKey?: unknown;
      baseUrl?: string;
    }
  | undefined;

type PluginEntryConfig = {
  webSearch?: AcedataSearchConfig;
  providerCredentials?: { acedatacloud?: { apiKey?: unknown } };
};

export function resolveAcedataSearchConfig(cfg?: OpenClawConfig): AcedataSearchConfig {
  const pluginConfig = cfg?.plugins?.entries?.acedatacloud?.config as PluginEntryConfig | undefined;
  const ws = pluginConfig?.webSearch;
  if (ws && typeof ws === "object" && !Array.isArray(ws)) {
    return ws;
  }
  return undefined;
}

function normalizeConfiguredSecret(value: unknown, path: string): string | undefined {
  return normalizeSecretInput(
    normalizeResolvedSecretInputString({
      value,
      path,
    }),
  );
}

export function resolveAcedataSearchApiKey(cfg?: OpenClawConfig): string | undefined {
  const search = resolveAcedataSearchConfig(cfg);
  const fromSearch = normalizeConfiguredSecret(
    search?.apiKey,
    "plugins.entries.acedatacloud.config.webSearch.apiKey",
  );
  if (fromSearch) return fromSearch;
  const fromChat = normalizeConfiguredSecret(
    (cfg?.plugins?.entries?.acedatacloud?.config as PluginEntryConfig | undefined)
      ?.providerCredentials?.acedatacloud?.apiKey,
    "plugins.entries.acedatacloud.config.providerCredentials.acedatacloud.apiKey",
  );
  if (fromChat) return fromChat;
  return (
    normalizeSecretInput(process.env.ACEDATA_API_KEY) ||
    normalizeSecretInput(process.env.ACEDATACLOUD_API_KEY) ||
    undefined
  );
}

export function resolveAcedataSearchBaseUrl(cfg?: OpenClawConfig): string {
  const search = resolveAcedataSearchConfig(cfg);
  const configured =
    (normalizeOptionalString(search?.baseUrl) ?? "") ||
    normalizeSecretInput(process.env.ACEDATA_BASE_URL) ||
    "";
  if (!configured) {
    return ACEDATA_BASE_URL.replace(/\/v1\/?$/, "");
  }
  return configured.replace(/\/$/, "");
}

export function resolveAcedataSearchTimeoutSeconds(override?: number): number {
  return resolvePositiveTimeoutSeconds(override, ACEDATA_SEARCH_DEFAULT_TIMEOUT_SECONDS);
}
