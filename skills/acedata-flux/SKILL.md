---
name: acedata-flux
description: Use Flux through Ace Data Cloud for generate image, edit image, generate video, task retrieve, tasks retrieve batch.
---

# Flux via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_flux_generate_image`: Generate images with Ace Data Cloud Flux Images Generation API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_flux_edit_image`: Edit an image with Ace Data Cloud Flux Images Generation API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_flux_generate_video`: Use the Ace Data Cloud Flux APIs in Dify workflows. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_flux_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `acedata_flux_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
