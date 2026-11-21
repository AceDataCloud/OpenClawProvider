---
name: acedata-acemusic
description: Create ACE Music songs from an idea or custom lyrics, upload owned references, cover or blend tracks, create lyrics, and query the original task.
---

# ACE Music

Use the provider's optional tools for an operation that the native music request cannot express. Use `acedata_acemusic_generate_music` for a concept. For a custom song use `acedata_acemusic_generate_custom_music` with the exact title, lyric and style. OpenClaw’s native music command accepts only a song concept. The host can discard unsupported lyrics or instrumental overrides before calling the provider. When the user supplies lyrics, call the custom music tool directly and preserve their title, lyric and style. Normal song generation supports `acemusic-v1.1` and `acemusic-v1`; covers and mashups use v1.1. Instrumental, duration and WAV controls are unavailable.

`acedata_acemusic_upload_audio` imports one public HTTPS MP3 for a separate charge. `acedata_acemusic_cover_audio` takes one owned audio ID. `acedata_acemusic_mashup_audio` takes two different compatible owned IDs. Both edits require lyrics and style. `acedata_acemusic_generate_lyrics` is separately priced. Confirm the intended charge before submitting.

Save the task ID and use `acedata_acemusic_task_retrieve`, `acedata_acemusic_task_batch` or `acedata_acemusic_task_list` for authenticated free queries. A successful song group has two candidates. A partial failure is terminal and can deliver one track. For a timeout or unknown submission, retain the same task ID. Do not rerun a paid submission to check status.
