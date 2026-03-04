import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const { userId, dateStr } = await req.json()
    if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    // Verify the task belongs to this manager
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.createdById !== session.user.id) {
        return NextResponse.json({ error: "Task not found or not authorized" }, { status: 404 })
    }

    // URGENT → assign as day task; others → personal pool
    const isUrgent = task.priority === "URGENT"
    const updateData = isUrgent ? {
        isPoolTask: false,
        isPersonalPool: false,
        assignedToId: userId,
        date: dateStr ? new Date(dateStr) : new Date(),
    } : {
        isPoolTask: false,
        isPersonalPool: true,
        assignedToId: userId,
    }

    const updated = await prisma.task.update({
        where: { id },
        data: updateData,
        include: { subtasks: true },
    })

    return NextResponse.json({ task: updated })
}
