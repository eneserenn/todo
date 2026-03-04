import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardHeader from "@/app/dashboard/Header"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)

    if (!session?.user) redirect("/login")
    if (session.user.role !== "ADMIN") redirect("/dashboard")

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <DashboardHeader user={session.user} />
            <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    )
}
