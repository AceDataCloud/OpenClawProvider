# Ace Data Cloud provider for OpenClaw

An Ace Data Cloud maintained provider for LLMs, images, video, music, speech,
Google web search and creative tools.
Source: [AceDataCloud/OpenClawProvider](https://github.com/AceDataCloud/OpenClawProvider).

Install from the [ClawHub listing](https://clawhub.ai/acedatacloud/plugins/openclaw-provider).
The package is vendor maintained and is not bundled with OpenClaw. Security
audit results are shown on the listing; an official publisher badge is a separate
review and has not been granted.

## Get your Ace Data Cloud API key

1. Open [Ace Data Cloud → Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=openclawprovider_readme_api_key). Sign in, or register an account first.
2. Find **General application**. If it has not been created, choose **Initialize General Application**. A general key can use the services available to your account; a dedicated application's key is limited to its service. Check the required service/model access and [current pricing](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=openclawprovider_readme_pricing).
3. Copy the **API Key** from the application card, or open **Keys / Manage Keys → Create** to create a separate key for this integration. Give it a recognizable name so you can revoke or rotate it independently.
4. When creating a key, review **Expiration Time**, **Set Usage Limitation**, and **Allowed APIs**. Enable only the restrictions you need, allow the operations you will call, then click **Create** and copy the token from the key list. Task lookup does not grant permission to submit a generation. Confirm the application's balance can cover your first request; any trial allowance is whatever your account currently displays.
5. Copy only the token value, without quotation marks, spaces, or `Bearer `. An API Key / API Token field expects this raw value; only a manually configured HTTP `Authorization` header needs the `Bearer ` prefix. A `platform-...` account-management token cannot replace a generation API key.

![Copy an application API key or open Manage Keys](https://raw.githubusercontent.com/AceDataCloud/NanoBananaDify/2522b2f57210597af2db866445319334a1677a23/_assets/tutorial/get-api-key-en.png)

![Create a separately named key with optional restrictions](https://raw.githubusercontent.com/AceDataCloud/NanoBananaDify/2522b2f57210597af2db866445319334a1677a23/_assets/tutorial/create-api-key-en.png)

Save the key in the client's credential store or the environment variable shown below. Never put it in a prompt, shared workflow, screenshot, or Git commit. If authentication fails, check the full copied value, application/service access, expiration, usage limit, and balance before creating another key.

## Setup

Install from ClawHub and enter an API key through the onboarding prompt:

```sh
openclaw plugins install clawhub:@acedatacloud/openclaw-provider
openclaw onboard --auth-choice acedatacloud-api-key
```

Review OpenClaw's source/capability prompts before accepting installation. To pin
an exact release, append `@2026.10.12` to the ClawHub package spec. The same package
is distributed on [npm](https://www.npmjs.com/package/@acedatacloud/openclaw-provider)
and as a `.tgz` on [GitHub Releases](https://github.com/AceDataCloud/OpenClawProvider/releases).
Follow the [API key steps above](#get-your-ace-data-cloud-api-key) before onboarding.
The default model is `acedatacloud/gpt-4.1-mini`.

The chat catalog covers 90 public models across OpenAI, Claude, Gemini, Grok,
DeepSeek, Kimi, and GLM. Each model uses its own supported Chat Completions,
Responses, or Messages route, input capabilities, reasoning controls, and prices.
See [model support and cost estimates](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.12/docs/model-catalog.md). No automatic
fallback changes the chosen model.

Native media providers cover Nano Banana, GPT Image, Seedream, Flux, Qwen Image,
Midjourney, Seedance, Veo, Kling, Grok Video, Happy Horse, MiniMax H3, Wan, Suno
and Fish Audio. 97 optional tools across 17 services expose advanced editing,
voice/persona management, face transformation, search and task retrieval.
See [capability and tool reference](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.12/docs/capabilities.md) and the
[official-contract architecture decision](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.12/docs/architecture.md).

[Setup and validation cookbook](https://github.com/AceDataCloud/OpenClawProvider/blob/v2026.10.12/docs/cookbook.md) includes environment-key setup,
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

## Independent service entry points

Dedicated packages under [service-plugins](service-plugins) expose **Suno by Ace Data Cloud**, **Seedance by Ace Data Cloud**, **HappyHorse by Ace Data Cloud**, **GPT Image by Ace Data Cloud**, and **Nano Banana by Ace Data Cloud**. They share this source but register only their service media provider and tools, use separate keys, and can coexist with the collection. Publication is verified per package and version; consult each ClawHub listing rather than inferring availability from this source. Each README has the exact future package ID, API token steps, native auth choice and same-task result workflow.
