import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { dateStr } = await req.json()
    if (!dateStr) return NextResponse.json({ error: "dateStr required" }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.assignedToId !== session.user.id || !task.isPersonalPool) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.task.update({
        where: { id },
        data: {
            isPersonalPool: false,
            date: new Date(dateStr),
        },
    })

    return NextResponse.json({ task: updated })
}
