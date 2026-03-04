import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { isCompleted, title, description } = await req.json()
        const { id } = await params

        // A real app would verify the user owns the task that owns this subtask, but we'll optimize for speed here
        const existing = await prisma.subtask.findUnique({
            where: { id },
            include: { task: true }
        })

        if (!existing || existing.task.assignedToId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        const subtask = await prisma.subtask.update({
            where: { id },
            data: {
                isCompleted: isCompleted !== undefined ? isCompleted : existing.isCompleted,
                title: title !== undefined ? title : existing.title,
                ...(description !== undefined && { description: description?.trim() || null }),
            }
        })

        return NextResponse.json({ subtask })
    } catch (error) {
        console.error("Error updating subtask", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { id } = await params

        const existing = await prisma.subtask.findUnique({
            where: { id },
            include: { task: true }
        })

        if (!existing || existing.task.assignedToId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        await prisma.subtask.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting subtask", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
