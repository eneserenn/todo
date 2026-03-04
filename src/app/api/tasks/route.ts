import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, isBefore } from "date-fns"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 })

    const selectedDate = new Date(dateStr)
    const today = startOfDay(new Date())

    const selectedStart = startOfDay(selectedDate)
    const selectedEnd = endOfDay(selectedDate)

    try {
        const isToday = selectedStart.getTime() === today.getTime()

        // 1. Tasks explicitly assigned to this date (exclude pool tasks)
        let whereClause: any = {
            assignedToId: session.user.id,
            isPoolTask: false,
            isPersonalPool: false,
            date: {
                gte: selectedStart,
                lte: selectedEnd,
            }
        }

        // 2. Roll-over logic: If the selected date is TODAY, we also fetch ANY PAST unfinished tasks!
        if (isToday) {
            whereClause = {
                assignedToId: session.user.id,
                isPoolTask: false,
                isPersonalPool: false,
                OR: [
                    // Tasks scheduled for today
                    {
                        date: {
                            gte: selectedStart,
                            lte: selectedEnd,
                        }
                    },
                    // Past tasks that are NOT completed
                    {
                        date: {
                            lt: selectedStart
                        },
                        isCompleted: false
                    }
                ]
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: [
                { sortOrder: "asc" },
                { isCompleted: "asc" },
                { createdAt: "desc" }
            ],
            include: { subtasks: true, tags: true }
        })

        return NextResponse.json({ tasks })
    } catch (error) {
        console.error("Error fetching tasks", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { title, description, date, priority, recurrence, assignedToId: targetId } = await req.json()

        if (!title || !date) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        let assignedToId = session.user.id

        if (targetId && targetId !== session.user.id) {
            // Güvenlik: ikisi de aynı grupta mı?
            const sharedGroup = await prisma.userGroup.findFirst({
                where: {
                    AND: [
                        { OR: [{ members: { some: { id: session.user.id } } }, { managers: { some: { id: session.user.id } } }] },
                        { OR: [{ members: { some: { id: targetId } } }, { managers: { some: { id: targetId } } }] },
                    ]
                }
            })
            if (!sharedGroup) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            assignedToId = targetId
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || "",
                date: new Date(date),
                priority: priority || "MEDIUM",
                recurrence: recurrence || null,
                assignedToId,
                createdById: session.user.id,
            }
        })

        return NextResponse.json({ task })
    } catch (error) {
        console.error("Error creating task", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
