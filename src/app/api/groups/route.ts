import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // If admin, return all groups
    if (session.user.role === "ADMIN") {
        const groups = await prisma.userGroup.findMany({
            orderBy: { name: "asc" }
        })
        return NextResponse.json({ groups })
    }

    // Otherwise return groups where user is manager or member
    const groups = await prisma.userGroup.findMany({
        where: {
            OR: [
                { managers: { some: { id: session.user.id } } },
                { members: { some: { id: session.user.id } } }
            ]
        },
        orderBy: { name: "asc" }
    })

    return NextResponse.json({ groups })
}
