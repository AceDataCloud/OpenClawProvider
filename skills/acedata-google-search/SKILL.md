---
name: acedata-google-search
description: Use Google Search through Ace Data Cloud for serp google.
---

# Google Search via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_serp_google`: Get structured Google SERP results via Ace Data Cloud Google SERP API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
