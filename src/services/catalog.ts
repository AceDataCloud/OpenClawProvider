import c0 from "./contracts/face.json" with { type: "json" };
import c1 from "./contracts/fish-audio.json" with { type: "json" };
import c2 from "./contracts/flux.json" with { type: "json" };
import c3 from "./contracts/google-search.json" with { type: "json" };
import c4 from "./contracts/gpt-image.json" with { type: "json" };
import c5 from "./contracts/grok.json" with { type: "json" };
import c6 from "./contracts/happyhorse.json" with { type: "json" };
import c7 from "./contracts/kling.json" with { type: "json" };
import c8 from "./contracts/midjourney.json" with { type: "json" };
import c9 from "./contracts/minimax.json" with { type: "json" };
import c10 from "./contracts/nano-banana.json" with { type: "json" };
import c11 from "./contracts/qwen-image.json" with { type: "json" };
import c12 from "./contracts/seedance.json" with { type: "json" };
import c13 from "./contracts/seedream.json" with { type: "json" };
import c14 from "./contracts/suno.json" with { type: "json" };
import c15 from "./contracts/veo.json" with { type: "json" };
import c16 from "./contracts/wan.json" with { type: "json" };

export type Schema = Record<string, unknown>;
export type Endpoint = {
  method: string; path: string; operation: string; schema: Schema;
  properties: Record<string, Schema>; parameters?: Array<{in: string; name: string; required?: boolean; schema: Schema}>;
  defaults?: Record<string, unknown>; fixed?: Record<string, unknown>; allow_empty?: string[];
  query_actions?: string[]; media_response?: boolean; read_only?: boolean; destructive?: boolean;
  asynchronous?: boolean; selector?: Record<string, string>; selector_default?: string;
  tool?: { label: string; description: string; input: Array<{name: string; required: boolean; schema: Schema}> };
};
export type Service = {
  id: string; label: string; taskPath: string | null;
  source: {repository: string; commit: string; path: string};
  endpoints: Record<string, Endpoint>;
};
export const SERVICES: readonly Service[] = [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16] as unknown as Service[];
export function serviceById(id: string): Service {
  const service = SERVICES.find(s => s.id === id);
  if (!service) throw new Error(`Unknown Ace Data Cloud service: ${id}`);
  return service;
}
