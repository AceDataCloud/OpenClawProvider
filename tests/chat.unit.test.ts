import { describe, expect, it } from "vitest";
import {
  buildAcedataChatProvider,
  listAcedataChatModels,
} from "../src/chat/provider-catalog.js";

describe("chat catalog", () => {
  it("uses the documented Chat Completions route and a bounded verified catalog", () => {
    const provider = buildAcedataChatProvider();
    expect(provider.baseUrl).toBe("https://api.acedata.cloud/openai");
    expect(provider.api).toBe("openai-completions");
    expect(listAcedataChatModels().map((model) => model.id)).toEqual([
      "gpt-4.1-mini",
    ]);
    const model = listAcedataChatModels()[0];
    expect(model.input).toEqual(["text"]);
    expect(model.reasoning).toBe(false);
    expect(model.cost.input).toBeCloseTo(0.840989 * 0.175, 9);
    expect(model.cost.output).toBeCloseTo(3.363958 * 0.175, 9);
    expect(model.cost.cacheRead).toBeCloseTo((0.840989 - 0.630742) * 0.175, 9);
  });
});
