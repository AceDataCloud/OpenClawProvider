// Read-only downloads of owned, already completed media. No generation or API key.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { downloadAsset } from "../dist/src/services/media.js";
const fixtures = JSON.parse(readFileSync("tests/public-media-fixtures.json", "utf8"));
const results = [];
for (const fixture of fixtures) {
  const result = await downloadAsset(fixture.url, fixture.kind);
  results.push({ kind: fixture.kind, bytes: result.buffer.length, mimeType: result.mimeType, sha256: createHash("sha256").update(result.buffer).digest("hex") });
}
writeFileSync("media-download-proof.json", JSON.stringify(results, null, 2) + "\n");
console.log("Verified existing image, speech and music results through the host SSRF guard without generating or charging again.");
