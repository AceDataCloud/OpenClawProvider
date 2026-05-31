import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["tests/live/**", "node_modules", "dist"],
    environment: "node",
    testTimeout: 15_000,
  },
});
