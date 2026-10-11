# Service capability reference

One Ace Data Cloud provider package includes the existing 89-model chat catalog and
17 service modules with 97 optional operations. The source baseline is the current
Dify service repositories, verified on October 11, 2026. Each contract records its
immutable repository commit. Full operation parameters are exposed in the tool schema.

Use native providers for ordinary image, video, music and speech generation. Use the
named optional tools for advanced operations, task recovery and batch retrieval.
A successful task submission is not completed output. Keep the task ID and retrieve
it until the result is terminal; never repeat creation just because polling timed out.

| Service | Operations | Stable optional tool names |
| --- | ---: | --- |
| Face Transform | 1 | `acedata_face_transform` |
| Fish Audio | 7 | `acedata_fish_generate_audio`, `acedata_fish_search_voices`, `acedata_fish_get_voice`, `acedata_fish_create_model`, `acedata_fish_create_voice`, `acedata_fish_task_retrieve`, `acedata_fish_tasks_retrieve_batch` |
| Flux | 5 | `acedata_flux_generate_image`, `acedata_flux_edit_image`, `acedata_flux_generate_video`, `acedata_flux_task_retrieve`, `acedata_flux_tasks_retrieve_batch` |
| Google Search | 1 | `acedata_serp_google` |
| GPT Image | 5 | `acedata_gpt_image_generate_image`, `acedata_gpt_image_edit_image`, `acedata_gpt_image_list_tasks`, `acedata_gpt_image_task_retrieve`, `acedata_gpt_image_tasks_retrieve_batch` |
| Grok | 4 | `acedata_grok_generate_video`, `acedata_grok_chat_completions`, `acedata_grok_task_retrieve`, `acedata_grok_tasks_retrieve_batch` |
| Happy Horse | 3 | `acedata_happyhorse_generate_video`, `acedata_happyhorse_task_retrieve`, `acedata_happyhorse_tasks_retrieve_batch` |
| Kling | 12 | `acedata_kling_generate_video`, `acedata_kling_generate_motion`, `acedata_kling_lip_sync`, `acedata_kling_talking_photo`, `acedata_kling_goods_studio`, `acedata_kling_video_commerce`, `acedata_kling_virtual_try_on`, `acedata_kling_apparel`, `acedata_kling_voices`, `acedata_kling_elements`, `acedata_kling_task_retrieve`, `acedata_kling_tasks_retrieve_batch` |
| Midjourney | 9 | `acedata_midjourney_imagine`, `acedata_midjourney_edits`, `acedata_midjourney_describe`, `acedata_midjourney_translate`, `acedata_midjourney_videos`, `acedata_midjourney_get_seed`, `acedata_midjourney_shorten`, `acedata_midjourney_task_retrieve`, `acedata_midjourney_tasks_retrieve_batch` |
| MiniMax H3 | 5 | `acedata_minimax_generate_video`, `acedata_minimax_list_tasks`, `acedata_minimax_delete_task`, `acedata_minimax_task_retrieve`, `acedata_minimax_tasks_retrieve_batch` |
| Nano Banana | 4 | `acedata_nano_banana_generate_image`, `acedata_nano_banana_edit_image`, `acedata_nano_banana_task_retrieve`, `acedata_nano_banana_tasks_retrieve_batch` |
| Qwen Image | 3 | `acedata_qwen_image`, `acedata_qwen_image_task_retrieve`, `acedata_qwen_image_tasks_retrieve_batch` |
| Seedance | 3 | `acedata_seedance_generate_video`, `acedata_seedance_task_retrieve`, `acedata_seedance_tasks_retrieve_batch` |
| Seedream | 5 | `acedata_seedream_generate_image`, `acedata_seedream_edit_image`, `acedata_seedream_decompose_image`, `acedata_seedream_task_retrieve`, `acedata_seedream_tasks_retrieve_batch` |
| Suno | 19 | `acedata_suno_generate_audios`, `acedata_suno_generate_lyrics`, `acedata_suno_upload_reference_audio`, `acedata_suno_get_mp4`, `acedata_suno_get_mp3`, `acedata_suno_get_wav`, `acedata_suno_get_midi`, `acedata_suno_get_timing`, `acedata_suno_create_vox_audio`, `acedata_suno_enhance_style`, `acedata_suno_mashup_lyrics`, `acedata_suno_create_voice`, `acedata_suno_create_persona`, `acedata_suno_list_personas`, `acedata_suno_delete_persona`, `acedata_suno_custom_models`, `acedata_suno_projects`, `acedata_suno_task_retrieve`, `acedata_suno_tasks_retrieve_batch` |
| Veo | 7 | `acedata_veo_generate_video`, `acedata_veo_extend_video`, `acedata_veo_edit_objects`, `acedata_veo_reshoot_video`, `acedata_veo_upsample_video`, `acedata_veo_task_retrieve`, `acedata_veo_tasks_retrieve_batch` |
| Wan | 4 | `acedata_wan_generate_video`, `acedata_wan3_generate`, `acedata_wan_task_retrieve`, `acedata_wan_tasks_retrieve_batch` |

## Enabling only the tools you need

```json
{
  "tools": {
    "alsoAllow": ["acedata_suno_generate_audios", "acedata_suno_task_retrieve"]
  }
}
```

Use your normal Ace Data Cloud provider credential. A key scoped to chat alone cannot
access media services. Configure service-scoped overrides under
`plugins.entries.acedatacloud.config.serviceCredentials.<service-id>.apiKey` when
needed. Do not put keys in prompts, tool arguments or issue reports.

## Native model references

Examples: `acedatacloud-nano-banana/nano-banana-2.1`,
`acedatacloud-gpt-image/gpt-image-2`, `acedatacloud-seedance/doubao-seedance-2-0-mini-260615`,
`acedatacloud-veo/veo31-fast`, `acedatacloud-suno/chirp-v6` and
`acedatacloud-fish-audio/s2-pro`. Native media model choice is separate from the chat
model. No media default replaces an existing user choice during onboarding.

## Scope and availability

Generation/edit/task APIs, controls and advanced operations match the pinned Dify
contracts. This does not claim every model, expensive parameter combination or destructive
operation has been executed live. Automated contract proof, native runtime proof and
representative real API results are recorded separately.

Hailuo, Luma and Producer have no successful Dify primary-workflow recovery evidence
as of this baseline and are not advertised as working capabilities. Sora is retired.
The model catalog does not silently convert image products into chat models. Realtime
voice, transcription, embeddings and perception must use their own verified API contracts;
text-to-speech is not a claim of support for those different capabilities.

## Billing and data

Generation and paid tools consume Ace Credits. Model, resolution, duration and count
affect cost. Reference files/URLs and prompts are sent to Ace Data Cloud. See the
[platform service pricing](https://platform.acedata.cloud) before choosing expensive
options. Each tool returns sanitized result data plus task/trace IDs. Service-specific
source schemas and defaults are checked in under `src/services/contracts/`.
