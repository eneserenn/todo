import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "MANAGER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { dateStr } = await req.json()
        const targetDate = dateStr ? new Date(dateStr) : new Date()

        const employees = await prisma.user.findMany({
            where: { managerId: session.user.id },
            include: {
                assignedTasks: {
                    where: { date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } }
                }
            }
        })

        if (employees.length === 0) {
            return NextResponse.json({ summary: "Bağlı çalışan bulunmuyor veya bugün görev yok." })
        }

        let reportText = ""
        for (const emp of employees) {
            reportText += `\nÇalışan: ${emp.name}\nGörevler:`
            if (emp.assignedTasks.length === 0) reportText += " Bugün görev yok."
            else {
                emp.assignedTasks.forEach((t: any) => {
                    reportText += `\n - [${t.isCompleted ? 'X' : ' '}] ${t.title}`
                })
            }
            reportText += "\n"
        }

        let systemPrompt = "Sen bir yönetim asistanısın. Ekibin günlük ilerlemesini TÜRKÇE olarak özetle. Özeti çalışan adına göre grupla, tamamlananları ve devam edenleri belirt, ekibin genel üretkenliğine dair kısa bir değerlendirme sun. Yanıtını MUTLAKA Türkçe ver."

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: 'manager_summary' } })
        if (dbPrompt) systemPrompt = dbPrompt.content

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `${targetDate.toLocaleDateString("tr-TR")} tarihine ait ekip raporu:\n${reportText}\n\nLütfen Türkçe olarak ekip üretkenlik özeti oluştur.`
                }
            ],
        })

        return NextResponse.json({ summary: response.choices[0].message.content })
    } catch (error) {
        console.error("AI Manager Summary Error:", error)
        return NextResponse.json({ error: "Failed to generate manager summary" }, { status: 500 })
    }
}
