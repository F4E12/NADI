import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/rules/**/*.test.ts"],
  },
});
