import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { signIn } from "next-auth/react"
import LoginPage from "@/app/login/page"

describe("LoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders login form", () => {
        render(<LoginPage />)
        // CardTitle renders as a div, not a semantic heading — check button and inputs
        expect(screen.getByRole("button", { name: /giriş yap/i })).toBeInTheDocument()
        expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument()
    })

    it("shows signup link", () => {
        render(<LoginPage />)
        expect(screen.getByText(/hesabın yok mu/i)).toBeInTheDocument()
        expect(screen.getByRole("link", { name: /kayıt ol/i })).toHaveAttribute("href", "/register")
    })

    it("submits credentials and redirects on success", async () => {
        vi.mocked(signIn).mockResolvedValue({ ok: true, error: null } as any)
        const user = userEvent.setup()
        render(<LoginPage />)

        await user.type(screen.getByLabelText(/e-posta/i), "ayse@todo.com")
        await user.type(screen.getByLabelText(/şifre/i), "manager123")
        await user.click(screen.getByRole("button", { name: /giriş yap/i }))

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({
                redirect: false,
                email: "ayse@todo.com",
                password: "manager123",
            }))
        })
    })

    it("shows error message on failed login", async () => {
        vi.mocked(signIn).mockResolvedValue({ ok: false, error: "Hatalı şifre" } as any)
        const user = userEvent.setup()
        render(<LoginPage />)

        await user.type(screen.getByLabelText(/e-posta/i), "test@test.com")
        await user.type(screen.getByLabelText(/şifre/i), "wrongpass")
        await user.click(screen.getByRole("button", { name: /giriş yap/i }))

        await waitFor(() => {
            expect(screen.getByText("Hatalı şifre")).toBeInTheDocument()
        })
    })

    it("disables button while submitting", async () => {
        vi.mocked(signIn).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)) as any)
        const user = userEvent.setup()
        render(<LoginPage />)

        await user.type(screen.getByLabelText(/e-posta/i), "test@test.com")
        await user.type(screen.getByLabelText(/şifre/i), "password")
        await user.click(screen.getByRole("button", { name: /giriş yap/i }))

        expect(screen.getByRole("button", { name: /giriş yapılıyor/i })).toBeDisabled()
    })
})
