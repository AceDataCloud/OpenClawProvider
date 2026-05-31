import { describe, expect, it } from "vitest";
import pluginEntry from "../index.js";

describe("plugin manifest", () => {
  it("exposes the acedatacloud provider id", () => {
    expect(pluginEntry.id).toBe("acedatacloud");
    expect(pluginEntry.name).toContain("Ace Data Cloud");
    expect(typeof pluginEntry.register).toBe("function");
  });
});
