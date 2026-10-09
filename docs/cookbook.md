# Configure Ace Data Cloud in OpenClaw

Install the published version and use the onboarding prompt for the API key:

```sh
openclaw plugins install npm:@acedatacloud/openclaw-provider@2026.10.1 --pin
openclaw onboard --auth-choice acedatacloud-api-key
```

Version 2026.10.1 is a release candidate until publication. The package is vendor
maintained; an npm install does not imply OpenClaw bundling or ClawHub approval.

For environment-based authentication, set `ACEDATA_API_KEY` or
`ACEDATACLOUD_API_KEY` in the environment where OpenClaw runs. Non-interactive
onboarding accepts `--acedata-api-key`; prefer the interactive prompt to avoid
putting keys in shell history.

Select a model and inspect the full available catalog:

```sh
openclaw models set acedatacloud/gpt-4.1-mini
openclaw models list --provider acedatacloud
openclaw infer model run --model acedatacloud/gpt-4.1-mini --prompt "Reply with OPENCLAW_OK" --local
```

Each model selects its documented API and base URL. Claude Opus/Sonnet 5.5 use
Messages with Bearer authentication; Responses-only models use Responses. Other
models use their family's Chat Completions endpoint. See [the supported
catalog](model-catalog.md) for all 89 model IDs, capabilities, and reference costs.
Image, video, and music generation are separate capabilities.

```sh
openclaw models set acedatacloud/gpt-6.1-sol
openclaw models set acedatacloud/claude-sonnet-5-5
openclaw models set acedatacloud/gemini-3.8-flash
```

The default remains GPT-4.1 mini for new installations. Existing model selections
are preserved. The model picker exposes only the selected model's supported
reasoning controls; account access and balance still apply.

## Optional web search

An appropriately scoped search API key is required. The plugin reuses the named
environment variables, or reads an explicit plugin-scoped search key:

```json
{
  "plugins": {
    "entries": {
      "acedatacloud": {
        "enabled": true,
        "config": { "webSearch": { "apiKey": "YOUR_SEARCH_KEY" } }
      }
    }
  }
}
```

```sh
openclaw infer web search --provider acedatacloud --query "OpenClaw" --limit 2 --json
```

Search uses `/serp/google`, separately from the model base URL. If required, the
plugin's `webSearch.baseUrl` overrides the search service origin; only set it to a
service you trust with that search key. The model authentication profile is not
automatically the search credential.

## Publishing and verification

Build and inspect an exact tarball before submitting it to ClawHub. Include the
public GitHub commit and package version, then wait for publication checks.
After approval, verify `openclaw plugins search "Ace Data Cloud"`, install using
the exact ClawHub package/version, onboard in isolated state, and run a model turn.
Only then record a successful market-discovery milestone. Official publisher
status and default bundling require separate OpenClaw decisions.
