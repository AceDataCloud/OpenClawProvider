import {
  applyAgentDefaultModelPrimary,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard";
import { ACEDATA_DEFAULT_MODEL_REF } from "../constants.js";

export { ACEDATA_DEFAULT_MODEL_REF };

export function applyAcedataProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
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
  return applyAgentDefaultModelPrimary(
    applyAcedataProviderConfig(cfg),
    ACEDATA_DEFAULT_MODEL_REF,
  );
}
