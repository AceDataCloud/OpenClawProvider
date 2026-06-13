import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pluginEntry, {
  resolveDynamicChatModel,
  stripAcedataProviderPrefix,
} from "../index.js";

// Commander derives the parsed option key from the long flag: it drops the
// leading dashes and camel-cases the remaining hyphen-separated segments.
function commanderOptionKey(cliFlag: string): string {
  return cliFlag
    .replace(/^--/, "")
    .split("-")
    .map((part, index) =>
      index === 0 ? part : part.slice(0, 1).toUpperCase() + part.slice(1),
    )
    .join("");
}

describe("plugin manifest", () => {
  it("exposes the acedatacloud provider id", () => {
    expect(pluginEntry.id).toBe("acedatacloud");
    expect(pluginEntry.name).toContain("Ace Data Cloud");
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("non-interactive auth optionKey matches the CLI flag Commander parses", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../openclaw.plugin.json", import.meta.url), "utf8"),
    ) as { providerAuthChoices?: Array<{ cliFlag?: string; optionKey?: string }> };
    const choices = manifest.providerAuthChoices ?? [];
    expect(choices.length).toBeGreaterThan(0);
    for (const choice of choices) {
      if (!choice.cliFlag) {
        continue;
      }
      // Guards the onboarding mismatch where --acedata-api-key parses to
      // acedataApiKey but the manifest declared acedatacloudApiKey.
      expect(choice.optionKey).toBe(commanderOptionKey(choice.cliFlag));
    }
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
