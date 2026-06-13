# `@acedatacloud/openclaw-provider`

[![npm](https://img.shields.io/npm/v/@acedatacloud/openclaw-provider?logo=npm)](https://www.npmjs.com/package/@acedatacloud/openclaw-provider)
[![CI](https://github.com/AceDataCloud/OpenClawProvider/actions/workflows/ci.yml/badge.svg)](https://github.com/AceDataCloud/OpenClawProvider/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [OpenClaw](https://github.com/openclaw/openclaw) provider plugin that surfaces the entire **Ace Data Cloud** AI stack — **chat, image generation, video generation, music generation, and web search** — through a single OpenAI-compatible endpoint.

> 50+ LLMs (Claude, GPT, Gemini, Grok, DeepSeek, Kimi, GLM, Qwen, …) **+** Midjourney, Flux, Seedream, NanoBanana, gpt-image-2 **+** Sora, Veo, Kling, Luma, Hailuo, Wan, Seedance, Pixverse **+** Suno, Producer **+** Google Web Search. One plugin, one API key.

## Install

```bash
openclaw plugins install npm:@acedatacloud/openclaw-provider
```

Then run onboarding:

```bash
openclaw onboard --auth-choice acedatacloud-api-key --acedata-api-key <YOUR_KEY>
```

Get a key at [`platform.acedata.cloud/console/applications`](https://platform.acedata.cloud/console/applications) — first credentials include free credits.

## What you get in v2026.5.34

| Capability | Status | Notes |
|---|---|---|
| **Chat** | ✅ shipping | 62 curated models (Claude opus/sonnet/haiku, GPT-4.1/4o/5.x, o-series, Gemini 3.x, Grok 4, DeepSeek V3/R1/V4, Kimi K2, GLM 5) — plus any model id you pass through (e.g. `acedatacloud/gpt-5.4-mini`) via `resolveDynamicModel` |
| **Web Search** | ✅ shipping | Google SERP — supports `search` / `images` / `news` / `videos` / `maps` / `places` verticals |
| **Image generation** | 🚧 follow-up PR | Midjourney, Flux dev/pro/kontext, Seedream 4 / 4.5, NanoBanana / NanoBanana Pro, `gpt-image-2` — currently exposed via chat-style passthrough; native `ImageGenerationProvider` is planned |
| **Video generation** | 🚧 follow-up PR | Sora, Veo 3 / 3.1-fast, Kling 2.1, Luma Ray 2, Hailuo 02, Wan 2.5, Seedance 1 Pro, Pixverse 4.5 — needs an async task-polling adapter |
| **Music generation** | 🚧 follow-up PR | Suno v5, Producer — needs an async task-polling adapter |

## Status

**v2026.5.34.** Chat (62 models, dynamic-id passthrough) and web search are shipping and validated end-to-end on `openclaw >= 2026.4.2`. v2026.5.34 fixes a non-interactive onboarding bug: the auth `optionKey` is now `acedataApiKey` so `openclaw onboard --auth-choice acedatacloud-api-key --acedata-api-key <key>` receives the flag value instead of failing with `Missing --acedata-api-key`. Image / video / music modality providers are tracked as follow-ups — see the [PR board](https://github.com/AceDataCloud/OpenClawProvider/pulls) and the [plan](https://github.com/AceDataCloud/Index/blob/main/.plans/OPENCLAW-PROVIDER.md).

Full setup guide: **[docs/cookbook.md](docs/cookbook.md)**.

## Configuration

Set either env var (OpenClaw reads both):

```bash
export ACEDATA_API_KEY="..."
# or
export ACEDATACLOUD_API_KEY="..."
```

Or pass `--acedata-api-key <key>` on the CLI.

## Billing

Billing is computed on the Ace Data Cloud platform side (per-request credits). To avoid double-estimation, this plugin reports `cost: 0` in OpenClaw's model catalog — see your real usage at [`platform.acedata.cloud/console/usages`](https://platform.acedata.cloud/console/usages).

## Development

```bash
# Clone next to a checkout of openclaw/openclaw (we use its workspace SDK)
git clone https://github.com/openclaw/openclaw.git ../openclaw
git clone https://github.com/AceDataCloud/OpenClawProvider.git
cd OpenClawProvider
pnpm install      # or npm install
pnpm test         # vitest unit
pnpm build        # tsc -> dist/
pnpm test:live    # requires ACEDATA_API_KEY in env, real api.acedata.cloud calls
```

## Contributing

PRs welcome. Please open an issue first for non-trivial changes. See [CONTRIBUTING](.github/CONTRIBUTING.md) (TBD).

## License

[MIT](LICENSE) © Ace Data Cloud
