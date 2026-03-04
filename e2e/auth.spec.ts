import { test, expect } from "@playwright/test"

test.describe("Auth — Login", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/login")
    })

    test("renders login form in Turkish", async ({ page }) => {
        // CardTitle is a <div>, not a semantic heading — check visible text
        await expect(page.getByText("Giriş Yap").first()).toBeVisible()
        await expect(page.getByLabel(/e-posta/i)).toBeVisible()
        await expect(page.getByLabel(/şifre/i)).toBeVisible()
        await expect(page.getByRole("button", { name: /giriş yap/i })).toBeVisible()
    })

    test("shows signup link pointing to /register", async ({ page }) => {
        await expect(page.getByText(/hesabın yok mu/i)).toBeVisible()
        await expect(page.getByRole("link", { name: /kayıt ol/i })).toHaveAttribute("href", "/register")
    })

    test("shows error on wrong credentials", async ({ page }) => {
        await page.getByLabel(/e-posta/i).fill("wrong@example.com")
        await page.getByLabel(/şifre/i).fill("wrongpassword")
        await page.getByRole("button", { name: /giriş yap/i }).click()
        await expect(page).toHaveURL(/login/)
        await expect(page.locator("div.text-red-500")).toBeVisible({ timeout: 5000 })
    })

    test("employee login redirects to dashboard", async ({ page }) => {
        await page.getByLabel(/e-posta/i).fill("zeynep@todo.com")
        await page.getByLabel(/şifre/i).fill("emp123")
        await page.getByRole("button", { name: /giriş yap/i }).click()
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    })

    test("manager login redirects to dashboard", async ({ page }) => {
        await page.getByLabel(/e-posta/i).fill("ayse@todo.com")
        await page.getByLabel(/şifre/i).fill("manager123")
        await page.getByRole("button", { name: /giriş yap/i }).click()
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    })
})

test.describe("Auth — Register", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/register")
    })

    test("renders register form in Turkish", async ({ page }) => {
        // CardTitle is a <div>, not a heading
        await expect(page.getByText("Hesap Oluştur").first()).toBeVisible()
        await expect(page.getByLabel(/ad soyad/i)).toBeVisible()
        await expect(page.getByLabel(/e-posta/i)).toBeVisible()
        await expect(page.getByLabel(/şifre/i)).toBeVisible()
        await expect(page.getByLabel(/rol/i)).toBeVisible()
    })

    test("shows manager selector when role is employee", async ({ page }) => {
        // EMPLOYEE is default
        await expect(page.getByLabel(/yönetici seç/i)).toBeVisible()
    })

    test("hides manager selector when role is manager", async ({ page }) => {
        await page.getByLabel(/rol/i).selectOption("MANAGER")
        await expect(page.getByLabel(/yönetici seç/i)).not.toBeVisible()
    })

    test("shows error on duplicate email", async ({ page }) => {
        await page.getByLabel(/ad soyad/i).fill("Test Kullanıcı")
        await page.getByLabel(/e-posta/i).fill("ayse@todo.com") // existing email
        await page.getByLabel(/şifre/i).fill("password123")
        // EMPLOYEE role requires a manager — select the first available one
        await page.getByLabel(/yönetici seç/i).selectOption({ index: 1 })
        await page.getByRole("button", { name: /kayıt ol/i }).click()
        await expect(page.locator(".text-red-500")).toBeVisible({ timeout: 5000 })
    })
})
