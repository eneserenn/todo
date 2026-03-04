import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"

// GET /api/stats — returns dashboard statistics for the current user
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    try {
        // Today's tasks
        const todayTasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                OR: [
                    { date: { gte: todayStart, lte: todayEnd } },
                    { date: { lt: todayStart }, isCompleted: false },
                ],
            },
        })

        const todayTotal = todayTasks.length
        const todayCompleted = todayTasks.filter(t => t.isCompleted).length

        // This week (last 7 days)
        const weekStart = startOfDay(subDays(new Date(), 6))
        const weekTasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                date: { gte: weekStart, lte: todayEnd },
            },
        })

        const weekTotal = weekTasks.length
        const weekCompleted = weekTasks.filter(t => t.isCompleted).length
        const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0

        // Streak: consecutive days with all tasks completed
        let streak = 0
        for (let i = 0; i < 30; i++) {
            const d = subDays(new Date(), i)
            const ds = startOfDay(d)
            const de = endOfDay(d)
            const dayTasks = await prisma.task.findMany({
                where: {
                    assignedToId: session.user.id,
                    date: { gte: ds, lte: de },
                },
            })
            if (dayTasks.length === 0) continue // skip days with no tasks
            if (dayTasks.every(t => t.isCompleted)) streak++
            else break
        }

        return NextResponse.json({
            todayTotal,
            todayCompleted,
            todayPending: todayTotal - todayCompleted,
            weekPercent,
            streak,
        })
    } catch (error) {
        console.error("Stats error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
