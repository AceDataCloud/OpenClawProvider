# Supported chat catalog

The initial market submission includes `gpt-4.1-mini` on
`https://api.acedata.cloud/openai` using OpenAI Chat Completions.
A live SSE tool call returned `report_sum({"value":42})` on October 6, 2026.
Text input and tool calls are the validated scope. Vision is intentionally disabled
until the image path has separate proof. The plugin uses conservative operating
budgets of 128,000 context tokens and 8,192 output tokens; these are not claims
about the model's maximum advertised capacity.

The catalog does not infer capabilities from model names. Image-generation models,
Messages-only models, and unknown IDs are not synthesized as chat models.
The prior broad catalog contained unverified entries. Users with explicit older
model selections should select the supported model or supply their own verified
custom-provider model configuration before upgrading. No model substitution or
fallback is performed.

## Cost estimates

Source: [public Ace Data Cloud catalog](https://platform.acedata.cloud/api/v1/models/catalog/?modality=chat),
read October 6, 2026. The $7 / 40 Credits package gives $0.175 per Credit.
The exact public service formula per million tokens is:

- Input: 0.840989 Credits, or $0.147173075.
- Output: 3.363958 Credits, or $0.588692650.
- Cached input: (0.840989 - 0.630742) Credits, or $0.036793225.

OpenClaw's cost fields are estimates in USD per million tokens. Cache write has
no separate advertised rate and is represented as zero; it is not a cache-write
capability claim. Actual charges are determined by the account's package and
service rules; inspect [platform usage](https://platform.acedata.cloud/console/usages).

`src/chat/model-overrides.json` owns the explicit inclusion and capability list.
The existing generator only includes IDs with reviewed overrides; it no longer
fills unknown models with guessed capabilities. Run it with the billing source
using `pnpm sync-catalog --source=/path/to/PlatformBackend/cost/api/_chat_models.json`.
