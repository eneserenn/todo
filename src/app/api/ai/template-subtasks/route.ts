import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getAiClient } from "@/lib/ai"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { title, description } = await req.json()

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        let systemPrompt = "Sen yardımcı bir asistansın. Verilen görev şablonu için 2 ile 5 arasında uygulanabilir alt görev başlığı öner. MUTLAKA şu JSON formatında yanıt ver: {\"subtasks\": [\"Alt görev 1\", \"Alt görev 2\"]}. Her alt görev ayrı bir dizi elemanı olmalı, virgülle ayrılmış tek string OLMAMALI. Alt görevleri TÜRKÇE yaz."

        const dbPrompt = await prisma.aiPrompt.findUnique({ where: { name: "subtask_generation" } })
        if (dbPrompt) systemPrompt = dbPrompt.content

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Aşağıdaki görev şablonu için Türkçe alt görev başlıkları öner:\nBaşlık: ${title}\nAçıklama: ${description?.trim() || "Açıklama yok."}` }
            ],
        })

        const rawContent = response.choices[0].message.content || ""
        let suggestions: string[] = []

        try {
            const jsonStr = rawContent.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
            const parsed = JSON.parse(jsonStr)

            if (Array.isArray(parsed)) {
                suggestions = parsed
            } else if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
                suggestions = parsed.subtasks
            } else if (parsed.subtasks && typeof parsed.subtasks === "string") {
                suggestions = parsed.subtasks.split(/,\s*|\n/).map((s: string) => s.trim()).filter(Boolean)
            } else if (typeof parsed === "object") {
                const values: string[] = Object.values(parsed) as string[]
                suggestions = values.flatMap(v =>
                    typeof v === "string" ? v.split(/,\s*|\n/).map(s => s.trim()).filter(Boolean) : [String(v)]
                )
            }
        } catch {
            const lines = rawContent.split(/\n|,/).map(s => s.replace(/^[\d\.\-\*\s]+/, "").trim()).filter(s => s.length > 3)
            if (lines.length > 0) suggestions = lines
            else suggestions = ["Gereksinimleri analiz et", "Uygulamayı planla", "Görevi tamamla"]
        }

        return NextResponse.json({
            suggestions: suggestions.slice(0, 5).map(s => String(s).slice(0, 100))
        })
    } catch (error) {
        console.error("Template subtask suggestion error:", error)
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
    }
}
