import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import {
  resolveAcedataSearchApiKey,
  resolveAcedataSearchBaseUrl,
  resolveAcedataSearchTimeoutSeconds,
} from "./acedata-search-config.js";

export type AcedataSearchType = "search" | "images" | "news" | "videos" | "maps" | "places";

export type AcedataSearchOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
  date?: string;
  source?: string;
  thumbnail?: string;
};

export type AcedataSearchResponse = {
  type: AcedataSearchType;
  query: string;
  organic_results: AcedataSearchOrganicResult[];
  knowledge_graph?: Record<string, unknown>;
  answer_box?: Record<string, unknown>;
  related_searches?: Array<{ query?: string }>;
  total?: number;
  raw?: unknown;
};

export type RunAcedataSearchArgs = {
  cfg?: OpenClawConfig;
  query: string;
  type?: AcedataSearchType;
  country?: string;
  language?: string;
  range?: string;
  number?: number;
  page?: number;
  timeoutSeconds?: number;
};

const SEARCH_PATH = "/serp/google";

function buildSearchUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}${SEARCH_PATH}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeOrganicResults(value: unknown): AcedataSearchOrganicResult[] {
  if (!Array.isArray(value)) return [];
  const out: AcedataSearchOrganicResult[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    out.push({
      title: asString(row.title),
      link: asString(row.link) ?? asString(row.url),
      snippet: asString(row.snippet) ?? asString(row.description),
      position: asNumber(row.position),
      date: asString(row.date),
      source: asString(row.source),
      thumbnail: asString(row.thumbnail),
    });
  }
  return out;
}

export async function runAcedataSearch(args: RunAcedataSearchArgs): Promise<AcedataSearchResponse> {
  const { cfg, query, type = "search" } = args;
  if (!query.trim()) {
    throw new Error("Ace Data Cloud search query is required");
  }
  const apiKey = resolveAcedataSearchApiKey(cfg);
  if (!apiKey) {
    throw new Error(
      "Ace Data Cloud API key not configured. Set ACEDATA_API_KEY env var or configure plugins.entries.acedatacloud.config.webSearch.apiKey.",
    );
  }
  const baseUrl = resolveAcedataSearchBaseUrl(cfg);
  const timeoutSeconds = resolveAcedataSearchTimeoutSeconds(args.timeoutSeconds);

  const body: Record<string, unknown> = { query, type };
  if (args.country) body.country = args.country;
  if (args.language) body.language = args.language;
  if (args.range) body.range = args.range;
  if (typeof args.number === "number" && args.number > 0) body.number = args.number;
  if (typeof args.page === "number" && args.page > 0) body.page = args.page;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  let response: Response;
  try {
    response = await fetch(buildSearchUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    if ((cause as Error)?.name === "AbortError") {
      throw new Error(`Ace Data Cloud search timed out after ${timeoutSeconds}s`);
    }
    throw new Error(`Ace Data Cloud search request failed: ${(cause as Error).message}`, { cause });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Ace Data Cloud search API returned HTTP ${response.status}${text ? `: ${text.slice(0, 500)}` : ""}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new Error("Ace Data Cloud search returned malformed JSON", { cause });
  }

  const root = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const data =
    (root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root) ?? {};

  const organic = normalizeOrganicResults(data.organic_results ?? data.results ?? data.items);

  const result: AcedataSearchResponse = {
    type,
    query,
    organic_results: organic,
  };
  if (data.knowledge_graph && typeof data.knowledge_graph === "object") {
    result.knowledge_graph = data.knowledge_graph as Record<string, unknown>;
  }
  if (data.answer_box && typeof data.answer_box === "object") {
    result.answer_box = data.answer_box as Record<string, unknown>;
  }
  if (Array.isArray(data.related_searches)) {
    result.related_searches = (data.related_searches as Array<Record<string, unknown>>)
      .map((item) => ({ query: asString(item?.query) }))
      .filter((item) => Boolean(item.query));
  }
  if (typeof data.total === "number") {
    result.total = data.total;
  }
  return result;
}
