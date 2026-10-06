import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";
import type {
  ProviderResolveDynamicModelContext,
  ProviderRuntimeModel,
  OpenClawPluginDefinition,
} from "openclaw/plugin-sdk/plugin-entry";
import { ACEDATA_BASE_URL, ACEDATA_PROVIDER_ID } from "./src/constants.js";
import { buildAcedataChatProvider } from "./src/chat/provider-catalog.js";
import { GENERATED_CHAT_MODELS } from "./src/chat/generated-catalog.js";
import {
  ACEDATA_DEFAULT_MODEL_REF,
  applyAcedataConfig,
} from "./src/chat/onboard.js";
import { createAcedataWebSearchProvider } from "./src/search/acedata-search-provider.js";

const ACEDATA_MODEL_ID_PREFIX_RE = new RegExp(`^${ACEDATA_PROVIDER_ID}\\/`);

// OpenClaw passes the qualified id (e.g. "acedatacloud/claude-haiku-4-5-20251001")
// when a model is not in the static catalog. The api.acedata.cloud upstream
// expects the bare provider model id in the request payload.
function stripAcedataProviderPrefix(modelId: string): string {
  return modelId.replace(ACEDATA_MODEL_ID_PREFIX_RE, "");
}

function resolveDynamicChatModel(
  ctx: ProviderResolveDynamicModelContext,
): ProviderRuntimeModel | undefined {
  const bareId = stripAcedataProviderPrefix(ctx.modelId);
  const known = GENERATED_CHAT_MODELS.find((model) => model.id === bareId);
  if (!known) return undefined;
  return {
    id: known.id,
    name: known.name,
    reasoning: known.reasoning,
    input: known.vision ? ["text", "image"] : ["text"],
    cost: known.cost,
    contextWindow: known.contextWindow,
    maxTokens: known.maxTokens,
    api: "openai-completions",
    provider: ACEDATA_PROVIDER_ID,
    baseUrl: ACEDATA_BASE_URL,
  };
}

const plugin: OpenClawPluginDefinition = definePluginEntry({
  id: ACEDATA_PROVIDER_ID,
  name: "Ace Data Cloud Provider",
  description: "Ace Data Cloud chat model and web search provider",
  register(api) {
    api.registerProvider({
      id: ACEDATA_PROVIDER_ID,
      label: "Ace Data Cloud",
      docsPath:
        "https://github.com/AceDataCloud/OpenClawProvider/blob/main/docs/cookbook.md",
      envVars: ["ACEDATA_API_KEY", "ACEDATACLOUD_API_KEY"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: ACEDATA_PROVIDER_ID,
          methodId: "api-key",
          label: "Ace Data Cloud API key",
          hint: "API key from https://platform.acedata.cloud/console/applications",
          optionKey: "acedataApiKey",
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
    api.registerModelCatalogProvider({
      provider: ACEDATA_PROVIDER_ID,
      kinds: ["text"],
      staticCatalog: () =>
        GENERATED_CHAT_MODELS.map((model) => ({
          kind: "text",
          provider: ACEDATA_PROVIDER_ID,
          model: model.id,
          label: model.name,
          source: "static",
        })),
    });
    api.registerWebSearchProvider(createAcedataWebSearchProvider());
  },
});

export default plugin;
export { resolveDynamicChatModel, stripAcedataProviderPrefix };
