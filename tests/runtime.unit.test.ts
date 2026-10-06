import { describe, expect, it, vi } from "vitest";
import type { ProviderWrapStreamFnContext } from "openclaw/plugin-sdk/plugin-entry";
import { resolveDynamicChatModel } from "../index.js";
import {
  prepareAcedataRuntimeAuth,
  resolveAcedataThinkingProfile,
  wrapAcedataStream,
} from "../src/chat/runtime.js";

type Stream = NonNullable<ProviderWrapStreamFnContext["streamFn"]>;
const context = { messages: [] };
function model(id: string) {
  return resolveDynamicChatModel({ modelId: id } as Parameters<
    typeof resolveDynamicChatModel
  >[0])!;
}

describe("provider runtime", () => {
  it("carries bearer authentication through the embedded runtime transport", async () => {
    const prepared = await prepareAcedataRuntimeAuth({
      provider: "acedatacloud",
      modelId: "claude-sonnet-5-5",
      model: model("claude-sonnet-5-5"),
      apiKey: "test-api-key",
      authMode: "api-key",
      env: {},
    });
    expect(prepared).toEqual({
      apiKey: "test-api-key",
      request: {
        auth: { mode: "authorization-bearer", token: "test-api-key" },
      },
    });
    expect(
      await prepareAcedataRuntimeAuth({
        provider: "acedatacloud",
        modelId: "gpt-4.1-mini",
        model: model("gpt-4.1-mini"),
        apiKey: "test-api-key",
        authMode: "api-key",
        env: {},
      }),
    ).toBeUndefined();
  });

  it("adds Bearer auth only to Ace Data Cloud native Messages requests", () => {
    const calls: Parameters<Stream>[] = [];
    const stream = vi.fn((...args: Parameters<Stream>) => {
      calls.push(args);
      return {} as ReturnType<Stream>;
    });
    const wrapped = wrapAcedataStream({
      streamFn: stream,
      provider: "acedatacloud",
      modelId: "fixture",
    })!;
    wrapped(
      {
        ...model("claude-sonnet-5-5"),
        api: "provider-simple-completion:acedatacloud",
      },
      context,
      { apiKey: "test-api-key" },
    );
    wrapped(model("gpt-4.1-mini"), context, { apiKey: "test-api-key" });
    wrapped(
      { ...model("claude-sonnet-5-5"), baseUrl: "https://example.test" },
      context,
      { apiKey: "test-api-key" },
    );
    expect(calls[0][2]?.headers).toEqual({
      Authorization: "Bearer test-api-key",
    });
    expect(calls[1][2]?.headers).toBeUndefined();
    expect(calls[2][2]?.headers).toBeUndefined();
  });

  it("removes unsupported effort on toggle-only hosts while preserving earlier payload hooks", async () => {
    let options: Parameters<Stream>[2];
    const stream: Stream = (_model, _context, args) => {
      options = args;
      return {} as ReturnType<Stream>;
    };
    const wrapped = wrapAcedataStream({
      streamFn: stream,
      provider: "acedatacloud",
      modelId: "fixture",
    })!;
    const target = model("kimi-k2.5");
    wrapped(target, context, {
      onPayload: (payload) => ({ ...(payload as object), custom: true }),
    });
    const result = await options!.onPayload!(
      { thinking: { type: "enabled" }, reasoning_effort: "low" },
      target,
    );
    expect(result).toEqual({ thinking: { type: "enabled" }, custom: true });
  });

  it("offers only accepted effort levels and uses a supported default", () => {
    const profile = (modelId: string) =>
      resolveAcedataThinkingProfile({ provider: "acedatacloud", modelId });
    expect(profile("gpt-6.1-sol")?.levels.map((level) => level.id)).toEqual([
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
    expect(profile("gpt-5.4-pro")?.defaultLevel).toBe("medium");
    expect(profile("glm-5.2")?.defaultLevel).toBe("high");
    expect(profile("kimi-k2.5")?.levels).toEqual([
      { id: "off" },
      { id: "low", label: "on" },
    ]);
    expect(profile("gpt-4.1-mini")).toBeNull();
  });
});
