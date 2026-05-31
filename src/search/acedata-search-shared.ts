import {
  createWebSearchProviderContractFields,
  type WebSearchProviderPlugin,
} from "openclaw/plugin-sdk/provider-web-search-contract";

export const ACEDATA_SEARCH_CREDENTIAL_PATH =
  "plugins.entries.acedatacloud.config.webSearch.apiKey";

export function buildAcedataSearchProviderBase(): Omit<WebSearchProviderPlugin, "createTool"> {
  return {
    id: "acedatacloud",
    label: "Ace Data Cloud Google Search",
    hint: "Google web/image/news/video search via Ace Data Cloud SERP API",
    onboardingScopes: ["text-inference"],
    credentialLabel: "Ace Data Cloud API key",
    envVars: ["ACEDATA_API_KEY", "ACEDATACLOUD_API_KEY"],
    placeholder: "ace-...",
    signupUrl: "https://platform.acedata.cloud/",
    docsUrl: "https://platform.acedata.cloud/services/3a30e2fb-3a99-4ae7-bc3e-9a51d5d6f02b",
    autoDetectOrder: 80,
    credentialPath: ACEDATA_SEARCH_CREDENTIAL_PATH,
    ...createWebSearchProviderContractFields({
      credentialPath: ACEDATA_SEARCH_CREDENTIAL_PATH,
      searchCredential: { type: "scoped", scopeId: "acedatacloud" },
      configuredCredential: { pluginId: "acedatacloud" },
      selectionPluginId: "acedatacloud",
    }),
  };
}
