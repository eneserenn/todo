import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "EMPLOYEE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const { dateStr } = await req.json() // Employees might decide WHICH DAY to put it on, or default to today.

        const task = await prisma.task.findUnique({ where: { id } })

        if (!task || !task.isPoolTask || task.assignedToId) {
            return NextResponse.json({ error: "Task not available" }, { status: 404 })
        }

        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (task.createdById !== dbUser?.managerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Claim the task
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                assignedToId: session.user.id,
                date: dateStr ? new Date(dateStr) : new Date(), // Re-assign date
            }
        })

        // (Optional phase 5 extra logic) Notification goes here. We can skip actual db notification or just console.log if no Notifications table is set up yet, wait we did plan notifications! Next step: add Notifications table to schema? We omitted Notifications table from Prisma schema in implementation plan. I will just create a basic placeholder or ignore the notification UI for now since Next.js isn't natively real-time unless using SSE/Websockets/Polling. 
        console.log(`Notification: Employee ${session.user.name} claimed task ${updatedTask.title}`)

        return NextResponse.json({ task: updatedTask })
    } catch (error) {
        console.error("Error claiming pool task", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
