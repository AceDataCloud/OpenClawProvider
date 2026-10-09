import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import { ACEDATA_BASE_URL } from "../constants.js";
import { GENERATED_CHAT_MODELS } from "./generated-catalog.js";

type ModelProviderConfig = NonNullable<
  NonNullable<OpenClawConfig["models"]>["providers"]
>[string];
type ModelDefinitionConfig = ModelProviderConfig["models"][number];

export function listAcedataChatModels(): ModelDefinitionConfig[] {
  return GENERATED_CHAT_MODELS.map(
    ({ reasoningEfforts, thinkingToggle, ...model }) => model,
  );
}

export function buildAcedataChatProvider(): ModelProviderConfig {
  return {
    baseUrl: ACEDATA_BASE_URL,
    api: "openai-completions",
    authHeader: true,
    models: listAcedataChatModels(),
  };
}
