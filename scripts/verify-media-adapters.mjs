// Contract integration replay: API responses are recorded successful fixtures;
// media delivery uses real public downloads. This never creates a new paid task.
import plugin from "../dist/index.js";
import { readFileSync, writeFileSync } from "node:fs";
const fixtures = JSON.parse(readFileSync("tests/completed-media-fixtures.json", "utf8"));
const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.origin !== "https://api.acedata.cloud") return originalFetch(input, init);
  const body = JSON.parse(init.body);
  calls.push({ path: url.pathname, model: body.model, text: body.text, voice: body.reference_id });
  const fixture = url.pathname.startsWith("/nano-banana/") ? fixtures.image : url.pathname.startsWith("/fish/") ? fixtures.speech : url.pathname.startsWith("/suno/") ? fixtures.music : undefined;
  if (!fixture) throw new Error(`Unexpected mocked API ${url.pathname}`);
  return new Response(JSON.stringify(fixture.response), { headers: {"content-type":"application/json"} });
};
const providers = { images: [], music: [], speech: [] };
const api = new Proxy({runtime:{modelAuth:{resolveApiKeyForProvider:async()=>({apiKey:"fixture-key"})}},registerImageGenerationProvider:p=>providers.images.push(p),registerMusicGenerationProvider:p=>providers.music.push(p),registerSpeechProvider:p=>providers.speech.push(p)}, {get:(target,key)=>target[key]??(()=>{})});
try {
  plugin.register(api);
  const image = await providers.images.find(p=>p.id==="acedatacloud-nano-banana").generateImage({provider:"acedatacloud-nano-banana",model:"nano-banana-2-lite",prompt:"fixture",cfg:{},count:1});
  const music = await providers.music[0].generateMusic({provider:"acedatacloud-suno",model:"chirp-v6",prompt:"fixture",cfg:{}});
  const speech = providers.speech[0];
  const providerConfig = speech.resolveConfig({cfg:{},rawConfig:{providers:{"acedatacloud-fish-audio":{model:"s2-pro"}}},timeoutMs:60000});
  const providerOverrides = speech.resolveTalkOverrides({params:{modelId:"s2-pro",voiceId:"fixture-voice"}});
  const voice = await speech.synthesize({text:"fixture",cfg:{},providerConfig,providerOverrides,target:"audio-file",timeoutMs:60000});
  if (image.images.length!==1 || music.tracks.length!==2 || !voice.audioBuffer.length) throw new Error("Native adapter returned incorrect assets");
  if (calls.length!==3 || calls[2].voice!=="fixture-voice") throw new Error("Native adapter made unexpected API calls or lost voice mapping");
  writeFileSync("media-adapter-proof.json",JSON.stringify({mode:"recorded-api-response replay with real guarded media downloads",newGenerationCalls:0,imageCount:image.images.length,musicTracks:music.tracks.length,speechBytes:voice.audioBuffer.length,apiRequests:calls},null,2)+"\n");
  console.log("Native image, music and speech adapters deliver correct assets from recorded completed responses.");
} finally { globalThis.fetch = originalFetch; }
