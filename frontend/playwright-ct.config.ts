import { defineConfig, devices } from "@playwright/experimental-ct-react";
import path from "path";

export default defineConfig({
  testDir: "./src/__tests__/screenshots",
  testMatch: "*.screenshot.tsx",
  snapshotDir: "./src/__tests__/screenshots/__snapshots__",
  snapshotPathTemplate:
    "{snapshotDir}/{testFilePath}/{arg}{ext}",
  updateSnapshots: "missing",
  timeout: 10000,
  use: {
    ...devices["Desktop Chrome"],
    ctViteConfig: {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
