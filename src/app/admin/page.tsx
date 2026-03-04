import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import AdminClient from "./AdminClient"

const DEFAULT_SETTINGS = [
    { key: "llm_endpoint", value: process.env.LOCAL_LLM_URL || "http://localhost:11434/v1", label: "LLM Endpoint URL", group: "ai" },
    { key: "llm_model", value: "llama3", label: "Model Adı", group: "ai" },
    { key: "llm_api_key", value: "", label: "API Key", group: "ai" },
]

const DEFAULT_PROMPTS: Record<string, { label: string; content: string }> = {
    daily_summary: {
        label: "Günlük Özet Promptu",
        content: "Sen verimli bir asistansın. Kullanıcının günlük görevlerini kısaca Türkçe olarak özetle. Tamamlananları ve devam edenleri belirt. Motive edici veya profesyonel bir kapanış cümlesi ekle. Yanıtını MUTLAKA Türkçe ver.",
    },
    manager_summary: {
        label: "Yönetici Ekip Özeti Promptu",
        content: "Sen bir yönetim asistanısın. Ekibin günlük ilerlemesini TÜRKÇE olarak özetle. Özeti çalışan adına göre grupla, tamamlananları ve devam edenleri belirt, ekibin genel üretkenliğine dair kısa bir değerlendirme sun. Yanıtını MUTLAKA Türkçe ver.",
    },
    weekly_summary: {
        label: "Haftalık Özet Promptu",
        content: "Sen bir yönetim asistanısın. Verilen haftalık görev raporunu TÜRKÇE olarak özetle. Çalışan bazında grupla, tamamlananları ve devam edenleri belirt, haftanın genel üretkenliğine dair değerlendirme yap. Yanıtını MUTLAKA Türkçe ver.",
    },
    subtask_generation: {
        label: "Alt Görev Oluşturma Promptu",
        content: "Sen yardımcı bir asistansın. Verilen görev için 2 ile 4 arasında uygulanabilir alt görev üret. SADECE JSON formatında, string dizisi olarak yanıt ver. Alt görevleri TÜRKÇE yaz. Örnek: [\"Alt görev 1\", \"Alt görev 2\"]",
    },
    fix_description: {
        label: "Açıklama Düzeltme Promptu",
        content: "Sen bir yazma asistanısın. Verilen görev açıklamasını daha anlaşılır, özlü ve uygulanabilir hale getir. SADECE düzeltilmiş açıklama metnini döndür, başka hiçbir şey ekleme. Yanıtı MUTLAKA Türkçe yaz.",
    },
}

export default async function AdminPage() {
    const [dbSettings, dbPrompts, groups, allUsers] = await Promise.all([
        prisma.setting.findMany({ orderBy: { key: "asc" } }),
        prisma.aiPrompt.findMany({ orderBy: { name: "asc" } }),
        prisma.userGroup.findMany({
            include: {
                members: { select: { id: true, name: true, email: true, role: true } },
                managers: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: "asc" },
        }),
    ])

    const settings = DEFAULT_SETTINGS.map(def => {
        const found = dbSettings.find(s => s.key === def.key)
        return { key: def.key, label: def.label, group: def.group, value: found?.value ?? def.value }
    })

    const prompts = Object.entries(DEFAULT_PROMPTS).map(([name, def]) => {
        const found = dbPrompts.find(p => p.name === name)
        return { name, label: def.label, content: found?.content ?? def.content, isCustomized: !!found }
    })

    return <AdminClient settings={settings} prompts={prompts} groups={JSON.parse(JSON.stringify(groups))} allUsers={JSON.parse(JSON.stringify(allUsers))} />
}
