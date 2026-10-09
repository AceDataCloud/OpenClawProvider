# Supported model catalog

The plugin includes **89 public chat models** across seven families, refreshed on October 6, 2026. Catalog membership is derived from the [published Ace Data Cloud directory](https://platform.acedata.cloud/api/v1/models/catalog/?modality=chat) and each bound API contract. Models are not restricted to the subset used for smoke tests.

Each request preserves the selected public model ID. The plugin does not add fallback or substitute models. Unknown IDs are not assigned invented capabilities. The three excluded chat-classified products (`gpt-4o-all`, `gpt-4o-image`, `gpt-5.1-all`) expose image-generation or mixed-product behavior, not this standard text-inference contract. Runtime discovery also contains embeddings, image models and retired entries; those do not become chat models.

## Protocols and capabilities

| Protocol         | Models | Routing                                                            |
| ---------------- | -----: | ------------------------------------------------------------------ |
| Chat Completions |     82 | `/openai`, `/v1`, `/gemini`, `/grok`, `/deepseek`, `/kimi`, `/glm` |
| Responses        |      5 | `/openai/responses`                                                |
| Messages         |      2 | `/v1/messages`, with explicit Bearer authentication                |

Input and reasoning metadata are model-specific. Image input is advertised only when both the model definition and the current public Ace Data Cloud catalog support it. Native PDF/audio/video input is not copied onto Chat Completions models. Reasoning levels and toggles use the selected host protocol; toggle-only hosts do not receive an unsupported `reasoning_effort`.

Context/output limits use the reviewed public model definitions from [Models.dev](https://github.com/anomalyco/models.dev/tree/dev/models). The four public API aliases `gpt-4`, `gpt-4o`, `gemini-2.5-flash-lite`, and `gemini-3.5-flash-lite` use conservative plugin budgets, and do not claim a specific canonical checkpoint. Account access, service limits, and upstream availability may impose additional limits.

## Model list

| Model                        | API                | Image input | Reasoning controls                  |
| ---------------------------- | ------------------ | ----------- | ----------------------------------- |
| `claude-3-5-haiku-20241022`  | openai-completions | no          | —                                   |
| `claude-3-5-sonnet-20240620` | openai-completions | yes         | —                                   |
| `claude-3-5-sonnet-20241022` | openai-completions | yes         | —                                   |
| `claude-3-7-sonnet-20250219` | openai-completions | yes         | low, medium, high                   |
| `claude-3-haiku-20240307`    | openai-completions | yes         | —                                   |
| `claude-3-sonnet-20240229`   | openai-completions | yes         | —                                   |
| `claude-fable-5`             | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-fable-5-1`           | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-haiku-4-5-20251001`  | openai-completions | yes         | low, medium, high, max              |
| `claude-opus-4-1-20250805`   | openai-completions | yes         | low, medium, high                   |
| `claude-opus-4-20250514`     | openai-completions | yes         | low, medium, high                   |
| `claude-opus-4-5-20251101`   | openai-completions | yes         | low, medium, high                   |
| `claude-opus-4-6`            | openai-completions | yes         | low, medium, high                   |
| `claude-opus-4-7`            | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-opus-4-8`            | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-opus-5`              | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-opus-5-5`            | anthropic-messages | yes         | low, medium, high, xhigh, max       |
| `claude-sonnet-4-20250514`   | openai-completions | yes         | low, medium, high                   |
| `claude-sonnet-4-5-20250929` | openai-completions | yes         | low, medium, high                   |
| `claude-sonnet-4-6`          | openai-completions | yes         | low, medium, high, max              |
| `claude-sonnet-5`            | openai-completions | yes         | low, medium, high, xhigh, max       |
| `claude-sonnet-5-5`          | anthropic-messages | yes         | low, medium, high, xhigh, max       |
| `deepseek-r1`                | openai-completions | no          | model-managed                       |
| `deepseek-r1-0528`           | openai-completions | no          | model-managed                       |
| `deepseek-v3`                | openai-completions | no          | —                                   |
| `deepseek-v3-250324`         | openai-completions | no          | —                                   |
| `deepseek-v3.2-exp`          | openai-completions | no          | on/off                              |
| `deepseek-v4-flash`          | openai-completions | no          | on/off; low, high, max              |
| `deepseek-v4-pro`            | openai-completions | no          | on/off; low, high, max              |
| `deepseek-v4.1-flash`        | openai-completions | no          | on/off; low, high, max              |
| `gemini-2.5-flash`           | openai-completions | yes         | low, medium, high                   |
| `gemini-2.5-flash-lite`      | openai-completions | yes         | —                                   |
| `gemini-2.5-pro`             | openai-completions | yes         | low, medium, high                   |
| `gemini-3-flash-preview`     | openai-completions | yes         | minimal, low, medium, high          |
| `gemini-3.1-flash-lite`      | openai-completions | yes         | minimal, low, medium, high          |
| `gemini-3.1-pro-preview`     | openai-completions | yes         | low, medium, high                   |
| `gemini-3.5-flash`           | openai-completions | yes         | minimal, low, medium, high          |
| `gemini-3.5-flash-lite`      | openai-completions | yes         | —                                   |
| `gemini-3.6-flash`           | openai-completions | yes         | minimal, low, medium, high          |
| `gemini-3.7-flash`           | openai-completions | yes         | low, medium, high                   |
| `gemini-3.8-flash`           | openai-completions | yes         | low, medium, high                   |
| `glm-4.6`                    | openai-completions | no          | on/off                              |
| `glm-4.7`                    | openai-completions | no          | on/off                              |
| `glm-5`                      | openai-completions | no          | on/off                              |
| `glm-5-turbo`                | openai-completions | no          | on/off                              |
| `glm-5.1`                    | openai-completions | no          | on/off                              |
| `glm-5.2`                    | openai-completions | no          | high, max                           |
| `glm-5.3`                    | openai-completions | no          | low, high, max                      |
| `gpt-4`                      | openai-completions | no          | —                                   |
| `gpt-4.1`                    | openai-completions | yes         | —                                   |
| `gpt-4.1-mini`               | openai-completions | yes         | —                                   |
| `gpt-4.1-nano`               | openai-completions | yes         | —                                   |
| `gpt-4o`                     | openai-completions | yes         | —                                   |
| `gpt-4o-mini`                | openai-completions | yes         | —                                   |
| `gpt-5`                      | openai-completions | yes         | minimal, low, medium, high          |
| `gpt-5-mini`                 | openai-completions | yes         | low, medium, high                   |
| `gpt-5-nano`                 | openai-completions | yes         | minimal, low, medium, high          |
| `gpt-5-pro`                  | openai-responses   | yes         | high                                |
| `gpt-5.1`                    | openai-completions | yes         | none, low, medium, high             |
| `gpt-5.2`                    | openai-completions | yes         | none, low, medium, high, xhigh      |
| `gpt-5.4`                    | openai-completions | yes         | none, low, medium, high, xhigh      |
| `gpt-5.4-mini`               | openai-completions | yes         | none, low, medium, high, xhigh      |
| `gpt-5.4-nano`               | openai-completions | yes         | none, low, medium, high, xhigh      |
| `gpt-5.4-pro`                | openai-responses   | yes         | medium, high, xhigh                 |
| `gpt-5.5`                    | openai-completions | yes         | none, low, medium, high, xhigh      |
| `gpt-5.5-pro`                | openai-responses   | yes         | medium, high, xhigh                 |
| `gpt-5.6-luna`               | openai-completions | yes         | none, low, medium, high, xhigh, max |
| `gpt-5.6-sol`                | openai-completions | yes         | none, low, medium, high, xhigh, max |
| `gpt-5.6-terra`              | openai-completions | yes         | none, low, medium, high, xhigh, max |
| `gpt-6-astra`                | openai-completions | yes         | low, medium, high, xhigh, max       |
| `gpt-6-luna`                 | openai-completions | yes         | none, low, medium, high, xhigh, max |
| `gpt-6-sol`                  | openai-completions | yes         | none, low, medium, high, xhigh, max |
| `gpt-6.1-sol`                | openai-completions | yes         | low, medium, high, xhigh, max       |
| `grok-3`                     | openai-completions | no          | —                                   |
| `grok-4`                     | openai-completions | no          | low, medium, high                   |
| `grok-4.5`                   | openai-completions | yes         | low, medium, high                   |
| `grok-4.7`                   | openai-completions | yes         | low, medium, high, xhigh            |
| `kimi-k2-thinking`           | openai-completions | no          | model-managed                       |
| `kimi-k2-thinking-turbo`     | openai-completions | no          | model-managed                       |
| `kimi-k2.5`                  | openai-completions | no          | on/off                              |
| `kimi-k2.6`                  | openai-completions | yes         | on/off                              |
| `kimi-k3`                    | openai-completions | yes         | low, high, max                      |
| `o1`                         | openai-completions | no          | low, medium, high                   |
| `o1-mini`                    | openai-completions | no          | model-managed                       |
| `o1-pro`                     | openai-responses   | no          | low, medium, high                   |
| `o3`                         | openai-completions | yes         | low, medium, high                   |
| `o3-mini`                    | openai-completions | no          | low, medium, high                   |
| `o3-pro`                     | openai-responses   | yes         | low, medium, high                   |
| `o4-mini`                    | openai-completions | yes         | low, medium, high                   |

## Cost estimates

Per-model USD-per-million-token values are calculated from the exact public API billing expressions and each service's current entry package. On October 6, 2026, the referenced package is $7 / 40 Credits ($0.175/Credit). Cached-input and cache-write fields are included when metered. Zero for an unmetered cache field is not a free-inference or cache-capability promise. Long-context pricing uses half-open token ranges matching the API condition boundaries.

For example, GPT-4.1 mini input/output/cached-input estimates are $0.147173075 / $0.588692650 / $0.036793225 per million tokens. Native Messages cached input and cache creation are separate token counters; their estimates are not derived by subtracting cache tokens twice. The account's package, usage, and billed amount remain authoritative.

All 89 models were checked with 534 short/long-context ordinary-input, cache-read, and cache-write pricing samples. Representative production tools tests cover all seven families, and separate protocol tests cover native Responses and Messages; this does not claim every model/control has been individually invoked.

## Maintenance

`src/chat/model-catalog.json` is the reviewed source snapshot, with per-model public API references, package rates and metadata. `pnpm sync-catalog` generates runtime and manifest entries from the same source; `pnpm sync-catalog:check` prevents projection drift. Refresh the published directory and bound API records together, then update metadata for every added or changed model instead of restricting membership to tested examples. Never use the billing-rule inventory alone as a public model list.
