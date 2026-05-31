import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/live/**/*.test.ts"],
    environment: "node",
    testTimeout: 600_000,
  },
});
