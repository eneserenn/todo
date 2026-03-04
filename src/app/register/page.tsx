import prisma from "@/lib/prisma"
import RegisterForm from "./RegisterForm"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
    const session = await getServerSession(authOptions)

    if (session) {
        redirect("/dashboard")
    }

    // Fetch all managers so employees can select them during registration
    const managers = await prisma.user.findMany({
        where: { role: "MANAGER" },
        select: { id: true, name: true }
    })

    return <RegisterForm managers={managers} />
}
