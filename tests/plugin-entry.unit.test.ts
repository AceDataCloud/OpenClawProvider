import { describe, expect, it } from "vitest";
import pluginEntry, {
  resolveDynamicChatModel,
  stripAcedataProviderPrefix,
} from "../index.js";

describe("plugin manifest", () => {
  it("exposes the acedatacloud provider id", () => {
    expect(pluginEntry.id).toBe("acedatacloud");
    expect(pluginEntry.name).toContain("Ace Data Cloud");
    expect(typeof pluginEntry.register).toBe("function");
  });
});

describe("resolveDynamicChatModel", () => {
  it("strips the acedatacloud/ prefix so the wire payload uses the bare model id", () => {
    expect(stripAcedataProviderPrefix("acedatacloud/claude-opus-4-8")).toBe(
      "claude-opus-4-8",
    );
    expect(stripAcedataProviderPrefix("acedatacloud/claude-haiku-4-5-20251001")).toBe(
      "claude-haiku-4-5-20251001",
    );
    expect(stripAcedataProviderPrefix("gpt-5.4-mini")).toBe("gpt-5.4-mini");
  });

  it("returns a runtime model whose id matches the bare upstream model id", () => {
    const model = resolveDynamicChatModel({
      modelId: "acedatacloud/claude-opus-4-8",
    } as Parameters<typeof resolveDynamicChatModel>[0]);
    expect(model.id).toBe("claude-opus-4-8");
    expect(model.name).toBe("claude-opus-4-8");
    expect(model.provider).toBe("acedatacloud");
    expect(model.api).toBe("openai-completions");
    expect(model.baseUrl).toContain("api.acedata.cloud");
  });
});
