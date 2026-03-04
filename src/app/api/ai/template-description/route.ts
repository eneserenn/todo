import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAiClient } from "@/lib/ai"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { title, description } = await req.json()

        if (!title?.trim() || !description?.trim()) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
        }

        const { client, model } = await getAiClient()

        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "Sen bir yazma asistanısın. Verilen görev şablonu açıklamasını daha net, kısa ve uygulanabilir hale getir. Sadece düzeltilmiş metni döndür, başka hiçbir şey yazma. Türkçe yaz."
                },
                {
                    role: "user",
                    content: `Şablon başlığı: ${title}\nDüzeltilecek açıklama: ${description}`
                }
            ],
        })

        const improved = response.choices[0].message.content?.trim() || description
        return NextResponse.json({ description: improved })
    } catch (error) {
        console.error("Template description fix error:", error)
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
    }
}
