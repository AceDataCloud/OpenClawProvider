/**
 * Live API test — only runs when ACEDATA_API_KEY (or ACEDATACLOUD_API_KEY) is
 * set and ENABLE_LIVE_TESTS=1. Hits api.acedata.cloud's OpenAI-compatible
 * endpoint with a tiny prompt to verify our base URL + auth wiring is correct.
 */
import { describe, expect, it } from "vitest";
import { ACEDATA_BASE_URL } from "../../src/constants.js";

const apiKey = process.env.ACEDATA_API_KEY ?? process.env.ACEDATACLOUD_API_KEY ?? "";
const enabled = process.env.ENABLE_LIVE_TESTS === "1" && apiKey.length > 0;

const maybeIt = enabled ? it : it.skip;

describe("live: chat completions", () => {
  maybeIt("returns a non-empty response", async () => {
    const response = await fetch(`${ACEDATA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: "Reply with the single word: pong." }],
        max_tokens: 16,
      }),
    });
    expect(response.ok).toBe(true);
    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    expect(text.length).toBeGreaterThan(0);
  });
});
