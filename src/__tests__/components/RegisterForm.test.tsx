import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RegisterForm from "@/app/register/RegisterForm"

const mockManagers = [
    { id: "mgr1", name: "Ayşe Yılmaz" },
    { id: "mgr2", name: "Mehmet Demir" },
]

describe("RegisterForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    })

    it("renders form fields", () => {
        render(<RegisterForm managers={mockManagers} />)
        expect(screen.getByText("Hesap Oluştur")).toBeInTheDocument()
        expect(screen.getByLabelText(/ad soyad/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
    })

    it("shows manager selector when role is EMPLOYEE", () => {
        render(<RegisterForm managers={mockManagers} />)
        // EMPLOYEE is default
        expect(screen.getByLabelText(/yönetici seç/i)).toBeInTheDocument()
        expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument()
        expect(screen.getByText("Mehmet Demir")).toBeInTheDocument()
    })

    it("hides manager selector when role is MANAGER", async () => {
        const user = userEvent.setup()
        render(<RegisterForm managers={mockManagers} />)

        const roleSelect = screen.getByLabelText(/rol/i)
        await user.selectOptions(roleSelect, "MANAGER")

        expect(screen.queryByLabelText(/yönetici seç/i)).not.toBeInTheDocument()
    })

    it("hides manager selector when role is ADMIN", async () => {
        const user = userEvent.setup()
        render(<RegisterForm managers={mockManagers} />)

        const roleSelect = screen.getByLabelText(/rol/i)
        await user.selectOptions(roleSelect, "ADMIN")

        expect(screen.queryByLabelText(/yönetici seç/i)).not.toBeInTheDocument()
    })

    it("has all three role options", () => {
        render(<RegisterForm managers={mockManagers} />)
        const roleSelect = screen.getByLabelText(/rol/i)
        const options = Array.from(roleSelect.querySelectorAll("option")).map(o => o.value)
        expect(options).toContain("EMPLOYEE")
        expect(options).toContain("MANAGER")
        expect(options).toContain("ADMIN")
    })

    it("submits form and calls API", async () => {
        const user = userEvent.setup()
        render(<RegisterForm managers={mockManagers} />)

        await user.type(screen.getByLabelText(/ad soyad/i), "Test Kullanıcı")
        await user.type(screen.getByLabelText(/e-posta/i), "test@test.com")
        await user.type(screen.getByLabelText(/şifre/i), "password123")

        const managerSelect = screen.getByLabelText(/yönetici seç/i)
        await user.selectOptions(managerSelect, "mgr1")

        await user.click(screen.getByRole("button", { name: /kayıt ol/i }))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/register", expect.objectContaining({
                method: "POST",
            }))
        })
    })

    it("shows error message on failed registration", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: "Bu e-posta zaten kullanımda" })
        })
        const user = userEvent.setup()
        render(<RegisterForm managers={mockManagers} />)

        await user.type(screen.getByLabelText(/ad soyad/i), "Test")
        await user.type(screen.getByLabelText(/e-posta/i), "exist@test.com")
        await user.type(screen.getByLabelText(/şifre/i), "pass123")
        await user.selectOptions(screen.getByLabelText(/yönetici seç/i), "mgr1")
        await user.click(screen.getByRole("button", { name: /kayıt ol/i }))

        await waitFor(() => {
            expect(screen.getByText("Bu e-posta zaten kullanımda")).toBeInTheDocument()
        })
    })
})
