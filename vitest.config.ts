import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Next usa "jsx: preserve" en tsconfig; Vite 8 (oxc) debe transformar el JSX.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // M7: cobertura sobre la lógica de servidor (API, servicios y utilerías).
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/api/**", "src/services/**"],
      exclude: ["**/*.test.*"],
      reporter: ["text-summary", "json-summary"],
      thresholds: { lines: 40 },
    },
  },
});
