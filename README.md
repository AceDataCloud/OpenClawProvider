# Ace Data Cloud provider for OpenClaw

An Ace Data Cloud maintained provider for LLMs, images, video, music, speech,
Google web search and creative tools.
Source: [AceDataCloud/OpenClawProvider](https://github.com/AceDataCloud/OpenClawProvider).

Install from the [ClawHub listing](https://clawhub.ai/acedatacloud/plugins/openclaw-provider).
The package is vendor maintained and is not bundled with OpenClaw. Security
audit results are shown on the listing; an official publisher badge is a separate
review and has not been granted.

## Setup

Install from ClawHub and enter an API key through the onboarding prompt:

```sh
openclaw plugins install clawhub:@acedatacloud/openclaw-provider
openclaw onboard --auth-choice acedatacloud-api-key
```

Review OpenClaw's source/capability prompts before accepting installation. To pin
an exact release, append `@2026.10.3` to the ClawHub package spec. The same package
is distributed on [npm](https://www.npmjs.com/package/@acedatacloud/openclaw-provider)
and as a `.tgz` on [GitHub Releases](https://github.com/AceDataCloud/OpenClawProvider/releases).
Get an API-consumer key from [Ace Data Cloud](https://platform.acedata.cloud).
The default model is `acedatacloud/gpt-4.1-mini`.

The chat catalog covers 90 public models across OpenAI, Claude, Gemini, Grok,
DeepSeek, Kimi, and GLM. Each model uses its own supported Chat Completions,
Responses, or Messages route, input capabilities, reasoning controls, and prices.
See [model support and cost estimates](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.3/docs/model-catalog.md). No automatic
fallback changes the chosen model.

Native media providers cover Nano Banana, GPT Image, Seedream, Flux, Qwen Image,
Midjourney, Seedance, Veo, Kling, Grok Video, Happy Horse, MiniMax H3, Wan, Suno
and Fish Audio. 97 optional tools across 17 services expose advanced editing,
voice/persona management, face transformation, search and task retrieval.
See [capability and tool reference](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.3/docs/capabilities.md) and the
[official-contract architecture decision](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.3/docs/architecture.md).

[Setup and validation cookbook](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.3/docs/cookbook.md) includes environment-key setup,
model selection, and optional web search.

For a native image after setup:

```sh
openclaw infer image generate --model acedatacloud-nano-banana/nano-banana-2-lite \
  --prompt "A blue circle on a white background" --count 1 --output image.jpg
```

This is a paid generation. Use the task retrieval tools to recover an existing
result after a timeout instead of generating it again.

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
