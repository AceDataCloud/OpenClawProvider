import type {
  ProviderDefaultThinkingPolicyContext,
  ProviderThinkingProfile,
  ProviderWrapStreamFnContext,
  ProviderPrepareRuntimeAuthContext,
  ProviderPreparedRuntimeAuth,
} from "openclaw/plugin-sdk/plugin-entry";
import { GENERATED_CHAT_MODELS } from "./generated-catalog.js";

export async function prepareAcedataRuntimeAuth(
  ctx: ProviderPrepareRuntimeAuthContext,
): Promise<ProviderPreparedRuntimeAuth | undefined> {
  if (
    ctx.model.api !== "anthropic-messages" ||
    new URL(ctx.model.baseUrl).origin !== "https://api.acedata.cloud"
  )
    return undefined;
  return {
    apiKey: ctx.apiKey,
    request: { auth: { mode: "authorization-bearer", token: ctx.apiKey } },
  };
}

export function resolveAcedataThinkingProfile(
  ctx: ProviderDefaultThinkingPolicyContext,
): ProviderThinkingProfile | null {
  const model = GENERATED_CHAT_MODELS.find(
    (row) => row.id === ctx.modelId.replace(/^acedatacloud\//, ""),
  );
  if (!model?.reasoning) return null;
  type Level = ProviderThinkingProfile["levels"][number]["id"];
  const accepted = new Set<Level>([
    "off",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
  ]);
  const levels = model.reasoningEfforts
    .map((value) => (value === "none" ? "off" : value))
    .filter((value): value is Level => accepted.has(value as Level));
  if (model.thinkingToggle && !levels.includes("off")) levels.unshift("off");
  if (!levels.length) levels.push("low");
  if (model.thinkingToggle && levels.length === 1) levels.push("low");
  return {
    levels: levels.map((id) => ({
      id,
      ...(model.thinkingToggle &&
      model.reasoningEfforts.length === 0 &&
      id === "low"
        ? { label: "on" }
        : {}),
    })),
    defaultLevel: levels.find((id) => id !== "off") ?? "off",
  };
}

export function wrapAcedataStream(
  ctx: ProviderWrapStreamFnContext,
): ProviderWrapStreamFnContext["streamFn"] {
  const stream = ctx.streamFn;
  if (!stream) return undefined;
  const wrapped: NonNullable<ProviderWrapStreamFnContext["streamFn"]> = (
    model,
    context,
    options,
  ) => {
    const entry = GENERATED_CHAT_MODELS.find(
      (row) => row.id === model.id.replace(/^acedatacloud\//, ""),
    );
    const headers =
      entry?.api === "anthropic-messages" &&
      new URL(model.baseUrl).origin === "https://api.acedata.cloud" &&
      options?.apiKey
        ? { ...options.headers, Authorization: `Bearer ${options.apiKey}` }
        : options?.headers;
    // Toggle-only hosts accept thinking.type, but do not accept an effort field.
    const toggleOnly =
      entry?.thinkingToggle && entry.reasoningEfforts.length === 0;
    const onPayload = options?.onPayload;
    return stream(model, context, {
      ...options,
      ...(headers ? { headers } : {}),
      ...(toggleOnly
        ? {
            onPayload: async (payload, requestModel) => {
              const next =
                (await onPayload?.(payload, requestModel)) ?? payload;
              if (next && typeof next === "object" && !Array.isArray(next)) {
                const { reasoning_effort: ignored, ...rest } = next as Record<
                  string,
                  unknown
                >;
                return rest;
              }
              return next;
            },
          }
        : {}),
    });
  };
  return wrapped;
}
