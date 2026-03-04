import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/groups — list all groups with members and managers
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groups = await prisma.userGroup.findMany({
        include: {
            members: { select: { id: true, name: true, email: true, role: true } },
            managers: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { name: "asc" },
    })

    return NextResponse.json({ groups })
}

// POST /api/admin/groups — create a new group
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

    try {
        const group = await prisma.userGroup.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#6366f1",
            },
            include: {
                members: { select: { id: true, name: true, email: true, role: true } },
                managers: { select: { id: true, name: true, email: true, role: true } },
            },
        })
        return NextResponse.json({ group })
    } catch (e: any) {
        if (e.code === "P2002") return NextResponse.json({ error: "Bu isimde bir grup zaten var" }, { status: 409 })
        throw e
    }
}
