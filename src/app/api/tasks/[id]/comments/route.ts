import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tasks/:id/comments
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const comments = await prisma.comment.findMany({
        where: { taskId: id },
        orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ comments })
}

// POST /api/tasks/:id/comments
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: taskId } = await params
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

    const comment = await prisma.comment.create({
        data: {
            content: content.trim(),
            authorId: session.user.id,
            authorName: session.user.name || "Anonim",
            taskId,
        },
    })

    return NextResponse.json({ comment })
}
