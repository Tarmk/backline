import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside Next's server bundle; it's a no-op in tests.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Integration tests use an in-memory PGlite database.
    env: { PGLITE_DIR: "memory://", DATABASE_URL: "" },
  },
});
