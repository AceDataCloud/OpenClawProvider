# Seedance by Ace Data Cloud for OpenClaw

Use Seedance through Ace Data Cloud without installing the all-services provider. This vendor-maintained integration is not an official Seedance endorsement. It registers only this service's native video provider, 3 optional tools, and a service usage skill. Your chat provider stays unchanged.

**Independent service release. Before installing, check that the linked ClawHub listing shows this package and an approved published version; source code or CI alone does not prove publication. The package may be available on ClawHub before npm.**

## 1. Find and install the dedicated plugin

Search **Seedance** in [ClawHub Plugins](https://clawhub.ai/plugins) and verify **by Ace Data Cloud**, owner **acedatacloud**, package **@acedatacloud/seedance-openclaw**. Official distribution URL: [Seedance listing](https://clawhub.ai/acedatacloud/plugins/seedance-openclaw).

```sh
openclaw plugins install clawhub:@acedatacloud/seedance-openclaw
```

Use the public command only when the listing shows a published version. Maintainers separately verify exact packed archives before upload. This plugin has its own runtime ID, native provider and tool names, so it can coexist with the Ace collection and other service plugins without duplicate registrations. A Skill-only ClawHub entry is a separate product: it does not install this code plugin.

## 2. Register, sign in and copy a scoped API token

1. Register or sign in at [Ace Data Cloud → Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=seedance_openclaw_readme_api_key). Open **General application**; if absent, choose **Initialize General Application**. A general key can access the services available to your account; a service-specific application is limited to its service.
2. Copy its API Key, or choose **Manage Keys → Create** for a separately named OpenClaw key. Check expiration, usage limitation and **Allowed APIs**. Allow this service's generation/edit operations and task retrieval; task-query permission alone does not permit generation.
3. Confirm Seedance service/model access, current [pricing and balance](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=seedance_openclaw_readme_pricing). No free generation or fixed trial allowance is promised.
4. Copy only the token, with no quotes or Bearer prefix. A platform-management token cannot replace an application generation API token. Never put secrets in prompts, workflow exports, screenshots or commits.

![Application API Key controls; real platform screenshot, reference 2026-10-18](https://raw.githubusercontent.com/AceDataCloud/SunoDify/8d3d03570e73324220f111f7fe343da0792a8071/_assets/tutorial/get-api-key-en.png)

![Optional separate restricted key; real platform screenshot, reference 2026-10-18](https://raw.githubusercontent.com/AceDataCloud/SunoDify/8d3d03570e73324220f111f7fe343da0792a8071/_assets/tutorial/create-api-key-en.png)

## 3. Paste the key in OpenClaw

After this plugin is installed, run its provider-specific interactive key login and paste the token into the **Seedance by Ace Data Cloud** prompt:

```sh
openclaw models auth login --provider ace-seedance --method api-key
```

The dedicated environment variable is `ACEDATA_SEEDANCE_API_KEY`. Its optional native configuration field is `plugins.entries.ace-seedance.config.apiKey` (also accepts the host's supported SecretRef). Keys never belong in tool arguments. Existing explicit media selections are preserved. Only the selected service is authorized; no collection/chat key is silently reused.

![OpenClaw native layout reference; official original screenshot 2026-08-31, not this service's running proof](https://raw.githubusercontent.com/openclaw/openclaw/b461dc69d67d58b98f0f9fe9fb03cd42a67cda0f/.github/pr-proof/working-claw-centering/after-full.png)

This is an unmodified official screenshot of the native chat UI, not this dedicated auth prompt; it is not proof of this unpublished plugin's UI, successful generation or official status. Follow the exact CLI auth choice above.

## 4. First use and the same task after a timeout

Local plugin/credential inventory inspection does not generate media. Native media discovery is separate from the text-model list:

```sh
openclaw plugins inspect ace-seedance --runtime --json
openclaw models auth list --provider ace-seedance --json
```

When balance, model access and the user's budget are confirmed, use the native video capability or allow the optional `ace_service_seedance_generate_video` tool. Example (paid; not executed by this guide):

```sh
openclaw infer video generate --model ace-seedance/doubao-seedance-2-0-mini-260615 --prompt "A blue circle on a white background"
```

For an async response, save `task_id`. Allow `ace_service_seedance_task_retrieve` with that exact ID and `wait_seconds=0` for one read, or a bounded wait when needed. Pending, an accepted submission or a preview URL is not terminal success. After timeout/delivery failure, retrieve the same ID; do not generate again. Only completed output and downloaded/usable media prove delivery. Check the trace/task in [usage history](https://platform.acedata.cloud/console/usages?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=seedance_openclaw_readme_usage) for the final charge; install/search counts are not revenue.

## 5. Permissions, costs and troubleshooting

Prompts/reference URLs go to https://api.acedata.cloud; billable operations consume Credits. Model/count/resolution/duration affect price. No extra plugin payment dialog is added; installation is not unlimited spending approval. Destructive tools need explicit confirm=true. API requests reject credential redirects; returned media downloads use the host SSRF guard without your token. No shell/filesystem/background-service tools are registered.

- 401: check raw copied token, expiry, application/API access, usage cap and balance.
- No provider: inspect the exact plugin ID and a compatible OpenClaw version (tested stable is recorded in CI; minimum declaration is not universal old-version proof).
- Source/provenance warning: inspect it and review the publisher; an allowlist permits loading but does not grant official trust. Do not disable protections to remove the warning.
- Media pending/failed: keep the task/trace and inspect its state; do not retry creation blindly or substitute another model.
- Managed instance: its platform wizard seeds one chat model/key, not this plugin. Separately install and authorize the service if permitted; deployment duration and API usage are billed separately.

[Source](https://github.com/AceDataCloud/OpenClawProvider) · [Pricing](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=seedance_openclaw_readme_pricing) · [Issues](https://github.com/AceDataCloud/OpenClawProvider/issues)
