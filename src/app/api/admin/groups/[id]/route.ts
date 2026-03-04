import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// PATCH /api/admin/groups/:id — update group, add/remove members/managers
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, description, color, addMemberId, removeMemberId, addManagerId, removeManagerId } = await req.json()

    try {
        // Handle member add/remove
        if (addMemberId) {
            await prisma.userGroup.update({
                where: { id },
                data: { members: { connect: { id: addMemberId } } },
            })
            return NextResponse.json({ success: true })
        }
        if (removeMemberId) {
            await prisma.userGroup.update({
                where: { id },
                data: { members: { disconnect: { id: removeMemberId } } },
            })
            return NextResponse.json({ success: true })
        }
        if (addManagerId) {
            await prisma.userGroup.update({
                where: { id },
                data: { managers: { connect: { id: addManagerId } } },
            })
            return NextResponse.json({ success: true })
        }
        if (removeManagerId) {
            await prisma.userGroup.update({
                where: { id },
                data: { managers: { disconnect: { id: removeManagerId } } },
            })
            return NextResponse.json({ success: true })
        }

        // Update name/color/description
        const group = await prisma.userGroup.update({
            where: { id },
            data: {
                ...(name ? { name: name.trim() } : {}),
                ...(description !== undefined ? { description: description?.trim() || null } : {}),
                ...(color ? { color } : {}),
            },
            include: {
                members: { select: { id: true, name: true, email: true, role: true } },
                managers: { select: { id: true, name: true, email: true, role: true } },
            },
        })
        return NextResponse.json({ group })
    } catch (error) {
        console.error("Group update error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// DELETE /api/admin/groups/:id
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.userGroup.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
