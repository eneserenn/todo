import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
    authOptions: {},
}))

vi.mock("@/lib/prisma", () => ({
    default: {
        task: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}))

import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { GET, POST } from "@/app/api/tasks/route"
import { PATCH, DELETE } from "@/app/api/tasks/[id]/route"

const MANAGER_SESSION = { user: { id: "manager1", name: "Ayşe", email: "ayse@todo.com", role: "MANAGER" } }
const EMPLOYEE_SESSION = { user: { id: "emp1", name: "Zeynep", email: "zeynep@todo.com", role: "EMPLOYEE" } }

const makeRequest = (url: string, body?: any) =>
    new Request(url, body ? { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {})

const makeParams = (id: string) => Promise.resolve({ id })

// ── GET /api/tasks ───────────────────────────────────────────────────────────
describe("GET /api/tasks", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 401 when not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const req = makeRequest("http://localhost:3000/api/tasks?date=2026-03-03")
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it("returns 400 when date is missing", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const req = makeRequest("http://localhost:3000/api/tasks")
        const res = await GET(req)
        expect(res.status).toBe(400)
    })

    it("returns tasks for authenticated user", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const fakeTasks = [
            { id: "t1", title: "Task 1", isCompleted: false, priority: "MEDIUM", subtasks: [] },
        ]
        vi.mocked(prisma.task.findMany).mockResolvedValue(fakeTasks as any)

        const req = makeRequest("http://localhost:3000/api/tasks?date=2026-03-03")
        const res = await GET(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.tasks).toHaveLength(1)
        expect(data.tasks[0].title).toBe("Task 1")
    })

    it("filters out pool and personal pool tasks", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findMany).mockResolvedValue([] as any)

        const req = makeRequest("http://localhost:3000/api/tasks?date=2026-03-03")
        await GET(req)

        const whereClause = vi.mocked(prisma.task.findMany).mock.calls[0][0]?.where as any
        expect(whereClause.isPoolTask).toBe(false)
        expect(whereClause.isPersonalPool).toBe(false)
    })
})

// ── POST /api/tasks ──────────────────────────────────────────────────────────
describe("POST /api/tasks", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 401 when not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const req = makeRequest("http://localhost:3000/api/tasks", { title: "Test", date: new Date().toISOString() })
        const res = await POST(req)
        expect(res.status).toBe(401)
    })

    it("returns 400 when title is missing", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const req = makeRequest("http://localhost:3000/api/tasks", { date: new Date().toISOString() })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("creates task with correct priority", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const createdTask = { id: "t1", title: "New Task", priority: "HIGH", isCompleted: false }
        vi.mocked(prisma.task.create).mockResolvedValue(createdTask as any)

        const req = makeRequest("http://localhost:3000/api/tasks", {
            title: "New Task",
            date: new Date().toISOString(),
            priority: "HIGH",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.task.priority).toBe("HIGH")

        const createCall = vi.mocked(prisma.task.create).mock.calls[0][0]
        expect(createCall.data.priority).toBe("HIGH")
        expect(createCall.data.assignedToId).toBe("emp1")
    })

    it("defaults to MEDIUM priority when not specified", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.create).mockResolvedValue({ id: "t1", title: "Task", priority: "MEDIUM" } as any)

        const req = makeRequest("http://localhost:3000/api/tasks", {
            title: "Task",
            date: new Date().toISOString(),
        })
        await POST(req)

        const createCall = vi.mocked(prisma.task.create).mock.calls[0][0]
        expect(createCall.data.priority).toBe("MEDIUM")
    })
})

// ── PATCH /api/tasks/[id] ────────────────────────────────────────────────────
describe("PATCH /api/tasks/[id]", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 401 when not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const req = new Request("http://localhost/api/tasks/t1", {
            method: "PATCH",
            body: JSON.stringify({ isCompleted: true }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await PATCH(req, { params: makeParams("t1") })
        expect(res.status).toBe(401)
    })

    it("returns 404 when task not owned by user", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", assignedToId: "other-user"
        } as any)

        const req = new Request("http://localhost/api/tasks/t1", {
            method: "PATCH",
            body: JSON.stringify({ isCompleted: true }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await PATCH(req, { params: makeParams("t1") })
        expect(res.status).toBe(404)
    })

    it("updates priority", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", assignedToId: "emp1", isCompleted: false, title: "Task", description: "", priority: "LOW"
        } as any)
        vi.mocked(prisma.task.update).mockResolvedValue({ id: "t1", priority: "URGENT" } as any)

        const req = new Request("http://localhost/api/tasks/t1", {
            method: "PATCH",
            body: JSON.stringify({ priority: "URGENT" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await PATCH(req, { params: makeParams("t1") })
        expect(res.status).toBe(200)

        const updateCall = vi.mocked(prisma.task.update).mock.calls[0][0]
        expect(updateCall.data.priority).toBe("URGENT")
    })
})

// ── DELETE /api/tasks/[id] ───────────────────────────────────────────────────
describe("DELETE /api/tasks/[id]", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 404 when task not owned by user", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", assignedToId: "other-user"
        } as any)

        const req = new Request("http://localhost/api/tasks/t1", { method: "DELETE" })
        const res = await DELETE(req, { params: makeParams("t1") })
        expect(res.status).toBe(404)
    })

    it("deletes task when owned by user", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", assignedToId: "emp1"
        } as any)
        vi.mocked(prisma.task.delete).mockResolvedValue({} as any)

        const req = new Request("http://localhost/api/tasks/t1", { method: "DELETE" })
        const res = await DELETE(req, { params: makeParams("t1") })
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
    })
})
