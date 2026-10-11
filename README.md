# Ace Data Cloud provider for OpenClaw

An Ace Data Cloud maintained provider for LLMs, images, video, music, speech,
Google web search and creative tools.
Source: [AceDataCloud/OpenClawProvider](https://github.com/AceDataCloud/OpenClawProvider).

This package is not bundled with OpenClaw. ClawHub listing, security review, and
an official publisher badge are separate approval steps; this release does not
claim those approvals.

## Setup

Install the exact published version from npm, then enter an API key in OpenClaw:

```sh
openclaw plugins install npm:@acedatacloud/openclaw-provider@2026.10.1 --pin
openclaw onboard --auth-choice acedatacloud-api-key
```

Version 2026.10.1 is a release candidate until it appears in the registry.
Get an API-consumer key from [Ace Data Cloud](https://platform.acedata.cloud).
The default model is `acedatacloud/gpt-4.1-mini`.

The chat catalog covers 89 public models across OpenAI, Claude, Gemini, Grok,
DeepSeek, Kimi, and GLM. Each model uses its own supported Chat Completions,
Responses, or Messages route, input capabilities, reasoning controls, and prices.
See [model support and cost estimates](docs/model-catalog.md). No automatic
fallback changes the chosen model.

Native media providers cover Nano Banana, GPT Image, Seedream, Flux, Qwen Image,
Midjourney, Seedance, Veo, Kling, Grok Video, Happy Horse, MiniMax H3, Wan, Suno
and Fish Audio. 97 optional tools across 17 services expose advanced editing,
voice/persona management, face transformation, search and task retrieval.
See [capability and tool reference](docs/capabilities.md) and the
[official-contract architecture decision](docs/architecture.md).

[Setup and validation cookbook](docs/cookbook.md) includes environment-key setup,
model selection, and optional web search.

## Credentials and network access

Chat sends the selected model's prompts and tool messages to its documented
endpoint under `https://api.acedata.cloud` with the user's API key. Native Claude
Messages also receives an explicit Bearer header.
Optional search sends the query to `https://api.acedata.cloud/serp/google`.
Media generation uses the corresponding service endpoint on that same host.
Media downloads use the host's SSRF guard without forwarding your API key.
Billable generation and tool operations consume Ace Credits; model, count,
resolution and duration affect cost. Optional tools follow normal OpenClaw
policy and do not add a separate payment approval dialog.
The plugin has no shell commands, filesystem tools, or background service.
Use a service-scoped key where possible; cross-service use needs appropriate access.
Never send API keys to maintainers or attach them to issue reports.

## Development

Use Node 24.16+ and pnpm 9.15.4. The published OpenClaw SDK is pinned as a development
dependency, so no sibling source checkout is needed.

```sh
pnpm install --frozen-lockfile
pnpm sync-catalog:check
pnpm sync-services:check
pnpm typecheck
pnpm test
pnpm build
pnpm pack
clawhub package validate .
clawhub package publish . --owner acedatacloud --dry-run
```

The package uses built JavaScript entrypoints. Runtime APIs come from the installed
OpenClaw host. Report problems through [GitHub issues](https://github.com/AceDataCloud/OpenClawProvider/issues).

MIT License. Maintained by Ace Data Cloud, dev@acedata.cloud.
