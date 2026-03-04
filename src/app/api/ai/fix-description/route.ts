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
        if (!task.description) return NextResponse.json({ error: "Task has no description" }, { status: 400 })

        const { client, model } = await getAiClient()
        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "Sen bir yazma asistanısın. Verilen görev açıklamasını daha anlaşılır, özlü ve uygulanabilir hale getir. SADECE düzeltilmiş açıklama metnini döndür, başka hiçbir şey ekleme. Yanıtı MUTLAKA Türkçe yaz."
                },
                {
                    role: "user",
                    content: `Görev başlığı: ${task.title}\nDüzeltilecek açıklama: ${task.description}`
                }
            ],
        })

        const fixedDescription = response.choices[0].message.content?.trim() || task.description

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: { description: fixedDescription },
        })

        return NextResponse.json({ description: updated.description })
    } catch (error) {
        console.error("AI Fix Description Error:", error)
        return NextResponse.json({ error: "AI fix failed" }, { status: 500 })
    }
}
