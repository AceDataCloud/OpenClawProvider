---
name: acedata-midjourney
description: Use Midjourney through Ace Data Cloud for imagine, edits, describe, translate, videos.
---

# Midjourney via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_midjourney_imagine`: Generate or transform images via Ace Data Cloud Midjourney Imagine API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_edits`: Edit an image via Ace Data Cloud Midjourney Edits API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_describe`: Get descriptions for an image via Ace Data Cloud Midjourney Describe API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_translate`: Translate Chinese prompt to English via Ace Data Cloud Midjourney Translate API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_videos`: Generate or extend videos via Ace Data Cloud Midjourney Videos API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_get_seed`: Get Seed through the Ace Data Cloud Midjourney API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_shorten`: Shorten through the Ace Data Cloud Midjourney API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_midjourney_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `acedata_midjourney_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
