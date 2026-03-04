import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

const DEFAULT_SETTINGS = [
    { key: "llm_endpoint", value: process.env.LOCAL_LLM_URL || "http://localhost:11434/v1", label: "LLM Endpoint URL", group: "ai" },
    { key: "llm_model", value: "llama3", label: "Model Adı", group: "ai" },
    { key: "llm_api_key", value: "", label: "API Key", group: "ai" },
]

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

export async function GET() {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } })

    // Return defaults merged with DB values so the UI always has something to show
    const merged = DEFAULT_SETTINGS.map(def => {
        const found = settings.find(s => s.key === def.key)
        return found ?? { ...def, id: null, createdAt: null, updatedAt: null }
    })

    return NextResponse.json({ settings: merged })
}

export async function PATCH(req: Request) {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { key, value } = await req.json()
    if (!key || value === undefined) return NextResponse.json({ error: "key and value required" }, { status: 400 })

    const def = DEFAULT_SETTINGS.find(d => d.key === key)

    const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: {
            key,
            value,
            label: def?.label ?? key,
            group: def?.group ?? "general",
        },
    })

    return NextResponse.json({ setting })
}
