import { describe, expect, it } from "vitest";
import {
  buildAcedataChatProvider,
  isAcedataReasoningModel,
  listAcedataChatModels,
} from "../src/chat/provider-catalog.js";
import { ACEDATA_BASE_URL } from "../src/constants.js";

describe("acedatacloud chat catalog", () => {
  it("uses the platform endpoint", () => {
    const provider = buildAcedataChatProvider();
    expect(provider.baseUrl).toBe(ACEDATA_BASE_URL);
    expect(provider.api).toBe("openai-completions");
  });

  it("ships a non-empty static catalog with zero cost (billing is server-side)", () => {
    const models = listAcedataChatModels();
    expect(models.length).toBeGreaterThan(10);
    for (const model of models) {
      expect(model.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
      expect(model.id).not.toContain(" ");
      expect(model.name).toBeTruthy();
    }
  });

  it("flags reasoning models correctly", () => {
    expect(isAcedataReasoningModel("gpt-5.4-mini")).toBe(true);
    expect(isAcedataReasoningModel("claude-opus-4-8")).toBe(true);
    expect(isAcedataReasoningModel("deepseek-r1")).toBe(true);
    expect(isAcedataReasoningModel("gpt-4.1-mini")).toBe(false);
    expect(isAcedataReasoningModel("claude-haiku-4-5-20251001")).toBe(false);
    expect(isAcedataReasoningModel("gemini-3-flash")).toBe(false);
  });
});
