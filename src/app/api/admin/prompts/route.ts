import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

const DEFAULT_PROMPTS: Record<string, string> = {
    daily_summary: "Sen verimli bir asistansın. Kullanıcının günlük görevlerini kısaca Türkçe olarak özetle. Tamamlananları ve devam edenleri belirt. Motive edici veya profesyonel bir kapanış cümlesi ekle. Yanıtını MUTLAKA Türkçe ver.",
    manager_summary: "Sen bir yönetim asistanısın. Ekibin günlük ilerlemesini TÜRKÇE olarak özetle. Özeti çalışan adına göre grupla, tamamlananları ve devam edenleri belirt, ekibin genel üretkenliğine dair kısa bir değerlendirme sun. Yanıtını MUTLAKA Türkçe ver.",
    weekly_summary: "Sen bir yönetim asistanısın. Verilen haftalık görev raporunu TÜRKÇE olarak özetle. Çalışan bazında grupla, tamamlananları ve devam edenleri belirt, haftanın genel üretkenliğine dair değerlendirme yap. Yanıtını MUTLAKA Türkçe ver.",
    subtask_generation: "Sen yardımcı bir asistansın. Verilen görev için 2 ile 4 arasında uygulanabilir alt görev üret. SADECE JSON formatında, string dizisi olarak yanıt ver. Alt görevleri TÜRKÇE yaz. Örnek: [\"Alt görev 1\", \"Alt görev 2\"]",
    fix_description: "Sen bir yazma asistanısın. Verilen görev açıklamasını daha anlaşılır, özlü ve uygulanabilir hale getir. SADECE düzeltilmiş açıklama metnini döndür, başka hiçbir şey ekleme. Yanıtı MUTLAKA Türkçe yaz.",
}

const PROMPT_LABELS: Record<string, string> = {
    daily_summary: "Günlük Özet Promptu",
    manager_summary: "Yönetici Ekip Özeti Promptu",
    weekly_summary: "Haftalık Özet Promptu",
    subtask_generation: "Alt Görev Oluşturma Promptu",
    fix_description: "Açıklama Düzeltme Promptu",
}

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

export async function GET() {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const dbPrompts = await prisma.aiPrompt.findMany({ orderBy: { name: "asc" } })

    const prompts = Object.keys(DEFAULT_PROMPTS).map(name => {
        const found = dbPrompts.find(p => p.name === name)
        return {
            name,
            label: PROMPT_LABELS[name] ?? name,
            content: found?.content ?? DEFAULT_PROMPTS[name],
            isCustomized: !!found,
        }
    })

    return NextResponse.json({ prompts })
}

export async function PATCH(req: Request) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { name, content } = await req.json()
    if (!name || !content) return NextResponse.json({ error: "name and content required" }, { status: 400 })

    const prompt = await prisma.aiPrompt.upsert({
        where: { name },
        update: { content },
        create: { name, content },
    })

    return NextResponse.json({ prompt })
}

export async function DELETE(req: Request) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

    await prisma.aiPrompt.deleteMany({ where: { name } })

    return NextResponse.json({ ok: true })
}
