import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const templates = await prisma.taskTemplate.findMany({
        where: {
            OR: [
                { createdById: session.user.id },
                {
                    groups: {
                        some: {
                            members: {
                                some: {
                                    id: session.user.id
                                }
                            }
                        }
                    }
                }
            ]
        },
        include: {
            subtasks: { orderBy: { sortOrder: "asc" } },
            createdBy: { select: { name: true } },
            groups: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ templates })
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { name, description, subtasks = [], groupIds = [] } = await req.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: "Template adı gerekli" }, { status: 400 })
        }

        const template = await prisma.taskTemplate.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                createdById: session.user.id,
                subtasks: {
                    create: subtasks.map((st: { title: string; description?: string }, i: number) => ({
                        title: st.title.trim(),
                        description: st.description?.trim() || null,
                        sortOrder: i,
                    })),
                },
                groups: {
                    connect: groupIds.map((id: string) => ({ id })),
                },
            },
            include: {
                subtasks: { orderBy: { sortOrder: "asc" } },
                createdBy: { select: { name: true } },
                groups: { select: { id: true, name: true, color: true } },
            },
        })

        return NextResponse.json({ template })
    } catch (error) {
        console.error("Template create error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
