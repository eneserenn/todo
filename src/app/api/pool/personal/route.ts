import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tasks = await prisma.task.findMany({
        where: {
            assignedToId: session.user.id,
            isPersonalPool: true,
        },
        include: { subtasks: true },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tasks })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { title, description, priority } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 })

    const task = await prisma.task.create({
        data: {
            title,
            description: description || null,
            date: new Date(),
            isPersonalPool: true,
            priority: priority || "MEDIUM",
            createdById: session.user.id,
            assignedToId: session.user.id,
        },
        include: { subtasks: true },
    })

    return NextResponse.json({ task })
}
