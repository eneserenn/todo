import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const groups = await prisma.userGroup.findMany({
        where: {
            OR: [
                { members: { some: { id: session.user.id } } },
                { managers: { some: { id: session.user.id } } },
            ]
        },
        include: {
            members: { select: { id: true, name: true, email: true } },
            managers: { select: { id: true, name: true, email: true } },
        }
    })

    const seen = new Set<string>()
    const members: { id: string; name: string; email: string }[] = []
    for (const g of groups) {
        for (const u of [...g.members, ...g.managers]) {
            if (u.id !== session.user.id && !seen.has(u.id)) {
                seen.add(u.id)
                members.push(u)
            }
        }
    }

    return NextResponse.json({ members })
}
