import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({
    default: {
        task: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { GET as poolGET, POST as poolPOST } from "@/app/api/pool/route"
import { GET as personalGET, POST as personalPOST } from "@/app/api/pool/personal/route"
import { GET as employeesGET } from "@/app/api/manager/employees/route"
import { POST as assignEmployeePOST } from "@/app/api/pool/[id]/assign-employee/route"

const MANAGER_SESSION = { user: { id: "mgr1", name: "Ayşe", email: "ayse@todo.com", role: "MANAGER" } }
const EMPLOYEE_SESSION = { user: { id: "emp1", name: "Zeynep", email: "zeynep@todo.com", role: "EMPLOYEE" } }

const makeParams = (id: string) => Promise.resolve({ id })

// ── GET /api/pool ────────────────────────────────────────────────────────────
describe("GET /api/pool", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 401 when not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await poolGET(new Request("http://localhost/api/pool"))
        expect(res.status).toBe(401)
    })

    it("returns manager's own pool tasks", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.findMany).mockResolvedValue([
            { id: "t1", title: "Pool Task", isPoolTask: true, assignedToId: null, subtasks: [] }
        ] as any)

        const res = await poolGET(new Request("http://localhost/api/pool"))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.tasks).toHaveLength(1)

        const findManyCall = vi.mocked(prisma.task.findMany).mock.calls[0][0]?.where as any
        expect(findManyCall.createdById).toBe("mgr1")
        expect(findManyCall.isPoolTask).toBe(true)
        expect(findManyCall.assignedToId).toBeNull()
    })

    it("returns manager's pool tasks for employee", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "emp1", managerId: "mgr1" } as any)
        vi.mocked(prisma.task.findMany).mockResolvedValue([] as any)

        const res = await poolGET(new Request("http://localhost/api/pool"))
        expect(res.status).toBe(200)

        const findManyCall = vi.mocked(prisma.task.findMany).mock.calls[0][0]?.where as any
        expect(findManyCall.createdById).toBe("mgr1")
    })
})

// ── POST /api/pool ───────────────────────────────────────────────────────────
describe("POST /api/pool", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 401 for non-managers", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const req = new Request("http://localhost/api/pool", {
            method: "POST",
            body: JSON.stringify({ title: "Task" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await poolPOST(req)
        expect(res.status).toBe(401)
    })

    it("creates pool task with priority", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.create).mockResolvedValue({
            id: "t1", title: "Pool Task", priority: "HIGH", isPoolTask: true, subtasks: []
        } as any)

        const req = new Request("http://localhost/api/pool", {
            method: "POST",
            body: JSON.stringify({ title: "Pool Task", priority: "HIGH" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await poolPOST(req)
        expect(res.status).toBe(200)

        const createCall = vi.mocked(prisma.task.create).mock.calls[0][0]
        expect(createCall.data.isPoolTask).toBe(true)
        expect(createCall.data.priority).toBe("HIGH")
        expect(createCall.data.createdById).toBe("mgr1")
    })

    it("defaults to MEDIUM priority", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.create).mockResolvedValue({ id: "t1", subtasks: [] } as any)

        const req = new Request("http://localhost/api/pool", {
            method: "POST",
            body: JSON.stringify({ title: "Task" }),
            headers: { "Content-Type": "application/json" },
        })
        await poolPOST(req)

        const createCall = vi.mocked(prisma.task.create).mock.calls[0][0]
        expect(createCall.data.priority).toBe("MEDIUM")
    })
})

// ── GET /api/pool/personal ───────────────────────────────────────────────────
describe("GET /api/pool/personal", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns user's personal pool tasks", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.findMany).mockResolvedValue([
            { id: "t1", title: "My Task", isPersonalPool: true, subtasks: [] }
        ] as any)

        const res = await personalGET()
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.tasks).toHaveLength(1)

        const findCall = vi.mocked(prisma.task.findMany).mock.calls[0][0]?.where as any
        expect(findCall.assignedToId).toBe("emp1")
        expect(findCall.isPersonalPool).toBe(true)
    })
})

