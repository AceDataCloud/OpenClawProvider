---
name: ace-suno
description: Use Suno through Ace Data Cloud for music and lyrics generation, reference uploads, MP3/WAV/MP4/MIDI/timing retrieval, voice and persona creation/deletion, projects/custom models, mashup/style enhancement, and same-task status retrieval; paid and destructive operations need user authorization.
---

# Suno via Ace Data Cloud

Use this independently installed service plugin's optional tools only when the operator has enabled them. Common media generation also uses OpenClaw native media providers.

- `ace_service_suno_generate_audios`: Generate songs with Ace Data Cloud Suno Audios API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_generate_lyrics`: Generate Lyrics through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_upload_reference_audio`: Upload Reference Audio through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_get_mp4`: Get Mp4 through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_get_mp3`: Get Mp3 through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_get_wav`: Get Wav through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_get_midi`: Get Midi through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_get_timing`: Get Timing through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_create_vox_audio`: Create Vox Audio through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_enhance_style`: Enhance Style through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_mashup_lyrics`: Mashup Lyrics through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_create_voice`: Create Voice through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_create_persona`: Create Persona through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_list_personas`: List Personas through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_delete_persona`: Delete Persona through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_custom_models`: Custom Models through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_projects`: Projects through the Ace Data Cloud Suno API. For asynchronous results, preserve task_id and use the task retrieval tool until completion. A successful submission is not completed output.
- `ace_service_suno_task_retrieve`: Query the existing task ID; do not repeat generation while it is pending.
- `ace_service_suno_tasks_retrieve_batch`: Query existing task IDs. Each item retains its own terminal or pending status.

Prompts/reference URLs go to `api.acedata.cloud`. Billable operations consume Ace Credits; premium models, duration, counts and resolution may increase cost. There is no extra provider-specific payment dialog. Follow the user's requested budget/settings and OpenClaw tool policy. Never choose another model as a fallback.

Treat task submission as pending. Save its task ID and call the service task retrieval tool; do not submit the same generation again after a timeout. Only terminal successful output is success. Deleting or archiving requires the user's request and `confirm: true`. Never put API keys in tool inputs.
