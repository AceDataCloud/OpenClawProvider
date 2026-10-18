# Provider architecture and distribution

## Decision

Maintain one canonical implementation in this repository. The full `@acedatacloud/openclaw-provider` collection remains available; five brand-specific packages expose only Suno, Seedance, HappyHorse, GPT Image or Nano Banana for independent discovery and installation.
Keep chat, search, shared transport, native media adapters and per-service contracts in separate modules.

| Option | Installation and auth | Maintenance/review | Discovery | Decision |
| --- | --- | --- | --- | --- |
| One package per service | Up to 18 installs and repeated setup | Many releases, scans and duplicated transport | Many similar listings; no guaranteed ranking benefit | Selected for five branded services; unique runtime IDs, contracts, keys and native providers |
| LLM package plus media package | Two installs; shared credentials need coordination | Two release/security boundaries | Clear category split | Reasonable if ownership or dependencies diverge later |
| One vendor provider, modular capabilities | One install; shared key or optional service-scoped keys | One reviewed transport; independently tested adapters | Models category plus native media capability discovery, named service models and tools | Complementary collection |

OpenClaw's provider guide registers media and search beside text inference. Its OpenAI,
Google, MiniMax and fal providers use that pattern. A plugin is an ownership boundary;
a capability is a host contract. Dify's independent package convention is not an
OpenClaw requirement. We do not add vendor-specific code to core.

- [Provider media and search](https://docs.openclaw.ai/plugins/sdk-provider-plugins/media-and-search)
- [Provider voice](https://docs.openclaw.ai/plugins/sdk-provider-plugins/voice-and-audio)
- [Adding capabilities](https://docs.openclaw.ai/plugins/adding-capabilities)
- [Manifest model fields](https://docs.openclaw.ai/plugins/manifest/models)
- [ClawHub publishing](https://github.com/openclaw/clawhub/blob/main/docs/publishing.md)

## Native contracts and advanced tools

Use native image/video/music/speech/search providers for common generation. The host
owns model selection and its normal policy and delivery behavior. We do not introduce
model fallback or replace a requested model. Advanced operations use optional,
namespaced tools registered in `contracts.tools`; operators allowlist only what they
need. Tool metadata exists before runtime loading. Native media models are registered
in the unified model catalog with service-specific provider IDs and labels.

The public Dify request contracts are reused at pinned source commits, with one shared
TypeScript request validator, authentication/transport and task-normalization layer.
Every creation request is sent once. A pending/timeout result preserves the task ID;
retrieval never resubmits generation. Deletions/archive operations require explicit
`confirm: true`. Returned data omits credentials, raw requests and internal routes.

All authenticated API calls go to `https://api.acedata.cloud` with redirects disabled.
Generated media downloads carry no API key and use OpenClaw's public SSRF guard and
bounded response reads. Reference URLs and prompts go to the service to perform the
requested operation. Advanced media tools can incur Ace Credits without a separate
provider-specific approval dialog: normal OpenClaw policy still applies. Larger counts,
higher resolutions and premium models may cost more. Install consent is not a spending
cap. Use service-scoped credentials and the platform's own account limits where needed.

## Discovery and truthful marketing

Use the single `models` category and actual native media contracts. OpenClaw derives
Media membership for enabled plugins that declare generation capabilities. Include
service names, concrete examples and exact tool/model identifiers in documentation,
skill descriptions and package metadata; do not repeat near-identical packages to
influence ranking. Use the original Ace Data Cloud logo. Names such as Suno/Veo identify
services accessible through Ace Data Cloud, not endorsements from those vendors.

An installable npm release, a ClawHub staged upload, a public market listing and an
official publisher badge are separate gates. Claims and links must match verified state.

## Independent branded discovery (2026-10-18)

ClawHub permits independent packages, but requires unique runtime IDs within a publisher. The five packages in `service-plugins/` use service-specific IDs, credentials and native model references; optional tool names are distinct from the collection. No chat model is added or selected by a media-only service package. Existing explicit media defaults are preserved. The same contract client, polling, validation and media adapters are reused; generated artifacts contain only that service API contract. No new routing, price or fallback is added.

`pnpm build:services` materializes five packages from canonical source. Their READMEs identify them as release candidates until npm/ClawHub publication, security checks, public brand search and independent installation are verified. Source PR is not a listing. Skill-only entries have separate ownership in Skills and do not install these code plugins.

Official default provider discovery remains separate: OpenClaw external-provider catalog supports reviewed external packages, but current VISION directs vendor promotion to ClawHub and default/core promotion requires maintainer ownership and product/security justification. The installed collection auth choice is not proof of fresh-host default inclusion.
