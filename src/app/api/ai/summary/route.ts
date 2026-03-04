import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAiClient } from "@/lib/ai"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { dateStr } = await req.json()
        const targetDate = dateStr ? new Date(dateStr) : new Date()

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
            },
            include: { subtasks: true }
        })

        if (tasks.length === 0) {
            return NextResponse.json({ summary: "Bu gün için görev bulunmuyor." })
        }

        const taskText = tasks.map((t: any) =>
            `- [${t.isCompleted ? 'X' : ' '}] ${t.title}` +
            (t.subtasks.length > 0 ? `\n  Subtasks: ${t.subtasks.map((s: any) => `[${s.isCompleted ? 'X' : ' '}] ${s.title}`).join(", ")}` : "")
        ).join("\n")

        let systemPrompt = "Sen verimli bir asistansın. Kullanıcının günlük görevlerini kısaca Türkçe olarak özetle. Tamamlananları ve devam edenleri belirt. Motive edici veya profesyonel bir kapanış cümlesi ekle. Yanıtını MUTLAKA Türkçe ver."

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: 'daily_summary' } })
        if (dbPrompt) systemPrompt = dbPrompt.content

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `${targetDate.toLocaleDateString("tr-TR")} tarihindeki görevlerim:\n${taskText}\n\nLütfen günümü Türkçe olarak özetle.`
                }
            ],
        })

        return NextResponse.json({ summary: response.choices[0].message.content })
    } catch (error) {
        console.error("AI Summary Error:", error)
        return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
    }
}
