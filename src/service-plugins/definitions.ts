export const SERVICE_PLUGINS = [
  { service: "suno", label: "Suno", id: "ace-suno", packageName: "@acedatacloud/suno-openclaw", envVar: "ACEDATA_SUNO_API_KEY", kind: "music", model: "chirp-v6", action: "suno_generate_audios", searchTerms: ["suno", "music", "lyrics"] },
  { service: "seedance", label: "Seedance", id: "ace-seedance", packageName: "@acedatacloud/seedance-openclaw", envVar: "ACEDATA_SEEDANCE_API_KEY", kind: "video", model: "doubao-seedance-2-0-mini-260615", action: "seedance_generate_video", searchTerms: ["seedance", "video", "text-to-video"] },
  { service: "happyhorse", label: "HappyHorse", id: "ace-happyhorse", packageName: "@acedatacloud/happyhorse-openclaw", envVar: "ACEDATA_HAPPYHORSE_API_KEY", kind: "video", model: "happyhorse-1.0-t2v", action: "happyhorse_generate_video", searchTerms: ["happyhorse", "happy horse", "video"] },
  { service: "gpt-image", label: "GPT Image", id: "ace-gpt-image", packageName: "@acedatacloud/gpt-image-openclaw", envVar: "ACEDATA_GPT_IMAGE_API_KEY", kind: "image", model: "gpt-image-2", action: "gpt_image_generate_image", searchTerms: ["gpt image", "gpt-image", "image editing"] },
  { service: "nano-banana", label: "Nano Banana", id: "ace-nano-banana", packageName: "@acedatacloud/nano-banana-openclaw", envVar: "ACEDATA_NANO_BANANA_API_KEY", kind: "image", model: "nano-banana-2-lite", action: "nano_banana_generate_image", searchTerms: ["nano banana", "nano-banana", "image editing"] },
] as const;
export type ServicePluginDefinition = (typeof SERVICE_PLUGINS)[number];
