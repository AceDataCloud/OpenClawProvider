import { readPositiveIntegerParam } from "openclaw/plugin-sdk/param-readers";
import type { WebSearchProviderPlugin } from "openclaw/plugin-sdk/provider-web-search-contract";
import { runAcedataSearch, type AcedataSearchType } from "./acedata-search-client.js";
import { buildAcedataSearchProviderBase } from "./acedata-search-shared.js";

const SUPPORTED_TYPES: AcedataSearchType[] = ["search", "images", "news", "videos", "maps", "places"];

const AcedataSearchSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Search query string." },
    count: {
      type: "integer",
      description: "Number of results to return (1-100).",
      minimum: 1,
      maximum: 100,
    },
    type: {
      type: "string",
      enum: SUPPORTED_TYPES,
      description:
        'Search vertical: "search" (default), "images", "news", "videos", "maps", or "places".',
    },
    country: {
      type: "string",
      description: 'Two-letter country code (e.g. "us", "cn", "jp").',
    },
    language: {
      type: "string",
      description: 'Two-letter language code (e.g. "en", "zh", "ja").',
    },
    range: {
      type: "string",
      description:
        'Recency filter using Google qdr syntax: "qdr:h" (hour), "qdr:d" (day), "qdr:w" (week), "qdr:m" (month), "qdr:y" (year).',
    },
    page: {
      type: "integer",
      description: "Page number for pagination (1-based).",
      minimum: 1,
    },
  },
  additionalProperties: false,
} satisfies Record<string, unknown>;

function normalizeSearchType(value: unknown): AcedataSearchType | undefined {
  if (typeof value !== "string") return undefined;
  return (SUPPORTED_TYPES as string[]).includes(value) ? (value as AcedataSearchType) : undefined;
}

export function createAcedataWebSearchProvider(): WebSearchProviderPlugin {
  return {
    ...buildAcedataSearchProviderBase(),
    createTool: (ctx) => ({
      description:
        "Search the web using Ace Data Cloud's Google SERP API. Returns structured organic results plus optional knowledge graph and answer box. Supports image/news/video/maps verticals.",
      parameters: AcedataSearchSchema,
      execute: async (args) => {
        const query = typeof args.query === "string" ? args.query : "";
        const count = readPositiveIntegerParam(args, "count", {
          message: "count must be an integer from 1 to 100",
          max: 100,
        });
        const page = readPositiveIntegerParam(args, "page", {
          message: "page must be a positive integer",
        });
        return await runAcedataSearch({
          cfg: ctx.config,
          query,
          type: normalizeSearchType(args.type) ?? "search",
          country: typeof args.country === "string" ? args.country : undefined,
          language: typeof args.language === "string" ? args.language : undefined,
          range: typeof args.range === "string" ? args.range : undefined,
          number: count,
          page,
        });
      },
    }),
  };
}
