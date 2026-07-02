import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:11111",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:11111" },
    },
  ],

  // Lance `vp dev` avant les tests si rien n'écoute déjà sur :11111
  // (registre des ports : CLAUDE.md → Dev server convention).
  webServer: {
    command: "vp dev",
    cwd: "..",
    url: "http://localhost:11111",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
