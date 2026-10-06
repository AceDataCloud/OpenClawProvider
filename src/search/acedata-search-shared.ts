import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { resolveAcedataSearchConfig } from "./acedata-search-config.js";
export type WebSearchProviderPlugin = Parameters<
  OpenClawPluginApi["registerWebSearchProvider"]
>[0];

export const ACEDATA_SEARCH_CREDENTIAL_PATH =
  "plugins.entries.acedatacloud.config.webSearch.apiKey";

export function buildAcedataSearchProviderBase(): Omit<
  WebSearchProviderPlugin,
  "createTool"
> {
  return {
    id: "acedatacloud",
    label: "Ace Data Cloud Google Search",
    hint: "Google web/image/news/video search via Ace Data Cloud SERP API",
    onboardingScopes: ["text-inference"],
    credentialLabel: "Ace Data Cloud API key",
    envVars: ["ACEDATA_API_KEY", "ACEDATACLOUD_API_KEY"],
    placeholder: "ace-...",
    signupUrl: "https://platform.acedata.cloud/",
    docsUrl:
      "https://platform.acedata.cloud/services/3a30e2fb-3a99-4ae7-bc3e-9a51d5d6f02b",
    autoDetectOrder: 80,
    credentialPath: ACEDATA_SEARCH_CREDENTIAL_PATH,
    getCredentialValue: (searchConfig) => {
      const scoped = searchConfig?.acedatacloud;
      return scoped && typeof scoped === "object" && "apiKey" in scoped
        ? scoped.apiKey
        : undefined;
    },
    setCredentialValue: (searchConfig, value) => {
      const scoped = searchConfig.acedatacloud;
      searchConfig.acedatacloud = {
        ...(scoped && typeof scoped === "object" ? scoped : {}),
        apiKey: value,
      };
    },
    getConfiguredCredentialValue: (config) =>
      resolveAcedataSearchConfig(config)?.apiKey,
    setConfiguredCredentialValue: (config, value) => {
      config.plugins ??= {};
      config.plugins.entries ??= {};
      const entry = (config.plugins.entries.acedatacloud ??= {});
      entry.config ??= {};
      entry.config.webSearch = {
        ...resolveAcedataSearchConfig(config),
        apiKey: value,
      };
    },
    applySelectionConfig: (config) => ({
      ...config,
      plugins: {
        ...config.plugins,
        entries: {
          ...config.plugins?.entries,
          acedatacloud: {
            ...config.plugins?.entries?.acedatacloud,
            enabled: true,
          },
        },
      },
    }),
  };
}
