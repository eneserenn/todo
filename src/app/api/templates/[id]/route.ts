import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const template = await prisma.taskTemplate.findUnique({ where: { id } })
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (template.createdById !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const { name, description, subtasks = [], groupIds = [] } = await req.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: "Template adı gerekli" }, { status: 400 })
        }

        // Mevcut subtask'ları sil, yeniden oluştur
        await prisma.subtaskTemplate.deleteMany({ where: { templateId: id } })

        const updated = await prisma.taskTemplate.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                subtasks: {
                    create: subtasks
                        .filter((st: { title: string }) => st.title?.trim())
                        .map((st: { title: string; description?: string }, i: number) => ({
                            title: st.title.trim(),
                            description: st.description?.trim() || null,
                            sortOrder: i,
                        })),
                },
                groups: {
                    set: groupIds.map((id: string) => ({ id })),
                },
            },
            include: {
                subtasks: { orderBy: { sortOrder: "asc" } },
                createdBy: { select: { name: true } },
                groups: { select: { id: true, name: true, color: true } },
            },
        })

        return NextResponse.json({ template: updated })
    } catch (error) {
        console.error("Template update error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const template = await prisma.taskTemplate.findUnique({ where: { id } })
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (template.createdById !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.taskTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
