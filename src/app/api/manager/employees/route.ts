import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

// GET /api/manager/employees?date=2026-03-03
// Returns all employees under this manager, with their tasks for the given date
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")

    try {
        // Build date filter for tasks
        let taskWhere: any = undefined
        if (dateStr) {
            const selectedStart = startOfDay(new Date(dateStr))
            const selectedEnd = endOfDay(new Date(dateStr))
            const todayStart = startOfDay(new Date())
            const isToday = selectedStart.getTime() === todayStart.getTime()

            if (isToday) {
                taskWhere = {
                    OR: [
                        { date: { gte: selectedStart, lte: selectedEnd } },
                        { date: { lt: selectedStart }, isCompleted: false },
                    ],
                }
            } else {
                taskWhere = {
                    date: { gte: selectedStart, lte: selectedEnd },
                }
            }
        }

        const employees = await prisma.user.findMany({
            where: { managerId: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                assignedTasks: {
                    where: taskWhere,
                    include: { subtasks: true },
                    orderBy: [{ isCompleted: "asc" as const }, { createdAt: "desc" as const }],
                },
            },
            orderBy: { name: "asc" },
        })

        // Also get unassigned pool tasks
        const poolTasks = await prisma.task.findMany({
            where: {
                createdById: session.user.id,
                isPoolTask: true,
                assignedToId: null,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ employees, poolTasks })
    } catch (error) {
        console.error("Error fetching employee data", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
