import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { title, description } = await req.json()
        const { id: taskId } = await params

        if (!title) {
            return NextResponse.json({ error: "Missing title" }, { status: 400 })
        }

        // Verify task ownership
        const task = await prisma.task.findUnique({ where: { id: taskId } })
        if (!task || task.assignedToId !== session.user.id) {
            // Only allow assigned user to add subtasks for now
            // Managers assigned to user might also be allowed later
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        const subtask = await prisma.subtask.create({
            data: {
                title,
                description: description?.trim() || null,
                taskId,
            }
        })

        return NextResponse.json({ subtask })
    } catch (error) {
        console.error("Error creating subtask", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
