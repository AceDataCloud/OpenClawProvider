import { describe, expect, it } from "vitest";
import {
  buildAcedataChatProvider,
  isAcedataReasoningModel,
  listAcedataChatModels,
} from "../src/chat/provider-catalog.js";
import { GENERATED_CHAT_MODELS } from "../src/chat/generated-catalog.js";
import { ACEDATA_BASE_URL } from "../src/constants.js";

describe("acedatacloud chat catalog", () => {
  it("uses the platform endpoint", () => {
    const provider = buildAcedataChatProvider();
    expect(provider.baseUrl).toBe(ACEDATA_BASE_URL);
    expect(provider.api).toBe("openai-completions");
  });

  it("ships a non-empty catalog generated from PlatformBackend", () => {
    expect(GENERATED_CHAT_MODELS.length).toBeGreaterThan(40);
  });

  it("every catalog entry is well-formed and zero-cost (billing is server-side)", () => {
    for (const model of listAcedataChatModels()) {
      expect(model.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
      expect(model.id).not.toContain(" ");
      expect(model.name).toBeTruthy();
      expect(model.contextWindow).toBeGreaterThan(0);
      expect(model.maxTokens).toBeGreaterThan(0);
      for (const input of model.input) {
        expect(["text", "image"]).toContain(input);
      }
    }
  });

  it("flags reasoning models correctly", () => {
    expect(isAcedataReasoningModel("gpt-5.4-mini")).toBe(true);
    expect(isAcedataReasoningModel("claude-opus-4-8")).toBe(true);
    expect(isAcedataReasoningModel("claude-sonnet-4-6")).toBe(true);
    expect(isAcedataReasoningModel("deepseek-r1")).toBe(true);
    expect(isAcedataReasoningModel("deepseek-v4-flash")).toBe(true);
    expect(isAcedataReasoningModel("o3")).toBe(true);
    expect(isAcedataReasoningModel("o4-mini")).toBe(true);
    expect(isAcedataReasoningModel("kimi-k2-thinking")).toBe(true);
    expect(isAcedataReasoningModel("grok-4")).toBe(true);

    expect(isAcedataReasoningModel("gpt-4.1-mini")).toBe(false);
    expect(isAcedataReasoningModel("claude-haiku-4-5-20251001")).toBe(false);
    expect(isAcedataReasoningModel("gemini-3.1-flash-lite-preview")).toBe(false);
    expect(isAcedataReasoningModel("deepseek-chat")).toBe(false);
    expect(isAcedataReasoningModel("")).toBe(false);
  });

  it("includes the headline modern models", () => {
    const ids = new Set(GENERATED_CHAT_MODELS.map((m) => m.id));
    for (const expected of [
      "claude-opus-4-8",
      "claude-sonnet-4-6",
      "gpt-5.4-mini",
      "gpt-5.2-pro",
      "gemini-3.1-pro",
      "grok-4",
      "deepseek-v4-flash",
      "kimi-k2.5",
      "glm-5.1",
    ]) {
      expect(ids.has(expected), `expected '${expected}' in generated catalog`).toBe(true);
    }
  });
});
