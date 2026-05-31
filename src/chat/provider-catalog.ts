import type {
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "openclaw/plugin-sdk/provider-model-shared";
import { ACEDATA_BASE_URL } from "../constants.js";
import { GENERATED_CHAT_MODELS } from "./generated-catalog.js";

const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } as const;

const CATALOG_REASONING_BY_ID = new Map<string, boolean>(
  GENERATED_CHAT_MODELS.map((m) => [m.id.toLowerCase(), m.reasoning]),
);

// Heuristic fallback for ids NOT in the curated catalog (used by
// resolveDynamicModel passthrough). Authoritative source: catalog lookup above.
const REASONING_HEURISTIC_PREFIXES = [
  "gpt-5",
  "claude-opus-",
  "claude-sonnet-4",
  "claude-3-7-sonnet",
  "gemini-3.1-pro",
  "gemini-3-pro",
  "grok-4",
  "deepseek-r",
  "deepseek-v4",
  "deepseek-reasoner",
  "kimi-k2-thinking",
  "kimi-k2.5",
  "glm-5",
] as const;

const REASONING_HEURISTIC_EXACT = new Set<string>([
  "o1",
  "o1-mini",
  "o1-pro",
  "o3",
  "o3-mini",
  "o3-pro",
  "o4-mini",
]);

export function isAcedataReasoningModel(modelId: string): boolean {
  const normalized = modelId.trim().toLowerCase();
  if (!normalized) return false;
  const fromCatalog = CATALOG_REASONING_BY_ID.get(normalized);
  if (fromCatalog !== undefined) return fromCatalog;
  if (REASONING_HEURISTIC_EXACT.has(normalized)) return true;
  return REASONING_HEURISTIC_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function toModelDefinition(entry: (typeof GENERATED_CHAT_MODELS)[number]): ModelDefinitionConfig {
  return {
    id: entry.id,
    name: entry.name,
    reasoning: entry.reasoning,
    input: entry.vision ? ["text", "image"] : ["text"],
    cost: ZERO_COST,
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
