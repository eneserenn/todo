import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { messages } = await req.json()

        // Fetch user's today tasks for context
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
            orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
        })

        const taskContext = tasks.length > 0
            ? tasks.map((t: any) =>
                `- [${t.isCompleted ? "✓" : " "}] ${t.title}${t.description ? ` — ${t.description}` : ""}` +
                (t.subtasks?.length > 0
                    ? "\n" + t.subtasks.map((s: any) => `    [${s.isCompleted ? "✓" : " "}] ${s.title}`).join("\n")
                    : "")
            ).join("\n")
            : "Bugün için görev bulunmuyor."

        // Get customizable system prompt from DB (or use default)
        let systemPrompt = `Sen yardımcı ve samimi bir iş asistanısın. Kullanıcının görevlerini yönetmesine, planlamasına ve üretkenliğini artırmasına yardımcı oluyorsun. Kısa, net ve aksiyona yönelik cevaplar ver. Türkçe cevap ver.

Kullanıcı Bilgileri:
- İsim: ${session.user.name}
- Rol: ${session.user.role === "MANAGER" ? "Yönetici" : "Çalışan"}

Bugünkü Görevleri:
${taskContext}

Görevlerle ilgili sorulara bu bağlamı kullanarak cevap ver. Yeni görev önerebilir, mevcut görevler hakkında yorum yapabilir, önceliklendirme önerebilirsin.`

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: "chat_assistant" } })
        if (dbPrompt) {
            systemPrompt = dbPrompt.content
                .replace("{{name}}", session.user.name || "")
                .replace("{{role}}", session.user.role === "MANAGER" ? "Yönetici" : "Çalışan")
                .replace("{{tasks}}", taskContext)
        }

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-10),
            ],
        })

        return NextResponse.json({
            message: response.choices[0].message.content,
        })
    } catch (error) {
        console.error("AI Chat Error:", error)
        return NextResponse.json({ error: "AI bağlantısı kurulamadı" }, { status: 500 })
    }
}
