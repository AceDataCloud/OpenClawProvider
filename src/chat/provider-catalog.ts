import type {
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "openclaw/plugin-sdk/provider-model-shared";
import { ACEDATA_BASE_URL } from "../constants.js";

const DEFAULT_CONTEXT_WINDOW = 128_000;
const DEFAULT_MAX_TOKENS = 8_192;
const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } as const;

type CatalogEntry = {
  id: string;
  name: string;
  reasoning?: boolean;
  vision?: boolean;
  contextWindow?: number;
  maxTokens?: number;
};

const CATALOG: readonly CatalogEntry[] = [
  { id: "gpt-4.1", name: "GPT-4.1", vision: true, contextWindow: 1_000_000, maxTokens: 32_768 },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", vision: true, contextWindow: 1_000_000, maxTokens: 32_768 },
  { id: "gpt-5.5", name: "GPT-5.5", reasoning: true, vision: true, contextWindow: 400_000, maxTokens: 16_384 },
  { id: "gpt-5.4-mini", name: "GPT-5.4 mini", reasoning: true, vision: true, contextWindow: 400_000, maxTokens: 16_384 },
  { id: "claude-opus-4-8", name: "Claude Opus 4.8", reasoning: true, vision: true, contextWindow: 1_000_000, maxTokens: 128_000 },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: true, vision: true, contextWindow: 1_000_000, maxTokens: 128_000 },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", reasoning: false, vision: true, contextWindow: 200_000, maxTokens: 8_192 },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", reasoning: true, vision: true, contextWindow: 2_000_000, maxTokens: 65_536 },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", reasoning: false, vision: true, contextWindow: 1_000_000, maxTokens: 65_536 },
  { id: "grok-4", name: "Grok 4", reasoning: true, vision: true, contextWindow: 256_000, maxTokens: 16_384 },
  { id: "grok-4-fast", name: "Grok 4 Fast", reasoning: false, vision: true, contextWindow: 256_000, maxTokens: 16_384 },
  { id: "deepseek-v4", name: "DeepSeek V4", reasoning: false, contextWindow: 128_000, maxTokens: 8_192 },
  { id: "deepseek-r1", name: "DeepSeek R1", reasoning: true, contextWindow: 128_000, maxTokens: 8_192 },
  { id: "kimi-k2.6", name: "Kimi K2.6", reasoning: true, vision: true, contextWindow: 262_144, maxTokens: 16_384 },
  { id: "glm-5.1", name: "GLM 5.1", reasoning: true, vision: true, contextWindow: 128_000, maxTokens: 8_192 },
  { id: "qwen-3.5", name: "Qwen 3.5", reasoning: true, vision: true, contextWindow: 128_000, maxTokens: 8_192 },
];

const REASONING_PREFIXES = ["gpt-5", "claude-opus", "claude-sonnet", "gemini-3.1", "grok-4", "deepseek-r", "kimi-k", "glm-5", "qwen-3.5"] as const;

export function isAcedataReasoningModel(modelId: string): boolean {
  const normalized = modelId.trim().toLowerCase();
  return REASONING_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function toModelDefinition(entry: CatalogEntry): ModelDefinitionConfig {
  return {
    id: entry.id,
    name: entry.name,
    reasoning: entry.reasoning ?? false,
    input: entry.vision ? ["text", "image"] : ["text"],
    cost: ZERO_COST,
    contextWindow: entry.contextWindow ?? DEFAULT_CONTEXT_WINDOW,
    maxTokens: entry.maxTokens ?? DEFAULT_MAX_TOKENS,
  };
}

export function listAcedataChatModels(): ModelDefinitionConfig[] {
  return CATALOG.map(toModelDefinition);
}

export function buildAcedataChatProvider(): ModelProviderConfig {
  return {
    baseUrl: ACEDATA_BASE_URL,
    api: "openai-completions",
    models: listAcedataChatModels(),
  };
}
