---
name: acedata-fish-audio
description: Use Fish Audio through Ace Data Cloud for fish generate audio, fish search voices, fish get voice, fish create model, fish create voice.
---

# Fish Audio via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_fish_generate_audio`: Generate text-to-speech audio with the Ace Data Cloud Fish Audio API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_fish_search_voices`: Fish Search Voices via Ace Data Cloud. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_fish_get_voice`: Get Voice through the Ace Data Cloud Fish Audio API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_fish_create_model`: Create Model through the Ace Data Cloud Fish Audio API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_fish_create_voice`: Create Voice through the Ace Data Cloud Fish Audio API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_fish_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `acedata_fish_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
