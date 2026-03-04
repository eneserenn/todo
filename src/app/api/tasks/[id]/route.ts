import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { isCompleted, title, description, priority, sortOrder, recurrence, connectTagId, disconnectTagId } = await req.json()
        const { id } = await params

        // Verify ownership
        const existing = await prisma.task.findUnique({ where: { id } })
        if (!existing || existing.assignedToId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        // Handle tag connections separately
        if (connectTagId) {
            const task = await prisma.task.update({
                where: { id },
                data: { tags: { connect: { id: connectTagId } } },
                include: { tags: true },
            })
            return NextResponse.json({ task })
        }

        if (disconnectTagId) {
            const task = await prisma.task.update({
                where: { id },
                data: { tags: { disconnect: { id: disconnectTagId } } },
                include: { tags: true },
            })
            return NextResponse.json({ task })
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                isCompleted: isCompleted !== undefined ? isCompleted : existing.isCompleted,
                title: title !== undefined ? title : existing.title,
                description: description !== undefined ? description : existing.description,
                priority: priority !== undefined ? priority : existing.priority,
                sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
                recurrence: recurrence !== undefined ? recurrence : existing.recurrence,
            }
        })

        return NextResponse.json({ task })
    } catch (error) {
        console.error("Error updating task", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { id } = await params

        // Verify ownership
        const existing = await prisma.task.findUnique({ where: { id } })
        if (!existing || existing.assignedToId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
        }

        await prisma.task.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting task", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
