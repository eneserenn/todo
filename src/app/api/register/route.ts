import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { name, email, password, role, managerId } = await req.json()

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Eksik bilgi girdiniz" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json({ error: "Bu email ile zaten kayıtlı bir kullanıcı var" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: role,
                managerId: role === "EMPLOYEE" ? managerId : null,
            }
        })

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    }
}
