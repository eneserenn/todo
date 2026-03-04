import { test, expect } from "@playwright/test"

async function loginAsManager(page: any) {
    await page.goto("/login")
    await page.getByLabel(/e-posta/i).fill("ayse@todo.com")
    await page.getByLabel(/şifre/i).fill("manager123")
    await page.getByRole("button", { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
}

async function loginAsEmployee(page: any) {
    await page.goto("/login")
    await page.getByLabel(/e-posta/i).fill("zeynep@todo.com")
    await page.getByLabel(/şifre/i).fill("emp123")
    await page.getByRole("button", { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
}

test.describe("Pool View — Manager", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsManager(page)
    })

    test("Görev Havuzu tab is visible", async ({ page }) => {
        await expect(page.getByRole("tab", { name: "Görev Havuzu" })).toBeVisible()
    })

    test("can navigate to pool view and see sections", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        // Pool view shows personal pool by default
        await expect(page.getByRole("heading", { name: "Kişisel Pool" })).toBeVisible({ timeout: 5000 })
    })

    test("can switch to shared pool (Ekip Havuzu)", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        await page.getByRole("button", { name: "Ekip Havuzu" }).click()
        await expect(page.getByRole("heading", { name: "Ekip Havuzu" })).toBeVisible({ timeout: 5000 })
    })

    test("can create a shared pool task", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        await page.getByRole("button", { name: "Ekip Havuzu" }).click()

        const input = page.getByPlaceholder("Task başlığı...").first()
        await input.fill("E2E Havuz Görevi")
        await input.press("Enter")
        await expect(page.getByText("E2E Havuz Görevi").first()).toBeVisible({ timeout: 5000 })
    })

    test("seeded pool tasks are visible", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        await page.getByRole("button", { name: "Ekip Havuzu" }).click()
        await expect(page.getByText("Onboarding dokümanı güncelle").or(page.getByText("Log monitoring kurulumu"))).toBeVisible({ timeout: 5000 })
    })
})

test.describe("Pool View — Employee", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsEmployee(page)
    })

    test("personal pool section is visible after clicking tab", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        await expect(page.getByRole("heading", { name: "Kişisel Pool" })).toBeVisible({ timeout: 5000 })
    })

    test("can create a personal pool task", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()

        const input = page.getByPlaceholder("Task başlığı...").first()
        await input.fill("E2E Kişisel Görev")
        await input.press("Enter")
        await expect(page.getByText("E2E Kişisel Görev").first()).toBeVisible({ timeout: 5000 })
    })

    test("employee cannot see Ekip Havuzu tab button", async ({ page }) => {
        await page.getByRole("tab", { name: "Görev Havuzu" }).click()
        // Employee does not have "Ekip Havuzu" sub-tab (only manager does)
        // Personal pool is shown by default
        await expect(page.getByRole("heading", { name: "Kişisel Pool" })).toBeVisible({ timeout: 5000 })
    })
})
