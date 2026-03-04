import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    timeout: 30000,
    fullyParallel: false,
    retries: 1,
    reporter: "list",
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    // App is already running in Docker — no webServer needed
})
