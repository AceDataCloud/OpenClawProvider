# OpenClaw + Ace Data Cloud Integration Cookbook

This cookbook walks through using **Ace Data Cloud** as your model provider inside [OpenClaw](https://github.com/openclaw/openclaw). One API key gives you 60+ chat models (Claude, GPT, Gemini, Grok, DeepSeek, Kimi, GLM, …) plus Google web-search and (soon) image / video / music generation — all behind a single OpenAI-compatible endpoint at `https://api.acedata.cloud/v1`.

The provider is published as [`@acedatacloud/openclaw-provider`](https://www.npmjs.com/package/@acedatacloud/openclaw-provider) and is an officially supported OpenClaw plugin.

## What is Ace Data Cloud

[Ace Data Cloud](https://platform.acedata.cloud) is a unified AI gateway:

- **One key, many models.** Anthropic, OpenAI, Google, xAI, DeepSeek, Moonshot, Zhipu, and more.
- **OpenAI-compatible.** Drop-in `POST /v1/chat/completions` with `Authorization: Bearer <key>`.
- **Web search.** Google SERP across `search`, `images`, `news`, `videos`, `maps`, and `places`.
- **Usage-based billing.** Pre-paid credits, per-request cost computed server-side. Console at [platform.acedata.cloud](https://platform.acedata.cloud).

## Quick start

### 1. Get an API key

Sign up at [platform.acedata.cloud](https://platform.acedata.cloud) and create an API key.

### 2. Install the plugin

```bash
openclaw plugins install '@acedatacloud/openclaw-provider' --pin
```

The plugin requires `openclaw >= 2026.4.2`.

### 3. Provide the API key

The simplest path is an env var the plugin auto-detects:

```bash
export ACEDATA_API_KEY="ace-..."          # or ACEDATACLOUD_API_KEY
```

Or use the wizard:

```bash
openclaw onboard --auth-choice acedatacloud-api-key
```

Or supply it inline:

```bash
openclaw onboard --auth-choice acedatacloud-api-key --token "$ACEDATA_API_KEY"
```

### 4. Pick a default model

```bash
openclaw config set agents.defaults.model.primary 'acedatacloud/claude-opus-4-8'
```

### 5. Run a turn

```bash
openclaw agent --local --session-key smoke --model 'acedatacloud/claude-opus-4-8' \
  -m 'Say hello in one sentence.'
```

## Model format

Model refs follow the pattern `acedatacloud/<model-name>`. The provider ships with 60+ curated entries and also accepts arbitrary upstream model ids as a passthrough — anything Ace Data Cloud lists at [docs.acedata.cloud/aichat/models](https://docs.acedata.cloud/aichat/models) is valid.

| Family       | Example refs                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------- |
| Claude       | `acedatacloud/claude-opus-4-8`, `acedatacloud/claude-sonnet-4-6`, `acedatacloud/claude-haiku-4-5-20251001` |
| GPT / o-     | `acedatacloud/gpt-5.2-pro`, `acedatacloud/gpt-5.4-mini`, `acedatacloud/o4-mini`               |
| Gemini       | `acedatacloud/gemini-3.1-pro`, `acedatacloud/gemini-3-flash`                                  |
| Grok         | `acedatacloud/grok-4-1-fast`, `acedatacloud/grok-4`                                           |
| DeepSeek     | `acedatacloud/deepseek-v4-flash`, `acedatacloud/deepseek-r1`                                  |
| Kimi         | `acedatacloud/kimi-k2.5`, `acedatacloud/kimi-k2-thinking`                                     |
| GLM          | `acedatacloud/glm-5.1`, `acedatacloud/glm-4.6`                                                |

## Manual configuration

If you'd rather edit `~/.openclaw/openclaw.json` directly:

```json5
{
  env: { ACEDATA_API_KEY: "ace-..." },
  agents: {
    defaults: {
      model: { primary: "acedatacloud/claude-opus-4-8" },
    },
  },
  plugins: {
    entries: {
      acedatacloud: { enabled: true },
    },
  },
}
```

## Fallbacks across providers

OpenClaw supports model fallback chains. Mix Ace Data Cloud with other providers for redundancy:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "acedatacloud/claude-opus-4-8",
        fallbacks: [
          "acedatacloud/gpt-5.2-pro",
          "acedatacloud/gemini-3.1-pro",
        ],
      },
    },
  },
}
```

## Web search

The plugin also registers an `acedatacloud` **web-search** provider backed by Google SERP. It reuses the same API key:

```bash
openclaw config set tools.web.search.provider acedatacloud
openclaw config set tools.web.search.enabled true
```

Supported verticals: `search`, `images`, `news`, `videos`, `maps`, `places`. The provider returns OpenClaw's standard `WebSearchResult` shape so any agent that uses web-search works without changes.

Override the API key just for search if needed:

```json5
{
  acedatacloud: {
    webSearch: {
      apiKey: "ace-...",                       // optional override
      baseUrl: "https://api.acedata.cloud",    // optional override
    },
  },
}
```

## Monitoring usage

Open the [Ace Data Cloud Console](https://platform.acedata.cloud) to:

- Watch live token spend per model
- See per-request cost breakdowns
- Top up credits

Every chat and search request is billed atomically against your pre-paid balance; usage history is available immediately in the console.

## Common errors

### `No API key found for provider "acedatacloud"`

Set `ACEDATA_API_KEY` (or `ACEDATACLOUD_API_KEY`) in your shell, or run `openclaw onboard --auth-choice acedatacloud-api-key`. The plugin reads in this order: explicit `models.providers.acedatacloud.apiKey` → `ACEDATA_API_KEY` → `ACEDATACLOUD_API_KEY`.

### `No valid account found`

Your API key is invalid, expired, or its credit balance is zero. Re-issue at [platform.acedata.cloud](https://platform.acedata.cloud) and confirm the balance is greater than zero.

### `429 rate limit`

Burst limits apply per key. Add a retry budget or switch to a model with higher throughput in the console.

### `502 / 504 upstream`

Transient — OpenClaw's failover logic will route to the next entry in `model.fallbacks` if you configured one.

## Per-channel models

Different chat channels can use different Ace Data Cloud models:

```json5
{
  channels: {
    telegram: {
      agents: {
        defaults: {
          model: { primary: "acedatacloud/claude-opus-4-8" },
        },
      },
    },
    discord: {
      agents: {
        defaults: {
          model: { primary: "acedatacloud/claude-haiku-4-5-20251001" },   // cheaper for Discord
        },
      },
    },
  },
}
```

## Resources

- npm package — [`@acedatacloud/openclaw-provider`](https://www.npmjs.com/package/@acedatacloud/openclaw-provider)
- Source — [github.com/AceDataCloud/OpenClawProvider](https://github.com/AceDataCloud/OpenClawProvider)
- Ace Data Cloud API docs — [docs.acedata.cloud](https://docs.acedata.cloud)
- Model catalog — [docs.acedata.cloud/aichat/models](https://docs.acedata.cloud/aichat/models)
- OpenClaw docs — [docs.openclaw.ai](https://docs.openclaw.ai)
