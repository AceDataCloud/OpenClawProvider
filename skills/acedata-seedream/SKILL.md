---
name: acedata-seedream
description: Use Seedream through Ace Data Cloud for generate image, edit image, decompose image, task retrieve, tasks retrieve batch.
---

# Seedream via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_seedream_generate_image`: Generate image(s) with Ace Data Cloud Seedream Images API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_seedream_edit_image`: Edit image(s) with Ace Data Cloud Seedream Images API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_seedream_decompose_image`: Split one image into a base plus editable transparent layers. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_seedream_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `acedata_seedream_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
