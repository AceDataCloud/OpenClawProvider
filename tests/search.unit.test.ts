import { afterEach, describe, expect, test, vi } from "vitest";
import { runAcedataSearch } from "../src/search/acedata-search-client.js";
import { createAcedataWebSearchProvider } from "../src/search/acedata-search-provider.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.ACEDATA_API_KEY;
  delete process.env.ACEDATACLOUD_API_KEY;
});

describe("acedata search client", () => {
  test("throws when query is empty", async () => {
    await expect(runAcedataSearch({ query: "  " })).rejects.toThrow(/query is required/);
  });

  test("throws when no api key is configured", async () => {
    await expect(runAcedataSearch({ query: "openclaw" })).rejects.toThrow(/API key not configured/);
  });

  test("POSTs to /serp/google with bearer auth and normalizes results", async () => {
    process.env.ACEDATA_API_KEY = "ace-test-token";
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.acedata.cloud/serp/google");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer ace-test-token");
      expect(headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        query: "openclaw plugin",
        type: "search",
        number: 3,
      });
      return new Response(
        JSON.stringify({
          organic_results: [
            {
              title: "OpenClaw",
              link: "https://openclaw.ai",
              snippet: "Open source agent runtime",
              position: 1,
            },
            { title: "Missing link entry" },
          ],
          related_searches: [{ query: "openclaw plugin sdk" }, { query: "" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const result = await runAcedataSearch({
      query: "openclaw plugin",
      number: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.type).toBe("search");
    expect(result.organic_results).toHaveLength(2);
    expect(result.organic_results[0]).toMatchObject({
      title: "OpenClaw",
      link: "https://openclaw.ai",
      position: 1,
    });
    expect(result.related_searches).toEqual([{ query: "openclaw plugin sdk" }]);
  });

  test("surfaces upstream HTTP error", async () => {
    process.env.ACEDATA_API_KEY = "ace-test-token";
    globalThis.fetch = (async () =>
      new Response("rate limited", { status: 429 })) as typeof globalThis.fetch;
    await expect(runAcedataSearch({ query: "openclaw" })).rejects.toThrow(/HTTP 429/);
  });
});

describe("acedata web search provider", () => {
  test("exposes contract metadata", () => {
    const provider = createAcedataWebSearchProvider();
    expect(provider.id).toBe("acedatacloud");
    expect(provider.envVars).toContain("ACEDATA_API_KEY");
    expect(provider.envVars).toContain("ACEDATACLOUD_API_KEY");
    expect(provider.credentialPath).toBe("plugins.entries.acedatacloud.config.webSearch.apiKey");
  });

  test("createTool exposes schema and calls runAcedataSearch", async () => {
    process.env.ACEDATA_API_KEY = "ace-test-token";
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ organic_results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const provider = createAcedataWebSearchProvider();
    const tool = provider.createTool?.({ config: undefined } as never);
    expect(tool).toBeTruthy();
    if (!tool) return;

    expect(tool.parameters).toMatchObject({ type: "object" });
    const result = await tool.execute({
      query: "openclaw",
      count: 5,
      type: "images",
    } as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0] as unknown as [unknown, RequestInit];
    const body = JSON.parse(String(firstCall[1].body));
    expect(body).toMatchObject({ query: "openclaw", type: "images", number: 5 });
    expect(result).toMatchObject({ type: "images", organic_results: [] });
  });
});
