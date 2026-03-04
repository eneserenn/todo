import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tags — list user's tags
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tags = await prisma.tag.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
    })
    return NextResponse.json({ tags })
}

// POST /api/tags — create a new tag
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, color } = await req.json()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const tag = await prisma.tag.upsert({
        where: { name_userId: { name: name.trim(), userId: session.user.id } },
        update: { color: color || "#6366f1" },
        create: { name: name.trim(), color: color || "#6366f1", userId: session.user.id },
    })

    return NextResponse.json({ tag })
}
