import { test, expect } from "@playwright/test"

async function loginAsEmployee(page: any) {
    await page.goto("/login")
    await page.getByLabel(/e-posta/i).fill("zeynep@todo.com")
    await page.getByLabel(/şifre/i).fill("emp123")
    await page.getByRole("button", { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
}

async function loginAsManager(page: any) {
    await page.goto("/login")
    await page.getByLabel(/e-posta/i).fill("ayse@todo.com")
    await page.getByLabel(/şifre/i).fill("manager123")
    await page.getByRole("button", { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
}

test.describe("Dashboard — Task List", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsEmployee(page)
    })

    test("shows welcome message with user name", async ({ page }) => {
        await expect(page.getByText(/hoş geldin/i)).toBeVisible()
    })

    test("shows only personal summary button for employee", async ({ page }) => {
        await expect(page.getByRole("button", { name: "Günümü Özetle" })).toBeVisible()
        await expect(page.getByRole("button", { name: "Ekip Gününü Özetle" })).not.toBeVisible()
        await expect(page.getByRole("button", { name: "Bu Haftayı Özetle" })).not.toBeVisible()
    })

    test("can create a new task", async ({ page }) => {
        const taskInput = page.getByPlaceholder("Ne yapılacak?")
        await taskInput.fill("E2E Test Görevi")
        await taskInput.press("Enter")
        await expect(page.getByText("E2E Test Görevi").first()).toBeVisible({ timeout: 5000 })
    })

    test("task list shows existing tasks", async ({ page }) => {
        // Seeded tasks for Zeynep appear today — both may be present; check first match
        await expect(page.getByText("Unit testleri yaz").first()).toBeVisible({ timeout: 5000 })
    })
})

test.describe("Dashboard — Manager View", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsManager(page)
    })

    test("shows three summary buttons for manager", async ({ page }) => {
        await expect(page.getByRole("button", { name: "Günümü Özetle" })).toBeVisible()
        await expect(page.getByRole("button", { name: "Ekip Gününü Özetle" })).toBeVisible()
        await expect(page.getByRole("button", { name: "Bu Haftayı Özetle" })).toBeVisible()
    })

    test("daily summary button triggers loading state", async ({ page }) => {
        await page.getByRole("button", { name: "Günümü Özetle" }).click()
        await expect(page.getByText(/özetleniyor/i)).toBeVisible({ timeout: 3000 })
    })
})
