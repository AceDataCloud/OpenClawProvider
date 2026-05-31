import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth-api-key";
import type {
  ProviderResolveDynamicModelContext,
  ProviderRuntimeModel,
} from "openclaw/plugin-sdk/plugin-entry";
import {
  ACEDATA_BASE_URL,
  ACEDATA_PROVIDER_ID,
} from "./src/constants.js";
import {
  buildAcedataChatProvider,
  isAcedataReasoningModel,
} from "./src/chat/provider-catalog.js";
import {
  ACEDATA_DEFAULT_MODEL_REF,
  applyAcedataConfig,
} from "./src/chat/onboard.js";
import { createAcedataWebSearchProvider } from "./src/search/acedata-search-provider.js";

const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } as const;

function resolveDynamicChatModel(
  ctx: ProviderResolveDynamicModelContext,
): ProviderRuntimeModel {
  return {
    id: ctx.modelId,
    name: ctx.modelId,
    api: "openai-completions",
    provider: ACEDATA_PROVIDER_ID,
    baseUrl: ACEDATA_BASE_URL,
    reasoning: isAcedataReasoningModel(ctx.modelId),
    input: ["text", "image"],
    cost: ZERO_COST,
    contextWindow: 128_000,
    maxTokens: 8_192,
  };
}

export default definePluginEntry({
  id: ACEDATA_PROVIDER_ID,
  name: "Ace Data Cloud Provider",
  description: "Bundled Ace Data Cloud provider plugin (chat, image, video, music, search)",
  register(api) {
    api.registerProvider({
      id: ACEDATA_PROVIDER_ID,
      label: "Ace Data Cloud",
      docsPath: "/providers/acedatacloud",
      envVars: ["ACEDATA_API_KEY", "ACEDATACLOUD_API_KEY"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: ACEDATA_PROVIDER_ID,
          methodId: "api-key",
          label: "Ace Data Cloud API key",
          hint: "API key from https://platform.acedata.cloud/console/applications",
          optionKey: "acedatacloudApiKey",
          flagName: "--acedata-api-key",
          envVar: "ACEDATA_API_KEY",
          promptMessage: "Enter your Ace Data Cloud API key",
          defaultModel: ACEDATA_DEFAULT_MODEL_REF,
          expectedProviders: [ACEDATA_PROVIDER_ID],
          applyConfig: (cfg) => applyAcedataConfig(cfg),
          wizard: {
            choiceId: "acedatacloud-api-key",
            choiceLabel: "Ace Data Cloud API key",
            groupId: ACEDATA_PROVIDER_ID,
            groupLabel: "Ace Data Cloud",
            groupHint: "API key",
            onboardingScopes: ["text-inference"],
          },
        }),
      ],
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const apiKey = ctx.resolveProviderApiKey(ACEDATA_PROVIDER_ID).apiKey;
          if (!apiKey) {
            return null;
          }
          return {
            provider: {
              ...buildAcedataChatProvider(),
              apiKey,
            },
          };
        },
      },
      staticCatalog: {
        order: "simple",
        run: async () => ({
          provider: buildAcedataChatProvider(),
        }),
      },
      resolveDynamicModel: (ctx) => resolveDynamicChatModel(ctx),
    });
    api.registerWebSearchProvider(createAcedataWebSearchProvider());
  },
});
