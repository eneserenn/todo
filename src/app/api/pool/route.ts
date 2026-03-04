import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        // If the user is an employee, show pool tasks from their manager.
        // If the user is a manager, show their own pool tasks.
        let managerId = session.user.id

        if (session.user.role === "EMPLOYEE") {
            const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
            if (!dbUser?.managerId) {
                return NextResponse.json({ tasks: [] }) // No manager assigned
            }
            managerId = dbUser.managerId
        }

        const tasks = await prisma.task.findMany({
            where: {
                createdById: managerId,
                isPoolTask: true,
                assignedToId: null, // Still in pool
            },
            include: { subtasks: true },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ tasks })
    } catch (error) {
        console.error("Error fetching pool tasks", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { title, description, assignedToId, priority } = await req.json()

        if (!title) {
            return NextResponse.json({ error: "Missing title" }, { status: 400 })
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || "",
                date: new Date(),
                isPoolTask: true,
                priority: priority || "MEDIUM",
                assignedToId: assignedToId || null,
                createdById: session.user.id,
            },
            include: { subtasks: true },
        })

        return NextResponse.json({ task })
    } catch (error) {
        console.error("Error creating pool task", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