// ── POST /api/pool/personal ──────────────────────────────────────────────────
describe("POST /api/pool/personal", () => {
    beforeEach(() => vi.clearAllMocks())

    it("creates personal pool task", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        vi.mocked(prisma.task.create).mockResolvedValue({
            id: "t1", title: "Personal Task", isPersonalPool: true, priority: "LOW", subtasks: []
        } as any)

        const req = new Request("http://localhost/api/pool/personal", {
            method: "POST",
            body: JSON.stringify({ title: "Personal Task", priority: "LOW" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await personalPOST(req)
        expect(res.status).toBe(200)

        const createCall = vi.mocked(prisma.task.create).mock.calls[0][0]
        expect(createCall.data.isPersonalPool).toBe(true)
        expect(createCall.data.assignedToId).toBe("emp1")
        expect(createCall.data.priority).toBe("LOW")
    })

    it("returns 400 when title is empty", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const req = new Request("http://localhost/api/pool/personal", {
            method: "POST",
            body: JSON.stringify({ title: "" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await personalPOST(req)
        expect(res.status).toBe(400)
    })
})

// ── GET /api/manager/employees ───────────────────────────────────────────────
describe("GET /api/manager/employees", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 403 for non-managers", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const res = await employeesGET()
        expect(res.status).toBe(403)
    })

    it("returns employee list for manager", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.user.findMany).mockResolvedValue([
            { id: "emp1", name: "Zeynep" },
            { id: "emp2", name: "Can" },
        ] as any)

        const res = await employeesGET()
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.employees).toHaveLength(2)

        const findCall = vi.mocked(prisma.user.findMany).mock.calls[0][0]?.where as any
        expect(findCall.managerId).toBe("mgr1")
    })
})

// ── POST /api/pool/[id]/assign-employee ──────────────────────────────────────
describe("POST /api/pool/[id]/assign-employee", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns 403 for non-managers", async () => {
        vi.mocked(getServerSession).mockResolvedValue(EMPLOYEE_SESSION)
        const req = new Request("http://localhost/api/pool/t1/assign-employee", {
            method: "POST",
            body: JSON.stringify({ userId: "emp1" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await assignEmployeePOST(req, { params: makeParams("t1") })
        expect(res.status).toBe(403)
    })

    it("assigns URGENT task as day task", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", createdById: "mgr1", priority: "URGENT"
        } as any)
        vi.mocked(prisma.task.update).mockResolvedValue({ id: "t1", subtasks: [] } as any)

        const req = new Request("http://localhost/api/pool/t1/assign-employee", {
            method: "POST",
            body: JSON.stringify({ userId: "emp1", dateStr: new Date().toISOString() }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await assignEmployeePOST(req, { params: makeParams("t1") })
        expect(res.status).toBe(200)

        const updateCall = vi.mocked(prisma.task.update).mock.calls[0][0]
        expect(updateCall.data.isPersonalPool).toBe(false)
        expect(updateCall.data.isPoolTask).toBe(false)
        expect(updateCall.data.assignedToId).toBe("emp1")
    })

    it("assigns non-URGENT task to personal pool", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", createdById: "mgr1", priority: "MEDIUM"
        } as any)
        vi.mocked(prisma.task.update).mockResolvedValue({ id: "t1", subtasks: [] } as any)

        const req = new Request("http://localhost/api/pool/t1/assign-employee", {
            method: "POST",
            body: JSON.stringify({ userId: "emp1" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await assignEmployeePOST(req, { params: makeParams("t1") })
        expect(res.status).toBe(200)

        const updateCall = vi.mocked(prisma.task.update).mock.calls[0][0]
        expect(updateCall.data.isPersonalPool).toBe(true)
    })

    it("returns 404 when task belongs to different manager", async () => {
        vi.mocked(getServerSession).mockResolvedValue(MANAGER_SESSION)
        vi.mocked(prisma.task.findUnique).mockResolvedValue({
            id: "t1", createdById: "other-manager", priority: "MEDIUM"
        } as any)

        const req = new Request("http://localhost/api/pool/t1/assign-employee", {
            method: "POST",
            body: JSON.stringify({ userId: "emp1" }),
            headers: { "Content-Type": "application/json" },
        })
        const res = await assignEmployeePOST(req, { params: makeParams("t1") })
        expect(res.status).toBe(404)
    })
})
