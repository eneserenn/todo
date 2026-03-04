import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"
import { startOfWeek, endOfDay, startOfDay, isSameDay, subDays } from "date-fns"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { dateStr } = await req.json()
        const targetDate = dateStr ? new Date(dateStr) : new Date()

        // Start from most recent Monday. If today IS Monday, go back one full week.
        let weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
        if (isSameDay(weekStart, targetDate)) {
            weekStart = subDays(weekStart, 7)
        }

        const rangeFilter = {
            gte: startOfDay(weekStart),
            lte: endOfDay(targetDate),
        }

        // Fetch all employees under this manager with their completed weekly tasks
        const employees = await prisma.user.findMany({
            where: { managerId: session.user.id },
            include: {
                assignedTasks: {
                    where: {
                        date: rangeFilter,
                        isPoolTask: false,
                        isPersonalPool: false,
                        isCompleted: true,
                    },
                    include: {
                        subtasks: {
                            where: { isCompleted: true },
                            orderBy: { createdAt: "asc" },
                        }
                    },
                    orderBy: { date: "asc" },
                }
            }
        })

        // Also fetch manager's own completed tasks for the week
        const managerTasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                date: rangeFilter,
                isPoolTask: false,
                isPersonalPool: false,
                isCompleted: true,
            },
            include: {
                subtasks: {
                    where: { isCompleted: true },
                    orderBy: { createdAt: "asc" },
                }
            },
            orderBy: { date: "asc" },
        })

        const totalTasks = managerTasks.length + employees.reduce((s, e) => s + e.assignedTasks.length, 0)
        if (totalTasks === 0) {
            return NextResponse.json({ summary: "Bu haftada tamamlanmış görev bulunmuyor." })
        }

        const weekLabel = `${weekStart.toLocaleDateString("tr-TR")} – ${targetDate.toLocaleDateString("tr-TR")}`

        let reportText = `Manager: ${session.user.name}\nTamamlanan Görevler:`
        if (managerTasks.length === 0) {
            reportText += " Bu haftada tamamlanan görev yok."
        } else {
            managerTasks.forEach(t => {
                reportText += `\n - ✓ ${t.title} (${new Date(t.date).toLocaleDateString("tr-TR")})`
                t.subtasks.forEach((st: any) => {
                    reportText += `\n    - ✓ ${st.title}`
                })
            })
        }
        reportText += "\n"

        for (const emp of employees) {
            reportText += `\nÇalışan: ${emp.name}\nTamamlanan Görevler:`
            if (emp.assignedTasks.length === 0) {
                reportText += " Bu haftada tamamlanan görev yok."
            } else {
                emp.assignedTasks.forEach((t: any) => {
                    reportText += `\n - ✓ ${t.title} (${new Date(t.date).toLocaleDateString("tr-TR")})`
                    t.subtasks.forEach((st: any) => {
                        reportText += `\n    - ✓ ${st.title}`
                    })
                })
            }
            reportText += "\n"
        }

        let systemPrompt = "Sen bir yönetim asistanısın. Verilen haftalık görev raporunu TÜRKÇE olarak özetle. Çalışan bazında grupla, tamamlananları ve devam edenleri belirt, haftanın genel üretkenliğine dair değerlendirme yap. Yanıtını MUTLAKA Türkçe ver."

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: "weekly_summary" } })
        if (dbPrompt) systemPrompt = dbPrompt.content

        const { client, model } = await getAiClient()
        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `${weekLabel} haftasına ait ekip raporu:\n\n${reportText}\n\nLütfen Türkçe olarak haftalık üretkenlik özeti oluştur.`
                }
            ],
        })

        return NextResponse.json({ summary: response.choices[0].message.content })
    } catch (error) {
        console.error("AI Weekly Summary Error:", error)
        return NextResponse.json({ error: "Failed to generate weekly summary" }, { status: 500 })
    }
}
