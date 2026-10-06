# Ace Data Cloud provider for OpenClaw

An Ace Data Cloud maintained model provider and Google web-search plugin.
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

The model catalog is deliberately limited to validated Chat Completions behavior.
See [model support and cost estimates](docs/model-catalog.md) before upgrading
from the previous broad catalog. No automatic fallback changes the chosen model.

[Setup and validation cookbook](docs/cookbook.md) includes environment-key setup,
model selection, and optional web search.

## Credentials and network access

Chat sends the selected model's prompts and tool messages to
`https://api.acedata.cloud/openai/chat/completions` with the user's API key.
Optional search sends the query to `https://api.acedata.cloud/serp/google`.
The plugin has no shell commands, filesystem tools, or background service.
Use a service-scoped key where possible; cross-service use needs appropriate access.
Never send API keys to maintainers or attach them to issue reports.

## Development

Use Node 24.16+ and pnpm 9.15.4. The published OpenClaw SDK is pinned as a development
dependency, so no sibling source checkout is needed.

```sh
pnpm install --frozen-lockfile
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
