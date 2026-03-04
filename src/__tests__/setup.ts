import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => "/",
    redirect: vi.fn(),
}))

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
    useSession: vi.fn(() => ({
        data: { user: { id: "user1", name: "Test User", email: "test@test.com", role: "EMPLOYEE" } },
        status: "authenticated",
    })),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
        const React = require("react")
        return React.createElement("a", { href }, children)
    },
}))

// Global fetch mock
global.fetch = vi.fn()
