import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
type ModelProviderConfig = NonNullable<
  NonNullable<OpenClawConfig["models"]>["providers"]
>[string];
type ModelDefinitionConfig = ModelProviderConfig["models"][number];
import { ACEDATA_BASE_URL } from "../constants.js";
import { GENERATED_CHAT_MODELS } from "./generated-catalog.js";

function toModelDefinition(
  entry: (typeof GENERATED_CHAT_MODELS)[number],
): ModelDefinitionConfig {
  return {
    id: entry.id,
    name: entry.name,
    reasoning: entry.reasoning,
    input: entry.vision ? ["text", "image"] : ["text"],
    cost: entry.cost,
    contextWindow: entry.contextWindow,
    maxTokens: entry.maxTokens,
  };
}

export function listAcedataChatModels(): ModelDefinitionConfig[] {
  return GENERATED_CHAT_MODELS.map(toModelDefinition);
}

export function buildAcedataChatProvider(): ModelProviderConfig {
  return {
    baseUrl: ACEDATA_BASE_URL,
    api: "openai-completions",
    models: listAcedataChatModels(),
  };
}
