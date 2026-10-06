import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import { ACEDATA_DEFAULT_MODEL_REF } from "../constants.js";

export { ACEDATA_DEFAULT_MODEL_REF };

export function applyAcedataProviderConfig(
  cfg: OpenClawConfig,
): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[ACEDATA_DEFAULT_MODEL_REF] = {
    ...models[ACEDATA_DEFAULT_MODEL_REF],
    alias: models[ACEDATA_DEFAULT_MODEL_REF]?.alias ?? "Ace Data Cloud",
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
  };
}

export function applyAcedataConfig(cfg: OpenClawConfig): OpenClawConfig {
  const next = applyAcedataProviderConfig(cfg);
  if (cfg.agents?.defaults?.model) return next;
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: { primary: ACEDATA_DEFAULT_MODEL_REF },
      },
    },
  };
}
