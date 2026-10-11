---
name: acedata-kling
description: Use Kling through Ace Data Cloud for generate video, generate motion, lip sync, talking photo, goods studio.
---

# Kling via Ace Data Cloud

Use the provider's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `acedata_kling_generate_video`: Generate a video with Ace Data Cloud Kling Videos API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_generate_motion`: Generate Motion through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_lip_sync`: Lip Sync through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_talking_photo`: Talking Photo through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_goods_studio`: Goods Studio through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_video_commerce`: Video Commerce through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_virtual_try_on`: Virtual Try On through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_apparel`: Apparel through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_voices`: Voices through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_elements`: Elements through the Ace Data Cloud Kling API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `acedata_kling_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `acedata_kling_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
