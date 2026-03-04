import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"
import { startOfDay, endOfDay } from "date-fns"

// POST /api/ai/suggest — AI morning suggestion
export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const todayStart = startOfDay(new Date())
        const todayEnd = endOfDay(new Date())

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                OR: [
                    { date: { gte: todayStart, lte: todayEnd } },
                    { date: { lt: todayStart }, isCompleted: false },
                ],
            },
            include: { subtasks: true },
            orderBy: [{ priority: "desc" }, { isCompleted: "asc" }],
        })

        if (tasks.length === 0) {
            return NextResponse.json({ suggestion: "Bugün için planlanmış görev yok. Yeni görevler ekleyerek güne başlayabilirsin! 🚀" })
        }

        const taskText = tasks.map(t =>
            `- [${t.isCompleted ? "✓" : " "}] ${t.title} (Öncelik: ${t.priority})${t.description ? ` — ${t.description}` : ""}`
        ).join("\n")

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "Sen kısa ve motive edici bir iş asistanısın. Kullanıcının bugünkü görevlerine bakarak 2-3 cümlelik bir sabah önerisi yap. Önceliklere göre hangi göreve önce odaklanması gerektiğini söyle. Samimi, enerjik ve kısa ol. TÜRKÇE yanıt ver."
                },
                {
                    role: "user",
                    content: `Bugünkü görevlerim:\n${taskText}\n\nBugün neye odaklanmalıyım?`
                }
            ],
        })

        return NextResponse.json({ suggestion: response.choices[0].message.content })
    } catch (error) {
        console.error("AI Suggest Error:", error)
        return NextResponse.json({ suggestion: "Bugün için görevlerine göz at ve en öncelikli olandan başla! 💪" })
    }
}
