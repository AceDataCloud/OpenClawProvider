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

const ACEDATA_MODEL_ID_PREFIX_RE = new RegExp(`^${ACEDATA_PROVIDER_ID}\\/`);

// OpenClaw passes the qualified id (e.g. "acedatacloud/claude-haiku-4-5-20251001")
// when a model is not in the static catalog. The api.acedata.cloud upstream
// expects the bare provider model id in the request payload.
function stripAcedataProviderPrefix(modelId: string): string {
  return modelId.replace(ACEDATA_MODEL_ID_PREFIX_RE, "");
}

function resolveDynamicChatModel(
  ctx: ProviderResolveDynamicModelContext,
): ProviderRuntimeModel {
  const bareId = stripAcedataProviderPrefix(ctx.modelId);
  return {
    id: bareId,
    name: bareId,
    api: "openai-completions",
    provider: ACEDATA_PROVIDER_ID,
    baseUrl: ACEDATA_BASE_URL,
    reasoning: isAcedataReasoningModel(bareId),
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

export { resolveDynamicChatModel, stripAcedataProviderPrefix };
