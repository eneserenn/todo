import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { taskId } = await req.json()

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

        let systemPrompt = "Sen yardımcı bir asistansın. Verilen görev için 2 ile 4 arasında uygulanabilir alt görev üret. MUTLAKA şu JSON formatında yanıt ver: {\"subtasks\": [\"Alt görev 1\", \"Alt görev 2\"]}. Her alt görev ayrı bir dizi elemanı olmalı, virgülle ayrılmış tek string OLMAMALI. Alt görevleri TÜRKÇE yaz."

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: "subtask_generation" } })
        if (dbPrompt) systemPrompt = dbPrompt.content

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Aşağıdaki görev için Türkçe alt görevler oluştur:\nBaşlık: ${task.title}\nAçıklama: ${task.description || "Açıklama yok."}` }
            ],
        })

        const rawContent = response.choices[0].message.content || ""
        let generatedSubtasks: string[] = []

        try {
            const jsonStr = rawContent.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
            const parsed = JSON.parse(jsonStr)

            if (Array.isArray(parsed)) {
                generatedSubtasks = parsed
            } else if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
                generatedSubtasks = parsed.subtasks
            } else if (parsed.subtasks && typeof parsed.subtasks === "string") {
                generatedSubtasks = parsed.subtasks.split(/,\s*|\n/).map((s: string) => s.trim()).filter(Boolean)
            } else if (typeof parsed === "object") {
                const values: string[] = Object.values(parsed) as string[]
                generatedSubtasks = values.flatMap(v =>
                    typeof v === "string" ? v.split(/,\s*|\n/).map(s => s.trim()).filter(Boolean) : [String(v)]
                )
            }
        } catch (e) {
            console.error("Failed to parse JSON from AI", rawContent)
            const lines = rawContent.split(/\n|,/).map(s => s.replace(/^[\d\.\-\*\s]+/, "").trim()).filter(s => s.length > 3)
            if (lines.length > 0) generatedSubtasks = lines
            else generatedSubtasks = ["Gereksinimleri analiz et", "Uygulamayı planla", "Görevi tamamla"]
        }

        const createdSubtasks = await Promise.all(
            generatedSubtasks.slice(0, 5).map(title =>
                prisma.subtask.create({
                    data: { title: String(title).slice(0, 100), taskId }
                })
            )
        )

        return NextResponse.json({ subtasks: createdSubtasks })
    } catch (error) {
        console.error("AI Generation Error:", error)
        return NextResponse.json({ error: "AI Generation failed" }, { status: 500 })
    }
}
