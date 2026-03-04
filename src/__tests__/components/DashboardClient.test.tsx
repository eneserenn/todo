import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DashboardClient from "@/app/dashboard/DashboardClient"

// Mock child components to simplify testing
vi.mock("@/app/dashboard/DateTimeline", () => ({
    default: () => <div data-testid="date-timeline" />,
}))
vi.mock("@/app/dashboard/TaskList", () => ({
    default: () => <div data-testid="task-list" />,
}))
vi.mock("@/app/dashboard/PoolView", () => ({
    default: () => <div data-testid="pool-view" />,
}))
vi.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button role="tab" data-value={value}>{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}))

const EMPLOYEE_USER = { id: "emp1", name: "Zeynep", email: "zeynep@todo.com", role: "EMPLOYEE" }
const MANAGER_USER = { id: "mgr1", name: "Ayşe", email: "ayse@todo.com", role: "MANAGER" }

describe("DashboardClient", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    it("shows welcome message with user name", () => {
        render(<DashboardClient user={EMPLOYEE_USER} />)
        expect(screen.getByText(/hoş geldin, zeynep/i)).toBeInTheDocument()
    })

    it("shows only personal summary button for employee", () => {
        render(<DashboardClient user={EMPLOYEE_USER} />)
        expect(screen.getByText("Günümü Özetle")).toBeInTheDocument()
        expect(screen.queryByText("Ekip Gününü Özetle")).not.toBeInTheDocument()
        expect(screen.queryByText("Bu Haftayı Özetle")).not.toBeInTheDocument()
    })

    it("shows all three summary buttons for manager", () => {
        render(<DashboardClient user={MANAGER_USER} />)
        expect(screen.getByText("Günümü Özetle")).toBeInTheDocument()
        expect(screen.getByText("Ekip Gününü Özetle")).toBeInTheDocument()
        expect(screen.getByText("Bu Haftayı Özetle")).toBeInTheDocument()
    })

    it("calls daily summary API and shows result", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ summary: "Bugün 3 görev tamamlandı." }),
        })
        const user = userEvent.setup()
        render(<DashboardClient user={EMPLOYEE_USER} />)

        await user.click(screen.getByText("Günümü Özetle"))

        await waitFor(() => {
            expect(screen.getByText("Bugün 3 görev tamamlandı.")).toBeInTheDocument()
        })
        expect(global.fetch).toHaveBeenCalledWith("/api/ai/summary", expect.objectContaining({ method: "POST" }))
    })

    it("calls team summary API for manager", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ summary: "Ekip özeti." }),
        })
        const user = userEvent.setup()
        render(<DashboardClient user={MANAGER_USER} />)

        await user.click(screen.getByText("Ekip Gününü Özetle"))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/ai/manager-summary", expect.anything())
        })
    })

    it("calls weekly summary API for manager", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ summary: "Haftalık özet." }),
        })
        const user = userEvent.setup()
        render(<DashboardClient user={MANAGER_USER} />)

        await user.click(screen.getByText("Bu Haftayı Özetle"))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/ai/weekly-summary", expect.anything())
        })
    })

    it("disables all summary buttons while loading", async () => {
        global.fetch = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)) as any)
        const user = userEvent.setup()
        render(<DashboardClient user={MANAGER_USER} />)

        await user.click(screen.getByText("Günümü Özetle"))

        expect(screen.getByText("Özetleniyor...")).toBeInTheDocument()
        expect(screen.getByText("Ekip Gününü Özetle")).toBeDisabled()
        expect(screen.getByText("Bu Haftayı Özetle")).toBeDisabled()
    })

    it("allows closing the summary box", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ summary: "Özet metni" }),
        })
        const user = userEvent.setup()
        render(<DashboardClient user={EMPLOYEE_USER} />)

        await user.click(screen.getByText("Günümü Özetle"))
        await waitFor(() => screen.getByText("Özet metni"))

        await user.click(screen.getByText("✕"))
        expect(screen.queryByText("Özet metni")).not.toBeInTheDocument()
    })
})
