import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildAcedataChatProvider,
  listAcedataChatModels,
} from "../src/chat/provider-catalog.js";
import { GENERATED_CHAT_MODELS } from "../src/chat/generated-catalog.js";

describe("full public chat catalog", () => {
  it("keeps every source model in both runtime and manifest projections", () => {
    const source = JSON.parse(
      readFileSync(
        new URL("../src/chat/model-catalog.json", import.meta.url),
        "utf8",
      ),
    );
    const manifest = JSON.parse(
      readFileSync(new URL("../openclaw.plugin.json", import.meta.url), "utf8"),
    );
    const runtime = listAcedataChatModels();
    expect(runtime.map((row) => row.id)).toEqual(
      source.models.map((row: { id: string }) => row.id),
    );
    expect(manifest.modelCatalog.providers.acedatacloud.models).toEqual(
      runtime,
    );
    expect(runtime.length).toBe(89);
    expect(new Set(runtime.map((row) => row.id)).size).toBe(runtime.length);
    for (const excluded of Object.keys(source.excluded))
      expect(runtime.some((row) => row.id === excluded)).toBe(false);
  });

  it("preserves protocol and base URL for each family", () => {
    const provider = buildAcedataChatProvider();
    expect(provider.authHeader).toBe(true);
    const expected = [
      ["gpt-6.1-sol", "openai-completions", "/openai"],
      ["claude-sonnet-5", "openai-completions", "/v1"],
      ["gemini-3.8-flash", "openai-completions", "/gemini"],
      ["grok-4.7", "openai-completions", "/grok"],
      ["deepseek-v4.1-flash", "openai-completions", "/deepseek"],
      ["kimi-k3", "openai-completions", "/kimi"],
      ["glm-5.3", "openai-completions", "/glm"],
      ["gpt-5.4-pro", "openai-responses", "/openai"],
      ["claude-opus-5-5", "anthropic-messages", ""],
      ["claude-sonnet-5-5", "anthropic-messages", ""],
    ];
    for (const [id, api, path] of expected) {
      expect(provider.models.find((row) => row.id === id)).toMatchObject({
        api,
        baseUrl: `https://api.acedata.cloud${path}`,
      });
    }
  });

  it("does not copy vision or reasoning effort onto every model", () => {
    const models = listAcedataChatModels();
    expect(models.find((row) => row.id === "gpt-4.1-mini")?.input).toEqual([
      "text",
      "image",
    ]);
    expect(models.find((row) => row.id === "deepseek-v4-flash")?.input).toEqual(
      ["text"],
    );
    expect(models.find((row) => row.id === "gpt-4.1-mini")?.reasoning).toBe(
      false,
    );
    expect(
      models.find((row) => row.id === "gpt-6.1-sol")?.compat
        ?.supportedReasoningEfforts,
    ).toEqual(["low", "medium", "high", "xhigh", "max"]);
  });

  it("keeps exact reference costs and half-open long-context price bands", () => {
    const mini = GENERATED_CHAT_MODELS.find(
      (row) => row.id === "gpt-4.1-mini",
    )!;
    expect(mini.cost.input).toBeCloseTo(0.840989 * 0.175, 9);
    expect(mini.cost.cacheRead).toBeCloseTo((0.840989 - 0.630742) * 0.175, 9);
    const sol = GENERATED_CHAT_MODELS.find((row) => row.id === "gpt-6.1-sol")!;
    expect(sol.cost.tieredPricing?.map((tier) => tier.range)).toEqual([
      [0, 272001],
      [272001],
    ]);
    expect(sol.cost.tieredPricing?.[1].input).toBeCloseTo(
      sol.cost.input * 2,
      9,
    );
  });
});
